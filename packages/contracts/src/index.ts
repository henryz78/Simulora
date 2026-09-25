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
  productImplementationPhase: z.enum([
    "IP-1",
    "IP-2",
    "IP-3",
    "IP-4",
    "IP-5",
    "IP-6",
    "IP-7",
    "IP-8",
    "IP-9",
  ]),
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
      protection: z.enum(["PROTECTED", "ROUTINE"]).optional(),
      scale: z.array(z.string().trim().min(1).max(60)).min(2).max(7).optional(),
      initialState: z.string().trim().min(1).max(60).optional(),
    }),
  ),
  threads: z
    .array(z.object({ id: z.string().min(1), title: z.string().trim().min(1).max(200) }))
    .optional(),
  constraints: z
    .array(z.object({ id: z.string().min(1), statement: nonEmptyTextSchema }))
    .optional(),
  interactionPaths: z.array(nonEmptyTextSchema).min(1),
  interactionBoundaries: z.array(nonEmptyTextSchema).min(1),
  objectives: z.array(nonEmptyTextSchema).default([]),
});

export const createWorldRequestSchema = z.object({ document: worldDocumentInputSchema });
export const createWorldResponseSchema = z.object({
  worldId: stableIdSchema,
  rowVersion: z.number().int().positive(),
  documentHash: z.string().regex(/^[0-9a-f]{64}$/),
});
export const updateWorldDraftRequestSchema = z.object({
  expectedVersion: z.number().int().positive(),
  document: worldDocumentInputSchema,
});
export const createWorldRevisionRequestSchema = z.object({
  expectedDraftVersion: z.number().int().positive(),
});
export const worldDraftResponseSchema = z.object({
  worldId: stableIdSchema,
  rowVersion: z.number().int().positive(),
  document: worldDocumentInputSchema,
  documentHash: z.string().regex(/^[0-9a-f]{64}$/),
});
export const worldRevisionSummarySchema = z.object({
  revisionId: stableIdSchema,
  worldId: stableIdSchema,
  revisionNumber: z.number().int().positive(),
  sourceDraftRowVersion: z.number().int().positive(),
  documentHash: z.string().regex(/^[0-9a-f]{64}$/),
  createdAt: z.string().datetime(),
});
const worldValidationFindingSchema = z.object({
  path: z.string().max(240),
  message: z.string().min(1).max(500),
  severity: z.enum(["ERROR", "WARNING"]),
  playEffect: z.string().min(1).max(500),
});
export const worldValidationResponseSchema = z.object({
  worldId: stableIdSchema,
  draftRowVersion: z.number().int().positive(),
  outcome: z.enum(["VALID", "INVALID"]),
  findings: z.array(worldValidationFindingSchema),
  validatedAt: z.string().datetime(),
});
export const worldStudioResponseSchema = z.object({
  worldId: stableIdSchema,
  draft: worldDraftResponseSchema,
  revisions: z.array(worldRevisionSummarySchema),
  continuities: z.array(
    z.object({
      continuityId: stableIdSchema,
      worldRevisionId: stableIdSchema,
      revisionNumber: z.number().int().positive(),
      status: z.literal("PINNED"),
    }),
  ),
  validation: worldValidationResponseSchema.nullable(),
});
export type WorldDraftResponse = z.infer<typeof worldDraftResponseSchema>;
export type WorldRevisionSummary = z.infer<typeof worldRevisionSummarySchema>;
export type WorldValidationResponse = z.infer<typeof worldValidationResponseSchema>;
export type WorldStudioResponse = z.infer<typeof worldStudioResponseSchema>;
export const startContinuityRequestSchema = z.object({ participation: participationSchema });

const consentTypeSchema = z.enum(["TERMS", "PRIVACY", "CONTENT_BOUNDARIES"]);
const consentDecisionSchema = z.enum(["GRANTED", "WITHDRAWN"]);
const consentScopeSchema = z.enum(["ACCOUNT", "WORLD"]);

