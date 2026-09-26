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
      expect(validation.findings.some((finding) => finding.path === "objectives")).toBe(true);

      const revision = await repository.createRevision(account, draft.worldId, 1);
      expect(revision.createdAt).toBeTruthy();
      const continuity = await repository.startContinuity(account, revision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const published = await repository.readWorldStudio(account, draft.worldId);
      expect(published.revisions[0]?.revisionId).toBe(revision.revisionId);
      expect(published.validation?.findings).toEqual(validation.findings);
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

  it("SA-1: a Studio Draft with relationship states, threads and rules becomes an exact Revision", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const account = { accountId: randomUUID(), eligibility: "adult" as const };
    const first = lanternReachSeed.characters[0]!;
    const second = { ...first, id: "character.sa1-tavi", name: "Tavi", knowledgeFactIds: [] };
    const authored = {
      ...lanternReachSeed,
      characters: [first, second],
      relationships: [
        {
          id: "relationship.sa1-routine",
          fromCharacterId: first.id,
          toCharacterId: second.id,
          description: "They are learning to trust each other.",
          protection: "ROUTINE" as const,
          scale: ["distant", "neutral", "close"],
          initialState: "neutral",
        },
        {
          id: "relationship.sa1-protected",
          fromCharacterId: second.id,
          toCharacterId: first.id,
          description: "An oath binds them.",
          scale: ["unsworn", "sworn"],
          initialState: "unsworn",
        },
      ],
      threads: [{ id: "thread.sa1", title: "Who rang the harbour bell?" }],
      constraints: [{ id: "constraint.sa1", statement: "No one crosses the flooded causeway." }],
    };
    try {
      const draft = await repository.createWorld(account, lanternReachSeed);
      const saved = await repository.updateDraft(account, draft.worldId, 1, authored);
      expect(saved.document).toEqual(authored);
      const validation = await repository.validateDraft(account, draft.worldId);
      expect(validation.outcome).toBe("VALID");
      const revision = await repository.createRevision(account, draft.worldId, saved.rowVersion);
      const stored = await pool.query<{ document: unknown }>(
        "select document from simulora.world_revisions where id = $1",
        [revision.revisionId],
      );
      expect(stored.rows[0]?.document).toEqual(authored);

      // The Draft save runs the full World schema, so a scale whose starting state
      // is not one of its states is refused and the saved Draft is unchanged.
      await expect(
        repository.updateDraft(account, draft.worldId, saved.rowVersion, {
          ...authored,
          relationships: [{ ...authored.relationships[0]!, initialState: "trusting" }],
        }),
      ).rejects.toThrow("A relationship scale needs distinct labels and an initial state from it");
      const unchanged = await repository.readWorldStudio(account, draft.worldId);
      expect(unchanged.draft.document).toEqual(authored);
    } finally {
      await pool.end();
    }
  });
});
