# list-filters Specification

## Purpose
Let readers narrow the published lists by game facts, compare item stats, and share filtered views. Keep every record in the unfiltered lists.

## Requirements

### Requirement: Lists share one filter panel

Each list of at least 20 rows with facets or numeric columns SHALL show its filters in one panel. From 960 px wide, the panel SHALL sit beside the results. Below 960 px, a Filters button SHALL show the number of active filters and open the panel as a full-height sheet with a button that shows the result count and closes the sheet. A facet SHALL render its values as checkboxes. Several values of one facet SHALL match a row that has any of them, and different filters SHALL all apply. Each value SHALL show how many rows would match if it were selected, given the other active filters. The panel SHALL NOT offer a value that every row has, unless it is selected, and SHALL NOT show a facet that offers no value. A facet with more than ten values SHALL offer a search field for its values. Every group of the panel, including ranges and stats, SHALL open and close from its heading. The heading SHALL show a chevron that turns with the group's state and the number of active filters in the group, and SHALL NOT share a line with the group's separator. Closing a group SHALL NOT clear its filters. On the item list, Slot, Rarity, Level, and Stats SHALL start open and the other groups SHALL start closed. On the NPC list, Place and Faction SHALL start closed and the other groups SHALL start open. On the quest list, Area and Chain SHALL start closed and the other groups SHALL start open. Every other list SHALL start with all groups open. A group with an active filter SHALL open, and a group that the reader opened or closed SHALL keep that state while filters change. Results SHALL update on each change. The result count SHALL read as "N of M" when filters hide rows. Each active filter SHALL show as a removable chip above the results, with a Clear all control.

#### Scenario: Two slots
- **WHEN** a reader checks Boots and Gloves in the item Slot filter
- **THEN** the list shows boots and gloves
- **AND** two chips name the selected slots

#### Scenario: Counts follow other filters
- **WHEN** a reader selects the Rare rarity
- **THEN** each Slot value shows the number of rare items in that slot

#### Scenario: Phone sheet
- **WHEN** a reader at 390 px opens Filters, checks a value, and selects the result button
- **THEN** the sheet closes, the chip for the value shows above the results, and the page has no sideways scroll

#### Scenario: Short list
- **WHEN** a list has fewer than 20 rows, or no facets and no numeric columns
- **THEN** it shows only the name field above its rows

#### Scenario: Closed group
- **WHEN** a reader selects Shield in the Gear filter and then closes the Gear group
- **THEN** the Gear heading shows a chevron pointing down and the count 1
- **AND** the list still shows only shields

#### Scenario: Long lists of names start closed
- **WHEN** a reader opens the NPC list or the quest list without filters
- **THEN** the NPC Place and Faction groups, and the quest Area and Chain groups, show only their headings
- **AND** a shared link that selects a place opens the Place group

### Requirement: Usable by follows the game's equip rule

The item list SHALL offer a Usable by filter over the published classes. A weapon SHALL match a class only when the game's verified equip rule allows the weapon's type for that class. An item that the verified rule does not restrict by class SHALL match every class. A match SHALL NOT claim that the reader meets the item's other requirements, such as its level.

#### Scenario: Allowed weapon
- **WHEN** a class allows a weapon's type and a reader selects that class
- **THEN** the weapon is in the results

#### Scenario: Weapon of another class
- **WHEN** a class does not allow a weapon's type and a reader selects that class
- **THEN** the weapon is not in the results

#### Scenario: Armor without a class rule
- **WHEN** the verified rule sets no class rule for armor and a reader selects a class
- **THEN** every armor item stays in the results

### Requirement: Item list names the gear type

The item list SHALL show one Type column that names what each item is, in readable title case: the weapon type of a weapon, the slot of jewelry, the armor type and slot of other armor, and the item type of any other item. The item list SHALL offer separate Weapon, Armor, Slot, and Type filters over the weapon type, the armor type, the slot, and the broad item type. An item without a weapon type SHALL NOT match a Weapon selection, and an item without an armor type SHALL NOT match an Armor selection.

#### Scenario: Shield row
- **WHEN** a reader opens the item list
- **THEN** a shield shows Shield in the Type column
- **AND** the Weapon filter offers Shield and the Type filter offers Weapon

#### Scenario: Armor row
- **WHEN** an item is plate armor for the helmet slot
- **THEN** its Type cell reads Plate Helmet

#### Scenario: Jewelry
- **WHEN** an item is a ring
- **THEN** its Type cell reads Ring

