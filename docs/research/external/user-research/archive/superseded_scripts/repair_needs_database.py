import csv
from pathlib import Path

base = Path('/home/ubuntu/ai_world_user_research')
input_path = base / 'needs_database.csv'
temp_path = base / 'needs_database_repaired.csv'

opportunities = {
    'N01': '验证“事件提取—可控检索—事实校验—上下文编排”是否比单纯扩容更能改善续玩。',
    'N02': '验证短程事实守护和当前场景显式化是否能显著降低沉浸中断。',
    'N03': '验证核心人格契约与可解释成长轨迹能否降低模型更新的关系损失。',
    'N04': '验证记忆来源、情境和置信度是否能减少错误记忆带来的长期污染。',
    'N05': '验证轻量确认与可逆修改能否降低维护成本而非把编辑工作外包给用户。',
    'N06': '验证按人物/场景/私密关系选择同步的记忆图谱。',
    'N07': '验证发言人、角色知识和特征隔离的运行时检查。',
    'N08': '验证关系状态以叙事解释驱动而不是单一数值驱动的表达。',
    'N09': '验证按题材选择精确日历、阶段时间或仅场景时间的分层时间模型。',
    'N10': '验证可选硬规则层能否把自由叙事与可验证RPG约束并存。',
    'N11': '验证可审计状态变量、条件与互斥组能否替代脆弱的关键词/脚本拼装。',
    'N12': '验证可视化上下文预算与检索理由是否让作者更快定位连续性故障。',
    'N13': '验证角色/世界版本锁定、变更说明与可回退策略对续费信任的作用。',
    'N14': '验证一体化、可恢复的高级工作流能否取代mod拼装的复杂度。',
    'N15': '验证常量、按需知识、动态状态的结构化创作模型与自动维护辅助。',
    'N16': '验证跨模型试玩、行为测试和卡片健康诊断能否缩短新作者学习曲线。',
    'N17': '验证可移植的发布包、依赖声明和开箱验收流程。',
    'N18': '验证年龄分层、偏好边界、情景控制和安全保护能否作为一体化治理体验。',
    'N19': '验证以可观察结果定义的付费试用，而非只售上下文或记忆配额。',
    'N20': '验证角色目标、事件压力和反重复监测是否提升长期叙事主动性。',
    'N21': '验证会话资产自动恢复、低侵入变现与移动端容错。',
    'N22': '验证私密世界资产的导出、导入与跨模型迁移，而不牺牲对话隐私。',
    'N23': '验证模型变更的可解释通知、影响范围和用户反馈闭环。',
    'N24': '验证面向休闲用户的默认体验与面向作者的渐进式高级控制共存。',
    'N25': '验证“事件触发的角色演化”与“未经授权的人格漂移”可被系统区分。',
}

with input_path.open(encoding='utf-8-sig', newline='') as f:
    reader = csv.reader(f)
    old_header = next(reader)
    old_rows = list(reader)

new_header = [
    '需求编号', '需求主题', '用户任务/期望结果', '问题层级', '初步归类', '主要用户群',
    '频率判断', '价值/流失影响', '当前替代方案', '主流方案失效方式',
    '机会探索方向（非产品决策）', '代表证据', '证据强度', '适用边界'
]
new_rows = []
for row in old_rows:
    if not row:
        continue
    if len(row) != 13:
        raise ValueError(f'字段数异常：{row[0] if row else "空行"} -> {len(row)}')
    record_id = row[0]
    new_rows.append([
        row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9],
        opportunities[record_id], row[10], row[11], row[12]
    ])

with temp_path.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(new_header)
    writer.writerows(new_rows)

print(f'已生成 {temp_path}，共 {len(new_rows)} 条。')
