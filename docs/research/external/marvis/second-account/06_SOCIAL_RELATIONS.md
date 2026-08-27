---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_cdb6784e9ec111f1a54f525400f8a581
    ReservedCode1: cs+cAtcHMJEovwjMfDmZuKtYlcNublx6FUOGeRCD7EYI64YE4BgImQoLGPI5RnIgBZRQoN5hxbGpf7Y4xtUUsCBVPpLJMK00y6cNNX2OQwwYjY5Xtd2m8VATIhDFtata7agodAR21jE7WdBIn4sqU02dNseGkfXAJ+plpJ63odmxKCJrD/OLlPhzI+E=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_cdb6784e9ec111f1a54f525400f8a581
    ReservedCode2: cs+cAtcHMJEovwjMfDmZuKtYlcNublx6FUOGeRCD7EYI64YE4BgImQoLGPI5RnIgBZRQoN5hxbGpf7Y4xtUUsCBVPpLJMK00y6cNNX2OQwwYjY5Xtd2m8VATIhDFtata7agodAR21jE7WdBIn4sqU02dNseGkfXAJ+plpJ63odmxKCJrD/OLlPhzI+E=
---

# 06 · 社交关系：Follow / 收藏 / 评论 / 合集（Account B 视角）
## 6.1 Favorite / Save / Collection（VERIFIED）
- 「加入世界合集」入口在公开 World 详情页；Account B 无合集时弹窗提示"你还没有创建合集"并提供创建入口。
- 创建合集流程: /zh-cn/collections/new → 名称「第二账号测试合集 001」→ 搜索并添加 Account A 的 World → 保存。
- 结果 URL: /zh-cn/collections/di-er-zhang-hao-ce-shi-he-ji-001-9n2j（1 个世界，创建者 mehraxbobaid78）。
- 加入合集的 World 同时出现在我 Profile 的「收藏的世界」（收藏=加入合集语义）。
- 刷新后合集/收藏持久化（VERIFIED）。

## 6.2 跨账号评论（VERIFIED）
- 公开 World 详情页评论框，Account B 填入「Account B 跨账号评论测试 001」→ 发送按钮由 disabled 变为可点击 → 点击发送成功。
- 评论计数 0 →「评论 · 1」；评论显示作者 mehraxbobaid78 + 时间"刚刚"。
- 刷新后评论与计数持久化。
- 评论操作项: 赞 / 回复 / 编辑 / 删除。
- 是否给 Account A 产生 Notification: CROSS_ACCOUNT_VERIFICATION_REQUIRED（见 10）。

## 6.3 评分（VERIFIED 权限门槛）
- 详情页评分区: "还没有评分,来做第一个吧"；「我的评分」被拦截，提示"玩过这个世界后才能评分"。
- 评分需要先运行过该 World 的 Simulation（账户级记录）。

## 6.4 Follow（详见 04）
- Follow/Unfollow 持久化、计数实时、刷新保持。

## 6.5 结论
- 社交关系（收藏/评论/关注）对陌生账号完全开放且持久化。
- 跨账号交互是否触发对方通知 → 留待 Account A 验证。
*（内容由AI生成，仅供参考）*
