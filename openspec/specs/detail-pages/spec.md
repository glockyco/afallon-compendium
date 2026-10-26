# detail-pages Specification

## Purpose

Give every entity detail page one structure that answers a player's questions in a fixed order, with no side-by-side cards, no empty or repeated content, and explanations in place.

## Requirements

### Requirement: Detail pages share one structure

Every entity detail page SHALL show a breadcrumb, title block, answer, applicable side facts, and ordered relation sections.

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

#### Scenario: Detail pages share one structure
- **WHEN** A reader opens an entity detail page with applicable side facts.
- **THEN** The page shows a breadcrumb, title block, answer, side facts, and ordered relation sections.

### Requirement: Wide pages place side facts beside the answer

At widths of at least 1024 px a page with side facts SHALL use a main column and a 20rem side column beginning beside the answer, below the title block.

#### Scenario: Wide pages place side facts beside the answer
- **WHEN** A reader opens a page with side facts at 1024 px wide.
- **THEN** The page uses a main column and a 20rem side column beginning beside the answer, below the title block.

### Requirement: Side columns use page scrolling

The side column SHALL remain available while scrolling without a scroll area of its own, so the wheel over it scrolls the page.

#### Scenario: Side columns use page scrolling
- **WHEN** A reader scrolls a long page using the wheel over its side column.
- **THEN** The page scrolls, the side column remains available, and the side column has no scroll area of its own.

### Requirement: Short side columns stay below the window top

A side column that fits the window SHALL stay below the window's top edge while the page scrolls.

#### Scenario: Short side columns stay below the window top
- **WHEN** A reader scrolls a page whose side column fits the window.
- **THEN** The side column stays below the window's top edge.

### Requirement: Tall side columns expose both ends through page scrolling

A taller side column SHALL scroll with the page until its far edge in the scrolling direction is in view, and SHALL then stay there, so page scrolling alone reaches every part of it.

#### Scenario: Tall side columns expose both ends through page scrolling
- **WHEN** A reader scrolls down a page with a side column taller than the window and then scrolls back up.
- **THEN** The column moves with the page until its bottom is in view and stays there, then moves with upward scrolling until its top is in view and stays there, allowing page scrolling alone to reach every part.

### Requirement: Pages without side facts use the full width

A page without side facts SHALL give its main column the full width instead of reserving an empty side column.

#### Scenario: Pages without side facts use the full width
- **WHEN** A reader opens an entity page with no side facts at a wide width.
- **THEN** The main column uses the full width without an empty side column.

### Requirement: Side cards share a frame

Every side card SHALL share one card frame.

#### Scenario: Side cards share a frame
- **WHEN** A page displays multiple side cards.
- **THEN** Every side card uses the same card frame.

### Requirement: Narrow pages order content vertically

At widths narrower than 1024 px the order SHALL be title, answer, side facts, relations.

#### Scenario: Narrow pages order content vertically
- **WHEN** A page with side facts and relations opens at 800 px wide.
- **THEN** Its content order is title, answer, side facts, relations.

### Requirement: Title stat strips limit decisive facts

An applicable single stat strip beneath the title SHALL hold no more than five decisive facts.

#### Scenario: Title stat strips limit decisive facts
- **WHEN** A page has an applicable stat strip beneath its title.
- **THEN** The single strip holds no more than five decisive facts.

### Requirement: Pages with four sections offer navigation

A page with at least four rendered sections SHALL offer section navigation.

#### Scenario: Pages with four sections offer navigation
- **WHEN** A page renders four sections.
- **THEN** The page offers section navigation.

### Requirement: Adjacent summary content avoids repeated facts

No fact SHALL repeat in adjacent title, strip, answer, and side content.

#### Scenario: Adjacent summary content avoids repeated facts
- **WHEN** A page displays a title, stat strip, answer, and side content.
- **THEN** No fact repeats between adjacent title, strip, answer, and side content.

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

The primary answer SHALL be a distinct card in the main column.

#### Scenario: NPC without a portrait
- **WHEN** an NPC has stats but no portrait
- **THEN** its title uses a readable identity without a blank image and its available stats remain visible

#### Scenario: Place with artwork
- **WHEN** a place has artwork and a description
- **THEN** its answer presents both

#### Scenario: Class with an icon
- **WHEN** a reader opens Shieldmaster
- **THEN** its icon identifies its title and its playstyle description occupies the answer

#### Scenario: The hero shows the entity as the game shows it
- **WHEN** A reader opens an entity detail page.
- **THEN** The primary answer appears as a distinct card in the main column.

### Requirement: Game tooltips appear once in responsive positions

The game's item or ability tooltip SHALL appear once in the side column at wide widths and after the answer on narrow screens.

#### Scenario: Game tooltips appear once in responsive positions
- **WHEN** An item page is viewed at a wide width and then on a narrow screen.
- **THEN** The game's item tooltip appears once in the side column at the wide width and once after the answer on the narrow screen.

### Requirement: Abilities without sources retain their tooltip placement

An ability without a known learner or user SHALL keep its tooltip in that same narrow side column.

#### Scenario: Abilities without sources retain their tooltip placement
- **WHEN** A reader opens a wide ability page without a known learner or user.
- **THEN** The ability's tooltip remains in the same narrow side column.

### Requirement: Abilities without sources explain their effect and missing source

The primary answer for an ability without a known learner or user SHALL show what the ability does and one quiet missing-source line.

#### Scenario: Abilities without sources explain their effect and missing source
- **WHEN** A reader opens an ability page without a known learner or user.
- **THEN** The primary answer shows what the ability does and one quiet missing-source line.

### Requirement: Place answers include artwork and descriptions

A place's artwork and description SHALL be part of its answer.

#### Scenario: Place answers include artwork and descriptions
- **WHEN** A place page has artwork and a description.
- **THEN** Both the artwork and description are part of the answer.

### Requirement: Entity images identify titles or relation rows

NPC portraits, class and skill icons SHALL identify their title or relation row.

#### Scenario: Entity images identify titles or relation rows
- **WHEN** A page displays an NPC portrait, a class icon, and a skill icon.
- **THEN** Each portrait or icon identifies its corresponding title or relation row.

### Requirement: Descriptions and secondary stats appear once

Descriptions and secondary stats SHALL appear once in the answer or side facts.

#### Scenario: Descriptions and secondary stats appear once
- **WHEN** An entity page has a description and secondary stats.
- **THEN** The description and secondary stats each appear once in the answer or side facts.

### Requirement: Missing images leave no empty frames

A missing image SHALL not create an empty image frame.

#### Scenario: Missing images leave no empty frames
- **WHEN** An entity page has no available image.
- **THEN** No empty image frame appears.

### Requirement: Side panels do not stretch to match heights

No side panel SHALL stretch just to match another panel's height.

#### Scenario: Side panels do not stretch to match heights
- **WHEN** A page has side panels with different content heights.
- **THEN** No side panel stretches merely to match another panel's height.

### Requirement: Sections share one heading and one panel

Each nonempty relation section SHALL have a serif heading, its row count when applicable, at most one Show all action, and a stable anchor. A heading SHALL NOT have a decorative icon tile. A panel SHALL enclose a group of rows, not an otherwise empty section. The first eight rows SHALL preview the relation in its specified sort order; a section with more rows SHALL offer Show N more to reveal all, while preserving row anchors and the full set of facts.

#### Scenario: Empty relation
- **WHEN** an NPC sells nothing
- **THEN** its page has no Sells section

#### Scenario: Link to a section
- **WHEN** a reader selects an item acquisition route
- **THEN** the page reaches its matching full source section

### Requirement: Relation tables show only useful columns

A relation row SHALL show an icon or portrait, linked name with level/place subline when known, and at most two right-aligned comparable values: a quantity or count and one context value such as chance or price.

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

#### Scenario: Relation tables show only useful columns
- **WHEN** A relation row has a known level and place, a quantity, and a price.
- **THEN** The row shows an icon or portrait, a linked name with the known level/place subline, and at most two right-aligned comparable values, the quantity and price.

### Requirement: Relation rows omit redundant values without hiding differences

A relation row SHALL omit a repeated default or a value already established in the heading, without hiding a differing condition.

#### Scenario: Relation rows omit redundant values without hiding differences
- **WHEN** A heading establishes a default condition and one relation row has a differing condition.
- **THEN** Rows omit the repeated default, while the differing condition remains visible.

### Requirement: Shared loot rolls appear once in headings

A shared loot-list roll SHALL appear once in the section heading, separately from item odds.

#### Scenario: Shared loot rolls appear once in headings
- **WHEN** Several item rows share one loot-list roll.
- **THEN** The shared loot-list roll appears once in the section heading, separately from the item odds.

### Requirement: Labels require no game-menu knowledge

Text and number labels SHALL remain understandable without game-menu knowledge.

#### Scenario: Labels require no game-menu knowledge
- **WHEN** A reader unfamiliar with the game menus views a relation table's text and number labels.
- **THEN** The labels remain understandable without game-menu knowledge.

### Requirement: Known drop rolls show baseline Chance per Kill

An item drop SHALL show its computed Chance per Kill for a qualifying player-rewarded kill at zero Loot Chance, neutral loot bonuses, and no active drop modifiers when the full roll and eligibility are known.

#### Scenario: Known drop rolls show baseline Chance per Kill
- **WHEN** An item drop's full roll and eligibility are known.
- **THEN** The item drop shows its computed Chance per Kill for a qualifying player-rewarded kill at zero Loot Chance, neutral loot bonuses, and no active drop modifiers.

### Requirement: Level-matched gear baselines assume a prior gear drop

For level-matched gear, the stated Chance per Kill baseline SHALL also assume that the character has already received a first gear drop, so the first-gear safety restriction does not remove otherwise eligible entries.

#### Scenario: Level-matched gear baselines assume a prior gear drop
- **WHEN** A computed baseline Chance per Kill is stated for level-matched gear.
- **THEN** The baseline assumes the character has already received a first gear drop, so the first-gear safety restriction does not remove otherwise eligible entries.

### Requirement: Level-dependent chances state the reference level

A level-dependent chance SHALL state the reference creature level.

#### Scenario: Level-dependent chances state the reference level
- **WHEN** An item drop chance depends on creature level.
- **THEN** The chance states the reference creature level.

### Requirement: Small chances use approximate one-in-N interpretations

A small chance SHALL use an approximate one-in-N interpretation. Other chances MAY use a percentage.

#### Scenario: Small chances use approximate one-in-N interpretations
- **WHEN** An item drop has a small computed chance.
- **THEN** The chance uses an approximate one-in-N interpretation.

### Requirement: Uncomputable rolls use Listed Rate instead of Chance

If the full roll cannot be computed, the authored item entry rate SHALL be named Listed Rate, never Chance.

#### Scenario: Uncomputable rolls use Listed Rate instead of Chance
- **WHEN** An item entry has an authored rate but its full roll cannot be computed.
- **THEN** The authored item entry rate is named Listed Rate, never Chance.

### Requirement: Uncomputable rolls explain missing inputs

If the full roll cannot be computed, the missing input SHALL be explained.

#### Scenario: Uncomputable rolls explain missing inputs
- **WHEN** An item drop's full roll cannot be computed because a roll input is missing.
- **THEN** The missing input is explained.

### Requirement: World Loot gates remain distinct from per-kill chances

A World Loot table gate SHALL not be mistaken for an item's chance per kill.

#### Scenario: World Loot gates remain distinct from per-kill chances
- **WHEN** A drop display includes a World Loot table gate.
- **THEN** The gate is presented so it cannot be mistaken for the item's chance per kill.

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

A relation with up to ten rows SHALL show every row.

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

#### Scenario: Static merchant wares
- **WHEN** the Interior Decorator lists 41 wares behind Show more
- **THEN** all 41 linked wares appear in its prerendered HTML
- **AND** without JavaScript the extra wares can be opened through a native disclosure

#### Scenario: Linked inactive tabs
- **WHEN** a class talent or stat source has a linked ability, item, or effect in a tab that is not selected on the static page
- **THEN** the linked entity appears inside a native static disclosure without changing the hydrated tab's first view

#### Scenario: Long relation tables show their first rows
- **WHEN** A relation contains ten rows.
- **THEN** Every row is shown.

