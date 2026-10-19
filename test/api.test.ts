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
import { outcomeOf } from "../server/state.ts";

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
  assert.equal(first.story, first.node.story, "the player saw exactly the story that was kept");
  assert.match(first.node.story, /looks up\.\nIt is quiet\.$/, "escapes cut across pieces come out whole");
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
  assert.equal(settings.save.settings.thinking, false, "thinking is off unless asked for");
  const notes = await call<SaveView>("PATCH", `/saves/${save.id}`, { notes: "Zhou owes me." });
  assert.equal(notes.save.notes, "Zhou owes me.");
  assert.equal((await call<SaveView>("PATCH", `/saves/${save.id}`, { title: "Renamed" })).save.notes, "Zhou owes me.", "kept when not sent");
});

test("the AI drafts a world and buries secrets at the start and as the story goes on", async () => {
  const draft = await call<World>("POST", "/drafts", { idea: "a harbor whose lighthouse came back on" });
  assert.equal(draft.title, "Fake Harbor");
  assert.equal(draft.state.characters[0]!.placeId, draft.state.places[0]!.id, "places are matched by name");
  assert.equal(draft.state.facts.length, 1);

  // The same request, to paste into another AI, and its reply pasted back.
  const { prompt } = await call<{ prompt: string }>("POST", "/drafts/prompt", { idea: "a harbor town" });
  assert.match(prompt, /a harbor town/);
  assert.match(prompt, /search the web/);
  const reply = '```json\n{"title": "Pasted", "opening": "Rain.", "characters": [{"name": "Lin", "persona": "She says "no" often"}]}\n```';
  const pasted = await call<World>("POST", "/drafts/import", { text: reply });
  assert.equal(pasted.title, "Pasted");
  assert.equal(pasted.state.characters[0]!.persona, 'She says "no" often', "a bare quote in another AI's reply is read");
  const prose =
    'Here is {the world} you asked for: ```json\n{"title": "Fenced", "opening": "Snow.", "characters": [{"name": "Ana"}]}\n``` Enjoy {it}!';
  assert.equal((await call<World>("POST", "/drafts/import", { text: prose })).title, "Fenced", "prose with braces first");
  const refused = await fetch(`${base}/drafts/import`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "Sorry, I can't." }),
  });
  assert.equal(refused.status, 400);
  assert.match(((await refused.json()) as { error: string }).error, /not a world/);

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

test("every few turns the people away act on their own; someone the story brings in is left as it tells", async () => {
  const world = await call<World>("POST", "/worlds", {
    title: "Two Rooms",
    opening: "Snow.",
    state: {
      places: [{ id: "p1", name: "Teahouse" }, { id: "p2", name: "Mill" }],
      characters: [
        { id: "c1", name: "Zhou", placeId: "p1" },
        { id: "c2", name: "Lan", placeId: "p2", goals: "Hide the ledger" },
      ],
    },
  });
  const save = await call<Save>("POST", "/saves", { worldId: world.id });
  const lan = (node: TurnNode) => node.state.characters.find((c) => c.name === "Lan")!;
  let node!: TurnNode;
  for (let turn = 1; turn <= 5; turn++) ({ node } = await playTurn(save.id, "c1", "wait"));
  assert.deepEqual(node.meanwhile, [{ character: "Lan", did: "Locked the back door." }], "the fifth turn");
  assert.equal(lan(node).notes, "Behind a locked door");
  assert.equal(lan(node).persona, "", "who they are is not the step's to change");
  for (let turn = 6; turn <= 10; turn++) ({ node } = await playTurn(save.id, "c1", turn === 10 ? "Lan walks in" : "wait"));
  assert.equal(node.meanwhile, undefined, "named in the story: in the scene, not away");
  // A jump in time moves them at once, off the five-turn beat, before the story is told.
  await playTurn(save.id, "c1", "wait"); // the last story named her: she was in the scene
  ({ node } = await playTurn(save.id, "c1", "三天后，我在 Teahouse 喝茶"));
  assert.deepEqual(node.meanwhile, [{ character: "Lan", did: "Locked the back door." }], "turn 12, a jump");
  assert.deepEqual(node.offstage?.map((c) => c.type), ["move", "status"], "kept for recording the turn again");
  assert.equal(node.state.places.find((p) => p.id === lan(node).placeId)?.name, "Cellar", "where she is after the jump");
  // Switched off, nobody moves.
  await call("PATCH", `/saves/${save.id}`, { settings: { meanwhile: false } });
  for (let turn = 13; turn <= 15; turn++) ({ node } = await playTurn(save.id, "c1", "wait"));
  assert.equal(node.meanwhile, undefined);
});

