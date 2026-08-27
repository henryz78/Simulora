from pathlib import Path
import csv
import json
import shutil
from collections import Counter

ROOT = Path('/home/ubuntu/ai_world_moodboard')
FINAL = ROOT / 'final'
MANIFEST = FINAL / 'asset_manifest.csv'
OUT_APPEND = FINAL / 'EXPANSION_02_新增单件资产记录.csv'
PROD_REFS = ROOT / 'assets' / 'references_production'
PROD_REFS.mkdir(parents=True, exist_ok=True)

base_fields = ['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界']
sources = [
    ROOT / 'staging' / 'polyhaven' / 'polyhaven_candidates.csv',
    ROOT / 'staging' / 'kenney' / 'kenney_candidates.csv',
    ROOT / 'staging' / 'quaternius' / 'quaternius_candidates.csv',
    ROOT / 'staging' / 'nasa_svs' / 'nasa_svs_candidates.csv',
]

with MANIFEST.open(encoding='utf-8', newline='') as f:
    original = list(csv.DictReader(f))
existing_ids = {row['id'] for row in original}
existing_urls = {row['来源链接'] for row in original if row['来源链接']}
new_rows = []
for source in sources:
    with source.open(encoding='utf-8', newline='') as f:
        for raw in csv.DictReader(f):
            row = {field: raw.get(field,'') for field in base_fields}
            if row['id'] in existing_ids:
                raise ValueError(f'Duplicate id: {row["id"]}')
            if row['来源链接'] in existing_urls:
                print('SKIP duplicate URL', row['来源链接'])
                continue
            new_rows.append(row)
            existing_ids.add(row['id'])
            existing_urls.add(row['来源链接'])

with MANIFEST.open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=base_fields)
    writer.writeheader()
    writer.writerows(original + new_rows)
with OUT_APPEND.open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=base_fields)
    writer.writeheader()
    writer.writerows(new_rows)

thumb_sources = [
    ROOT / 'staging' / 'polyhaven' / 'thumbnails',
    ROOT / 'staging' / 'kenney' / 'thumbnails',
    ROOT / 'staging' / 'quaternius' / 'thumbnails',
    ROOT / 'staging' / 'nasa_svs' / 'thumbnails',
]
copy_count = 0
for thumb_dir in thumb_sources:
    for thumb in thumb_dir.glob('*'):
        target = PROD_REFS / thumb.name
        shutil.copy2(thumb, target)
        copy_count += 1

summary = {
    'previous_manifest_rows': len(original),
    'new_rows': len(new_rows),
    'updated_manifest_rows': len(original) + len(new_rows),
    'new_by_source_prefix': dict(sorted(Counter(row['id'][0] if row['id'].startswith('K') or row['id'].startswith('Q') or row['id'].startswith('N') else 'PH' for row in new_rows).items())),
    'new_by_rights_tier': dict(sorted(Counter(row['权利分级'] for row in new_rows).items())),
    'preview_files_copied': copy_count,
}
(FINAL / 'EXPANSION_02_summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
