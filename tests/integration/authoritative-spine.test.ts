import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import {
  createInitialState,
  participationCombinations,
  lanternReachSeed,
  stateRevisionDocumentSchema,
} from "../../packages/domain/src/index.js";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runMigrations } from "../../packages/database/src/migrations.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;
const account = {
  accountId: "00000000-0000-4000-8000-000000000002",
  eligibility: "adult" as const,
};
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const pool = connectionString ? createDatabasePool(connectionString, { max: 4 }) : undefined;

suite("PostgreSQL authoritative World and Continuity spine", () => {
  beforeAll(async () => {
    await runMigrations(connectionString!, path.join(repositoryRoot, "db", "migrations"));
  });

  afterAll(async () => {
    await pool?.end();
  });

  it.each(["\u2003", "\u00a0", "\t", "\n", "\ufeff"])(
    "rejects whitespace-only required text: %j",
    async (title) => {
      const result = await pool!.query<{ valid: boolean }>(
        "select simulora.valid_world_revision_document($1::jsonb) as valid",
        [JSON.stringify({ ...lanternReachSeed, title })],
      );
      expect(result.rows[0]?.valid).toBe(false);
    },
  );

  it("keeps the world clock within the domain's safe-integer range", async () => {
    for (const turn of [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1, 1e20]) {
      const state = createInitialState(lanternReachSeed, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      state.worldClock.turn = turn;
      const result = await pool!.query<{ valid: boolean }>(
        "select simulora.valid_state_revision_document($1::jsonb) as valid",
        [JSON.stringify(state)],
      );
      expect(result.rows[0]?.valid).toBe(stateRevisionDocumentSchema.safeParse(state).success);
    }
  });

  it("creates an immutable revision and atomically initializes every participation contract", async () => {
    const repository = new AuthoritativeWorldRepository(pool!);
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);

    for (const participation of participationCombinations) {
      const started = await repository.startContinuity(account, revision.revisionId, participation);
      expect(started.state.participation).toEqual(participation);
      expect(started.branchId).toBeTruthy();
      expect(started.headCommitId).toBeTruthy();
      expect(started.stateRevisionId).toBeTruthy();

      const restartedRepository = new AuthoritativeWorldRepository(pool!);
      const reloaded = await restartedRepository.readCurrentState(account, started.continuityId);
      expect(reloaded.stateHash).toBe(started.stateHash);
      expect(reloaded.worldRevisionId).toBe(revision.revisionId);
    }
  });

  it("keeps an existing Continuity pinned when a newer World Revision is created", async () => {
    const repository = new AuthoritativeWorldRepository(pool!);
    const draft = await repository.createWorld(account, lanternReachSeed);
    const firstRevision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, firstRevision.revisionId, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const changedWorld = {
      ...lanternReachSeed,
      premise: `${lanternReachSeed.premise} A second lens has arrived.`,
    };
    const updated = await repository.updateDraft(account, draft.worldId, 1, changedWorld);
    const secondRevision = await repository.createRevision(
      account,
      draft.worldId,
      updated.rowVersion,
    );

    expect(secondRevision.revisionNumber).toBe(2);
    const reloaded = await repository.readCurrentState(account, continuity.continuityId);
    expect(reloaded.worldRevisionId).toBe(firstRevision.revisionId);
    expect(reloaded.world.premise).toBe(lanternReachSeed.premise);
  });

  it("rejects mutation of immutable revisions", async () => {
    const repository = new AuthoritativeWorldRepository(pool!);
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    await expect(
      pool!.query("update simulora.world_revisions set revision_number = 99 where id = $1", [
        revision.revisionId,
      ]),
    ).rejects.toThrow(/immutable/);
  });

  it("rejects an active Continuity that points at an incomplete Branch head", async () => {
    const repository = new AuthoritativeWorldRepository(pool!);
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const continuity = await repository.startContinuity(account, revision.revisionId, {
      initiativeMode: "DIRECT",
      structureMode: "OPEN_ENDED",
    });

    await expect(
      pool!.query("update simulora.branches set status = 'INITIALIZING' where id = $1", [
        continuity.branchId,
      ]),
    ).rejects.toThrow(
      /Active Branch lifecycle cannot return to initialization|ACTIVE Continuity requires its Branch to remain active with complete heads/,
    );
  });

  it("keeps database document validation and participant access aligned with the domain", async () => {
    const state = createInitialState(lanternReachSeed, {
      initiativeMode: "GUIDED",
      structureMode: "OPEN_ENDED",
    });
    const validation = await pool!.query<{
      numeric_motive: boolean;
      string_turn: boolean;
      string_resource: boolean;
    }>(
      `select simulora.valid_world_revision_document($1::jsonb) as numeric_motive,
              simulora.valid_state_revision_document($2::jsonb) as string_turn,
              simulora.valid_state_revision_document($3::jsonb) as string_resource`,
      [
        JSON.stringify({
          ...lanternReachSeed,
          characters: [{ ...lanternReachSeed.characters[0]!, motives: [123] }],
        }),
        JSON.stringify({ ...state, worldClock: { ...state.worldClock, turn: "0" } }),
        JSON.stringify({ ...state, resources: { lanternOil: "full" } }),
      ],
    );
    expect(validation.rows[0]).toEqual({
      numeric_motive: false,
      string_turn: false,
      string_resource: false,
    });

    const repository = new AuthoritativeWorldRepository(pool!);
    const draft = await repository.createWorld(account, lanternReachSeed);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const viewerId = randomUUID();
    await pool!.query("insert into simulora.accounts (id, eligibility) values ($1, 'ADULT')", [
      viewerId,
    ]);
    await pool!.query(
      `insert into simulora.world_access_grants (world_id, account_id, role, status)
       values ($1, $2, 'VIEWER', 'ACTIVE')`,
      [draft.worldId, viewerId],
    );
    await expect(
      pool!.query(
        `insert into simulora.continuities
           (id, owner_account_id, world_revision_id, status)
         values ($1, $2, $3, 'INITIALIZING')`,
        [randomUUID(), viewerId, revision.revisionId],
      ),
    ).rejects.toThrow(/active participant access/);
  });
});
