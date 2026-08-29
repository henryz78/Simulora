# Simulora Implementation Roadmap and Work Breakdown V1

**Status:** `APPROVED`

**Planning basis:** Frozen Product Definition, System Design and Experience at Experience Freeze commit `d9ae20c8dead3b94a4b2afb095943c79badc7752`.

**Product Implementation:** `NOT STARTED`

## 1. Scheduling rule

This roadmap defines dependency order and acceptance Gates, not calendar commitments. Team size, provider procurement, policy decisions and deployment region are not yet fixed, so estimates in weeks or dates would create false precision.

Work proceeds by vertical outcome. A phase cannot pass because its UI is clickable; its authoritative state, failure modes, accessibility and tests must pass together.

## 2. Dependency map

```text
IP-0 Planning approval
  └─ IP-1 Engineering foundation
       └─ IP-2 Authoritative world/continuity spine
            └─ IP-3 Action Truth vertical slice
                 ├─ IP-4 Return / Continuity / Correction
                 │    └─ IP-5 Recovery
                 └─ IP-6 Participation and character authority
            └─ IP-7 World Studio / Revision authoring
       └─ IP-8 Ownership / governance / portability / usage

IP-3 + IP-4 + IP-5 + IP-6 + IP-7 + IP-8
  └─ IP-9 Model, accessibility and reliability hardening
       └─ IP-10 MVP release-candidate validation
```

Some packages can be developed in parallel after their contracts exist, but Gate order remains sequential where one slice depends on the prior authoritative spine.

## 3. Phase IP-0 — Planning approval

**Goal:** approve the implementation translation without starting product code.

| Work item | Deliverable | Dependency |
|---|---|---|
| `IP-0.1` | Review [Implementation Plan](IMPLEMENTATION_PLAN.md) against frozen PRD, ADRs and Experience | none |
| `IP-0.2` | Review roadmap/WBS, phase Gates and deferrals | `IP-0.1` |
| `IP-0.3` | Record accepted implementation library choices or requested changes | `IP-0.1` |
| `IP-0.4` | Confirm authorization to start Product Implementation | user decision |

### Gate G0 — Implementation authorized

- Plan has no unresolved BLOCKER against a frozen contract.
- Any requested architecture change has a decision/ADR path.
- Product Implementation is explicitly authorized by the user.

Until G0 passes, no `apps/`, `packages/`, `db/` or `deploy/` production scaffold is created.

## 4. Phase IP-1 — Engineering foundation

**Goal:** create the smallest production development platform without implementing product semantics prematurely.

### Work packages

| ID | Work | Acceptance |
|---|---|---|
| `IP-1.1` | Create pnpm workspace, TypeScript strict config and package-boundary rules | All packages build independently; forbidden dependency tests prevent web/domain/database boundary violations. |
| `IP-1.2` | Create `apps/web`, `apps/api`, `apps/worker` composition roots | Health endpoints/pages run; worker starts idle; no Prototype imports. |
| `IP-1.3` | Create typed config/secrets boundary | Missing/invalid config fails safely; secrets never enter client/logs. |
| `IP-1.4` | Local PostgreSQL + MinIO environment | One command starts isolated dependencies; no environment-specific Manus dependency. |
| `IP-1.5` | Migration runner and schema-check pipeline | Up/down or forward/rollback rehearsal works on empty and prior test schema. |
| `IP-1.6` | Test foundations | Vitest, database integration, Playwright, axe and fault clocks/providers run in CI. |
| `IP-1.7` | OpenTelemetry/logging/redaction foundation | Correlation IDs propagate across API and worker; raw content is absent by default. |
| `IP-1.8` | Auth/model/storage ports with fake adapters | Synthetic account, deterministic model and local object store work without selecting vendors. |
| `IP-1.9` | CI quality gates | typecheck, lint/format, unit, migration, integration, contract and build checks required. |

### Gate G1 — Foundation healthy

- Clean clone can bootstrap documented local environment.
- API and worker share packages but are separate runtime processes.
- Database migration/check pipeline passes from zero.
- CI has no production secret/provider dependency.
- Prototype remains unchanged and excluded from production package graph.
- Basic keyboard-accessible production shell renders on desktop and 390×844.

## 5. Phase IP-2 — Authoritative World and Continuity spine

