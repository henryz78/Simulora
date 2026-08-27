---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_1b4b80389f7f11f1a54f525400f8a581
    ReservedCode1: sOePY29Cu3fn4pkJBJUGapVD9fdVI3iFBtk8dKRdJAj4nzHfAfODNaB2L5HAtk8Y5SBTSAzkPEKapLLkCpoywqfJJdobNUoLxh4ThQDa9gq2q2WLyOoqcUALrbYu+K7MoQkmjF3bqtxzbAy3aMbGt7+KksD7PJVOFTBOtdq0Vj0sDhN5XDaLZKJt4Jo=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_1b4b80389f7f11f1a54f525400f8a581
    ReservedCode2: sOePY29Cu3fn4pkJBJUGapVD9fdVI3iFBtk8dKRdJAj4nzHfAfODNaB2L5HAtk8Y5SBTSAzkPEKapLLkCpoywqfJJdobNUoLxh4ThQDa9gq2q2WLyOoqcUALrbYu+K7MoQkmjF3bqtxzbAy3aMbGt7+KksD7PJVOFTBOtdq0Vj0sDhN5XDaLZKJt4Jo=
---

﻿# BATCH1 — Collection / Private / Remix-Permission 跨账号证据（Phase-3）

执行账号：Account B（mehraxbobaid78@gmail.com / mehraxbobaid78，登录态）
浏览器：agent_browser 路径 B（standalone Chromium，复用已登录 B 会话）
执行时间：2026-08-24（Asia/Shanghai）
范围：仅 worldos.cc（zh-cn）域内；不触碰第三方平台/Google 授权
证据标准：VERIFIED / PARTIAL / UNKNOWN / BLOCKED

## 任务 A · 公开合集直链 / 搜索 / 收藏 / 权限

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文/数字变化） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Account B（登录） | /zh-cn/collections/test-collection-lifecycle-002-2szc | 主 Agent 新公开合集「测试收藏生命周期 002」 | 未访问过该合集 | 直链打开 | 打开成功，tab 标题「测试收藏生命周期 002」；创建者 x161880；可见性无显式标记（公开合集）；收录 1 个世界「测试模板世界 001」（x161880）；页面按钮：分享、改编、立即开始；无「收藏/加入合集」入口（合集页本身不提供收藏）；分享数 0 | 可重复打开 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/search?q=测试收藏生命周期+002 | Search 索引 | 合集已发布公开 | 搜索合集名 2 次（间隔 5 秒） | 两次均「暂无匹配结果」（Search 不索引合集名） | 无变化 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/collections | 合集目录页 | 合集公开已发布 | 打开目录 | 目录已收录「测试收藏生命周期 002」（x161880，1 个世界，0 分享）→ 发现索引已收录，但搜索索引未收录，证实两者异步解耦 | 稳定 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/test-template-world-001-fv99 | World「测试模板世界 001」 | 公开 World（主 Agent 资产） | 点「加入世界合集」 | 按钮对非 owner 可用；弹出模态框「加入世界合集/选择你的合集，这个世界会被添加到末尾」，列出 B 自己的合集「第二账号测试合集 001」+「新建合集」入口 | — | 高 | VERIFIED |
| Account B（登录） | 同上（模态框） | B 自己的公开合集「第二账号测试合集 001」 | world 数=1 | 点击该合集条目「加入」 | toast「已加入」 | 重新打开 B 合集：world 数 1→2（新增「测试模板世界 001」） | 高 | VERIFIED |
| Account B（登录） | /zh-cn/collections/di-er-zhang-hao-ce-shi-he-ji-001-9n2j | B 自己公开合集「第二账号测试合集 001」 | world 数=2 | 直链打开 | 直链可见，创建者 mehraxbobaid78；含「编辑合集」按钮；详情含 2 个世界 | 稳定 | 高 | VERIFIED |
| Account B（登录） | 同上 /edit | B 合集编辑页 | world 数=2 | 进入编辑模式，移除「测试模板世界 001」行并保存 | 「测试模板世界 001」行移除，drag 行数 2→1；保存后回详情页 world 数回到 1（恢复基线） | 详情页 world 数=1，仅剩「测试应用升级世界 001」 | 高 | VERIFIED |
| Account B（登录） | 同上 /edit | 合集可见性入口（owner 视角） | 编辑态 | 查看可见性选项 | 存在「公开 / 链接可见 / 仅自己」三态按钮（owner 可见入口） | — | 高 | VERIFIED |
| Guest / 非 owner | 无合法 Private / Unlisted 合集样本 URL（主 Agent 未提供） | 「链接可见」「仅自己」合集直链 enforcement | — | — | 无样本 → 无法验证 | — | — | UNKNOWN |

### 任务 A 小结
- 主 Agent 新公开合集直链对 B 完全可见；合集页无收藏入口（收藏对象是 World/App 而非合集）。
- Search 不索引合集名（两次均空），但合集目录页已收录 → 发现索引与搜索索引异步解耦（与 HANDOFF 既有结论一致，已用新合集复验）。
- 非 owner 可将他人公开 World「加入世界合集」到自己的合集（真实生效，toast+计数变化）。
- 非公开合集（链接可见/仅自己）无样本，直链 enforcement 保持 UNKNOWN。

