from pathlib import Path
import csv
from collections import defaultdict

ROOT = Path('/home/ubuntu/ai_world_moodboard')
with (ROOT/'final'/'asset_manifest.csv').open(encoding='utf-8', newline='') as f:
    rows = {row['id']: row for row in csv.DictReader(f)}
issues = defaultdict(list)
with (ROOT/'final'/'MANIFEST_HYGIENE_AUDIT_03.csv').open(encoding='utf-8', newline='') as f:
    for item in csv.DictReader(f):
        for asset_id in item['id'].split(', '):
            issues[asset_id].append(item['issue'])

out = ROOT/'final'/'MANIFEST_HYGIENE_REVIEW_03.csv'
fields = ['id','title','source','tier','url','issues']
with out.open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for asset_id in sorted(issues):
        if asset_id not in rows:
            continue
        row = rows[asset_id]
        writer.writerow({
            'id': asset_id, 'title': row['标题或描述'], 'source': row['来源线索'], 'tier': row['权利分级'],
            'url': row['来源链接'], 'issues': '; '.join(sorted(set(issues[asset_id])))
        })
print(out)
