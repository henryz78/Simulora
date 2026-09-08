import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import {
  contentHash,
  createInitialState,
  lanternReachSeed,
} from "../../packages/domain/src/index.js";

describe("authoritative spine migrations", () => {
  it("applies from an empty PostgreSQL-compatible database", async () => {
    const database = new PGlite();
    try {
      const migrationFiles = (await readdir(path.resolve("db/migrations")))
        .filter((file) => file.endsWith(".sql"))
        .sort();
      for (const file of migrationFiles) {
        await database.exec(await readFile(path.resolve("db/migrations", file), "utf8"));
      }
      const result = await database.query<{ phase: string; started: boolean }>(`
        select
          value->>'phase' as phase,
          (value->>'productSemanticsStarted')::boolean as started
        from app_meta.foundation_metadata
        where key = 'implementation_phase'
      `);
      expect(result.rows).toEqual([{ phase: "IP-6", started: true }]);

      const state = createInitialState(lanternReachSeed, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const databaseHash = await database.query<{ document_hash: string }>(
        `select encode(
           sha256(convert_to(simulora.canonical_jsonb_text($1::jsonb), 'UTF8')),
           'hex'
         ) as document_hash`,
        [JSON.stringify(state)],
      );
      expect(databaseHash.rows[0]?.document_hash).toBe(contentHash(state));

      await database.exec(`
        begin;
        insert into simulora.accounts (id, eligibility)
        values ('00000000-0000-4000-8000-000000000101', 'ADULT');
        insert into simulora.worlds (id, owner_account_id, title)
        values (
          '00000000-0000-4000-8000-000000000102',
          '00000000-0000-4000-8000-000000000101',
          'Invariant fixture'
        );
        insert into simulora.authoring_validation_runs
          (id, world_id, draft_row_version, outcome, findings)
        values (
          '00000000-0000-4000-8000-000000000103',
          '00000000-0000-4000-8000-000000000102',
          1,
          'VALID',
          '[]'::jsonb
        );
        insert into simulora.world_revisions
          (id, world_id, revision_number, source_draft_row_version, document, document_hash, validation_run_id)
        values (
          '00000000-0000-4000-8000-000000000104',
          '00000000-0000-4000-8000-000000000102',
          1,
          1,
          '{}'::jsonb,
          repeat('0', 64),
          '00000000-0000-4000-8000-000000000103'
        );
        insert into simulora.continuities
          (id, owner_account_id, world_revision_id, status)
        values (
          '00000000-0000-4000-8000-000000000105',
          '00000000-0000-4000-8000-000000000101',
          '00000000-0000-4000-8000-000000000104',
          'INITIALIZING'
        );
        insert into simulora.branches (id, continuity_id, name, status)
        values (
          '00000000-0000-4000-8000-000000000106',
          '00000000-0000-4000-8000-000000000105',
          'Original path',
          'INITIALIZING'
        );
        insert into simulora.world_commits
          (id, branch_id, kind, actor_account_id, state_revision_id)
        values (
          '00000000-0000-4000-8000-000000000107',
          '00000000-0000-4000-8000-000000000106',
          'CONTINUITY_INITIALIZED',
          '00000000-0000-4000-8000-000000000101',
          '00000000-0000-4000-8000-000000000108'
        );
        insert into simulora.state_revisions
          (id, branch_id, commit_id, schema_version, document, document_hash)
        values (
          '00000000-0000-4000-8000-000000000108',
          '00000000-0000-4000-8000-000000000106',
          '00000000-0000-4000-8000-000000000107',
          1,
          '{}'::jsonb,
          '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a'
        );
        update simulora.branches
           set head_commit_id = '00000000-0000-4000-8000-000000000107',
               head_state_revision_id = '00000000-0000-4000-8000-000000000108',
               status = 'ACTIVE'
         where id = '00000000-0000-4000-8000-000000000106';
        update simulora.continuities
           set active_branch_id = '00000000-0000-4000-8000-000000000106',
               status = 'ACTIVE'
         where id = '00000000-0000-4000-8000-000000000105';
        commit;
      `);

      await expect(
        database.exec(`
          update simulora.branches
             set status = 'INITIALIZING'
           where id = '00000000-0000-4000-8000-000000000106'
        `),
      ).rejects.toThrow(
        /ACTIVE Continuity requires its Branch to remain active with complete heads/,
      );
    } finally {
      await database.close();
    }
  }, 15_000);

  it("preserves populated pre-G5 rows while enforcing one canonical hash for new state", async () => {
    const database = new PGlite();
    try {
      const migrationFiles = (await readdir(path.resolve("db/migrations")))
        .filter((file) => file.endsWith(".sql"))
        .sort();
      for (const file of migrationFiles.slice(0, 10)) {
        await database.exec(await readFile(path.resolve("db/migrations", file), "utf8"));
      }

      const edgeDocument = { a: 1, B: 2, huge: 1e21, tiny: 1e-7 };
      const legacySerialization = '{"a":1,"B":2,"huge":1e+21,"tiny":1e-7}';
      const legacyHash = createHash("sha256").update(legacySerialization).digest("hex");
      await database.exec(
        `begin;
         insert into simulora.accounts (id, eligibility)
         values ('00000000-0000-4000-8000-000000000201', 'ADULT');
         insert into simulora.worlds (id, owner_account_id, title)
         values ('00000000-0000-4000-8000-000000000202',
                 '00000000-0000-4000-8000-000000000201', 'Legacy hash fixture');
         insert into simulora.authoring_validation_runs
           (id, world_id, draft_row_version, outcome, findings)
         values ('00000000-0000-4000-8000-000000000203',
                 '00000000-0000-4000-8000-000000000202', 1, 'VALID', '[]'::jsonb);
         insert into simulora.world_revisions
           (id, world_id, revision_number, source_draft_row_version, document, document_hash,
            validation_run_id)
         values ('00000000-0000-4000-8000-000000000204',
                 '00000000-0000-4000-8000-000000000202', 1, 1, '{}'::jsonb,
                 repeat('0', 64), '00000000-0000-4000-8000-000000000203');
         insert into simulora.continuities
           (id, owner_account_id, world_revision_id, status)
         values ('00000000-0000-4000-8000-000000000205',
                 '00000000-0000-4000-8000-000000000201',
                 '00000000-0000-4000-8000-000000000204', 'INITIALIZING');
         insert into simulora.branches (id, continuity_id, name, status)
         values ('00000000-0000-4000-8000-000000000206',
                 '00000000-0000-4000-8000-000000000205', 'Original path', 'INITIALIZING');
         insert into simulora.world_commits
           (id, branch_id, kind, actor_account_id, state_revision_id)
         values ('00000000-0000-4000-8000-000000000207',
                 '00000000-0000-4000-8000-000000000206', 'CONTINUITY_INITIALIZED',
                 '00000000-0000-4000-8000-000000000201',
                 '00000000-0000-4000-8000-000000000208');
         insert into simulora.state_revisions
           (id, branch_id, commit_id, schema_version, document, document_hash)
         values ('00000000-0000-4000-8000-000000000208',
                 '00000000-0000-4000-8000-000000000206',
                 '00000000-0000-4000-8000-000000000207', 1,
                 '${JSON.stringify(edgeDocument)}'::jsonb, '${legacyHash}');
         commit;`,
      );

      for (const file of migrationFiles.slice(10)) {
        await database.exec(await readFile(path.resolve("db/migrations", file), "utf8"));
      }

      const preserved = await database.query<{ document_hash: string }>(
        `select document_hash from simulora.state_revisions
          where id = '00000000-0000-4000-8000-000000000208'`,
      );
      expect(preserved.rows[0]?.document_hash).toBe(legacyHash);
      const databaseHash = await database.query<{ document_hash: string }>(
        `select encode(
           sha256(convert_to(simulora.canonical_jsonb_text($1::jsonb), 'UTF8')),
           'hex'
         ) as document_hash`,
        [JSON.stringify(edgeDocument)],
      );
      expect(databaseHash.rows[0]?.document_hash).toBe(contentHash(edgeDocument));
      expect(databaseHash.rows[0]?.document_hash).not.toBe(legacyHash);
      await database.exec(`
        begin;
        insert into simulora.branches
          (id, continuity_id, name, status, parent_branch_id, fork_source_commit_id,
           created_by_account_id, idempotency_key)
        values ('00000000-0000-4000-8000-000000000209',
                '00000000-0000-4000-8000-000000000205', 'Legacy-compatible fork',
                'INITIALIZING', '00000000-0000-4000-8000-000000000206',
                '00000000-0000-4000-8000-000000000207',
                '00000000-0000-4000-8000-000000000201', 'legacy-compatible-fork');
        insert into simulora.world_commits
          (id, branch_id, parent_commit_id, kind, actor_account_id, state_revision_id,
           source_type, reason)
        values ('00000000-0000-4000-8000-000000000210',
                '00000000-0000-4000-8000-000000000209',
                '00000000-0000-4000-8000-000000000207', 'BRANCH_FORK',
                '00000000-0000-4000-8000-000000000201',
                '00000000-0000-4000-8000-000000000211', 'USER', 'Compatibility fork');
        insert into simulora.state_revisions
          (id, branch_id, commit_id, schema_version, document, document_hash)
        values ('00000000-0000-4000-8000-000000000211',
                '00000000-0000-4000-8000-000000000209',
                '00000000-0000-4000-8000-000000000210', 1,
                '${JSON.stringify(edgeDocument)}'::jsonb,
                '${databaseHash.rows[0]?.document_hash ?? ""}');
        insert into simulora.domain_events
          (id, branch_id, commit_id, event_type, payload, source_type, visibility_scope)
        values ('00000000-0000-4000-8000-000000000212',
                '00000000-0000-4000-8000-000000000209',
                '00000000-0000-4000-8000-000000000210', 'BRANCH_FORKED',
                '{"sourceBranchId":"00000000-0000-4000-8000-000000000206",
                  "sourceCommitId":"00000000-0000-4000-8000-000000000207"}'::jsonb,
                'USER', 'CONTINUITY_PRIVATE');
        commit;
      `);
    } finally {
      await database.close();
    }
  }, 15_000);
});
