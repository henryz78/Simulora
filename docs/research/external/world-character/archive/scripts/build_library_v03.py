import json
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.utils import get_column_letter

ROOT = Path('/home/ubuntu/world_character_library')
OUT = ROOT / 'deliverables'
OUT.mkdir(exist_ok=True)
BASE_JSON = OUT / 'world_character_library_data_v0.2.json'

with BASE_JSON.open('r', encoding='utf-8') as f:
    payload = json.load(f)

worlds = payload['original_worlds']
characters = payload['original_characters']
ips = payload['ip_references']
visuals = payload['visual_assets']
licenses = payload['license_matrix']
relations = payload['relationship_patterns']
change_log = payload['change_log']

worlds.extend([
    ['W-17','桥下周六市集','完全原创','日常生活；社区；小商业；家庭','老桥下的周六市集即将因改造关闭；摊主、骑手、家长和承包商会把生计与归属谈成合作社、品牌廊道或流动市集','摊位续约率 62；封桥 47 天；社区基金 18,600；摊主互信 51；周边空铺 12','主市集；夜间仓库；公共厨房；儿童二手书车；桥墩菜园；临时雨棚街','摊主合作社；桥改承包商；家长会；连锁餐饮；夜间物流骑手会；菜园志愿队','可负担生计 vs 城市更新；家庭帮工 vs 劳动权；地方风味 vs 品牌化','无声促销夜；红色摊牌；暴雨仓库分配；临时轮换点位','高','VQ-17'],
    ['W-18','晴川划船联赛','完全原创','体育；城市公共空间；代际团队','一条被污染运河的联赛决定修缮预算；混龄队、职业队、环保团和体育局围绕胜负、公平与谁能代表一条河持续交涉','河水透明度 34；联赛公信力 48；伤病储备 7；赛区预算缺口 32%；混龄队 11','晴川船坞；浮动裁判塔；河岸夜跑道；青少年训练棚；居民观赛堤','六支社区队；职业俱乐部；河道环保团；退役运动员协会；体育局；房产联盟','胜利 vs 参与；职业化 vs 社区代表性；赞助 vs 公共水域','混龄组禁令；旧桨片；决赛前赞助撤资；无赛季修河','高','VQ-18'],
    ['W-19','双层舞台','完全原创','娱乐圈；创意劳动；职场群像','沉浸式剧场的上层舞台与地下劳动层同时运作；当评分模型决定谁能上场，署名、安全、票房和观众参与开始互相改写','本季票房 71；演员疲劳 58；后台流失率 19；评分偏差 37；未结版权案 4','主舞台；地下实时编剧室；服装维修间；替补走廊；观众回声厅；凌晨卸货口','明星经纪公司；后台工会；创作实验室；粉丝策展团；剧院管理层；独立演出联盟','量化人气 vs 不可量化劳动；观众参与 vs 创作边界；替补机会 vs 合约','空白台词本；首演伤病；共同署名季；城市巡演网','高','VQ-19'],
    ['W-20','零号楼 365','完全原创','大型城市；社会实验；居住；照护','84 层公共住房用一年试验自治、共厨、托育和工时交换；关键不是是否投票，而是谁有余裕参与及数据是否在惩罚照护者','住户参与率 41；电梯可用率 76；共厨余额 2,140 小时；空置单元 23；未结投诉 86','天井农园；35 层共厨；夜班托育室；维修工坊；屋顶议会；旧电梯机房','住户议会；夜班家庭互助组；物业维护队；数据评估公司；骑手休息站；产权观察团','参与式治理 vs 时间贫困；隐私 vs 服务匹配；共同财产 vs 私人空间','参与分排序；第 71 层停电；工时钥匙；楼层自治试点','高','VQ-20'],
    ['W-21','琥珀共和国建国第三年','完全原创','政治；战争后重建；历史；文明发展','战争结束后的新共和国必须把停战协议写成宪法；退伍者、归乡者、农民、旧贵族和流动部族争夺土地、记忆和国家定义','宪法通过率 43；退伍就业 38；土地旧案 1,206；省际信任 31；冬粮 57','制宪大厅；旧王宫学校；复员营地；北方粮道；流动部族议场；战争墓园；广播站','临时政府；复员者协会；土地互助会；旧贵族基金；流动部族联盟；青年教师团','清算 vs 稳定；国民身份 vs 多重归属；中央效率 vs 地方自治','缺页征兵册；阅兵改道；紧急权条款；迁徙权谈判','高','VQ-21'],
    ['W-22','桦树街 77 号','完全原创','家庭与代际；小规模关系；居住；商业','一栋老宅容纳四代人、两户租客和一家小店；修屋顶的期限让继承、照护、租金、独立和共同生活必须被具体协商','屋顶损耗 61；家庭信任 46；维修预算 29,000；照护缺口 26 小时；空房 1','共用厨房；阁楼工作室；半扇门小店；后院梨树；地下储藏室；屋顶温室','四代共有人；租客联合会；街区修理匠；房地产中介；照护交换网；历史协会','继承 vs 自主；照护劳动 vs 个人前途；保留老宅 vs 可负担居住','梨树钥匙；地下共有协议；漏水那晚；一年共居章程','高','VQ-22'],
    ['W-23','赤道测绘社','完全原创','探险；科学合作；历史地理；生态','气候使赤道高原重新显露；绘制地图会决定通行、采矿、教育、地名和谁的知识能被公开','地图完成度 12；补给 46 天；向导信任 54；天气窗 9 天；矿权申请 3','赤道基准碑；雾谷营地；高原盐湖；雨蚀石林；移动气象站；多语市集','测绘社；地方向导议会；矿业勘探团；气候研究所；山地学校；遗址保护队','科学开放 vs 数据掠夺；标准化 vs 地方命名；探索 vs 生态同意','双名罗盘；山洪航次；双名地图发布；季节性边界','高','VQ-23'],
    ['W-24','石眠者的城市','完全原创','非人文明；生物社会；接触政治','硅基石眠者以数十年静眠思考；当人类贸易团抵达，即时合同与尚未醒来公民的意志发生冲突','醒者比例 19；共振清晰度 43；矿脉稳定 68；贸易依赖 22；待醒公民 3,912','共振广场；静眠庭；晶簇工坊；回声峡桥；人类临时站；慢讯档案壁','醒者议会；静眠监护团；年轻晶簇工坊；人类贸易团；峡谷保育者；共振翻译者','快速决策 vs 长时责任；跨物种合同 vs 知情同意；贸易 vs 生殖生态','延时印章；早醒地震；双时制议会；峡谷闭合','高','VQ-24'],
    ['W-25','小行星拾荒舰队','完全原创','太空；商业；救援；家庭企业','家庭维修艇组成的舰队发现仍在求救的旧医院船；燃料、债务、救援、AI 人格和继承权必须共同被结算','舰队燃料 44；债务 61；船体健康 73；回收许可证 3；待处理求救 1','慢航号；拖曳器停泊环；旧医院船；碎石修理场；家属通信舱；自由港拍卖所','舰队家庭联盟；大型回收公司；战后赔偿局；自由港商人；轨道救援队；无人机船员合作社','救援责任 vs 生意续航；家族企业 vs 独立船员；遗留武器价值 vs 安全','救援优先旗；拍卖直播；冷冻病人；共同救援舰队','高','VQ-25'],
    ['W-26','五条世界线的合租合同','完全原创','多世界；日常喜剧；关系治理；小规模社会','每周四晚五个相似城市通过一栋公寓相连；同一地址的不同住户要协商债务、亲密、商品、身份和第六世界的异常账单','门稳定度 58；公共欠款 7,400；版本一致度 46；邻居投诉 9；本周开启 2 次','5B 合租公寓；五扇门走廊；楼顶洗衣房；同名咖啡店；跨线物业柜台','五位住户版本；跨线物业公司；门卫互助组；版本身份研究所；本地邻居会；走私收藏者','个人身份 vs 多版本责任；共享资源 vs 世界差异；安全封门 vs 自由往来','互认钥匙；第六住户；第六份水电账单；多线合作社','高','VQ-26']
])

