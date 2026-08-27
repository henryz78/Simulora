from pathlib import Path
import csv
import json
import re
import time
import requests
from bs4 import BeautifulSoup

ROOT = Path('/home/ubuntu/ai_world_moodboard')
OUT = ROOT / 'staging' / 'kenney'
OUT.mkdir(parents=True, exist_ok=True)
THUMBS = OUT / 'thumbnails'
THUMBS.mkdir(exist_ok=True)
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; ManusVisualAssetResearch/1.0)'}

collections = [
    ('3D', 'https://kenney.nl/assets/category:3D', 4, 18),
    ('2D', 'https://kenney.nl/assets/category:2D', 4, 10),
    ('UI', 'https://kenney.nl/assets/tag:interface', 2, 4),
    ('Textures', 'https://kenney.nl/assets/category:Textures', 2, 4),
]

# Titles that serve world simulation prototypes get a substantial priority boost.
keywords = [
    'city', 'town', 'village', 'building', 'road', 'street', 'factory', 'industrial', 'commercial',
    'forest', 'nature', 'cave', 'dungeon', 'graveyard', 'pirate', 'space', 'sci-fi', 'blaster',
    'character', 'pet', 'animal', 'rpg', 'roguelike', 'platformer', 'isometric', 'furniture', 'food',
    'car', 'transport', 'train', 'vehicle', 'map', 'tile', 'ui', 'interface', 'texture', 'sprite',
]

def page_url(base, page):
    return base if page == 1 else f'{base}/page:{page}'

def collect_directory(label, base, pages):
    records = []
    for page in range(1, pages + 1):
        res = requests.get(page_url(base, page), headers=HEADERS, timeout=45)
        if not res.ok:
            print(f'SKIP directory page {page_url(base, page)}: HTTP {res.status_code}')
            continue
        soup = BeautifulSoup(res.text, 'html.parser')
        for h2 in soup.find_all('h2'):
            a = h2.find('a', href=True)
            if not a:
                continue
            title = a.get_text(' ', strip=True)
            href = a['href']
            if not href.startswith('https://kenney.nl/assets/'):
                continue
            records.append({'title': title, 'url': href, 'collection': label})
        time.sleep(0.2)
    # retain physical directory order but de-duplicate page overlap
    unique = []
    seen = set()
    for record in records:
        if record['url'] not in seen:
            seen.add(record['url'])
            unique.append(record)
    return unique

def score(record):
    text = record['title'].lower()
    return sum(1 for keyword in keywords if keyword in text) * 1000

def get_meta(record):
    res = requests.get(record['url'], headers=HEADERS, timeout=45)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, 'html.parser')
    desc = soup.find('meta', attrs={'name': 'description'})
    if not desc:
        desc = soup.find('meta', attrs={'property': 'og:description'})
    img = soup.find('meta', attrs={'property': 'og:image'})
    record['description'] = desc.get('content', '').strip() if desc else ''
    record['image'] = img.get('content', '').strip() if img else ''
    return record

def theme_for(record):
    title = record['title'].lower()
    collection = record['collection']
    if any(k in title for k in ['character', 'pet', 'animal', 'rpg', 'roguelike']):
        return '角色、生物与居民资产'
    if any(k in title for k in ['city', 'town', 'building', 'road', 'factory', 'commercial', 'industrial', 'transport', 'car', 'train']):
        return '城市、村庄与文明资产'
    if any(k in title for k in ['forest', 'nature', 'cave', 'dungeon', 'graveyard', 'pirate']):
        return '自然、奇幻地点与生态资产'
    if any(k in title for k in ['space', 'sci-fi', 'blaster']):
        return '科幻地点与文明资产'
    if collection == 'UI':
        return '世界UI与图标资产'
    if collection == 'Textures':
        return '2D纹理与地图表面'
    return '2D世界与地图资产'

def use_for(record):
    theme = theme_for(record)
    return {
        '角色、生物与居民资产': '居民原型、职业体系、生物图鉴和行为状态验证',
        '城市、村庄与文明资产': '城市、村庄、交通、商业与工业地点的快速原型',
        '自然、奇幻地点与生态资产': '自然生态、地下空间、冒险地点和奇幻世界原型',
        '科幻地点与文明资产': '科幻基地、星际文明、装备和世界事件原型',
        '世界UI与图标资产': '世界画布图标、资源状态、地图控制与运营界面',
        '2D纹理与地图表面': '2D 地图、地块、背景和低成本原型表面',
        '2D世界与地图资产': '世界地图、像素地点、卡片和低保真体验原型',
    }[theme]

all_records = []
for label, base, pages, quota in collections:
    directory = collect_directory(label, base, pages)
    # Strong topical items first, then use catalogue order to preserve variety.
    ordered = sorted(enumerate(directory), key=lambda pair: (-score(pair[1]), pair[0]))
    selected = [record for _, record in ordered[:quota]]
    all_records.extend(selected)

# Dedupe again across categories, then get each precise asset page / preview image.
seen = set()
final_records = []
for record in all_records:
    if record['url'] in seen:
        continue
    seen.add(record['url'])
    final_records.append(get_meta(record))
    time.sleep(0.2)

rows = []
for idx, record in enumerate(final_records, start=1):
    if record['image']:
        image_response = requests.get(record['image'], headers=HEADERS, timeout=45)
        if image_response.ok:
            suffix = '.png' if 'png' in image_response.headers.get('content-type','').lower() else '.jpg'
            (THUMBS / f'K{idx:02d}{suffix}').write_bytes(image_response.content)
    rows.append({
        'id': f'K{idx:02d}',
        '主题': theme_for(record),
        '标题或描述': record['title'],
        '来源线索': f"Kenney / 官方 {record['collection']} 资产页",
        '来源链接': record['url'],
        '适合用在哪里': use_for(record),
        '可借鉴的视觉特点': record['description'] or '统一风格的可下载游戏资产包，适合快速验证场景层级与物件可读性。',
        '风格关键词': f"Kenney {record['collection']} CC0 资产包 {record['title']}",
        '权利分级': 'A-可实际使用',
        '使用边界': 'Kenney 官方支持页说明资产页游戏资产为 CC0，可用于商业项目且无需署名；应保留单件页和下载包内 license 文件，不得使用 Kenney logo。',
        'preview_image': record['image'],
        'asset_category': record['collection'],
    })

fields = ['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界','preview_image','asset_category']
with (OUT / 'kenney_candidates.csv').open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
summary = {'selected_count': len(rows), 'by_catalogue': {label: len([r for r in rows if r['asset_category'] == label]) for label, *_ in collections}}
(OUT / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
for row in rows:
    print(row['id'], row['asset_category'], row['标题或描述'], row['来源链接'])
