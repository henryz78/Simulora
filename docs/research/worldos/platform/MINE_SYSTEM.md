# Mine System

Status: `PARTIAL / TESTED IA`

`/zh-cn/sims` has Works/History, World/Character/Collection/App and Created/Favorited filters. Owner cards expose edit/remix/delete/start depending type. Mine Character mixes owned global Characters, Remix library copies and World-bound Characters. All tested tabs are client-local at `/sims`; reload always returns to History → World.

History is a real Simulation list: it shows each save with name, World/Character identity and Turn; each `更多` menu offers `重命名` and `删除`. The 2026-08-25 owner snapshot contains 19 World saves and four Character Chat saves, replacing the earlier empty-Character snapshot. Both are fully rendered finite lists with no pager/end copy. A 390px mobile run confirmed the newly created Simulation appeared at current Turn 1. Rename is persistent metadata: submitting a new name closes the modal but the current card can stay stale until reload; the new title then appears both in Mine and the direct Simulation browser title while URL/Turn remain unchanged. Delete opens an explicit site modal `确认永久删除该存档？` with name echo and Cancel/Delete; cancel preserves the save. Sidebar history is a separate recent-navigation list. Mine Works also links `世界质量判定`.

A later final-delete sample accepted that modal for `TEST App v4 Simulation 001`. The save disappeared from the World detail list after refresh, Continue retargeted to the next save, the former stable UUID returned 404, and no undo/recovery UI appeared. EVD-0219 later verified the converged projection state: Mine History, global sidebar History and the source World save list all omit the title/UUID; direct access remains a bare 404 without product Back/Undo/Restore. Exact immediate cleanup latency still is not inferred.

Parent-World deletion follows a different projection path (EVD-0221, EVD-0223). Deleting a published World with one save immediately makes both World and child runtime URLs 404 and removes the World from Search/Works/Profile, but Mine History initially retains the child card with its World slug, Turn/date, Rename/Delete menu and dead UUID href. Renaming that orphan metadata succeeds and survives reload while runtime access remains 404. Its in-page Delete then removes the orphan row from History immediately and after reload, with no Undo/Restore. Mine must therefore be modeled as a projection with its own metadata lifecycle, not a guaranteed list of currently runnable Simulation entities. Pre-cleanup retention duration and cross-device behavior remain UNKNOWN.

## Created App management

`作品 → 我创建的` shows owned Apps, including visibility text (`未公开`), creator, Worlds-in-use count, tags, `收藏` and `安装`. App `安装` opens a target-World chooser with existing owned Worlds and a “new World name” input; no commit occurs until a target/final action is selected.

Clicking an App card opens an in-place Drawer with Close, creator Profile, Install, Detail, owner Edit/Delete, statistics, favorite, rating and comment surfaces while URL stays `/sims`. A reversible favorite experiment on `TEST App First Publish 001` changed its heart/count `0→1` immediately. Switching to `我收藏的` in the same render still showed the old empty state; after reload/re-enter the App appeared. Unfavoriting inside that list changed its count immediately but left the row mounted until reload, after which the favorite list was empty again. Membership persistence is correct, but the selected projection has a reproducible cache invalidation lag.

Evidence: `EVD-0069`, `EVD-0072`, `EVD-0099`, `EVD-0129`, `EVD-0243`.

## Remix propagation

An immediately published World Remix appears under `作品 → 世界 → 我创建的` without needing a separate first Publish action. Before any Simulation is created it does not appear under History. Its card uses normal owner Edit/Delete/Start controls and no `有未发布修改` badge until a later Draft diverges from public v1. Mine/Profile can reflect the object while exact-title unified Search still omits it.

Evidence: EVD-0118.
