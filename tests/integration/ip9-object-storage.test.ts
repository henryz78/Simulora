import { createHash, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ExportIntegrityError,
  ExportStorageWorker,
  GovernanceService,
  InvalidDownloadLinkError,
} from "../../packages/application/src/index.js";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../../packages/database/src/index.js";
import { lanternReachSeed } from "../../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../../packages/model-gateway/src/index.js";
import {
  InMemoryObjectStorage,
  S3ObjectStorage,
  sha256Hex,
  type ObjectStoragePort,
} from "../../packages/storage/src/index.js";

const connectionString = process.env.SIMULORA_DATABASE_URL;
const s3Endpoint = process.env.SIMULORA_TEST_S3_ENDPOINT;
const suite = connectionString ? describe.sequential : describe.skip;
const s3Suite = connectionString && s3Endpoint ? describe.sequential : describe.skip;

type Owner = { accountId: string; eligibility: "adult" };

async function playableWorld(repository: AuthoritativeWorldRepository, owner: Owner) {
  const world = await repository.createWorld(owner, lanternReachSeed);
  await repository.validateDraft(owner, world.worldId);
  const revision = await repository.createRevision(owner, world.worldId, 1);
  const continuity = await repository.startContinuity(owner, revision.revisionId, {
    initiativeMode: "GUIDED",
    structureMode: "OPEN_ENDED",
  });
  return { world, continuity };
}

async function exportRequestFor(
  repository: AuthoritativeWorldRepository,
  owner: Owner,
  worldId: string,
) {
  const idempotencyKey = `export-${randomUUID()}`;
  const quote = await repository.createUsageQuote(owner, {
    schemaVersion: 1,
    idempotencyKey: `quote-${randomUUID()}`,
    actionProfile: "EXPORT",
  });
  const reservation = await repository.reserveUsage(owner, quote.quoteId, {
    schemaVersion: 1,
    actionKey: `export:${idempotencyKey}`,
  });
  return {
    schemaVersion: 1 as const,
    idempotencyKey,
    reservationId: reservation.reservationId,
    worldId,
    include: { world: true, characters: true, continuity: true, history: true },
  };
}

async function reservationState(
  pool: ReturnType<typeof createDatabasePool>,
  reservationId: string,
): Promise<{ status: string; entries: string[] }> {
  const reservation = await pool.query<{ status: string }>(
    `select status from simulora.usage_reservations where id = $1`,
    [reservationId],
  );
  const ledger = await pool.query<{ entry_type: string }>(
    `select entry_type from simulora.usage_ledger where reservation_id = $1 order by entry_type`,
    [reservationId],
  );
  return {
    status: reservation.rows[0]!.status,
    entries: ledger.rows.map((row) => row.entry_type),
  };
}

// Scoped to one World: the queue is shared with every other suite on this database.
async function drain(worker: ExportStorageWorker, worldId: string): Promise<void> {
  for (let step = 0; step < 50; step += 1) {
    if (!(await worker.processNext({ worldId }))) return;
  }
  throw new Error("Export storage work did not drain");
}

