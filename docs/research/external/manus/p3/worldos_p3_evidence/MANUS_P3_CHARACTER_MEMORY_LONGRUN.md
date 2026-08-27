# MANUS P3 — Character Memory Long-Run Generalization

**Scope.** This report records a bounded, normal-visible-UI study conducted on 2026-08-25 (+08:00) under Owner identity `idakellams159`. It covers two independent public Character chats, each opened fresh. All interactions used visible WorldOS controls only. The findings are observations of the listed Character/chat/sample combinations; they are **not** fixed product thresholds, model-internal explanations, or general rules.

## Sample register

| Sample | Character and visible source | Independent Simulation | Fresh Memory baseline | Completion status |
|---|---|---|---|---|
| A | Paul Banks; source `NYC` | `https://worldos.cc/sim/fa53cd75-4e45-4812-993f-d83c08423626` | `No memories recorded yet. Summaries appear every few turns.` | **TOOLING_BLOCKED** after T20; controlled T22 could not be visibly confirmed after three normal UI input attempts. |
| B | Mingyu (SEVENTEEN); source `偶像团体` | `https://worldos.cc/sim/6062b6fa-f28c-4406-ac79-3092e05f8f29` | `No memories recorded yet. Summaries appear every few turns.` | **CONFIRMED** through T35, including all prescribed checkpoints. |

The observed public card UI did not expose either Character’s author identity or an explicit Remix/non-Remix label. Those selection attributes therefore remain **UNKNOWN**. The two samples differ in their **visible source** only; no stronger identity-selection claim is made.

## Checkpoint outcomes

| Sample | T0 | T5 | T10 | T15 | T20 | T23 | T25 | T28 | T30 | T35 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A — Paul Banks | 0 | 0 | 0 | 0 | 0 | TOOLING_BLOCKED | TOOLING_BLOCKED | TOOLING_BLOCKED | TOOLING_BLOCKED | TOOLING_BLOCKED |
| B — Mingyu | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 1 |

> A zero means that the visible Memory panel displayed no Memory entry at that checkpoint. A one means exactly one visible Memory card. It does not quantify hidden records, generated summaries outside the panel, or any service-side behavior.

For **Sample A**, five coherent checkpoints from fresh T0 through T20 showed the same empty-state sentence. T10 and T20 included connected long-form semantic inputs. The first visible auto-Memory had therefore not appeared at the sampled points through T20. After returning from Saves, `A-T22-C8N` was not visibly confirmed through two Enter submissions and one text-entry-plus-visible-Send path. The last path showed a product suggestion rather than the intended token, and the rendered transcript tail also displayed a local duplication boundary. In accordance with the three-like-block stop condition, the branch stopped; no conclusion about A beyond T20 is drawn.

For **Sample B**, the Memory panel was empty at T0, T5, T10, and T15. At T20, after a third connected long-form input, it displayed one editable auto-Memory summary. The adjacent sampled interval is therefore **after T15 and by T20**. The UI phrase “Summaries appear every few turns” did not state an exact cadence; neither sample establishes a guaranteed threshold or a cross-character schedule.

## Before-auto-Memory checkpoint branch

| Sample | Action and visible result | Status | Evidence |
|---|---|---|---|
| A | At T20 while Memory was empty, normal Settings > Create checkpoint was named `MANUS-P3-A-T20-Memory-Baseline`. Saves visibly listed `Checkpoint MANUS-P3-A-T20-Memory-Baseline Turn 20 · 8/25/2026`, with branch URL `https://worldos.cc/sim/f9302cfd-9c74-44d7-bb5c-c28a22430a24`. | **CONFIRMED** for branch creation only | `raw/character_memory_run_notes.md`; `worldos_cc_2026-08-25_09-29-48_8216.webp` |
| B | No checkpoint was created before the first observed Memory appeared at T20. It was not created later because that would not test the required pre-auto-Memory condition. | **NOT_VERIFIED** | `raw/character_memory_sample_b_notes.md` |

The A checkpoint confirms a visible branch row and URL. It does **not** verify checkpoint-specific Memory persistence or branch semantics, because that would require a separate controlled branch run not completed here.

## Manual conflict, reload, and later Memory UI

