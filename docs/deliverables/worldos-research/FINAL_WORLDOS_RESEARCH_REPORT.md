# WorldOS Product-Level Black-Box Research Report — Final

## 1. What WorldOS is

WorldOS is a creator-and-player platform where a published World is a versioned configuration of AI rules, Characters, Apps, optional Map and player setup. A Simulation instantiates that configuration into a persistent Turn-based state machine. Community discovery, Remix, versions and sharing surround the runtime.

## 2. Core mechanism

The core mechanism is a global Turn engine plus Event Delta synchronization: a player action, Chat, Map action or App action generates a narrative response and structured state operations; Story, Wallet, Inventory, Stats, Relationships, Quests and Map update together.

## 3. What a World contains

A World is a versioned configuration aggregate rather than a running save. Its observable definition can include title/slug, description, cover, tags, genre and audience; story and system instructions; player-setup fields; Characters or World-local Character copies; installed Apps and per-App configuration/Initial JSON; optional Map regions, factions and markers; time configuration; achievements; visibility; Remix permission and direct-parent attribution. Draft state is separate from the currently published version.

The tested lifecycle covers ordinary and template creation, Draft autosave/reload, Preview, first Publish, repeated Publish through v10+, required update logs, public detail, post-publish editing, old-Simulation update/decline, Remix, enforced no-Remix publication and final deletion. Public/Unlisted/Private controls are visible to the free owner, but both non-public choices enter the membership wall before mutation, so their actual external enforcement remains entitlement-blocked.

## 4. What a Simulation contains

A Simulation is an independent runtime instance of a World version with its own stable URL and state. It contains a version binding, Turn counter, Story, Events/Timeline, time, World State, Stats, Relationships, Quests, Wallet, Inventory, Character Chat and Memory, installed-App/runtime state, Map state, World Memory, Important Facts, one-time `playerSetup`, achievement projections and checkpoint/Save/Rewind state.

Two Simulations of the same World evolve independently. A new Simulation reads the current World definition; an existing one may stay on its prior version or explicitly apply an update. Permanent Simulation deletion eventually removes its History/sidebar/direct-URL projections. Deleting the parent World can instead leave an orphan History card that remains renameable and separately deletable even though the runtime URL no longer resolves.

## 5. What happens in a complete Turn

A Turn starts from the main input, Character Chat, a Map action or an App action. The current model and active Apps determine the displayed cost and runtime context. A successful AI action returns narrative or chat output plus state operations, increments the Turn, deducts energy and may update Story, Events, Time, Wallet, Inventory, Stats, Relationships, Quests, Map and App data together. Related Apps then project the shared state, sometimes immediately and sometimes only after reload.

Not every state-changing action is a paid Turn: identity submission, configuration changes and version application can be zero-Turn/zero-energy operations. Error behavior is surface-specific rather than uniform. The Time App also accepts obviously invalid free text and submits it as an ordinary Turn instead of showing a dedicated parse error (`EVD-0250`). Positive-but-underfunded execution, delayed projections and stale Dock state are retained as defect baselines rather than generalized rules.

## 6. How Character persists

Character persistence has three distinguishable layers: a global Library/creator definition, a World-local copy embedded in a World, and runtime Character state inside a Simulation. Source edits or deletion do not necessarily cascade into an existing World-local copy, World Remix or Character Remix. Runtime state adds relationship, Chat history and Memory to the definition snapshot.

Creation, edit, avatar selection, publish/visibility gate, two-level Remix, Add-to-World, source deletion, independent Chat and real charged Character AI Turns were exercised. A Character Remix persists in Mine but currently lacks the normal Character object's stable detail URL, Edit/Delete/More controls and visible parent attribution; its unified-search/library projection can also remain absent. Those missing UI projections are recorded as observed limitations, not proof that the backend object does not exist.

## 7. How App participates in a World

An App is simultaneously a reusable marketplace asset, a Creator definition, a World installation/configuration and a Simulation runtime module. Observable authoring fields include metadata, category/icon, HTML Preview, Initial JSON, configuration and AI/Event instructions. The tested lifecycle covers create, Preview, first Publish, version update, downlist/re-publish, Market projection, two-stage World install, Simulation execution, dynamic install/uninstall and deletion.

Apps share the Simulation state rather than running as isolated mini-sites. Shop, Wallet, Inventory, Social, Time, Map, Character Chat and Achievements can all read or mutate overlapping state through Turns and Events. Installing an extra App can increase subsequent Turn cost; Rewind to before installation restores active state and price, although a stale Dock item may remain until reload. Initial JSON migration uses a tested path-level three-way merge with stable-ID object-array union; no-ID/duplicate-ID arrays, explicit tombstones and type conflicts remain UNKNOWN.

