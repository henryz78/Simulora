# MARVIS HANDOFF — WorldOS 独立查漏与第二账号权限验证

> **归档状态：EXTERNAL MARVIS TASK COMPLETE（2026-08-24 15:xx，Asia/Shanghai）**  
> 外部腾讯 Marvis 已完成最后三项定向补测；原始总证据已归档为 `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md`，更新后的 Phase-3 报告已覆盖到 `01/03/06/07`。下文原“推荐第二 Agent 优先调查”仅保留为历史任务说明，不再执行。当前没有需要外部 Marvis 继续处理的已分配事项；其会话历史在用户确认本地归档可读后可以删除。

最终增量：App 重新发布后 B/Guest 直链由 404 恢复但 Market/Search 仍不命中（EVD-0190）；链接可见 Collection 对 B/Guest 可直链、不可发现且无 owner 管理控件（EVD-0191）；关闭改编权限的公开 World 对 Guest 隐藏主区 Remix、对 Account B 在最终复制动作真实拦截（EVD-0192）。

更新时间：2026-08-24（Asia/Shanghai）  
主调查状态：第三轮独立查漏已完成并已纳入主文档；整体仍为 `CONTINUE INVESTIGATION`，因为少数权限矩阵需要主账号样本才能闭环。本项目只做产品级黑盒调查，不进入开发阶段。

## 任务定位

第二调查 Agent 的目标不是从头重做 WorldOS，而是：

1. 以独立账号或未登录身份验证主账号无法证明的权限、可见性与跨账号传播；
2. 查找主调查遗漏的页面、控件、状态和跨系统行为；
3. 对现有高价值结论做独立复验，并明确样本范围；
4. 对无法验证的内部实现保留 `UNKNOWN`，给出可执行实验，不猜测。

主调查文档位于 `docs/research/worldos/`。第二账号两批成果位于 `docs/research/external/marvis/second-account/`，匿名成果位于 `docs/research/external/anonymous/`。开始新实验前先读这些目录，避免重复。

## 已 VERIFIED / TESTED 的主要系统与结论

- World Creator：Draft 自动保存、Preview、Publish、版本递增、公开详情和旧存档升级已实际测试。
- World Remix：点击后立即生成独立公开 v1；下一次显式发布从 v2 开始；复制 World-local Characters、Apps、Map、设置、规则、布局；可见 attribution 只指向直接父级。
- Character：Library 创建/编辑、World-local snapshot、两层 Remix、独立 Chat/Simulation 已测。删除 source 后，World-local 与 Remix 快照仍可运行；source Chat 404，History 保留 tombstone。
- App：Draft/首次 Publish、Market、安装、World 发布、旧/新 Simulation hydration、公开 v2 热升级、Initial JSON 顶层 dirty-field merge、卸载和最终删除后的 World 清理/存档恢复已测。
- Map：Creator、导入现有/新 World、base/region 替换、faction→Character、marker、发布、旧/新 Simulation、Turn mutation、历史查看和 Rewind 已测。
- Simulation / Turn：主输入、Chat、Map、Shop、App Refresh、Story、Events、Time、Stats、Relations、Wallet、Inventory、World State 与 Memory 的联动已测。
- Save / Rewind：独立存档槽、扩容、删除、branch/checkpoint、原地 Rewind 已测。Social Turn 15→6 会联合回滚 Story、Stats、Relations、Memory、Chat、Instagram、Timeline；Important Facts 不随 Turn 回退。
- Templates：11 个内置模板已枚举；现代恋爱 + 修仙可叠加生成玩家初始化字段；Draft/reload/Publish/`/new`/fresh Simulation 传播、必填/默认值边界已测。
- Guest / non-owner：公开 World/Character/App/Map/Profile/Community/Search/Pricing 可浏览；Guest 写操作大多进入登录墙。Guest 收藏按钮存在静默失败；登录后收藏真实生效。评分要求先玩过 World，但评论仅要求登录。
- Cross-account：Public World 可搜索、Remix、收藏、评论；Remix 副本归执行者且默认公开；Follow/Unfollow 刷新后持久；删除 App 样本 Direct URL 404 且 Search 消失。
- Account A 通知：主账号通知中心已实际收到第二账号的评论、收藏、关注和 Remix，记录持久并带 World/Profile/child-World 深链；打开通知中心清除未读数但不删除记录。
- Collections：三种可见性、100 项上限、拖动排序提示、公开合集只能收录公开 World 的耦合、空合集保存边界已测。新合集已完成仅自己保存→详情→编辑恢复→改为公开；公开详情立即可访问，但目录/搜索在发布后的短等待窗口仍未收录，说明发现索引不是事务同步。

