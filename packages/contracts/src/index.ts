import { z } from "zod";

export const serviceNameSchema = z.enum(["api", "worker", "web"]);

export const healthStatusSchema = z.object({
  service: serviceNameSchema,
  status: z.enum(["ok", "degraded"]),
  version: z.string().min(1),
});

export const foundationCapabilitySchema = z.object({
  name: z.string().min(1),
  status: z.enum(["configured", "not-configured", "not-started"]),
});

export const foundationResponseSchema = z.object({
  productImplementationPhase: z.enum(["IP-1", "IP-2", "IP-3", "IP-4", "IP-5", "IP-6"]),
  productSemanticsStarted: z.boolean(),
  capabilities: z.array(foundationCapabilitySchema),
});

export const correlationContextSchema = z.object({
  requestId: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9._:-]+$/),
  traceId: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9._:-]+$/)
    .optional(),
});

export const workEnvelopeSchema = z.object({
  jobId: z.string().min(1),
  correlation: correlationContextSchema,
  payload: z.unknown(),
});

const stableIdSchema = z.string().uuid();
const nonEmptyTextSchema = z.string().trim().min(1).max(4_000);
const participationSchema = z.object({
  initiativeMode: z.enum(["DIRECT", "GUIDED", "WORLD_ACTIVE"]),
  structureMode: z.enum(["OPEN_ENDED", "GOAL_FRAMED"]),
});

export const worldDocumentInputSchema = z.object({
  schemaVersion: z.literal(1),
  title: z.string().trim().min(1).max(120),
  premise: nonEmptyTextSchema,
  startingSituation: nonEmptyTextSchema,
  userRole: z.object({ name: z.string().trim().min(1), authorityBoundary: nonEmptyTextSchema }),
  locations: z
    .array(
      z.object({ id: z.string().min(1), name: z.string().min(1), description: nonEmptyTextSchema }),
    )
    .min(1),
  routineRoutes: z
    .array(
      z.object({
        fromLocationId: z.string().min(1),
        toLocationId: z.string().min(1),
        label: nonEmptyTextSchema,
      }),
    )
    .optional(),
  characters: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        role: nonEmptyTextSchema,
        locationId: z.string().min(1),
        motives: z.array(nonEmptyTextSchema).min(1).default(["Act consistently with this role."]),
        stance: nonEmptyTextSchema.default(
          "May disagree or refuse when the character's motives require it.",
        ),
        knowledgeFactIds: z.array(z.string().min(1)).default([]),
        sourceAssetId: stableIdSchema.optional(),
      }),
    )
    .min(1),
  facts: z
    .array(
      z.object({
        id: z.string().min(1),
        statement: nonEmptyTextSchema,
        scope: z.enum(["ACCOUNT_PRIVATE", "CONTINUITY_PRIVATE", "SHARED"]),
        provenance: nonEmptyTextSchema,
        lifecycle: z.literal("ACTIVE"),
      }),
    )
    .min(1),
  relationships: z.array(
    z.object({
      id: z.string().min(1),
      fromCharacterId: z.string().min(1),
      toCharacterId: z.string().min(1),
      description: nonEmptyTextSchema,
    }),
  ),
  interactionPaths: z.array(nonEmptyTextSchema).min(1),
  interactionBoundaries: z.array(nonEmptyTextSchema).min(1),
  objectives: z.array(nonEmptyTextSchema).default([]),
});

export const createWorldRequestSchema = z.object({ document: worldDocumentInputSchema });
export const updateWorldDraftRequestSchema = z.object({
  expectedVersion: z.number().int().positive(),
  document: worldDocumentInputSchema,
});
export const createWorldRevisionRequestSchema = z.object({
  expectedDraftVersion: z.number().int().positive(),
});
export const startContinuityRequestSchema = z.object({ participation: participationSchema });

