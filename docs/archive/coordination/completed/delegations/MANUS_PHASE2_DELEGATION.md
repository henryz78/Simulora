# Manus 第二阶段外部定向任务书

日期：2026-08-25（Asia/Shanghai）  
任务性质：WorldOS 产品级黑盒调查的独立并行补缺。  
执行条件：仅使用免费账号能力；不需要、也不得购买会员、订阅、Credits 或任何真实付费项目。

## 0. 全局边界

- 不查看、复验或改写 Manus 第一阶段结论；第一阶段已完成，最终由主 Agent 统一合并。
- 不重复 Marvis 已完成的 Guest / logged-in non-owner / Public 权限基线。
- 不重复第一阶段的 App Gift Transaction Isolation、App Discovery Convergence Monitor，或任何已经交付的第一阶段实验。
- 不做 Private / Unlisted World/Character 等会员前置可见性实验；遇到会员墙只记录 `MEMBERSHIP_BLOCKED`，立即停止该分支。
- 不访问隐藏 API、Cookie、Local Storage、服务端私有实现、其他用户私有内容或管理员能力。
- 不付款、不充值、不提交真实 API Key，不做压力测试或高频并发请求。
- 允许在 Manus 自己的测试账号内创建、编辑、发布、运行和删除带 `MANUS-P2-*` 前缀的专用测试数据。
- 每个结论都要记录身份、URL、时间、前置状态、操作、可见反馈、持久化结果、截图/视频位置和 Confidence。无法确认的内容写 `UNKNOWN`，不得推断。
- 每个任务独立交付；完成本任务书后必须 STOP，不自行扩展为重新全面调查 WorldOS。

## TASK 1 — App Market Remaining Category Census

- PRIORITY：P0
- WHY DELEGATE：主调查已经实测 `全部=341`、`社区=291`，并确认每页 24 张卡片、分类切换会重置到首批 24、终点没有提示。其余 16 个分类逐一滚到底非常机械、耗时，但能给未来目录、分类和回归测试留下完整基线，适合 Manus 长时间自动化。
- SCOPE：仅调查尚未完成的 16 个分类：`核心、社交、角色、叙事、经济、系统、成长、资讯、任务、音频、悬疑、科幻、奇幻、恋爱、策略、历史`。每个分类从页顶开始，记录首批数量，然后以普通滚动加载到连续三次滚动不再增长；记录终点总数、最后一批大小、页面高度、是否出现 loader/end copy。导出每张卡片的可见标题、creator、usage、rating（如有）、tags、favorite count、排序位置。对跨分类重复卡片建立 title+creator 去重表。
- DO NOT：不要重复完整滚动 `全部` 和 `社区`；它们只可各做一次 24-card 首屏对照。不要 Favorite、Install、送礼或修改任何对象；不要猜测卡片隐藏 slug；不要用隐藏接口抓目录。
- INPUTS：`https://worldos.cc/zh-cn/apps`；主调查基线 `EVD-0238`、`EVD-0239`（只用于避免重复，不能改写）。
- TEST MATRIX：16 分类 × `{initial, every-load-count, terminal}`；每个终点要求 `{count, scrollHeight, scrollY, terminal-copy}`；随机选择 4 个分类刷新复验终点；状态切换至少验证 `A fully loaded → B initial 24 → A initial 24` 两组。
- EXTERNAL SIDE EFFECTS：无；纯浏览和滚动。
- DELIVERABLES：`MANUS_P2_APP_MARKET_CATEGORY_CENSUS.md`、`MANUS_P2_APP_MARKET_CARDS.csv`、`MANUS_P2_APP_MARKET_DUPLICATES.csv`、每个分类首屏/终点截图。
- ACCEPTANCE CRITERIA：16 个分类均有稳定终点；每个终点至少连续三次普通滚动不增长；CSV 行数与各分类终点总数一致；所有缺字段保留空值而非推断。
- STOP CONDITION：16 个分类全部完成并通过四分类刷新复验后停止，不测试卡片动作。
- DEPENDENCY：立即可启动；无会员、无主 Agent 数据依赖。

