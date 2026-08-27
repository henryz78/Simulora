# 外部 Agent 委派建议

日期：2026-08-25（Asia/Shanghai）  
Source of Truth：`docs/research/worldos/`、`docs/research/worldos/11_PARALLEL_AUDIT_MERGE.md`（如存在）、`docs/research/external/marvis/phase-3/` 与当前主调查证据索引。  
总原则：这是定向补缺，不是重新全面调查 WorldOS；不进入产品开发，不重复 Marvis 已完成的 Guest / logged-in non-owner / Public 权限基线。

## A. 现在立即可以启动

### TASK NAME — Entitled Visibility State Matrix

- PRIORITY：P0
- WHY DELEGATE：当前主测试账号是免费账号；World 的 `不公开列出` 与 `私有`均实际触发会员墙，无法生成外部样本。此任务需要一个已经合法具备会员权益的独立测试账号，并适合用两个浏览器身份持续跑直链/搜索/存档矩阵。
- SCOPE：用全新一次性 World 和 Character 样本完成 `Public → Unlisted → Private → Public`。每次保存/发布后，以 Owner、logged-in non-owner、Guest 三身份检查详情直链、Search/Explore、Creator Profile、Remix、Start/Chat、既有 Simulation、Share canonical、版本记录；记录传播延迟和恢复行为。若 Collection 的 `仅自己`样本可由同一独立账号创建，再补 Owner/non-owner/Guest 直链与目录/Search，但不要重跑 Public/链接可见合集。
- DO NOT：不要付款、购买会员或绕过权限；不要使用/修改主 Agent 的现有测试对象；不要重跑 Marvis 的 Public 基线；不要猜 URL、API 或后端实现；不要访问其他用户私有内容。
- INPUTS：`https://worldos.cc/zh-cn/worlds/create`、`https://worldos.cc/zh-cn/characters`、`https://worldos.cc/zh-cn/collections/new`；阅读 `docs/research/worldos/06_OPEN_QUESTIONS.md` 的 OQ-0021/OQ-0030、`docs/research/worldos/08_MISSING_FEATURE_AUDIT.md`、`docs/research/worldos/11_PARALLEL_AUDIT_MERGE.md`（若存在）。主账号现有样本仅供命名/行为参考，不可改动。
- TEST MATRIX：对象=World/Character/可选 Collection；可见性=Public/Unlisted/Private/恢复 Public；身份=Owner/B/Guest；入口=Direct/Search/Explore/Profile/Share；动作=View/Start or Chat/Remix/Favorite/Comment；已有 Simulation=切换前创建、切换后访问、恢复公开后访问；采样时间=立即、5 分钟、30 分钟、2 小时或状态收敛。
- EXTERNAL SIDE EFFECTS：允许在独立测试账号创建、编辑、发布、改可见性、创建 Simulation、Remix 和最终删除专用 `EXT-VIS-*` 数据；不允许付款或改动主 Agent 资产。
- DELIVERABLES：`EXT_VISIBILITY_MATRIX.md`、逐步时间线 CSV/Markdown、每个关键状态至少一张截图、对象/Simulation/Remix URL 清单、UNKNOWN/失败原因清单。
- ACCEPTANCE CRITERIA：每个可实际设置的状态都有 Owner/B/Guest 的 Direct+Discovery+Action 结果；Public→非公开对既有 Simulation 和恢复公开的传播有明确证据；无法执行的状态标为 `ENTITLEMENT_BLOCKED`，不能推断。
- STOP CONDITION：完成上述矩阵并删除或明确保留全部 `EXT-VIS-*` 样本后停止；若账号没有现成会员权益，记录会员墙并立即停止，不得付款。
- DEPENDENCY：不依赖主 Agent 未完成工作；仅在外部 Agent 已有合法会员权益时立即启动，否则归入 C（当前不可执行）。

### TASK NAME — App Gift Transaction Isolation