## 8. How World State stays consistent

The observable consistency model is one authoritative Simulation state plus Turn/Event operations, version migration and multiple UI projections. A single action can change several Apps at once, and repeated purchase tests retain Wallet/Inventory/Shop agreement across reload. Creator Draft changes do not directly overwrite a running save; applying a version update merges clean paths from the new World while preserving player-dirty paths in the tested cases.

Consistency is not equivalent to immediate UI synchronization. App Dock, Favorite lists, Achievement counters and some discovery surfaces can require reload to converge. Rewind has explicit snapshot boundaries: Story, Events, time, relationships, Chat, social state and active Apps can roll back, while spent Credits do not; Important Facts, one-time player identity and the Account×World achievement ownership ledger remain outside the verified runtime rollback boundary.

## 9. How Memory behaves

WorldOS exposes several different persistence mechanisms. Character visible Memory is generated in batches rather than every Turn: the main sample stayed empty through T21, first produced a summary at T25 covering through T23, and therefore had a two-Turn tail lag. A manually edited conflict value survived reload, influenced later replies and remained unchanged through T31. An older checkpoint retained its earlier Memory state, demonstrating branch isolation.

Hidden conversational recall is distinct from the visible Memory card because early facts were recalled while the card was still empty. World Memory is separately editable, persistent and injected into later World turns. Important Facts is another snapshot-external metadata field: Save/Discard, the free 200-character bound, reload, empty clear and exact restoration are verified; clearing is a direct durable write with no confirmation or Undo and no Turn/energy charge (`EVD-0251`). Manus contributes a non-matched second Character sample, but its different object/model context and one screenshot mismatch prevent any fixed summary threshold or long-term merge policy from being promoted to VERIFIED.

## 10. How Remix works

World Remix performs a deep product-level copy into a new owner object. The copy immediately receives its own slug and published v1; the first later explicit publish becomes v2. Characters, Apps, Map and configuration can be copied, after which the child evolves independently. Multi-level L0→L1→L2 Remix was exercised across accounts.

Visible attribution points only to the direct parent. If an intermediate parent is deleted, descendants, direct URLs, search visibility and further Remix can survive while the attribution block disappears without a tombstone. A published `do not allow Remix` setting is genuinely enforced: Guest loses the main Remix affordance and a logged-in non-owner is blocked at the final copy action without a child being created. Character Remix has a weaker discoverability/editing surface and is documented separately.

## 11. How Creator works

Creator is a family of stateful, multi-step editors for Worlds, Characters, Apps and Maps. World Creator combines basic metadata, story/rules, Characters, Apps, Map, player setup, Preview and Publish. Draft autosave survives reload; some validation occurs only at Publish, including cover, App-count and update-log requirements. Eleven built-in World templates were enumerated, and two template families were carried through field editing, required/default behavior, reload, publication and fresh-Simulation propagation.

Character Creator manages persona/avatar/visibility and post-publish edits. App Creator separates definition, HTML Preview, Initial JSON and version publishing. Map use can target a new or existing World: the existing branch writes only to Draft and asks for publication, while one new-World path publicly created a Map-less v1 before retaining the selected Map in an unpublished v2 Draft. Mobile Creator uses a narrow navigation rail and explicit Preview modes rather than merely scaling the desktop canvas.

## 12. How Map works

Map is both a catalogue asset and a World/Simulation subsystem. The Library exposes Base/All/Regions scopes, 36 genres, title/creator search, an explicit empty state, reload reset and silent 16-card pagination. The main account produced a Base snapshot of 1,083 cards; independent Manus structured evidence produced Base 1,085 and All 1,181 with 96 All-only links. These counts are time/account snapshots, not stable constants.

Cards open an in-page large preview whose zoom and drag controls work. `Use this map` can create a World or write All/Base/Regions data into an existing World Draft. Region, faction/alias and marker definitions propagate through publication, old/fresh saves and Rewind; Map actions can also consume Turns and mutate shared state. Catalogue eligibility/ranking, the cross-snapshot card delta, the file-picker-blocked new-World v2 publication and a few direct runtime mutation edges remain bounded UNKNOWN/BLOCKED items.

## 13. How Community works

The platform layer combines Explore/Worlds discovery, unified Search, Character Library, App Market, Map Library, Community rankings, public creator Profiles, Follow/Favorite, Comments, Ratings, Collections, Share/Rewards and Gifts. Mine separately projects created/favorited Works and Simulation/Character History.

Community's nine user/creator/supporter rankings and five World rankings were individually triggered; current lists have finite terminals but ranking formulas and update cadence remain unknown. Collections support create, search, ordering, member add/remove, Public/link-visible/only-me owner settings and whole-object deletion without cascading member Worlds. A link-visible Collection is direct-link accessible but omitted from public discovery and gives non-owners no management controls. Guest versus logged-in non-owner permissions, creator privacy, cross-account Remix, rating-play prerequisite, comment behavior and follow/favorite persistence are covered by the independent-account audits.

