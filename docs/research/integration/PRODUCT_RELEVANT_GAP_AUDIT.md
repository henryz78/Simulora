# Product-Relevant Gap Audit

Status: `COMPLETE`

Audit rule: an unknown is not a task. A gap is ranked by the product decision it would affect, whether existing evidence can bound that decision, and whether the decision must be made now. This audit does not authorize research, Product Requirements, architecture or implementation.

## 1. Result

| Priority | Count | Disposition |
|---|---:|---|
| `P0 — BLOCKING` | **0** | No new targeted research plan is proposed or authorized. Existing evidence is sufficient to begin Original Product Principles. |
| `P1 — IMPORTANT` | 8 | Carry as explicit assumptions or later decision inputs. They do not block Product Principles or PRD formation. |
| `P2 — NICE TO KNOW` | 6 | Defer until a chosen direction makes them useful. |
| `IGNORE` | 9 | Do not spend further research effort in Integrated Research v1. |

## 2. P0 — BLOCKING

**None.**

The corpus already establishes the major user problems, the competing participation modes, core continuity/control tensions, creator/player differences, production/reference feasibility and clean-room boundaries. Choosing a target, promise and trade-off is now product judgment rather than a missing-research problem.

Because there is no P0, this audit contains no targeted research plan. New research must not begin automatically.

## 3. P1 — IMPORTANT, not blocking

| Gap ID | Remaining evidence gap | Why it matters | Why it does not block Product Principles / PRD | Current disposition |
|---|---|---|---|---|
| `GAP-P1-01` | Relative priority of companion, co-writing, sandbox and game-loop segments | It affects initial positioning, interaction contract and evaluation | The modes and their conflicting needs are already well described; the next step can make and document an initial audience hypothesis | `DEFERRED — PRODUCT CHOICE FIRST` |
| `GAP-P1-02` | Safety boundary for a character’s independent stance | N52 is valuable but under-sampled, especially around manipulation, refusal and vulnerable users | Product Principles can require non-manipulation, consent and controllability without selecting detailed behavior | `DEFERRED — SAFETY/PRODUCT REVIEW LATER` |
| `GAP-P1-03` | Long-horizon behavior of nontechnical world operators and rehydrating returners | Current evidence strongly establishes continuity pain but less directly covers months/years of casual operation | A continuity and exit-rights principle can be defined before exact retention horizons or migration UX | `DEFERRED — VALIDATE ONLY AFTER A PROMISE EXISTS` |
| `GAP-P1-04` | Creator maintenance at 50–100+ worlds/characters | The evidence is thinner for bulk operations, dependency management and long-term catalogue upkeep | PRD can scope the first creator tier and avoid claiming enterprise-scale management | `DEFERRED — OUTSIDE INITIAL SCOPE UNLESS CHOSEN` |
| `GAP-P1-05` | Preference for explicit game loops among light/casual players | Goal-driven needs are documented, but launch-segment prevalence is not quantified | Product Definition can choose a conditional mode hypothesis rather than claim universal demand | `DEFERRED — NO BROAD SURVEY` |
| `GAP-P1-06` | Regional, multilingual, accessibility, family and age-governance variation | N36, N38, N45 and N47 identify real needs but not jurisdiction- or locale-complete policies | Principles can commit to accessibility, language fidelity and governed consent while detailed localization/policy work remains later | `DEFERRED — SPECIALIST REVIEW WHEN SCOPE IS KNOWN` |
| `GAP-P1-07` | Current rights status of assets that may eventually be selected | Licence terms, attribution and third-party rights can change | No asset has been selected; per-asset revalidation is adoption due diligence, not a reason to reopen the pool | `DEFERRED — CHECK SELECTED ITEMS ONLY` |
| `GAP-P1-08` | Device/performance budget for any selected immersion effect | Reference feasibility exists, but no chosen UI, target device or sensory minimum exists | Requirements must choose the experience first; later measurement is an engineering validation, not more library research | `DEFERRED — BENCHMARK SELECTED EFFECTS ONLY` |

## 4. P2 — NICE TO KNOW

| Gap ID | Gap | Disposition |
|---|---|---|
| `GAP-P2-01` | Quantified market share of each participation mode | Useful for go-to-market later; not required to state an original product hypothesis now |
| `GAP-P2-02` | Exact user willingness to pay for model quality, continuity or creator capacity | Revisit only after a value proposition and packaging concept exist |
| `GAP-P2-03` | Comparative benchmarks across candidate models | No model or task suite is selected; defer to later product-specific evaluation |
| `GAP-P2-04` | Comprehension and distinctiveness of a future naming shortlist | There is no approved shortlist; defer until capability and positioning are known |
| `GAP-P2-05` | Exact Memory horizon, budget and retrieval metrics by mode | The need and control requirements are established; concrete metrics belong after the interaction promise |
| `GAP-P2-06` | Conversion or engagement value of specific audio/map/motion treatments | No approved experience design exists; defer to later prototypes and accessibility testing |

## 5. IGNORE for Integrated Research v1

| Gap ID | Unknown or tempting expansion | Reason to ignore |
|---|---|---|
| `GAP-I-01` | Eliminate all 47 WorldOS OQ states | Completeness theatre; the frozen OQs already record their limits and do not block original principles |
| `GAP-I-02` | Rerun a full WorldOS site crawl or 70/70 parity exercise | Competitor coverage is closed and cannot become the product backlog |
| `GAP-I-03` | Resolve dynamic catalogue counts such as Maps 1,083 vs 1,085 | Snapshot drift has no product-definition value |
| `GAP-I-04` | Infer WorldOS database, queues, cache, prompts, retrieval weights or hidden APIs | Black-box evidence cannot prove them, and copying hidden implementation is outside scope |
| `GAP-I-05` | Expand the 37 Creator templates for “completeness” | Mechanism coverage is sufficient; more templates do not choose the product |
| `GAP-I-06` | Expand the 48 worlds, 193 characters or third-party IP references | Original content/reference coverage is frozen and already exceeds integration needs |
| `GAP-I-07` | Expand the 314-row visual asset pool or clear every review-only record | Asset supply must follow chosen product needs; unused records do not require remediation |
| `GAP-I-08` | Expand the immersion technology/library viewer | The current library already bounds the option space; its webapp is research tooling, not product code |
| `GAP-I-09` | Trademark/domain/store/social checks for every frozen brand candidate | Formal clearance is meaningful only after a capability-backed shortlist exists |

## 6. Reopen gate

A future request may reopen research only when all of the following are true:

1. An approved original product decision is named.
2. A specific unresolved fact materially changes that decision.
3. Existing user evidence, frozen WorldOS evidence and reference packages cannot bound the choice.
4. The smallest discriminating question, identity/sample, operation, expected outcomes, stop condition and side effects are written before work begins.
5. The user explicitly approves the targeted validation.

This gate applies equally to WorldOS, user research, content, templates, assets, immersion and brand work. P1 and P2 labels do not themselves authorize a study.

