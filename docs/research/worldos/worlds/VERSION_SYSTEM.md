# Version System

Status: `TESTED / PARTIAL`

Versions are append-only published snapshots v1→v2→v3→v4/v5 in current test content with independent titles/changelogs. Draft changes remain owner-visible until publish. Existing Simulations bind an applied version and receive latest-version prompts. `暂不更新` suppresses the current target; later published versions re-prompt. Add/remove App updates successfully merge into a Turn>0 save while preserving Story/Turn. A second no-add/remove v3→v4 sample successfully advanced the applied version without consuming a Turn or changing Story/App composition; thus configuration application is an explicit migration transaction, not a restart. A separate title-only Hogwarts case previously looked like a no-op, so page refresh/index timing and update-content differences still require care.

The independent v3 World sample `TEST App Upgrade World 001` confirms the modal contract again and creates a runtime baseline that combines a community App and World-local Character. The new Turn-1 Simulation uses App v4. App versioning itself does not expose a comparable pin/update UI yet.

World v5 follow-up (EVD-0110) verifies that applying a published World version to an existing save is a field-level migration: new Simulation seed read `clicks:999`; existing Turn-2 save applied v5 at zero Turn cost, retained Turn/Story and existing mutable `clicks:0`, while merging new `status`/`observedInitial` initialization fields. EVD-0155/0235 then resolves the ordinary nested precedence as deep three-way merge: path-level dirty leaves survive, clean siblings update, stable-`id` object arrays union, clean versus dirty null conflicts differ, omission preserves the old value, runtime-only fields survive, and fresh saves use the literal latest seed. No-ID/duplicate-ID arrays, tombstones and type conflicts remain separate edges.

Historical-version presentation is a read-only changelog, not a visible snapshot browser. On a four-version World the default section shows v4/v3/v2; `展开全部` reveals v1 and changes to an accessible `收起` control. In both states the version container has zero links and no version-specific buttons/menus; only expand/collapse is interactive. Page Share uses the latest canonical World URL without a version identity. Therefore historical URL/share/Remix is `NOT DISCOVERABLE_IN_NORMAL_UI`; undocumented backend routes remain `UNKNOWN` and were not guessed. Evidence: EVD-0188, EVD-0207.

Evidence: EVD-0029, EVD-0031, EVD-0058, EVD-0094, EVD-0110, EVD-0188, EVD-0207, OQ-0005, OQ-0014.
