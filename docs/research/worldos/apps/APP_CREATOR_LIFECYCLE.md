# App Creator Lifecycle

研究状态：`TESTED / VERIFIED`（Create/Edit/Version/Install/Runtime/既有 Simulation 热升级、永久删除与 owner-World 恢复已有完整样本；下架/跨 owner 仍待补）  
测试对象：`TEST App 001`，slug `test-app-001`。

## Creator 模式

- 入口：`/zh-cn/apps/create`。
- 支持两条制作路径：
  - 用 WorldOS AI 通过自然语言生成并迭代；
  - `自己写 HTML` / HTML 编辑器直接粘贴 Widget 源码。
- 可复制 AI 制作提示词给外部模型，再把生成的 HTML 粘回。

## 本地测试

- HTML 关闭后立即渲染在 iframe。
- 测试按钮可执行内联交互：`Ready → Clicked`，证明在线预览允许 Widget 内部脚本交互。
- 另有世界观/行动测试框，用 AI 模拟正式 Turn 更新 App；当前在缺少完整生成配置前保持 disabled/未执行。
- `重置预览` 可清空测试态。

## 配置字段

- slug、名称、emoji/方图、标题栏颜色、一句话简介、最多 3 个标签；
- Market 详情、本次更新说明；
- 内置 AI 指令、初始 JSON；
- 是否允许玩家刷新、刷新提示；
- Events 文案模板：update/set/inc/push/remove/action。

## Draft 与 Publish

- `存草稿` 成功后 toast：`草稿已保存。`
- 发布成功后跳转到 `/zh-cn/apps/test-app-001`。
- 详情页包含作者、使用世界数、标签、收藏、编辑、删除、安装、简介、Market 详情、更新日志、评分、评论和在线试玩。
- v1 更新日志记录创建日与 `v1 initial research build`。

### 既有 Published App 的“存草稿”真实语义

- 在已发布 App 上修改 HTML 与“本次更新说明”，点击 `存草稿` 后，编辑器刷新仍保留新 HTML。
- 但它并不只保存作者私有草稿：公开详情立即新增下一个版本并切换在线试玩。已连续复测：v1 → v2、v2 → v3；v3 更新日志为 `TEST v3 draft-only boundary check`，公开 iframe 直接显示 `Ready v3 draft-only`。
- 因此当前产品中，对已发布 App 点击 `存草稿` 实际会创建公开新版本；按钮标签与行为不一致。`本次更新说明`在保存后会清空，但写入公开更新日志。
- App 工作室仍同时显示独立 `发布` 按钮；其与 `存草稿` 的差异尚需单独实验，不应假定它才是唯一发布入口。

### 独立 `发布` 按钮复测（v4）

- 从公开 v3 编辑器修改 HTML 为明显的 `Ready v4 own-upgrade / Version 4 own App update propagation`，更新说明为 `TEST v4 own App update propagation`。
- 先点击 `存草稿`：toast 为 `草稿已保存。`；公开详情的在线试玩立即显示 v4 HTML，但原有 v1–v3 更新日志整段消失。说明已发布 App 的所谓草稿 HTML 会泄漏到公开试玩，并非作者私有隔离态。
- 随后点击独立 `发布`：按钮短暂 disabled，没有成功 toast，也没有跳转；回到公开详情后 v4 HTML 继续可见，但仍没有 v4 或任何更新日志。
- 因此当前实现至少存在两套不一致路径：此前 `存草稿` 曾创建 v2/v3 公开日志；v4 的 `存草稿` 已公开切换试玩而不生成日志，随后 `发布` 也未补日志。版本号是否在后端递增无法从 UI 确认，记为 `UNKNOWN`。

## 安装

- 点击安装先选择已有 World，也可输入名字创建新 World。
- 选择 World 后安装器支持：显示名称、自然语言生成开局数据、初始 JSON、App 自定义指令、单次操作提醒、引导文案与不可互动预览。
- 尝试安装到已含 10 个 App 的 Remix World 时被会员墙阻止：`每个世界安装超过 10 个 App 是会员功能。`
- 弹窗套餐文案同时称免费版最多 8 个 App，与实际 10 个 App 阈值提示存在冲突，需在新建较少 App 的 World 再测。

