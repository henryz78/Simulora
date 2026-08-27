---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_cff70d059ec111f1a54f525400f8a581
    ReservedCode1: DmmvKFKOk/oU2LiEnfEKS9xK51VYSMLuH6iz22ZkBAJ8IjJaSsk7MsUZQCNn/cEFEahSt2eNOx+6qRI8jNzn52xgmzxFTu3Hgb8SCtMoUfu2ecfPYar5h3jxJ0+MqKql0A/bxPF83i/gKtGjI5acIeb6by2BLm5cA/8Q3zGdVasggArt94kGZziMKgY=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_cff70d059ec111f1a54f525400f8a581
    ReservedCode2: DmmvKFKOk/oU2LiEnfEKS9xK51VYSMLuH6iz22ZkBAJ8IjJaSsk7MsUZQCNn/cEFEahSt2eNOx+6qRI8jNzn52xgmzxFTu3Hgb8SCtMoUfu2ecfPYar5h3jxJ0+MqKql0A/bxPF83i/gKtGjI5acIeb6by2BLm5cA/8Q3zGdVasggArt94kGZziMKgY=
---

# 09 · 权限不足状态与会员墙（Account B 视角）
## 9.1 404 状态（VERIFIED）
- 已删除 App / 已删 source Chat / 不存在的路径（/zh-cn/worlds/new、/zh-cn/apps/search、/zh-cn/characters/search、/zh-cn/notifications、/zh-cn/upgrade、/zh-cn/u/{slug}）均返回统一 404 页:
  - 文案: "404: This page could not be found."
  - 无对象名/Creator 泄露，无权限申请入口（纯 404）。
- 注: 统一搜索入口为 /zh-cn/worlds/search；/zh-cn/apps/search、/zh-cn/characters/search 均非有效路径（路由事实，非权限问题）。

## 9.2 评分权限不足（VERIFIED）
- "玩过这个世界后才能评分"——需要账户级游玩记录，未游玩时评分被拦截。

## 9.3 会员墙（PARTIAL，依据观察 + HANDOFF）
- 免费用户 App Studio 仅「存草稿 / 发布」两态，无 Unlisted/Private 选项（观察）。
- Private/Unlisted 为会员能力（HANDOFF VERIFIED，主 Agent 已确认会员墙 BLOCKED，不测试付费路径）。
- 定价页对免费用户可见（订阅/加量包/自备 API/赞助），订阅需绑定银行卡、国际卡支付需切换（观察）。

## 9.4 编辑权限（跨账号）（VERIFIED）
- Account B 搜索自己的 Remix 副本显示「编辑」；Account A 的对象不显示编辑入口（仅 改编/立即开始）→ owner 专属操作对非 owner 隐藏。

## 9.5 结论
- 权限不足统一表现为干净的 404（无信息泄露、无申请入口）。
- 功能型权限门槛（评分需游玩、编辑需 owner、Private/Unlisted 需会员）在陌生账号下正常生效。
*（内容由AI生成，仅供参考）*
