import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { Save, SaveView, World } from "../shared/types.ts";
import { createApi } from "../server/app.ts";
import { Store } from "../server/db.ts";
import { fakeModel, parseJsonObject, type Model } from "../server/model.ts";

// A fake model whose failures each test switches on.
const fake = fakeModel();
const mode = {
  streamFails: false,
  jsonFails: false,
  hold: null as Promise<void> | null,
  buryHold: null as Promise<void> | null,
  hooksHold: null as Promise<void> | null,
};
const model: Model = {
  async *stream(messages) {
    if (mode.hold) await mode.hold;
    yield "Half a sentence";
    if (mode.streamFails) throw new Error("provider dropped");
    yield* fake.stream(messages);
  },
  async json(messages) {
    const system = messages[0]?.content ?? "";
    if (system.includes("hide its secrets")) await mode.buryHold;
    if (system.includes("Suggest what")) await mode.hooksHold;
    if (mode.jsonFails) throw new Error("junk");
    return fake.json(messages);
  },
};

let server: Server;
let base = "";
before(async () => {
  const api = createApi(new Store(join(mkdtempSync(join(tmpdir(), "simulora-")), "test.db")), model);
  server = createServer((req, res) => void api(req, res));
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
});
after(() => server.close());

const post = (path: string, body: unknown = {}) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const get = async (path: string) => (await (await fetch(base + path)).json()) as SaveView;
const events = async (response: Response) =>
  [...(await response.text()).matchAll(/^event: (\w+)/gm)].map((m) => m[1]);

async function newSave(): Promise<Save> {
  const world = (await (await post("/worlds", { title: "W", opening: "Start." })).json()) as World;
  return (await (await post("/saves", { worldId: world.id })).json()) as Save;
}

test("a story that breaks off saves nothing", async () => {
  const save = await newSave();
  mode.streamFails = true;
  try {
    assert.deepEqual(await events(await post(`/saves/${save.id}/turn`, { input: "go" })), ["story", "error"]);
  } finally {
    mode.streamFails = false;
  }
  const view = await get(`/saves/${save.id}`);
  assert.equal(view.path.length, 1);
  assert.equal(view.tree.length, 1);
});

test("failed records keep the story and can be recorded again", async () => {
  const save = await newSave();
  mode.jsonFails = true;
  try {
    assert.deepEqual((await events(await post(`/saves/${save.id}/turn`, { input: "go" }))).at(-1), "done");
  } finally {
    mode.jsonFails = false;
  }
  let head = (await get(`/saves/${save.id}`)).path.at(-1)!;
  assert.equal(head.recordsFailed, true);
  assert.match(head.story, /go/);
  assert.deepEqual(head.changes, []);

  const again = await post(`/saves/${save.id}/records`);
  assert.equal(again.status, 200);
  head = ((await again.json()) as SaveView).path.at(-1)!;
  assert.equal(head.recordsFailed, undefined);
  assert.equal(head.state.clock, "A little later");
  assert.equal(head.hooks.length, 3);
  assert.equal((await post(`/saves/${save.id}/records`)).status, 400, "nothing left to record");
});

test("one turn at a time, known actors only, JSON only", async () => {
  const save = await newSave();
  let release = () => {};
  mode.hold = new Promise((done) => (release = done));
  const first = post(`/saves/${save.id}/turn`, {});
  await new Promise((done) => setTimeout(done, 50));
  assert.equal((await post(`/saves/${save.id}/turn`, {})).status, 409);
  assert.equal((await post(`/saves/${save.id}/hooks`)).status, 409);
  mode.hold = null;
  release();
  assert.equal((await events(await first)).at(-1), "done");

  assert.equal((await post(`/saves/${save.id}/turn`, { actor: "nobody" })).status, 400);
  const plain = await fetch(`${base}/saves/${save.id}/turn`, { method: "POST", body: "{}" });
  assert.equal(plain.status, 415, "a cross-site form post is refused");
});

test("parseJsonObject reads past code fences", () => {
  assert.deepEqual(parseJsonObject('```json\n{"a": 1}\n```'), { a: 1 });
  assert.throws(() => parseJsonObject("no json here"));
});

test("suggestions written while secrets are buried keep the secrets", async () => {
  const sleep = () => new Promise((done) => setTimeout(done, 50));
  let releaseBury = () => {};
  let releaseHooks = () => {};
  mode.buryHold = new Promise((done) => (releaseBury = done));
  mode.hooksHold = new Promise((done) => (releaseHooks = done));
  const save = await newSave();
  const hooks = post(`/saves/${save.id}/hooks`);
  await sleep(); // the suggestions have read the opening and wait for the model
  mode.buryHold = null;
  releaseBury();
  await sleep(); // the secrets are written into the opening
  mode.hooksHold = null;
  releaseHooks();
  assert.equal((await hooks).status, 200);
  const opening = (await get(`/saves/${save.id}`)).path[0]!;
  assert.equal(opening.hooks.length, 3);
  assert.equal(opening.state.facts.filter((f) => f.secret).length, 1);
});

test("secrets buried while a turn is being written are carried into it", async () => {
  const sleep = () => new Promise((done) => setTimeout(done, 50));
  let releaseBury = () => {};
  let releaseTurn = () => {};
  mode.buryHold = new Promise((done) => (releaseBury = done));
  const save = await newSave();
  mode.hold = new Promise((done) => (releaseTurn = done));
  const turn = post(`/saves/${save.id}/turn`, {});
  await sleep(); // the turn has read the opening and waits for the model
  mode.buryHold = null;
  releaseBury();
  await sleep(); // the secrets land in the opening
  mode.hold = null;
  releaseTurn();
  assert.equal((await events(await turn)).at(-1), "done");
  const head = (await get(`/saves/${save.id}`)).path.at(-1)!;
  assert.equal(head.state.facts.filter((f) => f.secret && f.source === "ai").length, 1);
});
