# Component Opportunity Map V0

**Status:** `COMPONENT OPPORTUNITY MAP: READY FOR SCREENING`  
**Scope:** 体验需求到候选组件**类别**的映射与筛选约束。  
**Explicitly not:** `NOT FINAL UI` · `NOT FINAL VISUAL DESIGN` · `NOT IMPLEMENTATION` · `NO LIBRARY SELECTED`

## 1. Purpose

A component can reduce accessibility, interaction-state or rendering risk. It cannot define why a product surface exists, what is authoritative, whether the user retains authority or how a continuity decision is explained. This map begins from the V0 experience requirements and identifies only **categories worth screening later**. It neither selects an implementation library nor imports a competitor’s layout, visual language, interaction choreography, wording or information architecture.

> **Selection rule:** use a mature component only when it preserves the original information hierarchy, accessibility and state semantics. Do not change a requirement merely because a library makes a different pattern easy.

## 2. Component opportunity matrix

| Experience need | Candidate component category to evaluate later | Why a mature option may help | Must remain original product behavior | V0 recommendation |
|---|---|---|---|---|
| Personal World Shelf | Accessible list/grid with status badges, empty state and keyboard navigation. | Supports variable numbers of personal worlds, responsive reflow and focus management. | Return cue, unresolved-action meaning and player-first personal orientation. | **Screen mature primitives.** |
| Start / Adapt a World | Progressive disclosure / staged form / resumable draft pattern. | Helps preserve incomplete starter progress and prevent initial overload. | What makes a world playable; the independent participation/structure contract; no hidden prompt requirement. | **Screen mature form primitives; author the content model.** |
| World Workspace action input | Accessible rich-text / multiline action composer with submit/cancel and live status region. | Supports keyboard, mobile input, progressive status and safe retry affordances. | User Action versus provisional model output versus Commit distinction. | **Screen carefully; action semantics are original.** |
| Action lifecycle | Status banner/region, progress stepper and resilient reconnect/retry pattern. | Improves legibility across acknowledged, generating, confirmation, committed, conflict and recoverable states. | Plain-language trust contract; no generic spinner or false “saved” state. | **Use accessible status primitives; design state language and hierarchy originally.** |
| Consequential confirmation | Accessible modal/dialog or focused confirmation surface with explicit cancel route. | Provides focus trapping, screen-reader announcement and mobile-safe decision flow. | Exact target/effect/scope/current-state binding, authority retained and no implied consent. | **Screen mature dialog primitives; author interaction/semantic contract.** |
| Return Orientation | Structured summary / disclosure / linked detail pattern. | Supports an ordered re-entry briefing that expands selectively. | Selection of meaningful committed changes, freshness and safe next participation point. | **Original composition over generic dashboard.** |
| Change Trace | Event/change summary with expandable causal detail and a stable link to an explanation target. | Can provide legible progressive disclosure without exposing a raw log. | What counts as meaningful, causal explanation, permitted scope and recovery path. | **Original semantic pattern; common disclosure primitives are reusable.** |
| Continuity Lens | Detail sheet/panel, key-value/provenance presentation and accessible contextual navigation. | Supports focus return, nested detail and mobile transition. | Scope-filtered Explanation Projection; canonical/history/derived distinction; no private/model-only leakage. | **Original information contract; screen panel/disclosure primitives.** |
| Correction/removal review | Diff/effect preview, confirmation form, inline validation and stale-state notice. | Helps users compare stated before/after values and understand confirmation constraints. | Closed L1/L2/L3 meaning, exact current target/effect, direct user confirmation and Branch alternative. | **Screen diff/confirmation primitives; never treat generic diff as sufficient explanation.** |
| Participation Contract | Paired option group / comparison surface / explanatory disclosure. | Supports accessible mutually exclusive choices and clear before/after comparison. | Two independent dimensions; ordinary expectation cannot mutate them; explicit user-only contract-change path. | **Must be custom-composed from primitives.** |
| Recovery Lab | Intent-first chooser, source/experiment comparison and effect-preview pattern. | May benefit from accessible selection lists, comparison containers and confirmation primitives. | Safe point versus Branch versus Restore versus correction versus Delete; original preservation statement. | **Custom semantic flow; screen primitives only.** |
| World Studio | Progressive section navigator, structured forms, validation summary and draft-state indicator. | Reduces complexity for solo authoring and supports keyboard/mobile form paths. | Playable-first order, safe defaults, what each deeper layer changes, no professional/team engine. | **Screen form/navigation primitives; author progression logic.** |
| Trust context | Contextual notice, access explanation, usage disclosure, appeal/recovery link pattern. | Supports consistent accessible status and decision disclosures. | Moment-of-need privacy/consent/usage/service-change meaning and non-leaking boundaries. | **Build a product-specific content contract on generic notice primitives.** |
| Branch/Restore comparison | Side-by-side desktop compare and ordered mobile compare. | Mature diff/list/accordion primitives can preserve readability at multiple viewport sizes. | Branch source preservation, Restore’s append-not-truncate meaning, and non-authoritative projections. | **Screen responsive comparison primitives; no graph/timeline requirement.** |
| Optional future state expression | Reduced-motion-safe visual state indicator, optional map/timeline/media viewport. | May later help reflect authoritative state without writing a bespoke accessible behavior from scratch. | Must remain optional, readable without media, and cannot become a core MVP dependency. | **Defer: not part of V0 component selection.** |

