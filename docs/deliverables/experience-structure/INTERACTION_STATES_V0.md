# Interaction States V0

**Status:** `INTERACTION STATES: DEFINED`  
**Scope:** 各核心体验 surface 的可理解状态、转场和恢复语义。  
**Explicitly not:** `NOT FINAL UI` · `NOT FINAL VISUAL DESIGN` · `NOT IMPLEMENTATION`

## 1. State-design premise

The product’s primary trust risk is not a lack of controls; it is a user misreading what survived, what changed, what they are allowed to do or whether a generated response is final. V0 therefore treats state communication as core interaction design. Every status must answer three questions in user language:

1. **What is happening now?**
2. **What has or has not changed?**
3. **What can I safely do next?**

The state vocabulary translates, but does not expose, the frozen Action/Commit lifecycle. It must not label a provisional model output as saved, a stale projection as current truth, an authorization boundary as an unexplained disappearance or an experimental Branch as an erased original. [Runtime contract](../../system-design/RUNTIME_MODEL_AND_PERSISTENCE.md) · [API/Security contract](../../system-design/API_SECURITY_AND_OPERATIONS.md)

## 2. Global experience-state grammar

| User-visible state | What the experience must say | Safe next actions | Must never imply |
|---|---|---|---|
| **Current and ready** | The current world context is available; the user can participate. | Act; inspect; change contract intentionally; create safe point; leave. | That every background projection/detail is already fresh. |
| **Loading current context** | Context is being retrieved; a last known safe state or prior orientation may be identified as such. | Wait; return to shelf; retry if appropriate. | A blank world is confirmed deletion or a loading view is current truth. |
| **Stale / rebuilding projection** | The oriented/derived view may lag behind the source state; freshness/source status is visible. | Read authoritative current state; retry/reopen detail when available. | A stale summary or index is canonical. |
| **Acknowledged** | The user’s Action was durably received; it is not yet committed. | Wait; leave and return later; inspect current safe state; cancel only when eligible. | The narrative/proposal is saved or a retry is required. |
| **Generating / validating** | A response or proposed change is being prepared/checked; authority is unchanged until resolution. | Wait; leave; use eligible cancel/recovery path. | The model controls user choices or validation guarantees commit. |
| **Awaiting exact confirmation** | A specific consequential effect needs direct approval; target, scope, impact and preserved authority are shown. | Confirm exact change; reject; return to state. | An adjacent ordinary Action, a preselected option or prior consent silently approves it. |
| **Committed** | The action has one accepted result; Change Trace states what changed and what is next. | Continue; inspect; correct; create Branch if exploring. | All projections/derived summaries are immediately fresh or the change can be erased by refresh. |
| **Conflict** | Current Branch state changed since the user started; this exact action/effect needs review. | Read current state; create a new Action; re-review confirmation if needed. | The system auto-merged, discarded another change or selected a mode/effect on the user’s behalf. |
| **Recoverable wait / temporary failure** | The world/user-owned state is safe; the operation is delayed or retryable, not silently gone. | Wait; inspect Action; retry/cancel if status permits; return later. | A failure committed a result or a retry will duplicate an action. |
| **Access / consent / policy boundary** | The requested content/action is unavailable for a specific non-leaking reason and may have a recovery/appeal path. | Review permitted path; appeal/recover where applicable; return. | Hidden content does not exist, another user’s private state can be inferred, or a workaround is available. |
| **Confirmed deletion / lifecycle change** | A known asset/state is in its confirmed lifecycle state and the applicable retained/recovery boundary is clear. | Follow documented exit/recovery/appeal path. | Loading, lag or revocation are generic “not found.” |

## 3. Global state-transition contract

```text
Ready
  ├─ submit ordinary Action ──> Acknowledged ──> Generating / validating
  │                                                  ├─> Awaiting exact confirmation ──> Committed
  │                                                  ├─> Committed
  │                                                  ├─> Conflict
  │                                                  └─> Recoverable wait / failure
  ├─ request contract change ─> Review exact before/after ─> Acknowledged/validating ─> Committed or Conflict
  ├─ request L3 correction ──> Review target/effect/scope ─> Awaiting exact confirmation ─> Committed or Conflict
  ├─ inspect source ─────────> Current / stale-rebuilding Explanation Projection
  └─ create recovery path ───> Review preservation/effect ─> Confirmed Branch or Restore result
```

This diagram is a behavior contract, not a final flowchart, visual treatment or back-end state diagram. The user's route away from the surface always preserves their ability to return and resolve an acknowledged Action by status.

## 4. State matrix by experience surface

### 4.1 World Shelf and Start / Adapt

