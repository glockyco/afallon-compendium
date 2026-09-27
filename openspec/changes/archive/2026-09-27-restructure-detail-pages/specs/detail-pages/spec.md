## Purpose

Give every entity detail page one structure that answers a player's questions in a fixed order, with no side-by-side cards, no empty or repeated content, and explanations in place.

## ADDED Requirements

### Requirement: Detail pages share one structure

Every entity detail page SHALL show, from top to bottom, the breadcrumb, the title block, an optional hero, and its sections. The title block, the hero, and each section SHALL use the full width of the page column. A page SHALL NOT place two cards side by side.

#### Scenario: Item page on a wide screen
- **WHEN** a reader opens an item page in a window that is 1440 px wide
- **THEN** the title block, the hero, and each source section use the full width of the page column
- **AND** no two cards share a row

#### Scenario: Page with one short section
- **WHEN** a page has one section with one row
- **THEN** that section uses the full width of the page column without a card beside it

### Requirement: The title block names the entity

The title block SHALL show the entity name, one line of identity facts, and at most one "View on map" action. The title block SHALL NOT show artwork, a description, a fallback glyph, a badge, or a fact that the hero shows. The map action SHALL appear only when the map can show the entity: the spots of an NPC or a property, the area of a place, or the resources, containers, and objects that give an item. The action SHALL open the map with that selection.

#### Scenario: Boss in one dungeon
- **WHEN** a boss has published spots in one dungeon
- **THEN** its title block shows its roles, its level, the dungeon, "Boss of" with a link to the dungeon, and "View on map"
- **AND** its hero does not repeat the level or the dungeon

#### Scenario: Quest page
- **WHEN** a reader opens a quest page
- **THEN** its title block has no map action

### Requirement: The hero shows the entity as the game shows it

A hero SHALL be one panel with a view area and a facts area. The view area SHALL show the entity as the game shows it: the item tooltip, the NPC portrait, the place artwork, the property purchase panel, the ability tooltip, or the tooltip of a recipe's product. The facts area SHALL show the description and the key facts of the kind. The description SHALL appear once in the hero. When the entity has no view, the facts area SHALL use the whole panel. When the entity has no view and no hero facts, the page SHALL NOT show a hero. Neither area SHALL stretch to the height of the other area. On screens narrower than 640 px, the facts area SHALL follow the view area.

#### Scenario: NPC without a portrait
- **WHEN** an NPC has stats but no portrait
- **THEN** its hero shows the stats across the whole panel

#### Scenario: Place with artwork
- **WHEN** a place has artwork and a description
- **THEN** its hero shows the artwork beside the description

### Requirement: Sections share one heading and one panel

Each section SHALL have a heading with an icon, a title, and an optional heading line. A section that holds rows SHALL also show its row count. One panel SHALL follow the heading and hold a table, a list of facts, a link grid, or prose. A section without content SHALL NOT appear. Each section SHALL have an anchor that other parts of the page can link.

#### Scenario: Empty relation
- **WHEN** an NPC sells nothing
- **THEN** its page has no Sells section

#### Scenario: Link to a section
- **WHEN** a reader selects the Dropped by line in an item hero
- **THEN** the page scrolls to the Dropped by section

### Requirement: Relation tables show only useful columns

A relation table SHALL show a column only when at least one row has a value for it. A column SHALL be omitted when all rows have the same value and that value is a default, such as a quantity of one, or appears elsewhere on the page, such as the NPC level in the title block. When all rows of a drops section have the same loot roll, the heading line SHALL state the loot roll once, and the table SHALL NOT show a loot roll column. The name column and the values that a reader compares, such as chance and price, SHALL remain.

#### Scenario: Vendor stock without unlock requirements
- **WHEN** no item of a vendor has an unlock requirement
- **THEN** the vendor's table has no unlock requirement column

#### Scenario: One loot roll for all rows
- **WHEN** all drop rows of an NPC come from a loot table that rolls on every kill and gives at most 3 items
- **THEN** the table has no loot roll column
- **AND** the heading line states that the loot table rolls on every kill and gives at most 3 items

#### Scenario: Table with one row
- **WHEN** an NPC sells one item
- **THEN** the row shows the item and its price

#### Scenario: One location
- **WHEN** an NPC has one location, and the title block shows its level and roles
- **THEN** the Where to find table has no level column and no role column

### Requirement: Relation tables merge only equivalent rows

Rows that have the same counterpart and the same values, and differ only in the role of the counterpart, SHALL merge into one row that names each role. Rows that differ in quantity, chance, price, conditions, or spots SHALL stay separate rows. A merged row SHALL count each map spot once.

#### Scenario: Quest giver who also completes the quest
- **WHEN** one NPC both gives and completes a quest
- **THEN** the Quests section of that NPC has one row for the quest that names both roles

