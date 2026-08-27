# MARVIS_HANDOFF — WorldOS 独立查漏 / 第二账号权限验证

更新时间：2026-08-24  
主调查状态：仍在进行，未进入开发阶段。当前主 Agent 约完成 88% 左右的产品级覆盖；Missing Feature Audit 与 Cross-System Audit 仍为 `PARTIAL`，Final Completeness Audit 尚未完成。

并行状态（2026-08-23）：Marvis 第二账号与 Anonymous/Guest 审计正在/已完成独立权限调查，当前标记为 `PARALLEL_AUDIT_IN_PROGRESS`。主 Agent 不重跑这两套调查，待辅助报告交付后只做 Evidence Merge / Conflict Check / Gap Audit。

## 任务定位

你不是从头重做 WorldOS 调查，而是作为独立第二调查 Agent：

1. 用另一个合法账号/独立会话验证权限、可见性、会员墙和非所有者行为；
2. 对主 Agent 标为 `UNKNOWN / PARTIAL / BLOCKED` 的项目做独立查漏；
3. 只把新增证据写入主研究库，避免重复已有 Happy Path；
4. 不写产品代码，不充值、不真实付款、不提交真实 API Key，不绕过访问控制。

## 已 VERIFIED 的主要系统与机制

### World / Version / Creator

- World Creator 有自动保存 Draft；发布递增 vN，公开详情保留版本标题、更新日志和历史。
- 跨账号 World Remix 已完成 L0→L1→L2：点击 `改编` 会立即创建公开 v1，Creator 下一次显式发布从 v2 开始；可见 attribution 只指向直接父级，祖先通过逐层来源链接追踪。Remix 会给父 World 所有者生成带子 World 深链的通知。
- 发布提示明确：新局使用新版本；已有存档自行选择 `应用更新` 或 `暂不更新`。
- 已验证 App 增加/移除和仅元数据更新都可以迁移到已有 Simulation；迁移零 Turn，保留 Story、Turn、已修改内容和未涉及的 App 状态。
- v5 Initial JSON 实验：新局读取 `clicks:999`；旧局应用更新后保留原可变 `clicks:0`，同时合并新的 `status/observedInitial` 字段。不要把版本应用实现成重启或全量替换。
- 世界公开页有 Apps、角色、地图标记、版本记录、存档列表、分享、改编、合集、评分、评论和删除入口。

### Character

- Global Character 添加到 World 后形成可编辑 World-local 副本；本地编辑不回写源角色。
- 源角色后续更新也不传播到既有 World-local 副本（快照/复制语义已 VERIFIED）。
- 源角色最终删除也不传播：World-local、L0 public World、三个 World Remix 后代和 Character Remix L1/L2 都保留。源自身独立 Chat save 变成 404，但 History 仍保留 tombstoned 链接。
- Character Remix 至少支持多层副本；标签上限、公开/私有会员墙、Creator 表单和源详情删除确认层已测。
- L1/L2 Remix Chat 都已在 source 删除后创建稳定 UUID、完成 AI Turn 并 reload 保留。fresh post-delete World Simulation 也已验证 World-local Character 的 Chat Turn 与后续 Character State 初始化；尚缺非所有者查看、私有角色运行权限和中间 Remix 父级删除。

### App / App Market / Runtime

