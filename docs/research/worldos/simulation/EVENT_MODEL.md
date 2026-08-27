# Observed Event Model

Status: `PARTIAL / black-box inferred`

Each Turn contains an initiating action, one or more narrative responses, and optional state operations displayed in Events.

## Action classes observed

- MainInputAction
- CharacterChatAction
- MapRegionShortcutAction
- MapRegionFreeTextAction
- AppPurchaseAction
- AppRefreshAction (phone newspaper and custom App refresh executed)
- Advisor/ConsoleAction (UI discovered; partial testing elsewhere)

## Delta classes observed

- story append/edit
- wallet balance increment/decrement
- wallet transaction append
- inventory/gear item append
- stat increment
- relationship update
- map region property increment/decrement
- current location movement (`Hokkai → Aomori`)
- quest/bounty status update
- App JSON update/set/inc/push/remove/action templates
- memory summary generation/edit

## Execution contract

1. Action enters the global Turn engine.
2. Header advances to next Turn and shows generating state.
3. Main input and mutable App controls lock.
4. Story/Chat responses stream or append.
5. Event Delta commits and all dependent Apps refresh.
6. Controls unlock; Timeline exposes the Turn.

Not every Turn has every Delta: a Chat Turn may only add Chat/relationship state; an iframe-local button may change DOM without a Turn or Event.

## Evidence

EVD-0016, EVD-0020, EVD-0030, EVD-0042, EVD-0043, EVD-0044, EVD-0105.
