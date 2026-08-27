# Expansion 03：生产型 Visual Asset Pool 与 Manifest Hygiene 报告

**资产池规模：** 从 200 条扩展至 **314 条结构化记录**。  
**本轮新增：** **114 个已经验证为具体单件页面的生产资产**。  
**可直接进入生产选择流程：** **239 条 A 类单件资产**，其中 214 条为实际使用路径，25 条为需按具体 credit 使用的条件路径；**0 条** A 类资源只指向平台主页。  
**待复核／只供参考：** 75 条，已从生产下载队列中分离。

本轮遵循“**单件资源页优先、不能证明则降级**”的标准。它不重复视觉理论，而是将资产池推进为可执行的资源库：可先在 `ACTIVE_PRODUCTION_ASSETS_03.csv` 中筛选，再回到 `asset_manifest.csv` 中的单件 URL 下载并归档证据。

## 1. 本轮新增的实际生产资产

| 来源 | 新增数量 | 验证方式 | 主要补足方向 | 权利分级 |
| --- | ---: | --- | --- | --- |
| Kenney | 41 | 新增单件页中出现 `Creative Commons CC0`；抽检 Furniture Kit 与 Particle Pack 的文件数、类别和下载入口。 | 2D／3D NPC、室内家具、食物、商店、社区、列车、交通、地图图标、HUD、光标和 VFX。 | A-可实际使用 |
| Quaternius | 36 | 对全部单件 pack 页验证 CC0 表述和官方页面标题；抽检 Ultimate House Interior 的格式及模型数。 | 角色、角色动画、生物、科幻／奇幻地点、餐厅、家庭室内、交通、自然、农作物与遗迹。 | A-可实际使用 |
| Poly Haven | 37 | 通过官方 API 资产目录验证 asset ID；抽检 School Desk 01 的 CC0、下载、作者、类别与模型信息。 | 夜景 HDRI、城市环境光、地板／墙面 PBR、沙发、柜体、桌椅、灯具、街道道具与学校空间。 | A-可实际使用 |

| 重点生产缺口 | 新增代表编号 | 可直接用于的任务 |
| --- | --- | --- |
| 角色／NPC 与动作 | KX01–KX04、KX27、KX32、QX01、QX09、QX11、QX18、QX30 | 居民职业、角色变体、动作状态、社区密度与交互 demo。 |
| 室内／家具／生活场景 | KX06–KX08、PX16–PX23、PX25–PX37、QX08、QX14、QX26–QX29 | 家庭、餐厅、商店、医院、学校、办公室和公共空间原型。 |
| 城市／公共交通／社区 | KX05、KX12–KX14、KX23–KX25、QX02、QX04–QX05、QX20 | 城市扩张、道路与列车、港口、社区日常与大型文明。 |
| 地图／HUD／图标 | KX17–KX22 | 世界地图符号、minimap、状态图标、HUD、光标和界面交互。 |
| VFX／动态背景 | KV01–KV05、PX01–PX07 | 天气、烟雾、事件反馈、夜景、环境光照与宣传镜头。 |
| 科幻／奇幻／生态地点 | KX10–KX11、KX28、QX06–QX07、QX16、QX19、QX23、QX25、QX31–QX36 | 太空站、文明设施、奇幻遗迹、生物区、农作物、森林与地形。 |

## 2. Manifest Hygiene：从“候选参考”到“可审计生产库”

第一轮审计发现旧清单中包含 **56 条平台根目录 URL、3 条缺失 URL、17 组共享 URL**，并有若干曾被标为 A／L 的记录只保留搜索目录、馆藏集合页或平台首页。根目录并不能证明某个预览对应了可下载的单件资源，因此不能支撑 A 或 L 等级。

本轮对旧记录采取保守修复：补入已验证的官方单件页面；将被新单件记录替代的旧条目改作 C 参考；将无法固定到具体对象页、集合页或采购商品页的 A／L 记录降为 M。变更日志完整保存在 `MANIFEST_HYGIENE_CHANGES_03.csv`。

| Hygiene 指标 | 清理前 | 清理后／当前处理 |
| --- | ---: | --- |
| Manifest 行数 | 200 | 314 |
| 有效单件 A 类生产资产 | 125 | **239** |
| A／L 记录仍指向根目录 | 56 个根目录问题中含多个 A／L 误标 | **0** |
| 修复／降级过的旧记录 | — | 60 条记录、135 个字段变更 |
| 留在待复核或仅参考队列 | — | 75 条 C／M 记录 |
| 新增资产的单件页验证 | — | **114／114 通过** |

> HTTP 403、401 或平台防自动化响应不会被自动解释成“素材可用”或“素材失效”。本库将其视作待人工复核信号；只有单件 URL、许可证据和下载包中的 license 能构成最终生产采用记录。

