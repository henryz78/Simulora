# Experience Structure V0

**Status:** `EXPERIENCE STRUCTURE V0: DRAFT FOR COMPONENT EXPLORATION`  
**Scope:** 原创体验架构、信息流与核心旅程。  
**Explicitly not:** `NOT FINAL UI` · `NOT FINAL VISUAL DESIGN` · `NOT IMPLEMENTATION`

## 1. Purpose and design boundary

Simulora is a **player-first, continuity-first AI World Simulation**. This V0 defines what a returning world participant must be able to understand and do before visual direction, component selection, prototype behavior, technology selection or product implementation begins. It is an experience-capability model rather than a screen inventory or a copied competitive information architecture.

The launch spine remains **return → choose how to participate → act → understand committed change → continue or recover**. Personal world shaping exists to make this loop more meaningful; it must not turn entry into authoring administration. The structure therefore begins from an owned World Shelf and a playable World Workspace, not from a public catalogue, social feed, marketplace or professional creator console. This follows the primary user and the five frozen jobs, especially JTBD-01 through JTBD-03, while retaining progressive creator and recovery paths for JTBD-04 and JTBD-05. [Product positioning](../../product/PRODUCT_POSITIONING.md) · [JTBD](../../product/TARGET_USERS_AND_JTBD.md) · [PRD](../../product/PRODUCT_REQUIREMENTS.md)

> **Experience rule:** a user should never need to infer whether a sentence is a proposal, whether a change committed, whose information is shown, or whether an experiment changed the original continuity.

## 2. Experience north star

A successful session leaves the participant able to answer five plain-language questions without reading system mechanics:

| User question | Required experience capability | Authoritative boundary respected |
|---|---|---|
| “Where am I, and what matters now?” | Return Orientation turns current committed state, meaningful recent changes, relationship/open-thread context and a next participation point into an understandable re-entry briefing. | Orientation is a freshness-marked projection, not a competing source of truth. |
| “How much is the world allowed to lead today?” | Participation Contract exposes independent initiative and structure dimensions, consequences of the active setting and the user’s authority. | Ordinary Actions only assert the current contract; only a direct user contract-change Action can change it. |
| “Did my action actually change the world?” | Action lifecycle makes acknowledged, provisional, confirmation-required, committed and recoverable states distinguishable. Change attribution connects a committed consequence to source, scope and next state. | Only a Commit represents accepted authoritative change. |
| “Why is this fact or change here, and can I fix it?” | Continuity Lens provides a scope-filtered explanation, correction and removal path for an accessible fact/change. | Explanation Projection is non-authoritative and never exposes private or model-only context. |
| “Can I explore without losing what I had?” | Recovery Lab distinguishes safe point, Branch, Restore and Delete by purpose, impact and preservation of the original. | A Branch preserves source; Restore appends a new Commit; destructive rewind is not V1. |

## 3. Surface architecture

A **surface** is a persistent experience capability. A later visual system may combine or divide these surfaces, but may not remove a MUST capability by hiding it behind an expert-only route.