- App 可通过 HTML、配置、AI 指令、Initial JSON、刷新提示和 Events 模板定义；iframe HTML、配置和 App 版本日志已测到 v9。
- Official App detail viewed as a non-owner (`/zh-cn/apps/map`) exposes online preview/reset, rating, gift, comments and install, with `预览 · 操作不会生效`; it does not expose Edit/Delete/Downlist/version-management controls. Treat owner-only lifecycle gating and downlist/unpublish as still open (EVD-0132).
- Empty `/zh-cn/apps/create` state/tutorial and full Config schema are documented (EVD-0133). EVD-0145 closes first publication: the owner-only `未公开` Draft v1 reopens only via `?slug=`/Mine; first `发布` uses no Modal, redirects public and remains v1. App Market exact search immediately finds it while unified Search still does not.
- The same App completed two-stage install into `TEST App Upgrade World 001`, usage 0→1, public World v9, old-save zero-Turn v8→v9 migration and fresh v9 runtime. Initial JSON started `clicks:0/status:草稿种子`; a normal Turn produced `clicks +1`, Story/Time changes and 9-energy cost (EVD-0145–0146).
- EVD-0147 completed v2 hot-update/state preservation. EVD-0150/EVD-0154 installed/published v2 in `TEST Map World 001`, cleaned an invalid deleted-App dependency, verified old/fresh full seed hydration and usage 1→2 convergence. EVD-0155 then closed existing-used namespace merge: runtime-dirty `clicks/status` and runtime-only fields survive; untouched top-level seed fields adopt v6 values; new fields are added. Do not repeat these paths. Remaining App gaps are deleted/null/array-object merge, exact usage-index SLA and cross-owner downlist behavior.
- EVD-0137 adds a recovered Map Editor cycle: `Demons → 测试角色 001` survived Draft Save/Exit and wait/reopen; this upgrades Draft faction-link persistence to VERIFIED.
- EVD-0148–0149 close the basic published region-runtime and duplicate-binding gap: v9 Map drawers expose region/faction/threat/adjacency/custom and quick actions; a free-text region action advanced Turn and Time. Creator has two independent faction-roleization checkboxes. Both-on/no-binding Preview showed three identities; `Demons→测试角色 001` reduced this to `👹 测试角色 001` + `⚔️ Demon Slayer Corps`. World v10 public Character inventory and zero-Turn v9→v10 old-save migration reproduced the same alias/dedup while retaining Turn 4, Day 1 14:45 and Story. Do not repeat v10 publication or old-save alias migration.
- EVD-0151/EVD-0153 close marker persistence, Turn mutation and Rewind: `TEST Marker 001` (`🚩`, army, Demons, `18k`, Shiga) survives Draft/publish/old-save migration/fresh init; a Turn changes it to Kyoto/`21k`, historical Turn 1 shows Shiga/`18k`, and user-mediated in-place Rewind restores Turn 1 plus the old marker state. Runtime click exposes full detail and AI markers coexist. Do not repeat seed/v11/fresh-init/move/Rewind; remaining marker gaps are structured Event-delta rendering and runtime deletion/direct edit.
- EVD-0138 confirms Simulation `设置 → 导出交互记录` opens a membership purchase wall advertising Markdown/HTML/TXT export; no payment was attempted, so file schema remains UNKNOWN/BLOCKED.
- EVD-0139 confirms Account World Model BYOK fields and disabled `测试并保存` / `测试并添加` controls without entering or transmitting a key.
- EVD-0140 confirms empty World Creator `创建世界` disabled state, 11-template modal inventory and Creator `自由沙盒 · 手机版` pressed-state toggle.
- EVD-0141 confirms a zero-use Draft App delete path: `正在检查使用情况…` → irreversible `删除这个 App?` modal; cancellation preserves the Draft. This is distinct from the used-App cascade warning already documented.
- 对既有 App，`存草稿` 在当前路径会立即推进公开版本/运行时；随后显式 `发布` 不重复创建版本（新 App 首次状态仍需独立确认）。
- App HTML、AI 指令和 Events 模板按 slug 热更新到既有 Simulation，不要求 World 重新发布。
- World Draft 卸载→重装会读取 App 最新定义；安装动作存在自动保存/hydration 竞争，立即打开配置可能出现 `草稿已在其他页面更新,点击刷新后继续` 并回滚未稳定安装；等待 `草稿已自动保存` 后 reload 可稳定保留。
- 独立临时 App `test-app-delete-lifecycle-001` 已完成发布→删除：最终删除后公开详情 URL 返回 404。
- `TEST App 001` 的“使用中的删除”已提交并复核：提示 `会先从你自己的 1 个世界卸载。此操作不可恢复。`；之后公开 World 只剩四个官方 App，Creator 形成未发布 `发布 v6` 草稿；旧 Simulation 迁移后移除 live App/iframe 但保留 Story。期间新 v5 局 `2ba0...` 直链短暂变为 404，但后续发布 dependency-clean World v6 后同一 UUID 恢复并正常显示 v5→v6 update；不要把该临时 404 当作最终 save 删除。
- 后续已发布 cleanup World v6 `Removed TEST App After Cascade Audit`：此前 404 的 `2ba0...` 同一 UUID 立刻恢复，显示 v5→v6 update 并零 Turn Apply；旧 Story/Map/Time 保留。App `/apps/test-app-001` 仍 404。结论：404 是 public v5 broken App dependency 的临时解析失败，不是 save 被删除；dependency-clean World version 可恢复。

### Map

