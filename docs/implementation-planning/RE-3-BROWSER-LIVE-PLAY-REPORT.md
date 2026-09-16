# RE-3 Bounded Browser Live Play

## Verdict / scope

**Authority chain: sampled PASS. Product reality: PARTIAL, runtime/UI bridge still missing.**

User authorized this small browser experiment after the nonbinding-option repair
passed independent review. Three actual model requests, two explicitly confirmed
L3 Action Commits, one rejected/cancelled Action. No retry to obtain a green result.
This is **Agent-operated real browser play**, not human enjoyment validation,
full RE-4, long-lived AI World qualification or IP-7 authorization.

Approved production behavior: `7cae8d88ae6f20f2f1d9fe6633d0297fdefed352`.
Starting checkout: `2d0261540f65b670d2a56ad738715e9f6efa80e9` (documentation closure).
Only the isolated runner was extended; production API/worker/frontend, migrations,
frozen Prototype and contracts were not modified.

## Actual setup / reproducibility

- Existing production frontend at loopback `127.0.0.1:4173`, existing API at
  `127.0.0.1:4000`, new disposable UTF8 PostgreSQL 17 database, migrations 0001–0033.
- Synthetic original Lantern Reach: Iora and Tavi, explicit NPC/public-route
  policy, separate Character knowledge and an excluded ACCOUNT_PRIVATE sentinel.
- Separate ignored `.local-data/re3-browser-play/` session/evidence; no existing
  Spike database or historical output overwritten.
- Runner `--re3-browser init` uses the existing development adapter's synthetic
  account identity. `process <Action ID>` processes an **already browser-submitted**
  ACKNOWLEDGED Action through the repository's generator injection seam. It checks
  current Branch/head/status before dispatch; it does not create a second Action.
- No live production composition or automatic Action worker. Each live request
  was manually dispatched once; confirmation/cancellation was performed in the UI.
- Return projection was explicitly rebuilt using the runner after Commits. This
  does not measure autonomous worker recovery or projection latency. A projection-
  only queue check processed zero jobs; it never processed Actions.
- Codex browser controls drove the real application (no API mocks / fixture network
  interception), at desktop and 390×844 viewport. Real scrolling and click controls
  were exercised. This is not physical mobile-device/touch qualification.

To reproduce in another session, create a new ignored experiment directory/session
rather than overwrite this one. Start the normal API with that isolated database
and the normal Vite server; submit through the UI, inspect and manually process
the exact pending Action ID. The old runner `verify` command assumes its original
fork/Restore corpus: it is **not applicable** to this browser-only corpus. An
attempted invocation failed that corpus precondition; separate read-only SQL/
repository assertions below verified the actual browser session instead.

## Three real journeys

| Sample / Action | Actual user intent and result | Decision / truth |
| --- | --- | --- |
| B1 `f91331a6-79dc-477e-aad2-1f1b3c696d2a` | Iora tests the prism with the shutter closed. Provider describes a steady red core and smeared gray ring; proposes atmospheric dimness rather than lamp failure. | Recovery visited with ACK preserved. Back in World, old fact remains current until explicit exact confirmation. COMMITTED. |
| B2 `8a56a868-6038-4fc3-8086-c79bb062f722` | Ask Tavi to walk the explicit safe shore path using Iora's recorded reading. Provider refuses/requests another explicit instruction, keeps Tavi at the observatory, and returns unsupported `NO_EFFECT` plus extra top-level fields instead of the supplied FACT_REWRITE shape. | Raw output recorded, schema rejected, no proposal/Commit/head change. UI stays in recoverable GENERATING with generic “Still working.” Explicitly CANCELLED; no repair/resend. |
| B3 `20cf4887-0a7d-465d-965f-05cf9ed509f4` | On 390×844, ask Iora to mark the western approach unsuitable using the recorded prism reading, with no invitation. Prose and proposed fact refer to that prior result. | Pending preserved through mobile Recovery. Long before/after review scrolls to controls; explicit exact confirmation COMMITTED. World ready for another Action. |

Representative B2 output: “He keeps his boots planted on the observatory stone.”
and “If you want me to actually walk the shore path and look, say so plainly”.
The request already plainly asked for the walk. This is an observed awkward
request/confirmation loop, not proof every model will behave that way.

The mobile coordinate-click attempt at the confirmation control did not produce
a state change; read-only state confirmed no Commit. Retargeting the observed
button with the supported semantic browser click succeeded. Do not count the
unsuccessful coordinate attempt as proof of a product touch defect or of a Commit.

