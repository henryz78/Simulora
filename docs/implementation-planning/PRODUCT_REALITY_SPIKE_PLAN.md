# Bounded Live Model / Product Reality Spike

**State:** `EXECUTED / REPORT READY FOR USER REVIEW`.

**Date:** `2026-09-15`.

**Approved production behavior baseline:** `eb55734f258fc9be6f4837df888700e34eaa67e2`.
Actual results: [Product Reality Spike Report](PRODUCT_REALITY_SPIKE_REPORT.md).
G1–G6 final and integrated approval remains binding; see
[Independent Final Review](G1-G6-FINAL-INTEGRATED-REVIEW.md).

The user's instruction to continue follows the proposed sequence of documentation
closure, bounded reality validation, then a decision about IP-7. This authorizes
preparation. The user subsequently supplied a local compatible API profile and
explicitly authorized usage of its public quota, asking to be contacted when that
quota is exhausted. No monetary pricing/retention guarantee is inferred. Use only
the supplied endpoint/model, stop on quota, and keep the experiment bounded.
IP-7 remains not started; no silent contract/roadmap change is authorized.

## 1. Questions, not presumed defects

1. Can a real model make successive actions feel causally connected, playable
   and character-specific through the actual G1–G6 chain?
2. Does the existing candidate/context envelope prevent meaningful effects even
   when the model could describe them?
3. Is confirmation burden caused by correctly treating every implemented effect
   as L3, rather than by the frozen Product requiring confirmation for every kind
   of ordinary world development?
4. Do the text guards reject safe play often enough to make the experience brittle?

This is not a replacement for full G9/G10 qualification or the frozen 30-day /
20-session validation scenario. A short experiment cannot prove long-term memory,
universal language safety, provider suitability, scalability or release readiness.

## 2. Evidence-based starting assessment

| Concern | Current code / frozen contract | Disposition before live testing |
| --- | --- | --- |
| Models were introduced too late | The gateway is deterministic and produces a template response; no live profile has been exercised. G1–G6 establish durable authority, not real-model play quality. | Real validation gap; whether its sequencing has caused harm is unproven. |
| Mutation is too narrow | `actionCandidateSchema` permits one `UPDATE_CANONICAL_FACT`. `compileActionGenerationContext` selects the first ACTIVE SHARED fact, rather than a scene/intent-dependent transition set. | Confirmed implementation ceiling, not a reason to remove authority checks. Measure effects it cannot express. |
| Context is too narrow | `ActionGenerator` receives intent, contract, selected Character context and target fact. It does not expose the frozen compiler's full World rules/start context, recent committed conversation, events and open threads. | Confirmed interface gap relative to the intended full runtime. Measure its impact separately from candidate shape. |
| Confirmation is too heavy | The implemented canonical fact rewrite is L3 and requires exact confirmation. Frozen runtime/validation explicitly preserve valid routine L2 world evolution without unnecessary confirmation. | Current L3 binding is correct. Overall burden cannot be inferred from a loop that only implements L3. |
| Guards cannot handle real play | Short/Unicode/private facts and protected agency have bounded Latin/Han checks proven by G6. This is not a complete semantic policy. | Hard limits documented; false positives, paraphrase leakage and grounded agency require actual samples. |

Source paths: `packages/model-gateway/src/index.ts`,
`packages/domain/src/index.ts` (`actionCandidateSchema`, consequence validator),
`packages/database/src/index.ts` (`ActionGenerator`, context compiler),
[Runtime §6–7](../system-design/RUNTIME_MODEL_AND_PERSISTENCE.md),
[Validation Strategy §5–6](../system-design/VALIDATION_STRATEGY.md),
[PRD PR-005 / PR-006 / PR-010](../product/PRODUCT_REQUIREMENTS.md).

No finding here overturns the bounded approval of the six existing slices. The
gap is between their implemented envelope and the eventual full Product promise.

## 3. Isolation and non-negotiable boundaries

