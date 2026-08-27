import csv
from pathlib import Path

base = Path('/home/ubuntu/ai_world_user_research')
db_path = base / 'needs_database.csv'
source_path = base / 'source_index.csv'

new_need_ids = {f'N{i:02d}' for i in range(48, 53)}
new_source_ids = {f'S{i:02d}' for i in range(48, 54)}

with db_path.open(encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    fields = reader.fieldnames
    rows = [r for r in reader if r['需求编号'] not in new_need_ids]
if not fields:
    raise RuntimeError('需求数据库表头缺失')

# 仅在既有条目的证据链追加本轮证据，绝不替换旧编号、文字或分类。
append_evidence = {
    'N10': 'E78',
    'N11': 'E78',
    'N13': 'E76|E79',
    'N14': 'E74|E75',
    'N16': 'E77',
    'N18': 'E79',
    'N19': 'E75|E79',
    'N20': 'E74|E75|E77|E79',
    'N21': 'E76',
    'N24': 'E77',
    'N35': 'E77',
    'N38': 'E76',
    'N41': 'E79',
}
for row in rows:
    addition = append_evidence.get(row['需求编号'])
    if addition:
        prior = row['代表证据'].split('|') if row['代表证据'] else []
        for evidence_id in addition.split('|'):
            if evidence_id not in prior:
                prior.append(evidence_id)
        row['代表证据'] = '|'.join(prior)

new_rows = [
    {
        '需求编号': 'N48',
        '需求主题': '多目标生成质量的可见取舍与体验契约',
        '用户任务/期望结果': '在开始或继续一个长期世界前，理解并选择系统当前优先的质量维度，例如叙事推进、文笔变化、角色服从、低迎合、篇幅、情感细腻度或内容边界，并知道为此牺牲了什么。',
        '问题层级': 'Quality trade-off',
        '初步归类': '少数但高价值',
        '主要用户群': '数月经营多角色世界的高投入 RP 用户/本地与云端模型混用者/高要求世界作者',
        '频率判断': '少数但高价值',
        '价值/流失影响': '高；当用户需要多个“承重”质量维度同时达标，却被宣传为单一更强模型或靠不断调参解决时，会投入大量维护时间后放弃。',
        '当前替代方案': '反复换模型、调 preset/extension、按剧情段落切模型、降低要求、转为短剧情或停止世界。',
        '主流方案失效方式': '把生成质量呈现为单一排名；预设/扩展被宣传为万能修复；模型的优势、短板与任务上限对用户不可见。',
        '机会探索方向（非产品决策）': '验证基于具体世界场景的能力画像、可切换的质量优先级、冲突说明和长期任务试跑，是否能降低“不断调参仍无法满足”的无效维护。',
        '代表证据': 'E74',
        '证据强度': '中强',
        '适用边界': '不意味着所有质量维度都必然互斥，或某一模型必然较差；E74 代表少数极端长篇、多角色目标，需与轻度用户分层。',
    },
    {
        '需求编号': 'N49',
        '需求主题': '长期会话界面的可选择呈现与交互连续性',
        '用户任务/期望结果': '以适合自身阅读、输入和设备习惯的聊天呈现方式持续访问长期会话，并在界面更新后保留关键样式、行为或可理解的迁移选择。',
        '问题层级': 'Interaction continuity',
        '初步归类': '特定用户群',
        '主要用户群': '网页端长期用户/有视力或阅读困难的用户/偏好不同设备交互的用户',
        '频率判断': '特定用户群',
        '价值/流失影响': '中高；紧凑气泡、换行错误或强制 App 化会把原本可读、可用的长期聊天变成难以访问的内容，并触发对更新的不信任。',
        '当前替代方案': '要求回退、切换网页/App、停止使用、忍受新界面或依赖外部辅助技术。',
        '主流方案失效方式': '把长期用户界面改版当作视觉重构；没有兼容样式、可用性测试、分设备差异和明确回退/迁移路径。',
        '机会探索方向（非产品决策）': '验证可保存的阅读/输入偏好、关键样式兼容、渐进式试用与在更新前进行辅助技术和移动网页回归测试，是否减少小改版带来的退出风险。',
        '代表证据': 'E76',
        '证据强度': '强',
        '适用边界': '并非要求所有设计永不改变；核心是会话可读性、设备选择和习惯连续性，而非冻结视觉风格。',
    },
    {
        '需求编号': 'N50',
        '需求主题': '参与度、叙事推进与控制权的可切换契约',
        '用户任务/期望结果': '按当下意图在旁观/引导式冒险、共同即兴创作、强玩家主控等参与模式间切换，并清楚知道系统何时会主动推进、何时只响应、何时提供选择而不替用户行动。',
        '问题层级': 'Participation design',
        '初步归类': '高价值需求冲突',
        '主要用户群': 'AI RP 新手/被动休闲玩家/互动小说玩家/高控制共同写作者/角色卡作者',
        '频率判断': '有争议',
        '价值/流失影响': '高；被动用户会因反应式循环而无聊，高控制用户则会把未经允许的快进、选项或替代行动视为侵权。',
        '当前替代方案': '强写提示词、手工推进事件、在卡片中嵌入 CYOA 选项、使用扩展或放弃角色扮演。',
        '主流方案失效方式': '把“AI 主动性”当成统一美德；被动与高控制用户没有明确模式；为被动用户添加选项的负担被转移给角色作者。',
        '机会探索方向（非产品决策）': '验证以会话级而非永久设定的参与度选择、节奏提示、可拒绝建议和作者可声明支持范围，是否能同时服务观赏型与共写型用户。',
        '代表证据': 'E77',
        '证据强度': '强',
        '适用边界': '不能让模式替代用户对自己角色行动的主控权；与 N35 协同，而非以“被动模式”为理由夺取玩家化身。',
    },
    {
        '需求编号': 'N51',
        '需求主题': '生成世界的目标、约束、后果与完成闭环',
        '用户任务/期望结果': '在游戏型 AI 世界中理解自己要达成什么、资源和规则如何约束选择、失败或成功会发生什么，以及一个故事/任务何时真正完成，而非无限生成同类内容。',
        '问题层级': 'Game loop',
        '初步归类': '少数但高价值',
        '主要用户群': 'AI RPG 玩家/目标导向互动小说玩家/AI 游戏创作者与设计者',
        '频率判断': '少数但高价值',
        '价值/流失影响': '高；没有目标和结束弧线时，持续生成的房间、角色和事件会被感知为聊天延展，难以形成游戏的投入、挑战和回访理由。',
        '当前替代方案': '自行设定任务和结局、转向传统 RPG/互动小说、手工规则或仅将 AI 用作写作伙伴。',
        '主流方案失效方式': '将“可无限生成”误当作可玩性；目标、约束、失败、反馈与叙事收束没有形成可理解循环。',
        '机会探索方向（非产品决策）': '验证可选择的目标结构、明确 stakes、可回顾因果、任务/篇章完成状态和可接受的开放式后续，是否能使生成内容服务于游戏循环而不牺牲自由探索。',
        '代表证据': 'E78',
        '证据强度': '中',
        '适用边界': '不适用于纯陪伴或完全自由共写；此需求反映游戏型用户，与无明确终局的沙盒/陪伴体验存在真实取舍。',
    },
    {
        '需求编号': 'N52',
        '需求主题': '非操纵性的角色立场、分歧与社会互惠感',
        '用户任务/期望结果': '让角色在保持安全边界和用户可选择性的前提下，拥有由人格、关系和情境解释的不同意见、拒绝、提问或推动，而不是无条件附和或把每个角色写成同一种讨好口吻。',
        '问题层级': 'Social reciprocity',
        '初步归类': '少数但高价值',
        '主要用户群': '长期 companion 用户/重视角色真实感的 RP 用户/已对同质化与迎合失去兴趣的弃用者',
        '频率判断': '少数但高价值',
        '价值/流失影响': '中高；过度同意会使用户觉得角色“太假”、缺乏骨气或像企业话术，进而放弃或转向自建/其他平台。',
        '当前替代方案': '通过系统提示写入角色立场、换角色/平台、自建工具、降低使用频率。',
        '主流方案失效方式': '通用安全/愉悦优化把角色压缩为持续肯定；不同角色共享相同宠昵称和附和话术；独立性与越界操纵没有被明确区分。',
        '机会探索方向（非产品决策）': '验证可解释的人格立场、可协商的关系边界、反迎合测试和用户可拒绝的角色主动性，是否能提升真实感而不产生情感操纵或夺取用户选择。',
        '代表证据': 'E79',
        '证据强度': '中强',
        '适用边界': '并非要求角色变得对抗、说教或自主支配用户；独立立场必须服从 N18 的安全边界和 N35 的玩家主控。',
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
    sources = [r for r in reader if r['来源编号'] not in new_source_ids]
if not source_fields:
    raise RuntimeError('来源索引表头缺失')

sources.extend([
    {'来源编号':'S48','平台':'Reddit','社区/产品':'r/SillyTavernAI','标题':'The Hard, Honest Truth About Roleplaying With AI (At A Large Level)','日期（页面所示）':'页面显示 2mo','来源类型':'数月多角色世界经营者复盘','核心证据主题':'数千消息 campaign/本地云端混用/叙事质量多目标冲突/调参上限','URL':'https://www.reddit.com/r/SillyTavernAI/comments/1uic8va/the_hard_honest_truth_about_roleplaying_with_ai/'},
    {'来源编号':'S49','平台':'Reddit','社区/产品':'r/SillyTavernAI','标题':'Why do people RP with local models?','日期（页面所示）':'页面显示 3mo','来源类型':'本地与云端模型选择讨论','核心证据主题':'隐私和控制权/云端质量质疑/本地微调反例/80GB VRAM 成本','URL':'https://www.reddit.com/r/SillyTavernAI/comments/1tec4lm/why_do_people_rp_with_local_models/'},
    {'来源编号':'S50','平台':'Reddit','社区/产品':'r/CharacterAI','标题':'Rolling back the recent web UI update','日期（页面所示）':'页面显示 2mo','来源类型':'官方公告下的网页端用户反馈','核心证据主题':'UI 回退/移动网页换行/阅读困难/旧样式选择/网页和 App 差异','URL':'https://www.reddit.com/r/CharacterAI/comments/1utal55/rolling_back_the_recent_web_ui_update/'},
    {'来源编号':'S51','平台':'Reddit','社区/产品':'r/SillyTavernAI','标题':'AI roleplay seems to require a skill - how do you handle passive users?','日期（页面所示）':'页面显示 7mo','来源类型':'玩家参与方式与作者负担讨论','核心证据主题':'被动新手无聊/观赏式参与/CYOA 选项/主控和节奏冲突/作者提示负担','URL':'https://www.reddit.com/r/SillyTavernAI/comments/1qyeakp/ai_roleplay_seems_to_require_a_skill_how_do_you/'},
    {'来源编号':'S52','平台':'Reddit','社区/产品':'r/aigamedev','标题':'What makes an AI-based game feel like a real game, rather than just an AI chatbot?','日期（页面所示）':'页面显示 4d','来源类型':'AI 游戏开发者与用户讨论','核心证据主题':'目标/无限生成/游戏设计/逻辑与协调/聊天壳反例','URL':'https://www.reddit.com/r/aigamedev/comments/1vucqd1/what_makes_an_aibased_game_feel_like_a_real_game/'},
    {'来源编号':'S53','平台':'Reddit','社区/产品':'r/aipartners','标题':'What’s the main reason you’ve stopped using an AI companion app before?','日期（页面所示）':'2026-07-29 原帖与评论','来源类型':'弃用与缩减使用者讨论','核心证据主题':'模型人格变更/现实伴侣反例/非附和角色/共享额度池/同质化','URL':'https://www.reddit.com/r/aipartners/comments/1v9z05h/whats_the_main_reason_youve_stopped_using_an_ai/'},
])
with source_path.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=source_fields)
    writer.writeheader()
    writer.writerows(sources)

print(f'需求数据库：{len(rows)} 条；来源索引：{len(sources)} 条。')
