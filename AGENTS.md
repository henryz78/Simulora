# AGENTS.md

本文件适用于整个仓库。它是未来 Codex / Coding Agent 的长期项目导航与操作规则，不是 WorldOS 功能规格，也不替代后续原创产品需求。

仓库文档总导航见 `docs/README.md`；主研究会话最终交接见 `docs/coordination/FINAL_MAIN_AGENT_HANDOFF.md`；历史迁移与路径例外见 `docs/REORGANIZATION_MANIFEST.md`。

## Current Implementation Navigation

当前生产实现状态以 `docs/implementation-planning/IMPLEMENTATION_STATUS_HANDOFF.md`
为入口；RE-1–RE-3 当前收尾见
`docs/implementation-planning/RE-1-RE-3-PRODUCT-REALITY-CLOSURE-HANDOFF.md`，
G1–G6 的工程依据仍见 `docs/implementation-planning/G1-G6-FINAL-INTEGRATED-REVIEW.md`。
当前批准行为基线为 `ae02de4fe8de261a4164ee6f67c534f8349e1fd5`：IP-1～IP-6、
G1–G6、RE-1、RE-2 和 RE-3 bounded Product Reality closure 均已通过；生产 live
model 未启用，human browser enjoyment 未执行，IP-7 尚未开始。
下面的阶段性段落保留历史证据；其中旧的 pending / PARTIAL / NOT STARTED
描述不应覆盖上述当前状态。
历史 G1–G6 behavior snapshot 为 `eb55734f258fc9be6f4837df888700e34eaa67e2`，
不再是当前批准行为基线。
用户已授权 bounded Live Model / Product Reality Spike 及所提供公益 API 的真实调用，范围见
`docs/implementation-planning/PRODUCT_REALITY_SPIKE_PLAN.md`；使用本地受忽略的
`.secret.txt` profile，达到供应商限额即停下联系用户。不能擅自放开 production 入口或冻结契约。
该实验已完成 12 次真实调用，结果见 `docs/implementation-planning/PRODUCT_REALITY_SPIKE_REPORT.md`。
用户随后要求继续：已执行最小 RE-1 Return/current-situation 修复，报告见
`docs/implementation-planning/RETURN_CURRENT_SITUATION_REPAIR_REPORT.md`；独立 RE-1 Review PASS，
审查行为基线 `7d668daa64f1b579eec0196c16f2500f255169ab`，原结果见
`docs/implementation-planning/RE-1-INDEPENDENT-REVIEW.md`，不宣称完整 runtime 已获批准。
用户已授权文档收尾及 RE-2 authorized context / explicit Character selection，已实施、独立 Review PASS，0/0/0；
报告见 `docs/implementation-planning/RE-2-AUTHORIZED-CONTEXT-IMPLEMENTATION-REPORT.md`。
独立结果见 `docs/implementation-planning/RE-2-INDEPENDENT-REVIEW.md`，行为 SHA
`3d14dc6792e406ce4c054ee01f4b424b00c27053`、exact-SHA CI `35028511913` PASS。
独立 PostgreSQL 117/117、desktop/390×844 focused 浏览器 18/18 PASS；主 Agent full 浏览器 54/54 为另份自测证据。
仍保留单事实 L3 effect envelope，production deterministic adapter 未变，不宣称完整 AI 世界已验证。
RE-3 routine effects、RE-4 新一轮 live/human validation、IP-7 均未获实施授权，不自动进入。
用户随后授权 RE-2 隔离 context-only live comparison，见
`docs/implementation-planning/RE-2-CONTEXT-REALITY-CHECK.md`。已派发 1 次，供应商 HTTP 429；
该次无模型输出、无 proposal/Commit，明确取消 pending Action，head 不变。该暂停为历史；
用户随后提供新密钥，明确没有 8 次使用上限（八次是 Agent 的实验批次，不是用户限额）；
本地受忽略 profile 已更新，endpoint/model 不变，RE-2 人为 dispatch cap 移除。
实验现完成：共 9 次派发（首个 429 + 8 个输出），2 ordinary + 1 correction Commit，
其余 Actions 明确 cancelled、head/Return 一致。观察到真实对白 agency guard 误拦截和
单事实/L3 envelope 天花板，原文及最小复现见上述报告；没有放宽 guard 或开始 RE-3/IP-7。
仍记录次数、达到供应商限制即停，不无限重试、不擅自换模型。这不是 full RE-4 授权。
后续仅文档 commit 不替换行为审查基线。

