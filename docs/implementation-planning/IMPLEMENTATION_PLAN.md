# Simulora Implementation Plan V1

**Status:** `IMPLEMENTATION PLAN: APPROVED`

**Planning date:** `2026-08-29` (`Asia/Shanghai`)

**Experience Freeze commit:** `d9ae20c8dead3b94a4b2afb095943c79badc7752`

**Approved Experience implementation baseline:** `877f4d532024009ba44d99580e12ce088136304a`

**Product Implementation:** `NOT STARTED`

## 1. Purpose and authority

This plan translates the frozen Product Definition, System Design and Experience into an implementable engineering program. It does not redesign the product, reopen approved P1/P2/P3/P4 semantics, create production code, select launch content or authorize deployment.

When implementation details conflict, the controlling order is:

1. [Product Definition Handoff](../product/PRODUCT_DEFINITION_HANDOFF.md) and [Product Requirements](../product/PRODUCT_REQUIREMENTS.md).
2. [System Design Handoff](../system-design/SYSTEM_DESIGN_HANDOFF.md), accepted ADRs and system contracts.
3. [Experience Freeze Handoff](../deliverables/experience-structure/EXPERIENCE_FREEZE_HANDOFF.md) and approved end-to-end behavior.
4. This plan.
5. The frozen clickable Prototype as interaction evidence, never as runtime authority.

An implementation convenience may not weaken Action/Commit truth, user authority, privacy filtering, non-destructive recovery, World Revision pinning or accessibility. A material change to a frozen contract requires an explicit product decision and, where architecture changes, a superseding ADR.

## 2. Implementation posture

V1 will be built as one repository and one modular TypeScript codebase with three deployable runtime roles:

- a responsive React web application;
- a Node.js application API;
- a Node.js background worker built from the same server packages.

PostgreSQL is the only authoritative transactional store. S3-compatible object storage holds approved large assets and export/import artifacts while PostgreSQL retains identity, authorization, lifecycle and checksum authority. Model providers are accessed only through a provider-neutral server-side gateway. Long generation work runs outside database transactions.

The program deliberately starts with a deterministic model adapter. The first engineering proof is not prose quality; it is that one acknowledged Action can survive interruption, produce a proposal, require confirmation when appropriate, Commit at most once, advance one Branch head, remain explainable and recover without silent loss.

## 3. Production application versus frozen Prototype

### 3.1 Repository relationship

The current Prototype remains at:

```text
prototypes/simulora-experience/
```

The production codebase will be created separately under root-level `apps/` and `packages/`. Production packages must not import source files from the Prototype, depend on its build, or treat its fixture state as API/schema truth.

The Prototype remains useful as:

- frozen comprehension and regression evidence;
- an interaction-language reference for Action truth, Return, Continuity, Recovery and World Studio;
- a responsive-behavior reference for desktop and 390×844 mobile;
- an oracle for approved distinctions such as proposal versus truth, original versus Branch, and R-03 versus R-04.

It is not:

- the production frontend foundation;
- a component library;
- a backend scaffold;
- a source of database schema or API payloads;
- a source of durable-state behavior;
- a reason to retain Manus-specific tooling or fixture navigation.

### 3.2 Selective reuse rule

No wholesale copy is planned. A small visual or interaction primitive may be reimplemented after all of these checks:

1. it expresses a frozen Experience contract;
2. its code and assets have clear provenance and compatible licensing;
3. it meets production accessibility and responsive acceptance;
4. it does not carry OBS/fixture/Manus behavior;
5. it is covered by production tests rather than Prototype assumptions.

Quiet Observatory, Living Draft and Fieldbook clarity are experience-direction inputs. Exact Prototype CSS, component structure and hard-coded Greyhaven state are not frozen production implementation.

### 3.3 Prototype residue prohibited from production

The following must not cross into production by default:

- `OBS 01/02/03/04`, slice tabs and reviewer-only chrome;
- `fixture`, `stage`, `slice` or similar test query parameters as product navigation;
- `sessionStorage` as Action, Continuity, Branch, Revision or draft authority;
- hard-coded `C-118`, `C-119`, `C-120`, `R-03` or `R-04` business records;
- Manus runtime, debug collector, storage proxy, `/__manus__/...` routes and `/manus-storage/...` assets;
- `ManusDialog`, Manus login wording or environment-specific host allow-lists;
- the Prototype Express static server as the production API;
- the scaffold's broad unused component inventory;
- fake success copy that says a Branch, Restore, safe point or Commit occurred without a server record;
- prototype-only analytics placeholders, local logs and environment assumptions;
- visual assets without repository provenance and ordinary-clone reproducibility.

## 4. Planned repository topology

