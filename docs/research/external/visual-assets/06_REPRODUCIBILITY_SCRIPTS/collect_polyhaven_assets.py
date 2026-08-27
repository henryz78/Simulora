from pathlib import Path
import csv
import json
import re
import requests

ROOT = Path('/home/ubuntu/ai_world_moodboard')
OUT = ROOT / 'staging' / 'polyhaven'
OUT.mkdir(parents=True, exist_ok=True)
API = 'https://api.polyhaven.com/assets'
HEADERS = {'User-Agent': 'ManusVisualAssetResearch/1.0'}

response = requests.get(API, headers=HEADERS, timeout=60)
response.raise_for_status()
assets = response.json()
(OUT / 'raw_assets.json').write_text(json.dumps(assets, ensure_ascii=False), encoding='utf-8')

# Select a production-relevant cross-section rather than indiscriminately harvesting the catalogue.
keyword_sets = {
    0: ['forest', 'nature', 'mountain', 'sunset', 'sunrise', 'dawn', 'dusk', 'night', 'city', 'street', 'industrial', 'field', 'garden', 'park', 'cave', 'cloud', 'overcast', 'snow', 'lake', 'coast', 'water'],
    1: ['grass', 'ground', 'soil', 'dirt', 'rock', 'stone', 'moss', 'sand', 'snow', 'wood', 'bark', 'brick', 'concrete', 'paving', 'tile', 'metal', 'fabric', 'plaster'],
    2: ['building', 'house', 'urban', 'street', 'alley', 'door', 'window', 'furniture', 'lamp', 'bench', 'tree', 'plant', 'industrial', 'market', 'wall', 'stairs', 'vehicle', 'prop'],
}
limits = {0: 12, 1: 10, 2: 8}

def text_for(meta):
    return ' '.join([
        meta.get('name', ''), meta.get('description', ''), meta.get('category', ''),
        ' '.join(meta.get('tags', [])),
        ' '.join(str(v) for v in meta.get('attributes', {}).values()),
    ]).lower()

def score(meta, asset_type):
    text = text_for(meta)
    hits = sum(1 for keyword in keyword_sets[asset_type] if keyword in text)
    downloads = meta.get('download_count', 0)
    resolution = max(meta.get('max_resolution', [0]) or [0])
    # Diversity-friendly ranking: semantic relevance dominates, then catalogue popularity and available detail.
    return hits * 100000000 + min(downloads, 10000000) * 10 + resolution

def asset_theme(asset_type):
    return {0: 'HDRI与环境光照', 1: 'PBR材质与表面', 2: '3D建筑与道具'}[asset_type]

def production_use(asset_type, category, tags):
    text = (category + ' ' + ' '.join(tags)).lower()
    if asset_type == 0:
        if any(k in text for k in ['city', 'street', 'town', 'industrial']):
            return '现代城市、文明地点与夜间／天气光照原型'
        return '世界环境、天气时间变化与 3D 场景环境光照'
    if asset_type == 1:
        if any(k in text for k in ['grass', 'soil', 'dirt', 'rock', 'moss', 'sand', 'snow']):
            return '自然生态、地形、村庄与户外世界表面'
        return '现代建筑、室内空间、道具与城市表面材质'
    if any(k in text for k in ['building', 'house', 'street', 'urban']):
        return '城市、村庄、现代地点和文明空间原型'
    return '可交互地点、室内外场景和世界道具原型'

def visual_note(asset_type, meta):
    tags = ', '.join(meta.get('tags', [])[:6])
    category = meta.get('category', '未分类')
    if asset_type == 0:
        return f"真实环境光与反射信息；分类为 {category}；标签：{tags}"
    if asset_type == 1:
        return f"无缝 PBR 表面细节；分类为 {category}；标签：{tags}"
    return f"真实扫描 3D 物件细节；分类为 {category}；标签：{tags}"

selected = []
for asset_type in (0, 1, 2):
    pool = []
    for asset_id, meta in assets.items():
        if meta.get('type') != asset_type:
            continue
        # Require at least one subject-relevant hit in name/category/tags/description.
        if not any(k in text_for(meta) for k in keyword_sets[asset_type]):
            continue
        pool.append((score(meta, asset_type), asset_id, meta))
    pool.sort(reverse=True, key=lambda item: item[0])
    # Cap one closely identical prefix family where possible to increase useful diversity.
    used_prefixes = set()
    chosen = []
    for _, asset_id, meta in pool:
        prefix = re.sub(r'_[0-9]+$', '', asset_id)
        if prefix in used_prefixes and len(pool) > limits[asset_type] * 2:
            continue
        used_prefixes.add(prefix)
        chosen.append((asset_id, meta))
        if len(chosen) == limits[asset_type]:
            break
    selected.extend(chosen)

rows = []
for index, (asset_id, meta) in enumerate(selected, start=1):
    asset_type = meta['type']
    authors = ', '.join(meta.get('authors', {}).keys()) or 'Poly Haven'
    res = '×'.join(str(v) for v in meta.get('max_resolution', [])[:2]) or '见单件下载页'
    rows.append({
        'id': f'PH{index:02d}',
        '主题': asset_theme(asset_type),
        '标题或描述': meta.get('name', asset_id),
        '来源线索': f'Poly Haven / {authors}',
        '来源链接': f'https://polyhaven.com/a/{asset_id}',
        '适合用在哪里': production_use(asset_type, meta.get('category', ''), meta.get('tags', [])),
        '可借鉴的视觉特点': visual_note(asset_type, meta),
        '风格关键词': ' '.join(meta.get('tags', [])[:10]),
        '权利分级': 'A-可实际使用',
        '使用边界': f'Poly Haven 原始资产为 CC0；通过单件页下载原始文件，记录版本与作者。API 记录的最大分辨率：{res}。不得复用网站 logo、网页文案或示例 render。',
        'asset_id': asset_id,
        'asset_type': {0: 'HDRI', 1: 'PBR Texture', 2: '3D Model'}[asset_type],
        'thumbnail_url': meta.get('thumbnail_url', ''),
        'category': meta.get('category', ''),
    })

fieldnames = ['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界','asset_id','asset_type','thumbnail_url','category']
with (OUT / 'polyhaven_candidates.csv').open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

# Download small official thumbnails only for the visual browsing sheet; production downloads must come from the source pages.
thumb_dir = OUT / 'thumbnails'
thumb_dir.mkdir(exist_ok=True)
for row in rows:
    url = row['thumbnail_url']
    if not url:
        continue
    thumb = requests.get(url, headers=HEADERS, timeout=30)
    thumb.raise_for_status()
    suffix = '.png' if 'png' in thumb.headers.get('content-type', '').lower() else '.jpg'
    (thumb_dir / f"{row['id']}_{row['asset_id']}{suffix}").write_bytes(thumb.content)

summary = {
    'selected_count': len(rows),
    'by_type': {label: len([r for r in rows if r['asset_type'] == label]) for label in ['HDRI','PBR Texture','3D Model']},
    'source_api': API,
}
(OUT / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
for row in rows:
    print(row['id'], row['asset_type'], row['标题或描述'], row['来源链接'])
