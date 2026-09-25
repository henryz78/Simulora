# IP-10 Requirement → Evidence Matrix

**Status:** `IP-10 STARTED — FIRST MAPPING (IP-10.8 draft)`. This is the first
IP-10 work item. It records what current `main` proves today and where the
gaps are. It closes nothing and passes no Gate.

**Baseline mapped:** approved IP-9 behavior
`c812d6c6d29be86be3557a00b4866b5d01f0499f`, exact-SHA CI `36096978257`
(success). `main` HEAD at mapping time is `7bbb889` (documentation only).

**Sources:** [Product Requirements](../product/PRODUCT_REQUIREMENTS.md) §5–§6 ·
[Validation Strategy](../system-design/VALIDATION_STRATEGY.md) §3–§10 ·
[Roadmap](ROADMAP_AND_WORK_BREAKDOWN.md) §13 ·
[Implementation Plan](IMPLEMENTATION_PLAN.md) §17, §20.

## 1. Status legend

| Status | Meaning |
|---|---|
| `EVIDENCED` | An automated test on real PostgreSQL or in the CI browser matrix proves the stated requirement proof, at the named baseline. |
| `PARTIAL — TEST GAP` | The behavior exists, but part of the required proof has no test. IP-10 can close it by adding tests only. |
| `NOT MET — IMPLEMENTATION GAP` | The required proof needs behavior that does not exist in the product. Adding tests cannot close it. |
| `EXTERNAL` | Needs a Plan §20 decision, a named person, or a specialist or human review. Engineering cannot produce it. |
| `UNSELECTED` | A `SHOULD` requirement that has not been selected for this release. G10 requires that it is not implied. |

Evidence paths are relative to the repository root. Test names are quoted.

## 2. MUST requirements

