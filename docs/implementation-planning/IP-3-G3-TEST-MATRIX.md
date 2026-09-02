# IP-3 G3 Test Matrix

| ID | Required behavior | Evidence |
|---|---|---|
| G3-01 | Submit returns durable `ACKNOWLEDGED` without Commit | `tests/integration/action-truth.test.ts` |
| G3-02 | Concurrent duplicate idempotency keys return the same Action | Real PostgreSQL `tests/integration/action-truth.test.ts`; one Commit asserted |
| G3-03 | Worker produces explicit provisional proposal | `tests/integration/action-truth.test.ts`, deterministic gateway |
| G3-04 | Confirmation binds actor, digest and expected head | migration trigger + repository integration |
| G3-05 | Commit atomically advances State Revision, Event, history and Branch head | Real PostgreSQL `tests/integration/action-truth.test.ts`; exact linked-row counts and head |
| G3-06 | Second Action starts after first recorded Action | `tests/integration/action-truth.test.ts`, `tests/e2e/action-truth.spec.ts` |
| G3-07 | Stale head is a conflict with no mutation | `tests/integration/action-truth.test.ts` |
| G3-08 | Progress frames are ordered and resumable | `tests/integration/action-truth.test.ts`, `/progress` and `/events` |
| G3-09 | Cancel/terminal state is explicit, including concurrent cancel/Commit | Action status transition trigger + API endpoint + real PostgreSQL race test |
| G3-10 | Desktop/mobile Action status copy remains understandable | `tests/e2e/action-truth.spec.ts` |
| G3-11 | Concurrent duplicate worker execution has one processing winner | Real PostgreSQL `tests/integration/action-truth.test.ts` |
| G3-12 | Lost ACK retry reuses the same submission key | `tests/e2e/action-truth.spec.ts`; response dropped after fixture acceptance, both viewports |
| G3-13 | IP-2 read-error recovery remains deterministic under StrictMode | `tests/e2e/authoritative-world.spec.ts`; unavailable until explicit retry, both viewports |
| G3-14 | Built worker ESM entry starts and shuts down with runtime dependencies | `pnpm runtime:check` after build, plus independent CI container smoke; fails on the old bundled CommonJS driver |
| G3-15 | Live slow generation renews its lease and cannot be reclaimed | Real PostgreSQL `action-lease.test.ts`; actual database clock crosses the original lease deadline |
| G3-16 | Expired/replaced attempt cannot finalize or fail another execution | Real PostgreSQL `action-lease.test.ts`; stale success/failure before/after takeover and Commit; same worker name, distinct epoch/attempt |
| G3-17 | Cancellation revokes running attempts; late callbacks do not resurrect work | Real PostgreSQL `action-lease.test.ts`; late success/failure and concurrent claim/cancel |
| G3-18 | Failure exhaustion and explicit retry preserve attempt lineage | Real PostgreSQL `action-lease.test.ts`; DEAD/FAILED_RECOVERABLE, retry without resetting epoch |

## Verification environment

- `pnpm test:postgres` requires `SIMULORA_DATABASE_URL` and runs the IP-2 spine, IP-3 Action Truth and IP-3 lease-ownership PostgreSQL suites. CI provides a PostgreSQL 17 service; PGlite is not used by Action Truth or lease tests.
- Without a configured database, ordinary `pnpm test` skips these twenty-three PostgreSQL tests. Skips are not a Gate pass.
- PGlite remains only in the separate migration smoke test; it is not transaction/concurrency evidence.
- Browser tests use deterministic HTTP fixtures. Database durability/concurrency is verified separately on real PostgreSQL; no browser-fixture result is promoted to backend evidence.
- Re-approval requires the focused repair commit's successful Ubuntu lint, complete build, PostgreSQL integration, container smoke and desktop/mobile CI steps, plus independent G3 re-review.
