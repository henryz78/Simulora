# Open Experience Decisions V0

**Status:** `OPEN EXPERIENCE DECISIONS: RECORDED`  
**Scope:** Experience Structure V0 明确依赖但不应自行决定的产品、交互、视觉、政策与验证选择。  
**Explicitly not:** `NOT FINAL UI` · `NOT FINAL VISUAL DESIGN` · `NOT IMPLEMENTATION`

## 1. How to use this register

An open decision is not a missing requirement to fill by copying a competitor or selecting a component. It is a choice that requires explicit product judgment, a focused prototype/validation question, a specialist decision, or a superseding ADR when architecture changes. Until resolved, the text wireframes state the **experience capability** and the decision boundary rather than invent a final screen or behavior.

| Decision class | May be resolved by | Must not be silently resolved by |
|---|---|---|
| Product/experience trade-off | Product owner decision supported by a focused prototype or user validation. | A reference product, template, visual asset or generic component default. |
| Visual/interaction expression | Visual-direction and component-exploration stage. | This V0 document, a design-system preset or a competitor screenshot. |
| Privacy/safety/legal/commercial policy | Relevant product owner plus specialist/legal/safety review. | UI wording, a client-side control or model behavior. |
| Architecture/authority/persistence change | Explicit ADR and validation plan. | High-fidelity prototype convenience or page-level state. |

## 2. Decisions required before high-fidelity prototype fidelity

| ID | Open experience decision | Why V0 does not decide it | V0 invariant that must remain true | Suggested next validation question |
|---|---|---|---|---|
| OED-01 | **Return Orientation density and user control**: how many recent changes/relationships/threads appear first, how participants expand or mute detail, and how different world rhythms affect the briefing. | PRD requires understandable orientation, not a fixed recap length, dashboard or ranking algorithm. | Shows current situation, meaningful committed changes, relevant context, freshness and a next participation point without raw transcript overload. | Can returning participants identify the intended thread and safe next move from a concise briefing without feeling controlled by it? |
| OED-02 | **Participation Contract transition scope and cadence**: whether a permitted contract change is best framed as a world-context, session-context or declared segment choice, and when the active contract needs restatement. | Product documents require separate axes and clear change; they do not select detailed cadence or wording. System Design fixes the direct Action/expected-head authority path. | Two axes remain independent; ordinary Action expectation remains match-only; changes are explicit/direct/audited; avatar/resource/irreversible authority remains user-owned. | Do users distinguish initiative from structure and predict before/after behavior at the proposed change moments? |
| OED-03 | **Provisional-generation reading experience**: how much generated draft is exposed before Commit, when a user can leave, and what progress explanation is sufficient. | V0 must preserve provisional/committed distinction but should not predetermine a streaming composition. | Acknowledged is never presented as committed; current safe state and recoverable return remain available. | Can users accurately state whether an action changed the world during normal delay, long wait and reconnect? |
| OED-04 | **Change Trace granularity**: which routine L2 changes remain compact, when causal explanation expands automatically, and how much source detail is helpful. | Principle 5 requires proportional disclosure rather than a fixed activity feed. | Consequential change is attributable, scope-aware and recoverable; routine world evolution is not turned into confirmation fatigue. | Can users explain a meaningful consequence and locate its correction/recovery path without being overwhelmed by low-impact events? |
| OED-05 | **Continuity vocabulary and information grouping**: participant-facing names for canonical continuity, history and derived material; whether the user first encounters a contextual lens, a dedicated space or both. | The system meaning is frozen; its final language and structure are not. | The experience must distinguish rather than collapse authoritative continuity, history and derived items; Explanation Projection remains scope-filtered. | Which explanation framing lets users correct a persistent fact without mistakenly treating a summary or transcript as canon? |
| OED-06 | **L3 confirmation comprehension pattern**: how an exact target/effect/scope/current-state review is sequenced, including how stale-head renewal is explained. | A direct final confirmation is required, but component/form choreography is a later interaction decision. | No adjacent ordinary Action, prior state or model message can serve as hidden confirmation; cancel leaves continuity unchanged. | Before confirming, can participants correctly predict the result and select Branch instead when they only mean to experiment? |
| OED-07 | **Recovery Lab comparative presentation**: how safe point, Branch, Restore, correction and Delete are introduced and compared in desktop/mobile flows. | Requirements define different effects but no mandated navigation or visualization. | Source preservation, Restore append semantics, correction target precision and Delete lifecycle meaning remain distinct. | Do participants select the right recovery action for a stated intent and understand what remains unchanged? |
| OED-08 | **Creator starter content and readiness language**: which original premise/character examples are used and how playability is explained to a newcomer. | Content emphasis and starter-world count are deliberately open; reference libraries do not decide launch content. | Small personal world begins playably without hidden prompt configuration; advanced layers remain optional. | Can a newcomer produce and start a meaningful small world without assuming the product is a professional authoring tool? |
| OED-09 | **Creator progressive-depth threshold**: when deeper facts, contextual knowledge, dynamic state, constraints and optional preview/check are revealed. | V0 fixes progressive disclosure, not exact grouping, sequence or completeness threshold. | Required playability cannot be hidden; preview/check and bounded sharing stay conditional, not mandatory starter steps. | Can advanced creators find behavior-affecting controls without forcing light creators through them? |
| OED-10 | **Goal-framed optionality expression**: how optional goals, constraints, stakes and completion arcs are offered without making open-ended worlds feel incomplete. | Goal-framed structure is a `SHOULD`, not a default product loop. | Open-ended remains valid; selecting goal framing is independent from initiative and does not create a full deterministic RPG promise. | Do users understand that a world can be meaningful without a declared completion arc? |
| OED-11 | **Trust-context timing and vocabulary**: detailed language for privacy, consent, eligibility, usage, service/model change and appeal moments. | Regional policy, retention, pricing and provider presentation remain open. | Information appears at point of use, is non-leaking, and preserves accessible recovery/appeal/exits where available. | Can users accurately answer who can see/change what and the consequence of a limited/protected action at the moment of decision? |
| OED-12 | **Desktop/mobile navigation expression**: final persistent versus on-demand context model, focus-return behavior and information density choices. | V0 establishes equivalent jobs and semantic priority, not breakpoint/layout architecture. | Mobile supports every core action/confirmation/recovery outcome through a readable, keyboard/screen-reader-compatible ordered path. | Does a participant retain context and pending-action truth when moving between primary and supporting surfaces on a small viewport? |
| OED-13 | **Visual direction and component system**: typography, color, imagery, motion, density, panel language and chosen primitives. | This is explicitly outside Experience Structure V0. | Visual expression cannot hide authority, freshness, scope, status or recovery; optional sensory layers remain optional and degraded-path safe. | Which original visual direction improves calm comprehension and world presence without imitating a competitor or requiring high-end devices? |

