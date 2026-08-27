---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_d16279fd9ec111f1a413525400287e28
    ReservedCode1: oozVMGVJZQ15Pf5iRjLYNoKj0QyLnVfd4EXG5vhFirpAxf2q0fWikwfg5fN3F8O0mRuKueYzthfRoaT/o3si+s/sIx7WXb8kr5oFwjIv6LuD+pmEUYeEkK5kyl2KF48pXngVPqSJxTunF01eypvH3ny4h31sE0nGYoQDpOIl4bq0Yy+wo0MBJPcd/1A=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_d16279fd9ec111f1a413525400287e28
    ReservedCode2: oozVMGVJZQ15Pf5iRjLYNoKj0QyLnVfd4EXG5vhFirpAxf2q0fWikwfg5fN3F8O0mRuKueYzthfRoaT/o3si+s/sIx7WXb8kr5oFwjIv6LuD+pmEUYeEkK5kyl2KF48pXngVPqSJxTunF01eypvH3ny4h31sE0nGYoQDpOIl4bq0Yy+wo0MBJPcd/1A=
---

# 11 · 证据索引（Account B 调查）
账号: mehraxbobaid78@gmail.com（免费用户，792 电量）；独立 Chromium，zh-cn，2026-08-23。

| # | 证据 | URL / 位置 | 操作与结果 | Confidence |
|---|---|---|---|---|
| E1 | Account B 登录态 | https://worldos.cc/zh-cn | 顶栏显示 mehraxbobaid78@gmail.com | HIGH |
| E2 | Public World 陌生可见 | /zh-cn/worlds/test-map-world-001-gytp | 完整详情（Apps/角色/地图标记/版本/存档/分享/改编/合集/评分/评论） | HIGH |
| E3 | slug 不可搜 | /worlds/search?q=test-map-world-001-gytp | 暂无匹配结果 | HIGH |
| E4 | 标题可搜 | /worlds/search?q=测试应用升级世界 001 | 4 结果: gytp/x161880, ukb1/mehraxbobaid78, ouue/nixonelton9954, k4do/x161880 | HIGH |
| E5 | Remix attribution 单层 | gytp→ft9r→ouue/k4do | ft9r "改编自 x161880 的公开 World"；ouue 仅指直接父级 nixonelton9954 | HIGH |
| E6 | Creator Profile 可见 | /zh-cn/profile/{x161880 uuid} | 创建世界/角色/关注者/Follow 可见 | HIGH |
| E7 | Follow 持久化 | 同上 | 关注→刷新"1 关注者"；取关→刷新"0 关注者" | HIGH |
| E8 | 分享弹窗 | gytp 详情 | 复制链接/海报；合集弹窗"你还没有创建合集" | HIGH |
| E9 | 创建合集 | /zh-cn/collections/new | 「第二账号测试合集 001」→ /zh-cn/collections/di-er-zhang-hao-ce-shi-he-ji-001-9n2j | HIGH |
| E10 | 已删 App 404 | /zh-cn/apps/test-app-delete-lifecycle-001 | 404 | HIGH |
| E11 | 已删 App 搜索消失 | /worlds/search?q=test-app-delete-lifecycle-001 | 暂无匹配结果 | HIGH |
| E12 | 版本记录可见 | gytp 详情 | v6–v8 区间 + 最新版标记 + 更新日志 | HIGH |
| E13 | 跨账号评论 | gytp 详情评论框 | 发布"Account B 跨账号评论测试 001"→ 评论·1；刷新持久化 | HIGH |
| E14 | 评分门槛 | gytp 详情 | "玩过这个世界后才能评分" | HIGH |
| E15 | 已删 source Chat 404 | /zh-cn/sim/33c8dcf4 | 404（与 HANDOFF 一致） | HIGH |
| E16 | 已删角色 World-local 可搜可聊 | /worlds/search?q=测试角色 | 角色 tab 命中「测试角色 001」；点聊天→新 Simulation onboarding | HIGH |
| E17 | App Studio 两态 | /zh-cn/apps/create | 仅「存草稿/发布」，无 Unlisted/Private | HIGH |
| E18 | 路由事实 | /worlds/new /apps/search /characters/search /notifications /upgrade /u/{slug} | 均 404（统一 404 文案） | HIGH |
| E19 | 自己 Profile | /zh-cn/profile/5c1fb660-9e53-45a0-8caf-791f73cd8afc | 创作者/玩家统计、收藏 1、我的世界（改编副本）、合集 1 | HIGH |
| E20 | 定价页免费可见 | /zh-cn/pricing | 订阅/加量包/自备 API/赞助结构 | HIGH |
| E21 | 促销弹窗 | 首页 | "分享 WorldOS 赢取电量"遮罩创建按钮 | MEDIUM |
| E22 | 首页搜索角色启动新模拟 | /zh-cn/sim/831c4eab-... | 从搜索结果聊天→onboarding 设定身份 | HIGH |
| E23 | 本轮独立账号会话状态 | IAB + Chrome WorldOS 首页 | IAB 与 Chrome 均自动恢复 Account A `x161880 / x161880@gmail.com`；未发现可用 Account B 会话，因此 Private/Unlisted 等非 owner 实验本轮 BLOCKED，未混用 owner 结果 | HIGH |
*（内容由AI生成，仅供参考）*

## Provenance erratum (2026-08-24)

E23 is scoped to the Codex main Agent's local browser context. It must not be read as evidence that the independent Account B did not exist or could not operate. Account B belonged to the user's external Tencent Marvis Agent; its latest App/Guest findings are merged separately as EVD-0179. The original E23 row remains unchanged as historical evidence, with corrected interpretation `CODEX_LOCAL_SESSION_ISOLATION`.
