## MODIFIED Requirements

### Requirement: An item page shows its tooltip and sources

An item page SHALL show the item name in its title block, with a map action when the map can show the resources, containers, or objects that give the item. Its hero SHALL show the in-game tooltip with linked references beside the description, a How to get it list, a Used for list, the authored buy price, and the stack size. Each How to get it line SHALL name a source section, up to two counterparts in the default order of that section, and the number of other counterparts, and SHALL link to that section. A Sold by line SHALL also name the lowest price. World loot SHALL have its own line with the creature levels. A Crafted line SHALL name the skill and the required level and SHALL link to the Crafting section. Each Used for line SHALL name a use section with its row count and SHALL link to that section. Full-width sections SHALL follow in this order: Teaches, Dropped by, Sold by, Found in containers, Gathered from, Collected from, From quests, From items, Dungeon rewards, Crafting, Contents, Used in recipes, Needed for quests. Each row of Used in recipes SHALL link to the Crafting section of the product. A Starting gear of line SHALL name the published classes that start with the item and SHALL link the Starting gear section of the first class page. The From items section SHALL show each item whose captured loot table or visual effect chest gives the item, with the requirements of the action. The Collected from section SHALL include each world object whose visual effect spawns a chest that gives the item, with the cost of the object. The visual effect of an object can spawn choices with their own costs, such as the sacrifices of a sacrificial altar. The row of such a choice SHALL name the object and the cost of the choice. When a visual effect loads one of several prefabs, the row SHALL name the number of prefabs. The Dungeon rewards section SHALL show each dungeon whose timed reward bag or Dungeon Finder run gives the item, with its condition. A Dropped by row of a quest pickup SHALL name the quest task during which the pickup appears. A world loot row of a cloth drop SHALL name Humanoid and Undead creatures. A class without a page SHALL NOT appear as a source. The hover tooltip of an item link SHALL show a How to get it summary with only the source kinds that have rows. A missing source SHALL be stated as unknown, not invented.

#### Scenario: Item has several sources
- **WHEN** an item is dropped by seven creatures and sold by two vendors
- **THEN** its hero shows a Dropped by line with two creatures and "5 more"
- **AND** its hero shows a Sold by line with both vendors and the lowest price
- **AND** each line links to its section below the hero

#### Scenario: Hover tooltip of an item link
- **WHEN** a reader points at a link to an item that creatures drop and vendors sell
- **THEN** the tooltip shows the in-game tooltip and a How to get it summary with a drop line and a vendor line

#### Scenario: No source is published
- **WHEN** no source relation is published for an item
- **THEN** its hero says that no way to get the item is known for this build

#### Scenario: Starting gear of three classes
- **WHEN** Wizard, Necromancer, and Druid start with Novice Staff
- **THEN** its hero shows a Starting gear of line with two classes and "1 more"
- **AND** each class name links the Starting gear section of its class page

#### Scenario: Starting gear of a class without a page
- **WHEN** only Berserker, which no race offers, starts with Rune Shield
- **THEN** the page of Rune Shield shows no Starting gear of line

#### Scenario: Crafted item
- **WHEN** a reader opens Runeweave Regalia, which Tailoring level 150 crafts
- **THEN** its hero shows a Crafted line that names Tailoring and level 150
- **AND** the line links to the Crafting section of the page

#### Scenario: Material of a recipe
- **WHEN** a reader opens Bolt of Runeweave, which the recipe Runeweave Regalia uses
- **THEN** its Used in recipes row links to the Crafting section of Runeweave Regalia

#### Scenario: Item comes from a supply pack
- **WHEN** the captured Druid level 6–11 table of Adventurer's Supply Pack gives Druid staff
- **THEN** the page of Druid staff shows a From items line and section that name Adventurer's Supply Pack
- **AND** the row names the Druid class and the level band of the action

#### Scenario: Item comes from a grave
- **WHEN** the chest that a grave spawns gives Human skull
- **THEN** the page of Human skull shows a Collected from line and section that name the graves and the recorded 30% row chance

#### Scenario: Item comes from a sacrificial altar
- **WHEN** the sacrifice of 15 Corrupted emeralds at a sacrificial altar loads one of six item sets, and one set holds Frost Shard Necklace
- **THEN** the page of Frost Shard Necklace shows a Collected from line and section that name the sacrificial altar
- **AND** the row names the cost of 15 Corrupted emeralds and the six item sets

#### Scenario: Timed dungeon reward
- **WHEN** the reward bag of a dungeon timer gives Corruption Token
- **THEN** the page of Corruption Token shows a Dungeon rewards section with each dungeon and the corruption level rule

#### Scenario: Quest pickup
- **WHEN** an Infected boar dies while the task "Collect 6 Boar Haunches" is open
- **THEN** the page of Boar Haunch shows a Dropped by row for Infected boar that names the quest Bait for a Beast

#### Scenario: Cloth drop
- **WHEN** Linen Cloth is a tier of the supplemental cloth drops
- **THEN** its page shows a world loot row for Humanoid and Undead creatures with the 75% base chance, the count 1 to 3, and the level ramp of the tier

## ADDED Requirements

### Requirement: Item pages show what using an item gives

An item page SHALL show each verified result of the captured game actions of the item. A loot table result SHALL appear in a Contents section with each item or currency, its recorded quantity, its chance semantics, and the requirements of its action. A visual effect result SHALL list the chests that the effect can spawn, the number of prefab choices, and the rows of each chest. The Contents section SHALL NOT claim an effective chance. A companion or recipe result SHALL link its page when the page exists. An action type without a verified result SHALL NOT appear as an effect, and it SHALL remain a coverage issue in the catalog. An item without game actions SHALL NOT show a Contents section.

#### Scenario: Supply pack
- **WHEN** a reader opens Adventurer's Supply Pack, whose 25 captured actions name loot tables
- **THEN** its Contents section lists each table with its class and level requirements, its items, and their recorded quantities and chances

#### Scenario: Sack
- **WHEN** the captured TriggerVisualEffect action of Slime covered sack spawns the Loot purse chest
- **THEN** its Contents section lists the chest rows, including gold 10–20 at 100%

#### Scenario: Item without game actions
- **WHEN** a reader opens Epic renown reward, which has no captured game actions
- **THEN** its page shows no Contents section and names no result

#### Scenario: Unverified action type
- **WHEN** an item has a captured action whose result has no verified meaning
- **THEN** its page shows no effect for that action
- **AND** the catalog keeps the action as a coverage issue
