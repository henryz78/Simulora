# IP-9 Independent Review — Model, Accessibility and Reliability Hardening

**Reviewer:** independent Sonnet 5 subagent, fresh context, spawned solely to review this
Gate. I did not write any of this code and had no prior context beyond the review brief.
**Limitation to disclose:** I run on the same vendor/session tooling family (Claude/Anthropic)
as whatever produced the implementation and its own report. I have no access to a
differently-sourced reviewer. I verified claims against the actual diff, code, tests and a
real CI run rather than trusting the implementer's report, but this is not independence from
the tooling vendor, only independence of context and authorship within this conversation.

**Exact SHA reviewed:** `b0f12ab7b64e3c0335e6c3b7a67e3855a8f2c61d` (current `main` HEAD).
**IP-9 starting point:** `a3e0b7e` on approved IP-8 behavior `666db383eeb413778f5b090f1b2089b93e31ef53`.
**Exact-SHA CI reviewed:** GitHub Actions run `35936816813` — confirmed via
`gh run view 35936816813 --json headSha,conclusion` that `headSha` equals
`b0f12ab7b64e3c0335e6c3b7a67e3855a8f2c61d` and `conclusion` is `success`. I downloaded the
full log (`gh run view 35936816813 --log`, 4628 lines) and inspected it directly rather than
trusting the implementer's summary of it.

## What I verified, and how

1. **Diff shape.** `git log a3e0b7e..b0f12ab` (10 commits) and `git diff a3e0b7e b0f12ab --stat`
   (66 files, +6390/-137). Confirmed only `db/migrations/0044`, `0045`, `0046` were added and
   no file under `db/migrations/0001`–`0043` changed
   (`git diff a3e0b7e b0f12ab --stat -- db/migrations`).
2. **SQL evidence functions (discipline 3, the specific scrutiny item).** Extracted the bodies
   of `simulora.action_generation_evidence_is_valid` from `0032` and `0046`, and
   `simulora.valid_action_no_effect_evidence` from `0035` and `0046`, and diffed them
   line-by-line. Confirmed the *only* difference in each is:
   - `action_generation_evidence_is_valid`: `attempt.adapter = 'deterministic'` →
     `attempt.adapter in ('deterministic', 'openai-compatible')`.
   - `valid_action_no_effect_evidence`: `attempt_row.adapter <> 'deterministic'` →
     `attempt_row.adapter not in ('deterministic', 'openai-compatible')`.
   Every other line, including the exact-manifest (`attempt.context_manifest = expected_manifest`)
   and exact-output (`attempt.output = expected_output`) equality checks, the narrative-authorship
   guard, the excluded-fact guard and the `MOVE_CHARACTER`/default operation-shape branch, is
   byte-identical. The exact-evidence binding is intact; only the adapter allow-list widened.
3. **Export object storage** (`db/migrations/0044`, `packages/storage/src/index.ts`,
   `packages/application/src/index.ts` `GovernanceService`/`ExportStorageWorker`,
   `apps/api/src/app.ts` routes, `tests/integration/ip9-object-storage.test.ts`,
   `apps/api/src/app.test.ts`). Read the lifecycle trigger
   (`protect_export_artifact_identity`), the HMAC signing/verification path (`#sign`,
   `readSignedExport`, `timingSafeEqual` with a length check before compare), the backoff SQL
   (`least(300000, 1000 * power(2, least(storage_attempts, 8)))` — bounded at 5 minutes), and
   the real S3-backed test (`s3Suite`) that checks presigned-URL expiry (403) and post-deletion
   404 against a real MinIO/S3 client.
