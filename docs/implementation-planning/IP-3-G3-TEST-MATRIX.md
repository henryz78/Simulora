# IP-3 G3 Test Matrix

| ID | Required behavior | Evidence |
|---|---|---|
| G3-01 | Submit returns durable `ACKNOWLEDGED` without Commit | `tests/integration/action-truth.test.ts` |
| G3-02 | Duplicate idempotency key returns same Action | `tests/integration/action-truth.test.ts` |
| G3-03 | Worker produces explicit provisional proposal | `tests/integration/action-truth.test.ts`, deterministic gateway |
| G3-04 | Confirmation binds actor, digest and expected head | migration trigger + repository integration |
| G3-05 | Commit atomically advances State Revision, Event, history and Branch head | `tests/integration/action-truth.test.ts` |
| G3-06 | Second Action starts after first recorded Action | `tests/integration/action-truth.test.ts`, `tests/e2e/action-truth.spec.ts` |
| G3-07 | Stale head is a conflict with no mutation | `tests/integration/action-truth.test.ts` |
| G3-08 | Progress frames are ordered and resumable | `tests/integration/action-truth.test.ts`, `/progress` and `/events` |
| G3-09 | Cancel/terminal state is explicit | Action status transition trigger + API endpoint |
| G3-10 | Desktop/mobile Action status copy remains understandable | `tests/e2e/action-truth.spec.ts` |
