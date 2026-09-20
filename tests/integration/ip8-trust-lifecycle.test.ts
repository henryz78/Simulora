import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  ConflictError,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const suite = connectionString ? describe.sequential : describe.skip;

suite("IP-8 trust and lifecycle against PostgreSQL", () => {
  it("keeps trust, usage, portable artifacts and deletion exact and owner-scoped", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const owner = { accountId: randomUUID(), eligibility: "adult" as const };
    const participant = { accountId: randomUUID(), eligibility: "adult" as const };
    try {
      expect((await repository.readMe(owner)).capabilities.canCreateWorld).toBe(true);
      const consentRequest = {
        consentType: "TERMS" as const,
        version: "IP-8-V1",
        scope: "ACCOUNT" as const,
        decision: "GRANTED" as const,
      };
      const firstConsent = await repository.setConsent(owner, consentRequest);
      const retriedConsent = await repository.setConsent(owner, consentRequest);
      expect(retriedConsent).toEqual(firstConsent);
      expect(retriedConsent.withdrawalAvailable).toBe(true);

      const world = await repository.createWorld(owner, lanternReachSeed);
      await repository.validateDraft(owner, world.worldId);
      const revision = await repository.createRevision(owner, world.worldId, 1);
      const ownerContinuity = await repository.startContinuity(owner, revision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      await repository.ensureAccount(participant);
      await pool.query(
        `insert into simulora.world_access_grants (world_id, account_id, role, status)
         values ($1, $2, 'PARTICIPANT', 'ACTIVE')`,
        [world.worldId, participant.accountId],
      );
      expect((await repository.readAccess(participant, "world", world.worldId)).reasonCode).toBe(
        "ACTIVE_GRANT",
      );
      expect(
        (await repository.readAccess(participant, "continuity", ownerContinuity.continuityId))
          .canRead,
      ).toBe(false);
      const participantContinuity = await repository.startContinuity(
        participant,
        revision.revisionId,
        { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
      );
      await expect(
        repository.readCurrentState(owner, participantContinuity.continuityId),
      ).rejects.toThrow("Continuity not found");

      const quote = await repository.createUsageQuote(owner, {
        schemaVersion: 1,
        actionProfile: "EXPORT",
      });
      const reservationRequest = {
        schemaVersion: 1 as const,
        actionKey: `export:${world.worldId}`,
      };
      const reservation = await repository.reserveUsage(owner, quote.quoteId, reservationRequest);
      expect(await repository.reserveUsage(owner, quote.quoteId, reservationRequest)).toEqual(
        reservation,
      );
      const secondQuote = await repository.createUsageQuote(owner, {
        schemaVersion: 1,
        actionProfile: "EXPORT",
      });
      await expect(
        repository.reserveUsage(owner, secondQuote.quoteId, reservationRequest),
      ).rejects.toBeInstanceOf(ConflictError);
      await repository.settleUsage(owner, reservation.reservationId);
      await repository.settleUsage(owner, reservation.reservationId);
      expect((await repository.listUsageLedger(owner)).entries).toHaveLength(1);

      const exportRequest = {
        schemaVersion: 1 as const,
        idempotencyKey: `export-${world.worldId}`,
        worldId: world.worldId,
        include: { world: true, characters: true, continuity: true, history: true },
      };
      const exported = await repository.createExport(owner, exportRequest);
      expect(exported.status).toBe("READY");
      expect(exported.checksum).toMatch(/^[0-9a-f]{64}$/);
      expect(await repository.createExport(owner, exportRequest)).toEqual(exported);
      await expect(
        repository.createExport(owner, {
          ...exportRequest,
          include: { ...exportRequest.include, history: false },
        }),
      ).rejects.toBeInstanceOf(ConflictError);
      const artifact = Buffer.from(await repository.readExportArtifact(owner, exported.exportId));
      const readableArtifact = artifact.toString("utf8");
      expect(readableArtifact).toContain("world/world.json");
      expect(readableArtifact).toContain("characters/character.iora.json");
      expect(readableArtifact).toContain(`continuity/${ownerContinuity.continuityId}/state.json`);
      expect(readableArtifact).toContain("history/events.ndjson");
      expect(readableArtifact).toContain("checksums.sha256");
      expect(readableArtifact).not.toContain(participantContinuity.continuityId);

      const appealRequest = {
        schemaVersion: 1 as const,
        idempotencyKey: randomUUID(),
        reasonCode: "ACCESS" as const,
        subjectType: "WORLD" as const,
        subjectId: world.worldId,
        summary: "Review the participant access boundary.",
      };
      const appeal = await repository.openAppeal(owner, appealRequest);
      expect(await repository.openAppeal(owner, appealRequest)).toEqual(appeal);
      await expect(
        repository.openAppeal(owner, { ...appealRequest, summary: "Different request" }),
      ).rejects.toBeInstanceOf(ConflictError);

      const proposal = await repository.proposeDeletion(owner, {
        schemaVersion: 1,
        targetType: "WORLD",
        targetId: world.worldId,
      });
      expect(proposal.affected).toMatchObject({ continuities: 2, grants: 1, exports: 1 });
      const ineligibleOwner = { ...owner, eligibility: "ineligible" as const };
      expect((await repository.readMe(ineligibleOwner)).capabilities.canParticipate).toBe(false);
      const deletionRequest = {
        schemaVersion: 1 as const,
        proposalId: proposal.proposalId,
        digest: proposal.digest,
        idempotencyKey: randomUUID(),
      };
      const deleted = await repository.confirmDeletion(ineligibleOwner, deletionRequest);
      expect(deleted.status).toBe("COMPLETED");
      expect(await repository.confirmDeletion(ineligibleOwner, deletionRequest)).toEqual(deleted);
      await expect(
        repository.confirmDeletion(ineligibleOwner, {
          ...deletionRequest,
          idempotencyKey: randomUUID(),
        }),
      ).rejects.toBeInstanceOf(ConflictError);
      expect((await repository.readExport(owner, exported.exportId)).status).toBe("REVOKED");
      await expect(repository.readExportArtifact(owner, exported.exportId)).rejects.toThrow(
        "Export artifact not found",
      );
      expect(
        (await repository.readAccess(owner, "continuity", ownerContinuity.continuityId)).visibility,
      ).toBe("TOMBSTONED");
      await expect(
        repository.readCurrentState(owner, ownerContinuity.continuityId),
      ).rejects.toThrow("Continuity not found");
      await expect(
        repository.startContinuity(participant, revision.revisionId, {
          initiativeMode: "DIRECT",
          structureMode: "OPEN_ENDED",
        }),
      ).rejects.toThrow("World Revision not found");

      const audits = await pool.query<{ event_type: string }>(
        `select event_type from simulora.governance_audit_events
         where actor_account_id = $1 order by created_at, id`,
        [owner.accountId],
      );
      expect(audits.rows.map((row) => row.event_type).sort()).toEqual([
        "APPEAL_OPENED",
        "CONSENT_CHANGED",
        "DELETION_CONFIRMED",
      ]);
      expect((await repository.listProductChanges()).changes[0]?.version).toBe(
        "IP-8-TRUST-LIFECYCLE-V1",
      );
    } finally {
      await pool.end();
    }
  });
});