用户继续后已实施最小 RE-2 Character dialogue attribution 修复，见
`docs/implementation-planning/RE-2-DIALOGUE-ATTRIBUTION-REPAIR.md`；只识别绑定角色的
comma-delimited says/said，应用／SQL 两条 proposal 校验一致，原失败实验未改写。
real PG 118/118、desktop/390×844 54/54、build/runtime 本地 PASS；随后同一独立 Reviewer
focused Review PASS，0/0/0，独立 domain 19/19、PG 38/38，exact-SHA CI `35034518562` PASS。
已批准修复行为 SHA 为 `d6d6ea9a8278a8510e83ffa70d54baa0503463d8`，原 `3d14dc6...`
RE-2 批准及失败实验证据保留；小修复 CLOSED，没有新模型调用，不宣称完整 AI World。
RE-3 具体契约见 `docs/implementation-planning/RE-3-ROUTINE-EFFECT-CONTRACT.md`：
受限 NPC movement + L0 no-world-effect 初版独立 Review FAIL（3B/3I/1M）；
当前 post-FAIL 修复见 `docs/implementation-planning/RE-3-INTEGRATION-REPAIR-REPORT.md`，
以 successor 0032 修复 worker/SQL/事件及显式 revision-bound NPC/public-route policy；
同一 Reviewer focused 复审已 PASS，0/0/0，行为 SHA
`f435d5b35dcf53c4493a78e84ea0b611872e832b`、exact-SHA CI `35041266321` PASS；
原结果见 `docs/implementation-planning/RE-3-INDEPENDENT-REVIEW.md`。
用户随后授权继续文档收尾和 bounded RE-3 isolated live comparison；
不授权 production live enablement、full RE-4 或 IP-7。IP-7 未开始。
bounded RE-3 comparison 已完成四次真实输出，结果见
`docs/implementation-planning/RE-3-ROUTINE-REALITY-CHECK.md`：
一条 Tavi MOVE exact-confirmed；两条 L0 advice 和一条 guard 拒绝的 L3 draft
明确 cancelled；head/Return/facts/participation 一致。
发现真实 nonbinding-option `keeper can decide` agency guard 误拦截，
原失败样本和最小复现保留。用户随后授权最小 nonbinding-option 修复，见
`docs/implementation-planning/RE-3-NONBINDING-OPTION-REPAIR.md`：
仅 bound NPC narrative 中 bare clause-ending `can decide`；canonical/provenance
仍严格，应用与 successor 0033 SQL 对照通过，real PG 125/125。
同一 Reviewer focused 复审已 PASS，0/0/0，approved behavior SHA
`7cae8d88ae6f20f2f1d9fe6633d0297fdefed352`；独立 fresh PG17 IP-6 39/39、
domain 22/22、A_B role parity 与 exact-SHA CI `35043785122` PASS。
结果追加在 `docs/implementation-planning/RE-3-INDEPENDENT-REVIEW.md`，修复 CLOSED；
后续 documentation-only closure 不替换行为基线。尚未进行 human/browser live play；
无新 production provider、durable L0 dialogue、full RE-4 或 IP-7。

用户随后授权小范围真实浏览器试玩，现已完成，见
`docs/implementation-planning/RE-3-BROWSER-LIVE-PLAY-REPORT.md`。
现有正式 UI + 真 PG + 手动隔离真实 generator（非 production live worker），
desktop/390×844 共 3 次真实输出，2 项 UI exact-confirmed L3 Commit、1 schema
拒绝后 UI cancelled，零 pending、head/Return 一致。Agent 操作，不是 human enjoyment
验证。新增 `--re3-browser` 独立 fixture 与 `process <ACK Action ID>`，不更改生产代码。
发现真实 UI 没传 requestedEffect、默认单事实路径不能自然接上已批准 L2/L0；
失败只显示 Still working 的 comprehension gap 和 growing fact review 阅读负担。
这些是下一 bounded bridge 的建议，不自动批准修复、full RE-4 或 IP-7。

