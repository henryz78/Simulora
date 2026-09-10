import { createHash } from "node:crypto";
import { z } from "zod";

export const implementationPhase = "IP-6" as const;

const stableIdSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9][a-z0-9._-]*$/);
const nonEmptyTextSchema = z.string().trim().min(1).max(4_000);

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
    characters: z.array(worldCharacterSpecSchema).min(1),
    facts: z.array(worldFactSchema).min(1),
    relationships: z.array(
      z.object({
        id: stableIdSchema,
        fromCharacterId: stableIdSchema,
        toCharacterId: stableIdSchema,
        description: nonEmptyTextSchema,
      }),
    ),
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
    ];

    if (new Set(allIds).size !== allIds.length) {
      context.addIssue({ code: "custom", message: "World stable IDs must be unique" });
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
      }),
    ),
    openThreads: z.array(nonEmptyTextSchema),
    objectives: z.array(nonEmptyTextSchema),
    resources: z.record(z.string(), z.number().finite()),
    interactionBoundaries: z.array(nonEmptyTextSchema).min(1),
    customState: z.record(z.string(), z.unknown()),
  })
  .superRefine((state, context) => {
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
  currentState: string;
  knownFacts: StateFact[];
  relationships: StateRevisionDocument["relationships"];
};

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
    operation: z
      .object({
        type: z.literal("UPDATE_CANONICAL_FACT"),
        targetFactId: stableIdSchema,
        beforeStatement: nonEmptyTextSchema,
        afterStatement: nonEmptyTextSchema,
        scope: factScopeSchema,
        provenance: nonEmptyTextSchema,
      })
      .strict(),
  })
  .strict();

export type ActionStatus = z.infer<typeof actionStatusSchema>;
export type ActionCandidate = z.infer<typeof actionCandidateSchema>;
export type ActionResponseSource = ActionCandidate["responseSource"];
export type ConsequenceImpact = "L3";

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
  requiresExactConfirmation: true;
  displayEffect: {
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
  assertGeneratedNarrativeDoesNotAuthorUser(candidate.narrative, expected.userRoleName);
  assertGeneratedNarrativeDoesNotAuthorUser(
    candidate.operation.afterStatement,
    expected.userRoleName,
  );
  assertGeneratedNarrativeDoesNotAuthorUser(candidate.operation.provenance, expected.userRoleName);
  if (candidate.operation.provenance !== `Confirmed Action ${candidate.actionId}`) {
    throw new Error("Candidate provenance must be the server-verifiable Action reference");
  }

  const allowed = expected.authorizedTargetFactIds;
  if (
    allowed &&
    !(Array.isArray(allowed)
      ? allowed.includes(candidate.operation.targetFactId)
      : (allowed as ReadonlySet<string>).has(candidate.operation.targetFactId))
  ) {
    throw new Error("Candidate target fact is outside the authorized context");
  }
  const target = expected.state.facts.find(
    (fact) => fact.id === candidate.operation.targetFactId && fact.lifecycle === "ACTIVE",
  );
  if (!target) throw new Error("Candidate target fact is not present at the expected head");
  if (
    target.statement !== candidate.operation.beforeStatement ||
    target.scope !== candidate.operation.scope
  ) {
    throw new Error("Candidate before-state or scope does not match the expected head");
  }
  assertGeneratedTextDoesNotLeakExcludedFacts(
    [candidate.narrative, candidate.operation.afterStatement],
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
      after: candidate.operation.afterStatement,
      scope: target.scope,
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
): void {
  const roleNames = userRoleName?.trim().split(/\s+/) ?? [];
  const escapedRoles = [userRoleName?.trim(), roleNames.at(-1)]
    .filter((role): role is string => Boolean(role && role.length >= 3))
    .map((role) => role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const subjects = ["you", "the user", "the player", "the participant", ...escapedRoles]
    .filter(Boolean)
    .join("|");
  const userSubject = `\\b(?:${subjects})\\b`;
  const protectedAuthority =
    /\b(?:say|says|said|agree|agrees|agreed|decide|decides|decided|choose|chooses|chose|chosen|commit|commits|committed|promise|promises|promised|consent|consents|consented|accept|accepts|accepted|approve|approves|approved|permit|permits|permitted|grant|grants|granted|waive|waives|waived|authorize|authorizes|authorized|pay|pays|paid|spend|spends|spent|transfer|transfers|transferred|share|shares|shared|publish|publishes|published|delete|deletes|deleted|surrender|surrenders|surrendered|sign|signs|signed|buy|buys|bought|sell|sells|sold)\b/i;
  const passiveAuthority =
    /\b(?:said|agreed|decided|chosen|committed|promised|consented|accepted|approved|permitted|granted|waived|authorized|paid|spent|transferred|shared|published|deleted|surrendered|signed|bought|sold)\b/i;
  const authorityNoun =
    /\b(?:speech|words|agreement|approval|decision|choice|commitment|promise|consent|acceptance|permission|grant|waiver|authorization|payment|spending|transfer|sharing|publication|deletion|surrender|signature|purchase|sale)\b/i;
  const activeClaim = new RegExp(`${userSubject}[\\s\\S]*?${protectedAuthority.source}`, "i");
  const passiveClaim = new RegExp(
    `${passiveAuthority.source}[\\s\\S]*?\\bby\\s+(?:the\\s+)?${userSubject}`,
    "i",
  );
  const possessiveClaim = new RegExp(`${userSubject}(?:[’']s)?\\s+${authorityNoun.source}`, "i");
  const authorsUser = narrative
    .split(/[.!?\n]+/)
    .some(
      (sentence) =>
        activeClaim.test(sentence) || passiveClaim.test(sentence) || possessiveClaim.test(sentence),
    );
  if (authorsUser) {
    throw new Error("Generated narrative cannot author user speech or protected commitments");
  }
}

function assertGeneratedTextDoesNotLeakExcludedFacts(
  generatedTexts: readonly string[],
  state: StateRevisionDocument,
  authorizedFactIds: ReadonlySet<string> | readonly string[],
): void {
  const allowed = new Set(authorizedFactIds);
  const normalizedOutputs = generatedTexts.map(normalizeDisclosureText);
  for (const fact of state.facts) {
    if (allowed.has(fact.id)) continue;
    const protectedText = normalizeDisclosureText(fact.statement);
    if (
      protectedText.length >= 8 &&
      normalizedOutputs.some((output) => output.includes(protectedText))
    ) {
      throw new Error("Generated output references a fact outside the authorized context");
    }
  }
}

function normalizeDisclosureText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
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
    relationships: world.relationships,
    openThreads: [world.startingSituation],
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
