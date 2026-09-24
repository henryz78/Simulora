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

---

## Second audit repair re-review — 2026-09-24

**Trigger:** a second, separate audit of G9 returned `PASS WITH ISSUES` with six findings. The
implementer verified each against the code, reports every one was real, and repaired all of them
in behavior commit `d7430e3ede0ace1ef64df4d35899fa39b63e2fcf` (on top of the approved `a59a58a`).
I re-reviewed this independently and skeptically rather than accepting "every one was real" at
face value.

**SHA reviewed:** `d7430e3ede0ace1ef64df4d35899fa39b63e2fcf`.
**CI run reviewed:** `35961891632` — confirmed via `gh run view 35961891632
--json headSha,conclusion`: `headSha` is exactly `d7430e3ede0ace1ef64df4d35899fa39b63e2fcf`,
`conclusion` is `success`. Downloaded the full log (`gh run view 35961891632 --log`, 4646 lines)
and cross-checked it directly.

Note: `git log a59a58a..d7430e3` is two commits — `711e1f9` (docs: recorded my first-pass G9
PASS against `a59a58a`/`35955102973`, including committing the then-current
`IP-9-INDEPENDENT-REVIEW.md` — which is why that file shows as changed in this range even though
I did not author `711e1f9`) and `d7430e3` (the actual second-audit repair). I diffed `a59a58a`
against `d7430e3` for the full picture but attributed each change to the commit that introduced
it (`git diff a59a58a 711e1f9` vs `git diff 711e1f9 d7430e3`) wherever it mattered, in particular
for the documentation-currency finding below.

### Finding-by-finding disposition