export const authoritativeStateResponseSchema = z.object({
  continuity: z.object({
    id: stableIdSchema,
    branchId: stableIdSchema,
    headCommitId: stableIdSchema,
    stateRevisionId: stableIdSchema,
    worldRevisionId: stableIdSchema,
    worldRevisionNumber: z.number().int().positive(),
  }),
  world: worldDocumentInputSchema,
  state: z.object({
    schemaVersion: z.literal(1),
    participation: participationSchema,
    worldClock: z.object({ turn: z.number().int().nonnegative(), label: nonEmptyTextSchema }),
    locations: z.array(z.unknown()),
    entities: z.array(z.unknown()),
    characters: z.array(z.unknown()),
    facts: z.array(z.unknown()),
    relationships: z.array(z.unknown()),
    openThreads: z.array(nonEmptyTextSchema),
    objectives: z.array(nonEmptyTextSchema),
    resources: z.record(z.string(), z.number()),
    interactionBoundaries: z.array(nonEmptyTextSchema),
    customState: z.record(z.string(), z.unknown()),
  }),
  source: z.object({ stateHash: z.string().regex(/^[0-9a-f]{64}$/) }),
});

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

export const actionOperationTypeSchema = z.enum([
  "PARTICIPATE",
  "CORRECT_CONTINUITY",
  "REMOVE_CONTINUITY",
  "CHANGE_PARTICIPATION_CONTRACT",
]);

export const changeParticipationContractRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(128)
      .regex(/^[A-Za-z0-9._:-]+$/),
    expectedHeadCommitId: stableIdSchema,
    before: participationSchema,
    after: participationSchema,
  })
  .strict()
  .superRefine((request, context) => {
    if (
      request.before.initiativeMode === request.after.initiativeMode &&
      request.before.structureMode === request.after.structureMode
    ) {
      context.addIssue({ code: "custom", path: ["after"], message: "Contract is unchanged" });
    }
  });

export const characterAssetDefinitionSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: z.string().trim().min(1).max(120),
    role: nonEmptyTextSchema,
    motives: z.array(nonEmptyTextSchema).min(1),
    stance: nonEmptyTextSchema,
    knowledgeFactIds: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const createCharacterAssetRequestSchema = z
  .object({ document: characterAssetDefinitionSchema })
  .strict();

export const characterAssetResponseSchema = z
  .object({
    id: stableIdSchema,
    document: characterAssetDefinitionSchema,
    documentHash: z.string().regex(/^[0-9a-f]{64}$/),
    createdAt: z.string().datetime(),
  })
  .strict();

export const canonicalFactLifecycleSchema = z.enum(["ACTIVE", "SUPERSEDED", "REMOVED"]);

/** Shared freshness contract for every rebuildable projection. */
export const projectionFreshnessSchema = z.object({
  sourceHeadCommitId: stableIdSchema,
  currentHeadCommitId: stableIdSchema,
  status: z.enum(["FRESH", "STALE", "REBUILDING"]),
  headDistance: z.number().int().nonnegative(),
});

export const submitActionRequestSchema = z.object({
  schemaVersion: z.literal(1),
  idempotencyKey: z
    .string()
    .trim()
    .min(8)
    .max(128)
    .regex(/^[A-Za-z0-9._:-]+$/),
  expectedHeadCommitId: stableIdSchema,
  participationExpectation: participationSchema,
  intent: nonEmptyTextSchema,
  targetCharacterId: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9._-]*$/)
    .optional(),
  requestedEffect: z.enum(["FACT_REWRITE", "ROUTINE_EFFECT", "NO_WORLD_EFFECT"]).optional(),
});

