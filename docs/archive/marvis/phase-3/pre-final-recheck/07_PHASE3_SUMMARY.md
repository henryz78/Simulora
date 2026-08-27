---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_210a4d439f7f11f1a54f525400f8a581
    ReservedCode1: 6ZJkXkCZZ+dMpMVC4nBraq5RhB89q74xSXAn6MM0Nkd9So3fnVqK2oWMoVEkdl6ExuFTdVA9DlCk1IGg0s5hTI3x6+1jCkjgyluMZ+0kAlscnpNDrEhwbt5UfCSsDSzl85mK75yev10dnUU7eEjbb/iutx5P3uq+ZEj7uiTB7L8QfMvuhWOlBXxD6Iw=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_210a4d439f7f11f1a54f525400f8a581
    ReservedCode2: 6ZJkXkCZZ+dMpMVC4nBraq5RhB89q74xSXAn6MM0Nkd9So3fnVqK2oWMoVEkdl6ExuFTdVA9DlCk1IGg0s5hTI3x6+1jCkjgyluMZ+0kAlscnpNDrEhwbt5UfCSsDSzl85mK75yev10dnUU7eEjbb/iutx5P3uq+ZEj7uiTB7L8QfMvuhWOlBXxD6Iw=
---

# Phase-3 · 07 — 总摘要（WorldOS 第三轮：第二账号 + 匿名视角查漏）

更新时间：2026-08-24（Asia/Shanghai）
范围：仅 worldos.cc（zh-cn）域内黑盒调查；不进入开发阶段。
执行身份：Account B（mehraxbobaid78）+ Guest（匿名）
依据：`docs/archive/coordination/MARVIS_HANDOFF_INITIAL.md` 推荐项与用户指定 5 项优先调查
原始证据：`raw/BATCH1_COLLECTION_PRIVATE_REMIXPERM.md`、`raw/BATCH2_VERSION_REMIX_ATTRIBUTION_CONTROLS.md`

## 本轮完成情况（对照用户指定 5 项）

| # | 指定调查项 | 结果 | 状态 |
|---|---|---|---|
| 1 | B 账号验证新公开合集的直链、搜索、收藏与权限 | 直链对非 owner 开放；Search 不索引合集名（目录页收录，异步解耦复验）；非 owner 可把公开 World 加入他人合集（真实生效）；合集页无收藏入口；主账号后续又补充了 `TEST Collection 001` 的 `链接可见` 样本，待独立 viewer enforcement | 4 VERIFIED + 1 UNKNOWN（新增样本待复测） |
| 2 | Private/Unlisted 样本的 Guest、non-owner 权限矩阵 | World/Character/App Private/Unlisted 仍无合法样本，B 免费账号无法创建；Collection `链接可见` 样本已补充但不等同于 Private/Unlisted 对象；App test-app-first-publish-001 的 B 直链 404 已记录 | UNKNOWN（对象样本缺失；Collection 单独待复测） |
| 3 | 禁止改编的真实跨账号执行效果 | 未关闭改编权限的 World 上 B 可正常 Remix（进入向导，非跳登录）；主账号已发布 `TEST Template World 001` v4（`改编权限=不允许`），待 B/Guest 复测 enforcement | PARTIAL / UNKNOWN |
| 4 | 老 Version、Remix 基线、中间父级删除后的 attribution | 版本记录对 non-owner 只读、无切换入口；Remix attribution 只指向直接父级（复验）；**新观察：中间父级删除后后代 attribution 整段静默消失，但直链/搜索/再改编全部存活** | VERIFIED（核心项） |
| 5 | 匿名剩余控件（Character 排行榜、App 送礼、Map 双预览） | 排行榜公开可见数据、支持者空态；App 送礼走登录墙（非静默失败）；Map 双预览入口完全等价、无独立详情页 | 全部 VERIFIED |

## 关键新发现

1. **attribution 是运行时解析直接父级**：父级删除后后代详情的「改编自 X」整段消失、无占位。与「删除对象 404」是两种不同语义（后代存活但来源引用静默隐藏）。建议主 Agent 在 owner 侧复核渲染逻辑。
2. **Search 不索引合集名**：公开合集只进目录页，不进搜索索引——「合集可被发现性」弱于 World/App。
3. **App test-app-first-publish-001 对 B 直链 404**：可能与主 Agent 删除/unpublish/downlist 实验有关，需主 Agent 确认当前状态（影响既有 HANDOFF 中该 App 作为测试对象的有效性）。
4. **非 owner 可加入他人公开 World 到自己合集**：跨账号合集写入真实生效且持久（Phase-1 已验证 Remix/收藏/评论，本轮补合集加入）。
5. **地图库无独立详情页**：双预览入口（按钮/缩略图）打开同一 modal，完全等价；无 /maps/<slug> 详情 URL。

## 仍为 UNKNOWN / 需主账号配合（详见 06 号文件）
- World/Character/App Private / Unlisted 全矩阵（无样本）；Collection `链接可见` 已有样本但独立 viewer 结果待补
- 「链接可见 / 仅自己」合集直链 enforcement（已补充 `TEST Collection 001` 链接可见样本，待 B/Guest 复测）
- 关闭改编权限后的陌生账号 Remix enforcement（已有 v4 样本，待 B/Guest 复测）
- 老 Version 旧链接可访问性 / owner 侧旧版本分享入口（non-owner 无入口）
- App 404 根因（permanent delete / unpublish / downlist / Private）

## 主 Agent 可执行动作（汇总）
1. 确认 App test-app-first-publish-001 状态（AA-01）。
2. 复测已提供的 `TEST Collection 001` 链接可见样本（AA-02/AA-06）。
3. 复测已发布的「关闭改编权限」World v4 样本（AA-03/AA-07）。
4. 提供 1 个 Private/Unlisted 对象样本（AA-04）。
5. 复核中间父级删除后 attribution 消失的渲染逻辑（AA-05）。

## 为避免重复的说明
本轮未重复：Simulation 长期运行、App 状态迁移/Initial JSON merge、Map Marker/Rewind、Templates 字段传播、主账号通知实验（A 侧通知已由主 Agent 验证并写入 HANDOFF）。

## 文件清单（phase-3）
- 01_COLLECTION_PUBLIC_VISIBILITY.md —— 公开合集直链/搜索/收藏/权限
- 02_PRIVATE_UNLISTED_MATRIX.md —— Private/Unlisted 权限矩阵（无样本 UNKNOWN）
- 03_REMIX_PERMISSION_ENFORCEMENT.md —— 禁止改编跨账号效果
- 04_VERSION_REMIX_BASELINE_ATTRIBUTION.md —— 老 Version/Remix 基线/中间父级删除 attribution
- 05_GUEST_CONTROLS_AUDIT_REMAINING.md —— 匿名剩余控件审计
- 06_ACCOUNT_A_ACTION_REQUIRED.md —— 需主账号配合事项
- 07_PHASE3_SUMMARY.md —— 本文件
- raw/BATCH1_COLLECTION_PRIVATE_REMIXPERM.md、raw/BATCH2_VERSION_REMIX_ATTRIBUTION_CONTROLS.md —— 原始证据
*（内容由AI生成，仅供参考）*