The target structure is a pnpm workspace with TypeScript project references and explicit package boundaries:

```text
Simulora/
├─ apps/
│  ├─ web/                         React production web client
│  ├─ api/                         Node.js HTTP/SSE composition root
│  └─ worker/                      Node.js durable-job composition root
├─ packages/
│  ├─ contracts/                   Versioned API/event schemas and generated OpenAPI inputs
│  ├─ domain/                      Pure invariants, state transitions and impact classification
│  ├─ application/                 Use cases, command handlers and transaction orchestration
│  ├─ database/                    PostgreSQL repositories, SQL migrations and transaction helpers
│  ├─ jobs/                        Durable-job leasing and transactional-outbox delivery
│  ├─ model-gateway/               Capability profiles, adapters and structured-output validation
│  ├─ auth/                        Auth/session port, authorization helpers and policy interfaces
│  ├─ storage/                     S3-compatible object-store port and adapters
│  ├─ observability/               Logs, metrics, tracing and redaction policy
│  ├─ ui/                          Audited accessible primitives and design tokens
│  ├─ testkit/                     Synthetic fixtures, fake providers, clocks and fault injection
│  └─ config/                      Typed environment/config loading without secrets in source
├─ db/
│  ├─ migrations/                 Ordered forward migrations
│  ├─ seeds/                      Original synthetic development/evaluation seeds
│  └─ checks/                     Integrity and migration verification SQL
├─ deploy/
│  ├─ containers/                 Docker build definitions
│  ├─ local/                      Local PostgreSQL/MinIO/dev support
│  └─ environments/               Vendor-neutral environment manifests/templates
├─ tests/
│  ├─ contract/
│  ├─ integration/
│  ├─ e2e/
│  ├─ fault/
│  ├─ accessibility/
│  ├─ security/
│  └─ long-horizon/
├─ prototypes/simulora-experience/ Frozen experience evidence; no production imports
└─ docs/implementation-planning/   This planning package
```

This is a modular monolith, not a monorepo of independent services. `apps/api` and `apps/worker` are thin composition roots over the same application/domain/database packages. Module ownership is enforced with package exports, dependency rules and architecture tests.

## 5. Implementation-level technology selections

These selections fill the accepted `ARCH-MIN-001` implementation seam without changing an ADR. Exact versions are chosen at implementation kickoff after compatibility and security review.

| Area | Planned selection | Reason / boundary |
|---|---|---|
| Workspace | pnpm workspace + TypeScript project references | Matches current repository tooling while keeping package dependencies explicit. |
| Web build | React + TypeScript + Vite | Authenticated responsive application does not require SSR for V1; no dependency on Prototype build. |
| Product routing | React Router data router | Real URLs, nested surfaces, refresh and browser Back; OBS/query fixtures excluded. |
| Server-state client | TanStack Query or equivalent query cache | Cache remains a versioned projection; mutations always recover from server Action/status. |
| Local UI state | React state/reducer and form state | Only unsent input, disclosure, focus and transient route state; never authoritative World state. |
| API runtime | Fastify on Node.js | Typed plugin boundaries, bounded request lifecycle, JSON/OpenAPI and SSE support. |
| Validation/contracts | Zod-compatible runtime schemas + generated OpenAPI | One versioned schema source for client/server contracts; domain validation remains separate. |
| PostgreSQL access | `pg` + Kysely typed query layer and reviewed SQL migrations | Keeps SQL/constraints visible; avoids ORM objects becoming domain authority. |
| Jobs/outbox | Explicit PostgreSQL tables and lease repository using transactional SQL | Implements frozen durable-job/outbox contract without adding a broker. |
| Tests | Vitest for unit/contract; Playwright for browser/E2E; axe plus manual assistive-technology checks | Supports deterministic, mobile, accessibility and cross-surface Gates. |
| Local object store | MinIO-compatible local adapter | Exercises S3 contracts without selecting a cloud vendor. |
| Telemetry | OpenTelemetry-compatible traces/metrics + structured JSON logs | Vendor-neutral and supports required correlation/redaction. |
| Packaging | Multi-stage containers for API/worker; static web artifact | Matches the frozen containerized delivery posture. |

If a selected library cannot preserve the frozen semantic contracts, the library changes—not the contract. WebSockets, Redis, Kafka, a separate vector database, microservices and an autonomous scheduler remain unauthorized without measured need and a superseding ADR.

## 6. Runtime and module boundaries

### 6.1 Web client

The web client owns:

- route and responsive presentation;
- accessible form/input behavior;
- local unsent text and recoverable local authoring edits;
- query cache keyed by resource ID, Branch head and schema version;
- resumable SSE connection and polling fallback;
- explicit display of current, stale, pending, provisional, confirmation, conflict and committed states.

