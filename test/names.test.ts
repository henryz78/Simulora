import assert from "node:assert/strict";
import { test } from "node:test";
import { coverOf, initial, nextSaveName, turnLabel, when } from "../web/src/names.ts";
import { lang } from "../web/src/i18n.ts";

test("an initial is the first Chinese character, else the first letter", () => {
  assert.equal(initial("塔玛辛·沙菲克"), "塔");
  assert.equal(initial("《余烬》学年"), "余", "a book-title mark is skipped");
  assert.equal(initial("alice"), "A");
  assert.equal(initial("·", "?"), "?");
});

test("a cover keeps its colour by the world's id and shows a Chinese character", () => {
  const a = coverOf({ id: "7d9ec006-be0a-4f9b-9cf4-d561f1d0fb33", title: "《余烬》学年" });
  assert.equal(coverOf({ id: "7d9ec006-be0a-4f9b-9cf4-d561f1d0fb33", title: "renamed" }).background, a.background);
  assert.equal(a.mark, "余");
  assert.equal(coverOf({ id: "w1", title: "Snow Night" }).mark, "世", "no Chinese character: 世");
  assert.match(coverOf({ id: "not-a-uuid", title: "x" }).background, /^#[0-9A-F]{6}$/);
});

test("a new save is numbered one past the highest, so a deleted number is not reused", () => {
  const name = (n: number) => (lang === "zh" ? `第 ${n} 局` : `Game ${n}`);
  assert.equal(nextSaveName([]), name(1));
  assert.equal(nextSaveName([{ title: "第 2 局" }, { title: "Game 5" }, { title: "长局回归" }]), name(6));
  assert.equal(nextSaveName([{ title: "第3局" }]), name(4));
});

test("times read as today, yesterday, days ago, or a date", () => {
  const now = new Date(2026, 9, 20, 15, 0);
  assert.match(when(new Date(2026, 9, 20, 9, 5).toISOString(), now), /09:05|9:05/);
  assert.equal(when(new Date(2026, 9, 19, 23, 0).toISOString(), now), lang === "zh" ? "昨天" : "Yesterday");
  assert.equal(when(new Date(2026, 9, 17, 12, 0).toISOString(), now), lang === "zh" ? "3 天前" : "3 days ago");
  assert.doesNotMatch(when(new Date(2026, 5, 1).toISOString(), now), /ago|前/);
});

test("the opening is not turn 0", () => {
  assert.equal(turnLabel(0), lang === "zh" ? "开场" : "Opening");
  assert.equal(turnLabel(3), lang === "zh" ? "第 3 回合" : "Turn 3");
});
