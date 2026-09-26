import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import {
  worldDocumentSchema,
  type RequestedEffect,
  type WorldDocument,
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
 * TB-1 / ADR-TB1 against real PostgreSQL: a later turn's context carries what
 * already happened on the path, without passing on knowledge the addressed
 * Character may not have.
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const gateway = new DeterministicModelGateway();
const secret = "Tavi hid a spare lamp under the harbor steps.";

// Tavi alone knows a continuity-private fact; Iora knows only the shared signal.
const world: WorldDocument = worldDocumentSchema.parse({
  ...mgcClosureWorld,
  characters: mgcClosureWorld.characters.map((character) =>
    character.id === "character.tavi"
      ? { ...character, knowledgeFactIds: ["fact.western-signal-dim", "fact.tavi-lamp"] }
      : character,
  ),
  facts: [
    ...mgcClosureWorld.facts,
    {
      id: "fact.tavi-lamp",
      statement: secret,
      scope: "CONTINUITY_PRIVATE",
      provenance: "Test fixture",
      lifecycle: "ACTIVE",
    },
  ],
});

type Outcome = {
  commitId: string;
  events: Array<{ type: string; text: string }>;
  exchange: Array<{ role: string; characterId: string | null; content: string }>;
};

suite("TB-1 committed outcomes in the generation context", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  const account = { accountId: randomUUID(), eligibility: "adult" as const };

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.resolve("db/migrations"));
    pool = createDatabasePool(connectionString, { max: 8 });
    repository = new AuthoritativeWorldRepository(pool);
  });
  afterAll(async () => pool?.end());

  async function start() {
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    await pool.query(
      "insert into simulora.re3_routine_policies (world_revision_id, document) values ($1, $2::jsonb)",
      [revision.revisionId, JSON.stringify(mgcClosureRoutinePolicy)],
    );
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    return continuity.continuityId;
  }

  async function submit(
    continuityId: string,
    requestedEffect: RequestedEffect,
    extra: { targetCharacterId?: string; targetThreadId?: string },
  ) {
    const current = await repository.readCurrentState(account, continuityId);
    return repository.submitAction(account, current.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: current.headCommitId,
      participationExpectation: current.state.participation,
      intent: "Carry word toward the harbor.",
      requestedEffect,
      ...extra,
    });
  }

  async function commit(
    continuityId: string,
    requestedEffect: RequestedEffect,
    extra: { targetCharacterId?: string; targetThreadId?: string },
    generate = (request: WorldTurnRequest) => gateway.generateWorldTurn(request),
  ) {
    const submitted = await submit(continuityId, requestedEffect, extra);
    const processed =
      (await repository.processAction(submitted.id, generate, "tb1-worker")) ??
      (await repository.readAction(account, submitted.id));
    const confirmed = await repository.confirmAction(account, processed.id, {
      proposalId: processed.proposal!.id,
      proposalDigest: processed.proposal!.digest,
      expectedHeadCommitId: processed.proposal!.expectedHeadCommitId,
    });
    expect(confirmed.status).toBe("COMMITTED");
    return confirmed;
  }

  async function context(actionId: string) {
    const result = await pool.query<{
      now: Record<string, unknown> | null;
      before: Record<string, unknown> | null;
    }>(
      `select simulora.re2_generation_context($1::uuid) as now,
              simulora.re2_generation_context_pre_tb1($1::uuid) as before`,
      [actionId],
    );
    return result.rows[0]!;
  }

  /** Tavi resolves a thread in words that name the private fact. */
  const resolveNamingSecret = (request: WorldTurnRequest): Promise<WorldTurnDraft> => {
    const responseSource = { type: "CHARACTER", characterId: "character.tavi" } as const;
    const narrative = "Tavi checks the steps and nods at the markers.";
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
          type: "RESOLVE_THREAD",
          threadId: request.targetThreadId,
          resolution: `The vessel answers the lamp. ${secret}`,
          causalFactIds: [request.targetFact.id],
        },
      },
    });
  };

  it("adds committed outcomes and changes nothing else in the RE-2 context", async () => {
    const continuityId = await start();
    const first = await submit(continuityId, "NO_WORLD_EFFECT", {
      targetCharacterId: "character.iora",
    });
    const opening = await context(first.id);
    expect(opening.now).toEqual({ ...opening.before, committedOutcomes: [] });
    await repository.cancelAction(account, first.id);

    // Tavi's attempt meets the flood rule; Tavi then resolves the opening thread.
    await commit(continuityId, "ROUTINE_EFFECT", { targetCharacterId: "character.tavi" });
    await commit(
      continuityId,
      "THREAD_EFFECT",
      { targetCharacterId: "character.tavi", targetThreadId: "thread.vessel" },
      resolveNamingSecret,
    );

    const toIora = await submit(continuityId, "NO_WORLD_EFFECT", {
      targetCharacterId: "character.iora",
    });
    const iora = await context(toIora.id);
    const { committedOutcomes, ...rest } = iora.now as { committedOutcomes: Outcome[] };
    expect(rest).toEqual(iora.before);
    const ioraText = JSON.stringify(committedOutcomes);
    // Iora is told the transformed attempt, oldest first ...
    expect(committedOutcomes[0]!.events).toEqual([
      expect.objectContaining({ type: "ATTEMPT_TRANSFORMED" }),
    ]);
    // ... but neither Tavi's exchanges (generated with the private fact) nor the
    // resolution that names it.
    expect(ioraText).not.toContain("spare lamp");
    expect(committedOutcomes.flatMap((item) => item.exchange)).toEqual([]);
    expect(ioraText).not.toContain("THREAD_RESOLVED");
    await repository.cancelAction(account, toIora.id);

    // Tavi, who knows the fact, is told all of it, including the exchanges.
    const toTavi = await submit(continuityId, "NO_WORLD_EFFECT", {
      targetCharacterId: "character.tavi",
    });
    const tavi = (await context(toTavi.id)).now as { committedOutcomes: Outcome[] };
    expect(tavi.committedOutcomes.map((item) => item.events[0]?.type)).toEqual([
      "ATTEMPT_TRANSFORMED",
      "THREAD_RESOLVED",
    ]);
    expect(JSON.stringify(tavi.committedOutcomes)).toContain("spare lamp");
    expect(tavi.committedOutcomes[0]!.exchange.map((entry) => entry.role)).toEqual([
      "USER",
      "CHARACTER",
    ]);
    await repository.cancelAction(account, toTavi.id);
  });

  it("a proposal generated with outcomes still confirms against its evidence", async () => {
    const continuityId = await start();
    await commit(continuityId, "ROUTINE_EFFECT", { targetCharacterId: "character.tavi" });
    const followUp = await commit(continuityId, "FACT_REWRITE", {
      targetCharacterId: "character.iora",
    });
    expect(followUp.status).toBe("COMMITTED");
    const manifest = await pool.query<{ digest: string }>(
      `select context_manifest->>'sourceContextDigest' as digest
         from simulora.generation_attempts where action_id = $1 and status = 'SUCCEEDED'`,
      [followUp.id],
    );
    expect(manifest.rows[0]!.digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("the epoch is fixed", async () => {
    await expect(pool.query("delete from simulora.tb1_outcome_context_epoch")).rejects.toThrow();
  });
});
