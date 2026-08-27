import csv
import json
from pathlib import Path

ROOT = Path('/home/ubuntu/world_character_library')
OUT = ROOT / 'deliverables' / 'world-character-visual-handoff-pre-final'
CURRENT_JSON = ROOT / 'deliverables' / 'world_character_library_data_v0.5.1_visual_update.json'

with CURRENT_JSON.open('r', encoding='utf-8') as f:
    data = json.load(f)

worlds = {row[0]: {'name': row[1], 'genre': row[3], 'hook': row[4], 'locations': row[6], 'factions': row[7], 'conflicts': row[8]} for row in data['original_worlds']}
assets = {row[0]: row for row in data['visual_assets']}

# These are condensed execution briefs transcribed from the frozen v0.3/v0.4/v0.5 visual indexes
# and the successful v0.5.1 production run. They describe assets; they do not add world content.
BRIEFS = {
'VQ-17': ('桥下周六市集 — World key art', '叶雁与唐岚所在的桥下周六市集；摊位、公共厨房、货运单车、桥墩菜园与改造围挡。', '雨后清晨的密集城市桥下；公共厨房蒸气、暖色摊灯与混凝土桥墩。', '横向 16:9 眼平视角，以桥的拱形和摊位动线制造纵深；至少两个可行动地点可见。', '温暖、务实、社区感；高质量原创环境概念艺术，暖琥珀对潮湿蓝灰。', '不得出现真实城市地标、公司 logo、可读文字、第三方角色或商业 IP；不要把小商贩浪漫化为单一职业标签。', '保留雨天动线、市集/仓库/菜园/施工区的空间关系；已有图为世界主视觉，不要重做。'),
'VQ-18': ('晴川划船联赛 — World key art', '顾冬、魏春、崔野所代表的混龄划艇队、职业队、河道环保团与公众河岸。', '清晨修复中的城市运河，船坞、裁判塔、观赛堤与水质检测点。', '低机位贴近水面，划艇斜向穿过画面；城市河岸与船坞形成深景。', '克制、协作、具有公共空间能量；原创运动环境概念艺术。', '不得使用真实赛事配色、队标、运动联盟符号、可读文字或第三方体育 IP。', '混龄队的协作和河道修复必须同框；已有图为世界主视觉，不要重做。'),
'VQ-19': ('双层舞台 — World key art', '周萤、顾循与台上表演者、替补、编剧、维修人员。', '沉浸式剧场的金色主舞台、地下实时编剧室、维修间和替补走廊。', '横向 16:9 建筑剖面，舞台上方和后台下方同等可见，清晰纵向劳动关系。', '上层温金、下层冷蓝；原创高信息密度剧场概念艺术。', '不得用真实剧目、海报、logo、可读剧名或第三方演艺 IP；后台劳动不可被隐形化。', '保留观众入口、回声厅、替补走廊与维修间动线；已有图为世界主视觉，不要重做。'),
'VQ-20': ('零号楼 365 — World key art', '沈旎、谢承、牧一与各楼层住户。', '84 层公共住宅塔内的共厨、夜班托育、屋顶议会、农园和电梯机房。', '横向 16:9 的垂直建筑剖面；35 层、71 层、屋顶与无障碍路径可读。', '暮色、有人情味的城市主义；原创建筑叙事概念艺术。', '不得出现真实住宅项目、logo、监控恐怖化、偷窥视角或可读文字。', '突出参与式治理和时间贫困，而非单纯科幻高楼；已有图为世界主视觉，不要重做。'),
'VQ-21': ('琥珀共和国建国第三年 — World key art', '贺澜、阿未、闻拓及普通旁听者、代表、复员者与粮道劳动者。', '冬日制宪大厅、粮道、复员营地、流动议场和重建城市。', '横向 16:9 建立镜头；大厅入口与街道广播、粮车和普通人共同构图。', '冬日琥珀光、重建而非战争；原创历史幻想环境概念艺术。', '不得使用真实国家旗帜、政党标识、历史人物、军事宣传构图或第三方历史/奇幻 IP。', '制宪必须是多方进入公共空间的协商，不可塑造单一救世主；已有图为世界主视觉，不要重做。'),
'VQ-22': ('桦树街 77 号 — World key art', '林栩、郝琴、共居家人和租客。', '老宅中的共用厨房、阁楼工作室、半扇门小店、梨树、漏水屋顶与租客空间。', '横向 16:9 居住剖面；雨雪或维修压力连接不同楼层和代际空间。', '温暖但不甜腻、幽默且务实；原创住宅叙事概念艺术。', '不得出现真实地址、品牌、可读文字；不可把老人、照护或家庭冲突符号化。', '保留居住权、安静时间、照护路线与维修风险；实际文件为 key art，不应按旧地图计划重做。'),
'VQ-23': ('赤道测绘社 — World key art', '季衡、利娜、阿度和合作测绘队。', '云雾高原、移动气象站、临时营地、多语市集、盐湖与石林。', '横向 16:9 高原远景；队伍停下让向导修正地图，地形与合作绘图同框。', '潮湿、富地质层次、科学合作；原创环境概念艺术。', '不得使用殖民探险视觉、真实地标、矿企 logo、可读地图文字或第三方冒险 IP。', '知识公开需由同意决定；实际文件为 key art，不应按旧地图计划重做。'),
'VQ-24': ('石眠者的城市 — World key art', '玄砾、岩母、梅芙与醒者/静眠者社会。', '硅基峡谷城市、共振广场、静眠庭、晶簇工坊、峡桥和人类临时站。', '横向 16:9 晨光峡谷；醒者很小，静眠庭形成长时间尺度；即时与延时区域并置。', '晶体、岩层与自然地质感；原创科幻环境概念艺术。', '不得模仿既有外星人 IP、拟人化外星种族、殖民叙事、logo 或可读文字。', '非人社会必须具法律和时间意义，不可只作奇观；已有图为世界主视觉，不要重做。'),
'VQ-25': ('小行星拾荒舰队 — World key art', '岑禾、景洛、楚弥、无人机工作伙伴与维修舰群。', '小型维修舰、旧医院船、碎石修理场、自由港与家属通信舱。', '横向 16:9 外景；拖曳器缓慢接近医院船，通信与维修臂提供方向线。', '安静、务实的硬科幻劳动感；原创太空环境概念艺术。', '不得出现战斗、爆炸、军舰、真实医疗标志、经典太空 IP 元素或 logo。', '救援伦理、船员劳动与家属通信优先于动作场景；已有图为世界主视觉，不要重做。'),
'VQ-26': ('五条世界线的合租合同 — World key art', '祁雨、祁临、洛曼及五位住户版本。', '5B 公寓、五扇相似却不同的门、洗衣房、同名咖啡店和跨线物业柜台。', '横向 16:9 室内走廊；五道门以不同环境光建立纵深，日常物品构成多世界物流。', '温馨、轻微荒诞、日常魔幻；原创现代概念艺术。', '不得做恐怖多元宇宙、超级英雄宇宙、UI 叠层、可读账单或第三方多世界 IP。', '强调协商、债务和共同生活，不是宇宙冒险；已有图为世界主视觉，不要重做。'),
'VQ-27': ('交班病房 — World key art', '楼谧、邹乐、护士、家属、社工与患者。', '清晨病房、护士站、检验走廊、家属小厨房、社工转介室和屋顶花园。', '横向 16:9 长廊串联四个照护空间，夜班与白班的交班关系可读。', '克制、安静、连续照护；原创现实主义医疗环境概念艺术。', '不得有病痛奇观、夸张监护仪恐怖感、医疗品牌、可读病历或医疗剧 IP。', '护理动线按时间组织，不以权力高低组织；已有图为世界主视觉，不要重做。'),
'VQ-28': ('第九码头酒店 — World key art', '方棠、孟潺、旅客、长住客、员工和临时安置家庭。', '海港旧酒店的风暴大堂、后厨、洗衣房、员工宿舍、失物柜和码头露台。', '横向 16:9 酒店剖面；公共大堂、热台与后勤空间同时可见。', '旧建筑质感、风暴中的温暖服务；原创环境概念艺术。', '不得出现真实酒店品牌、奢侈旅游广告、可读标识或第三方影视酒店场景。', '服务劳动和长住归属必须与旅客同等可见；已有图为世界主视觉，不要重做。'),
'VQ-29': ('回声厂牌 — World key art', '阮声、闻析、音乐人、录音师、居民与听众。', '小型录音室、楼顶排练间、旧公交总站舞台、社区唱片库与线上听众岛。', '横向 16:9 分层城市声景；线缆、麦克风、夜行公交和听众形成视线。', '城市黄昏、独立音乐与社区协作；原创概念艺术。', '不得使用真实音乐人、唱片品牌、名人形象、可读歌词、著名专辑或音乐 IP。', '同意/撤回的声音权利必须由人物关系表现；已有图为世界主视觉，不要重做。'),
'VQ-30': ('昼夜渲染室 — World key art', '罗镜、穗儿、制作组、自由职业者和试玩居民。', '动捕棚、夜间渲染室、试玩咖啡馆、剪辑屋顶与外包协调台。', '横向 16:9 多层室内；从动捕到渲染到居民共同审核保持清晰路线。', '柔和深夜工作光、协作创作；原创当代创意科技概念艺术。', '不得绘制现实 UI、著名游戏角色、影视 IP、品牌硬件或可读屏幕。', '创作不是孤立劳动；共同审核而非技术炫耀；已有图为世界主视觉，不要重做。'),
'VQ-31': ('雨盒科技 — World key art', '池雨、栾舟、工程师、老住户和社区委员。', '雨前低矮街区、屋顶传感器、测试池、维修自行车棚和社区会议点。', '横向 16:9 从屋顶到街区；第一滴雨、维修人与纸质说明形成系统行动。', '雨前紧张、可维修的公共技术；原创城市环境概念艺术。', '不得出现真实城市地标、创业公司品牌、未来黑箱界面、可读数据或科技 IP。', '强调公开说明与维修能力，不把设备神秘化；已有图为世界主视觉，不要重做。'),
'VQ-32': ('石墨集团四十一层 — World key art', '岑渺、辛复、主管、远程成员、供应商与员工互助会。', '明亮而紧张的项目墙、玻璃会议室、员工食堂、法务档案间与远程协作舱。', '横向 16:9 企业内景；项目墙、复核和集体午餐处在同一可读空间。', '石墨灰、暖任务灯、内敛紧张；原创企业环境概念艺术。', '不得使用真实企业标识、可读绩效数据、监控惊悚化或第三方职场影视风格。', '透明与监控并存，辛复代表集体组织而非个人英雄；已有图为世界主视觉，不要重做。'),
'VQ-33': ('公民法庭 4A — World key art', '许问、罗姨、书记员、当事人、翻译与调解者。', '公开法庭、无障碍听证室、法律援助走廊、社区调解厨房和屋顶庭园。', '横向 16:9 通透空间；无障碍路径、等候、调解和听证在一条视线中。', '朴素、可理解、有人情味；原创公共司法环境概念艺术。', '不得使用真实法院徽记、权威奇观、可读法条、法律剧 IP 或刻板调解者形象。', '正义表现为可达性；罗姨不可被塑造成圣人；已有图为世界主视觉，不要重做。'),
'VQ-34': ('晨间七号 — World key art', '卫岚、余潇、核查员、主播、节目制作组和社区记者。', '黎明新闻台、资料室、剪辑岛、直播间、街区咖啡车与更正墙。', '横向 16:9 并列视角；核查桌、待播直播间和街区采访形成连续工作流。', '黎明、谨慎、公共责任；原创本地新闻环境概念艺术。', '不得出现真实媒体品牌、可读新闻标题、煽情灾难画面、神秘线人刻板形象或新闻影视 IP。', '核查优先于抢先播出；余潇有边界和主体性；已有图为世界主视觉，不要重做。'),
'VQ-35': ('风向机场 — World key art', '贺清、白璇、地勤、机组、旅客互助组和签证援助者。', '雷暴夜的机场、夜行列车站台、调度塔、安静候机室、行李车和临时信息板。', '横向 16:9 玻璃墙外的雨、转运路径和夜车同框；工作人员与旅客共同活动。', '风暴中的体面照护；原创交通环境概念艺术。', '不得使用航空公司品牌、真实机场地标、可读航班牌、灾难片夸张或第三方交通 IP。', '延误应呈现为公共照护和通行网络，不是恐慌；已有图为世界主视觉，不要重做。'),
'VQ-36': ('盐沼合作渔场 — World key art', '桑楫、廖雾、青年与老船长、合作社成员和研究者。', '潮间带苗圃、浮筏贝场、旧冰厂、堤防工作棚、潮汐观测屋和共享海域。', '横向 16:9 低潮远景；潮沟把贝场、作物和工作棚连成可读生产网络。', '晨雾、劳动与生态观察并重；原创生态经济环境概念艺术。', '不得使用真实渔业品牌、乡村滤镜、可读图表或第三方农业/海洋 IP。', '新旧渔法、实验养殖和共享海域同时可见；已有图为世界主视觉，不要重做。'),
'VQ-37': ('北环调度室 — World key art', '纪河、童夏、工程队、地铁驾驶员、志愿者和降温中心居民。', '极端天气下的调度室、地下泵站、变电站、地铁、降温中心与通报厅。', '横向 16:9 分屏式/串联式场景；至少显示调度室、泵站与降温中心之间的响应线。', '可理解的公共技术、克制紧迫感；原创基础设施环境概念艺术。', '不得出现真实城市系统、可读灾害数据、灾难奇观、英雄主义救援镜头或第三方 IP。', '工程工人与居民协同；公告必须可理解，公共安全不以恐慌呈现。'),
'VQ-38': ('弧光论坛 — World key art', '朔枝、人类版主、离线成员、维修咖啡馆参与者与缈行代表的非拟人化代理存在。', '温暖的虚拟市政厅、慢帖图书馆、申诉长廊、备份室、互助基金与线下维修咖啡馆。', '横向 16:9，线下修理空间与抽象数字公共空间连续叠加；非人代理为非拟人化光/结构存在。', '温暖、民主、略有陌生感；原创虚拟社会环境概念艺术。', '不得使用社交媒体 UI、真实平台标识、赛博霓虹套路、可读帖子或任何既有虚拟世界 IP。', '真人、代理和离线成员共同维护；不可把代理表现为敌人或机器人吉祥物。'),
'VQ-39': ('逆潮物流网 — World key art', '温泊、宋庾、杨述、孟凡与港口调度员、司机、药房库存人员。', '雨前黄昏内河港口：码头、冷链电力、河驳船、司机休息院与药房转运线。', '横向 16:9，多式联运路径在同一画面；货物、人工例外和休息空间可读。', '脆弱连接与务实劳动；原创港口环境概念艺术。', '不得出现赛博炫技、真实物流品牌、可读货单、港口 logo 或第三方游戏/影视 IP。', '优先呈现人与物资相互依赖；司机的休息权应可见。'),
'VQ-40': ('鹿角岛师范学院 — World key art', '乔楠、卢令、范航、柚子、学生教师、儿童和家长。', '海岛渡船、寄宿学校、学院、家长会、儿童广播台和教师宿舍。', '横向 16:9，渡船靠岸到学校窗内广播的连续路线；风雨与临时调整可见。', '教育往返、岛屿社区、节制温暖；原创教育环境概念艺术。', '不得使用校园偶像化、真实学校徽章、可读教材、可爱化儿童或第三方校园 IP。', '教育是互相学习和留任选择，不是城市来拯救岛屿。'),
'VQ-41': ('白昼试验站 — World key art', '迟牧、阿栖、薇沐、禾曜、科学组、生态委员会与渔营。', '极昼冰原、冰下观测井、低矮研究站、共同数据室、远处渔营和飞行坪。', '横向 16:9 全景；冰井、研究站和地方生态知识空间被步道连接。', '节制科研、生态合作、冷静辽阔；原创极地环境概念艺术。', '不得出现神秘怪物、企业科幻基地、真实极地机构、可读仪表或第三方科幻 IP。', '采样许可和撤回权必须是空间关系的一部分，不可美化掠夺。'),
'VQ-42': ('栖灯消防分队 — World key art', '庄火、苏圆、段慈、裴槐、消防员、租户和维修工。', '夜雨后的旧街区：消防站、屋顶水箱、社区厨房、维修巷、安置馆与申诉亭。', '横向 16:9，消防站、水箱、楼栋和社区厨房互相看得见；小火后维修说明场景。', '普通街区的共防网络；原创公共安全环境概念艺术。', '不得出现灾难奇观、受害者凝视、真实消防标识、英雄大片镜头或第三方 IP。', '执法与居住稳定的张力应可读；租户也是行动者。'),
'VQ-43': ('白瓷公社餐桌 — World key art', '唐谷、梁禾、童碗、司荞、农户、学校厨房团队和儿童。', '晨间谷仓、家庭农场、中央厨房、周末市场、罐藏工坊与食物银行。', '横向 16:9 四联或连续场景；种子/农场/厨房/餐桌的循环可读。', '朴实温暖、不作乡村滤镜；原创食品系统环境概念艺术。', '不得出现真实食品品牌、可读菜单、农村浪漫化或第三方烹饪/农场 IP。', '均价餐食、农户生计和儿童反馈同等重要。'),
'VQ-44': ('边界交换站 — World key art', '艾澄、乔旎、程栩、阿那、站务员、翻译者和跨境家庭。', '夜车月台、双语站厅、翻译台、包裹柜、跨境诊所与边市餐馆。', '横向 16:9，以最后一班夜车和人工例外服务为焦点；排队、翻译、医疗与重聚路径可读。', '通行作为日常照护服务；原创跨境公共空间概念艺术。', '不得使用真实国家旗帜、国徽、边检机构、可读护照、现实国界地标或第三方 IP。', '保护证人隐私；不得把迁移者表现为无主体的队列。'),
'VQ-45': ('合页百货公司 — World key art', '余页、昭叔、闻笑、罗莱、家族股东、老员工、线上团队和街区商户。', '礼品厅、老电梯、地下仓、顶层食堂、直播库房和街角修鞋摊。', '横向 16:9 百货剖面；旧电梯短暂停运后，食堂围绕楼层图协商试营业。', '有年代感但不怀旧化；原创零售/家庭企业环境概念艺术。', '不得出现真实商场品牌、可读促销文案、奢侈消费宣传或第三方都市 IP。', '传承、员工所有与街区服务必须同时可见。'),
'VQ-46': ('余音美术馆 — World key art', '何修、叶兰、戴雍、枝空、讲述者、修复师和儿童工坊参与者。', '声音修复室、开放档案桌、临展、旧厂外展车、儿童工坊和河畔放映墙。', '横向 16:9，旧磁带、抽象波形、修复桌和讲述者共同构图；停在沉默处的选择可见。', '安静、尊重、机构自省；原创文化机构环境概念艺术。', '不得使用真实历史人物、档案声纹、博物馆标识、可读文字或第三方艺术视觉表达。', '撤回、同意、纠正和归还权不可被技术化抹除。'),
'VQ-47': ('环时堤岸局 — World key art', '陆筝、南环、子遥、冯涛、迁居家庭、未来代理与湿地保育者。', '暮色海岸的可逆堤岸、湿地、迁居社区、未来席位厅、旧港档案塔和浮动菜场。', '横向 16:9，听证厅中的儿童湿地模型与窗外越过旧标线的潮水构成前后景。', '长时治理、克制希望、代际协商；原创基础设施环境概念艺术。', '不得把巨型工程渲染为唯一进步、使用真实海岸地标、可读债券资料或灾难电影镜头。', '显示 5/20/80 年不同时间尺度；未来代表不可只是象征角色。'),
'VQ-48': ('镜界迁居署 — World key art', '岑折、微枝、祁电、栖雾、前线人员与不同世界迁居家庭。', '明亮抵达厅、七语服务台、适应性住房模型、跨物种诊所、重聚花园和申诉庭。', '横向 16:9 公共空间，通道波动时人员调暗灯光、翻译提醒并支持家庭确认身份。', '多语、多物种、明亮有尊严；原创多世界公共服务概念艺术。', '不得使用异国奇观、既有外星 IP、真实国界标志、怪物化非人种族、可读标识或 UI。', '非人/人类差异以尊重和服务可达性表现；所有流程保留返回/关闭分支。'),
}