test("with the dice on, a risky attempt is settled by a die; an ordinary act or the dice off, by nothing", async () => {
  const world = await call<World>("POST", "/worlds", {
    title: "Wall", opening: "A wall.", state: { places: [{ id: "p1", name: "Yard" }], characters: [{ id: "c1", name: "Zhou", placeId: "p1" }] },
  });
  const save = await call<Save>("POST", "/saves", { worldId: world.id });
  assert.equal((await playTurn(save.id, "c1", "I climb the wall")).node.dice, undefined, "off by default");
  await call("PATCH", `/saves/${save.id}`, { settings: { dice: true } });
  const { node } = await playTurn(save.id, "c1", "I climb the wall");
  assert.equal(node.dice?.difficulty, "hard");
  assert.ok(node.dice!.roll >= 1 && node.dice!.roll <= 20);
  assert.equal(node.dice!.outcome, outcomeOf(node.dice!.roll, "hard"));
  assert.match(node.story, { success: /it succeeds/, cost: /it succeeds/, fail: /it fails/ }[node.dice!.outcome], "told as it fell");
  assert.equal((await playTurn(save.id, "director", "Zhou climbs the wall")).node.dice, undefined, "a director's turn");
  assert.equal((await playTurn(save.id, "c1", "I look around")).node.dice, undefined, "no gamble");
});

test("someone placed nowhere and not named lately can act away too", async () => {
  const world = await call<World>("POST", "/worlds", {
    title: "Unplaced", opening: "Rain.",
    state: { places: [{ id: "p1", name: "Inn" }], characters: [{ id: "c1", name: "Zhou", placeId: "p1" }, { id: "c2", name: "Moss" }] },
  });
  const save = await call<Save>("POST", "/saves", { worldId: world.id });
  let node!: TurnNode;
  for (let turn = 1; turn <= 5; turn++) ({ node } = await playTurn(save.id, "c1", "wait"));
  assert.deepEqual(node.meanwhile?.map((m) => m.character), ["Moss"]);
  // Named by the action, they may be right here: not away.
  for (let turn = 6; turn <= 10; turn++) ({ node } = await playTurn(save.id, "c1", turn === 10 ? "I call Moss over" : "wait"));
  assert.equal(node.meanwhile, undefined);
});

test("the recap is written once for the turn it stops at and kept", async () => {
  const world = await call<World>("POST", "/worlds", {
    title: "Back", opening: "Snow.", state: { places: [{ id: "p1", name: "Inn" }], characters: [{ id: "c1", name: "Zhou", placeId: "p1" }] },
  });
  const save = await call<Save>("POST", "/saves", { worldId: world.id });
  await playTurn(save.id, "c1", "wait");
  const first = await call<{ recap: string }>("POST", `/saves/${save.id}/recap`);
  assert.equal(first.recap, "上回说到，风雪还没停。");
  const view = await call<SaveView>("GET", `/saves/${save.id}`);
  assert.equal(view.path.at(-1)!.recap, first.recap, "kept on the turn");
});

test("an interview answers out of the story and leaves the world as it was", async () => {
  const world = await call<World>("POST", "/worlds", {
    title: "Talk", opening: "Snow.", state: { places: [{ id: "p1", name: "Inn" }], characters: [{ id: "c1", name: "Zhou", placeId: "p1" }] },
  });
  const save = await call<Save>("POST", "/saves", { worldId: world.id });
  await playTurn(save.id, "c1", "wait");
  const before = await call<SaveView>("GET", `/saves/${save.id}`);
  const { answer } = await call<{ answer: string }>("POST", `/saves/${save.id}/interview`, {
    character: "c1", talk: [{ q: "Hello?", a: "Hm." }], question: "What do you fear?",
  });
  assert.match(answer, /What do you fear\?/);
  const after = await call<SaveView>("GET", `/saves/${save.id}`);
  assert.deepEqual(after.tree.length, before.tree.length, "no turn added");
  assert.deepEqual(after.path.at(-1)!.state, before.path.at(-1)!.state, "the world unchanged");
  const bad = await fetch(`${base}/saves/${save.id}/interview`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ character: "nobody", question: "?" }),
  });
  assert.equal(bad.status, 400);
});

test("a turn told through another's eyes is written once, kept, and changes nothing", async () => {
  const world = await call<World>("POST", "/worlds", {
    title: "Eyes", opening: "Snow.",
    state: { places: [{ id: "p1", name: "Inn" }], characters: [{ id: "c1", name: "Zhou", placeId: "p1" }, { id: "c2", name: "Lan", placeId: "p1" }] },
  });
  const save = await call<Save>("POST", "/saves", { worldId: world.id });
  const { node } = await playTurn(save.id, "c1", "pour tea");
  const before = await call<SaveView>("GET", `/saves/${save.id}`);
  const seen = await call<{ story: string }>("POST", `/saves/${save.id}/view`, { node: node.id, character: "c2" });
  assert.equal(seen.story, "Lan watched it all, and said nothing.");
  const after = await call<SaveView>("GET", `/saves/${save.id}`);
  assert.deepEqual(after.path.at(-1)!.views, { c2: seen.story }, "kept on the turn");
  assert.deepEqual(after.path.at(-1)!.state, before.path.at(-1)!.state, "the world unchanged");
  const opening = await fetch(`${base}/saves/${save.id}/view`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ node: before.path[0]!.id, character: "c2" }),
  });
  assert.equal(opening.status, 400, "the opening has no one's turn to see again");
});
