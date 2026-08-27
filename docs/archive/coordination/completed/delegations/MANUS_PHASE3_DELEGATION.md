# Manus 第三阶段外部定向任务书

日期：2026-08-25（Asia/Shanghai）  
任务性质：WorldOS 产品级黑盒调查的独立并行补缺。  
执行条件：仅使用免费账号和免费电量；不需要、也不得购买会员、订阅、Credits 或任何真实付费项目。

## 0. 全局边界

- 不重新做 Marvis 已完成的 Guest / logged-in non-owner / Public 权限、Remix、Follow、Favorite、Comment、Rating 基线。
- 不重复 Manus Phase 1 的 App Gift / App discovery，也不重复 Phase 2 的 App Market 18 分类 census、Creator 通用字段校验、Responsive、Non-App discovery timeline、Locale/routing 工作。
- 不调查 Private / Unlisted 等会员能力；遇到会员墙只记录 `MEMBERSHIP_BLOCKED` 并停止该分支。
- 不访问隐藏 API、Cookie、Local Storage、服务端私有实现、其他用户私有内容或管理员能力。
- 不付款、不充值、不提交真实 API Key，不做压力测试或高频并发请求。
- 允许在 Manus 自己的测试账号创建、编辑、发布、运行、改名和删除带 `MANUS-P3-*` 前缀的专用测试数据。
- 每个结论必须记录：身份、URL、时间、对象/版本/Simulation UUID、前置状态、操作、可见反馈、刷新后的持久化结果、截图/视频位置和 Confidence。
- 无法确认的内容写 `UNKNOWN`；工具无法执行写 `TOOLING_BLOCKED`；不得把缺少可见反馈解释为成功。
- 单次等待或被动采样最长 5 分钟。不得安排数小时/数天的被动等待，也不得为了耗额度制造低价值样本。
- 四项任务可以独立执行。全部完成后提交一个总索引并 `STOP`，不要自行扩展为全面重查 WorldOS。

## TASK 1 — Page-Level Control Delta Ledger

- **PRIORITY：P0**
- **WHY DELEGATE：** 最终验收明确要求页面级控件清单，且每个页面要区分“已发现 / 已实际触发 / 未验证 / 失败原因”。这是大量机械点击、菜单/弹层/空态/错误态复核，适合独立浏览器长时间执行，又不会消耗主账号电量。
- **SCOPE：** 先读取 Phase 1/2 报告，仅做它们没有完成的控件 delta。覆盖：首页与全局导航、World detail、World Search、Character library/detail/drawer、App detail、Maps、Community、Collections、Mine、Creator Profile、Account、Pricing、Rewards、Notifications、Simulation。对每页建立控件 ledger；触发普通按钮、Tab、下拉、More、弹窗、抽屉、搜索/清除、分页/滚动终点、disabled→enabled、Cancel/Close/Escape/返回。对危险或代表性写操作只验证到最终提交前；只允许对 `MANUS-P3-*` 数据实际提交。
- **DO NOT：** 不重复 Phase 2 的 Creator 字段长度/格式矩阵、App Market 分类 census、viewport、locale；不重跑 Guest 权限；不对第三方内容发表评论、送礼、关注、收藏、评分或 Remix；不删除非 P3 资产；不把 DOM 中不可见元素当作发现的用户控件。
- **INPUTS：** `docs/research/worldos/ux/PAGE_CONTROL_AUDIT.md`、`docs/research/worldos/02_FULL_SITE_MAP.md`、`docs/research/worldos/03_RESEARCH_COVERAGE.md`、`docs/research/external/manus/`；WorldOS 上述正常公开/登录页面。允许复用 Manus 账号已存在的可公开查看对象，但写操作只用新 P3 对象。
- **TEST MATRIX：** 每个页面至少记录 `{initial, deepest-scroll, every tab, every menu/dropdown, one modal/drawer, empty/error/disabled state where normally reachable, close/back/reload}`；每个控件状态为 `DISCOVERED_ONLY / TRIGGERED / NOT_VERIFIED / BLOCKED`；每个触发结果分类为 `modal / confirmation / toast / error / navigation / state change / no visible effect`。
- **EXTERNAL SIDE EFFECTS：** 允许创建最多一个 `MANUS-P3-CONTROLS-*` World/Character/App/Collection 作为安全写入样本并最终清理；不允许付款、购买会员、真实 API Key、账号删除或触碰非 P3 数据。
- **DELIVERABLES：** `MANUS_P3_PAGE_CONTROL_LEDGER.md`、逐控件 CSV、页面 URL/状态索引、关键 Modal/错误/空态截图、`UNVERIFIED_CONTROLS.md`。
- **ACCEPTANCE CRITERIA：** 所有列出的页面都有 ledger；每个可见控件都有四态之一；每个 `NOT_VERIFIED/BLOCKED` 都有具体原因；实际触发项有可见结果和恢复路径；与 Phase 1/2 的重复项明确标为 `PREVIOUSLY_COVERED` 而非重跑。
- **STOP CONDITION：** 页面 ledger 完整并完成 P3 测试数据清单后停止；不扩展到安全测试或隐藏路由。
- **DEPENDENCY：** 立即可启动；不依赖主 Agent 当前工作。