## 3. Component classes by adoption posture

### 3.1 Good candidates for mature, accessible primitives

These are interaction infrastructure, not expression: dialogs/confirmation surfaces, option groups, text inputs, status/live regions, accordions/disclosures, lists, menus, keyboard focus management, responsive sheets/panels, simple progress states, form validation and error summaries. Any selected option later must support keyboard-only operation, screen-reader semantics, reduced motion and stable focus return.

### 3.2 Good candidates for structured evaluation, not automatic adoption

Timeline-like history navigation, diff/effect display, rich-text input, virtualized long lists, split-pane comparison, command/search invocation and relationship/graph visualization may reduce later interaction cost. They require explicit evaluation against the product’s readable, quiet and mobile paths. None is required to validate the V0 continuity loop; especially, a graph, map or timeline must not replace a concise causal explanation.

### 3.3 Must remain original interaction patterns

The following are product-specific semantic compositions rather than commodities:

| Original pattern | Why it cannot be selected from a library catalogue |
|---|---|
| **Participation Contract transition** | It must teach and safely change two independent axes, preserve user authority and reject implicit/stale mutation. |
| **Action Truth sequence** | It must distinguish durable acknowledgement, provisional generation, exact confirmation, Commit, conflict and recovery without leaking technical implementation. |
| **Continuity Lens / Explanation Projection** | It needs permitted provenance/scope/freshness/correction meaning without exposing raw prompts, provider reasoning or private context. |
| **Change Trace** | It must make a consequence causally legible and proportionate to impact, not simply render a generic activity feed. |
| **Recovery Lab** | It must turn intent into the correct safe operation and explicitly preserve the original where required. |
| **Playable-first World Studio** | It must reveal authoring layers in terms of their play effect, not database terminology or a copied creator-tool workflow. |
| **Trust context at the moment it matters** | It must surface eligibility, consent, privacy, usage and appeal information precisely without a generic settings dump. |

## 4. Screening criteria for the next stage

A future Component Exploration pass should score a category against the following criteria before any implementation choice.

| Criterion | Required question | Disqualifying signal |
|---|---|---|
| Semantic fit | Can it represent the product’s needed status distinction without relabeling it incorrectly? | It collapses acknowledged/committed, mode axes, source/experiment or accessible/private states. |
| Accessibility | Does it provide reliable keyboard path, focus restoration, names/roles/states and reduced-motion behavior? | Its essential state requires pointer precision, hover-only clues or animated-only understanding. |
| Responsive integrity | Can the desktop and mobile sequence preserve the same decision/recovery meaning? | Important confirmation/context is hidden or lost on mobile. |
| State control | Can product state remain authoritative outside the component and be restored after reload/reconnect? | The component’s local UI state becomes the de facto world/Action truth. |
| Privacy and scope | Can it render only the authorized data supplied to it? | It encourages client-side filtering of raw private context or displays hidden metadata. |
| Customization without imitation | Can it be expressed through an original interaction/visual language? | Its default layout, vocabulary or choreography would reproduce a recognizably competitive product surface. |
| Complexity proportionality | Does it solve a current V0 usability/risk problem without adding a new system? | It introduces unnecessary visualization, realtime architecture, state store or product capability. |

## 5. Deferred component opportunities

The following may be explored only after a later product decision selects their underlying capability. They are not a reason to add a feature or alter the V0 information architecture.

- Optional goal/constraint/arc visualization for Goal-framed worlds.
- Creator preview/check result interpretation.
- Bounded sharing and rights/attribution package review.
- User-directed migration intake and proposed-fact review.
- Optional sensory state expression, including maps, motion, ambient media or advanced visual world representations.
- Public discovery, social, marketplace, team-authoring or enterprise mechanisms, all outside MVP.

## 6. Anti-patterns

- Do not use a dashboard kit to force every continuity concept into generic metric cards.
- Do not use a chat component that makes streamed model output look committed by default.
- Do not use a settings form as a substitute for a direct participation-contract transition.
- Do not use a graph/timeline because it looks like a world simulation if a textual causal explanation would be clearer.
- Do not use a modal component as proof that L3 confirmation is understandable; exact target/effect/scope and a safe cancel path remain required.
- Do not use a library’s default theme, screen hierarchy, terminology or visual language as an unexamined product decision.

## 7. Handoff signal

The next stage may begin **component exploration**, not implementation, when it screens these categories against the V0 interaction states and validates that no candidate overrides the experience authority boundaries.

`NO COMPONENT LIBRARY SELECTED`  
`NO FINAL VISUAL DIRECTION SELECTED`  
`READY FOR COMPONENT EXPLORATION: YES`

## References

- [Experience Architecture V0](EXPERIENCE_STRUCTURE_V0.md)
- [Text Wireframes V0](TEXT_WIREFRAMES_V0.md)
- [Interaction States V0](INTERACTION_STATES_V0.md)
- [Product Principles V1](../../product/PRODUCT_PRINCIPLES.md)
- [MVP Scope Boundaries V1](../../product/MVP_SCOPE_BOUNDARIES.md)
- [System Design Handoff](../../system-design/SYSTEM_DESIGN_HANDOFF.md)
