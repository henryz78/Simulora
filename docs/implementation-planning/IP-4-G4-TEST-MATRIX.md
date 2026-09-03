# IP-4 / G4 Test Matrix

Status: implementation in progress. This matrix defines the evidence required for G4; it is not a record of passing tests. Final results belong in `IP-4-G4-EVIDENCE.md`.

## Acceptance and evidence layers

| ID | Required behavior | Evidence required |
|---|---|---|
| G4-01 | Return identifies current situation, recent recorded changes, open threads and the next participation point | Orientation repository/API tests and desktop/mobile journey |
| G4-02 | No meaningful change has an honest empty state; recent history is not falsely described as unseen | Initial orientation and browser empty-state tests |
| G4-03 | A stale/rebuilding projection reports its source head and exposes authoritative fallback | Real PostgreSQL invalidation/rebuild tests and browser stale-state coverage |
| G4-04 | Projection rebuild cannot overwrite a later head with older content | Transaction/locking test or deterministic concurrency evidence |
| G4-05 | Global Continuity is a category/current-path landing, not one hard-coded fact | Both desktop and 390×844 landing → fact → explanation journeys |
| G4-06 | Explanation shows only permitted fact, source class/Commit, scope, freshness and correction path | API/schema tests and cross-account/character PostgreSQL adversarial tests |
| G4-07 | Legacy IP-3 events retain accurate provenance/scope after migration | Event payload `target`, Commit source and corresponding immutable State Revision regression |
| G4-08 | Trace pagination preserves every event in a returned Commit | Small-limit, multi-event Commit PostgreSQL regression |
| G4-09 | Correction/removal requires a direct authenticated Action, exact before/after, reason, stable target, digest and expected head | Real PostgreSQL submission/confirmation and negative binding tests |
| G4-10 | Proposed correction has no canonical effect before confirmation; cancel and stale confirmation do not mutate truth | Repository/API tests and browser confirmation/cancel/conflict states |
| G4-11 | Correction preserves the stable fact identity and old immutable history; removal excludes current use without deleting historical records | Before/after State Revision, Commit/Event/history and tombstone assertions |
| G4-12 | Correction changes no unrelated facts, character state, World clock, participation or World Revision | Exact snapshot invariants in real PostgreSQL/domain tests |
| G4-13 | Duplicate correction and confirmation remain effective-once; cancel/confirm has one legal terminal result | Real PostgreSQL concurrent requests and atomic row/head assertions |
| G4-14 | Subsequent generation uses corrected eligible canon, excluding private/ineligible or removed targets | Context-manifest capture and malicious-candidate validation tests |
| G4-15 | The deterministic adapter's no-eligible-fact limit is explicit; no fabricated fact or unresolved job loop | Pre-ACK rejection/no new rows and existing-job explicit-outcome coverage |
| G4-16 | Older pending participation survives correction and cannot commit against a stale head | Cross-operation PostgreSQL test and browser cross-surface journey |
| G4-17 | Pending Action remains visible across World, Return, Continuity and Context, including reload | Server recovery plus desktop/mobile navigation tests |
| G4-18 | Lost acknowledgement/confirmation is unknown until recovered, not falsely declared unchanged/successful | Response-loss tests; same-key retry and Action/status re-read |
| G4-19 | Direct URLs, close, browser Back and refresh preserve route/surface meaning | Browser journeys on both viewports |
| G4-20 | Keyboard, focus, Escape and status announcements remain understandable; no mobile obstruction | Focused keyboard/axe/pointer evidence with manual assistive-technology limits explicitly stated |
| G4-21 | G2 authoritative spine and G3 worker lease/fencing, SSE/polling, idempotency, atomicity and repeated participation remain valid | Entire existing unit, PostgreSQL and browser suites retained |
| G4-22 | Built API/worker artifacts and actual composition roots expose the new services | Full build/runtime checks, service wiring inspection and real PostgreSQL API tests; container smoke separately |
| G4-23 | IP-5/6/7, live model providers, formal deployment and frozen Prototype changes are absent | Final diff and independent scope review |

## Proof boundaries

- A passing HTTP-fixture browser test proves frontend semantics, not database persistence, privacy enforcement or worker concurrency.
- A PostgreSQL test is evidence only when it actually ran against `SIMULORA_DATABASE_URL`; a skipped suite is not a pass. PGlite migration smoke does not replace PostgreSQL concurrency tests.
- API injection tests and container health checks cover different boundaries. A startup health response alone does not prove that new application services are wired into the production entry point.
- The implemented direct target in this slice is a canonical fact. This matrix does not claim generalized editing of relationships, user notes, permissions or character knowledge.
- Automated accessibility checks do not establish manual screen-reader certification or the full pre-release platform matrix.
- Gate approval is an independent review decision, not inferred from CI being green.
