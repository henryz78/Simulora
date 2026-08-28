# P3 Recovery Lab — Prototype Report

**Result:** `P3 RECOVERY LAB PROTOTYPE: PASS`
**Visual direction:** Quiet Observatory, with an intent-first recovery field document.
**Boundary:** a static clickable prototype only; no runtime, database, persistence, Branch creation, Restore mutation, deletion or product implementation was introduced.

## What was added

P3 is a third **Observation slice**, separate from the approved P1/P2 states. Its Recovery Lab starts by asking what the participant means to protect or change, then connects current record → chosen intent → reviewed boundary through a visible Signal thread. Desktop presents a quiet three-part observation field; mobile converts it to an ordered, full-width sequence and does not add Recovery as a permanent bottom-navigation destination.

| Intent | Prototype result | Required meaning preserved |
|---|---|---|
| **Mark a safe point** | Names a label against the current record. | It is a reachable reference, not a copied state, alternate timeline or deletion. |
| **Try another path** | Compares source and named alternative, then shows a prototype-only prepared state. | The original path stays unchanged; no merge or replacement is implied. |
| **Restore this path** | Shows C-118 → C-119 scoped diff, affected/preserved/not-affected sections, then exact review and a prototype-only result. | Restore appends a reviewed transition; it does not destructively rewind or touch contracts, access, consent, ownership, usage or other paths. |
| **Stale Restore review** | Stops modeled application and asks for a renewed review. | Nothing is restored, changed or removed on stale context. |
| **Correct a continuity item** | Hands off to the existing record-bound C-119 Continuity Lens. | Correction changes a named item, not a whole timeline. |
| **Delete…** | States a lifecycle boundary only. | Deletion is never depicted as a recovery shortcut or simulated in P3. |

## Visual and interaction decisions

The warm moon-paper recovery surface now contains a Recovery file header, source identifier and scope-review marker so it reads as a field document rather than a settings card. A restrained orbit marker in the Current Path area, an amber Signal thread, and observation-coordinate navigation make the recovery journey visibly connected without returning to dashboard rails or high-motion effects.

## Validation evidence

The dedicated browser walkthrough used coordinate-based pointer actions and passed every listed check in both desktop and 390×844 mobile viewports. It also verified the prior P1 corrected world and P2 Return projection before entering P3. `pnpm run check` passed after the final visual enhancement.

### Focused P3-B1 mobile follow-up

After independent P3 review identified a P2 Return `Continue at the lamp room` mobile overlap, the prototype received one scoped CSS repair: button-level `scroll-margin-bottom` on the Return continuation only. The final 390×844 scroll-end test measured Continue at **y=377.59–415.59**, fixed navigation at **y=774–844**, and **0px overlap**. A coordinate-based pointer event hit Continue itself, entered the C-119 corrected World, and did not open World context. Existing P1 five-control and P3 Recovery mobile pointer walkthroughs continued to pass.

| Validation group | Desktop | 390×844 mobile |
|---|---|---|
| P1/P2 corrected-state regression | PASS | PASS |
| Safe point and Branch preservation | PASS | PASS |
| Restore preview, exact review and result boundary | PASS | PASS |
| Stale review blocks application | PASS | PASS |
| Record-bound correction handoff | PASS | PASS |
| Delete separated from recovery | PASS | PASS |

## Remaining prototype-only limits

The prototype validates **comprehension and interaction framing**, not production behavior. Real authorization, accessible-source selection, expected-head conflict handling, durable proposal/confirmation records, Commit/Event creation, Branch lineage, scope filtering and lifecycle deletion remain the frozen system-design contract and have not been implemented here. P4 World Studio remains out of scope and has not been started.

## References

- [Text Wireframes V0 — W-08 Recovery Lab](../../docs/deliverables/experience-structure/TEXT_WIREFRAMES_V0.md)
- [Interaction States V0 — Recovery Lab](../../docs/deliverables/experience-structure/INTERACTION_STATES_V0.md)
- [Runtime/Persistence — Recovery Points, Branch and Restore](../../docs/system-design/RUNTIME_MODEL_AND_PERSISTENCE.md)