用户随后授权最小 RE-3 participation bridge 修复，记录于
`docs/implementation-planning/RE-3-PARTICIPATION-BRIDGE-REPAIR.md`：正式
Action Composer 现在传递现有 `requestedEffect` 合约（事实变更、选定角色移动、
仅响应），客户端提交身份包含 effect，且 recoverable retry 文案明确说明有界重试。
这是前端 comprehension/contract bridge；数据库、worker、model、authority 语义未改，
IP-7 仍未开始，production live enablement 仍禁止。
首次 focused 独立 Review 对 `ee98f1c...` 返回 `PASS WITH ISSUES`（0B/1I/0M）：
角色起始为空时仍可选择 movement。当前 successor 修复已禁用该选项并增加 submit guard，
E2E 强制无效状态确认零 POST；原结论见
`docs/implementation-planning/RE-3-PARTICIPATION-BRIDGE-INDEPENDENT-REVIEW.md`。
同一 Reviewer 随后对行为 SHA `861ba73c2e0e7504b14c22a70ae82d7afaa7c346`
复审 PASS（0/0/0），exact-SHA CI `35064306833` 成功：real PG 125/125、
desktop/390×844 60/60，quality/build/runtime/container 全部通过。Bridge repair
CLOSED；IP-7、production live enablement、full RE-4 仍未开始或授权。

用户随后授权继续 Product Reality 收敛。`RE-3-PRODUCT-REALITY-CONVERGENCE.md`
是早期收敛调查的历史记录；后续 bounded dialogue closure 已取代其中的
pending 状态。它记录了 browser/API/worker/isolated-runner 路径对照：`requestedEffect`、selected
Character、expected-head、schema/parser/validator 和 confirmation 绑定一致；
正式 browser movement follow-up 的一次 dispatch 因公益 provider HTTPS 路由不可达
而没有模型输出，Action 已明确取消、没有 Commit。隔离 runner 的最小 prompt
compatibility repair 只在 compiled request 之后追加 effect-specific operation
type check，并将 promptVersion 从 3 提升到 4；不放宽 validator、不修改 authority
或 production live adapter。该历史段落当时记录的 `NO_WORLD_EFFECT` 生命周期
已由后续批准的 `COMPLETED_NO_EFFECT` successor 取代；当前 bounded response-only
结果已在 isolated formal Action path 证明，且不产生 World mutation 或第二
truth ledger。Product Reality bounded convergence 已完成；production live
enablement、durable long-term memory redesign 和广泛 effect 扩张仍未开始，
IP-7 仍未开始。

随后用户提供了可达的兼容 ModelScope profile；有限重跑已在同一隔离 session
完成 Tavi/Iora 两次 `COMPLETED_NO_EFFECT` 和一次 L3 exact-confirmed Commit，
结果见 `docs/implementation-planning/RE-3-POST-GUARD-LIVE-CORPUS-HANDOFF.md`。
这只证明 isolated formal Action path 的 response-only terminal 和 L3 boundary，
不启用 production live provider，也不替代 browser/human enjoyment validation。
最终状态与新会话阅读顺序见 `docs/implementation-planning/RE-1-RE-3-PRODUCT-REALITY-CLOSURE-HANDOFF.md`；
IP-7 仍未开始。

