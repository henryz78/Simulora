import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  ValidationError,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import {
  lanternReachSeed,
  type RequestedEffect,
  type StateRevisionDocument,
} from "../../packages/domain/src/index.js";
import {
  DeterministicModelGateway,
  type WorldTurnDraft,
  type WorldTurnRequest,
} from "../../packages/model-gateway/src/index.js";
import {
  mgcClosureRoutinePolicy,
  mgcClosureWorld,
} from "../../packages/testkit/src/mgc-closure.js";

/**
 * MGC-1 against real PostgreSQL: every closure operation is accepted or
 * rejected identically by the application and by SQL, commits with exactly one
 * typed causal Event, and joins Branch/Restore membership.
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const gateway = new DeterministicModelGateway();

type Continuity = { branchId: string; headCommitId: string; state: StateRevisionDocument };
type Generate = (request: WorldTurnRequest) => Promise<WorldTurnDraft>;

suite("MGC-1 closure operations against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  const account = { accountId: randomUUID(), eligibility: "adult" as const };

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.resolve("db/migrations"));
    pool = createDatabasePool(connectionString, { max: 12 });
    repository = new AuthoritativeWorldRepository(pool);
  });
  afterAll(async () => pool?.end());

  async function fixture(world = mgcClosureWorld) {
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    await pool.query(
      "insert into simulora.re3_routine_policies (world_revision_id, document) values ($1, $2::jsonb)",
      [revision.revisionId, JSON.stringify(mgcClosureRoutinePolicy)],
    );
    return repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
  }

  async function propose(
    continuity: Continuity,
    requestedEffect: RequestedEffect,
    extra: { targetCharacterId?: string; targetThreadId?: string } = {},
    generate: Generate = (request) => gateway.generateWorldTurn(request),
  ) {
    const submitted = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Check the harbor approach with the others.",
      requestedEffect,
      ...extra,
    });
    const processed = await repository.processAction(submitted.id, generate, "mgc-worker");
    return processed ?? repository.readAction(account, submitted.id);
  }

  async function confirm(action: Awaited<ReturnType<typeof propose>>) {
    if (!action.proposal) throw new Error(`Expected a proposal, got ${action.status}`);
    const committed = await repository.confirmAction(account, action.id, {
      proposalId: action.proposal.id,
      proposalDigest: action.proposal.digest,
      expectedHeadCommitId: action.proposal.expectedHeadCommitId,
    });
    expect(committed.status).toBe("COMMITTED");
    const head = committed.commit!.resultingHeadCommitId;
    const events = await pool.query<{
      event_type: string;
      payload: Record<string, unknown>;
      cause_action_id: string;
      visibility_scope: string;
    }>(
      `select event_type, payload, cause_action_id, visibility_scope
         from simulora.domain_events where commit_id = $1`,
      [head],
    );
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0]!.cause_action_id).toBe(action.id);
    expect(events.rows[0]!.visibility_scope).toBe("SHARED");
    return { head, event: events.rows[0]! };
  }

  async function current(continuityId: string): Promise<Continuity & { continuityId: string }> {
    const state = await repository.readCurrentState(account, continuityId);
    return {
      continuityId,
      branchId: state.branchId,
      headCommitId: state.headCommitId,
      state: state.state,
    };
  }

  /** Candidate factory for a scripted generator (a provider double without HTTP). */
  function scripted(operation: (request: WorldTurnRequest) => Record<string, unknown>): Generate {
    return (request) => {
      const responseSource = request.character
        ? ({ type: "CHARACTER", characterId: request.character.id } as const)
        : ({ type: "WORLD" } as const);
      const narrative = "The harbor answers in its own time.";
      return Promise.resolve({
        narrative,
        responseSource,
        candidate: {
          schemaVersion: 1,
          actionId: request.actionId,
          expectedHeadCommitId: request.expectedHeadCommitId,
          narrative,
          responseSource,
          operation: { causalFactIds: [request.targetFact.id], ...operation(request) },
        },
      });
    };
  }

  async function sqlValid(document: Record<string, unknown>): Promise<boolean> {
    const result = await pool.query<{ valid: boolean }>(
      `select simulora.action_proposal_effect_is_valid(
         jsonb_populate_record(null::simulora.action_proposals, $1::jsonb)) as valid`,
      [JSON.stringify(document)],
    );
    return result.rows[0]!.valid;
  }

  async function proposalRow(proposalId: string) {
    const row = await pool.query<{ document: Record<string, unknown> }>(
      "select to_jsonb(p) as document from simulora.action_proposals p where id = $1",
      [proposalId],
    );
    return row.rows[0]!.document;
  }

  it("shifts a ROUTINE relationship one step at L2 with a causal Event", async () => {
    const start = await fixture();
    let continuity = await current(start.continuityId);
    const steps: Array<[string, string]> = [
      ["wary", "cordial"],
      ["cordial", "trusting"],
      // At the top of the scale the deterministic adapter steps back down.
      ["trusting", "cordial"],
    ];
    for (const [before, after] of steps) {
      const action = await propose(continuity, "RELATIONSHIP_EFFECT", {
        targetCharacterId: "character.iora",
      });
      expect(action.proposal?.impact).toBe("L2");
      expect(await sqlValid(await proposalRow(action.proposal!.id))).toBe(true);
      const attempt = await pool.query<{ manifest_digest: string; sql_digest: string }>(
        `select g.context_manifest->>'effectContextDigest' as manifest_digest,
                encode(sha256(convert_to(simulora.canonical_jsonb_text(
                  simulora.mgc_effect_context($1)), 'UTF8')), 'hex') as sql_digest
           from simulora.generation_attempts g where g.action_id = $1 and g.status = 'SUCCEEDED'`,
        [action.id],
      );
      expect(attempt.rows[0]!.manifest_digest).toBe(attempt.rows[0]!.sql_digest);
      const { event } = await confirm(action);
      expect(event.event_type).toBe("RELATIONSHIP_SHIFTED");
      expect(event.payload).toMatchObject({
        actionId: action.id,
        relationshipId: "relationship.iora-tavi",
        before,
        after,
        causalFactIds: ["fact.western-signal-dim"],
      });
      continuity = await current(start.continuityId);
      expect(continuity.state.relationships[0]?.state).toBe(after);
      expect(continuity.state.relationships[1]?.state).toBe("unsworn");
      expect(continuity.state.facts).toEqual(start.state.facts);
    }
  });

  it("keeps protected redefinitions and multi-step jumps at L3 exact confirmation", async () => {
    const start = await fixture();
    const oath = await propose(
      await current(start.continuityId),
      "RELATIONSHIP_EFFECT",
      { targetCharacterId: "character.iora" },
      scripted(() => ({
        type: "SHIFT_RELATIONSHIP",
        relationshipId: "relationship.iora-oath",
        beforeState: "unsworn",
        afterState: "sworn",
      })),
    );
    expect(oath.proposal?.impact).toBe("L3");
    const document = await proposalRow(oath.proposal!.id);
    expect(await sqlValid(document)).toBe(true);
    // A proposal that claims a lower impact is refused by SQL.
    expect(await sqlValid({ ...document, impact_level: "L2" })).toBe(false);
    await confirm(oath);
    const afterOath = await current(start.continuityId);
    expect(afterOath.state.relationships[1]?.state).toBe("sworn");

    const jump = await propose(
      afterOath,
      "RELATIONSHIP_EFFECT",
      { targetCharacterId: "character.iora" },
      scripted(() => ({
        type: "SHIFT_RELATIONSHIP",
        relationshipId: "relationship.iora-tavi",
        beforeState: "wary",
        afterState: "trusting",
      })),
    );
    expect(jump.proposal?.impact).toBe("L3");
    await repository.cancelAction(account, jump.id);
  });

  it("opens and resolves structured threads with append-only history", async () => {
    const start = await fixture();
    const opened = await propose(await current(start.continuityId), "THREAD_EFFECT");
    expect(opened.proposal?.impact).toBe("L2");
    const openCommit = await confirm(opened);
    expect(openCommit.event.event_type).toBe("THREAD_OPENED");
    expect(openCommit.event.payload.threadId).toBe(`thread.${opened.id}`);
    const afterOpen = await current(start.continuityId);
    expect(afterOpen.state.threads?.map((thread) => [thread.id, thread.status])).toEqual([
      ["thread.vessel", "OPEN"],
      [`thread.${opened.id}`, "OPEN"],
    ]);

    const resolved = await propose(afterOpen, "THREAD_EFFECT", { targetThreadId: "thread.vessel" });
    const resolveCommit = await confirm(resolved);
    expect(resolveCommit.event.event_type).toBe("THREAD_RESOLVED");
    const afterResolve = await current(start.continuityId);
    expect(afterResolve.state.threads?.[0]).toMatchObject({
      id: "thread.vessel",
      status: "RESOLVED",
    });
    expect(afterResolve.state.threads?.[0]?.resolution).toBeTruthy();
    // The earlier State Revision still says OPEN: resolving did not rewrite history.
    const earlier = await pool.query<{ status: string }>(
      `select s.document->'threads'->0->>'status' as status
         from simulora.world_commits c join simulora.state_revisions s on s.id = c.state_revision_id
        where c.id = $1`,
      [openCommit.head],
    );
    expect(earlier.rows[0]!.status).toBe("OPEN");

    // A resolved or unknown thread cannot be targeted, by the API or by raw SQL.
    await expect(
      propose(afterResolve, "THREAD_EFFECT", { targetThreadId: "thread.vessel" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      propose(afterResolve, "FACT_REWRITE", { targetThreadId: `thread.${opened.id}` }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      pool.query(
        `insert into simulora.actions
          (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
           expected_head_commit_id, participation_expectation, intent, operation_payload, status)
         values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, 'Resolve again.', $8::jsonb, 'ACKNOWLEDGED')`,
        [
          randomUUID(),
          account.accountId,
          start.continuityId,
          afterResolve.branchId,
          randomUUID(),
          afterResolve.headCommitId,
          JSON.stringify(afterResolve.state.participation),
          JSON.stringify({ requestedEffect: "THREAD_EFFECT", targetThreadId: "thread.vessel" }),
        ],
      ),
    ).rejects.toThrow(/open thread/);
  });

  it("proposes a transformed failure for an impossible attempt, and rejecting it changes nothing", async () => {
    const start = await fixture();
    const before = await current(start.continuityId);
    const failed = await propose(before, "ROUTINE_EFFECT", { targetCharacterId: "character.tavi" });
    expect(failed.proposal?.impact).toBe("L2");
    const document = await proposalRow(failed.proposal!.id);
    const operation = (document.candidate_transition as { operation: Record<string, unknown> })
      .operation;
    expect(operation).toMatchObject({
      type: "TRANSFORM_FAILURE",
      constraintId: "constraint.flood",
    });
    expect(await sqlValid(document)).toBe(true);
    // The user can reject it; nothing is recorded.
    await repository.cancelAction(account, failed.id);
    const unchanged = await current(start.continuityId);
    expect(unchanged.headCommitId).toBe(before.headCommitId);
    expect(unchanged.state).toEqual(before.state);

    const again = await propose(unchanged, "ROUTINE_EFFECT", {
      targetCharacterId: "character.tavi",
    });
    const { event } = await confirm(again);
    expect(event.event_type).toBe("ATTEMPT_TRANSFORMED");
    expect(event.payload).toMatchObject({
      constraintId: "constraint.flood",
      threadId: `thread.${again.id}`,
    });
    const after = await current(start.continuityId);
    expect(after.state.threads?.at(-1)).toMatchObject({ id: `thread.${again.id}`, status: "OPEN" });
    expect(after.state.facts).toEqual(before.state.facts);
    expect(after.state.relationships).toEqual(before.state.relationships);
    expect(after.state.characters).toEqual(before.state.characters);
  });

  it("never turns a provider failure into a transformed failure", async () => {
    const start = await fixture();
    const before = await current(start.continuityId);
    const action = await propose(
      before,
      "ROUTINE_EFFECT",
      { targetCharacterId: "character.tavi" },
      () => Promise.reject(new Error("provider unavailable")),
    );
    expect(action.proposal).toBeNull();
    expect(["FAILED_RECOVERABLE", "GENERATING", "ACKNOWLEDGED"]).toContain(action.status);
    const unchanged = await current(start.continuityId);
    expect(unchanged.state).toEqual(before.state);
    await repository.cancelAction(account, action.id);
  });

  it("refuses forged closure proposals in SQL exactly as the application does", async () => {
    const start = await fixture();
    const shift = await propose(await current(start.continuityId), "RELATIONSHIP_EFFECT", {
      targetCharacterId: "character.iora",
    });
    const original = await proposalRow(shift.proposal!.id);
    const candidate = original.candidate_transition as Record<string, unknown>;
    const operation = candidate.operation as Record<string, unknown>;
    const withOperation = (patch: Record<string, unknown>) => ({
      ...original,
      candidate_transition: { ...candidate, operation: { ...operation, ...patch } },
    });
    for (const forged of [
      { ...original, impact_level: "L3" },
      withOperation({ afterState: "the best of friends" }),
      withOperation({ afterState: "trusting" }),
      withOperation({ beforeState: "cordial" }),
      withOperation({ relationshipId: "relationship.unknown" }),
      withOperation({ causalFactIds: ["fact.unknown"] }),
      withOperation({ impact: "L2" }),
      { ...original, candidate_transition: { ...candidate, responseSource: { type: "WORLD" } } },
      withOperation({ type: "OPEN_THREAD", title: "Smuggled thread" }),
      withOperation({
        type: "TRANSFORM_FAILURE",
        constraintId: "constraint.undeclared",
        outcome: "Nothing works.",
        newThreadTitle: "Try elsewhere",
      }),
      { ...original, expected_head_commit_id: randomUUID() },
      { ...original, proposal_digest: "0".repeat(64) },
    ]) {
      expect(await sqlValid(forged)).toBe(false);
    }
    await repository.cancelAction(account, shift.id);

    const thread = await propose(await current(start.continuityId), "THREAD_EFFECT");
    const threadRow = await proposalRow(thread.proposal!.id);
    const threadCandidate = threadRow.candidate_transition as Record<string, unknown>;
    expect(
      await sqlValid({
        ...threadRow,
        display_effect: {
          ...(threadRow.display_effect as object),
          target: "thread.forged-identity",
        },
      }),
    ).toBe(false);
    expect(
      await sqlValid({
        ...threadRow,
        candidate_transition: {
          ...threadCandidate,
          operation: {
            ...(threadCandidate.operation as object),
            type: "RESOLVE_THREAD",
            threadId: "thread.vessel",
            resolution: "Resolved without being asked.",
          },
        },
      }),
    ).toBe(false);
    await repository.cancelAction(account, thread.id);
  });

  it("restores thread status and relationship state, appending history", async () => {
    const start = await fixture();
    const point = await repository.createRecoveryPoint(account, start.branchId, {
      idempotencyKey: randomUUID(),
      label: "Before the closure effects",
    });
    await confirm(
      await propose(await current(start.continuityId), "RELATIONSHIP_EFFECT", {
        targetCharacterId: "character.iora",
      }),
    );
    await confirm(
      await propose(await current(start.continuityId), "THREAD_EFFECT", {
        targetThreadId: "thread.vessel",
      }),
    );
    const changed = await current(start.continuityId);
    const proposal = await repository.prepareRestore(account, start.branchId, point.commitId);
    expect(proposal.includedSections).toContain("threads");
    expect(proposal.changedSections).toEqual(expect.arrayContaining(["relationships", "threads"]));
    await repository.confirmRestore(account, start.branchId, {
      proposalId: proposal.id,
      digest: proposal.digest,
      expectedHeadCommitId: proposal.expectedHeadCommitId,
    });
    const restored = await current(start.continuityId);
    expect(restored.headCommitId).not.toBe(changed.headCommitId);
    expect(restored.state.relationships).toEqual(start.state.relationships);
    expect(restored.state.threads).toEqual(start.state.threads);
  });

  it("leaves earlier Worlds' evidence and Restore membership exactly as before", async () => {
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const legacy = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    expect("threads" in legacy.state).toBe(false);
    const point = await repository.createRecoveryPoint(account, legacy.branchId, {
      idempotencyKey: randomUUID(),
      label: "Legacy opening",
    });
    const action = await propose(legacy, "FACT_REWRITE");
    const manifest = await pool.query<{ manifest: Record<string, unknown> }>(
      "select context_manifest as manifest from simulora.generation_attempts where action_id = $1",
      [action.id],
    );
    expect(manifest.rows[0]!.manifest).not.toHaveProperty("effectContextDigest");
    await confirm(action);
    const proposal = await repository.prepareRestore(account, legacy.branchId, point.commitId);
    expect(proposal.includedSections).not.toContain("threads");
  });
});
