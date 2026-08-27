# Maps Catalog Set-Difference Run Log

**Identity:** `idakellams159`  
**Session:** Same logged-in browser session for both scopes  
**Route:** `https://worldos.cc/zh-cn/maps`  
**Task constraints:** browse / scroll / preview / World detail / first-layer use dialog / cancel only; no install, World creation, modification, Map Creator or Simulation.

## Base-map scope — initial

- **Timestamp:** 2026-08-25 10:19:18–10:19:39 (+08:00)
- **Selected scope:** `有底图` (visible scope button at page entry; `全部` and `我的` also visible).
- **Visible initial card count:** 16. The first sixteen repeated card groups each expose **查看大图**, a World-detail link, and **用此地图**.
- **Initial visible cards include:** 鬼灭之刃模拟器; 二战模拟器; 三国模拟器; 权力的游戏模拟器(冰与火之歌); 《精灵宝可梦·万象旅途》; 现代世界 2026; 咒术回战世界-更多人物，更高自由！; 宝可梦 🔴; ⚔️ 中世纪生活 ⚔️; DC宇宙; 中世纪奇幻模拟器; 冷战模拟器; 十字军之王3; 主播女孩重度依赖; 历史模拟器：崇祯; 鬼灭模拟器：鬼之视角.
- **Visible genre controls:** 全部、历史、战争、策略、政治、架空历史、跑团、DnD、奇幻、冒险、科幻、异世界、生存、动漫、同人、恋爱、校园、当代、抓马、搞笑、悬疑、恐怖、侦探、相爱相杀、娱乐圈、病娇、职场、商业、穿越、耽美、暗黑恋爱、修仙、百合、ABO、韩娱、运动.
- **Screenshots:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-19-18_1595.webp`; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-19-18_1595.webp`.
- **Saved rendered HTML:** `/home/ubuntu/browser_html/worldos_cc_maps_1787653180545.html`.
- **Boundary:** At this initial point, no card action was triggered and no inference about no-base-map behavior was made.

## Base-map scope — first visible scroll

At 10:20:04 (+08:00), one normal page scroll was performed. The viewport moved below the initial grid and visibly revealed additional map cards beyond the initial sixteen, including 1985：苏维埃危机、₊˚‧ 索尼克世界 ˚.、鬼灭之刃、吻，吻，留堂、中世纪奇幻RPG世界、恋上救生员、一战模拟器、侦探之心、勇敢新世界：2020、战国模拟器、十字军之王：法兰西、权力的游戏：血龙狂舞、上古卷轴：龙裔、降世神通：最后的气宗、蝙蝠家族大冒险 and 三国浮生录·列女传. This confirms normal append behavior is still active. No terminal condition is asserted. Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-20-04_4805.webp`.

The required current-card count, append count, scroll height, scroll position, and loader state will be obtained only from the rendered page after each normal visible scroll. No network request, hidden endpoint, storage inspection, or backend identifier is used.

Rendered-page measurement after the first scroll (10:20:32 +08:00): `uniqueWorldHrefs=32`, `worldHrefAnchors=64` (two anchors per visible card), `scrollY=962`, `scrollHeight=3601`, `viewportHeight=1100`, `loaderTextPresent=false`. This is a DOM measurement of the already visibly rendered page, not a network or storage access. Last currently rendered hrefs: `/zh-cn/worlds/a-game-of-thrones-dance-of-the-dragons-bqve`, `/zh-cn/worlds/the-elder-scrolls-v-skyrim-h1n2`, `/zh-cn/worlds/avatar-la-leyenda-de-aang-0eet`, `/zh-cn/worlds/batfamily-adventures-1j9v`, `/zh-cn/worlds/three-kingdoms-otome`.

## Base-map scope — append 2

After a normal visible scroll-to-current-end at 10:20:58 (+08:00), the rendered Map grid increased from 32 to **48 unique World hrefs** (96 World-link anchors, again two per card). The page measured `scrollY=2501`, `scrollHeight=4996`, `viewportHeight=1100`, and no visible loader text. The observed last href was `/zh-cn/worlds/los-juegos-del-hambre-lbgd`. This is an **append** stage, not terminal.

## Base-map scope — sequential-scroll timeout recovery

A sequential low-frequency visible-scroll helper exceeded the browser action's 30-second execution ceiling before it could return its planned stage array. It was not retried. A fresh visible page check at 10:22:15 showed `pixels above viewport=50194`, `pixels below viewport=1394`, and a screenshot was saved as `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-22-15_5586.webp`. The immediately following rendered-DOM measurement at 10:22:29 recorded `uniqueWorldHrefs=752`, `worldHrefAnchors=1504`, `scrollY=68044`, `scrollHeight=70538`, `viewportHeight=1100`, no visible loader text, last href `/zh-cn/worlds/modern-day-2026-cwan`. This is confirmed partial completion (from 48 to 752 during visible sequential scroll), **not** a terminal conclusion; the remaining lower-page distance required a short segmented continuation.

## Base-map scope — visible bottom baseline

A fresh visible bottom check at 10:23:52 established `pixels below viewport=0`; terminal screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-26-31_4258.webp`; rendered HTML snapshot: `/home/ubuntu/browser_html/worldos_cc_maps_1787653433922.html`. The immediately following rendered-page measurement at 10:24:06 gives `uniqueWorldHrefs=1085`, `worldHrefAnchors=2170`, `scrollY=100349`, `scrollHeight=101449`, `viewportHeight=1100`, `atBottom=true`, `loaderTextPresent=false`, final href `/zh-cn/worlds/dc-universe-5f34`. This is the base count for the three required no-growth bottom re-scroll checks; it is not itself one of the three checks.

