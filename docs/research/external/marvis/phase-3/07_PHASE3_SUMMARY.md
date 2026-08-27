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

## 本轮完成情况（对照用户指定 5 项；最终补测已合并）

| # | 指定调查项 | 结果 | 状态 |
|---|---|---|---|
| 1 | B 账号验证新公开合集的直链、搜索、收藏与权限 | 公开合集基线已验证；最终补测 `test-collection-001-g6wi` 的链接可见状态：B/Guest 可直链/hard reload、成员可访问、Share canonical 不变、目录/Search 不收录、无 owner 控件；仅自己仍无样本 | 链接可见 VERIFIED；仅自己 UNKNOWN |
| 2 | Private/Unlisted 样本的 Guest、non-owner 权限矩阵 | 主 Agent 未提供样本、B 免费账号无法创建；App 404 已由最终复测解释为历史发布状态样本，不替代 Private/Unlisted | UNKNOWN（无样本） |
| 3 | 禁止改编的真实跨账号执行效果 | 最终补测已验证：Guest 主详情隐藏/合集入口静默，B 在最终复制动作被拦截且未生成副本 | VERIFIED（EVD-0192） |
| 4 | 老 Version、Remix 基线、中间父级删除后的 attribution | 版本记录对 non-owner 只读、无切换入口；Remix attribution 只指向直接父级（复验）；**新观察：中间父级删除后后代 attribution 整段静默消失，但直链/搜索/再改编全部存活** | VERIFIED（核心项） |
| 5 | 匿名剩余控件（Character 排行榜、App 送礼、Map 双预览） | 排行榜公开可见数据、支持者空态；App 送礼走登录墙（非静默失败）；Map 双预览入口完全等价、无独立详情页 | 全部 VERIFIED |

## 关键新发现

1. **attribution 是运行时解析直接父级**：父级删除后后代详情的「改编自 X」整段消失、无占位。与「删除对象 404」是两种不同语义（后代存活但来源引用静默隐藏）。建议主 Agent 在 owner 侧复核渲染逻辑。
2. **Search 不索引合集名**：公开合集只进目录页，不进搜索索引——「合集可被发现性」弱于 World/App。
3. **App test-app-first-publish-001 对 B 直链 404**：可能与主 Agent 删除/unpublish/downlist 实验有关，需主 Agent 确认当前状态（影响既有 HANDOFF 中该 App 作为测试对象的有效性）。
4. **非 owner 可加入他人公开 World 到自己合集**：跨账号合集写入真实生效且持久（Phase-1 已验证 Remix/收藏/评论，本轮补合集加入）。
5. **地图库无独立详情页**：双预览入口（按钮/缩略图）打开同一 modal，完全等价；无 /maps/<slug> 详情 URL。

## 仍为 UNKNOWN / 由主调查后续处理（不再需要外部 Marvis）
- Private / Unlisted 全矩阵（无样本）
- 「仅自己」合集直链 enforcement（无样本）
- 老 Version 旧链接可访问性 / owner 侧旧版本分享入口（non-owner 无入口）
- App 404 根因（permanent delete / unpublish / downlist / Private）

## 主 Agent 可执行动作（汇总）
1. 主调查处理 1 个 Private/Unlisted 对象样本（AA-04）。
2. 主调查处理老 Version URL 与 attribution 语义（AA-05 及相关开放问题）。

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
- raw/APP_RECHECK_001.md —— App 可见性针对性复查（含 6 张截图，见 raw/app-recheck/）
- raw/FINAL_RECHECK_001.md —— 最后一轮定向补测证据（App 复检 / 链接可见合集 / 关闭改编 enforcement）

## Final Delta Summary（最后一轮定向补测 · 2026-08-24 15:xx）

**Confirmed（新验证 / 状态升级）**
- App `test-app-first-publish-001`：重新发布后直链已从 404 恢复（Account B 与 Guest 均 VERIFIED，含 hard reload），但 Market/Search 仍不命中；AA-01 闭环（EVD-0190）。
- 链接可见合集 `test-collection-001-g6wi`：可直链（B+Guest）、Share canonical 不变、两 World 可访问，但目录/搜索均不收录、非 owner 无管理控件——「链接可见」合集 enforcement 为「可直链、不可发现、无管理控件」；AA-02 部分闭环。
- 关闭改编权限 World `test-template-world-001-fv99`：enforcement 真实生效（Guest 无按钮/点击静默；B 点「复制并自己改编」被拦截，未生成 Remix；Guest 仅被要求登录）；AA-03 闭环。Mine/搜索未发现意外公开副本。

**Contradictions / changed behavior**
- App `test-app-first-publish-001` 从「非 owner 全入口 404、与已删除 App 同形态（曾疑似权限缺陷）」变为「直链恢复但搜索/市场仍不可见」——改写此前「等效下架」判断为「直链可见 ≠ 搜索可发现」的双轨事实。

**Remaining UNKNOWN**
- App 搜索/市场不命中的根因（unpublish/downlist/索引策略）黑盒不可区分。
- 「仅自己」合集无样本，访问控制未验证。
- Private/Unlisted 对象无样本（AA-04）、老 Version URL 与 Character 中间父级语义仍待主调查；World 中间父级删除已在测试链上 VERIFIED。

*（内容由AI生成，仅供参考）*
