# Product Requirements V1

Status: `PRD V1: FROZEN AFTER RE-AUDIT / READY FOR SYSTEM DESIGN`

This document is the product-definition baseline derived from the frozen positioning, JTBD, MVP scope and Product Principles. It specifies product behavior and boundaries only. It does not specify database schema, API, technical stack, class structure, UI layout, component hierarchy or implementation.

## 1. Product objective

Deliver a player-first, continuity-first AI world simulation in which an individual can return to a meaningful personal world, choose how much the AI leads, trust the continuity of facts and relationships, experience causal consequences, and retain authority over their own actions and long-term investment.

The MVP validates this contract before expanding into a public creator marketplace, full game engine, multi-user social world or high-fidelity immersive platform.

## 2. Target users

### Primary

The continuity-seeking world participant: an adult, high-engagement individual who returns to one or a few AI worlds over time, values character/relationship continuity, wants their own choices to matter, and accepts light world shaping but not fragile prompt maintenance.

### Secondary

- Advanced solo world creator who needs layered authoring, testing and bounded sharing.
- Guided newcomer / low-technical player who needs a playable entry without prompt expertise.

Recovery and migration are cross-cutting situations within the primary segment, not a separate launch audience.

### Non-target at launch

One-session novelty chat, professional/team studios, unbounded companion substitution, deterministic hardcore RPG, public creator marketplace/social feed, and children/minors or family-governed use. V1 targets users who have reached the applicable age of majority in the launch jurisdiction; jurisdiction-specific verification remains later specialist work.

## 3. Core JTBD

- `JTBD-01`: Resume a meaningful world without rebuilding context.
- `JTBD-02`: Decide how much the world and AI should lead.
- `JTBD-03`: Keep facts, relationships and consequences coherent without babysitting prompts.
- `JTBD-04`: Shape a playable personal world without becoming a systems engineer.
- `JTBD-05`: Protect, recover and carry forward long-term investment.

See [TARGET_USERS_AND_JTBD.md](TARGET_USERS_AND_JTBD.md) for full evidence and success conditions.

## 4. Launch experience

The launch experience is **Continuity-first Guided Open World**:

1. A user starts or adapts a small personal world with a clear premise, initial situation and participation contract.
2. The user enters through an immediately playable scene, not a configuration maze.
3. The user sees two separate contracts: Direct / Guided / World-active for AI initiative, and Open-ended / Goal-framed for world structure. The launch default is Guided + Open-ended.
4. The AI may describe, suggest and, under World-active authority, advance bounded background world activity; the user retains authority over their avatar, resources and irreversible commitments.
5. Important facts, relationships and state changes remain inspectable and correctable.
6. Actions produce understandable consequences; optional goal/constraint packs add game-like structure without making every world a game.
7. The user can recover, branch, export and leave without losing the original investment.

## 5. Functional requirements

### Functional requirement coverage by requested product area

| Requested area | Requirements in this PRD |
|---|---|
| Participation / agency | PR-001, PR-006 |
| Continuity / memory / state | PR-003, PR-004, PR-007, PR-010, NFR-006 |
| Character behavior | PR-006 |
| World evolution / consequence | PR-005, PR-015 |
| Creator requirements | PR-002, PR-011, PR-012, PR-017 |
| Persistence / recovery / export | PR-008, PR-009, PR-016 |
| Governance / consent / safety | PR-006, PR-013, PR-014 |
| Model reliability | PR-010, NFR-004, NFR-006, NFR-007 |
| Immersion / accessibility boundaries | Conditional PR-018, NFR-002, NFR-003 |

### PR-001 — Participation contract and user authority

- **User problem:** Users need both momentum and control; one universal AI initiative level fails passive, guided and high-control users (N20, N29–N30, N35, N50).
- **Target user:** Primary participant; guided newcomer; high-control co-writer.
- **JTBD / MVP:** JTBD-02; MUST-02.
- **Evidence:** N20, N24, N29–N30, N35, N37, N50–N52; E77, E78, E79; CR-04, CR-05.
- **Product Principle:** Principle 2; Principle 4; Principle 10.
- **Priority:** `MUST`
- **Requirement statement:** The product shall expose two understandable contracts: Direct, Guided or World-active for participation authority/AI initiative, and Open-ended or Goal-framed for world structure. It shall describe what the AI may initiate under the first and what goals/constraints/completion behavior applies under the second. The user’s avatar, speech, resources and irreversible commitments shall remain user-authorized, with override for consequential proposals.
- **Boundary / non-goal:** This is not a promise of separate products, perfect autonomy or full manual control of every background event. Initiative level and world structure must not be collapsed into one ambiguous mode.
- **Acceptance condition:** A test user can identify both active contracts, change an allowed initiative setting, distinguish background-world authority from avatar authority, reject a consequential proposal and verify that the system did not author an unapproved avatar action.