## 成功安装、World Version 与 Simulation Runtime

- App v2 成功安装到只有 3 个基础 App 的 `TEST Map World 001` 草稿。完成安装后 toast：`已加入世界草稿。发布新版本后，修改才会对玩家生效。`
- World Creator 立即显示第 4 个 App，并在 Live Preview 出现 `🧩` Dock；发布 World v2 后，旧 v1 Simulation 收到版本更新提示。
- 对旧 Simulation 点击 `应用更新` 成功：World 版本从 v1 变为 v2，`🧩` Dock 出现，iframe 运行 App v2。点击 `Test Button v2` 后 `Ready v2 → Clicked v2`，但 Turn 保持 1，说明纯 iframe DOM 交互不自动消耗 Turn。
- 随后从 World v2 草稿卸载该 App并发布 World v3。旧 Simulation 仍保留 App，直到接受 v3；点击 `应用更新` 后 App 标题、iframe 和 Dock 全部消失，Story/Turn 保持不变。
- 这验证了 World 版本更新可对既有 Simulation 执行 App 增量安装和移除；删除/卸载不是发布前即时作用于旧存档。

### App v4 → 新 World 版本 → 新 Simulation

- 将 `TEST App 001` v4 与 `TEST Character 001` 的 World-local 副本一起发布到 `TEST App Upgrade World 001` v3。
- World 公开页 v3 列出 4 Apps、登场角色和完整版本日志；发布弹窗再次明确“新开局会使用此版本；现有存档可自行选择是否应用”。
- 新局 `/zh-cn/sim/26faf299-fb09-42fe-b60b-4e0525a48427` 在 Turn 1 的 `🧩` Dock 中真实渲染 v4 HTML，证明新 World 版本/新 Simulation 消费 App 的当前公开内容。
- World v2 与 v3 详情都显示 `7–16 电量 / 回合`；本样本增加一个社区 App 与一个角色没有让详情范围继续上浮。
- 该实验还不能回答“Simulation 已存在后 App 再发新版本”是否热更新；下一步必须在此存档存在的前提下制作 v5，再比较 Draft、公开 World 和该 Simulation。

### App v5 → 已有 World / 已有 Simulation

- 在 v3 World 已有 Simulation `26faf299-fb09-42fe-b60b-4e0525a48427`（Turn 1）后，将 App HTML 改为显式 `Ready v5 existing-save`，点击 `存草稿`。
- App 公开详情立即显示 v5，并新增公开更新日志 v5（本次 v5 与此前 v4 均出现日志，说明 v4 的无日志现象不是稳定规则）。
- World Creator 同时仍显示 `发布 v4`，表示 World 配置版本没有因为 App 自身更新而递增；World 公开页仍为 v3，版本记录不变。
- 已有 Simulation 无任何 World-version 更新提示，标题仍是 `TEST App v4 Simulation 001`、World 配置仍 v3，但 App Dock 在不执行 Turn 的情况下立即渲染 v5；强制 reload 后仍为 v5，v4 文案消失。
- 结论：当前 App iframe/runtime 内容按 App slug 的最新公开内容动态解析，独立于 World 的版本号；既有存档不会 pin App HTML snapshot。App 自身升级不触发 World `应用更新` 流程，也不消耗 Turn。v6 进一步证明 AI 指令与 Events 模板也热更新；Initial JSON 的独立贡献仍未知。

### App v6 AI / JSON / Events 热更新

- v6 changed visible HTML plus AI instruction (`CONFIG_V6`/`AI_JSON_V6`), initial JSON (`status=CONFIG_V6`, `configMarker=AI_JSON_V6`) and all Event templates (`CONFIG_EVENT_V6`).
- Existing v3 World / Turn-1 Simulation was reloaded; iframe immediately rendered v6. Clicking its `refresh` advanced exactly one new Turn (Turn 2), while Story context stayed in place.
- Events drawer for Turn 2 showed `🧩set CONFIG_EVENT_V6 status`, `🧩set CONFIG_EVENT_V6 configMarker`, and `🧩push CONFIG_EVENT_V6`. No old v4/v5 Event labels appeared.
- This proves existing Simulation resolves latest App AI instruction/Event metadata. The event payload cannot isolate whether `configMarker` came from Initial JSON or AI instruction, so that sub-question remains `UNKNOWN`.