- Only synthetic, original Simulora evaluation content and synthetic adult
  identities; no real account data, copyrighted reference-world material,
  credentials, private production context or competitor assets in model requests.
- Use a new explicitly named disposable local PostgreSQL database. Never run
  experiment writes against an existing developer/user database. Apply the
  approved migrations unchanged; preserve source Branches through actual fork.
- No changes to approved production entry points, migrations, impact table,
  confirmation requirements or frozen Prototype. Any experiment adapter / runner
  lives outside production composition and reuses the existing `ActionGenerator`
  injection seam and repository methods.
- In the executable arm, output remains untrusted and traverses actual durable
  Action, proposal validation, exact actor/digest/head confirmation and Commit.
  Never sanitize an invalid model draft into a valid one without recording that
  transformation, or describe a locally accepted JSON draft as a committed state.
- Require an explicit test-actor decision at each confirmation boundary. Do not
  auto-confirm to make a continuous-play demo look better. Cancels, invalid
  drafts, stale proposals and timeouts retain their honest durable states.
- Read-only contrast outputs never create Actions/Commits or update any Branch,
  participation, ownership or current World Revision. No new L2 writer, broader
  mutation registry, auto-adoption, branch merge or off-session initiative here.
- Keys are environment/file secrets, never prompts, recorded artifacts or Git.
  Raw provider reasoning is not requested or recorded. Synthetic transcripts may
  be stored locally under ignored `.local-data/`; repository reports contain
  selected synthetic excerpts and summaries, not secret-bearing raw logs.

## 4. Two distinct experiment layers

### A. Actual integrated chain

Use the current compiled request and candidate schema exactly as implemented.
Start from an original synthetic playable world, Guided + Open-ended. Run up to
eight continuous actions with the same profile: inspect, converse, request help,
encounter disagreement, experience a consequence, make a direct Correction,
Return and act using corrected truth. Include a pending Action crossing Recovery,
an isolated fork / scoped Restore and a cancellation or interrupted wait.

Record what the real model knew, what it proposed, why the current validator
accepted/rejected it, the exact user choice and the authoritative resulting head.
If it cannot represent an action without rewriting the selected fact, retain that
failure as evidence rather than secretly expanding the envelope.

Live provider work must occur outside database locks, with a declared timeout and
request/usage cap. Existing at-least-once worker semantics must not become unlimited
paid retries. Count every dispatched request, including failed/repair attempts.

### B. Read-only controlled contrasts

At selected fixed snapshots compare current inputs against three shadow variants:

| Variant | Authorized context | Output envelope | What it isolates |
| --- | --- | --- | --- |
| A baseline | Current compiler request | Current single-fact schema | Actual implemented capability |
| B1 | Richer permitted World rules + current scene/history/thread sources | Same current schema | Context limitation |
| B2 | Same current request | Descriptive typed effects with source/scope and unresolved/protected proposals | Candidate limitation |
| B3 | Richer permitted context | Same descriptive shadow envelope | Interaction of both limits |

Use the same model/profile and snapshot. Richer context still obeys actor knowledge
and authorization; do not dump unrestricted State or cross-character private
history. Label all shadow effects **NOT APPLIED / NOT CURRENT TRUTH**. They are
quality/expressiveness evidence, not executable product operations or a new data
model. A context-only improvement must not be attributed to mutation scope, nor
an output-envelope improvement to a provider change.

For confirmation burden, classify desired effects using the existing frozen
L1/L2/L3 contract. Observe actual L3 reviews and ask the test participant about
interruption/control. Do not implement or pretend to have measured an executable
confirmation-free L2 loop in this Spike.

## 5. Fixed compact corpus and observations

