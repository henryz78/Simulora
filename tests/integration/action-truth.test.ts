import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import { AuthoritativeWorldRepository } from "../../packages/database/src/index.js";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const account = {
  accountId: "20000000-0000-4000-8000-000000000001",
  eligibility: "adult" as const,
};

function pglitePool(database: PGlite): Pool {
  const query = (text: string, values?: unknown[]) => database.query(text, values);
  return {
    query,
    connect: () =>
      Promise.resolve({
        query,
        release: () => undefined,
      }),
    end: () => Promise.resolve(),
  } as unknown as Pool;
}

describe.sequential("IP-3 Action Truth against PostgreSQL-compatible storage", () => {
  const database = new PGlite();
  const pool = pglitePool(database);
  const repository = new AuthoritativeWorldRepository(pool);
  const gateway = new DeterministicModelGateway();
  let continuity: Awaited<ReturnType<AuthoritativeWorldRepository["startContinuity"]>>;

  beforeAll(async () => {
    const migrationsDirectory = path.join(repositoryRoot, "db", "migrations");
    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    for (const file of files) {
      await database.exec(await readFile(path.join(migrationsDirectory, file), "utf8"));
    }
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
  });

  afterAll(async () => database.close());

  it("keeps acknowledgement and provisional output non-authoritative until exact confirmation", async () => {
    const submitted = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: "action-truth-first",
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Relight the western signal with Iora.",
    });
    expect(submitted.status).toBe("ACKNOWLEDGED");
    expect(submitted.commit).toBeNull();

    const duplicate = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: "action-truth-first",
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "This duplicate body must not create another Action.",
    });
    expect(duplicate.id).toBe(submitted.id);

    const proposed = await repository.processAction(
      submitted.id,
      (request) => gateway.generateWorldTurn(request),
      "test-worker",
    );
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
    expect(confirmed.commit?.resultingHeadCommitId).not.toBe(continuity.headCommitId);
    const duplicateConfirmation = await repository.confirmAction(account, submitted.id, {
      proposalId: proposed!.proposal!.id,
      proposalDigest: proposed!.proposal!.digest,
      expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
    });
    expect(duplicateConfirmation.commit?.id).toBe(confirmed.commit?.id);
    await expect(
      repository.confirmAction(account, submitted.id, {
        proposalId: proposed!.proposal!.id,
        proposalDigest: "e".repeat(64),
        expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
      }),
    ).rejects.toThrow(/CONFIRMATION_EXPIRED_OR_PROPOSAL_CHANGED/);
    const afterConfirmation = await repository.readCurrentState(account, continuity.continuityId);
    expect(afterConfirmation.headCommitId).toBe(confirmed.commit?.resultingHeadCommitId);
    expect(afterConfirmation.state.participation).toEqual(continuity.state.participation);

    const counts = await database.query<{ action_count: number; commit_count: number }>(`
      select
        (select count(*)::int from simulora.actions where idempotency_key = 'action-truth-first') as action_count,
        (select count(*)::int from simulora.world_commits where action_id = '${submitted.id}') as commit_count
    `);
    expect(counts.rows[0]).toEqual({ action_count: 1, commit_count: 1 });
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
    await database.query(
      "update simulora.actions set acknowledged_at = now() - interval '11 seconds' where id = $1",
      [pending.id],
    );
    const restartedRepository = new AuthoritativeWorldRepository(pool);
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
    const commits = await database.query<{ count: number }>(
      "select count(*)::int as count from simulora.world_commits where action_id = $1",
      [pending.id],
    );
    expect(commits.rows[0]?.count).toBe(0);
  });

  it("turns a head change after proposal into a conflict without a second mutation", async () => {
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const input = (key: string, intent: string) => ({
      schemaVersion: 1 as const,
      idempotencyKey: key,
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent,
    });
    const first = await repository.submitAction(
      account,
      current.branchId,
      input("action-race-first", "Turn the lens toward the harbor mouth."),
    );
    const second = await repository.submitAction(
      account,
      current.branchId,
      input("action-race-second", "Turn the lens toward the western shoal."),
    );
    const [firstProposal, secondProposal] = await Promise.all([
      repository.processAction(
        first.id,
        (request) => gateway.generateWorldTurn(request),
        "worker-a",
      ),
      repository.processAction(
        second.id,
        (request) => gateway.generateWorldTurn(request),
        "worker-b",
      ),
    ]);
    const firstCommit = await repository.confirmAction(account, first.id, {
      proposalId: firstProposal!.proposal!.id,
      proposalDigest: firstProposal!.proposal!.digest,
      expectedHeadCommitId: firstProposal!.proposal!.expectedHeadCommitId,
    });
    const conflicted = await repository.confirmAction(account, second.id, {
      proposalId: secondProposal!.proposal!.id,
      proposalDigest: secondProposal!.proposal!.digest,
      expectedHeadCommitId: secondProposal!.proposal!.expectedHeadCommitId,
    });
    expect(firstCommit.status).toBe("COMMITTED");
    expect(conflicted.status).toBe("CONFLICT");
    expect((await repository.readProgress(account, second.id, 0)).terminal).toBe(true);
    const conflictCommit = await database.query<{ count: number }>(
      "select count(*)::int as count from simulora.world_commits where action_id = $1",
      [second.id],
    );
    expect(conflictCommit.rows[0]?.count).toBe(0);
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
    const count = await database.query<{ count: number }>(
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