| State | Required presentation | Recovery / transition |
|---|---|---|
| No personal world yet | Explain the first personal-world outcome and offer an immediate playable-start path. | Start / Adapt; no empty marketplace substitution. |
| Personal worlds available | Show concise continuation context and any Action requiring attention. | Resume → orientation/workspace; review unresolved status. |
| Last-known cue stale | Disclose “last known” versus current retrieval state. | Open orientation or retry; do not announce loss. |
| Starter incomplete | State what minimum playable information is still needed in plain language. | Complete only the missing playable boundary; save/leave without publishing ambiguity. |
| Starter has advanced options unopened | Signal that a playable first scene is already achievable. | Enter first scene; optionally open World Studio later. |
| Access/eligibility block | Give non-leaking boundary meaning and allowed recovery/appeal route. | Return to owned assets or resolve eligible path. |

### 4.2 World Workspace and Action lifecycle

| State | Required presentation | Action eligibility / recovery |
|---|---|---|
| Ready to participate | Scene, active contracts, user authority statement and clear input are understandable. | Submit ordinary Action; access orientation/continuity/recovery. |
| Input incomplete/unsafe | Explain missing actionable meaning or an eligible boundary without displaying internal validator jargon. | Revise; cancel; read support information. |
| Acknowledged | “Received safely; not yet committed” plus stable Action reference/state. | Wait, leave, review status, eligible cancel. |
| Provisional generated content | Label as provisional until committed; do not integrate it into continuity recap. | Wait for validation/confirmation; leave/re-enter by Action status. |
| Confirmation required | Exact effect/target/scope/authority retained and reject path are co-visible. | Confirm exact operation; reject; inspect affected current state. |
| Committed change | Change Trace offers outcome, permitted reason/source context, affected scope and next state. | Continue; inspect; correct; Branch. |
| Conflict | Explain state changed, preserve the user’s original wording/intent where permitted and direct toward current review. | Rebase by making a deliberate new Action; do not auto-retry. |
| Delayed/unavailable provider | State that the last committed state remains available and whether Action is unresolved/retryable. | Wait; cancel/retry only if safe; return to shelf. |

### 4.3 Return Orientation and Change Trace

| State | Required presentation | Recovery / transition |
|---|---|---|
| Fresh orientation | Current situation, meaningful committed changes, relevant relationship/open thread and next participation point. | Continue; expand a specific change; open continuity detail. |
| No new meaningful change | Say there is no new meaningful change without manufacturing event content. | Continue from current situation. |
| Stale/rebuilding orientation | Show source/freshness rather than an authoritative-sounding recap. | Read current state; retry/reopen when ready. |
| Pending Action from prior session | Place status above a continuation prompt that could conflict with it. | Review action status; continue only with current-state awareness. |
| Change detail unavailable by scope | State that some explanation is not available within the user’s permitted scope. | Return; inspect accessible context; appeal only where product policy provides it. |

### 4.4 Continuity Lens and correction/removal

| State | Required presentation | Recovery / transition |
|---|---|---|
| Accessible canonical fact/change | Present target, permitted source class/Commit, scope, freshness and correction path. | Inspect; request correction/removal; Branch for experimentation. |
| Accessible derived item | Name it as derived/non-canonical and describe rebuild/remove meaning accurately. | Remove/rebuild if allowed; do not represent it as a permanent canon rewrite. |
| Private/inaccessible source | Do not expose source name/count/prompt/reasoning. | Show only an appropriate non-leaking access boundary. |
| L2 routine correction context | Explain a low-risk, attributable change without forcing an interruption-heavy L3 flow. | Continue; inspect source; use existing recovery path. |
| L3 correction/removal review | Exact target, current scope, before/after effect, Branch context and why renewed confirmation may be needed. | Confirm exactly; cancel untouched; Branch instead if the user means to explore. |
| Head stale before confirmation | Explain that current state changed and that confirmation no longer binds the same effect. | Refresh/review target and submit a new exact confirmation. |
| Committed correction/removal | Show the accepted result and future-use expectation without claiming erased historical provenance. | Return to updated item; continue; inspect relevant trace. |

### 4.5 Participation Contract

| State | Required presentation | Recovery / transition |
|---|---|---|
| Current contract | Initiative and world structure shown separately, along with avatar/resource/irreversible-choice authority. | Read meaning; return to world. |
| Considering a change | Before/after values and practical behavior difference; retained user authority remains visible. | Confirm direct contract change; keep current contract. |
| Stale contract/head | State that current participation context changed before the intended transition completed. | Review current contract; intentionally submit a new change. |
| Change committed | Summarize the new two-axis contract and its recorded effect on future participation. | Return to same world context; inspect outcome. |
| Ineligible/unsupported transition | State the applicable boundary without pretending that a normal prompt can override it. | Keep/choose permitted current context; read boundary information. |