#### Scenario: Material
- **WHEN** an item has no weapon type and no armor type
- **THEN** its Type cell names its item type, such as Material
- **AND** it matches neither a Weapon nor an Armor selection

### Requirement: Item stats can be filtered and compared

The item list SHALL offer stat filters. A reader SHALL be able to add several stats, each with an optional inclusive minimum and maximum. A stat SHALL be identified by its name and its unit, so a flat stat and a percentage stat with the same name SHALL stay separate. A stat filter without bounds SHALL match items that have the stat. A fixed amount SHALL match when it lies within the bounds. A random stat SHALL match when its range overlaps the bounds and SHALL show as a range. Each selected stat SHALL add a sortable column with the item's amount.

#### Scenario: Minimum strength
- **WHEN** a reader adds Strength with a minimum of 20
- **THEN** the results are the items with at least 20 Strength
- **AND** a Strength column shows each amount and sorts by it

#### Scenario: Flat and percentage
- **WHEN** a reader adds a percentage stat
- **THEN** an item with only the flat stat of the same name does not match

#### Scenario: Random range
- **WHEN** an item's random range for a stat overlaps the selected bounds
- **THEN** the item matches and its cell shows the range

### Requirement: Crafting materials can be found

The item list SHALL offer a Used in crafting filter. It SHALL match items that at least one published recipe uses as a material. A recipe's product SHALL NOT match because of that recipe alone.

#### Scenario: Material and product
- **WHEN** a recipe uses one item and produces another
- **THEN** the filter includes the material and does not include the product for that recipe

### Requirement: Quests can be filtered by reward type

The quest list SHALL offer a Reward type filter over the reward types of its quests: Experience, Item, Currency, and Item choice. A quest SHALL match a type when its given or choice rewards include that type, including rewards without a linked record. A quest that offers a choice of items SHALL match both Item and Item choice. An item that a quest supplies before completion SHALL NOT count as a reward.

#### Scenario: Item choice
- **WHEN** a quest offers a choice of items
- **THEN** it matches the Item and the Item choice reward types

#### Scenario: Supplied item
- **WHEN** a quest supplies an item and rewards no item
- **THEN** it does not match the Item reward type

### Requirement: Filter state lives in the URL

The list SHALL keep its name search, sort, facet values, ranges, and stat filters in the URL. Opening or reloading a URL SHALL restore the controls and the results. Back and Forward SHALL restore earlier selections. Labels, chips, and columns SHALL use reader-facing names, not record ids or raw enum words.

#### Scenario: Shared filtered list
- **WHEN** a reader opens `/items/?class=Shieldmaster&slot=BOOTS&stat=Stamina:10:`
- **THEN** the class, slot, and stat filters are selected and their combined results show

#### Scenario: Clear and return
- **WHEN** a reader selects Clear all and then Back
- **THEN** the previous filters and results return

### Requirement: Filters do not rank content

Filtered lists SHALL keep every matching record and SHALL NOT rank items or quests as best or recommended. An item without a filter fact SHALL stay in the unfiltered list.

#### Scenario: Item without stats
- **WHEN** an item has no stats
- **THEN** it stays in the unfiltered item list
- **AND** a stat filter does not match it

### Requirement: List columns size to their values

Above phone widths a list SHALL show every value on one line. Each column SHALL take the width of its widest value or heading. A name SHALL be capped near the longest ordinary item name and a text that names another thing near the longest ordinary such name. The table SHALL fill its card. Spare width SHALL first show cut texts in full. The rest SHALL spread in equal parts between neighbouring columns, and after the last column when its values are left-aligned, each part showing after a left-aligned value or before a number, so the space between values is the same across the row. A name SHALL keep its cap and gain only its own part. When the columns do not fit, names and texts SHALL shrink first and labels only after them, each down to a floor, and a cut value SHALL end in an ellipsis. Numbers and badges SHALL NOT be cut. The tooltip and page of an entry SHALL show its whole name, and a cut cell SHALL show its whole value as its title, while a cell that fits SHALL have no title. A table wider than its card at its floors SHALL scroll inside its card, and no list SHALL scroll the page sideways at 1440, 1100, or 390 px. A list SHALL NOT show a column whose value is the same in every row. A link's hover area SHALL cover only its icon and name.

#### Scenario: Long variant name
- **WHEN** the item list shows Gilded Helm (Haste +17, Stamina +9, Strength +20)
- **THEN** the name ends in an ellipsis on one line
- **AND** its tooltip shows the whole name

#### Scenario: Spare width
- **WHEN** the ability list is wider than its names and sources
- **THEN** the table fills its card and the Source column shows each source in full

