import { randomUUID } from "node:crypto";
import type { Change, Character, Fact, Place, WorldState } from "../shared/types.ts";

export const newId = (prefix: string) => `${prefix}${randomUUID().slice(0, 8)}`;

const text = (value: unknown, max = 2000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

// A newcomer's goals came back as "想要：…" six times in six (2026-10-19): the label is the model's, not the story's.
const goalsOf = (value: unknown) => text(value).replace(/^(想要|目标|goals?)\s*[:：]\s*/i, "");

export const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The listed place a name means. The model now and then dresses a listed name up in front or adds a corner in brackets
 * ("霍格沃茨·大礼堂" or "大礼堂（门口）" for "大礼堂", 2026-10-19): a name that ends in a whole listed one is that
 * place, the longest such. A name that goes on past it is another place ("霍格沃茨图书馆" is not "霍格沃茨"), and so
 * is a shorter one ("大礼堂" is not "大礼堂外的走廊"); an English name needs a mark before it ("Town Hall" is no "Hall").
 * A world's author often makes two places one ("三把扫帚与蜂蜜公爵"): either half names it too ("霍格莫德·蜂蜜公爵"),
 * and so does a listed name without what it is dressed up with ("三把扫帚" for "霍格莫德·三把扫帚").
 */
export function placeNamed(state: WorldState, name: string): Place | undefined {
  const bare = name.replace(/[（(][^）)]*[）)]/g, "").trim().toLowerCase();
  const dressed = (listed: string) => {
    const head = bare.slice(0, bare.length - listed.length);
    return (
      listed.length >= 2 &&
      bare.endsWith(listed) &&
      (head === "" || /[·・:：,，\-—]\s*$/.test(head) || (/[㐀-鿿]$/.test(head) && /^[㐀-鿿]/.test(listed)))
    );
  };
  // A half or a bare tail stands only alone or after a mark: "四楼走廊" is no "城堡·走廊" ("和" and "及" are too
  // common inside names to split on: "及时雨客栈").
  const marked = (n: string) => dressed(n) && /^$|[·・:：,，\-—]\s*$/.test(bare.slice(0, bare.length - n.length));
  const lower = (n: string) => n.trim().toLowerCase();
  const halves = (p: Place) =>
    p.name.split(/[与、]/).flatMap((n) => [n, n.split(/[·・]/).at(-1)!]).map(lower).filter((n) => n !== lower(p.name));
  // The whole name first, then the longest half.
  const best = (p: Place) =>
    dressed(lower(p.name)) ? 1000 + p.name.length : Math.max(0, ...halves(p).filter(marked).map((n) => n.length));
  return (
    state.places.find((p) => same(p.name, name)) ??
    state.places.filter((p) => best(p) > 0).sort((a, b) => best(b) - best(a))[0]
  );
}

/** Turns whatever the model returned into known change shapes, dropping the rest. */
export function parseChanges(raw: unknown): Change[] {
  if (!Array.isArray(raw)) return [];
  const changes: Change[] = [];
  for (const item of raw.slice(0, 40)) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    const note = text(v.note, 300);
    switch (v.type) {
      case "move":
        changes.push({ type: "move", character: text(v.character), place: text(v.place), note });
        break;
      case "place":
        changes.push({ type: "place", name: text(v.name), description: text(v.description), note });
        break;
      case "character":
        changes.push({
          type: "character",
          name: text(v.name),
          persona: text(v.persona),
          goals: goalsOf(v.goals),
          place: text(v.place),
          note,
        });
        break;
      case "leave":
        changes.push({ type: "leave", character: text(v.character), note });
        break;
      case "status":
        changes.push({ type: "status", character: text(v.character), notes: text(v.notes), note });
        break;
      case "persona":
        changes.push({
          type: "persona",
          character: text(v.character),
          persona: text(v.persona),
          goals: goalsOf(v.goals),
          note,
        });
        break;
      case "fact":
        changes.push({ type: "fact", text: text(v.text), note });
        break;
      case "reveal":
        changes.push({ type: "reveal", fact: text(v.fact), note });
        break;
      case "learn":
        changes.push({ type: "learn", character: text(v.character), fact: text(v.fact), note });
        break;
      case "relationship":
        changes.push({ type: "relationship", a: text(v.a), b: text(v.b), text: text(v.text), note });
        break;
      case "thread":
        changes.push({ type: "thread", title: text(v.title), note });
        break;
      case "resolve":
        changes.push({ type: "resolve", thread: text(v.thread), resolution: text(v.resolution), note });
        break;
      case "clock":
        changes.push({ type: "clock", text: text(v.text, 200), note });
        break;
    }
  }
  return changes;
}

