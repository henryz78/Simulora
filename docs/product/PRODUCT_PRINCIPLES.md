# Original Product Principles

Status: `PRODUCT PRINCIPLES V1: FROZEN AFTER RE-AUDIT`

Date: `2026-08-26` (`Asia/Shanghai`)

Re-audit revision: `2026-08-27` (`Asia/Shanghai`)

Scope: original product principles only. Current downstream Product Definition status is recorded in [PRODUCT_DEFINITION_HANDOFF.md](PRODUCT_DEFINITION_HANDOFF.md); Architecture, ADR, UI, Prototype, technology selection, implementation and final brand remain unstarted.

## Purpose

These principles convert the frozen research corpus into binding decision rules for the next product-definition stages. They are not a feature list, parity checklist, schema, technical design or launch plan.

The product should be judged by one central promise:

> A world that can remain coherent and alive over time while the user retains meaningful authority over participation, memory, change and exit.

This promise prioritizes a recoverable, causally legible and user-governed experience over infinite generation, maximal autonomy or visual spectacle.

## Evidence boundary

- User evidence is the primary basis for product problems: [User Research Final Handoff](../research/external/user-research/FINAL_HANDOFF.md), [Needs database](../research/external/user-research/01_CURRENT_DATA/needs_database.csv), [Source index](../research/external/user-research/01_CURRENT_DATA/source_index.csv) and [Research log](../research/external/user-research/01_CURRENT_DATA/research_log.md).
- The [Cross-Agent Evidence Merge](../research/integration/CROSS_AGENT_EVIDENCE_MERGE.md) identifies support, complements, conflicts and conditional findings.
- The [Conflict Register](../research/integration/CONFLICT_REGISTER.md) identifies trade-offs that these principles resolve directionally and decisions that remain open.
- WorldOS is an evidence and mechanism reference only. It is not a requirements source and its 70/70 parity is not a roadmap.
- Creator templates, original worlds/characters, assets, immersion research and brand exploration remain reference layers with their frozen boundaries.

## Core principles

### Principle 1 — Continuity is a contract, not an infinite transcript

**Statement**

The product must preserve the parts of a world, relationship and story that users rely on, while making the boundaries of that continuity understandable and controllable. “Remember everything” is not the goal; reliable, useful and recoverable continuity is.

**User Evidence**

N01–N09, N12–N13, N21–N23, N28–N29, N34, N43 and N46 document long- and short-range continuity, personality stability, event/time tracking, model changes, recovery, migration and cross-device restoration. N04–N06 specifically distinguish accurate, scoped memory from raw storage.

**Trade-off**

This chooses dependable continuity over unlimited generation and over a single undifferentiated memory store. It accepts that freedom may require branches or explicit edits, and that privacy may require some information not to persist.

**Product Implication**

Future product decisions should distinguish at least the user-visible purposes of memory, world state, relationship change, conversation history and recoverable versions. Continuity promises must state what is preserved, for whom, for how long and under what authority. A model change or system update must not silently rewrite long-term user investments.

**Non-Goal / Boundary**

Do not promise infinite recall. Do not save every utterance as canon. Do not freeze a world so rigidly that users cannot experiment, branch or correct it. Do not treat a competitor’s save, Memory or version behavior as the desired answer.

**Open Decision**

Product Definition V1 establishes a minimum 30-day/20-session validation envelope and separates branch/recovery promises. Longer commercial retention, capacity limits and the portable package format remain later explicit decisions; they may not silently weaken the validated minimum.

**PRD Test**

Can a requirement explain which continuity promise it protects, what may change, how the user knows, and how recovery works?

### Principle 2 — Participation is an explicit contract, and agency is mode-bounded

**Statement**

AI initiative must be selected and understood as part of a participation contract. The system may propose, prompt, stage or advance world events, but it must not silently take over the user’s role or pretend that one level of proactivity suits every user.

**User Evidence**

N20, N24, N29–N30, N35, N37 and N49–N51 describe the tension between reactive chat, guided participation, co-writing, sandbox play and goal-driven play. N50 directly asks for switchable participation contracts; E77 records the conflict between passive users who need momentum and high-control users who reject substituted actions.

**Trade-off**

This chooses explicit mode boundaries over universal AI autonomy and over universal user micromanagement. It allows initiative where it creates value, but makes consent, timing and override more important than surprise for its own sake.

**Product Implication**