### Requirement: Long relations preview eight rows in sort order

A relation with more than ten rows SHALL preview its first eight in its current sort order and offer Show N more, where N is the number of hidden rows.

#### Scenario: Long relations preview eight rows in sort order
- **WHEN** A relation contains 15 rows in its current sort order.
- **THEN** The first eight rows in that order are previewed and a Show 7 more control is offered.

### Requirement: Detail-page expandable lists follow relation preview rules

A list on a detail page that hides rows behind Show more or Show all SHALL follow the same rule: show every row with up to ten rows, and with more than ten rows preview the first eight in the current sort order and offer Show N more, where N is the number of hidden rows.

#### Scenario: Detail-page expandable lists follow relation preview rules
- **WHEN** A detail-page list with 18 rows hides rows behind Show all.
- **THEN** The list previews its first eight rows in its current sort order and offers Show 10 more.

### Requirement: Linked rows remain available in native static disclosures

Every linked row SHALL also be present in prerendered HTML inside a native disclosure that a reader without JavaScript can open.

#### Scenario: Linked rows remain available in native static disclosures
- **WHEN** A reader without JavaScript opens a page containing linked relation rows.
- **THEN** Every linked row is present in the prerendered HTML inside a native disclosure the reader can open.

### Requirement: Addresses reveal and scroll to hidden rows

An address that names a hidden row SHALL reveal it and scroll to it. Revealing and scrolling to the named row SHALL also work inside a hidden tab or closed disclosure.

#### Scenario: Addresses reveal and scroll to hidden rows
- **WHEN** A reader opens an address naming a row inside a hidden tab and a closed disclosure.
- **THEN** The named row is revealed and scrolled to despite the hidden tab and closed disclosure.

### Requirement: Inactive talent and stat links have static disclosures

Linked entities that otherwise appear only inside an inactive talent or stat tab SHALL also have a native static disclosure so no-JavaScript readers can reach them.

#### Scenario: Inactive talent and stat links have static disclosures
- **WHEN** A reader without JavaScript opens a page where a linked entity otherwise appears only inside an inactive talent tab.
- **THEN** The linked entity is reachable through a native static disclosure.

### Requirement: Relation tables fit narrow screens

At 390 px a relation SHALL remain legible with icon, wrapping name and subline, and nonwrapping values. Additional condition or map information SHALL remain accessible through expansion or a labeled detail line. The page SHALL NOT scroll sideways.

#### Scenario: Item sources on a phone
- **WHEN** an item has container sources with differing conditions
- **THEN** each row or its expanded detail keeps the container, place, quantity, chance, and condition legible without sideways scrolling

#### Scenario: Long place name
- **WHEN** a row names Challenge Stone Logging Camp
- **THEN** its name wraps between words without clipping

### Requirement: Sections explain their own values

Sections SHALL label probabilities, quantities, and conditions in plain language sufficient to interpret the shown values without another page.

#### Scenario: NPC drops
- **WHEN** an NPC's creature-specific loot-table binding has an authored rate of 5 and no active drop modifiers
- **THEN** its Drops group identifies the table's actual 6% baseline roll chance, separately from each item's chance per kill
- **AND** when a matching mechanics rule is published, a link explains the rule without a rules paragraph beneath the rows

#### Scenario: Several loot lists
- **WHEN** a creature drops items from separate loot lists
- **THEN** each list has a distinct labeled group with a plain sentence for the number of possible items, the list-roll rule and its item selection

#### Scenario: World loot with level and rank restrictions
- **WHEN** a world-loot item can drop from elite creatures of levels 21 to 29
- **THEN** its summary identifies the level range and elite-rank restriction as eligibility, and states the range of its chances per eligible kill at zero Loot Chance
- **AND** its World Loot section names the creature level of each chance

#### Scenario: Chest and gathering sources
- **WHEN** an item is obtained from a chest and from gathering
- **THEN** the displayed chest item chance is identified as per open and the gathering yield chance as per use

#### Scenario: Cloth from creatures
- **WHEN** the game gives Humanoid and Undead creatures a 75% cloth roll and the creature's level selects a cloth tier
- **THEN** the item summary and the Cloth Loot section show the cloth's chance per kill by creature level
- **AND** the level table explains that inside a range of levels the chance moves steadily from its first value to its last

#### Scenario: Footman's World Loot And World Object
- **WHEN** Footman's Bulwark appears in level-band World Loot table 142 at creature level 10, zero Loot Chance, and after the character's first gear drop
- **THEN** its baseline World Loot chance is approximately 0.121909% per eligible player-rewarded kill, after the preceding world table and shared item cap
- **AND** a qualifying level-10 LootTable object open gives it with approximately 2.459213% chance without the World Loot table gate

#### Scenario: Unknown object guarantee
- **WHEN** an object uses a table without a published minimum and its guarantee-one action flag is not captured
- **THEN** the object row keeps the Listed Rate and names that missing guarantee instead of claiming a per-open chance

#### Scenario: Sections explain their own values
- **WHEN** A section shows an item's chance per kill.
- **THEN** Its label identifies the probability and conditions in plain language without requiring another page.

### Requirement: Computed explanations and mechanics links

A short computed sentence MAY explain an entity-specific value. Rule prose SHALL instead live in the relevant mechanics section linked by a quiet How it works action when that rule is published.

#### Scenario: Computed explanations and mechanics links
- **WHEN** A section shows an entity-specific value whose rule is published.
- **THEN** Rule prose lives in the relevant mechanics section, reached through a quiet How it works action.

### Requirement: Accessible labels and hints

Labels and explanatory hints SHALL work on hover, focus, and tap, but SHALL NOT contain copied rule text or require a hover card to understand a fact.

#### Scenario: Accessible labels and hints
- **WHEN** A reader hovers, focuses, or taps an explanatory hint.
- **THEN** The hint works for each interaction without copied rule text, and the fact is understandable without a hover card.

### Requirement: Uncomputed creature entry rates

Uncomputed creature entry rates SHALL carry the same Listed Rate explanation wherever displayed, along with a missing-input reason.

#### Scenario: Uncomputed creature entry rates
- **WHEN** An uncomputed creature entry rate appears in two sections.
- **THEN** Both displays carry the same Listed Rate explanation and a missing-input reason.

### Requirement: Separate loot-list and item chances

A creature's loot-list roll per kill SHALL be described separately from the item's chance per kill.

#### Scenario: Separate loot-list and item chances
- **WHEN** A creature's loot list and one of its items have different chances per kill.
- **THEN** The loot-list roll and item's chance per kill are described separately.

### Requirement: World Loot eligibility

World Loot SHALL name its eligible creature levels and rank restriction.

#### Scenario: World Loot eligibility
- **WHEN** World Loot is restricted to elite creatures of levels 12 to 18.
- **THEN** World Loot names levels 12 to 18 and the elite-rank restriction.

### Requirement: Level-dependent chance context

A level-dependent chance SHALL name its chosen creature level.

#### Scenario: Level-dependent chance context
- **WHEN** A displayed chance is calculated for creature level 12.
- **THEN** The chance names creature level 12.

### Requirement: Object LootTable chance completeness

Object LootTable actions with complete recorded rolls SHALL show the per-open chance at a stated player level when applicable. Otherwise they SHALL retain the listed rate with the missing input explained.

#### Scenario: Object LootTable chance completeness
- **WHEN** An Object LootTable action lacks an input needed for its per-open chance.
- **THEN** The action retains the listed rate and explains the missing input.

### Requirement: Chest and gathering probability contexts

Chest and gathering probabilities SHALL identify their per-open and per-use contexts.

#### Scenario: Chest and gathering probability contexts
- **WHEN** A section shows chest and gathering probabilities.
- **THEN** The chest probability is identified as per open and the gathering probability as per use.

### Requirement: Reader text shows no record ids or internal words

Page text, table cells, labels, descriptions, hints, accessibility text, empty states, and generated publication text SHALL NOT show a native record id or an internal enum word, such as "Mob".

#### Scenario: Variants without readable labels
- **WHEN** three variants of an NPC differ in stats but not in place, area, level, or type
- **THEN** the Versions table labels them "Version 1", "Version 2", and "Version 3"

#### Scenario: Ordinary creature
- **WHEN** an NPC has the type MOB
- **THEN** its page shows no type word

#### Scenario: Enum word and authored value in one filter
- **WHEN** the item types include the enum word QUEST_ITEM and the authored value "Fishing rod"
- **THEN** the Type filter lists "Quest Item" and "Fishing Rod"

#### Scenario: Reader sees an unknown fact
- **WHEN** a page lacks a known location, level, or chance
- **THEN** it explains that the fact is unknown rather than claiming the game has no location, level, or chance

#### Scenario: Reader text never uses internal pipeline words
- **WHEN** a reader explores a page, search result, tooltip, chart description, empty state, or generated document
- **THEN** site-authored text describes game facts or their unknown status without internal pipeline words
- **AND** genuine game names and quoted game-provided text remain faithful to the game

#### Scenario: Reader text shows no record ids or internal words
- **WHEN** An NPC with a native record id and internal enum word has a page and generated publication text.
- **THEN** Neither the id nor the enum word appears in any reader-facing text, including accessibility text.

### Requirement: Facts without pipeline terminology

Reader-facing text SHALL describe known facts and unknown gaps without pipeline terms such as published, publication, authored, recorded, captured, configured, source row, outcomes, loot weight, or a hedging setting or record.

#### Scenario: Facts without pipeline terminology
- **WHEN** A reader-facing hint explains a missing chance input.
- **THEN** It describes the unknown gap without pipeline terminology or a hedging setting or record.

### Requirement: Creature distinctions are versions

Creature distinctions SHALL read as versions instead of variants.

#### Scenario: Creature distinctions are versions
- **WHEN** A creature has distinct forms presented to the reader.
- **THEN** The distinctions are called versions, not variants.

### Requirement: Suppress redundant NPC types

The NPC type MOB SHALL NOT appear, because it marks an ordinary NPC. The NPC types BOSS, MERCHANT, and BANK SHALL NOT appear, because the roles already name them.

#### Scenario: Suppress redundant NPC types
- **WHEN** An NPC's role already identifies it as a merchant and its type is MERCHANT.
- **THEN** The NPC type MERCHANT does not appear.

### Requirement: Hide teleport internal kinds

A connection SHALL NOT show the internal kind of its teleport.

#### Scenario: Hide teleport internal kinds
- **WHEN** A connection uses a teleport with an internal kind.
- **THEN** The connection does not show that internal kind.

### Requirement: Category title case

Category values SHALL read in title case on pages, in tooltips, in list cells and filters, and on the map: item types and slots, gear types, rarities, roles and map categories, quest start types, NPC and creature types, place types, and kind labels. A short word inside a category value, such as "of", SHALL stay lowercase.

#### Scenario: Category title case
- **WHEN** A category value containing the internal word "of" appears in a filter and map tooltip.
- **THEN** Both displays use title case while keeping "of" lowercase.

### Requirement: Sentence casing and punctuation

Sentences SHALL use sentence case, with no semicolons or em dashes in rewritten text.

#### Scenario: Sentence casing and punctuation
- **WHEN** A descriptive sentence is rewritten for a page.
- **THEN** It uses sentence case and contains neither semicolons nor em dashes.

### Requirement: Facts carry information

A page SHALL NOT show a stat whose amount is zero. A creature whose roles are all friendly services SHALL NOT show respawn, kill experience, or aggro range as combat summary facts. The friendly services are quest giver, merchant, townsfolk, banker, auctioneer, and flight point.

#### Scenario: Friendly merchant
- **WHEN** a merchant has only the merchant role
- **THEN** its answer and strip omit respawn, kill experience, and aggro range

#### Scenario: Stat of zero
- **WHEN** an NPC record gives Health of 0
- **THEN** its page does not present Health as a key stat

### Requirement: NPC pages show who the NPC is, where it is, and what it gives

A combat creature with a published encounter SHALL show its useful level and positive health, with positive experience per kill and respawn as secondary facts when applicable.

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
- **THEN** the Gear card opens with her preference for Leather armor and Staff and links to the Adventurers mechanics page's gear section