## TASK 2 — Creator Field, Validation and Autosave Boundary Matrix

- PRIORITY：P0
- WHY DELEGATE：World、Character、App、Map Creator 都含大量字段、隐式 autosave、Draft/Preview/Publish 边界与不同错误反馈。逐字段做空值、空白、Unicode、长度、刷新和返回恢复非常耗时，却会直接决定未来 schema、validation 和 draft architecture。
- SCOPE：用独立 `MANUS-P2-*` 对象分别调查 World、Character、App、Map 的公开免费创建流程。先建立页面级字段/按钮/Tab/下拉/上传控件清单；然后逐字段做：空值、仅空格、前后空格、中文、英文、emoji、换行、重复名称、可见 slug（如有）的大小写/空格/重复冲突；对文本字段按 `16/32/64/128/256/512/1024` 逐级增加，出现 UI/DOM/服务端限制后停止扩大。每个阶段记录按钮 enablement、inline error、toast、modal、URL、autosave 指示、reload/back/forward 后恢复。对可以免费完成的对象跑 `Draft → reload → Preview → Publish → Edit → Save/Update → reload`；会员可见性分支一律跳过。
- DO NOT：不要 AI 批量生成内容来消耗 Credits；不要上传大于 5 MB 的文件；不要使用脚本注入超长 payload；不要测试 XSS/漏洞；不要修改主 Agent 对象；不要为测试 Private/Unlisted 购买会员；不要删除非 `MANUS-P2-*` 数据。
- INPUTS：World 创建/Creator、`/zh-cn/characters?create=1`、`/zh-cn/apps/create`、Map 创建/编辑正常入口；可使用 1 张小 PNG、1 张小 SVG、1 个错误 MIME 的无害测试文件。
- TEST MATRIX：对象=`World/Character/App/Map`；阶段=`pristine/dirty/autosaved/reloaded/previewed/published/edited`；输入=`empty/space/trim/unicode/emoji/newline/duplicate/length-step/file-type`；导航=`reload/back/forward/direct reopen`；结果=`enabled/error/toast/modal/persisted/normalized/rejected`。
- EXTERNAL SIDE EFFECTS：允许创建、发布、编辑和最终删除专用 `MANUS-P2-CREATOR-*` 数据；删除前先记录公共直链与 Search/Profile 投影，但不做长时间索引采样（由 Task 4 负责）。
- DELIVERABLES：`MANUS_P2_CREATOR_VALIDATION_MATRIX.md`、逐字段 CSV、每个对象的生命周期时间线、错误/空态截图、最终保留/删除对象清单。
- ACCEPTANCE CRITERIA：四种 Creator 每个可见字段都有至少一个有效值和一个无效/边界值；每个 save/publish 按钮在 pristine/invalid/valid 三态均有实测；autosave 与 reload 恢复有明确证据；所有 membership gate 标为 `MEMBERSHIP_BLOCKED`。
- STOP CONDITION：四对象矩阵完成并清理专用对象后停止；不得转向权限、安全或付费调查。
- DEPENDENCY：立即可启动；只需免费登录账号。

## TASK 3 — Browser-Viewport Responsive Interaction Matrix