Future requirements must keep two decisions separate: the participation-authority/initiative contract and the world’s structural contract. The first defines what the AI can initiate and when it must wait; the second defines whether play is open-ended or goal-framed. The user’s avatar, authored actions, resource spending and irreversible commitments remain under user authority unless explicitly delegated within a revocable boundary.

**Non-Goal / Boundary**

Do not make “AI-first” mean AI acts first everywhere. Do not use a passive mode to remove player agency. Do not force a game loop on a companion or open-world session, and do not force the user to manually author every beat in a guided mode.

**Open Decision**

Product Positioning selects Direct, Guided and World-active as initiative contracts, Open-ended and Goal-framed as world structures, and Guided + Open-ended as the launch default. PRD must preserve the two-axis separation and define transition and delegation limits without designing the interface here.

**PRD Test**

For every proactive behavior, can the requirement identify the active participation contract, the user’s override, and the difference between a suggestion and an irreversible world change?

### Principle 3 — Open-ended worlds still need causal state and meaningful consequences

**Statement**

A world earns the right to be called alive by making actions matter across time, relationships, resources, places and institutions. Openness expands possible paths; it does not remove goals, constraints, consequences or the possibility of completion where the chosen mode needs them.

**User Evidence**

N08–N12, N20, N25 and N51 describe dynamic relationships, event/time/location continuity, hard constraints, causal evolution and game-loop closure. E78 is an explicit counterexample to infinite generation without goals. Creator templates T01–T37 complement this with goals, constraints, motives, resource flow, consequence and failure that changes world state.

**Trade-off**

This chooses causal legibility over random novelty and meaningful stakes over endless content volume. It permits worlds without a fixed objective when the mode calls for open exploration or companionship, while requiring optional structure for users who need challenge and completion.

**Product Implication**

Future product requirements should make important state changes traceable to actions, conditions and prior events. They should support optional goals, constraints, stakes, resource rules and completion arcs rather than assuming one universal game loop. Failure should be able to create a new playable state, not merely end a session.

**Non-Goal / Boundary**

Do not equate infinite generation with depth. Do not inject arbitrary quests into every world. Do not use hidden randomness to manufacture consequence, or declare a failure final when the chosen mode calls for recovery or transformation.

**Open Decision**

Later positioning must decide how prominently goal-driven play appears at launch. PRD must decide which consequence classes are visible, optional or mandatory by mode.

**PRD Test**

Can a requirement state what changed, why it changed, who can observe it, and what meaningful next state it creates?

### Principle 4 — Characters may have a stance, but never authority over the user

**Statement**

Characters should be able to disagree, refuse, ask questions, pursue motives and change through experience when that behavior is grounded in their identity and the active world. Character independence must increase social credibility without controlling, coercing or impersonating the user.

**User Evidence**

N03, N07–N08, N20, N25, N35, N50 and N52 support stable identity, differentiated knowledge, causal development, non-repetitive initiative and non-manipulative independent stance. N18 supplies the safety and non-consensual-content boundary. E79 records dissatisfaction with characters that always agree or lack a backbone.

**Trade-off**

This rejects both extremes: characters that are empty puppets and characters that become an unaccountable authority. It prioritizes believable, bounded disagreement over constant affirmation, while prioritizing user safety and avatar authority over dramatic surprise.

**Product Implication**

Future requirements should define how a character’s stance is grounded in authored identity, relationship history, current facts and consent boundaries. A character may refuse its own actions or propose a different path; it must not silently decide the user’s speech, body, relationships, purchases, identity or irreversible commitments. The user must be able to pause, reject, correct or leave without being punished by hidden state.

**Non-Goal / Boundary**

Do not optimize every character for compliance. Do not turn “backbone” into hostility, manipulation, moralizing or emotional dependency. Do not let character autonomy become a justification for unsafe content, user-avatar takeover or opaque retention.

**Open Decision**

PRD must later specify stance categories, consent boundaries, refusal behavior, safety escalation and how users inspect or change a character’s declared autonomy. This is a product/safety decision, not a reason to expand the character library.

**PRD Test**

Can the requirement show why the character disagrees, what the user can refuse, and how the system prevents character stance from becoming control of the user?

### Principle 5 — Automation must be observable, attributable and recoverable

**Statement**

The system may automate memory formation, state updates, world evolution and quality assistance, but consequential automation must leave an understandable trail and a viable recovery path. Convenience cannot depend on invisible irreversible mutation.

**User Evidence**