- Maps `用此地图` 可创建新 World Draft（slug/v2）或装入已有 World 的单一 Map App。
- 导入范围：`全部`、`仅底图`、`仅区域`。仅底图保留已有区域/阵营/行动；仅区域替换区域/阵营/行动而保留当前底图，可形成混合地图。
- Map Editor 有区域、阵营、颜色、数量、行动、标记、共享属性、阵营→Character 选择器、World 层与 Map-App 层两个角色化开关和地图设置。
- Mixed Map 已发布为 `TEST World 001` v4：Draft 可临时 11 Apps，但 Publish toast `Worlds hold up to 10 apps`；卸载 Movie 后成功。旧 v1 save 零 Turn Apply 后保留 Story/角色/Chat/Wallet/Inventory/Time，移除 Movie 并加入三国 Map state；fresh v4 save `05ac8dda...` 直接读取相同 Map。运行态可见地理底图与三国区域叠加、江夏区域属性/邻接/行动一致。
- `Demons → 测试角色 001` 曾跨 Draft Save/reload 保留。新的 v9/v10 实验进一步证明两个角色化开关不自动同步；两者同启时 Preview Chat 生成 `Demons`、`Demon Slayer Corps` 并保留普通 World-local Character。v10 alias/dedup 与 v11 marker seed/propagation 已闭环；relation-clear 因果、fresh Character State 对照、marker mutation/delete/Rewind 和 Maps 目录未收录原因仍 `UNKNOWN`。

### Simulation / Turn / Save / Rewind / Time

- 主输入、Chat、Map、Shop、App 刷新都可以产生全局 Turn；生成期间输入和 App 控件锁定。
- Event Delta 同步 Story、Wallet、Inventory、Stats、Relations、Map、Quest 等跨 App 状态。
- Save checkpoint 产生独立 Simulation 分支；Rewind 恢复 Story/Chat/Wallet/Inventory/World State/Memory/Time 并截断后续时间线，但当前 App 定义/HTML 配置不回滚。
- Time App 的下一事件、下一天、+1 月、+1 年均消耗一 Turn，处理叙事/地图事件；长时间跳跃本身不必然生成 Memory 摘要。
- Mobile Phone 模式的 App 刷新是收费 Turn，不是浏览器 reload；Widget 媒体槽位可持久化。
- Simulation 模型按存档选择：`Civilization 1 Small 10/回合`、`Deepseek 10/回合`、`Civilization 1 13/回合`。切换本身不耗 Turn，下一 Turn 精确按档扣费，选择跨 reload 保留。

### Platform / Account / Community

- Global nav：世界、角色、我的、社区、App 市场、地图、升级、分享领电量、通知、QQ、账号菜单。
- Unified Search 支持 `?q=`、全部/World/Character/User/App、debounce 和空结果。
- Mine 管理 Simulation History、World/Character/Collection/App 等对象；Rename 持久化但列表可能延迟重渲染。
- Profile 有创作者/玩家统计、成就、世界/角色/App/合集、关注、送礼、主页分享；礼物 9 档，文案称 70% 进入创作者电量。
- Account 设置含 Profile、偏好、世界模型、三类私有预设、账户危险区；精确输入 `DELETE` 才启用永久删除账号。
- BYOK/OpenRouter、自定义 OpenAI-compatible gateway UI 存在，但当前测试账号 entitlement gate 禁用 key；Simulation 内点免费 OpenRouter 会报 `需要 Freedom Pass——请先订阅，或改用官方模型。`，不能提交真实 key。
- 语言 English/Español/中文持久化，稳定 slug/UUID + locale variant；缺失翻译会 fallback 原文。

## 已测试资产，避免重复

### Worlds / Simulations

- `TEST App Upgrade World 001`：`test-map-world-001-gytp`，已发布 v1–v5；App/Character/Map/Time/Version 主样本。
- Cross-account Remix chain: L0 `test-map-world-001-gytp` → Account-B L1 `test-map-world-001-ft9r` → Account-B L2 `test-map-world-001-ouue` (v2)；Account-A 另一个 L2 `test-map-world-001-k4do`（public v1，直接父级同为 `ft9r`）。不要重做基础复制/attribution；优先测来源删除/可见性/通知和 Search 延迟。
- `TEST World 001`：`hogwarts-3bmx`，Map/World/Character/Remix 样本。
- `TEST Map World 001`：`test-map-world-001-rxwf`，Map/Version 样本。
- `TEST Map Install Audit 001`：`test-map-install-audit-001-qp49`，新 World Map import 样本。
- `TEST App v4 Simulation 001`：`26faf299-fb09-42fe-b60b-4e0525a48427`。
- `TEST Initial JSON V9 New Simulation 001`：`88cffec1-1296-47c0-bae7-f238d17dabc2`。
- `TEST v5 Reinstall Seed Simulation 001`：`2ba0bf5b-68d1-4b50-8b67-4a0c7d1468b7`。
- `TEST Time v4 Simulation 001`：`9b898aaf-f061-48fd-8b61-ee25759de2e4`。
- Time checkpoint：`18f9c456-6a9f-40b5-986e-97e0d77b0534`。
- Mobile：`65b5d320-4413-4507-8194-972f64abdcac`。