IP-9 已实施，G9 独立 Review 首轮 `PASS WITH ISSUES`（0B/2I/1M），修复后同一 Reviewer
复审 PASS。第二轮审计及其修复（`d7430e3`、`e1fa0a6`）见交接 §44；随后
`f5949ac6e4eac509ce5422b130c0c630c8e15206` 又关闭了 export-worker reconciliation
和 endpoint secret findings。同一 Reviewer 对该 exact SHA 返回 `PASS WITH ISSUES`
（0B/1I/0M），剩余项是 exact-SHA CI 与证据文档收尾。其后 CI 失败由 `69228ef`
（仅测试）修复，exact-SHA CI `36094446366` 全部通过；Sonnet 5 Reviewer 复审
`PASS WITH ISSUES`（0B/1I/1M），`c812d6c` 修复后复审 `G9 PASS`（0/0/0）。
当前批准行为 SHA `c812d6c6d29be86be3557a00b4866b5d01f0499f`；其 exact-SHA CI `36096978257` 按用户要求未由
Reviewer 核对，由用户自行核验（见交接 §46、Review §11）。报告见
`docs/implementation-planning/IP-9-IMPLEMENTATION-REPORT.md`，Review 见
`docs/implementation-planning/IP-9-INDEPENDENT-REVIEW.md`，状态见交接 §43–§47。
用户与实现者其后核实该 CI 成功，G9 closed（交接 §47）。
S3 兼容导出对象存储、仅 API 签名的下载链接与删除传播已完成（presigned URL 已移除）。live adapter 只针对 provider double 验证：
没有调用真实 provider，也没有 provider 获得 retention 批准，所以 production live 仍未启用。
PostgreSQL retention purge 仍是 release 义务。用户于 2026-09-24 授权 IP-10，按原 roadmap
engineering track 推进、不加新功能；首个产出是
`docs/implementation-planning/IP-10-REQUIREMENT-EVIDENCE-MATRIX.md`。其中 PR-005
transformed failure 与 LONG-01 的关系变化、thread open/resolve 无现有机制，属
IP-10 无法用测试关闭的实现缺口；用户已决定以独立 bounded track 闭合，契约见
`docs/implementation-planning/MUST-GAP-CLOSURE-CONTRACT.md`（MGC-1，须单独独立 Review），
IP-10 本身仍只验证。MGC-1 已完成：同一独立 Reviewer 复审 `PASS`（0B/0I/1M，已接受），批准行为 SHA `f68addd`，exact-SHA CI `36103979617` 成功；记录见 `docs/implementation-planning/MGC-1-IMPLEMENTATION-AND-REVIEW.md`，状态见交接 §49。`LONG-01` 已在 CI `36198101564` 通过（20 Session／30 天），升级回滚演练与 killed-worker drill 同时通过，见 `docs/implementation-planning/IP-10-LONG-01-AND-DRILLS-REPORT.md`；LONG-01 发现的 SQL 分支切换守卫漏 `COMPLETED_NO_EFFECT` 缺陷经用户授权以 successor 0049 最小修复（`28b0d8a`），独立 Reviewer `PASS`（0B/0I/1M），状态见交接 §50。其余 IP-10 工程项（E2E-CONTINUITY-IMPACT、IP-10.4 兼容矩阵、IP-10.7 告警定义）已在 CI `36207364368` 取得证据；E2E-CONTINUITY-IMPACT 发现的提交后呈现缺口经用户授权以 `1629a2c` 最小修复；新独立 Reviewer 的 final IP-10 engineering review 为 `PASS`（0B/0I/1M，沿用已接受项），G10 可进入 conditional closure：engineering complete, external decisions pending，见 `docs/implementation-planning/IP-10-FINAL-ENGINEERING-REVIEW.md` 与交接 §52。用户随后记录方向性外部决策（见 `docs/implementation-planning/G10-EXTERNAL-DECISION-PACKET.md` §5，均非正式批准），并批准 SA-1 世界编辑器补齐关系状态／剧情线／世界规则：独立 Reviewer 首轮 `PASS WITH ISSUES`（0B/0I/4M），修复后复审 `PASS`（0B/0I/2M 已接受），批准行为 SHA `512ea30`，exact-SHA CI `36218066242` 成功，SA-1 CLOSED，见 `docs/implementation-planning/SA-1-IMPLEMENTATION-REPORT.md` 与交接 §53。编辑器世界无法移动（缺 RE-3 routine policy）与新角色须先知晓事实两项既有问题，用户选择由世界拥有者在编辑器中明确授权移动（后继 `docs/implementation-planning/SA-2-CREATOR-ROUTINE-GRANT-ADR.md`）及提前提醒；SA-2 已实施，新独立 Reviewer `PASS`（0B/0I/4M 已接受），批准行为 SHA `9e06d52`，exact-SHA CI `36220835359` 成功，SA-2 CLOSED；用户随后授权 track B 本地真实模型试玩（Agent 操作，非真人验证），见 `docs/implementation-planning/TRACK-B-LOCAL-LIVE-PLAY-REPORT.md` 与交接 §55：网关修复 `e269364`/`9ca1fdb`/`6f44524` 待 CI 与独立 Review，已提交结果未进入模型上下文一项待用户决定，见 `docs/implementation-planning/SA-2-IMPLEMENTATION-REPORT.md` 与交接 §54；真人试玩（track B）未开始。SHOULD 选择：PR-012/015/016/017 均不选。外部决策与专家/真人验证仍未完成，
不自动进入 beta/launch。

## Long-Term Product Direction

