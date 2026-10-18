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
const chronicle: Message[][] = [];
const model: Model = {
  stream(messages, options) {
    const system = messages[0]!.content;
    if (system.includes("co-author")) story.push(messages);
    if (system.includes("timeline and the long-term memory")) chronicle.push(messages);
    return fake.stream(messages, options);
  },
  json: fake.json,
};
// A thinking model that cannot write anything.
const broken: Model = {
  async *stream() {
    throw new Error("provider timed out");
  },
  json: fake.json,
};

const servers: Server[] = [];
after(() => servers.forEach((s) => s.close()));
const sleep = (ms = 50) => new Promise((done) => setTimeout(done, ms));

/** A game whose timeline gets an entry every 3 turns. */
async function start({ thinker = model, trimAt = 1e9, timelineTokens = 1e9 } = {}) {
  const store = new Store(join(mkdtempSync(join(tmpdir(), "simulora-")), "test.db"));
  const api = createApi(store, model, { thinker, writer: model, trimAt, keepTurns: 2, chronicleTurns: 3, timelineTokens });
  const server = createServer((req, res) => void api(req, res));
  servers.push(server);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
  const send = async <T>(method: string, path: string, body: unknown) =>
    (await (
      await fetch(base + path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
    ).json()) as T;
  const world = await send<World>("POST", "/worlds", {
    title: "W",
    opening: "Start.",
    state: {
      facts: [{ text: "An old fact" }, { text: "A hidden truth", secret: true }],
      threads: [{ title: "An old question" }],
    },
  });
  const save = await send<Save>("POST", "/saves", { worldId: world.id });
  const view = async () => (await (await fetch(`${base}/saves/${save.id}`)).json()) as SaveView;
  /** Plays turns `from` to `to`, letting the timeline catch up after each. */
  const play = async (from: number, to: number) => {
    for (let i = from; i <= to; i++) {
      const text = await (
        await fetch(`${base}/saves/${save.id}/turn`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input: `move ${i}` }),
        })
      ).text();
      assert.match(text, /event: done/);
      await sleep();
    }
    return view();
  };
  const undo = (headId: string) => send<SaveView>("PATCH", `/saves/${save.id}`, { headId });
  return { play, view, undo };
}
const prompt = () => story.at(-1)![1]!.content;

test("every few turns the timeline gets an entry and the memory is checked, and the next turns read both", async () => {
  const game = await start();
  let { path } = await game.play(1, 2);
  assert.deepEqual(path[2]!.timeline, [{ from: 0, to: 2, text: "Turns 0-2 went by." }], "the opening counts");
  assert.deepEqual(path[2]!.memory, [{ turn: 2, text: "Remembered 0-2." }]);

  await game.play(3, 3);
  assert.match(prompt(), /Memory: .*\n- \[Turn 2\] Remembered 0-2\./);
  assert.match(prompt(), /Timeline: .*\n- \[Turns 0-2\] Turns 0-2 went by\./);

  // The next step is written from the turns since, with the earlier timeline and notes; entries are never changed.
  ({ path } = await game.play(4, 5));
  assert.match(chronicle.at(-1)![1]!.content, /\[Turns 0-2\].*\n[\s\S]*The earlier notes:\n- \[Turn 2\][\s\S]*\(Turn 3 to 5\)/);
  assert.deepEqual(path[5]!.timeline!.map((e) => e.text), ["Turns 0-2 went by.", "Turns 3-5 went by."]);
});

test("a timeline that grows too long merges its oldest entries", async () => {
  const game = await start({ timelineTokens: 20 });
  const { path } = await game.play(1, 17);
  const timeline = path[17]!.timeline!;
  assert.deepEqual(timeline[0], { from: 0, to: 14, text: "Merged turns 0-14." });
  assert.deepEqual(timeline.slice(1).map((e) => [e.from, e.to]), [[15, 17]]);

  // Five of the same span at a time: the merged entry waits for its own kind, it is not retold with the newer ones.
  const later = (await game.play(18, 32)).path[32]!.timeline!;
  assert.deepEqual(later.map((e) => [e.from, e.to]), [[0, 14], [15, 29], [30, 32]]);
});

test("a story that outgrows the model's reach stops sending the turns the timeline tells", async () => {
  const game = await start({ trimAt: 1350 });
  let view = await game.play(1, 12);
  const trimmed = view.path.findLast((n) => n.trimmed)!;
  const cut = view.path.findIndex((n) => n.id === trimmed.trimmed) + 1;
  const told = view.path.findLast((n) => n.timeline)!.timeline!.at(-1)!.to;
  assert.equal(cut % 3, 0, "a whole timeline step at a time");
  assert.ok(cut - 1 <= told, "only turns the timeline tells are trimmed");
  const state = view.path.at(-1)!.state;
  assert.ok(!state.facts.some((f) => f.text === "Seen: move 1"), "the facts the story added by then are dropped");
  assert.ok(state.facts.some((f) => f.text === `Seen: move ${cut}`), "not those after");
  assert.ok(state.facts.some((f) => f.text === "An old fact"), "the world's own facts stay");
  assert.ok(state.threads.some((t) => t.title === "An old question"), "and its opening questions");
  assert.ok(state.facts.some((f) => f.text === "A hidden truth"), "a hidden secret stays");

  await game.play(13, 13);
  assert.match(prompt(), /The story since then/);
  assert.doesNotMatch(prompt(), /: move 1\]/, "the trimmed turns are no longer sent");
  assert.match(prompt(), /: move 12\]/, "the newest turns still are");
  assert.doesNotMatch(prompt(), /Seen: move 1\n/, "dropped ones are no longer sent");

  // Undone to before the trim, the whole story is read again.
  view = await game.view();
  await game.undo(view.path[2]!.id);
  await game.play(3, 3);
  assert.doesNotMatch(prompt(), /The story since then/);
  assert.match(prompt(), /: move 1\]/);
});

test("a timeline the thinking model cannot write is written without thinking", async () => {
  const game = await start({ thinker: broken });
  const { path } = await game.play(1, 2);
  assert.equal(path[2]!.timeline?.length, 1);
});

test("older turns let go of their state but for one per timeline step, and cannot be resumed", async () => {
  const game = await start();
  const view = await game.play(1, 14);
  const resumable = (i: number) => view.tree.find((n) => n.id === view.path[i]!.id)!.resumable;
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(resumable), [true, false, true, false, false, true], "the opening and each step's end");
  assert.ok([5, 6, 7, 8, 9, 10, 11, 12, 13, 14].every(resumable), "and the newest ten");
  assert.equal(view.path.filter((n) => n.timeline).length, 1, "only the latest timeline is sent");
  assert.ok(view.path.slice(0, -1).every((n) => !n.state), "and only the head's state");
  const refused = await game.undo(view.path[1]!.id);
  assert.match((refused as unknown as { error: string }).error, /too far back/);
});
