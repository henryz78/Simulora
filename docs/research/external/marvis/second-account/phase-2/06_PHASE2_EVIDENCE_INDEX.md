---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_e1685db99ed511f1a413525400287e28
    ReservedCode1: ktYmv3lmNCBBL4VjjnjufyX2TBnGSitRo5SwBL2lr4jByq35zOC8h7PX8N9IDrjx9WCGQssN3DFS7NOsXVGjkU/ssA8CYAv0iepDZ+BDawtbl5Wqn4X87mNSPhbMI/jEMM7cjefuQLLYc7om1xPM//7lNA5DTtBQeivbsHrAUBPhJq2V3LwG5MTJYaY=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_e1685db99ed511f1a413525400287e28
    ReservedCode2: ktYmv3lmNCBBL4VjjnjufyX2TBnGSitRo5SwBL2lr4jByq35zOC8h7PX8N9IDrjx9WCGQssN3DFS7NOsXVGjkU/ssA8CYAv0iepDZ+BDawtbl5Wqn4X87mNSPhbMI/jEMM7cjefuQLLYc7om1xPM//7lNA5DTtBQeivbsHrAUBPhJq2V3LwG5MTJYaY=
---

# 06 · Phase-2 证据索引（Guest vs Account B 交叉对照）

> 阶段: Phase-2 ｜ 日期: 2026-08-23 ｜ 平台: https://worldos.cc（zh-cn）
> 身份: Guest = 未登录匿名；Account B = mehraxbobaid78@gmail.com（免费用户）
> 来源: [G1]=ANONYMOUS_GUEST_AUDIT.md ｜ [G2]=ANONYMOUS_PUBLIC_UI_COMPLETENESS.md ｜ [B]=Phase-1 报告（00-11） ｜ [B2]=Phase-2 最小补测

---

## 核心证据表

| # | 证据 | 来源 | 内容摘要 | Confidence |
|---|---|---|---|---|
| P2-1 | Guest 全部公开页可访问 | [G1]§1-11 | 世界/角色/App/地图/创作者/社区/搜索/定价未登录全开放 | HIGH |
| P2-2 | Guest 搜索完全开放 | [G1]§8 | 搜索无任何登录要求，tabs 全可用 | HIGH |
| P2-3 | Guest 分享完全可用 | [G1]§2, [G2]§2.9 | 分享 Modal（复制链接/海报/X）无登录要求 | HIGH |
| P2-4 | Guest 收藏静默失败 | [G1]§3, [G2]§2.1/2.3 | 世界/角色卡片 ♡ 点击无反馈 | HIGH |
| P2-5 | Guest 统一登录墙 + next 回跳 | [G1]§2/§9/§11 | 开始模拟/关注/送礼/购买/改编等跳 `login?next=...` | HIGH |
| P2-6 | Guest 创建漏斗式登录墙 | [G1]§7 | 创建表单可走完，最后一步"生成世界"才要求登录 | HIGH |
| P2-7 | Guest App 试玩预览锁定 | [G1]§4 | "预览·操作不会生效" | HIGH |
| P2-8 | B 公开内容可读可搜可分享 | [B]E2/E3/E4/E8 | Public World 陌生账号完整可见 | HIGH |
| P2-9 | B Remix 开放 | [B]E4/E5 | 跨账号改编生成公开副本 ukb1 | HIGH |
| P2-10 | B 收藏/合集持久化 | [B]E9/6.1 | "加入世界合集"→ 收藏持久化 | HIGH |
| P2-11 | B 评论持久化 | [B]E13 | 跨账号评论 0→1，刷新保持 | HIGH |
| P2-12 | B 评分门槛需游玩 | [B]E14, [B2]-4 | "玩过这个世界后才能评分" | HIGH |
| P2-13 | B Follow 持久化 | [B]E7 | 关注/取关计数实时，刷新保持 | HIGH |
| P2-14 | B 编辑仅 owner 可见 | [B]9.4/3.3 | 自己副本见"编辑"，他人对象无 | HIGH |
| P2-15 | 删除传播（URL+Search） | [B]E10/E11 | 已删 App 404 + 搜索 0 命中 | HIGH |
| P2-16 | 已删角色 World-local 快照存活 | [B]E16 | source 404，快照可搜可聊 | HIGH |
| P2-17 | 版本/成就/预览对陌生开放 | [G2]§2.2, [B]E12 | 匿名与 B 均可看版本记录、成就、预览面板 | HIGH |

## Phase-2 最小补测证据（[B2]，本阶段新增）

| # | 对象 / URL | 结果 | 对矩阵的贡献 |
|---|---|---|---|
| B2-1a | App Detail `/zh-cn/apps/main-input` 评分区 | 登录态可看聚合评分 4.8/13 人 + "我的评分/提交评分"（未选分时 disabled） | App 评分登录后可提交（门槛待定） |
| B2-1b | App Detail 收藏按钮 | 点击 57→58，真实生效 | 登录后收藏解锁（对照 Guest 静默） |
| B2-1c | App Detail 在线试玩 | 发送为无 onclick span，仍标"预览·操作不会生效" | 试玩登录不解锁（C-3 不一致） |
| B2-2 | Character Modal（Lisa）评论 | "留下你的评论…"可输入发布，计数空态→"评论·1"，作者 mehraxbobaid78 | Character 评论登录后可发 |
| B2-3 | `/zh-cn/rewards` | 登录态可访问：邀请码 QMM7VJ38、好友绑定+150⚡、社媒分档+50~1000⚡、周上限 10,000⚡ | rewards 登录解锁（对照 Guest 登录墙） |
| B2-4 | `/zh-cn/worlds/test-map-world-001-gytp` 评分区 | "还没有评分,来做第一个吧 / 我的评分 / 玩过这个世界后才能评分" | 复核评分门槛 |

> 注：B2-2 在 Lisa 角色下留下一条测试评论（mehraxbobaid78 · "补测评论-测试内容123"），属权限验证必要写入。

---

## 交叉验证状态（两个独立 Agent）

| 结论 | Guest 侧（匿名） | Account B 侧 | 交叉状态 |
|---|---|---|---|
| 公开内容浏览全开放 | ✅ VERIFIED | ✅ VERIFIED | **双向交叉验证** |
| 搜索完全开放 | ✅ VERIFIED | ✅ VERIFIED | **双向交叉验证** |
| 分享功能开放 | ✅ VERIFIED | ✅ VERIFIED | **双向交叉验证** |
| 需写操作统一登录墙 | ✅ VERIFIED | ✅（登录后解锁） | **双向交叉验证** |
| 收藏 Guest 静默失败 | ✅ VERIFIED | ✅（登录后生效） | **双向交叉验证** |
| 评论/评分 Guest 需登录 | ✅ VERIFIED | ✅（评论开放/评分需游玩） | **双向交叉验证** |
| 创建漏斗式登录墙 | ✅ VERIFIED | ✅（创建可用） | **双向交叉验证** |
| 评分需游玩 | —（未登录无法测） | ✅ VERIFIED | 单侧（B 侧） |
| slug 不可搜 / title 可搜 | —（未测） | ✅ VERIFIED | 单侧（B 侧） |
| 删除传播 | —（未测） | ✅ VERIFIED | 单侧（B 侧） |
| Remix 立即公开 | —（未测） | ✅ VERIFIED | 单侧（B 侧） |
| Follow 持久化 | —（未测） | ✅ VERIFIED | 单侧（B 侧） |
*（内容由AI生成，仅供参考）*
