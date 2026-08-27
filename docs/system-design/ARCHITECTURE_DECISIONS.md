# Architecture Decision Record

Status: `ADR SET V1: ACCEPTED / FROZEN WITH SYSTEM DESIGN V1`

Each decision is original and derived from frozen Product Definition. An ADR may be superseded later by a new dated ADR; accepted history is not rewritten.

## ADR-001 — Use a modular monolith plus worker

- **Status:** Accepted
- **Context:** MVP needs strong cross-domain consistency, a small team path and asynchronous model work; it does not need independent business-service scaling.
- **Decision:** Use one TypeScript/Node.js codebase with a web API process and independently scalable background worker. Modules own domain boundaries but share one PostgreSQL transaction where one user commitment spans them.
- **Consequences:** Simpler transactions, testing and deployment; module boundaries must be enforced in code. Split a module only after measured scaling/ownership pressure and a superseding ADR.
- **Trace:** NFR-001, NFR-007; Principles 5 and 9.

## ADR-002 — Use a responsive TypeScript/React web client

- **Status:** Accepted
- **Context:** Product Definition requires desktop and mobile web form factors, accessibility and stable presentation without selecting a UI.
- **Decision:** Use a responsive React client written in TypeScript. Client state is a projection/cache only; server Commit/Action status remains authoritative. Exact routing, rendering and component libraries are deferred to Experience Design/implementation.
- **Consequences:** One client capability surface across validation form factors; offline-first mutation is not implied. Accessibility contracts must be part of component acceptance.
- **Trace:** NFR-002, NFR-003; Principle 8.

## ADR-003 — PostgreSQL is the authoritative transactional store

- **Status:** Accepted
- **Context:** Branch heads, state, history, usage and idempotency require transactional constraints. V1 scale does not justify distributed authority.
- **Decision:** Store authoritative metadata/state in PostgreSQL. Use S3-compatible object storage for large artifacts, with access metadata in PostgreSQL. Caches, search indexes and embeddings remain derived.
- **Consequences:** Strong local consistency and straightforward recovery. Large state documents require monitoring; internal physical optimization may change without changing logical authority.
- **Trace:** PR-003–PR-010, NFR-001, NFR-006.

## ADR-004 — Use immutable full State Revisions plus an append-only Commit/Event ledger

- **Status:** Accepted
- **Context:** The system needs causal explanation, branch/restore and inspectable state without making replay of every event the only recovery path.
- **Decision:** Each accepted Commit produces a full immutable structured State Revision and append-only Domain Events/history. Branch head points to the current Commit. Do not implement pure event sourcing in V1.
- **Consequences:** Easy point-in-time read, branch and restore; more storage than delta-only designs. Future compression/deduplication is permitted if logical revision identity and recovery remain intact.
- **Trace:** PR-004, PR-005, PR-007, PR-008; Principles 1, 3 and 5.

## ADR-005 — Separate durable Action acknowledgement from Commit confirmation

- **Status:** Accepted
- **Context:** The one-second acknowledgement target cannot include slow model work, but the product must not claim success before persistence.
- **Decision:** Persist an Action envelope quickly and report it as unresolved. Only a successful short database transaction returns `COMMITTED`. Enforce one Commit per Action with unique constraints and optimistic Branch-head comparison.
- **Consequences:** Clear recovery after timeouts and safe retries. UX must communicate unresolved vs committed state accurately.
- **Trace:** NFR-001, NFR-007, PR-007.

## ADR-006 — Use database jobs and transactional outbox before a message broker

- **Status:** Accepted
- **Context:** Model calls and exports are asynchronous, but V1 does not need cross-service event infrastructure.
- **Decision:** Use leased PostgreSQL durable jobs and an outbox written in the source transaction. Workers are at-least-once; domain idempotency makes repeated processing safe.
- **Consequences:** Fewer moving parts and consistent commit publication. Revisit if queue contention, throughput or independent service ownership is measured as a limit.
- **Trace:** NFR-001, NFR-007; Principle 5.

## ADR-007 — Persist two independent participation axes

- **Status:** Accepted
- **Context:** Product Definition explicitly repaired the conflation of AI initiative and world structure.
- **Decision:** Store `initiative_mode` (`DIRECT`, `GUIDED`, `WORLD_ACTIVE`) independently from `structure_mode` (`OPEN_ENDED`, `GOAL_FRAMED`) in Branch state and all relevant contracts.
- **Consequences:** All six combinations are representable. Authorization and behavior tests must be mode-specific; no ambiguous single `mode` field is allowed.
- **Trace:** PR-001, MUST-02; Principle 2; AUD-BLK-001.

## ADR-008 — Models propose; deterministic application code commits

- **Status:** Accepted
- **Context:** Model creativity and failure must not override user-owned state, scope, permissions or charge behavior.
- **Decision:** Provider output is untrusted structured proposal plus prose. Application-owned validators enforce schema, authority, privacy, safety, causality and impact level before one commit transaction. Models never receive database mutation credentials.
- **Consequences:** More explicit schemas/evaluation and occasional rejected output; provider/model substitution does not change core authority.
- **Trace:** PR-004–PR-007, PR-010, NFR-005–NFR-006; Principles 4, 5 and 9.

## ADR-009 — Keep canonical state, history and derived memory distinct

