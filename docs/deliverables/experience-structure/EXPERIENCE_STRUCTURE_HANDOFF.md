# Experience Structure / Text Wireframe V0 Handoff

**Status:** `EXPERIENCE STRUCTURE V0: COMPLETE`  
**Date:** `2026-08-27` (`Asia/Shanghai`)  
**Explicitly not:** `NOT FINAL UI` · `NOT FINAL VISUAL DESIGN` · `NOT IMPLEMENTATION`

## 1. What is now defined

This package defines the original experience structure for Simulora’s player-first, continuity-first MVP. It translates frozen product and system contracts into user-understandable capabilities: a personal-world entry, playable-first setup, active participation, action truth, causal change explanation, return orientation, continuity inspection/correction, Branch/Restore recovery, progressive solo creation and moment-of-need trust information.

It does **not** choose a visual language, page composition, brand, component library, implementation technology, final copy, public discovery model, marketplace, team-creator workflow, sensory layer or new state/runtime semantics. References and competitor research were used only as bounded risk/mechanism inputs through the existing frozen product definition; no competitor page, layout, wording or visual language was copied.

## 2. Package contents

| Document | Purpose | Primary next-stage reader |
|---|---|---|
| [Experience Architecture V0](EXPERIENCE_STRUCTURE_V0.md) | Surface model, information hierarchy, navigation grammar, full core vertical slice and experience exclusions. | Product/experience lead. |
| [Core User Journeys V0](CORE_USER_JOURNEYS_V0.md) | Six goal-led journeys for return, start, participation, continuity correction, recovery and progressive creation. | Prototype planner and UX researcher. |
| [Text Wireframes V0](TEXT_WIREFRAMES_V0.md) | Ten representative Desktop/Mobile logical structures with required information and semantic constraints. | Interaction and visual designer. |
| [Interaction States V0](INTERACTION_STATES_V0.md) | Global and surface-level loading, acknowledgement, proposal, confirmation, Commit, conflict, privacy and recovery behavior. | Interaction designer, accessibility reviewer and future implementation planner. |
| [Component Opportunity Map V0](COMPONENT_OPPORTUNITY_MAP_V0.md) | Candidate component categories, adoption criteria, anti-patterns and components that must remain original semantic patterns. | Component-exploration lead. |
| [Open Experience Decisions V0](OPEN_EXPERIENCE_DECISIONS_V0.md) | 13 explicit decisions requiring later product, visual, specialist or ADR authority. | Product owner and prototype-research lead. |

## 3. Core vertical slice

```text
Personal World Shelf
  → Start / adapt a playable World OR return to an owned World
  → Current scene + active two-axis Participation Contract
  → user Action
  → durable acknowledgement (not committed)
  → provisional generation / validation
  → exact confirmation when required
  → committed Change Trace
  → leave and Return Orientation
  → Continuity Lens / scoped explanation
  → correction or experiment
  → Branch / Restore / interruption recovery
```

This sequence is a minimum **experience proof path**, not a fixed page flow. Its required user outcomes are: play begins without prompt engineering; a participant knows when the world has actually changed; a returning participant can resume; an accessible persistent fact can be explained/corrected; and an experiment does not destroy the original.

## 4. Boundary self-check

| Check | Result | Evidence in this package |
|---|---|---|
| Aligns with primary user and JTBD-01–05 | **PASS** | World Shelf and Return Orientation prioritize continuity; Start/Studio are playable-first; Recovery is cross-cutting. |
| Covers MVP `MUST-01`–`MUST-12` at experience level | **PASS** | Architecture traceability table, wireframes W-01–W-10 and Interaction States surface matrix. |
| Treats `SHOULD` capabilities as optional | **PASS** | Goal-framed structure, preview/check, migration and bounded sharing are labeled conditional; none blocks the core loop. |
| Preserves two independent participation axes | **PASS** | Dedicated contract surface, contract journey and state rules prohibit a single ambiguous mode or ordinary-Action mutation. |
| Preserves Action/Commit authority | **PASS** | Acknowledged, provisional, confirmation-required, committed, conflict and recoverable states are separately defined. |
| Preserves canonical continuity and explanation boundaries | **PASS** | Continuity Lens labels canonical/history/derived and shows only scope-filtered Explanation Projection content. |
| Preserves L1/L2/L3 and direct L3 confirmation | **PASS** | Interaction States and correction journey distinguish routine explanation from exact target/effect/scope review and stale renewal. |
| Preserves Branch/Restore semantics | **PASS** | Recovery Lab distinguishes safe point, Branch, Restore, correction/removal and Delete; source preservation is explicit. |
| Supports accessible/quiet/degraded operation | **PASS** | Every core state has readable, keyboard-reachable and mobile-sequenced requirements; no media/visualization is required for truth. |
| Avoids scope creep | **PASS** | No marketplace, feed, public discovery, team creation, deterministic game engine, mandatory map/app dock or sensory dependency. |
| Avoids competitor-expression copying | **PASS** | Surfaces are organized around Simulora’s continuity/authority questions; no reference UI/IA/component arrangement/copy is reproduced. |
| Avoids implementation | **PASS** | The package contains only Markdown experience documents and explicitly selects no library, stack, final UI or prototype implementation. |