用户明确的最终目标见 `docs/implementation-planning/PRODUCT_DIRECTION_GUARDRAILS.md`：
Simulora 是可长期继续的 AI 世界，不是普通 chat、状态管理系统或单事实修改器。
须保留世界导演/控制者塑造世界与用户进入角色、只控制自己的两种体验视角；
其他角色和世界依据连续状态自然回应，仍遵守冻结 participation / authority。
后续 RE-2/RE-3、Reality validation 和未来 IP-7 必须检查多角色、丰富世界变化、
因果连续性和长期可玩性；当前 first-fact/first-Character/single-rewrite 只是实现天花板，
不得默认为最终产品范围。发现路线收窄须主动指出。该目标不改写冻结契约、不授权
离线自动推进、模型越权或新阶段实施；WorldOS 仍只是研究参考，不复制其表达。

下方 Research Status 中的实现状态是研究封版时的历史边界，不是当前开发状态；
不要用冻结研究交接或旧 Gate 文档中的 `NOT STARTED` / `PENDING` 推翻最新独立结论。

## Repository Layout

- `docs/research/worldos/` — 已冻结的主 WorldOS 黑盒研究与系统级证据。
- `docs/research/external/` — Manus、Marvis、Anonymous 等外部 Agent 原始资料与证据包。
- `docs/product/` — 已冻结的原创 Product Definition V1（Principles、Positioning、JTBD、MVP、PRD 与交接）。
- `docs/system-design/` — 已冻结的原创 System Design V1、领域/状态模型、API/安全/运行契约、ADR、验证策略与架构交接。
- `docs/deliverables/` — 面向后续产品设计与开发的封版交付物。
- `docs/coordination/` — 保留给未来仍在进行的外部 Agent 协作；当前已完成的委派与交接已归档。
- `docs/source-materials/` — Master Specification 等任务原始材料。
- `docs/archive/` — 被新版本取代但仍需保留的历史材料，包括已完成协作、过时构建工具、复现实用脚本和历史证据变体；默认不要把它当作最新结论。
- `outputs/`、`work/` — 保留给后续阶段使用，目前不属于研究 Source of Truth。

## Research Status

- WorldOS product-level black-box research: `STOP`。
- Original Product Definition V1: `FROZEN`。
- Original System Design V1: `FROZEN`; Architecture Audit: `PASSED`。
- Original product implementation at research freeze: `NOT STARTED`；当前状态见上方实现交接。
- 研究封版基线：70 个 Feature ID、64 个 Parity Test、47 个 Open Question、251 条主证据（截至 `EVD-0251`）、30 个页面/嵌套控件面、37 条跨系统关系。
- `UNKNOWN`、`BLOCKED`、`NOT_DISCOVERABLE_IN_NORMAL_UI` 和已确认 defect/quirk 仍然存在；它们已被明确归档，不阻塞研究封版。
- 不要自行恢复全站黑盒调查。只有当某个未决问题真正影响已批准的原创设计时，才进行范围明确的 targeted validation。
- 研究阶段结束不等于批准开发。开始产品代码前必须先有用户批准的原创产品 requirements / architecture。

## Source of Truth

先从以下文件进入，不要依赖对旧会话的记忆：

1. `docs/deliverables/worldos-research/FINAL_WORLDOS_RESEARCH_REPORT.md` — 产品架构级结论与 18 个最终问题。
2. `docs/research/worldos/04_WORLDOS_PARITY_MATRIX.md` — Feature ID、WorldOS 行为、重要性、研究状态与对应测试。
3. `docs/research/worldos/05_PARITY_TEST_SUITE.md` — 可复现的用户任务、前置状态、步骤、预期结果与证据。
4. `docs/research/worldos/06_OPEN_QUESTIONS.md` — 所有保留的 UNKNOWN/BLOCKED、原因和可验证实验。
5. `docs/research/worldos/07_EVIDENCE_INDEX.md` — `EVD-*` 操作路径、前后状态、结果和 confidence。
6. `docs/research/worldos/01_MASTER_FEATURE_INVENTORY.md` — 70 个研究功能的完整索引。
7. `docs/research/worldos/02_FULL_SITE_MAP.md` — 路由、入口、页面层级和主要嵌套表面。
8. `docs/research/worldos/08_MISSING_FEATURE_AUDIT.md` — 最终缺口分类和停止依据。
9. `docs/research/worldos/09_CROSS_SYSTEM_AUDIT.md` — 37 条跨系统关系及残余边界。
10. `docs/research/worldos/10_FINAL_COMPLETENESS_AUDIT.md` — Master Specification STOP-condition 验收。

