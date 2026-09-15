import { expect, it } from "vitest";
import {
  assertExperimentDatabase,
  parseProfile,
  predecessorStyleRequest,
  redact,
} from "../../scripts/product-reality-spike.js";

it("keeps the isolated provider profile secret and forbids non-Spike database targets", () => {
  const profile = parseProfile("synthetic-key\nhttps://example.invalid/v1\ngpt-exact-test-model\n");
  expect(profile.endpoint).toBe("https://example.invalid/v1/chat/completions");
  expect(profile.model).toBe("gpt-exact-test-model");
  expect(redact("error synthetic-key", profile.key)).toBe("error [REDACTED]");
  expect(() => parseProfile("key\nhttp://example.invalid/v1\nmodel")).toThrow();
  expect(() => parseProfile("key\nhttps://example.invalid/v1?key=x\nmodel")).toThrow();
  expect(() =>
    assertExperimentDatabase("postgresql://postgres@127.0.0.1:55432/simulora_reality_abcdef012345"),
  ).not.toThrow();
  for (const url of [
    "postgresql://postgres@localhost:55432/simulora_reality_abcdef012345",
    "postgresql://postgres@127.0.0.1:55432/simulora_repair_37",
    "postgresql://postgres@remote:55432/simulora_reality_abcdef012345",
  ]) {
    expect(() => assertExperimentDatabase(url)).toThrow();
  }
});

it("makes a read-only predecessor-style contrast without changing the selected actor or truth inputs", () => {
  const request = {
    actionId: "synthetic-action",
    expectedHeadCommitId: "synthetic-head",
    intent: "Inspect the signal.",
    participation: { initiativeMode: "GUIDED" as const, structureMode: "OPEN_ENDED" as const },
    character: null,
    targetFact: { id: "fact.signal", statement: "The signal is dim.", scope: "SHARED" as const },
    context: { source: { headCommitId: "synthetic-head" } },
  };
  expect(predecessorStyleRequest(request)).toEqual({
    actionId: request.actionId,
    expectedHeadCommitId: request.expectedHeadCommitId,
    intent: request.intent,
    participation: request.participation,
    character: request.character,
    targetFact: request.targetFact,
  });
  expect(request.context).toBeDefined();
});
