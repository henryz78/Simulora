# MANUS-P2 Cleanup Manifest

> **执行边界。** 仅处理由本阶段创建且命名以 `MANUS-P2-*` 开头的对象。绝不修改 `EXT-*` 或其他用户数据。对于 UI 删除动作超时、无可达删除入口、或会破坏仍未清理关联对象的情况，使用 `CLEANUP_BLOCKED`，不将其误报为已删除。

| Asset | Type | Canonical observed route / identifier | Cleanup status | Evidence / reason |
|---|---|---|---|---|
| `MANUS-P2-IDX-COLLECTION-RENAMED` | Public Collection | `/zh-cn/collections/manus-p2-idx-collection-gong-kai-9ios` | `CLEANUP_BLOCKED` | Delete collection control was attempted twice; both browser actions timed out. Subsequent direct reopen confirmed the Collection remained publicly accessible. Further repeats stopped per error limit. |
| `MANUS-P2-IDX-WORLD-RENAMED` | Public World | `/zh-cn/worlds/manus-p2-creator-world-shi-jie-5pfy` | `CLEANUP_BLOCKED` | The World is the only member of the Collection whose deletion is blocked; it is retained to avoid a potentially inconsistent dangling association. |
| `MANUS-P2-IDX-CHAR-RENAMED` | Public Character | Owner Profile card/modal (no canonical direct route exposed) | `CLEANUP_BLOCKED` | Character deletion was deferred after Collection/App delete controls showed non-completing behavior; no safe completed delete feedback was available in the remaining browser state. |
| `MANUS-P2-CREATOR-APP-PUB` | Public App | `/zh-cn/apps/manus-p2-creator-app-pub` | `CLEANUP_BLOCKED` | Normal Delete control was clicked once; after stable recheck the detail remained visible and no confirmation/success/error modal appeared. |
| `MANUS-P2-CREATOR-APP-世界` | Non-public saved draft App | Owner Profile card; generic `/apps/create` did not re-open it | `CLEANUP_BLOCKED` | Owner Profile shows the draft App, but generic create route did not restore its slug-specific editor/cleanup route. It is not public and no direct safe delete path was observed. |

## Reconciliation note

All currently known `MANUS-P2-*` assets have an explicit terminal manifest state. No asset is labelled `CLEANED` without a visible confirmed removal. The browser remains in the Chinese locale, evidenced by the Chinese global navigation and `中文` language control on the latest App detail screenshot.
