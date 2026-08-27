# Map Lifecycle / Relationships

研究状态：`TESTED / VERIFIED`（Creator/Published/Simulation、既有 World 装入、选择性替换与 v4 新旧存档传播已补）

## Library

- `/zh-cn/maps` 不是独立 Map 对象编辑器列表，而是从 Worlds 中聚合的地图资源目录。
- Tabs：`有底图 / 全部 / 我的`；支持搜索与大量 World categories。
- 每张地图卡片同时关联一个 World，提供：查看大图、打开 World、新标签页查看、用此地图。
- Search is same-page filtered. Searching the title of the test World whose published version contains no Map returns `暂无地图`; `我的` also returns `暂无地图` despite owning that World and a map-containing Creator Draft. Thus Library/My is based on published usable Map assets, not simply ownership of a World with a Map Draft/editor.
- EVD-0244 primary snapshot: Base-map starts at 16 and silently pages to a 1,083-card terminal; there is no loader/end copy. Search matches title and creator, intersects scope/genre and stays client-local; reload restores Base-map/All and clears the query. Preview `+/-` and drag are functional.
- Manus external terminal HTML/CSV snapshot: Base=1,085 and All=1,181 unique World hrefs, with intersection=1,085, All-only=96 and Base-only=0. The count difference from EVD-0244 means exact totals are time/account/session snapshots; the durable product conclusion is that All can be a strict superset of Base, not that either total is fixed.

## Use This Map

点击 `用此地图` 打开 dialog：

- 默认路径：`用此地图新建世界`，预填来源 World 标题，按钮 `新建并编辑`；
- 第二路径：`或装入现有世界`，列出当前账号 World；
- 文案明确：新建会带入整张地图，稍后可在 World 编辑器调整。

因此 Map 在平台层更像 World 的可复制/可安装地图资产，而不是完全独立于 World 的顶级内容对象。

### New-World publication split (EVD-0244)

- `新建并编辑` with `TEST Map Library New 0244` created a stable World slug and opened its Creator.
- The direct detail was already public as v1, but contained only Main Input and Story; it did not yet contain the chosen Map.
- The Creator simultaneously showed an unpublished `发布 v2` draft with the 47-region/two-faction Map App.
- `发布 v2` was rejected with `封面图为必填项。`; the auto-created v1's generated letter placeholder does not satisfy the next-version cover gate. Final publication is currently `BLOCKED_BY_FILE_PICKER`.
- Map-driven World creation therefore first publishes a base v1 and separately stages the selected Map for v2. This temporary externally visible state is part of the black-box lifecycle, not an assumed race.
- Existing-World All import into `TEST Template World 001` succeeded and produced the same 47/2 Map Draft, but `装入并编辑` remained on `/maps`; the success signal was a toast, not navigation.

### Existing-World install / replacement

- 来源 `二战模拟器` 装入既有 `TEST Map Install Audit 001` 后，精确跳转到目标 slug 的 Creator `#app-map`，目标显示 `发布 v2` 和未发布草稿。
- 目标仍只有一个 Map App；来源地图的 `484 个区域 · 62 个阵营`、阵营角色化、`Attack`/`Defend` 等定义出现在该唯一 Map App 中。现有地图定义未与来源并列保留，因此当前证据支持“替换/覆写 Map definition”，不支持“追加第二张地图”。
- 对话框的范围模式为：`全部`（底图 + 区域/阵营）、`仅底图`（地形底图，不带区域）、`仅区域`（区域与阵营，不带底图）。
- 字段级实验进一步证明这是 Map definition 内部的选择性覆写，而不是三个 UI 文案而已：
  - 目标原 Map 为 `47 区域 / 2 阵营`，阵营 `Demons` / `Demon Slayer Corps`，操作 `Patrol` / `Hunt demons`；装入二战地图的 `仅底图` 后这些区域、阵营与操作完整保留。
  - 随后对同一 Draft 装入三国地图的 `仅区域`，Map 变为 `61 区域 / 13 阵营`，并带入三国的四个地区操作和 `Garrison` / `Supplies` 共享属性。由于该模式不带底图，结果是“二战底图 + 三国区域/阵营配置”的混合定义。
  - 两次安装后目标仍只有一个 Map App，说明各范围替换单一 Map definition 的不同子结构；`全部`则同时替换两组。