**Goal:** establish the smallest durable world before generation.

### Work packages

| ID | Work | Primary contracts |
|---|---|---|
| `IP-2.1` | Identity/account/eligibility synthetic domain and access checks | PR-013; API authorization sequence |
| `IP-2.2` | World, World Draft and immutable World Revision schema/repositories | PR-002, PR-011; ADR-010 |
| `IP-2.3` | Structured draft validation and original minimal seed | PR-002; World authoring invariant |
| `IP-2.4` | Continuity initialization transaction | Continuity pins World Revision; initial Branch/head always valid |
| `IP-2.5` | Initial Commit and full immutable State Revision | ADR-004; state schema and hash |
| `IP-2.6` | Authoritative Branch state read with scope filtering | API state contract; NFR-005 |
| `IP-2.7` | Read-only playable World shell and route recovery | Experience World primary surface |
| `IP-2.8` | Database invariant/property tests | INV-03, INV-04, INV-10 foundations |

### Gate G2 — Authoritative spine proven

- A synthetic user creates/adapts a minimal structured Draft.
- A playable immutable Revision is created after validation.
- Starting a Continuity atomically creates one Branch, initial Commit, State Revision and head.
- Existing Continuity remains pinned after a new World Revision is created.
- Current state reloads from PostgreSQL after web/API/worker restart.
- No client or Prototype fixture is authoritative.
- All six participation-axis combinations round-trip in the State Revision even though contract-change UI may come later.

## 6. Phase IP-3 — Action Truth vertical slice

**Goal:** implement P1 semantics on the real server and database.

### Work packages

| ID | Work | Primary contracts |
|---|---|---|
| `IP-3.1` | Action schema, statuses and idempotency constraint | ADR-005; INV-01/02 |
| `IP-3.2` | Durable jobs, leases, retries and dead state | ADR-006; API reliability |
| `IP-3.3` | Transactional outbox and ordered progress frames | SSE/outbox contract |
| `IP-3.4` | Submit Action API with expected head and match-only participation | PR-001; ADR-018 |
| `IP-3.5` | Deterministic Context Manifest and model adapter | ADR-008/014/015 |
| `IP-3.6` | Structured candidate validator and closed L1/L2/L3 classifier | INV-05/06 |
| `IP-3.7` | Durable proposal and exact confirmation digest | architecture repair ARCH-IMP-003 |
| `IP-3.8` | Atomic Commit/State/Event/history/head/outbox transaction | core consistency boundary |
| `IP-3.9` | SSE resume plus polling fallback | ADR-013 |
| `IP-3.10` | cancel/retry/Commit race handling | effective-once contract |
| `IP-3.11` | responsive Action states and repeated participation | frozen P1 + integrated Experience |
| `IP-3.12` | fault and performance tests | INV-01–06, PERF-ACK, FAULT-SLOW |

### Gate G3 — Action Truth passed

Required journey:

```text
ready → submit → ACKNOWLEDGED
→ provisional output
→ exact confirmation
→ COMMITTED
→ next Action
```

Pass conditions:

- acknowledgement is durable and measured separately from generation;
- no proposal/stream/UI state changes current truth;
- duplicate submission/worker completion creates at most one Commit and settlement;
- restart/disconnect recovers Action truth by ID;
- delayed generation enters explicit recoverable wait after the experience threshold;
- stale head creates conflict/no mutation;
- confirmation binds actor, exact effect, digest and head;
- committed history and State Revision are atomically linked;
- previous history remains when a second Action starts;
- desktop and mobile states are keyboard/screen-reader understandable.

## 7. Phase IP-4 — Return, Continuity and Correction

**Goal:** implement P2 against committed sources without creating another truth store.

### Work packages

| ID | Work | Primary contracts |
|---|---|---|
| `IP-4.1` | Domain Events and causal Change Trace query | PR-005, PR-007 |
| `IP-4.2` | Return Orientation projection with source-head freshness | PR-003; INV-11 |
| `IP-4.3` | General Continuity landing and scoped current state | frozen Experience landing contract |
| `IP-4.4` | Explanation Projection authorization and assembly | INV-13; ADR-018 |
| `IP-4.5` | Correction/removal direct Action and exact review | PR-004; INV-08 |
| `IP-4.6` | Supersession lifecycle for canonical stable IDs | memory/state boundary |
| `IP-4.7` | Projection invalidation/rebuild after Commit | authoritative fallback |
| `IP-4.8` | cross-account/character scope adversarial tests | INV-07/13 |
| `IP-4.9` | browser history, refresh and pending-Action cross-surface behavior | integrated Experience repair contract |

