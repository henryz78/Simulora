# MVP Scope Boundaries

Status: `MVP SCOPE V1: FROZEN AFTER RE-AUDIT`

MVP scope is derived from the primary user, JTBD-01–05, frozen user evidence and Product Principles. It is not a translation of WorldOS parity, Creator Templates, the Visual Asset Pool or the Immersion Library into features.

## Traceability rule

Every `MUST SUPPORT` item follows:

`Primary User → JTBD → Need / Evidence → Product Principle`

If a candidate capability cannot complete this chain, it is not an MVP must-have.

## MUST SUPPORT

| MVP ID | Capability boundary | Traceability | Acceptance boundary |
|---|---|---|---|
| `MUST-01` | A returning user can resume a personal world with a readable current-state orientation: recent meaningful events, active relationships/open threads and the next available participation point. | Primary participant → JTBD-01 → N01–N03, N09, N21, N46 / E01, E02, E07, E71 → Principles 1, 5, 9 | No manual re-import or prompt reconstruction is required for a normal return; temporary load/sync trouble is distinguishable from deletion. |
| `MUST-02` | The product exposes two separate contracts: Direct / Guided / World-active for participation authority and AI initiative, and Open-ended / Goal-framed for world structure. The launch default is Guided + Open-ended. | Primary participant → JTBD-02 → N20, N29, N30, N35, N50, N52 / E77, E79 → Principles 2, 4, 10 | The user can identify each active dimension, change an allowed initiative setting and reject a consequential proposal; the system never silently authors the user avatar. |
| `MUST-03` | Important facts, relationships and world state are maintained as usable continuity, with context/scope and user-facing correction controls. | Primary participant → JTBD-03 → N03–N08, N12, N15 / E03, E05–E06, E11, E14–E16 → Principles 1, 4, 5, 9 | A user can inspect and correct a representative wrong fact or relationship without maintaining an external prompt stack. |
| `MUST-04` | Meaningful actions produce understandable consequences in every relevant affected dimension—such as narrative, relationship or world state—and failure can create a new state. | Primary participant → JTBD-03 → N08–N11, N20, N25 / E24–E26, E60, E78 → Principles 3, 5 | A representative action shows which relevant dimension changed and why; failure does not default to a dead end when a transformed state is possible. |
| `MUST-05` | Characters retain differentiated identity, knowledge boundaries and bounded independent stance while never controlling the user’s avatar or irreversible commitments. | Primary participant → JTBD-02/03 → N03, N07, N20, N25, N35, N52 / E03, E15, E68, E79 → Principles 2, 4, 10 | A character may disagree/refuse for an intelligible reason; the user can reject it and retain authority over their own action. |
| `MUST-06` | A user can create or adapt a small personal world through a playable-first, progressive setup with safe defaults and optional deeper controls. | Primary participant → JTBD-04 → N14–N17, N31 / E13–E16, E39 → Principle 6 | A non-expert can reach a playable result without hidden prompt configuration; advanced controls are optional, not required for first success. |
| `MUST-07` | World/session changes have inspectable recovery behavior: create a safe restore point, branch an experiment and return to a prior state without conflating these actions. | Primary participant → JTBD-05 → N21, N28–N29, N37, N46 / E45, E58, E71 → Principles 1, 5, 7 | A user can experiment, see what the recovery action affects, and return without silently losing the original continuity. |
| `MUST-08` | User-owned world/character assets and relevant history can be viewed, exported in a usable form and deleted/retained with clear scope and privacy meaning. | Primary participant → JTBD-05 → N22–N23, N34, N39, N42–N43 / E43, E58–E59, E62, E65, E67 → Principles 7, 10 | The user can distinguish private conversation from reusable world assets, export the selected scope, and understand what deletion/retention does. |
| `MUST-09` | Model or service changes do not silently rewrite the world contract; the product communicates meaningful capability changes and preserves a safe degraded/recovery path. | Primary participant → JTBD-01/05 → N13, N19–N20, N23, N48 / E54, E66, E74, E79 → Principles 1, 5, 9 | A representative model/service change is disclosed; core user-owned state remains available and a temporary model failure does not corrupt it. |
| `MUST-10` | Baseline privacy, consent, content boundary, creator-rights, accessible access state and appeal paths are understandable at the point of use; full regional family/age governance is not an MVP promise. | Primary participant → JTBD-02/05 → N18, N39, N42, N47, N52 / E53, E62, E65, E72 → Principle 10 | A user can tell who can see/change what, why a boundary or access state applies, and how to recover or appeal; no hidden permission assumption is required. |
| `MUST-11` | Core operation remains usable with reduced motion, quiet/no-audio behavior, readable text and a degraded path on constrained devices. | Primary participant → JTBD-01/02 → N21, N36, N38, N49 / E47, E63, E71, E76 → Principle 8 | Removing optional sensory effects does not remove world comprehension, control, continuity or recovery. |
| `MUST-12` | Usage, entitlement and consequential cost/limit information is understandable before the user commits to a paid or limited action. | Primary participant → JTBD-05 → N19, N41 / E64, E66, E79 → Principles 5, 7, 10 | A user can predict what is included, what consumes a limited allowance and what remains after cancellation; no hidden charge is needed for normal use. |

