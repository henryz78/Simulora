# Immersion Asset Library — Research Handoff

本目录是本对话历轮研究与网页制作成果的统一交付归档。它把当前可继续使用的资产库、早期理论与资产版本、网页源文件、日志、浏览证据和生成视觉素材放在同一个结构中；重复或被新版替代的文件没有删除，而是放进 `archive/`，以便追溯版本演进。

## 推荐阅读顺序

| 顺序 | 文件或目录 | 用途 |
|---|---|---|
| 1 | `FINAL_HANDOFF.md` | 本次交接说明、范围、限制和版本判断 |
| 2 | `current/reports/Immersion-Asset-Library-Rare-Scenarios.md` | 当前最适合开发检索的交付文档，聚焦真实 Demo、工具、源码与许可 |
| 3 | `current/research/asset-library-current.md` | 当前资产库主文档，含此前条目与本轮扩充内容 |
| 4 | `current/research/research-notes-current.md` | 研究过程中的来源核验和浏览记录摘要 |
| 5 | `webapp/` | Immersion Asset Library 静态网页源文件，可继续开发 |
| 6 | `evidence/source-extracts/` 与 `evidence/screenshots/` | 从公开页面保存的文字提取和浏览截图证据 |
| 7 | `assets/` | 研究网页使用的生成视觉素材 |
| 8 | `archive/` | 早期理论版、旧版资产库和被新版替代的交付快照 |

## 目录说明

`current/` 保存当前有效资料。`current/research/` 是可继续编辑的研究底稿，`current/reports/` 是面向使用者的交付型文档。

`webapp/` 保存网页源文件，但刻意排除了 `node_modules/`、`dist/` 和 `.git/`，避免把依赖、构建产物和版本控制内部文件混入交付包。重新运行项目时，可在该目录执行 `pnpm install`，再执行 `pnpm dev` 或 `pnpm build`。

`logs/` 保存项目开发日志。`evidence/` 保存此前联网研究过程中产生的页面文字提取和截图，帮助未来重新核对来源。`assets/` 保存网页生成的 hero、地图、环境和品牌标记图像。

`archive/` 不代表“错误文件”，而是历史版本。当前研究应优先以 `current/` 为准；如果需要比较理论库、第一版资产库和后续稀缺场景扩充，可回看 `archive/reports/`。

## 数据文件说明

本对话此前没有生成 CSV 或 XLSX 数据表，相关情况已记录在 `data/CSV-STATUS.txt`。资产数据主要以内嵌 TypeScript 条目和 Markdown 表格形式保存，网页源文件位于 `webapp/client/src/pages/Home.tsx`。

## 许可说明

本包中的来源链接、截图和页面提取仅用于研究索引与复核。工具、代码库、地图底图、音频、模型、字体、截图和 Demo 内嵌素材的许可彼此独立。正式商业使用前，应打开原始许可页，保存具体版本、作者、下载时间、订单或项目注册凭证；不要因为某个工具是开源的，就默认其 Demo 素材、地图数据或外部媒体也可以商用。

## 压缩包范围

该目录中的全部文件会被打包为唯一 ZIP 交付物。原始项目目录和 `/home/ubuntu/webdev-static-assets/` 中的文件未被删除；本目录是复制后的独立交接包。