| Req | Validation IDs | Evidence today | Status | Gap to close |
|---|---|---|---|---|
| PR-001 | INV-04, INV-05, E2E-AGENCY, E2E-CONTRACT-TRANSITION | `ip6-participation-character`: "commits all six independent contracts through direct user Actions only", "rejects stale/mismatched expectations…", "rejects any non-direct Commit that changes participation"; `packages/domain`: "round-trips all six…", "rejects model candidates that attempt to smuggle protected authority fields"; `e2e/ip6-participation`: "changes the two independent axes…", "stale review writes nothing…" | `EVIDENCED` | — |
| PR-002 | E2E-START | `e2e/ip7-world-studio` creates a Draft and a Revision in the browser; `ip7-world-studio` (PG) starts a Continuity from a Revision | `PARTIAL — TEST GAP` | No browser test goes from a new premise through "Begin play" to the first playable scene and a first Action (IP-10.2). |
| PR-003 | E2E-RETURN, LONG-01 | `e2e/ip4-continuity` Return tests (freshness, authoritative fallback, no false "no change"); `ip4-return-continuity` routes | `PARTIAL — TEST GAP` | Only single-session scenarios. A multi-session return after interruption needs `LONG-01` (IP-10.3). |
| PR-004 | INV-07, INV-08, INV-13, E2E-CORRECT, E2E-CONTINUITY-IMPACT, E2E-EXPLANATION | `e2e/ip4-continuity` "Continuity fact Lens leads to exact Correction review…"; `ip4-adversarial` correction/removal and cross-account hiding; `ip4-return-continuity` Explanation routes; `ip6` "filters character knowledge before the generator…" | `PARTIAL — TEST GAP` | `E2E-CONTINUITY-IMPACT` has no single end-to-end scenario. The L3 cases for relationship redefinition and scope widening are covered only by closed schemas, because no operation for them exists (see PR-005). |
| PR-005 | E2E-CAUSE | `re3-routine-effects` "binds policy, L2 proposal, causal Event…"; fact update with a Commit Event (`action-truth`) | `NOT MET — IMPLEMENTATION GAP` | A causal change is evidenced only for fact updates and NPC movement. **No transformed-failure mechanism exists**: no code, contract or test produces a new playable state from a failed attempt. |
| PR-006 | INV-05, INV-07, MODEL-CHAR | `packages/domain` "keeps two characters' identity, knowledge and stance distinct", "binds Character attribution and rejects generated user commitments"; `ip6` authority guards | `EVIDENCED` (deterministic) / `EXTERNAL` (model quality) | The structural proof holds. A character-quality rubric on a real model needs an approved provider (Plan §20). |
| PR-007 | INV-05, INV-08, INV-13, E2E-AUDIT, E2E-CONTINUITY-IMPACT, E2E-EXPLANATION | `ip4-return-continuity` Trace/Explanation; `re3` causal Event; `ip8` audit and appeal | `EVIDENCED` | Shares the PR-004 `E2E-CONTINUITY-IMPACT` gap. |
| PR-008 | INV-09, E2E-RECOVERY | `ip5-recovery` (20 tests); `e2e/ip5-recovery` "Safe Point, Branch and exact append-only Restore share one Recovery model" | `PARTIAL — TEST GAP` | INV-09 also requires that account grants, usage and exports are not rolled back by Restore. No test asserts it (see INV-09). |
| PR-009 | INV-12, E2E-EXIT | `ip8-trust-lifecycle`, `ip9-object-storage`, `e2e/ip8-trust-lifecycle` "owner can inspect trust, export selected data, appeal, and review deletion" | `PARTIAL — TEST GAP` | See INV-12. |
| PR-010 | INV-06, MODEL-FALLBACK, FAULT-PROVIDER | `ip9-model-provider` out-of-envelope rejection, outage fallback, material profile change | `EVIDENCED` (provider doubles) / `EXTERNAL` (real provider) | No real provider has been evaluated or approved. |
| PR-011 | E2E-START, AUTHOR-DEPTH | `e2e/ip7-world-studio` "creator can make a Draft…" reaches facts, routes, relationships and boundaries | `EVIDENCED` | — |
| PR-013 | SEC-ACCESS, GOV-CONSENT, GOV-APPEAL | `ip8-trust-lifecycle` consent, appeal and live-consent gating; `packages/auth` synthetic adult account; cross-account checks spread across `ip4`/`ip5`/`ip6`/`ip8`/`ip9` | `PARTIAL — TEST GAP` + `EXTERNAL` | No single sweep proves horizontal access for every resource type (Validation §8). OIDC, adult eligibility, safety taxonomy and appeal policy are Plan §20 decisions. |
| PR-014 | INV-01, USAGE-QUOTE, USAGE-FAILURE | `ip8` quote/reservation idempotency; `ip9-fault-matrix` "releases a reservation exactly once…" | `EVIDENCED` (zero-cost adapter) / `EXTERNAL` (pricing) | Pricing and allowance are a Plan §20 decision. |
| NFR-001 | INV-01–INV-03, FAULT-COMMIT | `action-truth`, `action-lease`, `ip9-fault-matrix`, `e2e/action-truth` lost-ACK and refresh recovery | `EVIDENCED` | Worker death is simulated by lease expiry. A killed-process drill belongs to IP-10.6. |
| NFR-002 | A11Y-CORE | `tests/e2e/support/accessibility.ts` (axe, 320 px reflow, focus, reduced motion) across five browser/device projects; keyboard-only Action journey | `EVIDENCED` (automated) / `EXTERNAL` (screen reader) | The required "supported screen reader path" has had no human review (IP-10.5). |
| NFR-003 | A11Y-NO-SENSORY, FAULT-OPTIONAL | No optional sensory layer exists; states are text; the reduced-motion check removes all motion; mobile projects | `EVIDENCED` | Evidenced by absence of optional layers. It must be re-proven if a layer is ever selected. |
| NFR-004 | CHANGE-NOTICE, MODEL-FALLBACK | `ip9-model-provider` "records a material profile change once and publishes its notice"; `ip8` material-change records | `EVIDENCED` | — |
| NFR-005 | INV-07, INV-13, SEC-ACCESS, E2E-EXPLANATION | Explanation and scope tests (PR-004); `e2e/ip8-trust-lifecycle` visibility | `PARTIAL — TEST GAP` + `EXTERNAL` | Shares the SEC-ACCESS sweep gap. Operator visibility and audited operator access are open threat-model items. |
| NFR-006 | LONG-01 | None | `NOT MET — IMPLEMENTATION GAP` | See §5. `LONG-01` has never run. Three of its pass conditions need behavior that does not exist. |
| NFR-007 | PERF-ACK, FAULT-SLOW, INV-01 | CI `perf:ack`: p95 427.9 ms at `69228ef` (200 Actions, concurrency 10); `ip9-model-provider` "shows the ten-second wait state…" | `EVIDENCED` (CI profile) / `EXTERNAL` (supported-device profile) | The CI profile is server-side. The supported-device and normal-network profile depends on the launch environment decision. |

