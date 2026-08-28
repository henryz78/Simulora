# P1/P2 Focused Prototype Refinement

**Status:** `P1/P2 REFINEMENT: COMPLETE`
**Scope:** `QUIET OBSERVATORY RETAINED` · `NO P3/P4 EXPANSION` · `NO PRODUCT IMPLEMENTATION` · `NO COMMIT` · `NO PUSH`

## 1. Intent and preserved boundaries

This refinement keeps the original P1 Action Truth and P2 Return Orientation → Continuity Lens → Correction responsibilities intact. It does not change who may commit, how a Participation Contract changes, what an L3 confirmation requires, the scope-filtered Explanation Projection boundary, or the distinction among history, current record, Branch and Restore. It only changes the presentation hierarchy so the user encounters the world first and supporting control surfaces when needed.

The Quiet Observatory direction remains provisional but coherent: a quiet midnight world plane, a warm record plane, Signal Amber as a restrained relationship cue, and short field-document surfaces for actions and records. The prototype remains static and contains no product runtime, backend, account, persistence, model call or actual Commit.

## 2. What changed

| Focus area | Earlier prototype risk | Refinement | Resulting experience hypothesis |
|---|---|---|---|
| **Desktop hierarchy** | A permanent left rail and Change Trace produced dashboard/control-panel weight around the world. | The workspace now uses a broad world-first plane. World context and Action record open as explicit, on-demand surfaces. | The harbor, the immediate situation and the user’s next action are primary; supporting truth remains findable without competing with the scene. |
| **World context** | Participation Contract, Branch context and continuity context were permanently visible even when unnecessary. | A compact coordinate bar names the current path; `World context` opens a dedicated sheet for location, response agreement and what is kept. | The user can orient when needed, while ordinary participation is not made to feel like administration. |
| **Change Trace** | Trace was always present at a dashboard scale. | The main plane contains a compact natural-language signal such as “One action is being considered”; `View action record` opens the detailed, phased record. | State truth remains inspectable and attributable without an always-on activity feed. |
| **Mobile primary navigation** | Return and Restore permanently occupied the bottom bar despite being conditional paths. | The primary bar is now **World / Continuity / More**. Return is an entry state or a return-to-world choice; Restore belongs to More and remains deferred to Recovery Lab. | Persistent mobile navigation maps to continuing, understanding, and contextual options—not every possible product capability. |
| **Continuity language** | Canonical fact, source class, Commit ID, scope and freshness appeared at the first reading layer. | The first layer says `Current world record`, `Where it matters`, `Where it belongs` and `Last settled`. `View record details` reveals source, record kind, Commit ID, permitted scope and correction path. | Users can understand present relevance before they encounter system provenance terms. |
| **Prototype controls** | A simulated recovery trigger looked like a potential shipped product control. | The visible `Prototype: show recovery` affordance was removed. Key P1 states remain reachable by normal prototype flow or documented preview state URLs only. | The product plane no longer teaches a false capability; review-only state inspection is kept outside the interface. |

## 3. P1 Action Truth after refinement

P1 still makes the **acknowledged ≠ provisional ≠ recorded** distinction explicit. The action begins as a Field Note under the active scene. When received, the user reads that the action is received and the world is unchanged. A possible outcome then has its own warm record surface and an explicit `Not recorded` label. The L3 dialog names the concrete result, what it affects and what does not change. Only after confirmation does the user see `Recorded on your current path` and plain-language outcomes.

| P1 state | First thing shown | Supporting detail, only when needed | Boundary preserved |
|---|---|---|---|
| Ready | Current scene and “World unchanged.” | World context and existing record available on demand. | No action, proposal or Commit is implied. |
| Acknowledged | “Your action is received. The world is still unchanged.” | Action record gives a phase-aware account. | Receiving an action does not change the world. |
| Provisional | “Possible outcome” and “Not recorded.” | Review dialog enumerates exact effects. | Narrative proposal is not authoritative state. |
| L3 confirmation | Exact target/outcome and unaffected items. | Cancel is equally visible. | Only direct, precise confirmation advances the shown outcome. |
| Recorded | “Recorded on your current path” and three natural-language consequences. | Continuity Lens can reveal the record details. | Change is scoped to the current path and is understandable. |
| Interrupted | “We could not finish the check. Your world is unchanged.” | Safe retry or discard path. | Partial/ambiguous change is not implied. |

## 4. P2 Return and Continuity after refinement

