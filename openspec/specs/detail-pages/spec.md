# detail-pages Specification

## Purpose

Give every entity detail page one structure that answers a player's questions in a fixed order, with no side-by-side cards, no empty or repeated content, and explanations in place.

## Requirements

### Requirement: Detail pages share one structure

Every entity detail page SHALL show a breadcrumb, title block, answer, applicable side facts, and ordered relation sections. At widths of at least 1024 px the page SHALL use a main column and a 20rem side column beginning beside the answer, below the title block; the side column SHALL remain available while scrolling. At narrower widths the order SHALL be title, answer, side facts, relations. An applicable single stat strip beneath the title SHALL hold no more than five decisive facts. A page with at least four rendered sections SHALL offer section navigation. No fact SHALL repeat in adjacent title, strip, answer, and side content.

#### Scenario: Item page on a wide screen
- **WHEN** a reader opens an item page at 1440 px
- **THEN** its main column starts with the title and How to get it, while the side column holds one game tooltip and the description
- **AND** relation sections follow the answer without side-by-side relation cards

#### Scenario: Page with one short section
- **WHEN** a page has one section with one row
- **THEN** it shows the section and no section navigation

#### Scenario: Detail page on a phone
- **WHEN** a class page opens at 390 px
- **THEN** its title and answer precede the side facts and relations without horizontal page scroll

### Requirement: The title block names the entity

The title block SHALL show the entity icon or portrait when available, its name, one identity line, at most one map action, and an applicable stat strip. The map action SHALL appear only when the map can show a corresponding published selection: NPC spots, property signs, place area, gathering spots, or item sources. It SHALL open that selection. A kind whose game tooltip sits alongside the title SHALL omit the stat strip when the strip would repeat its facts.

#### Scenario: Boss in one dungeon
- **WHEN** a boss has published spots in one dungeon
- **THEN** its title identifies its role and place and offers a map action
- **AND** its level appears once in the stat strip or identity line, not in both

#### Scenario: Quest page
- **WHEN** a quest has no location that the map can select
- **THEN** its title block has no map action

### Requirement: The hero shows the entity as the game shows it

The primary answer SHALL be a distinct card in the main column. The game's item or ability tooltip SHALL appear once in the side column at wide widths and after the answer on narrow screens. A place's artwork and description SHALL be part of its answer. NPC portraits, class and skill icons SHALL identify their title or relation row; descriptions and secondary stats SHALL appear once in the answer or side facts. A missing image SHALL not create an empty image frame. No side panel SHALL stretch just to match another panel's height.

#### Scenario: NPC without a portrait
- **WHEN** an NPC has stats but no portrait
- **THEN** its title uses a readable identity without a blank image and its available stats remain visible

#### Scenario: Place with artwork
- **WHEN** a place has artwork and a description
- **THEN** its answer presents both

#### Scenario: Class with an icon
- **WHEN** a reader opens Shieldmaster
- **THEN** its icon identifies its title and its playstyle description occupies the answer

### Requirement: Sections share one heading and one panel

Each nonempty relation section SHALL have a serif heading, its row count when applicable, at most one Show all action, and a stable anchor. A heading SHALL NOT have a decorative icon tile. A panel SHALL enclose a group of rows, not an otherwise empty section. The first eight rows SHALL preview the relation in its specified sort order; a section with more rows SHALL offer Show N more to reveal all, while preserving row anchors and the full set of facts.

#### Scenario: Empty relation
- **WHEN** an NPC sells nothing
- **THEN** its page has no Sells section

#### Scenario: Link to a section
- **WHEN** a reader selects an item acquisition route
- **THEN** the page reaches its matching full source section

### Requirement: Relation tables show only useful columns

A relation row SHALL show an icon or portrait, linked name with level/place subline when known, and at most two right-aligned comparable values: a quantity or count and one context value such as chance or price. It SHALL omit a repeated default or a value already established in the heading, without hiding a differing condition. A shared loot roll SHALL appear once in the section heading. Text and number labels SHALL remain understandable without game-menu knowledge.

#### Scenario: Vendor stock without unlock requirements
- **WHEN** no vendor item has an unlock requirement
- **THEN** stock rows show no empty unlock field

#### Scenario: One loot roll for all rows
- **WHEN** all drop rows use a loot table that rolls on every kill for at most 3 items
- **THEN** the heading states this rule once and rows show their item chance without a duplicate loot-roll value