## 3. SHOULD and conditional requirements

G10 requires that selected `SHOULD` requirements are identified and unselected
ones are not implied. **The product owner recorded the selection for this
release on 2026-09-24: PR-012, PR-015, PR-016 and PR-017 are all not
selected.** The partial surfaces below exist, but they are not claimed as
support for these requirements.

| Req | Current state | Status |
|---|---|---|
| PR-012 Creator preview | IP-7 offers "Check playability" and an inspect-play-effect view (`e2e/ip7-world-studio`). There is no representative preview Continuity. | `UNSELECTED` (partial surface; not claimed) |
| PR-015 Optional goals | `packages/domain` "activates only declared Goal-framed objectives and fabricates none for Open-ended". There is no completion or failure-consequence state. | `UNSELECTED` (partial surface; not claimed) |
| PR-016 Migration/rehydration | IP-8.7 staged import deferred; not implemented | `UNSELECTED` |
| PR-017 Bounded sharing | IP-8.8 deferred; not implemented | `UNSELECTED` |
| PR-018 Sensory layer | `CONDITIONAL — NOT AN MVP FEATURE`; no layer exists | Not applicable |

## 4. Architecture invariants (IP-10.1)

| INV | Evidence today | Status | Gap |
|---|---|---|---|
| INV-01 | `action-truth` idempotency and cancel/Commit race; `ip4` "makes concurrent direct correction retries effective once"; `ip9-fault-matrix` lost final frame; `ip8` consent/appeal/export retries | `EVIDENCED` for the implemented Action kinds | Import and share Actions do not exist (UNSELECTED). |
| INV-02 | `ip9-fault-matrix` (every frozen injection point); `action-lease`; `e2e/action-truth` | `EVIDENCED` | — |
| INV-03 | `action-truth` "allows only one unresolved ordinary Action against a Branch head"; `ip6` "allows at most one concurrent direct change…" | `EVIDENCED` | — |
| INV-04 | See PR-001 | `EVIDENCED` | — |
| INV-05 | `ip6` protected-authority guards; `packages/domain` closed impact classification for fact rewrite (L3) and movement (L2) | `PARTIAL` | The closed decision table's relationship, scope-widening and Memory Candidate rows have no operation. The table can only be exercised for rows the product implements. |
| INV-06 | `ip9-model-provider` out-of-envelope rejection; `ip6`/`re3` SQL rejection of forged proposals | `EVIDENCED` | — |
| INV-07 | `ip6` "filters character knowledge before the generator and records the scoped manifest"; `ip4-adversarial` private IDs; disclosure-boundary tests | `PARTIAL — TEST GAP` | No test inspects logs and traces for private content (Validation §3 names logs and summaries). |
| INV-08 | `ip4-adversarial` corrected facts stay out of later state; `ip6` "does not resurrect pre-correction dialogue…"; `re3` correction boundary | `PARTIAL — TEST GAP` | No test changes the model profile after a correction and checks that the next compiled context still uses the correction. |
| INV-09 | `ip5-recovery` source Branch unchanged, append-only Restore, destructive rewind rejected | `PARTIAL — TEST GAP` | No test asserts that Restore leaves account grants, usage ledger and exports unchanged. |
| INV-10 | `authoritative-spine` "keeps an existing Continuity pinned…"; `ip7-world-studio`; `e2e/ip7-world-studio` | `EVIDENCED` | — |
| INV-11 | `ip4-adversarial` "marks a delayed projection stale while keeping the authoritative fallback readable…"; `ip9-fault-matrix` rebuild | `EVIDENCED` | — |
| INV-12 | `ip8` manifest, `checksums.sha256`, readable artifact, foreign Continuity absent; `ip9-object-storage` checksum verification | `PARTIAL — TEST GAP` | No test asserts that private facts outside the selected scope and provider data (prompts, raw attempts) are absent from the package. |
| INV-13 | `ip4-return-continuity` Explanation routes with freshness; `ip4-adversarial` cross-account hiding | `EVIDENCED` | — |

## 5. `LONG-01` feasibility (IP-10.3)

The frozen fixture and pass conditions (Validation §5) were checked against the
state schema and operation contracts in `packages/domain/src/index.ts` and the
migrations.

