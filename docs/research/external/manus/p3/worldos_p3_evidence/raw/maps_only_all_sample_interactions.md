# Only-All Sample Interaction Log

This log records only bounded, visible UI actions on the Maps page. For each selected sample: preview is opened and closed; the visible World-detail link is opened and navigated back; `用此地图` is opened only to the first dialog layer and then cancelled. No installation, creation, modification, Map Creator, World Builder, or Simulation action is performed.

## Sample 01 — 2030：第三次世界大战

- **Identity:** `/worlds/2030-po-sui-zhi-xu-2fb77c`; creator `Kate Lee`; selection ordinal 1.
- **Search:** Entered exact visible title in Maps search at 10:34:01 (+08:00). The filtered single card visibly matched the exact title, creator, and href.
- **Preview:** Clicked `查看大图` at 10:34:08 (+08:00). A visible overlay appeared with title `2030：第三次世界大战`, instruction `拖拽平移 · 右下角 +/- 缩放`, close control, and zoom controls. **Status: CONFIRMED.**
- **Preview screenshot:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-34-08_4684.webp`.
- **Preview close:** Clicked visible close control at 10:34:27 (+08:00); the overlay closed and the filtered map card returned. **Status: CONFIRMED.**
- **World-detail trigger and visit:** Clicked the card's visible `查看这个世界` anchor at 10:34:35 (+08:00); its target-new-tab behavior did not show a foreground switch in the available browser view, so that click is recorded as **TRIGGERED** rather than as visible navigation. The same already-observed public href was then opened in the foreground at 10:34:47, showing the exact title, creator `Kate Lee`, the `🗺️` map indicator, and World-detail controls. **Foreground detail accessibility: CONFIRMED.** Detail screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-34-47_6727.webp`.
- **Return:** A keyboard back attempt did not visibly navigate; normal browser history navigation then returned at 10:35:39 (+08:00) to `/zh-cn/maps`. **Return: CONFIRMED.** The Maps page restored the `全部` scope but reset the search field and visible catalog to its initial loaded state, so the exact title will be entered again before the remaining first-layer test.
- **Scope restoration boundary:** Re-entering the exact title immediately after browser return yielded `暂无地图`; clicking the visible `全部` scope control at 10:36:25 restored the exact single filtered sample card. The brief no-result state is therefore treated as a post-return scope restoration artifact, not a membership reversal.
- **Use-map first layer:** Clicked `用此地图` at 10:36:50 (+08:00). A first-layer popover visibly offered an editable proposed new-world name, `新建并编辑`, and the two existing P2 worlds `MANUS-P2-IDX-WORLD-RENAMED` and `EXT-GIFT-20260825-0455`. No selection was made. **First layer: CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-36-50_3021.webp`.
- **Cancel:** Pressed Escape at 10:36:58 (+08:00); the popover closed and the filtered card remained. **Cancel: CONFIRMED.** No World was selected, no new World was created, and no Map was installed or modified.
- **Sample outcome:** **CONFIRMED** for preview and its closure, foreground World-detail accessibility, first-layer `用此地图` display, and cancellation; the direct card-detail click itself remains **TRIGGERED** because its target-new-tab foreground navigation was not observable.

## Sample 02 — 博人传：新时代

- **Identity:** `/worlds/boruto-next-generations-bisa`; creator `Jincox03`; selection ordinal 2.
- **Search and disambiguation:** Entered the visible title at 10:37:19 (+08:00), producing its 14 matching visible cards. The exact selected href was located using the rendered card list: it was the seventh result, displayed as `博人传：新时代` / `Jincox03` / `/zh-cn/worlds/boruto-next-generations-bisa` (preview index 83, detail index 84, use index 86 in that fresh view). This avoids treating title-only matching as identity.
- **Preview:** Clicked that exact card’s `查看大图` at 10:37:31 (+08:00). A visible map overlay appeared with title `博人传：新时代`, mapped labels including `Konoha`, `Clan Hyūga`, and `Bosque`, plus the visible pan/zoom instruction. **Status: CONFIRMED.** Preview screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-37-31_5002.webp`.
- **Preview close:** A first Escape did not close this multi-card preview; the visible overlay close control was then clicked at index 117 at 10:38:22 (+08:00), returning to the 14-card result list. **Close: CONFIRMED.**
- **World detail:** The exact card link was clicked at 10:38:46 (+08:00), yielding a **TRIGGERED** status because its target-new-tab behavior did not foreground-navigate. The observed public href was then opened in the foreground at 10:38:57. The detail page visibly showed the exact title, creator `Jincox03`, and a `🗺️` map indicator. **Foreground detail accessibility: CONFIRMED.** Detail screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-38-57_8233.webp`.
- **Return:** Browser history returned to `/zh-cn/maps` at 10:39:36 (+08:00) with the query cleared and initial visible cards. The `全部` scope must be explicitly selected again before the same title can be re-located; this is the same post-return UI-state boundary observed for Sample 01.
- **Use-map first layer:** After re-entering the title and explicitly reselecting `全部`, the same seventh card’s `用此地图` was clicked at 10:40:10 (+08:00). Its first-layer popover visibly offered the proposed new World name, `新建并编辑`, and the two pre-existing P2 Worlds, without any selection being made. **First layer: CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-40-10_8718.webp`.
- **Cancel:** Pressed Escape at 10:40:29 (+08:00), closing the first-layer popover while retaining the matching cards. **Cancel: CONFIRMED.** No existing World was selected; no World was created; no map was installed or modified.
- **Sample outcome:** **CONFIRMED** for preview and closure, foreground World-detail accessibility, first-layer `用此地图` display, and cancellation. The initial card-detail click remains **TRIGGERED** rather than foreground-navigation-confirmed because it targets a new tab.