The client must not:

- generate authoritative IDs;
- infer Commit from streamed output;
- advance a Branch head locally;
- mutate participation through ordinary Action input;
- resolve stale-head conflicts automatically;
- decide visibility or consequence impact;
- use local storage as durable product truth.

### 6.2 Application API

The API owns bounded synchronous work:

- authentication and coarse authorization;
- schema/version validation;
- idempotency lookup;
- expected-head and match-only participation validation;
- direct operation classification;
- usage quote/reservation attachment when enabled;
- atomic persistence of Action + job + optional reservation;
- authoritative reads and scope-filtered projections;
- confirmation/cancel race coordination;
- SSE delivery and polling recovery.

It does not perform long model generation inside the request, hold a Branch lock across model work or trust a client/model impact label.

### 6.3 Worker

The worker owns asynchronous execution:

- leased durable jobs with heartbeat, retry bounds and dedupe keys;
- context compilation from a fixed expected head;
- model capability routing and Generation Attempts;
- structured-proposal validation;
- deterministic direct operations;
- transition to `AWAITING_CONFIRMATION` when required;
- the short final Commit transaction;
- projection, export/import, deletion and cleanup jobs;
- outbox delivery and projection rebuild.

Worker retry is at-least-once. Database constraints and transaction checks provide product-level effective-once results.

### 6.4 Model gateway

The gateway exposes product tasks only. Provider adapters receive a minimized authorized context and return untrusted structured data. They never receive database credentials, user account secrets, eligibility/payment details or mutation authority.

The first adapter is deterministic and fixture-driven. One live profile is introduced only after structural, privacy and authority tests pass against the fake adapter.

## 7. PostgreSQL authoritative data model implementation

### 7.1 Physical strategy

The logical tables in [Domain, State and Data Model](../system-design/DOMAIN_STATE_AND_DATA_MODEL.md) map directly into PostgreSQL. V1 uses normalized relational metadata plus immutable JSONB documents where the frozen design defines versioned structured documents.

Use JSONB for:

- `world_drafts.document`;
- `world_revisions.document`;
- `state_revisions.canonical_document`;
- `action_proposals.candidate_transition`;
- typed event payloads, context manifests and derived projection payloads.

Use relational columns and closed enums/check constraints for identity, ownership, lifecycle, scope, status, linkage, timestamps, hashes, expected heads, idempotency and usage settlement. Protected authority must never exist only inside unindexed/unconstrained JSON.

### 7.2 Database roles

At minimum:

- `migration_role`: schema changes only through reviewed deployment jobs;
- `api_role`: bounded read/write access for synchronous use cases;
- `worker_role`: job leasing, attempts, proposal/commit/projection work;
- `read_audit_role`: isolated operational read access with audited use.

The model gateway/provider has no database role. Application authorization remains primary; query scoping and optional row-level security are defense in depth.

### 7.3 Immutability and integrity

Database-enforced minimums include:

- unique `(actor_account_id, operation_scope, idempotency_key)` on retained Actions;
- unique `world_commits.action_id`;
- unique `state_revisions.source_commit_id`;
- Branch-head Commit belongs to the same Branch;
- unique World revision number and immutable content hash;
- confirmation digest binds action, proposal, actor, expected head, scope and expiry;
- usage settlement/release uniqueness per Action;
- closed status, visibility, operation and event registries;
- no mutation accepted after resource tombstone;
- Branch compare-and-swap through `head_commit_id` plus `row_version`;
- direct participation change and canonical correction Event requirements checked by application and database consistency checks.

Append-only tables (`world_commits`, `state_revisions`, `domain_events`, committed `conversation_entries`, usage ledger) are written through narrow repositories. Production application roles do not expose generic update/delete methods for them. Where practical, database triggers reject mutation outside migration/governed purge paths.

### 7.4 Branch initialization

To satisfy the same-Branch head invariant, Continuity initialization and Branch creation use one transaction:

1. insert Continuity/Branch identity in initializing state;
2. create the initial or `BRANCH_FORK` Commit in the new Branch;
3. create the immutable State Revision;
4. set the Branch head to that Commit;
5. activate the Branch/Continuity only before transaction commit.

No externally visible Branch exists with a missing head.

### 7.5 Physical helper tables

Implementation may add non-authoritative physical support tables without changing the domain model:

- `action_progress_events`: ordered resumable SSE frames with per-Action sequence/cursor and bounded retention;
- `projection_checkpoints`: worker progress and source-head tracking;
- `schema_migrations`: applied migration identity/checksum;
- `job_dead_letters`: visible operational state if not represented directly by `durable_jobs`.

