import csv
from pathlib import Path

base = Path('/home/ubuntu/ai_world_user_research')
db_path = base / 'needs_database.csv'
source_path = base / 'source_index.csv'

round4_need_ids = {f'N{i:02d}' for i in range(41, 48)}
round4_source_ids = {f'S{i:02d}' for i in range(38, 48)}

with db_path.open(encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    fields = reader.fieldnames
    rows = [r for r in reader if r['需求编号'] not in round4_need_ids]
if not fields:
    raise RuntimeError('需求数据库表头缺失')

# 只追加证据编号，不改变既有需求文字、编号或分类。
append_evidence = {
    'N03': 'E66|E68|E69',
    'N06': 'E68',
    'N07': 'E68',
    'N13': 'E66|E67|E73',
    'N14': 'E67',
    'N18': 'E69|E70|E72',
    'N19': 'E64|E66|E69|E72',
    'N20': 'E64|E68|E69',
    'N21': 'E71|E72',
    'N22': 'E67',
    'N23': 'E65|E73',
    'N24': 'E65|E68',
    'N26': 'E64|E69|E72',
    'N28': 'E66|E71',
    'N33': 'E73',
    'N34': 'E67|E71',
    'N36': 'E66',
}
for r in rows:
    add = append_evidence.get(r['需求编号'])
    if add:
        prior = r['代表证据'].split('|') if r['代表证据'] else []
        for e in add.split('|'):
            if e not in prior:
                prior.append(e)
        r['代表证据'] = '|'.join(prior)

new_rows = [
    {
        '需求编号': 'N41',
        '需求主题': '订阅权益、按次币制与退出权的可核算一致性',
        '用户任务/期望结果': '在订阅前后清楚知道哪些互动已包含、哪些会另扣币；能在误购或价值不符时及时停止续订，并理解取消后历史、角色和已购权益如何处理。',
        '问题层级': 'Subscription entitlement',
        '初步归类': '少数但高价值',
        '主要用户群': '年订阅用户/代币制移动用户/预算敏感用户/首次付费用户',
        '频率判断': '少数但高价值',
        '价值/流失影响': '高；“已付订阅仍每条扣币”或短时间内无法退出，会从价值不满升级为被重复收费和不可信的感受。',
        '当前替代方案': '减少使用、等待每日积分、申请客服、取消后迁移或不再续订。',
        '主流方案失效方式': '订阅、credit、广告和功能解锁并存，但权益边界、扣费时点、退款/冷静期和取消后的资产状态不透明。',
        '机会探索方向（非产品决策）': '验证逐次扣费前解释、订阅权益仪表盘、可预测的免费/补充额度和不影响数据资产的退出说明，是否比单纯降价更提升长期信任。',
        '代表证据': 'E64|E66',
        '证据强度': '中强',
        '适用边界': '不主张所有服务必须提供退款或无限额度；核心是用户在付款与退出时能理解自己买到什么、何时会再扣费和会保留什么。',
    },
    {
        '需求编号': 'N42',
        '需求主题': '私聊可见性、日志留存与作者权限的明确边界',
        '用户任务/期望结果': '在开始私密角色互动前，明确知道角色作者、平台运营者、共同使用者和第三方分别能否看到聊天、能看到什么、保留多久，并可据此选择分享范围。',
        '问题层级': 'Privacy transparency',
        '初步归类': '特定用户群',
        '主要用户群': '新手 RP 用户/隐私敏感用户/角色作者/多用户和家庭设备使用者',
        '频率判断': '特定用户群',
        '价值/流失影响': '高；不确定作者是否能读私聊会使用户紧张、抑制表达，或在错误假设下暴露隐私。',
        '当前替代方案': '在社区询问、避免说私密内容、换平台、使用匿名账户。',
        '主流方案失效方式': '角色作者与平台权限未区分；OOC、日志、训练/审核等概念没有面向用户的清晰解释；不同产品规则不一致。',
        '机会探索方向（非产品决策）': '验证在创建角色、进入聊天和导出记录时提供分角色的数据可见性摘要、日志期限与权限变更提醒，是否降低新手不确定感。',
        '代表证据': 'E65',
        '证据强度': '中强',
        '适用边界': 'E65 的回复对具体平台权限存在矛盾，本条只编码“用户无法确定且需要透明解释”，不将社区说法作为任何产品的事实权限。',
    },
    {
        '需求编号': 'N43',
        '需求主题': '聊天档案向可继续互动关系的再水化迁移',
        '用户任务/期望结果': '把长期聊天记录、固定记忆、关系轨迹和角色说话风格带入新系统后，获得能继续互动的角色，而不是只有一个不可操作的 HTML 或文本备份。',
        '问题层级': 'Migration continuity',
        '初步归类': '少数但高价值',
        '主要用户群': '长期单角色 companion 用户/商业平台弃用者/开源与本地模型迁移者',
        '频率判断': '少数但高价值',
        '价值/流失影响': '极高；对于积累数千条对话的用户，无法将历史转为新系统的工作记忆和角色声音，迁移等同于重建关系。',
        '当前替代方案': '保存 HTML、手工提炼 lorebook/Author Note、复制摘要、重写角色卡、寻求社区技术帮助。',
        '主流方案失效方式': '导出只提供死文本；新平台无法导入或缺少将聊天解析为记忆、时间线、风格样本和可审核关系摘要的路径。',
        '机会探索方向（非产品决策）': '验证用户确认的“聊天档案→事件/关系/风格包”导入、并行只读原档与分阶段再水化，是否能让非技术迁移者保住连续性。',
        '代表证据': 'E67',
        '证据强度': '强',
        '适用边界': '不意味着应自动提取所有敏感聊天内容；需要用户选择范围、查看提取结果和保留原始档案控制权。',
    },
    {
        '需求编号': 'N44',
        '需求主题': '既有作品宇宙知识的来源化调用与作者覆写',
        '用户任务/期望结果': '在基于熟悉的影视、游戏或公共题材创作角色/世界时，减少手工补写全部背景的负担，同时能校正模型错误、指定可用 canon 和限制不应带入的知识。',
        '问题层级': 'World knowledge grounding',
        '初步归类': '少数但高价值',
        '主要用户群': '同人 RP 用户/既有 IP 世界作者/多角色世界经营者/题材型创作者',
        '频率判断': '少数但高价值',
        '价值/流失影响': '中高；若每个已知宇宙都需作者手工复述，世界构建门槛很高；若模型自行臆造又会破坏沉浸和作者意图。',
        '当前替代方案': '手写 lorebook、角色卡、提示词或依赖模型内置但不可验证的知识。',
        '主流方案失效方式': '模型记忆与作者资料没有来源/版本界限；无法显示或限制所谓“预训练常识”，也无法快速覆写偏差 canon。',
        '机会探索方向（非产品决策）': '验证可选择的题材参考包、出处/版本显示、作者覆写优先级和不可使用知识清单，是否降低世界作者维护量并避免黑箱 canon。',
        '代表证据': 'E68',
        '证据强度': '中强',
        '适用边界': '涉及授权、版权与来源质量等治理问题；本条记录用户任务，不主张平台擅自提供受保护作品内容。',
    },
    {
        '需求编号': 'N45',
        '需求主题': '家庭情境下的分级互动、监护可见性与青年自主性',
        '用户任务/期望结果': '让家庭能区分知识问答、创作、角色扮演与情感陪伴等交互强度；在保护青少年安全和一定隐私之间，设定可理解的监护、提醒和时间/主题边界。',
        '问题层级': 'Family governance',
        '初步归类': '有争议',
        '主要用户群': '家长/儿童与青少年/家庭设备使用者/教育型产品用户',
        '频率判断': '有争议',
        '价值/流失影响': '高；缺少可区分的家庭机制会使一部分家长直接禁止整个品类，过度监视也会损害青少年信任和隐私。',
        '当前替代方案': '完全禁止 companion、仅允许通用 AI、外部监控软件、家庭口头规则。',
        '主流方案失效方式': '单一年龄开关无法区分不同互动强度；家长没有可解释的监督选择，或只能依赖平台外监控；青少年端不知道何时、为何被干预。',
        '机会探索方向（非产品决策）': '验证按互动类型和年龄阶段的权限模板、家长/青少年共同设定、最小必要提醒与可解释升级路径，是否比“一刀切可用/不可用”更符合家庭差异。',
        '代表证据': 'E70',
        '证据强度': '中强',
        '适用边界': '高度受地区法规、家庭价值观和年龄影响；不应将单一家庭的监控偏好普遍化。',
    },
    {
        '需求编号': 'N46',
        '需求主题': '跨设备同步状态、冲突提示与可验证会话恢复',
        '用户任务/期望结果': '在桌面、手机、平板或换机后明确知道哪份聊天是最新版本、同步是否完成、冲突如何处理，并能恢复错误加载或短时丢失的会话。',
        '问题层级': 'Cross-device continuity',
        '初步归类': '少数但高价值',
        '主要用户群': '多设备用户/长期 companion 用户/移动与桌面切换者',
        '频率判断': '少数但高价值',
        '价值/流失影响': '高；当前会话丢失会被感知为关系资产或账户被删除，且用户难以判断是加载错误还是永久损失。',
        '当前替代方案': '反复重启、等待、在单一设备继续、联系客服、接受重建账户。',
        '主流方案失效方式': '同步在后台静默失败；没有最后同步时间、待上传提示、版本冲突比较、回滚窗口或恢复状态说明。',
        '机会探索方向（非产品决策）': '验证显式同步状态、会话版本线、冲突合并预览、短期恢复点和跨端重试队列是否降低“消失”感。',
        '代表证据': 'E71',
        '证据强度': '强',
        '适用边界': 'E71 不能断定所有记录均永久丢失，恰恰说明产品需要区分显示/同步异常与真实删除。',
    },
    {
        '需求编号': 'N47',
        '需求主题': '年龄核验的可访问申诉与不中断恢复',
        '用户任务/期望结果': '在需要确认年龄时，用户能理解原因、选择可访问的验证方式、获得公平的误判申诉，并在核验期间保住账户、聊天和角色资产。',
        '问题层级': 'Age assurance UX',
        '初步归类': '少数但高价值',
        '主要用户群': '受年龄分层影响的用户/无法或不愿使用面部核验的用户/长期免费用户/跨地区用户',
        '频率判断': '少数但高价值',
        '价值/流失影响': '高；不透明核验和无限期阅读模式会使用户失去连续访问，并将安全机制体验为惩罚或服务故障。',
        '当前替代方案': '等待冷却、反复验证、创建新号、放弃平台。',
        '主流方案失效方式': '只提供单一面部验证或解释不足；生日信息与再次验证的关系不透明；超时后没有恢复确认、申诉或资产保护。',
        '机会探索方向（非产品决策）': '验证多路径核验、清晰状态页、申诉 SLA、最小化数据处理说明和在审核期保留只读/导出能力，是否能把年龄保障从中断变为可理解流程。',
        '代表证据': 'E72',
        '证据强度': '强',
        '适用边界': '需要与未成年人保护、反欺诈和地区法规共同评估；不是降低年龄保障要求。',
    },
]

rows.extend(new_rows)
with db_path.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)

