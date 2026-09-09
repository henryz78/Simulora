import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AccessDeniedError,
  AuthoritativeWorldRepository,
  ConflictError,
  createDatabasePool,
  NotFoundError,
  type ActionGenerator,
  type ActionRecord,
  type ContinuityStateRecord,
  type SyntheticAccount,
} from "../../packages/database/src/index.js";
import { lanternReachSeed, type WorldDocument } from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const gateway = new DeterministicModelGateway();

type WorldFact = WorldDocument["facts"][number];
type DatabasePool = ReturnType<typeof createDatabasePool>;

function newAccount(): SyntheticAccount {
  return { accountId: randomUUID(), eligibility: "adult" };
}

function makeFact(id: string, statement: string, scope: WorldFact["scope"] = "SHARED"): WorldFact {
  return {
    id,
    statement,
    scope,
    provenance: "IP-4 adversarial fixture",
    lifecycle: "ACTIVE",
  };
}

function makeWorld(facts: WorldFact[]): WorldDocument {
  const factIds = new Set(facts.map((fact) => fact.id));
  return {
    ...lanternReachSeed,
    title: `${lanternReachSeed.title} adversarial ${randomUUID().slice(0, 8)}`,
    facts: facts.map((fact) => ({ ...fact })),
    characters: lanternReachSeed.characters.map((character) => ({
      ...character,
      knowledgeFactIds: character.knowledgeFactIds.filter((factId) => factIds.has(factId)),
    })),
  };
}

async function startFixture(
  repository: AuthoritativeWorldRepository,
  facts: WorldFact[],
): Promise<{ account: SyntheticAccount; continuity: ContinuityStateRecord }> {
  const account = newAccount();
  const draft = await repository.createWorld(account, makeWorld(facts));
  const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
  const continuity = await repository.startContinuity(account, revision.revisionId, {
    initiativeMode: "GUIDED",
    structureMode: "OPEN_ENDED",
  });
  return { account, continuity };
}

async function commitDirectChange(
  repository: AuthoritativeWorldRepository,
  account: SyntheticAccount,
  continuityId: string,
  targetFactId: string,
  operation: "CORRECT_CONTINUITY" | "REMOVE_CONTINUITY",
  reason: string,
  afterStatement?: string,
): Promise<{ action: ActionRecord; commit: NonNullable<ActionRecord["commit"]> }> {
  const current = await repository.readCurrentState(account, continuityId);
  const target = current.state.facts.find((fact) => fact.id === targetFactId);
  if (!target) throw new Error(`Fixture fact ${targetFactId} is missing`);

  const request = {
    schemaVersion: 1 as const,
    idempotencyKey: `adversarial-${randomUUID()}`,
    expectedHeadCommitId: current.headCommitId,
    target: { type: "fact" as const, id: targetFactId },
    operation,
    before: { statement: target.statement, scope: target.scope },
    ...(operation === "CORRECT_CONTINUITY"
      ? { after: { statement: afterStatement ?? `${target.statement} (corrected)` } }
      : {}),
    reason,
  };
  const action = await repository.submitCorrection(account, current.branchId, request);
  expect(action.operationType).toBe(operation);
  const proposal = action.proposal;
  if (!proposal) throw new Error("Direct correction fixture did not produce a proposal");

  const committed = await repository.confirmAction(account, action.id, {
    proposalId: proposal.id,
    proposalDigest: proposal.digest,
    expectedHeadCommitId: proposal.expectedHeadCommitId,
  });
  expect(committed.status).toBe("COMMITTED");
  if (!committed.commit) throw new Error("Direct correction fixture did not commit");
  return { action: committed, commit: committed.commit };
}

