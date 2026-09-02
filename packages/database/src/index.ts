import { randomUUID } from "node:crypto";
import {
  applyValidatedActionCandidate,
  contentHash,
  createInitialState,
  participationContractSchema,
  stateRevisionDocumentSchema,
  validateActionCandidate,
  worldDocumentSchema,
  type ActionStatus,
  type ParticipationContract,
  type StateRevisionDocument,
  type WorldDocument,
} from "@simulora/domain";
import { Kysely, PostgresDialect, type ColumnType, type Generated } from "kysely";
import { Pool, type PoolClient, type PoolConfig } from "pg";

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
  constructor(private readonly pool: Pool) {}

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
    // The current read is owner-scoped in IP-3. Future shared projections must filter
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
        status: ActionStatus;
        intent: string;
      }>(
        `select id, actor_account_id, branch_id, expected_head_commit_id, status, intent
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
        generation_attempt_id: string;
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
      const validated = validateActionCandidate(proposal.candidate_transition, {
        actionId,
        expectedHeadCommitId: request.expectedHeadCommitId,
        state: expectedState,
      });
      const nextState = applyValidatedActionCandidate(expectedState, validated);
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
         (id, branch_id, commit_id, event_type, payload)
         values ($1, $2, $3, 'ACTION_RECORDED', $4::jsonb)`,
        [
          eventId,
          action.branch_id,
          commitId,
          JSON.stringify({ actionId, target: validated.displayEffect.target }),
        ],
      );
      await client.query(
        `insert into simulora.conversation_entries (id, commit_id, branch_id, ordinal, role, content)
         values ($1, $2, $3, 1, 'USER', $4), ($5, $2, $3, 2, 'WORLD', $6)`,
        [
          randomUUID(),
          commitId,
          action.branch_id,
          action.intent,
          randomUUID(),
          validated.candidate.narrative,
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
          `update simulora.durable_jobs set status = 'SUCCEEDED', updated_at = now() where action_id = $1`,
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

  async processAction(
    actionId: string,
    generator: ActionGenerator,
    workerId = "worker",
  ): Promise<ActionRecord | null> {
    const prepared = await transaction(this.pool, async (client) => {
      const lease = await client.query<{ id: string; attempts: number }>(
        `update simulora.durable_jobs
         set status = 'LEASED', lease_owner = $1, lease_until = now() + interval '30 seconds',
             attempts = attempts + 1, updated_at = now()
         where action_id = $2 and status in ('AVAILABLE', 'LEASED')
           and (status = 'AVAILABLE' or lease_until < now())
         returning id, attempts`,
        [workerId, actionId],
      );
      if (!lease.rows[0]) return null;
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
      if (!["ACKNOWLEDGED", "GENERATING"].includes(action.status)) {
        await client.query(
          `update simulora.durable_jobs set status = 'SUCCEEDED', lease_until = null, updated_at = now() where id = $1`,
          [lease.rows[0].id],
        );
        return null;
      }
      if (action.status === "ACKNOWLEDGED") {
        await client.query(
          `update simulora.actions set status = 'GENERATING', updated_at = now(), row_version = row_version + 1 where id = $1`,
          [actionId],
        );
      }
      const state = stateRevisionDocumentSchema.parse(action.state_document);
      const targetFact = state.facts[0];
      if (!targetFact)
        throw new ValidationError("No canonical fact available for deterministic Action");
      const attemptId = randomUUID();
      const manifest = {
        compilerVersion: "ip3-context-v1",
        expectedHeadCommitId: action.expected_head_commit_id,
        includedFactIds: state.facts.map((fact) => fact.id),
        includedCharacterIds: state.characters.map((character) => character.id),
        participation: state.participation,
        excludedScopeCounts: { unauthorized: 0 },
      };
      await client.query(
        `insert into simulora.generation_attempts
         (id, action_id, attempt_number, adapter, status, context_manifest)
         values ($1, $2, (select coalesce(max(attempt_number), 0) + 1 from simulora.generation_attempts where action_id = $2),
                 'deterministic', 'RUNNING', $3::jsonb)`,
        [attemptId, actionId, JSON.stringify(manifest)],
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

      return transaction(this.pool, async (client) => {
        const current = await client.query<{ status: ActionStatus }>(
          `select status from simulora.actions where id = $1 for update`,
          [actionId],
        );
        if (!current.rows[0]) throw new NotFoundError("Action not found");
        if (current.rows[0].status === "CANCELLED") {
          await client.query(
            `update simulora.generation_attempts set status = 'FAILED', error_class = 'CANCELLED', completed_at = now() where id = $1`,
            [prepared.attemptId],
          );
          await client.query(
            `update simulora.durable_jobs set status = 'SUCCEEDED', lease_until = null, updated_at = now() where id = $1`,
            [prepared.jobId],
          );
          return this.readActionWithClient(client, account, actionId);
        }
        if (current.rows[0].status !== "GENERATING") {
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
          `update simulora.durable_jobs set status = 'SUCCEEDED', lease_until = null, updated_at = now() where id = $1`,
          [prepared.jobId],
        );
        return this.readActionWithClient(client, account, actionId);
      });
    } catch (error) {
      return transaction(this.pool, async (client) => {
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
            `update simulora.durable_jobs set status = 'DEAD', lease_until = null,
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
    }
  }

  async processNextAction(
    generator: ActionGenerator,
    workerId = "worker",
  ): Promise<ActionRecord | null> {
    const next = await this.pool.query<{ action_id: string }>(
      `select action_id from simulora.durable_jobs
       where status = 'AVAILABLE' or (status = 'LEASED' and lease_until < now())
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
      `select a.id, a.continuity_id, a.branch_id, a.expected_head_commit_id, a.status, a.intent,
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
