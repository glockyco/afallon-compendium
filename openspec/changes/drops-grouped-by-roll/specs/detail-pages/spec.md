## ADDED Requirements

### Requirement: Creature pages show every roll of a kill

A creature page that a player can fight at a known level SHALL show one group per roll of a kill, in the game's order: each of its own loot lists, World Loot, and cloth for a creature type that drops it. Each row SHALL show its own group's chance per kill, so an item in two loot lists of one creature has each list's chance. World Loot and cloth SHALL show one named creature level, the level that the page's creature level control selects.

#### Scenario: A boss with three loot lists
- **WHEN** a reader opens Fangbloom, a level 27 Elemental boss
- **THEN** Drops shows Drop Group 1, Drop Group 2, and Drop Group 3, then World Loot at creature level 27
- **AND** World Loot says that 11.4% of kills give 1 or 2 of its 111 items and lists Bloodtrack Gloves among them
- **AND** no Cloth group appears

#### Scenario: An Undead creature
- **WHEN** a reader opens Rotbound Effigy, an Undead creature of levels 28 to 29, at creature level 28
- **THEN** a Cloth group follows World Loot and says that 75% of kills give 1 to 3 pieces of one of its cloths, with Silk Cloth at about 27.4% per kill

#### Scenario: A scaling creature
- **WHEN** a reader whose creature level is 27 opens a creature that scales with the player from level 15 to 30
- **THEN** the World Loot and Cloth groups show creature level 27 once the page has loaded the level
- **AND** the prerendered page shows them at creature level 15, the level that its groups name

#### Scenario: An item in two loot lists of one creature
- **WHEN** Staff of the Pyromancer is in two loot lists of Deathseer
- **THEN** each Drop Group shows the chance that its own list gives the staff

#### Scenario: A friendly NPC
- **WHEN** a reader opens a merchant whose every role is a friendly service
- **THEN** its page shows no Drops, World Loot, or Cloth groups

### Requirement: Item pages show World Loot by creature level

An item that World Loot can give SHALL have a World Loot section after Dropped by, separate from the creatures that drop the item from their own loot lists. The section SHALL state the creature levels that can give the item and SHALL list the item's chance per kill at each of them, merging only levels with equal chances. Dropped by SHALL list only creatures and SHALL count only creatures.

#### Scenario: A level-matched World Loot item
- **WHEN** a reader opens Bloodtrack Gloves
- **THEN** its World Loot section lists creature levels 21 to 29, with about 0.35% per kill at level 21 and about 0.21% at level 29
- **AND** the page has no Dropped by section

#### Scenario: An item that creatures and World Loot both give
- **WHEN** a reader opens Jade Band
- **THEN** Dropped by counts 13 creatures and states their shared loot-list rule once
- **AND** World Loot shows one row for every creature level with about 0.24% per kill

## MODIFIED Requirements

### Requirement: Sections explain their own values

Sections SHALL label probabilities, quantities, and conditions in plain language sufficient to interpret the shown values without another page. A short computed sentence MAY explain an entity-specific value; rule prose SHALL instead live in the relevant mechanics section linked by a quiet How it works action when that rule is published. Labels and explanatory hints SHALL work on hover, focus, and tap, but SHALL NOT contain copied rule text or require a hover card to understand a fact. Uncomputed creature entry rates SHALL carry the same Listed Rate explanation wherever displayed, along with a missing-input reason. A creature's loot-list roll per kill SHALL be described separately from the item's chance per kill. World Loot SHALL name its eligible creature levels and rank restriction, and a level-dependent chance SHALL name its chosen creature level. Object LootTable actions with complete recorded rolls SHALL show the per-open chance at a stated player level when applicable; otherwise they SHALL retain the listed rate with the missing input explained. Chest and gathering probabilities SHALL identify their per-open and per-use contexts.

#### Scenario: NPC drops
- **WHEN** an NPC's creature-specific loot-table binding has an authored rate of 5 and no active drop modifiers
- **THEN** its Drops group identifies the table's actual 6% baseline roll chance, separately from each item's chance per kill
- **AND** when a matching mechanics rule is published, a link explains the rule without a rules paragraph beneath the rows

#### Scenario: Several loot lists
- **WHEN** a creature drops items from separate loot lists
- **THEN** each list has a distinct labeled group with a plain sentence for the number of possible items, the list-roll rule and its item selection

#### Scenario: World loot with level and rank restrictions
- **WHEN** a world-loot item can drop from elite creatures of levels 21 to 29
- **THEN** its summary identifies the level range and elite-rank restriction as eligibility, and states the range of its chances per eligible kill at zero Loot Chance
- **AND** its World Loot section names the creature level of each chance

#### Scenario: Chest and gathering sources
- **WHEN** an item is obtained from a chest and from gathering
- **THEN** the displayed chest item chance is identified as per open and the gathering yield chance as per use

#### Scenario: Cloth from creatures
- **WHEN** the game gives Humanoid and Undead creatures a 75% cloth roll and the creature's level selects a cloth tier
- **THEN** the item summary and the Cloth Loot section show the cloth's chance per kill by creature level
- **AND** the level table explains that inside a range of levels the chance moves steadily from its first value to its last

#### Scenario: Footman's World Loot And World Object
- **WHEN** Footman's Bulwark appears in level-band World Loot table 142 at creature level 10, zero Loot Chance, and after the character's first gear drop
- **THEN** its baseline World Loot chance is approximately 0.121909% per eligible player-rewarded kill, after the preceding world table and shared item cap
- **AND** a qualifying level-10 LootTable object open gives it with approximately 2.459213% chance without the World Loot table gate

#### Scenario: Unknown object guarantee
- **WHEN** an object uses a table without a published minimum and its guarantee-one action flag is not captured
- **THEN** the object row keeps the Listed Rate and names that missing guarantee instead of claiming a per-open chance
