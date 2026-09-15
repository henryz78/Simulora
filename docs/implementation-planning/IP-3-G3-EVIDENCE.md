# IP-3 / Gate G3 Evidence — Action Truth

Historical slice evidence: earlier FAIL/pending states below are retained, not
current Gate decisions. G1–G6 are PASS on `eb55734`; see
[Final Independent / Integrated Review](G1-G6-FINAL-INTEGRATED-REVIEW.md) and
[Current Implementation Handoff](IMPLEMENTATION_STATUS_HANDOFF.md).

**Status:** `G3 REVIEW FAILED ON 9a3c711f — FOCUSED REPAIR AWAITING CI AND INDEPENDENT RE-REVIEW`

**Scope:** This slice implements the server-side Action Truth vertical path only. IP-4 Return/Continuity/Correction, Recovery, Character autonomy, World Studio, live model providers and formal deployment remain out of scope.

## Implemented contract

```text
ready
  → POST Action (durable ACKNOWLEDGED)
  → worker lease + deterministic generation
  → provisional draft / exact L3 proposal
  → direct confirmation bound to actor + digest + expected head
  → atomic Commit + State Revision + Event + history + Branch head
  → next Action can start from the new head
```

PostgreSQL is authoritative. A model output, progress frame or client cache cannot advance current truth. The first deterministic adapter updates one existing canonical fact so the complete proposal/confirmation/commit semantics are exercised without a live provider.

## Data and invariants

- `actions` is the durable process record and idempotency boundary.
- `generation_attempts` records at-least-once worker attempts and an authorized context manifest.
- `action_proposals` stores one exact, digest-bound L3 proposal per Action.
- `action_confirmations` binds the actor, proposal digest and expected Branch head.
- `world_commits`, `state_revisions`, `domain_events` and `conversation_entries` are written with the Branch-head CAS in one transaction.
- `action_progress_events` is ordered and resumable; `transactional_outbox` is deduplicated by topic/source key.
- Database triggers reject invalid Action status transitions, mismatched Branch/head references and unconfirmed Action Commits.
- Duplicate submit returns the original Action. Duplicate confirmation returns the existing Commit. A stale head produces `CONFLICT` without a World mutation.
- Cancel competes under the locked Action transaction; a committed Action is never reported as cancelled.

## Original verification record (before independent review)

This section preserves the original local evidence. It did not establish Ubuntu CI success or real PostgreSQL concurrency coverage; the independent review below supersedes any such interpretation.

The following local checks passed:

```text
pnpm format:check
pnpm typecheck
pnpm architecture:check
pnpm migrations:check
pnpm test
```

The full Playwright suite also passed for both desktop Chromium and the configured 390×844 mobile project:

```text
pnpm test:e2e
14 passed
```

The added PostgreSQL-compatible integration coverage exercises:

1. durable acknowledgement with no Commit;
2. duplicate idempotent submission;
3. worker generation into provisional/awaiting-confirmation;
4. exact confirmation and atomic Commit/head/state update;
5. repeated second Action with both committed history entries preserved;
6. stale submission rejected before generation;
7. ordered progress cursor/resume and terminal detection.

The browser Action Truth spec covers the same visible distinctions with a deterministic API fixture for desktop and the configured 390×844 project. The local static-preview run passed both tests on desktop Chromium and both tests on the 390×844 mobile project. Vite explicitly deduplicates the workspace React runtime so the production bundle renders the router and Action surface consistently.

## Independent G3 review and focused repair

Reviewed baseline: `9a3c711f7f363506a9279c002aa68d45d5683be3`.

