---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_e0a386999ed511f1a54f525400f8a581
    ReservedCode1: q8rFBoxlB0nkS4VhhlZkNJeHORcyuziy3nDeabfVsGdLE7CLvrdwId6ewyYU/pfHsKMiNuv3rbjC/+sLP14XTsVjbZhy33++b1TGV50KUsecHR6f+l/sDhsm48rlRo4U9KHlrShIV4YNa/IFJGfEfNFjRZA4GCuZQoERPpS4lp1gWfbPMq/m60MqRWE=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_e0a386999ed511f1a54f525400f8a581
    ReservedCode2: q8rFBoxlB0nkS4VhhlZkNJeHORcyuziy3nDeabfVsGdLE7CLvrdwId6ewyYU/pfHsKMiNuv3rbjC/+sLP14XTsVjbZhy33++b1TGV50KUsecHR6f+l/sDhsm48rlRo4U9KHlrShIV4YNa/IFJGfEfNFjRZA4GCuZQoERPpS4lp1gWfbPMq/m60MqRWE=
---

# 05 · ACCOUNT_A_ACTION_REQUIRED（必须由 Account A 配合才能验证的项）

> 以下问题无法由 Guest 或 Account B（非 owner、免费用户）独立验证，必须由 Account A（nixonelton9954@outlook.com / x161880）主动改变对象状态或登录查看。
> 原则：不打断主 Agent；本阶段仅登记为待办，不执行。

---

| # | 待验证项 | 需要的 Account A 动作 | 期望验证的问题 | 当前状态 |
|---|---|---|---|---|
| AA-1 | Public → Private 切换后的传播 | 将某 Public World/App 转为 Private | 已打开的详情页是否仍渲染？刷新/直链行为？是否从 Search 消失？已收藏用户（如 B）的收藏、合集、Remix 副本如何处理？Share URL 是否失效？ | 无样本 → UNKNOWN |
| AA-2 | Unlisted 对象行为 | 创建一个 Unlisted World/App/Character | 直链是否可访问？是否进 Search？可否 Remix？对陌生登录用户可见性？ | 无样本 → UNKNOWN |
| AA-3 | Account A 侧 Notification | 登录 Account A 查看通知中心 | B 的 Remix（ukb1）、关注、评论、收藏是否给 A 生成通知？通知文案/深链内容？ | 触发点已布，未验证通知本体 → CROSS_ACCOUNT_VERIFICATION_REQUIRED |
| AA-4 | 主账号删除后 A 侧即时传播 | A 删除对象后，A 自己视角 | 删除后 World 公开页/版本历史是否保留？与 B 侧观察（URL 404 + Search 0）一致性 | 仅 B 侧验证 → 待 A 复核 |
| AA-5 | Private/Unlisted 会员能力样本 | A（若为会员）创建 Private/Unlisted 对象供 B 验证 | 从 B 视角打开 Private 直链/Unlisted 直链的真实行为（404 vs 可见） | 无样本 → UNKNOWN |
| AA-6 | 老 Version URL 指向 | A 提供历史版本 URL 或 A 侧查看版本选择 | 老版本 Share URL 打开行为、Remix 基于哪个版本 | 无样本 → UNKNOWN |

---

## 说明

- AA-1 / AA-2 属于"需要 Account A 主动改变对象状态才能验证"，本阶段明确不执行，符合任务约束。
- AA-3 的触发点（B 的 Remix/Follow/评论/收藏）已在 Phase-1/Phase-2 产生（Remix ukb1、Follow x161880、World 评论、App/World 收藏），通知本体留待 Account A 登录查看。
- AA-5 依赖 Account A 是否具备会员能力（HANDOFF 标注 Private/Unlisted 为会员功能）。
- 以上全部标记 ACCOUNT_A_ACTION_REQUIRED，建议在主 Agent 协调阶段由 Account A 侧执行。
*（内容由AI生成，仅供参考）*