/**
 * Applies changes to a copy of the state. A change that names something the world
 * does not have is skipped rather than failing the turn. Returns the changes applied.
 */
export function applyChanges(
  before: WorldState,
  changes: Change[],
): { state: WorldState; applied: Change[] } {
  const state: WorldState = structuredClone(before);
  const applied: Change[] = [];
  const character = (name: string) => state.characters.find((c) => same(c.name, name));
  const place = (name: string) => placeNamed(state, name);
  const placeOrNew = (name: string): Place | undefined => {
    if (!name) return undefined;
    const found = place(name);
    if (found) return found;
    const created = { id: newId("p"), name, description: "" };
    state.places.push(created);
    return created;
  };
  const fact = (id: string): Fact | undefined => state.facts.find((f) => f.id === id);
  // Only someone out of the story before this turn can come back in it: a turn that tells someone leaving often
  // moves them away too, in either order.
  const wasGone = (who: Character) => !!before.characters.find((c) => c.id === who.id)?.gone;

  for (const change of changes) {
    switch (change.type) {
      case "move": {
        const who = character(change.character);
        const where = placeOrNew(change.place);
        if (!who || !where) continue;
        who.placeId = where.id;
        // Someone who left the story and is somewhere in it again is back.
        if (wasGone(who)) delete who.gone;
        break;
      }
      case "place": {
        if (!change.name || place(change.name)) continue;
        state.places.push({ id: newId("p"), name: change.name, description: change.description });
        break;
      }
      case "character": {
        const known = change.name ? character(change.name) : undefined;
        if (known && wasGone(known)) {
          // Met again as if new: the one who left comes back, as they were.
          delete known.gone;
          known.placeId = placeOrNew(change.place)?.id ?? known.placeId;
          break;
        }
        if (!change.name || known) continue;
        const created: Character = {
          id: newId("c"),
          name: change.name,
          persona: change.persona,
          goals: change.goals,
          placeId: placeOrNew(change.place)?.id ?? null,
          notes: "",
          knows: [],
        };
        state.characters.push(created);
        break;
      }
      case "leave": {
        const who = character(change.character);
        if (!who || who.gone) continue;
        who.gone = change.note || "left";
        break;
      }
      case "status": {
        const who = character(change.character);
        if (!who) continue;
        who.notes = change.notes;
        break;
      }
      case "persona": {
        // A lasting change in who someone is or what they want: it becomes their persona, which is never trimmed.
        const who = character(change.character);
        if (!who || (!change.persona && !change.goals)) continue;
        if (change.persona) who.persona = change.persona;
        if (change.goals) who.goals = change.goals;
        break;
      }
      case "fact": {
        if (!change.text) continue;
        state.facts.push({
          id: newId("f"),
          text: change.text,
          secret: false,
          revealed: true,
          source: "story",
        });
        break;
      }
      case "reveal": {
        const secret = fact(change.fact);
        if (!secret?.secret || secret.revealed) continue;
        secret.revealed = true;
        if (change.note) secret.revealNote = change.note;
        break;
      }
      case "learn": {
        const who = character(change.character);
        if (!who || !fact(change.fact) || who.knows.includes(change.fact)) continue;
        who.knows.push(change.fact);
        break;
      }
      case "relationship": {
        const a = character(change.a);
        const b = character(change.b);
        if (!a || !b || a === b || !change.text) continue;
        const existing = state.relationships.find(
          (r) => (r.a === a.id && r.b === b.id) || (r.a === b.id && r.b === a.id),
        );
        if (existing) existing.text = change.text;
        else state.relationships.push({ a: a.id, b: b.id, text: change.text });
        break;
      }
      case "thread": {
        if (!change.title) continue;
        state.threads.push({ id: newId("t"), title: change.title, resolved: false, resolution: "" });
        break;
      }
      case "resolve": {
        const thread = state.threads.find((t) => t.id === change.thread);
        if (!thread || thread.resolved) continue;
        thread.resolved = true;
        thread.resolution = change.resolution;
        break;
      }
      case "clock": {
        if (!change.text) continue;
        state.clock = change.text;
        break;
      }
    }
    applied.push(change);
  }
  return { state, applied };
}

/**
 * The changes with the move a reply's "where" makes for `who`: none when the changes move them already, or they are
 * there.
 */
export function withWhere(state: WorldState, changes: Change[], who: string | null, where: unknown): Change[] {
  const place = text(where, 200);
  const one = who ? state.characters.find((c) => same(c.name, who)) : undefined;
  // "…" copied from the sample is no place.
  if (!one || !/[\p{L}\p{N}]/u.test(place) || changes.some((c) => c.type === "move" && same(c.character, one.name))) return changes;
  if (one.placeId && placeNamed(state, place)?.id === one.placeId) return changes;
  return [{ type: "move", character: one.name, place, note: "" }, ...changes];
}

