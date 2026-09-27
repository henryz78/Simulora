# Front-end Design Proposal

**Status:** proposal only · Task 4  
**Date:** 2026-09-26  
**Scope:** a bounded front-end direction for a later PX-3 implementation track

## 1. Design intent

Simulora should read as a place that can be returned to, not as a status console. At every point the interface should answer: “Where am I in this world, and what can I do next?”

The two viewpoints remain visible without merging authority:

- **Director / creator:** shape a Draft and future playable Revisions in Studio.
- **Player / participant:** enter one pinned Continuity and control only their own Action.

The Health Check and closed PX-1/PX-2a work identify the first experience wins: reduce the visual weight of two choices before every Action; remove Branch, Commit, Provisional and L3 from the first reading order; show honest feedback during a roughly 20-second generation; keep the latest reply and Story so far visible; make returning to a Continuity first-class; and show a WORLD response clearly when no Character is addressed.

The interface supports English and Simplified Chinese from the same client-side
presentation layer. A visible language control is available in the bottom dock;
it changes labels, navigation and helper copy without changing routes, payloads,
facts or authority. World-authored content and generated narrative keep their
stored language; this proposal does not add automatic translation to the runtime.

This is an interface proposal. It does not broaden the current one-fact or one-Character runtime ceiling.

## 2. Information architecture

### 2.1 Destinations

| Destination | User question | Existing route | Proposed role |
| --- | --- | --- | --- |
| **Library** | What can I return to? | / | Owned Worlds and active Continuities. |
| **Studio** | What am I shaping? | /worlds/new, /worlds/:worldId/studio | Draft and Revision authoring. |
| **Play** | What is happening now? | /continuities/:continuityId | Primary playable surface. |
| **Return** | What did I miss? | /continuities/:continuityId/return | Committed-source briefing before acting. |
| **Continuity** | What is the durable path? | /continuities/:continuityId/continuity | Turns, threads, facts and relationships. |
| **Recovery** | How do I safely inspect or restore? | /continuities/:continuityId/recovery | Recovery points and Restore review. |
| **Context** | What may this world know? | /continuities/:continuityId/context | Read-only context boundary. |

The route map stays unchanged in PX-3. Only hierarchy, copy and presentation change.

### 2.2 Library

Replace the current hero followed by disconnected cards with three zones:

1. **Continue** — the most recent eligible Continuity, its World title, a current-situation excerpt and one **Continue playing** action.
2. **Your Worlds** — owned Worlds, each with **Open Studio** and, when present, **Continue**.
3. **Create** — one quiet **Start a new World** entry that explains the three required playable-core fields.

Keep the privacy boundary and owner-scoped library behavior. Empty states explain the next action without inventing a saved World. Do not show implementation phase labels or provider state. Keep existing names **Continue playing**, **Your worlds** and **Open World Studio** where possible.

### 2.3 Studio

Studio is a creation workspace, not a dashboard. Make the existing Draft → save → playability check → playable Revision sequence visible as a small explanatory rail:

Draft → Check → Playable Revision → Start a Continuity

This is not a new state machine; server gates remain authoritative. Optional depth stays collapsed until the playable core is complete. Keep the read-only first-scene preview and explicit **Restore unsent edits** recovery.

### 2.4 Play shell

A Continuity shell contains the World title, **Current path** label and the
pending-Action notice. **Library**, **Studio**, **Play** and **Return** live in a
floating bottom dock shared by every page, with the English / 中文 switch in the
same dock. Contextual links (**World**, **Continuity**, **Context**, **Recovery**)
remain inside the Play surface as ordinary wrapped links; they do not create a
second scrolling navigation strip. Recovery remains available from the
current-state summary and Continuity view.

Desktop uses an 8/4 split: situation, composer, latest outcome and Story so far in the main column; current-state summary, open threads, relationships and Recovery in the side column. At 390×844 it becomes one ordered column: situation, composer, latest outcome or pending review, Story so far, summary, threads/relationships, Recovery.

The bottom dock is fixed above the safe-area inset, has a readable label for
every destination, and never covers the composer, confirmation or Restore
review. It uses a two-row layout at 390×844 instead of a horizontal carousel;
there are no auxiliary navigation scrollbars.

## 3. Play loop

### 3.1 Desktop

