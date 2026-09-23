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
      expect(result.rows).toEqual([{ phase: "IP-9", started: true }]);

      const state = createInitialState(lanternReachSeed, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const sqlJson = (value: unknown): string => JSON.stringify(value).replaceAll("'", "''");
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
        insert into simulora.world_drafts
          (world_id, row_version, document, document_hash)
        values (
          '00000000-0000-4000-8000-000000000102',
          1,
          '${sqlJson(lanternReachSeed)}'::jsonb,
          '${contentHash(lanternReachSeed)}'
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
          '${sqlJson(lanternReachSeed)}'::jsonb,
          '${contentHash(lanternReachSeed)}',
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
          '${sqlJson(state)}'::jsonb,
          '${contentHash(state)}'
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

      const documentGuards = await database.query<{ world_valid: boolean; state_valid: boolean }>(
        `select simulora.valid_world_revision_document('{}'::jsonb) as world_valid,
                simulora.valid_state_revision_document('{}'::jsonb) as state_valid`,
      );
      expect(documentGuards.rows[0]).toEqual({ world_valid: false, state_valid: false });

      const malformedWorlds = [
        {
          ...lanternReachSeed,
          characters: [{ ...lanternReachSeed.characters[0]!, motives: [123] }],
        },
        { ...lanternReachSeed, objectives: [123] },
        {
          ...lanternReachSeed,
          characters: [{ ...lanternReachSeed.characters[0]!, sourceAssetId: "not-a-uuid" }],
        },
      ];
      for (const document of malformedWorlds) {
        const result = await database.query<{ valid: boolean }>(
          "select simulora.valid_world_revision_document($1::jsonb) as valid",
          [JSON.stringify(document)],
        );
        expect(result.rows[0]?.valid).toBe(false);
      }
      for (const document of [
        { ...state, worldClock: { ...state.worldClock, turn: "0" } },
        { ...state, objectives: [123] },
        { ...state, resources: { lanternOil: "full" } },
      ]) {
        const result = await database.query<{ valid: boolean }>(
          "select simulora.valid_state_revision_document($1::jsonb) as valid",
          [JSON.stringify(document)],
        );
        expect(result.rows[0]?.valid).toBe(false);
      }

      await expect(
        database.exec(`
          insert into simulora.return_orientation_projections
            (branch_id, source_head_commit_id, payload, status, rebuilt_at)
          values (
            '00000000-0000-4000-8000-000000000106',
            '00000000-0000-4000-8000-000000000107',
            '{"continuity":{"id":"00000000-0000-4000-8000-000000000999"}}'::jsonb,
            'FRESH',
            now()
          )
        `),
      ).rejects.toThrow(/payload identity must match/);

      await database.exec(`
        insert into simulora.accounts (id, eligibility)
        values ('00000000-0000-4000-8000-000000000109', 'ADULT')
      `);
      await expect(
        database.exec(`
          insert into simulora.continuities
            (id, owner_account_id, world_revision_id, status)
          values (
            '00000000-0000-4000-8000-000000000110',
            '00000000-0000-4000-8000-000000000109',
            '00000000-0000-4000-8000-000000000104',
            'INITIALIZING'
          )
        `),
      ).rejects.toThrow(/requires (explicit|active participant) access/);
      await database.exec(`
        insert into simulora.world_access_grants (world_id, account_id, role, status)
        values (
          '00000000-0000-4000-8000-000000000102',
          '00000000-0000-4000-8000-000000000109',
          'VIEWER',
          'ACTIVE'
        )
      `);
      await expect(
        database.exec(`
          insert into simulora.continuities
            (id, owner_account_id, world_revision_id, status)
          values (
            '00000000-0000-4000-8000-000000000110',
            '00000000-0000-4000-8000-000000000109',
            '00000000-0000-4000-8000-000000000104',
            'INITIALIZING'
          )
        `),
      ).rejects.toThrow(/requires active participant access/);
      await database.exec(`
        update simulora.world_access_grants
           set role = 'PARTICIPANT'
         where world_id = '00000000-0000-4000-8000-000000000102'
           and account_id = '00000000-0000-4000-8000-000000000109';
        insert into simulora.continuities
          (id, owner_account_id, world_revision_id, status)
        values (
          '00000000-0000-4000-8000-000000000110',
          '00000000-0000-4000-8000-000000000109',
          '00000000-0000-4000-8000-000000000104',
          'INITIALIZING'
        );
      `);

      await expect(
        database.exec(`
          update simulora.branches
             set status = 'INITIALIZING'
           where id = '00000000-0000-4000-8000-000000000106'
        `),
      ).rejects.toThrow(
        /Active Branch lifecycle cannot return to initialization|ACTIVE Continuity requires its Branch to remain active with complete heads/,
      );
    } finally {
      await database.close();
    }
  }, 15_000);

  it("upgrades prior-schema databases containing several unresolved ordinary Actions", async () => {
    const database = new PGlite();
    try {
      const migrationFiles = (await readdir(path.resolve("db/migrations")))
        .filter((file) => file.endsWith(".sql"))
        .sort();
      for (const file of migrationFiles.slice(0, 25)) {
        await database.exec(await readFile(path.resolve("db/migrations", file), "utf8"));
      }
      const validState = createInitialState(lanternReachSeed, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const serializedState = JSON.stringify(validState).replaceAll("'", "''");
      await database.exec(`
        insert into simulora.accounts (id, eligibility)
        values ('00000000-0000-4000-8000-000000000301', 'ADULT');
        insert into simulora.worlds (id, owner_account_id, title)
        values ('00000000-0000-4000-8000-000000000302',
                '00000000-0000-4000-8000-000000000301', 'Upgrade fixture');
        insert into simulora.authoring_validation_runs
          (id, world_id, draft_row_version, outcome, findings)
        values ('00000000-0000-4000-8000-000000000303',
                '00000000-0000-4000-8000-000000000302', 1, 'VALID', '[]'::jsonb);
        insert into simulora.world_revisions
          (id, world_id, revision_number, source_draft_row_version, document, document_hash,
           validation_run_id)
        values ('00000000-0000-4000-8000-000000000304',
                '00000000-0000-4000-8000-000000000302', 1, 1, '{}'::jsonb,
                '${contentHash({})}', '00000000-0000-4000-8000-000000000303');
        insert into simulora.continuities
          (id, owner_account_id, world_revision_id, status)
        values ('00000000-0000-4000-8000-000000000305',
                '00000000-0000-4000-8000-000000000301',
                '00000000-0000-4000-8000-000000000304', 'INITIALIZING');
        insert into simulora.branches (id, continuity_id, name, status)
        values ('00000000-0000-4000-8000-000000000306',
                '00000000-0000-4000-8000-000000000305', 'Original path', 'INITIALIZING');
        insert into simulora.world_commits
          (id, branch_id, kind, actor_account_id, state_revision_id)
        values ('00000000-0000-4000-8000-000000000307',
                '00000000-0000-4000-8000-000000000306', 'CONTINUITY_INITIALIZED',
                '00000000-0000-4000-8000-000000000301',
                '00000000-0000-4000-8000-000000000308');
        insert into simulora.state_revisions
          (id, branch_id, commit_id, schema_version, document, document_hash)
        values ('00000000-0000-4000-8000-000000000308',
                '00000000-0000-4000-8000-000000000306',
                '00000000-0000-4000-8000-000000000307', 1,
                '${serializedState}'::jsonb, '${contentHash(validState)}');
        update simulora.branches
           set head_commit_id = '00000000-0000-4000-8000-000000000307',
               head_state_revision_id = '00000000-0000-4000-8000-000000000308', status = 'ACTIVE'
         where id = '00000000-0000-4000-8000-000000000306';
        update simulora.continuities
           set active_branch_id = '00000000-0000-4000-8000-000000000306', status = 'ACTIVE'
         where id = '00000000-0000-4000-8000-000000000305';
        insert into simulora.actions
          (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
           expected_head_commit_id, participation_expectation, intent, status)
        select ('00000000-0000-4000-8000-' || lpad(ordinal::text, 12, '0'))::uuid,
               '00000000-0000-4000-8000-000000000301',
               '00000000-0000-4000-8000-000000000305',
               '00000000-0000-4000-8000-000000000306', 'PARTICIPATE',
               'legacy-pending-' || ordinal,
               '00000000-0000-4000-8000-000000000307',
               '{"initiativeMode":"GUIDED","structureMode":"OPEN_ENDED"}'::jsonb,
               'Legacy unresolved Action ' || ordinal, 'ACKNOWLEDGED'
          from generate_series(401, 406) ordinal;
        update simulora.actions set status = 'GENERATING'
         where idempotency_key in ('legacy-pending-402', 'legacy-pending-403',
                                   'legacy-pending-404', 'legacy-pending-405',
                                   'legacy-pending-406');
        update simulora.actions set status = 'VALIDATING'
         where idempotency_key in ('legacy-pending-403', 'legacy-pending-404',
                                   'legacy-pending-405');
        update simulora.actions set status = 'AWAITING_CONFIRMATION'
         where idempotency_key in ('legacy-pending-404', 'legacy-pending-405');
        update simulora.actions set status = 'COMMITTING'
         where idempotency_key = 'legacy-pending-405';
        update simulora.actions set status = 'FAILED_RECOVERABLE'
         where idempotency_key = 'legacy-pending-406';
      `);

      for (const file of migrationFiles.slice(25)) {
        await database.exec(await readFile(path.resolve("db/migrations", file), "utf8"));
      }
      const result = await database.query<{ status: string; count: number }>(`
        select status, count(*)::integer as count
          from simulora.actions
         group by status order by status
      `);
      expect(result.rows).toEqual([
        { status: "ACKNOWLEDGED", count: 1 },
        { status: "CONFLICT", count: 5 },
      ]);
      await expect(
        database.exec(`
          insert into simulora.actions
            (id, actor_account_id, continuity_id, branch_id, operation_type, idempotency_key,
             expected_head_commit_id, participation_expectation, intent, status)
          values ('00000000-0000-4000-8000-000000000407',
                  '00000000-0000-4000-8000-000000000301',
                  '00000000-0000-4000-8000-000000000305',
                  '00000000-0000-4000-8000-000000000306', 'PARTICIPATE',
                  'post-upgrade-pending', '00000000-0000-4000-8000-000000000307',
                  '{"initiativeMode":"GUIDED","structureMode":"OPEN_ENDED"}'::jsonb,
                  'Should be fenced', 'ACKNOWLEDGED')
        `),
      ).rejects.toThrow(/unique|duplicate/i);
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

      const validState = createInitialState(lanternReachSeed, {
        initiativeMode: "GUIDED",
        structureMode: "OPEN_ENDED",
      });
      const sqlJson = (value: unknown): string => JSON.stringify(value).replaceAll("'", "''");
      // Simulate the legacy pre-G5 serializer with a valid document whose key
      // order differs from the canonical database representation.
      const legacySerialization = JSON.stringify(validState);
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
                '${sqlJson(validState)}'::jsonb, '${legacyHash}');
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
        [JSON.stringify(validState)],
      );
      expect(databaseHash.rows[0]?.document_hash).toBe(contentHash(validState));
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
                '${sqlJson(validState)}'::jsonb,
                '${contentHash(validState)}');
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