## Model / usage

Supplied model requested and reported for all three:
`deepseek-ai/DeepSeek-V4.1-Flash`. Same supplied endpoint/profile, no substitution.

| Sample | Provider duration | Prompt tokens | Completion tokens |
| --- | ---: | ---: | ---: |
| B1 | 5,222 ms | 1,627 | 312 |
| B2 | 7,191 ms | 2,006 | 419 |
| B3 | 5,166 ms | 2,202 | 353 |

Total 3 dispatches / 3 outputs, 6,919 reported tokens, no quota/429 or automatic
retry. Durations exclude manual dispatch/navigation/review time; they are not
end-to-end UX latency benchmarks. Synthetic excerpts only, no profile secret or
provider reasoning committed. Excluded sentinel absent from dispatched prompts
and outputs; owner-visible synthetic private facts in the browser are not model
disclosures or cross-owner access.

## Cross-surface checks / final state

Continuity `61e43156-d369-4650-9935-f1927180820f`, original Branch
`f8bc1b79-96c9-4036-b94a-f10637d1eaf6`, pinned Revision
`f8461abb-7a0d-4e84-b298-d8d5b0718aa0`.

Head chain: `13af697f-c742-457c-a795-599db9f5b842` (init)
→ `79199a6a-7476-4e23-98ca-3c95101a0f62` (B1)
→ `adf1a8d4-df10-4f90-a597-12e305983149` (B3).
B2 produced no Commit. Final statuses COMMITTED / CANCELLED / COMMITTED,
zero unresolved Actions, three Commits including initialization, clock turn 2.
Both Characters remain at the observatory; the waiting vessel remains outside
the markers. Participation remains Guided + Open-ended; no Revision adoption,
Branch switch, player movement or protected commitment occurred.

World, Return and Continuity show the resulting same fact/head; Return FRESH,
distance zero, pending list empty. Global Continuity lands on a fact list, not a
specific beacon Lens. Lens shows source class/Commit/scope/correction boundaries.
An initially unavailable explanation fallback resolved on refresh; direct API
read returned authorized 200/FRESH. No permanent explanation failure established.
Return → browser Back returns to World. Recovery explicitly states current-path
scope and preserved pending work. No Branch fork/Restore mutation was exercised
in this browser batch; prior G5/RE-3 evidence remains separate.

## Real gaps, not automatic redesign

1. **Confirmed runtime/UI bridge gap:** `ActionComposer` / shared submit path
   sends no `requestedEffect`; current browser participation therefore defaults
   to FACT_REWRITE even though the approved repository can execute explicit L2
   movement and diagnose L0 advice. B2 is one concrete failure of that narrowing.
   Routing/selecting an allowed effect must become coherent in an authorized next
   slice; do not expose internal L-level jargon or silently widen model authority.
2. **Failure comprehension gap:** malformed output returns recoverable generation
   state, but no useful public failure reason in this observed UI; the player sees
   “Still working” after the model request ended. No automatic worker was running
   here, so this is not proof production retries never recover. It does demonstrate
   inadequate explanation in the isolated sampled path. Preserve pending/retry
   safety and expose a bounded non-private reason, not raw schema/provider logs.
3. **Reading burden observation:** narrative + entire growing before/after fact
   requires several mobile scrolls; after confirmation World history mainly lists
   intents/status while Return puts prose under open threads. Credible generated
   scenes exist, but the visible loop still feels like fact review. Not a human
   burden rating, and not permission to remove exact L3 confirmation.
4. **Separate product decision:** no-effect advice is not durable remembered
   dialogue; this batch did not implement or validate a long-lived advice loop.

These results preserve engineering approvals but do **not** show the final AI
World promise is fulfilled. Before treating the experience as ready for everyday
world play, recommend a bounded runtime-to-participation bridge and honest failure
feedback, then another natural-play sample (including a real human). Keep the
director and role-player goals in [direction guardrails](PRODUCT_DIRECTION_GUARDRAILS.md).
No IP-7/full RE-4/production live enablement or repair is automatically started.

## Runner verification

Tools typecheck, existing runner tests 3/3, scoped ESLint 0 issues, format/diff
checks PASS. Real session SQL/repository assertions verified statuses, Commit
count, clock, unchanged Character locations, contract and model dispatch counts.
Attempt to reprocess the cancelled/stale B2 was blocked before provider access;
dispatch count remained three. This runner-only work does not claim a new
production Gate or a full exact-SHA CI result.
