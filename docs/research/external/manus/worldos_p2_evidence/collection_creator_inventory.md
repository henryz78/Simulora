# Collection Creator Availability / Entry Notes

**Owner Profile:** `https://worldos.cc/profile/66a1422d-1583-4334-87d6-7389816ee278`.

公开 Profile 的 `My collections` 区域展示 `Create a collection — Organize worlds into a series or curated theme`，正常链接目标文本为 `/collections/new`。一次在先前页面元素编号上执行的点击未改变 URL、未显示 Collection form，且 Profile 中既有非 P2 World 卡片仍完整可见；因此**没有创建或删除任何对象**。当前渲染后该 Collection 卡片的可见元素编号为 `30`，将由下一步以刷新后的标识正常进入。

**Evidence:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-08-43_3472.webp`; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-08-58_2539.webp`.

## Creator form inventory

实际页面已载入 `https://worldos.cc/collections/new`。可见字段为 Collection name、Description、Tags、Public/Unlisted/Private visibility，以及最多 100 个 World 的排序容器。Owner 的已发布 `MANUS-P2-IDX-WORLD-RENAMED` 显示 `Add`；同时提示：`Public collections can contain only public worlds. Publish those worlds or change the collection visibility.` 初始 `Save collection` 显示为禁用。此流程将仅关联已发布的 MANUS-P2 World，且保持 `Public`，不测试 Unlisted/Private 或会员路径。

**Evidence:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-09-33_4761.webp`; `/home/ubuntu/browser_html/worldos_cc_new_1787641774368.html`.

## Valid creation preconditions

已在 Public 可见性下输入 `MANUS-P2-IDX-COLLECTION-公开`、描述 `Phase 2 collection lifecycle validation.`、标签 `phase2, lifecycle`，并仅通过正常 `Add` 关联已发布 `MANUS-P2-IDX-WORLD-RENAMED`。界面由 `0/100` 更新至 `1/100`，该 World 移入 `Worlds in this collection` 容器，`Save collection` 呈可用。没有选择或触碰非 P2 World。

**Evidence:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-09-50_7467.webp`; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-10-00_5064.webp`.

## Rename status

在改名 `MANUS-P2-IDX-COLLECTION-RENAMED` 后点击 `Save collection`，按钮显示 `Saving…`；截至 `2026-08-25T15:15:04+08:00` 的复查仍未重定向、未显示成功或错误。因此改名的公开发现 T+0 尚未开始，必须等待稳定详情页或明确错误。

Evidence: `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-14-54_4721.webp`; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-15-04_9892.webp`.

## Cleanup attempt

在中文 public detail 的 `删除合集` 控件上，先后通过元素点击和经 DOM 复核后的精确坐标点击执行了两次删除请求；两次浏览器操作均在 45 秒超时。每次超时后恢复会话并直接重新打开同一 `/zh-cn/collections/manus-p2-idx-collection-gong-kai-9ios` 路由，Collection 仍完整公开可达。因此，不把超时视为删除成功，也不再第三次重复同一操作。Collection 状态标记为 **`CLEANUP_BLOCKED`**；关联的 World 不执行破坏性删除，以避免留下一个未确认删除的 Collection 内的异常引用。

Evidence: click timeout records in session; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-24-52_8129.webp`; `/home/ubuntu/console_outputs/exec_result_2026-08-25_07-25-03_292.txt`; successful re-open textual capture at `2026-08-25T15:25+08:00`.
