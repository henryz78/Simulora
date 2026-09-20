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

### Third defect, found once the first two were cleared

With the consent probe in place the prior-schema rehearsal got further and
reached a fourth defect from the first candidate: `686b93c` widened
`startContinuity` so an explicitly granted participant can start a Continuity,
which references `simulora.world_access_grants` from `0026`. The second
rehearsal builds a populated `0025` database on purpose, so that relation does
not exist there and `startContinuity` failed.

The rehearsal already adds the few forward-compatible columns current code
needs while keeping every `0026`-era guard out. The grants lookup is the same
kind of affordance, so the fixture now creates the empty table and nothing
else: an empty grants table is exactly the owner-only behaviour of a `0025`
schema, and none of `0026`'s validation functions come with it. This was
rehearsed against PGlite — the fixture applies on `0025`, the IP-8 participant
clause runs, no `0026` guard leaks in, and the table is empty.

Run `35498286027` reached `129/130` PostgreSQL tests passing, with both IP-8
suites green; this was the single remaining failure.

### Green CI evidence

Run `35498511891` on `3136075` passed end to end against PostgreSQL 17:

| CI step | Result |
| --- | --- |
| Migration against an empty and a prior PostgreSQL schema | PASS; 42 migrations, ledger and recovery rehearsal passed |
| Authoritative PostgreSQL integration suites | PASS, 130/130 in 11 files, including both IP-8 suites and both prior-schema upgrade rehearsals |
| `pnpm check` (format, lint, typecheck, architecture, migrations, test, build, runtime) | PASS; 195/195 tests, 42 migrations, worker runtime startup/shutdown |
| API and worker container build and smoke | PASS |
| Desktop and 390×844 browser checks with axe | PASS, 68/68 |

The stylish-formatter `chalk.underline` crash is local to the authoring
machine; `pnpm lint` passed on CI.

So B-1 is closed: the frozen IP-8 envelope now holds against real, networked,
concurrent PostgreSQL, and the tombstone, export-reservation, artifact
durability, idempotency and consent repairs are proven there rather than only
in WebAssembly.

G8 still stays `PENDING`. Real CI evidence is necessary but not sufficient: the
protocol requires the same independent reviewer to pass the repair commits, and
the implementing agent does not approve its own Gate.

## Re-review pass

The reviewer the user originally designated, `/root/ip8_reviewer_new`, belongs to
a different machine and could not be reached from here. At the user's direction
a review agent was run in its place. **This is weaker independence than the
protocol asks for**: the implementing agent wrote that reviewer's prompt and it
ran inside the implementing session. The prompt gave it the original FAIL list
as its agenda and told it to treat every report in this repository as a claim to
be checked, but the limitation is real and is recorded here rather than papered
over.

Its verdict was `PASS WITH ISSUES`, `0B / 2I / 1M`. It confirmed B-1 and
I-1 through I-6 CLOSED against the real CI run, ran the local suites itself
(including a full `pnpm test:e2e` to normal exit) and did its own PGlite work.
It also judged the `world_access_grants` fixture addition in `3136075` a
legitimate forward-compatibility affordance rather than a test bent around
broken code, and confirmed `startContinuity`'s participant clause is inside the
frozen `API_SECURITY_AND_OPERATIONS.md` §5.1 role, not scope creep.

Its three findings were each re-verified before being acted on.

| Finding | Independently re-checked | Action |
| --- | --- | --- |
| M-1 partial: `POST /v1/usage/quotes/:quoteId/reservations` never read the `Idempotency-Key` header | Correct. The route parsed `request.body` directly. | `bodyWithIdempotencyHeader` now takes the target field, and the reservation route fills `actionKey` from the header. Covered by a new API test: header-only, body-only, and a disagreeing header rejected with 422. |
| NEW-1 important: the consent gate orders by recency, not by version | The stated reproduction is **wrong**. Re-withdrawing an already-withdrawn version does not re-block, because `setConsent` leaves `updated_at` alone when the decision is unchanged; the reviewer inserted rows directly and bypassed that. Driven through the real `setConsent` statements the result is `blocked = false`. A different, reachable case does exist: with two versions granted, withdrawing the older one blocks. | The logic is kept and the over-claiming comment is corrected. Recency is the rule the schema can actually support: `version` is free text with no ordering contract, so `"V10"` sorts below `"V2"` and must not decide precedence. The `version desc` tiebreak is replaced with `id desc` so nothing hints at version ordering, and a PostgreSQL test now pins all four multi-version cases. A withdrawal blocking while an older version is still granted is the conservative reading of the user's last stated decision, and is now documented as such rather than left implicit. |
| NEW-2 minor: `confirmRestore` folded a tombstoned World into `RESTORE_REVIEW_STALE` | Correct. The path was already safe - it refuses to mutate - but named the wrong cause. | `confirmRestore` now calls the same tombstone guard as the other five paths and returns `WORLD_TOMBSTONED`. **This one ships without a dedicated test.** Reaching it needs a live ACTIVE restore proposal, which needs a full action and commit cycle; that fixture is out of proportion to an error-code correction. The guard is the helper three other paths already exercise against real PostgreSQL in the same suite. |

