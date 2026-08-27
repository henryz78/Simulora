# API, Security and Operations

Status: `FROZEN WITH SYSTEM DESIGN V1`

## 1. Contract style

- External product APIs use `/v1` versioned HTTPS JSON.
- State-mutating requests use an `Idempotency-Key` header and, where applicable, `expectedHeadCommitId`.
- Export, import acceptance, sharing, consent, appeal and deletion use the same durable idempotent Action/operation-envelope rule even when their terminal result is a job, grant or lifecycle record rather than a Branch Commit.
- One-way progress and output use resumable Server-Sent Events (SSE).
- API schemas and error codes are described in OpenAPI during implementation; this document is the semantic authority.
- Internal module calls are typed in-process application-service contracts. Workers consume durable job records rather than calling private HTTP services.
- Identifiers are opaque. Clients may not infer ownership, ordering or type from an ID.

## 2. Resource API

This is a contract inventory, not a UI map.

### 2.1 Accounts and access

| Method and resource | Purpose | Important contract |
|---|---|---|
| `GET /v1/me` | current account, eligibility and capability summary | excludes hidden policy/provider details |
| `GET /v1/me/consents` | inspect current consent versions/scopes | withdrawal availability included |
| `POST /v1/me/consents` | grant/withdraw one consent | idempotent by consent type/version/scope |
| `GET /v1/resources/{type}/{id}/access` | explain effective access | reason-coded; never grants authority by itself |
| `POST /v1/appeals` | open an appeal for an eligible decision | returns durable appeal ID/status, not an outcome promise |

### 2.2 Worlds and authoring

| Method and resource | Purpose | Important contract |
|---|---|---|
| `POST /v1/worlds` | create owned World and starter Draft | safe defaults; no hidden prompt dependency |
| `GET /v1/worlds/{id}` | inspect identity/lifecycle/revisions | owner or explicit grant required |
| `GET /v1/worlds/{id}/draft` | read current mutable Draft | returns row version |
| `PATCH /v1/worlds/{id}/draft` | apply structured Draft changes | optimistic concurrency; creator data treated as data |
| `POST /v1/worlds/{id}/validate` | run playability/schema checks | advisory findings; no Revision creation |
| `POST /v1/worlds/{id}/revisions` | create immutable playable Revision | validation and asset-rights checks required |
| `POST /v1/worlds/{id}/preview` | create isolated preview when selected | cannot mutate a user's real Continuity |

### 2.3 Continuity, Branch and state

| Method and resource | Purpose | Important contract |
|---|---|---|
| `POST /v1/continuities` | start from an authorized World Revision | creates initial Branch and State Revision atomically |
| `GET /v1/continuities/{id}` | identity/lifecycle/active Branch | does not return all private history by default |
| `GET /v1/continuities/{id}/orientation` | current return orientation | includes authoritative source head and freshness |
| `GET /v1/branches/{id}/state` | authorized view of authoritative current state | identifies source State Revision/head; scope-filtered response is not a second canonical revision |
| `GET /v1/branches/{id}/commits` | paged causal/history navigation | stable cursor; visibility filtered |
| `POST /v1/branches/{id}/actions` | submit a world/state/action intent | durable acknowledgement; idempotency required |
| `GET /v1/actions/{id}` | recover truth after timeout/reconnect | returns lifecycle, Commit or recoverable error |
| `POST /v1/actions/{id}/confirm` | confirm exact protected proposal | proposal digest and expected head required |
| `POST /v1/actions/{id}/cancel` | cancel if no Commit exists | terminal response; cannot undo a Commit |
| `GET /v1/actions/{id}/events` | SSE progress/output | resumable cursor; provisional frames labeled |

### 2.4 Correction and recovery

| Method and resource | Purpose | Important contract |
|---|---|---|
| `POST /v1/branches/{id}/corrections` | supersede/remove scoped fact or state item | normal Action/Commit protocol; reason/provenance retained |
| `POST /v1/branches/{id}/recovery-points` | name current or accessible Commit | no state copy or mutation |
| `POST /v1/continuities/{id}/branches` | branch from a selected Commit | source unchanged; new Branch ID returned |
| `POST /v1/branches/{id}/restore-proposals` | calculate restore effect | read-only diff, scope and digest |
| `POST /v1/branches/{id}/restores` | confirm non-destructive Restore | new Commit; expected head and proposal digest required |

### 2.5 Portability and lifecycle

| Method and resource | Purpose | Important contract |
|---|---|---|
| `POST /v1/exports` | request selected-scope export | async job; authorization rechecked at generation |
| `GET /v1/exports/{id}` | status/download metadata | short-lived authorized download URL when ready |
| `POST /v1/imports` | stage user-owned/authorized material | quarantine only; no canonical mutation |
| `GET /v1/imports/{id}/proposal` | inspect extracted proposal | source/provenance and warnings included |
| `POST /v1/imports/{id}/accept` | create an authorized draft/continuity | explicit item selections and corrections required |
| `POST /v1/shares` | create bounded grant/package when selected | rights/visibility/revocation explicit |
| `POST /v1/deletion-proposals` | calculate delete scope | read-only scope/digest |
| `POST /v1/deletions` | confirm lifecycle deletion | tombstone then governed purge; durable status |