| LONG-01 element | Supported today? |
|---|---|
| Five characters with non-overlapping private knowledge, three locations, twenty scoped facts | Yes. The state and World schemas support it; no fixture exists. |
| Twenty sessions over a simulated thirty days, with one real wall-clock interruption | Harness work only |
| Deliberate L3 correction; participation transition and stale check; Branch; Restore; interrupted Action; model-profile change and outage fallback; return orientation | Yes. Each exists and is tested alone. |
| Character disagreement | Yes (deterministic stance and refusal attribution) |
| **Five relationship changes that keep their cause links** | **No.** Relationships are state data, but no Action operation changes one. The operation set is `UPDATE_CANONICAL_FACT`, `MOVE_CHARACTER`, `NO_WORLD_EFFECT`, `CORRECT_CONTINUITY`, `REMOVE_CONTINUITY`, participation change and Restore. |
| **Three threads correctly open or resolved at the end** | **No.** `openThreads` is an append-only list of narrative strings, with no open/resolved lifecycle and no resolve operation. |
| **At least one transformed failure** | **No.** There is no failure-to-new-state mechanism (PR-005). |

IP-10 can build and run the `LONG-01` harness for every supported element. The
three unsupported elements will fail honestly, and those pass conditions stay
`NOT MET`. Closing them needs new domain behavior, which IP-10 does not include.
It needs a separate product decision.

## 6. Other IP-10 work items at a glance

| Item | State today | Engineering can do now | Needs outside input |
|---|---|---|---|
| IP-10.4 compatibility | `migration-contract`, `migration-upgrade` prove upgrade from earlier schemas; contracts accept the prior phase | A compatibility matrix and a rehearsed roll-forward and rollback procedure. Migrations are forward-only, so rollback means restoring from backup, then rolling forward again. | — |
| IP-10.5 privacy/security/a11y | Automated a11y and threat-model tests; six open threat-model items | The SEC-ACCESS sweep, plus the INV-07 and INV-12 absence tests | Specialist penetration, privacy/legal review and human screen-reader review |
| IP-10.6 performance/capacity/fault | CI `perf:ack`, fault matrix, restore drill | A capacity run above the `LONG-01` fixture, and a killed-worker drill | The production device and network profile |
| IP-10.7 operations | Runbooks exist | Alert definitions tied to the existing metrics | Named owners and a tested escalation path |

## 7. G10 external decisions (Plan §20), all still open

- Cloud vendor and launch region
- OIDC/session and adult-eligibility provider and policy
- Approved model provider, retention and training terms, capability profile
- Safety taxonomy, appeal path and operator policy
- Commercial pricing and allowance
- Retention, deletion purge (including PostgreSQL retention purge) and DR SLO
- Final brand and asset provenance
- Launch content emphasis

## 8. Engineering order from this mapping

The Roadmap order is kept; only test-closable gaps are scheduled, and no new
features are added.

1. **IP-10.1 test gaps:**
   - INV-07: a log and trace inspection test;
   - INV-08: a model-profile change after a correction;
   - INV-09: a test that Restore leaves account-level state alone;
   - INV-12: absence assertions for private and provider data in the package.
2. **IP-10.2 journeys:**
   - the premise → "Begin play" → first Action browser journey;
   - one cross-capability journey (Action → Correction → Branch/Restore → export) on the same World;
   - the `E2E-CONTINUITY-IMPACT` scenario for the implemented rows.
3. **IP-10.5 automated part:** the SEC-ACCESS horizontal-access sweep over every owner-scoped route.
4. **IP-10.4:** the compatibility matrix, plus a backup → forward migration → restore rehearsal.
5. **IP-10.6:** a capacity run and a killed-worker drill.
6. **IP-10.3:** the `LONG-01` harness. Its unsupported pass conditions are reported as `NOT MET`.
7. **IP-10.8:** update this matrix as each item lands.

**G10 cannot pass while PR-005 transformed failure and NFR-006 `LONG-01` stay
`NOT MET`.** On 2026-09-24 the product owner chose to close them in a separate
bounded track. That track is defined by the
[MUST-Gap Closure Contract (MGC-1)](MUST-GAP-CLOSURE-CONTRACT.md). IP-10 itself
stays validation only.

Steps 1–5 above do not depend on the new behavior and proceed now. Step 6
(`LONG-01`) and the matrix rows for PR-005, `E2E-CONTINUITY-IMPACT`, INV-05
and NFR-006 wait for MGC-1 to pass independent review.