### Objects

- App `test-app-001`：v9 Initial JSON / v8 HTML / World v5 merge sample；已执行使用中最终删除，World v6 Draft/旧存档后果已核对。
- Deleted App `test-app-delete-lifecycle-001`：公开详情已 404。
- Character `测试角色 001`：global source 已最终删除；World-local snapshot 与 World/Character Remix 后代仍保留。Source Chat `33c8dcf4...` 已 404，History 仍留链接。
- L1 Character Remix Chat：`9cb26802-ff99-4c4a-b565-538184a2e728`，source 删除后仍可独立运行并持久化。
- L2 Character Remix Chat：`e53f58ad-f97f-430f-87a3-f06e343ce1dd`，source 删除后仍可独立运行并持久化。
- Fresh post-delete World-local runtime：`fd370969-d790-4035-a581-b46b88a9cd15`，v7 Chat Turn 后 v8 Character State 零 Turn迁移。
- Maps：WorldOS 官方 `鬼灭之刃模拟器`、`二战模拟器`、`三国模拟器` 等导入样本。
- Social Simulation `c86047d5-8289-47ea-ad77-173c01db4a90`：`TEST Social Mode Phone 001`，主 Agent 已跑到 Turn 15；Turn 12–15 生成 Memory 3 并继续累积 Grades/Stress/Mood/Style/Clout/日历，后续最终状态没有新增自治 Chat/Instagram 卡。不要重复基础 1–15 Turn，可用于第二账号只读/权限观察。
- Mixed Map fresh v4 Simulation：`05ac8dda-b534-415b-94aa-74ffa3378c00`；旧 v1→v4 migrated save：`10824e9b-4467-42a6-861a-efc0c4ef137c`。

## 当前 PARTIAL / UNKNOWN / BLOCKED

- Character source delete 级联、L1/L2 Chat 和 fresh World Simulation Chat/Character State 均已验证；仍缺非所有者私有访问、Remix 编辑/删除和中间父级删除。
- `TEST App 001` owner-World v6 恢复路径已验证；仍缺其他 owner World、downlist/unpublish 区别和 broken dependency 无人发布 cleanup 时的行为。
- App 删除/下架对其他用户 World 的行为；nested/array Initial JSON merge 冲突；official non-owner detail confirms only the viewer-side absence of owner lifecycle controls (EVD-0132).
- World/Map v4 新旧 save 传播主体已验证；江夏运行态与混合底图已直接观察；仍缺 Maps catalog omission/index、角色化/marker 持久化与冲突（EVD-0131 为控件已测但 reload load-blocked）。
- World Remix 多层 attribution 已验证为直接父链；来源删除、可见性、关闭改编权限和 attribution 断链后的 independent-viewer enforcement 仍 UNKNOWN。
- 新 public L2 `test-map-world-001-k4do` 先进入 owner Profile/Mine、初次精确标题统一搜索未收录；稍后相同完整 World 结果已包含它。异步索引收敛已 VERIFIED，精确 SLA/排序规则 UNKNOWN。
- Independent viewer 权限矩阵：Public/Unlisted/Private、Character/App/Collection、Search/直接 URL/Remix。
- Follow/Unfollow、Like/Unlike、Save/Unsave、Gift 最终副作用和通知深链。
- Collections 完整 CRUD/可见性/删除与 World 关联。
- Social Simulation 自主消息/关系长期阈值；Character Memory/World Memory 10+ Turn 长期召回。
- Social setup 的 `文游小手机` 在美国高中样本中点击 no-op：主账号创建后仍进入自由沙盒；需第二账号/独立浏览器判断是否账号或会话相关。
- 360px/横屏/键盘/touch 长按排序/后台多任务。
- Export 文件实际 schema；当前会员墙 `BLOCKED`。
- 新账号 onboarding、注册验证码、logout/re-auth；BYOK 成功/供应商失败恢复。
- 余额不足、网络/AI/upload/deleted/inaccessible 等错误恢复。