Independent result: `FAIL — 1 BLOCKER / 2 IMPORTANT / 0 MINOR; READY FOR IP-4: NO`.
The [baseline Ubuntu CI run](https://github.com/henryz78/Simulora/actions/runs/33628275890) failed at lint, so its later build/container/browser steps were not evidence of success.

| Finding | Focused repair | Verification |
|---|---|---|
| Ubuntu lint fails | Use a type-only API service import; remove unused `ActionCandidate`; declare complete, stable polling-effect dependencies; replace the unsafe PGlite Pool cast and infer the test Pool from `createDatabasePool` (no undeclared root `pg` type import). | Local format, lint and typecheck; full Ubuntu `pnpm check` remains a required CI check. No lint rule was disabled. |
| IP-3 transaction/race tests did not use real PostgreSQL | Run Action Truth through the actual `pg` pool, migrations and `SIMULORA_DATABASE_URL`; CI explicitly runs `pnpm test:postgres` against PostgreSQL 17. This command fails immediately without a database URL, rather than reporting skipped tests as a database pass. | Eight IP-3 tests plus four IP-2 authoritative-spine tests run on real PostgreSQL in CI. Local ordinary `pnpm test` explicitly skips these twelve tests without a configured server. |
| Lost ACK retry creates another Action | Retain the submission key in the mounted World client until a valid Action acknowledgement or definitive 4xx rejection; network/5xx ambiguity preserves the key and has explicit safe-retry copy. A materially changed intent/head is a different submission. | Desktop and 390×844 tests drop the first response after simulated server acceptance and verify that retry sends exactly the same key and recovers the same Action. |

Additional changes directly supporting those findings:

- Concurrent database submissions use the existing unique idempotency constraint with `ON CONFLICT DO NOTHING`, then recover the winning Action; they do not create a second job/progress envelope.
- Real PostgreSQL tests submit duplicates concurrently, process the same Action concurrently, race cancel against confirmation, and assert one Commit with its State Revision, Domain Event, two history entries and matching Branch head. Existing stale-head, repeated-participation and progress-cursor cases remain.
- The IP-2 failed-read browser fixture stays unavailable until the test explicitly permits recovery. React StrictMode may issue multiple initial reads; the previous one-failed-request fixture could incorrectly recover before the user clicked Try again. Product read behavior is unchanged.

Repair local verification:

```text
format / lint / typecheck / architecture / migration checks: PASS
unit and local contract tests: 33 PASS, 12 PostgreSQL tests SKIPPED (no local server)
full workspace build: PASS
Playwright desktop + 390×844: 16 PASS, exit 0
git diff --check: PASS
```

The initial sandbox build failed on parent-directory access, not source compilation; the same `pnpm build` passed outside the sandbox. Browser tests also completed with exit 0 outside the sandbox. These local results do not substitute for PostgreSQL or Ubuntu CI. The focused repair commit's GitHub Actions run is the remote verification source and must be checked before G3 re-approval.

The retained client key is mounted-page retry state, not durable/offline storage. Once acknowledged, recovery uses the server's durable Action/history. No backend persistence is simulated by this client fix.

### Follow-up: built worker runtime

The [first focused repair CI run](https://github.com/henryz78/Simulora/actions/runs/33641874315) on `41d0494eb5ca4387d5c14643735e81b3477886b4` passed all twelve real PostgreSQL tests and the complete Ubuntu `pnpm check` (45 tests and workspace build). Its container startup then failed: the worker bundle raised `Dynamic require of "events" is not supported`. CI browser steps were skipped, not passed.

The worker inlines the internal database package but did not directly declare its `pg` runtime dependency, unlike the API. The bundler consequently inlined CommonJS driver code into ESM. The follow-up declares the same already-pinned `pg@8.23.0` for the worker, so the driver is externalized and included by `pnpm deploy`; no driver upgrade or database/Action semantics change is involved.

`pnpm runtime:check`, now run after build by `pnpm check`, starts the built worker entry in a child Node process, checks startup/readiness/shutdown, and fails on runtime loader errors. It reproduced the exact failure on the previous bundle. It uses an explicit unreachable test database URL, stops before the first poll and is not database-connectivity evidence. Real database tests and container smoke remain required independently.

After declaring the runtime dependency, the worker rebuilt successfully and `pnpm runtime:check` passed. The Linux CI smoke containers use host networking to reach the runner's PostgreSQL service and wait for a running worker plus its explicit readiness message instead of racing an immediate log read. This is an isolated CI arrangement, not production deployment configuration.

### Follow-up: independent lease-ownership finding

The Luna/max independent re-review of `de6af756c9b3c7fe59f39334be4a3fc3a808e56a` inspected the [successful Ubuntu CI run](https://github.com/henryz78/Simulora/actions/runs/33643203197). It returned `PASS WITH ISSUES — 0 BLOCKER / 1 IMPORTANT / 0 MINOR; READY FOR IP-4: NO`. The earlier repair findings were closed; the remaining IMPORTANT was missing lease renewal and attempt fencing. Green CI alone did not establish G3 approval.

Root cause: a generation lasting longer than the 30-second lease could be reclaimed, but both its success and error paths still wrote job/attempt/Action state without checking ownership. Unique Commit constraints prevented duplicate truth, but did not prevent a stale callback from completing or failing the replacement's job.

Focused repair contract:

- A live attempt renews its 30-second lease every 10 seconds. Renewal checks job ID, owner, monotonic job attempt number, exact generation-attempt ID, RUNNING status and an unexpired database-clock deadline. A failed/lost renewal stops renewing; an expired lease cannot be revived.
- Completion and failure both lock Action then job and recheck that same ownership tuple before any attempt, proposal, progress or job mutation. Losing ownership makes the callback read-only. The database lock establishes the completion boundary; no transaction is held during generation.
- Reclaim marks the abandoned attempt `FAILED / LEASE_EXPIRED` and starts a distinct attempt using the job's monotonically increasing attempt number. A reused worker name does not bypass the attempt fence. The worker composition also assigns a process-local unique name for attribution.
- Cancellation closes a RUNNING attempt as `FAILED / CANCELLED` and clears the lease in the cancellation transaction. It does not depend on the model callback returning and cannot be undone by a late callback.
- Claim, cancellation and completion use consistent Action-before-job locking. Success, failure and cancellation clear lease ownership. AVAILABLE jobs respect `available_at`.
- Existing generation-failure retry/dead-state behavior and explicit retry remain; an explicit retry never resets the fencing epoch. No new schema, broker, model provider, product API, UI behavior or IP-4 capability was added.

`tests/integration/action-lease.test.ts` adds eleven real-PostgreSQL tests, explicitly included in `pnpm test:postgres`:

1. live generation exceeds its original deadline while heartbeat renewal prevents takeover;
2. four stale success/failure cases, before and after replacement Commit, including a reused worker name and a stale third attempt that must not DEAD-mark the fourth attempt;
3. two expired-owner success/failure cases before any replacement starts;
4. two cancellation-during-generation cases with late success/failure;
5. failure exhaustion and explicit retry with a new epoch;
6. concurrent claim/cancellation without resurrection or lock-order deadlock.

Lease-expiry tests deliberately expire a real PostgreSQL lease to model a paused/crashed worker. The heartbeat test uses the same implementation with shorter server-side lease timings, a real database clock and no fake timers. Assertions cover attempt attribution, proposal uniqueness, unchanged progress after stale callbacks, unchanged World truth before confirmation, and at most one Commit.

Local focused-repair verification:

```text
pnpm check: PASS (format, lint, typecheck, architecture, migrations, tests, build, runtime smoke)
local tests: 33 PASS; 23 PostgreSQL tests SKIPPED because no local PostgreSQL server is configured
pnpm test:e2e: 16 PASS (desktop + 390×844), exit 0
git diff --check: PASS
```

The new commit still requires actual Ubuntu/PostgreSQL/container/browser CI verification and the same independent reviewer's re-review. Local skips are not database evidence; this document does not self-close the IMPORTANT finding.

## Explicit non-claims

- No live provider, model quality claim or unattended world-active mutation.
- No production retention, broker, distributed exactly-once or durable client/offline guarantee.
- No IP-4 Return/Continuity/Correction, P3 Recovery, P4 World Studio or formal deployment.

## Gate decision

This document records implementation evidence only. Gate G3 is not self-approved; an independent reviewer must verify the required journey and issue the external PASS/FAIL decision.