#### Scenario: Experience at the reader's level
- **WHEN** a reader at character level 15 opens a creature that spawns at levels 10 to 20 and scales with the player
- **THEN** its Experience per kill card starts at creature level 15 and shows the experience of a level 15 kill, computed as the kill calculator computes it without followers, Heroic, or bonuses
- **AND** choosing creature level 18 in that card or in Combat Stats updates both the experience and the combat values for level 18

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
- **THEN** neither the title nor its Combat Stats section presents negative health as a full health value

#### Scenario: Level-dependent combat stats
- **WHEN** a reader opens Fangchill or Bandit and changes the creature level
- **THEN** the four verified combat values update for the selected level, while the level range and source place remain visible
- **AND** Eldroth, a boss that scales with the player, offers the same control, while Aquarius shows its fixed-level stats without a creature level control

#### Scenario: NPC pages show who the NPC is, where it is, and what it gives
- **WHEN** A combat creature has a published encounter with useful level, positive health, and applicable positive experience and respawn.
- **THEN** Its level and positive health are shown, with experience per kill and respawn as secondary facts.

### Requirement: Phone boss identity priority

On a phone, a boss's level and health SHALL precede a long Drops answer.

#### Scenario: Phone boss identity priority
- **WHEN** A boss page with a long Drops answer is viewed on a phone.
- **THEN** The boss's level and health appear before Drops.

### Requirement: Lone identity fact placement

A lone fact SHALL sit in the title identity line instead of occupying a full stat strip.

#### Scenario: Lone identity fact placement
- **WHEN** An NPC has only one identity fact to show.
- **THEN** The fact sits in the title identity line rather than a full stat strip.

### Requirement: Drops answer grouping and order

The NPC's answer SHALL show Drops sorted by chance, with the loot roll in the heading and a second loot table as a labeled group.

#### Scenario: Drops answer grouping and order
- **WHEN** An NPC has drops from two loot tables.
- **THEN** Drops are sorted by chance, the heading includes the loot roll, and the second table forms a labeled group.

### Requirement: Adventurer Gear answer

An adventurer without drops SHALL instead answer with its Gear: the published chance that a finished job takes an upgrade from the reward gear list, a link to that list, and the items and types of its own gear kit when it has one.

#### Scenario: Adventurer Gear answer
- **WHEN** An adventurer without drops has a published job upgrade chance and its own gear kit.
- **THEN** Gear answers with that chance, a reward gear list link, and the kit's items and types.

### Requirement: Avoid empty Drops answers

An NPC without drops SHALL not lead with an empty Drops answer.

#### Scenario: Avoid empty Drops answers
- **WHEN** An NPC has no drops.
- **THEN** Its page does not lead with an empty Drops answer.

### Requirement: Friendly service answer priority

A friendly NPC without drops SHALL lead with its published service or flight destinations, when present.

#### Scenario: Friendly service answer priority
- **WHEN** A friendly NPC without drops has published flight destinations.
- **THEN** Its page leads with those destinations.

### Requirement: NPC and creature terminology

Text that applies to every NPC SHALL call it an NPC or name it, and SHALL reserve "creature" for NPCs that you fight.

#### Scenario: NPC and creature terminology
- **WHEN** Text describes a fact applying to friendly and combat NPCs alike.
- **THEN** It uses NPC or the NPC's name rather than creature.

### Requirement: Adventurer gear preference meaning

An adventurer's gear preference SHALL be named as the gear that it prefers, with its armor type, weapon types, and favoured stat, and SHALL NOT be described as what its kills drop.

#### Scenario: Adventurer gear preference meaning
- **WHEN** An adventurer prefers an armor type, weapon types, and a stat.
- **THEN** Those are named as its gear preference, not as drops from its kills.

### Requirement: Combat Stats placement

For combat creatures with available stats, the main column SHALL show a Combat Stats section after Where to find.

#### Scenario: Combat Stats placement
- **WHEN** A combat creature has available stats and a Where to find section.
- **THEN** Combat Stats appears in the main column after Where to find.

### Requirement: Primary combat strip

The Combat Stats section's primary values SHALL be Health, Strength, Armor, and Magic armor in one bordered strip, each label above its value.

#### Scenario: Primary combat strip
- **WHEN** All four primary combat values can be calculated.
- **THEN** Health, Strength, Armor, and Magic armor appear in one bordered strip with labels above values.

### Requirement: Phone combat strip layout

On phones four values SHALL form two rows of two, and fewer SHALL stay in one row.

#### Scenario: Phone combat strip layout
- **WHEN** A phone displays four primary combat values.
- **THEN** The values form two rows of two.

### Requirement: Variable creature level control

A creature whose level varies, a boss that scales with the player included, SHALL offer a compact creature-level control beside the Combat Stats section's heading and a muted place and level range below it.

#### Scenario: Variable creature level control
- **WHEN** A boss scales with the player.
- **THEN** Combat Stats offers a compact creature-level control beside its heading and a muted place and level range below it.

### Requirement: Fixed-level combat stats

Fixed-level creatures SHALL show their stats at their level without a level control.

#### Scenario: Fixed-level combat stats
- **WHEN** A creature has a fixed level.
- **THEN** Its stats use that level and no level control appears.

### Requirement: Combat calculation disclosure

A disclosure SHALL follow the values with a sentence about the calculation and the shared relation table of each stat's start, bonus, and gain per level.

#### Scenario: Combat calculation disclosure
- **WHEN** Combat Stats shows calculable values.
- **THEN** A disclosure follows the values with a calculation sentence and the shared relation table of each stat's start, bonus, and gain per level.

### Requirement: Other stat bonus line

A muted line SHALL name the creature's other known stat bonuses that are not complete stats.

#### Scenario: Other stat bonus line
- **WHEN** A creature has a known stat bonus that is not a complete stat.
- **THEN** A muted line names that bonus.

### Requirement: Common side facts frame

The side SHALL use the common side-card frame for meaningful level, faction, aggro range, and immunities without repeating the answer, and SHALL omit the column when it has no useful content.

#### Scenario: Common side facts frame
- **WHEN** An NPC has meaningful faction and immunities not already in its answer.
- **THEN** The side uses the common side-card frame for those facts without repeating the answer.

### Requirement: Scaling qualifier placement

A scaling qualifier SHALL occupy its own muted line rather than splitting inside a level value.

#### Scenario: Scaling qualifier placement
- **WHEN** A displayed level needs a scaling qualifier.
- **THEN** The qualifier occupies its own muted line and does not split the level value.

### Requirement: Exclude invalid combat facts

Negative health and unplaced default combat values SHALL NOT appear as facts.

#### Scenario: Exclude invalid combat facts
- **WHEN** An unplaced NPC has default combat values and negative health.
- **THEN** Neither is presented as a fact.

### Requirement: Experience per kill card

When the published kill experience has its level difference and the character level cap, an Experience per kill card in the side column SHALL show the experience per kill with a control for the reader's remembered character level, a creature-level control when the creature's level varies, and a link to the kill calculator, without a duplicate static side fact.

#### Scenario: Experience per kill card
- **WHEN** Published kill experience has its level difference and character level cap for a variable-level creature.
- **THEN** The side card shows experience, remembered character-level and creature-level controls, and a kill calculator link, without a duplicate static side fact.

### Requirement: Shared creature level initialization

The creature level SHALL start at the level that the creature spawns at for the reader's level, and SHALL be one value shared with the Combat Stats section, so both always describe the same creature level.

#### Scenario: Shared creature level initialization
- **WHEN** The reader opens the Experience per kill card and changes its creature level.
- **THEN** It initially uses the spawn level for the reader's level, and its changed level is shared with Combat Stats.

### Requirement: Stock section priority

An NPC's stock SHALL lead its remaining sections when it sells items.

#### Scenario: Stock section priority
- **WHEN** An NPC sells items.
- **THEN** Its stock leads its remaining sections.

### Requirement: Quests before location without stock

A creature without stock SHALL list its quests before Where to find.

#### Scenario: Quests before location without stock
- **WHEN** A creature has quests and a known location but no stock.
- **THEN** Quests appears before Where to find.

### Requirement: Abilities before quests without a spot

An NPC without a published spot SHALL show its abilities before its quests.

#### Scenario: Abilities before quests without a spot
- **WHEN** An NPC has abilities and quests but no published spot.
- **THEN** Abilities appears before Quests.

### Requirement: Location groups and counts

Where to find SHALL be grouped by place with counts when there is a published spot.

#### Scenario: Location groups and counts
- **WHEN** An NPC has published spots in two places.
- **THEN** Where to find groups the spots by place with counts.

### Requirement: Combat information follows location

For a creature you fight, Combat Stats, its abilities, and the effects they apply SHALL follow Where to find, so a reader learns where to find it before how to fight it.

#### Scenario: Combat information follows location
- **WHEN** A combat creature has a location, calculable stats, and abilities that apply effects.
- **THEN** Where to find precedes Combat Stats, abilities, and their applied effects.

### Requirement: Variant differences last

Variant differences SHALL come last.

#### Scenario: Variant differences last
- **WHEN** An NPC page includes variant differences and other sections.
- **THEN** Variant differences come last.

### Requirement: Omit missing spot answers

A missing spot SHALL be omitted rather than presented as a framed no-location answer.

#### Scenario: Omit missing spot answers
- **WHEN** An NPC has no known spot.
- **THEN** The missing spot is not presented as a framed no-location answer.

### Requirement: Quest relationship labels

Each quest SHALL name whether the creature gives, completes, or is an objective.

#### Scenario: Quest relationship labels
- **WHEN** A creature completes a quest.
- **THEN** The quest identifies the creature's role as completing it.

### Requirement: Accessible variant and placement facts

Differing variant and placement facts SHALL remain accessible.

#### Scenario: Accessible variant and placement facts
- **WHEN** An NPC has differing facts across variants and placements.
- **THEN** Those differing facts remain accessible.

### Requirement: No fabricated friendly combat facts

A friendly service NPC SHALL not gain fabricated combat facts.

#### Scenario: No fabricated friendly combat facts
- **WHEN** A friendly service NPC has no combat facts.
- **THEN** Its page does not fabricate any.

### Requirement: Adventurer respawn exclusion

An adventurer page SHALL show no respawn time, because a world adventurer returns through its scene's spawn pool and not after its record's respawn time.

#### Scenario: Adventurer respawn exclusion
- **WHEN** A world adventurer's record contains a respawn time.
- **THEN** Its page shows no respawn time.

### Requirement: Adventurer kill experience eligibility

An adventurer page SHALL show kill experience only when a kill gives experience.

#### Scenario: Adventurer kill experience eligibility
- **WHEN** Killing an adventurer gives no experience.
- **THEN** Its page shows no kill experience.

### Requirement: Roster adventurer identity card

An adventurer of the world roster SHALL show its class with a linked entity preview, its race, and its party role in a compact facts card, with a link to the adventurer roster mechanics.

#### Scenario: Roster adventurer identity card
- **WHEN** A world-roster adventurer has a class, race, and party role.
- **THEN** A compact facts card shows a linked class entity preview, race, party role, and adventurer roster mechanics link.

### Requirement: Default adventurer role

An adventurer without a role of its own SHALL read Damage by default.

#### Scenario: Default adventurer role
- **WHEN** An adventurer has no role of its own.
- **THEN** Its role reads Damage.

### Requirement: Gear preference opens Gear card

An adventurer's Gear card SHALL open with its gear preference.

#### Scenario: Gear preference opens Gear card
- **WHEN** An adventurer's Gear card is displayed.
- **THEN** The card opens with its gear preference.

### Requirement: Adventurer Arrival card

An adventurer's side SHALL show an Arrival card with its starting level, when it joins, and a link to the guide on inviting it.

#### Scenario: Adventurer Arrival card
- **WHEN** An adventurer page is displayed.
- **THEN** Its side has an Arrival card showing starting level, when it joins, and an inviting guide link.

### Requirement: Adventurer Friends panel location

Where an adventurer has no known location, Where to find SHALL say that the Friends panel finds it once it has joined.

#### Scenario: Adventurer Friends panel location
- **WHEN** An adventurer has no known location.
- **THEN** Where to find says the Friends panel finds it once it has joined.

### Requirement: Adventurer Talents section

A Talents section SHALL name the adventurer's class, its preferred talent tree linked to that tree on its class page, and the abilities that it learns first.

