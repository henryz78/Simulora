# Persistence System

Status: `TESTED / PARTIAL`

Simulation URLs persist and resume server-side state. Checkpoints are separate Simulation URLs/saves, with three free slots plus purchasable expansion. Historical view is read-only and can show mixed current configuration/Memory; Rewind restores Turn state and forks the future. WorldVersion application changes configuration without rebuilding Turn history. In the v3→v4 no-add/remove sample, application consumed no Turn, preserved the complete Turn-1 Story and three-App dock, persisted the applied v4 marker after reload, and suppressed the already-applied prompt.

Evidence: EVD-0018–0020, EVD-0031, EVD-0094.

## History index freshness boundary

The same Simulation can show different turn labels across surfaces immediately after a Turn: World detail displayed Turn 2 while Mine/Global History still displayed Turn 1. Treat the History index as a potentially stale or “last indexed save” view until refresh/close/reopen experiments prove otherwise.

Evidence: `EVD-0072`.
