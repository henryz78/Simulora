import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import {
  contentHash,
  lanternReachSeed,
  revealedFactBefore,
  worldDocumentSchema,
  type RequestedEffect,
} from "../../packages/domain/src/index.js";
import {
  DeterministicModelGateway,
  type WorldTurnRequest,
} from "../../packages/model-gateway/src/index.js";

/**
 * WD-1b against real PostgreSQL: author secrets revealed at L2 (ADR-WD1-3) and
 * the STORY_DECIDES requested effect (ADR-WD1-4).
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const lead = "fact.western-signal-dim";
const ledger = "The harbor ledger is sewn into the pilot's coat lining.";
const key = "A spare lens key hangs behind the observatory door.";
const cellar = "The cellar door has been bricked up for years.";

const world = worldDocumentSchema.parse({
  ...lanternReachSeed,
  characters: lanternReachSeed.characters.map((character) => ({
    ...character,
    knowledgeFactIds: [lead, "fact.ledger"],
  })),
  facts: [
    ...lanternReachSeed.facts,
    {
      id: "fact.ledger",
      statement: ledger,
      scope: "CONTINUITY_PRIVATE",
      provenance: "WD-1b",
      lifecycle: "ACTIVE",
    },
    {
      id: "fact.key",
      statement: key,
      scope: "CONTINUITY_PRIVATE",
      provenance: "WD-1b",
      lifecycle: "ACTIVE",
    },
    {
      id: "fact.cellar",
      statement: cellar,
      scope: "CONTINUITY_PRIVATE",
      provenance: "WD-1b",
      lifecycle: "ACTIVE",
    },
  ],
  discoverableFacts: [
    { factId: "fact.ledger", howToFind: "Searching the pilot's coat, or persuading Iora." },
    { factId: "fact.key", howToFind: "Looking behind the observatory door." },
  ],
  // A declared constraint makes every story Action bind its effect context.
  constraints: [{ id: "constraint.fog", statement: "No boat leaves while the fog holds." }],
});

suite("WD-1b secrets and STORY_DECIDES against PostgreSQL", () => {
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
  const submit = (
    continuity: Continuity,
    requestedEffect: RequestedEffect = "STORY_DECIDES",
    targetCharacterId?: string,
  ) =>
    repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "I search the pilot's coat hanging by the door.",
      requestedEffect,
      ...(targetCharacterId ? { targetCharacterId } : {}),
    });
  const returning =
    (operation: Record<string, unknown>, narrative: string) => (request: WorldTurnRequest) => {
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
          operation,
        },
      });
    };

  it("validates secrets in SQL and lists them by who may reveal them", async () => {
    const valid = async (document: unknown) =>
      (
        await pool.query<{ valid: boolean }>(
          "select simulora.valid_world_revision_document($1::jsonb) as valid",
          [JSON.stringify(document)],
        )
      ).rows[0]!.valid;
    expect(await valid(world)).toBe(true);
    expect(
      await valid({ ...world, discoverableFacts: [{ factId: lead, howToFind: "Shared." }] }),
    ).toBe(false);
    expect(
      await valid({ ...world, discoverableFacts: [{ factId: "fact.none", howToFind: "No." }] }),
    ).toBe(false);
    expect(
      await valid({
        ...world,
        discoverableFacts: [
          { factId: "fact.key", howToFind: "Once." },
          { factId: "fact.key", howToFind: "Twice." },
        ],
      }),
    ).toBe(false);
    expect(
      await valid({
        ...world,
        discoverableFacts: [{ factId: "fact.key", howToFind: "x", extra: 1 }],
      }),
    ).toBe(false);

    const continuity = await start();
    const seen: Record<string, unknown[] | undefined> = {};
    for (const [label, effect, character] of [
      ["world", "STORY_DECIDES", undefined],
      ["iora", "STORY_DECIDES", "character.iora"],
      ["talk", "NO_WORLD_EFFECT", undefined],
    ] as const) {
      const action = await submit(continuity, effect, character);
      const done = await repository.processAction(action.id, (request) => {
        seen[label] = request.context?.discoverable as unknown[] | undefined;
        return gateway.generateWorldTurn(request);
      });
      expect(done?.status).toBe("COMPLETED_NO_EFFECT");
    }
    expect(seen.world).toEqual([
      {
        factId: "fact.ledger",
        statement: ledger,
        howToFind: world.discoverableFacts![0]!.howToFind,
      },
      { factId: "fact.key", statement: key, howToFind: world.discoverableFacts![1]!.howToFind },
    ]);
    expect(seen.iora).toEqual([
      {
        factId: "fact.ledger",
        statement: ledger,
        howToFind: world.discoverableFacts![0]!.howToFind,
      },
    ]);
    expect(seen.talk).toBeUndefined();
  });

  it("reveals a secret at L2 with one FACT_REVEALED Event, and Restore hides it again", async () => {
    const continuity = await start();
    const action = await submit(continuity);
    const proposed = await repository.processAction(
      action.id,
      returning(
        { type: "REVEAL_FACT", factId: "fact.ledger", causalFactIds: [lead] },
        `You slit the coat's lining. ${ledger}`,
      ),
    );
    expect(proposed?.proposal).toMatchObject({
      impact: "L2",
      displayEffect: {
        target: "fact.ledger",
        before: revealedFactBefore,
        after: ledger,
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
    expect(after.state.facts.find((fact) => fact.id === "fact.ledger")?.scope).toBe("SHARED");
    expect(after.state.facts.map((fact) => fact.id)).toEqual(
      continuity.state.facts.map((fact) => fact.id),
    );
    const events = await pool.query<{ event_type: string; payload: unknown }>(
      "select event_type, payload from simulora.domain_events where commit_id = $1",
      [after.headCommitId],
    );
    expect(events.rows).toEqual([
      {
        event_type: "FACT_REVEALED",
        payload: { actionId: action.id, factId: "fact.ledger", causalFactIds: [lead] },
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

  // PX-4a (ADR-PX4-2) superseded "never rewrite" for Actions after 0057; the
  // pre-0057 rule is kept by the 0056 to 0057 upgrade test.
  it("lets the story add a fact at L2, and after 0057 propose a rewrite at L3", async () => {
    const continuity = await start();
    const added = await submit(continuity);
    const proposed = await repository.processAction(
      added.id,
      returning(
        {
          type: "ADD_FACT",
          statement: "The pilot's coat is still damp from the crossing.",
          causalFactIds: [lead],
        },
        "You lift the coat. It is still damp from the crossing.",
      ),
    );
    expect(proposed?.proposal?.impact).toBe("L2");
    await repository.cancelAction(account, added.id);

    const rewrite = await submit(continuity);
    const refused = await repository.processAction(
      rewrite.id,
      returning(
        {
          type: "UPDATE_CANONICAL_FACT",
          targetFactId: lead,
          beforeStatement: continuity.state.facts[0]!.statement,
          afterStatement: "The western signal burns bright.",
          scope: "SHARED",
          provenance: `Confirmed Action ${rewrite.id}`,
        },
        "You relight the signal.",
      ),
    );
    expect(refused?.proposal?.impact).toBe("L3");
  });

  it("refuses forged reveals at the database, beside a control that seals", async () => {
    const seal = async (options: {
      factId?: string;
      narrative?: string;
      impact?: string;
      requestedEffect?: RequestedEffect;
      targetCharacterId?: string;
      continuity?: Continuity;
    }) => {
      const continuity = options.continuity ?? (await start());
      const action = await submit(
        continuity,
        options.requestedEffect ?? "STORY_DECIDES",
        options.targetCharacterId,
      );
      const factId = options.factId ?? "fact.ledger";
      const fact = continuity.state.facts.find((item) => item.id === factId)!;
      const narrative = options.narrative ?? "You work the coat's lining open.";
      const responseSource = options.targetCharacterId
        ? { type: "CHARACTER", characterId: options.targetCharacterId }
        : { type: "WORLD" };
      const candidate = {
        schemaVersion: 1,
        actionId: action.id,
        expectedHeadCommitId: continuity.headCommitId,
        narrative,
        responseSource,
        operation: { type: "REVEAL_FACT", factId, causalFactIds: [lead] },
      };
      const displayEffect = {
        target: factId,
        before: revealedFactBefore,
        after: fact.statement,
        scope: "SHARED",
      };
      const bound = await pool.query<{
        source: string;
        dialogue: string;
        dialogue_ids: unknown;
        effect: string | null;
      }>(
        `select encode(sha256(convert_to(simulora.canonical_jsonb_text(
                  simulora.re2_generation_context($1)), 'UTF8')), 'hex') as source,
                encode(sha256(convert_to(simulora.canonical_jsonb_text(
                  simulora.authorized_action_dialogue($1)), 'UTF8')), 'hex') as dialogue,
                (select coalesce(jsonb_agg(entry.value->'id' order by entry.ordinality), '[]'::jsonb)
                   from jsonb_array_elements(coalesce(simulora.authorized_action_dialogue($1), '[]'::jsonb))
                   with ordinality entry(value, ordinality)) as dialogue_ids,
                case when simulora.mgc_effect_context($1) is null then null
                  else encode(sha256(convert_to(simulora.canonical_jsonb_text(
                    simulora.mgc_effect_context($1)), 'UTF8')), 'hex') end as effect`,
        [action.id],
      );
      // Every SHARED fact, plus the ledger a Character knows.
      const included = continuity.state.facts
        .filter(
          (item) =>
            item.scope === "SHARED" || (options.targetCharacterId && item.id === "fact.ledger"),
        )
        .map((item) => item.id);
      const manifest = {
        compilerVersion: "re2-context-v1",
        expectedHeadCommitId: continuity.headCommitId,
        participation: continuity.state.participation,
        includedFactIds: included,
        includedCharacterIds: options.targetCharacterId ? [options.targetCharacterId] : [],
        excludedScopeCounts: { unauthorized: continuity.state.facts.length - included.length },
        sourceContextDigest: bound.rows[0]!.source,
        ...((options.requestedEffect ?? "STORY_DECIDES") === "STORY_DECIDES"
          ? {
              priorDialogueIds: bound.rows[0]!.dialogue_ids,
              priorDialogueDigest: bound.rows[0]!.dialogue,
            }
          : {}),
        ...(bound.rows[0]!.effect ? { effectContextDigest: bound.rows[0]!.effect } : {}),
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
        [attemptId, JSON.stringify({ narrative, responseSource, candidate })],
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
      return action.id;
    };
    await expect(seal({})).resolves.toBeTypeOf("string");
    await expect(seal({ targetCharacterId: "character.iora" })).resolves.toBeTypeOf("string");
    const refused = /Proposal must exactly bind/;
    await expect(seal({ factId: "fact.cellar" })).rejects.toThrow(refused);
    await expect(seal({ factId: lead })).rejects.toThrow(refused);
    await expect(seal({ factId: "fact.key", targetCharacterId: "character.iora" })).rejects.toThrow(
      refused,
    );
    await expect(seal({ impact: "L3" })).rejects.toThrow(refused);
    await expect(seal({ narrative: `You open the lining. ${key}` })).rejects.toThrow(refused);
    await expect(seal({ requestedEffect: "FACT_REWRITE" })).rejects.toThrow(refused);

    // Review M2: a secret revealed in play cannot be revealed again, while the
    // same Continuity still seals a reveal of a secret that is still hidden.
    const fresh = await start();
    const first = await submit(fresh);
    const proposed = await repository.processAction(
      first.id,
      returning(
        { type: "REVEAL_FACT", factId: "fact.ledger", causalFactIds: [lead] },
        `You slit the coat's lining. ${ledger}`,
      ),
    );
    await repository.confirmAction(account, first.id, {
      proposalId: proposed!.proposal!.id,
      proposalDigest: proposed!.proposal!.digest,
      expectedHeadCommitId: proposed!.proposal!.expectedHeadCommitId,
    });
    const now = await repository.readCurrentState(account, fresh.continuityId);
    expect(now.state.facts.find((item) => item.id === "fact.ledger")?.scope).toBe("SHARED");
    const revealed = { ...fresh, headCommitId: now.headCommitId, state: now.state };
    const control = await seal({ continuity: revealed, factId: "fact.key" });
    await repository.cancelAction(account, control);
    await expect(seal({ continuity: revealed })).rejects.toThrow(refused);
  });
});