#### Scenario: Containers under different conditions
- **WHEN** three backpacks at one place give the same quantity of an item under three different conditions
- **THEN** the item's Found in containers section shows three rows, one for each condition

### Requirement: Long relation tables show their first rows

A table with more than 15 rows SHALL show its first 15 rows in its current sort order and a control that shows all rows. When the address of the page names a row that the table hides, the table SHALL show all rows and scroll to that row.

#### Scenario: Long drop list
- **WHEN** an NPC has 22 drop rows
- **THEN** the table shows 15 rows and a "Show all 22" control

#### Scenario: Link to a hidden row
- **WHEN** a reader opens a link to an NPC variant whose anchor is in row 20 of the Where to find table
- **THEN** the table shows all rows and scrolls to row 20

### Requirement: Relation tables fit narrow screens

On screens narrower than 640 px, a relation table SHALL show each row as a block of labeled values. Names SHALL wrap only between words. Numbers SHALL NOT wrap. The page SHALL NOT scroll sideways.

#### Scenario: Item sources on a phone
- **WHEN** a reader opens an item page in a window that is 390 px wide
- **THEN** each container row shows its container, place, quantity, chance, and conditions as labeled lines
- **AND** the page does not scroll sideways

#### Scenario: Long place name
- **WHEN** a table cell holds the name "Challenge Stone Logging Camp"
- **THEN** the name wraps between words and never inside a word

### Requirement: Sections explain their own values

A reader SHALL understand the values of each section without another page and without knowledge of game menus. Column labels SHALL use plain words. A column label whose values follow a game rule SHALL show a short explanation on hover, on focus, and on tap. The explanation SHALL use the placement rules of entity tooltips. The heading line SHALL hold at most one sentence, which explains the values or states the values that all rows share. A page SHALL NOT show an explanatory paragraph under a table.

#### Scenario: NPC drops
- **WHEN** an NPC page shows drops from a loot table that rolls on 5% of kills
- **THEN** the Loot roll label explains that a kill rolls the loot table with this chance and that one roll gives this number of items
- **AND** the Chance label explains that each item of a rolled table then rolls its own chance
- **AND** the Loot roll label explains that a roll gives at least its minimum number of items, which does not make any one item certain
- **AND** no paragraph appears under the table

### Requirement: Reader text shows no record ids or internal words

Page text, table cells, and labels SHALL NOT show a native record id or an internal enum word, such as "Mob". The NPC type MOB SHALL NOT appear, because it marks an ordinary NPC. The NPC types BOSS, MERCHANT, and BANK SHALL NOT appear, because the roles already name them. A connection SHALL NOT show the authored kind of its teleport.

#### Scenario: Variants without readable labels
- **WHEN** three variants of an NPC differ in stats but not in place, area, level, or type
- **THEN** the Variants table labels them "Variant 1", "Variant 2", and "Variant 3"

#### Scenario: Ordinary creature
- **WHEN** an NPC has the type MOB
- **THEN** its page shows no type word

### Requirement: Facts carry information

A page SHALL NOT show a stat whose amount is zero. An NPC whose roles are all friendly services SHALL NOT show a respawn time, an experience range, or an aggro range. The friendly services are quest giver, merchant, townsfolk, banker, auctioneer, and flight point.

#### Scenario: Friendly merchant
- **WHEN** a merchant has only the merchant role
- **THEN** its hero shows no respawn time, experience range, or aggro range

#### Scenario: Stat of zero
- **WHEN** an NPC record gives a Health stat of 0
- **THEN** its hero does not show Health

### Requirement: NPC pages show who the NPC is, where it is, and what it gives

Each fact below SHALL appear only when the publication has a value for it. An NPC page SHALL show its roles, its type, its level, its places, and the places that it is the boss of in the title block. Its hero SHALL show the portrait, the description, the stats, the immunities, the faction, the species, the creature type, the respawn time, the experience range, the aggro range, the favoured loot, the faction changes of a kill, and the linked NPC. Its sections SHALL follow this order: Where to find, Variants, Abilities, Drops, Sells, Quests. The Quests section SHALL show one row for each quest with each role of the NPC in that quest: gives, completes, or objective target. The Where to find table SHALL show a Variant column only when the page shows the Variants section.

#### Scenario: Boss of one place
- **WHEN** an NPC is the boss of one place
- **THEN** its title block shows "Boss of" with a link to that place
- **AND** the page has no "Boss of" section

#### Scenario: Quest target and quest giver
- **WHEN** an NPC gives one quest and is the target of an objective in another quest
- **THEN** its Quests section has one row for each quest with the role in that quest

### Requirement: Quest pages follow the course of the quest

