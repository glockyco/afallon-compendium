# detail-pages Specification

## Purpose

Give every entity detail page one structure that answers a player's questions in a fixed order, with no side-by-side cards, no empty or repeated content, and explanations in place.

## Requirements

### Requirement: Detail pages share one structure

Every entity detail page SHALL show a breadcrumb, title block, answer, applicable side facts, and ordered relation sections. At widths of at least 1024 px a page with side facts SHALL use a main column and a 20rem side column beginning beside the answer, below the title block; the side column SHALL remain available while scrolling without a scroll area of its own, so the wheel over it scrolls the page. A side column that fits the window SHALL stay below the window's top edge while the page scrolls. A taller side column SHALL scroll with the page until its far edge in the scrolling direction is in view, and SHALL then stay there, so page scrolling alone reaches every part of it. A page without side facts SHALL give its main column the full width instead of reserving an empty side column. Every side card SHALL share one card frame. At narrower widths the order SHALL be title, answer, side facts, relations. An applicable single stat strip beneath the title SHALL hold no more than five decisive facts. A page with at least four rendered sections SHALL offer section navigation. No fact SHALL repeat in adjacent title, strip, answer, and side content.

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

#### Scenario: Page without side facts
- **WHEN** a page supplies no side facts
- **THEN** its title, answer, and sections use the full width and no empty column appears beside them

#### Scenario: Wheel over the side column
- **WHEN** a reader turns the mouse wheel with the pointer over the side column of a page longer than the window
- **THEN** the page scrolls, and the side column does not scroll inside itself

#### Scenario: Side column taller than the window
- **WHEN** a reader scrolls down a long NPC page whose side column is taller than the window
- **THEN** the side column scrolls with the page until its end is in view and then stays there
- **AND** scrolling back up brings the column's start into view before the page reaches its top

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

The primary answer SHALL be a distinct card in the main column. The game's item or ability tooltip SHALL appear once in the side column at wide widths and after the answer on narrow screens. An ability without a known learner or user SHALL keep its tooltip in that same narrow side column, while its primary answer shows what it does and one quiet missing-source line. A place's artwork and description SHALL be part of its answer. NPC portraits, class and skill icons SHALL identify their title or relation row; descriptions and secondary stats SHALL appear once in the answer or side facts. A missing image SHALL not create an empty image frame. No side panel SHALL stretch just to match another panel's height.

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

A combat creature with a published encounter SHALL show its useful level and positive health in a side facts card, with positive experience per kill and respawn as secondary facts when applicable. A lone fact SHALL sit in the title identity line instead of occupying a full stat strip. Its answer SHALL show Drops sorted by chance, with the loot roll in the heading and a second loot table as a labeled group. An adventurer without drops SHALL instead answer with its Gear: the published chance that a finished job takes an upgrade from the reward gear list, a link to that list, and the items and types of its own gear kit when it has one. An NPC without drops SHALL not lead with an empty Drops answer. A friendly NPC without drops SHALL lead with its published service or flight destinations, when present. Text that applies to every NPC SHALL call it an NPC or name it, and SHALL reserve "creature" for NPCs that you fight. An adventurer's gear preference SHALL be named as the gear that it prefers, with its armor type, weapon types, and favoured stat, and SHALL NOT be described as what its kills drop. The side SHALL use the common side-card frame for meaningful combat stats, faction, aggro range, and immunities without repeating the answer, and SHALL omit the column when it has no useful content. Negative health and unplaced default combat values SHALL NOT appear as facts. When the published kill experience has its level difference and the character level cap, the side SHALL show the experience per kill at the reader's remembered character level, with its level control, the creature level at that character level, and a link to the kill calculator. Its remaining sections SHALL prioritize the NPC's available stock, quests, or abilities ahead of secondary placement, with Where to find grouped by place with counts when there is a published spot, followed by variant differences. A missing spot SHALL be omitted rather than presented as a framed no-location answer. Each quest SHALL name whether the creature gives, completes, or is an objective; differing variant and placement facts SHALL remain accessible. A friendly service NPC SHALL not gain fabricated combat facts. An adventurer page SHALL show no respawn time, because a world adventurer returns through its scene's spawn pool and not after its record's respawn time, and SHALL show kill experience only when a kill gives experience. An adventurer of the world roster SHALL show its class with a linked entity preview, its race, and its party role in a compact facts card, with a link to the adventurer roster mechanics, and an adventurer without a role of its own SHALL read Damage by default. Its Gear card SHALL open with its gear preference. Its side SHALL show an Arrival card with its starting level, when it joins, and a link to the guide on inviting it. Where it has no known location, Where to find SHALL say that the Friends panel finds it once it has joined. A Talents section SHALL name its class, its preferred talent tree linked to that tree on its class page, and the abilities that it learns first. A roster adventurer takes its stats from its race and class at its level, so its page SHALL show no stats of its NPC record. An NPC's abilities SHALL be a section of the main column. An NPC that fights with the abilities of its class instead of the phase abilities of its record SHALL show no phase abilities, and ability pages SHALL NOT name it among the NPCs that use an ability.

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
- **THEN** the side reads Gear preference: Leather armor, Staff, favours Strength, with a link to the Adventurers mechanics page's gear section

