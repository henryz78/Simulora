# Text Wireframes V0

**Status:** `TEXT WIREFRAMES: COMPLETE`  
**Scope:** 核心体验 surface 的结构化文字线框与信息优先级。  
**Explicitly not:** `NOT FINAL UI` · `NOT FINAL VISUAL DESIGN` · `NOT IMPLEMENTATION`

## 1. Reading this document

These wireframes define **what must be understandable in a moment** and **which information may be deferred**, not pixel arrangement, color, navigation chrome, component selection, copywriting or responsive breakpoint. Rectangles describe logical regions; they may be arranged differently after visual exploration as long as their semantic priority and state rules survive.

The default journey is an adult participant returning to an owned, personal **Guided + Open-ended** world. Goal-framed structure, preview/check and bounded sharing appear only as explicit optional/conditional paths. Public marketplace, discovery feed, team operations, a fixed map or a feature-sized app dock are intentionally absent. [Experience Architecture](EXPERIENCE_STRUCTURE_V0.md) · [MVP Scope](../../product/MVP_SCOPE_BOUNDARIES.md)

## 2. W-01 — World Shelf / personal return

**Primary question:** “Which world can I safely continue, and is there something unresolved?”

```text
+--------------------------------------------------------------------------------+
| PRODUCT CONTEXT                                                                |
| My worlds                     Start a personal world            Trust / Account |
+--------------------------------------------------------------------------------+
| PERSONAL CONTINUATION                                                     [A]  |
|                                                                                |
|  [WORLD: The Long Winter]        [WORLD: A Quiet Observatory]                 |
|  Last known situation: ...       Last known situation: ...                    |
|  Recent meaningful change: ...   Recent meaningful change: ...                |
|  [Resume] [Understand first]     [Resume]                                     |
|                                                                                |
|  [!] One action needs attention: Unresolved / Conflict / Recoverable wait     |
|      [Review action status]                                                 |
+--------------------------------------------------------------------------------+
| BEGIN PERSONALLY                                                             |
|  “Start from an idea, a situation, or a world you want to make playable.”    |
|  [Start or adapt a small world]                                               |
+--------------------------------------------------------------------------------+
```

| Region | Must communicate | Must not imply |
|---|---|---|
| Personal continuation | Ownership/personal relevance, a compact last-known cue and a clear resume path. | A stale cue is current authority or every item is equally important. |
| Attention state | An unresolved, conflicted or recoverable Action is distinct and revisitable. | A delayed Action was lost, committed or deleted without evidence. |
| Begin personally | Starting is about a small playable world, not publishing or browsing a market. | A user must pick from a public catalogue, configure prompts or become a creator first. |
| Trust / Account | Access/consent/usage/service-change routes exist when relevant. | It is the center of the first-session journey. |

**Mobile transformation:** one ordered continuation list with the attention state placed ahead of normal resume options. “Start” remains a first-class intent. Account/trust details are a deliberate secondary transition; nothing critical is only visible on a wide screen.

## 3. W-02 — Start / Adapt a World

**Primary question:** “Can I begin a small world now without making technical promises I do not understand?”

```text
+--------------------------------------------------------------------------------+
| START A PERSONAL WORLD                         Step: playable seed / optional |
+--------------------------------------------------------------------------------+
| WHAT DO YOU WANT TO STEP INTO?                                               |
| [Premise in plain language ________________________________________________] |
|                                                                                |
| WHERE DOES IT BEGIN?                                                          |
| [Immediate situation / place / tension ___________________________________] |
|                                                                                |
| WHO OR WHAT MATTERS FIRST?                                                    |
| [Essential character(s) / relationship / boundary _________________________] |
|                                                                                |
| HOW SHOULD THIS WORLD PARTICIPATE?                                            |
| Initiative:  Guided (default)    [Understand the three choices]              |
| Structure:   Open-ended (default)[Understand optional goal framing]          |
| “You remain the author of your avatar, resources and irreversible choices.”  |
|                                                                                |
| READY TO BEGIN                                                                |
| [Enter first scene]                  [Save and finish later]                 |
|                                                                                |
| ── Make it more specific (optional; not required for play) ──────────────── |
| [Facts] [Character boundaries] [Dynamic state] [Optional goal framing]       |
+--------------------------------------------------------------------------------+
```