## TASK 2 — Character Memory Long-Run Generalization

- **PRIORITY：P0**
- **WHY DELEGATE：** 主调查已在一个 Character Chat 跑到 T31，观察到 T25 首条可编辑总结、约两轮 tail lag、手工冲突值优先以及 checkpoint 隔离，但固定阈值、第二批生成/合并和跨 Character/模型一般性仍未知。该实验大量消耗 Turn 和电量，特别适合 Manus 的独立高额度账号。
- **SCOPE：** 使用两个不同来源的公开 Character，优先一个普通原生 Character、一个非同作者/非 Remix Character；分别创建全新 Chat。每轮写唯一短 token 并夹杂 3 个长段落样本，至少在 T5/T10/T15/T20/T23/T25/T28/T30/T35 检查 Memory。首次出现自动 Memory 后记录覆盖到哪个 Turn、遗漏尾部、条数和正文；编辑其中一个事实为冲突 token，reload 后继续至少 8 Turn；观察第二条、merge、overwrite 或保留。每个 Character 至多一个 checkpoint，在自动 Memory 出现前创建，之后复查分支是否继承源 Chat 后生成/编辑的 Memory。若可免费切换两个官方模型，可在第二个 Character 使用不同模型。
- **DO NOT：** 不使用主 Agent 的 Character/Chat；不重复相同无信息问题刷 Turn；不输入敏感信息；不声称后台使用 transcript 检索或向量记忆；不删除第三方 Character；不因达到某个猜测阈值继续无限跑。
- **INPUTS：** `docs/research/worldos/simulation/MEMORY_BEHAVIOR_SPEC.md`、`docs/research/worldos/characters/CHARACTER_SYSTEM.md`、`docs/research/worldos/06_OPEN_QUESTIONS.md` 的 OQ-0043、`docs/research/worldos/07_EVIDENCE_INDEX.md` 的 EVD-0213/EVD-0232/EVD-0233；公开 Character Library 与 Manus 自己的 Chat history。
- **TEST MATRIX：** Character=`A/B`；Turn 检查点=`5/10/15/20/23/25/28/30/35`；输入=`short unique token/long paragraph/conflicting token/unrelated continuation/recall query`；状态=`source/checkpoint/reload`；Memory=`count/text coverage/latest included turn/manual edit persistence/AI recall`；模型=`default/second official if freely available`。
- **EXTERNAL SIDE EFFECTS：** 允许消耗 Manus 免费电量、创建两个 Character Chats 和最多两个 checkpoints；允许编辑自己的可见 Memory；结束时可以保留历史以便证据复核。
- **DELIVERABLES：** `MANUS_P3_CHARACTER_MEMORY_LONGRUN.md`、逐 Turn CSV、Memory 生成/编辑时间线、源/分支差异表、每个关键阈值截图和 Chat/Checkpoint URL 清单。
- **ACCEPTANCE CRITERIA：** 两个独立 Character 都至少到 T35，或明确记录产品/电量/工具阻断；每次 Memory 变化都能定位到相邻两个检查点之间；手工 edit 至少经过 reload、8 个后续 Turn和 recall；分支隔离有直接对照；结论不把单一样本误写成全局固定规则。
- **STOP CONDITION：** 两个样本完成 T35 与 edit+8 Turn，或同一阻断连续三次后停止该分支；不超过 T40。
- **DEPENDENCY：** 立即可启动；完全独立于主 Agent 当前 Achievement 生命周期。

## TASK 3 — App Runtime State Migration Edge Matrix