#### Scenario: Adventurer Talents section
- **WHEN** An adventurer has a preferred talent tree and initial learned abilities.
- **THEN** Talents names its class, links the preferred tree on the class page, and names the abilities learned first.

### Requirement: Roster adventurer stat source boundary

A roster adventurer takes its stats from its race and class at its level, so its page SHALL show no stats of its NPC record.

#### Scenario: Roster adventurer stat source boundary
- **WHEN** A roster adventurer's NPC record contains stats.
- **THEN** Its page shows none of those NPC-record stats.

### Requirement: Main-column NPC abilities

An NPC's abilities SHALL be a section of the main column.

#### Scenario: Main-column NPC abilities
- **WHEN** An NPC has abilities to display.
- **THEN** Abilities appears as a main-column section.

### Requirement: Exclude replaced phase abilities

An NPC that fights with the abilities of its class instead of the phase abilities of its record SHALL show no phase abilities.

#### Scenario: Exclude replaced phase abilities
- **WHEN** An NPC fights using class abilities instead of its record's phase abilities.
- **THEN** Its page shows no phase abilities.

### Requirement: Exclude class fighters from phase ability users

Ability pages SHALL NOT name an NPC that fights with the abilities of its class instead of the phase abilities of its record among the NPCs that use an ability.

#### Scenario: Exclude class fighters from phase ability users
- **WHEN** An NPC uses class abilities rather than a phase ability in its record.
- **THEN** The phase ability's page does not name that NPC among its users.

### Requirement: Calculable primary values only

Only calculable primary values SHALL appear in the strip or the calculation table.

#### Scenario: Calculable primary values only
- **WHEN** Only Health and Armor can be calculated.
- **THEN** Only those calculable primary values appear in the strip or calculation table.

### Requirement: Missing stat operand handling

Missing operands SHALL NOT produce an Unknown value, a misleading bonus in place of a total, or a table full of unknown inputs.

#### Scenario: Missing stat operand handling
- **WHEN** A stat lacks an operand needed to calculate its total.
- **THEN** It produces neither an Unknown value, a bonus masquerading as a total, nor a table full of unknown inputs.

### Requirement: No effective stat section

When no effective stat can be calculated, the Combat Stats section SHALL be absent while the known authored additions remain in the published facts.

#### Scenario: No effective stat section
- **WHEN** No effective stat can be calculated but authored additions are known.
- **THEN** Combat Stats is absent and the known additions remain in the published facts.

### Requirement: Partial stat bonus disclosure

If some values can be calculated, other known bonuses SHALL remain visible in the muted line after the disclosure.

#### Scenario: Partial stat bonus disclosure
- **WHEN** Some combat values are calculable and other bonuses are known.
- **THEN** The other known bonuses remain visible in the muted line after the disclosure.

### Requirement: Universal calculation explanation location

The explanatory sentence SHALL live inside the calculation disclosure, in words that hold for every creature.

#### Scenario: Universal calculation explanation location
- **WHEN** Combat Stats includes a calculation explanation.
- **THEN** The sentence is inside the disclosure and uses words that hold for every creature.

### Requirement: Quest pages follow the course of the quest

A quest's identity SHALL show its type, available quest level, and chain step without a lone stat strip.

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

#### Scenario: Quest pages follow the course of the quest
- **WHEN** A quest has a type, available quest level, and chain step.
- **THEN** Its identity shows all three without a lone stat strip.

### Requirement: Numbered quest objectives

A quest's answer SHALL show objectives as a numbered checklist with target and required count, keeping time and item-retention hints visually distinct from the instruction and count.

#### Scenario: Numbered quest objectives
- **WHEN** A quest objective has a target, required count, time hint, and item-retention hint.
- **THEN** The numbered checklist shows the target and count, with both hints visually distinct from instruction and count.

### Requirement: Quest start and end locations

A quest SHALL identify who starts and ends the quest with their places and map links when known.

#### Scenario: Quest start and end locations
- **WHEN** A quest's start and end NPCs and their places are known.
- **THEN** The quest identifies both NPCs with their places and map links.

### Requirement: Quest side requirements and chain

The side SHALL show requirements and a vertical chain stepper identifying the current step. A quest without a chain SHALL omit the stepper.

#### Scenario: Quest side requirements and chain
- **WHEN** A quest belongs to a chain and has requirements.
- **THEN** The side shows the requirements and a vertical chain stepper identifying the current step.

### Requirement: Quest section order

Quest sections SHALL follow: Rewards, Unlocks.

#### Scenario: Quest section order
- **WHEN** A quest has Rewards and Unlocks sections.
- **THEN** Rewards precedes Unlocks.

### Requirement: Quest narrative closed blocks

Offer, objective, and completion text and world changes SHALL remain available in closed blocks at the end.

#### Scenario: Quest narrative closed blocks
- **WHEN** A quest has offer, objective, and completion text and world changes.
- **THEN** All remain available in closed blocks at the end.

### Requirement: Retain available quest context

A quest SHALL retain available experience, repeatability, world quest timing, minimum level, and dungeon context without inventing values.

#### Scenario: Retain available quest context
- **WHEN** A quest has known experience, repeatability, world quest timing, and minimum level but no dungeon context.
- **THEN** The known facts remain available and no dungeon context is invented.

### Requirement: World quest timing disclosure

Full world quest timing SHALL sit behind disclosure, after the actionable objective and reward.

#### Scenario: World quest timing disclosure
- **WHEN** A world quest has full timing information.
- **THEN** The full timing is behind disclosure after the actionable objective and reward.

### Requirement: Property pages show the purchase

A property page SHALL show its type and place in the title. Its answer SHALL use the full width without a side column and show the available picture once, beside the price, income per payment, and sell price when known, followed by where to buy it with the for-sale signs and a map action. It SHALL not claim an interval or currency without confirmed facts.

#### Scenario: Property with one sign
- **WHEN** a property has one for-sale sign
- **THEN** its answer identifies the sign's area and a map action opens it

#### Scenario: Property purchase on a wide screen
- **WHEN** a reader opens Coalway Swamp Fishing Hut at 1440 px
- **THEN** its picture sits beside the purchase price, income, and sell price in the answer, the for-sale sign follows, and no side column appears

### Requirement: Ability pages compare versions

An ability without an effect, description, learner, creature user, item use, or applied effect SHALL be withheld by a reviewed exclusion with catalog evidence checked at publication.

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

#### Scenario: Ability pages compare versions
- **WHEN** An ability has no effect, description, learner, creature user, item use, or applied effect at publication.
- **THEN** A reviewed exclusion with catalog evidence checked at publication withholds the ability.

### Requirement: Withheld ability references remain readable

References to an ability withheld by a reviewed exclusion SHALL remain readable as plain text.

#### Scenario: Withheld ability references remain readable
- **WHEN** A page references an ability withheld by a reviewed exclusion.
- **THEN** The reference remains readable as plain text.

### Requirement: Ability tooltip version selection

Other ability pages SHALL choose the tooltip version with most users and the first in a tie.

#### Scenario: Ability tooltip version selection
- **WHEN** A non-withheld ability has two versions tied for most users.
- **THEN** The page chooses the first tied version for its tooltip.

### Requirement: Known ability learners and users

An ability with known learners or users SHALL identify them in its answer and put the game tooltip in the side column.

#### Scenario: Known ability learners and users
- **WHEN** An ability has a known learner.
- **THEN** The answer identifies the learner and the side column contains the game tooltip.

### Requirement: Ability answer without known users

An ability without a known learner or user SHALL give the applied effects or described outcome in the primary answer, keep the game tooltip narrow in the side column, and give one short missing-source line.

#### Scenario: Ability answer without known users
- **WHEN** A published ability has a described outcome but no known learner or user.
- **THEN** The primary answer gives the outcome, the side column keeps the game tooltip narrow, and one short missing-source line appears.

### Requirement: Ability tooltip costs and activation

Costs and activation requirements SHALL remain in the tooltip.

#### Scenario: Ability tooltip costs and activation
- **WHEN** An ability has costs and activation requirements.
- **THEN** The tooltip retains both.

### Requirement: Linked applied-effect outcomes

Applied effects SHALL appear as linked outcomes beside or below the game tooltip, with their ability rank, chance, target in player words, and duration in human units when published.

#### Scenario: Linked applied-effect outcomes
- **WHEN** An ability applies an effect with published rank, chance, target, and duration.
- **THEN** A linked outcome beside or below the tooltip shows that rank and chance, the target in player words, and duration in human units.

### Requirement: Applied-effect evidence consistency

Applied-effect rows SHALL use the same application evidence as each effect page's Applied by list and omit withheld effects.

#### Scenario: Applied-effect evidence consistency
- **WHEN** Application evidence includes a published effect and a withheld effect.
- **THEN** The ability's rows use the published effect's Applied by application evidence and omit the withheld effect.

### Requirement: Side-by-side ability versions

When multiple versions exist, a Versions section SHALL compare them side by side in the layout of creature versions: one column per version and one row per fact.

#### Scenario: Side-by-side ability versions
- **WHEN** An ability has multiple versions.
- **THEN** Versions compares them side by side using the creature-version layout, one column per version and one row per fact.

### Requirement: Ability version comparison facts

The Versions rows SHALL be the version's text, the effects it applies when any version applies effects, its use requirements and its learning classes when the versions differ in them, and its users when any version has users.

#### Scenario: Ability version comparison facts
- **WHEN** Ability versions differ in use requirements and learning classes, and at least one applies effects and has users.
- **THEN** Versions has rows for text, applied effects, use requirements, learning classes, and users.

### Requirement: Empty ability version values

A version without a value in a Versions row SHALL read None.

#### Scenario: Empty ability version values
- **WHEN** A version has no value for a displayed comparison row.
- **THEN** Its cell reads None.

### Requirement: Version user previews

Each version's users SHALL show their first eight links and a Show N more control.

#### Scenario: Version user previews
- **WHEN** A version has more than eight users.
- **THEN** Its users show their first eight links and a Show N more control.

### Requirement: All-version user expansion

The answer's Show all link SHALL open every version's users.

#### Scenario: All-version user expansion
- **WHEN** A reader follows the answer's Show all link.
- **THEN** Every version's users open.

### Requirement: Teaching items and usable ranks

Teaching items and all usable rank links SHALL remain available without repeating the tooltip.

#### Scenario: Teaching items and usable ranks
- **WHEN** An ability has teaching items and usable ranks.
- **THEN** The teaching items and all usable rank links remain available without a repeated tooltip.

### Requirement: Class pages show how a class progresses

Only classes offered by a published race SHALL have pages.

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

#### Scenario: Class pages show how a class progresses
- **WHEN** No published race offers a class.
- **THEN** The class has no page.

### Requirement: Class side facts

A side facts card SHALL link available races and show the highest level when known, without repeating the talent tree count.

#### Scenario: Class side facts
- **WHEN** A class has available races and a known highest level.
- **THEN** The side facts card links the races and shows the highest level without repeating the talent tree count.

### Requirement: Class gear card

A separate gear card SHALL show weapon types.

#### Scenario: Class gear card
- **WHEN** A class page displays its gear card.
- **THEN** The separate gear card shows the class's weapon types.

### Requirement: Class answer playstyle

The class answer SHALL present playstyle and auto attack.

#### Scenario: Class answer playstyle
- **WHEN** A reader opens a class page.
- **THEN** The answer presents playstyle and auto attack.

### Requirement: Persistent class progression side

The class side SHALL stay in view beside the trees and present how the class gains talent points, each talent tree with the points that learning every rank of every node takes and a link to its tab, the weapon types, and the gear link.

#### Scenario: Persistent class progression side
- **WHEN** A reader scrolls beside a class's talent trees.
- **THEN** The side stays in view with talent point acquisition, every tree's full-rank point cost and tab link, weapon types, and the gear link.

### Requirement: Distinct tree point types

A tree whose points differ from the most common points of the class SHALL name them with its cost.

#### Scenario: Distinct tree point types
- **WHEN** A tree uses a point type different from the class's most common point type.
- **THEN** The tree names that point type with its cost.

### Requirement: Talent point mechanics links

Where a mechanics page explains how a tree's points are earned, such as Heroic Essence in the Heroic Tier mechanics page, the tree and the side SHALL link that mechanics page section.