4. **Model gateway** (`packages/model-gateway/src/index.ts`,
   `packages/config/src/index.ts`, `apps/worker/src/worker.ts`,
   `tests/integration/ip9-model-provider.test.ts`). Confirmed `assertProviderEndpoint` rejects
   non-HTTPS except literal loopback hostnames, the outgoing prompt and incoming provider
   content are both checked for the raw API key, `worldTurnRules` (system message) never
   contains creator-authored text (which travels only in the JSON `data` message), a
   provider-declared model mismatch raises `ModelRouteChangedError`, and `FallbackModelGateway`
   engages the fallback only on `ProviderUnavailableError` (a malformed/unsafe answer is never
   silently papered over). Traced `createWorkerComposition.processNextAction`, which **awaits**
   `recordModelProfile()` (memoized, transactional, advisory-locked) before calling
   `actionRepository.processNextAction`, so activation recording genuinely gates generation —
   the separate fire-and-forget `recordModelProfile()` call in `apps/worker/src/index.ts` at
   startup is redundant logging, not the actual gate (it resolves the same memoized promise).
5. **Config confinement** (`packages/config/src/index.ts`). `selectModelRouting` refuses a live
   profile without `SIMULORA_MODEL_RETENTION_APPROVAL_REF` outside `local`/`test`; independently,
   `serverConfigSchema`'s `superRefine` already refuses to parse any config with
   `SIMULORA_ENV` in `preview`/`staging`/`production` (inherited IP-1 constraint, unweakened),
   so a live provider cannot reach a shared environment through this path even before the
   IP-9-specific check runs. Two independent gates, not one.
6. **Evaluation corpus** (`packages/testkit/src/model-evaluation.ts`,
   `scripts/evaluate-model-profile.ts`, `tests/integration/ip9-model-evaluation.test.ts`).
   Confirmed `evaluateModelOutput` returns a `hardGates: HardGateResult[]` per case and the
   script's `passed` is `hardGateFailures.length === 0 && unmetExpectations.length === 0` — a
   strict AND over every case, never an average. 13 cases span benign/authority/privacy/
   structure/injection categories with per-case pinned rejection reasons.
7. **Fault matrix** (`tests/integration/ip9-fault-matrix.test.ts`,
   `tests/integration/ip9-object-storage.test.ts`,
   `tests/integration/ip9-model-provider.test.ts`). Read every test in these three files line
   by line. They inject real faults (a real `CREATE TRIGGER ... RAISE EXCEPTION` on
   `durable_jobs`, real row mutation to desynchronize a projection, real clock skew combined
   with a real 1.5s-delayed HTTP provider double, a real closed-port S3 endpoint) and assert
   concrete outcomes (row counts, exact status transitions, exactly-once ledger entries,
   byte-for-byte checksum matches). None of the assertions I read are vacuous (e.g. no bare
   `expect(true).toBe(true)` or over-broad try/catch that would swallow a real failure).
8. **CI run 35936816813 (real infrastructure).** Grepped the downloaded log for:
   - Restore drill: `{"tables": 39, "rows": 171, "storedObjects": 3, ...}` with all 8 named
     checks (`TABLE_CONTENT_IDENTICAL`, `BRANCH_HEADS_RESOLVE`,
     `ACTIVE_BRANCH_BELONGS_TO_CONTINUITY`, `COMMIT_STATE_PAIRS_MATCH`,
     `EXPORT_STORAGE_CONSISTENT`, both `CANONICAL_*_HASHES_PRESERVED`,
     `RESTORED_STATE_SERVED`, `OBJECT_MANIFEST_INTACT`) `"passed": true`, and the tampered-copy
     step's guard (`if ... pnpm restore:drill > tampered.json; then echo "A tampered restore
     passed the drill"; exit 1; fi`) present and not tripped.
   - `perf:ack`: `{"acknowledgementMs": {"p95": 524.6, ...}, "targets": {"acknowledgementP95Ms":
     1000}, "passed": true}` — 200 Actions, concurrency 10, containerized API/worker, real
     PostgreSQL 17. (The separate `acknowledgedToProposalMs.p95` of 35335ms is generation
     throughput under load, honestly reported and explicitly *not* gated per the report's own
     "not proven" section — I checked this is not misrepresented as meeting a target anywhere.)
   - `pnpm check-web-csp.ts`: `Production web build renders under CSP (26 elements)` against
     the real nginx container with the committed CSP headers, with a real headless Chromium
     console listener for CSP violations.
   - Unit/integration test totals: `14 passed (14)` / `149 passed` (first vitest run, no DB),
     `31 passed (31)` / `245 passed` (PostgreSQL-backed integration run), Playwright
     `180 passed (7.5m)` across the five declared projects (`desktop-chromium`,
     `mobile-390x844`, `desktop-firefox`, `mobile-webkit-390x844`, `tablet-chromium-768x1024`).
   - No failure lines, no skipped-then-silently-ignored suites; the many `ERROR:`/`CONTEXT:`
     lines in the log are expected `RAISE EXCEPTION` output from negative-path tests
     (immutability triggers, guard violations), not real failures — confirmed by checking they
     correspond 1:1 to tests that assert `.rejects.toThrow(...)` on those exact messages.