These records cannot become canonical World truth. `GET /v1/actions/{id}` and the Commit/State Revision remain the recovery authority even if progress frames expire.

### 7.6 No premature physical optimization

Initial implementation uses full immutable State Revision JSONB documents as frozen. It does not introduce event-sourcing replay, state-delta chains, table partitioning, a separate vector database or cross-service replication. State size, query plans and projection lag are measured before a physical optimization proposal. Any optimization must preserve hashes, export compatibility, Branch/Restore behavior and authoritative fallback.

## 8. State ownership matrix

| Information | Owner / durable store | Client treatment | Recovery behavior |
|---|---|---|---|
| Unsent Action text | Client local UI state; optional local draft | Editable; never “received” | May be locally recovered; no server Action exists. |
| Action envelope/status | PostgreSQL `actions` | Query/SSE projection | Recover by Action ID/idempotency key. |
| Provisional generated output | Generation Attempt + bounded progress record | Explicitly provisional | May disappear after retention; never treated as history/truth. |
| Protected proposal | `action_proposals` | Exact target/effect/scope review | Digest/head-bound confirmation; expires or conflicts. |
| Confirmation | `action_confirmations` | Shows actor, effect and expiry | Cannot be replayed against changed head/effect. |
| Current World truth | Branch head → Commit → State Revision | Read-only projection keyed to head | PostgreSQL authoritative fallback. |
| Committed history | Commit-linked events/conversation entries | Paged filtered read | Append-only; correction supersedes, not erases. |
| World Draft | PostgreSQL mutable authoring document + row version | Editable authoring state | Optimistic conflict; local unsent fallback allowed. |
| World Revision | PostgreSQL immutable document | Read-only playable definition | New revision; existing Continuities stay pinned. |
| Derived Memory | PostgreSQL projection rows/indexes | Labeled derived/freshness | Rebuild/expire without changing canon. |
| Return Orientation | Derived projection with source head | Stale marker or authoritative fallback | Rebuild from committed sources. |
| Explanation Projection | Scope-filtered on-demand read | Never raw prompt/reasoning | Reassemble from authorized current records. |
| Recovery Point | PostgreSQL Commit reference | User label over immutable point | Label deletion does not remove Commit. |
| Export/import artifact | Object storage + PostgreSQL manifest/status | Authorized signed access | Checksum/version/retry; never direct canonical mutation. |

## 9. Real Action → Proposal → Confirmation → Commit chain

### 9.1 Submit and durable acknowledgement

`POST /v1/branches/{id}/actions` executes one short transaction:

1. authenticate Account and check eligibility/resource access;
2. validate API/schema version and operation class;
3. look up the idempotency tuple and return the existing Action if present;
4. load expected Branch head and participation contract;
5. reject stale head or mismatched ordinary participation expectation before generation;
6. validate quote/allowance when applicable;
7. insert `actions`, optional `usage_reservations`, `durable_jobs` and an acknowledged progress/outbox record;
8. commit and return `actionId`, `ACKNOWLEDGED`, expected head and SSE URL.

The one-second p95 target ends here. No generated result is required before acknowledgement.

### 9.2 Generate and validate

The worker leases the job, creates a Generation Attempt and moves the Action through `GENERATING` and `VALIDATING`. It compiles an authorized Context Manifest pinned to the expected State Revision, invokes the selected capability profile and persists only bounded diagnostics/progress before validation.

The candidate validator independently derives the consequence level and rejects:

- schema/registry violations;
- unauthorized sources or knowledge leakage;
- user-avatar/permission/spend/delete mutation;
- participation-axis mutation from an ordinary Action;
- causal references outside the authorized manifest;
- protected canonical supersession/removal/scope widening without the direct L3 path;
- changes inconsistent with the pinned World Revision or current expected state.

### 9.3 Confirmation

If the validated effect requires exact direct confirmation:

1. persist `action_proposals` with canonical digest, expected head, impact, expiry and display-safe effect;
2. set Action to `AWAITING_CONFIRMATION`;
3. emit a resumable `confirmation.required` frame;
4. accept confirmation only for the same actor, proposal digest and expected head;
5. revalidate authority and expiry before storing `action_confirmations`.

Reject/cancel leaves current World truth unchanged. A changed Branch head invalidates the prior confirmation and requires a fresh review.

### 9.4 Commit transaction

The worker or direct-operation handler opens one short transaction and:

1. locks/reloads the Action and current Branch row;
2. returns the existing Commit if one already exists;
3. rechecks actor/grant/policy/eligibility and Action processability;
4. rechecks expected head and proposal/confirmation digest;
5. validates final canonical document and exact change set;
6. inserts one Commit, State Revision, Domain Events and final conversation entries;
7. settles/releases usage exactly once;
8. advances Branch head through compare-and-swap;
9. inserts outbox/projection records;
10. marks Action `COMMITTED` and commits the transaction.

If compare-and-swap fails, no World mutation is written. The Action becomes `CONFLICT` in a separate safe transition and retains enough information for deliberate user review; there is no automatic merge/rebase.

### 9.5 Client completion

`action.committed` contains identifiers and final committed entries only after transaction success. On SSE loss, the client queries `GET /v1/actions/{id}` and the resulting Commit rather than resubmitting a new intent. The World screen refreshes by the returned head Commit ID and may separately show stale derived projections.

## 10. Effective-once, idempotency and stale-head plan

Simulora does not claim distributed exactly-once delivery. It implements effective-once product outcomes:

- client retries use the same idempotency key until the API returns an Action;
- duplicate submission returns the same Action/status;
- workers may retry the same durable job and create multiple Generation Attempts;
- only one Commit may reference an Action;
- only one Branch head compare-and-swap may win for a given expected head;
- only one terminal usage settlement/release sequence is accepted per Action;
- outbox consumers use source/topic/dedupe uniqueness;
- external object/export operations use deterministic object/job keys and checksum verification;
- cancel and Commit compete under one transactionally checked Action status;
- after Commit wins, cancel returns the committed result and never claims cancellation;
- after cancellation wins, no Commit is permitted;
- stale direct confirmations are rejected rather than silently applied to a new effect.

Command handlers return stable reason codes such as `BRANCH_HEAD_CONFLICT`, `PARTICIPATION_EXPECTATION_MISMATCH`, `CONFIRMATION_EXPIRED`, `PROPOSAL_CHANGED`, `ACTION_ALREADY_COMMITTED` and `ACTION_CANCELLED`.

## 11. Commands, domain events and delivery events

Three vocabularies remain separate:

### Product commands

Direct intent handled by application services, including:

- `CreateWorld`, `UpdateWorldDraft`, `CreateWorldRevision`, `StartContinuity`;
- `SubmitParticipationAction`, `ChangeParticipationContract`;
- `CorrectContinuity`, `RemoveContinuity`;
- `CreateRecoveryPoint`, `CreateBranch`, `PrepareRestore`, `ConfirmRestore`;
- `RequestExport`, `StageImport`, `AcceptImport`, `PrepareDeletion`, `ConfirmDeletion`.

### Domain events

Committed facts of the product domain, including:

- `CONTINUITY_STARTED`, `BRANCH_FORKED`, `PARTICIPATION_CONTRACT_CHANGED`;
- typed causal World/Character/Relationship/Thread events;
- `CONTINUITY_ITEM_CORRECTED`, `CONTINUITY_ITEM_REMOVED`;
- `STATE_RESTORED`, lifecycle and usage events.

Domain events are append-only causal/audit records and are not transport messages.

### Delivery/projection events

Outbox topics and SSE frames such as `action.status`, `generation.draft`, `action.committed` and `projection.updated`. They may be redelivered, retained for a bounded period or rebuilt; they do not become canonical truth.

## 12. Continuity, history, generated output and memory

### 12.1 Continuity

Current Continuity truth is read from the active Branch head and its State Revision. Facts, relationships, open threads, character runtime state, objectives and interaction boundaries use stable IDs, scope and provenance.

Correction never edits an old State Revision. It creates a direct user-authorized Action and a new Commit/State Revision that supersedes or removes the target while retaining historical provenance.

### 12.2 History

Committed narrative and user-facing output are copied into ordered `conversation_entries` only inside the Commit transaction. A generated sentence is not history merely because it was streamed. Domain Events and conversation history are both linked to the Commit but serve different purposes.

### 12.3 Generated output

Generation Attempts retain provider/profile/config/latency/usage/error metadata. Raw or partial content has short, policy-controlled diagnostic retention and is excluded from ordinary history, export and logs by default. Provisional frames carry Action/attempt identity and an explicit non-authoritative label.

### 12.4 Derived Memory and retrieval

The initial implementation uses scoped relational/source filters and PostgreSQL full-text retrieval. Derived summaries retain source IDs, scope, compiler/generator version and source-head freshness. A separate vector database is not planned. A PostgreSQL vector extension may be evaluated later only if measured retrieval quality/latency needs it and privacy filtering remains source-first.

Authorization and character knowledge scope are resolved before ranking. Rebuilds cannot promote a Memory Candidate or revive corrected canon. Explanation Projection is assembled on demand from permitted current state and provenance; it does not read raw provider reasoning.

