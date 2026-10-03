## MODIFIED Requirements

### Requirement: Relation tables show only useful columns

A relation row SHALL show an icon or portrait, linked name with level/place subline when known, and at most two right-aligned comparable values: a quantity or count and one context value such as chance or price. It SHALL omit a repeated default or a value already established in the heading, without hiding a differing condition. A shared loot roll SHALL appear once in the section heading. Text and number labels SHALL remain understandable without game-menu knowledge. A creature drop's authored item entry rate SHALL be named Listed Rate, never Chance, unless a verified per-kill probability is published for that row. The per-kill probability SHALL replace the Listed Rate column and show both its percentage and an approximate one-in-N interpretation when available. An absent per-kill probability SHALL NOT be inferred from an item rate or a list-roll rate.

#### Scenario: Vendor stock without unlock requirements
- **WHEN** no vendor item has an unlock requirement
- **THEN** stock rows show no empty unlock field

#### Scenario: One loot roll for all rows
- **WHEN** all drop rows use a loot table that rolls on every kill for at most 3 items
- **THEN** the heading states this rule once and rows show their Listed Rate without a duplicate loot-roll value

#### Scenario: Table with one row
- **WHEN** an NPC sells one item
- **THEN** the row shows its item and price

#### Scenario: One location
- **WHEN** a creature has one location and its level and role are already shown above
- **THEN** the location row does not repeat them without a differing location-specific value

#### Scenario: Verified item probability
- **WHEN** a creature drop row has a verified 25% probability per kill
- **THEN** its context column reads Chance per Kill and shows 25% with About 1 in 4 kills
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

Sections SHALL label probabilities, quantities, and conditions in plain language sufficient to interpret the shown values without another page. A short computed sentence MAY explain an entity-specific value; rule prose SHALL instead live in the relevant mechanics section linked by a quiet How it works action when that rule is published. Labels and explanatory hints SHALL work on hover, focus, and tap, but SHALL NOT contain copied rule text or require a hover card to understand a fact. Unverified creature and world-loot item rates SHALL carry the same Listed Rate explanation wherever displayed. A creature's loot-list roll per kill SHALL be described separately from an item's Listed Rate. A world-loot source SHALL name both its eligible creature levels and any creature rank restriction. A container item probability SHALL identify its per-open context and a gathering yield probability its per-use context.

#### Scenario: NPC drops
- **WHEN** an NPC's loot table rolls on 5% of kills
- **THEN** its Drops heading identifies the table's roll chance, separately from each item's Listed Rate
- **AND** when a matching mechanics rule is published, a link explains the rule without a rules paragraph beneath the rows

#### Scenario: Several loot lists
- **WHEN** a creature drops items from separate loot lists
- **THEN** each list has a distinct labeled group with a plain sentence for the number of possible items, the list-roll rule and its item selection

#### Scenario: World loot with level and rank restrictions
- **WHEN** a world-loot item can drop from elite creatures of levels 21 to 29
- **THEN** its summary identifies the level range and elite-rank restriction as eligibility, not as an item's probability per kill

#### Scenario: Chest and gathering sources
- **WHEN** an item is obtained from a chest and from gathering
- **THEN** the displayed chest item chance is identified as per open and the gathering yield chance as per use

#### Scenario: Cloth from creatures
- **WHEN** the game sets a base cloth roll rate before loot bonuses and the creature's level selects a cloth tier
- **THEN** the item summary and the Cloth Loot section name the base rate instead of claiming a verified chance per kill
- **AND** the level table explains that its rates are before loot bonuses
