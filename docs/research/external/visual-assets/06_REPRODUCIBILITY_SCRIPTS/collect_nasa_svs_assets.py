from pathlib import Path
import csv
import json
import time
import requests

ROOT = Path('/home/ubuntu/ai_world_moodboard')
OUT = ROOT / 'staging' / 'nasa_svs'
OUT.mkdir(parents=True, exist_ok=True)
THUMBS = OUT / 'thumbnails'
THUMBS.mkdir(exist_ok=True)
HEADERS = {'User-Agent': 'ManusVisualAssetResearch/1.0'}
API = 'https://svs.gsfc.nasa.gov/api/search/'

# Multiple editorial queries keep the result set grounded in world-simulation production scenarios.
queries = ['earth weather', 'climate carbon temperature', 'ocean ecology', 'night lights city population', 'cloud atmosphere', 'galaxy exoplanet']
keywords = [
    'earth', 'weather', 'climate', 'carbon', 'temperature', 'ocean', 'ecology', 'forest', 'fire', 'water',
    'night', 'city', 'population', 'cloud', 'atmosphere', 'wind', 'storm', 'map', 'data', 'galaxy', 'exoplanet',
]

def fetch_json(url, params=None):
    res = requests.get(url, params=params, headers=HEADERS, timeout=60)
    res.raise_for_status()
    return res.json()

def relevance(result):
    text = (result.get('title','') + ' ' + result.get('description','')).lower()
    return sum(1 for keyword in keywords if keyword in text) * 1000000 + result.get('hits', 0)

existing_urls = set()
manifest = ROOT / 'final' / 'asset_manifest.csv'
if manifest.exists():
    with manifest.open(encoding='utf-8', newline='') as f:
        existing_urls = {row.get('来源链接','') for row in csv.DictReader(f)}

candidates = {}
for query in queries:
    result = fetch_json(API, {'search': query, 'limit': 35})
    for item in result.get('results', []):
        if item.get('result_type') != 'Visualization':
            continue
        if item.get('url') in existing_urls:
            continue
        candidates[item['id']] = item

ranked = sorted(candidates.values(), key=relevance, reverse=True)
# Balance subjects in the top set to avoid climate-only visualizations.
targeted = []
subject_terms = [
    ('weather', ['weather','storm','cloud','wind','atmosphere']),
    ('climate', ['climate','carbon','temperature','fire','greenhouse']),
    ('ocean', ['ocean','sea','water','coast','ice']),
    ('civilization', ['night','city','population','human','emission']),
    ('cosmos', ['galaxy','exoplanet','planet','universe','space']),
]
used_ids = set()
for _, terms in subject_terms:
    matching = [item for item in ranked if item['id'] not in used_ids and any(term in (item.get('title','')+' '+item.get('description','')).lower() for term in terms)]
    for item in matching[:4]:
        targeted.append(item)
        used_ids.add(item['id'])
# Fill any shortfall with highest remaining research-relevant pages.
for item in ranked:
    if len(targeted) >= 20:
        break
    if item['id'] not in used_ids:
        targeted.append(item)
        used_ids.add(item['id'])

def theme_for(item):
    text = (item.get('title','') + ' ' + item.get('description','')).lower()
    if any(term in text for term in ['night light', 'city', 'population', 'human made', 'emission']):
        return '文明与世界状态可视化'
    if any(term in text for term in ['weather', 'storm', 'cloud', 'wind', 'atmosphere']):
        return '天气、时间与动态世界'
    if any(term in text for term in ['ocean', 'sea', 'water', 'ice', 'coast', 'ecology']):
        return '自然生态与科学地图'
    if any(term in text for term in ['galaxy', 'exoplanet', 'planet', 'universe', 'space']):
        return '宇宙与科幻地点可视化'
    return '气候与世界状态可视化'

def use_for(item):
    return {
        '文明与世界状态可视化': '文明活性、城市光照、人口、资源和排放等宏观状态图层',
        '天气、时间与动态世界': '天气、昼夜、云层、气流与时间推进的动态背景或系统视图',
        '自然生态与科学地图': '海洋、陆地、水循环、生态和科学地图的世界状态表达',
        '宇宙与科幻地点可视化': '宇宙世界种子、行星设定、航线和科幻世界宣传视觉',
        '气候与世界状态可视化': '气候、灾变、长期趋势和因果状态的可解释系统视觉',
    }[theme_for(item)]

rows = []
for index, item in enumerate(targeted, start=1):
    details = fetch_json(f'https://svs.gsfc.nasa.gov/api/{item["id"]}/')
    image = details.get('main_image') or {}
    thumbnail = image.get('url','')
    # Use a stable page URL from the API, not the image alone, as the legal/source anchor.
    if thumbnail:
        try:
            im = requests.get(thumbnail, headers=HEADERS, timeout=60)
            if im.ok:
                ext = '.png' if 'png' in im.headers.get('content-type','').lower() else '.jpg'
                (THUMBS / f'N{index:02d}{ext}').write_bytes(im.content)
        except Exception as exc:
            print('thumbnail skipped', item['id'], exc)
    description = details.get('description') or item.get('description','')
    credits = details.get('credits','')
    rows.append({
        'id': f'N{index:02d}',
        '主题': theme_for(item),
        '标题或描述': details.get('title', item.get('title','')),
        '来源线索': 'NASA Scientific Visualization Studio / 官方具体可视化页',
        '来源链接': details.get('url', item['url']),
        '适合用在哪里': use_for(item),
        '可借鉴的视觉特点': description.replace('||', ' ').strip()[:700],
        '风格关键词': 'NASA SVS 科学可视化 动态地图 世界状态 ' + theme_for(item),
        '权利分级': 'A-条件可用',
        '使用边界': '使用前查看具体 NASA SVS 页面与 credit；NASA 标识、机构标识和任何第三方素材不得用于产品背书。应在最终素材采用记录中保存页面 URL、credit、下载文件和版本。',
        'main_image': thumbnail,
        'release_date': details.get('release_date',''),
        'credits': str(credits)[:1000],
    })
    time.sleep(0.15)

fields = ['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界','main_image','release_date','credits']
with (OUT / 'nasa_svs_candidates.csv').open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
summary = {'selected_count': len(rows), 'by_theme': {theme: len([r for r in rows if r['主题'] == theme]) for theme in sorted({r['主题'] for r in rows})}}
(OUT / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
for row in rows:
    print(row['id'], row['主题'], row['标题或描述'], row['来源链接'])
