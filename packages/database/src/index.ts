import { createHash, randomUUID } from "node:crypto";
import {
  applyParticipationContractChange,
  applyValidatedActionCandidate,
  assertGeneratedNarrativeDoesNotAuthorUser,
  applyRestorableState,
  applyValidatedDirectCorrectionCandidate,
  characterAssetDefinitionSchema,
  compileCharacterContext,
  compileEffectContext,
  contentHash,
  createInitialState,
  participationContractSchema,
  relationshipPoliciesFor,
  requestedEffectSchema,
  restoreSectionsFor,
  threadIdForAction,
  factIdForAction,
  revealableFacts,
  routinePolicySchema,
  stateRevisionDocumentSchema,
  validateDirectCorrectionCandidate,
  validateActionCandidate,
  worldDocumentSchema,
  type ActionStatus,
  type ValidatedActionCandidate,
  type ActionResponseSource,
  type CharacterAssetDefinition,
  type CharacterGenerationContext,
  type ParticipationContract,
  type StateRevisionDocument,
  type WorldDocument,
  type EffectContext,
  type RequestedEffect,
} from "@simulora/domain";
import { Kysely, PostgresDialect, type ColumnType, type Generated } from "kysely";
import { Pool, type PoolClient, type PoolConfig } from "pg";

// The database package intentionally has no dependency on the transport
// contracts package. These structural types are the repository's internal
// read/write boundary; the API owns Zod parsing before/after this layer.
type ActionOperationType =
  "PARTICIPATE" | "CORRECT_CONTINUITY" | "REMOVE_CONTINUITY" | "CHANGE_PARTICIPATION_CONTRACT";
type ChangeParticipationContractRequest = {
  schemaVersion: 1;
  idempotencyKey: string;
  expectedHeadCommitId: string;
  before: ParticipationContract;
  after: ParticipationContract;
};
type ActionDialogueRecord = {
  id: string;
  narrative: string;
  responseSource: ActionResponseSource;
  sourceHeadCommitId: string;
  sourceStateRevisionId: string;
  provenance: string;
  visibilityScope: "CONTINUITY_PRIVATE";
  recordedAt: string;
};

function parseActionDialogue(value: unknown): ActionDialogueRecord | null {
  return value && typeof value === "object" ? (value as ActionDialogueRecord) : null;
}
type CreateCharacterAssetRequest = { document: CharacterAssetDefinition };
type CorrectionRequest = {
  schemaVersion: 1;
  idempotencyKey: string;
  expectedHeadCommitId: string;
  target: { type: "fact"; id: string };
  operation: "CORRECT_CONTINUITY" | "REMOVE_CONTINUITY";
  before: { statement: string; scope: VisibilityScope };
  after?: { statement: string };
  reason: string;
};
type ProjectionFreshness = {
  sourceHeadCommitId: string;
  currentHeadCommitId: string;
  status: OrientationProjectionStatus;
  headDistance: number;
};
type OrientationChange = {
  commitId: string;
  eventType: string;
  summary: string;
  sourceClass: SourceClass;
  scope: VisibilityScope;
  occurredAt: string;
  targetId?: string;
};
type PendingActionSummary = {
  id: string;
  operationType: ActionOperationType;
  status: ActionStatus;
  expectedHeadCommitId: string;
  updatedAt: string;
};
type OrientationResponse = {
  continuity: { id: string; branchId: string; worldRevisionId: string };
  current: {
    situation: string;
    locationId: string | null;
    worldClock: StateRevisionDocument["worldClock"];
  };
  recentChanges: OrientationChange[];
  relationships: Array<{ id: string; description: string }>;
  openThreads: string[];
  nextParticipation: { expectedHeadCommitId: string; label: string };
  pendingActions: PendingActionSummary[];
  freshness: ProjectionFreshness;
  authoritativeFallback: { stateUrl: string; headCommitId: string; stateRevisionId: string };
  projectionUpdatedAt: string | null;
};
type TraceEvent = {
  id: string;
  type: string;
  summary: string;
  targetId?: string;
  scope: VisibilityScope;
};
type TraceCommit = {
  id: string;
  parentCommitId: string | null;
  kind: string;
  sourceClass: SourceClass;
  reason: string | null;
  createdAt: string;
  events: TraceEvent[];
};
type TraceCommitRow = {
  id: string;
  parent_commit_id: string | null;
  kind: string;
  source_type: string;
  reason: string | null;
  created_at: Date;
};
type TraceEventRow = {
  commit_id: string;
  event_id: string;
  event_type: string;
  event_payload: Record<string, unknown> | null;
  event_scope: string | null;
};
type TraceRow = TraceCommitRow & {
  event_id: string | null;
  event_type: string | null;
  event_payload: Record<string, unknown> | null;
  event_scope: string | null;
};
type BranchTraceResponse = {
  branchId: string;
  freshness: ProjectionFreshness;
  commits: TraceCommit[];
  nextCursor: string | null;
};
type ExplanationResponse = {
  target: {
    type: "fact" | "commit";
    id: string;
    statement?: string;
    lifecycle?: "ACTIVE" | "SUPERSEDED" | "REMOVED";
    current: boolean;
  };
  source: { class: SourceClass; commitId: string };
  scope: VisibilityScope;
  freshness: ProjectionFreshness;
  explanation: string;
  correction: {
    availableOperations: Array<"CORRECT_CONTINUITY" | "REMOVE_CONTINUITY">;
    href: string;
    requiresExactConfirmation: true;
  };
};

export type DatabaseHealth = { configured: boolean; reachable: boolean };

export type FoundationMetadataTable = {
  key: string;
  value: unknown;
  created_at: Generated<ColumnType<Date, Date | string | undefined, never>>;
};

export type FoundationDatabase = {
  "app_meta.foundation_metadata": FoundationMetadataTable;
};

/** Re-exported so callers outside this package never import `pg` themselves. */
export type { Pool as DatabasePool, PoolClient as DatabaseClient } from "pg";

export function createDatabasePool(
  connectionString: string | undefined,
  overrides: PoolConfig = {},
): Pool {
  if (!connectionString) {
    throw new Error("SIMULORA_DATABASE_URL is required for a database connection");
  }
  return new Pool({ connectionString, max: 10, ...overrides });
}

export async function checkDatabase(pool: Pool): Promise<DatabaseHealth> {
  try {
    await pool.query("select 1");
    return { configured: true, reachable: true };
  } catch {
    return { configured: true, reachable: false };
  }
}

export function createTypedDatabase(pool: Pool): Kysely<FoundationDatabase> {
  return new Kysely<FoundationDatabase>({ dialect: new PostgresDialect({ pool }) });
}

export type SyntheticAccount = {
  accountId: string;
  eligibility: "adult" | "ineligible" | "unknown";
};

export type WorldDraftRecord = {
  worldId: string;
  rowVersion: number;
  document: WorldDocument;
  documentHash: string;
};

export type WorldRevisionRecord = {
  revisionId: string;
  worldId: string;
  revisionNumber: number;
  sourceDraftRowVersion: number;
  document: WorldDocument;
  documentHash: string;
  createdAt: string;
};

export type WorldValidationFinding = {
  path: string;
  message: string;
  severity: "ERROR" | "WARNING";
  playEffect: string;
};

export type WorldValidationRecord = {
  worldId: string;
  draftRowVersion: number;
  outcome: "VALID" | "INVALID";
  findings: WorldValidationFinding[];
  validatedAt: string;
};

export type WorldStudioRecord = {
  worldId: string;
  draft: WorldDraftRecord;
  revisions: Array<WorldRevisionRecord & { createdAt: string }>;
  continuities: Array<{
    continuityId: string;
    worldRevisionId: string;
    revisionNumber: number;
    status: "PINNED";
  }>;
  validation: WorldValidationRecord | null;
};

export type CharacterAssetRecord = {
  id: string;
  document: CharacterAssetDefinition;
  documentHash: string;
  createdAt: string;
};

export type ContinuityStateRecord = {
  continuityId: string;
  branchId: string;
  headCommitId: string;
  stateRevisionId: string;
  worldRevisionId: string;
  worldRevisionNumber: number;
  world: WorldDocument;
  state: StateRevisionDocument;
  stateHash: string;
  /** SA-2: Characters the pinned Revision's routine policy lets move. */
  routineMoverIds?: string[];
};

export type SubmitActionDatabaseInput = {
  schemaVersion: 1;
  idempotencyKey: string;
  expectedHeadCommitId: string;
  participationExpectation: ParticipationContract;
  intent: string;
  requestedEffect?: RequestedEffect;
  correlationId?: string;
  targetCharacterId?: string;
  /** MGC-1: the open thread a THREAD_EFFECT Action works toward. */
  targetThreadId?: string;
};

export type ActionProposalRecord = {
  id: string;
  digest: string;
  expectedHeadCommitId: string;
  impact: "L0" | "L2" | "L3";
  expiresAt: string;
  narrative: string;
  responseSource: ActionResponseSource | null;
  displayEffect: {
    target: string;
    before: string;
    after: string;
    scope: "ACCOUNT_PRIVATE" | "CONTINUITY_PRIVATE" | "SHARED";
    operation?: "UPDATE_CANONICAL_FACT" | "CORRECT_CONTINUITY" | "REMOVE_CONTINUITY";
  };
};

export type ActionCommitRecord = {
  id: string;
  resultingHeadCommitId: string;
  stateRevisionId: string;
  committedAt: string;
};

export type ActionRecord = {
  id: string;
  continuityId: string;
  branchId: string;
  expectedHeadCommitId: string;
  operationType: ActionOperationType;
  status: ActionStatus;
  intent: string;
  targetCharacterId?: string;
  participationExpectation: ParticipationContract;
  acknowledgedAt: string;
  terminalAt: string | null;
  recoverableWait: boolean;
  statusReason: string | null;
  progressUrl: string;
  eventsUrl: string;
  proposal: ActionProposalRecord | null;
  commit: ActionCommitRecord | null;
  dialogue: ActionDialogueRecord | null;
  /** Which capability profile produced the current draft, when one did. */
  generation?: { profileId: string; profileVersion: string; fallbackFrom: string | null } | null;
  /** Internal lineage field; transport schemas intentionally omit it. */
  correlationId?: string | null;
};

export type ActionProgressRecord = {
  sequence: number;
  type:
    | "action.status"
    | "generation.draft"
    | "confirmation.required"
    | "action.committed"
    | "action.failed"
    | "heartbeat";
  payload: Record<string, unknown>;
  createdAt: string;
};

export type ActionProgressResult = {
  actionId: string;
  frames: ActionProgressRecord[];
  nextCursor: number;
  terminal: boolean;
};

export type BranchActionRecord = {
  id: string;
  status: ActionStatus;
  intent: string;
  acknowledgedAt: string;
  committedAt: string | null;
  narrative: string | null;
};

export type OrientationProjectionStatus = "FRESH" | "STALE" | "REBUILDING";

export type OrientationProjectionRecord = {
  branchId: string;
  sourceHeadCommitId: string;
  currentHeadCommitId: string;
  status: OrientationProjectionStatus;
  payload: OrientationResponse;
  projectionUpdatedAt: string | null;
};

export type RecoveryPointRecord = {
  id: string;
  continuityId: string;
  branchId: string;
  commitId: string;
  label: string;
  createdAt: string;
  deletedAt: string | null;
};

export type RecoveryBranchRecord = {
  id: string;
  continuityId: string;
  name: string;
  status: "ACTIVE";
  headCommitId: string;
  headStateRevisionId: string;
  parentBranchId: string | null;
  forkSourceCommitId: string | null;
  isCurrent: boolean;
  createdAt: string;
};

export type RestoreProposalRecord = {
  id: string;
  continuityId: string;
  branchId: string;
  sourceCommitId: string;
  expectedHeadCommitId: string;
  includedSections: string[];
  excludedSections: string[];
  changedSections: string[];
  sectionChanges: Array<{ section: string; before: unknown; after: unknown }>;
  beforeHash: string;
  sourceHash: string;
  digest: string;
  expiresAt: string;
  status: "ACTIVE" | "CONFIRMED" | "STALE" | "REJECTED" | "EXPIRED";
  resultCommitId: string | null;
};

export type RestoreCommitRecord = {
  commitId: string;
  stateRevisionId: string;
  resultingHeadCommitId: string;
  committedAt: string;
};

type GovernanceConsentRecord = {
  consentType: "TERMS" | "PRIVACY" | "CONTENT_BOUNDARIES";
  version: string;
  scope: "ACCOUNT" | "WORLD";
  decision: "GRANTED" | "WITHDRAWN";
  withdrawalAvailable: boolean;
  updatedAt: string;
};
type GovernanceConsentInput = {
  schemaVersion: 1;
  idempotencyKey: string;
  consentType: GovernanceConsentRecord["consentType"];
  version: string;
  scope: GovernanceConsentRecord["scope"];
  decision: GovernanceConsentRecord["decision"];
};

type GovernanceMeResponse = {
  accountId: string;
  eligibility: SyntheticAccount["eligibility"];
  policyVersion: string;
  capabilities: { canCreateWorld: boolean; canParticipate: boolean; canAppeal: boolean };
  reasonCode: "ELIGIBLE_ADULT" | "INELIGIBLE" | "UNKNOWN" | null;
};

type GovernanceAccessResponse = {
  resourceType: "world" | "continuity";
  resourceId: string;
  accessLevel: "OWNER" | "PARTICIPANT" | "VIEWER" | "NONE";
  visibility: "OWNER_ONLY" | "EXPLICIT_GRANT" | "CONTINUITY_PRIVATE" | "TOMBSTONED" | "UNKNOWN";
  canRead: boolean;
  canModify: boolean;
  canStart: boolean;
  reasonCode:
    "OWNER" | "ACTIVE_GRANT" | "NO_ACCESS" | "TOMBSTONED" | "ELIGIBILITY_REQUIRED" | "NOT_FOUND";
  explanation: string;
  recovery: { label: string; href: string } | null;
};

type GovernanceProductChange = {
  id: string;
  version: string;
  category: "CAPABILITY" | "POLICY" | "MODEL";
  summary: string;
  effect: string;
  recovery: string;
  affectedScopes: string[];
  effectiveAt: string;
  availableChoices: string[];
  publishedAt: string;
};

type GovernanceAppealRequest = {
  schemaVersion: 1;
  idempotencyKey: string;
  reasonCode: "ELIGIBILITY" | "CONSENT" | "ACCESS" | "DELETION" | "OTHER";
  subjectType: "ACCOUNT" | "WORLD" | "CONTINUITY" | "CHARACTER_ASSET";
  subjectId?: string;
  summary: string;
};

type GovernanceAppealResponse = {
  appealId: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  recoveryState: "REVIEW_PENDING" | "REVIEWABLE" | "CLOSED";
  reasonCode: GovernanceAppealRequest["reasonCode"];
  subjectType: GovernanceAppealRequest["subjectType"];
  subjectId: string | null;
  createdAt: string;
  updatedAt: string;
};

type GovernanceUsageQuoteRequest = {
  schemaVersion: 1;
  idempotencyKey: string;
  actionProfile: "WORLD_TURN" | "EXPORT";
};
type GovernanceUsageQuote = {
  quoteId: string;
  actionProfile: "WORLD_TURN" | "EXPORT";
  policyVersion: string;
  costMode: "ZERO_COST_TEST";
  units: 0;
  expiresAt: string;
  failureBehavior: { retry: string; cancel: string; terminalNoCommit: string };
  status: "ISSUED";
};
type GovernanceUsageReservationRequest = { schemaVersion: 1; actionKey: string };
type GovernanceUsageReservation = {
  reservationId: string;
  quoteId: string;
  actionKey: string;
  status: "RESERVED" | "SETTLED" | "RELEASED";
  units: 0;
  createdAt: string;
};
type GovernanceUsageLedgerEntry = {
  entryId: string;
  reservationId: string;
  entryType: "SETTLEMENT" | "RELEASE";
  units: 0;
  createdAt: string;
};

type GovernanceExportRequest = {
  schemaVersion: 1;
  idempotencyKey: string;
  reservationId: string;
  worldId: string;
  include: { world: boolean; characters: boolean; continuity: boolean; history: boolean };
};
type GovernanceExportResponse = {
  exportId: string;
  status: "PENDING" | "READY" | "FAILED" | "REVOKED";
  schemaVersion: 1;
  worldId: string;
  selectedScopes: string[];
  omittedScopes: string[];
  checksum: string | null;
  artifactKey: string | null;
  manifest: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
  delay: {
    reasonCode: "OBJECT_STORE_UNAVAILABLE" | "OBJECT_INTEGRITY_FAILED";
    message: string;
  } | null;
};

/** Where an export's bytes live. Only a READY export has one. */
export type ExportArtifactLocation = {
  exportId: string;
  accountId: string;
  objectKey: string;
  checksum: string;
  /** Present only for artifacts written before object storage existed. */
  inlineBytes: Uint8Array | null;
};

/**
 * How long one upload or delete may hold an export. It must exceed the object
 * store's worst-case call time (`s3WorstCaseCallMs`, checked by a test). An
 * ambiguous store failure renews the lease for another full window before a
 * deletion can claim the row, so a local timeout is never treated as proof
 * that a remote write cannot still land.
 */
// ponytail: lease-based exclusion, no object-store inventory; add an orphan sweep if a store without request timeouts is ever used
export const exportStorageLeaseMs = 30_000;

export type ExportStoredOutcome = "STORED" | "ALREADY_STORED" | "REVOKED";

export type ExportStorageWork =
  | {
      operation: "STORE";
      exportId: string;
      objectKey: string;
      checksum: string;
      bytes: Uint8Array;
    }
  | { operation: "DELETE"; exportId: string; objectKey: string };

type GovernanceDeletionProposalRequest = {
  schemaVersion: 1;
  idempotencyKey: string;
  targetType: "WORLD" | "CHARACTER_ASSET";
  targetId: string;
};
type GovernanceDeletionProposal = {
  proposalId: string;
  targetType: "WORLD" | "CHARACTER_ASSET";
  targetId: string;
  digest: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "CANCELLED";
  affected: { continuities: number; grants: number; exports: number; auditCategories: string[] };
  expiresAt: string;
  explanation: string;
};
type GovernanceDeletionConfirmRequest = {
  schemaVersion: 1;
  proposalId: string;
  digest: string;
  idempotencyKey: string;
};
type GovernanceDeletionStatus = {
  proposalId: string;
  targetType: "WORLD" | "CHARACTER_ASSET";
  targetId: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "CANCELLED";
  tombstonedAt: string | null;
  purgeStatus: "NOT_STARTED" | "QUEUED" | "RETAINING_MINIMAL_AUDIT";
  updatedAt: string;
};

export type ActionGenerationContext = {
  participation: ParticipationContract;
  character:
    | (Omit<CharacterGenerationContext, "knownFacts"> & {
        knownFacts: Array<
          Pick<StateRevisionDocument["facts"][number], "id" | "statement" | "scope">
        >;
      })
    | null;
  targetFact: {
    id: string;
    statement: string;
    scope: "ACCOUNT_PRIVATE" | "CONTINUITY_PRIVATE" | "SHARED";
  };
  /** Every fact id the generator may see, lead fact first, then state order. */
  contextFactIds: string[];
  /** Facts a rewrite may target: the lead fact, or every SHARED fact after 0055. */
  targetFactIds: string[];
  /** WD-1a: the Action was created after 0055 (all shared facts; ADD_FACT). */
  sharedWorld: boolean;
};

export type ActionGenerator = (request: {
  actionId: string;
  expectedHeadCommitId: string;
  intent: string;
  requestedEffect?: RequestedEffect;
  targetThreadId?: string;
  effectContext?: EffectContext;
  routineRoutes?: Array<{ fromLocationId: string; toLocationId: string; label: string }>;
  participation: ActionGenerationContext["participation"];
  character: ActionGenerationContext["character"];
  targetFact: ActionGenerationContext["targetFact"];
  sharedWorld?: boolean;
  context?: Readonly<Record<string, unknown>>;
  priorDialogue?: ReadonlyArray<ActionDialogueRecord>;
}) => Promise<{
  narrative: string;
  responseSource: ActionResponseSource;
  candidate: unknown;
  generatedBy?: { profileId: string; profileVersion: string; fallbackFrom?: string };
}>;

export type ModelProfileActivationInput = {
  profileId: string;
  profileVersion: string;
  adapter: "deterministic" | "openai-compatible";
  model: string | null;
  /** Origin of the provider endpoint; null for the deterministic adapter. */
  provider: string | null;
  promptVersion: number;
  profileDigest: string;
  /** `id@version` of the declared fallback, or null when there is none. */
  fallbackProfile: string | null;
  /** The gateway owns the materiality rule; the repository only records it. */
  isMaterialChange(
    previous: {
      id: string;
      adapter: "deterministic" | "openai-compatible";
      model: string | null;
      provider: string | null;
      promptVersion: number;
      fallbackProfile: string | null;
    } | null,
  ): boolean;
};

export type ModelProfileActivationRecord = {
  id: string;
  profileId: string;
  profileVersion: string;
  material: boolean;
  productChangeId: string | null;
  activatedAt: string;
  /** False when the profile was already the active one. */
  changed: boolean;
};

const modelProfileLock = 7_243_611_009;

function mapModelProfileActivation(row: {
  id: string;
  profile_id: string;
  profile_version: string;
  material: boolean;
  product_change_id: string | null;
  activated_at: Date;
}): ModelProfileActivationRecord {
  return {
    id: row.id,
    profileId: row.profile_id,
    profileVersion: row.profile_version,
    material: row.material,
    productChangeId: row.product_change_id,
    activatedAt: row.activated_at.toISOString(),
    changed: false,
  };
}

/** The capability profile a worker routes Actions to, recorded on each attempt. */
export type ActionProcessingOptions = {
  profile?: { id: string; version: string; adapter: "deterministic" | "openai-compatible" };
};

const deterministicRouting = {
  id: "deterministic",
  version: "1",
  adapter: "deterministic",
} as const;

export class AccessDeniedError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ValidationError extends Error {}

function assertIdempotencyRequestMatches(
  storedDigest: string | null,
  requestDigest: string,
  legacyFieldsMatch: boolean,
): void {
  if (storedDigest === requestDigest || (storedDigest === null && legacyFieldsMatch)) return;
  throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
}

function databaseEligibility(eligibility: SyntheticAccount["eligibility"]): string {
  return eligibility.toUpperCase();
}

type SourceClass = "USER" | "WORLD" | "CHARACTER" | "SYSTEM" | "CREATOR_RULE";
type VisibilityScope = "ACCOUNT_PRIVATE" | "CONTINUITY_PRIVATE" | "SHARED";

const sourceClasses = new Set<SourceClass>([
  "USER",
  "WORLD",
  "CHARACTER",
  "SYSTEM",
  "CREATOR_RULE",
]);
const visibilityScopes = new Set<VisibilityScope>([
  "ACCOUNT_PRIVATE",
  "CONTINUITY_PRIVATE",
  "SHARED",
]);

function safeSourceClass(value: unknown): SourceClass {
  return typeof value === "string" && sourceClasses.has(value as SourceClass)
    ? (value as SourceClass)
    : "SYSTEM";
}

function safeVisibilityScope(value: unknown): VisibilityScope {
  return typeof value === "string" && visibilityScopes.has(value as VisibilityScope)
    ? (value as VisibilityScope)
    : "SHARED";
}

function participationLabel(contract: ParticipationContract): string {
  return `${contract.initiativeMode.replaceAll("_", " ")} · ${contract.structureMode.replaceAll("_", " ")}`;
}

function safeCommitReason(value: unknown): string | null {
  // Trace is an explanation surface, not a transcript. Current Action
  // commits store an opaque UUID operation token; legacy/free-form narrative
  // values are deliberately omitted rather than treated as provenance.
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

/**
 * Ordinary world context starts from current shared facts only. IP-6 applies
 * each selected character's explicit knowledge allow-list separately before
 * that identity is included in generation context.
 */
function isGeneratorEligibleFact(fact: StateRevisionDocument["facts"][number]): boolean {
  return fact.lifecycle === "ACTIVE" && fact.scope === "SHARED";
}

/** MGC-1: the one typed Domain Event each closure operation commits with. */
function closureEventFor(
  actionId: string,
  operation: ValidatedActionCandidate["candidate"]["operation"],
): { type: string; payload: Record<string, unknown> } | null {
  if (operation.type === "SHIFT_RELATIONSHIP") {
    return {
      type: "RELATIONSHIP_SHIFTED",
      payload: {
        actionId,
        relationshipId: operation.relationshipId,
        before: operation.beforeState,
        after: operation.afterState,
        causalFactIds: operation.causalFactIds,
      },
    };
  }
  if (operation.type === "OPEN_THREAD") {
    return {
      type: "THREAD_OPENED",
      payload: {
        actionId,
        threadId: threadIdForAction(actionId),
        title: operation.title,
        causalFactIds: operation.causalFactIds,
      },
    };
  }
  if (operation.type === "RESOLVE_THREAD") {
    return {
      type: "THREAD_RESOLVED",
      payload: {
        actionId,
        threadId: operation.threadId,
        resolution: operation.resolution,
        causalFactIds: operation.causalFactIds,
      },
    };
  }
  if (operation.type === "REVEAL_FACT") {
    return {
      type: "FACT_REVEALED",
      payload: { actionId, factId: operation.factId, causalFactIds: operation.causalFactIds },
    };
  }
  if (operation.type === "ADD_FACT") {
    return {
      type: "FACT_ADDED",
      payload: {
        actionId,
        factId: factIdForAction(actionId),
        statement: operation.statement,
        causalFactIds: operation.causalFactIds,
      },
    };
  }
  if (operation.type === "TRANSFORM_FAILURE") {
    return {
      type: "ATTEMPT_TRANSFORMED",
      payload: {
        actionId,
        constraintId: operation.constraintId,
        outcome: operation.outcome,
        threadId: threadIdForAction(actionId),
        causalFactIds: operation.causalFactIds,
      },
    };
  }
  return null;
}

/** WD-1b: which declared discoverable facts this generation may reveal. */
function revealableFactIdsFor(
  world: WorldDocument,
  state: StateRevisionDocument,
  context: ActionGenerationContext,
  requestedEffect: RequestedEffect,
): string[] {
  if (requestedEffect !== "STORY_DECIDES") return [];
  return revealableFacts(
    world,
    state,
    context.character ? context.character.knownFacts.map((fact) => fact.id) : null,
  ).map((item) => item.factId);
}

export function compileActionGenerationContext(
  world: WorldDocument,
  state: StateRevisionDocument,
  targetCharacterId?: string,
  selectImplicitCharacter = false,
  sharedWorld = false,
): ActionGenerationContext | null {
  const targetFact = state.facts.find(isGeneratorEligibleFact);
  if (!targetFact) return null;
  const character = targetCharacterId
    ? compileCharacterContext(world, state, targetCharacterId)
    : selectImplicitCharacter
      ? world.characters
          .map((spec) => compileCharacterContext(world, state, spec.id))
          .find((context) => context.knownFacts.some((fact) => fact.id === targetFact.id))
      : null;
  if (targetCharacterId && !character?.knownFacts.some((fact) => fact.id === targetFact.id)) {
    throw new ValidationError(
      "Character has no authorized canonical target in the current effect envelope",
    );
  }
  // WD-1a (ADR-WD1-1): after 0055 every ACTIVE SHARED fact joins the context.
  const known = new Set(character?.knownFacts.map((fact) => fact.id) ?? []);
  const contextFactIds = [
    targetFact.id,
    ...state.facts
      .filter(
        (fact) =>
          fact.id !== targetFact.id &&
          fact.lifecycle === "ACTIVE" &&
          ((sharedWorld && fact.scope === "SHARED") ||
            (fact.scope !== "ACCOUNT_PRIVATE" && known.has(fact.id))),
      )
      .map((fact) => fact.id),
  ];
  return {
    contextFactIds,
    targetFactIds: sharedWorld
      ? state.facts.filter(isGeneratorEligibleFact).map((fact) => fact.id)
      : [targetFact.id],
    sharedWorld,
    participation: state.participation,
    character: character
      ? {
          ...character,
          knownFacts: character.knownFacts.map(({ id, statement, scope }) => ({
            id,
            statement,
            scope,
          })),
        }
      : null,
    targetFact: { id: targetFact.id, statement: targetFact.statement, scope: targetFact.scope },
  };
}

function orientationPayload(
  continuityId: string,
  branchId: string,
  worldRevisionId: string,
  state: StateRevisionDocument,
  headCommitId: string,
  stateRevisionId: string,
  updatedAt: string,
  commits: TraceCommit[] = [],
): OrientationResponse {
  const payload: OrientationResponse = {
    continuity: { id: continuityId, branchId, worldRevisionId },
    current: {
      // ponytail: one source-head shared fact, not a complete scene summary;
      // structured current threads can replace this lead when the runtime supports them.
      situation:
        state.facts.find((fact) => fact.lifecycle === "ACTIVE" && fact.scope === "SHARED")
          ?.statement ?? state.worldClock.label,
      locationId: state.locations[0]?.id ?? null,
      worldClock: state.worldClock,
    },
    // The initial projection has no meaningful change; later commits add
    // trace entries when the projection is rebuilt from authoritative rows.
    recentChanges: [],
    relationships: state.relationships.map(({ id, description, state: current }) => ({
      id,
      description,
      ...(current !== undefined ? { state: current } : {}),
    })),
    openThreads: state.openThreads,
    ...(state.threads ? { threads: state.threads } : {}),
    nextParticipation: {
      expectedHeadCommitId: headCommitId,
      label: "Continue from the current situation",
    },
    pendingActions: [],
    freshness: {
      sourceHeadCommitId: headCommitId,
      currentHeadCommitId: headCommitId,
      status: "FRESH",
      headDistance: 0,
    },
    authoritativeFallback: {
      stateUrl: `/v1/continuities/${continuityId}/state`,
      headCommitId,
      stateRevisionId,
    },
    projectionUpdatedAt: updatedAt,
  };
  payload.recentChanges = commits
    .filter((commit) => commit.kind !== "CONTINUITY_INITIALIZED")
    .flatMap((commit) =>
      commit.events.length
        ? commit.events.map((event) => ({
            commitId: commit.id,
            eventType: event.type,
            summary: event.summary,
            sourceClass: commit.sourceClass,
            scope: event.scope,
            occurredAt: commit.createdAt,
            ...(event.targetId ? { targetId: event.targetId } : {}),
          }))
        : [
            {
              commitId: commit.id,
              eventType: commit.kind,
              summary: eventSummary(commit.kind),
              sourceClass: commit.sourceClass,
              scope: "SHARED" as const,
              occurredAt: commit.createdAt,
            },
          ],
    )
    .slice(0, 3)
    .reverse();
  return payload;
}

type TraceCursor = { createdAt: string; id: string };

function parseValidationFindings(value: unknown): WorldValidationFinding[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const finding = item as Record<string, unknown>;
    if (
      typeof finding.path !== "string" ||
      typeof finding.message !== "string" ||
      (finding.severity !== "ERROR" && finding.severity !== "WARNING") ||
      typeof finding.playEffect !== "string"
    )
      return [];
    return [
      {
        path: finding.path,
        message: finding.message,
        severity: finding.severity,
        playEffect: finding.playEffect,
      },
    ];
  });
}