## Sample 03 — 博人传：新时代

- **Identity and preview:** Exact selected card `/worlds/boruto-next-generations-efvz`, creator `Daniel-ff0688`, visibly rendered as the fourth same-title result. Its `查看大图` was clicked at 10:41:03 (+08:00), producing the map overlay with labels such as `Konoha`, `Ninja Academy`, and `Watch Grounds`; this is **CONFIRMED**. Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-41-03_4700.webp`.
- **Close:** The overlay close control (index 117 in the fresh 14-card view) was clicked at 10:41:10 (+08:00), returning to the list. **CONFIRMED.**
- **World-detail trigger:** Clicked the exact card link at 10:41:32 (+08:00). As with the earlier cards, foreground navigation did not transfer because the link targets a new tab; this step is therefore **TRIGGERED** rather than foreground-detail **CONFIRMED**.
- **Use-map first layer:** Clicked the exact card’s `用此地图` at 10:41:40 (+08:00). The first-layer new-or-existing World chooser is visibly open, with no destination selected. **CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-41-40_2900.webp`.
- **Cancel:** Pressed Escape at 10:41:53 (+08:00); the chooser closed. **CONFIRMED.** No existing World was selected, no new World was created, and no map was installed or modified.
- **Sample outcome:** **CONFIRMED** for preview/close and first-layer display/cancel; **TRIGGERED** for the exact visible World-detail card link, with no separate foreground detail visit for this sample.

## Sample 04 — 维多利亚吸血鬼模拟器

