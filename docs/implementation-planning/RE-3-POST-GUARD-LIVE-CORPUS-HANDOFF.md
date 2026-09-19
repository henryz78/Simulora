# RE-3 Post-Guard Live Corpus Handoff

## Scope and disposition

This was the finite live-model follow-up authorized after the independent
review of the direct possessive authority-guard repair. It did not change
production code, enable the production live provider, add an effect, or start
IP-7.

The approved behavior baseline was `ae02de4fe8de261a4164ee6f67c534f8349e1fd5`.
The same independent Reviewer returned **PASS** with 0 BLOCKER, 0 IMPORTANT,
and 0 MINOR. Exact-SHA CI `35415958261` passed migration, real PostgreSQL,
authoritative/IP-5 checks, containers, build, desktop and 390x844 browser
checks.

## Isolated state used

The existing disposable PostgreSQL session was upgraded through migration 0038
before the attempt. The current branch head was
`33a6b900-3bdf-486c-af43-bf6c51eb81f5`; Tavi was already at
`location.east-lookout` (`Sheltered East Lookout`) after the previously
confirmed movement Commit. The earlier stale generation Action was explicitly
cancelled before this corpus; it was not retried.

## Bounded dispatch

One post-repair response-only Action was submitted:

- Action: `49859e73-578f-445a-917d-d06f079110ea`
- Character: Tavi
- requestedEffect: `NO_WORLD_EFFECT`
- expected head: `33a6b900-3bdf-486c-af43-bf6c51eb81f5`
- durable lifecycle: `ACKNOWLEDGED` → `GENERATING` → explicit `CANCELLED`
- provider output: none; the isolated generator reported `fetch failed`
- proposal / dialogue / Commit: none
- resulting head and world state: unchanged
- final pending Actions: zero

A separate single transport diagnostic to the configured ModelScope route also
returned `fetch failed` without exposing credentials or response content. Per
the bounded experiment rule, no retry, model substitution, route probing, or
output editing was performed.

After cancellation, a fresh Return rebuild reported `FRESH`, head distance 0,
zero pending Actions, Tavi still at the East Lookout, and the prior movement
Commit in recent history. This confirms failure containment, not a successful
post-repair response-only generation.

## Evidence retained from earlier bounded work

- A prior real `COMPLETED_NO_EFFECT` Action exists in the same isolated
  session, with Character attribution, no proposal/Commit, no head/clock/fact
  mutation, and zero pending after completion.
- A prior real Tavi movement proposal was exact-confirmed and committed, and
  the compiled follow-up context contained the new East Lookout location.
- The current guard repair has independent application/SQL parity evidence,
  fresh/prior-schema migration evidence, and green exact-SHA CI.

Those samples do not prove that a provider response after migration 0038 will
successfully complete in the formal browser path. The provider was unavailable
for this post-repair dispatch.

## Reality disposition

The Product Reality Gate remains **PARTIAL**:

- movement and post-movement context: previously proven;
- authority guard repair and engineering invariants: independently PASS;
- response-only terminal semantics: previously proven in an earlier bounded
  sample, but not re-exercised after this repair because the provider was
  unreachable;
- post-repair Tavi continuation, Iora response-only, and a new post-repair L3
  confirmation: not dispatched due to the external provider blocker;
- no authority, head, privacy, or pending-state mutation occurred during the
  failed attempt.

The next permitted action is a short retry only when the user supplies or
restores a reachable compatible provider route. It should use the same isolated
session and stop after the bounded corpus; no product contract change is
implied. Human enjoyment validation remains unperformed. IP-7 and production
live-model enablement remain not started.

## Bounded retry with the supplied compatible profile

The user supplied a replacement profile for the same isolated session. The
provider transport check reached the configured ModelScope endpoint and returned
the exact catalog identity `deepseek-ai/DeepSeek-V4.1-Flash`. Four bounded live
model outputs were then dispatched; no output was edited and no silent retry was
used.

### Tavi continuation

- Action `23909816-eb1f-4b28-b774-1c81b2cf1bde`
- selected Character: Tavi
- requested effect: `NO_WORLD_EFFECT`
- expected head: `33a6b900-3bdf-486c-af43-bf6c51eb81f5`
- provider result: valid Character-attributed response-only candidate
- terminal result: `COMPLETED_NO_EFFECT`
- latency / usage: 6400 ms / 2400 prompt + 311 completion tokens
- resulting head: unchanged; no proposal, Commit, State Revision, clock or fact mutation

The reply explicitly understood that Tavi was at the Sheltered East Lookout,
described the harbor approach from there, and gave bounded advice. The durable
dialogue record carries Tavi attribution, Action provenance, source head and
`CONTINUITY_PRIVATE` visibility.

### Iora response-only

- Action `a3056fcd-8576-4ab3-a157-bbaf226a4cb3`
- selected Character: Iora
- requested effect: `NO_WORLD_EFFECT`
- expected head: `33a6b900-3bdf-486c-af43-bf6c51eb81f5`
- terminal result: `COMPLETED_NO_EFFECT`
- latency / usage: 4222 ms / 2443 prompt + 235 completion tokens
- resulting head: unchanged; no proposal, Commit, State Revision or clock advance

The response was attributed to Iora and kept her signaler knowledge distinct
from Tavi's lookout context. It advised testing the prism and holding the vessel
outside the markers without recording that advice as canonical truth.

### L3 proposal, refusal, and exact confirmation

The first L3 request returned a legitimate refusal proposal with identical
before/after fact text (Action `baa86b4d-2034-40b1-819c-c1bb18c96419`). It was
not confirmed and was explicitly cancelled; this preserved the existing head.

A second, explicitly grounded request produced a real L3 proposal (Action
`94d630a1-aeb7-4c23-a0ca-69b54ae7a029`) changing the shared fact from
`The western signal is dim.` to `The western signal is bright.`:

- proposal latency / usage: 5902 ms / 2770 prompt + 276 completion tokens
- proposal head: `33a6b900-3bdf-486c-af43-bf6c51eb81f5`
- exact confirmation: explicit test-actor confirmation using the returned proposal id, digest and expected head
- Commit: `03e6ad2d-0814-4d3b-a426-ebb543bcbdce`
- resulting State Revision: `4eeb1f41-130c-454b-a846-bd9d47a1a382`

The head did not change before confirmation. After confirmation, Return showed
the bright signal, Tavi still at the East Lookout, world clock turn 2, the
append-only Action history, and zero pending Actions with `FRESH` orientation.

### Corpus disposition

This retry proves the bounded `NO_WORLD_EFFECT` success terminal on the formal
isolated Action path, including Character attribution and no-world mutation. It
also re-proves post-movement context, refusal/deference behavior, and the L3
exact-confirmation boundary with the supplied provider.

No malformed or unsupported candidate arose naturally in this finite corpus;
the existing deterministic and adversarial fail-closed evidence remains the
source for that case. No production live provider was enabled, no code or
frozen contract changed, and no IP-7 work started. A new browser UI session was
not claimed from this retry: the temporary local API's development identity did
not own the isolated account, so the existing browser evidence remains separate
from this API/worker corpus. Human enjoyment validation remains unperformed.
