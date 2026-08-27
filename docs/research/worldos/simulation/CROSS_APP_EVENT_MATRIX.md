# Cross-App Event Matrix

研究状态：`PARTIAL`  
样本：Hogwarts Movie / `TEST Simulation 001`

| Trigger | Turn | Story | Wallet | Inventory | Character/Chat | World State | Memory | Extra App | Confidence |
|---|---:|---|---|---|---|---|---|---|---|
| 告诉赫敏“来自未来”秘密 | 1 | 记录遭质疑 | unchanged | unchanged | 赫敏参与 | unchanged | later summarized | n/a | TESTED |
| 购买魔杖 | 2 | 奥利凡德选杖剧情 | 50→43；-7 流水 | +紫衫木魔杖 | +奥利凡德陌生关系 | 魔杖=紫衫木魔杖 | later summarized | n/a | VERIFIED by history/checkpoint |
| 购买校袍 | 3 | 摩金夫人剧情 | 43→38；-5 流水 | +校袍 | 德拉科出现 | unchanged | later summarized | n/a | TESTED |
| 给赫敏发私聊 | 4 | 回信被整合为猫头鹰来信 | unchanged | unchanged | 赫敏回复并记得 Turn 1 秘密 | unchanged | later summarized | n/a | TESTED |
| 安装 Shop App | between 4/5 | no immediate story | no immediate wallet change | no immediate item | none | none | none | Dock +🛍️；下轮成本+2 | TESTED |
| 询价但不购买 | 5 | 丽痕书店给出价格 | stays 38 | unchanged | no direct chat | unchanged | later summarized | default Shop data not injected into story | TESTED |
| 清点/整理行李 | 8–10 | Story follows inventory | stays 38 | Turn 10 +备忘录 | none | none | first summary at T10 | Shop still installed | TESTED |
| 查看 Turn 2 历史状态 | read-only | switches to T2 | switches to 43 | switches to T2 | Chat switches to no Hermione response | switches | **T10 memory remains** | **Shop Dock remains** | TESTED |
| 恢复到安装前 Turn 3 | Rewind | switches/truncates | Credits not refunded | switches | switches | switches | snapshot restored | active Shop/+2 removed; ghost Dock until reload | VERIFIED |
| Map custom action: 青森港调查 | 3 | 跨海移动/战斗故事 | +50 | +黑篷船管事钥匙 | Chat unchanged | `p2.threat -6`, `Hokkai→Aomori` | not visibly changed | Bounty status updated | TESTED |
| Character Chat: 富冈义勇线索问答 | 4 | no visible Story delta in sample | unchanged | unchanged | Chat reply +新消息 | unchanged | unchanged | other Apps locked during generation | TESTED |
| Mobile Chat: 麦格教授入学准备 | 1 | opening Story page unchanged; next-action suggestions changed to include wand advice | unchanged | unchanged | Chat reply +新消息 | no visible delta | none | Events added cinematic scene + reply; energy 434→425 | VERIFIED |
| Shop purchase: Travel Rations (repeated) | 5/6 | purchase woven into narrative | each click -40 as two -20 records | each click adds separate 旅行干粮×2 stack | unchanged | unchanged | unchanged | each click stock -1 | VERIFIED |

## Cost propagation

- Deepseek base cost：8 Credits/Turn。
- 动态安装 1 个额外 App 后，UI 明示每个额外 App `+2 电量/回合`。
- Turn 5 前余额 662；完成 Turn 5 后 652。
- Turn 6–10 每回合继续消耗 10；Turn 10 后余额 602。
- 因此额外 App 成本是持续的 per-turn surcharge，而非一次性安装费。
- EVD-0204 adds the Rewind boundary: active Shop produced `303→293` at 10/Turn; restoring to its pre-install Turn removed the +2 price, a new Turn charged `293→285` at 8/Turn, and reload cleared the temporarily retained Shop Dock.

## Important behavioral distinctions

- App installation itself does not consume a Turn。
- Chat sending does consume a full global Turn; it may add only Chat/new-message state without a visible Story/Wallet/Map Delta, as shown by the 富冈义勇 sample。
- The same Chat Turn changed shared relationship state: 富冈义勇 is 6好感 / 12信赖 / `前辈 · 水柱`, while untouched characters remain at 5/5. Character State is therefore not just a static directory; it is an App-readable cross-Turn relationship model。
- Read-only historical view can switch runtime state without switching Memory/current client Dock projection. A real Rewind can invalidate a post-snapshot dynamic App while leaving its Dock stale until reload, so Dock presence alone is not authoritative for active installation or billing。
- Inventory item creation can be triggered by a narrative action without opening the installed Shop App。
- Clicking a Shop `购买` button consumes a full Turn and invokes the Turn engine, not an instant local transaction. Repeated twice: each click generated a Story purchase scene, decremented listing stock by one, created a separate Inventory stack `旅行干粮 ×2`, and charged 40 through two -20 ledger records although the card shows ¥20. This is stable observed behavior; whether the price label means per-unit rather than per-click remains semantically ambiguous。
- Default Shop App has preview catalogue in its detail page, but installing with no configured store did not make that catalogue appear as a usable runtime shop window in current evidence。
