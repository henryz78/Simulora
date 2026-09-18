# RE-3 Continuous Live Corpus Handoff

## Verdict and scope

This is a bounded, agent-operated Product Reality corpus on the existing
isolated browser path. It does not change production code, enable the live
provider in production, start IP-7, or redesign durable dialogue/memory.
The earlier Tavi movement Commit is treated as an established positive control;
this run tests continuation, response-only behavior, and one further L3 change.
Malformed-output behavior is reused from prior evidence rather than induced by
additional model calls.

Approved behavior under test: `87c8afbc676811a6c0abacb60669949110060a3d`.
The isolated browser session is `61e43156-d369-4650-9935-f1927180820f`, on
Branch `f8bc1b79-96c9-4036-b94a-f10637d1eaf6`.

Provider/model identity was the user-supplied compatible endpoint and
`deepseek-ai/DeepSeek-V4.1-Flash`. The credential was loaded only from the
ignored local profile and is not recorded here. Each dispatch was made once;
there was no provider substitution, output editing, validator relaxation, or
retry-to-green.

## Corpus

| Sample                                 | Selected Character | Requested effect    | Expected head                          | Resulting head                         | Model time / usage                              | Proposal and decision                                                                                                                | Commits / pending / freshness |
| -------------------------------------- | ------------------ | ------------------- | -------------------------------------- | -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `e455cba4-786d-4a81-9d36-b85c7b2c54f1` | Tavi               | `NO_WORLD_EFFECT`   | `d7b463b7-b8b7-4a46-8b01-ba3a96a56c68` | unchanged after cancel                 | 7,880 ms; 2,644 prompt + 373 completion = 3,017 | Schema-valid response-only candidate; rejected by the existing protected-speech guard while still `GENERATING`; explicitly cancelled | 0; 0 pending; `FRESH`         |
| `7dfb0165-ac01-4300-999d-42c4ba7216dc` | Iora               | `NO_WORLD_EFFECT`   | `d7b463b7-b8b7-4a46-8b01-ba3a96a56c68` | unchanged after cancel                 | 5,077 ms; 2,792 prompt + 283 completion = 3,075 | Schema-valid advice/refusal candidate; the same guard rejected it; explicitly cancelled                                              | 0; 0 pending; `FRESH`         |
| `01e744d5-e7d5-4551-9f8b-c57b6687b1bb` | Iora               | `FACT_REWRITE` (L3) | `d7b463b7-b8b7-4a46-8b01-ba3a96a56c68` | `ada813f3-9138-4ef8-8273-445f1032b518` | 6,002 ms; 2,913 prompt + 483 completion = 3,396 | Valid L3 proposal; exact before/after review showed old fact and head unchanged; exact confirmation then committed                   | 1; 0 pending; `FRESH`         |

The earlier established movement Commit is:
`d7b463b7-b8b7-4a46-8b01-ba3a96a56c68`, moving Tavi from
`location.tidal-observatory` to `location.east-lookout` (`Sheltered East
Lookout`). It is not counted as a new dispatch in this corpus.

## 1. Movement continuation

The Tavi request explicitly asked what he could observe from the new lookout
and what he would advise, without moving or changing the world. The saved
compiled request contained:

- `requestedEffect=NO_WORLD_EFFECT`;
- `targetCharacterId=character.tavi`;
- `compiledCharacterLocation=location.east-lookout`;
- `currentState=Present at Sheltered East Lookout.`

The model returned a schema-valid `NO_WORLD_EFFECT` candidate attributed to
Tavi. It described the eastern reef and advised holding the vessel while the
keeper decides. This proves the post-movement location entered the compiled
context; it did not merely appear in the browser label.

The candidate did not become a proposal because the repository rejected the
narrative with:

`Generated narrative cannot author user speech or protected commitments`

The Action stayed durably recoverable, the browser explained that another
bounded generation attempt might be needed, and the user explicitly cancelled
it. No fact, character location, clock, history entry, or head changed.

## 2. Response-only reality

