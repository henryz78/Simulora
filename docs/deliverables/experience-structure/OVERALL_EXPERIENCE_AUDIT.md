# Simulora Overall Experience Audit

**Audit status:** `COMPLETE`
**Audit date:** `2026-08-29` (`Asia/Shanghai`)
**Repository baseline:** `main` at `bce83161f4ad9518a685a596b28c85ee54fd97f2`
**P4 approved implementation baseline:** `bf04f5227dec213f45d4c75433b4e570f411e3cb`
**Scope:** Experience Structure + approved P1/P2/P3/P4 as one product experience.
**Explicitly not:** `NOT A REDESIGN` · `NOT EXPERIENCE FREEZE` · `NOT IMPLEMENTATION PLANNING` · `NOT PRODUCT IMPLEMENTATION`

## 1. Executive Verdict

`OVERALL EXPERIENCE AUDIT: FAIL`

Simulora has a coherent and original experience model. The approved slices share one strong product idea: the playable World is primary; generated possibility is not current truth; current Continuity is inspectable and correctable; Recovery preserves rather than silently erases; World Studio proposes future structure without adopting it into the current path. Quiet Observatory, Living Draft and Fieldbook clarity reinforce those distinctions without turning the product into an AI console or creator dashboard.

The combined runnable baseline nevertheless fails the pre-Freeze hard gate for two cross-slice reasons that were not exercised by the individual slice Gates:

1. an acknowledged or provisional Action is silently lost when the participant enters Studio or Recovery and returns; and
2. after C-118 or C-119 exists, the World no longer exposes any Action composer, so the long-term play loop cannot continue.

These are integration failures, not failures of the approved P1, P2, P3 or P4 comprehension hypotheses. The individual baselines remain valid evidence. The current combined artifact is not yet an Experience-Freeze baseline because it cannot honestly sustain `act → understand → return/recover/create → act again`.

Four important issues also need resolution before Freeze: browser Back/history semantics, unreadable Action Trace styling on the moon-paper sheet, a Studio “kept” draft that disappears on re-entry, and an under-defined mobile Continuity primary destination. None requires a product redesign; each has a narrow repair boundary.

## 2. Current Experience Model

### 2.1 What the participant is inhabiting

The product model is not a chat log and not a world editor. The participant inhabits a personal **World** through one causal **path**. The path has a current committed state, retained history, bounded participation authority and a pinned World Revision. The World is the first and primary surface; the supporting surfaces answer a specific question without becoming competing sources of truth.

| User concept | Current experience meaning | What it is not |
|---|---|---|
| **World** | The playable present: scene, situation, characters and the next meaningful point of participation. | A dashboard of every variable, a raw transcript or a creator setup form. |
| **Current truth** | Facts and effects that currently apply to the active path after an accepted record/Commit. | Streaming text, a proposal, a stale summary or a Studio draft. |
| **Possible outcome** | A generated or composed proposal that can be inspected and rejected. | A recorded world change. |
| **History** | Earlier records retained for provenance even after a later correction supersedes their current effect. | Deleted or silently rewritten past. |
| **Continuity** | The facts, relationships, constraints and causal investment that remain meaningful across sessions on a path. | One unlimited transcript, one memory field or a World Revision. |
| **Revision** | An immutable playable World definition such as R-03; Studio may prepare a future R-04 proposal. | A recovery operation on the current path. |
| **Participation** | Acting inside the current World under the independent initiative and world-structure contracts. | Editing creator structure or accepting model authority over the user. |
| **Understanding** | Return Orientation, Action Trace, Continuity Lens and World Context explain current state, source, scope and freshness. | A second authoritative world state. |
| **Recovery** | Safe point, Branch, Restore, Correction or Delete boundary selected according to intent and preservation effect. | One generic “undo” or destructive rewind. |
| **Creation** | World Studio adds meaningful future structure to a draft while the current playable World stays available. | Editing the active Continuity, a setup wizard or a professional engine console. |

### 2.2 Surface responsibility model

```text
World
  ├─ Action → received → provisional → exact confirmation → recorded change
  ├─ Action record / Change Trace → action provenance and current recorded outcome
  ├─ Continuity Lens → why a selected fact/change applies → Correction
  ├─ World Context
  │    ├─ current path / participation agreement / current truth
  │    ├─ Recovery Lab
  │    └─ World Studio
  └─ leave / return

Return Orientation
  ├─ smallest useful account of meaningful changes
  ├─ linked Continuity Lens
  └─ Continue to World

Recovery Lab
  ├─ Safe point — label a reachable recorded moment
  ├─ Branch — preserve source and prepare an alternative
  ├─ Restore — append a reviewed earlier effect; no destructive rewind
  ├─ Correction — hand off to one record-bound Continuity item
  └─ Delete — separate lifecycle boundary

World Studio
  ├─ current playable World / R-03 / C-118 or C-119 context
  ├─ meaningful structure: motive / pressure / consequence
  ├─ R-04 Revision Review: Draft · not applied
  └─ Return to current playable World
```