### PR-002 — Playable personal world start

- **User problem:** New users and light creators are blocked when an authored world requires hidden prompts or expert configuration (N14–N17, N24, N30).
- **Target user:** Primary participant; guided newcomer; light creator.
- **JTBD / MVP:** JTBD-04; MUST-06.
- **Evidence:** N14–N17, N24, N30–N31; E13–E16, E39, E77; CR-03, CR-10.
- **Product Principle:** Principle 6; Principle 2.
- **Priority:** `MUST`
- **Requirement statement:** The product shall let a user start or adapt a small personal world from a playable premise, initial situation, characters and boundaries with safe defaults and no hidden author-only configuration.
- **Boundary / non-goal:** This does not require a public catalogue, a full creator engine, or a fixed template for every world.
- **Acceptance condition:** A non-expert can move from premise to a playable first scene and understand what they can do without writing system prompts or installing extensions.

### PR-003 — Return and current-state orientation

- **User problem:** Long-term users lose trust when returning requires rebuilding facts, relationships, time and open threads (N01–N03, N09, N21, N46).
- **Target user:** Primary participant.
- **JTBD / MVP:** JTBD-01; MUST-01.
- **Evidence:** N01–N03, N09, N21, N23, N43, N46; E01, E02, E07, E22, E67, E71, E76.
- **Product Principle:** Principle 1; Principle 5; Principle 9.
- **Priority:** `MUST`
- **Requirement statement:** On return, the product shall provide an understandable orientation to current world state, recent meaningful changes, relevant relationships/open threads and the next available participation point, without requiring manual reconstruction.
- **Boundary / non-goal:** Orientation is not a demand for a fixed dashboard layout, infinite recap or a raw transcript dump.
- **Acceptance condition:** After a multi-session scenario and normal interruption, a returning user can identify the current situation and continue the intended thread without restating the canon.

### PR-004 — Scoped, inspectable and correctable continuity

- **User problem:** Systems either forget important facts, pollute memory with casual language or force users to maintain external notes (N04–N07, N12, N15).
- **Target user:** Primary participant; advanced solo creator.
- **JTBD / MVP:** JTBD-03; MUST-03.
- **Evidence:** N04–N07, N09, N12, N15, N27, N42–N44; E03, E05–E06, E11–E12, E14–E16, E65, E67–E68.
- **Product Principle:** Principle 1; Principle 5; Principle 7; Principle 9.
- **Priority:** `MUST`
- **Requirement statement:** The product shall preserve important facts, relationship state and world state with explicit scope/context, allow the user to inspect why a fact is being used, correct or remove an incorrect persisted fact, and distinguish private, shared and world-level information.
- **Boundary / non-goal:** This is not an infinite-memory promise, automatic canonization of every utterance, or a requirement that users manually approve every low-risk conversational detail.
- **Acceptance condition:** In a representative scenario, a user can inspect a persisted fact, see its scope/context, correct it, and observe that later behavior respects the correction without exposing private information to the wrong character.

### PR-005 — Causal world evolution and transformed failure

- **User problem:** Generated events feel disposable when actions do not change relationships, resources, locations or future options (N08–N11, N20, N25, N51).
- **Target user:** Primary participant; advanced solo creator; game-oriented secondary user.
- **JTBD / MVP:** JTBD-03; MUST-04.
- **Evidence:** N08–N11, N20, N25, N51; E24–E26, E60, E78; T01–T37; CR-06.
- **Product Principle:** Principle 3; Principle 5.
- **Priority:** `MUST`
- **Requirement statement:** The product shall make important actions produce observable, causally explainable changes across relevant narrative, relationship or world-state dimensions. When the active mode permits recovery, failure shall create a new playable state rather than defaulting to a dead end.
- **Boundary / non-goal:** The product shall not inject mandatory objectives or expose every internal state variable; open exploration remains valid.
- **Acceptance condition:** A user action in a test world produces a visible state change linked to the action, and a failed attempt yields an understandable next state or recovery choice.