- Maps 现有 World selector 的 `有地图` badge 不是完整存在性信号：本次目标未显示 badge，但 Creator 中明确已有 47/2 Map definition。
- 这些安装先只改变 Draft；后续 v4 实验已完成 World Publish、既有存档应用更新和 fresh v4 save，见下文。

### Mixed Map v4 publish and propagation

- `TEST World 001` 的 mixed definition 最终以 v4 发布，版本标题 `Mixed Map WW2 Base + Three Kingdoms Regions`。
- Draft 在 Map 导入后可暂时拥有 11 个 Apps，但最终 Publish 提交才 toast `Worlds hold up to 10 apps`；卸载 Movie 降到 10 个后发布成功。这是 publication-bound validation，不是 Draft install-bound validation。
- 旧 v1 save 打开后收到 v4 更新 modal；应用更新保持 Turn 0、Story、角色状态/Chat、Wallet、Inventory、Time，同时移除 Movie、加入 Map，并获得三国 ownership、Garrison/Supplies region state。
- fresh v4 save `/zh-cn/sim/05ac8dda-b534-415b-94aa-74ffa3378c00` 直接以 10 App composition 启动，Map 在 Turn 0 可见，Movie 不存在，并读取同一 61/13 ownership/attributes。
- 发布后立即在 `/maps` 精确搜索 `TEST World 001`，默认和 `我的` 都返回 `暂无地图`。因此 World/Simulation 可用性先于或独立于 Map catalog；是异步索引还是 retained base 不符合 catalog eligibility 仍 `UNKNOWN`。
- Evidence: EVD-0125.

### Map Editor controls / save edge

`打开地图编辑器` opens a modal with View, ownership-paint, region-drawing and map-settings modes; region search, zoom/reset, faction CRUD-like controls, region operations, markers and shared attributes are all visible. `保存并退出` returns to the Creator without publishing. In one controlled draft check, edits to the Map display-name and custom App instruction were followed by `保存 App 配置`/`保存并退出` but were blank after reload. This is a field-specific persistence failure/UNKNOWN boundary; it does not invalidate the verified Map replacement result.

### Faction roleization and published region runtime

- A published v9 Simulation exposes a canvas-based Japan map. Selecting `滋贺` showed faction `鬼杀队`, `鬼患威胁度 40`, five adjacent regions, custom action, Patrol/Hunt, advisor and copy-name controls; selecting `冈山` showed faction `鬼`, threat `65` and its own adjacency. Adjacency navigation is zero-Turn.
- A free-text `冈山` action advanced Turn 3→4 and Day 1 08:20→14:45, using both region and faction context in Story. It did not name the previously linked `测试角色 001`, so v9 relation identity is not proven by that result.
- Creator has two distinct checkboxes named `把地图上的阵营作为角色`: a World-character layer and a Map-App `阵营设置` layer. They are not mirrored; turning on the Map-App checkbox left the World checkbox off until it was separately enabled.
- With both enabled and no binding, Preview Chat listed `Demon Slayer Corps`, `Demons` and the independent `测试角色 001` as three entries. Reopening the Creator restored both checked in the v10 Draft, proving the roleization configuration is durable before Publish.
- After enabling roleization, both faction→Character selects were at `— 无 —`; because the prior state was not read immediately before toggling, the cause of clearing is `UNKNOWN`. Re-selecting `Demons → 测试角色 001` and saving both editor/config changed Preview Chat to exactly `👹 测试角色 001` plus `⚔️ Demon Slayer Corps`: the faction name and ordinary Character entry are replaced by one faction-skinned Character identity.
- v10 published this relation. The public World showed one `👹 测试角色 001` Character card. An existing v9 Turn-4 save presented the normal changelog/merge prompt; Apply cost zero Turns, kept Day 1 14:45 and Story, and changed runtime Chat to the same two identities. This makes the alias/dedup relationship versioned and runtime-effective.
- Evidence: EVD-0148–0149.

## Remaining

