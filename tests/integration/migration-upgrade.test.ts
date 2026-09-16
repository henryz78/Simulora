import { randomUUID } from "node:crypto";
import { copyFile, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;

async function dropDatabaseAfterDisconnect(
  admin: ReturnType<typeof createDatabasePool>,
  databaseName: string,
): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await admin.query(`drop database if exists ${databaseName}`);
      return;
    } catch (error) {
      if ((error as { code?: string }).code !== "55006" || attempt === 19) throw error;
      await setTimeout(50);
    }
  }
}

suite("populated prior-schema upgrade against real PostgreSQL", () => {
  it("preserves a sealed L3 proposal across 0031 to 0032 and confirms it on the original ledger", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const databaseName = `simulora_re3_upgrade_${randomUUID().replaceAll("-", "")}`;
    const admin = createDatabasePool(connectionString);
    const directory = await mkdtemp(path.join(tmpdir(), "simulora-re3-prior-"));
    const url = new URL(connectionString);
    url.pathname = `/${databaseName}`;
    let pool: ReturnType<typeof createDatabasePool> | undefined;
    try {
      await admin.query(`create database ${databaseName} template template0 encoding 'UTF8'`);
      const migrations = path.resolve("db/migrations");
      const files = (await readdir(migrations)).filter((file) => file.endsWith(".sql")).sort();
      for (const file of files.slice(0, 31))
        await copyFile(path.join(migrations, file), path.join(directory, file));
      await runMigrations(url.toString(), directory);
      pool = createDatabasePool(url.toString());
      const repository = new AuthoritativeWorldRepository(pool);
      const account = { accountId: randomUUID(), eligibility: "adult" as const };
      const world = await repository.createWorld(account, lanternReachSeed);
      const revision = await repository.createRevision(account, world.worldId, world.rowVersion);
      const continuity = await repository.startContinuity(account, revision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const action = await repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: randomUUID(),
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "Inspect the signal.",
        targetCharacterId: "character.iora",
      });
      const proposed = await repository.processAction(
        action.id,
        (request) => new DeterministicModelGateway().generateWorldTurn(request),
        "prior31",
      );
      expect(proposed?.status).toBe("AWAITING_CONFIRMATION");
      if (!proposed?.proposal) throw new Error("Expected legacy proposal");
      const before = await pool.query(
        "select to_jsonb(p) as document from simulora.action_proposals p where id=$1",
        [proposed.proposal.id],
      );
      await runMigrations(url.toString(), migrations);
      expect(
        (
          await pool.query(
            "select to_jsonb(p) as document from simulora.action_proposals p where id=$1",
            [proposed.proposal.id],
          )
        ).rows,
      ).toEqual(before.rows);
      const committed = await repository.confirmAction(account, action.id, {
        proposalId: proposed.proposal.id,
        proposalDigest: proposed.proposal.digest,
        expectedHeadCommitId: proposed.proposal.expectedHeadCommitId,
      });
      expect(committed.status).toBe("COMMITTED");
      expect(
        (await repository.readCurrentState(account, continuity.continuityId)).state.participation,
      ).toEqual(continuity.state.participation);
    } finally {
      await pool?.end();
      await dropDatabaseAfterDisconnect(admin, databaseName);
      await admin.end();
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("retires a duplicate pending proposal without deleting its generation evidence", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const databaseName = `simulora_upgrade_${randomUUID().replaceAll("-", "")}`;
    const admin = createDatabasePool(connectionString);
    const directory = await mkdtemp(path.join(tmpdir(), "simulora-prior-migrations-"));
    const url = new URL(connectionString);
    url.pathname = `/${databaseName}`;
    let pool: ReturnType<typeof createDatabasePool> | undefined;
    try {
      await admin.query(`create database ${databaseName} template template0 encoding 'UTF8'`);
      const migrations = path.resolve("db/migrations");
      const files = (await readdir(migrations)).filter((file) => file.endsWith(".sql")).sort();
      for (const file of files.slice(0, 25)) {
        await copyFile(path.join(migrations, file), path.join(directory, file));
      }
      await runMigrations(url.toString(), directory);
      pool = createDatabasePool(url.toString());
      // Current fixture helpers write correlation metadata. Nullable columns
      // add no authority invariant; all lifecycle/proposal guards remain 0025.
      await pool.query(`
        alter table simulora.actions add column correlation_id text;
        alter table simulora.durable_jobs add column correlation_id text;
        alter table simulora.generation_attempts add column correlation_id text;
        alter table simulora.branches add column fork_request_digest text;
      `);
      const repository = new AuthoritativeWorldRepository(pool);
      const account = { accountId: randomUUID(), eligibility: "adult" as const };
      const world = await repository.createWorld(account, lanternReachSeed);
      const revision = await repository.createRevision(account, world.worldId, world.rowVersion);
      const continuity = await repository.startContinuity(account, revision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const legacyKey = randomUUID();
      const legacyFork = await repository.forkBranch(account, continuity.continuityId, {
        idempotencyKey: legacyKey,
        name: "Legacy fork",
        sourceCommitId: continuity.headCommitId,
        expectedHeadCommitId: continuity.headCommitId,
      });
      await pool.query("update simulora.branches set fork_request_digest = null where id = $1", [
        legacyFork.id,
      ]);
      const action = await repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: randomUUID(),
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "Inspect the western signal.",
      });
      const result = await repository.processAction(
        action.id,
        (request) => new DeterministicModelGateway().generateWorldTurn(request),
        "prior-schema-worker",
      );
      expect(result?.status).toBe("AWAITING_CONFIRMATION");
      if (!result?.proposal) throw new Error("Expected a real validated proposal");
      // This second pending Action was legal on 0025. Make it the oldest so
      // the generated proposal belongs to the duplicate retired by 0026.
      await pool.query(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent,
          idempotency_request_digest, correlation_id, status, created_at)
         select $2, actor_account_id, continuity_id, branch_id, operation_type, $3,
                expected_head_commit_id, participation_expectation, intent,
                idempotency_request_digest, correlation_id, 'ACKNOWLEDGED',
                created_at - interval '1 second'
           from simulora.actions where id = $1`,
        [action.id, randomUUID(), randomUUID()],
      );
      await pool.query(
        "update simulora.durable_jobs set status = 'AVAILABLE' where action_id = $1",
        [action.id],
      );
      await runMigrations(url.toString(), migrations);
      await expect(
        repository.forkBranch(account, continuity.continuityId, {
          idempotencyKey: legacyKey,
          name: "Changed legacy request",
          sourceCommitId: continuity.headCommitId,
          expectedHeadCommitId: continuity.headCommitId,
        }),
      ).rejects.toThrow(/IDEMPOTENCY_KEY_REUSED/);
      const evidence = await pool.query<{
        action_status: string;
        proposal_status: string;
        attempt_status: string;
        job_status: string;
      }>(
        `select a.status as action_status, p.status as proposal_status,
                g.status as attempt_status, j.status as job_status
           from simulora.actions a
           join simulora.action_proposals p on p.action_id = a.id
           join simulora.generation_attempts g on g.id = p.generation_attempt_id
           join simulora.durable_jobs j on j.action_id = a.id
          where a.id = $1`,
        [action.id],
      );
      expect(evidence.rows).toEqual([
        {
          action_status: "CONFLICT",
          proposal_status: "REJECTED",
          attempt_status: "SUCCEEDED",
          job_status: "DEAD",
        },
      ]);
      expect(await repository.readAction(account, action.id)).toMatchObject({
        status: "CONFLICT",
        proposal: null,
        commit: null,
      });
      await expect(
        repository.confirmAction(account, action.id, {
          proposalId: result.proposal.id,
          proposalDigest: result.proposal.digest,
          expectedHeadCommitId: result.proposal.expectedHeadCommitId,
        }),
      ).rejects.toThrow(/ACTION_NOT_AWAITING_CONFIRMATION/);
      expect(
        (await repository.readCurrentState(account, continuity.continuityId)).headCommitId,
      ).toBe(continuity.headCommitId);
    } finally {
      await pool?.end();
      await dropDatabaseAfterDisconnect(admin, databaseName);
      await admin.end();
      await rm(directory, { recursive: true, force: true });
    }
  }, 30_000);
});