## 13. Branch, Restore, Correction and Revision implementation

### 13.1 Recovery Point

A Recovery Point inserts a user-owned label referencing an accessible Commit. It copies no state. Its create/delete operations are idempotent and cannot change Branch head.

### 13.2 Branch

Branch creation creates a new Branch, `BRANCH_FORK` Commit and copied immutable State Revision in one transaction. Source Branch/head/history remain unchanged. The new Branch starts with the copied participation contract and records cross-Branch lineage. V1 has no merge.

### 13.3 Restore

Restore is two-step:

1. a read-only restore proposal calculates selected sections, before/after effect, source Commit, current expected head and digest;
2. exact confirmation creates a new Commit on the current Branch using approved restorable sections.

Restore excludes participation contract, Branch-local interaction boundaries, identity/eligibility/consent, grants, ownership, usage, exports and account governance. A changed head invalidates the proposal. Intervening history stays available.

### 13.4 Correction/removal

Correction targets stable canonical IDs and is always a direct L3 operation with before/after scope, reason and current-head binding. The new State Revision records supersession/removal; old Commit/Event/history remains. Derived projections are invalidated and rebuilt from the new head.

### 13.5 World Draft and World Revision

World Studio edits `WorldDraft` through optimistic row-version updates. A saved production Draft is durable authoring state but is not current Continuity. Validation produces findings only. Creating a World Revision produces an immutable playable definition for new Continuities or future explicitly approved workflows.

Existing Continuities remain pinned. V1 does not implement automatic R-04 adoption, merge into R-03 or silent live-world upgrade. A future adoption workflow requires a product decision and ADR.

## 14. Participation Contract implementation

The two axes are stored only in the head State Revision:

```text
initiative_mode: DIRECT | GUIDED | WORLD_ACTIVE
structure_mode: OPEN_ENDED | GOAL_FRAMED
```

Every ordinary `PARTICIPATE` command includes a complete `participationExpectation` and expected head. The API compares both values before acknowledgement/job creation. The model cannot return or mutate these fields in an ordinary candidate; validators reject the attempt.

`CHANGE_PARTICIPATION_CONTRACT` is a separate direct deterministic command. It presents before/after meaning, carries the complete replacement pair and expected head, creates one Commit/Event and returns conflict on stale head. World-active V1 remains bounded to user-triggered cycles or explicit session-boundary continuation; no off-session scheduler is planned.

## 15. Frontend implementation strategy

### 15.1 Product surfaces

Production routes reflect product concepts, not Prototype slices. A provisional route map is:

```text
/worlds
/worlds/:worldId/studio
/continuities/:continuityId
/continuities/:continuityId/return
/continuities/:continuityId/continuity
/continuities/:continuityId/recovery
/actions/:actionId
```

Fact Lens and World Context may be nested route overlays so URL, refresh and Back remain coherent. The final route spelling is implementation detail; surface responsibility and navigation semantics are frozen.

### 15.2 Shared responsive mental model

Desktop and mobile use the same route/state model and API contracts. Layout changes at responsive boundaries:

- World remains primary;
- Continuity remains a global current-path entry plus contextual fact Lens;
- Recovery and Studio remain secondary/contextual;
- mobile may use bottom navigation, sheets and sequential review;
- desktop may use contextual panels and wider comparison;
- neither form factor loses authority, recovery, pending Action or freshness information.

No separate mobile feature subset or desktop reviewer console is planned.

### 15.3 Client data discipline

- Query keys include resource ID and source head where relevant.
- Mutation responses update by returned server IDs/head, never optimistic canonical state.
- Optimistic UI is allowed only for reversible local presentation, not Commit truth.
- Pending Actions survive route changes because they are server resources, not mounted-component state.
- Refresh recovers Action, Branch, Draft and proposal state from APIs.
- Stale projections disclose their source head and provide authoritative fallback.
- Browser history tests cover enter, close, explicit Return, refresh and Back for all secondary surfaces.

## 16. Accessibility hardening as a delivery track

Accessibility is not a final cleanup phase. Every vertical slice has acceptance for:

- semantic headings, landmarks and programmatic status names;
- full keyboard operation and visible focus;
- focus entry, trap where appropriate, restoration and Escape behavior for overlays;
- screen-reader announcement of acknowledgement, provisional, confirmation, conflict, wait and Commit states;
- no status meaning conveyed by color, motion or sound alone;
- reduced-motion and no-audio completeness;
- contrast and text resizing/zoom checks;
- 390×844 pointer/touch targets and fixed-navigation overlap;
- error association, recovery instructions and non-leaking access messages.

