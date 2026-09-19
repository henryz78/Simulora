import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;

suite("IP-7 World Studio against PostgreSQL", () => {
  it("keeps Draft, validation, immutable Revision and pinned Continuity distinct", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const account = { accountId: randomUUID(), eligibility: "adult" as const };
    try {
      const draft = await repository.createWorld(account, lanternReachSeed);
      const initial = await repository.readWorldStudio(account, draft.worldId);
      expect(initial.draft.rowVersion).toBe(1);
      expect(initial.revisions).toEqual([]);
      expect(initial.continuities).toEqual([]);

      const validation = await repository.validateDraft(account, draft.worldId);
      expect(validation.outcome).toBe("VALID");
      expect(validation.draftRowVersion).toBe(1);

      const revision = await repository.createRevision(account, draft.worldId, 1);
      const continuity = await repository.startContinuity(account, revision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const published = await repository.readWorldStudio(account, draft.worldId);
      expect(published.revisions[0]?.revisionId).toBe(revision.revisionId);
      expect(published.continuities).toEqual([
        {
          continuityId: continuity.continuityId,
          worldRevisionId: revision.revisionId,
          revisionNumber: revision.revisionNumber,
          status: "PINNED",
        },
      ]);

      const changed = await repository.updateDraft(account, draft.worldId, 1, {
        ...lanternReachSeed,
        title: "A different user world",
      });
      expect(changed.rowVersion).toBe(2);
      await expect(
        repository.updateDraft(account, draft.worldId, 1, lanternReachSeed),
      ).rejects.toThrow("World Draft version is stale");

      const afterDraft = await repository.readWorldStudio(account, draft.worldId);
      expect(afterDraft.draft.document.title).toBe("A different user world");
      expect(afterDraft.continuities[0]?.worldRevisionId).toBe(revision.revisionId);
    } finally {
      await pool.end();
    }
  });
});
