# Proxy Play Report, 2026-10-16

**Date:** 2026-10-16 · **Authorization:** the owner asked the agent to play in their place
("你就来扮演一下真正的真人玩家 游玩一下看看效果怎么样 然后再看看下一步是什么").

This is **Agent-operated** play through the formal UI. It is not human enjoyment validation.
Nothing in the product was changed.

## 1. Setup

- **Code:** `main` at `afd891c` (WD-2 and prompt v13 closed), migrations to 0059.
- **Services:**
  - the real web app (Vite), the API and the worker, all `SIMULORA_ENV=local`;
  - the persistent local PGlite play database (`.local-data/track-b/pgdata`).
- **PGlite limits:** it is single-session, so it is not evidence for concurrency. It also
  desyncs after a SQL error inside a transaction (§3.2).
- **Provider:** the owner's aggregator profile through the product's OpenAI-compatible
  adapter, model `grok-4.7`. The key stayed inside the worker process.
- **Local launcher changes (not product code):**
  - timeout raised from 90 s to 120 s;
  - after turn 3, the launcher added `reasoning_effort: "low"` to each request (§3.1);
  - it saved the request and reply bodies under the ignored `.local-data/track-b/raw/`.
- **Browser:** the Chinese interface.

## 2. What was played

A new World built only in Studio: *雪夜茶馆*.

- **Places:** 老周茶馆 and 山道口.
- **Characters:**
  - 老周, the guarded owner;
  - 阿青, a young hunter who may move along one route (tea house → pass).
- **Facts:**
  - one shared fact: a six-person caravan entered the mountains three days ago and never
    came back;
  - one discoverable secret: 阿青 was the caravan's guide and turned back at the pass.
- **Thread and rule:**
  - one thread: what happened to the caravan;
  - one world rule: without a guide, no one reaches the deep mountains safely on a
    blizzard night.

Every turn used "让故事决定" (let the story decide) and direct play (no Strict mode).

| # | Action | Result | Player's wait |
|---|---|---|---|
| 1 | Ask 老周 for tea; ask why the town is quiet | No change. 老周 deflects in character. | 76 s |
| 2 | Sit by 阿青, share bread, ask about the mountain road | No change. Attempt 1 timed out. | 159 s |
| 3 | Ask 阿青 to lead me to the pass | No change: attempts 1–4 timed out, attempt 5 was refused (§3.3), attempt 6 succeeded. The narration says she opens the door; the state does not move her (§3.5). | 776 s, with two manual retries |
| 4 | Follow 阿青 to the pass | Committed: 阿青 moved to 山道口. Four attempts lost to worker crashes (§3.2). | 441 s, with worker restarts |
| 5 | Search the snow by the boundary stone | Committed: the secret was revealed. WD-2 then showed it as the current situation. | 41 s |
| 6 | Gently confront 阿青 | No change. Attempt 1 was refused by the guard; attempt 2 succeeded. | 63 s |

What worked:
- Studio flow, the playability check and its reminder about 阿青's knowledge.
- Character voice: 老周 deflected as written, and 阿青 opened up slowly.
- The move and the reveal committed correctly; state, Return and Continuity agreed.
- WD-2's current-situation line followed the reveal.

## 3. Findings

### 3.1 The provider cannot finish heavy turns (blocks play)

- With default reasoning, `grok-4.7` took 68–76 s on talk-only turns.
- On the world-change turn it took more than 120 s. Replaying that request showed the
  aggregator's gateway answering **HTTP 524 at about 125 s**. No timeout on our side can
  make it succeed.
- With `reasoning_effort: "low"`, the same request took 64 s, and later turns took 25–40 s.
- The product adapter sends no reasoning setting and does not stream.

### 3.2 PGlite crashes the worker on a SQL refusal (environment)

When the SQL check in §3.3 refused a proposal, PGlite desynced. The worker process then
exited ("Received unexpected commandComplete message from backend"). Real PostgreSQL rolls
the transaction back instead. That path was not checked in this play.

### 3.3 The Chinese authority guard refuses ordinary narration, and SQL is stricter than the application (blocks play)

Three failed attempts (turn 3 attempt 5, turn 4, turn 6 attempt 1) came from the guard.

- **Application guard (`assertGeneratedNarrativeDoesNotAuthorUser`):** splits on `。！？`. It
  refuses any sentence holding 你 and a speech or decision word, even when 你 is not the
  subject. For example, "阿青看着你站起来…轻声说" and "你不问这些，我不会说的". Prompt v13 does
  not prevent this: the model puts 你 in the Character's sentence as an object.
- **SQL guard, a parity defect:** since `0028`, `generated_narrative_authors_user_base`
  removes all punctuation and checks the **whole narrative** as one string. Any 你 followed
  anywhere later by 说 is refused.
- **Reproduced on turn 4:** each sentence passes both guards on its own, the full narration
  passes the application guard, and the full narration fails in SQL. Trace:
  `validate_action_proposal_binding` → `px4b_turn_is_valid` →
  `action_generation_evidence_is_valid` → `px4b_generation_evidence_core` →
  `generated_narrative_authors_user` → `_base`.
- **Consequence:** for Chinese, v13's "end the user's sentence first" cannot help at the SQL
  layer. The WD-2/v13 closure only covered the application layer.
- **Fixing it changes the authority guard,** so it needs the owner's decision and a successor
  migration. Options:
  - make SQL split sentences as the application does (parity);
  - and/or narrow both guards to 你 as the subject (successor ADR).

### 3.4 The player sees internal data and English

- **Change summary after the move:** "世界事实: f489b49f-… → d9260c60-…". It shows raw
  location IDs and calls a move a fact.
- **Return page:**
  - "dcddbc3f-… moved from f489b49f-… to d9260c60-…; source: a40a7336-…";
  - "A hidden truth came to light.", "Continue from the current situation";
  - "世界时间：After action 2 · 回合 2" after six actions.
- **English elsewhere in the Chinese interface:**
  - "Present at 老周茶馆." under each Character;
  - the Studio defaults "Witness" and "Place 2";
  - the server's playability reminders;
  - "来源：Generated Action <uuid>";
  - "After action 2" on the Continuity page.

### 3.5 Story coherence

- **Turn 3:** the narration has 阿青 stand, take her cloak and open the door, but the turn
  chose no world effect. Story and state disagreed until turn 4.
- **Turn 6:** the narration lights 阿青's face with the tea-house fire while she stands at the
  pass.
- **Turn 5:** the narration found footprints and marks, and the reveal then showed the
  author's whole secret.
- **Recited author text:** 阿青 recites the world rule almost word for word (turn 2) and her
  own stance ("我慢慢信任你了", turn 6).

### 3.6 Waiting and undo

- **Misleading wait copy:** after 10 s of an ordinary generation, the page says
  "这次回应需要再生成一次" (another attempt is needed), even when nothing failed.
  `recoverableWait` is true for any Action older than 10 s.
- **Failure copy:** a failed turn says only that it can be retried. It never says the provider
  timed out.
- **Undo:** after a talk-only turn, "Undo this turn" is gone, so the previous reveal can no
  longer be undone.
- **Target reset:** a reload resets the selected Character to "让世界回应".

## 4. Not checked

Human enjoyment; real PostgreSQL behavior after the SQL refusal (§3.2); mobile; branch and
restore; export; English-language play.
