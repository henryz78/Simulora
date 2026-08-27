# Time Engine

Status: `TESTED / PARTIAL edge rules`

Time is shown as a World-specific label (`1912年·初夏` in Demon Slayer) on Story, Events and transactions. Several full Turns, Map movement and Chat preserved the same label, so one Turn does not imply a fixed time increment. Timeline can group by Turn, time or mainline and offers jump-to-next-major-event. Creator configuration and four standard runtime jump types are verified below; only custom/free-text grammar, bounds and locale/timezone edges remain unknown.

## Product Contract (pre-install evidence)

The official `时间` App install drawer describes a floating world clock that tracks the world's current `now`. It offers jump-to-next-major-event, arbitrary date entry, and fast-forward ranges from one hour through one year. The description says the simulation processes everything between the current and target time and that `回溯时间` opens historical events. This is a UI/product contract, not yet a runtime verification.

Evidence: `EVD-0065`.

## Creator configuration boundary

After installing Time into `TEST App Upgrade World 001`, the Creator exposes persisted configuration fields for display name, start time, time format, repeatable jump rows, custom AI instruction, per-operation reminder, guide text, App theme, background opacity and optional background image. A real draft was configured with `Day 1 / 01/01/2026 / 8:00 AM`, `Day N · HH:mm`, and jump rows `next_event`, `next_day`, `1 month`, `1 year`; the live preview rendered the time label plus `回溯时间（查看历史）` and `跳到下一个大事件`.

The configuration panel has an explicit `保存 App 配置` action. Saving causes World draft autosave status (`正在自动保存…` then `草稿已自动保存`) while publication remains a separate `发布 v4` operation. A stale multi-page draft can surface `草稿已在其他页面更新,点击刷新后继续`; refreshing restored the latest draft and retained the installed Time App.

Evidence: `EVD-0074`.

## Published runtime behavior

World v4 was published with the configured Time App. A new Simulation initialized at `第 1 天 · 08:00`. The runtime jump dialog exposes next event, next day, one month, one year, an extra custom `+` option and arbitrary-time entry.

Observed exact transitions, each consuming one Turn and generating narrative/state events:

| Operation | Before | After | Turn |
|---|---|---|---:|
| Next event | Day 1 08:00 | Day 1 08:20 | 1→2 |
| Next day | Day 1 08:20 | Day 2 06:30 | 2→3 |
| +1 month | Day 2 06:30 | Day 32 08:00 | 3→4 |
| +1 year | Day 32 08:00 | Day 398 07:30 | 4→5 |

`next_event` is semantic: it advanced only 20 minutes to a major story event. `next_day` selected a narrative next-morning time rather than exact +24h. Month/year operations applied calendar-like day increments and generated extensive intervening history. Story and Events use the resulting time label; Events adds `按时间` grouping.

Memory remained empty through Turn 5 despite 397 simulated days, proving elapsed world time alone does not trigger long-memory summarization.

Existing v3 Simulation received the v4 update prompt. Choosing `暂不更新` persisted across reload and left Time absent; no visible manual re-entry was found in Settings or Details.

Evidence: `EVD-0087–0089`.

## Arbitrary-target invalid-text boundary

EVD-0250 retested the free-text target on the same published Time save at Turn 5 / Day 1 08:35. The field enabled `前往` for the clearly invalid literal `not-a-time-0249`; the UI showed no format warning or parser error. Submission entered the normal World-generation lock, committed Turn 6, advanced Time to Day 2 10:00 and stored the literal as the ordinary player action in Events. Story narrated the one-day transition.

This means the visible free-text control is not a strict client-side date parser in the tested state. Invalid input can fall through to the generic AI action path and still mutate Time. The deterministic preset rows and the free-text path must be modeled/tested separately. Valid target grammar, extra custom `+`, past-date rejection, timezone/locale rules and whether a genuinely parseable target produces a specialized operation remain `UNKNOWN`.

Evidence: `EVD-0250`.