suite("IP-9 export object storage against PostgreSQL", () => {
  it("keeps core play usable and makes an object-store outage a visible, recoverable delay", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const storage = new InMemoryObjectStorage();
    const governance = new GovernanceService(repository, { artifacts: storage });
    const worker = new ExportStorageWorker(repository, storage);
    const owner: Owner = { accountId: randomUUID(), eligibility: "adult" };
    try {
      const { world, continuity } = await playableWorld(repository, owner);
      storage.setAvailable(false);

      const request = await exportRequestFor(repository, owner, world.worldId);
      const delayed = await governance.createExport(owner, request);
      expect(delayed.status).toBe("PENDING");
      expect(delayed.delay?.reasonCode).toBe("OBJECT_STORE_UNAVAILABLE");
      expect(delayed.checksum).toMatch(/^[0-9a-f]{64}$/);
      expect(await reservationState(pool, request.reservationId)).toEqual({
        status: "RESERVED",
        entries: [],
      });
      await expect(governance.readExportArtifact(owner, delayed.exportId)).rejects.toThrow(
        "Export artifact not found",
      );

      // The outage touches only the export. An Action still commits end to end.
      const action = await repository.submitAction(owner, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `outage-action-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: "Keep playing while exports are delayed.",
      });
      const gateway = new DeterministicModelGateway();
      const proposed = await repository.processAction(
        action.id,
        (turn) => gateway.generateWorldTurn(turn),
        `ip9-outage-${randomUUID()}`,
      );
      if (!proposed?.proposal) throw new Error("Expected an Action proposal during the outage");
      const committed = await repository.confirmAction(owner, action.id, {
        proposalId: proposed.proposal.id,
        proposalDigest: proposed.proposal.digest,
        expectedHeadCommitId: proposed.proposal.expectedHeadCommitId,
      });
      expect(committed.status).toBe("COMMITTED");

      // The staged artifact waits out its backoff, then the worker stores it.
      const staged = await pool.query<{ storage_state: string; storage_attempts: number }>(
        `select storage_state, storage_attempts from simulora.export_jobs where id = $1`,
        [delayed.exportId],
      );
      expect(staged.rows[0]).toEqual({ storage_state: "STAGED", storage_attempts: 1 });
      storage.setAvailable(true);
      await pool.query(
        `update simulora.export_jobs set storage_available_at = now() where id = $1`,
        [delayed.exportId],
      );
      await drain(worker, world.worldId);
      const ready = await governance.readExport(owner, delayed.exportId);
      expect(ready.status).toBe("READY");
      expect(ready.delay ?? null).toBeNull();
      const bytes = await governance.readExportArtifact(owner, delayed.exportId);
      expect(sha256Hex(bytes)).toBe(ready.checksum);

      // PostgreSQL no longer holds the bytes once the object store does.
      const cleared = await pool.query<{ has_bytes: boolean; storage_state: string }>(
        `select artifact_bytes is not null as has_bytes, storage_state
         from simulora.export_jobs where id = $1`,
        [delayed.exportId],
      );
      expect(cleared.rows[0]).toEqual({ has_bytes: false, storage_state: "STORED" });

      // Storing settles the reservation server-side, whether or not anyone is watching.
      expect(await reservationState(pool, request.reservationId)).toEqual({
        status: "SETTLED",
        entries: ["SETTLEMENT"],
      });
      await repository.settleUsage(owner, request.reservationId);
      expect((await reservationState(pool, request.reservationId)).entries).toEqual(["SETTLEMENT"]);

      // Retrying the same export request returns the stored job, not a second one.
      expect((await governance.createExport(owner, request)).exportId).toBe(delayed.exportId);
    } finally {
      await pool.end();
    }
  });

  it("propagates deletion to staged bytes and stored objects", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const storage = new InMemoryObjectStorage();
    const governance = new GovernanceService(repository, { artifacts: storage });
    const worker = new ExportStorageWorker(repository, storage);
    const owner: Owner = { accountId: randomUUID(), eligibility: "adult" };
    try {
      const { world } = await playableWorld(repository, owner);
      const storedRequest = await exportRequestFor(repository, owner, world.worldId);
      const stored = await governance.createExport(owner, storedRequest);
      expect(stored.status).toBe("READY");
      storage.setAvailable(false);
      const stagedRequest = await exportRequestFor(repository, owner, world.worldId);
      const staged = await governance.createExport(owner, stagedRequest);
      expect(staged.status).toBe("PENDING");
      storage.setAvailable(true);

      const proposal = await repository.proposeDeletion(owner, {
        schemaVersion: 1,
        idempotencyKey: `deletion-${randomUUID()}`,
        targetType: "WORLD",
        targetId: world.worldId,
      });
      expect(proposal.affected.exports).toBe(2);
      await repository.confirmDeletion(owner, {
        schemaVersion: 1,
        proposalId: proposal.proposalId,
        digest: proposal.digest,
        idempotencyKey: randomUUID(),
      });

      // Staged bytes are cleared in the deletion transaction itself.
      const afterTombstone = await pool.query<{ status: string; has_bytes: boolean }>(
        `select status, artifact_bytes is not null as has_bytes
         from simulora.export_jobs where world_id = $1 order by created_at`,
        [world.worldId],
      );
      expect(afterTombstone.rows).toEqual([
        { status: "REVOKED", has_bytes: false },
        { status: "REVOKED", has_bytes: false },
      ]);
      expect(storage.has(stored.artifactKey!)).toBe(true);
      // The export that was never stored delivered nothing, so its reservation is released.
      expect(await reservationState(pool, stagedRequest.reservationId)).toEqual({
        status: "RELEASED",
        entries: ["RELEASE"],
      });
      expect(await reservationState(pool, storedRequest.reservationId)).toEqual({
        status: "SETTLED",
        entries: ["SETTLEMENT"],
      });

      await drain(worker, world.worldId);
      expect(storage.keys()).toEqual([]);
      const deleted = await pool.query<{ storage_state: string; deleted: boolean }>(
        `select storage_state, object_deleted_at is not null as deleted
         from simulora.export_jobs where world_id = $1`,
        [world.worldId],
      );
      expect(deleted.rows).toEqual([
        { storage_state: "DELETED", deleted: true },
        { storage_state: "DELETED", deleted: true },
      ]);
    } finally {
      await pool.end();
    }
  });

  it("verifies bytes against PostgreSQL's checksum and refuses forged or stale links", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const storage = new InMemoryObjectStorage();
    let now = Date.now();
    const governance = new GovernanceService(repository, {
      artifacts: storage,
      downloadSigningKey: "ip9-test-signing-key-0123456789abcdef",
      now: () => now,
    });
    const owner: Owner = { accountId: randomUUID(), eligibility: "adult" };
    const stranger: Owner = { accountId: randomUUID(), eligibility: "adult" };
    try {
      const { world } = await playableWorld(repository, owner);
      const exported = await governance.createExport(
        owner,
        await exportRequestFor(repository, owner, world.worldId),
      );
      const key = exported.artifactKey!;

      const link = await governance.createExportDownloadLink(owner, exported.exportId);
      expect(link.method).toBe("API_SIGNED");
      const token = link.url.split("/").at(-1)!;
      const downloaded = await governance.readSignedExport(token);
      expect(sha256Hex(downloaded.bytes)).toBe(exported.checksum);

      // Another account cannot mint a link, and a link cannot be re-pointed.
      await expect(
        governance.createExportDownloadLink(stranger, exported.exportId),
      ).rejects.toThrow("Export artifact not found");
      const [, expires, signature] = token.split(".");
      await expect(
        governance.readSignedExport(`${randomUUID()}.${expires}.${signature}`),
      ).rejects.toBeInstanceOf(InvalidDownloadLinkError);
      await expect(
        governance.readSignedExport(`${exported.exportId}.${Number(expires) + 60}.${signature}`),
      ).rejects.toBeInstanceOf(InvalidDownloadLinkError);
      now += 10 * 60_000;
      await expect(governance.readSignedExport(token)).rejects.toBeInstanceOf(
        InvalidDownloadLinkError,
      );
      now = Date.now();

      // A corrupted or missing object is an integrity violation, not a download.
      const corrupted = new TextEncoder().encode("not the export");
      await storage.put(
        { key, checksum: sha256Hex(corrupted), contentType: "application/zip" },
        corrupted,
      );
      await expect(governance.readExportArtifact(owner, exported.exportId)).rejects.toEqual(
        new ExportIntegrityError("EXPORT_CHECKSUM_MISMATCH"),
      );
      await storage.delete(key);
      await expect(governance.readExportArtifact(owner, exported.exportId)).rejects.toEqual(
        new ExportIntegrityError("EXPORT_OBJECT_MISSING"),
      );

      // PostgreSQL's checksum and key are fixed; the lifecycle cannot run backwards.
      await expect(
        pool.query(`update simulora.export_jobs set checksum = $2 where id = $1`, [
          exported.exportId,
          "0".repeat(64),
        ]),
      ).rejects.toThrow(/immutable/);
      await expect(
        pool.query(`update simulora.export_jobs set storage_state = 'STAGED' where id = $1`, [
          exported.exportId,
        ]),
      ).rejects.toThrow(/lifecycle|check constraint/);
    } finally {
      await pool.end();
    }
  });

  it("migrates a pre-IP-9 inline artifact into the object store without losing access", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const storage = new InMemoryObjectStorage();
    const governance = new GovernanceService(repository, { artifacts: storage });
    const worker = new ExportStorageWorker(repository, storage);
    const owner: Owner = { accountId: randomUUID(), eligibility: "adult" };
    try {
      const { world } = await playableWorld(repository, owner);
      const exportId = randomUUID();
      const bytes = Buffer.from(`legacy export ${exportId}`);
      const checksum = createHash("sha256").update(bytes).digest("hex");
      // This is the row shape IP-8 wrote: READY with its bytes inline.
      await pool.query(
        `insert into simulora.export_jobs
         (id, account_id, world_id, idempotency_key, selected_scopes, omitted_scopes, status,
          schema_version, manifest, artifact_key, checksum, artifact_bytes, completed_at)
         values ($1, $2, $3, $4, '["world"]', '[]', 'READY', 1, '{}'::jsonb, $5, $6, $7, now())`,
        [
          exportId,
          owner.accountId,
          world.worldId,
          `legacy-${exportId}`,
          `exports/${owner.accountId}/${exportId}.zip`,
          checksum,
          bytes,
        ],
      );
      expect(Buffer.from(await governance.readExportArtifact(owner, exportId))).toEqual(bytes);
      await drain(worker, world.worldId);
      const migrated = await pool.query<{ storage_state: string; has_bytes: boolean }>(
        `select storage_state, artifact_bytes is not null as has_bytes
         from simulora.export_jobs where id = $1`,
        [exportId],
      );
      expect(migrated.rows[0]).toEqual({ storage_state: "STORED", has_bytes: false });
      expect(Buffer.from(await governance.readExportArtifact(owner, exportId))).toEqual(bytes);
    } finally {
      await pool.end();
    }
  });
});

s3Suite("IP-9 export object storage against an S3-compatible store", () => {
  function s3Storage(endpoint: string): S3ObjectStorage {
    return new S3ObjectStorage({
      endpoint,
      region: "us-east-1",
      bucket: process.env.SIMULORA_TEST_S3_BUCKET ?? "simulora-ci",
      accessKeyId: process.env.SIMULORA_TEST_S3_ACCESS_KEY ?? "simulora",
      secretAccessKey: process.env.SIMULORA_TEST_S3_SECRET_KEY ?? "change-me-local-only",
      requestTimeoutMs: 2000,
    });
  }

  it("stores, signs, verifies and deletes a real object", async () => {
    if (!connectionString || !s3Endpoint) throw new Error("PostgreSQL and S3 are required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    const storage = s3Storage(s3Endpoint);
    await storage.ensureBucket();
    const governance = new GovernanceService(repository, { artifacts: storage });
    const worker = new ExportStorageWorker(repository, storage);
    const owner: Owner = { accountId: randomUUID(), eligibility: "adult" };
    try {
      const { world } = await playableWorld(repository, owner);
      const exported = await governance.createExport(
        owner,
        await exportRequestFor(repository, owner, world.worldId),
      );
      expect(exported.status).toBe("READY");
      const key = exported.artifactKey!;
      expect(sha256Hex((await storage.get(key))!)).toBe(exported.checksum);

      const link = await governance.createExportDownloadLink(owner, exported.exportId);
      expect(link.method).toBe("OBJECT_STORE_SIGNED");
      const response = await fetch(link.url);
      expect(response.status).toBe(200);
      expect(sha256Hex(new Uint8Array(await response.arrayBuffer()))).toBe(exported.checksum);
      const unsigned = await fetch(link.url.split("?")[0]!);
      expect(unsigned.status).toBe(403);

      const shortLived = await storage.signedDownloadUrl(key, {
        expiresInSeconds: 1,
        filename: "expiring.zip",
      });
      await new Promise((resolve) => setTimeout(resolve, 2500));
      expect((await fetch(shortLived)).status).toBe(403);

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
      await drain(worker, world.worldId);
      expect(await storage.get(key)).toBeNull();
      expect((await fetch(link.url)).status).toBe(404);
    } finally {
      storage.destroy();
      await pool.end();
    }
  });

  it("turns an unreachable store into a bounded, visible delay", async () => {
    if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");
    const pool = createDatabasePool(connectionString);
    const repository = new AuthoritativeWorldRepository(pool);
    // Nothing listens on port 9; the request must fail fast rather than hang.
    const storage: ObjectStoragePort = s3Storage("http://127.0.0.1:9");
    const governance = new GovernanceService(repository, { artifacts: storage });
    const owner: Owner = { accountId: randomUUID(), eligibility: "adult" };
    try {
      const { world } = await playableWorld(repository, owner);
      const started = Date.now();
      const delayed = await governance.createExport(
        owner,
        await exportRequestFor(repository, owner, world.worldId),
      );
      expect(Date.now() - started).toBeLessThan(15_000);
      expect(delayed.status).toBe("PENDING");
      expect(delayed.delay?.reasonCode).toBe("OBJECT_STORE_UNAVAILABLE");
    } finally {
      (storage as S3ObjectStorage).destroy();
      await pool.end();
    }
  }, 30_000);
});
