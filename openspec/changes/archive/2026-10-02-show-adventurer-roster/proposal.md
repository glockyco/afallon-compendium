## Why

The catalog knows a lot about the adventurers of the world roster that the site did not show: each adventurer's class and race, the party role that the Dungeon Finder gives them, the talent tree where they spend points first and the abilities they learn first, the level at which a save starts them, and the hours of play after which they join. An adventurer's page also listed the phase abilities of its NPC record as its abilities, but native code shows that a roster adventurer fights with the abilities it learns from its class instead. Eldeth Goldvein, a Druid tank, showed Bleeding Strike, Brutal Slice, and Toxic Fang.

## What Changes

- An adventurer's page shows an Adventurer card: class, race, party role, preferred talent tree linked to its tree on the class page, the abilities it learns first, starting level, and when it joins, with a link to the guide's roster.
- An NPC that fights with its class abilities shows no phase abilities, and ability pages no longer name it among the NPCs that use an ability.
- The Adventurers guide gets a Roster section after Dungeon Finder parties: verified rules on joining, levels, roles, talents, and stats, and a table of every adventurer with one tab for each party role.
- The NPC list gets Class and Party role filters for adventurers.
- Rules record 23 adds the roster rules from new native evidence, and catalog plan 32 uses it. The catalog query returns the roster's arrivals. The NPC schema moves to `compendium.static-npc.v11` and the mechanics schema to `compendium.static-mechanics.v15`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detail-pages`: adventurer pages show what the game sets up for the adventurer and drop phase abilities that it does not use.
- `mechanics-pages`: the Adventurers guide has a roster.
- `list-filters`: the NPC list filters adventurers by class and party role.

## Impact

`packages/catalog` (arrivals query), `packages/contracts` (adventurer facts, schemas), `packages/publication` (`adventurers.ts`, NPC and ability documents, guide, lists, registry), the site (`NpcPage`, `GuidePage`, `AdventurerRoster`, `EntityLink` reads the current page), rules record 23, and catalog plan 32.