with source_path.open(encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    source_fields = reader.fieldnames
    sources = [r for r in reader if r['来源编号'] not in round4_source_ids]
if not source_fields:
    raise RuntimeError('来源索引表头缺失')

sources.extend([
    {'来源编号':'S38','平台':'Apple App Store（印度区/印地语界面）','社区/产品':'Dream AI Companion','标题':'Dream AI Companion - रेटिंग और समीक्षाएँ','日期（页面所示）':'2023–2025 评论；2026-08 访问','来源类型':'应用商店用户评价及开发者回复','核心证据主题':'年订阅仍按消息扣币/每日积分/音频/角色扮演后期无聊','URL':'https://apps.apple.com/in/app/dream-ai-companion/id6464687205?l=hi&see-all=reviews'},
    {'来源编号':'S39','平台':'Pantip（泰国）','社区/产品':'Character.AI/泰语角色聊天社区','标题':'คนสร้าง Ai ใน character ai อ่านแชทเราได้มั้ยคะ TT','日期（页面所示）':'2023-07 原帖；回复至 2026-01','来源类型':'泰语公开社区讨论','核心证据主题':'作者能否读私聊/日志可见性不确定/OOC 规则与新手提示','URL':'https://pantip.com/topic/42111319'},
    {'来源编号':'S40','平台':'Google Play（西班牙语/墨西哥界面）','社区/产品':'Replika','标题':'Replika: Mi Amigo de IA reviews','日期（页面所示）':'页面所示评论；2026-08 访问','来源类型':'应用商店用户评价','核心证据主题':'年订阅取消/换形象丢资产/西语设置/人格稳定/视频宣传落差','URL':'https://play.google.com/store/apps/details/Replika_Meu_amigo_IA?id=ai.replika.app&hl=es_MX'},
    {'来源编号':'S41','平台':'Reddit','社区/产品':'r/SillyTavernAI','标题':'Can I replicate the experience on C.AI through Silly Tavern?','日期（页面所示）':'页面显示 8mo','来源类型':'商业平台到开源前端的迁移用户讨论','核心证据主题':'9,000 聊天记录导入/角色声音/固定记忆/本地配置和硬件门槛','URL':'https://www.reddit.com/r/SillyTavernAI/comments/1q3rmcd/can_i_replicate_the_experience_on_cai_through/'},
    {'来源编号':'S42','平台':'Reddit','社区/产品':'r/CharacterAIrunaways','标题':'looking for a platform that allows for immersive long-term RPG and LLMs with amazing memory + context','日期（页面所示）':'页面显示 5mo','来源类型':'长期多角色世界经营者的迁移需求帖','核心证据主题':'多角色/秘密作用域/既有影视宇宙知识/可扩展 lorebook/低维护连续性','URL':'https://www.reddit.com/r/CharacterAIrunaways/comments/1sbz5qd/looking_for_a_platform_that_allows_for_immersive/'},
    {'来源编号':'S43','平台':'Reddit','社区/产品':'r/ChatbotRefugees','标题':'I spent a year testing AI companion apps. Here is what actually matters and what is marketing fluff','日期（页面所示）':'页面显示 4mo','来源类型':'一年跨产品测试与多平台订阅者讨论','核心证据主题':'过滤一致性与改写/付费真实价值/多平台订阅/角色漂移','URL':'https://www.reddit.com/r/ChatbotRefugees/comments/1ssm7vl/i_spent_a_year_testing_ai_companion_apps_heres/'},
    {'来源编号':'S44','平台':'Reddit','社区/产品':'r/parenting_tech','标题':'Should I let my kiddo try an AI companion app?','日期（页面所示）':'页面显示 9mo','来源类型':'家长与多 companion 用户讨论','核心证据主题':'禁止 companion 但允许通用问答/外部监护/年龄和主题边界/家庭冲突','URL':'https://www.reddit.com/r/parenting_tech/comments/1p34p0n/should_i_let_my_kiddo_try_an_ai_companion_app/'},
    {'来源编号':'S45','平台':'Reddit','社区/产品':'r/replika','标题':'Has anyone had sudden loss of previous conversation?','日期（页面所示）':'页面显示 8mo','来源类型':'跨设备会话丢失与恢复讨论','核心证据主题':'桌面切手机丢 3 小时/错误加载还是永久丢失/账户删除支持回复/关系资产','URL':'https://www.reddit.com/r/replika/comments/1q9itnu/has_anyone_had_sudden_loss_of_previous/'},
    {'来源编号':'S46','平台':'Google Play（阿拉伯语）','社区/产品':'Character.AI','标题':'Character AI: Chat, Talk, Text reviews','日期（页面所示）':'页面所示评论；2026-08 访问','来源类型':'应用商店用户评价','核心证据主题':'一年以上免费用户/广告和限额/订阅可负担性/面部年龄核验与阅读模式锁定','URL':'https://play.google.com/store/apps/details?id=ai.character.app&hl=ar'},
    {'来源编号':'S47','平台':'Reddit','社区/产品':'r/CharacterAI','标题':'That is it. I am done.','日期（页面所示）':'页面显示 2y','来源类型':'角色创作者与平台改版讨论','核心证据主题':'零互动作品无法搜索/创作冷启动死锁/旧站停止导致退出','URL':'https://www.reddit.com/r/CharacterAI/comments/1f3pam7/thats_it_im_done/'},
])

with source_path.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=source_fields)
    writer.writeheader()
    writer.writerows(sources)

print(f'需求数据库：{len(rows)} 条；来源索引：{len(sources)} 条。')