### Gate G4 — Continuity and correction passed

- Return identifies current situation, recent meaningful change, open thread and next participation point.
- No meaningful change produces an honest empty orientation.
- Stale orientation is labeled and authoritative state remains available.
- Explanation reveals permitted source class/Commit, scope, freshness and correction path only.
- A C-118 → C-119-equivalent correction supersedes current fact without deleting history.
- Later context/model proposals use the corrected fact.
- Pending Action remains visible/understandable across Return, Continuity and Context.
- Mobile global Continuity and desktop Continuity share one category-to-fact mental model.

## 8. Phase IP-5 — Recovery

**Goal:** implement P3's non-destructive recovery semantics.

### Work packages

| ID | Work | Primary contracts |
|---|---|---|
| `IP-5.1` | Recovery Point create/list/delete label | ADR-011 |
| `IP-5.2` | Branch transaction with `BRANCH_FORK` Commit | ARCH-IMP-001; INV-09 |
| `IP-5.3` | Branch selection and current-path projection | Experience Recovery boundary |
| `IP-5.4` | Restore proposal/diff/scope/digest | Runtime restore contract |
| `IP-5.5` | Confirmed Restore as append-only Commit | PR-008; INV-09 |
| `IP-5.6` | stale restore and confirmation conflict | expected-head contract |
| `IP-5.7` | explicit Delete handoff/lifecycle boundary | PR-009; not undo |
| `IP-5.8` | Recovery accessibility and mobile navigation | NFR-002; frozen P3 |
| `IP-5.9` | fault, concurrency and account-boundary tests | INV-03/09 |

### Gate G5 — Recovery passed

- Safe point is a reference, not a copied state.
- Branch creates a separate valid head and leaves source bytes/head/history unchanged.
- Restore previews exact included/excluded scope and appends one Commit.
- Restore never changes participation, interaction boundaries, account rights, consent, usage or exports.
- Stale review writes nothing and requires renewed review.
- Branch, Restore, Correction and Delete are distinguishable in behavior and language.
- Action pending state survives Recovery navigation.

## 9. Phase IP-6 — Participation and character authority

**Goal:** complete the agency contract and differentiated-character boundaries required for the core loop.

### Work packages

| ID | Work | Primary contracts |
|---|---|---|
| `IP-6.1` | Direct `CHANGE_PARTICIPATION_CONTRACT` command/API | PR-001; ADR-018 |
| `IP-6.2` | before/after two-axis review and stale conflict UI | Experience Participation Contract |
| `IP-6.3` | validator prohibition for ordinary/model axis changes | INV-04/05 |
| `IP-6.4` | Character Asset → World Spec → runtime-state boundaries | PR-006 |
| `IP-6.5` | character knowledge allow-list before ranking | ADR-014; INV-07 |
| `IP-6.6` | Direct/Guided/World-active orchestration rules | ADR-012 |
| `IP-6.7` | disagreement/refusal without avatar takeover | PR-006 acceptance |
| `IP-6.8` | optional Goal-framed state seam, only if scheduled | PR-015 SHOULD |

### Gate G6 — Agency and character boundary passed

- All six contract combinations work without a combined mode enum.
- Ordinary Action with stale/mismatched expectation fails before generation/Commit.
- Only direct user contract change mutates axes and emits the typed Event.
- Models cannot author user-avatar action or protected commitment.
- Characters maintain distinct identity/knowledge and can disagree intelligibly.
- World-active performs no unattended off-session mutation.
- Open-ended works without fabricated objectives.

## 10. Phase IP-7 — World Studio and Revision authoring

**Goal:** implement the player-first creator path without turning current Continuity into a draft editor.

### Work packages

