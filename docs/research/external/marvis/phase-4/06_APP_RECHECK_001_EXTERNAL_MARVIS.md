# APP_RECHECK_001 — App `test-app-first-publish-001` Account B / Guest 对照复查

复查日期：2026-08-24（Asia/Shanghai）  
目标：`https://worldos.cc/zh-cn/apps/test-app-first-publish-001`  
标题：`测试应用首次发布 001`  
执行身份：独立外部 Marvis Agent 使用 Account B（`mehraxbobaid78@gmail.com`）与匿名 Guest 交叉复查  
浏览器：standalone Chromium（外部 Agent 的浏览器会话）

> Provenance：本文件根据用户转述的外部 Agent 完整复查报告整理。原始截图未归档到本 workspace；因此操作结果按“外部黑盒实机报告”记录，视觉证据状态仍为 `ARTIFACT_NOT_ARCHIVED`。报告末尾注明“内容由 AI 生成，仅供参考”，所以不把它提升为服务器内部事实，也不据此推断根因。

## Owner-side 对照

主账号在同一时期确认该 App：公开 v2、可编辑、显示“4 个世界在用”。这与 B/Guest 结果形成跨身份差异，但不自动证明权限 BUG。

## 操作与结果

| # | 时间 | 身份 | 操作 | 结果/页面文本 |
|---:|---|---|---|---|
| 1 | 14:21:35 | Guest | 打开 `/zh-cn/apps/test-app-first-publish-001` | 404；`404 / This page could not be found.`；仍显示导航（世界/App 市场/地图/角色/社区/定价）与 © 2026 WorldOS |
| 2 | 14:23:44 | Guest | 对直链执行 hard reload | 仍为同一 404 |
| 3 | 14:26:18 | Account B | 打开直链 | 404 |
| 4 | 14:27:08 | Account B | hard reload | 仍为 404 |
| 5 | 14:27–14:29 | Account B | App Market `/zh-cn/apps` 按标题搜索 | 无结果；分类筛选后显示“没有结果” |
| 6 | 约 14:28 | Account B | App Market 按 slug `test-app-first-publish-001` 搜索 | 无结果 |
| 7 | 14:29:27 | Account B | 记录 App Market slug 无结果页面 | 无结果状态 |
| 8 | 约 14:30 | Account B | Unified Search `/zh-cn/worlds/search?q=测试应用首次发布+001` | “暂无匹配结果”；可见全部/世界/角色/用户/App 标签 |
| 9 | 约 14:31 | Account B | Unified Search `?q=test-app-first-publish-001` | “暂无匹配结果” |
| 10 | 约 14:31 | Account B | Unified Search `?q=test-app-first-publish-001&tab=apps` | App 专用标签仍“暂无匹配结果” |
| 11 | 14:32 | Account B | 对照已删除 App `test-app-delete-lifecycle-001` 直链 | 同一通用 404 形态 |

## 已验证事实（样本范围）

- Guest 与 Account B 均无法通过该 App 的直链访问详情；刷新后仍无法访问。
- Account B 在 App Market 和 Unified Search（含 App tab）均未发现该 App。
- 已删除 App 对照呈现相同通用 404 外观。
- 这比“仅搜索索引延迟”更强：直链本身也不可达。

## 解释边界

根因保持 `UNKNOWN`，候选包括：

1. App 曾被下架/取消公开（downlist/unpublish）且 owner 侧后来恢复或状态投影不一致；
2. Private/Unlisted 或其他可见性生命周期状态；
3. 跨账号权限/路由投影缺陷；
4. 其他 owner 与非 owner 状态不同步。

不能仅凭本次报告区分上述候选，也不能把它直接标记为产品 BUG。Owner 侧 EVD-0180 已证明存在 usage-gated `只能下架` 分支：有其他用户 World 使用时，删除会进入“下架（市场隐藏，已安装世界不受影响）”确认；该动作本次未提交。

## 后续可验证实验

- 在 owner 侧记录当前公开 v2 与 usage count 后，若 action-time confirmation 可用，创建一个独立 App 样本执行：发布 → 让另一 World 安装 → 触发 `只能下架` → 取消/确认 → owner、B、Guest 分别复查直链、Market、Unified Search、已安装 World 与原有 Simulation。
- 再执行恢复上架/重新发布路径，比较版本号、旧 World 安装状态和跨账号可见性。
- 对同一时间窗保存 owner/B/Guest 页面截图与 URL，避免把历史缓存、索引延迟与权限状态混在一起。

## Confidence

| 项目 | Confidence |
|---|---|
| Guest direct 404 + hard reload | `EXTERNAL_BLACKBOX_REPORTED / HIGH` |
| Account B direct 404 + hard reload | `EXTERNAL_BLACKBOX_REPORTED / HIGH` |
| Market/Search 无结果 | `EXTERNAL_BLACKBOX_REPORTED / HIGH` |
| 与已删除 App 的同形态对照 | `EXTERNAL_BLACKBOX_REPORTED / MEDIUM-HIGH` |
| 服务器根因 | `UNKNOWN` |
| 原始截图/视频可在本地复核 | `ARTIFACT_NOT_ARCHIVED` |