The `version desc` to `id desc` change is behaviour-visible only when two rows
for one consent type and scope share an `updated_at`, which `setConsent` cannot
produce because each write is its own transaction.

Local verification after this pass: format, typecheck, architecture, migrations
(42), runtime, ESLint 0/0, `pnpm build`, Vitest 66 passed with 131 PostgreSQL
tests skipped, and Playwright 68/68 to a normal exit.

## Second re-review pass

The same review agent was asked to re-check its three findings, and was told
explicitly that its NEW-1 reproduction looked wrong and that it should re-derive
that itself rather than accept the correction. Verdict `PASS WITH ISSUES`,
`0B / 1I / 2M`.

It withdrew NEW-1: re-running through the real `setConsent` and `createWorld`
methods rather than raw SQL, repeating an older withdrawal leaves the account
unblocked, so its original harness had manufactured a state the application
cannot reach. It reclassified the remaining, genuinely reachable case
(withdrawing an older still-granted version blocks) as Minor and accepted the
recency rule with corrected documentation, noting it fails closed. It confirmed
M-1 resolved, accepted the NEW-2 coverage judgement, and confirmed the diff
leaves B-1 and I-1 through I-6 undisturbed.

Pressing on the lock-ordering question it was asked surfaced a **real regression
introduced by the first repair pass**, which neither reviewer had examined:

`confirmDeletion` locks `simulora.worlds` first and only later write-locks the
affected Continuities. The tombstone guard added in `2c22446` started from the
Continuity and took `for update of c, w`, locking the Continuity before the
World. That is a lock-order inversion on the same two tables across six callers.
PostgreSQL resolves it by aborting one side with `40P01`, and nothing mapped
that code, so it would have surfaced as a generic `INTERNAL_ERROR` 500 — exactly
the failure class I-1 exists to prevent. The reviewer could not execute the race
(PGlite is single-connection) and reported it as structurally founded but
unverified.

Two repairs, and the verification the reviewer asked for:

- `assertMutableContinuityWithClient` now locks the World first and the
  Continuity second, matching `confirmDeletion`. `assertMutableBranchWithClient`
  resolves the owning Continuity with an unlocked lookup and then delegates, so
  all six callers take the two locks in one order.
- `transaction` translates `40P01` and `40001` into a stable
  `CONCURRENT_UPDATE_RETRY` conflict, which the API maps to 409. This also
  covers the `REPEATABLE READ` serialization failures `createExport` can raise —
  another unmapped 500 that the first pass left behind.
- A new PostgreSQL test races `confirmDeletion` against `createRecoveryPoint`
  and `forkBranch` on the same World, asserts no deadlock is detected, asserts
  every losing mutation names a stable conflict rather than an internal error,
  and asserts the deletion is still authoritative. This is the real-concurrency
  test the reviewer recommended, and it runs on CI where PostgreSQL is real.

The reviewer's remaining Minor — five pre-existing pre-IP-8 routes still carry
idempotency only in the body — is recorded and **not** fixed here. Those routes
were accepted under G3 to G6, are untouched by this work, and changing them is
outside the frozen IP-8 envelope. The frozen `Idempotency-Key` header contract
is therefore honoured for the four IP-8 routes and still not honoured API-wide.

Local verification after this pass: format, typecheck, architecture, migrations
(42), runtime, ESLint 0/0, build, Vitest 66 passed with 132 PostgreSQL tests
skipped, Playwright 68/68 to a normal exit, and a PGlite check that the split
guard statements plan correctly and that `for update of w` is honoured.

## Third re-review pass: FAIL, and it was right

The reviewer was asked to attack the lock-order repair rather than confirm it.
It returned **FAIL**, `0B / 2I / 2M`, and the first finding is a real miss by the
implementing agent.

