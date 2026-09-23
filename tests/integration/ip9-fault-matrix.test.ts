import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import { rebuildProjections } from "../../scripts/rebuild-projections.js";

// IP-9.5 closes the rows of the frozen resilience matrix (Validation Strategy
// section 7) that earlier Gates covered only implicitly. The complete row-by-row
// mapping to evidence lives in docs/implementation-planning/IP-9-FAULT-MATRIX.md.

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;

async function playable(repository: AuthoritativeWorldRepository) {
  const owner = { accountId: randomUUID(), eligibility: "adult" as const };
  const world = await repository.createWorld(owner, lanternReachSeed);
  await repository.validateDraft(owner, world.worldId);
  const revision = await repository.createRevision(owner, world.worldId, 1);
  const continuity = await repository.startContinuity(owner, revision.revisionId, {
    initiativeMode: "GUIDED",
    structureMode: "OPEN_ENDED",
  });
  return { owner, continuity };
}

suite("IP-9 frozen fault matrix against PostgreSQL", () => {
  it("leaves no Action and no job when the acknowledgement transaction fails", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const marker = `FAULT-ACK-${randomUUID()}`;
    const functionName = `simulora.ip9_fault_${randomUUID().replaceAll("-", "")}`;
    const triggerName = `ip9_fault_${randomUUID().replaceAll("-", "")}`;
    try {
      const { owner, continuity } = await playable(repository);
      // The job row is written after the Action row in the same transaction, so a
      // fault there proves the whole acknowledgement rolls back together. The
      // trigger fires only for this test's marker, so parallel suites are untouched.
      await pool.query(`
        create function ${functionName}() returns trigger language plpgsql as $$
        begin
          if exists (select 1 from simulora.actions where id = new.action_id and intent = '${marker}') then
            raise exception 'injected acknowledgement fault';
          end if;
          return new;
        end;
        $$`);
      await pool.query(
        `create trigger ${triggerName} before insert on simulora.durable_jobs
         for each row execute function ${functionName}()`,
      );
      const idempotencyKey = `fault-ack-${randomUUID()}`;
      await expect(
        repository.submitAction(owner, continuity.branchId, {
          schemaVersion: 1,
          idempotencyKey,
          expectedHeadCommitId: continuity.headCommitId,
          participationExpectation: continuity.state.participation,
          intent: marker,
        }),
      ).rejects.toThrow(/injected acknowledgement fault/);
      const leftovers = await pool.query<{ actions: string; jobs: string }>(
        `select
           (select count(*) from simulora.actions where intent = $1) as actions,
           (select count(*) from simulora.durable_jobs j join simulora.actions a on a.id = j.action_id
             where a.intent = $1) as jobs`,
        [marker],
      );
      expect(leftovers.rows[0]).toEqual({ actions: "0", jobs: "0" });
      const state = await repository.readCurrentState(owner, continuity.continuityId);
      expect(state.headCommitId).toBe(continuity.headCommitId);
    } finally {
      await pool.query(`drop trigger if exists ${triggerName} on simulora.durable_jobs`);
      await pool.query(`drop function if exists ${functionName}()`);
      await pool.end();
    }
  });

  it("recovers a lost acknowledgement by retrying the same request", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    try {
      const { owner, continuity } = await playable(repository);
      const request = {
        schemaVersion: 1 as const,
        idempotencyKey: `lost-ack-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "The response to this request never reached the client.",
      };
      const first = await repository.submitAction(owner, continuity.branchId, request);
      const retried = await repository.submitAction(owner, continuity.branchId, request);
      expect(retried.id).toBe(first.id);
      const jobs = await pool.query<{ count: string }>(
        `select count(*) from simulora.durable_jobs where action_id = $1`,
        [first.id],
      );
      expect(jobs.rows[0]?.count).toBe("1");
    } finally {
      await pool.end();
    }
  });

  it("resumes a lost final frame to the existing Commit without a second one", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    try {
      const { owner, continuity } = await playable(repository);
      const action = await repository.submitAction(owner, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `lost-final-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "Commit, then lose the confirmation response.",
      });
      const gateway = new DeterministicModelGateway();
      const proposed = await repository.processAction(
        action.id,
        (request) => gateway.generateWorldTurn(request),
        "ip9-lost-final",
      );
      const confirmation = {
        proposalId: proposed!.proposal!.id,
        proposalDigest: proposed!.proposal!.digest,
        expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
      };
      const committed = await repository.confirmAction(owner, action.id, confirmation);
      // The client lost that response and retries both the confirmation and a read.
      const retried = await repository.confirmAction(owner, action.id, confirmation);
      const read = await repository.readAction(owner, action.id);
      expect(retried.commit?.id).toBe(committed.commit?.id);
      expect(read.commit?.id).toBe(committed.commit?.id);
      const progress = await repository.readProgress(owner, action.id, 0);
      expect(progress.frames.filter((frame) => frame.type === "action.committed")).toHaveLength(1);
      const commits = await pool.query<{ count: string }>(
        `select count(*) from simulora.world_commits where action_id = $1`,
        [action.id],
      );
      expect(commits.rows[0]?.count).toBe("1");
    } finally {
      await pool.end();
    }
  });

  it("releases a reservation exactly once when an Action ends without a Commit", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    try {
      const owner = { accountId: randomUUID(), eligibility: "adult" as const };
      await repository.ensureAccount(owner);
      const quote = await repository.createUsageQuote(owner, {
        schemaVersion: 1,
        idempotencyKey: `quote-${randomUUID()}`,
        actionProfile: "EXPORT",
      });
      const reservation = await repository.reserveUsage(owner, quote.quoteId, {
        schemaVersion: 1,
        actionKey: `export:fault-${randomUUID()}`,
      });
      await repository.releaseUsage(owner, reservation.reservationId);
      await repository.releaseUsage(owner, reservation.reservationId);
      await expect(repository.settleUsage(owner, reservation.reservationId)).rejects.toThrow(
        /USAGE_RESERVATION_TERMINAL/,
      );
      const entries = (await repository.listUsageLedger(owner)).entries.filter(
        (entry) => entry.reservationId === reservation.reservationId,
      );
      expect(entries.map((entry) => entry.entryType)).toEqual(["RELEASE"]);
    } finally {
      await pool.end();
    }
  });

  it("rebuilds missing and drifted projections from authoritative state on demand", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    try {
      const lost = await playable(repository);
      const drifted = await playable(repository);
      // One projection is lost outright; the other claims FRESH for an old head.
      await pool.query(`delete from simulora.return_orientation_projections where branch_id = $1`, [
        lost.continuity.branchId,
      ]);
      await pool.query(
        `update simulora.return_orientation_projections
         set status = 'FRESH', source_head_commit_id = (
           select id from simulora.world_commits where branch_id = $1 order by created_at limit 1
         )
         where branch_id = $1`,
        [drifted.continuity.branchId],
      );
      const action = await repository.submitAction(drifted.owner, drifted.continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `drift-${randomUUID()}`,
        expectedHeadCommitId: drifted.continuity.headCommitId,
        participationExpectation: drifted.continuity.state.participation,
        intent: "Move the head past the projection.",
      });
      const gateway = new DeterministicModelGateway();
      const proposed = await repository.processAction(
        action.id,
        (request) => gateway.generateWorldTurn(request),
        "ip9-drift",
      );
      await repository.confirmAction(drifted.owner, action.id, {
        proposalId: proposed!.proposal!.id,
        proposalDigest: proposed!.proposal!.digest,
        expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
      });
      // The database refuses to label an old head FRESH, so this drift can only
      // arise the natural way: the Commit above moved the head past the projection.
      // While stale, Return still serves the authoritative head as its fallback.
      const stale = await repository.readOrientation(
        drifted.owner,
        drifted.continuity.continuityId,
      );
      const head = await repository.readCurrentState(
        drifted.owner,
        drifted.continuity.continuityId,
      );
      expect(stale.freshness.status).not.toBe("FRESH");
      expect(stale.authoritativeFallback.headCommitId).toBe(head.headCommitId);

      const summary = await rebuildProjections(pool, {
        branchIds: [lost.continuity.branchId, drifted.continuity.branchId],
      });
      expect(summary).toMatchObject({ failed: 0, drained: true });
      expect(summary.rebuilt).toBe(2);
      for (const { owner, continuity } of [lost, drifted]) {
        const orientation = await repository.readOrientation(owner, continuity.continuityId);
        const current = await repository.readCurrentState(owner, continuity.continuityId);
        expect(orientation.freshness).toMatchObject({
          status: "FRESH",
          sourceHeadCommitId: current.headCommitId,
          headDistance: 0,
        });
      }
    } finally {
      await pool.end();
    }
  });
});
