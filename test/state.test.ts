import assert from "node:assert/strict";
import { test } from "node:test";
import type { WorldState } from "../shared/types.ts";
import { applyChanges, parseChanges } from "../server/state.ts";

const world = (): WorldState => ({
  clock: "Night",
  places: [{ id: "p1", name: "Teahouse", description: "" }],
  characters: [
    { id: "c1", name: "Zhou", persona: "", goals: "", placeId: "p1", notes: "", knows: [] },
    { id: "c2", name: "Qing", persona: "", goals: "", placeId: "p1", notes: "", knows: [] },
  ],
  facts: [{ id: "s1", text: "Qing was the guide.", secret: true, revealed: false, source: "author" }],
  threads: [{ id: "t1", title: "Where is the caravan?", resolved: false, resolution: "" }],
  relationships: [],
});

test("applies a turn's changes and skips the ones naming unknown things", () => {
  const before = world();
  const { state, applied } = applyChanges(
    before,
    parseChanges([
      { type: "move", character: "qing", place: "Mountain Pass", note: "Qing leaves." },
      { type: "move", character: "Nobody", place: "Teahouse", note: "" },
      { type: "reveal", fact: "s1", note: "" },
      { type: "learn", character: "Zhou", fact: "s1", note: "" },
      { type: "relationship", a: "Zhou", b: "Qing", text: "Wary", note: "" },
      { type: "relationship", a: "Qing", b: "Zhou", text: "Trusting", note: "" },
      { type: "resolve", thread: "t1", resolution: "Lost in the snow", note: "" },
      { type: "clock", text: "Dawn", note: "" },
      { type: "fact", text: "The pass is snowed in.", note: "" },
      { type: "nonsense" },
    ]),
  );
  const pass = state.places.find((p) => p.name === "Mountain Pass");
  assert.ok(pass, "a move to a new place creates it");
  assert.equal(state.characters[1]!.placeId, pass.id);
  assert.equal(state.facts[0]!.revealed, true);
  assert.deepEqual(state.characters[0]!.knows, ["s1"]);
  assert.deepEqual(state.relationships, [{ a: "c1", b: "c2", text: "Trusting" }]);
  assert.equal(state.threads[0]!.resolved, true);
  assert.equal(state.clock, "Dawn");
  assert.equal(state.facts.at(-1)!.source, "story");
  assert.equal(applied.length, 8, "the unknown character and the nonsense type are dropped");
  assert.equal(before.facts[0]!.revealed, false, "the earlier state is not touched");
});