#### Scenario: Talent point mechanics links
- **WHEN** A mechanics page section explains how a tree's points are earned.
- **THEN** Both the tree and the side link that section.

### Requirement: All-equipped starting gear

A class whose starting gear is all equipped SHALL state that once above the table and omit its Equipped column.

#### Scenario: All-equipped starting gear
- **WHEN** All of a class's starting gear is equipped.
- **THEN** The page states that once above the starting gear table and omits its Equipped column.

### Requirement: Mixed starting gear equipment states

A class with mixed equipped and unequipped gear SHALL keep the Equipped column.

#### Scenario: Mixed starting gear equipment states
- **WHEN** A class has both equipped and unequipped starting gear.
- **THEN** Its gear table retains the Equipped column.

### Requirement: Initial talent web focus

The Web SHALL initially focus one arm with talent links at least 24 px wide at 390 px and offer a tree focus navigator while preserving pan, zoom, and List.

#### Scenario: Initial talent web focus
- **WHEN** A reader opens the Web at 390 px.
- **THEN** The Web initially focuses one arm with talent links at least 24 px wide and provides a tree focus navigator while retaining pan, zoom, and List.

### Requirement: Talent rank unlock costs

A rank SHALL cost its own unlock cost, and the first rank of an ability that the class knows from the start SHALL cost nothing.

#### Scenario: Talent rank unlock costs
- **WHEN** A class knows an ability from the start and the ability has later ranks.
- **THEN** Its first rank costs nothing and each later rank costs its own unlock cost.

### Requirement: Starting gear and authored tree order

Starting gear SHALL come before the talent trees, which SHALL remain in authored order with row anchors.

#### Scenario: Starting gear and authored tree order
- **WHEN** A class page presents starting gear and multiple talent trees.
- **THEN** Starting gear precedes the trees, and the trees retain authored order and row anchors.

### Requirement: Talent view switching

The talent trees SHALL have two views, switchable with tabs: Web, the default, and List.

#### Scenario: Talent view switching
- **WHEN** A reader opens the talent trees and switches views.
- **THEN** Web is the default and tabs allow switching between Web and List.

### Requirement: Game-layout talent web

Web SHALL lay out every tree of the class as the game's talent screen does, with the game's positions and requirement lines.

#### Scenario: Game-layout talent web
- **WHEN** A reader views a class's trees in Web.
- **THEN** Every tree uses the game's talent-screen layout, positions, and requirement lines.

### Requirement: Tabbed talent list tables

List SHALL show each tree as a table in its own tab.

#### Scenario: Tabbed talent list tables
- **WHEN** A reader views a class's trees in List.
- **THEN** Each tree appears as a table in its own tab.

### Requirement: Talent anchors preserve current view

Both views SHALL render every tree and talent anchor, so a link to a talent or a tree selects it in the reader's current view.

#### Scenario: Talent anchors preserve current view
- **WHEN** A reader follows a talent link while in List.
- **THEN** List remains the current view and selects the linked talent, with every tree and talent anchor rendered.

### Requirement: Talent icons

Every talent SHALL show its icon.

#### Scenario: Talent icons
- **WHEN** A talent is displayed.
- **THEN** The talent shows its icon.

### Requirement: Talent web manipulation

The web SHALL let a reader move it and zoom it.

#### Scenario: Talent web manipulation
- **WHEN** A reader moves and zooms the talent web.
- **THEN** The web supports both actions.

### Requirement: Talent selection details

The web SHALL let a reader select a talent to see its ranks, effect, requirements, and the talents that it unlocks.

#### Scenario: Talent selection details
- **WHEN** A reader selects a talent in the web.
- **THEN** The reader can see its ranks, effect, requirements, and unlocked talents.

### Requirement: Talent dependency highlighting

Selecting a talent SHALL highlight every talent that it needs, back to the first tier of its tree, with the lines between them, and the talents that it unlocks.

#### Scenario: Talent dependency highlighting
- **WHEN** A reader selects a talent with a multi-tier prerequisite chain and unlocked talents.
- **THEN** Every prerequisite back to the first tier and the connecting lines are highlighted, along with the unlocked talents.

### Requirement: Talent selection movement limits

Selecting a talent in the web SHALL move neither the page nor the web, except that the web SHALL glide to a selected talent outside its view at the same zoom.

#### Scenario: Talent selection movement limits
- **WHEN** A reader selects a talent outside the web's view.
- **THEN** The page does not move and the web glides to the talent at the same zoom.

### Requirement: On-page talent link scrolling

A link to a talent or a tree from elsewhere on the page SHALL scroll the page only as far as needed to show the whole web.

#### Scenario: On-page talent link scrolling
- **WHEN** A reader follows a tree link from elsewhere on the page.
- **THEN** The page scrolls only as far as needed to show the whole web.

### Requirement: Character level curve access

The page SHALL link to Character Progression for the character level curve rather than remove access to it, and SHALL not display an Experience table.

#### Scenario: Character level curve access
- **WHEN** A reader seeks the character level curve on a class page.
- **THEN** A Character Progression link provides access and no Experience table appears.

### Requirement: Passive talent pet change order

A passive talent rank SHALL show its changes to pets after its own changes.

#### Scenario: Passive talent pet change order
- **WHEN** A passive talent rank changes both the character and pets.
- **THEN** The rank shows its own changes before its pet changes.

### Requirement: Game names for pet changes

A change to pets SHALL name the pets as the game does: "Your beast" for the Hunter's beast, the NPC whose summons change, or "Summons" for every pet.

#### Scenario: Game names for pet changes
- **WHEN** A change applies to every pet.
- **THEN** The change names the pets "Summons".

### Requirement: Shared line for same-pet changes

The changes to the same pets SHALL share one line.

#### Scenario: Shared line for same-pet changes
- **WHEN** A talent rank makes multiple changes to the same pets.
- **THEN** Those changes share one line.

### Requirement: Skill pages show recipes and levels

Each non-excluded skill SHALL have a page.

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

#### Scenario: Skill pages show recipes and levels
- **WHEN** A skill is not excluded.
- **THEN** The skill has a page.

### Requirement: Skill side facts

The skill's side facts card SHALL show available highest level, recipe count, gathering node count, and experience to highest level.

#### Scenario: Skill side facts
- **WHEN** A skill has available highest level, recipe count, gathering node count, and experience to highest level.
- **THEN** Its side facts card shows those values.

### Requirement: Verified skill experience sources

The answer SHALL show each verified experience source, craft, gather, or auto-attack hits, with a linked example range. The answer SHALL not assign an unverified source.

#### Scenario: Verified skill experience sources
- **WHEN** Crafting is a verified experience source for a skill but auto-attack hits are unverified.
- **THEN** The answer shows crafting with a linked example range and does not assign auto-attack hits as a source.

### Requirement: Skill progression detail

The skill's side SHALL offer the level curve chart and level control behind an openable progression detail when a level template and highest level above one exist.

#### Scenario: Skill progression detail
- **WHEN** A skill has a level template and a highest level above one.
- **THEN** Its side offers a level curve chart and level control behind an openable progression detail.

### Requirement: Skill character progression link

The skill's side SHALL link to Character Progression.

#### Scenario: Skill character progression link
- **WHEN** A reader opens a skill page.
- **THEN** The side links to Character Progression.

### Requirement: Weapon skill category links

A weapon skill SHALL link matching weapon categories in its primary answer.

#### Scenario: Weapon skill category links
- **WHEN** A reader opens a weapon skill.
- **THEN** Its primary answer links matching weapon categories.

### Requirement: Skill section grouping

The skill's sections SHALL show Recipes grouped by required-level bands and Gathering nodes by gate.

#### Scenario: Skill section grouping
- **WHEN** A skill has recipes and gathering nodes.
- **THEN** Recipes are grouped by required-level bands and Gathering nodes by gate.

### Requirement: Shared recipe station placement

A shared recipe station SHALL appear once above the rows.

#### Scenario: Shared recipe station placement
- **WHEN** Recipes share a station.
- **THEN** The shared station appears once above the rows.

### Requirement: Recipe station exceptions

A row with no station SHALL say so while mixed station names SHALL remain visible in their rows.

#### Scenario: Recipe station exceptions
- **WHEN** Recipe rows include different station names and a recipe without a station.
- **THEN** Each mixed station name remains in its row, and the stationless row says it has no station.

### Requirement: Productless recipe anchors

A recipe without a published product SHALL retain its anchored row.

#### Scenario: Productless recipe anchors
- **WHEN** A recipe has no published product.
- **THEN** Its anchored row remains.

### Requirement: No fictitious skill curve

A skill with no levels SHALL omit a fictitious curve.

#### Scenario: No fictitious skill curve
- **WHEN** A skill has no levels.
- **THEN** The page does not display a fictitious level curve.

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

Reviewed rules SHALL remain available in their section of their mechanics guide.

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

#### Scenario: Pages show the rules placed on them
- **WHEN** A rule has been reviewed.
- **THEN** The rule remains available in its mechanics guide section.

### Requirement: Supported entity rule values

An entity page SHALL show only supported computed values relevant to its fact or section, in plain language, with a link to the corresponding guide section.

#### Scenario: Supported entity rule values
- **WHEN** An entity fact has a supported computed value from a rule.
- **THEN** The page shows the relevant value in plain language with a link to the corresponding guide section.

### Requirement: Placed rule section links

Each section that receives a placed rule SHALL show a link to the corresponding guide section.

#### Scenario: Placed rule section links
- **WHEN** A rule is placed in two entity-page sections.
- **THEN** Each receiving section shows the corresponding guide-section link.

### Requirement: No duplicated rule prose

An entity page SHALL NOT reproduce rule prose in sections, label hints, or hover cards.

#### Scenario: No duplicated rule prose
- **WHEN** A rule applies to an entity page.
- **THEN** The page's sections, label hints, and hover cards do not reproduce the rule prose.

### Requirement: Named placement scope

A linked placement SHALL affect only entities named by that placement.

#### Scenario: Named placement scope
- **WHEN** A linked placement names one entity but not another.
- **THEN** The placement affects only the named entity.

### Requirement: No fabricated rule results

Missing verified operands SHALL not produce a fabricated computed result.

#### Scenario: No fabricated rule results
- **WHEN** Verified operands needed for a computed result are missing.
- **THEN** No fabricated computed result is produced.

### Requirement: Currency Purchases on Item Detail Pages

Item detail pages SHALL show a Buys relation section for an item with a spendable currency conversion and purchasable merchant stock, with linked products, costs, and linked sellers. Non-currency item pages SHALL omit the section.

#### Scenario: Spendable Item
- **WHEN** a reader opens the Corrupted Emerald page
- **THEN** the page displays the products available for its currency with their costs and sellers

#### Scenario: Ordinary Item
- **WHEN** a reader opens an item without a currency conversion
- **THEN** the page omits Buys

### Requirement: Creature experience per kill includes the level bonus

A combat creature's experience per kill SHALL be the whole roll from its authored minimum experience through its authored maximum minus one, or the minimum when both are equal, plus the creature's level times its experience per level.

#### Scenario: Fixed level
- **WHEN** Brinecrest spawns at level 23, rolls 70 through 119, and has 1 experience per level
- **THEN** its page shows 93–142 experience per kill

#### Scenario: Scaling level
- **WHEN** Bat spawns near the player's level within 15–30, rolls 1, and has 1 experience per level
- **THEN** its page shows 16–31 experience per kill

#### Scenario: No published spawn
- **WHEN** a creature has no published spawn, rolls 70 through 119, and has 1 experience per level
- **THEN** its page shows 70–119, plus 1 per level

#### Scenario: Creature experience per kill includes the level bonus
- **WHEN** A level 10 combat creature has authored minimum and maximum experience of 20 and 2 experience per level.
- **THEN** Its experience per kill is 40.

### Requirement: Experience display covers spawn level endpoints

The page and its variant table SHALL show the creature's experience per kill at the lowest and highest level at which the creature spawns.

#### Scenario: Experience display covers spawn level endpoints
- **WHEN** A creature spawns at levels 5 through 10, rolls 20 experience, and has 2 experience per level.
- **THEN** The page and its variant table show 30 experience per kill at the lowest spawn level and 40 at the highest.

### Requirement: Unbounded spawn levels show a plus sign

