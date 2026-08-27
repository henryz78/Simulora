# MANUS P3 — Maps Catalog Set Difference

## Scope and method

This bounded Task 4 run was conducted in the same visible, authenticated `idakellams159` Maps session at `https://worldos.cc/zh-cn/maps`. It compares the UI scopes **`有底图`** and **`全部`** only. Card identity is the observed stable World href after a documented locale-prefix normalization; it is not a Map ID and does not assert any backend record state. The run neither installed nor created a World, selected a target World, modified a map, entered Simulation, nor entered Map Creator.

Each main scope began with 16 rendered cards. The page was scrolled through normal visible content loading until the terminal criterion was met: **three consecutive current-end scrolls with no unique World-href growth**. The structured exports were then extracted only from browser-captured terminal rendered HTML.

## Terminal catalogue result

| Scope | Terminal rendered card rows | Unique stable World hrefs | Repeated href occurrences beyond first | Same-title / different-href groups | Terminal status |
|---|---:|---:|---:|---:|---|
| `有底图` | 1,085 | 1,085 | 0 | 91 | CONFIRMED |
| `全部` | 1,181 | 1,181 | 0 | 103 | CONFIRMED |

The base scope terminal evidence is the final `1,085`-href measurement after three zero-growth bottom re-scrolls. The all scope terminal evidence is the final `1,181`-href measurement, followed by seven zero-growth current-end steps (the first three satisfy the requirement). The terminal screenshots are `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-26-31_4258.webp` for `有底图` and `/home/ubuntu/screenshots/worldos_cc_2026-08-25_10-31-31_3115.webp` for `全部`.

## Href set difference

| Set operation based on terminal observed World hrefs | Count | Status |
|---|---:|---|
| `有底图 ∩ 全部` | 1,085 | CONFIRMED |
| `全部 − 有底图` | 96 | CONFIRMED |
| `有底图 − 全部` | 0 | CONFIRMED |
| Repeated hrefs in `有底图` | 0 | CONFIRMED |
| Repeated hrefs in `全部` | 0 | CONFIRMED |

The relationship observed in this run is therefore **all `有底图` terminal hrefs were also rendered in `全部`, while 96 terminal hrefs were rendered only under `全部`**. This is strictly a visible-catalogue membership result; it must not be read as an assertion that those 96 correspond to missing, deleted, or otherwise particular backend Maps.

## Fixed-seed only-`全部` interaction sample

Ten of the 96 `全部 − 有底图` hrefs were selected reproducibly from the sorted canonical-href universe using `random.Random(20260825).sample(10)`, then sorted for reporting. Each sample completed the permitted non-writing sequence: preview → close; exact visible World-detail link trigger; `用此地图` first layer → Escape cancel. Preview/close and first-layer/cancel were **CONFIRMED** for all 10. Each exact detail link was **TRIGGERED**; Samples 1–2 also have foreground-detail accessibility **CONFIRMED**. Full evidence table: [MAP_ONLY_ALL_SAMPLE_INTERACTIONS.md](MAP_ONLY_ALL_SAMPLE_INTERACTIONS.md). Structured counterpart: `MAP_ONLY_ALL_SAMPLE_INTERACTIONS.csv`.

> The first-layer chooser visibly displayed a proposed new-world field, a `新建并编辑` option, and pre-existing P2 Worlds. The run did **not** select one, create one, install a Map, or make any final confirmation. Its visibility is evidence of an available first layer only—not evidence of a completed Map application.

## Genre comparison

| Genre | Sampling role | `有底图` terminal hrefs | `全部` terminal hrefs | `全部 − 有底图` | Status |
|---|---|---:|---:|---:|---|
| DnD | sparse | 0 | 0 | 0 | CONFIRMED |
| 动漫 | high-volume | 272 | 334 | 62 | CONFIRMED |
| 科幻 | typical | 54 | 57 | 3 | CONFIRMED |
| 恋爱 | typical | 92 | 140 | 48 | CONFIRMED |

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