## SHOULD SUPPORT

These improve the launch promise but may follow the minimum continuity loop if capacity is constrained.

| Scope ID | Capability boundary | Traceability / reason |
|---|---|---|
| `SHOULD-01` | Optional goal/constraint/stakes/completion packs for worlds that want a more game-like loop, including meaningful failure and a visible chapter/task arc. | JTBD-02/03 → N10, N11, N51 / E60, E78; Principle 3. Must remain optional in the default open-world frame. |
| `SHOULD-02` | Creator behavior checks and a preview that tests representative interactions before sharing. | JTBD-04 → N16–N17, N31, N33 / E13, E15, E39; Principle 6. |
| `SHOULD-03` | User-directed migration intake that turns user-owned or otherwise authorized prior material into an inspectable, editable continuation package while retaining the original archive. | JTBD-05 → N22, N43–N44 / E67–E68; Principles 1, 7, 9. Third-party IP remains `REF-ONLY`; this capability does not authorize importing protected material. |
| `SHOULD-04` | Bounded sharing of a playable personal world package with explicit rights, visibility and attribution, without a public marketplace. | JTBD-04/05 → N17, N33, N39 / E39, E62; Principles 6, 7, 10. |

## LATER

- Public creator discovery, ratings, followers, marketplace and creator monetization.
- Advanced multi-world operations, bulk maintenance and professional/team authoring.
- Full deterministic RPG rules, competitive balance, exact simulation ticks and large-scale economy.
- Rich multi-user worlds, social governance and co-presence.
- Deep cross-model comparison, automated migration at scale and broad import formats.
- High-fidelity 3D, spatial audio, procedural terrain, persistent map layers and other performance-intensive immersion systems.
- Full family/age policy suite across regions and institutional governance.
- Optional state-expressive audio, motion, map or environmental enhancements. If later selected for an approved product moment, they must obey the accessibility and graceful-degradation boundary in `MUST-11`; the Immersion Library alone cannot promote them into MVP scope.

These may be valuable later, but none is required to validate the primary continuity-and-agency loop.

## OUT OF SCOPE for MVP

- WorldOS parity, parity tests, routes, page structures, Apps/Maps/Memory patterns or observed defects as a bundle.
- A generic chatbot or unbounded companion substitute for human relationships.
- An autonomous system that controls the player avatar, spends user resources or commits irreversible actions without explicit authority.
- A professional creator engine, public UGC marketplace or social feed as the primary launch loop.
- A visual/audio/3D-first experience that becomes unusable without high-end devices or media.
- Final brand selection, trademark/domain clearance, pricing strategy beyond transparent usage boundaries, database schema, API, technical stack, UI layout or implementation.

## MVP boundary test

If a candidate feature does not directly help the primary user:

1. return to a meaningful world;
2. choose how much the AI leads independently from whether the world is open-ended or goal-framed;
3. trust facts, relationships and consequences;
4. shape a playable personal world; or
5. preserve/recover/exit their investment;

it is not a MUST for MVP.
