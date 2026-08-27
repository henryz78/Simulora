# Community System

Status: `TESTED / PARTIAL`

Community is primarily leaderboard/community-contact discovery: QQ/WeChat join, external social accounts, Create World CTA, nine player/creator/supporter ranking modes and five ranked World sections. It is not currently observed as a post feed/forum. The first eight Profile rankings each expose a fixed Top 20 in the current build; WorldOS Supporters currently has one row. Ranking tabs are client-local at `/community` and reload resets to Player Turns. Units are `回合`, `个世界`, `次模拟`, `收藏`, fractional/integer `电量`, or `美元` according to dimension.

The five World sections are Most Simulated, Most Turns, Most Favorited, Most Tipped and Most Remixed. Each lazy-hydrates to 12 whole World cards with nested Remix/Start actions. At the tested narrow viewport the arrow buttons are CSS-hidden and the row accepts horizontal scroll gestures; terminal state removes the forward control, backing up restores both. The fully hydrated page stabilizes at 60 World cards with no global loader/end copy. QQ opens a QR modal with copyable group number and visible copy acknowledgement; WeChat copy has no visible feedback; Create World opens the standard World creation modal.

Evidence: EVD-0034, EVD-0100, EVD-0242.
