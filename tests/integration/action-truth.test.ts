import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import { contentHash, lanternReachSeed } from "../../packages/domain/src/index.js";
import {
  AuthoritativeWorldRepository,
  ConflictError,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const account = {
  accountId: "20000000-0000-4000-8000-000000000001",
  eligibility: "adult" as const,
};

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;

suite("IP-3 Action Truth against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  const gateway = new DeterministicModelGateway();
  let continuity: Awaited<ReturnType<AuthoritativeWorldRepository["startContinuity"]>>;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const migrationsDirectory = path.join(repositoryRoot, "db", "migrations");
    await runMigrations(connectionString, migrationsDirectory);
    pool = createDatabasePool(connectionString, { max: 12 });
    repository = new AuthoritativeWorldRepository(pool);
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
  });

  afterAll(async () => pool?.end());

  it("keeps acknowledgement and provisional output non-authoritative until exact confirmation", async () => {
    const submission = {
      schemaVersion: 1 as const,
      idempotencyKey: "action-truth-first",
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Relight the western signal with Iora.",
    };
    const [submitted, duplicate] = await Promise.all([
      repository.submitAction(account, continuity.branchId, submission),
      repository.submitAction(account, continuity.branchId, submission),
    ]);
    expect(submitted.status).toBe("ACKNOWLEDGED");
    expect(submitted.commit).toBeNull();
    expect(duplicate.id).toBe(submitted.id);

    const [workerA, workerB] = await Promise.all([
      repository.processAction(
        submitted.id,
        (request) => gateway.generateWorldTurn(request),
        "test-worker-a",
      ),
      repository.processAction(
        submitted.id,
        (request) => gateway.generateWorldTurn(request),
        "test-worker-b",
      ),
    ]);
    expect([workerA, workerB].filter((result) => result !== null)).toHaveLength(1);
    const proposed = workerA ?? workerB;
    expect(proposed?.status).toBe("AWAITING_CONFIRMATION");
    expect(proposed?.proposal?.impact).toBe("L3");
    await expect(
      repository.processAction(
        submitted.id,
        (request) => gateway.generateWorldTurn(request),
        "duplicate-worker",
      ),
    ).resolves.toBeNull();
    const restartedRepository = new AuthoritativeWorldRepository(pool);
    await expect(restartedRepository.readAction(account, submitted.id)).resolves.toMatchObject({
      id: submitted.id,
      status: "AWAITING_CONFIRMATION",
    });
    const beforeConfirmation = await repository.readCurrentState(account, continuity.continuityId);
    expect(beforeConfirmation.headCommitId).toBe(continuity.headCommitId);
    expect(beforeConfirmation.state.facts[0]?.statement).toBe("The western signal is dim.");

    await expect(
      repository.confirmAction(account, submitted.id, {
        proposalId: proposed!.proposal!.id,
        proposalDigest: "f".repeat(64),
        expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
      }),
    ).rejects.toThrow(/CONFIRMATION_EXPIRED_OR_PROPOSAL_CHANGED/);

    const confirmed = await repository.confirmAction(account, submitted.id, {
      proposalId: proposed!.proposal!.id,
      proposalDigest: proposed!.proposal!.digest,
      expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
    });
    expect(confirmed.status).toBe("COMMITTED");
    if (!confirmed.commit) throw new Error("Committed Action is missing its Commit projection");
    expect(confirmed.commit.resultingHeadCommitId).not.toBe(continuity.headCommitId);
    const duplicateConfirmation = await repository.confirmAction(account, submitted.id, {
      proposalId: proposed!.proposal!.id,
      proposalDigest: proposed!.proposal!.digest,
      expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
    });
    expect(duplicateConfirmation.commit?.id).toBe(confirmed.commit.id);
    await expect(
      repository.confirmAction(account, submitted.id, {
        proposalId: proposed!.proposal!.id,
        proposalDigest: "e".repeat(64),
        expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
      }),
    ).rejects.toThrow(/CONFIRMATION_EXPIRED_OR_PROPOSAL_CHANGED/);
    const afterConfirmation = await repository.readCurrentState(account, continuity.continuityId);
    expect(afterConfirmation.headCommitId).toBe(confirmed.commit.resultingHeadCommitId);
    expect(afterConfirmation.state.participation).toEqual(continuity.state.participation);

    const counts = await pool.query<{
      action_count: number;
      commit_count: number;
      state_count: number;
      event_count: number;
      history_count: number;
      head_count: number;
    }>(
      `select
        (select count(*)::int from simulora.actions
          where actor_account_id = $1 and branch_id = $2 and idempotency_key = 'action-truth-first') as action_count,
        (select count(*)::int from simulora.world_commits where action_id = $3) as commit_count,
        (select count(*)::int from simulora.state_revisions where commit_id = $4) as state_count,
        (select count(*)::int from simulora.domain_events where commit_id = $4) as event_count,
        (select count(*)::int from simulora.conversation_entries where commit_id = $4) as history_count,
        (select count(*)::int from simulora.branches where id = $2 and head_commit_id = $4) as head_count`,
      [account.accountId, continuity.branchId, submitted.id, confirmed.commit.id],
    );
    expect(counts.rows[0]).toEqual({
      action_count: 1,
      commit_count: 1,
      state_count: 1,
      event_count: 1,
      history_count: 2,
      head_count: 1,
    });
  });

  it("keeps a slow acknowledgement recoverable by Action ID and lets cancellation win before Commit", async () => {
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const pending = await repository.submitAction(account, current.branchId, {
      schemaVersion: 1,
      idempotencyKey: "action-truth-slow",
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent: "Wait for a clearer view through the fog.",
    });
    const restartedRepository = new AuthoritativeWorldRepository(
      pool,
      undefined,
      () => Date.now() + 11_000,
    );
    expect((await restartedRepository.readAction(account, pending.id)).recoverableWait).toBe(true);
    const proposed = await repository.processAction(
      pending.id,
      (request) => gateway.generateWorldTurn(request),
      "test-worker",
    );
    const cancelled = await repository.cancelAction(account, pending.id);
    expect(cancelled.status).toBe("CANCELLED");
    await expect(
      repository.confirmAction(account, pending.id, {
        proposalId: proposed!.proposal!.id,
        proposalDigest: proposed!.proposal!.digest,
        expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
      }),
    ).rejects.toThrow(/ACTION_CANCELLED/);
    const commits = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.world_commits where action_id = $1",
      [pending.id],
    );
    expect(commits.rows[0]?.count).toBe(0);
  });

  it("rejects idempotency-key reuse when the canonical request changes", async () => {
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const idempotencyKey = "action-truth-reuse";
    const first = await repository.submitAction(account, current.branchId, {
      schemaVersion: 1,
      idempotencyKey,
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent: "Keep the first request bound to this key.",
    });
    const stored = await pool.query<{ idempotency_request_digest: string | null }>(
      "select idempotency_request_digest from simulora.actions where id = $1",
      [first.id],
    );
    expect(stored.rows[0]?.idempotency_request_digest).toBe(
      contentHash({
        schemaVersion: 1,
        operationType: "PARTICIPATE",
        expectedHeadCommitId: current.headCommitId,
        participationExpectation: current.state.participation,
        intent: "Keep the first request bound to this key.",
      }),
    );
    await expect(
      repository.submitAction(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey,
        expectedHeadCommitId: current.headCommitId,
        participationExpectation: current.state.participation,
        intent: "A changed request must not reuse the first Action.",
      }),
    ).rejects.toThrow(/IDEMPOTENCY_KEY_REUSED/);
    await expect(
      repository.submitAction(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey,
        expectedHeadCommitId: "00000000-0000-4000-8000-000000000099",
        participationExpectation: current.state.participation,
        intent: "Keep the first request bound to this key.",
      }),
    ).rejects.toThrow(/IDEMPOTENCY_KEY_REUSED/);
    const fact = current.state.facts[0]!;
    await expect(
      repository.submitCorrection(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey,
        expectedHeadCommitId: current.headCommitId,
        target: { type: "fact", id: fact.id },
        operation: "CORRECT_CONTINUITY",
        before: { statement: fact.statement, scope: fact.scope },
        after: { statement: "This cross-operation reuse must be rejected." },
        reason: "A correction cannot reuse an ordinary Action key.",
      }),
    ).rejects.toThrow(/IDEMPOTENCY_KEY_REUSED/);
    await expect(repository.cancelAction(account, first.id)).resolves.toMatchObject({
      id: first.id,
      status: "CANCELLED",
    });
  });

  it("serializes a concurrent cancel and Commit race into one truthful terminal result", async () => {
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const pending = await repository.submitAction(account, current.branchId, {
      schemaVersion: 1,
      idempotencyKey: "action-truth-cancel-commit-race",
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent: "Test the shutter while keeping the world truth unambiguous.",
    });
    const proposed = await repository.processAction(
      pending.id,
      (request) => gateway.generateWorldTurn(request),
      "race-worker",
    );
    if (!proposed?.proposal) throw new Error("Race fixture did not produce a proposal");

    await Promise.allSettled([
      repository.confirmAction(account, pending.id, {
        proposalId: proposed.proposal.id,
        proposalDigest: proposed.proposal.digest,
        expectedHeadCommitId: proposed.proposal.expectedHeadCommitId,
      }),
      repository.cancelAction(account, pending.id),
    ]);

    const finalAction = await repository.readAction(account, pending.id);
    expect(["COMMITTED", "CANCELLED"]).toContain(finalAction.status);
    const commits = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.world_commits where action_id = $1",
      [pending.id],
    );
    expect(commits.rows[0]?.count).toBe(finalAction.status === "COMMITTED" ? 1 : 0);
  });

  it("allows only one unresolved ordinary Action against a Branch head", async () => {
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const input = (key: string, intent: string) => ({
      schemaVersion: 1 as const,
      idempotencyKey: key,
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent,
    });
    const attempts = await Promise.allSettled([
      repository.submitAction(
        account,
        current.branchId,
        input("action-race-first", "Turn the lens toward the harbor mouth."),
      ),
      repository.submitAction(
        account,
        current.branchId,
        input("action-race-second", "Turn the lens toward the western shoal."),
      ),
    ]);
    const accepted = attempts.find(
      (
        attempt,
      ): attempt is PromiseFulfilledResult<Awaited<ReturnType<typeof repository.submitAction>>> =>
        attempt.status === "fulfilled",
    );
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
    expect(attempts.find((attempt) => attempt.status === "rejected")).toMatchObject({
      reason: new ConflictError("PENDING_ACTIONS_REQUIRE_RESOLUTION"),
    });
    await repository.cancelAction(account, accepted!.value.id);
  });

  it("keeps durable acknowledgement below the one-second experience target in the deterministic fixture", async () => {
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const durations: number[] = [];
    for (let index = 0; index < 5; index += 1) {
      const started = performance.now();
      const action = await repository.submitAction(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey: `ack-latency-${index}`,
        expectedHeadCommitId: current.headCommitId,
        participationExpectation: current.state.participation,
        intent: `Observe the signal for latency sample ${index}.`,
      });
      durations.push(performance.now() - started);
      await repository.cancelAction(account, action.id);
    }
    durations.sort((left, right) => left - right);
    expect(durations.at(-1)).toBeLessThan(1_000);
  });

  it("continues with a second Action while preserving the first committed history", async () => {
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const second = await repository.submitAction(account, current.branchId, {
      schemaVersion: 1,
      idempotencyKey: "action-truth-second",
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent: "Record the waiting vessel's lantern pattern.",
    });
    const proposal = await repository.processAction(
      second.id,
      (request) => gateway.generateWorldTurn(request),
      "test-worker",
    );
    const committed = await repository.confirmAction(account, second.id, {
      proposalId: proposal!.proposal!.id,
      proposalDigest: proposal!.proposal!.digest,
      expectedHeadCommitId: proposal!.proposal!.expectedHeadCommitId,
    });
    expect(committed.status).toBe("COMMITTED");
    const history = await repository.listBranchActions(account, current.branchId);
    expect(
      history.actions.filter((action) => action.status === "COMMITTED").length,
    ).toBeGreaterThanOrEqual(2);
    expect(history.actions.map((action) => action.intent)).toContain(
      "Relight the western signal with Iora.",
    );
    expect(history.actions.map((action) => action.intent)).toContain(
      "Record the waiting vessel's lantern pattern.",
    );
  });

  it("rejects a stale submission before generation and never mutates current truth", async () => {
    await expect(
      repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: "action-truth-stale",
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "This intent was composed against an old head.",
      }),
    ).rejects.toThrow(/BRANCH_HEAD_CONFLICT/);
    const count = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.actions where idempotency_key = 'action-truth-stale'",
    );
    expect(count.rows[0]?.count).toBe(0);
  });

  it("persists an ordered resumable progress trail", async () => {
    const history = await repository.listBranchActions(account, continuity.branchId);
    const actionId = history.actions[0]!.id;
    const progress = await repository.readProgress(account, actionId, 0);
    expect(progress.frames.map((frame) => frame.type)).toEqual([
      "action.status",
      "action.status",
      "generation.draft",
      "confirmation.required",
      "action.status",
      "action.committed",
    ]);
    const resumed = await repository.readProgress(account, actionId, 3);
    expect(resumed.frames[0]?.sequence).toBe(4);
    expect(progress.terminal).toBe(true);
  });
});
