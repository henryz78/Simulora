---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_1db51c8c9f7f11f1a413525400287e28
    ReservedCode1: KovkwhKjyvpREec6vJFW9bFkzzVdyG15qaqRM5nMAfTKH0llFD8IrsO+9AoEwz6qvnG9HAv8Phq+8Mi8NaPj5+Q+QHTbxIX0RWcVLCrgFTTf3GLwdGijpEZLcjOTDMKK385PmdE7S3d+uXnXToIiZqU0pO42/G87B4y3bXxePns8vr7/HBNaI+YCnsE=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_1db51c8c9f7f11f1a413525400287e28
    ReservedCode2: KovkwhKjyvpREec6vJFW9bFkzzVdyG15qaqRM5nMAfTKH0llFD8IrsO+9AoEwz6qvnG9HAv8Phq+8Mi8NaPj5+Q+QHTbxIX0RWcVLCrgFTTf3GLwdGijpEZLcjOTDMKK385PmdE7S3d+uXnXToIiZqU0pO42/G87B4y3bXxePns8vr7/HBNaI+YCnsE=
---

# Phase-3 · 02 — Private / Unlisted 样本：Guest 与 non-owner 权限矩阵

执行账号：Account B（mehraxbobaid78，登录态）
执行时间：2026-08-24（Asia/Shanghai）
证据标准：VERIFIED / PARTIAL / UNKNOWN / BLOCKED
原始证据：`raw/BATCH1_COLLECTION_PRIVATE_REMIXPERM.md`

## 结论摘要

主 Agent 未提供任何 Private / Unlisted 的 World / Character / App 对象 URL，Account B 为免费账号（受会员墙限制）无法创建非公开对象。因此本矩阵**无合法样本可测，全部保留 UNKNOWN**，不臆造 URL 测试。

附带完成的相邻验证：主 Agent 3 个公开 World 在 B 视角全部可见且无 Private/Unlisted 标记；App `test-app-first-publish-001` 在 B 视角直链 404（重要异常信号，根因需主 Agent 侧确认）。

## 权限矩阵（无样本 → UNKNOWN）

| 对象类型 | Direct URL | Search | Profile | Share | Favorite | Collection | Remix | 状态 |
|---|---|---|---|---|---|---|---|---|
| World · Private | — | — | — | — | — | — | — | UNKNOWN |
| World · Unlisted | — | — | — | — | — | — | — | UNKNOWN |
| Character · Private/Unlisted | — | — | — | — | — | — | — | UNKNOWN |
| App · Private/Unlisted | — | — | — | — | — | — | — | UNKNOWN |
| Collection · 链接可见 | — | — | — | — | — | — | — | UNKNOWN |
| Collection · 仅自己 | — | — | — | — | — | — | — | UNKNOWN |

## 公开基线（已测，作为对照）

| 身份 | URL | 对象 | 结果 | 状态 |
|---|---|---|---|---|
| Account B | /zh-cn/worlds/test-map-world-001-gytp | 「测试应用升级世界 001」 | 打开成功；attribution「改编自 测试地图世界 001 · x161880」；版本记录 v11 最新（2026/8/24）；按钮：立即开始/分享/改编/加入世界合集/收藏(1)；无 Private/Unlisted 标记 | VERIFIED |
| Account B | /zh-cn/worlds/test-map-world-001-rxwf | 「测试地图世界 001」（源 World） | 打开成功；无 attribution；无 Private/Unlisted 标记 | VERIFIED |
| Account B | /zh-cn/worlds/test-template-world-001-fv99 | 「测试模板世界 001」 | 打开成功；按钮：分享/改编/预览/立即开始/加入世界合集 | VERIFIED |
| Account B | /zh-cn/apps/test-app-first-publish-001 | App「测试应用首次发布 001」 | **404「404 / This page could not be found.」**（含 reload 强刷 1 次仍 404，仅 footer 无导航栏） | VERIFIED（观察） |

## 待主 Agent 处理
1. 若需完整 Private/Unlisted 矩阵：请提供任意 Private / Unlisted 的 World 或 Character 或 App 对象 URL（1 个即可），B 即可补测直链/Search/Profile/Share/收藏/合集/Remix 全项。
2. 请确认 App `test-app-first-publish-001` 当前状态：被 permanent delete / unpublish / downlist / 改为 Private？这直接影响 B 侧 404 的解读（HANDOFF 记录主 Agent 正在做 App 删除传播实验）。
*（内容由AI生成，仅供参考）*
