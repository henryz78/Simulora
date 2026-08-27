# Master Feature Inventory

> 每个可见按钮、菜单、操作或主要系统行为最终必须映射到一个 Feature ID。

## 已登记功能

### NAV-001 — 全局左侧导航

- Feature ID: `NAV-001`
- Feature Name: 全局左侧导航
- Location: 登录态桌面端全站左侧栏
- Entry Point: 打开 `/zh-cn`
- Purpose: 进入世界、角色、我的、社区、App 市场、地图、升级等主系统
- Preconditions: 当前观察为已登录桌面端
- User Action: 点击对应导航项
- UI Reaction: 导航到对应顶级页面
- Backend-visible Result: 无已确认写入
- Persistent State Change: 未观察到
- Related Features: `NAV-002`, `ACCOUNT-001`
- Edge Cases: 移动端布局待测；未登录态待测
- Confidence: `TESTED`（首页可见，子页逐项待测）
- Evidence: `EVD-0001`

### NAV-002 — 创作入口

- Feature ID: `NAV-002`
- Feature Name: 创作菜单
- Location: 左侧栏顶部“创作”按钮
- Entry Point: 打开 `/zh-cn`
- Purpose: 创建 World、Character、App
- Preconditions: 已登录
- User Action: 点击“创作”
- UI Reaction: modal with `创建世界` (button), `创建角色` → `/characters?create=1`, `创建 App` → `/apps/create`; Map creation is not present here
- Backend-visible Result: `UNKNOWN`
- Persistent State Change: 无，除非提交创建流程
- Related Features: Creator 系列
- Edge Cases: 未登录态、移动端待测
- Confidence: `TESTED`
- Evidence: `EVD-0001`

### EXPLORE-001 — 首页内容发现

- Feature ID: `EXPLORE-001`
- Feature Name: 首页 / 世界广场多模式内容发现
- Location: `/zh-cn`, `/zh-cn/worlds`
- Entry Point: WorldOS Logo / 首页
- Purpose: 通过精选轮播、推荐多分区、热门、日榜、关注、标签/受众/App facets、排序、最多回合、最新更新等发现 World
- Preconditions: 无已知特殊前置；当前为登录态
- User Action: 浏览、切换推荐/热门/日榜/关注、点击标签/受众/App、切换全局或分区排序、操作精选轮播或点击卡片
- UI Reaction: Recommendation 为 35 个独立懒加载/局部排序行；其他模式为固定或分页列表；genre 进入单列表 facets；所有筛选保持 `/worlds` URL
- Backend-visible Result: `UNKNOWN`（推荐算法）
- Persistent State Change: 浏览历史可能写入，待验证
- Related Features: `WORLD-001`, `SEARCH-001`, `COLLECTION-001`, `PROFILE-001`
- Edge Cases: 排名公式、个性化与匿名/跨会话结果差异仍待测；Random 在同一会话重复进入未重新洗牌
- Confidence: `TESTED controls / PARTIAL recommendation algorithm`
- Evidence: `EVD-0001`, `EVD-0240`

### WORLD-001 — World 卡片快速操作

- Feature ID: `WORLD-001`
- Feature Name: World 卡片“改编 / 立即开始”
- Location: `/zh-cn` 多个世界列表区块
- Entry Point: 首页 World Card
- Purpose: 直接 Remix 或开始 Simulation
- Preconditions: 已登录；具体余额/内容等级前置待测
- User Action: 点击“改编”或“立即开始”
- UI Reaction: 待逐按钮实际验证
- Backend-visible Result: `UNKNOWN`
- Persistent State Change: 可能创建 Draft 或 Simulation，待测
- Related Features: Remix、Simulation 初始化
- Edge Cases: 嵌套按钮位于可点击卡片内部；地图 World 显示地图标记
- Confidence: `PARTIAL`
- Evidence: `EVD-0001`

### COLLECTION-001 — Collection 发现目录

- Feature ID: `COLLECTION-001`
- Feature Name: 热门合集与独立目录发现
- Location: `/zh-cn`, `/zh-cn/collections`
- Entry Point: 首页“热门合集”/“查看全部”或直接进入合集目录
- Purpose: 以合集组织多个 World，并按文本、热度、新旧和所有权发现合集
- Preconditions: 公共目录无已知特殊前置；`作者：我的合集` 需要登录
- User Action: 点击合集卡片/查看全部；搜索标题、介绍、标签或创作者；切换热门/最新和全部/我的合集；清除筛选
- UI Reaction: 首页卡片进入合集详情；目录当前一次性渲染 56 张整卡链接。筛选/query 写入 URL、reload 保留；无结果显示数量 0、`没有找到合集`、帮助文案和清除按钮
- Backend-visible Result: 无已确认写入
- Persistent State Change: URL query state 持久到 reload；未观察账户写入
- Related Features: `COLLECTION-002`–`COLLECTION-005`, Search, Visibility, Profile
- Edge Cases: 公共全部目录省略链接可见/仅自己；Owner `我的合集` 同时包含 Public/Link-visible/Only-me，卡片无可见性徽章。当前 56 条在首屏 DOM 全量存在，滚底稳定且无 loader/end copy；排序公式与索引 SLA 仍未知
- Confidence: `TESTED / PARTIAL ranking`
- Evidence: `EVD-0001`, `EVD-0117`, `EVD-0191`, `EVD-0195`, `EVD-0241`

