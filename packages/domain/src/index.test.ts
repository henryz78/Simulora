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

describe("IP-3 Action Truth domain", () => {
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
});
