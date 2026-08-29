# Simulora Overall Experience Integration Repair Report

**Status:** Complete; ready for an independent Overall Experience Re-Audit  
**Repair date:** 2026-08-29  
**Frozen experience baseline entering repair:** `bce83161f4ad9518a685a596b28c85ee54fd97f2`  
**Independent Audit evidence commit:** `6ea7844` (`docs: record overall experience audit`)  
**Historical Audit:** [OVERALL_EXPERIENCE_AUDIT.md](OVERALL_EXPERIENCE_AUDIT.md)  
**Historical Audit Summary:** [OVERALL_EXPERIENCE_AUDIT_SUMMARY.md](OVERALL_EXPERIENCE_AUDIT_SUMMARY.md)

This report records a narrow integration repair. It does not replace or edit the historical Audit, reopen the approved P1/P2/P3/P4 slice semantics, perform Experience Freeze, authorize Implementation Planning, or begin Product Implementation.

## 1. Repair Scope

The repair addresses the combined-product failures identified by the Overall Experience Audit:

| Audit ID | Severity | Repair target |
|---|---|---|
| `OEA-B01` | BLOCKER | Preserve received/provisional/confirmation/interrupted Action state across supporting surfaces. |
| `OEA-B02` | BLOCKER | Restore a repeatable participation loop after C-118, C-119, and later records. |
| `OEA-I01` | IMPORTANT | Give Studio, Recovery, Return, Continuity, Context, overlays and browser Back coherent URL/history behavior. |
| `OEA-I02` | IMPORTANT | Make the C-119 Action Trace readable on the moon-paper Context surface. |
| `OEA-I03` | IMPORTANT | Make `Keep proposal as draft` retain R-04 honestly within the current prototype session. |
| `OEA-I04` | IMPORTANT | Replace the beacon-hard-coded global Continuity entry with a general landing contract. |
| `OEA-M01` | MINOR | Stop referring to the superseded beacon request as the current Action. |

The repair intentionally does not remove reviewer chrome, replace Manus-hosted assets, complete accessibility hardening, add a backend, or turn prototype state into production persistence.

## 2. Root Causes

### 2.1 Action lifecycle ownership

`P1Action` owned its `stage`, text, confirmation and reset behavior locally. Moving to Recovery, Studio or Return unmounted that component and rebuilt it at `ready`. The same component also gated the Action composer behind `!world.currentRecord`, conflating “this world has history” with “an Action is currently in progress.”

### 2.2 Studio draft ownership

`WorldStudio` owned `structureEnabled` and its acknowledgement locally. Leaving Studio unmounted the component, so re-entry contradicted the “kept locally” acknowledgement.

### 2.3 Navigation ownership

Surface changes used `history.replaceState` and local `view` state. URLs described a surface but did not form a traversable product history. Browser Back could therefore leave the application rather than close or return from the current surface.

### 2.4 Continuity entry

The persistent mobile `Continuity` button directly called `openLens("beacon")`. This made one selected fact appear to be the category itself and created a different mental model from desktop contextual Lens entry.

### 2.5 Trace colors

The Action Trace reused dark-world rail colors inside the light Context sheet. Its semantics were correct but its primary provenance labels and copy were difficult to read.

## 3. Chosen Experience Contracts

## 3.1 Pending Action Contract

One shell-level `ActionSession` now owns the current Action independently of the visible surface.

| State | Meaning | What survives navigation/refresh | How it ends |
|---|---|---|---|
| `ready` | World is ready for the next Action. | Draft text and current base record in the open prototype tab. | User sends the Action. |
| `received` | Action has been acknowledged; World truth is unchanged. | Action text, base record, status and continuation controls. | Continue to provisional review, or explicitly discard. |
| `provisional` | A possible outcome is visible but not recorded. | Proposal, exact current base and `Not recorded` boundary. | Reject, enter confirmation, or remain pending. |
| `awaiting-confirmation` | Exact high-impact effect is awaiting direct confirmation. | Same pending Action contract; no World mutation. | Confirm, or cancel back to the retained proposal. |
| `cancelled` | Confirmation was cancelled; proposal remains visible and World truth remains unchanged. | Proposal and explicit cancellation acknowledgement. | Review again or reject. |
| `interrupted` | The world check did not finish and nothing was recorded. | Action identity and safe Retry/Discard choices. | Retry or explicitly discard. |
| `recorded` | Direct confirmation created the latest record. | Record identity, current World truth and history. | User selects `Take another action`, beginning a new cycle. |