实现具体机制时继续查阅对应子目录：

- `docs/research/worldos/worlds/`
- `docs/research/worldos/characters/`
- `docs/research/worldos/simulation/`
- `docs/research/worldos/apps/`
- `docs/research/worldos/maps/`
- `docs/research/worldos/platform/`
- `docs/research/worldos/ux/`
- `docs/research/worldos/architecture/DOMAIN_MODEL.md`
- `docs/research/worldos/architecture/OUR_PRODUCT_BLUEPRINT.md`
- `docs/research/worldos/ux/PAGE_CONTROL_AUDIT.md`

外部 Agent 证据的 provenance/冲突限制见：

- `docs/research/worldos/11_PARALLEL_AUDIT_MERGE.md`
- `docs/research/worldos/12_MANUS_CROSS_AGENT_MERGE.md`

原创产品与系统设计的当前 Source of Truth：

1. `docs/product/PRODUCT_DEFINITION_HANDOFF.md` — 冻结的产品定位、范围、PRD 和开放产品决策交接。
2. `docs/product/PRODUCT_REQUIREMENTS.md` — 18 个 PR、7 个 NFR、验收条件和证据/原则追踪。
3. `docs/system-design/SYSTEM_DESIGN_HANDOFF.md` — 当前架构冻结状态、绑定系统真值和下一阶段边界。
4. `docs/system-design/SYSTEM_DESIGN_V1.md` — 架构姿态、模块、权威状态、技术基线和 PRD 映射。
5. `docs/system-design/DOMAIN_STATE_AND_DATA_MODEL.md` — 原创领域语言、状态边界、约束和逻辑数据模型。
6. `docs/system-design/RUNTIME_MODEL_AND_PERSISTENCE.md` — Action/Commit、模型编排、分支/恢复、导入导出和故障语义。
7. `docs/system-design/API_SECURITY_AND_OPERATIONS.md` — API、授权、隐私、安全、可靠性和运维边界。
8. `docs/system-design/ARCHITECTURE_DECISIONS.md` — 17 项已接受 ADR；变更必须通过后继 ADR。
9. `docs/system-design/VALIDATION_STRATEGY.md` — 需求验收、30 天/20 Session 场景、故障与安全验证。
10. `docs/system-design/ARCHITECTURE_CONSISTENCY_AUDIT.md` — `ARCHITECTURE AUDIT: PASSED`。

## Evidence Rules

- `VERIFIED` 只证明文档写明的身份、对象、URL、时间和状态范围；不要把单个样本外推成全平台规则。
- `TESTED`、`PARTIAL` 不是 `VERIFIED`。实现前读取该结论的 Remaining/Edge Cases/Confidence。
- `UNKNOWN` 必须继续保持未知，除非新增直接证据；合理猜测不能升级为事实。
- `BLOCKED` 表示会员、付款、凭证、设备、独立环境或工具边界；不要把未触发等同于功能不存在。
- `NOT_DISCOVERABLE_IN_NORMAL_UI` 表示正常产品路径无入口；不得猜测隐藏 URL、后台 API 或内部对象操作。
- `DEFECT-BASELINE` / reproducible quirk 只描述已观察行为，不证明根因，也不自动要求原创产品复制缺陷。
- Manus/Marvis/Guest 证据必须保留原 provenance。`REPORT_ONLY`、截图错配或缺 raw artifact 的结论不得升级成主账号直接证据。
- 黑盒没有证明的数据库结构、队列、缓存层、索引实现、模型 prompt、Memory 检索机制和算法权重不得写成事实。
- 如果结论会影响数据模型、账本、权限或不可逆迁移，必须回查原始 `EVD-*`，不能只读最终报告摘要。

## Original Product Boundary