- PRIORITY：P1
- WHY DELEGATE：主调查已有少量 360×844 与 844×360 样本，但尚缺跨页面、跨方向、键盘焦点和弹层可达性的系统矩阵。浏览器级反复切 viewport、滚动、开关菜单、Tab 键遍历和截图适合独立高额度 Agent。
- SCOPE：在 `1280×720、768×1024、360×844、844×360` 四种浏览器 viewport 下，检查 World detail、World Creator、Character directory/detail/create、App Market/detail/create、Map directory/editor、Mine、Account、Simulation。每页记录：页面宽/高、scrollWidth、横向溢出、固定导航/底栏、主操作可达性、弹窗/抽屉/下拉是否裁切、关闭按钮、滚动锁、表单聚焦、Tab/Shift+Tab 焦点顺序、Escape、Back、方向切换后状态保留。Simulation 只使用一个专用免费样本，最多做一次最低成本 Turn；其余尽量零成本。
- DO NOT：不得把浏览器 viewport 模拟描述为真实 iOS/Android 设备；不得声称验证了真实 IME、safe-area、notch、后台冻结或触摸长按，除非使用真实设备并留下证据。不要重复 Guest 权限基线；不要修改主 Agent 数据。
- INPUTS：上述正常页面入口；Task 2 创建的 `MANUS-P2-*` 对象可复用。若 Task 2 尚未完成，可使用 Manus 自己已有可编辑对象，但不可使用主账号对象。
- TEST MATRIX：`12 pages × 4 viewports`；每页至少覆盖 `initial/top, deepest-scroll, one modal/drawer/dropdown, keyboard focus, rotate-equivalent resize`；Simulation 额外覆盖 composer/Settings/Events/App dock；Creator 额外覆盖 form/Preview/fullscreen。
- EXTERNAL SIDE EFFECTS：允许对专用对象做无害 Draft 字段改动并恢复；最多一次低成本 Simulation Turn；不允许发布社交内容、送礼、Favorite、Follow 或 Comment。
- DELIVERABLES：`MANUS_P2_RESPONSIVE_MATRIX.md`、48+ 行 viewport CSV、每页四 viewport 对照截图、overflow/clipping/focus defects 清单、明确的 `DEVICE_BOUND_UNKNOWN` 清单。
- ACCEPTANCE CRITERIA：所有页面×viewport 单元都有结果或明确阻塞原因；所有发现的 overflow/clipping 都有尺寸数据和截图；可交互控件不只“可见”，至少真实触发一项弹层/菜单并验证关闭。
- STOP CONDITION：矩阵完整且 defect 可复现后停止；不得自行进入真实设备实验。
- DEPENDENCY：可立即启动；若想复用 Task 2 对象，则在 Task 2 创建最小样本后启动更高效。

## TASK 4 — Non-App Public Discovery Convergence Timeline

- PRIORITY：P1
- WHY DELEGATE：Marvis 已证明许多 Public/删除状态的静态结果，但没有覆盖同一批新对象从发布、改名到删除的长时间多入口收敛曲线。Manus 第一阶段已做 App，因此本任务只补 World/Character/Map/Collection，适合定时重复采样。
- SCOPE：在 Manus 独立账号分别创建唯一 token 的 Public World、Character、Map、Collection，命名 `MANUS-P2-IDX-{TYPE}-{timestamp}`。对每个对象采样 Direct、对象目录、Unified Search 对应 Tab（若存在）、Creator Profile/Works、相关反向投影。发布后在 `0/1/5/15/30/60/120 分钟/6 小时/12 小时` 搜 title 与可见 slug；随后改名为新 token，重复至少到 120 分钟；最后删除专用对象并在相同入口采样到稳定或 12 小时。Guest/non-owner 仅用于同一 URL/搜索采样，不重跑 Favorite/Follow/Comment/Remix 权限。
- DO NOT：不要测试 App（第一阶段已做）；不要重新做 Marvis 的通用 Guest 权限矩阵；不要测试 Private/Unlisted；不要删除任何非 `MANUS-P2-IDX-*` 数据；不要把一次无结果解释为删除或权限拒绝。
- INPUTS：World/Character/Map/Collection 正常创建和公开入口、`/zh-cn/worlds/search`、各目录和 Creator Profile；独立 Owner + Guest，若 Manus 已有独立 non-owner 可做只读补充。
- TEST MATRIX：对象=`World/Character/Map/Collection`；状态=`published/renamed/deleted`；身份=`Owner/Guest/(optional B)`；入口=`Direct/Directory/Unified/Profile/Reverse`；query=`old title/new title/slug`；时间=`0m–12h`。
- EXTERNAL SIDE EFFECTS：允许创建、公开、改名和最终删除专用对象；不允许其他社交动作、Remix、会员可见性或付费。
- DELIVERABLES：`MANUS_P2_NONAPP_INDEX_TIMELINE.md`、时间序列 CSV、对象 URL/token 表、每个状态关键截图、每个入口的最短/最长观察收敛界限。
- ACCEPTANCE CRITERIA：四对象都有 Publish→Rename→Delete 三段时间线；每个时间点区分 Direct 与 Discovery；能报告 `CONVERGED_WITHIN_X` 或 `NO_CONVERGENCE_WITHIN_12H`，不得猜根因。
- STOP CONDITION：删除后 12 小时或连续两次所有入口稳定后停止；不扩展权限行为。
- DEPENDENCY：立即可启动；可复用 Task 2 最终留下的四个专用对象，但命名 token 必须唯一且时间线从首次 Publish 开始。

