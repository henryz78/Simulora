# Core User Journeys V0

**Status:** `CORE JOURNEY: DEFINED`  
**Scope:** 以用户目标、状态与可观察结果描述体验旅程。  
**Explicitly not:** `NOT FINAL UI` · `NOT FINAL VISUAL DESIGN` · `NOT IMPLEMENTATION`

## 1. Journey design rules

Each journey begins with a user intention, exposes only the information required for the next decision and ends with a recoverable outcome. A journey may enter a lower-detail surface but must preserve three distinctions throughout: **provisional versus committed**, **accessible versus unavailable due to scope**, and **experiment versus original continuity**. This makes the experience compatible with the frozen Action/Commit, scope and Branch contracts without depicting technical internals. [Experience Architecture](EXPERIENCE_STRUCTURE_V0.md) · [System Design Handoff](../../system-design/SYSTEM_DESIGN_HANDOFF.md)

| Journey | Primary user job | Highest-risk misunderstanding to prevent | Success signal |
|---|---|---|---|
| J-01 Return and re-enter | JTBD-01 | “I do not know whether my world, recent change or open thread survived.” | The user can name the current situation, a relevant change and a safe next action. |
| J-02 Start/adapt a personal world | JTBD-04 | “I must become a prompt engineer before I can play.” | The user reaches a playable first scene from a small personal premise. |
| J-03 Participate and understand consequence | JTBD-02/03 | “The system acted as me” or “the streamed response already saved.” | The user can distinguish their Action, the provisional output, any required confirmation and the committed change. |
| J-04 Inspect and correct continuity | JTBD-03/05 | “I cannot tell why this fact is used or safely repair it.” | The user sees permitted provenance/scope and can complete an intentional correction or removal. |
| J-05 Explore, Branch, Restore and recover | JTBD-05 | “Trying something or reconnecting will erase the original.” | The user can compare an experiment/recovery effect and preserve the source continuity. |
| J-06 Shape a world progressively | JTBD-04 | “The creator path is a separate professional tool or changes my live world silently.” | The user can improve a playable world through optional layers and understand what is draft, preview or published/playable. |

## 2. J-01 — Return and re-enter a meaningful world

**Trigger:** the participant opens a personal world after a normal exit, an interruption, a delayed Action, or a meaningful gap.

| Moment | User question | Experience response | State boundary / recovery |
|---|---|---|---|
| 1. Locate | “Which world can I continue?” | World Shelf presents owned/pinned worlds with a compact, understandable return cue. An unresolved Action is visibly distinct from a completed one. | A current cue is not proof of state; the next step obtains current orientation. |
| 2. Orient | “What is true now?” | Return Orientation states current situation, meaningful recent changes, relevant relationships/open threads and one safe participation point. | It identifies freshness/source state; stale/rebuilding orientation is disclosed rather than silently treated as current. |
| 3. Resolve interruption | “Did my last action save?” | If needed, the user sees the acknowledged Action’s named status: unresolved, committed, conflict, recoverable wait or failure. | Action status, not remembered streaming output, resolves the question. |
| 4. Decide | “What can I do next?” | The user may continue, inspect a cited change, open continuity detail, create an intentional recovery path or leave. | Continuation uses the current Branch; no invisible replay or automatic recovery occurs. |
| 5. Resume | “Can I rejoin without retelling everything?” | World Workspace opens at the participation point with orientation available by return intent. | A normal return does not demand prompt reconstruction. |

**Required content language:** concise present-state language, explicit freshness when applicable and a distinction between what changed and what is merely suggested.

**Failure/recovery variation:** if state cannot be loaded, show a named temporary/recoverable condition and a safe retry path; do not show the world as deleted unless deletion is confirmed and the user is authorized to know it.

## 3. J-02 — Start or adapt a small personal world

**Trigger:** a new or returning participant chooses to begin a personal world rather than browse a public catalogue.

| Moment | User question | Experience response | Progressive disclosure rule |
|---|---|---|---|
| 1. Choose intent | “Do I want to begin from an idea or continue something I own?” | World Shelf separates personal starting from resume. | No discovery/social feed is needed for the primary loop. |
| 2. Establish a playable seed | “What is the smallest useful world?” | Start / Adapt gathers premise, immediate situation, essential characters and boundaries necessary for a first scene. | Safe defaults produce a valid playable seed; no advanced schema/prompt field is required. |
| 3. Understand participation | “How will this world lead?” | The user sees Guided + Open-ended as the default and can understand the independent initiative and structure contracts. | Do not conflate the two axes or imply that a first-scene input silently changes contract authority. |
| 4. Begin | “What can I do first?” | A first scene presents the immediate situation and a credible participation point. | The first meaningful outcome is play, not a publish/admin task. |
| 5. Deepen later | “Can I make this more mine?” | A non-blocking route to World Studio appears after playable success. | Advanced facts, boundaries, dynamic state, goal framing, preview/check or sharing are labeled optional/conditional where appropriate. |