all_queue_ids = [f'VQ-{i:02d}' for i in range(17, 49)]
if set(BRIEFS) != set(all_queue_ids):
    raise ValueError('视觉 brief ID 不完整或存在非预期 ID')
if set(assets).intersection(all_queue_ids) != set(all_queue_ids):
    raise ValueError('当前 JSON 缺少视觉队列资产记录')

rows = []
for queue_id in all_queue_ids:
    asset = assets[queue_id]
    world_id = asset[3]
    expected_path = asset[4].lstrip('/')
    status = 'COMPLETE' if queue_id <= 'VQ-36' else 'PENDING-QUOTA'
    rights = 'ORIG-AI-VIS' if status == 'COMPLETE' else 'PENDING-QUOTA'
    action = 'Do not regenerate. Preserve existing asset and its path; only catalog it.' if status == 'COMPLETE' else 'Generate one original 16:9 world key art at 2560×1440 PNG using the frozen brief, then verify file and update only the status/path fields.'
    rows.append({
        'vq_id': queue_id,
        'world_id': world_id,
        'world_name': worlds[world_id]['name'],
        'target': BRIEFS[queue_id][0],
        'subject': BRIEFS[queue_id][1],
        'environment': BRIEFS[queue_id][2],
        'composition': BRIEFS[queue_id][3],
        'mood_style': BRIEFS[queue_id][4],
        'forbidden': BRIEFS[queue_id][5],
        'continuity': BRIEFS[queue_id][6],
        'aspect_ratio': '16:9',
        'expected_filename': Path(expected_path).name,
        'relative_asset_path': f'assets/original-images/{Path(expected_path).name}',
        'current_status': status,
        'rights_label': rights,
        'needed_action': action,
        'source_brief': 'docs/visual-briefs/视觉与动态参考扩充_v0.3.md' if queue_id <= 'VQ-26' else ('docs/visual-briefs/视觉与动态参考扩充_v0.4.md' if queue_id <= 'VQ-38' else 'docs/visual-briefs/视觉与动态参考扩充_v0.5.md'),
    })

