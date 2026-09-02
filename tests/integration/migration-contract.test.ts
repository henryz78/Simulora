import { readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

describe("authoritative spine migrations", () => {
  it("applies from an empty PostgreSQL-compatible database", async () => {
    const database = new PGlite();
    try {
      const migration = await readFile(path.resolve("db/migrations/0001_foundation.sql"), "utf8");
      const authoritativeSpine = await readFile(
        path.resolve("db/migrations/0002_authoritative_world_continuity.sql"),
        "utf8",
      );
      const activeBranchHardening = await readFile(
        path.resolve("db/migrations/0003_ip2_active_branch_hardening.sql"),
        "utf8",
      );
      await database.exec(migration);
      await database.exec(migration);
      await database.exec(authoritativeSpine);
      await database.exec(activeBranchHardening);
      const result = await database.query<{ phase: string; started: boolean }>(`
        select
          value->>'phase' as phase,
          (value->>'productSemanticsStarted')::boolean as started
        from app_meta.foundation_metadata
        where key = 'implementation_phase'
      `);
      expect(result.rows).toEqual([{ phase: "IP-2", started: true }]);
    } finally {
      await database.close();
    }
  });
});