function assessWorldDocument(value: unknown): {
  document: WorldDocument | null;
  findings: WorldValidationFinding[];
} {
  const parsed = worldDocumentSchema.safeParse(value);
  if (!parsed.success) {
    return {
      document: null,
      findings: parsed.error.issues.map((issue) => ({
        path: issue.path.join(".") || "document",
        message: issue.message,
        severity: "ERROR" as const,
        playEffect: "This blocks creation of a playable World Revision.",
      })),
    };
  }
  return {
    document: parsed.data,
    findings: [
      ...(parsed.data.locations.length > 1 && !parsed.data.routineRoutes?.length
        ? [
            {
              path: "routineRoutes",
              message: "Add a route between locations if Characters should move between them.",
              severity: "WARNING" as const,
              playEffect: "Movement remains limited to the starting location until a route exists.",
            },
          ]
        : []),
      // SA-2: the same rule the Composer meets when a Character is addressed.
      ...parsed.data.characters.flatMap((character, index) => {
        try {
          compileActionGenerationContext(
            parsed.data,
            createInitialState(parsed.data, {
              initiativeMode: "GUIDED",
              structureMode: "OPEN_ENDED",
            }),
            character.id,
          );
          return [];
        } catch {
          const needed = parsed.data.facts.find((fact) => fact.scope === "SHARED");
          return [
            {
              path: `characters.${index}.knowledgeFactIds`,
              message: `${character.name} does not know anything a player can ask about yet${
                needed
                  ? `; give them knowledge of "${needed.statement.replace(/[.!?]+$/, "")}"`
                  : ""
              }.`,
              severity: "WARNING" as const,
              playEffect: `Players cannot address ${character.name} until they know that fact.`,
            },
          ];
        }
      }),
      ...(parsed.data.objectives.length === 0
        ? [
            {
              path: "objectives",
              message: "No objective is defined; this world stays open-ended.",
              severity: "WARNING" as const,
              playEffect: "Players can continue without a fabricated goal or completion state.",
            },
          ]
        : []),
    ],
  };
}

function encodeTraceCursor(cursor: TraceCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeTraceCursor(value: string | undefined): TraceCursor | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      createdAt?: unknown;
      id?: unknown;
    };
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string" || !parsed.id) {
      throw new Error("Malformed trace cursor");
    }
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    throw new ValidationError("Invalid Change Trace cursor");
  }
}

function eventSummary(eventType: string, payload?: Record<string, unknown>): string {
  switch (eventType) {
    case "BRANCH_FORKED":
      return "A separate path was created without changing its source path.";
    case "STATE_RESTORED":
      return "Selected world-state sections were restored as a new recorded change.";
    case "CONTINUITY_ITEM_CORRECTED":
      return "A canonical continuity fact was corrected by the participant.";
    case "CONTINUITY_ITEM_REMOVED":
      return "A canonical continuity fact was removed by the participant.";
    case "ACTION_RECORDED":
      return "A participant action was recorded on this path.";
    case "FACT_REVEALED":
      return "A hidden truth came to light.";
    case "FACT_ADDED":
      return typeof payload?.statement === "string"
        ? `New in the world: ${payload.statement}`
        : "A new fact was recorded on this path.";
    case "CHARACTER_MOVED":
      return `${typeof payload?.characterId === "string" ? payload.characterId : "Character"} moved from ${typeof payload?.beforeLocationId === "string" ? payload.beforeLocationId : "the earlier location"} to ${typeof payload?.afterLocationId === "string" ? payload.afterLocationId : "the new location"}; source: ${Array.isArray(payload?.causalFactIds) ? payload.causalFactIds.join(", ") : "recorded Action"}.`;
    case "PARTICIPATION_CONTRACT_CHANGED":
      return "The participant directly changed this path's initiative or structure contract.";
    // MGC-1 events: what changed, in the payload's own words, caused by the recorded Action.
    case "RELATIONSHIP_SHIFTED":
      return `A relationship changed from ${String(payload?.before)} to ${String(payload?.after)}, caused by the recorded Action.`;
    case "THREAD_OPENED":
      return `A story thread opened, caused by the recorded Action: ${String(payload?.title)}`;
    case "THREAD_RESOLVED":
      return `A story thread was resolved by the recorded Action: ${String(payload?.resolution)}`;
    case "ATTEMPT_TRANSFORMED":
      return `The recorded Action met a world constraint and a new thread opened. ${String(payload?.outcome)}`;
    case "CONTINUITY_INITIALIZED":
      return "This continuity began from its pinned World Revision.";
    default:
      return "A committed change was recorded on this path.";
  }
}

let transactionRetryLogger: ((detail: { code: unknown; message: string }) => void) | undefined;

/** Observe deadlock and serialization aborts, which are otherwise flattened to 409. */
export function onTransactionRetryConflict(
  observer: ((detail: { code: unknown; message: string }) => void) | undefined,
): void {
  transactionRetryLogger = observer;
}

// WD-1a: the shared-world context and ADD_FACT apply only once 0055 is installed
// and the Action was created after it; earlier schemas and Actions keep RE-2.
async function sharedWorldApplies(client: PoolClient, actionId: string): Promise<boolean> {
  const installed = await client.query<{ installed: boolean }>(
    "select to_regprocedure('simulora.wd1_shared_world_apply(timestamp with time zone)') is not null as installed",
  );
  if (!installed.rows[0]?.installed) return false;
  const result = await client.query<{ applies: boolean }>(
    "select simulora.wd1_shared_world_apply(created_at) as applies from simulora.actions where id = $1",
    [actionId],
  );
  return result.rows[0]?.applies ?? false;
}

// PX-2b: an unaddressed Action gets a WORLD response only once 0054 is installed
// and the Action was created after it; earlier schemas keep the RE-2 selection.
async function worldResponseWhenUnaddressed(
  client: PoolClient,
  actionId: string,
): Promise<boolean> {
  const installed = await client.query<{ installed: boolean }>(
    "select to_regprocedure('simulora.px2b_world_response_apply(timestamp with time zone)') is not null as installed",
  );
  if (!installed.rows[0]?.installed) return false;
  const result = await client.query<{ applies: boolean }>(
    "select simulora.px2b_world_response_apply(created_at) as applies from simulora.actions where id = $1",
    [actionId],
  );
  return result.rows[0]?.applies ?? false;
}