export const meResponseSchema = z.object({
  accountId: stableIdSchema,
  eligibility: z.enum(["adult", "ineligible", "unknown"]),
  policyVersion: z.string().min(1),
  capabilities: z.object({
    canCreateWorld: z.boolean(),
    canParticipate: z.boolean(),
    canAppeal: z.boolean(),
  }),
  reasonCode: z.enum(["ELIGIBLE_ADULT", "INELIGIBLE", "UNKNOWN"]).nullable(),
});

export const consentRecordSchema = z.object({
  consentType: consentTypeSchema,
  version: z.string().trim().min(1).max(80),
  scope: consentScopeSchema,
  decision: consentDecisionSchema,
  withdrawalAvailable: z.boolean(),
  updatedAt: z.string().datetime(),
});

export const consentRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(160)
      .regex(/^[A-Za-z0-9._:-]+$/),
    consentType: consentTypeSchema,
    version: z.string().trim().min(1).max(80),
    scope: consentScopeSchema,
    decision: consentDecisionSchema,
  })
  .strict();

export const consentListResponseSchema = z.object({
  policyVersion: z.string().min(1),
  consents: z.array(consentRecordSchema),
});

export const accessExplanationResponseSchema = z.object({
  resourceType: z.enum(["world", "continuity"]),
  resourceId: stableIdSchema,
  accessLevel: z.enum(["OWNER", "PARTICIPANT", "VIEWER", "NONE"]),
  visibility: z.enum([
    "OWNER_ONLY",
    "EXPLICIT_GRANT",
    "CONTINUITY_PRIVATE",
    "TOMBSTONED",
    "UNKNOWN",
  ]),
  canRead: z.boolean(),
  canModify: z.boolean(),
  canStart: z.boolean(),
  reasonCode: z.enum([
    "OWNER",
    "ACTIVE_GRANT",
    "NO_ACCESS",
    "TOMBSTONED",
    "ELIGIBILITY_REQUIRED",
    "NOT_FOUND",
  ]),
  explanation: z.string().min(1).max(500),
  recovery: z.object({ label: z.string().min(1), href: z.string().min(1) }).nullable(),
});

export const productChangeSchema = z.object({
  id: stableIdSchema,
  version: z.string().min(1),
  category: z.enum(["CAPABILITY", "POLICY", "MODEL"]),
  summary: z.string().min(1).max(500),
  effect: z.string().min(1).max(500),
  recovery: z.string().min(1).max(500),
  affectedScopes: z.array(z.string().min(1)).min(1),
  effectiveAt: z.string().datetime(),
  availableChoices: z.array(z.string().min(1)).min(1),
  publishedAt: z.string().datetime(),
});

export const productChangesResponseSchema = z.object({
  changes: z.array(productChangeSchema),
});

const appealReasonSchema = z.enum(["ELIGIBILITY", "CONSENT", "ACCESS", "DELETION", "OTHER"]);
const appealStatusSchema = z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]);

export const appealRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(160)
      .regex(/^[A-Za-z0-9._:-]+$/),
    reasonCode: appealReasonSchema,
    subjectType: z.enum(["ACCOUNT", "WORLD", "CONTINUITY", "CHARACTER_ASSET"]),
    subjectId: stableIdSchema.optional(),
    summary: nonEmptyTextSchema,
  })
  .strict();

export const appealResponseSchema = z.object({
  appealId: stableIdSchema,
  status: appealStatusSchema,
  recoveryState: z.enum(["REVIEW_PENDING", "REVIEWABLE", "CLOSED"]),
  reasonCode: appealReasonSchema,
  subjectType: z.enum(["ACCOUNT", "WORLD", "CONTINUITY", "CHARACTER_ASSET"]),
  subjectId: stableIdSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const usageQuoteRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(160)
      .regex(/^[A-Za-z0-9._:-]+$/),
    actionProfile: z.enum(["WORLD_TURN", "EXPORT"]),
  })
  .strict();

