# App Creator Control Inventory

**Creator route:** `https://worldos.cc/apps/create`  
**Identity:** Owner `idakellams159`  
**Observed at:** browser filenames `2026-08-25_07-03-05` / `07-03-15` (UTC-style); Shanghai-equivalent times are `2026-08-25T15:03:05+08:00` / `15:03:15+08:00`.

## Scope-preserving route choice

The App Studio explicitly offers AI generation through a natural-language prompt, but the task prohibits bulk/paid AI creation. The test therefore selected the normal **`Write HTML yourself`** route and will paste only minimal static HTML. No prompt was submitted, no AI generation was invoked, and no Credits were consumed.

## Visible initial controls

| Area | Controls / initial state |
|---|---|
| Navigation | `App Market` breadcrumb; `App Studio` |
| AI prompt surface | Description textarea with placeholder `Describe the app you want, or ask for changes…`; deliberately unused |
| Studio actions | Tutorial, Reset preview, HTML, Configure, Save draft, Publish |
| Code route | `Write HTML yourself` changes the right pane to a source textarea with placeholder `<div>…</div>`; `Copy AI prompt` remains visible but unused |
| Preview | Initial card title `Untitled app`; preview says `No app yet — describe what you want in the chat on the left.` |
| Test input | Bottom preview-test input disabled/empty in the unbuilt app state |

**Initial evidence:** `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-03-05_5808.webp`; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-03-15_1932.webp`.


## Configure panel inventory

在空白 App Studio 的 `Configure` 中，观察到以下可见字段：`App id (slug)` 默认 `my-cool-app`、Name、Icon（emoji）、Title bar color（color picker 与 hex 文本）、Tagline、最多 3 个 Tags、App Market details、Release notes、Built-in instructions for AI、Initial data (JSON)、App integrations (JSON)、Refresh 开关及 custom refresh prompt、Events copy 模板字段。此盘点不触发 AI 生成、安装、刷新或任何付费动作。

`Save draft` 与 `Publish` 在未配置/无 HTML 的 pristine Studio 中都呈现为 enabled。为确保**不创建未命名的非 MANUS-P2 资产**，不在这一未命名状态提交保存；后续先以最小静态 HTML 与 MANUS-P2 名称/slug 形成合规测试对象。

**Evidence:** `/home/ubuntu/console_outputs/exec_result_2026-08-25_07-03-45_782.txt`; `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-03-55_3043.webp`.


## Separate public-lifecycle object

由于第一份有效草稿在通用 `/apps/create` 直开时未恢复，后续发布生命周期使用另一个唯一的合规对象，拟用 slug `manus-p2-creator-app-pub` 与名称 `MANUS-P2-CREATOR-APP-PUB`。该分离避免把“草稿恢复边界”与“公开发布/清理”混为一项，也确保不会对任何非 `MANUS-P2-*` App 进行编辑或发布。

