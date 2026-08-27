# Architecture / System Design Consistency Audit

Status: `ARCHITECTURE AUDIT: PASSED AFTER INDEPENDENT REPAIR`

Date: `2026-08-27` (`Asia/Shanghai`)

Scope: cross-check of System Design V1 against all 18 functional requirements, 7 non-functional requirements, 10 Product Principles, MVP boundaries and Integrated Research provenance rules, followed by the bounded independent repair of IR-IMP-01, IR-IMP-02 and IR-MIN-01. No product code, UI, prototype, Experience Design, research or Product Definition artifact was created or changed.

## 1. Result

| Severity | Open | Repaired before freeze | Result |
|---|---:|---:|---|
| `BLOCKER` | 0 | 0 | No unresolved contradiction prevents Experience Design, prototype planning or implementation planning. |
| `IMPORTANT` | 0 | 6 | Four prior consistency/scope defects and two independent-review contract gaps are repaired before freeze. |
| `MINOR` | 3 | 1 | One independent-review explanation-projection gap is closed; three approved implementation/operations choices remain and none changes the product contract. |

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

### ARCH-IMP-005 / IR-IMP-01 — Participation contract could change through an implicit or stale path

- **Finding:** The two participation axes were independently stored but ordinary `participationExpectation` semantics and the exclusive user-authorized mutation path were not explicit.
- **Repair:** `PARTICIPATE` expectation is now match-only against the authoritative expected-head contract. Only direct-user `CHANGE_PARTICIPATION_CONTRACT` can change both axes; it requires the complete requested contract and expected head, writes one Commit plus `PARTICIPATION_CONTRACT_CHANGED` Event, and cannot be initiated by model proposal, draft, prose or stale client expectation.
- **Proof:** System Design, Domain invariants, Runtime operation classes/Commit checks, API resource/error contracts and `INV-04` / `E2E-CONTRACT-TRANSITION` agree.

### ARCH-IMP-006 / IR-IMP-02 — Canonical continuity impact classification was not closed

- **Finding:** The system distinguished L1/L2/L3 but did not set a deterministic minimum for user-authored/confirmed facts, scope widening, protected relationship redefinition, Memory Candidate promotion/supersession and direct correction/removal.
- **Repair:** A closed decision table now preserves L1 derived work and L2 routine explainable evolution, while classifying high-impact canonical/scope effects as L3 direct-user-authorized Action/Commit operations. The validator may raise but cannot lower the table minimum.
- **Proof:** Domain decision table/integrity constraints, System Design, Runtime validator and `INV-05` / `INV-08` / `E2E-CONTINUITY-IMPACT` agree.

### ARCH-MIN-004 / IR-MIN-01 — Explanation was implicit rather than a scoped product projection

- **Finding:** Provenance and source filtering existed, but no presentation-neutral authorized explanation read contract was named.
- **Repair:** An Explanation Projection now assembles only existing authorized State Revision, Commit/Event and permitted Context Manifest references. It returns target, permitted source class/Commit, scope, freshness/source head and correction path while excluding raw prompts, provider reasoning and excluded private sources.
- **Proof:** Domain projection definition, Runtime freshness contract, API explanation resource/privacy boundary and `INV-13` / `E2E-EXPLANATION` agree.

## 3. Required audit checks

| Check | Result | Evidence |
|---|---|---|
| PRD traceability | `PASS` | All 25 PR/NFR IDs remain in the architecture ownership and validation matrices; repaired contracts add explicit PR-001/004/007 and NFR-005 proof routes. |
| Primary product posture | `PASS` | Single-user, player-first Continuity is the runtime root; creator capability is a separate authoring module. |
| Participation contract | `PASS` | Independent initiative and structure fields retain all six combinations; `PARTICIPATE` expectation is match-only and only direct user contract-change Action may mutate either axis. |
| User authority | `PASS` | Protected-action classifier, closed L1/L2/L3 table, direct correction/removal path and deterministic validator prevent avatar/permission/spend/delete or high-impact canonical continuity takeover. |
| Authoritative state boundary | `PASS` | World Revision, Branch State Revision, Commit/Event, history, generated draft, derived memory and non-authoritative Explanation Projection have distinct authority. |
| Exactly-once interpretation | `PASS` | At-least-once jobs/provider attempts plus one database Commit per Action; no distributed exactly-once claim. |
| Acknowledgement semantics | `PASS` | Durable acknowledgement is unresolved; only Commit confirmation indicates mutation. |
| 1-second / 10-second targets | `PASS` | One-second p95 covers bounded durable acknowledgement; ten seconds triggers recoverable wait and does not require synchronous completion. |
| 30-day / 20-session target | `PASS` | Implemented as `LONG-01` validation envelope, not retention, capacity or schema policy. |
| Branch / restore / deletion | `PASS` | Branch preserves source; Restore appends scoped state; destructive rewind is absent; deletion is lifecycle/purge. |
| World authoring/runtime separation | `PASS` | Immutable World Revision pins Continuity; no silent live update or automatic merge. |
| Character independence | `PASS` | Character Asset, World Spec and runtime state are separate; knowledge is scope-filtered; stance cannot commit user action. |
| Memory/privacy | `PASS` | Canonical facts, history, candidates and derived memory are separate; authorization happens before relevance ranking; Explanation Projection is scope-filtered and never exposes raw/model-only context. |
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
| Phase boundary | `PASS` | Only the seven named Markdown System Design artifacts changed; research, Product Definition, Experience Design, implementation, UI and prototype remain unstarted. |

## 4. Accepted minor open decisions

### ARCH-MIN-001 — Exact framework and delivery libraries

TypeScript/React, Node.js, PostgreSQL, object storage, HTTP JSON/SSE and database jobs are selected. Exact React delivery framework, Node HTTP framework, schema library, job library and migration tool remain implementation choices. They may not alter domain authority, API semantics or accessibility.

### ARCH-MIN-002 — Physical retrieval and state-storage optimization

V1 logical truth uses full State Revisions and rebuildable retrieval projections. Compression, deduplication, full-text/vector implementation and cache selection remain measurement-driven physical choices. A separate vector database is not authorized by default.

### ARCH-MIN-003 — Region-specific operations and policy SLOs

Cloud vendor/region, disaster-recovery SLO, commercial retention, appeal SLA, provider data terms and jurisdiction-specific adult verification require later product/operations/legal selection. The design exposes the necessary records and recovery seams but does not invent those promises.

## 5. Freeze decision

The design has no open Blocker or Important finding after the independent repair. It remains internally consistent enough to freeze as System Design V1 and to constrain later Experience Design, prototype and implementation work. The next phase is authorized only when separately instructed.

`SYSTEM DESIGN V1: FROZEN AFTER INDEPENDENT REPAIR`

`ARCHITECTURE AUDIT: PASSED AFTER INDEPENDENT REPAIR`

`PRODUCT IMPLEMENTATION: NOT STARTED`

