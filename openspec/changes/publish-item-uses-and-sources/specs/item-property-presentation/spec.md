## MODIFIED Requirements

### Requirement: An item page shows its tooltip and sources

An item page SHALL show its name and applicable map action in the title, and its in-game tooltip once with description in the side column (after its answer on narrow screens). Its How to get it answer SHALL show one linked route per available source kind—craft, mine, loot, search, buy, quest reward, starting gear, another item, a world object that spawns a chest, a dungeon reward, a quest pickup, or a cloth drop—ordered by guaranteed yield then known spot count, without treating a chance as guaranteed. Each route SHALL identify a useful example, relevant quantity or chance, and its full anchored source section; an unknown source SHALL be stated plainly. A crafted route SHALL show the materials, known teacher, skill and level, and a computed experience sentence with guide-step link. Its sections SHALL follow Teaches, Used for, then applicable Crafting, Mined from, Dropped by, Sold by, Found in objects, Found in containers, and Quest rewards. Recipe relations SHALL use equations; full relations SHALL remain accessible. Price and stack size SHALL remain available once as secondary facts. A starting-gear route SHALL name only published classes and link their Starting gear sections.

#### Scenario: Item has several sources
- **WHEN** an item drops from seven creatures and is sold by two vendors
- **THEN** How to get it has separate Loot and Buy routes with linked examples and the known lowest price
- **AND** the full source sections retain all nine relations

#### Scenario: Hover tooltip of an item link
- **WHEN** a reader focuses, taps, or hovers an item link
- **THEN** its preview shows the game's tooltip and at most one context line without a source table

#### Scenario: No source is published
- **WHEN** no source relation is published for an item
- **THEN** How to get it says "No known way to get this item."

#### Scenario: Starting gear of three classes
- **WHEN** Wizard, Necromancer, and Druid start with Novice Staff
- **THEN** Starting gear is an acquisition route linked to the three class pages and their Starting gear sections

#### Scenario: Starting gear of a class without a page
- **WHEN** only unpublished Berserker starts with Rune Shield
- **THEN** the page shows no starting-gear route to Berserker

#### Scenario: Crafted item
- **WHEN** Tailoring level 150 crafts Runeweave Regalia
- **THEN** its Craft route links its Crafting section and shows the materials and supported experience breakpoint

#### Scenario: Material of a recipe
- **WHEN** Runeweave Regalia uses Bolt of Runeweave
- **THEN** the material's Used for equation links the product's Crafting anchor

#### Scenario: Item comes from a supply pack
- **WHEN** the Druid level 6–11 table of Adventurer's Supply Pack gives Druid Staff
- **THEN** the page of Druid Staff shows a From items route and section that name Adventurer's Supply Pack
- **AND** the row names the Druid class and the level band of the table

#### Scenario: Item comes from a used bag
- **WHEN** the chest that Slime covered sack spawns gives Poison Sword
- **THEN** the page of Poison Sword shows a From items row for Slime covered sack with the recorded row chance

#### Scenario: Item comes from a grave
- **WHEN** the chest that a grave spawns gives Human skull
- **THEN** the page of Human skull shows a Collected from route and section that name the graves and the recorded 30% row chance

#### Scenario: Item comes from a sacrificial altar
- **WHEN** the sacrifice of 15 Corrupted emeralds at a sacrificial altar loads one of six item sets, and one set holds Frost Shard Necklace
- **THEN** the page of Frost Shard Necklace shows a Collected from route and section that name the sacrificial altar
- **AND** the row names the cost of 15 Corrupted emeralds and the six item sets

#### Scenario: Timed dungeon reward
- **WHEN** the reward bag of a dungeon timer gives Corruption Token
- **THEN** the page of Corruption Token shows a Dungeon rewards route with each dungeon

#### Scenario: Quest pickup
- **WHEN** an Infected boar dies while the task "Collect 6 Boar Haunches" is open
- **THEN** the page of Boar Haunch shows a Dropped by row for Infected boar that names the quest Bait for a Beast

#### Scenario: Cloth drop
- **WHEN** Linen Cloth is a tier of the supplemental cloth drops
- **THEN** its page shows a Cloth loot section for Humanoid and Undead creatures with the roll chance, the count, and the chance per kill for each range of creature levels