| Surface | Primary user problem solved | Minimum information to present | Principal actions | Scope and exclusion boundary |
|---|---|---|---|---|
| **World Shelf** | I need a reliable place to return to my own worlds, or begin a small one. | Owned/pinned worlds; last known safe state; a concise return cue; visible unresolved/recoverable status if relevant. | Resume; start a personal world; open world context; access owned assets/settings. | No public discovery graph, marketplace, follower feed or catalogue-first home. |
| **Start / Adapt a World** | I have a premise or idea but do not want to configure a system. | Premise, initial situation, essential characters/boundaries, default participation contract, “ready to begin” statement. | Begin with safe defaults; adapt a small personal world; optionally reveal deeper shaping. | No hidden prompts, extensions or mandatory advanced setup. Templates may be later content input, never a prescribed UI pattern. |
| **World Workspace** | I need to inhabit and affect a world in the moment. | Current scene; current place/time only when meaningful; who is present; current participation point; clear Action lifecycle; compact world signal. | Submit an Action; inspect a visible change; open continuity/orientation; adjust participation through explicit path; pause/leave safely. | This is the primary play surface, not a dashboard of every stored variable or a generic chat transcript. |
| **Return Orientation** | I came back after time away and need context without reconstruction. | Current situation; recently committed meaningful changes; relevant relationship/open-thread state; freshness/source information; one or more safe continuation points. | Continue from a suggested point; open detail for a change/fact; dismiss after understanding. | Must be available after normal interruption; is not an infinite recap, raw log dump or separate truth. |
| **Continuity Lens** | I need to trust, inspect, correct or remove accessible continuity. | Accessible fact/change; permitted source class/Commit; scope; freshness; whether it is canonical, history or derived; correction path. | Inspect explanation; request correction/removal; view affected context; return to workspace. | Never displays raw prompts, provider reasoning, hidden source identity/counts or inaccessible private/character knowledge. |
| **Change Trace** | I need to understand a consequential world/relationship/state shift. | What changed; why/source category; affected people/place/thread; scope; Commit status; available next/recovery action. | Expand explanation; follow to affected item; begin correction/Branch as appropriate. | Low-risk routine changes may stay compact; this is attribution, not an event flood or live debugging console. |
| **Recovery Lab** | I want to experiment, compare, recover or exit without losing the original. | Current Branch and source relationship; safe points; restore effect preview; preservation statement; relevant ownership/privacy warning. | Create safe point; Branch experiment; inspect restore proposal; confirm Restore; open export/delete paths. | No destructive truncate/rewrite disguised as recovery. Export/delete remain bounded trust paths, not the primary workspace. |
| **World Studio** | I want to shape a playable world without becoming a systems engineer. | Playability readiness; starter premise; essential facts/characters/boundaries; optional advanced layers and their effect; preview/check availability where selected. | Start with a playable seed; adjust key world inputs; reveal deeper controls; run preview/check only if included. | Solo progressive authoring only. No professional team workspace, mandatory preview lab, public market or full simulation-engine editor. |
| **Trust Context** | I need privacy, consent, access, usage or service-change information at the moment it affects a choice. | Who can see/change a selected item; relevant consent/boundary; actionable recovery/appeal; usage/limit consequence before a limited action; material service/model change notice. | Review access; change allowed scope; appeal/recover; inspect usage quote; continue/cancel. | Does not settle final pricing, regional policy or provider presentation; no hidden policy-only dead ends. |

### 3.1 Information hierarchy

The architecture uses a simple priority order rather than a fixed dashboard layout:

1. **Act now:** current scene and the user’s next meaningful participation point.
2. **Understand now:** action state, meaningful consequence, required confirmation or recoverable wait.
3. **Trust now:** scope, authority, freshness and recovery information when a user needs to decide.
4. **Inspect when needed:** continuity, relationships, history, source/Commit and deeper state.
5. **Shape when ready:** progressive personal-world controls, then optional advanced creator tools.

This hierarchy prevents continuity from becoming either invisible machinery or an always-open database inspector.

### 3.2 Navigation grammar

Navigation must be described through **intent**, not prescribed controls:

| From | User intent | To | Return behavior |
|---|---|---|---|
| World Shelf | Resume one owned world | Return Orientation, then World Workspace | Keeps the world/Branch context explicit. |
| World Shelf | Begin something personal | Start / Adapt a World | Reaches a playable first scene before deeper authoring. |
| World Workspace | Understand a result | Change Trace or Continuity Lens | Returns to the same scene/participation point. |
| World Workspace | Change participation authority/structure | Participation Contract transition flow | Shows before/after meaning; returns only after the direct user action resolves. |
| Continuity Lens | Correct an accessible item | L3 correction/removal confirmation flow | Reopens the affected explanation with the resulting committed state or recoverable conflict. |
| World Workspace or Continuity Lens | Experiment safely | Recovery Lab | Keeps source and experimental Branch distinct. |
| World Studio | Test personal-world readiness | Playable preview/check when the optional capability is selected | Does not alter an existing real Continuity. |
| Any protected or limited operation | Understand impact before deciding | Trust Context / confirmation state | Cancelling preserves the previous user-visible state. |

