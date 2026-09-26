# IP-10 Requirement → Evidence Matrix

**Status:** `IP-10 ENGINEERING COMPLETE — EXTERNAL DECISIONS PENDING (2026-09-25)`. This is a
living IP-10.8 document. It records what `main` proves and where the gaps are.
It passes no Gate.

**Update 1 (2026-09-25):**

- MGC-1 passed independent re-review. Its approved behavior is `f68addd`, with
  exact-SHA CI `36103979617` `success`
  ([MGC-1 Implementation and Review](MGC-1-IMPLEMENTATION-AND-REVIEW.md)).
- The IP-10.1 invariant tests, IP-10.2 real-stack journeys and IP-10.5
  SEC-ACCESS sweep landed with CI success.
- Rows are updated in place. The first mapping at `7bbb889` is in git history.
- `LONG-01` has not run yet.

**Update 2 (2026-09-25):** details in [IP-10-LONG-01-AND-DRILLS-REPORT](IP-10-LONG-01-AND-DRILLS-REPORT.md).

- `LONG-01`, the upgrade/rollback rehearsal and the killed-worker drill passed
  in CI `36198101564` on `7964e7c`.
- `LONG-01` found one product defect: the SQL Branch-switch guard ignored
  `COMPLETED_NO_EFFECT`.
  - It was repaired in a separate bounded track as `28b0d8a` (successor
    migration 0049).
  - The independent Reviewer returned `PASS` (0B / 0I / 1M).

**Update 3 (2026-09-25):** every remaining engineering item is evidenced in
CI `36207364368` on `b3c914d`, pending the final IP-10 engineering review.

- **`E2E-CONTINUITY-IMPACT`:** the real-stack scenario passes on desktop and
  390×844. It found three presentation gaps after Commit. The product owner
  authorized a minimal repair, `1629a2c`
  ([IP-10 Continuity Impact Report](IP-10-CONTINUITY-IMPACT-REPORT.md)).
- **IP-10.4:** the [compatibility matrix](IP-10-COMPATIBILITY-MATRIX.md) is
  written.
- **IP-10.7:** the [alert definitions](IP-10-ALERT-DEFINITIONS.md) are
  written.
