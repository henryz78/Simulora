import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSettings, type TurnNode, type World } from "../shared/types.ts";
import { normalizeDraft } from "../server/app.ts";
import { fullWidth, narrationMessages } from "../server/prompts.ts";

const world = (rules?: string): World =>
  ({
    id: "w",
    title: "Hogwarts",
    premise: "",
    ...(rules === undefined ? {} : { rules }),
    opening: "Start.",
    state: { clock: "", places: [], characters: [], facts: [], threads: [], relationships: [] },
    createdAt: "",
    updatedAt: "",
  }) as World;
const opening = { id: "n", story: "Start.", input: "", actor: "director", state: world().state } as TurnNode;

test("the storyteller reads the world's own rules every turn", () => {
  const system = narrationMessages(world("Magic costs: every spell tires the caster."), [opening], "director", "", defaultSettings)[0]!
    .content;
  assert.match(system, /The author's rules for this world[^\n]*\nMagic costs: every spell tires the caster\./);
  // A world saved before rules existed has none.
  assert.doesNotMatch(narrationMessages(world(), [opening], "director", "", defaultSettings)[0]!.content, /author's rules/);
});

test("the player's notes go in every turn, and only when written", () => {
  const user = narrationMessages(world(), [opening], "director", "", defaultSettings, "  My left hand is hurt.  ")[1]!.content;
  assert.match(user, /The player's notes[^\n]*\nMy left hand is hurt\.\n/);
  assert.doesNotMatch(narrationMessages(world(), [opening], "director", "", defaultSettings, " ")[1]!.content, /player's notes/);
});

test("rules the model wrote as a list are kept", () => {
  assert.equal(normalizeDraft({ rules: ["Spells tire the caster.", "", "Curfew is at nine."] }).rules, "Spells tire the caster.\nCurfew is at nine.");
});

test("Chinese punctuation in Chinese text, whether it arrives whole or in pieces", () => {
  const text = "她说,好吧?“走!”他答:不;Harry, wait! 3:15";
  assert.equal(fullWidth(text), "她说，好吧？“走！”他答：不；Harry, wait! 3:15");
  assert.equal(fullWidth(text.slice(0, 3)) + fullWidth(text).slice(3), fullWidth(text));
});

test("English stays English: a closing quote counts only after Chinese", () => {
  assert.equal(fullWidth("“Yes”, he said. The dogs’, owners"), "“Yes”, he said. The dogs’, owners");
  assert.equal(fullWidth("“走”,他说"), "“走”，他说");
});

test("rules the model wrote as an object or a list of objects are kept as lines", () => {
  assert.equal(normalizeDraft({ rules: { tone: "British", magic: "costs" } }).rules, "tone: British\nmagic: costs");
  assert.equal(normalizeDraft({ rules: [{ rule: "Curfew at nine" }] }).rules, '{"rule":"Curfew at nine"}');
});

test("someone far away whom the last turn named stays whole, so a talk by phone goes on without their name", () => {
  const w = world();
  w.state.places.push({ id: "p1", name: "Office", description: "" }, { id: "p2", name: "Paris", description: "" });
  w.state.characters.push(
    { id: "c1", name: "Mei", persona: "A clerk.", goals: "", placeId: "p1", notes: "", knows: [] },
    { id: "c2", name: "Lan", persona: "A smuggler. Owes everyone.", goals: "", placeId: "p2", notes: "", knows: [] },
  );
  const call = { ...opening, story: "Lan's message arrives: 'Not tonight.'", state: w.state };
  const user = (path: TurnNode[]) => narrationMessages(w, path, "c1", "I write back: fine.", defaultSettings)[1]!.content;
  assert.match(user([opening, call]), /- Lan \(at Paris\)\. Persona: A smuggler\. Owes/);
  assert.doesNotMatch(user([{ ...opening, state: w.state }]), /Owes everyone/, "not named lately: a line");
});

test("a reply says where the player's character is, also on a director's turn; with no character of theirs, nothing", () => {
  const w = world();
  w.state.characters.push({ id: "c1", name: "Mei", persona: "", goals: "", placeId: null, notes: "", knows: [] });
  const ask = (path: TurnNode[], actor: string) => narrationMessages(w, path, actor, "", defaultSettings).map((m) => m.content).join("\n");
  const start = { ...opening, state: w.state };
  assert.match(ask([start], "c1"), /"where" is where Mei is at the end of the story/);
  assert.match(ask([start], "c1"), /with all four keys: the story, then "where"/);
  assert.match(ask([start, { ...start, actor: "c1" }], "director"), /"where" is where Mei is/);
  assert.doesNotMatch(ask([start], "director"), /"where"/);
  // Out of the story, they are not asked for, so a director's turn does not bring them back.
  const gone = { ...start, actor: "c1", state: { ...w.state, characters: [{ ...w.state.characters[0]!, gone: "Died" }] } };
  assert.doesNotMatch(ask([start, gone], "director"), /"where"/);
});
