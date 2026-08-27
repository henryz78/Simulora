---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_1c599b379f7f11f1a413525400287e28
    ReservedCode1: RIP6inwef6n62Ey/Li+qnxkb27Z2YpnwK+I3ilacPkmvPIdygllBPJOw0kvuyzkG9q2COl1PG9Z86GYn0zz+4BoFyt8XKjBxOcxez6MztvhnusaYRuwSW3CULZOCc0DW+6AGZ+I/M7iUZWIkvS7kaU4dYWmy5EcnxZsJcpYd0xWIwsocZk4baVxlXYQ=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_1c599b379f7f11f1a413525400287e28
    ReservedCode2: RIP6inwef6n62Ey/Li+qnxkb27Z2YpnwK+I3ilacPkmvPIdygllBPJOw0kvuyzkG9q2COl1PG9Z86GYn0zz+4BoFyt8XKjBxOcxez6MztvhnusaYRuwSW3CULZOCc0DW+6AGZ+I/M7iUZWIkvS7kaU4dYWmy5EcnxZsJcpYd0xWIwsocZk4baVxlXYQ=
---

﻿# BATCH2 — 老 Version / Remix 基线 / 中间父级删除 attribution / 匿名控件审计（Phase-3）

执行账号：任务 D = Account B（登录态）；任务 E = Guest（退出登录后）
浏览器：agent_browser 路径 B（standalone Chromium）
执行时间：2026-08-24（Asia/Shanghai）
范围：仅 worldos.cc（zh-cn）域内；不触碰第三方平台/Google 授权
证据标准：VERIFIED / PARTIAL / UNKNOWN / BLOCKED

## 任务 D · 老 Version / Remix 基线 / 中间父级删除后的 attribution

### D-1 老 Version（non-owner 视角）

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Account B（登录，non-owner） | /zh-cn/worlds/test-map-world-001-gytp | World「测试应用升级世界 001」版本记录 | 公开详情页 | 检查版本历史区块与版本切换入口 | 页面含版本记录区块：v11（Map Marker Lifecycle Audit，最新 2026/8/24）、v10（Map Faction Roleization and Duplicate Binding Audit）、v9（Install TEST App First Publish 001）等，均为只读文本展示；versionLinks=[]，无任何可点击旧版本导航 URL | 稳定只读 | 高 | VERIFIED（不可切换） |
| Account B（登录，non-owner） | 同上 | 旧版本 URL 可访问性 | — | 尝试构造/发现旧版本 URL | 详情页无版本 URL 或分享旧版本入口，无法获得旧版本直链样本；Version 老链接可访问性无法验证 | — | — | UNKNOWN（无样本） |

### D-2 Remix 基线链（B 自有，用于删除实验）

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Account B（登录） | /zh-cn/worlds/test-map-world-001-gytp | NEW-L1 创建 | 公开 gytp | 点击「改编」→ 编辑向导 → 详情 | 生成 NEW-L1 = **test-map-world-001-w32j**；标题「测试应用升级世界 001」；版本 v1；attribution「改编自 测试应用升级世界 001 · x161880」（直接父级 = gytp） | 详情可访问，owner 编辑按钮存在 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/test-map-world-001-w32j | NEW-L2 创建 | NEW-L1 详情 | 点击「改编」→ 编辑向导 → 详情 | 生成 NEW-L2 = **test-map-world-001-rev0**；标题「测试应用升级世界 001」；版本 v1；attribution「改编自 测试应用升级世界 001 · mehraxbobaid78」（直接父级 = NEW-L1） | 详情可访问 | 高 | VERIFIED |

### D-3 中间父级删除（删除 NEW-L1）

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Account B（登录，owner of NEW-L1） | /zh-cn/worlds/test-map-world-001-w32j/edit | 删除 NEW-L1 | NEW-L1 详情/编辑 | 关闭引导弹窗 → 点「删除这个世界」→ 接受确认弹窗 | 删除成功，跳转 /zh-cn/worlds 列表 | — | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/test-map-world-001-w32j | NEW-L1 直链 | 已删除 | 重新打开 | 404「404 / This page could not be found.」 | 持续 404 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/test-map-world-001-rev0 | NEW-L2 直链 | 父级 NEW-L1 已删 | 重新打开 | 详情仍可访问；标题「测试应用升级世界 001」；**attribution 消失（NO_ATTR，无「改编自 …」文本）**；版本 v1；改编/立即开始/分享按钮仍在 | 稳定可访问 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/search?q=测试应用升级世界+001 | NEW-L2 搜索可见性 | 父级已删 | 搜索标题 | 命中多张卡片，含 mehraxbobaid78 的 rev0 卡片（带「编辑」按钮）；hasEmpty=false | 仍命中 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/test-map-world-001-rev0 | NEW-L2 再次 Remix | 父级已删 | 点击「改编」 | 可再次改编，跳转 /zh-cn/worlds/test-map-world-001-xxt9/edit（NEW-L3 向导，未发布）→ 父级删除后 Remix 功能仍可用 | — | 高 | VERIFIED |