### PROFILE-001 — 首页热门创作者

- Feature ID: `PROFILE-001`
- Feature Name: 热门创作者发现
- Location: `/zh-cn`
- Entry Point: 首页“热门创作者”卡片
- Purpose: 进入 Creator Profile
- Preconditions: 无已知特殊前置
- User Action: 点击创作者卡片
- UI Reaction: 导航至 `/zh-cn/profile/{uuid}`
- Backend-visible Result: 无已确认写入
- Persistent State Change: 未观察到
- Related Features: Follow、Community、Creator metrics
- Edge Cases: 排名指标含义待确认
- Confidence: `PARTIAL`
- Evidence: `EVD-0001`

### ACCOUNT-001 — 登录账户菜单

- Feature ID: `ACCOUNT-001`
- Feature Name: 顶栏账户菜单
- Location: 全局顶栏右侧
- Entry Point: 点击头像/显示名/邮箱区域
- Purpose: 账户、设置、退出等入口（具体项目待展开）
- Preconditions: 已登录
- User Action: 点击账户按钮
- UI Reaction: 待实操记录
- Backend-visible Result: 无，除非执行设置/退出
- Persistent State Change: 待测
- Related Features: Settings、Models、Credits、Privacy
- Edge Cases: 匿名态待测
- Confidence: `PARTIAL`
- Evidence: `EVD-0001`

### CHAR-001 — 角色库发现与即时搜索

- Feature ID: `CHAR-001`
- Feature Name: 角色库 Browse / Search / Filter
- Location: `/zh-cn/characters`
- Entry Point: 左栏“角色”或创作菜单“创建角色”
- Purpose: 浏览可复用角色并按关键词、类别、性别、排序、时间范围筛选
- Preconditions: 页面可公开浏览；当前为登录态
- User Action: 输入关键词后按 Enter；点击类别、性别、排序、时间范围
- UI Reaction: 搜索结果更新；无匹配时显示“还没有角色”；筛选后显示加载再刷新卡片
- Backend-visible Result: 结果列表变化；无私有数据读取
- Persistent State Change: 无（除收藏/关注/添加等动作）
- Related Features: `CHAR-002`, `CHAR-003`, `CHAR-004`
- Edge Cases: 搜索为同页 debounce 筛选；无匹配时显示“还没有角色”，不需要 Enter，URL 不变化。已打开详情 Drawer 会与列表同时存在，读取 DOM 时需区分两者。
- Confidence: `TESTED`
- Evidence: `EVD-0005`

### CHAR-002 — 角色详情与社交统计

- Feature ID: `CHAR-002`
- Feature Name: Character Detail
- Location: 角色卡点击后同页详情状态（当前 URL 未改变）
- Entry Point: 角色库卡片主体
- Purpose: 查看角色设定、作者、标签、回合电量范围、评论、排行榜、支持者、聊天与添加到世界
- Preconditions: 可访问公开角色
- User Action: 点击角色卡主体；切换评论/排行榜/支持者
- UI Reaction: 详情面板替换/追加到角色库页面；排行榜显示开局数/总轮次；支持者可为空
- Backend-visible Result: 读取公开统计
- Persistent State Change: 无（除关注/收藏）
- Related Features: `CHAR-003`, `CHAR-004`, `SIM-*`
- Edge Cases: 详情为同一路由状态；评论发送按钮空文本时禁用
- Confidence: `TESTED`
- Evidence: `EVD-0006`

### CHAR-003 — 角色关注与收藏

- Feature ID: `CHAR-003`
- Feature Name: Follow Creator / Favorite Character
- Location: Character Detail
- Entry Point: 点击“关注”或 favorite 数字按钮
- Purpose: 关注角色作者、收藏角色
- Preconditions: 登录态
- User Action: 点击按钮
- UI Reaction: “关注”→“已关注”；收藏计数 38→39（本次测试）
- Backend-visible Result: 公开统计即时变化
- Persistent State Change: 账号关注/收藏集合变化
- Related Features: Community、Mine、Profile
- Edge Cases: 撤销动作待确认后执行；代表性外部状态需临界确认
- Confidence: `TESTED`
- Evidence: `EVD-0007`

### CHAR-004 — 新建角色表单