### App v8 “存草稿”与显式“发布”的精确对照

- 在同一既有 App 中把 HTML 改为 `Ready v8 upgrade-test / Version 8 installed-world upgrade test`，更新说明写为 `TEST v8 installed World and Simulation upgrade propagation`。
- 仅点击 `存草稿` 后立即出现 `草稿已保存。`；未点击发布之前，公开详情已出现 v8 更新日志、`查看全部 8 条`，在线试玩也已切换到 v8。
- 同时打开既有 Turn 2 Simulation，App iframe 直接显示 v8，而包含该 App 的 World 仍处于未发布 v4 草稿、公开详情仍是 v3。这再次排除 World Version 是 App 热升级的必要条件。
- 随后点击显式 `发布` 会进入处理态并跳转公开详情，但公开版本仍是 v8，没有生成 v9。对既有 App 而言，当前样本表明 `存草稿` 才是创建公开版本/切换运行时的动作；`发布`更像 finalize-and-return，或在没有新增 dirty state 时不重复增版。
- 仍不能把这一状态机外推到首次创建的新 App；新 App 的首次 Publish 语义需要独立样本。

### 新 App 首次发布 → World v9 → 新旧 Simulation（EVD-0145–0146）

- `TEST App First Publish 001` 的 `存草稿` 先创建 owner-only `未公开` v1；裸 `/apps/create` 不恢复它，必须使用 `?slug=` 或 Mine/详情编辑链接。
- 首次点击 `发布` 没有确认 Modal，短暂提交后直接跳转公开详情；版本仍为 v1，不产生 v2。App Market 精确标题立即找到它，统一 Search 暂未返回，说明两个发现索引不在同一事务收敛。
- 下架→重新发布后的重复对照进一步证明这不是单次即时延迟的简单结论：Owner App Market 仍能按完整标题命中 v2/4-World 卡片，但按 slug 不命中；Owner Unified Search 的 App 标签仍为空，而同一标签能找到官方 `主输入框`。外部 B/Guest 同时具有“直链已恢复、两个发现面仍缺席”的状态。直接解析、Market 与 Unified Search 必须作为三个投影建模；具体 eligibility/cache 仍 `UNKNOWN`（EVD-0218）。
- `安装` 是两阶段流程：先选/创建 World，再配置显示名、Initial JSON、AI seed/preview、自定义指令、单回合提示和引导文案。安装到 >10 Apps World 出现会员墙；安装到较低数量的 World Draft 成功，usage 0→1，且在 World 发布前就计入使用数。
- World v9 发布后，旧 v8 save 显示 v9 changelog/merge policy。Apply 不增加 Turn，保留 Story/Time/Chat/Character State，并加入 App Dock/iframe与 Initial JSON `clicks:0/status:草稿种子`。
- fresh v9 save 从 Turn 1 即含 App。五槽满时触发 `增加存档位 · 80`；扩容成功后自动创建新 UUID。Simulation 初始化和下一普通 Turn 在本世界样本中各扣 9 电量。
- fresh Turn 1→2 将 Time 08:00→08:15，Story 把 App 写入世界叙事，Events 记录 `clicks +1`。reload 保留 Turn/Story/Time/Dock；重新打开 App 后 iframe `srcdoc` 注入 `clicks:1/status:草稿种子`，验证 namespaced state 持久化。

### 首次发布后的 v2 热更新与状态保留（EVD-0147）