### 任务 D 小结
- 版本历史对 non-owner 只读，无版本切换入口；旧版本 URL 无样本 → UNKNOWN。
- 新建 Remix 链 NEW-L1（w32j，父=gytp）→ NEW-L2（rev0，父=w32j），attribution 均只指向直接父级（复验 HANDOFF 结论）。
- 删除中间父级 NEW-L1 后：NEW-L1 直链 404；**NEW-L2 仍可访问、可改编、可搜索，但 attribution 文本直接消失**（不显示「已删除/未知」占位）。这是新观察：attribution 是运行时解析父级、父级消失则整段引用隐藏。

## 任务 E · 匿名（Guest）剩余控件审计

### E-1 Character Detail 排行榜/支持者 Tab

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Guest | /zh-cn/characters | 角色库目录 | 未登录 | 打开目录并打开角色详情（如德拉科·马尔福） | 角色详情含「评论 / 排行榜 / 支持者」三个 Tab；角色详情为页面内区块/弹层展示，无独立 /characters/<slug> 详情 URL | — | 高 | VERIFIED |
| Guest | 角色详情 | 排行榜 Tab | 未登录 | 点击「排行榜」 | 显示完整数据（开局数/总轮次排行，含用户昵称与数字），非空态 | — | 高 | VERIFIED（有数据） |
| Guest | 角色详情 | 支持者 Tab | 未登录 | 点击「支持者」 | 空态：仅「聊天 / 添加到世界」等按钮，无支持者数据与文案 | — | 高 | VERIFIED（空态） |

### E-2 App Detail 独立送礼

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Guest | /zh-cn/apps/main-input | App「主输入框」详情 | 未登录 | 打开详情页 | 页面可访问，含「送礼」按钮与「打赏榜」区块（「还没有人送出礼物」空态） | — | 高 | VERIFIED |
| Guest | 同上 | 送礼入口 | 未登录 | 点击「送礼」 | 跳转登录墙：/zh-cn/login?next=/zh-cn/apps/main-input（未登录不可送礼） | 回登录页 | 高 | VERIFIED |

### E-3 Map 双预览入口等价性

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Guest | /zh-cn/maps | 地图库（鬼灭之刃模拟器卡片） | 未登录 | 点击卡片「查看大图」按钮（入口1） | 弹出大图预览 modal：标题「鬼灭之刃模拟器」，地图内容/区域标注/配色与缩略图对应，右下角含缩放控件 | 关闭后可重开 | 高 | VERIFIED |
| Guest | /zh-cn/maps | 同上卡片缩略图 | 未登录 | 直接点击地图缩略图图片（入口2） | 弹出同一张大图预览 modal（内容/布局/交互一致，含缩放控件）→ 与「查看大图」按钮**完全等价** | 关闭后可重开 | 高 | VERIFIED |
| Guest | /zh-cn/maps | 地图详情独立 URL | 未登录 | 点击卡片主体/文字、尝试 /maps/demon-slayer-japan | 卡片主体不可跳转（无 /maps/<slug> 链接）；/maps/demon-slayer-japan 返回 404 → 地图库无独立详情页（预览仅通过 modal） | — | 中 | VERIFIED（无详情页） |
| Guest | /zh-cn/worlds/test-map-world-001-gytp | World 详情「🗺️」图标 | 未登录 | 点击「🗺️」图标按钮 | 无弹层/无预览，仅为 World 类型标识（此世界含有地图），非预览入口；「预览」按钮存在（预览 World 整体，未深入展开） | — | 中 | PARTIAL |

### 任务 E 小结
- Character：排行榜 Guest 可见完整数据；支持者 Guest 见空态。
- App：送礼入口 Guest 点击跳登录墙（真实不可用，非静默失败）。
- Map：两个预览入口（「查看大图」按钮 vs 缩略图点击）完全等价（同一大图 modal）；地图库无独立详情页 URL。
- 补充观察：gytp World 详情「🗺️」图标是类型标识而非预览入口。

## 供主 Agent 复核
1. 老 Version 旧链接可访问性 / 分享旧版本入口是否存在于 owner 侧（本轮 non-owner 无样本）。
2. 中间父级删除后 attribution 消失（不显示占位）——建议主 Agent 在 owner 侧复验 attribution 渲染逻辑。
3. 地图库确认无独立详情页是否为预期设计（当前仅 modal 预览）。

## 本轮新建资产
- NEW-L1（已删除）: test-map-world-001-w32j
- NEW-L2（存活，父级已删）: test-map-world-001-rev0
- NEW-L3（未发布向导草稿）: test-map-world-001-xxt9
*（内容由AI生成，仅供参考）*