| ID | Work | Primary contracts |
|---|---|---|
| `IP-7.1` | Progressive structured World Draft editor | PR-011; P4 Living Draft |
| `IP-7.2` | row-version save/conflict and local unsent recovery | authoring concurrency |
| `IP-7.3` | meaningful structure fields and optional-depth disclosure | frozen P4 Fieldbook clarity |
| `IP-7.4` | validation findings tied to play effect | PR-002/011 |
| `IP-7.5` | durable kept Draft acknowledgement | production replacement for prototype session retention |
| `IP-7.6` | create immutable playable World Revision | ADR-010 |
| `IP-7.7` | current Continuity pinning and explicit not-applied state | P4 authority boundary |
| `IP-7.8` | optional isolated preview decision point | PR-012 SHOULD; only if scheduled |
| `IP-7.9` | Studio/World responsive navigation and accessibility | frozen P4 + overall Experience |

### Gate G7 — Creator path passed

- A novice reaches a playable result without hidden prompt configuration.
- Advanced structure is optional and explains its effect on play.
- Saved Draft reloads from server and remains visibly not applied.
- Current Continuity remains pinned while new Draft/Revision exists.
- New immutable Revision cannot silently replace the current Continuity.
- Studio remains secondary to World on desktop and mobile.
- No public marketplace, team authoring or professional engine appears.

## 11. Phase IP-8 — Ownership, governance, portability and usage

**Goal:** close mandatory trust/lifecycle requirements around the core experience.

### Work packages

| ID | Work | Primary contracts |
|---|---|---|
| `IP-8.1` | account eligibility outcome and policy interface | PR-013 |
| `IP-8.2` | ownership/grants/visibility/access explanations | PR-009/013; NFR-005 |
| `IP-8.3` | consent records and material-change notices | PR-013; NFR-004 |
| `IP-8.4` | usage quote/reservation/ledger with zero-cost test policy | PR-014; INV-01 |
| `IP-8.5` | selected-scope export job, manifest and checksums | PR-009; INV-12 |
| `IP-8.6` | deletion proposal, tombstone, mutation block and purge status | PR-009/013 |
| `IP-8.7` | staged import seams if SHOULD-03 is scheduled | PR-016; otherwise defer visibly |
| `IP-8.8` | bounded sharing if SHOULD-04 is scheduled | PR-017; otherwise defer visibly |
| `IP-8.9` | operator audit and appeal record seams | API security/governance |

### Gate G8 — Trust/lifecycle envelope passed

- Authorized user can explain access/visibility for selected resources.
- Export is readable, versioned, checksummed and excludes unauthorized/provider data.
- Deletion is clearly separate from recovery and blocks new mutation after tombstone.
- Usage retry/failure never duplicates settlement; no pricing promise is invented.
- Creator ownership does not grant access to recipient private Continuity.
- Eligibility/consent/appeal surfaces use non-leaking reason/recovery states.
- Any deferred SHOULD item remains outside MVP flow rather than appearing broken.

## 12. Phase IP-9 — Model, accessibility and reliability hardening

**Goal:** move from deterministic correctness to production-shaped quality without weakening contracts.

### Work packages

| ID | Work | Acceptance |
|---|---|---|
| `IP-9.1` | one approved live capability profile/adaptor | structural/privacy hard Gates pass before UI exposure |
| `IP-9.2` | fallback and material model-change records | state/authority unchanged across provider switch |
| `IP-9.3` | fixed model evaluation corpus and rubrics | no authority/privacy failures averaged away |
| `IP-9.4` | acknowledgement/queue/generation/load profiling | PERF-ACK and FAULT-SLOW pass under documented profile |
| `IP-9.5` | worker/process/provider/object-store fault injection | all frozen fault matrix outcomes pass |
| `IP-9.6` | projection lag and rebuild drills | stale is visible; authoritative fallback works |
| `IP-9.7` | full accessibility hardening | keyboard, focus, Escape, screen reader, reduced motion, contrast, zoom and mobile |
| `IP-9.8` | responsive browser/device matrix | same mental model and complete capabilities |
| `IP-9.9` | security/privacy threat tests and specialist review preparation | no horizontal/scope/prompt-injection leakage |
| `IP-9.10` | backup restore and object-manifest integrity drill | isolated restore proves Branch/Commit/State/hash integrity |

### Gate G9 — Production-shaped hardening passed

