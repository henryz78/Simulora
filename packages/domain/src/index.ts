import { createHash } from "node:crypto";
import { z } from "zod";

export const implementationPhase = "IP-9" as const;

const stableIdSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9][a-z0-9._-]*$/);
const nonEmptyTextSchema = z.string().trim().min(1).max(4_000);

// MGC-1: declared relationship bounds, structured threads and causal constraints.
export const relationshipProtectionSchema = z.enum(["PROTECTED", "ROUTINE"]);
const relationshipStateLabelSchema = z.string().trim().min(1).max(60);
const threadTitleSchema = z.string().trim().min(1).max(200);
const boundedTextSchema = z.string().trim().min(1).max(1_000);
export const threadStatusSchema = z.enum(["OPEN", "RESOLVED"]);

export const initiativeModeSchema = z.enum(["DIRECT", "GUIDED", "WORLD_ACTIVE"]);
export const structureModeSchema = z.enum(["OPEN_ENDED", "GOAL_FRAMED"]);
export const participationContractSchema = z.object({
  initiativeMode: initiativeModeSchema,
  structureMode: structureModeSchema,
});

export const characterAssetDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string().trim().min(1).max(120),
  role: nonEmptyTextSchema,
  motives: z.array(nonEmptyTextSchema).min(1).default(["Act consistently with this role."]),
  stance: nonEmptyTextSchema.default(
    "May disagree or refuse when the character's motives require it.",
  ),
  knowledgeFactIds: z.array(stableIdSchema).default([]),
});

export const worldCharacterSpecSchema = characterAssetDefinitionSchema
  .omit({ schemaVersion: true })
  .extend({
    id: stableIdSchema,
    locationId: stableIdSchema,
    sourceAssetId: z.string().uuid().optional(),
  });

export const factScopeSchema = z.enum(["ACCOUNT_PRIVATE", "CONTINUITY_PRIVATE", "SHARED"]);

export const worldFactSchema = z.object({
  id: stableIdSchema,
  statement: nonEmptyTextSchema,
  scope: factScopeSchema,
  provenance: nonEmptyTextSchema,
  lifecycle: z.literal("ACTIVE"),
});

/**
 * A fact in a State Revision keeps its stable identity while its lifecycle
 * changes. World documents remain playable seed definitions and therefore use
 * the narrower ACTIVE-only schema above; historical State Revisions may carry
 * a superseded/removal marker without mutating an older revision.
 */
export const canonicalFactLifecycleSchema = z.enum(["ACTIVE", "SUPERSEDED", "REMOVED"]);
export const stateFactSchema = z.object({
  id: stableIdSchema,
  statement: nonEmptyTextSchema,
  scope: factScopeSchema,
  provenance: nonEmptyTextSchema,
  lifecycle: canonicalFactLifecycleSchema,
  supersededBy: stableIdSchema.optional(),
  supersedes: stableIdSchema.optional(),
  removalReason: nonEmptyTextSchema.optional(),
});

export const worldDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    title: z.string().trim().min(1).max(120),
    premise: nonEmptyTextSchema,
    startingSituation: nonEmptyTextSchema,
    userRole: z.object({
      name: z.string().trim().min(1).max(120),
      authorityBoundary: nonEmptyTextSchema,
    }),
    locations: z
      .array(
        z.object({
          id: stableIdSchema,
          name: z.string().trim().min(1).max(120),
          description: nonEmptyTextSchema,
        }),
      )
      .min(1),
    routineRoutes: z
      .array(
        z.object({
          fromLocationId: stableIdSchema,
          toLocationId: stableIdSchema,
          label: nonEmptyTextSchema,
          // SA-2: the creator lets `routineMovers` use this route (ADR-SA2).
          permitsRoutineMovement: z.boolean().optional(),
        }),
      )
      .optional(),
    // SA-2: Characters the creator lets move on their own along permitted routes.
    routineMovers: z.array(stableIdSchema).optional(),
    characters: z.array(worldCharacterSpecSchema).min(1),
    facts: z.array(worldFactSchema).min(1),
    relationships: z.array(
      z.object({
        id: stableIdSchema,
        fromCharacterId: stableIdSchema,
        toCharacterId: stableIdSchema,
        description: nonEmptyTextSchema,
        // Undeclared protection is PROTECTED; without a scale the state is fixed.
        protection: relationshipProtectionSchema.optional(),
        scale: z.array(relationshipStateLabelSchema).min(2).max(7).optional(),
        initialState: relationshipStateLabelSchema.optional(),
      }),
    ),
    threads: z.array(z.object({ id: stableIdSchema, title: threadTitleSchema })).optional(),
    constraints: z
      .array(z.object({ id: stableIdSchema, statement: nonEmptyTextSchema }))
      .optional(),
    interactionPaths: z.array(nonEmptyTextSchema).min(1),
    interactionBoundaries: z.array(nonEmptyTextSchema).min(1),
    objectives: z.array(nonEmptyTextSchema).default([]),
  })
  .superRefine((world, context) => {
    const locationIds = new Set(world.locations.map((location) => location.id));
    const characterIds = new Set(world.characters.map((character) => character.id));
    const allIds = [
      ...world.locations.map((item) => item.id),
      ...world.characters.map((item) => item.id),
      ...world.facts.map((item) => item.id),
      ...world.relationships.map((item) => item.id),
      ...(world.threads ?? []).map((item) => item.id),
      ...(world.constraints ?? []).map((item) => item.id),
    ];

    if (new Set(allIds).size !== allIds.length) {
      context.addIssue({ code: "custom", message: "World stable IDs must be unique" });
    }

    world.routineRoutes?.forEach((route, index) => {
      if (
        !locationIds.has(route.fromLocationId) ||
        !locationIds.has(route.toLocationId) ||
        route.fromLocationId === route.toLocationId
      ) {
        context.addIssue({
          code: "custom",
          message: "Routine route must connect two distinct World locations",
          path: ["routineRoutes", index],
        });
      }
    });

    const movers = world.routineMovers ?? [];
    if (new Set(movers).size !== movers.length || movers.some((id) => !characterIds.has(id))) {
      context.addIssue({
        code: "custom",
        message: "Characters who move on their own must be distinct World Characters",
        path: ["routineMovers"],
      });
    }
    if (
      movers.length > 0 !==
      Boolean(world.routineRoutes?.some((route) => route.permitsRoutineMovement === true))
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Characters who move on their own need at least one route they may use, and a route open to them needs at least one such Character",
        path: ["routineMovers"],
      });
    }

    world.characters.forEach((character, index) => {
      if (!locationIds.has(character.locationId)) {
        context.addIssue({
          code: "custom",
          message: "Character locationId must reference a World location",
          path: ["characters", index, "locationId"],
        });
      }
    });

    world.relationships.forEach((relationship, index) => {
      const scale = relationship.scale;
      if (
        (scale === undefined) !== (relationship.initialState === undefined) ||
        (scale &&
          (new Set(scale).size !== scale.length ||
            !scale.includes(relationship.initialState ?? "")))
      ) {
        context.addIssue({
          code: "custom",
          message: "A relationship scale needs distinct labels and an initial state from it",
          path: ["relationships", index, "scale"],
        });
      }
      if (!characterIds.has(relationship.fromCharacterId)) {
        context.addIssue({
          code: "custom",
          message: "Relationship source must reference a World character",
          path: ["relationships", index, "fromCharacterId"],
        });
      }
      if (!characterIds.has(relationship.toCharacterId)) {
        context.addIssue({
          code: "custom",
          message: "Relationship target must reference a World character",
          path: ["relationships", index, "toCharacterId"],
        });
      }
    });

    world.characters.forEach((character, index) => {
      character.knowledgeFactIds.forEach((factId) => {
        if (!world.facts.some((fact) => fact.id === factId)) {
          context.addIssue({
            code: "custom",
            message: "Character knowledge must reference a World fact",
            path: ["characters", index, "knowledgeFactIds"],
          });
        }
      });
    });
  });

