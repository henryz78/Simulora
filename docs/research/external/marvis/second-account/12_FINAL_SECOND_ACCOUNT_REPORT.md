---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_d20d8f979ec111f1a413525400287e28
    ReservedCode1: XpJSjMz9IEjL2eGXKRBolHkoEMRw5jdm0mjHonM2Dn67PCJVAhzCUkEngPvQzxcgolQodwQIFA/CRyVrXHvXjTFNYYp5S21gmR8vn5isX6WconmlHujwmP8tmz/wJJmK+zijEITAmjzZjp+0PFfnuikq87DoA/OQuCicTmEDPsYFBXAOS9nGg9lhrc8=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_d20d8f979ec111f1a413525400287e28
    ReservedCode2: XpJSjMz9IEjL2eGXKRBolHkoEMRw5jdm0mjHonM2Dn67PCJVAhzCUkEngPvQzxcgolQodwQIFA/CRyVrXHvXjTFNYYp5S21gmR8vn5isX6WconmlHujwmP8tmz/wJJmK+zijEITAmjzZjp+0PFfnuikq87DoA/OQuCicTmEDPsYFBXAOS9nGg9lhrc8=
---

# 12 · FINAL SECOND ACCOUNT REPORT（Account B）
调查账号: mehraxbobaid78@gmail.com（Account B，免费用户）
日期: 2026-08-23 ｜ 方式: 独立 Chromium 真实 UI 操作 + DOM 验证 ｜ 平台: worldos.cc (zh-cn)
范围: 第一阶段第二账号独立视角调查。未重跑主 Agent 已 VERIFIED 内部逻辑，未绕过访问控制、未充值付款。

## 一、Account B 视角发现的新行为（主 Agent 单账号难以发现）
1. 删除角色 source 后，World-local 快照仍可通过 Search 命中并启动新聊天：搜索「测试角色」→ 命中挂靠在"测试应用升级世界 001"下的「测试角色 001」→ 点"聊天"直接进入新 Simulation onboarding。独立 source 已 404，但 World-local 副本对外部账号可见、可玩。
2. 删除在陌生账号侧的双面即时传播：已删除 App 的直接 URL 404 + Search 0 命中（从两个独立入口同步消失）。
3. 搜索按标题索引、slug 完全不可搜：Account B 用 slug 搜 L0 无结果，用完整标题搜命中 4 个（含跨账号 Remix 副本）→ 精确标题是索引键。
4. 跨账号 Remix 副本立即公开并进入 Search：Account B 的 ukb1 副本可被标题搜索命中、出现在我 Profile。
5. attribution 单层直接父链对外一致：陌生账号看到与 owner 一致的「改编自 {直接父级} 的公开 World」，祖先需逐层来源链接。
6. 评分是账户级游玩门槛：陌生账号未游玩该 World 时评分被拦截（"玩过这个世界后才能评分"），评论却完全开放。
7. Follow 跨账号持久化 + 计数实时：关注/取关后刷新均保持，计数 0↔1 双向验证。
8. Profile 不泄露邮箱：陌生 Creator Profile 只显示用户名/统计/内容，无邮箱。
9. 创作入口差异：/worlds/new 404（无独立创建路由），创建入口藏在首页/我的"创建新世界"按钮（被促销弹窗遮挡）；App Studio 免费账号仅「存草稿/发布」两态。
10. 同一对象 creator 显示名不统一：x161880 与 nixonelton9954 在不同对象/路径出现（疑 username vs 账号标识混合）。

## 二、支持主 Agent 现有调查的结论
- Public 对象陌生账号完整可读/可搜/可 Remix/可收藏/可评论（无身份门槛）→ 支持权限矩阵 PARTIAL→VERIFIED 推进。
- Remix 直接父链 attribution、多层 Remix 存在 → 与 HANDOFF 一致，跨账号侧复验通过。
- 已删 source Chat 404、World-local/Remix 后代存活 → 与 HANDOFF 的 snapshot/复制语义一致（Account B 独立复验）。
- 已删 App 404 + 搜索消失 → 支持删除传播即时性。
- Private/Unlisted 会员墙 → 免费账号创建入口无该选项，支持 HANDOFF 会员墙结论。
- 搜索索引异步收敛（k4do 首次未收录）→ 本次未见新矛盾。

## 三、与 MARVIS_HANDOFF 的冲突/差异
- 无实质冲突。差异点: HANDOFF 将 ft9r 标注为 "Account-B L1"，但实际 ft9r owner 显示为 nixonelton9954（主账号）；而 Account B 自己的副本是 ukb1（mehraxbobaid78）。可能 HANDOFF 的链标注与账号归属有出入，建议主 Agent 复核 ft9r/ouue/k4do 的实际 owner 归属。
- HANDOFF 的「测试角色 001」搜索可见性未提及——主 Agent 只记录 source Chat 404 与 World-local 保留，未验证"挂靠 World 可被 Search 命中并启动新聊天"，本次补充。

## 四、尚未验证的跨账号行为（详见 10）
- Private/Unlisted 全维度（无样本、会员墙）
- Public→Private 变化的传播（无样本）
- 匿名/登出用户的 Share Link 与 Public 详情
- Version 老链接/Remix 基线
- 删除后 Remix offspring 断链 enforcement
- Account A 侧 Notification（Follow/评论/合集/Remix）—— 已产生可验证触发点，需主 Agent 登录 A 侧确认

## 五、应反馈给主 Agent 加入 Master Research 的结果
1. Search 标题索引键 + slug 不可搜（跨账号复验）。
2. 删除的双面即时传播（URL 404 + Search 0 命中）。
3. 删除角色 source 的 World-local 快照可被搜索并启动新聊天。
4. 评分账户级游玩门槛 + 评论开放 的不对称权限。
5. Follow 持久化 + 计数实时（跨账号）。
6. Profile 邮箱不泄露。
7. 创作入口路由事实（/worlds/new 404，App Studio 两态）。
8. ft9r 归属差异（HANDOFF 链标注复核）。
9. creator 显示名不统一（x161880 vs nixonelton9954）。

## 六、若继续第二任务，最值得调查
1. 让 Account A 提供 Private / Unlisted / 将 Public 改 Private 的对象 → 完整复验权限矩阵。
2. Account A 侧 Notification 深链验证（本次已布好触发点: 评论、Follow、合集、Remix ukb1）。
3. 匿名（登出）视角全流程（Share Link、详情、Search）。
4. Version 外部选择/老链接/Remix 基线。
5. 关闭改编权限 + 来源删除后的 Remix 后代独立访问。
6. 定位 Notification 真实入口并记录跨账号通知内容。

## 输出文件
本报告配套: 00–11（见 00 索引）。全部落盘于 output\\worldos-second-account-audit\\。

## STOP
第一阶段第二账号调查完成，停止。等待下一任务。
*（内容由AI生成，仅供参考）*