- 把 HTML 改为 V2、AI 指令改为匹配动作时 `clicks +2`，并把 Initial JSON 改为 `clicks:100/status:v2-seed/newField/nested/arr` 后点击 `存草稿`。
- 公开详情立即新增 v2 日志并切换在线试玩 HTML；没有 World 新版本或 Simulation 更新提示。
- 既有 Simulation reload 后 HTML 变成 V2，但 state 仍是先前 `clicks:1/status:草稿种子`，说明 later Initial JSON 不会覆盖已有 namespace。
- v2 Turn 产生 `clicks +2` 和 `status` Events；再次 reload 后 state 为 `clicks:3/status:v2 扫描就绪 - 发现异常血气波动`。
- v2 Initial JSON 中的新 `newField/nested/arr` 没有出现在既有 Simulation 的最终 iframe state；EVD-0150 随后证明它们会完整进入全新 World-local 安装配置。既有 namespace missing-field merge 与新安装 runtime hydration 仍需分别验证。

### v2 安装到第二 World Draft（EVD-0150）

- 从公开 App v2 详情选择 `TEST Map World 001`，第二阶段安装器直接带出完整 seed：`clicks:100/status:v2-seed/newField:v2/nested:{a:1}/arr:[1,2]`。
- 最终安装后目标 Creator 形成 durable `发布 v5` 草稿；已安装列表存在该 App，打开 World-local `配置` 后仍能逐字段读到同一 JSON。新版本 seed 因此不是预览占位或安装器临时值。
- 公开目标仍停在 v4，尚未把该 Draft 发布到 runtime；当前只对“新安装→World Draft seed”作结论。
- App 详情在 fresh load 和 5 秒后 reload 均仍显示 `1 个世界在用`，没有变成 2；这与首次 Draft 安装 0→1 不一致，usage 计数资格/缓存语义保留 `UNKNOWN`。

### 第二 World v5 发布、失效依赖清理与运行态（EVD-0154）

- v5 首次发布返回 `Unknown or unavailable app`，原因是 Draft 仍保留已删除的 `test-app-001` 行；其 UI 明确说明配置仍保留并可选择卸载。
- 卸载该失效行并等待 `草稿已自动保存` 后，同一 v5 Publish 成功，公共版本记录出现 `v5 · Install TEST App First Publish v2 clean`。
- 旧 v4/Turn-1 save 显示标准 v5 更新提示。应用更新不消耗 Turn，保留开场 Story，设置切到 v5，并新增 v2 App Dock。
- 旧 save 新建的 App namespace 和 fresh v5 save 都注入完整 seed：`{"arr":[1,2],"clicks":100,"nested":{"a":1},"status":"v2-seed","newField":"v2"}`，证明 primitive/nested/array 全字段跨 World 发布和 Simulation 初始化有效。
- Fresh v5 sample: `/zh-cn/sim/a4998853-6e3d-4d38-b7ff-3db692a3b435` (`TEST App v5 Fresh Runtime 001`).
- App detail subsequently converged to `2 个世界在用` and the popular-World list contained both installed Worlds. The earlier Draft-only `1` result is therefore a temporary indexing/publication boundary, not a permanent counter exclusion.

### World-version Initial JSON merge precedence (EVD-0155)

- Before v6, a Turn changed `clicks 100→102`, changed `status` to a runtime object and added `upgradeSeen`, while `arr`, `nested` and `newField` remained at their v5 seed values.
- v6 supplied conflicting values for every prior seed field plus a new `missingOnly` field.
- Zero-Turn v5→v6 migration produced: new `arr`, new whole `nested` value, retained runtime `clicks`, retained runtime `status`, new `newField`, added `missingOnly`, retained runtime-only `upgradeSeen`.
- Initial interpretation from v6 was top-level dirty tracking. EVD-0235 refines it: the v6 nested object had not contained a dirty leaf, so replacing its whole visible value did not prove a top-level boundary.

### Deep path/array/null/omission merge refinement (EVD-0235)

- Before v7, one paid Turn changed only `nested.a 999→1234` and replaced `arr:[9,8]` with objects `a=1,b=2`; reload preserved the mutations.
- v7 conflicted at those paths, updated clean siblings, appended new object-array identity `c`, supplied nulls, added fields and omitted prior `missingOnly`.
- The migrated result retained dirty `nested.a`, updated clean `nested.b`, added `nested.c`; retained array members `a`/`b` and appended `c`; retained dirty `status` over null; changed clean `newField` to null; retained omitted `missingOnly` and runtime-only `upgradeSeen`; added `addedList` and `explicitNull`.
- A fresh v7 Simulation had exactly the new seed and none of the omitted/runtime-only migration residue. Observable parity rule: deep three-way merge with path-level dirtiness plus stable-`id` object-array union. Omission alone is not deletion.