## Base-map scope — delayed bottom append

For no-growth check 1, the page was normally scrolled up one viewport (10:24:26) and then back to its current end (10:24:35). The screenshot output transiently reported `pixels below viewport=804`; however, the immediately subsequent direct rendered-page measurement (10:24:50) found the same `uniqueWorldHrefs=1085`, `worldHrefAnchors=2170`, `scrollY=100349`, `scrollHeight=101449`, `pixelsBelow=0`, `loaderTextPresent=false`, final href `/zh-cn/worlds/dc-universe-5f34`. The exact DOM measurement is the controlling record: **append=0 / no-growth check 1 of 3 confirmed**. No terminal conclusion is made until checks 2 and 3 also show no growth.

For no-growth check 2, the page was normally scrolled up one viewport (10:25:09) and back to its current end (10:25:16). The browser's screenshot metadata again transiently reported `pixels below viewport=727`; the controlling rendered-page measurement at 10:25:29 found `uniqueWorldHrefs=1085`, `worldHrefAnchors=2170`, `scrollY=100349`, `scrollHeight=101449`, `pixelsBelow=0`, `atBottom=true`, `loaderTextPresent=false`, final href `/zh-cn/worlds/dc-universe-5f34`. **append=0 / no-growth check 2 of 3 confirmed.**