When the creature can spawn without a highest level, the page SHALL show the lowest experience per kill amount with a plus sign.

#### Scenario: Unbounded spawn levels show a plus sign
- **WHEN** A creature spawns from level 5 with no highest level, rolls 20 experience, and has 2 experience per level.
- **THEN** The page shows 30+ experience per kill.

### Requirement: Unpublished spawn levels show experience components

When no spawn level is published, the page SHALL show the roll and the experience per level.

#### Scenario: Unpublished spawn levels show experience components
- **WHEN** A creature has no published spawn level, rolls 10 through 19 experience, and has 2 experience per level.
- **THEN** The page shows a roll of 10 through 19, plus 2 per level.

### Requirement: Unknown experience scaling suppresses experience per kill

When the experience per level is unknown, the page SHALL NOT show experience per kill.

#### Scenario: Unknown experience scaling suppresses experience per kill
- **WHEN** A creature has a published spawn level but unknown experience per level.
- **THEN** The page does not show experience per kill.

### Requirement: Place pages list their objects with loot

A place page SHALL list each object in the place that gives items when used, such as graves, locked chests, sacrificial altars, and For Sale signs. A row SHALL name the object and its choice, show its cost and its conditions as separate items, link the items that it can give, and count its spots in the place. Rows with the same name, cost, choice, and conditions SHALL merge. Placed gathering nodes SHALL stay on their node pages. A place variant SHALL list only the spots inside it.

#### Scenario: Locked chests in a zone
- **WHEN** Afallon holds Wooden Treasure Chest (Locked) objects that use up a Chest Key and need levels 1–10
- **THEN** the Afallon page lists Wooden Treasure Chest (Locked) with "Uses up 1 Chest Key" and "Levels 1–10", its spot count, and links to the items it can give

### Requirement: Place pages show what a player finds there and how to get there

A place's identity SHALL show its type and available level range without a lone stat strip.

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

#### Scenario: Place pages show what a player finds there and how to get there
- **WHEN** A dungeon has a published level range of 10 through 20.
- **THEN** Its identity shows its dungeon type and level range without a lone stat strip.

### Requirement: Place answers lead with artwork and useful content

A place's answer SHALL show the place's artwork as a banner and its description, followed by the most useful available inhabitants, quests, or places to enter with links to their sections.

#### Scenario: Place answers lead with artwork and useful content
- **WHEN** A place has artwork, a description, and useful available quests.
- **THEN** Its answer shows the artwork as a banner and the description, followed by the useful quests with links to their section.

### Requirement: Place sections follow the prescribed order

A place's sections SHALL follow: Bosses with portraits, Creatures excluding bosses, NPCs, Gathering and objects with category counts, Quests, Areas.

#### Scenario: Place sections follow the prescribed order
- **WHEN** A place has bosses, other creatures, NPCs, gathering and objects, quests, and areas.
- **THEN** Its sections appear as Bosses with portraits, Creatures excluding bosses, NPCs, Gathering and objects with category counts, Quests, and Areas, in that order.

### Requirement: Place properties and points of interest remain reachable

Available properties and points of interest SHALL remain reachable in the appropriate section rather than disappear.

#### Scenario: Place properties and points of interest remain reachable
- **WHEN** A place has an available property and a point of interest.
- **THEN** Both remain reachable in the appropriate section.

### Requirement: Place levels require published evidence

The place SHALL not infer a level range where none was published.

#### Scenario: Place levels require published evidence
- **WHEN** A place has creatures but no published place level range.
- **THEN** The place does not infer a level range.

### Requirement: Places without actionable content omit empty answers

When no actionable content exists, the page SHALL not display an empty answer card.

#### Scenario: Places without actionable content omit empty answers
- **WHEN** A place has no actionable content.
- **THEN** Its page does not display an empty answer card.

### Requirement: Getting there cards cover mapped places and challenge stones

The side SHALL show a Getting there card when its facts exist, on every place with its own map outside the overworld, and on every challenge stone.

#### Scenario: Getting there cards cover mapped places and challenge stones
- **WHEN** A place outside the overworld has its own map and known entrance facts.
- **THEN** Its side shows a Getting there card.

### Requirement: Getting there names entrance origins

The Getting there card SHALL name each place that a player enters this place from, with links to the entrance spots. Entrances from challenge stones SHALL NOT count.

#### Scenario: Getting there names entrance origins
- **WHEN** A place has entrances from two ordinary places and a challenge stone.
- **THEN** Its Getting there card names both ordinary places with links to their entrance spots and does not count the challenge stone entrance.

### Requirement: Challenge stones show their starting stone and cost

A challenge stone's Getting there card SHALL instead name the stone where it starts, the stone's region, and the number of Hearts that it uses up.

#### Scenario: Challenge stones show their starting stone and cost
- **WHEN** A challenge stone starts at a stone in a published region and uses up 3 Hearts.
- **THEN** Its Getting there card names the starting stone and its region and shows that it uses up 3 Hearts.

### Requirement: Dungeon Finder access explains Random run rewards

For a dungeon that the Dungeon Finder can send a player to, the Getting there card SHALL say that a player can choose the dungeon in the Dungeon Finder or get it from a Random run, and that only a finished Random run gives the supply pack.

#### Scenario: Dungeon Finder access explains Random run rewards
- **WHEN** A dungeon is a Dungeon Finder destination.
- **THEN** Its Getting there card explains choosing the dungeon or getting it from a Random run and says that only a finished Random run gives the supply pack.

### Requirement: Timed dungeons receive a side card

The side SHALL show a Timed dungeon card on each timed dungeon when its facts exist.

#### Scenario: Timed dungeons receive a side card
- **WHEN** A timed dungeon has published timing facts.
- **THEN** Its side shows a Timed dungeon card.

### Requirement: Timed dungeon cards show timer and thresholds

The Timed dungeon card SHALL show the timer, the time left that each threshold needs and the token levels that each threshold adds.

#### Scenario: Timed dungeon cards show timer and thresholds
- **WHEN** A timed dungeon has a 600-second timer and thresholds requiring 300 seconds left for 2 token levels and 100 seconds left for 1 token level.
- **THEN** Its Timed dungeon card shows the timer and both thresholds with their required time left and added token levels.

### Requirement: Timed dungeon cards show reward bag capacity

The Timed dungeon card SHALL show the most items that the reward bag holds besides the token.

#### Scenario: Timed dungeon cards show reward bag capacity
- **WHEN** A timed dungeon's reward bag holds at most 4 items besides the token.
- **THEN** Its Timed dungeon card shows a maximum of 4 items besides the token.

### Requirement: Timed dungeon cards link the altar and mechanics

The Timed dungeon card SHALL show a link to the Altar of Corruption on the map, and a link to the Timed dungeons section of the Corruption mechanics page.

#### Scenario: Timed dungeon cards link the altar and mechanics
- **WHEN** A timed dungeon has an Altar of Corruption on its map.
- **THEN** Its Timed dungeon card links to the altar on the map and to the Timed dungeons section of the Corruption mechanics page.

### Requirement: Services cards count and map service categories

The side SHALL show a Services card when its facts exist, with a count and a map link for each of merchants, bankers, auctioneers, flight points, quest givers, and each kind of crafting station.

#### Scenario: Services cards count and map service categories
- **WHEN** A place has merchants, bankers, auctioneers, flight points, quest givers, and two kinds of crafting station.
- **THEN** Its side shows a Services card with a count and a map link for each listed service category and for each of the two crafting station kinds.

### Requirement: Services exclude nonservice inhabitants and travel points

Townsfolk, neutral creatures, and travel points SHALL NOT count as services.

#### Scenario: Services exclude nonservice inhabitants and travel points
- **WHEN** A place has townsfolk, neutral creatures, and travel points alongside a merchant.
- **THEN** Its service counts exclude the townsfolk, neutral creatures, and travel points.

### Requirement: Overworld entrances are grouped by place kind

The overworld page SHALL show a Places to enter section that groups the places a player can enter from it into dungeons, challenge stones, and other places.

#### Scenario: Overworld entrances are grouped by place kind
- **WHEN** Players can enter a dungeon, a challenge stone, and another place from the overworld.
- **THEN** The overworld page shows those places in the dungeons, challenge stones, and other places groups of Places to enter.

### Requirement: Overworld entrance rows link destinations and entrance spots

Each row in the overworld's Places to enter section SHALL link the place, show its level range when published, and link its entrance spots.

#### Scenario: Overworld entrance rows link destinations and entrance spots
- **WHEN** A place entered from the overworld has a published level range and two entrance spots.
- **THEN** Its Places to enter row links the place, shows the published level range, and links both entrance spots.

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

The site SHALL remember the character level and the skill levels that a reader sets on any page, across pages and visits, in the browser.

#### Scenario: Level carries to another page
- **WHEN** a reader sets their Fishing level to 75 on Golden Swirl and opens Teeming Fishing Hole
- **THEN** its Fishing level control starts at 75 and its chance uses level 75

#### Scenario: First visit
- **WHEN** a reader who has set no Fishing level opens a fishing node
- **THEN** its control starts at level 1 and shows that level

#### Scenario: Pages compute values at the reader's levels
- **WHEN** A reader sets character level 30 and Fishing level 50, then returns to the site in the same browser on a later visit.
- **THEN** The site remembers character level 30 and Fishing level 50 across pages.

### Requirement: Level-based values start at remembered levels or stated defaults

A page that computes a value from a reader's character or skill level SHALL start at the remembered level, or at a stated default before the reader sets one.

#### Scenario: Level-based values start at remembered levels or stated defaults
- **WHEN** A reader with no remembered character level opens a page that computes a value from character level and states a default of 1.
- **THEN** The page starts its computation at the stated default level of 1.

### Requirement: Computed values keep level controls visible alongside

A page that computes a value from a reader's character or skill level SHALL show the control that changes that level next to the value, so that no remembered level changes a value out of sight.

#### Scenario: Computed values keep level controls visible alongside
- **WHEN** A page computes a value using a remembered Fishing level of 50.
- **THEN** The Fishing level control is shown next to the computed value, making the remembered level visible.

### Requirement: Out-of-range levels clamp without changing memory

A level outside a control's range SHALL show at the nearest end without changing the remembered level.

#### Scenario: Out-of-range levels clamp without changing memory
- **WHEN** The remembered level is 75 and a page's level control ranges from 1 to 50.
- **THEN** The control shows 50 and the remembered level remains 75.

### Requirement: Level controls use the shared accessible stepper and slider

The level control SHALL use the shared stepper and slider, whose accessible buttons and keyboard commands adjust within the visible range.

#### Scenario: Level controls use the shared accessible stepper and slider
- **WHEN** A reader uses the shared level control's accessible buttons and keyboard commands on a page with a visible range of 1 through 50.
- **THEN** The shared stepper and slider adjust the level within 1 through 50.

### Requirement: Small reference kinds lead with an answer

Currency, faction, gear set, crafting station, and race pages SHALL each have a single-line identity and a useful primary answer.

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

#### Scenario: Small reference kinds lead with an answer
- **WHEN** A reader opens a race page with published reference information.
- **THEN** The page presents a single-line identity and a useful primary answer.

### Requirement: Small reference side cards require distinct facts

Currency, faction, gear set, crafting station, and race pages SHALL show a side card only for distinct facts that add information. Otherwise their main content SHALL use the full width.

#### Scenario: Small reference side cards require distinct facts
- **WHEN** A currency page has no distinct facts that add information in a side card.
- **THEN** The page omits the side card and uses the full width for its main content.

### Requirement: Small reference pages omit sparse count strips

Currency, faction, gear set, crafting station, and race pages SHALL NOT show a full-width strip of one or two counts.

#### Scenario: Small reference pages omit sparse count strips
- **WHEN** A crafting station page has two counts available.
- **THEN** It does not show those counts as a full-width strip.

### Requirement: Small reference pages do not reserve empty columns

Currency, faction, gear set, crafting station, and race pages SHALL NOT reserve a desktop column without content.

#### Scenario: Small reference pages do not reserve empty columns
- **WHEN** A faction page has no content for a secondary desktop column.
- **THEN** The page does not reserve an empty desktop column.

### Requirement: Small reference panels do not repeat adjacent facts