handoff = OUT / 'handoff'
handoff.mkdir(parents=True, exist_ok=True)

# CSV is the machine-friendly source for future queue status changes.
csv_path = handoff / 'VISUAL_QUEUE_STATUS.csv'
headers = ['VQ ID','World ID','World Name','Target','Current Status','Existing Asset','Needed Action','Output Filename','Aspect Ratio','Rights Label','Source Brief']
with csv_path.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    for r in rows:
        writer.writerow({
            'VQ ID': r['vq_id'], 'World ID': r['world_id'], 'World Name': r['world_name'], 'Target': r['target'],
            'Current Status': r['current_status'], 'Existing Asset': r['relative_asset_path'] if r['current_status'] == 'COMPLETE' else '',
            'Needed Action': r['needed_action'], 'Output Filename': r['expected_filename'], 'Aspect Ratio': r['aspect_ratio'],
            'Rights Label': r['rights_label'], 'Source Brief': r['source_brief'],
        })

# Human-readable full brief manifest.
manifest = []
manifest.append('# VISUAL_QUEUE_MANIFEST — Frozen VQ-17 to VQ-48\n')
manifest.append('> **PRE-FINAL / VISUAL HANDOFF / NOT FINAL.** This is a frozen execution manifest. It captures existing visual context and must not be used to expand worlds, characters, relationships, IP research, naming, or product design.\n')
manifest.append('## Queue integrity\n')
manifest.append('| Check | Result |\n| --- | --- |\n| Required queue IDs | VQ-17 through VQ-48 |\n| IDs present | 32 / 32 |\n| Duplicate IDs | 0 |\n| Completed original key art | 20 / 32 (VQ-17 through VQ-36) |\n| Still pending | 12 / 32 (VQ-37 through VQ-48) |\n| Existing original candidate images in package | 36 (W-01 through W-36) |\n| Original diagram group | VIS-MAP-03 (PNG, SVG, DOT, D2 source) |\n')
manifest.append('## Status table\n')
manifest.append('| VQ ID | Target | Current Status | Existing Asset | Needed Action | Output Filename |\n| --- | --- | --- | --- | --- | --- |\n')
for r in rows:
    existing = f'`{r["relative_asset_path"]}`' if r['current_status'] == 'COMPLETE' else '—'
    action = 'Catalog only; do not regenerate.' if r['current_status'] == 'COMPLETE' else 'Generate 1 original 16:9 key art; then verify and update status.'
    manifest.append(f'| {r["vq_id"]} | {r["target"]} | `{r["current_status"]}` | {existing} | {action} | `{r["expected_filename"]}` |\n')