### Interaction rules

1. The minimum path collects **only** a playable premise, current situation, essential character/boundary context and readable default contracts.
2. “Enter first scene” succeeds before advanced authoring. Incomplete information should be explained as an unmet playable need, not a schema or prompt error.
3. The two contracts are visibly independent. An initiative choice cannot silently enable a goal arc; selecting goal framing cannot silently delegate avatar authority.
4. Optional deeper inputs explain their effect on play and can be postponed. No visual hierarchy may make advanced configuration appear mandatory.
5. Draft versus playable/published state must remain understandable if the creator path later gains versioning or sharing.

**Mobile transformation:** a short sequential path with a persistent “ready to begin” state. The deeper layers appear after, not inside, the minimum starter sequence. The transition back to the first scene preserves progress.

## 4. W-03 — World Workspace: normal play

**Primary question:** “What is happening, what can I do, and how much is the world allowed to lead?”

```text
+--------------------------------------------------------------------------------+
| WORLD NAME / BRANCH CONTEXT             Guided · Open-ended       [Understand] |
+--------------------------------------------------------------------------------+
| CURRENT MOMENT                          | CONTEXT AT A GLANCE                 |
| Scene / present situation               | Recent meaningful change             |
| Relevant character stance               | Relevant relationship or open thread |
| Place/time only when it informs action  | Freshness / safe-state indication    |
|                                         | [Open orientation]                   |
| Narrative and interaction content       |                                      |
|                                         | [Continuity] [Recovery] [Trust]      |
|                                         | (available by intent, not always open)|
+--------------------------------------------------------------------------------+
| YOUR PARTICIPATION                                                           |
| [Describe what you do / ask / decide ______________________________________] |
| [Submit Action]     “Your choices are yours; the world may propose within     |
|                      the active contract.”                                   |
+--------------------------------------------------------------------------------+
```

| Region | Required information capability | Interaction capability |
|---|---|---|
| World/Branch context | Which personal world/experiment is active and the plain-language participation contract. | Open contract meaning; take intentional change path. |
| Current moment | Scene, characters/stances, place/time and immediate constraint only when they matter to a decision. | Read/act without navigating an encyclopaedia. |
| Context at a glance | Current orientation, meaningful recent change and relevant relationship/open-thread signal. | Expand the relevant source, not a generic database. |
| Participation input | A clear user-authored Action field and accessible alternative interaction method when later designed. | Submit one Action; see acknowledgement and outcome separately. |
| Supporting context | Intent-based access to continuity, recovery and trust information. | Preserve current participation point when opening/closing detail. |

**Desktop transformation:** supports a simultaneous current moment and compact contextual awareness. Supporting context must remain subordinate to acting.

**Mobile transformation:** the current moment and action input are first. Compact context is visible as an ordered summary and opens by explicit transition; return preserves exact reading/action position and pending Action status.

## 5. W-04 — Action lifecycle and consequential proposal

**Primary question:** “Was my action received, what is being considered, and has anything changed yet?”

