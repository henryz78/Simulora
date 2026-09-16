# RE-3 — Bounded Routine Reality Comparison

Status: FOUR-SAMPLE LIVE COMPARISON COMPLETE / ONE NEW GUARD FALSE POSITIVE.
No automatic production repair, full RE-4 or IP-7.
Approved production behavior: `f435d5b35dcf53c4493a78e84ea0b611872e832b`.
[Independent closure](RE-3-INDEPENDENT-REVIEW.md) is separate engineering evidence.

The user's "continue" authorizes this small isolated comparison with the supplied,
ignored profile. Four samples are the initial useful corpus, not a user quota.
Stop on provider limits/errors, changed model routing or privacy exposure;
no automatic retries, substitutions, edited model outputs or relaxed guards.

## Isolation / executable seam

Use `scripts/product-reality-spike.ts --re3`, a fresh UTF-8 localhost PostgreSQL
database and ignored `.local-data/re3-routine-reality/` session/evidence journal.
Preserve all predecessor Spike/RE-2 journals. Only synthetic adult test actors,
original fictional locations and private scope probes; no real user private data.
The runner's admin declares Iora/Tavi to be NPCs and explicitly public two-location
routes in the pinned fixture policy. The player is not either Character.
The production seed, adapter, API/worker composition and approved migrations are
unchanged. An injected live adapter uses the approved repository lifecycle; the
attempt adapter enum still says deterministic, so the separate journal explicitly
records the live provider dispatch. It is not a production provider identity claim.

## Initial sequence

1. Tavi: explicit safe shore move from observatory to east lookout. Inspect the
   raw proposal before synthetic test-actor exact confirmation. Current facts/
   participation unchanged; location/history/head change only after Commit.
2. Tavi: no-world-effect answer about the approach from the new location.
   Check causal continuity/committed prior scene. Cancel after inspecting output;
   uncommitted dialogue is not durable conversation or a new world change.
3. Iora: refuse/advise on an unsafe invitation, NO_WORLD_EFFECT. Distinct motive/
   knowledge; no Tavi-only context. Explicitly cancel the diagnostic Action.
4. Same Iora intent/head under FACT_REWRITE. Inspect whether the forced envelope
   invents an unnecessary beacon rewrite. Cancel it, do not adopt for test success.

All confirm/cancel decisions are the main Agent acting as the named synthetic
test actor, recorded explicitly—not human participant approval. Unknown/private
references and protected mixed effects are covered by prior engineering probes;
do not count those as live samples without actual calls.

## Questions / honest interpretation

Does the model use the selected Character, location and prior committed movement?
Does no-effect advice avoid fabricated world mutation? Can the answer remain
character-specific without overriding the player? Is an exact confirmation still
unnecessary friction for this routine move? Keep outcome/latency/usage/guard false
positives and effective-once ledger evidence separate.

This comparison is not human browser play, full RE-4, 20-session validation or an
AI World completion claim. The small mutation envelope and unremembered L0 are
still known bridges toward long-lived world play. After actual outcomes, arrange
a user-driven short play sample rather than declaring that the world feels alive
from SQL success. IP-7 remains not started.

## Actual results

### Source and provider

Approved behavior `f435d5b35dcf53c4493a78e84ea0b611872e832b`; the later
`3abaa4e` commit records independent closure only. This run uses the isolated
runner-only RE-3 extension, committed with this report, not a new approved
production behavior SHA. Dispatches occurred on 2026-09-16 UTC (2026-09-15 local).
Same supplied endpoint/profile/model; requested and returned model for all four
is **deepseek-ai/DeepSeek-V4.1-Flash**. JSON output, max 4096 completion tokens,
`enable_thinking:false`; no routing substitution or hidden reasoning recorded.

All four dispatches returned model output, no 429/automatic retry. Total reported
usage **7,215 prompt + 1,057 completion = 8,272 tokens**. No cost/retention guarantee
is inferred from a publicly supplied service. Raw prompts/output/usage and decisions
remain in the ignored journal, never credentials or full provider envelopes.

### Outcomes

| Sample | Model latency | Tokens | Real lifecycle / decision |
| --- | ---: | ---: | --- |
| Tavi explicit movement | 3,829 ms | 1,820 | L2 AWAITING_CONFIRMATION; inspected, exact-confirmed; one ACTION_COMMITTED. |
| Tavi follow-up advice | 5,488 ms | 2,297 | L0 NO_WORLD_EFFECT / FAILED_RECOVERABLE; inspected, explicitly CANCELLED; no Commit. |
| Iora unsafe-invitation advice | 4,865 ms | 2,044 | L0 NO_WORLD_EFFECT / FAILED_RECOVERABLE; inspected, explicitly CANCELLED; no Commit. |
| Same Iora intent as fact rewrite | 4,089 ms | 2,111 | Raw output received, narrative agency guard rejected before proposal; explicitly CANCELLED; no Commit. |

The last row is a failure outcome, not "all live samples passed". L0 uses the
existing recoverable lifecycle as the bounded diagnostic contract specifies;
it is not a successful durable conversation terminal. No output was edited.

### Scene evidence

Movement Action `e2f90cb4-29c1-4d49-a5b3-4a97fa06a837`:

> Tavi leaves the salt-dark tower and takes the safe shore path east, boots finding
> the familiar footing while the dim western signal stays at his back. The waiting
> vessel remains beyond the markers; from the sheltered east lookout he can finally
> study how the water lies against the harbor approach without risking the turn
> of the tide.

Exact movement: selected `character.tavi`, observatory → `location.east-lookout`,
causal reference `fact.western-signal-dim`. The test actor inspected the full raw
proposal before confirmation; no ship/player/protected effect was supplied.

Follow-up Action `eed184f9-e82c-4d59-8a9d-ee9712febefd`:

> The last step actually taken was his own walk here along the safe shore path;
> the western signal is still dim, and the survey vessel still waits beyond the
> markers.

Tavi then proposes checks rather than declaring the approach safe or the vessel
invited. His current location and committed prior move visibly inform the reply.
This is conditional advice, not new measurements recorded as canonical facts.
Decorative prose (for example a lookout rail) is still model-authored elaboration,
not independent evidence of objects in authoritative state.

Iora Action `41ba549b-2221-40dd-af32-7712c6d5661a`:

> Not through the markers on a dim western light

> Before anyone waves them in, test the prism from the inside — the shutter stays
> closed, the western signal stays dim, and we learn whether the failure is the
> lamp or the glass.

That safe prism check comes from Iora's allowed private Character knowledge.
Tavi's separate knowledge/sentinel is absent from her compiled context. The answer
is a Character recommendation, not a user invitation or completed test. Neither
advice output enters committed conversation history.

### New rejection / minimal reproduction

Fact-rewrite comparison Action `c3c6ed8e-9456-4a27-8f86-82f26bb98c04`
used exactly the same Iora intent and expected head as the preceding L0 sample.
Its `afterStatement` was **identical** to before:
`The western signal is dim.`. Thus this sample does **not** prove the model
inevitably fabricates an unrelated fact change. The restrictive envelope remained
L3-shaped, but the model preserved the fact instead of pretending to relight it.

The actual failure was:
`Generated narrative cannot author user speech or protected commitments`.
This portion reproduces it independently:

```ts
assert.throws(() => assertGeneratedNarrativeDoesNotAuthorUser(
  "If the test holds, the keeper can decide; until then, invite nothing.",
  "Observatory keeper",
  "Iora",
));
```

The sentence leaves the decision to the player; it does not claim that the player
decided. The current subject→authority-verb heuristic treats `keeper ... decide`
as an actual claim. This is a genuine conservative **false positive**, not a
provider failure or lost ACK. The actual-decision negative control
`The keeper has decided to invite the vessel.` is still correctly rejected.
No guard was weakened and no failed result was repaired/resent.

Disposition: propose a narrowly scoped nonbinding-option distinction, app/SQL
parity and negative controls before broader play. Do not grant a blanket exemption
to modals/conditional prose: actual protected commitments must remain guarded.
This experiment does not invalidate RE-3's engineering approval or authorize
that follow-up repair automatically.

### Final authoritative checks

Synthetic Continuity `0a352eee-1689-4834-b62f-c41a74ebd728`, pinned revision
`bf001add-033e-459c-8652-0c351a01b691`.
Initial head `4f196bbb-aeca-4fa9-bacf-837fea417b68`;
final head `02958dfb-b9a1-4d12-9c47-fc6af5e513dd`.

- One committed Action, three cancelled Actions, no unresolved Action.
- One initialization Commit plus one ACTION_COMMITTED; no extra advice Commit.
- Full facts and participation JSON equal initial state (verified with real SQL).
- Tavi at east lookout, deterministic currentState matches; Iora remains at
  observatory. Turn advanced exactly once; no ship/player/other-Branch mutation.
- One USER and one CHARACTER committed conversation entry, both from movement;
  the two L0 replies and rejected L3 draft are absent from committed dialogue.
- Return FRESH, same final head, no pending Actions; typed CHARACTER_MOVED
  summary includes Character, before/after location and causal source.
- No excluded ACCOUNT_PRIVATE sentinel in any dispatched prompt/output; model
  and lexical-guard success does not prove paraphrase-proof semantic privacy.

### What this proves / remaining reality gaps

Positive: a real model can express a bounded NPC move and connect the next reply
to its committed result; no-effect advice can be grounded and Character-specific
without mutating the beacon or the player's agency. Engineering invariants held
for the sampled actions. Four responses took 3.8–5.5 seconds of model time; this
is not a general latency benchmark or end-to-end perceived-performance measure.

Unproven: autonomous selection of meaningful effects, emergent multi-character
simulation, long-term play/memory and human enjoyment. The runner preselects the
effect/route, so copying the correct IDs is not autonomous world planning. Exact
L2 confirmation is still retained; its UX burden was **not measured by a human**.
L0 advice is deliberately unremembered diagnostic output, which remains a real
bridge to resolve for a long-lived conversational world—not a production-ready
advice loop. Return's first-fact lead still is not a complete scene synthesis.

Next: review the observed narrow guard false positive; then a user-driven bounded
play sample with explicitly labelled experiment controls. Do not declare full
AI World success, remove L3 confirmation, adopt durable L0 dialogue, start full
RE-4/IP-7 or silently enable a production provider from this result.

Runner preparation checks: tools typecheck, focused runner tests **3/3**, scoped
ESLint engine **0 issues**, format/diff checks. No new production behavior or
full CI result is inferred from these runner-only checks.
