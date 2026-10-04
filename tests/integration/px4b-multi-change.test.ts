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
  type StateRevisionDocument,
} from "../../packages/domain/src/index.js";
import type { WorldTurnDraft, WorldTurnRequest } from "../../packages/model-gateway/src/index.js";
import {
  mgcClosureRoutinePolicy,
  mgcClosureWorld,
} from "../../packages/testkit/src/mgc-closure.js";

/**
 * PX-4b (ADR-PX4-4) against real PostgreSQL: a story turn may make two to four
 * changes. SQL accepts exactly what the application accepts, commits one typed
 * Event per change in order, and each change's state is the v1 state change.
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const lead = "fact.western-signal-dim";
const hiddenKey = "The spare lens key hangs behind the observatory door.";

const world = worldDocumentSchema.parse({
  ...mgcClosureWorld,
  facts: [
    ...mgcClosureWorld.facts,
    {
      id: "fact.harbor-bell",
      statement: "The harbor bell rings at every tide.",
      scope: "SHARED",
      provenance: "PX-4b",
      lifecycle: "ACTIVE",
    },
    {
      id: "fact.key",
      statement: hiddenKey,
      scope: "CONTINUITY_PRIVATE",
      provenance: "PX-4b",
      lifecycle: "ACTIVE",
    },
  ],
  discoverableFacts: [{ factId: "fact.key", howToFind: "Looking behind the observatory door." }],
});
const policy = {
  ...mgcClosureRoutinePolicy,
  routes: [
    {
      fromLocationId: "location.tidal-observatory",
      toLocationId: "location.harbor",
      label: "the harbor path",
    },
  ],
};

type Continuity = {
  continuityId: string;
  branchId: string;
  headCommitId: string;
  state: StateRevisionDocument;
};
type Generate = (request: WorldTurnRequest) => Promise<WorldTurnDraft>;
type Operation = Record<string, unknown>;

suite("PX-4b several changes in one turn against PostgreSQL", () => {
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

  async function fixture(): Promise<Continuity> {
    const draft = await repository.createWorld(account, world);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    await pool.query(
      "insert into simulora.re3_routine_policies (world_revision_id, document) values ($1, $2::jsonb)",
      [revision.revisionId, JSON.stringify(policy)],
    );
    const started = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    return current(started.continuityId);
  }

  async function current(continuityId: string): Promise<Continuity> {
    const state = await repository.readCurrentState(account, continuityId);
    return {
      continuityId,
      branchId: state.branchId,
      headCommitId: state.headCommitId,
      state: state.state,
    };
  }

  const narrative = "The room answers what you did.";
  function scripted(
    build: (request: WorldTurnRequest) => Operation | Operation[],
    text = narrative,
  ): Generate {
    return (request) => {
      const responseSource = request.character
        ? ({ type: "CHARACTER", characterId: request.character.id } as const)
        : ({ type: "WORLD" } as const);
      const built = build(request);
      const shape = Array.isArray(built)
        ? { schemaVersion: 2, operations: built }
        : { schemaVersion: 1, operation: built };
      return Promise.resolve({
        narrative: text,
        responseSource,
        candidate: {
          ...shape,
          actionId: request.actionId,
          expectedHeadCommitId: request.expectedHeadCommitId,
          narrative: text,
          responseSource,
        },
      });
    };
  }

  async function story(
    continuity: Continuity,
    generate: Generate,
    targetCharacterId?: string,
    requestedEffect: "STORY_DECIDES" | "FACT_REWRITE" = "STORY_DECIDES",
  ) {
    const submitted = await repository.submitAction(account, continuity.branchId, {
      schemaVersion: 1,
      idempotencyKey: randomUUID(),
      expectedHeadCommitId: continuity.headCommitId,
      participationExpectation: continuity.state.participation,
      intent: "I search the observatory and ring the bell.",
      requestedEffect,
      ...(targetCharacterId ? { targetCharacterId } : {}),
    });
    const processed = await repository.processAction(submitted.id, generate, "px4b-worker");
    return processed ?? repository.readAction(account, submitted.id);
  }

  async function confirm(action: Awaited<ReturnType<typeof story>>) {
    if (!action.proposal) throw new Error(`Expected a proposal, got ${action.status}`);
    const committed = await repository.confirmAction(account, action.id, {
      proposalId: action.proposal.id,
      proposalDigest: action.proposal.digest,
      expectedHeadCommitId: action.proposal.expectedHeadCommitId,
    });
    expect(committed.status).toBe("COMMITTED");
    const events = await pool.query<{
      event_type: string;
      ordinal: number;
      payload: Record<string, unknown>;
    }>(
      "select event_type, ordinal, payload from simulora.domain_events where commit_id = $1 order by ordinal",
      [committed.commit!.resultingHeadCommitId],
    );
    return events.rows;
  }

  const add = (statement: string): Operation => ({
    type: "ADD_FACT",
    statement,
    causalFactIds: [lead],
  });
  const open = (title: string): Operation => ({
    type: "OPEN_THREAD",
    title,
    causalFactIds: [lead],
  });

  it("commits several changes with one ordered Event each, and the next turn still validates", async () => {
    const start = await fixture();
    const action = await story(
      start,
      scripted(() => [
        add("The bell rope is cut."),
        add("Fresh mud marks the stairs."),
        open("Who cut the rope"),
      ]),
    );
    expect(action.proposal).toMatchObject({ impact: "L2" });
    const stored = await pool.query<{ schema_version: number; valid: boolean }>(
      `select p.schema_version, simulora.action_proposal_effect_is_valid(p) as valid
         from simulora.action_proposals p where p.id = $1`,
      [action.proposal!.id],
    );
    expect(stored.rows[0]).toEqual({ schema_version: 2, valid: true });
    expect(action.proposal!.displayEffects?.map((item) => item.target)).toEqual([
      `fact.${action.id}.1`,
      `fact.${action.id}.2`,
      `thread.${action.id}.3`,
    ]);
    expect(action.proposal!.displayEffect.target).toBe(`fact.${action.id}.1`);

    const events = await confirm(action);
    expect(events.map((event) => [event.ordinal, event.event_type])).toEqual([
      [1, "FACT_ADDED"],
      [2, "FACT_ADDED"],
      [3, "THREAD_OPENED"],
    ]);
    expect(events[1]!.payload.factId).toBe(`fact.${action.id}.2`);
    expect(events[2]!.payload.threadId).toBe(`thread.${action.id}.3`);
    const after = await current(start.continuityId);
    expect(after.state.worldClock.turn).toBe(start.state.worldClock.turn + 1);
    expect(after.state.openThreads).toEqual([...start.state.openThreads, narrative]);
    expect(after.state.facts.map((fact) => fact.id)).toEqual(
      expect.arrayContaining([`fact.${action.id}.1`, `fact.${action.id}.2`]),
    );

    // The model context lists a multi-Event commit deterministically, so the next
    // turn's generation evidence still matches what SQL recomputes.
    const context = await pool.query<{ same: boolean }>(
      `select simulora.canonical_jsonb_text(simulora.re2_generation_context($1))
            = simulora.canonical_jsonb_text(simulora.re2_generation_context($1)) as same`,
      [action.id],
    );
    expect(context.rows[0]!.same).toBe(true);
    const next = await story(
      after,
      scripted(() => add("The keeper locks the door.")),
    );
    expect(next.proposal?.impact).toBe("L2");
  });

  it("lets the narrative name a fact the turn reveals, but not a new statement", async () => {
    const start = await fixture();
    const told = `Behind the door you find it: ${hiddenKey}`;
    const revealed = await story(
      start,
      scripted(
        () => [
          { type: "REVEAL_FACT", factId: "fact.key", causalFactIds: [lead] },
          add("The door hinge squeals."),
        ],
        told,
      ),
    );
    expect(revealed.proposal?.impact).toBe("L2");
    expect((await confirm(revealed)).map((event) => event.event_type)).toEqual([
      "FACT_REVEALED",
      "FACT_ADDED",
    ]);

    const leaked = await story(
      await fixture(),
      scripted(
        () => [
          { type: "REVEAL_FACT", factId: "fact.key", causalFactIds: [lead] },
          add(`Now everyone knows: ${hiddenKey}`),
        ],
        told,
      ),
    );
    expect(leaked.proposal ?? null).toBeNull();
  });

  it("takes the highest impact, opens and resolves together, and lets a failure add a fact", async () => {
    const start = await fixture();
    const sworn = await story(
      start,
      scripted(() => [
        {
          type: "SHIFT_RELATIONSHIP",
          relationshipId: "relationship.iora-oath",
          beforeState: "unsworn",
          afterState: "sworn",
          causalFactIds: [lead],
        },
        open("What the oath will cost"),
      ]),
      "character.iora",
    );
    // A PROTECTED relationship shift is L3, so the whole turn is L3.
    expect(sworn.proposal?.impact).toBe("L3");
    expect((await confirm(sworn)).map((event) => event.event_type)).toEqual([
      "RELATIONSHIP_SHIFTED",
      "THREAD_OPENED",
    ]);

    const settled = await story(
      await current(start.continuityId),
      scripted(() => [
        open("Where the pilot sails next"),
        {
          type: "RESOLVE_THREAD",
          threadId: "thread.vessel",
          resolution: "The pilot admits why she waits.",
          causalFactIds: [lead],
        },
      ]),
    );
    expect((await confirm(settled)).map((event) => event.event_type)).toEqual([
      "THREAD_OPENED",
      "THREAD_RESOLVED",
    ]);

    const failure: Operation = {
      type: "TRANSFORM_FAILURE",
      constraintId: "constraint.flood",
      outcome: "The causeway is under water.",
      newThreadTitle: "Waiting for low tide",
      causalFactIds: [lead],
    };
    const soaked = await story(
      await current(start.continuityId),
      scripted(() => [failure, add("Your boots are soaked.")]),
    );
    const events = await confirm(soaked);
    expect(
      events.map((event) => [event.event_type, event.payload.threadId ?? event.payload.factId]),
    ).toEqual([
      ["ATTEMPT_TRANSFORMED", `thread.${soaked.id}.1`],
      ["FACT_ADDED", `fact.${soaked.id}.2`],
    ]);
    // A failure opens its own thread, so it is never joined by another one.
    const doubled = await story(
      await fixture(),
      scripted(() => [failure, open("Another way across")]),
    );
    expect(doubled.proposal ?? null).toBeNull();
    // Several changes are only for a story turn.
    const explicit = await story(
      await fixture(),
      scripted(() => [add("A."), add("B.")]),
      undefined,
      "FACT_REWRITE",
    );
    expect(explicit.proposal ?? null).toBeNull();
  });

  it("gives each operation the v1 state change, and passes each part at exactly one level", async () => {
    const start = await fixture();
    let continuity = start;
    const factOf = (state: StateRevisionDocument) => state.facts.find((fact) => fact.id === lead)!;
    const v1: Array<[Generate, string | undefined]> = [
      [scripted(() => add("A lamp flickers.")), undefined],
      [
        scripted(() => ({ type: "REVEAL_FACT", factId: "fact.key", causalFactIds: [lead] })),
        undefined,
      ],
      [scripted(() => open("Who rang the bell")), undefined],
      [
        scripted(() => ({
          type: "RESOLVE_THREAD",
          threadId: "thread.vessel",
          resolution: "The vessel leaves at dawn.",
          causalFactIds: [lead],
        })),
        undefined,
      ],
      [
        scripted(() => ({
          type: "SHIFT_RELATIONSHIP",
          relationshipId: "relationship.iora-tavi",
          beforeState: "wary",
          afterState: "cordial",
          causalFactIds: [lead],
        })),
        "character.iora",
      ],
      [
        scripted(() => ({
          type: "TRANSFORM_FAILURE",
          constraintId: "constraint.flood",
          outcome: "The causeway is under water.",
          newThreadTitle: "Waiting for low tide",
          causalFactIds: [lead],
        })),
        undefined,
      ],
      [
        scripted(() => ({
          type: "MOVE_CHARACTER",
          characterId: "character.tavi",
          beforeLocationId: "location.tidal-observatory",
          afterLocationId: "location.harbor",
          causalFactIds: [lead],
        })),
        "character.tavi",
      ],
      [
        scripted((request) => ({
          type: "UPDATE_CANONICAL_FACT",
          targetFactId: lead,
          beforeStatement: factOf(continuity.state).statement,
          afterStatement: "The western signal burns bright again.",
          scope: "SHARED",
          provenance: `Confirmed Action ${request.actionId}`,
        })),
        undefined,
      ],
    ];
    for (const [generate, target] of v1) {
      const action = await story(continuity, generate, target);
      await confirm(action);
      const same = await pool.query<{ same: boolean }>(
        `select simulora.expected_action_state(a.id) = jsonb_set(jsonb_set(
                  simulora.px4b_operation_delta(parent.document, p.candidate_transition->'operation',
                    a.id, 'fact.' || a.id, 'thread.' || a.id),
                  '{worldClock}', jsonb_build_object(
                    'turn', (parent.document->'worldClock'->>'turn')::integer + 1,
                    'label', 'After action ' || ((parent.document->'worldClock'->>'turn')::integer + 1))),
                  '{openThreads}', parent.document->'openThreads'
                    || jsonb_build_array(p.candidate_transition->>'narrative')) as same
           from simulora.actions a
           join simulora.action_proposals p on p.action_id = a.id
           join simulora.world_commits c on c.id = a.expected_head_commit_id
           join simulora.state_revisions parent on parent.id = c.state_revision_id
          where a.id = $1`,
        [action.id],
      );
      expect(same.rows[0]!.same).toBe(true);
      continuity = await current(start.continuityId);
    }

    // A rewrite passes only at L3 and a move only at L2.
    const fresh = await fixture();
    const turn = await story(
      fresh,
      scripted((request) => [
        {
          type: "UPDATE_CANONICAL_FACT",
          targetFactId: lead,
          beforeStatement: factOf(fresh.state).statement,
          afterStatement: "The western signal burns bright again.",
          scope: "SHARED",
          provenance: `Confirmed Action ${request.actionId}`,
        },
        {
          type: "MOVE_CHARACTER",
          characterId: "character.tavi",
          beforeLocationId: "location.tidal-observatory",
          afterLocationId: "location.harbor",
          causalFactIds: ["fact.harbor-bell"],
        },
      ]),
      "character.tavi",
    );
    expect(turn.proposal?.impact).toBe("L3");
    const levels = await pool.query<{ part: number; level: string; valid: boolean }>(
      `select part, level, simulora.action_proposal_effect_is_valid_pre_px4b(
                jsonb_populate_record(null::simulora.action_proposals, to_jsonb(p) || jsonb_build_object(
                  'schema_version', 1, 'impact_level', level,
                  'candidate_transition', v.candidate, 'display_effect', v.display,
                  'proposal_digest', encode(sha256(convert_to(simulora.canonical_jsonb_text(
                    jsonb_build_object('actionId', a.id, 'actorAccountId', a.actor_account_id,
                      'expectedHeadCommitId', a.expected_head_commit_id, 'candidate', v.candidate,
                      'displayEffect', v.display, 'expiresAt',
                      to_char(p.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))),
                    'UTF8')), 'hex')))) as valid
         from simulora.action_proposals p
         join simulora.actions a on a.id = p.action_id
         cross join generate_series(1, 2) as part
         cross join unnest(array['L2', 'L3']) as level
         cross join lateral (select (p.candidate_transition - 'operations')
             || jsonb_build_object('schemaVersion', 1,
                  'operation', p.candidate_transition->'operations'->(part - 1)) as candidate,
             p.display_effect->(part - 1) as display) v
        where p.id = $1 order by part, level`,
      [turn.proposal!.id],
    );
    expect(levels.rows.map((row) => [row.part, row.level, row.valid])).toEqual([
      [1, "L2", false],
      [1, "L3", true],
      [2, "L2", true],
      [2, "L3", false],
    ]);
  }, 30_000);

  /**
   * Forges a stored v2 proposal the way a writer with database access could:
   * the generation output and the digest are rewritten to match, inside a
   * transaction that is rolled back.
   */
  async function forged(
    proposalId: string,
    change: {
      candidate?: (candidate: Record<string, unknown>) => Record<string, unknown>;
      display?: (display: Array<Record<string, unknown>>) => unknown;
      impact?: string;
      beforeEpoch?: boolean;
      virtual?: boolean;
    },
  ) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("set local session_replication_role = replica");
      if (change.beforeEpoch)
        await client.query(
          "update app_meta.schema_migrations set applied_at = now() + interval '1 day' where name = '0058_px4b_multi_change.sql'",
        );
      const row = await client.query<{
        candidate_transition: Record<string, unknown>;
        display_effect: Array<Record<string, unknown>>;
      }>(
        "select candidate_transition, display_effect from simulora.action_proposals where id = $1",
        [proposalId],
      );
      let candidate =
        change.candidate?.(row.rows[0]!.candidate_transition) ?? row.rows[0]!.candidate_transition;
      let display: unknown =
        change.display?.(row.rows[0]!.display_effect) ?? row.rows[0]!.display_effect;
      if (change.virtual) {
        // A stored one-change row cut from the v2 turn.
        const { operations, ...rest } = candidate as { operations: unknown[] };
        candidate = { ...rest, schemaVersion: 1, operation: operations[0] };
        display = (display as unknown[])[0];
      } else {
        await client.query(
          `update simulora.generation_attempts g
              set output = jsonb_build_object('narrative', $2::jsonb->'narrative',
                'responseSource', $2::jsonb->'responseSource', 'candidate', $2::jsonb)
             from simulora.action_proposals p where p.id = $1 and g.id = p.generation_attempt_id`,
          [proposalId, JSON.stringify(candidate)],
        );
      }
      await client.query(
        `update simulora.action_proposals p
            set candidate_transition = $2::jsonb, display_effect = $3::jsonb,
                impact_level = coalesce($4, p.impact_level),
                schema_version = case when $5 then 1 else 2 end
          where p.id = $1`,
        [
          proposalId,
          JSON.stringify(candidate),
          JSON.stringify(display),
          change.impact ?? null,
          change.virtual ?? false,
        ],
      );
      await client.query(
        `update simulora.action_proposals p
            set proposal_digest = encode(sha256(convert_to(simulora.canonical_jsonb_text(
              jsonb_build_object('actionId', a.id, 'actorAccountId', a.actor_account_id,
                'expectedHeadCommitId', a.expected_head_commit_id,
                'candidate', p.candidate_transition, 'displayEffect', p.display_effect,
                'expiresAt', to_char(p.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))),
              'UTF8')), 'hex')
           from simulora.actions a where p.id = $1 and a.id = p.action_id`,
        [proposalId],
      );
      const result = await client.query<{ valid: boolean; inner: boolean }>(
        `select simulora.action_proposal_effect_is_valid(p) as valid,
                simulora.action_proposal_effect_is_valid_pre_px4b(p) as inner
           from simulora.action_proposals p where p.id = $1`,
        [proposalId],
      );
      return result.rows[0]!;
    } finally {
      await client.query("rollback");
      client.release();
    }
  }

  it("refuses forged multi-change proposals, beside controls that pass", async () => {
    const action = await story(
      await fixture(),
      scripted(() => [add("The bell rope is cut."), open("Who cut the rope")]),
    );
    const id = action.proposal!.id;
    // The forgery itself is sound: rewriting nothing still passes.
    expect((await forged(id, {})).valid).toBe(true);
    expect((await forged(id, { candidate: (c) => ({ ...c, extra: true }) })).valid).toBe(false);
    expect((await forged(id, { candidate: (c) => ({ ...c, actionId: randomUUID() }) })).valid).toBe(
      false,
    );
    // A new thread must be shown by its derived id.
    expect(
      (
        await forged(id, {
          display: (d) => [d[0], { ...d[1], target: `thread.${action.id}` }],
        })
      ).valid,
    ).toBe(false);
    expect((await forged(id, { impact: "L3" })).valid).toBe(false);
    expect((await forged(id, { beforeEpoch: true })).valid).toBe(false);
    // One change cut out of the turn and stored as v1: the inner chain would take
    // it, but the top-level validator refuses a v1 row from a v2 generation.
    const virtual = await forged(id, {
      virtual: true,
      display: (d) => [{ ...d[0], target: `fact.${action.id}` }],
    });
    expect(virtual).toEqual({ valid: false, inner: true });
  });

  it("refuses forged turns that break a combination rule, beside controls that pass", async () => {
    const start = await fixture();
    const lead_ = start.state.facts.find((fact) => fact.id === lead)!;
    const action = await story(
      start,
      scripted(() => [add("The bell rope is cut."), open("Who cut the rope")]),
    );
    const id = action.proposal!.id;
    const display = {
      add: (statement: string, position: number) => ({
        target: `fact.${action.id}.${position}`,
        before: "Nothing recorded yet.",
        after: statement,
        scope: "SHARED",
      }),
      open: (title: string, position: number) => ({
        target: `thread.${action.id}.${position}`,
        before: "No thread",
        after: title,
        scope: "SHARED",
      }),
      resolve: { target: "thread.vessel", before: "OPEN", after: "RESOLVED", scope: "SHARED" },
      rewrite: {
        target: lead,
        before: lead_.statement,
        after: "The western signal burns bright again.",
        scope: "SHARED",
      },
      failure: {
        target: "constraint.flood",
        before: "The causeway is under water.",
        after: "Waiting for low tide",
        scope: "SHARED",
      },
    };
    const resolve: Operation = {
      type: "RESOLVE_THREAD",
      threadId: "thread.vessel",
      resolution: "The pilot admits why she waits.",
      causalFactIds: [lead],
    };
    const rewrite: Operation = {
      type: "UPDATE_CANONICAL_FACT",
      targetFactId: lead,
      beforeStatement: lead_.statement,
      afterStatement: "The western signal burns bright again.",
      scope: "SHARED",
      provenance: `Confirmed Action ${action.id}`,
    };
    const failure: Operation = {
      type: "TRANSFORM_FAILURE",
      constraintId: "constraint.flood",
      outcome: "The causeway is under water.",
      newThreadTitle: "Waiting for low tide",
      causalFactIds: [lead],
    };
    const turn = (operations: Operation[], shown: unknown[], impact = "L2") =>
      forged(id, {
        candidate: (candidate) => ({ ...candidate, operations }),
        display: () => shown,
        impact,
      });
    const bell = { ...add("A bell rings."), causalFactIds: ["fact.harbor-bell"] };
    type Check = () => Promise<{ valid: boolean }>;
    const cases: Array<[string, Check, Check]> = [
      [
        "the same thread twice",
        () => turn([resolve, resolve], [display.resolve, display.resolve]),
        () =>
          turn([resolve, add("A bell rings.")], [display.resolve, display.add("A bell rings.", 2)]),
      ],
      [
        "a cause the turn rewrites",
        () =>
          turn(
            [rewrite, add("A bell rings.")],
            [display.rewrite, display.add("A bell rings.", 2)],
            "L3",
          ),
        () => turn([rewrite, bell], [display.rewrite, display.add("A bell rings.", 2)], "L3"),
      ],
      [
        "a failure joined by a thread",
        () =>
          turn([failure, open("Another way")], [display.failure, display.open("Another way", 2)]),
        () =>
          turn([failure, add("A bell rings.")], [display.failure, display.add("A bell rings.", 2)]),
      ],
      [
        "one change only",
        () => turn([add("A bell rings.")], [display.add("A bell rings.", 1)]),
        () =>
          turn(
            [add("A bell rings."), add("A gull cries.")],
            [display.add("A bell rings.", 1), display.add("A gull cries.", 2)],
          ),
      ],
      [
        "five changes",
        () =>
          turn(
            [1, 2, 3, 4, 5].map((n) => add(`Sign ${n}.`)),
            [1, 2, 3, 4, 5].map((n) => display.add(`Sign ${n}.`, n)),
          ),
        () =>
          turn(
            [1, 2, 3, 4].map((n) => add(`Sign ${n}.`)),
            [1, 2, 3, 4].map((n) => display.add(`Sign ${n}.`, n)),
          ),
      ],
      [
        "a no-effect part",
        () =>
          turn(
            [
              add("A bell rings."),
              { type: "NO_WORLD_EFFECT", reason: "Talk.", causalFactIds: [lead] },
            ],
            [display.add("A bell rings.", 1), display.add("Talk.", 2)],
          ),
        () =>
          turn(
            [add("A bell rings."), open("Who rang")],
            [display.add("A bell rings.", 1), display.open("Who rang", 2)],
          ),
      ],
    ];
    for (const [name, refused, control] of cases) {
      expect([name, (await refused()).valid]).toEqual([name, false]);
      expect([name, (await control()).valid]).toEqual([name, true]);
    }
  });

  /**
   * Confirms through a pool that rewrites the multi-change Event inserts, so
   * the Commit check is the only thing that can refuse. Real PostgreSQL only:
   * PGlite cannot recover from the deferred error.
   */
  it("refuses a multi-change Commit whose Events are missing or wrong", async () => {
    type Tamper = (params: unknown[]) => unknown[] | null;
    const tampering = (tamper: Tamper) =>
      new Proxy(pool, {
        get(target, property) {
          if (property === "connect") {
            return async () => {
              const client = await target.connect();
              return new Proxy(client, {
                get(inner, key) {
                  if (key === "query") {
                    return (sql: unknown, params?: unknown[]) => {
                      if (
                        typeof sql === "string" &&
                        sql.includes("insert into simulora.domain_events") &&
                        params?.length === 8
                      ) {
                        const next = tamper(params);
                        if (!next) return Promise.resolve({ rows: [], rowCount: 0 });
                        return inner.query(sql, next);
                      }
                      return inner.query(sql as string, params);
                    };
                  }
                  const value = Reflect.get(inner, key) as unknown;
                  return typeof value === "function"
                    ? (value as (this: unknown) => unknown).bind(inner)
                    : value;
                },
              });
            };
          }
          const value = Reflect.get(target, property) as unknown;
          return typeof value === "function"
            ? (value as (this: unknown) => unknown).bind(target)
            : value;
        },
      });
    const second =
      (change: (params: unknown[]) => unknown[] | null): Tamper =>
      (params) =>
        params[7] === 2 ? change(params) : params;
    const tampers: Array<[string, Tamper]> = [
      ["a missing Event", second(() => null)],
      ["a wrong ordinal", second((params) => params.with(7, 3))],
      [
        "a base thread id",
        second((params) => {
          const payload = JSON.parse(params[4] as string) as Record<string, unknown>;
          return params.with(
            4,
            JSON.stringify({ ...payload, threadId: `thread.${String(payload.actionId)}` }),
          );
        }),
      ],
      ["no tampering", (params) => params],
    ];
    for (const [name, tamper] of tampers) {
      const action = await story(
        await fixture(),
        scripted(() => [add("The bell rope is cut."), open("Who cut the rope")]),
      );
      const confirm = new AuthoritativeWorldRepository(tampering(tamper)).confirmAction(
        account,
        action.id,
        {
          proposalId: action.proposal!.id,
          proposalDigest: action.proposal!.digest,
          expectedHeadCommitId: action.proposal!.expectedHeadCommitId,
        },
      );
      if (name === "no tampering") expect((await confirm).status).toBe("COMMITTED");
      else await expect(confirm, name).rejects.toThrow(/one typed Event per change/);
    }
  });
});