**The inversion survived in `confirmRestore`.** The guard was added *after* that
function's own pre-existing `select ... from simulora.continuities ... for
update`, so its end-to-end order was still Continuity then World. Five of six
callers were fixed; the sixth was the very function the finding started in. The
`2d1eb70` commit message and the previous section of this report both claimed
"every caller takes the two locks in one order", and that claim was false. The
guard call now runs before the peek, so the peek re-locks a row the transaction
already holds. The claim is only true as of this pass.

**The concurrency test was close to theatre.** The reviewer judged that
`Promise.allSettled` over three operations forces no interleaving, that the
assertion is near-tautological once both sides order locks the same way, and
that it never exercised `confirmRestore` at all, so it could not have caught the
defect above. All three points hold. It has been replaced.

The replacement is deterministic. One connection holds the `worlds` row lock -
which is the first lock `confirmDeletion` takes - and each guarded path is then
started and must still be pending. Pending alone proves nothing, because an
inverted path would also wait there while holding the Continuity. So a third
connection probes the Continuity with `for update nowait`. A granted row lock
lives in the tuple header and never appears in `pg_locks`, so `nowait` is the
detector: `55P03` means the blocked path already holds the Continuity, which is
exactly the inversion. The probe fails on the pre-repair ordering and passes on
the repaired one, and it covers `confirmRestore` with a live `ACTIVE` restore
proposal built from a real Action and Commit - the fixture judged disproportionate
for an error-code correction two passes ago, which is proportionate now that a
lock-ordering property depends on it.

An earlier draft of this test asserted on `pg_locks` instead. That assertion was
vacuous for the same tuple-header reason and was removed before this pass shipped.

The reviewer's Minor on observability is also taken: `transaction` now reports
the original SQLSTATE through `onTransactionRetryConflict` before flattening
`40001` and `40P01` to a 409, so a rising rate of either stays traceable.

Its remaining Minor is recorded and not acted on: the sweep for other lock-order
pairs was targeted at the tables `confirmDeletion` touches, not an exhaustive
enumeration of every locking statement in the file, so the absence of further
inversions is **unverified by completeness** rather than established.

Local verification after this pass: format, typecheck, architecture, migrations
(42), runtime, ESLint 0/0, build, Vitest 66 passed with 132 PostgreSQL tests
skipped, Playwright 68/68 to a normal exit.

### What these three review rounds say about the evidence

Each round of pressure found something the previous round missed, and two of the
three findings were regressions introduced by the repairs themselves. Green CI
was present for every one of those defects. That is the honest summary: the
suites prove what they cover, and coverage of concurrent behaviour reached its
current state by being challenged, not by design.

### The new test's own first run failed

The deterministic test imported `Client` from `pg` directly. `pg` belongs to
`@simulora/database`, not to the root workspace, so under pnpm's strict layout
CI could not resolve it and the whole IP-8 suite failed to collect - `0 test`,
not a failed assertion. No local run caught it, because this machine's
`node_modules` hoists more loosely and resolved the import fine. The holder and
probe connections now come from a second pool through `createDatabasePool`,
which the file already imported.

CI run `35529474124` on `129d61e` is green: PostgreSQL 132/132 including
`makes every guarded path take the World lock before the Continuity lock`,
`pnpm check` 198/198, container smoke, browser 68/68. The test takes about three
seconds, which is the three deliberate blocking waits, so it is doing the work
rather than passing through.

## Fourth and fifth re-review passes: PASS

The fourth pass was asked to finish what it had left unverified and to test a
claim rather than accept it. It returned **PASS**, `0B / 0I / 2M`.

It re-derived the lock sequence of all six guard callers from source and
confirmed `confirmRestore` is fixed, so the "one order across all callers"
claim is true for the first time. On whether the new test can detect an
inversion it was explicit about the limit of its own evidence: the mechanism is
sound - `FOR UPDATE OF w` locks only the named alias, and a granted row lock is
invisible in `pg_locks`, so `for update nowait` raising `55P03` is the correct
detector - but it could not execute the reverted code, because PGlite serializes
everything through one backend and cannot host two genuinely contending
transactions. It corroborated with CI timing instead: the test takes 3246ms and
2483ms across the two runs, which is the three deliberate blocking waits.

It also completed the lock-order sweep to a stated depth and found no second
inversion within it, while saying plainly which pairs it did not cross-check.
That remains **unverified by completeness** rather than clean.

Its two Minors are now fixed, and the fifth pass confirmed them **PASS**,
`0B / 0I / 1M`:

- `onTransactionRetryConflict` was exported but never called, so the `40001` and
  `40P01` observability repair logged nothing and only read as closed. The
  reviewer found the seam shape was nonetheless right, because
  `check-architecture.ts` forbids `packages/database` from importing
  `@simulora/observability`. Both composition roots now fill it.
- The `pg` import class had no local safeguard. `check-architecture.ts` now
  fails when a file under `tests/` imports a package the root `package.json`
  does not declare. Verified by reintroducing the import and watching the check
  fail by name, then pass again once removed.

The remaining Minor is recorded and not fixed: `scripts/product-reality-spike.ts`
builds its own pool and repository without going through either composition
root, so a deadlock or serialization abort inside that manual script stays
untraced. It is not a running service.

### Standing state

`IP-8` behaviour is at `9fce1a8`. Real PostgreSQL CI has been green since
`129d61e`. **G8 is PENDING and is not closed by this report.** Five review
passes were run by a substitute reviewer whose prompt the implementing agent
wrote and which ran inside the implementing session, which is weaker
independence than the protocol requires. Whether that is sufficient to close G8
is the user's decision, not this agent's.

Two facts belong with that decision. Three of the defects found across these
passes were regressions introduced by the repairs themselves, and every one of
them coexisted with green CI. And each round of pressure found something the
previous round had missed, which means the coverage of concurrent behaviour
reached its present state by being challenged rather than by design.