### Phase-3 已完成的独立查漏

- Account B 可直链打开主账号公开 Collection；合集目录可收录但合集名在统一 Search 中不命中；非 owner 可把公开 World 加入自己的 Collection，且合集页无独立 favorite 入口（EVD-0170）。
- Account B 的多层 World Remix 链中，删除中间父级后父级直链 404，后代仍可直链、搜索、编辑、再次 Remix；后代 `改编自` attribution 整段静默消失，无占位（EVD-0171）。non-owner Version History 只读，无旧版本切换入口。
- Guest 可见 Character 排行榜/支持者空态；App 送礼进入登录墙；Map 卡片的缩略图与“查看大图”打开同一地图 viewer，同时“新标签页查看世界”是独立 World-detail 入口（EVD-0172）。
- 历史 EVD-0179 记录 Account B/Guest 在下架阶段对 `test-app-first-publish-001` 直链持续 404；最终 EVD-0190 已验证重新发布后直链恢复，但 App Market/Unified Search 仍无结果。保留历史状态，不再把 404 作为当前状态或权限缺陷结论。
- 主账号已将 `TEST Template World 001` 的 `不允许改编` Draft 实际发布为公开 v4；发布 modal 要求更新日志，公开详情显示 `v4 最新版`（EVD-0176）。请只复测陌生用户 enforcement，不重复 Owner Draft/Publish 流程。

## 已测试的资产类型，避免无意义重复

### World

- 手工空白 World
- 多 App World
- Map / Strategy World
- Social / American High School World
- Hogwarts 通用 World
- Template World（现代恋爱 + 修仙字段）
- 多层跨账号 Remix World

主要测试对象：

- `https://worldos.cc/zh-cn/worlds/test-map-world-001-gytp`
- `https://worldos.cc/zh-cn/worlds/test-map-world-001-rxwf`
- `https://worldos.cc/zh-cn/worlds/test-template-world-001-fv99`

### Character

- 独立 Character source
- World-local Character copy
- Character L1/L2 Remix
- Map faction-as-Character / alias-dedup Character
- source 删除后的存活副本与独立 Chat

### App

- 新建 owner-only v1 Draft →首次公开
- 公开 App v2 热升级
- primitive / nested / array Initial JSON
- refresh/Event templates
- 删除依赖与 World cleanup Draft

主要测试 App：`https://worldos.cc/zh-cn/apps/test-app-first-publish-001`

### Map

- base-only import
- region/faction/action import
- mixed Map
- 47/61 region samples
- faction roleization
- saved marker + AI-generated marker
- marker Turn mutation + Rewind

## 最重要的产品机制

- World、App、Character、Map 与 Simulation 不是简单的同一份对象：Creator definition、published version、World-local copy 与 runtime state 具有不同生命周期。
- World Remix 是“立即发布的独立复制”，不是普通 Draft fork；provenance 只显示直接父级。
- World-local Character 是 snapshot；source 更新或删除不会级联修改已经复制进 World 的角色。
- App HTML/指令/Events 按 slug 的最新公开定义热解析，既有 Simulation 不 pin HTML；App Initial JSON 则在 World 版本升级时进行可观察的字段合并。
- World 版本升级对已有 Simulation 是零 Turn migration；保留运行时进度，并把新定义合入存档。
- Rewind 回滚 Turn snapshot 内的剧情和状态，但 Credits 不退、App definition 保持最新、Important Facts 属于 timeline 外的 Simulation metadata。
- Public 页面与发现索引异步解耦：Remix、App usage、Search、Collection 目录可在直接 URL 已生效后延迟收敛。
- 删除可能产生两种不同 404：真正删除的不可恢复 UUID，以及依赖断裂导致但可由新 World version 恢复的 Simulation。

## PARTIAL / UNKNOWN / BLOCKED