export const actionProposalSchema = z.object({
  id: stableIdSchema,
  digest: z.string().regex(/^[0-9a-f]{64}$/),
  expectedHeadCommitId: stableIdSchema,
  impact: z.enum(["L0", "L2", "L3"]),
  expiresAt: z.string().datetime(),
  narrative: nonEmptyTextSchema,
  responseSource: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("WORLD") }).strict(),
      z.object({ type: z.literal("CHARACTER"), characterId: z.string().min(1).max(120) }).strict(),
    ])
    .nullable(),
  displayEffect: z.object({
    target: z.string().min(1),
    before: nonEmptyTextSchema,
    after: nonEmptyTextSchema,
    scope: z.enum(["ACCOUNT_PRIVATE", "CONTINUITY_PRIVATE", "SHARED"]),
  }),
});

export const actionCommitSchema = z.object({
  id: stableIdSchema,
  resultingHeadCommitId: stableIdSchema,
  stateRevisionId: stableIdSchema,
  committedAt: z.string().datetime(),
});

export const actionResponseSchema = z.object({
  id: stableIdSchema,
  continuityId: stableIdSchema,
  branchId: stableIdSchema,
  expectedHeadCommitId: stableIdSchema,
  status: actionStatusSchema,
  // Defaults keep previously persisted IP-3 Action records readable while
  // exposing the direct correction/removal operation to new clients.
  operationType: actionOperationTypeSchema.default("PARTICIPATE"),
  intent: nonEmptyTextSchema,
  targetCharacterId: z.string().min(1).max(120).optional(),
  participationExpectation: participationSchema,
  acknowledgedAt: z.string().datetime(),
  terminalAt: z.string().datetime().nullable(),
  recoverableWait: z.boolean(),
  statusReason: z.string().nullable(),
  progressUrl: z.string().min(1),
  eventsUrl: z.string().min(1),
  proposal: actionProposalSchema.nullable(),
  commit: actionCommitSchema.nullable(),
});

export const confirmActionRequestSchema = z.object({
  proposalId: stableIdSchema,
  proposalDigest: z.string().regex(/^[0-9a-f]{64}$/),
  expectedHeadCommitId: stableIdSchema,
});

export const actionProgressFrameSchema = z.object({
  sequence: z.number().int().positive(),
  type: z.enum([
    "action.status",
    "generation.draft",
    "confirmation.required",
    "action.committed",
    "action.failed",
    "heartbeat",
  ]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});

export const actionProgressResponseSchema = z.object({
  actionId: stableIdSchema,
  frames: z.array(actionProgressFrameSchema),
  nextCursor: z.number().int().nonnegative(),
  terminal: z.boolean(),
});

export const branchActionHistorySchema = z.object({
  branchId: stableIdSchema,
  actions: z.array(
    z.object({
      id: stableIdSchema,
      status: actionStatusSchema,
      intent: nonEmptyTextSchema,
      acknowledgedAt: z.string().datetime(),
      committedAt: z.string().datetime().nullable(),
      narrative: z.string().nullable(),
    }),
  ),
});

export const correctionTargetSchema = z
  .object({ type: z.literal("fact"), id: z.string().min(1).max(120) })
  .strict();

export const correctionBeforeSchema = z
  .object({
    statement: nonEmptyTextSchema,
    scope: z.enum(["ACCOUNT_PRIVATE", "CONTINUITY_PRIVATE", "SHARED"]),
  })
  .strict();

// Scope/provenance are intentionally absent from `after`: widening scope or
// supplying model/provider provenance is a separate protected decision and is
// not part of the IP-4 fact correction surface.
export const correctionAfterSchema = z.object({ statement: nonEmptyTextSchema }).strict();

export const correctionRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(128)
      .regex(/^[A-Za-z0-9._:-]+$/),
    expectedHeadCommitId: stableIdSchema,
    target: correctionTargetSchema,
    operation: z.enum(["CORRECT_CONTINUITY", "REMOVE_CONTINUITY"]),
    before: correctionBeforeSchema,
    after: correctionAfterSchema.optional(),
    reason: z.string().trim().min(1).max(1_000),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.operation === "CORRECT_CONTINUITY" && !request.after) {
      context.addIssue({ code: "custom", path: ["after"], message: "Correction requires after" });
    }
    if (request.operation === "REMOVE_CONTINUITY" && request.after) {
      context.addIssue({
        code: "custom",
        path: ["after"],
        message: "Removal cannot include an after statement",
      });
    }
  });