## 4. Core vertical slice

The core vertical slice is deliberately one continuity loop, not a set of complete product pages. It demonstrates the product’s original value: **a personal world can be entered, changed, explained, returned to and safely corrected without surrendering authority.**

### Slice A — From personal premise to first playable moment

1. The user enters from the World Shelf or an intentional “start a world” path.
2. Start / Adapt asks only for the minimum needed to make a small world playable: a premise, initial situation, selected/created essential characters and meaningful boundaries.
3. The experience names the default **Guided + Open-ended** contract and makes the two dimensions understandable without asking the user to configure a hidden prompt.
4. The user reaches a first scene with a clear situation and a legitimate next participation point.
5. Deeper world shaping is available only after first success, with explanation of what each layer changes.

**Success condition:** a guided newcomer can begin play without feeling that they have entered an unfinished creator tool.

### Slice B — Act, acknowledge, propose, commit and understand

1. In the World Workspace, the user describes or selects a meaningful action in their own words.
2. The system immediately acknowledges durable receipt. The experience says that receipt is **not yet a committed world change**.
3. While generation/validation proceeds, the user can understand the current state, wait, cancel if eligible or safely leave. A long wait becomes a recoverable state rather than ambiguous loss.
4. Generated narrative or a consequential advance is marked provisional until the authoritative transition resolves. If the system needs the user’s direct confirmation, it states the exact effect, affected scope and authority boundary.
5. Once committed, the workspace shows a compact change signal: what changed, why it changed, what part of the world it affects and what remains possible now.
6. The user may expand that signal into Change Trace and, where authorized, Continuity Lens.

**Success condition:** after an action, the participant does not mistake streaming prose, a suggested consequence or a model delay for a saved result.

### Slice C — Leave, return and resume

1. The user leaves normally or reconnects after interruption.
2. On return, Return Orientation reconstructs a readable present from committed sources: current situation, recent meaningful changes, active relationship/open-thread context and a safe next action.
3. The experience marks stale/rebuilding projections rather than implying that a stale summary is current authority.
4. The user continues from the offered participation point, opens a detail or starts a deliberate recovery path.

**Success condition:** the participant resumes the intended thread without manually restating canon or guessing whether the last action survived.

### Slice D — Inspect, correct, Branch and Restore

1. A participant notices an incorrect or unwelcome accessible continuity item through the workspace, change signal or orientation.
2. Continuity Lens explains only what the user is allowed to see: the fact/change, permitted provenance category/Commit, scope, freshness and correction path.
3. For a high-impact canonical correction, removal, supersession or scope change, the system previews the exact target/effect and requires the direct user confirmation bound to the current Branch head.
4. If the user wants to explore rather than replace current continuity, Recovery Lab makes a separate Branch first and labels the original as preserved.
5. Restore begins with a preview of effect and preservation statement, then creates a new committed restoration rather than silently erasing history.
6. A stale head, interruption or unavailable service produces a named recovery state; it does not create an untraceable partial result.

**Success condition:** the user can distinguish “fix this fact,” “try another path,” “return my experiment to a safe state” and “delete” before committing to one.

## 5. Participation Contract experience model

The two axes must be presented as a **paired decision with independent meanings**, never as a single personality, difficulty or “AI amount” toggle.