async function commitParticipation(
  repository: AuthoritativeWorldRepository,
  account: SyntheticAccount,
  continuityId: string,
  generator: ActionGenerator = (request) => gateway.generateWorldTurn(request),
): Promise<{ action: ActionRecord; commit: NonNullable<ActionRecord["commit"]> }> {
  const current = await repository.readCurrentState(account, continuityId);
  const submitted = await repository.submitAction(account, current.branchId, {
    schemaVersion: 1,
    idempotencyKey: `adversarial-${randomUUID()}`,
    expectedHeadCommitId: current.headCommitId,
    participationExpectation: current.state.participation,
    intent: "Continue the adversarial continuity check.",
  });
  const proposed = await repository.processAction(
    submitted.id,
    generator,
    `adversarial-worker-${randomUUID()}`,
  );
  if (!proposed?.proposal) throw new Error("Participation fixture did not produce a proposal");
  const committed = await repository.confirmAction(account, submitted.id, {
    proposalId: proposed.proposal.id,
    proposalDigest: proposed.proposal.digest,
    expectedHeadCommitId: proposed.proposal.expectedHeadCommitId,
  });
  expect(committed.status).toBe("COMMITTED");
  if (!committed.commit) throw new Error("Participation fixture did not commit");
  return { action: committed, commit: committed.commit };
}

async function appendDomainEvents(
  pool: DatabasePool,
  branchId: string,
  commitId: string,
  events: ReadonlyArray<{ type: string; payload: Record<string, unknown> }>,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const event of events) {
      await client.query(
        `insert into simulora.domain_events
           (id, branch_id, commit_id, event_type, payload)
         values ($1, $2, $3, $4, $5::jsonb)`,
        [randomUUID(), branchId, commitId, event.type, JSON.stringify(event.payload)],
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function captureError(call: () => Promise<unknown>): Promise<unknown> {
  let captured: unknown;
  try {
    await call();
  } catch (error) {
    captured = error;
  }
  return captured;
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys);
    return keys;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      collectObjectKeys(child, keys);
    }
  }
  return keys;
}

function expectNoInternalProjectionFields(...values: unknown[]): void {
  const forbidden = [
    "context_manifest",
    "contextManifest",
    "providerReasoning",
    "provider_reasoning",
    "rawPrompt",
    "raw_prompt",
  ];
  for (const value of values) {
    const keys = collectObjectKeys(value);
    for (const key of forbidden) expect(keys.has(key)).toBe(false);
  }
}

