# Final Main Agent Handoff

Date: 2026-08-26 (Asia/Shanghai)  
Handoff status: `MAIN RESEARCH STOP / IMPLEMENTATION NOT STARTED`

本文件是约 54 小时 WorldOS 主调查会话的最终交接，不是另一份功能报告。下一位 Agent 应从现有证据继续工作，不要依赖旧会话记忆，也不要重新进行全站黑盒调查。

## 1. Current project state

- WorldOS 产品级黑盒主调查已经正式 `STOP`。
- `docs/research/worldos/` 已冻结：70 个 Feature ID、64 个 Parity Test、47 个 Open Question、251 条主证据（截至 `EVD-0251`）、30 个页面/嵌套控件面、37 条跨系统关系。
- Marvis 第二账号、Anonymous/Guest、Manus Phase 1–3 的已提供材料均已阅读、分类并写入现有 merge/conflict 文档。相关外部任务均已完成，不存在仍在运行的 targeted-validation assignment。
- 仍有明确记录的 `UNKNOWN`、`BLOCKED`、`NOT_DISCOVERABLE_IN_NORMAL_UI`、`REPORT_ONLY`、contradictory snapshot 和 defect/quirk；它们是冻结结论的一部分，不代表研究失败。
- 原创产品 requirements、architecture 和实现代码均未开始。`outputs/`、`work/` 只是后续阶段的保留目录。
- 除非某个 Open Question 真正阻塞已批准的原创设计，否则不要再访问 WorldOS 做验证。

## 2. Source of Truth and reading order

新 Agent 建议按以下顺序阅读：

1. [Repository rules](../../AGENTS.md) — 证据边界、原创产品边界和未来工作规则。
2. [Final research report](../deliverables/worldos-research/FINAL_WORLDOS_RESEARCH_REPORT.md) — 先建立产品架构级全貌。
3. [Parity matrix](../research/worldos/04_WORLDOS_PARITY_MATRIX.md) — 用 Feature ID 找行为、状态和对应测试。
4. [Open Questions](../research/worldos/06_OPEN_QUESTIONS.md) — 确认哪些边界仍未知、已阻塞或已解决。
5. [Final completeness audit](../research/worldos/10_FINAL_COMPLETENESS_AUDIT.md) — 研究为何可以停止。
6. [Parallel audit merge](../research/worldos/11_PARALLEL_AUDIT_MERGE.md) — Marvis/Anonymous/Guest 的 provenance、冲突和禁止重复项。
7. [Manus cross-Agent merge](../research/worldos/12_MANUS_CROSS_AGENT_MERGE.md) — Manus Phase 1–3 的证据质量、可接受结论和限制。
8. 按具体 Feature ID 再查 [Feature inventory](../research/worldos/01_MASTER_FEATURE_INVENTORY.md)、[Parity test suite](../research/worldos/05_PARITY_TEST_SUITE.md)、[Evidence index](../research/worldos/07_EVIDENCE_INDEX.md) 与对应 subsystem 文档。

涉及数据模型、账本、权限、Version merge、Rewind 或删除级联时，必须回查原始 `EVD-*`，不能只依据 Final Report 或本交接摘要。

## 3. Directory responsibilities

- `docs/research/worldos/`：冻结的主研究、系统规格、Evidence Index、Parity Matrix/Test 和审计结果；不得为了实现方便改写。
- `docs/research/external/`：Marvis、Anonymous、Manus 的原始/外部证据包；保留各自身份、时间和证据等级。
- `docs/deliverables/`：封版研究交付物，适合快速理解，不代替底层证据。
- `docs/coordination/`：当前或未来的交接/协作文档；本文件是主 Agent 的最终活动交接。
- `docs/source-materials/`：Master Specification 等原始任务材料。
- `docs/archive/`：已完成委派、过时工具、中间输出和历史修正版；只用于 provenance、复现或历史核对，不作为最新产品结论。
- `outputs/`、`work/`：后续阶段使用；当前没有产品实现 Source of Truth。

完整导航和历史路径例外分别见 [Documentation Map](../README.md) 与 [Reorganization Manifest](../REORGANIZATION_MANIFEST.md)。

## 4. Open Questions and completed targeted validation