### 2.3 Intended progressive sequence

The coherent product sequence is:

```text
play → understand immediate result → inspect when needed → recover when needed
     → shape future structure when desired → return to play
```

The current prototype presents this hierarchy correctly. Its integration defect is that the sequence cannot currently loop back into another Action after a record, and pending Action state does not survive a supporting-surface excursion.

## 3. Source / Baseline Reviewed

### 3.1 Frozen product and system inputs

- `docs/product/PRODUCT_PRINCIPLES.md`
- `docs/product/PRODUCT_DEFINITION_HANDOFF.md`
- `docs/product/PRODUCT_REQUIREMENTS.md`
- `docs/system-design/SYSTEM_DESIGN_HANDOFF.md`
- `docs/system-design/SYSTEM_DESIGN_V1.md`
- `docs/system-design/DOMAIN_STATE_AND_DATA_MODEL.md`
- `docs/system-design/RUNTIME_MODEL_AND_PERSISTENCE.md`
- `docs/system-design/API_SECURITY_AND_OPERATIONS.md`

### 3.2 Experience Structure inputs

- `EXPERIENCE_STRUCTURE_HANDOFF.md`
- `EXPERIENCE_STRUCTURE_V0.md`
- `CORE_USER_JOURNEYS_V0.md`
- `TEXT_WIREFRAMES_V0.md`
- `INTERACTION_STATES_V0.md`
- `OPEN_EXPERIENCE_DECISIONS_V0.md`
- `COMPONENT_OPPORTUNITY_MAP_V0.md`

### 3.3 Prototype evidence and current implementation

- P1/P2 exploration, focused refinement and Gate repair reports.
- P3 Recovery Lab exploration and report.
- P4 direction specification, approved direction, exploration, first independent Gate repair report, re-Gate evidence and Freeze report.
- Current code in `client/src/pages/Home.tsx`, `RecoveryLab.tsx`, `WorldStudio.tsx`, `index.css`, routing shell and Vite/Manus scaffold.
- Provenance commits `51000b1`, `e22551f`, `db1c119`, `bf04f52` and `bce8316`.

### 3.4 Runtime checks performed

- `corepack pnpm@10.4.1 run check` — **PASS**.
- `corepack pnpm@10.4.1 run build` — **PASS**, with known placeholder analytics warnings and unresolved `/manus-storage/...` build references.
- Desktop walkthrough at a 1440×1000 audit viewport.
- Responsive walkthrough at 390×844.
- Real UI interactions for Action, confirmation, Correction, Return, Recovery and Studio.
- URL, reload and browser Back checks.
- Initial, acknowledged, provisional, C-118, C-119, no-record, stale Restore and R-04 draft fixtures.
- Computed-style inspection of the Action Trace and runtime image availability.

No product or prototype code was changed during this audit.

## 4. Product & System Alignment

### 4.1 What remains aligned

| Frozen contract | Current experience expression | Result |
|---|---|---|
| Model output is an untrusted proposal until accepted. | `Possible outcome`, `Not recorded`, exact review and explicit rejection. | **PASS** |
| Only accepted Commit-like result becomes current truth. | `Recorded on your current path`, C-118/C-119 and a changed World scene. | **PASS** |
| A Correction supersedes current effect without deleting history. | C-119 applies; C-118 remains explicitly described as earlier history. | **PASS** |
| Branch preserves source. | Original and alternative are co-present; no merge/replacement is claimed. | **PASS** |
| Restore is non-destructive append, not rewind. | Preview and confirmation say a future transition would be appended and history retained. | **PASS** |
| Existing Continuity does not auto-adopt a new World Revision. | R-04 remains `Draft · not applied`; current Continuity remains R-03. | **PASS** |
| Model/creator work cannot change Participation Contract. | World Context says an ordinary Action cannot change the agreement; Recovery and Studio do not mutate it. | **PASS** |
| Explanation is scoped and privacy-preserving. | Lens shows fact/change, source class/record, scope, freshness and correction path; it explicitly excludes raw prompts and hidden reasoning. | **PASS** |

### 4.2 Material alignment failures

- **Acknowledged Action durability is not represented across surfaces.** The frozen Action model says received work is durable, idempotent and inspectable; the prototype says the user may safely leave and return. In the current combined component tree, entering another slice unmounts P1 and silently resets the Action to Ready.
- **The participation loop is incorrectly conditioned on absence of any current record.** `!world.currentRecord` controls the composer. A committed World therefore stops accepting future Actions, which contradicts the long-term continuity product objective.
- **“Keep proposal as draft” is not even session-local across the product transition.** The World Studio component owns the local draft state and is unmounted on Return; the acknowledgement therefore overstates what was retained.

The authority model is conceptually correct; the current view-level state ownership is not yet an honest integrated representation of it.

## 5. End-to-End Journey Findings

### A. First playable experience

`World → Action → received → possible outcome → direct confirmation → C-118 recorded → understand record` works and preserves the central distinction between possibility and current truth. Rejection and interrupted states explicitly leave the World unchanged.

