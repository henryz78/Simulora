# Template System

Status: `VERIFIED for field materialization, additive merge, Draft/public `/new` persistence and fresh-Simulation story propagation / PARTIAL for replacement and runtime edge semantics`

Creator `题材模板` opens a chooser of built-in templates: modern romance, school youth, cultivation, wuxia, palace intrigue, transported other-world, idol, western fantasy, apocalypse, cyberpunk and war regime. Each card previews its player-field categories.

Controlled clean-Creator experiment selected `西幻冒险`. It immediately materialized four full player initialization-field definitions while leaving the default six-App set unchanged:

- `种族`, variable `race`, options `人类/精灵/矮人/兽人/半身人/龙裔`;
- `职业`, variable `class`, options `战士/游侠/法师/盗贼/牧师/吟游诗人`;
- `出身`, variable `origin`, options `没落贵族/农家子弟/孤儿/商队学徒/流亡者`;
- `信念`, variable `creed`, options `秩序与责任/自由至上/利益优先/守护弱者`.

Each field exposes default answer, role-list-as-options, option editor, variable reference syntax such as `{{race}}`, multiline and required toggles. The chooser stayed open after application. Applying a second template (`赛博朋克`) appended four more complete fields (`出身层区`, `义体改造`, `营生`, `与巨企的恩怨`) after the existing western-fantasy four; it did not replace or deduplicate the first set. The World was not created/published, so `/new` persistence remains to be verified.

EVD-0156 closes the persistence loop: a clean `TEST Template World 001` was created, selected Modern Romance then Cultivation, autosaved/reloaded with all 11 fields, published as v2, and opened at `/new`. A fresh Simulation exposed the same setup schema and its Turn-1 opening Story incorporated submitted values (`Alice`, `天灵根剑修`, `山村...孤儿`, `亲传弟子`). The default six-App set and blank system prompt remained unchanged, so no template-specific App or visible rule injection is claimed.

EVD-0157 additionally verifies the required/default boundary: setting `身份` default to `匿名冒险者` and checking `必填` publishes a `/new` field labelled `*身份` with that value prefilled. Clearing it and attempting `立即开始` leaves setup open and restores the default, with no visible validation toast. Remaining UNKNOWN: exact `{{variable}}` serialization into App prompts, behavior when the default itself is empty, template replacement/removal, and whether hidden genre rules appear only after later Turns.

Evidence: EVD-0034, EVD-0059, EVD-0060, EVD-0156; OQ-0011/OQ-0015.
