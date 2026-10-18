import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  defaultSettings,
  type Change,
  type Character,
  type Fact,
  type Place,
  type Save,
  type SaveView,
  type Settings,
  type Thread,
  type TurnNode,
  type World,
  type WorldDraft,
} from "../shared/types.ts";
import type { Store } from "./db.ts";
import { parseJsonObject, readString, type Model } from "./model.ts";
import {
  BURY_EVERY,
  MAX_HIDDEN,
  buryMessages,
  changeMessages,
  draftMessages,
  hookMessages,
  narrationMessages,
  type PlainDraft,
} from "./prompts.ts";
import { applyChanges, bury, carrySecrets, newId, parseChanges } from "./state.ts";

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
    showSecrets: typeof v.showSecrets === "boolean" ? v.showSecrets : current.showSecrets,
    thinking: typeof v.thinking === "boolean" ? v.thinking : (current.thinking ?? false),
  };
}

const parseHooks = (raw: unknown) =>
  Array.isArray(raw)
    ? raw.filter((h): h is string => typeof h === "string" && h.trim() !== "").slice(0, 3).map((h) => h.trim().slice(0, 300))
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
 * `model` streams the story and keeps the records. `thinker` streams the story for saves with thinking on;
 * `writer` drafts worlds, where speed matters more than care.
 */
export function createApi(store: Store, model: Model, { thinker = model, writer = model } = {}) {
  const busy = new Set<string>();
  // Saves whose secrets are being buried. Burying takes the model a minute or more, so nobody waits for it.
  const burying = new Set<string>();

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
      if (!node) return;
      const { state, buried } = bury(node.state, report.secrets);
      if (buried.length === 0) return;
      store.putNode({ ...node, state });
      const tree = store.tree(node.worldId);
      for (let i = 0, grown = [origin]; i < grown.length; i++) {
        for (const child of tree.filter((n) => n.parentId === grown[i])) {
          const later = store.node(child.id)!;
          store.putNode({ ...later, state: carrySecrets(state, later.state) });
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
  const view = (s: Save): SaveView => ({
    save: s,
    world: world(s.worldId),
    path: store.path(s.headId),
    tree: store.tree(s.worldId),
  });

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
  async function record(w: World, before: TurnNode["state"], story: string, actor: string) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const report = (await model.json(changeMessages(w, before, story, actor))) as Record<string, unknown>;
        return { changes: parseChanges(report.changes), hooks: parseHooks(report.hooks), failed: false };
      } catch (error) {
        console.warn("changes.failed", error instanceof Error ? error.message : error);
      }
    }
    return { changes: [] as Change[], hooks: [] as string[], failed: true };
  }

  /** The changes and hooks of a whole reply, or null when they are missing or the reply is broken. */
  function readRecord(reply: string) {
    try {
      const report = parseJsonObject(reply) as Record<string, unknown>;
      if (!Array.isArray(report.changes)) return null;
      return { changes: parseChanges(report.changes), hooks: parseHooks(report.hooks), failed: false };
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
    if (busy.has(s.id)) fail(409, "A turn is already being written for this save");
    busy.add(s.id);

    res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache" });
    const event = (name: string, data: unknown) => res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
    try {
      const started = Date.now();
      let firstAt = 0;
      let storyAt = 0;
      // One JSON reply carries the story, then the turn's changes and hooks. The story is read out of it as it
      // arrives and goes to the player straight away.
      let reply = "";
      let sent = 0;
      let closed = false;
      // Some providers now and then answer with nothing; one quiet retry covers it.
      for (let attempt = 0; attempt < 2 && !readString(reply, "story").text.trim(); attempt++) {
        reply = "";
        sent = 0;
        closed = false;
        const narrator = s.settings.thinking ? thinker : model;
        try {
          for await (const piece of narrator.stream(narrationMessages(w, path, actor, input, s.settings), {
            json: true,
          })) {
            reply += piece;
            if (closed) continue;
            const { text, done } = readString(reply, "story");
            if (text.length > sent) {
              firstAt ||= Date.now();
              event("story", { text: text.slice(sent) });
              sent = text.length;
            }
            if (done) {
              closed = true;
              storyAt = Date.now();
              event("phase", { phase: "changes" });
            }
          }
        } catch (error) {
          // A whole story the player has already read stays; the record is read from it below.
          if (!closed) throw error;
          console.warn("reply.cut", error instanceof Error ? error.message : error);
        }
      }
      if (!closed) console.warn("story.unclosed");
      const story = readString(reply, "story").text.trim();
      if (!story) throw new Error("The model returned no story");
      storyAt ||= Date.now();

      // The story is never lost: if the record in the reply is missing or broken, a second request reads the
      // changes from the story, and if that fails too the turn keeps the story alone.
      let report = readRecord(reply);
      if (!report) {
        if (!closed) event("phase", { phase: "changes" });
        console.warn("record.missing");
        report = await record(w, head.state, story, actor);
      }
      const { changes, hooks, failed } = report;
      console.log(
        `turn.timing first=${firstAt - started}ms story=${storyAt - started}ms records=${Date.now() - storyAt}ms`,
      );
      const { state: changed, applied } = applyChanges(head.state, changes);
      // Secrets buried in the turn this one grows from while it was being written come along.
      const state = carrySecrets(store.node(head.id)!.state, changed);
      const node: TurnNode = {
        id: randomUUID(),
        worldId: w.id,
        parentId: head.id,
        actor,
        input,
        story,
        changes: applied,
        hooks,
        state,
        ...(failed && { recordsFailed: true }),
        createdAt: now(),
      };
      store.putNode(node);
      store.putSave({ ...save(s.id), headId: node.id, updatedAt: now() });
      event("done", { node });
      // Every few turns the AI buries new secrets in what has happened, unless plenty still wait.
      const hidden = state.facts.filter((f) => f.secret && !f.revealed).length;
      if (path.length % BURY_EVERY === 0 && hidden < MAX_HIDDEN) buryLater(s.id);
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
          const idea = str(body.idea).trim();
          if (!idea) fail(400, "Describe the world first");
          const draft = body.draft ? toPlain(normalizeDraft(body.draft)) : null;
          if (draft && !str(body.feedback).trim()) fail(400, "Say what to change");
          const ask = () => writer.json(draftMessages(idea, draft, str(body.feedback).trim()));
          const result = fromPlain(await ask().catch(ask));
          if (!result.opening || result.state.characters.length === 0) fail(502, "The model gave no usable world");
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
            updatedAt: now(),
          };
          if (body.headId !== undefined) {
            const target = store.node(str(body.headId, 64));
            if (!target || target.worldId !== s.worldId) fail(400, "Unknown turn");
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
        case "POST /saves/:id/hooks": {
          const s = save(id);
          if (busy.has(s.id)) fail(409, "A turn is being written");
          const path = store.path(s.headId);
          // The provider now and then fails a request for no reason; one more try covers it.
          const ask = () => model.json(hookMessages(world(s.worldId), path));
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
            const { changes, hooks, failed } = await record(world(s.worldId), parent.state, head.story, head.actor);
            if (failed) fail(502, "Could not record the changes");
            const { state, applied } = applyChanges(parent.state, changes);
            const { recordsFailed: _, ...rest } = store.node(head.id)!;
            const node: TurnNode = { ...rest, changes: applied, hooks, state: carrySecrets(rest.state, state) };
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