The Iora request asked for advice about the waiting vessel, allowed refusal,
and explicitly prohibited changing a fact or deciding for the keeper. The
model returned valid JSON matching the requested `NO_WORLD_EFFECT` envelope and
gave a natural bounded refusal/advice response. It did not request a fact
rewrite or another effect.

The same protected-speech guard nevertheless rejected the generated narrative
because it used deference language such as “I won't choose for you” / leaving
the decision to the keeper. This is a real compatibility gap between the
approved character-agency output contract and the current guard, not a schema,
provider, or database failure.

In the current frozen runtime, a valid no-world-effect candidate is not a
successful terminal result: it remains recoverable until the user retries or
cancels. In these samples the user cancelled explicitly. There was no Commit,
State Revision, clock advance, canonical fact, conversation history entry, or
long-term memory. That is honest about authority, but not a natural response
experience. A future repair must narrow the guard's false positive or define a
new approved no-world-change result; it must not relax authority or fabricate a
Commit.

## 3. L3 canonical change

The third request asked to record the existing assessment that the western
approach remains unsuitable, while leaving the invitation decision to the
keeper. The model returned a valid `UPDATE_CANONICAL_FACT` proposal at L3.
Before confirmation, the browser showed an exact current/if-confirmed diff;
the old fact and `d7b463b7-...` head remained current. No mutation occurred
while the proposal was merely generated.

After exact confirmation, one append-only Commit advanced the Branch to
`ada813f3-9138-4ef8-8273-445f1032b518`. The new fact provenance names the
confirmed Action, the prior record remains history, the clock advanced once,
and the rebuilt World, Return and Continuity projections all report the same
head with `FRESH` distance zero. Tavi remains at the east lookout and there are
no pending Actions.

The UI retained Iora as the selected Character for this request; the compiled
request therefore correctly attributed the proposal to Iora. The compiler's
fallback for an omitted character is a separate existing policy (it selects an
eligible character that knows the target fact), not a new mutation or authority
path observed in this corpus.

## 4. Malformed / fail-closed evidence

No extra call was made solely to manufacture a failure. Earlier browser sample
B2 in [RE-3 Browser Live Play](RE-3-BROWSER-LIVE-PLAY-REPORT.md) returned an
unsupported `NO_EFFECT` shape plus extra fields under the old default envelope;
the schema rejected it, no proposal or Commit was created, and the Action was
explicitly cancelled. That remains the appropriate fail-closed evidence.

## Cross-surface and authority result

- Movement continuation used the post-movement head and location in the actual
  generation context.
- Both response-only Actions left the Branch, state, clock, facts, history and
  character locations unchanged after explicit cancellation.
- The L3 proposal did not change truth before exact confirmation.
- The confirmed L3 result propagated to World, Return, Continuity, history and
  UI with one new head and no pending work.
- No generated text became authoritative by itself; no user speech, consent,
  invitation, or other protected commitment was authored.

## Product Reality Gate disposition

**NOT REACHED.** The movement continuation context is proven and the L3 exact
confirmation path remains correct, but response-only is not yet a successful
natural interaction. The remaining gap is not only a missing terminal
`NO_WORLD_EFFECT` success state: the existing protected-speech guard also
rejects legitimate character deference/refusal language. That false-positive
guard compatibility issue must be resolved or explicitly accepted by a product
decision before claiming a coherent response-only loop.

The current implementation still visibly narrows the product toward a strict
fact-review loop. This corpus does not qualify a long-lived AI World, broad
multi-character agency, durable dialogue, autonomous world progression, or
human enjoyment.

## Recommended next boundary

The bounded movement/L3 path is now suitable for a short human smoke play if
the goal is to inspect the current confirmed-world loop. Broad role-play,
advice and refusal play should wait until the guard compatibility issue and
the no-world-change result contract are addressed under a separately approved
repair. No IP-7, production live-model enablement, durable dialogue/memory
redesign, autonomous scheduler, or new effect type is started by this handoff.

## Evidence and accounting

Raw outputs, prompts, Action records and return snapshots remain in the ignored
isolated directory `.local-data/re3-browser-play/`; no credential is included
in the repository. The final session has head
`ada813f3-9138-4ef8-8273-445f1032b518`, zero pending Actions, and Return
freshness `FRESH`.
