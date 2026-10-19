import assert from "node:assert/strict";
import { test } from "node:test";
import type { WorldState } from "../shared/types.ts";
import { applyChanges, bury, describeState, parseChanges, sceneOf } from "../server/state.ts";

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

test("buries secrets the characters can know, skipping blanks and repeats", () => {
  const before = world();
  const { state, buried } = bury(before, [
    { text: "Zhou sold the caravan's route.", knownBy: ["zhou", "Nobody"] },
    { text: "Qing was the guide." },
    { text: "  " },
    "junk",
  ]);
  assert.equal(buried.length, 1);
  assert.deepEqual(
    { secret: buried[0]!.secret, revealed: buried[0]!.revealed, source: buried[0]!.source },
    { secret: true, revealed: false, source: "ai" },
  );
  assert.deepEqual(state.characters[0]!.knows, [buried[0]!.id]);
  assert.equal(before.facts.length, 1, "the earlier state is untouched");

  const revealed = applyChanges(state, [{ type: "reveal", fact: buried[0]!.id, note: "Qing found the letter." }]);
  assert.equal(revealed.state.facts.at(-1)!.revealNote, "Qing found the letter.");
});

test("a lasting change in someone rewrites who they are; only what is given changes", () => {
  const { state } = applyChanges(
    world(),
    parseChanges([
      { type: "persona", character: "Zhou", persona: "Bitter since the fire, trusts no one.", note: "" },
      { type: "persona", character: "Qing", goals: "Find her brother.", note: "" },
      { type: "persona", character: "Qing", note: "" },
    ]),
  );
  assert.equal(state.characters[0]!.persona, "Bitter since the fire, trusts no one.");
  assert.equal(state.characters[0]!.goals, "");
  assert.deepEqual([state.characters[1]!.persona, state.characters[1]!.goals], ["", "Find her brother."]);
});

test("people in the scene are told in full, people elsewhere in a line, and an action can bring them in", () => {
  const state = world();
  state.places.push({ id: "p2", name: "Pass", description: "Wind and rock." });
  state.characters.push({
    id: "c3", name: "Lan", persona: "A smuggler. Owes everyone.", goals: "Get out", placeId: "p2", notes: "Hiding", knows: [],
  });
  const here = describeState(state, { scene: sceneOf(state, "c1") });
  assert.match(here, /Characters in the scene:\n- Zhou[^\n]*Persona/);
  assert.match(here, /Characters elsewhere[^\n]*\n- Lan \(at Pass\)\. A smuggler\. Goals: Get out\. Now: Hiding\./, "a line");
  assert.doesNotMatch(here, /Owes everyone|Wind and rock/);
  assert.match(here, /Other places: Pass\./);
  state.characters.push({ id: "c4", name: "Mo", persona: "A ghost.", goals: "", placeId: null, notes: "", knows: [] });
  assert.match(describeState(state, { scene: sceneOf(state, "c1") }), /- Mo \(at somewhere unspecified\)\. Persona/, "placed nowhere: maybe here");

  // Going there or calling them in brings the place and its people into the scene.
  for (const input of ["I ride to the Pass", "I send for Lan"]) {
    assert.match(describeState(state, { scene: sceneOf(state, "c1", input) }), /- Lan \(at Pass\)\. Persona: A smuggler\. Owes/);
  }
  // A part of a name is enough: "八楼走廊" for "八楼走廊与巨怪挂毯".
  state.places.push({ id: "p3", name: "八楼走廊与巨怪挂毯", description: "挂毯后有门。" });
  assert.deepEqual(sceneOf(state, "c1", "快十点了，我去八楼走廊看看"), ["p1", "p3"]);
  // The director sees everything.
  assert.equal(sceneOf(state, "director"), null);
  assert.match(describeState(state, { scene: sceneOf(state, "director") }), /- Lan \(at Pass\)\. Persona/);
});

test("a line for someone elsewhere keeps the first sentence and their goals, and English names match whole words", () => {
  const state = world();
  state.places.push({ id: "p2", name: "Hall of Mirrors", description: "" });
  state.characters.push(
    { id: "c3", name: "Lan", persona: "Dr. Chen's runner,\nquick and quiet. Owes everyone.", goals: "Get out of town", placeId: "p2", notes: "", knows: [] },
  );
  const line = describeState(state, { scene: sceneOf(state, "c1", "we run out of time with a plan") }).split("\n").find((l) => l.startsWith("- Lan"));
  assert.equal(line, "- Lan (at Hall of Mirrors). Dr. Chen's runner, quick and quiet. Goals: Get out of town. Knows: nothing listed.");
  assert.deepEqual(sceneOf(state, "c1", "I go to the mirrors"), ["p1", "p2"]);
});