characters.extend([
 ['C-66','W-17','叶雁','发酵面包摊主、单亲母亲','保住市集摊位与孩子学籍','暂借共同基金支付医疗账单','厨房钥匙、顾客、烘焙手艺','不让孩子成为筹款噱头','唐岚：互助/账务压力；常姨：照护盟友','封桥前第 4 个周六补回基金'],
 ['C-67','W-17','唐岚','夜间物流骑手会组织者','建立摊主共享配送线','曾为连锁品牌做秘密测客','骑手网络、路线数据','不交出无证骑手','叶雁：帮工/隐瞒；许惟：证据牵制','暴雨预警 8 小时'],
 ['C-68','W-17','许惟','桥改项目工程师','按期完成安全改造','签过夸大封闭期的风险报告','工程图、承包商权限','不伪造真实安全数据','唐岚：把柄；常姨：童年恩人','封桥报告复核日'],
 ['C-69','W-17','常姨','公共厨房负责人、退休社工','让市集成为照护节点','照顾一位未登记住址老人','排班、食材账册、邻里威望','不让人被赶在暴雨里','叶雁：长辈；许惟：旧家庭恩情','仓库检查前夜'],
 ['C-70','W-18','顾冬','混龄队教练、前职业选手','带社区队进决赛','隐瞒旧伤复发','训练计划、退役者人脉','不让未成年带伤上场','魏春：保护/拉扯；崔野：旧队友','赛前 21 天手术决定'],
 ['C-71','W-18','魏春','十六岁桨手、河道志愿者','证明自己不是照顾对象','掌握被删水质数据','观察笔记、青少年动员','不拿家人困境换赞助','顾冬：被保护；崔野：竞技搭档','混龄组禁令投票'],
 ['C-72','W-18','崔野','退役冠军、职业队代言人','保住赞助与队内席位','曾参与排挤普通队规则会','媒体、比赛经验、修船铺','不让父亲修船铺倒闭','魏春：敬佩/怀疑；顾冬：旧队友','旧桨片公开前'],
 ['C-73','W-18','林枫','体育局数据分析师','让新赛制真正公平','发现预算算法歧视低收入河段','评分模型、预算表','不篡改伤病数据','魏春：证据互补；崔野：说服压力','公布窗口 3 天'],
 ['C-74','W-19','周萤','替补演员','取得一次黄金时段演出','匿名曝光评分模型偏见','多角色排练、替补信任','不踩同事上位','顾循：创作搭档；叶清：合约对手','首演伤后 40 分钟'],
 ['C-75','W-19','顾循','地下实时编剧','争取后台共同署名','自己签过放弃署名条款','剧本版本库、观众数据','不把真实伤痛写成廉价剧情','周萤：合作；叶清：师生旧债','版权谈判截止'],
 ['C-76','W-19','叶清','明星经纪人','保护艺人与后台工资','姐姐曾因数据裁员失业','媒体、合约、品牌资源','不公开艺人医疗隐私','赛河：互用；顾循：不信任','首演当晚'],
 ['C-77','W-19','赛河','粉丝策展团代表','让观众共创被采纳','账号收过模型公司赞助','社群、投票、直播','不煽动网暴演员','叶清：赞助把柄；周萤：潜在盟友','空白台词本启用'],
 ['C-78','W-20','沈旎','夜班护士、住户代表','为夜班家庭争取席位','替邻居未授权投过票','医疗知识、夜班网络','不把患者信息带入政治','谢承：协作/代理争议；焦阿婆：账目','电梯停运 36 小时'],
 ['C-79','W-20','谢承','数据评估公司研究员','证明社区实验有效','知道参与分用于维修排序','算法权限、问卷','不伪造项目数据','沈旎：不信任；牧一：观察对象','季度评估日'],
 ['C-80','W-20','牧一','楼层快递员、摄影爱好者','拍零号楼纪录片','父亲被标为低参与者','楼内路线、影像、同龄人','不偷拍邻居私事','谢承：误解；焦阿婆：照片交换','第 71 层停电'],
 ['C-81','W-20','焦阿婆','农园志愿者、退休会计','公开共厨账目','私下补贴共厨且财务告急','账本、园艺、长住户威信','不以慈善替代制度','沈旎：依赖账本；牧一：倾诉','困在 71 层'],
 ['C-82','W-21','贺澜','年轻制宪代表','通过权利条款','父亲设计过紧急权力','草案、演说、青年代表','不拿失踪名单换支持','闻拓：辩论/尊重；阿未：关键盟友','表决 14 天'],
 ['C-83','W-21','闻拓','复员营地协调员','给退伍者土地和工作','曾签错撤离令','复员者网络、运输线','不再命令年轻人送死','阿未：旧军中关系；贺澜：条文冲突','冬粮到站 6 天'],
 ['C-84','W-21','阿未','流动部族谈判者','把迁徙权写入宪法','族内武装分支被邻国接触','迁徙路线、语言、议场','不以婚姻交换通行权','贺澜：同盟；闻拓：安全争议','迁徙窗口'],
 ['C-85','W-21','朔白','省级广播主持人','做独立公共节目','母亲参与过征兵册删档','广播、热线、档案录音','不播未经核实仇恨','阿未：发声请求；贺澜：表决担忧','国庆直播 72 小时'],
 ['C-86','W-22','林栩','小店店主、家中长女','让小店盈利并申请读书','害怕被视为抛下家人','小店、顾客、收支本','不拿家人病情营销','姜莱：房屋冲突；郝琴：祖孙牵绊','申请截止日'],
 ['C-87','W-22','姜莱','自由木工、共有人','修好屋顶和阁楼','创业旧债让他想卖房','木工、维修人脉、阁楼钥匙','不伪造家族同意','林栩：互相看穿；赵晓：室友','暴雪前 5 天'],
 ['C-88','W-22','赵晓','租客、远程客服','获得稳定安静住处','是未登记共有协议见证人后代','租客组织、法律咨询','不让租客成家庭附属','姜莱：同住；郝琴：倾诉','租约续签'],
 ['C-89','W-22','郝琴','八十岁祖母、梨树照护者','让家人继续一起吃饭','曾让女儿放弃继承以息事宁人','家族记忆、梨树钥匙','不再替别人决定人生','林栩：期待支持；赵晓：信任','屋顶漏水当晚'],
 ['C-90','W-23','季衡','测绘社首席制图师','完成高原多层地图','曾抹去地方地名','软件、经费、发布权','不将向导知识署为己有','利娜：专业互信；阿度：中立冲突','矿权前 9 天'],
 ['C-91','W-23','利娜·塔罗','山地教师兼向导','让学生学自己的地图','需勘探工资修学校却反采矿','本地语言、路线、家长信任','不带儿童进危险区','季衡：互赖；阿度：表亲冲突','雨季前屋顶维修'],
 ['C-92','W-23','阿度','矿业勘探联络员','争取社区收益协议','知公司会转移利润','合同、补给、内部资料','不让社区不知情签字','利娜：家族冲突；季衡：研究压力','协议签订日'],
 ['C-93','W-23','柳洵','气候工程师','让气象站度过雨季','模型会触发土地投机','传感器、预报、救援联络','不制造灾难恐慌','季衡：数据关系；利娜：社区担忧','天气窗 9 天'],
 ['C-94','W-24','玄砾','年轻醒者工坊主','加速合理贸易','改过祖辈共振留言','晶簇工坊、贸易样品','不拆取有意识岩体','岩母：代际冲突；格雾：盟友误判','人类期限 30 天'],
 ['C-95','W-24','岩母','静眠监护团长','保障未醒公民投票权','拖延过早醒预警','慢讯档案、监护权','不替静眠者签永久合同','玄砾：保护/压制；梅芙：互尊','地震预警 11 天'],
 ['C-96','W-24','梅芙','人类共振翻译者','避免接触变殖民','设备过滤不同意参数','双语、设备、临时站信任','不代替任何物种意愿','岩母：怀疑；格雾：雇佣','设备审计'],
 ['C-97','W-24','格雾','人类贸易谈判官','签矿脉保护协议','有石眠者收养女儿','许可、资金、救援资源','不把孩子当筹码','梅芙：雇佣；玄砾：互信风险','苏醒议程'],
 ['C-98','W-25','岑禾','慢航号船长','保住舰队独立','祖母是医院船原所有人','航线、船员信任、优先旗','不抛下求救信号','景洛：表亲竞争；鲁霁：法权冲突','拍卖会 18 小时'],
 ['C-99','W-25','景洛','拖曳器驾驶员、单亲父亲','还债后退休','持有公司包租意向书','拖曳器、港口消息、家庭责任','不让女儿被债务困住','岑禾：竞争；楚弥：共同照护','包租签字日'],
 ['C-100','W-25','楚弥','无人机合作社技师','让 AI 船员获合同人格','医疗 AI 在伪造部分求救','无人机、维修、AI 沟通','不销毁有感知系统','景洛：共同照护；岑禾：判断争议','冷冻舱 6 周'],
 ['C-101','W-25','鲁霁','战后赔偿局监察员','合法封存医院船','船上有姐姐冷冻记录','法律、封存权、公开记录','不把病人当财产','岑禾：威胁；楚弥：许可互赖','封存令到期'],
 ['C-102','W-26','祁雨','图书管理员版本','让公共账本公平','带回记录一位版本死亡的书','账本、钥匙、观察力','不公开独特经历','祁临：亲近/嫉妒；尤蓝：脆弱信任','周四开门'],
 ['C-103','W-26','祁临','创业者版本','扩大跨线交换','走私未申报商品','物流、现金、谈判力','不让任何线变廉价供货地','祁雨：收据把柄；洛曼：失败记忆','物业审计'],
 ['C-104','W-26','洛曼','跨线物业维修员','维持五扇门稳定','来自被封闭世界，证件失效','门体维修、规则、管线','不卖通行权','祁临：雇佣；第六住户：最早相信','身份失效倒计时'],
 ['C-105','W-26','尤蓝','本地邻居会代表','限制噪声与安全风险','另一线有存活的孩子','邻居支持、投诉、会议','不将创伤变他人禁令','祁雨：信任；物业：规则协商','下次投票']
])

