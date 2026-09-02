import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
  type ActionRecord,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const account = {
  accountId: "30000000-0000-4000-8000-000000000001",
  eligibility: "adult" as const,
};
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const gateway = new DeterministicModelGateway();

function latch() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

function heldAttempt(repository: AuthoritativeWorldRepository, actionId: string, fail = false) {
  const started = latch();
  const completion = latch();
  const task = repository.processAction(
    actionId,
    async (request) => {
      started.release();
      await completion.promise;
      if (fail) throw new Error("Delayed generation failed");
      return gateway.generateWorldTurn(request);
    },
    "reused-worker-name",
  );
  return { task, started: started.promise, release: completion.release };
}

suite("IP-3 lease ownership against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(repositoryRoot, "db", "migrations"));
    pool = createDatabasePool(connectionString, { max: 12 });
    repository = new AuthoritativeWorldRepository(pool);
  });
  afterAll(async () => pool?.end());

  async function submit() {
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const current = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const action = await repository.submitAction(account, current.branchId, {
      schemaVersion: 1,
      idempotencyKey: "lease-test",
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent: "Check the waiting signal.",
    });
    return { action, current };
  }

  async function expire(actionId: string) {
    // Simulate a paused/dead process without fake timers or a fake database.
    await pool.query(
      `update simulora.durable_jobs set lease_until = clock_timestamp() - interval '1 second'
       where action_id = $1`,
      [actionId],
    );
  }

  async function snapshot(actionId: string) {
    const [action, jobs, attempts, progress] = await Promise.all([
      repository.readAction(account, actionId),
      pool.query(
        `select status, attempts, lease_owner, last_error from simulora.durable_jobs where action_id = $1`,
        [actionId],
      ),
      pool.query(
        `select id, attempt_number, status, error_class, output, completed_at
        from simulora.generation_attempts where action_id = $1 order by attempt_number`,
        [actionId],
      ),
      repository.readProgress(account, actionId),
    ]);
    return { action, jobs: jobs.rows, attempts: attempts.rows, progress };
  }

  async function confirm(action: ActionRecord | null) {
    if (!action?.proposal) throw new Error("Expected a current proposal");
    return repository.confirmAction(account, action.id, {
      proposalId: action.proposal.id,
      proposalDigest: action.proposal.digest,
      expectedHeadCommitId: action.proposal.expectedHeadCommitId,
    });
  }

  it("renews a live slow attempt past its original deadline and prevents takeover", async () => {
    const { action, current } = await submit();
    const shortLease = new AuthoritativeWorldRepository(pool, {
      durationMs: 1_500,
      heartbeatMs: 200,
    });
    const slow = heldAttempt(shortLease, action.id);
    try {
      await slow.started;
      const initial = await pool.query<{ lease_until: Date }>(
        "select lease_until from simulora.durable_jobs where action_id = $1",
        [action.id],
      );
      const deadline = initial.rows[0]!.lease_until;
      await vi.waitFor(
        async () => {
          const clock = await pool.query<{ elapsed: boolean; renewed: boolean; attempts: number }>(
            `select clock_timestamp() > $2::timestamptz as elapsed,
           lease_until > clock_timestamp() and lease_until > $2::timestamptz as renewed, attempts
           from simulora.durable_jobs where action_id = $1`,
            [action.id, deadline],
          );
          expect(clock.rows[0]).toEqual({ elapsed: true, renewed: true, attempts: 1 });
        },
        { timeout: 5_000, interval: 100 },
      );
      await expect(
        repository.processAction(action.id, (r) => gateway.generateWorldTurn(r), "competitor"),
      ).resolves.toBeNull();
      slow.release();
      expect((await slow.task)?.status).toBe("AWAITING_CONFIRMATION");
      expect((await repository.readCurrentState(account, current.continuityId)).headCommitId).toBe(
        current.headCommitId,
      );
    } finally {
      slow.release();
      await slow.task;
    }
  }, 10_000);

  it.each([
    { fail: false, afterCommit: false },
    { fail: true, afterCommit: false },
    { fail: false, afterCommit: true },
    { fail: true, afterCommit: true },
  ])("fences stale attempt success/failure across takeover: %j", async ({ fail, afterCommit }) => {
    const { action, current } = await submit();
    // The stale attempt is number three: its late catch must not DEAD-mark the replacement.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await repository.processAction(action.id, () =>
        Promise.reject(new Error("Retryable failure")),
      );
    }
    const old = heldAttempt(repository, action.id, fail);
    await old.started;
    await expire(action.id);
    const replacement = heldAttempt(repository, action.id);
    try {
      await replacement.started;
      if (afterCommit) {
        replacement.release();
        expect((await confirm(await replacement.task)).status).toBe("COMMITTED");
      }
      const beforeOldCallback = await snapshot(action.id);
      expect(beforeOldCallback.attempts[2]).toMatchObject({
        attempt_number: 3,
        status: "FAILED",
        error_class: "LEASE_EXPIRED",
        output: null,
      });
      old.release();
      await old.task;
      expect(await snapshot(action.id)).toEqual(beforeOldCallback);
      if (!afterCommit) {
        expect(
          (await repository.readCurrentState(account, current.continuityId)).headCommitId,
        ).toBe(current.headCommitId);
        replacement.release();
        expect((await confirm(await replacement.task)).status).toBe("COMMITTED");
      }
      const final = await snapshot(action.id);
      expect(final.attempts[3]).toMatchObject({
        attempt_number: 4,
        status: "SUCCEEDED",
        error_class: null,
      });
      expect(final.jobs[0]).toMatchObject({ status: "SUCCEEDED", attempts: 4, lease_owner: null });
      const counts = await pool.query<{ commits: number; proposals: number }>(
        `select (select count(*)::int from simulora.world_commits where action_id = $1) as commits,
         (select count(*)::int from simulora.action_proposals where action_id = $1) as proposals`,
        [action.id],
      );
      expect(counts.rows[0]).toEqual({ commits: 1, proposals: 1 });
    } finally {
      old.release();
      replacement.release();
      await Promise.all([old.task, replacement.task]);
    }
  });

  it.each([false, true])(
    "rejects expired-owner completion before any replacement, failure=%s",
    async (fail) => {
      const { action, current } = await submit();
      const old = heldAttempt(repository, action.id, fail);
      try {
        await old.started;
        await expire(action.id);
        const before = await snapshot(action.id);
        old.release();
        await old.task;
        expect(await snapshot(action.id)).toEqual(before);
        expect(
          (await repository.readCurrentState(account, current.continuityId)).headCommitId,
        ).toBe(current.headCommitId);
        const recovered = await repository.processAction(action.id, (r) =>
          gateway.generateWorldTurn(r),
        );
        expect(recovered?.status).toBe("AWAITING_CONFIRMATION");
        expect((await snapshot(action.id)).attempts[0]).toMatchObject({
          status: "FAILED",
          error_class: "LEASE_EXPIRED",
        });
      } finally {
        old.release();
        await old.task;
      }
    },
  );

  it.each([false, true])(
    "cancellation revokes a running attempt before its late callback, failure=%s",
    async (fail) => {
      const { action, current } = await submit();
      const slow = heldAttempt(repository, action.id, fail);
      try {
        await slow.started;
        expect((await repository.cancelAction(account, action.id)).status).toBe("CANCELLED");
        const cancelled = await snapshot(action.id);
        expect(cancelled.jobs[0]).toMatchObject({ status: "SUCCEEDED", lease_owner: null });
        expect(cancelled.attempts[0]).toMatchObject({ status: "FAILED", error_class: "CANCELLED" });
        slow.release();
        await slow.task;
        expect(await snapshot(action.id)).toEqual(cancelled);
        expect(
          (await repository.readCurrentState(account, current.continuityId)).headCommitId,
        ).toBe(current.headCommitId);
      } finally {
        slow.release();
        await slow.task;
      }
    },
  );

  it("retains bounded failure/dead-state recovery with a new attempt epoch on explicit retry", async () => {
    const { action } = await submit();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await repository.processAction(action.id, () =>
        Promise.reject(new Error("Generation failed")),
      );
    }
    const failed = await snapshot(action.id);
    expect(failed.action.status).toBe("FAILED_RECOVERABLE");
    expect(failed.jobs[0]).toMatchObject({ status: "DEAD", attempts: 3, lease_owner: null });
    expect(failed.attempts.every((a) => a.status === "FAILED")).toBe(true);
    await repository.retryAction(account, action.id);
    const retried = await repository.processAction(action.id, (r) => gateway.generateWorldTurn(r));
    expect(retried?.status).toBe("AWAITING_CONFIRMATION");
    expect((await snapshot(action.id)).attempts[3]).toMatchObject({
      attempt_number: 4,
      status: "SUCCEEDED",
    });
  });

  it("serializes claim and cancellation without lock-order deadlock or resurrection", async () => {
    const { action, current } = await submit();
    await Promise.all([
      repository.processAction(action.id, (r) => gateway.generateWorldTurn(r)),
      repository.cancelAction(account, action.id),
    ]);
    const final = await snapshot(action.id);
    expect(final.action.status).toBe("CANCELLED");
    expect(final.attempts.every((a) => a.status !== "RUNNING")).toBe(true);
    expect(final.jobs[0]).toMatchObject({ status: "SUCCEEDED", lease_owner: null });
    expect((await repository.readCurrentState(account, current.continuityId)).headCommitId).toBe(
      current.headCommitId,
    );
  });
});