- **PRIORITY：P0**
- **WHY DELEGATE：** 主调查已验证 path-level three-way merge 和 stable-id object-array union，但最影响未来状态架构的剩余边界正是无 ID 数组、重复 ID、显式删除、类型冲突、双存档 clean/dirty 分歧。这需要连续创建 App 版本并在多个 Simulation 中机械应用，适合独立执行。
- **SCOPE：** 创建一个最小 `MANUS-P3-MERGE-*` App 与 World。App UI 必须只提供可见按钮来读取/写入其 namespaced runtime state，不使用隐藏接口。v1 初始 JSON 同时包含：无 ID primitive array、无 ID object array、重复 `id` object array、scalar、object、null、nested key。创建两个 fresh Simulation；A 修改指定叶子/数组，B 保持 clean。依次发布并应用版本：v2 改 clean sibling 与数组；v3 将 scalar↔object、object↔array；v4 用 omission 与 explicit `null` 表示删除候选；v5 恢复字段并增加重复 ID 冲突。每次先记录旧存档状态，再 Apply update，记录 Turn/energy、A/B 合并结果与 fresh vN literal seed；最后 reload 复核。
- **DO NOT：** 不使用主 Agent App/World；不调用隐藏 API 或直接改存储；不做并发压力；不把 `null`、omission 或类型变化自动称为 tombstone；不测试 App Market 索引、Gift、Rating 或 Phase 2 Creator 通用校验。
- **INPUTS：** `docs/research/worldos/apps/APP_RUNTIME_ARCHITECTURE.md`、`docs/research/worldos/apps/APP_CREATOR_SYSTEM.md`、`docs/research/worldos/06_OPEN_QUESTIONS.md`、EVD-0235；WorldOS `/apps/create`、World Creator、Simulation 的正常 App install/update UI。
- **TEST MATRIX：** save=`A dirty/B clean/fresh`；version=`v1..v5`；shape=`primitive array/no-id objects/duplicate-id objects/scalar/object/array/null/omitted/restored`；operation=`local mutation/apply/reload`；result=`preserved/replaced/union/coerced/dropped/error`；accounting=`Turn delta/energy delta`。
- **EXTERNAL SIDE EFFECTS：** 允许创建、发布、安装、升级和最终删除专用 P3 App/World/Simulations；允许消耗少量免费电量，只通过正常 UI。
- **DELIVERABLES：** `MANUS_P3_APP_MERGE_EDGE_MATRIX.md`、版本定义表、A/B/fresh 逐路径结果 CSV、每版 publish/apply/reload 时间线、对象和 Simulation URL、清理 manifest。
- **ACCEPTANCE CRITERIA：** 每个 edge shape 都有 dirty、clean 和 fresh 三方结果；每次 Apply 的 Turn/energy影响明确；至少一次 reload 后状态与即时状态对照；无法表达显式删除则记录 UI/schema 限制而不是猜测。
- **STOP CONDITION：** v1→v5 完成并清理或明确保留所有 P3 资产后停止；不扩展到索引、权限或市场测试。
- **DEPENDENCY：** 立即可启动；与主 Agent 当前 Achievement App 操作不共享对象。

## TASK 4 — Maps `有底图` vs `全部` Catalog Set Difference

- **PRIORITY：P1**
- **WHY DELEGATE：** 主调查已完整滚出 `有底图=1,083`，但 `全部` 的终点集合、差集含义、重复规则和无底图样本仍未知。该任务纯目录滚动和机械数据比对，几乎不消耗账号资源，非常适合 Manus。
- **SCOPE：** 在同一登录会话分别将 `/maps` 的 `有底图` 与 `全部` 从首批 16 滚到连续三次滚动不增长；提取每张卡片的顺序、标题、creator、World href、可见 genre/标签、是否有可预览图片和可见按钮。按 World href 去重，计算 intersection、`全部 - 有底图`、`有底图 - 全部`、重复 href 与同标题不同 href。对 `全部 - 有底图` 随机选 10 个样本，实际打开 `查看大图`、World 详情、`用此地图`第一层后取消，确认“无底图”条目的真实体验。四个 genre（至少一个稀疏、一个高量）分别对两 scope 做 count/difference 对照。
- **DO NOT：** 不重复 `有底图` 的产品机制调查，只需重取当前集合用于同会话差分；不点击最终安装/创建；不修改任何 World；不猜地图 ID或后台模型；不把卡片缺图与无区域/无 Map App 混为一谈。
- **INPUTS：** `https://worldos.cc/zh-cn/maps`；`docs/research/worldos/maps/MAP_SYSTEM.md`、`MAP_LIFECYCLE_RELATIONSHIPS.md`、EVD-0244。
- **TEST MATRIX：** scope=`有底图/全部`；phase=`initial/every-append/terminal`；identity=`href/title+creator`；difference=`intersection/only-all/only-base/duplicate`；sample action=`preview/world/open use-dialog/cancel`；genre=`全部 + 4 selected genres`。
- **EXTERNAL SIDE EFFECTS：** 无；只读浏览、滚动、打开预览/对话框并取消。
- **DELIVERABLES：** `MANUS_P3_MAP_CATALOG_DIFF.md`、两个完整 card CSV、差集/重复 CSV、10 个差集样本操作证据、终点与样本截图。
- **ACCEPTANCE CRITERIA：** 两个 scope 都有稳定终点和完整可重算集合；CSV 行数等于页面终点计数；差集结论按稳定 href 建立；10 个样本真实触发而非根据缩略图推测。
- **STOP CONDITION：** 全量集合、四 genre 对照和 10 个差集样本完成后停止；不进入 Map Creator/Simulation。
- **DEPENDENCY：** 立即可启动；与主 Agent 当前工作无共享写入。

## 推荐执行顺序

1. Task 2（最能利用 Manus 的电量优势，先启动长 Turn 序列）
2. Task 3（最高架构价值，独立 P3 对象）
3. Task 1（最终页面级控件清单，穿插在 Turn 等待期间）
4. Task 4（纯机械目录差分，最后执行）

## 明确不再分配

- Marvis 的 Guest/non-owner/Public 权限、Remix、社交权限。
- Manus Phase 1 App Gift / App discovery。
- Manus Phase 2 App Market 分类 census、Creator 通用字段边界、Responsive、Non-App discovery timeline、Locale/routing。
- Private/Unlisted、真实支付、真实 API Key、会员 Export artifact。
- 主 Agent 正在执行的 Achievement 定义删除、App 卸载/重装、旧/新 Simulation 投影与 Rewind 关系。
