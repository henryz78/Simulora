---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_de35b5429ed511f1a54f525400f8a581
    ReservedCode1: Jf6PABJPKxckvS41ck2XLm+sJGWzgaLKtYEPPLhyse6omYpJ0BxZr4vZK9v0y4/CS4mMsgDH6mMlb7l5l90RlDiOdxWOOEMfNuh3874cz01cnPq5MqMFoS7mt9r/OB5uhevNwGLiyirek1oRf7E3i6GCkNIuUX072bqV+hIsm0Oizwzu3IgZZ5Zo5aY=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_de35b5429ed511f1a54f525400f8a581
    ReservedCode2: Jf6PABJPKxckvS41ck2XLm+sJGWzgaLKtYEPPLhyse6omYpJ0BxZr4vZK9v0y4/CS4mMsgDH6mMlb7l5l90RlDiOdxWOOEMfNuh3874cz01cnPq5MqMFoS7mt9r/OB5uhevNwGLiyirek1oRf7E3i6GCkNIuUX072bqV+hIsm0Oizwzu3IgZZ5Zo5aY=
---

# 02 · Guest → 登录后：解锁能力差异清单（Authentication Differences）

> 本文件回答：Guest（未登录）→ 登录后（仍非 Owner），用户具体解锁了哪些能力？
> 所有条目基于 [G1]/[G2]/[B]/[B2] 实际证据，推断项单独标注 Confidence。

---

## A 类：仅因"登录"解锁（Authentication Difference）

| # | 能力域 | Guest | 登录后（Account B） | 证据 | Confidence |
|---|---|---|---|---|---|
| A1 | 开始模拟 / 新模拟（World） | 跳完整登录页 `login?next=/worlds/[slug]/new` | 可进入 Simulation，账户产生开局/回合记录 | [G1]§2, [B]玩家统计 | HIGH |
| A2 | Remix / 改编（World） | "改编"按钮跳登录 `login?next=/worlds/[slug]` | 可直接改编任意公开 World，生成归自己的公开副本 | [G2]§2.2, [B]2.1/E4 | HIGH |
| A3 | 角色聊天（Character） | 聊天按钮跳登录 | 可启动新 Simulation（onboarding 设定身份） | [G1]§3, [B]E16/E22 | HIGH |
| A4 | 角色添加到世界 | 跳登录 `next=/characters` | "添加"入口可用 | [G1]§3 | HIGH |
| A5 | 评论（World/Character/App） | 输入框"登录后评论"不可输入 | 可发布，持久化，计数 +1 | [G1]§3, [B]E13, [B2]-2 | HIGH |
| A6 | 关注（Creator/Character） | 关注按钮跳登录 | 可关注/取关，持久化，计数实时 | [G1]§6, [B]E7 | HIGH |
| A7 | 收藏 / 加入合集 | ♡ 点击静默失败 | 收藏真实生效并持久化（App 补测 57→58） | [G1]§3, [B]E9, [B2]-1b | HIGH |
| A8 | 创建世界（Community 表单 / 用此地图） | 表单可走完，最后一步"生成世界"跳登录 | 可创建（Remix 副本已验证；原创入口存在） | [G1]§7/§5 | HIGH |
| A9 | 安装 App | "登录后管理你的世界"跳登录 | 可安装（推断，账户级写入） | [G1]§4 | MEDIUM |
| A10 | 购买电量 / 订阅（Pricing） | 任意电量包跳登录 | 可进入购买流程（免费账号未实际付款） | [G1]§9 | HIGH |
| A11 | 赚取电量（/rewards） | 点"赚取电量"即跳登录 `next=/rewards` | 完全可访问：邀请码 QMM7VJ38、好友绑定 +150⚡、社媒发帖分档 +50~1000⚡、每周上限 10,000⚡ | [G1]§9, [B2]-3 | HIGH |
| A12 | 送礼 / 打赏 | 送礼按钮跳登录 | 可送礼（成功路径未直接补测，推断可用） | [G1]§2/§6 | MEDIUM |
| A13 | 账户私有空间（存档/我的世界/我的合集/我的资料） | "我的"路由 404 / 存档空态 | 自己的存档、收藏的世界、合集、创作列表、玩家统计可见 | [G1]§11, [B]4.3/E19 | HIGH |

**模式总结**：登录解锁的是**全部写路径**（开始模拟、改编、聊天、添加、评论、关注、收藏、创建、安装、送礼）+ **付费路径**（购买、领取电量）+ **账户私有数据空间**（存档/我的）。浏览、搜索、分享在任何身份下都开放，不构成差异。

---

## B 类：登录后依然存在的权限边界（Ownership / Permission Difference）

| # | 边界 | 表现 | 证据 | Confidence |
|---|---|---|---|---|
| B1 | 评分需游玩记录（行为门槛） | 非 owner 登录后点"我的评分"提示"玩过这个世界后才能评分" | [B]E14, [B2]-4 | HIGH |
| B2 | owner 专属操作对非 owner 隐藏 | Account B 搜索自己副本见"编辑"；Account A 对象无"编辑"入口，仅见"改编/立即开始" | [B]3.3/9.4 | HIGH |
| B3 | 账户数据隔离 | 存档、收藏、合集、创作列表为账户私有；他人世界可见其公开页但不可见其私有数据 | [G1]§2, [B]4.3 | HIGH |
| B4 | Private/Unlisted 创建 = 付费能力（会员墙） | 免费用户 App Studio 仅「存草稿/发布」两态，无 Private/Unlisted 选项 | [B]E17, [B]1.2/1.3 | HIGH |
| B5 | App 评分提交门槛待定 | 登录后可提交评分（"提交评分"按钮可选分后启用），是否需先游玩该 App 未验证 | [B2]-1a | MEDIUM |

**模式总结**：登录后非 Owner 的边界不是"内容拥有者"权限模型，而是**行为门槛**（玩过才能评）+ **owner 专属隐藏**（编辑）+ **数据隔离** + **付费能力墙**（可见性状态切换是会员功能）。

---

## 汇总：登录前后能力对照（速览表）

| 能力 | Guest | Account B |
|---|---|---|
| 浏览全部公开内容 | ✅ | ✅ |
| 搜索（全部类型） | ✅ | ✅ |
| 分享（链接/海报/X） | ✅ | ✅ |
| 查看版本/成就/预览面板 | ✅ | ✅ |
| 查看排行榜/创作者统计/地图大图 | ✅ | ✅ |
| 创建表单预览（走完不提交） | ✅ | — |
| 开始模拟 | 🔒 登录墙 | ✅ |
| 改编 Remix | 🔒 登录墙 | ✅ |
| 角色聊天 | 🔒 登录墙 | ✅ |
| 评论 | 🔒 登录墙 | ✅ |
| 关注 | 🔒 登录墙 | ✅ |
| 收藏 | ⚠️ 静默失败 | ✅ |
| 创建世界 | 🔒 最后一步 | ✅ |
| 购买/领取电量 | 🔒 登录墙 | ✅ |
| 评分 | 🔒 登录墙 | ⚠️ 需先游玩 |
| 编辑 | —（不可见） | ⚠️ 仅 owner |
| Private/Unlisted 创建 | — | ⚠️ 会员墙 |
*（内容由AI生成，仅供参考）*
