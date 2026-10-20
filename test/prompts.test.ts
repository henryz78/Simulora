import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSettings, type TurnNode, type World } from "../shared/types.ts";
import { normalizeDraft } from "../server/app.ts";
import { fullWidth, hookMessages, interviewMessages, meanwhileMessages, narrationMessages, timeJump, viewMessages } from "../server/prompts.ts";

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

test("what people did out of the scene goes to the storyteller, not to the hooks the player reads", () => {
  const turn = { ...opening, meanwhile: [{ character: "Lan", did: "Locked the back door." }] };
  const all = (messages: { content: string }[]) => messages.map((m) => m.content).join("\n");
  assert.match(all(narrationMessages(world(), [opening, turn], "director", "", defaultSettings)), /Meanwhile[^\n]*Lan: Locked/);
  assert.doesNotMatch(all(hookMessages(world(), [opening, turn])), /Locked the back door/);
});

test("the player picks how the story reads: plain by default, or literary", () => {
  const system = (settings: typeof defaultSettings) => narrationMessages(world(), [opening], "director", "", settings)[0]!.content;
  assert.match(system(defaultSettings), /gets it at once/);
  assert.doesNotMatch(system({ ...defaultSettings, style: "literary" }), /gets it at once/);
  assert.match(system({ ...defaultSettings, style: "literary" }), /concrete detail/);
});

test("the player's settings come before what a world's rules say about the same things", () => {
  const system = narrationMessages(world("每回合至少写900字。"), [opening], "director", "", defaultSettings)[0]!.content;
  assert.match(system, /the player's settings come first; the rules govern the rest\.\n每回合至少写900字。/);
});

test("a skip of days or more is a jump in time; a day is the story's own pace", () => {
  for (const s of ["三天后，我去图书馆", "3 天后", "过了 两个月", "几天后", "两天后", "半年后", "三天过后", "下个月再见", "下周一",
    "我们等到下月", "Three days later", "a few weeks pass", "after three days"])
    assert.ok(timeJump(s), s);
  for (const s of ["第二天一早", "一天后", "明天再说", "他三天没来了", "过了一会儿", "十天前的事", "第三天后", "放下月饼",
    "部下周瑜在帐外", "the next morning"])
    assert.equal(timeJump(s), null, s);
});

test("on a jump in time the storyteller hears what the people away got up to", () => {
  const user = narrationMessages(world(), [opening], "director", "三天后", defaultSettings, "", [
    { character: "Lan", did: "Closed the shop." },
  ])[1]!.content;
  assert.match(user, /While the skipped time passed[^\n]*Lan: Closed the shop\./);
});

test("the storyteller is told how the dice settled the attempt, and to keep to it", () => {
  const user = narrationMessages(world(), [opening], "director", "I climb", defaultSettings, "", [], {
    what: "the climb", difficulty: "hard", roll: 3, outcome: "fail", result: "He falls.",
  })[1]!.content;
  assert.match(user, /The dice settled the attempt \(the climb\): it fails[^\n]*This is fixed, tell it so: He falls\.[^\n]*never turn/);
});

test("an interviewee hears only their own secrets and nothing done out of their sight", () => {
  const w = world();
  w.state.places.push({ id: "p1", name: "Inn", description: "" });
  w.state.characters.push(
    { id: "c1", name: "Mei", persona: "", goals: "", placeId: "p1", notes: "", knows: ["s1"] },
    { id: "c2", name: "Lan", persona: "", goals: "", placeId: "p1", notes: "", knows: ["s2"] },
  );
  w.state.facts.push(
    { id: "s1", text: "Mei hid the ledger.", secret: true, revealed: false, source: "author" },
    { id: "s2", text: "Lan sold the boat.", secret: true, revealed: false, source: "author" },
  );
  const turn = { ...opening, state: w.state, meanwhile: [{ character: "Lan", did: "Burned the letter." }] };
  const all = interviewMessages(w, [opening, turn], "c1", [], "Well?", false).map((m) => m.content).join("\n");
  assert.match(all, /Mei hid the ledger/);
  assert.doesNotMatch(all, /Lan sold the boat|Burned the letter/);
  assert.match(all, /never state it plainly/);
  assert.match(interviewMessages(w, [opening, turn], "c1", [], "Well?", true)[0]!.content, /say what you know frankly/);
});

test("another's eyes are given their secrets only when the player sees every secret", () => {
  const w = world();
  w.state.characters.push({ id: "c1", name: "Mei", persona: "", goals: "", placeId: null, notes: "", knows: ["s1"] });
  w.state.facts.push({ id: "s1", text: "Mei hid the ledger.", secret: true, revealed: false, source: "author" });
  const turn = { ...opening, story: "Mei pours the tea.", state: w.state };
  const told = (showSecrets: boolean) =>
    viewMessages(w, [opening, turn], 1, "c1", { ...defaultSettings, showSecrets }).map((m) => m.content).join("\n");
  assert.doesNotMatch(told(false), /hid the ledger/);
  assert.match(told(true), /hid the ledger/);
  assert.match(told(false), /It ends where the passage ends, at: "Mei pours the tea\."/);
});

test("days away: the player's character stays put in one way, lives them too in the other", () => {
  const w = world();
  w.state.characters.push({ id: "c1", name: "Mei", persona: "", goals: "", placeId: null, notes: "", knows: [] });
  const played = { ...opening, actor: "c1", state: w.state };
  const tell = (offline: "world" | "all", did: { character: string; did: string }[]) =>
    narrationMessages(w, [opening, played], "director", "3天后", defaultSettings, "", did, null, offline)[1]!.content;
  const stays = tell("world", [{ character: "Lan", did: "Closed the shop." }]);
  assert.match(stays, /Mei lived those days quietly where they were/);
  assert.match(stays, /out of the player's sight[^\n]*Lan: Closed the shop/);
  const lives = tell("all", [{ character: "mei", did: "Read in the library." }, { character: "Lan", did: "Closed the shop." }]);
  assert.match(lives, /Mei lived those days too, on their own wants: Read in the library\./);
  assert.doesNotMatch(lives, /out of the player's sight[^\n]*Read in the library/, "their own days are not unseen");
  assert.match(meanwhileMessages(w, [opening, played], ["Mei", "Lan"], "3天后", "Mei")[0]!.content, /Mei is the player's own character/);
});
