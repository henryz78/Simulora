import assert from "node:assert/strict";
import { test } from "node:test";
import type { WorldState } from "../shared/types.ts";
import { applyChanges, applyKeep, bury, describeState, inPlay, keptSince, outcomeOf, parseChanges, placeNamed, readKeep, sceneOf, stillAway, withWhere } from "../server/state.ts";

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

test("someone new comes with their wants; someone who leaves the story is kept in a line until the story brings them back", () => {
  let { state } = applyChanges(
    world(),
    parseChanges([
      { type: "character", name: "Lan", persona: "A smuggler.", goals: "Goals: Get out", place: "Pass" },
      { type: "leave", character: "Qing", note: "Went south for good" },
      { type: "leave", character: "Nobody", note: "" },
    ]),
  );
  assert.equal(state.characters.find((c) => c.name === "Lan")!.goals, "Get out");
  const noted = applyChanges(state, parseChanges([{ type: "character", name: "Mei", persona: "", place: "城堡（今夜没来吃饭）" }]));
  assert.equal(noted.state.places.at(-1)!.name, "城堡", "a note in brackets is no part of a new place's name");
  const told = applyChanges(noted.state, parseChanges([
    { type: "move", character: "Mei", place: "城堡。麦格答应按她说的次序摆出这些事，凯恩傍晚离校前留下待核笔迹的单子。" },
    { type: "move", character: "Lan", place: "麦格答应按她说的次序摆出这些事，凯恩傍晚离校前留下待核笔迹的单子" },
  ]));
  assert.equal(told.state.places.length, noted.state.places.length, "a place told as a sentence is the place, a long one none");
  assert.equal(told.applied.length, 1);
  assert.equal(state.characters.find((c) => c.name === "Qing")!.gone, "Went south for good");
  for (const scene of [sceneOf(state, "c1"), null]) {
    const told = describeState(state, { scene });
    assert.doesNotMatch(told, /- Qing \(at/, "neither here nor elsewhere");
    assert.match(told, /Out of the story[^\n]*\n- Qing: Went south for good/);
  }
  assert.deepEqual(sceneOf(state, "c1", "I think of Qing"), ["p1"], "naming them brings no place in");

  // Met again: back where the story puts them, by a move or as if new.
  for (const back of [
    { type: "move", character: "Qing", place: "Pass" },
    { type: "character", name: "Qing", persona: "Someone else", goals: "", place: "Pass" },
  ]) {
    const again = applyChanges(state, parseChanges([back])).state.characters.find((c) => c.name === "Qing")!;
    assert.equal(again.gone, undefined);
    assert.equal(again.placeId, state.places.find((p) => p.name === "Pass")!.id);
    assert.equal(again.persona, "", "as they were");
  }
  // A turn that moves someone away as they leave, in either order, leaves them gone.
  for (const order of [["leave", "move"], ["move", "leave"]]) {
    const raw = order.map((type) => ({ type, character: "Zhou", place: "Abroad", note: "Fled" }));
    assert.equal(applyChanges(world(), parseChanges(raw)).state.characters[0]!.gone, "Fled", order.join(", "));
  }
  // News of someone gone leaves them gone; playing them brings them back, and no one else.
  assert.ok(applyChanges(state, parseChanges([{ type: "status", character: "Qing", notes: "Missed" }])).state.characters[1]!.gone);
  const played = inPlay(state, "c2");
  assert.equal(played.characters[1]!.gone, undefined);
  assert.equal(state.characters[1]!.gone, "Went south for good", "the turn before is left as it was");
  assert.equal(inPlay(state, "c1"), state);
  // Leaving twice keeps the first reason.
  ({ state } = applyChanges(state, parseChanges([{ type: "leave", character: "Qing", note: "Again" }])));
  assert.equal(state.characters.find((c) => c.name === "Qing")!.gone, "Went south for good");
});

test("the reply's where moves the player's character, unless the changes move them or they are there", () => {
  const state = world();
  const move = (changes: Parameters<typeof withWhere>[1], where: string, who: string | null = "Zhou") =>
    withWhere(state, changes, who, where).filter((c) => c.type === "move");
  assert.deepEqual(move([], "Great Hall"), [{ type: "move", character: "Zhou", place: "Great Hall", note: "" }]);
  assert.deepEqual(move([], "teahouse"), [], "there already");
  assert.deepEqual(move([], " "), []);
  assert.deepEqual(move([], "…"), [], "the sample's dots are no place");
  assert.deepEqual(move([], "Great Hall", null), [], "a director's turn with no character of the player's");
  const own = { type: "move" as const, character: "zhou", place: "Pass", note: "" };
  assert.deepEqual(move([own], "Great Hall"), [own], "the changes' own move stands");
});

test("a listed place dressed up by the model is still that place, never a shorter name for a longer one", () => {
  const state = world();
  state.places.push(
    { id: "p2", name: "大礼堂", description: "" },
    { id: "p3", name: "大礼堂外的走廊", description: "" },
  );
  const at = (place: string) => {
    const after = applyChanges(state, parseChanges([{ type: "move", character: "Zhou", place }])).state;
    return [after.characters[0]!.placeId, after.places.length];
  };
  assert.deepEqual(at("霍格沃茨·大礼堂"), ["p2", 3]);
  assert.deepEqual(at("霍格沃茨·大礼堂外的走廊（窗边）"), ["p3", 3], "the longest listed name it holds");
  assert.deepEqual(at("大礼堂（门口）"), ["p2", 3]);
  assert.deepEqual(at("Inn · Teahouse"), ["p1", 3]);
  assert.equal(at("礼堂")[1], 4, "a part of a name is a new place");
  assert.equal(at("大礼堂外")[1], 4, "a name going on past a listed one is another place");
  assert.equal(at("Town Teahouse")[1], 4, "an English word in front makes another place");
  state.places.push({ id: "p4", name: "书房", description: "" });
  assert.deepEqual(at("书房（二楼）"), ["p4", 4], "two characters are a name too");
  state.places.push({ id: "p5", name: "霍格莫德·三把扫帚与蜂蜜公爵", description: "" });
  assert.deepEqual(at("霍格莫德·蜂蜜公爵"), ["p5", 5], "half of a place made of two");
  assert.deepEqual(at("三把扫帚"), ["p5", 5]);
  assert.equal(at("蜂蜜")[1], 6, "but not a part of a half");
  const own = (places: string[], name: string) =>
    placeNamed({ ...world(), places: places.map((n, i) => ({ id: `q${i}`, name: n, description: "" })) }, name)?.name;
  assert.equal(own(["城堡·走廊"], "四楼走廊"), undefined, "a bare tail stands alone or after a mark");
  assert.equal(own(["及时雨客栈"], "时雨客栈"), undefined);
  assert.equal(own(["A街与B街", "B街"], "镇·B街"), "B街", "a whole name before a half");
  assert.deepEqual(withWhere(state, [], "Zhou", "Old Town · Teahouse"), [], "there already, as the model names it");
});

test("what the people away did is kept only for those the turn left alone", () => {
  const keep = stillAway(["Lan", "Moss"], "Moss knocks at the door.", parseChanges([{ type: "status", character: "Zhou", notes: "x" }]));
  assert.equal(keep("lan"), true);
  assert.equal(keep("Moss"), false, "named in the story");
  assert.equal(keep("Zhou"), false, "not away");
  assert.equal(stillAway(["Lan"], "", parseChanges([{ type: "move", character: "Lan", place: "Teahouse" }]))("Lan"), false);
});

test("a d20 settles an attempt by its difficulty: harder fails more and comes off clean less", () => {
  const share = (d: "easy" | "normal" | "hard", o: string) =>
    Array.from({ length: 20 }, (_, i) => outcomeOf(i + 1, d)).filter((x) => x === o).length / 20;
  assert.deepEqual([share("easy", "success"), share("easy", "cost"), share("easy", "fail")], [0.65, 0.25, 0.1]);
  assert.deepEqual([share("normal", "success"), share("normal", "cost"), share("normal", "fail")], [0.45, 0.3, 0.25]);
  assert.deepEqual([share("hard", "success"), share("hard", "cost"), share("hard", "fail")], [0.25, 0.3, 0.45]);
});

test("days later the scene is where the player now says they are, not where they were", () => {
  const state = world();
  state.places.push({ id: "p2", name: "Hall", description: "" });
  assert.deepEqual(sceneOf(state, "c1", "Three days later, at breakfast in the Hall", true), ["p2"]);
  assert.deepEqual(sceneOf(state, "c1", "Three days later", true), ["p1"], "named nowhere: where they were");
  assert.deepEqual(sceneOf(state, "c1", "Three days later Qing comes by", true), ["p1"], "a person named: still there");
  assert.deepEqual(sceneOf(state, "c1", "I go to the Hall"), ["p1", "p2"], "no jump: where they were, too");
});

test("the player's own name pulls no place in: they are where they are", () => {
  const state = world();
  state.places.push({ id: "p2", name: "Hall", description: "" });
  assert.deepEqual(sceneOf(state, "c1", "Three days later Zhou eats in the Hall", true), ["p2"]);
});

test("the keeper finds, rewrites and buries only what it may, and the same decision lands alike on every turn", () => {
  const before = world();
  before.facts.push({ id: "s2", text: "Zhou owes the miller.", secret: true, revealed: false, source: "ai" });
  const keep = readKeep(before, {
    found: [{ id: "[s1]", how: "Qing said so." }, { id: "nope", how: "" }, { id: "s1", how: "again" }],
    revise: [{ id: "s1", text: "Found ones are not rewritten." }, { id: "s2", text: "Zhou owes the inn.", knownBy: ["Zhou"] }],
    secrets: [{ text: "The miller is Qing's brother.", knownBy: ["Qing"] }, { text: "Zhou owes the miller." }],
  });
  assert.deepEqual(keep.found, [{ id: "s1", how: "Qing said so." }], "an unknown id and a repeat are dropped");
  assert.deepEqual(keep.revised.map((r) => r.id), ["s2"]);
  assert.equal(keep.buried.length, 1, "a secret already there is not buried again");
  const once = applyKeep(before, keep);
  const twice = applyKeep(before, keep);
  assert.deepEqual(once, twice, "same ids on every turn it lands on");
  const s1 = once.facts.find((f) => f.id === "s1")!;
  assert.equal(s1.revealed, true);
  assert.equal(s1.revealNote, "Qing said so.");
  assert.equal(once.facts.find((f) => f.id === "s2")!.text, "Zhou owes the inn.");
  const buried = keep.buried[0]!.fact.id;
  assert.ok(once.characters.find((c) => c.name === "Qing")!.knows.includes(buried));
  // A turn written meanwhile takes up what changed in the turn it grew from.
  const since = keptSince(before, once);
  assert.deepEqual(since.found, [{ id: "s1", how: "Qing said so." }]);
  assert.deepEqual(since.revised.map((r) => r.text), ["Zhou owes the inn."]);
});
