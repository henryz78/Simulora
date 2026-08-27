from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path('/home/ubuntu/worldos_p3_evidence')
RAW = ROOT / 'raw'
selection_path = ROOT / 'MAP_ONLY_ALL_SAMPLE_SELECTION.csv'
summary_path = RAW / 'maps_set_summary.json'
interactions_csv = ROOT / 'MAP_ONLY_ALL_SAMPLE_INTERACTIONS.csv'
interactions_md = ROOT / 'MAP_ONLY_ALL_SAMPLE_INTERACTIONS.md'
genre_csv = ROOT / 'MAP_GENRE_COMPARISON.csv'
report_path = ROOT / 'MANUS_P3_MAP_CATALOG_DIFF.md'

with selection_path.open('r', encoding='utf-8-sig', newline='') as f:
    samples = list(csv.DictReader(f))
with summary_path.open('r', encoding='utf-8') as f:
    summary = json.load(f)

screenshot_map = {
    '1': [
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-34-08_4684.webp',
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-34-47_6727.webp',
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-36-50_3021.webp',
    ],
    '2': [
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-37-31_5002.webp',
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-38-57_8233.webp',
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-40-10_8718.webp',
    ],
    '3': [
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-41-03_4700.webp',
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-41-40_2900.webp',
    ],
    '4': ['/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-42-23_8204.webp'],
    '5': ['/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-43-47_4976.webp'],
    '6': ['/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-45-18_5255.webp'],
    '7': [
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-46-32_3265.webp',
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-49-02_6621.webp',
    ],
    '8': [
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-49-42_9807.webp',
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-50-08_4564.webp',
    ],
    '9': [
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-46-32_3265.webp',
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-47-40_7834.webp',
    ],
    '10': [
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-50-38_6794.webp',
        '/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-51-23_3028.webp',
    ],
}

for row in samples:
    ordinal = row['sample_ordinal']
    row['ui_interaction_status'] = 'CONFIRMED_WITH_DETAIL_BOUNDARY'
    row['preview_result'] = 'CONFIRMED (opened and closed)'
    if ordinal in {'1', '2'}:
        row['world_detail_result'] = 'TRIGGERED; foreground accessibility CONFIRMED'
    else:
        row['world_detail_result'] = 'TRIGGERED (new-tab target; no foreground visit claimed)'
    row['use_map_first_layer_result'] = 'CONFIRMED (opened; no selection)'
    row['cancel_result'] = 'CONFIRMED (Escape; no write)'
    row['screenshot_paths'] = '; '.join(screenshot_map[ordinal])
    row['notes'] = 'No existing World selected; no new World; no install; no map modification; no Simulation or Map Creator.'