**1. Export finalization race (worker A's stale lease-less finalize deletes worker B's stored
object; the API's synchronous upload took no lease at all).**
**Real, and fixed.** Read `a59a58a`'s `markExportStored`: it returned a bare `boolean`, and its
only caller (`storeExportWork`, `packages/application/src/index.ts`) treated *any* `false` as
"revoked while in flight" and deleted the object — but `false` was also what a *second* uploader
finalizing the same already-`STORED` row would see, since the `UPDATE ... WHERE storage_state in
('STAGED','LEGACY_INLINE')` no longer matches once the state is `STORED`. `a59a58a`'s
`readStagedExport` (the API's synchronous path) was a bare `SELECT`, taking no lease at all, so a
retry, a slow request racing the background worker, or two API requests for the same idempotency
key could genuinely both attempt to finalize the same export. I confirmed this was a real,
reachable defect in the reviewed prior state, not a hypothetical.
`d7430e3` fixes it correctly: `markExportStored` now returns `"STORED" | "ALREADY_STORED" |
"REVOKED"` (`packages/database/src/index.ts`), distinguishing "someone else already stored this
immutable object" from "this was actually revoked," and `storeExportWork`
(`packages/application/src/index.ts`) only calls `artifacts.delete(...)` when the outcome is
`"REVOKED"` — `if (finalized !== "REVOKED") return "STORED";`. The API's synchronous path now
uses a new `claimStagedExport`, a single atomic `UPDATE ... RETURNING` that takes the same
`storage_lease_until` lease the worker's `claimExportStorageWork` takes, so the two paths
mutually exclude through the same column regardless of which one gets there first. I verified
this is not just a type-level fix: `tests/integration/ip9-object-storage.test.ts`'s new "lets a
second uploader finish without deleting the stored object" test runs two real
`ExportStorageWorker` instances against real PostgreSQL, holds worker A's `put` open with a
controllable double, lets worker B claim (after force-expiring A's lease) and finish, then
releases A — and asserts A's late finalize leaves the object and export in place. This is a
genuine two-actor race exercised end-to-end, not a unit-level assertion on the return type alone.

**2. Deletion/upload crash orphan (no inventory or GC).**
**Real, and mitigated to the extent the audit's own framing allows** — this was never going to
be "solved" by a bounded-lease fix alone, and the implementer does not claim it is. Before this
commit, `confirmDeletion` cleared `storage_available_at` on revocation but held no lease at all,
so an upload already in flight (API or worker) had nothing telling it a delete was pending, and
nothing telling the delete queue an upload might still land — the exact gap the audit named.
`d7430e3` keeps the upload's `storage_lease_until` intact across revocation (the SQL comment at
the revocation query says so explicitly) and requires *both* the backoff and the lease to have
expired before `claimExportStorageWork` will hand out `DELETE_PENDING` work — so a delete can
never run concurrently with a lease-holding upload, closing the specific race described. What it
does not do, and does not claim to do, is add an object-store inventory or reconciliation sweep
for a case outside a lease's bound (e.g. a store with no request timeout, or a worker that holds
a lease and then hangs forever without crashing cleanly enough to let the lease expire naturally
— though a plain process crash is exactly what the lease's fixed 30s expiry is designed to
survive). This ceiling is called out in-code:
`// ponytail: lease-based exclusion, no object-store inventory; add an orphan sweep if a store
without request timeouts is ever used` (`packages/database/src/index.ts`, next to
`exportStorageLeaseMs`). I verified the specific crash sequence the audit described is closed and
self-healing: the "never deletes under a running upload, and removes what a crashed upload left"
test holds an upload open, confirms a deletion while it is in flight, asserts the delete is
**not** claimable yet (`expect(await worker.processNext(...)).toBeNull()`), releases the upload
with its own best-effort cleanup delete forced to fail (simulating a crash right after the object
landed), confirms the object is still there, force-expires the lease (standing in for the real
30s), and confirms the *next* poll of the same `DELETE_PENDING` queue removes it. I traced the
non-test code path for the "crash between a real `delete()` succeeding and the DB being told
so" case (unchanged by this commit, already correct): `ExportStorageWorker.processNext`'s DELETE
branch calls `artifacts.delete()` **before** `markExportObjectDeleted` writes `DELETED`, and
deleting an absent key is defined as success on every adapter, so a crash there just means the
next poll's delete-of-an-already-gone-object is a harmless no-op. Accepted as correctly and
honestly scoped, not a BLOCKER.

**3. S3 presigned URLs bypass PostgreSQL checksum verification and stay usable until deletion
completes.**
**Real, and fully fixed by removal.** In `a59a58a`, `createExportDownloadLink` preferred a
presigned S3 URL whenever the store supported one; once issued, that URL was independently
usable directly against the object store for its whole TTL, bypassing `GovernanceService`
entirely — no checksum re-verification, and (as the S3-suite test at the time literally showed by
asserting a 404 only *after* the drain loop ran) it stays valid for as long as the object exists,
without re-checking whether the export had meanwhile been revoked. `d7430e3` removes the
mechanism outright: `ExportArtifactStore`/`ObjectStoragePort` no longer declare
`signedDownloadUrl`, `S3ObjectStorage`'s implementation and the `@aws-sdk/s3-request-presigner`
dependency are deleted from `packages/storage`, and `ExportDownloadLink.method` is now the
literal `"API_SIGNED"` (`packages/contracts/src/index.ts`) — there is no other code path left
that can produce a different value. Every download now goes through `readSignedExport`, which
re-verifies the checksum against PostgreSQL on every single use (`#loadVerified`) and re-resolves
ownership/revocation via `readExportArtifactLocation` on every use, not just at mint time. I
checked this against the frozen contract text the coordinator flagged
(`API_SECURITY_AND_OPERATIONS.md` §6.4: "Signed, short-lived object download/upload URLs scoped
to one object/action"; `IMPLEMENTATION_PLAN.md` §5's object-store row only commits to "exercises
S3 contracts," naming no specific download mechanism) — neither document mandates that the
signed link be an S3-native presigned URL specifically; both care about the security property
(signed, short-lived, single-object/action scope), which an HMAC-signed, 120-second, single
export+account-bound API link satisfies at least as well, and which the audit's own finding shows
a raw presigned URL satisfies *worse* (no post-mint checksum or revocation re-check). I do not
read this as a frozen-contract conflict; if anything it closes a gap the frozen text's intent
implies. The updated S3-suite test in `tests/integration/ip9-object-storage.test.ts` confirms
`link.url` never contains the raw S3 endpoint, that a revoked export's link is refused
immediately (`InvalidDownloadLinkError`) even before the object itself is physically deleted, and
that the underlying object is genuinely stored/retrieved/deleted against a real S3-compatible
endpoint throughout.

**4. Live evaluation false pass (a provider that always errors yields `passed: true`).**
**Real, and fixed.** In `a59a58a`, live-mode `passed` was `hardGateFailures.length === 0 &&
unmetExpectations.length === 0`; `unmetExpectations` is unconditionally `[]` in live mode (only
computed in replay), and every hard gate in `evaluateModelOutput` is written as `!parsed || ...`,
so a case that ends in an `Error` (including `ProviderUnavailableError` for every single case)
trivially satisfies every gate. I confirmed by inspection that a provider erroring on all 13
cases would indeed have produced `passed: true` under the prior logic — this was a real,
reachable false-pass, not a contrived edge case. `d7430e3` adds `liveFailures` (live mode only):
any `benign`-category case whose outcome isn't `ACCEPTED`, or any case at all that ends in
`ProviderUnavailableError`, and folds `liveFailures.length === 0` into `passed`
(`scripts/evaluate-model-profile.ts`). The new
`tests/integration/ip9-model-evaluation.test.ts` test constructs exactly the failure mode the
audit named — a `ModelGatewayPort` whose `generateWorldTurn` always rejects with
`ProviderUnavailableError` — runs it through `runModelEvaluation("live", ...)`, and asserts
`hardGateFailures` stays empty (proving the vacuous-gate behavior is still there, as expected)
while `liveFailures` has one entry per case and `passed` is `false`. This is a real regression
test for the exact scenario, not a rewording.

**5. Provider response fully buffered before the 64 KB check; password-only URL credentials
accepted.**
**Both real, both fixed.** For buffering: `a59a58a`'s `generateWorldTurn` called `await
response.json()`, which reads and materializes the entire HTTP body in memory before any size
check runs; the `content.length > 64_000` check only ran on the already-fully-buffered, already
JSON-parsed inner string, so nothing bounded the outer envelope's size during the read itself — a
provider (or anything on that network path) returning an arbitrarily large body would be fully
buffered regardless. `d7430e3` adds `readBoundedBody` (`packages/model-gateway/src/index.ts`),
which checks `content-length` up front and then streams the body via
`response.body.getReader()`, accumulating a running total and calling `reader.cancel()` and
throwing the moment the total exceeds `maxEnvelopeBytes` (320 KiB, sized to comfortably hold
64,000 UTF-8 characters plus envelope) — before `JSON.parse` is ever reached, and without ever
holding more than `limit` bytes. The pre-existing `content.length > 64_000` check on the
extracted inner candidate string is untouched and still runs afterward, so the two limits are
complementary, not a regression of the tighter one. For credentials: `assertProviderEndpoint`
previously rejected only `url.username`; a `https://:secret@host/...` URL has an empty username
and a non-empty password and would have passed. It now rejects `url.username || url.password`.
Both are covered by new unit tests in `packages/model-gateway/src/index.test.ts`: an
"oversized body" case (`"<html>".repeat(60_000)`, ~360 KB, over the 320 KB limit) asserts
`ProviderResponseError`, and a loop over `https://:hunter2@provider.example/...` and
`https://user@provider.example/...` asserts both throw `/URL credentials/`.

**6. Minor findings.**
- *Misleading UI for REVOKED/FAILED exports* — real (the UI previously fell through to an
  "else" branch that rendered nothing distinct once `exported.status` was `REVOKED`/`FAILED`
  after being `PENDING`). Fixed: `apps/web/src/pages.tsx` adds an explicit branch rendering
  "Export not available" with status-specific copy and no download control, exercised end-to-end
  by a new `tests/e2e/ip8-trust-lifecycle.spec.ts` test that drives a PENDING→REVOKED transition
  through mocked routes and asserts no "Export ready" text and no "Download ZIP" link ever
  appear, plus a passing `expectAccessible(page)` call on the new UI state.
- *Integrity failures reported as availability failures* — real (both `OBJECT_STORE_UNAVAILABLE`
  and a checksum mismatch on write shared one delay reason and one message, telling the person
  "storage is delayed" for what is actually a corrupted write). Fixed: `OBJECT_INTEGRITY_FAILED`
  is now its own `ExportStorageDelayReason` and its own branch in the export-response mapping
  (`packages/database/src/index.ts`), with contract support
  (`exportResponseSchema`'s `delay.reasonCode` is now an enum of both reasons in
  `packages/contracts/src/index.ts`) and a dedicated PostgreSQL-backed test that forces a put to
  throw `ObjectIntegrityError` and asserts the export surfaces `OBJECT_INTEGRITY_FAILED`.
- *Legacy inline reservation edge* — real, and distinct from I1's original fix. `a59a58a` settled
  reservations only through `markExportStored` (new exports going forward) and released
  reservations only for exports revoked while `PENDING`; a `READY` row whose reservation was
  never settled at all — e.g. a genuinely legacy row inserted directly (as the "migrates a
  pre-IP-9 inline artifact" fixture does) without ever passing through `markExportStored` — had
  no path to ever leave `RESERVED`. `d7430e3` adds a second `closeExportReservations` call in the
  deletion path for rows whose `prior_status === "READY"`, settling (not releasing) them, since a
  `READY` export did deliver its artifact. The new "settles a delivered legacy export's open
  reservation when its World is deleted" test inserts exactly this shape of row directly via SQL
  and confirms deletion moves its reservation from `RESERVED` to `SETTLED` with one `SETTLEMENT`
  ledger entry.
- *Fallback or endpoint profile changes without material notices* — real. `isMaterialProfileChange`
  previously compared `id`/`adapter`/`model`/`promptVersion` only; neither a same-model
  provider-endpoint change (e.g. moving to a different backend serving an identically-named
  model) nor a fallback-declaration change (e.g. `none` → `deterministic`) would have been
  flagged material, so people would not be told about either. Fixed: `CapabilityProfile` gains
  `provider` (the endpoint's origin, derived in `OpenAICompatibleModelGateway`'s constructor,
  never supplied separately — so it cannot drift from the real endpoint), which participates in
  `isMaterialProfileChange`, `profileDigest`, and the new `model_profile_activations.provider`
  column (migration `0047`); and `createWorkerComposition`'s `isMaterialChange` closure now also
  returns `true` when `previous.fallbackProfile !== fallbackProfile` for any non-first
  activation. Covered by unit tests (materiality, digest) and a real-PostgreSQL integration test
  that activates a profile, moves it to a different `provider` value, and confirms both the
  returned activation and the persisted row reflect it.
- *Incomplete effect corpus (no movement cases)* — real. The corpus previously only exercised
  `FACT_REWRITE` and `NO_WORLD_EFFECT`; `ROUTINE_EFFECT`/`MOVE_CHARACTER` (the RE-3 closed-policy
  movement mechanism) was never evaluated at all. Fixed: three new cases
  (`benign.routine-move`, `authority.route-outside-policy`,
  `authority.moves-unauthorized-character`) exercise an authorized move, a move to a location
  outside the closed routine policy, and a move of an unauthorized character, plus a new
  `ACCEPTED_MOVE_WITHIN_POLICY` hard gate that independently re-checks any accepted move against
  the corpus's own declared policy. I confirmed the two new rejection cases' expected-message
  regexes (`/outside the authorized closed policy/`, `/explicitly authorized NPC/`) match
  verbatim strings still present in the **unchanged** `packages/domain/src/index.ts` (this commit
  does not touch the domain package at all) — these cases exercise the real, already-hardened
  RE-3 production validator, they do not add new authority logic.
- *No human assistive-technology review* — correctly left open and disclosed; this is an external
  dependency the implementer cannot close by writing code, and nothing in this commit claims
  otherwise.

### Additional checks the coordinator asked for specifically

- **Lease/backoff interplay — can a delete be starved, and can an upload land after its lease
  expires?** A delete cannot run while a lease is held, but the lease is fixed-duration
  (`exportStorageLeaseMs = 30_000`) and is set once at claim time — it is never renewed or
  extended by a long-running upload, so worst case a delete waits one lease duration, not
  indefinitely, even if the uploader never returns at all (crash, hang, or otherwise). An upload
  cannot "land after its lease" in a way that causes harm: if its lease has already expired when
  it finally calls `markExportStored`, the row may by then be `STORED` (another uploader won —
  returns `ALREADY_STORED`, no deletion) or `DELETE_PENDING`/`DELETED` (revoked and possibly
  already cleaned up — returns `REVOKED`, triggers the same best-effort delete that would have
  run anyway). Neither outcome corrupts state or double-charges a reservation, because
  `closeExportReservations`'s guard (`where status = 'RESERVED'`) makes every settlement/release
  idempotent regardless of ordering.
- **The assumption that S3 request time is bounded below the 30 s lease.** Verified in
  `packages/storage/src/index.ts`: `S3ObjectStorage`'s constructor sets
  `requestHandler: { connectionTimeout: timeout, requestTimeout: timeout }` with `timeout =
  options.requestTimeoutMs ?? 5000` and `maxAttempts: 2`, giving a worst case of ~10 s for any
  single put/get/delete — comfortably under the 30 s lease, matching the code's own comment ("two
  attempts of five seconds for S3"). I checked every call site that constructs an
  `S3ObjectStorageOptions` in production composition (`createObjectStorage`/`selectObjectStorage`
  in `packages/config/src/index.ts`) and confirmed none of them pass a custom
  `requestTimeoutMs` — only test code does. **This holds today but is an untested, implicit
  coupling** between two independently hardcoded constants in two different files/packages
  (storage's `5000 ms × 2` and the database package's `30_000 ms`); nothing would fail loudly if
  a future change raised the S3 timeout (or `maxAttempts`) without also raising the lease. I am
  not treating this as a defect — the assumption is correct as the code stands, and both values
  are currently hardcoded, not configurable in production — but I flag it below as a MINOR
  observation worth a cross-referencing comment or a shared constant.
- **Do the new integration tests really exercise the races, or just assert the type change?**
  Verified above per finding — the two new `ip9-object-storage.test.ts` tests use a real
  `ControlledStorage` double (`holdNextPut`/`releasePut`/`failNextPut`/`failNextDelete`) against
  two real `ExportStorageWorker` instances and real PostgreSQL, genuinely creating and resolving
  the race windows rather than asserting on `markExportStored`'s return value in isolation.
- **Migration `0047` against the append-only activation trigger and the export identity
  trigger.** Read `0047` in full: it only adds two nullable columns
  (`export_jobs.storage_lease_until`, `model_profile_activations.provider`) with no `UPDATE`
  statement touching existing rows. `simulora.model_profile_activations_immutable` (from `0045`)
  fires `before update or delete` and blocks any row mutation — since `0047` issues no `UPDATE`
  against that table, it never fires, and the trigger's own definition is untouched, so
  append-only history for every prior activation is intact. `simulora.protect_export_artifact_identity`
  (from `0044`) checks specific named fields (`account_id`, `world_id`, `idempotency_key`,
  `selected_scopes`, `omitted_scopes`, `manifest`, `created_at`, `checksum`, `artifact_key`,
  `artifact_bytes`, `storage_state`); it does not reference `storage_lease_until` at all, so
  writes to the new column (by `claimStagedExport`, `claimExportStorageWork`, `markExportStored`,
  `recordExportStorageDelay`, `markExportObjectDeleted`, and the revocation path) are unaffected
  by and do not need to satisfy that trigger's checks. Both triggers' own `CREATE TRIGGER`/
  `CREATE OR REPLACE FUNCTION` statements are unchanged in this diff — confirmed via
  `git diff a59a58a d7430e3 -- db/migrations`, which shows only `0047` as a new, added file with
  no other migration touched.
- **Whether removing presigned URLs conflicts with a frozen contract.** Addressed under finding 3
  above — no conflict found; the frozen text specifies security properties, not a specific
  transport mechanism, and the properties are met (arguably better) by the API-signed
  replacement.
- **Action, authority, confirmation semantics and migrations 0001–0046 untouched.** Confirmed.
  `git diff a59a58a d7430e3 --stat` touches only: `AGENTS.md`, `apps/web/src/pages.tsx`,
  `apps/worker/src/worker.ts`, `db/migrations/0047_ip9_review_repairs.sql`, `docs/README.md`,
  `docs/implementation-planning/IMPLEMENTATION_STATUS_HANDOFF.md`,
  `docs/implementation-planning/IP-9-IMPLEMENTATION-REPORT.md`,
  `docs/implementation-planning/IP-9-INDEPENDENT-REVIEW.md`, `packages/application/src/index.ts`,
  `packages/contracts/src/index.ts`, `packages/database/src/index.ts`,
  `packages/model-gateway/src/index.test.ts`, `packages/model-gateway/src/index.ts`,
  `packages/storage/package.json`, `packages/storage/src/index.test.ts`,
  `packages/storage/src/index.ts`, `packages/testkit/src/model-evaluation.ts`, `pnpm-lock.yaml`,
  `scripts/evaluate-model-profile.ts`, and five test files. None of these are Action/proposal/
  confirmation/participation code; `packages/domain/src/index.ts` (home of the SQL evidence
  functions and `validateActionCandidate`) is untouched by this commit. `db/migrations` shows
  only `0047` as `A` (added); `0001`–`0046` are absent from the diff entirely.
  (`pnpm-lock.yaml`'s 4674-line diff is routine dependency-tree re-resolution churn from removing
  `@aws-sdk/s3-request-presigner` — I scanned it for any of the explicitly-banned technologies
  from Implementation Plan §5 — WebSockets, Redis, Kafka, a vector database — and found none.)

### CI evidence (run `35961891632`)

Same shape as both prior runs, with counts up by exactly the new test cases: unit `14 passed
(14)` / `153 passed` (was 149), PostgreSQL integration `31 passed (31)` / `250 passed` (was 245),
migration check now `47 migration` (was 46), restore drill's full check set still `"passed":
true` throughout, `perf:ack` p95 `427.1 ms` (target 1000 ms, even lower than the prior run),
production CSP smoke still `26 elements` with no violations, and Playwright `185 passed` (was
180) across the same five projects, including the new "an export revoked while delayed is never
offered for download" title. The only `ECONNREFUSED`/error-looking lines in the log belong to
`authoritative-world.spec.ts`'s own deliberate API-outage test, which is designed to produce them
and passes. No failures, no new skips.

### New findings from this re-review

**N1 (IMPORTANT — documentation currency).** `AGENTS.md`, `docs/README.md`,
`IMPLEMENTATION_STATUS_HANDOFF.md` and `IP-9-IMPLEMENTATION-REPORT.md` were updated only in
`711e1f9` (which recorded my *first* re-review's `G9 PASS` against `a59a58a`/`35955102973`) and
were **not** touched again by `d7430e3`. Right now, `AGENTS.md`'s IP-9 paragraph still names
`a59a58a38f338426cad757977b0dc657fe512a90` and CI `35955102973` as the approved behavior/evidence,
with no mention anywhere in tracked docs of the second, separate audit, its six findings, the
repair commit `d7430e3ede0ace1ef64df4d35899fa39b63e2fcf`, or CI run `35961891632` — I grepped all
four files and found zero matches for `d7430e3`, `35961891632` or any mention of a second audit.
A future agent reading `AGENTS.md` first (as the file itself instructs) would not learn that a
second review happened or that the approved baseline moved. This should be closed by updating
those documents to point at `d7430e3`/`35961891632` and record the second audit's six findings
and their resolution, the same way `711e1f9` recorded the first round. Not a BLOCKER — the code
fix itself is verified correct — but it is the same class of gap as the original I2 finding,
recurring.

**N2 (MINOR — fragile implicit coupling, not a defect).** The 30 s export-storage lease's safety
margin over S3's worst-case request time is correct as configured today but rests on two
hardcoded constants in different files/packages with nothing tying them together (see "The
assumption that S3 request time is bounded below the 30 s lease" above). Suggest a code comment
cross-reference (or deriving one bound from the other) so a future change to either cannot
silently reopen the original race. No test or behavior change requested.

No BLOCKER. No other new findings — the six audited items were each real and each is now fixed
completely and correctly, including the two sub-parts of findings 2 and 6 that go beyond what a
first reading of the audit's one-line summaries might suggest (the API-path lease gap inside
finding 1; the legacy-`READY`-row settlement gap inside finding 6, which is distinct from and
additional to the original I1 fix).

### Final verdict

**G9 PASS.**

Every finding from the second, independent audit was real, and every one is now fixed completely
and correctly, verified against the actual code and a genuinely green exact-SHA CI run
(`35961891632`, `headSha` confirmed, `success`) rather than accepted on the implementer's word.
The new concurrency tests exercise the actual races, not just the type signatures; the presigned-
URL removal strengthens rather than weakens the relevant frozen security contract; migration
`0047` is additive-only and does not disturb either append-only trigger; and Action, authority,
confirmation and all previously-applied migrations remain untouched. The one outstanding item is
documentation currency (N1), which I recommend closing before treating this Gate as fully
recorded, and N2 is an accepted, low-severity structural observation for the future.

---

## Closure — N1 and N2 — 2026-09-24

**N2 behavior fix reviewed:** `e1fa0a6498fb2f3b3af54db5cd9354d3b0dec626` (`git show e1fa0a6`, on
top of `d7430e3`). **CI reviewed:** run `35964085085` — confirmed via `gh run view 35964085085
--json headSha,conclusion`: `headSha` is exactly `e1fa0a6498fb2f3b3af54db5cd9354d3b0dec626`,
`conclusion` is `success`. Downloaded the full log and cross-checked every figure the implementer
reported: PostgreSQL suite `14 files / 154 tests` (was 153 — exactly the one new test added),
`pnpm check` `31 files / 251 tests` (was 250), `Migration check passed (47 migration)`, restore
drill `"rows": 172` with every named check still `"passed": true`, `perf:ack` acknowledgement
`p95: 508.8`, and Playwright `185 passed`. All match exactly. No failures in the log.

**N2 disposition: fixed correctly.** The prior 30 s lease vs. S3 worst-case-time coupling was
untested and implicit; `e1fa0a6` closes it two ways, not just one:
1. `packages/storage/src/index.ts` now exports `s3RequestTimeoutMs` (5000), `s3MaxAttempts` (2)
   and `s3WorstCaseCallMs` (`2 attempts × 2 (connection + request) × 5000 ms = 20000 ms`) — a more
   conservative bound than the original comment's "two attempts of five seconds" (10 s), since it
   now also accounts for the connection-timeout phase of each attempt, not just the request phase.
2. Critically, `S3ObjectStorage`'s constructor now clamps any caller-supplied
   `options.requestTimeoutMs` with `Math.min(options.requestTimeoutMs ?? s3RequestTimeoutMs,
   s3RequestTimeoutMs)`, and `maxAttempts` is no longer a bare literal but the same
   `s3MaxAttempts` constant, which `S3ObjectStorageOptions` does not even expose as configurable.
   This means the runtime S3 client's actual timeouts can **never** exceed the bound
   `s3WorstCaseCallMs` is computed from, regardless of what any future caller configures — this is
   an enforced invariant, not just a documented one. I checked the existing "unreachable store"
   test's explicit `requestTimeoutMs: 2000` still behaves as before (`Math.min(2000, 5000) =
   2000`, unaffected, since it was already below the cap).
3. `tests/integration/ip9-object-storage.test.ts` adds a `describe("IP-9 export storage lease",
   ...)` block containing `expect(exportStorageLeaseMs).toBeGreaterThan(s3WorstCaseCallMs)`,
   placed outside the `connectionString`-gated `suite(...)`, so it runs unconditionally on every
   CI invocation of this file (not only when a database is available) — a fast, always-on
   regression guard. `30000 > 20000` holds today, and the test now fails immediately if a future
   change to either constant, or to `exportStorageLeaseMs` in `packages/database/src/index.ts`,
   ever closes the margin. This fully addresses what I flagged N2 as: the coupling is no longer
   implicit or untested.

**N1 disposition: closed.** Reviewed the uncommitted working-tree diffs to `AGENTS.md`,
`IMPLEMENTATION_STATUS_HANDOFF.md` (header plus new §44), `IP-9-IMPLEMENTATION-REPORT.md`,
`IP-9-THREAT-MODEL.md`, `IP-9-RUNBOOKS.md` and `IP-9-FAULT-MATRIX.md` (`git diff -- AGENTS.md
docs`). All six are accurate against everything I independently verified across both re-reviews:
- `AGENTS.md` now names the second audit, both repair commits (`d7430e3`, `e1fa0a6`), the current
  approved SHA `e1fa0a6...` and CI `35964085085`, and correctly changes the export-storage
  description to "仅 API 签名的下载链接" (API-signed only, presigned removed) — matching finding 3's
  fix. It does not touch the existing, still-accurate sentences disclaiming a real provider call
  or production live enablement.
- `IMPLEMENTATION_STATUS_HANDOFF.md`'s header points at `e1fa0a6.../35964085085` as the current
  approved behavior and at new §44 for detail; §43 is kept as history rather than rewritten,
  exactly as this project's own documentation rule requires. §44 lists both repair commits with
  correct CI run numbers and lists the same figures I independently pulled from the raw log
  (154, 251, 47, p95 508.8 ms, 185); it explicitly states "What remains not proven is unchanged
  from §43," which is correct — I found no new claim of a real provider evaluation or a human
  assistive-technology review anywhere.
- `IP-9-IMPLEMENTATION-REPORT.md`'s new status line and §4.8 accurately walk through all three
  review rounds and each of the second audit's findings; §5's new evidence bullets for `d7430e3`
  (run `35961891632`: 47 migrations, ack p95 427.1 ms, 185 e2e) and `e1fa0a6` (run `35964085085`:
  154/251 tests, 47 migrations, 172 restore rows, ack p95 508.8 ms, ack-to-proposal p95 35.2 s,
  185 e2e) match the raw CI logs exactly, including a figure I had not previously spot-checked
  (`a59a58a`'s own ack p95 of 398.6 ms, run `35955102973` — verified now against my saved log:
  `"p95": 398.6` at line 1837, and `"p95": 35679` i.e. 35.7 s, both matching the report verbatim).
- `IP-9-THREAT-MODEL.md`'s updated "Signed download links…" row accurately reflects the
  API-signed-only design and explicitly credits `d7430e3` for removing presigned URLs "because
  they skipped both checks" — consistent with my finding-3 analysis in the prior section.
- `IP-9-RUNBOOKS.md` and `IP-9-FAULT-MATRIX.md`'s small additions (leave `storage_lease_until`
  alone during a manual retry; the two new race-test rows) are technically accurate against the
  code.
I grepped all six files (plus `IMPLEMENTATION_STATUS_HANDOFF.md`) for any claim of a real
provider evaluation or a human/screen-reader assistive-technology review having been performed:
every match is an explicit *disclaimer* ("No real provider was called," "No human
assistive-technology review," "has not been drilled against a real provider") — none was
softened, removed, or contradicted by the new material. No overstatement found.

### Final verdict

**G9 PASS.**

**Approved behavior SHA accepted by this review: `e1fa0a6498fb2f3b3af54db5cd9354d3b0dec626`**
(exact-SHA CI `35964085085`, `success`, `headSha` confirmed).

Both closure items are resolved: N2 is fixed with an enforced runtime invariant plus an
always-on regression test, not merely documented; N1's six affected documents now accurately
record the full history — original review, first repair, second independent audit, its repair,
and this closure — without rewriting or deleting any prior section, and without overstating real
provider evaluation or human assistive-technology review, both of which remain correctly
disclosed as open. No BLOCKER has been found across any round of this review.