Gift behavior is object-specific: tested Profile and World gifts deducted face value and credited 70% to the recipient's creator income, while official and community App gifts failed in the observed samples and one failure produced an anomalous `-5`. Real payment, subscription and Credit purchase were intentionally not completed.

## 14. Complete system inventory

The research inventory currently contains 70 mapped Feature IDs. At product-architecture level they fall into these systems:

- Global navigation, locale routing, account menu, sidebar history and acquisition/intent landing pages.
- Explore/Worlds discovery, public World detail, owner controls, Saves/Versions and World Creator/Templates.
- Character Library, detail/drawer, creation/editing, avatar resources, social actions, Chat, Remix and global-versus-World-local identity.
- Simulation initialization/runtime shell, one-time player identity, main Turn engine, Story, Events/Timeline, World State, Time and export boundary.
- Memory: hidden recall, visible Character Memory, World Memory and Important Facts.
- Save/checkpoints, History/Resume, Rewind/branch and permanent cleanup.
- App Market, App detail/Preview, App Creator/versioning, install/configuration, dynamic runtime install/uninstall and cross-surface discovery.
- Official/custom runtime Apps including main input, Character Chat, Wallet, Shop, Inventory, Stats, Relationships, Quests, Social, Time, Map and Achievements.
- Map Library, preview, import scopes, Map Creator, World binding and runtime region/faction/marker state.
- Remix lineage/permission and World Version migration.
- Search, recommendation, Mine, Community rankings, Profiles, Collections, Follow/Favorite, Rating/Comment, Share/Rewards, Gifts and Notifications.
- Authentication, Account/Profile/preferences, avatar lifecycle, Models, BYOK, private presets, Credits/pricing and account-deletion gate.
- Responsive/mobile navigation, Creator and Simulation behavior.

The authoritative item-level inventory is `docs/research/worldos/01_MASTER_FEATURE_INVENTORY.md`; page inventory and controls are in `docs/research/worldos/02_FULL_SITE_MAP.md` and `docs/research/worldos/ux/PAGE_CONTROL_AUDIT.md`; system detail is split across the `docs/research/worldos/worlds/`, `docs/research/worldos/characters/`, `docs/research/worldos/simulation/`, `docs/research/worldos/apps/`, `docs/research/worldos/maps/`, `docs/research/worldos/platform/` and `docs/research/worldos/ux/` specifications.

## 15. What is VERIFIED

`VERIFIED` means the stated behavior was executed and re-observed at the claimed identity/object/time boundary; it does not mean every backend edge is known. Major verified or strongly tested mechanisms include:

- World Draft/Preview/Publish/update/version/delete and template-to-runtime propagation.
- World Remix independence, direct-parent attribution, multi-level copies and published no-Remix enforcement.
- Character create/edit/Chat, global-versus-local snapshot survival, manual visible-Memory persistence and checkpoint isolation.
- Charged World-main and Character-Chat AI Turns with shared state/Event propagation.
- Independent Simulation saves, checkpoint expansion, Resume, permanent deletion and World/Time/Social Rewind behavior.
- Rewind membership for Story, time, relationships, Chat, social/App state versus snapshot-external Credits, Important Facts, player identity and achievement ownership.
- World Memory injection and Important Facts save/discard/limit/empty-clear/re-entry lifecycle.
- App create/Preview/publish/downlist/re-publish/install/run/update/uninstall/delete, dynamic pricing and path-level version merge.
- Wallet/Shop/Inventory and other cross-App state propagation.
- Map catalogue controls/pagination, preview interaction, import scopes, faction/marker propagation and runtime/Rewind coupling.
- Achievement create/grant/idempotency/version/removal/uninstall/reinstall/same-name-new-ID/Rewind behavior and its three distinct projections.
- Mine matrices, Search surfaces, Collection lifecycle, Community control set, notification read/pagination/deep-link behavior and responsive core flows.
- Profile/World gifting successes with a 70% recipient projection, plus separate App-gift failure baselines.
- Account model/BYOK form boundaries, locale persistence, avatar SVG/PNG/JPEG/WEBP/GIF/aspect/EXIF handling and delete-confirmation gate without actually deleting the account.

Primary direct evidence is indexed through `EVD-0251`. External evidence remains separately labeled `MANUS-*`; no external report-only claim is silently promoted to main-account VERIFIED.

## 16. What remains UNKNOWN or BLOCKED

All remaining questions are enumerated with a reproducible experiment in `docs/research/worldos/06_OPEN_QUESTIONS.md`; none should be inferred away. They fall into four bounded classes:

1. **Entitlement, credential or device blocked:** actual Private/Unlisted and only-me external enforcement, paid App/Important-Facts limits, successful real BYOK/provider recovery, export/import artifact, cross-device behavior and real-device touch/IME/safe-area/background behavior. No payment, real secret or fabricated device evidence is permitted.
2. **Not discoverable through normal UI:** Character-Remix stable detail/edit/delete, intermediate Character-parent deletion and historical World-version navigation/share/Remix. Hidden routes are not guessed.
3. **Policy, cadence or long-horizon unknowns:** ranking/recommendation/index eligibility and SLA, Memory batch/merge/overwrite policy, retention, concurrency ordering, notification delivery policy and broader cross-account generalization.
4. **Narrow parser/schema/error edges:** no-ID or duplicate-ID arrays, explicit tombstones and type conflicts in App migration; exact identity-field arbitration; extra Time grammar; avatar extreme size/network/reset; gift eligibility and the failed-App debit anomaly.

Known product defects or inconsistent projections are retained as `DEFECT-BASELINE`, not relabeled UNKNOWN and not generalized beyond the tested fixture. The full current disposition is in `docs/research/worldos/08_MISSING_FEATURE_AUDIT.md` and `docs/research/worldos/10_FINAL_COMPLETENESS_AUDIT.md`.

## 17. Systems required for a reimplementation

A parity-oriented implementation needs the following architectural units before surface-level UI work can be considered complete:

1. Identity, authentication, Profile, preferences, entitlements, model/BYOK and Credit ledgers.
2. A typed object registry for World, Character, App, Map, Collection and Simulation, with ownership, visibility, lifecycle and stable identifiers.
3. Draft/published revisions, immutable World/App version snapshots, update logs and optimistic-conflict handling.
4. Deep-copy Remix with direct-parent lineage, permission enforcement and deleted-parent-safe descendants.
5. A Simulation store separating World-version baseline, player-dirty runtime state, snapshot-external metadata and derived projections.
6. A global Turn orchestrator with model routing, energy pricing, structured Event operations, idempotency and failure accounting.
7. Shared schemas for Story, Time, Character/Relationships, Wallet, Inventory, Stats, Quests, Social, Map and Achievements.
8. Save/checkpoint/timeline/branch services with explicit per-field Rewind policy.
9. Memory services separating prompt history, hidden recall, generated visible summaries, manual edits, World Memory and Important Facts.
10. App authoring/runtime sandbox, HTML Preview, configuration, Initial JSON merge and install/version management.
11. Map catalogue/editor/import/runtime services with regions, factions and markers.
12. Search, discovery, recommendation, Market and Mine projections with observable convergence states.
13. Community services for Profiles, Follow/Favorite, Rating/Comment, Collections, Share, Gifts, Notifications and rankings.
14. Responsive desktop/mobile shells, accessibility/keyboard behavior, localized routes, confirmation/toast/error conventions and page-level control inventories.
15. Evidence-friendly observability and deterministic fixtures so state, cost, version, projection and rollback boundaries can be regression-tested.

## 18. How to reach complete Product Experience Parity

Parity should be measured by equivalent user tasks and state transitions, not pixel copying or matching inferred backend internals. For every Feature ID, implement and test the same discoverable entry, precondition, control sequence, confirmation/error state, persisted mutation, public/owner projection and cleanup behavior. The authoritative contract is `docs/research/worldos/04_WORLDOS_PARITY_MATRIX.md`; executable scenarios are in `docs/research/worldos/05_PARITY_TEST_SUITE.md`.

The recommended order is:

1. Implement object identity, ownership, Draft/version and Simulation state boundaries.
2. Implement the global Turn/Event engine and cross-App schemas before individual Apps.
3. Add save/update/Rewind/Memory rules with field-level snapshot tests.
4. Add Creator and complete World/Character/App/Map lifecycles.
5. Add Remix, discovery projections, Mine and community permissions.
6. Reproduce desktop/mobile control availability, modal/toast/error/empty/loading states and known defect baselines where compatibility requires them.
7. Run every parity case across owner, logged-in non-owner and Guest where evidence exists, plus fresh/dirty/old-version/deleted-parent/low-credit/mobile fixtures.
8. Treat every unsupported claim as UNKNOWN and add a focused reference experiment rather than inventing behavior.

Final acceptance is the Master Specification's two-browser test: a user familiar with WorldOS must be able to find the corresponding function in the future product, execute the same task and obtain the same core capability, state transition, persistence and lifecycle result. The Missing Feature, Cross-System, page-control, Parity and Final Completeness audits are now signed off. Research stops here; implementation remains `NOT STARTED` until a separate next-stage instruction.
