import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  ActionTruthService,
  WorldContinuityService,
} from "../../packages/application/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import { lanternReachSeed, type WorldDocument } from "../../packages/domain/src/index.js";
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
  accountId: "40000000-0000-4000-8000-000000000001",
  eligibility: "adult",
};
const otherAccount: SyntheticAccount = {
  accountId: "40000000-0000-4000-8000-000000000002",
  eligibility: "adult",
};

suite("IP-4 Return, Continuity and direct correction against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  let app: Awaited<ReturnType<typeof createApiApp>> | undefined;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(repositoryRoot, "db", "migrations"));
    pool = createDatabasePool(connectionString, { max: 16 });
    repository = new AuthoritativeWorldRepository(pool);
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  afterAll(async () => {
    await pool?.end();
  });

  async function createContinuity(world: WorldDocument = lanternReachSeed) {
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    return repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
  }

  async function process(action: ActionRecord): Promise<ActionRecord> {
    const result = await repository.processAction(
      action.id,
      (request) => gateway.generateWorldTurn(request),
      `ip4-test-worker-${randomUUID()}`,
    );
    if (!result?.proposal) throw new Error("Expected deterministic proposal");
    return result;
  }

  async function confirm(action: ActionRecord): Promise<ActionRecord> {
    if (!action.proposal) throw new Error("Expected exact proposal");
    return repository.confirmAction(account, action.id, {
      proposalId: action.proposal.id,
      proposalDigest: action.proposal.digest,
      expectedHeadCommitId: action.proposal.expectedHeadCommitId,
    });
  }

  it.each(["CORRECT_CONTINUITY", "REMOVE_CONTINUITY"] as const)(
    "derives Return's current situation from source-head facts after %s and later Actions",
    async (operation) => {
      const continuity = await createContinuity();
      const fact = continuity.state.facts[0]!;
      const statement = "The western signal is steady green.";
      const correction = await repository.submitCorrection(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: randomUUID(),
        expectedHeadCommitId: continuity.headCommitId,
        target: { type: "fact", id: fact.id },
        operation,
        before: { statement: fact.statement, scope: fact.scope },
        ...(operation === "CORRECT_CONTINUITY" ? { after: { statement } } : {}),
        reason: "The keeper checked the signal directly.",
      });
      await confirm(correction);
      const corrected = await repository.readCurrentState(account, continuity.continuityId);
      const expectedSituation =
        operation === "CORRECT_CONTINUITY" ? statement : corrected.state.worldClock.label;
      const stale = await repository.readOrientation(account, continuity.continuityId);
      expect(stale.current.situation).toBe(fact.statement);
      expect(stale.freshness.status).toBe("STALE");
      expect(stale.freshness.sourceHeadCommitId).toBe(continuity.headCommitId);
      expect(stale.freshness.currentHeadCommitId).toBe(corrected.headCommitId);
      expect(
        (await repository.rebuildReturnOrientation(account, continuity.branchId)).current.situation,
      ).toBe(expectedSituation);

      // Move the correction outside the bounded ten-Commit Return trace.
      if (operation === "CORRECT_CONTINUITY") {
        for (let turn = 0; turn < 11; turn++) {
          const current = await repository.readCurrentState(account, continuity.continuityId);
          const action = await repository.submitAction(account, continuity.branchId, {
            schemaVersion: 1,
            idempotencyKey: randomUUID(),
            expectedHeadCommitId: current.headCommitId,
            participationExpectation: current.state.participation,
            intent: "Inspect the steady green signal.",
          });
          const proposed = await repository.processAction(
            action.id,
            (request) => {
              const narrative = "The world shows the signal holding steady green.";
              const responseSource = request.character
                ? ({ type: "CHARACTER", characterId: request.character.id } as const)
                : ({ type: "WORLD" } as const);
              return Promise.resolve({
                narrative,
                responseSource,
                candidate: {
                  schemaVersion: 1,
                  actionId: request.actionId,
                  expectedHeadCommitId: request.expectedHeadCommitId,
                  narrative,
                  responseSource,
                  operation: {
                    type: "UPDATE_CANONICAL_FACT",
                    targetFactId: request.targetFact.id,
                    beforeStatement: request.targetFact.statement,
                    afterStatement: statement,
                    scope: request.targetFact.scope,
                    provenance: `Confirmed Action ${request.actionId}`,
                  },
                },
              });
            },
            `return-worker-${randomUUID()}`,
          );
          if (!proposed?.proposal)
            throw new Error(`Expected a provisional inspection: ${proposed?.statusReason}`);
          expect(
            (await repository.readCurrentState(account, continuity.continuityId)).headCommitId,
          ).toBe(current.headCommitId);
          expect(
            (await repository.readOrientation(account, continuity.continuityId)).current.situation,
          ).toBe(statement);
          await confirm(proposed);
        }
      }
      const rebuilt = await repository.rebuildReturnOrientation(account, continuity.branchId);
      const current = await repository.readCurrentState(account, continuity.continuityId);
      expect(rebuilt.current.situation).toBe(expectedSituation);
      expect(rebuilt.freshness).toMatchObject({
        status: "FRESH",
        sourceHeadCommitId: current.headCommitId,
        currentHeadCommitId: current.headCommitId,
      });
      expect(
        (await repository.readOrientation(account, continuity.continuityId)).current.situation,
      ).toBe(expectedSituation);
      expect(current.state.openThreads[0]).toBe(continuity.state.openThreads[0]);
      const restore = await repository.prepareRestore(
        account,
        continuity.branchId,
        continuity.headCommitId,
      );
      await repository.confirmRestore(account, continuity.branchId, {
        proposalId: restore.id,
        digest: restore.digest,
        expectedHeadCommitId: restore.expectedHeadCommitId,
      });
      const restored = await repository.rebuildReturnOrientation(account, continuity.branchId);
      expect(restored.current.situation).toBe(fact.statement);
      expect(restored.freshness.sourceHeadCommitId).not.toBe(continuity.headCommitId);
    },
    30_000,
  );

  it("does not promote a private fact into the shared current-situation lead", async () => {
    const continuity = await createContinuity({
      ...lanternReachSeed,
      facts: [
        {
          id: "fact.private-return",
          statement: "A private note stays outside the shared lead.",
          scope: "ACCOUNT_PRIVATE",
          provenance: "Synthetic private fixture",
          lifecycle: "ACTIVE",
        },
        ...lanternReachSeed.facts,
      ],
    });
    const orientation = await repository.rebuildReturnOrientation(account, continuity.branchId);
    expect(orientation.current.situation).toBe(lanternReachSeed.facts[0]!.statement);
    expect(
      (await repository.readOrientation(account, continuity.continuityId)).current.situation,
    ).toBe(orientation.current.situation);
  });

  it.each([
    { operation: "CORRECT_CONTINUITY" as const, fail: false },
    { operation: "REMOVE_CONTINUITY" as const, fail: false },
    { operation: "CORRECT_CONTINUITY" as const, fail: true },
    { operation: "REMOVE_CONTINUITY" as const, fail: true },
  ])(
    "fences an in-flight callback after a direct change: $operation, failure=$fail",
    async ({ operation, fail }) => {
      const continuity = await createContinuity();
      const fact = continuity.state.facts[0]!;
      const pending = await repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `in-flight-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "Inspect the western signal.",
      });
      let entered!: () => void;
      let release!: () => void;
      const started = new Promise<void>((resolve) => {
        entered = resolve;
      });
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const processing = repository.processAction(
        pending.id,
        async (request) => {
          entered();
          await gate;
          if (fail) throw new Error("Late generator failure");
          return gateway.generateWorldTurn(request);
        },
        `in-flight-worker-${randomUUID()}`,
      );
      await started;
      try {
        const correction = await repository.submitCorrection(account, continuity.branchId, {
          schemaVersion: 1,
          idempotencyKey: `in-flight-direct-${randomUUID()}`,
          expectedHeadCommitId: continuity.headCommitId,
          target: { type: "fact", id: fact.id },
          operation,
          before: { statement: fact.statement, scope: fact.scope },
          ...(operation === "CORRECT_CONTINUITY"
            ? { after: { statement: "The signal is steady." } }
            : {}),
          reason: "Directly verified while the earlier generation was running.",
        });
        await confirm(correction);
      } finally {
        release();
      }
      const result = await processing;
      expect(result).toMatchObject({ status: "CONFLICT", proposal: null, commit: null });
      const evidence = await pool.query<{
        job_status: string;
        attempt_status: string;
        proposals: number;
      }>(
        `select job.status as job_status, attempt.status as attempt_status,
              (select count(*)::integer from simulora.action_proposals where action_id = $1) as proposals
         from simulora.durable_jobs job
         join simulora.generation_attempts attempt on attempt.action_id = job.action_id
        where job.action_id = $1`,
        [pending.id],
      );
      expect(evidence.rows).toEqual([
        { job_status: "DEAD", attempt_status: "FAILED", proposals: 0 },
      ]);
      const current = await repository.readCurrentState(account, continuity.continuityId);
      expect(current.headCommitId).not.toBe(continuity.headCommitId);
      expect(current.state.facts.find((item) => item.id === fact.id)?.lifecycle).toBe(
        operation === "REMOVE_CONTINUITY" ? "REMOVED" : "ACTIVE",
      );
      if (operation === "CORRECT_CONTINUITY") {
        expect(current.state.facts.find((item) => item.id === fact.id)?.statement).toBe(
          "The signal is steady.",
        );
      }
    },
  );

  it.each([false, true])(
    "locks Continuity before Branch in a callback, failure=%s",
    async (fail) => {
      const continuity = await createContinuity();
      const pending = await repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: randomUUID(),
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "Inspect the signal.",
      });
      let entered!: () => void;
      let release!: () => void;
      const started = new Promise<void>((resolve) => {
        entered = resolve;
      });
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const processing = repository.processAction(
        pending.id,
        async (request) => {
          entered();
          await gate;
          if (fail) throw new Error("Generator failed");
          return gateway.generateWorldTurn(request);
        },
        "lock-order-worker",
      );
      await started;
      const recovery = await pool.connect();
      try {
        await recovery.query("begin");
        await recovery.query("set local lock_timeout = '3s'");
        await recovery.query("select id from simulora.continuities where id = $1 for update", [
          continuity.continuityId,
        ]);
        release();
        // Wait for the callback to block on this transaction's Continuity lock.
        // No timing assumption: inspect PostgreSQL's actual blocking graph.
        let blocked = false;
        for (let attempt = 0; attempt < 100 && !blocked; attempt++) {
          await recovery.query("select pg_stat_clear_snapshot()");
          const waiting = await recovery.query<{ blocked: boolean }>(
            `select exists (select 1 from pg_stat_activity
            where pid <> pg_backend_pid()
              and pg_backend_pid() = any(pg_blocking_pids(pid))) as blocked`,
          );
          blocked = waiting.rows[0]!.blocked;
          if (!blocked) await new Promise((resolve) => setTimeout(resolve, 10));
        }
        expect(blocked).toBe(true);
        await recovery.query("select id from simulora.branches where id = $1 for update", [
          continuity.branchId,
        ]);
        await recovery.query("commit");
      } finally {
        await recovery.query("rollback");
        recovery.release();
        release();
        await processing;
      }
      expect((await repository.readAction(account, pending.id)).status).toBe(
        fail ? "GENERATING" : "AWAITING_CONFIRMATION",
      );
    },
  );

  it("serves repository-backed Return/Trace/Explanation routes and marks projection freshness honestly", async () => {
    const continuity = await createContinuity();
    let authenticated = account;
    const auth: AuthPort = {
      authenticate: () => Promise.resolve(authenticated),
    };
    app = createApiApp({
      logLevel: "error",
      auth,
      worldService: new WorldContinuityService(repository),
      actionService: new ActionTruthService(repository),
    });

    const initialOrientation = await app.inject({
      method: "GET",
      url: `/v1/continuities/${continuity.continuityId}/orientation`,
    });
    expect(initialOrientation.statusCode).toBe(200);
    expect(initialOrientation.json()).toMatchObject({
      continuity: { id: continuity.continuityId, branchId: continuity.branchId },
      freshness: {
        sourceHeadCommitId: continuity.headCommitId,
        currentHeadCommitId: continuity.headCommitId,
        status: "FRESH",
        headDistance: 0,
      },
    });

    const stateAlias = await app.inject({
      method: "GET",
      url: `/v1/branches/${continuity.branchId}/state`,
    });
    expect(stateAlias.statusCode).toBe(200);
    expect(stateAlias.json().continuity.headCommitId).toBe(continuity.headCommitId);

    const fact = continuity.state.facts[0]!;
    const initialExplanation = await app.inject({
      method: "GET",
      url: `/v1/branches/${continuity.branchId}/explanations/fact/${encodeURIComponent(fact.id)}`,
    });
    expect(initialExplanation.statusCode).toBe(200);
    expect(initialExplanation.json()).toMatchObject({
      target: { type: "fact", id: fact.id, lifecycle: "ACTIVE", current: true },
      scope: fact.scope,
      correction: {
        availableOperations: ["CORRECT_CONTINUITY", "REMOVE_CONTINUITY"],
        requiresExactConfirmation: true,
      },
    });

    const trace = await app.inject({
      method: "GET",
      url: `/v1/branches/${continuity.branchId}/commits?limit=1`,
    });
    expect(trace.statusCode).toBe(200);
    expect(trace.json().commits).toHaveLength(1);
    expect(trace.json().commits[0].kind).toBe("CONTINUITY_INITIALIZED");

    const correctionRequest = {
      schemaVersion: 1,
      idempotencyKey: `api-correction-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "CORRECT_CONTINUITY" as const,
      before: { statement: fact.statement, scope: fact.scope },
      after: { statement: "The western signal is steady." },
      reason: "The keeper checked the instrument log.",
    };
    const submitted = await app.inject({
      method: "POST",
      url: `/v1/branches/${continuity.branchId}/corrections`,
      payload: correctionRequest,
    });
    expect(submitted.statusCode).toBe(201);
    expect(submitted.json()).toMatchObject({
      operationType: "CORRECT_CONTINUITY",
      status: "AWAITING_CONFIRMATION",
      commit: null,
      proposal: { impact: "L3" },
    });
    const directActionId = submitted.json().id as string;
    const directAction = await repository.readAction(account, directActionId);
    expect(directAction.proposal).not.toBeNull();
    const jobs = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.durable_jobs where action_id = $1",
      [directActionId],
    );
    expect(jobs.rows[0]?.count).toBe(0);

    const confirmed = await app.inject({
      method: "POST",
      url: `/v1/actions/${directActionId}/confirm`,
      payload: {
        proposalId: directAction.proposal!.id,
        proposalDigest: directAction.proposal!.digest,
        expectedHeadCommitId: directAction.proposal!.expectedHeadCommitId,
      },
    });
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json()).toMatchObject({
      operationType: "CORRECT_CONTINUITY",
      status: "COMMITTED",
      commit: { resultingHeadCommitId: expect.any(String) },
    });
    const newHead = confirmed.json().commit.resultingHeadCommitId as string;

    const staleOrientation = await app.inject({
      method: "GET",
      url: `/v1/continuities/${continuity.continuityId}/orientation`,
    });
    expect(staleOrientation.statusCode).toBe(200);
    expect(staleOrientation.json().freshness).toMatchObject({
      sourceHeadCommitId: continuity.headCommitId,
      currentHeadCommitId: newHead,
      status: "STALE",
      headDistance: 1,
    });
    expect(staleOrientation.json().authoritativeFallback).toMatchObject({
      headCommitId: newHead,
    });

    const rebuilt = await repository.rebuildReturnOrientation(account, continuity.branchId);
    expect(rebuilt.freshness).toMatchObject({
      sourceHeadCommitId: newHead,
      currentHeadCommitId: newHead,
      status: "FRESH",
      headDistance: 0,
    });
    expect(rebuilt.recentChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "CONTINUITY_ITEM_CORRECTED",
          commitId: newHead,
          sourceClass: "USER",
          scope: fact.scope,
        }),
      ]),
    );
    expect(rebuilt.current.situation).not.toContain(fact.statement);

    const explanation = await app.inject({
      method: "GET",
      url: `/v1/branches/${continuity.branchId}/explanations/fact/${encodeURIComponent(fact.id)}`,
    });
    expect(explanation.statusCode).toBe(200);
    expect(explanation.json()).toMatchObject({
      target: {
        id: fact.id,
        statement: "The western signal is steady.",
        lifecycle: "ACTIVE",
        current: true,
      },
      source: { class: "USER", commitId: newHead },
      freshness: { sourceHeadCommitId: newHead, currentHeadCommitId: newHead, status: "FRESH" },
    });

    const current = await repository.readCurrentState(account, continuity.continuityId);
    expect(current.state.worldClock).toEqual(continuity.state.worldClock);
    expect(current.state.participation).toEqual(continuity.state.participation);
    expect(current.state.characters).toEqual(continuity.state.characters);
    expect(current.state.relationships).toEqual(continuity.state.relationships);
    expect(current.state.openThreads).toEqual(continuity.state.openThreads);
    expect(current.world).toEqual(continuity.world);
    expect(current.worldRevisionId).toBe(continuity.worldRevisionId);
    expect(current.state.facts).toHaveLength(continuity.state.facts.length);
    expect(current.state.facts[0]).toMatchObject({
      id: fact.id,
      statement: "The western signal is steady.",
      scope: fact.scope,
      lifecycle: "ACTIVE",
    });

    const oldRevision = await pool.query<{ document: { facts: Array<{ statement: string }> } }>(
      "select document from simulora.state_revisions where id = $1",
      [continuity.stateRevisionId],
    );
    expect(oldRevision.rows[0]?.document.facts[0]?.statement).toBe(fact.statement);
    await expect(
      pool.query("update simulora.state_revisions set document = '{}'::jsonb where id = $1", [
        continuity.stateRevisionId,
      ]),
    ).rejects.toThrow(/immutable/);

    authenticated = otherAccount;
    const deniedTrace = await app.inject({
      method: "GET",
      url: `/v1/branches/${continuity.branchId}/commits`,
    });
    const deniedExplanation = await app.inject({
      method: "GET",
      url: `/v1/branches/${continuity.branchId}/explanations/fact/${encodeURIComponent(fact.id)}`,
    });
    expect(deniedTrace.statusCode).toBe(404);
    expect(deniedExplanation.statusCode).toBe(404);
  });

  it("keeps an older participation Action pending across correction, then conflicts it at the changed head", async () => {
    const continuity = await createContinuity();
    const pending = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `pending-before-correction-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Inspect the signal before changing the record.",
    });
    const proposed = await process(pending);
    const fact = continuity.state.facts[0]!;
    const correction = await repository.submitCorrection(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `correction-before-pending-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "CORRECT_CONTINUITY",
      before: { statement: fact.statement, scope: fact.scope },
      after: { statement: "The western signal is steady." },
      reason: "The instrument log was checked.",
    });
    const corrected = await confirm(correction);
    expect(corrected.status).toBe("COMMITTED");

    const afterCorrection = await repository.readOrientation(account, continuity.continuityId);
    expect(afterCorrection.pendingActions).toEqual([
      expect.objectContaining({
        id: pending.id,
        operationType: "PARTICIPATE",
        status: "AWAITING_CONFIRMATION",
        expectedHeadCommitId: continuity.headCommitId,
      }),
    ]);
    const conflicted = await repository.confirmAction(account, pending.id, {
      proposalId: proposed.proposal!.id,
      proposalDigest: proposed.proposal!.digest,
      expectedHeadCommitId: proposed.proposal!.expectedHeadCommitId,
    });
    expect(conflicted.status).toBe("CONFLICT");
    expect(conflicted.commit).toBeNull();
    expect(conflicted.proposal).toBeNull();
    const invalidated = await pool.query<{ status: string }>(
      "select status from simulora.action_proposals where action_id = $1",
      [pending.id],
    );
    expect(invalidated.rows[0]?.status).toBe("REJECTED");
    const commits = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.world_commits where branch_id = $1 and action_id is not null",
      [continuity.branchId],
    );
    expect(commits.rows[0]?.count).toBe(1);
  });

  it("removes the last fact as a tombstone and rejects new deterministic Actions before ACK/job creation", async () => {
    const continuity = await createContinuity();
    const fact = continuity.state.facts[0]!;
    const removal = await repository.submitCorrection(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `remove-last-fact-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "REMOVE_CONTINUITY",
      before: { statement: fact.statement, scope: fact.scope },
      reason: "The fact was obsolete.",
    });
    const removed = await confirm(removal);
    expect(removed.status).toBe("COMMITTED");
    const current = await repository.readCurrentState(account, continuity.continuityId);
    expect(current.state.facts).toEqual([
      expect.objectContaining({
        id: fact.id,
        statement: fact.statement,
        lifecycle: "REMOVED",
        removalReason: "The fact was obsolete.",
      }),
    ]);
    expect(current.state.facts.some((item) => item.lifecycle === "ACTIVE")).toBe(false);

    const countBefore = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.actions where branch_id = $1",
      [continuity.branchId],
    );
    await expect(
      repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `after-last-fact-${randomUUID()}`,
        expectedHeadCommitId: current.headCommitId,
        participationExpectation: current.state.participation,
        intent: "Continue after the last fact was removed.",
      }),
    ).rejects.toMatchObject(new ConflictError("NO_ACTIVE_CANONICAL_FACT"));
    const countAfter = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.actions where branch_id = $1",
      [continuity.branchId],
    );
    expect(countAfter.rows[0]?.count).toBe(countBefore.rows[0]?.count);
    const jobs = await pool.query<{ count: number }>(
      `select count(*)::int as count from simulora.durable_jobs j
       join simulora.actions a on a.id = j.action_id where a.branch_id = $1`,
      [continuity.branchId],
    );
    expect(jobs.rows[0]?.count).toBe(0);

    const explanation = await repository.readExplanation(
      account,
      continuity.branchId,
      "fact",
      fact.id,
    );
    expect(explanation.target).toMatchObject({
      id: fact.id,
      statement: fact.statement,
      lifecycle: "REMOVED",
      current: false,
    });
    expect(explanation.correction.availableOperations).toEqual([]);
    await expect(
      repository.submitCorrection(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `remove-removed-fact-${randomUUID()}`,
        expectedHeadCommitId: current.headCommitId,
        target: { type: "fact", id: fact.id },
        operation: "REMOVE_CONTINUITY",
        before: { statement: fact.statement, scope: fact.scope },
        reason: "A second removal must not be recovery.",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("resolves an already acknowledged no-active attempt explicitly without retrying forever", async () => {
    const continuity = await createContinuity();
    const fact = continuity.state.facts[0]!;
    const removal = await repository.submitCorrection(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `remove-before-fixture-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "REMOVE_CONTINUITY",
      before: { statement: fact.statement, scope: fact.scope },
      reason: "Prepare a tombstone for the no-active worker edge.",
    });
    const removed = await confirm(removal);
    const actionId = randomUUID();
    const jobId = randomUUID();
    await pool.query(
      `insert into simulora.actions
       (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
        expected_head_commit_id, participation_expectation, intent, status)
       values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, $8, 'ACKNOWLEDGED')`,
      [
        actionId,
        account.accountId,
        continuity.continuityId,
        continuity.branchId,
        `fixture-no-active-${randomUUID()}`,
        removed.commit!.resultingHeadCommitId,
        JSON.stringify(continuity.state.participation),
        "Resolve a queued Action after the last fact was removed.",
      ],
    );
    await pool.query(
      `insert into simulora.durable_jobs (id, type, action_id, dedupe_key, status)
       values ($1, 'ACTION_PROCESS', $2, $3, 'AVAILABLE')`,
      [jobId, actionId, `fixture-job-${actionId}`],
    );
    await expect(
      repository.processAction(
        actionId,
        (request) => gateway.generateWorldTurn(request),
        "no-active-worker",
      ),
    ).resolves.toBeNull();
    const resolved = await repository.readAction(account, actionId);
    expect(resolved).toMatchObject({
      status: "FAILED_RECOVERABLE",
      statusReason: "NO_ACTIVE_CANONICAL_FACT",
    });
    const job = await pool.query<{ status: string; attempts: number; last_error: string }>(
      "select status, attempts, last_error from simulora.durable_jobs where id = $1",
      [jobId],
    );
    expect(job.rows[0]).toEqual({
      status: "DEAD",
      attempts: 1,
      last_error: "NO_ACTIVE_CANONICAL_FACT",
    });
  });

  it("makes concurrent direct correction retries effective once", async () => {
    const continuity = await createContinuity();
    const fact = continuity.state.facts[0]!;
    const idempotencyKey = `concurrent-direct-${randomUUID()}`;
    const request = {
      schemaVersion: 1 as const,
      idempotencyKey,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact" as const, id: fact.id },
      operation: "CORRECT_CONTINUITY" as const,
      before: { statement: fact.statement, scope: fact.scope },
      after: { statement: "The concurrent correction committed once." },
      reason: "Verify effective-once direct correction retries.",
    };

    const [first, second] = await Promise.all([
      repository.submitCorrection(account, continuity.branchId, request),
      repository.submitCorrection(account, continuity.branchId, request),
    ]);
    expect(first.id).toBe(second.id);
    expect(first.proposal?.id).toBe(second.proposal?.id);
    if (!first.proposal || !second.proposal) throw new Error("Expected direct proposals");

    const confirmation = {
      proposalId: first.proposal.id,
      proposalDigest: first.proposal.digest,
      expectedHeadCommitId: first.proposal.expectedHeadCommitId,
    };
    const [firstCommit, secondCommit] = await Promise.all([
      repository.confirmAction(account, first.id, confirmation),
      repository.confirmAction(account, second.id, confirmation),
    ]);
    expect(firstCommit.status).toBe("COMMITTED");
    expect(secondCommit.status).toBe("COMMITTED");
    expect(firstCommit.commit?.id).toBe(secondCommit.commit?.id);

    const counts = await pool.query<{
      proposal_count: number;
      commit_count: number;
      event_count: number;
      state_revision_count: number;
    }>(
      `select
         (select count(*)::int from simulora.action_proposals where action_id = $1) as proposal_count,
         (select count(*)::int from simulora.world_commits where action_id = $1) as commit_count,
         (select count(*)::int from simulora.domain_events where cause_action_id = $1) as event_count,
         (select count(*)::int from simulora.state_revisions where commit_id in
            (select id from simulora.world_commits where action_id = $1)) as state_revision_count`,
      [first.id],
    );
    expect(counts.rows[0]).toEqual({
      proposal_count: 1,
      commit_count: 1,
      event_count: 1,
      state_revision_count: 1,
    });

    const current = await repository.readCurrentState(account, continuity.continuityId);
    expect(current.state.worldClock).toEqual(continuity.state.worldClock);
    expect(current.state.participation).toEqual(continuity.state.participation);
    expect(current.state.characters).toEqual(continuity.state.characters);
    expect(current.state.relationships).toEqual(continuity.state.relationships);
    expect(current.state.openThreads).toEqual(continuity.state.openThreads);
    expect(current.state.facts).toHaveLength(continuity.state.facts.length);
    expect(current.state.facts[0]).toMatchObject({
      id: fact.id,
      statement: "The concurrent correction committed once.",
      lifecycle: "ACTIVE",
    });
  });

  it("keeps exact direct confirmation, cancellation and proposal binding constraints effective", async () => {
    const continuity = await createContinuity();
    const fact = continuity.state.facts[0]!;
    const cancelled = await repository.submitCorrection(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `cancel-direct-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "CORRECT_CONTINUITY",
      before: { statement: fact.statement, scope: fact.scope },
      after: { statement: "This correction must not commit." },
      reason: "Cancel before exact confirmation.",
    });
    if (!cancelled.proposal) throw new Error("Expected direct proposal");
    const cancelledResult = await repository.cancelAction(account, cancelled.id);
    expect(cancelledResult.status).toBe("CANCELLED");
    await expect(
      repository.confirmAction(account, cancelled.id, {
        proposalId: cancelled.proposal.id,
        proposalDigest: cancelled.proposal.digest,
        expectedHeadCommitId: cancelled.proposal.expectedHeadCommitId,
      }),
    ).rejects.toThrow(/ACTION_CANCELLED/);
    expect((await repository.readCurrentState(account, continuity.continuityId)).headCommitId).toBe(
      continuity.headCommitId,
    );

    const directKey = `binding-direct-${randomUUID()}`;
    const direct = await repository.submitCorrection(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: directKey,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "CORRECT_CONTINUITY",
      before: { statement: fact.statement, scope: fact.scope },
      after: { statement: "The signal record is corrected." },
      reason: "Exercise exact binding checks.",
    });
    const duplicate = await repository.submitCorrection(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: directKey,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "CORRECT_CONTINUITY",
      before: { statement: fact.statement, scope: fact.scope },
      after: { statement: "The signal record is corrected." },
      reason: direct.intent,
    });
    expect(duplicate.id).toBe(direct.id);
    await expect(
      repository.submitCorrection(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: directKey,
        expectedHeadCommitId: continuity.headCommitId,
        target: { type: "fact", id: fact.id },
        operation: "CORRECT_CONTINUITY",
        before: { statement: fact.statement, scope: fact.scope },
        after: { statement: "A different retry body must be rejected." },
        reason: direct.intent,
      }),
    ).rejects.toThrow(/IDEMPOTENCY_KEY_REUSED/);
    await expect(
      repository.confirmAction(account, direct.id, {
        proposalId: direct.proposal!.id,
        proposalDigest: "0".repeat(64),
        expectedHeadCommitId: direct.proposal!.expectedHeadCommitId,
      }),
    ).rejects.toThrow(/CONFIRMATION_EXPIRED_OR_PROPOSAL_CHANGED/);
    await expect(
      repository.confirmAction(account, direct.id, {
        proposalId: direct.proposal!.id,
        proposalDigest: direct.proposal!.digest,
        expectedHeadCommitId: randomUUID(),
      }),
    ).rejects.toThrow(/BRANCH_HEAD_CONFLICT/);

    const proposalRows = await pool.query<{ generation_attempt_id: string | null }>(
      "select generation_attempt_id from simulora.action_proposals where action_id = $1",
      [direct.id],
    );
    expect(proposalRows.rows[0]?.generation_attempt_id).toBeNull();
    const attemptId = randomUUID();
    await pool.query(
      `insert into simulora.generation_attempts
       (id, action_id, attempt_number, adapter, status, context_manifest)
       values ($1, $2, 1, 'deterministic', 'RUNNING', '{}'::jsonb)`,
      [attemptId, direct.id],
    );
    await pool.query(
      `update simulora.generation_attempts
       set status = 'SUCCEEDED', output = '{}'::jsonb, completed_at = now()
       where id = $1`,
      [attemptId],
    );
    await expect(
      pool.query(
        `insert into simulora.action_proposals
         (id, action_id, generation_attempt_id, expected_head_commit_id, schema_version,
          candidate_transition, impact_level, proposal_digest, display_effect, status, expires_at)
         values ($1, $2, $3, $4, 1, '{}'::jsonb, 'L3', $5, '{}'::jsonb, 'ACTIVE', now() + interval '5 minutes')`,
        [randomUUID(), direct.id, attemptId, direct.expectedHeadCommitId, "1".repeat(64)],
      ),
    ).rejects.toThrow(/Direct correction proposal cannot bind a Generation Attempt/);
  });
});
