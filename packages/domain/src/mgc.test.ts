import { describe, expect, it } from "vitest";
import {
  applyRestorableState,
  applyValidatedActionCandidate,
  applyValidatedMultiActionCandidate,
  compileEffectContext,
  createInitialState,
  lanternReachSeed,
  relationshipPoliciesFor,
  restoreSectionsFor,
  stateRevisionDocumentSchema,
  threadIdForAction,
  validateActionCandidate,
  validateMultiActionCandidate,
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

  describe("PX-4b several changes in one turn", () => {
    const story = {
      ...options,
      requestedEffect: "STORY_DECIDES" as const,
      storyFreedom: true,
      allowAddFact: true,
    };
    const lead = ["fact.western-signal-dim"];
    const turn = (operations: Array<Record<string, unknown>>, narrative = "The room stirs.") => ({
      schemaVersion: 2,
      actionId,
      expectedHeadCommitId: head,
      narrative,
      responseSource: iora,
      operations,
    });
    const add = (statement: string) => ({ type: "ADD_FACT", statement, causalFactIds: lead });
    const open = (title: string) => ({ type: "OPEN_THREAD", title, causalFactIds: lead });
    const oath = {
      type: "SHIFT_RELATIONSHIP",
      relationshipId: "relationship.iora-oath",
      beforeState: "unsworn",
      afterState: "sworn",
      causalFactIds: lead,
    };

    it("applies every change once, with ids by position and the highest impact", () => {
      const validated = validateMultiActionCandidate(
        turn([add("The bell rope is cut."), open("Who cut the rope"), oath]),
        story,
      );
      // A PROTECTED oath is L3, so the turn is L3.
      expect(validated.impact).toBe("L3");
      expect(validated.displayEffects.map((item) => item.target)).toEqual([
        `fact.${actionId}.1`,
        `thread.${actionId}.2`,
        "relationship.iora-oath",
      ]);
      const next = applyValidatedMultiActionCandidate(state, validated);
      expect(next.worldClock.turn).toBe(state.worldClock.turn + 1);
      expect(next.openThreads).toEqual([...state.openThreads, "The room stirs."]);
      expect(next.facts.at(-1)).toMatchObject({ id: `fact.${actionId}.1`, scope: "SHARED" });
      expect(next.threads?.at(-1)).toMatchObject({ id: `thread.${actionId}.2`, status: "OPEN" });
      expect(next.relationships.find((item) => item.id === "relationship.iora-oath")?.state).toBe(
        "sworn",
      );
    });

    it("is only for a story turn after the epoch, with two to four changes", () => {
      const two = turn([add("The bell rope is cut."), open("Who cut the rope")]);
      expect(validateMultiActionCandidate(two, story).impact).toBe("L2");
      expect(() => validateMultiActionCandidate(two, { ...story, storyFreedom: false })).toThrow();
      expect(() =>
        validateMultiActionCandidate(two, { ...story, requestedEffect: "FACT_REWRITE" }),
      ).toThrow();
      expect(() => validateMultiActionCandidate(turn([add("One.")]), story)).toThrow();
      expect(() =>
        validateMultiActionCandidate(
          turn([add("A."), add("B."), add("C."), add("D."), add("E.")]),
          story,
        ),
      ).toThrow();
      expect(() =>
        validateMultiActionCandidate(
          turn([add("A."), { type: "NO_WORLD_EFFECT", reason: "Nothing.", causalFactIds: lead }]),
          story,
        ),
      ).toThrow();
    });

    it("refuses changes that collide or depend on each other", () => {
      const refused = [
        // The same relationship twice.
        [oath, { ...oath, afterState: "unsworn", beforeState: "sworn" }],
        // A cause the same turn rewrites.
        [
          {
            type: "UPDATE_CANONICAL_FACT",
            targetFactId: "fact.western-signal-dim",
            beforeStatement: state.facts[0]!.statement,
            afterStatement: "The western signal burns bright again.",
            scope: "SHARED",
            provenance: `Confirmed Action ${actionId}`,
          },
          add("The keeper relights it."),
        ],
        // A failure opens its own thread, and is joined only by facts.
        [
          {
            type: "TRANSFORM_FAILURE",
            constraintId: "constraint.flood",
            outcome: "The causeway is under water.",
            newThreadTitle: "Waiting for low tide",
            causalFactIds: lead,
          },
          open("Another way across"),
        ],
      ];
      for (const operations of refused) {
        expect(() => validateMultiActionCandidate(turn(operations), story)).toThrow();
      }
      const failure = validateMultiActionCandidate(
        turn([
          {
            type: "TRANSFORM_FAILURE",
            constraintId: "constraint.flood",
            outcome: "The causeway is under water.",
            newThreadTitle: "Waiting for low tide",
            causalFactIds: lead,
          },
          add("Your boots are soaked."),
        ]),
        story,
      );
      const after = applyValidatedMultiActionCandidate(state, failure);
      expect(after.threads?.at(-1)?.id).toBe(`thread.${actionId}.1`);
      expect(after.facts.at(-1)?.id).toBe(`fact.${actionId}.2`);
    });

    it("lets only the narrative name a fact the turn reveals", () => {
      const hidden = {
        id: "fact.hidden-key",
        statement: "The spare key is inside the lamp.",
        scope: "CONTINUITY_PRIVATE" as const,
        provenance: "Seed",
        lifecycle: "ACTIVE" as const,
      };
      const secret = { ...story, state: { ...state, facts: [...state.facts, hidden] } };
      const reveal = { type: "REVEAL_FACT", factId: hidden.id, causalFactIds: lead };
      const told = "Iora tips the lamp: the spare key is inside the lamp.";
      expect(
        validateMultiActionCandidate(turn([reveal, add("Iora pockets it.")], told), {
          ...secret,
          revealableFactIds: [hidden.id],
        }).displayEffects,
      ).toHaveLength(2);
      expect(() =>
        validateMultiActionCandidate(
          turn([reveal, add("The spare key is inside the lamp, and now it is gone.")], told),
          { ...secret, revealableFactIds: [hidden.id] },
        ),
      ).toThrow();
    });
  });
});
