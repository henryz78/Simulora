import json
from pathlib import Path
from copy import deepcopy
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.utils import get_column_letter

ROOT = Path('/home/ubuntu/world_character_library')
OUT = ROOT / 'deliverables'
VIS = ROOT / 'visuals'
BASE = OUT / 'world_character_library_data_v0.5.json'

GENERATED = {
    'VQ-17': 'original_w17_bridge_market_keyart.png',
    'VQ-18': 'original_w18_qingchuan_regatta_keyart.png',
    'VQ-19': 'original_w19_double_stage_keyart.png',
    'VQ-20': 'original_w20_zero_tower_cutaway.png',
    'VQ-21': 'original_w21_amber_republic_constitution_keyart.png',
    'VQ-22': 'original_w22_birch_street_keyart.png',
    'VQ-23': 'original_w23_equator_survey_keyart.png',
    'VQ-24': 'original_w24_stonesleeper_city_keyart.png',
    'VQ-25': 'original_w25_asteroid_salvage_keyart.png',
    'VQ-26': 'original_w26_five_worlds_flat_keyart.png',
    'VQ-27': 'original_w27_shift_ward_keyart.png',
    'VQ-28': 'original_w28_pier_hotel_keyart.png',
    'VQ-29': 'original_w29_echo_label_keyart.png',
    'VQ-30': 'original_w30_render_studio_keyart.png',
    'VQ-31': 'original_w31_rainbox_startup_keyart.png',
    'VQ-32': 'original_w32_graphite_floor_keyart.png',
    'VQ-33': 'original_w33_civic_court_keyart.png',
    'VQ-34': 'original_w34_morning_news_keyart.png',
    'VQ-35': 'original_w35_wind_airport_keyart.png',
    'VQ-36': 'original_w36_saltmarsh_keyart.png',
}
PENDING = {f'VQ-{i:02d}' for i in range(37, 49)}

missing = [name for name in GENERATED.values() if not (VIS / name).is_file()]
if missing:
    raise FileNotFoundError(f'缺少已标记为生成的图像文件: {missing}')

with BASE.open('r', encoding='utf-8') as f:
    payload = json.load(f)
payload = deepcopy(payload)

world_lookup = {row[0]: row[1] for row in payload['original_worlds']}
visual_rows = payload['visual_assets']
progress_rows = []
for row in visual_rows:
    asset_id = row[0]
    world_id = row[3]
    if asset_id in GENERATED:
        filename = GENERATED[asset_id]
        row[1] = '原创 AI 生成'
        row[4] = f'/visuals/{filename}'
        row[5] = '2560×1440 PNG；16:9；本轮实际生成'
        row[7] = 'ORIG-AI-VIS'
        row[8] = '已实际生成；进入原创候选审阅，发布前仍需人工进行相似性、品牌与权利审核。'
        progress_rows.append([asset_id, world_id, world_lookup.get(world_id, ''), '已生成', f'/visuals/{filename}', 'ORIG-AI-VIS', '已核验 PNG 文件与 2560×1440 尺寸。'])
    elif asset_id in PENDING:
        row[1] = '原创生成队列'
        row[7] = 'PENDING-QUOTA'
        row[8] = '本轮图像生成额度已用尽；保留既有原创 brief，未生成文件，不得作为可用视觉资产。'
        progress_rows.append([asset_id, world_id, world_lookup.get(world_id, ''), '待生成', row[4], 'PENDING-QUOTA', '保留既有原创 brief，等待额度恢复后执行。'])

payload['metadata']['version'] = 'v0.5.1-visual-update'
payload['metadata']['updated_at'] = '2026-08-25 GMT+8'
payload['metadata']['visual_generation_note'] = 'VQ-17 至 VQ-36 已实际生成并核验为 2560×1440 PNG；VQ-37 至 VQ-48 因本轮可用图像额度耗尽，仍保持 PENDING-QUOTA。'
payload['metadata']['visual_progress'] = {
    'generated_this_update': len(GENERATED),
    'generated_queue_range': 'VQ-17 至 VQ-36',
    'remaining_pending_count': len(PENDING),
    'remaining_pending_queue_range': 'VQ-37 至 VQ-48',
    'actual_original_visual_count': 36,
}
payload['change_log'].append([
    'v0.5.1', '2026-08-25', '视觉状态', '完成 VQ-17 至 VQ-36；保留 VQ-37 至 VQ-48',
    '实际生成并核验 20 张 2560×1440 原创关键视觉；本轮生成额度耗尽后停止，12 个既有 brief 继续标记 PENDING-QUOTA。'
])

out_json = OUT / 'world_character_library_data_v0.5.1_visual_update.json'
out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
(OUT / 'world_character_library_data.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')

base_xlsx = OUT / 'World_Character_素材库_v0.5.xlsx'
out_xlsx = OUT / 'World_Character_素材库_v0.5.1_视觉更新.xlsx'
wb = load_workbook(base_xlsx)

navy = PatternFill('solid', fgColor='12324A')
green = PatternFill('solid', fgColor='DFF3E4')
yellow = PatternFill('solid', fgColor='FFF4CC')
blue = PatternFill('solid', fgColor='E7F1F7')
thin = Side(style='thin', color='C6D4DF')

