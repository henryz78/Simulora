---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: c155b059b691a65648c3dfcfa330b8a2_9d0665bf9f9811f1a413525400287e28
    ReservedCode1: cVq6JsHr1JJ0RP/PIdtFsESMWI5AHV/FTJnSPh6VRp6eZjekX9VrU6eWdILyNM2O04IUfPhPvoTTahMzegY9aA1VbsONedmQmgG+mbpyDPfi5Pj8EcLk2aDDk4IkHu/odvs4oapBp6rAftFHeru9+a5zemeHcnp0hQWIWPn+7ViI+iffHjvDZvybHDw=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: c155b059b691a65648c3dfcfa330b8a2_9d0665bf9f9811f1a413525400287e28
    ReservedCode2: cVq6JsHr1JJ0RP/PIdtFsESMWI5AHV/FTJnSPh6VRp6eZjekX9VrU6eWdILyNM2O04IUfPhPvoTTahMzegY9aA1VbsONedmQmgG+mbpyDPfi5Pj8EcLk2aDDk4IkHu/odvs4oapBp6rAftFHeru9+a5zemeHcnp0hQWIWPn+7ViI+iffHjvDZvybHDw=
---

﻿# FINAL_RECHECK_001 — 最后一轮定向补测证据（Account B / Guest 对照）

- 补测日期：2026-08-24（Asia/Shanghai）
- 范围：仅 worldos.cc（zh-cn）域内；不触碰第三方平台/Google 授权（B 侧沿用本任务早前已完成的 B 登录态证据，未重新走 Google OAuth）
- 证据标准：VERIFIED / PARTIAL / UNKNOWN / BLOCKED
- 单一样本结论均限定「在该测试样本中」，不升级为全站规则

## 第 1 项 · App `test-app-first-publish-001` 重新发布后复查

前置：早前会话（APP_RECHECK_001）该 App 直链对 B 与 Guest 均 404；主 Agent 已重新发布。目标 URL：`/zh-cn/apps/test-app-first-publish-001`

| # | 时间 | 身份 | 操作 | 结果（原文） | 状态 |
|---|------|------|------|--------------|------|
| 1 | ~15:2x | Account B（登录，早前轨迹） | Direct URL 打开 | 已恢复：标题「TEST App First Publish 001」，by x161880，4 个世界在用，更新日志 v2（TEST v2 hot-upgrade and state-merge audit） | VERIFIED |
| 2 | ~15:2x | Account B | hard reload 直链 | 仍正常打开，URL 不变 | VERIFIED |
| 3 | ~15:2x | Account B | App Market 搜标题「测试应用首次发布 001」 | 「没有结果」 | VERIFIED |
| 4 | ~15:2x | Account B | App Market 搜 slug `test-app-first-publish-001` | 「没有结果」 | VERIFIED |
| 5 | ~15:2x | Account B | Search App tab 搜标题 | 「暂无匹配结果」 | VERIFIED |
| 6 | ~15:2x | Account B | Search App tab 搜 slug | 「暂无匹配结果」 | VERIFIED |
| 7 | 15:3x | Guest（退出登录） | Direct URL 打开 | 已恢复：标题「TEST App First Publish 001」，by x161880，4 个世界在用，v2 日志，评分/评论/在线试玩（登录后）区域齐全 | VERIFIED |
| 8 | 15:3x | Guest | hard reload 直链 | 仍正常打开，URL 不变 | VERIFIED |
| 9 | 15:4x | Guest | App Market 搜标题 | 「没有结果」（仅分类筛选+无结果文案） | VERIFIED |
| 10 | 15:4x | Guest | App Market 搜 slug | 「没有结果」 | VERIFIED |
| 11 | 15:4x | Guest | Search App tab 搜标题 `测试应用首次发布 001` | 「暂无匹配结果」 | VERIFIED |
| 12 | 15:4x | Guest | Search App tab 搜 slug | 「暂无匹配结果」 | VERIFIED |

第 1 项结论：App 直链已从 404 恢复（B 与 Guest 均 VERIFIED，含 hard reload）；但 App Market（标题/slug）与 Unified Search App tab（标题/slug）在该测试样本中均不命中——「直链可见 ≠ 搜索/市场可发现」，与既有「发现索引与搜索索引异步解耦」模式一致；从 BATCH1 404 → 本轮恢复的变化可反推此前 404 与该 App 的发布状态相关（无法黑盒区分 unpublish 与权限缺陷，但本轮已恢复可见）。

## 第 2 项 · 链接可见合集 `test-collection-001-g6wi` 权限

目标 URL：`/zh-cn/collections/test-collection-001-g6wi`（标题「测试系列 001」，创建者 x161880，含 2 个 World）

