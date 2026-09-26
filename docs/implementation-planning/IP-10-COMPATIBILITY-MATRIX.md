# IP-10.4 Compatibility Matrix

**Date:** 2026-09-25 · **Scope:** Roadmap IP-10.4 · **Status:** engineering
record; it passes no Gate.

This matrix compares the **release candidate** (current `main`) with the
**prior approved baseline**, the G9 release
`c812d6c6d29be86be3557a00b4866b5d01f0499f`.

**What was checked.** Every contract and schema difference between the two
was read from `git diff c812d6c HEAD`. Each row states how it was exercised.

**Honesty rule.** A row is `VERIFIED` only when a CI step or test exercised
it on real PostgreSQL. `ANALYSED` means the conclusion comes from reading
the code or diff, with no rehearsal. `NOT SUPPORTED` and `NOT REHEARSED` are
stated plainly and never counted as PASS.

## 1. What changed since the baseline

| Area | Change | Nature |
|---|---|---|
| Schema | Migrations `0048_mgc1_must_gap_closure.sql` (MGC-1) and `0049_branch_switch_no_effect_terminal.sql` (Branch-switch repair) | Successor-only. No earlier file is edited; checksums are pinned in the ledger. |
| World document | Optional relationship `protection` / `scale` / `initialState`; optional `threads` and `constraints` | Additive. Documents without these fields validate exactly as before. |
| State document | Optional relationship `state`; optional structured `threads` | Additive, and present only when the World declares them. |
| Action request | `requestedEffect` gains `RELATIONSHIP_EFFECT` and `THREAD_EFFECT`; optional `targetThreadId` | Additive. Earlier values and shapes are unchanged. |
| Orientation and state responses | Optional relationship `state` and `threads` | Additive, and emitted only for Worlds that declare them. |
| Change Trace response | MGC-1 Events now carry a readable `summary` and the optional `targetId` | Values only. The response shape is unchanged. |
| Export package | None | Manifest `schemaVersion: 1`, same file layout and checksums. |

## 2. Matrix