- Feature ID: `CHAR-004`
- Feature Name: Create Character Form
- Location: `/zh-cn/characters?create=1`
- Entry Point: 创作菜单“创建角色”或角色库“新建角色”
- Purpose: 创建可在任意 World 使用的角色卡
- Preconditions: 登录态；名称与人设必填
- User Action: 填写名字、人设；可选简介、性别、最多 3 类别、头像、可见性、Komiko 导入
- UI Reaction: 创建按钮空态/仅名字时禁用；人设完成后启用；第四类别按钮禁用
- Backend-visible Result: 提交后待测
- Persistent State Change: 待实际提交
- Related Features: `CHAR-005`, `CHAR-006`, World / Simulation
- Edge Cases: 私有标注会员；Komiko 导入按钮空 URL 禁用；头像选择器含多资源库与捏脸
- Confidence: `TESTED`（未提交）
- Evidence: `EVD-0002`, `EVD-0008`

### CHAR-005 — 角色头像资源选择器

- Feature ID: `CHAR-005`
- Feature Name: Avatar Picker / Face Maker
- Location: 新建角色表单头像按钮
- Entry Point: 点击默认 🙂 头像
- Purpose: 选择 Emoji、头像库、国旗、壁纸、场景，或自定义/AI 捏脸
- Preconditions: 新建角色表单
- User Action: 切换资源页、搜索素材、选择素材、打开捏脸
- UI Reaction: Emoji 列表、头像库约 360 图、国旗约 242 图、壁纸约 8 个、场景约 90 个；捏脸编辑器显示多个维度
- Backend-visible Result: 选中值写入尚未提交的表单
- Persistent State Change: 未提交，无
- Related Features: `CHAR-004`
- Edge Cases: 捏脸“生成”显示 30 电量且未触发；上传/外部 URL 入口待测
- Confidence: `TESTED`
- Evidence: `EVD-0009`

### APP-001 — App Market 官方目录

- Feature ID: `APP-001`
- Feature Name: App Market Browse / Install
- Location: `/zh-cn/apps`
- Entry Point: 左栏“App 市场”
- Purpose: 浏览、筛选、搜索并安装官方/社区 App 到创建的 World
- Preconditions: 登录态；安装具体 App 的目标 World 选择待测
- User Action: 选择分类或点击 App 卡片/安装
- UI Reaction: 卡片显示 creator、使用世界数、评分、分类、收藏/安装；卡片可打开详情 Drawer/状态
- Backend-visible Result: 安装动作待测
- Persistent State Change: 待测
- Related Features: App Runtime、World Creator、Simulation
- Edge Cases: 当前 App 市场初始 DOM 可能短暂空白，约 2.5s 后完整加载；搜索框待测
- Confidence: `TESTED`
- Evidence: `EVD-0010`

### MAP-001 — 地图库发现与接入入口

- Feature ID: `MAP-001`
- Feature Name: Map Library
- Location: `/zh-cn/maps`
- Entry Point: 左栏“地图”
- Purpose: 浏览有底图/全部/我的、分类标签和地图卡片
- Preconditions: 登录态；当前可见公开地图 World
- User Action: 切换有底图/全部/我的与 36 个题材；按标题/creator 搜索；滚动分页；查看大图并缩放/拖拽；用此地图新建或装入已有 World
- UI Reaction: 16-card silent batches；有底图终态总数是动态快照（主账号 1,083；Manus 独立账号 1,085），外部同会话 All=1,181 且是 Base 的 96-href 严格超集；无结果显示 `暂无地图`。卡片链接来源 World；大图为同页 zoom/pan overlay；用此地图分为新建和已有 World，并提供全部/仅底图/仅区域范围
- Backend-visible Result: 已有 World 写入未发布 Map App 草稿并提示需发布新版本；新建分支先生成公开 v1，再把 Map 放入未发布 v2 草稿
- Persistent State Change: Map definition 持久进入目标 World Draft；scope/query/genre 不入 URL且 reload 重置
- Related Features: `MAP-002`, World Creator, Simulation
- Edge Cases: `装入并编辑` 成功写入却停留 `/maps`；已有地图 badge 不是完整信号；All/Base 排名与 eligibility 仍未知，1,083↔1,085 两卡差异保留为动态快照问题；Map 卡片不是独立 URL
- Confidence: `TESTED / PARTIAL ranking/index`
- Evidence: `EVD-0011`, `EVD-0028`, `EVD-0090`, `EVD-0244`, `MANUS-P3-MAP-001–002`

### COMMUNITY-001 — 社区排行榜与指标切换

- Feature ID: `COMMUNITY-001`
- Feature Name: Community Rankings
- Location: `/zh-cn/community`
- Entry Point: 左栏“社区”
- Purpose: 展示 QQ/微信群、创建世界入口、社交外链及多维用户排行榜
- Preconditions: 可访问社区页
- User Action: 切换九个用户榜；滚动五条 World 榜单；打开 QQ 二维码/复制群号、复制微信号；打开创建 World CTA
- UI Reaction: 前八个用户榜各替换为 20 条 Profile 链接，支持者榜当前 1 条；单位按维度变为回合/个世界/次模拟/收藏/电量/美元。五条 World 榜各含 12 张带改编/立即开始的横向卡。榜单 Tab 状态不写 URL，reload 回到玩家模拟回合
- Backend-visible Result: 读取公开统计
- Persistent State Change: 无
- Related Features: Profile、Creator Economy、World Discovery
- Edge Cases: 排名公式/更新时间未知；移动宽度隐藏箭头但支持横向手势，触底后只保留反向控制；微信复制无可见反馈
- Confidence: `VERIFIED controls / PARTIAL ranking formula`
- Evidence: `EVD-0012`, `EVD-0038`, `EVD-0100`, `EVD-0242`