Automated axe checks run in CI for every core route. Keyboard and screen-reader manual walkthroughs are required at each product Gate, with a full supported-browser/assistive-technology matrix before release. The Prototype's known focus/Escape gaps are test inputs, not code to inherit.

## 17. Migration, seed and test strategy

### 17.1 Migrations

- Every schema change is an ordered, checksummed migration reviewed with its application change.
- Prefer additive expand/backfill/switch/contract sequencing.
- API/worker support the current schema and the explicitly supported prior deployment version during rollout.
- Immutable World/State documents are never rewritten in place for semantic upgrades; use read adapters or separately recorded transformed copies.
- Migrations affecting authorization, export, recovery, state meaning or lifecycle require ADR review and rehearsal on a production-shaped dataset.
- Every release records forward migration, verification and rollback/roll-forward procedure.

### 17.2 Seeds and fixtures

Maintain separate, original fixtures:

- minimal playable starter world for onboarding/start tests;
- sanitized Greyhaven-equivalent experience fixture for P1–P4 semantic regression without Manus assets;
- `LONG-01` five-character/three-location/twenty-fact fixture;
- adversarial privacy/knowledge fixture across accounts and characters;
- fault fixtures for slow/invalid/refusing providers;
- migration/export/import fixture packages with checksums and prior schema versions.

Seeds never run automatically in production and contain no third-party `REF-ONLY` content.

### 17.3 Test pyramid and required suites

- domain unit/property tests for impact, authority, scope, state schema and transition invariants;
- PostgreSQL integration tests for constraints, transactions, CAS, idempotency and outbox;
- generated OpenAPI/API contract tests including error distinctions and SSE resume;
- deterministic model contract tests before live model evaluation;
- Playwright E2E journeys matching frozen Experience;
- fault injection at every point in the frozen resilience matrix;
- security/privacy adversarial tests before live provider or external accounts;
- accessibility and responsive tests in every slice;
- `LONG-01` before release-candidate status.

The frozen `INV-01` through `INV-13` catalogue is the minimum architecture regression suite.

## 18. Observability and failure recovery

### 18.1 Correlation

Every request/trace carries safe identifiers when available:

```text
request_id → action_id → generation_attempt_id → branch_id → commit_id
```

No raw prompts, user content, tokens, secrets or private facts are logged by default.

### 18.2 Metrics

Required dashboards/alerts cover:

- acknowledgement p50/p95/p99 and database transaction latency;
- queue age, lease retries and dead-letter count;
- time to first meaningful output and ten-second wait transitions;
- provider/validation/commit latency and failure class;
- duplicate idempotency hits and prevented duplicate Commit/settlement;
- Branch conflicts and stale participation expectations;
- unconfirmed protected-change rejections and impact-level aggregates;
- projection lag by head distance;
- unresolved Action age/count;
- export/import/delete lifecycle failures;
- backup/restore drill results and integrity violations.

### 18.3 Runbooks

Before release, operators need documented procedures for:

- unresolved Action and dead job recovery;
- provider outage/degradation and profile rollback;
- projection rebuild from authoritative State Revisions;
- object-store outage and export retry;
- database restore into isolation plus Branch/Commit/hash checks;
- confirmation/idempotency anomaly investigation;
- permission revocation and deletion propagation;
- model/profile material-change rollback.

## 19. Deployment and environment plan

### 19.1 Environments

| Environment | Purpose | Data/provider policy |
|---|---|---|
| Local | fast development and deterministic flows | local PostgreSQL + MinIO + fake auth/model; synthetic data only |
| CI | isolated tests and migrations | ephemeral PostgreSQL/object adapter; fake providers; no shared secrets |
| Preview | review one change set | isolated namespace/database; synthetic seeded data; no production user data |
| Staging | release rehearsal and live-provider evaluation | production-shaped managed services; approved test accounts/content only |
| Production | approved launch | selected region/provider/policies and formal operational ownership |

Each environment has separate databases, buckets, credentials, signing keys and model profiles. Production data is never copied into lower environments without a separately approved redaction process.

### 19.2 Delivery shape

- Web: immutable static assets delivered under the product domain through CDN/edge or same-origin gateway.
- API: containerized Node process behind HTTPS/load balancer with SSE-compatible timeouts and no buffering.
- Worker: separate container/process using the same release artifact and database contracts.
- PostgreSQL: managed, encrypted, automated backups and point-in-time recovery.
- Object storage: S3-compatible, versioning/lifecycle protection and signed short-lived access.
- Secrets: managed secret store; never repository, database content, client bundle or logs.

Blue/green or rolling deployment is permitted only while API/worker/schema compatibility is maintained. The worker version must not process a job schema it cannot understand; jobs carry version/type and unsupported jobs remain visible rather than discarded.

