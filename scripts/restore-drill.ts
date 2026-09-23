// IP-9.10 backup-restore drill. A database restored into isolation is compared
// with its source before anything is allowed to serve from it: every table's
// content, migration history, Branch/Commit/State integrity, canonical document
// hashes, and every stored export object against the checksum PostgreSQL holds.
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { GovernanceService } from "../packages/application/src/index.js";
import {
  AuthoritativeWorldRepository,
  createDatabasePool,
} from "../packages/database/src/index.js";
import { lanternReachSeed } from "../packages/domain/src/index.js";
import { DeterministicModelGateway } from "../packages/model-gateway/src/index.js";
import { S3ObjectStorage, type ObjectStoragePort } from "../packages/storage/src/index.js";

export type RestoreDrillCheck = { check: string; passed: boolean; detail: string };

export type RestoreDrillReport = {
  tables: number;
  rows: number;
  storedObjects: number;
  checks: RestoreDrillCheck[];
  passed: boolean;
};

type Fingerprint = { table: string; rows: number; digest: string };

async function fingerprints(client: Client): Promise<Fingerprint[]> {
  const tables = await client.query<{ schema: string; name: string }>(
    `select table_schema as schema, table_name as name from information_schema.tables
     where table_schema in ('simulora', 'app_meta') and table_type = 'BASE TABLE'
     order by table_schema, table_name`,
  );
  const result: Fingerprint[] = [];
  for (const { schema, name } of tables.rows) {
    const qualified = `${client.escapeIdentifier(schema)}.${client.escapeIdentifier(name)}`;
    // Row text is compared byte for byte, in a stable order, so any lost,
    // duplicated or altered row changes the digest.
    const row = await client.query<{ rows: string; digest: string }>(
      `select count(*)::text as rows,
              md5(coalesce(string_agg(t::text, E'\\n' order by t::text), '')) as digest
       from ${qualified} t`,
    );
    result.push({
      table: `${schema}.${name}`,
      rows: Number(row.rows[0]!.rows),
      digest: row.rows[0]!.digest,
    });
  }
  return result;
}

async function count(client: Client, sql: string): Promise<number> {
  const result = await client.query<{ count: string }>(sql);
  return Number(result.rows[0]!.count);
}

const integrityQueries: Array<{ check: string; sql: string; detail: string }> = [
  {
    check: "BRANCH_HEADS_RESOLVE",
    detail:
      "Every active Branch head names a Commit whose State Revision is the Branch head state.",
    sql: `select count(*) from simulora.branches b
          left join simulora.world_commits c on c.id = b.head_commit_id
          left join simulora.state_revisions s on s.id = b.head_state_revision_id
          where b.status = 'ACTIVE'
            and (c.id is null or s.id is null or s.commit_id <> c.id
                 or c.state_revision_id <> s.id or c.branch_id <> b.id)`,
  },
  {
    check: "ACTIVE_BRANCH_BELONGS_TO_CONTINUITY",
    detail: "A Continuity's active Branch is one of its own Branches.",
    sql: `select count(*) from simulora.continuities c
          left join simulora.branches b on b.id = c.active_branch_id
          where c.active_branch_id is not null and (b.id is null or b.continuity_id <> c.id)`,
  },
  {
    check: "COMMIT_STATE_PAIRS_MATCH",
    detail: "Each Commit and its State Revision point at each other.",
    sql: `select count(*) from simulora.world_commits c
          left join simulora.state_revisions s on s.id = c.state_revision_id
          where s.id is null or s.commit_id <> c.id`,
  },
  {
    check: "EXPORT_STORAGE_CONSISTENT",
    detail: "A stored export has a checksum and key and no leftover staging bytes.",
    sql: `select count(*) from simulora.export_jobs
          where storage_state = 'STORED'
            and (checksum is null or artifact_key is null or artifact_bytes is not null)`,
  },
];

// Legacy rows written before G5's canonical hash may legitimately differ; the
// drill therefore requires the restored count to equal the source count.
const hashMismatchQueries = {
  state: `select count(*) from simulora.state_revisions
          where document_hash <> encode(sha256(convert_to(simulora.canonical_jsonb_text(document), 'UTF8')), 'hex')`,
  world: `select count(*) from simulora.world_revisions
          where document_hash <> encode(sha256(convert_to(simulora.canonical_jsonb_text(document), 'UTF8')), 'hex')`,
};

