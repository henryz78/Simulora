---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_1f0a048f9f7f11f1a413525400287e28
    ReservedCode1: 54GcVwT0x1niYPN6xKAwcTZIPm7r+awAvNT+N4Sf6PFcYEXR95eFIvdprMV4XGXRWrZjO/dpBT1WKDqmkiI6g09OEMl2kchHbhpILWTIUjMTTBqZyVqKTM3IGFOluR0jIGQMHWfA2BWpQLPhM0YmFAu+3UBgDwa3TV8GWE/gSzhskv6DOZXCc0h7oEE=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_1f0a048f9f7f11f1a413525400287e28
    ReservedCode2: 54GcVwT0x1niYPN6xKAwcTZIPm7r+awAvNT+N4Sf6PFcYEXR95eFIvdprMV4XGXRWrZjO/dpBT1WKDqmkiI6g09OEMl2kchHbhpILWTIUjMTTBqZyVqKTM3IGFOluR0jIGQMHWfA2BWpQLPhM0YmFAu+3UBgDwa3TV8GWE/gSzhskv6DOZXCc0h7oEE=
---

# Phase-3 · 04 — 老 Version / Remix 基线 / 中间父级删除后的 attribution

执行账号：任务 D = Account B（登录态，non-owner + owner-of-新链）
执行时间：2026-08-24（Asia/Shanghai）
证据标准：VERIFIED / PARTIAL / UNKNOWN / BLOCKED
原始证据：`raw/BATCH2_VERSION_REMIX_ATTRIBUTION_CONTROLS.md`

## 结论摘要

| 调查点 | 结果 | 状态 |
|---|---|---|
| 老 Version（non-owner 视角） | gytp 详情页版本记录区块只读展示（v11 最新 2026/8/24，v10/v9 等），`versionLinks=[]`，无版本切换链接；旧版本 URL 无样本 | VERIFIED（只读不可切换）/ UNKNOWN（旧链接） |
| Remix 基线 | 新链 NEW-L1=`test-map-world-001-w32j`（父=gytp，v1，attribution 指向 gytp）→ NEW-L2=`test-map-world-001-rev0`（父=w32j，v1，attribution 指向 w32j）；attribution 均只指向**直接父级**（复验 HANDOFF） | VERIFIED |
| 中间父级删除后的 attribution | 删除 NEW-L1 后其直链 404；**NEW-L2 仍可访问、可改编、可搜索，但 attribution 整段文本直接消失（无「已删除/未知」占位）** —— 新观察 | VERIFIED |
| 中间父级删除后的 Remix/搜索 | NEW-L2 搜索仍命中（含「编辑」按钮）、可再次改编（生成 NEW-L3 向导 xxt9） | VERIFIED |

## 证据表

### D-1 老 Version

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果 | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Account B（non-owner） | /zh-cn/worlds/test-map-world-001-gytp | 版本记录 | 公开详情 | 检查版本区块/切换入口 | 只读文本展示：v11（Map Marker Lifecycle Audit，2026/8/24）、v10（Map Faction Roleization and Duplicate Binding Audit）、v9（Install TEST App First Publish 001）等；versionLinks=[] 无可点击旧版本导航 | 稳定只读 | 高 | VERIFIED（不可切换） |
| Account B | 同上 | 旧版本 URL | — | 尝试发现旧版本链接 | 无版本 URL/分享旧版本入口，无法获得旧版本直链样本 | — | — | UNKNOWN（无样本） |

### D-2 Remix 基线链

| 身份 | URL | 对象 | 操作 | 结果 | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|
| Account B | /zh-cn/worlds/test-map-world-001-gytp | NEW-L1 创建 | 改编→向导→详情 | NEW-L1=`test-map-world-001-w32j`；标题「测试应用升级世界 001」；v1；attribution「改编自 测试应用升级世界 001 · x161880」（父=gytp） | 可访问，owner 编辑按钮存在 | 高 | VERIFIED |
| Account B | /zh-cn/worlds/test-map-world-001-w32j | NEW-L2 创建 | 改编→向导→详情 | NEW-L2=`test-map-world-001-rev0`；标题「测试应用升级世界 001」；v1；attribution「…· mehraxbobaid78」（父=w32j） | 可访问 | 高 | VERIFIED |

### D-3 中间父级删除

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果 | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Account B（owner of NEW-L1） | /zh-cn/worlds/test-map-world-001-w32j/edit | 删除 NEW-L1 | 详情/编辑 | 关闭引导→「删除这个世界」→确认 | 删除成功，跳转 /zh-cn/worlds 列表 | — | 高 | VERIFIED |
| Account B | /zh-cn/worlds/test-map-world-001-w32j | NEW-L1 直链 | 已删 | 重开 | 404「404 / This page could not be found.」 | 持续 404 | 高 | VERIFIED |
| Account B | /zh-cn/worlds/test-map-world-001-rev0 | NEW-L2 直链 | 父级已删 | 重开 | 详情可访问；**attribution 消失（NO_ATTR，无「改编自…」文本）**；v1；改编/立即开始/分享仍在 | 稳定 | 高 | VERIFIED |
| Account B | /zh-cn/worlds/search?q=测试应用升级世界+001 | NEW-L2 搜索 | 父级已删 | 搜标题 | 命中含 rev0 卡片（带「编辑」按钮）；hasEmpty=false | 仍命中 | 高 | VERIFIED |
| Account B | /zh-cn/worlds/test-map-world-001-rev0 | NEW-L2 再 Remix | 父级已删 | 点「改编」 | 跳 /zh-cn/worlds/test-map-world-001-xxt9/edit（NEW-L3 向导，未发布）→ 父级删除后 Remix 仍可用 | — | 高 | VERIFIED |

## 可操作结论
- Remix attribution 是**运行时解析直接父级**：父级存在时显示「改编自 X · owner」；父级被删后整段 attribution 隐藏，无占位/断链提示。这与「删除传播」的 404 语义不同——后代存活但来源引用静默消失。
- 中间父级删除不破坏后代的直链、搜索、再改编能力（Remix 副本独立性再次确认，跨两层）。
- 老版本：non-owner 只能看到只读版本记录文本，无版本切换/旧链接入口；owner 侧是否可访问旧版本 URL 需主 Agent 复核。

## 本轮新建/删除资产
- NEW-L1（已删除）：`test-map-world-001-w32j`
- NEW-L2（存活，父级已删）：`test-map-world-001-rev0`
- NEW-L3（未发布向导草稿）：`test-map-world-001-xxt9`
- 未触碰 Phase-1 证据对象（ukb1/ouue/k4do）。
*（内容由AI生成，仅供参考）*