manifest.append('\n## Detailed frozen generation briefs\n')
for r in rows:
    manifest.append(f'### {r["vq_id"]} — {r["world_id"]} {r["world_name"]}\n')
    manifest.append(f'| Field | Frozen instruction |\n| --- | --- |\n| Target | {r["target"]} |\n| Visual purpose | Supply a world key art that makes the simulation ecosystem and its active tensions legible. |\n| Subject | {r["subject"]} |\n| Environment | {r["environment"]} |\n| Composition | {r["composition"]} |\n| Mood / style direction | {r["mood_style"]} |\n| Forbidden elements | {r["forbidden"]} |\n| Aspect ratio | `{r["aspect_ratio"]}`; target output is 2560×1440 PNG. |\n| Expected filename | `{r["expected_filename"]}` |\n| Current status | `{r["current_status"]}` |\n| Rights label | `{r["rights_label"]}` |\n| Continuity requirements | {r["continuity"]} |\n| Source brief preserved at | `{r["source_brief"]}` |\n')
manifest_path = handoff / 'VISUAL_QUEUE_MANIFEST.md'
manifest_path.write_text(''.join(manifest), encoding='utf-8')

final_handoff = '''# FINAL VISUAL HANDOFF\n\n> **PRE-FINAL / VISUAL HANDOFF / NOT FINAL**\n>\n> This package freezes all World / Character / relationship / third-party-IP text research. The next agent is a **VISUAL COMPLETION AGENT** only.\n\n## Your role\n\nYou are only a **VISUAL COMPLETION AGENT**. You are **not** a World Research Agent, Character Research Agent, Product Designer, Brand Agent, Content Expansion Agent, or library-restructuring agent.\n\n## Mandatory boundaries\n\nDo **not** add, rename, merge, split, or rewrite Worlds, Characters, factions, locations, secrets, events, relationship patterns, third-party IP references, research directions, filenames, or IDs. Do **not** reinterpret a `PENDING-QUOTA` brief as permission to redesign its world. Do **not** download, use, or reproduce any third-party IP asset.\n\nAll third-party materials remain `REF-ONLY`: they can inform internal abstract mechanisms only. They are not source imagery, generation references, commercial inputs, training assets, product assets, or visual style targets.\n\n## Single objective\n\nComplete the **remaining 12** frozen original visual tasks: `VQ-37` through `VQ-48`. Each task has exactly one existing ID, one expected filename, one 16:9 target, an original brief, explicit exclusions, and continuity constraints in `VISUAL_QUEUE_MANIFEST.md`.\n\n`VQ-17` through `VQ-36` are already complete. Do not regenerate them, do not create variants, do not change their ID, and do not overwrite their existing files.\n\n## Starting order\n\n1. Read `README.md`.\n2. Read this file in full.\n3. Read `VISUAL_QUEUE_MANIFEST.md` and filter `Current Status = PENDING-QUOTA`.\n4. Read the preserved original visual brief source for the relevant VQ.\n5. Read the canonical structured data in `data/current/world_character_library_data_v0.5.1_visual_update.json`.\n6. Generate only the requested image for one VQ at a time or in small batches, preserving the exact ID and expected filename.\n7. Verify only file existence, PNG integrity, and 2560×1440 size. Do not perform speculative visual forensics.\n8. Update exactly these fields after an image exists: current status, asset path, production note, and rights label from `PENDING-QUOTA` to `ORIG-AI-VIS`. Keep the brief text and ID unchanged.\n\n## Required output discipline\n\nEach completion must be an **original** 16:9 world key art. Avoid text, logos, recognizable brands, real public figures, copyrighted characters, real-world national emblems, readable user interfaces, and mimetic third-party visual styles. Respect the dignity guardrails recorded in each brief, especially for healthcare, labor, migration, public safety, disaster recovery, disability, non-human societies, and poverty.\n\nAfter all twelve images exist, retain them as `ORIG-AI-VIS` candidate assets, not automatically cleared commercial assets. A human review for similarity, brand fit, naming, and rights remains required before public use.\n\n## Canonical files\n\n| Need | File |\n| --- | --- |\n| Frozen content truth | `final/current/World_Character_素材库_v0.5.1_视觉更新.xlsx` |\n| Machine-readable truth | `data/current/world_character_library_data_v0.5.1_visual_update.json` |\n| Full VQ status and briefs | `handoff/VISUAL_QUEUE_MANIFEST.md` |\n| Machine-friendly VQ table | `handoff/VISUAL_QUEUE_STATUS.csv` |\n| Existing visual status narrative | `handoff/视觉生成状态_v0.5.1.md` |\n| Original generation brief sources | `docs/visual-briefs/` |\n| Existing original images | `assets/original-images/` |\n| Original map / diagram | `assets/diagrams/` |\n\n## Current frozen state\n\n| Category | Count / state |\n| --- | --- |\n| Original Worlds | 48 — frozen |\n| Original Characters | 193 — frozen |\n| Relationship patterns | 28 — frozen |\n| Third-party structure references | 40 — frozen, `REF-ONLY` |\n| Existing original candidate images | 36 — `ORIG-AI-VIS` |\n| Diagram group | 1 — `ORIG-DIAGRAM` |\n| VQ tasks already complete | 20 — VQ-17 to VQ-36 |\n| VQ tasks pending | 12 — VQ-37 to VQ-48 |\n\n> **Stop condition:** The visual handoff is complete only after VQ-37 to VQ-48 have generated files, verified file integrity, and updated status rows. Until then this package is explicitly **PRE-FINAL** and **NOT FINAL**.\n\n**TEXT RESEARCH: FROZEN**  \n**VISUAL HANDOFF: READY**  \n**PRE-FINAL PACKAGE: READY**\n'''
(handoff / 'FINAL_VISUAL_HANDOFF.md').write_text(final_handoff, encoding='utf-8')