## 第二 Agent 优先调查顺序

1. **独立账号权限矩阵（最高优先）**：对已公开 World/Character/App/Collection 直接 URL、Search、Remix、开始 Simulation，比较 owner/member/匿名行为；不要尝试绕过控制。
2. **App 删除独立 viewer 后果**：非所有者检查公开 World、旧存档可见性、Search/App Market 缓存和 v5 新局 404；不要重新删除其他对象。
3. **Character 删除后的独立 viewer**：观察源角色不可见、World-local/Remix 快照继续可用、L1/L2 Chat 与新 World Simulation；不要再创建或删除同名 source。
4. **World Remix visibility/deletion follow-up**：不要再建同样的 L1/L2；直接使用现有链测试来源删除/可见性、关闭改编权限、Search 索引收敛和父账号通知。
5. **Collections/Follow/Gift/Notifications**：只做测试账号正常社交操作，记录 badge、通知、撤销/取消行为。
6. **Mobile 360px 与键盘/touch**：只做 viewport/交互观察，不再创建大量存档。
7. **Export/Onboarding/BYOK**：停在会员墙/付款前；不要真实 key、付款或账号删除。

## 适合用另一个独立账号验证的内容

- Public / Unlisted / Private / member-only discoverability and direct-link enforcement。
- Remix permission and attribution as a non-owner。
- Search result visibility、Profile draft badges、World/Character/App owner controls。
- Follow/Like/Save/Collection/Gift recipient view、notifications and activity。
- App/Character/World deletion effects from a viewer who is not the owner。
- Locale fallback for anonymous viewer and whether private content leaks through stable URLs。
- `/worlds/american-high-school/new` 的 `文游小手机` setup 选择能否在独立账号正常生效；这是很适合第二账号验证的明确回归点。

## 主 Agent 当前继续调查，第二 Agent 不要撞车

- `TEST App 001` 404 归因主体已闭环；主 Agent仅继续 cross-owner/downlist 与更深 state merge，不要重复 owner v6 恢复实验。
- Character source final delete、descendant Chat 与 fresh World runtime 已由主 Agent完成；第二 Agent只做独立 viewer 权限与中间父级删除观察，避免重复。
- World/Map publish propagation and missing failure states。
- Collections、Social Simulation、Memory 长期行为、Mobile 360px、Export/Onboarding。
- Social 主样本现已到 Turn 15，Memory 在 Turn 6/10/15 生成且 Turn 7 可召回；主 Agent 后续会做 Memory 3 边界 Rewind，不要重跑相同前十五回合。
- 最终页面级控件清单、Missing Feature Audit、Cross-System Audit、Final Completeness Audit 与 Parity Matrix/Test Suite 审计。

## 重要入口与 URL

- Home：`https://worldos.cc/zh-cn`
- Worlds：`/zh-cn/worlds`；Search：`/zh-cn/worlds/search`
- Characters：`/zh-cn/characters`
- Apps：`/zh-cn/apps`；App Creator：`/zh-cn/apps/create`
- Maps：`/zh-cn/maps`
- Mine：`/zh-cn/sims`
- Account：`/zh-cn/account`；World Model：`/zh-cn/account?tab=engine`
- Community：`/zh-cn/community`
- Rewards：`/zh-cn/rewards`
- World Creator：`/zh-cn/worlds/{slug}/edit`
- New Simulation：`/zh-cn/worlds/{slug}/new`
- Simulation：`/zh-cn/sim/{uuid}`
- Evidence index：`docs/research/worldos/07_EVIDENCE_INDEX.md`
- Coverage：`docs/research/worldos/03_RESEARCH_COVERAGE.md`
- Open questions：`docs/research/worldos/06_OPEN_QUESTIONS.md`
- Parity matrix/test suite：`docs/research/worldos/04_WORLDOS_PARITY_MATRIX.md`, `docs/research/worldos/05_PARITY_TEST_SUITE.md`

## 证据写入规则

每条新增证据写入 `07_EVIDENCE_INDEX.md`，包括：测试账号/视角、准确 URL、操作路径、前后状态、Toast/Modal/Error/URL、Confidence、未验证项和下一实验。同步更新 Coverage、Open Questions、Missing Feature Audit 或 Cross-System Audit。不要把 UNKNOWN 写成不存在；不要提交真实付款、充值、API Key 或安全绕过。