## 待补

- App 持久 JSON 状态在热升级时已验证保留；published fresh hydration、新 namespace seed、deep path-level dirty merge、stable-ID object-array union、explicit-null precedence 和 omitted-key preservation 均已验证；仍需无 ID/重复 ID 数组、类型冲突和真正的 delete/tombstone 语法；
- 独立 `发布` 与 `存草稿` 的现有 App UI 差异已复测；首次新 App Publish 已闭环，但首次发布后的 v2 升级和 v4 一次日志异常原因仍未知；
- 下架/Unpublish 与其他 owner World 的依赖行为；永久删除对 owner World/Simulation 的影响已验证；
- iframe/AI Event 已产生并持久化 `clicks +1/+2`；仍缺可点击 iframe `WS.sendAction` 的即时 mutation 和失败恢复；
- App `个世界在用` 在第二 World v5 publication 后从 1 收敛到 2；Draft-only 更新不是稳定事务，精确 SLA/触发条件仍未知。

### App 卸载→重装与初始 JSON（EVD-0107）

- 从 World Draft 卸载 `TEST App 001` 后，App Market 的 `安装` 会把同一 App 重新插入为一个 World-local 安装项；不会创建第二个 App 卡片，也不会直接发布 World。
- 重装配置面板显示当前 App 最新定义（本样本为 v8 HTML、Initial JSON `clicks:999/status:SEED_V9/observedInitial:null`），因此安装器查询的是 App slug 的最新公开定义。
- 安装动作存在 Creator 草稿自动保存竞争：立即打开配置可能出现 `草稿已在其他页面更新,点击刷新后继续`；刷新会恢复上次草稿并撤回未稳定保存的安装。等待 `草稿已自动保存` 后再 reload，安装稳定保留。
- 现有 Simulation 在这段 Draft-only 卸载/重装期间不变；World 发布和新局初始化是否以 v9 JSON 建种子、以及重装是否重置已存在 App state，仍需独立实验。

## Confidence

- 手写 HTML、iframe 交互、配置、首次 Publish v1、详情页、两阶段安装器和数量/会员边界：`VERIFIED / TESTED`。
- 成功安装、World 发布、既有 Simulation 应用新增/卸载 App：`TESTED`。
- App 自身 v4 被新 World/新 Simulation 消费：`TESTED`；既有 Simulation 建立后的 v5 iframe、v6 AI/Event 和 v8 HTML 热更新：`TESTED`；v5/v6/v7 Initial JSON migration、首次发布 App 的 World v9 新旧 save 初始化/`clicks +1` 持久化、第二 World 的新旧 save、deep path dirty preservation、ID object-array union、null/omission规则、fresh v7 literal seed、usage 1→2 convergence 与 permanent-delete owner-World lifecycle：`VERIFIED`；无 ID/重复 ID数组、显式删除语法、exact usage-index SLA 与 cross-owner behavior：`UNKNOWN / PARTIAL`。

## 删除前确认与最终删除

- 详情页点击 `删除` 先执行“正在检查使用情况…”，随后打开确认区：`删除这个 App?`、`此操作不可恢复。`、`取消`、`删除`。
- 早期只验证到确认层并点击取消；后续对零使用 App 和使用中 `TEST App 001` 都执行了最终删除。
- 使用中删除警告明确先从 owner 的 1 个 World 卸载。App 详情/市场随后消失并保持 404；World 生成未发布 v6 cleanup Draft。
- public v5 仍引用已删除 App 的间隔内，v5 save `2ba0...` 直接 URL 临时 404，但 Mine/World 列表保留该 UUID；旧 save 可以继续解析但已无 App surface。
- 发布 owner World v6 后，`2ba0...` 同一 UUID 恢复，显示正常 v5→v6 更新并零 Turn Apply；App 自身仍 404。因此依赖修复来自 World version，不是 App resurrection。
- Evidence: EVD-0111–0113, EVD-0126.
