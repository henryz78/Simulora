# Search System

Status: `TESTED / PARTIAL`

`/zh-cn/worlds/search?q=` is a unified Search over Worlds, Characters, Users and Apps. It debounces input, updates URL, groups results, provides type tabs and `查看全部`, stores recent searches, shows hot tags when empty and `暂无匹配结果` when none. Character library also has local same-page debounce search.

Evidence: EVD-0035.

## Full-result route

Grouped search results have `查看全部` links that encode the query and object tab, e.g. `/zh-cn/worlds/search?q=TEST&tab=worlds`. The World result surface adds genre, audience, App, sort and time-range filters. Sort labels expose product meanings (trend, play count, turn count, rating, average turns, replay, remix count, recency, random), while time ranges are all/daily/weekly/monthly. Ranking formulas remain unknown.

Evidence: `EVD-0067`, `EVD-0068`.

## Publication-index consistency

Search is not guaranteed to converge in the same transaction as publication. A cross-account L2 Remix was already directly public and listed in owner Profile/Mine, yet the first exact-title grouped/full World Search snapshot omitted it and ended with `没有更多啦`. After a later wait/reload, the same complete route contained all four relevant L0/L1/L2 Worlds and again ended with `没有更多啦`. Treat Search/Explore as asynchronous discovery indexes; exact convergence SLA, queue trigger and ranking rules remain `UNKNOWN`.

Evidence: EVD-0118, EVD-0120.
