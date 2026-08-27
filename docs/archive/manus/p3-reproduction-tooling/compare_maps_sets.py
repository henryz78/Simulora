from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path('/home/ubuntu/worldos_p3_evidence')
BASE = ROOT / 'MAP_BASE_CARDS.csv'
ALL = ROOT / 'MAP_ALL_CARDS.csv'
DIFF = ROOT / 'MAP_SET_DIFFERENCE.csv'
DUPS = ROOT / 'MAP_DUPLICATES.csv'
SUMMARY = ROOT / 'raw/maps_set_summary.json'


def read_rows(path: Path):
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

base_rows = read_rows(BASE)
all_rows = read_rows(ALL)
base_by_href = {r['canonical_world_href']: r for r in base_rows}
all_by_href = {r['canonical_world_href']: r for r in all_rows}
base_set = set(base_by_href)
all_set = set(all_by_href)

# Difference CSV includes all set membership categories, so it is independently useful
# for re-deriving the intersection and two directional differences.
diff_rows = []
for href in sorted(base_set | all_set):
    in_base = href in base_set
    in_all = href in all_set
    if in_base and in_all:
        category = 'INTERSECTION'
        source = all_by_href[href]
    elif in_all:
        category = 'ONLY_ALL'
        source = all_by_href[href]
    else:
        category = 'ONLY_BASE'
        source = base_by_href[href]
    diff_rows.append({
        'membership': category,
        'canonical_world_href': href,
        'base_rendered_order': base_by_href.get(href, {}).get('rendered_order', ''),
        'all_rendered_order': all_by_href.get(href, {}).get('rendered_order', ''),
        'base_title': base_by_href.get(href, {}).get('title', ''),
        'all_title': all_by_href.get(href, {}).get('title', ''),
        'base_creator': base_by_href.get(href, {}).get('creator', ''),
        'all_creator': all_by_href.get(href, {}).get('creator', ''),
        'base_preview_image_present': base_by_href.get(href, {}).get('preview_image_present', ''),
        'all_preview_image_present': all_by_href.get(href, {}).get('preview_image_present', ''),
        'observed_base_href': base_by_href.get(href, {}).get('observed_world_href', ''),
        'observed_all_href': all_by_href.get(href, {}).get('observed_world_href', ''),
    })
with DIFF.open('w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(diff_rows[0].keys()))
    w.writeheader(); w.writerows(diff_rows)

# Duplicate/collision export: href duplicates per scope plus same visible title with different hrefs.
dup_rows = []
for scope, rows in [('有底图', base_rows), ('全部', all_rows)]:
    href_counts = Counter(r['canonical_world_href'] for r in rows)
    for href, n in sorted(href_counts.items()):
        if n > 1:
            dup_rows.append({'scope': scope, 'duplicate_type': 'REPEATED_WORLD_HREF', 'key': href, 'occurrence_count': n, 'hrefs': href, 'rendered_orders': '|'.join(r['rendered_order'] for r in rows if r['canonical_world_href'] == href), 'titles': '|'.join(dict.fromkeys(r['title'] for r in rows if r['canonical_world_href'] == href))})
    title_to_rows = defaultdict(list)
    for r in rows:
        title_to_rows[r['title']].append(r)
    for title, group in sorted(title_to_rows.items()):
        hrefs = sorted({r['canonical_world_href'] for r in group})
        if len(hrefs) > 1:
            dup_rows.append({'scope': scope, 'duplicate_type': 'SAME_TITLE_DIFFERENT_HREF', 'key': title, 'occurrence_count': len(group), 'hrefs': '|'.join(hrefs), 'rendered_orders': '|'.join(r['rendered_order'] for r in group), 'titles': title})
fields = ['scope', 'duplicate_type', 'key', 'occurrence_count', 'hrefs', 'rendered_orders', 'titles']
with DUPS.open('w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader(); w.writerows(dup_rows)

summary = {
    'base_card_rows': len(base_rows),
    'base_unique_hrefs': len(base_set),
    'all_card_rows': len(all_rows),
    'all_unique_hrefs': len(all_set),
    'intersection': len(base_set & all_set),
    'only_all': len(all_set - base_set),
    'only_base': len(base_set - all_set),
    'base_repeated_href_occurrences_beyond_first': len(base_rows) - len(base_set),
    'all_repeated_href_occurrences_beyond_first': len(all_rows) - len(all_set),
    'base_same_title_different_href_groups': sum(1 for k in defaultdict(set, {r['title']: set() for r in base_rows}).keys()),
    'duplicate_csv_rows': len(dup_rows),
    'note': 'Membership is determined solely by visible, rendered stable World hrefs captured in each terminal scope. A href only in All is a set-membership result, not a backend claim about map existence or map IDs.'
}
# Correct title-collision counts separately (the compact expression above is not used).
for name, rows in [('base', base_rows), ('all', all_rows)]:
    titles = defaultdict(set)
    for r in rows:
        titles[r['title']].add(r['canonical_world_href'])
    summary[f'{name}_same_title_different_href_groups'] = sum(1 for hs in titles.values() if len(hs) > 1)
SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary, ensure_ascii=False, indent=2))
print('diff csv:', DIFF)
print('duplicates csv:', DUPS)