### PR-006 — Character identity, stance and user-authority boundary

- **User problem:** Characters drift, merge knowledge, repeat generic agreement or become controlling when they are given more initiative (N03, N07–N08, N20, N25, N35, N52).
- **Target user:** Primary participant; long-term relationship/RP context.
- **JTBD / MVP:** JTBD-02 and JTBD-03; MUST-05.
- **Evidence:** N03, N07–N08, N20, N25, N35, N50, N52; E03, E15, E24, E68, E79; CR-05, CR-08.
- **Product Principle:** Principle 4; Principle 10; Principle 1.
- **Priority:** `MUST`
- **Requirement statement:** Characters shall maintain differentiated identity, knowledge boundaries, motives and relationship context; they may disagree, refuse or pursue bounded goals, but shall not control the user avatar, conceal coercive behavior or make irreversible user commitments.
- **Boundary / non-goal:** Character independence is not hostility, manipulation, moralizing, emotional dependency or a license to create unsafe content.
- **Acceptance condition:** A test character can disagree for an intelligible reason, the user can reject the stance, and the user’s own action/identity/commitment remains unchanged unless explicitly authorized.

### PR-007 — Observable automation and change attribution

- **User problem:** Automatic memory, state and model changes are difficult to distinguish from bugs or loss (N05, N12, N21, N23, N28–N29, N46).
- **Target user:** Primary participant, including recovery/migration contexts.
- **JTBD / MVP:** JTBD-01, JTBD-03 and JTBD-05; MUST-03, MUST-07, MUST-09 and MUST-10.
- **Evidence:** N05, N09, N11–N12, N21, N23, N28–N29, N37, N42–N47; E45, E58, E62, E65, E67, E71–E72.
- **Product Principle:** Principle 5; Principle 7; Principle 10.
- **Priority:** `MUST`
- **Requirement statement:** Consequential automated changes shall disclose what changed, why/source/context, affected scope and available recovery or appeal. High-impact memory, state, permission, payment and deletion changes shall not be silently irreversible.
- **Boundary / non-goal:** Low-risk background assistance need not interrupt the user for every event; disclosure depth must match consequence.
- **Acceptance condition:** A test change can be traced to its source/context, its affected scope can be understood, and the user has a documented recovery, correction or appeal path.

### PR-008 — Separate recovery actions

- **User problem:** Users need to experiment without confusing save, branch, rewind, restore and deletion, or losing the original (N21, N28–N29, N34, N37, N46).
- **Target user:** Primary participant in experiment, recovery or migration contexts.
- **JTBD / MVP:** JTBD-05; MUST-07.
- **Evidence:** N21, N28–N29, N34, N37, N43, N46; E45, E58–E59, E67, E71; CR-06; MERGE-08, MERGE-09.
- **Product Principle:** Principle 1; Principle 5; Principle 7.
- **Priority:** `MUST`
- **Requirement statement:** The product shall distinguish continuing state, recovery points, branches, rewind/restore and deletion in user-facing behavior; each action shall state what it affects and preserve the original when the user is experimenting.
- **Boundary / non-goal:** This does not prescribe a data model, UI layout or implementation mechanism.
- **Acceptance condition:** A test user can create an experiment, return to a prior recovery point, compare the effect at a product-behavior level and verify that unrelated ownership or private data was not silently changed.

### PR-009 — Ownership, export and dignified exit

- **User problem:** Long-term world/character investment becomes a dead transcript or hostage to a platform, model or subscription (N22–N23, N34, N39, N41–N43).
- **Target user:** Primary participant in continuity/migration contexts; advanced creator.
- **JTBD / MVP:** JTBD-05; MUST-08.
- **Evidence:** N22–N23, N34, N39, N41–N43, N46; E43, E58–E59, E62, E64–E67, E71.
- **Product Principle:** Principle 7; Principle 10.
- **Priority:** `MUST`
- **Requirement statement:** The product shall let users understand, view, export, retain and delete their selected world/character assets and relevant history, with clear privacy, sharing, attribution and commercial boundaries. Export shall preserve a usable representation of selected user-owned investment rather than only an opaque transcript.
- **Boundary / non-goal:** Export does not guarantee perfect cross-system behavior, public access or automatic transfer of every sensitive conversation.
- **Acceptance condition:** A user can select a scope, understand what it contains and who may see it, export it, retain the original in-product, and confirm the consequence of deletion or cancellation.

