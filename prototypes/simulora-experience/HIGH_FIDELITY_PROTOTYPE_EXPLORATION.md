# Simulora High-Fidelity Prototype Exploration — P1 / P2

**Status:** `PROTOTYPE EXPLORATION: COMPLETE`
**Direction used:** `Quiet Observatory`, with selected warmth from Living Archive and selected clarity from Signal Studio.
**Explicitly not:** `NOT FINAL UI` · `NOT FINAL VISUAL DESIGN` · `NOT PRODUCT IMPLEMENTATION` · `NOT A SYSTEM-DESIGN CHANGE`

## 1. What this prototype tests

This is a static, clickable interaction model for two Experience Structure V0 slices. It uses fictional Greyhaven content only to make state, scope, continuity and correction visible. There is no model call, account, database, persistence, authoring flow, real Branch operation, or authoritative Commit behind the screens.

| Slice | Primary comprehension question | Prototype coverage |
|---|---|---|
| **P1 — Action Truth** | Can a participant distinguish received, provisional and committed states, then understand a bounded L3 confirmation and a safe failure/recovery path? | Action composer; acknowledged waiting state; provisional outcome; exact-effect confirmation; rejection; committed record; interrupted/resume/discard state; Change Trace. |
| **P2 — Return → Continuity Lens → Correction** | Can a returning participant rapidly orient, inspect an allowed explanation for one fact, understand source/scope/freshness, and preview a safe correction? | Three-change return briefing; safe next participation point; Explanation Projection; canonical fact/source class/Commit/scope/freshness/correction path; correction confirmation and supersession result. |

## 2. P1: Action Truth

P1 begins at a stable “World now” composition. The user action sits on a warm **Field Note** surface beneath the current scene, while the dark world environment remains quiet and contextual. “World unchanged” is placed before submission and repeated in the acknowledged state. This deliberately rejects the common chat/agent pattern where a fluent response is visually mistaken for a saved result.

| State | What the participant sees | What it is designed to communicate | Safe exit / recovery |
|---|---|---|---|
| **Ready** | Current scene, editable Field Note, `World unchanged`, Change Trace with only last committed record. | The user can act, but no new state exists yet. | Edit or leave without changing the world. |
| **Acknowledged** | “Action received. The world is still unchanged.” with the current safe state. | Received is not committed; waiting does not imply loss of control. | View possible impact, keep unchanged, or leave and resume in a real product. |
| **Provisional / generating** | A visually separate “Possible outcome · Not committed” record with likely effects. | Generated narrative is a proposal, not authoritative state. | Reject proposal or review the high-impact change. |
| **L3 confirmation** | Direct confirmation dialog with exact effects, scope guard and explicit cancel. | A precise target/effect/scope is being confirmed; not a general preference. | Cancel leaves the world unchanged. |
| **Committed** | “Committed to this branch”, Commit C-118, named facts and `Scope · this branch only`. | The world has now changed and the change is inspectable. | Open the continuity explanation or begin a new action. |
| **Interrupted** | Clear failure language stating no proposal was committed and showing the last confirmed record. | An unsuccessful check is neither a hidden partial success nor an opaque error. | Resume safely or discard the uncommitted action. |

The **Signal thread** is deliberately repeated across current world, Field Note, provisional record, Commit and Change Trace. It is not a decoration or a completion animation: it creates a readable relationship between present position, possible consequence and recorded result. Text, explicit status, Commit name and scope remain the actual evidence.

## 3. P2: Return Orientation → Continuity Lens → Correction

P2 uses an intentionally short return briefing: one current-world sentence, three committed/relevant changes, freshness where it affects confidence, and one safe next point. It avoids an activity feed, a raw transcript, a dashboard of unrelated cards or a forced recap ritual. The participant can continue at the lamp room without reopening history, or open the Continuity Lens when they need to understand a fact.

The lens is a presentation-neutral interpretation of the frozen Explanation Projection boundary. It shows only the user-relevant, permitted record: **what uses the fact; source class; Commit; permitted scope; freshness; and correction path.** It states equally clearly what is not displayed: private context, raw prompts, hidden retrieval or model reasoning.

| P2 moment | Designed behavior | Authority / privacy guard retained |
|---|---|---|
| Return briefing | Three compact changes: world fact, relationship implication, observed event; each is categorically different in language. | Only committed/relevant information is represented; no claim that all history is visible. |
| Continuity Lens | One fact is described as a canonical fact and paired with its allowed explanation. | Source class and Commit are meaningful without exposing model-only/private information. |
| Correction preview | A direct confirmation describes the exact canonical fact change, linked relationship recalculation, preserved history and unchanged branches. | Correction is a new explicit Commit path; it does not silently erase C-118. |
| After correction | A status record calls C-119 committed and says C-118 remains visible but its current effect is superseded. | The visual model distinguishes history from current canonical effect. |

## 4. Desktop and mobile composition

Desktop uses a stable three-part observation deck: a left world/Branch/contract coordinate rail, a broad central current-world or return-reading plane, and a narrow Change Trace. This structure keeps the current world dominant while allowing the user to locate their current Branch and active participation contract without making every support layer permanent.

