## MODIFIED Requirements

### Requirement: Detail pages share one structure

Every entity detail page SHALL show a breadcrumb, title block, answer, applicable side facts, and ordered relation sections. At widths of at least 1024 px the page SHALL use a main column and a 20rem side column beginning beside the title; the side column SHALL remain available while scrolling. At narrower widths the order SHALL be title, answer, side facts, relations. An applicable single stat strip beneath the title SHALL hold no more than five decisive facts. A page with at least four rendered sections SHALL offer section navigation. No fact SHALL repeat in adjacent title, strip, answer, and side content.

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

### Requirement: Long relation tables show their first rows

A relation with more than eight rows SHALL preview its first eight in its current sort order and offer Show N more, where N is the number of hidden rows. An address that names a hidden row SHALL reveal it and scroll to it; this SHALL also work inside a hidden tab or closed disclosure.

#### Scenario: Long drop list
- **WHEN** an NPC has 22 drop rows
- **THEN** the section shows eight rows and a Show 14 more control

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

Sections SHALL label probabilities, quantities, and conditions in plain language sufficient to interpret the shown values without another page. A short computed sentence MAY explain an entity-specific value; rule prose SHALL instead live in the relevant guide step linked by a quiet How it works action. Labels and explanatory hints SHALL work on hover, focus, and tap, but SHALL NOT contain copied rule text or require a hover card to understand a fact.

#### Scenario: NPC drops
- **WHEN** an NPC's loot table rolls on 5% of kills
- **THEN** its Drops heading identifies the table's roll chance, separately from each item's conditional chance
- **AND** a guide link explains the rule without a rules paragraph beneath the rows

### Requirement: Facts carry information

A page SHALL NOT show a stat whose amount is zero. A creature whose roles are all friendly services SHALL NOT show respawn, kill experience, or aggro range as combat summary facts. The friendly services are quest giver, merchant, townsfolk, banker, auctioneer, and flight point.

#### Scenario: Friendly merchant
- **WHEN** a merchant has only the merchant role
- **THEN** its answer and strip omit respawn, kill experience, and aggro range

#### Scenario: Stat of zero
- **WHEN** an NPC record gives Health of 0
- **THEN** its page does not present Health as a key stat

### Requirement: NPC pages show who the NPC is, where it is, and what it gives

When available, a combat creature's strip SHALL show level, health, experience per kill, and respawn. Its answer SHALL show Drops sorted by chance, with the loot roll in the heading and a second loot table as a labeled group. The side SHALL hold combat stats, faction, aggro range, immunities, and abilities as chips, and preserve other secondary facts without repeating the answer. Its remaining sections SHALL follow: Where to find grouped by place with counts, Sells, Quests, Variants. Each quest SHALL name whether the creature gives, completes, or is an objective; differing variant and placement facts SHALL remain accessible. A friendly service NPC SHALL not gain fabricated combat facts.

#### Scenario: Boss of one place
- **WHEN** an NPC is boss of one place
- **THEN** its title links that place without a duplicate Boss of section

#### Scenario: Quest target and quest giver
- **WHEN** an NPC gives one quest and is an objective in another
- **THEN** its Quests section has one row per quest with the correct role

### Requirement: Quest pages follow the course of the quest

A quest's strip SHALL show available quest level, experience, main reward, and chain step. Its answer SHALL show objectives as a numbered checklist with target and required count, and identify who starts and ends the quest with their places and map links when known. The side SHALL show requirements and a vertical chain stepper identifying the current step. Sections SHALL follow: Rewards, Unlocks. Offer, objective, and completion text and world changes SHALL remain available in closed blocks at the end. A quest without a chain SHALL omit the stepper; it SHALL retain available repeatability, world quest timing, minimum level, and dungeon context without inventing values.

#### Scenario: Quest in a chain
- **WHEN** a quest is step 5 of 5
- **THEN** the side stepper links five steps and marks step 5 with a word as well as visual state

#### Scenario: Quest outside a chain
- **WHEN** a quest belongs to no chain
- **THEN** it shows no chain stepper

### Requirement: Place pages list what a player finds there

A place's strip SHALL show available type, level range, boss count, and creature count. Its answer SHALL contain artwork, description, and map action. The side SHALL show its parent place and connections. Its sections SHALL follow: Bosses with portraits, Creatures excluding bosses, NPCs and services, Gathering and objects with category counts, Quests, Areas; available properties and points of interest SHALL remain reachable in the appropriate section rather than disappear. Connections SHALL still merge identical destinations by direction and count distinct spots, and shall retain verified source positions. The place SHALL not infer a level range where none was published.

