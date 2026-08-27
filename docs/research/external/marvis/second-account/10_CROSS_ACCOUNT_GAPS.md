---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_d0b2b6f59ec111f1a54f525400f8a581
    ReservedCode1: wqeEkJZVuroWqEVBA1fo8RTx5TSzP0Ndcao0CZwgZjPOWYOxdcafvusEekuVRIi0gLGDacU7UpaC8YW/f73zc/zUvV5uSr2Hf+dAHGvBkUY40lm7EN1Gw69hi5a20OsEEfplMYDtOQBvtI2A3My9w8feTZwxo9CJUyKhg84NZG4pUGEfbI87MW+DwNg=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_d0b2b6f59ec111f1a54f525400f8a581
    ReservedCode2: wqeEkJZVuroWqEVBA1fo8RTx5TSzP0Ndcao0CZwgZjPOWYOxdcafvusEekuVRIi0gLGDacU7UpaC8YW/f73zc/zUvV5uSr2Hf+dAHGvBkUY40lm7EN1Gw69hi5a20OsEEfplMYDtOQBvtI2A3My9w8feTZwxo9CJUyKhg84NZG4pUGEfbI87MW+DwNg=
---

# 10 · 跨账号未验证项（CROSS_ACCOUNT_VERIFICATION_REQUIRED / UNKNOWN）
## 10.1 需主 Agent（Account A）复核
1. Account B 对 Account A 内容执行「Follow」后，Account A 是否收到 Notification / 关注者计数是否在 A 侧 +1。
2. Account B 的跨账号评论（"Account B 跨账号评论测试 001"，gytp 世界）是否给 Account A 产生通知（含深链）。
3. Account B 创建合集/收藏是否触发 A 侧任何通知。
4. Remix（ukb1/mehraxbobaid78）是否给父 World（gytp）所有者产生通知深链。
5. 同一对象不同渲染路径 creator 显示差异（x161880 vs nixonelton9954）的原因。

## 10.2 UNKNOWN（本账号无法独立验证）
- Private 对象的直接 URL / Search / Creator Profile / Remix 行为（无样本，会员墙）。
- Unlisted 对象的直链 / Search / Remix 行为（无样本）。
- Public→Private 变化后的: 已打开页面表现、刷新、Search、Saved/Favorite、Direct URL。
- Published→Deleted 后的: Favorite、Share URL、Remix offspring、版本历史保留精确判定。
- 匿名（登出）用户打开 Share Link / Public 详情的行为。
- Version: 老 Share URL 指向、Remix 基线版本、旧版本选择。
- 来源删除后 Remix 后代 attribution 断链后的 independent-viewer enforcement。
- 关闭改编权限后的跨账号 Remix 行为。
- 评分后的评分展示/计数跨账号表现（本次未实际游玩计分）。
- Notification 中心真实 URL 与空态（/zh-cn/notifications 404，真实入口未定位）。

## 10.3 建议主 Agent 优先补充
- 把 gytp 或任一对象切 Private → 让 Account B 复验 10.2 各项。
- 提供一个 Private + 一个 Unlisted 对象 URL 给本账号。
- 复核 x161880/nixonelton9954 显示差异。

## 10.4 本轮复查阻断

- 2026-08-24 检查 IAB 与 Chrome 的现有 WorldOS 会话，两个会话均为 Account A `x161880 / x161880@gmail.com`；没有独立 Account B 标签页或可安全切换的登录态。
- 因此本轮未执行 Private/Unlisted、Public→Private、关闭改编权限、老版本/删除传播及 Collection 非 owner enforcement；这些项目继续保持 `UNKNOWN/BLOCKED`，不以 owner 侧页面替代陌生账号证据。
*（内容由AI生成，仅供参考）*

## Provenance erratum (2026-08-24)

The final bullets in §10.4 describe only the **main Codex Agent's local IAB/Chrome preflight**. They do not establish that Account B was unavailable to the project or to the user's external Tencent Marvis Agent. The independent B/Guest App recheck was performed externally and is recorded in `docs/research/external/marvis/phase-4/05_APP_B_GUEST_RECHECK_USER_TRANSCRIPT.md` and EVD-0179. Keep the original local-session observation for audit traceability, but interpret its status as `CODEX_LOCAL_SESSION_ISOLATION`, not a project-wide `BLOCKED` state.