Currency, faction, gear set, crafting station, and race pages SHALL NOT repeat a fact across adjacent panels.

#### Scenario: Small reference panels do not repeat adjacent facts
- **WHEN** A gear set page displays a fact in one panel beside another panel.
- **THEN** The adjacent panel does not repeat that fact.

### Requirement: Small reference pages do not feature default zeros

Currency, faction, gear set, crafting station, and race pages SHALL NOT expose default zero values as a feature.

#### Scenario: Small reference pages do not feature default zeros
- **WHEN** A race page has default zero values in its data.
- **THEN** The page does not expose those default zero values as a feature.

### Requirement: Small reference relation rows preserve differences and share invariants

Currency, faction, gear set, crafting station, and race pages' relation rows SHALL retain genuinely different values while sharing invariant information outside the rows.

#### Scenario: Small reference relation rows preserve differences and share invariants
- **WHEN** A faction page's relation rows have different starting points but identical thresholds.
- **THEN** The rows retain the different starting points, and the identical thresholds are shared outside the rows.

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

NPC pages SHALL link published effects whose appliers name that NPC through an ability or an adventurer invitation.

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

#### Scenario: NPC effects and portraits reflect their game identity
- **WHEN** A published effect's applier names an NPC through an ability.
- **THEN** The NPC page links the published effect.

### Requirement: Adventurer invitations describe summons and duration

An adventurer invitation SHALL describe the NPC it summons and the effect's authored pet duration in human units.

#### Scenario: Adventurer invitations describe summons and duration
- **WHEN** An adventurer invitation summons an NPC for an authored pet duration of 7,200 seconds.
- **THEN** The invitation describes the summoned NPC and states the duration as 2 hours.

### Requirement: NPC portraits preserve authored identity

NPC pages and previews SHALL show the game's authored portrait, including portraits shared by unrelated characters.

#### Scenario: NPC portraits preserve authored identity
- **WHEN** Two unrelated NPCs share a game-authored portrait.
- **THEN** Both NPC pages and previews show that shared portrait.

### Requirement: Evidence-checked NPC exclusion preserves readable references

A record with no usable placement, description, drops, stock, quests, abilities, or other playable relation MAY be withheld by reviewed, evidence-checked exclusion, and links to that record SHALL read as plain text.

#### Scenario: Evidence-checked NPC exclusion preserves readable references
- **WHEN** A record with none of the listed usable content or other playable relations is withheld by reviewed, evidence-checked exclusion.
- **THEN** References that would link to the withheld record read as plain text.

### Requirement: Bare service-role flags do not establish usable service

A bare service-role flag without a location or matching quest or stock SHALL NOT be treated as a usable service.

#### Scenario: Bare service-role flags do not establish usable service
- **WHEN** An NPC has only a service-role flag, without a location or matching quest or stock.
- **THEN** The bare flag is not treated as a usable service.

### Requirement: Relation tables build only the rows they show

Interactive relation tables SHALL build only their visible rows after hydration. Additional rows SHALL have their linked content in a native disclosure in the server-rendered HTML; that disclosure SHALL remain usable without JavaScript and SHALL be replaced by the original Show N more control after hydration. Revealed interactive rows SHALL be added in steps, the first step at once, so that no step blocks the page for long. A row that an address names SHALL be built before it scrolls into view.

#### Scenario: Long hidden relation
- **WHEN** a reader opens the Gold page, whose relations hold 659 rows of which 36 show
- **THEN** the hydrated page builds 36 interactive relation rows and still offers each Show N more control with its full count
- **AND** its prerendered HTML contains the links in the remaining rows inside native disclosures

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

### Requirement: Detail answers stay prominent and readable

Entity detail pages SHALL lead with the fact a reader needs to understand that entity, keeping long related lists and explanations available after the answer.

#### Scenario: Boss and adventurer on a phone
- **WHEN** a reader opens Kraath the Hivebreaker or Agra Emberhide at 390 px
- **THEN** Kraath's level and verified health precede the long drops list, and Agra's identity and arrival precede the gear kit

#### Scenario: Quest and class on a phone
- **WHEN** a reader opens A Bite in the Brew or Shieldmaster at 390 px
- **THEN** quest rewards precede the chain, and the class's talent tree links precede its long starting gear list
- **AND** the quest's Show on Map action remains together when its location row wraps

#### Scenario: Place and ability answers
- **WHEN** a reader opens Coalway Swamp on a phone or Ambush on a desktop
- **THEN** zone content counts and jump links precede long lore, and the ability's effect occupies the main answer before its learner list

#### Scenario: Detail answers stay prominent and readable
- **WHEN** A reader opens an entity detail page with a long related list and explanation.
- **THEN** The page leads with the fact needed to understand the entity and keeps the list and explanation available after the answer.

### Requirement: Phone detail answers precede long content

On phones, a boss's known level and any verified health, adventurer's race, class, role and arrival, quest rewards, class talent tree links, and zone contents SHALL precede long loot, gear, chain, or lore content.

#### Scenario: Phone detail answers precede long content
- **WHEN** A reader opens an adventurer detail page on a phone with race, class, role, arrival, and a long gear list.
- **THEN** The adventurer's race, class, role, and arrival precede the long gear list.

### Requirement: Ability effects and use occupy the main column

An ability's effect and use SHALL have the main column before learner lists while costs and requirements remain accessible.

#### Scenario: Ability effects and use occupy the main column
- **WHEN** A reader opens an ability page with an effect, use, costs, requirements, and a learner list.
- **THEN** The effect and use occupy the main column before the learner list, and costs and requirements remain accessible.

### Requirement: Desktop answers sit beside secondary facts

Desktop SHALL retain a main answer beside secondary facts.

#### Scenario: Desktop answers sit beside secondary facts
- **WHEN** A reader opens an entity detail page with secondary facts on a desktop.
- **THEN** The main answer is retained beside the secondary facts.

### Requirement: Detail labels avoid misleading line fragments

Entity names, action labels, and separators SHALL not split into misleading line fragments.

#### Scenario: Detail labels avoid misleading line fragments
- **WHEN** An entity detail row containing an entity name, an action label, and separators wraps onto multiple lines.
- **THEN** The entity name, action label, and separators do not split into misleading line fragments.

### Requirement: Detail facts avoid repetition and preserve context

A detail page SHALL not repeat a source, reward, experience amount, set piece total, or item count in neighboring cards when one presentation gives the same answer.

#### Scenario: Item sources and set membership
- **WHEN** a reader opens Mandrith Carapace Cleaver, Adventurer's Fire Sword, or Adept Necromancer Chest
- **THEN** identical boss drops or sole quest rewards appear once, set bonuses remain visible without listing every set piece in the stat card, and source names and separators wrap intact

#### Scenario: Gathering yield and on-hit effect
- **WHEN** a reader opens Aetherium Vein at 390 px or Adventurer's Fire Sword
- **THEN** yield values retain their chance heading, the required Mining level is distinguished from the reader's level and extra yield, and on-hit text does not promise a missing chance column

#### Scenario: Repeated counts
- **WHEN** a reader opens the item-power stat or Adept Necromancer gear set
- **THEN** the item count and set piece count each appear once in nearby summary and section controls

#### Scenario: Detail facts avoid repetition and preserve context
- **WHEN** Neighboring cards would present the same quest reward and experience amount on a detail page.
- **THEN** The reward and experience amount each appear in one presentation rather than being repeated in neighboring cards.

### Requirement: Acquisition methods retain differing conditions

Distinct acquisition methods and differing conditions SHALL remain available.

#### Scenario: Acquisition methods retain differing conditions
- **WHEN** An item has two distinct acquisition methods with differing conditions.
- **THEN** Both acquisition methods and their differing conditions remain available.

### Requirement: Gear set items expose bonuses and full roster access

An item belonging to a gear set SHALL show the equipped bonus summary with a way to reach the full roster.

#### Scenario: Gear set items expose bonuses and full roster access
- **WHEN** A reader opens an item belonging to a gear set.
- **THEN** The item shows the equipped bonus summary and a way to reach the full roster.

### Requirement: Source metadata wraps at entity boundaries

Source names and metadata SHALL wrap at entity boundaries without orphan punctuation.

#### Scenario: Source metadata wraps at entity boundaries
- **WHEN** A source name and its metadata must wrap onto multiple lines.
- **THEN** The source name and metadata wrap at entity boundaries without orphan punctuation.

### Requirement: Quantities and counts identify units

Quantities and heading counts SHALL name their units.

#### Scenario: Quantities and counts identify units
- **WHEN** A detail page displays an item quantity and a heading count of items.
- **THEN** The quantity and heading count name items as their units.

### Requirement: Chance explanations stay within displayed evidence

Explanations SHALL only refer to chance values that the page displays or explicitly identifies.

#### Scenario: Chance explanations stay within displayed evidence
- **WHEN** A page displays one chance value but neither displays nor explicitly identifies another chance value.
- **THEN** Its explanation refers only to the displayed chance value, not the unidentified value.

### Requirement: Section controls never obscure detail content

The section navigator SHALL float in the lower-right corner at every width.

#### Scenario: Scrolling a boss page on a phone
- **WHEN** a reader scrolls down Kraath the Hivebreaker's long loot section at 390 px
- **THEN** the section control withdraws and does not cover a loot row or its chance
- **AND** it returns when the reader scrolls up or reaches the page end

#### Scenario: Reading a detail page on a desktop
- **WHEN** a reader scrolls a detail page at 1440 px
- **THEN** the section control stays visible in the page margin without overlapping the content columns

#### Scenario: Section controls never obscure detail content
- **WHEN** A detail page is viewed at phone and desktop widths.
- **THEN** The section navigator floats in the lower-right corner at both widths.

### Requirement: Section navigator occupies available page margin

Where the page margin can hold the section navigator, the section navigator SHALL rest in the margin without overlapping readable content.

#### Scenario: Section navigator occupies available page margin
- **WHEN** A detail page has enough margin to hold the section navigator.
- **THEN** The navigator rests in the margin without overlapping readable content.

### Requirement: Section navigator withdraws during narrow-margin scrolling

Where the margin cannot hold the section navigator, the section navigator SHALL withdraw while the reader scrolls down and return when the reader scrolls up, reaches the page end, or moves keyboard focus to it, so it never rests over text that the reader is moving through.

#### Scenario: Section navigator withdraws during narrow-margin scrolling
- **WHEN** The margin cannot hold the section navigator and a reader scrolls down, then moves keyboard focus to the navigator.
- **THEN** The navigator withdraws during downward scrolling without resting over text the reader is moving through, and returns when keyboard focus moves to it.

### Requirement: Page ending reserves space for section control

The page SHALL leave room below its last line so the control never covers the end of the page.

#### Scenario: Page ending reserves space for section control
- **WHEN** A reader reaches the last line of a detail page with the section control visible.
- **THEN** Room below the last line keeps the control from covering the end of the page.

### Requirement: Section control reaches every rendered section

The control SHALL still reach each rendered section.

#### Scenario: Section control reaches every rendered section
- **WHEN** A reader uses the section control on a page with multiple rendered sections.
- **THEN** Each rendered section is reachable through the control.

### Requirement: Chances and ability outcomes have player context

An item's concise kill-drop answer SHALL state its per-kill chance beside the source without stray punctuation or internal qualifiers.

#### Scenario: Boss item drop rate
- **WHEN** a reader opens Mandrith Carapace Cleaver
- **THEN** Kraath's route states 18.31% per kill followed by the baseline-aligned round linked help mark, without a detached separator, trailing period, or unexplained 0 Loot Chance qualifier

#### Scenario: Ability with an internal effect
- **WHEN** a reader opens Ambush
- **THEN** its native description retains the teleport outcome, but no Unnamed Teleport Effect link appears in the answer or Versions comparison

#### Scenario: Chances and ability outcomes have player context
- **WHEN** A reader opens an item's concise kill-drop answer.
- **THEN** The answer states the per-kill chance beside the source without stray punctuation or internal qualifiers.

### Requirement: Chance explanations state assumptions and link mechanics

A linked hint on an item's concise kill-drop answer and the full chance table SHALL explain the assumption of no Loot Chance, how Luck affects it in this version, and link to Loot Chance, Luck, and the loot mechanics explanation.