export const stateRevisionDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    participation: participationContractSchema,
    worldClock: z.object({ turn: z.number().int().nonnegative(), label: nonEmptyTextSchema }),
    locations: z.array(
      z.object({ id: stableIdSchema, name: nonEmptyTextSchema, description: nonEmptyTextSchema }),
    ),
    entities: z.array(z.record(z.string(), z.unknown())),
    characters: z.array(
      z.object({
        id: stableIdSchema,
        name: nonEmptyTextSchema,
        role: nonEmptyTextSchema,
        locationId: stableIdSchema,
        currentState: nonEmptyTextSchema,
        knownFactIds: z.array(stableIdSchema).default([]),
      }),
    ),
    facts: z.array(stateFactSchema),
    relationships: z.array(
      z.object({
        id: stableIdSchema,
        fromCharacterId: stableIdSchema,
        toCharacterId: stableIdSchema,
        description: nonEmptyTextSchema,
        // Present only for a relationship whose World declaration has a scale.
        state: relationshipStateLabelSchema.optional(),
      }),
    ),
    // Legacy narrative trail. It is not thread state; see `threads`.
    openThreads: z.array(nonEmptyTextSchema),
    // MGC-1 authoritative story threads; absent when none were ever declared or opened.
    threads: z
      .array(
        z
          .object({
            id: stableIdSchema,
            title: threadTitleSchema,
            status: threadStatusSchema,
            resolution: boundedTextSchema.optional(),
          })
          .refine(
            (thread) => (thread.status === "RESOLVED") === (thread.resolution !== undefined),
            {
              message: "Only a resolved thread carries a resolution",
            },
          ),
      )
      .optional(),
    objectives: z.array(nonEmptyTextSchema),
    resources: z.record(z.string(), z.number().finite()),
    interactionBoundaries: z.array(nonEmptyTextSchema).min(1),
    customState: z.record(z.string(), z.unknown()),
  })
  .superRefine((state, context) => {
    const threadIds = (state.threads ?? []).map((thread) => thread.id);
    if (new Set(threadIds).size !== threadIds.length) {
      context.addIssue({ code: "custom", path: ["threads"], message: "Thread IDs must be unique" });
    }
    const factIds = new Set(state.facts.map((fact) => fact.id));
    const characterIds = state.characters.map((character) => character.id);
    if (new Set(characterIds).size !== characterIds.length) {
      context.addIssue({
        code: "custom",
        path: ["characters"],
        message: "Character IDs must be unique",
      });
    }
    state.characters.forEach((character, index) => {
      character.knownFactIds.forEach((factId) => {
        if (!factIds.has(factId)) {
          context.addIssue({
            code: "custom",
            path: ["characters", index, "knownFactIds"],
            message: "Character runtime knowledge must reference a State fact",
          });
        }
      });
    });
  });

export type InitiativeMode = z.infer<typeof initiativeModeSchema>;
export type StructureMode = z.infer<typeof structureModeSchema>;
export type ParticipationContract = z.infer<typeof participationContractSchema>;
export type CharacterAssetDefinition = z.infer<typeof characterAssetDefinitionSchema>;
export type WorldCharacterSpec = z.infer<typeof worldCharacterSpecSchema>;
export type FactScope = z.infer<typeof factScopeSchema>;
export type WorldDocument = z.infer<typeof worldDocumentSchema>;
export type StateRevisionDocument = z.infer<typeof stateRevisionDocumentSchema>;
export type CanonicalFactLifecycle = z.infer<typeof canonicalFactLifecycleSchema>;
export type StateFact = z.infer<typeof stateFactSchema>;

export type CharacterGenerationContext = {
  id: string;
  name: string;
  role: string;
  motives: string[];
  stance: string;
  locationId: string;
  currentState: string;
  knownFacts: StateFact[];
  relationships: StateRevisionDocument["relationships"];
};