Mobile removes persistent side rails and converts secondary intent into an ordered bottom navigation. The primary reading flow remains a vertical sequence: context, scene/briefing, action or continuity entry. The Continuity Lens becomes a full-width surface with a visible return route, and high-impact confirmation becomes a bottom-anchored readable dialog. No core P1/P2 outcome depends on hover, a persistent sidebar, color alone, motion alone or a desktop-only interaction.

## 5. Component types represented

No production component library was selected or installed. The prototype represents the following **component categories**, each of which remains subject to later library/implementation evaluation.

| Component type | Prototype instance | Why it is appropriate | What it must not decide |
|---|---|---|---|
| Action composer / text input | Field Note | Makes the action separate from the current world state. | Whether the action changes a contract or commits a fact. |
| Status / live-region pattern | Acknowledged, interrupted, committed status panels | Makes asynchronous and recovery truth readable. | Actual job/progress, which must come from the future runtime. |
| Effect preview / disclosure | Possible outcome record and effect list | Helps participants inspect a proposal before acting. | Authority or automatic persistence. |
| Direct confirmation dialog | L3 confirmation and correction review | Allows exact target/effect/scope review with an equal cancel path. | The system’s final direct-confirmation rule or stale-head handling. |
| Change trace | Right-side observation rail | Keeps a small record of action/check/Commit phases. | Canonical history completeness or a full timeline. |
| Continuity detail panel / mobile sheet | Full-height Continuity Lens | Preserves context while explaining a single fact. | Scope authorization or data filtering, which must be enforced beyond UI. |
| Intentual mobile navigation | Bottom world/return/continuity/restore destinations | Provides an ordered mobile path for P1/P2 surfaces. | Final navigation IA or access to future Recovery Lab. |

## 6. Visual decisions that remain provisional

The prototype intentionally commits only to a coherent exploration direction, not a final visual system. The midnight environment, moon-paper record surfaces, Signal Amber, Fraunces/Manrope pairing, orbit mark, grain, Signal thread and small observation rails are all **provisional**. The world hero image is atmospheric context only; the P2 return surface uses a CSS-built night-harbor fallback rather than making any generated image a product dependency.

The visual constraints are stronger than the style choices: confirmation, scope, error, recovery, freshness and Commit must remain more legible than atmosphere; motion must follow `prefers-reduced-motion`; and the product must not become an AI agent console, a generic SaaS dashboard, a dark terminal or a shader-first experience.

## 7. OED exploration outcome

This prototype provides design evidence but does not itself close any OED. User comprehension testing and explicit product judgment remain required.

| OED | This prototype explored | Current prototype judgment | Still needs validation |
|---|---|---|---|
| **OED-01** Return Orientation density | A three-change briefing plus a safe next point. | **Promising starting point.** It feels intentionally small and avoids transcript overload. | Test whether 3 is enough across slow, dense and high-consequence world rhythms; add participant control/muting rules. |
| **OED-03** Provisional-generation reading | Separate acknowledged, provisional, committed and interrupted surfaces. | **Strong visual hypothesis.** The `not committed` wording and separate record material make the distinction legible. | Test normal delay, long delay, reconnect and leave/return behavior with participants. |
| **OED-04** Change Trace granularity | A compact three-stage rail with last committed record. | **Promising compression model.** It keeps consequential changes visible without a feed. | Define which L2 changes compact/expand and test causal explanation density. |
| **OED-05** Continuity vocabulary/grouping | `Continuity Lens`, `Canonical fact`, `Source class`, `Commit`, `Scope`, `Freshness`, `Correction path`. | **Useful but not final wording.** The distinction is explicit and non-technical enough for a first prototype. | Test whether participants distinguish canonical/history/derived material without instruction. |
| **OED-06** L3 confirmation | Exact effects, preserved/unaffected items, scope guard and symmetric cancel. | **Strong interaction hypothesis.** It is direct without alarmist language. | Add and test stale-head renewal disclosure; test Branch selection when the user wants to experiment. |
| **OED-12** Desktop/mobile navigation | Stable desktop observation deck; ordered mobile bottom nav and full-width Lens. | **Structurally viable.** Mobile preserves reading priority and an explicit return route. | Test focus return, pending-action context, screen reader order and real small-screen confirmation. |
| **OED-13** Visual direction/components | Quiet Observatory with selected archive/studio influences; generic component categories only. | **Good direction for this slice, not a final choice.** The warm record plane and quiet world plane reinforce the desired contrast. | Compare against a warmer Living Archive variation and a more creator-capable Signal Studio variation with the same flows. |

## 8. Next validation questions

The next round should validate comprehension, not add product scope. First, test whether participants can correctly say **what changed, what did not change, and whether a proposal has been recorded** at each P1 state. Second, test whether a returning participant can identify the relevant thread and a safe next step within a short briefing. Third, ask whether the Continuity Lens answers “why is this fact here?” without creating an expectation of private-model transparency. Finally, test whether users choose correction, Branch, Restore or Delete appropriately when shown comparable scenarios.

`P1 HIGH-FIDELITY PROTOTYPE: COMPLETE`
`P2 HIGH-FIDELITY PROTOTYPE: COMPLETE`
`DESKTOP PROTOTYPE: COMPLETE`
`MOBILE PROTOTYPE: COMPLETE`
`OEDs: EXPLORED, NOT CLOSED`
`READY FOR FOCUSED COMPREHENSION TESTING: YES`
`PRODUCT IMPLEMENTATION: NOT STARTED`