export const usageQuoteSchema = z.object({
  quoteId: stableIdSchema,
  actionProfile: z.enum(["WORLD_TURN", "EXPORT"]),
  policyVersion: z.string().min(1),
  costMode: z.literal("ZERO_COST_TEST"),
  units: z.literal(0),
  expiresAt: z.string().datetime(),
  failureBehavior: z.object({
    retry: z.string().min(1),
    cancel: z.string().min(1),
    terminalNoCommit: z.string().min(1),
  }),
  status: z.literal("ISSUED"),
});

export const usageReservationRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionKey: z
      .string()
      .trim()
      .min(8)
      .max(160)
      .regex(/^[A-Za-z0-9._:-]+$/),
  })
  .strict();

export const usageReservationSchema = z.object({
  reservationId: stableIdSchema,
  quoteId: stableIdSchema,
  actionKey: z.string().min(1),
  status: z.enum(["RESERVED", "SETTLED", "RELEASED"]),
  units: z.literal(0),
  createdAt: z.string().datetime(),
});

export const usageLedgerEntrySchema = z.object({
  entryId: stableIdSchema,
  reservationId: stableIdSchema,
  entryType: z.enum(["SETTLEMENT", "RELEASE"]),
  units: z.literal(0),
  createdAt: z.string().datetime(),
});

export const usageLedgerResponseSchema = z.object({
  entries: z.array(usageLedgerEntrySchema),
});

export const exportRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(160)
      .regex(/^[A-Za-z0-9._:-]+$/),
    reservationId: stableIdSchema,
    worldId: stableIdSchema,
    include: z.object({
      world: z.boolean(),
      characters: z.boolean(),
      continuity: z.boolean(),
      history: z.boolean(),
    }),
  })
  .strict();

export const exportResponseSchema = z.object({
  exportId: stableIdSchema,
  status: z.enum(["PENDING", "READY", "FAILED", "REVOKED"]),
  schemaVersion: z.literal(1),
  worldId: stableIdSchema,
  selectedScopes: z.array(z.string().min(1)),
  omittedScopes: z.array(z.string().min(1)),
  checksum: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .nullable(),
  artifactKey: z.string().min(1).nullable(),
  manifest: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  // IP-9: an export stays PENDING until the object store holds it. A recorded
  // storage failure is surfaced here so the delay is visible, not silent.
  delay: z
    .object({
      reasonCode: z.enum(["OBJECT_STORE_UNAVAILABLE", "OBJECT_INTEGRITY_FAILED"]),
      message: z.string().min(1),
    })
    .nullable()
    .optional(),
});

export const exportDownloadLinkSchema = z.object({
  url: z.string().min(1),
  expiresAt: z.string().datetime(),
  method: z.literal("API_SIGNED"),
});

export const deletionProposalRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(160)
      .regex(/^[A-Za-z0-9._:-]+$/),
    targetType: z.enum(["WORLD", "CHARACTER_ASSET"]),
    targetId: stableIdSchema,
  })
  .strict();

export const deletionProposalSchema = z.object({
  proposalId: stableIdSchema,
  targetType: z.enum(["WORLD", "CHARACTER_ASSET"]),
  targetId: stableIdSchema,
  digest: z.string().regex(/^[0-9a-f]{64}$/),
  status: z.enum(["ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"]),
  affected: z.object({
    continuities: z.number().int().nonnegative(),
    grants: z.number().int().nonnegative(),
    exports: z.number().int().nonnegative(),
    auditCategories: z.array(z.string().min(1)),
  }),
  expiresAt: z.string().datetime(),
  explanation: z.string().min(1).max(500),
});

export const deletionConfirmRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    proposalId: stableIdSchema,
    digest: z.string().regex(/^[0-9a-f]{64}$/),
    idempotencyKey: z
      .string()
      .trim()
      .min(8)
      .max(160)
      .regex(/^[A-Za-z0-9._:-]+$/),
  })
  .strict();