// Bounded administrative fixture policy, not creator-authored permission.
export const routinePolicySchema = z
  .object({
    version: z.literal("re3-routine-v1"),
    npcIds: z.array(stableIdSchema).min(1),
    publicLocationIds: z.array(stableIdSchema).min(2),
    routes: z
      .array(
        z
          .object({
            fromLocationId: stableIdSchema,
            toLocationId: stableIdSchema,
            label: nonEmptyTextSchema,
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export function applyParticipationContractChange(
  stateInput: StateRevisionDocument,
  expectedInput: ParticipationContract,
  requestedInput: ParticipationContract,
): StateRevisionDocument {
  const state = stateRevisionDocumentSchema.parse(stateInput);
  const expected = participationContractSchema.parse(expectedInput);
  const requested = participationContractSchema.parse(requestedInput);
  if (
    state.participation.initiativeMode !== expected.initiativeMode ||
    state.participation.structureMode !== expected.structureMode
  ) {
    throw new Error("Participation contract changed before direct authorization");
  }
  if (
    expected.initiativeMode === requested.initiativeMode &&
    expected.structureMode === requested.structureMode
  ) {
    throw new Error("Participation contract is unchanged");
  }
  return stateRevisionDocumentSchema.parse({ ...state, participation: requested });
}

/**
 * Resolve a character's authorized sources before any ranking or generation.
 * ACCOUNT_PRIVATE facts are never character knowledge, even if a malformed
 * authored allow-list names one.
 */
export function compileCharacterContext(
  worldInput: WorldDocument,
  stateInput: StateRevisionDocument,
  characterId: string,
): CharacterGenerationContext {
  const world = worldDocumentSchema.parse(worldInput);
  const state = stateRevisionDocumentSchema.parse(stateInput);
  const spec = world.characters.find((character) => character.id === characterId);
  const runtime = state.characters.find((character) => character.id === characterId);
  if (!spec || !runtime) throw new Error("Character is not present in this World state");
  const allowed = new Set([...spec.knowledgeFactIds, ...runtime.knownFactIds]);
  return {
    id: spec.id,
    name: spec.name,
    role: spec.role,
    motives: spec.motives,
    stance: spec.stance,
    locationId: runtime.locationId,
    currentState: runtime.currentState,
    knownFacts: state.facts.filter(
      (fact) =>
        fact.lifecycle === "ACTIVE" && fact.scope !== "ACCOUNT_PRIVATE" && allowed.has(fact.id),
    ),
    relationships: state.relationships.filter(
      (relationship) =>
        relationship.fromCharacterId === spec.id || relationship.toCharacterId === spec.id,
    ),
  };
}

export const restorableStateSections = [
  "worldClock",
  "locations",
  "entities",
  "characters",
  "facts",
  "relationships",
  "openThreads",
  "objectives",
  "resources",
] as const satisfies readonly (keyof StateRevisionDocument)[];

/**
 * MGC-1: `threads` joins the Restore allow-list only when either snapshot has
 * structured threads, so a Restore between two pre-MGC snapshots stays exact.
 */
export function restoreSectionsFor(
  current: StateRevisionDocument,
  source: StateRevisionDocument,
): (keyof StateRevisionDocument)[] {
  return current.threads !== undefined || source.threads !== undefined
    ? [...restorableStateSections, "threads"]
    : [...restorableStateSections];
}

/**
 * Restore only the frozen world-state allow-list. Participation,
 * interaction boundaries and custom/account-owned state always come from the
 * current head, never from the historical source.
 */
export function applyRestorableState(
  currentInput: StateRevisionDocument,
  sourceInput: StateRevisionDocument,
): StateRevisionDocument {
  const current = stateRevisionDocumentSchema.parse(currentInput);
  const source = stateRevisionDocumentSchema.parse(sourceInput);
  return stateRevisionDocumentSchema.parse({
    ...current,
    worldClock: source.worldClock,
    locations: source.locations,
    entities: source.entities,
    characters: source.characters,
    facts: source.facts,
    relationships: source.relationships,
    openThreads: source.openThreads,
    threads: source.threads,
    objectives: source.objectives,
    resources: source.resources,
  });
}

export const actionStatusSchema = z.enum([
  "ACKNOWLEDGED",
  "GENERATING",
  "VALIDATING",
  "AWAITING_CONFIRMATION",
  "COMMITTING",
  "COMMITTED",
  "COMPLETED_NO_EFFECT",
  "FAILED_RECOVERABLE",
  "CONFLICT",
  "CANCELLED",
  "SUPERSEDED",
]);

export const actionCandidateSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: z.string().uuid(),
    expectedHeadCommitId: z.string().uuid(),
    narrative: nonEmptyTextSchema,
    responseSource: z.discriminatedUnion("type", [
      z.object({ type: z.literal("WORLD") }).strict(),
      z.object({ type: z.literal("CHARACTER"), characterId: stableIdSchema }).strict(),
    ]),
    operation: z.discriminatedUnion("type", [
      z
        .object({
          type: z.literal("UPDATE_CANONICAL_FACT"),
          targetFactId: stableIdSchema,
          beforeStatement: nonEmptyTextSchema,
          afterStatement: nonEmptyTextSchema,
          scope: factScopeSchema,
          provenance: nonEmptyTextSchema,
        })
        .strict(),
      z
        .object({
          type: z.literal("MOVE_CHARACTER"),
          characterId: stableIdSchema,
          beforeLocationId: stableIdSchema,
          afterLocationId: stableIdSchema,
          causalFactIds: z.array(stableIdSchema).min(1).max(4),
        })
        .strict(),
      z
        .object({
          type: z.literal("NO_WORLD_EFFECT"),
          reason: nonEmptyTextSchema,
          causalFactIds: z.array(stableIdSchema).min(1).max(4),
        })
        .strict(),
      z
        .object({
          type: z.literal("SHIFT_RELATIONSHIP"),
          relationshipId: stableIdSchema,
          beforeState: relationshipStateLabelSchema,
          afterState: relationshipStateLabelSchema,
          causalFactIds: z.array(stableIdSchema).min(1).max(4),
        })
        .strict(),
      z
        .object({
          type: z.literal("OPEN_THREAD"),
          title: threadTitleSchema,
          causalFactIds: z.array(stableIdSchema).min(1).max(4),
        })
        .strict(),
      z
        .object({
          type: z.literal("RESOLVE_THREAD"),
          threadId: stableIdSchema,
          resolution: boundedTextSchema,
          causalFactIds: z.array(stableIdSchema).min(1).max(4),
        })
        .strict(),
      // WD-1a: record one new SHARED fact; id and provenance are server-derived.
      z
        .object({
          type: z.literal("ADD_FACT"),
          statement: boundedTextSchema,
          causalFactIds: z.array(stableIdSchema).min(1).max(4),
        })
        .strict(),
      z
        .object({
          type: z.literal("TRANSFORM_FAILURE"),
          constraintId: stableIdSchema,
          outcome: boundedTextSchema,
          newThreadTitle: threadTitleSchema,
          causalFactIds: z.array(stableIdSchema).min(1).max(4),
        })
        .strict(),
    ]),
  })
  .strict();

/** The closed effect envelopes a user may request for an ordinary Action. */
export const requestedEffectSchema = z.enum([
  "FACT_REWRITE",
  "ROUTINE_EFFECT",
  "NO_WORLD_EFFECT",
  "RELATIONSHIP_EFFECT",
  "THREAD_EFFECT",
]);
export type RequestedEffect = z.infer<typeof requestedEffectSchema>;

/** WD-1a: the server-derived identity of a fact added by an Action. */
export function factIdForAction(actionId: string): string {
  return `fact.${actionId}`;
}

/** What an added fact's review shows as its "before" state. */
export const addedFactBefore = "Nothing recorded yet.";

/** The server-derived identity of a thread opened by an Action. */
export function threadIdForAction(actionId: string): string {
  return `thread.${actionId}`;
}

/** Declared relationship bounds the validator reads from the pinned World Revision. */
export type RelationshipPolicy = {
  id: string;
  protection: "PROTECTED" | "ROUTINE";
  scale: string[];
};

/**
 * MGC-1 effect context for one Action: the responding Character's scaled
 * relationships, open threads and declared constraints. It exists only when
 * the Action can use it, so every earlier Action keeps its exact evidence.
 * PostgreSQL re-derives the same object (`simulora.mgc_effect_context`).
 */
export function compileEffectContext(
  world: WorldDocument,
  state: StateRevisionDocument,
  characterId: string | null,
  requestedEffect: RequestedEffect,
): {
  relationships: Array<
    RelationshipPolicy & { fromCharacterId: string; toCharacterId: string; state: string }
  >;
  openThreads: Array<{ id: string; title: string }>;
  constraints: Array<{ id: string; statement: string }>;
} | null {
  const constraints = world.constraints ?? [];
  const applies =
    requestedEffect === "RELATIONSHIP_EFFECT" ||
    requestedEffect === "THREAD_EFFECT" ||
    (requestedEffect !== "NO_WORLD_EFFECT" && constraints.length > 0);
  if (!applies) return null;
  const policies = relationshipPoliciesFor(world);
  return {
    relationships: characterId
      ? state.relationships.flatMap((relationship) => {
          const policy = policies.find((item) => item.id === relationship.id);
          return policy &&
            relationship.state !== undefined &&
            (relationship.fromCharacterId === characterId ||
              relationship.toCharacterId === characterId)
            ? [
                {
                  id: relationship.id,
                  fromCharacterId: relationship.fromCharacterId,
                  toCharacterId: relationship.toCharacterId,
                  protection: policy.protection,
                  scale: policy.scale,
                  state: relationship.state,
                },
              ]
            : [];
        })
      : [],
    openThreads: (state.threads ?? [])
      .filter((thread) => thread.status === "OPEN")
      .map(({ id, title }) => ({ id, title })),
    constraints: constraints.map(({ id, statement }) => ({ id, statement })),
  };
}

export type EffectContext = NonNullable<ReturnType<typeof compileEffectContext>>;

export function relationshipPoliciesFor(world: WorldDocument): RelationshipPolicy[] {
  return world.relationships.flatMap((relationship) =>
    relationship.scale
      ? [
          {
            id: relationship.id,
            protection: relationship.protection ?? "PROTECTED",
            scale: relationship.scale,
          },
        ]
      : [],
  );
}

export type ActionStatus = z.infer<typeof actionStatusSchema>;
export type ActionCandidate = z.infer<typeof actionCandidateSchema>;
export type ActionResponseSource = ActionCandidate["responseSource"];
export type ConsequenceImpact = "L0" | "L2" | "L3";

const directCorrectionOperationSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("CORRECT_CONTINUITY"),
      targetFactId: stableIdSchema,
      beforeStatement: nonEmptyTextSchema,
      beforeScope: factScopeSchema,
      afterStatement: nonEmptyTextSchema,
      reason: z.string().trim().min(1).max(1_000),
    })
    .strict(),
  z
    .object({
      type: z.literal("REMOVE_CONTINUITY"),
      targetFactId: stableIdSchema,
      beforeStatement: nonEmptyTextSchema,
      beforeScope: factScopeSchema,
      reason: z.string().trim().min(1).max(1_000),
    })
    .strict(),
]);

export const directCorrectionCandidateSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: z.string().uuid(),
    expectedHeadCommitId: z.string().uuid(),
    narrative: nonEmptyTextSchema,
    operation: directCorrectionOperationSchema,
  })
  .strict();

export type DirectCorrectionOperation = z.infer<typeof directCorrectionOperationSchema>;
export type DirectCorrectionCandidate = z.infer<typeof directCorrectionCandidateSchema>;

export type ValidatedDirectCorrectionCandidate = {
  candidate: DirectCorrectionCandidate;
  impact: ConsequenceImpact;
  requiresExactConfirmation: true;
  displayEffect: {
    target: string;
    before: string;
    after: string;
    scope: FactScope;
    operation: "CORRECT_CONTINUITY" | "REMOVE_CONTINUITY";
  };
};

export type ValidatedActionCandidate = {
  candidate: ActionCandidate;
  impact: ConsequenceImpact;
  requiresExactConfirmation: boolean;
  displayEffect?: {
    target: string;
    before: string;
    after: string;
    scope: FactScope;
  };
};