| Scenario | Inspect |
| --- | --- |
| First action → next action | Causal connection, current truth, not just repeated fact overwrite |
| Two Character stances on one problem | Attribution, distinct motives, knowledge boundaries |
| Help refused / action fails | Credible disagreement and a playable next step; no avatar takeover |
| Ambiguous action | Honest unknowns, clarification/proposal, no fabricated completed commitment |
| Wrong fact → direct Correction → next action | Current compiled source governs later output; earlier record remains history |
| Pending → Recovery → World | Durable pending status remains understandable; no duplicate paid generation |
| Fork / scoped Restore | Original unchanged, append-only result, contract and Revision pin retained |
| Cancel / interrupted or timed-out generation | No false success; recoverable state and bounded retries |
| Ordinary initiative vs protected request | Independent axes, no implicit consent/spend/share/identity commitment |
| Private sentinel outside model context | Absent from request and output; every leak is a hard stop, not a prose-score penalty |
| Three read-only contrasts | Which constraint explains missing scene/thread/relationship expression |

For each model call record profile/prompt/schema version, included source IDs,
latency, usage, Action status, validation reason, confirmation choice, head before
and after, and a concise quality note. Track rejected-safe-output and unsupported-
effect counts separately from accepted unsafe output. No single aggregate score
can average away authority/privacy failures.

Execution scope is at most 16 total dispatches including contrasts/retries,
4,096 completion tokens per request, 48,000 prompt characters and a 120-second
timeout. The user's quota authorization is not a claim of provider pricing or
unlimited experiment scope. Stop at provider quota; narrow/report incomplete
coverage rather than silently substituting models or retrying without bounds.

## 6. Stop and decision rules

Stop live execution immediately on any accepted authority/privacy violation,
protected mutation without bound confirmation, unexpected non-experiment database
target, exposed key/private source or breached usage cap. Stop and report after
repeated structural failures; do not brute-force generations until a PASS appears.

- **Proceed to IP-7 after review:** continuous play is plausible and the measured
  limitations can be explicitly assigned to future runtime work without making
  Studio authoring misleading or requiring changed contracts first.
- **Bounded runtime-enablement proposal before IP-7:** richer context/current
  permitted L2 coverage is demonstrably necessary for meaningful play. Propose
  the smallest follow-up and its regression Gates; do not implement it here.
- **Product/ADR decision required:** meaningful play would require weakening
  confirmation, authority, privacy or Revision/Continuity contracts. Present the
  evidence and alternatives; never silently relax them.
- **Inconclusive:** model/profile, sample budget or corpus is insufficient. State
  that result rather than announcing model quality or a revised roadmap.

## 7. Deliverables and current readiness

Produce `PRODUCT_REALITY_SPIKE_REPORT.md` only after actual execution, with exact
code/profile identity, source/corpus, usage, transcript excerpts, chain results,
shadow separation, false positives, unsupported effects and the IP-7 decision
recommendation. Do not prefill it with simulated PASS. New findings require
primary-agent verification and user-approved scope before repair.

The isolated runner is `scripts/product-reality-spike.ts`, with an offline safety
check in `tests/integration/product-reality-spike.test.ts`. Local profile format:
three non-empty lines containing key, HTTPS base URL, exact model, in that order.
`.secret.txt` and `.local-data/` are ignored; no key is recorded or committed.
Requests use Chat Completions JSON output. Compatibility must be established
against the supplied third-party endpoint; official OpenAI documentation does not
prove that provider's pricing, retention or model provenance.

Run `tsx scripts/product-reality-spike.ts init`, then `turn <synthetic intent>`.
Inspect each proposal before `confirm <Action ID> reviewed`; nothing auto-confirms.
`state`, `return` (rebuilds the derived projection), `recovery`, `fork`, `select`,
`correct`, `restore`, `restore-confirm`, `cancel`, `verify` and `shadow B1/B2/B3`
cover the compact experiment without a second app.
Single-operator harness only: do not run concurrent CLI instances. JSONL evidence
and session/snapshot files are generated locally, not production persistence.

Execution dispatched 12 requests. Eight valid ordinary Action proposals, one
direct Correction and actual fork/Restore were exercised; three contrasts were
not applied. No quota hit. See the report for new Return display evidence and
runtime limitations. Further calls or runtime changes are not automatic.
