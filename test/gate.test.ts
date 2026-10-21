import assert from "node:assert/strict";
import { test } from "node:test";
import { Gate, GateError, lane } from "../server/gate.ts";

const tick = () => new Promise((done) => setImmediate(done));

test("a few at a time; players before background work; a slot given back lets the next in", async () => {
  const gate = new Gate({ slots: 2 });
  const order: string[] = [];
  const held: (() => void)[] = [];
  const ask = (name: string, background = false) =>
    lane.run({ background }, async () => {
      const leave = await gate.enter();
      order.push(name);
      held.push(leave);
    });
  void ask("a");
  void ask("b");
  void ask("bg", true);
  const heard: number[] = [];
  void lane.run({ tell: { queued: (n) => heard.push(n) } }, async () => {
    held.push(await gate.enter());
    order.push("c");
  });
  await tick();
  assert.deepEqual(order, ["a", "b"], "two at a time");
  assert.deepEqual(heard, [0], "nobody waits ahead of the player: the background work came first but ranks lower");
  held[0]!();
  held[0]!(); // giving back twice frees one slot only
  await tick();
  assert.deepEqual(order, ["a", "b", "c"], "the player before the background work");
  assert.deepEqual(heard, [0, -1], "told once through");
  held[1]!();
  await tick();
  assert.deepEqual(order, ["a", "b", "c", "bg"]);
  assert.equal(gate.today(), 4);
});

test("work given up leaves the queue without spending a request", async () => {
  const gate = new Gate({ slots: 1 });
  const leave = await gate.enter();
  const giveUp = new AbortController();
  const waiting = lane.run({ signal: giveUp.signal }, () => gate.enter());
  await tick();
  giveUp.abort();
  await assert.rejects(waiting, GateError);
  leave();
  assert.equal(gate.today(), 1, "the one given up was never let through");
  await assert.rejects(lane.run({ signal: giveUp.signal }, () => gate.enter()), GateError);
});

test("a ceiling per minute, a pause after 'too many', and the day's allowance, remembered across restarts", async () => {
  let clock = Date.UTC(2026, 9, 21, 4);
  const kept = new Map<string, number>();
  const remember = { read: (day: string) => kept.get(day) ?? 0, write: (day: string, n: number) => void kept.set(day, n) };
  const gate = new Gate({ slots: 5, perMinute: 2, dayLimit: 4, remember, now: () => clock });
  const passed: number[] = [];
  const ask = (n: number) => void gate.enter().then((leave) => (passed.push(n), leave()));
  ask(1);
  ask(2);
  ask(3);
  await tick();
  assert.deepEqual(passed, [1, 2], "the third waits for the minute");
  clock += 61_000;
  gate.pause(0); // look again now
  await tick();
  assert.deepEqual(passed, [1, 2, 3]);
  gate.pause(30_000);
  ask(4);
  await tick();
  assert.deepEqual(passed, [1, 2, 3], "paused");
  clock += 31_000;
  gate.pause(0);
  await tick();
  assert.deepEqual(passed, [1, 2, 3, 4]);
  assert.equal(gate.open(), false, "new work stops short of the allowance");
  await assert.rejects(gate.enter(), GateError);
  const restarted = new Gate({ dayLimit: 4, remember, now: () => clock });
  assert.equal(restarted.today(), 4, "a restart remembers the day's count");
  await assert.rejects(restarted.enter(), GateError);
  clock += 86_400_000;
  assert.equal(gate.open(), true, "a new day");
});
