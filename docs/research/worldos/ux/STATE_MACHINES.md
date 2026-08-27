# Observed State Machines

Status: `PARTIAL / evidence-backed`

## World

```text
Created/Remixed (public v1)
  ├─ edit → Draft changes (owner only, autosaved)
  │   ├─ discard → latest Published
  │   └─ publish changelog → Published vN+1
  ├─ visibility: Public | Unlisted(member) | Private(member)
  ├─ remix permission: Allow | Disallow (owner may still remix)
  └─ native delete confirmation → Deleted World/runtime
      ├─ detail/edit/new/Search/Works/Profile removed
      ├─ child Simulation runtime → 404
      └─ child History metadata may survive, remain renameable, and point to dead UUID
```

Existing Simulations remain bound to their applied WorldVersion and receive a latest-version prompt. Decline suppresses that target version; a later version re-prompts. Apply can merge App additions/removals without resetting Turn/Story.

## App

```text
New Creator
  → Draft/configured owner-only v1 (`未公开`)
  → first Publish (no modal) → public v1
  → edit + "存草稿" on published App
  → Published v2/v3 (observed label/behavior mismatch)
  → install into World Draft
  → World publish
  → Simulation runtime
  → World uninstall Draft
  → World publish/apply update
  → removed from Simulation
```

App detail delete: checking usage → zero-use irreversible confirmation or used-in-World cascade warning → final Delete → App 404 + owner World cleanup Draft. A distinct Downlist/Unpublish state has not been found and remains `UNKNOWN`.

## Character

```text
Create form → Public owned Character → Edit
  ├─ Chat / add to World
  ├─ Remix → library copy L1 → Remix → L2
  └─ native delete confirmation → source removed; World-local and L1/L2 copies survive, source Chat 404
```

Private visibility is member-gated. Remixed library copies may lack visible edit/delete and source attribution in current samples.

## Simulation

```text
Initialize → Running Turn N
  → action accepted
  → Generating (global inputs/Apps locked)
  → Turn N+1 + Story/Chat/Event Delta
  ├─ checkpoint/save (independent Simulation URL)
  ├─ read historical Turn (read-only mixed snapshot)
  ├─ rewind → selected Turn state → continue new branch
  └─ World version prompt → decline | apply merge
```

## Evidence

EVD-0020, EVD-0022, EVD-0029, EVD-0031, EVD-0032, EVD-0033, EVD-0042, EVD-0043, EVD-0111–0113, EVD-0123–0129, EVD-0144–0146, EVD-0221.
