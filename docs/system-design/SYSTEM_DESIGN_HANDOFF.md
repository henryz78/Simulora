# System Design Handoff

Status: `SYSTEM DESIGN V1: FROZEN / ARCHITECTURE AUDIT: PASSED`

Date: `2026-08-27` (`Asia/Shanghai`)

“Frozen” means this design is coherent enough to constrain Experience Design, prototype and implementation. It may later be superseded by a dated, evidence-backed Product Definition change or ADR; it must not be silently weakened for implementation convenience.

## 1. Frozen artifacts

| Artifact | Status | Role |
|---|---|---|
| [System Design V1](SYSTEM_DESIGN_V1.md) | `FROZEN` | architecture posture, modules, authority and PRD mapping |
| [Domain, State and Data Model](DOMAIN_STATE_AND_DATA_MODEL.md) | `FROZEN` | original domain language, invariants and logical schema |
| [Runtime, Model and Persistence](RUNTIME_MODEL_AND_PERSISTENCE.md) | `FROZEN` | Action/Commit lifecycle, orchestration, recovery and portability |
| [API, Security and Operations](API_SECURITY_AND_OPERATIONS.md) | `FROZEN` | resource contracts, authorization, privacy, safety and failure behavior |
| [Architecture Decisions](ARCHITECTURE_DECISIONS.md) | `17 ACCEPTED ADRs` | binding technical decisions and change triggers |
| [Validation Strategy](VALIDATION_STRATEGY.md) | `FROZEN` | requirement tests, long-horizon scenario and release evidence |
| [Architecture Consistency Audit](ARCHITECTURE_CONSISTENCY_AUDIT.md) | `PASSED` | repaired findings and freeze gate |

## 2. Architecture in one paragraph

V1 is a responsive TypeScript/React web product backed by a TypeScript/Node.js modular monolith, an independently scalable worker, PostgreSQL and S3-compatible object storage. A user request becomes a durable idempotent Action; model work runs outside transactions and returns untrusted narrative/state proposals; deterministic application code validates authority, privacy, safety and causality; one short PostgreSQL transaction creates at most one Commit, immutable State Revision, causal Events, committed history and usage settlement. PostgreSQL is authoritative, while streams, summaries, embeddings, search and caches are projections. Continuities pin immutable World Revisions, Branches preserve originals, Restore is non-destructive, and no model/provider can directly mutate state.

## 3. Binding system truths

1. `WorldDraft`, `WorldRevision`, `Continuity`, `Branch`, `Action`, `Commit`, `StateRevision`, `History` and `DerivedMemory` are distinct concepts.
2. `initiative_mode` and `structure_mode` are independent. Default is `GUIDED + OPEN_ENDED`.
3. The user's avatar, protected commitments, permission, spend, share and delete operations require user authority.
4. Acknowledged means durably received and possibly unresolved; committed means state changed once.
5. Models propose. Deterministic server code validates and commits.
6. Canonical state is not inferred from prose, summaries, embeddings or rendered UI.
7. Branch preserves its source. Restore appends a new scoped Commit. Destructive rewind is not V1.
8. Existing Continuities never auto-adopt a new World Revision.
9. Privacy and character-knowledge scope are enforced before retrieval/ranking/model context.
10. No sensory feature is an MVP dependency, and WorldOS parity is never an implementation rationale.

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
- two independent participation dimensions;
- current state and its source/freshness;
- generated draft vs committed history;
- causal change, scope and correction path;
- Recovery Point, Branch, Restore and Delete as distinct actions;
- privacy/visibility and creator/recipient separation;
- usage quote/reservation/settlement behavior;
- quiet, reduced-motion, keyboard and screen-reader-complete core operation.

This list is behavioral, not an information architecture or screen list.

## 6. Prototype handoff constraints

A later prototype should prove one coherent vertical slice before broadening:

`playable World Revision → Continuity/Branch → acknowledged Action → generated proposal → validated Commit → return orientation → fact correction → Branch/Restore → interruption recovery`

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

`SYSTEM DESIGN V1: FROZEN`

`ARCHITECTURE AUDIT: PASSED`

`READY FOR EXPERIENCE DESIGN / PROTOTYPE: YES`

`PRODUCT IMPLEMENTATION: NOT STARTED`

Stop at this gate. Do not begin Experience Design, prototype or implementation without the user's next instruction.
