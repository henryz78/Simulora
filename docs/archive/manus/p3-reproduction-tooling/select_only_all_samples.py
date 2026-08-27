from __future__ import annotations

import csv
import random
from pathlib import Path

ROOT = Path('/home/ubuntu/worldos_p3_evidence')
DIFF = ROOT / 'MAP_SET_DIFFERENCE.csv'
ALL = ROOT / 'MAP_ALL_CARDS.csv'
OUT = ROOT / 'MAP_ONLY_ALL_SAMPLE_SELECTION.csv'
SEED = 20260825

with DIFF.open(encoding='utf-8-sig', newline='') as f:
    only_all_hrefs = sorted(r['canonical_world_href'] for r in csv.DictReader(f) if r['membership'] == 'ONLY_ALL')
with ALL.open(encoding='utf-8-sig', newline='') as f:
    all_by_href = {r['canonical_world_href']: r for r in csv.DictReader(f)}

rng = random.Random(SEED)
selected_hrefs = sorted(rng.sample(only_all_hrefs, 10))
rows = []
for ordinal, href in enumerate(selected_hrefs, 1):
    r = all_by_href[href]
    rows.append({
        'sample_ordinal': ordinal,
        'selection_method': f'sorted canonical href universe + Python random.Random({SEED}).sample(10), then sorted selected output',
        'canonical_world_href': href,
        'observed_world_href': r['observed_world_href'],
        'title': r['title'],
        'creator': r['creator'],
        'all_rendered_order': r['rendered_order'],
        'title_occurs_within_all_count': sum(1 for x in all_by_href.values() if x['title'] == r['title']),
        'ui_interaction_status': 'PENDING',
        'preview_result': '',
        'world_detail_result': '',
        'use_map_first_layer_result': '',
        'cancel_result': '',
        'screenshot_paths': '',
        'notes': '',
    })
with OUT.open('w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)

print('only_all_universe:', len(only_all_hrefs))
print('seed:', SEED)
for r in rows:
    print(f"{r['sample_ordinal']:02d} | {r['title']} | {r['creator']} | {r['canonical_world_href']} | title-count={r['title_occurs_within_all_count']}")
print('output:', OUT)
