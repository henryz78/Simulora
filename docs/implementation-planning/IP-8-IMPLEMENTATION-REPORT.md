# IP-8 Trust / Lifecycle Implementation Report

**State:** `REPAIRED IMPLEMENTATION CANDIDATE / G8 PENDING`

**Candidate behavior commit:** `686b93c4a2964aa95eaef41966347bad74f2988e`

**Scope:** the frozen IP-8 roadmap envelope only. This candidate implements
IP-8.1–IP-8.6 and IP-8.9: eligibility/policy outcomes, ownership/grants/
visibility explanations, consent and material-change notices, zero-cost usage
quote/reservation/ledger, selected-scope export with manifest/checksums,
deletion proposal/tombstone/mutation blocking/purge status, and audit/appeal
seams. IP-8.7 staged import and IP-8.8 bounded sharing remain explicitly
deferred, as allowed by the original roadmap.

The candidate does not enable a production live model, add an autonomous
scheduler, redesign long-term memory, add an effect DSL or truth model, alter
World/Revision/Continuity/authority contracts, or depend on the frozen
Prototype. Creator and lifecycle operations remain progressive, reviewable and
bound to existing World Revision and Continuity lifecycles.

## Implementation

- Added versioned governance contracts and a `GovernanceService` port.
- Added API routes for account/policy, consents, access explanations, product
  changes, appeals, usage quote/reservation/settlement/release/ledger, exports
  and artifacts, and deletion proposal/confirmation/status.
- Added migration `0040_ip8_trust_lifecycle.sql` for governance records,
  append-only usage/audit records, export jobs, deletion proposals, tombstones,
  mutation triggers and the `TOMBSTONED` Continuity state.
- Added the responsive Trust & lifecycle surface with access, consent,
  material-change, appeal, selected export and exact deletion review flows.
- Export artifacts are standard-library ZIPs containing selected owner data,
  a versioned manifest and SHA-256 checksums; other participants' private
  Continuities are excluded.
- Deletion confirmation is digest-, scope-freshness- and idempotency-bound;
  it revokes grants/exports, tombstones affected Continuities and blocks later
  Draft/Revision/Continuity/Action/Commit mutation.
- Corrected PostgreSQL consent UPDATE parameter binding and the migration
  trigger's table-specific `NEW.status` access.
- Added a mobile layout guard so long checksums cannot widen Trust cards past
  the 390×844 viewport.

## Verification

| Check | Result |
| --- | --- |
| Prettier format check | PASS |
| ESLint JSON-result check | PASS |
| Typecheck | PASS |
| Architecture check | PASS |
| Migration check | PASS, 40 migrations |
| Worker runtime startup/shutdown | PASS |
| Workspace production build | PASS (esbuild required the approved elevated run) |
| Default Vitest | 64 passed; 129 PostgreSQL-dependent tests skipped because `SIMULORA_DATABASE_URL` is absent |
| Full Playwright E2E + axe | 68/68 PASS, desktop Chromium and touch 390×844 |
| Dedicated IP-8 E2E + axe | 2/2 PASS, desktop Chromium and touch 390×844 |
| Real PostgreSQL IP-8 integration | NOT RUN locally; Docker and `SIMULORA_DATABASE_URL` unavailable |
| Independent review / G8 | PENDING; this report is not self-approval |

## Known boundaries

This evidence proves the bounded lifecycle envelope and local integration
contracts, not production deployment, live-provider quality, human enjoyment,
autonomous world progression, broad multi-Character development or complete
long-term memory. Real PostgreSQL CI remains required before G8 can close.

## Repair pass (independent review FAIL response)

The first candidate was reviewed by the independent reviewer and returned
`FAIL`. The repair below answers `I-1`–`I-6` and `M-1`–`M-2`; `B-1` stays with
CI, because real PostgreSQL is not reachable from the authoring machine and the
repository Action owns that verification.

| Finding | Repair |
| --- | --- |
| I-1 tombstone mutation | `assertMutableBranchWithClient` / `assertMutableContinuityWithClient` lock the Continuity and World rows and raise a stable `WORLD_TOMBSTONED` conflict on confirm, recoverable retry, recovery-point create/delete and Branch fork, instead of letting the trigger surface a generic 500. |
| I-2 unbound export | `createExport` requires an owned, `RESERVED`, `EXPORT`-profile reservation whose `action_key` is exactly `export:<idempotencyKey>`, and records it on `export_jobs.reservation_id`. |
| I-3 idempotency races | Usage reservation, appeal and export insertion are `on conflict do nothing` with a conflict-safe re-read; a reservation is recovered by action key before the quote's expiry is consulted, so an expired quote cannot strand a retry. |
| I-4 volatile artifacts | The process-local `LocalArtifactStorage` map and its port are gone. Artifacts live in `export_jobs.artifact_bytes`, the export snapshot runs in one `REPEATABLE READ` transaction, and download re-verifies SHA-256 against the stored checksum. |
| I-5 inert consent | `assertConsentActive` blocks authoring, Continuity, Action and recovery mutation while the newest decision for a consent type and scope is `WITHDRAWN`. Reads, access explanations, appeals, export and deletion stay open, and a re-grant at the same or a newer version restores authoring. |
| I-6 thin change notice | Product changes now carry `affectedScopes`, `effectiveAt` and `availableChoices` through the contract, the projection and the Trust surface. |
| M-1 idempotency transport | The IP-8 mutations accept the frozen contract's `Idempotency-Key` header; the body field still works, and a header that disagrees with the body is rejected rather than silently preferred. |
| M-2 purge wording | The deletion result states that a confirmed deletion tombstones and blocks the World, and that no purge worker runs in this phase. |

