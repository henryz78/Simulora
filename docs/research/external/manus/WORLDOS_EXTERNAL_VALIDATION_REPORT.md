# WorldOS 外部受控验证报告

**执行日期：** 2026-08-25  
**目标：** [WorldOS](https://worldos.cc)  
**作者：** Manus AI  
**测试授权：** 用户提供两组独立测试账号，并授权在不付费、不充值、不购买会员及不修改既有非 `EXT-*` 资产的边界内完成受控验证。  
**结论状态：** 已结束；包含已验证结果、明确阻塞项与未确认清理项。

> 本报告只陈述通过 WorldOS 正常用户界面获得的观察结果。它**不**使用隐藏接口、访问控制绕过、压力测试或真实支付；没有尝试绕过账户门控，也没有对第三方对象实施实际 Gift 转账。

## 执行摘要

两组用户提供的测试账号均能正常登录，Creator 账户初始可见余额为 **866 Zaps**，Sender/Non-owner 账户初始可见余额为 **926 Zaps**。索引测试显示，App 发布后 **Direct URL 与 Owner App Market 的 title/slug 查询在首轮观察中即可访问**；但 Owner 统一搜索的 Apps 分类在约 T+2 分钟仍返回空结果，而非 Owner 的统一搜索最晚在 T+18:07 首次观察到 slug 结果。因此，已证实 **Direct、Market 与 Unified Search 并非同步投影**，但不能凭此采样间隔推断精确的最终索引 SLA。[1][2][3]

Gift 验证没有形成任何成功转账。Sender 尝试向官方 `Story` App 发送最低档 **Spark 20** 时，被正常界面提示“注册满 48 小时后才可赠送”拦截；余额仍为 926，且没有新的 Gift 历史。因此，关于实际 70% 创作者入账、发送者/接收者账本配对和余额隔离的结论必须标记为 **`BLOCKED — account gating`**，不能标为通过或失败。[4]

在用户调整规则后，后续每个**实际可观察的**状态应只采用 T+0/T+1/T+3/T+5 分钟的短窗口及“两次一致即停止”规则。由于规则更改发生在 App 发布约一小时后，发布事件无法事后重新测量 5 分钟窗口；Install 操作也未形成可观察状态变更，Delist/Relist 控件在当前零使用量 App 状态下不可用。报告因此不虚构这些状态的短窗口结果。

| 领域 | 最终结论 | 置信度 | 关键限制 |
|---|---|---:|---|
| 账号可用性 | 两个测试账号均可登录 | 高 | 仅测试登录与可见余额 |
| 发布后 Direct URL | 首轮观察即可访问 | 高 | 发布后最早细粒度采样为 T+0 |
| App Market（title/slug） | Owner、Account B、Guest 均可检索 | 高 | 未用于推断内部索引机制 |
| Unified Search → Apps | 早期存在延迟，随后 Owner、Account B、Guest 均可检索 | 高 | 采样间隔不能精确定位收敛秒数 |
| title 与 slug 差异 | 各已观察稳定样本中行为一致 | 高 | 未覆盖模糊、部分或拼写错误查询 |
| Owner / Guest / Account B 差异 | 发现结果一致；Guest 有 Owner 操作文本呈现异常 | 中 | 未验证 Guest 对这些操作的实际写权限 |
| Gift 实际转账与账本隔离 | `BLOCKED — account gating` | 高 | Sender 未满 48 小时；无成功交易 |
| Install 生命周期 | `INSTALL_NOT_OBSERVED` | 高 | UI 提交后无成功确认，硬刷新仍显示 0 uses |
| Downlist / Relist 生命周期 | `BLOCKED — control unavailable` | 高 | 当前零使用量 App 无可见独立下架控件 |

## 范围、身份与测试资产

测试严格使用命名前缀为 `EXT-INDEX-*` 或 `EXT-GIFT-*` 的隔离对象。绝不修改登录前已有的 World、Simulation 或第三方 App；官方与社区对象仅用于检查 Gift 入口与门控，而不发送礼物。

| 项目 | 受控对象 / 身份 | 结果 |
|---|---|---|
| Account A | `idakellams159`，Creator / 接收方 | 可登录；基线 866 Zaps |
| Account B | `2518wllalpor`，Sender / Non-owner | 可登录；基线 926 Zaps |
| Guest | 未登录公开会话 | 已用于 App 发现对照 |
| 索引对象 | `EXT-INDEX-20260825-0445`（slug：`ext-index-20260825-0445`） | 已发布、观察、后续删除 |
| Gift World | `EXT-GIFT-20260825-0455` | 仅用于 Gift 入口验证 |
| Gift App | `EXT-GIFT-APP-20260825-0458` | 仅用于 Gift 入口验证，后续删除 |
| Install 隔离 World | `EXT-INDEX-INSTALL-20260825-0551` | Account B 创建；安装未被观察到 |

## App Discovery 结果

### 发布后传播时间线

本报告以相对时间为主要依据。原始记录的早期绝对时间标签与浏览器/沙箱时钟存在时区标注不一致；这不影响下列**相对时间**与页面证据。为避免误导，未将这些记录用作精确时区或 SLA 断言。

| 相对时间 | 会话 | Direct URL | Market title | Market slug | Unified Apps title | Unified Apps slug | 观察与解释 |
|---:|---|---|---|---|---|---|---|
| T+0 | Owner | YES | — | — | — | — | 详情页可访问，显示 Creator、公开说明与 `0 worlds use this`。 |
| T+0:34–0:41 | Owner | — | YES | YES | — | — | Owner 的 App Market 已能按完整 title 与 slug 返回唯一测试 App。 |
| T+1:33–1:55 | Owner | — | — | — | NO | NO | Unified Search 的 Apps 分类仍显示无结果。 |
| T+16:15–18:07 | Account B | YES | YES | YES | YES | YES | Account B 可在全部五个发现入口找到对象；slug 的统一搜索最晚首次观察为 T+18:07。 |
| T+19:12–20:48 | Owner | YES | YES | YES | YES | YES | Owner 侧全部入口均为 YES。 |
| 约 T+30–34 | Owner 与 Account B | YES | YES | YES | YES | YES | 两个登录会话的全矩阵结果一致。 |
| 发布后稳态 | Guest | YES | YES | YES | YES | YES | 未登录公开会话的发现结果与登录会话一致。 |

这组结果支持以下可证实结论：**详情页和 App Market 先于 Unified Search 可见**。因为 Unified Search 在 T+1:55 仍为 NO、而下一次记录在约 T+17:45 为 YES，统一搜索的实际收敛点只可表述为落在该采样间隔内，绝不能表述为“18 分钟精确 SLA”。

### 跨入口、查询形式与身份矩阵

| 入口与查询 | Owner | Account B | Guest | 结论 |
|---|---|---|---|---|
| Direct URL | YES | YES | YES | 公开详情页在三个会话中均可访问。 |
| App Market — 完整 title | YES | YES | YES | 无身份差异。 |
| App Market — slug | YES | YES | YES | 无 title/slug 差异。 |
| Unified Search → Apps — 完整 title | 早期 NO，后续 YES | YES（延迟样本） | YES（稳态） | 统一搜索具有独立的延迟传播。 |
| Unified Search → Apps — slug | 早期 NO，后续 YES | YES（延迟样本） | YES（稳态） | 无已观察 title/slug 差异。 |
| 硬刷新 | 已执行（Account B） | 已执行 | 不适用 | 刷新后 App 仍显示 0 uses；未观察到 Install 成功。 |

### Guest UI 权限呈现风险

Guest 的 App 详情页在未登录情况下仍渲染了 **Edit / Delete** 的文本链接，但本任务没有尝试让 Guest 点击或执行写操作。这个现象应当被记录为 **UI 权限呈现风险或体验缺陷**：界面暗示的操作与未登录会话的预期权限不一致；它不是已证实的未授权写入漏洞。

> 建议：在未登录或非 Owner 会话中完全隐藏 Owner 专属操作，而不是仅依赖后端拒绝；并为按钮提供一致的登录或权限说明。

## Gift 隔离与账本验证

### 余额基线与实际交易结果

| 项目 | 观察结果 |
|---|---|
| Sender 初始总余额 | 926 Zaps（Daily 176；Permanent 750；Creator earnings 0） |
| Sender 初始历史 | Welcome +600、Daily +200、Referral +150、3 笔 Simulation turn −8；无 Gift 条目 |
| 最低可选 Gift 档 | Spark 20 |
| 官方 Gift 分成披露 | “70% of every gift goes straight to the creator's Zap balance.” |
| 实际提交结果 | 标准 UI 阻止并提示 Gift 在注册满 48 小时后解锁 |
| 交易后 Sender 余额 / 历史 | 未变化；无新 Gift 条目 |
| Creator 实际入账与历史 | 无成功交易，因而不适用 |

因此，以下核心检查均为 **`BLOCKED — account gating`**：最小 Gift 是否从 Sender 扣除、Creator 是否收到 70%、平台份额、Sender 与 Creator Zap history 是否成对出现、以及余额隔离是否保持。不以无交易的余额不变来替代成功交易验证。

### Gift 入口覆盖

| 目标 | 正常 UI 中的 Gift 入口 | 实际提交 | 结论 |
|---|---|---|---|
| 官方 App `Story` | 有；Spark 20 起，披露 70% 给 Creator | 是；被 48 小时门控阻止 | `BLOCKED — account gating` |
| 既有第三方 Community App `The Broadsheet` | 有；档位和分成披露一致 | 否 | 避免对第三方做已知会失败的重复交易 |
| 合资格第三方 Creator Profile `World101` | 有；面板可见 | 否 | 仅验证入口，不涉及第三方付款 |
| 专用 Gift App | 无 Gift 入口，仅 Favorite / Install | 否 | 新发布自有 Community App 未观察到 Gift 投影 |
| 专用 Creator Profile | 无 Gift 入口 | 否 | 新测试 Creator Profile 未观察到 Gift 投影 |
| 专用 Gift World | 无 Gift 入口，仅 Follow / Share / Remix | 否 | Gift 未投影到 World 详情页 |

## 生命周期状态与短窗口规则

用户在后续指示中将索引采样规则改为：每次状态变化只检查 T+0、T+1、T+3、T+5；连续两次全矩阵一致即提前停止；若 T+5 仍未收敛，记录 `NOT_CONVERGED_WITHIN_5M` 并继续下一状态。该新规则在本次**发布状态**的原始采样已结束后才生效，因此不能追溯性地声称已测量发布后 3 或 5 分钟。

| 状态 | 执行与结果 | 短窗口结果 |
|---|---|---|
| Draft → Publish | 发布成功；详见传播时间线 | 新规则生效前发生；不追溯伪造 T+3/T+5 采样 |
| Install | Account B 创建隔离 World 并提交标准 Install；无成功提示或跳转 | `INSTALL_NOT_OBSERVED`；硬刷新后仍为 0 worlds use，未将其当作状态变化 |
| Downlist | Owner 配置页没有独立 Delist / Unpublish 控件 | `BLOCKED — control unavailable` |
| Relist | 依赖可验证的 Downlist 状态 | `NOT_RUN — prerequisite blocked` |
| Cleanup | 两个测试 App 删除成功；两项 World 清理未确认 | 见下节 |

## 清理状态

| 资产 | 清理结果 | 说明 |
|---|---|---|
| `EXT-INDEX-20260825-0445` App | **已删除** | 删除前检查显示 `0 worlds use this`，确认后返回 App Market。 |
| `EXT-GIFT-APP-20260825-0458` App | **已删除** | 删除前检查显示 `0 worlds use this`，确认后返回 App Market。 |
| `EXT-GIFT-20260825-0455` World | **未确认删除** | 页面显示 0 followers、0 评论、无模拟记录；点击 Delete world 时浏览器请求超时，随后会话不可用。为防止误操作而停止重试。 |
| `EXT-INDEX-INSTALL-20260825-0551` World | **未确认清理** | Install 未被观察到；在浏览器会话不可用后无法复核或删除。 |

> 建议后续以各资产 Owner 正常登录，在确认不存在非测试使用者或数据后，手动删除以上两项未确认的 `EXT-*` World；不要操作任何非 `EXT-*` 对象。

## 结论与建议

WorldOS 的公开 App 详情和 App Market 可在发布后非常早期被观察到，而 Unified Search Apps 分类的可用性滞后，构成明确的多投影不同步现象。后续稳态中，Owner、Account B 与 Guest 的 Direct、Market、Search 结果一致，且 title/slug 没有已观察到的行为差异。需要进一步确认的不是“最终会不会出现”，而是产品是否应向用户解释不同表面之间的索引延迟，并避免将 Direct URL 可访问等同于公开搜索已就绪。

Gift 系统的 UI 具有明确的账户门控。现有证据证明未满 48 小时的 Sender 无法完成最低档 Gift，但不支持对实际分账、余额隔离或账本配对作出正负结论。若要完成这部分验证，应在门控自然解除后，使用同样的隔离账号和最低 Spark 20，先记录双边余额/历史，再仅对专用测试 Creator 发起一次交易，并重新检查余额、Creator earnings 与双方 history。

## 证据与原始记录

本报告随附原始操作日志，以便审计具体页面、相对时间、截图路径与每项未完成的原因。截图文件位于会话的证据目录中；关键截图路径已逐项写入原始日志。

- `EXT_WORLDOS_ACCOUNT_VERIFICATION.md`：账户可登录性与余额基线。
- `EXT_GIFT_TRANSACTION_LOG.md`：Gift 入口、门控、余额与历史证据。
- `EXT_APP_INDEX_TIMELINE.md`：索引传播、身份矩阵、硬刷新、生命周期与清理时间线。

## References

[1]: https://worldos.cc/apps/ext-index-20260825-0445 "WorldOS — EXT-INDEX 测试 App（已在完成采样后删除）"
[2]: https://worldos.cc/apps "WorldOS App Market"
[3]: https://worldos.cc/worlds/search "WorldOS Unified Search"
[4]: https://worldos.cc/zaps "WorldOS Zaps history"
[5]: https://worldos.cc/apps/story "WorldOS Story App"
