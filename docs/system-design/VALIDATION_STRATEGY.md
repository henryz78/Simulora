# System Design Validation Strategy

Status: `FROZEN WITH SYSTEM DESIGN V1`

## 1. Purpose

This strategy verifies the frozen Product Requirements against observable system contracts. It does not turn the WorldOS parity suite into product acceptance tests. Test fixtures must be original or synthetic and must not contain third-party `REF-ONLY` expression.

## 2. Test layers

| Layer | Purpose | Model dependency |
|---|---|---|
| Domain unit tests | state invariants, impact classification, mode/authority and scope rules | none; deterministic fixtures |
| Schema/property tests | payload/state/export compatibility and malformed-input resistance | none |
| Database integration tests | constraints, transactions, idempotency, optimistic concurrency and outbox | none |
| Model-contract tests | structured proposal adherence, grounding, knowledge scope and fallback | recorded fixtures plus approved live evaluation |
| API contract tests | versioning, error distinctions, idempotency and SSE resume | fake provider by default |
| End-to-end product scenarios | start, participate, correct, return, branch, restore, export/delete | deterministic adapter plus representative live profiles |
| Fault-injection tests | worker crash, timeout, provider failure, duplicate delivery, stale projection and object-store delay | controlled fakes |
| Security/privacy tests | horizontal access, scope leakage, prompt injection, consent and deletion propagation | adversarial fixtures |
| Accessibility/form-factor tests | keyboard, screen reader, reduced motion, no audio, desktop/mobile web | client implementation required later |
| Long-horizon evaluation | 30-day / 20-session continuity and character/state drift | fixed scenario plus representative live profiles |
| Load/latency tests | one-second acknowledgement, queue/commit latency and ten-second wait behavior | controllable latency profiles |
| Recovery drills | database restore, object manifest integrity and unresolved Action recovery | isolated environment |

## 3. Architecture invariants test catalogue

### INV-01 — At most one Commit per Action

Run duplicate client submissions, concurrent worker completion, process death after transaction commit and outbox redelivery. For Branch Actions, assert one Commit, one Branch advance and one usage settlement. For export/import/share/consent/appeal/delete Actions, assert one linked terminal job/grant/decision/lifecycle result and no duplicated side effect.

### INV-02 — Acknowledged is not committed

Interrupt at every stage after durable acknowledgement. Assert Action truth is recoverable; UI/API never reports committed without a Commit; state is unchanged or changed exactly once.

### INV-03 — Branch-head compare-and-swap

Process two Actions against the same expected head. Assert at most one commits; the other becomes an explicit conflict and no auto-merge occurs.

### INV-04 — Participation axes remain independent

Round-trip and execute all six initiative/structure combinations. Assert no serializer, database field, API or routing decision collapses them.

### INV-05 — Protected user authority

Inject model proposals for avatar speech/action, spend, sharing, deletion, identity/consent or permission change without a valid confirmation. Assert zero protected mutation and a reason-coded proposal/block.

### INV-06 — Model output is not truth

Generate prose that contradicts canonical state and a malformed structured transition. Assert the proposal is rejected or corrected before Commit and the Branch State Revision remains valid.

### INV-07 — Knowledge/privacy isolation precedes retrieval

Seed private facts across Accounts, Continuities and Characters. Assert unauthorized records are absent from retrieval candidates, context manifests, model calls, summaries, logs and responses.

### INV-08 — Correction supersedes future behavior

Commit a wrong scoped fact, correct it, rebuild derived memory and change model profile. Assert later context uses the correction and old derived data cannot reassert the superseded fact.

### INV-09 — Recovery is non-destructive

Create Recovery Point, Branch and Restore. Assert source Branch remains unchanged, restore appends rather than truncates, and account grants/usage/exports are not rolled back.

### INV-10 — World Revision pinning

Create a Continuity, edit the World Draft and create a new World Revision. Assert the existing Continuity and its context remain pinned to the original Revision.

### INV-11 — Projection staleness is visible

Delay projection jobs after a Commit. Assert projection responses disclose their source head/staleness and authoritative state remains available.

### INV-12 — Portable package integrity

Export a selected scope; verify manifest, checksums, schema versions, omissions and human-readable material. Assert unauthorized/private/provider data is absent.

## 4. PRD acceptance mapping

