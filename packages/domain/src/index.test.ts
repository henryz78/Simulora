import { describe, expect, it } from "vitest";
import {
  applyValidatedActionCandidate,
  canonicalJson,
  contentHash,
  createInitialState,
  lanternReachSeed,
  participationCombinations,
  stateRevisionDocumentSchema,
  worldDocumentSchema,
  applyValidatedDirectCorrectionCandidate,
  validateDirectCorrectionCandidate,
  validateActionCandidate,
} from "./index.js";

describe("authoritative World and Continuity domain", () => {
  it("validates the original minimal playable World seed", () => {
    expect(worldDocumentSchema.parse(lanternReachSeed).title).toBe("Lantern Reach");
  });

  it("rejects invalid stable references", () => {
    const invalid = structuredClone(lanternReachSeed);
    invalid.characters[0]!.locationId = "location.missing";
    expect(() => worldDocumentSchema.parse(invalid)).toThrow(/locationId/);
  });

  it("round-trips all six independent participation combinations", () => {
    expect(participationCombinations).toHaveLength(6);
    for (const participation of participationCombinations) {
      const state = createInitialState(lanternReachSeed, participation);
      expect(
        stateRevisionDocumentSchema.parse(JSON.parse(JSON.stringify(state))).participation,
      ).toEqual(participation);
    }
  });

  it("keeps open-ended worlds free of fabricated objectives", () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "DIRECT",
      structureMode: "OPEN_ENDED",
    });
    expect(state.objectives).toEqual([]);
  });

  it("uses deterministic canonical serialization and hashes", () => {
    expect(canonicalJson({ b: 2, a: { d: 4, c: 3 } })).toBe('{"a":{"c":3,"d":4},"b":2}');
    expect(contentHash({ b: 2, a: 1 })).toBe(contentHash({ a: 1, b: 2 }));
  });
});

describe("IP-4 Action Truth and correction domain", () => {
  it("classifies canonical fact rewrites as exact-confirmation L3 and applies them without changing participation", () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const validated = validateActionCandidate(
      {
        schemaVersion: 1,
        actionId: "10000000-0000-4000-8000-000000000010",
        expectedHeadCommitId: "10000000-0000-4000-8000-000000000011",
        narrative: "The western lamp answers the keeper's work.",
        operation: {
          type: "UPDATE_CANONICAL_FACT",
          targetFactId: "fact.western-signal-dim",
          beforeStatement: "The western signal is dim.",
          afterStatement: "The western signal burns steadily.",
          scope: "SHARED",
          provenance: "Confirmed test Action",
        },
      },
      {
        actionId: "10000000-0000-4000-8000-000000000010",
        expectedHeadCommitId: "10000000-0000-4000-8000-000000000011",
        state,
      },
    );
    expect(validated.impact).toBe("L3");
    const next = applyValidatedActionCandidate(state, validated);
    expect(next.participation).toEqual(state.participation);
    expect(next.facts[0]?.statement).toBe("The western signal burns steadily.");
    expect(state.facts[0]?.statement).toBe("The western signal is dim.");
  });

  it("keeps direct correction L3 and changes only the selected fact", () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const validated = validateDirectCorrectionCandidate(
      {
        schemaVersion: 1,
        actionId: "10000000-0000-4000-8000-000000000020",
        expectedHeadCommitId: "10000000-0000-4000-8000-000000000021",
        narrative: "The participant corrected the signal record.",
        operation: {
          type: "CORRECT_CONTINUITY",
          targetFactId: "fact.western-signal-dim",
          beforeStatement: "The western signal is dim.",
          beforeScope: "SHARED",
          afterStatement: "The western signal is steady.",
          reason: "The keeper checked the instrument log.",
        },
      },
      {
        actionId: "10000000-0000-4000-8000-000000000020",
        expectedHeadCommitId: "10000000-0000-4000-8000-000000000021",
        state,
        operationType: "CORRECT_CONTINUITY",
      },
    );
    expect(validated.impact).toBe("L3");
    const next = applyValidatedDirectCorrectionCandidate(state, validated);
    expect(next.worldClock).toEqual(state.worldClock);
    expect(next.participation).toEqual(state.participation);
    expect(next.characters).toEqual(state.characters);
    expect(next.relationships).toEqual(state.relationships);
    expect(next.openThreads).toEqual(state.openThreads);
    expect(next.facts).toHaveLength(state.facts.length);
    expect(next.facts[0]).toMatchObject({
      id: state.facts[0]!.id,
      lifecycle: "ACTIVE",
      statement: "The western signal is steady.",
    });
    expect(next.facts[0]!.provenance).toContain("10000000-0000-4000-8000-000000000020");
    expect(state.facts[0]!.statement).toBe("The western signal is dim.");
  });

  it("retains a removed fact as a stable tombstone and rejects it as a future target", () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "DIRECT",
      structureMode: "OPEN_ENDED",
    });
    const candidate = {
      schemaVersion: 1 as const,
      actionId: "10000000-0000-4000-8000-000000000030",
      expectedHeadCommitId: "10000000-0000-4000-8000-000000000031",
      narrative: "The participant removed the obsolete signal record.",
      operation: {
        type: "REMOVE_CONTINUITY" as const,
        targetFactId: "fact.western-signal-dim",
        beforeStatement: "The western signal is dim.",
        beforeScope: "SHARED" as const,
        reason: "The log entry was obsolete.",
      },
    };
    const validated = validateDirectCorrectionCandidate(candidate, {
      actionId: candidate.actionId,
      expectedHeadCommitId: candidate.expectedHeadCommitId,
      state,
      operationType: "REMOVE_CONTINUITY",
    });
    const removed = applyValidatedDirectCorrectionCandidate(state, validated);
    expect(removed.facts[0]).toMatchObject({
      id: "fact.western-signal-dim",
      lifecycle: "REMOVED",
      statement: "The western signal is dim.",
      removalReason: "The log entry was obsolete.",
    });
    expect(() =>
      validateDirectCorrectionCandidate(
        {
          ...candidate,
          actionId: "10000000-0000-4000-8000-000000000032",
        },
        {
          actionId: "10000000-0000-4000-8000-000000000032",
          expectedHeadCommitId: candidate.expectedHeadCommitId,
          state: removed,
          operationType: "REMOVE_CONTINUITY",
        },
      ),
    ).toThrow(/not active/);
  });

  it("does not let a model candidate address a fact outside its attempt allow-list", () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    state.facts.push({
      id: "fact.private-note",
      statement: "A private keeper note.",
      scope: "ACCOUNT_PRIVATE",
      provenance: "Test-only private seed",
      lifecycle: "ACTIVE",
    });
    expect(() =>
      validateActionCandidate(
        {
          schemaVersion: 1,
          actionId: "10000000-0000-4000-8000-000000000040",
          expectedHeadCommitId: "10000000-0000-4000-8000-000000000041",
          narrative: "A crafted candidate tries to reach an unprovided fact.",
          operation: {
            type: "UPDATE_CANONICAL_FACT",
            targetFactId: "fact.private-note",
            beforeStatement: "A private keeper note.",
            afterStatement: "The private note changed.",
            scope: "ACCOUNT_PRIVATE",
            provenance: "Untrusted candidate",
          },
        },
        {
          actionId: "10000000-0000-4000-8000-000000000040",
          expectedHeadCommitId: "10000000-0000-4000-8000-000000000041",
          state,
          authorizedTargetFactIds: ["fact.western-signal-dim"],
        },
      ),
    ).toThrow(/outside the authorized context/);
  });
});