suite("IP-4 adversarial PostgreSQL boundaries", () => {
  let pool!: DatabasePool;
  let repository!: AuthoritativeWorldRepository;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(repositoryRoot, "db", "migrations"));
    pool = createDatabasePool(connectionString, { max: 12 });
    repository = new AuthoritativeWorldRepository(pool);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("keeps every Domain Event with one Commit when the page limit is smaller than the event count", async () => {
    const { account, continuity } = await startFixture(repository, [
      makeFact("fact.pagination-anchor", "The pagination anchor is present."),
    ]);
    const committed = await commitParticipation(repository, account, continuity.continuityId);
    await appendDomainEvents(pool, continuity.branchId, committed.commit.id, [
      { type: "TRACE_AUXILIARY_ONE", payload: { marker: "one" } },
      { type: "TRACE_AUXILIARY_TWO", payload: { marker: "two" } },
      { type: "TRACE_AUXILIARY_THREE", payload: { marker: "three" } },
    ]);

    const first = await repository.listBranchCommits(account, continuity.branchId, undefined, 1);
    expect(first.commits).toHaveLength(1);
    expect(first.commits[0]?.id).toBe(committed.commit.id);
    expect(first.commits[0]?.events).toHaveLength(4);
    expect(first.commits[0]?.events.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "ACTION_RECORDED",
        "TRACE_AUXILIARY_ONE",
        "TRACE_AUXILIARY_TWO",
        "TRACE_AUXILIARY_THREE",
      ]),
    );
    expect(first.nextCursor).toBeTruthy();

    const second = await repository.listBranchCommits(
      account,
      continuity.branchId,
      first.nextCursor ?? undefined,
      1,
    );
    expect(second.commits).toHaveLength(1);
    expect(second.commits[0]?.id).not.toBe(committed.commit.id);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.commits, ...second.commits].map((commit) => commit.id)).size).toBe(2);
  });

  it("uses the canonical fact scope for a legacy target event and hides it across accounts", async () => {
    const privateStatement = "Only this continuity owner may read the private tide note.";
    const targetFactId = "fact.legacy-private";
    const { account, continuity } = await startFixture(repository, [
      makeFact(targetFactId, privateStatement, "ACCOUNT_PRIVATE"),
      makeFact("fact.legacy-shared-anchor", "A shared anchor permits a later Action."),
    ]);
    const committed = await commitParticipation(repository, account, continuity.continuityId);
    await appendDomainEvents(pool, continuity.branchId, committed.commit.id, [
      {
        type: "LEGACY_TARGET_EVENT",
        payload: { target: targetFactId, legacyDetail: "not a scope authority" },
      },
    ]);

    const ownerExplanation = await repository.readExplanation(
      account,
      continuity.branchId,
      "fact",
      targetFactId,
    );
    expect(ownerExplanation.target).toMatchObject({
      type: "fact",
      id: targetFactId,
      statement: privateStatement,
      lifecycle: "ACTIVE",
      current: true,
    });
    expect(ownerExplanation.scope).toBe("ACCOUNT_PRIVATE");
    expect(ownerExplanation.source).toEqual({ class: "USER", commitId: committed.commit.id });
    expect(ownerExplanation.correction.requiresExactConfirmation).toBe(true);

    const trace = await repository.listBranchCommits(account, continuity.branchId);
    const legacyTrace = trace.commits
      .find((entry) => entry.id === committed.commit.id)
      ?.events.find((event) => event.type === "LEGACY_TARGET_EVENT");
    expect(legacyTrace).toMatchObject({ targetId: targetFactId, scope: "ACCOUNT_PRIVATE" });

    const orientation = await repository.rebuildReturnOrientation(account, continuity.branchId);
    expect(
      orientation.recentChanges.find((change) => change.eventType === "LEGACY_TARGET_EVENT"),
    ).toMatchObject({
      commitId: committed.commit.id,
      targetId: targetFactId,
      scope: "ACCOUNT_PRIVATE",
    });

    const stranger = newAccount();
    const denied = await captureError(() =>
      repository.readExplanation(stranger, continuity.branchId, "fact", targetFactId),
    );
    expect(denied).toBeDefined();
    expect(denied instanceof NotFoundError || denied instanceof AccessDeniedError).toBe(true);
    const deniedKeys = collectObjectKeys(denied);
    expect(deniedKeys.has("target")).toBe(false);
    expect(deniedKeys.has("count")).toBe(false);
    expect(deniedKeys.has("context")).toBe(false);
    if (denied instanceof Error) {
      expect(denied.message).not.toContain(targetFactId);
      expect(denied.message).not.toContain(privateStatement);
    }
  });

  it("rejects generator candidates for private and removed IDs even when those IDs remain in the full state", async () => {
    const anchorId = "fact.public-anchor";
    const privateActiveId = "fact.private-active";
    const privateRemovedId = "fact.private-removed";
    const privateActiveStatement = "The private active note is not model-readable.";
    const privateRemovedStatement = "The private removed note must stay historical.";
    const { account, continuity } = await startFixture(repository, [
      makeFact(privateActiveId, privateActiveStatement, "CONTINUITY_PRIVATE"),
      makeFact(privateRemovedId, privateRemovedStatement, "ACCOUNT_PRIVATE"),
      makeFact(anchorId, "The shared anchor remains eligible."),
    ]);
    await commitDirectChange(
      repository,
      account,
      continuity.continuityId,
      privateRemovedId,
      "REMOVE_CONTINUITY",
      "Remove the private note from current continuity.",
    );
    const afterRemoval = await repository.readCurrentState(account, continuity.continuityId);
    expect(afterRemoval.state.facts.find((fact) => fact.id === privateActiveId)?.lifecycle).toBe(
      "ACTIVE",
    );
    expect(afterRemoval.state.facts.find((fact) => fact.id === privateRemovedId)?.lifecycle).toBe(
      "REMOVED",
    );

    async function forgeCandidate(
      targetFactId: string,
      beforeStatement: string,
      scope: WorldFact["scope"],
    ): Promise<void> {
      const current = await repository.readCurrentState(account, continuity.continuityId);
      const submitted = await repository.submitAction(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey: `adversarial-forge-${randomUUID()}`,
        expectedHeadCommitId: current.headCommitId,
        participationExpectation: current.state.participation,
        intent: "Attempt a candidate target outside the authorized context.",
      });
      let seenRequest: Parameters<ActionGenerator>[0] | undefined;
      const processed = await repository.processAction(
        submitted.id,
        (request) => {
          seenRequest = request;
          return Promise.resolve({
            narrative: "A forged candidate must not become a proposal.",
            responseSource: { type: "WORLD" },
            candidate: {
              schemaVersion: 1,
              actionId: request.actionId,
              expectedHeadCommitId: request.expectedHeadCommitId,
              narrative: "A forged candidate must not become a proposal.",
              responseSource: { type: "WORLD" },
              operation: {
                type: "UPDATE_CANONICAL_FACT",
                targetFactId,
                beforeStatement,
                afterStatement: "A forged update must never commit.",
                scope,
                provenance: "forged provider output",
              },
            },
          });
        },
        `adversarial-forger-${randomUUID()}`,
      );
      expect(processed).not.toBeNull();
      expect(seenRequest).toMatchObject({
        expectedHeadCommitId: current.headCommitId,
        participation: current.state.participation,
        targetFact: { id: anchorId },
      });
      expect(processed?.proposal).toBeNull();
      expect(processed?.commit).toBeNull();
      const attempts = await pool.query<{
        context_manifest: { includedFactIds?: unknown };
      }>(
        `select context_manifest
           from simulora.generation_attempts
          where action_id = $1
          order by attempt_number desc
          limit 1`,
        [submitted.id],
      );
      expect(attempts.rows[0]?.context_manifest).toMatchObject({
        expectedHeadCommitId: seenRequest?.expectedHeadCommitId,
        participation: seenRequest?.participation,
        includedFactIds: [seenRequest?.targetFact.id],
        includedCharacterIds: [],
      });
      const counts = await pool.query<{ proposal_count: number; commit_count: number }>(
        `select
           (select count(*)::int from simulora.action_proposals where action_id = $1) as proposal_count,
           (select count(*)::int from simulora.world_commits where action_id = $1) as commit_count`,
        [submitted.id],
      );
      expect(counts.rows[0]).toEqual({ proposal_count: 0, commit_count: 0 });
    }

    await forgeCandidate(privateActiveId, privateActiveStatement, "CONTINUITY_PRIVATE");
    await forgeCandidate(privateRemovedId, privateRemovedStatement, "ACCOUNT_PRIVATE");
  });

  it("rejects a private-only continuity before acknowledgement when no eligible shared fact exists", async () => {
    const { account, continuity } = await startFixture(repository, [
      makeFact(
        "fact.private-only",
        "A private-only continuity has no deterministic eligible target.",
        "ACCOUNT_PRIVATE",
      ),
    ]);
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const denied = await captureError(() =>
      repository.submitAction(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey: `adversarial-private-only-${randomUUID()}`,
        expectedHeadCommitId: current.headCommitId,
        participationExpectation: current.state.participation,
        intent: "Attempt to acknowledge without an eligible shared fact.",
      }),
    );
    expect(denied).toBeInstanceOf(ConflictError);
    expect(denied instanceof Error ? denied.message : undefined).toBe("NO_ACTIVE_CANONICAL_FACT");
    const rows = await pool.query<{ action_count: number; job_count: number }>(
      `select
         (select count(*)::int from simulora.actions where branch_id = $1) as action_count,
         (select count(*)::int from simulora.durable_jobs where action_id in
           (select id from simulora.actions where branch_id = $1)) as job_count`,
      [current.branchId],
    );
    expect(rows.rows[0]).toEqual({ action_count: 0, job_count: 0 });
  });

  it("keeps corrected and removed facts out of later current state while public projections expose only permitted fields", async () => {
    const targetFactId = "fact.correction-target";
    const anchorFactId = "fact.correction-anchor";
    const correctedStatement = "The western signal is confirmed dim at the current head.";
    const { account, continuity } = await startFixture(repository, [
      makeFact(targetFactId, "The western signal is wrongly recorded as bright."),
      makeFact(anchorFactId, "The harbor anchor remains current."),
    ]);
    await commitDirectChange(
      repository,
      account,
      continuity.continuityId,
      targetFactId,
      "CORRECT_CONTINUITY",
      "Correct the canonical signal statement.",
      correctedStatement,
    );

    let followUpTarget: Record<string, unknown> | undefined;
    await commitParticipation(repository, account, continuity.continuityId, (request) => {
      followUpTarget = request.targetFact;
      const narrative = "The later Action uses the corrected canonical statement.";
      return Promise.resolve({
        narrative,
        responseSource: request.character
          ? { type: "CHARACTER" as const, characterId: request.character.id }
          : { type: "WORLD" as const },
        candidate: {
          schemaVersion: 1,
          actionId: request.actionId,
          expectedHeadCommitId: request.expectedHeadCommitId,
          narrative,
          responseSource: request.character
            ? { type: "CHARACTER" as const, characterId: request.character.id }
            : { type: "WORLD" as const },
          operation: {
            type: "UPDATE_CANONICAL_FACT",
            targetFactId: request.targetFact.id,
            beforeStatement: request.targetFact.statement,
            afterStatement: correctedStatement,
            scope: request.targetFact.scope,
            provenance: `Follow-up Action ${request.actionId}`,
          },
        },
      });
    });
    expect(followUpTarget).toMatchObject({
      id: targetFactId,
      statement: correctedStatement,
      scope: "SHARED",
      lifecycle: "ACTIVE",
      provenance: expect.stringContaining("Direct user correction"),
    });

    const removed = await commitDirectChange(
      repository,
      account,
      continuity.continuityId,
      targetFactId,
      "REMOVE_CONTINUITY",
      "Remove the corrected signal from current continuity.",
    );
    await commitParticipation(repository, account, continuity.continuityId);

    const finalState = await repository.readCurrentState(account, continuity.continuityId);
    const removedFact = finalState.state.facts.find((fact) => fact.id === targetFactId);
    expect(removedFact).toMatchObject({
      id: targetFactId,
      statement: correctedStatement,
      lifecycle: "REMOVED",
    });
    expect(
      finalState.state.facts.some(
        (fact) => fact.id === targetFactId && fact.lifecycle === "ACTIVE",
      ),
    ).toBe(false);

    const orientation = await repository.rebuildReturnOrientation(account, continuity.branchId);
    const removalChange = orientation.recentChanges.find(
      (change) => change.commitId === removed.commit.id,
    );
    expect(removalChange).toMatchObject({
      commitId: removed.commit.id,
      eventType: "CONTINUITY_ITEM_REMOVED",
      sourceClass: "USER",
      scope: "SHARED",
      targetId: targetFactId,
    });

    const trace = await repository.listBranchCommits(account, continuity.branchId);
    const explanation = await repository.readExplanation(
      account,
      continuity.branchId,
      "fact",
      targetFactId,
    );
    expect(explanation.target).toMatchObject({
      type: "fact",
      id: targetFactId,
      lifecycle: "REMOVED",
      current: false,
    });
    expect(explanation.source).toEqual({ class: "USER", commitId: removed.commit.id });
    expect(explanation.correction.availableOperations).toEqual([]);
    const progress = await repository.readProgress(account, removed.action.id);
    expectNoInternalProjectionFields(finalState, orientation, trace, explanation, progress);
  });

  it("keeps the latest correction inside the bounded recentChanges window after more than three commits", async () => {
    const targetFactId = "fact.orientation-latest";
    const { account, continuity } = await startFixture(repository, [
      makeFact(targetFactId, "Orientation statement zero."),
    ]);
    let latest!: { commit: NonNullable<ActionRecord["commit"]> };
    for (let index = 1; index <= 4; index += 1) {
      latest = await commitDirectChange(
        repository,
        account,
        continuity.continuityId,
        targetFactId,
        "CORRECT_CONTINUITY",
        `Record orientation correction ${index}.`,
        `Orientation statement ${index}.`,
      );
    }

    const orientation = await repository.rebuildReturnOrientation(account, continuity.branchId);
    expect(orientation.recentChanges).toHaveLength(3);
    expect(orientation.recentChanges.map((change) => change.commitId)).toContain(latest.commit.id);
    expect(
      orientation.recentChanges.find((change) => change.commitId === latest.commit.id),
    ).toMatchObject({
      eventType: "CONTINUITY_ITEM_CORRECTED",
      sourceClass: "USER",
      scope: "SHARED",
      targetId: targetFactId,
    });
  });

  it("marks a delayed projection stale while keeping the authoritative fallback readable, then rebuilds it from the current head", async () => {
    const targetFactId = "fact.stale-projection";
    const { account, continuity } = await startFixture(repository, [
      makeFact(targetFactId, "The projection freshness fixture is active."),
    ]);
    const initialHeadCommitId = continuity.headCommitId;
    const committed = await commitDirectChange(
      repository,
      account,
      continuity.continuityId,
      targetFactId,
      "CORRECT_CONTINUITY",
      "Advance the head while the orientation projection is delayed.",
      "The projection freshness fixture is corrected.",
    );
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const stale = await repository.readOrientation(account, continuity.continuityId);
    expect(stale.freshness).toMatchObject({
      sourceHeadCommitId: initialHeadCommitId,
      currentHeadCommitId: current.headCommitId,
      status: "STALE",
      headDistance: 1,
    });
    expect(stale.authoritativeFallback).toMatchObject({
      headCommitId: current.headCommitId,
      stateRevisionId: current.stateRevisionId,
      stateUrl: `/v1/continuities/${continuity.continuityId}/state`,
    });
    expect(stale.authoritativeFallback.headCommitId).toBe(committed.commit.id);

    const rebuilt = await repository.rebuildReturnOrientation(account, continuity.branchId);
    expect(rebuilt.freshness).toEqual({
      sourceHeadCommitId: current.headCommitId,
      currentHeadCommitId: current.headCommitId,
      status: "FRESH",
      headDistance: 0,
    });
    const reloaded = await repository.readOrientation(account, continuity.continuityId);
    expect(reloaded.freshness.status).toBe("FRESH");
    expect(reloaded.freshness.sourceHeadCommitId).toBe(current.headCommitId);
    expect(reloaded.authoritativeFallback.stateRevisionId).toBe(current.stateRevisionId);
  });

  it("discovers a missing projection and enforces its Branch/head integrity", async () => {
    const first = await startFixture(repository, [
      makeFact("fact.projection-repair", "The projection repair fixture is active."),
    ]);
    const second = await startFixture(repository, [
      makeFact("fact.other-branch", "A separate Branch owns this Commit."),
    ]);

    await pool.query("delete from simulora.return_orientation_projections where branch_id = $1", [
      first.continuity.branchId,
    ]);
    const missing = await repository.readOrientation(first.account, first.continuity.continuityId);
    expect(missing.freshness.status).toBe("REBUILDING");
    expect(missing.projectionUpdatedAt).toBeNull();

    let rebuilt: Awaited<ReturnType<typeof repository.processNextProjection>> = null;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = await repository.processNextProjection();
      if (candidate?.continuity.id === first.continuity.continuityId) {
        rebuilt = candidate;
        break;
      }
    }
    expect(rebuilt).toMatchObject({
      continuity: { id: first.continuity.continuityId, branchId: first.continuity.branchId },
      freshness: {
        sourceHeadCommitId: first.continuity.headCommitId,
        currentHeadCommitId: first.continuity.headCommitId,
        status: "FRESH",
      },
    });

    await expect(
      pool.query(
        `update simulora.return_orientation_projections
            set source_head_commit_id = $2, status = 'STALE'
          where branch_id = $1`,
        [first.continuity.branchId, second.continuity.headCommitId],
      ),
    ).rejects.toThrow(/source Commit must belong to its Branch/);

    await commitDirectChange(
      repository,
      first.account,
      first.continuity.continuityId,
      "fact.projection-repair",
      "CORRECT_CONTINUITY",
      "Advance the Branch beyond the previous projection source.",
      "The projection repair fixture advanced.",
    );
    await expect(
      pool.query(
        `update simulora.return_orientation_projections
            set status = 'FRESH', rebuilt_at = now()
          where branch_id = $1`,
        [first.continuity.branchId],
      ),
    ).rejects.toThrow(/must name the current Branch head/);
  });
});
