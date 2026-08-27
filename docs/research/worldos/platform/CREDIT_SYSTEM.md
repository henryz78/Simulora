# Credit / Zap System

Status: `PARTIAL / TESTED`

Credits are account-level AI usage currency. Turn cost depends on model and extra Apps; dynamic extra App was +2/Turn in one sample. Credits are not restored by Rewind. They can be bought in one-time packs/subscriptions, earned through rewards/share tasks, and spent on avatar generation or save-slot expansion. No real payment was made.

## Verified transaction boundaries

- Dynamic Shop installation changed Deepseek from 8 to 10 energy per Turn; Rewind to before installation removed the active surcharge, did not refund the already charged Turn and left only a temporary ghost Dock until reload (EVD-0204).
- Two consecutive Hogwarts save-slot expansions each cost exactly 80: capacity/purchased count changed `6（已购 3）→7（已购 4）→8（已购 5）`, balances changed `185→105→25`, and each purchase immediately created a new Simulation UUID (EVD-0211).
- A Profile gift of 100 debited the sender 100 and credited the creator-visible `打赏收入` by 70; the donor leaderboard added the sender. The tested repeat gift instead opened the purchase wall without debit, and an official-App gift failed with a toast/error (EVD-0210).
- A later 20 gift to a different creator repeated the exact 70% ledger rule: sender `175→155`, recipient income `14,140→14,154`, donor count `5→6`, and a linked `x161880 · 20⚡` row. This excludes a global permanent one-gift-per-account gate but does not explain same-recipient repeats (EVD-0227).
- A 20 gift on community App `微博` failed with unchanged recipient/App projections, yet the next observed sender balance was `145→140`; with no intervening charged action this is a `-5` defect candidate, not a proven fee. A later user-run second App failure plus a successful 20 World gift produced aggregate `140→120`; the World and creator projections independently recorded sent `20` / income `14`, so the second App failure had no observable net debit and the World gift retained the 70% rule (EVD-0229–0230).

## Insufficient-balance gate

With Deepseek at 8/Turn, balances progressed `25→17→9→1`. At 1, the composer still accepted and fully committed another Turn, leaving `-7` after reload. Only the next submission was blocked by `电量用完了`; it created no Turn and did not persist the attempted action. After a test-quota adjustment to 143, the same Turn-4 save reopened normally. The observed gate therefore checks an already exhausted balance rather than price sufficiency before a Turn (EVD-0212). This is a billing-boundary defect candidate, not a basis for inferring backend implementation.

Remaining: paid checkout completion is intentionally untested; maximum save-slot capacity, same-recipient repeat-gift/App eligibility, failed-App partial debit/refund cause, fractional rounding, refunds, concurrent Turn charging and successful BYOK zero-energy billing remain `UNKNOWN`.