### 2.6 Usage and material change

| Method and resource | Purpose | Important contract |
|---|---|---|
| `POST /v1/usage/quotes` | disclose cost/allowance for action profile | expiry and failure/retry policy included |
| `GET /v1/usage/ledger` | explain settled user-visible usage | append-only entries/reversals; no hidden negative state |
| `GET /v1/product-changes` | material capability/model/policy changes | effect, timing and recovery/choice included |

## 3. Action request and response

Example request shape:

```json
{
  "schemaVersion": 1,
  "expectedHeadCommitId": "opaque-id",
  "intent": {
    "type": "PARTICIPATE",
    "text": "I ask Mara what changed at the north gate."
  },
  "participationExpectation": {
    "initiativeMode": "GUIDED",
    "structureMode": "OPEN_ENDED"
  },
  "usageQuoteId": null
}
```

Acknowledgement response:

```json
{
  "actionId": "opaque-id",
  "status": "ACKNOWLEDGED",
  "acknowledgedAt": "UTC timestamp",
  "expectedHeadCommitId": "opaque-id",
  "committed": false,
  "eventsUrl": "/v1/actions/opaque-id/events"
}
```

Commit response/status adds `commitId`, `resultHeadCommitId`, final history entry IDs, state revision ID and usage settlement summary. It never returns `committed: true` before the transaction succeeds.

## 4. Error contract

All non-success responses use stable reason codes and recovery metadata:

```json
{
  "error": {
    "code": "BRANCH_HEAD_CONFLICT",
    "message": "Human-readable, non-sensitive explanation",
    "retryable": false,
    "actionId": "opaque-id-or-null",
    "currentHeadCommitId": "opaque-id-or-null",
    "recovery": ["REVIEW_CHANGES", "CREATE_NEW_ACTION"]
  }
}
```

Required distinctions include:

- invalid input;
- unauthenticated;
- ineligible;
- unauthorized/hidden resource (without leaking existence);
- head conflict;
- policy/safety boundary;
- confirmation required/expired;
- usage quote expired or insufficient allowance;
- model unavailable/degraded;
- timeout with durable Action;
- projection stale/rebuilding;
- temporarily unavailable;
- tombstoned/deleting;
- confirmed deleted.

Loading, sync delay, conflict, service failure and deletion must never share one generic “not found” state when the caller is authorized to know the distinction.

## 5. Authorization model

### 5.1 Roles

V1 roles are deliberately small:

- `OWNER`: full allowed asset control, subject to protected confirmations and policy;
- `PARTICIPANT`: start/use a shared playable Revision under grant;
- `VIEWER`: read explicitly shared content only;
- `OPERATOR`: narrowly scoped service operation under audited support/governance workflow.

No role grants access to another user's private Continuity history by default. Creator ownership of a World does not grant visibility into a recipient's private Continuity. Collaborative Draft editing and team-authoring roles are out of V1.

### 5.2 Authorization sequence

Every request evaluates:

1. authenticated Account and adult-launch eligibility;
2. resource lifecycle and tenant/owner boundary;
3. explicit ownership or unrevoked grant;
4. requested operation and role;
5. content visibility/privacy scope;
6. active consent/policy restrictions;
7. protected-action confirmation when relevant.

Authorization occurs in application services for every resource access. Database query scoping and optional row-level controls provide defense in depth; neither replaces domain checks.

### 5.3 Visibility scopes

Closed V1 scope types:

- `ACCOUNT_PRIVATE`
- `CONTINUITY_PRIVATE`
- `CHARACTER_PRIVATE`
- `WORLD_SHARED`
- `GRANT_SHARED`
- `OPERATOR_RESTRICTED`

Scope is stored with canonical and derived items. A scope transformation is a protected audited Action; copying text into a new field cannot bypass it.

## 6. Security and privacy controls

### 6.1 Data classification

| Class | Examples | Minimum controls |
|---|---|---|
| Restricted user content | private conversation, user notes, imported archives | encryption in transit/at rest, least privilege, scoped retrieval, audit on operator access |
| Sensitive account | identity, eligibility, consent, appeal | separate access policy, minimization, no model context inclusion |
| User-owned asset | World, Character Asset, export | ownership/grant checks, provenance, export/delete scope |
| Operational secret | provider keys, signing keys | managed secret store; never database content or logs |
| Derived model data | embeddings, summaries, context manifests | inherit strictest source scope; deletion/rebuild propagation |
| Public/shared candidate | explicitly granted World Revision/package | no public discovery in MVP; recipient grant still required |

### 6.2 Model-provider boundary

- All provider calls are server-side.
- Context is minimized to the task and filtered before retrieval/ranking.
- Account identifiers, eligibility data, payment data, access tokens and unrelated private history are excluded.
- Provider configuration must meet approved retention/training policy; its profile and material changes are versioned.
- Provider output is untrusted input and passes the same schema, authorization, safety and state validators as any external input.
- Logs store request/response identifiers and safe metrics; raw content logging is disabled by default and tightly controlled when diagnosis requires sampled access.

