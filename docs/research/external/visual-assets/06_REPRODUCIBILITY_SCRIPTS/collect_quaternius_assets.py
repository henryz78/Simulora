from pathlib import Path
import csv
import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

ROOT = Path('/home/ubuntu/ai_world_moodboard')
OUT = ROOT / 'staging' / 'quaternius'
OUT.mkdir(parents=True, exist_ok=True)
THUMBS = OUT / 'thumbnails'
THUMBS.mkdir(exist_ok=True)
BASE = 'https://quaternius.com/'
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; ManusVisualAssetResearch/1.0)'}

# Named priority families target the product's actual production needs, then selection is constrained to official pack links.
priorities = [
    'downtown city', 'medieval village', 'fantasy', 'stylized nature', 'ultimate nature', 'nature pack',
    'sci-fi', 'cyberpunk', 'space', 'spaceship', 'alien', 'mech', 'robot', 'train', 'car', 'transport',
    'animated character', 'animated men', 'animated women', 'modular character', 'rpg character', 'base character',
    'animation', 'animal', 'monster', 'dinosaur', 'fish', 'farm', 'buildings', 'house', 'furniture',
    'dungeon', 'ruins', 'props', 'crops', 'streets', 'interior',
]

def fetch(url):
    response = requests.get(url, headers=HEADERS, timeout=60)
    response.raise_for_status()
    return response

home = fetch(BASE)
soup = BeautifulSoup(home.text, 'html.parser')
records = []
seen = set()
for a in soup.find_all('a', href=True):
    href = urljoin(BASE, a['href'])
    if '/packs/' not in href or not href.endswith('.html'):
        continue
    title = a.get_text(' ', strip=True)
    # Home-page pack cards are image-only anchors. Use the stable filename as an initial searchable label;
    # the canonical display title is then read from the individual pack page.
    if not title:
        title = href.rsplit('/', 1)[-1].replace('.html', '').replace('_', ' ')
    if title.lower() in {'download', 'assets'} or href in seen:
        continue
    seen.add(href)
    records.append({'title': title, 'url': href})

def score(record):
    lower = record['title'].lower()
    hits = sum(1 for term in priorities if term in lower)
    # Put especially exact setting-match items first.
    bonus = 0
    for term in ['city', 'village', 'character', 'nature', 'sci-fi', 'cyberpunk', 'animation', 'dungeon', 'spaceship']:
        if term in lower:
            bonus += 100
    return hits * 1000 + bonus

records.sort(key=lambda record: (-score(record), record['title']))
# Select 30 diverse pack pages; avoid repeats from nearly identical display names.
chosen = []
for record in records:
    if record['title'].lower() in {c['title'].lower() for c in chosen}:
        continue
    chosen.append(record)
    if len(chosen) == 30:
        break

def extract_meta(record):
    res = fetch(record['url'])
    pack = BeautifulSoup(res.text, 'html.parser')
    title = pack.find('h1')
    if title:
        record['title'] = title.get_text(' ', strip=True)
    elif pack.title:
        record['title'] = pack.title.get_text(' ', strip=True).replace('Quaternius • ', '').strip()
    desc = pack.find('meta', attrs={'name': 'description'}) or pack.find('meta', attrs={'property': 'og:description'})
    image = pack.find('meta', attrs={'property': 'og:image'})
    record['description'] = desc.get('content','').strip() if desc else ''
    record['image'] = urljoin(record['url'], image.get('content','').strip()) if image else ''
    body_text = pack.get_text(' ', strip=True)
    record['cc0_assertion'] = 'CC0' in body_text
    formats = [fmt for fmt in ['FBX', 'GLB', 'glTF', 'OBJ', 'Blend'] if fmt.lower() in body_text.lower()]
    record['formats'] = ', '.join(formats)
    return record

def theme_for(record):
    text = record['title'].lower()
    if any(k in text for k in ['character', 'men', 'women', 'human', 'animation']):
        return '角色与角色动画资产'
    if any(k in text for k in ['animal', 'monster', 'dinosaur', 'fish', 'alien']):
        return '生物与生态资产'
    if any(k in text for k in ['city', 'village', 'building', 'house', 'street', 'train', 'car', 'transport', 'furniture', 'interior']):
        return '城市、村庄与现代地点资产'
    if any(k in text for k in ['sci-fi', 'space', 'spaceship', 'robot', 'mech', 'cyberpunk']):
        return '科幻地点与文明资产'
    if any(k in text for k in ['nature', 'crops', 'farm', 'tree']):
        return '自然生态与世界环境资产'
    return '奇幻地点、建筑与道具资产'

def use_for(record):
    return {
        '角色与角色动画资产': '居民生成、职业差异、情绪与移动／行为动画验证',
        '生物与生态资产': '世界生物群落、物种图鉴、生态状态与事件原型',
        '城市、村庄与现代地点资产': '大型文明、小型社区、室内外地点和现代生活场景',
        '科幻地点与文明资产': '科幻基地、星际文明、机械世界和科技派系场景',
        '自然生态与世界环境资产': '生态区、季节变化、农业、森林与开放世界地形',
        '奇幻地点、建筑与道具资产': '奇幻村庄、遗迹、地下城、叙事道具与地点身份化',
    }[theme_for(record)]

final_records = []
for record in chosen:
    try:
        final_records.append(extract_meta(record))
    except Exception as exc:
        print('SKIP', record['url'], exc)
    time.sleep(0.2)

rows = []
for idx, record in enumerate(final_records, start=1):
    if record.get('image'):
        try:
            im = requests.get(record['image'], headers=HEADERS, timeout=45)
            if im.ok:
                ext = '.png' if 'png' in im.headers.get('content-type','').lower() else '.jpg'
                (THUMBS / f'Q{idx:02d}{ext}').write_bytes(im.content)
        except Exception as exc:
            print('THUMBNAIL SKIP', record['image'], exc)
    rows.append({
        'id': f'Q{idx:02d}',
        '主题': theme_for(record),
        '标题或描述': record['title'],
        '来源线索': 'Quaternius / 官方单项 pack page',
        '来源链接': record['url'],
        '适合用在哪里': use_for(record),
        '可借鉴的视觉特点': record['description'] or '统一低多边形 3D 资产包，适合以模块化方式快速验证世界地点与行为表达。',
        '风格关键词': f"Quaternius CC0 3D {record['title']} {record['formats']}",
        '权利分级': 'A-可实际使用' if record['cc0_assertion'] else 'M-待确认',
        '使用边界': '单项页面的 CC0 声明与下载包 license 为最终依据。部分标准包可能只提供一部分免费文件，完整包／源文件可能需购买；但页面标明的 CC0 文件可用于个人、教育与商业项目。保留具体下载版本与 license 文件。',
        'preview_image': record.get('image',''),
        'formats': record.get('formats',''),
        'cc0_assertion': record.get('cc0_assertion', False),
    })

fields = ['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界','preview_image','formats','cc0_assertion']
with (OUT / 'quaternius_candidates.csv').open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
summary = {'selected_count': len(rows), 'cc0_asserted': len([r for r in rows if r['cc0_assertion']]), 'by_theme': {theme: len([r for r in rows if r['主题'] == theme]) for theme in sorted({r['主题'] for r in rows})}}
(OUT / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
for row in rows:
    print(row['id'], row['权利分级'], row['标题或描述'], row['来源链接'])