- PRIORITY：P0
- WHY DELEGATE：主调查已发现同一创作者的 Profile 收礼成功而其 App 失败；一次失败序列出现 `-5`，另一次失败无净扣费。需要重复、严格前后快照和长时间余额复查，外部 Agent 的独立余额与长时运行尤其适合，且不会消耗/扰动主账号剩余能量。
- SCOPE：在专用发送账号与专用创作者账号上创建最小公开 App、World，并使用同一创作者的 Profile/App/World 三种送礼入口。每笔仅用最低 20 档；每次记录发送前、点击后立即、30 秒、5 分钟、30 分钟的发送余额、接收方收入、对象打赏榜、Profile 打赏榜、Toast/Modal/网络错误的可见 UI。至少重复 App 失败三次，分开测试官方 App、自己新建 App、已有社区 App；成功后不要为了凑样本继续消耗。
- DO NOT：不要充值、付款、购买额度；不要使用主 Agent 账号或主 Agent 资产；不要连续快速点击/压力测试；不要把 UI 失败解释成后端原因；不要提交 100 以上档位。
- INPUTS：参考 `docs/research/worldos/07_EVIDENCE_INDEX.md` 的 EVD-0210、0227、0229、0230；`docs/research/worldos/platform/CREATOR_ECONOMY.md`、`docs/research/worldos/platform/CREDIT_SYSTEM.md`、OQ-0041。WorldOS 入口：Profile/World/App detail 的 `送礼`。
- TEST MATRIX：目标=Profile/World/App；App 所有权=official/self-created/other community；尝试序号=首次/同目标重复；余额边界=充足且记录精确值；结果=success toast/failure toast/purchase wall/silent；时间=immediate/30s/5m/30m；投影=sender/object/creator/leaderboard/notification。
- EXTERNAL SIDE EFFECTS：允许专用账号创建/发布/删除 `EXT-GIFT-*` App/World，使用免费测试电量发送最低档礼物；不允许真实付款或改动主 Agent 数据。
- DELIVERABLES：`EXT_APP_GIFT_ISOLATION.md`、逐笔 ledger 表、时间序列截图、失败/成功 Toast 原文、最终 defect reproduction rate；若发现扣款后退款，记录准确时间窗口。
- ACCEPTANCE CRITERIA：至少一个同创作者 Profile-vs-App 对照、一个同钱包 App-vs-World 对照、三个独立 App 最低档尝试；每笔都有完整前后余额和双方投影，能够明确区分“无扣款”“部分扣款”“全扣款后退款”“成功结算”。
- STOP CONDITION：矩阵达到上述最小样本或免费余额低于再做一次最低档时停止；不得充值。
- DEPENDENCY：现在可启动，但必须使用独立账号/独立余额；不依赖主 Agent。

### TASK NAME — App Discovery Convergence Monitor

- PRIORITY：P1
- WHY DELEGATE：Direct URL、Owner Market、外部 Market、Unified Search 已证实是独立投影，但 eligibility 和收敛 SLA 仍未知。该任务需要数小时定时重复采样，适合长时间外部浏览器自动化，不值得占用主调查交互窗口。
- SCOPE：创建一个唯一命名的最小 App，按 `Draft → Publish → direct public → Market → Unified Search → downlist（若正常 UI 可用）→ relist` 跑完整状态，并在 Owner、Guest、logged-in non-owner 记录标题/slug 搜索。固定采样 0、1、5、15、30、60、120 分钟，之后每 2 小时至 12 小时或收敛；同时记录使用数为 0 与安装到一个公开 World 后的变化。
- DO NOT：不要猜测或调用隐藏 API；不要修改主 Agent 的 `test-app-first-publish-001`；不要重复广泛 App Market 控件审计；不要为了得到 downlist 而删除有依赖的他人对象；不要付款。
- INPUTS：`/zh-cn/apps/create`、`/zh-cn/apps`、`/zh-cn/worlds/search?tab=apps`、新建 App 直链；阅读 EVD-0179、0180、0186–0190、0218 与 `06_OPEN_QUESTIONS.md` 的 App discovery 问题。
- TEST MATRIX：身份=Owner/B/Guest；入口=Direct/Market title/Market slug/Unified title/Unified slug；状态=Draft/Published/installed usage 0→1/downlisted/relisted；时间=0m–12h；viewport=Desktop 即可，移动端不重复。
- EXTERNAL SIDE EFFECTS：允许在独立账号创建/发布/安装/下架/重发/最终删除 `EXT-INDEX-*` 数据；不得触碰主 Agent 对象或付费。
- DELIVERABLES：`EXT_APP_INDEX_TIMELINE.md`、时间序列矩阵 CSV、关键状态截图、所有 URL、对“未索引”和“直链不可见”的严格区分。
- ACCEPTANCE CRITERIA：每个状态至少有 Owner+Guest，若 B 可用则三身份；每个时间点同时采 Direct/Market/Unified；能够给出最短/最长已观察收敛界限或明确 `NO_CONVERGENCE_WITHIN_12H`。
- STOP CONDITION：12 小时或所有身份/入口连续两次采样稳定后停止；清理专用数据并记录清理传播。
- DEPENDENCY：现在可启动；最好有独立 Owner 和 B，会比仅 Guest 更完整。

