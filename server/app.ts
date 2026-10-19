import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  defaultSettings,
  type Change,
  type Character,
  type Fact,
  type MemoryNote,
  type Place,
  type Save,
  type SaveView,
  type Settings,
  type Thread,
  type TimelineEntry,
  type TurnNode,
  type World,
  type WorldDraft,
  type Dice,
} from "../shared/types.ts";
import type { Store } from "./db.ts";
import { parseJsonObject, readString, type Model } from "./model.ts";
import {
  BURY_EVERY,
  CHRONICLE_TURNS,
  MAX_HIDDEN,
  MAX_NOTES,
  MERGE_ENTRIES,
  TIMELINE_TOKENS,
  buryMessages,
  changeMessages,
  draftMessages,
  draftPrompt,
  fullWidth,
  hookMessages,
  chronicleMessages,
  chronicleOf,
  foldMessages,
  mergeMessages,
  MEANWHILE_TURNS,
  meanwhileMessages,
  narrationMessages,
  interviewMessages,
  placedOne,
  recapMessages,
  riskMessages,
  viewMessages,
  storyFrom,
  timeJump,
  tokensOf,
  type PlainDraft,
} from "./prompts.ts";
import {
  applyChanges,
  bury,
  carrySecrets,
  inPlay,
  mentions,
  newId,
  outcomeOf,
  parseChanges,
  placeNamed,
  same,
  sceneOf,
  stillAway,
  trimState,
  withWhere,
} from "./state.ts";

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const now = () => new Date().toISOString();
const str = (value: unknown, max = 4000) => (typeof value === "string" ? value.slice(0, max) : "");
const list = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
const keepId = (value: unknown, prefix: string) =>
  typeof value === "string" && /^[\w-]{1,64}$/.test(value) ? value : newId(prefix);

/** Coerces a draft from the browser into a well-formed one. */
export function normalizeDraft(raw: unknown): WorldDraft {
  const v = (raw ?? {}) as Record<string, unknown>;
  const s = (v.state ?? {}) as Record<string, unknown>;
  const places: Place[] = list(s.places).map((p) => ({
    id: keepId(p.id, "p"),
    name: str(p.name, 200),
    description: str(p.description),
  }));
  const facts: Fact[] = list(s.facts).map((f) => ({
    id: keepId(f.id, "f"),
    text: str(f.text),
    secret: f.secret === true,
    revealed: f.revealed === true,
    source: f.source === "ai" || f.source === "story" ? f.source : "author",
  }));
  const characters: Character[] = list(s.characters).map((c) => ({
    id: keepId(c.id, "c"),
    name: str(c.name, 200),
    persona: str(c.persona),
    goals: str(c.goals),
    placeId: places.some((p) => p.id === c.placeId) ? (c.placeId as string) : null,
    notes: str(c.notes),
    knows: Array.isArray(c.knows) ? c.knows.filter((id) => facts.some((f) => f.id === id)) : [],
  }));
  const threads: Thread[] = list(s.threads).map((t) => ({
    id: keepId(t.id, "t"),
    title: str(t.title, 500),
    resolved: t.resolved === true,
    resolution: str(t.resolution),
  }));
  const ids = new Set(characters.map((c) => c.id));
  return {
    title: str(v.title, 200).trim() || "Untitled world",
    premise: str(v.premise),
    // The model now and then writes the rules as a list.
    rules: str(rulesText(v.rules), 20_000),
    opening: str(v.opening),
    state: {
      clock: str(s.clock, 200),
      places,
      characters,
      facts,
      threads,
      relationships: list(s.relationships)
        .map((r) => ({ a: str(r.a, 64), b: str(r.b, 64), text: str(r.text, 500) }))
        .filter((r) => ids.has(r.a) && ids.has(r.b)),
    },
  };
}

/** A draft the AI wrote, names in place of ids, made into a world draft. */
export function fromPlain(raw: unknown): WorldDraft {
  const v = (raw ?? {}) as Record<string, unknown>;
  const texts = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
  const places = list(v.places)
    .map((p) => ({ id: newId("p"), name: str(p.name, 200).trim(), description: str(p.description) }))
    .filter((p) => p.name);
  const characters = list(v.characters)
    .map((c) => ({
      id: newId("c"),
      name: str(c.name, 200).trim(),
      persona: str(c.persona),
      goals: str(c.goals),
      placeId: places.find((p) => p.name === str(c.place, 200).trim())?.id ?? null,
    }))
    .filter((c) => c.name);
  const charId = (name: unknown) => characters.find((c) => c.name === str(name, 200).trim())?.id ?? "";
  return normalizeDraft({
    title: v.title,
    premise: v.premise,
    rules: v.rules,
    opening: v.opening,
    state: {
      clock: v.clock,
      places,
      characters,
      facts: texts(v.facts).map((text) => ({ text })),
      threads: texts(v.threads).map((title) => ({ title })),
      relationships: list(v.relationships).map((r) => ({ a: charId(r.a), b: charId(r.b), text: r.text })),
    },
  });
}

/** A world draft in the AI's own terms, for asking it to change the draft. Secrets stay out. */
function toPlain(d: WorldDraft): PlainDraft {
  const placeName = (id: string | null) => d.state.places.find((p) => p.id === id)?.name ?? "";
  const charName = (id: string) => d.state.characters.find((c) => c.id === id)?.name ?? "";
  return {
    title: d.title,
    premise: d.premise,
    rules: d.rules,
    opening: d.opening,
    clock: d.state.clock,
    places: d.state.places.map(({ name, description }) => ({ name, description })),
    characters: d.state.characters.map((c) => ({ name: c.name, persona: c.persona, goals: c.goals, place: placeName(c.placeId) })),
    facts: d.state.facts.filter((f) => !f.secret).map((f) => f.text),
    threads: d.state.threads.map((t) => t.title),
    relationships: d.state.relationships.map((r) => ({ a: charName(r.a), b: charName(r.b), text: r.text })),
  };
}

