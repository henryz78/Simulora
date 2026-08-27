from pathlib import Path
import csv
import json
from urllib.parse import urlparse
from collections import Counter

ROOT = Path('/home/ubuntu/ai_world_moodboard')
MANIFEST = ROOT / 'final' / 'asset_manifest.csv'
OUT = ROOT / 'final'
FIELDS = ['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界']

with MANIFEST.open(encoding='utf-8', newline='') as f:
    rows = list(csv.DictReader(f))

# Direct sources observed on official pages or returned from a targeted source search.
updates = {
    'E10': {
        '来源链接': 'https://svs.gsfc.nasa.gov/5190/',
        '来源线索': 'NASA SVS / NASA Climate Spiral 1880-Present（官方单件页）',
        '权利分级': 'A-条件可用',
        '使用边界': '已补官方单件页。使用前保存具体 credit、下载文件和版本；不得使用 NASA 标识或暗示背书。',
    },
    'E17': {
        '来源链接': 'https://americanhistory.si.edu/collections/object/nmah_1692385',
        '来源线索': 'Smithsonian NMAH / 1831 World Map by Marianne S. Fernald（具体对象页）',
        '权利分级': 'M-待确认',
        '使用边界': '已补具体对象页，但本次未核得 CC0／Public Domain 单件标识；在取得权利元数据前仅作参考，不进入生产下载队列。',
    },
    'E24': {
        '来源链接': 'https://kenney.nl/assets/mini-characters',
        '来源线索': 'Kenney / Mini Characters（官方单件页）',
        '权利分级': 'A-可实际使用',
        '使用边界': '官方单件页标注 Creative Commons CC0 并提供下载；保留下载包内 license 文件，不使用 Kenney logo。',
    },
    'E27': {
        '来源链接': 'https://quaternius.com/packs/ultimatedanimatedcharacter.html',
        '来源线索': 'Quaternius / Ultimate Animated Character Pack（官方单件页）',
        '权利分级': 'A-可实际使用',
        '使用边界': '已补官方 pack 页；页面与下载包中的 CC0 声明为准，保存所用版本与 license 文件。',
    },
    'E28': {
        '来源链接': 'https://quaternius.com/packs/modularcharacteroutfitsfantasy.html',
        '来源线索': 'Quaternius / Modular Character Outfits - Fantasy（官方单件页）',
        '权利分级': 'C-灵感参考',
        '使用边界': '已由 Q09 提供同一资源的精确生产记录；此旧记录只保留为视觉参考，生产选型使用 Q09。',
    },
    'E33': {
        '来源链接': 'https://eclair-assets.itch.io/nature-kit-glb-pack-329-free-cc0-3d-models',
        '来源线索': 'Eclair Assets / Nature Kit GLB Pack（itch.io 单件页）',
        '权利分级': 'A-可实际使用',
        '使用边界': '已补具体 itch.io 页面；条目宣称 CC0，下载时保留该页和包内 license 文件。',
    },
    'E34': {
        '来源链接': 'https://quaternius.com/packs/stylizednaturemegakit.html',
        '来源线索': 'Quaternius / Stylized Nature MegaKit（官方单件页）',
        '权利分级': 'A-可实际使用',
        '使用边界': '已补官方 pack 页；页面与下载包中的 CC0 声明为准，保存所用版本与 license 文件。',
    },
    'E36': {
        '来源链接': 'https://blog.polyhaven.com/hidden-alley/',
        '来源线索': 'Poly Haven / Hidden Alley Community Project（官方项目页）',
        '权利分级': 'A-条件可用',
        '使用边界': '已补官方项目页。仅从项目页链接下载标明 CC0 的场景或组成资产；不可使用网站 logo、网页图文或将项目名用于背书。',
    },
    'E38': {
        '来源链接': 'https://quaternius.com/packs/fantasypropsmegakit.html',
        '来源线索': 'Quaternius / Fantasy Props MegaKit（官方单件页）',
        '权利分级': 'C-灵感参考',
        '使用边界': '已由 Q04 提供同一资源的精确生产记录；此旧记录只保留为视觉参考，生产选型使用 Q04。',
    },
    'E39': {
        '来源链接': 'https://blog.polyhaven.com/hidden-alley/',
        '来源线索': 'Poly Haven / Hidden Alley Community Project（官方项目页）',
        '权利分级': 'C-灵感参考',
        '使用边界': '与 E36 是同一项目的替代预览，保留为视觉参考；生产选型使用 E36 或 PH 系列的单件资源。',
    },
    'E46': {
        '来源链接': 'https://svs.gsfc.nasa.gov/4823/',
        '来源线索': 'NASA SVS / Draining the Oceans（官方单件页）',
        '权利分级': 'A-条件可用',
        '使用边界': '已补官方单件页；使用前保存具体 credit、下载文件和版本；不得使用 NASA 标识或暗示背书。',
    },
}

def is_root(url):
    if not url:
        return True
    parsed = urlparse(url)
    return parsed.path in ('','/') and not parsed.query

changes = []
for row in rows:
    before = row.copy()
    if row['id'] in updates:
        row.update(updates[row['id']])
    # Asset-channel entries are valuable research directions but are not themselves product assets.
    if row['id'].startswith('OPEN-'):
        row['权利分级'] = 'C-灵感参考'
        row['使用边界'] = '平台／馆藏渠道说明，不是单件资产。仅用于后续定位具体对象页；不得作为直接产品素材。'
    # Conservative rule: a root URL cannot substantiate A or L production status.
    if is_root(row['来源链接']) and (row['权利分级'].startswith('A-') or row['权利分级'].startswith('L-')):
        row['权利分级'] = 'M-待确认'
        row['使用边界'] = (row['使用边界'] + ' ' if row['使用边界'] else '') + '卫生清理：当前仅保存平台／站点主页，未能证明该截图或候选对应可下载的单件资产；已降级，需补具体页后方可恢复 A／L。'
    # Specific shared catalogue pages (but not a root) stay as M unless a record has been explicitly repaired above.
    if row['id'] in {'E18','E19','E20','E21','E40','E41','E42','E43','E44','E45','E47','E48','E49','E50','E51','E52','E53','E54','E55','E56','E57','E58','E59','E60','E61'}:
        if row['id'] not in updates:
            row['权利分级'] = 'M-待确认'
            row['使用边界'] = (row['使用边界'] + ' ' if row['使用边界'] else '') + '卫生清理：该记录仍为集合、搜索目录或平台级采购入口，未保存对应单件页面；不得直接纳入生产下载队列。'
    if row != before:
        changed = {k: {'before': before.get(k,''), 'after': row.get(k,'')} for k in FIELDS if before.get(k,'') != row.get(k,'')}
        changes.append({'id': row['id'], 'changes': changed})

with MANIFEST.open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDS)
    writer.writeheader()
    writer.writerows(rows)

log_rows = []
for entry in changes:
    for field, values in entry['changes'].items():
        log_rows.append({'id': entry['id'], 'field': field, 'before': values['before'], 'after': values['after']})
with (OUT/'MANIFEST_HYGIENE_CHANGES_03.csv').open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id','field','before','after'])
    writer.writeheader()
    writer.writerows(log_rows)
summary = {
    'changed_records': len(changes),
    'field_changes': len(log_rows),
    'final_tiers': dict(sorted(Counter(row['权利分级'] for row in rows).items())),
    'a_or_l_records_with_root_url': len([r for r in rows if is_root(r['来源链接']) and (r['权利分级'].startswith('A-') or r['权利分级'].startswith('L-'))]),
}
(OUT/'MANIFEST_HYGIENE_REMEDIATION_03.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