Supporting surfaces show a compact pending-Action ribbon. World Context also explains the pending state. Leaving a surface is never treated as cancellation. A pending Action clears only after an explicit discard/reject or a confirmed record.

For prototype honesty, World truth, Action session and Studio draft are mirrored to `sessionStorage`. This only represents the current open browser-tab session. It is not a durable save, cloud sync, account persistence, backend acknowledgement or production recovery mechanism.

## 3.2 Repeated Participation Contract

History and participation are now independent:

```text
recorded history exists
        +
current Action is ready / pending / recorded
```

A confirmed C-118 or C-119 no longer removes the Action path. The recorded result first receives a readable completion state with `Take another action`. That choice creates a new Action session based on the current record while retaining all prior truth and history.

The second modeled Action is intentionally bounded: Maren can hold the north-water watch. Its confirmation produces a later record such as C-120 without replacing the beacon fact governed by C-118 or C-119. World, Return, Continuity, Trace, Recovery and Studio project the later record and the still-governing beacon record separately.

## 3.3 Draft Retention Contract

R-04 meaningful structure state is now owned by the shell rather than `WorldStudio`. `Keep proposal as draft` means:

- R-04 remains available after returning to World, visiting another surface, re-entering Studio, and refreshing the same open tab;
- R-04 remains `Draft · not applied`;
- current Continuity remains R-03;
- the prototype does not claim a durable save, cloud sync, publication or adoption.

The retained notice states this boundary directly.

## 3.4 Continuity Landing Contract

Global `Continuity` now opens a small current-path landing rather than a beacon-specific Lens. It answers:

1. what currently holds on this path;
2. what the latest record is;
3. which fact the user wants to understand.

Beacon, Maren and northbound-boat rows then open the existing contextual fact Lens. When entered through the landing, the Lens returns to Continuity; when entered contextually from Return, Recovery or a record, it returns to the underlying surface. Mobile and desktop therefore share one category-to-fact mental model.

## 3.5 Navigation Contract

- Page-like surfaces—Return, Recovery and Studio—receive history entries.
- Continuity, fact Lens and World Context receive inspectable URL state and history entries.
- A contextual transition from World Context into Recovery or Studio replaces the temporary Context entry, so Back returns to the prior World rather than reopening a stale sheet.
- Browser Back closes the most recent Lens/landing/surface in order.
- Explicit `Return to world` removes the temporary navigation depth and returns to a clean World URL.
- Refresh reconstructs the surface from URL and reconstructs current prototype-session state from the current tab session.

This remains a prototype navigation model, not a production router design.

## 4. Implemented Repair

### Shared truth and lifecycle

- Moved Action stage, text, base record, cycle and recorded ID to the Home shell.
- Added explicit received, provisional, awaiting-confirmation, cancelled, interrupted and recorded states.
- Added shell-level current World truth, Action session and Studio draft session snapshot.
- Kept generated/provisional copy non-authoritative until direct confirmation.
- Preserved the C-118 → C-119 supersession model and retained C-118 in history.
- Added a later Action record without changing the fact-specific beacon authority.

### Cross-surface projections

- Added pending status to secondary surfaces without making those surfaces Action owners.
- Updated World Context to distinguish latest record from the beacon record that governs the fact.
- Updated Return to project the later watch instruction while retaining the beacon and boat facts.
- Updated Studio’s playable-world panel to read current shared World truth.
- Updated Recovery’s earlier-record selection and state labels for later records.
- Updated the Action Trace to distinguish earlier/superseded Action, current Action and latest World record.

### Draft and Continuity

