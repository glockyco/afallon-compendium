## Why

Gathering odds depend on the reader's skill level and attunements, but pages showed them only at level 1 and at the skill cap, and the guide's spawner examples listed raw weights. A reader had to compute their own chance by hand, and the attunements named effects such as Silver Attunement without saying where they come from.

## What Changes

- The site remembers the levels that a reader sets, their character level and their level in each skill, across pages and visits. Every value computed from one of these levels shows the control that changes it.
- The Crafting and Gathering guide's spawner examples show each node's weight and chance at the chosen skill level, with checkboxes for the attunements that favour their nodes.
- A gathering node page shows the chance that a spawner picks it at the reader's level, with its attunements, and Spawn odds shows every option of its spawners at that level. The extra-item chance shows the value at the reader's level as well as at the published levels.
- Each attunement names the item that gives it, how long it lasts, and its bonus. Rules record 21 links the item first in each attunement rule, and the publication takes the effect's name and duration from the item's effect action.
- One formula, `spawnerChances` in the contracts package, computes weights and chances for the publication and the site. Spawner options no longer publish precomputed shares, and a spawner group publishes whether its odds are verified, which needs verified rules and a complete option list.
- The gathering node schema moves to `compendium.static-gathering-node.v6` and the mechanics schema to `compendium.static-mechanics.v14`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detail-pages`: pages compute values at the reader's remembered levels, and gathering node pages show odds at the reader's level.
- `crafting-and-gathering`: the guide's spawner examples are interactive and attunements name their items.

## Impact

`packages/contracts` (`spawner-weights.ts`, attunement and spawner schemas), `packages/publication` (`attunements.ts`, `gathering.ts`, `mechanics.ts`), and the site (`reader-levels.ts`, `ReaderLevel`, `SpawnerOdds`, `AttunementToggles`, `gathering-odds.ts`, the guide and node pages). Catalog 30 carries rules record 21.
