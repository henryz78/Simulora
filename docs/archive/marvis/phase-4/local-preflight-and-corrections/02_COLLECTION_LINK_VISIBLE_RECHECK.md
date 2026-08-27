# Phase-4 · Link-visible Collection `test-collection-001-g6wi` 非 owner/Guest 复测（external result merged）

日期：2026-08-24（Asia/Shanghai）  
目标 URL：`https://worldos.cc/zh-cn/collections/test-collection-001-g6wi`

## 身份与前置状态

- 目标身份：Account B（`mehraxbobaid78`）+ Guest。
- owner 已确认此样本为 `链接可见`（EVD-0175）。
- 本文件只记录 Codex 主 Agent 本地 IAB/Chrome 尝试；两者显示 Account A `x161880 / x161880@gmail.com`。这不代表外部 Tencent Marvis 的 Account B/Guest 会话不可用，也不代表项目没有第二账号。未修改可见性、未删除、未添加成员。

## 逐步复测状态

| 面 | Account B | Guest | 预期记录字段 | Confidence |
|---|---|---|---|---|
| Direct URL | BLOCKED | BLOCKED | 页面/404、对象标题、owner 控件 | HIGH（阻断事实） |
| `/zh-cn/collections` 目录 | BLOCKED | BLOCKED | 是否收录、排序/筛选 | HIGH |
| Unified Search | BLOCKED | BLOCKED | 合集标题命中与 URL 参数 | HIGH |
| Share | BLOCKED | BLOCKED | 分享按钮、Modal、复制链接 | HIGH |
| World item access | BLOCKED | BLOCKED | 成员 World 直链与非公开控件 | HIGH |
| 加入自己的 Collection | BLOCKED | BLOCKED | 加入入口、保存 toast、刷新持久化 | HIGH |

## 结论

上表只保留 Codex-local preflight 历史。后续外部腾讯 Marvis 已完成目标复测，原始总证据见 `docs/research/external/marvis/phase-3/raw/FINAL_RECHECK_001.md`（EVD-0191）：Account B 与 Guest 直链/hard reload 均成功，两个成员 World 可打开，Share canonical 不变；合集不进入目录或 Unified Search，外部页面无 Edit/Delete/Favorite/Save/管理控件。该链接可见样本的 external enforcement 已 `VERIFIED`；`仅自己`仍 `UNKNOWN`。