readme = '''# World / Character Visual Handoff Package\n\n> **PRE-FINAL / VISUAL HANDOFF / NOT FINAL**\n\nThis package is the frozen handoff of the World / Character simulation research library to another agent with image-generation capacity. It is not a final publishing package. Its only unfinished production work is the remaining original visual queue.\n\n## Current source of truth\n\nThe current source of truth is **v0.5.1 visual update**, represented by both `final/current/World_Character_素材库_v0.5.1_视觉更新.xlsx` and `data/current/world_character_library_data_v0.5.1_visual_update.json`. These files retain all earlier content and record the latest verified visual state.\n\n| Library area | Frozen count / state |\n| --- | --- |\n| Original Worlds | 48 |\n| Original Characters | 193 |\n| Relationship patterns | 28 |\n| Third-party IP structure references | 40, all `REF-ONLY` |\n| Existing original candidate images | 36, `ORIG-AI-VIS` |\n| Original diagram group | 1, `ORIG-DIAGRAM` |\n| Complete VQ tasks | 20, VQ-17 through VQ-36 |\n| Pending VQ tasks | 12, VQ-37 through VQ-48 |\n\n## Asset and rights labels\n\n| Label | Meaning | Rule |\n| --- | --- | --- |\n| `ORIG-TEXT` | Original written World / Character / relationship data. | Frozen. Do not expand, rewrite, merge, split, rename, or re-ID. |\n| `ORIG-AI-VIS` | Existing original AI-generated candidate visual. | May be cataloged and reviewed internally; still requires human similarity, brand, and rights review before external use. |\n| `ORIG-DIAGRAM` | Existing original system / map diagram. | Preserve source and rendered files; do not replace as a visual-generation task. |\n| `PENDING-QUOTA` | Existing original visual brief without a generated file. | Generate only under the frozen VQ ID and brief; update status only after file verification. |\n| `REF-ONLY` | Third-party IP research and official-source links. | Internal abstract mechanism research only. Never download, distribute, train on, embed, commercialize, or imitate identifiable names, people, characters, visuals, stories, music, shots, or art. |\n\n## Start here\n\nThe next agent must start with `handoff/FINAL_VISUAL_HANDOFF.md`, then `handoff/VISUAL_QUEUE_MANIFEST.md`. Only VQ-37 through VQ-48 remain to be generated. `VQ-17` through `VQ-36` already have verified files in `assets/original-images/` and must not be regenerated.\n\n## Frozen scope\n\nAll text research is frozen. The next agent must not add Worlds, Characters, relationship patterns, third-party IP research, new research directions, or product/brand work. It must not use pending visuals as an opportunity to redesign the library.\n\n## Directory guide\n\n| Directory | Contents |\n| --- | --- |\n| `final/current/` | Current Excel source of truth. |\n| `handoff/` | Mandatory execution instructions, full VQ manifest, CSV status table, and current status narrative. |\n| `assets/` | All existing original candidate images and original diagram source/rendered files. |\n| `data/current/` | Canonical current JSON. |\n| `data/historical/` | Earlier JSON snapshots. |\n| `docs/` | Original World / Character, visual, and research source documents. |\n| `archive/` | Earlier workbooks, data, readmes, scripts, and legacy package index retained for traceability. |\n\n**TEXT RESEARCH: FROZEN**  \n**VISUAL HANDOFF: READY**  \n**PRE-FINAL PACKAGE: READY**\n'''
(OUT / 'README.md').write_text(readme, encoding='utf-8')

report = {
    'package_state': {'text_research': 'FROZEN', 'visual_handoff': 'READY', 'pre_final_package': 'READY', 'final_package': 'NOT READY'},
    'source_of_truth': 'v0.5.1 visual update',
    'counts': {'worlds': 48, 'characters': 193, 'relationship_patterns': 28, 'ip_references': 40, 'visual_queue_total': 32, 'visual_queue_complete': 20, 'visual_queue_pending': 12, 'original_ai_images': 36, 'original_diagram_groups': 1},
    'queue_validation': {'required_ids': all_queue_ids, 'missing_ids': [], 'duplicate_ids': [], 'complete_ids': [f'VQ-{i:02d}' for i in range(17, 37)], 'pending_ids': [f'VQ-{i:02d}' for i in range(37, 49)]}
}
(handoff / 'HANDOFF_INTEGRITY_REPORT.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