### CREDIT-001 — 定价、电量与创作者分成说明

- Feature ID: `CREDIT-001`
- Feature Name: Zaps/Credits Pricing Surface
- Location: `/zh-cn/pricing`
- Entry Point: 左栏“升级”或价格链接
- Purpose: 说明每回合消耗电量、免费领取、加量包、订阅、自备 API、赞助及创作者 10% 分成
- Preconditions: 可访问定价页；购买本次不执行真实支付
- User Action: 切换一次性/订阅/自备 API、国内/国际支付页签
- UI Reaction: 显示 ¥4.9–¥718 加量包、订阅/自备 API说明、FAQ 与赞助金额
- Backend-visible Result: 无（未点击购买）
- Persistent State Change: 无
- Related Features: Model System、Turn Cost、Creator Economy
- Edge Cases: 真实付款确认页需单独确认；价格/汇率随时间变化
- Confidence: `TESTED`
- Evidence: `EVD-0013`

### WORLD-002 — World Detail / Saves / Versions

- Location: `/zh-cn/worlds/{slug}`
- Purpose: 查看 World、Creator、统计、成本、Characters/Apps、版本、存档、相似内容
- User Action: Start/Continue、Share、Edit、Delete、Remix、Favorite、Collection、Save rename/delete
- UI Reaction: 详情页及 side save list；owner actions only where applicable
- Persistent State: Start creates Simulation; other lifecycle actions mutate owned/social state
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0022`, `EVD-0029`, `EVD-0038`

### WORLD-003 — World Creator Draft / Preview / Publish

- Location: `/zh-cn/worlds/create`, `/zh-cn/worlds/{slug}/edit`, `/preview`
- Purpose: 配置 metadata、visibility、remix permission、Characters、setup、Apps、rules、opening、advisor、layout
- Behavior: auto-save Draft; Preview is read-only Turn 0; publish creates vN with changelog
- Edge Cases: fresh template selection appears no-op in current DOM; invalid/empty fields pending
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0014`, `EVD-0017`, `EVD-0022`, `EVD-0029`, `EVD-0040`

### WORLD-004 — World Quality / Badges

- Location: `/zh-cn/worlds/quality-guide`
- Purpose: public Craft/Popular/Feature-badge rules and self-checker
- Behavior: hard gates, 145-point Craft score, 110-point Popular score, App-derived feature badges
- Confidence: `TESTED`
- Evidence: `EVD-0051`

### REMIX-001 — World Remix

- Location: World detail → `改编`
- Behavior: immediate new slug/public v1/source attribution; copies full Creator configuration
- Persistent State: independent owned World and version line
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0022`

### VERSION-001 — Existing Simulation World Update

- Location: Simulation Settings/update dialog
- Behavior: old save stays on applied version; `暂不更新` suppresses current target; later version re-prompts; apply can add/remove Apps without resetting Story/Turn
- Edge Cases: content-only Hogwarts update reproduced no-op
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0029`, `EVD-0031`

### CHAR-006 — Character Create/Edit/Visibility

- Location: `/zh-cn/characters?create=1`, detail → Edit
- Behavior: actual create, async edit persistence, public detail, private member wall
- Confidence: `TESTED`
- Evidence: `EVD-0021`

### CHAR-007 — Character Remix / Add to World

- Location: Character detail
- Behavior: L1/L2 library copies; App-specific configuration copied; current copies lack visible attribution; Add to World copies editable definition into World Draft
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0033`, `EVD-0052`

### SIM-001 — Simulation Initialization and Runtime Shell

- Location: `/zh-cn/worlds/{slug}/new`, `/zh-cn/sim/{uuid}`
- Purpose: initialize player and run persistent World instance
- UI: Events/Memory/Advisor/Settings, Story, Apps, action composer, Dock
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0015`, `EVD-0025`, `EVD-0030`, `EVD-0226`

### TURN-001 — Global Turn Engine

- Triggers: main action, Character Chat, Map action, Shop purchase
- Behavior: increment Turn, global generating lock, Story/Chat response, Event Delta, cross-App refresh; main input and World-local Chat share the same Simulation Turn/save boundary
- Non-trigger: iframe-local DOM interaction
- Confidence: `TESTED`
- Evidence: `EVD-0030`, `EVD-0042`, `EVD-0043`, `EVD-0226`

### EVENT-001 — Events / Timeline