/**
 * What the people away did while a turn was played, kept for those the turn itself left alone: someone its story
 * names or its changes touch came into the scene, and is as the story tells.
 */
export function stillAway(away: string[], story: string, changes: Change[]): (name: string) => boolean {
  const touched = (name: string) =>
    changes.some((c) => Object.values(c).some((v) => typeof v === "string" && same(v, name)));
  return (name) => away.some((a) => same(a, name)) && !mentions(story, name) && !touched(name);
}

/** The state a turn acted as `actor` starts from: someone out of the story whom the player plays is back in it. */
export function inPlay(state: WorldState, actor: string): WorldState {
  if (!state.characters.some((c) => c.id === actor && c.gone)) return state;
  const back = ({ gone: _, ...c }: Character) => c;
  return { ...state, characters: state.characters.map((c) => (c.id === actor ? back(c) : c)) };
}

/** The world as the model sees it, secrets included and marked. */
/**
 * Adds the secrets the AI buried. Each one is hidden from the player; the characters named as knowing it
 * know it, so they can act on it. Leaves out blanks and secrets already in the world.
 */
export function bury(before: WorldState, raw: unknown): { state: WorldState; buried: Fact[] } {
  const state = structuredClone(before);
  const buried: Fact[] = [];
  for (const item of Array.isArray(raw) ? raw.slice(0, 3) : []) {
    const v = (item ?? {}) as Record<string, unknown>;
    const secret = text(v.text, 600);
    if (!secret || state.facts.some((f) => same(f.text, secret))) continue;
    const fact: Fact = { id: newId("f"), text: secret, secret: true, revealed: false, source: "ai" };
    state.facts.push(fact);
    buried.push(fact);
    for (const name of Array.isArray(v.knownBy) ? v.knownBy : []) {
      const who = typeof name === "string" ? state.characters.find((c) => same(c.name, name)) : undefined;
      who?.knows.push(fact.id);
    }
  }
  return { state, buried };
}

/**
 * What the model stops reading when the turns up to the one whose state is `told` are trimmed: the facts and threads
 * the story added by then go (the timeline and the memory tell them now), and so do they from what each character
 * knows; those the world started with (`world`) stay. A
 * revealed secret stays for the discovery book but is no longer sent; a secret still hidden stays as it is. Dropping
 * them, not just hiding them, keeps every turn's state from growing with the whole story.
 */
export function trimState(state: WorldState, told: WorldState, world: WorldState): WorldState {
  // The world's own facts and opening questions are its backbone: they stay.
  const own = new Set([...world.facts, ...world.threads].map((x) => x.id));
  const old = new Set([...told.facts, ...told.threads].map((x) => x.id).filter((id) => !own.has(id)));
  const facts = state.facts
    .filter((f) => f.secret || !old.has(f.id))
    .map((f) => (f.secret && f.revealed && old.has(f.id) ? { ...f, archived: true } : f));
  const kept = new Set(facts.map((f) => f.id));
  return {
    ...state,
    facts,
    threads: state.threads.filter((t) => !old.has(t.id)),
    characters: state.characters.map((c) => ({ ...c, knows: c.knows.filter((id) => kept.has(id)) })),
  };
}

/** Secrets the AI buried in `from` that `into` lacks, carried over along with who knows them. */
export function carrySecrets(from: WorldState, into: WorldState): WorldState {
  const missing = from.facts.filter((f) => f.source === "ai" && !into.facts.some((x) => x.id === f.id));
  if (missing.length === 0) return into;
  const state = structuredClone(into);
  state.facts.push(...missing);
  for (const c of state.characters) {
    const knows = from.characters.find((x) => x.id === c.id)?.knows ?? [];
    c.knows.push(...knows.filter((id) => missing.some((f) => f.id === id)));
  }
  return state;
}

/**
 * Whether `text` names `name`, whole or by a part: "去八楼走廊" names the place "八楼走廊与巨怪挂毯", "斯拉格霍恩教授"
 * names "霍拉斯·斯拉格霍恩". A part is two Chinese characters or a whole English word of three letters or more: "of"
 * or "Lan" in "plan" is no name.
 */