**Failure/recovery variation:** incomplete starter information results in a plain-language request for the missing playable boundary, never a hidden configuration error. The user may leave without creating an ambiguous half-published world.

## 4. J-03 — Participate, see progress and understand consequence

**Trigger:** the participant chooses a meaningful action in the World Workspace.

| Moment | User question | Experience response | System contract translated to experience |
|---|---|---|---|
| 1. Read the moment | “What is happening and what am I allowed to decide?” | The workspace prioritizes scene, known relevant state, active participation contract and one or more available actions. | Characters/world may propose or advance only under the active contract; avatar authority remains visible. |
| 2. Express intent | “What do I want to do?” | The user submits an Action in natural language or a later accessible structured alternative. | The system records intent; no immediate claim that world state changed. |
| 3. Acknowledge | “Was my request received?” | Immediate acknowledgement is clear, durable and explicitly **not yet committed**. | Acknowledged Actions may remain unresolved. Duplicate retry language is avoided. |
| 4. Generate and validate | “Why am I waiting, and can I safely leave?” | The experience distinguishes generating/validating from committed. It lets the user wait, inspect current safe state, cancel when eligible or return later. | Long waits expose recoverable status rather than a blank/spinner-only state. |
| 5. Request confirmation when required | “What exactly needs my approval?” | For consequential proposal/operation, show the exact effect, affected scope, user authority retained and clear confirm/reject path. | No model narrative, suggestion or stale view acts as authorization. L3 continuity operations bind direct confirmation to target/effect/current head. |
| 6. Commit | “What changed?” | A compact Change Trace appears with change, relevant cause/source category, affected dimension/scope and next state. | Only this committed transition updates authoritative world state. |
| 7. Continue or inspect | “Do I accept this, need more context, or want another path?” | Continue stays in the scene; Expand opens permitted explanation; safe experimentation opens Recovery Lab. | Change visibility is proportionate: routine L2 can remain compact; protected outcomes have a direct recovery/correction path. |

**Failure/recovery variation:**

- **Conflict:** state changed since the user began; show current-state review and intentional new Action path, not automatic merge.
- **Recoverable provider/service failure:** explain that user-owned state remains safe; offer retry/cancel/return based on Action status.
- **Authorization/scope boundary:** state what cannot be done or shown without exposing hidden existence/context; offer available recovery/appeal where applicable.
- **Usage/limit boundary:** before a limited action, show the relevant consequence and choice before commitment; a failed action cannot imply consumption or successful world mutation.

## 5. J-04 — Inspect and correct continuity

**Trigger:** a participant sees a questionable memory, relationship state, past consequence or world fact and needs to understand or repair it.

| Moment | User question | Experience response | Safety and authority rule |
|---|---|---|---|
| 1. Enter from context | “Why is this being shown or used?” | A contextual entry opens Continuity Lens on the relevant accessible fact/change rather than an unfiltered global memory screen. | User sees only items they can access. |
| 2. Explain | “What is this, where did it come from and who can see it?” | Explanation presents the fact/change, permitted source class and Commit reference, permitted scope, freshness and correction path. | Raw prompt, provider reasoning, excluded private sources and inaccessible character knowledge are absent. |
| 3. Classify impact | “Is this a quick repair or a consequential rewrite?” | The experience speaks in effect terms: routine clarification, correction of persistent continuity, removal, scope change or protected relationship meaning. | L1/L2 routine/derived work does not create needless interruption; high-impact canonical effects require L3 confirmation. |
| 4. Preview | “What will change if I fix it?” | Correction path names exact target, before/after effect or removal, scope, reason and Branch context. | The user reviews the current effect; if the state becomes stale, confirmation must be renewed. |
| 5. Confirm or cancel | “Am I sure?” | Final direct confirmation is clear; cancel returns to the untouched explanation. | The system does not interpret an adjacent ordinary Action as confirmation. |
| 6. Resolve | “Did the correction take effect?” | Result shows committed, unresolved or conflict state; after commit, the explanation updates to the new accessible continuity state. | The old information remains historical/provenance-bound subject to lifecycle policy, not silently reasserted as active canon. |