`06_OPEN_QUESTIONS.md` 中的 47 个编号包含已解决、部分解决和仍开放的问题。不要把“47 个 OQ”理解为 47 个仍待执行实验。当前值得未来设计阶段关注的残余类型主要是：

- 会员/付款边界：Private、Unlisted、Collection `仅自己` 的独立访问矩阵，以及付费上限；当前为 `ENTITLEMENT-BLOCKED`。
- 凭证与环境边界：有效 BYOK/provider failure、跨设备同步、新账号 onboarding；无合法凭证或独立环境时保持 `UNKNOWN/BLOCKED`。
- 真实设备边界：touch、IME、安全区、后台恢复等；模拟 viewport 已完成，真实设备行为仍 `DEVICE-BOUND`。
- 长周期/并发边界：Memory 最终合并节奏、Achievement 并发顺序、通知/索引收敛、跨设备缓存。
- 数据合并边界：无 ID/重复 ID 数组、显式 tombstone、类型冲突；总体三方 merge 架构已有强证据，剩余只是明确 edge cases。
- 发现与索引策略：Direct、Market、Unified Search、Profile/Mine 的资格、缓存和 SLA；能观察到分裂，但不能从黑盒推断内部根因。
- Export artifact/import compatibility、历史 Version 的少量外部路径，以及不可通过正常 UI 达到的 Character clone mutation。

已经交由外部 Agent 并完成的 targeted validation：

- Marvis/Anonymous：Guest 与 logged-in non-owner 权限、Public 内容、登录墙、跨账号 Remix、Favorite/Follow/Comment/Rating、Creator Profile、删除/可见性传播、Collection link-visible、remix-disabled World 等。结果已在 `11_PARALLEL_AUDIT_MERGE.md` 合并；不要重跑。
- Manus Phase 1–3：长机械操作与外部抽样，包括 Character visible-Memory 跨样本差异、Maps Base/All 大目录快照、Creator/permission/control spot checks，以及计划但未完成的 App merge edge matrix。结果和证据缺陷已在 `12_MANUS_CROSS_AGENT_MERGE.md` 分类；不要把 `REPORT_ONLY` 升级为主 Agent `VERIFIED`，也不要因 Manus 某一步受阻而重跑主生命周期。

当前没有要继续派给上述 Agent 的任务。如果未来某个 OQ 真正影响原创设计，只能提出最小 targeted-validation proposal：对象、身份、前置状态、操作、可区分结果、停止条件和副作用。

## 5. Experience that is easy to miss

以下经验来自实际调查过程，单看功能清单容易忽略：

- 浏览器原生 confirm 与站内 modal 是两类不同交互。部分删除/Rewind 原生确认在自动化视角中不可见，曾由用户代点；没有观察到确认后的状态变化时，不得把按钮点击记为操作成功。
- Account A 是主账号；Account B 属于用户外部 Marvis 环境。主 Agent 无法看到 Account B session 不等于第二账号不可用。不要再创建一个普通子 Agent 并误称其为 Account B。
- “直链可访问”“目录收录”“统一搜索命中”“Mine/Profile 可见”是不同投影。一个表面缺失不能证明对象不存在、已删除或未发布。
- App downlist→republish 样本中，Guest/B 直链从 404 恢复，但 Market/Search 仍不命中。只能记录 publication-state association 和 projection split，不能宣称后端缓存、审核或权限 bug 根因。
- Version apply、Rewind、Checkpoint 和 Save 经常看起来像相似按钮，但对象身份、UUID、未来截断、Credits 和 snapshot membership 完全不同。任何实现都要逐字段定义，而不是复制 UI 词义。
- World update 的行为接近路径级三方合并；stable-ID 数组与 dirty/clean path 有决定性影响。简单用新版 JSON 覆盖旧 Simulation 会破坏已观察行为。
- Character Memory 的可见摘要不是固定 Turn 阈值。主样本和 Manus 样本不同；“可见卡片为空”也不能证明模型没有隐藏召回。
- Map“用此地图创建 World”曾产生公开无 Map 的 v1，再留下带 Map 的 v2 Draft；创建流程不是原子事务。导入既有 World 也可能写 Draft 成功但不跳转编辑器。
- Credits 不随 Rewind 退款；一次失败/异常 App Gift 序列还出现过无法解释的 `-5`。这是 defect baseline，不是可以推断的账本规则。
- 删除 source、删除副本、下架、索引失联和 orphan History 是不同状态。不要设计一个通用 `deleted: true` 就假设解决所有生命周期。
- External evidence 需要先审 provenance。Manus Phase 1/2 缺部分 raw artifacts；两个 CSV 存在未正确引用逗号导致的列错位；某个 Memory 截图不包含报告声称的问答。Markdown/raw notes 有时比 CSV 控制性更高。
- 同一页面的卡片总数和 Maps terminal count 是时间/账户/viewport 快照，不是产品常量。不要把 1,083、1,085、1,181 等采样数写进业务规则。
- 研究期间创建了大量测试对象并做过删除、下架、重发、分支和 orphan 清理。不要根据当前测试账号的整洁程度反推功能语义，也不要为了“清理账号”恢复调查。