#### Scenario: Experience at the reader's level
- **WHEN** a reader at character level 15 opens a creature that spawns at levels 10 to 20 and scales with the player
- **THEN** its Experience per kill card shows the experience of a level 15 kill, computed as the kill calculator computes it without followers, Heroic, or bonuses

#### Scenario: Adventurer without a respawn time
- **WHEN** a reader opens Eldeth Goldvein, whose NPC record says 1 to 2 minutes
- **THEN** the page shows no respawn time and no experience per kill

#### Scenario: Adventurer facts
- **WHEN** a reader opens Eldeth Goldvein
- **THEN** her page names Druid, Dwarf, Tank, Primal Feral linked to that tree on the Druid page, the abilities she learns first starting with Bear Form, her starting level, and when she joins

#### Scenario: Class abilities instead of phase abilities
- **WHEN** a reader opens Eldeth Goldvein
- **THEN** the page lists no Bleeding Strike, Brutal Slice, or Toxic Fang, and the Bleeding Strike page does not name Eldeth among its users

#### Scenario: Adventurer page layout
- **WHEN** a reader opens Agra Emberhide
- **THEN** the side facts show a linked Druid class, Orc, and Tank, the Gear card opens with her preference for Leather armor and Staff, her Arrival card shows starting level 10 and that she joins at the start, and Talents lists the abilities that she learns first
- **AND** the page shows no Health, Strength, Movement Speed, or Spirit

#### Scenario: Unplaced NPC with abilities
- **WHEN** an NPC has no published location, drops, or vendor stock but has abilities
- **THEN** its abilities lead the page instead of an empty Drops or Where to find card, and unplaced respawn, experience, and aggro defaults are not advertised

#### Scenario: Flight master with a named station
- **WHEN** the flight network names the flight master's departure stop but no world placement is available
- **THEN** the NPC answers with that stop, destinations and connection status, common free fare once, and the verified travel-time rule without claiming a map location

#### Scenario: Negative NPC health
- **WHEN** a creature's published stat amount for Health is negative
- **THEN** neither the title nor side cards present it as health

### Requirement: Quest pages follow the course of the quest

A quest's identity SHALL show its type, available quest level, and chain step without a lone stat strip. Its answer SHALL show objectives as a numbered checklist with target and required count, keeping time and item-retention hints visually distinct from the instruction and count. It SHALL identify who starts and ends the quest with their places and map links when known. The side SHALL show requirements and a vertical chain stepper identifying the current step. Sections SHALL follow: Rewards, Unlocks. Offer, objective, and completion text and world changes SHALL remain available in closed blocks at the end. A quest without a chain SHALL omit the stepper. It SHALL retain available experience, repeatability, world quest timing, minimum level, and dungeon context without inventing values. Full world quest timing SHALL sit behind disclosure, after the actionable objective and reward.

#### Scenario: Quest in a chain
- **WHEN** a quest is step 5 of 5
- **THEN** the side stepper links five steps and marks step 5 with a word as well as visual state

#### Scenario: Quest outside a chain
- **WHEN** a quest belongs to no chain
- **THEN** it shows no chain stepper

#### Scenario: World quest with one objective
- **WHEN** a world quest has one objective and completes automatically
- **THEN** its objective and start are readable before the full timing disclosure

#### Scenario: World quest with several start spots
- **WHEN** an active world quest starts at three spots
- **THEN** its start names three spots with one map link rather than three adjacent numbered links

### Requirement: Property pages show the purchase

