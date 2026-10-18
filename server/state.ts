import { randomUUID } from "node:crypto";
import type { Change, Character, Fact, Place, WorldState } from "../shared/types.ts";

export const newId = (prefix: string) => `${prefix}${randomUUID().slice(0, 8)}`;

const text = (value: unknown, max = 2000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

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
          place: text(v.place),
          note,
        });
        break;
      case "status":
        changes.push({ type: "status", character: text(v.character), notes: text(v.notes), note });
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
  const place = (name: string): Place | undefined => state.places.find((p) => same(p.name, name));
  const placeOrNew = (name: string): Place | undefined => {
    if (!name) return undefined;
    const found = place(name);
    if (found) return found;
    const created = { id: newId("p"), name, description: "" };
    state.places.push(created);
    return created;
  };
  const fact = (id: string): Fact | undefined => state.facts.find((f) => f.id === id);

  for (const change of changes) {
    switch (change.type) {
      case "move": {
        const who = character(change.character);
        const where = placeOrNew(change.place);
        if (!who || !where) continue;
        who.placeId = where.id;
        break;
      }
      case "place": {
        if (!change.name || place(change.name)) continue;
        state.places.push({ id: newId("p"), name: change.name, description: change.description });
        break;
      }
      case "character": {
        if (!change.name || character(change.name)) continue;
        const created: Character = {
          id: newId("c"),
          name: change.name,
          persona: change.persona,
          goals: "",
          placeId: placeOrNew(change.place)?.id ?? null,
          notes: "",
          knows: [],
        };
        state.characters.push(created);
        break;
      }
      case "status": {
        const who = character(change.character);
        if (!who) continue;
        who.notes = change.notes;
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

export function describeState(state: WorldState, { secrets = true } = {}): string {
  const placeName = (id: string | null) =>
    state.places.find((p) => p.id === id)?.name ?? "somewhere unspecified";
  const charName = (id: string) => state.characters.find((c) => c.id === id)?.name ?? id;
  const lines: string[] = [`Time: ${state.clock || "unspecified"}`, "", "Places:"];
  for (const p of state.places) lines.push(`- ${p.name}: ${p.description}`);
  lines.push("", "Characters:");
  for (const c of state.characters) {
    lines.push(
      `- ${c.name} (at ${placeName(c.placeId)}). Persona: ${c.persona}. Goals: ${c.goals || "none stated"}.` +
        `${c.notes ? ` Now: ${c.notes}.` : ""} Knows: ${c.knows.join(", ") || "nothing listed"}.`,
    );
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