In Sample B, the sole T20 card contained a visible `folded train ticket` fact. Through the visible Edit control, only that fact was replaced with literal `MANUAL_CONFLICT_B`, then saved. The card returned to its read-only state showing `MANUAL_CONFLICT_B`; after one normal browser reload, the same single card still showed that token. This is **CONFIRMED** visible UI persistence after the single reload.

| Observation point | Visible Memory result | Status |
|---|---|---|
| Post-save and one reload at T20 | One card containing `MANUAL_CONFLICT_B` | **CONFIRMED** |
| T23, three later completed turns | One card containing `MANUAL_CONFLICT_B`; no second card | **CONFIRMED** |
| T25, five later completed turns | One card containing `MANUAL_CONFLICT_B`; no second card | **CONFIRMED** |
| T28, eight later completed turns | One card containing `MANUAL_CONFLICT_B`; no second card | **CONFIRMED** |
| T30 and T35 | One card containing `MANUAL_CONFLICT_B`; no second card or visible replacement | **CONFIRMED** |

The visible card did not separately reflect later tokens as distinct cards at the listed checkpoints. That does not prove that new auto-summaries were never generated, that an update was suppressed, or that any particular merge/deletion model was used.

## Explicit recall query

After T28, Sample B received the normal chat query: `B-T29-REC: Before we continue, what exact detail do you remember in place of the folded train ticket? Please answer with the precise replacement.` The visible reply was: `It was a folded ticket. Always has been.` It did **not** contain `MANUAL_CONFLICT_B`, even though that token remained visible on the Memory card at T30 and T35.

This is a **CONFIRMED** observation of one reply to one wording in one Character/chat. The proposition that a Character necessarily uses a manually edited visible Memory value in its next recall answer is **NOT_VERIFIED**. The result must not be attributed to a hidden retrieval path, summarized as a general recall failure, or generalized across Characters or models.

## Model-variation availability

Sample B’s visible World Model section showed `Civilization 1` (8/turn), `Civilization 1 Small` (4/turn), and `Deepseek` (4/turn), plus `Freedom Pass · no Zaps` with no selectable zero-cost alternative. No model was changed because no clearly free second official model was exposed, and no paid, membership, or BYOK route was opened. The requested free model-variation branch is **MODEL_VARIATION_NOT_AVAILABLE** in this observed account/UI state.

## Energy display boundary

The Settings UI visibly showed changing `Zaps` labels during the runs, including B `Zaps 378` at the final T35 Settings view. These are interface observations only. This report does not characterize price, billing, credit usage, free-account policy, or any system-wide energy semantics.

## Evidence map

| Evidence category | Primary paths |
|---|---|
| Structured checkpoint log | `MANUS_P3_CHARACTER_MEMORY_TURNS.csv` |
| Sample A chronology and checkpoint | `raw/character_memory_run_notes.md` |
| Sample B chronology, edit/reload, and recall | `raw/character_memory_sample_b_notes.md` |
| A T0/T5/T10/T15/T20 screenshots | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-11-27_5790.webp`; `...09-15-22_1685.webp`; `...09-20-11_4595.webp`; `...09-24-50_7809.webp`; `...09-28-13_4233.webp` |
| B T20/edit/reload/T28/T30/T35 screenshots | `/home/ubuntu/screenshots/worldos_cc_2026-08-25_09-46-42_8418.webp`; `...09-48-07_4765.webp`; `...09-48-20_5266.webp`; `...09-54-58_4094.webp`; `...09-57-28_5973.webp`; `...10-00-31_6099.webp` |

## Bounded conclusion

Two fresh chats from visibly different source categories exhibited different sampled outcomes: **no visible auto-Memory through A-T20**, and **the first visible B Memory after B-T15 and by B-T20**. In Sample B, a visible manual fact edit survived one reload and remained displayed through the final T35 checkpoint, while one direct recall reply still gave the original fact rather than the manual replacement. These are narrow, reproducible-by-evidence observations only. Exact generation thresholds, automatic update cadence, multi-card behavior, cross-model effects, save-branch Memory behavior, and any product-wide generalization remain **NOT_VERIFIED** or **TOOLING_BLOCKED** as specified above.

**Task 2 status: COMPLETE / STOP for Character Memory scope.**
