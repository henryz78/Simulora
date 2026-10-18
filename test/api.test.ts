import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { Save, SaveView, TurnNode, World } from "../shared/types.ts";
import { createApi } from "../server/app.ts";
import { Store } from "../server/db.ts";
import { fakeModel } from "../server/model.ts";

let server: Server;
let base = "";

before(async () => {
  const store = new Store(join(mkdtempSync(join(tmpdir(), "simulora-")), "test.db"));
  const api = createApi(store, fakeModel());
  server = createServer((req, res) => void api(req, res));
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
});
after(() => server.close());

const call = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const response = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.ok(response.ok, `${method} ${path} → ${response.status}`);
  return (await response.json()) as T;
};

async function playTurn(saveId: string, actor: string, input: string): Promise<{ story: string; node: TurnNode }> {
  const response = await fetch(`${base}/saves/${saveId}/turn`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ actor, input }),
  });
  let story = "";
  let node: TurnNode | undefined;
  for (const block of (await response.text()).split("\n\n")) {
    const name = /^event: (\w+)/.exec(block)?.[1];
    const data = /\ndata: (.*)/.exec(block)?.[1];
    if (!name || !data) continue;
    if (name === "story") story += (JSON.parse(data) as { text: string }).text;
    if (name === "done") node = (JSON.parse(data) as { node: TurnNode }).node;
    if (name === "error") assert.fail(data);
  }
  assert.ok(node, "the turn finished");
  return { story, node };
}

test("build a world, play, undo to any turn and branch", async () => {
  const world = await call<World>("POST", "/worlds", {
    title: "Snow Night",
    opening: "Snow beats on the door.",
    state: {
      clock: "Night",
      places: [{ id: "p1", name: "Teahouse", description: "Warm" }],
      characters: [{ id: "c1", name: "Zhou", placeId: "p1", knows: ["f1", "missing"] }],
      facts: [{ id: "f1", text: "A caravan is missing." }],
    },
  });
  assert.deepEqual(world.state.characters[0]!.knows, ["f1"], "unknown fact ids are dropped");

  const save = await call<Save>("POST", "/saves", { worldId: world.id });
  const first = await playTurn(save.id, "c1", "pour tea");
  assert.match(first.story, /pour tea/);
  assert.equal(first.node.state.clock, "A little later");
  assert.equal(first.node.hooks.length, 3);
  const second = await playTurn(save.id, "director", "");

  let view = await call<SaveView>("GET", `/saves/${save.id}`);
  assert.deepEqual(
    view.path.map((n) => n.id).slice(1),
    [first.node.id, second.node.id],
  );

  // Undo back to the opening; the later turns stay in the tree.
  view = await call<SaveView>("PATCH", `/saves/${save.id}`, { headId: view.path[0]!.id });
  assert.equal(view.path.length, 1);
  assert.equal(view.tree.length, 3);

  const branch = await call<Save>("POST", `/saves/${save.id}/branch`, { nodeId: first.node.id });
  const branchView = await call<SaveView>("GET", `/saves/${branch.id}`);
  assert.equal(branchView.path.at(-1)!.id, first.node.id);

  const settings = await call<SaveView>("PATCH", `/saves/${save.id}`, {
    settings: { pace: "intense", person: "nope" },
  });
  assert.equal(settings.save.settings.pace, "intense");
  assert.equal(settings.save.settings.person, "third");
});

test("the AI drafts a world and buries secrets at the start and as the story goes on", async () => {
  const draft = await call<World>("POST", "/drafts", { idea: "a harbor whose lighthouse came back on" });
  assert.equal(draft.title, "Fake Harbor");
  assert.equal(draft.state.characters[0]!.placeId, draft.state.places[0]!.id, "places are matched by name");
  assert.equal(draft.state.facts.length, 1);

  const world = await call<World>("POST", "/worlds", draft);
  const save = await call<Save>("POST", "/saves", { worldId: world.id });
  // The first turn waits for the secrets buried at the start.
  await playTurn(save.id, "director", "");
  const ai = (v: SaveView) => v.path.at(-1)!.state.facts.filter((f) => f.secret && f.source === "ai");
  assert.equal(ai(await call<SaveView>("GET", `/saves/${save.id}`)).length, 1);

  for (let i = 0; i < 3; i++) await playTurn(save.id, "director", "");
  // The fourth turn buries more; the next turn waits for them.
  await playTurn(save.id, "director", "");
  const view = await call<SaveView>("GET", `/saves/${save.id}`);
  assert.equal(ai(view).length, 2);
  assert.ok(ai(view).every((f) => !f.revealed));
});
