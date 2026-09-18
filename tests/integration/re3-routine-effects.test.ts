import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { lanternReachSeed, type StateRevisionDocument } from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
suite("RE-3 bounded routine effects against real PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  const account = { accountId: randomUUID(), eligibility: "adult" as const };
  const gateway = new DeterministicModelGateway();
  const from = "location.tidal-observatory";
  const to = "location.harbor";
  const npc = "character.iora";
  beforeAll(async () => {
    if (!connectionString) throw new Error("Database required");
    await runMigrations(connectionString, path.resolve("db/migrations"));
    pool = createDatabasePool(connectionString, { max: 12 });
    repository = new AuthoritativeWorldRepository(pool);
  });
  afterAll(async () => pool?.end());
  async function fixture(withPolicy = true) {
    const world = await repository.createWorld(account, {
      ...lanternReachSeed,
      locations: [
        ...lanternReachSeed.locations,
        { id: to, name: "Harbor", description: "Sheltered harbor." },
      ],
      routineRoutes: [{ fromLocationId: from, toLocationId: to, label: "the harbor road" }],
    });
    const revision = await repository.createRevision(account, world.worldId, world.rowVersion);
    if (withPolicy)
      await pool.query(
        "insert into simulora.re3_routine_policies (world_revision_id, document) values ($1, $2::jsonb)",
        [
          revision.revisionId,
          JSON.stringify({
            version: "re3-routine-v1",
            npcIds: [npc],
            publicLocationIds: [from, to],
            routes: [{ fromLocationId: from, toLocationId: to, label: "the harbor road" }],
          }),
        ],
      );
    return repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "DIRECT",
      structureMode: "GOAL_FRAMED",
    });
  }
  async function propose(
    continuity: { branchId: string; headCommitId: string; state: StateRevisionDocument },
    requestedEffect: "ROUTINE_EFFECT" | "NO_WORLD_EFFECT" = "ROUTINE_EFFECT",
  ) {
    const request = {
      schemaVersion: 1 as const,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Ask Iora to inspect the harbor.",
      targetCharacterId: npc,
      requestedEffect,
    };
    const [action, duplicate] = await Promise.all([
      repository.submitAction(account, continuity.branchId, request),
      repository.submitAction(account, continuity.branchId, request),
    ]);
    expect(duplicate.id).toBe(action.id);
    const results = await Promise.all(
      ["a", "b"].map((worker) =>
        repository.processAction(action.id, (input) => gateway.generateWorldTurn(input), worker),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    return results.find(Boolean)!;
  }
  function confirmation(action: Awaited<ReturnType<typeof propose>>) {
    if (!action.proposal) throw new Error("Expected sealed proposal");
    return {
      proposalId: action.proposal.id,
      proposalDigest: action.proposal.digest,
      expectedHeadCommitId: action.proposal.expectedHeadCommitId,
    };
  }
  it("binds policy, L2 proposal, causal Event and exact atomic materialization; fork/Restore preserve movement history", async () => {
    const continuity = await fixture();
    const point = await repository.createRecoveryPoint(account, continuity.branchId, {
      idempotencyKey: randomUUID(),
      label: "Opening",
    });
    const action = await propose(continuity);
    expect(action.status).toBe("AWAITING_CONFIRMATION");
    expect(action.proposal?.impact).toBe("L2");
    expect(action.proposal?.displayEffect).toEqual({
      target: npc,
      before: from,
      after: to,
      scope: "SHARED",
    });
    expect((await repository.readCurrentState(account, continuity.continuityId)).state).toEqual(
      continuity.state,
    );
    const request = confirmation(action);
    await expect(
      repository.confirmAction(
        { accountId: randomUUID(), eligibility: "adult" },
        action.id,
        request,
      ),
    ).rejects.toThrow();
    await expect(
      repository.confirmAction(account, action.id, { ...request, proposalDigest: "0".repeat(64) }),
    ).rejects.toThrow();
    const [committed, duplicate] = await Promise.all([
      repository.confirmAction(account, action.id, request),
      repository.confirmAction(account, action.id, request),
    ]);
    expect(duplicate.commit?.id).toBe(committed.commit?.id);
    const state = await repository.readCurrentState(account, continuity.continuityId);
    expect(state.state.characters[0]).toMatchObject({
      locationId: to,
      currentState: "Present at Harbor.",
    });
    expect(state.state.facts).toEqual(continuity.state.facts);
    expect(state.state.participation).toEqual(continuity.state.participation);
    const events = await pool.query<{ payload: unknown; event_type: string }>(
      "select payload,event_type from simulora.domain_events where commit_id=$1",
      [committed.commit!.id],
    );
    expect(events.rows).toEqual([
      {
        event_type: "CHARACTER_MOVED",
        payload: {
          actionId: action.id,
          characterId: npc,
          beforeLocationId: from,
          afterLocationId: to,
          causalFactIds: ["fact.western-signal-dim"],
        },
      },
    ]);
    await repository.rebuildReturnOrientation(account, continuity.branchId);
    expect(
      JSON.stringify(await repository.readOrientation(account, continuity.continuityId)),
    ).toContain("location.harbor");
    const fork = await repository.forkBranch(account, continuity.continuityId, {
      idempotencyKey: randomUUID(),
      name: "Moved path",
      sourceCommitId: state.headCommitId,
      expectedHeadCommitId: state.headCommitId,
    });
    expect(fork.id).not.toBe(continuity.branchId);
    expect((await repository.readCurrentState(account, continuity.continuityId)).headCommitId).toBe(
      state.headCommitId,
    );
    const restore = await repository.prepareRestore(account, continuity.branchId, point.commitId);
    expect(restore.changedSections).toContain("characters");
    await repository.confirmRestore(account, continuity.branchId, {
      proposalId: restore.id,
      digest: restore.digest,
      expectedHeadCommitId: restore.expectedHeadCommitId,
    });
    const restored = await repository.readCurrentState(account, continuity.continuityId);
    expect(restored.headCommitId).not.toBe(point.commitId);
    expect(restored.state.characters).toEqual(continuity.state.characters);
    expect(
      (
        await pool.query("select id from simulora.world_commits where id=$1", [
          committed.commit!.id,
        ])
      ).rowCount,
    ).toBe(1);
  });
  it("rejects malformed, missing-causal, unbound, wrong-source and forged L2 SQL proposals without NULL acceptance", async () => {
    const action = await propose(await fixture());
    const row = await pool.query<{ document: Record<string, unknown> }>(
      "select to_jsonb(p) as document from simulora.action_proposals p where id=$1",
      [action.proposal!.id],
    );
    const original = row.rows[0]!.document;
    const candidate = original.candidate_transition as Record<string, unknown>;
    const operation = candidate.operation as Record<string, unknown>;
    const bad = [
      { ...original, proposal_digest: "0".repeat(64) },
      { ...original, generation_attempt_id: null },
      { ...original, display_effect: {} },
      { ...original, candidate_transition: { ...candidate, responseSource: { type: "WORLD" } } },
      {
        ...original,
        candidate_transition: { ...candidate, operation: { ...operation, causalFactIds: null } },
      },
      {
        ...original,
        candidate_transition: {
          ...candidate,
          operation: { ...operation, causalFactIds: ["fact.unknown"] },
        },
      },
      {
        ...original,
        candidate_transition: { ...candidate, operation: { ...operation, afterLocationId: from } },
      },
      { ...original, candidate_transition: { ...candidate, extra: "protected" } },
    ];
    for (const document of bad) {
      const result = await pool.query<{ valid: boolean }>(
        "select simulora.action_proposal_effect_is_valid(jsonb_populate_record(null::simulora.action_proposals,$1::jsonb)) as valid",
        [JSON.stringify(document)],
      );
      expect(result.rows[0]?.valid).toBe(false);
    }
    await repository.cancelAction(account, action.id);
  });
  it("authored routes do not grant permission; L0 never creates canonical history", async () => {
    const continuity = await fixture(false);
    const rejected = await propose(continuity);
    expect(rejected.proposal).toBeNull();
    expect(rejected.status).toBe("GENERATING");
    await repository.cancelAction(account, rejected.id);
    const output = await propose(continuity, "NO_WORLD_EFFECT");
    expect(output.status).toBe("COMPLETED_NO_EFFECT");
    expect(output.statusReason).toBe("NO_WORLD_EFFECT");
    expect(output.proposal).toBeNull();
    expect(output.commit).toBeNull();
    expect(output.dialogue?.responseSource).toEqual({ type: "CHARACTER", characterId: npc });
    expect(output.dialogue?.provenance).toBe(`Generated Action ${output.id}`);
    expect(output.dialogue?.sourceHeadCommitId).toBe(continuity.headCommitId);
    expect(
      (
        await pool.query(
          "select count(*)::int as count from simulora.world_commits where action_id=$1",
          [output.id],
        )
      ).rows[0]?.count,
    ).toBe(0);
    expect(
      (
        await pool.query(
          "select count(*)::int as count from simulora.actions where status='COMPLETED_NO_EFFECT' and id=$1",
          [output.id],
        )
      ).rows[0]?.count,
    ).toBe(1);
    expect((await repository.readCurrentState(account, continuity.continuityId)).state).toEqual(
      continuity.state,
    );
    expect(
      (
        await repository.confirmAction(account, output.id, {
          proposalId: randomUUID(),
          proposalDigest: "0".repeat(64),
          expectedHeadCommitId: continuity.headCommitId,
        })
      ).status,
    ).toBe("COMPLETED_NO_EFFECT");
    expect((await repository.cancelAction(account, output.id)).status).toBe("COMPLETED_NO_EFFECT");
  });
  it("passes only same-path completed dialogue into the next authorized generation", async () => {
    const continuity = await fixture(false);
    const first = await propose(continuity, "NO_WORLD_EFFECT");
    let seen: readonly unknown[] | undefined;
    const next = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Ask Iora what she sees beyond the harbor.",
      targetCharacterId: npc,
      requestedEffect: "NO_WORLD_EFFECT",
    });
    const completed = await repository.processAction(
      next.id,
      async (request) => {
        seen = request.priorDialogue;
        return gateway.generateWorldTurn(request);
      },
      "dialogue-context-test",
    );
    expect(completed?.status).toBe("COMPLETED_NO_EFFECT");
    expect(seen?.some((entry) => (entry as { id?: string }).id === first.id)).toBe(true);
    expect(completed?.dialogue?.sourceHeadCommitId).toBe(continuity.headCommitId);
    expect((await repository.readCurrentState(account, continuity.continuityId)).headCommitId).toBe(
      continuity.headCommitId,
    );
  });
  it("rejects invalid policy identities and keeps administrative policy immutable", async () => {
    const continuity = await fixture(false);
    const policy = {
      version: "re3-routine-v1",
      npcIds: [npc],
      publicLocationIds: [from, to],
      routes: [{ fromLocationId: from, toLocationId: to, label: "harbor road" }],
    };
    for (const invalid of [
      { ...policy, npcIds: ["character.unknown"] },
      { ...policy, publicLocationIds: [from, "location.unknown"] },
      {
        ...policy,
        routes: [{ fromLocationId: from, toLocationId: "location.private", label: "private road" }],
      },
      { ...policy, routes: [{ fromLocationId: from, toLocationId: from, label: "not a move" }] },
      { ...policy, consent: "invented" },
    ])
      await expect(
        pool.query(
          "insert into simulora.re3_routine_policies (world_revision_id,document) values ($1,$2::jsonb)",
          [continuity.worldRevisionId, JSON.stringify(invalid)],
        ),
      ).rejects.toThrow();
    await pool.query(
      "insert into simulora.re3_routine_policies (world_revision_id,document) values ($1,$2::jsonb)",
      [continuity.worldRevisionId, JSON.stringify(policy)],
    );
    await expect(
      pool.query(
        "update simulora.re3_routine_policies set document=document where world_revision_id=$1",
        [continuity.worldRevisionId],
      ),
    ).rejects.toThrow();
    await expect(
      pool.query("delete from simulora.re3_routine_policies where world_revision_id=$1", [
        continuity.worldRevisionId,
      ]),
    ).rejects.toThrow();
  });
  it("stale movement cannot Commit after direct Correction and cancel/confirm has one terminal", async () => {
    const continuity = await fixture();
    const action = await propose(continuity);
    const fact = continuity.state.facts[0]!;
    const correction = await repository.submitCorrection(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "CORRECT_CONTINUITY",
      before: { statement: fact.statement, scope: fact.scope },
      after: { statement: "The signal is bright." },
      reason: "Direct observation.",
    });
    await repository.confirmAction(account, correction.id, confirmation(correction));
    await expect(
      repository.confirmAction(account, action.id, confirmation(action)),
    ).resolves.toMatchObject({ status: "CONFLICT", commit: null });
    expect(
      (await repository.readCurrentState(account, continuity.continuityId)).state.characters,
    ).toEqual(continuity.state.characters);
    await repository.cancelAction(account, action.id);
    const other = await fixture();
    const raced = await propose(other);
    await Promise.allSettled([
      repository.confirmAction(account, raced.id, confirmation(raced)),
      repository.cancelAction(account, raced.id),
    ]);
    expect(["COMMITTED", "CANCELLED"]).toContain(
      (await repository.readAction(account, raced.id)).status,
    );
    expect(
      (
        await pool.query<{ count: number }>(
          "select count(*)::int as count from simulora.world_commits where action_id=$1",
          [raced.id],
        )
      ).rows[0]!.count,
    ).toBeLessThanOrEqual(1);
  });
});