function normalizeSettings(raw: unknown, current: Settings): Settings {
  const v = (raw ?? {}) as Record<string, unknown>;
  const pick = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
    options.includes(value as T) ? (value as T) : fallback;
  return {
    person: pick(v.person, ["third", "second"], current.person),
    pace: pick(v.pace, ["calm", "medium", "intense"], current.pace),
    length: pick(v.length, ["auto", "short", "long"], current.length),
    style: pick(v.style, ["plain", "literary"], current.style ?? "plain"),
    showSecrets: typeof v.showSecrets === "boolean" ? v.showSecrets : current.showSecrets,
    thinking: typeof v.thinking === "boolean" ? v.thinking : (current.thinking ?? false),
    meanwhile: typeof v.meanwhile === "boolean" ? v.meanwhile : (current.meanwhile ?? true),
    dice: typeof v.dice === "boolean" ? v.dice : (current.dice ?? false),
  };
}

/** The JSON object in a reply pasted from another AI, which may have prose with braces before it. */
function firstJsonObject(text: string): unknown {
  const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(text)?.[1];
  for (const candidate of [text, fence ?? ""]) {
    try {
      return parseJsonObject(candidate);
    } catch {
      // try the next
    }
  }
  // The first twenty braces are enough for any prose before a world; each try reads the rest of a long text.
  for (let at = text.indexOf("{", 1), tries = 0; at > 0 && tries < 20; at = text.indexOf("{", at + 1), tries++) {
    try {
      return parseJsonObject(text.slice(at));
    } catch {
      // try the next
    }
  }
  throw new Error("No JSON object");
}

/** Rules the model wrote as a list or as an object, kept as plain lines. */
function rulesText(raw: unknown): unknown {
  const line = (x: unknown) => (typeof x === "string" ? x : JSON.stringify(x));
  if (Array.isArray(raw)) return raw.filter((r) => r != null && r !== "").map(line).join("\n");
  if (raw && typeof raw === "object") return Object.entries(raw).map(([k, v]) => `${k}: ${line(v)}`).join("\n");
  return raw;
}

/**
 * Memory notes, each dated "[Turn 12]". The model also wrote "[Turn 8-11]", "[Turn 1/8]" and dates at the end of
 * a note; those count by their last turn.
 */
function parseNotes(raw: unknown, last: number): MemoryNote[] {
  return (Array.isArray(raw) ? raw : [])
    .map((note) => {
      const text = str(note, 700);
      const date = /\[Turns? ([\d\s,/、–-]+)\]/.exec(text);
      const turn = date ? Math.max(0, ...date[1]!.split(/\D+/).filter(Boolean).map(Number)) : 0;
      return { turn: Math.min(turn, last), text: (date ? text.replace(date[0], "") : text).trim() };
    })
    .filter((n) => n.text)
    .sort((a, b) => a.turn - b.turn);
}

