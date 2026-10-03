## MODIFIED Requirements

### Requirement: Relation tables show only useful columns

A relation row SHALL show an icon or portrait, linked name with level/place subline when known, and at most two right-aligned comparable values: a quantity or count and one context value such as chance or price. It SHALL omit a repeated default or a value already established in the heading, without hiding a differing condition. A shared loot-list roll SHALL appear once in the section heading, separately from item odds. Text and number labels SHALL remain understandable without game-menu knowledge. An item drop SHALL show its computed Chance per Kill for a qualifying player-rewarded kill at zero Loot Chance, neutral loot bonuses, and no active drop modifiers when the full roll and eligibility are known. A level-dependent chance SHALL state the reference creature level. A small chance SHALL use an approximate one-in-N interpretation; other chances MAY use a percentage. If the full roll cannot be computed, the authored item entry rate SHALL be named Listed Rate, never Chance, and the missing input SHALL be explained. A World Loot table gate SHALL not be mistaken for an item's chance per kill.

For level-matched gear, the stated baseline also assumes that the character has already received a first gear drop, so the first-gear safety restriction does not remove otherwise eligible entries.

#### Scenario: Vendor stock without unlock requirements
- **WHEN** no vendor item has an unlock requirement
- **THEN** stock rows show no empty unlock field

#### Scenario: One loot roll for all rows
- **WHEN** all drop rows use a loot table that rolls on every kill for at most 3 items
- **THEN** the heading states the list-roll rule once and rows show their computed Chance per Kill when the full roll is known, without a duplicate list-roll value

#### Scenario: Table with one row
- **WHEN** an NPC sells one item
- **THEN** the row shows its item and price

#### Scenario: One location
- **WHEN** a creature has one location and its level and role are already shown above
- **THEN** the location row does not repeat them without a differing location-specific value

#### Scenario: Verified item probability
- **WHEN** a creature drop row has a computed 25% baseline per eligible kill
- **THEN** its context column reads Chance per Kill and shows 25% with a hint naming zero Luck and a qualifying kill
- **AND** the row does not show its authored Listed Rate

### Requirement: Relation tables merge only equivalent rows

Rows that have the same counterpart and the same values, and differ only in the role of the counterpart, SHALL merge into one row that names each role. Rows that differ in quantity, chance, price, conditions, or spots SHALL stay separate rows. A merged row SHALL count each map spot once. Creature drops from independent loot lists SHALL remain in separate labeled groups even when their list-roll rules and item rates are identical.

#### Scenario: Quest giver who also completes the quest
- **WHEN** one NPC both gives and completes a quest
- **THEN** the Quests section of that NPC has one row for the quest that names both roles

#### Scenario: Containers under different conditions
- **WHEN** three backpacks at one place give the same quantity of an item under three different conditions
- **THEN** the item's Found in containers section shows three rows, one for each condition

#### Scenario: Separate creature loot lists with matching rules
- **WHEN** two creature loot lists have the same roll chance, item count and item rate
- **THEN** the creature page retains two separate drop groups so each group's item count is accurate

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
- **THEN** its summary identifies the level range and elite-rank restriction as eligibility, and states the level and zero Loot Chance used for any computed chance per eligible kill

#### Scenario: Chest and gathering sources
- **WHEN** an item is obtained from a chest and from gathering
- **THEN** the displayed chest item chance is identified as per open and the gathering yield chance as per use

#### Scenario: Cloth from creatures
- **WHEN** the game sets a base cloth roll rate before loot bonuses and the creature's level selects a cloth tier
- **THEN** the item summary and the Cloth Loot section name the base rate instead of claiming a verified chance per kill
- **AND** the level table explains that its rates are before loot bonuses

#### Scenario: Footman's World Loot And World Object
- **WHEN** Footman's Bulwark appears in level-band World Loot table 142 at creature level 10, zero Loot Chance, and after the character's first gear drop
- **THEN** its baseline World Loot chance is approximately 0.121909% per eligible player-rewarded kill, after the preceding world table and shared item cap
- **AND** a qualifying level-10 LootTable object open gives it with approximately 2.459213% chance without the World Loot table gate

#### Scenario: Unknown object guarantee
- **WHEN** an object uses a table without a published minimum and its guarantee-one action flag is not captured
- **THEN** the object row keeps the Listed Rate and names that missing guarantee instead of claiming a per-open chance