- WorldOS 是研究参考和体验比较对象，不是未来产品的设计规范。
- 不复制 WorldOS 的 UI、页面布局、品牌、图标、文案、命名、代码、素材或可识别视觉表达。
- 后续产品必须形成原创定位、信息架构、交互语言、视觉系统和技术实现。
- 不因为 WorldOS 存在某功能就默认我们的产品必须实现；是否纳入由用户批准的原创 requirements 决定。
- 一旦原创 Product Requirements / Architecture 被批准，它们是产品行为的最高依据。若与 WorldOS 不同，不得擅自“修回 WorldOS”。
- 将新的原创规格放在独立目录（建议 `docs/product/`）；不得混入或改写 `docs/research/worldos/`。
- `docs/research/worldos/` 是冻结的历史研究记录。实现方便、技术限制或产品取舍都不是篡改历史证据的理由。新增 targeted validation 应追加独立证据和日期，不得覆盖原观察。

## Implementation-Critical Lessons

### 1. 先定义身份与投影，再做页面

同一概念可能是不同对象：全局 Character、World-local Character 和 Simulation runtime Character 不可合并；App definition、World App configuration 与 Simulation App state 也不可合并。Direct URL、Search、Market、Mine、Profile 和 History 是不同投影，可能异步收敛或产生孤立记录。

### 2. World Version 与 Simulation state 必须分层

Published World、Draft、Version snapshot、Simulation baseline 和玩家 dirty state 是不同层。已观察到的更新接近路径级三方合并，并对 stable-ID 对象数组做身份合并。不要用“新版 JSON 覆盖存档 JSON”实现升级；无 ID/重复 ID、tombstone 和类型冲突仍是 OQ，需由原创规格明确决定。

### 3. Turn 是跨系统事务，不是一条聊天消息

一个 Turn 可能同时产生模型输出、Story、Events、Time、Wallet、Inventory、Stats、Relationships、Quest、Map 和 App state 变化，并伴随能量结算与生成期锁定。定义原子提交、失败回滚、幂等和派生投影刷新；不要让各 App 私自维护互相冲突的真值。

### 4. App Runtime 有三层状态和动态成本

App 可在 World 中配置，也可在单个 Simulation 动态安装。额外 App 会改变后续 Turn 成本；Rewind 可恢复 active App 集合和价格，但 UI Dock 曾暂时 ghost 到 reload。计费应从权威 active state 派生，不能从当前渲染的 Dock 推断。

### 5. Save、Checkpoint、Branch 与 Rewind 不是同义词

Checkpoint 是可继续运行的独立 Simulation 副本；Rewind 是同一 UUID 内截断未来并恢复选定快照。必须逐字段定义 snapshot membership。已验证 Story/Time/Chat/Relations/Social/active Apps 可回滚，而已消耗 Credits 不退款；Important Facts、一次性 `playerSetup` 和 Account×World Achievement ownership 位于已验证的 Rewind 边界之外。

### 6. Memory 不是一个字段

至少区分隐藏上下文召回、可见 Character 自动摘要、手工编辑摘要、World Memory、Important Facts 和 `playerSetup`。可见摘要按批生成并有 tail lag；看不到 Memory 不代表模型没有召回。分支隔离、手工内容长期合并和跨模型优先级必须由原创产品明确设计，不能假设固定 T20/T25 阈值。

### 7. 删除、下架和失联是不同状态机

删除 source Character 不会级联删除已有 World-local/Remix 副本；删除 World 可使 runtime 404，却暂留可重命名/删除的 orphan History；删除或下架 App 对 owner/public/installed World 的投影不同。所有删除都应明确确认、级联范围、tombstone、索引收敛、恢复和 Undo 策略。

### 8. Remix 是深复制加 lineage，不是引用别名

副本有独立 owner、slug、version 和运行能力。公开 attribution 只指向直接父级；中间父级删除后，后代可存活而 attribution 消失。许可检查应发生在复制事务提交前；不要因父级消失级联删除后代。

### 9. Map 横跨目录、Creator、Version 和 Turn

Map 是目录资产、World 定义和 runtime App。导入既有 World 只写 Draft并要求 Publish；区域、阵营、Character alias 和 marker 要跨版本、旧/新存档及 Rewind传播。一个新建路径曾先公开无 Map 的 v1，再把 Map 留在 v2 Draft；不要假定“使用地图创建 World”是原子操作。

### 10. 权限与发现面必须分开测试

Owner、logged-in non-owner 和 Guest 的控件与结果不同。Public、link-visible、only-me、Unlisted、Private，以及 direct access、directory/search inclusion、Share、Start、Remix、Rating、Comment、Favorite、Follow 都是独立维度。登录不等于拥有者权限；直链可访问也不等于可搜索。