export const correctionDisplayEffectSchema = z
  .object({
    target: z.string().min(1).max(120),
    before: nonEmptyTextSchema,
    after: nonEmptyTextSchema,
    scope: z.enum(["ACCOUNT_PRIVATE", "CONTINUITY_PRIVATE", "SHARED"]),
    operation: z.enum(["CORRECT_CONTINUITY", "REMOVE_CONTINUITY"]),
  })
  .strict();

export const orientationChangeSchema = z
  .object({
    commitId: stableIdSchema,
    eventType: z.string().trim().min(1).max(120),
    summary: nonEmptyTextSchema,
    sourceClass: z.enum(["USER", "WORLD", "CHARACTER", "SYSTEM", "CREATOR_RULE"]),
    scope: z.enum(["ACCOUNT_PRIVATE", "CONTINUITY_PRIVATE", "SHARED"]),
    occurredAt: z.string().datetime(),
    targetId: z.string().min(1).max(120).optional(),
  })
  .strict();

export const pendingActionSummarySchema = z
  .object({
    id: stableIdSchema,
    operationType: actionOperationTypeSchema,
    status: actionStatusSchema,
    expectedHeadCommitId: stableIdSchema,
    updatedAt: z.string().datetime(),
  })
  .strict();

export const orientationResponseSchema = z
  .object({
    continuity: z
      .object({
        id: stableIdSchema,
        branchId: stableIdSchema,
        worldRevisionId: stableIdSchema,
      })
      .strict(),
    current: z
      .object({
        situation: nonEmptyTextSchema,
        locationId: z.string().min(1).max(120).nullable(),
        worldClock: z.object({ turn: z.number().int().nonnegative(), label: nonEmptyTextSchema }),
      })
      .strict(),
    recentChanges: z.array(orientationChangeSchema),
    relationships: z.array(
      z.object({ id: z.string().min(1).max(120), description: nonEmptyTextSchema }).strict(),
    ),
    openThreads: z.array(nonEmptyTextSchema),
    nextParticipation: z
      .object({ expectedHeadCommitId: stableIdSchema, label: nonEmptyTextSchema })
      .strict(),
    pendingActions: z.array(pendingActionSummarySchema),
    freshness: projectionFreshnessSchema,
    authoritativeFallback: z
      .object({
        stateUrl: z.string().min(1),
        headCommitId: stableIdSchema,
        stateRevisionId: stableIdSchema,
      })
      .strict(),
    projectionUpdatedAt: z.string().datetime().nullable(),
  })
  .strict();

export const traceEventSchema = z
  .object({
    id: stableIdSchema,
    type: z.string().trim().min(1).max(120),
    summary: nonEmptyTextSchema,
    targetId: z.string().min(1).max(120).optional(),
    scope: z.enum(["ACCOUNT_PRIVATE", "CONTINUITY_PRIVATE", "SHARED"]),
  })
  .strict();

export const traceCommitSchema = z
  .object({
    id: stableIdSchema,
    parentCommitId: stableIdSchema.nullable(),
    kind: z.string().trim().min(1).max(120),
    sourceClass: z.enum(["USER", "WORLD", "CHARACTER", "SYSTEM", "CREATOR_RULE"]),
    reason: z.string().nullable(),
    createdAt: z.string().datetime(),
    events: z.array(traceEventSchema),
  })
  .strict();

export const branchTraceResponseSchema = z
  .object({
    branchId: stableIdSchema,
    freshness: projectionFreshnessSchema,
    commits: z.array(traceCommitSchema),
    nextCursor: z.string().nullable(),
  })
  .strict();