- Lifted R-04 draft ownership out of `WorldStudio`.
- Added honest same-tab session retention and explicit non-durable wording.
- Added a general Continuity landing shared by mobile and desktop.
- Preserved the existing fact-specific Lens, source/scope/freshness fields and privacy boundary.

### Navigation and visual repair

- Replaced the all-`replaceState` navigation behavior with a bounded push/replace contract and `popstate` synchronization.
- Cleaned World URLs after explicit Return.
- Added Context-sheet-specific Trace colors and larger provenance copy.
- Replaced residual “current action” wording for the C-119 superseded Action.

## 5. Validation

## 5.1 Static validation

| Check | Result |
|---|---|
| TypeScript `tsc --noEmit` | PASS |
| Production build | PASS |
| `git diff --check` | PASS |
| Browser console errors/warnings during walkthrough | None observed |

The build retains the pre-existing analytics-placeholder warnings and the known unresolved `/manus-storage/...` visual-resource warning. Neither was introduced by this repair.

## 5.2 Desktop walkthroughs

| Journey | Result |
|---|---|
| received → provisional → Recovery → World | PASS; proposal and unchanged-world boundary remained. |
| provisional → Studio → World | PASS; proposal remained. |
| proposal → confirmation cancel → review again → record C-118 | PASS. |
| C-118 → next Action → provisional → C-120 | PASS; C-118 beacon truth remained distinct from C-120. |
| Return after C-120 | PASS; latest instruction, beacon fact and boat observation were projected separately. |
| global Continuity → beacon Lens → Continuity → underlying Return | PASS; URL and mental model remained aligned. |
| Studio R-04 → review → Keep → World → Studio | PASS; draft and `not applied` boundary remained. |
| Studio → Browser Back | PASS; returned to clean World URL. |
| C-118 → Correction → C-119 → next Action | PASS; composer was available after correction. |
| C-119 Trace | PASS; earlier Action was labeled historical/superseded, current Action remained separate, and C-119 remained current truth. |
| Studio/Recovery refresh and Browser Back | PASS; refreshed surface matched URL and Back returned to World. |

Computed Trace styling on the moon-paper Context surface was verified as dark readable text (`rgb(38, 56, 64)`, 12px) on `rgb(240, 235, 225)`.

## 5.3 390×844 real-pointer walkthroughs

The mobile checks used coordinate pointer input against rendered controls, not only programmatic state changes.

| Journey | Result |
|---|---|
| World → Continuity landing | PASS; global landing did not select beacon automatically. |
| Continuity → beacon Lens → Back to Continuity → World | PASS; URL and active navigation followed the visible surface. |
| received Action → More / World Context | PASS; Context displayed `Received · world unchanged`. |
| More → Recovery → Return to Action | PASS; pending received state remained. |
| World → Studio with pending Action → Browser Back | PASS; pending state remained and URL returned to World. |
| R-04 Keep → refresh Studio | PASS; same-tab session draft and non-durable boundary remained. |
| Recovery refresh → Browser Back | PASS; surface and URL stayed aligned. |

Fixed mobile navigation did not prevent the tested Continuity, Context, Recovery, Studio or Action controls from receiving pointer input after normal scrolling.

## 6. State Consistency Check

| State | World | Trace | Return / Continuity | Recovery | Studio |
|---|---|---|---|---|---|
| Initial | Beacon unlit; no record | No sent Action | No beacon record | No recovery source | R-03 baseline; no draft |
| Received | Same truth; pending status | Current Action received | Current truth unchanged; pending remains shell-owned | Pending ribbon; no new recovery source | Pending ribbon; draft remains separate |
| Provisional / confirmation | Same truth; not recorded | Current Action + possible check | Provisional outcome excluded from Continuity | Recovery still reads current committed record only | Proposal remains unrelated to Revision draft |
| C-118 | Beacon lit; Maren waiting | Completed Action → C-118 | C-118 explains beacon and Maren | C-118 is recovery source | R-03/C-118 current; R-04 separate |
| C-119 | Beacon unlit; Maren watching | Earlier C-118 Action superseded; C-119 current | C-119 current; C-118 history | C-119 current; C-118 accessible earlier record | R-03/C-119 current; R-04 separate |
| Next Action after C-119 | C-119 remains truth until confirmation | C-118 history + current pending Action + C-119 current record | No premature projection | C-119 remains recovery source | Studio reads C-119 and does not absorb pending Action |
| Later C-120 | Beacon still governed by C-119; watch instruction added | C-120 latest; C-119 beacon authority retained | C-120 and C-119 projected by their scopes | C-120 current; C-119 selected as previous record | R-03/C-120 current; R-04 still proposal |
| R-04 local draft | Current Continuity unchanged | Action lifecycle unchanged | Draft excluded from Continuity | Recovery path unchanged | Retained only as same-tab, not-applied proposal |

