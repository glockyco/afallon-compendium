## Why

The side card of a class page stays in view beside the talent trees, but it only repeated how the class earns talent points, which is the same for every class. A player who plans a build needs to compare those points with what each tree takes to learn in full. The gear link also opened every item that the class can use, including potions and materials, although it promises gear.

## What Changes

- Each talent tree publishes how many of its points learning every rank of every node takes. Ranking up spends the next rank's own cost from the tree's points (`AbilityManager.RankUpAbility`, `BonusManager.RankUpBonus`), and an ability that the class knows from the start already holds its first rank (`CharacterUpdater.AddAbility`).
- The side card shows how the class earns talent points, each tree with its full cost and a link to its tab, the weapon types, and a gear link.
- The gear link selects the class and the Weapon and Armor item types, so it opens only gear.
- The class document schema moves to `compendium.static-class.v7`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detail-pages`: class pages show tree costs beside the trees and link to gear only.

## Impact

`packages/contracts` (talent tree `cost`), `packages/publication/src/documents/classes.ts`, and `apps/site/src/lib/detail/pages/ClassPage.svelte`. No catalog change.
