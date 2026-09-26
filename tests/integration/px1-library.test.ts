import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { runMigrations } from "../../packages/database/src/migrations.js";
import { worldDocumentSchema } from "../../packages/domain/src/index.js";
import { mgcClosureWorld } from "../../packages/testkit/src/mgc-closure.js";

/**
 * PX-1 against real PostgreSQL: the player's library holds only the caller's
 * playable Continuities and undeleted Worlds, and a started Continuity reports
 * who may move (SA-2 M2).
 */
const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;
const participation = { initiativeMode: "GUIDED", structureMode: "OPEN_ENDED" } as const;

suite("PX-1 player library against PostgreSQL", () => {
  let pool: ReturnType<typeof createDatabasePool>;
  let repository: AuthoritativeWorldRepository;
  const owner = { accountId: randomUUID(), eligibility: "adult" as const };
  const other = { accountId: randomUUID(), eligibility: "adult" as const };

  beforeAll(async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    await runMigrations(connectionString, path.resolve("db/migrations"));
    pool = createDatabasePool(connectionString, { max: 8 });
    repository = new AuthoritativeWorldRepository(pool);
  });
  afterAll(async () => pool?.end());

  it("lists only the caller's playable Continuities and undeleted Worlds", async () => {
    const title = (name: string) => worldDocumentSchema.parse({ ...mgcClosureWorld, title: name });
    const played = await repository.createWorld(owner, title("Played world"));
    const revision = await repository.createRevision(owner, played.worldId, played.rowVersion);
    const first = await repository.startContinuity(owner, revision.revisionId, participation);
    const second = await repository.startContinuity(owner, revision.revisionId, participation);
    const draftOnly = await repository.createWorld(owner, title("Draft only"));
    const deleted = await repository.createWorld(owner, title("Deleted world"));
    await pool.query("update simulora.worlds set deleted_at = now() where id = $1", [
      deleted.worldId,
    ]);
    const intruder = await repository.createWorld(other, title("Someone else's world"));

    const library = await repository.readLibrary(owner);
    expect(library.continuities.map((item) => item.continuityId).sort()).toEqual(
      [first.continuityId, second.continuityId].sort(),
    );
    expect(library.continuities.every((item) => item.worldTitle === "Played world")).toBe(true);
    expect(library.worlds.map((item) => item.worldId).sort()).toEqual(
      [played.worldId, draftOnly.worldId].sort(),
    );

    const theirs = await repository.readLibrary(other);
    expect(theirs.continuities).toEqual([]);
    expect(theirs.worlds.map((item) => item.worldId)).toEqual([intruder.worldId]);
  });

  it("orders Continuities by their latest activity", async () => {
    const account = { accountId: randomUUID(), eligibility: "adult" as const };
    const draft = await repository.createWorld(account, mgcClosureWorld);
    const revision = await repository.createRevision(account, draft.worldId, draft.rowVersion);
    const older = await repository.startContinuity(account, revision.revisionId, participation);
    const newer = await repository.startContinuity(account, revision.revisionId, participation);
    const library = await repository.readLibrary(account);
    expect(library.continuities.map((item) => item.continuityId)).toEqual([
      newer.continuityId,
      older.continuityId,
    ]);
  });

  it("a started Continuity reports who may move", async () => {
    const granted = worldDocumentSchema.parse({
      ...mgcClosureWorld,
      routineRoutes: [
        {
          fromLocationId: "location.tidal-observatory",
          toLocationId: "location.harbor",
          label: "the harbor steps",
          permitsRoutineMovement: true,
        },
      ],
      routineMovers: ["character.tavi"],
    });
    const draft = await repository.createWorld(owner, granted);
    const revision = await repository.createRevision(owner, draft.worldId, draft.rowVersion);
    const started = await repository.startContinuity(owner, revision.revisionId, participation);
    expect(started.routineMoverIds).toEqual(["character.tavi"]);

    const plain = await repository.createWorld(owner, mgcClosureWorld);
    const plainRevision = await repository.createRevision(owner, plain.worldId, plain.rowVersion);
    const plainStart = await repository.startContinuity(
      owner,
      plainRevision.revisionId,
      participation,
    );
    expect(plainStart.routineMoverIds).toEqual([]);
  });
});
