# Creator Economy

Status: `PARTIAL`

Community leaderboards expose three separately typed economic measures:

- `创作者 · 累计收益`: energy with decimal precision (e.g. `17,180.6 电量`);
- `创作者 · 收到打赏`: energy shown as integers (e.g. `14,140 电量`);
- `WorldOS 支持者`: platform-support amount shown in real currency (current sample `10 美元`).

Details/rankings/supporters are visible on content, and Pricing supports sponsorship and rewards. These metrics should remain distinct in the domain model. Revenue calculation, rounding, payout, eligibility and withdrawal are not yet verified.

Public Profile adds a transactional gift surface: nine fixed energy tiers from 20 to 100,000, with a stated 70% credited directly to the creator. Selection updates the final CTA with the exact energy amount; no transfer occurs before `送出`. Profile also exposes a donor leaderboard, fractional `模拟分成` and separate integer `打赏收入（电量）`.

EVD-0210 closes one real settlement path. A 100-energy gift to `Xadia` debited `285→185`, showed `礼物已送出，感谢你支持创作者！`, and after reload changed recipient `打赏收入 700→770` plus donor count `1→2`; the new `x161880 · 100⚡` entry linked to the sender. The 70% copy therefore matches the tested ledger projection exactly.

EVD-0227 independently repeats settlement at the minimum tier and a different recipient. A `火花 20` gift to `World101` changed sender `175→155`, recipient `打赏收入 14,140→14,154`, `打赏榜 5→6`, and added linked donor row `x161880 · 20⚡`. This proves the advertised 70% projection is not unique to the earlier 100-tier/recipient sample and that the earlier repeat gate is not a global permanent gifting ban.

EVD-0230 adds a third successful ledger surface: a 20-energy World gift changed sender `140→120`, produced a World-level supporter total/count/row (`20`, one supporter, linked `x161880`) and credited the creator Profile `14` with the same linked donor. World and Profile gifting therefore share the advertised 70% projection in the tested samples.

The evidence also shows nonuniform gates. Two final 100-energy attempts on official App `main-input` failed with `礼物发送失败，请稍后重试。` and no debit/supporter record. A 20-energy gift on community App `微博` returned the same failure and left App/creator projections unchanged, but the sender was later observed `145→140` without another charged action (`-5`, cause unresolved). `微博` is owned by `World101`, whose Profile accepted the earlier minimum-tier gift, so creator-account eligibility is not the failing condition. A user-run second App failure followed by the successful World gift produced only the World gift's net `-20`, so App failure does not consistently debit five. A second Profile gift, including a lower 20 tier while 185 remained visible, opened `购买电量` instead of settling. Treat App-object eligibility, failed-attempt settlement and repeat-gift gating as distinct unresolved rules; do not infer simple insufficient balance, creator ineligibility or a global gift outage.

Evidence: EVD-0100, EVD-0101, EVD-0163, EVD-0210, EVD-0227, EVD-0229, EVD-0230.