#### Scenario: Table with one row
- **WHEN** an NPC sells one item
- **THEN** the row shows its item and price

#### Scenario: One location
- **WHEN** a creature has one location and its level and role are already shown above
- **THEN** the location row does not repeat them without a differing location-specific value

### Requirement: Relation tables merge only equivalent rows

Rows that have the same counterpart and the same values, and differ only in the role of the counterpart, SHALL merge into one row that names each role. Rows that differ in quantity, chance, price, conditions, or spots SHALL stay separate rows. A merged row SHALL count each map spot once.

#### Scenario: Quest giver who also completes the quest
- **WHEN** one NPC both gives and completes a quest
- **THEN** the Quests section of that NPC has one row for the quest that names both roles

#### Scenario: Containers under different conditions
- **WHEN** three backpacks at one place give the same quantity of an item under three different conditions
- **THEN** the item's Found in containers section shows three rows, one for each condition

### Requirement: Long relation tables show their first rows

A relation with up to ten rows SHALL show every row. A relation with more than ten rows SHALL preview its first eight in its current sort order and offer Show N more, where N is the number of hidden rows. A list on a detail page that hides rows behind Show more or Show all SHALL follow the same rule. An address that names a hidden row SHALL reveal it and scroll to it; this SHALL also work inside a hidden tab or closed disclosure.

#### Scenario: Long drop list
- **WHEN** an NPC has 22 drop rows
- **THEN** the section shows eight rows and a Show 14 more control

#### Scenario: Short list
- **WHEN** an item is used in nine recipes
- **THEN** its Used for section shows all nine recipes and no Show more control

#### Scenario: Smallest hidden part
- **WHEN** a relation has eleven rows
- **THEN** the section shows eight rows and a Show 3 more control

#### Scenario: Link to a hidden row
- **WHEN** a reader opens a link to a variant anchored in row 20
- **THEN** the row is revealed and scrolled into view

### Requirement: Relation tables fit narrow screens

At 390 px a relation SHALL remain legible with icon, wrapping name and subline, and nonwrapping values. Additional condition or map information SHALL remain accessible through expansion or a labeled detail line. The page SHALL NOT scroll sideways.

#### Scenario: Item sources on a phone
- **WHEN** an item has container sources with differing conditions
- **THEN** each row or its expanded detail keeps the container, place, quantity, chance, and condition legible without sideways scrolling

#### Scenario: Long place name
- **WHEN** a row names Challenge Stone Logging Camp
- **THEN** its name wraps between words without clipping

### Requirement: Sections explain their own values

Sections SHALL label probabilities, quantities, and conditions in plain language sufficient to interpret the shown values without another page. A short computed sentence MAY explain an entity-specific value; rule prose SHALL instead live in the relevant guide section linked by a quiet How it works action. Labels and explanatory hints SHALL work on hover, focus, and tap, but SHALL NOT contain copied rule text or require a hover card to understand a fact.

#### Scenario: NPC drops
- **WHEN** an NPC's loot table rolls on 5% of kills
- **THEN** its Drops heading identifies the table's roll chance, separately from each item's conditional chance
- **AND** a guide link explains the rule without a rules paragraph beneath the rows

### Requirement: Reader text shows no record ids or internal words

Page text, table cells, and labels SHALL NOT show a native record id or an internal enum word, such as "Mob". The NPC type MOB SHALL NOT appear, because it marks an ordinary NPC. The NPC types BOSS, MERCHANT, and BANK SHALL NOT appear, because the roles already name them. A connection SHALL NOT show the authored kind of its teleport. Category values SHALL read in title case on pages, in tooltips, in list cells and filters, and on the map: item types and slots, gear types, rarities, roles and map categories, quest start types, NPC and creature types, place types, and kind labels. A short word inside a category value, such as "of", SHALL stay lowercase.

#### Scenario: Variants without readable labels
- **WHEN** three variants of an NPC differ in stats but not in place, area, level, or type
- **THEN** the Variants table labels them "Variant 1", "Variant 2", and "Variant 3"

#### Scenario: Ordinary creature
- **WHEN** an NPC has the type MOB
- **THEN** its page shows no type word

#### Scenario: Enum word and authored value in one filter
- **WHEN** the item types include the enum word QUEST_ITEM and the authored value "Fishing rod"
- **THEN** the Type filter lists "Quest Item" and "Fishing Rod"