| Requirement | Validation IDs | Required proof |
|---|---|---|
| PR-001 | INV-04, INV-05, E2E-AGENCY | separate active contracts, allowed initiative and override |
| PR-002 | E2E-START | non-expert premise-to-play without hidden prompt setup |
| PR-003 | E2E-RETURN, LONG-01 | return orientation from committed sources after interruption |
| PR-004 | INV-07, INV-08, E2E-CORRECT | scoped inspection/correction and future compliance |
| PR-005 | E2E-CAUSE | causal state change and transformed failure |
| PR-006 | INV-05, INV-07, MODEL-CHAR | differentiated stance without user takeover |
| PR-007 | E2E-AUDIT | consequential change shows source, reason, scope and recovery |
| PR-008 | INV-09, E2E-RECOVERY | recovery point/branch/restore/delete remain distinct |
| PR-009 | INV-12, E2E-EXIT | selected usable export plus retained original and clear deletion |
| PR-010 | INV-06, MODEL-FALLBACK, FAULT-PROVIDER | model change/outage preserves state and exposes change |
| PR-011 | E2E-START, AUTHOR-DEPTH | progressive starter and deeper structured controls |
| PR-012 | AUTHOR-PREVIEW | only if SHOULD selected; isolated representative preview |
| PR-013 | SEC-ACCESS, GOV-CONSENT, GOV-APPEAL | eligibility/visibility/consent/boundary/appeal clarity |
| PR-014 | INV-01, USAGE-QUOTE, USAGE-FAILURE | disclosed quote and no duplicate settlement |
| PR-015 | MODE-GOAL, MODE-OPEN | optional objective lifecycle and fully valid no-goal world |
| PR-016 | IMPORT-STAGE, SEC-INJECTION | preserved source, inspectable proposal, authorized selection |
| PR-017 | SHARE-GRANT | only if SHOULD selected; explicit audience/rights/revocation |
| PR-018 | A11Y-NO-SENSORY | no feature required; future selected layer must degrade away |
| NFR-001 | INV-01–INV-03, FAULT-COMMIT | acknowledged commitment once or visibly unresolved |
| NFR-002 | A11Y-CORE | desktop/mobile, keyboard, screen reader, reduced motion, no audio |
| NFR-003 | A11Y-NO-SENSORY, FAULT-OPTIONAL | state/control/recovery work without optional layers |
| NFR-004 | CHANGE-NOTICE, MODEL-FALLBACK | material effect, timing and recovery disclosed |
| NFR-005 | INV-07, SEC-ACCESS | accurate private/shared/operator visibility answers |
| NFR-006 | LONG-01 | complete frozen long-horizon envelope |
| NFR-007 | PERF-ACK, FAULT-SLOW, INV-01 | one-second p95 acknowledgement and ten-second recovery state |

## 5. Long-horizon scenario (`LONG-01`)

### 5.1 Fixture

Use one original synthetic world with:

- five differentiated characters with non-overlapping private knowledge;
- three locations;
- twenty scoped facts distributed across world, continuity-private and character-private scopes;
- five planned relationship changes;
- three open threads;
- at least one constraint that can produce transformed failure;
- one initial `GUIDED + OPEN_ENDED` Branch.

The fixture is an evaluation asset, not launch-content positioning and not the maximum supported world size.

### 5.2 Schedule

Run at least twenty sessions across a simulated or real thirty-day interval. The schedule includes:

- ordinary short and long gaps;
- one deliberate wrong-fact correction before later sessions;
- one Branch from a mid-scenario Commit;
- one Restore on the experimental Branch;
- one interruption after acknowledgement and before model completion;
- one model-profile change and one provider outage/fallback;
- at least one character disagreement and one transformed failure;
- return orientation after the longest gap.

Time may be simulated for automation, but at least one wall-clock interruption/reconnect path must exercise real expiration and recovery boundaries.

### 5.3 Pass conditions

- all five character identities remain distinguishable by rubric;
- character-private facts do not leak to unauthorized characters;
- the corrected fact governs all later compiled contexts;
- five relationship changes retain their cause links;
- three threads remain correctly open/resolved by their final state;
- Branch divergence does not alter source Branch;
- Restore does not truncate history or alter account-level rights/usage;
- the interrupted Action is committed once or remains visibly unresolved;
- model/profile change does not mutate canonical state or permissions;
- return orientation identifies current situation and an available participation point;
- no acknowledgement is silently lost.