### 4.6 Recovery Lab

| State | Required presentation | Recovery / transition |
|---|---|---|
| No saved recovery point | Explain the purpose of marking a safe point and offer it before risky exploration. | Create safe point; return to workspace. |
| Select Branch source | Present accessible source context and explicit original-preservation statement. | Create alternative Branch; cancel unchanged. |
| Branch active | Keep original vs experiment understandable across workspace/orientation/recovery entries. | Continue; compare at product-behavior level; choose deliberate restore/correction path. |
| Restore proposal ready | Present scoped effect preview, affected/not-affected meaning and source preservation. | Confirm Restore; return; do not rewrite history in-place. |
| Restore unavailable/stale | Say why effect cannot be safely applied now and preserve existing Branch. | Reopen current view; select an accessible point; retry intentionally. |
| Delete path | Separate lifecycle effect, scope, retained information/recovery/appeal from safe recovery language. | Review/delete only with explicit confirmation; cancel. |

### 4.7 World Studio and optional creator depth

| State | Required presentation | Recovery / transition |
|---|---|---|
| Starter ready | State that the world is playable and where first scene begins. | Begin/resume play; optionally deepen later. |
| Starter incomplete | State what blocks playability without exposing implementation mechanics. | Supply minimal missing input; leave safely. |
| Advanced layer unopened | Explain available deeper control in terms of play effect. | Reveal layer by user choice; do not auto-expand. |
| Draft change pending | Distinguish editable authoring from a playable revision and existing Continuities. | Review/discard/save according to permitted lifecycle; never imply existing Continuity changed silently. |
| Optional preview/check unavailable | Label as a conditional scope capability, not a broken mandatory creator task. | Continue with playable starter; revisit if/when selected. |
| Sharing unavailable | Explain bounded sharing is optional and public market is not part of V0/MVP. | Retain personal world; later authorized sharing path only. |

## 5. State wording constraints

| Avoid | Prefer the experience to communicate |
|---|---|
| “Saved” when an Action is only acknowledged. | “Received safely; the result is still resolving.” |
| “The AI decided” for a consequential mutation. | What changed, permitted source/cause, scope and the available recovery path. |
| “Memory” as a single undifferentiated object. | Whether an item is accessible canonical continuity, committed history or a derived summary/candidate. |
| “Rewind” for every return-like action. | Safe point, Branch, Restore, correction/removal or Delete, each with its own preservation effect. |
| A generic blank/error/not-found condition. | Loading, stale projection, unresolved Action, conflict, temporary issue, access boundary or confirmed lifecycle state. |
| “Mode” as one vague dial. | Initiative/authority and world structure as two independently meaningful contracts. |

## 6. Accessibility and constrained-device baseline

Every state above must have a readable text equivalent, programmatically named status, keyboard-reachable next action and a stable return path. Motion, audio, dense visualization or side-by-side comparison may improve a later design, but no state’s meaning may depend on them. On mobile, state changes appear in a deliberate sequence that keeps the current Action/confirmation/recovery context available after a detail surface closes.

## 7. Validation hooks for later prototype work

| Interaction state claim | Observable prototype validation question |
|---|---|
| Acknowledged versus committed is understood. | Can a participant correctly identify whether a just-submitted action changed the world? |
| Two contracts are independent. | Can a participant explain the difference between changing initiative and changing goal structure? |
| High-impact correction is intentional. | Can a participant describe target, effect, scope and what remains unchanged before confirming? |
| Return orientation is sufficient. | Can a returning participant continue the intended thread without reconstructing facts manually? |
| Recovery actions are distinct. | Can a participant choose Branch rather than Restore/Delete when their stated intent is experimentation? |
| Explanation is informative without leakage. | Can an authorized participant explain a fact’s permitted provenance/scope while an unauthorized-role test reveals no hidden context? |

## References

- [Experience Architecture V0](EXPERIENCE_STRUCTURE_V0.md)
- [Core User Journeys V0](CORE_USER_JOURNEYS_V0.md)
- [Text Wireframes V0](TEXT_WIREFRAMES_V0.md)
- [Product Requirements V1](../../product/PRODUCT_REQUIREMENTS.md)
- [Runtime, Model and Persistence](../../system-design/RUNTIME_MODEL_AND_PERSISTENCE.md)
- [API, Security and Operations](../../system-design/API_SECURITY_AND_OPERATIONS.md)