9. **Accessibility harness** (`tests/e2e/support/accessibility.ts`). `expectAccessible` runs a
   real axe scan, a real 320px-viewport reflow measurement (bounding-rect based, reports the
   actual overflowing element/text run on failure), a real reduced-motion check (parses computed
   `transition-duration`/`animation-duration`), and a real keyboard-arrival focus-visibility
   check (`Shift+Tab`/`Tab`, then reads `outline-style`/`outline-width` off `document.activeElement`).
   None of this is a stub.
10. **The `b0f12ab` WebKit fix.** `git show b0f12ab` — the CSS change gives `.field-label select`
    `appearance: none` plus a background-image arrow and `text-overflow: ellipsis`; the element
    is still a real `<select>`, so native keyboard operation, OS-native option list and screen
    reader semantics are unaffected — only the closed-box rendering of a long option label
    changed. The accompanying test change makes the reflow check wait two animation frames
    after resize and name the actual overflowing element, which is why it could previously pass
    on other browsers while failing on WebKit. Verified this is the exact and only content
    change (`+18/-4` in `styles.css`, `+29` in `accessibility.ts`).
11. **Discipline scans.** `git diff a3e0b7e b0f12ab` for anything touching grant/sharing/import/
    memory/scheduler surfaces, and a keyword grep (`long.term memory`, `LONG-01`, `autonomous
    scheduler`, `bounded sharing`, `staged import`, `grant_management`, `memory_summary`) across
    `packages/`, `apps/`, and the three new migrations: no matches. Confirmed the root-dependency
    guard in `scripts/check-architecture.ts` now walks both `tests/` and `scripts/` (line
    94–97), matching defect §4.3 of the report. Confirmed new `package.json` dependencies
    (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` in `packages/storage`;
    `@simulora/domain` in `packages/testkit`; workspace links for `@simulora/storage`/
    `@simulora/application` in `apps/api`/`apps/worker`) are clean production additions with no
    reference to `prototypes/simulora-experience`.
12. **Working tree note.** At review start, `git status` showed `M packages/testkit/src/index.ts`
    uncommitted. `git diff` on that file shows no content change, only a CRLF/LF line-ending
    warning — not a real modification, and irrelevant to the reviewed SHA (`git rev-parse HEAD`
    confirms `HEAD` is exactly `b0f12ab...`). Not counted as part of this review either way.

## Findings

### BLOCKER
None found.

### IMPORTANT

**I1. A delayed export's usage reservation can be orphaned indefinitely if the client abandons
the page during an object-store outage.**
`apps/web/src/pages.tsx:3154-3180` (`refreshPendingExport`, `pendingReservationId`,
`pendingExportId` effect) settles the usage reservation client-side, in a `setInterval` poll
that only exists while the `TrustLifecyclePage` component instance stays mounted with
`pendingReservationId` in local React state. `packages/contracts/src/index.ts:379-403`
(`exportResponseSchema`) carries no `reservationId` field, so a fresh page load (after a reload,
a closed tab, or simply navigating away and back) cannot discover which reservation belongs to
a still-`PENDING` export and cannot resume settlement. Server-side, `storeExportWork`
(`packages/application/src/index.ts:463-489`) and the worker's `processNext`
(`packages/application/src/index.ts:513-529`) never call `settleUsage`/`releaseUsage` — nothing
transitions the `usage_reservations` row out of `RESERVED` when the object finally lands in
`STORED`. I confirmed there is no reservation-expiry or reap job anywhere in
`packages/database/src/index.ts` (only `settleUsage`/`releaseUsage`, both caller-invoked).
**Concretely:** a person exports a World during a real object-store outage, sees "Storage is
delayed... it will finish automatically," and closes the tab (reasonably, since the message says
it finishes automatically). The reservation never settles or releases. Comparing against
`a3e0b7e:apps/web/src/pages.tsx`, pre-IP-9 `createExport` was always synchronous (export bytes
went straight into PostgreSQL), so `settleUsage`/`releaseUsage` always ran in the same request
that created the export — this abandonment window did not exist before IP-9's own object-storage
work introduced the `PENDING` path. **Impact today is bookkeeping-only**, not fund loss: I traced
`reserveUsage` (`packages/database/src/index.ts:5900-5940`) and it inserts `units: 0` — this
usage/economy layer is a placeholder ahead of the pricing decision the report itself defers
(§7). It is not a G9 criterion violation (G9 covers the object-store *delay runbook*, which is
proven; it says nothing about the export usage ledger), and it does not weaken Action authority,
World truth or ownership. But it is a genuine reliability gap in a feature IP-9 built, it will
accumulate stale `RESERVED` rows in production, and once real pricing lands on this same
reservation mechanism it would become a real leak. **Recommended fix:** settle (or release, if
tombstoned/revoked) the reservation server-side, in the same transaction as
`markExportStored`/the deletion path, rather than relying on a client poll; alternatively expose
`reservationId` on `ExportResponse` and add a reap job for reservations whose quote has long
expired.

**I2. `IP-9-IMPLEMENTATION-REPORT.md` §5 ("Evidence") is stale relative to the SHA it is meant to
document, and never records the run this Gate actually rests on.**
`docs/implementation-planning/IP-9-IMPLEMENTATION-REPORT.md:68-98`. The documentation commit
(`6deb446`) that added this report, `IP-9-FAULT-MATRIX.md` and `IP-9-THREAT-MODEL.md` landed
*before* three further commits on the same branch (`7d452fa`, `9e8099c`, `b0f12ab`) that were
needed to reach a green CI run. Section 5's evidence table stops at `7247264` with "figures
below once green" (line 76) and no figures ever follow; it cites only the three earlier,
partially-failing runs (`35927879488`, `35930110554` failed, `35931753434` partially failed on
lint) and never mentions run `35936816813` (the actual green, exact-SHA run this Gate depends
on) or the real p95 figures (524.6ms ack, 35335ms ack-to-proposal) that run produced. A reader
who (reasonably, per this task's own instructions to read the frozen docs first) starts from
this report would conclude accessibility/perf never went green and would not learn that two
WebKit-specific accessibility regressions were found and fixed after the report was written.
This is exactly the kind of drift AGENTS.md Working Rule 9 asks agents to close out
("独立 Gate 决定和 CI evidence 收尾时，必须同步...文档"). **Not a BLOCKER** — I was able to
independently verify the real, current state directly from `gh run view`, and the report's
substantive claims (scope, defects found, "not proven" list) hold up — but the document as
committed cannot be trusted at face value for the final passing state, which is the one thing a
reviewer most needs from it. **Recommended fix:** update §5 with the `35936816813` result and
figures, and extend §2's commit table with `7d452fa`/`9e8099c`/`b0f12ab` before this Gate is
considered closed in the handoff docs.

### MINOR

**M1.** `apps/worker/src/index.ts:87-101` calls `composition.recordModelProfile()` fire-and-forget
at startup, logged separately from the per-Action call inside
`createWorkerComposition.processNextAction` (`apps/worker/src/worker.ts:61-71`) that actually
gates generation. Both resolve the same memoized `activation` promise
(`apps/worker/src/worker.ts:79-86`), so this is not a race in practice, but the duplication makes
the real gate ("no Action is generated under an unrecorded profile") less obvious than it needs
to be from `index.ts` alone. Cosmetic; no behavior change recommended, just worth a comment at
the `index.ts` call site pointing at the real gate the way `worker.ts:63-64` already does.

## G9 criteria — my own assessment

| # | Criterion (frozen) | My status | Basis |
|---|---|---|---|
| 1 | Live provider cannot bypass deterministic rules | **Met** | 0046 diff is a one-line adapter widening per function, exact-manifest/exact-output equality preserved (verified §2 above); `ip9-model-provider` shows a provider trying to widen `participation` is rejected and never touches World truth; hard gates in the evaluation corpus independently re-check accepted candidates. No real provider was evaluated (honestly disclosed), but the mechanism binding is proven against a real HTTP provider double. |
| 2 | Provider outage/degradation leaves state readable and Action recoverable | **Met** | `ip9-model-provider` "keeps state readable through an outage" and the ten-second wait/cancel test, both against real PostgreSQL; fallback only engages on `ProviderUnavailableError`. |
| 3 | p95 acknowledgement ≤ 1s and ten-second recoverable wait, under documented profile | **Met under the documented profile** | CI `perf:ack`: p95 524.6ms against a 1000ms target, `"passed": true`, real containerized API/worker + PostgreSQL 17. Ten-second wait state verified with real clock skew plus a real slow HTTP double. Profile is loopback/single-host/deterministic-generation, honestly scoped as such. |
| 4 | Core journeys pass keyboard and supported assistive-technology review, desktop/mobile | **Automated evidence only, as disclosed — accepted** | Real axe + reflow + focus + reduced-motion checks across 5 real browser/device projects, 180 passing tests including the WebKit fix verified end-to-end in this same CI run. No human screen-reader session was run; the report says so plainly rather than implying otherwise. |
| 5 | No state meaning depends on animation, audio, color or optional media | **Met** | Reduced-motion check asserts zero running transitions/animations; states are text-based per the code read. |
| 6 | Backup/restore, worker retry, projection rebuild and object-store delay runbooks proven | **Met** | Real `pg_dump`/`pg_restore` drill with 8 named integrity checks all passing plus a tampered-copy negative case; `ip9-fault-matrix` projection rebuild test; `ip9-object-storage` outage/backoff tests against both an in-memory double and a real unreachable S3 endpoint. |
| 7 | Security/privacy review has no open release BLOCKER | **No BLOCKER found, independently** | I read the threat model's asset/boundary/threat tables against the actual code (HMAC signing, owner scoping, prompt/data separation, key-echo checks) and found the claims accurate. The six open items are genuinely external decisions (auth, rate limits, grant revocation product design, provider terms), not concealed defects. My own review adds I1 (reservation orphaning) as IMPORTANT, not BLOCKER, since it has no security or fund impact under the current units=0 placeholder economy. |

## Discipline checks (1–8)

1. **No change to frozen Product/System/Experience core semantics** — Held. No changes to
   `docs/research/worldos/`, `docs/product/`, `docs/system-design/` in this diff.
2. **No second truth model** — Held. Object store bytes are non-authoritative (checksum/key
   fixed in PostgreSQL, verified again on every read via `#loadVerified`); model profile
   activations are routing/audit metadata, not World truth; live provider output is validated by
   the same application+SQL path as deterministic output, unchanged apart from the adapter
   allow-list.
3. **Action/authority/confirmation/Recovery/ownership not weakened** — Held, with I1 as a
   reliability caveat on a supporting (export) feature, not on Action/authority/confirmation
   themselves. The 0046 diff (the specific scrutiny item) is exactly the one-line-per-function
   adapter widening claimed; nothing else changed.
4. **Prototype not brought into production dependencies** — Held. New dependencies are AWS SDK
   S3 packages and internal workspace packages only; no reference to
   `prototypes/simulora-experience` in any changed production file.
5. **Deferred IP-8.7/IP-8.8 not secretly implemented** — Held. No staged-import or
   bounded-sharing code or schema found anywhere in the diff.
6. **IP-10 not started** — Held. No long-term memory, autonomous scheduler, broad simulation,
   ops-ownership or alerting code found.
7. **Successor-only migrations** — Held. Only `0044`–`0046` added; `git diff --stat -- 
   db/migrations` confirms zero changes to `0001`–`0043`; `scripts/check-migrations.ts`'s
   sequence/duplicate-checksum guard still runs over all 46 files in CI (`Migration check passed
   (46 migration)`).
8. **No real model provider called; live profile confined absent approval** — Held. `perf:ack`,
   fault-matrix and model-provider suites all use a loopback HTTP double
   (`ProviderDouble`/`createServer` in `tests/integration/ip9-model-provider.test.ts`), never a
   real external endpoint. `selectModelRouting` and the independent `SIMULORA_ENV` schema refusal
   both confine an unapproved live profile to `local`/`test`.

## Verdict

**G9 PASS WITH ISSUES**

No BLOCKER was found in code, migrations, or the exact-SHA CI run. The core hardening claims —
live-adapter admission without loosening the exact-evidence binding, object-storage lifecycle
integrity, model-gateway isolation, per-case (never averaged) evaluation hard gates, real
fault-matrix and restore-drill evidence, and automated accessibility/security hardening — all
checked out against the actual code and a verified real CI run, not just the report's prose.

Accepted issues (fix before broader release, not before closing this Gate):
- **I1** — delayed-export usage reservations can be orphaned if a client abandons the page during
  an object-store outage; bookkeeping-only today (`units: 0`), becomes a real leak once pricing
  lands on this mechanism.
- **I2** — `IP-9-IMPLEMENTATION-REPORT.md` §5 was never updated with the final green run
  (`35936816813`) or its figures, and its commit list omits the three commits needed to reach
  green; the substantive claims elsewhere in the report held up under independent verification,
  but this section should not be read as current without cross-checking `gh run view` directly,
  which is what this review did.

---

## Focused re-review — 2026-09-24

**Trigger:** the implementer repaired I1, I2 and M1 in behavior commit
`a59a58a38f338426cad757977b0dc657fe512a90` (on top of `b0f12ab`), plus an uncommitted
working-tree update to `IP-9-IMPLEMENTATION-REPORT.md`, and asked for a focused re-review before
closing the Gate.

**SHA reviewed:** `a59a58a38f338426cad757977b0dc657fe512a90`.
**CI run reviewed:** `35955102973` — confirmed via `gh run view 35955102973
--json headSha,conclusion`: `headSha` is exactly `a59a58a38f338426cad757977b0dc657fe512a90`,
`conclusion` is `success`. Downloaded the full log (`gh run view 35955102973 --log`, 4613
lines) and checked it directly.

### What I checked

- `git log b0f12ab..a59a58a` — one commit. `git diff b0f12ab a59a58a --stat` — 6 files,
  `+115/-39`: `apps/web/src/ip8-api.ts`, `apps/web/src/pages.tsx`, `apps/worker/src/index.ts`,
  `packages/database/src/index.ts`, `tests/e2e/ip8-trust-lifecycle.spec.ts`,
  `tests/integration/ip9-object-storage.test.ts`. **No file under `db/migrations/` appears in
  this diff** — the fix reuses `export_jobs.reservation_id` (added in migration `0041`, already
  present and nullable) and the existing `usage_ledger(reservation_id, entry_type)` unique
  constraint (migration `0040`), so no successor migration was needed. Confirmed no
  `packages/domain`, `packages/model-gateway`, `packages/contracts`, or Action/proposal/
  confirmation code in `packages/database/src/index.ts` outside the export path was touched —
  Action, authority and confirmation semantics are unchanged by this commit.
- Read the full diff to `packages/database/src/index.ts`. `markExportStored` now runs inside
  `transaction(this.pool, ...)`, updates `export_jobs` with `returning reservation_id`, and on a
  successful transition calls a new private `closeExportReservations(client, [reservationId],
  "SETTLED", "SETTLEMENT")` using the **same transaction client** — atomic with the storage
  transition, not a follow-up step that could partially fail.
- **Locking/concurrency against `transitionUsage`.** `transitionUsage` (the existing
  `settleUsage`/`releaseUsage` path, `packages/database/src/index.ts:6975-7008`) takes
  `SELECT ... FOR UPDATE` on the reservation row before checking status.
  `closeExportReservations` instead issues a bare `UPDATE simulora.usage_reservations SET
  status = $2 WHERE id = $1 AND status = 'RESERVED' RETURNING account_id`. This is safe without
  an explicit prior lock: PostgreSQL's `UPDATE` itself takes the row lock and re-evaluates the
  `WHERE` predicate against the latest committed row version before applying, so a concurrent
  `transitionUsage` and `closeExportReservations` on the same reservation serialize on the row —
  whichever commits first wins, and the loser's predicate (`status = 'RESERVED'`) no longer
  matches, so it affects zero rows and is treated as a no-op (`if (!closed.rows[0]) continue;`).
  I did not just reason about this abstractly: the new integration test explicitly exercises the
  cross-path idempotency — after the server auto-settles a reservation, the test calls
  `repository.settleUsage(owner, request.reservationId)` directly and asserts the ledger still
  has exactly one `SETTLEMENT` entry (`tests/integration/ip9-object-storage.test.ts:166-168`),
  which also confirms `transitionUsage`'s own `if (row.status === status) return ...` idempotent
  branch composes correctly with the new server-side path rather than throwing
  `USAGE_RESERVATION_TERMINAL`.
- **Revoked-while-READY must not be released.** The rewritten revocation query in
  `confirmDeletion` captures `prior_status` per row via a `... for update` CTE, and
  `closeExportReservations` is called only with the reservation IDs of rows whose
  `prior_status === "PENDING"` (`packages/database/src/index.ts`, the `revoked.rows.filter(...)`
  call). A `READY` export's reservation was already moved to `SETTLED` by `markExportStored` at
  storage time, so it is both excluded by this filter and would additionally no-op against the
  `WHERE status = 'RESERVED'` guard even if it were not. Verified directly by the rewritten
  `"propagates deletion..."` test, which now creates one already-`READY` export and one
  `PENDING` export before deleting the World, and asserts the `READY` export's reservation ends
  `{ status: "SETTLED", entries: ["SETTLEMENT"] }` (untouched by deletion) while the `PENDING`
  one ends `{ status: "RELEASED", entries: ["RELEASE"] }`
  (`tests/integration/ip9-object-storage.test.ts:220-231`, both against real PostgreSQL).
- **Legacy rows with a null `reservation_id`.** `closeExportReservations` skips falsy IDs
  (`if (!reservationId) continue;`) before touching the database, so the pre-existing "migrates
  a pre-IP-9 inline artifact" test (unchanged by this commit, still present) and any export
  created without a bound reservation cannot crash `markExportStored` or the revocation path.
- **Client-side removal.** `apps/web/src/ip8-api.ts` deletes the `settleUsage` export entirely;
  `apps/web/src/pages.tsx` removes `pendingReservationId` state and every client-initiated
  `settleUsage` call, including the one that used to run synchronously right after a same-request
  `READY` result. The remaining client-side `releaseUsage` call is for the pre-existing,
  unrelated synchronous-failure branch (`result.data` missing or not `READY`/`PENDING` in the
  same request that created it) — that path was never part of I1 (no abandonment window; it
  resolves within one awaited call) and is untouched in shape. `tests/e2e/ip8-trust-lifecycle.spec.ts`
  now asserts `settled` stays `false` through the whole delayed-export journey
  (`expect(settled).toBe(false)`), i.e. the browser genuinely never calls settle for an export
  any more — checked in the CI log as passing on all five projects (`desktop-chromium`,
  `mobile-390x844`, `desktop-firefox`, `mobile-webkit-390x844`, `tablet-chromium-768x1024`).
- **CI evidence.** Same shape as the exact-SHA run reviewed originally: `14 passed (14)` /
  `149 passed` (unit), `31 passed (31)` / `245 passed` (PostgreSQL integration — the reservation
  assertions were added inside existing `it(...)` bodies, not new test files, which is why the
  file/test counts are unchanged from `35936816813`), restore drill all 8 checks `"passed": true`
  plus the tampered-copy negative case, and Playwright `180 passed` across the five projects
  including the new `"a delayed export stays reviewable and leaves settlement to the server"`
  title on all five. No failures, no new skips.
- **M1.** `apps/worker/src/index.ts`'s comment now reads "Logging only: the gate is in
  `processNextAction`, which awaits the same activation and generates nothing until it is
  recorded. A failure is retried on the next poll." — accurate, and matches what I verified in
  the original review (the real gate is the awaited call inside
  `createWorkerComposition.processNextAction`, not this fire-and-forget startup call).
- **I2.** Read `git diff -- docs/implementation-planning/IP-9-IMPLEMENTATION-REPORT.md` (still
  uncommitted, as disclosed). §2's commit table now includes `6deb446`, `9e8099c`,
  `7d452fa`/`b0f12ab`, and `a59a58a`. §4 gained defects 5–7 (WebKit reflow root cause, the
  shared-database backlog behind `9e8099c`, and I1 itself, each described accurately against
  what I independently verified). §5 now cites run `35936816813` by name with the actual
  figures — p50/p95/p99 acknowledgement (76.7/524.6/724 ms) and acknowledgement-to-proposal
  (18.3/35.3/36.8 s, correctly still marked "reported, not gated"), restore-drill table sizes
  (39 tables/171 rows/3 objects), and the CSP smoke (26 elements) — every number matches what I
  independently pulled from the raw CI log, both in my original review and again in this
  re-review. It explicitly defers `a59a58a`'s own CI result to this document's re-review
  section rather than self-grading it. I found no remaining inaccuracy in the updated sections.

### Disposition

| Finding | Disposition |
|---|---|
| **I1** (orphaned export reservation) | **Resolved.** Server-side, transactional, atomic with storage/revocation; correctly excludes already-`READY`/`SETTLED` exports from release; correctly no-ops on legacy null `reservation_id`; proven safe against the pre-existing `transitionUsage` path by both code inspection and a new idempotency assertion; client can no longer strand a reservation (verified by a real Playwright run that the browser never calls settle). |
| **I2** (stale implementation report) | **Resolved**, pending the working-tree report being committed. Content is accurate against independently-verified facts (code and both CI runs). Since it is still uncommitted, the report is not yet the source of truth in the repository — this should be committed as part of closing this Gate, but it is not a defect in the content itself. |
| **M1** (misleading worker comment) | **Resolved.** Comment now correctly names `processNextAction` as the real gate. |

### New findings from this focused re-review

None. No BLOCKER, IMPORTANT or MINOR issues found in the repair itself. No migration was added
or edited; no Action/authority/confirmation/participation code was touched; no scope crept into
IP-8.7/IP-8.8/IP-10 territory; no real model provider was called (this commit does not touch the
model-gateway path at all).

### Final verdict

**G9 PASS.**

All findings from the original review are resolved and independently verified against the code,
the exact-SHA CI run (`35955102973`, `success`, `headSha` confirmed), and updated documentation.
No BLOCKER was found in either review pass. I recommend committing the currently-uncommitted
`IP-9-IMPLEMENTATION-REPORT.md` update as part of closing this Gate, since an accurate report
that only exists in the working tree is not yet durable project history.