Return Orientation retains only three meaningful changes and a clear next participation point. It avoids a permanent history feed. The Continuity Lens now begins with the question “Why is this true now?” and presents an ordinary-language account before any technical detail. The correction entry remains immediate and direct because safety depends on it being visible, but its confirmation still makes history preservation, scope and unaffected paths clear in natural language.

| Layer | Participant-facing language | Secondary technical detail | Why the split matters |
|---|---|---|---|
| Current truth | **Current world record** | Canonical fact | The participant first understands what presently applies. |
| Present relevance | **Where it matters** | Used by | Explains why the fact changes the current scene or relationship. |
| Boundary | **Where it belongs** | Permitted scope | Makes local/path limitation clear without leading with implementation vocabulary. |
| Recency | **Last settled** | Freshness | Communicates confidence and whether later change exists. |
| Provenance | **View record details** | Source class and Commit ID | Available for verification without burdening the first read. |
| Repair | **Correct this record** | Correction path | Makes repair visible while retaining exact-confirmation protection. |

The Lens still explicitly says what explanation does **not** expose: private context, raw prompts, hidden retrieval or model-only reasoning. This is retained because presentation clarity cannot bypass the frozen privacy and authority boundary.

## 5. Desktop/mobile comparison

| Question | Desktop answer | Mobile answer |
|---|---|---|
| What remains visible while participating? | World coordinates, world scene, action/return reading plane and a small context entry. | Current world/return reading plane, ordered bottom entry to World, Continuity and More. |
| Where do detailed context and Action phases go? | On-demand side sheets, preserving the current scene behind them. | Full-width ordered sheets, preserving a visible close/return route. |
| Is Return permanently navigational? | No. It is a current experience state and an entry point, not permanent chrome. | No. It does not occupy the bottom bar. |
| Is Restore permanently navigational? | No. It is contextual and remains a Recovery Lab responsibility. | No. It is in More, not primary navigation. |
| Can a user inspect technical record details? | Yes, after natural-language explanation in the Lens. | Yes, after natural-language explanation via a disclosure. |
| Can status be understood without the detail panel? | Yes: action and world record states are named in the primary plane. | Yes: the same ordered language appears before the user reaches a sheet. |

## 6. Verification performed

The refined prototype was checked in a real desktop rendering at **1440 × 1000** for P1 provisional, P1 recorded and P2 return states. It was also checked at **390 × 844** for P1 provisional, P2 return and the Continuity Lens. The screens show the removed permanent rails, the world-first center plane, the revised three-intent mobile bar, and the natural-language-first Lens. TypeScript verification passed with `pnpm run check`.

The following targeted static boundary check passed: the obsolete visible prototype recovery control is absent; the `MobileNav` implementation contains no persistent Return/Restore destination; `View record details` exists; and Commit C-118 is retained only as a secondary record detail. This is a prototype rendering and contract check, not a user-comprehension study.

## 7. What remains provisional

The user-facing phrase `Current world record`, the amount of secondary provenance to reveal, the coordinate-bar density, the exact mobile focus-return behavior, and whether the desktop context sheet should be a side sheet or a modal all require future user testing. L3 stale-head renewal presentation is still not designed; the frozen contract remains in force, but the user-facing transition pattern must be resolved through OED-06 work. Recovery Lab terminology and actual Branch/Restore choice presentation remain intentionally outside P1/P2.

The Quiet Observatory palette, typography, signal thread, imagery, world-coordinate treatment and field-document texture are also provisional. They are a strong prototype direction, not a final brand, component system or implementation commitment.

## 8. P3/P4 recommendation

**Do not move into P3 Recovery Lab or P4 World Studio yet.** The refined P1/P2 prototype is sufficiently focused for the next valuable activity: structured comprehension review of acknowledged/provisional/recorded truth, L3 confirmation, return density, Continuity Lens vocabulary and mobile context retention. Adding P3/P4 now would introduce additional recovery and creator complexity before the current two core slices are validated.

The next transition should be explicitly authorized after reviewing this prototype and, ideally, after focused participant or approval-agent feedback. At that point, P3 should begin with comparative recovery-intent scenarios; P4 should begin only with progressive disclosure of a playable small world. Neither should be treated as an extension of the existing bottom navigation or a reason to reintroduce a dashboard shell.

`FOCUSED P1/P2 REFINEMENT: COMPLETE`
`DESKTOP/MOBILE STRUCTURE: VERIFIED IN PROTOTYPE RENDERING`
`P3 RECOVERY LAB: NOT YET RECOMMENDED`
`P4 WORLD STUDIO: NOT YET RECOMMENDED`
`PRODUCT IMPLEMENTATION: NOT STARTED`
`COMMIT/PUSH: NOT PERFORMED`