**Finding:** the first Action journey passes in isolation. It fails to become a continuing product journey because C-118 removes the Action composer.

### B. Return journey

The C-119 Return view uses the same shared truth as World, gives a deliberately small three-item briefing and offers linked explanation plus one continuation point. It does not expose a raw transcript or become a dashboard.

**Finding:** Return reduces reconstruction cost and remains a projection rather than a second truth. `Continue at the lamp room` returns to the correct C-119 World, but the returned World cannot accept another Action.

### C. Correction journey

The C-118 Lens identifies what applies, why, where, freshness and scope. Direct confirmation creates the modeled C-119 state. World, Return, Lens, Recovery and Studio then all agree that the beacon is unlit, Maren is watching and C-118 remains earlier history.

**Finding:** the authoritative correction semantics pass. The C-119 Action Trace retains one residual “current action” sentence and has a visual legibility failure, but its underlying provenance data is correct.

### D. Recovery journey

Safe point, Branch, Restore, stale review, Correction handoff and Delete boundary were all exercised. The original is preserved, Restore remains append-oriented, stale review blocks application and Delete never masquerades as recovery.

**Finding:** Recovery comprehension passes. The modeled operations are appropriately honest about being prototype-only. Returning to World preserves C-119, but the next-Action bridge is absent.

### E. Creator journey

The World is visible before creator controls. Motive, pressure and consequence form one meaningful layer. R-04 is visually and verbally separated from current Continuity R-03. Optional depth is closed by default. Return remains available.

**Finding:** the Revision boundary passes. The cross-surface “Keep proposal as draft” promise fails because re-entering Studio shows no retained draft or acknowledgement.

### F. Cross-capability journeys

| Journey | Result | Evidence |
|---|---|---|
| Action recorded → Correction → Recovery → Branch → Return → Studio | **Partial** | Truth remains C-119 and boundaries remain correct; subsequent Action is unavailable. |
| Studio draft → Return → Continuity Lens → Recovery | **Partial** | Current truth remains correct; the “kept” Studio draft disappears when Studio is reopened. |
| Recovery → World → Action → Return Orientation | **FAIL** | C-118/C-119 causes Action composer count to be zero. |
| Acknowledged Action → Studio → World | **FAIL** | Received state disappears and Ready/Send Action reappears without resolution. |
| Provisional Action → Recovery → World | **FAIL** | Proposal disappears and Ready/Send Action reappears without an interrupted/resolved status. |

## 6. Cross-Surface Truth Matrix

| State | World | Action Trace | Return | Continuity Lens | Recovery | World Context | World Studio |
|---|---|---|---|---|---|---|---|
| **Initial** | Beacon unlit; Maren watching; no confirmed beacon change. | Action not sent; supporting boat observation only. | No confirmed change; enter World as it is. | No record to review/correct. | No recorded source; recovery intents unavailable except Delete boundary. | No current record; proposal cannot create one. | R-03 baseline; no R-04 proposal. |
| **Acknowledged** | World unchanged; one Action considered. | Action received; no world record. | Not modeled as a retained cross-surface state. | Current World still has no record. | Entering Recovery destroys the modeled acknowledged state. | No representation of pending durable Action. | Entering Studio destroys the modeled acknowledged state. |
| **Provisional** | Possible outcome displayed; World unchanged. | Possible impact considered; no record. | Not modeled as a retained cross-surface state. | No canonical beacon record yet. | Entering Recovery destroys the modeled proposal state. | No representation of pending proposal. | Entering Studio destroys the modeled proposal state. |
| **C-118 recorded** | Beacon lit; Maren waiting. | Action → world check → current C-118 result. | Lit beacon, Maren waiting, boat observation. | C-118 current record; correction available. | C-118 is current source; safe point and Branch available; no earlier Restore source. | Current record C-118. | Current Continuity R-03; C-118 applies; R-04 absent. |
| **C-119 corrected** | Beacon unlit; Maren watching; newer record applies. | Earlier Action/C-118 superseded; C-119 current. | C-119 fact and related Maren state; C-118 not current. | C-119 current; C-118 retained in details/history. | C-119 current; C-118 earlier Restore source; Branch/Correction boundaries intact. | Current record C-119. | R-03 with C-119 applies; current scene/history untouched by draft. |
| **Recovery context** | C-119 remains current outside the Lab. | No new record created. | No change unless a real future operation commits. | Correction handoff remains record-bound. | Safe point/Branch/Restore are modeled, not applied; stale blocks. | Current truth unchanged. | Unaffected. |
| **R-03 current revision** | Implicit playable definition. | Records apply within the current path. | Current path projection. | Facts/changes within current path. | Recovery changes the path, not the World definition. | Participation/current path context. | Explicit `Current Continuity R-03`. |
| **R-04 draft proposal** | Current World remains R-03/C-119. | No Action/Commit created. | No change. | No change. | No recovery operation created. | No change. | `Draft · not applied`; affects future scenes only. |