For no-growth check 3, a normal one-viewport upward scroll was performed at 10:25:51. The browser reported `pixels above viewport=100207`, `pixels below viewport=142`; it then returned to current bottom at 10:26:31. Although the browser screenshot metadata transiently showed `pixels below viewport=737`, the controlling rendered-page measurement at 10:26:38 found `uniqueWorldHrefs=1085`, `worldHrefAnchors=2170`, `scrollY=100349`, `scrollHeight=101449`, `pixelsBelow=0`, `atBottom=true`, `loaderTextPresent=false`, final href `/zh-cn/worlds/dc-universe-5f34`; **append=0 / no-growth check 3 of 3 confirmed.** Terminal screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-26-31_4258.webp`.

**Base-map scope terminal state:** **CONFIRMED** for this same logged-in visible-UI run. The terminal rendered set contains **1,085 unique stable World hrefs** (2,170 repeated World anchors, i.e., two per card). Three consecutive normal bottom re-scrolls yielded zero additional unique hrefs. The 1,085 count is a rendered-card-catalogue observation at run time, not a claim about all backend records or Map IDs.

### Base-map structured export

`/home/ubuntu/worldos_p3_evidence/MAP_BASE_CARDS.csv` was generated from the terminal browser-saved rendered HTML (`/home/ubuntu/browser_html/worldos_cc_maps_1787653433922.html`). It contains 1,085 card rows, 1,085 unique observed World hrefs, zero repeated href rows, and 91 titles that correspond to more than one distinct href. Each row retains observed order, title, creator, observed and locale-normalized href, preview-image presence/source, and the three rendered actions. `visible_genre_tag=NOT_DISPLAYED` is a display-field observation: inspected card markup showed no card-local genre label. Extraction metadata is saved at `raw/maps_base_extraction_metadata.json`; this process only parsed the browser-captured visible page and did not access any server endpoint, storage, or hidden IDs.

## All scope — initial

At 10:28:20 (+08:00), the visible scope control `全部` was clicked from the same still-authenticated `idakellams159` browser session. No Map, World, Simulation, creator flow, or installation was opened. The visible page returned to its top and showed 16 initial card groups. The rendered-page measurement at 10:28:26 confirms `allScopeActiveButtonCount=1`, `uniqueWorldHrefs=16`, `worldHrefAnchors=32`, `scrollY=0`, `scrollHeight=2206`, `viewportHeight=1100`, no visible loader text. First four hrefs were `/zh-cn/worlds/demon-slayer-simulator`, `/zh-cn/worlds/ww2-1935`, `/zh-cn/worlds/sanguo-warlords`, `/zh-cn/worlds/westeros`. Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-28-20_6688.webp`.

### All scope — 20-step visible-scroll segment 1

A sequential low-frequency browser-visible scroll sequence performed 20 end-of-current-content steps, with a one-second wait after each step. The rendered card set increased by exactly 16 unique World hrefs on every step, from 16 to **336**. The 20 resulting counts were: 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272, 288, 304, 320, 336. Loader-text detection was false at each measurement. The final segment measurement was `scrollY=29276`, `scrollHeight=31771`, `loaderTextPresent=false`. This records visible scrolling and already-rendered DOM only; it is not an endpoint, storage, or API operation. The active append behavior confirms the all-scope catalogue had not reached terminal state.

### All scope — 20-step visible-scroll segment 2

The next 20 sequential one-second end-of-current-content scroll steps each appended exactly 16 unique World hrefs, increasing the rendered set from 336 to **656**. Counts after each step were: 352, 368, 384, 400, 416, 432, 448, 464, 480, 496, 512, 528, 544, 560, 576, 592, 608, 624, 640, 656. Loader-text detection remained false at every measurement. Segment final: `scrollY=59119`, `scrollHeight=61613`, `loaderTextPresent=false`; thus this scope remains actively appendable and nonterminal.

### All scope — 20-step visible-scroll segment 3

A third sequence of 20 sequential one-second end-of-current-content scroll steps again appended exactly 16 unique World hrefs on every step, moving from 656 to **976**. Counts: 672, 688, 704, 720, 736, 752, 768, 784, 800, 816, 832, 848, 864, 880, 896, 912, 928, 944, 960, 976. No loader text was detected. Segment final: `scrollY=88683`, `scrollHeight=91456`, `loaderTextPresent=false`; the catalogue remains appendable and no terminal status is claimed yet.

### All scope — terminal segment and no-growth confirmation

