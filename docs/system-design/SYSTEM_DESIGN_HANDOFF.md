# System Design Handoff

Status: `SYSTEM DESIGN V1: FROZEN AFTER INDEPENDENT REPAIR / ARCHITECTURE AUDIT: PASSED AFTER INDEPENDENT REPAIR`

Date: `2026-08-27` (`Asia/Shanghai`)

“Frozen” means this design is coherent enough to constrain Experience Design, prototype and implementation. It may later be superseded by a dated, evidence-backed Product Definition change or ADR; it must not be silently weakened for implementation convenience.

## 1. Frozen artifacts

| Artifact | Status | Role |
|---|---|---|
| [System Design V1](SYSTEM_DESIGN_V1.md) | `FROZEN AFTER INDEPENDENT REPAIR` | architecture posture, modules, authority and PRD mapping |
| [Domain, State and Data Model](DOMAIN_STATE_AND_DATA_MODEL.md) | `FROZEN AFTER INDEPENDENT REPAIR` | original domain language, invariants and logical schema |
| [Runtime, Model and Persistence](RUNTIME_MODEL_AND_PERSISTENCE.md) | `FROZEN AFTER INDEPENDENT REPAIR` | Action/Commit lifecycle, orchestration, recovery and portability |
| [API, Security and Operations](API_SECURITY_AND_OPERATIONS.md) | `FROZEN AFTER INDEPENDENT REPAIR` | resource contracts, authorization, privacy, safety and failure behavior |
| [Architecture Decisions](ARCHITECTURE_DECISIONS.md) | `18 ACCEPTED ADRs` | binding technical decisions and change triggers, including independent repair closure |
| [Validation Strategy](VALIDATION_STRATEGY.md) | `FROZEN AFTER INDEPENDENT REPAIR` | requirement tests, long-horizon scenario and release evidence |
| [Architecture Consistency Audit](ARCHITECTURE_CONSISTENCY_AUDIT.md) | `PASSED AFTER INDEPENDENT REPAIR` | repaired findings and freeze gate |

## 2. Architecture in one paragraph

V1 is a responsive TypeScript/React web product backed by a TypeScript/Node.js modular monolith, an independently scalable worker, PostgreSQL and S3-compatible object storage. A user request becomes a durable idempotent Action; model work runs outside transactions and returns untrusted narrative/state proposals; deterministic application code validates authority, privacy, safety, causality and a closed continuity-impact minimum; one short PostgreSQL transaction creates at most one Commit, immutable State Revision, causal Events, committed history and usage settlement. An ordinary participation expectation is match-only; only a direct-user, expected-head contract-change Action may alter either independent participation axis. PostgreSQL is authoritative, while streams, summaries, embeddings, search, caches and Explanation Projections are non-authoritative projections. Continuities pin immutable World Revisions, Branches preserve originals, Restore is non-destructive, and no model/provider can directly mutate state.

## 3. Binding system truths

1. `WorldDraft`, `WorldRevision`, `Continuity`, `Branch`, `Action`, `Commit`, `StateRevision`, `History`, `DerivedMemory` and `Explanation Projection` are distinct concepts.
2. `initiative_mode` and `structure_mode` are independent. Default is `GUIDED + OPEN_ENDED`.
3. An ordinary `PARTICIPATE` expectation is match-only against the authoritative expected-head contract; only a direct-user `CHANGE_PARTICIPATION_CONTRACT` Action may change either axis and it creates an audited Commit/Event.
4. The closed L1/L2/L3 decision table preserves routine L2 evolution but makes user-authored/confirmed canonical continuity rewrite/removal, scope widening, protected relationship redefinition and canonical Memory Candidate promotion direct-user-authorized L3 operations.
5. Acknowledged means durably received and possibly unresolved; committed means state changed once.
6. Models propose. Deterministic server code validates and commits; models cannot change participation axes or perform L3 canonical continuity changes.
7. Canonical state is not inferred from prose, summaries, embeddings, Explanation Projections or rendered UI.
8. Branch preserves its source. Restore appends a new scoped Commit. Destructive rewind is not V1.
9. Existing Continuities never auto-adopt a new World Revision.
10. Privacy and character-knowledge scope are enforced before retrieval/ranking/model context and before Explanation Projection assembly.
11. No sensory feature is an MVP dependency, and WorldOS parity is never an implementation rationale.

