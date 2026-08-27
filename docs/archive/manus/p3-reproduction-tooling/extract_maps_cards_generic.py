from __future__ import annotations

import csv
import json
import sys
from collections import Counter
from pathlib import Path
from bs4 import BeautifulSoup

if len(sys.argv) != 5:
    raise SystemExit('usage: extract_maps_cards_generic.py <scope> <source_html> <out_csv> <out_metadata_json>')

scope, source_arg, out_arg, meta_arg = sys.argv[1:]
SOURCE = Path(source_arg)
OUT = Path(out_arg)
META = Path(meta_arg)

soup = BeautifulSoup(SOURCE.read_text(encoding='utf-8'), 'html.parser')
rows = []
for div in soup.find_all('div'):
    classes = set(div.get('class') or [])
    if not {'group', 'rounded-2xl', 'bg-card', 'overflow-hidden'}.issubset(classes):
        continue
    detail_link = div.find('a', title='查看这个世界', href=True)
    preview_button = next((b for b in div.find_all('button') if b.get('title') == '点击查看大图' or b.get('aria-label') == '点击查看大图' or b.get('data-tip') == '点击查看大图'), None)
    if not detail_link or not detail_link['href'].startswith('/zh-cn/worlds/'):
        continue
    img = preview_button.find('img')
    use_button = next((b for b in div.find_all('button') if '用此地图' in b.get_text(' ', strip=True)), None)
    text_divs = detail_link.find_all('div', recursive=False)
    title = text_divs[0].get_text(' ', strip=True) if text_divs else detail_link.get_text(' ', strip=True)
    creator = text_divs[1].get_text(' ', strip=True) if len(text_divs) > 1 else ''
    href = detail_link['href']
    rows.append({
        'scope': scope,
        'rendered_order': len(rows) + 1,
        'title': title,
        'creator': creator,
        'observed_world_href': href,
        'canonical_world_href': '/worlds/' + href.split('/worlds/', 1)[1],
        'preview_image_present': 'YES' if img else 'NO',
        'preview_image_src': (img.get('src') if img else ''),
        'preview_button_visible': 'YES',
        'world_detail_visible': 'YES',
        'use_this_map_visible': 'YES' if use_button else 'NO',
        'visible_genre_tag': 'NOT_DISPLAYED',
        'other_card_visible_text': '',
        'source_html': str(SOURCE),
    })

fieldnames = list(rows[0].keys()) if rows else []
with OUT.open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

href_counts = Counter(r['observed_world_href'] for r in rows)
title_to_hrefs = {}
for r in rows:
    title_to_hrefs.setdefault(r['title'], set()).add(r['observed_world_href'])
meta = {
    'source_html': str(SOURCE),
    'scope': scope,
    'card_rows': len(rows),
    'unique_observed_world_hrefs': len(href_counts),
    'duplicate_href_occurrences_beyond_first': sum(n - 1 for n in href_counts.values() if n > 1),
    'duplicate_hrefs': {href: count for href, count in href_counts.items() if count > 1},
    'same_title_different_href': {title: sorted(hrefs) for title, hrefs in title_to_hrefs.items() if len(hrefs) > 1},
    'note': 'Extracted from a browser-saved, fully rendered visible page. No API, storage, or private identifiers were accessed. visible_genre_tag is NOT_DISPLAYED because inspected card markup contains no card-local genre label.'
}
META.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k: meta[k] for k in ('scope','card_rows','unique_observed_world_hrefs','duplicate_href_occurrences_beyond_first')}, ensure_ascii=False))
print('same_title_different_href:', len(meta['same_title_different_href']))