export async function runRestoreDrill(options: {
  sourceUrl: string;
  restoredUrl: string;
  objects?: ObjectStoragePort;
}): Promise<RestoreDrillReport> {
  const source = new Client({ connectionString: options.sourceUrl });
  const restored = new Client({ connectionString: options.restoredUrl });
  await source.connect();
  await restored.connect();
  const checks: RestoreDrillCheck[] = [];
  try {
    // A consistent snapshot of the source while it is compared.
    await source.query("begin isolation level repeatable read read only");
    const [sourcePrints, restoredPrints] = [
      await fingerprints(source),
      await fingerprints(restored),
    ];
    const byTable = new Map(restoredPrints.map((print) => [print.table, print]));
    const differing = sourcePrints.filter((print) => {
      const other = byTable.get(print.table);
      return !other || other.rows !== print.rows || other.digest !== print.digest;
    });
    checks.push({
      check: "TABLE_CONTENT_IDENTICAL",
      passed: differing.length === 0 && sourcePrints.length === restoredPrints.length,
      detail:
        differing.length === 0
          ? `${sourcePrints.length} tables match row for row`
          : `differs: ${differing.map((print) => print.table).join(", ")}`,
    });
    for (const query of integrityQueries) {
      const violations = await count(restored, query.sql);
      checks.push({
        check: query.check,
        passed: violations === 0,
        detail: `${query.detail} Violations: ${violations}.`,
      });
    }
    for (const [label, sql] of Object.entries(hashMismatchQueries)) {
      const [before, after] = [await count(source, sql), await count(restored, sql)];
      checks.push({
        check: `CANONICAL_${label.toUpperCase()}_HASHES_PRESERVED`,
        passed: before === after,
        detail: `Rows not matching the canonical hash: source ${before}, restored ${after}.`,
      });
    }
    // The application, not only SQL, must be able to serve from the restored copy.
    const continuities = await source.query<{ id: string; owner: string; state_hash: string }>(
      `select c.id, c.owner_account_id as owner, s.document_hash as state_hash
       from simulora.continuities c
       join simulora.branches b on b.id = c.active_branch_id
       join simulora.state_revisions s on s.id = b.head_state_revision_id
       where c.status = 'ACTIVE' order by c.created_at desc limit 25`,
    );
    const restoredPool = createDatabasePool(options.restoredUrl);
    const unreadable: string[] = [];
    try {
      const repository = new AuthoritativeWorldRepository(restoredPool);
      for (const row of continuities.rows) {
        try {
          const state = await repository.readCurrentState(
            { accountId: row.owner, eligibility: "adult" },
            row.id,
          );
          if (state.stateHash !== row.state_hash) unreadable.push(row.id);
        } catch {
          unreadable.push(row.id);
        }
      }
    } finally {
      await restoredPool.end();
    }
    checks.push({
      check: "RESTORED_STATE_SERVED",
      passed: unreadable.length === 0,
      detail: `${continuities.rows.length} Continuities read through the application; mismatched or unreadable: ${unreadable.length}.`,
    });
    let storedObjects = 0;
    if (options.objects) {
      const stored = await restored.query<{ id: string; artifact_key: string; checksum: string }>(
        `select id, artifact_key, checksum from simulora.export_jobs where storage_state = 'STORED'`,
      );
      const broken: string[] = [];
      for (const row of stored.rows) {
        const body = await options.objects.get(row.artifact_key);
        if (!body || createHash("sha256").update(body).digest("hex") !== row.checksum) {
          broken.push(row.id);
        }
      }
      storedObjects = stored.rows.length;
      checks.push({
        check: "OBJECT_MANIFEST_INTACT",
        passed: broken.length === 0,
        detail: `${stored.rows.length} stored exports checked; missing or altered: ${broken.length}.`,
      });
    }
    await source.query("rollback");
    return {
      tables: sourcePrints.length,
      rows: sourcePrints.reduce((sum, print) => sum + print.rows, 0),
      storedObjects,
      checks,
      passed: checks.every((check) => check.passed),
    };
  } finally {
    await source.end();
    await restored.end();
  }
}

/**
 * Populates a drill source through the real repository: a committed Action, a
 * recovery point and a READY export whose bytes live in the object store.
 */
