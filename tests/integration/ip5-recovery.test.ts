import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  ActionTruthService,
  WorldContinuityService,
} from "../../packages/application/src/index.js";
import {
  applyRestorableState,
  contentHash,
  lanternReachSeed,
} from "../../packages/domain/src/index.js";
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
    await expect(
      pool.query("update simulora.recovery_points set label = 'Rewritten' where id = $1", [
        point.id,
      ]),
    ).rejects.toThrow(/immutable except for its deletion tombstone/);

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
    const originalAfterInactiveFork = await pool.query<{
      head_commit_id: string;
      document_hash: string;
    }>(
      `select branch.head_commit_id, state.document_hash
       from simulora.branches branch
       join simulora.continuities continuity on continuity.id = branch.continuity_id
        and continuity.owner_account_id = $2
       join simulora.state_revisions state on state.id = branch.head_state_revision_id
       where branch.id = $1`,
      [continuity.branchId, account.accountId],
    );
    expect(originalAfterInactiveFork.rows[0]).toEqual({
      head_commit_id: continuity.headCommitId,
      document_hash: originalState.stateHash,
    });

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

  it("keeps a conflicted Action unresolved until explicit supersession", async () => {
    const continuity = await createContinuity();
    const fork = await repository.forkBranch(account, continuity.continuityId, {
      idempotencyKey: `conflict-fork-${randomUUID()}`,
      name: "After conflict",
      sourceCommitId: continuity.headCommitId,
      expectedHeadCommitId: continuity.headCommitId,
    });
    const submit = (intent: string) =>
      repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `conflict-action-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent,
      });
    const [first, second] = await Promise.all([
      submit("Advance the current path."),
      submit("Keep this proposal for conflict review."),
    ]);
    const [firstProposal, secondProposal] = await Promise.all([
      repository.processAction(first.id, (request) => gateway.generateWorldTurn(request)),
      repository.processAction(second.id, (request) => gateway.generateWorldTurn(request)),
    ]);
    await repository.confirmAction(account, first.id, {
      proposalId: firstProposal!.proposal!.id,
      proposalDigest: firstProposal!.proposal!.digest,
      expectedHeadCommitId: firstProposal!.proposal!.expectedHeadCommitId,
    });
    const conflicted = await repository.confirmAction(account, second.id, {
      proposalId: secondProposal!.proposal!.id,
      proposalDigest: secondProposal!.proposal!.digest,
      expectedHeadCommitId: secondProposal!.proposal!.expectedHeadCommitId,
    });
    expect(conflicted.status).toBe("CONFLICT");
    expect(
      (await repository.readOrientation(account, continuity.continuityId)).pendingActions,
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: second.id, status: "CONFLICT" })]),
    );
    await expect(
      repository.selectBranch(account, continuity.continuityId, fork.id),
    ).rejects.toThrow(new ConflictError("PENDING_ACTIONS_REQUIRE_RESOLUTION"));

    const superseded = await repository.cancelAction(account, second.id);
    expect(superseded.status).toBe("SUPERSEDED");
    expect(
      (await repository.selectBranch(account, continuity.continuityId, fork.id)).currentBranchId,
    ).toBe(fork.id);
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
      await blocker.query("select id from simulora.continuities where id = $1 for update", [
        continuity.continuityId,
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
      await blocker.query("update simulora.continuities set active_branch_id = $2 where id = $1", [
        continuity.continuityId,
        fork.id,
      ]);
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
    await repository.selectBranch(account, continuity.continuityId, continuity.branchId);
    const regenerated = await repository.prepareRestore(
      account,
      continuity.branchId,
      point.commitId,
    );
    expect(regenerated).toMatchObject({ status: "ACTIVE", digest: proposal.digest });
    expect(regenerated.id).not.toBe(proposal.id);
  });

  it("regenerates a Restore review after its previous active review expires", async () => {
    const continuity = await createContinuity();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: `expired-review-point-${randomUUID()}`,
      label: "Before expiry",
    });
    const changed = await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Change the path before expiry review.",
    );
    const proposal = await repository.prepareRestore(account, continuity.branchId, point.commitId);
    await pool.query("update simulora.restore_proposals set status = 'EXPIRED' where id = $1", [
      proposal.id,
    ]);
    const timedOutId = randomUUID();
    await pool.query(
      `insert into simulora.restore_proposals
       (id, continuity_id, branch_id, actor_account_id, source_commit_id,
        expected_head_commit_id, included_sections, excluded_sections, diff,
        proposal_digest, status, expires_at)
       select $1, continuity_id, branch_id, actor_account_id, source_commit_id,
              expected_head_commit_id, included_sections, excluded_sections, diff,
              proposal_digest, 'ACTIVE', clock_timestamp() + interval '100 milliseconds'
       from simulora.restore_proposals where id = $2`,
      [timedOutId, proposal.id],
    );
    await new Promise((resolve) => setTimeout(resolve, 150));

    const regenerated = await repository.prepareRestore(
      account,
      continuity.branchId,
      point.commitId,
    );
    expect(regenerated).toMatchObject({
      status: "ACTIVE",
      expectedHeadCommitId: changed.commit!.resultingHeadCommitId,
      digest: proposal.digest,
    });
    expect(regenerated.id).not.toBe(timedOutId);
    expect((await repository.readRestoreProposal(account, timedOutId)).status).toBe("EXPIRED");
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

  it("requires an exact Restore confirmation before a Restore Commit can exist", async () => {
    const continuity = await createContinuity();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: `db-confirmation-point-${randomUUID()}`,
      label: "Before direct SQL attack",
    });
    const changed = await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Change the signal before testing confirmation integrity.",
    );
    const proposal = await repository.prepareRestore(account, continuity.branchId, point.commitId);
    await pool.query("update simulora.restore_proposals set status = 'CONFIRMED' where id = $1", [
      proposal.id,
    ]);
    await expect(
      pool.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          source_type, reason, restore_proposal_id)
         values ($1, $2, $3, 'RESTORE_COMMITTED', $4, $5, 'USER', 'invalid', $6)`,
        [
          randomUUID(),
          continuity.branchId,
          changed.commit!.resultingHeadCommitId,
          account.accountId,
          randomUUID(),
          proposal.id,
        ],
      ),
    ).rejects.toThrow(/exact live confirmed proposal/);
  });

  it("binds immutable Restore review evidence and enforces live confirmation at Commit time", async () => {
    const continuity = await createContinuity();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: `db-review-point-${randomUUID()}`,
      label: "Before exact review attacks",
    });
    await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Change the signal before testing exact review evidence.",
    );
    const proposal = await repository.prepareRestore(account, continuity.branchId, point.commitId);

    await expect(
      pool.query(
        `insert into simulora.restore_proposals
         (id, continuity_id, branch_id, actor_account_id, source_commit_id,
          expected_head_commit_id, included_sections, excluded_sections, diff,
          proposal_digest, status, expires_at)
         select $1, continuity_id, branch_id, actor_account_id, source_commit_id,
                expected_head_commit_id, '["facts"]'::jsonb, excluded_sections, diff,
                proposal_digest, 'ACTIVE', expires_at
           from simulora.restore_proposals where id = $2`,
        [randomUUID(), proposal.id],
      ),
    ).rejects.toThrow(/exactly bind its scope, diff, hashes and digest/);
    await expect(
      pool.query(
        `insert into simulora.restore_proposals
         (id, continuity_id, branch_id, actor_account_id, source_commit_id,
          expected_head_commit_id, included_sections, excluded_sections, diff,
          proposal_digest, status, expires_at)
         select $1, continuity_id, branch_id, actor_account_id, source_commit_id,
                expected_head_commit_id, included_sections, excluded_sections,
                jsonb_set(diff, '{beforeHash}', to_jsonb(repeat('0', 64))),
                proposal_digest, 'ACTIVE', expires_at
           from simulora.restore_proposals where id = $2`,
        [randomUUID(), proposal.id],
      ),
    ).rejects.toThrow(/exactly bind its scope, diff, hashes and digest/);
    await expect(
      pool.query("delete from simulora.restore_proposals where id = $1", [proposal.id]),
    ).rejects.toThrow(/restore_proposals is immutable/);

    await pool.query("update simulora.restore_proposals set status = 'EXPIRED' where id = $1", [
      proposal.id,
    ]);
    const readExpiryProposalId = randomUUID();
    await pool.query(
      `insert into simulora.restore_proposals
       (id, continuity_id, branch_id, actor_account_id, source_commit_id,
        expected_head_commit_id, included_sections, excluded_sections, diff,
        proposal_digest, status, expires_at)
       select $1, continuity_id, branch_id, actor_account_id, source_commit_id,
              expected_head_commit_id, included_sections, excluded_sections, diff,
              proposal_digest, 'ACTIVE', clock_timestamp() + interval '100 milliseconds'
         from simulora.restore_proposals where id = $2`,
      [readExpiryProposalId, proposal.id],
    );
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect((await repository.readRestoreProposal(account, readExpiryProposalId)).status).toBe(
      "EXPIRED",
    );

    const expiringProposalId = randomUUID();
    await pool.query(
      `insert into simulora.restore_proposals
       (id, continuity_id, branch_id, actor_account_id, source_commit_id,
        expected_head_commit_id, included_sections, excluded_sections, diff,
        proposal_digest, status, expires_at)
       select $1, continuity_id, branch_id, actor_account_id, source_commit_id,
              expected_head_commit_id, included_sections, excluded_sections, diff,
              proposal_digest, 'ACTIVE', clock_timestamp() + interval '250 milliseconds'
         from simulora.restore_proposals where id = $2`,
      [expiringProposalId, proposal.id],
    );
    await expect(
      pool.query(
        `insert into simulora.restore_confirmations
         (id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id,
          confirmed_at)
         values ($1, $2, $3, $4, $5, clock_timestamp() + interval '1 minute')`,
        [
          randomUUID(),
          expiringProposalId,
          account.accountId,
          proposal.digest,
          proposal.expectedHeadCommitId,
        ],
      ),
    ).rejects.toThrow(/live expiry/);

    const confirmationId = randomUUID();
    await pool.query(
      `insert into simulora.restore_confirmations
       (id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
       values ($1, $2, $3, $4, $5)`,
      [
        confirmationId,
        expiringProposalId,
        account.accountId,
        proposal.digest,
        proposal.expectedHeadCommitId,
      ],
    );
    await pool.query("update simulora.restore_proposals set status = 'CONFIRMED' where id = $1", [
      expiringProposalId,
    ]);
    await expect(
      pool.query("update simulora.restore_confirmations set confirmed_at = now() where id = $1", [
        confirmationId,
      ]),
    ).rejects.toThrow(/restore_confirmations is immutable/);
    await expect(
      pool.query("delete from simulora.restore_confirmations where id = $1", [confirmationId]),
    ).rejects.toThrow(/restore_confirmations is immutable/);

    await new Promise((resolve) => setTimeout(resolve, 350));
    await expect(
      pool.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          source_type, reason, restore_proposal_id)
         values ($1, $2, $3, 'RESTORE_COMMITTED', $4, $5, 'USER', 'expired review', $6)`,
        [
          randomUUID(),
          continuity.branchId,
          proposal.expectedHeadCommitId,
          account.accountId,
          randomUUID(),
          expiringProposalId,
        ],
      ),
    ).rejects.toThrow(/exact live confirmed proposal/);
  });

  it("keeps expired prepare and confirm concurrency free of lock-order deadlocks", async () => {
    const continuity = await createContinuity();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: `deadlock-point-${randomUUID()}`,
      label: "Before lock ordering test",
    });
    await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Change the signal before testing Restore lock ordering.",
    );
    const proposal = await repository.prepareRestore(account, continuity.branchId, point.commitId);
    await pool.query("update simulora.restore_proposals set status = 'EXPIRED' where id = $1", [
      proposal.id,
    ]);
    const expiringId = randomUUID();
    await pool.query(
      `insert into simulora.restore_proposals
       (id, continuity_id, branch_id, actor_account_id, source_commit_id,
        expected_head_commit_id, included_sections, excluded_sections, diff,
        proposal_digest, status, expires_at)
       select $1, continuity_id, branch_id, actor_account_id, source_commit_id,
              expected_head_commit_id, included_sections, excluded_sections, diff,
              proposal_digest, 'ACTIVE', clock_timestamp() + interval '150 milliseconds'
         from simulora.restore_proposals where id = $2`,
      [expiringId, proposal.id],
    );
    await new Promise((resolve) => setTimeout(resolve, 200));

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const outcomes = await Promise.race([
      Promise.allSettled([
        repository.prepareRestore(account, continuity.branchId, point.commitId),
        repository.confirmRestore(account, continuity.branchId, {
          proposalId: expiringId,
          digest: proposal.digest,
          expectedHeadCommitId: proposal.expectedHeadCommitId,
        }),
      ]),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("Restore lock ordering timed out")), 5_000);
      }),
    ]).finally(() => clearTimeout(timeout));
    expect(
      outcomes.some(
        (outcome) =>
          outcome.status === "rejected" &&
          String(outcome.reason).toLowerCase().includes("deadlock detected"),
      ),
    ).toBe(false);
  });

  it("rejects a confirmed Restore that omits its append-only Event", async () => {
    const continuity = await createContinuity();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: `db-materialization-point-${randomUUID()}`,
      label: "Before materialization attack",
    });
    const changed = await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Change the signal before testing materialization integrity.",
    );
    const proposal = await repository.prepareRestore(account, continuity.branchId, point.commitId);
    const client = await pool.connect();
    try {
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      await client.query("begin");
      await client.query(
        `insert into simulora.restore_confirmations
         (id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
         values ($1, $2, $3, $4, $5)`,
        [
          randomUUID(),
          proposal.id,
          account.accountId,
          proposal.digest,
          proposal.expectedHeadCommitId,
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
         values ($1, $2, $3, 'RESTORE_COMMITTED', $4, $5, 'USER', 'invalid', $6)`,
        [
          commitId,
          continuity.branchId,
          changed.commit!.resultingHeadCommitId,
          account.accountId,
          stateRevisionId,
          proposal.id,
        ],
      );
      await client.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [
          stateRevisionId,
          continuity.branchId,
          commitId,
          JSON.stringify(continuity.state),
          contentHash(continuity.state),
        ],
      );
      await expect(client.query("commit")).rejects.toThrow(/linked STATE_RESTORED Event/);
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("rejects an otherwise exact Restore that does not advance the Branch head", async () => {
    const continuity = await createContinuity();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: `db-head-point-${randomUUID()}`,
      label: "Before missing head attack",
    });
    await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Change the signal before testing the Restore head invariant.",
    );
    const proposal = await repository.prepareRestore(account, continuity.branchId, point.commitId);
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const nextState = applyRestorableState(current.state, continuity.state);
    const client = await pool.connect();
    try {
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      await client.query("begin");
      await client.query(
        `insert into simulora.restore_confirmations
         (id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
         values ($1, $2, $3, $4, $5)`,
        [
          randomUUID(),
          proposal.id,
          account.accountId,
          proposal.digest,
          proposal.expectedHeadCommitId,
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
         values ($1, $2, $3, 'RESTORE_COMMITTED', $4, $5, 'USER', 'missing head', $6)`,
        [
          commitId,
          continuity.branchId,
          proposal.expectedHeadCommitId,
          account.accountId,
          stateRevisionId,
          proposal.id,
        ],
      );
      await client.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [
          stateRevisionId,
          continuity.branchId,
          commitId,
          JSON.stringify(nextState),
          contentHash(nextState),
        ],
      );
      await client.query(
        `insert into simulora.domain_events
         (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope)
         values ($1, $2, $3, 'STATE_RESTORED', $4::jsonb, 'USER', 'CONTINUITY_PRIVATE')`,
        [
          randomUUID(),
          continuity.branchId,
          commitId,
          JSON.stringify({
            restoreProposalId: proposal.id,
            sourceCommitId: point.commitId,
            includedSections: proposal.includedSections,
          }),
        ],
      );
      await expect(client.query("commit")).rejects.toThrow(/advanced Branch head/);
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("rejects Restore review and Commit creation outside an active current path", async () => {
    const reviewContinuity = await createContinuity();
    const reviewPoint = await repository.createRecoveryPoint(account, reviewContinuity.branchId, {
      idempotencyKey: `inactive-review-${randomUUID()}`,
      label: "Before inactive review",
    });
    await recordAction(
      reviewContinuity.branchId,
      reviewContinuity.headCommitId,
      "Change the signal before the inactive review attack.",
    );
    const reviewProposal = await repository.prepareRestore(
      account,
      reviewContinuity.branchId,
      reviewPoint.commitId,
    );
    await pool.query("update simulora.restore_proposals set status = 'EXPIRED' where id = $1", [
      reviewProposal.id,
    ]);
    await pool.query("update simulora.continuities set status = 'INITIALIZING' where id = $1", [
      reviewContinuity.continuityId,
    ]);
    await expect(
      pool.query(
        `insert into simulora.restore_proposals
         (id, continuity_id, branch_id, actor_account_id, source_commit_id,
          expected_head_commit_id, included_sections, excluded_sections, diff,
          proposal_digest, status, expires_at)
         select $1, continuity_id, branch_id, actor_account_id, source_commit_id,
                expected_head_commit_id, included_sections, excluded_sections, diff,
                proposal_digest, 'ACTIVE', clock_timestamp() + interval '1 minute'
           from simulora.restore_proposals where id = $2`,
        [randomUUID(), reviewProposal.id],
      ),
    ).rejects.toThrow(/exactly bind its scope, diff, hashes and digest/);

    const commitContinuity = await createContinuity();
    const commitPoint = await repository.createRecoveryPoint(account, commitContinuity.branchId, {
      idempotencyKey: `inactive-commit-${randomUUID()}`,
      label: "Before inactive Commit",
    });
    await recordAction(
      commitContinuity.branchId,
      commitContinuity.headCommitId,
      "Change the signal before the inactive Commit attack.",
    );
    const commitProposal = await repository.prepareRestore(
      account,
      commitContinuity.branchId,
      commitPoint.commitId,
    );
    await pool.query("update simulora.continuities set status = 'INITIALIZING' where id = $1", [
      commitContinuity.continuityId,
    ]);
    await pool.query(
      `insert into simulora.restore_confirmations
       (id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
       values ($1, $2, $3, $4, $5)`,
      [
        randomUUID(),
        commitProposal.id,
        account.accountId,
        commitProposal.digest,
        commitProposal.expectedHeadCommitId,
      ],
    );
    await pool.query("update simulora.restore_proposals set status = 'CONFIRMED' where id = $1", [
      commitProposal.id,
    ]);
    await expect(
      pool.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          source_type, reason, restore_proposal_id)
         values ($1, $2, $3, 'RESTORE_COMMITTED', $4, $5, 'USER', 'inactive path', $6)`,
        [
          randomUUID(),
          commitContinuity.branchId,
          commitProposal.expectedHeadCommitId,
          account.accountId,
          randomUUID(),
          commitProposal.id,
        ],
      ),
    ).rejects.toThrow(/exact live confirmed proposal/);
  });

  it("enforces reciprocal state hashes, Event ownership and immutable Branch lineage", async () => {
    const continuity = await createContinuity();
    const other = await createContinuity();
    const fork = await repository.forkBranch(account, continuity.continuityId, {
      idempotencyKey: `lineage-fork-${randomUUID()}`,
      name: "Immutable lineage",
      sourceCommitId: continuity.headCommitId,
      expectedHeadCommitId: continuity.headCommitId,
    });
    await expect(
      pool.query("update simulora.branches set continuity_id = $2 where id = $1", [
        fork.id,
        other.continuityId,
      ]),
    ).rejects.toThrow(/identity and lineage are immutable/);
    await expect(
      pool.query(
        `insert into simulora.world_commits
         (id, branch_id, kind, actor_account_id, state_revision_id, source_type, reason)
         values ($1, $2, 'CONTINUITY_INITIALIZED', $3, $4, 'SYSTEM', 'invalid reuse')`,
        [randomUUID(), continuity.branchId, account.accountId, continuity.stateRevisionId],
      ),
    ).rejects.toThrow(/commits_one_initialization_per_branch_idx/);
    await expect(
      pool.query(
        `insert into simulora.domain_events
         (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope)
         values ($1, $2, $3, 'INVALID_EVENT', '{}'::jsonb, 'SYSTEM', 'ACCOUNT_PRIVATE')`,
        [randomUUID(), fork.id, continuity.headCommitId],
      ),
    ).rejects.toThrow(/must belong to its Commit Branch/);

    const client = await pool.connect();
    try {
      const continuityId = randomUUID();
      const branchId = randomUUID();
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      await client.query("begin");
      await client.query(
        `insert into simulora.continuities
         (id, owner_account_id, world_revision_id, status)
         select $1, owner_account_id, world_revision_id, 'INITIALIZING'
         from simulora.continuities where id = $2`,
        [continuityId, continuity.continuityId],
      );
      await client.query(
        `insert into simulora.branches (id, continuity_id, name, status)
         values ($1, $2, 'Invalid hash fixture', 'INITIALIZING')`,
        [branchId, continuityId],
      );
      await client.query(
        `insert into simulora.world_commits
         (id, branch_id, kind, actor_account_id, state_revision_id, source_type, reason)
         values ($1, $2, 'CONTINUITY_INITIALIZED', $3, $4, 'SYSTEM', 'invalid hash')`,
        [commitId, branchId, account.accountId, stateRevisionId],
      );
      await expect(
        client.query(
          `insert into simulora.state_revisions
           (id, branch_id, commit_id, schema_version, document, document_hash)
           values ($1, $2, $3, 1, $4::jsonb, $5)`,
          [stateRevisionId, branchId, commitId, JSON.stringify(continuity.state), "0".repeat(64)],
        ),
      ).rejects.toThrow(/state_revision_document_hash_matches/);
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("requires one root initialization and exact fork provenance", async () => {
    const continuity = await createContinuity();
    const fork = await repository.forkBranch(account, continuity.continuityId, {
      idempotencyKey: `strict-lineage-${randomUUID()}`,
      name: "Strict lineage",
      sourceCommitId: continuity.headCommitId,
      expectedHeadCommitId: continuity.headCommitId,
    });
    await expect(
      pool.query(
        `insert into simulora.branches (id, continuity_id, name, status)
         values ($1, $2, 'Second root', 'INITIALIZING')`,
        [randomUUID(), continuity.continuityId],
      ),
    ).rejects.toThrow(/branches_one_root_per_continuity_idx/);
    await expect(
      pool.query(
        `insert into simulora.world_commits
         (id, branch_id, kind, actor_account_id, state_revision_id, source_type, reason)
         values ($1, $2, 'CONTINUITY_INITIALIZED', $3, $4, 'SYSTEM', 'invalid fork init')`,
        [randomUUID(), fork.id, account.accountId, randomUUID()],
      ),
    ).rejects.toThrow(/single root Branch/);
    await expect(
      pool.query(
        `insert into simulora.world_commits
         (id, branch_id, kind, actor_account_id, state_revision_id, source_type, reason)
         values ($1, $2, 'BRANCH_FORK', $3, $4, 'USER', 'missing lineage')`,
        [randomUUID(), continuity.branchId, account.accountId, randomUUID()],
      ),
    ).rejects.toThrow(/complete declared source lineage/);

    const client = await pool.connect();
    try {
      const branchId = randomUUID();
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      await client.query("begin");
      await client.query(
        `insert into simulora.branches
         (id, continuity_id, name, status, parent_branch_id, fork_source_commit_id,
          created_by_account_id, idempotency_key)
         values ($1, $2, 'Missing event fork', 'INITIALIZING', $3, $4, $5, $6)`,
        [
          branchId,
          continuity.continuityId,
          continuity.branchId,
          continuity.headCommitId,
          account.accountId,
          `missing-event-${randomUUID()}`,
        ],
      );
      await client.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          source_type, reason)
         values ($1, $2, $3, 'BRANCH_FORK', $4, $5, 'USER', 'missing event')`,
        [commitId, branchId, continuity.headCommitId, account.accountId, stateRevisionId],
      );
      await client.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [
          stateRevisionId,
          branchId,
          commitId,
          JSON.stringify(continuity.state),
          contentHash(continuity.state),
        ],
      );
      await expect(client.query("commit")).rejects.toThrow(/one linked BRANCH_FORKED Event/);
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("rejects a destructive Branch-head rewind to an earlier same-Branch Commit", async () => {
    const continuity = await createContinuity();
    await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Advance the Branch before attempting a direct rewind.",
    );
    await expect(
      pool.query(
        `update simulora.branches
            set head_commit_id = $2, head_state_revision_id = $3
          where id = $1`,
        [continuity.branchId, continuity.headCommitId, continuity.stateRevisionId],
      ),
    ).rejects.toThrow(/only advance to a direct child Commit/);
  });

  it("rejects lifecycle reset paths that could reinstall an earlier Branch head", async () => {
    const continuity = await createContinuity();
    await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Advance before attempting a lifecycle reset.",
    );

    await expect(
      pool.query("update simulora.continuities set status = 'INITIALIZING' where id = $1", [
        continuity.continuityId,
      ]),
    ).rejects.toThrow(/Continuity lifecycle cannot return to initialization/);
    await expect(
      pool.query("update simulora.branches set status = 'INITIALIZING' where id = $1", [
        continuity.branchId,
      ]),
    ).rejects.toThrow(/Branch lifecycle cannot return to initialization/);
    await expect(
      pool.query(
        `update simulora.branches
            set status = 'INITIALIZING', head_commit_id = null, head_state_revision_id = null
          where id = $1`,
        [continuity.branchId],
      ),
    ).rejects.toThrow(/Branch lifecycle cannot return|Branch heads cannot be cleared/);

    const current = await repository.readCurrentState(account, continuity.continuityId);
    expect(current.headCommitId).not.toBe(continuity.headCommitId);
  });

  it("keeps Continuity ownership and its authorized pinned World Revision immutable", async () => {
    const continuity = await createContinuity();
    const otherDraft = await repository.createWorld(otherAccount, lanternReachSeed);
    const otherRevision = await repository.createRevision(
      otherAccount,
      otherDraft.worldId,
      otherDraft.rowVersion,
    );

    await expect(
      pool.query("update simulora.continuities set owner_account_id = $2 where id = $1", [
        continuity.continuityId,
        otherAccount.accountId,
      ]),
    ).rejects.toThrow(/Continuity ownership.*immutable/);
    await expect(
      pool.query("update simulora.continuities set world_revision_id = $2 where id = $1", [
        continuity.continuityId,
        otherRevision.revisionId,
      ]),
    ).rejects.toThrow(/pinned World Revision.*immutable/);
    await expect(
      pool.query("update simulora.worlds set owner_account_id = $2 where id = $1", [
        otherDraft.worldId,
        account.accountId,
      ]),
    ).rejects.toThrow(/World ownership and identity are immutable/);
    await expect(
      repository.startContinuity(account, otherRevision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      }),
    ).rejects.toThrow(NotFoundError);

    expect(
      (await repository.readCurrentState(account, continuity.continuityId)).worldRevisionId,
    ).toBe(continuity.worldRevisionId);
    await expect(
      repository.readCurrentState(otherAccount, continuity.continuityId),
    ).rejects.toThrow(NotFoundError);
  });

  it("returns the original fork for a same-key retry after the active head advances", async () => {
    const continuity = await createContinuity();
    const idempotencyKey = `fork-head-retry-${randomUUID()}`;
    const fork = await repository.forkBranch(account, continuity.continuityId, {
      idempotencyKey,
      name: "Retry-safe fork",
      sourceCommitId: continuity.headCommitId,
      expectedHeadCommitId: continuity.headCommitId,
    });
    await recordAction(
      continuity.branchId,
      continuity.headCommitId,
      "Advance the active head after the fork response is lost.",
    );
    const retry = await repository.forkBranch(account, continuity.continuityId, {
      idempotencyKey,
      name: "Retry-safe fork",
      sourceCommitId: continuity.headCommitId,
      expectedHeadCommitId: continuity.headCommitId,
    });
    expect(retry.id).toBe(fork.id);
  });
});
