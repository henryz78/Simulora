import { randomUUID } from "node:crypto";
import {
  applyValidatedActionCandidate,
  applyValidatedDirectCorrectionCandidate,
  contentHash,
  createInitialState,
  participationContractSchema,
  stateRevisionDocumentSchema,
  validateDirectCorrectionCandidate,
  validateActionCandidate,
  worldDocumentSchema,
  type ActionStatus,
  type ParticipationContract,
  type StateRevisionDocument,
  type WorldDocument,
} from "@simulora/domain";
import { Kysely, PostgresDialect, type ColumnType, type Generated } from "kysely";
import { Pool, type PoolClient, type PoolConfig } from "pg";

// The database package intentionally has no dependency on the transport
// contracts package. These structural types are the repository's internal
// read/write boundary; the API owns Zod parsing before/after this layer.
type ActionOperationType = "PARTICIPATE" | "CORRECT_CONTINUITY" | "REMOVE_CONTINUITY";
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
};

export type SubmitActionDatabaseInput = {
  schemaVersion: 1;
  idempotencyKey: string;
  expectedHeadCommitId: string;
  participationExpectation: ParticipationContract;
  intent: string;
};

export type ActionProposalRecord = {
  id: string;
  digest: string;
  expectedHeadCommitId: string;
  impact: "L3";
  expiresAt: string;
  narrative: string;
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
  participationExpectation: ParticipationContract;
  acknowledgedAt: string;
  terminalAt: string | null;
  recoverableWait: boolean;
  statusReason: string | null;
  progressUrl: string;
  eventsUrl: string;
  proposal: ActionProposalRecord | null;
  commit: ActionCommitRecord | null;
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

export type ActionGenerator = (request: {
  actionId: string;
  expectedHeadCommitId: string;
  intent: string;
  targetFact: {
    id: string;
    statement: string;
    scope: "ACCOUNT_PRIVATE" | "CONTINUITY_PRIVATE" | "SHARED";
  };
}) => Promise<{ narrative: string; candidate: unknown }>;

export class AccessDeniedError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ValidationError extends Error {}

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
 * The IP-4 deterministic adapter has no character-specific knowledge grant
 * yet. Only shared, current canonical facts may therefore enter its context;
 * owner access to a private fact is not a grant to the character/model.
 */
function isGeneratorEligibleFact(fact: StateRevisionDocument["facts"][number]): boolean {
  return fact.lifecycle === "ACTIVE" && fact.scope === "SHARED";
}

function orientationPayload(
  continuityId: string,
  branchId: string,
  worldRevisionId: string,
  state: StateRevisionDocument,
  headCommitId: string,
  stateRevisionId: string,
  updatedAt: string,
): OrientationResponse {
  return {
    continuity: { id: continuityId, branchId, worldRevisionId },
    current: {
      situation: state.openThreads[0] ?? state.worldClock.label,
      locationId: state.locations[0]?.id ?? null,
      worldClock: state.worldClock,
    },
    // The initial projection has no meaningful change; later commits add
    // trace entries when the projection is rebuilt from authoritative rows.
    recentChanges: [],
    relationships: state.relationships.map(({ id, description }) => ({ id, description })),
    openThreads: state.openThreads,
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
}

type TraceCursor = { createdAt: string; id: string };

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

function eventSummary(eventType: string): string {
  switch (eventType) {
    case "CONTINUITY_ITEM_CORRECTED":
      return "A canonical continuity fact was corrected by the participant.";
    case "CONTINUITY_ITEM_REMOVED":
      return "A canonical continuity fact was removed by the participant.";
    case "ACTION_RECORDED":
      return "A participant action was recorded on this path.";
    case "CONTINUITY_INITIALIZED":
      return "This continuity began from its pinned World Revision.";
    default:
      return "A committed change was recorded on this path.";
  }
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
    throw error;
  } finally {
    client.release();
  }
}

export class AuthoritativeWorldRepository {
  constructor(
    private readonly pool: Pool,
    private readonly actionLease = { durationMs: 30_000, heartbeatMs: 10_000 },
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

  async createWorld(
    account: SyntheticAccount,
    documentInput: WorldDocument,
  ): Promise<WorldDraftRecord> {
    this.assertEligible(account);
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

  async createRevision(
    account: SyntheticAccount,
    worldId: string,
    expectedDraftVersion: number,
  ): Promise<WorldRevisionRecord> {
    this.assertEligible(account);
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
      const parsed = worldDocumentSchema.safeParse(draft.document);
      await client.query(
        `insert into simulora.authoring_validation_runs
         (id, world_id, draft_row_version, outcome, findings)
         values ($1, $2, $3, $4, $5::jsonb)`,
        [
          validationRunId,
          worldId,
          draft.row_version,
          parsed.success ? "VALID" : "INVALID",
          JSON.stringify(parsed.success ? [] : parsed.error.issues),
        ],
      );
      if (!parsed.success) throw new ValidationError("World Draft is not playable");

      const revisionNumberResult = await client.query<{ next_revision: number }>(
        `select coalesce(max(revision_number), 0) + 1 as next_revision
         from simulora.world_revisions where world_id = $1`,
        [worldId],
      );
      const revisionNumber = revisionNumberResult.rows[0]!.next_revision;
      const revisionId = randomUUID();
      const hash = contentHash(parsed.data);
      await client.query(
        `insert into simulora.world_revisions
         (id, world_id, revision_number, source_draft_row_version, document, document_hash, validation_run_id)
         values ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
        [
          revisionId,
          worldId,
          revisionNumber,
          draft.row_version,
          JSON.stringify(parsed.data),
          hash,
          validationRunId,
        ],
      );
      return {
        revisionId,
        worldId,
        revisionNumber,
        sourceDraftRowVersion: draft.row_version,
        document: parsed.data,
        documentHash: hash,
      };
    });
  }

  async startContinuity(
    account: SyntheticAccount,
    worldRevisionId: string,
    participationInput: ParticipationContract,
  ): Promise<ContinuityStateRecord> {
    this.assertEligible(account);
    const participation = participationContractSchema.parse(participationInput);
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const revisionResult = await client.query<{
        id: string;
        revision_number: number;
        document: unknown;
      }>(
        `select r.id, r.revision_number, r.document
         from simulora.world_revisions r
         join simulora.worlds w on w.id = r.world_id
         where r.id = $1 and w.owner_account_id = $2 and w.deleted_at is null`,
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
    };
  }

  async submitAction(
    account: SyntheticAccount,
    branchId: string,
    input: SubmitActionDatabaseInput,
  ): Promise<ActionRecord> {
    this.assertEligible(account);
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const existing = await client.query<{ id: string }>(
        `select id from simulora.actions
         where actor_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
        [account.accountId, branchId, input.idempotencyKey],
      );
      if (existing.rows[0]) return this.readActionWithClient(client, account, existing.rows[0].id);

      const branch = await client.query<{
        continuity_id: string;
        head_commit_id: string;
        head_state_revision_id: string;
        state_document: unknown;
      }>(
        `select b.continuity_id, b.head_commit_id, b.head_state_revision_id, s.document as state_document
         from simulora.branches b
         join simulora.continuities c on c.id = b.continuity_id and c.owner_account_id = $2 and c.status = 'ACTIVE'
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
        state.participation.initiativeMode !== input.participationExpectation.initiativeMode ||
        state.participation.structureMode !== input.participationExpectation.structureMode
      ) {
        throw new ConflictError("PARTICIPATION_EXPECTATION_MISMATCH");
      }

      const actionId = randomUUID();
      const inserted = await client.query<{ id: string }>(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent, status)
         values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, $8, 'ACKNOWLEDGED')
         on conflict (actor_account_id, branch_id, idempotency_key) do nothing
         returning id`,
        [
          actionId,
          account.accountId,
          row.continuity_id,
          branchId,
          input.idempotencyKey,
          input.expectedHeadCommitId,
          JSON.stringify(input.participationExpectation),
          input.intent.trim(),
        ],
      );
      if (!inserted.rows[0]) {
        const duplicate = await client.query<{ id: string }>(
          `select id from simulora.actions
           where actor_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
          [account.accountId, branchId, input.idempotencyKey],
        );
        if (!duplicate.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        return this.readActionWithClient(client, account, duplicate.rows[0].id);
      }
      await client.query(
        `insert into simulora.durable_jobs (id, type, action_id, dedupe_key, status)
         values ($1, 'ACTION_PROCESS', $2, $3, 'AVAILABLE')`,
        [randomUUID(), actionId, `action:${actionId}`],
      );
      await this.appendProgressWithClient(client, actionId, "action.status", {
        status: "ACKNOWLEDGED",
        message: "Your Action was received and recorded. The world has not changed yet.",
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
    if (input.target.type !== "fact") {
      throw new ValidationError("Only canonical fact correction is supported in IP-4");
    }
    if (input.operation === "CORRECT_CONTINUITY" && !input.after) {
      throw new ValidationError("Correction requires an after statement");
    }
    if (input.operation === "REMOVE_CONTINUITY" && input.after) {
      throw new ValidationError("Removal cannot include an after statement");
    }
    return transaction(this.pool, async (client) => {
      await this.ensureAccountWithClient(client, account);
      const existing = await client.query<{ id: string }>(
        `select id from simulora.actions
         where actor_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
        [account.accountId, branchId, input.idempotencyKey],
      );
      if (existing.rows[0]) return this.readActionWithClient(client, account, existing.rows[0].id);

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
          and c.owner_account_id = $2 and c.status = 'ACTIVE'
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
      const operationPayload = {
        schemaVersion: 1,
        target: input.target,
        before: input.before,
        ...(input.after ? { after: input.after } : {}),
        reason: input.reason.trim(),
      };
      const intent = input.reason.trim();
      const inserted = await client.query<{ id: string }>(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent, operation_payload, status)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, 'AWAITING_CONFIRMATION')
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
        ],
      );
      if (!inserted.rows[0]) {
        const duplicate = await client.query<{ id: string }>(
          `select id from simulora.actions
           where actor_account_id = $1 and branch_id = $2 and idempotency_key = $3`,
          [account.accountId, branchId, input.idempotencyKey],
        );
        if (!duplicate.rows[0]) throw new ConflictError("IDEMPOTENCY_RETRY_CONFLICT");
        return this.readActionWithClient(client, account, duplicate.rows[0].id);
      }

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
      let nextState: StateRevisionDocument;
      let displayEffect: ActionProposalRecord["displayEffect"];
      let candidateNarrative: string;
      if (action.operation_type === "PARTICIPATE") {
        // The deterministic/model request contains one target only. Do not
        // let an untrusted candidate address another fact that happened to
        // exist in the full owner snapshot.
        const validated = validateActionCandidate(proposal.candidate_transition, {
          actionId,
          expectedHeadCommitId: request.expectedHeadCommitId,
          state: expectedState,
          authorizedTargetFactIds: [
            expectedState.facts.find((fact) => isGeneratorEligibleFact(fact))?.id ?? "",
          ],
        });
        nextState = applyValidatedActionCandidate(expectedState, validated);
        displayEffect = validated.displayEffect;
        candidateNarrative = validated.candidate.narrative;
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
            ? "ACTION_RECORDED"
            : action.operation_type === "CORRECT_CONTINUITY"
              ? "CONTINUITY_ITEM_CORRECTED"
              : "CONTINUITY_ITEM_REMOVED",
          JSON.stringify(
            action.operation_type === "PARTICIPATE"
              ? { actionId, target: displayEffect.target }
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
        `insert into simulora.conversation_entries (id, commit_id, branch_id, ordinal, role, content)
         values ($1, $2, $3, 1, 'USER', $4), ($5, $2, $3, 2, 'WORLD', $6)`,
        [randomUUID(), commitId, action.branch_id, action.intent, randomUUID(), candidateNarrative],
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
        ].includes(action.status)
      ) {
        const now = new Date();
        await client.query(
          `update simulora.actions set status = 'CANCELLED', terminal_at = $2, updated_at = $2,
           status_reason = 'USER_CANCELLED', row_version = row_version + 1 where id = $1`,
          [actionId, now],
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
          status: "CANCELLED",
          message: "The Action was cancelled. Current World truth is unchanged.",
        });
      }
      return this.readActionWithClient(client, account, actionId);
    });
  }

  async retryAction(account: SyntheticAccount, actionId: string): Promise<ActionRecord> {
    this.assertEligible(account);
    return transaction(this.pool, async (client) => {
      const result = await client.query<{ status: ActionStatus }>(
        `select status from simulora.actions where id = $1 and actor_account_id = $2 for update`,
        [actionId, account.accountId],
      );
      const action = result.rows[0];
      if (!action) throw new NotFoundError("Action not found");
      if (action.status !== "FAILED_RECOVERABLE")
        return this.readActionWithClient(client, account, actionId);
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
      terminal: ["COMMITTED", "CONFLICT", "CANCELLED", "SUPERSEDED"].includes(action.status),
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
              (select (p.candidate_transition->>'narrative') from simulora.action_proposals p where p.action_id = a.id) as narrative
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
        projection_payload: unknown;
        projection_status: OrientationProjectionStatus | null;
        projection_rebuilt_at: Date | null;
      }>(
        `select c.id as continuity_id, b.id as branch_id, c.world_revision_id,
                b.head_commit_id, b.head_state_revision_id, s.document as state_document,
                p.source_head_commit_id as projection_source_head,
                p.payload as projection_payload, p.status as projection_status,
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
         where branch_id = $1 and status not in ('COMMITTED', 'CONFLICT', 'CANCELLED', 'SUPERSEDED')
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
      let payload: OrientationResponse;
      if (row.projection_payload) {
        payload = row.projection_payload as OrientationResponse;
      } else {
        payload = orientationPayload(
          row.continuity_id,
          row.branch_id,
          row.world_revision_id,
          state,
          row.head_commit_id,
          row.head_state_revision_id,
          new Date().toISOString(),
        );
      }

      const distanceResult = await client.query<{ distance: number | null }>(
        `with recursive ancestors(id, parent_commit_id, distance) as (
           select id, parent_commit_id, 0 from simulora.world_commits where id = $1
           union all
           select c.id, c.parent_commit_id, ancestors.distance + 1
           from simulora.world_commits c join ancestors on c.id = ancestors.parent_commit_id
           where ancestors.distance < 1000
         )
         select distance from ancestors where id = $2 limit 1`,
        [row.head_commit_id, sourceHeadCommitId],
      );
      const headDistance =
        distanceResult.rows[0]?.distance ?? (sourceHeadCommitId === row.head_commit_id ? 0 : 1);
      if (sourceHeadCommitId !== row.head_commit_id && status === "FRESH") status = "STALE";
      if (status === "FRESH") sourceHeadCommitId = row.head_commit_id;
      payload = {
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
      return payload;
    });
  }

  /** Build a fresh orientation projection from the selected Branch head. */
  async rebuildReturnOrientation(
    account: SyntheticAccount,
    branchId: string,
  ): Promise<OrientationResponse> {
    this.assertEligible(account);
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
         where branch_id = $1 and status not in ('COMMITTED', 'CONFLICT', 'CANCELLED', 'SUPERSEDED')
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
      );
      const latestEventType = trace.commits[0]?.events[0]?.type;
      if (
        latestEventType === "CONTINUITY_ITEM_CORRECTED" ||
        latestEventType === "CONTINUITY_ITEM_REMOVED"
      ) {
        // The immutable State Revision intentionally retains old open-thread
        // narrative. Do not promote that historical wording to the Return
        // "Now" card after a correction/removal; current canonical truth is
        // represented by the active fact set and the explicit change record.
        payload.current.situation =
          "The continuity is at its current branch head after a recorded canonical update.";
      }
      payload.recentChanges = trace.commits
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
        // Trace commits arrive newest-first. Keep the newest bounded set and
        // present that set chronologically so the latest correction cannot be
        // dropped by taking the tail of a descending list.
        .slice(0, 3)
        .reverse();
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
  async processNextProjection(): Promise<OrientationResponse | null> {
    const row = await transaction(this.pool, async (client) => {
      const candidate = await client.query<{
        branch_id: string;
        owner_account_id: string;
      }>(
        `select p.branch_id, c.owner_account_id
         from simulora.return_orientation_projections p
         join simulora.branches b on b.id = p.branch_id and b.status = 'ACTIVE'
         join simulora.continuities c on c.id = b.continuity_id and c.status = 'ACTIVE'
         where p.status in ('STALE', 'REBUILDING')
         order by p.updated_at
         limit 1
         for update of p skip locked`,
      );
      const next = candidate.rows[0];
      if (!next) return null;
      await client.query(
        `update simulora.return_orientation_projections
         set status = 'REBUILDING', updated_at = now(), row_version = row_version + 1
         where branch_id = $1`,
        [next.branch_id],
      );
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
                  e.source_type as event_source_type, e.visibility_scope, e.payload
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
          scope = safeVisibilityScope(event!.payload.scope);
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
                    e.payload as event_payload, e.visibility_scope as event_scope
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
        const targetId =
          typeof payload.targetFactId === "string"
            ? payload.targetFactId
            : typeof payload.target === "string"
              ? payload.target
              : undefined;
        commit.events.push({
          id: row.event_id,
          type: row.event_type,
          summary: eventSummary(row.event_type),
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
  ): Promise<ActionRecord | null> {
    const prepared = await transaction(this.pool, async (client) => {
      // All lifecycle transactions lock Action -> job -> attempt, including cancellation.
      const actionResult = await client.query<{
        actor_account_id: string;
        expected_head_commit_id: string;
        intent: string;
        status: ActionStatus;
        state_document: unknown;
      }>(
        `select a.actor_account_id, a.expected_head_commit_id, a.intent, a.status,
                s.document as state_document
         from simulora.actions a
         join simulora.world_commits c on c.id = a.expected_head_commit_id
         join simulora.state_revisions s on s.id = c.state_revision_id
         where a.id = $1 for update of a`,
        [actionId],
      );
      const action = actionResult.rows[0];
      if (!action) throw new NotFoundError("Action not found");
      if (!["ACKNOWLEDGED", "GENERATING"].includes(action.status)) return null;
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
      const targetFact = state.facts.find((fact) => isGeneratorEligibleFact(fact));
      if (!targetFact) {
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
            set status = 'FAILED_RECOVERABLE', status_reason = 'NO_ACTIVE_CANONICAL_FACT',
                updated_at = now(), row_version = row_version + 1
            where id = $1 and status = 'GENERATING'`,
          [actionId],
        );
        await client.query(
          `update simulora.durable_jobs
            set status = 'DEAD', last_error = 'NO_ACTIVE_CANONICAL_FACT',
                lease_owner = null, lease_until = null, updated_at = now()
            where action_id = $1`,
          [actionId],
        );
        await this.appendProgressWithClient(client, actionId, "action.failed", {
          status: "FAILED_RECOVERABLE",
          reason: "NO_ACTIVE_CANONICAL_FACT",
        });
        return null;
      }
      const attemptId = randomUUID();
      const manifest = {
        compilerVersion: "ip4-context-v1",
        expectedHeadCommitId: action.expected_head_commit_id,
        // The deterministic gateway receives only targetFact below. Keep the
        // manifest truthful: owner-visible private/tombstoned facts and
        // character records are not silently treated as model context.
        includedFactIds: [targetFact.id],
        includedCharacterIds: [],
        participation: state.participation,
        excludedScopeCounts: {
          unauthorized: state.facts.filter((fact) => !isGeneratorEligibleFact(fact)).length,
        },
      };
      await client.query(
        `insert into simulora.generation_attempts
         (id, action_id, attempt_number, adapter, status, context_manifest)
         values ($1, $2, $3, 'deterministic', 'RUNNING', $4::jsonb)`,
        [attemptId, actionId, lease.rows[0].attempts, JSON.stringify(manifest)],
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
        expectedHeadCommitId: action.expected_head_commit_id,
        intent: action.intent,
        state,
        targetFact,
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
      const current = await client.query<{ status: ActionStatus }>(
        `select status from simulora.actions where id = $1 for update`,
        [actionId],
      );
      if (current.rows[0]?.status !== "GENERATING") return false;
      const owned = await client.query(
        `select j.id from simulora.durable_jobs j
         join simulora.generation_attempts g on g.action_id = j.action_id
         where j.id = $1 and j.lease_owner = $2 and j.attempts = $3
           and j.status = 'LEASED' and j.lease_until > clock_timestamp()
           and g.id = $4 and g.attempt_number = j.attempts and g.status = 'RUNNING'
         for update of j`,
        leaseIdentity,
      );
      return owned.rowCount === 1;
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
      const generated = await generator({
        actionId,
        expectedHeadCommitId: prepared.expectedHeadCommitId,
        intent: prepared.intent,
        targetFact: prepared.targetFact,
      });
      const candidate = validateActionCandidate(generated.candidate, {
        actionId,
        expectedHeadCommitId: prepared.expectedHeadCommitId,
        state: prepared.state,
        authorizedTargetFactIds: [prepared.targetFact.id],
      });
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
          [prepared.attemptId, JSON.stringify(generated)],
        );
        await client.query(
          `update simulora.actions set status = 'VALIDATING', updated_at = now(), row_version = row_version + 1 where id = $1`,
          [actionId],
        );
        await client.query(
          `insert into simulora.action_proposals
           (id, action_id, generation_attempt_id, expected_head_commit_id, schema_version,
            candidate_transition, impact_level, proposal_digest, display_effect, status, expires_at)
           values ($1, $2, $3, $4, 1, $5::jsonb, 'L3', $6, $7::jsonb, 'ACTIVE', $8)`,
          [
            proposalId,
            actionId,
            prepared.attemptId,
            prepared.expectedHeadCommitId,
            JSON.stringify(candidate.candidate),
            digest,
            JSON.stringify(candidate.displayEffect),
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
          provisional: true,
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
            [prepared.jobId, error instanceof Error ? error.message : "Unknown generation failure"],
          );
          await this.appendProgressWithClient(client, actionId, "action.failed", {
            status: "FAILED_RECOVERABLE",
            reason: "GENERATION_FAILED",
          });
        } else {
          await client.query(
            `update simulora.durable_jobs set status = 'AVAILABLE', lease_owner = null, lease_until = null,
             available_at = now(), last_error = $2, updated_at = now() where id = $1`,
            [prepared.jobId, error instanceof Error ? error.message : "Unknown generation failure"],
          );
        }
        return this.readActionWithClient(client, account, actionId);
      });
    } finally {
      clearInterval(heartbeat);
      await renewal;
    }
  }

  async processNextAction(
    generator: ActionGenerator,
    workerId = "worker",
  ): Promise<ActionRecord | null> {
    const next = await this.pool.query<{ action_id: string }>(
      `select action_id from simulora.durable_jobs
       where (status = 'AVAILABLE' and available_at <= clock_timestamp())
          or (status = 'LEASED' and lease_until <= clock_timestamp())
       order by available_at, created_at limit 1`,
    );
    return next.rows[0] ? this.processAction(next.rows[0].action_id, generator, workerId) : null;
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
      expected_head_commit_id: string;
      operation_type: ActionOperationType;
      status: ActionStatus;
      intent: string;
      participation_expectation: ParticipationContract;
      acknowledged_at: Date;
      terminal_at: Date | null;
      status_reason: string | null;
      proposal_id: string | null;
      proposal_digest: string | null;
      proposal_head: string | null;
      proposal_expires: Date | null;
      proposal_narrative: string | null;
      display_effect: ActionProposalRecord["displayEffect"] | null;
      commit_id: string | null;
      commit_head: string | null;
      commit_state: string | null;
      committed_at: Date | null;
    }>(
      `select a.id, a.continuity_id, a.branch_id, a.expected_head_commit_id, a.operation_type, a.status, a.intent,
              a.participation_expectation, a.acknowledged_at, a.terminal_at, a.status_reason,
              p.id as proposal_id, p.proposal_digest, p.expected_head_commit_id as proposal_head,
              p.expires_at as proposal_expires,
              p.candidate_transition->>'narrative' as proposal_narrative, p.display_effect,
              c.id as commit_id, c.id as commit_head, sr.id as commit_state, c.created_at as committed_at
       from simulora.actions a
       left join simulora.action_proposals p on p.action_id = a.id
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
      expectedHeadCommitId: row.expected_head_commit_id,
      operationType: row.operation_type,
      status: row.status,
      intent: row.intent,
      participationExpectation: row.participation_expectation,
      acknowledgedAt: row.acknowledged_at.toISOString(),
      terminalAt: row.terminal_at?.toISOString() ?? null,
      recoverableWait:
        row.status === "FAILED_RECOVERABLE" ||
        (["ACKNOWLEDGED", "GENERATING", "VALIDATING"].includes(row.status) &&
          Date.now() - row.acknowledged_at.getTime() > 10_000),
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
              id: row.proposal_id,
              digest: row.proposal_digest,
              expectedHeadCommitId: row.proposal_head,
              impact: "L3",
              expiresAt: row.proposal_expires.toISOString(),
              narrative: row.proposal_narrative,
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
      `update simulora.actions set status = 'CONFLICT', terminal_at = null, status_reason = $2, updated_at = now(), row_version = row_version + 1 where id = $1 and status not in ('COMMITTED', 'CANCELLED')`,
      [actionId, reason],
    );
    await this.appendProgressWithClient(client, actionId, "action.failed", {
      status: "CONFLICT",
      reason,
    });
  }

  private assertEligible(account: SyntheticAccount): void {
    if (account.eligibility !== "adult") {
      throw new AccessDeniedError("An eligible adult account is required");
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
