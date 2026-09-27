# WD-1 Proposed Decisions: A Deeper World

**Date:** 2026-09-27 · **Status:** `DECIDED 2026-09-27: W1 A, W2 A, W3 A, W4 A`
(the owner took every recommendation in chat). Work proceeds as WD-1a and
WD-1b, each with its own contract.
Each decision changes frozen semantics, so each chosen option then needs a
successor ADR, a contract, implementation and an independent Review.

The [live check after PX-2](TRACK-B-LOCAL-LIVE-PLAY-REPORT.md) (§3.7) showed
that the player's side now works: the World answers the player's own attempts,
and Characters answer only when addressed. What remains is the world itself.
The [product direction](PRODUCT_DIRECTION_GUARDRAILS.md) names this exact risk:
the runtime is becoming a "single-fact editor".

## Why the world feels shallow

The Lantern Inn world had several facts. Three code facts explain what the
live check saw.

1. **The model sees one shared fact.** Generation takes the first ACTIVE
   SHARED fact as its target (`isGeneratorEligibleFact`, RE-2). A World
   response sees only that one sentence. A Character sees it, plus the facts
   that Character knows.
2. **Every recorded outcome rewrites that same fact.** The only fact
   operation is a rewrite of the target, and ADR-018 makes a semantic rewrite
   L3. "Still not found at the hearthstones" became another clause in the lead
   fact, behind an "important change" review.
3. **Nothing is hidden, so nothing can be found.** A World can hold private
   facts that Characters know, but nothing can move a fact into the open
   during play. Widening a fact's scope is L3 and has no play path. Searches can
   only fail, so Marta's answers go round in circles.

## W1. The scene knows the whole shared world

**Frozen rule touched:** the RE-2 authorized context (first fact only) and its
SQL copies. This is the same kind of change as PX-2b: an epoch gate, plus
application and SQL parity.

| | What it means | Cost |
|---|---|---|
| **A (recommended)** | Every generation context includes all ACTIVE SHARED facts, within the existing 48 KB context cap. A Character still adds only the private facts it knows. A fact change may target any SHARED fact in the context, not only the first. | Successor migration for context, manifest and evidence; app parity; tests. |
| B | Include only facts tied to the current location | A, plus tagging facts with places in Studio and state |
| C | Keep the first fact only | The world stays one sentence deep |

## W2. Small discoveries add a fact instead of rewriting one

**Frozen rule touched:** the closed impact table (ADR-018) gains one new
operation. ADR-018's L3 list is removal, supersession, semantic rewrite and
scope widening. Adding a new fact is none of these.

| | What it means | Cost |
|---|---|---|
| **A (recommended)** | New operation `ADD_FACT`: record one new SHARED fact ("The hearthstones are set fast in mortar"). It changes and removes nothing, so it is **L2**. Quick play applies it at once, and Undo works through Restore. It has the same disclosure and agency guards as other generated text, and at most one per Action. Rewriting or removing an existing fact stays L3. | New operation in domain, SQL validation, UI and events; tests. |
| B | Keep rewrites only | The lead fact keeps growing into a log |
| C | Make every fact rewrite L2 | Weakens ADR-018's protection of existing truth. Not recommended. |

## W3. Hidden truths the player can uncover

**Frozen rules touched:** fact scope (ADR-018 makes scope widening L3), what a
World response may know (PX-2b), and the disclosure guard.

| | What it means | Cost |
|---|---|---|
| **A (recommended)** | In Studio the author writes **secrets**: a hidden fact ("The ledger is sewn into the wool merchant's coat lining"), plus a short note on how it could be found ("searching the merchant's coat; persuading him"). A secret marked discoverable is pre-authorized by the author for reveal, as SA-2 pre-authorized movement. The model sees discoverable secrets in a sealed part of the context. It may reveal one only through the new `REVEAL_FACT` operation, which makes that secret SHARED, when the player's action meets the note. An author-authorized reveal is **L2**. Any other scope widening stays L3. The disclosure guard still blocks every secret not being revealed. A Character who knows a secret can reveal it the same way. | Successor ADR narrowing "scope widening is L3" to exclude author-authorized reveals; Studio field; context section; new operation; guard and SQL parity; tests. |
| B | Deterministic discovery: the author binds a secret to a place or object and a keyword, and the server reveals it without model judgment | Predictable but brittle; ordinary wording misses it |
| C | Secrets only through Characters' private knowledge (no World discovery) | Smaller; the World itself still holds nothing to find |
| D | Keep as is | Searches can only fail |

**Accepted risk under A:** the model judges when the note is met. It may reveal
too easily or too rarely. The reveal is recorded and Undo can reverse it.

## W4. Who decides what kind of outcome an Action has

**Frozen rule touched:** the explicit `requestedEffect` contract (RE-3 bridge).
Today the player picks the outcome type before sending. Under the default
"nothing changes", a search can never find anything.

| | What it means | Cost |
|---|---|---|
| **A (recommended)** | A new default, **"Let the story decide"**. The model may return a response with no change, or one **L2** operation the server allows here: `ADD_FACT`, `REVEAL_FACT`, a thread, or a routine relationship step or move. The server validates the type and level as today. L3 still happens only when the player explicitly picks "Change something in the world". The current explicit choices stay available. | New requested-effect value; validator branch; UI default; tests. |
| B | Keep the explicit choice; add a "Search or investigate" choice that allows `ADD_FACT` and `REVEAL_FACT` | Smaller; one more menu item to understand |
| C | Keep as is | Discovery needs the player to guess the right outcome type |

## Also included (no frozen rule touched)

- **Prompt version 9:** a World response may voice unnamed people already in
  the scene, such as the wool merchant. D1 A allowed this; the live prompt does
  not yet say so. They know only SHARED facts and do not persist.
- **The Lantern Inn sample gets a real answer:** one discoverable secret and
  a second shared fact. It is used for acceptance and live checks.

## Suggested order, if all A

1. **WD-1a:** W1 A and W2 A, plus prompt v9. The world sees all shared facts
   and records small findings as new L2 facts.
2. **WD-1b:** W3 A and W4 A, plus Studio secrets and the sample world. There is
   something to find, and the story can decide to reveal it.

Each part has its own contract, real-PostgreSQL CI and independent Review.
WD-1a is about the size of PX-2b; WD-1b is larger.

## Not changed by any option

- The player controls only themselves.
- Models never write the player's words, choices or commitments.
- L3 changes to existing truth need exact confirmation.
- History is append-only, and Restore is how things go back.
- No background evolution, and no new Characters created during play.

## What the owner is asked

1. W1: A, B or C?
2. W2: A, B or C?
3. W3: A, B, C or D?
4. W4: A, B or C?

## Decision

On 2026-09-27 the owner chose **W1 A, W2 A, W3 A and W4 A**, taking the
recommendation for each. First part: [WD-1a contract](WD-1A-SHARED-WORLD-CONTRACT.md).