1. **Orient:** title, current situation and a short committed-source change line.
2. **Declare one Action:** **What do you do?** and the text area are dominant.
3. **Target only when useful:** the first option is **Let the world respond**; Character selection is **Address someone (optional)**.
4. **Shape only when needed:** preserve the explicit requestedEffect contract and NO_WORLD_EFFECT default inside **Shape this turn (optional)**. Use player copy: **Just talk or look — nothing changes**, **Change something in the world**, **Have this Character move**, **Change a relationship**, **Start a story thread**, and existing open-thread choices.
5. **Submit:** retain **Send Action** unless the owner later approves copy changes.
6. **Wait honestly:** keep the declared Action visible and show one status region with non-claiming text such as “Preparing the current World context…”, “Writing a response…” and “Checking whether a World change is proposed…”. These messages never claim a Commit.
7. **Read the outcome:** lead with response text, then say response only, Quick play applied, confirmation required, cancelled or retryable failure. Keep **Character response** or **World response** attribution visible.
8. **Confirm or undo:** L3 keeps exact confirmation. L2 Quick play keeps the existing current-head Undo path and explanation.
9. **Continue:** Story so far includes response-only and no-effect turns. Pending Actions remain above the composer and block ordinary Actions as today.

### 3.2 390×844

- Use one column with a 16px side inset; keep situation and composer near the top.
- Use native select or disclosure controls. Summarize the selected Character and outcome above the textarea while the keyboard is open.
- Keep **Send Action** in normal flow; the floating dock stays below the safe-area inset and never covers the keyboard, composer, confirmation or Restore review.
- Keep the Action and status region in place during generation; do not jump to page top.
- Put latest outcome before Story so far. Wrap long generated text without horizontal scrolling.
- Use labelled, keyboard-reachable wrapped contextual links with **World** and **Return** first. The fixed bottom dock exposes **Library**, **Studio**, **Play**, **Return** and the language switch without a horizontal carousel. Recovery must remain discoverable.
- Put summary and relationships below the story; use native details for long secondary lists.
- Make primary and destructive actions full width and at least 44px high.

### 3.3 Return and Recovery

Return begins with current situation and World clock, then committed recent changes, open threads and relationships, followed by **Continue in world**. Stale or unavailable projections keep the conservative authoritative fallback and never fill gaps from client state.

Recovery starts with the existing boundary statement: it inspects the current Continuity and does not silently rewrite history or a future Revision. Recovery points are a list; Restore is a review showing section-level differences before existing confirmation. No “repair” action sits beside ordinary play.

## 4. Visual direction

This is exploratory; brand, logo and final typefaces remain open under the G10 external decision packet.

### “Ink, paper, and ember”