### PR-010 — Model-variance absorption and change transparency

- **User problem:** Model updates, quality trade-offs and repeated retuning damage character identity, continuity and paid trust (N03, N13, N19–N20, N23, N48).
- **Target user:** Primary participant; long-term subscriber; advanced creator.
- **JTBD / MVP:** JTBD-01 and JTBD-05; MUST-09.
- **Evidence:** N03, N13, N19–N20, N23, N48; E01, E08, E22, E54–E55, E66–E67, E74, E79.
- **Product Principle:** Principle 1; Principle 9; Principle 5.
- **Priority:** `MUST`
- **Requirement statement:** The product shall communicate meaningful model/service capability changes, preserve user-owned state independently of generated prose, and provide a safe degraded or recovery behavior when a model is unavailable or changes quality.
- **Boundary / non-goal:** This does not select a provider, model, pricing tier or technical stack, and does not promise identical prose across all models.
- **Acceptance condition:** A simulated model change is disclosed, the world’s authoritative continuity remains available, and a temporary model failure does not corrupt user-owned state or permissions.

### PR-011 — Progressive creator authoring

- **User problem:** Creators either lack native layered controls or are forced to maintain a fragile expert prompt/mod stack (N14–N16, N27–N28, N31, N44).
- **Target user:** Primary light creator; advanced solo creator.
- **JTBD / MVP:** JTBD-04; MUST-06.
- **Evidence:** N14–N16, N27–N28, N31, N39, N44; E13–E16, E19–E21, E39, E62, E67–E68; T01–T37.
- **Product Principle:** Principle 6; Principle 7.
- **Priority:** `MUST`
- **Requirement statement:** The product shall provide a simple starter authoring path and progressively reveal controls for stable facts, contextual knowledge, dynamic state and boundaries needed by the core playable world. Goal-framing and sharing controls are included only when the corresponding `SHOULD` capabilities are selected. Authoring shall remain playable-first and shall not require hidden prompt knowledge.
- **Boundary / non-goal:** Creator Templates are patterns, not an approved schema; professional team workflows and full engine controls are later.
- **Acceptance condition:** A novice can complete a playable world setup; an advanced creator can reach deeper behavior controls without reauthoring the world in an external prompt stack.

### PR-012 — Creator preview and playability check

- **User problem:** A creator’s work can look correct in authoring but fail for players, models or contexts (N16–N17, N31, N33).
- **Target user:** Advanced solo creator; secondary newcomer/player receiving a world.
- **JTBD / MVP:** JTBD-04; SHOULD-02.
- **Evidence:** N16–N17, N31, N33; E13, E15–E16, E39, E77.
- **Product Principle:** Principle 6; Principle 9.
- **Priority:** `SHOULD`
- **Requirement statement:** When creator preview is included, the product should provide a representative playable preview and identify material dependencies, boundaries or behavior risks that could prevent a recipient from starting normally.
- **Boundary / non-goal:** This is not a full cross-model laboratory, automated quality score or marketplace ranking system. The minimum MVP creator path remains playable-first; a deeper preview/check surface may follow the first continuity loop.
- **Acceptance condition:** A creator can preview a representative start, see at least the important compatibility/behavior caveats, and produce a package that a recipient can begin without hidden setup.

### PR-013 — Consent, privacy, rights and appeal

- **User problem:** Users cannot tell who can see logs, how content boundaries work, what creators may reuse, or how to recover from an age/access decision (N18, N39, N42, N45, N47).
- **Target user:** All adult launch users, with specific protections for privacy-sensitive users and creators.
- **JTBD / MVP:** JTBD-02 and JTBD-05; MUST-10.
- **Evidence:** N18, N39, N42, N45, N47, N52; E53, E62, E65, E70, E72; CR-08; MERGE-10.
- **Product Principle:** Principle 10; Principle 7; Principle 4.
- **Priority:** `MUST`
- **Requirement statement:** The product shall make adult-launch eligibility, visibility, retention, consent, content boundaries, creator rights/attribution, accessible access status and appeal/recovery paths understandable at the moment they matter.
- **Boundary / non-goal:** V1 does not serve minors or family-governed use and does not define jurisdiction-specific verification, permit unrestricted content or replace specialist safety/privacy review. Minor access, family controls and the complete regional age-policy suite are deferred.
- **Acceptance condition:** Representative users can answer who may see or modify selected data, why a boundary applies, what consent is required, and how to appeal or recover without guessing from community rumor.