Model prose is scored separately from structural pass/fail. A less elegant fallback response may pass if authority, state and recovery remain correct.

## 6. Model evaluation

### 6.1 Structural gates

Every supported capability profile must meet hard gates for:

- valid structured proposal rate after bounded repair;
- zero accepted protected-action bypasses;
- zero cross-scope knowledge leaks in the test corpus;
- grounding of proposed state changes to included sources/current input;
- correct handling of unknown/ambiguous information;
- stable character identifiers and speaker attribution;
- no permission, entitlement or deletion mutation channel.

### 6.2 Quality dimensions

Quality is multi-objective and mode-specific:

- character identity fidelity;
- continuity and correction adherence;
- causal legibility;
- useful initiative within Direct/Guided/World-active;
- novelty without state contradiction;
- refusal/disagreement credibility without coercion;
- latency and cost under the declared profile;
- fallback degradation.

No single aggregate model score is a release gate. Hard authority/privacy/state failures cannot be averaged away by prose quality.

### 6.3 Change control

A model, prompt/config or routing change runs:

1. fixed deterministic contract fixtures;
2. privacy/authority adversarial suite;
3. representative turn and character rubrics;
4. long-horizon subset and, for material changes, `LONG-01`;
5. rollback rehearsal and material-change classification.

Generation Attempt records allow before/after comparison without treating provider output as history.

## 7. Resilience and fault matrix

| Injection point | Expected result |
|---|---|
| before Action transaction | no acknowledgement and no Action |
| after Action commit, before response | retry returns same Action by idempotency key |
| worker after provider call | attempt can retry; no Commit yet |
| during validation | recoverable failure; state unchanged |
| just before Commit | retry rechecks expected head |
| after Commit before client final frame | Action query/SSE resume returns existing Commit; no duplicate |
| after outbox insert before delivery | outbox redelivery safe |
| after usage reservation | terminal no-Commit releases once |
| provider slow beyond ten seconds | explicit wait state and safe cancel/retry |
| projection worker unavailable | authoritative state served, projection marked stale |
| object store unavailable | core world state remains usable; export/import delayed visibly |
| database recovery from backup | referential/head/hash integrity verified before service resumes |

## 8. Security and privacy test minimums

- horizontal ID access across Accounts for every resource type;
- grant revocation during an active Action and before export download;
- creator unable to inspect recipient private Continuity;
- character knowledge isolation before retrieval and after derived-summary rebuild;
- malicious import/creator fields attempting prompt-role and authorization injection;
- confirmation replay, expired digest, changed Branch head and changed proposal;
- logs/traces/export inspected for secrets, raw sensitive content and cross-scope data;
- tombstone blocks mutations and deletion propagates to projections/object artifacts under policy;
- operator access generates an audit record and respects scoped purpose;
- eligibility and consent failure returns non-leaking reason/recovery behavior.

Specialist penetration testing, threat-model review and privacy/legal review are release gates once deployment scope, launch region and provider are selected.

## 9. Performance validation

### 9.1 Acknowledgement (`PERF-ACK`)

Measure from client request dispatch to receipt of durable Action acknowledgement under the documented supported-device and normal-network profile. The p95 must be at most one second. Provider generation is excluded; database/job durability is included.

### 9.2 Slow generation (`FAULT-SLOW`)

Inject provider delay. If no meaningful output begins by ten seconds, verify explicit unresolved/wait state, Action recovery URL, safe cancel/retry and no duplicated commitment/usage. This is a UX/reliability threshold, not a demand that the worker complete in ten seconds.

### 9.3 Capacity

Capacity tests must at minimum exceed the `LONG-01` fixture and representative concurrent Action load chosen for the prototype/release environment. Maximum commercial world size, account retention and concurrency are not frozen here; when selected they require explicit targets rather than extrapolation from the 30-day scenario.

## 10. Release evidence

Each release candidate produces:

- requirement/test result matrix;
- schema/API compatibility result;
- migration and rollback result;
- model capability/profile evaluation report;
- privacy/authority/security result;
- accessibility result;
- performance percentiles with test profile;
- fault-injection and backup-restore result;
- accepted deviations with owner, expiry and user impact.

No implementation is accepted merely because happy-path generated output looks convincing.
