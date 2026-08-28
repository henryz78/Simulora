# P3 Recovery Lab — Prototype Exploration

**Status:** `P3 PROTOTYPE EXPLORATION: COMPLETE`
**Scope:** a static, clickable comprehension prototype for recovery intent only.
**Explicitly not:** `NOT A P1/P2 REDESIGN` · `NOT P4 WORLD STUDIO` · `NOT PRODUCT IMPLEMENTATION` · `NOT RUNTIME OR PERSISTENCE`

## Design question

> When something in a continuing world needs reconsideration, can a participant choose the right kind of recovery without believing that their original path will be erased?

P3 extends the Quiet Observatory with a deliberate **Recovery Lab**, not a command center or version-control interface. The participant enters to name their intent before the prototype ever shows a consequential option. The visual world remains quiet; the recovery surface is a warm, readable field document that explains preservation before confirmation.

## Prototype state boundary

The prototype reads the already-shared P1/P2 `WorldTruth` as its current-path context. Its recovery interactions are temporary prototype state only: they demonstrate what a future authorized operation must explain but do not create a runtime Branch, Commit, Recovery Point, restore, deletion, persistence record or backend event.

| Recovery context | Prototype condition | What P3 may show | What P3 must not claim |
|---|---|---|---|
| No committed recovery source | The current path has no record. | The purpose of a future safe point and a return to the world. | That a proposal, draft or initial situation is a recovery point. |
| Current committed path | C-118 or C-119 exists. | Accessible current record and a safe-point naming path. | That a label copies, moves or deletes world state. |
| Earlier accessible record | C-118 remains historical after C-119. | A scoped Restore preview from the selected earlier record. | That Restore rewinds, truncates history or restores account/consent/contract state. |
| Alternative experiment | A Branch preview has been reviewed. | A named alternative, source-preservation statement and a clear way back. | That the source Branch is edited, merged or removed. |

## Intent-first recovery map

| Participant intent | Primary action | First plain-language promise | Required safety distinction |
|---|---|---|---|
| Keep a place worth returning to | **Mark a safe point** | “This labels a reachable recorded point.” | A label is not a second world or state copy. |
| See another possibility without disturbing today | **Try another path** | “Your current path remains unchanged.” | Branch is an alternative; it is not Restore, correction or merge. |
| Bring a reviewed earlier effect into this path | **Restore this path** | “This adds a new, reviewed change here.” | History is retained; only the shown world scope is considered. |
| Correct a specific current fact | **Correct a continuity item** | “This changes the named fact, not a whole timeline.” | Correction belongs in the Continuity Lens and stays record-bound. |
| Remove an owned resource | **Delete…** | “This is lifecycle work, not recovery.” | Delete stays informational in P3 and never borrows Restore language. |

## Interactive paths to prototype

P3 will keep the following paths deliberately narrow. Each asks what is true now, what remains safe and what the user may do next before requesting a confirmation.

| Path | Prototype sequence | Comprehension claim |
|---|---|---|
| Safe point | current record → name/purpose → labelled result | The participant recognizes that the current path remains the same and history is untouched. |
| Branch | select source → preservation preview → name alternative → confirmed prototype result | The participant can identify original versus experiment and knows the source is unchanged. |
| Restore | accessible earlier record → scoped preview → preserved/not-affected statement → exact confirmation → result | The participant recognizes a new committed transition would be appended, not a destructive rewind. |
| Stale review | restore preview → current context changes in the review model → re-review notice | The participant sees that a prior confirmation no longer applies and must be reviewed again. |
| Delete boundary | intent selection → lifecycle distinction | The participant does not misclassify deletion as a recovery shortcut. |

## Desktop and mobile composition

Desktop uses a single recovery reading plane with an intent rail at the edge of the warm document surface, a central purpose/effect explanation, and a small current-path reference. It does not revive the former dashboard rails. Mobile shows the same sequence as an ordered full-width flow: intent first, preservation second, then effect and confirmation. P3 is reachable as a prototype slice, not made a permanent mobile bottom-navigation destination.

## Acceptance checks for this exploration

1. A current committed path and an earlier accessible C-118 record must never be confused with a proposal or deleted past.
2. Branch must name the preserved source and distinct experiment before its prototype confirmation.
3. Restore must name the selected record, affected world scope, retained history and excluded account/contract/privacy scope before confirmation.
4. A stale restore review must stop the modeled confirmation and direct the user to re-review.
5. Delete must remain separated from recovery; P3 will not simulate destructive behavior.
6. P1/P2 Action Truth, Return Orientation and Continuity Lens must retain their approved behavior.

## Frozen contract references

- [Text Wireframes V0 — W-08 Recovery Lab](../../docs/deliverables/experience-structure/TEXT_WIREFRAMES_V0.md)
- [Interaction States V0 — Recovery Lab](../../docs/deliverables/experience-structure/INTERACTION_STATES_V0.md)
- [Runtime/Persistence — Recovery Points, Branch and Restore](../../docs/system-design/RUNTIME_MODEL_AND_PERSISTENCE.md)

## Validation result

The clickable prototype was exercised in both desktop and 390×844 mobile viewports with coordinate-based browser pointer input. It passed all recovery-path checks: safe-point label, alternate-Branch preservation, Restore scope and exact review, stale-review interruption, record-bound correction handoff, Delete lifecycle separation, and the P1/P2 corrected-state regression. TypeScript checking passed after the P3 additions.

`P3 RECOVERY LAB PROTOTYPE: PASS`
`P1/P2 APPROVED BASELINE: PRESERVED`
`P4 WORLD STUDIO: NOT STARTED`
`PRODUCT IMPLEMENTATION: NOT STARTED`
`COMMIT/PUSH: NOT PERFORMED`