```text
+--------------------------------------------------------------------------------+
| ACTION STATUS: RECEIVED — NOT YET COMMITTED                                   |
| “Your intent is safely recorded. The world has not changed from this request.”|
| [View current safe state]   [Leave and return later]   [Cancel if eligible]   |
+--------------------------------------------------------------------------------+
| PROVISIONAL RESPONSE                                                            |
| Generated scene continuation / proposal text                                    |
| “This is provisional while the change is validated.”                            |
+--------------------------------------------------------------------------------+
| IF DIRECT CONFIRMATION IS REQUIRED                                               |
| Proposed effect: [exact user-readable result]                                   |
| Affected: [world / relationship / fact / scope]                                 |
| Your authority retained: [avatar / resource / commitment boundary]              |
| [Confirm this exact change]      [Reject / keep current state]                  |
+--------------------------------------------------------------------------------+
| WHEN COMMITTED                                                                   |
| CHANGE TRACE: [what changed] because [permitted cause/source class]             |
| Affects: [relevant entity / scope]    Now possible: [next state/participation]  |
| [Understand this change] [Continue] [Explore safely]                             |
+--------------------------------------------------------------------------------+
```

### State rules

- **Acknowledged:** durable receipt is visible; no world mutation or cost settlement is claimed as complete.
- **Generating / validating:** narrative/proposal may be visible only with a provisional label. The user can leave and later resolve truth from Action status.
- **Awaiting confirmation:** the exact consequential effect, target/scope and current-state dependency are legible. This state is not a disguised permission grant.
- **Committed:** the change trace links back to the authoritative outcome and a next state.
- **Conflict / recoverable wait / recoverable failure:** status is named and offers an intentional next step; generic blank loading is insufficient.

An ordinary Action must not visually double as a participation-mode change. Contract change is a dedicated direct-user flow with full before/after contract meaning and stale-state protection.

## 6. W-05 — Return Orientation

**Primary question:** “What should I understand before I continue?”

```text
+--------------------------------------------------------------------------------+
| WELCOME BACK TO [WORLD]                         Current Branch: [name/context]|
+--------------------------------------------------------------------------------+
| NOW                                                                            |
| [One concise statement of the current situation.]                              |
|                                                                                |
| WHAT CHANGED SINCE YOU WERE LAST HERE                                          |
| • [Meaningful committed change]  [Why / source]  [Affected context]           |
| • [Meaningful committed change]  [Why / source]  [Affected context]           |
|                                                                                |
| WHAT STILL MATTERS                                                             |
| Relationship: [relevant shift or current tension]                              |
| Open thread:  [unresolved situation / declared goal if applicable]             |
|                                                                                |
| CONTINUE                                                                        |
| [Safe next participation point]  [Another legitimate option]                  |
|                                                                                |
| Freshness: [current / rebuilding with source head disclosed]                   |
| [Open full context] [Review pending action if one exists]                      |
+--------------------------------------------------------------------------------+
```

The orientation uses recent **meaningful committed** changes, not an unbounded transcript. If a projection is stale/rebuilding, the user sees that condition and can proceed from authoritative current state rather than being told an uncertain recap is definitive. The screen/surface is a re-entry briefing, not a dashboard that replaces play.

**Mobile transformation:** a single ordered briefing, expanding one section at a time. “Continue” remains available only after the immediate current situation is visible; no deep detail must be read to resume.

## 7. W-06 — Continuity Lens and Explanation Projection

**Primary question:** “Why is this fact/change active, who can see it, and how can I correct it?”

```text
+--------------------------------------------------------------------------------+
| CONTINUITY LENS                                           [Back to world]      |
+--------------------------------------------------------------------------------+
| ITEM                                                                            |
| [Accessible fact / relationship state / committed world change]                |
| Classification: [canonical / history / derived]                                |
|                                                                                |
| WHY IT IS AVAILABLE HERE                                                        |
| Permitted source class: [e.g., user-confirmed fact / committed event]          |
| Commit reference: [human-readable link/reference]                              |
| Scope: [plain-language permitted scope]                                        |
| Freshness: [current / source head / rebuilding as applicable]                  |
|                                                                                |
| WHAT YOU CAN DO                                                                 |
| [Correct this] [Request removal] [View the committed change]                   |
| Correction path: [what will be reviewed, who can confirm, what stays safe]     |
|                                                                                |
| SAFETY BOUNDARY                                                                 |
| “Some context is not shown because it is outside your permitted scope.”        |
+--------------------------------------------------------------------------------+
```

