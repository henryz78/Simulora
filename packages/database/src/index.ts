import { Kysely, PostgresDialect, type ColumnType, type Generated } from "kysely";
import { Pool, type PoolConfig } from "pg";

export type DatabaseHealth = { configured: boolean; reachable: boolean };

export type FoundationMetadataTable = {
  key: string;
  value: unknown;
  created_at: Generated<ColumnType<Date, Date | string | undefined, never>>;
};

export type FoundationDatabase = {
  "app_meta.foundation_metadata": FoundationMetadataTable;
};

export function createDatabasePool(
  connectionString: string | undefined,
  overrides: PoolConfig = {},
): Pool {
  if (!connectionString) {
    throw new Error("SIMULORA_DATABASE_URL is required for a database connection");
  }
  return new Pool({ connectionString, max: 10, ...overrides });
}

export async function checkDatabase(pool: Pool): Promise<DatabaseHealth> {
  try {
    await pool.query("select 1");
    return { configured: true, reachable: true };
  } catch {
    return { configured: true, reachable: false };
  }
}

export function createTypedDatabase(pool: Pool): Kysely<FoundationDatabase> {
  return new Kysely<FoundationDatabase>({ dialect: new PostgresDialect({ pool }) });
}
