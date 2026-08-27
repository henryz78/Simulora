# App Runtime State Migration — visible-UI planning note

**Inspection time:** 2026-08-25 10:02–10:03 (+08:00)  
**Identity:** Owner `idakellams159`  
**Route inspected:** `https://worldos.cc/apps/create`  
**Write status at this point:** No App, World, installation, Simulation, save, or publish action has been performed in this Task 3 branch.

The normal visible App Studio UI exposes an HTML editor, a `Configure` panel, a visible `Built-in instructions for AI` field, and an `Initial data (JSON)` textarea. The Tutorial states that installed Apps are read and written by the world AI every turn according to built-in instructions, while Initial data is the default data for a world. This establishes only that JSON seed and AI instructions can be entered through visible UI.

It does **not** yet establish that all requested shapes can be mutated through visible runtime App controls, that exact key omission can be expressed in a published version, or that App runtime data has a documented direct client-side API. The next step is to create a single plainly named `MANUS-P3-MERGE-*` test App whose visible UI explicitly renders its app data and offers narrowly scoped visible controls. If such controls cannot safely express the specified shape, null, omission, or type-conflict transitions, the corresponding matrix cells will be recorded as `UI_SCHEMA_LIMITATION` rather than inferred.

**Evidence screenshot:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-03-44_7258.webp`.

## P3 App v1 creation and publication

A single normal-UI App Studio draft was created with slug `manus-p3-merge-runtime-edge` and name `MANUS-P3-MERGE-RUNTIME-EDGE`. The studio-generated visible inspector renders `window.WS.state` as JSON and has two normal visible buttons, **Dirty A v1** and **Clean B v1 no-op**; its generated code uses the App Studio-provided `window.WS.onUpdate` and `window.WS.sendAction` integration. No browser storage, hidden endpoint, or direct state mutation was used by the test process.

The v1 Initial data (JSON) visible in Configure contained the required primitive no-ID array, no-ID object array, duplicate-ID array, scalar, object, null, nested object, and audit object. The published App page is `https://worldos.cc/apps/manus-p3-merge-runtime-edge`. Its normal visible page showed Owner `idakellams159`, `0 worlds use this`, an Edit control, Delete control, Install control, and live demo buttons. App Studio visibly displayed the feedback: `Published, but for now in ONE language only ...`; this is a publication feedback note, not a functional limitation for this test.

Evidence: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-06-54_6745.webp` for successful publication; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-07-21_4791.webp` for the public App page.

## World creation modal boundary

At `https://worldos.cc/worlds`, the normal visible Create a World modal was opened. A third-party template card was momentarily selected in the modal but **no Copy, Remix, Build, submit, creation, or modification action** was performed while it was selected. The subsequent visible selection is the **Blank Canvas** card. No World has yet been created and no third-party World has been changed. The next intended action is the visible `Build it myself` path for this Blank Canvas only.

## World creation blocker — stop boundary

The normal visible World builder route `https://worldos.cc/worlds/create` was available and exposed Basics, Apps, Instructions, a required cover-image upload, and a disabled `Create world` action. A generated original cover file exists locally at `/home/ubuntu/worldos_p3_evidence/manus_p3_merge_world_cover.jpg` (2560×1440; no text or third-party branding). The browser’s normal Upload button was activated. However, the corresponding file-input element was not surfaced by the interactive UI inventory. Two targeted normal upload attempts (visible Upload button index and one subsequent associated-input index) returned `Node is not a file input element`; no file was uploaded and no World was created.

Because the cover is explicitly marked **Required**, creating a World without it would be a false success. Per the three-attempt/stop boundary, the P3 Task 3 World-install/runtime portion is recorded as `TOOLING_BLOCKED` at this prerequisite. No App was installed into a World; no Simulation A/B was created; no runtime apply, reload, merge, deletion, type conflict, or version migration result is asserted. The existing published v1 App remains the only remote Task 3 P3 asset at this point.

**Relevant screenshots:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-09-29_5177.webp`, `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-11-15_6433.webp`, `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-11-15_6433.webp`.
