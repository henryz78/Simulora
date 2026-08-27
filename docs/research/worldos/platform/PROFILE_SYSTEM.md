# Creator Profile System

Status: `TESTED / PARTIAL`

Public Profile shows identity/gender/join date/followers/share/follow plus membership tier and supporter badges. It combines:

- creator metrics: created Worlds, starts, accumulated Turns, followers, fractional simulation-share earnings and tip income;
- donor leaderboard and a nine-tier energy gift modal whose copy promises 70% to the creator;
- player metrics, starts/Turns, achievement showcase, wins and average score;
- weighted favorite genres, saved Worlds, created Worlds, most-played Worlds and created Characters.

Achievement cards open detail modals with World, final score, completed Turns, unlock date, AI evaluation, World link and share control. `分享成就` opens a 1:1/4:5/9:16 poster composer with save, link/text copy, X, OS share and reward handoff. Search User results deep-link profiles and show World/Turn/follower counts. `分享主页` is an immediate canonical-link clipboard action with toast `链接已复制`; it does not reuse the poster composer.

EVD-0246 proves this showcase must not yet be equated with ordinary configured Achievement-App grants. After two custom World achievements were durably unlocked, projected to World detail, inherited by a fresh save and retained through Rewind, the owner's Profile contained no `成就`/`成就陈列` section or account-menu entry. The official App description promises Profile propagation, but the observed showcase on another user is a scored World-completion object with final score/Turn/evaluation metadata. Ordinary custom-grant eligibility, delay or defect status remains `UNKNOWN`.

The owner view replaces Follow/Gift with `编辑资料`, uses first-person section copy, exposes `我的合集`/create-collection/App sections, and badges owned World cards with unpublished-draft state and `继续编辑`. Account profile edits persist across reload and propagate to this Profile route. EVD-0217/0222 verify avatar propagation: SVG/PNG/JPEG upload/replacement updates the public resource and all three Profile projections; invalid `.txt` silently removes them to generic fallbacks, and valid recovery restores them. EVD-0210 verifies one external creator gift's 100-energy debit, 70-income settlement and donor row, while repeat/official-App gift gates remain unresolved. Independent-viewer draft visibility remains pending.

A freshly created public World Remix immediately increments the owner's creator World count and appears in `我的世界`. The implicit Remix v1 appears as a normal `编辑` card rather than `有未发布修改`; the latter badge is reserved for a later Draft diverging from the published version. This Profile propagation can precede unified Search indexing.

Evidence: EVD-0101–0103, EVD-0118, EVD-0217.