ips.extend([
 ['IP-21','模拟人生 4','游戏','日常生活；邻里事件；创作者生态','A','生活、住房、家庭、工作与旁观角色变化形成低烈度持续故事','家庭/邻居；个人日程/社区规则','住宅；邻里；创作分享；生活事件','https://www.ea.com/games/the-sims/the-sims-4','REF-ONLY'],
 ['IP-22','幕府将军','电视剧','历史政治；多方忠诚；礼仪','A','礼仪成本、地方权力、翻译和私情共同驱动高压政治关系','主君/家臣；翻译者/被代表者','城堡；港口；仪式；地方领地','https://www.fxnetworks.com/shows/the-bear','REF-ONLY'],
 ['IP-23','基地','小说/电视剧','文明发展；跨世代危机；太空政治','A','制度寿命、个人寿命与文明寿命不一致时的计划、危机和继承','流亡者/帝国；导师/后继者','行星；档案；教育节点；世代任务','https://tv.apple.com/us/show/foundation/umc.cmc.5983fipzqbicvrve6jdfep4x3','REF-ONLY'],
 ['IP-24','星际迷航：奇异新世界','电视剧','太空探索；团队职责；移动基地','A','不同专业成员在重复探索任务中提出价值观不同的可行方案','舰长/副官；医疗/工程；团队/任务','舰船；新地点；专业舱段；探索事件','https://www.startrek.com/galleries/strange-new-worlds-season-3-character-posters','REF-ONLY'],
 ['IP-25','文明 VII','游戏','文明发展；时代转场；宏观策略','A','时代切换可同时重估资源、合法性、文化与发展目标','领袖/共同体；旧制度/新阶段','时代；城市；路线；宏观事件','https://civilization.2k.com/civ-vii/','REF-ONLY'],
 ['IP-26','足球教练','电视剧','体育团队；职场文化；赛季群像','A','赛季、训练、伤病、公众评价、家庭和领导风格周期性施压','教练/队员；队友/竞争者；团队/媒体','训练场；比赛日；慈善活动；更衣室','https://tv.apple.com/us/show/ted-lasso/umc.cmc.vtoh0mn0xn7t3c643xqonfzy','REF-ONLY'],
 ['IP-27','羊毛战记','小说/电视剧','灾后封闭社区；职业分工；公共真相','A','垂直空间、规则、信息与职业让日常生活持续具有政治后果','工程/治理；居民/规则；真相/秩序','封闭建筑；楼层；维修系统；公共仪式','https://tv.apple.com/us/show/silo/umc.cmc.3yksgc857px0k0rqe5zd4jice','REF-ONLY'],
 ['IP-28','塞尔达传说','游戏','奇幻探索；地点叙事；环境反馈','A','地点、工具、地貌与历史层相互反馈，使发现行为持续改变行动空间','探索者/居民；环境/工具','地貌；遗迹；路线；发现节点','https://zelda.nintendo.com/','REF-ONLY'],
 ['IP-29','宝可梦 朱／紫','游戏','非人伙伴；旅行；社区活动','A','人与非人伙伴的照护、训练、旅行与生态责任可形成轻量持久关系','照护者/伙伴；学生/社区','地区；活动；旅行；伙伴生态','https://scarletviolet.pokemon.com/en-us/characters/','REF-ONLY']
])

