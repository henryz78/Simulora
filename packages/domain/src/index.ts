import { createHash } from "node:crypto";
import { z } from "zod";

export const implementationPhase = "IP-3" as const;

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

export const factScopeSchema = z.enum(["ACCOUNT_PRIVATE", "CONTINUITY_PRIVATE", "SHARED"]);

export const worldFactSchema = z.object({
  id: stableIdSchema,
  statement: nonEmptyTextSchema,
  scope: factScopeSchema,
  provenance: nonEmptyTextSchema,
  lifecycle: z.literal("ACTIVE"),
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
    characters: z
      .array(
        z.object({
          id: stableIdSchema,
          name: z.string().trim().min(1).max(120),
          role: nonEmptyTextSchema,
          locationId: stableIdSchema,
        }),
      )
      .min(1),
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
  });

export const stateRevisionDocumentSchema = z.object({
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
    }),
  ),
  facts: z.array(worldFactSchema),
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
});

export type InitiativeMode = z.infer<typeof initiativeModeSchema>;
export type StructureMode = z.infer<typeof structureModeSchema>;
export type ParticipationContract = z.infer<typeof participationContractSchema>;
export type FactScope = z.infer<typeof factScopeSchema>;
export type WorldDocument = z.infer<typeof worldDocumentSchema>;
export type StateRevisionDocument = z.infer<typeof stateRevisionDocumentSchema>;

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
export type ConsequenceImpact = "L3";

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
  },
): ValidatedActionCandidate {
  const candidate = actionCandidateSchema.parse(candidateInput);
  if (candidate.actionId !== expected.actionId) {
    throw new Error("Candidate Action identity does not match the durable Action");
  }
  if (candidate.expectedHeadCommitId !== expected.expectedHeadCommitId) {
    throw new Error("Candidate expected head does not match the durable Action");
  }

  const target = expected.state.facts.find((fact) => fact.id === candidate.operation.targetFactId);
  if (!target) throw new Error("Candidate target fact is not present at the expected head");
  if (
    target.statement !== candidate.operation.beforeStatement ||
    target.scope !== candidate.operation.scope
  ) {
    throw new Error("Candidate before-state or scope does not match the expected head");
  }

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

export function applyValidatedActionCandidate(
  stateInput: StateRevisionDocument,
  validated: ValidatedActionCandidate,
): StateRevisionDocument {
  const state = stateRevisionDocumentSchema.parse(stateInput);
  const operation = validated.candidate.operation;
  const found = state.facts.some((fact) => fact.id === operation.targetFactId);
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
    })),
    facts: world.facts,
    relationships: world.relationships,
    openThreads: [world.startingSituation],
    objectives: participation.structureMode === "GOAL_FRAMED" ? world.objectives : [],
    resources: {},
    interactionBoundaries: world.interactionBoundaries,
    customState: {},
  });
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function contentHash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}