| The user may learn | The user must not be shown |
|---|---|
| The accessible target, its permitted source class/Commit reference, its permitted scope, freshness/source state and allowed correction path. | It never exposes raw prompts, provider reasoning, hidden private source identities or counts, unfiltered model context, or another character/account’s inaccessible knowledge. |

**Correction transition:** a high-impact canonical correction/removal begins from this context. The next step makes the exact target, proposed before/after effect or removal, scope, reason and Branch context reviewable; final direct confirmation occurs only against current state. A stale state requires re-review, never silent application.

## 8. W-07 — Participation Contract change

**Primary question:** “If I change how this world leads, what changes and what remains mine?”

```text
+--------------------------------------------------------------------------------+
| PARTICIPATION CONTRACT — CURRENT                                                |
| Initiative: [Direct / Guided / World-active]                                   |
| Structure:  [Open-ended / Goal-framed]                                         |
| “These are independent choices.”                                               |
+--------------------------------------------------------------------------------+
| CHANGE ONE OR BOTH DIMENSIONS                                                   |
| Initiative: [proposed selection + effect disclosure]                           |
| Structure:  [proposed selection + effect disclosure]                           |
|                                                                                |
| BEFORE / AFTER                                                                  |
| The world may initiate: [plain-language difference]                            |
| The world may structure: [plain-language difference]                           |
| Still always yours: [avatar, resources, irreversible commitments]              |
|                                                                                |
| CURRENT-STATE CHECK                                                             |
| “This change applies to the current world context. If it changed, review again.”|
| [Confirm contract change]  [Keep current contract]                             |
+--------------------------------------------------------------------------------+
```

The experience creates an explicit direct-user `CHANGE_PARTICIPATION_CONTRACT` Action; it does not write through a regular conversation field. On success, it gives an auditable, readable outcome and returns to the same world context. On conflict, it says the active contract changed elsewhere and asks the user to review current state; no axis is silently chosen or collapsed.

## 9. W-08 — Recovery Lab

**Primary question:** “Which action matches my intent, and will my original remain safe?”

```text
+--------------------------------------------------------------------------------+
| RECOVERY LAB                                           Current: [Branch context]|
+--------------------------------------------------------------------------------+
| WHAT DO YOU WANT TO PROTECT OR CHANGE?                                            |
| [Mark a safe point]   [Try another path]   [Restore this Branch]   [Delete...]  |
+--------------------------------------------------------------------------------+
| SELECTED PATH: [Branch experiment]                                                |
| Starting from: [accessible point / current context]                              |
| Your original: [will remain unchanged]                                           |
| New experiment: [named Branch / purpose]                                         |
| [Create Branch]  [Cancel]                                                        |
+--------------------------------------------------------------------------------+
| RESTORE PATH (when selected)                                                      |
| Proposed effect: [readable scoped diff]                                          |
| Preserved: [source Branch/history statement]                                     |
| Not affected: [unrelated ownership/privacy/account statements]                  |
| [Confirm Restore] [Back]                                                         |
+--------------------------------------------------------------------------------+
```

### Semantic distinctions

| Intent | Text shown before commitment | Result users must recognize |
|---|---|---|
| Safe point | “This labels a reachable committed point.” | No separate world/experiment is created; nothing is erased. |
| Branch | “You are creating an alternative from this point; the source stays unchanged.” | Original and experiment remain distinguishable. |
| Restore | “This applies a reviewed prior effect to this Branch as a new committed transition.” | History is not silently truncated. |
| Correction/removal | “This changes the named current continuity item, not an alternative timeline.” | Target/effect/scope are explicitly reviewed. |
| Delete | “This is a lifecycle/ownership action, not a recovery shortcut.” | Scope, retained/removed material and recovery/appeal meaning are clear. |