## TASK 5 — Locale, Deep-Link and Browser-History Routing Matrix

- PRIORITY：P1
- WHY DELEGATE：WorldOS 支持中文、English、Español，但现有证据只覆盖少量 locale normalization。对大量路由重复做语言切换、刷新、Back/Forward、query/hash 保留不消耗 Credits，能补齐未来路由/i18n 架构与回归基线。
- SCOPE：为首页、World 目录/Search/detail、Character 目录/detail、App Market/detail、Map 目录、Community、Collections、Creator Profile、Mine、Account、Pricing、Rewards、Simulation 选取至少 18 条可合法访问路由。分别从 `/zh-cn`、`/en`、`/es` 进入或通过语言选择器切换，记录 pathname、可见主标题/导航语言、query/hash、选中语言、reload 和新标签持久性。每条关键路由做 Back/Forward；测试一个合法 query、一个 hash、一个 404 slug 和一个不支持 locale 前缀。记录混合语言、404 shell、locale fallback 和 canonicalization。
- DO NOT：不要用搜索引擎；不要访问隐藏路由或猜管理 URL；不要把未翻译用户内容当作 UI localization defect；不要改变 Account 除语言偏好；结束时恢复中文。
- INPUTS：公开/登录正常页面；使用 Manus 自己或公共可见对象的 Direct URL。不要依赖主 Agent 私有资产。
- TEST MATRIX：`18+ routes × zh-cn/en/es`；导航=`direct/switch/reload/back/forward/new tab`；URL state=`plain/query/hash/404/unsupported locale`；身份以已登录 Manus Owner 为主，Guest 仅挑 3 条公共路由作 shell 对照。
- EXTERNAL SIDE EFFECTS：只允许修改 Manus 账号语言偏好并最终恢复中文；无内容创建/删除/社交动作。
- DELIVERABLES：`MANUS_P2_LOCALE_ROUTING_MATRIX.md`、route CSV、语言切换前后 URL 表、i18n/routing defect 截图、最终偏好恢复证据。
- ACCEPTANCE CRITERIA：三语言每条路由都有 URL+主 UI 结果；query/hash/Back/Forward/404 至少各有三语言对照；区分平台 UI、用户内容和后端错误文本。
- STOP CONDITION：矩阵完成并恢复中文后停止；不扩展翻译质量审校。
- DEPENDENCY：立即可启动；与其他任务完全独立。

## 推荐执行顺序

1. Task 1（纯读取、最机械，立即出高价值目录基线）
2. Task 2（为 Task 3/4 生成专用对象）
3. Task 4（发布后立即启动长时间采样）
4. Task 3（在 Task 4 等待窗口执行）
5. Task 5（可穿插在任何等待窗口）

## 本批明确排除

- 任何会员权益、Private/Unlisted 内容、真实支付或真实 API Key。
- App Gift 与 App Index/Market visibility 收敛：Manus 第一阶段已完成，不得重复。
- Marvis 的 Guest vs logged-in non-owner、Public 权限、Follow/Favorite/Comment/Remix 基线。
- 主 Agent 当前正在进行的 Simulation identity/Rewind、Account BYOK/Preset、App Market All/Community scroll 复验。
- 我们自己的产品浏览器回归：当前仍未进入开发阶段，没有可测试里程碑。