N04–N05, N09, N11–N12, N21, N23, N28–N29, N37, N42–N47 and N49 describe the need to inspect, correct, understand, recover and trust automated changes. N46 specifically asks for verifiable sync and restoration rather than silent failure.

**Trade-off**

This chooses transparent automation over both manual maintenance and black-box convenience. It accepts that some background work is necessary, but requires higher visibility and reversibility as the impact of a change increases.

**Product Implication**

Future PRD requirements should classify changes by consequence and define appropriate disclosure: what changed, why, source/context, scope, affected entities, cost or permission impact, and how to undo, branch, restore or appeal. The product should prefer suggestions or staged commits for high-impact changes, and should never silently delete or overwrite user-owned continuity.

**Non-Goal / Boundary**

Do not make users manually babysit every low-risk update. Do not hide behind “the model decided.” Do not treat a rendered UI state as the authority when the underlying state differs. Do not make important fact deletion, state replacement, billing, permissions or export changes irreversible by default.

**Open Decision**

Later PRD work must set the change-impact levels, audit visibility, undo windows and branch/recovery rules. Exact implementation is intentionally outside this document.

**PRD Test**

Can a user understand a consequential automatic change and recover from it without reconstructing the world by hand?

### Principle 6 — Creator power is layered, progressive and testable

**Statement**

The product must let a beginner make something playable quickly while giving advanced creators precise control over characters, world knowledge, dynamic state, constraints, testing and publishing. Complexity should be revealed when it creates value, not imposed as an entry fee.

**User Evidence**

N14–N17, N27–N28, N31, N33, N39 and N44 describe integrated workflows, layered authoring, testing, portability, packaging and rights. N17 requires public creations to be playable without hidden author configuration. Creator templates T01–T37 provide mechanism and scenario patterns but do not authorize a schema.

**Trade-off**

This chooses progressive disclosure over both a toy-only creator and an expert-only control room. It accepts a richer underlying capability while making the first successful creation, preview and recovery path simple.

**Product Implication**

Future requirements should define a starter path with safe defaults, then expose advanced layers for stable facts, conditional knowledge, dynamic state, goals, tests, compatibility, rights and packaging. Creator tooling should show whether a world is playable, what it depends on and how behavior may vary, without requiring users to learn hidden prompt craft or a full object model first.

**Non-Goal / Boundary**

Do not expose every advanced control at first contact. Do not hide required complexity until after publishing. Do not treat the T01–T37 object model, a competitor creator UI or example JSON as approved architecture. Do not make creators maintain the runtime manually.

**Open Decision**

Product Definition V1 chooses player-first with creator capability: playable starter authoring is `MUST`, while advanced preview/testing and bounded sharing are `SHOULD`. Publishing economics and professional/team tooling remain outside MVP.

**PRD Test**

Can a new creator reach a playable result without expert configuration, while an advanced creator can diagnose and control the mechanisms that matter?

### Principle 7 — Persistence includes ownership, portability and a dignified exit

**Statement**

Long-term investment belongs to the user as an understandable, recoverable asset, not as an unportable hostage to a platform, model or pricing tier. Save, branch, rewind, memory, export, deletion and migration are different promises and must be explained separately.

**User Evidence**

N22–N23, N28–N29, N34, N39, N41–N47 document portability, creator rights, paid-value transparency, shutdown resilience, privacy, migration, sync, age-verification recovery and exit rights. N43 specifically rejects a dead transcript as sufficient migration.

**Trade-off**

This chooses user ownership and recovery over lock-in, opaque monetization and convenience that makes future exit impossible. It also accepts that private conversations, reusable world assets, shared works and derived content require different visibility and rights treatment.

**Product Implication**

Future requirements should provide understandable viewing, export, restore and deletion controls for user-owned assets, with provenance and permission boundaries. A migration path should preserve enough structure to continue interaction while retaining the original archive and user choice about what is transformed. Product changes, account closure, service interruption and payment cancellation must explain what remains available and how to recover it.

**Non-Goal / Boundary**

Do not make export a dead dump that cannot be inspected or reused. Do not paywall access to core user-owned continuity. Do not conflate public sharing with ownership. Do not silently erase history, downgrade an asset or make recovery dependent on one model or one interface.

**Open Decision**

PRD must later define the minimum portable asset, privacy-preserving migration behavior, retention/deletion policy, and commercial entitlement boundaries. Legal policy and exact formats are not decided here.

**PRD Test**

Can a user understand what they own, what others can see, what export preserves, and how to recover after a failure, change or exit?

### Principle 8 — Immersion expresses world state; reliability is the entry point