Each fact below SHALL appear only when the publication has a value for it. A quest page SHALL show its quest level, its minimum level, its chain name and step, its world quest state, its repeatability, and its dungeon in the title block. A quest page SHALL NOT show a hero. Its sections SHALL follow this order: Quest chain, Start and turn-in, Objectives, Rewards, Quest text, World changes, Unlocks. The Quest chain section SHALL show the steps of the chain in order as links and mark the current step. The Start and turn-in section SHALL show the requirements to take the quest, one row for each character with its roles, areas, and map link, the world quest zones with their timing, and the start objects. The Rewards section SHALL show the experience, the rewards, the rewards to choose from, and the items given at the start. The Quest text section SHALL show the offer text, the objective text, and the completion text.

#### Scenario: Quest in a chain
- **WHEN** a quest is step 5 of 5 in a chain
- **THEN** the Quest chain section shows the five steps as links and marks step 5

#### Scenario: Quest outside a chain
- **WHEN** a quest belongs to no chain
- **THEN** the page has no Quest chain section

### Requirement: Place pages list what a player finds there

Each fact below SHALL appear only when the publication has a value for it. A place page SHALL show its place type, its level range, its parent place, and its Adventure Guide listing in the title block. Its hero SHALL show its artwork and description. Its sections SHALL follow this order: Bosses, Creatures, NPCs, Points of interest, Quests, Properties, Connections, Areas. Each creature SHALL appear in one section only. Points of interest SHALL list the map categories of the place that no creature or NPC row shows, with their spot counts. The Quests section SHALL show one row for each quest that starts in the place or has an objective in it, and SHALL name both roles when both apply. The Connections section SHALL show one row for each direction and connected place: a teleport to that place, a teleport from that place, or a teleport within the place. Each row SHALL show the map spots where its teleports start. A row whose teleports start at no map spot SHALL say that the map shows no start for it. The Connections section SHALL NOT list a dungeon entrance trigger, because it loads nothing. It SHALL NOT list a teleport whose start lies outside the game map of its place when a teleport in another place starts at the same world position and has the same destination.

#### Scenario: Dungeon with bosses
- **WHEN** a dungeon has four bosses and two other creatures
- **THEN** the Bosses section lists the four bosses
- **AND** the Creatures section lists only the two other creatures

#### Scenario: Several teleports to one place
- **WHEN** a place has four teleports to Afallon
- **THEN** its Connections section has one "To Afallon" row with four spots

#### Scenario: Teleport into the place
- **WHEN** a teleport in Afallon leads into Duskfall Depths
- **THEN** the Connections section of Duskfall Depths has a "From Afallon" row with the spot of that teleport

#### Scenario: Leftover copy of a teleporter
- **WHEN** Cave (Coalway Woods 1) holds a copy of the Duskfall Depths entrance teleporter outside the game map of the cave
- **AND** Challenge Stone Blood holds a copy at the same world position on its game map
- **THEN** neither the cave page nor the Duskfall Depths page lists the teleport of the cave
- **AND** both the Challenge Stone Blood page and the Duskfall Depths page list the teleport of Challenge Stone Blood

#### Scenario: Teleport outside its map without a copy
- **WHEN** the exit teleporter of Sanctum of the Veilpiercer starts outside the game map of the sanctum
- **AND** no other place holds a teleporter at that position
- **THEN** the sanctum page lists a "To Afallon" row

### Requirement: Property pages show the purchase

A property page SHALL show its property type and its place in the title block, with a map action that opens its for-sale signs. Its hero SHALL show the purchase panel with the picture, the price, the income with its interval, and the sale price, and SHALL name the areas of its for-sale signs. A Where to buy section SHALL appear only when the property has more than one for-sale sign.

#### Scenario: Property with one sign
- **WHEN** a property has one for-sale sign
- **THEN** its title block has a map action that opens the sign
- **AND** its hero names the area of the sign
- **AND** the page has no Where to buy section

### Requirement: Ability pages compare versions

An ability page SHALL show in its hero the tooltip of the version with the most users. When versions have the same number of users, the hero SHALL show the first of them. When the ability has several versions, a Versions section SHALL show the text and the number of users of each version in one table. The Used by section SHALL group its NPCs by version when the ability has several versions. The Taught by section SHALL list the items that teach the ability.

#### Scenario: Ability with five versions
- **WHEN** an ability has five versions
- **THEN** the Versions table has five rows
- **AND** the Used by section groups its NPCs under each version

### Requirement: Recipe pages show the product and its materials

A recipe page SHALL show its station, its skill, and a rank above zero in the title block. Its hero SHALL show the tooltip of the product and the product quantity when it is more than one. A Materials section SHALL show each material with its quantity.

#### Scenario: Recipe with rank zero
- **WHEN** a recipe has rank 0
- **THEN** its title block shows the station and the skill without a rank