- 新建并编辑后的 World v1/Map v2 publication split与 cover-required validation 已确认；v2 最终外部结果 `BLOCKED_BY_FILE_PICKER`；
- 装入已有 World 后是否自动安装 Map App、是否增加版本；（已确认：进入 Draft 时为单一 Map App，Creator 显示 v2）
- `全部`/`仅底图`/`仅区域` 的主要子结构边界已验证；仍需补底图 payload 的可视/导出级比对、marker/关联角色等特殊字段冲突规则；
- 两层阵营角色化的非同步行为和 Preview Chat 结果已验证；仍需发布 v10，验证旧/新 Simulation、Character State/Chat 身份、重复绑定和 relation-clear 因果；
- Map Editor 的地点、边、旅行时间、图层与发布；
- Simulation 内更多旅行/猎鬼变体如何推进 Time/Story/Character/World State；
- `我的` 在 v4 发布后仍未立即收录该 World；需延迟复查，区分异步索引与 base-map eligibility。
- 可视化证明 retained WWII base；当前 runtime 的 Three Kingdoms ownership/region attributes 已验证。

### Marker lifecycle (EVD-0151, EVD-0153)

- Marker editor fields are durable when submitted with the explicit `保存 App 配置`: name, emoji, type, faction, badge and region survive reload. A first save can lose a field edit when autosave races an older DOM node; a second explicit save is authoritative.
- Creator Preview renders marker visual/label and states `仅预览，不可互动`. Published v11 carries the marker into existing saves without consuming a Turn; fresh v11 saves receive it at Turn 1.
- Runtime canvas marker click opens a detail card with emoji/name, type, faction, badge, region and `询问顾问`/`复制名称`. No direct runtime edit, drag, delete or move control was exposed.
- Configured marker and AI-generated event markers coexist in one runtime map.
- After energy replenishment, a main-input instruction submitted with Enter advanced Turn 1→2 and mutated the configured marker from Shiga/`18k` to Kyoto/`21k`. Events retained the exact prompt and Story but did not expose a typed marker-delta row.
- Historical Turn 1 restored the marker card to Shiga/`18k`. After the user accepted the native confirmation, in-place Rewind returned the same UUID to current Turn 1, removed Turn-2 Event/Story content and restored Shiga/`18k`. Marker fields/location are therefore part of the Turn snapshot.
- Direct runtime edit/drag/delete controls, runtime deletion through an AI Turn and structured marker Event-delta rendering remain `UNKNOWN`.

## Simulation 行为（来源 World：鬼灭之刃模拟器）

Simulation：`/zh-cn/sim/074a3697-46bc-48c7-8c55-aa2308bbb948`。

- 地图 App 以独立 Dock/窗口运行；点击地图上的地区打开 Drawer，显示名称、阵营、威胁值、邻区、自由文本行动、快捷行动、顾问和复制名称。
- 已实测地区操作 `🏮 巡逻`：点击后输入锁定、回合从 1 进入 2，生成完整 Story；事件 Delta 同时写出 `Hokkai · ...`、`p1.threat -3`、Wallet `balance +25`、Wallet transaction、Bounty Board 状态变化和 Gear 新增。
- 操作前北海道威胁值在 Story 中为 85；操作后重新打开 Drawer 为 82。继续等待世界自动回应后，第二回合又产生一段北上猎鬼故事，威胁值降为 78，事件显示 `p1.threat -4`，Wallet 再增加 40，Inventory 新增“染血的布袋”和“第二头鬼的灰烬”。这表明单次地区快捷操作可以触发连续的世界回应，并使 Map State、Story、Wallet、Inventory、任务 App 一起变化。
- 点击邻区 `青森 · SW` 只切换地区 Drawer，不直接消耗回合；青森显示独立威胁值 70、接壤地区秋田/岩手。
- 在青森输入自定义行动“调查青森港的鬼患线索”，`行动`按钮由 disabled 变为 enabled；提交后消耗一个完整回合并生成跨海移动、地区调查和战斗故事。生成期间所有输入/商店操作锁定。最终 Delta：`p2.threat -6`、`Hokkai → Aomori`、Wallet `balance +50`、新增 transaction、Gear 新增“黑篷船管事钥匙”、Demon Hunts `bounties.1.status` 更新；说明自由文本地区行动可以同时更改当前地区、地图属性、任务、资金与物品。
- 当前样本的时间标签仍为 `1912年·初夏`，因此“地图移动是否必然推进时间”尚不能从该样本确认，应记为 UNKNOWN。