## 4. Implementation baseline

- TypeScript + React responsive web client.
- TypeScript + Node.js API/worker from one modular codebase.
- Managed PostgreSQL as the authoritative store.
- S3-compatible object storage for approved assets and portable packages.
- Versioned HTTPS JSON APIs and resumable SSE.
- PostgreSQL-backed jobs and transactional outbox.
- Provider-neutral model gateway with versioned capability profiles.
- No microservices, distributed saga, Kafka, mandatory Redis, separate vector database, WebSocket or autonomous off-session scheduler in V1 without a superseding ADR.

Exact libraries and cloud vendor are deliberately not frozen. They are implementation selections inside this baseline, not permission to change the contracts.

## 5. Experience Design handoff constraints

Future Experience Design must make these states understandable without copying a competitor UI:

- durable acknowledgement vs generation vs confirmation vs committed vs recoverable failure;
- two independent participation dimensions, an ordinary match-only expectation and a direct user-authorized contract transition;
- current state and its source/freshness;
- a scope-filtered Explanation Projection showing only an accessible fact/change, permitted source class/Commit, scope, freshness and correction path;
- generated draft vs committed history;
- routine L2 causal change versus direct-user-authorized L3 canonical continuity change, scope and correction path;
- Recovery Point, Branch, Restore and Delete as distinct actions;
- privacy/visibility and creator/recipient separation;
- usage quote/reservation/settlement behavior;
- quiet, reduced-motion, keyboard and screen-reader-complete core operation.

This list is behavioral, not an information architecture or screen list.

## 6. Prototype handoff constraints

A later prototype should prove one coherent vertical slice before broadening:

`playable World Revision → Continuity/Branch → direct participation-contract transition → acknowledged Action → generated proposal → validated Commit → scope-filtered explanation → fact correction → Branch/Restore → interruption recovery`

It may use a fake/deterministic model adapter first, then one approved live capability profile. Visual spectacle, marketplace, multiplayer, destructive rewind, automatic World Revision merge and off-session autonomy are not required to validate the architecture.

This paragraph is a handoff boundary only; no prototype has been started.

## 7. Decisions still requiring later authority

- original launch content emphasis;
- commercial scale/retention and operational SLOs;
- launch jurisdictions and adult-verification implementation;
- detailed safety taxonomy, appeal SLA, licensing and privacy/legal policy;
- final pricing and provider/model presentation;
- any optional sensory layer;
- final brand and visual identity.

UX or implementation must not silently decide these as defaults. When a decision is required, record the product owner/specialist decision and add or supersede an ADR if architecture changes.

## 8. Change control

A proposed architecture change must state:

1. affected Product Requirement and acceptance condition;
2. current ADR/contract;
3. measured problem or new approved product decision;
4. authority, privacy, recovery and migration impact;
5. validation and rollback plan;
6. whether it supersedes an ADR.

Competitor behavior, future-scale anxiety or library availability alone is insufficient.

## 9. Final state

`RESEARCH: FROZEN`

`PRODUCT PRINCIPLES: FROZEN`

`PRODUCT DEFINITION V1: FROZEN`

`SYSTEM DESIGN V1: FROZEN AFTER INDEPENDENT REPAIR`

`ARCHITECTURE AUDIT: PASSED AFTER INDEPENDENT REPAIR`

`READY FOR EXPERIENCE DESIGN / PROTOTYPE: YES`

`PRODUCT IMPLEMENTATION: NOT STARTED`

Stop at this gate. Do not begin Experience Design, prototype or implementation without the user's next instruction.
