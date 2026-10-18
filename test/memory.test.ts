import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import type { Save, SaveView, World } from "../shared/types.ts";
import { createApi } from "../server/app.ts";
import { Store } from "../server/db.ts";
import { fakeModel, type Message, type Model } from "../server/model.ts";

// A fake model that keeps the story prompts it was given.
const fake = fakeModel();
const prompts: Message[][] = [];
const model: Model = {
  stream(messages, options) {
    if (messages[0]!.content.includes("co-author")) prompts.push(messages);
    return fake.stream(messages, options);
  },
  json: fake.json,
};

let server: Server;
let base = "";
before(async () => {
  // A reach just above the rules and the world, so a few turns fill it.
  const api = createApi(new Store(join(mkdtempSync(join(tmpdir(), "simulora-")), "test.db")), model, {
    memoryAt: 1200,
    memoryKeep: 60,
  });
  server = createServer((req, res) => void api(req, res));
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
});
after(() => server.close());

const post = async <T>(path: string, body: unknown) =>
  (await (
    await fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  ).json()) as T;
const turn = async (saveId: string, input: string) => {
  const text = await (
    await fetch(`${base}/saves/${saveId}/turn`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input }),
    })
  ).text();
  assert.match(text, /event: done/);
  return text;
};

test("a story that outgrows the model's reach is folded into a memory the next turns read", async () => {
  const world = await post<World>("/worlds", { title: "W", opening: "Start." });
  const save = await post<Save>("/saves", { worldId: world.id });
  let wrote = "";
  for (let i = 1; wrote === "" && i < 60; i++) {
    const events = await turn(save.id, `move ${i}`);
    if (events.includes('"phase":"memory"')) wrote = `move ${i}`;
  }
  assert.ok(wrote, "the memory was written once the story grew long");
  const view = (await (await fetch(`${base}/saves/${save.id}`)).json()) as SaveView;
  const memory = view.path.at(-1)!.memory!;
  assert.ok(memory.notes.length > 0);
  const through = view.path.findIndex((n) => n.id === memory.through);
  assert.ok(through > 0 && through < view.path.length - 1, "the newest turns stay whole");

  await turn(save.id, "after");
  const prompt = prompts.at(-1)![1]!.content;
  assert.match(prompt, /Memory of the earlier turns/);
  assert.match(prompt, /Remembered \d+ turns/);
  assert.doesNotMatch(prompt, /\(move 1\)/, "the folded turns are no longer sent");
  assert.match(prompt, new RegExp(`move ${view.path.length - 1}`), "the newest turns still are");
});