- Warm paper (#F3EEE5) and ink (#182026) form the reading surface.
- Slate blue (#465C70) carries navigation and calm metadata.
- Muted ember (#B65A43) is reserved for primary action, pending state and destructive confirmation.
- Moss (#5D7D68) indicates freshness only with a text label.
- Use an editorial serif for World titles and a humanist sans for controls and body text; IDs and hashes belong in a disclosure or metadata row.
- Use an 8px spacing scale, 16px mobile inset, 24px desktop card padding and 44px controls.
- Use quiet borders, modest radius and no gradients. Motion is a short result-entry transition with no automatic focus movement; reduced motion disables it. The bottom dock has a light elevation and respects `env(safe-area-inset-bottom)`.

This direction gives the World a readable page and controls a restrained workspace. It does not copy WorldOS layout, naming, icons or visual expression.

## 5. Frozen semantics and decisions

| Proposal item | Semantic boundary | PX-3 treatment |
| --- | --- | --- |
| Library grouping, Studio rail and copy | None | Presentation-only. |
| Disclosure for target/outcome choices | Preserve exact requestedEffect and target values | Presentation-only; keep explicit defaults. |
| WORLD response label with no Character | Response source and agency rules | PX-2b presents its result; no new model or validator work. |
| Generation status messages | Must not claim Commit or fabricate backend progress | Presentation-only. |
| Latest outcome and Story so far | Existing Action/history data | Presentation-only. |
| English / 简体中文 switch | Client-side labels and helper copy only | Presentation-only; stored World text keeps its authored language. |
| Floating bottom dock | Route presentation only | Presentation-only; keep existing route and accessible-name contracts. |
| Removing auxiliary scrollbars | Layout and responsive presentation | Presentation-only; wrap links or use a two-row dock, never hide required content. |
| Quick play and Undo | Exact confirmation, Restore and current-head checks | Present existing affordances only. |
| Return fallback | Authoritative state and projection freshness | Preserve conservative fallback. |
| Director/Player mode switch | Authority and participation | Do not implement; successor ADR and owner decision required. |
| Background evolution, auto-commit or new Characters | Participation, authority and identity | Do not implement; separate contract required. |
| Silent fact rewrite for no-effect response | Commit and effect semantics | Do not implement. |

Recommended PX-3 scope is presentation-only. If a proposed copy or mode requires changing a validator, payload, endpoint, database value or confirmation rule, stop and write the successor contract first.

## 6. Accessibility and browser-test impact

### 6.1 Accessibility acceptance

- One main landmark, one page h1 and ordered headings per route.
- A skip link targets main-content.
- Every control has a visible label or equivalent accessible name.
- Pending, generation and error regions use status or alert semantics with appropriate timing.
- Focus moves only on submit or review open; completed generation does not steal focus.
- Keyboard users can reach disclosure, selects, confirmation, Undo, Restore review and navigation.
- Controls are at least 44×44px; existing axe contrast checks continue to pass.
- Titles, thread names and generated text wrap at 320px without horizontal overflow.
- The bottom dock is reachable in English and Chinese, has visible focus, and remains above the mobile safe-area inset.
- No required navigation or action depends on a hidden or auxiliary scrollbar.
- Reduced motion disables nonessential transitions.
- State never relies on colour, icon shape or position alone.

### 6.2 Browser-test impact

Preserve stable accessible names where possible: **Continue playing**, **Your worlds**, **Open World Studio**, **What do you do?**, **Send Action**, **Let the world respond**, **Story so far**, **Return**, **Continuity**, **Context**, **Recovery**, **Undo** and **Restore**. Helper copy must not be the only locator. If copy changes, update later PX-3 assertions by accessible name rather than DOM position or CSS class.

PX-3 should add focused browser checks for:

1. Home → Continue playing → Play.
2. Home → Open World Studio → create/save/check/play.
3. Desktop and 390×844 no-Character Action with World response attribution.
4. Desktop and 390×844 Character-selected response.
5. Accessible generation status while the declared Action remains visible.
6. L3 confirmation, L2 Quick play, Undo and stale-Undo refusal.
7. Story so far retaining a confirmed reply after reload.
8. Return fresh projection and conservative fallback.
9. Recovery review and Restore confirmation.
10. English and Simplified Chinese labels remain accessible at desktop and 390×844.
11. No horizontal overflow or auxiliary navigation scrollbar at 320px and no focus loss after outcome rendering.

Use the existing real-PostgreSQL and axe-backed evidence model. A visual pass alone does not prove frozen behavior.

## 7. Options and recommendation

### Option A — Recommended: focused presentation pass

Keep routes, payloads and semantics unchanged. Reframe Library, Studio, Play, Return and Recovery; progressively disclose secondary choices; add honest wait feedback; and preserve accessible names and browser contracts.

- **Benefit:** addresses the Health Check presentation findings with the smallest bounded track.
- **Cost:** the single-fact runtime and provider latency remain; this does not make the World deeper.
- **Decision:** owner selects this direction and the visual direction before PX-3.

### Option B — Split Director and Player workspaces now

Add a persistent role switch and separate navigation trees. This better separates viewpoints but changes authority framing and session state. Defer until a successor ADR defines Director authority inside a running Continuity.

### Option C — Conversation-first Play

Hide target and outcome controls and rely on model interpretation and server defaults. This obscures requestedEffect and confirmation boundaries and risks the agency confusion found in the Health Check. Reject for PX-3; keep controls available after the declared Action.

## 8. PX-3 handoff boundary

PX-3 should start only after an owner decision on Option A and the visual direction. Its contract should list exact route surfaces, copy changes and unchanged payload fields. It should then implement the presentation in apps/web, prove desktop and 390×844 behavior with existing browser and axe suites, run the required real-PostgreSQL suites, and obtain an independent Review on the exact behavior SHA. Any successor ADR remains separate from the presentation commit.

Until that contract exists, this proposal is the complete deliverable and does not authorize PX-3 implementation.
