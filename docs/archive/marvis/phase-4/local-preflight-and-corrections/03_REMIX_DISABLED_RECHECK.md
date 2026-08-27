# Phase-4 · Remix-disabled World `test-template-world-001-fv99` 非 owner/Guest 复测（external result merged）

日期：2026-08-24（Asia/Shanghai）  
目标 URL：`https://worldos.cc/zh-cn/worlds/test-template-world-001-fv99`

## 身份与前置状态

- 目标身份：Account B（`mehraxbobaid78`）+ Guest。
- owner 已发布 v4，更新日志为“权限边界审计：关闭世界改编权限，验证跨账号访问与 Remix 行为。”（EVD-0176）。
- 本文件只记录 Codex 主 Agent 本地 IAB/Chrome 尝试；当前均为 Account A。外部 Tencent Marvis 的 Account B/Guest 会话不在 Codex 可见范围内，不能据此推断项目级账号不可用。未执行 Remix，不进入向导，不创建新副本。

## 逐步复测状态

| 面 | Account B | Guest | 需观察 | Confidence |
|---|---|---|---|---|
| Detail direct URL + reload | BLOCKED | BLOCKED | 页面渲染、版本、Remix 按钮 | HIGH（阻断事实） |
| Remix 控件 | BLOCKED | BLOCKED | 是否隐藏/禁用/登录墙 | HIGH |
| 点击 Remix | BLOCKED | BLOCKED | toast/modal/向导/报错 | HIGH |
| Direct Remix URL | BLOCKED | BLOCKED | URL 是否可达、是否创建副本 | HIGH |
| Existing descendants | BLOCKED | BLOCKED | 后代直链、Search、attribution | HIGH |

## 结论

上表只保留 Codex-local preflight 历史。后续外部腾讯 Marvis 已完成目标复测，原始总证据见 `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md`（EVD-0192）：Guest 主详情不显示 Remix，合集入口点击静默；Account B 可进入创建 Modal，但最终 `复制并自己改编` 被拦截且没有新副本。测试样本的 external enforcement 已 `VERIFIED`；direct undocumented route 和既有 descendants 例外仍 `UNKNOWN`。