| # | Path | Result | Evidence |
|---|---|---|---|
| C1 | **Migration forward** from an empty database to the release candidate | `VERIFIED` | CI step *Run migration against empty and prior PostgreSQL schema*: migrate twice, then `db:verify`. `migration-contract` › "applies from an empty PostgreSQL-compatible database". |
| C2 | **Migration forward** from the approved G9 release, with data written by that release's own code | `VERIFIED` | CI step *Rehearse upgrade from the approved release and rollback by restore* (§3). First green in CI `36198101564`. |
| C3 | **Migration forward** across earlier phase boundaries with live, unresolved work | `VERIFIED` | `migration-contract` › "upgrades prior-schema databases containing several unresolved ordinary Actions"; "preserves populated pre-G5 rows…". `migration-upgrade` › sealed L3 proposal across 0031→0032; pending proposal and active Restore review across 0047→0048. |
| C4 | **Backup → restore** into an isolated database, on the release candidate | `VERIFIED` | CI step *Rehearse backup restore into an isolated database*. Every drill check passes, the restored ledger re-applies nothing, and a tampered copy fails. Runbook: [IP-9 Runbooks](IP-9-RUNBOOKS.md) §1. |
| C5 | **Rollback by restore:** the pre-upgrade backup of the G9 release restores identically under that release's own drill | `VERIFIED` | Same CI step as C2. The prior drill runs from a git worktree of `c812d6c`. |
| C6 | Prior release's **API and worker serving** from the restored backup | `NOT REHEARSED` | Only the prior release's drill script reads the restored copy; its containers were not started against it. |
| C7 | **In-place schema downgrade** (run G9 code on the upgraded schema) | `NOT SUPPORTED` | Migrations are successor-only, with no down migrations. Rollback is by restoring the pre-upgrade backup (C5), so writes made after the upgrade are lost unless replayed. The acceptable data-loss window is the external DR decision. |
| C8 | **Upgraded copies agree:** source and restored backup upgraded separately | `VERIFIED` | Same CI step as C2. The only difference is `app_meta.schema_migrations`, that is, the `applied_at` timestamps; names and checksums match. |
| C9 | **Release candidate writes** to an upgraded database | `VERIFIED` | Same CI step as C2: the current `restore:drill --seed` on the upgraded source. |
| C10 | **API, request side:** clients built for G9 send requests the release candidate accepts | `ANALYSED` | Every request change is an added optional field or enum value (§1). No test replays G9 client requests. |
| C11 | **API, response side:** a G9 web bundle reads release-candidate responses | `ANALYSED — PARTIAL` | Several response schemas are `.strict()`. For Worlds **without** MGC-1 fields the new optional keys are omitted, so G9 parsing succeeds. For Worlds **with** them, a cached G9 bundle would reject relationship `state` / `threads` as unknown keys. Web and API ship as one release, so this affects only a stale browser tab across a deploy. It has not been rehearsed. |
| C12 | **API, same release:** release-candidate web ↔ API ↔ worker ↔ PostgreSQL | `VERIFIED` | Real-stack journeys in the container step, including E2E-CONTINUITY-IMPACT (desktop and 390×844), and the browser/device matrix. |
| C13 | **Export format:** a release-candidate package keeps the G9 layout | `VERIFIED` (layout) / `ANALYSED` (content) | Manifest `schemaVersion: 1` and the file layout are unchanged since `c812d6c`; `ip9-object-storage`, `ip10-invariants` INV-12 and real-stack export check them. The World and State JSON inside may now carry the additive MGC-1 fields. |
| C14 | **Export consumption:** a G9-era package imported by the release candidate, or the reverse | `NOT APPLICABLE` | No import path exists; PR-016 is not selected. Packages are owner exit copies, and no in-product reader depends on the format. |
| C15 | **Object storage:** exports staged or stored by G9 remain downloadable after the upgrade | `ANALYSED` | Export tables and storage states are unchanged since 0044, and 0048/0049 do not touch them. Pre-IP-9 inline exports stay reachable (`ip9-object-storage` › "migrates a pre-IP-9 inline artifact into the object store without losing access"). No cross-release object rehearsal was run. |
| C16 | **Model profile compatibility** across the upgrade | `ANALYSED` | `livePromptVersion` 6 (MGC-1) applies only to new generation. Earlier Actions keep their recorded evidence (0048 binds the effect-context digest only when an Action can use it). No real provider is enabled. |

## 3. The upgrade and rollback rehearsal (C2, C5, C8, C9)

The step runs in `.github/workflows/ci.yml`, with `PRIOR_RELEASE` set to
`c812d6c`.

1. Check the G9 release out into a git worktree and install it.
2. G9 code migrates a fresh database and seeds it through its own repository
   and object store (`restore:drill --seed`).
3. Take a `pg_dump` / `pg_restore` backup into a second database.
4. **Rollback check:** G9's own drill compares the source with the backup and
   must pass every check.
5. **Forward:** both copies run the release-candidate migrations and
   `db:verify`.
6. The release-candidate drill compares the upgraded copies. Only the ledger
   timestamps may differ, and a `psql` diff confirms that the ledger names and
   checksums match.
7. The release candidate seeds on top of the upgraded source.

**Result:** green in CI `36198101564` (`7964e7c`), and again on every later
push that includes the step.

## 4. What stays outside engineering

- **Rollback window:** the acceptable window between the pre-upgrade backup
  and a rollback, and the target recovery time, are the external retention and
  DR decisions (G10 §20).
- **Production mechanics:** production backup tooling and point-in-time
  recovery depend on the cloud vendor and region decision.
- **Stale browser tabs (C11):** handling them across a deploy (for example
  forcing a reload) would be a product behavior change. It is recorded here,
  not made in IP-10.