### Matrix verdict

Committed truth, history, Recovery and Revision boundaries are consistent. The hard failure is the lifecycle of **non-committed but acknowledged/provisional Actions** across surfaces. The prototype has one shared `WorldTruth`, but no shared `ActionTruth` or retained Studio draft state at the product-shell level.

## 7. Authority / Continuity / Revision Findings

### Authority

- User authority is never given to a model output.
- Direct confirmation names exact effects and retained scope.
- Studio does not mutate Participation Contract or current Continuity.
- Recovery does not silently choose source/effect after a stale review.
- Character stance is represented through Maren's expectations without writing user speech/action.

`AUTHORITY MODEL: PASS`

### Continuity

- C-119 supersedes rather than deletes C-118.
- World, Return, Lens, Recovery, Context and Studio project the same committed facts.
- Observation E-204 remains separate from the beacon decision.
- Explanation scope and privacy boundaries remain intact.

`CONTINUITY MODEL: PASS`

### Revision

- R-03 and R-04 remain separate.
- Draft/review language repeatedly states that current facts/history are untouched.
- Revision is not Branch, Restore or Correction.

The semantic model passes; the `Keep proposal as draft` state-retention claim does not.

`WORLD STUDIO / REVISION MODEL: ISSUE`

## 8. IA & Navigation Findings

### 8.1 Primary and secondary surfaces

- **Primary:** World and its Action lifecycle.
- **Entry state:** Return Orientation, not a permanent destination required during every session.
- **Contextual explanation:** Action Trace and a selected Continuity Lens.
- **Secondary:** Recovery Lab and World Studio, reachable from World Context; Studio also has a natural `Shape this world` entry.
- **Review/confirmation:** exact-effect dialog or inline Revision Review.
- **Prototype-only:** OBS 01/02/03/04.

This hierarchy is fundamentally sound. Recovery and Studio are discoverable without becoming permanent top-level mobile destinations.

### 8.2 OBS 01/02/03/04

OBS labels are unambiguously reviewer chrome. They should not be promoted into product IA. On desktop they remain the most visually persistent navigation and therefore make the literal runnable artifact look like four observations, even though product-like contextual routes now exist. On mobile only the active OBS label remains, but it still exposes internal slice naming.

**Classification:** `PROTOTYPE RESIDUE` and `POTENTIALLY HARMFUL IF MISTAKEN AS PRODUCT IA`.

### 8.3 World / Continuity / More

- `World` is the stable parent and current-play destination.
- `More` opens a coherent World Context sheet with current location, participation agreement, truth and two deeper destinations. It is not yet overloaded, but it should not become a generic settings catch-all.
- `Continuity` is under-defined as a persistent destination. In code it always opens the beacon Lens, while the desktop product-like path is contextual and has no equivalent primary destination. A real implementation needs an explicit contract: current selected fact, context-aware Lens, or a small Continuity index. That choice is still OED-05/OED-12 territory and must not be silently inherited from the beacon fixture.

### 8.4 Browser history

Surface transitions call `history.replaceState`. Studio receives a correct `slice=studio` URL and Return removes it, but browser Back from Studio goes to the prior external/blank history entry rather than the World. The same structural problem applies to Recovery and overlays that do not participate in history.

This is an **important navigation-state issue**, not a request for a production router.

## 9. Desktop / Mobile Findings

### What passes

- Both viewports preserve World-first reading order.
- Recovery and Studio have the same semantic responsibilities on both devices.
- Mobile reaches Studio and Recovery through visible product-like paths.
- Fixed navigation did not block the exercised Recovery/Studio/Return controls.
- Long warm documents and Studio review remain scrollable.
- Mobile does not remove truth, preservation, scope or proposal boundaries.

### What differs materially

- Desktop is dominated by OBS reviewer navigation; mobile uses the product-like World/Continuity/More model.
- Mobile marks World as active while Recovery, Studio or the More sheet is open. This can be read as intentional nesting under World, but it should be made explicit in later navigation design rather than inherited accidentally.
- The Continuity primary destination exists only on mobile and is hard-coded to the beacon Lens.

`MOBILE / DESKTOP PARITY: ISSUE` because the mental model is mostly shared but the persistent navigation contract is not yet the same product IA.

## 10. Terminology / Mental-Model Findings