- **§9** maps each G10 condition to engineering evidence or `EXTERNAL`.

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
| PR-002 | E2E-START | `tests/stack/first-action.spec.ts` "a new World reaches its first confirmed Action and Return on the real stack": premise → Revision → "Begin play" → first Action → exact confirmation → Return, through the real API, worker and PostgreSQL on desktop and 390×844 (CI `36103979617`); `e2e/ip7-world-studio` | `EVIDENCED` | — |
| PR-003 | E2E-RETURN, LONG-01 | `e2e/ip4-continuity` Return tests (freshness, authoritative fallback, no false "no change"); `ip4-return-continuity` routes; `LONG-01` return after a nine-day gap: stale projection labelled, rebuilt `FRESH` at the head, no pending Actions (CI `36198101564`) | `EVIDENCED` | — |
| PR-004 | INV-07, INV-08, INV-13, E2E-CORRECT, E2E-CONTINUITY-IMPACT, E2E-EXPLANATION | `tests/stack` E2E-CONTINUITY-IMPACT (routine L2 change, protected L3 refused, thread resolution, direct correction; review, Trace, Explanation and Return agree; CI `36207364368`); `e2e/ip4-continuity` fact Lens → exact Correction; `ip4-adversarial` correction/removal and cross-account hiding; `ip4-return-continuity`; `ip10-invariants` INV-07/INV-08 | `EVIDENCED` for the implemented rows | Scope widening and Memory Candidate promotion have no operation (INV-05). |
| PR-005 | E2E-CAUSE | MGC-1: `mgc1-closure` (PG) causal relationship shift with its Event; transformed failure proposed, rejected with no change, then confirmed into a new open thread; "a provider failure never becomes a transformed failure"; `e2e/mgc1-closure` composer journey; `re3-routine-effects` and `action-truth` for movement and fact updates | `EVIDENCED` (deterministic) / `EXTERNAL` (model quality) | Closed by MGC-1 (`f68addd`). The quality of transformed failure on a real model needs an approved provider. |
| PR-006 | INV-05, INV-07, MODEL-CHAR | `packages/domain` "keeps two characters' identity, knowledge and stance distinct", "binds Character attribution and rejects generated user commitments"; `ip6` authority guards | `EVIDENCED` (deterministic) / `EXTERNAL` (model quality) | The structural proof holds. A character-quality rubric on a real model needs an approved provider (Plan §20). |
| PR-007 | INV-05, INV-08, INV-13, E2E-AUDIT, E2E-CONTINUITY-IMPACT, E2E-EXPLANATION | `ip4-return-continuity` Trace/Explanation; `re3` causal Event; `ip8` audit and appeal; E2E-CONTINUITY-IMPACT: Change Trace names target, before → after and the causing Action (`1629a2c`, CI `36207364368`) | `EVIDENCED` | The RE-3 movement summary still lists raw identifiers (observation). |
| PR-008 | INV-09, E2E-RECOVERY | `ip5-recovery` (20 tests); `e2e/ip5-recovery` "Safe Point, Branch and exact append-only Restore share one Recovery model"; `ip10-invariants` INV-09; `tests/stack` "Action, Correction, Branch, Restore and export compose on one World" | `EVIDENCED` | — |
| PR-009 | INV-12, E2E-EXIT | `ip8-trust-lifecycle`, `ip9-object-storage`, `e2e/ip8-trust-lifecycle` "owner can inspect trust, export selected data, appeal, and review deletion"; `ip10-invariants` INV-12; real-stack export in `tests/stack` | `EVIDENCED` | — |
| PR-010 | INV-06, MODEL-FALLBACK, FAULT-PROVIDER | `ip9-model-provider` out-of-envelope rejection, outage fallback, material profile change | `EVIDENCED` (provider doubles) / `EXTERNAL` (real provider) | No real provider has been evaluated or approved. |
| PR-011 | E2E-START, AUTHOR-DEPTH | `e2e/ip7-world-studio` "creator can make a Draft…" reaches facts, routes, relationships and boundaries | `EVIDENCED` | — |
| PR-013 | SEC-ACCESS, GOV-CONSENT, GOV-APPEAL | `ip10-access-sweep` (§6.1); `ip8-trust-lifecycle` consent, appeal and live-consent gating; `packages/auth` synthetic adult account | `EVIDENCED` (automated) + `EXTERNAL` | OIDC, adult eligibility, safety taxonomy and appeal policy are Plan §20 decisions. |
| PR-014 | INV-01, USAGE-QUOTE, USAGE-FAILURE | `ip8` quote/reservation idempotency; `ip9-fault-matrix` "releases a reservation exactly once…" | `EVIDENCED` (zero-cost adapter) / `EXTERNAL` (pricing) | Pricing and allowance are a Plan §20 decision. |
| NFR-001 | INV-01–INV-03, FAULT-COMMIT | `action-truth`, `action-lease`, `ip9-fault-matrix`, `e2e/action-truth` lost-ACK and refresh recovery; `LONG-01` real process SIGKILL mid-generation, real lease expiry, one Commit; IP-10.6 container drill: worker SIGKILLed and replaced under 300 Actions with none stuck or duplicated (CI `36198101564`) | `EVIDENCED` | The container drill's kill landed between claims; in-flight takeover is proven by `LONG-01`. |
| NFR-002 | A11Y-CORE | `tests/e2e/support/accessibility.ts` (axe, 320 px reflow, focus, reduced motion) across five browser/device projects; keyboard-only Action journey | `EVIDENCED` (automated) / `EXTERNAL` (screen reader) | The required "supported screen reader path" has had no human review (IP-10.5). |
| NFR-003 | A11Y-NO-SENSORY, FAULT-OPTIONAL | No optional sensory layer exists; states are text; the reduced-motion check removes all motion; mobile projects | `EVIDENCED` | Evidenced by absence of optional layers. It must be re-proven if a layer is ever selected. |
| NFR-004 | CHANGE-NOTICE, MODEL-FALLBACK | `ip9-model-provider` "records a material profile change once and publishes its notice"; `ip8` material-change records | `EVIDENCED` | — |
| NFR-005 | INV-07, INV-13, SEC-ACCESS, E2E-EXPLANATION | Explanation and scope tests (PR-004); `ip10-invariants` INV-07; `ip10-access-sweep`; `e2e/ip8-trust-lifecycle` visibility | `EVIDENCED` (automated) + `EXTERNAL` | Operator visibility and audited operator access are open threat-model items. |
| NFR-006 | LONG-01 | `tests/integration/long01.test.ts`: 20 sessions over 30 simulated days on real PostgreSQL, every §5.2 schedule element and the §5.3 pass conditions asserted (CI `36198101564`) | `EVIDENCED` (deterministic, structural) / `EXTERNAL` (model quality, human judgment) | Character identity is a structural rubric; judged voice quality needs an approved provider and human review. |
| NFR-007 | PERF-ACK, FAULT-SLOW, INV-01 | CI `perf:ack`: p95 427.9 ms at `69228ef` (200 Actions, concurrency 10); IP-10.6 drill p95 569 ms at 300 Actions, concurrency 20, with a worker killed (CI `36198101564`); `ip9-model-provider` "shows the ten-second wait state…" | `EVIDENCED` (CI profile) / `EXTERNAL` (supported-device profile) | The CI profile is server-side. Single-worker queue drain (acknowledged-to-proposal p95 54 s at that load) is an observation; worker count is a launch-environment decision. |

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
| INV-05 | `ip6` protected-authority guards; `packages/domain` closed impact classification for fact rewrite (L3) and movement (L2); MGC-1 relationship rows (routine adjacent step L2; protected change or jump L3; forged L2 refused in SQL) | `EVIDENCED` for the implemented rows | The scope-widening and Memory Candidate rows have no operation. The table can only be exercised for rows the product implements. |
| INV-06 | `ip9-model-provider` out-of-envelope rejection; `ip6`/`re3` SQL rejection of forged proposals | `EVIDENCED` | — |
| INV-07 | `ip10-invariants` "INV-07: keeps private facts and user text out of every API log line" (debug level, success and error paths); `ip6` scoped manifest; `ip4-adversarial` private IDs | `EVIDENCED` (CI `36100042739`) | — |
| INV-08 | `ip10-invariants` "INV-08: a correction still governs the next context after a model-profile change"; `ip4-adversarial`; `ip6`; `re3` correction boundary | `EVIDENCED` (CI `36100042739`) | — |
| INV-09 | `ip10-invariants` INV-09: Restore leaves consents, usage ledger, exports and grants unchanged; `ip5-recovery` | `EVIDENCED` (CI `36100042739`) | — |
| INV-10 | `authoritative-spine` "keeps an existing Continuity pinned…"; `ip7-world-studio`; `e2e/ip7-world-studio` | `EVIDENCED` | — |
| INV-11 | `ip4-adversarial` "marks a delayed projection stale while keeping the authoritative fallback readable…"; `ip9-fault-matrix` rebuild | `EVIDENCED` | — |
| INV-12 | `ip10-invariants` "INV-12: an export carries no provider data and nothing from other accounts" (and only the selected scope); `ip8`; `ip9-object-storage` | `EVIDENCED` (CI `36100042739`) | — |
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
| **Five relationship changes that keep their cause links** | Yes since MGC-1: `SHIFT_RELATIONSHIP` with a causal Event. |
| **Three threads correctly open or resolved at the end** | Yes since MGC-1: authoritative `threads` with `OPEN_THREAD` / `RESOLVE_THREAD` Events. |
| **At least one transformed failure** | Yes since MGC-1: `TRANSFORM_FAILURE` against a declared constraint, with exact confirmation. |

