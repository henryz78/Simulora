import path from "node:path";
import { fileURLToPath } from "node:url";
import { participationCombinations, lanternReachSeed } from "../../packages/domain/src/index.js";
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
});
