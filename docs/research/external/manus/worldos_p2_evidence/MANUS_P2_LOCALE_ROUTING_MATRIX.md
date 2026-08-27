# MANUS-P2 Locale、Deep-Link 与 Browser-History Routing Matrix

> 本矩阵区分**平台 UI**和用户生成内容（UGC）。标题、tagline、简介、版本说明与测试对象命名均可能是 UGC 或平台翻译层输出；除非路由或平台壳层直接显示异常，不以其语言差异判定本地化缺陷。所有测试身份为 Owner `idakellams159`，除非另记；本轮不改动任何 Account 字段。结束前必须恢复到中文。

## 直接 locale 深链接样本

| Locale | Tested path | Main platform UI result | URL / pathname | UGC / generated presentation | Outcome | Evidence |
|---|---|---|---|---|---|---|
| `/zh-cn` | `/zh-cn/worlds/manus-p2-creator-world-shi-jie-5pfy` | Global navigation, CTA、App section、Version history、comments and footer all rendered in Simplified Chinese. Language switcher displayed `中文`. | Exact Chinese-prefixed deep link was retained; all internal public links emitted `/zh-cn/...` paths. | World title stayed `MANUS-P2-IDX-WORLD-RENAMED`; tagline/introduction/Collection card appeared Chinese in this page presentation. | **Route reachable; Chinese platform shell confirmed.** | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-20-42_5284.webp`; `/home/ubuntu/page_texts/worldos.cc_zh-cn_worlds_manus-p2-creator-world-shi-jie-5pfy.md` |

## Route coverage ledger

| Required route family | `/zh-cn` | `/en` | `/es` | Notes |
|---|---|---|---|---|
| Home | Pending | Pending | Pending | |
| World directory | Pending | Pending | Pending | |
| World search | Pending | Pending | Pending | |
| World detail | Confirmed | Pending | Pending | See direct sample above. |
| Character directory / detail | Pending | Pending | Pending | Character detail only exposes modal flow in observed UI. |
| App Market / detail | Pending | Pending | Pending | |
| Map directory | Pending | Pending | Pending | |
| Community | Pending | Pending | Pending | |
| Collections | Pending | Pending | Pending | |
| Creator Profile | Pending | Pending | Pending | |
| Mine / Account / Pricing / Rewards / Simulation | Pending | Pending | Pending | Must respect Simulation/Account boundaries. |

## Query/hash/history/error cases

| Case | Locale | Result |
|---|---|---|
| Valid query | Pending | Pending |
| Valid hash | Pending | Pending |
| Nonexistent slug / 404 | Pending | Pending |
| Unsupported locale prefix | Pending | Pending |
| Back / Forward | Pending | Pending |
| Reload | Pending | Pending |
| New tab | `NOT_EXECUTABLE_WITH_CURRENT_BROWSER_TOOLING` | Browser tool exposes no safe new-tab action. |

| `/en` | `/en/worlds/manus-p2-creator-world-shi-jie-5pfy` | English 404 shell rendered `404` and `This page could not be found.` with English footer/navigation; URL remained exact. | **Locale-prefixed World deep link did not resolve under `/en`**, unlike the same `/zh-cn` path. This is a routing outcome, not a UGC translation finding. | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-21-19_5434.webp`; `/home/ubuntu/page_texts/worldos.cc_en_worlds_manus-p2-creator-world-shi-jie-5pfy.md` |
| `/es` | `/es/worlds/manus-p2-creator-world-shi-jie-5pfy` | Global navigation, CTA, version history, comments and footer rendered in Spanish; switcher showed `Español`. Exact `/es/...` path persisted and internal links used `/es/`. | **Route reachable; Spanish platform shell confirmed.** The title remained test-object text while generated description/related Collection presentation appeared Spanish; not scored as translation quality. | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-21-42_1959.webp`; `/home/ubuntu/page_texts/worldos.cc_es_worlds_manus-p2-creator-world-shi-jie-5pfy.md` |

> **Confirmed direct-link divergence:** For the same public World token, `/zh-cn/...` and `/es/...` reached a localized detail page, while `/en/...` rendered a localized 404 shell. The non-prefixed route had previously served the English UI; this report does not infer root-cause or an SLA.

| Valid query + hash | `/es` | `/es/worlds?query=MANUS-P2#top` | Exact query and `#top` remained in URL. Spanish World Directory UI loaded normally with Spanish heading/navigation, search control and category labels. The page still showed normal directory content; this `query` parameter was **not demonstrated** to filter the directory. | **URL state preserved; query semantics UNKNOWN.** | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-22-12_4981.webp`; `/home/ubuntu/page_texts/worldos.cc_es_worlds_query_MANUS-P2_top.md` |
| Back key | `/es` | Starting at `/es/worlds?query=MANUS-P2#top`, send `Alt+Left`. | URL and loaded Spanish directory did not change in the automated browser result. | **History navigation UNKNOWN / no observed transition**; this does not prove a product issue because the automated key action may not map to browser history in this environment. | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_07-22-35_8354.webp` |
