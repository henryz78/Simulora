# Expansion 02：生产型 Visual Asset Pool

**清单规模：** 从 87 条扩展至 **200 条**。  
**本轮新增：** **113 个带具体资源页的候选**，其中 93 条为明确 CC0／可实际用于商业原型的资源，20 条为带具体 NASA SVS 页面与 credit 记录的条件使用资源。  
**浏览入口：** `production_asset_sheets/` 内的 7 页分类 contact sheet。  
**数据准据：** `asset_manifest.csv` 与 `EXPANSION_02_新增单件资产记录.csv`。

本轮的核心变化不是增加情绪参考，而是补入可直接进入原型、Demo 与 3D 美术生产流程的**单件资源页**。新增内容来自 Poly Haven、Kenney、Quaternius 与 NASA Scientific Visualization Studio；每项都附有具体链接而不是仅记录平台首页。

## 新增资产概览

| 来源 | 新增数量 | 资源类别 | 权利分级 | 生产用途 |
| --- | ---: | --- | --- | --- |
| Poly Haven | 30 | 12 HDRI、10 PBR 材质、8 个 3D 城市道具／立面 | A | 真实环境光照、天气／时间、地形材质、现代城市与室内外场景。 |
| Kenney | 33 | 3D 城市、建筑、自然、地牢、交通、生物；2D 角色、地图、UI、纹理 | A | 快速原型、世界画布、居民与生物、地点探索、低成本 Demo。 |
| Quaternius | 30 | 城市、角色／动画、生物、奇幻、科幻、交通、家具和建筑包 | A | 3D 角色行为、城镇文明、科幻／奇幻地点、可探索场景。 |
| NASA SVS | 20 | 夜光、气候、冰海、海温、生物圈、飓风、火灾、极光和星球数据可视化 | A（条件） | 动态世界状态、天气、生态、文明数据层、科学地图与宣传视觉。 |

| 权利层级（更新后） | 条目数 | 使用判断 |
| --- | ---: | --- |
| **A — 实际使用／条件使用** | 156 | 125 条具备明确实际使用路径，31 条为条件使用；本轮新增的 113 条均已定位至具体资源页。 |
| **L — 可购买／可获取授权** | 8 | 保留既有 Envato、Adobe Stock、Fab／Unreal 等生产级采购路径。 |
| **C／M — 仅参考或待确认** | 23 | 不自动进入下载队列；只用于讨论、对比或进一步权利核验。 |

> **下载时的基本规则：** contact sheet 中的预览图只服务于选型；实际采用必须从 `asset_manifest.csv` 的具体来源链接下载原件，并归档 URL、下载日期、license／credit、版本及修改说明。

## 可直接行动的资产批次

### 1. Poly Haven：真实世界渲染基底

PH01–PH12 提供雪湖、湖畔、桥夜、晨曦、河岸、上海外滩、城市屋顶和乡野等环境 HDRI；PH13–PH22 形成岩石、砂岩、草石、混凝土与烧蚀地面等 PBR 地表池；PH23–PH30 补充路灯、街座、户外桌椅、城市立面、卷帘窗、工厂立面、安防灯与网格围栏。其官方资产为 CC0，适合作为**世界场景光照、地形表面与现代地点**的第一优先级资源。[1] [2]

> 若未来产品直接调用 Poly Haven 的在线 API，应展示来源归属并使用唯一 User-Agent；这属于 API 服务条款，而非已下载 CC0 资产本身的额外版权义务。[1]

### 2. Kenney：最短的可玩原型路径

K01–K18 覆盖道路、商业和工业城市、建筑、森林、洞穴、工厂、车辆、宠物、地牢、海盗、太空、墓园和奇幻村镇；K19–K33 补足二维居民、微型城镇、地图、UI 与纹理。Kenney 官方说明其资产页游戏资源为 CC0，可用于商业项目且不强制署名，因此该批次特别适合在不等待定制美术前，直接验证**居民密度、城镇扩张、地点切换、地图状态与轻量世界循环**。[3]

### 3. Quaternius：3D 居民、文明与动画扩容