export const deletionStatusSchema = z.object({
  proposalId: stableIdSchema,
  targetType: z.enum(["WORLD", "CHARACTER_ASSET"]),
  targetId: stableIdSchema,
  status: z.enum(["ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"]),
  tombstonedAt: z.string().datetime().nullable(),
  purgeStatus: z.enum(["NOT_STARTED", "QUEUED", "RETAINING_MINIMAL_AUDIT"]),
  updatedAt: z.string().datetime(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
export type ConsentRecord = z.infer<typeof consentRecordSchema>;
export type ConsentRequest = z.infer<typeof consentRequestSchema>;
export type AccessExplanationResponse = z.infer<typeof accessExplanationResponseSchema>;
export type ProductChange = z.infer<typeof productChangeSchema>;
export type AppealRequest = z.infer<typeof appealRequestSchema>;
export type AppealResponse = z.infer<typeof appealResponseSchema>;
export type UsageQuoteRequest = z.infer<typeof usageQuoteRequestSchema>;
export type UsageQuote = z.infer<typeof usageQuoteSchema>;
export type UsageReservationRequest = z.infer<typeof usageReservationRequestSchema>;
export type UsageReservation = z.infer<typeof usageReservationSchema>;
export type UsageLedgerEntry = z.infer<typeof usageLedgerEntrySchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type ExportResponse = z.infer<typeof exportResponseSchema>;
export type DeletionProposalRequest = z.infer<typeof deletionProposalRequestSchema>;
export type DeletionProposal = z.infer<typeof deletionProposalSchema>;
export type DeletionConfirmRequest = z.infer<typeof deletionConfirmRequestSchema>;
export type DeletionStatus = z.infer<typeof deletionStatusSchema>;

/** MGC-1 authoritative story thread. `openThreads` is only a narrative trail. */
export const structuredThreadSchema = z
  .object({
    id: z.string().min(1).max(120),
    title: nonEmptyTextSchema,
    status: z.enum(["OPEN", "RESOLVED"]),
    resolution: nonEmptyTextSchema.optional(),
  })
  .strict();

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
    threads: z.array(structuredThreadSchema).optional(),
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
  "COMPLETED_NO_EFFECT",
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
  requestedEffect: z
    .enum([
      "FACT_REWRITE",
      "ROUTINE_EFFECT",
      "NO_WORLD_EFFECT",
      "RELATIONSHIP_EFFECT",
      "THREAD_EFFECT",
    ])
    .optional(),
  targetThreadId: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9][a-z0-9._-]*$/)
    .optional(),
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

export const actionDialogueSchema = z
  .object({
    id: stableIdSchema,
    narrative: nonEmptyTextSchema,
    responseSource: z.discriminatedUnion("type", [
      z.object({ type: z.literal("WORLD") }).strict(),
      z.object({ type: z.literal("CHARACTER"), characterId: z.string().min(1).max(120) }).strict(),
    ]),
    sourceHeadCommitId: stableIdSchema,
    sourceStateRevisionId: stableIdSchema,
    provenance: nonEmptyTextSchema,
    visibilityScope: z.literal("CONTINUITY_PRIVATE"),
    recordedAt: z.string().datetime(),
  })
  .strict();

export const actionResponseSchema = z
  .object({
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
    dialogue: actionDialogueSchema.nullable().optional(),
    // IP-9: which capability profile produced the draft. A fallback is disclosed.
    generation: z
      .object({
        profileId: z.string().min(1),
        profileVersion: z.string().min(1),
        fallbackFrom: z.string().min(1).nullable(),
      })
      .nullable()
      .optional(),
  })
  .superRefine((action, context) => {
    if (action.status === "COMPLETED_NO_EFFECT" && !action.dialogue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dialogue"],
        message: "Completed response-only Actions require dialogue evidence",
      });
    }
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
      z
        .object({
          id: z.string().min(1).max(120),
          description: nonEmptyTextSchema,
          state: z.string().min(1).max(60).optional(),
        })
        .strict(),
    ),
    openThreads: z.array(nonEmptyTextSchema),
    threads: z.array(structuredThreadSchema).optional(),
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