#### Scenario: Same value in every row
- **WHEN** every skill has the same highest level
- **THEN** the skill list shows no Highest level column

#### Scenario: Empty space beside a short name
- **WHEN** a reader points at the empty part of a name cell beside a short name
- **THEN** no tooltip opens

#### Scenario: Recipe products
- **WHEN** a reader opens the recipe list
- **THEN** it shows no Product column, and each recipe links its product

#### Scenario: Recipe columns spread across the card
- **WHEN** a reader opens the recipe list at 1440 px
- **THEN** Recipe, Station, and Skill spread across the card with the same space after each column, instead of standing together at the left edge

### Requirement: The NPC list filters adventurers by class and party role

The NPC list SHALL offer a Class filter and a Party role filter. An adventurer of the world roster SHALL match its class and its party role, and an adventurer without a role of its own SHALL match Damage. An NPC that is not on the roster SHALL match no value of either filter.

#### Scenario: Healers
- **WHEN** a reader checks Healer in the NPC list's Party role filter
- **THEN** the list shows the eleven healers of the roster and no NPC outside it

### Requirement: The skill and guide lists say what each entry is

The skill list SHALL name each skill's type: Crafting for a skill that a recipe trains, Gathering for a skill that a gathering node trains, and Weapon for a skill that weapon hits train. It SHALL count each skill's recipes and gathering nodes and SHALL leave a count blank where it does not apply. The guide list SHALL show the sentence that says what each guide explains.

#### Scenario: Skill types
- **WHEN** a reader opens the skill list
- **THEN** Alchemy reads Crafting with 22 recipes, Mining reads Gathering with 14 gathering nodes, and Axes reads Weapon with both counts blank

#### Scenario: Guide descriptions
- **WHEN** a reader opens the guide list
- **THEN** each guide shows what it explains next to its name

### Requirement: List headings stay in view without covering rows

Above phone widths a list's column headings SHALL start directly above its first row, and SHALL stay below the result count while the reader scrolls the page. A table that does not fit its card SHALL scroll inside the card with its headings at the card's top.

#### Scenario: First row at a tablet width
- **WHEN** a reader opens the recipe list at 800 px
- **THEN** the first recipe shows directly below the column headings

#### Scenario: Headings while scrolling
- **WHEN** a reader scrolls down the item list
- **THEN** the column headings stay directly below the result count

### Requirement: Gear set counts identify exceptional thresholds

The Gear Sets list SHALL show each set's number of available pieces without a second column that repeats the same count for its final bonus. When the final bonus needs a different number of pieces, the row SHALL identify that threshold beside its piece count. The reader SHALL still be able to sort the column and open the set's tier details.

#### Scenario: Typical set
- **WHEN** a set's last bonus unlocks after all its pieces are equipped
- **THEN** its list row shows the piece count once

#### Scenario: Exceptional set
- **WHEN** Vermincrawl Garb has seven pieces and the last bonus unlocks at six
- **THEN** its row shows seven pieces and explicitly names the six-piece threshold without requiring a second count column

### Requirement: Catalog relationships link published entities

A catalog relation column SHALL preserve the identity of its referenced entity when it has a published page. Its value SHALL use the site's entity link and hover preview rather than a plain name. A relation without a published destination SHALL remain readable as plain text. Links SHALL retain compact cells and readable phone rows.

#### Scenario: Quest giver in a catalog row
- **WHEN** a quest row names an NPC giver with a published page
- **THEN** the giver cell links to that NPC and offers its standard preview

#### Scenario: Unpublished relation
- **WHEN** a row names an entity without a published page
- **THEN** the name remains visible without a dead link

### Requirement: Long lists open at once

A list SHALL build its first 60 rows when it opens, both when the server renders it and when a reader navigates to it, and SHALL then add the remaining rows of the current results in steps between frames until every row is present. A filter, search, or sort change SHALL start again from the first rows of the new results. The column widths SHALL fit the widest values of all current results from the first frame and SHALL NOT change while rows are added. Until the list has measured its columns, as in the page that the server renders, the table SHALL scroll inside its card instead of reaching past it. The result count SHALL always state the number of all current results.

#### Scenario: Reader opens the Items list
- **WHEN** a reader follows a link to the Items list
- **THEN** the list shows its first rows without building all 1,195 rows first, and the remaining rows follow without a long stall

#### Scenario: Widths stay while rows are added
- **WHEN** the Items list adds its remaining rows
- **THEN** no column changes its width