export const explanationTargetSchema = z
  .object({
    type: z.enum(["fact", "commit"]),
    id: z.string().min(1).max(120),
    statement: nonEmptyTextSchema.optional(),
    lifecycle: canonicalFactLifecycleSchema.optional(),
    current: z.boolean(),
  })
  .strict();

export const explanationSourceSchema = z
  .object({
    class: z.enum(["USER", "WORLD", "CHARACTER", "SYSTEM", "CREATOR_RULE"]),
    commitId: stableIdSchema,
  })
  .strict();

export const explanationCorrectionSchema = z
  .object({
    availableOperations: z.array(z.enum(["CORRECT_CONTINUITY", "REMOVE_CONTINUITY"])),
    href: z.string().min(1),
    requiresExactConfirmation: z.literal(true),
  })
  .strict();

export const explanationResponseSchema = z
  .object({
    target: explanationTargetSchema,
    source: explanationSourceSchema,
    scope: z.enum(["ACCOUNT_PRIVATE", "CONTINUITY_PRIVATE", "SHARED"]),
    freshness: projectionFreshnessSchema,
    explanation: nonEmptyTextSchema,
    correction: explanationCorrectionSchema,
  })
  .strict();

export const recoveryPointSchema = z
  .object({
    id: stableIdSchema,
    continuityId: stableIdSchema,
    branchId: stableIdSchema,
    commitId: stableIdSchema,
    label: z.string().trim().min(1).max(160),
    createdAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable(),
  })
  .strict();

