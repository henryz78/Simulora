# Achievement System

Status: `VERIFIED core / PARTIAL peripheral`

Primary route: `/zh-cn/apps/achievements`  
Primary evidence: `EVD-0246`, `EVD-0247`, `EVD-0248`

## Product role

Achievement is an official WorldOS App (`核心`, `成长`) that attaches a creator-defined achievement schema to a World. It is not merely a generic iframe: configuration participates in World Draft/versioning, AI generation can emit structured unlock Events, and unlock ownership projects into both Simulation and World detail.

## Creator schema and controls

Installing the App first selects an owned World, then opens an instance-configuration surface. A definition contains:

- icon;
- name;
- rarity: Copper / Silver / Gold;
- player-visible description;
- AI-only unlock condition;
- Hidden toggle with pre-unlock `???` behavior;
- per-row delete control.

The surface also exposes Add achievement, optional App display name, custom instruction, operation reminder, guide copy, theme, opacity and background image. Hidden runtime metadata is not a security boundary: Creator warns that World configuration is publicly readable.

Installation writes the target World Draft and requires a later World publish. An existing Simulation adopts the published App through the ordinary World-version update flow without consuming a Turn or energy.

## Runtime presentation

Before unlock, the tested Simulation and World detail both showed the visible achievement and only a count/placeholder for the hidden one. Hidden name, rarity and description were absent. The World modal exposes `全部 / 已解锁`, progress ratio/percentage and per-item state.

A real trigger Turn can emit multiple `打开成就` Event controls. In EVD-0246, two grants were persisted in one Turn. The already-open Dock stayed stale at `0/2` until full reload; after reload it became `2/2` and revealed the hidden Gold item. World detail showed `2/2 · 100%` and an unlock date.

## State ownership

Observed model:

```text
World version contains achievement definitions
            ↓
charged Simulation Turn emits grant Events
            ↓
Account × World unlock ledger
       ↙                 ↘
current/fresh saves      World detail
```

A fresh independent Simulation of the same World inherited `2/2` before any trigger in that save. Therefore unlocks are not per-Simulation.

Historical viewing is snapshot-sensitive: selecting the pre-grant Turn displayed `0/2`. Real Restore to that Turn removed the granting action, Story and grant Events, but current Simulation, fresh Simulation and World detail remained `2/2`. Unlock ownership is monotonic and outside the rewindable Turn snapshot, even though its historical rendering can follow the viewed snapshot.

Re-triggering the exact same condition after both items were already unlocked consumed a normal 9-energy Turn but kept the account/World projection at exactly `2/2` after reload. No duplicate row, overflow count or new visible unlock toast appeared. The Turn still retained one generic `打开成就` Event rather than the original two-grant Turn's two markers. Therefore achievement ownership/counting is idempotent in this sample, while duplicate-condition event emission is not fully suppressed and cannot yet be mapped to a specific definition.

## Definition and App lifecycle

EVD-0248 establishes that current configuration, upgraded-save schema and unlock ownership are distinct layers:

```text
latest World achievement definitions
        ├─ World detail: current definitions + previously unlocked tombstones
        ├─ fresh save: latest literal definitions + matching ID unlocks
        └─ updated save: preserve prior definition snapshots + merge target definitions

Account × World unlock ledger (monotonic, definition-ID keyed)
        └─ survives definition removal, App uninstall/reinstall and Rewind
```

Deleting one unlocked definition and publishing v6 left World detail and upgraded saves at historical `2/2`, while a native-v6 save contained only the remaining current definition as `1/1`. Uninstalling the App and publishing v7 removed World/detail/runtime surfaces only for saves that accepted the update; a declined v6 save kept `2/2`. Reinstalling v8 created a blank zero-row instance rather than restoring old configuration. World detail still projected the historical unlocked pair, but upgraded runtime hid the empty App rather than displaying `0/0`.

Recreating the old name/description/condition in v9 produced a distinct locked definition and World `2/3`; repeating the old token emitted one generic Event but did not unlock it. Renaming that current row and changing it to a unique v10 token made World detail replace the current locked row, but updating the v9 source accumulated both locked versions and changed runtime `2/3→2/4`. The unique-token Turn committed the new World unlock (`3/3`) and the source reconciled after reload to `3/4`, with the retired v9 row still locked. A native-v10 save contained only the active definition as inherited `1/1`.

Thus UI-visible names and conditions are not achievement identity. Version migration is not destructive replacement inside an existing save, and a generic achievement Event alone is insufficient evidence of a successful grant. The first v10 publish attempt also exposed optimistic concurrency protection (`World changed; refresh before publishing`); refreshing restored the Draft and a clean retry succeeded.

## Profile distinction

The official App copy says unlocked achievements enter the personal Profile, but the owner Profile showed no ordinary achievement section after the verified custom grants. Another user's Profile has a distinct scored World-completion `成就陈列` with final score, completed Turns and AI evaluation. Current evidence must keep these two achievement concepts separate.

## UNKNOWN experiments

- concurrent/simultaneous grant ordering;
- delete/unpublish the World after unlock;
- determine whether ordinary custom achievements ever enter Profile after a delay or qualification;
- inspect ordinary custom achievement visibility to another logged-in user;
- validate row limits, reordering, required-field errors and the exact payload/target behind generic `打开成就` Events.