#### Scenario: Chance explanations state assumptions and link mechanics
- **WHEN** A reader views an item's linked chance hint and full chance table.
- **THEN** Both explain the assumption of no Loot Chance and how Luck affects it in this version, and both link to Loot Chance, Luck, and the loot mechanics explanation.

### Requirement: Level restrictions remain visible

Level restrictions SHALL remain visible.

#### Scenario: Level restrictions remain visible
- **WHEN** A reader views an item answer with a level restriction.
- **THEN** The level restriction remains visible.

### Requirement: Ability links use player-facing effect names

An ability SHALL link only effects with a player-facing name.

#### Scenario: Ability links use player-facing effect names
- **WHEN** A reader views an ability with both player-named and internally named effects.
- **THEN** Any effect links use only effects with a player-facing name.

### Requirement: Native ability descriptions suppress unnamed fallback labels

Fallback unnamed effect labels SHALL not appear in an ability's answer or Versions table when its native description already explains the outcome.

#### Scenario: Native ability descriptions suppress unnamed fallback labels
- **WHEN** A reader views an ability whose native description already explains an unnamed effect's outcome.
- **THEN** No fallback unnamed effect label appears in the answer or Versions table.

### Requirement: Chance hints match detail help marks

The chance hint SHALL use the same round help mark and baseline alignment as other detail explanations, directly after the chance without a dangling period.

#### Scenario: Chance hints match detail help marks
- **WHEN** A reader views a chance with a linked hint.
- **THEN** The hint uses the same round help mark and baseline alignment as other detail explanations, directly after the chance without a dangling period.

### Requirement: Phone detail facts retain their labels and columns

The NPC identity line SHALL wrap at fact boundaries without starting a line with a separator or fusing two facts.

#### Scenario: Mixed Wolf Fang drops
- **WHEN** a reader opens Wolf Fang at 390 px
- **THEN** listed rates and per-kill chances have distinct grouped context, each value reads as a percentage only, each icon and full name share a row, quantities appear beneath the names, and the chance heading stays on one line above right-aligned values

#### Scenario: Creature and zone facts on phones
- **WHEN** a reader opens Fangchill, Coalway Woods, or Aetherium Vein at 390 px
- **THEN** Fangchill's title facts separate cleanly and its level scaling has its own line, Coalway Woods shows consistently cased Services labels, and Aetherium Vein shows the gathering requirement once alongside its selected-level extra-yield explanation

#### Scenario: Content and gathering yields on a phone
- **WHEN** a reader opens Soaked Bag contents or Aetherium Vein yields at 390 px
- **THEN** item names take a full row, × quantities follow under them, chance headings remain legible above right-aligned values, and desktop tables retain their original columns

#### Scenario: Phone detail facts retain their labels and columns
- **WHEN** An NPC identity line wraps on a phone.
- **THEN** The line wraps at fact boundaries, no line starts with a separator, and no two facts are fused.

### Requirement: Phone loot headings stay associated with values

On phones, loot column headings SHALL remain associated with their values.

#### Scenario: Phone loot headings stay associated with values
- **WHEN** A reader views a loot table on a phone.
- **THEN** Each loot column heading remains associated with its values.

### Requirement: Creature icons and names share an aligned cell

On phones, creature icon and name SHALL stay in one aligned name cell.

#### Scenario: Creature icons and names share an aligned cell
- **WHEN** A reader views a table containing a creature icon and name on a phone.
- **THEN** The creature icon and name stay in one aligned name cell.

### Requirement: Mixed source tables identify rate kinds by group

A mixed item-source table SHALL distinguish computed chances from listed rates once for each group, without repeating the rate kind in every cell.

#### Scenario: Mixed source tables identify rate kinds by group
- **WHEN** A reader views an item-source table containing computed chances and listed rates.
- **THEN** The table distinguishes the rate kinds once for each group without repeating the rate kind in every cell.

### Requirement: Shared relation headings stay over values

The shared relation table styling SHALL keep each heading over its values.

#### Scenario: Shared relation headings stay over values
- **WHEN** A reader views a table using shared relation table styling.
- **THEN** Each heading stays over its values.

### Requirement: Sidebar levels separate ranges from scaling

Sidebar level ranges SHALL remain whole and place scaling on a separate muted line.

#### Scenario: Sidebar levels separate ranges from scaling
- **WHEN** A reader views a sidebar with a level range and scaling.
- **THEN** The level range remains whole and scaling appears on a separate muted line.

### Requirement: Zone service labels use consistent title casing

Zone service labels SHALL use consistent title casing.

#### Scenario: Zone service labels use consistent title casing
- **WHEN** A reader views a zone's service labels.
- **THEN** The service labels use consistent title casing.

### Requirement: Gathering instructions distinguish level and yield facts

Gathering instructions SHALL separate the required skill level, selected reader level, and extra-yield odds in plain sentences.

#### Scenario: Gathering instructions distinguish level and yield facts
- **WHEN** A reader views gathering instructions with a required skill level, selected reader level, and extra-yield odds.
- **THEN** Plain sentences separate the required skill level, selected reader level, and extra-yield odds.

### Requirement: Phone quantity and chance tables use stacked name rows

On phones, a table with a name, quantity, and chance SHALL give the name its own full-width row, put the quantity below it as a muted × amount, and keep the chance right-aligned under an unbroken one-line heading.

#### Scenario: Phone quantity and chance tables use stacked name rows
- **WHEN** A reader views a name, quantity, and chance table on a phone.
- **THEN** The name has its own full-width row, a muted × amount appears below it, and the chance is right-aligned under an unbroken one-line heading.

### Requirement: Hidden quantity headings remain accessible

The hidden quantity heading SHALL remain available to assistive technology.

#### Scenario: Hidden quantity headings remain accessible
- **WHEN** A reader uses assistive technology to access a table whose quantity heading is hidden.
- **THEN** The quantity heading remains available to the assistive technology.

### Requirement: Desktop tables retain side-by-side columns

Desktop SHALL retain the three side-by-side columns in a table with a name, quantity, and chance.

#### Scenario: Desktop tables retain side-by-side columns
- **WHEN** A reader views a name, quantity, and chance table on desktop.
- **THEN** The table retains the three side-by-side columns.

### Requirement: Yield answers avoid repeating gathering card requirements

When a To gather card already states a node's level requirement, the yield answer SHALL not repeat it.

#### Scenario: Yield answers avoid repeating gathering card requirements
- **WHEN** A reader views a node whose To gather card already states its level requirement.
- **THEN** The yield answer does not repeat the level requirement.

### Requirement: Yield answers retain requirements without gathering cards

Without a To gather card, the yield answer SHALL retain the node's level requirement.

#### Scenario: Yield answers retain requirements without gathering cards
- **WHEN** A reader views a node's yield answer without a To gather card.
- **THEN** The yield answer retains the node's level requirement.

### Requirement: Creature drop chances follow the item's own loot lists

A creature drop's Chance per Kill SHALL depend only on the loot list of its row, because each of a creature's loot lists rolls on its own. An item that shares a loot list with a quest item SHALL show its Chance per Kill when the chance is the same whether or not a quest needs the quest item, and SHALL otherwise keep its Listed Rate with the reason. A quest item's Chance per Kill SHALL apply while one of the reader's quests needs the item, and every view of that value SHALL say so.

#### Scenario: Gear beside a quest item's loot list
- **WHEN** Fangbloom drops gear from one loot list, Heart of Corruption from a second and Fangbloom's Venom Sac from a third
- **THEN** its gear and Heart of Corruption show Chance per Kill instead of Listed Rate

#### Scenario: Quest item
- **WHEN** a reader opens Fangbloom's Venom Sac
- **THEN** its Fangbloom source shows a 100% chance per kill while one of the reader's quests needs the item

#### Scenario: Item sharing a loot list with a quest item
- **WHEN** Bear Hide shares a loot list without an item limit or a minimum with the quest item Unmarred Bear Hide
- **THEN** Bear Hide shows its Chance per Kill, because the quest state cannot change it

#### Scenario: Quest state changes a chance
- **WHEN** a quest item rolls before another item in a loot list whose item limit it can fill
- **THEN** the later item keeps its Listed Rate and names the quest state as the reason

#### Scenario: An item in two loot lists of one creature
- **WHEN** Deathseer has Staff of the Pyromancer in two loot lists
- **THEN** the staff's page lists Deathseer once for each list, each with that list's Chance per Kill

### Requirement: Creature pages show every roll of a kill

A creature page that a player can fight at a known level SHALL show one group per roll of a kill, in the game's order: each of its own loot lists, World Loot, and cloth for a creature type that drops it.

#### Scenario: A boss with three loot lists
- **WHEN** a reader opens Fangbloom, a level 27 Elemental boss
- **THEN** Drops shows Drop Group 1, Drop Group 2, and Drop Group 3, then World Loot at creature level 27
- **AND** World Loot says that 11.4% of kills give 1 or 2 of its 111 items and lists Bloodtrack Gloves among them
- **AND** no Cloth group appears

#### Scenario: An Undead creature
- **WHEN** a reader opens Rotbound Effigy, an Undead creature of levels 28 to 29, at creature level 28
- **THEN** a Cloth group follows World Loot and says that 75% of kills give 1 to 3 pieces of one of its cloths, with Silk Cloth at about 27.4% per kill

#### Scenario: A scaling creature
- **WHEN** a reader whose creature level is 27 opens a creature that scales with the player from level 15 to 30
- **THEN** the World Loot and Cloth groups show creature level 27 once the page has loaded the level
- **AND** the prerendered page shows them at creature level 15, the level that its groups name

#### Scenario: An item in two loot lists of one creature
- **WHEN** Staff of the Pyromancer is in two loot lists of Deathseer
- **THEN** each Drop Group shows the chance that its own list gives the staff

#### Scenario: A friendly NPC
- **WHEN** a reader opens a merchant whose every role is a friendly service
- **THEN** its page shows no Drops, World Loot, or Cloth groups

#### Scenario: A dummy target
- **WHEN** a reader opens Trapped Dwarf Miner, Captured Villager, or Training Dummy, whose records the game marks as dummy targets
- **THEN** the page shows no World Loot or Cloth groups

#### Scenario: Creature pages show every roll of a kill
- **WHEN** A reader opens a creature page for a creature fightable at a known level that has multiple loot lists and a creature type that drops cloth.
- **THEN** The page shows one group per roll in the game's order, each of the creature's own loot lists, then World Loot, then cloth.

### Requirement: Loot rows show their own group's per-kill chance

Each row SHALL show its own group's chance per kill, so an item in two loot lists of one creature has each list's chance.

#### Scenario: Loot rows show their own group's per-kill chance
- **WHEN** A reader views a creature's loot groups containing the same item in two loot lists.
- **THEN** Each row for the item shows its own loot list's chance per kill.

### Requirement: World Loot and cloth name the selected creature level

World Loot and cloth SHALL show one named creature level, the level that the page's creature level control selects.

#### Scenario: World Loot and cloth name the selected creature level
- **WHEN** A reader selects creature level 28 on a page showing World Loot and cloth.
- **THEN** World Loot and cloth show one named creature level, level 28, matching the creature level control.

### Requirement: Dummy targets omit World Loot and cloth

A dummy target, which the game never lets die, SHALL show neither World Loot nor cloth.

#### Scenario: Dummy targets omit World Loot and cloth
- **WHEN** A reader opens a dummy target's page.
- **THEN** The page shows neither World Loot nor cloth.

### Requirement: Item pages show World Loot by creature level

An item that World Loot can give SHALL have a World Loot section after Dropped by, separate from the creatures that drop the item from their own loot lists. The section SHALL state the creature levels that can give the item and SHALL list the item's chance per kill at each of them, merging only levels with equal chances. Dropped by SHALL list only creatures and SHALL count only creatures.

#### Scenario: A level-matched World Loot item
- **WHEN** a reader opens Bloodtrack Gloves
- **THEN** its World Loot section lists creature levels 21 to 29, with about 0.35% per kill at level 21 and about 0.21% at level 29
- **AND** the page has no Dropped by section

#### Scenario: An item that creatures and World Loot both give
- **WHEN** a reader opens Jade Band
- **THEN** Dropped by counts 13 creatures and states their shared loot-list rule once
- **AND** World Loot shows one row for every creature level with about 0.24% per kill