At first mapping the last three elements were unsupported. The product owner
chose a separate bounded track (MGC-1) to close them, and MGC-1 passed
independent review on 2026-09-25. Every element is now supported. The `LONG-01`
harness passed in CI `36198101564`; see [IP-10-LONG-01-AND-DRILLS-REPORT](IP-10-LONG-01-AND-DRILLS-REPORT.md).

## 6. Other IP-10 work items at a glance

| Item | State today | Engineering can do now | Needs outside input |
|---|---|---|---|
| IP-10.4 compatibility | Done: [IP-10 Compatibility Matrix](IP-10-COMPATIBILITY-MATRIX.md). Forward migration, restore and rollback by restore are `VERIFIED`. In-place downgrade is `NOT SUPPORTED`. The prior release serving from the restored backup is `NOT REHEARSED`. A stale G9 tab on an MGC-1 World is `ANALYSED — PARTIAL`. | — | Rollback window and DR targets |
| IP-10.5 privacy/security/a11y | The SEC-ACCESS sweep, INV-07 and INV-12 are done (§6.1); automated a11y; six open threat-model items | — | Specialist penetration, privacy/legal review and human screen-reader review |
| IP-10.6 performance/capacity/fault | CI `perf:ack`, fault matrix, restore drill; capacity and killed-worker drill passed (CI `36198101564`) | — | The production device and network profile, and worker count |
| IP-10.7 operations | Runbooks, plus [alert definitions](IP-10-ALERT-DEFINITIONS.md): 17 alerts on existing logs and probes, with signal gaps recorded (no production acknowledgement latency) | — | Named owners, tested escalation, and the monitoring stack (cloud vendor) |

