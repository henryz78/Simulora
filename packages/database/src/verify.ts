import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadLocalEnvironment, loadServerConfig } from "@simulora/config";
import { Client } from "pg";
import { runMigrations } from "./migrations.js";

loadLocalEnvironment();
const config = loadServerConfig();
if (config.SIMULORA_ENV !== "test" || process.env.SIMULORA_MIGRATION_VERIFY !== "1") {
  throw new Error("Migration recovery rehearsal is restricted to an explicit test environment");
}
const connectionString = config.SIMULORA_DATABASE_URL;
if (!connectionString) throw new Error("SIMULORA_DATABASE_URL is required");

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationsDirectory = path.join(repositoryRoot, "db", "migrations");
const migrationName = "0002_authoritative_world_continuity.sql";
const migration = await readFile(path.join(migrationsDirectory, migrationName), "utf8");
const checksum = createHash("sha256").update(migration).digest("hex");
const client = new Client({ connectionString });

await client.connect();
try {
  const foundation = await client.query<{ phase: string; started: boolean }>(`
    select value->>'phase' as phase,
           (value->>'productSemanticsStarted')::boolean as started
    from app_meta.foundation_metadata
    where key = 'implementation_phase'
  `);
  if (foundation.rows[0]?.phase !== "IP-4" || foundation.rows[0].started !== true) {
    throw new Error("IP-4 metadata verification failed");
  }

  const ledger = await client.query<{ checksum: string }>(
    "select checksum from app_meta.schema_migrations where name = $1",
    [migrationName],
  );
  if (ledger.rows[0]?.checksum !== checksum)
    throw new Error("Migration ledger verification failed");

  await client.query(
    "update app_meta.schema_migrations set checksum = 'recovery-rehearsal' where name = $1",
    [migrationName],
  );
} finally {
  await client.end();
}

let guardTriggered = false;
try {
  await runMigrations(connectionString, migrationsDirectory);
} catch (error) {
  guardTriggered = error instanceof Error && error.message.includes("Migration checksum changed");
}

const recoveryClient = new Client({ connectionString });
await recoveryClient.connect();
try {
  await recoveryClient.query(
    "update app_meta.schema_migrations set checksum = $1 where name = $2",
    [checksum, migrationName],
  );
} finally {
  await recoveryClient.end();
}

if (!guardTriggered) throw new Error("Migration checksum guard did not trigger");
await runMigrations(connectionString, migrationsDirectory);
console.log("PostgreSQL migration ledger and recovery rehearsal passed");