| Axis | User needs to understand | Active-state presentation capability | Change experience capability |
|---|---|---|---|
| **Initiative / authority**: Direct, Guided, World-active | What the world/AI may initiate; what still always requires user authority; how consequential proposals appear. | Plain-language active contract and a brief authority boundary in the World Workspace and Return Orientation. | Direct user-initiated contract transition, showing full before/after initiative plus retained avatar/resource/irreversible-commitment authority. |
| **World structure**: Open-ended, Goal-framed | Whether the world has declared goals, constraints, stakes, failure/consequence or completion behavior. | Plain-language structure state and, if Goal-framed is selected, visible optional arc context. | A distinct contract transition; never implied by changing initiative. Goal framing is optional MVP scope. |

An ordinary Action carries the current contract expectation only. Therefore, the interaction must never make an ordinary prompt, dropdown state, model suggestion or stale screen look like a completed mode change. The dedicated change path must disclose the expected current Branch head, the resulting two-axis contract and resolution status. A conflict asks the user to review current state and intentionally try again; it does not silently choose a winner. [System handoff](../../system-design/SYSTEM_DESIGN_HANDOFF.md)

## 6. Experience exclusions at V0

The following are intentionally absent from this architecture. Their omission protects the launch spine rather than leaving it incomplete.

- Public discovery, ratings, followers, social feed, marketplace and creator monetization.
- Team authoring, professional production dashboards and complex multi-world maintenance.
- A fixed visual map, app dock, relationship graph, timeline, 3D scene, audio layer or environmental rendering system.
- Mandatory goals, deterministic RPG instrumentation, exact world clock or economy simulation.
- A generic companion feed or emotional-dependency loop.
- A raw prompt/history viewer presented as continuity control.
- Any screen that claims a model, a cache, streaming text or a rendered widget is authoritative state.

## 7. Traceability summary

| Experience structure decision | Primary traceability | Boundary preserved |
|---|---|---|
| World Shelf → personal-world start → playable scene | PR-002, PR-011; JTBD-04 | Player-first; no catalogue/marketplace-first drift. |
| Return Orientation and compact current-world signal | PR-003, NFR-001/004/006; JTBD-01 | Projection freshness, no raw transcript requirement. |
| Explicit Action lifecycle and Change Trace | PR-005, PR-007, NFR-007; JTBD-03 | Acknowledged is not committed; model prose is not canonical truth. |
| Two-axis Participation Contract transition | PR-001, PR-006; JTBD-02 | Independent axes; user-only explicit change authority. |
| Continuity Lens and correction path | PR-004, PR-007, NFR-005; JTBD-03/05 | Scope-filtered Explanation Projection; no private/model-only leakage. |
| Recovery Lab with separate safe point, Branch and Restore | PR-008/009, NFR-001; JTBD-05 | Preserve original; no destructive rewind. |
| Progressive World Studio | PR-011; PR-012/017 as optional paths | No mandatory expert stack, team engine or public market. |

## 8. V0 completion conditions

This document is complete only if its companion documents make the above surfaces testable as text wireframes, enumerate their non-happy-path states, map potential component categories without selecting a design system, and record any remaining interaction choices as explicit open decisions.

`EXPERIENCE ARCHITECTURE: DEFINED`  
`CORE VERTICAL SLICE: DEFINED`  
`NOT FINAL UI`  
`NOT FINAL VISUAL DESIGN`  
`NOT IMPLEMENTATION`

## References

- [Frozen Product Definition Handoff](../../product/PRODUCT_DEFINITION_HANDOFF.md)
- [Product Positioning V1](../../product/PRODUCT_POSITIONING.md)
- [Target Users and JTBD V1](../../product/TARGET_USERS_AND_JTBD.md)
- [Product Requirements V1](../../product/PRODUCT_REQUIREMENTS.md)
- [MVP Scope Boundaries V1](../../product/MVP_SCOPE_BOUNDARIES.md)
- [System Design Handoff](../../system-design/SYSTEM_DESIGN_HANDOFF.md)
- [Integrated Research Index](../../research/integration/INTEGRATED_RESEARCH_INDEX.md)