### PR-014 — Transparent usage and entitlement behavior

- **User problem:** Users experience subscriptions, credits, limits and upgrades as opaque or inconsistent with actual value (N19, N41).
- **Target user:** Primary participant; budget-sensitive user; subscriber.
- **JTBD / MVP:** JTBD-05; MUST-12.
- **Evidence:** N19, N41; E32, E38, E64, E66, E79.
- **Product Principle:** Principle 5; Principle 7; Principle 10.
- **Priority:** `MUST`
- **Requirement statement:** Before a limited or paid action, the product shall explain what is included, what is consumed, what happens on failure/retry and what remains after cancellation or downgrade.
- **Boundary / non-goal:** No final pricing, credit scheme or monetization model is selected here.
- **Acceptance condition:** A user can predict the consequence of a representative paid/limited action and verify that cancellation does not silently remove core user-owned assets.

### PR-015 — Optional goals, constraints and completion arcs

- **User problem:** Game-oriented users need meaningful goals and consequences, while open-world users reject mandatory game structure (N10, N11, N30, N50–N51).
- **Target user:** Game-oriented secondary player; creator who wants a structured world; not mandatory for the primary open-world mode.
- **JTBD / MVP:** JTBD-02 and JTBD-03; SHOULD-01.
- **Evidence:** N10–N11, N30, N50–N51; E60, E78; T01–T37; CR-04, CR-06.
- **Product Principle:** Principle 3; Principle 2.
- **Priority:** `SHOULD`
- **Requirement statement:** The product should support optional Goal-framed structures—goals, constraints, stakes, resources, failure consequences and completion conditions—that a world can declare and a user can understand, without making them mandatory for Open-ended worlds.
- **Boundary / non-goal:** This is not a full deterministic RPG engine or competitive balance system.
- **Acceptance condition:** A structured world can expose its objective, constraints, consequences and completion state; an open world can run without fabricated objectives.

### PR-016 — User-directed migration and rehydration

- **User problem:** Existing exports preserve dead text but not a usable relationship/world continuation (N22, N43–N44).
- **Target user:** Primary participant in a migration context; advanced creator.
- **JTBD / MVP:** JTBD-05; SHOULD-03.
- **Evidence:** N22, N43–N44; E67–E68; MERGE-09.
- **Product Principle:** Principle 1; Principle 7; Principle 9.
- **Priority:** `SHOULD`
- **Requirement statement:** The product should allow a user to select prior material, inspect proposed extracted facts/relationships/style/context, accept or reject the transformation, and retain the original archive alongside the new continuation.
- **Boundary / non-goal:** No claim of universal format compatibility, automatic ingestion of all sensitive content or perfect personality reconstruction. Only user-owned or otherwise authorized material is eligible; this requirement does not authorize importing protected third-party canon, characters or corpora, and all third-party IP references remain `REF-ONLY`.
- **Acceptance condition:** A migration test preserves the original, shows the user what will be carried forward, permits corrections before use and produces a continuation that can be inspected and stopped.

### PR-017 — Bounded sharing without marketplace dependency

- **User problem:** Creators want playable distribution, rights and attribution without losing control or needing a large social ecosystem (N17, N33, N39).
- **Target user:** Advanced solo creator; recipient player.
- **JTBD / MVP:** JTBD-04 and JTBD-05; SHOULD-04.
- **Evidence:** N17, N33, N39; E39, E62.
- **Product Principle:** Principle 6; Principle 7; Principle 10.
- **Priority:** `SHOULD`
- **Requirement statement:** The product should support explicit-scope sharing of a playable world package with visibility, attribution, usage and revocation information, without requiring public discovery, followers or marketplace economics.
- **Boundary / non-goal:** Public marketplace, ratings, recommendation feed and creator monetization are out of MVP.
- **Acceptance condition:** A creator can share with a selected audience, the recipient can start without hidden setup, and both parties can understand the package’s rights and visibility.

### PR-018 — Conditional sensory-layer integrity