### Requirement: Facts carry information

A page SHALL NOT show a stat whose amount is zero. A creature whose roles are all friendly services SHALL NOT show respawn, kill experience, or aggro range as combat summary facts. The friendly services are quest giver, merchant, townsfolk, banker, auctioneer, and flight point.

#### Scenario: Friendly merchant
- **WHEN** a merchant has only the merchant role
- **THEN** its answer and strip omit respawn, kill experience, and aggro range

#### Scenario: Stat of zero
- **WHEN** an NPC record gives Health of 0
- **THEN** its page does not present Health as a key stat

### Requirement: NPC pages show who the NPC is, where it is, and what it gives

When available, a combat creature's strip SHALL show level, health, experience per kill, and respawn. Its answer SHALL show Drops sorted by chance, with the loot roll in the heading and a second loot table as a labeled group. An adventurer without drops SHALL instead answer with its Gear: the published chance that a finished job takes an upgrade from the reward gear list, a link to that list, and the items and types of its own gear kit when it has one. A combat creature without drops SHALL say that no drops are published for it by name. A friendly NPC without drops SHALL have no answer card. Text that applies to every NPC SHALL call it an NPC or name it, and SHALL reserve "creature" for NPCs that you fight. An adventurer's gear preference SHALL be named as the gear that it prefers, with its armor type, weapon types, and favoured stat, and SHALL NOT be described as what its kills drop. The side SHALL hold combat stats, faction, aggro range, immunities, and abilities as chips, and preserve other secondary facts without repeating the answer. When the published kill experience has its level difference and the character level cap, the side SHALL show the experience per kill at the reader's remembered character level, with its level control, the creature level at that character level, and a link to the kill calculator. Its remaining sections SHALL follow: Where to find grouped by place with counts, Sells, Quests, Variants. Each quest SHALL name whether the creature gives, completes, or is an objective; differing variant and placement facts SHALL remain accessible. A friendly service NPC SHALL not gain fabricated combat facts. An adventurer page SHALL show no respawn time, because a world adventurer returns through its scene's spawn pool and not after its record's respawn time, and SHALL show kill experience only when a kill gives experience.

#### Scenario: Boss of one place
- **WHEN** an NPC is boss of one place
- **THEN** its title links that place without a duplicate Boss of section

#### Scenario: Quest target and quest giver
- **WHEN** an NPC gives one quest and is an objective in another
- **THEN** its Quests section has one row per quest with the correct role

#### Scenario: Merchant without drops
- **WHEN** a reader opens Rickard, a merchant who drops nothing
- **THEN** the page has no Drops card and no text that calls Rickard a creature

#### Scenario: Adventurer gear
- **WHEN** a reader opens Eldeth Goldvein
- **THEN** the Gear card gives the job upgrade chance, links the reward gear list, and lists the nine items of the Oakheart kit with their types

#### Scenario: Gear preference of an adventurer
- **WHEN** a reader opens Agra Emberhide, whose specialization is Leather, Staff, and Strength
- **THEN** the side reads Gear preference: Leather armor, Staff, favours Strength, with a link to the Adventurers guide's gear section

#### Scenario: Experience at the reader's level
- **WHEN** a reader at character level 15 opens a creature that spawns at levels 10 to 20 and scales with the player
- **THEN** its Experience per kill card shows the experience of a level 15 kill, computed as the kill calculator computes it without followers, Heroic, or bonuses

#### Scenario: Adventurer without a respawn time
- **WHEN** a reader opens Eldeth Goldvein, whose NPC record says 1 to 2 minutes
- **THEN** the page shows no respawn time and no experience per kill

### Requirement: Quest pages follow the course of the quest

A quest's strip SHALL show available quest level, experience, main reward, and chain step. Its answer SHALL show objectives as a numbered checklist with target and required count, and identify who starts and ends the quest with their places and map links when known. The side SHALL show requirements and a vertical chain stepper identifying the current step. Sections SHALL follow: Rewards, Unlocks. Offer, objective, and completion text and world changes SHALL remain available in closed blocks at the end. A quest without a chain SHALL omit the stepper; it SHALL retain available repeatability, world quest timing, minimum level, and dungeon context without inventing values.

#### Scenario: Quest in a chain
- **WHEN** a quest is step 5 of 5
- **THEN** the side stepper links five steps and marks step 5 with a word as well as visual state

