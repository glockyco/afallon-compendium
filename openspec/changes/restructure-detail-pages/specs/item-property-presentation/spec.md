## MODIFIED Requirements

### Requirement: An item page shows its tooltip and sources

An item page SHALL show the item name in its title block, with a map action when the map can show the resources, containers, or objects that give the item. Its hero SHALL show the in-game tooltip with linked references beside the description, a How to get it list, a Used for list, the authored buy price, and the stack size. Each How to get it line SHALL name a source section, up to two counterparts in the default order of that section, and the number of other counterparts, and SHALL link to that section. A Sold by line SHALL also name the lowest price. World loot SHALL have its own line with the creature levels. Each Used for line SHALL name a use section with its row count and SHALL link to that section. Full-width sections SHALL follow in this order: Dropped by, Sold by, Found in containers, Gathered from, Collected from, From quests, Crafted from, Used in recipes, Needed for quests. The hover tooltip of an item link SHALL show a How to get it summary with only the source kinds that have rows. A missing source SHALL be stated as unknown, not invented.

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
