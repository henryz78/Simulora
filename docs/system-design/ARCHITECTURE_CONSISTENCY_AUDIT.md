# Architecture / System Design Consistency Audit

Status: `ARCHITECTURE AUDIT: PASSED`

Date: `2026-08-27` (`Asia/Shanghai`)

Scope: read-only cross-check of System Design V1 against all 18 functional requirements, 7 non-functional requirements, 10 Product Principles, MVP boundaries and Integrated Research provenance rules, followed by repair of substantive design defects before freeze. No product code, UI or prototype was created.

## 1. Result

| Severity | Open | Repaired before freeze | Result |
|---|---:|---:|---|
| `BLOCKER` | 0 | 0 | No unresolved contradiction prevents Experience Design, prototype planning or implementation planning. |
| `IMPORTANT` | 0 | 4 | Four consistency/scope defects were repaired before freeze. |
| `MINOR` | 3 | — | Approved implementation/operations choices remain; none changes the product contract. |

## 2. Repaired findings

### ARCH-IMP-001 — Branch initialization violated its own head invariant

- **Finding:** An early branch description pointed the new Branch head directly at a Commit belonging to the source Branch, while the schema required a head Commit to belong to its Branch.
- **Repair:** Branch creation now writes a `BRANCH_FORK` Commit and State Revision in the new Branch, with explicit cross-Branch parent lineage. The new head therefore belongs to the new Branch and the source remains unchanged.
- **Proof:** Domain integrity constraints, runtime Branch procedure and INV-09 agree.

### ARCH-IMP-002 — Participation and consent could have acquired duplicate authorities

- **Finding:** Participation values appeared both as Branch columns and inside State Revision, while a broad `consent_and_boundaries` state section risked restoring account/legal consent from world history.
- **Repair:** The head State Revision is the sole versioned authority for both participation axes; Branch rows no longer duplicate their values. The state section is narrowed to Branch-local `interaction_boundaries`. Eligibility, legal consent, grants and governance remain account-domain state and are explicitly excluded from Restore.
- **Proof:** Domain schema and Restore contract now identify one owner for each value.

### ARCH-IMP-003 — Protected confirmation had no durable proposal record

- **Finding:** The confirmation contract referred to a proposal digest without a defined durable proposal/confirmation entity.
- **Repair:** Added `action_proposals` and `action_confirmations` with proposal digest, expected Branch head, actor, expiry and uniqueness constraints.
- **Proof:** API confirmation, Commit validation and database schema now share the same bound object.

### ARCH-IMP-004 — An editor role leaked professional/team authoring into V1

- **Finding:** The initial authorization role list included shared Draft editing, although the MVP supports advanced solo creation and bounded playable sharing, not collaborative team authoring.
- **Repair:** Removed the editor role and explicitly left collaborative Draft editing/team authoring out of V1.
- **Proof:** Authorization roles now align with PR-011/PR-017 and MVP Later/Out-of-Scope.

## 3. Required audit checks

| Check | Result | Evidence |
|---|---|---|
| PRD traceability | `PASS` | All 25 PR/NFR IDs appear in the architecture ownership matrix and validation matrix. |
| Primary product posture | `PASS` | Single-user, player-first Continuity is the runtime root; creator capability is a separate authoring module. |
| Participation contract | `PASS` | Independent initiative and structure fields; all six combinations tested; default remains Guided + Open-ended. |
| User authority | `PASS` | Protected-action classifier, exact proposal confirmation and deterministic validator prevent avatar/permission/spend/delete takeover. |
| Authoritative state boundary | `PASS` | World Revision, Branch State Revision, Commit/Event, history, generated draft and derived memory have distinct authority. |
| Exactly-once interpretation | `PASS` | At-least-once jobs/provider attempts plus one database Commit per Action; no distributed exactly-once claim. |
| Acknowledgement semantics | `PASS` | Durable acknowledgement is unresolved; only Commit confirmation indicates mutation. |
| 1-second / 10-second targets | `PASS` | One-second p95 covers bounded durable acknowledgement; ten seconds triggers recoverable wait and does not require synchronous completion. |
| 30-day / 20-session target | `PASS` | Implemented as `LONG-01` validation envelope, not retention, capacity or schema policy. |
| Branch / restore / deletion | `PASS` | Branch preserves source; Restore appends scoped state; destructive rewind is absent; deletion is lifecycle/purge. |
| World authoring/runtime separation | `PASS` | Immutable World Revision pins Continuity; no silent live update or automatic merge. |
| Character independence | `PASS` | Character Asset, World Spec and runtime state are separate; knowledge is scope-filtered; stance cannot commit user action. |
| Memory/privacy | `PASS` | Canonical facts, history, candidates and derived memory are separate; authorization happens before relevance ranking. |
| Causal consequence | `PASS` | Structured transitions require causes/affected entities and produce Domain Events plus authoritative State Revision. |
| Model variance | `PASS` | Provider-neutral gateway, capability profiles, recorded attempts, fallback and deterministic gates preserve state/permissions. |
| Session/failure recovery | `PASS` | Action lifecycle, optimistic head, transactional outbox, job leases and reconnect-by-status cover interruption stages. |
| Creator scope | `PASS` | Playable structured starter is core; preview/import/sharing remain conditional SHOULD contracts; no team engine. |
| Portability | `PASS` | Versioned JSON/NDJSON/Markdown package, checksums, scoped export and staged inspectable import. |
| Governance | `PASS` | Adult-only eligibility outcome, consent/access/policy/appeal records and data minimization; no minor/family suite invented. |
| Accessibility / immersion | `PASS` | No sensory subsystem selected; client/API remain text/control complete with later projection seam only. |
| Technology proportionality | `PASS` | Modular monolith, PostgreSQL jobs/outbox and no broker/vector DB/microservices without measured trigger. |
| Clean room | `PASS` | No parity ID, WorldOS route/UI/IA/schema, template JSON or research-viewer technology is a design authority. |
| Product open decisions | `PASS` | Region, policy SLA, long retention/scale, price, provider presentation, sensory feature, content emphasis and brand remain open. |
| Phase boundary | `PASS` | Only Markdown design documents changed; implementation, UI and prototype remain unstarted. |

## 4. Accepted minor open decisions

### ARCH-MIN-001 — Exact framework and delivery libraries

TypeScript/React, Node.js, PostgreSQL, object storage, HTTP JSON/SSE and database jobs are selected. Exact React delivery framework, Node HTTP framework, schema library, job library and migration tool remain implementation choices. They may not alter domain authority, API semantics or accessibility.

### ARCH-MIN-002 — Physical retrieval and state-storage optimization

V1 logical truth uses full State Revisions and rebuildable retrieval projections. Compression, deduplication, full-text/vector implementation and cache selection remain measurement-driven physical choices. A separate vector database is not authorized by default.

### ARCH-MIN-003 — Region-specific operations and policy SLOs

Cloud vendor/region, disaster-recovery SLO, commercial retention, appeal SLA, provider data terms and jurisdiction-specific adult verification require later product/operations/legal selection. The design exposes the necessary records and recovery seams but does not invent those promises.

## 5. Freeze decision

The design has no open Blocker or Important finding. It is internally consistent enough to freeze as System Design V1 and to constrain later Experience Design, prototype and implementation work.

`SYSTEM DESIGN V1: FROZEN`

`ARCHITECTURE AUDIT: PASSED`

`PRODUCT IMPLEMENTATION: NOT STARTED`