**Failure/recovery variation:** if the correction cannot commit because the Branch head changed, the user is told that the target/effect must be re-reviewed. If an item is derived/non-canonical, the language says it can be rebuilt/removed without misrepresenting it as a permanent rewrite.

## 6. J-05 — Experiment, Branch, Restore and recover

**Trigger:** the participant wants to explore an alternative, create a safe return point, return to an earlier state, or recover after interruption.

| Choice the user means | Experience capability | Preservation statement required |
|---|---|---|
| “I may want a landmark before I continue.” | Create a **safe recovery point** that names a current or accessible Commit. | It records a reference; it does not create a separate world or erase later history. |
| “I want to try another path without risking this one.” | Create a **Branch** from a selected accessible point and make source versus experiment continuously legible. | Source continuity remains unchanged and accessible. |
| “I want this Branch to reflect a prior state.” | Request **Restore** through an effect preview, scope disclosure and confirmation. | Restore appends a new committed state on the chosen Branch; it does not silently truncate history. |
| “I made the wrong persistent fact/change.” | Use **Correction/Removal**, not Branch/Restore, when the intent is to repair the current continuity. | The exact canonical target/effect is reviewed under L3 where required. |
| “I want to permanently remove something.” | Enter a separate **Delete** path with lifecycle and retention meaning. | Deletion is never phrased as a harmless recovery action. |

### Recovery after interruption

A normal interruption rejoins J-01. The user first learns whether the Action is unresolved, committed, conflicted or recoverable; recovery controls never assume a partially rendered/generated response changed the world. The experience must avoid generic “not found” language for loading, delay, conflict, service unavailability and confirmed deletion when the user is authorized to know the difference.

## 7. J-06 — Shape a world progressively

**Trigger:** a participant who has a playable personal world chooses to make it richer, or an advanced solo creator begins with an authored premise.

| Layer | User purpose | What becomes visible | What remains deferred |
|---|---|---|---|
| **Playable starter** | Begin quickly. | Premise, initial moment, essential characters, basic boundaries, readiness to start. | No expert prompt stack or exhaustive state model. |
| **Meaningful structure** | Make continuity and consequences more intentional. | Stable facts, contextual knowledge, declared relationships, dynamic state and optional constraints. | No requirement to expose every data relation or simulate a full engine. |
| **Optional depth** | Test or prepare a world for another person when the relevant scope is selected. | Preview/check, optional goal framing and bounded sharing rights/visibility. | No public marketplace, ratings, bulk operations or team authoring. |

**Success condition:** creator depth is discoverable after a usable first world exists, but an advanced creator can reach the controls that affect playability and behavior without moving to an external prompt-maintenance system.

## 8. Desktop and mobile journey equivalence

Desktop and mobile may organize information differently, but they must support the same job completion and status distinctions.

| Capability | Desktop priority | Mobile priority | Must not change |
|---|---|---|---|
| World Workspace | Simultaneously inspect scene plus a compact continuity/change context. | Maintain scene/action focus; open supporting context by explicit, resumable transition. | Action lifecycle, user authority, scope and committed-state truth. |
| Return Orientation | Support quick scanning of current situation and linked details. | Present a concise ordered briefing that can expand without losing the continuation point. | Recent changes, relationships/threads, freshness and next action. |
| Continuity / Recovery | Permit comparison and detail inspection. | Use deliberate stepwise inspection with preserved context. | Exact target/effect, scope, confirmation and original-preservation meaning. |
| World Studio | Reveal deeper layers beside or after starter content. | Stage layers so the first playable outcome remains reachable. | Safe defaults and access to required creator boundaries. |

## References

- [Experience Architecture V0](EXPERIENCE_STRUCTURE_V0.md)
- [Target Users and JTBD V1](../../product/TARGET_USERS_AND_JTBD.md)
- [Product Requirements V1](../../product/PRODUCT_REQUIREMENTS.md)
- [MVP Scope Boundaries V1](../../product/MVP_SCOPE_BOUNDARIES.md)
- [System Design Handoff](../../system-design/SYSTEM_DESIGN_HANDOFF.md)
- [Runtime, Model and Persistence](../../system-design/RUNTIME_MODEL_AND_PERSISTENCE.md)
