# MANUS P3 — Asset & Cleanup Manifest

**Recorded:** 2026-08-25 (+08:00)  
**Owner session:** `idakellams159`  
**Rule:** A remote asset is recorded as **CLEANED** only where normal visible UI supplied both a deletion path and post-action verification. Required terminal states are limited to **CLEANED**, **ALREADY_ABSENT**, **CLEANUP_BLOCKED**, or **RETAINED_FOR_EVIDENCE + reason**.

## Final disposition register

| Task | Asset | Identity / URL | Final state | Normal-UI evidence and reason |
|---|---|---|---|---|
| 3 | Published P3 App v1 | `MANUS-P3-MERGE-RUNTIME-EDGE`; `https://worldos.cc/apps/manus-p3-merge-runtime-edge` | **CLEANED** | Owner App page visibly showed `0 worlds use this` and a Delete control. The normal confirmation dialog stated `Delete this app? This cannot be undone.`; its final Delete button was clicked at 11:02:46. The UI returned to App Market, then the original public URL visibly rendered `404 This page could not be found` at 11:02:55. |
| 3 | Intended P3 World | `MANUS-P3-MERGE-WORLD-*` | **ALREADY_ABSENT** | World creation never crossed the required cover-upload prerequisite; no World URL was created. |
| 3 | Intended Simulation A | Fresh dirty runtime fixture | **ALREADY_ABSENT** | Could not exist without the absent P3 World and App installation. |
| 3 | Intended Simulation B | Fresh clean runtime fixture | **ALREADY_ABSENT** | Could not exist without the absent P3 World and App installation. |
| 3 | App v2–v5 versions | Runtime migration updates | **ALREADY_ABSENT** | They were not published; no corresponding remote App versions exist. |
| 3 | Local World-cover fixture | `manus_p3_merge_world_cover.jpg` | **RETAINED_FOR_EVIDENCE — local-only, never uploaded** | Original benign 16:9 cover used to document the visible upload-tooling blocker. It is not a remote WorldOS asset. |
| 2 | A T20 checkpoint branch | `MANUS-P3-A-T20-Memory-Baseline`; `https://worldos.cc/sim/f9302cfd-9c74-44d7-bb5c-c28a22430a24` | **CLEANUP_BLOCKED** | On the branch itself, normal visible Settings exposed no delete control. Its visible Saves list showed only `New chat` plus chat/Checkpoint links, with no delete/remove action. Details likewise supplied no branch deletion control. No hidden route or unsafe workaround was attempted. |
| 2 | Sample A original Character chat | `https://worldos.cc/sim/fa53cd75-4e45-4812-993f-d83c08423626` | **RETAINED_FOR_EVIDENCE — bounded transcript and no safe visible deletion path established** | It is a user-owned chat based on a third-party public Character, not a third-party Character modification. The task ended after its tooling block; deleting it would be unrelated to a specifically surfaced P3 asset-delete flow. |
| 2 | Sample B Character chat | `https://worldos.cc/sim/6062b6fa-f28c-4406-ac79-3092e05f8f29` | **RETAINED_FOR_EVIDENCE — bounded transcript and no safe visible deletion path established** | It contains the only confirmed T20-to-T35 Memory/edit/reload/recall evidence. No direct deletion control was established through normal UI, and no further Character exploration was undertaken. |
| 1 | Task 1 controls fixtures | No separate `MANUS-P3-CONTROLS-*` remote asset | **ALREADY_ABSENT** | The ledger deliberately created no dedicated controls World, Character, App, or Collection. |
| 4 | P3 Maps asset | No P3 Map created | **ALREADY_ABSENT** | Task 4 only browsed third-party catalogue cards and performed non-writing preview/detail/first-layer-cancel interactions. |

## Verification evidence

| Evidence | Path | Role |
|---|---|---|
| Owner App page before delete | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_11-02-24_7553.webp` | Shows Owner identity, 0 worlds use this, and visible Delete control. |
| App delete confirmation | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_11-02-35_1605.webp` | Shows the explicit irreversible-delete dialog and final Delete control. |
| App post-confirmation navigation | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_11-02-46_3763.webp` | Shows return to App Market after final confirmation. |
| App direct URL validation | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_11-02-55_8417.webp` | Shows public P3 App URL rendering 404. |
| P3 checkpoint branch and Settings | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_11-03-05_5436.webp`; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_11-03-13_7399.webp` | Establishes direct branch identity and visible Settings control set. |
| P3 checkpoint Saves list | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_11-03-20_3124.webp` | Shows named checkpoint row but no delete/remove action. |
| P3 checkpoint Details | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_11-03-33_7717.webp` | Confirms Details view did not surface a branch deletion control. |

## Cleanup conclusion

The sole safely deletable owned P3 remote asset, the zero-use App v1, is **CLEANED** with visible confirmation and a direct-URL 404 verification. The intended Task 3 World and all dependent runtime assets are **ALREADY_ABSENT**. The named Task 2 checkpoint is **CLEANUP_BLOCKED** because its ordinary visible UI did not offer deletion. The two Character chats are **RETAINED_FOR_EVIDENCE** with the stated reasons. No cleanup status relies on an unconfirmed action.
