## Why

Afallon 0.16.3 (Steam build 25653798) is installed. The compendium still publishes build 25434619 (0.16.2.1), so it lacks the Hunter class, the Ranged weapon slot and its weapons, two new questing areas, and the reworked Adventurer's Supply Pack. The game's weapon tooltip also changed, and our item tooltips must follow it.

## What Changes

- Record the new database fields of 0.16.3: the weapon damage type, attack mode, and physical label of items; the world loot fields of loot tables; the ranged weapon damage flag of effects; and the adventurer world settings (roster, arrivals, equipment bands and rewards, kit upgrades). Raw schemas: canonical v5, relationships v2, support v4.
- Item tooltips show the weapon line the way the 0.16.3 game writes it, for example "13 - 22 Slashing Damage (Melee)", with attack speed and damage per second below.
- Re-verify every mechanics rule against the 0.16.3 binary and register a rules record for build 25653798. Revise the rules whose native code changed.
- Run the full update: v2 scans of every scene, map spaces and imagery, catalog, presentation, publication, and an update report that classifies each risk area of the 0.16.3 notes. Accept catalog and publication together.
- New content flows through the existing kinds: the Hunter class page and its talent trees, the Crossbows skill, the new quests, creatures, and items.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-property-presentation`: an item tooltip shows the 0.16.3 weapon damage line.

## Impact

- Scan probes `canonical.csx`, `relationships.csx`, `support.csx`; raw contracts; catalog normalization and tables; publication item documents; the site item tooltip.
- New reviewed inputs for build 25653798: scan plans, map-space profile, game-map and capture plans, coverage review, mechanics rules, presentation.
- Related changes in the same update: `speed-up-scans`, `show-tameable-creatures`, `show-adventurer-gear`, `show-item-use-effects`.
