## Why

Fourteen talents change only the stats of pets: nine Packwarden talents and Bonded Fury of the Hunter, and four Necromancy talents of the Necromancer that change skeleton summons. Their class page rows show empty Rank 1 and Rank 5 effects, because the publication drops pet stat changes. Pathfinding shows its own change but not the change to the beast. The tooltip coverage audit, which fails a complete publication when published tooltip data is missing, does not check talent ranks, so the empty rows passed every check.

51 talents in the catalog also show a flat number where the game's talent tooltip shows a percentage. The catalog applies the game's percentage rule to item and gear-set stats but not to talent stats.

## What Changes

- Record talent stat changes and pet stat changes as percentages when the change or its stat is a percentage. This is the rule that the catalog already applies to item stats.
- Publish the pet stat changes of each talent rank, grouped by the pets that they change. The groups name the pets as the game's talent tooltip does: "Your beast" for the Hunter's beast, the NPC whose summons change, or "Summons" for every pet.
- Add talent ranks to the tooltip coverage audit. A published rank that leaves out a stat change that the game shows is a publication issue, so a complete publication fails.
- **BREAKING** Bump the static class document schema identifier once for the new rank field.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `compendium-tooltips`: Talent stat changes follow the game's percentage rule, and the tooltip coverage audit checks talent ranks.
- `detail-pages`: Class page talent rows show pet stat changes.

## Impact

Catalog progression normalization and its contract types, class publication, the public class document contract, the tooltip coverage audit, and the talent effect cell of class pages.