| Term | First-use comprehension | Cross-surface consistency | Finding |
|---|---|---|---|
| World / path | Strong. | Stable across all slices. | Keep. |
| Current world record / current record | Understandable in context. | Overloaded across World, Recovery and technical details. | Minor simplification opportunity. |
| Action record | Reasonably clear. | Contains Action, possible check, World record and observation. | Needs care so it is not interpreted as the canonical World record itself. |
| Continuity / Continuity Lens | Lens purpose is clear after entry. | Persistent mobile `Continuity` destination has no defined landing contract. | Important IA wording/responsibility issue. |
| Correction | Strongly differentiated from Branch/Restore. | Consistent. | Keep. |
| Safe point | Plain-language and well explained. | Consistent. | Keep. |
| Branch / alternative | “Alternative” supports the more technical Branch term. | Consistent. | Keep layered wording. |
| Restore | Explicitly says not rewind. | Consistent. | Keep. |
| Revision / Draft / Proposal | Dense but appears only in Studio. | R-03/R-04 distinction is consistent. | Appropriate progressive vocabulary. |
| Commit | Hidden behind record details or prototype-result explanation. | Does not burden first layer. | Correct disclosure level. |
| Shared initiative / open structure | Plain language but not the frozen `Guided + Open-ended` labels. | No surface lets the participant inspect/change both axes. | Record as unresolved OED-02, not an authority violation. |

The terminology load is high in aggregate, but progressive disclosure prevents most users from encountering it at once. The main risk is not term count; it is ambiguous use of `record` and the undefined primary `Continuity` destination.

## 11. Progressive Disclosure Findings

The current hierarchy is one of the strongest parts of the experience:

1. World and scene first.
2. Action state only after acting.
3. provenance details only after `Understand` / `View record details`.
4. Recovery only after deliberate entry.
5. Studio only after a playable World exists.
6. advanced causal view remains optional and closed.

Technical concepts such as source class, Commit ID and permitted scope sit on the second Lens layer. Recovery semantics are introduced by user intent rather than a version-control diagram. Fieldbook structure does not replace the playable World.

The reverse risk—hiding authority—is also controlled: `World unchanged`, `Not recorded`, `Direct confirmation`, `current path`, preservation statements and `Draft · not applied` remain visible at the decision point.

`PROGRESSIVE DISCLOSURE: PASS`

## 12. Visual-System Findings

### Direction verdict

Quiet Observatory remains suitable as the foundation for the next formal UI phase. The dark World plane, moon-paper evidence plane, amber signal, restrained type hierarchy and field-document treatment consistently communicate:

- World presence before tooling;
- proposals versus recorded truth;
- explanation as a readable document rather than an AI console;
- Recovery and Studio as deliberate secondary work rather than SaaS dashboards.

Living Draft + Fieldbook clarity integrates successfully with P1–P3. P4 does not become a creator workspace or setup wizard.

### Material visual defect

The Action Trace reuses dark-rail colors inside the light `.context-panel`. Computed values include:

- panel background `rgb(240, 235, 225)`;
- trace title `rgb(217, 224, 224)`;
- committed trace title `rgb(207, 230, 215)`;
- trace copy `rgb(135, 150, 164)` at 10px.

The title and committed-state text are nearly indistinguishable from the paper. This makes earlier/current provenance difficult to read in exactly the trust surface that must clarify C-119 supersession.

### Known visual residue

The orbit mark returns `naturalWidth: 0` in an ordinary local clone because `/manus-storage/...` is not configured, producing a visible broken image. The hero uses a CSS fallback and remains usable. This is a minor reproducibility/polish issue already disclosed in the prototype README.

`VISUAL SYSTEM: ISSUE` because the direction passes but one critical information layer is visually broken.

## 13. Recovery ↔ Creator Boundary Review

The boundary is clear:

| Recovery | World Studio |
|---|---|
| Changes how the current path is preserved, branched, restored or corrected. | Proposes future World definition/structure. |
| Works from Commit/record context such as C-118/C-119. | Works from current World Revision R-03 toward draft R-04. |
| May create a future path transition after exact review. | Does not mutate an existing Continuity. |
| Correction repairs one current item. | Revision changes future creator-authored structure. |
| Branch creates an alternative causal path. | Revision creates a different reusable playable definition. |

Contextual labels, scope language and preserved/untouched sections prevent Branch, Restore, Correction and Revision from collapsing into “undo/edit.” No creator control crosses user participation authority.

`RECOVERY ↔ CREATOR BOUNDARY: PASS`

## 14. Trust / Explanation Review

### Passes

- current fact/change is shown before technical provenance;
- permitted source class/record ID, scope and freshness are available;
- C-118 history remains after C-119;
- correction path is contextual and exact;
- raw prompt, hidden retrieval, private context and model reasoning are explicitly excluded;
- P3/P4 do not add leaking explanation fields.

### Issues

- Action Trace provenance is visually unreadable on the light sheet.
- The trace introduction still says `This follows the current action` in C-119 even though the Action is labelled earlier/superseded.
- The prototype says acknowledged work can be safely left and resumed, but cross-surface navigation silently resets it.

`TRUST / EXPLANATION: ISSUE`

## 15. Failure / Stale / Interrupted Findings

