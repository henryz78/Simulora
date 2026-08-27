# World Remix System

Status: `VERIFIED CORE / PARTIAL EDGES`

World detail → 改编 immediately creates a new slug and public v1 with visible `改编自` attribution. Opening Creator after that transaction shows `发布 v2`, so Remix itself is the initial publication boundary rather than only a Draft-copy action. The copy includes metadata, Characters/World-local snapshots, Apps, Map, App configs, setup fields, rules, opening, advisor, console and layout. It is independently owned/editable/versioned; the source is not mutated.

Cross-account L0→L1→L2 tests show that visible attribution points to the immediate parent only. An L2 page does not flatten all ancestors into its attribution block; provenance is followed by traversing parent links. The non-owner sees Follow/Start/Remix/reaction/collection controls but not Edit/Delete. A cross-account Remix creates an owner notification deep-linking the new child World. A freshly remixed World may appear immediately in owner Profile/Mine while still absent from exact-title unified Search, so discovery indexes should be modeled as asynchronous rather than transactionally coupled to publication.

Disabled-remix enforcement is verified: owner retains the exception; Guest main detail hides Remix, a Collection card may silently no-op, and a logged-in non-owner is blocked at final copy without a child. In a disposable cross-account L0→L1→L2 chain, deleting the intermediate parent made that parent 404 and removed the descendant's attribution block without a tombstone label; the L2 child remained direct-accessible, searchable, editable and remixable. Attribution therefore depends on the direct parent projection, while copied descendant content is independently owned. Entitled source-visibility changes and existing-descendant exceptions remain unknown.

Evidence: EVD-0022, EVD-0118, EVD-0171, EVD-0192; external attribution-deletion evidence is quality-bounded in `11_PARALLEL_AUDIT_MERGE.md`.
