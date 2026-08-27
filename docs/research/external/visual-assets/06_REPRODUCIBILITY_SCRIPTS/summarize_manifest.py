from pathlib import Path
import csv
import json
from collections import Counter

manifest = Path('/home/ubuntu/ai_world_moodboard/final/asset_manifest.csv')
output = Path('/home/ubuntu/ai_world_moodboard/final/manifest_summary.json')

with manifest.open(encoding='utf-8', newline='') as f:
    rows = list(csv.DictReader(f))

summary = {
    'total_rows': len(rows),
    'themes': dict(sorted(Counter(row['主题'] for row in rows).items())),
    'rights_tiers': dict(sorted(Counter(row['权利分级'] for row in rows).items())),
    'new_expansion_items': len([row for row in rows if row['id'].startswith('E')]),
    'production_ready_or_conditional': len([
        row for row in rows
        if row['权利分级'].startswith('A-')
    ]),
    'licensable_purchase': len([
        row for row in rows
        if row['权利分级'].startswith('L-')
    ]),
    'reference_or_confirmation_needed': len([
        row for row in rows
        if row['权利分级'].startswith('C-') or row['权利分级'].startswith('M-')
    ]),
}
output.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
