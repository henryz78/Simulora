# MANUS-P2 Creator Field, Validation and Recovery Matrix

> 本矩阵只汇总第二阶段的免费、正常 UI 黑盒观察。每行均应与逐字段 CSV、Creator inventory 和截图相互参照。`UNKNOWN`、`NOT_PERSISTED` 与 `CREATOR_ENTRY_NOT_EXPOSED_IN_FREE_UI` 均为结果，不作机制推断。

| Creator | Core valid / invalid or boundary evidence | Pristine / main-button evidence | Save / publish / preview path | Reload / direct reopen result | Overall status |
|---|---|---|---|---|---|
| World | 空白 Name 规范化为无有效值；有效带中文 Name、emoji Tagline、多行 Unicode Introduction、1×1 PNG cover 通过。错误 MIME `.txt` 无明确接收/拒绝反馈，记 `UNKNOWN`。 | Pristine `Create world` disabled；有效 Name + cover enabled。发布 modal 的 Changelog 为必填门控。 | `Saving draft…`→`Draft saved`; Live preview controls; v2 公布、v3 改名发布。 | Direct reopen of edit route showed `Draft restored`; Name/cover/tagline/introduction preserved. Public direct route and version history persisted. | `PERSISTED` |
| Character | Profile 纯空白保持无效；有效 Name 与多行中文/英文/emoji Profile enabled creation. Public intro valid update persisted. | Create is disabled for missing required Profile; enabled after valid Name/Profile. | Create produces public card/details; explicit `Save character` closes form and updates card; detail modal is preview. | Directory-card → detail → Edit restored Name/Profile/Public intro. No canonical direct Character detail route exposed by normal UI. | `PERSISTED` (in-app reopen) |
| App | Pristine HTML textarea has no maxlength and Save/Publish appear enabled; unsubmitted unnamed state was not saved to avoid non-P2 asset. Valid manually authored static HTML + MANUS-P2 slug/name/details/instructions used; no AI prompt submitted. | Valid draft showed `Draft saved`; Publish created a public detail route. | HTML / Configure / Preview / Save draft / Publish used without Credits. | Generic `/apps/create` did **not** restore an unpublished draft; published slug-specific `/apps/create?slug=...` restored HTML/config and preview. | Draft generic-reopen `NOT_PERSISTED`; published slug-route `PERSISTED` |
| Map | Maps Directory and Mine view showed consumer flows (`Use map`) and `No maps yet`. No normal Map Creator/Create map/editor was exposed; global Create menu listed only World, Character, App. | Not applicable: no accessible free Creator entry. | Not applicable. | Not applicable. | `CREATOR_ENTRY_NOT_EXPOSED_IN_FREE_UI`, not `MEMBERSHIP_BLOCKED` because no actual paywall was shown. |

## Important implementation observations

The World Creator is the only observed Creator with explicit automatic draft-state feedback. Character uses explicit save rather than an observed autosave indicator. App has two materially different recovery paths: the generic blank Creator route does not serve as an observed draft restore endpoint, whereas the published slug-specific editor route does. The Map component was only visible as an existing-map consumption surface; no creator mechanism can be generalized from that absence.

## Evidence index

| Artifact | Role |
|---|---|
| `MANUS_P2_CREATOR_FIELD_RESULTS.csv` | Row-level precondition, action, feedback, persistence and confidence records. |
| `world_creator_inventory.md` | World controls, file tests, draft/reopen findings. |
| `character_creator_inventory.md` | Character controls and explicit save/reopen findings. |
| `app_creator_inventory.md` | No-Credits static HTML flow, draft vs published recovery. |
| `map_creator_inventory.md` | Normal UI availability boundary. |
| Screenshot folders and console outputs referenced in those files | Visual / DOM attribute evidence. |