A property page SHALL show its type and place in the title. Its answer SHALL use the full width without a side column and show the available picture once, beside the price, income per payment, and sell price when known, followed by where to buy it with the for-sale signs and a map action. It SHALL not claim an interval or currency without confirmed facts.

#### Scenario: Property with one sign
- **WHEN** a property has one for-sale sign
- **THEN** its answer identifies the sign's area and a map action opens it

#### Scenario: Property purchase on a wide screen
- **WHEN** a reader opens Coalway Swamp Fishing Hut at 1440 px
- **THEN** its picture sits beside the purchase price, income, and sell price in the answer, the for-sale sign follows, and no side column appears

### Requirement: Ability pages compare versions

An ability without an effect, description, learner, creature user, item use, or applied effect SHALL be withheld by a reviewed exclusion with catalog evidence checked at publication, and references to it SHALL remain readable as plain text. Other ability pages SHALL choose the tooltip version with most users and the first in a tie. An ability with known learners or users SHALL identify them in its answer and put the game tooltip in the side column. An ability without a known learner or user SHALL give the applied effects or described outcome in the primary answer, keep the game tooltip narrow in the side column, and give one short missing-source line. Costs and activation requirements SHALL remain in the tooltip. Applied effects SHALL appear as linked outcomes beside or below the game tooltip, with their ability rank, chance, target in player words, and duration in human units when published. These rows SHALL use the same application evidence as each effect page's Applied by list and omit withheld effects. When multiple versions exist, a Versions section SHALL compare them side by side in the layout of creature versions: one column per version and one row per fact. The rows SHALL be the version's text, the effects it applies when any version applies effects, its use requirements and its learning classes when the versions differ in them, and its users when any version has users. A version without a value in a row SHALL read None. Each version's users SHALL show their first eight links and a Show N more control, and the answer's Show all link SHALL open every version's users. Teaching items and all usable rank links SHALL remain available without repeating the tooltip.

#### Scenario: Ability with five versions
- **WHEN** an ability has five versions
- **THEN** Versions compares five and Used by groups users under the correct version

#### Scenario: Ability from a talent tree
- **WHEN** a reader opens Maul
- **THEN** the answer links Druid's Primal Feral tier 2 talent and its tooltip identifies the Ursine Aspect condition

#### Scenario: Ability of a class that no race offers
- **WHEN** only a class without a page learns an ability
- **THEN** Learned by names that class as plain text and the tooltip still shows its costs

#### Scenario: Internal timer-only ability
- **WHEN** AoE Rock Attack has only cast timing and no known learner or user
- **THEN** it has no page, and its name remains readable wherever referenced

#### Scenario: Effectful ability without a known user
- **WHEN** a reader opens AoE Cursed
- **THEN** its linked combat effects appear in the primary answer, the narrow game tooltip sits in the side column, and no empty users card appears

#### Scenario: Reciprocal applied effects
- **WHEN** Beacon of Dawn applies Beacon of Dawn Hot to a target for 10 seconds
- **THEN** Beacon of Dawn links the effect beside its tooltip and the effect links back to Beacon of Dawn under Applied by with the same rank and target

#### Scenario: Multiple effects from one ability
- **WHEN** an ability applies two effects with different ranks, chances, targets, or durations
- **THEN** each linked outcome retains its own published context, including its version where several ability versions exist

#### Scenario: Long applied-effect duration
- **WHEN** an ability applies an effect for 120 seconds
- **THEN** the effect outcome reads 2 minutes instead of 120 seconds

#### Scenario: Nine versions on a wide screen
- **WHEN** a reader opens Weapon Strike, whose nine versions have no users
- **THEN** Versions shows three blocks of three versions
- **AND** no Used by row appears

#### Scenario: Versions learned by different classes
- **WHEN** only the second of four Frostbolt versions is learned by the Wizard
- **THEN** the Learned by row links Wizard under Version 2 and reads None under the others

### Requirement: Class pages show how a class progresses

