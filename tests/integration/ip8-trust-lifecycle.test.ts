import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  AuthoritativeWorldRepository,
  ConflictError,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";

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
        schemaVersion: 1 as const,
        idempotencyKey: `consent-${randomUUID()}`,
        consentType: "TERMS" as const,
        version: "IP-8-V1",
        scope: "ACCOUNT" as const,
        decision: "GRANTED" as const,
      };
      const firstConsent = await repository.setConsent(owner, consentRequest);
      const retriedConsent = await repository.setConsent(owner, consentRequest);
      expect(retriedConsent).toEqual(firstConsent);
      expect(retriedConsent.withdrawalAvailable).toBe(true);
      await expect(
        repository.setConsent(owner, { ...consentRequest, decision: "WITHDRAWN" }),
      ).rejects.toBeInstanceOf(ConflictError);

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
      expect(
        (await repository.readAccess(participant, "continuity", ownerContinuity.continuityId))
          .reasonCode,
      ).toBe("NOT_FOUND");
      const stranger = { accountId: randomUUID(), eligibility: "adult" as const };
      await repository.ensureAccount(stranger);
      const hiddenWorld = await repository.readAccess(stranger, "world", world.worldId);
      expect(hiddenWorld.reasonCode).toBe("NOT_FOUND");
      expect(hiddenWorld.visibility).toBe("UNKNOWN");
      const participantContinuity = await repository.startContinuity(
        participant,
        revision.revisionId,
        { initiativeMode: "DIRECT", structureMode: "OPEN_ENDED" },
      );
      await expect(
        repository.readCurrentState(owner, participantContinuity.continuityId),
      ).rejects.toThrow("Continuity not found");

      const quoteRequest = {
        schemaVersion: 1,
        idempotencyKey: `quote-${randomUUID()}`,
        actionProfile: "EXPORT",
      } as const;
      const quote = await repository.createUsageQuote(owner, quoteRequest);
      expect(await repository.createUsageQuote(owner, quoteRequest)).toEqual(quote);
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
        idempotencyKey: `quote-${randomUUID()}`,
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

      const proposalRequest = {
        schemaVersion: 1,
        idempotencyKey: `deletion-${randomUUID()}`,
        targetType: "WORLD",
        targetId: world.worldId,
      } as const;
      const proposal = await repository.proposeDeletion(owner, proposalRequest);
      expect(await repository.proposeDeletion(owner, proposalRequest)).toEqual(proposal);
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
        idempotencyKey: `quote-${randomUUID()}`,
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
        schemaVersion: 1,
        idempotencyKey: `consent-${randomUUID()}`,
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
        schemaVersion: 1,
        idempotencyKey: `consent-${randomUUID()}`,
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
        idempotencyKey: `deletion-${randomUUID()}`,
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

  it("does not create an export after a queued World tombstone wins", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const side = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const owner = { accountId: randomUUID(), eligibility: "adult" as const };
    const holder = await side.connect();
    try {
      const world = await repository.createWorld(owner, lanternReachSeed);
      const proposal = await repository.proposeDeletion(owner, {
        schemaVersion: 1,
        idempotencyKey: `deletion-${randomUUID()}`,
        targetType: "WORLD",
        targetId: world.worldId,
      });
      const quote = await repository.createUsageQuote(owner, {
        schemaVersion: 1,
        idempotencyKey: `quote-${randomUUID()}`,
        actionProfile: "EXPORT",
      });
      const exportKey = `export-${randomUUID()}`;
      const reservation = await repository.reserveUsage(owner, quote.quoteId, {
        schemaVersion: 1,
        actionKey: `export:${exportKey}`,
      });

      await holder.query("begin");
      await holder.query("select id from simulora.worlds where id = $1 for update", [
        world.worldId,
      ]);
      const pendingDeletion = repository
        .confirmDeletion(owner, {
          schemaVersion: 1,
          proposalId: proposal.proposalId,
          digest: proposal.digest,
          idempotencyKey: `confirm-${randomUUID()}`,
        })
        .then((value) => ({ value, error: null as unknown }))
        .catch((error: unknown) => ({ value: null, error }));
      await new Promise((resolve) => setTimeout(resolve, 150));
      const pendingExport = repository
        .createExport(owner, {
          schemaVersion: 1,
          idempotencyKey: exportKey,
          reservationId: reservation.reservationId,
          worldId: world.worldId,
          include: { world: true, characters: false, continuity: false, history: false },
        })
        .then((value) => ({ value, error: null as unknown }))
        .catch((error: unknown) => ({ value: null, error }));
      await new Promise((resolve) => setTimeout(resolve, 150));
      await holder.query("commit");

      const deletion = await pendingDeletion;
      expect(deletion.error).toBeNull();
      expect(deletion.value?.status).toBe("COMPLETED");
      const exported = await pendingExport;
      expect(exported.value).toBeNull();
      expect(String(exported.error)).toMatch(/CONCURRENT_UPDATE_RETRY|WORLD_TOMBSTONED/);
    } finally {
      await holder.query("rollback").catch(() => undefined);
      holder.release();
      await side.end();
      await pool.end();
    }
  });

  it("makes every guarded path take the World lock before the Continuity lock", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const gateway = new DeterministicModelGateway();
    const owner = { accountId: randomUUID(), eligibility: "adult" as const };
    // `pg` is not a root dependency, so the dedicated connections come from a
    // second pool rather than a direct client import.
    const side = createDatabasePool(connectionString);
    const holder = await side.connect();
    const probe = await side.connect();
    try {
      const world = await repository.createWorld(owner, lanternReachSeed);
      await repository.validateDraft(owner, world.worldId);
      const revision = await repository.createRevision(owner, world.worldId, 1);
      const continuity = await repository.startContinuity(owner, revision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const point = await repository.createRecoveryPoint(owner, continuity.branchId, {
        idempotencyKey: `lock-point-${randomUUID()}`,
        label: "Before the lock ordering test",
      });
      const action = await repository.submitAction(owner, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `lock-action-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "Change the signal before testing lock ordering.",
      });
      const proposed = await repository.processAction(
        action.id,
        (request) => gateway.generateWorldTurn(request),
        `ip8-lock-${randomUUID()}`,
      );
      if (!proposed?.proposal) throw new Error("Expected Action proposal");
      const committed = await repository.confirmAction(owner, action.id, {
        proposalId: proposed.proposal.id,
        proposalDigest: proposed.proposal.digest,
        expectedHeadCommitId: proposed.proposal.expectedHeadCommitId,
      });
      const restore = await repository.prepareRestore(owner, continuity.branchId, point.commitId);

      // confirmDeletion's first lock on this pair is the World row. Holding it here
      // reproduces that half deterministically, instead of hoping two operations
      // happen to overlap.
      await holder.query("begin");
      await holder.query("select id from simulora.worlds where id = $1 for update", [
        world.worldId,
      ]);

      const guarded: Array<[string, () => Promise<unknown>]> = [
        [
          "createRecoveryPoint",
          () =>
            repository.createRecoveryPoint(owner, continuity.branchId, {
              idempotencyKey: `lock-blocked-${randomUUID()}`,
              label: "Blocked behind the World lock",
            }),
        ],
        [
          "forkBranch",
          () =>
            repository.forkBranch(owner, continuity.continuityId, {
              idempotencyKey: `lock-fork-${randomUUID()}`,
              name: "Blocked behind the World lock",
              sourceCommitId: committed.commit?.resultingHeadCommitId ?? point.commitId,
              expectedHeadCommitId: committed.commit?.resultingHeadCommitId ?? point.commitId,
            }),
        ],
        [
          // The path the third review found still inverted: it must block on the
          // World too, not slip past on a Continuity lock it took first.
          "confirmRestore",
          () =>
            repository.confirmRestore(owner, continuity.branchId, {
              proposalId: restore.id,
              digest: restore.digest,
              expectedHeadCommitId: restore.expectedHeadCommitId,
            }),
        ],
      ];

      for (const [name, run] of guarded) {
        let settled = false;
        const pending = run().then(
          (value) => {
            settled = true;
            return value;
          },
          (error: unknown) => {
            settled = true;
            return error;
          },
        );
        await new Promise((resolve) => setTimeout(resolve, 750));

        // Waiting proves the World lock is wanted. It does not yet prove the World
        // lock is wanted FIRST: an inverted path would also end up waiting here,
        // holding the Continuity all the while.
        expect([name, settled]).toEqual([name, false]);

        // So probe the Continuity from a third connection. A granted row lock lives
        // in the tuple header and never appears in pg_locks, so `nowait` is the
        // detector: it raises 55P03 only if the blocked path already holds the
        // Continuity, which is exactly the inversion. This probe fails on the
        // pre-repair ordering and passes on the repaired one.
        await probe.query("begin");
        let continuityHeldByBlockedPath = false;
        try {
          await probe.query(
            "select id from simulora.continuities where id = $1 for update nowait",
            [continuity.continuityId],
          );
        } catch (error) {
          if ((error as { code?: string }).code !== "55P03") throw error;
          continuityHeldByBlockedPath = true;
        }
        await probe.query("rollback");
        expect([name, continuityHeldByBlockedPath]).toEqual([name, false]);

        await holder.query("commit");
        const outcome = await pending;
        // The World is not deleted, so releasing the lock lets the work finish.
        expect([name, outcome instanceof Error ? String(outcome) : "completed"]).toEqual([
          name,
          "completed",
        ]);
        await holder.query("begin");
        await holder.query("select id from simulora.worlds where id = $1 for update", [
          world.worldId,
        ]);
      }
      await holder.query("rollback");
    } finally {
      holder.release();
      probe.release();
      await side.end();
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
      await repository.setConsent(owner, {
        schemaVersion: 1,
        idempotencyKey: `consent-${randomUUID()}`,
        ...terms,
        version: "IP-8-V1",
        decision: "GRANTED",
      });
      await repository.setConsent(owner, {
        schemaVersion: 1,
        idempotencyKey: `consent-${randomUUID()}`,
        ...terms,
        version: "IP-8-V1",
        decision: "WITHDRAWN",
      });
      await expect(repository.createWorld(owner, lanternReachSeed)).rejects.toThrow(
        /consent is withdrawn/i,
      );

      // A grant at a newer version supersedes the older withdrawal.
      await repository.setConsent(owner, {
        schemaVersion: 1,
        idempotencyKey: `consent-${randomUUID()}`,
        ...terms,
        version: "IP-8-V2",
        decision: "GRANTED",
      });
      const world = await repository.createWorld(owner, lanternReachSeed);
      expect(world.worldId).toMatch(/^[0-9a-f-]{36}$/);

      // Repeating the older withdrawal is idempotent and must not re-block.
      await repository.setConsent(owner, {
        schemaVersion: 1,
        idempotencyKey: `consent-${randomUUID()}`,
        ...terms,
        version: "IP-8-V1",
        decision: "WITHDRAWN",
      });
      await repository.createWorld(owner, lanternReachSeed);

      // The newest decision governs, so withdrawing the current version blocks.
      await repository.setConsent(owner, {
        schemaVersion: 1,
        idempotencyKey: `consent-${randomUUID()}`,
        ...terms,
        version: "IP-8-V2",
        decision: "WITHDRAWN",
      });
      await expect(repository.createWorld(owner, lanternReachSeed)).rejects.toThrow(
        /consent is withdrawn/i,
      );
    } finally {
      await pool.end();
    }
  });
});