- **User problem:** If sensory layers are introduced, they can contradict world state or damage performance, accessibility and presentation continuity (N21, N36, N38, N49).
- **Target user:** Primary participant; accessibility-sensitive and constrained-device users.
- **JTBD / MVP:** JTBD-01 and JTBD-03; governed by MUST-11, with no separate sensory feature in MVP.
- **Evidence:** N21, N36, N38, N49; immersion research; visual asset research; CR-09, CR-11.
- **Product Principle:** Principle 8; Principle 3.
- **Priority:** `CONDITIONAL — NOT AN MVP FEATURE`
- **Requirement statement:** If a later approved product decision introduces audio, motion, map or environmental feedback, that layer shall reflect the same authoritative world state as text and interaction and shall provide quiet, reduced-motion and readable fallback behavior.
- **Boundary / non-goal:** No 3D, spatial audio, WebGL/WebGPU or asset catalogue is required as a core launch dependency.
- **Acceptance condition:** No sensory feature is required to pass MVP. If one is selected later, enabling it must reinforce a representative state change and disabling it must preserve comprehension, control and continuity.

## 6. Non-functional product requirements

### NFR-001 — Session resilience

- **User problem:** A slow response, reload, device switch or transient failure is experienced as lost relationship/world investment (N21, N46).
- **Target user:** Primary participant; mobile and multi-device users.
- **JTBD / MVP:** JTBD-01 and JTBD-05; MUST-01, MUST-07 and MUST-09.
- **Evidence:** N21, N46; E27, E71, E76.
- **Product Principle:** Principle 1; Principle 7; Principle 9.
- **Priority:** `MUST`
- **Requirement statement:** Normal interruption and recoverable service errors shall preserve every acknowledged user commitment exactly once, retain the last known safe user-owned state and clearly distinguish loading, sync delay, conflict, temporary unavailability and confirmed deletion.
- **Boundary / non-goal:** No uptime SLA or infrastructure design is defined here.
- **Acceptance condition:** After an interruption at each tested commit stage, an acknowledged commitment is present exactly once or is explicitly marked unresolved; the user can resume or recover the last safe state without silent truncation or false deletion.

### NFR-002 — Accessibility and presentation continuity

- **User problem:** UI changes, poor contrast, unlabeled controls, reading modes and device differences make long-term content inaccessible (N36, N38, N49).
- **Target user:** All users, especially users with visual, motor, reading or device constraints.
- **JTBD / MVP:** JTBD-01 and JTBD-02; MUST-11.
- **Evidence:** N36, N38, N49; E47, E63, E76.
- **Product Principle:** Principle 8; Principle 5.
- **Priority:** `MUST`
- **Requirement statement:** Core world comprehension and control shall remain available through readable text, accessible input/output alternatives, reduced motion, quiet mode and stable presentation preferences.
- **Boundary / non-goal:** No single accessibility profile is assumed; user preferences must remain adaptable.
- **Acceptance condition:** The core loop passes on desktop and mobile web form factors using keyboard-only navigation, a supported screen reader path, reduced motion and no audio. Exact browser/version coverage is a later validation matrix, not a licence to omit these modes.

### NFR-003 — Graceful performance degradation

- **User problem:** High visual/audio ambition can make a mobile or constrained-device world unusable (N21, N38, N49).
- **Target user:** Primary participant on varied devices.
- **JTBD / MVP:** JTBD-01 and JTBD-02; MUST-11.
- **Evidence:** N21, N38, N49; immersion research; CR-09, CR-11.
- **Product Principle:** Principle 8.
- **Priority:** `MUST`
- **Requirement statement:** Optional sensory and dynamic layers shall degrade or disable without removing the user’s ability to understand state, act, recover or create.
- **Boundary / non-goal:** No target device matrix or technical optimization plan is specified in this PRD.
- **Acceptance condition:** A constrained-device scenario remains usable after optional sensory layers are reduced.

### NFR-004 — Explainable product change

- **User problem:** Model, policy, UI or entitlement changes are felt as silent relationship or investment loss (N13, N23, N41, N47, N49).
- **Target user:** All long-term users.
- **JTBD / MVP:** JTBD-01 and JTBD-05; MUST-09, MUST-10 and MUST-12.
- **Evidence:** N13, N23, N41, N47, N49; E54–E55, E66, E72, E76.
- **Product Principle:** Principle 5; Principle 7; Principle 9; Principle 10.
- **Priority:** `MUST`
- **Requirement statement:** Material product changes shall be communicated in terms of user-visible behavior, affected scope, effective timing and available choices/recovery, without requiring users to infer the change from degraded output.
- **Boundary / non-goal:** This does not require freezing the product or guaranteeing unchanged behavior forever.
- **Acceptance condition:** A test update produces an understandable change notice and preserves the user’s ability to continue, recover or exit with their investment.

