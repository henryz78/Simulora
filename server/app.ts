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
import type { Model } from "./model.ts";
import { changeMessages, hookMessages, narrationMessages } from "./prompts.ts";
import { applyChanges, newId, parseChanges } from "./state.ts";

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

function normalizeSettings(raw: unknown, current: Settings): Settings {
  const v = (raw ?? {}) as Record<string, unknown>;
  const pick = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
    options.includes(value as T) ? (value as T) : fallback;
  return {
    person: pick(v.person, ["third", "second"], current.person),
    pace: pick(v.pace, ["calm", "medium", "intense"], current.pace),
    length: pick(v.length, ["auto", "short", "long"], current.length),
    showSecrets: typeof v.showSecrets === "boolean" ? v.showSecrets : current.showSecrets,
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

export function createApi(store: Store, model: Model) {
  const busy = new Set<string>();

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
      let story = "";
      // Some providers now and then answer with nothing; one quiet retry covers it.
      for (let attempt = 0; attempt < 2 && !story.trim(); attempt++) {
        for await (const piece of model.stream(narrationMessages(w, path, actor, input, s.settings))) {
          story += piece;
          firstAt ||= Date.now();
          event("story", { text: piece });
        }
      }
      story = story.trim();
      if (!story) throw new Error("The model returned no story");
      const storyAt = Date.now();
      event("phase", { phase: "changes" });

      // The story is never lost: if reading the changes fails, the turn keeps the story alone.
      const { changes, hooks, failed } = await record(w, head.state, story, actor);
      console.log(
        `turn.timing first=${firstAt - started}ms story=${storyAt - started}ms records=${Date.now() - storyAt}ms`,
      );
      const { state, applied } = applyChanges(head.state, changes);
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
          const head = { ...path.at(-1)!, hooks };
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
            const { recordsFailed: _, ...rest } = head;
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