- Location: Simulation → Events
- UI: group by Turn/time/mainline, history paging, export, per-Turn action/response/Delta
- Behavior: historical state view is read-only and can mix current configuration/Memory
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0018`, `EVD-0020`, `EVD-0041`

### MEMORY-001 — Automatic / Editable Memory

- Location: Simulation → Memory
- Behavior: empty state, auto-generated cross-App summaries, edit/cancel/save, affects AI context
- Threshold: first summary at Hogwarts T10 but Map T6, so variable by content/World
- Confidence: `VERIFIED threshold variability / PARTIAL long-term`
- Evidence: `EVD-0017`, `EVD-0045`

### SAVE-001 — Checkpoint / Slot / Resume

- Location: Simulation Settings and World detail saves
- Behavior: independent Simulation URL, rename/delete, three free slots, paid expansion, resume
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0019`, `EVD-0020`

### REWIND-001 — Rewind / Branch

- Behavior: restore selected Turn Story/Chat/Wallet/Inventory/Relations/World State/Memory; Credits not refunded; a dynamic App installed after the target snapshot loses active installation and +2 billing, although its Dock/Installed row can remain stale until reload; old future truncated after continuation
- Confidence: `TESTED`
- Evidence: `EVD-0020`, `EVD-0204`

### APP-002 — App Detail / Version / Online Preview

- Location: `/zh-cn/apps/{slug}`
- UI: creator, usage, tags, favorite, edit/delete/install, changelog, rating/comments, iframe preview
- Confidence: `TESTED`
- Evidence: `EVD-0023`, `EVD-0032`

### APP-003 — App Creator / Runtime Configuration

- Location: `/zh-cn/apps/create[?slug=]`
- Behavior: AI/direct HTML, iframe, slug/metadata, JSON, AI instruction, refresh, Event templates, Draft/version
- Edge Cases: published `存草稿` created public versions; malformed JSON silently normalized to `{}`
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0023`, `EVD-0032`, `EVD-0050`

### APP-004 — Install / World Draft / Simulation

- Behavior: select World, configure instance, add to World Draft, publish World, apply version to old Simulation; uninstall similarly version-gated
- Confidence: `TESTED`
- Evidence: `EVD-0031`

### APP-005 — App Market Catalog

- Behavior: client-side search plus 18 exclusive category peers; category/query intersect and do not write URL state. Each category opens at 24 cards and silently appends 24-card pages on scroll. The tested authenticated-owner terminal totals were All=341 and Community=291, with no loading/end label; switching category resets to top/24 rather than filtering the already-rendered full list. Title search can find owner App while slug fails; cards expose usage/rating/tags/favorite/install.
- Confidence: `TESTED catalog controls/pagination / PARTIAL ranking and per-App behavior`
- Evidence: `EVD-0047`, `EVD-0218`, `EVD-0238`, `EVD-0239`

### APP-006 — Direct / Market / Unified-Search Projection Split

- Location: `/zh-cn/apps/{slug}`, `/zh-cn/apps`, `/zh-cn/worlds/search?...&tab=apps`
- Behavior: direct detail resolution, dedicated App Market inclusion and Unified Search inclusion can disagree; the tested relisted App is title-searchable in Owner Market, absent by slug and absent from Owner Unified Search while an official control is searchable. Guest/non-owner direct access can coexist with discovery omission.
- Confidence: `TESTED / backend eligibility UNKNOWN`
- Evidence: `EVD-0145`, `EVD-0190`, `EVD-0218`

### ACHIEVE-001 — Configured World Achievements

- Location: `/zh-cn/apps/achievements`, World Creator App configuration, World detail, `/zh-cn/sim/{uuid}`
- Behavior: creators define visible/hidden achievements with icon, Copper/Silver/Gold rarity, player description and AI-only trigger. Unlock Events originate in a charged Turn; runtime/World projections may require reload to synchronize. Unlock ownership is Account×World and hidden-definition-ID keyed: it appears in fresh independent Simulations and survives Rewind, definition removal and App uninstall/reinstall. Existing-save version updates preserve accumulated definition snapshots, World detail combines current definitions with unlocked tombstones, and fresh saves use the latest literal schema plus matching unlocks.
- Edge Cases: hidden metadata is suppressed in runtime before unlock but Creator configuration is readable; ordinary custom unlock did not appear in the owner's Profile despite official copy; exact duplicate re-trigger preserves counts but leaves one generic Event; same-name recreation is a distinct identity; blank reinstall is hidden at runtime; a v9→v10 edit accumulated a retired locked row only in the upgraded save. Concurrent grants, World-delete ledger lifetime and external viewer semantics remain unknown.
- Confidence: `VERIFIED core / PARTIAL peripheral`
- Evidence: `EVD-0246`, `EVD-0247`, `EVD-0248`

### LANDING-001 — Competitor / Intent Landing Pages

- Location: `/zh-cn/pax-historia`
- Behavior: localized competitor-comparison hero/table/FAQ plus a curated feed of ordinary World cards; hero anchor jumps to `#worlds`, bottom CTAs enter the main World directory.
- Confidence: `TESTED / sibling-route inventory UNKNOWN`
- Evidence: `EVD-0220`