### 6.3 Import and creator-content isolation

Imported files and creator-authored fields may contain prompt injection, malformed data or unsafe links. They are parsed as inert data in a sandboxed/staged pipeline, scanned, size/type limited and mapped only to allow-listed schema fields. They cannot provide system instructions, provider configuration, tool privileges or authorization rules.

### 6.4 Common threat controls

- CSRF protection for browser mutations; secure same-site session cookies or equivalent token design.
- Output encoding and content-security policy for user/model text.
- Rate and concurrency limits by Account, Action type and provider budget.
- Signed, short-lived object download/upload URLs scoped to one object/action.
- No client-supplied object key, SQL fragment, prompt role or policy expression is trusted.
- Secrets are rotated and excluded from exports, traces and model context.
- Confirmation tokens bind actor, action/proposal digest, expected Branch head, protected scope and expiry.
- Administrative/operator access is least-privilege, time-bounded where practical and audited.

## 7. Safety and governance boundary

Safety is enforced at three points:

1. **Input and access:** eligibility, consent, rate/abuse and prohibited-operation checks.
2. **Candidate validation:** content-policy classification plus authority, coercion and protected-action checks.
3. **Output and commit:** final content/state inspection, reason-coded block or constrained result, and appeal/recovery record where applicable.

Character disagreement is allowed. The system must block or intercept model-proposed user impersonation, coerced irreversible commitment, concealed permission/spend changes and product-driven emotional manipulation. The exact safety taxonomy and appeal SLA remain specialist decisions; architecture exposes versioned policy decisions and appeal records without inventing policy content.

V1 is adult-only. The system stores eligibility outcome and minimal evidence reference, not a default full birthdate profile. Minors/family governance are not silently added through architecture.

## 8. Reliability patterns

### 8.1 Transactional outbox and durable jobs

Commits and their outbox records share one database transaction. Workers claim jobs with leases, bounded retries and dedupe keys. A worker crash may cause a job to run again, but unique Action/Commit/ledger constraints make reprocessing safe.

Dead-letter is a visible job state with operator tooling and user-facing Action recovery where it affects a user. It is not silent deletion.

### 8.2 No authoritative cache

Client caches, CDN content, in-memory caches, projections and retrieval indexes carry version/head identifiers. Permission revocation and deletion invalidate access even if cached data exists. A cache miss or stale projection falls back to PostgreSQL/state revision, not to model reconstruction.

### 8.3 Concurrency

- One Branch can process multiple generation attempts, but only a candidate based on the current expected head can commit.
- Competing Actions receive `CONFLICT`; no last-write-wins for authoritative state.
- Cancel and Commit compete through one transactional status check; if Commit already won, cancel returns the existing committed result rather than reporting a false cancellation.
- Draft editing uses row-version optimistic concurrency and explicit conflict resolution.
- Export reads a declared revision/head snapshot so its contents do not drift mid-job.
- Delete tombstoning prevents new Action acceptance before purge begins.

### 8.4 Degraded operation

| Dependency issue | Required degraded behavior |
|---|---|
| model provider down | state/history/export/recovery remain readable; new generation stays unresolved/retryable |
| projection/index lag | serve authoritative state plus stale marker; rebuild projection |
| object storage down | core world actions continue if no required asset; export/upload status clearly delayed |
| worker backlog | acknowledgement succeeds within target if database healthy; wait state and cancel eligibility shown |
| SSE disconnect | poll Action status/reconnect by cursor; no duplicate submission required |
| optional sensory client failure | readable text/control path remains complete |

### 8.5 Observability

Minimum telemetry, without raw private content by default:

- acknowledgement, queue, provider-first-output, validation and commit latency;
- Action counts and terminal/recoverable outcomes by reason code;
- duplicate idempotency hits and prevented duplicate commits/settlements;
- Branch conflicts;
- context scope exclusions and policy blocks as aggregate metrics;
- projection lag by head distance;
- job retry/dead-letter rate;
- export/import/delete lifecycle failures;
- database transaction failures and backup-restore drill outcomes;
- model/profile change correlation with continuity-evaluation results.

Every trace links `request_id`, `action_id`, `branch_id`, `generation_attempt_id` and `commit_id` when present. User content, tokens, prompts and secret values are excluded or redacted.

## 9. Operational release gates

Before any product implementation is called releasable, operations must demonstrate:

- database backup restore into an isolated environment;
- worker retry without duplicate Commit or usage settlement;
- provider outage and slow-generation recovery;
- permission revocation and private-scope retrieval isolation;
- stale projection detection and rebuild;
- export checksum verification and deletion propagation to derived indexes/object artifacts;
- alert ownership and runbooks for unresolved Actions, dead jobs and data-integrity violations.

Exact uptime, disaster-recovery and support SLAs remain later operational/product decisions, not hidden promises in this design.
