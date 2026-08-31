import { randomUUID } from "node:crypto";
import {
  contentHash,
  createInitialState,
  participationContractSchema,
  stateRevisionDocumentSchema,
  worldDocumentSchema,
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
    // The current read is owner-scoped in IP-2. Future shared projections must filter
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
