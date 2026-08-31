import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = path.join(repositoryRoot, "db", "migrations");
const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();

if (files.length === 0) throw new Error("No migrations found");

const names = new Set<string>();
const checksums = new Set<string>();
for (const [index, file] of files.entries()) {
  if (!/^\d{4}_[a-z0-9_]+\.sql$/.test(file)) throw new Error(`Invalid migration name: ${file}`);
  const expectedPrefix = String(index + 1).padStart(4, "0");
  if (!file.startsWith(expectedPrefix)) throw new Error(`Migration sequence gap at ${file}`);
  if (names.has(file)) throw new Error(`Duplicate migration name: ${file}`);
  names.add(file);
  const sql = await readFile(path.join(migrationsDirectory, file), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  if (checksums.has(checksum)) throw new Error(`Duplicate migration content: ${file}`);
  checksums.add(checksum);
}

const database = new PGlite();
try {
  for (const file of files) {
    await database.exec(await readFile(path.join(migrationsDirectory, file), "utf8"));
  }
  const result = await database.query<{ phase: string; product_semantics_started: boolean }>(`
    select
      value->>'phase' as phase,
      (value->>'productSemanticsStarted')::boolean as product_semantics_started
    from app_meta.foundation_metadata
    where key = 'implementation_phase'
  `);
  const row = result.rows[0];
  if (!row || row.phase !== "IP-2" || row.product_semantics_started !== true) {
    throw new Error("IP-2 migration contract failed");
  }
  console.log(`Migration check passed (${files.length} migration)`);
} finally {
  await database.close();
}