#### Scenario: Dungeon with bosses
- **WHEN** a dungeon has four bosses and two other creatures
- **THEN** Bosses shows four portrait rows and Creatures shows two other creatures

#### Scenario: Several teleports to one place
- **WHEN** a place has four teleports to Afallon
- **THEN** the side lists one To Afallon connection with four spots

#### Scenario: Teleport into the place
- **WHEN** a teleport in Afallon leads into Duskfall Depths
- **THEN** the destination page lists a From Afallon connection to its verified source spot

#### Scenario: Leftover copy of a teleporter
- **WHEN** Cave (Coalway Woods 1) has an off-map copy of a Duskfall Depths entrance also on Challenge Stone Blood's game map
- **THEN** only the verified Challenge Stone Blood connection is shown on its source and destination pages

#### Scenario: Teleport outside its map without a copy
- **WHEN** the Sanctum of the Veilpiercer exit begins outside its map without another verified copy
- **THEN** the sanctum retains its To Afallon connection

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

Only classes offered by a published race SHALL have pages. A class strip SHALL show races, weapon types, highest level, and talent tree count when known. Its answer SHALL present playstyle and auto attack. Its side SHALL present talent point gains. Talent trees SHALL remain in authored order with the established tabbed List/Grid views and row anchors, followed by Starting gear. The page SHALL link to Character Progression for the character level curve rather than remove access to it, and SHALL not display an Experience table.

#### Scenario: Offered class
- **WHEN** a reader opens Shieldmaster
- **THEN** Bastion Breaker, Guardian, Templar, Aegis Mastery, Heroic Ascension, and Starting gear remain reachable in order
- **AND** the page links Character Progression

#### Scenario: Class that no race offers
- **WHEN** no race offers Hunter
- **THEN** it has no page and an authored Hunter requirement remains readable without a broken link

#### Scenario: Passive talent with five ranks
- **WHEN** Aegis Discipline gives 2 Block chance at rank 1 and 10 at rank 5
- **THEN** its row shows both ranked effects

#### Scenario: Talent tree with its own talent points
- **WHEN** Heroic Ascension uses Heroic Essence
- **THEN** its tree identifies that point type

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

A recipe item with a captured Recipe RankUp action SHALL show Teaches as a recipe equation with linked product, materials, station, required skill and level, plus an entity-specific experience sentence and guide-step link when supported. It SHALL not duplicate the product's game tooltip. A product's Crafting section SHALL link each known teaching item. An unknown teacher SHALL not be described as nonexistent.

#### Scenario: Recipe item teaches a recipe
- **WHEN** Recipe: Runeweave Regalia teaches Runeweave Regalia
- **THEN** its Teaches equation links the product and shows its Tailoring station, level 150, and materials without a second product tooltip
- **AND** the product's Crafting section links back to the recipe item

#### Scenario: Recipe has no known teaching item
- **WHEN** no captured item action teaches a recipe
- **THEN** the product names no teaching item and makes no claim that none exists
- **AND** coverage still records the missing teacher

### Requirement: Pages show the rules placed on them

Reviewed rules SHALL remain available on their mechanics guide with their evidence in the guide's closed rule list. An entity page SHALL show only supported computed values relevant to its fact or section, in plain language, with a link to the corresponding guide step. It SHALL NOT reproduce rule prose in sections, label hints, or hover cards. A linked placement SHALL affect only entities named by that placement. Missing verified operands SHALL not produce a fabricated computed result.

#### Scenario: Attunement rule of one node
- **WHEN** a verified rule names Small Iron Vein but not Silver Vein
- **THEN** only the named node may show its supported computed effect and guide-step link

#### Scenario: Gathering probability endpoints
- **WHEN** verified evidence supports a yield bonus at Mining level 1 and its highest level
- **THEN** the node shows both computed values in a short sentence with a guide-step link, not the rule text

#### Scenario: Rule explains a fact
- **WHEN** a verified kill experience rule applies to a creature's experience fact
- **THEN** that fact links its applicable guide step and shows a supported computed value without rule prose in the label or its hover card

#### Scenario: Computed yield bonus
- **WHEN** Small Iron Vein has no Mining gate and verified gathering yield bonus operands
- **THEN** its Gives answer shows the bonus at Mining level 1 and at the highest Mining level, with a guide-step link rather than a How it works rules section
