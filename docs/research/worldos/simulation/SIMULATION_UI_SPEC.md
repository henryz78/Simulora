# Simulation UI Specification

Status: `PARTIAL / TESTED`

Top bar: World/back, save name, Turn, Events, Memory, Advisor, Settings. Workspace: draggable/minimizable/fullscreen App windows; central suggestions/action composer; bottom Dock and Add App. Settings contains detail/comments/saves, Credits, console, checkpoint, identity, facts, export, language/voice/model, Add App, font/theme/fullscreen/onboarding.

Mobile supports a distinct persisted `文游小手机` mode, not only stacked windows. Bottom navigation is `剧情 / 手机 / 设置`; the phone home owns installed App icons, persistent image widgets and empty widget slots. Widget removal restores an empty slot and persists; scene assets and current-World Character avatars can fill slots. App screens use an internal clock/title/back/refresh shell. `back` returns home, while `刷新` can invoke a full charged App Turn and regenerate state/content rather than merely reload the iframe. Runtime `切换界面模式` converts the same Simulation between phone and Free Sandbox without consuming a Turn or resetting Story.

Evidence: EVD-0025, EVD-0030, EVD-0040–0042, EVD-0096–0097, EVD-0105.