### MAP-002 — Map Creator / Runtime

- Behavior: regions/factions/ownership/markers/settings; runtime Drawer, neighbor navigation, shortcut/free-text action, Map/Event/Wallet/Inventory/Quest sync
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0028`, `EVD-0030`, `EVD-0046`

### CHAT-001 — Character Chat Turn

- Behavior: select Character, message/image/edit/new-chat; send consumes Turn, locks Apps, appends contextual response/message and can update relationship state; World-local Chat uses a separate composer/explicit Send while committing to the parent World Simulation
- Confidence: `TESTED / PARTIAL`
- Evidence: `EVD-0042`, `EVD-0044`, `EVD-0226`

### ECON-001 — Wallet / Shop / Inventory

- Behavior: Event-driven balance/transactions/items; Shop buy consumes Turn and updates Story, stock, Wallet, Inventory
- Confidence: `VERIFIED repeated purchase propagation / PARTIAL semantics`
- Evidence: `EVD-0030`, `EVD-0043`

### STAT-001 — Stats / Relationships / Progression

- Behavior: numeric/enumerated World-specific stats, ranks, relationship trust/affection/bond/mood shared with Chat
- Confidence: `TESTED`
- Evidence: `EVD-0044`

### MINE-001 — Works / History / Object Management

- Location: `/zh-cn/sims`
- Behavior: client-local History/Works plus type/subscope tabs. Current finite projections: History World19/Character4; Works World created5/favorite0, Character created18/favorite1, Collection3, App created3/favorite0. History cards link UUID and expose More→Rename/Delete; Works cards reuse type-specific controls/drawers. URL stays `/sims` and reload resets History→World
- Confidence: `TESTED finite IA / PARTIAL lifecycle and cache invalidation`
- Evidence: `EVD-0026`, `EVD-0051`, `EVD-0221`, `EVD-0223`, `EVD-0243`

### SEARCH-001 — Unified Cross-object Search

- Location: `/zh-cn/worlds/search?q=`
- Behavior: debounce; World/Character/User/App; type tabs; recent searches; empty state
- Confidence: `TESTED`
- Evidence: `EVD-0035`

### COLLECTION-002 — Collection Creator / Ordering / Visibility

- Behavior: up to 100 Worlds, search, drag order, Public/Link-visible/Only-me, async save, detail edit/share/delete/favorite; member removal is draft-local until Save, then redirects and survives detail/edit reload
- Confidence: `TESTED / PARTIAL viewer lifecycle`
- Evidence: `EVD-0027`, `EVD-0183`, `EVD-0191`, `EVD-0206`

### ACCOUNT-002 — Settings / Models / BYOK / Delete Gate

- Location: `/zh-cn/account`
- Behavior: Profile, three-language preference, current BYOK limited-time provider/catalog UI, Persona/Style/Lore CRUD + validation, exact whitespace/case-sensitive DELETE account gate
- Confidence: `TESTED UI / PARTIAL external credentials`
- Evidence: `EVD-0024`, `EVD-0039`, `EVD-0092`, `EVD-0208`, `EVD-0237`

### AUTH-001 — Login / Register / Forgot Password

- Location: `/zh-cn/login`
- Behavior: Google/email login, registration with optional invite, email code reset
- Confidence: `TESTED forms / UNKNOWN final auth`
- Evidence: `EVD-0048`

### SHARE-001 — Share Composer / Rewards

- Behavior: poster ratios, save/copy/X/system share, canonical URL and rewards handoff
- Confidence: `TESTED UI / external post not executed`
- Evidence: `EVD-0038`

### NOTIFY-001 — Notification Center

- Behavior: global modal; opening clears unread badge immediately and reload-persistently; retained records page silently 10+10+partial to current 24 and deep-link by event type. Linkless `#` announcements close without navigation; toast system remains separate
- Confidence: `TESTED / PARTIAL retention`
- Evidence: `EVD-0038`, `EVD-0118`, `EVD-0158`, `EVD-0245`

### MOBILE-001 — Mobile Navigation / Creator / Simulation

- Location: 390×844 viewport
- Behavior: compact top/bottom nav, Creator core controls, stacked Simulation/Map/Dock, no horizontal overflow sample
- Confidence: `TESTED / PARTIAL touch-keyboard`
- Evidence: `EVD-0025`, `EVD-0040`

### EXPORT-001 — Simulation Transcript Export

- Location: Simulation Events
- Behavior: Markdown/HTML/TXT benefit; free account member wall
- Confidence: `TESTED boundary / BLOCKED actual files`
- Evidence: `EVD-0041`

### NAV-003 — Sidebar World/Character History

- Location: desktop sidebar `历史`
- Behavior: tabs are type filters for Simulation history, not object browse/search history
- World tab: lists saved World Simulations with name/World/Turn; Character tab: empty copy when no Character-bound save exists
- Confidence: `TESTED`
- Evidence: `EVD-0055`

