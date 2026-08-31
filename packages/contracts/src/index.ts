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
  productImplementationPhase: z.enum(["IP-1", "IP-2"]),
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
  characters: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        role: nonEmptyTextSchema,
        locationId: z.string().min(1),
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

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type FoundationResponse = z.infer<typeof foundationResponseSchema>;
export type CorrelationContext = z.infer<typeof correlationContextSchema>;
export type WorkEnvelope = z.infer<typeof workEnvelopeSchema>;
export type WorldDocumentInput = z.infer<typeof worldDocumentInputSchema>;
export type AuthoritativeStateResponse = z.infer<typeof authoritativeStateResponseSchema>;
