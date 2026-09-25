# IP-10 LONG-01, Upgrade Rehearsal and Killed-Worker Drill

**Date:** 2026-09-25 · **Scope:** IP-10.3, IP-10.4 (rehearsal), IP-10.6 ·
**Evidence:** CI `36198101564` on `7964e7c`, `success`.

IP-10 is validation only. This report records the first green run of three
test-only items. It also records the one product defect they found, which was
repaired in a separate bounded track and passed independent review. It passes
no Gate.

## 1. LONG-01 (IP-10.3)

- **Harness:** `tests/integration/long01.test.ts`, with the fixture
  `packages/testkit/src/long01.ts` ("Brackwater Crossing").
- **Fixture:**
  - five Characters, each with two private facts;
  - three locations;
  - twenty scoped facts;
  - three ROUTINE relationships and one PROTECTED relationship;
  - three threads;
  - one high-tide constraint;
  - a `GUIDED + OPEN_ENDED` start.
- **Where it runs:** real PostgreSQL in both CI PostgreSQL steps.
- **Generation:** the deterministic adapter. No real provider was called.

| Session | Day | What happened |
|---|---|---|
| 1 | 1 | Relationship change 1 (Mara–Oren) |
| 2 | 2 | Resolve `thread.bell` |
| 3 | 3 | Ordinary Action with Duvan |
| 4 | 4 | Relationship change 2 (Sella–Duvan) |
| 5 | 5 | Ordinary Action with Oren |
| 6 | 6 | Direct L3 correction of the wrong stair-keeper fact |
| 7 | 8 | Relationship change 3 (Pell–Mara); the mid-scenario Commit |
| 8 | 9 | Participation GUIDED → DIRECT; the stale expectation is refused |
| 9 | 10 | Sella disagrees; response only (`COMPLETED_NO_EFFECT`) |
| 10 | 11 | Open a new thread |
| 11 | 12 | A real worker process is SIGKILLed mid-generation. The lease truly expires (`LEASE_EXPIRED`), the Action is recovered, and relationship change 4 commits once. |
| 12 | 13 | Branch from the mid Commit (it keeps GUIDED); an Action and an append-only Restore on it; ledger, consents and main unchanged |
| 13 | 15 | Model-profile change recorded; state and participation unchanged |
| 14 | 16 | Provider outage (503) and the declared fallback; relationship change 5 |
| 15 | 17 | Transformed failure against the high-tide constraint (`ATTEMPT_TRANSFORMED`) |
| 16 | 18 | Resolve `thread.stranger` |
| 17–19 | 19–21 | Ordinary Actions and one response-only Action |
| 20 | 30 | Return after the longest gap (nine days); orientation; response from Oren |

**Pass conditions (Validation Strategy §5.3), asserted in the test:**

1. **Identities stay distinct.** Five Characters each have one stable
   name/motive/stance signature, and the five signatures differ.
   - This is a structural rubric only. The model-quality judgment stays
     `EXTERNAL`.
2. **Private facts stay private.** No Character's private fact ID or statement
   appears in any other Character's compiled request (17 requests).
3. **The correction holds.** No compiled request after the correction contains
   the wrong statement, and the corrected statement reaches later context.
4. **Participation stays as changed.** The final participation is DIRECT /
   OPEN_ENDED, and the fork keeps GUIDED from its source Commit.
5. **Relationship changes keep their causes.** There are exactly five
   `RELATIONSHIP_SHIFTED` Events on main. Each carries a submitted cause Action
   and causal facts. The final states are:
   - Mara–Oren `trusting`;
   - Sella–Duvan `trusting`;
   - Pell–Mara `cordial`;
   - the protected oath `unsworn`.
6. **Threads end correctly.** `bell` and `stranger` are resolved, `ledger` is
   open, and the new thread and the transformed-failure follow-up thread are
   open.
7. **Branch and Restore.** Covered by session 12.
8. **The interrupted Action commits once.** Covered by session 11.
9. **No acknowledgement is lost silently.** Every submitted Action ends
   `COMMITTED` or `COMPLETED_NO_EFFECT`.

**Return orientation (session 20).** The orientation is a derived projection,
and the worker rebuilds it. The test runs no orientation worker, so it
behaves as that worker would:

- it checks that the stale projection labels itself as not `FRESH`;
- it rebuilds the projection;
- it checks that the result is `FRESH` at the authoritative head and has no
  pending Actions.

### 1.1 What the first runs found