### NFR-005 — Data visibility and privacy clarity

- **User problem:** Users cannot tell whether private interactions are visible to creators, operators, other people sharing a device/account or governance parties (N42, N45).
- **Target user:** All adult launch users, especially privacy-sensitive and shared-device users.
- **JTBD / MVP:** JTBD-05; MUST-08 and MUST-10.
- **Evidence:** N42, N45; E65, E70; CR-08.
- **Product Principle:** Principle 7; Principle 10.
- **Priority:** `MUST`
- **Requirement statement:** Product behavior shall clearly distinguish private, shared, creator-visible and operator/governance-visible information wherever those scopes exist, including retention and change notices. Minor/family visibility models are not part of V1.
- **Boundary / non-goal:** No claim of a particular legal retention period or regional policy is made here.
- **Acceptance condition:** Representative users can accurately answer visibility and retention questions for a private interaction, shared world asset and exported package.

### NFR-006 — Long-horizon continuity validation envelope

- **User problem:** Short demonstrations can hide identity drift, knowledge leakage, state loss and broken recovery that appear only after repeated use (N01, N03, N07, N09, N13, N21, N46).
- **Target user:** Primary continuity-seeking participant.
- **JTBD / MVP:** JTBD-01 and JTBD-03; MUST-01, MUST-03, MUST-04, MUST-05 and MUST-09.
- **Evidence:** N01, N03, N07, N09, N13, N21, N46; E01, E03, E07, E15, E54, E71, E76.
- **Product Principle:** Principle 1; Principle 4; Principle 5; Principle 9.
- **Priority:** `MUST`
- **Requirement statement:** The MVP shall be validated against at least one 30-day, 20-session continuity scenario containing five differentiated characters, three locations, twenty scoped facts, five relationship changes, three open threads, one deliberate correction, one branch and one interrupted session. These are minimum validation conditions, not product capacity limits, object-model requirements or a promise of infinite memory.
- **Boundary / non-goal:** The scenario does not prescribe storage, prompts, retrieval algorithms or maximum world size. Longer commercial retention and capacity limits must be disclosed later; they may not silently undercut this minimum validation promise.
- **Acceptance condition:** At the end of the scenario, seeded identity and knowledge scopes remain distinguishable, the deliberate correction governs later behavior, causal/open-thread orientation remains usable, the branch preserves its original, and no acknowledged user state is silently lost.

### NFR-007 — Responsive acknowledgement and recoverable wait

- **User problem:** Slow or failed generation is experienced as loss when users cannot tell whether an action committed, whether they should retry or whether a retry will duplicate cost/state (N21, N37, N46).
- **Target user:** Primary participant; mobile, constrained-network and budget-sensitive users.
- **JTBD / MVP:** JTBD-01, JTBD-02 and JTBD-05; MUST-01, MUST-02, MUST-07, MUST-09 and MUST-12.
- **Evidence:** N21, N37, N46; E27, E31, E51, E57, E71, E76.
- **Product Principle:** Principle 5; Principle 7; Principle 9.
- **Priority:** `MUST`
- **Requirement statement:** Under the supported-device and normal-network validation profile, a committed user action shall receive visible acknowledgement within one second at the 95th percentile. If meaningful generated output has not begun within ten seconds, the product shall expose a recoverable waiting/failure state with safe cancel or retry behavior. Retry shall not duplicate user commitments, state mutation, allowance consumption or charges.
- **Boundary / non-goal:** These are provisional V1 product targets for System Design, not an infrastructure design, provider SLA or guarantee under offline/unsupported conditions. Recalibration requires documented product validation rather than silent relaxation.
- **Acceptance condition:** A measured validation run meets the acknowledgement target, enters an explicit recoverable state for delayed generation, and proves idempotent cancel/retry behavior at the product level.

## 7. Explicit non-goals

- Reproducing WorldOS parity or its UI/IA/page/control composition.
- Building a general AI companion intended to replace human relationships.
- Building a professional simulation engine, public creator marketplace or social network in MVP.
- Making every world a deterministic RPG or every world a fully autonomous sandbox.
- Making 3D, spatial audio, maps, WebGL/WebGPU or a large asset catalogue a prerequisite for value.
- Promoting audio, motion, maps or environmental effects into MVP merely because the Immersion or Visual Asset libraries contain examples.
- Selecting a final brand, model provider, technical stack, database, API or UI architecture.
- Treating T01–T37, 48 worlds, 193 characters or 314 visual assets as launch scope by inventory alone.
- Converting third-party `REF-ONLY` IP, canon, characters, visuals or identifiable expression into product content, migration defaults or starter material.

