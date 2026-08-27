# Character System

Status: `PARTIAL / TESTED`

Character definition includes avatar, name, role/personality prompt, public description, gender, up to three tags, visibility and optional imported/avatar-maker source. Library supports search/debounce, tags, gender, sorting/time filters, Chat and Add. Detail exposes author/follow/favorite/comments/rankings/supporters/cost and owner edit/remix/add actions.

Definition is distinct from runtime state: Simulation Character State exposes relationship values, bond, mood and trust. Character Remix copies App-specific portrait/attributes/start values; current L1/L2 copies lack visible source attribution.

Character Remix ownership and public discovery are separate projections. `TEST Character Remix 003` persists in Mine, opens a functional Drawer and supports a long independent Chat/checkpoint, yet later exact searches in both `/characters` and Unified Search's `tab=chars` still return their empty states. The clone exposes no stable Character href. This is a verified discovery omission for the sample, but black-box evidence cannot determine whether it is intentionally owner-only, unpublished, or an indexing defect.

Adding a global Character to a World produces an editable World-local snapshot. Later global-source prompt/intro edits update the source record but do not change the local Profile card or the World Creator definition; local edits likewise do not mutate the source. Final deletion of the source also preserves the World-local copy, published World, tested World Remix descendants and Character Remix L1/L2.

Source deletion does have a Simulation-side consequence: the source's independent Character Chat save returns 404, while global History retains the source label/Character ID/Turn link. This shows separate cleanup timing for object resolution and History indexing. By contrast, both L1 and L2 Remix Chats remain independently runnable: each created a stable Simulation UUID, completed a charged AI Turn under the copied role name and retained messages across reload. A fresh World Simulation also initialized the preserved World-local Character in Chat; a later zero-Turn World update added Character State for the same role while preserving Turn/Story/Chat/Map.

## Long conversation, recall and branching

- EVD-0213 advanced `TEST Character Remix 003` from opening Turn 1 to Turn 20 with Deepseek at 4/Turn. A unique secret introduced at Turn 2 was recalled exactly at Turn 11 after eight unrelated topics.
- Memory remained visibly empty at Turn 7/10/11/15/20 despite the long multi-paragraph transcript. Reload restored all 60 paragraphs and recall evidence; visible Memory is therefore not a prerequisite for Character-context recall.
- A named Turn-20 checkpoint created independent UUID `/zh-cn/sim/4a7ab16e-90ee-4cda-a427-7334f69ece75`; it copied the entire transcript/recall state and advanced to Turn 21 while the source stayed at Turn 20.
- Character Timeline supports read-only historical transcript prefixes, but the tested view has no historical Restore/Fork/Back-to-now controls. Selecting the latest Turn exits historical mode. This is narrower than World Simulation Rewind.
- Underlying pre-summary retrieval mechanism remained `UNKNOWN`; EVD-0232 later bounded one summary's appearance to after T21 and by T25 without establishing a universal threshold.

EVD-0232 narrows that threshold and proves edit semantics. The same source remained Memory-empty at T21, showed its first editable summary by T25 and retained it on reload. The summary covered conversation only through T23, omitting T24/T25. Appending a Memory-only conflicting code (`橙铜-8842`) survived reload and controlled the T26 answer over the transcript's older code. The pre-existing T20 checkpoint remained Memory-empty after the source edit, so visible Character Memory is per-save/branch state rather than Character-definition state. EVD-0233 continues through T31: five more Turns do not merge, overwrite or create another visible entry, and the edited value is recalled again. Exact later cadence/merge policy and non-Remix/model generality remain `UNKNOWN`.

Evidence: EVD-0021, EVD-0033, EVD-0044, EVD-0104, EVD-0123–0124, EVD-0127–0128, EVD-0213, EVD-0232–0233.