#### Scenario: Quest outside a chain
- **WHEN** a quest belongs to no chain
- **THEN** it shows no chain stepper

### Requirement: Property pages show the purchase

A property page SHALL show its type and place in the title and show price, income per payment, and sell price in a single strip when known. Its answer SHALL show where to buy it with the for-sale signs and a map action. Its side SHALL show the available purchase panel and picture once. It SHALL not claim an interval or currency without confirmed facts.

#### Scenario: Property with one sign
- **WHEN** a property has one for-sale sign
- **THEN** its answer identifies the sign's area and a map action opens it

### Requirement: Ability pages compare versions

An ability page SHALL show the game tooltip once in the side column, choosing the version with most users and the first in a tie. Its answer SHALL identify who learns it (published classes and talent nodes) and who uses it, with costs and activation requirements retained in the tooltip. When multiple versions exist, a Versions section SHALL compare their distinct text, use requirements, and users. Teaching items and all usable rank links SHALL remain available without repeating the tooltip.

#### Scenario: Ability with five versions
- **WHEN** an ability has five versions
- **THEN** Versions compares five and Used by groups users under the correct version

#### Scenario: Ability from a talent tree
- **WHEN** a reader opens Maul
- **THEN** the answer links Druid's Primal Feral tier 2 talent and its tooltip identifies the Ursine Aspect condition

#### Scenario: Ability of a class that no race offers
- **WHEN** only an unpublished Hunter class learns Barbed Quarrel
- **THEN** Learned by has no Hunter page link and the tooltip still shows Costs 9 Mana

### Requirement: Class pages show how a class progresses

Only classes offered by a published race SHALL have pages. A class strip SHALL show races, weapon types, highest level, and talent tree count when known. Its answer SHALL present playstyle and auto attack. Its side SHALL stay in view beside the trees and SHALL present how the class gains talent points, each talent tree with the points that learning every rank of every node takes and a link to its tab, the weapon types, and the gear link. A tree whose points differ from the most common points of the class SHALL name them with its cost. Where a guide explains how those points are earned, such as Heroic Essence in the Heroic Tier guide, the tree and the side SHALL link that guide section. A rank costs its own unlock cost, and the first rank of an ability that the class knows from the start SHALL cost nothing. Starting gear SHALL come before the talent trees, which SHALL remain in authored order with the established tabbed List/Grid views and row anchors. The page SHALL link to Character Progression for the character level curve rather than remove access to it, and SHALL not display an Experience table.

A passive talent rank SHALL show its changes to pets after its own changes. A change to pets SHALL name the pets as the game does: "Your beast" for the Hunter's beast, the NPC whose summons change, or "Summons" for every pet. The changes to the same pets SHALL share one line.

#### Scenario: Offered class
- **WHEN** a reader opens Shieldmaster
- **THEN** Starting gear, then Bastion Breaker, Guardian, Templar, Aegis Mastery, and Heroic Ascension remain reachable in order
- **AND** the page links Character Progression

#### Scenario: Class that no race offers
- **WHEN** no race offers a class
- **THEN** the class has no page and an authored requirement that names the class remains readable without a broken link

#### Scenario: Passive talent with five ranks
- **WHEN** Aegis Discipline gives 2 Block chance at rank 1 and 10 at rank 5
- **THEN** its row shows both ranked effects

#### Scenario: Talent tree with its own talent points
- **WHEN** Heroic Ascension uses Heroic Essence
- **THEN** its tree identifies that point type

#### Scenario: Talent that changes the Hunter's beast
- **WHEN** Bonded Fury gives the Hunter's beast 2 Damage Dealt at rank 1 and 10 at rank 5, and Damage Dealt is a percentage stat
- **THEN** its row shows "Your beast: +2% Damage Dealt" at rank 1 and "Your beast: +10% Damage Dealt" at rank 5

#### Scenario: Talent that changes the summons of one NPC
- **WHEN** Bone Bulwark gives Skeleton Warrior summons 2% Health at rank 1
- **THEN** its row names Skeleton Warrior and shows +2% Health

#### Scenario: Talent that changes the character and the beast
- **WHEN** Pathfinding gives the character and the Hunter's beast 1% Movement Speed at rank 1
- **THEN** its row shows the character's change on one line and the beast's change on the next line