No supporting surface became an independent owner of current World truth.

## 7. P1/P2/P3/P4 Regression

- **P1:** received/provisional/direct confirmation/interrupted/recorded distinctions remain intact and are now preserved across surfaces.
- **P2:** Return remains a small orientation projection; Lens retains source, scope, freshness, history, correction and privacy boundaries.
- **P3:** Safe point, Branch, append-oriented Restore, stale review, Correction handoff and Delete boundary were not redefined. Later records are now projected without hard-coded C-119 state copy.
- **P4:** playable World remains first; R-04 stays `Draft · not applied`; Fieldbook review does not mutate current Continuity; optional depth remains optional.
- **Cross-slice authority:** an ordinary Action, Recovery operation or Studio draft still cannot silently change participation or creator authority.

## 8. Remaining Known Gaps

These remain outside this narrow repair and should be carried into the independent Re-Audit or later hardening. None is currently classified as a remaining Audit blocker or important integration issue by this repair pass; the independent Reviewer must make the final determination.

1. Full accessibility hardening—focus trap/restore, Escape behavior, modal semantics, screen-reader order and formal contrast/touch-target audit—remains future work.
2. Reviewer OBS chrome and fixture query parameters remain prototype testing infrastructure, not approved product IA.
3. Manus-hosted orbit/hero assets and analytics placeholder warnings remain known prototype provenance/scaffold residue.
4. The repeated Action example is a bounded comprehension fixture, not a general generated-world engine.
5. `sessionStorage` is only a same-tab prototype simulation. Production received Actions, records and drafts will require the authoritative/durable contracts already defined by System Design.
6. A production router, reconnect handling, duplicate submission, offline/multi-tab behavior and server stale-head handling remain implementation concerns; this repair does not simulate them.

## 9. Repair Recommendation

The exact integration failures from the historical Audit have been repaired and self-tested. The repository is ready for a new independent Overall Experience Re-Audit.

The independent Re-Audit should attack at least:

1. received/provisional Action → Recovery/Studio/Continuity/Context → Action;
2. C-118 → next Action → C-120 and C-118 → C-119 → next Action;
3. Return and Continuity projections after later records;
4. Studio keep → World/Recovery/Continuity → Studio and refresh;
5. desktop/mobile Back, close, explicit Return and refresh;
6. C-119 Trace readability and earlier/current provenance;
7. P1/P2/P3/P4 semantic regression.

```text
OVERALL EXPERIENCE INTEGRATION REPAIR: COMPLETE

PENDING ACTION CONTRACT: PASS
REPEATED PARTICIPATION LOOP: PASS
DRAFT RETENTION: PASS
CONTINUITY LANDING: PASS
NAVIGATION / BROWSER BACK: PASS
CROSS-SURFACE TRUTH: PASS
P1/P2/P3/P4 REGRESSION: PASS
DESKTOP: PASS
390x844 MOBILE: PASS

BLOCKERS REMAINING: 0
IMPORTANT REMAINING: 0

READY FOR OVERALL EXPERIENCE RE-AUDIT: YES
EXPERIENCE FREEZE: NOT PERFORMED
IMPLEMENTATION PLANNING: NOT STARTED
PRODUCT IMPLEMENTATION: NOT STARTED
```