- Live provider cannot bypass deterministic rules.
- Provider outage/degradation leaves authoritative state readable and Action recoverable.
- p95 acknowledgement target and ten-second recoverable wait pass under documented profile.
- Core journeys pass keyboard and supported assistive-technology review on desktop/mobile.
- No state meaning depends on animation, audio, color or optional media.
- Backup/restore, worker retry, projection rebuild and object-store delay runbooks are proven.
- Security/privacy review has no open release BLOCKER.

## 13. Phase IP-10 — MVP release-candidate validation

**Goal:** prove the frozen MVP as one product and produce release evidence. This phase does not choose or announce launch without separate authority.

### Work packages

| ID | Work | Acceptance |
|---|---|---|
| `IP-10.1` | Full `INV-01`–`INV-13` run | all invariants pass |
| `IP-10.2` | Full Experience journeys across production app | Action, Return, Correction, Recovery, Studio and cross-capability paths pass |
| `IP-10.3` | `LONG-01` 30-day/20-session scenario | all structural pass conditions met |
| `IP-10.4` | migration/API/export compatibility matrix | supported versions and rollback/roll-forward proven |
| `IP-10.5` | privacy/security/accessibility evidence | required specialist and automated results attached |
| `IP-10.6` | performance/capacity/fault evidence | documented profile, percentiles and failure drills attached |
| `IP-10.7` | operations ownership, alerts and runbooks | named owners and tested escalation paths |
| `IP-10.8` | final requirement-to-test matrix | all MUST and selected SHOULD requirements accounted for |

### Gate G10 — Release candidate eligible for review

- No unresolved BLOCKER against Product/System/Experience.
- All MUST requirements have observable evidence.
- Selected SHOULD requirements are identified; unselected SHOULDs are not implied.
- `LONG-01`, accessibility, privacy, performance, fault and recovery evidence pass.
- Database and object restore have been rehearsed.
- Migrations and rollback/roll-forward are proven.
- Launch region, provider, retention/DR, adult eligibility, safety/appeal and asset provenance decisions are formally recorded.
- Product owner separately authorizes any external beta/launch.

## 14. Cross-cutting workstreams

These are continuous tracks, not late phases:

### Security and privacy

Threat modeling begins in IP-1, scope-filter tests begin in IP-2, model privacy begins in IP-3 and specialist review is a G9/G10 requirement.

### Accessibility

Accessible primitives begin in IP-1. Every Gate adds keyboard, status, focus and responsive checks. Full hardening cannot be deferred until IP-9 even though the broad matrix closes there.

### Observability

Correlation/redaction starts in IP-1. Every Action/Commit/job/projection work item adds metrics, reason codes and runbook implications as part of done.

### Migration discipline

Every schema-bearing phase includes forward migration, verification and recovery. Migration is not postponed to release.

### Clean-room/provenance

WorldOS remains evidence only. Prototype assets/code are not imported wholesale. All seeds and evaluation content are original/synthetic with provenance.

## 15. Parallelization guidance

Safe parallel work after G1:

- web accessible primitives can progress alongside database foundations;
- deterministic model adapter can progress alongside Action schema;
- observability and fault harness can progress alongside worker leasing;
- original test fixtures can progress alongside domain invariants;
- Studio authoring repositories can begin after World Draft schema stabilizes, but UI Gate waits for G4/G5 cross-surface contracts;
- export object-store adapter can begin after identity/access ports, but lifecycle Gate waits for authoritative Continuity.

Do not parallelize by creating separate competing truth models for P1/P2/P3/P4. All slices must consume the same production Branch/Action/Commit contracts.

## 16. Scope control

A backlog item is rejected or deferred if it:

- has no PR/JTBD/Principle trace;
- exists only because WorldOS or the Prototype has a surface;
- promotes a SHOULD/LATER item into a Gate dependency without approval;
- adds infrastructure without a measured failure of the frozen baseline;
- makes a projection/cache/model output authoritative;
- introduces automatic revision merge, destructive rewind or off-session autonomy;
- turns accessibility, privacy or recovery into post-launch cleanup.

## 17. Roadmap status

```text
ROADMAP / WORK BREAKDOWN: APPROVED
FIRST VERTICAL SLICE: DEFINED
DEPENDENCIES: DEFINED
PHASE ACCEPTANCE GATES: DEFINED
PRODUCT IMPLEMENTATION: IP-1 AUTHORIZED
```