## 3. 直接使用入口

| 文件 | 用途 |
| --- | --- |
| `ACTIVE_PRODUCTION_ASSETS_03.csv` | **首选工作表。** 只含 239 条 A 类、非根目录、可回到具体页面的资产。 |
| `asset_manifest.csv` | 完整 314 条库，包含 A／C／M 权利状态、用途和使用边界。 |
| `MANIFEST_REVIEW_QUEUE_03.csv` | 75 条不应直接下载的 C／M 条目；可在补到单件页后重新评估。 |
| `EXPANSION_03_新增单件资产记录.csv` | 本轮新增的 114 个已验证资产。 |
| `EXPANSION_03_ASSET_VALIDATION.csv` | 114 条新增资源的验证记录。 |
| `MANIFEST_HYGIENE_AUDIT_03.csv` | 当前结构性风险审计；保留非生产 C／M 条目的根目录／失效线索。 |
| `MANIFEST_HYGIENE_CHANGES_03.csv` | 旧清单的 URL、权利等级与重复条目处置历史。 |

## 4. 分类 Contact Sheets

每个卡片都印有 manifest ID；预览仅用于选择，**不能代替原始资产、许可证或采购文件**。最终下载时应使用 manifest 中的单件 URL。

| 文件 | 覆盖范围 | 适合快速挑选 |
| --- | --- | --- |
| `production_asset_sheets_03/px_assets_01.jpg` | PX01–PX20 | 夜景 HDRI、环境光、PBR 表面、家具与室内道具。 |
| `production_asset_sheets_03/px_assets_02.jpg` | PX21–PX37 | 柜体、桌椅、灯具、街道道具、学校家具和植被。 |
| `production_asset_sheets_03/kxkv_assets_01.jpg` | KX01–KX20 | NPC、社区、家具、商店、空间站、载具、地图和 UI。 |
| `production_asset_sheets_03/kxkv_assets_02.jpg` | KX21–KX36 | 剩余 2D 世界、角色、交通、建筑、道具和纹理资源。 |
| `production_asset_sheets_03/kxkv_assets_03.jpg` | KV01–KV05 | 粒子、烟雾、光罩、植被精灵等世界事件 VFX。 |
| `production_asset_sheets_03/qx_assets_01.jpg` | QX 的前 20 个可用官方预览 | 角色、室内、奇幻／科幻地点、城市与社区资产。 |
| `production_asset_sheets_03/qx_assets_02.jpg` | QX 的后续可用官方预览 | 自然、农作物、家具、遗迹、生物与空间资产。 |

## 5. 推荐的实际接入流程

| 步骤 | 做法 | 产出 |
| --- | --- | --- |
| 1. 筛选 | 在 `ACTIVE_PRODUCTION_ASSETS_03.csv` 按主题、用途、前缀或来源筛选。 | 一份小型候选下载清单。 |
| 2. 核验 | 打开 manifest 内的单件 URL；再次确认页面 license、文件格式、版本和需要的信用说明。 | 采用决定与许可证据截图／文本。 |
| 3. 下载与归档 | 下载原始文件；保存资产 ID、URL、下载日期、版本、license 文件及对资产的修改记录。 | 可复现的项目资产账本。 |
| 4. 集成 | 优先使用 KX／QX 做快速可玩原型，PX 做环境光／写实材质，KV 做动态事件提示。 | 原型／Demo／宣传镜头的可追溯资产组合。 |
| 5. 复核队列 | 只有在 `MANIFEST_REVIEW_QUEUE_03.csv` 的条目补齐具体资源页后，才将其提升至 A 或 L。 | 资产库持续维持权利完整性。 |

## 参考资料

[1]: https://kenney.nl/support "Kenney Support — CC0 Asset Terms"
[2]: https://kenney.nl/assets/furniture-kit "Kenney Furniture Kit — 3D, 140 Files, Creative Commons CC0"
[3]: https://kenney.nl/assets/particle-pack "Kenney Particle Pack — 2D VFX, 80 Files, Creative Commons CC0"
[4]: https://quaternius.com/packs/ultimatehomeinterior.html "Quaternius Ultimate House Interior Pack — CC0 and Formats"
[5]: https://polyhaven.com/license "Poly Haven License — CC0"
[6]: https://polyhaven.com/a/SchoolDesk_01 "Poly Haven School Desk 01 — CC0 Model"
[7]: https://svs.gsfc.nasa.gov/help/ "NASA SVS Help — Resource and Credit Metadata"
[8]: https://www.nasa.gov/nasa-brand-center/images-and-media/ "NASA Brand Center — Images and Media Usage"