Only classes offered by a published race SHALL have pages. A side facts card SHALL link available races and show the highest level when known, without repeating the talent tree count. A separate gear card SHALL show weapon types. Its answer SHALL present playstyle and auto attack. Its side SHALL stay in view beside the trees and SHALL present how the class gains talent points, each talent tree with the points that learning every rank of every node takes and a link to its tab, the weapon types, and the gear link. A tree whose points differ from the most common points of the class SHALL name them with its cost. Where a mechanics page explains how those points are earned, such as Heroic Essence in the Heroic Tier mechanics page, the tree and the side SHALL link that mechanics page section. A class whose starting gear is all equipped SHALL state that once above the table and omit its Equipped column. A class with mixed equipped and unequipped gear SHALL keep the column. The Web SHALL initially focus one arm with talent links at least 24 px wide at 390 px and offer a tree focus navigator while preserving pan, zoom, and List. A rank costs its own unlock cost, and the first rank of an ability that the class knows from the start SHALL cost nothing. Starting gear SHALL come before the talent trees, which SHALL remain in authored order with row anchors. The talent trees SHALL have two views, switchable with tabs: Web, the default, which lays out every tree of the class as the game's talent screen does, with the game's positions and requirement lines, and List, which shows each tree as a table in its own tab. Both views SHALL render every tree and talent anchor, so a link to a talent or a tree selects it in the reader's current view. Every talent SHALL show its icon. The web SHALL let a reader move it, zoom it, and select a talent to see its ranks, effect, requirements, and the talents that it unlocks. Selecting a talent SHALL highlight every talent that it needs, back to the first tier of its tree, with the lines between them, and the talents that it unlocks. Selecting a talent in the web SHALL move neither the page nor the web, except that the web SHALL glide to a selected talent outside its view at the same zoom. A link to a talent or a tree from elsewhere on the page SHALL scroll the page only as far as needed to show the whole web. The page SHALL link to Character Progression for the character level curve rather than remove access to it, and SHALL not display an Experience table.

A passive talent rank SHALL show its changes to pets after its own changes. A change to pets SHALL name the pets as the game does: "Your beast" for the Hunter's beast, the NPC whose summons change, or "Summons" for every pet. The changes to the same pets SHALL share one line.

#### Scenario: Offered class
- **WHEN** a reader opens Shieldmaster
- **THEN** Starting gear, then Bastion Breaker, Guardian, Templar, Aegis Mastery, and Heroic Ascension remain reachable in order
- **AND** the page links Character Progression

#### Scenario: Playable races on a class page
- **WHEN** a reader opens Druid
- **THEN** its race names link to their pages without a second talent tree count in the side facts

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
- **AND** Heroic Essence links the Essence section of the Heroic Tier mechanics page

#### Scenario: Web as in the game
- **WHEN** a reader opens Shieldmaster
- **THEN** the Web view shows its five trees as wedges around the centre, each talent at the position that the game's talent screen gives it, with lines from each talent to the talents that require it

#### Scenario: Link to a talent keeps the view
- **WHEN** a reader in the List view follows the requirement link to Weighted Strikes
- **THEN** the List view stays open and shows Weighted Strikes, and the same link from the Web view selects Weighted Strikes in the web

#### Scenario: Selecting does not move the page
- **WHEN** a reader scrolls the web to the middle of the window and selects Cleaving Might, then follows its Unlocks link to Momentum of War
- **THEN** the page and the web stay where they are, both talents being in view, and the card under the web describes each talent in turn

#### Scenario: Requirement chain
- **WHEN** a reader selects Hemorrhage Expert in the Assassin web
- **THEN** Opened Veins and Bleeding Strike, which it needs in turn, light up with their lines, as does Bloodsoaked, which it unlocks

#### Scenario: Class gear with mixed equipped states
- **WHEN** Hunter has equipped and unequipped starting gear
- **THEN** the Equipped column shows the distinction

#### Scenario: Touch navigation in a talent web
- **WHEN** a reader opens Druid on a 390 px screen
- **THEN** the web's interactive talent links have targets at least 24 px wide and high, and tree navigation stays available through focus controls without losing Web pan, zoom, or List

### Requirement: Skill pages show recipes and levels

Each non-excluded skill SHALL have a page. Its side facts card SHALL show available highest level, recipe count, gathering node count, and experience to highest level. The answer SHALL show each verified experience source—craft, gather, or auto-attack hits—with a linked example range; it SHALL not assign an unverified source. Its side SHALL offer the level curve chart and level control behind an openable progression detail when a level template and highest level above one exist, and link to Character Progression. A weapon skill SHALL link matching weapon categories in its primary answer. Its sections SHALL show Recipes grouped by required-level bands and Gathering nodes by gate. A shared recipe station SHALL appear once above the rows. A row with no station SHALL say so while mixed station names SHALL remain visible in their rows. A recipe without a published product SHALL retain its anchored row; a skill with no levels SHALL omit a fictitious curve.

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
- **THEN** the answer says an axe hit awards 2 skill experience until level 300, links all axes, and retains its level curve without an Experience table

