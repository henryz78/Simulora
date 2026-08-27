# Turn Engine

Status: `TESTED / PARTIAL`

Turn-triggering actions observed: main input, Character Chat, Map shortcut/free text, Shop purchase and App refresh. Phone `预言家日报` refresh consumed 9 Energy, created Turn 2, recorded the refresh as the player's action and regenerated App fields/issue content while the main Story card did not paginate. On submit, header advances, `世界正在回应…` appears, mutable controls lock, Story/Chat streams or App state regenerates, Event Delta commits, dependent Apps refresh, then controls unlock. Iframe-local DOM buttons do not automatically create Turns unless wired to an App action such as refresh.

Costs depend on selected model plus configured extra Apps. Credits are account-level and not rewound.

Insufficient-credit preflight is not price-aware in the tested Deepseek 8/Turn sample (EVD-0212). Starting with 1 energy still allowed a complete Turn, committed Story/cross-App state and persisted `-7`; the following submission was blocked by `电量用完了` and created no new Turn. After external test quota was added, the same UUID resumed at the committed Turn 4 and the rejected Turn-5 action was absent. Implement parity tests against both the underfunded-positive and already-negative states rather than treating them as one generic error.

Evidence: EVD-0016, EVD-0030, EVD-0042, EVD-0043, EVD-0105, EVD-0201, EVD-0204, EVD-0212.
