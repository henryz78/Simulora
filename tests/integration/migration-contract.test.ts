import { readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

describe("foundation migration", () => {
  it("applies from an empty PostgreSQL-compatible database", async () => {
    const database = new PGlite();
    try {
      const migration = await readFile(path.resolve("db/migrations/0001_foundation.sql"), "utf8");
      await database.exec(migration);
      await database.exec(migration);
      const result = await database.query<{ phase: string; started: boolean }>(`
        select
          value->>'phase' as phase,
          (value->>'productSemanticsStarted')::boolean as started
        from app_meta.foundation_metadata
        where key = 'implementation_phase'
      `);
      expect(result.rows).toEqual([{ phase: "IP-1", started: false }]);
    } finally {
      await database.close();
    }
  });
});