#### Scenario: Tree costs beside the trees
- **WHEN** a reader scrolls through the talent trees of Shieldmaster
- **THEN** the side still shows each tree with the Talent Points that learning it in full takes
- **AND** Heroic Ascension shows its cost in Heroic Essence
- **AND** Heroic Essence links the Essence section of the Heroic Tier guide

### Requirement: Skill pages show recipes and levels

Each non-excluded skill SHALL have a page. Its strip SHALL show available highest level, recipe count, gathering node count, and experience to highest level. The answer SHALL show each verified experience source—craft, gather, or auto-attack hits—with a linked example range; it SHALL not assign an unverified source. Its side SHALL retain the level curve chart and level control when a level template and highest level above one exist, and link to Character Progression. Its sections SHALL show Recipes grouped by required-level bands and Gathering nodes by gate. A recipe without a published product SHALL retain its anchored row; a skill with no levels SHALL omit a fictitious curve.

#### Scenario: Crafting skill
- **WHEN** a reader opens Alchemy
- **THEN** its Recipes section retains all 22 published recipes with products, stations, and levels, linked to product Crafting anchors when available

#### Scenario: Recipe without a product
- **WHEN** Demonic Bulwark Looted has no published product
- **THEN** its skill page retains an anchored recipe row without a product link

#### Scenario: Gathering skill
- **WHEN** a reader opens Mining
- **THEN** its nodes link with skill gates and yields, and gathering is labeled as a verified experience source

#### Scenario: Weapon skill
- **WHEN** a reader opens Axes
- **THEN** its level curve and auto-attack experience source remain available without an Experience table

#### Scenario: Skill without levels
- **WHEN** a published skill has a highest level of zero
- **THEN** it has no level curve but retains its Character Progression link

#### Scenario: Known call site without a verified skill mapping
- **WHEN** an experience call site cannot be tied to a skill
- **THEN** the skill page does not assign it to that skill

### Requirement: Existing long detail pages use section navigation

Class, creature, place, item, and other detail pages SHALL list only their rendered, navigable sections in page order. An answer or side stepper SHALL not be counted as a relation section unless it exposes a stable section anchor. Conditional sections SHALL enter and leave the list with their content; existing section IDs, recipe anchors, and row anchors SHALL remain valid. Talent tree links SHALL reveal the owning tab before scrolling.

#### Scenario: Class talent sections
- **WHEN** Shieldmaster shows its trees and Starting gear
- **THEN** navigation names each reachable tree and Starting gear without listing a removed Experience section

#### Scenario: NPC without stock
- **WHEN** a creature has no vendor stock and at least four other sections
- **THEN** navigation omits Sells and links the rendered sections

#### Scenario: Place and item source sections
- **WHEN** a place or item has four rendered sections
- **THEN** navigation reaches only sections shown on that page

### Requirement: Recipe items and recipes link each other

A recipe item with a captured Recipe RankUp action SHALL show Teaches as a recipe equation with linked product, materials, station, required skill and level, plus an entity-specific experience sentence and guide-section link when supported. It SHALL not duplicate the product's game tooltip. A product's Crafting section SHALL link each known teaching item. An unknown teacher SHALL not be described as nonexistent.

#### Scenario: Recipe item teaches a recipe
- **WHEN** Recipe: Runeweave Regalia teaches Runeweave Regalia
- **THEN** its Teaches equation links the product and shows its Tailoring station, level 150, and materials without a second product tooltip
- **AND** the product's Crafting section links back to the recipe item

#### Scenario: Recipe has no known teaching item
- **WHEN** no captured item action teaches a recipe
- **THEN** the product names no teaching item and makes no claim that none exists
- **AND** coverage still records the missing teacher

### Requirement: Pages show the rules placed on them

Reviewed rules SHALL remain available in their section of their mechanics guide. An entity page SHALL show only supported computed values relevant to its fact or section, in plain language, with a link to the corresponding guide section. Each section that receives a placed rule SHALL show that link. It SHALL NOT reproduce rule prose in sections, label hints, or hover cards. A linked placement SHALL affect only entities named by that placement. Missing verified operands SHALL not produce a fabricated computed result.

#### Scenario: Attunement rule of one node
- **WHEN** a verified rule names Small Iron Vein but not Silver Vein
- **THEN** only the named node may show its supported computed effect and guide-section link