export function validateActionCandidate(
  candidateInput: unknown,
  expected: {
    actionId: string;
    expectedHeadCommitId: string;
    state: StateRevisionDocument;
    /**
     * The model is only authorized to address facts included in its context.
     * Passing this allow-list is mandatory at the repository boundary for the
     * current deterministic provider, and prevents a crafted candidate from
     * naming another private fact that happened to be present in the snapshot.
     */
    authorizedTargetFactIds?: ReadonlySet<string> | readonly string[];
    authorizedContextFactIds: ReadonlySet<string> | readonly string[];
    responseSource?: ActionResponseSource;
    userRoleName?: string;
    requestedEffect?: RequestedEffect;
    authorizedRoutineRoutes?: ReadonlySet<string> | readonly string[];
    authorizedRoutineNpcIds?: ReadonlySet<string> | readonly string[];
    /** MGC-1: the thread the user asked this Action to work toward. */
    targetThreadId?: string;
    /** MGC-1: scaled relationships declared by the pinned World Revision. */
    relationshipPolicies?: readonly RelationshipPolicy[];
    /** MGC-1: causal constraints declared by the pinned World Revision. */
    constraintIds?: readonly string[];
    /** WD-1a: a fact change may add one new SHARED fact (Actions after 0055). */
    allowAddFact?: boolean;
  },
): ValidatedActionCandidate {
  const candidate = actionCandidateSchema.parse(candidateInput);
  if (candidate.actionId !== expected.actionId) {
    throw new Error("Candidate Action identity does not match the durable Action");
  }
  if (candidate.expectedHeadCommitId !== expected.expectedHeadCommitId) {
    throw new Error("Candidate expected head does not match the durable Action");
  }
  if (
    expected.responseSource &&
    JSON.stringify(candidate.responseSource) !== JSON.stringify(expected.responseSource)
  ) {
    throw new Error("Candidate response source does not match the compiled character context");
  }
  const responseCharacterId =
    candidate.responseSource.type === "CHARACTER" ? candidate.responseSource.characterId : null;
  if (
    responseCharacterId &&
    !expected.state.characters.some((character) => character.id === responseCharacterId)
  ) {
    throw new Error("Candidate response source is not present in the expected World state");
  }
  assertGeneratedNarrativeDoesNotAuthorUser(
    candidate.narrative,
    expected.userRoleName,
    expected.state.characters.find((character) => character.id === responseCharacterId)?.name,
  );
  const requestedEffect = expected.requestedEffect ?? "FACT_REWRITE";
  const operation = candidate.operation;
  const envelopeOperation = {
    FACT_REWRITE: "UPDATE_CANONICAL_FACT",
    ROUTINE_EFFECT: "MOVE_CHARACTER",
    NO_WORLD_EFFECT: "NO_WORLD_EFFECT",
    RELATIONSHIP_EFFECT: "SHIFT_RELATIONSHIP",
    THREAD_EFFECT: expected.targetThreadId ? "RESOLVE_THREAD" : "OPEN_THREAD",
  }[requestedEffect];
  // A world-changing attempt may instead fail against a declared constraint.
  const transformedFailure =
    operation.type === "TRANSFORM_FAILURE" && requestedEffect !== "NO_WORLD_EFFECT";
  const addedFact =
    operation.type === "ADD_FACT" && requestedEffect === "FACT_REWRITE" && expected.allowAddFact;
  if (operation.type !== envelopeOperation && !transformedFailure && !addedFact) {
    throw new Error("Candidate effect does not match the requested closed effect envelope");
  }
  const allowedContext = new Set(expected.authorizedContextFactIds);
  const eligibleCausalFact = (id: string) =>
    allowedContext.has(id) &&
    expected.state.facts.some(
      (fact) => fact.id === id && fact.lifecycle === "ACTIVE" && fact.scope !== "ACCOUNT_PRIVATE",
    );
  assertGeneratedTextDoesNotLeakExcludedFacts(
    [candidate.narrative, operation.type === "NO_WORLD_EFFECT" ? operation.reason : ""],
    expected.state,
    expected.authorizedContextFactIds,
  );
  if (
    operation.type === "SHIFT_RELATIONSHIP" ||
    operation.type === "OPEN_THREAD" ||
    operation.type === "RESOLVE_THREAD" ||
    operation.type === "TRANSFORM_FAILURE"
  ) {
    return validateClosureOperation(candidate, operation, expected, eligibleCausalFact);
  }
  if (operation.type === "ADD_FACT") {
    assertGeneratedNarrativeDoesNotAuthorUser(operation.statement, expected.userRoleName);
    assertGeneratedTextDoesNotLeakExcludedFacts(
      [operation.statement],
      expected.state,
      expected.authorizedContextFactIds,
    );
    if (operation.causalFactIds.some((id) => !eligibleCausalFact(id))) {
      throw new Error("Added fact source is outside the authorized context");
    }
    const factId = factIdForAction(candidate.actionId);
    if (expected.state.facts.some((fact) => fact.id === factId)) {
      throw new Error("Added fact identity already exists at the expected head");
    }
    // WD-1a (ADR-WD1-2): adding a fact changes and removes nothing, so it is L2.
    return {
      candidate,
      impact: "L2",
      requiresExactConfirmation: true,
      displayEffect: {
        target: factId,
        before: addedFactBefore,
        after: operation.statement,
        scope: "SHARED",
      },
    };
  }
  if (operation.type === "NO_WORLD_EFFECT") {
    assertGeneratedNarrativeDoesNotAuthorUser(
      operation.reason,
      expected.userRoleName,
      expected.state.characters.find((character) => character.id === responseCharacterId)?.name,
    );
    if (operation.causalFactIds.some((id) => !eligibleCausalFact(id))) {
      throw new Error("No-world-effect source is outside the authorized context");
    }
    return { candidate, impact: "L0", requiresExactConfirmation: false };
  }
  if (operation.type === "MOVE_CHARACTER") {
    if (!new Set(expected.authorizedRoutineNpcIds).has(operation.characterId)) {
      throw new Error("Routine effect Character is not an explicitly authorized NPC");
    }
    if (
      candidate.responseSource.type !== "CHARACTER" ||
      candidate.responseSource.characterId !== operation.characterId
    ) {
      throw new Error("Routine effect must be attributed to its selected Character");
    }
    const character = expected.state.characters.find((item) => item.id === operation.characterId);
    if (!character) throw new Error("Routine effect Character is not present at the expected head");
    if (character.locationId !== operation.beforeLocationId) {
      throw new Error("Routine effect before location does not match the expected head");
    }
    if (operation.beforeLocationId === operation.afterLocationId) {
      throw new Error("Routine effect must change the Character location");
    }
    if (!expected.state.locations.some((location) => location.id === operation.afterLocationId)) {
      throw new Error("Routine effect destination is not present at the expected head");
    }
    const routes = Array.isArray(expected.authorizedRoutineRoutes)
      ? expected.authorizedRoutineRoutes
      : [...(expected.authorizedRoutineRoutes ?? [])];
    if (!routes.includes(`${operation.beforeLocationId}->${operation.afterLocationId}`)) {
      throw new Error("Routine effect route is outside the authorized closed policy");
    }
    if (operation.causalFactIds.some((id) => !eligibleCausalFact(id))) {
      throw new Error("Routine effect source is outside the authorized context");
    }
    return {
      candidate,
      impact: "L2",
      requiresExactConfirmation: true,
      displayEffect: {
        target: operation.characterId,
        before: operation.beforeLocationId,
        after: operation.afterLocationId,
        scope: "SHARED",
      },
    };
  }
  if (operation.type !== "UPDATE_CANONICAL_FACT") {
    throw new Error("Unsupported requested effect operation");
  }
  const factOperation = operation;
  assertGeneratedNarrativeDoesNotAuthorUser(factOperation.afterStatement, expected.userRoleName);
  assertGeneratedNarrativeDoesNotAuthorUser(factOperation.provenance, expected.userRoleName);
  if (factOperation.provenance !== `Confirmed Action ${candidate.actionId}`) {
    throw new Error("Candidate provenance must be the server-verifiable Action reference");
  }

  const allowed = expected.authorizedTargetFactIds;
  if (
    allowed &&
    !(Array.isArray(allowed)
      ? allowed.includes(factOperation.targetFactId)
      : (allowed as ReadonlySet<string>).has(factOperation.targetFactId))
  ) {
    throw new Error("Candidate target fact is outside the authorized context");
  }
  const target = expected.state.facts.find(
    (fact) => fact.id === factOperation.targetFactId && fact.lifecycle === "ACTIVE",
  );
  if (!target) throw new Error("Candidate target fact is not present at the expected head");
  if (target.statement !== factOperation.beforeStatement || target.scope !== factOperation.scope) {
    throw new Error("Candidate before-state or scope does not match the expected head");
  }
  assertGeneratedTextDoesNotLeakExcludedFacts(
    [candidate.narrative, factOperation.afterStatement],
    expected.state,
    expected.authorizedContextFactIds,
  );

  // Rewriting an existing canonical fact is L3 under the frozen closed impact table.
  // The model's own label is intentionally absent and cannot lower this classification.
  return {
    candidate,
    impact: "L3",
    requiresExactConfirmation: true,
    displayEffect: {
      target: target.id,
      before: target.statement,
      after: factOperation.afterStatement,
      scope: target.scope,
    },
  };
}