export const recoveryBranchSchema = z
  .object({
    id: stableIdSchema,
    continuityId: stableIdSchema,
    name: z.string().trim().min(1).max(160),
    status: z.enum(["ACTIVE"]),
    headCommitId: stableIdSchema,
    headStateRevisionId: stableIdSchema,
    parentBranchId: stableIdSchema.nullable(),
    forkSourceCommitId: stableIdSchema.nullable(),
    isCurrent: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .strict();

export const restoreProposalSchema = z
  .object({
    id: stableIdSchema,
    continuityId: stableIdSchema,
    branchId: stableIdSchema,
    sourceCommitId: stableIdSchema,
    expectedHeadCommitId: stableIdSchema,
    includedSections: z.array(z.string().min(1)),
    excludedSections: z.array(z.string().min(1)),
    changedSections: z.array(z.string().min(1)),
    sectionChanges: z.array(
      z
        .object({
          section: z.string().min(1),
          before: z.unknown(),
          after: z.unknown(),
        })
        .strict(),
    ),
    beforeHash: z.string().regex(/^[0-9a-f]{64}$/),
    sourceHash: z.string().regex(/^[0-9a-f]{64}$/),
    digest: z.string().regex(/^[0-9a-f]{64}$/),
    expiresAt: z.string().datetime(),
    status: z.enum(["ACTIVE", "CONFIRMED", "STALE", "REJECTED", "EXPIRED"]),
    resultCommitId: stableIdSchema.nullable(),
  })
  .strict();

export const restoreCommitSchema = z
  .object({
    commitId: stableIdSchema,
    stateRevisionId: stableIdSchema,
    resultingHeadCommitId: stableIdSchema,
    committedAt: z.string().datetime(),
  })
  .strict();

export const recoveryResponseSchema = z
  .object({
    continuityId: stableIdSchema,
    currentBranchId: stableIdSchema,
    branches: z.array(recoveryBranchSchema),
    recoveryPoints: z.array(recoveryPointSchema),
    restoreProposals: z.array(restoreProposalSchema),
  })
  .strict();

export const createRecoveryPointRequestSchema = z
  .object({
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(128)
      .regex(/^[A-Za-z0-9._:-]+$/),
    label: z.string().trim().min(1).max(160),
    commitId: stableIdSchema.optional(),
  })
  .strict();

export const forkBranchRequestSchema = z
  .object({
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(128)
      .regex(/^[A-Za-z0-9._:-]+$/),
    name: z.string().trim().min(1).max(160),
    sourceCommitId: stableIdSchema,
    expectedHeadCommitId: stableIdSchema,
  })
  .strict();

export const selectBranchRequestSchema = z
  .object({
    branchId: stableIdSchema,
  })
  .strict();

export const createRestoreProposalRequestSchema = z
  .object({
    sourceCommitId: stableIdSchema,
  })
  .strict();

export const confirmRestoreRequestSchema = z
  .object({
    proposalId: stableIdSchema,
    digest: z.string().regex(/^[0-9a-f]{64}$/),
    expectedHeadCommitId: stableIdSchema,
  })
  .strict();

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type FoundationResponse = z.infer<typeof foundationResponseSchema>;
export type CorrelationContext = z.infer<typeof correlationContextSchema>;
export type WorkEnvelope = z.infer<typeof workEnvelopeSchema>;
export type WorldDocumentInput = z.infer<typeof worldDocumentInputSchema>;
export type AuthoritativeStateResponse = z.infer<typeof authoritativeStateResponseSchema>;
export type ActionStatus = z.infer<typeof actionStatusSchema>;
export type SubmitActionRequest = z.infer<typeof submitActionRequestSchema>;
export type ActionResponse = z.infer<typeof actionResponseSchema>;
export type ActionOperationType = z.infer<typeof actionOperationTypeSchema>;
export type ParticipationContract = z.infer<typeof participationSchema>;
export type ChangeParticipationContractRequest = z.infer<
  typeof changeParticipationContractRequestSchema
>;
export type CharacterAssetDefinition = z.infer<typeof characterAssetDefinitionSchema>;
export type CreateCharacterAssetRequest = z.infer<typeof createCharacterAssetRequestSchema>;
export type CharacterAssetResponse = z.infer<typeof characterAssetResponseSchema>;
export type ConfirmActionRequest = z.infer<typeof confirmActionRequestSchema>;
export type ActionProgressFrame = z.infer<typeof actionProgressFrameSchema>;
export type ActionProgressResponse = z.infer<typeof actionProgressResponseSchema>;
export type BranchActionHistory = z.infer<typeof branchActionHistorySchema>;
export type ProjectionFreshness = z.infer<typeof projectionFreshnessSchema>;
export type CorrectionRequest = z.infer<typeof correctionRequestSchema>;
export type CorrectionDisplayEffect = z.infer<typeof correctionDisplayEffectSchema>;
export type OrientationChange = z.infer<typeof orientationChangeSchema>;
export type PendingActionSummary = z.infer<typeof pendingActionSummarySchema>;
export type OrientationResponse = z.infer<typeof orientationResponseSchema>;
export type TraceEvent = z.infer<typeof traceEventSchema>;
export type TraceCommit = z.infer<typeof traceCommitSchema>;
export type BranchTraceResponse = z.infer<typeof branchTraceResponseSchema>;
export type ExplanationResponse = z.infer<typeof explanationResponseSchema>;
export type RecoveryPoint = z.infer<typeof recoveryPointSchema>;
export type RecoveryBranch = z.infer<typeof recoveryBranchSchema>;
export type RestoreProposal = z.infer<typeof restoreProposalSchema>;
export type RestoreCommit = z.infer<typeof restoreCommitSchema>;
export type RecoveryResponse = z.infer<typeof recoveryResponseSchema>;
export type CreateRecoveryPointRequest = z.infer<typeof createRecoveryPointRequestSchema>;
export type ForkBranchRequest = z.infer<typeof forkBranchRequestSchema>;
export type SelectBranchRequest = z.infer<typeof selectBranchRequestSchema>;
export type CreateRestoreProposalRequest = z.infer<typeof createRestoreProposalRequestSchema>;
export type ConfirmRestoreRequest = z.infer<typeof confirmRestoreRequestSchema>;
