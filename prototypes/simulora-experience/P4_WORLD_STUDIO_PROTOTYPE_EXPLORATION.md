# P4 World Studio — Prototype Exploration

**Status:** `P4 PROTOTYPE EXPLORATION: COMPLETE · INDEPENDENT GATE REPAIR IMPLEMENTED`
**Direction:** `Living Draft foundation + Fieldbook clarity`
**Scope:** static, clickable comprehension prototype for the first World Studio authoring path.
**Explicitly not:** `NOT PRODUCT IMPLEMENTATION` · `NOT RUNTIME OR PERSISTENCE` · `NOT A SETUP WIZARD` · `NOT A CREATOR DASHBOARD`

## Approved direction

The direction was approved in [`p4-direction-demos/direction-approved.md`](./p4-direction-demos/direction-approved.md). Living Draft is the primary grammar: the playable Greyhaven world is visible and reachable before any authoring surface. Fieldbook / ledger treatment is used only to make a meaningful structure and its revision boundary legible. The Causal Constellation direction remains a future optional-depth reference and is not part of this core path.

## Design question

> Can a participant begin with a world that already plays, add one meaningful layer of structure, and understand exactly what would change later without believing their current Continuity has changed now?

## Prototype path

1. **Playable world first** — Greyhaven, the current scene, and the active Continuity revision remain the primary reading plane.
2. **Meaningful structure** — one motive, one pressure and one consequence are shown as a concise fieldbook, organized by effect on play rather than engine objects or template IDs.
3. **Revision review** — the proposal is explicitly labelled `R-04 · Draft · not applied`; the review names affected future scenes and untouched current facts/history.
4. **Optional depth** — advanced causal/relationship inspection is secondary and closed by default; it is not required to play or create a first structure.
5. **Safe return** — the participant can return to the playable world at every stage. The prototype draft is local and cannot mutate P1/P2/P3 `WorldTruth`.

## State and authority boundary

The component reads the shared prototype `WorldTruth` (`C-118`, `C-119`, or no record) to render current Greyhaven. Its structure toggle, optional-depth disclosure and revision-review panel are ephemeral local state. They do not create a World Revision, Commit, Event, Branch, persistence record or migration. In particular:

- `World Revision proposal R-04` is not the active `Continuity R-03`.
- A review or “keep proposal as draft” action does not publish or apply a revision.
- Existing C-118/C-119 history remains visible as current context and is never rewritten by Studio.

## Experience boundaries

- The playable world remains first on desktop and first in sequential mobile order.
- Progressive disclosure is based on effect on play, not creator setup completeness.
- Fieldbook clarity is explanatory, not an invitation to edit raw prompts, schemas or model reasoning.
- No backend, schema, API, production component library, final brand decision or technical implementation was introduced.

## Validation result

The initial prototype was checked with the repository TypeScript check and production build, then exercised through a focused browser path. A later independent review correctly found that mobile secondary surfaces were not reachable from ordinary UI, desktop relied too heavily on reviewer OBS chrome, URL state remained stale after Return, and two review interactions needed clarification. Those issues have now received the scoped repair documented in [`P4_WORLD_STUDIO_GATE_REPAIR_REPORT.md`](./P4_WORLD_STUDIO_GATE_REPAIR_REPORT.md), including real 390×844 pointer navigation from World to Studio.

`P4 WORLD STUDIO PROTOTYPE REPAIR: SELF-VERIFIED`
`INDEPENDENT P4 RE-REVIEW: PENDING`
`P1/P2/P3 APPROVED BASELINE: PRESERVED`
`PRODUCT IMPLEMENTATION: NOT STARTED`

## References

- [World Studio W-09](../../docs/deliverables/experience-structure/TEXT_WIREFRAMES_V0.md)
- [World Studio interaction states](../../docs/deliverables/experience-structure/INTERACTION_STATES_V0.md)
- [Product requirement PR-011](../../docs/product/PRODUCT_REQUIREMENTS.md)
- [System state boundary](../../docs/system-design/DOMAIN_STATE_AND_DATA_MODEL.md)