- **Identity and preview:** Exact selected card `/worlds/crimson-op82`, creator `flor`, visibly rendered as the second of four matching cards. Its `查看大图` was clicked at 10:42:23 (+08:00), opening a map overlay with visible labels `梅菲尔区`, `摄政区`, `白教堂区`, `南岸区`, and `郊区外围`. **Preview: CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-42-23_8204.webp`.
- **Close and detail trigger:** Closed the preview at 10:42:45 (+08:00), then clicked the exact visible World-detail link at 10:43:01 (+08:00). **Preview close: CONFIRMED. Detail link: TRIGGERED**; foreground navigation was not separately verified because this visible card link opens a new tab.
- **Use-map first layer and cancel:** Clicked the exact card's `用此地图` at 10:43:16 (+08:00); the visible first-layer chooser offered the proposed new World name, `新建并编辑`, and the two existing P2 Worlds. Pressed Escape at 10:43:22 (+08:00), closing it. **Both states: CONFIRMED.** No existing World was selected, no new World was created, and no map was installed or modified.
- **Sample outcome:** **CONFIRMED** for preview/close and first-layer display/cancel; **TRIGGERED** for the exact visible World-detail link, with no separate foreground-detail visit.

## Sample 05 — DC 宇宙

- **Identity and preview:** The exact unique card `/worlds/dc-universo-w64s`, creator `Yania marcela`, was returned by the visible title search. Its `查看大图` was clicked at 10:43:47 (+08:00), opening a map overlay with `Gotham City`, `Metropolis`, and `Central City`. **Preview: CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-43-47_4976.webp`.
- **Close and detail trigger:** Closed the preview at 10:44:05 (+08:00), then clicked the exact visible World-detail link at 10:44:13 (+08:00). **Preview close: CONFIRMED. Detail link: TRIGGERED**; no separate foreground visit is claimed for its new-tab target.
- **Use-map first layer and cancel:** Clicked `用此地图` at 10:44:27 (+08:00), revealing the first-layer new-or-existing World chooser; pressed Escape at 10:44:35 (+08:00) to close it. **Both states: CONFIRMED.** No existing World was selected, no new World was created, and no map was installed or modified.
- **Sample outcome:** **CONFIRMED** for preview/close and first-layer display/cancel; **TRIGGERED** for the exact visible World-detail link, without a separate foreground-detail visit.

## Sample 06 — 日本高中模拟器2018

- **Identity and preview:** The title search rendered 33 same-title cards. The exact target `/worlds/japanese-high-2l6e` (creator `Fisiajgdjqosiwiand`) was the eighth visible result, distinguished from two other cards by that creator using the fully rendered href. Its preview (index 87) was opened at 10:45:18 (+08:00), showing visible labels including `屋上`, `教室`, `体育馆・泳池`, `学生会室`, `校门`, `警察署`, and `隧道`. **Preview: CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-45-18_5255.webp`.
- **Close and detail trigger:** Closed the preview at 10:45:38 (+08:00), then clicked the exact target card’s visible World-detail link at 10:45:52 (+08:00). **Preview close: CONFIRMED. Detail link: TRIGGERED**; it remained a target-new-tab link and no foreground-detail visit is claimed.
- **Use-map first layer and cancel:** Clicked the exact target's `用此地图` at 10:46:08 (+08:00), visibly opening the new-or-existing World chooser, then pressed Escape at 10:46:19 (+08:00). **Both states: CONFIRMED.** No existing World was selected, no new World was created, and no map was installed or modified.
- **Sample outcome:** **CONFIRMED** for preview/close and first-layer display/cancel; **TRIGGERED** for the exact visible World-detail link, without a separate foreground-detail visit.

## Sample 09 — 日本高中模拟器2018

In the 33-card title result list, card action indices advance in groups of four. Index 111 is the fourteenth card’s preview, namely the exact target `/worlds/japanese-high-mdzm` (creator `Go kitty go!`), not Sample 07’s preceding `/worlds/japanese-high-5214`. The resulting preview was opened at 10:46:32 (+08:00) and closed via its visible close control (index 189 in the fully rendered search view) at 10:46:45 (+08:00). **Preview and close: CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-46-32_3265.webp`.

Remaining bounded steps: trigger Sample 09’s exact detail link, open and cancel its first-layer `用此地图` chooser without selecting or creating.

