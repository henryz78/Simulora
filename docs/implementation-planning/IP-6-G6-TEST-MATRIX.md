# IP-6 / Gate G6 Test Matrix

Status: `IMPLEMENTATION TEST MATRIX`

| Contract | Required evidence |
|---|---|
| Six independent combinations | Domain round-trip plus real PostgreSQL direct transitions through all 3×2 combinations; no combined enum. |
| Direct authority only | API authenticates the actor; cross-account change fails; one direct command creates one Action/Commit/State Revision/Event. |
| Exact state change | Database constraint and integration assertion prove only `participation` changes and Event contains complete before/after values. |
| Idempotency / concurrency | Lost-response retry returns the same Action; concurrent different changes against one head produce at most one Commit. |
| Stale expectation | Ordinary Action mismatch and direct before/head mismatch create no Action, Generation Attempt or World mutation. |
| Model boundary | Strict candidate validation rejects participation/avatar/protected fields; deterministic gateway never authors user speech/commitment. |
| Character source boundary | Owned Character Asset may be snapshotted; foreign/deleted source cannot create a new snapshot; an existing Revision remains playable after source deletion. |
| Character knowledge boundary | State/World allow-list validation plus generator-capture test proves filtering occurs before generation and excludes `ACCOUNT_PRIVATE`. |
| Character differentiation | Distinct identity, motive and stance reach context/output; disagreement/refusal remains character-attributed. |
| Direct / Guided / World-active | Deterministic orchestration tests cover each initiative contract; World-active copy and code remain user-cycle-bound. |
| Open / Goal-framed | Open-ended state/output contains no fabricated objective; Goal-framed activates only declared World objectives. |
| Responsive UX | Desktop and 390×844 complete current → review → exact apply → refresh and stale-review recovery with accessibility scan. |
| Regression / scope | Full check, real PostgreSQL suite, all E2E, builds and container smoke; G1–G5 invariants pass; no scheduler, live model or IP-7 code. |