- **Status:** Accepted
- **Context:** Users need continuity and correction, while raw transcripts and model summaries are noisy and privacy-sensitive.
- **Decision:** Canonical facts/relationships/runtime state live in State Revisions; committed conversation/events are history; summaries/embeddings/retrieval indexes are derived; memory candidates are proposals until promoted.
- **Consequences:** Corrections and privacy scopes are explicit. Retrieval must preserve source links and can be rebuilt without altering the world.
- **Trace:** PR-003, PR-004, PR-007, NFR-005; Principles 1, 5 and 7.

## ADR-010 — Pin each Continuity to an immutable World Revision

- **Status:** Accepted
- **Context:** Live authoring changes must not silently rewrite long-term user investment, and automatic three-way merge is unnecessary for MVP.
- **Decision:** A Continuity starts from and remains pinned to one immutable World Revision. New draft revisions do not affect it. No automatic revision adoption/merge in V1.
- **Consequences:** Stable play and simple provenance. Applying a later World Revision requires a future explicit preview/branch/migration design and ADR.
- **Trace:** PR-002, PR-010, PR-011; Principles 1, 5 and 6.

## ADR-011 — Make V1 recovery non-destructive

- **Status:** Accepted
- **Context:** Users need experimentation and recovery without losing the original; destructive rewind creates deletion, usage and audit ambiguity.
- **Decision:** Recovery Points are references, Branch preserves source, and Restore appends a new Commit based on a prior State Revision. Destructive history truncation is out of V1.
- **Consequences:** Clear audit/recovery and no hidden loss; storage retains history subject to approved lifecycle policy. UX may not imply that retained history was erased.
- **Trace:** PR-008, MUST-07; Principles 1, 5 and 7.

## ADR-012 — Limit World-active mutation to explicit orchestration boundaries in V1

- **Status:** Accepted
- **Context:** World-active should feel alive, but unattended off-session mutation would add scheduling, consent and surprise-recovery complexity not required by the launch spine.
- **Decision:** World-active background events may advance within a user-triggered Action or explicit session-boundary continuation. No unattended off-session authoritative mutation in V1.
- **Consequences:** Bounded proactivity and simpler recovery; future persistent-clock/offline evolution requires product approval, visibility rules and a superseding ADR.
- **Trace:** PR-001, PR-005, PR-007; Principles 2, 3 and 5.

## ADR-013 — Use versioned JSON/HTTP and SSE, not bidirectional realtime infrastructure

- **Status:** Accepted
- **Context:** V1 is single-user and needs request/recovery plus one-way generation/status streaming.
- **Decision:** Use versioned HTTPS JSON APIs and resumable SSE. Polling Action status is the fallback. WebSocket/realtime collaboration infrastructure is not required.
- **Consequences:** Simple browser/proxy support and reconnect semantics. Multi-user co-presence would require a later architecture.
- **Trace:** NFR-001, NFR-007; MVP multiplayer non-goal.

## ADR-014 — Filter privacy/knowledge scope before relevance ranking

- **Status:** Accepted
- **Context:** Searching all data and filtering afterward risks private or character-inaccessible information entering embeddings, ranking or model context.
- **Decision:** Resolve authorized source sets first, then perform lexical/semantic ranking only within that set. Derived items inherit the strictest source scope.
- **Consequences:** Some retrieval optimizations become more complex; privacy and character knowledge boundaries remain enforceable and testable.
- **Trace:** PR-004, PR-006, PR-013, NFR-005; Principles 4, 7 and 10.

## ADR-015 — Use a provider-neutral model gateway and versioned capability profiles

- **Status:** Accepted
- **Context:** No provider is selected and the product must absorb model variance.
- **Decision:** Application code requests product tasks through capability profiles. Provider/model/config identities are recorded per Generation Attempt. Fallback cannot weaken authority, privacy or schema rules.
- **Consequences:** Adapter and evaluation work is required; provider switching becomes observable and bounded rather than a hidden rewrite.
- **Trace:** PR-010, NFR-004, NFR-006; Principle 9.

## ADR-016 — Use an open, versioned export and staged import

- **Status:** Accepted
- **Context:** Users require a usable exit and inspectable migration, not only a transcript or opaque backup.
- **Decision:** Export authorized selections as versioned JSON/NDJSON plus human-readable Markdown and checksums. Imports are quarantined, treated as untrusted data and become proposals requiring user review before a new asset/Continuity is created.
- **Consequences:** Portable structure and clean ownership boundary; universal behavioral fidelity is not promised. Format evolution requires compatibility tests.
- **Trace:** PR-009, PR-016; Principles 1 and 7.

## ADR-017 — Do not select an MVP sensory subsystem

- **Status:** Accepted
- **Context:** Sensory capability is conditional in PRD and cannot be promoted from reference libraries.
- **Decision:** System Design defines only the projection boundary: any later sensory layer reads committed state and must degrade away. No audio, map, motion, 3D or rendering subsystem is selected for MVP.
- **Consequences:** Core architecture remains text/control complete. A future selected sensory feature requires an experience decision and technology-specific ADR.
- **Trace:** PR-018, NFR-002–NFR-003; Principle 8.

## Decision trigger for added infrastructure

A new broker, cache tier, vector database, service split or autonomous scheduler requires all of:

1. a measured problem against a frozen requirement or operational target;
2. proof that the existing PostgreSQL/module design cannot meet it reasonably;
3. a failure/recovery and data-authority analysis;
4. migration and rollback plans;
5. an accepted superseding ADR.

“Future scale,” competitor architecture or library availability alone is not a sufficient trigger.