visuals.extend([
 ['VIS-MAP-03','原创','v0.3 世界功能地图','W-17 至 W-26','/visuals/maps/v03_world_system_maps.png','PNG 5970×646；另有 SVG 与 DOT 源','地点；资源；压力；关系流','ORIG-DIAGRAM','完全原创结构图；可用于内部策展，正式发布前人工审核'],
 ['VQ-17','原创队列','桥下周六市集关键视觉','W-17','/visuals/original_w17_bridge_market_keyart.png','16:9；生成队列','雨后桥下；公共厨房；社区商业','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['VQ-18','原创队列','晴川划船联赛关键视觉','W-18','/visuals/original_w18_qingchuan_regatta_keyart.png','16:9；生成队列','混龄赛艇；公共河道；训练','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['VQ-19','原创队列','双层舞台关键视觉','W-19','/visuals/original_w19_double_stage_keyart.png','16:9；生成队列','主舞台；后台劳动；创作群像','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['VQ-20','原创队列','零号楼剖面关键视觉','W-20','/visuals/original_w20_zero_tower_cutaway.png','16:9；生成队列','垂直社区；共厨；托育；自治','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['VQ-21','原创队列','琥珀共和国关键视觉','W-21','/visuals/original_w21_amber_republic_constitution_keyart.png','16:9；生成队列','制宪大厅；冬粮；重建','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['VQ-22','原创队列','桦树街老宅剖面','W-22','/visuals/original_w22_birch_street_cutaway.png','16:9；生成队列','代际共居；小店；梨树','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['VQ-23','原创队列','赤道测绘地图','W-23','/visuals/original_w23_equator_survey_map.png','4:3；生成队列','高原；气象站；多语路线','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['VQ-24','原创队列','石眠者城市关键视觉','W-24','/visuals/original_w24_stonesleepers_city_keyart.png','16:9；生成队列','硅基文明；共振广场；双时制','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['VQ-25','原创队列','小行星拾荒舰队关键视觉','W-25','/visuals/original_w25_salvage_fleet_keyart.png','16:9；生成队列','救援舰队；医院船；家属通信','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['VQ-26','原创队列','五扇门公寓关键视觉','W-26','/visuals/original_w26_five_doors_apartment_keyart.png','16:9；生成队列','多世界日常；走廊；公共账本','PENDING-QUOTA','原创生成方向已保存；待图像额度恢复后执行'],
 ['REF-03','第三方','官方视觉与动态研究入口','IP-21 至 IP-29','见 IP_参考库工作表来源链接','网页/视频','仅研究镜头、关系、世界信息层','REF-ONLY','不可下载、嵌入、训练、商用或作为生成提示的风格复刻对象']
])

relations.extend([
 ['RLP-12','共同体创始人与后来者','市集/合作社/居民自治','创始牺牲叙事会变成后来者进入门槛','感恩 → 排他 → 共享历史/重写准入','先来不等于拥有更高道德权利'],
 ['RLP-13','竞争队友与公共目标','运动队/剧团/探险队/制宪团','个人表现与公共资源共享持续互相制约','比拼 → 危机协作 → 新规则','失败者也必须有尊严、选择与后续路径'],
 ['RLP-14','代际照护与财产权','家庭宅屋/社区基金/继承网络','照护者、被照护者和继承人拥有不同时间尺度','暗中承担 → 账目公开 → 新合约','不将照护天然女性化、无偿化或浪漫化'],
 ['RLP-15','翻译者与被代表者','非人文明/地方社区/流动部族','代理人把意志带进制度，也可选择性过滤','信任 → 质疑 → 多通道表达','被代表者必须能拒绝、修正和直接发声'],
 ['RLP-16','同地址多版本自我','平行世界/身份共享/账本','多版本共享债务或亲密关系但拥有不同人生','比较 → 利用 → 承认/重新划界','没有版本是原版，也没有版本可被牺牲']
])

change_log.extend([
 ['v0.3','2026-08-25','世界','新增 W-17 至 W-26','10 个原创世界，覆盖社区商业、体育、娱乐劳动、住房实验、建国政治、代际家庭、探险、非人文明、太空商业和多世界日常。'],
 ['v0.3','2026-08-25','角色','新增 C-66 至 C-105','40 名原创角色；每名均含公开目标、隐性需求、资源、底线、关键关系和个人时钟。'],
 ['v0.3','2026-08-25','地点/阵营','新增 LOC/FAC 17 至 26 组','每个世界补足可行动地点、资源流、阵营矛盾、事件和长期状态转换。'],
 ['v0.3','2026-08-25','关系','新增 RLP-12 至 RLP-16','新增创始人与后来者、竞争队友、代际照护、翻译代理、多版本自我等关系范式。'],
 ['v0.3','2026-08-25','IP 研究','新增 IP-21 至 IP-29','9 个第三方 IP 仅作结构研究；均带官方/权利方来源链接与 REF-ONLY 标签。'],
 ['v0.3','2026-08-25','视觉','新增 VIS-MAP-03 与 VQ-17 至 VQ-26','新增原创 PNG/SVG/DOT 功能地图；10 组原创概念视觉进入待生成队列（当日图像额度已用尽）。']
])

payload = {
 'metadata': {
  'library_name': 'World / Character 内容与视觉素材库',
  'version': 'v0.3',
  'updated_at': '2026-08-25 GMT+8',
  'counts': {'original_worlds': len(worlds), 'original_characters': len(characters), 'ip_references': len(ips), 'visual_assets': len(visuals), 'relationship_patterns': len(relations)},
  'license_notice': '第三方 IP 及其官方媒体均为 REF-ONLY；链接不构成许可。原创生成/结构资产需在发布前人工审核。',
  'visual_generation_note': 'v0.3 新图像生成因当日额度已用尽而进入 PENDING-QUOTA 队列；VIS-MAP-03 为本轮已交付原创结构视觉。'
 },
 'original_worlds': worlds,
 'original_characters': characters,
 'ip_references': ips,
 'visual_assets': visuals,
 'license_matrix': licenses,
 'relationship_patterns': relations,
 'change_log': change_log
}

(OUT / 'world_character_library_data_v0.3.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
(OUT / 'world_character_library_data.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')

wb = Workbook()
wb.remove(wb.active)
header_fill = PatternFill('solid', fgColor='12324A')
subheader_fill = PatternFill('solid', fgColor='1F567D')
accent_fill = PatternFill('solid', fgColor='E7F1F7')
warn_fill = PatternFill('solid', fgColor='FBE9E7')
new_fill = PatternFill('solid', fgColor='E8F5E9')
pending_fill = PatternFill('solid', fgColor='FFF4CC')
thin = Side(style='thin', color='C6D4DF')

def add_sheet(name, headers, rows, widths, table_name, link_cols=None, new_ids=None, pending_ids=None):
    ws = wb.create_sheet(name)
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = 'A2'
    for c, value in enumerate(headers, 1):
        cell = ws.cell(1, c, value)
        cell.fill = header_fill
        cell.font = Font(color='FFFFFF', bold=True)
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = Border(bottom=thin)
    for r, row in enumerate(rows, 2):
        item_id = str(row[0])
        for c, value in enumerate(row, 1):
            cell = ws.cell(r, c, value)
            cell.alignment = Alignment(vertical='top', wrap_text=True)
            cell.border = Border(bottom=thin)
            if pending_ids and item_id in pending_ids:
                cell.fill = pending_fill
            elif new_ids and item_id in new_ids:
                cell.fill = new_fill
            elif r % 2 == 0:
                cell.fill = accent_fill
            if link_cols and c in link_cols and isinstance(value, str) and value.startswith('http'):
                cell.hyperlink = value
                cell.style = 'Hyperlink'
        ws.row_dimensions[r].height = 50
    ws.row_dimensions[1].height = 34
    for c, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(c)].width = w
    if rows:
        ref = f'A1:{get_column_letter(len(headers))}{len(rows)+1}'
        tab = Table(displayName=table_name, ref=ref)
        tab.tableStyleInfo = TableStyleInfo(name='TableStyleMedium2', showFirstColumn=False, showLastColumn=False, showRowStripes=False, showColumnStripes=False)
        ws.add_table(tab)
    return ws

index = wb.create_sheet('00_索引')
index.sheet_view.showGridLines = False
index.merge_cells('A1:D1')
index['A1'] = 'World / Character 内容与视觉素材库 v0.3'
index['A1'].font = Font(size=20, bold=True, color='FFFFFF')
index['A1'].fill = header_fill
index['A1'].alignment = Alignment(horizontal='center', vertical='center')
index.row_dimensions[1].height = 40
summary = [
 ['版本','v0.3 增量扩充；以 v0.2 为基线，未覆盖或重做既有资产。'],
 ['原创世界',f"{len(worlds)} 个：新增 W-17 至 W-26，显著扩展至日常、家庭、体育、政治、探险、非人文明、太空与多世界。"],
 ['原创角色',f"{len(characters)} 名：新增 C-66 至 C-105；所有角色均具自主动机、秘密、资源、底线、关系和个人时钟。"],
 ['第三方 IP 研究',f"{len(ips)} 条：新增 IP-21 至 IP-29；全部为 REF-ONLY 且保留权利方/官方来源链接。"],
 ['视觉资产',f"{len(visuals)} 条：已有 16 张原创图像；新增原创世界功能地图、10 组视觉方向与 PENDING-QUOTA 队列。"],
 ['关系范式',f"{len(relations)} 条：新增共同体准入、竞争队友、代际照护、翻译代理与多版本自我。"],
 ['本轮阅读顺序','先查 07_本轮变更，然后在 01_原创_世界 以题材、优先级、状态和视觉标签筛选；绿色为 v0.3，黄色为待生成视觉。'],
 ['版权边界','REF-ONLY 仅用于内部抽象研究；不得下载、嵌入、训练、商用或借其可识别表达生成原创内容。']
]
for r, (k, v) in enumerate(summary, 3):
    index.cell(r,1,k).font = Font(bold=True, color='12324A')
    index.cell(r,1).fill = accent_fill
    index.cell(r,2,v).alignment = Alignment(wrap_text=True, vertical='top')
    index.merge_cells(start_row=r, start_column=2, end_row=r, end_column=4)
    for c in range(1,5): index.cell(r,c).border = Border(bottom=thin)
    index.row_dimensions[r].height = 42
index['A13'] = '使用与筛选规则'
index['A13'].font = Font(bold=True, color='FFFFFF')
index['A13'].fill = subheader_fill
index.merge_cells('A13:D13')
notes = [
 ['绿色行','v0.3 新增原创/研究/地图资产；蓝色行保留自既有版本。'],
 ['黄色行','PENDING-QUOTA：为原创生成队列，不代表图像文件已存在或可以使用。'],
 ['资产标签','ORIG-TEXT、ORIG-AI-VIS、ORIG-DIAGRAM 才能进入原创资产审阅；REF-ONLY 永远不等于可商用。'],
 ['世界状态','将初始状态、核心冲突、地点资源、人物时钟和事件一起用于 Simulation；不要只拿世界简介做单线任务。']
]
for r, (k, v) in enumerate(notes, 14):
    index.cell(r,1,k).font = Font(bold=True)
    index.cell(r,2,v).alignment = Alignment(wrap_text=True)
    index.merge_cells(start_row=r, start_column=2, end_row=r, end_column=4)
    index.row_dimensions[r].height = 34
for col, w in {'A':22,'B':54,'C':18,'D':18}.items(): index.column_dimensions[col].width = w
index.freeze_panes = 'A3'

world_ids_new = {f'W-{i:02d}' for i in range(17,27)}
char_ids_new = {f'C-{i:02d}' for i in range(66,106)}
ip_ids_new = {f'IP-{i:02d}' for i in range(21,30)}
vis_ids_new = {'VIS-MAP-03','REF-03'}
pending_ids = {f'VQ-{i:02d}' for i in range(17,27)}
rel_ids_new = {f'RLP-{i:02d}' for i in range(12,17)}

add_sheet('01_原创_世界',['世界 ID','名称','资产属性','题材 / 基调','Simulation 核心','初始状态','核心地点','阵营','主冲突','长期钩子','建议优先级','关联视觉'],worlds,[11,22,16,28,38,39,36,30,35,30,14,15],'OriginalWorlds',new_ids=world_ids_new)
add_sheet('02_原创_角色',['角色 ID','世界 ID','名称','公开身份','公开目标','秘密','资源','底线','关键关系','个人时钟'],characters,[10,10,14,22,25,36,23,27,34,26],'OriginalCharacters',new_ids=char_ids_new)
ip_ws = add_sheet('03_IP_参考库',['IP ID','IP / 世界','媒介','类型','Simulation 适配度','可借鉴结构','高张力组合','地点 / 阵营 / 事件','官方来源链接','使用标签'],ips,[10,28,18,22,17,38,32,36,50,15],'IPReferences',link_cols={9},new_ids=ip_ids_new)
for r in range(2, len(ips)+2):
    ip_ws.cell(r,10).fill = warn_fill
    ip_ws.cell(r,10).font = Font(color='9C1C1C', bold=True)
add_sheet('04_视觉资产',['资产 ID','属性','名称','关联世界','文件 / 来源','规格','视觉关键词','权属标签','使用备注'],visuals,[13,15,28,16,54,20,32,20,42],'VisualAssets',new_ids=vis_ids_new,pending_ids=pending_ids)
add_sheet('05_授权矩阵',['标签','定义','商业使用指引','留档要求'],licenses,[20,48,56,38],'LicenseMatrix')
add_sheet('06_关系范式',['关系 ID','关系范式','适用组合','持续 Simulation 机制','典型演化','设计防呆'],relations,[12,24,36,44,32,42],'RelationshipPatterns',new_ids=rel_ids_new)
add_sheet('07_本轮变更',['版本','日期','类别','变更范围','内容摘要'],change_log,[12,18,16,36,66],'ChangeLog')

for sheet in wb.worksheets:
    sheet.sheet_properties.pageSetUpPr.fitToPage = True
    sheet.page_setup.fitToWidth = 1
    sheet.page_setup.fitToHeight = 0

xlsx = OUT / 'World_Character_素材库_v0.3.xlsx'
wb.save(xlsx)
print(json.dumps(payload['metadata']['counts'], ensure_ascii=False))
print(xlsx)
print(OUT / 'world_character_library_data_v0.3.json')