- Private / Unlisted World、Character、App 的跨账号直链、Search、Share、Collection、Remix 行为；免费账号受会员墙限制。
- Public→Private 已打开页面、刷新、Search、收藏、合集、Share、Remix 后代传播。
- 关闭 World 改编权限后的陌生账号 Remix enforcement。
- 老 World Version URL、旧版本 Share、Remix 使用哪个版本作为基线。
- Character Remix 的来源/中间父级删除、编辑、删除和索引收敛；World 中间父级删除已在一个测试链上 VERIFIED（EVD-0171），更广泛对象类型仍 PARTIAL。
- Character Remix 的编辑、删除、中间父级删除。
- App downlist / unpublish 与 permanent delete 的精确内部区别；EVD-0186–0187 已完成 owner 下架/重新发布，EVD-0190 已完成 B/Guest 直链恢复复查，但具体发布 flag、缓存/索引机制仍 UNKNOWN。不要把 Codex 看不到腾讯 Marvis 会话误记为 Account-B 不存在。
- Collection 的匿名/非 owner 对 `链接可见`、`仅自己` 的直链 enforcement；删除、拖动排序提交、收藏通知。
- Guest/匿名控件的最终礼物交易副作用、Map World-detail 与地图 viewer 的内容等价性。
- 导出文件 schema、真正 Import、新账号 onboarding、BYOK 成功/失败、网络/upload/Credits 失败恢复。
- Mobile touch 长按、IME、横屏、safe-area、后台/多任务。
- 推荐算法、Memory/自主社交事件精确阈值、搜索/索引精确 SLA。

## 推荐第二 Agent 优先调查

1. 用 Account B/Guest 测试 `TEST Collection 001`（当前 `链接可见`）：Direct URL、目录/Search 省略、Share、是否能被加入其他 Collection，以及刷新后的权限。
2. 测已发布 `TEST Template World 001`（`https://worldos.cc/zh-cn/worlds/test-template-world-001-fv99`）的非 owner/Guest Remix enforcement：按钮是否隐藏、点击是否报错/跳登录、是否仍能进入旧 Remix 链；记录已打开页面与刷新后的差异。
3. 对老 Version：当前详情、历史记录、Share 链接、Remix 新副本的基线版本做矩阵。
4. 验证 `链接可见` / `仅自己` Collection 的 Guest 与 non-owner direct-link 权限、目录/搜索省略、加入非公开 World 的规则。
5. 补 Character Remix clone 的编辑/删除/稳定直链/全局索引收敛，以及 Character 中间 parent 删除。
6. 若主账号实际提交 `下架`，只补测下架后的 B/Guest 直链、Market/Search、已安装 World 与恢复上架；不要重复完整 App 生命周期。外部账号由用户在腾讯 Marvis 中操作，Codex 不代替访问其会话。
7. 仅在有新样本或新状态时复验已有结论，不重复完整 Guest、Simulation、App Initial JSON、Map marker/Rewind 和通知基线。

## 特别适合另一个独立账号验证

- owner/non-owner 控件差异与编辑入口隐藏；
- Private / Unlisted / link-visible 的真实访问控制；
- Search、Profile、Collection、Share 的外部可见性；
- Follow、Favorite、Comment、Rating、Remix 的账户隔离与通知；
- 删除、visibility、remix-permission 变化后的传播；
- 老版本和 attribution 的陌生用户视角；
- owner Draft / 未发布修改是否泄露给外部用户。

## 主 Agent 当前继续调查，避免撞车

- owner 侧 World / Character / App / Collection 生命周期和删除传播；
- App/World version、Initial JSON、已有 Simulation migration；
- Map runtime、marker、Rewind 和 World 关系；
- Collections owner 保存/编辑/索引；
- 主账号通知和辅助证据合并；
- Missing Feature Audit、Cross-System Audit、Final Completeness Audit、Parity Matrix/Test Suite。

除非第二账号视角是实验必要条件，不要重复 Simulation 长期运行、App Initial JSON merge、Map marker Rewind、Template 字段传播和主账号通知。

## 重要入口

- 首页 / Explore：`https://worldos.cc/zh-cn/`
- Worlds：`https://worldos.cc/zh-cn/worlds`
- Search：`https://worldos.cc/zh-cn/worlds/search`
- Characters：`https://worldos.cc/zh-cn/characters`
- Apps：`https://worldos.cc/zh-cn/apps`
- Maps：`https://worldos.cc/zh-cn/maps`
- Community：`https://worldos.cc/zh-cn/community`
- Collections：`https://worldos.cc/zh-cn/collections`
- Mine / History：`https://worldos.cc/zh-cn/sims`
- Pricing：`https://worldos.cc/zh-cn/pricing`
- Rewards：`https://worldos.cc/zh-cn/rewards`
- 测试 Collection：`https://worldos.cc/zh-cn/collections/test-collection-lifecycle-002-2szc`
- 非公开 Collection 样本（owner 已确认当前为 `链接可见`）：`https://worldos.cc/zh-cn/collections/test-collection-001-g6wi`

## 证据标准

每项记录：身份、URL、对象、前置状态、逐步操作、UI/URL/toast/modal/state 变化、刷新后结果、跨账号结果、Confidence。结论必须区分 `VERIFIED`、`TESTED`、`PARTIAL`、`UNKNOWN`、`BLOCKED`。遇到不可确认实现时写实验，不脑补。