### 19.3 Infrastructure decision boundary

Cloud vendor, launch region, DR targets, retention, identity provider and provider data terms are not selected by the frozen architecture. Vendor-specific infrastructure-as-code begins only after those decisions, while local/CI container contracts can be built earlier.

## 20. External decisions and implementation blockers by Gate

No frozen Product/System/Experience contradiction blocks engineering foundation or deterministic vertical slices. The following decisions are required before the named Gate:

| Decision | Required before | Interim implementation |
|---|---|---|
| Cloud vendor and launch region | shared staging infrastructure | vendor-neutral containers, local PostgreSQL/MinIO |
| OIDC/session and adult-eligibility provider/policy | external staging users | `AuthPort`, dev/test identity and synthetic eligibility outcomes |
| Approved model provider, retention/training terms and capability profile | live-model staging | deterministic adapter and recorded contract fixtures |
| Safety taxonomy, appeal path and operator policy | external beta/release | reason-code/policy interfaces and synthetic decisions |
| Commercial pricing/allowance | paid/limited production Action | zero-cost/unlimited test quote adapter; full idempotent ledger still implemented |
| Retention, deletion purge and DR SLO | production release | lifecycle states, configurable retention seams and backup drills without invented promises |
| Final brand and asset provenance | public production UI | original text/CSS/system assets with no Manus dependency |
| Launch content emphasis | production seed/content release | original synthetic engineering/evaluation fixtures only |

If one of these decisions changes a frozen product promise or architecture, planning stops at that Gate and requests explicit authority rather than guessing.

## 21. First vertical slices

The first implementation sequence is intentionally end-to-end:

1. **Foundation and contracts:** workspace, CI, schema/migration harness, auth/model/storage ports, deterministic testkit.
2. **Playable World bootstrap:** World Draft → immutable World Revision → Continuity → initial Branch/Commit/State Revision → World read.
3. **Action Truth production spine:** durable acknowledgement, jobs, deterministic proposal, confirmation, Commit, SSE/poll recovery, repeated Action.
4. **Return + Continuity + Correction:** orientation, Explanation Projection, C-118/C-119-style supersession and derived rebuild.
5. **Recovery:** Recovery Point, Branch, restore proposal/confirmation, non-destructive Restore and stale-head behavior.
6. **World Studio:** progressive Draft editing, validation, durable draft retention and creation of a new immutable Revision without changing current Continuity.
7. **Trust/ownership envelope:** eligibility/access/consent seams, usage quote/ledger, export, deletion lifecycle and model-change notices.
8. **Hardening/release candidate:** live model profile, character/privacy evaluation, long-horizon, accessibility, load, fault, backup restore and operational runbooks.

Detailed work items, dependencies and Gates are in [Roadmap and Work Breakdown](ROADMAP_AND_WORK_BREAKDOWN.md).

## 22. Definition of done for implementation work

A work item is not done merely when UI appears correct. It must include:

- mapped PR/NFR/ADR/INV and Experience contract;
- versioned API/domain schema where applicable;
- authorization and privacy review;
- success, conflict, interruption, stale and retry behavior;
- automated unit/integration/contract tests;
- desktop and 390×844 responsive evidence for user-facing work;
- accessibility acceptance for the introduced states;
- telemetry and safe error reason codes;
- migration/rollback implications;
- documentation and no Prototype-only dependency.

## 23. Explicit non-goals of this plan

This plan does not authorize:

- public marketplace, social feed or multiplayer;
- professional/team authoring;
- automatic World Revision adoption/merge;
- destructive rewind;
- off-session autonomous World mutation;
- mandatory map, audio, 3D or sensory runtime;
- microservices, broker, mandatory Redis or separate vector database;
- final provider, region, price, brand or legal policy decisions;
- copying WorldOS or Prototype IA/code as a feature source;
- Product Implementation before this plan is reviewed and approved.

## 24. Planning conclusion

The frozen Product, System and Experience contracts are implementable as written. The principal engineering risk is disciplined integration—not a missing architecture: Action lifecycle, immutable state, Branch CAS, protected confirmation, projections and recovery must be built as one coherent spine rather than as disconnected UI features.

No Product or Experience contract must be reopened before engineering foundation and deterministic vertical-slice work. External policy/vendor decisions are explicit later Gates and have safe interim ports/adapters.

```text
IMPLEMENTATION PLAN: APPROVED
FROZEN CONTRACT CONFLICTS: 0
ARCHITECTURE REINVENTED: NO
PROTOTYPE BEHAVIOR MODIFIED: NO
PRODUCT IMPLEMENTATION: AUTHORIZED BY PHASE GATES
```
