# World System

Status: `PARTIAL`

World is the published playable configuration, not a single story transcript. Observed fields include title/slug, cover, theme, description, tags, visibility, remix permission, Characters, player initialization fields, Apps and each App's configuration, system rules, win/lose rules, opening scene, advisor presets, console permission, layout and WorldVersions.

Published Worlds expose discovery/detail actions: start a new Simulation, continue an owned save, Remix, share, favorite/collection and owner edit/delete. World cost is displayed as a range derived from model/complexity; App and Character count affect cost.

Published final delete uses a browser-native confirm. In the controlled World-with-one-save sample, acceptance redirected to `/worlds` and immediately invalidated World detail/edit/new, exact Search, Mine Works/Profile and the child Simulation runtime. It did not debit/refund energy or affect unrelated objects. The operation is not projection-atomic: Mine History retained a writable metadata card pointing to the now-404 child UUID, and a post-delete Rename persisted across reload. The card's remaining in-page Delete then removed the orphan metadata row without restoring the runtime and persisted after reload, with no Undo/Restore (EVD-0221, EVD-0223).

Evidence: EVD-0022, EVD-0029, EVD-0031, EVD-0038, EVD-0221, EVD-0223.
