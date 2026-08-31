import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  contentHash,
  createInitialState,
  lanternReachSeed,
  participationCombinations,
  stateRevisionDocumentSchema,
  worldDocumentSchema,
} from "./index.js";

describe("IP-2 authoritative domain", () => {
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