#### Scenario: Skill without levels
- **WHEN** a published skill has a highest level of zero
- **THEN** it has no level curve but retains its Character Progression link

#### Scenario: Known call site without a verified skill mapping
- **WHEN** an experience call site cannot be tied to a skill
- **THEN** the skill page does not assign it to that skill

#### Scenario: Smithing station exception
- **WHEN** Smithing recipes share a station except for one without a listed station
- **THEN** the common station is stated once, with the exception identified on its row

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

A place's identity SHALL show its type and available level range without a lone stat strip. Its answer SHALL show the place's artwork as a banner and its description, followed by the most useful available inhabitants, quests, or places to enter with links to their sections. Its sections SHALL follow: Bosses with portraits, Creatures excluding bosses, NPCs, Gathering and objects with category counts, Quests, Areas. Available properties and points of interest SHALL remain reachable in the appropriate section rather than disappear. The place SHALL not infer a level range where none was published. When no actionable content exists, the page SHALL not display an empty answer card.

The side SHALL show these cards when their facts exist:

- Getting there, on every place with its own map outside the overworld, and on every challenge stone. It SHALL name each place that a player enters this place from, with links to the entrance spots. Entrances from challenge stones SHALL NOT count. A challenge stone SHALL instead name the stone where it starts, the stone's region, and the number of Hearts that it uses up. A dungeon that the Dungeon Finder can send a player to SHALL say that a player can choose it in the Dungeon Finder or get it from a Random run, and that only a finished Random run gives the supply pack.
- Timed dungeon, on each timed dungeon. It SHALL show the timer, the time left that each threshold needs and the token levels that it adds, the most items that the reward bag holds besides the token, a link to the Altar of Corruption on the map, and a link to the Timed dungeons section of the Corruption mechanics page.
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

#### Scenario: Descriptive zone without map space
- **WHEN** a zone has lore and published placements whose area exactly matches its name
- **THEN** its answer shows its artwork, its lore, and the count of creatures and quests from those placements, and its sections list them, without inventing a place map pin

#### Scenario: A shared creature level rule
- **WHEN** every creature in a place scales with the player's level
- **THEN** the Creatures section states the scaling rule once and each row shows its level range without repeating the rule

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

### Requirement: Small reference kinds lead with an answer

Currency, faction, gear set, crafting station, and race pages SHALL each have a single-line identity and a useful primary answer. They SHALL show a side card only for distinct facts that add information; otherwise their main content SHALL use the full width. They SHALL NOT show a full-width strip of one or two counts, reserve a desktop column without content, repeat a fact across adjacent panels, or expose default zero values as a feature. Their relation rows SHALL retain genuinely different values while sharing invariant information outside the rows.

#### Scenario: Currency acquisition
- **WHEN** a reader opens Gold Coin or Corrupted Emerald
- **THEN** the currency page offers the published item's acquisition routes with links to full item sources
- **AND** the ways to spend it and its currency item remain linked

#### Scenario: Honor without a linked item
- **WHEN** a reader opens Honor
- **THEN** the page explains battleground acquisition without claiming no source exists
- **AND** the merchants and prices are visible without an invariant seller column

#### Scenario: Crafting station
- **WHEN** a reader opens a station with map spots and recipes
- **THEN** the page shows where to find it, the linked crafting skill, and a sortable recipe list without a two-number hero strip

#### Scenario: Starting faction
- **WHEN** a new character's faction standings are shown
- **THEN** Humans starts Honored, Hostile and Hostile Elementals start Hated, and Neutral and Neutral Aggressive start Neutral
- **AND** the latter starts with 100 points toward the next stance while each stance takes 100 points to fill
- **AND** rows with differing starting points preserve that difference, while invariant thresholds and zero-only columns are stated once

#### Scenario: Race and equipment progression
- **WHEN** a reader opens any race or gear set
- **THEN** the race's starting area and linked playable classes are readily available without repeating the start
- **AND** the set's bonus tiers identify their required equipped piece counts, count each distinct piece once, and retain earlier bonuses at higher tiers

### Requirement: Content-free places are not published

A reviewed scene that has no map space, description, artwork, level, inhabitants, quest objective or placement SHALL have no place page. Its references SHALL degrade to plain text. The publication SHALL check that the recorded exclusion evidence still holds each time.

