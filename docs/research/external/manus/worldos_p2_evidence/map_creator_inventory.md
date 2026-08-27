# Map Creator Availability Inventory

**Directory route:** `https://worldos.cc/maps`  
**Identity:** Owner `idakellams159`  
**Observed at:** browser filenames `2026-08-25_07-07-25` / `07-07-39` (UTC-style); Shanghai-equivalent times `2026-08-25T15:07:25+08:00` / `15:07:39+08:00`.

## Normal UI observations

| Entry / action | Visible result | Classification |
|---|---|---|
| Public Maps directory | Maps are presented as reusable artefacts to `Start a world from a map — spin up a new one, or drop it into a world you own.` Each public card provides `Enlarge`, source World route, and `Use map`. | Directory works; this is a map-consumption flow, not a creator flow. |
| Global Create menu | Only World, Character and App creator entries were visible in the normal navigation. | No Map Creator entry exposed. |
| Maps → Mine | Owner’s `Mine` filter completed with explicit `No maps yet`; no `Create map`, `New map`, upload, editor, or membership wall was rendered. | **CREATOR_ENTRY_NOT_EXPOSED_IN_FREE_UI**. |

> No route was guessed and no existing third-party map was edited or used. No membership paywall was actually displayed, so this is **not** labelled `MEMBERSHIP_BLOCKED`; the remaining Map Creator field/autosave/publish matrix is **UNKNOWN / NOT APPLICABLE FROM OBSERVED FREE ENTRYPOINT** pending a normal exposed creator route.

**Evidence:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-07-25_9361.webp`; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-07-39_2914.webp`; `/home/ubuntu/page_texts/worldos.cc_maps.md`.