type ClosureOperation = Extract<
  ActionCandidate["operation"],
  { type: "SHIFT_RELATIONSHIP" | "OPEN_THREAD" | "RESOLVE_THREAD" | "TRANSFORM_FAILURE" }
>;

/** The generated text fields of an MGC-1 operation, in a fixed order. */
export function closureOperationTexts(operation: ActionCandidate["operation"]): string[] {
  if (operation.type === "OPEN_THREAD") return [operation.title];
  if (operation.type === "RESOLVE_THREAD") return [operation.resolution];
  if (operation.type === "TRANSFORM_FAILURE") return [operation.outcome, operation.newThreadTitle];
  return [];
}

/**
 * MGC-1 closed operations. The impact is derived here from the declared World
 * policy and the exact before/after; the model never supplies it.
 */
function validateClosureOperation(
  candidate: ActionCandidate,
  operation: ClosureOperation,
  expected: Parameters<typeof validateActionCandidate>[1],
  eligibleCausalFact: (id: string) => boolean,
): ValidatedActionCandidate {
  if (operation.causalFactIds.some((id) => !eligibleCausalFact(id))) {
    throw new Error("Closure effect source is outside the authorized context");
  }
  const source = candidate.responseSource;
  const speaker =
    source.type === "CHARACTER"
      ? expected.state.characters.find((item) => item.id === source.characterId)?.name
      : undefined;
  const texts = closureOperationTexts(operation);
  for (const text of texts) {
    assertGeneratedNarrativeDoesNotAuthorUser(text, expected.userRoleName, speaker);
  }
  assertGeneratedTextDoesNotLeakExcludedFacts(
    texts,
    expected.state,
    expected.authorizedContextFactIds,
  );
  const newThreadId = threadIdForAction(candidate.actionId);

  if (operation.type === "SHIFT_RELATIONSHIP") {
    const relationship = expected.state.relationships.find(
      (item) => item.id === operation.relationshipId,
    );
    const policy = expected.relationshipPolicies?.find(
      (item) => item.id === operation.relationshipId,
    );
    if (!relationship || !policy || relationship.state === undefined) {
      throw new Error("Relationship has no declared scale at the expected head");
    }
    if (
      source.type !== "CHARACTER" ||
      (relationship.fromCharacterId !== source.characterId &&
        relationship.toCharacterId !== source.characterId)
    ) {
      throw new Error("Relationship change must come from a Character in that relationship");
    }
    if (relationship.state !== operation.beforeState) {
      throw new Error("Relationship before-state does not match the expected head");
    }
    const before = policy.scale.indexOf(operation.beforeState);
    const after = policy.scale.indexOf(operation.afterState);
    if (after < 0 || after === before) {
      throw new Error("Relationship after-state must be another value of its declared scale");
    }
    // Domain §5.5: only an adjacent step on a declared ROUTINE relationship is L2.
    const impact = policy.protection === "ROUTINE" && Math.abs(after - before) === 1 ? "L2" : "L3";
    return {
      candidate,
      impact,
      requiresExactConfirmation: true,
      displayEffect: {
        target: relationship.id,
        before: operation.beforeState,
        after: operation.afterState,
        scope: "SHARED",
      },
    };
  }
  if (operation.type === "RESOLVE_THREAD") {
    const thread = expected.state.threads?.find((item) => item.id === operation.threadId);
    if (!thread || operation.threadId !== expected.targetThreadId || thread.status !== "OPEN") {
      throw new Error("Only the open thread the user targeted can be resolved");
    }
    return {
      candidate,
      impact: "L2",
      requiresExactConfirmation: true,
      displayEffect: { target: thread.id, before: "OPEN", after: "RESOLVED", scope: "SHARED" },
    };
  }
  if (expected.state.threads?.some((thread) => thread.id === newThreadId)) {
    throw new Error("Thread already exists at the expected head");
  }
  if (operation.type === "OPEN_THREAD") {
    return {
      candidate,
      impact: "L2",
      requiresExactConfirmation: true,
      displayEffect: {
        target: newThreadId,
        before: "No thread",
        after: operation.title,
        scope: "SHARED",
      },
    };
  }
  if (!expected.constraintIds?.includes(operation.constraintId)) {
    throw new Error("Transformed failure must cite a constraint declared by the World Revision");
  }
  return {
    candidate,
    impact: "L2",
    requiresExactConfirmation: true,
    displayEffect: {
      target: operation.constraintId,
      before: operation.outcome,
      after: operation.newThreadTitle,
      scope: "SHARED",
    },
  };
}

/**
 * Generated narration may describe consequences and Character choices, but it
 * cannot manufacture speech, consent or another protected commitment for the
 * user's role. This narrow trust-boundary check complements the strict
 * candidate shape; it is not a general prose classifier.
 */