## 6. Absolute do-not-repeat boundary

下一位 Agent 不得重复：

- 全站页面、按钮、菜单、弹窗、移动 viewport 或 Guest 控件普查。
- World、Character、App、Map、Simulation 的完整生命周期。
- 主 Turn/App Runtime/Save/Rewind/Branch/Version/Memory/Map 的主实验。
- Marvis 已完成的 Guest/Account B 权限、社交、Remix、Collection 和公开可见性矩阵。
- Manus 的 Character Memory T35 长跑、Maps 全目录滚动、固定样本预览和已受阻的 App matrix。
- 为确认 UI 文案或“看起来应该如此”而重新操作网站。
- 猜测隐藏 URL、后台 API、数据库结构、模型 prompt、索引实现或 Memory 算法。

只有用户批准的原创设计被某个具体 OQ 阻塞时，才允许一次范围明确的 targeted validation；验证结果应追加新日期和 provenance，不覆盖原记录。

## 7. Evidence-state boundaries

- `VERIFIED`：只覆盖文档列明的身份、样本、URL、时间与前置状态；不是普遍定律。
- `TESTED/PARTIAL`：核心路径有实际观察，但存在未测身份、长期、并发、设备或边界条件。
- `UNKNOWN`：黑盒未区分可能原因；不能用合理猜测补齐。
- `BLOCKED`：因会员、付款、有效凭证、设备、独立环境或工具条件无法合法触发；不代表功能不存在。
- `NOT_DISCOVERABLE_IN_NORMAL_UI`：正常路径没有入口；不得猜测隐藏操作。
- `REPORT_ONLY/NEW_EXTERNAL`：外部 Agent 报告或独立样本，只能按其 artifact/provenance 等级使用。
- `DEFECT-BASELINE`：已复现的异常或 quirk；只证明现象，不证明根因，也不要求原创产品复制。

## 8. Recommended next-stage sequence

1. **外部 Agent 结果整合**：确认所有已提供包都在 `docs/research/external/`。当前 Marvis/Anonymous/Manus 包已经整合；若没有新包，此步只需确认，不做网页测试。
2. **Cross-Agent Evidence Merge**：以 `11_PARALLEL_AUDIT_MERGE.md` 和 `12_MANUS_CROSS_AGENT_MERGE.md` 为起点，不从原始材料重建全部调查。
3. **Conflict Check**：重点审 `REPORT_ONLY`、截图错配、动态快照、身份差异与后续状态覆盖，不把冲突强行平均成一个结论。
4. **Gap Audit**：对照 Open Questions、Missing Feature Audit 和 Final Completeness Audit，只确认 gap 已被解决、接受、阻塞或延期；不要追求全部升级为 `VERIFIED`。
5. **Research v1 Freeze**：现有主研究已冻结。若确认没有新增外部包，可把当前合并后的 corpus 标记为正式 Research v1；只新增版本/manifest，不重写历史证据。
6. **原创产品需求与架构设计**：在独立的 `docs/product/` 中定义原创定位、需求、ADR、领域模型、验收标准和实现计划，获得用户批准后才能开始代码。

WorldOS 只是研究参考和体验比较对象，不是未来产品必须复制的规格。未来产品不得复制其 UI、品牌、文案、布局、代码或可识别表达；功能是否采用、缺陷是否兼容、行为是否不同，均由用户批准的原创产品规格决定。

## 9. Stop instruction

本交接写入后，主研究 Agent 停止工作。不要继续浏览 WorldOS，不要清理测试账号，不要生成新的研究图表，也不要启动产品实现。
