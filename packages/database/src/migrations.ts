import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const advisoryLock = 7_243_611_001;
// 0026's final schema is unchanged; its amended pre-index transition only
// repairs databases that had not yet applied it. Preserve the exact known
// already-applied version without weakening checksum checks for other files.
const prior0026Checksum = "4c054edf6dddf50918f6703c40379b77668b8fb298d666a045ca1312d4fac195";

export type MigrationResult = {
  applied: string[];
  alreadyApplied: string[];
};

export async function runMigrations(
  connectionString: string,
  migrationsDirectory: string,
): Promise<MigrationResult> {
  const client = new Client({ connectionString });
  const result: MigrationResult = { applied: [], alreadyApplied: [] };
  await client.connect();

  try {
    await client.query("select pg_advisory_lock($1)", [advisoryLock]);
    await client.query("create schema if not exists app_meta");
    await client.query(`
      create table if not exists app_meta.schema_migrations (
        name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = await readFile(path.join(migrationsDirectory, file), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existing = await client.query<{ checksum: string }>(
        "select checksum from app_meta.schema_migrations where name = $1",
        [file],
      );

      if (existing.rows[0]) {
        const compatible0026 =
          file === "0026_integrated_authority_repairs.sql" &&
          existing.rows[0].checksum === prior0026Checksum;
        if (existing.rows[0].checksum !== checksum && !compatible0026) {
          throw new Error(`Migration checksum changed: ${file}`);
        }
        result.alreadyApplied.push(file);
        continue;
      }

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into app_meta.schema_migrations (name, checksum) values ($1, $2)",
          [file, checksum],
        );
        await client.query("commit");
        result.applied.push(file);
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }

    return result;
  } finally {
    await client.query("select pg_advisory_unlock($1)", [advisoryLock]).catch(() => undefined);
    await client.end();
  }
}