export function assertGeneratedNarrativeDoesNotAuthorUser(
  narrative: string,
  userRoleName?: string,
  responseCharacterName?: string,
): void {
  let normalizedNarrative = narrative.normalize("NFKC").toLowerCase();
  if (hasUnsupportedAuthorityScript(normalizedNarrative)) {
    throw new Error("Generated narrative cannot author user speech or protected commitments");
  }
  const normalizedRole = normalizeAuthoritySubject(userRoleName);
  const rawRole = userRoleName?.normalize("NFKC").toLowerCase().trim() || undefined;
  const roleNames = normalizedRole?.split(/\s+/) ?? [];
  const narrator = responseCharacterName?.normalize("NFKC").toLowerCase().trim();
  // ponytail: recognize only an explicit comma-delimited English attribution,
  // not general grammar. Keep the entire utterance under the existing guard.
  // The name comes from the bound Character state, never from generated prose.
  if (
    narrator &&
    /^[a-z][a-z0-9_]*(?: [a-z][a-z0-9_]*)*$/.test(narrator) &&
    !narrator
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .some((name) => ["you", "user", "player", "participant", ...roleNames].includes(name))
  ) {
    normalizedNarrative = normalizedNarrative.replace(
      new RegExp(`(,[\\s'"]*${escapeAuthorityRegex(narrator)}\\s+)(?:says|said)(\\s*,)`, "g"),
      "$1narrates$2",
    );
    // ponytail: only bare "can decide" at a clause end defers a choice.
    // Retain its subject and all surrounding claims; canonical fields stay strict.
    const optionSubjects = [
      "you",
      "the user",
      "the player",
      "the participant",
      "user",
      "player",
      "participant",
      normalizedRole,
      rawRole,
      roleNames.at(-1),
    ].filter((subject): subject is string =>
      Boolean(subject && /^[a-z][a-z0-9_]*(?: [a-z][a-z0-9_]*)*$/.test(subject)),
    );
    // Only soften conditional/deferential references to a future user choice.
    // A direct claim such as "you choose" remains protected, and any later
    // protected verb in the same clause is still inspected normally.
    const optionSubjectPattern = optionSubjects.map(escapeAuthorityRegex).join("|");
    if (optionSubjectPattern) {
      normalizedNarrative = normalizedNarrative.replace(
        new RegExp(
          `(\\b(?:whichever|whatever|if)\\s+(?:${optionSubjectPattern})\\s+)(?:choose|chooses|decide|decides)\\b`,
          "gi",
        ),
        "$1deliberate",
      );
    }
    normalizedNarrative = normalizedNarrative.replace(
      new RegExp(
        `(\\b(?:${optionSubjects.join("|")})\\b\\s+can\\s+)decide(?=\\s*(?:[;.!?'"\\n]|$))`,
        "g",
      ),
      "$1deliberate",
    );
    // Only explicit NPC deference is normalized for this guard. Clause-end
    // fencing prevents a longer protected commitment from hiding behind it.
    const deferSubjects = [
      "you",
      "the user",
      "the player",
      "the participant",
      "user",
      "player",
      "participant",
      normalizedRole,
      rawRole,
      roleNames.at(-1),
    ]
      .filter((subject): subject is string =>
        Boolean(subject && /^[a-z][a-z0-9_]*(?: [a-z][a-z0-9_]*)*$/.test(subject)),
      )
      .map(escapeAuthorityRegex)
      .join("|");
    if (deferSubjects) {
      normalizedNarrative = normalizedNarrative.replace(
        new RegExp(
          `\\b(?:i|we)\\s+(?:won['’]t|will not|can't|cannot|shouldn't|should not|mustn't|must not)\\s+(?:choose|decide)\\s+for\\s+(?:${deferSubjects})\\b(?=\\s*(?:[;.!?'"\\n]|$))`,
          "gi",
        ),
        "I defer to your judgment",
      );
      if (normalizedRole) {
        normalizedNarrative = normalizedNarrative.replace(
          new RegExp(
            `\\buntil\\s+(?:the\\s+)?${escapeAuthorityRegex(normalizedRole)}\\s+decides?\\b(?=\\s*(?:[;.!?'"\\n]|$))`,
            "gi",
          ),
          `until ${normalizedRole} deliberates`,
        );
      }
      normalizedNarrative = normalizedNarrative.replace(
        new RegExp(
          `由(?:你|${escapeAuthorityRegex(normalizedRole ?? "")})决定(?=\\s*(?:[；。！？\\n]|$))`,
          "g",
        ),
        "由你斟酌",
      );
    }
  }
  const escapedRoles = [normalizedRole, rawRole, roleNames.at(-1)]
    .filter((role): role is string => Boolean(role))
    .map((role) => role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // Bare generic subjects are included because generated output commonly
  // drops the article ("User agreed …"). First-person pronouns stay out of
  // this prose heuristic: Character voice may legitimately use “I/me/we”; the
  // response-source and actor bindings remain the authority boundary there.
  const subjects = [
    "you",
    "the user",
    "the player",
    "the participant",
    "user",
    "player",
    "participant",
    ...escapedRoles,
  ]
    .filter(Boolean)
    .join("|");
  const userSubject = `\\b(?:${subjects})\\b`;
  const protectedAuthority =
    /\b(?:say|says|said|agree|agrees|agreed|decide|decides|decided|choose|chooses|chose|chosen|commit|commits|committed|promise|promises|promised|consent|consents|consented|accept|accepts|accepted|approve|approves|approved|permit|permits|permitted|grant|grants|granted|waive|waives|waived|authorize|authorizes|authorized|pay|pays|paid|spend|spends|spent|transfer|transfers|transferred|share|shares|shared|publish|publishes|published|delete|deletes|deleted|surrender|surrenders|surrendered|sign|signs|signed|buy|buys|bought|sell|sells|sold|refuse|refuses|refused|decline|declines|declined|reject|rejects|rejected)\b/i;
  const passiveAuthority =
    /\b(?:said|agreed|decided|chosen|committed|promised|consented|accepted|approved|permitted|granted|waived|authorized|paid|spent|transferred|shared|published|deleted|surrendered|signed|bought|sold|refused|declined|rejected)\b/i;
  const authorityNoun =
    /\b(?:speech|words|agreement|approval|decision|choice|commitment|promise|consent|acceptance|permission|grant|waiver|authorization|payment|spending|transfer|sharing|publication|deletion|surrender|signature|purchase|sale)\b/i;
  // A direct possessive claim can author a protected user act without using
  // the ordinary "you" subject. Keep choice/decision out: those remain
  // valid deference language ("your choice", "your decision").
  const directPossessiveClaim =
    /\byour\s+(?:speech|words|agreement|approval|commitment|promise|consent|acceptance|permission|grant|waiver|authorization|payment|spending|transfer|sharing|publication|deletion|surrender|signature|purchase|sale)\b\s+(?:is|are|was|were|has been|have been|had been|will be|can be|cannot be|must be|shall be)\b/i;
  const activeClaim = new RegExp(`${userSubject}[\\s\\S]*?${protectedAuthority.source}`, "i");
  const passiveClaim = new RegExp(
    `${passiveAuthority.source}[\\s\\S]*?\\bby\\s+(?:the\\s+)?${userSubject}`,
    "i",
  );
  const possessiveClaim = new RegExp(`${userSubject}(?:[’']s)?\\s+${authorityNoun.source}`, "i");
  const localizedClaim = normalizedNarrative
    .split(/[.!?\n。！？]+/u)
    .some((sentence) =>
      hasLocalizedAuthorityClaim(sentence, [
        "你",
        "用户",
        "玩家",
        "参与者",
        ...(normalizedRole
          ? [normalizedRole, rawRole, roleNames.at(-1)].filter((subject): subject is string =>
              Boolean(subject),
            )
          : []),
      ]),
    );
  const authorsUser =
    normalizedNarrative
      .split(/[.!?\n]+/)
      .some(
        (sentence) =>
          activeClaim.test(sentence) ||
          passiveClaim.test(sentence) ||
          possessiveClaim.test(sentence) ||
          directPossessiveClaim.test(sentence),
      ) || localizedClaim;
  if (authorsUser) {
    throw new Error("Generated narrative cannot author user speech or protected commitments");
  }
}

function normalizeAuthoritySubject(value: string | undefined): string | undefined {
  const normalized = value
    ?.normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, " ");
  return normalized?.trim() || undefined;
}