## Reproducible Defects / Quirks to Recheck Before Designing

这些行为有直接证据，但原创产品应明确选择“兼容、修复或重新设计”，不要无意识复制：

- 正余额不足以支付 Turn 时仍可能提交并进入负数，下一次才阻断。
- Rewind 后 active App 与价格已恢复，但 Dock 可能 ghost 到 reload。
- Character Share 生成的 `/worlds/char:<uuid>` 在测试样本中 404。
- 官方和社区 App Gift 均出现失败；一个失败序列出现无法解释的 `-5`。
- App Direct、App Market 和 Unified Search 可长期不同步或按身份分裂。
- 删除 parent World 可留下 dead-UUID orphan History。
- Map “装入并编辑”成功写 Draft 后仍停留在 `/maps`。
- Social setup 的手机模式选择器可 no-op，而 Simulation 内切换正常。
- 畸形 App JSON 可无错误保存并在 reload 后规范化为 `{}`。
- Time 任意目标接受明显无效文本，将其作为普通付费 Turn 执行。
- Important Facts 清空是无确认、无 Undo 的直接持久写入。
- Achievement ownership 与定义/Simulation 快照分离，部分投影需 reload 收敛且不随 Rewind撤销。

需要精确复现、修复或写回归测试时，先在 `docs/research/worldos/07_EVIDENCE_INDEX.md` 查对应 EVD，再查 Matrix/Test Suite；不要只凭本节概述实现。

## Working Rules for Future Coding Agents

1. 实现任何机制前，先用 Feature ID 在 Inventory/Parity Matrix 定位，再读对应 subsystem spec、Parity Test、EVD 和 OQ。
2. 在原创规格中明确记录：`WorldOS observed behavior`、`our product decision`、`reason`、`acceptance test`。两者可以不同。
3. 数据模型、版本合并、Rewind、账本、权限和删除级联属于架构决策；未获得原创规格批准前不要用临时 UI 状态替代。
4. 对 `UNKNOWN` 选择原创行为时，标为产品决策，不要改写成 WorldOS 已验证结论。
5. 如果某个 OQ 真正阻塞设计，先写最小 targeted-validation proposal：对象、身份、前置状态、操作、预期可区分结果、停止条件和外部副作用。不要重新全站爬取。
6. 实现测试以原创产品规格为准；Parity Test Suite 是研究输入，不是自动覆盖原创决策的最终验收标准。
7. 不要为“看起来像 WorldOS”牺牲数据一致性、隐私、安全、可访问性或原创性。
8. 不要在研究文档中记录真实 API Key、支付信息或其他秘密；不要执行真实付款、权限绕过或隐藏接口探测。
9. 文档同步是阶段完成条件：阶段开始/完成、重要修复、独立 Gate 决定和 CI evidence 收尾时，必须同步 `IMPLEMENTATION_STATUS_HANDOFF.md` 及受影响的 README/导航；长任务在 scope、blocker 或批准基线发生实质变化时更新。交付前核对实现范围、Gate 状态、行为 baseline、CI SHA/结果和下一阶段授权是否一致，不能只口头宣布完成。
10. 历史 Audit/Gate FAIL、repair 和原始 Reviewer 结果必须保留；旧文档加最新结论入口而非改写历史。已冻结的 Research/Product/System/Experience 不用于维护开发状态。后续 Gate 追加独立 evidence/closure，行为 commit 与 documentation-only commit 必须明确区分。

## Quick Start for a New Agent

1. 阅读本文件。
2. 阅读 Final Report、Parity Matrix、Open Questions 和 Final Completeness Audit。
3. 根据任务涉及的 Feature ID 打开对应 subsystem 文档、Parity Test 和 `EVD-*`。
4. 读取 `docs/product/PRODUCT_DEFINITION_HANDOFF.md` 与 `docs/system-design/SYSTEM_DESIGN_HANDOFF.md`，确认用户当前授权的是 Experience Design、Prototype 还是 Implementation；不要把“架构已冻结”误当成自动批准实现。
5. 实现相关任务必须同时遵循 PRD requirement、对应 ADR、系统契约和 Validation Strategy；有冲突时停止并通过明确的产品决策或后继 ADR 处理，不能自行弱化。
6. 保持 `docs/research/worldos/` 冻结，将新的原创产品决策、后继 ADR、实现计划和测试放在研究目录之外。