Migration `0041_ip8_trust_repairs.sql` is a successor to `0040`; `0040` is
unchanged.

### Repair verification

| Check | Result |
| --- | --- |
| Prettier format check | PASS |
| ESLint, JSON formatter, whole workspace | PASS, 0 errors, 0 warnings |
| Typecheck | PASS |
| Architecture check | PASS |
| Migration check | PASS, 41 migrations |
| Worker runtime startup/shutdown | PASS |
| Workspace production build | PASS, ordinary run, no elevation |
| Default Vitest | 65 passed; 130 PostgreSQL-dependent tests skipped because `SIMULORA_DATABASE_URL` is absent |
| Full Playwright E2E + axe | 68/68 PASS, desktop Chromium and touch 390×844, normal exit |
| Migration contract suite, PGlite | PASS, all 41 migrations apply to an empty database |
| Repaired SQL against PGlite | 10/10 PASS: latest-decision consent gate, both tombstone guards, reservation binding, conflict-safe reservation insert, `bytea` artifact round trip, zero-row finalize on a tombstoned World, product-change fields, `REPEATABLE READ` at transaction start |
| `0040` → `0041` upgrade against PGlite | PASS: pre-`0041` export rows stay readable with no reservation and no stored artifact, the seeded IP-8 change is backfilled to its original publication time, other changes take non-empty defaults, foreign keys survive |
| Real PostgreSQL IP-8 integration | NOT RUN locally; Docker and `SIMULORA_DATABASE_URL` unavailable, delegated to the repository Action |
| Independent re-review / G8 | PENDING; this report is not self-approval |

The PGlite checks are real PostgreSQL semantics in WebAssembly, so they prove
the new SQL parses and behaves as intended, but they are single-connection and
do not replace the Action's concurrent, networked PostgreSQL run.

Local tooling note: `pnpm lint` still fails in this environment with
`TypeError: chalk.underline is not a function` inside ESLint's stylish
formatter. That is an environment defect, not a lint finding; the same run with
`--format json` reports zero errors and zero warnings.

G8 stays `PENDING`. It closes only when the same independent reviewer passes
the repair commit and the Action's real PostgreSQL evidence is attached.

## Second repair pass (first real PostgreSQL CI evidence)

CI run `35497372451` and `35497715141` were the first runs that ever contained
IP-8, because neither the first candidate nor its handoff had been pushed. Real
PostgreSQL immediately found three defects that no local check could reach.

| Defect | Where it came from | Repair |
| --- | --- | --- |
| `pnpm db:verify` failed with `IP-7 metadata verification failed` | `0040` moves the recorded phase to IP-8, but the migration recovery rehearsal still asserted IP-7. Every earlier IP-N behavior commit moved that assertion; the first IP-8 candidate did not. | `verify.ts` asserts IP-8, and the unused `implementationPhase` constant follows. |
| Both IP-8 PostgreSQL tests failed with `Active Continuity lifecycle cannot return to initialization` at `confirmDeletion` | `0014` froze the Continuity lifecycle so an ACTIVE Continuity could never leave ACTIVE. `0040` added `TOMBSTONED` to the status check but left that trigger alone, so **deletion confirmation had never worked against PostgreSQL**. | Successor `0042` allows `ACTIVE` → `TOMBSTONED` only, keeps `ACTIVE` → `INITIALIZING` blocked, keeps identity immutable, and makes a tombstone terminal. |
| Both `migration-upgrade` tests failed with `relation "simulora.account_consents" does not exist` | The consent gate added in the first repair pass queries an IP-8-only table on every core mutation, which breaks the prior-schema upgrade rehearsal that drives current code against a 0031 database. | The gate probes for the table once per repository and returns early when it is absent; on the current schema the behavior and the query count are unchanged. |

The rest of both IP-8 suites passed against PostgreSQL 17 before reaching the
deletion step, so the first pass's export reservation binding, expired-quote
reservation recovery, durable artifact read from a separate pool, in-transaction
export read and consent gating are confirmed on real PostgreSQL. `126/130`
PostgreSQL tests passed in run `35497715141`; the four failures were the two
defects above.

`0042` was also rehearsed against PGlite: a confirmed deletion tombstones an
ACTIVE Continuity, a tombstone cannot be reactivated, an ACTIVE Continuity still
cannot return to initialization, and Continuity identity stays immutable. The
consent probe reports absent on a pre-`0040` schema and present on the current
one.

This is why G8 could not have closed on local evidence. It stays `PENDING` until
a green CI run and an independent re-review of the final repair commit.