## 5. Next-stage constraints

The next stage may explore visual directions and screen candidate component **categories** only through the requirements in this package. It must preserve the following constraints:

1. Do not make a streaming response, local UI state, summary, cache or component state appear authoritative before an accepted Commit.
2. Do not turn the Participation Contract into a single “mode” or make a regular Action mutate it. Only the direct, current-state contract-transition experience may change it.
3. Do not expose private/model-only context while explaining a fact or a change. Explanation must be useful from permitted source class/Commit, scope, freshness and correction path alone.
4. Do not make high-impact canonical correction/removal, scope widening or protected relationship redefinition feel like a routine edit. Exact target/effect/scope and direct confirmation remain mandatory.
5. Do not make a Branch, Restore or Delete look interchangeable. The original-preservation statement has higher priority than visual compactness.
6. Do not use optional state expression—maps, graphs, motion, audio, media or large visual scenes—as the only means to understand or control the world.
7. Do not add a feature because a component, visual reference or competitor surface makes it attractive.

## 6. Open-decision handoff

The immediate interaction/design decisions are OED-01 through OED-13 in [Open Experience Decisions V0](OPEN_EXPERIENCE_DECISIONS_V0.md). The highest-priority choices for component screening and high-fidelity prototyping are:

| Priority | Decision | Why it should be tested before a broad high-fidelity set |
|---|---|---|
| 1 | OED-01 Return Orientation density | It determines whether the primary user can resume without a dashboard or transcript overload. |
| 2 | OED-02 Participation Contract transition scope/cadence | It determines how authority remains legible across play without a confusing controls burden. |
| 3 | OED-03 Action truth/provisional reading experience | It is the main trust bridge between input, AI output and Commit. |
| 4 | OED-05 Continuity vocabulary/grouping | It determines whether users can inspect/correct facts without conflating canon, history and derived summaries. |
| 5 | OED-06 L3 confirmation comprehension | It protects user-owned continuity and must work under current-state conflict. |
| 6 | OED-07 Recovery comparison | It prevents dangerous confusion among Branch, Restore, correction and Delete. |
| 7 | OED-13 Visual direction/component system | It is required for high-fidelity expression but may not weaken the six semantic decisions above. |

## 7. Stage conclusion

`EXPERIENCE STRUCTURE V0: COMPLETE`  
`CORE JOURNEY: DEFINED`  
`TEXT WIREFRAMES: COMPLETE`  
`INTERACTION STATES: DEFINED`  
`COMPONENT OPPORTUNITY MAP: READY FOR SCREENING`  
`READY FOR COMPONENT EXPLORATION: YES`  
`READY FOR HIGH-FIDELITY PROTOTYPE: YES — after the stated OEDs are deliberately resolved within that next stage`  
`PRODUCT IMPLEMENTATION: NOT STARTED`

Stop at this handoff. Do not treat readiness for component exploration or high-fidelity prototyping as authorization to implement the product.

## References

- [Product Definition Handoff](../../product/PRODUCT_DEFINITION_HANDOFF.md)
- [Product Principles V1](../../product/PRODUCT_PRINCIPLES.md)
- [Product Positioning V1](../../product/PRODUCT_POSITIONING.md)
- [Target Users and JTBD V1](../../product/TARGET_USERS_AND_JTBD.md)
- [MVP Scope Boundaries V1](../../product/MVP_SCOPE_BOUNDARIES.md)
- [Product Requirements V1](../../product/PRODUCT_REQUIREMENTS.md)
- [System Design Handoff](../../system-design/SYSTEM_DESIGN_HANDOFF.md)
- [Integrated Research Index](../../research/integration/INTEGRATED_RESEARCH_INDEX.md)
