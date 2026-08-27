# Product Positioning

Status: `PRODUCT POSITIONING V1: FROZEN AFTER RE-AUDIT`

This document makes the first product-positioning choice from the frozen Product Principles and research corpus. It is not a brand decision, technical architecture or final go-to-market plan.

## Positioning decision

### Primary target user

**The continuity-seeking world participant**

An adult individual who returns to the same AI world over many sessions, cares about character and relationship continuity, wants their own avatar and decisions to matter, and may shape a world through light authoring without maintaining a complex prompt stack or simulation engine.

This user is player-first but not player-only: they may define a premise, adjust a character, add a boundary or set a goal, then return to play. Their primary job is to inhabit and continue a world, not to publish a large catalogue or operate a professional content pipeline.

### Secondary users

1. **Advanced solo world creator** — wants to author a personal world with layered facts, characters, relationships and constraints, test it, and share a bounded package with a small audience.
2. **Guided newcomer / low-technical player** — wants an immediately playable world with understandable choices and optional guidance rather than prompt-engineering work.

Secondary users must be served without displacing the primary participant experience.

Migration and recovery are important situations within the primary segment, not a separate acquisition audience. JTBD-05 carries that cross-cutting context.

### Explicit non-target users

- One-session novelty chat users whose main value is disposable generation rather than continuity.
- Professional studios or teams that need a full production pipeline, multi-user administration or enterprise-scale world operations at launch.
- Users seeking an AI relationship that substitutes for human relationships, removes meaningful disagreement or encourages unbounded emotional dependency.
- Hardcore deterministic-RPG players who require a complete fixed rules engine, exact simulation ticks and competitive balance from the first release.
- A public creator marketplace/social network whose primary loop is discovery, virality, follower growth or monetized user-generated content.
- Children, minors and family-governed use. Product Definition V1 uses an adult-only launch posture; exact jurisdictional age, verification and compliance mechanisms require later specialist review.

### Launch eligibility boundary

Product Definition V1 targets users who have reached the applicable age of majority in the launch jurisdiction. This is a scope decision, not a claim that one global age-verification mechanism is sufficient. Minor access, parental controls, youth privacy and family governance remain outside MVP until a later product and specialist review explicitly reopens them.

## Launch category / product frame

**Continuity-first AI World Simulation**

The product is a single-user, long-lived interactive world experience in which memory, world state, character relationships, user agency and consequences are first-class product behavior. It is not positioned as a generic chatbot, a pure companion app, a full game engine, a creator marketplace or a 3D spectacle product.

### Player-first / Creator-capable choice

The launch is **player-first with creator capability**.

- The first successful outcome is returning to a meaningful world and making an authoritative choice.
- Personal world setup and light authoring exist to improve play, not to turn every player into a systems designer.
- Advanced creator controls are progressively disclosed and may grow later without defining the default experience.
- No public marketplace, creator economy or broad discovery graph is required for MVP.

## Participation / world-mode launch direction

### Launch mode: Continuity-first Guided Open World

The default world is open enough for exploration and relationship-driven play, but guided enough that the AI can surface events, options and consequences without waiting for the user to write every action.

The launch contract uses two separate dimensions. They must not be collapsed into one mode selector or one hidden prompt.

#### Dimension A — Participation authority and AI initiative

- **Direct** — the user controls their own actions; the system may describe consequences and offer optional suggestions but does not advance the avatar without permission.
- **Guided** — the system may propose scenes, events, goals or next actions; the user confirms or rejects consequential advances.
- **World-active** — the system may advance declared background world and NPC activity without waiting for every beat, while user-owned actions, irreversible commitments, resource spending and high-impact memory changes remain under user control.

These initiative settings are one participation dimension, not three separate products. A user may change the setting for a session or world segment with clear effect disclosure.

#### Dimension B — World structure

- **Open-ended** — exploration, relationships, observation or co-writing may continue without a fixed completion condition, while causal state and consequences remain legible.
- **Goal-framed** — the world or an optional arc declares goals, constraints, stakes, failure consequences and completion conditions.

The launch default is **Guided + Open-ended**. Direct or World-active initiative can be combined with either world structure when the world declares compatible boundaries. Goal-framed structure remains an optional MVP `SHOULD`, not a requirement for every world.

### Sandbox vs game-loop choice

MVP defaults to open-world continuity, not a mandatory game loop. Goal, constraint, stakes and completion structures are optional world layers for users who want a more game-like experience. A world without a fixed goal remains valid when its purpose is exploration, companionship, observation or co-writing, but it must still make meaningful state and relationship change legible.

## Internal value proposition

> Return to a world that remembers what matters, lets you decide how much to lead, and makes your choices create understandable consequences—without requiring you to babysit prompts or surrender ownership of the world.

## Competitive / category distinction

The product competes on a **continuity-and-agency contract**, not on “the smartest model,” the largest character catalogue, or the most elaborate 3D presentation.

| Category | Our distinction |
|---|---|
| Generic AI chat | Persistent world state, relationships, recovery and consequences are explicit product promises. |
| Companion app | Characters may have bounded independent stances, but the user controls participation and the product does not promise relationship substitution. |
| AI game / RPG | Optional goals and constraints are supported, but open continuity is not sacrificed to a mandatory game loop. |
| Creator tool / engine | Personal creation is progressive and playable-first; the launch is not a professional engine or marketplace. |
| Immersive visual product | Audio, motion and maps express state but never become the entry barrier or source of meaning. |

WorldOS and other products may inform risk and mechanism comparison only. This positioning does not copy their UI, information architecture, page structure, copy, visual language or complete feature combination.

## Positioning guardrails

1. If a feature primarily serves catalogue growth, virality or professional creator operations, it is not automatically launch-relevant.
2. If a feature increases AI initiative, it must declare the active participation setting and preserve user override.
3. If a feature adds simulation complexity, it must improve causal continuity or meaningful consequence for the primary user.
4. If a feature requires a specific model, device or visual stack to be useful, it cannot be a core launch promise without a degraded path.
5. If the only rationale is “WorldOS has it,” the feature is rejected until a primary-user problem and original product reason are documented.

## Evidence basis

- Primary user problems: N01–N05, N08–N13, N20–N23, N28–N30, N35, N37, N43, N46, N48–N52.
- Creator-capable secondary need: N14–N17, N27–N28, N31, N33, N39 and N44.
- Guided newcomer boundary: N17, N21, N24, N30, N36, N38 and N49.
- Migration/recovery context within the primary segment: N22–N23, N28–N29, N34, N41, N43 and N46.
- Core conflicts: CR-03, CR-04, CR-05, CR-06, CR-07, CR-08, CR-10 and CR-12 in the [Conflict Register](../research/integration/CONFLICT_REGISTER.md).
- Product direction constraints: Principles 1–10 in [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md).

## Open positioning decisions

The following remain intentionally open for later Product Positioning refinement or PRD detail:

- exact launch regions, localization order and jurisdiction-specific adult-eligibility implementation;
- whether the first release emphasizes relationships, investigation, community or another content emphasis;
- the number of starter worlds and whether any are public or private by default;
- commercial packaging and model/provider presentation;
- final name, trademark, domain and visual identity.