| # | 时间 | 身份 | 操作 | 结果（原文） | 状态 |
|---|------|------|------|--------------|------|
| 1 | ~15:2x | Account B（早前轨迹） | Direct URL 打开 | 成功，标题「测试系列 001」，创建者 x161880，含 2 个 World；页面无 Edit/Delete/Favorite/Save/Collection 控件，仅有「分享」按钮 | VERIFIED |
| 2 | ~15:2x | Account B | 点「分享」 | URL 不变，仍为 `/zh-cn/collections/test-collection-001-g6wi`（canonical 一致） | VERIFIED |
| 3 | ~15:2x | Account B | 合集目录 `/zh-cn/collections` | 目录列出 56 个合集，检索「测试系列」未收录 | VERIFIED |
| 4 | ~15:2x | Account B | 合集内两 World | `test-template-world-001-fv99` 可访问（标题「测试世界模板 001」）；`hogwarts-3bmx` 可访问 | VERIFIED |
| 5 | 15:4x | Guest | Direct URL 打开 | 成功，标题「测试系列 001」，2 个世界（测试世界模板 001 / 测试世界 001） | VERIFIED |
| 6 | 15:4x | Guest | hard reload 直链 | 仍可打开 | VERIFIED |
| 7 | 15:4x | Guest | 点「分享」 | URL 不变（canonical 一致） | VERIFIED |
| 8 | 15:4x | Guest | 合集目录 | 56 个合集中无「测试系列 001」（页面文本检索 hasTestSeries=false） | VERIFIED |
| 9 | 15:4x | Guest | Unified Search 搜「测试系列 001」 | 「暂无匹配结果」 | VERIFIED |
| 10 | 15:4x | Guest | 两 World 可访问性 | `test-template-world-001-fv99` 打开成功；`hogwarts-3bmx`（标题「测试世界 001」）打开成功 | VERIFIED |
| 11 | 15:4x | Guest | 非 owner 控件盘点 | 无 Edit/Delete/Favorite/Save/Collection 控件；「分享」可点但仅复制/展示 canonical；「立即开始」→ 跳登录墙 | VERIFIED |

第 2 项结论：在该测试样本中，链接可见合集 `test-collection-001-g6wi` 对 Account B 与 Guest 均可通过 Direct URL 访问（含 hard reload），Share 后 canonical URL 保持不变；但不出现在公开合集目录，也不被 Unified Search 命中；合集中两个 World 均可访问；非 owner 页面不渲染任何 owner 管理控件（Edit/Delete/Favorite/Save），仅保留「分享/改编/立即开始」类内容入口，其中「立即开始」对 Guest 触发登录墙（真实不可执行），「改编」对 Guest 静默无反应（见第 3 项）。

## 第 3 项 · 禁止改编 World `test-template-world-001-fv99` enforcement

目标 URL：`/zh-cn/worlds/test-template-world-001-fv99`（版本记录 v4「权限边界审计：关闭世界改编权限，验证跨账号访问与 Remix 行为。」→ 已确认该 World 关闭改编权限）

| # | 时间 | 身份 | 操作 | 结果（原文） | 状态 |
|---|------|------|------|--------------|------|
| 1 | ~15:2x | Account B（早前轨迹） | 合集页 fv99 改编按钮 | 按钮仍渲染「改编」；点击弹出「创建新世界」Modal，fv99 被选为改编源，含「复制并自己改编」「用 AI 改编」两个入口 | VERIFIED |
| 2 | ~15:2x | Account B | 点「复制并自己改编」 | Modal 关闭，URL 未变（仍在合集页），无跳转、无网络请求、无报错 → 真实被拦截，B 未生成 Remix | VERIFIED |
| 3 | ~15:2x | Account B | Mine `/sims` 检查 | 仅见早前 BATCH1 残留的 m72j Draft 与 B 自有世界，本轮无新增副本 | VERIFIED |
| 4 | 15:4x | Guest | World 详情页改编按钮 | 主 World 区（顶部内容区）不渲染「改编」按钮（eval 全页 12 个「改编」按钮均在 bottom 推荐区 top=1726，非主 World 区）；版本记录确认 v4「关闭世界改编权限」 | VERIFIED |
| 5 | 15:4x | Guest | 合集页 fv99 改编按钮点击 | 点击后页面无跳转、无 toast/modal/dialog（eval 返回空 []），静默无反应 | VERIFIED |
| 6 | 15:4x | Guest | 「立即开始」（详情页） | 跳转 `/zh-cn/login?next=/zh-cn/worlds/test-template-world-001-fv99/new`（登录墙） | VERIFIED |
| 7 | 15:5x | Guest | 「立即开始」（合集页） | 同样跳 `/zh-cn/login?next=/zh-cn/worlds/test-template-world-001-fv99/new`（登录墙） | VERIFIED |

第 3 项结论：在该测试样本中，关闭改编权限的 World `test-template-world-001-fv99` 的 enforcement 真实生效——Guest 在 World 详情页主区看不到「改编」按钮，合集页点击改编静默无反馈；Account B（登录非 owner）在合集页点击改编弹 Modal 后点「复制并自己改编」被真实拦截（URL 不变、无跳转、无请求），未能生成 Remix，且 Mine/搜索未发现意外产生的公开副本；Guest 的「立即开始」仅被要求登录（登录墙），未绕过权限。

## 跨项备注 / BLOCKED / UNKNOWN

- B 侧证据来自本任务早前轮次已完成的 B 登录态实测（执行轨迹）；本轮尝试通过已保存 state 文件（`~/.agent-browser/sessions/worldos-account-b-default.json`）恢复 B 会话未成功（standalone daemon 运行中无法 state load，且禁止重新走 Google OAuth），故 B 侧直接沿用早前实测证据，未重复执行。
- App 搜索不命中的根因（unpublish/downlist/搜索索引策略）无法黑盒区分 → UNKNOWN（观察已记录）。
- 链接可见合集未出现在目录/搜索，属该样本事实；未扩展到「仅自己」合集样本（主 Agent 未提供）。
- 全程仅 worldos.cc（zh-cn）域内操作，未触碰第三方平台；未创建/清理任何测试内容（fv99 副本未生成，m72j Draft 为早前残留，未清理）。
*（内容由AI生成，仅供参考）*