fieldnames = list(samples[0].keys())
with interactions_csv.open('w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    w.writerows(samples)

md_rows = []
for r in samples:
    detail = 'TRIGGERED + foreground accessibility CONFIRMED' if r['sample_ordinal'] in {'1', '2'} else 'TRIGGERED only'
    shots = '<br>'.join(f'`{p}`' for p in screenshot_map[r['sample_ordinal']])
    md_rows.append(
        '| {ord} | {title} | {creator} | `{href}` | CONFIRMED | {detail} | CONFIRMED | CONFIRMED | {shots} |'.format(
            ord=r['sample_ordinal'], title=r['title'].replace('|', '\\|'), creator=r['creator'].replace('|', '\\|'),
            href=r['canonical_world_href'], detail=detail, shots=shots
        )
    )
interactions_md.write_text(
    '# Only-`全部` Fixed-Sample Interaction Table\n\n'
    'This table consolidates the reproducible fixed-seed sample. All steps used visible Maps UI only. `用此地图` was opened only to its first layer and cancelled via Escape; no target World was selected and no write occurred.\n\n'
    '| # | Title | Creator | Stable World href | Preview + close | World detail | `用此地图` first layer | Cancel | Screenshot evidence |\n'
    '|---:|---|---|---|---|---|---|---|---|\n'
    + '\n'.join(md_rows) + '\n\n'
    '> Detail links were target-new-tab actions. Each exact card link was visibly clicked (**TRIGGERED**). Samples 1–2 additionally received a foreground public-detail accessibility check; samples 3–10 did not, so no foreground-detail claim is made for them.\n',
    encoding='utf-8'
)

genres = [
    {'comparison_ordinal': 1, 'genre': 'DnD', 'volume_role': 'sparse', 'base_scope_terminal_unique_hrefs': 0, 'all_scope_terminal_unique_hrefs': 0, 'all_minus_base': 0, 'terminal_evidence': 'Both scopes immediately showed 暂无地图; no scrolling needed.', 'status': 'CONFIRMED'},
    {'comparison_ordinal': 2, 'genre': '动漫', 'volume_role': 'high-volume', 'base_scope_terminal_unique_hrefs': 272, 'all_scope_terminal_unique_hrefs': 334, 'all_minus_base': 62, 'terminal_evidence': 'Each scope reached 3+ consecutive zero-growth current-end scrolls.', 'status': 'CONFIRMED'},
    {'comparison_ordinal': 3, 'genre': '科幻', 'volume_role': 'typical', 'base_scope_terminal_unique_hrefs': 54, 'all_scope_terminal_unique_hrefs': 57, 'all_minus_base': 3, 'terminal_evidence': 'Each scope reached 3+ consecutive zero-growth current-end scrolls.', 'status': 'CONFIRMED'},
    {'comparison_ordinal': 4, 'genre': '恋爱', 'volume_role': 'typical', 'base_scope_terminal_unique_hrefs': 92, 'all_scope_terminal_unique_hrefs': 140, 'all_minus_base': 48, 'terminal_evidence': 'Each scope reached 3+ consecutive zero-growth current-end scrolls.', 'status': 'CONFIRMED'},
]
with genre_csv.open('w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(genres[0].keys()))
    w.writeheader()
    w.writerows(genres)

genre_md = '\n'.join(
    f"| {g['genre']} | {g['volume_role']} | {g['base_scope_terminal_unique_hrefs']} | {g['all_scope_terminal_unique_hrefs']} | {g['all_minus_base']} | {g['status']} |"
    for g in genres
)

report = f'''# MANUS P3 — Maps Catalog Set Difference

## Scope and method

This bounded Task 4 run was conducted in the same visible, authenticated `idakellams159` Maps session at `https://worldos.cc/zh-cn/maps`. It compares the UI scopes **`有底图`** and **`全部`** only. Card identity is the observed stable World href after a documented locale-prefix normalization; it is not a Map ID and does not assert any backend record state. The run neither installed nor created a World, selected a target World, modified a map, entered Simulation, nor entered Map Creator.

Each main scope began with 16 rendered cards. The page was scrolled through normal visible content loading until the terminal criterion was met: **three consecutive current-end scrolls with no unique World-href growth**. The structured exports were then extracted only from browser-captured terminal rendered HTML.

## Terminal catalogue result

| Scope | Terminal rendered card rows | Unique stable World hrefs | Repeated href occurrences beyond first | Same-title / different-href groups | Terminal status |
|---|---:|---:|---:|---:|---|
| `有底图` | {summary['base_card_rows']:,} | {summary['base_unique_hrefs']:,} | {summary['base_repeated_href_occurrences_beyond_first']} | {summary['base_same_title_different_href_groups']} | CONFIRMED |
| `全部` | {summary['all_card_rows']:,} | {summary['all_unique_hrefs']:,} | {summary['all_repeated_href_occurrences_beyond_first']} | {summary['all_same_title_different_href_groups']} | CONFIRMED |

The base scope terminal evidence is the final `1,085`-href measurement after three zero-growth bottom re-scrolls. The all scope terminal evidence is the final `1,181`-href measurement, followed by seven zero-growth current-end steps (the first three satisfy the requirement). The terminal screenshots are `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-26-31_4258.webp` for `有底图` and `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-31-31_3115.webp` for `全部`.

## Href set difference

| Set operation based on terminal observed World hrefs | Count | Status |
|---|---:|---|
| `有底图 ∩ 全部` | {summary['intersection']:,} | CONFIRMED |
| `全部 − 有底图` | {summary['only_all']:,} | CONFIRMED |
| `有底图 − 全部` | {summary['only_base']:,} | CONFIRMED |
| Repeated hrefs in `有底图` | {summary['base_repeated_href_occurrences_beyond_first']} | CONFIRMED |
| Repeated hrefs in `全部` | {summary['all_repeated_href_occurrences_beyond_first']} | CONFIRMED |

The relationship observed in this run is therefore **all `有底图` terminal hrefs were also rendered in `全部`, while 96 terminal hrefs were rendered only under `全部`**. This is strictly a visible-catalogue membership result; it must not be read as an assertion that those 96 correspond to missing, deleted, or otherwise particular backend Maps.

## Fixed-seed only-`全部` interaction sample

Ten of the 96 `全部 − 有底图` hrefs were selected reproducibly from the sorted canonical-href universe using `random.Random(20260825).sample(10)`, then sorted for reporting. Each sample completed the permitted non-writing sequence: preview → close; exact visible World-detail link trigger; `用此地图` first layer → Escape cancel. Preview/close and first-layer/cancel were **CONFIRMED** for all 10. Each exact detail link was **TRIGGERED**; Samples 1–2 also have foreground-detail accessibility **CONFIRMED**. Full evidence table: [MAP_ONLY_ALL_SAMPLE_INTERACTIONS.md](MAP_ONLY_ALL_SAMPLE_INTERACTIONS.md). Structured counterpart: `MAP_ONLY_ALL_SAMPLE_INTERACTIONS.csv`.

> The first-layer chooser visibly displayed a proposed new-world field, a `新建并编辑` option, and pre-existing P2 Worlds. The run did **not** select one, create one, install a Map, or make any final confirmation. Its visibility is evidence of an available first layer only—not evidence of a completed Map application.

## Genre comparison

| Genre | Sampling role | `有底图` terminal hrefs | `全部` terminal hrefs | `全部 − 有底图` | Status |
|---|---|---:|---:|---:|---|
{genre_md}

`DnD` returned the visible empty state `暂无地图` in both scopes, yielding zero without scroll. For the other three filters, each scope was taken to the same three-consecutive-no-growth condition. The values are current visible filter results, not claims about all backend classifications. Structured form: `MAP_GENRE_COMPARISON.csv`.

## Files and evidence boundaries

| Artifact | Purpose |
|---|---|
| `MAP_BASE_CARDS.csv` | 1,085 terminal `有底图` card rows with observed order, title, creator, hrefs, preview presence/source, and rendered controls. |
| `MAP_ALL_CARDS.csv` | 1,181 terminal `全部` card rows on the same field basis. |
| `MAP_SET_DIFFERENCE.csv` | Href-level intersection and directional difference members. |
| `MAP_DUPLICATES.csv` | Repeated-href and same-title/different-href records; zero repeated href occurrences in either scope. |
| `MAP_ONLY_ALL_SAMPLE_SELECTION.csv` | Original deterministic selection inputs. |
| `MAP_ONLY_ALL_SAMPLE_INTERACTIONS.csv` / `.md` | Final 10-sample interaction outcomes and screenshot paths. |
| `MAP_GENRE_COMPARISON.csv` | Four visible-filter comparison results. |
| `raw/maps_catalog_run_log.md` | Chronological scope, scroll, terminal, and genre-run evidence. |
| `raw/maps_only_all_sample_interactions.md` | Detailed per-sample interaction narrative and status boundary. |

## Conclusion

Within the stated visible-UI boundary, the Maps page rendered **1,085** unique World href cards in `有底图` and **1,181** in `全部`, a **96-href only-`全部` difference**, with no observed only-`有底图` hrefs. The task's fixed-sample UI sequence and four genre-filter comparisons completed without map writes. **CONFIRMED** here means a visible rendered UI result only; all unobserved backend semantics remain **NOT_VERIFIED**.
'''
report_path.write_text(report, encoding='utf-8')

print(json.dumps({
    'interactions_csv': str(interactions_csv),
    'interactions_md': str(interactions_md),
    'genre_csv': str(genre_csv),
    'report': str(report_path),
    'samples': len(samples),
    'genre_rows': len(genres),
}, ensure_ascii=False, indent=2))