**Statement**

Audio, motion, weather, maps and visual atmosphere should make causal world state easier to perceive, not become a performance, accessibility or device barrier. The core experience must remain meaningful without spectacle.

**User Evidence**

N21, N36, N38 and N49 support reliable sessions, multilingual/readable presentation, accessibility and interaction continuity. The Immersion package complements this with cross-modal state, event feedback, quiet mode, reduced motion and graceful degradation. The visual asset pool is a production resource, not demand evidence.

**Trade-off**

This chooses state coherence and broad accessibility over maximum visual complexity. It treats immersion as a high-value expression layer that can deepen the world, but never as a prerequisite for understanding, saving, playing or creating.

**Product Implication**

Future requirements should define a sensory baseline, quiet/reduced-motion behavior, readable fallbacks and a degraded path for weak devices or unsupported media. Any dynamic effect should read from the same authoritative world state as text and controls, and should remain optional when it adds cognitive or accessibility cost.

**Non-Goal / Boundary**

Do not make 3D, spatial audio, autoplay, WebGL/WebGPU or high-end assets a product gate. Do not copy the Immersion research viewer or its visual direction. Do not allow ambient motion to hide state, consume the interaction budget or substitute for meaningful consequences.

**Open Decision**

No sensory feature is required for MVP. If a later product decision selects one, Product Definition requires quiet/reduced-motion/readable fallbacks and graceful degradation before engineering chooses a technology or device budget.

**PRD Test**

Can a user understand and operate the world with sensory effects reduced or unavailable, while enabled effects still reinforce rather than contradict state?

### Principle 9 — The product absorbs model variance instead of outsourcing reliability to one model

**Statement**

The product must make continuity, agency and consequence dependable across model changes and model trade-offs. Models are replaceable capabilities with different strengths, not the product’s sole source of truth or the explanation for every failure.

**User Evidence**

N03, N13, N19–N20, N23 and N48 document personality drift, model/version instability, visible paid value, repetition, quality trade-offs and the need to understand what a model can and cannot do. N12 and N15 show that orchestration and structure matter alongside raw context or model size.

**Trade-off**

This chooses product-level reliability and transparent capability trade-offs over a “strongest model solves everything” promise. It permits creativity and model choice, but does not sacrifice user-owned state, safety or explainability to chase novelty.

**Product Implication**

Future requirements should separate authoritative world facts and user controls from generated prose, expose meaningful capability/quality trade-offs, communicate model or prompt changes, and provide safe fallback or recovery behavior. Evaluation should test long-term tasks, not just isolated impressive replies.

**Non-Goal / Boundary**

Do not choose a model solely by benchmark prestige. Do not hide a model switch behind unchanged marketing. Do not require users to repeatedly retune prompts, presets or extensions to recover basic continuity. Do not let model output silently override rules, permissions or user-owned facts.

**Open Decision**

Product Definition V1 makes continuity integrity, user authority, recoverability and causal legibility the primary launch qualities, with a long-horizon validation envelope. Prose style, model/provider presentation and commercial quality profiles remain later decisions; no provider, model or technical stack is selected here.

**PRD Test**

Can the product preserve its core contract when a model is slower, more creative, less obedient, upgraded or temporarily unavailable?

### Principle 10 — Governance, consent and reciprocity are core product behavior

**Statement**

Safety, privacy, launch eligibility, creator rights, attribution, appeal and non-manipulative social behavior are part of the world contract from the beginning. They are not a moderation layer added after the experience is designed.

**User Evidence**

N18, N39, N42, N45, N47 and N52 cover content boundaries, creator authorization, privacy/log visibility, family governance, age-verification recovery and independent character stance. N35 and N50 reinforce that consent and user authority must survive mode changes. E79 supplies the non-manipulative reciprocity boundary.

**Trade-off**

This chooses explicit, explainable boundaries over both one-size-fits-all restriction and unrestricted expression. It treats user autonomy, vulnerable-user protection and creator rights as coexisting design constraints rather than opposing afterthoughts.

**Product Implication**

Future requirements should make permissions, visibility, consent, eligibility, rights, appeals, content boundaries and character behavior legible at the moment they matter. Product Definition V1 adopts an adult-only launch posture; minor access and family governance remain outside MVP until explicitly reopened with specialist review. Changes in governance, access or commercial use need notice and a recovery/appeal path. The product must distinguish a character’s independent stance from emotional manipulation or coercive system behavior.

