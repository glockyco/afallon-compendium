## Why

An adventurer's side column grew longer than its main column: an Adventurer card with eight abilities one to a line, a Combat card, a wrapped gear preference, and two guide links, while the header band held only Health. Native code also shows that the band's Health and the side's Strength, Movement Speed, and Spirit were not the adventurer's: an adventurer with a race and a class takes its stats from them at its current level (MobCombatEntity.GetCustomStats), not from its NPC record.

## What Changes

- An adventurer's band shows Class, linked to its page, Race, and Party role, with a link to the guide's roster.
- The Gear card opens with the adventurer's gear preference as a sentence. The side no longer repeats it.
- Where to find says, for an adventurer without a known location, at which level and after how much play it joins, and how to add and invite it, with the guide link that the side held.
- A Talents section in the main column names the class, the preferred tree, and the abilities that the adventurer learns first.
- Every NPC's Abilities move from the side into the main column.
- A roster adventurer publishes no record stats, so it shows no Health, Strength, Movement Speed, or Spirit.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detail-pages`: adventurer pages place their facts in the band, the Gear card, Where to find, and a Talents section, NPC abilities move to the main column, and adventurers show no record stats.

## Impact

`packages/publication` (`recordStats` in `adventurers.ts`, NPC documents, variant fields) and the site (`NpcPage`, `LocationsSection`, `AbilitiesSection`). The NPC schema is unchanged.
