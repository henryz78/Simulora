# Track B: Local Live Play with the Owner's Provider

**Date:** 2026-09-25 (UTC 2026-09-26) · **Authorization:** the product owner
approved track B in chat ("可以 你随便用"), with ample provider quota. Local
only; beta, launch and production live model use remain unauthorized.

This is **Agent-operated** play through the formal UI, not human enjoyment
validation.

## 1. Setup

- **Code:** `main` at `9253ab2` (SA-2 closed), plus the gateway fixes in §3.
- **Services:** the real web app (Vite, `127.0.0.1:3000`), API and worker
  (`SIMULORA_ENV=local`, development identity).
- **Database:** a persistent local PGlite over the PostgreSQL wire protocol
  (git-ignored `.local-data/track-b/`), migrated to 0050 by the repository
  migrator. It is single-session, so it is not evidence for concurrency.
- **Provider:** the worker used the product's OpenAI-compatible adapter with
  the owner's aggregator profile (model
  `ModelScope/deepseek-ai/DeepSeek-V4.1-Flash`). The key stays in the ignored
  `.secret.txt` and only in the worker process environment.
- **Local profile settings:** timeout 90 s; output budget 8,192 tokens after
  §3.3.
- **Raw replies:** for diagnosis, a local-only worker entry saved the raw
  provider replies, with the key redacted, under `.local-data/track-b/raw/`.
  This is not product code.

## 2. What was played

A World authored only in Studio: *Saltmarsh Ferry*.

- two places: Ferry landing and Guild hall;
- Pell, a ferryman and a permitted mover;
- Wren Hollis, the guild master;
- one route, landing → hall, open to movers;
- one rule: nobody crosses the causeway while the tide covers it.

| # | Action | Result |
|---|---|---|
| 0 | Studio playability check | Wren, who had no knowledge, got the SA-2 warning naming the fact to give her. Fixed in Studio, then the Revision was created. |
| 1 | Ask Pell about the seal (response only) | The first 3 attempts failed (§3.1); after the fix, `COMPLETED_NO_EFFECT` with an in-character reply. |
| 2 | Ask Pell to carry the letter up the causeway (move) | The first Action's 4 attempts failed; the one captured was an empty reply (§3.2). It was cancelled. On resend: the model applied the world rule and proposed a transformed failure (L2). Confirmed; a thread opened. |
| 3 | Wait for the ebb (work toward the thread) | L2 thread resolution with a written resolution. Confirmed. |
| 4 | Cross to the hall and hand Wren the letter (fact change) | The model contradicted the committed resolution (§3.4). Cancelled. |

The prose quality was high and in character. Characters did not author the
user's speech or choices. The rule-driven turn in action 2 is the kind of
causal consequence the product aims for.

## 3. Findings

### 3.1 The provider renames the model in its reply (fixed, `e269364`, `9ca1fdb`)

The aggregator routes by a prefixed name and answers with the unprefixed one
(`deepseek-ai/DeepSeek-V4.1-Flash`). The exact route-change guard therefore
refused every reply.

Fix: optional `SIMULORA_MODEL_ANSWERING_NAME` declares the expected answering
name. The guard stays exact, and any other name is still a changed route. The
name is in the profile digest, so a change is recorded. It is not a material
change, because the requested model, provider and prompt are unchanged.

### 3.2 The provider intermittently returns an empty HTTP 200 (classified, `6f44524`)

About one reply in three is HTTP 200 with `"choices": null` and zero tokens.
Replaying the same captured request showed 2 empty of 3 as-is, 1 of 3 without
a token limit, and 1 of 3 with `max_tokens`, so it is upstream and not caused
by the request.

It was classified as a malformed answer; it is now `ProviderUnavailableError`,
an outage. Retries are unchanged: 3 attempts per Action, no backoff. So an
Action still fails when three empty replies come in a row, and the owner then
retries or cancels.

### 3.3 Reasoning consumes the output budget, and replies are slow

The model spends most completion tokens on hidden reasoning: 950–2,048 tokens
for about 1,100–1,400 visible characters. With a 2,048 budget, a reply can end
at the length limit with empty content. Replies took 3–43 s. The product
defaults (30 s, 2,048 tokens) are too tight for this model; the local run used
90 s and 8,192.

This is a profile setting, not a code change. A shared profile needs its own
values.

### 3.4 Committed outcomes are not in the model's context (owner chose option A: TB-1, §3.6)

The compiled request's `history` lists committed turns as event kinds and IDs
only: `ATTEMPT_TRANSFORMED`, `THREAD_RESOLVED`. The narratives, the
transformed outcome and the thread resolution are absent, and resolved threads
are not listed. Only response-only dialogue (`priorDialogue`) carries text.

After the resolution said the ebb uncovered the causeway, the next turn
therefore said the causeway was still flooded, and it blocked the user's own
crossing.

The Return page shows all of this correctly, so the gap is in the generation
context, not in storage.

Fixing it touches RE-2 authorized context, which limits what each Character
may know. It is a design decision for the product owner, not a patch here.

### 3.5 Play-experience notes (not fixed)

- After confirming, the Character's reply disappears from the play page, and
  "Recorded Actions" shows only the user's own words. Return does show the
  outcomes.
- The playability warning shows the internal path
  (`characters.1.knowledgeFactIds`), and the message ends in `.".`.
- The home page reads as engineering status ("A durable world begins with a
  known source of truth"), not as a player's entry.
- "Retry this Action" after `FAILED_RECOVERABLE` allows only one more
  attempt, because attempts count per Action.
- Facts change only when the user asks for a fact change. After the user
  "puts the letter in my coat", the fact still says it lies on the landing.

### 3.6 Replay after TB-1 (local, before Review)

The owner chose option A for §3.4. TB-1 (`e0c8b9c`, successor 0051 and prompt
version 7) was applied to the play database, and action 4 was sent again.

- **Context:** the compiled request carried Pell's transformed outcome with his
  exchange, and the thread resolution. Wren does not know the flood fact, but
  both texts are SHARED.
- **Attempt 1:** the reply was consistent ("The planks are dry, then"), but the
  agency guard refused it: *"Generated narrative cannot author user speech or
  protected commitments"*. In it, Wren told the clerk what to do next ("You'll
  copy the morning's soundings before you go"). That is a Character's
  instruction, not the user's commitment, so this is a possible guard false
  positive. It is recorded, not changed.
- **Attempt 2:** a consistent L3 fact change: the letter is handed to Wren,
  unopened, and set on her desk.
  - It was confirmed in the UI.
  - The SQL evidence check accepted the new context.
  - The fact now reads that way.

## 4. Usage

There were 23 provider calls:

- 13 in-product attempts over 6 Actions (the last two after TB-1);
- 1 model-name probe;
- 9 diagnostic replays of one captured request.

No limit was reached. Nothing was committed except through exact UI
confirmation.

## 5. Not claimed

- Human enjoyment.
- Production readiness of the provider.
- Concurrency behavior (PGlite).
- Any provider approval.