## B. 等开发里程碑后再启动

### TASK NAME — Product Experience Parity Browser Regression

- PRIORITY：P1（里程碑后）
- WHY DELEGATE：实现出现后，需要反复跑浏览器级生命周期、权限和跨状态回归；长时外部 Agent 可以把研究结论转成独立验收证据。但当前明确尚未进入开发，没有可测试的自有产品，因此现在启动只会制造空工作。
- SCOPE：在我们的网站具备登录、World/Character/App/Simulation 最小贯通后，把 `docs/research/worldos/05_PARITY_TEST_SUITE.md` 中已验证用例转成可重复浏览器测试；优先 P-001/002/003/004/006/007/008/010/019/030/034/044/045/046。按 Owner/B/Guest 和 desktop/mobile 运行，记录状态、截图、错误和 WorldOS 对照差异。
- DO NOT：不要在里程碑前搭建测试框架；不要修改产品代码或为让测试通过而放宽断言；不要把 WorldOS 缺陷悄悄当成正确需求；不要访问生产真实用户数据。
- INPUTS：届时提供自有产品 URL、测试账号/seed、部署版本；当前 `04_WORLDOS_PARITY_MATRIX.md`、`05_PARITY_TEST_SUITE.md`、`07_EVIDENCE_INDEX.md`、`ux/PAGE_CONTROL_AUDIT.md`。
- TEST MATRIX：身份=Owner/B/Guest；viewport=1280×720、360×844、844×360；生命周期=before create/draft/published/updated/deleted/reloaded；跨系统=Version/App/Map/Save/Rewind/Credits；失败态=权限/余额/404/网络/并发。
- EXTERNAL SIDE EFFECTS：仅允许在专用 QA 环境创建、修改、发布和删除测试数据；禁止生产环境真实用户与真实支付。
- DELIVERABLES：版本化回归报告、通过/失败/阻塞矩阵、可复现步骤、截图/视频、失败聚类和不一致清单。
- ACCEPTANCE CRITERIA：选定 P 用例全部有可重复结果；每个失败能从干净 seed 重现；区分产品 defect、测试缺陷、WorldOS defect baseline 与 intentional improvement。
- STOP CONDITION：指定里程碑回归集完成并提交差异报告后停止，不自行扩展实现范围。
- DEPENDENCY：依赖我们自己的产品至少完成核心端到端里程碑；当前禁止启动。

## C. 当前不值得做

- 不再全面重跑 Marvis 已完成的 Guest / logged-in non-owner / Public 权限审计。
- 不再从首页开始枚举整个 WorldOS；主 Agent 正在按 Master Specification 做页面级控件收口。
- 不做真实付款、会员购买、充值、有效 API Key 提交或访问控制绕过。
- 不在自有产品尚未出现时提前搭建空壳 E2E 测试工程。
