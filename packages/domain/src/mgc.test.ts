import { describe, expect, it } from "vitest";
import {
  applyRestorableState,
  applyValidatedActionCandidate,
  compileEffectContext,
  createInitialState,
  lanternReachSeed,
  relationshipPoliciesFor,
  restoreSectionsFor,
  stateRevisionDocumentSchema,
  threadIdForAction,
  validateActionCandidate,
  worldDocumentSchema,
} from "./index.js";

describe("MGC-1 closure operations", () => {
  const world = worldDocumentSchema.parse({
    ...lanternReachSeed,
    characters: [
      ...lanternReachSeed.characters,
      {
        id: "character.tavi",
        name: "Tavi",
        role: "Lamp runner who carries messages to the harbor.",
        locationId: "location.tidal-observatory",
        motives: ["Get word to the harbor before the tide turns."],
        stance: "Tavi trusts the way Iora reads the markers.",
        knowledgeFactIds: ["fact.western-signal-dim"],
      },
    ],
    facts: [
      ...lanternReachSeed.facts,
      {
        id: "fact.private-ledger",
        statement: "The keeper hid the harbor ledger under the stairs.",
        scope: "ACCOUNT_PRIVATE",
        provenance: "Original MGC-1 test seed",
        lifecycle: "ACTIVE",
      },
    ],
    relationships: [
      {
        id: "relationship.iora-tavi",
        fromCharacterId: "character.iora",
        toCharacterId: "character.tavi",
        description: "Iora is training Tavi to read the markers.",
        protection: "ROUTINE",
        scale: ["wary", "cordial", "trusting"],
        initialState: "wary",
      },
      {
        id: "relationship.iora-oath",
        fromCharacterId: "character.iora",
        toCharacterId: "character.tavi",
        description: "Whether Iora has sworn to stand for Tavi.",
        protection: "PROTECTED",
        scale: ["unsworn", "sworn"],
        initialState: "unsworn",
      },
      {
        id: "relationship.tavi-iora",
        fromCharacterId: "character.tavi",
        toCharacterId: "character.iora",
        description: "How Tavi regards Iora.",
        scale: ["distant", "close"],
        initialState: "distant",
      },
    ],
    threads: [{ id: "thread.vessel", title: "Why the unfamiliar vessel waits" }],
    constraints: [
      {
        id: "constraint.flood",
        statement: "The causeway floods at high tide; no one crosses it then.",
      },
    ],
  });
  const state = createInitialState(world, {
    initiativeMode: "GUIDED",
    structureMode: "OPEN_ENDED",
  });
  const actionId = "00000000-0000-4000-8000-000000000301";
  const head = "00000000-0000-4000-8000-000000000302";
  const iora = { type: "CHARACTER", characterId: "character.iora" } as const;
  const candidate = (operation: Record<string, unknown>, responseSource: object = iora) => ({
    schemaVersion: 1,
    actionId,
    expectedHeadCommitId: head,
    narrative: "Iora answers from the observatory.",
    responseSource,
    operation: { causalFactIds: ["fact.western-signal-dim"], ...operation },
  });
  const options = {
    actionId,
    expectedHeadCommitId: head,
    state,
    authorizedContextFactIds: ["fact.western-signal-dim"],
    userRoleName: world.userRole.name,
    relationshipPolicies: relationshipPoliciesFor(world),
    constraintIds: ["constraint.flood"],
  };
  const relationshipOptions = { ...options, requestedEffect: "RELATIONSHIP_EFFECT" as const };
  const threadOptions = { ...options, requestedEffect: "THREAD_EFFECT" as const };
  const shift = (relationshipId: string, beforeState: string, afterState: string) =>
    candidate({ type: "SHIFT_RELATIONSHIP", relationshipId, beforeState, afterState });

  it("keeps earlier Worlds and states exactly as they were", () => {
    const legacy = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    expect("threads" in legacy).toBe(false);
    expect(legacy.relationships).toEqual([]);
    expect(stateRevisionDocumentSchema.parse(legacy)).toEqual(legacy);
    expect(state.relationships.map((item) => item.state)).toEqual(["wary", "unsworn", "distant"]);
    expect(state.threads).toEqual([
      { id: "thread.vessel", title: "Why the unfamiliar vessel waits", status: "OPEN" },
    ]);
  });

  it("rejects malformed declarations", () => {
    const relationship = world.relationships[0]!;
    const withRelationship = (patch: object) => ({
      ...world,
      relationships: [{ ...relationship, ...patch }],
    });
    expect(() =>
      worldDocumentSchema.parse(withRelationship({ initialState: undefined })),
    ).toThrow();
    expect(() =>
      worldDocumentSchema.parse(withRelationship({ initialState: "hostile" })),
    ).toThrow();
    expect(() =>
      worldDocumentSchema.parse(
        withRelationship({ scale: ["wary", "wary"], initialState: "wary" }),
      ),
    ).toThrow();
    expect(() =>
      worldDocumentSchema.parse({
        ...world,
        constraints: [{ id: "thread.vessel", statement: "Duplicate identity." }],
      }),
    ).toThrow();
  });

  it("derives the relationship impact from the declared class and step, never the model", () => {
    const step = validateActionCandidate(
      shift("relationship.iora-tavi", "wary", "cordial"),
      relationshipOptions,
    );
    expect(step.impact).toBe("L2");
    expect(step.requiresExactConfirmation).toBe(true);
    expect(
      validateActionCandidate(
        shift("relationship.iora-tavi", "wary", "trusting"),
        relationshipOptions,
      ).impact,
    ).toBe("L3");
    expect(
      validateActionCandidate(
        shift("relationship.iora-oath", "unsworn", "sworn"),
        relationshipOptions,
      ).impact,
    ).toBe("L3");
    // Undeclared protection fails closed to PROTECTED.
    expect(
      validateActionCandidate(
        shift("relationship.tavi-iora", "distant", "close"),
        relationshipOptions,
      ).impact,
    ).toBe("L3");

    const next = applyValidatedActionCandidate(state, step);
    expect(next.relationships.map((item) => item.state)).toEqual(["cordial", "unsworn", "distant"]);
    expect(next.facts).toEqual(state.facts);
    expect(next.participation).toEqual(state.participation);
    expect(next.worldClock.turn).toBe(state.worldClock.turn + 1);
  });

  it("rejects relationship changes outside the declared bounds or envelope", () => {
    for (const bad of [
      shift("relationship.iora-tavi", "cordial", "trusting"),
      shift("relationship.iora-tavi", "wary", "hostile"),
      shift("relationship.iora-tavi", "wary", "wary"),
      shift("relationship.missing", "wary", "cordial"),
      candidate({
        type: "SHIFT_RELATIONSHIP",
        relationshipId: "relationship.iora-tavi",
        beforeState: "wary",
        afterState: "cordial",
        impact: "L2",
      }),
    ]) {
      expect(() => validateActionCandidate(bad, relationshipOptions)).toThrow();
    }
    expect(() =>
      validateActionCandidate(
        {
          ...shift("relationship.iora-tavi", "wary", "cordial"),
          responseSource: { type: "WORLD" },
        },
        relationshipOptions,
      ),
    ).toThrow(/Character in that relationship/);
    expect(() =>
      validateActionCandidate(shift("relationship.iora-tavi", "wary", "cordial"), {
        ...options,
        requestedEffect: "FACT_REWRITE",
      }),
    ).toThrow(/closed effect envelope/);
    expect(() =>
      validateActionCandidate(shift("relationship.iora-tavi", "wary", "cordial"), {
        ...relationshipOptions,
        relationshipPolicies: [],
      }),
    ).toThrow(/declared scale/);
  });

  it("opens and resolves structured threads with append-only state", () => {
    const opened = validateActionCandidate(
      candidate({ type: "OPEN_THREAD", title: "Who signalled the vessel" }),
      threadOptions,
    );
    expect(opened.impact).toBe("L2");
    const afterOpen = applyValidatedActionCandidate(state, opened);
    expect(afterOpen.threads).toEqual([
      ...state.threads!,
      { id: threadIdForAction(actionId), title: "Who signalled the vessel", status: "OPEN" },
    ]);

    const resolveOptions = { ...threadOptions, targetThreadId: "thread.vessel" };
    const resolved = validateActionCandidate(
      candidate({
        type: "RESOLVE_THREAD",
        threadId: "thread.vessel",
        resolution: "It carries lamp oil for the harbor.",
      }),
      resolveOptions,
    );
    const afterResolve = applyValidatedActionCandidate(state, resolved);
    expect(afterResolve.threads).toEqual([
      {
        id: "thread.vessel",
        title: "Why the unfamiliar vessel waits",
        status: "RESOLVED",
        resolution: "It carries lamp oil for the harbor.",
      },
    ]);
    // The earlier State Revision keeps its value; resolving made a new one.
    expect(state.threads?.[0]?.status).toBe("OPEN");

    expect(() =>
      validateActionCandidate(
        candidate({ type: "RESOLVE_THREAD", threadId: "thread.vessel", resolution: "Again." }),
        { ...resolveOptions, state: afterResolve },
      ),
    ).toThrow(/open thread the user targeted/);
    expect(() =>
      validateActionCandidate(
        candidate({ type: "RESOLVE_THREAD", threadId: "thread.vessel", resolution: "Untargeted." }),
        threadOptions,
      ),
    ).toThrow(/closed effect envelope/);
    expect(() =>
      validateActionCandidate(
        candidate({ type: "OPEN_THREAD", title: "You promise to sail at dawn." }),
        threadOptions,
      ),
    ).toThrow();
    expect(() =>
      validateActionCandidate(
        candidate({
          type: "OPEN_THREAD",
          title: "The keeper hid the harbor ledger under the stairs.",
        }),
        threadOptions,
      ),
    ).toThrow();
  });

  it("turns a failed attempt into a new open thread only through a declared constraint", () => {
    const failure = candidate({
      type: "TRANSFORM_FAILURE",
      constraintId: "constraint.flood",
      outcome: "The causeway is under water and the crossing waits.",
      newThreadTitle: "Find another way to the harbor",
    });
    const validated = validateActionCandidate(failure, {
      ...options,
      requestedEffect: "ROUTINE_EFFECT",
    });
    expect(validated.impact).toBe("L2");
    expect(validated.requiresExactConfirmation).toBe(true);
    const next = applyValidatedActionCandidate(state, validated);
    expect(next.threads?.at(-1)).toEqual({
      id: threadIdForAction(actionId),
      title: "Find another way to the harbor",
      status: "OPEN",
    });
    expect(next.facts).toEqual(state.facts);
    expect(next.relationships).toEqual(state.relationships);
    expect(next.characters).toEqual(state.characters);
    expect(next.participation).toEqual(state.participation);

    expect(() =>
      validateActionCandidate(failure, { ...options, requestedEffect: "NO_WORLD_EFFECT" }),
    ).toThrow(/closed effect envelope/);
    expect(() =>
      validateActionCandidate(failure, {
        ...options,
        requestedEffect: "FACT_REWRITE",
        constraintIds: [],
      }),
    ).toThrow(/declared by the World Revision/);
  });

  it("restores thread status and relationship state with the rest of the world", () => {
    const opened = applyValidatedActionCandidate(
      state,
      validateActionCandidate(
        candidate({ type: "OPEN_THREAD", title: "A new lead" }),
        threadOptions,
      ),
    );
    expect(restoreSectionsFor(opened, state)).toContain("threads");
    expect(applyRestorableState(opened, state).threads).toEqual(state.threads);
    const legacy = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    expect(restoreSectionsFor(legacy, legacy)).not.toContain("threads");
    const restoredToLegacy = JSON.parse(
      JSON.stringify(applyRestorableState(opened, legacy)),
    ) as object;
    expect("threads" in restoredToLegacy).toBe(false);
  });

  it("compiles the effect context only when an Action can use it", () => {
    expect(
      compileEffectContext(lanternReachSeed, state, "character.iora", "FACT_REWRITE"),
    ).toBeNull();
    expect(compileEffectContext(world, state, "character.iora", "NO_WORLD_EFFECT")).toBeNull();
    const context = compileEffectContext(world, state, "character.iora", "RELATIONSHIP_EFFECT");
    expect(context?.relationships.map((item) => [item.id, item.protection, item.state])).toEqual([
      ["relationship.iora-tavi", "ROUTINE", "wary"],
      ["relationship.iora-oath", "PROTECTED", "unsworn"],
      ["relationship.tavi-iora", "PROTECTED", "distant"],
    ]);
    expect(context?.openThreads).toEqual([
      { id: "thread.vessel", title: "Why the unfamiliar vessel waits" },
    ]);
    expect(compileEffectContext(world, state, null, "THREAD_EFFECT")?.relationships).toEqual([]);
  });
  it("PX-4a: lets the story rewrite, shift, open or resolve only after the epoch", () => {
    const story = { ...options, requestedEffect: "STORY_DECIDES" as const };
    const free = { ...story, storyFreedom: true };
    const rewrite = candidate({
      type: "UPDATE_CANONICAL_FACT",
      targetFactId: "fact.western-signal-dim",
      beforeStatement: state.facts[0]!.statement,
      afterStatement: "The western signal burns bright again.",
      scope: "SHARED",
      provenance: `Confirmed Action ${actionId}`,
      causalFactIds: undefined,
    });
    delete (rewrite.operation as Record<string, unknown>).causalFactIds;
    const resolveAny = candidate({
      type: "RESOLVE_THREAD",
      threadId: "thread.vessel",
      resolution: "The pilot explains why she waits.",
    });
    const cases = [
      [rewrite, "L3"],
      [shift("relationship.iora-tavi", "wary", "cordial"), "L2"],
      [candidate({ type: "OPEN_THREAD", title: "Who hid the ledger" }), "L2"],
      [resolveAny, "L2"],
    ] as const;
    for (const [input, impact] of cases) {
      expect(() => validateActionCandidate(input, story)).toThrow();
      expect(validateActionCandidate(input, free).impact).toBe(impact);
    }
    // The explicit thread effect still resolves only its target.
    expect(() => validateActionCandidate(resolveAny, threadOptions)).toThrow();
    expect(compileEffectContext(world, state, null, "STORY_DECIDES", true)).not.toBeNull();
    expect(
      compileEffectContext(
        lanternReachSeed,
        createInitialState(lanternReachSeed, state.participation),
        null,
        "STORY_DECIDES",
      ),
    ).toBeNull();
  });
});
