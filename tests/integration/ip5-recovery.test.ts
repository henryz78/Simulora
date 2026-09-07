import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  ActionTruthService,
  WorldContinuityService,
} from "../../packages/application/src/index.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import {
  AuthoritativeWorldRepository,
  ConflictError,
  createDatabasePool,
  NotFoundError,
  type ActionRecord,
  type SyntheticAccount,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { createApiApp } from "../../apps/api/src/app.js";
import type { AuthPort } from "../../packages/auth/src/index.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const gateway = new DeterministicModelGateway();
const account: SyntheticAccount = {
  accountId: "50000000-0000-4000-8000-000000000001",
  eligibility: "adult",
};
const otherAccount: SyntheticAccount = {
  accountId: "50000000-0000-4000-8000-000000000002",
  eligibility: "adult",
};

suite("IP-5 non-destructive Recovery against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  let app: Awaited<ReturnType<typeof createApiApp>> | undefined;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(repositoryRoot, "db", "migrations"));
    pool = createDatabasePool(connectionString, { max: 20 });
    repository = new AuthoritativeWorldRepository(pool);
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  afterAll(async () => {
    await pool?.end();
  });

  async function createContinuity() {
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    return repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
  }

  async function recordAction(
    branchId: string,
    expectedHeadCommitId: string,
    intent: string,
  ): Promise<ActionRecord> {
    const state = await repository.readBranchState(account, branchId);
    const action = await repository.submitAction(account, branchId, {
      schemaVersion: 1,
      idempotencyKey: `recovery-action-${randomUUID()}`,
      expectedHeadCommitId,
      participationExpectation: state.state.participation,
      intent,
    });
    const proposed = await repository.processAction(
      action.id,
      (request) => gateway.generateWorldTurn(request),
      `ip5-worker-${randomUUID()}`,
    );
    if (!proposed?.proposal) throw new Error("Expected Action proposal");
    return repository.confirmAction(account, action.id, {
      proposalId: proposed.proposal.id,
      proposalDigest: proposed.proposal.digest,
      expectedHeadCommitId: proposed.proposal.expectedHeadCommitId,
    });
  }

  it("keeps Safe Points reference-only and creates an isolated idempotent Branch fork", async () => {
    const continuity = await createContinuity();
    const originalState = await repository.readCurrentState(account, continuity.continuityId);
    const originalCommitCount = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.world_commits where branch_id = $1",
      [continuity.branchId],
    );
    const pointKey = `point-${randomUUID()}`;
    const [point, retry] = await Promise.all([
      repository.createRecoveryPoint(account, continuity.branchId, {
        idempotencyKey: pointKey,
        label: "Before the experiment",
      }),
      repository.createRecoveryPoint(account, continuity.branchId, {
        idempotencyKey: pointKey,
        label: "Before the experiment",
      }),
    ]);
    expect(retry.id).toBe(point.id);
    expect(retry.label).toBe("Before the experiment");
    expect(point.commitId).toBe(continuity.headCommitId);
    const stateCopies = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.state_revisions where branch_id = $1",
      [continuity.branchId],
    );
    expect(stateCopies.rows[0]?.count).toBe(1);

    const forkKey = `fork-${randomUUID()}`;
    const [fork, duplicateFork] = await Promise.all([
      repository.forkBranch(account, continuity.continuityId, {
        idempotencyKey: forkKey,
        name: "Lamp experiment",
        sourceCommitId: point.commitId,
        expectedHeadCommitId: continuity.headCommitId,
      }),
      repository.forkBranch(account, continuity.continuityId, {
        idempotencyKey: forkKey,
        name: "Lamp experiment",
        sourceCommitId: point.commitId,
        expectedHeadCommitId: continuity.headCommitId,
      }),
    ]);
    expect(duplicateFork.id).toBe(fork.id);
    expect(fork).toMatchObject({
      parentBranchId: continuity.branchId,
      forkSourceCommitId: continuity.headCommitId,
      isCurrent: false,
    });
    const forkCommit = await pool.query<{
      kind: string;
      parent_commit_id: string;
      document: unknown;
      event_type: string;
    }>(
      `select commit.kind, commit.parent_commit_id, state.document, event.event_type
       from simulora.world_commits commit
       join simulora.state_revisions state on state.id = commit.state_revision_id
       join simulora.domain_events event on event.commit_id = commit.id
       where commit.id = $1`,
      [fork.headCommitId],
    );
    expect(forkCommit.rows[0]).toMatchObject({
      kind: "BRANCH_FORK",
      parent_commit_id: continuity.headCommitId,
      document: originalState.state,
      event_type: "BRANCH_FORKED",
    });

    const sourceAfterFork = await repository.readCurrentState(account, continuity.continuityId);
    expect(sourceAfterFork.branchId).toBe(continuity.branchId);
    expect(sourceAfterFork.headCommitId).toBe(continuity.headCommitId);
    expect(sourceAfterFork.stateHash).toBe(originalState.stateHash);
    const sourceCommitCount = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.world_commits where branch_id = $1",
      [continuity.branchId],
    );
    expect(sourceCommitCount.rows[0]?.count).toBe(originalCommitCount.rows[0]?.count);

    const pending = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `pending-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Inspect the lamp before switching paths.",
    });
    await repository.readRecovery(account, continuity.continuityId);
    expect((await repository.readAction(account, pending.id)).status).toBe("ACKNOWLEDGED");
    await expect(
      repository.selectBranch(account, continuity.continuityId, fork.id),
    ).rejects.toThrow(new ConflictError("PENDING_ACTIONS_REQUIRE_RESOLUTION"));
    await repository.cancelAction(account, pending.id);
    const selected = await repository.selectBranch(account, continuity.continuityId, fork.id);
    expect(selected.currentBranchId).toBe(fork.id);
    expect((await repository.readCurrentState(account, continuity.continuityId)).branchId).toBe(
      fork.id,
    );

    const inactiveSourceFork = await repository.forkBranch(account, continuity.continuityId, {
      idempotencyKey: `inactive-source-fork-${randomUUID()}`,
      name: "Fork from preserved original",
      sourceCommitId: point.commitId,
      expectedHeadCommitId: fork.headCommitId,
    });
    expect(inactiveSourceFork).toMatchObject({
      parentBranchId: continuity.branchId,
      forkSourceCommitId: point.commitId,
      isCurrent: false,
    });
    const originalAfterInactiveFork = await repository.readBranchState(
      account,
      continuity.branchId,
    );
    expect(originalAfterInactiveFork.headCommitId).toBe(continuity.headCommitId);
    expect(originalAfterInactiveFork.stateHash).toBe(originalState.stateHash);

    const deleted = await repository.deleteRecoveryPoint(account, point.id);
    expect(deleted.deletedAt).not.toBeNull();
    expect(
      (await repository.readRecovery(account, continuity.continuityId)).recoveryPoints,
    ).toEqual([]);
    expect(
      (await pool.query("select id from simulora.world_commits where id = $1", [point.commitId]))
        .rowCount,
    ).toBe(1);
    await expect(repository.readRecovery(otherAccount, continuity.continuityId)).rejects.toThrow(
      NotFoundError,
    );
    await expect(
      repository.createRecoveryPoint(otherAccount, fork.id, {
        idempotencyKey: `denied-point-${randomUUID()}`,
        label: "Not mine",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("binds exact Restore confirmation and appends one effective-once Commit", async () => {
    const continuity = await createContinuity();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: `restore-point-${randomUUID()}`,
      label: "Opening state",
    });
    const changed = await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Steady the western signal.",
    );
    const [proposal, duplicateProposal] = await Promise.all([
      repository.prepareRestore(account, continuity.branchId, point.commitId),
      repository.prepareRestore(account, continuity.branchId, point.commitId),
    ]);
    expect(duplicateProposal.id).toBe(proposal.id);
    expect(proposal).toMatchObject({
      sourceCommitId: point.commitId,
      expectedHeadCommitId: changed.commit!.resultingHeadCommitId,
      status: "ACTIVE",
    });
    expect(proposal.changedSections).toEqual(expect.arrayContaining(["worldClock", "facts"]));
    expect(proposal.sectionChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ section: "worldClock" }),
        expect.objectContaining({ section: "facts" }),
      ]),
    );
    expect(proposal.includedSections).toEqual(expect.arrayContaining(["facts", "characters"]));
    expect(proposal.excludedSections).toEqual(
      expect.arrayContaining(["participation", "interactionBoundaries", "other Branches"]),
    );
    await expect(
      repository.confirmRestore(account, continuity.branchId, {
        proposalId: proposal.id,
        digest: "0".repeat(64),
        expectedHeadCommitId: proposal.expectedHeadCommitId,
      }),
    ).rejects.toThrow(new ConflictError("RESTORE_CONFIRMATION_MISMATCH"));
    await expect(
      repository.prepareRestore(otherAccount, continuity.branchId, point.commitId),
    ).rejects.toThrow(NotFoundError);

    const before = await pool.query<{ commits: number; states: number; events: number }>(
      `select
         (select count(*)::int from simulora.world_commits where branch_id = $1) as commits,
         (select count(*)::int from simulora.state_revisions where branch_id = $1) as states,
         (select count(*)::int from simulora.domain_events where branch_id = $1) as events`,
      [continuity.branchId],
    );
    const request = {
      proposalId: proposal.id,
      digest: proposal.digest,
      expectedHeadCommitId: proposal.expectedHeadCommitId,
    };
    const [first, retry] = await Promise.all([
      repository.confirmRestore(account, continuity.branchId, request),
      repository.confirmRestore(account, continuity.branchId, request),
    ]);
    expect(retry.commitId).toBe(first.commitId);
    expect((await repository.readRestoreProposal(account, proposal.id)).resultCommitId).toBe(
      first.commitId,
    );
    await expect(repository.readRestoreProposal(otherAccount, proposal.id)).rejects.toThrow(
      NotFoundError,
    );
    const auth: AuthPort = { authenticate: () => Promise.resolve(account) };
    app = createApiApp({
      logLevel: "error",
      auth,
      worldService: new WorldContinuityService(repository),
      actionService: new ActionTruthService(repository),
    });
    const durableResult = await app.inject({
      method: "GET",
      url: `/v1/restore-proposals/${proposal.id}`,
    });
    expect(durableResult.statusCode).toBe(200);
    expect(durableResult.json()).toMatchObject({
      id: proposal.id,
      status: "CONFIRMED",
      resultCommitId: first.commitId,
    });
    const after = await pool.query<{ commits: number; states: number; events: number }>(
      `select
         (select count(*)::int from simulora.world_commits where branch_id = $1) as commits,
         (select count(*)::int from simulora.state_revisions where branch_id = $1) as states,
         (select count(*)::int from simulora.domain_events where branch_id = $1) as events`,
      [continuity.branchId],
    );
    expect(after.rows[0]).toEqual({
      commits: before.rows[0]!.commits + 1,
      states: before.rows[0]!.states + 1,
      events: before.rows[0]!.events + 1,
    });
    const current = await repository.readCurrentState(account, continuity.continuityId);
    expect(current.headCommitId).toBe(first.commitId);
    expect(current.state.facts).toEqual(continuity.state.facts);
    expect(current.state.worldClock).toEqual(continuity.state.worldClock);
    expect(current.state.participation).toEqual(continuity.state.participation);
    expect(current.state.interactionBoundaries).toEqual(continuity.state.interactionBoundaries);
    const commit = await pool.query<{
      kind: string;
      parent_commit_id: string;
      event_type: string;
      source: string;
    }>(
      `select kind, parent_commit_id, event.event_type,
              event.payload->>'sourceCommitId' as source
       from simulora.world_commits commit
       join simulora.domain_events event on event.commit_id = commit.id
       where commit.id = $1`,
      [first.commitId],
    );
    expect(commit.rows[0]).toEqual({
      kind: "RESTORE_COMMITTED",
      parent_commit_id: changed.commit!.resultingHeadCommitId,
      event_type: "STATE_RESTORED",
      source: point.commitId,
    });
  });

  it("serializes current-path selection against durable Action acknowledgement", async () => {
    const continuity = await createContinuity();
    const fork = await repository.forkBranch(account, continuity.continuityId, {
      idempotencyKey: `selection-race-fork-${randomUUID()}`,
      name: "Selection race",
      sourceCommitId: continuity.headCommitId,
      expectedHeadCommitId: continuity.headCommitId,
    });
    const [selection, submission] = await Promise.allSettled([
      repository.selectBranch(account, continuity.continuityId, fork.id),
      repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `selection-race-action-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "Hold this Action while choosing a path.",
      }),
    ]);

    expect([selection, submission].filter((result) => result.status === "fulfilled")).toHaveLength(
      1,
    );
    if (submission.status === "fulfilled") {
      expect(submission.value.status).toBe("ACKNOWLEDGED");
      expect(selection).toMatchObject({
        status: "rejected",
        reason: new ConflictError("PENDING_ACTIONS_REQUIRE_RESOLUTION"),
      });
      expect((await repository.readCurrentState(account, continuity.continuityId)).branchId).toBe(
        continuity.branchId,
      );
    } else {
      expect(selection.status).toBe("fulfilled");
      expect(submission.reason).toBeInstanceOf(NotFoundError);
      expect((await repository.readCurrentState(account, continuity.continuityId)).branchId).toBe(
        fork.id,
      );
    }
  });

  it("turns a stale Restore review into a conflict without world mutation", async () => {
    const continuity = await createContinuity();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: `stale-point-${randomUUID()}`,
      label: "Opening state",
    });
    const firstChange = await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Steady the first signal.",
    );
    const proposal = await repository.prepareRestore(account, continuity.branchId, point.commitId);
    const secondChange = await recordAction(
      continuity.branchId,
      firstChange.commit!.resultingHeadCommitId,
      "Adjust the signal once more.",
    );
    const before = await pool.query<{ commits: number; states: number; events: number }>(
      `select
         (select count(*)::int from simulora.world_commits where branch_id = $1) as commits,
         (select count(*)::int from simulora.state_revisions where branch_id = $1) as states,
         (select count(*)::int from simulora.domain_events where branch_id = $1) as events`,
      [continuity.branchId],
    );
    await expect(
      repository.confirmRestore(account, continuity.branchId, {
        proposalId: proposal.id,
        digest: proposal.digest,
        expectedHeadCommitId: proposal.expectedHeadCommitId,
      }),
    ).rejects.toThrow(new ConflictError("RESTORE_REVIEW_STALE"));
    const after = await pool.query<{ commits: number; states: number; events: number }>(
      `select
         (select count(*)::int from simulora.world_commits where branch_id = $1) as commits,
         (select count(*)::int from simulora.state_revisions where branch_id = $1) as states,
         (select count(*)::int from simulora.domain_events where branch_id = $1) as events`,
      [continuity.branchId],
    );
    expect(after.rows[0]).toEqual(before.rows[0]);
    expect((await repository.readCurrentState(account, continuity.continuityId)).headCommitId).toBe(
      secondChange.commit!.resultingHeadCommitId,
    );
    const status = await pool.query<{ status: string }>(
      "select status from simulora.restore_proposals where id = $1",
      [proposal.id],
    );
    expect(status.rows[0]?.status).toBe("STALE");
  });

  it("serializes Restore confirmation against current-path selection", async () => {
    const continuity = await createContinuity();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: `selection-restore-point-${randomUUID()}`,
      label: "Before the path changed",
    });
    const changed = await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Change the signal before selecting another path.",
    );
    const fork = await repository.forkBranch(account, continuity.continuityId, {
      idempotencyKey: `selection-restore-fork-${randomUUID()}`,
      name: "Selected path",
      sourceCommitId: changed.commit!.resultingHeadCommitId,
      expectedHeadCommitId: changed.commit!.resultingHeadCommitId,
    });
    const proposal = await repository.prepareRestore(account, continuity.branchId, point.commitId);
    const before = await pool.query<{ commits: number; states: number; events: number }>(
      `select
         (select count(*)::int from simulora.world_commits where branch_id = $1) as commits,
         (select count(*)::int from simulora.state_revisions where branch_id = $1) as states,
         (select count(*)::int from simulora.domain_events where branch_id = $1) as events`,
      [continuity.branchId],
    );

    const blocker = await pool.connect();
    let confirmation:
      Promise<{ status: "fulfilled" } | { status: "rejected"; reason: unknown }> | undefined;
    try {
      await blocker.query("begin");
      await blocker.query("select id from simulora.restore_proposals where id = $1 for update", [
        proposal.id,
      ]);
      confirmation = repository
        .confirmRestore(account, continuity.branchId, {
          proposalId: proposal.id,
          digest: proposal.digest,
          expectedHeadCommitId: proposal.expectedHeadCommitId,
        })
        .then(
          () => ({ status: "fulfilled" as const }),
          (reason: unknown) => ({ status: "rejected" as const, reason }),
        );
      const selected = await repository.selectBranch(account, continuity.continuityId, fork.id);
      expect(selected.currentBranchId).toBe(fork.id);
      await blocker.query("commit");
    } finally {
      await blocker.query("rollback");
      blocker.release();
    }

    const outcome = await confirmation;
    expect(outcome).toMatchObject({
      status: "rejected",
      reason: new ConflictError("RESTORE_REVIEW_STALE"),
    });
    const after = await pool.query<{ commits: number; states: number; events: number }>(
      `select
         (select count(*)::int from simulora.world_commits where branch_id = $1) as commits,
         (select count(*)::int from simulora.state_revisions where branch_id = $1) as states,
         (select count(*)::int from simulora.domain_events where branch_id = $1) as events`,
      [continuity.branchId],
    );
    expect(after.rows[0]).toEqual(before.rows[0]);
    expect((await repository.readCurrentState(account, continuity.continuityId)).branchId).toBe(
      fork.id,
    );
    expect((await repository.readRestoreProposal(account, proposal.id)).status).toBe("STALE");
  });

  it("exposes owner-scoped Recovery commands over the production API", async () => {
    const continuity = await createContinuity();
    const auth: AuthPort = { authenticate: () => Promise.resolve(account) };
    app = createApiApp({
      logLevel: "error",
      auth,
      worldService: new WorldContinuityService(repository),
      actionService: new ActionTruthService(repository),
    });
    const initial = await app.inject({
      method: "GET",
      url: `/v1/continuities/${continuity.continuityId}/recovery`,
    });
    expect(initial.statusCode).toBe(200);
    expect(initial.json()).toMatchObject({
      continuityId: continuity.continuityId,
      currentBranchId: continuity.branchId,
    });
    const point = await app.inject({
      method: "POST",
      url: `/v1/branches/${continuity.branchId}/recovery-points`,
      payload: { idempotencyKey: `api-point-${randomUUID()}`, label: "API point" },
    });
    expect(point.statusCode).toBe(201);
    expect(point.json()).toMatchObject({
      branchId: continuity.branchId,
      commitId: continuity.headCommitId,
      label: "API point",
    });
    const fork = await app.inject({
      method: "POST",
      url: `/v1/continuities/${continuity.continuityId}/branches`,
      payload: {
        idempotencyKey: `api-fork-${randomUUID()}`,
        name: "API branch",
        sourceCommitId: continuity.headCommitId,
        expectedHeadCommitId: continuity.headCommitId,
      },
    });
    expect(fork.statusCode).toBe(201);
    expect(fork.json()).toMatchObject({
      continuityId: continuity.continuityId,
      parentBranchId: continuity.branchId,
      isCurrent: false,
    });
  });
});