**Mobile transformation:** action selection precedes effect detail. The user never sees a destructive/irreversible final action until the preservation statement, effect and required confirmation are accessible in the same sequential path.

## 10. W-09 — World Studio: progressive creator disclosure

**Primary question:** “How can I improve playability and behavior without managing a full engine?”

```text
+--------------------------------------------------------------------------------+
| WORLD STUDIO                                      [Return to playable world]   |
+--------------------------------------------------------------------------------+
| PLAYABLE CORE                                                                    |
| Premise | First situation | Essential characters | Boundaries | Readiness       |
| [Edit only what matters now]                          [Begin / resume play]     |
+--------------------------------------------------------------------------------+
| MAKE CONTINUITY MORE INTENTIONAL (optional)                                     |
| [Stable facts] [Contextual knowledge] [Relationships] [Dynamic state]           |
| “Each layer states how it may affect play; none is required for first scene.”   |
+--------------------------------------------------------------------------------+
| OPTIONAL DEPTH (only when selected for MVP)                                     |
| [Goal/constraint pack]  [Preview / behavior check]  [Bounded sharing package]  |
| [Availability and consequence are explained before entering.]                   |
+--------------------------------------------------------------------------------+
| CHANGE SAFETY                                                                    |
| Current draft / playable version meaning | what existing Continuities use        |
| [Review playability] [Discard/return safely]                                    |
+--------------------------------------------------------------------------------+
```

This surface is organized around **effect on play**, not database object categories. It must make a new/changed world’s playable status, dependencies and boundary impact understandable without promising a professional pipeline. Preview/check and bounded sharing remain conditional according to MVP selection, while no path presupposes marketplace discovery or team collaboration.

## 11. W-10 — Trust-context moments

Trust information should appear **at the decision point** instead of being buried in a generic setting surface. These moments can use one shared information pattern while remaining separate product capabilities.

| Moment | User must understand | Minimum action |
|---|---|---|
| Scope/visibility | Who can see/change the selected thing; why this boundary applies; whether it is private, shared, creator-visible or operator/governance-visible. | Review access/correction/appeal path where available. |
| Consent/eligibility/access restriction | The relevant boundary, the effect of continuing and a non-leaking recovery/appeal route. | Continue only with valid permission; cancel or seek allowed recovery. |
| Usage/limited action | What is included/consumed, failure/retry treatment and what remains after cancellation. | Confirm or decline before commitment. |
| Model/service change | User-visible behavior impact, affected scope/timing and safe continue/recover/exit choice. | Acknowledge/inspect choice; retain authoritative world state. |
| Export/delete | Selected scope, privacy/rights meaning, retained original/lifecycle consequence and whether the action is recoverable. | Explicit review and confirmation. |

## 12. Wireframe completeness check

| Required concern | Covered by |
|---|---|
| Enter/create World | W-01, W-02, W-09 |
| Start interaction → Action acknowledged → proposal → Commit | W-03, W-04 |
| Meaningful world change and explanation | W-04, W-05, W-06 |
| Leave/return/quick orientation | W-01, W-05 |
| Continuity/Memory/State/History understanding | W-05, W-06 |
| Participation contract display/change | W-03, W-07 |
| Correction, Branch and Restore | W-06, W-08 |
| Failure/interruption/recovery | W-01, W-04, W-05, W-08, W-10 |
| Creator progressive disclosure | W-02, W-09 |
| Desktop/mobile baseline distinction | W-01–W-10 per-surface transformations |

## References

- [Experience Architecture V0](EXPERIENCE_STRUCTURE_V0.md)
- [Core User Journeys V0](CORE_USER_JOURNEYS_V0.md)
- [Product Requirements V1](../../product/PRODUCT_REQUIREMENTS.md)
- [MVP Scope Boundaries V1](../../product/MVP_SCOPE_BOUNDARIES.md)
- [System Design Handoff](../../system-design/SYSTEM_DESIGN_HANDOFF.md)
