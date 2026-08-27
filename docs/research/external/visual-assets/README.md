# AI World Visual Asset Pool — Consolidated Handoff

这是本对话全部 Visual Moodboard、Visual Asset Library 和生产型资产池工作的**统一交付目录**。该目录没有新增研究内容；它只重组、保留并说明先前各轮产生的研究文件、CSV、日志、视觉参考、联系表、脚本和历史版本。

> **最快路径：** 先打开 `01_START_HERE/ACTIVE_PRODUCTION_ASSETS_03.csv`，在其中筛选可实际用于原型、美术与宣传制作的 A 类单件资源。需要完整来源、使用边界和参考记录时，再查看 `01_START_HERE/asset_manifest.csv`。

## 当前资产池状态

| 项目 | 当前数量 | 位置 |
| --- | ---: | --- |
| 结构化资产记录 | **314** | `01_START_HERE/asset_manifest.csv` |
| 活跃 A 类单件生产资产 | **239** | `01_START_HERE/ACTIVE_PRODUCTION_ASSETS_03.csv` |
| 待复核／仅供参考记录 | **75** | `01_START_HERE/MANIFEST_REVIEW_QUEUE_03.csv` |
| 原始／官方预览视觉参考文件 | **300** | `04_VISUAL_REFERENCE_ASSETS/` |
| Contact sheet 与 moodboard 文件 | **19** | `03_CONTACT_SHEETS/` |
| 当前报告、验证、审计与变更文件 | **10** | `02_FINAL_REPORTS_AND_INDEXES/` |

这些数量来自 `01_START_HERE/PRODUCTION_INDEX_03_SUMMARY.json`、`ARCHIVE_INVENTORY.json` 与当前目录的文件盘点。最终生产采用仍以具体单件资源页面、下载包中的 license 文件和项目内部资产账本为准。

## 目录说明

```text
AI_World_Visual_Asset_Pool_Handoff/
├── 01_START_HERE/                    # 当前工作入口：只读这里即可开始选资产
├── 02_FINAL_REPORTS_AND_INDEXES/     # 最新报告、验证、hygiene 审计和变更日志
├── 03_CONTACT_SHEETS/                # 跨轮次 moodboard 与分来源生产资产总览
├── 04_VISUAL_REFERENCE_ASSETS/       # 全部已下载的参考图和官方预览
├── 05_RESEARCH_LOGS_AND_SOURCE_DATA/ # 研究过程与扩容策略
├── 06_REPRODUCIBILITY_SCRIPTS/       # 采集、清洗、验证、索引与 contact sheet 脚本
├── archive/                           # 仍有价值、但已被当前索引或报告替代的内容
├── ARCHIVE_INVENTORY.json             # 本次整理时的机器可读盘点
├── README.md                          # 本文件
└── FINAL_HANDOFF.md                   # 面向最终接手人的交接说明
```

## 从哪里开始

| 目标 | 优先打开的文件 | 后续动作 |
| --- | --- | --- |
| 直接挑选可用于原型的资产 | `01_START_HERE/ACTIVE_PRODUCTION_ASSETS_03.csv` | 通过 `来源链接` 打开单件页，下载原始文件并保存 license 证据。 |
| 查完整的素材池与权利等级 | `01_START_HERE/asset_manifest.csv` | 使用 ID、主题、来源与权利分级筛选；A 类之外不得直接进入下载队列。 |
| 查看仍需处理的旧参考 | `01_START_HERE/MANIFEST_REVIEW_QUEUE_03.csv` | 仅在补齐单件页和权利信息后，再考虑提升至 A 或 L。 |
| 快速浏览新生产资产 | `03_CONTACT_SHEETS/03_current_production_asset_sheets/` | 使用卡片 ID 回到 manifest；预览图不替代源资产。 |
| 了解清理与来源核验过程 | `02_FINAL_REPORTS_AND_INDEXES/EXPANSION_03_生产型资产池与Hygiene报告.md` | 查看验证、降级、替代及生产接入规则。 |

## 权利分级

| 分级 | 含义 | 操作规则 |
| --- | --- | --- |
| **A-可实际使用** | 已记录具体资源页，并具备明确的开放／CC0／可实际使用路径。 | 可以进入下载与原型制作候选；下载时仍要保存单件页、文件版本与 license。 |
| **A-条件可用** | 有具体资源页，但需要逐项确认 credit、机构标识、来源或其他条件。 | 仅在满足该条 `使用边界` 后使用。 |
| **L-可购买／可获取** | 需要购买、获取或确认商业许可的路径。 | 当前旧 L 类平台级条目已降入 M；如未来补到具体商品页，可重新评级。 |
| **C-灵感参考** | 仅适合设计讨论、视觉语言或历史参考。 | 不是可直接下载的产品资产。 |
| **M-待确认／待核验** | URL、单件页、许可证、来源或可访问性不足。 | 不进入生产下载队列。 |

## 视觉文件与 Manifest 的关系

`04_VISUAL_REFERENCE_ASSETS/` 中的图片按照研究轮次保留。`03_CONTACT_SHEETS/` 中的卡片标有资产 ID；该 ID 是回到 `asset_manifest.csv` 的唯一可靠索引。图片本身是**筛选预览**，不能作为最终可授权资产、版权证明或下载替代物。

在实际项目中，建议建立一份项目级资产账本，至少记录：manifest ID、单件 URL、下载日期、源文件版本、license 文件、作者／credit、改动内容与最终使用场景。

## Archive 策略

没有随意删除旧资料。`archive/` 保存仍有价值但被新版替代、只用于诊断、或不应占据当前工作入口的内容：

| Archive 子目录 | 保留内容 | 为什么归档 |
| --- | --- | --- |
| `01_HISTORICAL_REPORTS/` | 原始 moodboard、Expansion 01／02 报告和旧版摘要 | 内容仍可回溯，但当前生产入口以 Expansion 03 为准。 |
| `02_STAGING_SOURCE_SNAPSHOTS/` | 原始候选 CSV、API 快照、下载日志和预览缓存 | 保留可复现性与来源线索，不作为直接工作区。 |
| `03_DIAGNOSTIC_AND_SUPERSEDED_SCRIPTS/` | 调试、一次性检查和整理脚本 | 保留维护历史，避免与当前工作脚本混杂。 |
| `04_PREVIOUS_DELIVERY_ZIPS/` | 此前每一轮的对外交付 ZIP 快照 | 保留历史交付版本，但只应下载当前 consolidated ZIP。 |

## 复现与维护

`06_REPRODUCIBILITY_SCRIPTS/` 中的脚本是生成当前成果时使用的工具性记录。它们依赖当时的站点、目录结构与网络响应；如需重新运行，请先复制当前 handoff 目录，在副本中工作，并把新的输出与当前 manifest 区分开来。不要直接把脚本的运行结果视为新许可结论；任何新资产仍应经过具体单件页和 license 复核。

有关来源、授权边界、NASA／平台使用条件和本轮清理判断，请以 `02_FINAL_REPORTS_AND_INDEXES/EXPANSION_03_生产型资产池与Hygiene报告.md` 中的来源说明和当前 manifest 的 `使用边界` 列为准。
