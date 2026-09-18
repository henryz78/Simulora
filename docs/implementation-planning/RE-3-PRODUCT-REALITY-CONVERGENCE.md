# RE-3 Product Reality Convergence Follow-up

## Scope

This follow-up investigates the difference between the earlier isolated
`MOVE_CHARACTER` success and the later formal-browser participation path. It is
not IP-7, production live-model enablement, a human-enjoyment study, or a new
authority contract.

## Path comparison

The browser-to-server path is now aligned for the approved bounded effects:

`ActionComposer` → `requestedEffect` → durable `operation_payload` → worker
generation request → closed candidate validator → exact confirmation / cancel.

The pre-bridge browser sample B2 sent the default `FACT_REWRITE` envelope, so
its unsupported `NO_EFFECT` output cannot be used as evidence against the
routine contract. The post-bridge routine sample used `ROUTINE_EFFECT`, selected
Tavi, the same server-owned route policy, the same expected-head binding and
the same strict candidate parser/validator. Its compiled request was larger
because earlier committed facts and conversation history had grown; the saved
record does not contain a valid candidate output. This is not evidence of an
authority bypass or a second truth path. It is compatible with model-format
instability under a larger prompt, and the provider was unavailable during the
follow-up dispatch below, so no claim of improved model success is made.

The earlier isolated runner sample remains a valid positive control: it used
`ROUTINE_EFFECT`, an explicitly selected Character and an authorized route, and
returned a schema-valid `MOVE_CHARACTER` proposal which was exact-confirmed.

## Minimal repair

The isolated RE-3 prompt now appends a final, effect-specific format check after
the compiled context. It states the required operation type for
`FACT_REWRITE`, `ROUTINE_EFFECT` and `NO_WORLD_EFFECT`, forbids substituted
effects/extra fields, and keeps the server validator authoritative. Prompt
metadata was advanced from version 3 to version 4. The repair does not alter
the model gateway, database, worker, validator, confirmation, idempotency,
stale-head or Commit semantics.

Focused prompt tests cover all three effect/type pairs and the existing route
guard. The independent focused re-review of this repair is recorded separately
and must remain the approval authority for the behavior change.

## No-world-effect decision

The current `NO_WORLD_EFFECT` output is a schema-valid L0 generated response in
the tested browser path. The repository records its narrative/provenance in
the generation progress stream, performs no canonical mutation, and returns
`FAILED_RECOVERABLE` with `statusReason=NO_WORLD_EFFECT`; the user can explicitly
cancel it. No Commit, State Revision, Domain Event, Branch-head/clock advance,
conversation history entry or durable memory is created.

This is intentional under the frozen contracts. The Runtime model enumerates
the terminal Action states and does not define a successful non-mutating
terminal result. Turning L0 into a success would require a new Action status,
API/UI projection, lifecycle transition, persistence/provenance contract and a
product decision about whether the response is durable dialogue or merely an
ephemeral result. It must not be implemented by reusing `COMMITTED` or by
fabricating a canonical fact. This remains an explicit follow-up product
decision, not a hidden repair in this slice.

## Live validation record

- A new formal browser Action was submitted with `ROUTINE_EFFECT`, selected Tavi,
  and the current expected head. The durable acknowledgement was correct.
- The isolated live seam was then unavailable at the configured provider host
  (DNS resolved but the HTTPS TCP connection was not reachable). No model output
  was received, no proposal or Commit was produced, and the Action was explicitly
  cancelled. This is recorded as a provider/routing limitation, not as a model
  success or failure.
- Final isolated session checks showed zero pending Actions, unchanged head and
  clock, `FRESH` Return orientation, and unchanged Character locations.
- No automatic retry, provider substitution, output editing or validator
  relaxation was used.

## Remaining gate conditions

The Product Reality Gate is **not reached** by this follow-up. A finite live
corpus still needs one successful formal-browser NPC movement and a subsequent
contextual response. The no-world-change path remains honest but requires the
separate product decision described above before it can be called a successful
response result. L3 exact confirmation and malformed/protected fail-closed
behavior remain covered by the existing RE-3/G1–G6 evidence and were not
weakened here.

IP-7, production live enablement, durable dialogue/memory redesign, autonomous
multi-character scheduling and broad effect expansion remain out of scope.