Q01–Q30 收录飞船、奇幻道具、农场动物和建筑、赛博朋克、地牢、模块化奇幻服装、通用人形动画、外星人、恐龙、鱼、机甲、怪物、机器人、交通、家具、街道与建筑包。单个包页可显示格式与许可证；例如 Downtown City MegaKit 列有 315 个模块化模型和 FBX／Blend／glTF 格式，并表述 CC0 商业使用路径。[4] 该批次可以支持从**小型社区到大型文明**的角色与地点原型，也可用于生物／职业状态变化的可视化测试。

### 4. NASA SVS：动态世界状态与科学视觉语言

N01–N20 的具体资源页提供气候、海温、生物圈、飓风、冰海、野火、夜间地球、极光和行星模型。SVS 官方 API 可访问搜索结果、具体页面、主图与 credit 元数据，适合建立可追溯的科学状态视觉库。[5] 这些条目均标为 **A-条件可用**：使用时应检查具体页面 credit，避免使用 NASA 名称或标识暗示对产品、模型输出或服务的背书，并遵守 NASA 媒体使用准则。[6]

## 分类 contact sheet 索引

| 文件 | 范围 | 适合快速筛选的生产任务 |
| --- | --- | --- |
| `ph_production_assets_01.jpg` | PH01–PH20 | 环境 HDRI、天光、天气、自然与城市 PBR 材质。 |
| `ph_production_assets_02.jpg` | PH21–PH30 | 剩余地面材质与现代城市模块／道具。 |
| `k_production_assets_01.jpg` | K01–K20 | 城市、村庄、自然、地牢、车辆、生物与二维原型。 |
| `k_production_assets_02.jpg` | K21–K33 | 2D 工业／食物／小镇、minimap、UI 和纹理包。 |
| `q_production_assets_01.jpg` | Q01–Q20 | 飞船、角色服装、动画、生物、赛博与奇幻包。 |
| `q_production_assets_02.jpg` | Q21–Q30 | 鱼、怪物、家具、建筑、街道、列车与交通。 |
| `n_production_assets_01.jpg` | N01–N20 | 天气、海洋、冰冻圈、野火、夜光与动态世界状态。 |

## 生产接入建议

| 任务 | 最先从哪些编号开始 | 原因 |
| --- | --- | --- |
| 3D 世界 Demo | PH01–PH12 + PH13–PH22 + K01–K18 + Q20–Q30 | 同时拥有环境光、表面、道路、建筑、交通与地点道具。 |
| 小社区／居民行为 | K13、K18、K19、Q09、Q12、Q13、Q30 | 包含可读角色、生物、村镇、服装模块与统一人形动画。 |
| 奇幻世界模板 | K07–K09、K14–K18、Q03–Q04、Q08–Q11、Q25 | 地牢、洞穴、墓园、海盗、村镇、道具、自然纹理和模块建筑齐备。 |
| 科幻文明模板 | K16、K20、Q01–Q02、Q07、Q14、Q17、Q19 | 太空、飞船、赛博、外星人、机甲、机器人和科幻界面资源可互补。 |
| 世界状态动态展示 | N02、N04–N09、N12–N20 | 包含夜光、冰海、海温、生物圈、飓风、野火、极光与地球系统视图。 |
| 现代城市宣传页 | PH06、PH08–PH09、PH23–PH30、K01–K06、Q20–Q29 | 同时具备写实 HDRI、材质、路灯／立面与风格化模块城市场景。 |

## 参考资料

[1]: https://polyhaven.com/our-api "Poly Haven API — 官方资产目录与 API 使用说明"
[2]: https://polyhaven.com/license "Poly Haven License — CC0 Assets"
[3]: https://kenney.nl/support "Kenney Support — CC0 Game Assets"
[4]: https://quaternius.com/packs/downtowncitymegakit.html "Quaternius Downtown City MegaKit — CC0, Formats and Download Options"
[5]: https://svs.gsfc.nasa.gov/help/ "NASA SVS Help — Search and Page APIs"
[6]: https://www.nasa.gov/nasa-brand-center/images-and-media/ "NASA Brand Center — Images and Media Usage"