| Run | Failure | Cause | Resolution |
|---|---|---|---|
| `36196508881` (`dcdfb66`) | The Branch switch was refused, yet the application-rule diagnostic listed no unresolved Action | **Product defect** (§2) | Separate bounded repair `28b0d8a`, reviewed |
| `36197080077` (`28b0d8a`) | `PARTICIPATION_EXPECTATION_MISMATCH` on the fork | Harness: the fork predates the participation change, so it correctly keeps GUIDED | `80491d1` (test only) |
| `36197423866` (`80491d1`) | The orientation showed an old situation | Harness: no worker had rebuilt the projection; the projection labelled itself stale | `e55179a` (test only) |
| `36197781164` (`e55179a`) | 19 sessions, but 20 are required | Harness: one session was missing from the schedule | `7964e7c` adds a day-3 ordinary Action; the pass condition is unchanged |

No product rule was relaxed to make LONG-01 pass.

## 2. Defect repair: a response-only Action blocked every Branch switch

**Defect.** Migration 0034 added the terminal status `COMPLETED_NO_EFFECT`.
The application guard in `selectBranch` counts it as resolved. The SQL trigger
`simulora.prevent_pending_active_branch_switch()` was last defined in 0028,
before that status existed, and was never updated.

- Once a Branch had a single response-only Action, every later Branch switch
  raised a raw SQL exception.
- The API does not map that exception, so the user would most likely have
  seen a 500.

**Authorization.** IP-10 is validation only, so the product owner chose a
separate minimal repair track on 2026-09-25.

**Repair** (`28b0d8a`, behavior commit):

- Successor migration `0049_branch_switch_no_effect_terminal.sql` redefines
  only that function. It is a verbatim copy of 0028 apart from the added
  status.
- A regression test in `re3-routine-effects.test.ts` checks both directions:
  - after a response-only Action, `selectBranch` succeeds;
  - with a truly unresolved Action, a raw SQL update is still refused by the
    trigger.

**Independent review** (Sonnet 5 Reviewer, 2026-09-25): **`PASS`**
(0B / 0I / 1M).

The Reviewer checked the following itself:

- 0049 differs from 0028 only by the status, and the trigger binding resolves
  to the new definition by name.
- It scanned the last definition of every SQL function and confirmed this was
  the only stale terminal-status list.
- The test exercises the trigger directly in both directions.
- The three later commits touch only the test harness.
- It checked CI `36197080077` (exact SHA: 170/171, the only failure being the
  later harness issue) and `36198101564` (all `success`).

- **Minor, accepted as a separate observation:** a raw trigger exception falls
  through to a 500 rather than a 409.
  - This predates the repair and applies equally to truly unresolved Actions.
  - In the normal path it cannot be reached. `selectBranch` locks the
    Continuity before its own 409 check, and concurrent Action inserts wait
    on that lock.
  - It is not changed in IP-10.

**Approved behavior:** `28b0d8a`. The current `main` at evidence time is
`7964e7c`: that repair plus three test-only commits.

## 3. Upgrade and rollback rehearsal (IP-10.4)

This is a CI step in `.github/workflows/ci.yml`:

1. The approved G9 release `c812d6c` migrates and seeds its own schema.
2. Its backup restores identically under its own drill. This is the rollback
   path.
3. Both copies then upgrade to the current migrations.
4. The current drill compares them.

Result in `36198101564`:

- The **only** difference is `app_meta.schema_migrations`, that is, the ledger
  `applied_at` timestamps.
- The ledger names and checksums match.
- Every integrity check passes.
- The current code can seed on top of the upgraded schema.

The compatibility matrix document is still to do.

## 4. Capacity and killed-worker drill (IP-10.6)

In the container step, 300 Actions run at concurrency 20 against the
containerized API and worker. That load is well above the LONG-01 fixture.
After more than 20 Actions have been processed:

- the worker container is SIGKILLed;
- a new worker container replaces it.

| Measure | Result |
|---|---|
| Acknowledgement p50 / p95 / p99 / max | 199 / 569 / 731 / 1003 ms (target p95 ≤ 1000 ms) |
| Undrained / errors | 0 / 0 |
| Actions left `ACKNOWLEDGED` or `GENERATING` | 0 |
| Actions with more than one `SUCCEEDED` attempt | 0 |
| Attempts closed by lease expiry | 0 |

**Limits, stated plainly:**

- **The kill landed between claims.** Deterministic generation is almost
  instant, so the killed worker had nothing in flight. The drill proves
  drain, recovery and exactly-once processing across a killed and replaced
  worker. It does not prove takeover of an in-flight Action. LONG-01
  session 11 proves that case with a real process kill and real lease expiry.
- **Queue delay is an observation, not a pass.** With a single worker,
  acknowledged-to-proposal is p50 28 s and p95 54 s at this load. The target
  is acknowledgement latency (NFR-007). Queue drain under production load
  depends on the worker count and the launch environment, which are
  `EXTERNAL` G10 decisions.

## 5. Still open in IP-10

- The `E2E-CONTINUITY-IMPACT` scenario (IP-10.2).
- The IP-10.4 compatibility matrix document.
- The IP-10.7 alert definitions.
- All external G10 decisions, and the human and specialist reviews.

No beta or launch is authorized.