### 6.1 SEC-ACCESS sweep result (IP-10.5)

`tests/integration/ip10-access-sweep.test.ts` passed on real PostgreSQL in CI
`36103979617`. A second account presents one owner's identifiers to 43
owner-scoped route probes. The route list is read from the API source, so a
new route that the sweep does not cover fails the test.

- Every mutation and most reads are refused with 403 or 404.
- No response contains the owner's content, and nothing the owner holds
  changes.
- Three reads answer instead of refusing. Each answers exactly as for an
  identifier that does not exist, so neither content nor existence leaks:
  - the access explanation (both resource types) returns `accessLevel: NONE`
    and `reasonCode: NOT_FOUND`, by design;
  - `GET /v1/branches/:branchId/actions` returns an empty list with 200.
- **Observation, not a violation:** the empty-list read meets the frozen rule
  ("without leaking existence"), but it differs from sibling Branch routes,
  which return 404. Aligning them would be a behavior change and is not made
  in IP-10.
- An appeal may name a resource the caller cannot reach, for example to appeal
  an access denial. The appeal is the caller's own record and never looks the
  subject up, so an unknown identifier is answered the same way.

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

**Progress at update 1 (2026-09-25):**

| Step | State |
|---|---|
| 1 | Done (`3f84328`, CI `36100042739`) |
| 2 | Done; `E2E-CONTINUITY-IMPACT` in CI `36207364368` |
| 3 | Done (`f68addd`) |
| 4 | Done: rehearsal plus the compatibility matrix |
| 5 | Done (CI `36198101564`) |
| 6 | Done (CI `36198101564`); found the defect repaired in `28b0d8a` |
| 7 | Updates 1–3; IP-10.7 alert definitions written |

## 9. G10 conditions: engineering evidence and `EXTERNAL`

This section records where each condition stands at update 3. The final IP-10
engineering review returned `PASS` (0B/0I/1M, inherited) and found that G10
can enter conditional closure; see [IP-10 Final Engineering Review](IP-10-FINAL-ENGINEERING-REVIEW.md).

| G10 condition | Engineering evidence | Still `EXTERNAL` |
|---|---|---|
| Every MUST PR/NFR has passing evidence | §2: every MUST row is `EVIDENCED` for what the product implements (CI `36207364368`) | Model-quality and human-judgment parts of PR-005, PR-006, PR-010 and NFR-006 |
| Architecture invariants hold | §4: INV-01–INV-13 evidenced (INV-01 for the implemented Action kinds, INV-05 for the implemented rows) | — |
| `LONG-01` passes | 20 sessions / 30 days on real PostgreSQL | Judged character quality on a real model |
| Security and privacy (automated) | SEC-ACCESS sweep, INV-07, INV-12, the access tests | Specialist security, privacy and legal review |
| Accessibility | Automated axe, 320 px reflow, keyboard and reduced motion on five projects | Human screen-reader review |
| Compatibility and rollback | [Compatibility matrix](IP-10-COMPATIBILITY-MATRIX.md); upgrade and rollback-by-restore rehearsal | Rollback window, DR and retention targets |
| Capacity and fault tolerance | IP-10.6 drill (300 Actions, concurrency 20, worker SIGKILLed), fault matrix, restore drill | Production device and network profile, worker count |
| Operations readiness | [IP-9 runbooks](IP-9-RUNBOOKS.md) and [alert definitions](IP-10-ALERT-DEFINITIONS.md) | Named owners, tested escalation, monitoring stack |
| Plan §20 decisions | — | Cloud vendor and region; OIDC and adult eligibility; real model provider and retention/training terms; safety taxonomy and appeal policy; pricing; retention, purge and DR targets; brand and asset provenance |

SHOULD selection is unchanged: PR-012, PR-015, PR-016 and PR-017 are not
selected.