#### Scenario: Gathering probability endpoints
- **WHEN** verified evidence supports a yield bonus at Mining level 1 and its highest level
- **THEN** the node shows the computed value at the reader's Mining level and both published values in a short sentence with a guide-section link, not the rule text

#### Scenario: Rule explains a fact
- **WHEN** a verified kill experience rule applies to a creature's experience fact
- **THEN** that fact links its applicable guide section and shows a supported computed value without rule prose in the label or its hover card

#### Scenario: Computed yield bonus
- **WHEN** Small Iron Vein has no Mining gate and verified gathering yield bonus operands
- **THEN** its Gives answer shows the bonus at the reader's Mining level and at Mining level 1 and the highest Mining level, with a guide-section link rather than a How it works rules section

#### Scenario: Items found in object chests
- **WHEN** the rules record places the object chest rule on the Found in objects section of Human Skull
- **THEN** that section links the World objects section of the Loot guide

#### Scenario: Chance that a spawner picks a node
- **WHEN** a reader sets their Mining level on Silver Vein and checks Prospector's Silver Tonic
- **THEN** the side shows the chance that a spawner picks Silver Vein at that level with that attunement
- **AND** Spawn odds shows every option of those spawners with its weight and chance at the same level

### Requirement: Currency Purchases on Item Detail Pages

Item detail pages SHALL show a Buys relation section for an item with a spendable currency conversion and purchasable merchant stock, with linked products, costs, and linked sellers. Non-currency item pages SHALL omit the section.

#### Scenario: Spendable Item
- **WHEN** a reader opens the Corrupted Emerald page
- **THEN** the page displays the products available for its currency with their costs and sellers

#### Scenario: Ordinary Item
- **WHEN** a reader opens an item without a currency conversion
- **THEN** the page omits Buys

### Requirement: Creature experience per kill includes the level bonus

A combat creature's experience per kill SHALL be the whole roll from its authored minimum experience through its authored maximum minus one, or the minimum when both are equal, plus the creature's level times its experience per level. The page and its variant table SHALL show this amount at the lowest and highest level at which the creature spawns. When the creature can spawn without a highest level, the page SHALL show the lowest amount with a plus sign. When no spawn level is published, the page SHALL show the roll and the experience per level. When the experience per level is unknown, the page SHALL NOT show experience per kill.

#### Scenario: Fixed level
- **WHEN** Brinecrest spawns at level 23, rolls 70 through 119, and has 1 experience per level
- **THEN** its page shows 93–142 experience per kill

#### Scenario: Scaling level
- **WHEN** Bat spawns near the player's level within 15–30, rolls 1, and has 1 experience per level
- **THEN** its page shows 16–31 experience per kill

#### Scenario: No published spawn
- **WHEN** a creature has no published spawn, rolls 70 through 119, and has 1 experience per level
- **THEN** its page shows 70–119, plus 1 per level

### Requirement: Place pages list their objects with loot

A place page SHALL list each object in the place that gives items when used, such as graves, locked chests, sacrificial altars, and For Sale signs. A row SHALL name the object and its choice, show its cost and its conditions as separate items, link the items that it can give, and count its spots in the place. Rows with the same name, cost, choice, and conditions SHALL merge. Placed gathering nodes SHALL stay on their node pages. A place variant SHALL list only the spots inside it.

#### Scenario: Locked chests in a zone
- **WHEN** Afallon holds Wooden Treasure Chest (Locked) objects that use up a Chest Key and need levels 1–10
- **THEN** the Afallon page lists Wooden Treasure Chest (Locked) with "Uses up 1 Chest Key" and "Levels 1–10", its spot count, and links to the items it can give

### Requirement: Place pages show what a player finds there and how to get there

A place's strip SHALL show available type, level range, and boss count. Its answer SHALL contain artwork, description, and map action. Its sections SHALL follow: Bosses with portraits, Creatures excluding bosses, NPCs, Gathering and objects with category counts, Quests, Areas; available properties and points of interest SHALL remain reachable in the appropriate section rather than disappear. The place SHALL not infer a level range where none was published.

The side SHALL show these cards when their facts exist:

- Getting there, on every place with its own map outside the overworld, and on every challenge stone. It SHALL name each place that a player enters this place from, with links to the entrance spots. Entrances from challenge stones SHALL NOT count. A challenge stone SHALL instead name the stone where it starts, the stone's region, and the number of Hearts that it uses up. A dungeon that the Dungeon Finder can send a player to SHALL say that a player can choose it in the Dungeon Finder or get it from a Random run, and that only a finished Random run gives the supply pack.
- Timed dungeon, on each timed dungeon. It SHALL show the timer, the time left that each threshold needs and the token levels that it adds, the most items that the reward bag holds besides the token, a link to the Altar of Corruption on the map, and a link to the Timed dungeons section of the Corruption guide.
- Services, with a count and a map link for each of merchants, bankers, auctioneers, flight points, quest givers, and each kind of crafting station. Townsfolk, neutral creatures, and travel points SHALL NOT count as services.

The overworld page SHALL show a Places to enter section that groups the places a player can enter from it into dungeons, challenge stones, and other places. Each row SHALL link the place, show its level range when published, and link its entrance spots.

#### Scenario: Dungeon with bosses
- **WHEN** a dungeon has four bosses and two other creatures
- **THEN** Bosses shows four portrait rows and Creatures shows two other creatures

#### Scenario: Teleport into a dungeon
- **WHEN** a teleport in Afallon leads into Barrowdeep
- **THEN** the Barrowdeep Getting there card names Afallon and links the entrance spot

#### Scenario: Dungeon Finder dungeon
- **WHEN** the Dungeon Finder can send a player to Barrowdeep
- **THEN** the Getting there card says that a player can choose Barrowdeep or get it from a Random run, and that only a finished Random run gives the supply pack

#### Scenario: Cave with copies of its entrance in challenge stones
- **WHEN** Cave (Oakenvale) is entered from Afallon and from copies of the same teleport in three challenge stones
- **THEN** its Getting there card names only Afallon

#### Scenario: Timed dungeon
- **WHEN** Barrowdeep has a 860 s timer, thresholds at 500 s and 300 s left, and a reward bag of up to 3 items
- **THEN** its Timed dungeon card shows 14 min 20 s, 8 min 20 s left for +2 token levels, 5 min left for +1, up to 3 items, and a link to its altar

#### Scenario: Places to enter from the overworld
- **WHEN** a reader opens Afallon
- **THEN** a Places to enter section lists its dungeons, challenge stones, and other places in three groups with entrance links
- **AND** the side shows no connection list

#### Scenario: NPCs without services
- **WHEN** a place has merchants and bankers
- **THEN** the Services card counts them, and the NPC section lists the NPCs without a services list

### Requirement: Class pages link to the gear they can use

Each published class page SHALL link to the item list with that class selected in its Usable by filter and the Weapon and Armor item types selected in its Type filter, so that the list shows only gear. The link SHALL use the same URL as selecting those filters. The page SHALL NOT describe the linked items as ranked or recommended.

#### Scenario: Gear from a class page
- **WHEN** a reader follows the gear link on the Shieldmaster page
- **THEN** the item list opens with Shieldmaster selected in Usable by and Weapon and Armor selected in Type
- **AND** it lists no potion or material
- **AND** reloading the page keeps the selection

### Requirement: Place pages name the races that start there

A place where new characters of at least one playable race start SHALL say so in its Getting there card. When every playable race starts there, the card SHALL say that new characters start there. Otherwise it SHALL name the races that do. The card SHALL show this even when the place has no entrance.

#### Scenario: Every race starts in one place
- **WHEN** every playable race starts new characters in Abandoned Quarry (Level 1–5)
- **THEN** its Getting there card says that new characters start there

#### Scenario: One race starts elsewhere
- **WHEN** only Orc characters start in a place
- **THEN** that place's card says that new Orc characters start there

### Requirement: Pages compute values at the reader's levels

The site SHALL remember the character level and the skill levels that a reader sets on any page, across pages and visits, in the browser. A page that computes a value from one of these levels SHALL start at the remembered level, or at a stated default before the reader sets one, and SHALL show the control that changes it next to the value, so that no remembered level changes a value out of sight. A level outside a control's range SHALL show at the nearest end without changing the remembered level.

#### Scenario: Level carries to another page
- **WHEN** a reader sets their Fishing level to 75 on Golden Swirl and opens Teeming Fishing Hole
- **THEN** its Fishing level control starts at 75 and its chance uses level 75

#### Scenario: First visit
- **WHEN** a reader who has set no Fishing level opens a fishing node
- **THEN** its control starts at level 1 and shows that level