## 任务 B · Private / Unlisted 样本可见性矩阵

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Account B（登录） | /zh-cn/worlds/test-map-world-001-gytp | World「测试应用升级世界 001」（Remix 副本，改编自 测试地图世界 001） | 公开 | 直链打开 | 打开成功；title=「测试应用升级世界 001」；attribution「改编自 测试地图世界 001 · x161880」；版本记录 v11 最新版 2026/8/24；按钮：立即开始/分享/改编/加入世界合集/收藏(1)；无 Private/Unlisted 标记 | 稳定可打开 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/test-map-world-001-rxwf | World「测试地图世界 001」（源 World） | 公开 | 直链打开 | 打开成功；title=「测试地图世界 001」；无 attribution（源对象）；按钮：立即开始/分享/改编/加入世界合集；无 Private/Unlisted 标记 | 稳定可打开 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/test-template-world-001-fv99 | World「测试模板世界 001」 | 公开 | 直链打开 | 打开成功；title=「测试模板世界 001」；按钮：分享/改编/预览/立即开始/加入世界合集；无 Private/Unlisted 标记 | 稳定可打开 | 高 | VERIFIED |
| Account B（登录） | /zh-cn/apps/test-app-first-publish-001 | App「测试应用首次发布 001」（主 Agent 资产） | 曾被主调查作为主要测试 App | 直链打开（含 reload 强刷 1 次） | 404 页「404 / This page could not be found.」（仅 footer，无导航栏）→ App 直链对 B 失效 | 仍 404 | 高 | VERIFIED（观察） |
| Account B（登录） | 同上 | 404 根因判定 | — | 推断 | 无法区分「permanent delete / unpublish / downlist / 非公开」——B 免费账号无法访问 owner 后台确认；HANDOFF 亦记录主 Agent 正在做 App 删除传播实验 | — | — | UNKNOWN（根因） |
| Account B（登录） | — | Private / Unlisted 对象样本 | 主 Agent 未提供任何 Private/Unlisted URL；B 免费账号受会员墙无法创建 | 尝试从 HANDOFF / 已知 URL 推断 | 无合法样本可测 | — | — | UNKNOWN（无样本） |

### 任务 B 小结
- 3 个 World 全部为公开可见，无 Private/Unlisted 标记；无「改编/编辑」入口隐藏——非 owner 均可看到改编按钮。
- App test-app-first-publish-001 在 B 视角下直链 404（重要异常信号：可能与主 Agent 的删除/下架实验相关，需主 Agent 确认当前 App 状态）。
- 无合法 Private/Unlisted 对象样本 → 记 UNKNOWN，未臆造 URL 测试。

## 任务 C · 禁止改编的跨账号真实效果

| 身份 | URL | 对象 | 前置状态 | 操作 | 结果（原文/跳转） | 刷新后 | Confidence | 状态 |
|---|---|---|---|---|---|---|---|---|
| Account B（登录） | /zh-cn/worlds/test-map-world-001-gytp | 测试应用升级世界 001 | 公开 | 检查改编按钮 | 「改编」按钮存在（非 owner 可见） | — | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/test-map-world-001-rxwf | 测试地图世界 001 | 公开 | 检查改编按钮 | 「改编」按钮存在 | — | 高 | VERIFIED |
| Account B（登录） | /zh-cn/worlds/test-template-world-001-fv99 | 测试模板世界 001 | 公开 | 实际点击「改编」 | 点击后跳转至创建向导编辑页：/zh-cn/worlds/test-template-world-001-m72j/edit（新 slug = B 的 Remix 副本 Draft，标题「世界设置」，含「发布 v2/跳过/下一步」）；未发布即离开，未生成公开副本 | 离开后不追认公开副本 | 高 | VERIFIED（可 Remix，非跳登录/非被禁） |
| Account B（登录） | 同上（副本 m72j） | B 的 Remix 副本 | 编辑向导 Draft | 不保存、导航离开 | 副本未发布，避免污染公开数据 | — | 中 | PARTIAL（副本生命周期未追） |
| Account B（登录） | — | 「关闭改编权限」的样本 | 所有已知主 Agent World 均未关闭改编权限 | 逐一确认 | 未发现关闭改编权限的对象 → 无法验证被禁后的跨账号 Remix enforcement | — | — | UNKNOWN + ACCOUNT_A_ACTION_REQUIRED |

### 任务 C 小结
- 3 个主 Agent World 改编按钮全部存在，实际点击「测试模板世界 001」的改编 → 直接进入 Remix 创建向导（新 slug），即 B 账号可正常 Remix，非跳登录、非被禁（VERIFIED）。
- 未发现任何「关闭改编权限」的样本，跨账号被禁效果 → UNKNOWN + ACCOUNT_A_ACTION_REQUIRED（需主 Agent 提供/设置一个关闭改编权限的 World 样本）。

## 供主 Agent 复核的关键点
1. App test-app-first-publish-001 直链 404 —— 请确认主账号侧该 App 是否已被删除/unpublish/downlist，或改为 Private。
2. 请提供 1 个「仅自己 / 链接可见」合集样本 URL，供 B 测 Guest/非 owner 直链 enforcement。
3. 请提供 1 个「关闭改编权限」的 World 样本，供 B 实测跨账号 Remix 被禁行为。
4. Remix 副本 Draft slug：test-template-world-001-m72j（B 侧未发布的向导草稿，可忽略或由主 Agent 侧观察是否存在）。
*（内容由AI生成，仅供参考）*
