# Map System

Status: `PARTIAL / TESTED`

Map library aggregates map-enabled Worlds rather than independent top-level Map objects. `用此地图` can create a new World copy or target an existing World. Creator Map App includes region drawing/ownership/settings/search/zoom/markers/factions/shared attributes and point/region modes. Runtime drawers expose faction, attributes, neighbors, free text, shortcuts, Advisor and copy name; actions enter Turn engine and synchronize Story/Map/Wallet/Inventory/Quest/Stats.

Evidence: EVD-0028, EVD-0030, EVD-0090, EVD-0091, EVD-0244, MANUS-P3-MAP-001–002 (external).

## Current library behavior (EVD-0244)

`/maps` is a client-local catalog with `有底图 / 全部 / 我的`, a title/creator search and 36 single-select genre controls. The default Base-map catalog pages silently in groups of 16 with no loader/end copy. The primary `x161880` snapshot terminated at 1,083 cards; an independent Manus account/session later retained terminal HTML containing 1,085 Base cards. Exact totals are therefore catalogue snapshots, not stable product invariants. My currently returns four owner Map Worlds in the primary sample; search and genre intersect it and expose `暂无地图`. Reload clears scope/query/genre back to Base-map/All. Every card binds the Map to a source World and exposes same-page image preview, source link, separate new-tab World link and `用此地图`; there is no independent Map detail route.

The image preview is a real zoom/pan viewer: `+/-` change scale, drag changes position, and Close returns to the same catalog state. Use-this-map is a two-stage workflow. Existing-World selection exposes `全部 / 仅底图 / 仅区域`, then writes one ordinary Map App into the target Draft and says a new World version is required. In the tested build the successful `装入并编辑` commit remained on `/maps`, so navigation text and actual result diverge.

New-World creation is also split: `TEST Map Library New 0244` immediately became a public v1 with only Main Input/Story, while the chosen 47-region/two-faction Map existed in an unpublished v2 Draft. Attempting `发布 v2` produced `封面图为必填项。`; v1's generated letter placeholder did not satisfy the later publish gate. Implementations seeking parity must model public base-World creation, cover validation and Map-Draft publication as separate boundaries, including the temporary public no-Map state.

## External Base/All catalogue snapshot (MANUS-P3-MAP-001)

Manus Phase 3 preserved fully rendered terminal HTML and structured CSVs for a second logged-in account. Independent local recomputation found Base=1,085 unique World hrefs and All=1,181, with intersection 1,085, All-only 96, Base-only 0 and no repeated-href rows. In that session `全部` was therefore a strict superset of `有底图`, not a synonym. Genre snapshots also differed: 动漫 272/334, 科幻 54/57, 恋爱 92/140, while DnD was 0/0.

This evidence is strong for rendered membership at the captured time. It does not identify hidden Map IDs, backend completeness, ranking cause or eligibility rules. The two-card difference from primary EVD-0244 is retained as `CONTRADICTORY_SNAPSHOT`; possible time/account/session/terminal-procedure causes remain UNKNOWN.

## Existing-World install semantics

Evidence `EVD-0090` verifies that `用此地图` can target an owned existing World and opens that World's Creator `#app-map` draft. The target is shown at `发布 v2` and contains one Map App after installation. Installing the WWII source (`484` regions, `62` factions) replaced the target map definition rather than appending a second Map App. The dialog offers three explicit import scopes: all (base + regions/factions), base only, or regions/factions only. EVD-0125 later closes the publication/runtime boundary: mixed Map v4 publishes normally, an old save applies it at zero Turn while preserving unrelated state, and a fresh v4 save initializes the same Map composition.

The Map editor modal itself has separate view/ownership/draw/settings modes, region search/zoom/reset, faction list editing, operations, markers and shared attributes. `保存并退出` only returns to the draft Creator. A display-name/custom-instruction edit did not survive reload in one test, so field-specific draft persistence remains `UNKNOWN` (EVD-0091).

## Published mixed-map propagation

EVD-0125 verifies the complete World-version boundary. The mixed Map published as World v4 only after reducing the Draft from 11 to the 10-App maximum; the final publish attempt, rather than Map import, is where over-limit validation occurred. An existing v1 Simulation received the normal update modal and applied v4 without a Turn, preserving unrelated Story/Character/Chat/Wallet/Inventory/Time state while replacing Movie with Map and initializing Three Kingdoms ownership plus Garrison/Supplies. A fresh v4 Simulation started directly with the same Map composition. Immediate `/maps` discovery still omitted the World, so catalog indexing/eligibility remains separate and UNKNOWN.
