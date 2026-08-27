# Evidence Index

## 证据记录规范

- URL / Route
- 页面与账号状态
- 精确操作路径
- Before / After
- Screenshot / DOM reference
- 时间
- 结论与置信度

## EVD-0001 — 登录态中文首页基线

- Time: 2026-08-21 (Asia/Shanghai)
- URL: `https://worldos.cc/zh-cn`
- Page: WorldOS 首页，桌面端，合法登录态
- Entry path: 直接打开 `https://worldos.cc/`，站点重定向到 `/zh-cn`
- Before: 新建浏览器标签页
- Action: 等待 `domcontentloaded`，采集可访问 DOM
- After / Observed:
  - 左栏：创作、世界、角色、我的、社区、App 市场、地图、升级、分享领电量、历史（世界/角色）。
  - 顶栏：通知、QQ 群、账户按钮。
  - 首页：精选世界 Carousel、搜索世界、创建新世界、推荐/热门/日榜、34 个标签、猜你想玩、最多回合、最新更新、我的世界、模拟过的世界、热门合集、热门创作者。
  - World Card 可见“改编”“立即开始”；部分 World 有地图标记。
  - Footer 含主要导航、社交外链和语言菜单。
- Raw evidence: 当前浏览器会话 DOM snapshot（工具输出）；本地截图待保存为 `evidence/screenshots/EVD-0001-home-desktop.png`。
- Supports: `NAV-001`, `NAV-002`, `EXPLORE-001`, `WORLD-001`, `COLLECTION-001`, `PROFILE-001`, `ACCOUNT-001`
- Confidence: `TESTED` for presence; child behaviors remain `PARTIAL`.

## EVD-0002 — 移动端创作菜单与角色表单入口

- URL: `https://worldos.cc/zh-cn` → 创作菜单 → 创建角色
- Viewport: 默认 in-app viewport 518×543（页面响应式移动布局）
- Observed: 顶部栏折叠为菜单按钮；底部出现探索/我的/创建/社区/App 市场导航；创作菜单显示创建世界、创建角色、创建 App；点击创建角色进入 `/zh-cn/characters?create=1`。
- Screenshot: `evidence/screenshots/EVD-0002-mobile-create-menu.png`

## EVD-0003 — 桌面端首页

- URL: `https://worldos.cc/zh-cn`
- Viewport: 1440×900
- Observed: 左侧固定导航、精选 Carousel、搜索/创建、推荐/热门/日榜与标签、World Cards、账户/电量/历史。
- Screenshot: `evidence/screenshots/EVD-0003-home-desktop.png`

## EVD-0004 — 桌面端创作菜单

- URL: `https://worldos.cc/zh-cn`
- Viewport: 1440×900
- Action: 点击左侧“创作”
- Observed: 菜单含创建世界、创建角色、创建 App；桌面端角色/世界页可见更多导航与筛选控件。
- Screenshot: `evidence/screenshots/EVD-0004-desktop-create-menu.png`

## EVD-0005 — 角色搜索/空结果/筛选

- URL: `https://worldos.cc/zh-cn/characters?create=1`
- Actions: 搜索框输入 `Lisa` 并按 Enter；输入 `zzzz_worldos_no_match_2026` 并按 Enter；切换性别男性/女性。
- Observed: 搜索按 Enter 后结果更新；无匹配显示“还没有角色”；结果可按趋势、近期上升、累计被聊、被收藏、平均回合、复玩、最新、随机排序；时间范围全部/每日/每周/每月；性别筛选会加载后替换结果。
- Confidence: `TESTED`

## EVD-0006 — 角色详情

- URL: `https://worldos.cc/zh-cn/characters?create=1`（同页状态）
- Action: 清除筛选后点击公开角色“德拉科·马尔福”卡片。
- Observed: 同页显示作者 Milian、标签男性/恋爱/科幻/奇幻、4–8 电量/回合说明、评论/排行榜/支持者、聊天、添加到世界；排行榜显示开局数/总轮次。
- Confidence: `TESTED`

## EVD-0007 — 角色关注与收藏

- URL: 同 EVD-0006
- Actions: 点击“关注”；点击 favorite 数字按钮。
- Before: 关注；收藏计数 38。
- After: 文案变为“已关注”；收藏计数变为 39。
- Note: 属于外部账户状态变化；撤销待浏览器动作临界确认后执行。
- Confidence: `TESTED`

## EVD-0008 — 角色表单校验

- URL: `/zh-cn/characters?create=1`
- Actions: 空表单、仅名字、名字+人设、选择 3 类别并尝试第 4 类别。
- Observed: 创建按钮依次禁用、禁用、启用；类别达到 3/3 后第四类别控件 disabled；私有选项标注会员；Komiko 导入空值禁用。
- Confidence: `TESTED`

## EVD-0009 — 头像与捏脸资源选择器

- URL: `/zh-cn/characters?create=1`
- Observed: Emoji 资源；头像库约 360 图并支持按名字/风格/性别/发色搜索；国旗约 242 图并支持搜索国家；壁纸 8 个；场景约 90 个并支持语义搜索；捏脸含 13 个维度和多种画风，生成按钮显示 30 电量且未触发。
- Confidence: `TESTED`

## EVD-0010 — App 市场目录与详情 Drawer

- URL: `https://worldos.cc/zh-cn/apps`
- Action: 等待加载后点击“主输入框”卡片。
- Observed: App 市场说明 App 是可安装到 World 的可组装窗口；卡片显示 creator、使用世界数、评分、分类、收藏、安装；点击卡片打开详情 Drawer，含详情链接 `/zh-cn/apps/main-input`、预览输入建议、发送（预览·操作不会生效）、评分与评论。
- Confidence: `TESTED`

## EVD-0011 — 地图库

- URL: `https://worldos.cc/zh-cn/maps`
- Observed: 有底图/全部/我的、分类标签、搜索地图、每张卡片“查看大图”“用此地图”，卡片链接指向关联 World。
- Confidence: `TESTED`

## EVD-0012 — 社区排行榜

- URL: `https://worldos.cc/zh-cn/community`
- Observed: QQ/微信群接入、创建世界、外链、9 类排行榜指标、WorldOS 支持者、最多人模拟的世界。
- Confidence: `TESTED`

## EVD-0013 — 定价/电量

- URL: `https://worldos.cc/zh-cn/pricing`
- Observed: 每回合消耗电量；新用户赠送/每日领取；一次性加量包 500–110,000 电量，价格 ¥4.9–¥718；订阅、自备 API、国内/国际支付切换；创作者每日可获付费玩家在其世界所耗电量 10%；赞助 $3/$10/$25/$50/$100；购买操作未执行。
- Confidence: `TESTED`

## EVD-0014 — 主 Simulation Turn 1–4 与跨 App 状态

- URL: `https://worldos.cc/zh-cn/sim/d66ac97e-104f-463e-bf3c-9f35d3c6a496`
- Actions: 告诉赫敏秘密；购买魔杖；购买校袍；通过 Chat 私聊赫敏。
- Observed: Wallet `50→43→38`；Inventory 增加魔杖/校袍；World State 的魔杖字段更新；Chat 私信消耗完整 Turn，赫敏记得 Turn 1 秘密，Story 同步整合为猫头鹰来信。
- Confidence: `TESTED`

## EVD-0015 — 独立 checkpoint 与存档槽

- Main URL: `/zh-cn/sim/d66ac97e-104f-463e-bf3c-9f35d3c6a496`
- Turn 2 checkpoint: `/zh-cn/sim/809ca2e8-933b-4814-b9fc-68b19a6a1e3b`
- Observed: checkpoint 是新 Simulation URL；Turn 2 分支 Wallet 43、魔杖存在、校袍不存在；每个 World 3 免费槽，第 4 槽花 80 Credits 增加。
- Confidence: `TESTED`

## EVD-0016 — 存档级动态安装 Shop App

- URL: main Simulation → `添加 App` → 搜索 `商店` → 官方 Shop → 安装。
- Observed: 安装器支持显示名、多店铺/商品、AI 指令、操作提醒、引导文案、独立主题、透明度、背景图；安装后出现 `🛍️` Dock；UI 明示仅当前存档生效、每额外 App +2 Credits/Turn。
- Cost evidence: Deepseek 8/Turn；安装前余额 662，Turn 5 后 652，Turn 10 后 602，即持续 10/Turn。
- Confidence: `TESTED`

## EVD-0017 — 自动 Memory 首次生成与编辑入口

- URL: main Simulation, Turn 4/5/6/8/10。
- Observed: Turn 8 仍显示“暂无记忆”；Turn 10 出现 `✦ 1` 跨 Turn 摘要；Memory 编辑态显示 351 字符上限与“修改会同步给世界的 AI”。
- Note: 摘要出现地点/数量概括偏差，暂不视为权威结构化状态。
- Confidence: `TESTED`

## EVD-0018 — Timeline 历史状态是混合快照

- URL: main Simulation → 事件 → Turn 2 → 查看这一轮的世界状态。
- Observed: Story、Wallet 43、Inventory 只有魔杖、Chat 无 Turn 4 回复，均切换为 Turn 2；但 Turn 10 Memory 和 Turn 4 后安装的 Shop Dock 仍存在。输入被锁定，并提供“从这一轮创建存档点 / 恢复到此状态 / 回到现在”。
- Confidence: `TESTED`

## EVD-0019 — Turn 10 Rewind 前保护存档槽满状态

- URL: main Simulation → 设置 → 创建存档点。
- Name entered: `TEST checkpoint T10 before rewind`。
- Observed: `这个世界的 4 个存档位（含已购 1 个）已全部用完。`；可花 80 增加第 5 槽或删除旧存档。
- Current state: 停在 `增加存档位 · 80` 临界动作前，未执行。
- Confidence: `VERIFIED`

## EVD-0020 — 真实 Rewind 与覆盖式续写

- Main: `/zh-cn/sim/d66ac97e-104f-463e-bf3c-9f35d3c6a496`
- Checkpoint: `/zh-cn/sim/b3bc5be9-fb87-425a-b7ef-90d53f711501`
- Actions: Turn 10 → 恢复 Turn 2 → 新建 Turn 3。
- Observed: Story/Chat/Wallet/Inventory/Character/World State/Events/Memory 回滚；立即可见的 Shop Dock 当时被记录为“保留”；Credits 不退款；旧 Turn 3–10 从主 Timeline 消失；新行动生成新的 Turn 3；checkpoint 保持旧 Turn 10。EVD-0204 后续受控复现实验证明，Rewind 到安装前的 Turn 后该 Dock 可以只是前端残留：动态安装的有效状态和 +2 计费已经移除，reload 后 Dock 消失。因此本条不再支持“App 配置位于不可回溯配置层”的旧推断。
- Confidence: `TESTED`

## EVD-0021 — Character 创建、编辑、会员可见性与改编

- URL: `/zh-cn/characters`
- Object: `TEST Character 001`。
- Observed: 创建表单、3 标签上限、私有会员墙、公开详情 Drawer、4–8 Credits/Turn、编辑异步持久化、改编复制 App 角色配置的明确文案。
- Confidence: `TESTED`

## EVD-0022 — World Remix 完整复制范围

- Source: `/zh-cn/worlds/hogwarts-movie`
- Remix: `/zh-cn/worlds/hogwarts-3bmx`
- Observed: 点击改编立即生成 slug 和 v1；公开页自动 attribution；编辑器复制 10 角色、10 Apps、初始化字段、系统/输赢规则、顾问、布局；Preview 是 Turn 0 只读 Simulation。
- Confidence: `TESTED`

## EVD-0023 — App Studio Draft/Publish/Install Boundary

- App: `/zh-cn/apps/test-app-001`
- Observed: 手写 HTML iframe 可执行交互；配置含 slug/Market/AI/JSON/refresh/Events；草稿 toast；发布生成 v1 详情页；安装器字段齐全；安装到 10-App World 被会员墙阻止。
- Confidence: `TESTED`

## EVD-0024 — Account / Models / BYOK UI

- URL: `/zh-cn/account`
- Observed: profile interests drive recommendations; language options; OpenRouter BYOK and arbitrary OpenAI-compatible gateway; model candidates; per-Simulation model choice; DELETE-gated account deletion.
- Confidence: `TESTED` for UI, external credentials not tested.

## EVD-0025 — 390×844 Mobile Viewport

- Pages: Remix World detail and main Simulation.
- Observed: feature-complete DOM remains present; Chat buttons add initial-avatar treatment; top-level Simulation controls and all Apps remain reachable in responsive layout.
- Confidence: `PARTIAL` pending visual/touch audit.

## EVD-0026 — Mine IA 与 Draft Badge

- URL: `/zh-cn/sims`
- Observed: Works/History; World/Character/Collection/App; created/saved filters; World card shows `有未发布修改`; App card loads asynchronously; History tabs empty despite sidebar simulations.
- Confidence: `TESTED`, empty-history cause unknown.

## EVD-0027 — Collection Create / Link-visible

- URL: `/zh-cn/collections/test-collection-001-g6wi`
- Observed: name/description/tags; Public/Link-visible/Only-me; 100 World limit; own/public-world selection; drag ordering; async save; detail edit/share/delete/favorite.
- Confidence: `TESTED`.

## EVD-0028 — Map Library `Use this Map`

- URL: `/zh-cn/maps`
- Observed: map assets are associated with Worlds; dialog can create a new World from the entire map or install it into an existing World; new map remains editable in Creator.
- Confidence: `TESTED` for entry flow, post-install lifecycle pending.

## EVD-0029 — World v1 → v2/v3 与既有 Simulation 更新提示

- World: `/zh-cn/worlds/hogwarts-3bmx`
- Editor: `/zh-cn/worlds/hogwarts-3bmx/edit`
- v1 Simulation: `/zh-cn/sim/10824e9b-4467-42a6-861a-efc0c4ef137c`
- Actions: v1 时创建 Turn 0 Simulation；发布 v2；刷新旧存档；选择 `暂不更新`；发布 v3；刷新旧存档；触发 `应用更新`。
- Before: Simulation 设置显示 World `v1`。
- Observed:
  - v2 更新块包含版本标题、更新日志、应用/暂缓按钮和合并语义说明。
  - `暂不更新` 后 v2 提示在刷新后仍隐藏。
  - 发布 v3 后，v1 存档重新收到提示且目标直接为 v3。
  - `应用更新` 用鼠标和 Enter 均未落地；再次打开仍是 v1 + 相同 v3 提示，无 toast。
- Supports: Version notification policy, latest-version targeting, decline semantics, and a reproducible apply-update no-op.
- Confidence: `TESTED` for observed UI/state behavior; successful merge semantics remain `UNKNOWN`.

## EVD-0030 — Published Map Simulation 的地区状态传播

- Source World: `/zh-cn/worlds/demon-slayer-simulator`
- Simulation: `/zh-cn/sim/074a3697-46bc-48c7-8c55-aa2308bbb948`
- 操作路径：打开地图 Dock → 点击北海道 → 记录威胁值/邻区 → 点击 `🏮 巡逻` → 等待世界回应 → 打开事件和 Map Drawer；随后点击邻区青森并提交自定义行动 `调查青森港的鬼患线索`。
- Observed:
  - Drawer 初始显示北海道/鬼/威胁 82（Story 中此前基线描述为 85）；巡逻完成后事件 Delta 显示 `p1.threat -3`、Wallet `balance +25`、Wallet transaction、Bounty Board 第一项变为 `done`、Gear 新增“鬼的灰烬余烬”。
  - 继续等待自动世界回应后，北海道再次显示威胁 78；事件 Delta 显示 `p1.threat -4`，Wallet 再增加 40，Inventory 新增“染血的布袋”和“第二头鬼的灰烬”。
  - 邻区按钮只切换 Drawer；青森显示威胁 70、接壤秋田/岩手。
  - 自定义地区输入使 `行动` 从 disabled 变为 enabled，提交后回合进入 3，输入、商店和多数 App 操作在生成期间锁定；最终 Delta 为 `p2.threat -6`、`Hokkai → Aomori`、Wallet +50/transaction、Gear +“黑篷船管事钥匙”、Demon Hunts `bounties.1.status`。
  - 当前三次地图行为的时间标签仍为 `1912年·初夏`，时间是否在其他地图行动中推进仍为 `UNKNOWN`。
- Supports: Map App 是 Simulation 内可操作的状态系统；地区状态不仅读出 World 数据，还能驱动 Turn、Story、Events、Wallet、Inventory 和任务 App 的联动；自由文本和快捷操作共用 Turn 引擎。
- Confidence: `TESTED` for observed propagation and custom-action delta; time advancement remains `UNKNOWN`.

## EVD-0031 — World Version 成功向既有 Simulation 增量安装/移除 App

- World: `/zh-cn/worlds/test-map-world-001-rxwf`
- Existing Simulation: `/zh-cn/sim/97dc81bc-b3de-4123-9c2a-2952d9e9282c`（v1、Turn 1）
- App: `/zh-cn/apps/test-app-001`
- Actions: 安装 App 到 World 草稿 → 发布 World v2 → 旧 Simulation 应用更新 → iframe 交互 → World 草稿卸载 App → 发布 v3 → 旧 Simulation 再次应用更新。
- Observed:
  - v2 更新前存档只有主输入/Story/Map；接受 v2 后设置显示 `v2`，出现 `🧩` Dock 和 App v2 iframe。
  - iframe 按钮使 `Ready v2 → Clicked v2`，但 Turn 保持 1。
  - World v3 卸载 App 后，旧存档在接受更新前仍保留 App；接受 v3 后 App 窗口和 Dock 均消失，原 Story/Turn 未重建。
  - 证明 World Version 合并可以成功，并可执行 App add/remove；Hogwarts 样本 no-op 不是通用机制。
- Confidence: `TESTED`。

## EVD-0032 — App `存草稿` 会创建公开版本

- App: `/zh-cn/apps/test-app-001`
- Actions: 已发布 v1 上修改 HTML/更新说明 → 点击 `存草稿`；再从 v2 重复一次。
- Observed:
  - 首次操作后公开详情新增 v2、更新日志和 v2 在线试玩；第二次操作后新增 v3，公开在线试玩立即切换为 `Ready v3 draft-only`。
  - 编辑器刷新保留 HTML；更新说明在保存后清空并写入版本日志。
  - 因此既有 Published App 的 `存草稿` 实际具有公开发布副作用，按钮标签与行为不一致。
- Confidence: `VERIFIED`（连续两次版本递增）。

## EVD-0033 — Character 两层 Remix 与 attribution 缺失

- Original: `TEST Character 001`。
- Copies: `TEST Character Remix L1`、`TEST Character Remix L2`。
- Actions: Original → 改编 → 保存为我的角色；L1 → 改编 → 再次保存；Mine → 角色 → 我创建的复核。
- Observed: 两层副本同时存在；继承公开简介、标签与成本，允许继续 Remix；详情作者为当前账户，但未展示“改编自”或原角色链接。Remix 详情也未显示原 owned Character 的编辑/删除入口。
- Confidence: `TESTED`。

## EVD-0034 — Creator 题材模板选择器与社区/Profile 结构

- World Editor: `/zh-cn/worlds/test-map-world-001-rxwf/edit`
- Template action: 点击 `题材模板` 打开 modal，枚举模板：现代恋爱、校园青春、修仙、武侠江湖、宫斗、穿越异世界、爱豆偶像、西幻冒险、末日生存、赛博朋克、战争政权；每项同时显示预设字段摘要，如“出身层区 · 义体改造 · 营生 · 与巨企的恩怨”。
- Observed: 选择“赛博朋克”后编辑器进入 `正在自动保存…`，但当前旧地图 World 未显示新增初始化字段文本；可能模板只对特定新建 World 生效，或字段组件未在现有草稿重渲染。应用范围记为 UNKNOWN，未将该旧 World 草稿发布。
- Community `/zh-cn/community`: QQ 群扫码、微信号复制、创建世界 CTA、外部社交链接；排行榜可切换玩家模拟回合/模拟世界数、创作者被模拟次数/总回合/收藏数/作品数/累计收益/收到打赏、WorldOS 支持者。
- Public Profile `/zh-cn/profile/{uuid}`: 显示性别、加入日期、关注者、创作者统计（创建世界、启动数、累计回合、关注者）、玩家统计（开局数、游玩回合）、常玩题材及数量、创建的世界、最常玩的世界。
- Confidence: Template entry/list `TESTED`; actual template application semantics `UNKNOWN`; Community/Profile structure `TESTED`。

## EVD-0035 — Unified Search 的类型结果与空结果

- URL: `/zh-cn/worlds/search`
- Actions: 输入 `霍格沃茨`，等待 debounce；观察全部结果；输入 `x161880`；输入 `ZZZ_WORLDOS_NO_MATCH_20260821_X`。
- Observed:
  - 搜索框 placeholder `搜索世界、角色、用户…`，结果页自动写入 URL `/worlds/search?q=...`，不需要 Enter。
  - 类型 tabs：`全部 / 世界 / 角色 / 用户 / App`。
  - `霍格沃茨` 的全部结果按区块返回世界（4 项）、角色（1 项）和 App（3 项）；世界卡片可改编/立即开始，角色卡片可聊天/添加。
  - `x161880` 返回用户区块及 `/profile/{uuid}`，显示世界数、回合数、关注者。
  - 无匹配串显示 `暂无匹配结果`，并保留类型 tabs；最近搜索会在无输入初始页展示，可清除。
- Supports: 统一搜索不仅是 World 搜索，而是跨对象发现入口；query state 可深链/回放。
- Confidence: `TESTED`。

## EVD-0036 — World 可见性/改编权限墙与权限持久化待定

- World Editor: `/zh-cn/worlds/test-map-world-001-rxwf/edit`
- Clicking `不公开列出 会员` or `私有 会员` on a free account opens the subscription wall, listing paid plans and explicitly including “把你的世界和角色设为非公开” and “每个世界不限 App 数量（免费版最多 8 个）”. No state change occurs.
- Clicking `不允许` for 改编权限 changes the editor toggle and auto-save state; however, a subsequent publish/reopen test produced a new Remix editor (`/zh-cn/worlds/test-map-world-001-gytp/edit`) when the public page’s first `改编` button was activated. Because this may have targeted a related-world card or because the permission draft was not persisted before publish, the actual public enforcement remains `UNKNOWN`.
- Do not infer permission enforcement from the toggle alone; repeat with a fresh minimal World and an independent viewer/account if available.
- Confidence: membership wall `TESTED`; persistence/enforcement `UNKNOWN`.

## EVD-0037 — App 删除确认状态

- App: `/zh-cn/apps/test-app-001`
- Action: 详情页点击 `删除`，等待使用情况检查。
- Observed: UI 先显示 `正在检查使用情况…`，随后出现“删除这个 App?”确认区、不可恢复警告、`取消`与`删除`按钮；点击取消返回详情页，App/版本没有变化。
- Confidence: `TESTED` for confirmation lifecycle; final deletion and installed-world impact intentionally not executed pending action-time confirmation.

## EVD-0038 — World 分享 Composer 与通知空状态

- World detail → `分享` opens a composer with aspect ratios `4:5 / 1:1 / 9:16`, generated poster preview, `保存海报`, `复制链接`, `复制文案`, X intent link and OS `更多分享方式`.
- The generated X intent includes title, description, `#WorldOS` and canonical World URL.
- Composer explicitly links sharing to rewards: “附上海报、带 #WorldOS 话题发布到社交平台，即可回来领取电量奖励。” and `去领取 → /zh-cn/rewards`.
- Global `通知` button opens a modal; current account shows empty state `还没有通知`.
- Confidence: `TESTED` for UI and empty state; no external social post was sent.

## EVD-0039 — Account Settings / BYOK / Delete Gate

- URL: `/zh-cn/account`
- Observed tabs and fields: profile (avatar, username, bio, gender, interests, save), preferences (English/Español/中文), world model (OpenRouter BYOK explanation and model catalog), presets (empty), account danger zone.
- World model copy says BYOK simulations do not consume Zaps; current free account key field is disabled and no external key was entered.
- Account deletion page states it permanently deletes account, Worlds and simulations; exact `DELETE` text is required and delete button is disabled before matching input.
- Confidence: `TESTED` for UI/boundary; external key validation and final deletion not executed.

## EVD-0040 — 390×844 Mobile Creator Shell

- URL: `/zh-cn/worlds/test-map-world-001-rxwf/edit` at explicit 390×844 viewport.
- Observed: top compact header (`菜单`, Credits, notifications, account); bottom nav (`探索 / 我的 / + / 社区 / App 市场`); Creator retains `发布 v5`, `题材模板`, `安装 App`, visibility, App cards, preview device control and layout designer.
- Live preview is stacked vertically with map, action panel and Dock; `scrollWidth=382` vs `innerWidth=390` after reload, no horizontal overflow in sample.
- Confidence: `TESTED` for reachability/layout; touch gestures, keyboard behavior and long-form scroll remain partial.

## EVD-0041 — Simulation Event Export Membership Boundary

- Simulation: `/zh-cn/sim/074a3697-46bc-48c7-8c55-aa2308bbb948`
- Path: Events → `导出交互记录`.
- Observed: free account receives membership wall `导出模拟记录是会员功能`; plan benefits explicitly list Markdown / HTML / TXT export. No download or format chooser is available before subscription.
- Adjacent finding: the previously pending Map custom action completed with full Delta (`p2.threat -6`, movement, Wallet +50, item and bounty update).
- Confidence: export boundary `TESTED`; actual generated file schema `BLOCKED` by membership/payment boundary.

## EVD-0042 — Character Chat Is a Turn-Consuming Cross-App Action

- Simulation: `/zh-cn/sim/074a3697-46bc-48c7-8c55-aa2308bbb948` at Turn 3.
- Path: open Chat Dock → select `富冈义勇` → type `你知道青森港黑篷船的线索吗？` → send.
- Observed: header advanced to Turn 4; main input, Chat input, store and other controls locked while `世界正在回应…`; character replied in Chat; a `新消息` block records the player message; Story/Map/Wallet did not visibly change in this response.
- Supports: Chat is not a free local side-panel; it enters the same Turn engine and may provide context without necessarily producing a World State Delta.
- Confidence: `TESTED`。

## EVD-0043 — Shop Purchase Runs Through Turn Engine

- Simulation: `/zh-cn/sim/074a3697-46bc-48c7-8c55-aa2308bbb948`, Turn 4 → 5.
- Action: click first `购买` for Travel Rations at ¥20.
- Observed: full Story scene generated; Event action `Travel Rations`; Gear `+ 旅行干粮 ×2`; Wallet Event `balance -20`; Shop stock `×10→×9`; Inventory gained stack quantity 2; header advanced to Turn 5.
- Repeated at Turn 5→6: balance again fell 105→65; stock 9→8; a second independent `旅行干粮 ×2` Inventory stack appeared and two more -20 records were added.
- Stable rule in this sample: one click consumes one Turn and one Shop stock unit, while AI purchases two inventory units and charges the displayed ¥20 twice. Whether the label is “per unit” or misleading is still a copy/schema question.
- Confidence: propagation and repeated accounting `VERIFIED`; price-label semantics `UNKNOWN`.

## EVD-0044 — Stats and Relationship Runtime Schema

- Simulation: Demon Slayer sample at Turn 6.
- Stats App fields: numeric `呼吸造诣/剑术/全集中/感知/体能/功绩声望/斩鬼数`; enum/text fields `阶位`, `呼吸流派`, `出身`, `日轮刀`, `鬼杀队斑纹`, `羁绊`, `伤势`, `心志`.
- Character State App exposes every World character with shared `好感`, `信赖`, `羁绊`, `心境`. Untouched characters are commonly 5/5; 富冈义勇 after Chat is 6/12 with `前辈 · 水柱`; 鳞泷左近次 starts 25/30 with `你的育手`.
- Supports: World Characters have persistent runtime relationship state separate from their creator definitions, shared across Chat and Character State Apps.
- Confidence: `TESTED`.

## EVD-0045 — Memory Trigger Varies by World/Content

- Hogwarts sample: no memory through Turn 8; first `✦ 1` at Turn 10.
- Demon Slayer Map sample: first `✦ 1` visible at Turn 6.
- Turn-6 summary spans Map movement/battles, Wallet, Inventory, Chat, Shop purchases and Stats, proving cross-App compression and disproving a universal fixed Turn-10 trigger.
- Summary contains lossy/normalized values (`功绩累计至110円`, translated stat names) and should not be treated as authoritative state.
- Confidence: variable threshold `VERIFIED` across two Worlds; exact trigger algorithm `UNKNOWN`.

## EVD-0046 — Map Library `我的` Uses Published Map Assets

- URL: `/zh-cn/maps`
- Account owns `TEST Map World 001`, whose Creator Draft has a 47-region Map but the initial published version had no Map data.
- Search for the World title and `我的` tab both show `暂无地图`; public map-enabled Worlds populate the default tab.
- Supports: Map Library is not “all owned Worlds with a Map editor”; it indexes published/usable Map assets. A Draft-only Map is excluded.
- Confidence: `TESTED`; inclusion after a confirmed map-data publish remains pending.

## EVD-0047 — App Market 72-card catalog snapshot

- URL: `/zh-cn/apps`; scroll-loaded 72 observed cards.
- Official/core observed: 49 modules including input, Story, Time, Chat, CG, World/Character State, Quest, Inventory, Visual Novel, Dice, Equipment, Map/RPG Map, social-media variants, Wallet, Browser, Email, Forum, Music, Shop, family/development trees, calendars, evidence board, 3D scene and mini-game modules.
- Community snapshot: 23 cards including News, Weibo, campus anonymous board, relationship graph, health/payment/delivery/diary/store and themed Hogwarts Apps.
- Cards expose creator, worlds-in-use, rating, categories, favorite and install; behavior is not inferred from marketing copy.
- Confidence: catalog presence `TESTED` for loaded snapshot; exhaustive future pagination and individual runtime behavior remain `PARTIAL`.

## EVD-0048 — Authentication Forms and Registration Boundary

- URL: `/zh-cn/login` even while another tab session is authenticated.
- Login mode: Google button, email, password, forgot password, login, switch-to-register.
- Register mode: email, password, confirm password, optional invitation code, register, switch-to-login.
- Forgot mode: email, `发送验证码`, return login.
- No credentials/code were submitted and no additional account was created.
- Confidence: `TESTED` for form modes; actual auth/onboarding/session behavior `UNKNOWN`.

## EVD-0049 — Global Account Menu

- Logged-in header account button opens menu: `查看主页`, `账号设置`, `购买电量`, `赚电量`, `加入 QQ 群`, theme `跟随系统`, language, `退出登录`.
- Logout was not activated, preserving the authenticated testing session.
- Confidence: `TESTED` for menu/entry points; logout result `UNKNOWN`.

## EVD-0050 — App Creator Invalid JSON Boundary

- New App `/zh-cn/apps/create`: set name/slug, direct HTML and initial JSON `{ invalid-json `.
- `存草稿` succeeded with toast `草稿已保存。`; no JSON error was shown.
- After reload, JSON field normalized to `{}` while HTML/name metadata remained. Required validation only appeared when HTML was absent: `保存前需要先有名称和可用的 HTML。`
- Confidence: `TESTED`; whether malformed input is silently discarded or repaired internally remains `UNKNOWN`.

## EVD-0051 — World Quality Guide and Mine History Management

- Quality route: `/zh-cn/worlds/quality-guide`, linked from `/zh-cn/sims` Works.
- Public scoring rules: Craft hard gates + 145-point score/80 threshold; Popular 110-point score/55 threshold; feature badges by configured Apps.
- Self-checker on `TEST App Upgrade World 001`: Craft `3.33 / 145`, Popular `0 / 110`; configured-App ratio `3.33/10`.
- Mine History shows five Simulation records with World, Turn and date; `更多` offers `重命名` and `删除`. Character filter displays a specific empty-state copy when no Character-bound saves exist.
- Confidence: quality rules `TESTED`; Mine History IA/actions `TESTED`; deletion final effects not executed.

## EVD-0052 — Character Added to World Draft

- Character: `TEST Character 001`; target: `TEST App Upgrade World 001`.
- Detail `添加到世界` selector lists owned Worlds and supports naming a new World.
- After selecting target and refreshing Creator, the Character appears with copied full prompt, gender, display-identity field and player-customizable toggle.
- The change is a World Draft; public/runtime propagation requires World publish.
- Editing the World-local prompt did not change the source Character detail after refresh, confirming one-way copy independence.
- Confidence: `TESTED` for copy-to-Draft; source update/delete relation `UNKNOWN`.

## EVD-0054 — Character Delete Native Confirmation

- Character detail owner trash control has accessible title `从你的角色库中删除这个角色?`.
- Clicking it triggers a native browser `confirm`; action was dismissed without deletion.
- Exact browser message is unavailable through current control API; final deletion and World-bound effects remain untested.
- Confidence: `TESTED` for confirmation gate.

## EVD-0055 — Global Create Menu and Sidebar History Semantics

- Global `创作` modal contains Create World, Create Character and Create App; it has no Map item.
- Sidebar `历史` → World lists the same saved Simulation names/Worlds/Turns visible in Mine; Character shows a Character-save empty state on this account.
- Both are in-place filters; URL stays unchanged.
- Confidence: `TESTED`.

## EVD-0056 — World Detail Statistics Semantics

- Target World detail visually shows: play triangle `1`, Turn/message icon `1`, Remix-branch icon `1`, and separate heart favorite `0`.
- Simulation Settings labels first two as `模拟次数` and `回合数`; exactly one known Remix exists, matching branch `1`.
- Discovery cards with ratings expose accessible text like `4.7 / 5 · 83`; rating is not the same as total-Turn or Remix count.
- Confidence: `TESTED`.

## EVD-0057 — Published App Draft Isolation and v4 Publish Inconsistency

- App: `/zh-cn/apps/test-app-001`, editor `/zh-cn/apps/create?slug=test-app-001`.
- Changed HTML to explicit v4 markers and clicked `存草稿`; toast said `草稿已保存。`, but the public detail iframe immediately rendered v4 before the separate Publish action.
- The previously visible v1–v3 update-log section disappeared. Clicking the separate `发布` button produced no success toast or navigation; public v4 HTML remained, and no v4 log appeared.
- Supports: for an already-published App, draft HTML is not reliably private; save/publish/log semantics are inconsistent and cannot be modeled as a conventional isolated draft without reproducing this behavior or intentionally correcting it.
- Confidence: public iframe propagation `TESTED`; backend version-number mutation and exact defect cause `UNKNOWN`.

## EVD-0058 — World v3 Consumes App v4 and World-local Character

- World: `/zh-cn/worlds/test-map-world-001-gytp`; v3 title `App v4 + Character baseline`.
- Public v3 lists `TEST Character 001` plus Main Input, Story, Map and `TEST App 001`; its version log preserves v1/v2/v3 and the supplied changelog.
- New Simulation: `/zh-cn/sim/26faf299-fb09-42fe-b60b-4e0525a48427`; Turn 1 `🧩` Dock iframe renders `Ready v4 own-upgrade / Version 4 own App update propagation`.
- World detail cost stayed `7–16 Credits/Turn` from v2 to v3 despite adding one community App and one Character.
- Confidence: World publish, new-consumer App v4 and published Character/App composition `TESTED`; existing-Simulation App hot-upgrade remains `UNKNOWN`.

## EVD-0059 — Genre Template Materializes Full Player Fields

- Route: clean `/zh-cn/worlds/create`; selected `题材模板 → 西幻冒险`.
- Immediate Creator result: four complete field editors, not just labels: `种族/race`, `职业/class`, `出身/origin`, `信念/creed`, each with curated quick options and `{{variable}}` reference help.
- Default answer, use-Character-list, multiline and required controls are present per field.
- The default six Apps and blank visible system prompt remained unchanged; the chooser remained open after applying the template.
- Confidence: field creation and schema `TESTED`; multi-template merge and published `/new` persistence `UNKNOWN`.

## EVD-0053 — 360×740 Simulation Responsive Boundary

- Simulation: `/zh-cn/sim/97dc81bc-b3de-4123-9c2a-2952d9e9282c`.
- Viewport: explicit 360×740; `innerWidth=360`, `scrollWidth=360`, no horizontal overflow.
- Top controls, version update prompt, Map/search, suggestions, action composer and Dock remain reachable; Settings exposes font size and `文字速度 100%`.
- Search route in the same session failed to honor viewport override and stayed 1280px; Search mobile behavior remains `UNKNOWN`.
- Confidence: Simulation `TESTED`; Search `UNKNOWN`.

## EVD-0060 — Multiple Genre Templates Append Player Fields

- On the same clean Creator after applying `西幻冒险`, applied `赛博朋克` from the still-open chooser.
- The original four fields (`种族`, `职业`, `出身`, `信念`) remained intact with their variables/options.
- Four additional fields were appended: `出身层区` (corporate tower / middle apartment / slum / drifting ship / wasteland), `义体改造` (original human through full cybernetics), `营生` (hacker / mercenary / underground cyberdoc / intel broker / corporate worker / cyber influencer), and `与巨企的恩怨` (loyalist / fired-blacklisted / wanted / neutral / undercover).
- The chooser disabled the already applied western-fantasy card but left cyberpunk selectable, providing a UI signal that template application is additive and per-template at this stage.
- Confidence: append/no-replace semantics `TESTED`; published `/new` persistence `UNKNOWN`.

## EVD-0061 — App v5 Hot-Updates an Existing Simulation Without World Versioning

- Existing World v3 Simulation: `/zh-cn/sim/26faf299-fb09-42fe-b60b-4e0525a48427`, initially rendered App v4 and retained header `TEST App v4 Simulation 001`.
- After editing/saving App v5 (`Ready v5 existing-save / Version 5 existing Simulation propagation`), public App detail showed v5 and a v5 update-log entry.
- The World Creator still showed `发布 v4`; public World stayed v3 with unchanged World version records. The existing Simulation received no World update block, no prompt and no Turn cost.
- Its App iframe changed to v5 immediately; forced reload retained v5 and removed v4 text. This is a true cross-system hot update keyed by App identity/latest content, not World-version application.
- Unknown: whether AI instruction, initial JSON, refresh prompt and event-template metadata hot-update with the same mechanism.
- Confidence: iframe HTML propagation `TESTED`; full App configuration propagation `UNKNOWN`.

## EVD-0062 — App v6 AI Instruction and Event Template Hot-Update

- Existing Simulation `26faf299-fb09-42fe-b60b-4e0525a48427` had already consumed App v5.
- App v6 saved new visible HTML, AI instruction (`CONFIG_V6`), initial JSON (`status=CONFIG_V6`, `configMarker=AI_JSON_V6`) and Event templates (`CONFIG_EVENT_V6`).
- Existing App `refresh` advanced exactly one Turn (1→2) and kept the existing Story context.
- Events drawer for Turn 2 showed `🧩set CONFIG_EVENT_V6 status`, `🧩set CONFIG_EVENT_V6 configMarker`, and `🧩push CONFIG_EVENT_V6`, proving AI/Event configuration latest content reached the existing Simulation without World version update or an update prompt.
- Because the AI instruction explicitly requested the same fields, this does not isolate Initial JSON's contribution; treat Initial JSON semantics as `UNKNOWN`.
- Confidence: AI instruction/Event template hot-update `TESTED`; initial JSON independent propagation `UNKNOWN`.

## EVD-0063 — World Detail Remix Attribution, Owner Controls and Save Surface

- URL: `/zh-cn/worlds/test-map-world-001-gytp` (authenticated owner view).
- Public detail shows title `测试应用升级世界 001`, type `策略`, map marker, owner profile, follower/world count, and visible stats (play count, turn count and Remix branch count as separate values).
- The page renders `改编自 测试地图世界 001 · x161880`, confirming Remix attribution is shown on the child detail page and links back to the source World.
- Owner-only controls are `继续模拟`, `继续编辑`, `删除世界`, `改编`, favorite count, `加入世界合集`, and a `你的存档` list with simulation name, turn/date plus `重命名` and `删除` actions.
- Cost range is displayed as `7–16 电量 / 回合`; an adjacent explainer says cost depends on model strength and World complexity (Apps, Characters, context length).
- Confidence: attribution/owner controls/save surface `TESTED`; deletion propagation and independent-viewer enforcement remain `UNKNOWN`.

## EVD-0064 — Global Character and World-local Character Are Separate Editable Copies

- URL: `/zh-cn/characters?create=1` with search `TEST` and the authenticated account.
- Search returned two `测试角色 001` records: one global card with `保存角色` and owner-delete control; one World-local card labeled `测试应用升级世界 001` with `编辑`.
- Opening the global card detail exposed `编辑`, `从你的角色库中删除这个角色?`, `改编`, and `添加到世界`; the editor shows name, full prompt, public intro, gender, max three categories and visibility (`公开` / member-only `私有`).
- The World-local card exposes its own edit action, while the global source card remains separately addressable. This supports a copied definition model rather than a single shared mutable record; source-to-copy update/delete propagation is still `UNKNOWN`.
- Confidence: dual-record/UI separation `TESTED`; backend relationship semantics `UNKNOWN`.

## EVD-0065 — Official Time App Capability Contract Exposed in Install Drawer

- URL: World Creator `/zh-cn/worlds/test-map-world-001-gytp/edit` → `安装 App` → select `时间`.
- The official App drawer describes a floating clock that tracks the world's current `now`; it supports jumping to the next big event, skipping from one hour up to one year, and typing an arbitrary date.
- The description explicitly says the world simulates everything that happens between the current and target time, and `回溯时间` opens the history of past events. It names long-span use cases (raising a child, building an empire, romance over a lifetime).
- Before installation the World draft remains unchanged; the drawer has a single `安装` action and the App is not yet in the installed list.
- Confidence: documented product-level capability and pre-install boundary `TESTED`; exact configuration fields, time delta semantics, and event propagation require installation/runtime experiments.

## EVD-0066 — Time App Public Detail and Preview Controls

- URL: `https://worldos.cc/zh-cn/apps/time`.
- Public detail shows official creator WorldOS, `核心`/`系统` categories, 47 favorites, `送礼`, `安装`, a usage link (`37016 个世界在用`), rating state, comments and a “用了这个 App 的热门世界” carousel with each World offering `改编` and `立即开始`.
- The embedded online preview opens a right-side time panel titled `时间线 · 1215 年春`, with `回溯时间（查看历史）`, `跳到下一个大事件`, `+1 天`, `+1 月`, `+1 年`, a date input `跳转到指定时间…` plus `前往`, and a bottom previous/current/next timeline control. The preview is explicitly labeled `预览 · 操作不会生效`.
- Clicking the preview fast-forward coordinates collapsed the panel and left the coarse visible label `1215 年春` unchanged; no persistent side effect or reliable date delta was observable in the public preview. Treat actual elapsed-time behavior as `UNKNOWN` until installed in a real Simulation.
- Confidence: detail/preview control inventory `TESTED`; preview mutation result `UNKNOWN`.

## EVD-0067 — Unified Search Mobile Route and Result Sections

- Route: `/zh-cn/worlds/search` under an explicit 390×844 viewport request.
- Empty search state shows a compact `返回` button, unified placeholder `搜索世界、角色、用户…`, `最近搜索` with `清除`, and `热门标签` plus a populated `热门世界` feed.
- Query `TEST` after Enter exposes type tabs `全部/世界/角色/用户/App`; results are grouped by headings with `查看全部` controls. The same query returned World, Character and User sections, including both global and World-local `测试角色 001` records and user metrics (`世界/回合/关注者`). No App section was present for this query.
- The explicit viewport override was not honored by this Search route in the current in-app browser: page evaluation reported `innerWidth=1280` and `document.body.scrollWidth=1272`, although no horizontal overflow was reported. Mobile Search behavior therefore remains a responsive boundary `UNKNOWN` despite the mobile IA being visible in the DOM.
- Confidence: Search grouping/empty state `TESTED`; true 390px rendering and touch behavior `UNKNOWN`.

## EVD-0068 — Search Full-Result Filters, Sorts and URL State

- Route after a grouped-result `查看全部`: `/zh-cn/worlds/search?q=TEST&tab=worlds`.
- Full World results expose query/type tabs (`全部/世界/角色/用户/App`), a long genre tag row, audience options `所有/男性向/女性向/全性向`, an `Apps` filter, `排序`, and `时间范围`.
- Sort list options and their visible descriptions: `趋势` (近期上升最快), `最多游玩` (累计游玩最多, default), `最多回合` (累计回合数最多), `高评分` (玩家评分最高), `最投入` (单局平均回合最多), `最多复玩` (回头重开的玩家最多), `改编最多` (被其他创作者改编最多), `最新` (最近新增), `随机` (换一批看看).
- Time range list: `全部时间`, `每日`, `每周`, `每月`.
- Query and selected tab are encoded in the URL; filters remain UI state and return World cards with `改编`/`立即开始` actions.
- Confidence: filter/sort inventory and URL semantics `TESTED`; ranking algorithms remain `UNKNOWN`.

## EVD-0069 — Mine Created App Visibility and Install-to-World Selector

- Route: `/zh-cn/sims` → `作品` → `我创建的`.
- The account's created-App list contains `TEST Invalid JSON App 001` and `TEST App 001`; both cards are labeled `未公开`, show creator `x161880`, Worlds-in-use counts (0 and 1), category tags and `收藏`/`安装` actions. This differs from the App detail page being directly viewable and from the App running in a World, so “未公开” is a marketplace/listing state requiring further semantics.
- Clicking the App card's `安装` opens a non-committing dialog `安装到世界` listing owned Worlds (`TEST App Upgrade World 001`, `TEST Map World 001`, `TEST World 001`) plus `给新世界起个名字…`; the final action button is disabled until a target is selected/created.
- No App was installed by this inspection.
- Confidence: Mine App state and selector `TESTED`; exact visibility meaning and install commit behavior `UNKNOWN`.

## EVD-0070 — Account BYOK Pricing Modal and Payment Boundary

- Route: `/zh-cn/account` → `世界模型` → `查看自备 API`.
- The account page explains that a BYOK subscription unlocks OpenRouter key entry, extra/free models and zero-Zaps simulation; the key field is disabled before purchase.
- The pricing dialog has tabs `一次性`, `订阅`, `自备 API`, an international-card toggle, a `¥19.9 / 30 天` offer, `购买 30 天`, Stripe payment text, estimated-turn disclaimer and a `免费赚电量 →` handoff. It explains post-purchase flow: enter key in Account → World Model, select models and switch inside Simulation Settings.
- No purchase or key submission was attempted. The dialog was closed with `取消`.
- Confidence: BYOK entitlement/payment boundary `TESTED`; real purchase, key validation and model invocation `UNKNOWN`.

## EVD-0071 — Search App Type Filter and Exhausted Results

- Route: `/zh-cn/worlds/search?q=时间&tab=apps` after selecting the `App` type tab.
- App-specific facets replace World facets: `全部`, `核心`, `社区`, `社交`, `角色`, `叙事`, `经济`, `系统`, `成长`, `资讯`, `任务`, `音频`, `悬疑`, `科幻`, `奇幻`, `恋爱`, `策略`, `历史`.
- The query returned three App records: official `时间` (WorldOS, ~37,020 worlds in current session), community `时空棱镜` (World101, 54 worlds) and `爱豆活动` (Evan, 6 worlds). The page ends with `没有更多啦`, indicating the current result set is exhausted rather than paginated indefinitely.
- App type result cards expose icon, title, creator/usage, description and category tags; clicking the title text alone did not open a drawer in this surface (detail navigation remains via App Market/card-specific affordance).
- Confidence: App search facets/result exhaustion `TESTED`; ranking algorithm `UNKNOWN`.

## EVD-0072 — Mine History Turn Label Can Lag World Detail

- Same account and Simulation `/zh-cn/sim/26faf299-fb09-42fe-b60b-4e0525a48427`.
- Public World detail `/zh-cn/worlds/test-map-world-001-gytp` showed the save as `回合 2` after the App v6 refresh Turn.
- `/zh-cn/sims` → `历史` listed the same Simulation as `TEST App v4 Simulation 001 … 回合 1` with the same date; the global sidebar History also showed Turn 1.
- Mine history exposes `更多` → `重命名` / `删除`; no mutation was executed. The mismatch is evidence of asynchronous/cache lag or a different “last saved” semantic and must be modeled as `UNKNOWN` until refresh/close/reopen experiments isolate it.
- Confidence: label mismatch `TESTED`; cause `UNKNOWN`.

## EVD-0073 — Social World New-Simulation Setup and App Composition

- Route: `/zh-cn/worlds/american-high-school/new` (public World, no Simulation started).
- The pre-start screen renders World opening prose and explicit social-simulation claims: weekly progression, six numeric dimensions (popularity, grades, mood, style, allowance, stress), group chats, information feed, crush/relationship arcs and no win/lose condition.
- It enumerates the World’s Apps before start: `主输入框`, `主线故事`, `世界状态`, `角色状态`, `Instagram`, `聊天`, `列表/背包`, `时间`, `过场CG`, `任务`.
- Player setup has optional save name, player name (blank=random), and “入学时你的气质/路线”; a disabled `另存为人设预设` until a name/identity is present.
- Two World-authored Characters are editable before start. Each provides `保存到角色库`, `从角色库选择`, `展开完整编辑`, avatar, name and prompt text; this is distinct from generic `/new` setup.
- UI mode is selectable before start: `自由沙盒` (each App independent draggable window) or `文游小手机` (story-first simulated phone containing Apps). Two `立即开始` buttons appear (likely sticky + form action); no start was submitted.
- Confidence: social setup/App composition/player controls `TESTED`; runtime social propagation and mode persistence `UNKNOWN`.

## EVD-0074 — Installed Time App Configuration and World Draft Boundary

- Route: World Creator `/zh-cn/worlds/test-map-world-001-gytp/edit` → `安装 App` → official `时间` → `安装`.
- Installing the official Time App adds it to the World draft's installed-App list with icon `🕐` and description `一个能快进穿越时间的世界时钟。`; the draft immediately becomes dirty and remains owner-only until publication.
- App configuration exposes display name, start time, time format, repeatable jump-button rows, custom AI instruction, per-operation reminder, guide text, App theme, background opacity and optional background image. The UI accepts `next_event`, `next_day`, `1 month`, and `1 year` rows; the live preview shows `Day 1 / 01/01/2026 / 8:00 AM`, `回溯时间（查看历史）`, and `跳到下一个大事件` controls.
- Configuration requires an explicit `保存 App 配置` action. After saving, the Creator shows `正在自动保存…`/`草稿已自动保存`, and the World remains in an unpublished `v4` draft. Reopening the App configuration after a refresh is required to establish persistence of all repeatable rows; runtime semantics are not inferred from preview.
- The first attempted save surfaced a `草稿已在其他页面更新,点击刷新后继续` conflict banner; clicking refresh restored the latest draft and retained the Time App installation. This indicates a multi-page draft conflict/recovery path.
- Confidence: installation/configuration controls and draft boundary `TESTED`; publication and existing-Simulation propagation pending action-time confirmation; exact time deltas and intermediate event behavior `UNKNOWN`.

## EVD-0075 — App Detail Version History and Usage Surface

- Route: `/zh-cn/apps/test-app-001`.
- App detail exposes creator profile, Worlds-in-use count, category tags, favorite/rating control, `编辑`, `删除`, `安装`, description, online preview, comments, and a `用了这个 App 的热门世界` section. The owner World card includes `编辑`, `改编`, `删除` and `立即开始` controls.
- Expanding `查看全部 7 条` reveals an ordered version log v1–v7. Each entry shows version number, date and changelog title; current visible sequence is v7, v6, v5, v4, v3, v2, v1. The detail's online preview remains the latest App runtime (v6 config-propagation) rather than a historical version selector.
- Confidence: App public lifecycle/version-log surface `TESTED`; historical version runtime selection and owner-delete effects on installed Worlds remain `UNKNOWN`.

## EVD-0076 — Map Market “Use This Map” Existing-World Install Flow

- Route: `/zh-cn/maps` → any map card `用此地图` → select an owned World.
- Map catalog exposes tabs `有底图` / `全部` / `我的`, search, a second `全部` control and genre filters. Each card has `查看大图`, World link, `新标签页查看世界` and `用此地图`.
- `用此地图` first opens `用此地图新建世界` with a name field and owned-World selector. Selecting an existing World opens a second dialog offering `全部`, `仅底图`, and `仅区域`; explanatory text says the selection is installed as a normal Map App and can be adjusted in Creator. Final action is `装入并编辑`.
- Executing the flow against the owned `TEST World 001` redirected to a World Creator URL ending `#app-map`, showed toast `已加入世界草稿。发布新版本后，修改才会对玩家生效。`, and loaded a populated Map App editor with regions/factions, operations, marker toggle and faction-as-Character option. The route/slug displayed after navigation was `hogwarts-3bmx`, while the editor title identified `测试世界 001`; this target identity mismatch is recorded as an unresolved product quirk and should be rechecked after refresh.
- Confidence: map selection/install modal and draft boundary `TESTED`; exact slug/target mapping and publish/version propagation `UNKNOWN`.

## EVD-0077 — Character Detail, Duplicate-World Guard and Error State

- Route: `/zh-cn/characters?create=1` → search `测试角色 001` → global Character card.
- Global Character detail exposes favorite count, owner profile, `关注`, `评论`/`排行榜`/`支持者` tabs, cost range, `聊天`, `编辑`, `从你的角色库中删除这个角色?`, `改编` and `添加到世界`.
- `编辑` opens a populated editor with canonical source values (editor name `TEST Character 001`, full prompt, public intro, gender, max three categories, visibility `公开`/member-only `私有`). The card display is localized as `测试角色 001`, showing a possible display-name/translation layer; this is not assumed to be a different object.
- `添加到世界` opens a selector listing owned Worlds and a `给新世界起个名字…` field. Selecting an existing World that already contains this Character caused the target buttons to enter a disabled/loading state and then surfaced toast `出错了，请重试。`; no duplicate World-local copy was created. This is a tested duplicate/failed-add state, but the backend reason is `UNKNOWN` (duplicate guard vs transient request error).
- Confidence: detail/editor controls and duplicate-add failure surface `TESTED`; source-to-copy propagation and deletion remain `UNKNOWN`.

## EVD-0078 — Map “Use This Map” New-World Creation Verified

- Route: `/zh-cn/maps` → first card `鬼灭之刃模拟器` → `用此地图` → name field `TEST Map Install Audit 001` → `新建并编辑`.
- The action created a new World draft with slug `test-map-install-audit-001-qp49`, title `TEST Map Install Audit 001`, and a Creator URL ending `#app-map`. The editor preview banner linked to the same slug and showed `回合 0`.
- The resulting draft had an installed `地图` App and full map configuration (base map/region data, 47 regions and 2 factions in the loaded definition, region operations, optional markers, shared region properties and faction-as-Character toggle). The Creator showed `发布 v2`, confirming creation from a map starts a versioned draft rather than silently mutating the catalog map.
- This clean new-World run resolves the earlier target-identity ambiguity: the prior `hogwarts-3bmx` result came from an existing test asset/selection context and should not be used as the canonical map-install mapping.
- Confidence: new-World map install, slug creation, App insertion and draft/version boundary `TESTED`; publishing/map version updates `UNKNOWN`.

## EVD-0079 — Creator Genre Template Applies Initialization Schema

- Route: `/zh-cn/worlds/create` → `题材模板`.
- The template dialog lists at least 11 named presets: `现代恋爱`, `校园青春`, `修仙`, `武侠江湖`, `宫斗`, `穿越异世界`, `爱豆偶像`, `西幻冒险`, `末日生存`, `赛博朋克`, `战争政权`; each advertises the fields it will seed.
- Selecting `现代恋爱` immediately closes the chooser and mutates the unsaved Creator draft: five player-initialization fields appear (`身份`, `性格`, `家境`, `情感经历`, `魅点`), each with variable name (`identity`, `temper`, `family`, `history`, `charm`), default answer, quick options, `多行`/`必填` toggles and `{{variable}}` prompt reference. Existing core Apps remain installed; no World is created until the separate `创建世界` action.
- Selecting `修仙` afterward did not clear the prior fields: the draft contained both `身份` and `身世` schemas and 11 total `问题标签` fields, including `灵根资质`. This indicates template application is additive/merge-like rather than a replace operation, at least in an unsaved draft. Exact collision handling and whether App/system rules also change remain `UNKNOWN`.
- Confidence: preset inventory and initialization-field mutation `TESTED`; persistence after World creation/versioning `UNKNOWN`.

## EVD-0080 — Member Visibility Options Are Present but Not Locally Selectable

- Route: World Creator for `TEST App Upgrade World 001` → `可见性`.
- The editor exposes three options: `公开`, `不公开列出 会员`, and `私有 会员`; the explanatory copy under the currently selected public option says `所有人都能发现并游玩。`.
- In this non-member test account, clicking member-only options did not change the selected CSS state (public remained `border-primary bg-primary/5`). One attempt opened the existing `发布 v4` modal after the draft rerender; cancelling returned to the same public selection. No visibility change was committed.
- This is a tested boundary, not evidence that the options do not exist. Enforcement, upgrade prompt cause and post-publish direct-link behavior remain `UNKNOWN`.
- Confidence: option inventory and non-member no-op/side-effect boundary `TESTED`; permission semantics `UNKNOWN`.

## EVD-0081 — App Delete Checks Usage and Offers Cascading Uninstall Warning

- Route: App detail `/zh-cn/apps/test-app-001` → owner `删除`.
- Clicking the owner delete control first shows transient `正在检查使用情况…`; after the check it opens `删除这个 App?` with warning `会先从你自己的 1 个世界卸载。此操作不可恢复。` and `取消`/`删除` actions.
- The confirmation explicitly establishes a cascade boundary: deleting the App from the market would first uninstall it from the owner's one World. No final delete was submitted; the App and World remain unchanged.
- Confidence: usage check, cascade warning and cancel behavior `TESTED`; final deletion effects on App versions, World drafts, existing Simulations and public links `UNKNOWN`.

## EVD-0082 — Character Source Delete Control Requires Final Confirmation

- Route: `/zh-cn/characters?create=1` → search `测试角色 001` → global source card.
- The source card exposes a destructive control with title `从你的角色库中删除这个角色?`; the detail page exposes the same control.
- Clicking the detail control triggered a browser-native `confirm` dialog. Because the Browser API exposes no dialog message text, the exact copy is `UNKNOWN`.
- The dialog was dismissed. The source Character remained in the library and its World-local copy remained present, proving cancel/preservation. Final acceptance was not executed in this run; source deletion, search visibility, dependent World behavior and Simulation-copy survival remain `UNKNOWN`.
- Reliable interaction pattern: issue the click without awaiting its completion, wait ~350 ms, call `getJsDialog()`, then `dismiss()` or `accept()` and await the original click promise.
- Confidence: control and native-confirm boundary `TESTED`; cancel/preservation `TESTED`; final delete and propagation `UNKNOWN`.

## EVD-0083 — App Creator “Save Draft” Immediately Advances Public App Version

- Route: `/zh-cn/apps/create?slug=test-app-001` → `HTML` → edit source → `配置`/update note → `存草稿`.
- The draft was changed from the v6 widget to a v8 test widget (`Ready v8 upgrade-test`, `Version 8 installed-world upgrade test`) and the update note was set to `TEST v8 installed World and Simulation upgrade propagation`.
- Clicking `存草稿` produced toast `草稿已保存。`; no `发布` action was submitted. Despite that, reopening the public App detail `/zh-cn/apps/test-app-001` immediately showed `更新日志` v8 with that exact note, `查看全部 8 条`, and the online preview rendered the v8 HTML. This is stronger evidence than the earlier assumption that Save Draft is owner-only: for an existing App, Save Draft creates/advances a public App version (or otherwise publishes the current widget) without the separate Creator `发布` button.
- The App Creator remained on the same slug and the `发布` button became disabled after save, suggesting the explicit publish action may only be enabled for a dirty/new state or may be a redundant/conditional control for this existing App path. Exact backend distinction between “draft save” and “publish” remains `UNKNOWN` and requires a fresh new-App or dirty-after-save comparison.
- Confidence: public version-log/preview effect `TESTED`; exact persistence/version transaction semantics `UNKNOWN`.

## EVD-0084 — Existing Simulation Hot-Updates App Runtime After App Save

- Existing Simulation: `/zh-cn/sim/26faf299-fb09-42fe-b60b-4e0525a48427`, `TEST App v4 Simulation 001`, Turn 2; World draft remains unpublished v4.
- Before opening the Simulation, App v8 was saved through Creator without World publication. The Simulation iframe then rendered `Ready v8 upgrade-test`, `Version 8 installed-world upgrade test`, and the v8 button label, while the Simulation stayed at Turn 2 and its story/other controls remained available.
- This demonstrates App-definition hot propagation into an existing Simulation independently of the containing World version. It does not prove whether persisted App JSON state was migrated, reset, or merged; no App state-mutating Turn was generated in this check.
- Confidence: runtime HTML hot-update and World-version independence `TESTED`; state migration/merge and player notification behavior `UNKNOWN`.

## EVD-0085 — World Publish Modal States Existing-Save Update Policy

- Route: World Creator `/zh-cn/worlds/test-map-world-001-gytp/edit` with unpublished v4 draft → `发布 v4`.
- Modal title: `发布世界更新`; copy: `发布后，新开局会使用此版本；现有存档可自行选择是否应用。` It includes optional `版本标题`, required `更新日志*` with `0/12000`, `取消`, and disabled `发布 v4` until required text is entered.
- No final publish was submitted in this observation; the modal was left as an action-ready confirmation state pending action-time confirmation. The copy is direct evidence that World version publication separates new Simulation defaults from explicit application to existing saves.
- Confidence: modal fields, validation gate, and stated existing-save policy `TESTED`; actual post-publish prompt/version application behavior `UNKNOWN`.

## EVD-0086 — App Explicit Publish After Save Does Not Create a Duplicate Version

- Continuing EVD-0083, the existing App had already advanced to public v8 after `存草稿`. Clicking Creator `发布` then disabled both save/publish controls while processing and navigated to `/zh-cn/apps/test-app-001` with an alert naming `TEST App 001`.
- The public detail still showed v8 and `查看全部 8 条`; no v9 duplicate was created. The online preview remained the v8 widget.
- For this existing-App path, `存草稿` performs the version-creating/public-runtime update, while the subsequent explicit `发布` behaves like finalize-and-return or a no-new-version publication step. A brand-new App may use a different transition, so the exact state machine remains partly UNKNOWN.
- Confidence: existing-App post-save publish result `TESTED`; new-App transition and backend flags `UNKNOWN`.

## EVD-0087 — World v4 Publication and Existing-Save Update Prompt

- World Creator `/zh-cn/worlds/test-map-world-001-gytp/edit` published v4 with title `Time App + App v8 lifecycle audit` and a required Markdown update log. Success redirected to public detail and displayed toast `已发布。其他语言版本正在生成，完成前将显示原始语言。`.
- Public detail now lists five Apps including official `时间`, and version history shows v4 as latest with the submitted title/log. The per-Turn cost range changed from the prior public v3 baseline to `10–13 电量 / 回合`.
- Reloading existing Turn 2 Simulation `26faf299-fb09-42fe-b60b-4e0525a48427` opened an update dialog showing current `v3`, `世界配置已更新至 v4`, exact title/log, and `应用更新` / `暂不更新`.
- Copy states: `应用后会安装新增 App 并合并新版初始化配置；你的模拟进度和已修改内容会保留。` This is direct product-contract evidence for the merge/preservation policy.
- Choosing `暂不更新` left the Simulation at v3 with no Time controls. Reload did not re-show the prompt, and neither Settings nor Details exposed a manual apply button; Details did show the complete v1–v4 history. Thus defer is persisted/suppressed in this path and may make the update difficult to re-enter from the visible UI.
- Confidence: publication, public v4, prompt and persistent defer behavior `TESTED`; hidden/manual re-entry and actual v3→v4 apply merge remain `UNKNOWN` because this save was intentionally retained as a defer sample.

## EVD-0088 — Time App Runtime Jump Semantics

- Fresh v4 Simulation: `/zh-cn/sim/9b898aaf-f061-48fd-8b61-ee25759de2e4`, name `TEST Time v4 Simulation 001`.
- `/new` listed all five v4 Apps before start. Turn 1 initialized Time at `第 1 天 · 08:00`; Time controls included `回溯时间（查看历史）` and `跳到下一个大事件`.
- Opening the jump control produced a modal `时间线 · 第 1 天 · 08:00` with `+ 下一事件`, `+ 下一天`, `+ 1 个月`, `+ 1 年`, an additional `+` control, arbitrary target textbox `跳转到指定时间…`, and disabled `前往` until input.
- Each tested jump consumed exactly one Turn and generated new Story/world events:
  - `+ 下一事件`: Turn 2, `第 1 天 · 08:20` (20-minute advance tied to a major event, not a fixed unit).
  - `+ 下一天`: Turn 3, `第 2 天 · 06:30` (next narrative day, not exactly +24 hours).
  - `+ 1 个月`: Turn 4, `第 32 天 · 08:00` (30-day addition from Day 2).
  - `+ 1 年`: Turn 5, `第 398 天 · 07:30` (366-day addition from Day 32 in the 2026→2027 interval, with a full year of simulated history).
- Time text is injected into Story and Events. Events gained `按时间` in addition to Turn/mainline grouping and recorded map/state deltas from long jumps. Memory remained `暂无记忆` through Turn 5, showing that large simulated elapsed time does not itself force a Memory summary; Memory appears Turn/content dependent.
- Confidence: tested jump units, Turn accounting, narrative processing and time labels `VERIFIED`; arbitrary-date parser, custom `+` control and leap/calendar edge cases `UNKNOWN`.

## EVD-0089 — Time-Aware Checkpoint, Rewind and Independent Branch

- At original Turn 5 / Day 398, `创建存档点` created `TEST Time T5 Day398 Checkpoint` as independent Simulation `/zh-cn/sim/18f9c456-6a9f-40b5-986e-97e0d77b0534` and showed `存档点已创建` plus `打开`/`回到现在`.
- The source advanced to Turn 6 / Day 398 08:15. Time history listed all exact nodes: Day 1 08:00, Day 1 08:20, Day 2 06:30, Day 32 08:00, Day 398 07:30 and Day 398 08:15.
- Selecting Day 1 08:20 entered read-only `正在查看历史状态 · 回合 2 · 第 1 天 · 08:20`. `恢复到此状态` triggers a native browser `confirm`; after accepting, the source became Turn 2 / Day 1 08:20, Story returned to the meeting, Memory was `暂无记忆`, and later Turn 3–6 nodes disappeared from its current timeline.
- App configuration/version did not rewind: opening the `🧩` panel after restoring Turn 2 still rendered current App v8 HTML. This matches the earlier finding that installed App definitions/configuration live outside rewindable Turn state.
- The Turn 5 checkpoint remained Day 398 07:30 and could independently continue to Turn 6 using a different action (`TEST CHECKPOINT BRANCH…`). Reloading the original still showed Turn 2 / Day 1 08:20. This verifies full independent branching for time state and story, not just a static snapshot.
- Confidence: checkpoint time cloning, native confirmation, destructive timeline truncation and independent continuation `VERIFIED`; exact backend snapshot boundaries remain `UNKNOWN`.

## EVD-0090 — Map Installation Into an Existing World Replaces the Map Definition

- Route: `/zh-cn/maps` → source card `二战模拟器` → `用此地图` → existing World `TEST Map Install Audit 001` → `全部` → `装入并编辑`.
- The action redirected exactly to `/zh-cn/worlds/test-map-install-audit-001-qp49/edit#app-map`, matching the selected target slug. The Creator showed `发布 v2`, an unpublished draft, and one Map App (not a second appended Map App).
- The installed definition exposed `484 个区域 · 62 个阵营`; faction entries could be used as Characters, and region drawers exposed `Attack`/`Defend` operations. This was a replacement of the target's prior map definition, not a multi-map collection or additive second Map App. Whether all prior map-specific state is discarded or merged field-by-field remains `UNKNOWN`.
- The import-scope dialog copy was verified for all three choices:
  - `全部`: `底图 + 区域/阵营,全部带入。`
  - `仅底图`: `只带入地形底图,不带区域。`
  - `仅区域`: `只带入区域与阵营划分,不带底图。`
- No World publish was submitted in this evidence run. Publish/version propagation to new and existing Simulations remains `UNKNOWN`.
- Confidence: target routing, scope semantics, single-App replacement and installed Map editor state `VERIFIED`; field-level merge and publication propagation `UNKNOWN`.

## EVD-0091 — Map Editor Modal Controls and Draft Save Persistence Edge

- Route: `/zh-cn/worlds/test-map-install-audit-001-qp49/edit#app-map` → `打开地图编辑器`.
- The modal exposes `退出`, `保存并退出`, `查看` / `刷归属` / `绘制区域` / `地图设置`, `区域地图`/base-map toggle, region search, zoom in/out/reset, a 62-entry faction list with color/name/count fields and `添加阵营`, region operations, marker toggle, shared region properties and faction-as-Character toggle.
- `保存并退出` returns to the Creator and leaves the World at unpublished `v2` draft; it does not publish or create a public version by itself.
- A harmless draft edit to the Map display-name field (`地图`) and a custom Map-App instruction, followed by `保存 App 配置` / `保存并退出` and reload, did not show the values persisted (both returned blank). This is an observed field-specific save edge; whether the field is UI-only, requires another change event, or is overwritten by draft hydration is `UNKNOWN`.
- Confidence: modal control inventory and draft/public boundary `TESTED`; field-specific save failure `TESTED`; general Map editor persistence `UNKNOWN`.

## EVD-0092 — Account Presets, Setup Application and Private Lifecycle

- Route: `/zh-cn/account` → `我的预设`.
- Empty state shows `我的预设 (0)` with types `人设`, `文风`, `世界观` and `添加预设`. Type-specific fields are Persona name/player name/avatar or `捏脸`/identity text; Style name/narrative style; Lore name/world-setting overlay.
- Created `TEST Preset Persona 002`, `TEST Preset Style 001`, and `TEST Preset Lore 001`. After reload, the account showed `我的预设 (3)` and one count in each type tab. Presets are described as only visible to the owner.
- Each saved card exposes icon-only edit and trash controls. Edit reopens populated fields and text survives reload. The temporary `TEST Preset Persona 001` was removed through its trash control; the list immediately returned to zero for that sample and no visible confirmation/undo was observed. Deletion recovery is `UNKNOWN`.
- Route `/zh-cn/worlds/hogwarts-movie/new` exposes `用人设预设`, `套用我的预设`, and `另存为人设预设`. The save-persona control is disabled until name and identity/style are filled, then becomes enabled and saves the current setup as a private preset. The apply control did not visibly mutate empty fields in this run; exact selector UI and style/lore runtime application remain `UNKNOWN`.
- Confidence: type inventory, fields, persistence, edit/delete surface `TESTED`; preset-to-Simulation data transfer and deletion recovery `UNKNOWN`.

## EVD-0093 — Map Import Scopes Perform Substructure-Level Replacement

- Baseline target: published World `TEST World 001` (`/zh-cn/worlds/hogwarts-3bmx`) already contained a Map definition with `47 个区域 · 2 个阵营`, factions `Demons` / `Demon Slayer Corps`, actions `Patrol` / `Hunt demons`, and its existing target base map. The Maps selector did not badge it as `有地图`, but the Creator state proves Map data was already present; the selector badge is therefore not a reliable exhaustive indicator of hidden/installed Map state.
- `/zh-cn/maps` → source `二战模拟器` → `用此地图` → target `TEST World 001` → `仅底图` → `装入并编辑` redirected to `/zh-cn/worlds/hogwarts-3bmx/edit#app-map` and showed toast `已加入世界草稿。发布新版本后，修改才会对玩家生效。`.
- After the base-only install, the target still exposed exactly `47 个区域 · 2 个阵营`, the same `Demons` / `Demon Slayer Corps` factions and the same two target actions. This verifies that `仅底图` replaces the base-map substructure while preserving target regions, faction records and region-operation configuration; it does not clear those fields or copy the source's 484/62 region set.
- Without publishing, a second import used source `三国模拟器` → the same target → `仅区域`. After redirect/reload, the Map App changed to `61 个区域 · 13 个阵营`, with factions `Lü Bu`, `Sun Ce`, `Cao Cao`, `Liu Bei`, etc.; source actions `Attack this commandery`, `Reinforce / garrison`, `Develop (farms & levies)`, `Send an envoy`; and shared numeric attributes `Garrison` / `Supplies`. The Map Editor exposed all 13 faction records and region counts.
- Because `仅区域` explicitly excludes the base map and was applied after the WW2 base-only import, the resulting Draft is a deliberate mixed composition: WW2 terrain base + Three Kingdoms region/faction/operation/attribute substructures. The Creator still has one Map App, confirming substructure-level replacement inside a single Map definition rather than App stacking.
- Opening `发布 v4` showed the normal update modal and direct policy copy: new games use the new version, while existing saves choose whether to apply it. No final publication was submitted in this evidence run, so propagation of this mixed Map definition into new or existing Simulations remains `UNKNOWN`.
- Confidence: base-only preservation and regions-only replacement `VERIFIED`; exact low-level base-map payload and post-publish Simulation migration `UNKNOWN`.

## EVD-0094 — Existing Simulation Accepts World v3→v4 While Preserving Turn State

- Existing Simulation: `/zh-cn/sim/97dc81bc-b3de-4123-9c2a-2952d9e9282c`, `TEST Map v1 NoMap 001`, already at Turn 1 and bound to World `/zh-cn/worlds/test-map-world-001-rxwf` v3.
- Opening it after World v4 publication displayed an update dialog: `v3`, `世界配置已更新至 v4`, title `关闭改编权限`, the submitted changelog, and contract copy `应用后会安装新增 App 并合并新版初始化配置；你的模拟进度和已修改内容会保留。` Controls were `应用更新` / `暂不更新`.
- Before application, the save had exactly three dock Apps (`主输入框`, `主线故事`, `地图`), Turn 1, and the existing opening Story about a white plain, black stone columns, a bronze mirror and pottery fragments.
- Clicking `应用更新` closed the prompt without consuming a Turn. Reopening Settings/Details showed World `v4`; the App dock remained the same three Apps and the entire Turn-1 Story was unchanged. Reload persisted `v4`, kept Turn 1 and the Story, and did not re-show the update prompt.
- This is an actual no-add/remove update sample: a metadata/permission-oriented World release can advance a Simulation's applied version while leaving Turn content and App composition untouched. The update transaction is therefore not equivalent to restarting or re-seeding the Simulation.
- Confidence: applied-version advancement, no-Turn consumption and Turn/Story/App preservation `VERIFIED`; direct permission enforcement inside the owner save and character/setup-field conflict rules remain `UNKNOWN`.

## EVD-0095 — Character Private Visibility Is Membership-Gated and Detail Chat Can Be Disabled

- Source route: `/zh-cn/characters?search=TEST%20Character%20001` → source `测试角色 001` → `编辑`.
- Character editor exposed two visibility choices: `公开` and `私有 会员`. Clicking the member-only option did not silently mutate/save the record. It opened a pricing/entitlement modal with copy `把角色设为私有是会员功能`, purchase paths `一次性` / `订阅` / `自备 API`, plan prices and feature list. The modal included `取消`; no payment was submitted.
- While the editor toggle was selected, the underlying help paragraph still read `所有人都能找到并使用。`; this contradictory text is a UI hydration/selection inconsistency and must not be interpreted as successful private visibility. Exact entitlement enforcement remains `UNKNOWN` for a member account.
- Closing the pricing modal and editor without saving left the source public and searchable. The public detail page retained `编辑`, owner-delete, `改编`, and `添加到世界`.
- On the same source detail, the bottom `聊天` action rendered `disabled` in this run, even though Character library cards expose a `聊天` button. The disabled state may reflect self-owned/source-specific restrictions or a transient detail route condition; reason and whether another user's/public Character enables it are `UNKNOWN`.
- Confidence: member gate and no-save preservation `TESTED`; exact paid-member behavior, visibility persistence and detail-chat cause `UNKNOWN`.

## EVD-0096 — Mobile Simulation Mode, App Phone IA, and Save-Slot Exhaustion

- Responsive setup sample at `390×844`: `/zh-cn/worlds/hogwarts-movie/new` exposed the same World intro/App list and a compact setup form. `document.body.scrollWidth` was 382 (no horizontal overflow), and the setup controls remained reachable.
- Setup offers two UI modes with explicit `aria-pressed` state: `自由沙盒` (each App is an independent draggable window) and `文游小手机` (story-first, all Apps inside a simulated phone). In this run, the selected default followed viewport (`自由沙盒` at 1280px, `文游小手机` at 390px), but semantic click and keyboard Space on the opposite choice did **not** change either button's `aria-pressed` state. This is a tested setup-selector no-op/bug boundary, not evidence that manual choice never works in other sessions.
- Filling save name `TEST Mobile Mode Simulation 001`, player name `TEST Mobile Player`, and style text, then clicking `立即开始` surfaced an in-page capacity gate: `这个世界的 5 个存档位（含已购 2 个）已全部用完。` It offered `增加存档位 · 80` and `取消`.
- Clicking `增加存档位 · 80` consumed only the test account's free energy/credits (no real payment) and then created `/zh-cn/sim/65b5d320-4413-4507-8194-972f64abdcac` in `文游小手机` mode. Turn 0/1 runtime loaded with avatar/player identity, character stats, story, Time, and bottom navigation `剧情 / 手机 / 设置`.
- Phone tab showed a simulated home screen with clock/date, `点击添加` placeholders, installed icons `预言家日报`, `角色状态`, `电影`, `古灵阁`, `过场CG`, `行李箱`, more add placeholders, a `💬` dock button, and copy `长按图标可整理位置`.
- Settings exposed `事件 / 记忆 / 顾问`, AI console, checkpoint, important facts, export member wall, language, voice, World Model, `切换界面模式`, font/text speed, theme member wall, fullscreen and replay onboarding. Unlike the setup selector, the runtime mode switch worked: selecting `自由沙盒` rebuilt the layout in the same 390px viewport with no horizontal overflow; selecting `文游小手机` restored phone navigation and preserved the Simulation Story/state.
- Confidence: responsive dimensions, slot-capacity error and paid-slot boundary (free test energy), runtime mode state transition and phone IA `VERIFIED`; setup mode manual-selection failure `TESTED`; exact slot-count accounting, energy ledger timestamp and cross-device mode persistence `UNKNOWN`.

## EVD-0097 — Phone Desktop Widgets and Character Chat Consume a Full Turn

- In mobile Simulation `/zh-cn/sim/65b5d320-4413-4507-8194-972f64abdcac`, tapping a `点击添加` phone-home slot opened an `图片小组件` editor, not the App Market. Controls included direct emoji/URL input, upload, `我的角色`, `Emoji`, `头像库`, `国旗`, `壁纸`, `场景`, and scene search. Selecting `⭐` immediately replaced the empty slot with a star widget and exposed `移除图片`; after full page reload, phone mode and the `⭐` widget both persisted.
- Opening the `预言家日报` icon produced an in-phone App screen with clock, `back`, title, `刷新`, and the full App iframe. Returning to the phone home then tapping the persistent `💬` dock icon opened the Chat App's character list; selecting `米勒娃·麦格` opened the thread with image upload, message input and send.
- Sent actual message: `TEST MOBILE CHAT: 请确认收到我的入学信，并告诉我应先准备哪件物品。` McGonagall returned a contextual answer recommending Ollivanders first. The Chat screen showed the new user/assistant messages and a system notification named `米勒娃·麦格`.
- This Chat action consumed a full Simulation Turn: Events displayed `回合 1`, grouped the action as `→ 麦格教授: ...`, and recorded a `世界回应` containing both a generated cinematic scene description and the Character response. Energy changed from 434 after initial Simulation creation to 425 after the Chat Turn (observed delta 9). The main Story card text stayed on its original opening page, but the four suggested next actions changed to incorporate McGonagall's wand advice, proving Chat can advance Turn/event state and influence subsequent main-input suggestions without appending a new Story page.
- Initial Simulation creation/seed had already changed energy from the post-slot-expansion expectation of 438 to 434, an observed 4-energy initialization delta; exact billing ledger semantics and whether setup generation is always charged separately remain `UNKNOWN`.
- Confidence: widget persistence, in-phone App navigation, Chat full-Turn/event/suggestion propagation and observed energy deltas `VERIFIED`; long-press reorder, widget deletion recovery and exact billing formula `UNKNOWN`.

## EVD-0098 — Preset Application Controls Render but Produce No Visible State Change

- Account still held three persisted private presets from EVD-0092 (`TEST Preset Persona 002`, `TEST Preset Style 001`, `TEST Preset Lore 001`).
- On `/zh-cn/worlds/hogwarts-movie/new`, both `用人设预设` and `套用我的预设` were enabled and clickable. Repeated semantic clicks at desktop (1280×900) and mobile (390×844) produced no dialog, dropdown, popover, toast, navigation, or textbox mutation; the player name/style fields remained unchanged.
- The same no-visible-effect behavior occurred both with empty setup fields and after entering test name/style. Browser logs contained only unrelated existing warnings (multiple auth clients/AdSense), not a preset-specific exception.
- This is a tested interaction failure/no-op in the current account/session. It does not prove presets are never injectable: the controls may depend on a hidden state, a deployment defect, or a session hydration issue. Exact selector UI, mapping of Persona/Style/Lore to setup variables, precedence against typed values and runtime prompt injection remain `UNKNOWN`.
- Confidence: control presence, click/no-effect and unchanged setup fields `TESTED`; intended data-transfer semantics `UNKNOWN`.

## EVD-0099 — Mobile Mine Rename Persists but List Re-render Lags

- Route `/zh-cn/sims` at `390×844` used the mobile shell (top `菜单`/energy/account, bottom `探索 / 我的 / 创作 / 社区 / App 市场`) with no horizontal overflow (`scrollWidth=382 < innerWidth=390`).
- History immediately listed the newly created phone save `TEST Mobile Mode Simulation 001` at `Hogwarts Simulator (Movie Version) · 回合 1`, matching the current Events Turn and showing no index lag for this fresh sample.
- Each History card exposes `更多`; opening it shows `重命名` / `删除`. `重命名` opened a modal with prefilled `新的存档名`, `取消`, and `重命名`.
- Submitted `TEST Mobile Mode Simulation 001 Renamed`. The modal closed, but the visible History card retained the old name in the same render with no success toast. After full reload, the first card showed the new name. Directly reopening `/zh-cn/sim/65b5d320-4413-4507-8194-972f64abdcac` also changed the browser title to `TEST Mobile Mode Simulation 001 Renamed · WorldOS`.
- The adjacent `删除` action opens a site modal (not native confirm) with exact copy `确认永久删除该存档？`, echoes the save name, and offers `取消` / `删除`. Cancelling closed the modal and preserved the card. Final acceptance and recovery/direct-URL behavior remain `UNKNOWN` pending an action-time destructive confirmation.
- The save URL and Turn stayed unchanged. Rename is therefore a persistent mutable Simulation metadata field, while the Mine list may not invalidate/re-render immediately after success.
- Confidence: mobile Mine IA, rename modal/commit, reload persistence and direct-page propagation `VERIFIED`; cache invalidation delay and other surfaces' refresh timing `UNKNOWN`.

## EVD-0100 — Community Ranking Metrics Use Different Economic Units

- `/zh-cn/community` at `390×844` rendered without horizontal overflow (`scrollWidth=382`) and exposed the nine previously inventoried ranking modes. Each selected ranking showed up to 20 profile links in the current snapshot.
- Selecting `创作者 · 累计收益` changed the active tab and displayed creator totals in `电量`, including decimals (for example rank 1 `我好想爆 · 17,180.6 电量`, rank 2 `Xadia · 12,380.8 电量`). The related World section heading changed to `最受打赏的世界`.
- Selecting `创作者 · 收到打赏` also used `电量`, but visible totals were integers (for example `World101 · 14,140 电量`, `ztlllll · 9,100 电量`). Whether tips are intrinsically integer-denominated or merely rounded is `UNKNOWN`.
- Selecting `WorldOS 支持者` used a real-currency presentation rather than energy: the current snapshot had one ranked entry, `ztlllll · 10 美元`. No payment, tip or sponsorship action was performed.
- These are distinct economic metric domains in the same Community component: creator earned-energy (fractional display), tips received (integer display), and platform sponsorship/support (USD display). They must not be collapsed into a single balance field in parity architecture.
- Confidence: ranking switch, units, top-20 structure and observed values `VERIFIED`; revenue formula, tip denomination, supporter inclusion threshold and withdrawal/settlement `UNKNOWN`.

## EVD-0101 — Public Profile Combines Creator Economy, Player Achievements, Gifts and Content

- Mobile route `/zh-cn/profile/5d75e72d-8156-460a-9b27-facfac56a813` (supporter `ztlllll`) rendered at 390px without horizontal overflow and exposed identity metadata: avatar/name, membership tier `传奇`, badge `WorldOS 支持者`, gender, join date, follower count, `分享主页`, `送礼`, and `关注`.
- Creator section exposed separate metrics: created Worlds, World starts, accumulated World Turns, followers, `模拟分成` (fractional energy, 67.6 in sample), and `打赏收入（电量）` (9,100). A `打赏榜` linked donor profiles and showed donor energy totals.
- Player section exposed starts and played Turns. `成就陈列` showed unlocked achievement cards with World, difficulty/role metadata, score, counts of wins/won Worlds and average score. Opening `永恒不朽 · BitLife 模拟人生` produced a detail modal with final score 100, completed Turns 0, unlock date, AI-generated evaluation text, World link, and `分享成就`.
- Additional public sections included weighted `TA 最常玩的题材`, saved Worlds, creator-owned Worlds, most-played Worlds, and creator-owned Characters with Chat/Add actions.
- `送礼` opened a modal with nine energy-denominated gifts: `火花 20`, `星星 100`, `水晶 400`, `烟花 1,000`, `月亮 3,000`, `极光 6,000`, `星空 12,000`, `太阳 20,000`, `银河 100,000`. Copy states `礼物电量的 70% 直接进入创作者的电量余额。` Send is disabled until a gift is selected; selecting `星星 100` changed the final CTA to `送出 · 100⚡`. The modal was cancelled and no transfer occurred.
- Confidence: profile composition, metrics, gift tiers/70% split, selection boundary and achievement detail `VERIFIED`; follow/share/gift final side effects, remainder settlement and achievement generation rules `UNKNOWN`.

## EVD-0102 — Profile Share Is a Direct Clipboard Action, Not the World Poster Composer

- Route: `/zh-cn/profile/5d75e72d-8156-460a-9b27-facfac56a813` → `分享主页`.
- Triggering the control did not open a dialog, poster editor, destination menu or OS-share surface. It immediately copied the canonical Profile URL and showed toast `链接已复制`.
- This is a product-level sharing distinction: World sharing uses a multi-format poster composer with copy/save/external-share choices, while public Profile sharing is a one-step clipboard action in the tested mobile viewport.
- Confidence: direct clipboard trigger and toast `VERIFIED`; exact clipboard payload beyond the visible canonical page URL, desktop parity and share analytics/reward attribution `UNKNOWN`.

## EVD-0103 — Achievement Sharing Reuses the Poster Composer and Profile Edits Propagate Publicly

- Public Profile achievement detail → `分享成就` closes the achievement detail and opens a dedicated share composer. It offers ratios `1:1`, `4:5`, `9:16`, `保存海报`, `复制链接`, `复制文案`, `发布到 X`, `更多分享方式`, and reward copy/link to `/zh-cn/rewards`.
- The X intent contained achievement title `永恒不朽`, World `BitLife 模拟人生`, `#WorldOS`, and the public Profile URL rather than the World detail URL. `保存海报` was initially disabled while rendering, then enabled. `复制链接` and `复制文案` each changed their own button to `已复制` after triggering.
- This establishes three distinct sharing contracts: Profile home share = immediate clipboard; achievement share = generated poster composer; World share = generated poster composer with World-specific copy/link.
- Owner Account `/zh-cn/account` exposes mutable username, bio, gender, avatar and interest tags. Updating bio to `TEST PROFILE BIO 001 · WorldOS black-box audit` through `保存资料` persisted across full reload.
- The account menu `查看主页` targets `/zh-cn/profile/895fa29b-8b4a-4e01-9275-ef4c2b72c1f2`. The updated bio appeared on that public Profile. The owner view replaces public `关注`/`送礼` with `编辑资料`, which deep-links back to `/zh-cn/account`.
- Owner Profile also uses first-person section labels and exposes owner-aware content state: `我的世界`, `我的合集`, a `创建世界合集` entry, `Apps`, and World cards badged `有未发布修改` with `继续编辑`. These draft badges are visible on the owner's public-profile route but are not evidence they are visible to other viewers.
- Confidence: achievement share controls/X intent/copy state, Account bio persistence, public-profile propagation and owner-only IA `VERIFIED`; anonymous/other-user visibility of bio/draft badges, avatar upload, username collision rules, profile cache delay and share reward completion `UNKNOWN`.

## EVD-0104 — Global Character Updates Do Not Propagate Into an Existing World-Local Copy

- Baseline owner Profile displayed two separate records with the same localized name `测试角色 001`: a World-local record labelled `测试应用升级世界 001` and a reusable global source record without a World label. Before the experiment, both public intros were `产品调查测试角色 · 已编辑`.
- The global source editor was changed to role prompt marker `SOURCE UPDATED EVD-0104 2026-08-23` and public intro `SOURCE UPDATE TEST 0104`, then saved. The save button became disabled after submission and the new source values persisted.
- Reloading the owner Profile showed the source card with the localized updated intro `来源更新测试 0104`, while the World-local card remained `产品调查测试角色 · 已编辑`.
- World Creator `/zh-cn/worlds/test-map-world-001-gytp/edit` still contained the existing World-local Character definition `World-local copy edited for propagation test.` and no source-update marker. The source edit therefore did not overwrite either the local public card or the Creator prompt.
- This verifies snapshot/copy semantics for source→existing-World updates. It also confirms that World-local edits and later source edits are bidirectionally isolated. Source deletion, republishing and existing-Simulation behavior after deletion remain separate experiments.
- Confidence: source edit persistence and source-versus-local isolation `VERIFIED`; source deletion/downlisting, later re-add deduplication and independent-viewer visibility `UNKNOWN`.

## EVD-0105 — Phone Widgets Are Persistent Media Slots and App Refresh Is a Charged Turn

- In mobile Simulation `/zh-cn/sim/65b5d320-4413-4507-8194-972f64abdcac`, tapping the existing `⭐` widget opened its `图片小组件` editor with value `⭐` and `移除图片`. Removing it immediately restored `点击添加`; full reload preserved the empty slot.
- Reusing that slot through `场景` loaded a large searchable media catalog (D&D battle maps, life-stage scenes and generic environments). Choosing `Childhood / infancy: a cozy nursery` stored `/scenes/nursery.webp`; reload preserved it as an unnamed image button. A second slot's `我的角色` tab listed the ten Characters in the current World, not the account's global Character library; selecting `米勒娃·麦格` stored `/avatars/hogwarts/mcgonagall.webp`.
- The widget editor remains a media-slot system: emoji/URL, upload, World Characters, avatar library, flags, wallpapers and scenes. It does not install or launch a World App.
- Long-click simulation (`click` with 1200 ms delay) on `预言家日报` opened the App rather than entering reorder mode. True touch long-press/reordering is therefore still `UNKNOWN`; this is an automation input boundary, not a proven product no-op.
- Inside the phone App shell, `刷新` was not a free iframe reload. It became disabled while processing, consumed Energy 425→416 (9), advanced Events to `回合 2`, recorded `你的行动: 刷新「预言家日报」`, and emitted App-state resets for dateline, edition, lead, articles, notices and weather.
- Reopening the App after processing changed the newspaper from issue `第5471期` / `1991 年 8 月下旬` to `第5472期` / `1991 年 8 月底` with newly generated headlines. Main Story pagination remained on the opening page and its wand-oriented suggestions, mirroring the earlier Chat Turn pattern where an App Turn can mutate App/Event state without appending a Story card.
- Phone `back` returned to the home grid; refresh preserved the internal App shell and did not navigate away from the Simulation.
- Confidence: widget delete/reload persistence, scene/Character media sources, phone back and charged App-refresh Turn `VERIFIED`; touch reorder, multi-task/background state and widget drag ordering `UNKNOWN`.

## EVD-0106 — Account Language Is Persistent and User Content Has Locale-Specific Variants

- Account → Preferences exposes `English`, `Español`, `中文`. Switching English changed the route family from `/zh-cn/...` to the unprefixed English routes (`/account`, `/profile/...`) and localized global navigation, Settings and footer/social destinations.
- The English owner Profile rendered locale-specific variants for user content: `TEST App Upgrade World 001`, `TEST Map World 001`, `TEST Collection 001`, `Test Character 001` (World-local) and `TEST Character 001` (global source). Descriptions/intros also returned English variants, including `SOURCE UPDATE TEST 0104`.
- Switching to `Español` initially marked the button active while the current render remained English; the next full navigation/reload resolved to `/es/account` and Spanish UI. This is a transient SPA locale-application delay, not failed persistence.
- Spanish Profile rendered translated user content, including `Mundo de actualización de la aplicación de prueba 001`, `Colección de prueba 001`, `Personaje de prueba 001` and `ACTUALIZACIÓN DE FUENTE PRUEBA 0104`. One deliberately English identifier (`TEST Map Install Audit 001`) remained untranslated, showing variants are generated/available per field/object rather than all raw strings being blindly translated at display time.
- Returning to `中文` immediately navigated to `/zh-cn/account`; a subsequent unprefixed `/account` navigation normalized back to `/zh-cn/account`, proving the preference persists and controls locale-route resolution.
- Stable object slugs/UUIDs did not change across locale routes. The same Profile UUID and World/Collection slugs served translated variants.
- Confidence: locale selector, route normalization, reload persistence and World/Collection/Character locale variants `VERIFIED`; variant generation timing, manual locale editing, fallback precedence, translation versioning and anonymous-cookie behavior `UNKNOWN`.

## EVD-0107 — App Reinstall Uses a World Draft Snapshot and Can Race With Auto-Save Hydration

- Route: World Creator `/zh-cn/worlds/test-map-world-001-gytp/edit` → `安装 App` → search `TEST App 001`.
- The App had previously been removed from the World draft. Reinstalling it inserted a single World-local App card and immediately changed the Creator from the prior installed-App list to `TEST App 001` plus the normal `草稿已自动保存` state. The install did not publish the World or consume a Simulation Turn; Creator remained on `发布 v5` with an unpublished draft.
- Opening the newly installed App configuration after the first reinstall exposed the App Creator's current Initial JSON (`clicks: 999`, `status: SEED_V9`, `observedInitial: null`) and current v8 HTML preview, showing that the install-time configuration form resolves the latest App definition rather than the old v4 editor fields.
- A first immediate configuration click produced `草稿已在其他页面更新,点击刷新后继续`; clicking that control showed `已恢复上次草稿` and temporarily removed the just-installed App. This is a real draft conflict/hydration boundary: the modal/configuration interaction raced the World Creator's auto-save or stale draft snapshot. It is not safe to assume that an install click is durable until the automatic-save state settles.
- Repeating the same install, waiting for `草稿已自动保存`, and then reloading the entire Creator preserved the installed App. Reopening its configuration after reload again showed the v9 Initial JSON field and `保存 App 配置`, while no World publication occurred. This confirms that the stable path persists the install and the latest App definition in the World draft.
- Existing Simulations were not modified by install/reinstall: the known v2/v3 saves remained on their prior World version and Turn counts during this draft-only operation. Whether a newly published World version seeds the v9 JSON into a fresh Simulation, and whether reinstallation resets a previously persisted App state after World publication, remain separate questions.
- Confidence: draft insertion, no-Turn/no-publication boundary, latest-definition form hydration, stable reinstall persistence and conflict UI `VERIFIED`; exact conflict arbitration, persisted JSON state on a post-publish reinstall, and old-save migration `UNKNOWN`.

## EVD-0108 — Account Model/BYOK Surface Is Entitlement-Gated Without Accepting a Key

- Route: `/zh-cn/account` → `世界模型`.
- The page advertises a `自备 API` path using an OpenRouter key, says BYOK simulations do not consume Zaps, links to `openrouter.ai/keys`, and exposes fields for OpenRouter key, model selection, and a custom OpenAI-compatible gateway (`Base URL`, key, model id).
- In the current non-member test account, the editable key field and model action controls are gated. The page initially shows `测试并保存` disabled; after the entitlement state hydrates it shows `查看自备 API` and the key field disabled, while model names are rendered as text rather than selectable buttons. No real key was entered or submitted.
- The visible catalog distinguishes free and paid model tiers: `免费模型` (free), DeepSeek V4 Flash `$`, DeepSeek V4 Pro `$$`, GLM-4.6 `$`, Kimi K2 `$$`, Qwen3 Max `$$`; `更多模型` and custom gateway are part of the same gated surface. Per-copy, model choice is made independently inside each Simulation's `设置`, either official WorldOS model or a user's BYOK model.
- Account → `账户` exposes a destructive account lifecycle gate requiring exact text `DELETE` before `删除账号` enables; copy says deletion permanently removes the account, Worlds and all Simulation records and cannot be recovered. The account menu separately exposes `查看主页`, `账号设置`, `购买电量`, `赚电量`, language/theme controls, QQ group and `退出登录`.
- Confidence: route, copy, model tiers, disabled/no-key boundary, account deletion confirmation text and logout/menu inventory `VERIFIED`; member/BYOK success path, model runtime differences, logout reauthentication and account deletion recovery `UNKNOWN`.

## EVD-0109 — Simulation Model Switching Is Per-Save, Charged by Selected Official Tier

- Simulation `/zh-cn/sim/9b898aaf-f061-48fd-8b61-ee25759de2e4` → `设置` → `世界模型` lists official choices `Civilization 1 13/回合`, `Civilization 1 Small 10/回合`, `Deepseek 10/回合`, plus disabled/gated `免费模型 OpenRouter`; a link returns to Account → World Model for adding models.
- Selecting the gated OpenRouter button did not switch the save. It emitted a visible notification `需要 Freedom Pass——请先订阅，或改用官方模型。`; the button is styled `opacity-45`. No key was entered and no external API call was attempted.
- Selecting `Civilization 1 Small` was accepted without a modal. A controlled action advanced Turn 2→3 and Day 1 08:20→08:25; Energy changed 306→296, exactly the displayed 10/Turn. Selecting `Civilization 1` afterward was also accepted; the next action advanced Turn 3→4 and 08:25→08:30; Energy changed 296→283, exactly 13. The two-step 23-unit total therefore decomposes precisely into the selected 10 + 13 model tiers.
- Switching models itself did not consume a Turn; the cost was charged only when the next action ran. The save was switched back to `Civilization 1 Small`, fully reloaded, and another controlled action advanced Turn 4→5 / 08:30→08:35 with Energy 283→273. This verifies that the model choice persists across full reload for the same Simulation.
- Confidence: model inventory, Freedom Pass gate/error, per-save switch UI, no-Turn selection boundary, reload persistence and labeled cost accounting `VERIFIED`; cross-device scope, model output quality, fallback after provider failure and BYOK runtime behavior `UNKNOWN`.

## EVD-0110 — World v5 App Update Merges New Initial JSON Into Existing Saves Without Restarting

- World `TEST App Upgrade World 001` v5 was published after a stable uninstall→reinstall of `TEST App 001`. Public detail showed v5 changelog `App v9 reinstall seed audit`; the World still listed exactly four Apps (Main Input, Story, Map, Time) plus the TEST App in its Creator/runtime context.
- New Simulation `/zh-cn/sim/2ba0bf5b-68d1-4b50-8b67-4a0c7d1468b7`, `TEST v5 Reinstall Seed Simulation 001`, started from v5 and exposed the current v8 HTML. Its first App `refresh` consumed one Turn and emitted `🧩set INIT_V9 observedInitial = 999` and `🧩set INIT_V9 status = INITIAL_JSON_AUDIT_V9`, proving the published World/App install seed was 999 rather than the earlier default 0.
- Existing Simulation `/zh-cn/sim/88cffec1-1296-47c0-bae7-f238d17dabc2` was at v4 / Turn 2 when opened after publication. It showed the v5 update dialog with exact contract `应用后会安装新增 App 并合并新版初始化配置；你的模拟进度和已修改内容会保留。` Selecting `应用更新` advanced the applied World version to v5, preserved Turn 2, Story and the existing save name, and did not charge a Turn. Settings showed Energy unchanged at 173.
- After applying v5, the existing App first emitted a compact merge event `🧩updated INIT_V9 status, observedInitial`, then its next refresh emitted `🧩set INIT_V9 status = INITIAL_JSON_AUDIT_V9` and `🧩set INIT_V9 observedInitial = 999`; the preceding event also recorded `🧩set INIT_V9 clicks = 0`. This establishes a field-level merge boundary in the sample: new initial metadata/seed (`observedInitial/status`) was applied, while the save's existing mutable `clicks` state remained 0 rather than resetting to 999.
- The update transaction did not restart the Story, did not change Turn count, and did not require a new Simulation. App definition/HTML remained the current v8 runtime. Exact merge precedence for arrays/nested JSON, conflict handling for user-edited fields other than `clicks`, and whether App-local state not mentioned by the update is always preserved remain `UNKNOWN`.
- Confidence: v5 publication, new-v5 seed, existing-save prompt, no-Turn application, version advancement, state-preserving merge and observed field-level result `VERIFIED`; general JSON merge algorithm and nested/array conflict semantics `UNKNOWN`.

## EVD-0111 — App Final Delete Removes Public Detail; In-Use Delete Executes Cascade (Post-Delete Verification Pending)

- Disposable App `test-app-delete-lifecycle-001` was created through `/zh-cn/apps/create`, given HTML `DELETE_LIFECYCLE_READY`, configured with name/slug/description, published, and verified at `/zh-cn/apps/test-app-delete-lifecycle-001` with `0 个世界在用`.
- Owner `删除` opened a confirmation area with title `删除这个 App?`, copy `此操作不可恢复。`, and `取消`/`删除`. Final delete redirected to `/zh-cn/apps`; the former direct URL then returned a 404 page (`This page could not be found.`). The App no longer appeared in the market snapshot.
- For live App `test-app-001`, the public detail reported `1 个世界在用`. Owner delete first opened the usage-aware confirmation `会先从你自己的 1 个世界卸载。此操作不可恢复。`; submitting the final action redirected to `/zh-cn/apps` and removed the owner App detail from the visible market route.
- Browser connectivity failed immediately after the live-App delete (`ERR_PROXY_CONNECTION_FAILED`) before the World/Simulation consequences could be reloaded. Therefore the following remain UNKNOWN pending a reconnect: World v5 public App list, World Draft installed-card state, existing Simulations' App dock/HTML/history, new Simulation availability, direct App URL status, and whether App version logs survive in any private owner surface.
- Confidence: disposable App create/publish/delete/404 lifecycle `VERIFIED`; usage-count cascade warning and final submission `VERIFIED`; cross-system post-delete consequences `UNKNOWN` because the reconnection check was blocked by transient proxy failure.

## EVD-0112 — In-Use App Deletion Creates World v6 Draft and Removes App From Existing Saves; New v5 Save URL Became 404

- After reconnect, public World `/zh-cn/worlds/test-map-world-001-gytp` listed only the four official Apps (Main Input, Story, Map, Time); `TEST App 001` was absent. The public World retained v5 as latest published version, while the owner Creator loaded an unpublished `发布 v6` draft with the same four installed Apps and no TEST App card.
- Existing Simulation `26faf299-fb09-42fe-b60b-4e0525a48427` initially showed a v5 update prompt while still applied to v3. Clicking `应用更新` advanced it to v5 with zero Turn cost, preserved Turn 3 and Story, and removed the TEST App from the dock entirely. The resulting dock contained only Main Input, Story and Map (Time was not present in this v3-bound save). No `TEST App 001` HTML iframe remained.
- Existing Simulation `88cffec1-1296-47c0-bae7-f238d17dabc2` survived direct navigation at Turn 3 and no longer exposed an App dock entry for TEST App. Its Story snapshot still contained historic narrative text referring to `TEST App 001`, showing deletion removes the live App surface/state but does not rewrite already-generated Story prose.
- New v5 Simulation `2ba0bf5b-68b1-4d50-8b67-4a0c7d1468b7`—created after World v5 publication and dependent on the deleted App—returned `404 This page could not be found.` after App deletion. This differs from older saves, which remain addressable and migrate by removing the App. The precise criterion for new-save deletion/cleanup (creation version, unresolved App dependency, or cascade policy) remains UNKNOWN.
- World public save list and App Market no longer showed the deleted App. The World’s published v5 version log remained visible; the owner draft v6 represents the deletion as an unpublished World change requiring a separate publish action.
- Confidence: public/draft removal, existing-save App removal and Story preservation `VERIFIED`; new-save 404 and exact cleanup criterion `TESTED/observed`; backend retention, version-history App links, and new-save policy generalization `UNKNOWN`.

## EVD-0113 — Deleted-App Save Remains Listed in Mine/World Save Lists; Version History Retains Pre-Delete Versions

- Time: 2026-08-23 (Asia/Shanghai)
- Account/view: owner test account `x161880`, authenticated desktop in-app browser.
- URLs: `/zh-cn/sims`, `/zh-cn/worlds/test-map-world-001-gytp`, `/zh-cn/worlds/test-map-world-001-gytp/edit`, `/zh-cn/characters`.
- Actions:
  1. Open Mine → History after `TEST App 001` had been owner-deleted.
  2. Open the public World detail and expand `版本记录`.
  3. Open the World Creator Draft generated by the App deletion.
  4. Search Character Library by filling the visible search box with `测试角色 001` and pressing Enter.
- Before/after:
  - Mine → History still lists `TEST v5 Reinstall Seed Simulation 001` with a normal `/zh-cn/sim/2ba0bf5b-68d1-4b50-8b67-4a0c7d1468b7` link even though direct navigation to that save had previously returned 404 after App deletion. The same save remains under the World detail `你的存档` list. This proves list/index retention is not equivalent to successful save resolution.
  - World public detail still exposes v1–v5 after `展开全部`; v5 is labeled `App v9 reinstall seed audit`, while no additional published v6 exists. The App deletion therefore creates an unpublished Draft rather than silently mutating published version history.
  - World Creator opens with `发布 v6`; installed Apps are only Main Input, Story, Map, Time. The deleted App is absent, and the draft has no automatic visible deletion-specific changelog text before publishing.
  - Character search uses the typed value in the textbox but leaves the URL at `/zh-cn/characters` (no `?search=`) and correctly renders two same-name records: a World-local copy with an `编辑` control and a global source with `保存角色` plus `从你的角色库中删除这个角色?`. A prior deep link `/zh-cn/characters?search=TEST%20Character%20001` displayed the full trend list before the textbox was filled manually.
- Evidence: DOM snapshots from each URL; exact labels and links above.
- Conclusion: (1) save indexes can retain tombstoned/unresolvable Simulation links; (2) App deletion does not retroactively rewrite published World version history; (3) owner deletion controls are exposed only on the global source record; (4) Character search state is client-side/form state rather than a reliably honored URL query in this session.
- Confidence: `TESTED` for visible list/version/UI behavior; backend retention and whether the 404 save can be recovered remain `UNKNOWN`.
- Next experiment: use the owner-side World version/app links and a separate viewer session to determine whether the 404 is tied to deleted-App dependency at creation time; execute Character source final delete only at action-time confirmation, then compare these retained indexes and direct links.

## EVD-0114 — Social World Setup Mode Selector Fails to Switch; Created Save Uses Sandbox Shell

- Time: 2026-08-23 (Asia/Shanghai)
- URL: `/zh-cn/worlds/american-high-school/new` → `/zh-cn/sim/c86047d5-8289-47ea-ad77-173c01db4a90`
- Account/view: authenticated owner-player test account, desktop viewport.
- Actions: inspect `界面模式`; click `文游小手机` with semantic click, forced click and coordinate click; inspect `aria-pressed`; create save `TEST Social Mode Phone 001` with player name `TEST Social Player`.
- Observed:
  - Setup exposes `自由沙盒` and `文游小手机`; initial state is `自由沙盒 aria-pressed=true`, phone `false`.
  - All three normal interaction methods leave the selected state unchanged; there is no toast, modal or validation error.
  - Creation succeeds and opens a free-window/sandbox Simulation with independent Story, Stats, Relations, Instagram, Chat, Time, Quest and Inventory panels plus a bottom App dock—not the phone home-screen shell.
  - Setup temporarily rendered two visible `立即开始` controls (hero/sticky duplication); after the first click the hero shell collapsed and one form CTA remained. Submitting the remaining CTA created the save.
- Conclusion: in this session the setup phone-mode choice is a visible but non-functional control; the resulting save follows the actually selected sandbox state. This is a functional setup failure, not merely missing pressed styling.
- Confidence: `TESTED` for this World/account/session; whether it is a transient regression or all Social Worlds is `UNKNOWN`.
- Next experiment: second account/device and another Social World; compare with in-Simulation `切换界面模式`, already known to work in a different sample.

## EVD-0115 — Social Simulation Generates Autonomous Group Messages, Relation/Stat Deltas and Memory Every ~5 Turns

- Time: 2026-08-23 (Asia/Shanghai)
- URL: `/zh-cn/sim/c86047d5-8289-47ea-ad77-173c01db4a90`
- Model/cost: switched at Turn 0 from `Civilization 1 12/回合` to `Civilization 1 Small 8/回合`; model menu for this World shows 12/8/8, lower than the 13/10/10 observed in the App-upgrade World, proving displayed tier cost is World/context dependent rather than globally fixed.
- Controlled run: Turn 0→10, actions focused on Riley, Quinn, the freshman group chat and Jax's Friday party.
- Observed cross-system behavior:
  - Turn 2 Event Delta independently created a group message from `Tyler @ group.freshmen` about the party, plus Quinn rapport `+1`, Stress `+2`, Clout `+1`; the user had asked only to observe group/Instagram activity, not authored Tyler's exact message.
  - Turn 4 produced further autonomous group replies from `Leo X` and `Maya K`, alongside Quinn rapport `+2`, Stress `+2`, Clout `+1`. A toast-like notification region also surfaced `Maya K` and `Leo X` buttons.
  - Story prose consistently incorporated Instagram/Story/group-chat activity and then Event view exposed the structured social messages and deltas separately.
  - Memory was empty through Turn 4 (`每隔几轮会自动生成总结`). At Turn 6 Memory `✦ 1` appeared, summarizing the opening, Riley/Quinn, group-chat/party plan and aggregate relation/stat changes. A Turn 7 explicit recall prompt reproduced specific earlier details (Riley's “把课表贴他脑门上” / “等彩票中奖的赌徒” teasing and the reason for party preparation), demonstrating usable recall rather than presence-only memory.
  - By Turn 10 Memory `✦ 2` appeared, summarizing Turns 6–10's styling plan, rehearsal, autonomous Tyler message and aggregate Style/Mood/Stress/Clout changes. This sample therefore shows an approximate five-Turn summary cadence, though exact threshold may depend on token/event volume.
  - A transient network/proxy interruption after Turn 1 left the completed Story visible while `世界正在回应…` and all App writes stayed locked. Once connectivity returned, reopening the same stable save URL showed Turn 1 complete and unlocked; no duplicate Turn was created. Separate tabs displayed `ERR_PROXY_CONNECTION_FAILED` and Cloudflare 524 during the outage.
  - Low-energy notices appeared at about 99, 91 and 83 energy with CTA `/zh-cn/rewards`; Turns still completed at 8 energy each. One UI refresh showed a stale 91 notice after a Turn before the next notice updated to 83.
- Conclusion: Social Worlds have first-class autonomous social events, structured relationship/stat deltas, notification surfacing and generated long-term summaries; network interruption can preserve a committed Turn while leaving the live shell temporarily locked, and reopening recovers it.
- Confidence: autonomous messages/deltas, Turn-6/Turn-10 summaries and recall `VERIFIED` in this sample; exact memory cadence and notification read-state remain `PARTIAL`.
- Next experiment: advance into a later calendar week/party event, test whether autonomous messages occur without explicitly mentioning chat/social surfaces, then Rewind across Memory 2 and compare group messages/relations/notifications.

## EVD-0116 — Collection Editor Supports Visibility, Ordered Membership and Owner-World Add/Remove Drafts

- Time: 2026-08-23 (Asia/Shanghai)
- URLs: `/zh-cn/collections/test-collection-001-g6wi`, `/zh-cn/collections/test-collection-001-g6wi/edit`.
- Before: owner collection `测试系列 001` detail showed `1 个世界`, creator link, tags `测试/调查/系列`, share, owner `编辑合集`, `删除合集`, and the single member `TEST World 001`.
- Editor controls:
  - `合集名称`, `合集介绍`, `标签` textboxes with populated values;
  - visibility buttons `公开`, `链接可见`, `仅自己`; selecting `链接可见` showed copy `不会出现在发现页，但有链接的人可以打开。`, while selecting `公开` showed `所有人都能发现和打开。`;
  - ordered membership area `1/100`, per-item drag handles (`aria-roledescription=sortable`) and icon-only remove buttons;
  - owner-world candidate list (`TEST App Upgrade World 001`, `TEST Map Install Audit 001`, `TEST Map World 001`) with `添加` buttons;
  - `搜索公开世界` textbox and `保存合集` CTA.
- Controlled local-draft experiment: clicked `添加` for `TEST App Upgrade World 001`; membership changed to `2/100` and a second item appeared. Clicked its icon-only remove control; membership returned to `1/100`. No save was submitted, so the persisted collection remained unchanged. Selecting `公开` after returning to the original draft changed only local selection; no persistence was committed.
- Tooltip on candidate `添加` buttons while the draft was set to public: `公开合集只能收录公开世界。请先公开这些世界，或把合集改为链接可见/仅自己。` The controls were not disabled (`disabled=false`), so the restriction is communicated by title/tooltip and likely enforced on save or add; exact enforcement remains UNKNOWN.
- Conclusion: Collections have a 100-item ordered membership model, three visibility modes, owner-only editor, add/remove draft semantics and a public-world eligibility rule that may be soft-blocked. Final visibility persistence, anonymous discoverability, drag reorder commit, collection delete confirmation and Save/Unsave side effects remain UNKNOWN.
- Confidence: editor surface and reversible draft add/remove `TESTED`; persistence/enforcement edges `UNKNOWN`.

## EVD-0117 — Collections Browse Page Exposes Search, Popular/Latest Sort, Owner Filter and Public-Only Discoverability

- Time: 2026-08-23 (Asia/Shanghai)
- URL: `/zh-cn/collections`.
- Observed baseline: heading `浏览世界合集`, description, searchbox `搜索合集名称、介绍、标签或创作者`, sort button `排序：热门`, author filter `作者：全部`, owner link `创建合集`, and `51 个合集` in the current snapshot. Cards show title, description/world count, tags, creator and two numeric counters.
- Sort menu options: `排序：热门` and `排序：最新`.
- Author menu options: `作者：全部` and `作者：我的合集`.
- Search experiment: typed `测试系列 001` into the searchbox. The page immediately changed to `0 个合集`, `没有找到合集`, helper `换个关键词或筛选条件试试。`, and `清除筛选`. The owner collection `测试系列 001` is currently `链接可见` in backend state, so it does not appear in the public browse/search surface. Direct URL remains accessible to the owner.
- Conclusion: Collection browse is a public discovery index with full-text search over title/description/tags/creator, popular/latest sorting and an owner-only filter; link-visible collections are omitted from this public list in the owner session.
- Confidence: controls, counts, options, empty state and link-visible omission `TESTED`; anonymous direct-link behavior and `我的合集` membership scope `UNKNOWN`.

## EVD-0118 — Cross-Account World Remix Uses Direct-Parent Attribution, Creates Notifications and Propagates Unevenly Across Indexes

- Time: 2026-08-23 (Asia/Shanghai), including a post-network-recovery verification pass.
- Accounts/views:
  - source owner `x161880` (`/zh-cn/profile/895fa29b-8b4a-4e01-9275-ef4c2b72c1f2`);
  - independent account `nixonelton9954` (`/zh-cn/profile/ae998d5b-6320-42dd-b04f-bc7fb663cc6a`);
  - owner and non-owner detail-page views were both observed through normal authenticated sessions.
- Remix chain/assets:
  - L0 source: `/zh-cn/worlds/test-map-world-001-gytp`, owner `x161880`;
  - Account-B L1: `/zh-cn/worlds/test-map-world-001-ft9r`, owner `nixonelton9954`, direct attribution to L0;
  - Account-B L2: `/zh-cn/worlds/test-map-world-001-ouue`, owner `nixonelton9954`, current v2 changelog `跨账号 Remix 验证 - L2 发布`, direct attribution only to L1;
  - Account-A L2: `/zh-cn/worlds/test-map-world-001-k4do`, owner `x161880`, public v1 created by remixing Account-B L1, direct attribution only to L1.
- Creation/version behavior:
  - Clicking World `改编` immediately created a stable slug and an already accessible public v1; no separate initial Publish submission was required.
  - Opening the new Creator after that implicit v1 showed `发布 v2`. Thus the remix transaction itself is the first publication/version boundary, and the first explicit edit release advances to v2.
  - The copied World retained the title/description/theme, World-local `测试角色 001` snapshot, Main Input/Story/Map/Time Apps and Creator configuration. The source World was not mutated.
- Attribution behavior:
  - Every tested generation displays `改编自` plus the immediately preceding World and its author.
  - L2 detail does not simultaneously expose L0 in the visible attribution block. Multi-layer provenance is therefore a traversable direct-parent chain, not a flattened on-card ancestor list.
- Permissions/non-owner behavior:
  - On Account-B L1/L2 while viewed by `x161880`, the page showed normal viewer controls such as `关注`, `立即开始`, `改编`, reaction/save-to-collection and rating/comment surfaces, but no `编辑` or `删除世界`.
  - On Account-A L2, owner controls `编辑` and `删除世界` were present. Rating remained gated until the viewer had played the World (`玩过这个世界后才能评分。`).
- Notification behavior:
  - After Account B remixed L0 and followed Account A, Account A's global notification button showed unread badge `2`.
  - The notification center contained persistent records with direct deep links: `🔥 nixonelton9954 改编了你的 《TEST App Upgrade World 001》,创作了 《TEST App Upgrade World 001》` → L1 `/zh-cn/worlds/test-map-world-001-ft9r`; and `🎯 nixonelton9954 关注了你` → Account-B Profile.
  - Opening the notification center removed the numeric unread badge from the header but retained both records. Read acknowledgement is therefore distinct from notification deletion and appears to batch-clear the current unread count.
- Cross-surface propagation after Account-A L2 creation:
  - Owner Profile immediately counted `5` created Worlds and listed `/test-map-world-001-k4do` as an ordinary published card with `编辑`, not `有未发布修改`.
  - Mine → `作品` → `世界` → `我创建的` also listed the L2 card; Mine → History did not list it because no Simulation had been created.
  - Unified Search for the exact shared title returned L0, Account-B L1 and Account-B L2, but not Account-A L2, even after switching to the full `tab=worlds` result list which ended with `没有更多啦`. The direct URL and owner indexes still resolved normally. This is an observed discovery-index gap or indexing delay, not evidence that the World is private.
- Conclusion: World Remix is a copy-and-immediate-publish operation with independent ownership/versioning, direct-parent attribution and cross-account notification side effects. Publication surfaces are not transactionally identical: Profile/Mine may recognize a new public remix before unified Search does.
- Confidence: immediate v1 creation, Creator v2 boundary, copy scope, direct-parent attribution, owner/non-owner controls, notification records/deep links/read-badge clearing and Profile/Mine propagation `VERIFIED`; Search omission cause/duration, notification delivery to the remixed Account-B parent, ancestor behavior after source deletion and attribution enforcement under visibility changes `UNKNOWN`.
- Next experiment: inspect Account B's notification center for Account A's L2 event; rename or publish Account-A L2 v2 and time Search-index appearance; then change a disposable source visibility/delete state and verify each descendant's attribution link and runtime access without assuming cascade semantics.

## EVD-0119 — 360px Mobile Viewport Keeps Core World/Creator/Simulation Flows Within Bounds

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account, explicit viewport `360×800`.
- World detail `/zh-cn/worlds/test-map-world-001-gytp`:
  - `document.body.scrollWidth=352`, `body.getBoundingClientRect().width=352`, so no horizontal overflow was observed.
  - Mobile shell kept menu, energy, account, bottom navigation, share, remix/rating/comment controls, World-local Character card, App links, version `展开全部`, save list and per-save `重命名/删除` controls reachable in the DOM.
  - The owner detail showed `继续模拟 · 3 回合`, `编辑`, `删除世界`, `改编`, and five visible save cards after expanding history. Rating submit and comment send remained disabled until their prerequisites were met.
- World Creator `/zh-cn/worlds/test-map-world-001-k4do/edit`:
  - After a normal load wait, `scrollWidth=352`, body width `352`, two iframe previews present, and 130 form/control elements rendered without horizontal overflow.
  - Core architecture remained present: `发布 v2`, visibility, remix permission, World-local character controls, installed App cards/configuration/uninstall, live Preview shell, and `删除这个世界` danger control.
  - The mobile Creator is long-form/stacked but not a separate reduced IA; the same high-impact controls remain exposed.
- Social Simulation `/zh-cn/sim/c86047d5-8289-47ea-ad77-173c01db4a90`:
  - At Turn 10, `scrollWidth=360` exactly matched viewport width. Runtime exposed Event/Memory/Advisor/Settings, main Story, Instagram, Time controls (`回溯时间（查看历史）`, `跳到下一个大事件`) and main input.
  - Focusing the main input and filling a local test string kept focus on placeholder `你要做什么？`, with no overflow. The string was cleared without submission, so no Turn or external side effect occurred.
- Conclusion: 360px is materially supported for read/use of the core flows tested; the Creator remains dense but structurally complete. Touch-only gestures, keyboard IME, orientation, long-press Dock reorder and device-specific safe-area behavior remain UNKNOWN.
- Confidence: dimensions, no-overflow and control presence `VERIFIED`; visual readability, gesture ergonomics and all page-specific failure states `UNKNOWN`.
- Next experiment: use a 360px phone-shell save to test touch/long-press/reorder and open/close App navigation without submitting new Turns; reset viewport after the mobile pass.

## EVD-0120 — Unified Search Eventually Converges on a Newly Remixed Public World

- Follow-up to EVD-0118, same owner account and exact query `测试应用升级世界 001`, full route `/zh-cn/worlds/search?q=...&tab=worlds`.
- Initial post-Remix snapshot omitted Account-A L2 `/test-map-world-001-k4do` while returning L0 and Account-B siblings and ending with `没有更多啦`.
- After waiting/reloading through a later normal session, the same complete World result list contained all four relevant public Worlds: L0 `/test-map-world-001-gytp`; Account-B L2 `/test-map-world-001-ouue`; Account-A L2 `/test-map-world-001-k4do`; Account-B L1 `/test-map-world-001-ft9r`; followed by `没有更多啦`.
- The L2 card had owner controls (`编辑`) for Account A and the other-account cards had viewer controls. Search indexing therefore converges asynchronously; the earlier omission was delay rather than permanent privacy or a hard result cap.
- Confidence: eventual Search inclusion and asynchronous convergence `VERIFIED`; exact propagation SLA, indexing queue trigger and ranking order `UNKNOWN`.

## EVD-0121 — Social Timeline Branch From Turn 6 Preserves Memory 1 and Truncates Later State

- Time: 2026-08-23 (Asia/Shanghai), owner account, Social save `/zh-cn/sim/c86047d5-8289-47ea-ad77-173c01db4a90`.
- Main baseline before branching: `TEST Social Mode Phone 001`, Turn 11, Story = independent classroom/pack-bag action, Memory `✦1` + `✦2`, stats `Popularity 31 / Grades 72 / Mood 95 / Style 61 / Money 60 / Stress 41`, and social/chat surfaces containing later party-warning/Tyler content.
- Timeline UI: `回溯时间（查看历史）` enters read-only historical mode and exposes one same-calendar-week node per completed Turn (11 nodes in this sample), filters `按轮次 / 按时间 / 按主线`, `导出`, `从这一轮创建存档点`, `恢复到此状态`, and `回到现在`. The main input is disabled with exact copy `查看历史状态时不可操作——回到现在后才能继续游戏`.
- Branch experiment: select Turn 6 (`和莱莉讨论一下周五派对要穿什么样的衣服…`), click `从这一轮创建存档点`, accept default-name modal then submit `TEST Social Rewind T6 Branch 001`. Toast `存档点已创建` appeared with direct link `/zh-cn/sim/05c4acfa-4d02-4f29-857a-30928bca8dcd`.
- Branch after reload: new UUID and Turn 6; Memory contains only `✦1`; Memory 2 and Turn-10/11 Story are absent. State reads `Popularity 28 / Grades 70 / Mood 80 / Style 50 / Money 60 / Stress 44`; relations retain earlier snapshot (Riley 91, Quinn 21 etc.). Chat/Instagram/party surfaces contain only content available by Turn 6.
- Main-save in-place Turn11→6 restore was attempted, but the browser request timed out and a later direct reload still showed original Turn 11. This was the state at the time of EVD-0121; the later user-confirmed Turn15→6 restore in EVD-0144 supersedes the terminal-status uncertainty and verifies the product behavior.
- Conclusion: checkpoint creation is a true fork that snapshots Story, Memory, stats, relations and social surfaces at the selected Turn; later state is not copied into the branch. The historical viewer is read-only and branch creation requires no Turn.
- Confidence: historical UI, 11 nodes, new UUID, Turn/Story/Memory/stats snapshot and truncation `VERIFIED`; in-place restore and exact event filtering `UNKNOWN`.

## EVD-0122 — Social Branch Regenerates a New Memory 2 From Post-Fork Events; Main-Save In-Place Restore Reproducibly Hangs

- Time: 2026-08-23 (Asia/Shanghai), owner account.
- Branch URL: `/zh-cn/sim/05c4acfa-4d02-4f29-857a-30928bca8dcd`; source URL: `/zh-cn/sim/c86047d5-8289-47ea-ad77-173c01db4a90`.
- Recovery of the missing-input state: the branch opened at Turn 7 with no textbox in the DOM because the Main Input App was minimized. Clicking the bottom-Dock `🎯` control restored `你的行动`, suggestions, voice input, textbox `你要做什么？`, and Send. Reload alone was not required. This is a panel-state behavior rather than lost Simulation data.
- Controlled branch run: Turn 7→8 action was to go home, eat, finish homework and sleep without phone/social contact; Turn 8→9 was solitary school attendance and note-taking without phone/social contact; Turn 9→10 was solitary lunch/revision without phone/social contact; Turn 10→11 was solitary library homework/note organization without phone/social contact.
- During all four deliberately non-social Turns, the visible Chat/Instagram feed remained unchanged: no new autonomous group-chat message, direct message or Instagram post appeared. Relations also remained Riley 91 / Sienna 15 / Quinn 21 / Dre 10 / Jax 5. Stats continued to evolve independently: Turn 8 `28/77/91/50/60/36`, Turn 9 `28/81/94/50/60/31`, Turn 10 `28/84/98/50/60/24`, Turn 11 `28/88/100/50/60/16` for Popularity/Grades/Mood/Style/Money/Stress.
- Memory behavior: the branch retained only `✦ 1` through Turn 10. At Turn 11 it generated a new `✦ 2`. The new summary described the branch-specific shopping-plan context followed by the player's prolonged disconnected study routine, and its aggregate Grades/Stress/Mood/Style changes. It was not a copy of the source save's original Memory 2. Thus a checkpoint fork preserves prior summaries but resumes future summary generation from its own post-fork event stream; the exact trigger can land one Turn later than the source sample.
- Source in-place Rewind retry: the source was independently reloaded at Turn 11 with stats `31/72/95/61/60/41`, Memory 1+2 and party-warning Chat state. Timeline reliably entered read-only Turn 6 with stats `28/70/80/50/60/44` and no Memory 2. Three bounded restore attempts were made through semantic and DOM-visible controls. Each `恢复到此状态` interaction caused the browser control request to remain pending until timeout; no native confirm became inspectable, and an independent fresh direct page still loaded the source at Turn 11 with unchanged stats. This remains useful automation-boundary evidence, but EVD-0144 later completed the native confirmation and verified the actual product result.
- Confidence: minimized Main Input recovery, branch Turns 8–11, no new social-feed content in this controlled run, branch-specific Memory 2 regeneration and Stats progression `VERIFIED`; this entry's restore interaction was an automation limitation later resolved by EVD-0144, not a current product `UNKNOWN`.

## EVD-0123 — Deleting a Global Character Source Preserves All Tested Copies but Tombstones the Source Chat Save

- Time: 2026-08-23 (Asia/Shanghai), authenticated source owner account, desktop viewport.
- Deleted source: global Character `测试角色 001`, source Character ID inferred from its prior Chat link as `5825c6db-0e49-4e87-ab42-c4473e713e7d`; last source intro marker `来源更新测试 0104`.
- Delete path: `/zh-cn/characters` → exact search `测试角色 001` → owner control `从你的角色库中删除这个角色?` → accept the native browser confirmation.
- Immediate result:
  - deletion completed in place on `/zh-cn/characters`;
  - no toast, redirect or recover/undo control appeared;
  - after refresh, the global source card, source intro marker and source delete control were absent;
  - Character Library retained only the same-name World-local record labeled `测试应用升级世界 001`, with intro `产品调查测试角色 · 已编辑` and an `编辑` control.
- Search/index result: an exact Unified Search query also returned only the World-local Character; the global source disappeared immediately from the searchable source/library surface.
- World and Remix descendants:
  - published L0 World `/zh-cn/worlds/test-map-world-001-gytp` still displayed its World-local `测试角色 001`;
  - World Remix descendants `/zh-cn/worlds/test-map-world-001-ft9r`, `/zh-cn/worlds/test-map-world-001-ouue` and `/zh-cn/worlds/test-map-world-001-k4do` all retained their copied Character snapshot;
  - L0 Creator `/zh-cn/worlds/test-map-world-001-gytp/edit` still contained name `测试角色 001` and the local prompt `World-local copy edited for propagation test.`;
  - the Creator still showed the pre-existing unpublished `发布 v6` Draft caused by App deletion. Source Character deletion did not visibly create another World version or mutate the World-local fields.
- Character Remix descendants: Mine → Character → Created still listed `TEST Character Remix L1` and `TEST Character Remix L2`. L1 detail retained its intro, Chat, Add to World and icon-style Remix control, with no source attribution visible. The source deletion did not cascade into these copies.
- Chat/Simulation consequence:
  - the source Character's independent Chat save `/zh-cn/sim/33c8dcf4-5581-4a0e-8f52-fa9aefdcd4a5` now returned 404;
  - the global sidebar History still retained a link labeled `测试角色 001` with `char:5825c6db-0e49-4e87-ab42-c4473e713e7d · 回合 1`;
  - this matches the already observed App-deletion pattern in which an index can retain a tombstoned Simulation link after the direct resource stops resolving.
- Limits:
  - global Character detail is a Drawer inside `/characters`, so there was no stable source-detail URL available for a separate direct-URL 404 test;
  - an old World Simulation `/zh-cn/sim/26faf299-fb09-42fe-b60b-4e0525a48427` still resolved at Turn 3, but its current visible App set exposed Main/Story/Map and no Character State panel, so it cannot prove or disprove runtime Character-state preservation;
  - `/zh-cn/worlds/test-map-world-001-gytp/new` lists Apps/save setup but does not directly enumerate World Characters;
  - an exact post-deletion L1 Character Remix Chat terminal result was not yet obtained. One earlier accidental Chat opened an unrelated `旅/旅人` session and is excluded from this evidence.
- Conclusion: deleting the reusable global Character source does not delete or mutate the tested World-local snapshot, published World copy, World Remix descendants or Character Remix L1/L2. It does tombstone the source's own independent Character Chat Simulation while leaving a stale History entry that still links to the now-404 save.
- Confidence: source disappearance, World-local/World-Remix/Character-Remix preservation, Creator field preservation, source Chat 404 and History-link retention `VERIFIED`; descendant Chat runtime and World-Simulation Character-state preservation `UNKNOWN`.
- Next experiment: open L1 Chat by an exact card/detail path and complete one Turn; create a fresh Simulation from a World that visibly includes the preserved World-local Character; compare runtime state before and after publishing the current World v6 Draft.

## EVD-0124 — Character Remix L1 Chat Remains Fully Runnable After Its Original Source Is Deleted

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account.
- Path: `/zh-cn/sims` → Works → Character → Created → exact card `TEST Character Remix L1` → card-local `聊天`.
- Before: original global source `测试角色 001` had already been permanently deleted and its own Chat save `/zh-cn/sim/33c8dcf4-5581-4a0e-8f52-fa9aefdcd4a5` returned 404 (EVD-0123).
- Result of exact card-scoped Chat action:
  - created/opened stable L1 Chat Simulation `/zh-cn/sim/9cb26802-ff99-4c4a-b565-538184a2e728`;
  - initial messages identified the current object as `TEST Character Remix L1`;
  - submitted one real Turn: `SOURCE_DELETED_L1_CHAT_TEST：请确认你仍能独立回应，并简短介绍自己。`;
  - the AI completed the Turn and replied in multiple messages, including `没问题，我完全独立。` and `你可以叫我 TEST Character Remix L1。`;
  - the page generated follow-up suggestion buttons and unlocked for the next action;
  - a direct full navigation back to the same UUID retained the user message and all generated replies.
- Cost/state: the account energy indicator decreased by one charged Character-Chat Turn during this experiment; no source resurrection, error or attribution prompt appeared.
- Conclusion: the L1 Character Remix is not merely a stale library/display card. It owns an independently resolvable and persistent Chat runtime that continues to function after permanent deletion of the original global Character source.
- Confidence: exact L1 card selection, stable UUID, completed AI response and reload persistence `VERIFIED`; L2 Chat and delete-parent/L1 delete cascade remain `UNKNOWN`.

## EVD-0125 — Mixed Map v4 Publishes With a 10-App Gate and Migrates Both New and Existing Simulations

- Time: 2026-08-23 (Asia/Shanghai), authenticated World owner account.
- World/Creator: `/zh-cn/worlds/hogwarts-3bmx/edit#app-map`, World `TEST World 001`, previously public through v3 with existing v1 save `/zh-cn/sim/10824e9b-4467-42a6-861a-efc0c4ef137c`.
- Draft Map before publication:
  - a deliberately mixed definition built by importing the WWII source with `仅底图`, then the Three Kingdoms source with `仅区域`;
  - `61` regions, `13` factions, actions `Attack this commandery`, `Reinforce / garrison`, `Develop (farms & levies)`, `Send an envoy`;
  - shared attributes `Garrison` and `Supplies`; marker disabled; faction-to-World-Character selectors all left `— 无 —`.
- Save/publish path:
  - `保存并退出` closed the Map Editor to Creator `#app-map`;
  - `保存 App 配置` closed the App configuration surface;
  - first v4 Publish attempt with 11 installed Apps failed only at final publish submission and emitted toast `Worlds hold up to 10 apps`;
  - this proves a Draft can temporarily contain more than the publication limit and the hard validation is deferred to publish;
  - removed the Movie App, reducing the World to 10 Apps; this action was intentionally included in the v4 lifecycle experiment;
  - second publish succeeded and redirected to `/zh-cn/worlds/hogwarts-3bmx`.
- Public v4 result:
  - version title `Mixed Map WW2 Base + Three Kingdoms Regions` and exact changelog persisted as latest v4;
  - public Apps list contains 10 Apps including Map and excluding Movie;
  - public cost range is `7–16 电量 / 回合`;
  - existing save remained listed as `TEST World v1 Save 001 · 回合 0`.
- Existing v1 Simulation migration:
  - reopening `/zh-cn/sim/10824e9b-4467-42a6-861a-efc0c4ef137c` produced a modal stating `世界配置已更新至 v4`, the version title/changelog, and `应用更新` / `暂不更新`;
  - before applying, the save still had Movie and no Map in its visible Dock/window set;
  - clicking `应用更新` completed without consuming a Turn: it stayed at Turn 0 and preserved the complete opening Story, Character Stats/Chat, Wallet 50, Inventory and Time;
  - Movie disappeared and Map appeared in both the window set and Dock;
  - the migrated runtime visibly exposed the Map shell/search/reset controls. The page-provided Simulation state also contained Three Kingdoms `mapOwners` (for example `caocao`, `liubei`, `yuanshao`), per-region `Garrison`/`Supplies` state and currentVersion/latestVersion 4. This state is used only to corroborate the visible Map/runtime migration, not to infer hidden server implementation.
- Fresh v4 Simulation:
  - `/zh-cn/worlds/hogwarts-3bmx/new` listed exactly the new 10-App composition including Map and excluding Movie;
  - created `TEST Mixed Map v4 New Simulation 001` → `/zh-cn/sim/05ac8dda-b534-415b-94aa-74ffa3378c00`;
  - new save opened at Turn 0 with Map visible, Movie absent, and the same 61-region ownership plus Garrison/Supplies initialization in the page-provided state.
- Catalog/discovery edge:
  - immediately after publication, `/zh-cn/maps` exact search `TEST World 001` returned `暂无地图` in both the default `有底图` view and `我的` view;
  - direct public World and both Simulations still exposed the Map. Therefore Maps catalog inclusion is not transactionally identical to World publication/runtime availability. Whether this is indexing delay or a base-map eligibility failure remains `UNKNOWN`.
- Conclusion: Map composition is versioned through World Publish. Applying v4 to an existing save performs a zero-Turn App-set migration plus Map-state initialization while preserving unrelated Simulation state; a new save starts directly on v4. The publish boundary also enforces the 10-App maximum even though the Draft can exceed it.
- Confidence: v4 publish/version log, publish-time 10-App validation, existing-save update modal, zero-Turn preservation, Movie removal, Map addition, new-save composition and Three Kingdoms ownership/region attributes `VERIFIED`; exact visual WWII base preservation and Maps-catalog omission cause `UNKNOWN`.
- Next experiment: trigger a visible region selection/action in the new and migrated saves to compare action labels/attributes; recheck `/maps` after indexing delay; test one faction→Character binding and marker field in a later disposable version.

## EVD-0126 — Publishing the App-Removal World Version Restores a Previously 404 Save Without Restoring the Deleted App

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account.
- World/App context:
  - World `/zh-cn/worlds/test-map-world-001-gytp` was publicly at v5 when owner-final-delete of `TEST App 001` removed the App from the public composition and created an unpublished v6 Draft;
  - the App direct URL `/zh-cn/apps/test-app-001` and App Market entry were already 404/absent;
  - v5 save `/zh-cn/sim/2ba0bf5b-68d1-4b50-8b67-4a0c7d1468b7` had become direct-URL 404 while Mine and World save lists retained its normal link (EVD-0111–0113).
- v6 publication:
  - opened `/zh-cn/worlds/test-map-world-001-gytp/edit`, which showed `发布 v6`, the preserved World-local Character and only Main Input, Story, Map and Time Apps;
  - published title `Removed TEST App After Cascade Audit` with changelog documenting the permanent App deletion and four-App composition;
  - received toast `发布成功。` and redirect to the public World detail;
  - public detail now shows v6 as latest, the four Apps, the World-local Character, `9–13 电量 / 回合`, and the prior v1–v5 version history. All five save/index cards remain listed.
- Previously 404 v5 save recovery:
  - reopening `/zh-cn/sim/2ba0bf5b-68d1-4b50-8b67-4a0c7d1468b7` after v6 publication now resolved normally at Turn 2 instead of 404;
  - it displayed a standard update dialog from current v5 to v6, including the v6 title/changelog and `应用更新` / `暂不更新`;
  - before applying, the visible save was already usable with Story/Map/Time and no deleted App surface;
  - clicking `应用更新` completed at zero Turn, preserved Turn 2, complete Story, suggestions, Map and Time, and left the four-App Dock composition intact;
  - direct reload remained resolvable.
- Older save comparison: `/zh-cn/sim/26faf299-fb09-42fe-b60b-4e0525a48427` also resolved and showed the same v5→v6 update dialog while preserving its Turn 3 Story/Map/Time state.
- Deleted App remains deleted: after World v6 publication, `/zh-cn/apps/test-app-001` still returned 404. Recovery does not recreate the App or its public resource.
- Conclusion: the v5 save's earlier 404 was not a permanent Simulation deletion. It was a temporary resolution failure while the latest published World version still referenced a now-deleted App and only a private v6 cleanup Draft existed. Publishing the dependency-clean v6 makes the same UUID resolvable again and offers the normal version migration path. Save-list retention was therefore accurate object retention, even though the resource was temporarily unresolvable.
- Confidence: v6 publish, public version/App/Character state, v5-save recovery, update modal, zero-Turn Apply and deleted-App continued 404 `VERIFIED`; exact backend resolution algorithm and behavior for other users' Worlds that reference a deleted App remain `UNKNOWN`.
- Product implication: treat App deletion as a two-phase cross-object lifecycle. A dependent published World may enter a broken-reference interval until its generated cleanup Draft is published; Simulation records and indexes can survive that interval and recover under a later dependency-clean World version.

## EVD-0127 — Character Remix L2 Chat Remains Runnable and Persistent After Original-Source Deletion

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account.
- Object/path: `TEST Character Remix L2` → card-local `聊天` → `/zh-cn/sim/e53f58ad-f97f-430f-87a3-f06e343ce1dd`.
- Precondition: original global Character source had already been permanently deleted; its own Chat save returned 404, while L1/L2 Remix cards remained in Mine.
- Action: submitted `SOURCE_DELETED_L2_CHAT_TEST：请确认你仍能独立回应，并明确说出你的角色名称。`.
- Result:
  - the Character completed a real AI Turn and explicitly replied that its role name was `TEST Character Remix L2`;
  - no missing-source, attribution, permission or resurrection prompt appeared;
  - direct full navigation back to the same UUID retained the user message and generated reply.
- Conclusion: L2 has the same independent runtime/persistence property already proven for L1. Character Remix descendants are usable copies rather than live source references even two generations deep.
- Confidence: exact L2 object selection, stable UUID, completed response and reload persistence `VERIFIED`; deletion/edit controls on Remix objects and behavior after deleting an intermediate parent remain `UNKNOWN`.

## EVD-0128 — A Source-Deleted World-Local Character Still Powers Fresh Chat and Character-State Runtime Across World Versions

- Time: 2026-08-23 (Asia/Shanghai), authenticated World owner account.
- World: `/zh-cn/worlds/test-map-world-001-gytp`; preserved World-local Character `测试角色 001`; original global Character source already permanently deleted.
- v7 publication:
  - Creator installed the official Chat App and published World v7 with title `Post-Delete World-local Character Chat Audit`;
  - public composition became Main Input, Story, Map, Time and Chat;
  - created fresh Simulation `TEST Post-Delete Local Character Runtime 001` at `/zh-cn/sim/fd370969-d790-4035-a581-b46b88a9cd15`;
  - the new save automatically created a private chat with `测试角色 001`;
  - submitted a real Chat action, advancing Turn 1→2; the Character replied `测试角色 001 已就位……我正观察着这个世界的脉动`;
  - direct reload preserved the Chat transcript and Turn 2.
- Creator conflict state:
  - attempting to install Chat and Character State in rapid succession on the same Draft produced `草稿已在其他页面更新,点击刷新后继续`;
  - refresh kept the server-saved Chat installation but lost the not-yet-stable Character State installation;
  - this is another reproducible autosave/concurrent-Draft arbitration boundary, so the two installs were published as separate versions.
- v8 publication and existing-save migration:
  - installed the official Character State App and published v8 as `Post-Delete World-local Character State Audit`;
  - the v7 save received the normal v7→v8 update modal;
  - `应用更新` consumed zero Turn, kept Turn 2, and preserved Story, Chat and Map;
  - the Dock added Character State, whose runtime view contained a `测试角色 001` Character entry.
- Conclusion: deletion of the reusable global source does not prevent a preserved World-local snapshot from initializing a fresh Simulation, producing persistent Character Chat, or being materialized by a later Character State App. World-local Character data is version/runtime independent of source existence.
- Confidence: v7/v8 publication, fresh Chat initialization, charged Chat Turn, reload persistence, zero-Turn update and Character State entry `VERIFIED`; exact state-field values, member/private access enforcement and conflict arbitration policy remain `UNKNOWN`.

## EVD-0129 — Simulation Permanent Delete Removes Lists and Makes the Stable UUID Return 404

- Time: 2026-08-23 (Asia/Shanghai), authenticated World/save owner account.
- Deleted save: `TEST App v4 Simulation 001`, `/zh-cn/sim/26faf299-fb09-42fe-b60b-4e0525a48427`.
- Pre-delete state: the save remained resolvable at Turn 3 and had successfully applied the v5→v6 World update while preserving Story, Map and Time.
- Path: World detail `/zh-cn/worlds/test-map-world-001-gytp` → `你的存档` → target save `删除`.
- Confirmation modal:
  - title `确认永久删除该存档？`;
  - echoed the exact save name;
  - actions `取消` and `删除`.
- After confirming:
  - the save disappeared from the World's save list after refresh;
  - the World `继续` action selected the next remaining save rather than the deleted UUID;
  - direct navigation to the former stable UUID returned 404;
  - no undo, trash, restore or recovery path was shown.
- Conclusion: normal Simulation deletion is a destructive resource lifecycle distinct from the temporary broken-dependency 404 in EVD-0111–0126. It removes the owner-facing list entry and leaves the deleted UUID permanently unresolved in the tested surface.
- Confidence: modal, submission, list removal, Continue retargeting and direct-URL 404 `VERIFIED`; backend retention period and administrative recovery are outside normal product access and remain `UNKNOWN`.

## EVD-0130 — Mixed Map Region Runtime Is Consistent Across Fresh and Migrated Saves

- Time: 2026-08-23 (Asia/Shanghai), authenticated World owner account.
- Saves: fresh v4 `/zh-cn/sim/05ac8dda-b534-415b-94aa-74ffa3378c00` (`TEST Mixed Map v4 New Simulation 001`) and existing v1 save migrated to v4 `/zh-cn/sim/10824e9b-4467-42a6-861a-efc0c4ef137c` (`TEST World v1 Save 001`).
- Opened Map in each save and selected the same visible region `江夏`.
- Both drawers showed faction `刘表`, `驻军/Garrison=8000`, `粮草/Supplies=55000`, and identical adjacent regions `襄阳、江陵、长沙、豫章、汝南、新野、庐江`.
- Both exposed `进攻该郡`, `增援 / 驻军`, `发展（农耕与征兵）`, `派遣使者`, custom action input, faction dialogue, advisor and copy-name controls.
- Selected `🌾 发展（农耕与征兵）` in both saves. Each advanced Turn 0→1 and recorded `🌾 发展（农耕与征兵） · 江夏` in the Events panel. The fresh v4 canvas visibly combines a geographic relief/base layer with Three Kingdoms-colored province overlays and labels.
- After additional reload/wait, `/zh-cn/maps` exact search `TEST World 001` still returned `暂无地图` in both `有底图` and `我的`, although World and both Simulation Map Apps remained directly usable.
- Conclusion: new and zero-Turn migrated saves consume the same Map definition and produce equivalent region state, adjacency, action schema and event targeting; runtime availability is separate from catalog discoverability.
- Confidence: same-region state/action/event parity and mixed-map visual rendering `VERIFIED`; post-action numeric delta and catalog omission cause `UNKNOWN`.

## EVD-0131 — Map Faction-to-Character Selector and Marker Controls Are Exposed, but Persistence Is Load-Blocked

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account.
- Page: World Creator `/zh-cn/worlds/hogwarts-3bmx/edit#app-map` -> `打开地图编辑器`.
- Controls observed: `保存并退出`, `退出`, `查看`, `刷归属`, `绘制区域`, `地图设置`, region-map/base-map toggle, region search, zoom in/out/reset; 13 faction rows with color/name/count fields, remove buttons and native `关联角色` selects; Map App-level `把地图上的阵营作为角色`, `地图棋子（marker）` and `添加棋子`.
- Each relation select offered `— 无 —` plus the ten existing World-local Characters (`哈利·波特` through `阿不思·邓布利多`). Selecting the first faction (`Lü Bu`) to `哈利·波特` changed the live DOM value to `harry`.
- Clicked `保存并退出`. No success/error toast was exposed before returning to Creator. Reloading the same URL twice (original tab and a fresh tab) left the page at `main "Loading world"` for at least 7 seconds, with no 404, modal, toast or server-confirmation state. The selected relation could not be re-read after reload, and no Publish/runtime conclusion is safe.
- Conclusion: faction-row character relation and marker controls are `VERIFIED` as public Creator controls; whether relation edits persist, how the World-level and Map-App-level roleization flags interact, whether duplicate bindings are allowed, and how linked factions appear in Character State/Chat remain `UNKNOWN / load-blocked`.
- Confidence: control inventory and local selection `VERIFIED`; server persistence, publish behavior, runtime identity/alias semantics and marker lifecycle `UNKNOWN`.
- Next experiment: retry after the Creator data-loading issue clears; first reload and inspect the select value, then publish a disposable version and create/apply a fresh Simulation. Separately add one marker and compare its saved definition, region drawer display, movement controls, Turn delta and Rewind behavior.

## EVD-0132 — Non-owner Official App Detail Surface Has Preview/Rating/Comment/Install but No Owner Lifecycle Controls

- Time: 2026-08-23 (Asia/Shanghai), authenticated test account; official App detail `https://worldos.cc/zh-cn/apps/map`.
- Visible detail controls and states: `返回`; App identity/category (`地图`, `核心`, `策略`), creator link (`WorldOS`), usage count (`2131 个世界在用`), `送礼`, `安装`, description; supporter ranking empty state (`还没有人送出礼物` plus `成为第一位支持者`); five-star rating inputs with `我的评分` and disabled `提交评分` until a selection; `在线试玩` panel with `重置预览` and explicit copy `预览 · 操作不会生效`; comments image attachment, comment textbox and disabled `发送` when empty; a horizontal `用了这个 App 的热门世界` section with World cards, `改编` and `立即开始`.
- Non-owner boundary: this view did not expose `编辑`, `删除`, `下架/取消发布` or version-management controls. Those controls are owner-only or otherwise absent for this viewer; this observation does not prove they do not exist for the App owner.
- No rating, gift or comment was submitted in this pass because those are external/representational side effects. No App install was committed from this detail page.
- Confidence: visible detail/preview control inventory and explicit non-owner absence `VERIFIED`; exact owner-only permission matrix, rating/gift/comment notification effects and App install commit semantics for arbitrary Apps remain `UNKNOWN` or covered by prior evidence.

## EVD-0133 — App Creator Empty State, Tutorial and Configuration Surface

- Time: 2026-08-23 (Asia/Shanghai), authenticated test account; `/zh-cn/apps/create` before creating or publishing an App.
- Empty state: heading `App 工作室`; AI description textbox is empty and its submit button is disabled; preview title is `未命名 App`; test-action textbox and send button are disabled; Story panel says no App exists. `HTML`, `配置`, `教程`, `重置预览`, `自己写 HTML`, `复制 AI 提示词`, `存草稿` and `发布` controls remain visible.
- Tutorial modal: five steps explain AI generation, live preview testing, the configuration/runtime split, Draft vs Publish visibility, and post-install behavior. It explicitly states Draft is owner-only, Publish places the App in App Market for any creator to install, and installs/likes/ratings generate creator notifications.
- Configuration fields: slug (default `my-cool-app`), name, emoji/image icon, title-bar color (hex text + color input), one-line description, up to three tags with quick category buttons; App Market detail text; optional update notes; built-in AI instruction; Initial JSON (default `{}`); refresh-enabled checkbox (checked by default), custom refresh prompt; and Events templates for `update`, `set`, `inc`, `push`, `remove`, `action` with documented placeholders.
- No draft/publish action was submitted in this empty-state pass. The `HTML` tab click did not replace the visible blank configuration because no App content exists; this is recorded as a state-dependent UI response, not as absence of HTML editing.
- Confidence: empty-state controls, tutorial copy and configuration schema `VERIFIED`; exact validation/transition when fields are filled in a new App, first-publication behavior and notification side effects remain `UNKNOWN` or covered by prior lifecycle evidence.

## EVD-0134 — New App Draft Persists as Owner-Only v1 and Requires Slug Route to Reopen

- Time: 2026-08-23 (Asia/Shanghai), authenticated test account; `/zh-cn/apps/create`.
- Action: in a fresh App Creator, entered HTML `<div id='test-app-first-publish'>TEST FIRST PUBLISH HTML</div>`, slug `test-app-first-publish-001`, name `TEST App First Publish 001`, blue title color, one-line description, detail text, AI instruction, Initial JSON `{"clicks":0,"status":"draft-seed"}`, selected the `系统` tag, then clicked `存草稿`.
- Immediate result: toast `草稿已保存。`; the same creator page retained all fields and remained on `/zh-cn/apps/create` (no draft UUID/slug route or public detail redirect appeared).
- Reload result: direct bare `/zh-cn/apps/create` reload returned to the empty creator state: title `未命名 App`, blank HTML/config/description and disabled preview test input. No error or warning appeared; console logs had no error/warn entries.
- Mine result: `/zh-cn/sims` → `App` showed `TEST App First Publish 001` with `未公开`, `0 个世界在用`, `收藏` and `安装`. Clicking the card opened an owner drawer with `详情`, `编辑`, `删除`, `安装`; `详情` linked to `/zh-cn/apps/test-app-first-publish-001`, and `编辑` linked to `/zh-cn/apps/create?slug=test-app-first-publish-001`.
- Slug-route result: opening `/zh-cn/apps/create?slug=test-app-first-publish-001` restored the HTML iframe and all entered configuration fields. The owner detail showed `v1`, `未公开`, Preview, `编辑`, `删除`, `安装`, rating/comment surfaces and `更新日志` entry `v1 ... Initial draft for EVD-0134`.
- Market result: current owner-side `/zh-cn/apps` search for the exact title also showed the card, still marked `未公开`; this does not prove independent viewers can discover it.
- Conclusion: `存草稿` creates a durable owner-only App resource/version (observed as v1) but the bare Creator route does not hydrate it. Reopening requires the slug query or Mine owner drawer. `未公开` is a distinct visibility state from the public App Market result for other viewers.
- Confidence: toast, owner Mine/detail/editor links, v1 log, slug-route restoration and owner-side `未公开` indexing `VERIFIED`; independent-viewer visibility, first Publish transition and public Search behavior remain `UNKNOWN`.
- Next experiment: re-enter via `?slug=...` and click `发布` after action-time confirmation; inspect whether the `未公开` badge changes, whether v2 or no new version is created, and how an independent session sees the result.

## EVD-0135 — Social Simulation Turn 12–15 Generates Memory 3 and Continues Cross-State Progression

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account.
- Simulation: `TEST Social Mode Phone 001` `/zh-cn/sim/c86047d5-8289-47ea-ad77-173c01db4a90`, starting at Turn 11 with Memory 1 and Memory 2 visible.
- Turn 12: submitted a home study/phone reply action. The first semantic click left the input unchanged and Turn 11 unchanged; pressing Enter on the focused textarea submitted successfully. Turn advanced to 12, Story changed to the evening-at-home scene, grades increased from 72 to 74, mood to 100 and stress dropped from 41 to 31. No new Memory header appeared and existing relationship/Instagram/Chat cards persisted.
- Turn 13: submitted an early-arrival/library study action. Turn advanced to 13 and calendar moved to `高一 · 秋季 · 第 2 周`; Story described deliberate social-media disconnection and study. Events recorded `成绩 +4`, `压力 -10`, `心情 +5`, `穿搭 +2`; Memory remained at 1 and 2. During generation, input, refresh and rewind controls were disabled; after completion they re-enabled.
- Turn 14: submitted an observational lunch action. Turn advanced to 14; Story described hearing party rumors and observing Sienna/Dre without direct interaction. Events recorded `人气 +2`, `压力 -5`, `心情 +5`; no new Chat/Instagram post or relationship card appeared.
- Turn 15: submitted a phone/Riley planning action. Turn advanced to 15. A third Memory summary (`✦ 3`) appeared, with branch content summarizing the prior rehearsal, library study, lunch observation and strategic reconnection; it explicitly incorporated the recent state changes. Existing Memory 1/2 remained visible. No new autonomous Chat/Instagram card was observed in the final UI; existing Riley/group/party cards persisted.
- Conclusion: Social Simulation continues ordinary Turns with cross-App state deltas and calendar progression; Memory summaries can continue beyond Turn 10 (Memory 3 appeared by Turn 15), and summary content is generated from the recent event stream. Autonomous social content is not emitted every Turn in this sample; exact cadence/token threshold and trigger conditions remain UNKNOWN.
- Confidence: Turn 12–15 progression, state deltas, Memory 3 creation, control locking and absence of new social cards in these four final states `VERIFIED`; exact scheduling threshold and provider failure behavior `UNKNOWN`.
- Next experiment: compare a Chat-heavy sequence versus non-social sequence beyond Turn 15, then Rewind across the Memory 3 boundary and inspect whether the summary is truncated/rebuilt like prior branch behavior.

## EVD-0136 — App Draft Owner Detail and Search Boundary; Worlds Narrow-Shell Inventory

- Time: 2026-08-23 (Asia/Shanghai), authenticated test account.
- App Draft: reopened `/zh-cn/apps/create?slug=test-app-first-publish-001`; all HTML/configuration fields restored, including slug, name, detail, AI instruction, Initial JSON, refresh policy and six event templates. The bare `/zh-cn/apps/create` route still returns the empty Creator state after reload. Owner detail `/zh-cn/apps/test-app-first-publish-001` exposes `编辑`, `删除`, `安装`, Preview/Reset, rating inputs, comments and an update-log entry `v1`; the card is marked `未公开`.
- Search boundary: exact query `test-app-first-publish-001` at `/zh-cn/worlds/search?q=...` showed the unified All/World/Character/User/App tabs and no result in the current owner session. This is consistent with Draft being owner-only, but independent-viewer visibility remains untested.
- No first-publication click was submitted in this evidence pass. The App remains a durable owner-only v1 Draft pending the action-time confirmation required for the public Publish side effect.
- Mobile/viewport check: at the requested narrow-shell experiment, the browser backend reported `innerWidth=1280` and `scrollWidth=1272`; the explicit 390px override did not take effect. Worlds `/zh-cn/worlds` was otherwise inspected and exposed the mobile-style route controls, featured carousel (`上一个`/`下一个`/page buttons), search, create, sort tabs, genre chips, Remix and Start cards, owner World sections and simulated-World sections. Because the actual viewport remained desktop width, true 390px overflow/touch behavior is `UNKNOWN / environment-blocked`.
- Conclusion: owner Draft hydration requires a slug query or Mine/detail link; owner-only status is not indexed by the unified public search in this session; the narrow viewport result cannot close the mobile gate.
- Confidence: Draft restoration, owner controls and search result state `VERIFIED`; independent permission enforcement, first Publish transition and true mobile layout `UNKNOWN`.
- Next experiment: after action-time confirmation, click Publish once, record modal/toast/version/visibility changes, then test direct viewer/search visibility and owner lifecycle controls.

## EVD-0137 — Map Faction Binding Survives Draft Save/Reload; Marker Add Has No Form Result

- Time: 2026-08-23 (Asia/Shanghai), authenticated World owner account.
- Page: `/zh-cn/worlds/test-map-world-001-gytp/edit`, Map App configuration and `打开地图编辑器`.
- Recovery: after the earlier `Loading world` state, waiting on the Creator restored the full editor. The editor showed the existing 47-region/2-faction map, two faction rows and Map App settings.
- Action: selected the first faction (`Demons`) native `关联角色` select to `测试角色 001` (`value=001`), clicked `保存并退出`, waited for the Creator to return, then reloaded the Creator. After the load completed and the editor was opened again, the first faction relation remained selected while the second remained `— 无 —`.
- Marker action: `地图棋子（marker）` was already checked. Clicking `添加棋子` produced no modal, new form fields, toast, or visible list entry in the current editor state. The control is triggered but its creation affordance/required canvas interaction is still unknown.
- Conclusion: faction→World-local Character association persists across the tested Draft save/reload boundary. This does not yet prove published-version propagation, runtime alias/ID behavior, duplicate-binding rules or Character State/Chat exposure. Marker creation remains `UNKNOWN` rather than absent.
- Confidence: Draft association persistence `VERIFIED`; marker lifecycle, runtime semantics and publish propagation `UNKNOWN`.
- Next experiment: publish a disposable version after the public Publish confirmation, create a fresh Simulation, inspect Map/Character State/Chat; separately test marker placement by interacting with the map canvas or a fully configured map.

## EVD-0138 — Simulation Export Is a Membership-Gated Feature

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account; Simulation `/zh-cn/sim/05ac8dda-b534-415b-94aa-74ffa3378c00`.
- Path: Simulation `设置` → `导出交互记录 会员`.
- Result: clicking the control opened a purchase/upgrade modal instead of a download. The modal states `导出模拟记录是会员功能`, offers one-time/subscription/self-provided-API tabs, displays Explorer ¥50/month, Voyager ¥108/month and Legend ¥218/month plans, and lists export formats `Markdown / HTML / TXT` among membership benefits. It also links to `/zh-cn/rewards` for free credits. No payment option was selected or submitted.
- Conclusion: export is a product capability behind a membership wall; the current account cannot inspect file schema without purchasing. Export schema and any post-upgrade download behavior remain `UNKNOWN`, not absent.
- Confidence: membership wall, plan labels/prices and advertised formats `VERIFIED`; file contents and download lifecycle `UNKNOWN`.

## EVD-0139 — Account BYOK Boundary Exposes Disabled Save/Test Controls Without Key Submission

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account; `/zh-cn/account?tab=engine` (World Model tab).
- Visible controls: OpenRouter key textbox `sk-or-...`, disabled `测试并保存` until a key is entered, model buttons for Free/DeepSeek/GLM/Kimi/Qwen, `更多模型`, custom OpenAI-compatible gateway fields (Base URL, key, model id) and disabled `测试并添加` until fields are filled. Copy says self-provided API calls use the user's provider and do not consume WorldOS energy.
- No key, gateway credential or model id was entered or transmitted. No external payment or API call was initiated.
- Conclusion: account-level BYOK configuration is an explicit gated boundary; successful validation, encrypted-storage behavior, provider error/retry and cross-save model availability remain `UNKNOWN` and are covered by the existing Open Questions.
- Confidence: labels, disabled-state gating and no-submit safety boundary `VERIFIED`; successful BYOK behavior `UNKNOWN`.

## EVD-0140 — World Creator Empty State, Template Modal and Preview Mode Controls

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account; `/zh-cn/worlds/create`.
- Empty Creator: `创建世界` is disabled with no title, cover, description or content. The page still exposes theme palette (18 presets plus custom), cover upload, Markdown/HTML edit/preview, visibility (`公开`, `不公开列出 会员`, `私有 会员`), Remix permission, character/library controls, player initialization fields, App install/configuration, system rules, player tools/console, live preview and three device/mode buttons (`自由沙盒 · 电脑版`, `自由沙盒 · 手机版`, `文游小手机`).
- Template modal: clicking `题材模板` opens 11 selectable presets including `现代恋爱`, `校园青春`, `修仙`, `武侠江湖`, `宫斗`, `穿越异世界`, `爱豆偶像`, `西幻冒险`, `末日生存`, `赛博朋克`, `战争政权`. The preset buttons expose their intended initialization-field summaries. Selecting `修仙` on the empty draft closed the modal without creating a World or enabling Publish; field materialization on a saved/created World remains covered by prior template evidence.
- Preview mode: clicking `自由沙盒 · 手机版` changes its button to `[active] [pressed]` while desktop becomes unpressed. This is a Creator preview-mode state change, not evidence that the browser viewport is physically mobile.
- No create/publish action was submitted; no external side effect occurred.
- Confidence: empty-state controls, template inventory/modal and preview mode toggle `VERIFIED`; template persistence after create, mobile physical layout and validation/error recovery remain `UNKNOWN`.

## EVD-0141 — Unused Draft App Delete Confirmation Checks Usage Before Irreversible Modal

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account; `/zh-cn/apps/test-app-first-publish-001`.
- Action: clicked owner `删除` on the zero-use, unlisted Draft App detail.
- Intermediate state: page showed `正在检查使用情况…` while the usage check ran; no immediate destructive request was confirmed in the visible UI.
- Confirmation state: after the check, a destructive modal appeared with heading `删除这个 App?`, copy `此操作不可恢复。`, and `取消` / `删除` actions. The modal did not mention dependent Worlds because usage was zero.
- The modal was cancelled. The App, Draft v1 and detail URL remained intact. No resource or public state was changed.
- Conclusion: App deletion has an explicit usage-check stage and an irreversible confirmation layer. This zero-use path differs from the previously verified “used in 1 World; uninstall first” warning for `TEST App 001`.
- Confidence: usage-check indicator, modal copy, cancel preservation and zero-use branch `VERIFIED`; final deletion side effects for this Draft remain intentionally untriggered until the lifecycle experiment is ready.


## EVD-0142 — Collection Create Validation and Visibility-to-Item Permission Coupling

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account; `/zh-cn/collections` and `/zh-cn/collections/new`.
- Catalog: directory reported 52 collections, with search, `排序：热门`, `作者：全部`, and `创建合集`. A cross-account collection direct page (`第二账号测试合集 001`) showed creator profile, share, favorite count and one World card; as a non-owner it exposed no Edit/Delete controls.
- Empty create state: fields for name, description and comma-separated tags; visibility controls `公开`, `链接可见`, `仅自己`; ordered World list `0/100`; owner Worlds and public World search. `保存合集` is disabled when the name is empty.
- Validation: entering only `TEST Collection Empty Boundary 001` enabled `保存合集` even before adding a World, so a Collection may be saved empty; World membership is not required. Adding one World changed the counter to `1/100` and retained Save enabled.
- Permission coupling: while visibility was `公开`, one owner World's `添加` control was blocked with tooltip `公开合集只能收录公开世界。请先公开这些世界，或把合集改为链接可见/仅自己。`. Switching the unsaved Collection to `链接可见` changed the explanatory copy to `不会出现在发现页，但有链接的人可以打开。` and the remaining Add controls were enabled, showing that Collection visibility governs whether non-public owner Worlds can be included.
- No Collection was saved or published in this pass; the temporary form state was discarded by leaving the page.
- Conclusion: name is the minimal create requirement; empty Collections are allowed; public Collections enforce public-only membership at add time, while link-visible/private Collections can include non-public owner Worlds.
- Confidence: empty-state validation, counter, visibility copy and add-control gating `VERIFIED`; post-save indexing/direct-link enforcement and delete lifecycle remain `UNKNOWN` or delegated to the parallel audit.

## EVD-0143 — Simulation Important Facts Persist, Inject Into Turns, and Are Visible in Historical View

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account; `/zh-cn/sim/05ac8dda-b534-415b-94aa-74ffa3378c00`.
- Path: Simulation `设置` → `重要事实`; entered `EVD-FACT-001: 江夏的粮草基线必须保持 55000。` and clicked `保存`.
- Immediate state: Save button changed to `已保存`; character count showed `32/200`; the free account can enter 200 characters while `会员可写 2000 字` opens a purchase modal. The fact itself did not consume a Turn.
- Reload: direct Simulation reload preserved the exact textarea content.
- Turn injection: next main-input Turn advanced 1→2. Story response explicitly looked up 江夏 and reported `55,000`, describing it as the “设定的关键基线”; this is behavioral evidence that Important Facts are injected into the AI context each Turn.
- Historical state: opening `回溯时间（查看历史）` to Turn 1 disabled actions and showed the standard read-only controls. Opening Settings → Important Facts while viewing history still showed the current saved fact, not an empty or historical copy. Returning to now restored Turn 2 and the fact remained.
- Checkpoint: created `TEST Important Facts Checkpoint 001` from Turn 2, producing `/zh-cn/sim/e37cb018-c79c-40a0-9e91-8c70c4b2cccd`. The checkpoint copied the exact original fact. Editing the checkpoint fact to `EVD-FACT-BRANCH-002: 江夏基线改为 77777。` did not change the source Simulation, which still showed the original `55000` fact on a fresh direct load.
- Branch behavior: a Turn 3 on the checkpoint answered the same baseline query with `77777`; a separate Turn 3 on the source answered `55000`. This confirms the copied Important Fact is used by each branch's AI context, not merely displayed in Settings.
- Rewind boundary: the checkpoint fact was then changed to `88888` and `恢复到此状态` was attempted from historical Turn 2. The user independently observed a transient second confirmation warning about returning to the earlier point and clearing later data, but the automation could not stably capture or answer it: two interaction calls each hung for 30 seconds and reset the browser-control session. Directly reopening the same UUID still showed Turn 3 and fact `88888`, so no restore was committed in the tested state. Per user direction, this confirmation-capture experiment was stopped to avoid wasting time.
- Conclusion: Important Facts are per-Simulation persistent metadata injected into future Turns and exposed unchanged during historical viewing. Save checkpoint creation copies the current fact, after which the source and checkpoint facts are independently editable. The tested fact is not rolled back merely by viewing an earlier timeline state.
- Confidence: save toast/state, reload persistence, Turn injection, historical visibility, checkpoint copy and source/branch independence `VERIFIED`; Rewind confirmation copy and fact rollback semantics `UNKNOWN / suspected defect`.

## EVD-0144 — User-Confirmed Important Facts Branch Rewind and Social In-Place Rewind

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account; two previously unresolved native-confirm paths were completed with the user clicking the browser confirmation while the agent performed only postcondition checks.
- Important Facts checkpoint `/zh-cn/sim/e37cb018-c79c-40a0-9e91-8c70c4b2cccd`:
  - Before restore: current Turn 3, fact `EVD-FACT-REWIND-003: 江夏基线改为 88888。`; historical Turn 2 selected.
  - After user accepted the warning, the same UUID loaded at current Turn 2. A direct reload preserved Turn 2 and no longer exposed the Turn-3 current state.
  - Opening Settings → 重要事实 after restore still showed the exact `88888` fact. Therefore Turn/Story timeline was rewound, but Important Facts remained unchanged as per-Simulation metadata outside the Turn snapshot.
  - Historical Turn 2 Story continued to report the earlier 55,000 baseline because the historical Story is immutable content; the current Important Facts value was not retroactively injected into that historical transcript.
- Social source `/zh-cn/sim/c86047d5-8289-47ea-ad77-173c01db4a90` (`TEST Social Mode Phone 001`):
  - Before restore: current Turn 15; selected historical Turn 6; source had Memory 1+2+3-era state, Week 2 Story/Stats and later social content.
  - After user accepted the confirmation, the same UUID reloaded at current Turn 6. Current Story was the Turn-6 party-outfit discussion; Stats were Popularity 28, Grades 70, Mood 80, Style 50, Money 60, Stress 44; relations matched the Turn-6 snapshot.
  - Memory showed only `✦ 1`; `✦ 2`/`✦ 3` were absent. Event timeline exposed only the six Turn-1-week nodes and no Week-2 nodes. Chat/Instagram returned to the Turn-6 set (including the earlier group thread and baseline posts), with later Week-2 messages absent.
  - The main input was enabled after reload, proving the source remained runnable after in-place rewind. No Turn was consumed by accepting the confirmation or by the verification reload.
- Conclusion: user-mediated native confirmation resolves the automation boundary. Social in-place Rewind is now `VERIFIED` for Turn 15→6: Story, Stats, Relations, Memory summaries, Chat/Instagram surfaces and timeline nodes are truncated/restored together. Important Facts are explicitly outside that rewind boundary.
- Confidence: post-confirmation Turn, direct reload, Story/Stats/Relations, Memory, event-node truncation, Chat/Instagram and runnable-current-state checks `VERIFIED`; exact native warning text and backend snapshot implementation remain `UNKNOWN`.

## EVD-0145 — First App Publish, Market Indexing, Installation and World v9 Publication

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account.
- App: `TEST App First Publish 001`, slug `/zh-cn/apps/test-app-first-publish-001`; Creator `/zh-cn/apps/create?slug=test-app-first-publish-001`.
- First Publish: the durable owner-only Draft already displayed `v1 / 未公开`. Clicking Creator `发布` did not open a confirmation modal; the control entered a short submitting/disabled state and redirected directly to the public App detail. The public App remained v1 rather than creating v2. Owner controls were `编辑`, `删除`, `安装`; the page exposed rating, comments, online preview and the v1 update log.
- Discovery: exact-title App Market search immediately returned the public card. The unified Search App route initially and again after World v9 publication exposed the query/tabs but no result card, so App Market and unified Search do not converge transactionally. Exact convergence time/index eligibility remains `UNKNOWN`.
- Install selector: `安装` opened `安装到世界`, allowed selection of an existing owner World or creation by name, then opened a second configuration step with display name, Initial JSON, AI natural-language seed, read-only preview, App custom instruction, single-Turn reminder, onboarding copy and final Install.
- Limit boundary: installing into `TEST World 001` was blocked by `每个世界安装超过 10 个 App 是会员功能。`; no payment was attempted. Installing into `TEST App Upgrade World 001` succeeded and changed usage from `0 个世界在用` to `1 个世界在用`.
- Draft/public split: the install first appeared only in the target World Draft (`发布 v9`); the public World remained v8 and did not list the App. App usage therefore counts installation in an unpublished owner World Draft.
- World publish: publishing v9 succeeded with changelog `Install the newly first-published TEST App First Publish 001 for public-install, runtime and upgrade lifecycle verification.` and toast `已发布。其他语言版本正在生成，完成前将显示原始语言。`. The public World `/zh-cn/worlds/test-map-world-001-gytp` then listed the App and version `v9 · Install TEST App First Publish 001`.
- Confidence: first-Publish transition, v1 preservation, owner/public controls, App Market availability, two-stage installation, 10-App membership boundary, Draft usage count, public World v9 and version log `VERIFIED`; unified Search convergence SLA and independent-viewer publication timing remain `UNKNOWN / parallel-audit candidate`.

## EVD-0146 — World v9 Old-Save Migration and Fresh App Runtime

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account.
- Old save: `/zh-cn/sim/fd370969-d790-4035-a581-b46b88a9cd15`, `TEST Post-Delete Local Character Runtime 001`, initially World v8 / Turn 2.
- Update prompt: direct open displayed `世界配置已更新至 v9`, title `Install TEST App First Publish 001`, the v9 changelog and policy `应用后会安装新增 App并合并新版初始化配置；你的模拟进度和已修改内容会保留。`, with `应用更新` / `暂不更新`.
- Apply result: clicking `应用更新` removed the prompt without consuming a Turn. Settings changed from v8 to v9; Turn remained 2; prior Story, Day 1 08:00 Time, Chat and Character State remained. A new `🧩` Dock icon and iframe appeared, rendering `TEST FIRST PUBLISH HTML`. The injected runtime seed was `{"clicks":0,"status":"草稿种子"}`.
- Old-save Turn: submitting `检查 TEST App First Publish 001 的运行状态并记录一次点击。` advanced Turn 2→3 and reduced account energy 136→127 (9 energy). Story continued from the retained World state. The App remained mounted.
- Fresh-save slot boundary: `/zh-cn/worlds/test-map-world-001-gytp/new` listed the new App from setup. `立即开始` exposed `这个世界的 5 个存档位（含已购 2 个）已全部用完。` and offered `增加存档位 · 80` or deletion. Spending 80 test energy added a sixth slot and automatically created `TEST App First Publish v9 Fresh 001` at `/zh-cn/sim/f868a0b3-9d12-470c-871d-9a5de4d967d3`.
- Fresh initialization: the new save started at Turn 1 / Day 1 08:00 on World v9 with the App already in Dock and the same Initial JSON `clicks:0/status:草稿种子`. Simulation creation itself reduced energy 47→38 (9 energy).
- Fresh Turn: action `检查新安装的 TEST App First Publish 001 是否正常加载，并调查附近区域。` advanced Turn 1→2, Time 08:00→08:15 and energy 38→29 (9 energy). Story explicitly incorporated the App as an in-world device. Events recorded `🧩 TEST App First Publish 001 · clicks +1`, proving the App instruction/event mapping can mutate its namespaced state during a normal Turn.
- Reload evidence: the fresh UUID reloaded at Turn 2 with Story/time intact and the App Dock still present. Reopening the App and reading its iframe `srcdoc` showed injected state `{"clicks":1,"status":"草稿种子"}`, proving the Event Delta persisted into durable App-state hydration rather than existing only as a timeline log.
- Conclusion: adding a newly published App through World v9 uses the ordinary existing-save opt-in migration contract, preserves prior Simulation state and initializes the new App without a Turn. Fresh v9 saves receive the App immediately. Both Simulation creation and ordinary Turn cost 9 energy in this seven-App World sample; World update application costs zero.
- Confidence: update prompt/copy, zero-Turn migration, v8→v9 setting, preserved state, Dock/iframe/seed, slot expansion, fresh UUID, Turn/time/energy, `clicks +1` Event and post-reload `clicks=1` hydration `VERIFIED`.

## EVD-0147 — App v2 Hot Upgrade, Existing-State Merge and Reload Persistence

- Time: 2026-08-23 (Asia/Shanghai), authenticated owner account; App `/zh-cn/apps/test-app-first-publish-001`, existing fresh v9 Simulation `/zh-cn/sim/f868a0b3-9d12-470c-871d-9a5de4d967d3`.
- Creator edit: opened `/zh-cn/apps/create?slug=test-app-first-publish-001`, changed HTML from `TEST FIRST PUBLISH HTML` to `TEST FIRST PUBLISH HTML V2`, changed AI instruction to increment `clicks` by 2 and set `upgradeSeen` when an action explicitly mentions the App, and changed Initial JSON to `{"clicks":100,"status":"v2-seed","newField":"v2","nested":{"a":1},"arr":[1,2]}`. Added update note `TEST v2 hot-upgrade and state-merge audit`.
- Save behavior: clicking `存草稿` showed `草稿已保存。`. Reloading App detail immediately showed v2 in the public log above v1 and online preview HTML V2. No World version was created and no App Publish confirmation was required for this v2 save.
- Existing Simulation hot update: after direct reload and opening the App, iframe source was HTML V2 while the persisted prior state was still `{"clicks":1,"status":"草稿种子"}` rather than being reset to the v2 Initial JSON. This proves App definition/version hot-updates by slug while existing namespaced state is retained.
- v2 Turn: submitting `请使用 TEST App First Publish 001 执行一次升级后的扫描，并记录 v2 状态。` advanced Turn 2→3 and produced Events `🧩TEST App First Publish 001 · status` and `🧩TEST App First Publish 001 · clicks +2`. Story explicitly described a v2 blood-gas scan. The runtime remained usable; no World update prompt appeared.
- State hydration: before reload the iframe still showed the pre-turn state while the Event drawer showed the Delta. After direct Simulation reload and reopening the App, iframe `srcdoc` injected `{"clicks":3,"status":"v2 扫描就绪 - 发现异常血气波动"}`. Thus v2 AI/Event deltas were merged into the existing App namespace and persisted across reload; the v2 Initial JSON did not overwrite prior fields/state.
- Creator guidance: the Config panel's delete help explicitly says `如果其他用户的世界正在使用,只能下架(市场隐藏,已装世界不受影响)`; the current owner detail with only this account's World in use still exposes `删除`, not a separate Downlist control. Cross-owner usage/downlist final state remains to be verified in the parallel account.
- Conclusion: for an already-installed App, `存草稿` is a public version/runtime upgrade path; App v2 does not require World republish or Simulation version migration. Existing per-install state is retained and subsequent AI/Event updates merge into it. The version's new Initial JSON is a seed/default for new or missing fields, not a destructive reset of existing state in this sample.
- Confidence: v2 public log/preview, existing-Simulation HTML hot update, no World prompt, Event Delta, persistent `clicks:3/status` hydration and owner-only delete-vs-downlist guidance `VERIFIED`; exact nested/array merge precedence and cross-owner downlist enforcement `UNKNOWN`.

## EVD-0148 — Published Map Region Drawer, Region Turn and Two-Layer Faction Roleization Draft

- Time: 2026-08-23 (Asia/Shanghai), authenticated World owner account; published World v9 Simulation `/zh-cn/sim/f868a0b3-9d12-470c-871d-9a5de4d967d3` and Creator `/zh-cn/worlds/test-map-world-001-gytp/edit#app-map`.
- Published v9 Map runtime: opening the Map produced a full-canvas Japan map with colored ownership regions. Clicking the blue region at the map center opened `滋贺`, faction `鬼杀队`, attribute `鬼患威胁度 40`, adjacent-region buttons, a free-text action box, `🏮 巡逻`, `⚔️ 狩猎恶鬼`, `询问顾问` and `复制名称`. Clicking a red region opened `冈山`, faction `鬼`, threat `65` and its own adjacency set. A region-to-region adjacency button changes the active drawer without consuming a Turn.
- Region Turn: in `冈山`, submitted `调查掌控冈山的势力领袖身份，并与其对话；不要预设姓名。`. Turn advanced 3→4, Time jumped from Day 1 08:20 to 14:45, and Story described travel from 栃木 to 冈山 plus an audience with the local ruler. The response used Map region/faction context and ordinary Story/Time generation, but did not name `测试角色 001`; this run therefore does not prove that the earlier faction→Character relation was active in published v9.
- Creator state before the new edit exposed two distinct, simultaneously unchecked controls with the same visible title:
  1. World Character section: `把地图上的阵营作为角色` with copy that factions become shared, read-only World characters editable in the Map App;
  2. Map App `阵营设置`: `把地图上的阵营作为角色` with copy that every faction becomes a conversational character named after the faction.
- The switches do not mirror one another: enabling the Map-App switch left the World-level switch false. Enabling the World-level switch afterwards made both true. The Creator then displayed `Demons` and `Demon Slayer Corps` as read-only faction characters alongside the independent World-local `测试角色 001`.
- Live Preview evidence before re-binding: with both switches enabled, the desktop Simulation Preview immediately listed three separate Chat entries: `Demon Slayer Corps`, `Demons`, and `测试角色 001`. After `保存并退出` and `保存 App 配置`, reopening the Creator showed `已恢复上次草稿` and both roleization switches still checked, so this two-layer configuration is durable in the v10 Draft.
- Binding interaction: after the roleization toggles were enabled, opening Map Editor showed both native `关联角色` selects at `— 无 —`; the earlier EVD-0137 `Demons → 测试角色 001` association was no longer selected in this state. Because the editor was not inspected immediately before toggling, it is `UNKNOWN` whether enabling roleization cleared the relation or whether another intervening Draft transition did so. Re-selecting `Demons → 测试角色 001`, then submitting both `保存并退出` and `保存 App 配置`, changed Preview Chat from three entries to exactly two: `👹 测试角色 001` and `⚔️ Demon Slayer Corps`. The separate ordinary `测试角色 001` and faction-named `Demons` entries were deduplicated into one linked identity using the faction emoji plus Character name.
- Marker state: the Map App still showed `地图棋子（marker）` checked and `添加棋子`, but no marker form/list was materialized in this run; marker creation remains `UNKNOWN`.
- Conclusion: Map runtime exposes a structured region drawer and region actions can drive Story and Time. Faction roleization is controlled at two non-synchronized layers. With no faction binding, both factions and the ordinary World-local Character coexist; when a faction is linked to that Character, Preview aliases/deduplicates them into one faction-skinned Character identity.
- Confidence: region drawer/control schema, region Turn/Time result, independent checkbox state, one-way manual activation sequence, before/after Preview Chat inventory, duplicate-binding alias/dedup and reload-persistent v10 Draft roleization `VERIFIED`; binding-clear cause, published v10 propagation and marker lifecycle `UNKNOWN / next experiment`.

## EVD-0149 — World v10 Publishes Faction–Character Alias and Migrates an Existing Save at Zero Turn

- Time: 2026-08-24 (Asia/Shanghai), authenticated World owner account; World `/zh-cn/worlds/test-map-world-001-gytp`, existing save `/zh-cn/sim/f868a0b3-9d12-470c-871d-9a5de4d967d3`.
- Publish path: Creator exposed durable `发布 v10` Draft with both faction-roleization controls checked and Preview Chat already reduced to `👹 测试角色 001` plus `⚔️ Demon Slayer Corps`. Opening Publish showed version-title and Markdown changelog fields but no destructive/native confirmation. Submitted title `Map Faction Roleization and Duplicate Binding Audit` and changelog `Enable both map faction-as-character layers and verify Demons linked to TEST Character 001 in Preview and Simulation migration.`.
- Public result: submission redirected to the public World. Version history showed `v10 · Map Faction Roleization and Duplicate Binding Audit` as latest. Public Character inventory contained one `👹 测试角色 001` card rather than separate `Demons` and ordinary-Character cards; the unchanged v9 save remained listed at Turn 4.
- Existing-save prompt: opening the v9 save displayed `世界配置已更新至 v10`, the exact version title/changelog and policy `应用后会安装新增 App并合并新版初始化配置；你的模拟进度和已修改内容会保留。`, with `应用更新` / `暂不更新`.
- Apply result: `应用更新` removed the prompt without consuming a Turn. The save stayed Turn 4 and Day 1 14:45; the complete pre-update Story remained unchanged. Chat now contained exactly `👹 测试角色 001` and `⚔️ Demon Slayer Corps`, matching Creator Preview; there was no separate `Demons` or duplicate ordinary `测试角色 001` entry. The existing Main Input and Map surfaces remained usable.
- Conclusion: the faction→Character link is a real versioned World/Map relationship, not a Preview-only label. Publishing and zero-Turn migration apply a stable alias/dedup rule: the linked faction identity takes the Character's name/content while keeping the faction's presentation marker, and the ordinary duplicate is removed from runtime Chat.
- Confidence: v10 publication/version log, public Character card, explicit v9→v10 prompt, zero-Turn preservation of Turn/Time/Story and runtime Chat alias/dedup `VERIFIED`; fresh-v10 save parity, Character State duplicate behavior, exact internal ID ownership and marker lifecycle remain `UNKNOWN`.

## EVD-0150 — App v2 Installs Into a Second World Draft With Exact v2 Seed but Usage Count Does Not Advance

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; App `/zh-cn/apps/test-app-first-publish-001`, target World `/zh-cn/worlds/test-map-world-001-rxwf/edit` (`TEST Map World 001`).
- Install flow: App detail showed public v2 and `1 个世界在用`. `安装` opened the existing-World selector; selected exact target `TEST Map World 001`. The second-stage installer supplied the v2 Initial JSON `{"arr":[1,2],"clicks":100,"nested":{"a":1},"status":"v2-seed","newField":"v2"}` plus display-name and natural-language seed controls. The user confirmed this exact installation and the final `安装` submission closed the installer.
- Durable target result: directly opening the target Creator showed `已恢复上次草稿` and `发布 v5`. Its installed-App list contained `TEST App First Publish 001` with description `Temporary first publication lifecycle audit App`. Opening that App's World configuration showed the exact v2 seed, including `clicks:100`, `status:v2-seed`, `newField:v2`, nested object and array; therefore the installation was not inferred only from the new Draft version.
- Published/Draft split: the public target remains v4 until a separate World publication; this experiment intentionally stops at the confirmed install/Draft boundary. No public World update or existing-Simulation migration is claimed yet.
- Usage anomaly: a fresh App detail load, followed by a 5-second wait and reload, still showed `1 个世界在用` rather than 2. This differs from EVD-0145, where the first unpublished target Draft immediately changed usage 0→1. The target Draft evidence is authoritative for installation success, but the public usage counter's exact eligibility/cache semantics are `UNKNOWN`.
- Conclusion: installing current App v2 into a new World installation correctly seeds all v2 fields and creates a durable unpublished World version. This closes the fresh-install seed question at the World-Draft layer while exposing a non-transactional or selectively eligible usage counter.
- Confidence: target selection, second-stage seed, final submission, durable v5 Draft, installed-App presence and exact Initial JSON `VERIFIED`; usage-counter eligibility/convergence, public v5 runtime initialization, old-save migration and fresh-Simulation hydration remain `UNKNOWN / next experiment`.

## EVD-0151 — World v11 Marker Seed, Fresh/Existing-Save Propagation, Runtime Detail and Slot-Deletion Boundary

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account.
- World / Creator: `/zh-cn/worlds/test-map-world-001-gytp`, v11 `Map Marker Lifecycle Audit`.
- Draft marker setup: in Map App `地图棋子（marker）`, created `TEST Marker 001` with emoji `🚩`, type `军队` (`army`), faction `Demons`, badge `12k`, region `Okayama`; after reload the Draft retained all fields. Edited badge `12k → 18k` and region `Okayama → Shiga`; an initial autosave race failed to persist, but an explicit `保存 App 配置` submission did. Creator Preview visibly rendered the red marker at Shiga with `18k` and name label. Preview remained `仅预览，不可互动`.
- Publish: submitted v11 with title `Map Marker Lifecycle Audit` and changelog describing marker seed/placement. Public World redirected successfully; version history showed v11 as latest. Public detail still exposed one linked `👹 测试角色 001` Character card and the v10/v11 logs.
- Existing save migration: old v9 saves displayed the v11 update modal with exact title/changelog and merge policy. Applying v11 cost zero Turn and preserved the save's current Turn/Story/Time/Chat/App state. The imported marker was visible on the runtime map with `18k`; its detail drawer exposed marker type `军队`, faction/presentation and a region button, with no direct edit/move control. A second old save also accepted v11; the prompt disappeared after asynchronous completion and the marker was visible in the map canvas.
- Fresh save: after deleting the completed disposable save `TEST v5 Reinstall Seed Simulation 001` (Mine → History → 更多 → 删除 → modal `确认永久删除该存档？` → confirm), the World slot became available. `/new` then created `TEST Marker v11 Fresh 001` at `/zh-cn/sim/b64fd305-dd79-4a49-9aff-eab62b212051`, starting at Turn 1 / Day 1 08:00. The seeded marker appeared in the map and clicking it opened a runtime detail card for `测试标记 001`, type `军队`, faction `鬼`, badge `18k`, region `滋贺`, with `询问顾问` and `复制名称`. The same fresh opening also generated a separate AI event marker `鬼的集结` with `15k` at 滋贺; configured and AI markers coexist.
- Runtime interaction boundary: marker detail is inspectable/clickable, but no move, delete or direct field-edit affordance is exposed. A free-text Turn attempt to move/change the marker did not advance after repeated waits; no explicit product error was shown. Therefore GM/AI marker Delta movement, deletion and user-action success are `UNKNOWN` rather than inferred unsupported.
- Save deletion boundary: Mine deletion used an in-page confirmation modal, removed the save from the active list after confirmation, and direct navigation to its UUID returned `404: This page could not be found.` with no undo. The deletion freed a World slot and enabled fresh v11 initialization.
- Conclusion: marker definition fields and Draft persistence, v11 publication and zero-Turn existing-save import, fresh-save seed/runtime detail and coexistence with AI-generated markers are `VERIFIED`; direct runtime movement/deletion and Turn/Event Delta/Rewind remain `UNKNOWN`.
- Confidence: `VERIFIED` for create/edit/reload/preview/publish/apply/fresh-init/detail/delete-slot; `UNKNOWN` for marker command mutation and Rewind semantics.

## EVD-0152 — Rewards / BYOK / Account Boundary Recheck at Low Energy

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account.
- Rewards URL: `/zh-cn/rewards#share`. The page exposes a stable invite code `36AWN73V`, copy-code/copy-link buttons, invite counters (`0` invited, `0` valid, `0 / 600⚡` weekly), social-post review textbox, thresholds (+50/+200/+500/+1000⚡), weekly social cap `10,000⚡`, and a disabled post-registration invite-code redemption field because this account is past the 24-hour binding window. No external post URL was submitted.
- Account URL: `/zh-cn/account`. Profile section exposes username, bio, gender options, 40+ interest buttons and `保存资料`; Preferences exposes only `English / Español / 中文`; World Model exposes OpenRouter key and arbitrary OpenAI-compatible gateway fields with `测试并保存`/`测试并添加` disabled until credentials are supplied, plus named model options. The test account remains at 2 energy after v11 experiments; no purchase or credential submission was attempted.
- Presets: `我的预设 (3)` exposes three categories (人设/文风/世界观), current `TEST Preset Persona 002`, add/edit/delete controls and “only you can see” copy. Account deletion is guarded by an exact `DELETE` text field and disabled button until typed; no deletion was attempted.
- Conclusion: rewards are a non-payment energy replenishment surface with invite/social verification gates; BYOK and account deletion are deliberately confirmation/credential gated; low-energy behavior is observable without treating it as an AI/model failure.
- Confidence: rewards fields, caps, disabled redemption, BYOK controls, preset inventory and DELETE gate `VERIFIED`; actual reward settlement, credential success/failure and account deletion remain `UNKNOWN / not executed`.

## EVD-0153 — Marker Turn Delta and User-Mediated In-Place Rewind

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; fresh v11 Simulation `/zh-cn/sim/b64fd305-dd79-4a49-9aff-eab62b212051`, `TEST Marker v11 Fresh 001`.
- Turn action: the main input requested only `测试标记 001` movement Shiga→Kyoto and badge 18k→21k, with no other piece creation/deletion. The first click on `发送` did not submit; pressing Enter in the textbox submitted the action and advanced Turn 1→2 while World time stayed Day 1 08:00.
- Event surface: Events recorded the exact user prompt and generated Story, but did not expose a structured marker delta row. This is an observability gap, not evidence that no delta occurred.
- Runtime map: clicking the configured marker in Turn 2 opened its card with `21k` and region `京都`; historical Turn 1 view showed the same marker as `18k` and `滋贺`. Thus a natural-language Turn can mutate configured marker fields and location, even though the event drawer does not list a typed marker delta.
- Historical view: `回溯时间（查看历史）` switched the same Simulation to read-only Turn 1, disabled main input/voice/send, and exposed `从这一轮创建存档点`, `恢复到此状态`, `回到现在`. Marker card and Story reflected the historical snapshot.
- Slot boundary: creating a checkpoint from historical Turn 1 opened naming UI, then a full-slot warning: `这个世界的 6 个存档位（含已购 3 个）已全部用完。花 80 增加一个存档位？删除旧存档也可以腾出位置。` with `增加存档位 · 80` and `取消`; no paid expansion was triggered in this experiment.
- Rewind: after the user accepted the browser/native confirmation warning, the same UUID returned to current Turn 1. The Turn-2 action and response disappeared from Events, Story returned to the opening state, the main input became enabled, and the marker reverted to `18k / 滋贺`. This confirms in-place Rewind truncates the current timeline and restores map marker state; it is not merely a read-only jump.
- Confirmation boundary: the warning was not reliably exposed to page DOM or `getJsDialog()` in the browser automation surface; user-mediated confirmation was required. Exact native warning copy remains `UNKNOWN`.
- Conclusion: configured marker movement/badge mutation through a Turn and marker-inclusive in-place Rewind are `VERIFIED`; typed Event Delta rendering, direct runtime edit/delete affordances and exact confirmation-copy remain `UNKNOWN`.
- Confidence: Turn 2 map state, historical Turn 1 state, post-confirmation Turn 1 rollback, event/story truncation and input re-enable `VERIFIED`; backend snapshot internals and native warning text `UNKNOWN`.

## EVD-0154 — World v5 App Install Cleanup, Old-Save Merge and Fresh Runtime

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; World `/zh-cn/worlds/test-map-world-001-rxwf` (`TEST Map World 001`) and App `TEST App First Publish 001` v2.
- Publish failure/recovery: the first v5 publish attempt returned an in-page `Unknown or unavailable app` notification because the Draft still contained deleted/private `test-app-001`. The invalid row explicitly said its configuration was retained and could be unloaded. After unloading that row and waiting for `草稿已自动保存`, the same v5 publish form succeeded.
- Public result: direct World detail showed `v5 · Install TEST App First Publish v2 clean` as latest, with the v2 App listed in the public App inventory; the public page still exposed the prior v4 log and owner controls.
- Old save: existing `/zh-cn/sim/97dc81bc-b3de-4123-9c2a-2952d9e9282c` opened at World v4 / Turn 1 with a v4→v5 modal. Copy: `应用后会安装新增 App 并合并新版初始化配置；你的模拟进度和已修改内容会保留。` Selecting `应用更新` removed the prompt without consuming a Turn. The save remained Turn 1 with the original opening Story. Settings then reported World v5 and the App Dock contained `TEST App First Publish 001`.
- Old-save runtime hydration: opening the App loaded `TEST FIRST PUBLISH HTML V2`; the injected `WS.state` was the complete v2 Initial JSON `{"arr":[1,2],"clicks":100,"nested":{"a":1},"status":"v2-seed","newField":"v2"}`. This is a fresh namespace in the old save, not a destructive replacement of unrelated Story/Turn state.
- Fresh save: `/zh-cn/worlds/test-map-world-001-rxwf/new` listed the v2 App among the available Apps. Creating `TEST App v5 Fresh Runtime 001` produced `/zh-cn/sim/a4998853-6e3d-4d38-b7ff-3db692a3b435` at Turn 1 / opening Story. The App Dock was present immediately, and its iframe injected the same full v2 seed including nested object and array.
- Usage convergence: after v5 publication and fresh runtime creation, a direct App-detail reload changed the counter from the earlier `1 个世界在用` to `2 个世界在用` and listed both owner Worlds under `用了这个 App 的热门世界`. The prior Draft-only lag was asynchronous/index-gated, not a permanent eligibility exclusion.
- Conclusion: a deleted App dependency can leave a retained invalid installation in a World Draft and block publication until explicitly unloaded. After cleanup, World v5 publication, zero-Turn old-save migration and fresh-v5 App hydration all succeed. World v5 migration keeps Story/Turn and seeds the new App namespace.
- Confidence: failure notification, invalid-row cleanup, v5 publication/version history, zero-Turn old-save update, v5 setting, old/fresh App Dock, exact v2 seed hydration and usage 1→2 convergence `VERIFIED`; deeper merge precedence for a previously-used namespace in this second World remains `UNKNOWN`.

## EVD-0155 — World-Version Initial JSON Uses Runtime-Dirty Field Preservation

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; World `/zh-cn/worlds/test-map-world-001-rxwf` v5→v6 and existing Simulation `/zh-cn/sim/97dc81bc-b3de-4123-9c2a-2952d9e9282c`.
- Pre-update runtime state: after v5 installation, the App began with `arr:[1,2]`, `clicks:100`, `nested:{a:1}`, `status:"v2-seed"`, `newField:"v2"`. A normal Turn explicitly using the App advanced Turn 1→2 and persisted state as `arr:[1,2]`, `clicks:102`, `nested:{a:1}`, `status:{status:"v2-merged"}`, `newField:"v2"`, plus runtime-added `upgradeSeen:{upgradeSeen:true}`.
- v6 World configuration: changed only the World-local App Initial JSON to `{"arr":[9,8],"clicks":999,"nested":{"a":999,"b":2},"status":"v6-world-seed","newField":"v6","missingOnly":{"x":1}}`; saved App config and published World v6 `App Initial JSON Deep Merge Audit`.
- Existing-save prompt: reload showed the standard v5→v6 update modal and promised that progress/modified content would be retained. Applying the update consumed zero Turn: the Simulation stayed Turn 2 and Settings reported v6.
- Merge result, immediately and after reload: `arr:[9,8]`, `clicks:102`, `nested:{a:999,b:2}`, `status:{status:"v2-merged"}`, `newField:"v6"`, `missingOnly:{x:1}`, `upgradeSeen:{upgradeSeen:true}`.
- Interpretation from the black-box result: fields previously changed by runtime Events (`clicks`, `status`) were preserved even when the new Initial JSON supplied conflicting values. Fields still equal to their former seed (`arr`, `nested`, `newField`) adopted the new World-version value; the nested object was replaced at the top-level field boundary rather than recursively preserving old `nested.a`. Brand-new seed fields were added, and runtime-only fields were retained.
- Product rule: World update merge behaves like per-top-level-field dirty tracking / three-way merge against the prior seed, not a blind overwrite and not a simple old-state-wins merge. Internal implementation remains `UNKNOWN`, but the observable precedence rule is stable in this sample.
- Confidence: pre-state, v6 seed, version publication, zero-Turn update, exact merged state and reload persistence `VERIFIED`; arrays-of-objects, deleted keys, explicit null and deeper path-level dirty tracking remain `UNKNOWN`.

## EVD-0156 — Genre Template Draft/Publish/`/new`/Fresh-Simulation Closure

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; disposable World `TEST Template World 001`, public URL `/zh-cn/worlds/test-template-world-001-fv99`.
- Creator setup: from `创作 → 创建世界 → 空白世界 → 自己手动创建`, uploaded an existing research screenshot as a non-sensitive cover, entered the name/description, and selected `现代恋爱` followed by `修仙` in one clean Creator draft. Modern Romance materialized five complete fields (`身份/identity`, `性格/temper`, `家境/family`, `情感经历/history`, `魅点/charm`); Cultivation appended six (`身世/shenshi`, `师门关系/shimen`, `修道/daotu`, `灵根资质/linggen`, `主修功法/zhuxiu`, `性情/xingqing`). Existing fields remained, establishing additive rather than replacement/deduplication semantics. The default App set stayed Main Input, Story, Chat, Time, Cutscene and Achievements; no template-specific App or visible system-prompt fragment appeared in Creator DOM.
- Draft persistence: clicking enabled `创建世界` redirected to `/zh-cn/worlds/test-template-world-001-fv99/edit` with `发布 v2`; after autosave, reload retained all 11 labels, variables and option controls. Template-generated fields are therefore durable World Draft data, not only modal-local state.
- Preview/publish: Preview remained explicitly `仅预览，不可互动`. Publishing v2 opened the standard version modal requiring optional title and mandatory Markdown changelog, then redirected to the public World with `发布成功。`; Version history showed `v2 · Template persistence` and v1. Public detail exposed `立即开始` at `/zh-cn/worlds/test-template-world-001-fv99/new` and the normal Apps list, with no extra template App.
- Fresh setup: `/new` rendered all 11 persisted fields with quick-option buttons and text inputs, plus normal save-name, `随机`, `用人设预设`, `套用我的预设`, and the two interface-mode buttons (`自由沙盒` selected, `文游小手机`).
- Fresh runtime: filling setup values including `Alice`, `天灵根`, `剑修`, `山村孤儿`, `亲传独苗` and starting created `/zh-cn/sim/1440b4a4-2c7d-4bca-ac37-d0e98c91ac2c`, `TEST Template Simulation 001`, Turn 1. Opening Story incorporated submitted values, including `Alice`, `天灵根剑修`, `山村...孤儿` and `亲传弟子`; Events recorded the opening as `(开场)`. Memory was empty at Turn 1 with the normal `每隔几轮会自动生成总结` cadence. No extra App, Turn-cost anomaly or template-specific system instruction was observed.
- Conclusion: genre templates are schema generators for player-initialization fields. Definitions persist through Draft autosave, reload and publication, appear as `/new` inputs/options, and feed submitted values into fresh Simulation prompt/story context. In this sample templates did not change the default App set or visibly inject a system prompt. Additive multi-template semantics and field-level setup/runtime propagation are `VERIFIED`; exact variable-to-prompt serialization, default/required behavior, later replacement/removal and all 11-field mappings beyond the submitted sample remain `UNKNOWN`.
- Confidence: clean Creator materialization, additive append, Draft/reload persistence, v2 publication/version history, public `/new`, fresh Simulation creation and story-level propagation `VERIFIED`; internal prompt serialization and edge semantics `UNKNOWN`.

## EVD-0157 — Template Required/Default Setup Boundary

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; same disposable World `/zh-cn/worlds/test-template-world-001-fv99`.
- Creator edit: changed the `身份/identity` field's default answer from empty to `匿名冒险者` and checked its `必填` switch. Autosave completed and Creator showed the checked state and default value. Published v3 with title `Template required default` and a Markdown changelog.
- Public setup: `/new` rendered the label as `*身份` (required marker) and prefilled its textbox with `匿名冒险者`; optional template fields remained unlabeled and empty. This demonstrates that a field's required state affects setup presentation and its default answer is hydrated before user interaction.
- Empty attempt: cleared the required textbox and attempted `立即开始` with a disposable save name. The page did not navigate to a Simulation; after the submit attempt the identity textbox was again `匿名冒险者` and the setup screen remained open. No explicit error toast appeared. The observable boundary is therefore default restoration/normalization rather than a visible validation error or an empty-value Simulation.
- Conclusion: required template fields are marked with `*`, default answers are injected on `/new`, and clearing a required field does not produce a blank runtime value in this sample; the UI restores the configured default and keeps the user on setup. Exact trigger timing (blur, submit or state normalization) and behavior when the default itself is empty remain `UNKNOWN`.
- Confidence: required marker, default hydration and empty-attempt no-navigation/default restoration `VERIFIED`; internal validation timing and empty-default behavior `UNKNOWN`.

## EVD-0158 — Account-A Notifications Close Cross-Account Comment/Favorite/Follow/Remix Loop

- Time: 2026-08-24 (Asia/Shanghai), authenticated main owner account; notification dialog opened while viewing `/zh-cn/profile/5c1fb660-9e53-45a0-8caf-791f73cd8afc`.
- The dialog contained durable second-account events rather than an empty state: `mehraxbobaid78` comment on `TEST App Upgrade World 001`, two favorite notifications for that World, Follow notifications from `mehraxbobaid78` and `nixonelton9954`, and Remix notifications linking child Worlds created by each account.
- Comment/favorite links targeted `/zh-cn/worlds/test-map-world-001-gytp`; Follow links targeted the actor Profile; Remix links targeted the created child World such as `/zh-cn/worlds/test-map-world-001-ukb1`.
- The records remained visible about 19–20 hours after creation. Opening the notification center had cleared the numeric unread badge in prior evidence but did not remove records.
- Conclusion: Cross-account Comment, Favorite, Follow and Remix each create persistent owner notifications with actor/object context and deep links. This closes the auxiliary Account-A notification action item for the tested event categories.
- Confidence: visible body, actor, relative time and deep-link targets `VERIFIED`; retention duration, deduplication (duplicate Favorite/Follow entries), read-state granularity and Collection notifications remain `UNKNOWN`.

## EVD-0159 — Collection Private Save, Visibility Persistence and Public Index Lag

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; `/zh-cn/collections/new` and `/zh-cn/collections/test-collection-lifecycle-002-2szc`.
- Created `TEST Collection Lifecycle 002` with description, three tags and one World. The create form exposed `公开` / `链接可见` / `仅自己`, `1/100` membership and `拖动调整展示顺序`.
- Saved first as `仅自己`. The button changed to `正在保存…`, then redirected to the stable detail slug. The rendered zh-cn detail localized the title/description while preserving the slug, showed one World and owner-only Edit/Delete controls.
- Reopening `/edit` restored the original English fields, comma-normalized tags, one member and the `仅自己` selection, proving save/reload persistence rather than local-only state.
- Saved the same Collection as `公开`; the explanatory copy changed to `所有人都能发现和打开。`, save returned to detail and the direct URL remained available immediately.
- Discovery check: `/zh-cn/collections` did not contain the new title immediately. Exact English-title search produced URL `?q=TEST+Collection+Lifecycle+002`, `0 个合集` and `没有找到合集`; reload plus a short controlled wait still returned no result. This resembles the already observed asynchronous Search/App-usage/Remix index convergence but does not establish an SLA.
- Conclusion: Collection visibility changes persist only through explicit Save and direct detail is transactionally available; public browse/search indexing is decoupled and may lag. Independent Guest/non-owner access for private/link-visible/public variants remains unverified.
- Confidence: create/save/slug, owner controls, edit hydration, visibility-state persistence, public direct detail and short-window index omission `VERIFIED`; eventual convergence, delete lifecycle, reorder commit and independent enforcement `UNKNOWN`.

## EVD-0160 — World and Character Non-Public Visibility Are Membership-Gated at Action Time

- Time: 2026-08-24 (Asia/Shanghai), authenticated free owner account; World Creator `/zh-cn/worlds/test-map-world-001-gytp/edit` and Character Library `/zh-cn/characters` → `新建角色`.
- World Creator exposed `公开`, `不公开列出 会员` and `私有 会员`. Clicking `私有` opened a membership dialog instead of changing the persisted draft. Dialog text explicitly said `把世界设为非公开是会员功能` and advertised that membership enables private Worlds and unlimited Apps.
- The selected state before the click was `公开`; after canceling the membership dialog it remained `公开`, so no unsaved permission mutation occurred.
- Character Creator exposed `公开` and `私有 会员`. Clicking `私有` opened a membership dialog with text `把角色设为私有是会员功能`; canceling left the create modal open and no Character was created.
- Conclusion: for the current free test account, World `Unlisted`/`Private` and Character `Private` are blocked before save/create by an explicit membership gate. This explains why independent-account private enforcement cannot be fully exercised without a member sample; it does not prove the behavior of an already-existing private object.
- Confidence: UI gate, copy, and no-mutation-after-cancel `VERIFIED`; paid/member creation, existing private object access, unlisted direct URL and cross-account propagation `UNKNOWN`.

## EVD-0161 — World Remix-Permission Toggle Has Explicit Local-State Copy

- Time: 2026-08-24 (Asia/Shanghai), same World Creator draft `/zh-cn/worlds/test-map-world-001-gytp/edit`.
- The `改编权限` control exposed `允许` and `不允许`. Clicking `不允许` selected the control and changed the helper text to `其他人不能改编这个世界，你自己仍然可以。`; clicking `允许` restored the selected state and copy `任何人都可以改编这个世界，生成自己的副本。`.
- No Publish was submitted, so this evidence covers the UI state and helper-copy boundary only. Whether the draft autosave persisted the transient toggle, how it appears on public detail, and whether non-owner Remix is actually blocked remain `UNKNOWN`.
- Confidence: control discovery, selected state and copy `VERIFIED`; persistence/enforcement `UNKNOWN`.

## EVD-0162 — Published App Owner Surfaces Expose Edit/Delete/Install but No Downlist Control

- Time: 2026-08-24 (Asia/Shanghai), published owner App `/zh-cn/apps/test-app-first-publish-001` v2 and editor `/zh-cn/apps/create?slug=test-app-first-publish-001`.
- App detail exposed `编辑`, `删除`, `安装`, favorite, rating, online Preview/Reset, comments, version log and two Worlds-in-use. The editor exposed `HTML`, `配置`, `存草稿` and `发布`.
- Neither visible owner surface exposed `下架`, `取消发布`, `设为未公开` or an App visibility selector. This differs from the pre-publication owner-only `未公开` v1 state already observed after first Draft.
- Conclusion: in the tested public App UI, permanent Delete is the only visible removal/lifecycle action; a reversible downlist/unpublish transition is not discoverable from detail or editor. This is not proof that no hidden/internal capability exists.
- Confidence: tested owner control inventory `VERIFIED`; hidden routes, entitlement-dependent controls and backend unpublish support `UNKNOWN`.

## EVD-0163 — App Detail Gift Modal and Credit Commit Boundary

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner viewing official non-owner App `/zh-cn/apps/main-input`.
- App detail exposed `送礼`. Opening it revealed a `赠送礼物` modal with nine denominations: 火花 20, 星星 100, 水晶 400, 烟花 1,000, 月亮 3,000, 极光 6,000, 星空 12,000, 太阳 20,000, 银河 100,000. Copy states `礼物电量的 70% 直接进入创作者的电量余额。`
- No denomination was selected initially and `送出` was disabled. Selecting `火花 20` changed the CTA to `送出 · 20⚡`; no balance or creator count changed before final submission. The modal was canceled without sending.
- Conclusion: App gifts use a two-stage selection/commit flow; denomination selection is local and the credit-moving effect is isolated to the final `送出` CTA.
- Confidence: modal options, 70% copy, disabled/enabled boundary and no-send cancellation `VERIFIED`; final transaction, insufficient balance, recipient notification, transaction record and creator payout timing `UNKNOWN`.

## EVD-0164 — Main-Agent Session Isolation During Preflight (Not a Project Block)

- Time: 2026-08-24 (Asia/Shanghai), browser-session preflight before second-account permission experiments.
- IAB opened WorldOS with the signed-in identity `x161880 / x161880@gmail.com`; Chrome likewise opened WorldOS with the same owner identity. Existing browser-tab enumeration contained no WorldOS Account-B tab, and no independent Account-B session was available to claim.
- No login, logout, password entry, account switching, payment, or permission bypass was attempted. Owner pages were not treated as non-owner evidence.
- Conclusion: at that preflight moment, the main Agent's own browser context exposed only Account-A sessions. This is evidence of `SESSION_ISOLATION_FOR_MAIN_AGENT`, not evidence that Account B was unavailable to the project. The permission items listed there remained `UNKNOWN` only because the required samples were absent at that time; Phase-3 later supplies independent Account-B/Guest evidence for the public Collection, intermediate-parent deletion and Guest-control subsets (EVD-0170–0173).
- Confidence: session identity and absence of an available independent tab `VERIFIED`; all cross-account behavior above remains `UNKNOWN`.

## EVD-0165 — Character Detail Leaderboard and Supporter Tabs

- Time: 2026-08-24 (Asia/Shanghai), public Character `Lisa` opened from `/zh-cn/characters` (current browser owner session; this is a public-control audit, not Account-B evidence).
- Character Detail exposes tabs `评论`, `排行榜`, `支持者`. Clicking `排行榜` replaced the comment panel with `排行榜`, sub-tabs `开局数` and `总轮次`, and ten ranked rows linking to creator Profiles (rank, player name, value). Clicking `支持者` replaced it with `打赏榜`, empty-state copy `还没有人送出礼物。`, and CTA `成为第一位支持者`.
- Clicking `成为第一位支持者` opened a `赠送礼物` modal for Lisa with nine denominations (20–100,000⚡), creator-share copy `礼物电量的 70% 直接进入创作者的电量余额。`, and disabled `送出` until a denomination is selected. The modal was not submitted.
- Conclusion: Character leaderboard/supporter controls are functional public detail tabs; supporter CTA enters the same two-stage gift selection/commit flow as App gifting. Leaderboard row links and empty-state copy are verified; final gift transaction, payout and notification remain `UNKNOWN`.
- Confidence: control discovery/tab content/CTA/modal boundary `VERIFIED`; anonymous-vs-logged-in enforcement and final gift side effects `UNKNOWN`.

## EVD-0166 — Map Dual Preview Entry Points

- Time: 2026-08-24 (Asia/Shanghai), `/zh-cn/maps`, first card `鬼灭之刃模拟器`.
- The map card exposes a primary `查看大图` button (accessible name also rendered as `点击查看大图`). Clicking it opens an in-page modal titled `鬼灭之刃模拟器` with `关闭`, `Zoom in`, `Zoom out` and `拖拽平移 · 右下角 +/- 缩放`.
- The same card separately exposes `新标签页查看世界` as an anchor with `href=/zh-cn/worlds/demon-slayer-simulator` and `target=_blank`; it is a World-detail preview/navigation surface rather than the map-image modal. Sixteen cards exposed this second link in the inspected list.
- Conclusion: the two visible preview entries are not duplicate controls: one is an in-page interactive map viewer, the other opens the associated World detail in a new tab. The anonymous report's "eye icon" wording maps to this second card-level preview/link surface in the current DOM; no independent third entry was present.
- Confidence: button/modal/link targets and modality `VERIFIED`; equivalence of all map zoom/rendering content to the World detail experience and anonymous enforcement `UNKNOWN`.

## EVD-0167 — Character Lifecycle 003 Edit Propagation, Chat Turn Persistence and Remix Boundary

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; Character `测试角色生命周期 003` from `/zh-cn/characters` and Chat Simulation `/zh-cn/sim/b08c2af0-8ad3-473b-b2f1-6ca6d54a8e40`.
- Edit propagation: after changing the public introduction to `Edited lifecycle summary v2.` and submitting `保存角色` (toast `角色已保存`), the Character Library card and reopened detail Drawer both rendered `编辑后的生命周期摘要 v2。` after reload. The public detail remained on the same in-page Drawer route and retained owner controls.
- Character Chat: the library `聊天` entry opened a stable Character Simulation URL. The opening transcript contained the Character's onboarding messages and quick suggestions. Selecting `你好，准备好了。` only populated the main textbox; the separate `发送` control submitted the actual action. After submission, the transcript added the user's action and three world-response paragraphs. The Events panel exposed `回合 1` and `回合 2`; selecting `回合 2` showed `你的行动 / 世界回应` with the exact text. No separate server navigation occurred.
- Runtime state: the Simulation Settings panel showed an account/Simulation energy control `电量 107` after the Turn. The Memory panel showed `暂无记忆。每隔几轮会自动生成总结。`, demonstrating the normal cadence and that one post-opening Turn does not force a summary. Reloading the same Simulation restored the complete opening transcript plus the submitted action and response, proving Chat/Turn persistence. Exact pre-Turn balance and per-Turn delta were not captured in this sample.
- Detail controls: Character public detail exposed `评论`, `排行榜`, `支持者`, `聊天`, owner `编辑`, owner delete, `改编`, and `添加到世界`; the public summary showed `4–8 电量 / 回合` and the explanatory model/complexity tooltip.
- Character Remix: `改编` opened a copy panel prefilled with the complete source setup and explicitly stated that App-level configuration (portrait, attributes, opening values) is copied and the source is unaffected. Saving name `TEST Character Remix 003` via `保存为我的角色` produced toast `已复制到你的角色库` and returned to `/zh-cn/characters`. The global Character Library exact-name search immediately after save, after a short wait, and after a full reload still showed `还没有角色`; however, Mine → 角色 listed the clone durably, and opening its card exposed a detail Drawer with title `TEST Character Remix 003`, copied public summary, owner profile and `聊天/改编/添加到世界` controls. Thus clone persistence and owner-library discoverability are `VERIFIED`, while global Library indexing and a stable direct URL are `UNKNOWN`. No delete was attempted for this new sample.
- Conclusion: Character editing is publicly propagated after reload; Character Chat is an independent persistent Simulation with a distinct fill-versus-send interaction, explicit per-Turn event history, energy display and cadence-based Memory; Remix creation is a separate copy flow that persists in Mine even when global Character Library indexing lags or omits the clone.
- Confidence: edit/detail propagation, Chat URL, actual Turn, event breakdown, reload persistence, Memory cadence, Remix save and Mine persistence `VERIFIED`; exact billing delta, global clone search/index convergence, clone direct URL and downstream attribution `UNKNOWN`.

## EVD-0168 — Character Add-to-World Copies Into a Versioned World Draft Without Navigation

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; source Character `测试角色生命周期 003`, target World `/zh-cn/worlds/test-template-world-001-fv99/edit`.
- Entry: Character Detail `添加到世界` opened an in-page selector titled `把这个角色添加到…`. It listed all six owned Worlds as buttons and also exposed `给新世界起个名字…`; helper text stated that the Character can be modified further in the World editor after addition.
- Submission behavior: selecting `TEST Template World 001` did not navigate away or show a success toast. During the request, every World button became disabled and the dialog then closed, returning to the source Character Detail.
- Durable postcondition: opening the target Creator showed `已恢复上次草稿`, `发布 v4`, and `这个世界有尚未发布的修改`. Its World-level Character section contained `测试角色生命周期 003` with the complete source role prompt, gender controls, public identity input and `允许玩家自定义这个角色`. Live Preview Chat also contained the copied Character. The existing published target had previously been v3, so addition created an unpublished next-version Draft rather than mutating the current public version.
- Conclusion: `添加到世界` is a server-backed copy into the target World's local Character list. It creates/updates a versioned Draft, closes in place instead of navigating, and immediately hydrates Creator Preview; publication remains a separate explicit step.
- Confidence: selector inventory, no-navigation submission, disabled loading state, durable v4 Draft, copied fields and Preview presence `VERIFIED`; toast/error copy, duplicate-add result for this exact source, source-update propagation after this copy and published v4 runtime remain `UNKNOWN`.

## EVD-0169 — World Remix-Permission Toggle Persists Through Draft Reload

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner account; target World `/zh-cn/worlds/test-template-world-001-fv99/edit` with unpublished v4 Draft.
- Action: clicked World Creator `改编权限 → 不允许`. The selected control became active and helper copy changed to `其他人不能改编这个世界，你自己仍然可以。`.
- Persistence: after waiting for autosave and reloading the Creator, the Draft still showed `发布 v4`, `这个世界有尚未发布的修改`, `不允许` active and the same helper copy. The setting therefore survives reload as part of the server-backed Draft; it is not merely an in-memory toggle.
- Scope boundary: no Publish was submitted in this sample. Public-detail rendering, non-owner Remix enforcement, old Remix exceptions and whether changing back to `允许` creates another version remain `UNKNOWN`.
- Confidence: local state, autosave persistence and reload `VERIFIED`; publication and external enforcement `UNKNOWN`.

## EVD-0170 — Public Collection Cross-Account Access, Search Omission and Non-Owner World Membership

- Source: Marvis Phase-3 `docs/research/external/marvis/phase-3/01_COLLECTION_PUBLIC_VISIBILITY.md` and raw Batch-1; Account B `mehraxbobaid78`, authenticated non-owner.
- The main account's public Collection `测试收藏生命周期 002` opened by direct URL for B and showed its creator, one World and normal share/start/remix surfaces. The Collection detail exposed no favorite/save-to-collection control of its own.
- Searching the exact Collection title twice (5-second interval) returned no match, while `/zh-cn/collections` listed the Collection. This independently re-verifies that Collection directory discovery and unified Search indexing are separate projections; it does not imply the Collection is private.
- On the public World detail, B could open `加入世界合集`, select B's own public Collection and receive toast `已加入`; the Collection count changed 1→2 and returned to 1 after owner-side removal/save. Thus adding a World to one's own Collection is a non-owner write that does not require ownership of the World.
- The owner edit surface exposes `公开 / 链接可见 / 仅自己`; no legitimate link-visible/private sample was available for enforcement.
- Confidence: direct public access, no Collection favorite entry, Search omission, directory inclusion, non-owner membership write and removal persistence `VERIFIED`; private/link-visible enforcement `UNKNOWN`.

## EVD-0171 — Intermediate World Remix Parent Deletion Silently Removes Attribution but Preserves Descendant

- Source: Marvis Phase-3 `docs/research/external/marvis/phase-3/04_VERSION_REMIX_BASELINE_ATTRIBUTION.md` and raw Batch-2; Account B created a disposable chain.
- B created `test-map-world-001-w32j` (L1, parent `gytp`, v1) and then `test-map-world-001-rev0` (L2, parent `w32j`, v1). Each child initially showed attribution only to its direct parent.
- After deleting L1, L1 direct URL returned 404, but L2 remained directly accessible, searchable, owner-editable and remixable. Its attribution text disappeared entirely—no `已删除`, `未知来源` or broken-link placeholder. Re-remixing L2 produced unpublished L3 draft `test-map-world-001-xxt9`.
- Non-owner version history on `gytp` rendered v11/v10/v9 entries as read-only text with no old-version links or selector. This closes only the non-owner read-only boundary; old version URLs and owner historical sharing remain UNKNOWN.
- Confidence: direct-parent attribution, parent deletion 404, descendant survival/search/remix, silent attribution removal and non-owner version read-only `VERIFIED`; owner old-version URL/share behavior `UNKNOWN`.

## EVD-0172 — Guest Character/App/Map Remaining Controls

- Source: Marvis Phase-3 `docs/research/external/marvis/phase-3/05_GUEST_CONTROLS_AUDIT_REMAINING.md` and raw Batch-2; Guest identity.
- Guest Character detail has no standalone `/characters/<slug>` route; it is an in-page detail surface. `排行榜` renders populated `开局数 / 总轮次` rows with profile links; `支持者` renders an empty supporter state with normal Chat/Add controls.
- Guest App detail `/zh-cn/apps/main-input` exposes `送礼` and an empty `打赏榜`; clicking `送礼` redirects to `/zh-cn/login?next=/zh-cn/apps/main-input`, confirming a login wall rather than the Guest favorite-style silent failure.
- Guest `/zh-cn/maps` card `查看大图` and direct thumbnail click open the same zoom/pan modal. No independent `/maps/<slug>` detail route exists; a guessed `demon-slayer-japan` path returns 404. The World detail map icon is a type marker, while World-level `预览` is separate.
- Confidence: controls, states, modal equivalence, login-wall URL and no-map-detail route `VERIFIED`; exact guest leaderboard data freshness and World preview equivalence `UNKNOWN`.

## EVD-0173 — Account-B App Direct URL 404 Requires Owner-Side Lifecycle Interpretation

- Source: Marvis Phase-3 `docs/research/external/marvis/phase-3/02_PRIVATE_UNLISTED_MATRIX.md` / raw Batch-1; Account B authenticated non-owner.
- `/zh-cn/apps/test-app-first-publish-001` returned the generic 404 page after a direct navigation and one hard reload. B saw no object metadata or permission-request path.
- The observation is compatible with permanent deletion, downlist/unpublish, Private/Unlisted visibility or another lifecycle state. It must not be promoted to a new global permission rule until owner-side current state is checked against the main App deletion/version evidence.
- Confidence: B-side 404 `VERIFIED` for that observation; root cause `UNKNOWN`.

## EVD-0174 — Owner-Side App Reconciliation: `test-app-first-publish-001` Is Currently Public v2

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`, direct URL `/zh-cn/apps/test-app-first-publish-001`.
- The owner direct page loaded normally after navigation and a wait. It showed title `TEST App First Publish 001`, owner `x161880`, public App detail controls `编辑`, `删除`, `安装`, `在线试玩`, update log entries `v2` and `v1`, and `4 个世界在用`. The public detail rendered the v2 iframe text `TEST FIRST PUBLISH HTML V2`.
- The owner App editor link resolved to `/zh-cn/apps/create?slug=test-app-first-publish-001`, confirming the object is still addressable as an editable App rather than permanently deleted. No owner-side unpublish/downlist control was exposed on the detail page.
- This current owner observation rules out “currently permanently deleted” and is inconsistent with Account B's earlier generic 404 observation, but it does not identify the historical cause of B's 404. Candidate explanations remain a temporal visibility transition, stale/lagging cross-account projection, session-specific permission defect, or an earlier state later repaired by republish; no one is promoted without a same-time B recheck.
- Confidence: owner current public v2, direct addressability, usage count and lack of visible unpublish control `VERIFIED`; historical cross-account 404 root cause `UNKNOWN`.

## EVD-0175 — Owner Recheck Provides a Persisted Link-Visible Collection Sample

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`, Collection editor `/zh-cn/collections/test-collection-001-g6wi/edit`.
- The editor shows visibility controls `公开`, `链接可见`, `仅自己`; `链接可见` has the active selected styling after a full navigation and reload. The helper copy is `不会出现在发现页，但有链接的人可以打开。`
- The Collection remains owner-editable with one World. This confirms the sample is not merely an unsaved local toggle and can be handed to Account B/Guest for direct-link, browse/Search omission, share and membership enforcement testing.
- No visibility change was submitted during this recheck, and no deletion or external publication occurred.
- Confidence: owner-side persisted selected state and helper semantics `VERIFIED`; Guest/non-owner enforcement `UNKNOWN` until independent-viewer access.

## EVD-0176 — Published World v4 With Remix Permission Disabled

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`, Creator `/zh-cn/worlds/test-template-world-001-fv99/edit`.
- Precondition: v4 Draft had `改编权限 → 不允许` selected and persisted through reload. The control helper stated `其他人不能改编这个世界，你自己仍然可以。`.
- Action: clicked `发布 v4`; the first click opened a `发布世界更新` modal. The modal required an update log and exposed optional version title plus `取消` and disabled/enabled `发布 v4`. Filled update log `权限边界审计：关闭世界改编权限，验证跨账号访问与 Remix 行为。` and submitted the modal.
- Postcondition: navigation returned to public `/zh-cn/worlds/test-template-world-001-fv99`; version log showed `v4 最新版` with the submitted update note, followed by v3/v2/v1. Public detail still exposed owner `继续编辑`, `删除世界`, `分享`, `加入世界合集` and no owner-side Remix button.
- This closes the owner lifecycle boundary (Draft persistence → Publish modal → required changelog → public v4/version log). It does **not** prove non-owner enforcement; Account B/Guest must inspect the same public URL after propagation for Remix button visibility, disabled/error behavior, direct Remix URL and existing child exceptions.
- Owner recheck of the public v4 showed the page-level `改编` control still present and enabled, consistent with the helper copy that the owner may continue to Remix even when other users are disallowed. The first matching page-level control was enabled; similar-world cards also expose their own Remix buttons and must be distinguished by page section.
- Confidence: publication, required changelog, version increment and public detail/version-log postcondition `VERIFIED`; external enforcement was later closed by EVD-0192.

## EVD-0177 — Owner Public Version Log Has No Historical Version URL/Selector

- Time: 2026-08-24 (Asia/Shanghai), owner public detail `/zh-cn/worlds/test-template-world-001-fv99` after v4 publish.
- The expanded `版本记录` area rendered v4/v3/v2/v1 as static text/articles. The only World-related anchors in the page were the current `编辑` route and `+ 新模拟`; no historical-version anchor, version selector, old-version share URL or version-specific navigation was present in the rendered DOM.
- This independently confirms the non-owner observation that the visible Version History is a read-only log. It still does not prove whether hidden/guessable historical URLs exist, so owner old-version direct-link behavior remains UNKNOWN.
- Confidence: visible controls and absence of historical links in the current DOM `VERIFIED`; backend historical URL scheme `UNKNOWN`.

## EVD-0178 — Codex-Local Session Isolation During Phase-4 Preflight (Not a Project Account-B Block)

- Time: 2026-08-24 (Asia/Shanghai), before Phase-4 checks of App `test-app-first-publish-001`, Collection `test-collection-001-g6wi` and World `test-template-world-001-fv99`.
- Intended identities were Account B (`mehraxbobaid78`) and Guest. The main Agent's own IAB and Chrome contexts both hydrated to Account A `x161880 / x161880@gmail.com`; no Account-B WorldOS tab or isolated Guest profile was available **inside Codex** to claim. The independent Account B session belonged to the user's external Tencent Marvis Agent and was outside this browser context.
- No logout, login, password entry, CAPTCHA, security verification, visibility change, deletion or Remix creation was attempted. The owner current baselines remain EVD-0174–0176 and are not reused as non-owner evidence.
- Conclusion: the Codex-local attempt could not perform those matrices. This is `CODEX_LOCAL_SESSION_ISOLATION`, not evidence that Account B/Guest were unavailable to the project. App behavior was superseded by EVD-0190; Collection and remix-disabled enforcement were later closed by EVD-0191/EVD-0192.
- Confidence: local session identity/isolation `VERIFIED`; product behavior `NOT_INFERRED`.

## EVD-0179 — External Marvis Account-B/Guest App Recheck: Persistent 404 and Search Omission

- Time reported: 2026-08-24 (Asia/Shanghai); target `/zh-cn/apps/test-app-first-publish-001`.
- Source: detailed report supplied by the user from the independent external Marvis witness Agent; archival copy: `docs/research/external/marvis/phase-4/06_APP_RECHECK_001_EXTERNAL_MARVIS.md`. Original screenshots/document were not yet present in the workspace. Guest opened the direct URL at 14:21:35 and hard-refreshed at 14:23:44; both returned generic `404 This page could not be found.` Account B opened at 14:26:18 and refreshed at 14:27:08; both returned 404. B searched the App Market by title/slug (14:27–14:29) and unified Search including the App tab (14:30–14:31); neither returned a result. A known deleted control App `test-app-delete-lifecycle-001` also returned the same generic 404 shape at 14:32.
- This strengthens EVD-0173 from a single B direct-link observation to a reported Guest+B repeated direct-link/search comparison. It still cannot distinguish `unpublished`, `downlisted`, private visibility, lifecycle timing, or a permission defect. Owner EVD-0174 remains contradictory in the useful way: the same owner currently sees public v2 and an editable slug route.
- Confidence: Guest/B direct 404 + refresh and search omission `EXTERNAL_BLACKBOX_REPORTED / HIGH` at the tested-sample scope; same-shape deleted-App comparison `EXTERNAL_BLACKBOX_REPORTED / MEDIUM-HIGH`; original visual artifacts are not archived; root cause `UNKNOWN`.

## EVD-0180 — Owner App Creator Exposes Usage-Gated Downlist Branch

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; App Creator `/zh-cn/apps/create?slug=test-app-first-publish-001`.
- After opening the persisted `配置` panel, the App still exposed `存草稿` and `发布`, and the configuration footer exposed `删除` with helper text `如果其他用户的世界正在使用,只能下架(市场隐藏,已装世界不受影响)。`.
- Clicking `删除` entered an observable asynchronous state `正在检查使用情况…`. After the check, the site modal changed to heading `只能下架` and exact body `有 2 个其他用户的世界正在使用这个 App,无法删除。下架后它不再出现在 App 市场,已安装的世界不受影响。` with `取消` and `下架` buttons. The modal was cancelled; no visibility or App data changed.
- This is direct owner evidence that App deletion is usage-gated and that a reversible/semantically distinct `下架` branch exists when other users' Worlds are installed. It materially narrows the interpretation of EVD-0173/EVD-0179: a prior downlist or stale downlist projection is a concrete candidate for the B/Guest 404, but it is not proven because the current App detail remains public v2 and the `下架` action was not submitted.
- Confidence: usage check, exact downlist modal, cross-owner usage count and cancel preservation `VERIFIED`; post-downlist direct-link/Search behavior, republish/relist path and cause of the historical B/Guest 404 `UNKNOWN`.

## EVD-0181 — Character Remix Clone Owner Drawer Has No Edit/Delete, Only Runtime/Copy Actions

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; Mine → 角色 → `TEST Character Remix 003`.
- The durable clone card opened an in-page detail drawer. The drawer exposed `favorite`, creator Profile, `关注`, `评论`, `排行榜`, `支持者`, `聊天`, `改编` and `添加到世界`; it did **not** expose `编辑` or `删除`. The clone had no stable direct URL in the visible DOM; it remained reachable through Mine's card.
- Opening `改编` showed a copy panel prefilled with the clone name and description, an icon control, exact helper copy that saving creates a new role-library object and copies App-level configuration (portrait, attributes, opening values), plus `保存为我的角色` and `添加到世界`. The panel was closed without saving, so no additional clone was created.
- This confirms the current owner-side Character Remix lifecycle is copy-forward rather than edit-in-place from the clone detail surface. Whether edit/delete controls exist on another route, whether the clone gains a direct URL after indexing, and how a Character Remix parent deletion affects descendants remain `UNKNOWN`.
- Confidence: clone Mine persistence, control inventory, copy-panel prefill/helper and cancel/no-new-object boundary `VERIFIED`; edit/delete alternate entry, direct-link/index convergence and intermediate-parent semantics `UNKNOWN`.

## EVD-0182 — Collection Delete Uses Browser-Native Confirmation (User-Mediated Cancel)

- Time: 2026-08-24 (Asia/Shanghai), owner Collection `test-collection-001-g6wi`.
- The public owner detail exposes `删除合集`. Activating it caused a browser-native confirmation dialog to appear in the user's visible browser UI. The Browser Use DOM/snapshot did not expose the dialog text or buttons; a concurrent automation wait timed out, and no delete postcondition was observed.
- User was instructed to click `取消/否`; the collection was intentionally preserved. Treat exact native-copy text, acceptance behavior, recovery and post-delete direct URL as `UNKNOWN` until a user-provided screenshot/transcript or a controlled user-mediated acceptance supplies evidence.
- Confidence: delete control and native-confirm appearance `VERIFIED`; exact copy and final deletion lifecycle `UNKNOWN`; cancel/preservation `USER-MEDIATED / PENDING CONFIRMATION`.

## EVD-0183 — Collection Membership Save and Keyboard Reorder Persist

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; `/zh-cn/collections/test-collection-001-g6wi/edit`.
- Before: `TEST Collection 001` editor showed `链接可见`, one member (`TEST World 001`), counter `1/100`. Reload after the earlier native-confirm interruption confirmed the collection was not deleted and the link-visible selection persisted.
- Action: clicked `添加` for `TEST Template World 001`; counter changed to `2/100`. Clicked the second sortable handle and used the exposed keyboard DnD sequence Space → ArrowUp → Space. The DOM emitted a DnD drop status and the order became `TEST Template World 001` then `TEST World 001`.
- Action: clicked `保存合集`; button entered `正在保存…`, then redirected to the stable detail route. Reloading `/edit` restored `2/100` and the reordered sequence, proving membership addition and order are persisted server-side rather than remaining local draft state.
- The public owner detail then displayed two World cards in the same order. The editor's remove controls remain icon-only; no removal was committed in this pass.
- Confidence: link-visible persistence after interruption `VERIFIED`; add/save membership `VERIFIED`; keyboard reorder/save persistence `VERIFIED`; final remove/delete lifecycle `UNKNOWN`.

## EVD-0184 — Collection Final Delete Removes Detail, Edit Route and Search Result

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; disposable empty private Collection `test-collection-delete-lifecycle-001-x5ex`.
- The Collection had been created and saved as `仅自己`; its owner detail showed `0 个世界`, `编辑合集`, `分享` and `删除合集`. Activating `删除合集` opened a browser-native confirmation. The user clicked the final confirmation.
- Postcondition: the same detail URL `/zh-cn/collections/test-collection-delete-lifecycle-001-x5ex` returned generic `404 / This page could not be found.`; the edit URL `/zh-cn/collections/test-collection-delete-lifecycle-001-x5ex/edit` also returned 404.
- Exact-title collection search `/zh-cn/collections?q=TEST%20Collection%20Delete%20Lifecycle%20001` returned `0 个合集` and `没有找到合集`. No restore/undo control appeared.
- This is a complete owner-side delete propagation sample for an empty private Collection. Exact native confirmation copy, cross-account cached visibility and any backend retention window remain UNKNOWN.
- Confidence: final delete and direct/edit URL invalidation `VERIFIED` after user-mediated confirmation; exact native copy and cross-account propagation `UNKNOWN`.

## EVD-0185 — Character Remix L2 Owner Drawer Recheck Confirms Copy-Forward Boundary

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; Mine → 作品 → 角色 → `我创建的` → `TEST Character Remix L2`.
- The clone card is a composite button and opens an in-page detail drawer, not a route navigation. The drawer exposes `聊天`, `改编`, `添加到世界`, `favorite`, `关注`, `评论`, `排行榜` and `支持者`; no `编辑` or `删除` control is rendered for this Remix clone.
- Unified Search exact query `TEST Character Remix L2` returned no result in the owner session during this check. The clone remains reachable through Mine's Works → Character list. A stable public/direct URL and independent-viewer discovery are therefore `UNKNOWN`, not “absent”.
- This independently rechecks EVD-0181's copy-forward boundary for the L2 sample. It does not prove that no alternate hidden owner route exists.
- Confidence: owner Mine reachability and visible control inventory `VERIFIED`; unified-search omission at this observation time `VERIFIED` (sample/time-scoped); stable URL/alternate edit-delete route and external enforcement `UNKNOWN`.

## EVD-0186 — App Usage-Gated Downlist Hides Market Entry but Preserves Installed Runtime

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; App `test-app-first-publish-001`, owner Creator `/zh-cn/apps/create?slug=test-app-first-publish-001`.
- Starting state: owner App was public v2 with `4 个世界在用`; Creator `删除` entered the exact usage-gated modal `只能下架` because two other-user Worlds use the App.
- Action: clicked final `下架` in the modal. The Creator redirected to App Market. App Market title search showed the owner card marked `未公开`, still with `4 个世界在用`; owner direct detail `/zh-cn/apps/test-app-first-publish-001` and edit slug remained reachable, with `编辑/删除/安装` controls and v1/v2 log.
- Unified Search exact slug initially returned no result. The downlisted owner detail still rendered the existing online-preview iframe and four installed-World cards. A known installed Simulation `TEST App First Publish v9 Fresh 001` still exposed the `🧩` App dock and the `TEST App First Publish 001` iframe after reload; downlisting did not remove the installed runtime or its prior state.
- This directly verifies the modal copy's semantics on the owner side: downlist hides the App from normal public discovery while preserving owner management, existing World usage and installed Simulation runtime. Cross-account post-downlist visibility and exact search-cache timing remain `UNKNOWN`.
- Confidence: owner downlist action, owner `未公开` state, Market owner-card visibility, direct/edit reachability and installed-runtime preservation `VERIFIED`; B/Guest propagation and cache SLA `UNKNOWN`.

## EVD-0187 — App Republish Restores Market Discovery Without Creating a New Version

- Time: 2026-08-24 (Asia/Shanghai), same App after EVD-0186.
- Action: opened the persisted slug Creator route and clicked `发布`. Toast: `已发布到 App Market！`; no version/update-log modal appeared.
- After reload: owner detail became public again (the `未公开` badge disappeared), App Market exact-title search returned the card, direct detail remained reachable, and the update log still contained only v1 and v2. No v3 was created by this relist operation.
- Unified Search exact slug remained empty during immediate and ~5-second checks, indicating Market indexing and Unified Search may have separate asynchronous visibility pathways even after republish.
- Installed Simulation continued to show the same App iframe/Dock; no World-version prompt or state reset appeared.
- Confidence: owner republish toast, public badge transition, Market restoration and no-new-version behavior `VERIFIED`; unified Search eventual convergence, cross-account visibility and external viewer behavior `UNKNOWN`.

## EVD-0188 — Owner World Version History Is Static and Share Uses the Current Canonical URL

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; World `/zh-cn/worlds/test-template-world-001-fv99`, current v4.
- Version section rendered `v4 最新版`, `v3 · Template required default`, and `v2 · Template persistence` with dates and update logs. DOM inspection found no links, buttons, selector, query parameter, or historical-detail control attached to those entries.
- Clicking page-level `分享` opened `分享这个世界` with poster ratios `4:5`, `1:1`, `9:16`, `保存海报`, `复制链接`, `复制文案`, `发布到 X`, `更多分享方式` and Rewards deep link. The X intent and share panel used the current canonical URL `https://worldos.cc/zh-cn/worlds/test-template-world-001-fv99`, without a version identifier.
- Visible owner UI therefore exposes a readable version log but no historical-version navigation or version-pinned share URL. This does not prove that no undocumented backend route exists.
- Confidence: visible version/control inventory and current canonical share target `VERIFIED`; historical route existence, version-pinned share and historical Remix behavior `UNKNOWN`.

## EVD-0189 — Simulation Export Is Entitlement-Gated Before File Format Selection

- Time: 2026-08-24 (Asia/Shanghai), authenticated free owner; Simulation `/zh-cn/sim/f868a0b3-9d12-470c-871d-9a5de4d967d3` → 设置 → `导出交互记录`.
- Clicking export opened a purchase/entitlement dialog titled `导出模拟记录是会员功能`, with tabs `一次性` / `订阅` / `自备 API`, domestic/international payment switch, plan cards and Rewards link.
- Membership benefits explicitly list `导出模拟交互记录（Markdown / HTML / TXT）`. No format picker, filename, schema preview or download appeared before entitlement; no payment was submitted.
- Exact exported schema/import compatibility remains `UNKNOWN`; it cannot be inferred from the three advertised format names.
- Confidence: export entry, entitlement wall and advertised formats `VERIFIED`; actual file contents, filenames, encoding, assets and re-import behavior `UNKNOWN`.

## EVD-0190 — External Recheck After App Republish Restores Guest/B Direct Access but Not Discovery

- Time reported: 2026-08-24 15:2x–15:4x (Asia/Shanghai); target `/zh-cn/apps/test-app-first-publish-001`.
- Source/provenance: external Tencent Marvis final report archived at `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md`; updated Phase-3 summary at `docs/research/external/marvis/phase-3/07_PHASE3_SUMMARY.md`. The markdown report is archived in the workspace; referenced visual artifacts were not supplied as separate files.
- Account B opened the App direct URL and hard-reloaded it successfully. The page exposed `TEST App First Publish 001`, creator `x161880`, `4 个世界在用` and v2 update-log content. Guest independently opened and hard-reloaded the same canonical URL successfully and saw the public preview/rating/comment surfaces.
- In both identities, exact-title and exact-slug queries still returned no result in App Market and Unified Search's App tab.
- This supersedes the earlier *current-state* 404 observation in EVD-0173/EVD-0179: after the owner downlist→republish lifecycle in EVD-0186–0187, direct external access recovered. The observed state transition supports a publication-state association, but black-box evidence does not identify the exact backend flag, cache, projection or indexing rule.
- Confidence: reported Guest/B direct recovery and discovery omission `EXTERNAL_BLACKBOX_REPORTED / HIGH`; exact cause and discovery convergence SLA `UNKNOWN`.

## EVD-0191 — Link-Visible Collection Is Directly Readable but Excluded From Discovery

- Time reported: 2026-08-24 15:2x–15:4x (Asia/Shanghai); Collection `/zh-cn/collections/test-collection-001-g6wi` (`测试系列 001`).
- Source/provenance: `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md` and updated `docs/research/external/marvis/phase-3/01_COLLECTION_PUBLIC_VISIBILITY.md`.
- Account B and Guest both opened and hard-reloaded the direct URL successfully. Both saw the two member Worlds and could open them. Share retained the same canonical Collection URL.
- The Collection was absent from `/zh-cn/collections` discovery and exact-title Unified Search. Non-owner/Guest detail did not render Edit, Delete, Favorite, Save or Collection-management controls; Guest `立即开始` entered the login wall.
- Result for the tested state: `链接可见` means direct-link readable, discovery/search omitted and owner management stripped for external viewers. `仅自己` external enforcement remains untested.
- Confidence: `EXTERNAL_BLACKBOX_REPORTED / HIGH` at the tested sample scope.

## EVD-0192 — Published Remix-Disabled World Enforces the Permission for Guest and Logged-In Non-Owner

- Time reported: 2026-08-24 15:2x–15:5x (Asia/Shanghai); World `/zh-cn/worlds/test-template-world-001-fv99`, published v4 with `改编权限=不允许`.
- Source/provenance: `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md` and updated `docs/research/external/marvis/phase-3/03_REMIX_PERMISSION_ENFORCEMENT.md`.
- Guest World detail did not render a Remix control in the main World region. The Collection-card Remix control remained visible but clicking it produced no navigation, modal, toast or dialog. Guest `立即开始` entered the normal login wall.
- Account B could open the Collection-level Remix modal, but `复制并自己改编` closed without changing URL, navigation or request and produced no new Remix in Mine/Search. The final creation action was therefore rejected even though an upstream entry remained visible.
- Result: the published permission is enforced for the tested external identities, with inconsistent surface feedback (hidden on main detail, silent/no-op at Collection entry, late silent block for logged-in non-owner).
- Confidence: `EXTERNAL_BLACKBOX_REPORTED / HIGH` at the tested sample scope; direct undocumented Remix-route behavior and already-existing descendant exceptions remain `UNKNOWN`.

## EVD-0193 — Owner-Only Collection Sample Persists With Direct Owner Detail/Edit Access

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; Creator `/zh-cn/collections/new`.
- Created `TEST Collection Only Me 001` with visibility `仅自己`, description and tags, plus one World `TEST Template World 001`.
- The editor helper copy changed to `只有你可以查看和编辑。`; save showed a transient `正在保存…` state, then redirected to stable detail URL `https://worldos.cc/zh-cn/collections/test-collection-only-me-001-c7x5` (title `测试系列：仅限我 001`).
- Owner detail exposed `编辑合集` at `/zh-cn/collections/test-collection-only-me-001-c7x5/edit`, `删除合集`, `分享`, one member World and owner-only management controls.
- Result: owner-side `仅自己` persistence, member save and stable detail/edit lifecycle `VERIFIED`; Guest/non-owner direct URL, Search, directory, Share, item access and management enforcement remain `UNKNOWN`.
- Confidence: owner behavior `VERIFIED`, external enforcement `UNKNOWN`.

## EVD-0194 — Character Remix Clone Remains Owner-Mine Reachable but Is Omitted From Global Character Search

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; Mine `/zh-cn/sims` → 作品 → 角色 → `我创建的`.
- `TEST Character Remix 003` opened as an in-page detail Drawer rather than changing the URL. The Drawer exposed `聊天`, `改编`, `添加到世界`, favorite/follow/comment/ranking/supporter controls, but no `编辑` or `删除`; its Remix panel copy-forwarded the name/description and stated App-level configuration would be copied while leaving the original unaffected.
- The clone card's outer element was a `div[role=button]` with no `href`; visible anchors contained only `/characters` and `/characters?create=1`. No stable public URL was discovered in this owner surface.
- Exact global Character Library search for `TEST Character Remix 003` returned `还没有角色`, while Mine's Works → Character list retained the clone and its Drawer.
- Result: owner-Mine persistence, no exposed stable href/Edit/Delete, and observed global-search omission are `VERIFIED`; asynchronous index convergence and hidden alternate routes remain `UNKNOWN`.
- Confidence: owner controls/search observation `VERIFIED`; underlying index/hidden routes `UNKNOWN`.

## EVD-0195 — Only-Me Collection Appears in Owner Profile but Is Omitted From Public Collection Browse/Search

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; owner Profile `/zh-cn/profile/895fa29b-8b4a-4e01-9275-ef4c2b72c1f2` and Collection browse `/zh-cn/collections`.
- After saving `TEST Collection Only Me 001` as `仅自己`, the owner Profile's `我的合集` section rendered the card and stable link `/zh-cn/collections/test-collection-only-me-001-c7x5`, with one member World and the owner description.
- Exact title search on `/zh-cn/collections` returned `0 个合集` / `没有找到合集`; the object was not in the public 56-card directory result. This was performed in the same owner session, so it establishes owner Profile projection versus public browse/search separation, not external access enforcement.
- Confidence: owner Profile inclusion and public browse/search omission `VERIFIED`; Guest/non-owner direct-link behavior remains `UNKNOWN`.

## EVD-0196 — App Creator Accepts JSON Arrays but Normalizes Malformed Initial JSON to an Empty Object

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; disposable App Creator sample `/zh-cn/apps/create?slug=test-app-invalid-json-001`.
- Created a minimal App draft `TEST App Invalid JSON 001` with HTML `<div>TEST INVALID JSON APP</div>`, slug `test-app-invalid-json-001`, name/description/detail text, and Initial JSON `[1,2]`. `存草稿` completed without an inline validation error; reopening the slug route preserved the JSON as pretty-printed `[\n  1,\n  2\n]`, proving scalar/array JSON is accepted rather than restricted to objects at the editor boundary.
- Replaced Initial JSON with malformed `{ invalid-json `, switched back to Preview and clicked `存草稿`. The save completed (button became disabled during the save cycle) with no visible error. Reloading the persisted slug route and reopening `配置` showed the field normalized to `{}` while HTML/name/description/detail remained intact.
- This is a creator-side normalization behavior only; runtime installation/merge of array or malformed input was not performed in this probe.
- Confidence: array acceptance, malformed-save completion and reload normalization to `{}` `VERIFIED`; runtime schema coercion, server validation details and error recovery beyond this sample `UNKNOWN`.

## EVD-0197 — Timeline Panel Export Uses the Same Membership Gate as Settings Export

- Time: 2026-08-24 (Asia/Shanghai), authenticated free owner; Simulation `/zh-cn/sim/05ac8dda-b534-415b-94aa-74ffa3378c00`.
- Opened the Turn-history panel through `回溯时间（查看历史）`. The panel exposed mode controls `按轮次`, `按时间`, `按主线` and a distinct visible `导出` button.
- Clicking this Timeline-level `导出` did not start a browser download. It opened the same entitlement dialog titled `导出模拟记录是会员功能`, with `一次性` / `订阅` / `自备 API`, plan/payment surfaces, Rewards link and the advertised benefit `导出模拟交互记录（Markdown / HTML / TXT）`.
- The dialog was cancelled; no payment, subscription or download occurred. This confirms Settings and Timeline are two entry points to one gated export capability rather than separate free/paid exporters.
- Confidence: Timeline export entry, shared entitlement wall and no pre-entitlement download `VERIFIED`; artifact schema/import compatibility remains `UNKNOWN / BLOCKED_BY_MEMBERSHIP`.

## EVD-0198 — Character Remix Chat Has an Independent, Renameable Save Identity

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; Character Remix clone `TEST Character Remix 003` and Simulation `/zh-cn/sim/909c07cf-58bb-43d6-9211-aaf423c99a34`.
- Mine → Works → Character → `TEST Character Remix 003` opened the clone Drawer. Its `聊天` action navigated to the stable Simulation UUID above. The existing opening/story content survived a direct reload, proving the Chat is a durable save rather than an ephemeral Drawer session.
- Mine → History → `角色` listed four Character saves, including this UUID, `测试角色生命周期 003`, L1 and L2. The target row initially showed save name `TEST Character Remix 003`, source/Character label `TEST Character Remix 003 · 回合 1`, date and `更多`.
- `更多` exposed `重命名` and `删除`. Renaming to `TEST Character Remix 003 Save Audit` produced a stale same-render card, but after reload the row heading and Simulation document title used the new save name while the row subtitle and Settings heading remained `TEST Character Remix 003`.
- Result: Character Chat has separate save identity (renameable display name + stable Simulation UUID) and Character identity (unchanged source label/config). Mine's Character filter is the management projection for these saves.
- Confidence: stable Chat UUID/reload, Character-history projection, rename persistence and name/identity separation `VERIFIED`; delete cascade for this clone save was not submitted.

## EVD-0199 — Character Chat Share Generates a Canonical URL That 404s for the Owner

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; two controlled Character Chat samples.
- Remix sample `/zh-cn/sim/909c07cf-58bb-43d6-9211-aaf423c99a34` → Settings → `分享` opened a generic `分享这个世界` composer. Its X intent encoded `https://worldos.cc/zh-cn/worlds/char:0d03c2f7-0eed-4495-b437-3fafea1c0fcf`; `复制链接` changed to `已复制`, and the composer then showed `海报生成失败，可先复制链接分享。` Direct owner navigation to the exact encoded URL returned generic `404 / This page could not be found.`
- Non-Remix control `/zh-cn/sim/b08c2af0-8ad3-473b-b2f1-6ca6d54a8e40` generated the same route shape with another ID: `/zh-cn/worlds/char:88d0ab0d-3942-4be1-b00e-c1124ddc2904`. Direct owner navigation also returned the same 404.
- The failure therefore reproduces across ordinary and Remix Character Chat, not only one clone. The UI labels the modal as a World share composer and emits a non-resolving Character canonical route.
- Confidence: generated route shapes, exact X-intent URLs, Remix poster error and owner direct 404 on both samples `VERIFIED`; Guest/non-owner behavior and backend intent `UNKNOWN`; classify as a reproducible Character-share defect candidate.

## EVD-0200 — Browser Viewport Override Is Environment-Blocked Even for Fresh Tabs

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; Browser viewport capability set to `390x844` before creating a fresh WorldOS tab and navigating to `/zh-cn`.
- The newly created tab still reported `innerWidth=1280`, `innerHeight=720`, `documentElement.clientWidth=1272`, `body.scrollWidth=1272` and DPR 2. The DOM rendered the desktop complementary navigation rather than a mobile shell.
- This reproduces the earlier result from applying 390px to an existing tab and rules out “override only failed because the tab was already claimed.” The explicit viewport override was reset afterward.
- Result: this browser environment cannot supply authoritative 390px responsive evidence. Desktop-sized rendering under a requested override is an environment limitation, not proof that WorldOS ignores mobile breakpoints.
- Confidence: requested dimensions and reported page metrics `VERIFIED`; actual mobile WorldOS behavior `UNKNOWN / ENVIRONMENT_BLOCKED`.

## EVD-0201 — Offline Turn Is Optimistically Shown, Stalls, Then Atomically Rolls Back on Reload

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; Simulation `/zh-cn/sim/1440b4a4-2c7d-4bca-ac37-d0e98c91ac2c`, precondition Turn 1 and account energy 303.
- A tab-scoped network-offline condition was applied after the page loaded. Submitted `TEST NETWORK FAILURE 001：仅返回一句无法连接。` through the normal action input.
- The client immediately/optimistically showed `回合 2`, `世界正在回应…` and exact recovery status `连接中断,正在恢复本回合…`; action input, Send and Timeline were disabled. No new Story response appeared.
- Network was restored. After an initial 3.5 seconds and an additional 9 seconds, the same Turn-2 recovery state remained with no Retry/Cancel action and no automatic completion.
- Reloading the same UUID resolved the client: it returned to Turn 1, the submitted test action was absent, inputs/Timeline became usable, and energy remained 303. The failed Turn therefore did not persist or charge, but the in-place recovery UI was stuck until reload.
- The tab's network state was restored before leaving the experiment.
- Confidence: optimistic Turn display, exact interrupted state, bounded failure to auto-recover, reload rollback and no charge `VERIFIED`; longer retry TTL/background recovery behavior `UNKNOWN`; classify as recoverable data semantics with a stuck automatic-recovery UX defect candidate.

## EVD-0202 — App Preview Script Errors Are Console-Only and Persist Until the Draft Is Fixed

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; disposable unpublished App `/zh-cn/apps/create?slug=test-app-invalid-json-001`.
- Replaced the valid HTML with `<div id='before'>BEFORE ERROR</div><script>throw new Error('TEST_RUNTIME_ERROR_001')</script><div>AFTER ERROR</div>` and closed the HTML editor to render Preview.
- The iframe rendered both `BEFORE ERROR` and `AFTER ERROR`. The App Creator showed no visible error banner, placeholder, toast or disabled save state. Browser logs captured `Error: TEST_RUNTIME_ERROR_001 at about:srcdoc:119:64`.
- `存草稿` succeeded. Reloading the slug route rendered the same two HTML fragments and emitted the same console error again, proving runtime failure does not block Draft persistence or get sanitized on reload.
- Replaced the HTML with `<div>TEST INVALID JSON APP · RECOVERED</div>`, saved and reloaded. The iframe rendered the recovered text and emitted no new instance of the test error. The same Draft is therefore repairable through the ordinary editor/save flow.
- Confidence: visible rendering, console-only error, save/reload persistence and edit/reload recovery `VERIFIED`; installed/public runtime isolation and catastrophic iframe crashes `UNKNOWN`.

## EVD-0203 — Free World App Enforcement Is 10 Despite the Same Wall Advertising 8

- Time: 2026-08-24 (Asia/Shanghai), authenticated free owner; clean `/zh-cn/worlds/create` Creator state.
- The new World began with six default Apps: Main Input, Story, Chat, Time, CG and Achievements. Opened `安装 App` and used the normal two-stage catalog → App configuration → final `安装` flow.
- Sequentially installed WorldOS Wallet as App 7, `数字卡片` as App 8, `数字钱包` as App 9 and `PayPol` as App 10. Each final install succeeded; the Creator's installed-card `卸载` count advanced 6→7→8→9→10 with no entitlement wall at either 8 or 9.
- Opened `班科钱包` configuration as the 11th candidate. Its configuration panel loaded normally, but final `安装` did not add the App (`卸载` count remained 10) and opened a membership dialog with exact leading copy `每个世界安装超过 10 个 App 是会员功能。`
- The same modal's plan benefit list contradicted its enforcement copy: `每个世界不限 App 数量（免费版最多 8 个）` on each subscription tier.
- Result: the tested free-account enforcement boundary is 10 installed Apps; App 11 is blocked. The `免费版最多 8 个` line is stale/inaccurate marketing copy in the same modal, not the actual limit.
- Confidence: clean count progression, App-11 rejection, preserved count 10 and exact conflicting copy `VERIFIED`; paid unlimited behavior not purchased/tested.

## EVD-0204 — Rewind Removes a Post-Snapshot Dynamic App but Leaves a Temporary Ghost Dock

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; Hogwarts Simulation `/zh-cn/sim/d66ac97e-104f-463e-bf3c-9f35d3c6a496`.
- Precondition: durable Turn 3, account energy 303, and no Shop in the current Dock or `已安装` list. Installed the official Shop through Settings → Add App; the UI reiterated `每个额外 App 每回合 +2 电量`, emitted `已安装`, and the reloaded Simulation showed `🛍️`.
- With Shop active, the model menu showed `Civilization 1 16/回合`, `Civilization 1 Small 10/回合`, `Deepseek 10/回合`. Selecting Deepseek and submitting `EVD-OQ-0007-PRE-REWIND` advanced Turn 3→4 and energy `303 → 293`, exactly 10.
- Events → Turn 3 → `查看这一轮的世界状态` → `恢复到此状态` exposed a native confirm. Accepting it restored the same UUID to Turn 3 and did not refund the spent 10 (`293` remained).
- Immediately after restore, the current render still showed `🛍️`; Add App → `已安装` temporarily listed Shop and labeled it `世界自带`. In contrast, the authoritative model-cost projection had already returned to base values `14/8/8`, including `Deepseek 8/回合`.
- A second controlled action `EVD-OQ-0007-POST-REWIND` advanced the restored branch Turn 3→4 and energy `293 → 285`, exactly 8. Reload preserved the new Turn/action and 285 energy but removed the Shop Dock; the model menu remained at base `Deepseek 8/回合`.
- Result: a Rewind to a Turn before a between-Turn dynamic installation removes the active App installation and surcharge. The stale immediate Dock/installed row is a client-projection defect, not persistent config or a free active App. Historical cost is not refunded.
- Confidence: install surcharge, Rewind confirmation, no refund, post-Rewind base charge and reload cleanup `VERIFIED`; exact cache invalidation layer `UNKNOWN`.

## EVD-0205 — Character Remix Has No Discoverable Owner Edit/Delete Surface

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; Mine `/zh-cn/sims` → Works → Character → Created.
- The same grid exposed a controlled side-by-side boundary. Ordinary/global and World-local owned Character cards contained a nested `编辑` control. `TEST Character Remix 003`, `TEST Character Remix L1` and `TEST Character Remix L2` instead exposed only favorite/count, `聊天` and `添加` at card level.
- Clicking ordinary `测试角色生命周期 003 → 编辑` did not navigate. It expanded a full in-card editor on the unchanged `/zh-cn/sims` URL with avatar, name, role prompt, public intro, public identity, category controls, a World-editor link and `保存角色`. Closing it without changes collapsed the editor and left no Draft or route transition.
- Opening L1 by its card likewise kept `/zh-cn/sims` and produced an in-page Drawer with Chat, Remix and Add-to-World plus comments/rank/supporter surfaces. It had no Edit, Delete, More menu, stable href or object ID in exposed DOM attributes. Prior EVD-0185/0194 observed the same boundary for L2/Remix-003 and reload persistence.
- Result: the product exposes no user-discoverable edit/delete lifecycle for saved Character Remix clones. Because even normal edit is an inline card state rather than a stable URL, there is no visible route to reuse for a clone. Consequently the requested “delete intermediate Character Remix parent and observe descendants” experiment is `UNREACHABLE_IN_NORMAL_UI`; undocumented backend/direct routes remain `UNKNOWN` and were not guessed.
- Confidence: card-control contrast, inline normal editor schema, unchanged URL and Remix Drawer controls `VERIFIED`; hidden backend mutation API `UNKNOWN / NOT DISCOVERABLE`.

## EVD-0206 — Collection Member Removal Uses the Explicit Save Boundary

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; Collection `/zh-cn/collections/test-collection-001-g6wi/edit`, initially link-visible with two member Worlds.
- DOM/control inspection distinguished each member row's unlabeled `GripVertical` drag handle from its `Trash2` removal button. Clicking the first row's Trash removed `TEST Template World 001` only from the current editor: no native/web confirmation appeared, the counter changed `2/100 → 1/100`, and the removed World immediately reappeared in `我的世界` with `添加`.
- Clicking `保存合集` changed the CTA to `正在保存…`, then redirected to canonical detail `/zh-cn/collections/test-collection-001-g6wi`. Detail rendered `1 个世界` and retained only `TEST World 001`. A full detail reload preserved the count/member. Reopening edit preserved `1/100` and again exposed `TEST Template World 001` as an add candidate.
- Header notification unread count was 2 before and after the commit; no new Collection notification was produced in the tested owner flow. The transient success alert exposed the localized title `测试系列 001` but no separate action message in accessible text.
- Result: Collection member removal is a reversible edit-draft mutation until the shared explicit Save commit; it does not delete or mutate the underlying World and has no per-member confirmation. This is distinct from whole-Collection deletion.
- Confidence: control identity, no-confirm behavior, counter/candidate transition, save loading/redirect, detail/edit reload persistence and unchanged notification count `VERIFIED`; concurrent-editor conflict handling and non-empty whole-Collection delete remain `UNKNOWN`.

## EVD-0207 — Historical World Versions Are Expandable Logs but Not Navigable Snapshots

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; four-version World `/zh-cn/worlds/test-template-world-001-fv99`.
- The default `版本记录` rendered v4 latest, v3 and v2 plus `展开全部`. Clicking it kept the canonical URL unchanged and revealed v1/date, while the control changed to `aria-label="收起"`.
- Targeted descendant inventory of the expanded Version container found zero links and exactly one button, the collapse control. There was no version selector, per-version action, More menu, Share, Remix, Preview or historical-detail affordance on v1/v2/v3. Clicking `收起` hid v1 and restored `展开全部` without navigation.
- EVD-0188 already verified that the page-level Share composer and X intent encode only `https://worldos.cc/zh-cn/worlds/test-template-world-001-fv99`, with no version identifier. Combined result: Version History is an append-only readable changelog with expand/collapse; historical snapshots are `NOT DISCOVERABLE_IN_NORMAL_UI` for navigation, Share or Remix.
- Confidence: default/expanded/collapsed states, control/link inventory and unchanged URL `VERIFIED`; undocumented backend route existence `UNKNOWN` and intentionally not guessed.

## EVD-0208 — BYOK Rejects an Invalid Key Without Persisting It

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; Account → `世界模型` → BYOK provider panels.
- Entered the synthetic non-secret value `sk-test-worldos-blackbox-invalid-0208` and submitted the visible `测试并保存` action. The form returned the inline error `key 无效，请检查后重试。`; no provider/model was added.
- The field's `显示 key` / `隐藏 key` control switched the input between masked and plain-text rendering. Reload cleared both the invalid value and error, returned `测试并保存` to disabled, and left the model inventory unchanged.
- Four provider paths were visible: DeepSeek, 智谱 GLM, OpenRouter and a custom OpenAI-compatible gateway. DeepSeek and 智谱 GLM both mislabeled their credential field `OpenRouter API key`, although their placeholders, tutorials and model lists changed with the selected provider.
- No real credential, secret or paid provider request was used.
- Confidence: provider/control inventory, invalid-key error, reveal/hide behavior, reload clearing and label mismatch `VERIFIED`; valid-key success, encryption/storage, external billing and provider outage behavior `UNKNOWN`.

## EVD-0209 — Profile Avatar Upload Is a Hidden Image File Input but File Acceptance Remains Unverified

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; Account → Profile avatar control.
- DOM inspection identified a hidden `input[type=file][accept="image/*"]` behind the avatar action. No separate visible file-type/size guidance, crop schema or upload-error copy was exposed before file selection.
- The browser-control surface available during this probe could identify the input but did not expose a supported file-selection operation. The test stopped without bypassing the normal UI and without transmitting a local file. A disposable non-image fixture was prepared at `docs/research/worldos/evidence/invalid-avatar-upload.txt` but was not selected or uploaded.
- This is a research-tool limitation, not evidence that WorldOS upload is broken or unavailable.
- Confidence: hidden input and `accept=image/*` `VERIFIED`; file validation, size limit, crop/preview, persistence, deletion/reset and failure handling `UNKNOWN / TECHNICALLY_BLOCKED`.

## EVD-0210 — Profile Gift Settles at 70%, While Official-App and Repeat Gifts Hit Distinct Failure Gates

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; account energy initially 285.
- Official App `/zh-cn/apps/main-input`: selected the `星星 100` denomination and triggered final `送出` twice. Both attempts returned `礼物发送失败，请稍后重试。`; the modal retained the selected tier, energy stayed 285 and the Supporters surface remained empty.
- Creator Profile `Xadia` at `/zh-cn/profile/00f350c8-ac36-400d-8fb6-0d39c53202da`: the first `星星 100` submission succeeded with toast `礼物已送出，感谢你支持创作者！`; sender energy changed `285 → 185`.
- After reload, the recipient projection changed `打赏收入 700 → 770`, exactly 70% of the 100-energy gift, and `打赏榜 1 → 2` added `x161880 · 100⚡` linking back to the sender Profile.
- A second same-session 100 gift and a newly selected 20 gift both opened the `购买电量` modal instead of settling, even though the visible sender balance was 185. No further debit occurred.
- Result: one Profile gift completes the advertised 70/30 settlement and updates the public donor leaderboard; the tested official App rejects final settlement, while repeat Profile gifts hit an unexplained purchase gate. The black box cannot distinguish a one-gift/anti-abuse limit, stale balance check, product defect or another hidden rule.
- Confidence: first transaction/debit/payout/leaderboard and all tested failure surfaces `VERIFIED`; repeat-gift rule, App-recipient eligibility, notifications, rounding and refund semantics `UNKNOWN`.

## EVD-0211 — Save-Slot Expansion Costs 80 Energy and Immediately Creates a New Simulation

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; Hogwarts `/zh-cn/worlds/hogwarts-movie/new`.
- The full-slot state first showed `6 个存档位（已购 3）`. Triggering `增加存档位 · 80` charged `185 → 105`, increased capacity to `7 个存档位（已购 4）`, and immediately created Simulation `/zh-cn/sim/8be1f62d-bb93-4b0b-a411-afc53c4de15c`.
- Repeating from the next full-slot state charged `105 → 25`, increased capacity to `8 个存档位（已购 5）`, and immediately created `/zh-cn/sim/81886ace-9e29-4673-80a3-1e3da1792e16`.
- Capacity and purchased-count therefore advance atomically with the new Simulation; the expansion action is not a standalone inventory purchase requiring a second `Start` click.
- Confidence: two consecutive prices, capacity increments, purchased-count increments, energy deltas and automatic Simulation creation `VERIFIED`; maximum purchasable capacity, refund, concurrent creation and cross-World scope `UNKNOWN`.

## EVD-0212 — A Turn Can Overdraw a Positive Energy Balance Once, Then the Next Submission Is Blocked

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; Simulation `/zh-cn/sim/81886ace-9e29-4673-80a3-1e3da1792e16`, selected Deepseek at `8/回合`.
- Three ordinary Turns completed and persisted with exact account deltas `25 → 17 → 9 → 1`.
- At visible balance 1, the action composer remained enabled. Submitting a fourth 8-energy Turn optimistically advanced to Turn 4, produced a complete AI Story and cross-App state update, then committed the account balance as `-7`. Reload preserved both Turn 4 and the negative balance.
- At balance -7, the next composer was still initially enabled. Submitting a fifth action created no new generation and left the Simulation at Turn 4, then opened a blocking layer titled `电量用完了` with copy `本期每日免费电量已用完。领取满 24 小时后，下次上线将自动补充免费电量。` and controls `知道了`, `购买电量`, `免费赚电量 →`.
- After an external test-quota adjustment changed the account to 143, a fresh load of the same UUID showed Turn 4, no fifth action, an empty composer and no recurring blocker. Settings showed `电量 143`.
- Result: the tested preflight gate checks whether the current balance is already exhausted, not whether it covers the selected Turn price. One underfunded Turn can therefore overdraw a still-positive account; only the next submission is rejected. The rejected action is not persisted.
- Confidence: per-Turn deltas, durable negative balance, next-action block/copy/controls, rejected-action absence and post-top-up recovery `VERIFIED`; concurrency behavior, other models/App surcharges and backend intent `UNKNOWN`; classify as a high-value billing-boundary defect candidate.

## EVD-0213 — Character Chat Retains a Secret Through Turn 20 Without Visible Memory and Checkpoints Branch Independently

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; Remix Character Chat source `/zh-cn/sim/909c07cf-58bb-43d6-9211-aaf423c99a34`, initially Turn 1.
- Selected Deepseek at `4/回合`. At Turn 2 submitted a unique controlled fact: secret code `蓝钴-7319`, meaning `最喜欢的月亮颜色`, with an instruction not to mention it until asked. The Character acknowledged it and did not spontaneously repeat it during eight unrelated-topic Turns.
- At Turn 7 and Turn 10, Settings → Memory still showed `暂无记忆。每隔几轮会自动生成总结。`. At Turn 11, after nine intervening Turns, the direct recall question produced the exact answer `你的秘密代号是“蓝钴-7319”，代表你最喜欢的月亮颜色。` while the visible Memory panel remained empty.
- Continued with longer multi-paragraph topics through Turn 20. Events explicitly listed Turn 1–20; Memory remained empty at Turn 15 and Turn 20. Energy moved `143 → 139` on Turn 2 and reached `67` at Turn 20, exactly 19 charged Turns × 4. A direct reload restored 60 transcript paragraphs, the original secret, the Turn-11 recall and the latest Turn-20 response.
- Current-turn checkpoint creation opened a naming modal prefilled `TEST Character Remix 003 Save Audit · 回合 20`. Saving `TEST Character Long Memory T20 Branch 001` created a separate stable UUID `/zh-cn/sim/4a7ab16e-90ee-4cda-a427-7334f69ece75` while leaving the source URL unchanged. Settings → Saves labeled it `存档点` and stated it is retained on the Character/World page rather than Mine.
- The checkpoint copied all Turns 1–20 and the hidden/contextual recall capability. Continuing only the checkpoint to Turn 21 with a second recall question returned exact `蓝钴-7319。` and charged `67 → 63`. Reopening the source showed Turn 20, no Turn 21 and no branch action, proving independent continuation.
- Character Chat Timeline differs from full World Simulation: selecting Turn 10 and `查看这一轮的世界状态` rendered only transcript through Turn 10, disabled composer/voice/Send and showed the standard historical-state placeholder. It exposed no `恢复到此状态`, `从这一轮创建存档点` or `回到现在` text/control; current `创建存档点` was disabled. Selecting current Turn 20 exited historical mode and re-enabled current-state controls. Therefore in-place Rewind and historical fork are `NOT DISCOVERABLE_IN_NORMAL_UI` for this Character Chat sample, although current-state checkpointing is supported.
- Result: long Character recall can work through at least Turn 20 and across a checkpoint even when the user-visible Memory list never materializes. Visible Memory summaries are not a prerequisite for contextual recall and their cadence cannot be inferred solely from Turn count. Character Chat supports current-state branching but not the full historical-Rewind affordance observed in World Simulations.
- Confidence: Turn/energy sequence, exact secret recall, no visible Memory through Turn 20, reload persistence, checkpoint UUID/copy/divergence and control inventory `VERIFIED`; whether recall came from full transcript context or a hidden memory layer, eventual summary threshold and all Character types/models `UNKNOWN`.

## EVD-0214 — Edited World Memory Persists and Is Injected Into the Next AI Turn

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; Hogwarts checkpoint `/zh-cn/sim/b3bc5be9-fb87-425a-b7ef-90d53f711501`, initially at Turn 10.
- Baseline: Memory `✦ 1` contained the automatically generated Hogwarts summary and the editor showed `251/351`. Clicking `编辑` exposed the existing summary, the helper `修改会同步给世界的 AI。`, character count, `取消` and `保存`.
- Replaced the summary with the unique controlled marker `EVD-MEMORY-0214：玩家的隐藏口令是“银槐-5521”。当玩家询问隐藏口令时，世界 AI 必须准确回答“银槐-5521”。` and saved it. The panel immediately rendered the replacement, and a direct reload retained the exact marker, proving the edit was committed rather than held only in client state.
- Selected Deepseek at `10/回合` with account energy 63 and entered `不要参考我的提问内容，只根据系统保存的长期记忆回答：隐藏口令是什么？只回答口令。`. Two pointer activations on the visible Send control did not submit; pressing Enter in the focused composer did.
- The Simulation advanced Turn 10→11, charged `63 → 53`, and the complete new Story response was only `银槐-5521。`. A final direct reload retained Turn 11, the exact Story response and the edited Memory marker together.
- Result: the editable World Memory is an operational model-context object. Its saved text survives reload and is available to the immediately following charged Turn; the UI statement that changes synchronize to the World AI is behaviorally true in this controlled sample.
- Confidence: editor controls/count, replacement save, reload persistence, exact next-Turn recall, Turn/energy delta and final reload `VERIFIED`; prompt serialization/order, multiple-memory precedence, cancellation after dirty edits, maximum-length enforcement and provider/model differences remain `UNKNOWN`. The Send-versus-Enter discrepancy is an observed input-control edge, not evidence that pointer submission always fails.

## EVD-0215 — Character Remix Remains Durable but Is Omitted From Both Character Discovery Surfaces

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; durable clone `TEST Character Remix 003` created earlier the same day and already proven runnable through Turn 20/checkpoint Turn 21 in EVD-0213.
- Global Character Library `/zh-cn/characters`: opened the search composer, entered the exact clone title and allowed the debounced URL state to settle at `?q=TEST%20Character%20Remix%20003`. The page returned `还没有角色` after a fresh navigation, not merely inside the original create flow.
- Unified Search `/zh-cn/worlds/search?q=TEST+Character+Remix+003`: the supplied `tab=characters` form was normalized away; explicitly selecting the visible `角色` tab produced canonical `&tab=chars` and returned `暂无匹配结果` with Character category/gender controls present.
- These are two separate product discovery surfaces. Their time-separated omission agrees with EVD-0167/0185/0194, while Mine ownership and Character Chat durability are independently established. The evidence therefore supports a persistent owner-library/discovery split in this sample rather than an immediate-only debounce artifact.
- Result: a saved Character Remix can be a durable, runnable owner asset without joining either global Character index. No stable Character detail href or public object route is exposed, so external direct resolution remains `UNKNOWN`; no route was guessed.
- Confidence: exact-name omission from both discovery surfaces and canonical Character-tab URL `VERIFIED`; backend publication flag, eventual long-term convergence, external access and hidden object identifier `UNKNOWN`.

## EVD-0216 — Deleting a Non-Empty Collection Removes Its Projections but Preserves Member Worlds

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; disposable Collection `/zh-cn/collections/test-collection-nonempty-delete-001-37lq`.
- Created from `/zh-cn/collections/new` as `TEST Collection Nonempty Delete 001`, description `Disposable non-empty collection for final delete lifecycle audit.`, tags `test/delete/nonempty`, visibility `仅自己`, and one member `TEST Template World 001`. The editor changed `0/100→1/100`; `保存合集` entered `正在保存…` and redirected to the stable slug.
- Pre-delete detail localized the title/description, rendered `1 个世界`, the member card, `编辑合集`, Share/favorite and `删除合集`. Activating delete opened the same browser-native confirmation boundary seen in EVD-0182/0184. The first appearance was canceled; the Collection remained directly readable. A second activation was accepted by the user, after which the product navigated to `/zh-cn`.
- Post-delete direct detail and `/edit` URLs both returned the generic `404 / This page could not be found.` page. Exact browse search `/zh-cn/collections?q=TEST%20Collection%20Nonempty%20Delete%20001` returned `0 个合集`, `清除筛选` and `没有找到合集`.
- The owner Profile retained its `我的合集` section but no longer contained the deleted title or slug href. Thus detail, editor, discovery and owner-profile projections converge on deletion.
- The member World `/zh-cn/worlds/test-template-world-001-fv99` remained fully resolvable as public v4 with owner Edit/Delete, Continue/New Simulation, version log and its save. Its `收录这个世界的合集` section omitted the deleted Collection and retained another surviving Collection. Whole-Collection deletion therefore removes the membership edge and Collection object without cascading to World content or saves.
- The header showed 203 energy after an external test-quota top-up; Collection creation/deletion itself exposed no energy price or observed billing event.
- Result: non-empty Collection final deletion has the same no-undo object invalidation as the empty sample, plus verified non-cascade semantics for its member World and Profile/World reverse projections.
- Confidence: create/save, membership, native-confirm cancel preservation, user-mediated final acceptance, home redirect, detail/edit 404, exact-search removal, Profile removal, World survival and reverse-section cleanup `VERIFIED`; exact native confirmation copy, notification behavior, external cache timing and backend retention `UNKNOWN`.

## EVD-0217 — Avatar Upload Auto-Saves and Cache-Busts; Invalid MIME Silently Clears the Avatar

- Time: 2026-08-24 (Asia/Shanghai), authenticated disposable test Profile `x161880`; Account `/zh-cn/account` and public Profile `/zh-cn/profile/895fa29b-8b4a-4e01-9275-ef4c2b72c1f2`.
- Entry contract: Account contains one hidden, single-file `input[type=file][accept="image/*"]` plus two visible `上传头像` buttons (avatar overlay and text CTA). Directly clicking the hidden input through automation did not open a chooser; the visible text button opened the normal file chooser. The chooser reported `isMultiple=false`.
- Valid upload 1: selected a benign generated 512×512 SVG (`avatar-test-0217.svg`). No crop, preview modal, confirmation, progress copy or toast appeared. Upload auto-committed without clicking `保存资料`; the file input immediately reset to no selected file.
- The Account avatar rendered a complete 512×512 resource at the fixed public path `.../avatars/895fa29b-8b4a-4e01-9275-ef4c2b72c1f2/avatar.svg?v=380007&width=256&quality=75&resize=contain`. Reload retained the same URL/dimensions. Public Profile rendered the same resource in three avatar projections, proving immediate public propagation.
- Valid replacement: selected a generated 640×640 SVG (`avatar-test-0217-replacement.svg`). The storage object name stayed `avatar.svg`, but the cache-busting query changed `v=380007→76090`; no explicit Save or crop step appeared. The rendered intrinsic size changed to 640×640.
- Invalid MIME: through the same visible chooser, selected a benign `.txt` fixture. The file selection call itself succeeded even though the input advertises `image/*`. There was no visible error/alert/toast and no relevant console error. The input cleared, but the prior avatar `<img>` disappeared immediately. Reload preserved a generic `UserRound` fallback, and the public Profile had zero matching avatar images plus fallback icons. Thus invalid-type handling silently cleared/unset the existing avatar instead of rejecting while preserving it.
- Recovery: uploading the valid replacement SVG again restored the fixed `avatar.svg` resource with a new `v=489661`; Account reload and all three public Profile projections loaded the 640×640 image. The test account was not left in the broken/default state.
- Result: avatar selection is an immediate auto-save/replace transaction with fixed per-user object path and client cache versioning. SVG is accepted. No user-facing crop or validation surface was observed. Invalid MIME has a reproducible destructive-silent fallback defect: it clears an existing avatar without an error and without requiring `保存资料`.
- Confidence: chooser/cardinality, valid SVG acceptance, no explicit save/crop/toast, fixed path/version change, reload/public propagation, invalid-file silent clear/default fallback and valid recovery `VERIFIED`; PNG/JPEG normalization, size/dimension limits, EXIF/orientation, transparency, network failure, concurrent upload and deliberate Remove/Reset control remain `UNKNOWN`.

## EVD-0218 — Owner App Market Finds a Relisted App That Unified Search and External Discovery Omit

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; App `/zh-cn/apps/test-app-first-publish-001` after its usage-gated downlist→republish lifecycle.
- Direct-detail precondition: the owner detail is live and public at v2, renders the V2 online preview, exposes Edit/Delete/Install, reports `4 个世界在用`, and lists four dependent Worlds (two owned by `x161880`, two by Account B). EVD-0190 independently established that Guest and Account B direct URL/hard reload also recovered after republish.
- Owner App Market `/zh-cn/apps`: exact title `TEST App First Publish 001` returned the App card with `by x161880 · 4 个世界在用`, description, `系统/社区` tags, Favorite and Install. Thus the relisted App is currently discoverable to its owner in the dedicated Market. Searching its slug `test-app-first-publish-001` instead returned `没有结果`, establishing that Market search matches visible metadata/title rather than the URL slug in this sample.
- Owner Unified Search `/zh-cn/worlds/search?q=TEST+App+First+Publish+001&tab=apps`: after the result state stabilized, the App tab returned `暂无匹配结果`. A same-session control query `主输入框` on the same App tab immediately returned the official `主输入框` card and `没有更多啦`, proving the unified App-search surface itself was functioning.
- Cross-identity delta: EVD-0190 reports that Account B and Guest could open the republished direct detail but could not find it by exact title or slug in App Market or Unified Search. Combined with the current owner result, dedicated-Market discovery is identity-dependent for this sample, while Unified Search omission is shared even by the owner.
- Result: direct resolvability, App Market discovery and Unified Search inclusion are three distinct observable projections. Republish can restore direct public access without forcing all discovery projections to converge; the owner Market can expose a card that external Market viewers and the owner Unified Search still omit.
- Confidence: owner title/slug Market results, owner Unified Search empty state, official control result and live detail/version/usage projections `VERIFIED`; external direct/discovery delta `EXTERNAL_BLACKBOX_REPORTED` via EVD-0190. Exact backend eligibility rule, moderation/downlist residue, cache partition and convergence SLA remain `UNKNOWN`.

## EVD-0219 — Permanently Deleted Simulation Eventually Disappears from All Owner Indexes

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; follow-up to the 2026-08-23 final deletion in EVD-0129.
- Target: `TEST App v4 Simulation 001`, former UUID `/zh-cn/sim/26faf299-fb09-42fe-b60b-4e0525a48427`, deleted through the World save-list modal `确认永久删除该存档？`.
- Mine `/zh-cn/sims` → `历史`: neither the title nor UUID appeared among the current World History cards. The result was checked after opening the actual History tab, not only the default Works view.
- Global sidebar `历史`: neither the title nor UUID appeared in the current recent World Simulation links. Other surviving saves remained present, so the absence is not an empty/loading artifact.
- Source World `/zh-cn/worlds/test-map-world-001-gytp`: `你的存档` remained populated with six current records, but omitted the deleted title/UUID. `继续模拟` targeted a surviving save (`b64fd305-...`) rather than the deleted record.
- Direct former UUID still rendered only `404 / This page could not be found.`. That route exposed no product Back, Undo, Restore, navigation shell or recovery action in its accessible DOM.
- Result: normal permanent Simulation deletion eventually converges across the source World save list, Mine History, global sidebar history and direct resolution. This is distinct from the broken-App dependency case, where indexes intentionally retained a temporarily unresolvable save and later recovered the same UUID after a clean World publish.
- Confidence: current cross-index omission, surviving-list controls/retargeting and bare 404/no-recovery state `VERIFIED`; exact immediate cleanup latency, browser/device caches and backend retention remain `UNKNOWN`.

## EVD-0220 — Pax Historia Is a Localized Competitor-Landing Route With a Curated World Feed

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner; newly followed route `/zh-cn/pax-historia`, linked from the World-detail Similar section as `更多类似 Pax Historia 的战争与大战略游戏 →`.
- This is a dedicated SEO/competitor-comparison landing page inside the ordinary WorldOS shell, not a World, App or Simulation object. The document title is `Pax Historia` and the hero describes WorldOS as a free browser alternative for AI war/grand-strategy play.
- Comparison surface: a three-column `Pax Historia vs WorldOS` table compares Type, Content and Price. Treat its competitor and community statements as marketing copy, not independently verified product facts.
- Discovery feed: `类似 Pax Historia 的战争与大战略游戏` contains 22 normal World cards in the observed render. Cards reuse standard World behaviors and metadata: creator, usage/rating counts, Map badge (mostly `🗺️`, one grid-map `🔶`), `改编`, `立即开始` and canonical `/zh-cn/worlds/{slug}` links. The set mixes official World101 Worlds and community Worlds.
- Navigation: the hero `在 WorldOS 免费玩` is an in-page anchor; triggering it changed the URL to `/zh-cn/pax-historia#worlds` and exposed the curated feed. `浏览所有世界 →` and the bottom `在 WorldOS 免费玩` both link to `/zh-cn/worlds`.
- FAQ: five static question/answer blocks cover free alternative, browser/App framing, community, similar games and token/24-hour-free-energy positioning. They are rendered as text blocks rather than accordion buttons in the accessible DOM.
- Result: WorldOS has at least one non-navigation landing route that curates existing Worlds around an external competitor/query intent. Product parity therefore includes content-led acquisition pages and their reuse of standard World cards, not only the core app IA.
- Confidence: route/title, entry path, comparison schema, 22-card feed, CTA href/hash behavior, FAQ count/static rendering and card controls `VERIFIED`; SEO generation strategy, personalization, update cadence and additional sibling landing routes `UNKNOWN`.

## EVD-0221 — Deleting a Published World Invalidates Its Child Simulation Runtime but Leaves Mutable Orphan History Metadata

- Time: 2026-08-24 (Asia/Shanghai), authenticated owner `x161880`; disposable published World `/zh-cn/worlds/test-map-install-audit-001-qp49` (`TEST Map Install Audit 001`).
- Controlled dependency: before deletion, the World detail exposed one child save named `TEST World Delete Child Save 001`, stable UUID `/zh-cn/sim/5d1fd9df-df53-4bf1-96c1-436c6504b99b`, Turn 1. Starting it consumed the ordinary World opening cost `203 → 195`; the complete opening Story was `雨点。`. The World detail exposed `继续模拟 · 1 回合` targeting that UUID, and exact Unified Search returned the World before deletion.
- Owner `删除世界` opened a browser-native confirm. Earlier appearances were canceled/left unaccepted and preserved the World; the final user-mediated acceptance redirected the active tab to `/zh-cn/worlds`. No product Undo/Restore entry was offered.
- Immediate object invalidation: the canonical World detail, `/edit`, and `/new` routes all returned the bare `404 / This page could not be found.` surface. The child Simulation's stable UUID also returned the same bare 404. The World delete therefore cascaded to runtime resolvability of the dependent save rather than leaving it playable as a detached snapshot.
- Immediate discovery/ownership cleanup: exact Unified Search on the World tab returned `没有结果`; Mine → Works → World omitted the deleted card; the owner Profile's `我的世界` omitted it and showed five current created Worlds. The remaining Worlds, Collections and Apps stayed present. Energy remained 195, so deletion itself exposed no debit/refund in this sample.
- Projection split: Mine → History still rendered the child save card after fresh navigation and later reloads, with original World slug, Turn 1, date, direct UUID href and `更多 → 重命名 / 删除`. The card link targeted the now-404 UUID. The global History content exposed through the same owner shell likewise retained the orphan row.
- Orphan mutation test: `更多 → 重命名` opened the ordinary rename sheet with the old title prefilled. Saving `TEST Orphaned Child After World Delete 001` initially left the visible card stale, then the list updated. Reload persisted the new orphan title, removed the old title and retained the same dead UUID href. Thus the history metadata record remains writable after the underlying Simulation runtime is no longer resolvable.
- Result: published-World deletion is not a single atomic purge across all projections. World/public/editor/start/search/Works/Profile projections and the dependent Simulation runtime invalidate immediately, while a separate owner-history metadata record survives, remains mutable and points to a dead UUID. This differs from ordinary explicit Simulation deletion, which eventually removes Mine/sidebar history (EVD-0219), and from an App-dependency outage, where a retained UUID can later recover after World cleanup.
- Confidence: pre-delete dependency, native-confirm boundary, final redirect, World detail/edit/new 404, child UUID 404, Search/Works/Profile removal, unchanged energy, orphan History persistence and post-delete rename/reload persistence `VERIFIED`; orphan-record manual deletion, eventual retention duration, cross-device behavior, backend tombstone structure and administrative recovery `UNKNOWN`.

## EVD-0223 — Orphan History Delete Finally Removes the Dead Metadata Row

- Time: 2026-08-24 (Asia/Shanghai), same authenticated owner session, following EVD-0221.
- Action: On `/zh-cn/sims`, the surviving row `TEST Orphaned Child After World Delete 001` was opened through `更多 → 删除`. The product rendered its in-page confirmation state (`删除` / `确认永久删除该存档？` / `取消` / `删除`); this was not a browser-native dialog. The user accepted the final delete action.
- Immediate result: the orphan row disappeared from Mine → History. No visible product Toast, Undo, Restore or recovery affordance appeared. The page remained on `/zh-cn/sims`.
- Persistence check: after a full page reload, the orphan title and dead UUID were still absent from History; the same owner shell's global History projection also no longer exposed the row.
- Former runtime check: direct navigation to `/zh-cn/sim/5d1fd9df-df53-4bf1-96c1-436c6504b99b` still rendered the generic bare `404 / This page could not be found.` surface, with no recovery control.
- Result: the remaining Delete action on a World-delete orphan cleans the denormalized History metadata row and does not resurrect the runtime. This closes the manual-cleanup part of OQ-0044 for the tested session; long-term retention before manual cleanup, cross-device propagation, backend tombstone structure and administrative recovery remain `UNKNOWN`.
- Confidence: orphan confirmation type, accepted deletion, immediate row removal, reload persistence, no Undo/Restore UI and former UUID 404 `VERIFIED`.

## EVD-0222 — PNG and JPEG Avatars Auto-save, Propagate Publicly and Preserve Their File Extension

- Time: 2026-08-24 (Asia/Shanghai), authenticated test Profile `x161880`; Account `/zh-cn/account` and public Profile `/zh-cn/profile/895fa29b-8b4a-4e01-9275-ef4c2b72c1f2`.
- Fixtures were locally generated, non-sensitive 640×640 images containing only `TEST 0222`: `avatar-test-0222.png` (5,164 bytes) and `avatar-test-0222.jpg` (15,170 bytes). The visible `上传头像` CTA opened the normal single-file chooser in both runs.
- PNG: replacing the existing SVG immediately changed the Account resource from `.../avatar.svg?v=489661...` to `.../avatar.png?v=630753...`. No crop/preview, explicit Save, success toast or visible error appeared. Account reload retained the exact PNG URL; public Profile exposed the same PNG resource in all three avatar projections.
- JPEG: replacing PNG with the JPEG fixture immediately changed the object to `.../avatar.jpg?v=29859...`, again without crop/Save/toast. Account reload retained it and all three public Profile projections used the same JPG resource.
- Recovery/cleanup: the known-valid 640×640 SVG fixture was uploaded again. The resource changed to `.../avatar.svg?v=887418...`; Account reload retained it, so the test Profile was returned to the established SVG baseline rather than left with a format-probe image.
- Result: accepted avatar formats are not normalized to one storage extension; the current upload replaces the per-user object with an extension corresponding to SVG/PNG/JPG while cache-busting with a new `v`. PNG and JPEG share the same immediate auto-save/public-propagation contract already observed for SVG.
- Confidence: benign PNG/JPEG acceptance, single-file chooser, automatic replacement, extension-preserving public resource, Account/Profile reload propagation, no crop/Save/toast and SVG recovery `VERIFIED`; WEBP/GIF, file-size/dimension/aspect/transparency/EXIF-orientation limits, network failure and deliberate Remove/Reset remain `UNKNOWN`.

## EVD-0224 — WEBP/GIF, Wide PNG and EXIF-JPEG Avatar Boundaries

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner Account `/zh-cn/account`; all fixtures were local, benign, non-sensitive images and the established SVG fixture was restored afterward.
- Fixtures: lossless WEBP (`avatar-test-0224.webp`), animated two-frame GIF (`avatar-test-0224.gif`), 1200×300 wide PNG (`avatar-test-0224-wide.png`), and JPEG carrying EXIF Orientation=6 (`avatar-test-0224-exif6.jpg`).
- WEBP: selecting through the visible `上传头像` button immediately replaced the avatar with a public resource ending `avatar.webp?v=...`; no crop, preview, explicit Save, success toast or error appeared.
- GIF: the animated GIF was accepted and stored as `avatar.gif?v=...`, with the same automatic replacement/no-feedback behavior. Whether animation is preserved in every public rendering surface is `UNKNOWN`; the object path and accepted upload are `VERIFIED`.
- Wide PNG: 1200×300 (4:1) input was accepted and stored as `avatar.png?v=...`; no aspect-ratio warning, crop UI or rejection appeared. The rendered `/width=256&resize=contain` URL is consistent with display containment, but server-side pixel transformation is not inferred.
- EXIF JPEG: JPEG with Orientation=6 was accepted and stored as `avatar.jpg?v=...`; no orientation warning or metadata disclosure UI appeared. Whether pixels are normalized or the EXIF tag is retained is `UNKNOWN` because the public transformed resource was not downloaded for binary inspection.
- Recovery: the known-valid SVG fixture was uploaded again and the Account resource returned to `avatar.svg?v=...`, confirming the test profile was restored to its prior SVG baseline.
- Result: the tested accepted-format set now includes SVG, PNG, JPEG, WEBP and GIF. The upload contract is permissive and format-preserving at the object-path level, with immediate auto-save and no visible success/error state. Size upper bound, transparency, malformed/animated rendering, network failure and deliberate Remove/Reset remain open.
- Confidence: upload acceptance, format-preserving extension, auto-save and SVG recovery `VERIFIED`; animation/frame rendering, EXIF normalization, server-side dimensions and upper-size limits `UNKNOWN`.

## EVD-0225 — Character Remix Owner-Library Drawer Has No Edit/Delete or Stable URL

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; `/zh-cn/sims` → `作品` → `角色` → `我创建的`.
- Target: existing durable clone `TEST Character Remix 003`, previously created from the Character Remix flow and present after reload.
- Mine card: the clone is represented as a button rather than an anchor. Its card exposes `聊天` and `添加`; unlike ordinary owned source/World-local Character cards, it exposes no `编辑` button and no Delete/More control.
- Detail: clicking the card opens an in-page detail Drawer while the URL remains `/zh-cn/sims`. The Drawer shows title, copied summary, owner Profile link, Follow/Favorite, Comment/排行榜/支持者 tabs, `聊天`, `改编` and `添加到世界`. It exposes no stable Character URL, edit form, delete action, source attribution or parent link. The page body has no `删除` text for the clone.
- Result: this recheck confirms the clone's durable owner-library presence and runnable/social controls are separate from normal source management. In the tested build, Character Remix copies are not owner-editable or owner-deletable through the normal Mine/Drawer UI, and their detail is not addressable by a stable public URL. This is a UI reachability boundary, not proof that no backend mutation exists.
- Confidence: Mine persistence, button-vs-anchor representation, Drawer route, available/absent controls and absent attribution `VERIFIED`; hidden route/API, intermediate-parent deletion and backend lifecycle `UNKNOWN`.

## EVD-0226 — Narrow World Preview Is Read-Only, While World and Character Chat Are Charged AI Turns

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; current in-app browser shell reported `innerWidth=518`, `innerHeight=546`.
- World detail: `/zh-cn/worlds/hogwarts-movie` initially exposed a collapsed `预览` button. Activating it expanded an in-page panel containing the opening World card, linked collection/related Worlds and `改编`; it did not navigate, expose a composer or create a Simulation. The panel was therefore inspected as a read-only conversion preview. The page retained the normal World controls (Continue/New Simulation, collection, gift, characters, Apps, version log, saves and comments).
- World Simulation: `/zh-cn/sim/b3bc5be9-fb87-425a-b7ef-90d53f711501` began at Turn 11 with the main-input composer enabled and energy `195` in the Settings panel. Filling `你要做什么？` and clicking the separate `发送` control generated a new multi-paragraph Story response and four refreshed next-action suggestions; the save advanced to Turn 12. No navigation occurred and the input reset to empty after completion.
- World-local Character Chat: opening the `💬 聊天` App and selecting the existing `赫敏·格兰杰` thread exposed a transcript, a separate `输入消息…` composer and an unlabeled Send button. Sending `我记得你说过时间旅行很复杂，但我想知道你是否相信我。` advanced the same save to Turn 13 and appended the user message plus a multi-paragraph Hermione response. The response referenced the prior secret/conversation and corrected the premise, demonstrating actual contextual character dialogue rather than a static preview.
- Cross-surface state: the Settings panel after both operations showed Turn 13 and `电量 175`; the two charged operations therefore consumed 20 energy in this sample. Story, the Chat transcript and the current save remained visible after switching panels. No separate Character Chat Simulation UUID was created because this was the World-local Chat App in an existing World Simulation.
- Result: World detail Preview is a non-mutating read-only funnel, while World main input and World-local Character Chat share the same Turn engine/save and both generate persistent AI output. Character Chat uses a distinct fill-then-explicit-Send interaction and can carry context from earlier messages into its response.
- Confidence: preview expansion/no-navigation/no-composer, World Turn 11→12, Character Chat Turn 12→13, transcript response/context and energy 195→175 `VERIFIED`; exact per-App billing split, provider prompt serialization and viewport behavior below/above this shell remain `UNKNOWN`.

## EVD-0227 — A 20-Energy Gift to a Different Creator Settles at 70% and Expands the Donor Leaderboard

- Time: 2026-08-25 (Asia/Shanghai), authenticated sender `x161880`; recipient Profile `World101` at `/zh-cn/profile/6d0cdd49-7cbe-49b0-8d87-c4d248360881`.
- Before final submission, the sender balance was `175`, the recipient Profile showed `打赏收入（电量） 14,140`, and `打赏榜 5`. The visible top-five donor rows did not include `x161880`.
- The gift modal was opened from `送礼`, the lowest denomination `火花 20` was selected, and the final CTA became `送出 · 20⚡`. The user accepted the final transaction action.
- After settlement, the sender header balance was `155`, the recipient projection was `打赏收入（电量） 14,154`, and the section became `打赏榜 6`. A new donor row `x161880 · 20⚡` linked to the sender Profile.
- Exact deltas are therefore sender `-20`, recipient visible income `+14`, donor count `+1`; this independently reproduces the advertised 70% creator share at the minimum tier and with a different recipient from EVD-0210.
- The earlier same-recipient repeat gift that opened `购买电量` is not a global one-gift-per-account or session-wide ban: after quota/session changes, the same account could gift a different creator successfully. Whether repeats to the same recipient are recipient-scoped, time-limited, anti-abuse gated or defective remains `UNKNOWN`.
- Confidence: pre/post sender balance, recipient-income delta, leaderboard-count delta and linked donor row `VERIFIED`; toast lifetime, recipient notification, same-recipient repeat policy, App-recipient eligibility, rounding at denominations whose 70% is non-integer and refunds remain `UNKNOWN`.

## EVD-0228 — Explicit 360px/844px Viewports Verify Mobile Simulation, Creator Preview Models and Orientation Switching

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner. Browser viewport capability was explicitly set to `360×844`, then `844×360`, and reset to the default `1280×720` after the experiment.
- Portrait Simulation `/zh-cn/sim/b3bc5be9-fb87-425a-b7ef-90d53f711501`: page metrics were `innerWidth=360`, `innerHeight=844`, `scrollWidth=360`, `scrollHeight=844`. The responsive shell retained Events/Memory/Advisor/Settings, Story, suggestions, main composer, Timeline, App Dock and Add App. Settings opened as a full-viewport `360×844` dialog with the complete settings/action list rather than a clipped desktop sheet.
- Portrait Chat App: the Character list, `赫敏·格兰杰` thread, transcript, image action, `输入消息…` textarea and explicit Send control were reachable. The textarea measured 254×100 and the Send control 44×44; filling it focused the textarea and enabled Send without document overflow. The emulated visual viewport remained 360×844 because this browser override does not emulate a real software keyboard.
- A real narrow-screen Character Chat action `这是 360 像素移动端输入测试：请用一句话说明当前我们在讨论什么。` completed, advanced the same save `Turn 13→14`, generated a context-correct Hermione answer plus updated Story, and changed energy `155→145`. The controls were disabled during generation and re-enabled after completion.
- Creator `/zh-cn/worlds/test-map-world-001-gytp/edit` at 360×844 rendered the mobile header `菜单` and bottom navigation while preserving the long-form Creator controls, live Preview and Publish/Danger sections. Metrics were `scrollWidth=352`, `innerWidth=360`, with vertical length 5,183 and no page-level horizontal overflow. The mobile side menu opened as a 256×844 overlay and could be dismissed from its own close control.
- Creator Preview device selector exposed three real modes: `自由沙盒 · 电脑版`, `自由沙盒 · 手机版`, `开局设置`. Desktop Preview uses an internal 1280×800 iframe scaled to the available 318×198.75 container; Mobile Preview uses a 390×780 iframe scaled to 318×636. `开局设置` replaces the runtime iframe with a setup preview containing `设置你的角色与世界`, optional save-name input and `立即开始`. The test restored Desktop Preview afterward and did not publish or mutate Draft fields.
- Same-tab leave/return recovery: navigating from the Turn-14 Simulation into Creator and then Browser Back restored the same UUID at Turn 14 with generated Story/suggestions and `scrollWidth=360`; the responsive viewport and persistent runtime state therefore survive ordinary route transitions in this sample.
- Landscape `844×360`: the same Simulation changed from the portrait single-panel/Dock shell to a desktop-style multi-panel layout exposing main input, Story, Newspaper iframe, Character State, Chat, Movie, Wallet and Shop in one render. Page metrics were exactly `scrollWidth=844`, `scrollHeight=360`; Turn 14 remained unchanged.
- Result: responsive behavior is breakpoint-dependent and Creator Preview explicitly models 1280×800 versus 390×780 devices. Portrait input/generation, route-return persistence and landscape layout switching are now real observations. A desktop viewport override does not reproduce OS touch events, software-keyboard resizing, safe-area/notch insets or background suspension, which remain `UNKNOWN` rather than failed.
- Confidence: all reported viewport dimensions, overflow metrics, reachable controls, full-screen Settings, Character Chat Turn/charge, Creator device-mode dimensions, setup Preview, route-return state and orientation switch `VERIFIED`; touch-only gestures, real IME/keyboard occlusion, safe-area cutouts and OS background/multitask lifecycle `UNKNOWN / DEVICE-BOUND`.

## EVD-0229 — Community App Preview Resets Local State; App Gift Failure Has a Nonuniform Debit Outcome

- Time: 2026-08-25 (Asia/Shanghai), authenticated sender `x161880`; community App `微博` at `/zh-cn/apps/weibo`, creator `World101`.
- Detail surface: the public App page exposed `送礼`, `安装`, rating, an initially empty App-specific `打赏榜`, `在线试玩`, `重置预览`, comments and Worlds-in-use. Preview tabs `推荐`, `热搜` and `我的` were interactive; `热搜` rendered a ranked list plus `暂无内容`, while `我的` rendered zeroed counters and `你还没有发过微博`.
- Preview mutation/reset: activating `分享新鲜事...` expanded a textarea and Send control. Submitting the benign preview-local text `TEST Preview Post 001：仅用于 WorldOS 在线试玩状态重置验证。` added a top `我 / me · 刚刚` post with repost/comment/like controls. Host-level `重置预览` removed the test post and restored the seeded initial feed. No Simulation, Turn or public external social post was created.
- Gift attempt: before the final gift action, the sender header showed `145`; the App supporter panel was empty. Selecting `火花 20` enabled `送出 · 20⚡`, and the user accepted the final transaction action. The product returned `礼物发送失败，请稍后重试。`; the App leaderboard stayed empty and creator Profile `World101` stayed at `打赏收入 14,154` / `打赏榜 6`, with no new donor row beyond the earlier Profile gift.
- Debit anomaly: a later same-sequence balance observation showed `140`, a net `-5` from the pre-attempt value despite the visible failure and absence of recipient/App projections. No other charged Turn, slot purchase or successful gift occurred between those two balance observations. This is a strong temporal association, but black-box evidence cannot yet distinguish an App-gift fee, partial debit, unrelated asynchronous adjustment or a defect.
- Independent comparison supplied by the user: a subsequent gift attempt on another App also displayed the same failure, followed immediately by a successful World gift. The complete later sequence changed the previously observed `140` to `120`, exactly matching only the successful 20-energy World transfer verified in EVD-0230. Thus the second App failure had no observable net debit; App-failure billing is not consistently the `-5` seen in the first sample.
- Confidence: App controls, preview post/reset, first failure toast, unchanged App/recipient projections and observed `145→140` balance sequence `VERIFIED`; exact cause of the `-5` and whether it would refund later `UNKNOWN / DEFECT-CANDIDATE`. The second unnamed-App failure is `USER-OBSERVED / CORROBORATING`, with its aggregate balance boundary independently verified in EVD-0230.

## EVD-0230 — Same-Session World Gift Succeeds While App Gifts Fail

- Time: 2026-08-25 (Asia/Shanghai), authenticated sender `x161880`; World `/zh-cn/worlds/simulador-de-romance-en-hogwarts-062v`, creator `/zh-cn/profile/a7208443-6f8b-4595-86e9-a1276b3150c1` (`Paulina Fernandez-a72084`).
- User action sequence: after a second App gift displayed `礼物发送失败，请稍后重试。`, the user selected the minimum 20-energy gift on this World and completed it. The previously verified sender balance was `140`; after both actions the live header showed `120`.
- World projection: the World detail showed `打赏榜`, `1 位支持者`, total sent `20`, and a linked `#1 x161880 20` row. Creator Profile showed `打赏收入（电量） 14`, `打赏榜 1`, and linked `x161880 · 20⚡`.
- Exact successful ledger: aggregate sender delta `140→120` is `-20`; the World recipient projection is `+14`, exactly 70% of the face value, and both World-level and Profile-level donor projections agree. Because the same account could complete this World gift immediately after two App failures, the current App failures are not explained by account login, insufficient balance, or a site-wide gift outage.
- Same-creator isolation: the failed `微博` App is owned by `World101`, whose Profile accepted and settled a 20-energy gift earlier in EVD-0227. The creator account itself is therefore demonstrably gift-eligible; the failure boundary is narrower than sender wallet or creator eligibility and points to the App object/settlement path.
- Result: World and Profile gifts share the verified 70% creator settlement model, whereas App recipients can reject the same denomination in the same authenticated wallet/session. App-object eligibility/configuration must therefore be modeled separately from the global gift wallet and creator account.
- Confidence: current sender balance, World donor total/count/row, creator income/count/row and 70% arithmetic `VERIFIED`; the identity of the second App and its exact immediate pre/post balance are `USER-OBSERVED`, so transient debit/refund inside that failed attempt remains `UNKNOWN`.

## EVD-0231 — World Unlisted and Private Controls Are Real but Entitlement-Gated Before State Mutation

- Time: 2026-08-25 (Asia/Shanghai), authenticated free test account; existing owner editor `/zh-cn/worlds/test-map-world-001-gytp/edit` (public World, editor header `发布 v12`).
- Visibility control inventory: the World Creator exposes three peer buttons under `可见性`: `公开`, `不公开列出 会员`, and `私有 会员`. The existing selected state was visually `公开` (`border-primary bg-primary/5 text-primary`); the two member states used the unselected border style.
- `不公开列出`: clicking the enabled control did not select it. It opened an in-page pricing dialog headed `把世界设为非公开是会员功能`. The dialog included `一次性` / `订阅` / `自备 API`, domestic/international payment switching, Explorer/Voyager/Legend subscription cards and copy `把你的世界和角色设为非公开`. No payment control was submitted; `取消` closed the dialog.
- `私有`: after closing the first dialog, clicking the enabled `私有 会员` control opened the same pricing dialog with the same heading and entitlement copy. Cancelling returned to the editor.
- Post-condition: after both attempts and cancellation, `公开` remained the visually selected control; neither gated click visibly changed the Draft visibility. The editor already had unrelated unpublished changes before this experiment, so no inference is made from the generic pending-Draft banner.
- Result: Unlisted and Private are user-visible World states, but a free owner is intercepted before selection/persistence/publication. The missing external Direct/Search/Start/Remix matrix is therefore `ENTITLEMENT_BLOCKED`, not evidence that these states do not exist. Obtaining the matrix requires an already-entitled disposable owner plus Guest/non-owner viewers; this investigation must not purchase membership.
- Confidence: three controls, selected styling, both real clicks, identical membership dialog, dialog contents/cancel and unchanged selected state `VERIFIED`; persistence, publication, external enforcement, downgrade expiry and Public→non-public effects on existing Simulations `UNKNOWN / ENTITLEMENT-BLOCKED`.

## EVD-0232 — Character Memory Materializes After Turn 21, Is Editable Model Context and Isolated Per Branch

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; source Character Chat `/zh-cn/sim/909c07cf-58bb-43d6-9211-aaf423c99a34` (`TEST Character Remix 003 Save Audit`) and existing T20 checkpoint `/zh-cn/sim/4a7ab16e-90ee-4cda-a427-7334f69ece75`.
- Starting boundary: EVD-0213 had already verified the source at Turn 20 with `暂无记忆。每隔几轮会自动生成总结。`. The current run opened the same source at Turn 20 with account energy `120`, completed one unrelated Turn and inspected Memory at Turn 21; it was still empty with the same copy. Energy was `116`.
- Turn 21→25 continuation: five source Turns were completed from T20 to T25 using unrelated prompts about paper-photo preservation, receipt classification, a blackout scene, plant labels and a second secret recall. Energy changed `120→100`, exactly five Turns × `4/Turn`. At Turn 25 the response still recalled the original transcript-only secret `蓝钴-7319` / favorite moon color exactly.
- First visible summary: opening Memory at Turn 25 now showed one editable paragraph rather than the empty state. It summarized the Character/user relationship, retained `蓝钴-7319` and enumerated conversation topics from the initial secret through the Turn-23 blackout scene. It did not mention the newer Turn-24 plant-label topic or the Turn-25 second recall, proving a tail lag in the visible batch summary. Exact generation trigger is bounded after the Turn-21 empty check and by the Turn-25 inspection, not known to be a fixed four-Turn cadence.
- Persistence: reloading the source retained the same summary text and energy `100`.
- Edit/injection experiment: `编辑` changed the paragraph into a textbox with `取消` / `保存`. The original summary was preserved and appended with a unique contradiction that existed nowhere in the transcript: `最新有效秘密代号已改为“橙铜-8842”...旧代号“蓝钴-7319”已经失效`. Saving returned to the read view; reload retained the exact appended marker.
- Turn 26 model effect: the next prompt explicitly asked for the latest valid code without listing the old code. The response was `橙铜-8842` / favorite sun color, exactly following the Memory-only edit over the older transcript. Energy changed `100→96`, so the six Turns from T20→T26 cost `24` total at `4/Turn`.
- Post-Turn persistence: before and after another reload, the edited summary still contained both the original automatic paragraph and the appended `橙铜-8842` instruction; it was not immediately overwritten by automatic regeneration.
- Branch isolation: the pre-existing T20 checkpoint, previously continued independently to T21, was opened after the source Memory generation/edit. Its Memory still rendered `暂无记忆。每隔几轮会自动生成总结。` and contained neither `蓝钴` nor `橙铜`. Source Memory generation and edit therefore did not propagate across the checkpoint branch; Memory is save/branch-scoped in this sample.
- Result: Character Chat has two distinct context mechanisms over time: long transcript/hidden context can recall before visible Memory exists, then a batched editable summary appears later. The visible summary is durable, injected into subsequent AI context, can override conflicting transcript facts, and diverges independently per checkpoint/save.
- Confidence: T21 empty state, T25 summary/content cutoff, original-secret recall, edit form/save/reload, Memory-only conflicting-marker response, exact six-Turn `120→96` billing and branch empty-state isolation `VERIFIED`; exact automatic-summary cadence, token threshold, merge/overwrite policy on later batches, maximum length and non-Remix/model generality `UNKNOWN`.

## EVD-0233 — Manual Character Memory Survives Five Further Turns Without Automatic Merge or Overwrite

- Time: 2026-08-25 (Asia/Shanghai), immediate continuation of EVD-0232 in source Character Chat `/zh-cn/sim/909c07cf-58bb-43d6-9211-aaf423c99a34`.
- Starting state: Turn 26, energy `96`, exactly one visible Memory (`✦ 1`). Its automatic portion ended at the Turn-23 blackout topic and its user-appended tail declared `橙铜-8842` the latest valid secret.
- Continuation: Turns 27–30 used unrelated prompts about a bakery kitchen, non-electronic plant-watering reminders, an old-book repair room and containers for handwritten letters. Memory was inspected at Turn 28 and Turn 30; both times it remained the same single paragraph. The manual `橙铜-8842` tail was preserved, and none of the new Turn-27–30 topics appeared.
- Turn 31 recall: after those four unrelated Turns, a fifth prompt asked for the latest valid secret and meaning without supplying its value. The response again returned `橙铜-8842` / favorite sun color exactly.
- Billing/persistence: energy changed `96→76`, exactly five Turns × `4/Turn`. After reload, Settings → Memory still showed one `✦ 1` entry with the unchanged automatic summary and unchanged manual tail; no second Memory appeared and no Turn-24–31 topic was merged into the entry.
- Result: a manual Character Memory edit remains authoritative for at least five subsequent generated Turns and one reload. Automatic summarization neither overwrote nor visibly merged the edited entry within that interval. This is a tested lower bound, not proof that manual edits permanently suppress later summaries.
- Confidence: five prompts/responses, T31 exact edited-value recall, `96→76` billing, T28/T30/T31 one-entry state and reload persistence `VERIFIED`; eventual second-summary trigger, edited-entry merge policy and whether the manual tail affects scheduling `UNKNOWN`.

## EVD-0234 — Important Facts Unsaved Close, 200-Character Cap, Save State and Restoration

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; existing checkpoint `/zh-cn/sim/e37cb018-c79c-40a0-9e91-8c70c4b2cccd` at Turn 2.
- Starting state: Settings → `重要事实` showed the previously verified branch-local value `EVD-FACT-REWIND-003: 江夏基线改为 88888。`, counter `34/200`, helper copy `每回合注入给世界的 AI，作为不可违背的既定事实。`, `会员可写 2000 字` and an enabled `保存` button.
- Unsaved-close behavior: the textbox was replaced with a unique `EVD-FACT-UNSAVED-004...` draft and the Settings dialog was closed without pressing Save. Reopening Settings → Important Facts restored the exact committed `88888` value rather than the draft. The panel has no explicit Cancel button; closing the parent dialog is the effective discard path.
- Length boundary: the textarea DOM reports `maxLength=200`. Filling 240 ASCII characters yielded an actual value length of exactly 200, confirming hard client-side truncation at the free limit rather than an after-submit error.
- Save lifecycle: a non-empty replacement `EVD-FACT-EDIT-004: 江夏当前核验基线为 99999。` was saved; the button changed from `保存` to `已保存`. A direct navigation/reload of the same UUID and reopening the panel retained the exact replacement.
- Restoration: the original `88888` fact was re-entered and saved. The panel returned to `已保存`, the counter returned to `34/200`, and the test left the checkpoint in its pre-experiment fact state. No Turn or energy was consumed.
- Result: Important Facts use explicit commit semantics, discard unsaved edits when the Settings dialog closes, enforce the free 200-character limit while editing, and expose an immediate saved-state acknowledgement. This entry verifies the non-empty lifecycle; EVD-0251 later resolves the then-open empty clear/delete boundary.
- Confidence: starting value, discard-on-close, DOM length cap, save-state transition, direct reload persistence and final restoration `VERIFIED`; see EVD-0251 for empty value commit/no-confirm/no-Undo. Member 2000-character enforcement remains `ENTITLEMENT-BLOCKED`.

## EVD-0235 — World v7 Deep Initial-JSON Three-Way Merge: Path Dirtiness, Array IDs, Null and Omission

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; World `/zh-cn/worlds/test-map-world-001-rxwf`, existing Simulation `/zh-cn/sim/97dc81bc-b3de-4123-9c2a-2952d9e9282c`, new v7 Simulation `/zh-cn/sim/04b8feb6-60d4-4793-abbc-d158c68307ed`.
- v6 seed/baseline: the installed App `test-app-first-publish-001` had seed `arr:[9,8]`, `clicks:999`, `nested:{a:999,b:2}`, `status:"v6-world-seed"`, `newField:"v6"`, `missingOnly:{x:1}`. The existing save's hydrated state before this experiment was `arr:[9,8]`, `clicks:102`, `nested:{a:999,b:2}`, runtime-object `status`, clean `newField:"v6"`, clean `missingOnly:{x:1}` and runtime-only `upgradeSeen`.
- Runtime dirtiness preparation: one normal Turn instructed only two App mutations. Turn 2→3 cost `76→63` (13 energy) and, after reload, state was exactly `arr:[{id:"a",v:1},{id:"b",v:2}]` and `nested:{a:1234,b:2}`; the other fields remained unchanged. Story explicitly described both mutations and the reload proved they were durable rather than iframe-local.
- v7 World-local seed: Creator App configuration was changed to `arr:[{id:"a",v:9},{id:"c",v:3}]`, `clicks:777`, `nested:{a:777,b:22,c:3}`, `status:null`, `newField:null`, new `addedList:[{id:"new",v:7}]` and new `explicitNull:null`; `missingOnly` was intentionally omitted. `保存 App 配置` produced `草稿已自动保存`; a full Creator reload showed `已恢复上次草稿` and the exact JSON. Publishing `v7 · App JSON Nested Dirty / Null / Removal Audit` created the normal public version log.
- Existing-save update: the v6 save opened with the exact v7 title/log and standard copy `应用后会安装新增 App 并合并新版初始化配置；你的模拟进度和已修改内容会保留。`. `应用更新` kept the same UUID and Turn 3, consumed zero energy (`63` stayed `63`) and changed Settings to v7.
- Exact migrated state, immediately and after direct reload: `arr:[{id:"a",v:1},{id:"b",v:2},{id:"c",v:3}]`, `clicks:102`, `nested:{a:1234,b:22,c:3}`, runtime-object `status`, `newField:null`, `addedList:[{id:"new",v:7}]`, retained omitted `missingOnly:{x:1}`, retained runtime-only `upgradeSeen`, and `explicitNull:null`.
- Observable merge rules:
  - nested object merging is path-aware: runtime-dirty `nested.a` survived, unchanged `nested.b` adopted `2→22`, and new `nested.c` was added;
  - arrays of objects are identity-merged by `id` in this sample: dirty `a` survived, omitted existing `b` survived, and new `c` appended; it was not whole-array replacement;
  - a runtime-dirty field (`status`) survives a conflicting new `null`, while a clean seeded field (`newField`) adopts `null`;
  - omission is not deletion: clean `missingOnly` survived even though absent from v7;
  - new fields and explicit null-valued fields are added, and runtime-only fields survive.
- Fresh-v7 control: creating `TEST App v7 Fresh Merge 001` cost `63→52` (11 energy), started at Turn 1/v7 and hydrated exactly the v7 seed: `arr:[a=9,c=3]`, `clicks:777`, `nested:{a:777,b:22,c:3}`, both null fields, and `addedList`; it had neither omitted `missingOnly` nor runtime-only `upgradeSeen`. This separates seed semantics from migration semantics.
- Result: World-version App-state migration is an observable deep three-way merge against the previous seed, with path-level dirty preservation and `id`-keyed object-array union behavior. A fresh save uses the new seed literally. The tested model is stronger than top-level dirty tracking and is materially required for parity.
- Confidence: pre-state, one-Turn durable mutations, v7 Draft/reload/publish, update prompt, zero-Turn/zero-energy application, exact immediate/reload migration state, fresh-v7 UUID/energy and literal seed hydration `VERIFIED`; arrays without stable IDs, duplicate IDs/order conflicts, explicit deletion/tombstone syntax and type-change conflicts remain `UNKNOWN`.

## EVD-0236 — One-Time Simulation Player Identity, Account-Preset Transfer and Slot-Gated Checkpoint Attempt

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; fresh v7 Simulation `/zh-cn/sim/04b8feb6-60d4-4793-abbc-d158c68307ed` at Turn 1, World `/zh-cn/worlds/test-map-world-001-rxwf`.
- Newly discovered Settings control: `设定我的身份 仅一次`. Opening it stated `只能设置一次。保存后写入这段故事的记忆，世界里的角色会以这个身份认识你。` and exposed avatar, required `你的名字`, optional `身份设定（可选）— 你是谁、什么来历、什么性格…`, `用人设预设`, Cancel and initially disabled Save.
- Preset transfer: unlike the still-no-op `用人设预设` / `套用我的预设` controls on World `/new`, this Simulation-level control opened a real listbox. Selecting Account preset `TEST Preset Persona 002` populated exact values `Preset Tester` and `Reusable persona for cross-World setup testing.` and enabled Save.
- Cancel boundary: closing the form after preset selection returned to Settings without consuming the one-time opportunity. Reopening showed the same `设定我的身份 仅一次` entry, so selection alone is not a commit.
- Commit boundary: reselecting the preset and saving produced toast `已保存，世界会记住你的身份。`. The Settings entry disappeared immediately and remained absent after direct reload. No Turn or energy was consumed by the save.
- Exact runtime state: the installed App iframe received `playerSetup:{player_name:"Preset Tester",persona:"Reusable persona for cross-World setup testing."}`. At the same time the visible Memory panel still rendered `暂无记忆。每隔几轮会自动生成总结。`, so the product copy's broad “写入记忆” does not imply an immediately visible Memory item; the identity is exposed as separate Simulation context/state.
- Next-Turn effect: a prompt asked the World Character to address the current player by name and explain the identity without restating the values. Turn 1→2 cost `52→41` (11 energy). The response addressed the player as `预设测试员` and invented a compatible in-world dossier/backstory, while the iframe retained the exact English `playerSetup` values. The Settings identity entry remained absent after the Turn.
- Checkpoint lifecycle: `创建存档点` opened the ordinary naming dialog with default `TEST App v7 Fresh Merge 001 · 回合 2`; after entering `TEST Identity Checkpoint 001`, the World-level capacity gate reported `这个世界的 3 个免费存档位已全部用完。` and offered `增加存档位 · 80` or deleting an old save. With only 41 test energy, no 80-energy purchase was attempted. The disposable old v5 save `/sim/a4998853-6e3d-4d38-b7ff-3db692a3b435` was deleted through the Mine `更多 → 删除 → 确认永久删除该存档？` in-page modal; its History card disappeared. Retrying created checkpoint `/zh-cn/sim/2b9a86c1-2925-4e60-9ea5-9f293e16d976` and displayed `存档点已创建` plus `打开` / `回到现在`; energy stayed 41.
- Checkpoint identity copy: the independent checkpoint opened as `TEST Identity Checkpoint 001` at Turn 2/v7 with the same Story. Settings still omitted `设定我的身份`, visible Memory remained `暂无记忆`, and the iframe carried the exact same `playerSetup:{persona:"Reusable persona for cross-World setup testing.",player_name:"Preset Tester"}`. Identity value and one-time-consumed flag are therefore copied into a current-state checkpoint.
- Historical-view boundary: source Events exposed `按轮次` / `按主线` / `导出`, Turn 1 and Turn 2. Selecting Turn 1 and `查看这一轮的世界状态` changed the banner to Turn 1, disabled the composer with `查看历史状态时不可操作——回到现在后才能继续游戏`, and exposed `从这一轮创建存档点` / `恢复到此状态` / `回到现在`. Even this Turn-1 historical world-state iframe already contained the exact committed `playerSetup`, although the identity was set after the initial Turn-1 World creation. This is direct evidence that historical viewing overlays current identity metadata instead of showing a pre-identity snapshot.
- Final restore action: clicking `恢复到此状态` triggered a native Confirm. The confirmation was accepted through the browser's supported dialog path. The source remained the same UUID, exited historical-read-only mode and became current Turn 1; the Turn-2 player action/response disappeared and the composer re-enabled. Energy stayed 41, so Restore neither consumed nor refunded the prior 11-energy Turn.
- Identity after Restore: immediately after the in-place Turn 2→1 restore, the iframe still contained exact `playerSetup`, Settings still omitted `设定我的身份`, and visible Memory remained empty. A direct reload preserved current Turn 1, absence of the Turn-2 Story, exact `playerSetup`, the consumed one-time lock and energy 41. Therefore both the identity value and consumed flag live outside the rewindable Turn snapshot in this sample, matching the historical-view overlay signal.
- Result: WorldOS has a one-time, explicitly committed, per-Simulation player-identity object that can copy an Account Persona preset, disappears permanently from normal Settings after commit and enters runtime/model context independently of visible Memory. The `/new` preset no-op and the working in-Simulation preset picker are a real surface inconsistency, not evidence that Account presets lack transfer semantics everywhere.
- Confidence: form/control inventory, preset transfer/commit, next-Turn use/billing, three-slot gate/cleanup, checkpoint identity copy/lock, historical-Turn overlay and native-confirm in-place Restore→reload preservation outside the Turn snapshot `VERIFIED`; avatar transfer, manual-input limits/validation, Style/Lore composition and exact AI serialization/localization remain `UNKNOWN`.

## EVD-0238 — App Market Control Semantics: Exclusive Categories, Local State and Title-Only Owner Search

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; `/zh-cn/apps`.
- Current control inventory: `搜索 App…`, two `创建 App` entries, and 18 mutually exclusive category buttons: `全部`, `核心`, `社区`, `社交`, `角色`, `叙事`, `经济`, `系统`, `成长`, `资讯`, `任务`, `音频`, `悬疑`, `科幻`, `奇幻`, `恋爱`, `策略`, `历史`. No current sort dropdown, time filter or separate facet menu was exposed, superseding the older generic “sort/facets” description for this build.
- Initial/default catalog rendered 24 Install cards in the first loaded batch. Cards expose title/creator/World-usage, optional rating, description/tags, favorite-count control and `安装`. `社区` also produced 24 first-batch cards headed by `号外日报`/`微博`; clicking `社交` removed the `社区` active state rather than combining filters and returned a social category containing both official and community Apps. Category buttons are single-select peers.
- Search/category interaction: while `社交` was active, exact owner-App title `TEST App First Publish 001` yielded `没有结果`; switching to `全部` with the same query returned exactly the owner card (`by x161880 · 4 个世界在用`, tags `系统/社区`, Favorite and Install). Exact slug `test-app-first-publish-001` returned `没有结果`. This reproduces title-only Market indexing while also proving search is intersected with the selected category.
- Client-side state: category clicks and query entry kept the canonical URL exactly `/zh-cn/apps`; no `?q=` or category parameter was written. Clearing via ordinary Select-All/Backspace restored the 24-card batch. A `社区` + `微博` query returned one Install result while leaving the URL unchanged.
- Result: App Market is a stateful client-side single-category catalog, distinct from Unified Search. Its searchable identity is visible-title based for the owner test App, not slug based, and a valid title may appear as empty when a nonmatching category remains selected.
- Confidence: current controls/absence of sort UI, 24-card batch, exclusive category states, category-query intersection, title success/slug failure, exact owner usage/card controls and unchanged URL `VERIFIED`; infinite-scroll trigger/terminal count, ranking algorithm, favorite mutation, index eligibility/SLA and arbitrary-App install commit remain `UNKNOWN`.

## EVD-0237 — Account Control Audit: BYOK Limited-Time Access, OpenRouter Catalog and Preset Validation Matrix

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; `/zh-cn/account`, stable reload state.
- Account IA/control inventory: `个人资料`, `偏好`, `世界模型`, `我的预设`, `账户`. Profile exposes two avatar triggers, username/bio textboxes, five gender buttons, 34 interest-tag buttons and explicit `保存资料`; Preferences exposes only `English` / `Español` / `中文` in the tested build. Account danger area contains `输入 DELETE 以确认` and disabled `删除账号`.
- Delete-gate exactness (no deletion submitted): `delete`, leading-space ` DELETE` and trailing-space `DELETE ` all kept the destructive button disabled; only exact uppercase `DELETE` enabled it. The input was cleared afterward.
- Current BYOK entitlement changed from the earlier membership-gated hydration sample to a stable promotion state: heading `自备 API 限免` and copy `限免中：无需订阅即可填入自己的 API key、使用更多模型，且模拟世界不消耗 Zaps。` persisted after reload. No real key was entered.
- Provider matrix: DeepSeek, 智谱 GLM, OpenRouter and 自定义 are real tabs. DeepSeek exposes key + Flash/Pro/Visual model choices and custom model id; GLM exposes key + GLM-4.5-Flash free / 4.6 / 4.7; OpenRouter exposes key, Free/DeepSeek/GLM/Kimi/Qwen presets and `更多模型`; Custom exposes Base URL + key + model id. DeepSeek/GLM continue to mislabel the key field `OpenRouter API key`.
- OpenRouter catalog: `更多模型` first displayed `正在加载模型列表…`, then hydrated a searchable live catalog with vendor/name/model-id rows. Searching exact `anthropic/claude-3-haiku` reduced the list to `Anthropic: Claude 3 Haiku`. Clicking it marked the row active but did not populate the separate manual `厂商/模型 ID` field; `使用` remained disabled because no key was saved. The page also states uncharged accounts get 50 free-model calls/day and an OpenRouter $10 recharge raises that to 1000/day; no external recharge was attempted.
- Preset inventory began at three persisted private objects, one each Persona/Style/Lore. Each card uses icon-only pencil and trash controls with no accessible label/title. `添加预设` immediately increases the visible total/type counts before persistence and expands an inline form; this count is a local form count, not proof of save.
- Empty-save behavior: all three add forms expose an enabled `保存` even when blank. Clicking it leaves the form open and shows inline `请填写必填项。` with no toast. Persona requires both preset name and player name; persona/body is optional. Style and Lore each require preset name plus their body. None of the tested text fields exposed a DOM `maxlength`.
- Minimal persistence controls: `TEST Preset Minimal Required 001` saved with name + `Minimal Player` and empty Persona; `TEST Preset Style Minimal 001` saved with name + `Minimal style body.`; `TEST Preset Lore Minimal 001` saved with name + `Minimal lore body.`. Full reload returned total `6` with `人设 (2) / 文风 (2) / 世界观 (2)` and the new names, proving server persistence. No delete was performed.
- Result: BYOK availability is promotion/entitlement-dependent and currently genuinely interactive without payment, while real credentials remain an external boundary. Account presets have type-specific required schemas, optimistic pre-save counts, inline validation and durable minimal records; Persona's content description is optional even though its name/player-name are required.
- Confidence: five Account tabs, Profile/Preference/Account control lists, exact DELETE matching, stable limited-time BYOK state, four provider schemas, OpenRouter catalog load/search/select/no-key disable, preset icon identities, add-count behavior, blank/name-only validation and three-type reload persistence `VERIFIED`; promotion expiry/eligibility, valid-key success/provider failure, credential deletion/encryption/cross-device sync, preset maximum lengths/duplicates/reorder/export and final destructive cleanup remain `UNKNOWN`.

## EVD-0239 — App Market Infinite-Scroll Pagination and Terminal Counts

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; desktop `/zh-cn/apps` at 1280×720-equivalent browser viewport.
- `全部` began with 24 visible `安装` cards. Ordinary downward scrolling appended discrete 24-card pages: observed counts included `24→48→72→96→120→144→168→192→216→240→264→288→312→336`, followed by a final partial page `341`.
- Terminal proof for `全部`: at `scrollY=20583`, `innerHeight=720`, `scrollHeight=21303`, the viewport was exactly at the document bottom. Four additional downward scrolls with one-second waits kept the same 341 cards and identical scroll height. No visible `加载中…`, `没有更多了` or other terminal copy appeared.
- Category reset: clicking the mutually exclusive `社区` button after fully loading `全部` immediately reset scroll position to 0, document height to 2020 and visible cards to its own first batch of 24 while the URL stayed `/zh-cn/apps`. This is independent category pagination/reset behavior, not a pure client filter across the already-rendered 341 All cards.
- `社区` then paged independently in 24-card increments through `48/72/96/120/144/168/192/216/240/264/288`, followed by a final partial page of `291`. Reaching its bottom twice more kept `291`, `scrollHeight=18080` and `scrollY=17361` with no terminal label.
- Result: current App Market uses silent scroll-triggered pagination with a 24-card page size, per-category result/reset state and no explicit end-of-list affordance. In this sample the complete authenticated-owner totals were 341 for All and 291 for Community.
- Confidence: first page, page-size progression, All/Community terminal counts, category reset-to-top, stable bottom and absence of loader/end copy `VERIFIED`; server request shape, catalog churn, other-category totals, ranking algorithm, deduplication under concurrent publication and identity-specific totals remain `UNKNOWN`.

## EVD-0240 — Worlds Directory Discovery Modes, Section-local Ranking and Client-local Facets

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; desktop `/zh-cn/worlds`.
- Featured carousel: six positions comprise five World promotions plus one BYOK/pricing promotion. Controls are `上一个`, `下一个` and six explicit `第 1`…`第 6` dots. `Next` changed active 1→2; direct dot 6 worked; Next at 6 wrapped to 1 and Previous at 1 wrapped to 6. All kept `/worlds` unchanged.
- Four top discovery modes are mutually exclusive and client-local: `推荐`, `热门`, `日榜`, `关注`. The current owner Follow view contained four Worlds from followed creator Milian. `日榜` stabilized at 24 cards. `热门` loaded 24 first, then a second partial page to 47 and displayed `没有更多啦`; repeated bottom gestures stayed 47. Follow and Daily exposed no terminal copy in their tested fixed-size results. Mode switches kept the canonical URL unchanged.
- Fully materialized Recommendation architecture: 35 genre chips/rows (`同人` through `运动`) are lazy-loaded per section, not one global grid. Each row exposes independent `趋势 / 热门 / 最新` controls and normally 12 cards; current exceptions were `当代=11`, `职场=11`, `百合=7`, `DnD=6`, `商业=10`. Fixed World rows were `猜你想玩=12`, `关注的创作者=4`, `最多回合=12`, `最新更新=6`, `我的世界=5`, `模拟过的世界=7`; Collections/Creators are separate non-World rows.
- After scrolling every row into view and waiting for its own lazy load, Recommendation contained 451 Remix/Start World cards plus five featured-World links: 456 rendered World links representing 278 unique World URLs. It has no global `没有更多啦` because the page terminates as a finite set of independent rows. Jumping past a row can temporarily leave only its heading/min-height skeleton; deliberately bringing it into view hydrates controls/cards, so this is Intersection/lazy-load behavior rather than a verified empty-data defect.
- Local-sort proof: the Fantasy row began Trend with 12 cards; clicking its own `最新` changed only that row to 10 cards and a different order, then `热门` returned 12 different cards. Active styling changed on the local control and the URL remained `/worlds`. Restoring `趋势` worked.
- Genre/facet transition: selecting a genre clears all four top modes and enters a filter-result layout. `更多分类` toggles to `收起`; audience options are `所有 / 男性向 / 女性向 / 全性向`; audience combines with the selected genre. An App multi-select exposes four options (`地图`, `视觉小说`, `过场CG`, `骰子`) and a selected-count badge. In Follow mode, selecting `地图` produced the explicit `没有结果` state; reopening and selecting the already-selected option deselected it and restored the four Follow cards.
- Filter-result sorting exposes nine options with helper copy: `趋势—近期上升最快`, `最多游玩—累计游玩最多`, `最多回合—累计回合数最多`, `高评分—玩家评分最高`, `最投入—单局平均回合最多`, `最多复玩—回头重开的玩家最多`, `改编最多—被其他创作者改编最多`, `最新—最近新增`, `随机—换一批看看`. Time range exposes `全部时间 / 每日 / 每周 / 每月` for applicable metrics. Selecting `随机` hid the time-range control and produced 21 filtered cards in the tested Fanfic+male sample; choosing Random again, or Latest then Random, returned the same order within that session rather than visibly reshuffling.
- Result: `/worlds` contains three distinct discovery architectures—multi-row Recommendation with per-row lazy load/ranking, fixed/paged top modes, and a faceted single-result list. All state tested here is in-memory at the canonical URL; reload/deep-link state cannot be reconstructed from query parameters.
- Confidence: carousel navigation/wrap, four top modes, Hot 24→47 terminal, Daily/Follow counts, all 35 Recommendation row hydrations/current counts, 451/456/278 totals, local Trend/Hot/Latest switching, genre→faceted transition, audience/App controls, explicit empty state, nine sort and four time options, Random same-session stability and URL invariance `VERIFIED`; ranking formula, personalized cause, server paging shape, cross-session Random seed, per-identity totals and catalog churn remain `UNKNOWN`.

## EVD-0241 — Collections Directory Query, Ownership Scope and Finite Rendering

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; desktop `/zh-cn/collections`.
- Baseline controls/current data: heading `浏览世界合集`, searchbox `搜索合集名称、介绍、标签或创作者`, `排序：热门`, `作者：全部`, owner `创建合集`, and `56 个合集`. The sort menu contains exactly `排序：热门 / 排序：最新`; author contains exactly `作者：全部 / 作者：我的合集`.
- Finite rendering/terminal proof: all 56 Collection headings/links existed immediately in the current DOM and document height was 5536. Four repeated bottom scrolls remained at 56 with no loader, paging control or `没有更多` copy. The only default main buttons were sort and author; cards were whole Collection links. No card contained a nested button/favorite/menu, correcting the earlier generic control description.
- Sort and author URL state: `最新` writes `?sort=recent` while preserving the 56 count and changes leading order. `我的合集` writes `?author=mine` and returns exactly three owner assets in the current sample: Public `测试收藏生命周期 002`, Link-visible `测试系列 001`, and Only-me `测试系列：仅限我 001`. These cards use the same generic structure and expose no visibility badge. `最新 + 我的合集` composes as `?author=mine&sort=recent` and returns the three in current latest order.
- Search field coverage/intersection: title query `测试` under Latest returned four entries; one result `随机` matched its description `随机测试内容`, directly proving description search. Creator query `x161880` in All returned only the public owner Collection. Mine + tag query `only-me` wrote `?author=mine&q=only-me` and returned exactly the Only-me owner sample, proving tag search over a non-public owner asset and composition with ownership scope. Combining Latest produced `?author=mine&q=only-me&sort=recent` without losing the result.
- Empty/reload/reset: `NO_MATCH_COLLECTION_0241` produced `0 个合集`, `没有找到合集`, `换个关键词或筛选条件试试。` and `清除筛选`. Reload preserved query/sort/zero state. Activating Clear removed all query parameters and restored `/collections`, Popular, All and 56 cards.
- Result: Collection browse is a finite URL-addressable discovery projection, not the client-local state architecture seen in World/App directories. Public All omits Link-visible/Only-me, while owner Mine crosses visibility classes; search operates over title/description/tag/creator and composes with sort/owner filters. Exact ranking formula, index-update SLA, the meaning of the second numeric card display and cross-session catalog churn remain unknown.
- Confidence: current control inventory, option sets, 56-card finite terminal, URL/query composition, reload persistence, title/description/tag/creator search, explicit empty state, Clear reset, three-visibility Mine scope and absence of card-level controls/badges `VERIFIED`; ranking/index cause and dynamic catalog behavior `UNKNOWN`.

## EVD-0242 — Community Ranking Matrix, Ranked-World Rows and CTA Feedback

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; `/zh-cn/community`, current narrow 671×722 viewport.
- Contact/creation controls: page exposes `扫码加群`, `复制微信号`, `创建世界`, plus external 小红书/抖音/Bilibili links. QQ opens an in-page `QQ 群` modal with close, QR image, button `群号 970158335`, copy helper and `群号已复制` notification. WeChat copy produced no visible toast/modal/navigation in two triggers. Create World opens the standard `创建新世界` modal with quality-guide link, search, 35 genres, Blank World, Manual/AI actions and Cancel; Cancel returns to `/community` without mutation.
- All nine ranking tabs were actually clicked. `玩家 · 模拟回合`, `玩家 · 模拟世界数`, `创作者 · 被模拟次数`, `创作者 · 总被模拟回合`, `创作者 · 被收藏数`, `创作者 · 作品数`, `创作者 · 累计收益`, and `创作者 · 收到打赏` each rendered 20 unique Profile links. Current `WorldOS 支持者` rendered one row (`ztlllll`, `10 美元`). Units respectively include `回合`, `个世界`, `次模拟`, `收藏`, `电量`, and `美元`; creator earnings can include decimals while tips are current integer displays.
- Ranking state is client-local: every click kept `/zh-cn/community`; selecting Creator Earnings then reloading reset the active tab to default Player Turns. No loader/empty/end copy appeared inside the fixed rankings.
- Five independently rendered World rows exist: `最多人模拟的世界`, `回合数最多的世界`, `最多被收藏的世界`, `最受打赏的世界`, `最多被改编的世界`. After ordinary vertical scrolling brought the lazy section into view, each contained 12 unique World links and all 12 cards exposed both `改编` and `立即开始`. The first two rows shared all 12 URLs but differed in positions 7–10, so they are distinct orderings rather than one identical duplicated array.
- Responsive horizontal behavior: each row has a 3088px scroller over a 663px client area. At this sub-768 viewport arrow buttons are CSS-hidden (`hidden md:flex`), but an ordinary horizontal scroll gesture moved the first row `0→512`, repeated gestures reached exact max `2425`, and one more forward gesture stayed terminal. At terminal only `scroll left` existed; moving back to 1792 restored both left/right controls.
- Full-page terminal: after all five rows hydrated, the page held 60 World links and 20 current default Profile rows. Repeated bottom gesture kept `scrollY=3228`, `scrollHeight=3950`, same 60/20 counts and no `加载中/没有更多` text.
- Result: Community is a finite ranking/contact hub rather than an activity feed. It combines one client-local nine-way Profile ranking with five finite horizontal World rankings reusing normal card actions; no page pagination was observed.
- Confidence: contact/modal/copy feedback, all ranking controls/counts/units/Profile links, reload reset, five World row identities/card counts/actions, responsive gesture/terminal state and page terminal `VERIFIED`; ranking formulas, update cadence, clipboard readback, supporter payment lifecycle and deletion/index timing remain `UNKNOWN`.

## EVD-0243 — Mine Finite Projection Matrix, Reload Reset and App-Favorite Cache Lag

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; `/zh-cn/sims`, current 671×722 viewport.
- IA/state: primary tabs are `历史 / 作品`. History subtypes are `世界 / 角色`. Works subtypes are `世界 / 角色 / 合集 / App`; World, Character and App expose `我创建的 / 我收藏的`, while Collection directly shows owned Collections. Every tested state kept the canonical `/sims`. Reload from Works→App→Favorited reset to default History→World.
- Current finite counts: History World=19 Simulation links, History Character=4. Works World Created=5, World Favorited=0 (`这里还什么都没有。`); Character Created=18 cards plus New Character, Character Favorited=1; Collection=3 plus Create Collection; App Created=3 plus Create App, App Favorited baseline=0. This supersedes the earlier Character-History empty snapshot.
- Terminal behavior: all 19 World history links were present before scroll; repeated bottom gestures stayed 19 at `scrollY=924/scrollHeight=1646` with no loader/end copy. All 18 Created Character cards were present before scroll; repeated bottom gestures stayed 18 at `scrollY=1703.5/scrollHeight=2425`, also with no terminal copy. No pager/search/sort control exists in Mine's current lists.
- History controls: each save is a whole `/sim/{uuid}` link displaying name, World/Character identity, Turn and date with nested `更多`. Opening More exposes exactly `重命名` and `删除`; closing it restores the card without mutation. Existing rename/delete/orphan lifecycle evidence remains EVD-0219/0221/0223.
- Works control distinctions: owner World cards expose Edit/Continue Edit, Remix, Delete and Start plus draft/map badges; Collection cards are direct links with Create; Character cards are non-link surfaces with Chat and, when eligible, Add; App cards expose heart Favorite and Install. Clicking an owned App card opens a Drawer at the same `/sims` URL with Close, creator Profile, Install, direct Detail, owner Edit/Delete, metrics/favorite, rating and comment.
- App favorite projection experiment (baseline restored): clicking the public owner App `TEST App First Publish 001` heart changed its visible count `0→1` immediately. Switching straight to App `我收藏的` still showed the stale empty state. After reload and re-entering Works→App→Favorited, the App appeared with count 1, proving durable membership. Clicking its heart removed the count immediately but left the row mounted in that selected render; reload/re-entry converged to the empty state. The test ended unfavorited with the original empty favorite list.
- Result: Mine is a finite set of client-local, denormalized object/history projections with type-specific card semantics. Current lists do not paginate at these account sizes. App favorite writes are durable, but the selected Mine projection lacks same-render cache invalidation in both directions.
- Confidence: full current tab/subtab inventory, counts, terminal stability, default reload reset, History More, App Drawer and reversible App favorite persistence/cache lag `VERIFIED`; larger-account pagination threshold, cross-device invalidation, retention and same-render cache rules for other object types remain `UNKNOWN`.

## EVD-0244 — Maps Catalog Terminal, Preview Gestures and Map-to-World Version Boundary

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; `/zh-cn/maps`, 671×722 viewport.
- Catalog controls: the three mutually exclusive top scopes are `有底图` (default), `全部` and `我的`; search is `搜索地图…`; genre is one-of-36 (`全部` plus 35 World genres). Scope, search and genre remain client-local at the canonical `/maps` URL. Reload from `我的` plus a query reset to `有底图 + 全部`, cleared the query and restored the first default batch.
- Silent pagination/terminal: default `有底图` began at 16 cards and appended 16-card batches. Complete scrolling reached 1,083 cards at `scrollY=145885 / scrollHeight=146607`; repeated large downward gestures kept both the count and terminal dimensions unchanged. There was no loader, pager or end-of-list copy. Switching scope reset the list. `我的` returned four owner Map Worlds (including two distinct slugs with the same title); `历史` while in My produced the explicit `暂无地图`, and genre `全部` restored the four.
- Search coverage: under My, exact title `测试地图世界 001` returned one card, `x161880` returned all four and `NO_MATCH_MAP_0244` returned `暂无地图`. Search therefore covers at least visible title and creator and intersects the current scope/genre rather than opening a separate result route.
- Card structure: every observed card exposes an in-page `查看大图`, a source-World/creator link, a separate `新标签页查看世界` link to the same World, and `用此地图`. No independent Map detail URL is exposed. The preview opens at the same URL with title, Close, `Zoom in`, `Zoom out` and helper `拖拽平移 · 右下角 +/- 缩放`. Repeated `+/-` visibly changed scale and a CUA drag shifted the enlarged map; Close removed the overlay.
- Existing-World branch: `用此地图` opens a popover with a prefilled new-World name and `新建并编辑`, plus owned existing Worlds. Existing rows may show `有地图`, but that badge remains an incomplete signal (earlier Creator evidence found Map data on an unbadged row). Choosing `TEST Template World 001` opened a second confirmation with `全部 / 仅底图 / 仅区域`; helper copy respectively states base+regions/factions, base only, or regions/factions only. `取消` closed without mutation. Selecting All and `装入并编辑` stayed on `/maps` despite the label, but emitted `已加入世界草稿。发布新版本后，修改才会对玩家生效。` Direct Creator verification found a v5 draft with one ordinary Map App, 47 regions and two factions. Thus the write succeeded even though the advertised editor navigation did not occur.
- New-World branch: entering `TEST Map Library New 0244` and clicking `新建并编辑` created `/worlds/test-map-library-new-0244-ps5i` and eventually opened its Creator. This operation immediately produced a public v1 detail containing only Main Input and Story, with no Map App/badge and cost `7–16 电量 / 回合`; simultaneously the Creator held an unpublished v2 draft containing the 47-region/two-faction Map and showed `发布 v2`. Therefore map-library creation is a two-boundary transaction: base World v1 becomes public before the selected Map is published in v2.
- Publish validation boundary: clicking `发布 v2` after closing the Map-config overlay did not open a native confirmation; it produced the exact toast `封面图为必填项。` and inline `封面图为必填项。` below Upload. Thus the automatically public v1 can exist with the generated letter placeholder, while the Map-bearing v2 requires an uploaded cover. The in-app browser exposed one file input but no supported file-selection method/system picker target, so final v2 publication is `BLOCKED_BY_FILE_PICKER`, not user confirmation or an unknown click failure.
- Confidence: current control inventory, 1,083-card default terminal, 16-card page progression, scope/genre/search intersection and reset, preview zoom/pan/close, existing-World scope/cancel/write/toast, direct draft verification, new-World public-v1 versus Map-v2-draft split and cover-required publish validation `VERIFIED`. A separate retained Manus snapshot independently closes that session's exact `全部`/`有底图` set relation as All=1,181, Base=1,085, All-only=96 and Base-only=0; the 1,083↔1,085 cross-session delta, ranking/index eligibility, `target=_blank` attribute recheck and external v2 result remain `UNKNOWN/BLOCKED_BY_FILE_PICKER`.

## EVD-0245 — Notification Read-on-Open, Silent Pagination and Deep-Link Matrix

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; global header Notification control while on `/zh-cn/maps`.
- Read transition: the header began with unread badge `7`. Opening the Notification dialog immediately removed the numeric badge; closing the dialog and fully reloading `/maps` kept the badge absent. No per-row Mark Read, Mark All Read, delete, archive, filter, settings or clear control was exposed. Read state is therefore a modal-open side effect rather than an explicit per-item action in the current build.
- Pagination/terminal: first hydration exposed 10 notification entries plus actor links and helper `下滑加载更多`. Scrolling the modal appended a second 10-entry page, then a final partial page of four. Three additional internal downward gestures kept the count at 24; `下滑加载更多` disappeared and no replacement `没有更多`/terminal copy appeared. Records remain after becoming read.
- Current type matrix: announcements (`📢`), referral reward settlement (`⚡ +150 已到账`), leaderboard placement (`🏆`), World Remix (`🔥`), World comment (`💬`), Follow (`🎯`) and World Favorite (`⭐ 人气 +1`) all coexist. Multiple same-actor/same-object Follow/Favorite rows are retained as separate events rather than visibly deduplicated.
- Link semantics: actor identity links target Profile; referral rewards target `/rewards`; rank/Favorite/comment target the relevant World; Remix targets the child World; a product announcement can target an App (`/apps/achievements`). Clicking the App announcement closed the modal and navigated to its App detail. Some system announcements and their `someone` actor use literal `#`; clicking one such announcement closed the dialog but kept the canonical Maps URL and produced no separate detail surface.
- Result: Notifications is a persistent, silent-paged event ledger with implicit read-on-open, heterogeneous typed deep links and linkless broadcasts. The unread badge counts unread state, not total retained rows.
- Confidence: badge 7→none, reload persistence, 10+10+4 current paging/terminal, helper disappearance, current type set, actor/object routes, real App navigation and `#` no-op/close behavior `VERIFIED`; retention horizon, maximum history, cross-device read sync, notification preference controls, delivery latency and gift/Collection/App-specific successful events remain `UNKNOWN`.

## EVD-0246 — Achievement App Configuration, Runtime Unlock, Cross-Save Persistence and Rewind Boundary

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; official App `/zh-cn/apps/achievements`, World `/zh-cn/worlds/test-template-world-001-fv99` v5, source Simulation `/zh-cn/sim/1440b4a4-2c7d-4bca-ac37-d0e98c91ac2c`, fresh control `/zh-cn/sim/689b41a8-ac67-4d08-b440-662cb0ad38c4`.
- Official contract and Preview: the WorldOS App is categorized `核心/成长` and currently reports `573 个世界在用`. Its copy defines creator-authored name/condition/rarity, AI/GM unlock, hidden-until-unlocked behavior and World-level rather than single-Simulation ownership. Online Preview displayed a World badge, `4/11`, eight visible names plus three hidden locks, Reset and explicit no-effect Preview copy.
- Install/configuration controls: selecting an owned World enters configuration rather than committing immediately. Each row exposes icon, name, rarity (`铜/银/金`), delete, player-visible description, AI-only trigger condition and `隐藏` (`解锁前显示为「???」`). Shared App controls include optional display name, custom instruction, operation reminder, guide copy, theme, opacity and background image. The Creator warns that hidden names/conditions are not shown in game but World configuration is publicly readable, so true secrets must not be placed there.
- Draft/version boundary: installing to `TEST Map Library New 0244` wrote an unpublished World Draft and toasted `已加入世界草稿。发布新版本后，修改才会对玩家生效。`. The publishable control World was configured with one visible Copper achievement and one hidden Gold achievement, both triggered by exact token `EVD-ACHIEVEMENT-0246`; saving App config persisted both rows. World v5 was published with the Achievement and Map Apps. An existing v2 Simulation offered v2→v5 apply-update copy, then adopted both Apps at zero Turn/energy while preserving UUID, Turn 1 and balance 41.
- Pre-unlock surfaces: Simulation Dock showed `0/2`, the visible achievement name/description and `剩余 1 项隐藏成就`; World detail likewise showed `0/2 · 0%`, `全部/已解锁`, the visible Copper item and a `?` hidden placeholder. The hidden name, rarity and description were not exposed in either runtime surface before unlock.
- Real unlock Turn: submitting `执行 EVD-ACHIEVEMENT-0246：完成一次明确行动并立即确认两个测试成就均已达成。` advanced Turn 1→2 and charged `41→32` (9 energy). Events contained two separate `打开成就` controls. The Story narrated two completed causal chains, but the open Achievement panel remained temporarily `0/2` until a full reload; after reload it became `2/2` and revealed both the visible Copper item and previously hidden Gold name/description as `已解锁`. This is a durable unlock with a same-render synchronization lag, not a narrative-only result.
- World projection: World detail immediately showed `2/2 · 100%`; its modal listed both names, Copper/Gold, descriptions and unlock date `2026年8月25日`. Thus the hidden item becomes fully public to the achiever after unlock.
- Cross-save scope: creating fresh Simulation `TEST Achievement Cross-Save 0246` generated a separate UUID and opening Turn at cost `32→21` (11 energy). Before entering the trigger in that save, its Achievement Dock already showed both items `2/2` and unlocked. This proves the unlock is keyed at least by Account×World and shared across independent Simulations, not stored only in the originating save.
- Profile boundary: the owner Profile contained no `成就`/`成就陈列` section or menu entry after the unlock. Existing evidence on another user's Profile proves a separate scored World-completion `成就陈列` surface. The official App claim that ordinary configured achievement unlocks enter the personal Profile is therefore not observed for this sample; whether it is delayed, eligibility-gated or a product defect remains `UNKNOWN`.
- Historical view versus real Restore: viewing historical Turn 1 overlaid the old snapshot and displayed Achievement `0/2`, while current World detail and the independent save remained `2/2`. Accepting native-confirm `恢复到此状态` changed the same source UUID from Turn 2 back to current Turn 1, removed the trigger action/Story and both `打开成就` Events, and re-enabled input. Nevertheless its current Achievement Dock remained `2/2`; World detail remained `2/2`; balance stayed 21. Rewind neither revoked the World-level unlock nor refunded the 9-energy Turn, and it did not remove the v5 Map/Achievement installation.
- Result: configured achievements have snapshot-sensitive historical presentation but account/world-level durable ownership. The Simulation event that granted them is rewindable and can disappear, while the unlock is monotonic across saves and outside the Turn restore boundary. Runtime UI may remain stale until reload, and ordinary custom achievements do not currently appear on the owner's public Profile despite the App description.
- Confidence: App detail/Preview/configuration controls, hidden pre-unlock rendering, v5 publication and v2→v5 zero-cost migration, exact charged unlock, reload synchronization, World detail projection, fresh-save inheritance, native-confirm Rewind/event truncation/no-refund and post-Rewind persistence `VERIFIED`; Profile propagation policy/delay, duplicate-trigger idempotency, simultaneous/concurrent unlocks, deletion/uninstall/version-removal semantics and cross-account visibility of an achiever's custom achievements remain `UNKNOWN`.

## EVD-0247 — Already-unlocked Achievement Re-trigger Idempotency and Residual Event

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; World v5 `/zh-cn/worlds/test-template-world-001-fv99`, restored source Simulation `/zh-cn/sim/1440b4a4-2c7d-4bca-ac37-d0e98c91ac2c` at Turn 1 with pre-existing Account×World progress `2/2`.
- Precondition: EVD-0246 had rewound the only granting Turn, but both achievements remained unlocked in the source, a separate save and World detail. The account was replenished to 371 energy. The second action explicitly repeated the same exact condition: `再次执行 EVD-ACHIEVEMENT-0246：重复完成相同条件，检查已解锁成就是否幂等。`
- Real duplicate Turn: the submission advanced Turn 1→2 and charged `371→362` (9 energy). It produced a normal new Story response and survived direct reload; the Simulation Achievement Dock stayed exactly `2/2` with the same two items. World detail also stayed `2/2 · 100%`; both unlock dates remained day-level `2026年8月25日`. No third achievement, duplicate list row, progress overflow or visible duplicate toast appeared.
- Event behavior: after opening Events and waiting for hydration, the persisted Turn-2 record contained exactly one `打开成就` button, whereas the first successful two-definition grant had contained two. The row has no descriptive achievement name in its accessible label and did not expose a reliable clickable box in the tested render, so the exact target/meaning of the residual marker remains `UNKNOWN`. It is nevertheless a real persisted structural Event associated with the duplicate-condition Turn.
- Result: grant ownership/counting is idempotent for this already-unlocked two-definition condition, but event emission is not fully suppressed. Repeating an achieved condition still costs a full Turn and can leave one generic achievement event marker even though no progress or visible unlock record changes.
- Confidence: charged duplicate Turn, `2/2` idempotent count/list after reload, unchanged World projection/date precision, absence of visible duplicate row/toast and one persisted generic `打开成就` Event `VERIFIED`; which definition/event type emitted, exact per-achievement dedup rule, simultaneous/concurrent grant ordering and notification delivery remain `UNKNOWN`.

## EVD-0248 — Achievement Definition Removal, App Reinstallation and Versioned Tombstone Projection

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; World `/zh-cn/worlds/test-template-world-001-fv99` v5→v10; source Simulation `/zh-cn/sim/1440b4a4-2c7d-4bca-ac37-d0e98c91ac2c`; v6 control `/zh-cn/sim/64ab13cc-82cd-491e-9b6c-b15001786baa`; v7 control `/zh-cn/sim/153e013c-c228-4e01-8301-47be8f71d1d1`; native-v10 control `/zh-cn/sim/8eaf15cd-5a5a-4590-ad3a-3f004188e973`.
- Definition removal / v6: Creator began with the two already-unlocked EVD-0246 definitions. The hidden Gold row's unlabeled delete control removed it immediately without confirmation; `保存 App 配置`, reload and reopen proved a literal one-row current config. Publishing `v6 · Achievement Definition Removal Audit` did not erase the historical unlock from World detail: it still showed both old items `2/2` with their dates. Applying v6 to existing saves cost zero Turn/energy and also retained both rows `2/2`. By contrast, native-v6 save `TEST Achievement Fresh V6 0248` initialized only the one active definition and showed it inherited as `1/1`; the retired hidden definition was absent.
- App uninstall / v7: Creator's Achievement `卸载` was immediate, with no modal or toast; the App row and preview Dock disappeared. Publishing `v7 · Achievement App Uninstall Audit` removed the Achievement App link and achievement section from World detail. Existing saves that explicitly applied v7 lost the Dock immediately at zero Turn/energy. A v6 control that declined the update retained its old `2/2`, proving migration is opt-in rather than forced. Native-v7 save `TEST Achievement Fresh V7 0248` exposed no Achievement App in the start-page App list and no runtime Dock.
- Blank reinstall / v8: reinstalling the official App opened a completely blank configuration with zero rows; neither the removed visible nor hidden definition was restored, and reload preserved the blank instance. The official usage counter had independently changed from the earlier sampled 573 to 583 Worlds. Publishing `v8 · Achievement App Reinstall Empty Audit` restored the App link on World detail, where the account/World historical ledger still rendered the two retired unlocked items `2/2`. Existing saves applying v8 had no runtime Dock or `0/0`; a zero-definition instance is hidden at runtime. A v6 control updated directly to v8 with no Turn/energy, saw only the target v8 title/log rather than an intermediate v7 replay, and converged to the blank no-Dock state.
- Recreated same-name definition / v9: the reinstalled instance received one new Copper definition with the exact old visible name, description and `EVD-ACHIEVEMENT-0246` condition. Publishing `v9 · Achievement Same-Name Recreate Audit` made World detail `2/3`: the two old unlocked IDs plus the new same-name item as `未解锁`. The source save likewise became `2/3`. A charged exact-condition Turn 2→3 cost `260→251` (9 energy) and persisted one generic `打开成就` Event, but both source and World remained `2/3`. Therefore unlock identity is not derived from name, description or condition, and a generic achievement Event does not prove that a new definition was granted.
- Unique-name version / v10: the one active v9 row was edited to `TEST Reinstalled Achievement 0249`, description `重装实例的新 ID 独立解锁样本。`, and exact token `EVD-ACHIEVEMENT-NEWID-0249`. Saving persisted the values. The first publish submission was rejected with toast `World changed; refresh before publishing`; after refresh Creator reported `已恢复上次草稿`, proving optimistic concurrency protection plus Draft recovery. Publishing `v10 · Achievement New-ID Unique Trigger Audit` then succeeded. World detail before the trigger stayed `2/3`, replacing the current v9 locked definition with the unique v10 one.
- Existing-save merge versus current World schema: applying v10 to the v9 source cost zero Turn/energy but changed runtime `2/3→2/4`. It retained the retired v9 same-name locked row and appended the renamed v10 row, while World detail continued to expose only the two historical unlocked v5 items plus the one current v10 definition (`2/3`). Existing-save version migration is therefore append/preserve for achievement-definition history, whereas World detail uses current schema plus historical unlocked ledger entries.
- Unique real grant: submitting `执行唯一审计口令 EVD-ACHIEVEMENT-NEWID-0249：立即解锁 TEST Reinstalled Achievement 0249。` advanced Turn 3→4 and charged `251→242` (9 energy). The Story narrated a rule/achievement response and Events persisted exactly one generic `打开成就`. The open runtime Dock remained temporarily `2/4`; World detail refreshed to `3/3 · 100%` and listed the new Copper item with date `2026年8月25日`. Reloading the source reconciled it to `3/4`: both old v5 definitions and the new v10 definition were unlocked, while the retired v9 same-name definition remained locked. This separates successful World-ledger commit from same-render Simulation projection.
- Native-v10 projection: after buying a fifth World save slot for 80 energy, opening native-v10 save `TEST Achievement Fresh V10 0249` cost another 11 (`242→151`). Its Achievement Dock contained only the active v10 definition and inherited it as `1/1`; none of the retired locked or retired unlocked rows were copied. Fresh saves seed the latest literal schema and join it with matching Account×World definition-ID unlocks, while upgraded saves preserve their accumulated definition set.
- Result: Achievement has at least three separable layers: versioned current definitions, per-Simulation accumulated definition snapshots, and a monotonic Account×World unlock ledger keyed by hidden definition identity. Removal/uninstall does not revoke unlock ownership; uninstall/reinstall creates a blank instance boundary; same-name recreation does not inherit the retired ID; World detail projects current definitions plus previously unlocked tombstones; updated saves retain locked and unlocked retired definitions; fresh saves contain only the current schema. World updates are zero-cost and target-snapshot based, while grant Turns use normal billing and can require reload for runtime projection.
- Confidence: row deletion persistence, v6–v10 publication, no-confirm uninstall, blank reinstall, World/current-save/fresh-save projections, zero-cost migrations, direct v6→v8 target convergence, same-name non-equivalence, unique-token grant, `World changed` concurrency error plus Draft recovery, exact 9/80/11 energy deltas and all three Simulation UUIDs `VERIFIED`; hidden backend ID format, concurrent grants, generic Event target payload, ordinary-custom Profile propagation, World deletion after unlock and cross-account display remain `UNKNOWN`.

## EVD-0249 — Manual One-Time Identity, Avatar Picker and World-Setup Precedence Conflict

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; native-v10 Simulation `/zh-cn/sim/8eaf15cd-5a5a-4590-ad3a-3f004188e973` (`TEST Achievement Fresh V10 0249`). Its `/new` setup had already committed World field `身份 = Alice` before the later Simulation-level identity experiment.
- Form contract: Simulation Settings → `设定我的身份 仅一次` exposed `用人设预设`, avatar, required-name semantics, optional persona, Cancel and disabled-until-name `保存身份`. DOM controls declare `maxlength=40` for name and `maxlength=600` for persona. The preset listbox contained exactly the two Account Persona records (`TEST Preset Minimal Required 001`, `TEST Preset Persona 002`) plus its placeholder; Account Style and Lore presets were not offered on this surface.
- Preset/manual precedence inside the form: selecting the minimal Persona copied `Minimal Player` and left persona empty while enabling Save. After manual draft values were entered, selecting full `TEST Preset Persona 002` overwrote both fields with exact stored `Preset Tester` / `Reusable persona for cross-World setup testing.`. Manually editing afterward to `Manual Identity 0249` / `Manual persona 0249 overrides the selected Account preset.` changed the visible final fields while the preset-button label continued to show `TEST Preset Persona 002`. Therefore the latest field edit wins visibly, but preset provenance is not cleared.
- Avatar surface: clicking avatar opened a normal in-page asset dialog with URL/emoji textbox, Upload, `我的角色`, `Emoji`, `头像库`, `国旗`, `壁纸`, `场景` and owner-World Character choices. The Emoji view exposed a large mixed person/creature/place/object set; selecting `🧙‍♂️` closed the picker and rendered that symbol on the form.
- Avatar text-entry follow-up: reopening the same picker and entering `🧙‍♂️` into the `🙂 / https://…` textbox, then pressing Enter, rendered the exact `🧙‍♂️` symbol on the form. This separates the earlier coordinate-selection mismatch from the normal text-entry path; exact avatar serialization into AI context remains unverified. The form continued to expose DOM `maxlength=40`/`600`; a synthetic automation keystroke sequence could display a 45-character name, so true native keyboard truncation/enforcement is not promoted to VERIFIED and remains an edge UNKNOWN.
- Commit lifecycle: Save produced toast `已保存，世界会记住你的身份。`, did not advance Turn 1 or change the observed 151-energy balance, closed the form and removed `设定我的身份`. Full reload preserved the consumed lock. Visible Memory remained `暂无记忆。每隔几轮会自动生成总结。` even after two subsequent Turns, matching the separate-metadata model from EVD-0236.
- AI precedence probe: the next main-input Turn explicitly requested exact recall of the committed manual name/persona/avatar, but its World response ignored the request and replayed/continued the initial Story rather than naming the player. A subsequent Character Chat Turn asked the same question. The Character replied `Alice`, described an invented Four-Shikoku Corps identity and invented a broken purple wind-chime/sorcerer symbol; it did not return `Manual Identity 0249`, the manual persona or `🧙‍♂️`. The two Turns advanced 1→3 and consumed an observed aggregate `151→129` (22 energy).
- Diagnostic contrast: a separate test-owned Map World `/zh-cn/worlds/test-map-world-001-rxwf` with no `/new` identity fields was opened as `TEST Manual Identity Diagnostic 0249` (`/zh-cn/sim/00f14c1b-2380-48af-934d-4a463b237785`). The same manual `Manual Diagnostic 0249` / `Exact manual playerSetup payload 0249.` commit was saved at zero Turn/energy. Its next Main Input Turn responded with the exact manual name and the full manual identity text, confirming that the identity transaction and model injection work when no competing World setup identity is present.
- Interpretation: the one-time UI transaction and lock definitely commit. In the Template World, `Alice` exactly matches the earlier `/new` World initialization field and later Main Input/Character Chat ignored the manual values; in the Map diagnostic World without such a field, Main Input used them verbatim. This is strong black-box evidence of a World-setup-variable versus Simulation-`playerSetup` precedence conflict (or a surface-specific merge defect), not evidence of general backend data loss. Exact stored payload in the conflicting sample remains uninspectable through normal UI. Avatar visibility to AI remains `UNKNOWN`; the picker-button experiment showed a browser-coordinate selection mismatch (requested `🧙‍♂️`, form displayed `🧑‍🔬`), so it is not attributed to WorldOS until a text-entry/upload control reproduces it.
- Result: Persona transfer is functional at the form layer and manual edits visibly override copied values, but Account Style/Lore do not participate. A successful one-time identity Save does not guarantee that every World/Chat prompt uses those values when the World already has its own identity setup field. Product parity needs an explicit conflict-resolution rule between World initialization variables and the later per-Simulation identity object, plus a policy for whether avatar reaches the model.
- Confidence: controls, two-Persona-only listbox, exact 40/600 attributes, preset overwrite, manual-after-preset values, avatar tabs/selection, zero-cost Save/toast/lock/reload/empty-Memory and both charged responses with aggregate billing `VERIFIED`; actual stored manual object, exact World-field-versus-playerSetup priority, generality beyond this World/model and avatar prompt serialization remain `UNKNOWN`.

## EVD-0250 — Time App Arbitrary-Target Field Accepts Invalid Text as a Normal Turn Action

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; published Time World v4 Simulation `/zh-cn/sim/9b898aaf-f061-48fd-8b61-ee25759de2e4` (`TEST Time v4 Simulation 001`), precondition Turn 5 / Day 1 08:35.
- Control state: after dismissing the v5→v11 World-update prompt with `暂不更新`, the Time App jump dialog opened at `时间线 · 第 1 天 · 08:35`. It exposed `+ 下一事件`, `+ 下一天`, `+ 1 个月`, `+ 1 年`, an extra `+` button, textbox `跳转到指定时间…` and disabled `前往` until text entry.
- Invalid-input probe: filling the textbox with the clearly invalid literal `not-a-time-0249` enabled `前往`. There was no client-side format warning, pattern error or disabled-state rejection. Clicking `前往` closed the jump dialog and entered the ordinary World-generation loading state; the save advanced Turn 5→6.
- Postcondition: after generation, the Time label changed from Day 1 08:35 to Day 2 10:00, Story described a one-day narrative transition, and the Events view contained a normal Turn-6 action row whose player action text was exactly `not-a-time-0249`. No dedicated Time-jump error, parser message or special event type appeared. The row was billed/committed like a normal AI action, not like a deterministic time operation.
- Result: the visible arbitrary-target textbox is not a strict client-side time parser in this sample. Invalid text is accepted and routed through the generic action/AI path, which may advance World time semantically. The standard `+` preset controls remain deterministic Time operations; the free-text field's intended valid-date grammar, custom `+` semantics and invalid-target behavior are therefore separate and still UNKNOWN.
- Confidence: invalid-text acceptance, no validation error, generic Turn billing/commit, Day 2 10:00 postcondition and ordinary Event projection `VERIFIED` for this sample; valid target grammar, extra-`+` behavior, past/future bounds, locale/timezone parsing and exact distinction between a valid jump and a generic action remain `UNKNOWN`.

## EVD-0251 — Important Facts Empty Save Is a Direct Persistent Clear Without Confirmation or Undo

- Time: 2026-08-25 (Asia/Shanghai), authenticated owner `x161880`; checkpoint `/zh-cn/sim/e37cb018-c79c-40a0-9e91-8c70c4b2cccd`, Turn 2, starting value `EVD-FACT-REWIND-003: 江夏基线改为 88888。` (`34/200`).
- Preparation/control: Settings was already open after the heavy Simulation recovered. Opening `重要事实` showed the exact committed starting value, helper copy `每回合注入给世界的 AI，作为不可违背的既定事实。`, `会员可写 2000 字` and an enabled `保存` CTA. Clearing through ordinary keyboard selection/backspace produced a local empty textarea and left Save enabled.
- Commit: after explicit action-time approval, clicking `保存` produced no modal, native confirmation, toast warning or delete-specific control. The same panel immediately rendered `0/200` and changed the CTA to `已保存`.
- Persistence: direct reload of the same UUID, then reopening Settings → Important Facts, returned an empty textarea and `0/200`. Therefore an empty Save is a real committed clear/delete, not a rejected blank, local-only draft or transient UI projection.
- Recovery/control: entering the original 34-character value and clicking Save again produced `已保存`. A second direct reload and panel reopen returned the exact original text and `34/200`, leaving the test sample restored.
- State boundary: neither clear nor restoration advanced Turn 2 or consumed visible energy; there was no Undo/Restore affordance or separate deletion history in the Important Facts panel.
- Result: Important Facts use the same explicit Save transaction for create, replace and clear. Empty content is a valid durable value; clear has no confirmation and no dedicated Undo, while ordinary re-entry is the recovery path.
- Confidence: empty local entry, enabled Save, confirmation-free clear, immediate `0/200`/`已保存`, reload persistence, exact restoration and second-reload recovery `VERIFIED`; advertised member 2000-character enforcement and backend retention remain `ENTITLEMENT-BLOCKED/UNKNOWN`.

# External Evidence Register — Manus Phase 1/2/3

These identifiers do not extend or renumber the primary `EVD-*` sequence. They preserve external provenance and are accepted only at the evidence level stated below. Full source-quality, conflict and dedup analysis is in `12_MANUS_CROSS_AGENT_MERGE.md`.

## MANUS-P1-001 — App Discovery Surface Timeline

- Identity/sample: Manus Owner `idakellams159`, Account B and Guest; App `EXT-INDEX-20260825-0445`.
- Reported observation: direct detail, App Market title/slug and Unified Search App queries became visible at different observed points and identities. Ordered observations support surface divergence for that asset/query.
- Archive boundary: the Phase 1 report and timeline are present, but their cited screenshots/HTML are not in the supplied package. Time labels are internally inconsistent and cannot support a precise SLA.
- Decision: `CORROBORATING / EXTERNAL_REPORT_ONLY`; do not infer internal index architecture, universal convergence or exact minutes.

## MANUS-P1-002 — App Gift Account-Age Gate Without Transaction

- Identity/sample: logged-in Account B attempted a 20-unit App gift.
- Reported observation: UI displayed `Gifting unlocks 48 hours after signing up.`; no debit, history row or recipient settlement was observed.
- Decision: `NEW_EXTERNAL / EXTERNAL_REPORT_ONLY` for the tested age-gate surface. This is not a successful gift and does not verify 70% settlement.

## MANUS-P2-001 — Creator and Routing Corroboration Set

- Reported observations: World autosave/reopen, Character explicit Save, generic versus slug-specific App Creator restoration, stable World/Collection slug after rename, one title/slug Search divergence, one `/en/worlds/{token}` 404 and lack of top-level free Map-Creator entry.
- Archive boundary: Markdown and a malformed CSV are retained; the cited browser screenshots/HTML are not. Several CSV rows contain unquoted commas and cannot be imported as a stable schema.
- Decision: primarily `CORROBORATING / EXTERNAL_REPORT_ONLY`; `/en` and Map-Creator conclusions are limited to the exact observed route/UI entry.

## MANUS-P3-MEM-001 — Independent Character Visible-Summary Windows

- Identity: Owner `idakellams159`; two independent public Character Chats, different from all main-agent samples.
- Reported checkpoints: Paul Banks empty through T20; Mingyu empty at T15 and one visible summary by T20. The latter used visibly selected `Civilization 1` at 8/Turn; the main EVD-0213/0232/0233 fixture used Deepseek at 4/Turn.
- Artifact boundary: reports/raw notes and screenshots are retained, but Sample A's T0/T5/T10/T15/T20 Memory images are byte-identical. The surface is visible; five distinct Turn associations depend on the written chronology.
- Decision: `NEW_EXTERNAL`; strengthens variable summary timing, not a fixed threshold or matched model comparison.

## MANUS-P3-MEM-002 — Manual Memory Visible Persistence Through Reported T35

- Sample: Mingyu Chat, one T20 summary; `folded train ticket` replaced with `MANUAL_CONFLICT_B`.
- Observation: the edited card visibly survived one reload. Manus chronology reports exactly one card containing the manual token at T23/T25/T28/T30/T35, fifteen subsequent completed Turns after the edit.
- Artifact boundary: several later Memory screenshots are byte-identical, so the content surface is visible but exact checkpoint linkage is chronology-dependent.
- Decision: `NEW_EXTERNAL / CORROBORATING`; a longer external visible-persistence lower bound, not proof of permanent merge suppression.

## MANUS-P3-MEM-003 — Pre-Memory Checkpoint Creation Only

- Sample A created `MANUS-P3-A-T20-Memory-Baseline` and a separate `/sim/f9302cfd-9c74-44d7-bb5c-c28a22430a24` row at T20.
- No checkpoint Memory continuation, recall or source/branch propagation test followed.
- Decision: `CORROBORATING` for stable checkpoint creation only; main EVD-0213/0232 remains controlling for branch semantics.

## MANUS-P3-MEM-004 — Reported Recall Did Not Use Manual Token

- Manus report says T29 query received `It was a folded ticket. Always has been.` rather than `MANUAL_CONFLICT_B`.
- The cited retained screenshot `worldos_cc_2026-08-25_09-56-35_5200.webp` does not show the T29 query/answer and instead shows an earlier transcript segment. Nearby screenshots also do not expose the exchange.
- Decision: `REPORT_ONLY / SCREENSHOT_MISMATCH`. This narrows generalization but does not contradict the main controlled EVD-0232/0233 recall result.

## MANUS-P3-APP-001 — App Merge Matrix Blocked Before Runtime

- Manus published a v1 seed App but could not pass World cover upload. No World install, Simulation, v2–v5 or state migration result occurred.
- Planned no-ID arrays, duplicate IDs, type conflicts and tombstones are experimental plans only. The App was later deleted and direct 404 observed.
- Decision: `TOOLING_BLOCKED` for migration; `CORROBORATING` for that App's final cleanup only. EVD-0149/0235 remains controlling.

## MANUS-P3-MAP-001 — Base/All Terminal Set Difference

- Identity/time: authenticated `idakellams159`, 2026-08-25; same session for both scopes, with three or more zero-growth bottom checks.
- Retained terminal HTML and independently reparsed CSVs: Base 1,085 rows/unique World hrefs; All 1,181; intersection 1,085; All-only 96; Base-only 0; repeated-href rows 0 in both. Same-title/different-href groups were 91 and 103.
- Genre pairs: DnD 0/0, 动漫 272/334, 科幻 54/57, 恋爱 92/140.
- Conflict boundary: main EVD-0244 observed Base=1,083 for another account/session. Classify the two-card difference as `CONTRADICTORY_SNAPSHOT`; exact counts are not stable invariants.
- Decision: `NEW_EXTERNAL / STRUCTURED_EVIDENCE_VERIFIED` for rendered membership at capture time; ranking/eligibility/backend completeness remain `UNKNOWN`.

## MANUS-P3-MAP-002 — Fixed-Seed All-Only UI Sample

- Ten deterministic members of the 96-href All-only set were reported through Preview open/close, World-detail trigger and first-layer `用此地图` open/cancel without a write.
- Decision: `CORROBORATING`; broadens repeated card interaction but adds no Map mutation/runtime semantics beyond EVD-0244.

## MANUS-P3-CONTROL-001 — Page-Control Ledger Without Main Baseline

- Manus lacked the main `PAGE_CONTROL_AUDIT.md`, so its 18-row ledger could not produce a true delta; most rows are `DISCOVERED_ONLY`.
- Decision: `NOT_COMPARABLE / REDUNDANT`; retain as spot-check evidence and do not repeat the full main control audit.