### WORLD-005 — Owner Detail Controls and Remix Attribution

- Location: `/zh-cn/worlds/{slug}` owner view
- Purpose: expose owner lifecycle actions, source attribution and per-World saves
- User Action: open owned World detail; continue/edit/delete/remix; rename/delete a save
- UI Reaction: source link (`改编自`), owner controls, cost range, save list with turn/date and management actions
- Persistent State Change: navigation only until an owner action is submitted; save management mutates the owned Simulation record
- Edge Cases: delete propagation and independent-viewer permissions remain `UNKNOWN`
- Confidence: `TESTED`
- Evidence: `EVD-0063`

### CHAR-008 — Global vs World-local Character Records

- Location: `/zh-cn/characters` search `TEST`; Character detail/editor
- Purpose: distinguish reusable global Character definitions from copied World-local definitions
- User Action: search owned Character; open global detail or World-local card; edit available record
- UI Reaction: global card has owner save/delete controls; World-local card is labeled by World and has its own edit action
- Persistent State Change: edits are scoped to the selected record; source-to-copy propagation not observed
- Related Features: `CHAR-006`, `CHAR-007`, World publish/version
- Edge Cases: same display name can appear as global and World-local records
- Confidence: `TESTED` for UI separation; relationship semantics `UNKNOWN`
- Evidence: `EVD-0064`

### ACCOUNT-003 — Avatar Upload / Replacement / Failure

- Location: `/zh-cn/account` Profile avatar; public `/zh-cn/profile/{uuid}` projection
- Behavior: single image chooser, immediate auto-save, format-preserving avatar path/cache version for SVG/PNG/JPEG/WEBP/GIF, wide/EXIF inputs accepted, valid replacement/public propagation; invalid MIME silently clears to fallback
- Confidence: `TESTED / DEFECT-BASELINE`
- Evidence: `EVD-0209`, `EVD-0217`, `EVD-0222`, `EVD-0224`

### COLLECTION-003 — Only-me Collection Owner Lifecycle

- Location: Collection Creator/detail/edit/Profile
- Behavior: `仅自己` persists for the owner, stays absent from public directory/Search and retains owner management controls
- Confidence: `TESTED`; external enforcement `UNKNOWN`
- Evidence: `EVD-0193`, `EVD-0195`

### COLLECTION-004 — Collection Membership Removal

- Location: `/zh-cn/collections/{slug}/edit`
- Behavior: row Trash changes only the edit draft; explicit Save commits, redirects, persists the lower count and returns the World to add candidates
- Confidence: `VERIFIED`
- Evidence: `EVD-0206`

### COLLECTION-005 — Non-empty Collection Final Delete

- Location: Collection detail → native confirm
- Behavior: detail/edit/Search/Profile/reverse-membership projections disappear; member World, versions and saves survive
- Confidence: `VERIFIED`
- Evidence: `EVD-0216`

### PLATFORM-001 — Account / BYOK / Credits Aggregate

- Location: `/zh-cn/account`, `/zh-cn/pricing`, account menu
- Behavior: Profile/preferences/language, model/BYOK controls, presets, credits/pricing and DELETE-gated account lifecycle
- Confidence: `PARTIAL`
- Evidence: `EVD-0024`, `EVD-0039`, `EVD-0070`, `EVD-0208`

### PLATFORM-002 — Simulation Model Selection

- Location: Simulation Settings → World model
- Behavior: official model tiers, OpenRouter entitlement gate, per-Turn price display, persistent selection and next-Turn charging
- Confidence: `TESTED`
- Evidence: `EVD-0108`, `EVD-0109`

### SAVE-002 — Permanent Simulation Cross-index Cleanup

- Location: World save list, Mine/sidebar History and former `/sim/{uuid}`
- Behavior: direct Simulation delete eventually removes all owner-list projections and leaves a no-recovery 404; dependency-broken 404 can retain indexes and recover
- Confidence: `VERIFIED`
- Evidence: `EVD-0129`, `EVD-0219`

### SIM-002 — Cross-App Event Propagation

- Location: charged Simulation Turns across Story/Chat/Map/Shop and App dock
- Behavior: one accepted Turn can update Story, Wallet, Inventory, Stats, Relations, Map, Quest and App state through a shared delta
- Confidence: `TESTED / PARTIAL APP COVERAGE`
- Evidence: `EVD-0030`, `EVD-0042`–`EVD-0044`

### SIM-003 — Integrated Save / Rewind / Timeline

- Location: Simulation Events/Settings
- Behavior: independent checkpoints, historical read-only state and in-place restore/branch across Story/Chat/Wallet/Inventory/Memory/World state; no credit refund
- Confidence: `TESTED`
- Evidence: `EVD-0020`, `EVD-0089`, `EVD-0144`

### SIM-004 — Dynamic App Billing Across Rewind

- Location: Simulation Add App/model menu/Timeline restore
- Behavior: dynamic App adds +2/Turn; restoring before install removes active surcharge, although Dock can remain ghosted until reload
- Confidence: `VERIFIED / CLIENT DEFECT-BASELINE`
- Evidence: `EVD-0204`