async function transaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    // PostgreSQL aborts one side of a deadlock, and a REPEATABLE READ snapshot can
    // fail to serialize. Neither is an internal fault, so report a stable conflict
    // the caller can retry rather than letting it surface as a 500.
    const code = (error as { code?: unknown }).code;
    if (code === "40001" || code === "40P01") {
      // Translating loses the SQLSTATE, and a rising rate of either code is a real
      // signal about a hot path, so record it before the client sees only a 409.
      transactionRetryLogger?.({ code, message: String((error as { message?: string }).message) });
      throw new ConflictError("CONCURRENT_UPDATE_RETRY");
    }
    throw error;
  } finally {
    client.release();
  }
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(entries: Array<{ name: string; body: Uint8Array }>): Uint8Array {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const body = Buffer.from(entry.body);
    const checksum = crc32(body);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(body.length, 18);
    header.writeUInt32LE(body.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, body);

    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(0x800, 8);
    directory.writeUInt32LE(checksum, 16);
    directory.writeUInt32LE(body.length, 20);
    directory.writeUInt32LE(body.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(offset, 42);
    central.push(directory, name);
    offset += header.length + name.length + body.length;
  }
  const centralBody = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBody.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, centralBody, end]);
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export class AuthoritativeWorldRepository {
  #consentTablePresent: Promise<boolean> | undefined;
  #generationProfileColumns: Promise<boolean> | undefined;

  // Probed on the caller's transaction client: acquiring a second pooled
  // connection while a transaction holds one can starve a small pool.
  private async hasGenerationProfileColumns(client: PoolClient): Promise<boolean> {
    this.#generationProfileColumns ??= client
      .query<{ present: boolean }>(
        `select exists(
           select 1 from information_schema.columns
           where table_schema = 'simulora' and table_name = 'generation_attempts'
             and column_name = 'profile_id'
         ) as present`,
      )
      .then((result) => result.rows[0]?.present === true)
      .catch((error: unknown) => {
        this.#generationProfileColumns = undefined;
        throw error;
      });
    return this.#generationProfileColumns;
  }

  constructor(
    private readonly pool: Pool,
    private readonly actionLease = { durationMs: 30_000, heartbeatMs: 10_000 },
    private readonly now: () => number = Date.now,
  ) {
    if (
      !Number.isSafeInteger(actionLease.durationMs) ||
      !Number.isSafeInteger(actionLease.heartbeatMs) ||
      actionLease.heartbeatMs <= 0 ||
      actionLease.durationMs < actionLease.heartbeatMs * 3
    ) {
      throw new Error(
        "Action lease requires a positive heartbeat no longer than one third of its duration",
      );
    }
  }

  async ensureAccount(account: SyntheticAccount): Promise<void> {
    await this.pool.query(
      `insert into simulora.accounts (id, eligibility)
       values ($1, $2)
       on conflict (id) do update set eligibility = excluded.eligibility`,
      [account.accountId, databaseEligibility(account.eligibility)],
    );
  }

  async createCharacterAsset(
    account: SyntheticAccount,
    request: CreateCharacterAssetRequest,
  ): Promise<CharacterAssetRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    const document = characterAssetDefinitionSchema.parse(request.document);
    const id = randomUUID();
    const documentHash = contentHash(document);
    const createdAt = await transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const result = await client.query<{ created_at: Date }>(
        `insert into simulora.character_assets
         (id, owner_account_id, document, document_hash)
         values ($1, $2, $3::jsonb, $4)
         returning created_at`,
        [id, account.accountId, JSON.stringify(document), documentHash],
      );
      return result.rows[0]!.created_at.toISOString();
    });
    return { id, document, documentHash, createdAt };
  }

  async createWorld(
    account: SyntheticAccount,
    documentInput: WorldDocument,
  ): Promise<WorldDraftRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    const document = worldDocumentSchema.parse(documentInput);
    const hash = contentHash(document);
    const worldId = randomUUID();

    await transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      await client.query(
        "insert into simulora.worlds (id, owner_account_id, title) values ($1, $2, $3)",
        [worldId, account.accountId, document.title],
      );
      await client.query(
        `insert into simulora.world_drafts
         (world_id, row_version, document, document_hash) values ($1, 1, $2::jsonb, $3)`,
        [worldId, JSON.stringify(document), hash],
      );
    });

    return { worldId, rowVersion: 1, document, documentHash: hash };
  }

  async updateDraft(
    account: SyntheticAccount,
    worldId: string,
    expectedVersion: number,
    documentInput: WorldDocument,
  ): Promise<WorldDraftRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    const document = worldDocumentSchema.parse(documentInput);
    const hash = contentHash(document);
    const result = await this.pool.query<{ row_version: number }>(
      `update simulora.world_drafts d
       set row_version = d.row_version + 1,
           document = $4::jsonb,
           document_hash = $5,
           updated_at = now()
       from simulora.worlds w
       where d.world_id = w.id
         and d.world_id = $1
         and w.owner_account_id = $2
         and d.row_version = $3
         and w.deleted_at is null
       returning d.row_version`,
      [worldId, account.accountId, expectedVersion, JSON.stringify(document), hash],
    );
    if (!result.rows[0]) await this.throwWorldAccessOrConflict(account.accountId, worldId);
    return { worldId, rowVersion: result.rows[0]!.row_version, document, documentHash: hash };
  }

  async readWorldStudio(account: SyntheticAccount, worldId: string): Promise<WorldStudioRecord> {
    this.assertEligible(account);
    const world = await this.pool.query<{ id: string }>(
      `select id from simulora.worlds
       where id = $1 and owner_account_id = $2 and deleted_at is null`,
      [worldId, account.accountId],
    );
    if (!world.rows[0]) throw new NotFoundError("World not found");

    const draftResult = await this.pool.query<{
      row_version: number;
      document: unknown;
      document_hash: string;
    }>(
      `select row_version, document, document_hash
       from simulora.world_drafts where world_id = $1`,
      [worldId],
    );
    const draft = draftResult.rows[0];
    if (!draft) throw new NotFoundError("World Draft not found");

    const revisions = await this.pool.query<{
      id: string;
      revision_number: number;
      source_draft_row_version: number;
      document: unknown;
      document_hash: string;
      created_at: Date;
    }>(
      `select id, revision_number, source_draft_row_version, document, document_hash, created_at
       from simulora.world_revisions
       where world_id = $1
       order by revision_number desc`,
      [worldId],
    );
    const continuities = await this.pool.query<{
      continuity_id: string;
      world_revision_id: string;
      revision_number: number;
    }>(
      `select c.id as continuity_id, c.world_revision_id, r.revision_number
       from simulora.continuities c
       join simulora.world_revisions r on r.id = c.world_revision_id
       where r.world_id = $1 and c.owner_account_id = $2
       order by r.revision_number desc, c.created_at desc`,
      [worldId, account.accountId],
    );
    const validation = await this.pool.query<{
      draft_row_version: number;
      outcome: "VALID" | "INVALID";
      findings: unknown;
      validated_at: Date;
    }>(
      `select draft_row_version, outcome, findings, validated_at
       from simulora.authoring_validation_runs
       where world_id = $1
       order by validated_at desc
       limit 1`,
      [worldId],
    );

    return {
      worldId,
      draft: {
        worldId,
        rowVersion: draft.row_version,
        document: worldDocumentSchema.parse(draft.document),
        documentHash: draft.document_hash,
      },
      revisions: revisions.rows.map((revision) => ({
        revisionId: revision.id,
        worldId,
        revisionNumber: revision.revision_number,
        sourceDraftRowVersion: revision.source_draft_row_version,
        document: worldDocumentSchema.parse(revision.document),
        documentHash: revision.document_hash,
        createdAt: revision.created_at.toISOString(),
      })),
      continuities: continuities.rows.map((continuity) => ({
        continuityId: continuity.continuity_id,
        worldRevisionId: continuity.world_revision_id,
        revisionNumber: continuity.revision_number,
        status: "PINNED" as const,
      })),
      validation: validation.rows[0]
        ? {
            worldId,
            draftRowVersion: validation.rows[0].draft_row_version,
            outcome: validation.rows[0].outcome,
            findings: parseValidationFindings(validation.rows[0].findings),
            validatedAt: validation.rows[0].validated_at.toISOString(),
          }
        : null,
    };
  }

  async validateDraft(account: SyntheticAccount, worldId: string): Promise<WorldValidationRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      const result = await client.query<{ row_version: number; document: unknown }>(
        `select d.row_version, d.document
         from simulora.world_drafts d
         join simulora.worlds w on w.id = d.world_id
         where d.world_id = $1 and w.owner_account_id = $2 and w.deleted_at is null
         for update`,
        [worldId, account.accountId],
      );
      const draft = result.rows[0];
      if (!draft) throw new NotFoundError("World not found");
      const assessed = assessWorldDocument(draft.document);
      const outcome = assessed.document ? "VALID" : "INVALID";
      const validationRunId = randomUUID();
      const inserted = await client.query<{ validated_at: Date }>(
        `insert into simulora.authoring_validation_runs
         (id, world_id, draft_row_version, outcome, findings)
         values ($1, $2, $3, $4, $5::jsonb)
         returning validated_at`,
        [validationRunId, worldId, draft.row_version, outcome, JSON.stringify(assessed.findings)],
      );
      return {
        worldId,
        draftRowVersion: draft.row_version,
        outcome,
        findings: assessed.findings,
        validatedAt: inserted.rows[0]!.validated_at.toISOString(),
      };
    });
  }

  async createRevision(
    account: SyntheticAccount,
    worldId: string,
    expectedDraftVersion: number,
  ): Promise<WorldRevisionRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      const draftResult = await client.query<{
        row_version: number;
        document: unknown;
      }>(
        `select d.row_version, d.document
         from simulora.world_drafts d
         join simulora.worlds w on w.id = d.world_id
         where d.world_id = $1 and w.owner_account_id = $2 and w.deleted_at is null
         for update`,
        [worldId, account.accountId],
      );
      const draft = draftResult.rows[0];
      if (!draft) throw new NotFoundError("World not found");
      if (draft.row_version !== expectedDraftVersion) {
        throw new ConflictError("World Draft version is stale");
      }

      const validationRunId = randomUUID();
      const assessed = assessWorldDocument(draft.document);
      await client.query(
        `insert into simulora.authoring_validation_runs
         (id, world_id, draft_row_version, outcome, findings)
         values ($1, $2, $3, $4, $5::jsonb)`,
        [
          validationRunId,
          worldId,
          draft.row_version,
          assessed.document ? "VALID" : "INVALID",
          JSON.stringify(assessed.findings),
        ],
      );
      if (!assessed.document) throw new ValidationError("World Draft is not playable");

      const sourceAssetIds = assessed.document.characters.flatMap((character) =>
        character.sourceAssetId ? [character.sourceAssetId] : [],
      );
      const assetResult = sourceAssetIds.length
        ? await client.query<{ id: string; document: unknown; document_hash: string }>(
            `select id, document, document_hash
             from simulora.character_assets
             where owner_account_id = $1 and status = 'ACTIVE' and id = any($2::uuid[])
             for share`,
            [account.accountId, sourceAssetIds],
          )
        : { rows: [] };
      const assets = new Map(assetResult.rows.map((asset) => [asset.id, asset]));
      for (const character of assessed.document.characters) {
        if (!character.sourceAssetId) continue;
        const asset = assets.get(character.sourceAssetId);
        if (!asset) throw new AccessDeniedError("Character Asset is unavailable");
        const snapshotDefinition = characterAssetDefinitionSchema.parse({
          schemaVersion: 1,
          name: character.name,
          role: character.role,
          motives: character.motives,
          stance: character.stance,
          knowledgeFactIds: character.knowledgeFactIds,
        });
        if (contentHash(snapshotDefinition) !== asset.document_hash) {
          throw new ConflictError("CHARACTER_ASSET_SNAPSHOT_CHANGED");
        }
      }

      const revisionNumberResult = await client.query<{ next_revision: number }>(
        `select coalesce(max(revision_number), 0) + 1 as next_revision
         from simulora.world_revisions where world_id = $1`,
        [worldId],
      );
      const revisionNumber = revisionNumberResult.rows[0]!.next_revision;
      const revisionId = randomUUID();
      const hash = contentHash(assessed.document);
      const inserted = await client.query<{ created_at: Date }>(
        `insert into simulora.world_revisions
         (id, world_id, revision_number, source_draft_row_version, document, document_hash, validation_run_id)
         values ($1, $2, $3, $4, $5::jsonb, $6, $7)
         returning created_at`,
        [
          revisionId,
          worldId,
          revisionNumber,
          draft.row_version,
          JSON.stringify(assessed.document),
          hash,
          validationRunId,
        ],
      );
      return {
        revisionId,
        worldId,
        revisionNumber,
        sourceDraftRowVersion: draft.row_version,
        document: assessed.document,
        documentHash: hash,
        createdAt: inserted.rows[0]!.created_at.toISOString(),
      };
    });
  }

  async startContinuity(
    account: SyntheticAccount,
    worldRevisionId: string,
    participationInput: ParticipationContract,
  ): Promise<ContinuityStateRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    const participation = participationContractSchema.parse(participationInput);
    const started = await transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const revisionResult = await client.query<{
        id: string;
        revision_number: number;
        document: unknown;
      }>(
        `select r.id, r.revision_number, r.document
         from simulora.world_revisions r
         join simulora.worlds w on w.id = r.world_id
         where r.id = $1 and w.deleted_at is null
           and (
             w.owner_account_id = $2
             or exists (
               select 1 from simulora.world_access_grants g
               where g.world_id = w.id and g.account_id = $2
                 and g.role = 'PARTICIPANT' and g.status = 'ACTIVE'
             )
           )`,
        [worldRevisionId, account.accountId],
      );
      const revision = revisionResult.rows[0];
      if (!revision) throw new NotFoundError("World Revision not found");
      const world = worldDocumentSchema.parse(revision.document);
      const state = createInitialState(world, participation);

      const continuityId = randomUUID();
      const branchId = randomUUID();
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      const eventId = randomUUID();
      const stateHash = contentHash(state);

      await client.query(
        `insert into simulora.continuities
         (id, owner_account_id, world_revision_id, status)
         values ($1, $2, $3, 'INITIALIZING')`,
        [continuityId, account.accountId, worldRevisionId],
      );
      await client.query(
        `insert into simulora.branches (id, continuity_id, name, status)
         values ($1, $2, 'Original path', 'INITIALIZING')`,
        [branchId, continuityId],
      );
      await client.query(
        `insert into simulora.world_commits
         (id, branch_id, kind, actor_account_id, state_revision_id)
         values ($1, $2, 'CONTINUITY_INITIALIZED', $3, $4)`,
        [commitId, branchId, account.accountId, stateRevisionId],
      );
      await client.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [stateRevisionId, branchId, commitId, JSON.stringify(state), stateHash],
      );
      await client.query(
        `insert into simulora.domain_events
         (id, branch_id, commit_id, event_type, payload)
         values ($1, $2, $3, 'CONTINUITY_INITIALIZED', $4::jsonb)`,
        [eventId, branchId, commitId, JSON.stringify({ worldRevisionId })],
      );
      await client.query(
        `update simulora.branches
         set head_commit_id = $2, head_state_revision_id = $3, status = 'ACTIVE'
         where id = $1`,
        [branchId, commitId, stateRevisionId],
      );
      await client.query(
        `update simulora.continuities
         set active_branch_id = $2, status = 'ACTIVE'
         where id = $1`,
        [continuityId, branchId],
      );

      const projectionUpdatedAt = new Date().toISOString();
      await client.query(
        `insert into simulora.return_orientation_projections
         (branch_id, source_head_commit_id, payload, status, rebuilt_at)
         values ($1, $2, $3::jsonb, 'FRESH', $4)`,
        [
          branchId,
          commitId,
          JSON.stringify(
            orientationPayload(
              continuityId,
              branchId,
              worldRevisionId,
              state,
              commitId,
              stateRevisionId,
              projectionUpdatedAt,
            ),
          ),
          projectionUpdatedAt,
        ],
      );

      return {
        continuityId,
        branchId,
        headCommitId: commitId,
        stateRevisionId,
        worldRevisionId,
        worldRevisionNumber: revision.revision_number,
        world,
        state,
        stateHash,
      };
    });
    return { ...started, routineMoverIds: await this.routineMoverIds(worldRevisionId) };
  }

  async readCurrentState(
    account: SyntheticAccount,
    continuityId: string,
  ): Promise<ContinuityStateRecord> {
    const result = await this.pool.query<{
      continuity_id: string;
      branch_id: string;
      head_commit_id: string;
      state_revision_id: string;
      world_revision_id: string;
      revision_number: number;
      world_document: unknown;
      state_document: unknown;
      state_hash: string;
    }>(
      `select c.id as continuity_id,
              b.id as branch_id,
              b.head_commit_id,
              s.id as state_revision_id,
              c.world_revision_id,
              r.revision_number,
              r.document as world_document,
              s.document as state_document,
              s.document_hash as state_hash
       from simulora.continuities c
       join simulora.branches b on b.id = c.active_branch_id
       join simulora.state_revisions s on s.id = b.head_state_revision_id
       join simulora.world_revisions r on r.id = c.world_revision_id
       where c.id = $1 and c.owner_account_id = $2 and c.status = 'ACTIVE'`,
      [continuityId, account.accountId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundError("Continuity not found");
    const state = stateRevisionDocumentSchema.parse(row.state_document);
    // The current read is owner-scoped in IP-4. Future shared projections must filter
    // ACCOUNT_PRIVATE and CONTINUITY_PRIVATE facts at the authorization boundary.
    const filteredState: StateRevisionDocument = state;
    return {
      continuityId: row.continuity_id,
      branchId: row.branch_id,
      headCommitId: row.head_commit_id,
      stateRevisionId: row.state_revision_id,
      worldRevisionId: row.world_revision_id,
      worldRevisionNumber: row.revision_number,
      world: worldDocumentSchema.parse(row.world_document),
      state: filteredState,
      stateHash: row.state_hash,
      routineMoverIds: await this.routineMoverIds(row.world_revision_id),
    };
  }

  /** The Characters a Revision's routine policy lets move on their own, or none. */
  private async routineMoverIds(worldRevisionId: string): Promise<string[]> {
    const policyAvailable = await this.pool.query<{ available: boolean }>(
      "select to_regclass('simulora.re3_routine_policies') is not null as available",
    );
    if (!policyAvailable.rows[0]?.available) return [];
    const policy = await this.pool.query<{ document: unknown }>(
      "select document from simulora.re3_routine_policies where world_revision_id = $1",
      [worldRevisionId],
    );
    return policy.rows[0] ? routinePolicySchema.parse(policy.rows[0].document).npcIds : [];
  }

  /** PX-1: the caller's playable Continuities and undeleted Worlds, most recent first. */
  async readLibrary(account: SyntheticAccount): Promise<{
    continuities: Array<{ continuityId: string; worldTitle: string; lastActivityAt: string }>;
    worlds: Array<{ worldId: string; title: string; updatedAt: string }>;
  }> {
    this.assertEligible(account);
    const continuities = await this.pool.query<{
      id: string;
      title: string;
      last_activity_at: Date;
    }>(
      `select c.id, r.document->>'title' as title,
              coalesce(head.created_at, c.created_at) as last_activity_at
       from simulora.continuities c
       join simulora.world_revisions r on r.id = c.world_revision_id
       join simulora.branches b on b.id = c.active_branch_id
       left join simulora.world_commits head on head.id = b.head_commit_id
       where c.owner_account_id = $1 and c.status = 'ACTIVE'
       order by last_activity_at desc, c.id
       limit 50`,
      [account.accountId],
    );
    const worlds = await this.pool.query<{ id: string; title: string; updated_at: Date }>(
      `select w.id, w.title, coalesce(d.updated_at, w.created_at) as updated_at
       from simulora.worlds w
       left join simulora.world_drafts d on d.world_id = w.id
       where w.owner_account_id = $1 and w.deleted_at is null
       order by updated_at desc, w.id
       limit 50`,
      [account.accountId],
    );
    return {
      continuities: continuities.rows.map((row) => ({
        continuityId: row.id,
        worldTitle: row.title,
        lastActivityAt: row.last_activity_at.toISOString(),
      })),
      worlds: worlds.rows.map((row) => ({
        worldId: row.id,
        title: row.title,
        updatedAt: row.updated_at.toISOString(),
      })),
    };
  }

  async submitAction(
    account: SyntheticAccount,
    branchId: string,
    input: SubmitActionDatabaseInput,
    correlationId?: string,
  ): Promise<ActionRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    const intent = input.intent.trim();
    const targetCharacterId = input.targetCharacterId;
    const requestedEffect = input.requestedEffect ?? "FACT_REWRITE";
    const targetThreadId = input.targetThreadId;
    if (
      (requestedEffect === "ROUTINE_EFFECT" || requestedEffect === "RELATIONSHIP_EFFECT") &&
      !targetCharacterId
    ) {
      throw new ValidationError("This effect requires a selected Character");
    }
    if (
      targetThreadId !== undefined &&
      (requestedEffect !== "THREAD_EFFECT" || !/^[a-z0-9][a-z0-9._-]{0,119}$/.test(targetThreadId))
    ) {
      throw new ValidationError("A thread target needs a thread effect and a valid identity");
    }
    if (
      targetCharacterId !== undefined &&
      !/^[a-z0-9][a-z0-9._-]{0,119}$/.test(targetCharacterId)
    ) {
      throw new ValidationError("Invalid Character target identity");
    }
    const durableCorrelationId = correlationId ?? input.correlationId ?? null;
    const requestDigest = contentHash({
      schemaVersion: input.schemaVersion,
      operationType: "PARTICIPATE",
      expectedHeadCommitId: input.expectedHeadCommitId,
      participationExpectation: input.participationExpectation,
      intent,
      ...(requestedEffect !== "FACT_REWRITE" ? { requestedEffect } : {}),
      ...(targetCharacterId ? { targetCharacterId } : {}),
      ...(targetThreadId ? { targetThreadId } : {}),
    });
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const existing = await client.query<{
        id: string;
        idempotency_request_digest: string | null;
        operation_type: ActionOperationType;
        expected_head_commit_id: string;
        participation_expectation: ParticipationContract;
        intent: string;
        operation_payload: {
          targetCharacterId?: string;
          requestedEffect?: string;
          targetThreadId?: string;
        };
      }>(
        `select id, idempotency_request_digest, operation_type,
                expected_head_commit_id, participation_expectation, intent, operation_payload
         from simulora.actions
         where actor_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
        [account.accountId, branchId, input.idempotencyKey],
      );
      if (existing.rows[0]) {
        const prior = existing.rows[0];
        assertIdempotencyRequestMatches(
          prior.idempotency_request_digest,
          requestDigest,
          prior.operation_type === "PARTICIPATE" &&
            prior.expected_head_commit_id === input.expectedHeadCommitId &&
            contentHash(prior.participation_expectation) ===
              contentHash(input.participationExpectation) &&
            prior.intent === intent &&
            prior.operation_payload.targetCharacterId === targetCharacterId &&
            prior.operation_payload.targetThreadId === targetThreadId &&
            (prior.operation_payload.requestedEffect ?? "FACT_REWRITE") === requestedEffect,
        );
        return this.readActionWithClient(client, account, prior.id);
      }

      const currentPath = await client.query<{ active_branch_id: string }>(
        `select active_branch_id from simulora.continuities
         where owner_account_id = $1 and active_branch_id = $2 and status = 'ACTIVE'
         for update`,
        [account.accountId, branchId],
      );
      if (!currentPath.rows[0]) throw new NotFoundError("Branch not found");

      const branch = await client.query<{
        continuity_id: string;
        head_commit_id: string;
        head_state_revision_id: string;
        state_document: unknown;
      }>(
        `select b.continuity_id, b.head_commit_id, b.head_state_revision_id, s.document as state_document
         from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id and c.active_branch_id = b.id
          and c.owner_account_id = $2 and c.status = 'ACTIVE'
         join simulora.state_revisions s on s.id = b.head_state_revision_id
         where b.id = $1 and b.status = 'ACTIVE'
         for share of b`,
        [branchId, account.accountId],
      );
      const row = branch.rows[0];
      if (!row) throw new NotFoundError("Branch not found");
      if (row.head_commit_id !== input.expectedHeadCommitId) {
        throw new ConflictError("BRANCH_HEAD_CONFLICT");
      }
      const state = stateRevisionDocumentSchema.parse(row.state_document);
      if (!state.facts.some((fact) => isGeneratorEligibleFact(fact))) {
        throw new ConflictError("NO_ACTIVE_CANONICAL_FACT");
      }
      if (
        targetThreadId &&
        !state.threads?.some((thread) => thread.id === targetThreadId && thread.status === "OPEN")
      ) {
        throw new ValidationError("The targeted thread is not open at this head");
      }
      if (targetCharacterId) {
        const worldResult = await client.query<{ document: unknown }>(
          `select revision.document from simulora.continuities continuity
           join simulora.world_revisions revision on revision.id = continuity.world_revision_id
           where continuity.id = $1`,
          [row.continuity_id],
        );
        try {
          compileActionGenerationContext(
            worldDocumentSchema.parse(worldResult.rows[0]!.document),
            state,
            targetCharacterId,
          );
        } catch {
          throw new ValidationError(
            "The selected Character is unavailable or cannot know this Action target",
          );
        }
      }
      if (
        state.participation.initiativeMode !== input.participationExpectation.initiativeMode ||
        state.participation.structureMode !== input.participationExpectation.structureMode
      ) {
        throw new ConflictError("PARTICIPATION_EXPECTATION_MISMATCH");
      }

      const pending = await client.query<{ id: string }>(
        `select id from simulora.actions
         where branch_id = $1 and expected_head_commit_id = $2
           and operation_type = 'PARTICIPATE'
           and status in ('ACKNOWLEDGED', 'GENERATING', 'VALIDATING',
                          'AWAITING_CONFIRMATION', 'COMMITTING', 'FAILED_RECOVERABLE')
         order by created_at limit 1`,
        [branchId, input.expectedHeadCommitId],
      );
      if (pending.rows[0]) throw new ConflictError("PENDING_ACTIONS_REQUIRE_RESOLUTION");

      const actionId = randomUUID();
      const inserted = await client.query<{ id: string }>(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent,
          idempotency_request_digest, correlation_id, operation_payload, status)
         values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, $8, $9, $10, $11::jsonb, 'ACKNOWLEDGED')
         on conflict do nothing
         returning id`,
        [
          actionId,
          account.accountId,
          row.continuity_id,
          branchId,
          input.idempotencyKey,
          input.expectedHeadCommitId,
          JSON.stringify(input.participationExpectation),
          intent,
          requestDigest,
          durableCorrelationId,
          JSON.stringify({
            ...(targetCharacterId ? { targetCharacterId } : {}),
            ...(requestedEffect !== "FACT_REWRITE" ? { requestedEffect } : {}),
            ...(targetThreadId ? { targetThreadId } : {}),
          }),
        ],
      );
      if (!inserted.rows[0]) {
        const duplicate = await client.query<{
          id: string;
          idempotency_request_digest: string | null;
          operation_type: ActionOperationType;
          expected_head_commit_id: string;
          participation_expectation: ParticipationContract;
          intent: string;
          operation_payload: {
            targetCharacterId?: string;
            requestedEffect?: string;
            targetThreadId?: string;
          };
        }>(
          `select id, idempotency_request_digest, operation_type,
                  expected_head_commit_id, participation_expectation, intent, operation_payload
           from simulora.actions
           where actor_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
          [account.accountId, branchId, input.idempotencyKey],
        );
        if (!duplicate.rows[0]) {
          const pendingAfterRace = await client.query<{ id: string }>(
            `select id from simulora.actions
             where branch_id = $1 and expected_head_commit_id = $2
               and operation_type = 'PARTICIPATE'
               and status in ('ACKNOWLEDGED', 'GENERATING', 'VALIDATING',
                              'AWAITING_CONFIRMATION', 'COMMITTING', 'FAILED_RECOVERABLE')
             order by created_at limit 1`,
            [branchId, input.expectedHeadCommitId],
          );
          if (pendingAfterRace.rows[0]) {
            throw new ConflictError("PENDING_ACTIONS_REQUIRE_RESOLUTION");
          }
          throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        }
        const prior = duplicate.rows[0];
        assertIdempotencyRequestMatches(
          prior.idempotency_request_digest,
          requestDigest,
          prior.operation_type === "PARTICIPATE" &&
            prior.expected_head_commit_id === input.expectedHeadCommitId &&
            contentHash(prior.participation_expectation) ===
              contentHash(input.participationExpectation) &&
            prior.intent === intent &&
            prior.operation_payload.targetCharacterId === targetCharacterId &&
            prior.operation_payload.targetThreadId === targetThreadId &&
            (prior.operation_payload.requestedEffect ?? "FACT_REWRITE") === requestedEffect,
        );
        return this.readActionWithClient(client, account, prior.id);
      }
      await client.query(
        `insert into simulora.durable_jobs
         (id, type, action_id, dedupe_key, correlation_id, status)
         values ($1, 'ACTION_PROCESS', $2, $3, $4, 'AVAILABLE')`,
        [randomUUID(), actionId, `action:${actionId}`, durableCorrelationId],
      );
      await this.appendProgressWithClient(client, actionId, "action.status", {
        status: "ACKNOWLEDGED",
        message: "Your Action was received and recorded. The world has not changed yet.",
      });
      return this.readActionWithClient(client, account, actionId);
    });
  }

  async changeParticipationContract(
    account: SyntheticAccount,
    branchId: string,
    input: ChangeParticipationContractRequest,
  ): Promise<ActionRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    const before = participationContractSchema.parse(input.before);
    const after = participationContractSchema.parse(input.after);
    if (
      before.initiativeMode === after.initiativeMode &&
      before.structureMode === after.structureMode
    ) {
      throw new ValidationError("Participation contract is unchanged");
    }
    const requestDigest = contentHash({
      schemaVersion: input.schemaVersion,
      operationType: "CHANGE_PARTICIPATION_CONTRACT",
      expectedHeadCommitId: input.expectedHeadCommitId,
      before,
      after,
    });

    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const findExisting = async (): Promise<ActionRecord | null> => {
        const existing = await client.query<{
          id: string;
          idempotency_request_digest: string | null;
          operation_type: ActionOperationType;
          expected_head_commit_id: string;
          operation_payload: { before?: ParticipationContract; after?: ParticipationContract };
        }>(
          `select id, idempotency_request_digest, operation_type,
                  expected_head_commit_id, operation_payload
           from simulora.actions
           where actor_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
          [account.accountId, branchId, input.idempotencyKey],
        );
        const prior = existing.rows[0];
        if (!prior) return null;
        assertIdempotencyRequestMatches(
          prior.idempotency_request_digest,
          requestDigest,
          prior.operation_type === "CHANGE_PARTICIPATION_CONTRACT" &&
            prior.expected_head_commit_id === input.expectedHeadCommitId &&
            contentHash(prior.operation_payload.before) === contentHash(before) &&
            contentHash(prior.operation_payload.after) === contentHash(after),
        );
        return this.readActionWithClient(client, account, prior.id);
      };
      const existing = await findExisting();
      if (existing) return existing;

      await client.query(
        `select id from simulora.continuities
          where owner_account_id = $1 and active_branch_id = $2 and status = 'ACTIVE'
          for update`,
        [account.accountId, branchId],
      );

      const branchResult = await client.query<{
        continuity_id: string;
        head_commit_id: string;
        head_state_revision_id: string;
        state_document: unknown;
      }>(
        `select b.continuity_id, b.head_commit_id, b.head_state_revision_id,
                s.document as state_document
         from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id
          and c.active_branch_id = b.id and c.owner_account_id = $2 and c.status = 'ACTIVE'
         join simulora.state_revisions s on s.id = b.head_state_revision_id
         where b.id = $1 and b.status = 'ACTIVE'
         for update of b`,
        [branchId, account.accountId],
      );
      const branch = branchResult.rows[0];
      if (!branch) throw new NotFoundError("Branch not found");
      const concurrentExisting = await findExisting();
      if (concurrentExisting) return concurrentExisting;
      if (branch.head_commit_id !== input.expectedHeadCommitId) {
        throw new ConflictError("BRANCH_HEAD_CONFLICT");
      }

      const currentState = stateRevisionDocumentSchema.parse(branch.state_document);
      if (
        currentState.participation.initiativeMode !== before.initiativeMode ||
        currentState.participation.structureMode !== before.structureMode
      ) {
        throw new ConflictError("PARTICIPATION_EXPECTATION_MISMATCH");
      }
      const nextState = applyParticipationContractChange(currentState, before, after);
      const actionId = randomUUID();
      const proposalId = randomUUID();
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60_000);
      const displayEffect = {
        target: "Participation contract",
        before: participationLabel(before),
        after: participationLabel(after),
        scope: "ACCOUNT_PRIVATE" as const,
      };
      const candidate = {
        schemaVersion: 1,
        actionId,
        expectedHeadCommitId: input.expectedHeadCommitId,
        narrative: `Participation changed from ${displayEffect.before} to ${displayEffect.after}.`,
        operation: { type: "CHANGE_PARTICIPATION_CONTRACT", before, after },
      };
      const digest = contentHash({
        actionId,
        actorAccountId: account.accountId,
        expectedHeadCommitId: input.expectedHeadCommitId,
        candidate,
        displayEffect,
        expiresAt: expiresAt.toISOString(),
      });

      await client.query(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent, operation_payload,
          idempotency_request_digest, status)
         values ($1, $2, $3, $4, 'CHANGE_PARTICIPATION_CONTRACT', $5, $6, $7::jsonb,
                 $8, $9::jsonb, $10, 'ACKNOWLEDGED')`,
        [
          actionId,
          account.accountId,
          branch.continuity_id,
          branchId,
          input.idempotencyKey,
          input.expectedHeadCommitId,
          JSON.stringify(before),
          `Change participation to ${displayEffect.after}`,
          JSON.stringify({ schemaVersion: 1, before, after }),
          requestDigest,
        ],
      );
      await this.appendProgressWithClient(client, actionId, "action.status", {
        status: "ACKNOWLEDGED",
        message: "The direct participation change was received. Current truth is unchanged.",
      });
      await client.query(
        `update simulora.actions
         set status = 'VALIDATING', updated_at = now(), row_version = row_version + 1
         where id = $1`,
        [actionId],
      );
      await client.query(
        `insert into simulora.action_proposals
         (id, action_id, generation_attempt_id, expected_head_commit_id, schema_version,
          candidate_transition, impact_level, proposal_digest, display_effect, status, expires_at)
         values ($1, $2, null, $3, 1, $4::jsonb, 'L3', $5, $6::jsonb, 'ACTIVE', $7)`,
        [
          proposalId,
          actionId,
          input.expectedHeadCommitId,
          JSON.stringify(candidate),
          digest,
          JSON.stringify(displayEffect),
          expiresAt,
        ],
      );
      await client.query(
        `insert into simulora.action_confirmations
         (id, action_id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
         values ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), actionId, proposalId, account.accountId, digest, input.expectedHeadCommitId],
      );
      await client.query(
        `update simulora.action_proposals set status = 'CONFIRMED' where id = $1`,
        [proposalId],
      );
      await client.query(
        `update simulora.actions
         set status = 'COMMITTING', updated_at = now(), row_version = row_version + 1
         where id = $1`,
        [actionId],
      );
      await client.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          action_id, source_type, reason)
         values ($1, $2, $3, 'ACTION_COMMITTED', $4, $5, $6, 'USER', $7)`,
        [
          commitId,
          branchId,
          input.expectedHeadCommitId,
          account.accountId,
          stateRevisionId,
          actionId,
          "Direct participation contract change",
        ],
      );
      await client.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [stateRevisionId, branchId, commitId, JSON.stringify(nextState), contentHash(nextState)],
      );
      await client.query(
        `insert into simulora.domain_events
         (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope, cause_action_id)
         values ($1, $2, $3, 'PARTICIPATION_CONTRACT_CHANGED', $4::jsonb,
                 'USER', 'ACCOUNT_PRIVATE', $5)`,
        [randomUUID(), branchId, commitId, JSON.stringify({ actionId, before, after }), actionId],
      );
      const advanced = await client.query(
        `update simulora.branches
         set head_commit_id = $2, head_state_revision_id = $3
         where id = $1 and head_commit_id = $4
         returning id`,
        [branchId, commitId, stateRevisionId, input.expectedHeadCommitId],
      );
      if (!advanced.rows[0]) throw new ConflictError("BRANCH_HEAD_CONFLICT");
      await client.query(
        `update simulora.return_orientation_projections
         set status = 'STALE', updated_at = now(), row_version = row_version + 1
         where branch_id = $1`,
        [branchId],
      );
      await client.query(
        `insert into simulora.transactional_outbox
         (id, topic, source_id, dedupe_key, payload)
         values ($1, 'projection.invalidated', $2, $3, $4::jsonb)`,
        [
          randomUUID(),
          commitId,
          `projection:${branchId}:${commitId}`,
          JSON.stringify({ branchId, sourceHeadCommitId: input.expectedHeadCommitId }),
        ],
      );
      await client.query(
        `update simulora.actions
         set status = 'COMMITTED', terminal_at = now(), updated_at = now(), row_version = row_version + 1
         where id = $1`,
        [actionId],
      );
      await this.appendProgressWithClient(client, actionId, "action.committed", {
        status: "COMMITTED",
        commitId,
        stateRevisionId,
        participation: after,
      });
      return this.readActionWithClient(client, account, actionId);
    });
  }

  /**
   * Create a direct canonical correction/removal Action. This path intentionally
   * bypasses durable generation jobs and model adapters: the user supplied
   * target/before/after effect is validated here, materialized as an exact
   * proposal and still requires the normal digest/head confirmation before a
   * Commit can be written.
   */
  async submitCorrection(
    account: SyntheticAccount,
    branchId: string,
    input: CorrectionRequest,
  ): Promise<ActionRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    if (input.target.type !== "fact") {
      throw new ValidationError("Only canonical fact correction is supported in IP-4");
    }
    if (input.operation === "CORRECT_CONTINUITY" && !input.after) {
      throw new ValidationError("Correction requires an after statement");
    }
    if (input.operation === "REMOVE_CONTINUITY" && input.after) {
      throw new ValidationError("Removal cannot include an after statement");
    }
    const reason = input.reason.trim();
    const operationPayload = {
      schemaVersion: 1,
      target: input.target,
      before: input.before,
      ...(input.after ? { after: input.after } : {}),
      reason,
    };
    const requestDigest = contentHash({
      schemaVersion: input.schemaVersion,
      operationType: input.operation,
      expectedHeadCommitId: input.expectedHeadCommitId,
      operationPayload,
    });
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const existing = await client.query<{
        id: string;
        idempotency_request_digest: string | null;
        operation_type: ActionOperationType;
        expected_head_commit_id: string;
        operation_payload: Record<string, unknown>;
      }>(
        `select id, idempotency_request_digest, operation_type,
                expected_head_commit_id, operation_payload
         from simulora.actions
         where actor_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
        [account.accountId, branchId, input.idempotencyKey],
      );
      if (existing.rows[0]) {
        const prior = existing.rows[0];
        assertIdempotencyRequestMatches(
          prior.idempotency_request_digest,
          requestDigest,
          prior.operation_type === input.operation &&
            prior.expected_head_commit_id === input.expectedHeadCommitId &&
            contentHash(prior.operation_payload) === contentHash(operationPayload),
        );
        return this.readActionWithClient(client, account, prior.id);
      }

      const currentPath = await client.query<{ active_branch_id: string }>(
        `select active_branch_id from simulora.continuities
         where owner_account_id = $1 and active_branch_id = $2 and status = 'ACTIVE'
         for update`,
        [account.accountId, branchId],
      );
      if (!currentPath.rows[0]) throw new NotFoundError("Branch not found");
      const branchResult = await client.query<{
        continuity_id: string;
        head_commit_id: string;
        head_state_revision_id: string;
        state_document: unknown;
      }>(
        `select b.continuity_id, b.head_commit_id, b.head_state_revision_id,
                s.document as state_document
         from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id
          and c.active_branch_id = b.id and c.owner_account_id = $2 and c.status = 'ACTIVE'
         join simulora.state_revisions s on s.id = b.head_state_revision_id
         where b.id = $1 and b.status = 'ACTIVE'
         for share of b`,
        [branchId, account.accountId],
      );
      const branch = branchResult.rows[0];
      if (!branch) throw new NotFoundError("Branch not found");
      if (branch.head_commit_id !== input.expectedHeadCommitId) {
        throw new ConflictError("BRANCH_HEAD_CONFLICT");
      }
      const state = stateRevisionDocumentSchema.parse(branch.state_document);
      const target = state.facts.find(
        (fact) => fact.id === input.target.id && fact.lifecycle === "ACTIVE",
      );
      if (!target) throw new NotFoundError("Canonical fact not found");
      if (target.statement !== input.before.statement || target.scope !== input.before.scope) {
        throw new ConflictError("CORRECTION_TARGET_CHANGED");
      }

      const actionId = randomUUID();
      const operationType = input.operation;
      const intent = reason;
      const inserted = await client.query<{ id: string }>(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent, operation_payload,
          idempotency_request_digest, status)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, $11, 'ACKNOWLEDGED')
         on conflict (actor_account_id, branch_id, idempotency_key) do nothing
         returning id`,
        [
          actionId,
          account.accountId,
          branch.continuity_id,
          branchId,
          operationType,
          input.idempotencyKey,
          input.expectedHeadCommitId,
          JSON.stringify(state.participation),
          intent,
          JSON.stringify(operationPayload),
          requestDigest,
        ],
      );
      if (!inserted.rows[0]) {
        const duplicate = await client.query<{
          id: string;
          idempotency_request_digest: string | null;
          operation_type: ActionOperationType;
          expected_head_commit_id: string;
          operation_payload: Record<string, unknown>;
        }>(
          `select id, idempotency_request_digest, operation_type,
                  expected_head_commit_id, operation_payload
           from simulora.actions
           where actor_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
          [account.accountId, branchId, input.idempotencyKey],
        );
        if (!duplicate.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        const prior = duplicate.rows[0];
        assertIdempotencyRequestMatches(
          prior.idempotency_request_digest,
          requestDigest,
          prior.operation_type === input.operation &&
            prior.expected_head_commit_id === input.expectedHeadCommitId &&
            contentHash(prior.operation_payload) === contentHash(operationPayload),
        );
        return this.readActionWithClient(client, account, prior.id);
      }

      await this.appendProgressWithClient(client, actionId, "action.status", {
        status: "ACKNOWLEDGED",
        message: "The direct correction was received. Current World truth is unchanged.",
      });
      await client.query(
        `update simulora.actions
         set status = 'VALIDATING', updated_at = now(), row_version = row_version + 1
         where id = $1`,
        [actionId],
      );

      const directCandidate = {
        schemaVersion: 1 as const,
        actionId,
        expectedHeadCommitId: input.expectedHeadCommitId,
        narrative:
          operationType === "REMOVE_CONTINUITY"
            ? `The canonical fact "${target.id}" is queued for removal.`
            : `The canonical fact "${target.id}" is queued for direct correction.`,
        operation: {
          type: operationType,
          targetFactId: target.id,
          beforeStatement: target.statement,
          beforeScope: target.scope,
          ...(input.after ? { afterStatement: input.after.statement } : {}),
          reason: input.reason.trim(),
        },
      };
      const validated = validateDirectCorrectionCandidate(directCandidate, {
        actionId,
        expectedHeadCommitId: input.expectedHeadCommitId,
        state,
        operationType,
      });
      const expiresAt = new Date(Date.now() + 15 * 60_000);
      const proposalDigest = contentHash({
        actionId,
        actorAccountId: account.accountId,
        expectedHeadCommitId: input.expectedHeadCommitId,
        candidate: validated.candidate,
        displayEffect: validated.displayEffect,
        expiresAt: expiresAt.toISOString(),
      });
      await client.query(
        `insert into simulora.action_proposals
         (id, action_id, generation_attempt_id, expected_head_commit_id, schema_version,
          candidate_transition, impact_level, proposal_digest, display_effect, status, expires_at)
         values ($1, $2, null, $3, 1, $4::jsonb, 'L3', $5, $6::jsonb, 'ACTIVE', $7)`,
        [
          randomUUID(),
          actionId,
          input.expectedHeadCommitId,
          JSON.stringify(validated.candidate),
          proposalDigest,
          JSON.stringify(validated.displayEffect),
          expiresAt,
        ],
      );
      await client.query(
        `update simulora.actions
         set status = 'AWAITING_CONFIRMATION', updated_at = now(), row_version = row_version + 1
         where id = $1`,
        [actionId],
      );
      await this.appendProgressWithClient(client, actionId, "action.status", {
        status: "AWAITING_CONFIRMATION",
        message: "Direct correction is ready for exact review. The world has not changed yet.",
      });
      const proposal = await client.query<{ id: string }>(
        "select id from simulora.action_proposals where action_id = $1",
        [actionId],
      );
      await this.appendProgressWithClient(client, actionId, "confirmation.required", {
        status: "AWAITING_CONFIRMATION",
        proposalId: proposal.rows[0]!.id,
        proposalDigest,
        expiresAt: expiresAt.toISOString(),
        effect: validated.displayEffect,
        direct: true,
      });
      return this.readActionWithClient(client, account, actionId);
    });
  }

  async readAction(account: SyntheticAccount, actionId: string): Promise<ActionRecord> {
    this.assertEligible(account);
    return this.readActionWithPool(account, actionId);
  }

  async confirmAction(
    account: SyntheticAccount,
    actionId: string,
    request: { proposalId: string; proposalDigest: string; expectedHeadCommitId: string },
  ): Promise<ActionRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      const actionResult = await client.query<{
        id: string;
        actor_account_id: string;
        branch_id: string;
        expected_head_commit_id: string;
        operation_type: ActionOperationType;
        operation_payload: Record<string, unknown>;
        status: ActionStatus;
        intent: string;
      }>(
        `select id, actor_account_id, branch_id, expected_head_commit_id, operation_type,
                 operation_payload, status, intent
         from simulora.actions where id = $1 and actor_account_id = $2 for update`,
        [actionId, account.accountId],
      );
      const action = actionResult.rows[0];
      if (!action) throw new NotFoundError("Action not found");
      if (action.status === "COMMITTED") {
        const confirmationResult = await client.query<{
          proposal_id: string;
          proposal_digest: string;
          expected_head_commit_id: string;
        }>(
          `select proposal_id, proposal_digest, expected_head_commit_id
           from simulora.action_confirmations where action_id = $1`,
          [actionId],
        );
        const confirmation = confirmationResult.rows[0];
        if (
          !confirmation ||
          confirmation.proposal_id !== request.proposalId ||
          confirmation.proposal_digest !== request.proposalDigest ||
          confirmation.expected_head_commit_id !== request.expectedHeadCommitId
        ) {
          throw new ConflictError("CONFIRMATION_EXPIRED_OR_PROPOSAL_CHANGED");
        }
        return this.readActionWithClient(client, account, actionId);
      }
      if (action.status === "COMPLETED_NO_EFFECT") {
        return this.readActionWithClient(client, account, actionId);
      }
      if (action.status === "CANCELLED") throw new ConflictError("ACTION_CANCELLED");
      if (action.status !== "AWAITING_CONFIRMATION") {
        throw new ConflictError("ACTION_NOT_AWAITING_CONFIRMATION");
      }
      if (action.expected_head_commit_id !== request.expectedHeadCommitId) {
        throw new ConflictError("BRANCH_HEAD_CONFLICT");
      }
      const proposalResult = await client.query<{
        id: string;
        candidate_transition: unknown;
        proposal_digest: string;
        expected_head_commit_id: string;
        expires_at: Date;
        display_effect: unknown;
        generation_attempt_id: string | null;
      }>(
        `select id, candidate_transition, proposal_digest, expected_head_commit_id,
                expires_at, display_effect, generation_attempt_id
         from simulora.action_proposals where id = $1 and action_id = $2 and status = 'ACTIVE' for update`,
        [request.proposalId, actionId],
      );
      const proposal = proposalResult.rows[0];
      if (!proposal) throw new NotFoundError("Action proposal not found");
      if (
        proposal.proposal_digest !== request.proposalDigest ||
        proposal.expected_head_commit_id !== request.expectedHeadCommitId ||
        proposal.expires_at.getTime() <= Date.now()
      ) {
        throw new ConflictError("CONFIRMATION_EXPIRED_OR_PROPOSAL_CHANGED");
      }

      await this.assertMutableBranchWithClient(client, account.accountId, action.branch_id);
      const branchResult = await client.query<{
        continuity_id: string;
        head_commit_id: string;
        head_state_revision_id: string;
      }>(
        `select b.continuity_id, b.head_commit_id, b.head_state_revision_id
         from simulora.branches b where b.id = $1 and b.status = 'ACTIVE' for update`,
        [action.branch_id],
      );
      const branch = branchResult.rows[0];
      if (!branch) throw new NotFoundError("Branch not found");
      if (branch.head_commit_id !== request.expectedHeadCommitId) {
        await this.markActionConflictWithClient(client, actionId, "BRANCH_HEAD_CONFLICT");
        return this.readActionWithClient(client, account, actionId);
      }

      const stateResult = await client.query<{ document: unknown }>(
        `select document from simulora.state_revisions where id = $1`,
        [branch.head_state_revision_id],
      );
      const expectedState = stateRevisionDocumentSchema.parse(stateResult.rows[0]!.document);
      const worldResult = await client.query<{ document: unknown }>(
        `select revision.document
         from simulora.continuities continuity
         join simulora.world_revisions revision on revision.id = continuity.world_revision_id
         where continuity.id = $1`,
        [branch.continuity_id],
      );
      const world = worldDocumentSchema.parse(worldResult.rows[0]!.document);
      let nextState: StateRevisionDocument;
      let displayEffect: ActionProposalRecord["displayEffect"];
      let candidateNarrative: string;
      let movement: Extract<
        ValidatedActionCandidate["candidate"]["operation"],
        { type: "MOVE_CHARACTER" }
      > | null = null;
      let responseSource: ActionResponseSource | null = null;
      let closureEvent: { type: string; payload: Record<string, unknown> } | null = null;
      if (action.operation_type === "CHANGE_PARTICIPATION_CONTRACT") {
        throw new ConflictError("DIRECT_PARTICIPATION_CHANGE_IS_ALREADY_AUTHORIZED");
      }
      if (action.operation_type === "PARTICIPATE") {
        const generationContext = compileActionGenerationContext(
          world,
          expectedState,
          typeof action.operation_payload.targetCharacterId === "string"
            ? action.operation_payload.targetCharacterId
            : undefined,
          !(await worldResponseWhenUnaddressed(client, actionId)),
          await sharedWorldApplies(client, actionId),
        );
        if (!generationContext) throw new ConflictError("NO_ACTIVE_CANONICAL_FACT");
        const expectedResponseSource: ActionResponseSource = generationContext.character
          ? { type: "CHARACTER", characterId: generationContext.character.id }
          : { type: "WORLD" };
        const policyAvailable = await client.query<{ available: boolean }>(
          "select to_regclass('simulora.re3_routine_policies') is not null as available",
        );
        const policyResult = policyAvailable.rows[0]?.available
          ? await client.query<{ document: unknown }>(
              `select policy.document from simulora.re3_routine_policies policy
           join simulora.continuities continuity on continuity.world_revision_id = policy.world_revision_id
           join simulora.branches branch on branch.continuity_id = continuity.id where branch.id = $1`,
              [action.branch_id],
            )
          : { rows: [] };
        const routinePolicy = policyResult.rows[0]
          ? routinePolicySchema.parse(policyResult.rows[0].document)
          : null;
        const validated = validateActionCandidate(proposal.candidate_transition, {
          actionId,
          expectedHeadCommitId: request.expectedHeadCommitId,
          state: expectedState,
          authorizedTargetFactIds: generationContext.targetFactIds,
          authorizedContextFactIds: generationContext.contextFactIds,
          allowAddFact: generationContext.sharedWorld,
          revealableFactIds: revealableFactIdsFor(
            world,
            expectedState,
            generationContext,
            requestedEffectSchema.parse(action.operation_payload.requestedEffect ?? "FACT_REWRITE"),
          ),
          responseSource: expectedResponseSource,
          userRoleName: world.userRole.name,
          requestedEffect: requestedEffectSchema.parse(
            action.operation_payload.requestedEffect ?? "FACT_REWRITE",
          ),
          authorizedRoutineNpcIds: routinePolicy?.npcIds ?? [],
          authorizedRoutineRoutes: (routinePolicy?.routes ?? []).map(
            (route) => `${route.fromLocationId}->${route.toLocationId}`,
          ),
          ...(typeof action.operation_payload.targetThreadId === "string"
            ? { targetThreadId: action.operation_payload.targetThreadId }
            : {}),
          relationshipPolicies: relationshipPoliciesFor(world),
          constraintIds: (world.constraints ?? []).map((constraint) => constraint.id),
        });
        nextState = applyValidatedActionCandidate(expectedState, validated);
        if (!validated.displayEffect)
          throw new Error("Committed Action is missing an effect display");
        displayEffect = validated.displayEffect;
        candidateNarrative = validated.candidate.narrative;
        if (validated.candidate.operation.type === "MOVE_CHARACTER")
          movement = validated.candidate.operation;
        closureEvent = closureEventFor(actionId, validated.candidate.operation);
        responseSource = validated.candidate.responseSource;
      } else {
        const validated = validateDirectCorrectionCandidate(proposal.candidate_transition, {
          actionId,
          expectedHeadCommitId: request.expectedHeadCommitId,
          state: expectedState,
          operationType: action.operation_type,
        });
        nextState = applyValidatedDirectCorrectionCandidate(expectedState, validated);
        displayEffect = validated.displayEffect;
        candidateNarrative = validated.candidate.narrative;
      }
      const commitId = randomUUID();
      const nextStateRevisionId = randomUUID();
      const eventId = randomUUID();
      const nextHash = contentHash(nextState);
      await client.query(
        `insert into simulora.action_confirmations
         (id, action_id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          randomUUID(),
          actionId,
          proposal.id,
          account.accountId,
          request.proposalDigest,
          request.expectedHeadCommitId,
        ],
      );
      await client.query(
        `update simulora.action_proposals set status = 'CONFIRMED' where id = $1`,
        [proposal.id],
      );
      await client.query(
        `update simulora.actions
         set status = 'COMMITTING', updated_at = now(), row_version = row_version + 1 where id = $1`,
        [actionId],
      );
      await this.appendProgressWithClient(client, actionId, "action.status", {
        status: "COMMITTING",
        message: "Exact effect confirmed. Recording the authoritative change.",
      });
      await client.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id, action_id, source_type, reason)
         values ($1, $2, $3, 'ACTION_COMMITTED', $4, $5, $6, 'USER', $7)`,
        [
          commitId,
          action.branch_id,
          request.expectedHeadCommitId,
          account.accountId,
          nextStateRevisionId,
          actionId,
          actionId,
        ],
      );
      await client.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [nextStateRevisionId, action.branch_id, commitId, JSON.stringify(nextState), nextHash],
      );
      await client.query(
        `insert into simulora.domain_events
          (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope, cause_action_id)
          values ($1, $2, $3, $4, $5::jsonb, 'USER', $6, $7)`,
        [
          eventId,
          action.branch_id,
          commitId,
          action.operation_type === "PARTICIPATE"
            ? closureEvent
              ? closureEvent.type
              : movement
                ? "CHARACTER_MOVED"
                : "ACTION_RECORDED"
            : action.operation_type === "CORRECT_CONTINUITY"
              ? "CONTINUITY_ITEM_CORRECTED"
              : "CONTINUITY_ITEM_REMOVED",
          JSON.stringify(
            action.operation_type === "PARTICIPATE"
              ? closureEvent
                ? closureEvent.payload
                : movement
                  ? {
                      actionId,
                      characterId: movement.characterId,
                      beforeLocationId: movement.beforeLocationId,
                      afterLocationId: movement.afterLocationId,
                      causalFactIds: movement.causalFactIds,
                    }
                  : { actionId, target: displayEffect.target }
              : {
                  actionId,
                  targetFactId: displayEffect.target,
                  operation: action.operation_type,
                  before: displayEffect.before,
                  after: displayEffect.after,
                  scope: displayEffect.scope,
                  reason: action.operation_payload.reason,
                },
          ),
          displayEffect.scope,
          actionId,
        ],
      );
      await client.query(
        `insert into simulora.conversation_entries
         (id, commit_id, branch_id, ordinal, role, content, speaker_character_id)
         values ($1, $2, $3, 1, 'USER', $4, null),
                ($5, $2, $3, 2, $6, $7, $8)`,
        [
          randomUUID(),
          commitId,
          action.branch_id,
          action.intent,
          randomUUID(),
          responseSource?.type === "CHARACTER" ? "CHARACTER" : "WORLD",
          candidateNarrative,
          responseSource?.type === "CHARACTER" ? responseSource.characterId : null,
        ],
      );
      const advanced = await client.query(
        `update simulora.branches
         set head_commit_id = $2, head_state_revision_id = $3
         where id = $1 and head_commit_id = $4
         returning id`,
        [action.branch_id, commitId, nextStateRevisionId, request.expectedHeadCommitId],
      );
      if (!advanced.rows[0]) throw new ConflictError("BRANCH_HEAD_CONFLICT");
      await client.query(
        `update simulora.return_orientation_projections
         set status = 'STALE', updated_at = now(), row_version = row_version + 1
         where branch_id = $1`,
        [action.branch_id],
      );
      await client.query(
        `insert into simulora.transactional_outbox
         (id, topic, source_id, dedupe_key, payload)
         values ($1, 'projection.invalidated', $2, $3, $4::jsonb)`,
        [
          randomUUID(),
          commitId,
          `projection:${action.branch_id}:${commitId}`,
          JSON.stringify({
            branchId: action.branch_id,
            sourceHeadCommitId: request.expectedHeadCommitId,
            currentHeadCommitId: commitId,
          }),
        ],
      );
      const now = new Date();
      await client.query(
        `update simulora.actions
         set status = 'COMMITTED', terminal_at = $2, updated_at = $2, row_version = row_version + 1
         where id = $1`,
        [actionId, now],
      );
      await this.appendProgressWithClient(client, actionId, "action.committed", {
        status: "COMMITTED",
        commitId,
        resultingHeadCommitId: commitId,
        stateRevisionId: nextStateRevisionId,
      });
      await client.query(
        `update simulora.durable_jobs set status = 'SUCCEEDED', updated_at = now() where action_id = $1`,
        [actionId],
      );
      return this.readActionWithClient(client, account, actionId);
    });
  }

  async cancelAction(account: SyntheticAccount, actionId: string): Promise<ActionRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      const result = await client.query<{ status: ActionStatus }>(
        `select status from simulora.actions where id = $1 and actor_account_id = $2 for update`,
        [actionId, account.accountId],
      );
      const action = result.rows[0];
      if (!action) throw new NotFoundError("Action not found");
      if (action.status === "COMMITTED")
        return this.readActionWithClient(client, account, actionId);
      if (
        [
          "ACKNOWLEDGED",
          "GENERATING",
          "VALIDATING",
          "AWAITING_CONFIRMATION",
          "COMMITTING",
          "FAILED_RECOVERABLE",
          "CONFLICT",
        ].includes(action.status)
      ) {
        const now = new Date();
        const status = action.status === "CONFLICT" ? "SUPERSEDED" : "CANCELLED";
        await client.query(
          `update simulora.actions set status = $3, terminal_at = $2, updated_at = $2,
           status_reason = $4, row_version = row_version + 1 where id = $1`,
          [
            actionId,
            now,
            status,
            status === "SUPERSEDED" ? "USER_SUPERSEDED_CONFLICT" : "USER_CANCELLED",
          ],
        );
        await client.query(
          `update simulora.action_proposals set status = 'REJECTED'
           where action_id = $1 and status = 'ACTIVE'`,
          [actionId],
        );
        await client.query(
          `update simulora.durable_jobs set status = 'SUCCEEDED', lease_owner = null,
           lease_until = null, updated_at = now() where action_id = $1`,
          [actionId],
        );
        await client.query(
          `update simulora.generation_attempts set status = 'FAILED', error_class = 'CANCELLED',
           completed_at = now() where action_id = $1 and status = 'RUNNING'`,
          [actionId],
        );
        await this.appendProgressWithClient(client, actionId, "action.status", {
          status,
          message:
            status === "SUPERSEDED"
              ? "The stale Action was closed without changing current World truth."
              : "The Action was cancelled. Current World truth is unchanged.",
        });
      }
      return this.readActionWithClient(client, account, actionId);
    });
  }

  async retryAction(account: SyntheticAccount, actionId: string): Promise<ActionRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      const result = await client.query<{ status: ActionStatus; branch_id: string }>(
        `select status, branch_id from simulora.actions
         where id = $1 and actor_account_id = $2 for update`,
        [actionId, account.accountId],
      );
      const action = result.rows[0];
      if (!action) throw new NotFoundError("Action not found");
      if (action.status !== "FAILED_RECOVERABLE")
        return this.readActionWithClient(client, account, actionId);
      await this.assertMutableBranchWithClient(client, account.accountId, action.branch_id);
      await client.query(
        `update simulora.actions set status = 'GENERATING', status_reason = null,
         terminal_at = null, updated_at = now(), row_version = row_version + 1 where id = $1`,
        [actionId],
      );
      await client.query(
        `update simulora.durable_jobs set status = 'AVAILABLE', available_at = now(), lease_owner = null,
         lease_until = null, updated_at = now() where action_id = $1`,
        [actionId],
      );
      await this.appendProgressWithClient(client, actionId, "action.status", {
        status: "GENERATING",
      });
      return this.readActionWithClient(client, account, actionId);
    });
  }

  async readProgress(
    account: SyntheticAccount,
    actionId: string,
    afterSequence = 0,
  ): Promise<ActionProgressResult> {
    this.assertEligible(account);
    await this.readAction(account, actionId);
    const result = await this.pool.query<{
      sequence: number;
      event_type: ActionProgressRecord["type"];
      payload: Record<string, unknown>;
      created_at: Date;
    }>(
      `select e.sequence, e.event_type, e.payload, e.created_at
       from simulora.action_progress_events e
       join simulora.actions a on a.id = e.action_id and a.actor_account_id = $1
       where e.action_id = $2 and e.sequence > $3 order by e.sequence`,
      [account.accountId, actionId, afterSequence],
    );
    const frames = result.rows.map((row) => ({
      sequence: row.sequence,
      type: row.event_type,
      payload: row.payload,
      createdAt: row.created_at.toISOString(),
    }));
    const action = await this.readAction(account, actionId);
    return {
      actionId,
      frames,
      nextCursor: frames.at(-1)?.sequence ?? afterSequence,
      terminal: ["COMMITTED", "COMPLETED_NO_EFFECT", "CANCELLED", "SUPERSEDED"].includes(
        action.status,
      ),
    };
  }

  async listBranchActions(
    account: SyntheticAccount,
    branchId: string,
  ): Promise<{ branchId: string; actions: BranchActionRecord[] }> {
    this.assertEligible(account);
    const result = await this.pool.query<{
      id: string;
      status: ActionStatus;
      intent: string;
      acknowledged_at: Date;
      committed_at: Date | null;
      narrative: string | null;
    }>(
      `select a.id, a.status, a.intent, a.acknowledged_at, c.created_at as committed_at,
              coalesce(
                (select p.candidate_transition->>'narrative' from simulora.action_proposals p where p.action_id = a.id),
                a.dialogue_record->>'narrative'
              ) as narrative
       from simulora.actions a
       left join simulora.world_commits c on c.action_id = a.id
       join simulora.branches b on b.id = a.branch_id and b.id = $2
       join simulora.continuities co on co.id = b.continuity_id and co.owner_account_id = $1
       order by a.created_at`,
      [account.accountId, branchId],
    );
    return {
      branchId,
      actions: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        intent: row.intent,
        acknowledgedAt: row.acknowledged_at.toISOString(),
        committedAt: row.committed_at?.toISOString() ?? null,
        narrative: row.narrative,
      })),
    };
  }

  /** Read the active Branch through the same authoritative state contract. */
  async readBranchState(
    account: SyntheticAccount,
    branchId: string,
  ): Promise<ContinuityStateRecord> {
    this.assertEligible(account);
    const result = await this.pool.query<{ continuity_id: string }>(
      `select b.continuity_id
       from simulora.branches b
       join simulora.continuities c on c.id = b.continuity_id
        and c.active_branch_id = b.id and c.owner_account_id = $2 and c.status = 'ACTIVE'
       where b.id = $1 and b.status = 'ACTIVE'`,
      [branchId, account.accountId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundError("Branch not found");
    return this.readCurrentState(account, row.continuity_id);
  }

  async readRecovery(
    account: SyntheticAccount,
    continuityId: string,
  ): Promise<{
    continuityId: string;
    currentBranchId: string;
    branches: RecoveryBranchRecord[];
    recoveryPoints: RecoveryPointRecord[];
    restoreProposals: RestoreProposalRecord[];
  }> {
    this.assertEligible(account);
    const continuity = await this.pool.query<{ active_branch_id: string }>(
      `select active_branch_id from simulora.continuities
       where id = $1 and owner_account_id = $2 and status = 'ACTIVE'`,
      [continuityId, account.accountId],
    );
    const activeBranchId = continuity.rows[0]?.active_branch_id;
    if (!activeBranchId) throw new NotFoundError("Continuity not found");
    const branches = await this.pool.query<{
      id: string;
      continuity_id: string;
      name: string;
      status: "ACTIVE";
      head_commit_id: string;
      head_state_revision_id: string;
      parent_branch_id: string | null;
      fork_source_commit_id: string | null;
      created_at: Date;
    }>(
      `select id, continuity_id, name, status, head_commit_id, head_state_revision_id,
              parent_branch_id, fork_source_commit_id, created_at
       from simulora.branches where continuity_id = $1 and status = 'ACTIVE'
       order by created_at`,
      [continuityId],
    );
    const points = await this.pool.query<{
      id: string;
      continuity_id: string;
      branch_id: string;
      commit_id: string;
      label: string;
      created_at: Date;
      deleted_at: Date | null;
    }>(
      `select id, continuity_id, branch_id, commit_id, label, created_at, deleted_at
       from simulora.recovery_points
       where continuity_id = $1 and deleted_at is null order by created_at desc`,
      [continuityId],
    );
    const proposals = await this.pool.query<{ id: string }>(
      `select proposal.id from simulora.restore_proposals proposal
       join simulora.branches branch on branch.id = proposal.branch_id
       left join simulora.world_commits restore_commit
        on restore_commit.restore_proposal_id = proposal.id
       where proposal.continuity_id = $1 and proposal.branch_id = $2
         and proposal.actor_account_id = $3
         and (
           (proposal.status = 'ACTIVE' and proposal.expires_at > now()
             and branch.head_commit_id = proposal.expected_head_commit_id)
           or (proposal.status = 'CONFIRMED' and restore_commit.id is not null)
         )
       order by proposal.created_at desc limit 1`,
      [continuityId, activeBranchId, account.accountId],
    );
    const restoreProposals = proposals.rows[0]
      ? [await this.readRestoreProposalWithPool(account.accountId, proposals.rows[0].id)]
      : [];
    return {
      continuityId,
      currentBranchId: activeBranchId,
      branches: branches.rows.map((row) => ({
        id: row.id,
        continuityId: row.continuity_id,
        name: row.name,
        status: row.status,
        headCommitId: row.head_commit_id,
        headStateRevisionId: row.head_state_revision_id,
        parentBranchId: row.parent_branch_id,
        forkSourceCommitId: row.fork_source_commit_id,
        isCurrent: row.id === activeBranchId,
        createdAt: row.created_at.toISOString(),
      })),
      recoveryPoints: points.rows.map((row) => ({
        id: row.id,
        continuityId: row.continuity_id,
        branchId: row.branch_id,
        commitId: row.commit_id,
        label: row.label,
        createdAt: row.created_at.toISOString(),
        deletedAt: row.deleted_at?.toISOString() ?? null,
      })),
      restoreProposals,
    };
  }

  async createRecoveryPoint(
    account: SyntheticAccount,
    branchId: string,
    input: { idempotencyKey: string; label: string; commitId?: string },
  ): Promise<RecoveryPointRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const readRetry = async (id: string): Promise<RecoveryPointRecord> => {
        const point = await this.readRecoveryPointWithClient(client, account.accountId, id);
        if (
          point.label !== input.label.trim() ||
          (input.commitId !== undefined && point.commitId !== input.commitId)
        ) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return point;
      };
      const existing = await client.query<{ id: string }>(
        `select id from simulora.recovery_points
         where created_by_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
        [account.accountId, branchId, input.idempotencyKey],
      );
      if (existing.rows[0]) {
        return readRetry(existing.rows[0].id);
      }
      await this.assertMutableBranchWithClient(client, account.accountId, branchId);
      const branch = await client.query<{ continuity_id: string; head_commit_id: string }>(
        `select b.continuity_id, b.head_commit_id from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id
          and c.owner_account_id = $2 and c.status = 'ACTIVE'
         where b.id = $1 and b.status = 'ACTIVE' for share of b`,
        [branchId, account.accountId],
      );
      const row = branch.rows[0];
      if (!row) throw new NotFoundError("Branch not found");
      const commitId = input.commitId ?? row.head_commit_id;
      const commit = await client.query<{ id: string }>(
        "select id from simulora.world_commits where id = $1 and branch_id = $2",
        [commitId, branchId],
      );
      if (!commit.rows[0]) throw new NotFoundError("Recovery source Commit not found");
      const id = randomUUID();
      const inserted = await client.query<{ id: string }>(
        `insert into simulora.recovery_points
         (id, continuity_id, branch_id, commit_id, label, idempotency_key, created_by_account_id)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (created_by_account_id, branch_id, idempotency_key) do nothing
         returning id`,
        [
          id,
          row.continuity_id,
          branchId,
          commitId,
          input.label.trim(),
          input.idempotencyKey,
          account.accountId,
        ],
      );
      if (!inserted.rows[0]) {
        const duplicate = await client.query<{ id: string }>(
          `select id from simulora.recovery_points
           where created_by_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
          [account.accountId, branchId, input.idempotencyKey],
        );
        if (!duplicate.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        return readRetry(duplicate.rows[0].id);
      }
      return this.readRecoveryPointWithClient(client, account.accountId, id);
    });
  }

  async deleteRecoveryPoint(
    account: SyntheticAccount,
    recoveryPointId: string,
  ): Promise<RecoveryPointRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      const point = await this.readRecoveryPointWithClient(
        client,
        account.accountId,
        recoveryPointId,
      );
      await this.assertMutableBranchWithClient(client, account.accountId, point.branchId);
      await client.query(
        `update simulora.recovery_points set deleted_at = coalesce(deleted_at, now())
         where id = $1`,
        [recoveryPointId],
      );
      const deleted = await this.readRecoveryPointWithClient(
        client,
        account.accountId,
        recoveryPointId,
      );
      return { ...point, deletedAt: deleted.deletedAt };
    });
  }

  async forkBranch(
    account: SyntheticAccount,
    continuityId: string,
    input: {
      idempotencyKey: string;
      name: string;
      sourceCommitId: string;
      expectedHeadCommitId: string;
    },
  ): Promise<RecoveryBranchRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const requestDigest = contentHash({
        schemaVersion: 1,
        continuityId,
        name: input.name.trim(),
        sourceCommitId: input.sourceCommitId,
        expectedHeadCommitId: input.expectedHeadCommitId,
      });
      const findExistingFork = async (): Promise<RecoveryBranchRecord | null> => {
        const duplicate = await client.query<{ id: string; fork_request_digest: string | null }>(
          `select id, fork_request_digest from simulora.branches
           where created_by_account_id = $1 and continuity_id = $2 and idempotency_key = $3`,
          [account.accountId, continuityId, input.idempotencyKey],
        );
        if (duplicate.rows[0] && duplicate.rows[0].fork_request_digest !== requestDigest) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return duplicate.rows[0]
          ? this.readRecoveryBranchWithClient(client, account.accountId, duplicate.rows[0].id)
          : null;
      };
      const existingFork = await findExistingFork();
      if (existingFork) return existingFork;
      await this.assertMutableContinuityWithClient(client, account.accountId, continuityId);
      await client.query(
        `select id from simulora.continuities
          where id = $1 and owner_account_id = $2 and status = 'ACTIVE' for update`,
        [continuityId, account.accountId],
      );
      const source = await client.query<{
        source_branch_id: string;
        source_state_revision_id: string;
        source_document: unknown;
        source_hash: string;
        current_head_commit_id: string;
      }>(
        `select source.branch_id as source_branch_id,
                source.state_revision_id as source_state_revision_id,
                state.document as source_document, state.document_hash as source_hash,
                active.head_commit_id as current_head_commit_id
         from simulora.continuities c
         join simulora.branches active on active.id = c.active_branch_id
         join simulora.world_commits source on source.id = $3
         join simulora.branches source_branch on source_branch.id = source.branch_id
          and source_branch.continuity_id = c.id
         join simulora.state_revisions state on state.id = source.state_revision_id
         where c.id = $1 and c.owner_account_id = $2 and c.status = 'ACTIVE'
         for update of active`,
        [continuityId, account.accountId, input.sourceCommitId],
      );
      const row = source.rows[0];
      if (!row) throw new NotFoundError("Branch source not found");
      const concurrentExistingFork = await findExistingFork();
      if (concurrentExistingFork) return concurrentExistingFork;
      if (row.current_head_commit_id !== input.expectedHeadCommitId) {
        throw new ConflictError("BRANCH_HEAD_CONFLICT");
      }
      const state = stateRevisionDocumentSchema.parse(row.source_document);
      const branchId = randomUUID();
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      const inserted = await client.query<{ id: string }>(
        `insert into simulora.branches
         (id, continuity_id, name, status, parent_branch_id, fork_source_commit_id,
          created_by_account_id, idempotency_key, fork_request_digest)
         values ($1, $2, $3, 'INITIALIZING', $4, $5, $6, $7, $8)
         on conflict (created_by_account_id, continuity_id, idempotency_key)
          where idempotency_key is not null do nothing
         returning id`,
        [
          branchId,
          continuityId,
          input.name.trim(),
          row.source_branch_id,
          input.sourceCommitId,
          account.accountId,
          input.idempotencyKey,
          requestDigest,
        ],
      );
      if (!inserted.rows[0]) {
        const insertRace = await client.query<{ id: string }>(
          `select id from simulora.branches
           where created_by_account_id = $1 and continuity_id = $2 and idempotency_key = $3`,
          [account.accountId, continuityId, input.idempotencyKey],
        );
        if (!insertRace.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        const existing = await findExistingFork();
        if (!existing) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        return existing;
      }
      await client.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          source_type, reason)
         values ($1, $2, $3, 'BRANCH_FORK', $4, $5, 'USER',
                 'A separate Branch was created from the selected Commit.')`,
        [commitId, branchId, input.sourceCommitId, account.accountId, stateRevisionId],
      );
      await client.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [stateRevisionId, branchId, commitId, JSON.stringify(state), contentHash(state)],
      );
      await client.query(
        `insert into simulora.domain_events
         (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope)
         values ($1, $2, $3, 'BRANCH_FORKED', $4::jsonb, 'USER', 'CONTINUITY_PRIVATE')`,
        [
          randomUUID(),
          branchId,
          commitId,
          JSON.stringify({
            sourceBranchId: row.source_branch_id,
            sourceCommitId: input.sourceCommitId,
          }),
        ],
      );
      await client.query(
        `update simulora.branches
         set head_commit_id = $2, head_state_revision_id = $3, status = 'ACTIVE'
         where id = $1`,
        [branchId, commitId, stateRevisionId],
      );
      return this.readRecoveryBranchWithClient(client, account.accountId, branchId);
    });
  }

  async selectBranch(
    account: SyntheticAccount,
    continuityId: string,
    branchId: string,
  ): Promise<{
    continuityId: string;
    currentBranchId: string;
    branches: RecoveryBranchRecord[];
    recoveryPoints: RecoveryPointRecord[];
    restoreProposals: RestoreProposalRecord[];
  }> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    await transaction(this.pool, async (client) => {
      const continuity = await client.query<{ active_branch_id: string }>(
        `select active_branch_id from simulora.continuities
         where id = $1 and owner_account_id = $2 and status = 'ACTIVE' for update`,
        [continuityId, account.accountId],
      );
      const current = continuity.rows[0];
      if (!current) throw new NotFoundError("Continuity not found");
      if (current.active_branch_id === branchId) return;
      const target = await client.query<{ id: string }>(
        `select id from simulora.branches
         where id = $1 and continuity_id = $2 and status = 'ACTIVE'`,
        [branchId, continuityId],
      );
      if (!target.rows[0]) throw new NotFoundError("Branch not found");
      const pending = await client.query<{ count: number }>(
        `select count(*)::int as count from simulora.actions
         where branch_id = $1 and status not in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED')`,
        [current.active_branch_id],
      );
      if ((pending.rows[0]?.count ?? 0) > 0) {
        throw new ConflictError("PENDING_ACTIONS_REQUIRE_RESOLUTION");
      }
      await client.query("update simulora.continuities set active_branch_id = $2 where id = $1", [
        continuityId,
        branchId,
      ]);
    });
    return this.readRecovery(account, continuityId);
  }

  async prepareRestore(
    account: SyntheticAccount,
    branchId: string,
    sourceCommitId: string,
  ): Promise<RestoreProposalRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      const lockedContinuity = await client.query<{ id: string }>(
        `select continuity.id
           from simulora.continuities continuity
           join simulora.branches branch on branch.continuity_id = continuity.id
          where branch.id = $1 and continuity.owner_account_id = $2
          for update of continuity`,
        [branchId, account.accountId],
      );
      if (!lockedContinuity.rows[0]) throw new NotFoundError("Restore source or Branch not found");
      const result = await client.query<{
        continuity_id: string;
        head_commit_id: string;
        current_document: unknown;
        current_hash: string;
        source_document: unknown;
        source_hash: string;
      }>(
        `select b.continuity_id, b.head_commit_id,
                current_state.document as current_document,
                current_state.document_hash as current_hash,
                source_state.document as source_document,
                source_state.document_hash as source_hash
         from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id
          and c.id = $2 and c.active_branch_id = b.id and c.status = 'ACTIVE'
         join simulora.state_revisions current_state on current_state.id = b.head_state_revision_id
         join simulora.world_commits source_commit on source_commit.id = $3
         join simulora.branches source_branch on source_branch.id = source_commit.branch_id
          and source_branch.continuity_id = b.continuity_id
         join simulora.state_revisions source_state on source_state.id = source_commit.state_revision_id
         where b.id = $1 and b.status = 'ACTIVE' for update of b`,
        [branchId, lockedContinuity.rows[0].id, sourceCommitId],
      );
      const row = result.rows[0];
      if (!row) throw new NotFoundError("Restore source or Branch not found");
      const current = stateRevisionDocumentSchema.parse(row.current_document);
      const source = stateRevisionDocumentSchema.parse(row.source_document);
      const includedSections = restoreSectionsFor(current, source);
      const excludedSections = [
        "participation",
        "interactionBoundaries",
        "customState",
        "account identity / eligibility / consent",
        "ownership / grants / usage / exports",
        "other Branches",
      ];
      const changedSections = includedSections.filter(
        (key) => JSON.stringify(current[key]) !== JSON.stringify(source[key]),
      );
      if (changedSections.length === 0) {
        throw new ConflictError("RESTORE_HAS_NO_CHANGES");
      }
      const sectionChanges = changedSections.map((section) => ({
        section,
        before: current[section],
        after: source[section],
      }));
      const digest = contentHash({
        actorAccountId: account.accountId,
        continuityId: row.continuity_id,
        branchId,
        sourceCommitId,
        expectedHeadCommitId: row.head_commit_id,
        includedSections,
        excludedSections,
        changedSections,
        beforeHash: row.current_hash,
        sourceHash: row.source_hash,
      });
      await client.query(
        `update simulora.restore_proposals set status = 'EXPIRED'
         where branch_id = $1 and proposal_digest = $2 and status = 'ACTIVE' and expires_at <= now()`,
        [branchId, digest],
      );
      const existing = await client.query<{ id: string }>(
        `select id from simulora.restore_proposals
         where branch_id = $1 and proposal_digest = $2 and status = 'ACTIVE'`,
        [branchId, digest],
      );
      if (existing.rows[0]) {
        return this.readRestoreProposalWithClient(client, account.accountId, existing.rows[0].id);
      }
      const id = randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60_000);
      const inserted = await client.query<{ id: string }>(
        `insert into simulora.restore_proposals
         (id, continuity_id, branch_id, actor_account_id, source_commit_id,
          expected_head_commit_id, included_sections, excluded_sections, diff,
          proposal_digest, status, expires_at)
         values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, 'ACTIVE', $11)
         on conflict (branch_id, proposal_digest) where status = 'ACTIVE' do nothing
         returning id`,
        [
          id,
          row.continuity_id,
          branchId,
          account.accountId,
          sourceCommitId,
          row.head_commit_id,
          JSON.stringify(includedSections),
          JSON.stringify(excludedSections),
          JSON.stringify({
            changedSections,
            sectionChanges,
            beforeHash: row.current_hash,
            sourceHash: row.source_hash,
          }),
          digest,
          expiresAt,
        ],
      );
      if (!inserted.rows[0]) {
        const duplicate = await client.query<{ id: string }>(
          `select id from simulora.restore_proposals
           where branch_id = $1 and proposal_digest = $2 and status = 'ACTIVE'`,
          [branchId, digest],
        );
        if (!duplicate.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        return this.readRestoreProposalWithClient(client, account.accountId, duplicate.rows[0].id);
      }
      return this.readRestoreProposalWithClient(client, account.accountId, id);
    });
  }

  async confirmRestore(
    account: SyntheticAccount,
    branchId: string,
    request: { proposalId: string; digest: string; expectedHeadCommitId: string },
  ): Promise<RestoreCommitRecord> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    await this.pool.query(
      `update simulora.restore_proposals proposal set status = 'EXPIRED'
         from simulora.continuities continuity
        where proposal.id = $1
          and proposal.continuity_id = continuity.id
          and continuity.owner_account_id = $2
          and proposal.status = 'ACTIVE'
          and proposal.expires_at <= now()`,
      [request.proposalId, account.accountId],
    );
    type ProposalRow = {
      id: string;
      continuity_id: string;
      branch_id: string;
      actor_account_id: string;
      source_commit_id: string;
      expected_head_commit_id: string;
      proposal_digest: string;
      status: RestoreProposalRecord["status"];
      expires_at: Date;
    };
    const result = await transaction<RestoreCommitRecord | "STALE" | "NOT_ACTIVE">(
      this.pool,
      async (client) => {
        const proposalPeek = await client.query<ProposalRow>(
          `select id, continuity_id, branch_id, actor_account_id, source_commit_id,
                  expected_head_commit_id, proposal_digest, status, expires_at
             from simulora.restore_proposals
            where id = $1 and branch_id = $2 and actor_account_id = $3`,
          [request.proposalId, branchId, account.accountId],
        );
        let proposal = proposalPeek.rows[0];
        if (!proposal) throw new NotFoundError("Restore proposal not found");
        if (
          proposal.proposal_digest !== request.digest ||
          proposal.expected_head_commit_id !== request.expectedHeadCommitId
        ) {
          throw new ConflictError("RESTORE_CONFIRMATION_MISMATCH");
        }
        if (proposal.status === "CONFIRMED") {
          const committed = await client.query<{
            id: string;
            state_revision_id: string;
            created_at: Date;
          }>(
            "select id, state_revision_id, created_at from simulora.world_commits where restore_proposal_id = $1",
            [proposal.id],
          );
          const row = committed.rows[0];
          if (!row) throw new ConflictError("RESTORE_RESULT_UNAVAILABLE");
          return {
            commitId: row.id,
            stateRevisionId: row.state_revision_id,
            resultingHeadCommitId: row.id,
            committedAt: row.created_at.toISOString(),
          };
        }
        if (proposal.status !== "ACTIVE") return "NOT_ACTIVE";

        // This runs before the Continuity peek below, not after it. The guard takes
        // the World lock first, so the peek's own `for update` re-locks a row this
        // transaction already holds instead of inverting the order against
        // confirmDeletion. It also names a deleted World as such, rather than
        // sending the reviewer to re-read a proposal whose World is gone.
        await this.assertMutableContinuityWithClient(
          client,
          account.accountId,
          proposal.continuity_id,
        );
        const continuity = await client.query<{
          active_branch_id: string | null;
          status: "ACTIVE" | "INITIALIZING" | "TOMBSTONED";
        }>(
          `select active_branch_id, status from simulora.continuities
            where id = $1 and owner_account_id = $2 for update`,
          [proposal.continuity_id, account.accountId],
        );
        if (!continuity.rows[0]) throw new NotFoundError("Continuity not found");
        const branch = await client.query<{
          continuity_id: string;
          status: "ACTIVE" | "INITIALIZING" | "TOMBSTONED";
          head_commit_id: string | null;
          head_state_revision_id: string | null;
        }>(
          `select continuity_id, status, head_commit_id, head_state_revision_id
             from simulora.branches where id = $1 and continuity_id = $2 for update`,
          [branchId, proposal.continuity_id],
        );
        const currentBranch = branch.rows[0];
        if (!currentBranch) throw new NotFoundError("Branch not found");

        const proposalResult = await client.query<ProposalRow>(
          `select id, continuity_id, branch_id, actor_account_id, source_commit_id,
                  expected_head_commit_id, proposal_digest, status, expires_at
             from simulora.restore_proposals
            where id = $1 and branch_id = $2 and actor_account_id = $3 for update`,
          [request.proposalId, branchId, account.accountId],
        );
        proposal = proposalResult.rows[0];
        if (!proposal) throw new NotFoundError("Restore proposal not found");
        if (
          proposal.proposal_digest !== request.digest ||
          proposal.expected_head_commit_id !== request.expectedHeadCommitId
        ) {
          throw new ConflictError("RESTORE_CONFIRMATION_MISMATCH");
        }
        if (proposal.status === "CONFIRMED") {
          const committed = await client.query<{
            id: string;
            state_revision_id: string;
            created_at: Date;
          }>(
            "select id, state_revision_id, created_at from simulora.world_commits where restore_proposal_id = $1",
            [proposal.id],
          );
          const row = committed.rows[0];
          if (!row) throw new ConflictError("RESTORE_RESULT_UNAVAILABLE");
          return {
            commitId: row.id,
            stateRevisionId: row.state_revision_id,
            resultingHeadCommitId: row.id,
            committedAt: row.created_at.toISOString(),
          };
        }
        if (proposal.status !== "ACTIVE" || proposal.expires_at.getTime() <= Date.now()) {
          if (proposal.status === "ACTIVE") {
            await client.query(
              "update simulora.restore_proposals set status = 'EXPIRED' where id = $1",
              [proposal.id],
            );
          }
          return "NOT_ACTIVE";
        }
        if (
          continuity.rows[0].status !== "ACTIVE" ||
          continuity.rows[0].active_branch_id !== branchId ||
          currentBranch.status !== "ACTIVE" ||
          currentBranch.head_commit_id !== proposal.expected_head_commit_id ||
          !currentBranch.head_state_revision_id
        ) {
          await client.query(
            "update simulora.restore_proposals set status = 'STALE' where id = $1",
            [proposal.id],
          );
          return "STALE";
        }
        const currentResult = await client.query<{ document: unknown }>(
          "select document from simulora.state_revisions where id = $1",
          [currentBranch.head_state_revision_id],
        );
        if (!currentResult.rows[0]) throw new NotFoundError("Branch state not found");
        const sourceResult = await client.query<{ document: unknown }>(
          `select s.document from simulora.world_commits c
           join simulora.state_revisions s on s.id = c.state_revision_id
           join simulora.branches source_branch on source_branch.id = c.branch_id
            and source_branch.continuity_id = $2
           where c.id = $1`,
          [proposal.source_commit_id, currentBranch.continuity_id],
        );
        if (!sourceResult.rows[0]) throw new NotFoundError("Restore source Commit not found");
        const current = stateRevisionDocumentSchema.parse(currentResult.rows[0].document);
        const source = stateRevisionDocumentSchema.parse(sourceResult.rows[0].document);
        const nextState = applyRestorableState(current, source);
        const commitId = randomUUID();
        const stateRevisionId = randomUUID();
        await client.query(
          `insert into simulora.restore_confirmations
           (id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
           values ($1, $2, $3, $4, $5)`,
          [
            randomUUID(),
            proposal.id,
            account.accountId,
            request.digest,
            request.expectedHeadCommitId,
          ],
        );
        await client.query(
          "update simulora.restore_proposals set status = 'CONFIRMED' where id = $1",
          [proposal.id],
        );
        await client.query(
          `insert into simulora.world_commits
           (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
            source_type, reason, restore_proposal_id)
           values ($1, $2, $3, 'RESTORE_COMMITTED', $4, $5, 'USER',
                   'Selected world-state sections were restored from an earlier Commit.', $6)`,
          [
            commitId,
            branchId,
            request.expectedHeadCommitId,
            account.accountId,
            stateRevisionId,
            proposal.id,
          ],
        );
        await client.query(
          `insert into simulora.state_revisions
           (id, branch_id, commit_id, schema_version, document, document_hash)
           values ($1, $2, $3, 1, $4::jsonb, $5)`,
          [stateRevisionId, branchId, commitId, JSON.stringify(nextState), contentHash(nextState)],
        );
        await client.query(
          `insert into simulora.domain_events
           (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope)
           values ($1, $2, $3, 'STATE_RESTORED', $4::jsonb, 'USER', 'CONTINUITY_PRIVATE')`,
          [
            randomUUID(),
            branchId,
            commitId,
            JSON.stringify({
              restoreProposalId: proposal.id,
              sourceCommitId: proposal.source_commit_id,
              includedSections: restoreSectionsFor(current, source),
            }),
          ],
        );
        const advanced = await client.query(
          `update simulora.branches set head_commit_id = $2, head_state_revision_id = $3
           where id = $1 and head_commit_id = $4 returning id`,
          [branchId, commitId, stateRevisionId, request.expectedHeadCommitId],
        );
        if (!advanced.rows[0]) throw new ConflictError("BRANCH_HEAD_CONFLICT");
        await client.query(
          `update simulora.return_orientation_projections
           set status = 'STALE', updated_at = now(), row_version = row_version + 1
           where branch_id = $1`,
          [branchId],
        );
        await client.query(
          `insert into simulora.transactional_outbox
           (id, topic, source_id, dedupe_key, payload)
           values ($1, 'projection.invalidated', $2, $3, $4::jsonb)`,
          [
            randomUUID(),
            commitId,
            `projection:${branchId}:${commitId}`,
            JSON.stringify({ branchId, currentHeadCommitId: commitId }),
          ],
        );
        return {
          commitId,
          stateRevisionId,
          resultingHeadCommitId: commitId,
          committedAt: new Date().toISOString(),
        };
      },
    );
    if (result === "STALE") throw new ConflictError("RESTORE_REVIEW_STALE");
    if (result === "NOT_ACTIVE") throw new ConflictError("RESTORE_REVIEW_NOT_ACTIVE");
    return result;
  }

  /**
   * Return the current orientation and any available rebuildable projection.
   * Projection and authoritative head are read in one transaction; a stale
   * payload is always labeled and points at the authoritative state fallback.
   */
  async readOrientation(
    account: SyntheticAccount,
    continuityId: string,
  ): Promise<OrientationResponse> {
    this.assertEligible(account);
    return transaction(this.pool, async (client) => {
      const result = await client.query<{
        continuity_id: string;
        branch_id: string;
        world_revision_id: string;
        head_commit_id: string;
        head_state_revision_id: string;
        state_document: unknown;
        projection_source_head: string | null;
        projection_status: OrientationProjectionStatus | null;
        projection_rebuilt_at: Date | null;
      }>(
        `select c.id as continuity_id, b.id as branch_id, c.world_revision_id,
                b.head_commit_id, b.head_state_revision_id, s.document as state_document,
                p.source_head_commit_id as projection_source_head,
                p.status as projection_status,
                p.rebuilt_at as projection_rebuilt_at
         from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id
          and c.active_branch_id = b.id and c.owner_account_id = $2 and c.status = 'ACTIVE'
         join simulora.state_revisions s on s.id = b.head_state_revision_id
         left join simulora.return_orientation_projections p on p.branch_id = b.id
         where c.id = $1 and b.status = 'ACTIVE'
         limit 1
         for share of b`,
        [continuityId, account.accountId],
      );
      const row = result.rows[0];
      if (!row) throw new NotFoundError("Continuity not found");
      const state = stateRevisionDocumentSchema.parse(row.state_document);
      const pendingResult = await client.query<{
        id: string;
        operation_type: ActionOperationType;
        status: ActionStatus;
        expected_head_commit_id: string;
        updated_at: Date;
      }>(
        `select id, operation_type, status, expected_head_commit_id, updated_at
         from simulora.actions
         where branch_id = $1 and status not in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED')
         order by created_at`,
        [row.branch_id],
      );
      const pendingActions = pendingResult.rows.map((pending) => ({
        id: pending.id,
        operationType: pending.operation_type,
        status: pending.status,
        expectedHeadCommitId: pending.expected_head_commit_id,
        updatedAt: pending.updated_at.toISOString(),
      }));

      let sourceHeadCommitId = row.projection_source_head ?? row.head_commit_id;
      let status: OrientationProjectionStatus = row.projection_status ?? "REBUILDING";
      const projectionUpdatedAt = row.projection_rebuilt_at?.toISOString() ?? null;
      const distanceResult = await client.query<{
        distance: number;
        state_document: unknown;
        state_revision_id: string;
      }>(
        `with recursive ancestors(id, parent_commit_id, distance) as (
           select id, parent_commit_id, 0 from simulora.world_commits where id = $1
           union all
           select c.id, c.parent_commit_id, ancestors.distance + 1
           from simulora.world_commits c join ancestors on c.id = ancestors.parent_commit_id
           where ancestors.distance < 1000
         )
         select ancestors.distance, state.document as state_document, state.id as state_revision_id
           from ancestors
           join simulora.world_commits source on source.id = ancestors.id and source.branch_id = $3
           join simulora.state_revisions state on state.id = source.state_revision_id
          where ancestors.id = $2 limit 1`,
        [row.head_commit_id, sourceHeadCommitId, row.branch_id],
      );
      const source = distanceResult.rows[0];
      if (!source) {
        sourceHeadCommitId = row.head_commit_id;
        status = "REBUILDING";
      }
      const headDistance = source?.distance ?? 0;
      if (sourceHeadCommitId !== row.head_commit_id && status === "FRESH") status = "STALE";
      // Cached payload is derived, not an authority or privacy boundary. Read
      // only authorized source records and reuse the worker's presentation logic.
      const trace = await this.readTracePageWithClient(
        client,
        row.branch_id,
        sourceHeadCommitId,
        undefined,
        10,
      );
      const payload = orientationPayload(
        row.continuity_id,
        row.branch_id,
        row.world_revision_id,
        source ? stateRevisionDocumentSchema.parse(source.state_document) : state,
        sourceHeadCommitId,
        source?.state_revision_id ?? row.head_state_revision_id,
        projectionUpdatedAt ?? new Date().toISOString(),
        trace.commits,
      );
      return {
        ...payload,
        // Pending actions and the next participation point are always based on
        // the authoritative current head, even while the narrative projection
        // is stale and still showing an older summary.
        nextParticipation: {
          ...payload.nextParticipation,
          expectedHeadCommitId: row.head_commit_id,
        },
        pendingActions,
        freshness: {
          sourceHeadCommitId,
          currentHeadCommitId: row.head_commit_id,
          status,
          headDistance,
        },
        authoritativeFallback: {
          stateUrl: `/v1/continuities/${row.continuity_id}/state`,
          headCommitId: row.head_commit_id,
          stateRevisionId: row.head_state_revision_id,
        },
        projectionUpdatedAt,
      };
    });
  }

  /** Build a fresh orientation projection from the selected Branch head. */
  async rebuildReturnOrientation(
    account: SyntheticAccount,
    branchId: string,
  ): Promise<OrientationResponse> {
    this.assertEligible(account);
    await this.assertConsentActive(account);
    return transaction(this.pool, async (client) => {
      const branchResult = await client.query<{
        continuity_id: string;
        branch_id: string;
        world_revision_id: string;
        head_commit_id: string;
        head_state_revision_id: string;
        state_document: unknown;
      }>(
        `select c.id as continuity_id, b.id as branch_id, c.world_revision_id,
                b.head_commit_id, b.head_state_revision_id, s.document as state_document
         from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id
          and c.active_branch_id = b.id and c.owner_account_id = $2 and c.status = 'ACTIVE'
         join simulora.state_revisions s on s.id = b.head_state_revision_id
         where b.id = $1 and b.status = 'ACTIVE'
         for share of b`,
        [branchId, account.accountId],
      );
      const branch = branchResult.rows[0];
      if (!branch) throw new NotFoundError("Branch not found");
      const state = stateRevisionDocumentSchema.parse(branch.state_document);
      const trace = await this.readTraceCommitsWithClient(client, branchId, undefined, 10);
      const pending = await client.query<{
        id: string;
        operation_type: ActionOperationType;
        status: ActionStatus;
        expected_head_commit_id: string;
        updated_at: Date;
      }>(
        `select id, operation_type, status, expected_head_commit_id, updated_at
         from simulora.actions
         where branch_id = $1 and status not in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED')
         order by created_at`,
        [branchId],
      );
      const updatedAt = new Date().toISOString();
      const payload = orientationPayload(
        branch.continuity_id,
        branch.branch_id,
        branch.world_revision_id,
        state,
        branch.head_commit_id,
        branch.head_state_revision_id,
        updatedAt,
        trace.commits,
      );
      payload.pendingActions = pending.rows.map((action) => ({
        id: action.id,
        operationType: action.operation_type,
        status: action.status,
        expectedHeadCommitId: action.expected_head_commit_id,
        updatedAt: action.updated_at.toISOString(),
      }));

      const projectionWrite = await client.query(
        `insert into simulora.return_orientation_projections
         (branch_id, source_head_commit_id, payload, status, rebuilt_at, row_version)
         values ($1, $2, $3::jsonb, 'FRESH', $4, 1)
         on conflict (branch_id) do update set
           source_head_commit_id = excluded.source_head_commit_id,
           payload = excluded.payload,
           status = 'FRESH', rebuilt_at = excluded.rebuilt_at,
           updated_at = now(), row_version = simulora.return_orientation_projections.row_version + 1
           where exists (
             select 1 from simulora.branches current_branch
             where current_branch.id = excluded.branch_id
               and current_branch.head_commit_id = excluded.source_head_commit_id
           )`,
        [branchId, branch.head_commit_id, JSON.stringify(payload), updatedAt],
      );
      if (projectionWrite.rowCount !== 1) {
        throw new ConflictError("PROJECTION_REBUILD_STALE");
      }
      return payload;
    });
  }

  /** Process one stale orientation row for the independently running worker. */
  async processNextProjection(branchId?: string): Promise<OrientationResponse | null> {
    const row = await transaction(this.pool, async (client) => {
      const candidate = await client.query<{
        branch_id: string;
        owner_account_id: string;
        projection_status: OrientationProjectionStatus | null;
      }>(
        `select b.id as branch_id, c.owner_account_id, p.status as projection_status
         from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id and c.status = 'ACTIVE'
         left join simulora.return_orientation_projections p on p.branch_id = b.id
         where b.status = 'ACTIVE'
           and c.active_branch_id = b.id
           and ($1::uuid is null or b.id = $1)
           and (p.branch_id is null or p.status in ('STALE', 'REBUILDING'))
         order by coalesce(p.updated_at, b.created_at)
         limit 1
         for update of b skip locked`,
        [branchId ?? null],
      );
      const next = candidate.rows[0];
      if (!next) return null;
      if (next.projection_status) {
        await client.query(
          `update simulora.return_orientation_projections
           set status = 'REBUILDING', updated_at = now(), row_version = row_version + 1
           where branch_id = $1`,
          [next.branch_id],
        );
      }
      return next;
    });
    if (!row) return null;
    try {
      return await this.rebuildReturnOrientation(
        { accountId: row.owner_account_id, eligibility: "adult" },
        row.branch_id,
      );
    } catch (error) {
      await this.pool
        .query(
          `update simulora.return_orientation_projections
           set status = 'STALE', updated_at = now(), row_version = row_version + 1
           where branch_id = $1 and status = 'REBUILDING'`,
          [row.branch_id],
        )
        .catch(() => undefined);
      throw error;
    }
  }

  async listBranchCommits(
    account: SyntheticAccount,
    branchId: string,
    cursor?: string,
    limit = 50,
  ): Promise<BranchTraceResponse> {
    this.assertEligible(account);
    const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
    return transaction(this.pool, async (client) => {
      const branch = await client.query<{
        head_commit_id: string;
      }>(
        `select b.head_commit_id
      from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id
          and c.owner_account_id = $2 and c.status = 'ACTIVE'
         where b.id = $1 and b.status = 'ACTIVE'
         for share of b`,
        [branchId, account.accountId],
      );
      const branchRow = branch.rows[0];
      if (!branchRow) throw new NotFoundError("Branch not found");
      const page = await this.readTracePageWithClient(
        client,
        branchId,
        branchRow.head_commit_id,
        cursor,
        boundedLimit,
      );
      return {
        branchId,
        freshness: {
          sourceHeadCommitId: branchRow.head_commit_id,
          currentHeadCommitId: branchRow.head_commit_id,
          status: "FRESH" as const,
          headDistance: 0,
        },
        commits: page.commits,
        nextCursor: page.nextCursor,
      };
    });
  }

  async readExplanation(
    account: SyntheticAccount,
    branchId: string,
    targetType: "fact" | "commit",
    targetId: string,
  ): Promise<ExplanationResponse> {
    this.assertEligible(account);
    return transaction(this.pool, async (client) => {
      const branchResult = await client.query<{
        continuity_id: string;
        head_commit_id: string;
        head_state_revision_id: string;
        state_document: unknown;
      }>(
        `select c.id as continuity_id, b.head_commit_id, b.head_state_revision_id,
                s.document as state_document
         from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id
         and c.owner_account_id = $2 and c.active_branch_id = b.id and c.status = 'ACTIVE'
         join simulora.state_revisions s on s.id = b.head_state_revision_id
         where b.id = $1 and b.status = 'ACTIVE'
         for share of b`,
        [branchId, account.accountId],
      );
      const branch = branchResult.rows[0];
      if (!branch) throw new NotFoundError("Branch not found");
      const state = stateRevisionDocumentSchema.parse(branch.state_document);

      let sourceCommitId: string;
      let sourceClass: SourceClass;
      let scope: VisibilityScope;
      let target: ExplanationResponse["target"];
      let explanation: string;
      let current = false;

      if (targetType === "fact") {
        const fact = state.facts.find((candidate) => candidate.id === targetId);
        const eventResult = await client.query<{
          commit_id: string;
          commit_source_type: string;
          event_source_type: string | null;
          visibility_scope: string | null;
          payload: Record<string, unknown>;
        }>(
          `with recursive ancestors(id, parent_commit_id) as (
             select c.id, c.parent_commit_id
             from simulora.world_commits c
             where c.id = $3 and c.branch_id = $1
             union all
             select parent.id, parent.parent_commit_id
             from simulora.world_commits parent
             join ancestors child on child.parent_commit_id = parent.id
             where parent.branch_id = $1
           )
           select e.commit_id, c.source_type as commit_source_type,
                  e.source_type as event_source_type,
                  coalesce(
                    (
                      select historical_fact->>'scope'
                      from simulora.state_revisions event_state
                      cross join lateral jsonb_array_elements(event_state.document->'facts') historical_fact
                      where event_state.commit_id = e.commit_id
                        and historical_fact->>'id' = $2
                      limit 1
                    ),
                    e.payload->>'scope',
                    'CONTINUITY_PRIVATE'
                  ) as visibility_scope,
                  e.payload
           from simulora.domain_events e
           join simulora.world_commits c on c.id = e.commit_id
           where e.branch_id = $1 and e.commit_id in (select id from ancestors)
             and (e.payload->>'targetFactId' = $2 or e.payload->>'target' = $2)
           order by e.created_at desc, e.id desc limit 1`,
          [branchId, targetId, branch.head_commit_id],
        );
        const event = eventResult.rows[0];
        if (!fact && !event) throw new NotFoundError("Canonical fact not found");
        if (fact) {
          sourceCommitId = event?.commit_id ?? (await this.initialCommitId(client, branchId));
          sourceClass = event
            ? safeSourceClass(
                event.event_source_type === "SYSTEM"
                  ? event.commit_source_type
                  : event.event_source_type,
              )
            : "SYSTEM";
          // The current State Revision is the scope authority. Do not trust a
          // migration default on an old event row to widen a private fact.
          scope = safeVisibilityScope(fact.scope);
          current = fact.lifecycle === "ACTIVE";
          target = {
            type: "fact",
            id: fact.id,
            statement: fact.statement,
            lifecycle: fact.lifecycle,
            current,
          };
          explanation = current
            ? "This canonical fact is part of the current continuity on this branch."
            : "This canonical fact was removed from the current continuity; its earlier record remains available as history.";
        } else {
          sourceCommitId = event!.commit_id;
          sourceClass = safeSourceClass(
            event!.event_source_type === "SYSTEM"
              ? event!.commit_source_type
              : event!.event_source_type,
          );
          scope = safeVisibilityScope(event!.visibility_scope);
          const before =
            typeof event!.payload.before === "string"
              ? event!.payload.before
              : "Historical canonical fact";
          target = {
            type: "fact",
            id: targetId,
            statement: before,
            lifecycle: "REMOVED",
            current: false,
          };
          explanation =
            "This canonical fact is a historical record and is not current on this branch.";
        }
      } else {
        const commitResult = await client.query<{
          id: string;
          source_type: string;
          kind: string;
          created_at: Date;
        }>(
          `with recursive ancestors(id, parent_commit_id) as (
             select head.id, head.parent_commit_id
             from simulora.world_commits head
             where head.id = $4 and head.branch_id = $3
             union all
             select parent.id, parent.parent_commit_id
             from simulora.world_commits parent
             join ancestors child on child.parent_commit_id = parent.id
             where parent.branch_id = $3
           )
           select c.id, c.source_type, c.kind, c.created_at
           from simulora.world_commits c
           join simulora.branches b on b.id = c.branch_id
           join simulora.continuities co on co.id = b.continuity_id
            and co.owner_account_id = $2 and co.status = 'ACTIVE'
           where c.id = $1 and c.branch_id = $3
             and c.id in (select id from ancestors)`,
          [targetId, account.accountId, branchId, branch.head_commit_id],
        );
        const commit = commitResult.rows[0];
        if (!commit) throw new NotFoundError("Commit not found");
        const event = await client.query<{ visibility_scope: string | null }>(
          `select visibility_scope from simulora.domain_events
           where commit_id = $1 order by created_at limit 1`,
          [targetId],
        );
        sourceCommitId = commit.id;
        sourceClass = safeSourceClass(commit.source_type);
        scope = safeVisibilityScope(event.rows[0]?.visibility_scope);
        current = commit.id === branch.head_commit_id;
        target = { type: "commit", id: commit.id, current };
        explanation = current
          ? "This committed change is the current head of the branch."
          : "This committed change remains in branch history; the current state is selected by the latest branch head.";
      }

      return {
        target,
        source: { class: sourceClass, commitId: sourceCommitId },
        scope,
        freshness: {
          sourceHeadCommitId: branch.head_commit_id,
          currentHeadCommitId: branch.head_commit_id,
          status: "FRESH",
          headDistance: 0,
        },
        explanation,
        correction: {
          availableOperations:
            targetType === "fact" && target.current
              ? ["CORRECT_CONTINUITY", "REMOVE_CONTINUITY"]
              : [],
          href: `/v1/branches/${branchId}/corrections`,
          requiresExactConfirmation: true,
        },
      };
    });
  }

  private async readRecoveryPointWithClient(
    client: PoolClient,
    accountId: string,
    recoveryPointId: string,
  ): Promise<RecoveryPointRecord> {
    const result = await client.query<{
      id: string;
      continuity_id: string;
      branch_id: string;
      commit_id: string;
      label: string;
      created_at: Date;
      deleted_at: Date | null;
    }>(
      `select point.id, point.continuity_id, point.branch_id, point.commit_id,
              point.label, point.created_at, point.deleted_at
       from simulora.recovery_points point
       join simulora.continuities continuity on continuity.id = point.continuity_id
        and continuity.owner_account_id = $2
       where point.id = $1`,
      [recoveryPointId, accountId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundError("Recovery Point not found");
    return {
      id: row.id,
      continuityId: row.continuity_id,
      branchId: row.branch_id,
      commitId: row.commit_id,
      label: row.label,
      createdAt: row.created_at.toISOString(),
      deletedAt: row.deleted_at?.toISOString() ?? null,
    };
  }

  private async readRecoveryBranchWithClient(
    client: PoolClient,
    accountId: string,
    branchId: string,
  ): Promise<RecoveryBranchRecord> {
    const result = await client.query<{
      id: string;
      continuity_id: string;
      name: string;
      status: "ACTIVE";
      head_commit_id: string;
      head_state_revision_id: string;
      parent_branch_id: string | null;
      fork_source_commit_id: string | null;
      is_current: boolean;
      created_at: Date;
    }>(
      `select branch.id, branch.continuity_id, branch.name, branch.status,
              branch.head_commit_id, branch.head_state_revision_id,
              branch.parent_branch_id, branch.fork_source_commit_id,
              (continuity.active_branch_id = branch.id) as is_current,
              branch.created_at
       from simulora.branches branch
       join simulora.continuities continuity on continuity.id = branch.continuity_id
        and continuity.owner_account_id = $2
       where branch.id = $1 and branch.status = 'ACTIVE'`,
      [branchId, accountId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundError("Branch not found");
    return {
      id: row.id,
      continuityId: row.continuity_id,
      name: row.name,
      status: row.status,
      headCommitId: row.head_commit_id,
      headStateRevisionId: row.head_state_revision_id,
      parentBranchId: row.parent_branch_id,
      forkSourceCommitId: row.fork_source_commit_id,
      isCurrent: row.is_current,
      createdAt: row.created_at.toISOString(),
    };
  }

  private async readRestoreProposalWithClient(
    client: PoolClient,
    accountId: string,
    proposalId: string,
  ): Promise<RestoreProposalRecord> {
    await client.query(
      `update simulora.restore_proposals proposal set status = 'EXPIRED'
         from simulora.continuities continuity
        where proposal.id = $1
          and proposal.continuity_id = continuity.id
          and continuity.owner_account_id = $2
          and proposal.status = 'ACTIVE'
          and proposal.expires_at <= now()`,
      [proposalId, accountId],
    );
    const result = await client.query<{
      id: string;
      continuity_id: string;
      branch_id: string;
      source_commit_id: string;
      expected_head_commit_id: string;
      included_sections: string[];
      excluded_sections: string[];
      diff: {
        changedSections: string[];
        sectionChanges: Array<{ section: string; before: unknown; after: unknown }>;
        beforeHash: string;
        sourceHash: string;
      };
      proposal_digest: string;
      expires_at: Date;
      status: RestoreProposalRecord["status"];
      result_commit_id: string | null;
    }>(
      `select proposal.id, proposal.continuity_id, proposal.branch_id,
              proposal.source_commit_id, proposal.expected_head_commit_id,
              proposal.included_sections, proposal.excluded_sections, proposal.diff,
              proposal.proposal_digest, proposal.expires_at, proposal.status,
              restore_commit.id as result_commit_id
       from simulora.restore_proposals proposal
       join simulora.continuities continuity on continuity.id = proposal.continuity_id
        and continuity.owner_account_id = $2
       left join simulora.world_commits restore_commit
        on restore_commit.restore_proposal_id = proposal.id
       where proposal.id = $1`,
      [proposalId, accountId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundError("Restore proposal not found");
    return {
      id: row.id,
      continuityId: row.continuity_id,
      branchId: row.branch_id,
      sourceCommitId: row.source_commit_id,
      expectedHeadCommitId: row.expected_head_commit_id,
      includedSections: row.included_sections,
      excludedSections: row.excluded_sections,
      changedSections: row.diff.changedSections,
      sectionChanges: row.diff.sectionChanges,
      beforeHash: row.diff.beforeHash,
      sourceHash: row.diff.sourceHash,
      digest: row.proposal_digest,
      expiresAt: row.expires_at.toISOString(),
      status: row.status,
      resultCommitId: row.result_commit_id,
    };
  }

  private async readRestoreProposalWithPool(
    accountId: string,
    proposalId: string,
  ): Promise<RestoreProposalRecord> {
    const client = await this.pool.connect();
    try {
      return await this.readRestoreProposalWithClient(client, accountId, proposalId);
    } finally {
      client.release();
    }
  }

  async readRestoreProposal(
    account: SyntheticAccount,
    proposalId: string,
  ): Promise<RestoreProposalRecord> {
    this.assertEligible(account);
    return this.readRestoreProposalWithPool(account.accountId, proposalId);
  }

  private async initialCommitId(client: PoolClient, branchId: string): Promise<string> {
    const result = await client.query<{ id: string }>(
      `select id from simulora.world_commits where branch_id = $1 order by created_at, id limit 1`,
      [branchId],
    );
    if (!result.rows[0]) throw new NotFoundError("Continuity history not found");
    return result.rows[0].id;
  }

  private async readTraceCommitsWithClient(
    client: PoolClient,
    branchId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<BranchTraceResponse> {
    const branch = await client.query<{ head_commit_id: string }>(
      "select head_commit_id from simulora.branches where id = $1 for share",
      [branchId],
    );
    const head = branch.rows[0]?.head_commit_id;
    if (!head) throw new NotFoundError("Branch not found");
    const page = await this.readTracePageWithClient(client, branchId, head, cursor, limit);
    return {
      branchId,
      freshness: {
        sourceHeadCommitId: head,
        currentHeadCommitId: head,
        status: "FRESH",
        headDistance: 0,
      },
      commits: page.commits,
      nextCursor: page.nextCursor,
    };
  }

  /**
   * Page commits first, then load all of their events. A SQL LIMIT over a
   * Commit/Event join can split one Commit's events across pages; this helper
   * keeps the cursor at Commit granularity and restricts rows to the captured
   * head's ancestry so a concurrent head advance cannot make a read claim a
   * mixed or falsely-FRESH result.
   */
  private async readTracePageWithClient(
    client: PoolClient,
    branchId: string,
    headCommitId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<{ commits: TraceCommit[]; nextCursor: string | null }> {
    const decoded = decodeTraceCursor(cursor);
    const args: unknown[] = [branchId, headCommitId, limit + 1];
    let where = "true";
    if (decoded) {
      args.push(decoded.createdAt, decoded.id);
      where = `(c.created_at, c.id) < ($${args.length - 1}::timestamptz, $${args.length})`;
    }
    const commitResult = await client.query<TraceCommitRow>(
      `with recursive ancestors(id, parent_commit_id, kind, source_type, reason, created_at) as (
         select c.id, c.parent_commit_id, c.kind, c.source_type, c.reason, c.created_at
         from simulora.world_commits c
         where c.id = $2 and c.branch_id = $1
         union all
         select parent.id, parent.parent_commit_id, parent.kind, parent.source_type,
                parent.reason, parent.created_at
         from simulora.world_commits parent
         join ancestors child on child.parent_commit_id = parent.id
         where parent.branch_id = $1
       )
       select c.id, c.parent_commit_id, c.kind, c.source_type, c.reason, c.created_at
       from ancestors c
       where ${where}
       order by c.created_at desc, c.id desc limit $3`,
      args,
    );
    const hasMore = commitResult.rows.length > limit;
    const rows = hasMore ? commitResult.rows.slice(0, limit) : commitResult.rows;
    const commitIds = rows.map((row) => row.id);
    const eventRows = commitIds.length
      ? (
          await client.query<TraceEventRow>(
            `select e.commit_id, e.id as event_id, e.event_type,
                    e.payload as event_payload,
                    case
                      when coalesce(e.payload->>'targetFactId', e.payload->>'target') is not null then
                        coalesce(
                          (
                            select fact->>'scope'
                            from simulora.state_revisions event_state
                            cross join lateral jsonb_array_elements(event_state.document->'facts') fact
                            where event_state.commit_id = e.commit_id
                              and fact->>'id' = coalesce(
                                e.payload->>'targetFactId',
                                e.payload->>'target'
                              )
                            limit 1
                          ),
                          e.payload->>'scope',
                          'CONTINUITY_PRIVATE'
                        )
                      else coalesce(e.visibility_scope, 'SHARED')
                    end as event_scope
             from simulora.domain_events e
             where e.commit_id = any($1::uuid[]) and e.branch_id = $2
             order by e.created_at, e.id`,
            [commitIds, branchId],
          )
        ).rows
      : [];
    const eventsByCommit = new Map<string, TraceEventRow[]>();
    for (const event of eventRows) {
      const events = eventsByCommit.get(event.commit_id) ?? [];
      events.push(event);
      eventsByCommit.set(event.commit_id, events);
    }
    const traceRows: TraceRow[] = [];
    for (const row of rows) {
      const events = eventsByCommit.get(row.id) ?? [];
      if (events.length === 0) {
        traceRows.push({
          ...row,
          event_id: null,
          event_type: null,
          event_payload: null,
          event_scope: null,
        });
        continue;
      }
      for (const event of events) {
        traceRows.push({
          ...row,
          event_id: event.event_id,
          event_type: event.event_type,
          event_payload: event.event_payload,
          event_scope: event.event_scope,
        });
      }
    }
    return {
      commits: this.groupTraceRows(traceRows),
      nextCursor: hasMore
        ? encodeTraceCursor({
            createdAt: rows.at(-1)!.created_at.toISOString(),
            id: rows.at(-1)!.id,
          })
        : null,
    };
  }

  private groupTraceRows(rows: TraceRow[]): TraceCommit[] {
    const grouped = new Map<string, TraceCommit>();
    for (const row of rows) {
      let commit = grouped.get(row.id);
      if (!commit) {
        commit = {
          id: row.id,
          parentCommitId: row.parent_commit_id,
          kind: row.kind,
          sourceClass: safeSourceClass(row.source_type),
          // Commit reason is intentionally kept to a server-generated opaque
          // operation token in current writes; free-form correction reasons are
          // not exposed through the explanation projection.
          reason: safeCommitReason(row.reason),
          createdAt: row.created_at.toISOString(),
          events: [],
        };
        grouped.set(row.id, commit);
      }
      if (row.event_id && row.event_type) {
        const payload = row.event_payload ?? {};
        const targetId = [
          payload.targetFactId,
          payload.target,
          payload.relationshipId,
          payload.constraintId,
          payload.threadId,
        ].find((value): value is string => typeof value === "string");
        commit.events.push({
          id: row.event_id,
          type: row.event_type,
          summary: eventSummary(row.event_type, payload),
          ...(targetId ? { targetId } : {}),
          scope: safeVisibilityScope(row.event_scope),
        });
      }
    }
    return [...grouped.values()];
  }

  async processAction(
    actionId: string,
    generator: ActionGenerator,
    workerId = "worker",
    options: ActionProcessingOptions = {},
  ): Promise<ActionRecord | null> {
    const profile = options.profile ?? deterministicRouting;
    const prepared = await transaction(this.pool, async (client) => {
      // All lifecycle transactions lock Action -> job -> attempt, including cancellation.
      const actionResult = await client.query<{
        actor_account_id: string;
        correlation_id: string | null;
        action_branch_id: string;
        expected_head_commit_id: string;
        intent: string;
        status: ActionStatus;
        branch_head_commit_id: string;
        branch_status: string;
        active_branch_id: string;
        continuity_status: string;
        source_state_revision_id: string;
        state_document: unknown;
        world_document: unknown;
        operation_payload: {
          targetCharacterId?: string;
          requestedEffect?: string;
          targetThreadId?: string;
        };
        supports_re2_context: boolean;
        supports_re3_policy: boolean;
      }>(
        `select a.actor_account_id, a.correlation_id, a.branch_id as action_branch_id,
                a.expected_head_commit_id, a.intent, a.status,
                branch.head_commit_id as branch_head_commit_id, branch.status as branch_status,
                continuity.active_branch_id, continuity.status as continuity_status,
                c.state_revision_id as source_state_revision_id,
                s.document as state_document, wr.document as world_document, a.operation_payload,
                to_regprocedure('simulora.re2_generation_context(uuid)') is not null as supports_re2_context,
                to_regclass('simulora.re3_routine_policies') is not null as supports_re3_policy
         from simulora.actions a
         join simulora.world_commits c on c.id = a.expected_head_commit_id
         join simulora.state_revisions s on s.id = c.state_revision_id
         join simulora.branches branch on branch.id = a.branch_id
         join simulora.continuities continuity on continuity.id = a.continuity_id
         join simulora.world_revisions wr on wr.id = continuity.world_revision_id
         where a.id = $1 for update of a`,
        [actionId],
      );
      const action = actionResult.rows[0];
      if (!action) throw new NotFoundError("Action not found");
      if (!["ACKNOWLEDGED", "GENERATING"].includes(action.status)) return null;
      if (
        action.branch_status !== "ACTIVE" ||
        action.continuity_status !== "ACTIVE" ||
        action.active_branch_id !== action.action_branch_id ||
        action.branch_head_commit_id !== action.expected_head_commit_id
      ) {
        await client.query(
          `update simulora.actions
             set status = 'CONFLICT', status_reason = 'BRANCH_HEAD_CONFLICT',
                 updated_at = now(), row_version = row_version + 1
           where id = $1 and status in ('ACKNOWLEDGED', 'GENERATING')`,
          [actionId],
        );
        await client.query(
          `update simulora.durable_jobs
             set status = 'DEAD', lease_owner = null, lease_until = null,
                 last_error = 'BRANCH_HEAD_CONFLICT', updated_at = now()
           where action_id = $1`,
          [actionId],
        );
        await this.appendProgressWithClient(client, actionId, "action.failed", {
          status: "CONFLICT",
          reason: "BRANCH_HEAD_CONFLICT",
        });
        return null;
      }
      const lease = await client.query<{ id: string; attempts: number }>(
        `update simulora.durable_jobs
         set status = 'LEASED', lease_owner = $1,
             lease_until = clock_timestamp() + $3 * interval '1 millisecond',
             attempts = attempts + 1, updated_at = now()
         where action_id = $2 and
           ((status = 'AVAILABLE' and available_at <= clock_timestamp())
            or (status = 'LEASED' and lease_until <= clock_timestamp()))
         returning id, attempts`,
        [workerId, actionId, this.actionLease.durationMs],
      );
      if (!lease.rows[0]) return null;
      // Reclaim closes the abandoned attempt; its eventual callback has no write authority.
      await client.query(
        `update simulora.generation_attempts set status = 'FAILED', error_class = 'LEASE_EXPIRED',
         completed_at = now() where action_id = $1 and status = 'RUNNING'`,
        [actionId],
      );
      if (action.status === "ACKNOWLEDGED") {
        await client.query(
          `update simulora.actions set status = 'GENERATING', updated_at = now(), row_version = row_version + 1 where id = $1`,
          [actionId],
        );
      }
      const state = stateRevisionDocumentSchema.parse(action.state_document);
      const world = worldDocumentSchema.parse(action.world_document);
      const policyResult = action.supports_re3_policy
        ? await client.query<{ document: unknown; digest: string }>(
            `select policy.document, policy.digest from simulora.re3_routine_policies policy
         join simulora.continuities continuity on continuity.world_revision_id = policy.world_revision_id
         join simulora.actions action on action.continuity_id = continuity.id where action.id = $1`,
            [actionId],
          )
        : { rows: [] };
      const routinePolicy = policyResult.rows[0]
        ? routinePolicySchema.parse(policyResult.rows[0].document)
        : null;
      const generationContext = compileActionGenerationContext(
        world,
        state,
        action.operation_payload.targetCharacterId,
        !(await worldResponseWhenUnaddressed(client, actionId)),
        await sharedWorldApplies(client, actionId),
      );
      let context: Record<string, unknown> | undefined;
      if (generationContext && action.supports_re2_context) {
        const compiled = await client.query<{ context: Record<string, unknown> | null }>(
          `select simulora.re2_generation_context($1::uuid) as context`,
          [actionId],
        );
        context = compiled.rows[0]?.context ?? undefined;
        if (
          context &&
          Buffer.byteLength(
            JSON.stringify({
              actionId,
              expectedHeadCommitId: action.expected_head_commit_id,
              intent: action.intent,
              participation: generationContext.participation,
              character: generationContext.character,
              targetFact: generationContext.targetFact,
              context,
            }),
            "utf8",
          ) > 64000
        )
          context = undefined;
      }
      const dialogueFunction = await client.query<{ available: boolean }>(
        `select to_regprocedure('simulora.authorized_action_dialogue(uuid)') is not null as available`,
      );
      const dialogueResult = dialogueFunction.rows[0]?.available
        ? await client.query<{ prior_dialogue: unknown }>(
            `select simulora.authorized_action_dialogue($1::uuid) as prior_dialogue`,
            [actionId],
          )
        : { rows: [{ prior_dialogue: [] }] };
      const priorDialogue = Array.isArray(dialogueResult.rows[0]?.prior_dialogue)
        ? (dialogueResult.rows[0].prior_dialogue as ActionDialogueRecord[])
        : [];
      if (!generationContext || (action.supports_re2_context && !context)) {
        const reason = generationContext
          ? "AUTHORIZED_CONTEXT_UNAVAILABLE"
          : "NO_ACTIVE_CANONICAL_FACT";
        // This can happen when a previously accepted job is observed after
        // the last active fact was removed on a newer head. Resolve the job
        // explicitly instead of leaving an ACKNOWLEDGED record to retry
        // forever or fabricating a replacement fact.
        await client.query(
          `update simulora.actions
            set status = 'GENERATING', updated_at = now(), row_version = row_version + 1
            where id = $1 and status = 'ACKNOWLEDGED'`,
          [actionId],
        );
        await client.query(
          `update simulora.actions
            set status = 'FAILED_RECOVERABLE', status_reason = $2,
                updated_at = now(), row_version = row_version + 1
            where id = $1 and status = 'GENERATING'`,
          [actionId, reason],
        );
        await client.query(
          `update simulora.durable_jobs
            set status = 'DEAD', last_error = $2,
                lease_owner = null, lease_until = null, updated_at = now()
            where action_id = $1`,
          [actionId, reason],
        );
        await this.appendProgressWithClient(client, actionId, "action.failed", {
          status: "FAILED_RECOVERABLE",
          reason,
        });
        return null;
      }
      const attemptId = randomUUID();
      const includedFactIds = generationContext.contextFactIds;
      const manifest = {
        compilerVersion: "ip6-context-v1",
        expectedHeadCommitId: action.expected_head_commit_id,
        // The generator receives this exact participation contract and target
        // fact below. Keep the durable manifest derived from the same typed
        // context so it cannot claim inputs that were never supplied.
        participation: generationContext.participation,
        // manifest truthful: owner-visible private/tombstoned facts and
        // character records are not silently treated as model context.
        includedFactIds,
        includedCharacterIds: generationContext.character ? [generationContext.character.id] : [],
        excludedScopeCounts: {
          unauthorized: state.facts.filter((fact) => !includedFactIds.includes(fact.id)).length,
        },
      };
      // The predecessor-schema upgrade fixture still uses v1. Current migrated
      // databases use the source-bound SQL compiler and v2 digest evidence.
      const contextManifest = context
        ? {
            ...manifest,
            compilerVersion: "re2-context-v1",
            sourceContextDigest: contentHash(context),
          }
        : manifest;
      if (action.operation_payload.requestedEffect === "ROUTINE_EFFECT") {
        Object.assign(contextManifest, {
          routinePolicyDigest: policyResult.rows[0]?.digest ?? null,
        });
      }
      if (
        action.operation_payload.requestedEffect === "NO_WORLD_EFFECT" ||
        action.operation_payload.requestedEffect === "STORY_DECIDES"
      ) {
        Object.assign(contextManifest, {
          priorDialogueIds: priorDialogue.map((entry) => entry.id),
          priorDialogueDigest: contentHash(priorDialogue),
        });
      }
      // MGC-1: bind the declared effect context only when this Action can use it.
      const effectContext = compileEffectContext(
        world,
        state,
        generationContext.character?.id ?? null,
        requestedEffectSchema.parse(action.operation_payload.requestedEffect ?? "FACT_REWRITE"),
      );
      if (effectContext) {
        Object.assign(contextManifest, { effectContextDigest: contentHash(effectContext) });
      }
      // Prior-schema databases in the upgrade rehearsal predate the profile
      // columns; there the routed profile is recorded by `adapter` alone.
      const attemptColumns = [
        "id",
        "action_id",
        "attempt_number",
        "adapter",
        "status",
        "context_manifest",
        "correlation_id",
      ];
      const attemptValues: unknown[] = [
        attemptId,
        actionId,
        lease.rows[0].attempts,
        profile.adapter,
        "RUNNING",
        JSON.stringify(contextManifest),
        action.correlation_id,
      ];
      if (await this.hasGenerationProfileColumns(client)) {
        attemptColumns.push("profile_id", "profile_version");
        attemptValues.push(profile.id, profile.version);
      }
      await client.query(
        `insert into simulora.generation_attempts (${attemptColumns.join(", ")})
         values (${attemptValues.map((_, index) => `$${index + 1}`).join(", ")})`,
        attemptValues,
      );
      await this.appendProgressWithClient(client, actionId, "action.status", {
        status: "GENERATING",
        recoverableAfterSeconds: 10,
      });
      return {
        jobId: lease.rows[0].id,
        attempts: lease.rows[0].attempts,
        attemptId,
        actorAccountId: action.actor_account_id,
        correlationId: action.correlation_id,
        expectedHeadCommitId: action.expected_head_commit_id,
        sourceStateRevisionId: action.source_state_revision_id,
        intent: action.intent,
        operationPayload: action.operation_payload,
        world,
        effectContext,
        routinePolicy,
        state,
        generationContext,
        context,
        priorDialogue,
        userRoleName: world.userRole.name,
      };
    });
    if (!prepared) return null;

    const account: SyntheticAccount = {
      accountId: prepared.actorAccountId,
      eligibility: "adult",
    };
    const leaseIdentity = [prepared.jobId, workerId, prepared.attempts, prepared.attemptId];
    // The epoch and attempt ID fence even two executions sharing a worker name.
    const lockOwnedLease = async (client: PoolClient): Promise<boolean> => {
      const current = await client.query<{
        status: ActionStatus;
        branch_id: string;
        continuity_id: string;
        expected_head_commit_id: string;
      }>(
        `select status, branch_id, continuity_id, expected_head_commit_id
           from simulora.actions where id = $1 for update`,
        [actionId],
      );
      const action = current.rows[0];
      if (action?.status !== "GENERATING") return false;
      const owned = await client.query(
        `select j.id from simulora.durable_jobs j
         join simulora.generation_attempts g on g.action_id = j.action_id
         where j.id = $1 and j.lease_owner = $2 and j.attempts = $3
           and j.status = 'LEASED' and j.lease_until > clock_timestamp()
           and g.id = $4 and g.attempt_number = j.attempts and g.status = 'RUNNING'
         for update of j`,
        leaseIdentity,
      );
      if (owned.rowCount !== 1) return false;
      const continuity = await client.query<{
        active_branch_id: string;
        status: string;
      }>(
        `select active_branch_id, status from simulora.continuities
          where id = $1 for update`,
        [action.continuity_id],
      );
      const path = await client.query<{
        head_commit_id: string;
        branch_status: string;
      }>(
        `select branch.head_commit_id, branch.status as branch_status
           from simulora.branches branch
          where branch.id = $1 and branch.continuity_id = $2
          for update`,
        [action.branch_id, action.continuity_id],
      );
      const currentPath = path.rows[0];
      if (
        currentPath?.branch_status === "ACTIVE" &&
        continuity.rows[0]?.status === "ACTIVE" &&
        continuity.rows[0].active_branch_id === action.branch_id &&
        currentPath.head_commit_id === action.expected_head_commit_id
      ) {
        return true;
      }
      await client.query(
        `update simulora.generation_attempts
           set status = 'FAILED', error_class = 'BRANCH_HEAD_CONFLICT', completed_at = now()
         where id = $1`,
        [prepared.attemptId],
      );
      await client.query(
        `update simulora.actions
           set status = 'CONFLICT', status_reason = 'BRANCH_HEAD_CONFLICT',
               updated_at = now(), row_version = row_version + 1
         where id = $1`,
        [actionId],
      );
      await client.query(
        `update simulora.durable_jobs
           set status = 'DEAD', lease_owner = null, lease_until = null,
               last_error = 'BRANCH_HEAD_CONFLICT', updated_at = now()
         where id = $1`,
        [prepared.jobId],
      );
      await this.appendProgressWithClient(client, actionId, "action.failed", {
        status: "CONFLICT",
        reason: "BRANCH_HEAD_CONFLICT",
      });
      return false;
    };
    let renewal: Promise<void> | undefined;
    const heartbeat = setInterval(() => {
      if (renewal) return;
      renewal = this.pool
        .query(
          `update simulora.durable_jobs j
         set lease_until = clock_timestamp() + $5 * interval '1 millisecond', updated_at = now()
         from simulora.generation_attempts g, simulora.actions a
         where j.id = $1 and j.lease_owner = $2 and j.attempts = $3
           and j.status = 'LEASED' and j.lease_until > clock_timestamp()
           and g.id = $4 and g.action_id = j.action_id and g.attempt_number = j.attempts
           and g.status = 'RUNNING' and a.id = j.action_id and a.status = 'GENERATING'`,
          [...leaseIdentity, this.actionLease.durationMs],
        )
        .then((result) => {
          if (result.rowCount !== 1) clearInterval(heartbeat);
        })
        .catch(() => {
          // Fail closed: never revive an expired lease; completion still checks the database fence.
          clearInterval(heartbeat);
        })
        .finally(() => {
          renewal = undefined;
        });
    }, this.actionLease.heartbeatMs);
    heartbeat.unref();
    try {
      const requestedEffect = requestedEffectSchema.parse(
        prepared.operationPayload.requestedEffect ?? "FACT_REWRITE",
      );
      const targetThreadId = prepared.operationPayload.targetThreadId;
      const generated = await generator({
        actionId,
        expectedHeadCommitId: prepared.expectedHeadCommitId,
        intent: prepared.intent,
        requestedEffect,
        ...(targetThreadId ? { targetThreadId } : {}),
        ...(prepared.effectContext ? { effectContext: prepared.effectContext } : {}),
        routineRoutes: prepared.routinePolicy?.routes ?? [],
        participation: prepared.generationContext.participation,
        character: prepared.generationContext.character,
        targetFact: prepared.generationContext.targetFact,
        ...(prepared.generationContext.sharedWorld ? { sharedWorld: true } : {}),
        ...(prepared.context ? { context: prepared.context } : {}),
        ...(prepared.priorDialogue.length ? { priorDialogue: prepared.priorDialogue } : {}),
      });
      const expectedResponseSource: ActionResponseSource = prepared.generationContext.character
        ? { type: "CHARACTER", characterId: prepared.generationContext.character.id }
        : { type: "WORLD" };
      if (JSON.stringify(generated.responseSource) !== JSON.stringify(expectedResponseSource)) {
        throw new Error("Generated response source does not match the compiled character context");
      }
      assertGeneratedNarrativeDoesNotAuthorUser(
        generated.narrative,
        prepared.userRoleName,
        prepared.state.characters.find(
          (character) => character.id === prepared.generationContext.character?.id,
        )?.name,
      );
      const candidate = validateActionCandidate(generated.candidate, {
        actionId,
        expectedHeadCommitId: prepared.expectedHeadCommitId,
        state: prepared.state,
        authorizedTargetFactIds: prepared.generationContext.targetFactIds,
        authorizedContextFactIds: prepared.generationContext.contextFactIds,
        allowAddFact: prepared.generationContext.sharedWorld,
        revealableFactIds: revealableFactIdsFor(
          prepared.world,
          prepared.state,
          prepared.generationContext,
          requestedEffect,
        ),
        responseSource: expectedResponseSource,
        userRoleName: prepared.userRoleName,
        requestedEffect,
        authorizedRoutineNpcIds: prepared.routinePolicy?.npcIds ?? [],
        authorizedRoutineRoutes: (prepared.routinePolicy?.routes ?? []).map(
          (route) => `${route.fromLocationId}->${route.toLocationId}`,
        ),
        ...(targetThreadId ? { targetThreadId } : {}),
        relationshipPolicies: relationshipPoliciesFor(prepared.world),
        constraintIds: (prepared.world.constraints ?? []).map((constraint) => constraint.id),
      });
      if (generated.narrative !== candidate.candidate.narrative) {
        throw new Error("Generated narrative does not match the candidate narrative");
      }
      const proposalId = randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60_000);
      const digest = contentHash({
        actionId,
        actorAccountId: prepared.actorAccountId,
        expectedHeadCommitId: prepared.expectedHeadCommitId,
        candidate: candidate.candidate,
        displayEffect: candidate.displayEffect,
        expiresAt: expiresAt.toISOString(),
      });

      return await transaction(this.pool, async (client) => {
        if (!(await lockOwnedLease(client))) {
          return this.readActionWithClient(client, account, actionId);
        }
        await client.query(
          `update simulora.generation_attempts
           set status = 'SUCCEEDED', output = $2::jsonb, completed_at = now() where id = $1`,
          // The database binds proposals to this exact output shape, so profile
          // provenance travels in the draft frame instead of the evidence.
          [
            prepared.attemptId,
            JSON.stringify({
              narrative: generated.narrative,
              responseSource: generated.responseSource,
              candidate: generated.candidate,
            }),
          ],
        );
        await client.query(
          `update simulora.actions set status = 'VALIDATING', updated_at = now(), row_version = row_version + 1 where id = $1`,
          [actionId],
        );
        if (candidate.impact === "L0") {
          const dialogue: ActionDialogueRecord = {
            id: actionId,
            narrative: generated.narrative,
            responseSource: generated.responseSource,
            sourceHeadCommitId: prepared.expectedHeadCommitId,
            sourceStateRevisionId: prepared.sourceStateRevisionId,
            provenance: `Generated Action ${actionId}`,
            visibilityScope: "CONTINUITY_PRIVATE",
            recordedAt: new Date().toISOString(),
          };
          await client.query(
            `update simulora.actions
                set dialogue_record = $2::jsonb, status = 'COMPLETED_NO_EFFECT',
                    status_reason = 'NO_WORLD_EFFECT', terminal_at = now(),
                    updated_at = now(), row_version = row_version + 1
              where id = $1`,
            [actionId, JSON.stringify(dialogue)],
          );
          await this.appendProgressWithClient(client, actionId, "generation.draft", {
            status: "COMPLETED_NO_EFFECT",
            narrative: generated.narrative,
            responseSource: generated.responseSource,
            provisional: false,
            noWorldMutation: true,
            ...(generated.generatedBy ? { generatedBy: generated.generatedBy } : {}),
            message: "Response recorded as dialogue; current World truth is unchanged.",
          });
          await this.appendProgressWithClient(client, actionId, "action.status", {
            status: "COMPLETED_NO_EFFECT",
            message: "Response completed without changing authoritative World truth.",
          });
          await client.query(
            `update simulora.durable_jobs
                set status = 'SUCCEEDED', lease_owner = null, lease_until = null,
                    last_error = null, updated_at = now()
              where action_id = $1`,
            [actionId],
          );
          return this.readActionWithClient(client, account, actionId);
        }
        await client.query(
          `insert into simulora.action_proposals
           (id, action_id, generation_attempt_id, expected_head_commit_id, schema_version,
            candidate_transition, impact_level, proposal_digest, display_effect, status, expires_at)
           values ($1, $2, $3, $4, 1, $5::jsonb, $6, $7, $8::jsonb, 'ACTIVE', $9)`,
          [
            proposalId,
            actionId,
            prepared.attemptId,
            prepared.expectedHeadCommitId,
            JSON.stringify(candidate.candidate),
            candidate.impact,
            digest,
            JSON.stringify(candidate.displayEffect ?? {}),
            expiresAt,
          ],
        );
        await client.query(
          `update simulora.actions set status = 'AWAITING_CONFIRMATION', updated_at = now(), row_version = row_version + 1 where id = $1`,
          [actionId],
        );
        await this.appendProgressWithClient(client, actionId, "generation.draft", {
          status: "VALIDATING",
          narrative: candidate.candidate.narrative,
          responseSource: candidate.candidate.responseSource,
          provisional: true,
          ...(generated.generatedBy ? { generatedBy: generated.generatedBy } : {}),
        });
        await this.appendProgressWithClient(client, actionId, "confirmation.required", {
          status: "AWAITING_CONFIRMATION",
          proposalId,
          proposalDigest: digest,
          expiresAt: expiresAt.toISOString(),
          effect: candidate.displayEffect,
        });
        await client.query(
          `update simulora.durable_jobs set status = 'SUCCEEDED', lease_owner = null,
           lease_until = null, updated_at = now() where id = $1`,
          [prepared.jobId],
        );
        return this.readActionWithClient(client, account, actionId);
      });
    } catch (error) {
      return await transaction(this.pool, async (client) => {
        if (!(await lockOwnedLease(client))) {
          return this.readActionWithClient(client, account, actionId);
        }
        await client.query(
          `update simulora.generation_attempts
           set status = 'FAILED', error_class = $2, completed_at = now() where id = $1`,
          [prepared.attemptId, error instanceof Error ? error.name : "UnknownError"],
        );
        if (prepared.attempts >= 3) {
          await client.query(
            `update simulora.actions
             set status = 'FAILED_RECOVERABLE', status_reason = 'GENERATION_FAILED', updated_at = now(),
                 row_version = row_version + 1 where id = $1 and status = 'GENERATING'`,
            [actionId],
          );
          await client.query(
            `update simulora.durable_jobs set status = 'DEAD', lease_owner = null, lease_until = null,
             last_error = $2, updated_at = now() where id = $1`,
            [
              prepared.jobId,
              (error instanceof Error ? error.message : "Unknown generation failure").slice(0, 500),
            ],
          );
          await this.appendProgressWithClient(client, actionId, "action.failed", {
            status: "FAILED_RECOVERABLE",
            reason: "GENERATION_FAILED",
          });
        } else {
          await client.query(
            `update simulora.durable_jobs set status = 'AVAILABLE', lease_owner = null, lease_until = null,
             available_at = now(), last_error = $2, updated_at = now() where id = $1`,
            [
              prepared.jobId,
              (error instanceof Error ? error.message : "Unknown generation failure").slice(0, 500),
            ],
          );
        }
        return this.readActionWithClient(client, account, actionId);
      });
    } finally {
      clearInterval(heartbeat);
      await renewal;
    }
  }

  /**
   * Records which capability profile workers now route to. A new activation is
   * written only when the profile differs from the last one; a material change
   * also publishes a MODEL product-change notice in the same transaction, so a
   * change people would notice can never take effect silently.
   */
  async recordModelProfileActivation(
    activation: ModelProfileActivationInput,
  ): Promise<ModelProfileActivationRecord> {
    return transaction(this.pool, async (client) => {
      // Workers can start together; serialize so each change is recorded once.
      await client.query("select pg_advisory_xact_lock($1)", [modelProfileLock]);
      const latest = await client.query<{
        id: string;
        profile_id: string;
        profile_version: string;
        adapter: ModelProfileActivationInput["adapter"];
        model: string | null;
        provider: string | null;
        prompt_version: number;
        profile_digest: string;
        fallback_profile: string | null;
        material: boolean;
        product_change_id: string | null;
        activated_at: Date;
      }>(
        `select id, profile_id, profile_version, adapter, model, provider, prompt_version,
                profile_digest, fallback_profile, material, product_change_id, activated_at
         from simulora.model_profile_activations order by sequence desc limit 1`,
      );
      const previous = latest.rows[0];
      if (
        previous &&
        previous.profile_digest === activation.profileDigest &&
        previous.fallback_profile === activation.fallbackProfile
      ) {
        return mapModelProfileActivation(previous);
      }
      const material = activation.isMaterialChange(
        previous
          ? {
              id: previous.profile_id,
              adapter: previous.adapter,
              model: previous.model,
              provider: previous.provider,
              promptVersion: previous.prompt_version,
              fallbackProfile: previous.fallback_profile,
            }
          : null,
      );
      const id = randomUUID();
      let productChangeId: string | null = null;
      if (material) {
        productChangeId = randomUUID();
        await client.query(
          `insert into simulora.product_changes
           (id, version, category, summary, effect, recovery, affected_scopes, effective_at,
            available_choices)
           values ($1, $2, 'MODEL', $3, $4, $5, $6::jsonb, now(), $7::jsonb)`,
          [
            productChangeId,
            `MODEL-${activation.profileId}-${activation.profileVersion}-${id.slice(0, 8)}`,
            `World responses now come from the ${activation.profileId} profile (version ${activation.profileVersion}).`,
            "New responses may read differently. Existing World truth, history and pending reviews are unchanged, and every response is still checked by the same rules before anything is recorded.",
            "Review any pending proposal before confirming it; nothing changes unless you confirm.",
            JSON.stringify(["WORLD", "CONTINUITY"]),
            JSON.stringify(["REVIEW_PENDING_PROPOSALS", "OPEN_APPEAL"]),
          ],
        );
      }
      const inserted = await client.query<{ activated_at: Date }>(
        `insert into simulora.model_profile_activations
         (id, profile_id, profile_version, adapter, model, prompt_version, profile_digest,
          fallback_profile, material, previous_activation_id, product_change_id, provider)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         returning activated_at`,
        [
          id,
          activation.profileId,
          activation.profileVersion,
          activation.adapter,
          activation.model,
          activation.promptVersion,
          activation.profileDigest,
          activation.fallbackProfile,
          material,
          previous?.id ?? null,
          productChangeId,
          activation.provider,
        ],
      );
      return {
        id,
        profileId: activation.profileId,
        profileVersion: activation.profileVersion,
        material,
        productChangeId,
        activatedAt: inserted.rows[0]!.activated_at.toISOString(),
        changed: true,
      };
    });
  }

  async processNextAction(
    generator: ActionGenerator,
    workerId = "worker",
    options: ActionProcessingOptions = {},
  ): Promise<ActionRecord | null> {
    const next = await this.pool.query<{ action_id: string }>(
      `select action_id from simulora.durable_jobs
       where (status = 'AVAILABLE' and available_at <= clock_timestamp())
          or (status = 'LEASED' and lease_until <= clock_timestamp())
       order by available_at, created_at limit 1`,
    );
    return next.rows[0]
      ? this.processAction(next.rows[0].action_id, generator, workerId, options)
      : null;
  }

  private async readActionWithPool(
    account: SyntheticAccount,
    actionId: string,
  ): Promise<ActionRecord> {
    const client = await this.pool.connect();
    try {
      return await this.readActionWithClient(client, account, actionId);
    } finally {
      client.release();
    }
  }

  private async readActionWithClient(
    client: PoolClient,
    account: SyntheticAccount,
    actionId: string,
  ): Promise<ActionRecord> {
    const result = await client.query<{
      id: string;
      continuity_id: string;
      branch_id: string;
      correlation_id: string | null;
      expected_head_commit_id: string;
      operation_type: ActionOperationType;
      status: ActionStatus;
      intent: string;
      operation_payload: {
        targetCharacterId?: string;
        requestedEffect?: string;
        targetThreadId?: string;
      };
      participation_expectation: ParticipationContract;
      acknowledged_at: Date;
      terminal_at: Date | null;
      status_reason: string | null;
      proposal_id: string | null;
      proposal_digest: string | null;
      proposal_impact: "L0" | "L2" | "L3" | null;
      proposal_head: string | null;
      proposal_expires: Date | null;
      proposal_narrative: string | null;
      proposal_response_source: ActionResponseSource | null;
      display_effect: ActionProposalRecord["displayEffect"] | null;
      commit_id: string | null;
      commit_head: string | null;
      commit_state: string | null;
      committed_at: Date | null;
      dialogue_record: ActionDialogueRecord | null;
      generated_by: {
        profileId?: unknown;
        profileVersion?: unknown;
        fallbackFrom?: unknown;
      } | null;
    }>(
      `select a.id, a.continuity_id, a.branch_id, a.correlation_id, a.expected_head_commit_id, a.operation_type, a.status, a.intent,
              a.participation_expectation, a.acknowledged_at, a.terminal_at, a.status_reason, a.operation_payload,
              p.id as proposal_id, p.proposal_digest, p.impact_level as proposal_impact, p.expected_head_commit_id as proposal_head,
              p.expires_at as proposal_expires,
               p.candidate_transition->>'narrative' as proposal_narrative,
               p.candidate_transition->'responseSource' as proposal_response_source,
               p.display_effect,
              c.id as commit_id, c.id as commit_head, sr.id as commit_state, c.created_at as committed_at,
              to_jsonb(a)->'dialogue_record' as dialogue_record,
              (select e.payload->'generatedBy' from simulora.action_progress_events e
                where e.action_id = a.id and e.event_type = 'generation.draft'
                  and e.payload ? 'generatedBy'
                order by e.sequence desc limit 1) as generated_by
       from simulora.actions a
       left join simulora.action_proposals p on p.action_id = a.id
         and p.status in ('ACTIVE', 'CONFIRMED')
       left join simulora.world_commits c on c.action_id = a.id
       left join simulora.state_revisions sr on sr.commit_id = c.id
       where a.id = $1 and a.actor_account_id = $2`,
      [actionId, account.accountId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundError("Action not found");
    return {
      id: row.id,
      continuityId: row.continuity_id,
      branchId: row.branch_id,
      correlationId: row.correlation_id,
      expectedHeadCommitId: row.expected_head_commit_id,
      operationType: row.operation_type,
      status: row.status,
      intent: row.intent,
      ...(row.operation_payload.targetCharacterId
        ? { targetCharacterId: row.operation_payload.targetCharacterId }
        : {}),
      participationExpectation: row.participation_expectation,
      acknowledgedAt: row.acknowledged_at.toISOString(),
      terminalAt: row.terminal_at?.toISOString() ?? null,
      recoverableWait:
        row.status === "FAILED_RECOVERABLE" ||
        (["ACKNOWLEDGED", "GENERATING", "VALIDATING"].includes(row.status) &&
          this.now() - row.acknowledged_at.getTime() > 10_000),
      statusReason: row.status_reason,
      progressUrl: `/v1/actions/${row.id}/progress`,
      eventsUrl: `/v1/actions/${row.id}/events`,
      proposal:
        row.proposal_id &&
        row.proposal_digest &&
        row.proposal_head &&
        row.proposal_expires &&
        row.proposal_narrative &&
        row.display_effect
          ? {
              impact: (row.proposal_impact as "L0" | "L2" | "L3") ?? "L3",
              id: row.proposal_id,
              digest: row.proposal_digest,
              expectedHeadCommitId: row.proposal_head,
              expiresAt: row.proposal_expires.toISOString(),
              narrative: row.proposal_narrative,
              responseSource: row.proposal_response_source,
              displayEffect: row.display_effect,
            }
          : null,
      commit:
        row.commit_id && row.commit_state && row.committed_at
          ? {
              id: row.commit_id,
              resultingHeadCommitId: row.commit_head!,
              stateRevisionId: row.commit_state,
              committedAt: row.committed_at.toISOString(),
            }
          : null,
      dialogue: parseActionDialogue(row.dialogue_record),
      generation:
        typeof row.generated_by?.profileId === "string" &&
        typeof row.generated_by.profileVersion === "string"
          ? {
              profileId: row.generated_by.profileId,
              profileVersion: row.generated_by.profileVersion,
              fallbackFrom:
                typeof row.generated_by.fallbackFrom === "string"
                  ? row.generated_by.fallbackFrom
                  : null,
            }
          : null,
    };
  }

  private async appendProgressWithClient(
    client: PoolClient,
    actionId: string,
    type: ActionProgressRecord["type"],
    payload: Record<string, unknown>,
  ): Promise<void> {
    const event = await client.query<{ sequence: number }>(
      `insert into simulora.action_progress_events (id, action_id, sequence, event_type, payload)
       values ($1, $2, (select coalesce(max(sequence), 0) + 1 from simulora.action_progress_events where action_id = $2), $3, $4::jsonb)
       returning sequence`,
      [randomUUID(), actionId, type, JSON.stringify(payload)],
    );
    const sequence = event.rows[0]!.sequence;
    await client.query(
      `insert into simulora.transactional_outbox (id, topic, source_id, dedupe_key, payload)
       values ($1, $2, $3, $4, $5::jsonb)`,
      [
        randomUUID(),
        type,
        actionId,
        `action:${actionId}:progress:${sequence}`,
        JSON.stringify({ actionId, sequence, ...payload }),
      ],
    );
  }

  private async markActionConflictWithClient(
    client: PoolClient,
    actionId: string,
    reason: string,
  ): Promise<void> {
    await client.query(
      `update simulora.actions set status = 'CONFLICT', terminal_at = null, status_reason = $2, updated_at = now(), row_version = row_version + 1 where id = $1 and status not in ('COMMITTED', 'COMPLETED_NO_EFFECT', 'CANCELLED', 'SUPERSEDED')`,
      [actionId, reason],
    );
    await client.query(
      `update simulora.action_proposals set status = 'REJECTED'
        where action_id = $1 and status = 'ACTIVE'
          and exists (select 1 from simulora.actions where id = $1 and status = 'CONFLICT')`,
      [actionId],
    );
    await this.appendProgressWithClient(client, actionId, "action.failed", {
      status: "CONFLICT",
      reason,
    });
  }

  async readMe(account: SyntheticAccount): Promise<GovernanceMeResponse> {
    await this.ensureAccount(account);
    const eligible = account.eligibility === "adult";
    return {
      accountId: account.accountId,
      eligibility: account.eligibility,
      policyVersion: "IP-8-ADULT-ONLY-V1",
      capabilities: { canCreateWorld: eligible, canParticipate: eligible, canAppeal: true },
      reasonCode:
        account.eligibility === "adult"
          ? "ELIGIBLE_ADULT"
          : account.eligibility === "ineligible"
            ? "INELIGIBLE"
            : "UNKNOWN",
    };
  }

  async listConsents(
    account: SyntheticAccount,
  ): Promise<{ policyVersion: string; consents: GovernanceConsentRecord[] }> {
    await this.ensureAccount(account);
    const result = await this.pool.query<{
      consent_type: GovernanceConsentRecord["consentType"];
      version: string;
      scope: GovernanceConsentRecord["scope"];
      decision: GovernanceConsentRecord["decision"];
      updated_at: Date;
    }>(
      `select consent_type, version, scope, decision, updated_at
       from simulora.account_consents where account_id = $1 order by updated_at desc`,
      [account.accountId],
    );
    return {
      policyVersion: "IP-8-ADULT-ONLY-V1",
      consents: result.rows.map((row) => ({
        consentType: row.consent_type,
        version: row.version,
        scope: row.scope,
        decision: row.decision,
        withdrawalAvailable: row.decision === "GRANTED",
        updatedAt: row.updated_at.toISOString(),
      })),
    };
  }

  async setConsent(
    account: SyntheticAccount,
    request: GovernanceConsentInput,
  ): Promise<GovernanceConsentRecord> {
    const requestDigest = contentHash({
      schemaVersion: request.schemaVersion,
      consentType: request.consentType,
      version: request.version,
      scope: request.scope,
      decision: request.decision,
    });
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const existingOperation = await client.query<{
        request_digest: string;
        result: GovernanceConsentRecord;
      }>(
        `select request_digest, result
         from simulora.consent_operations
         where account_id = $1 and idempotency_key = $2
         for update`,
        [account.accountId, request.idempotencyKey],
      );
      if (existingOperation.rows[0]) {
        if (existingOperation.rows[0].request_digest !== requestDigest) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return existingOperation.rows[0].result;
      }
      const operationId = randomUUID();
      const insertedOperation = await client.query<{ id: string }>(
        `insert into simulora.consent_operations
         (id, account_id, idempotency_key, request_digest, result)
         values ($1, $2, $3, $4, '{}'::jsonb)
         on conflict (account_id, idempotency_key) do nothing
         returning id`,
        [operationId, account.accountId, request.idempotencyKey, requestDigest],
      );
      if (!insertedOperation.rows[0]) {
        const raced = await client.query<{
          request_digest: string;
          result: GovernanceConsentRecord;
        }>(
          `select request_digest, result
           from simulora.consent_operations
           where account_id = $1 and idempotency_key = $2
           for update`,
          [account.accountId, request.idempotencyKey],
        );
        if (!raced.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        if (raced.rows[0].request_digest !== requestDigest) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return raced.rows[0].result;
      }
      const current = await client.query<{
        id: string;
        decision: GovernanceConsentRecord["decision"];
      }>(
        `select id, decision from simulora.account_consents
         where account_id = $1 and consent_type = $2 and version = $3 and scope = $4 for update`,
        [account.accountId, request.consentType, request.version, request.scope],
      );
      const result = await client.query<{
        consent_type: GovernanceConsentRecord["consentType"];
        version: string;
        scope: GovernanceConsentRecord["scope"];
        decision: GovernanceConsentRecord["decision"];
        updated_at: Date;
      }>(
        current.rows[0]
          ? `update simulora.account_consents
             set decision = $1, updated_at = case when decision = $1 then updated_at else now() end
             where id = $2 returning consent_type, version, scope, decision, updated_at`
          : `insert into simulora.account_consents
             (id, account_id, consent_type, version, scope, decision)
             values ($1, $2, $3, $4, $5, $6)
             returning consent_type, version, scope, decision, updated_at`,
        current.rows[0]
          ? [request.decision, current.rows[0].id]
          : [
              randomUUID(),
              account.accountId,
              request.consentType,
              request.version,
              request.scope,
              request.decision,
            ],
      );
      if (current.rows[0]?.decision !== request.decision) {
        await client.query(
          `insert into simulora.governance_audit_events
           (id, actor_account_id, event_type, resource_type, resource_id, purpose, outcome, metadata)
           values ($1, $2, 'CONSENT_CHANGED', 'ACCOUNT', $2, 'consent decision', $3, $4::jsonb)`,
          [
            randomUUID(),
            account.accountId,
            request.decision,
            JSON.stringify({
              consentType: request.consentType,
              version: request.version,
              scope: request.scope,
              previousDecision: current.rows[0]?.decision ?? null,
              idempotencyKey: request.idempotencyKey,
            }),
          ],
        );
      }
      const row = result.rows[0]!;
      const response = {
        consentType: row.consent_type,
        version: row.version,
        scope: row.scope,
        decision: row.decision,
        withdrawalAvailable: row.decision === "GRANTED",
        updatedAt: row.updated_at.toISOString(),
      };
      await client.query(
        `update simulora.consent_operations set result = $2::jsonb where id = $1`,
        [operationId, JSON.stringify(response)],
      );
      return response;
    });
  }

  async readAccess(
    account: SyntheticAccount,
    resourceType: "world" | "continuity",
    resourceId: string,
  ): Promise<GovernanceAccessResponse> {
    if (resourceType === "world") {
      const result = await this.pool.query<{
        owner_account_id: string;
        deleted_at: Date | null;
        role: "PARTICIPANT" | "VIEWER" | null;
      }>(
        `select w.owner_account_id, w.deleted_at, g.role
         from simulora.worlds w
         left join simulora.world_access_grants g
           on g.world_id = w.id and g.account_id = $2 and g.status = 'ACTIVE'
         where w.id = $1`,
        [resourceId, account.accountId],
      );
      const row = result.rows[0];
      if (!row) return this.noAccess(resourceType, resourceId, "NOT_FOUND");
      if (row.deleted_at && row.owner_account_id !== account.accountId && !row.role) {
        return this.noAccess(resourceType, resourceId, "NOT_FOUND");
      }
      if (row.deleted_at) {
        return {
          resourceType,
          resourceId,
          accessLevel: row.owner_account_id === account.accountId ? "OWNER" : (row.role ?? "NONE"),
          visibility: "TOMBSTONED",
          canRead: false,
          canModify: false,
          canStart: false,
          reasonCode: "TOMBSTONED",
          explanation:
            "This World is closed to new reads and mutations while its deletion is retained for recovery and audit.",
          recovery: { label: "Review deletion status", href: "/v1/deletions" },
        };
      }
      if (row.owner_account_id === account.accountId) {
        return {
          resourceType,
          resourceId,
          accessLevel: "OWNER",
          visibility: "OWNER_ONLY",
          canRead: true,
          canModify: account.eligibility === "adult",
          canStart: account.eligibility === "adult",
          reasonCode: account.eligibility === "adult" ? "OWNER" : "ELIGIBILITY_REQUIRED",
          explanation:
            account.eligibility === "adult"
              ? "You own this World."
              : "An eligible adult account is required to modify or start this World.",
          recovery: null,
        };
      }
      if (row.role) {
        return {
          resourceType,
          resourceId,
          accessLevel: row.role,
          visibility: "EXPLICIT_GRANT",
          canRead: true,
          canModify: row.role === "PARTICIPANT" && account.eligibility === "adult",
          canStart: row.role === "PARTICIPANT" && account.eligibility === "adult",
          reasonCode: account.eligibility === "adult" ? "ACTIVE_GRANT" : "ELIGIBILITY_REQUIRED",
          explanation: `You have an explicit ${row.role.toLowerCase()} grant. Private Continuity data remains owner-only.`,
          recovery: null,
        };
      }
      // Unowned opaque IDs must not reveal whether a resource exists.
      return this.noAccess(resourceType, resourceId, "NOT_FOUND");
    }

    const result = await this.pool.query<{
      owner_account_id: string;
      deleted_at: Date | null;
    }>(
      `select c.owner_account_id, w.deleted_at
       from simulora.continuities c
       join simulora.world_revisions r on r.id = c.world_revision_id
       join simulora.worlds w on w.id = r.world_id
       where c.id = $1`,
      [resourceId],
    );
    const row = result.rows[0];
    if (!row || row.owner_account_id !== account.accountId) {
      // A private Continuity is indistinguishable from an unknown ID to other accounts.
      return this.noAccess(resourceType, resourceId, "NOT_FOUND");
    }
    if (row.deleted_at) {
      return {
        resourceType,
        resourceId,
        accessLevel: "OWNER",
        visibility: "TOMBSTONED",
        canRead: false,
        canModify: false,
        canStart: false,
        reasonCode: "TOMBSTONED",
        explanation: "This private Continuity is unavailable because its World is tombstoned.",
        recovery: { label: "Review deletion status", href: "/v1/deletions" },
      };
    }
    return {
      resourceType,
      resourceId,
      accessLevel: "OWNER",
      visibility: "CONTINUITY_PRIVATE",
      canRead: true,
      canModify: account.eligibility === "adult",
      canStart: false,
      reasonCode: account.eligibility === "adult" ? "OWNER" : "ELIGIBILITY_REQUIRED",
      explanation:
        "This Continuity is private to its owner; a World grant does not grant Continuity access.",
      recovery: null,
    };
  }

  async listProductChanges(): Promise<{ changes: GovernanceProductChange[] }> {
    const result = await this.pool.query<{
      id: string;
      version: string;
      category: GovernanceProductChange["category"];
      summary: string;
      effect: string;
      recovery: string;
      affected_scopes: unknown;
      effective_at: Date;
      available_choices: unknown;
      published_at: Date;
    }>(
      `select id, version, category, summary, effect, recovery, affected_scopes,
              effective_at, available_choices, published_at
       from simulora.product_changes order by published_at desc`,
    );
    return {
      changes: result.rows.map((row) => ({
        id: row.id,
        version: row.version,
        category: row.category,
        summary: row.summary,
        effect: row.effect,
        recovery: row.recovery,
        affectedScopes: Array.isArray(row.affected_scopes)
          ? row.affected_scopes.filter((value): value is string => typeof value === "string")
          : [],
        effectiveAt: row.effective_at.toISOString(),
        availableChoices: Array.isArray(row.available_choices)
          ? row.available_choices.filter((value): value is string => typeof value === "string")
          : [],
        publishedAt: row.published_at.toISOString(),
      })),
    };
  }

  async openAppeal(
    account: SyntheticAccount,
    request: GovernanceAppealRequest,
  ): Promise<GovernanceAppealResponse> {
    const digest = contentHash({
      schemaVersion: request.schemaVersion,
      reasonCode: request.reasonCode,
      subjectType: request.subjectType,
      subjectId: request.subjectId ?? null,
      summary: request.summary,
    });
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const existing = await client.query<{ id: string; request_digest: string }>(
        `select id, request_digest from simulora.appeals
         where account_id = $1 and idempotency_key = $2`,
        [account.accountId, request.idempotencyKey],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].request_digest !== digest) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        const row = await client.query<{
          id: string;
          reason_code: GovernanceAppealRequest["reasonCode"];
          subject_type: GovernanceAppealRequest["subjectType"];
          subject_id: string | null;
          status: GovernanceAppealResponse["status"];
          recovery_state: GovernanceAppealResponse["recoveryState"];
          created_at: Date;
          updated_at: Date;
        }>(
          `select id, reason_code, subject_type, subject_id, status, recovery_state, created_at, updated_at
           from simulora.appeals where id = $1`,
          [existing.rows[0].id],
        );
        return this.mapAppeal(row.rows[0]!);
      }
      const id = randomUUID();
      const result = await client.query<{
        id: string;
        reason_code: GovernanceAppealRequest["reasonCode"];
        subject_type: GovernanceAppealRequest["subjectType"];
        subject_id: string | null;
        status: GovernanceAppealResponse["status"];
        recovery_state: GovernanceAppealResponse["recoveryState"];
        created_at: Date;
        updated_at: Date;
      }>(
        `insert into simulora.appeals
         (id, account_id, idempotency_key, request_digest, reason_code, subject_type,
          subject_id, summary, status, recovery_state)
         values ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', 'REVIEW_PENDING')
         on conflict (account_id, idempotency_key) do nothing
         returning id, reason_code, subject_type, subject_id, status, recovery_state, created_at, updated_at`,
        [
          id,
          account.accountId,
          request.idempotencyKey,
          digest,
          request.reasonCode,
          request.subjectType,
          request.subjectId ?? null,
          request.summary,
        ],
      );
      if (!result.rows[0]) {
        const raced = await client.query<{ id: string; request_digest: string }>(
          `select id, request_digest from simulora.appeals
           where account_id = $1 and idempotency_key = $2`,
          [account.accountId, request.idempotencyKey],
        );
        if (!raced.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        if (raced.rows[0].request_digest !== digest) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return this.readAppeal(account, raced.rows[0].id);
      }
      await client.query(
        `insert into simulora.governance_audit_events
         (id, actor_account_id, event_type, resource_type, resource_id, purpose, outcome, metadata)
         values ($1, $2, 'APPEAL_OPENED', $3, $4, 'account appeal', 'RECORDED', $5::jsonb)`,
        [
          randomUUID(),
          account.accountId,
          request.subjectType,
          request.subjectId ?? null,
          JSON.stringify({ reasonCode: request.reasonCode }),
        ],
      );
      return this.mapAppeal(result.rows[0]);
    });
  }

  async readAppeal(account: SyntheticAccount, appealId: string): Promise<GovernanceAppealResponse> {
    const result = await this.pool.query<{
      id: string;
      reason_code: GovernanceAppealRequest["reasonCode"];
      subject_type: GovernanceAppealRequest["subjectType"];
      subject_id: string | null;
      status: GovernanceAppealResponse["status"];
      recovery_state: GovernanceAppealResponse["recoveryState"];
      created_at: Date;
      updated_at: Date;
    }>(
      `select id, reason_code, subject_type, subject_id, status, recovery_state, created_at, updated_at
       from simulora.appeals where id = $1 and account_id = $2`,
      [appealId, account.accountId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundError("Appeal not found");
    return this.mapAppeal(row);
  }

  async createUsageQuote(
    account: SyntheticAccount,
    request: GovernanceUsageQuoteRequest,
  ): Promise<GovernanceUsageQuote> {
    if (request.actionProfile === "WORLD_TURN") this.assertEligible(account);
    const requestDigest = contentHash({
      schemaVersion: request.schemaVersion,
      actionProfile: request.actionProfile,
    });
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const existing = await client.query<{
        id: string;
        action_profile: GovernanceUsageQuote["actionProfile"];
        policy_version: string;
        cost_mode: GovernanceUsageQuote["costMode"];
        units: 0;
        expires_at: Date;
        request_digest: string;
      }>(
        `select id, action_profile, policy_version, cost_mode, units, expires_at, request_digest
         from simulora.usage_quotes
         where account_id = $1 and idempotency_key = $2
         for update`,
        [account.accountId, request.idempotencyKey],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].request_digest !== requestDigest) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return this.mapUsageQuote(existing.rows[0]);
      }
      const id = randomUUID();
      const expiresAt = new Date(this.now() + 5 * 60_000);
      const inserted = await client.query<{
        id: string;
        action_profile: GovernanceUsageQuote["actionProfile"];
        policy_version: string;
        cost_mode: GovernanceUsageQuote["costMode"];
        units: 0;
        expires_at: Date;
        request_digest: string;
      }>(
        `insert into simulora.usage_quotes
         (id, account_id, idempotency_key, request_digest, action_profile, policy_version,
          cost_mode, units, status, expires_at)
         values ($1, $2, $3, $4, $5, 'IP-8-ZERO-COST-TEST-V1', 'ZERO_COST_TEST', 0, 'ISSUED', $6)
         on conflict (account_id, idempotency_key) do nothing
         returning id, action_profile, policy_version, cost_mode, units, expires_at, request_digest`,
        [
          id,
          account.accountId,
          request.idempotencyKey,
          requestDigest,
          request.actionProfile,
          expiresAt,
        ],
      );
      if (inserted.rows[0]) return this.mapUsageQuote(inserted.rows[0]);
      const raced = await client.query<{
        id: string;
        action_profile: GovernanceUsageQuote["actionProfile"];
        policy_version: string;
        cost_mode: GovernanceUsageQuote["costMode"];
        units: 0;
        expires_at: Date;
        request_digest: string;
      }>(
        `select id, action_profile, policy_version, cost_mode, units, expires_at, request_digest
         from simulora.usage_quotes
         where account_id = $1 and idempotency_key = $2`,
        [account.accountId, request.idempotencyKey],
      );
      if (!raced.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
      if (raced.rows[0].request_digest !== requestDigest) {
        throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
      }
      return this.mapUsageQuote(raced.rows[0]);
    });
  }

  async reserveUsage(
    account: SyntheticAccount,
    quoteId: string,
    request: GovernanceUsageReservationRequest,
  ): Promise<GovernanceUsageReservation> {
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const existing = await client.query<{
        id: string;
        quote_id: string;
        action_key: string;
        status: GovernanceUsageReservation["status"];
        units: 0;
        created_at: Date;
      }>(
        `select id, quote_id, action_key, status, units, created_at
         from simulora.usage_reservations where account_id = $1 and action_key = $2
         for update`,
        [account.accountId, request.actionKey],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].quote_id !== quoteId) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return this.mapUsageReservation(existing.rows[0]);
      }
      const quote = await client.query<{
        action_profile: GovernanceUsageQuote["actionProfile"];
        expires_at: Date;
        status: string;
      }>(
        `select action_profile, expires_at, status
         from simulora.usage_quotes where id = $1 and account_id = $2 for update`,
        [quoteId, account.accountId],
      );
      const quoteRow = quote.rows[0];
      if (!quoteRow) throw new NotFoundError("Usage quote not found");
      if (quoteRow.action_profile === "WORLD_TURN") this.assertEligible(account);
      if (quoteRow.status !== "ISSUED" || quoteRow.expires_at.getTime() <= this.now()) {
        throw new ConflictError("USAGE_QUOTE_EXPIRED");
      }
      const result = await client.query<{
        id: string;
        quote_id: string;
        action_key: string;
        status: GovernanceUsageReservation["status"];
        units: 0;
        created_at: Date;
      }>(
        `insert into simulora.usage_reservations
         (id, quote_id, account_id, action_key, status, units)
         values ($1, $2, $3, $4, 'RESERVED', 0)
         on conflict (account_id, action_key) do nothing
         returning id, quote_id, action_key, status, units, created_at`,
        [randomUUID(), quoteId, account.accountId, request.actionKey],
      );
      if (result.rows[0]) return this.mapUsageReservation(result.rows[0]);
      const raced = await client.query<{
        id: string;
        quote_id: string;
        action_key: string;
        status: GovernanceUsageReservation["status"];
        units: 0;
        created_at: Date;
      }>(
        `select id, quote_id, action_key, status, units, created_at
         from simulora.usage_reservations where account_id = $1 and action_key = $2`,
        [account.accountId, request.actionKey],
      );
      if (!raced.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
      if (raced.rows[0].quote_id !== quoteId) throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
      return this.mapUsageReservation(raced.rows[0]);
    });
  }

  async settleUsage(
    account: SyntheticAccount,
    reservationId: string,
  ): Promise<GovernanceUsageReservation> {
    return this.transitionUsage(account, reservationId, "SETTLED", "SETTLEMENT");
  }

  async releaseUsage(
    account: SyntheticAccount,
    reservationId: string,
  ): Promise<GovernanceUsageReservation> {
    return this.transitionUsage(account, reservationId, "RELEASED", "RELEASE");
  }

  async listUsageLedger(
    account: SyntheticAccount,
  ): Promise<{ entries: GovernanceUsageLedgerEntry[] }> {
    const result = await this.pool.query<{
      id: string;
      reservation_id: string;
      entry_type: GovernanceUsageLedgerEntry["entryType"];
      units: 0;
      created_at: Date;
    }>(
      `select id, reservation_id, entry_type, units, created_at
       from simulora.usage_ledger where account_id = $1 order by created_at, id`,
      [account.accountId],
    );
    return {
      entries: result.rows.map((row) => ({
        entryId: row.id,
        reservationId: row.reservation_id,
        entryType: row.entry_type,
        units: 0,
        createdAt: row.created_at.toISOString(),
      })),
    };
  }

  async createExport(
    account: SyntheticAccount,
    request: GovernanceExportRequest,
  ): Promise<GovernanceExportResponse> {
    return transaction(this.pool, async (client) => {
      await client.query("set transaction isolation level repeatable read");
      const existing = await client.query<{
        id: string;
        world_id: string;
        reservation_id: string;
        selected_scopes: unknown;
        omitted_scopes: unknown;
      }>(
        `select id, world_id, reservation_id, selected_scopes, omitted_scopes
         from simulora.export_jobs where account_id = $1 and idempotency_key = $2`,
        [account.accountId, request.idempotencyKey],
      );
      const selectedScopes = Object.entries(request.include)
        .filter(([, selected]) => selected)
        .map(([name]) => name);
      const omittedScopes = Object.entries(request.include)
        .filter(([, selected]) => !selected)
        .map(([name]) => name);
      if (!selectedScopes.length)
        throw new ValidationError("At least one export scope is required");
      if (existing.rows[0]) {
        const sameScopes =
          JSON.stringify(existing.rows[0].selected_scopes) === JSON.stringify(selectedScopes) &&
          JSON.stringify(existing.rows[0].omitted_scopes) === JSON.stringify(omittedScopes);
        if (
          existing.rows[0].world_id !== request.worldId ||
          existing.rows[0].reservation_id !== request.reservationId ||
          !sameScopes
        ) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return this.readExportWithExecutor(client, account.accountId, existing.rows[0].id);
      }
      const reservation = await client.query<{
        action_key: string;
        status: string;
        action_profile: string;
      }>(
        `select r.action_key, r.status, q.action_profile
         from simulora.usage_reservations r
         join simulora.usage_quotes q on q.id = r.quote_id
         where r.id = $1 and r.account_id = $2
         for share of r`,
        [request.reservationId, account.accountId],
      );
      const reservationRow = reservation.rows[0];
      if (
        !reservationRow ||
        reservationRow.status !== "RESERVED" ||
        reservationRow.action_profile !== "EXPORT" ||
        reservationRow.action_key !== `export:${request.idempotencyKey}`
      ) {
        throw new ConflictError("USAGE_RESERVATION_REQUIRED");
      }
      const worldResult = await client.query<{ document: unknown; deleted_at: Date | null }>(
        `select d.document, w.deleted_at from simulora.worlds w
       join simulora.world_drafts d on d.world_id = w.id
       where w.id = $1 and w.owner_account_id = $2
       for share of w`,
        [request.worldId, account.accountId],
      );
      const worldRow = worldResult.rows[0];
      if (!worldRow) throw new NotFoundError("World not found");
      if (worldRow.deleted_at) throw new ConflictError("WORLD_TOMBSTONED");
      const world = worldDocumentSchema.parse(worldRow.document);
      const entries: Array<{ name: string; body: Uint8Array }> = [];
      if (request.include.world) {
        const revisions = await client.query<{
          id: string;
          revision_number: number;
          document: unknown;
          document_hash: string;
          created_at: Date;
        }>(
          `select id, revision_number, document, document_hash, created_at
         from simulora.world_revisions where world_id = $1 order by revision_number`,
          [request.worldId],
        );
        entries.push({
          name: "world/world.json",
          body: Buffer.from(
            JSON.stringify(
              {
                draft: world,
                revisions: revisions.rows.map((row) => ({
                  id: row.id,
                  revisionNumber: row.revision_number,
                  document: worldDocumentSchema.parse(row.document),
                  documentHash: row.document_hash,
                  createdAt: row.created_at.toISOString(),
                })),
              },
              null,
              2,
            ),
          ),
        });
      }
      if (request.include.characters) {
        for (const character of world.characters) {
          entries.push({
            name: `characters/${character.id}.json`,
            body: Buffer.from(JSON.stringify(character, null, 2)),
          });
        }
      }
      if (request.include.continuity || request.include.history) {
        const continuities = await client.query<{
          id: string;
          world_revision_id: string;
          status: string;
          created_at: Date;
          branch_id: string;
          head_commit_id: string;
          state_revision_id: string;
          state_document: unknown;
          state_hash: string;
        }>(
          `select c.id, c.world_revision_id, c.status, c.created_at,
                b.id as branch_id, b.head_commit_id, s.id as state_revision_id,
                s.document as state_document, s.document_hash as state_hash
         from simulora.continuities c
         join simulora.world_revisions r on r.id = c.world_revision_id
         join simulora.branches b on b.id = c.active_branch_id
         join simulora.state_revisions s on s.id = b.head_state_revision_id
         where r.world_id = $1 and c.owner_account_id = $2 and c.status = 'ACTIVE'
         order by c.created_at, c.id`,
          [request.worldId, account.accountId],
        );
        if (request.include.continuity) {
          for (const row of continuities.rows) {
            entries.push({
              name: `continuity/${row.id}/state.json`,
              body: Buffer.from(
                JSON.stringify(
                  {
                    continuityId: row.id,
                    worldRevisionId: row.world_revision_id,
                    branchId: row.branch_id,
                    headCommitId: row.head_commit_id,
                    stateRevisionId: row.state_revision_id,
                    stateHash: row.state_hash,
                    state: stateRevisionDocumentSchema.parse(row.state_document),
                    createdAt: row.created_at.toISOString(),
                  },
                  null,
                  2,
                ),
              ),
            });
          }
        }
        if (request.include.history) {
          const history = await client.query<{
            commit_id: string;
            kind: string;
            created_at: Date;
            event_type: string | null;
            payload: unknown;
          }>(
            `select c.id as commit_id, c.kind, c.created_at, e.event_type, e.payload
           from simulora.world_commits c
           join simulora.branches b on b.id = c.branch_id
           join simulora.continuities co on co.id = b.continuity_id
           join simulora.world_revisions r on r.id = co.world_revision_id
           left join simulora.domain_events e on e.commit_id = c.id
           where r.world_id = $1 and co.owner_account_id = $2
           order by c.created_at, c.id, e.event_type`,
            [request.worldId, account.accountId],
          );
          const lines = history.rows.map((row) =>
            JSON.stringify({
              commitId: row.commit_id,
              kind: row.kind,
              createdAt: row.created_at.toISOString(),
              eventType: row.event_type,
              payload: row.payload,
            }),
          );
          entries.push({
            name: "history/events.ndjson",
            body: Buffer.from(`${lines.join("\n")}\n`),
          });
        }
      }
      const fileChecksums = Object.fromEntries(
        entries.map((entry) => [entry.name, sha256Bytes(entry.body)]),
      );
      const manifest = {
        schemaVersion: 1,
        productVersion: "0.0.0",
        worldId: request.worldId,
        exportedAt: new Date(this.now()).toISOString(),
        selectedScopes,
        omittedScopes,
        provenance: "Owner-authorized Simulora World export",
        omittedMaterial: [
          "provider prompts and responses",
          // WD-1b: author secrets are World data and are included.
          "operational secrets such as API keys, and hidden policy configuration",
          "other accounts' private data",
          "conversation transcript (not implemented in the current export format)",
        ],
        files: fileChecksums,
      };
      entries.push({ name: "manifest.json", body: Buffer.from(JSON.stringify(manifest, null, 2)) });
      const checksumLines =
        entries.map((entry) => `${sha256Bytes(entry.body)}  ${entry.name}`).join("\n") + "\n";
      entries.push({ name: "checksums.sha256", body: Buffer.from(checksumLines) });
      const artifact = zipStore(entries);
      const exportId = randomUUID();
      const artifactKey = `exports/${account.accountId}/${exportId}.zip`;
      const checksum = sha256Bytes(artifact);
      // The artifact is built from this transaction's snapshot and staged with its
      // checksum. It becomes READY only once the object store holds it, so an
      // object-store outage delays the export visibly instead of losing it.
      const inserted = await client.query<{ id: string }>(
        `insert into simulora.export_jobs
       (id, account_id, world_id, reservation_id, idempotency_key, selected_scopes, omitted_scopes,
        status, schema_version, manifest, artifact_key, checksum, artifact_bytes, storage_state)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, 'PENDING', 1, $8::jsonb, $9, $10, $11, 'STAGED')
       on conflict (account_id, idempotency_key) do nothing
       returning id`,
        [
          exportId,
          account.accountId,
          request.worldId,
          request.reservationId,
          request.idempotencyKey,
          JSON.stringify(selectedScopes),
          JSON.stringify(omittedScopes),
          JSON.stringify(manifest),
          artifactKey,
          checksum,
          Buffer.from(artifact),
        ],
      );
      if (!inserted.rows[0]) {
        const raced = await client.query<{
          id: string;
          world_id: string;
          reservation_id: string;
          selected_scopes: unknown;
          omitted_scopes: unknown;
        }>(
          `select id, world_id, reservation_id, selected_scopes, omitted_scopes
         from simulora.export_jobs where account_id = $1 and idempotency_key = $2`,
          [account.accountId, request.idempotencyKey],
        );
        const racedRow = raced.rows[0];
        if (!racedRow) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        const sameScopes =
          JSON.stringify(racedRow.selected_scopes) === JSON.stringify(selectedScopes) &&
          JSON.stringify(racedRow.omitted_scopes) === JSON.stringify(omittedScopes);
        if (
          racedRow.world_id !== request.worldId ||
          racedRow.reservation_id !== request.reservationId ||
          !sameScopes
        ) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return this.readExportWithExecutor(client, account.accountId, racedRow.id);
      }
      return this.readExportWithExecutor(client, account.accountId, exportId);
    });
  }

  /** The staged bytes of one export, for the upload that follows its creation. */
  /**
   * Leases one staged export for an immediate upload, exactly as the worker does,
   * so a deletion waits for this upload instead of racing it. Returns null while
   * another uploader holds the lease or the export is in its retry backoff.
   */
  async claimStagedExport(
    exportId: string,
    leaseMs = exportStorageLeaseMs,
  ): Promise<ExportStorageWork | null> {
    const result = await this.pool.query<{
      id: string;
      artifact_key: string;
      checksum: string;
      artifact_bytes: Buffer;
    }>(
      `update simulora.export_jobs
       set storage_lease_until = clock_timestamp() + $2 * interval '1 millisecond'
       where id = $1 and storage_state in ('STAGED', 'LEGACY_INLINE')
         and status in ('PENDING', 'READY') and artifact_bytes is not null
         and artifact_key is not null and checksum is not null
         and (storage_available_at is null or storage_available_at <= clock_timestamp())
         and (storage_lease_until is null or storage_lease_until <= clock_timestamp())
       returning id, artifact_key, checksum, artifact_bytes`,
      [exportId, leaseMs],
    );
    const row = result.rows[0];
    return row
      ? {
          operation: "STORE",
          exportId: row.id,
          objectKey: row.artifact_key,
          checksum: row.checksum,
          bytes: new Uint8Array(row.artifact_bytes),
        }
      : null;
  }

  /**
   * Claims one unit of object-store work with a short lease. Two uploaders can
   * race safely: the bytes and key are immutable, the first finalize wins and
   * the other sees ALREADY_STORED. A delete is claimable only once any upload
   * lease has expired, so it cannot run under an upload still in flight.
   */
  async claimExportStorageWork(
    scope: { worldId?: string } = {},
    leaseMs = exportStorageLeaseMs,
  ): Promise<ExportStorageWork | null> {
    return transaction(this.pool, async (client) => {
      const result = await client.query<{
        id: string;
        storage_state: string;
        artifact_key: string | null;
        checksum: string | null;
        artifact_bytes: Buffer | null;
      }>(
        `select id, storage_state, artifact_key, checksum, artifact_bytes
         from simulora.export_jobs
         where (storage_available_at is null or storage_available_at <= clock_timestamp())
           and (storage_lease_until is null or storage_lease_until <= clock_timestamp())
           and ($1::uuid is null or world_id = $1::uuid)
           and (
             storage_state = 'DELETE_PENDING'
             or (storage_state in ('STAGED', 'LEGACY_INLINE')
                 and status in ('PENDING', 'READY') and artifact_bytes is not null
                 and artifact_key is not null and checksum is not null)
           )
         order by storage_available_at nulls first, created_at
         limit 1
         for update skip locked`,
        [scope.worldId ?? null],
      );
      const row = result.rows[0];
      if (!row) return null;
      await client.query(
        `update simulora.export_jobs
         set storage_lease_until = clock_timestamp() + $2 * interval '1 millisecond'
         where id = $1`,
        [row.id, leaseMs],
      );
      if (row.storage_state === "DELETE_PENDING") {
        // A revoked export with no key never reached the store; nothing to remove.
        if (!row.artifact_key) {
          await client.query(
            `update simulora.export_jobs
             set storage_state = 'DELETED', object_deleted_at = now() where id = $1`,
            [row.id],
          );
          return null;
        }
        return { operation: "DELETE", exportId: row.id, objectKey: row.artifact_key };
      }
      return {
        operation: "STORE",
        exportId: row.id,
        objectKey: row.artifact_key!,
        checksum: row.checksum!,
        bytes: new Uint8Array(row.artifact_bytes!),
      };
    });
  }

  async listExportObjectKeys(): Promise<string[]> {
    const result = await this.pool.query<{ artifact_key: string }>(
      `select artifact_key
       from simulora.export_jobs
       where artifact_key is not null
         and storage_state in ('LEGACY_INLINE', 'STAGED', 'STORED', 'DELETE_PENDING')`,
    );
    return result.rows.map((row) => row.artifact_key);
  }

  /**
   * Finalizes an upload. ALREADY_STORED means another uploader finalized the same
   * immutable object first, which must be left alone. REVOKED means the export
   * was revoked while this upload was in flight, so its object must be removed.
   */
  async markExportStored(exportId: string): Promise<ExportStoredOutcome> {
    return transaction(this.pool, async (client) => {
      const result = await client.query<{ reservation_id: string | null }>(
        `update simulora.export_jobs
         set status = 'READY', storage_state = 'STORED', artifact_bytes = null,
             object_stored_at = now(), completed_at = coalesce(completed_at, now()),
             storage_last_error = null, storage_available_at = null, storage_lease_until = null
         where id = $1 and storage_state in ('STAGED', 'LEGACY_INLINE')
           and status in ('PENDING', 'READY')
         returning reservation_id`,
        [exportId],
      );
      if (!result.rows[0]) {
        const current = await client.query<{ storage_state: string }>(
          `select storage_state from simulora.export_jobs where id = $1`,
          [exportId],
        );
        return current.rows[0]?.storage_state === "STORED" ? "ALREADY_STORED" : "REVOKED";
      }
      await this.closeExportReservations(
        client,
        [result.rows[0].reservation_id],
        "SETTLED",
        "SETTLEMENT",
      );
      return "STORED";
    });
  }

  // The export closes its own reservation once its outcome is known, so
  // settlement never depends on the page that asked for it staying open.
  private async closeExportReservations(
    client: PoolClient,
    reservationIds: (string | null)[],
    status: "SETTLED" | "RELEASED",
    entryType: "SETTLEMENT" | "RELEASE",
  ): Promise<void> {
    for (const reservationId of reservationIds) {
      if (!reservationId) continue;
      const closed = await client.query<{ account_id: string }>(
        `update simulora.usage_reservations set status = $2
         where id = $1 and status = 'RESERVED' returning account_id`,
        [reservationId, status],
      );
      if (!closed.rows[0]) continue;
      await client.query(
        `insert into simulora.usage_ledger (id, reservation_id, account_id, entry_type, units)
         values ($1, $2, $3, $4, 0) on conflict (reservation_id, entry_type) do nothing`,
        [randomUUID(), reservationId, closed.rows[0].account_id, entryType],
      );
    }
  }

  async recordExportStorageDelay(
    exportId: string,
    reasonCode: "OBJECT_STORE_UNAVAILABLE" | "OBJECT_INTEGRITY_FAILED",
  ): Promise<void> {
    // Bounded exponential backoff so an outage does not turn into a hot loop.
    await this.pool.query(
      `update simulora.export_jobs
       set storage_attempts = storage_attempts + 1, storage_last_error = $2,
           storage_lease_until = greatest(
             coalesce(storage_lease_until, clock_timestamp()),
             clock_timestamp() + $3 * interval '1 millisecond'
           ),
           storage_available_at = clock_timestamp()
             + least(300000, 1000 * power(2, least(storage_attempts, 8)))
               * interval '1 millisecond'
       where id = $1 and storage_state in ('STAGED', 'LEGACY_INLINE', 'DELETE_PENDING')`,
      [exportId, reasonCode, exportStorageLeaseMs],
    );
  }

  async markExportObjectDeleted(exportId: string): Promise<void> {
    await this.pool.query(
      `update simulora.export_jobs
       set storage_state = 'DELETED', object_deleted_at = now(),
           storage_last_error = null, storage_available_at = null, storage_lease_until = null
       where id = $1 and storage_state = 'DELETE_PENDING'`,
      [exportId],
    );
  }

  async readExport(account: SyntheticAccount, exportId: string): Promise<GovernanceExportResponse> {
    return this.readExportWithExecutor(this.pool, account.accountId, exportId);
  }

  // Export creation returns its own uncommitted row, so the read must run on the
  // same transaction client; a pooled connection cannot see it yet.
  private async readExportWithExecutor(
    executor: Pool | PoolClient,
    accountId: string,
    exportId: string,
  ): Promise<GovernanceExportResponse> {
    const result = await executor.query<{
      id: string;
      status: GovernanceExportResponse["status"];
      world_id: string;
      selected_scopes: unknown;
      omitted_scopes: unknown;
      checksum: string | null;
      artifact_key: string | null;
      manifest: Record<string, unknown> | null;
      created_at: Date;
      completed_at: Date | null;
      storage_state: string;
      storage_last_error: string | null;
    }>(
      `select id, status, world_id, selected_scopes, omitted_scopes, checksum, artifact_key,
              manifest, created_at, completed_at, storage_state, storage_last_error
       from simulora.export_jobs where id = $1 and account_id = $2`,
      [exportId, accountId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundError("Export not found");
    return {
      exportId: row.id,
      status: row.status,
      schemaVersion: 1,
      worldId: row.world_id,
      selectedScopes: Array.isArray(row.selected_scopes)
        ? row.selected_scopes.filter((value): value is string => typeof value === "string")
        : [],
      omittedScopes: Array.isArray(row.omitted_scopes)
        ? row.omitted_scopes.filter((value): value is string => typeof value === "string")
        : [],
      checksum: row.checksum,
      artifactKey: row.artifact_key,
      manifest: row.manifest,
      createdAt: row.created_at.toISOString(),
      completedAt: row.completed_at?.toISOString() ?? null,
      delay:
        row.status === "PENDING" && row.storage_state === "STAGED" && row.storage_last_error
          ? row.storage_last_error === "OBJECT_INTEGRITY_FAILED"
            ? {
                reasonCode: "OBJECT_INTEGRITY_FAILED",
                message:
                  "The export is built and checksummed, but the stored copy did not match its checksum, so it is not offered. Storage is retried automatically; the World is unaffected.",
              }
            : {
                reasonCode: "OBJECT_STORE_UNAVAILABLE",
                message:
                  "The export is built and checksummed but storage is delayed. It becomes downloadable automatically; the World is unaffected.",
              }
          : null,
    };
  }

  /**
   * Resolves a READY export to its stored object. With `accountId` the caller must
   * own it; without, the caller is a signed-link download that verifies ownership
   * against the returned `accountId` itself.
   */
  async readExportArtifactLocation(
    exportId: string,
    accountId?: string,
  ): Promise<ExportArtifactLocation> {
    const result = await this.pool.query<{
      id: string;
      account_id: string;
      status: GovernanceExportResponse["status"];
      storage_state: string;
      checksum: string | null;
      artifact_key: string | null;
      artifact_bytes: Buffer | null;
    }>(
      `select id, account_id, status, storage_state, checksum, artifact_key, artifact_bytes
       from simulora.export_jobs
       where id = $1 and ($2::uuid is null or account_id = $2::uuid)`,
      [exportId, accountId ?? null],
    );
    const row = result.rows[0];
    if (!row || row.status !== "READY" || !row.checksum || !row.artifact_key) {
      throw new NotFoundError("Export artifact not found");
    }
    if (row.storage_state === "STORED") {
      return {
        exportId: row.id,
        accountId: row.account_id,
        objectKey: row.artifact_key,
        checksum: row.checksum,
        inlineBytes: null,
      };
    }
    if (row.storage_state === "LEGACY_INLINE" && row.artifact_bytes) {
      return {
        exportId: row.id,
        accountId: row.account_id,
        objectKey: row.artifact_key,
        checksum: row.checksum,
        inlineBytes: new Uint8Array(row.artifact_bytes),
      };
    }
    throw new NotFoundError("Export artifact not found");
  }

  async proposeDeletion(
    account: SyntheticAccount,
    request: GovernanceDeletionProposalRequest,
  ): Promise<GovernanceDeletionProposal> {
    const requestDigest = contentHash({
      schemaVersion: request.schemaVersion,
      targetType: request.targetType,
      targetId: request.targetId,
    });
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const existing = await client.query<{
        id: string;
        request_digest: string;
        target_type: GovernanceDeletionProposal["targetType"];
        target_id: string;
        digest: string;
        affected: GovernanceDeletionProposal["affected"];
        status: GovernanceDeletionProposal["status"];
        expires_at: Date;
      }>(
        `select id, request_digest, target_type, target_id, digest, affected, status, expires_at
         from simulora.deletion_proposals
         where account_id = $1 and idempotency_key = $2
         for update`,
        [account.accountId, request.idempotencyKey],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].request_digest !== requestDigest) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return this.mapDeletionProposal(existing.rows[0]);
      }
      const affected = {
        continuities: 0,
        grants: 0,
        exports: 0,
        auditCategories: ["DELETION", "ACCESS", "RECOVERY"],
      };
      if (request.targetType === "WORLD") {
        const world = await client.query<{ id: string }>(
          `select id from simulora.worlds
           where id = $1 and owner_account_id = $2 and deleted_at is null
           for share`,
          [request.targetId, account.accountId],
        );
        if (!world.rows[0]) throw new NotFoundError("World not found");
        const counts = await client.query<{
          continuities: string;
          grants: string;
          exports: string;
        }>(
          `select
             (select count(*) from simulora.continuities c join simulora.world_revisions r on r.id = c.world_revision_id where r.world_id = $1 and c.status = 'ACTIVE') as continuities,
             (select count(*) from simulora.world_access_grants where world_id = $1 and status = 'ACTIVE') as grants,
             (select count(*) from simulora.export_jobs where world_id = $1 and status in ('PENDING', 'READY')) as exports`,
          [request.targetId],
        );
        affected.continuities = Number(counts.rows[0]?.continuities ?? 0);
        affected.grants = Number(counts.rows[0]?.grants ?? 0);
        affected.exports = Number(counts.rows[0]?.exports ?? 0);
      } else {
        const asset = await client.query<{ id: string }>(
          `select id from simulora.character_assets where id = $1 and owner_account_id = $2 and status = 'ACTIVE'`,
          [request.targetId, account.accountId],
        );
        if (!asset.rows[0]) throw new NotFoundError("Character Asset not found");
        affected.auditCategories = ["DELETION", "REVISION_SNAPSHOT"];
      }
      const proposalId = randomUUID();
      const digest = sha256Bytes(
        Buffer.from(
          JSON.stringify({ targetType: request.targetType, targetId: request.targetId, affected }),
        ),
      );
      const expiresAt = new Date(this.now() + 10 * 60_000);
      const inserted = await client.query<{
        id: string;
        request_digest: string;
        target_type: GovernanceDeletionProposal["targetType"];
        target_id: string;
        digest: string;
        affected: GovernanceDeletionProposal["affected"];
        status: GovernanceDeletionProposal["status"];
        expires_at: Date;
      }>(
        `insert into simulora.deletion_proposals
         (id, account_id, idempotency_key, request_digest, target_type, target_id, digest,
          affected, status, expires_at, purge_status)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'ACTIVE', $9, 'NOT_STARTED')
         on conflict (account_id, idempotency_key) do nothing
         returning id, request_digest, target_type, target_id, digest, affected, status, expires_at`,
        [
          proposalId,
          account.accountId,
          request.idempotencyKey,
          requestDigest,
          request.targetType,
          request.targetId,
          digest,
          JSON.stringify(affected),
          expiresAt,
        ],
      );
      if (inserted.rows[0]) return this.mapDeletionProposal(inserted.rows[0]);
      const raced = await client.query<{
        id: string;
        request_digest: string;
        target_type: GovernanceDeletionProposal["targetType"];
        target_id: string;
        digest: string;
        affected: GovernanceDeletionProposal["affected"];
        status: GovernanceDeletionProposal["status"];
        expires_at: Date;
      }>(
        `select id, request_digest, target_type, target_id, digest, affected, status, expires_at
         from simulora.deletion_proposals
         where account_id = $1 and idempotency_key = $2`,
        [account.accountId, request.idempotencyKey],
      );
      if (!raced.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
      if (raced.rows[0].request_digest !== requestDigest) {
        throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
      }
      return this.mapDeletionProposal(raced.rows[0]);
    });
  }

  async confirmDeletion(
    account: SyntheticAccount,
    request: GovernanceDeletionConfirmRequest,
  ): Promise<GovernanceDeletionStatus> {
    return transaction(this.pool, async (client) => {
      const result = await client.query<{
        id: string;
        target_type: GovernanceDeletionProposal["targetType"];
        target_id: string;
        digest: string;
        affected: GovernanceDeletionProposal["affected"];
        status: GovernanceDeletionProposal["status"];
        expires_at: Date;
        tombstoned_at: Date | null;
        confirmation_idempotency_key: string | null;
        purge_status: GovernanceDeletionStatus["purgeStatus"];
        updated_at: Date;
      }>(
        `select id, target_type, target_id, digest, affected, status, expires_at, tombstoned_at,
                confirmation_idempotency_key, purge_status, updated_at
         from simulora.deletion_proposals where id = $1 and account_id = $2 for update`,
        [request.proposalId, account.accountId],
      );
      const proposal = result.rows[0];
      if (!proposal) throw new NotFoundError("Deletion proposal not found");
      if (proposal.digest !== request.digest) throw new ConflictError("DELETION_DIGEST_MISMATCH");
      if (proposal.status === "COMPLETED") {
        if (proposal.confirmation_idempotency_key !== request.idempotencyKey) {
          throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
        }
        return this.mapDeletionStatus(proposal);
      }
      const reused = await client.query<{ id: string }>(
        `select id from simulora.deletion_proposals
         where account_id = $1 and confirmation_idempotency_key = $2 and id <> $3`,
        [account.accountId, request.idempotencyKey, proposal.id],
      );
      if (reused.rows[0]) throw new ConflictError("IDEMPOTENCY_KEY_REUSED");
      if (proposal.expires_at.getTime() <= this.now()) {
        await client.query(
          `update simulora.deletion_proposals set status = 'EXPIRED', updated_at = now() where id = $1`,
          [proposal.id],
        );
        throw new ConflictError("DELETION_PROPOSAL_EXPIRED");
      }
      if (proposal.target_type === "WORLD") {
        const world = await client.query<{ id: string }>(
          `select id from simulora.worlds
           where id = $1 and owner_account_id = $2 and deleted_at is null for update`,
          [proposal.target_id, account.accountId],
        );
        if (!world.rows[0]) throw new ConflictError("WORLD_TOMBSTONED");
        const counts = await client.query<{
          continuities: string;
          grants: string;
          exports: string;
        }>(
          `select
             (select count(*) from simulora.continuities c join simulora.world_revisions r on r.id = c.world_revision_id where r.world_id = $1 and c.status = 'ACTIVE') as continuities,
             (select count(*) from simulora.world_access_grants where world_id = $1 and status = 'ACTIVE') as grants,
             (select count(*) from simulora.export_jobs where world_id = $1 and status in ('PENDING', 'READY')) as exports`,
          [proposal.target_id],
        );
        const currentAffected = {
          continuities: Number(counts.rows[0]?.continuities ?? 0),
          grants: Number(counts.rows[0]?.grants ?? 0),
          exports: Number(counts.rows[0]?.exports ?? 0),
          auditCategories: ["DELETION", "ACCESS", "RECOVERY"],
        };
        if (contentHash(currentAffected) !== contentHash(proposal.affected)) {
          throw new ConflictError("DELETION_SCOPE_CHANGED");
        }
        await client.query(
          `update simulora.worlds set deleted_at = coalesce(deleted_at, now()) where id = $1`,
          [proposal.target_id],
        );
        await client.query(
          `update simulora.world_access_grants set status = 'REVOKED', revoked_at = now() where world_id = $1 and status = 'ACTIVE'`,
          [proposal.target_id],
        );
        // Revocation clears staged bytes at once and queues the stored object for
        // removal, so deletion propagates to object artifacts and not just status.
        const revoked = await client.query<{
          prior_status: "PENDING" | "READY";
          reservation_id: string | null;
        }>(
          `with target as (
             select id, status from simulora.export_jobs
             where world_id = $1 and status in ('PENDING', 'READY') for update
           )
           update simulora.export_jobs job
           set status = 'REVOKED', storage_state = 'DELETE_PENDING', artifact_bytes = null,
               -- The backoff is cleared; a running upload lease is kept, so the
               -- delete waits for that upload rather than racing it.
               storage_available_at = null
           from target where job.id = target.id
           returning target.status as prior_status, job.reservation_id`,
          [proposal.target_id],
        );
        // An export revoked before it was ever stored delivered nothing. One that
        // was READY was delivered; a legacy row whose page never settled it is
        // settled here, so no reservation outlives its export.
        await this.closeExportReservations(
          client,
          revoked.rows
            .filter((row) => row.prior_status === "PENDING")
            .map((row) => row.reservation_id),
          "RELEASED",
          "RELEASE",
        );
        await this.closeExportReservations(
          client,
          revoked.rows
            .filter((row) => row.prior_status === "READY")
            .map((row) => row.reservation_id),
          "SETTLED",
          "SETTLEMENT",
        );
        await client.query(
          `update simulora.continuities set status = 'TOMBSTONED'
           where world_revision_id in (select id from simulora.world_revisions where world_id = $1)`,
          [proposal.target_id],
        );
      } else {
        const asset = await client.query<{ id: string }>(
          `select id from simulora.character_assets
           where id = $1 and owner_account_id = $2 and status = 'ACTIVE' for update`,
          [proposal.target_id, account.accountId],
        );
        if (!asset.rows[0]) throw new ConflictError("DELETION_SCOPE_CHANGED");
        await client.query(
          `update simulora.character_assets set status = 'DELETED', updated_at = now() where id = $1`,
          [proposal.target_id],
        );
      }
      await client.query(
        `insert into simulora.governance_audit_events
         (id, actor_account_id, event_type, resource_type, resource_id, purpose, outcome, metadata)
         values ($1, $2, 'DELETION_CONFIRMED', $3, $4, 'user deletion', 'COMPLETED', $5::jsonb)`,
        [
          randomUUID(),
          account.accountId,
          proposal.target_type,
          proposal.target_id,
          JSON.stringify({ idempotencyKey: request.idempotencyKey }),
        ],
      );
      const updated = await client.query<{
        tombstoned_at: Date;
        purge_status: GovernanceDeletionStatus["purgeStatus"];
        updated_at: Date;
      }>(
        `update simulora.deletion_proposals
         set status = 'COMPLETED', tombstoned_at = now(), confirmation_idempotency_key = $2,
             purge_status = 'RETAINING_MINIMAL_AUDIT', updated_at = now()
         where id = $1 returning tombstoned_at, purge_status, updated_at`,
        [proposal.id, request.idempotencyKey],
      );
      return {
        proposalId: proposal.id,
        targetType: proposal.target_type,
        targetId: proposal.target_id,
        status: "COMPLETED",
        tombstonedAt: updated.rows[0]!.tombstoned_at.toISOString(),
        purgeStatus: updated.rows[0]!.purge_status,
        updatedAt: updated.rows[0]!.updated_at.toISOString(),
      };
    });
  }

  async readDeletion(
    account: SyntheticAccount,
    proposalId: string,
  ): Promise<GovernanceDeletionStatus> {
    const result = await this.pool.query<{
      id: string;
      target_type: GovernanceDeletionStatus["targetType"];
      target_id: string;
      status: GovernanceDeletionStatus["status"];
      tombstoned_at: Date | null;
      purge_status: GovernanceDeletionStatus["purgeStatus"];
      updated_at: Date;
    }>(
      `select id, target_type, target_id, status, tombstoned_at, purge_status, updated_at
       from simulora.deletion_proposals where id = $1 and account_id = $2`,
      [proposalId, account.accountId],
    );
    const row = result.rows[0];
    if (!row) throw new NotFoundError("Deletion proposal not found");
    return {
      proposalId: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
      status: row.status,
      tombstonedAt: row.tombstoned_at?.toISOString() ?? null,
      purgeStatus: row.purge_status,
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private noAccess(
    resourceType: "world" | "continuity",
    resourceId: string,
    reasonCode: GovernanceAccessResponse["reasonCode"],
  ): GovernanceAccessResponse {
    return {
      resourceType,
      resourceId,
      accessLevel: "NONE",
      visibility: reasonCode === "NOT_FOUND" ? "UNKNOWN" : "OWNER_ONLY",
      canRead: false,
      canModify: false,
      canStart: false,
      reasonCode,
      explanation: "This resource is unavailable to the current account.",
      recovery:
        reasonCode === "NO_ACCESS"
          ? { label: "Request access from the owner", href: "/v1/appeals" }
          : null,
    };
  }

  private mapAppeal(row: {
    id: string;
    reason_code: GovernanceAppealRequest["reasonCode"];
    subject_type: GovernanceAppealRequest["subjectType"];
    subject_id: string | null;
    status: GovernanceAppealResponse["status"];
    recovery_state: GovernanceAppealResponse["recoveryState"];
    created_at: Date;
    updated_at: Date;
  }): GovernanceAppealResponse {
    return {
      appealId: row.id,
      status: row.status,
      recoveryState: row.recovery_state,
      reasonCode: row.reason_code,
      subjectType: row.subject_type,
      subjectId: row.subject_id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private mapUsageReservation(row: {
    id: string;
    quote_id: string;
    action_key: string;
    status: GovernanceUsageReservation["status"];
    units: 0;
    created_at: Date;
  }): GovernanceUsageReservation {
    return {
      reservationId: row.id,
      quoteId: row.quote_id,
      actionKey: row.action_key,
      status: row.status,
      units: 0,
      createdAt: row.created_at.toISOString(),
    };
  }

  private mapUsageQuote(row: {
    id: string;
    action_profile: GovernanceUsageQuote["actionProfile"];
    policy_version: string;
    cost_mode: GovernanceUsageQuote["costMode"];
    units: 0;
    expires_at: Date;
    request_digest: string;
  }): GovernanceUsageQuote {
    return {
      quoteId: row.id,
      actionProfile: row.action_profile,
      policyVersion: row.policy_version,
      costMode: row.cost_mode,
      units: 0,
      expiresAt: row.expires_at.toISOString(),
      failureBehavior: {
        retry: "Retry only with the same idempotency key after a recoverable failure.",
        cancel: "Cancellation releases the reservation without a ledger charge.",
        terminalNoCommit:
          "A failed or cancelled Action has no World Commit and no settlement entry.",
      },
      status: "ISSUED",
    };
  }

  private mapDeletionProposal(row: {
    id: string;
    target_type: GovernanceDeletionProposal["targetType"];
    target_id: string;
    digest: string;
    affected: GovernanceDeletionProposal["affected"];
    status: GovernanceDeletionProposal["status"];
    expires_at: Date;
  }): GovernanceDeletionProposal {
    return {
      proposalId: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
      digest: row.digest,
      status: row.status,
      affected: row.affected,
      expiresAt: row.expires_at.toISOString(),
      explanation:
        "Confirmation tombstones the target, revokes future mutation, and retains minimal audit metadata.",
    };
  }

  private async transitionUsage(
    account: SyntheticAccount,
    reservationId: string,
    status: "SETTLED" | "RELEASED",
    entryType: "SETTLEMENT" | "RELEASE",
  ): Promise<GovernanceUsageReservation> {
    return transaction(this.pool, async (client) => {
      const current = await client.query<{
        id: string;
        quote_id: string;
        action_key: string;
        status: GovernanceUsageReservation["status"];
        units: 0;
        created_at: Date;
      }>(
        `select id, quote_id, action_key, status, units, created_at from simulora.usage_reservations where id = $1 and account_id = $2 for update`,
        [reservationId, account.accountId],
      );
      const row = current.rows[0];
      if (!row) throw new NotFoundError("Usage reservation not found");
      if (row.status === status) return this.mapUsageReservation(row);
      if (row.status !== "RESERVED") throw new ConflictError("USAGE_RESERVATION_TERMINAL");
      await client.query(`update simulora.usage_reservations set status = $2 where id = $1`, [
        reservationId,
        status,
      ]);
      await client.query(
        `insert into simulora.usage_ledger (id, reservation_id, account_id, entry_type, units)
         values ($1, $2, $3, $4, 0) on conflict (reservation_id, entry_type) do nothing`,
        [randomUUID(), reservationId, account.accountId, entryType],
      );
      return this.mapUsageReservation({ ...row, status });
    });
  }

  private mapDeletionStatus(row: {
    id: string;
    target_type: GovernanceDeletionStatus["targetType"];
    target_id: string;
    status: GovernanceDeletionStatus["status"];
    tombstoned_at: Date | null;
    purge_status: GovernanceDeletionStatus["purgeStatus"];
    updated_at: Date;
  }): GovernanceDeletionStatus {
    return {
      proposalId: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
      status: row.status,
      tombstonedAt: row.tombstoned_at?.toISOString() ?? null,
      purgeStatus: row.purge_status,
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private assertEligible(account: SyntheticAccount): void {
    if (account.eligibility !== "adult") {
      throw new AccessDeniedError("An eligible adult account is required");
    }
  }

  // The prior-schema upgrade rehearsal drives this repository against databases
  // older than 0040, where consent records do not exist yet and nothing can have
  // been withdrawn. Probe once per repository rather than on every mutation.
  private async hasConsentRecords(): Promise<boolean> {
    this.#consentTablePresent ??= this.pool
      .query<{ present: boolean }>(
        `select to_regclass('simulora.account_consents') is not null as present`,
      )
      .then((result) => result.rows[0]?.present === true)
      .catch((error: unknown) => {
        this.#consentTablePresent = undefined;
        throw error;
      });
    return this.#consentTablePresent;
  }

  // The rule is recency, not version order: for each consent type and scope the
  // most recently recorded decision governs, so a re-grant restores authoring at
  // once. `version` is free text with no ordering contract - "V10" sorts below
  // "V2" - so it must not decide precedence; `id` only breaks exact ties.
  // A withdrawal therefore blocks even when an older version is still granted,
  // which is the conservative reading of the user's last stated decision.
  private async assertConsentActive(account: SyntheticAccount): Promise<void> {
    if (!(await this.hasConsentRecords())) return;
    const result = await this.pool.query<{ withdrawn: boolean }>(
      `select exists(
         select 1 from (
           select distinct on (consent_type, scope) decision
           from simulora.account_consents
           where account_id = $1
           order by consent_type, scope, updated_at desc, id desc
         ) latest
         where latest.decision = 'WITHDRAWN'
       ) as withdrawn`,
      [account.accountId],
    );
    if (result.rows[0]?.withdrawn) {
      throw new AccessDeniedError("Required consent is withdrawn");
    }
  }

  private async assertMutableBranchWithClient(
    client: PoolClient,
    accountId: string,
    branchId: string,
  ): Promise<string> {
    const owning = await client.query<{ continuity_id: string }>(
      `select c.id as continuity_id
       from simulora.branches b
       join simulora.continuities c on c.id = b.continuity_id and c.owner_account_id = $2
       where b.id = $1`,
      [branchId, accountId],
    );
    const continuityId = owning.rows[0]?.continuity_id;
    if (!continuityId) throw new NotFoundError("Branch not found");
    await this.assertMutableContinuityWithClient(client, accountId, continuityId);
    return continuityId;
  }

  // Deletion confirmation locks the World before its Continuities, so this guard
  // has to take the same two locks in the same order. Locking the Continuity first
  // would invert the order and let a concurrent deletion deadlock a guarded
  // mutation, which PostgreSQL resolves by aborting one side - the generic failure
  // this guard exists to prevent.
  private async assertMutableContinuityWithClient(
    client: PoolClient,
    accountId: string,
    continuityId: string,
  ): Promise<void> {
    const world = await client.query<{ deleted_at: Date | null }>(
      `select w.deleted_at
       from simulora.continuities c
       join simulora.world_revisions r on r.id = c.world_revision_id
       join simulora.worlds w on w.id = r.world_id
       where c.id = $1 and c.owner_account_id = $2
       for update of w`,
      [continuityId, accountId],
    );
    if (!world.rows[0]) throw new NotFoundError("Continuity not found");
    const continuity = await client.query<{ status: string }>(
      `select status from simulora.continuities
       where id = $1 and owner_account_id = $2 for update`,
      [continuityId, accountId],
    );
    const row = continuity.rows[0];
    if (!row) throw new NotFoundError("Continuity not found");
    if (row.status !== "ACTIVE" || world.rows[0].deleted_at) {
      throw new ConflictError("WORLD_TOMBSTONED");
    }
  }

  private async ensureAccountWithClient(
    client: PoolClient,
    account: SyntheticAccount,
  ): Promise<void> {
    await client.query(
      `insert into simulora.accounts (id, eligibility)
       values ($1, $2)
       on conflict (id) do update set eligibility = excluded.eligibility`,
      [account.accountId, databaseEligibility(account.eligibility)],
    );
  }

  private async throwWorldAccessOrConflict(accountId: string, worldId: string): Promise<never> {
    const world = await this.pool.query<{ owner_account_id: string; row_version: number }>(
      `select w.owner_account_id, d.row_version
       from simulora.worlds w join simulora.world_drafts d on d.world_id = w.id
       where w.id = $1 and w.deleted_at is null`,
      [worldId],
    );
    if (!world.rows[0] || world.rows[0].owner_account_id !== accountId) {
      throw new NotFoundError("World not found");
    }
    throw new ConflictError("World Draft version is stale");
  }
}
