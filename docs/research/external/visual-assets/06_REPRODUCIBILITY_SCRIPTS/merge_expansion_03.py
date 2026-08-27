from pathlib import Path
import csv
import json
import shutil
from collections import Counter

ROOT=Path('/home/ubuntu/ai_world_moodboard')
FINAL=ROOT/'final'
MANIFEST=FINAL/'asset_manifest.csv'
PREVIEWS=ROOT/'assets'/'references_production_03'
BASE=['id','主题','标题或描述','来源线索','来源链接','适合用在哪里','可借鉴的视觉特点','风格关键词','权利分级','使用边界']
sources=[
    ROOT/'staging'/'kenney_expansion_03'/'kenney_expansion_03_candidates.csv',
    ROOT/'staging'/'quaternius_expansion_03'/'quaternius_expansion_03_candidates.csv',
    ROOT/'staging'/'polyhaven_expansion_03'/'polyhaven_expansion_03_candidates.csv',
    ROOT/'staging'/'kenney_vfx_ui_expansion_03_candidates.csv',
]
with MANIFEST.open(encoding='utf-8',newline='') as f: old=list(csv.DictReader(f))
ids={r['id'] for r in old}; urls={r['来源链接'] for r in old if r['来源链接']}
new=[]
for source in sources:
    with source.open(encoding='utf-8',newline='') as f:
        for raw in csv.DictReader(f):
            row={key:raw.get(key,'') for key in BASE}
            if row['id'] in ids:raise ValueError('Duplicate id '+row['id'])
            if row['来源链接'] in urls:raise ValueError('Duplicate URL '+row['来源链接'])
            new.append(row);ids.add(row['id']);urls.add(row['来源链接'])
with MANIFEST.open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=BASE);w.writeheader();w.writerows(old+new)
append_path=FINAL/'EXPANSION_03_新增单件资产记录.csv'
with append_path.open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=BASE);w.writeheader();w.writerows(new)
summary={'before':len(old),'new':len(new),'after':len(old)+len(new),'new_by_prefix':dict(sorted(Counter('PX' if r['id'].startswith('PX') else r['id'][:2] if r['id'].startswith('KX') or r['id'].startswith('QX') else 'KV' for r in new).items())),'new_by_tier':dict(sorted(Counter(r['权利分级'] for r in new).items())),'official_previews_available':len(list(PREVIEWS.glob('*')))}
(FINAL/'EXPANSION_03_MERGE_SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