| Condition | Current behavior | Verdict |
|---|---|---|
| Interrupted proposal | Says check did not finish, nothing recorded; Retry/Discard offered. | **PASS in-slice** |
| Confirmation cancel | Leaves World unchanged. | **PASS** |
| No recorded point | Return and Recovery explicitly say no record exists; recovery intents are unavailable. | **PASS** |
| Stale Restore | Blocks application and requires renewed review. | **PASS** |
| Correction cancel | Leaves C-118 unchanged. | **PASS** |
| Studio draft not applied | R-04 remains `Draft · not applied`; R-03/C-119 stays current. | **PASS** |
| Return with no meaningful changes | Shows current harbor and an `Enter world as it is` path. | **PASS** |
| Leave acknowledged/provisional Action for another surface | Action state silently disappears. | **BLOCKER** |
| Keep Studio draft, return, reopen Studio | Draft silently returns to empty despite “kept locally.” | **IMPORTANT** |

The product's language for “did not happen” is otherwise unusually consistent and strong.

## 16. Prototype Residue Inventory

| Residue | Classification | Handling boundary |
|---|---|---|
| OBS 01/02/03/04 tabs and `Prototype exploration` header | Potentially harmful if mistaken as product IA | Keep only for audit/testing; remove from production experience. |
| `fixture`, `slice`, `stage`, `lens`, `recovery` query parameters | Useful only for prototype testing | Retain as fixture mechanism only; do not promote as public product contract. |
| In-memory `WorldTruth`, C-118/C-119 and R-03/R-04 fixtures | Safe to carry into Implementation Planning as acceptance scenarios | Replace with authoritative/runtime contracts; do not copy component ownership. |
| `/manus-storage/...` assets and storage proxy | Manus-specific environment dependency | Must be removed, vendored with provenance or replaced before production implementation. |
| Manus runtime/debug collector and `.manus-logs` behavior | Useful only for Prototype testing | Must not be copied into production architecture by default. |
| Large unused UI scaffold, Map, ManusDialog, hooks and component inventory | Scaffold residue | Do not treat as selected production component system or scope. |
| ErrorBoundary rendering raw stack text | Developer/debug behavior | Must not be a production user experience. |
| Placeholder analytics environment tokens | Scaffold/build residue | Resolve or remove during production planning; not an Experience requirement. |
| P4 direction demos, ideas and todo | Design provenance | Preserve as archive/reference, not current product IA. |
| Static operation acknowledgements | Comprehension fixtures | Do not claim durable effect unless implementation has authoritative confirmation. |

## 17. Implementation Handoff Readiness

### What is sufficiently defined

- surface responsibilities for World, Return, Lens, Trace, Recovery and Studio;
- current truth versus generated/proposed output;
- history and supersession;
- direct confirmation boundaries;
- Recovery intent and preservation semantics;
- World Revision versus Continuity;
- stale-head need and no-silent-merge behavior;
- privacy-preserving explanation fields;
- which content can be local UI versus must be durable/authoritative.

### State class implied by the experience

| Experience state | Required implementation character |
|---|---|
| Text input, open/closed Lens, review disclosure | Local UI state. |
| Generated outcome before acceptance | Non-authoritative proposal; recoverable by Action status. |
| Received Action | Durable, idempotent, inspectable and safe across navigation/reconnect. |
| Current C-118/C-119 fact/relationship state | Server-authoritative committed state. |
| History and supersession | Durable append-only/auditable state. |
| Return and Lens summaries | Rebuildable projections with freshness/source status. |
| Safe point / Branch / Restore / Correction | Explicit authoritative operations with stale-head and confirmation handling. |
| R-04 Studio draft | User-owned draft state, durable enough to honor the chosen keep/save contract. |
| R-04 adoption into an existing Continuity | Not currently authorized; separate future workflow. |

### Why handoff is not yet ready

A new team would still have to invent or correct four experience contracts:

1. how an acknowledged/provisional Action remains visible and resolvable while the user visits support surfaces;
2. how the World reopens a next Action after every committed result;
3. what `Keep proposal as draft` guarantees across navigation/session boundaries;
4. what the persistent mobile Continuity destination means when no single fact has been selected.

These are product-experience semantics, not API design. They should be repaired/decided before Implementation Planning consumes the prototype as a frozen baseline.

`IMPLEMENTATION HANDOFF READINESS: ISSUE`

## 18. Adversarial Findings

| Reviewer perspective | Attack attempted | Result |
|---|---|---|
| New user | Confuse possible prose with current truth. | Prototype resists successfully through repeated `World unchanged` / `Not recorded`. |
| Long-term return user | Continue after orientation and act again. | **Fails:** current record removes the Action composer. |
| Play-only user | Avoid Studio/Recovery complexity. | Passes; both remain secondary/contextual. |
| Deep creator | Find meaningful structure and future impact. | Passes the core path; advanced depth intentionally remains deferred. |
| Mis-operation user | Treat Branch/Restore/Correction/Delete as one undo. | Prototype resists successfully through intent and preservation wording. |
| AI-skeptical user | Verify source/scope without private reasoning. | Semantics pass; Action Trace contrast weakens verification. |
| Mobile-only user | Reach Recovery/Studio and return. | Passes reachability; Continuity landing and active-nav semantics remain under-defined. |
| Keyboard-heavy user | Complete core buttons/dialogs. | Native controls are keyboard reachable, but focus trap/return/Escape behavior is incomplete. |
| Interrupted user | Leave after Action receipt and later resolve status. | **Fails:** Action state resets after a cross-surface excursion. |
| Creator returning to kept draft | Expect local kept state on re-entry. | **Fails:** draft/notice disappear. |

