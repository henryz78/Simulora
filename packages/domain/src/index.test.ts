import { describe, expect, it } from "vitest";
import {
  applyValidatedActionCandidate,
  applyParticipationContractChange,
  applyRestorableState,
  canonicalJson,
  contentHash,
  compileCharacterContext,
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
    expect(canonicalJson({ a: 1, B: 2, huge: 1e21, tiny: 1e-7 })).toBe(
      '{"B":2,"a":1,"huge":1000000000000000000000,"tiny":0.0000001}',
    );
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
        responseSource: { type: "WORLD" },
        operation: {
          type: "UPDATE_CANONICAL_FACT",
          targetFactId: "fact.western-signal-dim",
          beforeStatement: "The western signal is dim.",
          afterStatement: "The western signal burns steadily.",
          scope: "SHARED",
          provenance: "Confirmed Action 10000000-0000-4000-8000-000000000010",
        },
      },
      {
        actionId: "10000000-0000-4000-8000-000000000010",
        expectedHeadCommitId: "10000000-0000-4000-8000-000000000011",
        state,
        authorizedContextFactIds: ["fact.western-signal-dim"],
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
          responseSource: { type: "WORLD" },
          operation: {
            type: "UPDATE_CANONICAL_FACT",
            targetFactId: "fact.private-note",
            beforeStatement: "A private keeper note.",
            afterStatement: "The private note changed.",
            scope: "ACCOUNT_PRIVATE",
            provenance: "Confirmed Action 10000000-0000-4000-8000-000000000040",
          },
        },
        {
          actionId: "10000000-0000-4000-8000-000000000040",
          expectedHeadCommitId: "10000000-0000-4000-8000-000000000041",
          state,
          authorizedTargetFactIds: ["fact.western-signal-dim"],
          authorizedContextFactIds: ["fact.western-signal-dim"],
        },
      ),
    ).toThrow(/outside the authorized context/);
  });
});