const parseHooks = (raw: unknown) =>
  Array.isArray(raw)
    ? raw
        .filter((h): h is string => typeof h === "string" && h.trim() !== "")
        .slice(0, 3)
        .map((h) => fullWidth(h.trim().slice(0, 300)))
    : [];

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  let body = "";
  req.setEncoding("utf8"); // keeps a character split across chunks whole
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new HttpError(413, "Request too large");
  }
  try {
    const value: unknown = body ? JSON.parse(body) : {};
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

function send(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

/**
 * `model` streams the story and keeps the records. `thinker` streams the story for saves with thinking on and
 * writes the timeline and the memory; `writer` drafts worlds, where speed matters more than care. Every
 * `chronicleTurns` turns the timeline gets an entry and the memory is checked. When what the model would read passes
 * `trimAt` tokens (64K), the turns the timeline already tells are no longer sent, but for the newest `keepTurns`.
 * Measured (2026-10-18): first words / whole turn 4.7 / 11 s at 40K, 5-7 / 13-14 s at 74K, 10-12 / 20 s at 130K.
 */
export function createApi(
  store: Store,
  model: Model,
  {
    thinker = model,
    writer = model,
    trimAt = 64_000,
    keepTurns = 30,
    keepStates = 10,
    chronicleTurns = CHRONICLE_TURNS,
    timelineTokens = TIMELINE_TOKENS,
  } = {},
) {
  const busy = new Set<string>();
  // Saves whose secrets are being buried. Burying takes the model a minute or more, so nobody waits for it.
  const burying = new Set<string>();
  // Saves whose timeline and memory are being written, likewise, and when it last failed.
  const chronicling = new Set<string>();
  const chronicleFailed = new Map<string, number>();

  function buryLater(saveId: string) {
    if (burying.has(saveId)) return;
    burying.add(saveId);
    void (async () => {
      const s = store.save(saveId);
      const w = s && store.world(s.worldId);
      if (!s || !w) return;
      const origin = s.headId;
      const ask = () => model.json(buryMessages(w, store.path(origin)));
      const report = (await ask().catch(ask)) as Record<string, unknown>;
      // The secrets go into the turn they were written for and every turn grown from it since, whatever the
      // player undid or branched meanwhile. A turn still being written carries them over when it is saved.
      const node = store.node(origin);
      if (!node?.state) return;
      const { state, buried } = bury(node.state, report.secrets);
      if (buried.length === 0) return;
      store.putNode({ ...node, state });
      const tree = store.tree(node.worldId);
      for (let i = 0, grown = [origin]; i < grown.length; i++) {
        for (const child of tree.filter((n) => n.parentId === grown[i])) {
          const later = store.node(child.id)!;
          if (later.state) store.putNode({ ...later, state: carrySecrets(state, later.state) });
          grown.push(child.id);
        }
      }
      console.log(`secrets.buried ${buried.length}`);
    })()
      .catch((error) => console.warn("bury.failed", error instanceof Error ? error.message : error))
      .finally(() => burying.delete(saveId));
  }

  const world = (id: string) => store.world(id) ?? fail(404, "World not found");
  const save = (id: string) => store.save(id) ?? fail(404, "Save not found");
  function fail(status: number, message: string): never {
    throw new HttpError(status, message);
  }
  /** What the browser shows: see `SaveView` for what is left out. */
  function view(s: Save): SaveView {
    const path = store.path(s.headId);
    const latest = path.findLastIndex((n) => Array.isArray(n.timeline));
    return {
      save: s,
      world: world(s.worldId),
      path: path.map((node, i) => (i === latest ? { ...node, memory: node.memory, timeline: node.timeline } : node)),
      tree: store.tree(s.worldId),
    };
  }

  /**
   * Lets the turns of a world go of whole states no longer needed. Kept: the opening, the last turn of each timeline
   * step (a point to go back to, and what a trim reads), the newest `keepStates` turns of every save, and the last
   * turn of a path left by an undo (where "other paths" lands). Saves from before 2026-10-18 kept every state; they
   * shrink on their next turn.
   */
  function forgetOldStates(worldId: string) {
    const tree = store.tree(worldId);
    const parent = new Map(tree.map((n) => [n.id, n.parentId]));
    const depths = new Map<string, number>();
    const depth = (id: string) => {
      const chain: string[] = [];
      let at: string | null | undefined = id;
      while (at && !depths.has(at)) {
        chain.push(at);
        at = parent.get(at);
      }
      let d = at ? depths.get(at)! : -1;
      for (const up of chain.reverse()) depths.set(up, ++d);
      return depths.get(id)!;
    };
    const leaves = new Set(tree.map((n) => n.id));
    for (const n of tree) if (n.parentId) leaves.delete(n.parentId);
    const kept = new Set(store.saves(worldId).flatMap((s) => store.path(s.headId).slice(-keepStates).map((n) => n.id)));
    const forget = tree.filter((n) => {
      if (!n.resumable || !n.parentId || kept.has(n.id) || leaves.has(n.id)) return false;
      return depth(n.id) % chronicleTurns !== chronicleTurns - 1;
    });
    store.forgetStates(forget.map((n) => n.id));
  }

  function startSave(w: World, title: string): Save {
    const root: TurnNode = {
      id: randomUUID(),
      worldId: w.id,
      parentId: null,
      actor: "director",
      input: "",
      story: w.opening,
      changes: [],
      hooks: [],
      state: structuredClone(w.state),
      createdAt: now(),
    };
    store.putNode(root);
    const s: Save = {
      id: randomUUID(),
      worldId: w.id,
      title: title || w.title,
      headId: root.id,
      settings: { ...defaultSettings },
      createdAt: now(),
      updatedAt: now(),
    };
    store.putSave(s);
    buryLater(s.id);
    return s;
  }

  /** Reads what a passage changed. Two tries; the story stands even if both fail. */
  async function record(w: World, before: TurnNode["state"], story: string, actor: string, who: string | null) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const report = (await model.json(changeMessages(w, before, story, actor, who))) as Record<string, unknown>;
        const changes = withWhere(before, parseChanges(report.changes), who, report.where);
        return { changes, hooks: parseHooks(report.hooks), failed: false };
      } catch (error) {
        console.warn("changes.failed", error instanceof Error ? error.message : error);
      }
    }
    return { changes: [] as Change[], hooks: [] as string[], failed: true };
  }

  /**
   * Asks the thinking model `tries` times (the provider's output check stops one reply in three or so, at random),
   * then once without thinking: a memory written without thinking dropped where the jade ring was hidden (2026-10-18).
   */
  async function carefully<T>(ask: (by: Model) => Promise<T>, tries = 2): Promise<T> {
    for (let i = 0; i < tries; i++) {
      try {
        return await ask(thinker);
      } catch (error) {
        console.warn("chronicle.retry", error instanceof Error ? error.message : error);
      }
    }
    return ask(writer);
  }

  async function streamJson(by: Model, messages: ReturnType<typeof mergeMessages>) {
    let reply = "";
    for await (const piece of by.stream(messages, { json: true })) reply += piece;
    try {
      return parseJsonObject(reply) as Record<string, unknown>;
    } catch (error) {
      console.warn("chronicle.reply", reply.length, JSON.stringify(reply.slice(0, 120)));
      throw error;
    }
  }

  /**
   * Writes the timeline entry and the memory for the `chronicleTurns` turns after what `path` has chronicled, and
   * merges the oldest entries while the timeline is too long.
   */
  async function chronicleStep(w: World, path: TurnNode[]) {
    const { notes: before, timeline: earlier, at } = chronicleOf(path);
    const end = at + chronicleTurns;
    let { text, notes } = await carefully(async (by) => {
      const report = await streamJson(by, chronicleMessages(w, path, chronicleTurns));
      const text = str(report.timeline, 2000).trim();
      const notes = parseNotes(report.memory, end);
      if (!text) throw new Error("The timeline entry came back empty");
      // The memory may shrink when old notes are folded together, but a reply that lost most of it is broken.
      if (notes.length < before.length / 4) throw new Error(`The memory came back with ${notes.length} notes`);
      return { text, notes };
    });
    // Told "at most 20" and "ten turns add at most four", the model still wrote 14-17 notes for the first ten turns
    // (2026-10-18/19), half of them retelling the timeline: a list that grew by more than four (eight at the start)
    // is folded.
    const keep = Math.min(MAX_NOTES, Math.max(8, before.length + 4));
    if (notes.length > keep) {
      const folded = await carefully(async (by) =>
        parseNotes((await streamJson(by, foldMessages(w, notes, keep))).memory, end),
      ).catch(() => []);
      notes = (folded.length ? folded : notes).slice(-MAX_NOTES);
    }
    let timeline = [...earlier, { from: at + 1, to: end, text }];
    // Merged five of the same span at a time, like carrying digits, so an entry is retold only once per level: merging
    // the oldest five every time retold the first entry at every merge.
    while (tokensOf(timeline.map((e) => e.text).join("")) > timelineTokens) {
      const span = (e: TimelineEntry) => e.to - e.from;
      const start = timeline.findIndex(
        (e, i) => i + MERGE_ENTRIES <= timeline.length && timeline.slice(i, i + MERGE_ENTRIES).every((x) => span(x) === span(e)),
      );
      if (start < 0) break;
      const run = timeline.slice(start, start + MERGE_ENTRIES);
      const merged = await carefully(async (by) => {
        const text = str((await streamJson(by, mergeMessages(w, run))).text, 2000).trim();
        if (!text) throw new Error("The merged entry came back empty");
        return text;
      });
      timeline.splice(start, MERGE_ENTRIES, { from: run[0]!.from, to: run.at(-1)!.to, text: merged });
    }
    return { notes, timeline };
  }

  /**
   * Catches the timeline and the memory up with the save while the player plays on, a few turns at a time (an old
   * save may be far behind). Each step is written on the last turn it covers; later turns find it by walking back
   * along their path.
   */
  function chronicleLater(saveId: string) {
    // After a failure, a few minutes pass before the next try: each try is two model requests.
    if (chronicling.has(saveId) || Date.now() - (chronicleFailed.get(saveId) ?? 0) < 5 * 60_000) return;
    chronicling.add(saveId);
    void (async () => {
      const s = store.save(saveId);
      const w = s && store.world(s.worldId);
      if (!s || !w) return;
      const path = store.path(s.headId);
      for (;;) {
        const end = chronicleOf(path).at + chronicleTurns;
        if (end > path.length - 1) break;
        const { notes, timeline } = await chronicleStep(w, path);
        // Read the turn again: secrets may have been buried in it meanwhile.
        path[end] = { ...store.node(path[end]!.id)!, memory: notes, timeline };
        store.putNode(path[end]!);
        console.log(`chronicle.written to=${end} notes=${notes.length} entries=${timeline.length}`);
      }
    })()
      .catch((error) => {
        console.warn("chronicle.failed", error instanceof Error ? error.message : error);
        chronicleFailed.set(saveId, Date.now());
      })
      .finally(() => chronicling.delete(saveId));
  }

  /** The changes and hooks of a whole reply, or null when they are missing or the reply is broken. */
  /** What some of the people away did, or nothing should the model fail. */
  async function meanwhileStep(w: World, path: TurnNode[], away: string[], passed: string | null = null) {
    try {
      const report = (await writer.json(meanwhileMessages(w, path, away, passed))) as Record<string, unknown>;
      const items = (Array.isArray(report.meanwhile) ? report.meanwhile : []).flatMap((item) => {
        const v = (item ?? {}) as Record<string, unknown>;
        const character = str(v.character, 200).trim();
        const did = str(v.did, 600).trim();
        return character && did ? [{ character, did }] : [];
      });
      // On a jump, where everyone away is now, as moves; the changes' own moves come after and win.
      const where = passed && report.where && typeof report.where === "object" ? Object.entries(report.where) : [];
      // The same checks as any move, and no place without a letter in it ("…", "-").
      const moves = parseChanges(where.map(([character, place]) => ({ type: "move", character, place }))).filter(
        (c) => c.type === "move" && /[\p{L}\p{N}]/u.test(c.place),
      );
      return { items: items.slice(0, passed ? 5 : 3), changes: [...moves, ...parseChanges(report.changes)] };
    } catch (error) {
      console.warn("meanwhile.failed", error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * The die for the player's attempt, when it is risky: the storyteller only judges how hard it is, before any roll,
   * and is then told how it went. Nothing when the action is no gamble or the judging fails.
   */
  async function rollFor(w: World, path: TurnNode[], actor: string, input: string): Promise<Dice | null> {
    try {
      // A judgement, not a story: at the default temperature the same pressing was risky in 5 of 6 tries (2026-10-19).
      const report = (await writer.json(riskMessages(w, path, actor, input), { temperature: 0 })) as Record<string, unknown>;
      const difficulty = (["easy", "normal", "hard"] as const).find((d) => d === report.difficulty);
      const what = str(report.what, 100).trim();
      if (report.risky !== true || !difficulty || !what) return null;
      const roll = 1 + Math.floor(Math.random() * 20);
      const outcome = outcomeOf(roll, difficulty);
      const result = str(outcome === "fail" ? report.fail : report.success, 200).trim();
      return { what, difficulty, roll, outcome, ...(result && { result }) };
    } catch (error) {
      console.warn("dice.failed", error instanceof Error ? error.message : error);
      return null;
    }
  }

  /** At most `ms` of waiting for the step; then the turn goes on without it. */
  const within = <T,>(step: Promise<T>, ms = 40_000) =>
    Promise.race([step, new Promise<null>((done) => setTimeout(done, ms, null).unref())]);

  /**
   * What the offstage step may change: where people away are, how they are and their ties, never anyone
   * else's and never by moving them into the player's scene (`here`: its places, where the player is or is going).
   */
  const offstageOnly = (state: TurnNode["state"], keep: (name: string) => boolean, here: (string | null | undefined)[]) =>
    (c: Change) => {
      if (c.type === "relationship") return keep(c.a) && keep(c.b);
      if (c.type === "move") {
        const to = placeNamed(state, c.place)?.id;
        return keep(c.character) && !(to && here.includes(to));
      }
      // Not a leave: kept in the library to write lines came back as leaving the story (2026-10-20); someone leaves it
      // in the story, or by the director's word.
      return c.type === "status" && keep(c.character);
    };

  function readRecord(reply: string, before: TurnNode["state"], who: string | null) {
    try {
      const report = parseJsonObject(reply) as Record<string, unknown>;
      if (!Array.isArray(report.changes)) return null;
      const changes = withWhere(before, parseChanges(report.changes), who, report.where);
      return { changes, hooks: parseHooks(report.hooks), failed: false };
    } catch {
      return null;
    }
  }

  async function turn(req: IncomingMessage, res: ServerResponse, saveId: string) {
    const s = save(saveId);
    const body = await readJson(req);
    const w = world(s.worldId);
    const path = store.path(s.headId);
    const head = path.at(-1)!;
    const actor = str(body.actor, 64) || "director";
    if (actor !== "director" && !head.state.characters.some((c) => c.id === actor))
      fail(400, "Unknown character");
    const input = str(body.input, 4000).trim();
    // Played again after leaving the story (say, the player goes on as their dead character's ghost): they are back.
    const resumed = inPlay(head.state, actor);
    const from = path.with(-1, { ...head, state: resumed });
    // Every few turns the people away from the player's scene act on their own, while the story is written; when the
    // player skips days or months, first, so the story is told from where they got to.
    const mine = placedOne(from, actor);
    const me = resumed.characters.find((c) => c.name === mine);
    const passed = timeJump(input);
    // Someone placed nowhere is away too unless the action or the last turn names them: a world's author often places
    // only a few, and a new game's meanwhile moved one person in a week (2026-10-19). After a jump in time the last
    // turn is over: those it named stayed "in the scene" for three days and were never moved (2026-10-19).
    const lately = passed ? input : `${input}\n${head.story}`;
    const scene = me ? sceneOf(resumed, me.id, lately, !!passed) : null;
    const out = (c: Character) => (c.placeId ? !scene!.includes(c.placeId) : !mentions(lately, c.name));
    const away =
      scene && s.settings.meanwhile !== false && (passed || path.length % MEANWHILE_TURNS === 0)
        ? resumed.characters.filter((c) => c !== me && !c.gone && out(c)).map((c) => c.name)
        : [];
    const early = !!passed && away.length > 0;
    if (busy.has(s.id)) fail(409, "A turn is already being written for this save");
    busy.add(s.id);
    const offstage = away.length && !early ? meanwhileStep(w, from, away) : null;

    res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache" });
    const event = (name: string, data: unknown) => res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
    try {
      const started = Date.now();
      let before = resumed;
      let elsewhere: { character: string; did: string }[] = [];
      let offstageChanges: Change[] = [];
      if (early) {
        event("phase", { phase: "passing" });
        const moved = await within(meanwhileStep(w, from, away, passed));
        if (moved) {
          const keep = (name: string) => away.some((a) => same(a, name));
          offstageChanges = moved.changes.filter(offstageOnly(resumed, keep, scene ?? []));
          before = applyChanges(resumed, offstageChanges).state;
          elsewhere = moved.items.filter((m) => keep(m.character));
          console.log(`meanwhile.passed ${Date.now() - started}ms`, elsewhere.length);
        }
        event("phase", { phase: "story" });
      }
      const played = path.with(-1, { ...head, state: before });
      // With the dice on, a risky attempt by the player's character is settled before the story is told.
      const dice =
        s.settings.dice && actor !== "director" && input ? await within(rollFor(w, played, actor, input), 10_000) : null;
      if (dice) event("dice", dice);
      let firstAt = 0;
      let storyAt = 0;
      // One JSON reply carries the story, then the turn's changes and hooks. The story is read out of it as it
      // arrives and goes to the player straight away.
      let reply = "";
      let sent = 0;
      let closed = false;
      const close = () => {
        closed = true;
        storyAt = Date.now();
        event("phase", { phase: "changes" });
      };
      // A reply that ended right after the story, or inside the next key (`", "chan`), still holds the whole story:
      // drop the key's start and see whether the story closes. A comma alone may be the story's own.
      const whole = () => {
        const cut = reply.replace(/,\s*"[A-Za-z_]*"?\s*$/, "");
        const ends = (rest: string) => readString(cut + rest, "story");
        const read = [ends("}"), ends(' "hooks": []}')].find((r) => r.done);
        return !!read?.text.trim();
      };
      // Providers now and then answer with nothing or break off mid-story, with or without an error (a 5-character
      // story was kept at turn 171 of a long test, 2026-10-18): one quiet retry, and the page starts the story over.
      for (let attempt = 0; attempt < 2 && !closed; attempt++) {
        if (attempt) {
          console.warn("story.retry", reply.length);
          event("phase", { phase: "restart" });
        }
        reply = "";
        sent = 0;
        const narrator = s.settings.thinking ? thinker : model;
        try {
          for await (const piece of narrator.stream(narrationMessages(w, played, actor, input, s.settings, s.notes, elsewhere, dice), {
            json: true,
          })) {
            reply += piece;
            if (closed) continue;
            const { text: raw, done } = readString(reply, "story");
            const text = fullWidth(raw);
            if (text.length > sent) {
              firstAt ||= Date.now();
              event("story", { text: text.slice(sent) });
              sent = text.length;
            }
            // An empty story is no story: it is asked for again.
            if (done && text.trim()) close();
          }
        } catch (error) {
          // A whole story the player has already read stays; the record is read from it below.
          if (!closed && !whole() && attempt) throw error;
          console.warn("reply.cut", error instanceof Error ? error.message : error);
        }
        if (!closed && whole()) close();
      }
      if (!closed) throw new Error("The story broke off");
      const story = fullWidth(readString(reply, "story").text).trim();

      // The story is never lost: if the record in the reply is missing or broken, a second request reads the
      // changes from the story, and if that fails too the turn keeps the story alone.
      const who = placedOne(played, actor);
      let report = readRecord(reply, before, who);
      if (!report) {
        console.warn("record.missing");
        report = await record(w, before, story, actor, who);
      }
      const { changes, hooks, failed } = report;
      console.log(
        `turn.timing first=${firstAt - started}ms story=${storyAt - started}ms records=${Date.now() - storyAt}ms`,
      );
      const { state: changed, applied } = applyChanges(before, changes);
      const node: TurnNode = {
        id: randomUUID(),
        worldId: w.id,
        parentId: head.id,
        actor,
        input,
        story,
        changes: applied,
        hooks,
        state: changed,
        ...(failed && { recordsFailed: true }),
        ...(dice && { dice }),
        // What the skipped time changed off the stage, so the turn can be recorded again from its parent.
        ...(offstageChanges.length && { offstage: offstageChanges }),
        // Someone the story then brings into the scene is no longer told as away.
        ...(elsewhere.length && { meanwhile: elsewhere.filter((m) => stillAway(away, story, applied)(m.character)) }),
        createdAt: now(),
      };
      // Waited for a while at most, and not for a turn whose record failed: asked again, it starts from the parent.
      const moved = failed || !offstage ? null : await within(offstage);
      if (moved) {
        // Someone the turn named, touched or now shares the player's place with is in the scene, as the story tells.
        const here = changed.characters.find((c) => c.name === mine)?.placeId;
        const named = stillAway(away, story, applied);
        const keep = (name: string) => named(name) && changed.characters.find((c) => same(c.name, name))?.placeId !== here;
        node.state = applyChanges(changed, moved.changes.filter(offstageOnly(changed, keep, [here]))).state;
        const items = moved.items.filter((m) => keep(m.character));
        if (items.length) node.meanwhile = items;
        console.log(`meanwhile.done ${Date.now() - started}ms`, items.length);
      }
      // The reply now and then leaves the hooks off; a quick request without thinking fills them in.
      if (hooks.length === 0) {
        try {
          const report = (await writer.json(hookMessages(w, [...path, node]))) as Record<string, unknown>;
          node.hooks = parseHooks(report.hooks);
        } catch (error) {
          console.warn("hooks.failed", error instanceof Error ? error.message : error);
        }
      }
      // When the story nears the model's reach, the turns the timeline already tells are no longer sent, but for
      // the newest ones. Nothing has to be written, so nobody waits.
      const next = [...path, node];
      // As the director, who reads the whole world: the largest prompt the next turn can send.
      const size = tokensOf(narrationMessages(w, next, "director", "", s.settings, s.notes).map((m) => m.content).join(""));
      if (size > trimAt) {
        try {
          // A whole timeline step at a time, so the turn before the cut is one that keeps its state.
          const newest = Math.floor((next.length - keepTurns) / chronicleTurns) * chronicleTurns;
          const told = chronicleOf(next).at + 1;
          // Should the timeline fall far behind (a provider that keeps failing), the story is trimmed all the same
          // before it outgrows the model, which still read 254K in 16 s (2026-10-18); but only what the timeline
          // tells leaves the state.
          const cut = size > trimAt * 1.25 ? newest : Math.min(told, newest);
          if (cut > storyFrom(next)) {
            node.trimmed = next[cut - 1]!.id;
            const known = Math.min(cut, told);
            if (known > 0) node.state = trimState(node.state, next[known - 1]!.state, w.state);
          } else console.warn("trim.waiting", "the timeline has not caught up yet");
        } catch (error) {
          console.warn("trim.failed", error instanceof Error ? error.message : error); // the story is kept whole
        }
      }
      // Secrets buried in the turn this one grows from while it was being written come along.
      node.state = carrySecrets(store.node(head.id)!.state, node.state);
      store.putNode(node);
      store.putSave({ ...save(s.id), headId: node.id, updatedAt: now() });
      event("done", { node });
      // Every few turns the AI buries new secrets in what has happened, unless plenty still wait.
      const hidden = node.state.facts.filter((f) => f.secret && !f.revealed).length;
      if (path.length % BURY_EVERY === 0 && hidden < MAX_HIDDEN) buryLater(s.id);
      if (next.length - 1 - chronicleOf(next).at >= chronicleTurns) chronicleLater(s.id);
      // ponytail: a sweep of the whole tree every ten turns; a per-turn single forget if the tree gets huge.
      try {
        if (next.length % chronicleTurns === 0) forgetOldStates(w.id);
      } catch (error) {
        console.warn("forget.failed", error instanceof Error ? error.message : error);
      }
    } catch (error) {
      console.warn("turn.failed", error instanceof Error ? error.message : error);
      event("error", { message: error instanceof Error ? error.message : "The turn failed" });
    } finally {
      busy.delete(s.id);
      res.end();
    }
  }

  return async function api(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? "/", "http://local");
    const parts = url.pathname.split("/").filter(Boolean).slice(1); // drop "api"
    const route = `${req.method} /${parts.map((p, i) => (i % 2 === 1 ? ":id" : p)).join("/")}`;
    const id = parts[1] ?? "";
    try {
      // A plain cross-site form or no-cors fetch cannot send this header without asking first.
      if (req.method !== "GET" && !req.headers["content-type"]?.startsWith("application/json"))
        fail(415, "Expected JSON");
      switch (route) {
        case "GET /worlds":
          return send(
            res,
            200,
            store.worlds().map((w) => ({ world: w, saves: store.saves(w.id) })),
          );
        case "POST /worlds": {
          const w: World = { ...normalizeDraft(await readJson(req)), id: randomUUID(), createdAt: now(), updatedAt: now() };
          store.putWorld(w);
          return send(res, 201, w);
        }
        case "POST /drafts": {
          const body = await readJson(req);
          // A pasted prompt for another AI runs to thousands of characters.
          const idea = str(body.idea, 60_000).trim();
          const feedback = str(body.feedback, 10_000).trim();
          if (!idea) fail(400, "Describe the world first");
          const draft = body.draft ? toPlain(normalizeDraft(body.draft)) : null;
          if (draft && !feedback) fail(400, "Say what to change");
          // A world is built once and carries the whole game, so it is thought through; quickly if that fails or
          // comes back without an opening or anyone in it.
          const messages = draftMessages(idea, draft, feedback);
          const result = await carefully(async (by) => {
            const world = fromPlain(await streamJson(by, messages));
            if (!world.opening || world.state.characters.length === 0) throw new HttpError(502, "The model gave no usable world");
            return world;
            // The player waits about four minutes for each thinking try.
          }, 1);
          return send(res, 200, result);
        }
        case "POST /drafts/:id": {
          const body = await readJson(req);
          // The request for another AI, and the world it built, pasted back by the player.
          if (id === "prompt") {
            const idea = str(body.idea, 60_000).trim();
            if (!idea) fail(400, "Describe the world first");
            return send(res, 200, { prompt: draftPrompt(idea) });
          }
          if (id !== "import") fail(404, "Not found");
          let result: WorldDraft | undefined;
          try {
            result = fromPlain(firstJsonObject(str(body.text, 200_000)));
          } catch {
            fail(400, "That is not a world: paste the AI's whole reply");
          }
          if (!result.opening || result.state.characters.length === 0)
            fail(400, "That world has no opening or no one in it");
          return send(res, 200, result);
        }
        case "GET /worlds/:id":
          return send(res, 200, world(id));
        case "PUT /worlds/:id": {
          const old = world(id);
          const w: World = { ...old, ...normalizeDraft(await readJson(req)), updatedAt: now() };
          store.putWorld(w);
          return send(res, 200, w);
        }
        case "DELETE /worlds/:id":
          world(id);
          store.deleteWorld(id);
          return send(res, 200, {});
        case "POST /saves": {
          const body = await readJson(req);
          return send(res, 201, startSave(world(str(body.worldId, 64)), str(body.title, 200)));
        }
        case "GET /saves/:id":
          return send(res, 200, view(save(id)));
        case "PATCH /saves/:id": {
          const body = await readJson(req);
          const s = save(id);
          if (busy.has(s.id)) fail(409, "A turn is being written");
          const next: Save = {
            ...s,
            title: str(body.title, 200).trim() || s.title,
            settings: normalizeSettings(body.settings, s.settings),
            notes: body.notes === undefined ? s.notes : str(body.notes, 2000),
            updatedAt: now(),
          };
          if (body.headId !== undefined) {
            const target = store.node(str(body.headId, 64));
            if (!target || target.worldId !== s.worldId) fail(400, "Unknown turn");
            if (!target.state) fail(400, "That turn is too far back to resume; go back to a nearby saved point");
            next.headId = target.id;
          }
          store.putSave(next);
          return send(res, 200, view(next));
        }
        case "DELETE /saves/:id":
          save(id);
          store.deleteSave(id);
          return send(res, 200, {});
        case "POST /saves/:id/branch": {
          const s = save(id);
          const body = await readJson(req);
          const target = store.node(str(body.nodeId, 64) || s.headId);
          if (!target || target.worldId !== s.worldId) fail(400, "Unknown turn");
          if (!target.state) fail(400, "That turn is too far back to resume; go back to a nearby saved point");
          const branch: Save = {
            ...s,
            id: randomUUID(),
            title: str(body.title, 200).trim() || `${s.title} ·`,
            headId: target.id,
            createdAt: now(),
            updatedAt: now(),
          };
          store.putSave(branch);
          return send(res, 201, branch);
        }
        case "POST /saves/:id/turn":
          return await turn(req, res, id);
        case "POST /saves/:id/view": {
          // Told once for a turn and a character, and kept; the world does not change.
          const s = save(id);
          const body = await readJson(req);
          const path = store.path(s.headId);
          const turn = path.findIndex((n) => n.id === str(body.node, 64));
          if (turn < 1) fail(400, "Unknown turn");
          const character = str(body.character, 64);
          if (!(path[turn]!.state ?? path.at(-1)!.state).characters.some((c) => c.id === character))
            fail(400, "Unknown character");
          const kept = store.node(path[turn]!.id)!.views?.[character];
          if (kept) return send(res, 200, { story: kept });
          // Kept close to the passage: at the default temperature it added lines and deeds of its own.
          const ask = () =>
            writer.json(viewMessages(world(s.worldId), path, turn, character, s.settings), { temperature: 0 });
          const told = fullWidth(str(((await ask().catch(ask)) as Record<string, unknown>).story, 6000)).trim();
          if (!told) fail(502, "The model gave no story");
          const node = store.node(path[turn]!.id)!;
          store.putNode({ ...node, views: { ...node.views, [character]: told } });
          return send(res, 200, { story: told });
        }
        case "POST /saves/:id/interview": {
          // Out of the story: nothing is stored and the world does not change.
          const s = save(id);
          const body = await readJson(req);
          const path = store.path(s.headId);
          const character = str(body.character, 64);
          if (!path.at(-1)!.state.characters.some((c) => c.id === character)) fail(400, "Unknown character");
          const question = str(body.question, 2000).trim();
          if (!question) fail(400, "Ask something first");
          const talk = (Array.isArray(body.talk) ? body.talk : []).slice(-10).flatMap((t: unknown) => {
            const v = (t ?? {}) as Record<string, unknown>;
            const q = str(v.q, 2000).trim();
            const a = str(v.a, 2000).trim();
            return q && a ? [{ q, a }] : [];
          });
          const ask = () =>
            writer.json(interviewMessages(world(s.worldId), path, character, talk, question, s.settings.showSecrets));
          const answer = str(((await ask().catch(ask)) as Record<string, unknown>).answer, 2000).trim();
          if (!answer) fail(502, "The model gave no answer");
          return send(res, 200, { answer });
        }
        case "POST /saves/:id/recap": {
          // Written once for the turn it stops at, and kept: coming back again, the player does not wait.
          const s = save(id);
          const path = store.path(s.headId);
          const head = path.at(-1)!;
          if (head.recap) return send(res, 200, { recap: head.recap });
          const ask = () => writer.json(recapMessages(world(s.worldId), path));
          const recap = str(((await ask().catch(ask)) as Record<string, unknown>).recap, 2000).trim();
          if (!recap) fail(502, "The model gave no recap");
          store.putNode({ ...store.node(head.id)!, recap });
          return send(res, 200, { recap });
        }
        case "POST /saves/:id/hooks": {
          const s = save(id);
          if (busy.has(s.id)) fail(409, "A turn is being written");
          const path = store.path(s.headId);
          // The provider now and then fails a request for no reason; one more try covers it.
          // At the opening nobody has acted yet: the hooks are for whoever the player has chosen to start as.
          const body = await readJson(req);
          const actor = path.length === 1 ? str(body.actor, 64) || "director" : path.at(-1)!.actor;
          const ask = () => model.json(hookMessages(world(s.worldId), path, actor));
          const report = (await ask().catch(ask)) as Record<string, unknown>;
          const hooks = parseHooks(report.hooks);
          if (hooks.length === 0) fail(502, "The model gave no suggestions");
          // Read the turn again: secrets may have been buried in it while the model was writing.
          const head = { ...store.node(path.at(-1)!.id)!, hooks };
          store.putNode(head);
          return send(res, 200, head);
        }
        case "POST /saves/:id/records": {
          const s = save(id);
          const head = store.node(s.headId)!;
          const parent = head.parentId ? store.node(head.parentId) : undefined;
          if (!head.recordsFailed || !parent) fail(400, "Nothing to record again");
          if (busy.has(s.id)) fail(409, "A turn is being written");
          busy.add(s.id);
          try {
            // A turn that failed to record kept its parent's state, should the parent have let go of it.
            // From the parent, with what a skip in time changed off the stage before the story was written.
            const before = applyChanges(inPlay(parent.state ?? head.state, head.actor), head.offstage ?? []).state;
            const who = placedOne([...store.path(parent.id).slice(0, -1), { ...parent, state: before }], head.actor);
            const { changes, hooks, failed } = await record(world(s.worldId), before, head.story, head.actor, who);
            if (failed) fail(502, "Could not record the changes");
            const { applied, state: changed } = applyChanges(before, changes);
            // A recap written before the changes were recorded tells the turn without them: it goes.
            const { recordsFailed: _, recap: __, ...rest } = store.node(head.id)!;
            // What a trim on this turn took out stays out: as in `turn`, what the timeline told by the cut.
            const path = store.path(head.id);
            const known = rest.trimmed
              ? Math.min(path.findIndex((n) => n.id === rest.trimmed) + 1, chronicleOf(path).at + 1)
              : 0;
            const told = known > 0 ? path[known - 1]!.state : undefined;
            const state = carrySecrets(rest.state, told ? trimState(changed, told, world(s.worldId).state) : changed);
            const node: TurnNode = { ...rest, changes: applied, hooks, state };
            store.putNode(node);
            return send(res, 200, view(save(s.id)));
          } finally {
            busy.delete(s.id);
          }
        }
        default:
          return send(res, 404, { error: "Not found" });
      }
    } catch (error) {
      if (res.headersSent) return;
      if (error instanceof HttpError) return send(res, error.status, { error: error.message });
      console.error("api.failed", error);
      return send(res, 500, { error: error instanceof Error ? error.message : "Server error" });
    }
  };
}