## 19. Simplification Opportunities

These are not defects and should not be repaired as part of the required integration fix unless separately chosen.

1. **Reduce visible uses of `record`.** Keep `current world record` for the plain-language layer; reserve Commit/record ID for details; consider a different label for the multi-stage Action Trace.
2. **Treat World Context as a bridge, not a destination taxonomy.** Its current content is coherent. Future additions should use contextual entries rather than turning More into an all-purpose drawer.
3. **Make Continuity contextual by default.** A selected fact/change Lens may be simpler than a permanent global database-like Continuity home; if a home is required, keep it small and orientation-led.
4. **Retire OBS chrome before user-facing validation.** It is useful for reviewers but materially biases the “one product” question.
5. **Keep R-03/R-04 identifiers secondary.** The current natural-language proposal/current distinction should remain primary.
6. **Avoid duplicating current-state statements.** World, Context and Return should each answer a different intent rather than repeat the same summary.

## 20. Full Issue Register

### BLOCKER

| ID | Finding | Evidence | User/product impact | Minimum repair boundary |
|---|---|---|---|---|
| OEA-B01 | Acknowledged/provisional Action is silently lost across supporting surfaces. | Send Action → received; enter Studio/Recovery; Return; received/proposal state is gone and `Send action` returns. `P1Action` owns stage locally and is unmounted by view change. | Violates Action Truth, durable acknowledgement and recoverable return. The user cannot trust whether submitted work exists. | Retain one shell-level Action status across surface navigation and show an explicit unresolved/resolved state on return; no backend required for the prototype repair. |
| OEA-B02 | A committed/current record permanently suppresses the next Action entry. | `!world.currentRecord` gates composer/status/proposal. C-118/C-119 World has zero Action composer/textbox. Return → World and Recovery → World cannot proceed to another Action. | Breaks the core long-term play loop and requested cross-capability journeys. | Separate “there is current history” from “there is an Action in progress”; permit a new Action after a committed result while keeping the record inspectable. |

### IMPORTANT

| ID | Finding | Evidence | User/product impact | Minimum repair boundary |
|---|---|---|---|---|
| OEA-I01 | Browser Back/history does not reflect product surface navigation. | Surface changes use `replaceState`; World → Studio → browser Back reached `about:blank` in the audit tab. | Navigation trap; URL/view correctness only holds when using bespoke Return buttons. | Define push/replace policy for page-like secondary surfaces and close/back policy for overlays; verify enter/Back/refresh/re-enter. |
| OEA-I02 | Action Trace provenance is visually unreadable on moon paper. | Dark-rail colors are reused in `.context-panel`; titles are near-white on `#f0ebe1`, 9–11px. | Damages the C-119 trust/provenance explanation and accessibility sanity. | Add context-sheet-specific trace colors and verify current/earlier/superseded hierarchy in desktop/mobile. |
| OEA-I03 | `Keep proposal as draft` does not retain the draft after Return/re-entry. | Acknowledgement says `R-04 proposal kept locally`; Return → Shape this world shows `Add this structure to draft` and no status. | Prototype honesty failure; “keep” is indistinguishable from temporary acknowledgement. | Either retain the draft at shell/session level or narrow the copy/action so it does not promise retention. |
| OEA-I04 | Persistent mobile `Continuity` has no defined product landing contract and hard-codes the beacon Lens. | `onLens={() => openLens("beacon")}`; desktop uses contextual Lens entries rather than a primary Continuity destination. | Future team must invent selection/landing behavior; device mental models can diverge. | Decide contextual-current-item versus small Continuity landing behavior under OED-05/OED-12; preserve scope/privacy rules. |

### MINOR

| ID | Finding | Evidence | Impact / handling |
|---|---|---|---|
| OEA-M01 | C-119 Action Trace intro says it follows `the current action` although the Action is earlier/superseded. | Trace body correctly says `Earlier action`; intro remains generic. | Small provenance contradiction; align copy during the Trace repair. |
| OEA-M02 | Ordinary clone shows a broken orbit mark and lacks the two Manus-hosted visual assets. | Brand image `naturalWidth: 0`; README documents environment-specific paths. | Visual polish/reproducibility only; use provenanced local asset or robust non-image fallback later. |
| OEA-M03 | Overlay/dialog focus management is incomplete. | No focus trap/restore or Escape handling; Lens/Context are visually modal but not expressed as modal surfaces. | Accessibility hardening; core controls remain keyboard reachable. |
| OEA-M04 | `record` vocabulary carries several roles. | Action record, current world record, current record and Commit ID appear across the flow. | Learnable with disclosure, but merits comprehension testing and possible vocabulary reduction. |

### OBSERVATION