#### Scenario: Reader filters while rows are added
- **WHEN** a reader types in the filter field before every row is present
- **THEN** the list starts again from the first matching rows and its count names every match

#### Scenario: List before its script runs
- **WHEN** a reader sees the Quests list before the page's script has measured its columns
- **THEN** the table scrolls inside its card and no value reaches past the card

### Requirement: Range filters match values shown as ranges

A numeric list column whose cell shows a range as text, such as an NPC's level range, SHALL publish the numbers behind it. A minimum or maximum for that column SHALL keep a row whose range overlaps the bounds. A range without an upper end SHALL match any minimum at or above its lowest value. A row without published numbers for the column SHALL NOT match a bound.

#### Scenario: Level range overlaps the bounds
- **WHEN** a reader sets a minimum level of 20 on the NPC list
- **THEN** an NPC of level 15–30 stays in the list and an NPC of level 8 does not

#### Scenario: Level without an upper end
- **WHEN** a reader sets a minimum level of 100 on the NPC list
- **THEN** an NPC whose level reads 40+ stays in the list

### Requirement: Lists default to entries with a known way

The Items, NPCs, and Abilities lists SHALL hide by default only entries for which the published documents provide no known way to acquire the item, meet the NPC, or learn, use, or obtain the ability. An item with any published acquisition source, an NPC with a location, adventurer roster membership, published summoning, spawn or recruitment evidence, or a reference from another published page, and an ability with any published learner or user SHALL remain visible. An unbound loot list, an action that consumes its own item, or an unrelated mention SHALL NOT count as an acquisition source. A hidden entry SHALL remain published and reachable with a counted reveal. Other lists SHALL remain visible by default.

#### Scenario: Referenced or summoned NPC
- **WHEN** an NPC has no map location but a published effect summons it or another published page references it
- **THEN** the NPC appears in the default list

#### Scenario: Unknown acquisition and later recovery
- **WHEN** an item has no published acquisition source
- **THEN** it is hidden by default but appears when the reader reveals entries without a known way
- **AND** publishing a real source later makes it visible by default without a maintained exclusion list

#### Scenario: Unbound source is not a known way
- **WHEN** an item occurs in a loot list with no known owner or source
- **THEN** the list does not suggest a player can obtain it from that unbound list

### Requirement: Hidden reveals respect the current search and filters

A list SHALL count hidden entries matching its current name search, selected facets, numeric ranges, and stat filters. The reveal SHALL be offered only when that count is positive, and activating it SHALL show the matching hidden entries. The count SHALL never present the total hidden across the kind as the matching count of a narrowed search.

#### Scenario: Shout is hidden by default
- **WHEN** the reader searches the Abilities list for Shout before revealing entries with no known use
- **THEN** the reveal counts the matching hidden Shout and not every hidden ability
- **AND** activating the reveal shows Shout among matching results

#### Scenario: Other filters narrow the reveal
- **WHEN** the reader searches by name and selects a facet or an inclusive numeric range
- **THEN** the hidden reveal counts only entries satisfying those choices

### Requirement: List columns reflect matching entries

Lists SHALL choose informative columns from the rows matching the current search and filters, retain reader-selected numeric range filters even when their column is not informative, and keep fitted proportional table widths when columns change. A weapon-focused Items list SHALL display Damage where published, and an adventurer-focused NPC list SHALL display Class and Party Role. Narrow screens SHALL retain all applicable information without sideways page scrolling.

#### Scenario: Adventurer role selection
- **WHEN** the reader selects Role: Adventurer on the NPC list
- **THEN** the matching NPC rows display their starting level, Class and Party Role columns
- **AND** the Place column does not imply a world location for Friends-panel adventurers

#### Scenario: Weapon type selection
- **WHEN** the reader selects Weapon: Sword on the Items list
- **THEN** a Damage column shows the published range for swords that have one

### Requirement: NPC list roles represent the encounter

An adventurer SHALL show an Adventurer badge and a badge naming its party role, and its starting level SHALL populate the Level column. A boss whose NPC role also marks it as an enemy SHALL show Boss alone. The adventurer's Friends-panel availability SHALL NOT be represented as a map place.

#### Scenario: Tank adventurer
- **WHEN** the reader browses the NPC list row of a Tank adventurer
- **THEN** the row displays Adventurer and Tank badges with its published starting level and no invented place

#### Scenario: Boss and enemy markers
- **WHEN** an NPC carries Boss and Enemy encounter markers
- **THEN** the role badges read Boss, not Boss and Enemy