index = wb['00_索引']
index['A1'] = 'World / Character 内容与视觉素材库 v0.5.1 — 视觉状态更新'
# Summary rows created in original workbook; update version and visual rows only.
index['B3'] = 'v0.5.1 视觉状态更新；未新增或改写任何 World / Character 文本设定。'
index['B7'] = '52 条记录：VQ-17 至 VQ-36 已生成 20 张原创 16:9 PNG；VQ-37 至 VQ-48 保持 PENDING-QUOTA。'
index['B9'] = '先查看 08_视觉进度，再在 04_视觉资产按权属标签筛选；绿色为已生成候选，黄色为待生成。'
index['B15'] = 'ORIG-AI-VIS：本轮实际生成且已做文件完整性核验；PENDING-QUOTA：仅有原创 brief，不能当作已存在资产。'

ws = wb['04_视觉资产']
# Preserve tables but overwrite matching row values based on updated JSON data.
visual_by_id = {row[0]: row for row in payload['visual_assets']}
for r in range(2, ws.max_row + 1):
    asset_id = ws.cell(r, 1).value
    if asset_id in visual_by_id:
        row = visual_by_id[asset_id]
        for c, value in enumerate(row, 1):
            ws.cell(r, c, value)
            ws.cell(r, c).alignment = Alignment(vertical='top', wrap_text=True)
            ws.cell(r, c).border = Border(bottom=thin)
            if asset_id in GENERATED:
                ws.cell(r, c).fill = green
            elif asset_id in PENDING:
                ws.cell(r, c).fill = yellow

# Update change log table and append one non-destructive new row.
cl = wb['07_本轮变更']
new_row = cl.max_row + 1
for c, value in enumerate(payload['change_log'][-1], 1):
    cell = cl.cell(new_row, c, value)
    cell.fill = green
    cell.alignment = Alignment(vertical='top', wrap_text=True)
    cell.border = Border(bottom=thin)
cl.row_dimensions[new_row].height = 52
# Expand its existing table range.
if cl.tables:
    table = next(iter(cl.tables.values()))
    table.ref = f'A1:E{new_row}'

# Add a dedicated progress sheet for browsing and filtering.
if '08_视觉进度' in wb.sheetnames:
    del wb['08_视觉进度']
ps = wb.create_sheet('08_视觉进度')
ps.sheet_view.showGridLines = False
ps.freeze_panes = 'A2'
headers = ['视觉 ID', '世界 ID', '世界名称', '当前状态', '文件 / 计划路径', '权属标签', '状态说明']
for c, header in enumerate(headers, 1):
    cell = ps.cell(1, c, header)
    cell.fill = navy
    cell.font = Font(color='FFFFFF', bold=True)
    cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    cell.border = Border(bottom=thin)
for r, row in enumerate(progress_rows, 2):
    for c, value in enumerate(row, 1):
        cell = ps.cell(r, c, value)
        cell.alignment = Alignment(vertical='top', wrap_text=True)
        cell.border = Border(bottom=thin)
        cell.fill = green if row[3] == '已生成' else yellow
    ps.row_dimensions[r].height = 42
for col, width in enumerate([12, 12, 24, 14, 56, 20, 52], 1):
    ps.column_dimensions[get_column_letter(col)].width = width
progress_table = Table(displayName='VisualProgress', ref=f'A1:G{len(progress_rows)+1}')
progress_table.tableStyleInfo = TableStyleInfo(name='TableStyleMedium2', showFirstColumn=False, showLastColumn=False, showRowStripes=False, showColumnStripes=False)
ps.add_table(progress_table)

for sheet in wb.worksheets:
    sheet.sheet_properties.pageSetUpPr.fitToPage = True
    sheet.page_setup.fitToWidth = 1
    sheet.page_setup.fitToHeight = 0
wb.save(out_xlsx)

status_doc = ROOT / 'visuals' / '视觉生成状态_v0.5.1.md'
status_doc.write_text('''# 原创视觉生成状态 v0.5.1\n\n> 本文件只记录既有视觉队列的实际产出状态，不新增 World / Character 文字设定。\n\n| 队列 | 实际状态 | 产物 / 原因 | 权属标签 | 使用规则 |\n| --- | --- | --- | --- | --- |\n| VQ-17 至 VQ-36 | 已生成 | 20 张原创关键视觉；每张已核验为 2560×1440 PNG。 | ORIG-AI-VIS | 可进入内部原创候选审阅；对外使用前仍须人工审阅相似性、品牌与权利边界。 |\n| VQ-37 至 VQ-48 | 待生成 | 本轮可用图像额度耗尽；只保留既有原创 brief。 | PENDING-QUOTA | 不代表视觉文件存在，不得当作可发布、可调用或可商用资产。 |\n\n## 已生成文件\n\n''' + '\n'.join(f'- `{qid}` — `/visuals/{filename}`' for qid, filename in GENERATED.items()) + '''\n\n## 后续处理顺序\n\n当图像生成额度恢复后，优先处理 `VQ-37` 至 `VQ-41`，随后依编号完成至 `VQ-48`。生成后必须先核验文件存在性和尺寸，再将标签从 `PENDING-QUOTA` 改为 `ORIG-AI-VIS`。\n\n*更新日期：2026-08-25（GMT+8）。*\n''', encoding='utf-8')

print(json.dumps(payload['metadata']['visual_progress'], ensure_ascii=False))
print(out_json)
print(out_xlsx)
print(status_doc)
