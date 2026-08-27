---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_1fab15ea9f7f11f1a54f525400f8a581
    ReservedCode1: 8K4BzSuCwlF7Nep4BkwRPs+VlQU8JflqR4YzuW6/g11LeWxNPqYas+ES8UFWukaKDeUvOtp1jQcabziqnbYMJG6g45CzSBwt48OFoB/aHDQCxSopnWlbpPDpk3HhA0USEhGZ3wxzND7tdafrOuxx38I2UHsuFLT/JCpbgBHEJVEBERwWXudMDcUuP8s=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_1fab15ea9f7f11f1a54f525400f8a581
    ReservedCode2: 8K4BzSuCwlF7Nep4BkwRPs+VlQU8JflqR4YzuW6/g11LeWxNPqYas+ES8UFWukaKDeUvOtp1jQcabziqnbYMJG6g45CzSBwt48OFoB/aHDQCxSopnWlbpPDpk3HhA0USEhGZ3wxzND7tdafrOuxx38I2UHsuFLT/JCpbgBHEJVEBERwWXudMDcUuP8s=
---

# Phase-3 · 05 — 匿名（Guest）剩余控件审计：Character 排行榜 / App 送礼 / Map 双预览

执行身份：Guest（退出登录后的匿名态）
执行时间：2026-08-24（Asia/Shanghai）
证据标准：VERIFIED / PARTIAL / UNKNOWN / BLOCKED
原始证据：`raw/BATCH2_VERSION_REMIX_ATTRIBUTION_CONTROLS.md`

## 结论摘要

| 控件 | Guest 视角结果 | 状态 |
|---|---|---|
| Character Detail 排行榜 Tab | 可见完整数据（开局数/总轮次排行，含用户昵称与数字），非空态 | VERIFIED |
| Character Detail 支持者 Tab | 空态：仅「聊天 / 添加到世界」按钮，无支持者数据 | VERIFIED（空态） |
| Character 详情 URL 形态 | 无独立 /characters/<slug> 详情 URL，详情为页面内区块/弹层展示 | VERIFIED |
| App Detail 送礼 | `main-input` 详情页含「送礼」按钮 +「打赏榜」空态；Guest 点击送礼 → 跳登录墙 `/zh-cn/login?next=…`（真实不可用，非静默失败） | VERIFIED |
| Map 双预览入口等价性 | 「查看大图」按钮 与 缩略图点击 弹出**同一张大图 modal**（内容/布局/交互一致，含缩放控件），完全等价 | VERIFIED |
| Map 独立详情页 | 地图库无独立详情页 URL（/maps/demon-slayer-japan 404），预览仅经 modal | VERIFIED |
| gytp World 详情「🗺️」图标 | 是 World 类型标识，非预览入口（World 详情另有「预览」按钮） | PARTIAL |

## 证据表

### E-1 Character 排行榜 / 支持者

| 身份 | URL | 对象 | 操作 | 结果 | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|
| Guest | /zh-cn/characters | 角色库目录（如德拉科·马尔福） | 打开目录并打开角色详情 | 详情含「评论 / 排行榜 / 支持者」三 Tab；无独立详情 URL | — | 高 | VERIFIED |
| Guest | 角色详情 | 排行榜 Tab | 点击 | 显示完整数据（开局数/总轮次排行，含昵称数字），非空态 | — | 高 | VERIFIED（有数据） |
| Guest | 角色详情 | 支持者 Tab | 点击 | 空态，仅「聊天 / 添加到世界」按钮 | — | 高 | VERIFIED（空态） |

### E-2 App 送礼

| 身份 | URL | 对象 | 操作 | 结果 | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|
| Guest | /zh-cn/apps/main-input | App「主输入框」详情 | 打开 | 页面可访问，含「送礼」按钮 +「打赏榜」（「还没有人送出礼物」空态） | — | 高 | VERIFIED |
| Guest | 同上 | 送礼入口 | 点击「送礼」 | 跳登录墙 `/zh-cn/login?next=/zh-cn/apps/main-input` | 回登录页 | 高 | VERIFIED |

### E-3 Map 双预览

| 身份 | URL | 对象 | 操作 | 结果 | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|
| Guest | /zh-cn/maps | 地图库卡片（鬼灭之刃模拟器） | 点「查看大图」按钮（入口1） | 弹出大图 modal：标题「鬼灭之刃模拟器」，内容/区域标注/配色与缩略图对应，右下角缩放控件 | 可重开 | 高 | VERIFIED |
| Guest | 同上 | 缩略图图片（入口2） | 直接点缩略图 | 弹出同一大图 modal，内容/布局/交互一致 → 与「查看大图」完全等价 | 可重开 | 高 | VERIFIED |
| Guest | /zh-cn/maps（尝试 /maps/demon-slayer-japan） | 地图详情独立 URL | 点卡片主体/直接访问 | 卡片主体不可跳转；独立 URL 404 → 地图库无独立详情页 | — | 中 | VERIFIED（无详情页） |
| Guest | /zh-cn/worlds/test-map-world-001-gytp | World 详情「🗺️」图标 | 点击 | 无弹层/无预览，为 World 类型标识（此世界含地图）；「预览」按钮存在（预览 World 整体） | — | 中 | PARTIAL |

## 可操作结论
- 匿名审计此前遗留的 3 类控件全部覆盖：排行榜公开可见数据、支持者空态、App 送礼走登录墙、Map 双预览入口等价、地图库无独立详情页。
- 「支持者」「打赏榜」均显示空态，疑似需要送礼/支持行为才产生数据（当前无对象被支持过）。
- 补充：Character 无独立详情 URL 与 Map 无独立详情 URL 一致，均为「目录卡片 + 弹层」模式。
*（内容由AI生成，仅供参考）*