The fourth 20-step sequential visible-scroll segment appended 16 hrefs on steps 1–12 (to 1,168), appended a final partial batch of 13 hrefs on step 13 (to **1,181**), and then recorded **append=0** on each of steps 14–20. The final seven zero-growth stages all measured `uniqueWorldHrefs=1181`, `scrollY=109274`, `scrollHeight=110374`, `viewportHeight=1100` (therefore at page bottom), and `loaderTextPresent=false`. The first three of those seven sequential zero-growth bottom scrolls satisfy the required three-consecutive-no-growth terminal condition; the remaining four provide redundant corroboration. No terminal-specific text was displayed. Thus the All scope terminal state is **CONFIRMED** for this same logged-in visible-UI run: **1,181 unique rendered stable World hrefs** / 2,362 repeated World anchors. The 1,181 count is a visible-catalogue observation at run time, not a claim about all backend records or Map IDs.

### All-scope structured export and set result

Terminal screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-31-31_3115.webp`; terminal rendered HTML: `/home/ubuntu/browser_html/worldos_cc_maps_1787653893171.html`. The corrected property-tolerant card extractor exported `/home/ubuntu/worldos_p3_evidence/MAP_ALL_CARDS.csv` with 1,181 rows and 1,181 unique stable World hrefs; there were zero repeated-href rows, and 103 same-title/different-href title groups. The extractor recognizes the visually equivalent `查看大图` control when rendered through `title`, `aria-label`, or visible tooltip attributes. The corrected export matches the rendered-page terminal count exactly.

The href-only set comparison is saved in `MAP_SET_DIFFERENCE.csv`, with same-title/different-href and repeated-href records in `MAP_DUPLICATES.csv`. Results: intersection=1,085; only-All=96; only-base=0; base repeated href occurrences beyond first=0; all repeated href occurrences beyond first=0. Membership is solely a terminal visible-card href result; a World href in only-All is **not** interpreted as a backend claim about a Map ID or any hidden map property.

### Genre comparison 1 — DnD (sparse)

- `全部` scope: selected visible `DnD` filter at 10:52:03 (+08:00); the UI immediately rendered `暂无地图`, with no cards visible. Count: 0.
- `有底图` scope: kept the same visible `DnD` filter and selected `有底图` at 10:52:10 (+08:00); the UI again rendered `暂无地图`, with no cards visible. Count: 0.
- Difference (all minus base): 0. This direct empty-state pair is terminal without scrolling; status: **CONFIRMED** as visible UI observation.

### Genre comparison 2 — 动漫 (high-volume candidate), base side in progress

At 10:52:43 (+08:00), the visible filter was changed from `DnD` to `动漫` while the `有底图` scope remained active. The initial rendered view contained 16 card groups. A normal visible scroll-to-current-end was then performed at 10:53:00 (+08:00); it visibly produced additional card rows and therefore did not establish a terminal count. Screenshot evidence: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-52-43_2012.webp` and `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-53-00_1315.webp`.
A second normal visible scroll-to-current-end for `有底图＋动漫` was performed at 10:53:36 (+08:00). The rendered grid visibly added further rows beyond the prior 32-card state, so this is still an append stage and not a terminal conclusion. Screenshot: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-53-36_7489.webp`.
A low-frequency visible-scroll sequence then advanced the already-rendered `有底图＋动漫` catalogue ten times, observing these unique-href totals after each current-end scroll: 64, 80, 96, 112, 128, 144, 160, 176, 192, 208. Each step appended 16 hrefs; the final state was `scrollY=17283`, `scrollHeight=20056`, `viewportHeight=1100`, with 1,673 pixels still below the viewport. Therefore this high-volume subset remained nonterminal at 208 cards.
A second ten-step low-frequency visible-scroll sequence for `有底图＋动漫` produced counts 224, 240, 256, 272, then 272 for six additional current-end scrolls. The final stable state was `scrollY=24765`, `scrollHeight=25865`, `viewportHeight=1100`, `pixelsBelow=0`. The first three of the six final zero-growth steps satisfy the three-consecutive-no-growth terminal rule. **Base-side terminal count: 272 unique rendered World hrefs (CONFIRMED).**
For the `全部＋动漫` side, visible scope switch occurred at 10:54:58 (+08:00) and initial rendered count was 16. Twelve subsequent low-frequency visible-scroll steps produced totals 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, and 208; each added 16 cards. The last state had `scrollY=17283`, `scrollHeight=20056`, and 1,673 pixels below viewport, so no terminal claim is made.
The second `全部＋动漫` visible-scroll sequence produced totals 224, 240, 256, 272, 288, 304, 320, 334, followed by 334 for four further current-end scrolls. Final state: `scrollY=30623`, `scrollHeight=31723`, `viewportHeight=1100`, `pixelsBelow=0`. The first three zero-growth steps satisfy the terminal rule. **All-side terminal count: 334 unique rendered World hrefs (CONFIRMED).** The scoped visible-card difference is `334 − 272 = 62` (all minus base); this reports current UI catalogue membership only, not any hidden Map record property.

### Genre comparison 3 — 科幻 (typical), all side

At 10:56:26 (+08:00), the visible filter was set to `科幻` while `全部` remained active. Ten low-frequency visible current-end scrolls yielded unique-href totals 32, 48, 57, then 57 for seven additional scrolls. Final UI state was `scrollY=4684`, `scrollHeight=5784`, `viewportHeight=1100`, `pixelsBelow=0`; the first three zero-growth checks meet the terminal rule. **All-side terminal count: 57 (CONFIRMED).**
For the `有底图＋科幻` side, ten low-frequency visible current-end scrolls yielded 32, 48, 54, then 54 for seven further scrolls. Final state: `scrollY=4405`, `scrollHeight=5505`, `viewportHeight=1100`, `pixelsBelow=0`; the first three zero-growth checks satisfy the terminal rule. **Base-side terminal count: 54 (CONFIRMED).** The scoped visible-card difference is `57 − 54 = 3` (all minus base), without any inference about hidden Map IDs or state.

### Genre comparison 4 — 恋爱 (typical), base side

At 10:57:33 (+08:00), the visible filter was set to `恋爱` while `有底图` remained active. Ten low-frequency visible current-end scrolls yielded unique-href totals 32, 48, 64, 80, 92, then 92 for five further scrolls. Final state: `scrollY=8031`, `scrollHeight=9131`, `viewportHeight=1100`, `pixelsBelow=0`; the first three zero-growth checks satisfy the terminal rule. **Base-side terminal count: 92 (CONFIRMED).**
For the `全部＋恋爱` side, visible scope switch occurred at 10:58:04 (+08:00). Twelve low-frequency visible current-end scrolls yielded 32, 48, 64, 80, 96, 112, 128, 140, then 140 for four further scrolls. Final state: `scrollY=12494`, `scrollHeight=13594`, `viewportHeight=1100`, `pixelsBelow=0`; the first three zero-growth checks satisfy the terminal rule. **All-side terminal count: 140 (CONFIRMED).** The scoped visible-card difference is `140 − 92 = 48` (all minus base). This completes the required sparse/high-volume/two-typical genre comparisons using visible filters only.

## Task 4 completion boundary

The terminal `有底图`/`全部` collections, href-only set difference, fixed-seed ten-sample non-writing UI sequence, and four genre comparisons are complete. Final deliverables are `MAP_BASE_CARDS.csv`, `MAP_ALL_CARDS.csv`, `MAP_SET_DIFFERENCE.csv`, `MAP_DUPLICATES.csv`, `MAP_ONLY_ALL_SAMPLE_SELECTION.csv`, `MAP_ONLY_ALL_SAMPLE_INTERACTIONS.csv`, `MAP_ONLY_ALL_SAMPLE_INTERACTIONS.md`, `MAP_GENRE_COMPARISON.csv`, and `MANUS_P3_MAP_CATALOG_DIFF.md`. No Map installation, World selection, World creation, map modification, Simulation entry, or Map Creator entry occurred in Task 4.
