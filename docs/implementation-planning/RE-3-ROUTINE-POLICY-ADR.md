# ADR-RE3 — Bounded administrative routine policy

Status: implemented under the user-approved RE-3 contract; independent repair
review pending. This supplements ADR-008/010/012 without changing their authority.

The frozen World/Character schema does not identify user avatars or declare
location safety. Therefore neither "not named like the player" nor an authored
route grants permission. RE-3 uses an immutable administrative policy attached
to a pinned World Revision: version, explicit NPC IDs, public location IDs and
directed permitted routes. There is no creator/user policy-writing API, no
automatic policy for the production seed and no permission inferred from prose.
The test administrator explicitly certifies synthetic fixture identities.

PostgreSQL validates references and derives the canonical policy digest at insert.
The worker loads that policy, passes its routes to the adapter, validates only its
NPC/route allow-list and seals its digest into generation evidence. Proposal
validation reconstructs the same manifest. Updating/deleting policy is prohibited;
different authority requires a new pinned revision/policy, not mutable evidence.

MOVE_CHARACTER changes only the selected NPC's location and deterministic
location description, plus existing successful-turn bookkeeping. It still
requires exact actor/digest/head confirmation and the original atomic ledger.
No private fact, avatar action, protected commitment or participation change is
granted. L0 remains uncommitted diagnostic output, followed by explicit experiment
cancellation; remembered advice-only dialogue remains a separate product decision.

This does not supply a general avatar/permission system for arbitrary worlds.
That ceiling must be resolved before general production routine enablement.
Acceptance: real-PG policy reference/immutability probes, app/SQL proposal
binding, movement materialization, stale/duplicate/cancel and G5 snapshot tests.