- Return's first two “changes” are one corrected fact and its character-state implication. This is defensible causal orientation, but should be tested across less tightly coupled examples.
- World remains highlighted in the mobile primary nav while Studio/Recovery/More is open. This can correctly signal that they are nested World capabilities; later UI should make the nesting intentional.
- The Studio scene headline is atmospheric and static while the fact copy changes with C-118/C-119. Facts remain correct; later content design should avoid poetic headlines that appear to contradict state.
- Current Return, Lens and Context projections use one shared fixture, so no committed-state contradiction was found.

### FUTURE HARDENING

- Full WCAG contrast, screen-reader order, focus return/trap, Escape/backdrop behavior and touch-target review.
- Real long-wait, reconnect, duplicate-submit, offline and multi-tab tests once an authoritative runtime exists.
- User comprehension validation for OED-01 through OED-12, especially Participation Contract cadence and Continuity vocabulary.
- Production asset provenance, font loading, graceful image failure and analytics/runtime cleanup.

### NON-ISSUE / INTENTIONAL

- No real backend/database/persistence/model runtime exists; this is not counted as an audit failure.
- Restore and Branch do not actually mutate state; the prototype explicitly labels the modeled result.
- Studio does not publish or adopt R-04; this is the correct current scope.
- Recovery and Studio are not permanent mobile nav items; contextual discovery is appropriate.
- Goal-framed structure and advanced causal visualization remain optional/deferred.
- P1/P2/P3/P4 approved slice conclusions remain valid despite the combined integration issues.

## 21. Experience Freeze Recommendation

`READY FOR EXPERIENCE FREEZE: NO`

Do not redesign the product and do not reopen the approved slice semantics. Before Freeze, perform one narrow integration repair round covering OEA-B01, OEA-B02 and OEA-I01 through OEA-I04, plus the four minor items where they naturally overlap. Then run one focused overall re-gate using these exact journeys:

1. acknowledged Action → Studio/Recovery → World → same Action status;
2. C-118/C-119 World → new Action → proposal → cancel/confirm;
3. Return → World → new Action → Return;
4. Studio keep draft → World/Lens/Recovery → Studio → retained or honestly non-retained state;
5. World → Studio/Recovery/Lens → browser Back/refresh/re-enter;
6. C-119 Action Trace at desktop and 390×844;
7. mobile Continuity entry with the newly declared landing/context rule.

After those repairs, the existing Product/System/Experience contracts are strong enough to support Experience Freeze without new research or a broad redesign.

## Final Status

```text
OVERALL EXPERIENCE AUDIT: FAIL

PRODUCT PROMISE COHERENCE: ISSUE
PRODUCT / SYSTEM ALIGNMENT: ISSUE
END-TO-END JOURNEYS: ISSUE
CROSS-SURFACE TRUTH: ISSUE
AUTHORITY MODEL: PASS
CONTINUITY MODEL: PASS
RECOVERY MODEL: PASS
WORLD STUDIO / REVISION MODEL: ISSUE
INFORMATION ARCHITECTURE: ISSUE
MOBILE / DESKTOP PARITY: ISSUE
NAVIGATION STATE: ISSUE
TERMINOLOGY / MENTAL MODEL: ISSUE
PROGRESSIVE DISCLOSURE: PASS
VISUAL SYSTEM: ISSUE
TRUST / EXPLANATION: ISSUE
PROTOTYPE HONESTY: ISSUE
IMPLEMENTATION HANDOFF READINESS: ISSUE

BLOCKERS: 2
IMPORTANT: 4
MINOR: 4

P1/P2/P3/P4 APPROVED BASELINES STILL VALID: YES

READY FOR EXPERIENCE FREEZE: NO
READY FOR IMPLEMENTATION PLANNING: NO
```

## Final Three Questions

### 1. Does Simulora now feel like one product rather than four prototypes?

**NO — not yet in the literal combined runnable artifact.**

The underlying product promise, truth model, recovery/revision boundaries and Quiet Observatory visual language are coherent. However, persistent OBS chrome, lost pending Action state and the dead post-record participation loop expose the fact that the slices are still mounted as separate observations rather than one continuous product lifecycle.

### 2. Can the user always understand current truth, possibility, history, recovery and future World Revision?

**NO — the committed-state distinctions are excellent, but “always” fails across transitions.**

While a user remains within a slice, the answer is effectively yes: C-119 is current, C-118 is history, Recovery is preservation-oriented and R-04 is a future proposal. Across surfaces, an acknowledged/provisional Action disappears and a “kept” draft disappears, so the product no longer gives an honest account of what still exists.

### 3. Can a new Implementation Team start planning without reinventing product logic?

**NO — most semantics are ready, but four integration contracts still require experience decisions.**

The team would not need to reinvent Action/Commit, Continuity, Correction, Branch, Restore or Revision semantics. It would still have to invent pending-Action navigation behavior, the recurring Action loop, draft-retention meaning and the Continuity primary-entry contract. Those should be resolved before the Experience baseline is frozen and handed to Implementation Planning.

