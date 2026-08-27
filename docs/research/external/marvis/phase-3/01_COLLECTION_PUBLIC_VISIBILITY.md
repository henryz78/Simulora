---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_1d05a1129f7f11f1a54f525400f8a581
    ReservedCode1: IUiUAYTsSMM0CENAydxObwMSr27fYL4CHSBPbCni+e8a97HgpFBVxjlE5Ijtjcyo8HriG8y4w1VgzV0nvrnspxUNUXRzhWetLaZAuKWfF1n87dTE/jm9huPjoJtSVNsP4LLbIElwahsl2+Coc5XNs33APoxF1LdYSZh/Cx4TEDWVF8RGQkZm1uu8ISs=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_1d05a1129f7f11f1a54f525400f8a581
    ReservedCode2: IUiUAYTsSMM0CENAydxObwMSr27fYL4CHSBPbCni+e8a97HgpFBVxjlE5Ijtjcyo8HriG8y4w1VgzV0nvrnspxUNUXRzhWetLaZAuKWfF1n87dTE/jm9huPjoJtSVNsP4LLbIElwahsl2+Coc5XNs33APoxF1LdYSZh/Cx4TEDWVF8RGQkZm1uu8ISs=
---

# Phase-3 · 01 — 公开合集：直链 / 搜索 / 收藏 / 权限（跨账号）

执行账号：Account B（mehraxbobaid78，登录态）
执行时间：2026-08-24（Asia/Shanghai）
证据标准：VERIFIED / PARTIAL / UNKNOWN / BLOCKED
原始证据：`raw/BATCH1_COLLECTION_PRIVATE_REMIXPERM.md`

## 结论摘要

| 调查点 | 结果 | 状态 |
|---|---|---|
| 新公开合集对非 owner 的直链可访问性 | 主 Agent 新公开合集「测试收藏生命周期 002」（x161880）对 B 直接打开成功，tab 标题、创建者、收录 1 个世界均可见 | VERIFIED |
| 合集名称的 Search 命中 | 两次搜索（间隔 5s）均「暂无匹配结果」，Search 不索引合集名 | VERIFIED |
| 合集目录页收录 | `/zh-cn/collections` 已收录该合集（与 Search 不同步）→ 发现索引与搜索索引异步解耦，与 HANDOFF 既有结论一致（用新合集复验） | VERIFIED |
| 非 owner 对他人公开 World「加入世界合集」 | 可用：弹出合集选择模态框，加入 B 自己的合集后 toast「已加入」，world 数 1→2；编辑模式移除后恢复基线 1 | VERIFIED |
| 合集页自身收藏入口 | 合集详情页无「收藏/加入合集」入口（收藏的对象是 World/App，不是合集） | VERIFIED |
| 可见性三态入口 | 「公开 / 链接可见 / 仅自己」仅 owner 编辑页出现 | VERIFIED |
| 「链接可见 / 仅自己」合集的 Guest/非 owner 直链 enforcement | 无合法 Private/Unlisted 合集样本 URL → 无法验证 | UNKNOWN |

## 证据表

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文/数字变化） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Account B | /zh-cn/collections/test-collection-lifecycle-002-2szc | 主 Agent 新公开合集「测试收藏生命周期 002」 | 未访问过 | 直链打开 | 打开成功；创建者 x161880；公开（无可见性标记）；收录 1 个世界「测试模板世界 001」；页面按钮：分享、改编、立即开始；无收藏/加入合集入口；分享数 0 | 可重复打开 | 高 | VERIFIED |
| Account B | /zh-cn/worlds/search?q=测试收藏生命周期+002 | Search | 合集已发布公开 | 搜合集名 2 次 | 两次均「暂无匹配结果」 | 无变化 | 高 | VERIFIED |
| Account B | /zh-cn/collections | 目录页 | 合集公开 | 打开目录 | 已收录「测试收藏生命周期 002」（x161880，1 世界，0 分享） | 稳定 | 高 | VERIFIED |
| Account B | /zh-cn/worlds/test-template-world-001-fv99 | World「测试模板世界 001」 | 公开 | 点「加入世界合集」 | 模态框「加入世界合集 / 选择你的合集，这个世界会被添加到末尾」，列出 B 的合集 + 新建入口 | — | 高 | VERIFIED |
| Account B | 同上 | B 的公开合集「第二账号测试合集 001」 | world=1 | 加入 | toast「已加入」 | 合集 world 1→2 | 高 | VERIFIED |
| Account B | /zh-cn/collections/di-er-zhang-hao-ce-shi-he-ji-001-9n2j | B 自己的公开合集 | world=2 | 直链打开 | 可见，创建者 mehraxbobaid78，含「编辑合集」按钮 | 稳定 | 高 | VERIFIED |
| Account B | 同上 /edit | B 合集编辑页 | world=2 | 移除「测试模板世界 001」并保存 | 行 2→1；保存后详情 world 数回 1 | 详情=1 | 高 | VERIFIED |
| Account B | 同上 /edit | 可见性入口 | 编辑态 | 查看 | 「公开/链接可见/仅自己」三态按钮（owner 专属） | — | 高 | VERIFIED |

## 可操作结论
- 公开合集对任意登录/未登录用户直链开放；合集不可被收藏；非 owner 可把自己的 World 加入他人合集（真实生效且持久）。
- Search 不索引合集名，仅目录页收录——查合集需走目录页而非搜索。
- 「链接可见 / 仅自己」合集的访问控制 enforcement 仍未覆盖（缺样本），见 06 号文件 ACCOUNT_A_ACTION_REQUIRED。

## 补测更新（FINAL_RECHECK_001 · 2026-08-24 15:xx）——链接可见合集 `test-collection-001-g6wi`

主 Agent 提供的链接可见合集样本「测试系列 001」（x161880，含 2 个 World）已由 Account B + Guest 双视角补测，原始证据 `raw/FINAL_RECHECK_001.md`。

| 调查点 | Account B | Guest | 状态 |
|---|---|---|---|
| Direct URL 打开（含 hard reload） | 成功，标题「测试系列 001」，2 个 World | 成功，hard reload 稳定 | VERIFIED |
| 公开合集目录收录 | `/zh-cn/collections` 56 个合集，检索「测试系列」未收录 | 56 个合集中无「测试系列 001」 | VERIFIED |
| Unified Search 命中 | — | 搜「测试系列 001」「暂无匹配结果」 | VERIFIED |
| 合集中两个 World 可访问 | `test-template-world-001-fv99`、`hogwarts-3bmx` 均可访问 | 两个 World 均打开成功 | VERIFIED |
| Share 后 canonical URL | URL 不变 `/zh-cn/collections/test-collection-001-g6wi` | 同，canonical 一致 | VERIFIED |
| 非 owner 管理控件（Edit/Delete/Favorite/Save/Collection） | 页面无任何此类控件，仅「分享」 | 无控件，「分享」仅复制 canonical，「立即开始」跳登录墙 | VERIFIED |

**在该测试样本中**：链接可见合集 enforcement 为「可直链、不可发现（目录/搜索均不收录）、无 owner 管理控件」。验证了「链接可见」合集的访问控制边界（非 owner 可经直链读取，但不出现在发现入口）。「仅自己」合集仍无样本 → UNKNOWN（见 06 号文件）。
*（内容由AI生成，仅供参考）*