#### Scenario: An empty zone
- **WHEN** a scene has only a generic zone type and no usable place content
- **THEN** it has no search entry or place page, and a reference to it is not a broken link

### Requirement: Quest world-change items retain their entity link

An interactive-object source whose displayed name matches an item explicitly requested by that quest SHALL use that published item as a typed subject. Other sources SHALL retain their own label rather than linking an unrelated item with the same name.

#### Scenario: Egg collection source
- **WHEN** a quest objective requests Funnel Weaver Egg and its world-change interaction uses the same displayed name
- **THEN** that world-change source links the Funnel Weaver Egg item page

### Requirement: Gathering node timers remain readable

A gathering node SHALL state available experience, spots, and respawn in a side facts card. Respawn SHALL retain its published duration, round times above an hour to the nearest minute with "About" when needed, and leave the exact seconds in the Timers and ranges disclosure. Its tooltip SHALL distinguish needed items from items consumed per use.

#### Scenario: Long respawn
- **WHEN** Mireblossom has a 9,999-second respawn
- **THEN** the card shows About 2 hours 47 minutes while Timers and ranges retains the exact 2 hours 46 minutes 39 seconds

#### Scenario: Fishing consumable
- **WHEN** Fishing Hole (Coalway) requires Makeshift Angler and uses one Fish Bait
- **THEN** the tooltip separates the needed item from the bait consumed per use

### Requirement: NPC effects and portraits reflect their game identity

NPC pages SHALL link published effects whose appliers name that NPC through an ability or an adventurer invitation. An adventurer invitation SHALL describe the NPC it summons and the effect's authored pet duration in human units. NPC pages and previews SHALL show the game's authored portrait, including portraits shared by unrelated characters. A record with no usable placement, description, drops, stock, quests, abilities, or other playable relation MAY be withheld by reviewed, evidence-checked exclusion, and links to it SHALL read as plain text. A bare service-role flag without a location or matching quest or stock is not a usable service.

#### Scenario: Adventurer invitation
- **WHEN** Brughan Redthorn's invitation applies a pet effect that summons Brughan Redthorn for 3,600 seconds
- **THEN** his page links that effect and says he is summoned for 1 hour

#### Scenario: NPC ability applies an effect
- **WHEN** a creature's phase ability applies a published effect
- **THEN** the creature page links both the ability and the effect, reflecting the effect page's NPC applier

#### Scenario: Game-authored portrait shared by adventurers
- **WHEN** Brughan Redthorn and unrelated roster adventurers share the Avatar human female portrait
- **THEN** their NPC pages and previews display the game's authored portrait

#### Scenario: Content-free NPC
- **WHEN** AemonGold the Trader has no place, service, ability, drops, stock, quest, or description in published source data
- **THEN** no empty NPC page is published, and any reference to the record remains readable without a link

#### Scenario: Unreachable quest giver
- **WHEN** an NPC has a quest-giver flag but no known location, quest, description, stock, or ability
- **THEN** its role flag alone does not force the publication of an empty page

### Requirement: Relation tables build only the rows they show

A relation table SHALL build page content only for the rows that it shows. Rows that its preview hides SHALL NOT be built, on the server or in the browser, until Show N more or an address reveals them. Revealed rows SHALL be added in steps, the first step at once, so that no step blocks the page for long. A row that an address names SHALL be built before it scrolls into view.

#### Scenario: Long hidden relation
- **WHEN** a reader opens the Gold page, whose relations hold 659 rows of which 36 show
- **THEN** the page builds 36 relation rows and still offers each Show N more control with its full count

#### Scenario: Reader shows the hidden rows
- **WHEN** a reader selects Show 615 more on a relation
- **THEN** the next rows appear at once and the rest follow in steps, in the current sort order

#### Scenario: Address names a hidden row
- **WHEN** a reader opens a link to an anchor in row 400 of a previewed relation
- **THEN** the row is built, revealed, and scrolled into view

### Requirement: Game descriptions keep their line breaks

A page SHALL show a game description with the line breaks that the game shows. A run of three or more spaces between words, which the game uses to push the next phrase onto a new line in its tooltip, SHALL read as a line break. Ordinary spacing SHALL stay as it is.

#### Scenario: Mount description
- **WHEN** a reader opens Brown Mare
- **THEN** "Mounted speed 40%" and "Can't be used indoors" read on separate lines
