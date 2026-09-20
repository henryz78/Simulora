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
        actionKey: `export:export-${world.worldId}`,
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
      const exportRequest = {
        schemaVersion: 1 as const,
        idempotencyKey: `export-${world.worldId}`,
        reservationId: reservation.reservationId,
        worldId: world.worldId,
        include: { world: true, characters: true, continuity: true, history: true },
      };
      const exported = await repository.createExport(owner, exportRequest);
      expect(exported.status).toBe("READY");
      expect(exported.checksum).toMatch(/^[0-9a-f]{64}$/);
      await repository.settleUsage(owner, reservation.reservationId);
      await repository.settleUsage(owner, reservation.reservationId);
      expect((await repository.listUsageLedger(owner)).entries).toHaveLength(1);
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

  it("binds exports to a reservation, keeps artifacts durable and gates on live consent", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const owner = { accountId: randomUUID(), eligibility: "adult" as const };
    try {
      const world = await repository.createWorld(owner, lanternReachSeed);
      await repository.validateDraft(owner, world.worldId);
      const revision = await repository.createRevision(owner, world.worldId, 1);
      const continuity = await repository.startContinuity(owner, revision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });

      // I-6: a material change explains scope, timing and the choices it leaves open.
      const change = (await repository.listProductChanges()).changes.find(
        (entry) => entry.version === "IP-8-TRUST-LIFECYCLE-V1",
      );
      expect(change?.affectedScopes.length).toBeGreaterThan(0);
      expect(change?.availableChoices.length).toBeGreaterThan(0);
      expect(Date.parse(change?.effectiveAt ?? "")).not.toBeNaN();

      // I-2: an export needs an owned, open EXPORT reservation bound to its own key.
      const idempotencyKey = `export-${randomUUID()}`;
      const exportRequest = {
        schemaVersion: 1 as const,
        idempotencyKey,
        reservationId: randomUUID(),
        worldId: world.worldId,
        include: { world: true, characters: false, continuity: false, history: false },
      };
      await expect(repository.createExport(owner, exportRequest)).rejects.toThrow(
        /USAGE_RESERVATION_REQUIRED/,
      );
      const quote = await repository.createUsageQuote(owner, {
        schemaVersion: 1,
        actionProfile: "EXPORT",
      });
      const mismatched = await repository.reserveUsage(owner, quote.quoteId, {
        schemaVersion: 1,
        actionKey: `export:not-${idempotencyKey}`,
      });
      await expect(
        repository.createExport(owner, {
          ...exportRequest,
          reservationId: mismatched.reservationId,
        }),
      ).rejects.toThrow(/USAGE_RESERVATION_REQUIRED/);

      const reservationRequest = {
        schemaVersion: 1 as const,
        actionKey: `export:${idempotencyKey}`,
      };
      const reservation = await repository.reserveUsage(owner, quote.quoteId, reservationRequest);
      // I-3: an expired quote must not strand a retry that reuses the same action key.
      await pool.query(
        `update simulora.usage_quotes set expires_at = now() - interval '1 hour'
                        where id = $1`,
        [quote.quoteId],
      );
      expect(await repository.reserveUsage(owner, quote.quoteId, reservationRequest)).toEqual(
        reservation,
      );
      const exported = await repository.createExport(owner, {
        ...exportRequest,
        reservationId: reservation.reservationId,
      });
      expect(exported.status).toBe("READY");

      // I-4: the artifact is recoverable from PostgreSQL by a separate process.
      const freshPool = createDatabasePool(connectionString);
      try {
        const fresh = new AuthoritativeWorldRepository(freshPool);
        const artifact = Buffer.from(await fresh.readExportArtifact(owner, exported.exportId));
        expect(artifact.toString("utf8")).toContain("manifest.json");
      } finally {
        await freshPool.end();
      }

      // I-5: withdrawn consent blocks authoring but leaves recovery paths open.
      await repository.setConsent(owner, {
        consentType: "TERMS",
        version: "IP-8-V1",
        scope: "ACCOUNT",
        decision: "WITHDRAWN",
      });
      await expect(repository.createWorld(owner, lanternReachSeed)).rejects.toThrow(
        /consent is withdrawn/i,
      );
      expect((await repository.readAccess(owner, "world", world.worldId)).canRead).toBe(true);
      const appeal = await repository.openAppeal(owner, {
        schemaVersion: 1,
        idempotencyKey: randomUUID(),
        reasonCode: "CONSENT",
        subjectType: "ACCOUNT",
        summary: "Consent was withdrawn by mistake.",
      });
      expect(appeal.status).toBe("OPEN");
      await repository.setConsent(owner, {
        consentType: "TERMS",
        version: "IP-8-V2",
        scope: "ACCOUNT",
        decision: "GRANTED",
      });
      const recoveryPoint = await repository.createRecoveryPoint(owner, continuity.branchId, {
        idempotencyKey: `point-${randomUUID()}`,
        label: "After restoring consent",
      });

      // I-1: once the World is tombstoned, mutation paths refuse with a stable conflict.
      const proposal = await repository.proposeDeletion(owner, {
        schemaVersion: 1,
        targetType: "WORLD",
        targetId: world.worldId,
      });
      await repository.confirmDeletion(owner, {
        schemaVersion: 1,
        proposalId: proposal.proposalId,
        digest: proposal.digest,
        idempotencyKey: randomUUID(),
      });
      await expect(repository.deleteRecoveryPoint(owner, recoveryPoint.id)).rejects.toThrow(
        /WORLD_TOMBSTONED/,
      );
      await expect(
        repository.createRecoveryPoint(owner, continuity.branchId, {
          idempotencyKey: `point-${randomUUID()}`,
          label: "Blocked after deletion",
        }),
      ).rejects.toThrow(/WORLD_TOMBSTONED/);
      await expect(
        repository.forkBranch(owner, continuity.continuityId, {
          idempotencyKey: `fork-${randomUUID()}`,
          name: "Blocked after deletion",
          sourceCommitId: continuity.headCommitId,
          expectedHeadCommitId: continuity.headCommitId,
        }),
      ).rejects.toThrow(/WORLD_TOMBSTONED/);
    } finally {
      await pool.end();
    }
  });

  it("keeps deletion confirmation and guarded mutation free of lock-order deadlocks", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const owner = { accountId: randomUUID(), eligibility: "adult" as const };
    try {
      const world = await repository.createWorld(owner, lanternReachSeed);
      await repository.validateDraft(owner, world.worldId);
      const revision = await repository.createRevision(owner, world.worldId, 1);
      const continuity = await repository.startContinuity(owner, revision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const proposal = await repository.proposeDeletion(owner, {
        schemaVersion: 1,
        targetType: "WORLD",
        targetId: world.worldId,
      });

      // confirmDeletion locks the World then its Continuities; the tombstone guard
      // must take the same two locks in the same order, or PostgreSQL aborts one
      // side with a deadlock that would surface as a generic failure.
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const outcomes = await Promise.race([
        Promise.allSettled([
          repository.confirmDeletion(owner, {
            schemaVersion: 1,
            proposalId: proposal.proposalId,
            digest: proposal.digest,
            idempotencyKey: randomUUID(),
          }),
          repository.createRecoveryPoint(owner, continuity.branchId, {
            idempotencyKey: `deadlock-${randomUUID()}`,
            label: "Racing a confirmed deletion",
          }),
          repository.forkBranch(owner, continuity.continuityId, {
            idempotencyKey: `deadlock-fork-${randomUUID()}`,
            name: "Racing a confirmed deletion",
            sourceCommitId: continuity.headCommitId,
            expectedHeadCommitId: continuity.headCommitId,
          }),
        ]),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => reject(new Error("Deletion lock ordering timed out")), 10_000);
        }),
      ]).finally(() => clearTimeout(timeout));

      expect(
        outcomes.some(
          (outcome) =>
            outcome.status === "rejected" &&
            String(outcome.reason).toLowerCase().includes("deadlock detected"),
        ),
      ).toBe(false);
      // The deletion is authoritative either way; a losing mutation must name a
      // stable conflict rather than fail as an internal error.
      for (const outcome of outcomes) {
        if (outcome.status === "rejected") {
          expect(String(outcome.reason)).toMatch(
            /WORLD_TOMBSTONED|CONCURRENT_UPDATE_RETRY|IDEMPOTENCY/,
          );
        }
      }
      expect((await repository.readDeletion(owner, proposal.proposalId)).status).toBe("COMPLETED");
    } finally {
      await pool.end();
    }
  });

  it("lets the newest consent decision govern when several versions coexist", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const owner = { accountId: randomUUID(), eligibility: "adult" as const };
    try {
      await repository.ensureAccount(owner);
      const terms = { consentType: "TERMS" as const, scope: "ACCOUNT" as const };
      await repository.setConsent(owner, { ...terms, version: "IP-8-V1", decision: "GRANTED" });
      await repository.setConsent(owner, { ...terms, version: "IP-8-V1", decision: "WITHDRAWN" });
      await expect(repository.createWorld(owner, lanternReachSeed)).rejects.toThrow(
        /consent is withdrawn/i,
      );

      // A grant at a newer version supersedes the older withdrawal.
      await repository.setConsent(owner, { ...terms, version: "IP-8-V2", decision: "GRANTED" });
      const world = await repository.createWorld(owner, lanternReachSeed);
      expect(world.worldId).toMatch(/^[0-9a-f-]{36}$/);

      // Repeating the older withdrawal is idempotent and must not re-block.
      await repository.setConsent(owner, { ...terms, version: "IP-8-V1", decision: "WITHDRAWN" });
      await repository.createWorld(owner, lanternReachSeed);

      // The newest decision governs, so withdrawing the current version blocks.
      await repository.setConsent(owner, { ...terms, version: "IP-8-V2", decision: "WITHDRAWN" });
      await expect(repository.createWorld(owner, lanternReachSeed)).rejects.toThrow(
        /consent is withdrawn/i,
      );
    } finally {
      await pool.end();
    }
  });
});