export function mentions(text: string, name: string): boolean {
  const hit = (part: string) =>
    /[㐀-鿿]/.test(part)
      ? part.length >= 2 && text.includes(part)
      : part.length >= 3 && new RegExp(`\\b${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
  return hit(name) || name.split(/[与和及、·・，,/（）()\s]+/).some(hit);
}

/**
 * The places this turn plays in when `actor` acts: their own, and any place or person the player's action names (it
 * may go there or call them in). Null for the director or someone nowhere in particular: then everything is told.
 */
export function sceneOf(state: WorldState, actor: string, input = ""): string[] | null {
  const own = state.characters.find((c) => c.id === actor)?.placeId;
  if (!own) return null;
  const names = (name: string) => mentions(input, name);
  const named = [
    ...state.places.filter((p) => p.name && names(p.name)).map((p) => p.id),
    ...state.characters.filter((c) => c.name && c.placeId && !c.gone && names(c.name)).map((c) => c.placeId!),
  ];
  return [...new Set([own, ...named])];
}

const sentence = (text: string) => (/[。！？.!?…]$/.test(text) ? text : `${text}.`);

/** The first sentence of a persona or goals, for someone who is not in the scene ("Dr." is no sentence). */
function gist(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const first = flat.match(/^.{8,}?(?:[。！？]|[.!?](?= |$))/)?.[0] ?? flat;
  return first.length > 80 ? `${first.slice(0, 80)}…` : first;
}

/**
 * The world as the model reads it. With a `scene` (place ids), the people and the places there are told in full and
 * the rest in a line each, so a long story that has met many people and places does not crowd every turn: the
 * player's own design (2026-10-18), people left behind fade to a line and come back whole when met again.
 */
export function describeState(
  state: WorldState,
  { secrets = true, scene = null }: { secrets?: boolean; scene?: string[] | null } = {},
): string {
  const placeName = (id: string | null) =>
    state.places.find((p) => p.id === id)?.name ?? "somewhere unspecified";
  const charName = (id: string) => state.characters.find((c) => c.id === id)?.name ?? id;
  // Someone placed nowhere may well be here (a world's author often places only a few): they are told in full.
  const here = (placeId: string | null) => !scene || placeId === null || scene.includes(placeId);
  const cast = state.characters.filter((c) => !c.gone);
  const lines: string[] = [`Time: ${state.clock || "unspecified"}`, ""];
  if (scene) {
    lines.push("The scene:");
    for (const p of state.places.filter((p) => here(p.id))) lines.push(`- ${p.name}: ${p.description}`);
    const others = state.places.filter((p) => !here(p.id)).map((p) => p.name);
    if (others.length) lines.push(`Other places: ${others.join(", ")}.`);
  } else {
    lines.push("Places:");
    for (const p of state.places) lines.push(`- ${p.name}: ${p.description}`);
  }
  lines.push("", scene ? "Characters in the scene:" : "Characters:");
  for (const c of cast.filter((c) => here(c.placeId))) {
    lines.push(
      `- ${c.name} (at ${placeName(c.placeId)}). Persona: ${c.persona}. Goals: ${c.goals || "none stated"}.` +
        `${c.notes ? ` Now: ${c.notes}.` : ""} Knows: ${c.knows.join(", ") || "nothing listed"}.`,
    );
  }
  const away = cast.filter((c) => !here(c.placeId));
  if (away.length) {
    lines.push("", "Characters elsewhere (they can come in; then play them true to this):");
    for (const c of away) {
      lines.push(
        // Their goals stay: people offstage go on with their own plans.
        `- ${c.name} (at ${placeName(c.placeId)}). ${gist(c.persona)}${c.goals ? ` Goals: ${sentence(gist(c.goals))}` : ""}` +
          `${c.notes ? ` Now: ${c.notes}.` : ""} Knows: ${c.knows.join(", ") || "nothing listed"}.`,
      );
    }
  }
  const gone = state.characters.filter((c) => c.gone);
  if (gone.length) {
    // Kept in a line, so the story neither forgets them nor brings them back without a reason.
    lines.push("", "Out of the story (back only if the story brings them back):");
    for (const c of gone) lines.push(`- ${c.name}: ${c.gone}`);
  }
  lines.push("", "Facts the player knows:");
  for (const f of state.facts.filter((f) => (!f.secret || f.revealed) && !f.archived))
    lines.push(`- [${f.id}] ${f.text}`);
  if (secrets) {
    lines.push("", "Secrets the player has NOT discovered (true in the world):");
    for (const f of state.facts.filter((f) => f.secret && !f.revealed)) lines.push(`- [${f.id}] ${f.text}`);
  }
  lines.push("", "Open threads:");
  for (const t of state.threads.filter((t) => !t.resolved && !t.archived)) lines.push(`- [${t.id}] ${t.title}`);
  lines.push("", "Relationships:");
  for (const r of state.relationships) lines.push(`- ${charName(r.a)} / ${charName(r.b)}: ${r.text}`);
  return lines.join("\n");
}