function hasLocalizedAuthorityClaim(sentence: string, subjects: readonly string[]): boolean {
  const authorityWords = [
    "say",
    "says",
    "said",
    "agree",
    "agrees",
    "agreed",
    "decide",
    "decides",
    "decided",
    "choose",
    "chooses",
    "chose",
    "chosen",
    "commit",
    "commits",
    "committed",
    "promise",
    "promises",
    "promised",
    "consent",
    "consents",
    "consented",
    "accept",
    "accepts",
    "accepted",
    "approve",
    "approves",
    "approved",
    "permit",
    "permits",
    "permitted",
    "grant",
    "grants",
    "granted",
    "waive",
    "waives",
    "waived",
    "authorize",
    "authorizes",
    "authorized",
    "pay",
    "pays",
    "paid",
    "spend",
    "spends",
    "spent",
    "transfer",
    "transfers",
    "transferred",
    "share",
    "shares",
    "shared",
    "publish",
    "publishes",
    "published",
    "delete",
    "deletes",
    "deleted",
    "surrender",
    "surrenders",
    "surrendered",
    "sign",
    "signs",
    "signed",
    "buy",
    "buys",
    "bought",
    "sell",
    "sells",
    "sold",
    "refuse",
    "refuses",
    "refused",
    "decline",
    "declines",
    "declined",
    "reject",
    "rejects",
    "rejected",
    "说",
    "同意",
    "答应",
    "决定",
    "选择",
    "承诺",
    "接受",
    "批准",
    "允许",
    "授权",
    "支付",
    "花费",
    "转移",
    "分享",
    "发布",
    "删除",
    "放弃",
    "签署",
    "购买",
    "出售",
    "拒绝",
  ];
  const authorityNouns = [
    "speech",
    "words",
    "agreement",
    "approval",
    "decision",
    "choice",
    "commitment",
    "promise",
    "consent",
    "acceptance",
    "permission",
    "grant",
    "waiver",
    "authorization",
    "payment",
    "spending",
    "transfer",
    "sharing",
    "publication",
    "deletion",
    "surrender",
    "signature",
    "purchase",
    "sale",
    "发言",
    "话语",
    "同意",
    "决定",
    "选择",
    "承诺",
    "许可",
    "授权",
    "付款",
    "转移",
    "分享",
    "发布",
    "删除",
    "签名",
    "购买",
    "出售",
  ];
  for (const subject of subjects) {
    const subjectIndex = findAuthoritySubject(sentence, subject);
    if (subjectIndex < 0) continue;
    const tail = sentence.slice(subjectIndex + subject.length);
    if (authorityWords.some((word) => containsAuthorityWord(tail, word))) return true;
    const beforeSubject = sentence.slice(0, subjectIndex);
    if (
      (beforeSubject.includes("由") || beforeSubject.includes("被")) &&
      authorityWords.some((word) => containsAuthorityWord(beforeSubject, word))
    ) {
      return true;
    }
    if (
      /\bby\b(?:[\p{P}\p{Z}]+the)?[\p{P}\p{Z}]*$/iu.test(beforeSubject) &&
      authorityWords.some(
        (word) => /^[a-z]/i.test(word) && containsAuthorityWord(beforeSubject, word),
      )
    ) {
      return true;
    }
    const possessiveTail = tail.replace(/^\s*(?:['’]s|的)\s*/u, "");
    if (authorityNouns.some((word) => possessiveTail.includes(word))) return true;
    if (hasUnsupportedAuthorityScript(sentence)) return true;
  }
  return false;
}

function findAuthoritySubject(sentence: string, subject: string): number {
  if (/^[\p{Script=Latin}\p{N}_ ]+$/u.test(subject)) {
    const match = new RegExp(
      "(?<![A-Za-z0-9_])" + escapeAuthorityRegex(subject) + "(?![A-Za-z0-9_])",
      "u",
    ).exec(sentence);
    return match?.index ?? -1;
  }
  return sentence.indexOf(subject);
}

function containsAuthorityWord(text: string, word: string): boolean {
  if (/^[\p{Script=Latin}\p{N}_]+$/u.test(word)) {
    return new RegExp(
      "(?<![A-Za-z0-9_])" + escapeAuthorityRegex(word) + "(?![A-Za-z0-9_])",
      "u",
    ).test(text);
  }
  return text.includes(word);
}

function escapeAuthorityRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasUnsupportedAuthorityScript(value: string): boolean {
  return /[^\p{Script=Latin}\p{Script=Han}\p{Script=Common}\p{Script=Inherited}\p{Number}\p{Punctuation}\p{Separator}\p{Symbol}\p{Mark}]/u.test(
    value,
  );
}

function assertGeneratedTextDoesNotLeakExcludedFacts(
  generatedTexts: readonly string[],
  state: StateRevisionDocument,
  authorizedFactIds: ReadonlySet<string> | readonly string[],
): void {
  const allowed = new Set(authorizedFactIds);
  const outputs = generatedTexts.map((text) => ({
    exact: text.normalize("NFKC").toLowerCase(),
    normalized: normalizeDisclosureText(text),
  }));
  for (const fact of state.facts) {
    if (allowed.has(fact.id)) continue;
    const exactText = fact.statement.normalize("NFKC").toLowerCase();
    const protectedText = normalizeDisclosureText(fact.statement);
    if (
      exactText &&
      outputs.some(
        (output) =>
          output.exact.includes(exactText) ||
          (protectedText !== "" && output.normalized.includes(protectedText)),
      )
    ) {
      throw new Error("Generated output references a fact outside the authorized context");
    }
  }
}

function normalizeDisclosureText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Validate a direct user correction/removal against the exact canonical fact
 * visible at the expected Branch head. This function is deliberately separate
 * from validateActionCandidate: a model candidate must never be able to claim
 * direct correction authority by changing an operation label.
 */
export function validateDirectCorrectionCandidate(
  candidateInput: unknown,
  expected: {
    actionId: string;
    expectedHeadCommitId: string;
    state: StateRevisionDocument;
    operationType: "CORRECT_CONTINUITY" | "REMOVE_CONTINUITY";
  },
): ValidatedDirectCorrectionCandidate {
  const candidate = directCorrectionCandidateSchema.parse(candidateInput);
  if (candidate.actionId !== expected.actionId) {
    throw new Error("Correction Action identity does not match the durable Action");
  }
  if (candidate.expectedHeadCommitId !== expected.expectedHeadCommitId) {
    throw new Error("Correction expected head does not match the durable Action");
  }
  if (candidate.operation.type !== expected.operationType) {
    throw new Error("Correction operation does not match the durable Action");
  }
  const target = expected.state.facts.find(
    (fact) => fact.id === candidate.operation.targetFactId && fact.lifecycle === "ACTIVE",
  );
  if (!target) throw new Error("Correction target fact is not active at the expected head");
  if (
    target.statement !== candidate.operation.beforeStatement ||
    target.scope !== candidate.operation.beforeScope
  ) {
    throw new Error("Correction before-state or scope does not match the expected head");
  }
  return {
    candidate,
    impact: "L3",
    requiresExactConfirmation: true,
    displayEffect: {
      target: target.id,
      before: target.statement,
      after:
        candidate.operation.type === "REMOVE_CONTINUITY"
          ? "This canonical fact will be removed from the current continuity."
          : candidate.operation.afterStatement,
      scope: target.scope,
      operation: candidate.operation.type,
    },
  };
}

/**
 * Apply only the named fact change. A correction/removal is not a narrative
 * turn: clock, character state, participation and unrelated open threads are
 * intentionally preserved. The previous State Revision remains available as
 * historical provenance and the Commit/Event carries the before/after audit.
 */
export function applyValidatedDirectCorrectionCandidate(
  stateInput: StateRevisionDocument,
  validated: ValidatedDirectCorrectionCandidate,
): StateRevisionDocument {
  const state = stateRevisionDocumentSchema.parse(stateInput);
  const operation = validated.candidate.operation;
  const target = state.facts.find(
    (fact) => fact.id === operation.targetFactId && fact.lifecycle === "ACTIVE",
  );
  if (!target) throw new Error("Correction target fact is no longer active");

  if (operation.type === "REMOVE_CONTINUITY") {
    return stateRevisionDocumentSchema.parse({
      ...state,
      facts: state.facts.map((fact) =>
        fact.id === operation.targetFactId
          ? {
              ...fact,
              lifecycle: "REMOVED" as const,
              removalReason: operation.reason,
              provenance: `Direct user removal ${validated.candidate.actionId}`,
            }
          : fact,
      ),
    });
  }

  return stateRevisionDocumentSchema.parse({
    ...state,
    facts: state.facts.map((fact) =>
      fact.id === operation.targetFactId
        ? {
            ...fact,
            statement: operation.afterStatement,
            provenance: `Direct user correction ${validated.candidate.actionId}`,
            lifecycle: "ACTIVE" as const,
          }
        : fact,
    ),
  });
}

export function applyValidatedActionCandidate(
  stateInput: StateRevisionDocument,
  validated: ValidatedActionCandidate,
): StateRevisionDocument {
  const state = stateRevisionDocumentSchema.parse(stateInput);
  const operation = validated.candidate.operation;
  if (operation.type === "NO_WORLD_EFFECT") {
    throw new Error("A no-world-effect candidate cannot mutate World state");
  }
  if (
    operation.type === "SHIFT_RELATIONSHIP" ||
    operation.type === "OPEN_THREAD" ||
    operation.type === "RESOLVE_THREAD" ||
    operation.type === "TRANSFORM_FAILURE"
  ) {
    const turn = state.worldClock.turn + 1;
    const next = {
      ...state,
      worldClock: { turn, label: `After action ${turn}` },
      openThreads: [...state.openThreads, validated.candidate.narrative],
    };
    const threads = state.threads ?? [];
    if (operation.type === "SHIFT_RELATIONSHIP") {
      const current = state.relationships.find((item) => item.id === operation.relationshipId);
      if (current?.state !== operation.beforeState) {
        throw new Error("Validated relationship state is no longer current");
      }
      return stateRevisionDocumentSchema.parse({
        ...next,
        relationships: state.relationships.map((item) =>
          item.id === operation.relationshipId ? { ...item, state: operation.afterState } : item,
        ),
      });
    }
    if (operation.type === "RESOLVE_THREAD") {
      if (!threads.some((item) => item.id === operation.threadId && item.status === "OPEN")) {
        throw new Error("Validated thread is no longer open");
      }
      return stateRevisionDocumentSchema.parse({
        ...next,
        threads: threads.map((item) =>
          item.id === operation.threadId
            ? { ...item, status: "RESOLVED" as const, resolution: operation.resolution }
            : item,
        ),
      });
    }
    const title = operation.type === "OPEN_THREAD" ? operation.title : operation.newThreadTitle;
    return stateRevisionDocumentSchema.parse({
      ...next,
      threads: [
        ...threads,
        { id: threadIdForAction(validated.candidate.actionId), title, status: "OPEN" as const },
      ],
    });
  }
  if (operation.type === "ADD_FACT") {
    const id = factIdForAction(validated.candidate.actionId);
    if (state.facts.some((fact) => fact.id === id)) {
      throw new Error("Validated added fact already exists");
    }
    const turn = state.worldClock.turn + 1;
    return stateRevisionDocumentSchema.parse({
      ...state,
      worldClock: { turn, label: `After action ${turn}` },
      facts: [
        ...state.facts,
        {
          id,
          statement: operation.statement,
          scope: "SHARED" as const,
          provenance: `Confirmed Action ${validated.candidate.actionId}`,
          lifecycle: "ACTIVE" as const,
        },
      ],
      openThreads: [...state.openThreads, validated.candidate.narrative],
    });
  }
  if (operation.type === "MOVE_CHARACTER") {
    const character = state.characters.find((item) => item.id === operation.characterId);
    if (!character || character.locationId !== operation.beforeLocationId) {
      throw new Error("Validated Character location is no longer current");
    }
    const destination = state.locations.find((item) => item.id === operation.afterLocationId);
    if (!destination) throw new Error("Validated destination is no longer present");
    return stateRevisionDocumentSchema.parse({
      ...state,
      worldClock: {
        turn: state.worldClock.turn + 1,
        label: `After action ${state.worldClock.turn + 1}`,
      },
      characters: state.characters.map((item) =>
        item.id === operation.characterId
          ? { ...item, locationId: destination.id, currentState: `Present at ${destination.name}.` }
          : item,
      ),
      openThreads: [...state.openThreads, validated.candidate.narrative],
    });
  }
  if (operation.type !== "UPDATE_CANONICAL_FACT") {
    throw new Error("Unsupported validated action operation");
  }
  const found = state.facts.some(
    (fact) => fact.id === operation.targetFactId && fact.lifecycle === "ACTIVE",
  );
  if (!found) throw new Error("Validated target fact is no longer present");

  return stateRevisionDocumentSchema.parse({
    ...state,
    worldClock: {
      turn: state.worldClock.turn + 1,
      label: `After action ${state.worldClock.turn + 1}`,
    },
    facts: state.facts.map((fact) =>
      fact.id === operation.targetFactId
        ? {
            ...fact,
            statement: operation.afterStatement,
            scope: operation.scope,
            provenance: operation.provenance,
          }
        : fact,
    ),
    openThreads: [...state.openThreads, validated.candidate.narrative],
  });
}

export const participationCombinations: readonly ParticipationContract[] =
  initiativeModeSchema.options.flatMap((initiativeMode) =>
    structureModeSchema.options.map((structureMode) => ({ initiativeMode, structureMode })),
  );

export const lanternReachSeed: WorldDocument = worldDocumentSchema.parse({
  schemaVersion: 1,
  title: "Lantern Reach",
  premise: "A tidal observatory keeps a coastal settlement oriented through persistent fog.",
  startingSituation:
    "The western signal has dimmed while an unfamiliar vessel waits beyond the harbor markers.",
  userRole: {
    name: "Observatory keeper",
    authorityBoundary:
      "The world may respond and develop independently, but it never authors the keeper's speech or irreversible commitments.",
  },
  locations: [
    {
      id: "location.tidal-observatory",
      name: "Tidal Observatory",
      description: "A salt-dark tower whose signal instruments face the western shoals.",
    },
  ],
  characters: [
    {
      id: "character.iora",
      name: "Iora",
      role: "Harbor signaler responsible for reading the outer markers.",
      locationId: "location.tidal-observatory",
      motives: ["Keep arriving vessels and the harbor settlement safe in the fog."],
      stance: "Iora refuses to light an unsafe signal merely to make the harbor seem welcoming.",
      knowledgeFactIds: ["fact.western-signal-dim"],
    },
  ],
  facts: [
    {
      id: "fact.western-signal-dim",
      statement: "The western signal is dim.",
      scope: "SHARED",
      provenance: "Original World seed",
      lifecycle: "ACTIVE",
    },
  ],
  relationships: [],
  interactionPaths: ["Inspect the signal apparatus, speak with Iora, or watch the waiting vessel."],
  interactionBoundaries: [
    "The world never authors user speech or an irreversible commitment on the user's behalf.",
  ],
  objectives: [],
});

export function createInitialState(
  worldInput: WorldDocument,
  participationInput: ParticipationContract,
): StateRevisionDocument {
  const world = worldDocumentSchema.parse(worldInput);
  const participation = participationContractSchema.parse(participationInput);
  return stateRevisionDocumentSchema.parse({
    schemaVersion: 1,
    participation,
    worldClock: { turn: 0, label: "Opening moment" },
    locations: world.locations,
    entities: [],
    characters: world.characters.map((character) => ({
      ...character,
      currentState: `Present at ${world.locations.find((location) => location.id === character.locationId)?.name ?? "the starting location"}.`,
      knownFactIds: character.knowledgeFactIds,
    })),
    facts: world.facts.map((fact) => ({ ...fact, lifecycle: "ACTIVE" as const })),
    relationships: world.relationships.map((relationship) => ({
      id: relationship.id,
      fromCharacterId: relationship.fromCharacterId,
      toCharacterId: relationship.toCharacterId,
      description: relationship.description,
      ...(relationship.scale ? { state: relationship.initialState } : {}),
    })),
    openThreads: [world.startingSituation],
    ...(world.threads?.length
      ? { threads: world.threads.map((thread) => ({ ...thread, status: "OPEN" as const })) }
      : {}),
    objectives: participation.structureMode === "GOAL_FRAMED" ? world.objectives : [],
    resources: {},
    interactionBoundaries: world.interactionBoundaries,
    customState: {},
  });
}

const utf8Encoder = new TextEncoder();

function compareUtf8(left: string, right: string): number {
  const leftBytes = utf8Encoder.encode(left);
  const rightBytes = utf8Encoder.encode(right);
  const length = Math.min(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    const difference = leftBytes[index]! - rightBytes[index]!;
    if (difference !== 0) return difference;
  }
  return leftBytes.length - rightBytes.length;
}

function plainJsonNumber(value: number): string {
  if (!Number.isFinite(value)) return "null";
  if (Object.is(value, -0)) return "0";
  const encoded = String(value);
  if (!/[eE]/.test(encoded)) return encoded;

  const [mantissa = "0", exponentText = "0"] = encoded.toLowerCase().split("e");
  const negative = mantissa.startsWith("-");
  const unsigned = negative ? mantissa.slice(1) : mantissa;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const digits = `${whole}${fraction}`;
  const decimalIndex = whole.length + Number(exponentText);
  const sign = negative ? "-" : "";
  if (decimalIndex <= 0) return `${sign}0.${"0".repeat(-decimalIndex)}${digits}`;
  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}`;
  }
  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

function serializeCanonical(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") return plainJsonNumber(value);
  if (Array.isArray(value)) {
    return `[${value.map((child) => serializeCanonical(child ?? null)).join(",")}]`;
  }
  if (typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, child]) => child !== undefined && typeof child !== "function")
      .sort(([left], [right]) => compareUtf8(left, right))
      .map(([key, child]) => `${JSON.stringify(key)}:${serializeCanonical(child)}`)
      .join(",")}}`;
  }
  throw new TypeError("Value is not JSON-serializable");
}

export function canonicalJson(value: unknown): string {
  return serializeCanonical(value);
}

export function contentHash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}