### SIM-005 — Positive-underfunded Turn Gate

- Location: Simulation composer and account energy
- Behavior: a positive balance below displayed Turn price can commit once into negative; only the next action is blocked/discarded
- Confidence: `VERIFIED / BILLING DEFECT-BASELINE`
- Evidence: `EVD-0212`

### SIM-006 — Editable World Memory Injection

- Location: World Simulation → Memory → Edit → next Turn
- Behavior: committed Memory replacement survives reload and is injected into the next charged World Turn
- Confidence: `VERIFIED`
- Evidence: `EVD-0214`

### SIM-007 — One-Time Player Identity / Account Persona Transfer

- Location: Simulation Settings → `设定我的身份 仅一次`
- Behavior: required name (declared max 40) + optional persona (declared max 600) + rich avatar picker; the listbox copies Account Persona only, not Style/Lore. Preset selection overwrites current fields and later manual edits win visibly. Avatar text input accepts exact emoji such as `🧙‍♂️`; native keyboard truncation and saved-model serialization remain separate edges. Save costs no Turn/energy, hides the control across reload and can create runtime `playerSetup` while visible Memory remains empty; checkpoint/Rewind preserve it outside Turn snapshots. A conflicting World with `/new` identity `Alice` ignored later manual identity in Main Input/Chat, so World-field versus Simulation-identity precedence is not globally deterministic.
- Confidence: `VERIFIED lifecycle / PARTIAL conflict arbitration`
- Evidence: `EVD-0236`, `EVD-0249`

### SIM-008 — Important Facts Metadata

- Location: Simulation Settings → `重要事实`
- Behavior: per-Simulation metadata with an explicit Save boundary; closing Settings discards unsaved edits, free input is hard-capped at 200 characters, successful Save changes the CTA to `已保存`, survives reload, copies independently into a checkpoint and remains outside Turn Rewind snapshots. Create, replace and empty clear use the same zero-Turn/zero-energy Save transaction.
- Edge Cases: empty Save is a confirmation-free durable clear with no dedicated Undo; ordinary re-entry restores a value. The advertised member 2000-character limit remains `ENTITLEMENT-BLOCKED`.
- Confidence: `VERIFIED ordinary lifecycle / PARTIAL paid limit`
- Evidence: `EVD-0143`, `EVD-0144`, `EVD-0234`, `EVD-0251`

### TIME-001 — Configurable World Time Engine

- Location: Official Time App install/configuration; Simulation Time Dock and Events/Timeline
- Behavior: Creator configures start time, display format, named jump rows, AI instruction/reminder/guide and visual theme. Published saves expose deterministic `下一事件`/`下一天`/`+1月`/`+1年` controls; each consumes one Turn, advances semantic/calendar time and generates Story/Events. Time state participates in checkpoints and in-place Rewind. Elapsed world days alone do not trigger Memory.
- Free-text boundary: `跳转到指定时间…` enables on arbitrary text. In EVD-0250, invalid literal `not-a-time-0249` was accepted as a normal charged Turn/action, produced no parser error and advanced Day 1 08:35→Day 2 10:00 through AI narration. Therefore preset jumps and free-text input have different observable contracts.
- Edge Cases: valid free-text grammar, extra custom `+`, past/invalid bounds, locale/timezone parsing and exhaustive cross-App propagation remain `UNKNOWN`.
- Confidence: `VERIFIED standard lifecycle / PARTIAL parser edges`
- Evidence: `EVD-0065`, `EVD-0066`, `EVD-0074`, `EVD-0087`–`EVD-0089`, `EVD-0144`, `EVD-0250`

### UX-001 — Mobile Creator / Core-flow Reachability

- Location: 390×844 and 360px World/Creator/Simulation samples
- Behavior: compact navigation and core controls remain reachable without horizontal overflow in tested pages; phone shell has its own App/home interaction model
- Confidence: `TESTED / PARTIAL TOUCH-IME`
- Evidence: `EVD-0025`, `EVD-0040`, `EVD-0096`–`EVD-0097`

### WORLD-006 — Historical Version Presentation

- Location: World detail → Version History
- Behavior: recent entries expand to v1 but remain static text with no old-version route/share/Remix control; page Share uses latest canonical URL
- Confidence: `VERIFIED / HIDDEN BACKEND UNKNOWN`
- Evidence: `EVD-0177`, `EVD-0188`, `EVD-0207`

### WORLD-007 — Published World Final Delete / Child Projection Split

- Location: owned World detail → native confirm → World/Search/Mine/Profile/child runtime
- Behavior: World and child runtime invalidate, discovery/ownership projections clear, but a mutable orphan History record can remain and point to the dead child UUID; its remaining in-page Delete removes the row without restoring the runtime
- Confidence: `VERIFIED / DEFECT-BASELINE`
- Evidence: `EVD-0221`, `EVD-0223`