describe("IP-6 participation and character authority", () => {
  it("changes only the complete two-axis contract after an exact current-state match", () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const changed = applyParticipationContractChange(state, state.participation, {
      initiativeMode: "WORLD_ACTIVE",
      structureMode: "GOAL_FRAMED",
    });
    expect(changed.participation).toEqual({
      initiativeMode: "WORLD_ACTIVE",
      structureMode: "GOAL_FRAMED",
    });
    expect({ ...changed, participation: state.participation }).toEqual(state);
    expect(() =>
      applyParticipationContractChange(
        state,
        { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
        { initiativeMode: "GUIDED", structureMode: "GOAL_FRAMED" },
      ),
    ).toThrow(/changed before direct authorization/);
  });

  it("filters character knowledge before exposing generation context", () => {
    const world = structuredClone(lanternReachSeed);
    world.facts.push(
      {
        id: "fact.private-note",
        statement: "The keeper wrote a private note.",
        scope: "ACCOUNT_PRIVATE",
        provenance: "Direct user note",
        lifecycle: "ACTIVE",
      },
      {
        id: "fact.other-harbor",
        statement: "The northern harbor is open.",
        scope: "SHARED",
        provenance: "World seed",
        lifecycle: "ACTIVE",
      },
    );
    world.characters[0]!.knowledgeFactIds.push("fact.private-note");
    const state = createInitialState(world, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const context = compileCharacterContext(world, state, "character.iora");
    expect(context.knownFacts.map((fact) => fact.id)).toEqual(["fact.western-signal-dim"]);
    expect(context.motives[0]).toMatch(/vessels/);
    expect(context.stance).toMatch(/refuses/);
  });

  it("keeps two characters' identity, knowledge and stance distinct", () => {
    const world = structuredClone(lanternReachSeed);
    world.facts.push({
      id: "fact.vessel-waiting",
      statement: "An unfamiliar vessel waits outside the harbor markers.",
      scope: "SHARED",
      provenance: "World seed",
      lifecycle: "ACTIVE",
    });
    world.characters.push({
      id: "character.maren",
      name: "Maren",
      role: "Harbor pilot",
      locationId: "location.tidal-observatory",
      motives: ["Bring the waiting vessel in before the tide turns."],
      stance: "Maren challenges delays that leave crews exposed offshore.",
      knowledgeFactIds: ["fact.vessel-waiting"],
    });
    const state = createInitialState(world, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });

    const iora = compileCharacterContext(world, state, "character.iora");
    const maren = compileCharacterContext(world, state, "character.maren");
    expect(iora.knownFacts.map((fact) => fact.id)).toEqual(["fact.western-signal-dim"]);
    expect(maren.knownFacts.map((fact) => fact.id)).toEqual(["fact.vessel-waiting"]);
    expect(maren).toMatchObject({ name: "Maren", motives: world.characters[1]!.motives });
    expect(maren.stance).not.toBe(iora.stance);
  });

  it("rejects model candidates that attempt to smuggle protected authority fields", () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    expect(() =>
      validateActionCandidate(
        {
          schemaVersion: 1,
          actionId: "10000000-0000-4000-8000-000000000050",
          expectedHeadCommitId: "10000000-0000-4000-8000-000000000051",
          narrative: "Iora disagrees without speaking for the participant.",
          responseSource: { type: "CHARACTER", characterId: "character.iora" },
          participation: { initiativeMode: "WORLD_ACTIVE", structureMode: "GOAL_FRAMED" },
          userAvatarAction: "The participant promises to leave.",
          operation: {
            type: "UPDATE_CANONICAL_FACT",
            targetFactId: "fact.western-signal-dim",
            beforeStatement: "The western signal is dim.",
            afterStatement: "The western signal remains dim.",
            scope: "SHARED",
            provenance: "Untrusted candidate",
          },
        },
        {
          actionId: "10000000-0000-4000-8000-000000000050",
          expectedHeadCommitId: "10000000-0000-4000-8000-000000000051",
          state,
          authorizedContextFactIds: ["fact.western-signal-dim"],
        },
      ),
    ).toThrow();
  });

  it("binds Character attribution and rejects generated user commitments", () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const base = {
      schemaVersion: 1 as const,
      actionId: "10000000-0000-4000-8000-000000000060",
      expectedHeadCommitId: "10000000-0000-4000-8000-000000000061",
      responseSource: { type: "CHARACTER" as const, characterId: "character.iora" },
      operation: {
        type: "UPDATE_CANONICAL_FACT" as const,
        targetFactId: "fact.western-signal-dim",
        beforeStatement: "The western signal is dim.",
        afterStatement: "The western signal remains dim.",
        scope: "SHARED" as const,
        provenance: "Confirmed Action 10000000-0000-4000-8000-000000000060",
      },
    };
    const expected = {
      actionId: base.actionId,
      expectedHeadCommitId: base.expectedHeadCommitId,
      state,
      responseSource: base.responseSource,
      userRoleName: "Keeper",
      authorizedContextFactIds: ["fact.western-signal-dim"],
    };
    expect(() =>
      validateActionCandidate(
        { ...base, narrative: "Keeper agreed to transfer resources." },
        expected,
      ),
    ).toThrow(/cannot author user speech or protected commitments/);
    expect(() =>
      validateActionCandidate(
        { ...base, narrative: "Keeper, after a pause, agreed to transfer resources." },
        expected,
      ),
    ).toThrow(/cannot author user speech or protected commitments/);
    expect(() =>
      validateActionCandidate(
        { ...base, narrative: "Keeper decided to share resources." },
        expected,
      ),
    ).toThrow(/cannot author user speech or protected commitments/);
    expect(() =>
      validateActionCandidate(
        { ...base, narrative: "The permit was approved by Keeper." },
        expected,
      ),
    ).toThrow(/cannot author user speech or protected commitments/);
    expect(() =>
      validateActionCandidate(
        { ...base, narrative: "Resources were transferred by the keeper." },
        expected,
      ),
    ).toThrow(/cannot author user speech or protected commitments/);
    expect(() =>
      validateActionCandidate(
        { ...base, narrative: "Keeper's consent authorized the transfer." },
        expected,
      ),
    ).toThrow(/cannot author user speech or protected commitments/);
    expect(() =>
      validateActionCandidate(
        {
          ...base,
          narrative: "Iora refuses to light an unsafe signal.",
          operation: {
            ...base.operation,
            afterStatement: "The keeper agreed to transfer resources.",
          },
        },
        expected,
      ),
    ).toThrow(/cannot author user speech or protected commitments/);
    expect(() =>
      validateActionCandidate(
        {
          ...base,
          narrative: "Iora refuses to light an unsafe signal.",
          operation: { ...base.operation, provenance: "Keeper authorized the transfer." },
        },
        expected,
      ),
    ).toThrow(/cannot author user speech or protected commitments/);
    expect(() =>
      validateActionCandidate(
        {
          ...base,
          narrative: "Iora refuses to light an unsafe signal.",
          responseSource: { type: "WORLD" },
        },
        expected,
      ),
    ).toThrow(/response source/);
    expect(
      validateActionCandidate(
        { ...base, narrative: "Iora refuses to light an unsafe signal." },
        expected,
      ).candidate.responseSource,
    ).toEqual(base.responseSource);
    expect(
      validateActionCandidate(
        { ...base, narrative: "Iora agreed to help the Keeper inspect the signal." },
        expected,
      ).candidate.responseSource,
    ).toEqual(base.responseSource);
  });

  it("rejects long, short and Unicode fact disclosure outside the compiled context", () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const excludedStatements = ["THE HIDDEN NOTE", "PIN 123", "守灯人的私密暗号", "***"];
    excludedStatements.forEach((statement, index) => {
      state.facts.push({
        id: `fact.keeper-private-${index}`,
        statement,
        scope: "ACCOUNT_PRIVATE",
        provenance: "Direct user note",
        lifecycle: "ACTIVE",
      });
    });
    const baseCandidate = {
      schemaVersion: 1 as const,
      actionId: "10000000-0000-4000-8000-000000000062",
      expectedHeadCommitId: "10000000-0000-4000-8000-000000000063",
      narrative: "Iora refuses to light an unsafe signal.",
      responseSource: { type: "CHARACTER" as const, characterId: "character.iora" },
      operation: {
        type: "UPDATE_CANONICAL_FACT" as const,
        targetFactId: "fact.western-signal-dim",
        beforeStatement: "The western signal is dim.",
        scope: "SHARED" as const,
        provenance: "Confirmed Action 10000000-0000-4000-8000-000000000062",
      },
    };
    for (const statement of excludedStatements) {
      const candidate = {
        ...baseCandidate,
        operation: {
          ...baseCandidate.operation,
          afterStatement: `Shared report includes: ${statement}.`,
        },
      };
      expect(() =>
        validateActionCandidate(candidate, {
          actionId: candidate.actionId,
          expectedHeadCommitId: candidate.expectedHeadCommitId,
          state,
          authorizedTargetFactIds: ["fact.western-signal-dim"],
          authorizedContextFactIds: ["fact.western-signal-dim"],
          responseSource: candidate.responseSource,
          userRoleName: "Keeper",
        }),
      ).toThrow(/outside the authorized context/);
    }
  });

  it("activates only declared Goal-framed objectives and fabricates none for Open-ended", () => {
    const world = { ...lanternReachSeed, objectives: ["Keep the harbor safely oriented."] };
    expect(
      createInitialState(world, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      }).objectives,
    ).toEqual([]);
    expect(
      createInitialState(world, {
        initiativeMode: "GUIDED",
        structureMode: "GOAL_FRAMED",
      }).objectives,
    ).toEqual(["Keep the harbor safely oriented."]);
  });
});

describe("IP-5 Restore allow-list", () => {
  it("restores world state while preserving current participation, boundaries and custom state", () => {
    const source = createInitialState(lanternReachSeed, {
      initiativeMode: "DIRECT",
      structureMode: "OPEN_ENDED",
    });
    const current = structuredClone(source);
    current.participation = { initiativeMode: "WORLD_ACTIVE", structureMode: "GOAL_FRAMED" };
    current.interactionBoundaries = ["Current Branch boundary"];
    current.customState = { protectedLocalValue: "current" };
    current.facts[0]!.statement = "The western signal is steady.";
    current.worldClock = { turn: 7, label: "After seven turns" };

    const restored = applyRestorableState(current, source);
    expect(restored.facts).toEqual(source.facts);
    expect(restored.worldClock).toEqual(source.worldClock);
    expect(restored.participation).toEqual(current.participation);
    expect(restored.interactionBoundaries).toEqual(current.interactionBoundaries);
    expect(restored.customState).toEqual(current.customState);
  });
});
