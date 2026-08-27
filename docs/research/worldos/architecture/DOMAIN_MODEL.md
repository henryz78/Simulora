# Observed Domain Model

Status: `PARTIAL / inferred only from black-box behavior`

```text
User
 ├─ owns World ──< WorldVersion
 │                 ├─ contains WorldCharacter config >── Character definition/reference
 │                 ├─ contains WorldApp config >──────── AppVersion
 │                 ├─ contains Map config >───────────── Region / Faction / adjacency
 │                 └─ initializes Simulation
 ├─ owns Character
 ├─ owns App ──────< AppVersion
 ├─ owns Collection ──< ordered World references
 └─ follows/saves User, World, Character, App

Simulation
 ├─ applied WorldVersion
 ├─ configuration Apps (may survive Turn rewind)
 ├─ one-time PlayerSetup identity (name / persona / avatar?)
 ├─ Turn timeline ──< PlayerAction / CharacterChat / MapAction / AppAction
 │                    ├─ Story segments
 │                    ├─ Event Delta operations
 │                    └─ timestamp / world-time label
 ├─ runtime state
 │   ├─ Wallet / Transactions
 │   ├─ Inventory / Equipment
 │   ├─ Stats / Progression
 │   ├─ CharacterRelationship / Chat
 │   ├─ Map Region State / current location
 │   ├─ Quest/Bounty state
 │   └─ World State
 ├─ Memory summaries
 └─ Snapshot/Checkpoint → independent Simulation URL
```

## Important boundaries

- Character definition and Character runtime relationship state are distinct.
- World/App configuration versioning is distinct from Turn state; this explains App preservation across rewind and App add/remove through WorldVersion apply.
- Map is both World creator configuration and a runtime App-backed state system.
- Event Delta is the observable synchronization contract across Apps; internal storage/API remains UNKNOWN.
- Remix produces independent owned objects/configuration copies; attribution differs by object type (World visible, Character absent in current sample).
- `PlayerSetup` is observably distinct from visible Memory and ordinary Turn events: an Account Persona/manual identity can be copied into exact runtime state at zero Turn/energy, remain usable by the model while Memory is empty, and become locked through normal Settings after commit. A current-state checkpoint copies value+lock, historical viewing overlays the current identity, and in-place Rewind preserves both through reload; the remaining unknown is prompt precedence against World `/new` identity fields, not snapshot ownership.

## Evidence

EVD-0020–EVD-0023, EVD-0030–EVD-0033, EVD-0042–EVD-0044, EVD-0232, EVD-0236, EVD-0249.
