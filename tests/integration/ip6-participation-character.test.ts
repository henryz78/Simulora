import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  contentHash,
  actionCandidateSchema,
  assertGeneratedNarrativeDoesNotAuthorUser,
  lanternReachSeed,
  participationCombinations,
  type ParticipationContract,
} from "../../packages/domain/src/index.js";
import {
  AccessDeniedError,
  AuthoritativeWorldRepository,
  ConflictError,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const account = {
  accountId: "60000000-0000-4000-8000-000000000001",
  eligibility: "adult" as const,
};
const otherAccount = {
  accountId: "60000000-0000-4000-8000-000000000002",
  eligibility: "adult" as const,
};

suite("IP-6 participation and character authority against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.join(repositoryRoot, "db", "migrations"));
    pool = createDatabasePool(connectionString, { max: 12 });
    repository = new AuthoritativeWorldRepository(pool);
  });

  afterAll(async () => pool?.end());

  it("binds explicit Character selection, authorized world context and source digest", async () => {
    const world = structuredClone(lanternReachSeed);
    const target = world.facts[0]!;
    world.facts.push(
      {
        id: "fact.account",
        statement: "ACCOUNT PRIVATE SENTINEL",
        scope: "ACCOUNT_PRIVATE",
        lifecycle: "ACTIVE",
        provenance: "Synthetic fixture",
      },
      {
        id: "fact.iora",
        statement: "IORA ONLY SENTINEL",
        scope: "CONTINUITY_PRIVATE",
        lifecycle: "ACTIVE",
        provenance: "Synthetic fixture",
      },
      {
        id: "fact.tavi",
        statement: "TAVI ONLY SENTINEL",
        scope: "CONTINUITY_PRIVATE",
        lifecycle: "ACTIVE",
        provenance: "Synthetic fixture",
      },
    );
    world.characters[0]!.knowledgeFactIds.push("fact.iora", "fact.account");
    world.characters.push({
      ...world.characters[0]!,
      id: "character.tavi",
      name: "Tavi",
      motives: ["Study tidal magic without risking the harbor."],
      knowledgeFactIds: [target.id, "fact.tavi"],
    });
    world.characters.push({
      ...world.characters[0]!,
      id: "character.observer",
      name: "Observer",
      knowledgeFactIds: [],
    });
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const gateway = new DeterministicModelGateway();
    for (const selected of ["character.iora", "character.tavi"]) {
      const input = {
        schemaVersion: 1 as const,
        idempotencyKey: randomUUID(),
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "Inspect the signal.",
        targetCharacterId: selected,
      };
      const action = await repository.submitAction(account, continuity.branchId, input);
      expect(action.targetCharacterId).toBe(selected);
      expect((await repository.submitAction(account, continuity.branchId, input)).id).toBe(
        action.id,
      );
      await expect(
        repository.submitAction(account, continuity.branchId, {
          ...input,
          targetCharacterId: selected === "character.iora" ? "character.tavi" : "character.iora",
        }),
      ).rejects.toThrow(/IDEMPOTENCY_KEY_REUSED/);
      let context: Readonly<Record<string, unknown>> | undefined;
      const proposed = await repository.processAction(action.id, (request) => {
        context = request.context;
        expect(request.character?.id).toBe(selected);
        return gateway.generateWorldTurn(request);
      });
      expect(proposed?.proposal?.responseSource).toEqual({
        type: "CHARACTER",
        characterId: selected,
      });
      expect(context?.source).toMatchObject({
        headCommitId: continuity.headCommitId,
        worldRevisionId: revision.revisionId,
        stateRevisionId: continuity.stateRevisionId,
      });
      expect(context?.current).toMatchObject({
        location: continuity.state.locations.find(
          (location) => location.id === continuity.state.characters[0]!.locationId,
        ),
      });
      const text = JSON.stringify(context);
      expect(text).toContain(world.premise);
      expect(text).toContain(
        selected === "character.iora" ? "IORA ONLY SENTINEL" : "TAVI ONLY SENTINEL",
      );
      expect(text).not.toContain(
        selected === "character.iora" ? "TAVI ONLY SENTINEL" : "IORA ONLY SENTINEL",
      );
      expect(text).not.toContain("ACCOUNT PRIVATE SENTINEL");
      const evidence = await pool.query<{
        context_manifest: { compilerVersion: string; sourceContextDigest: string };
      }>("select context_manifest from simulora.generation_attempts where action_id = $1", [
        action.id,
      ]);
      expect(evidence.rows[0]?.context_manifest).toMatchObject({
        compilerVersion: "re2-context-v1",
        sourceContextDigest: contentHash(context),
      });
      expect(
        (await repository.readCurrentState(account, continuity.continuityId)).headCommitId,
      ).toBe(continuity.headCommitId);
      await expect(
        pool.query("update simulora.actions set operation_payload = '{}'::jsonb where id = $1", [
          action.id,
        ]),
      ).rejects.toThrow(/immutable/);
      await repository.cancelAction(account, action.id);
    }
    for (const denied of ["character.unknown", "character.observer"]) {
      await expect(
        repository.submitAction(account, continuity.branchId, {
          schemaVersion: 1,
          idempotencyKey: randomUUID(),
          expectedHeadCommitId: continuity.headCommitId,
          participationExpectation: continuity.state.participation,
          intent: "Inspect the signal.",
          targetCharacterId: denied,
        }),
      ).rejects.toThrow(/unavailable/);
      await expect(
        pool.query(
          `insert into simulora.actions
      (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key, expected_head_commit_id, participation_expectation, intent, operation_payload, status)
      values ($1,$2,$3,$4,'PARTICIPATE',$5,$6,$7::jsonb,'Inspect signal.',$8::jsonb,'ACKNOWLEDGED')`,
          [
            randomUUID(),
            account.accountId,
            continuity.continuityId,
            continuity.branchId,
            randomUUID(),
            continuity.headCommitId,
            JSON.stringify(continuity.state.participation),
            JSON.stringify({ targetCharacterId: denied }),
          ],
        ),
      ).rejects.toThrow(/Selected Character/);
    }
  });

  it("replays the rejected Tavi dialogue through app, sealed SQL evidence and exact confirmation", async () => {
    const narrative =
      "Tavi keeps one hand on the observatory rail and watches the western shoals swallow the signal's glow. The waiting vessel rocks beyond the markers, her running lights steady but her crew blind to any marked channel. 'If you wave them through that dim western line right now,' Tavi says, 'they'll read it as a bearing and steer straight into the shoals. In this fog that light is barely a smear — they can't judge the gap, and the tide is already turning. I wouldn't call them in on that.' Tavi nods east instead. 'There's a sheltered approach east of the harbor markers. Send the invitation that way, or hold the vessel outside until the western signal brightens. I'm not saying what the keeper should do — but I won't pilot anyone through the west on a light that faint.'";
    const world = structuredClone(lanternReachSeed);
    world.characters[0]!.name = "Tavi";
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const action = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      targetCharacterId: "character.iora",
      intent: "Assess the western approach without inviting the vessel.",
    });
    const gateway = new DeterministicModelGateway();
    // Replay provider prose, not a new live request or acceptance of its factual assertions.
    const proposed = await repository.processAction(action.id, async (request) => {
      const generated = await gateway.generateWorldTurn(request);
      generated.narrative = narrative;
      generated.candidate = { ...actionCandidateSchema.parse(generated.candidate), narrative };
      return generated;
    });
    expect(proposed?.status).toBe("AWAITING_CONFIRMATION");
    expect((await repository.readCurrentState(account, continuity.continuityId)).headCommitId).toBe(
      continuity.headCommitId,
    );
    const evidence = await pool.query<{ valid: boolean }>(
      "select simulora.action_generation_evidence_is_valid(proposal) as valid from simulora.action_proposals proposal where action_id = $1",
      [action.id],
    );
    expect(evidence.rows[0]?.valid).toBe(true);
    await repository.confirmAction(account, action.id, {
      proposalId: proposed!.proposal!.id,
      proposalDigest: proposed!.proposal!.digest,
      expectedHeadCommitId: continuity.headCommitId,
    });
    expect((await repository.readAction(account, action.id)).status).toBe("COMMITTED");
    const aliasCollision = await pool.query<{ blocked: boolean }>(
      "select simulora.generated_narrative_authors_user($1::text, 'A_B', 'A_B') as blocked",
      ["'If you wave them through,' A_B says, 'hold outside.'"],
    );
    expect(aliasCollision.rows[0]?.blocked).toBe(true);
    for (const [text, name, blocked] of [
      ["'If you wave them through,' Tavi says, 'hold outside.'", "Tavi", false],
      ["'If you wave them through,' Tavi says, 'hold outside.'", "Iora", true],
      ["'You agreed to pay,' Tavi says, 'hold outside.'", "Tavi", true],
      ["You, Tavi says, agreed to transfer resources.", "Tavi", true],
      ["You and Tavi said the transfer is approved.", "Tavi", true],
      ["Keeper, after a pause, agreed to transfer resources.", "Tavi", true],
      ["'If you wave them through,' Keeper says, 'hold outside.'", "Keeper", true],
      ["'If you wave them through,' User says, 'hold outside.'", "User", true],
    ] as const) {
      const result = await pool.query<{ blocked: boolean }>(
        "select simulora.generated_narrative_authors_user($1::text, 'Keeper', $2::text) as blocked",
        [text, name],
      );
      expect(result.rows[0]?.blocked, text).toBe(blocked);
      const check = () => assertGeneratedNarrativeDoesNotAuthorUser(text, "Keeper", name);
      if (blocked) expect(check).toThrow();
      else expect(check).not.toThrow();
    }
  });

  it("does not resurrect pre-correction dialogue as current generation knowledge", async () => {
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const ordinary = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Inspect the signal.",
      targetCharacterId: "character.iora",
    });
    const proposal = await repository.processAction(ordinary.id, (request) =>
      new DeterministicModelGateway().generateWorldTurn(request),
    );
    if (!proposal?.proposal) throw new Error("Expected ordinary proposal");
    await repository.confirmAction(account, ordinary.id, {
      proposalId: proposal.proposal.id,
      proposalDigest: proposal.proposal.digest,
      expectedHeadCommitId: proposal.expectedHeadCommitId,
    });
    const before = await repository.readCurrentState(account, continuity.continuityId);
    const fact = before.state.facts[0]!;
    const correctedStatement = "The western signal is steady green.";
    const direct = await repository.submitCorrection(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: before.headCommitId,
      target: { type: "fact", id: fact.id },
      operation: "CORRECT_CONTINUITY",
      before: { statement: fact.statement, scope: fact.scope },
      after: { statement: correctedStatement },
      reason: "The instrument reading was checked.",
    });
    if (!direct.proposal) throw new Error("Expected correction proposal");
    await repository.confirmAction(account, direct.id, {
      proposalId: direct.proposal.id,
      proposalDigest: direct.proposal.digest,
      expectedHeadCommitId: direct.expectedHeadCommitId,
    });
    const current = await repository.readCurrentState(account, continuity.continuityId);
    const next = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent: "Ask Iora about the current green signal.",
      targetCharacterId: "character.iora",
    });
    const generated = await repository.processAction(next.id, (request) => {
      const text = JSON.stringify(request.context);
      expect(text).toContain(correctedStatement);
      expect(text).not.toContain(fact.statement);
      expect(text).not.toContain(proposal.proposal!.narrative);
      return new DeterministicModelGateway().generateWorldTurn(request);
    });
    expect(generated?.status).toBe("AWAITING_CONFIRMATION");
    await repository.cancelAction(account, next.id);
    expect((await repository.readCurrentState(account, continuity.continuityId)).headCommitId).toBe(
      current.headCommitId,
    );
  });

  it("keeps an over-budget context recoverable without calling the generator", async () => {
    const world = structuredClone(lanternReachSeed);
    world.locations.push(
      ...Array.from({ length: 13 }, (_, index) => ({
        id: `location.budget-${index}`,
        name: "Remote observatory",
        description: "x".repeat(4000),
      })),
    );
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const action = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Inspect the signal.",
    });
    let called = false;
    await repository.processAction(action.id, (request) => {
      called = true;
      return new DeterministicModelGateway().generateWorldTurn(request);
    });
    expect(called).toBe(false);
    expect(await repository.readAction(account, action.id)).toMatchObject({
      status: "FAILED_RECOVERABLE",
      statusReason: "AUTHORIZED_CONTEXT_UNAVAILABLE",
      proposal: null,
      commit: null,
    });
    await repository.cancelAction(account, action.id);
    expect((await repository.readCurrentState(account, continuity.continuityId)).headCommitId).toBe(
      continuity.headCommitId,
    );
  });

  it("rejects unavailable Character Asset lineage in a direct SQL Revision", async () => {
    const world = structuredClone(lanternReachSeed);
    world.characters[0]!.sourceAssetId = randomUUID();
    const draft = await repository.createWorld(account, world);
    const client = await pool.connect();
    try {
      await client.query("begin");
      const validationId = randomUUID();
      await client.query(
        `insert into simulora.authoring_validation_runs
        (id, world_id, draft_row_version, outcome, findings)
        values ($1, $2, $3, 'VALID', '[]'::jsonb)`,
        [validationId, draft.worldId, draft.rowVersion],
      );
      await expect(
        client.query(
          `insert into simulora.world_revisions
        (id, world_id, revision_number, source_draft_row_version, document, document_hash, validation_run_id)
        select $1, world_id, 1, row_version, document, document_hash, $2
          from simulora.world_drafts where world_id = $3`,
          [randomUUID(), validationId, draft.worldId],
        ),
      ).rejects.toThrow(/Character Asset must be active and owned/);
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it.each([
    "用户 said the gate",
    "用户 chose the gate",
    "用户 paid the gate",
    "守灯人 said the gate",
  ])("rejects mixed-script protected speech at both boundaries: %s", async (narrative) => {
    expect(() => assertGeneratedNarrativeDoesNotAuthorUser(narrative, "守灯人")).toThrow();
    const result = await pool.query<{ rejected: boolean }>(
      "select simulora.generated_narrative_authors_user($1::text, $2::text) as rejected",
      [narrative, "守灯人"],
    );
    expect(result.rows[0]?.rejected).toBe(true);
  });

  it.each([
    ["守灯人的私密暗号。", "守灯人的私密暗号"],
    ["中文😀", "中文"],
    ["PIN 123", "PIN   123"],
    ["ＰＩＮ１２３。", "PIN123"],
  ])("protects normalized excluded text: %s", async (fact, output) => {
    const result = await pool.query<{ rejected: boolean }>(
      `select simulora.generated_output_references_excluded_fact($1::text,
         jsonb_build_object('facts', jsonb_build_array(jsonb_build_object('id', 'fact.private', 'statement', $2::text))),
         '[]'::jsonb) as rejected`,
      [output, fact],
    );
    expect(result.rows[0]?.rejected).toBe(true);
  });

  it.each([
    { narrative: "用户 chose the gate", privateFact: undefined, afterStatement: undefined },
    { narrative: "守灯人 said the gate", privateFact: undefined, afterStatement: undefined },
    { narrative: undefined, privateFact: "守灯人的私密暗号。", afterStatement: "守灯人的私密暗号" },
    { narrative: undefined, privateFact: "中文😀", afterStatement: "中文" },
  ])("rejects protected output with an otherwise valid materialization: %j", async (fixture) => {
    const world = structuredClone(lanternReachSeed);
    world.userRole.name = "守灯人";
    if (fixture.privateFact) {
      world.facts.push({
        id: "fact.private-output",
        statement: fixture.privateFact,
        scope: "ACCOUNT_PRIVATE",
        provenance: "Direct private note",
        lifecycle: "ACTIVE",
      });
    }
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const safe = await prepareOrdinaryAction(continuity);
    const attempt = await pool.query<{ context_manifest: unknown }>(
      "select context_manifest from simulora.generation_attempts where action_id = $1",
      [safe.id],
    );
    await repository.cancelAction(account, safe.id);
    await expect(
      prepareRawParticipateProposal(continuity, {
        manifest: attempt.rows[0]!.context_manifest,
        completeAttempt: true,
        ...(fixture.narrative !== undefined ? { narrative: fixture.narrative } : {}),
        ...(fixture.afterStatement !== undefined ? { afterStatement: fixture.afterStatement } : {}),
      }),
    ).rejects.toThrow(/Proposal must exactly bind/);
    expect((await repository.readCurrentState(account, continuity.continuityId)).headCommitId).toBe(
      continuity.headCommitId,
    );
  });

  it("rejects malformed reusable Character Assets even with the correct hash", async () => {
    const document = {
      schemaVersion: 1,
      name: "",
      role: "valid",
      motives: [123],
      stance: "",
      knowledgeFactIds: ["NOT A STABLE ID"],
      extra: true,
    };
    await repository.ensureAccount(account);
    await expect(
      pool.query(
        `insert into simulora.character_assets (id, owner_account_id, document, document_hash)
      values ($1, $2, $3::jsonb, $4)`,
        [randomUUID(), account.accountId, JSON.stringify(document), contentHash(document)],
      ),
    ).rejects.toThrow(/document_shape/);
  });

  async function createContinuity(
    initial: ParticipationContract = {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    },
  ) {
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    return repository.startContinuity(account, revision.revisionId, initial);
  }

  async function prepareOrdinaryAction(continuity: Awaited<ReturnType<typeof createContinuity>>) {
    const action = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `g6-authority-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Ask Iora to inspect the western signal.",
    });
    const proposed = await repository.processAction(action.id, (request) =>
      new DeterministicModelGateway().generateWorldTurn(request),
    );
    if (!proposed?.proposal) throw new Error("Expected a confirmed-review Action proposal");
    return proposed;
  }

  async function prepareRawParticipateProposal(
    continuity: Awaited<ReturnType<typeof createContinuity>>,
    options: {
      manifest: unknown;
      completeAttempt?: boolean;
      afterStatement?: string;
      narrative?: string;
      attemptOutput?: unknown;
      expiresInMs?: number;
    },
  ) {
    const action = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `g6-raw-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Ask Iora whether the signal is safe.",
    });
    const narrative = options.narrative ?? "Iora refuses to light an unsafe signal.";
    const responseSource = { type: "CHARACTER" as const, characterId: "character.iora" };
    const target = continuity.state.facts.find(
      (fact) => fact.lifecycle === "ACTIVE" && fact.scope === "SHARED",
    )!;
    const candidate = {
      schemaVersion: 1 as const,
      actionId: action.id,
      expectedHeadCommitId: continuity.headCommitId,
      narrative,
      responseSource,
      operation: {
        type: "UPDATE_CANONICAL_FACT" as const,
        targetFactId: target.id,
        beforeStatement: target.statement,
        afterStatement: options.afterStatement ?? "The western signal remains dim.",
        scope: target.scope,
        provenance: `Confirmed Action ${action.id}`,
      },
    };
    const displayEffect = {
      target: target.id,
      before: target.statement,
      after: candidate.operation.afterStatement,
      scope: target.scope,
    };
    const attemptId = randomUUID();
    const proposalId = randomUUID();
    const expiresAt = new Date(Date.now() + (options.expiresInMs ?? 15 * 60_000));
    const digest = contentHash({
      actionId: action.id,
      actorAccountId: account.accountId,
      expectedHeadCommitId: continuity.headCommitId,
      candidate,
      displayEffect,
      expiresAt: expiresAt.toISOString(),
    });
    await pool.query("update simulora.actions set status = 'GENERATING' where id = $1", [
      action.id,
    ]);
    await pool.query(
      `insert into simulora.generation_attempts
       (id, action_id, attempt_number, adapter, status, context_manifest)
       values ($1, $2, 1, 'deterministic', 'RUNNING', $3::jsonb)`,
      [attemptId, action.id, JSON.stringify(options.manifest)],
    );
    if (options.completeAttempt) {
      await pool.query(
        `update simulora.generation_attempts
         set status = 'SUCCEEDED', output = $2::jsonb, completed_at = now()
         where id = $1`,
        [
          attemptId,
          JSON.stringify(options.attemptOutput ?? { narrative, responseSource, candidate }),
        ],
      );
    }
    await pool.query("update simulora.actions set status = 'VALIDATING' where id = $1", [
      action.id,
    ]);
    await pool.query(
      `insert into simulora.action_proposals
       (id, action_id, generation_attempt_id, expected_head_commit_id, schema_version,
        candidate_transition, impact_level, proposal_digest, display_effect, status, expires_at)
       values ($1, $2, $3, $4, 1, $5::jsonb, 'L3', $6, $7::jsonb, 'ACTIVE', $8)`,
      [
        proposalId,
        action.id,
        attemptId,
        continuity.headCommitId,
        JSON.stringify(candidate),
        digest,
        JSON.stringify(displayEffect),
        expiresAt,
      ],
    );
    return { action, proposalId, digest, expiresAt };
  }

  it("commits all six independent contracts through direct user Actions only", async () => {
    const continuity = await createContinuity();
    let current = await repository.readCurrentState(account, continuity.continuityId);
    const initialWithoutParticipation = structuredClone(current.state);
    initialWithoutParticipation.participation = {
      initiativeMode: "DIRECT",
      structureMode: "OPEN_ENDED",
    };

    for (const after of participationCombinations) {
      const before = current.state.participation;
      const key = `participation-${randomUUID()}`;
      const changed = await repository.changeParticipationContract(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey: key,
        expectedHeadCommitId: current.headCommitId,
        before,
        after,
      });
      expect(changed).toMatchObject({
        status: "COMMITTED",
        operationType: "CHANGE_PARTICIPATION_CONTRACT",
      });
      expect(changed.commit).not.toBeNull();
      const retry = await repository.changeParticipationContract(account, current.branchId, {
        schemaVersion: 1,
        idempotencyKey: key,
        expectedHeadCommitId: current.headCommitId,
        before,
        after,
      });
      expect(retry.id).toBe(changed.id);

      current = await repository.readCurrentState(account, continuity.continuityId);
      expect(current.state.participation).toEqual(after);
      const comparable = structuredClone(current.state);
      comparable.participation = initialWithoutParticipation.participation;
      expect(comparable).toEqual(initialWithoutParticipation);
    }

    const events = await pool.query<{
      event_type: string;
      payload: { before: ParticipationContract; after: ParticipationContract };
    }>(
      `select event_type, payload
       from simulora.domain_events
       where branch_id = $1 and event_type = 'PARTICIPATION_CONTRACT_CHANGED'
       order by created_at`,
      [continuity.branchId],
    );
    expect(events.rows).toHaveLength(6);
    expect(events.rows.map((row) => row.payload.after)).toEqual(participationCombinations);
    expect(
      await pool.query(
        `select 1 from simulora.generation_attempts g
         join simulora.actions a on a.id = g.action_id
         where a.branch_id = $1 and a.operation_type = 'CHANGE_PARTICIPATION_CONTRACT'`,
        [continuity.branchId],
      ),
    ).toHaveProperty("rowCount", 0);
  });

  it("rejects stale/mismatched expectations before generation or World mutation", async () => {
    const continuity = await createContinuity();
    const beforeCount = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.actions where branch_id = $1",
      [continuity.branchId],
    );
    await expect(
      repository.submitAction(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `ordinary-mismatch-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
        intent: "Ask Iora about the signal.",
      }),
    ).rejects.toThrow(ConflictError);
    await expect(
      repository.changeParticipationContract(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `contract-mismatch-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        before: { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
        after: { initiativeMode: "GUIDED", structureMode: "GOAL_FRAMED" },
      }),
    ).rejects.toThrow(ConflictError);
    await expect(
      repository.changeParticipationContract(otherAccount, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `foreign-contract-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        before: continuity.state.participation,
        after: { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
      }),
    ).rejects.toThrow(/Branch not found/);
    const afterCount = await pool.query<{ count: number }>(
      "select count(*)::int as count from simulora.actions where branch_id = $1",
      [continuity.branchId],
    );
    expect(afterCount.rows[0]?.count).toBe(beforeCount.rows[0]?.count);
  });

  it("allows at most one concurrent direct change against one Branch head", async () => {
    const continuity = await createContinuity();
    const attempts = await Promise.allSettled([
      repository.changeParticipationContract(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `contract-race-a-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        before: continuity.state.participation,
        after: { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
      }),
      repository.changeParticipationContract(account, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `contract-race-b-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        before: continuity.state.participation,
        after: { initiativeMode: "WORLD_ACTIVE", structureMode: "GOAL_FRAMED" },
      }),
    ]);
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((result) => result.status === "rejected")).toHaveLength(1);
    const committed = await pool.query<{ count: number }>(
      `select count(*)::int as count from simulora.actions
       where branch_id = $1 and operation_type = 'CHANGE_PARTICIPATION_CONTRACT'
         and status = 'COMMITTED'`,
      [continuity.branchId],
    );
    expect(committed.rows[0]?.count).toBe(1);
  });

  it("rejects forged Action ownership and false terminal insertion at the database boundary", async () => {
    const continuity = await createContinuity();
    await pool.query(
      `insert into simulora.accounts (id, eligibility) values ($1, 'ADULT')
       on conflict (id) do nothing`,
      [otherAccount.accountId],
    );
    const values = [
      randomUUID(),
      account.accountId,
      continuity.continuityId,
      continuity.branchId,
      `false-terminal-${randomUUID()}`,
      continuity.headCommitId,
      JSON.stringify(continuity.state.participation),
      "Forge a terminal receipt",
    ];
    await expect(
      pool.query(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent, status, terminal_at)
         values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, $8, 'COMMITTED', now())`,
        values,
      ),
    ).rejects.toThrow(/must begin as ACKNOWLEDGED/);
    values[0] = randomUUID();
    values[1] = otherAccount.accountId;
    values[4] = `foreign-action-${randomUUID()}`;
    await expect(
      pool.query(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent, status)
         values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, $8, 'ACKNOWLEDGED')`,
        values,
      ),
    ).rejects.toThrow(/Continuity owner and current active Branch head/);
  });

  it("rejects null, incomplete and extra participation authority JSON at the database boundary", async () => {
    const continuity = await createContinuity();
    const malformedExpectations = [
      { initiativeMode: "GUIDED", structureMode: null },
      { initiativeMode: "GUIDED" },
      { ...continuity.state.participation, extraAuthority: true },
    ];
    for (const expectation of malformedExpectations) {
      await expect(
        pool.query(
          `insert into simulora.actions
           (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
            expected_head_commit_id, participation_expectation, intent, status)
           values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, $8, 'ACKNOWLEDGED')`,
          [
            randomUUID(),
            account.accountId,
            continuity.continuityId,
            continuity.branchId,
            `malformed-expectation-${randomUUID()}`,
            continuity.headCommitId,
            JSON.stringify(expectation),
            "Malformed authority input",
          ],
        ),
      ).rejects.toThrow(/exact current participation contract/);
    }

    const malformedAfterContracts = [
      { initiativeMode: "DIRECT", structureMode: null },
      { initiativeMode: "DIRECT" },
      { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED", extraAuthority: true },
    ];
    for (const after of malformedAfterContracts) {
      await expect(
        pool.query(
          `insert into simulora.actions
           (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
            expected_head_commit_id, participation_expectation, intent, operation_payload, status)
           values ($1, $2, $3, $4, 'CHANGE_PARTICIPATION_CONTRACT', $5, $6, $7::jsonb,
                   $8, $9::jsonb, 'ACKNOWLEDGED')`,
          [
            randomUUID(),
            account.accountId,
            continuity.continuityId,
            continuity.branchId,
            `malformed-change-${randomUUID()}`,
            continuity.headCommitId,
            JSON.stringify(continuity.state.participation),
            "Malformed direct participation change",
            JSON.stringify({ schemaVersion: 1, before: continuity.state.participation, after }),
          ],
        ),
      ).rejects.toThrow(/exact complete before\/after contracts/);
    }
  });

  it("keeps proposal and confirmation authority evidence immutable", async () => {
    const continuity = await createContinuity();
    const proposed = await prepareOrdinaryAction(continuity);
    const proposal = proposed.proposal!;
    await expect(
      pool.query("update simulora.action_proposals set status = 'CONFIRMED' where id = $1", [
        proposal.id,
      ]),
    ).rejects.toThrow(/exact current Action, Branch head and live confirmation/);
    await expect(
      pool.query(
        `update simulora.generation_attempts set context_manifest = '{}'::jsonb
         where action_id = $1`,
        [proposed.id],
      ),
    ).rejects.toThrow(/compiled context are immutable/);
    await expect(
      pool.query(
        `update simulora.action_proposals
         set display_effect = jsonb_set(display_effect, '{after}', '"misleading"'::jsonb)
         where id = $1`,
        [proposal.id],
      ),
    ).rejects.toThrow(/proposal evidence is immutable/);
    const committed = await repository.confirmAction(account, proposed.id, {
      proposalId: proposal.id,
      proposalDigest: proposal.digest,
      expectedHeadCommitId: proposal.expectedHeadCommitId,
    });
    expect(committed.status).toBe("COMMITTED");
    await expect(
      pool.query(
        `update simulora.action_confirmations set proposal_digest = repeat('0', 64)
         where action_id = $1`,
        [proposed.id],
      ),
    ).rejects.toThrow(/action_confirmations is immutable/);
    await expect(
      pool.query("update simulora.actions set terminal_at = null where id = $1", [proposed.id]),
    ).rejects.toThrow(/Terminal Action requires terminal_at/);
    await expect(
      pool.query("update simulora.actions set acknowledged_at = now() where id = $1", [
        proposed.id,
      ]),
    ).rejects.toThrow(/identity, authority and command binding are immutable/);
  });

  it("rejects stale and expired proposal confirmation transitions", async () => {
    const continuity = await createContinuity();
    const proposed = await prepareOrdinaryAction(continuity);
    const proposal = proposed.proposal!;
    await pool.query(
      `insert into simulora.action_confirmations
       (id, action_id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        randomUUID(),
        proposed.id,
        proposal.id,
        account.accountId,
        proposal.digest,
        proposal.expectedHeadCommitId,
      ],
    );
    await repository.changeParticipationContract(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `advance-before-confirm-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      before: continuity.state.participation,
      after: { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
    });
    await expect(
      pool.query("update simulora.action_proposals set status = 'CONFIRMED' where id = $1", [
        proposal.id,
      ]),
    ).rejects.toThrow(/exact current Action, Branch head and live confirmation/);

    const expiringContinuity = await createContinuity();
    const expiring = await prepareRawParticipateProposal(expiringContinuity, {
      manifest: {
        compilerVersion: "ip6-context-v1",
        expectedHeadCommitId: expiringContinuity.headCommitId,
        participation: expiringContinuity.state.participation,
        includedFactIds: ["fact.western-signal-dim"],
        includedCharacterIds: ["character.iora"],
        excludedScopeCounts: { unauthorized: expiringContinuity.state.facts.length - 1 },
      },
      completeAttempt: true,
      expiresInMs: 2_000,
    });
    await pool.query(
      `insert into simulora.action_confirmations
       (id, action_id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        randomUUID(),
        expiring.action.id,
        expiring.proposalId,
        account.accountId,
        expiring.digest,
        expiringContinuity.headCommitId,
      ],
    );
    await pool.query("select pg_sleep(2.1)");
    await expect(
      pool.query("update simulora.action_proposals set status = 'CONFIRMED' where id = $1", [
        expiring.proposalId,
      ]),
    ).rejects.toThrow(/exact current Action, Branch head and live confirmation/);
  });

  it("rejects false terminal inserts and unbound generation evidence", async () => {
    const continuity = await createContinuity();
    await expect(
      pool.query(
        `insert into simulora.actions
         (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
          expected_head_commit_id, participation_expectation, intent, status, terminal_at)
         values ($1, $2, $3, $4, 'PARTICIPATE', $5, $6, $7::jsonb, $8,
                 'ACKNOWLEDGED', now())`,
        [
          randomUUID(),
          account.accountId,
          continuity.continuityId,
          continuity.branchId,
          `false-terminal-${randomUUID()}`,
          continuity.headCommitId,
          JSON.stringify(continuity.state.participation),
          "False terminal acknowledgement",
        ],
      ),
    ).rejects.toThrow(/non-terminal ACKNOWLEDGED/);

    const manifestFor = (fixture: typeof continuity) => ({
      compilerVersion: "ip6-context-v1",
      expectedHeadCommitId: fixture.headCommitId,
      participation: fixture.state.participation,
      includedFactIds: ["fact.western-signal-dim"],
      includedCharacterIds: ["character.iora"],
      excludedScopeCounts: { unauthorized: fixture.state.facts.length - 1 },
    });
    const incomplete = await createContinuity();
    await expect(
      prepareRawParticipateProposal(incomplete, { manifest: manifestFor(incomplete) }),
    ).rejects.toThrow(/Proposal must exactly bind/);
    const forgedContext = await createContinuity();
    await expect(
      prepareRawParticipateProposal(forgedContext, {
        manifest: {
          ...manifestFor(forgedContext),
          compilerVersion: "re2-context-v1",
          sourceContextDigest: "0".repeat(64),
        },
        completeAttempt: true,
      }),
    ).rejects.toThrow(/Proposal must exactly bind/);
    const unboundOutput = await createContinuity();
    await expect(
      prepareRawParticipateProposal(unboundOutput, {
        manifest: manifestFor(unboundOutput),
        completeAttempt: true,
        attemptOutput: {
          narrative: "Unbound output",
          responseSource: { type: "WORLD" },
          candidate: {},
        },
      }),
    ).rejects.toThrow(/Proposal must exactly bind/);
    const missingScope = await createContinuity();
    const missingCharacterScope: Record<string, unknown> = { ...manifestFor(missingScope) };
    delete missingCharacterScope.includedCharacterIds;
    await expect(
      prepareRawParticipateProposal(missingScope, {
        manifest: missingCharacterScope,
        completeAttempt: true,
      }),
    ).rejects.toThrow(/Proposal must exactly bind/);
    const authoredCommitment = await createContinuity();
    await expect(
      prepareRawParticipateProposal(authoredCommitment, {
        manifest: manifestFor(authoredCommitment),
        completeAttempt: true,
        afterStatement: "The keeper agreed to transfer resources.",
      }),
    ).rejects.toThrow(/Proposal must exactly bind/);
  });

  it("rejects Character manifests containing private or undeclared context", async () => {
    const world = structuredClone(lanternReachSeed);
    world.facts.push({
      id: "fact.keeper-private",
      statement: "The keeper privately doubts the harbor council.",
      scope: "ACCOUNT_PRIVATE",
      provenance: "Direct user note",
      lifecycle: "ACTIVE",
    });
    world.characters[0]!.knowledgeFactIds.push("fact.keeper-private");
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    await expect(
      prepareRawParticipateProposal(continuity, {
        manifest: {
          compilerVersion: "ip6-context-v1",
          expectedHeadCommitId: continuity.headCommitId,
          participation: continuity.state.participation,
          includedFactIds: ["fact.western-signal-dim", "fact.keeper-private"],
          includedCharacterIds: ["character.iora"],
          excludedScopeCounts: { unauthorized: continuity.state.facts.length - 2 },
        },
        completeAttempt: true,
      }),
    ).rejects.toThrow(/Proposal must exactly bind/);
  });

  it("rejects wrong-source and arbitrary-state raw Action materialization", async () => {
    const continuity = await createContinuity();
    const proposed = await prepareOrdinaryAction(continuity);
    const proposal = proposed.proposal!;
    const prepareConfirmation = async (client: Pick<typeof pool, "query">) => {
      await client.query(
        `insert into simulora.action_confirmations
         (id, action_id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          randomUUID(),
          proposed.id,
          proposal.id,
          account.accountId,
          proposal.digest,
          proposal.expectedHeadCommitId,
        ],
      );
      await client.query(
        "update simulora.action_proposals set status = 'CONFIRMED' where id = $1",
        [proposal.id],
      );
      await client.query("update simulora.actions set status = 'COMMITTING' where id = $1", [
        proposed.id,
      ]);
    };

    const wrongSource = await pool.connect();
    await wrongSource.query("begin");
    try {
      await prepareConfirmation(wrongSource);
      await expect(
        wrongSource.query(
          `insert into simulora.world_commits
           (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
            action_id, source_type, reason)
           values ($1, $2, $3, 'ACTION_COMMITTED', $4, $5, $6, 'WORLD', null)`,
          [
            randomUUID(),
            continuity.branchId,
            continuity.headCommitId,
            account.accountId,
            randomUUID(),
            proposed.id,
          ],
        ),
      ).rejects.toThrow(/exact user authority/);
    } finally {
      await wrongSource.query("rollback");
      wrongSource.release();
    }

    const forged = await pool.connect();
    await forged.query("begin");
    try {
      await prepareConfirmation(forged);
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      const forgedState = structuredClone(continuity.state);
      forgedState.customState = { forgedOutsideCandidate: true };
      await forged.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          action_id, source_type, reason)
         values ($1, $2, $3, 'ACTION_COMMITTED', $4, $5, $6, 'USER', null)`,
        [
          commitId,
          continuity.branchId,
          continuity.headCommitId,
          account.accountId,
          stateRevisionId,
          proposed.id,
        ],
      );
      await forged.query(
        `insert into simulora.state_revisions
         (id, branch_id, commit_id, schema_version, document, document_hash)
         values ($1, $2, $3, 1, $4::jsonb, $5)`,
        [
          stateRevisionId,
          continuity.branchId,
          commitId,
          JSON.stringify(forgedState),
          contentHash(forgedState),
        ],
      );
      await forged.query(
        `insert into simulora.domain_events
         (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope,
          cause_action_id)
         values ($1, $2, $3, 'ACTION_RECORDED', $4::jsonb, 'USER', $5, $6)`,
        [
          randomUUID(),
          continuity.branchId,
          commitId,
          JSON.stringify({ actionId: proposed.id, target: proposal.displayEffect.target }),
          proposal.displayEffect.scope,
          proposed.id,
        ],
      );
      await forged.query(
        `update simulora.branches set head_commit_id = $2, head_state_revision_id = $3
         where id = $1`,
        [continuity.branchId, commitId, stateRevisionId],
      );
      await forged.query(
        `update simulora.actions set status = 'COMMITTED', terminal_at = now() where id = $1`,
        [proposed.id],
      );
      await expect(forged.query("set constraints all immediate")).rejects.toThrow(
        /exact state, typed Event, terminal Action/,
      );
    } finally {
      await forged.query("rollback");
      forged.release();
    }
  });

  it("rejects any non-direct Commit that changes participation", async () => {
    const continuity = await createContinuity();
    const branchId = randomUUID();
    const commitId = randomUUID();
    const stateRevisionId = randomUUID();
    const changedState = structuredClone(continuity.state);
    changedState.participation = {
      initiativeMode: "WORLD_ACTIVE",
      structureMode: "GOAL_FRAMED",
    };

    const client = await pool.connect();
    await client.query("begin");
    try {
      await client.query(
        `insert into simulora.branches
         (id, continuity_id, name, status, parent_branch_id, fork_source_commit_id,
          created_by_account_id, idempotency_key)
         values ($1, $2, 'Rogue fork', 'INITIALIZING', $3, $4, $5, $6)`,
        [
          branchId,
          continuity.continuityId,
          continuity.branchId,
          continuity.headCommitId,
          account.accountId,
          `rogue-fork-${randomUUID()}`,
        ],
      );
      await client.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          source_type, reason)
         values ($1, $2, $3, 'BRANCH_FORK', $4, $5, 'USER', 'rogue participation mutation')`,
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
          JSON.stringify(changedState),
          contentHash(changedState),
        ],
      );
      await client.query(
        `update simulora.branches
         set head_commit_id = $2, head_state_revision_id = $3, status = 'ACTIVE'
         where id = $1`,
        [branchId, commitId, stateRevisionId],
      );
      await expect(client.query("set constraints all immediate")).rejects.toThrow(
        /exact source state|Only a direct participation command/,
      );
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("snapshots only an owned Character Asset and preserves that spec at runtime", async () => {
    const asset = await repository.createCharacterAsset(account, {
      document: {
        schemaVersion: 1,
        name: "Iora",
        role: "Harbor signaler responsible for reading the outer markers.",
        motives: ["Keep arriving vessels and the harbor settlement safe in the fog."],
        stance: "Iora refuses to light an unsafe signal merely to seem welcoming.",
        knowledgeFactIds: ["fact.western-signal-dim"],
      },
    });
    await expect(
      pool.query(
        `update simulora.character_assets
         set document = jsonb_set(document, '{stance}', '"tampered"'::jsonb)
         where id = $1`,
        [asset.id],
      ),
    ).rejects.toThrow(/character_assets_document_hash_matches/);
    const world = structuredClone(lanternReachSeed);
    world.characters[0] = {
      ...world.characters[0]!,
      ...asset.document,
      sourceAssetId: asset.id,
    };
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const snapshot = await pool.query<{
      source_asset_id: string;
      spec: (typeof world.characters)[0];
    }>(
      `select source_asset_id, spec from simulora.world_revision_characters
       where world_revision_id = $1`,
      [revision.revisionId],
    );
    expect(snapshot.rows[0]).toMatchObject({ source_asset_id: asset.id });

    const foreignWorld = structuredClone(world);
    const foreignDraft = await repository.createWorld(otherAccount, foreignWorld);
    await expect(
      repository.createRevision(otherAccount, foreignDraft.worldId, foreignDraft.rowVersion),
    ).rejects.toThrow(AccessDeniedError);

    await pool.query("update simulora.character_assets set status = 'DELETED' where id = $1", [
      asset.id,
    ]);
    await expect(
      repository.createRevision(account, draft.worldId, draft.rowVersion),
    ).rejects.toThrow(AccessDeniedError);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    expect(continuity.world.characters[0]).toMatchObject({
      id: "character.iora",
      stance: asset.document.stance,
      sourceAssetId: asset.id,
    });
    expect(continuity.state.characters[0]).toMatchObject({
      id: "character.iora",
      knownFactIds: ["fact.western-signal-dim"],
    });
  });

  it("filters character knowledge before the generator and records the scoped manifest", async () => {
    const world = structuredClone(lanternReachSeed);
    world.facts.push({
      id: "fact.keeper-private",
      statement: "The keeper privately doubts the harbor council.",
      scope: "ACCOUNT_PRIVATE",
      provenance: "Direct user note",
      lifecycle: "ACTIVE",
    });
    world.facts.push({
      id: "fact.iora-context",
      statement: "Iora inspected the western lens this morning.",
      scope: "CONTINUITY_PRIVATE",
      provenance: "Character observation",
      lifecycle: "ACTIVE",
    });
    world.characters[0]!.knowledgeFactIds.push("fact.keeper-private", "fact.iora-context");
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const action = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `knowledge-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Ask Iora whether the signal is safe.",
    });
    const gateway = new DeterministicModelGateway();
    let knownFactIds: string[] = [];
    const proposed = await repository.processAction(action.id, async (request) => {
      knownFactIds = request.character?.knownFacts.map((fact) => fact.id) ?? [];
      return gateway.generateWorldTurn(request);
    });
    expect(proposed?.status).toBe("AWAITING_CONFIRMATION");
    expect(knownFactIds).toEqual(["fact.western-signal-dim", "fact.iora-context"]);
    const attempt = await pool.query<{
      context_manifest: { includedFactIds: string[]; includedCharacterIds: string[] };
    }>("select context_manifest from simulora.generation_attempts where action_id = $1", [
      action.id,
    ]);
    expect(attempt.rows[0]?.context_manifest).toMatchObject({
      includedFactIds: ["fact.western-signal-dim", "fact.iora-context"],
      includedCharacterIds: ["character.iora"],
    });
  });

  it("rejects excluded private fact text at application and database materialization boundaries", async () => {
    const world = structuredClone(lanternReachSeed);
    world.facts.push({
      id: "fact.keeper-private",
      statement: "THE HIDDEN NOTE",
      scope: "ACCOUNT_PRIVATE",
      provenance: "Direct user note",
      lifecycle: "ACTIVE",
    });
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const action = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `private-output-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Ask Iora whether the signal is safe.",
    });
    const processed = await repository.processAction(action.id, (request) => {
      const responseSource = request.character
        ? ({ type: "CHARACTER", characterId: request.character.id } as const)
        : ({ type: "WORLD" } as const);
      const narrative = "Iora answers from the authorized signal context.";
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
            afterStatement: "Shared report includes the keeper private secret: THE HIDDEN NOTE.",
            scope: request.targetFact.scope,
            provenance: `Confirmed Action ${request.actionId}`,
          },
        },
      });
    });
    expect(processed?.proposal).toBeNull();
    expect(processed?.commit).toBeNull();

    const databaseContinuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    await expect(
      prepareRawParticipateProposal(databaseContinuity, {
        manifest: {
          compilerVersion: "ip6-context-v1",
          expectedHeadCommitId: databaseContinuity.headCommitId,
          participation: databaseContinuity.state.participation,
          includedFactIds: ["fact.western-signal-dim"],
          includedCharacterIds: ["character.iora"],
          excludedScopeCounts: { unauthorized: 1 },
        },
        completeAttempt: true,
        afterStatement: "Shared report includes the keeper private secret: THE HIDDEN NOTE.",
      }),
    ).rejects.toThrow(/Proposal must exactly bind/);
  });

  it("rejects short and Unicode excluded facts at the PostgreSQL disclosure boundary", async () => {
    for (const statement of ["PIN 123", "守灯人的私密暗号", "***"]) {
      const result = await pool.query<{ leaked: boolean }>(
        `select simulora.generated_output_references_excluded_fact(
           $1::text,
           jsonb_build_object(
             'facts', jsonb_build_array(jsonb_build_object('id', 'fact.private', 'statement', $2::text))
           ),
           '[]'::jsonb
         ) as leaked`,
        [`Shared report includes: ${statement}.`, statement],
      );
      expect(result.rows[0]?.leaked).toBe(true);
    }
  });

  it("rejects excluded inactive fact text at the database materialization boundary", async () => {
    const world = structuredClone(lanternReachSeed);
    world.facts.push({
      id: "fact.keeper-removed-private",
      statement: "THE REMOVED HIDDEN NOTE",
      scope: "ACCOUNT_PRIVATE",
      provenance: "Historical user note",
      lifecycle: "ACTIVE",
    });
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const removed = await repository.submitCorrection(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `remove-private-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      target: { type: "fact", id: "fact.keeper-removed-private" },
      operation: "REMOVE_CONTINUITY",
      before: { statement: "THE REMOVED HIDDEN NOTE", scope: "ACCOUNT_PRIVATE" },
      reason: "Remove the private note from current continuity.",
    });
    const removedCommitted = await repository.confirmAction(account, removed.id, {
      proposalId: removed.proposal!.id,
      proposalDigest: removed.proposal!.digest,
      expectedHeadCommitId: removed.proposal!.expectedHeadCommitId,
    });
    expect(removedCommitted.status).toBe("COMMITTED");
    const databaseContinuity = await repository.readCurrentState(account, continuity.continuityId);
    await expect(
      prepareRawParticipateProposal(databaseContinuity, {
        manifest: {
          compilerVersion: "ip6-context-v1",
          expectedHeadCommitId: databaseContinuity.headCommitId,
          participation: databaseContinuity.state.participation,
          includedFactIds: ["fact.western-signal-dim"],
          includedCharacterIds: ["character.iora"],
          excludedScopeCounts: { unauthorized: databaseContinuity.state.facts.length - 1 },
        },
        completeAttempt: true,
        afterStatement: "The report includes THE REMOVED HIDDEN NOTE.",
      }),
    ).rejects.toThrow(/Proposal must exactly bind/);
  });

  it("carries stable Character attribution into the proposal and committed history", async () => {
    const continuity = await createContinuity();
    const proposed = await prepareOrdinaryAction(continuity);
    expect(proposed.proposal?.responseSource).toEqual({
      type: "CHARACTER",
      characterId: "character.iora",
    });
    const committed = await repository.confirmAction(account, proposed.id, {
      proposalId: proposed.proposal!.id,
      proposalDigest: proposed.proposal!.digest,
      expectedHeadCommitId: proposed.proposal!.expectedHeadCommitId,
    });
    const history = await pool.query<{
      ordinal: number;
      role: string;
      speaker_character_id: string | null;
      content: string;
    }>(
      `select ordinal, role, speaker_character_id, content
       from simulora.conversation_entries where commit_id = $1 order by ordinal`,
      [committed.commit!.id],
    );
    expect(history.rows).toEqual([
      {
        ordinal: 1,
        role: "USER",
        speaker_character_id: null,
        content: "Ask Iora to inspect the western signal.",
      },
      {
        ordinal: 2,
        role: "CHARACTER",
        speaker_character_id: "character.iora",
        content: proposed.proposal!.narrative,
      },
    ]);
  });

  it("rejects generated user commitments before proposal or Commit creation", async () => {
    const continuity = await createContinuity();
    const action = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: `protected-narrative-${randomUUID()}`,
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "Ask Iora whether the signal should be lit.",
    });
    const processed = await repository.processAction(action.id, (request) => {
      const responseSource = request.character
        ? ({ type: "CHARACTER", characterId: request.character.id } as const)
        : ({ type: "WORLD" } as const);
      const narrative = "Keeper agreed to transfer resources.";
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
            afterStatement: "The signal remains dim.",
            scope: request.targetFact.scope,
            provenance: `Confirmed Action ${request.actionId}`,
          },
        },
      });
    });
    expect(processed?.proposal).toBeNull();
    expect(processed?.commit).toBeNull();
    const materialized = await pool.query<{ proposals: number; commits: number }>(
      `select
        (select count(*)::int from simulora.action_proposals where action_id = $1) as proposals,
        (select count(*)::int from simulora.world_commits where action_id = $1) as commits`,
      [action.id],
    );
    expect(materialized.rows[0]).toEqual({ proposals: 0, commits: 0 });
    const databaseGuard = await pool.query<{
      unsafe: boolean;
      interrupted: boolean;
      decided: boolean;
      passive: boolean;
      transferred: boolean;
      possessive: boolean;
      safe: boolean;
    }>(
      `select
        simulora.generated_narrative_authors_user(
          'Keeper agreed to transfer resources.', 'Keeper'
        ) as unsafe,
        simulora.generated_narrative_authors_user(
          'Keeper, after a pause, agreed to transfer resources.', 'Keeper'
        ) as interrupted,
        simulora.generated_narrative_authors_user(
          'Keeper decided to share resources.', 'Keeper'
        ) as decided,
        simulora.generated_narrative_authors_user(
          'The permit was approved by Keeper.', 'Keeper'
        ) as passive,
        simulora.generated_narrative_authors_user(
          'Resources were transferred by the keeper.', 'Keeper'
        ) as transferred,
        simulora.generated_narrative_authors_user(
          'Keeper''s consent authorized the transfer.', 'Keeper'
        ) as possessive,
        simulora.generated_narrative_authors_user(
          'Iora refuses to light an unsafe signal.', 'Keeper'
        ) as safe`,
    );
    expect(databaseGuard.rows[0]).toEqual({
      unsafe: true,
      interrupted: true,
      decided: true,
      passive: true,
      transferred: true,
      possessive: true,
      safe: false,
    });
  });

  it("keeps the database authority guard closed for short and localized roles", async () => {
    const result = await pool.query<{
      short_role: boolean;
      english_refusal: boolean;
      localized: boolean;
      han_english: boolean;
      localized_refusal: boolean;
      localized_spacing: boolean;
      cjk_passive: boolean;
      punctuation_role: boolean;
      safe_han: boolean;
      unsupported_script: boolean;
      unsupported_arabic: boolean;
      unsupported_japanese: boolean;
      unsupported_cyrillic: boolean;
      unsupported_korean: boolean;
      short_role_unsupported_script: boolean;
      generic_active: boolean;
      generic_passive: boolean;
      generic_possessive: boolean;
      generic_safe: boolean;
      cjk_passive_article: boolean;
      cjk_passive_punctuation: boolean;
      cjk_passive_case: boolean;
    }>(
      `select
        simulora.generated_narrative_authors_user(
          'AI agreed to transfer resources.', 'AI'
        ) as short_role,
        simulora.generated_narrative_authors_user(
          'Keeper refuses to transfer resources.', 'Keeper'
        ) as english_refusal,
        simulora.generated_narrative_authors_user(
          '守灯人同意转移资源。', '守灯人'
        ) as localized,
        simulora.generated_narrative_authors_user(
          '守灯人 agreed to transfer resources.', '守灯人'
        ) as han_english,
        simulora.generated_narrative_authors_user(
          '守灯人拒绝点亮危险信号。', '守灯人'
        ) as localized_refusal,
        simulora.generated_narrative_authors_user(
          '守灯人同意\u3000转移资源。', '守灯人'
        ) as localized_spacing,
        simulora.generated_narrative_authors_user(
          'The plan was approved by 守灯人.', '守灯人'
        ) as cjk_passive,
        simulora.generated_narrative_authors_user(
          'A_B agreed to go.', 'A_B'
        ) as punctuation_role,
        simulora.generated_narrative_authors_user(
          '守灯人看向灯塔。', '守灯人'
        ) as safe_han,
        simulora.generated_narrative_authors_user(
          '守灯人は同意した。', '守灯人'
        ) as unsupported_script,
        simulora.generated_narrative_authors_user(
          'المستخدم وافق على نقل الموارد。', '守灯人'
        ) as unsupported_arabic,
        simulora.generated_narrative_authors_user(
          'ユーザーは資源の移転に同意した。', '守灯人'
        ) as unsupported_japanese,
        simulora.generated_narrative_authors_user(
          'Пользователь согласился передать ресурсы.', '守灯人'
        ) as unsupported_cyrillic,
        simulora.generated_narrative_authors_user(
          '사용자는 자원 이전에 동의했다.', '守灯人'
        ) as unsupported_korean,
        simulora.generated_narrative_authors_user(
          'AIは同意した。', 'AI'
        ) as short_role_unsupported_script,
        simulora.generated_narrative_authors_user(
          'User agreed to transfer resources.', 'Keeper'
        ) as generic_active,
        simulora.generated_narrative_authors_user(
          'The plan was approved by the Participant.', 'Keeper'
        ) as generic_passive,
        simulora.generated_narrative_authors_user(
          'User''s consent authorized the transfer.', 'Keeper'
        ) as generic_possessive,
        simulora.generated_narrative_authors_user(
          'A user guide describes the signal.', 'Keeper'
        ) as generic_safe,
        simulora.generated_narrative_authors_user(
          'The plan was approved by the 守灯人.', '守灯人'
        ) as cjk_passive_article,
        simulora.generated_narrative_authors_user(
          'The plan was rejected by, the, 守灯人.', '守灯人'
        ) as cjk_passive_punctuation,
        simulora.generated_narrative_authors_user(
          'The plan was approved BY THE 守灯人.', '守灯人'
        ) as cjk_passive_case`,
    );
    expect(result.rows[0]).toEqual({
      short_role: true,
      english_refusal: true,
      localized: true,
      han_english: true,
      localized_refusal: true,
      localized_spacing: true,
      cjk_passive: true,
      punctuation_role: true,
      safe_han: false,
      unsupported_script: true,
      unsupported_arabic: true,
      unsupported_japanese: true,
      unsupported_cyrillic: true,
      unsupported_korean: true,
      short_role_unsupported_script: true,
      generic_active: true,
      generic_passive: true,
      generic_possessive: true,
      generic_safe: false,
      cjk_passive_article: true,
      cjk_passive_punctuation: true,
      cjk_passive_case: true,
    });
  });

  it("rejects an otherwise exact raw Action Commit when attributed history is missing", async () => {
    const continuity = await createContinuity();
    const proposed = await prepareOrdinaryAction(continuity);
    const proposal = proposed.proposal!;
    const client = await pool.connect();
    await client.query("begin");
    try {
      await client.query(
        `insert into simulora.action_confirmations
         (id, action_id, proposal_id, actor_account_id, proposal_digest, expected_head_commit_id)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          randomUUID(),
          proposed.id,
          proposal.id,
          account.accountId,
          proposal.digest,
          proposal.expectedHeadCommitId,
        ],
      );
      await client.query(
        "update simulora.action_proposals set status = 'CONFIRMED' where id = $1",
        [proposal.id],
      );
      await client.query("update simulora.actions set status = 'COMMITTING' where id = $1", [
        proposed.id,
      ]);
      const expected = await client.query<{ document: unknown }>(
        "select simulora.expected_action_state($1) as document",
        [proposed.id],
      );
      const document = expected.rows[0]!.document;
      const commitId = randomUUID();
      const stateRevisionId = randomUUID();
      await client.query(
        `insert into simulora.world_commits
         (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
          action_id, source_type, reason)
         values ($1, $2, $3, 'ACTION_COMMITTED', $4, $5, $6, 'USER', $7)`,
        [
          commitId,
          continuity.branchId,
          continuity.headCommitId,
          account.accountId,
          stateRevisionId,
          proposed.id,
          proposed.id,
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
          JSON.stringify(document),
          contentHash(document),
        ],
      );
      await client.query(
        `insert into simulora.domain_events
         (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope,
          cause_action_id)
         values ($1, $2, $3, 'ACTION_RECORDED', $4::jsonb, 'USER', $5, $6)`,
        [
          randomUUID(),
          continuity.branchId,
          commitId,
          JSON.stringify({ actionId: proposed.id, target: proposal.displayEffect.target }),
          proposal.displayEffect.scope,
          proposed.id,
        ],
      );
      await client.query(
        `update simulora.branches set head_commit_id = $2, head_state_revision_id = $3
         where id = $1`,
        [continuity.branchId, commitId, stateRevisionId],
      );
      await client.query(
        "update simulora.actions set status = 'COMMITTED', terminal_at = now() where id = $1",
        [proposed.id],
      );
      await expect(client.query("set constraints all immediate")).rejects.toThrow(
        /exact attributed conversation history/,
      );
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});