**Non-Goal / Boundary**

Do not rely on hidden policy, community rumor or a single age switch to define trust. Do not treat safety as a reason to erase all creative agency, or treat creative freedom as permission to remove consent and recourse. Do not copy a competitor’s permission model as our governance standard.

**Open Decision**

PRD defines the adult-only launch boundary and baseline visibility/consent/appeal behavior. Jurisdiction-specific age thresholds, verification, minor access, family controls, appeal service levels, creator licences and audit responsibilities require later specialist review; they do not authorize broad research or minor/family scope in MVP.

**PRD Test**

Can an eligible user, creator or governance reviewer understand who may see or change what, why a boundary applies, how to appeal, and how consent is preserved?

## Differentiation / Clean-Room Principles

These are binding originality rules in addition to the ten experience principles.

### Clean-room rule A — User problem before reference feature

Every future capability must record the user evidence and original product reason that justify it. “WorldOS has it,” “a template contains it,” “an asset is available,” or “a demo looks impressive” is not sufficient justification.

### Clean-room rule B — Mechanism reference is not expression reference

WorldOS and other products may inform abstract mechanism, risk and comparison. We do not copy their UI, information architecture, page hierarchy, control arrangement, onboarding, wording, iconography, brand, visual language, interaction choreography or complete feature bundle.

### Clean-room rule C — Parity is not a roadmap

The frozen 70/70 WorldOS parity corpus remains a research record. No parity row, defect, route or observed projection enters a product backlog unless independently justified by user evidence and an original decision.

### Clean-room rule D — Reference layers remain typed

User research is user evidence. Creator templates are mechanism reference. The visual pool is a production resource. Immersion code and webapps are research tooling/reference implementations. World/Character material is original content/reference. Third-party IP remains `REF-ONLY`. Brand candidates remain exploration. These layers cannot silently become requirements.

### Clean-room rule E — Originality includes capability and language

The product must develop an original positioning, interaction language, information architecture, visual system and technical implementation. A different logo or color palette is not enough if the underlying product expression is still an identifiable copy.

## How these principles constrain future PRD work

Every future requirement should include:

1. **User problem:** the specific Need(s), user segment and evidence reference.
2. **Principle check:** which principle(s) it obeys or intentionally trades off.
3. **Mode and authority:** who may act, when AI may act, and what can be overridden.
4. **Continuity and recovery:** what is preserved, visible, editable, branchable, exportable or recoverable.
5. **Consequence:** what state or relationship changes, why, and how the user understands it.
6. **Boundary:** what the product explicitly does not promise or copy.
7. **Acceptance test:** an observable test of the chosen trade-off.

A requirement that cannot pass this checklist is not ready for PRD acceptance.

## Deferred decisions carried into Product Positioning / PRD

The principles intentionally do not choose:

- the initial primary audience and exact launch mode set;
- detailed per-world transition timing and delegation limits within the selected two-axis participation contract;
- the exact game-loop prominence by world type;
- Memory retention horizons, budgets and detailed data semantics;
- the detailed safety taxonomy and regional governance policy;
- creator tier boundaries and publishing economics;
- the portable asset format and migration transformation rules;
- model/provider selection, pricing and quality-profile UI;
- sensory minimums and device-performance budgets;
- the final brand, name, domain or visual identity.

These are open decisions, not invitations to restart frozen research. They should be resolved by original product judgment, constrained experiments or specialist due diligence only when a concrete product choice requires them.

## Phase boundary

`PRODUCT POSITIONING V1: FROZEN AFTER RE-AUDIT`

`TARGET USERS / JTBD V1: FROZEN AFTER RE-AUDIT`

`MVP SCOPE V1: FROZEN AFTER RE-AUDIT`

`PRD V1: FROZEN AFTER RE-AUDIT`

`ARCHITECTURE: NOT STARTED`

`PRODUCT IMPLEMENTATION: NOT STARTED`

This document is complete as a principles layer and must not be treated as permission to begin those phases automatically.

## Completion state

`PRODUCT PRINCIPLES V1: FROZEN AFTER RE-AUDIT`

`MAJOR TRADE-OFFS RESOLVED: PARTIAL` — directionally resolved; launch segment, exact mode taxonomy, detailed policy and commercial choices remain open.

These principles remain the decision layer for Product Definition. Current freeze and readiness status must be taken from [PRODUCT_DEFINITION_HANDOFF.md](PRODUCT_DEFINITION_HANDOFF.md), not inferred from this historical phase boundary.
