import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { lanternReachSeed, type StateRevisionDocument } from "../../packages/domain/src/index.js";
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
 * PX-4a (ADR-PX4-2) against real PostgreSQL: under STORY_DECIDES the model may
 * choose any closed operation, and SQL accepts exactly what the application
 * accepts, with the same impact and one typed Event per Commit.
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const lead = "fact.western-signal-dim";

type Continuity = { branchId: string; headCommitId: string; state: StateRevisionDocument };
type Generate = (request: WorldTurnRequest) => Promise<WorldTurnDraft>;

// Tavi may walk from the observatory, where the fixture starts him, to the harbor.
const storyPolicy = {
  ...mgcClosureRoutinePolicy,
  routes: [
    {
      fromLocationId: "location.tidal-observatory",
      toLocationId: "location.harbor",
      label: "the harbor path",
    },
  ],
};

suite("PX-4a story freedom against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  const account = { accountId: randomUUID(), eligibility: "adult" as const };
  const gateway = new DeterministicModelGateway();

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.resolve("db/migrations"));
    pool = createDatabasePool(connectionString, { max: 8 });
    repository = new AuthoritativeWorldRepository(pool);
  });
  afterAll(async () => pool?.end());

  async function fixture(world = mgcClosureWorld, policy: object | null = storyPolicy) {
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    if (policy)
      await pool.query(
        "insert into simulora.re3_routine_policies (world_revision_id, document) values ($1, $2::jsonb)",
        [revision.revisionId, JSON.stringify(policy)],
      );
    return repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
  }

  async function current(continuityId: string): Promise<Continuity> {
    const state = await repository.readCurrentState(account, continuityId);
    return { branchId: state.branchId, headCommitId: state.headCommitId, state: state.state };
  }

  function scripted(operation: (request: WorldTurnRequest) => Record<string, unknown>): Generate {
    return (request) => {
      const responseSource = request.character
        ? ({ type: "CHARACTER", characterId: request.character.id } as const)
        : ({ type: "WORLD" } as const);
      const narrative = "The room answers what you did.";
      return Promise.resolve({
        narrative,
        responseSource,
        candidate: {
          schemaVersion: 1,
          actionId: request.actionId,
          expectedHeadCommitId: request.expectedHeadCommitId,
          narrative,
          responseSource,
          operation: operation(request),
        },
      });
    };
  }

  async function story(
    continuity: Continuity,
    generate: Generate,
    targetCharacterId?: string,
    seen?: (request: WorldTurnRequest) => void,
  ) {
    const submitted = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "I pull the ledger out of the coat and set it on the counter.",
      requestedEffect: "STORY_DECIDES",
      ...(targetCharacterId ? { targetCharacterId } : {}),
    });
    const processed = await repository.processAction(
      submitted.id,
      (request) => {
        seen?.(request);
        return generate(request);
      },
      "px4-worker",
    );
    return processed ?? repository.readAction(account, submitted.id);
  }

  async function sqlValid(proposalId: string, patch: Record<string, unknown> = {}) {
    const result = await pool.query<{ valid: boolean }>(
      `select simulora.action_proposal_effect_is_valid(
         jsonb_populate_record(null::simulora.action_proposals,
           (select to_jsonb(p) from simulora.action_proposals p where id = $1) || $2::jsonb)) as valid`,
      [proposalId, JSON.stringify(patch)],
    );
    return result.rows[0]!.valid;
  }

  async function confirm(action: Awaited<ReturnType<typeof story>>) {
    if (!action.proposal) throw new Error(`Expected a proposal, got ${action.status}`);
    const committed = await repository.confirmAction(account, action.id, {
      proposalId: action.proposal.id,
      proposalDigest: action.proposal.digest,
      expectedHeadCommitId: action.proposal.expectedHeadCommitId,
    });
    expect(committed.status).toBe("COMMITTED");
    const events = await pool.query<{ event_type: string; payload: Record<string, unknown> }>(
      "select event_type, payload from simulora.domain_events where commit_id = $1",
      [committed.commit!.resultingHeadCommitId],
    );
    expect(events.rows).toHaveLength(1);
    return events.rows[0]!;
  }

  it("rewrites a shared fact at L3 and commits it", async () => {
    const start = await fixture();
    const before = start.state.facts.find((fact) => fact.id === lead)!;
    const action = await story(
      start,
      scripted((request) => ({
        type: "UPDATE_CANONICAL_FACT",
        targetFactId: lead,
        beforeStatement: before.statement,
        afterStatement: "The western signal burns bright again.",
        scope: "SHARED",
        provenance: `Confirmed Action ${request.actionId}`,
      })),
    );
    expect(action.proposal).toMatchObject({
      impact: "L3",
      displayEffect: { target: lead, before: before.statement },
    });
    expect(await sqlValid(action.proposal!.id)).toBe(true);
    // SQL derives the impact; a story rewrite cannot claim L2.
    expect(await sqlValid(action.proposal!.id, { impact_level: "L2" })).toBe(false);
    await confirm(action);
    const after = await current(start.continuityId);
    expect(after.state.facts.find((fact) => fact.id === lead)?.statement).toBe(
      "The western signal burns bright again.",
    );
  });

  it("shifts the addressed Character's relationship and binds the effect context", async () => {
    const start = await fixture();
    let offered: WorldTurnRequest | undefined;
    const action = await story(
      start,
      scripted(() => ({
        type: "SHIFT_RELATIONSHIP",
        relationshipId: "relationship.iora-tavi",
        beforeState: "wary",
        afterState: "cordial",
        causalFactIds: [lead],
      })),
      "character.iora",
      (request) => (offered = request),
    );
    expect(offered?.storyFreedom).toBe(true);
    expect(offered?.effectContext?.relationships.map((item) => item.id)).toContain(
      "relationship.iora-tavi",
    );
    expect(action.proposal?.impact).toBe("L2");
    expect(await sqlValid(action.proposal!.id)).toBe(true);
    const digests = await pool.query<{ manifest: string; sql: string }>(
      `select g.context_manifest->>'effectContextDigest' as manifest,
              encode(sha256(convert_to(simulora.canonical_jsonb_text(
                simulora.mgc_effect_context($1)), 'UTF8')), 'hex') as sql
         from simulora.generation_attempts g where g.action_id = $1 and g.status = 'SUCCEEDED'`,
      [action.id],
    );
    expect(digests.rows[0]!.manifest).toBe(digests.rows[0]!.sql);
    const event = await confirm(action);
    expect(event.event_type).toBe("RELATIONSHIP_SHIFTED");
  });

  it("opens a thread, and resolves an open thread nobody targeted", async () => {
    const start = await fixture();
    const opened = await story(
      start,
      scripted(() => ({
        type: "OPEN_THREAD",
        title: "Who sewed the ledger into the coat",
        causalFactIds: [lead],
      })),
    );
    expect(opened.proposal?.impact).toBe("L2");
    expect(await sqlValid(opened.proposal!.id)).toBe(true);
    expect((await confirm(opened)).event_type).toBe("THREAD_OPENED");

    const resolved = await story(
      await current(start.continuityId),
      scripted(() => ({
        type: "RESOLVE_THREAD",
        threadId: "thread.vessel",
        resolution: "The vessel's pilot admits why she waits.",
        causalFactIds: [lead],
      })),
    );
    expect(resolved.proposal?.impact).toBe("L2");
    expect(await sqlValid(resolved.proposal!.id)).toBe(true);
    expect((await confirm(resolved)).event_type).toBe("THREAD_RESOLVED");
    const after = await current(start.continuityId);
    expect(after.state.threads?.find((thread) => thread.id === "thread.vessel")?.status).toBe(
      "RESOLVED",
    );
  });

  it("moves only a Character the routine policy lets move", async () => {
    const start = await fixture();
    const move = (characterId: string) =>
      scripted(() => ({
        type: "MOVE_CHARACTER",
        characterId,
        beforeLocationId: "location.tidal-observatory",
        afterLocationId: "location.harbor",
        causalFactIds: [lead],
      }));
    let offered: WorldTurnRequest | undefined;
    const moved = await story(
      start,
      move("character.tavi"),
      "character.tavi",
      (request) => (offered = request),
    );
    expect(offered?.routineRoutes).toEqual(storyPolicy.routes);
    expect(moved.proposal?.impact).toBe("L2");
    expect(await sqlValid(moved.proposal!.id)).toBe(true);
    expect((await confirm(moved)).event_type).toBe("CHARACTER_MOVED");

    // Iora is not in the policy: the story is not offered a route, and a forged
    // move is refused.
    let iora: WorldTurnRequest | undefined;
    const refused = await story(
      await current(start.continuityId),
      move("character.iora"),
      "character.iora",
      (request) => (iora = request),
    );
    expect(iora?.routineRoutes).toEqual([]);
    expect(refused.proposal ?? null).toBeNull();
  });

  it("binds the effect context to a response-only story turn in a World without constraints", async () => {
    const start = await fixture({ ...lanternReachSeed }, null);
    let offered: WorldTurnRequest | undefined;
    const talk = await story(
      start,
      (request) => gateway.generateWorldTurn(request),
      undefined,
      (request) => (offered = request),
    );
    expect(offered?.effectContext).toEqual({ relationships: [], openThreads: [], constraints: [] });
    expect(talk.status).toBe("COMPLETED_NO_EFFECT");
  });
});
