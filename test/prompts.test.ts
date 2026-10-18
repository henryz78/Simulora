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

test("rules the model wrote as a list are kept", () => {
  assert.equal(normalizeDraft({ rules: ["Spells tire the caster.", 3, "Curfew is at nine."] }).rules, "Spells tire the caster.\nCurfew is at nine.");
});

test("Chinese punctuation in Chinese text, whether it arrives whole or in pieces", () => {
  const text = "她说,好吧?“走!”他答:不;Harry, wait! 3:15";
  assert.equal(fullWidth(text), "她说，好吧？“走！”他答：不；Harry, wait! 3:15");
  assert.equal(fullWidth(text.slice(0, 3)) + fullWidth(text).slice(3), fullWidth(text));
});
