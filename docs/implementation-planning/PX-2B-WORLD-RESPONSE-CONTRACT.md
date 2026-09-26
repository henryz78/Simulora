# PX-2b World Response Contract

**Date:** 2026-09-26 · **Status:** implementation authorized by the D1-A decision.

When a new `PARTICIPATE` Action omits `targetCharacterId`, the response source is
`WORLD`. The response may describe an unnamed person already present in the
scene, but it must not create a persistent Character, select a Character's
private knowledge, or authorize an effect outside the requested effect contract.

An explicit `targetCharacterId` keeps the existing Character selection and
knowledge boundary. Actions created before migration `0054` keep the previous
implicit selection so pending evidence, retries, and confirmations remain
valid. The cutoff is the migration ledger's immutable `applied_at` timestamp.

For a post-`0054` world response, the application compiler and SQL evidence
functions use the shared target fact only and emit an empty Character binding.
The SQL path remains authoritative for evidence; the application passes the
same cutoff decision into generation and confirmation validation.

Acceptance:

- a post-cutoff unaddressed Action sends `character: null` and expects
  `{ type: "WORLD" }`;
- its context and evidence manifest contain no Character id or private fact;
- an explicit Character Action is unchanged;
- a pre-cutoff unaddressed Action still selects the first Character who knows
  the target fact;
- direct SQL and application validation agree on all three cases.
