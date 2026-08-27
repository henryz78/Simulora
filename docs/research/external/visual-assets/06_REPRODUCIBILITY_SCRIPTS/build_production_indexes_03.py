from pathlib import Path
import csv
import json
from collections import Counter
from urllib.parse import urlparse

ROOT=Path('/home/ubuntu/ai_world_moodboard')
FINAL=ROOT/'final'
manifest=FINAL/'asset_manifest.csv'
with manifest.open(encoding='utf-8',newline='') as f:rows=list(csv.DictReader(f))
fields=list(rows[0].keys())
def root_url(url):
    if not url:return True
    p=urlparse(url)
    return p.path in ('','/') and not p.query
active=[r for r in rows if r['权利分级'].startswith('A-') and r['来源链接'] and not root_url(r['来源链接'])]
review=[r for r in rows if not r['权利分级'].startswith('A-')]
for name,data in [('ACTIVE_PRODUCTION_ASSETS_03.csv',active),('MANIFEST_REVIEW_QUEUE_03.csv',review)]:
    with (FINAL/name).open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(data)
summary={'manifest_rows':len(rows),'active_production_assets':len(active),'review_queue':len(review),'active_by_theme':dict(sorted(Counter(r['主题'] for r in active).items())),'active_by_tier':dict(sorted(Counter(r['权利分级'] for r in active).items())),'active_assets_with_root_url':len([r for r in active if root_url(r['来源链接'])])}
(FINAL/'PRODUCTION_INDEX_03_SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
