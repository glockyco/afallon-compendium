## MODIFIED Requirements

### Requirement: An item page shows its tooltip and sources

An item page SHALL show the item name in its title block, with a map action when the map can show the resources, containers, or objects that give the item. Its hero SHALL show the in-game tooltip with linked references beside the description, a How to get it list, a Used for list, the authored buy price, and the stack size. Each How to get it line SHALL name a source section, up to two counterparts in the default order of that section, and the number of other counterparts, and SHALL link to that section. A Sold by line SHALL also name the lowest price. World loot SHALL have its own line with the creature levels. Each Used for line SHALL name a use section with its row count and SHALL link to that section. Full-width sections SHALL follow in this order: Dropped by, Sold by, Found in containers, Gathered from, Collected from, From quests, From items, From dialogue, Crafted from, Starting gear of, Contents, Used in recipes, Needed for quests. The Starting gear of section SHALL show each published class that starts with the item, with the count and whether the item starts equipped. The From items section SHALL show each item whose captured loot table gives the item. The From dialogue section SHALL show each NPC whose captured dialogue gives the item. A class without a page SHALL NOT appear as a source. The hover tooltip of an item link SHALL show a How to get it summary with only the source kinds that have rows. A missing source SHALL be stated as unknown, not invented.

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
- **AND** its Starting gear of section shows all three classes with the count and the equipped state

#### Scenario: Starting gear of a class without a page
- **WHEN** only Berserker, which no race offers, starts with Rune Shield
- **THEN** the page of Rune Shield shows no Starting gear of line or section

#### Scenario: Item comes from a renown box
- **WHEN** the captured loot table of Epic renown reward gives an item
- **THEN** the page of that item shows a From items line and section that name Epic renown reward

#### Scenario: Item comes from dialogue
- **WHEN** a captured dialogue node of an NPC gives an item through a game action
- **THEN** the page of that item shows a From dialogue line and section that name the NPC

## ADDED Requirements

### Requirement: Item pages show what using an item gives

An item page SHALL show each verified result of the captured game actions of the item. A loot table result SHALL appear in a Contents section with each item or currency, its recorded quantity, and its chance semantics. The Contents section SHALL NOT claim an effective chance when other rolls affect it. A currency result SHALL name its amount or range. A companion or recipe result SHALL link its page when the page exists. An action type without a verified result SHALL NOT appear as an effect, and it SHALL remain a coverage issue in the catalog.

#### Scenario: Renown box
- **WHEN** a reader opens Epic renown reward, whose captured action names a loot table
- **THEN** its Contents section lists the items of that loot table with their recorded quantities and chances
- **AND** the hero names the Contents section as a use of the item

#### Scenario: Gold sack
- **WHEN** a captured action of Slime covered sack gives gold coins
- **THEN** its page names the recorded amount or range of gold coins

#### Scenario: Companion contract
- **WHEN** a captured action of Adventure 2 companion gives a companion with a verified result
- **THEN** its page names that companion and links its page when the page exists

#### Scenario: Unverified action type
- **WHEN** an item has a captured action whose result has no verified meaning
- **THEN** its page shows no effect for that action
- **AND** the catalog keeps the action as a coverage issue