export async function seedRestoreDrillSource(
  connectionString: string,
  objects: ObjectStoragePort,
): Promise<{ exports: number; commits: number }> {
  const pool = createDatabasePool(connectionString);
  const repository = new AuthoritativeWorldRepository(pool);
  const governance = new GovernanceService(repository, { artifacts: objects });
  const gateway = new DeterministicModelGateway();
  try {
    let commits = 0;
    let exports = 0;
    for (let index = 0; index < 3; index += 1) {
      const owner = { accountId: randomUUID(), eligibility: "adult" as const };
      const world = await repository.createWorld(owner, lanternReachSeed);
      await repository.validateDraft(owner, world.worldId);
      const revision = await repository.createRevision(owner, world.worldId, 1);
      const continuity = await repository.startContinuity(owner, revision.revisionId, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const action = await repository.submitAction(owner, continuity.branchId, {
        schemaVersion: 1,
        idempotencyKey: `drill-${randomUUID()}`,
        expectedHeadCommitId: continuity.headCommitId,
        participationExpectation: continuity.state.participation,
        intent: `Record drill change ${index + 1}.`,
      });
      const proposed = await repository.processAction(
        action.id,
        (request) => gateway.generateWorldTurn(request),
        "restore-drill-seed",
      );
      if (!proposed?.proposal) throw new Error("Drill seed expected a proposal");
      await repository.confirmAction(owner, action.id, {
        proposalId: proposed.proposal.id,
        proposalDigest: proposed.proposal.digest,
        expectedHeadCommitId: proposed.proposal.expectedHeadCommitId,
      });
      commits += 1;
      await repository.createRecoveryPoint(owner, continuity.branchId, {
        idempotencyKey: `drill-point-${randomUUID()}`,
        label: "Before the restore drill",
      });
      const idempotencyKey = `drill-export-${randomUUID()}`;
      const quote = await repository.createUsageQuote(owner, {
        schemaVersion: 1,
        idempotencyKey: `drill-quote-${randomUUID()}`,
        actionProfile: "EXPORT",
      });
      const reservation = await repository.reserveUsage(owner, quote.quoteId, {
        schemaVersion: 1,
        actionKey: `export:${idempotencyKey}`,
      });
      const exported = await governance.createExport(owner, {
        schemaVersion: 1,
        idempotencyKey,
        reservationId: reservation.reservationId,
        worldId: world.worldId,
        include: { world: true, characters: true, continuity: true, history: true },
      });
      if (exported.status !== "READY") throw new Error("Drill seed expected a stored export");
      await repository.settleUsage(owner, reservation.reservationId);
      exports += 1;
    }
    return { exports, commits };
  } finally {
    await pool.end();
  }
}

function objectStoreFromEnvironment(): S3ObjectStorage | undefined {
  const endpoint = process.env.SIMULORA_OBJECT_ENDPOINT;
  return endpoint
    ? new S3ObjectStorage({
        endpoint,
        region: process.env.SIMULORA_OBJECT_REGION ?? "local",
        bucket: process.env.SIMULORA_OBJECT_BUCKET ?? "simulora-local",
        ...(process.env.SIMULORA_OBJECT_ACCESS_KEY
          ? { accessKeyId: process.env.SIMULORA_OBJECT_ACCESS_KEY }
          : {}),
        ...(process.env.SIMULORA_OBJECT_SECRET_KEY
          ? { secretAccessKey: process.env.SIMULORA_OBJECT_SECRET_KEY }
          : {}),
      })
    : undefined;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) &&
  process.argv.includes("--seed")
) {
  const connectionString = process.env.SIMULORA_DATABASE_URL;
  const objects = objectStoreFromEnvironment();
  if (!connectionString || !objects) {
    throw new Error("Seeding needs SIMULORA_DATABASE_URL and an S3-compatible object store");
  }
  try {
    console.log(JSON.stringify(await seedRestoreDrillSource(connectionString, objects)));
  } finally {
    objects.destroy();
  }
} else if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const sourceUrl = process.env.SIMULORA_DATABASE_URL;
  const restoredUrl = process.env.SIMULORA_RESTORE_DATABASE_URL;
  if (!sourceUrl || !restoredUrl) {
    throw new Error("SIMULORA_DATABASE_URL and SIMULORA_RESTORE_DATABASE_URL are required");
  }
  if (sourceUrl === restoredUrl) throw new Error("The restore target must be an isolated database");
  const objects = objectStoreFromEnvironment();
  try {
    const report = await runRestoreDrill({
      sourceUrl,
      restoredUrl,
      ...(objects ? { objects } : {}),
    });
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  } finally {
    objects?.destroy();
  }
}
