import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import type { Save, SaveView, World } from "../shared/types.ts";
import { createApi } from "../server/app.ts";
import { Store } from "../server/db.ts";
import { fakeModel, type Message, type Model } from "../server/model.ts";

// A fake model that keeps the prompts it was given.
const fake = fakeModel();
const story: Message[][] = [];
const memory: Message[][] = [];
const model: Model = {
  stream(messages, options) {
    if (messages[0]!.content.includes("co-author")) story.push(messages);
    if (messages[0]!.content.includes("long-term memory")) memory.push(messages);
    return fake.stream(messages, options);
  },
  json: fake.json,
};
// A thinking model that cannot write the memory.
const broken: Model = {
  async *stream() {
    throw new Error("provider timed out");
  },
  json: fake.json,
};

const servers: Server[] = [];
after(() => servers.forEach((s) => s.close()));

/** A server whose reach is just above the rules and the world, so a few turns fill it. */
async function start(thinker: Model) {
  const store = new Store(join(mkdtempSync(join(tmpdir(), "simulora-")), "test.db"));
  const api = createApi(store, model, { thinker, writer: model, memoryAt: 1200, memoryKeep: 60 });
  const server = createServer((req, res) => void api(req, res));
  servers.push(server);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const send = async <T>(method: string, path: string, body: unknown) =>
    (await (
      await fetch(base + path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
    ).json()) as T;
  const world = await send<World>("POST", "/worlds", { title: "W", opening: "Start." });
  const save = await send<Save>("POST", "/saves", { worldId: world.id });
  const turn = async (input: string) => {
    const text = await (
      await fetch(`${base}/saves/${save.id}/turn`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      })
    ).text();
    assert.match(text, /event: done/);
    return text.includes('"phase":"memory"');
  };
  const view = async () => (await (await fetch(`${base}/saves/${save.id}`)).json()) as SaveView;
  const undo = (headId: string) => send<SaveView>("PATCH", `/saves/${save.id}`, { headId });
  /** Plays until a turn writes the memory; returns that turn's number. */
  const playUntilMemory = async (first: number) => {
    for (let i = first; i < first + 60; i++) if (await turn(`move ${i}`)) return i;
    assert.fail("the memory was never written");
  };
  return { turn, view, undo, playUntilMemory };
}

test("a story that outgrows the model's reach is folded into a memory the next turns read", async () => {
  const game = await start(model);
  const wrote = await game.playUntilMemory(1);
  let view = await game.view();
  const written = view.path.at(-1)!;
  const through = view.path.findIndex((n) => n.id === written.memory!.through);
  assert.ok(through > 0 && through < view.path.length - 1, "the newest turns stay whole");

  await game.turn("after");
  let prompt = story.at(-1)![1]!.content;
  assert.match(prompt, /Memory of the earlier turns/);
  assert.match(prompt, /Remembered \d+ turns/);
  assert.doesNotMatch(prompt, /\(move 1\)/, "the folded turns are no longer sent");
  assert.match(prompt, new RegExp(`move ${wrote}`), "the newest turns still are");

  // The next memory starts from this one and the turns after it.
  await game.playUntilMemory(wrote + 2);
  assert.match(memory.at(-1)![1]!.content, /The earlier notes:\n- \[Turn \d+\] Remembered/);
  view = await game.view();
  assert.notEqual(view.path.at(-1)!.memory!.through, written.memory!.through);

  // Undone to before the first memory, the whole story is read again.
  await game.undo(view.path[2]!.id);
  await game.turn("again");
  prompt = story.at(-1)![1]!.content;
  assert.doesNotMatch(prompt, /Memory of the earlier turns/);
  assert.match(prompt, /\(move 1\)/);
});

test("a memory the thinking model cannot write is written without thinking", async () => {
  const game = await start(broken);
  await game.playUntilMemory(1);
  const head = (await game.view()).path.at(-1)!;
  assert.ok(head.memory?.notes.length, "the memory was written all the same");
});