## 8. Deferred requirements

- Public discovery, marketplace, ratings, followers and creator monetization.
- Professional/team authoring, bulk operations and large-scale dependency maintenance.
- Full deterministic RPG rules, competitive balance and exact simulation clocks.
- Multi-user shared worlds and social governance.
- Broad cross-model laboratory, universal import/export and fully automated rehydration.
- Rich procedural 3D, spatial audio and persistent map/terrain systems.
- Full regional family/age policy implementation and specialist compliance processes.

## 9. Acceptance criteria for the product definition

The PRD is considered internally coherent when the following can be demonstrated in a future product validation—not by architecture assumptions:

1. A primary user can start and later resume a personal world without rebuilding context.
2. The active initiative contract and world-structure contract are separately understandable; allowed changes preserve avatar and irreversible-commitment authority.
3. A fact, relationship or state correction is inspectable and affects later behavior appropriately.
4. A meaningful action produces an understandable consequence, and failure can form a new state.
5. Characters can have bounded disagreement without controlling the user.
6. Save/recovery/branch/restore/export/exit behavior is distinguishable and recoverable.
7. A non-expert can create a playable world. If creator preview/testing is included, an advanced creator can test meaningful behavior before sharing.
8. Material model, policy, entitlement and state changes are disclosed and do not silently corrupt user investment.
9. Privacy, consent, rights and appeal boundaries are understandable.
10. Reduced-motion, quiet and degraded modes preserve comprehension and control.
11. The 30-day/20-session continuity scenario passes without silent acknowledged-state loss, scope leakage or branch corruption.
12. Action acknowledgement and delayed-generation recovery meet NFR-007 without duplicate commitment, allowance consumption or charge.

## 10. Evidence mapping

| Requirement group | Primary evidence | Supporting reference | Principles |
|---|---|---|---|
| Participation and authority | N20, N24, N29–N30, N35, N50–N52; E77–E79 | Conflict Register CR-04/05 | 2, 4, 10 |
| Continuity, memory and state | N01–N12, N13, N21–N23, N28–N29, N43, N46, N48 | Cross-Agent Merge MERGE-01/02/03/08/09 | 1, 5, 7, 9 |
| Character behavior | N03, N07–N08, N20, N25, N35, N52 | Original character/reference library as scenario material | 4, 10 |
| Creator | N14–N17, N27–N28, N31, N33, N39, N44 | T01–T37 mechanism reference | 6, 7, 10 |
| Recovery, ownership and migration | N22–N23, N28–N29, N34, N37, N41–N47 | Cross-Agent Merge MERGE-08/09/10 | 5, 7, 10 |
| Immersion, accessibility and reliability | N21, N36, N38, N49 | Immersion and asset libraries define conditional feasibility/boundaries only; they do not authorize an MVP feature | 8, 9 |
| Model and commercial trust | N13, N19–N20, N23, N41, N48 | No model/provider selected; WorldOS only bounded comparison | 5, 7, 9 |

## 11. Principle mapping

| Principle | Requirements constrained |
|---|---|
| 1 Continuity contract | PR-003, PR-004, PR-007–PR-010, PR-016, NFR-001, NFR-004, NFR-006 |
| 2 Participation contract | PR-001, PR-005, PR-006, PR-015 |
| 3 Causal consequences | PR-005, PR-015, PR-018 |
| 4 Character stance without authority theft | PR-001, PR-006, PR-013, NFR-006 |
| 5 Observable/recoverable automation | PR-003–PR-010, PR-014, NFR-001, NFR-004, NFR-006–NFR-007 |
| 6 Progressive creator power | PR-002, PR-011–PR-012, PR-017 |
| 7 Ownership, portability and exit | PR-004, PR-007–PR-009, PR-016–PR-017, NFR-001, NFR-005, NFR-007 |
| 8 Immersion as state expression | Conditional PR-018, NFR-002–NFR-003 |
| 9 Model-variance absorption | PR-003–PR-005, PR-010, PR-012, PR-016, NFR-001, NFR-004, NFR-006–NFR-007 |
| 10 Governance, consent and reciprocity | PR-001, PR-006–PR-009, PR-013–PR-014, PR-017, NFR-004–NFR-005, NFR-007 |
