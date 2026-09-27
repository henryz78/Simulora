import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import {
  addedFactBefore,
  contentHash,
  factIdForAction,
  lanternReachSeed,
  worldDocumentSchema,
} from "../../packages/domain/src/index.js";
import {
  DeterministicModelGateway,
  type WorldTurnRequest,
} from "../../packages/model-gateway/src/index.js";

/**
 * WD-1a against real PostgreSQL: every shared fact is in the context, and a fact
 * change may add one new SHARED fact at L2 (ADR-WD1-1, ADR-WD1-2).
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const lead = "fact.western-signal-dim";
const vessel = "fact.vessel-waiting";
const vesselText = "An unfamiliar vessel waits beyond the harbor markers.";
const ioraSecret = "Iora saw a lantern signal answered from the vessel at dawn.";
const keeperNote = "The keeper hid the harbor ledger under the loose stair.";

const world = worldDocumentSchema.parse({
  ...lanternReachSeed,
  characters: lanternReachSeed.characters.map((character) => ({
    ...character,
    knowledgeFactIds: [lead, "fact.iora-secret"],
  })),
  facts: [
    ...lanternReachSeed.facts,
    {
      id: vessel,
      statement: vesselText,
      scope: "SHARED",
      provenance: "WD-1a",
      lifecycle: "ACTIVE",
    },
    {
      id: "fact.iora-secret",
      statement: ioraSecret,
      scope: "CONTINUITY_PRIVATE",
      provenance: "WD-1a",
      lifecycle: "ACTIVE",
    },
    {
      id: "fact.keeper-note",
      statement: keeperNote,
      scope: "ACCOUNT_PRIVATE",
      provenance: "WD-1a",
      lifecycle: "ACTIVE",
    },
  ],
});

suite("WD-1a shared world against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  let revisionId: string;
  const account = { accountId: randomUUID(), eligibility: "adult" as const };
  const gateway = new DeterministicModelGateway();

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.resolve("db/migrations"));
    pool = createDatabasePool(connectionString, { max: 8 });
    repository = new AuthoritativeWorldRepository(pool);
    const draft = await repository.createWorld(account, world);
    revisionId = (await repository.createRevision(account, draft.worldId, draft.rowVersion))
      .revisionId;
  });
  afterAll(async () => pool?.end());

  const start = () =>
    repository.startContinuity(account, revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
  type Continuity = Awaited<ReturnType<typeof start>>;
  const submit = (continuity: Continuity, targetCharacterId?: string) =>
    repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "I scan the harbor markers through the glass.",
      requestedEffect: "FACT_REWRITE",
      ...(targetCharacterId ? { targetCharacterId } : {}),
    });
  const addFact =
    (statement: string, causalFactIds = [vessel]) =>
    (request: WorldTurnRequest) => {
      const narrative = "You scan the markers. A second hull rides low behind the first.";
      const candidate = {
        schemaVersion: 1,
        actionId: request.actionId,
        expectedHeadCommitId: request.expectedHeadCommitId,
        narrative,
        responseSource: { type: "WORLD" },
        operation: { type: "ADD_FACT", statement, causalFactIds },
      };
      return Promise.resolve({ narrative, responseSource: { type: "WORLD" as const }, candidate });
    };
  const manifestOf = async (actionId: string) =>
    (
      await pool.query<{ context_manifest: Record<string, unknown> }>(
        "select context_manifest from simulora.generation_attempts where action_id = $1",
        [actionId],
      )
    ).rows[0]!.context_manifest;
  const evidenceValid = async (actionId: string) =>
    (
      await pool.query<{ valid: boolean }>(
        "select simulora.action_generation_evidence_is_valid(p) as valid from simulora.action_proposals p where action_id = $1",
        [actionId],
      )
    ).rows[0]?.valid;

  it("puts every shared fact in the context, and private facts only where a Character knows them", async () => {
    const gate = await pool.query<{ before: boolean; after: boolean }>(
      `select simulora.wd1_shared_world_apply('2000-01-01T00:00:00Z') as before,
              simulora.wd1_shared_world_apply(now()) as after`,
    );
    expect(gate.rows[0]).toEqual({ before: false, after: true });
    await expect(
      pool.query(
        "update app_meta.schema_migrations set applied_at = applied_at + interval '1 day' where name = $1",
        ["0055_wd1a_shared_world.sql"],
      ),
    ).rejects.toThrow("The WD-1a shared-world epoch is immutable");

    const continuity = await start();
    const unaddressed = await submit(continuity);
    let worldContext = "";
    const proposed = await repository.processAction(unaddressed.id, (request) => {
      worldContext = JSON.stringify(request.context);
      expect(request.sharedWorld).toBe(true);
      return addFact("A second, smaller hull rides low behind the waiting vessel.")(request);
    });
    expect(proposed?.status).toBe("AWAITING_CONFIRMATION");
    expect(worldContext).toContain(vesselText);
    expect(worldContext).not.toContain(ioraSecret);
    expect(worldContext).not.toContain(keeperNote);
    expect(await manifestOf(unaddressed.id)).toMatchObject({
      includedFactIds: [lead, vessel],
      includedCharacterIds: [],
    });
    expect(await evidenceValid(unaddressed.id)).toBe(true);
    await repository.cancelAction(account, unaddressed.id);

    const addressed = await submit(continuity, "character.iora");
    let characterContext = "";
    await repository.processAction(addressed.id, (request) => {
      characterContext = JSON.stringify(request.context);
      return gateway.generateWorldTurn(request);
    });
    expect(characterContext).toContain(vesselText);
    expect(characterContext).toContain(ioraSecret);
    expect(characterContext).not.toContain(keeperNote);
    expect(await manifestOf(addressed.id)).toMatchObject({
      includedFactIds: [lead, vessel, "fact.iora-secret"],
      includedCharacterIds: ["character.iora"],
    });
    expect(await evidenceValid(addressed.id)).toBe(true);
    await repository.cancelAction(account, addressed.id);
  });

  it("records ADD_FACT at L2 with one FACT_ADDED Event, and Restore removes it", async () => {
    const continuity = await start();
    const action = await submit(continuity);
    const statement = "A second, smaller hull rides low behind the waiting vessel.";
    const proposed = await repository.processAction(action.id, addFact(statement));
    expect(proposed?.proposal).toMatchObject({
      impact: "L2",
      displayEffect: {
        target: factIdForAction(action.id),
        before: addedFactBefore,
        after: statement,
        scope: "SHARED",
      },
    });
    const committed = await repository.confirmAction(account, action.id, {
      proposalId: proposed!.proposal!.id,
      proposalDigest: proposed!.proposal!.digest,
      expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
    });
    expect(committed.status).toBe("COMMITTED");
    const after = await repository.readCurrentState(account, continuity.continuityId);
    expect(after.state.facts.slice(0, continuity.state.facts.length)).toEqual(
      continuity.state.facts,
    );
    expect(after.state.facts.at(-1)).toEqual({
      id: factIdForAction(action.id),
      statement,
      scope: "SHARED",
      provenance: `Confirmed Action ${action.id}`,
      lifecycle: "ACTIVE",
    });
    const events = await pool.query<{ event_type: string; payload: unknown }>(
      "select event_type, payload from simulora.domain_events where commit_id = $1",
      [after.headCommitId],
    );
    expect(events.rows).toEqual([
      {
        event_type: "FACT_ADDED",
        payload: {
          actionId: action.id,
          factId: factIdForAction(action.id),
          statement,
          causalFactIds: [vessel],
        },
      },
    ]);

    const review = await repository.prepareRestore(
      account,
      continuity.branchId,
      continuity.headCommitId,
    );
    await repository.confirmRestore(account, continuity.branchId, {
      proposalId: review.id,
      digest: review.digest,
      expectedHeadCommitId: review.expectedHeadCommitId,
    });
    const restored = await repository.readCurrentState(account, continuity.continuityId);
    expect(restored.state.facts).toEqual(continuity.state.facts);
  });

  it("rewrites a shared fact that is not the lead, still at L3", async () => {
    const continuity = await start();
    const action = await submit(continuity);
    const afterStatement = "The unfamiliar vessel has dropped anchor inside the markers.";
    const proposed = await repository.processAction(action.id, (request) => {
      const narrative = "You watch the vessel slip past the outer marker and drop anchor.";
      const candidate = {
        schemaVersion: 1,
        actionId: request.actionId,
        expectedHeadCommitId: request.expectedHeadCommitId,
        narrative,
        responseSource: { type: "WORLD" },
        operation: {
          type: "UPDATE_CANONICAL_FACT",
          targetFactId: vessel,
          beforeStatement: vesselText,
          afterStatement,
          scope: "SHARED",
          provenance: `Confirmed Action ${request.actionId}`,
        },
      };
      return Promise.resolve({ narrative, responseSource: { type: "WORLD" as const }, candidate });
    });
    expect(proposed?.proposal?.impact).toBe("L3");
    const committed = await repository.confirmAction(account, action.id, {
      proposalId: proposed!.proposal!.id,
      proposalDigest: proposed!.proposal!.digest,
      expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
    });
    expect(committed.status).toBe("COMMITTED");
    const after = await repository.readCurrentState(account, continuity.continuityId);
    expect(after.state.facts.find((fact) => fact.id === vessel)?.statement).toBe(afterStatement);
    expect(after.state.facts.find((fact) => fact.id === lead)).toEqual(continuity.state.facts[0]);
  });

  it("refuses forged ADD_FACT proposals at the database, beside a control that seals", async () => {
    // Seals a raw attempt and proposal whose evidence is self-consistent, so a
    // refusal comes from the one element each case changes.
    const seal = async (options: {
      statement?: string;
      causalFactIds?: string[];
      impact?: string;
      target?: string;
    }) => {
      const continuity = await start();
      const action = await submit(continuity);
      const statement = options.statement ?? "A gull circles the waiting vessel's mast.";
      const narrative = "You watch the harbor. A gull circles above the vessel.";
      const candidate = {
        schemaVersion: 1,
        actionId: action.id,
        expectedHeadCommitId: continuity.headCommitId,
        narrative,
        responseSource: { type: "WORLD" },
        operation: {
          type: "ADD_FACT",
          statement,
          causalFactIds: options.causalFactIds ?? [vessel],
        },
      };
      const displayEffect = {
        target: options.target ?? factIdForAction(action.id),
        before: addedFactBefore,
        after: statement,
        scope: "SHARED",
      };
      const source = await pool.query<{ digest: string }>(
        `select encode(sha256(convert_to(simulora.canonical_jsonb_text(
           simulora.re2_generation_context($1)), 'UTF8')), 'hex') as digest`,
        [action.id],
      );
      const manifest = {
        compilerVersion: "re2-context-v1",
        expectedHeadCommitId: continuity.headCommitId,
        participation: continuity.state.participation,
        includedFactIds: [lead, vessel],
        includedCharacterIds: [],
        excludedScopeCounts: { unauthorized: continuity.state.facts.length - 2 },
        sourceContextDigest: source.rows[0]!.digest,
      };
      const attemptId = randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60_000);
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
        [attemptId, action.id, JSON.stringify(manifest)],
      );
      await pool.query(
        `update simulora.generation_attempts
         set status = 'SUCCEEDED', output = $2::jsonb, completed_at = now() where id = $1`,
        [attemptId, JSON.stringify({ narrative, responseSource: { type: "WORLD" }, candidate })],
      );
      await pool.query("update simulora.actions set status = 'VALIDATING' where id = $1", [
        action.id,
      ]);
      await pool.query(
        `insert into simulora.action_proposals
         (id, action_id, generation_attempt_id, expected_head_commit_id, schema_version,
          candidate_transition, impact_level, proposal_digest, display_effect, status, expires_at)
         values ($1, $2, $3, $4, 1, $5::jsonb, $6, $7, $8::jsonb, 'ACTIVE', $9)`,
        [
          randomUUID(),
          action.id,
          attemptId,
          continuity.headCommitId,
          JSON.stringify(candidate),
          options.impact ?? "L2",
          digest,
          JSON.stringify(displayEffect),
          expiresAt,
        ],
      );
    };
    await expect(seal({})).resolves.toBeUndefined();
    const refused = /Proposal must exactly bind/;
    await expect(seal({ impact: "L3" })).rejects.toThrow(refused);
    await expect(seal({ target: "fact.chosen-by-the-model" })).rejects.toThrow(refused);
    await expect(seal({ causalFactIds: ["fact.keeper-note"] })).rejects.toThrow(refused);
    await expect(seal({ statement: keeperNote })).rejects.toThrow(refused);
    await expect(
      seal({ statement: `The ${world.userRole.name} agreed to pay the pilot.` }),
    ).rejects.toThrow(refused);
  });
});
