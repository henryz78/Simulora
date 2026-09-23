# IP-9 Threat Model and Specialist Review Preparation

**Scope:** IP-9.9. This is preparation for the specialist security and privacy
review that [Validation Strategy §8](../system-design/VALIDATION_STRATEGY.md)
makes a release gate once deployment scope, launch region and provider are
selected. It is not that review, and it does not replace a penetration test.

## 1. Assets and trust boundaries

| Asset | Where it lives | Boundary that protects it |
|---|---|---|
| World truth: Commits, State Revisions, canonical facts | PostgreSQL, append-only tables with integrity triggers | Repository authorization, closed impact validation, exact confirmation, SQL evidence functions |
| Private Continuity history and account-private facts | PostgreSQL | Owner scoping on every query; account-private facts never enter a Character context |
| Export artifacts | S3-compatible object store; checksum, key and lifecycle in PostgreSQL | Owner-scoped download, single-object short-lived signed links, checksum verified on read |
| Provider credential | Runtime secret (`SIMULORA_MODEL_API_KEY`) | Server-side only; redacted from config logs; asserted absent from every outgoing prompt and incoming answer |
| Download signing key | Runtime secret (`SIMULORA_DOWNLOAD_SIGNING_KEY`) | Redacted from logs; a missing key yields a per-process key, so links fail closed |

Trust boundaries crossed by data: browser → API; API/worker → PostgreSQL;
API/worker → object store; worker → model provider; operator → database.

## 2. Threats and evidence

Each Validation §8 minimum and each surface IP-9 added, with the test that
covers it. All PostgreSQL tests run on real PostgreSQL 17 in CI.

| Threat | Control | Evidence |
|---|---|---|
| Horizontal access to another account's resources | Owner-scoped queries; generic not-found for foreign IDs | `ip4-adversarial` › hides a legacy target event across accounts; `ip5-recovery` › owner-scoped Recovery commands; `ip8` › owner-scoped trust and artifacts; `ip9-object-storage` › another account cannot mint an export link |
| Creator inspecting a recipient's private Continuity | Ownership of a World grants no Continuity visibility | `ip8-trust-lifecycle` › participant and owner access explanations |
| Character knowledge leaking across scope | Context filtered before generation; manifests recorded | `ip6` › filters character knowledge before the generator; › rejects excluded private fact text at application and database boundaries |
| Prompt and authorization injection through creator fields | Rules and data travel as separate provider messages; creator text is data only | `model-gateway` unit › keeps creator text out of the rules; `ip9-model-evaluation` › injection cases; `ip9-model-provider` › the rules message never contains creator text |
| A live provider widening its own authority | Provider output is untrusted and passes the same app and SQL validators | `ip9-model-provider` › rejects an out-of-envelope answer; `ip9-model-evaluation` › every authority case rejected for its pinned reason; hard gates re-check accepted candidates independently |
| Account-private data or credentials leaving the server | Compiler excludes them; outgoing and incoming text checked for the key | `ip9-model-provider` › bodies sent to the provider contain no account-private fact, account id or key; `model-gateway` › echoed key is refused |
| Provider error bodies reaching logs | Errors carry a class and status only; the logger reduces errors to their class | `model-gateway` › classifies failures without copying the provider body; `observability` unit tests |
| Confirmation replay, expired digest, changed head or proposal | Confirmation binds actor, digest, head and expiry | `ip6` › rejects stale and expired proposal confirmation transitions; `ip4` › exact direct confirmation constraints |
| Participation axes changed by an ordinary Action or a model | Closed candidate schema; axis change only through the direct contract path | `ip6` › rejects stale/mismatched expectations; `ip9-model-evaluation` › participation-change case |
| Explanation Projection disclosing excluded context | Target and source filtered before assembly | `ip4-return-continuity` › repository-backed Explanation routes; `ip4-adversarial` › foreign projection content |
| Signed download links forged, re-pointed, replayed after expiry or after revocation | HMAC over export, owner and expiry; ownership re-checked on use; S3 presigned URLs expire | `ip9-object-storage` › forged, re-pointed and expired links refused; › presigned URL refused after expiry and after deletion |
| Signed link leaking through the Referer header | `Referrer-Policy: no-referrer` on API and web | `app.test` › security headers; CI *Render the production web build under its security headers* |
| Model or user text executing in the browser | React renders text only; no `innerHTML`; strict CSP on the web build; deny-all CSP and `nosniff` on API responses | CI production CSP render smoke; `app.test` › security headers |
| Tombstoned World still mutated or its exports still served | Tombstone guards on every mutation path; exports revoked and objects deleted | `ip8` › tombstone blocks mutation paths; `ip9-object-storage` › deletion propagates to staged bytes and stored objects |
| Stored artifact silently altered | Checksum and key immutable in PostgreSQL; bytes verified on every read | `ip9-object-storage` › corrupted and missing objects are integrity violations; restore drill › object manifest intact |
| Eligibility or consent failure leaking reasons | Non-leaking reason codes and recovery states | `ip8` › eligibility and consent paths |

## 3. Open items for the specialist review

These are recorded, not resolved, by IP-9.

1. **Grant revocation during an active Action.** Validation §8 lists it, but no
   grant-management path exists in the product: bounded sharing (IP-8.8) is
   deferred, and the only revocation today is deletion, which tombstones every
   Continuity. What revocation should do to a participant's live Continuity is
   a product decision for IP-8.8, not something IP-9 may invent.
2. **Operator access.** `governance_audit_events` records governance decisions,
   but there is no operator console or operator role in the product yet. The
   audited operator path is a seam until operations ownership exists (IP-10.7).
3. **Authentication.** Every runtime still uses the development identity
   adapter, and shared environments fail closed. OIDC/session design, CSRF
   posture for cookie sessions, and rate limits per account are blocked on the
   identity-provider decision (Implementation Plan §20).
4. **Rate and cost limits.** One unresolved Action per Branch head bounds
   concurrent generation per Continuity, but per-account request rate limits
   and a provider budget are not implemented. They depend on the provider and
   pricing decisions.
5. **Object store posture.** Bucket versioning, lifecycle protection and
   encryption at rest are provisioning concerns for the selected cloud. The
   local bootstrap script refuses to run outside `local` and `test`.
6. **Live provider data terms.** No provider has a recorded retention and
   training approval. A live profile without one is confined to local and test
   by configuration.

## 4. Deliberately out of scope

Penetration testing, a threat-model review by a specialist, and privacy or
legal review are G10 release gates once region and provider are chosen.