For Sample 09, the exact visible World-detail link (index 112) was triggered at 10:47:25 (+08:00); as a target-new-tab action, this is **TRIGGERED** rather than foreground-detail confirmed. The exact card’s `用此地图` control (index 114) was opened at 10:47:40 (+08:00), visibly presenting the first-layer new-or-existing World chooser. No destination was selected and no new World was created. Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-47-40_7834.webp`.
For Sample 09, Escape closed the still-open first-layer `用此地图` chooser at 10:48:03 (+08:00). **Cancel: CONFIRMED.** No existing World was selected, no new World was created, and no map was installed or modified. **Sample outcome:** preview/close and first-layer display/cancel **CONFIRMED**; exact detail link **TRIGGERED** without a separate foreground-detail visit.

## Sample 07 — 日本高中模拟器2018

The exact target `/worlds/japanese-high-5214` (creator `Go kitty go!`) is the thirteenth rendered title-match card, immediately before the separately sampled `/worlds/japanese-high-mdzm`. Its preview was opened at 10:48:20 (+08:00) and closed with the visible close control at 10:48:34 (+08:00). **Preview and close: CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-46-32_3265.webp`. Remaining bounded steps: trigger exact detail link; open and cancel first-layer `用此地图` with zero selection or creation.
For Sample 07, the exact visible detail link (index 108) was triggered at 10:48:55 (+08:00). Its `用此地图` chooser was visibly opened at 10:49:02 (+08:00), then cancelled with Escape at 10:49:07 (+08:00). **First-layer display and cancel: CONFIRMED; detail link: TRIGGERED.** No existing World was selected, no new World was created, and no map was installed or modified. Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-49-02_6621.webp`.

## Sample 08 — 星空高中仓鼠交换

The exact unique card `/worlds/japanese-high-cuo0`, creator `mery angela`, was returned by visible search. Its preview was opened at 10:49:42 (+08:00), showing labels `屋上`, `教室`, `体育馆・泳池`, `操场`, `学生会室`, `商店街`, `警察署`, and `隧道`, then closed at 10:49:48 (+08:00). **Preview and close: CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-49-42_9807.webp`. Remaining bounded steps: trigger exact detail link and open/cancel `用此地图` first layer without selection or creation.
For Sample 08, the exact visible detail link was triggered at 10:50:02 (+08:00), and `用此地图` first-layer chooser was opened at 10:50:08 (+08:00) then cancelled with Escape at 10:50:14 (+08:00). **Preview/close and first-layer display/cancel: CONFIRMED; detail link: TRIGGERED.** No existing World was selected, no new World was created, and no map was installed or modified. Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-50-08_4564.webp`.

## Sample 10 — 宝可梦（帕希欧）

Visible search returned two same-title cards. The exact target `/worlds/pok-mon-passio-xlq0`, creator `rin phonny (Ririn)`, was the second card. Its preview was opened at 10:50:38 (+08:00), showing `Pasio`, `Galar`, `Kanto`, `Alola`, `Hoenn`, `Johto`, `Sinnoh`, `Kalos`, `Unova`, and `Paldea`. **Preview: CONFIRMED.** Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-50-38_6794.webp`. Remaining bounded steps: close preview, trigger the exact detail link, open/cancel `用此地图` first layer without selection or creation.
For Sample 10, the preview was closed at 10:51:00 (+08:00), and the exact visible detail link was triggered at 10:51:07 (+08:00). **Preview close: CONFIRMED; detail link: TRIGGERED** (new-tab target; no separate foreground-detail visit claimed).
For Sample 10, the exact card’s `用此地图` first-layer chooser was opened at 10:51:23 (+08:00) and cancelled with Escape at 10:51:30 (+08:00). **First-layer display and cancel: CONFIRMED.** No existing World was selected, no new World was created, and no map was installed or modified. **Sample outcome:** preview/close and first-layer display/cancel **CONFIRMED**; exact detail link **TRIGGERED** without a separate foreground-detail visit. Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-51-23_3028.webp`.

## Ten-sample completion boundary

All ten deterministic only-`全部` samples have now had the permitted first-layer UI sequence completed: visible preview → close; exact visible World-detail link trigger; `用此地图` first-layer display → Escape cancel. No final install, World selection, World creation, modification, Simulation, or Map Creator entry was performed.