## 3. Decisions deliberately deferred beyond Experience Structure

The following are not inputs to component selection or a high-fidelity prototype unless separately reopened:

- Final brand, name, trademark, domain and brand voice.
- Launch regions, adult-verification mechanisms, retention terms, detailed privacy/legal policy and appeal service levels.
- Pricing, entitlement packages, allowance/credit mechanics and provider/model presentation.
- Exact content catalog, public/private starter defaults and creator licensing policy.
- Public discovery, social feed, marketplace, ratings, follows and creator monetization.
- Team authoring, professional operations, multi-user worlds, deterministic RPG engine and exact simulation clock.
- High-fidelity maps, 3D, spatial audio, procedural terrain, advanced media/animation systems or any feature that weakens the readable/quiet path.
- New persistence/authority/storage/runtime mechanisms; these require an architecture decision, not a design-screen workaround.

## 4. Decision escalation rules

| If a prototype finding suggests… | Then… |
|---|---|
| A better layout or component category | Record it in Component Exploration and test it against V0 state semantics. |
| Different information density, vocabulary or sequence | Resolve the relevant OED through focused experience validation and update the V0 documents with an explicit rationale. |
| A new user capability not traced to the primary jobs | Reject or defer it until a user problem, principle and requirement path are approved. |
| Changing who may act, what is committed, privacy scope, confirmation, recovery or persistence | Stop; require product/architecture review and a successor ADR if the system contract changes. |
| A map/animation/immersive feature that seems attractive | Keep it conditional until an approved product moment, accessibility/degraded path and measured value are established. |

## 5. V0 decision boundary check

| Check | Result |
|---|---|
| Does this register choose a final UI or visual language? | **No.** |
| Does it add public marketplace, team authoring, social or immersive dependencies? | **No.** |
| Does it alter Action/Commit, participation authority, scope filtering or Branch/Restore semantics? | **No.** |
| Does it preserve room for later component exploration and high-fidelity prototype testing? | **Yes.** |
| Does it identify where a later prototype can answer a real user-comprehension question? | **Yes.** |

`OPEN EXPERIENCE DECISIONS: RECORDED`  
`NO UNAPPROVED PRODUCT OR ARCHITECTURE DECISION MADE`

## References

- [Experience Architecture V0](EXPERIENCE_STRUCTURE_V0.md)
- [Core User Journeys V0](CORE_USER_JOURNEYS_V0.md)
- [Text Wireframes V0](TEXT_WIREFRAMES_V0.md)
- [Interaction States V0](INTERACTION_STATES_V0.md)
- [Component Opportunity Map V0](COMPONENT_OPPORTUNITY_MAP_V0.md)
- [Product Positioning V1](../../product/PRODUCT_POSITIONING.md)
- [Product Requirements V1](../../product/PRODUCT_REQUIREMENTS.md)
- [System Design Handoff](../../system-design/SYSTEM_DESIGN_HANDOFF.md)
