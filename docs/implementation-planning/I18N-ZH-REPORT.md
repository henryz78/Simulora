# Chinese Interface Report

**Date:** 2026-10-03 · **Status:** `CLOSED`.

## What the owner asked

The owner asked for the interface to switch between Chinese and English automatically,
following the browser language.

## What changed

- **Language choice.** A browser whose first preferred language starts with `zh` gets
  Simplified Chinese; every other browser gets English. The language is read once at
  load, so a change takes effect on reload. There is no Traditional Chinese copy yet.
- **Mechanism.** `apps/web/src/i18n.ts` has one function, `t(text, values?)`. It looks the
  English copy up in `apps/web/src/i18n-zh.ts` (about 790 keys) and fills `{name}`
  placeholders. A missing key falls back to the English text.
- **Scope.** The change covers interface copy only. World content, Character names and
  model narrative keep their own language. Raw enum values, IDs, request bodies and
  idempotency keys are never translated. Displayed enum labels go through `labelMode`.
- **Terminology.** Restore is 回退, so it does not read the same as Recovery (恢复).
- **Server behaviour.** None changed: there is no API, domain, SQL or model change.

## Commits

| Commit | What |
|---|---|
| `863d423` | Chinese interface for Chinese browsers |
| `64a00fb` | Review fixes. The SA-2 refusal hint compares the raw English wire string again. The rest of the copy is wrapped, `t()` gained placeholders, and scope labels go through `labelMode`. |
| `9487173` | Restore is renamed 回退 throughout. The commit declares three English casing changes. |
| `c284c11` | The stack test expects the labelled scope ("Shared") |

### English text that changed

`9487173` declares three visible English changes, all accepted as intended:
- the export checkboxes are capitalised ("World", "Characters"…);
- consent status reads "Granted" / "Withdrawn" / "Not recorded" instead of the raw enum;
- the appeal notice reads "under review" instead of "under_review".

## Review

The Reviewer was Sonnet 5.5, with two rounds.

1. **First round: `PASS WITH ISSUES` (0B/3I/7M).**
   - **I-1:** the Chinese UI never showed the uninformed-Character hint, because the copy was compared with translated text.
   - **I-2:** some strings were unwrapped.
   - **I-3:** the model and the agency guard were English-only.
2. **Re-review: `PASS WITH ISSUES` (0B/0I/3M).** I-1 and I-2 were fixed, and a new zh-CN e2e covers the hint.
   - **M-1:** the undeclared English casing was declared in `9487173`.
   - **M-2:** the remaining Restore wording was fixed in `9487173`.
   - **M-3:** "Open" and "open" map to two Chinese words by context. This is intentional and accepted.

Items accepted from the first round:
- **I-3.** PX-4a D4 has since made the model answer in the player's language. The guard's
  Latin-name limits are listed as known limits in the
  [PX-4 contract](PX-4-WORLD-FREEDOM-CONTRACT.md).
- **M-2 (accessibility).** English World or model text inside a `lang="zh-CN"` page is
  not marked `lang="en"`.
- **M-4.** Some Chinese fragments read stiffly.

## Evidence

- The exact-SHA CI for `c284c11` is run `36504751629`, a success.
- The CI for `64a00fb` (`36503872658`) and `9487173` (`36504018368`) failed only on the
  stack test, which still expected "SHARED". `c284c11` fixed that test.

## Not claimed

The Chinese copy has not been reviewed by a native-speaking human for tone. There is no
language switch inside the app.
