# list-filters Specification

## Purpose
Let readers narrow the published lists by game facts, compare item stats, and share filtered views. Keep every record in the unfiltered lists.

## Requirements

### Requirement: Lists share one filter panel

Each list of at least 20 rows with facets or numeric columns SHALL show its filters in one panel.

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

#### Scenario: Lists share one filter panel
- **WHEN** A reader opens a list of 20 rows with facets.
- **THEN** The list shows its filters in one panel.

### Requirement: Wide-screen filter panel placement

From 960 px wide, the filter panel SHALL sit beside the results.

#### Scenario: Wide-screen filter panel placement
- **WHEN** A reader views a list's filter panel at 960 px wide.
- **THEN** The panel sits beside the results.

### Requirement: Mobile filter sheet controls

Below 960 px, a Filters button SHALL show the number of active filters and open the panel as a full-height sheet with a button that shows the result count and closes the sheet.

#### Scenario: Mobile filter sheet controls
- **WHEN** A reader below 960 px opens Filters with two active filters and then uses the sheet's result-count button.
- **THEN** The Filters button shows two active filters, the panel opens as a full-height sheet, and the button shows the result count and closes the sheet.

### Requirement: Facet checkbox values

A facet SHALL render its values as checkboxes.

#### Scenario: Facet checkbox values
- **WHEN** A reader views a facet's values.
- **THEN** The values appear as checkboxes.

### Requirement: Facet union and filter intersection

Several values of one facet SHALL match a row that has any of them, and different filters SHALL all apply.

#### Scenario: Facet union and filter intersection
- **WHEN** A reader selects Boots and Gloves in Slot and Rare in Rarity.
- **THEN** Rows match either selected slot and also match Rare.

### Requirement: Facet prospective match counts

Each facet value SHALL show how many rows would match if it were selected, given the other active filters.

#### Scenario: Facet prospective match counts
- **WHEN** A reader activates a rarity filter and inspects unselected Slot values.
- **THEN** Each Slot value shows how many rows would match that value given the active rarity filter.

### Requirement: Suppress universal values and empty facets

The panel SHALL NOT offer a value that every row has, unless it is selected, and SHALL NOT show a facet that offers no value.

#### Scenario: Suppress universal values and empty facets
- **WHEN** A panel has an unselected value shared by every row, a selected value shared by every row, and a facet offering no value.
- **THEN** The unselected universal value and empty facet are hidden, while the selected universal value remains offered.

### Requirement: Search large facets

A facet with more than ten values SHALL offer a search field for its values.

#### Scenario: Search large facets
- **WHEN** A reader opens a facet containing eleven values.
- **THEN** The facet offers a search field for its values.

### Requirement: Collapsible filter groups

Every group of the panel, including ranges and stats, SHALL open and close from its heading.

#### Scenario: Collapsible filter groups
- **WHEN** A reader activates the headings of range and stats groups.
- **THEN** Each group opens or closes from its heading.

### Requirement: Filter group heading indicators

The heading SHALL show a chevron that turns with the group's state and the number of active filters in the group, and SHALL NOT share a line with the group's separator.

#### Scenario: Filter group heading indicators
- **WHEN** A reader toggles a group with one active filter.
- **THEN** The heading's chevron turns with the state, shows one active filter, and stays on a separate line from the group's separator.

### Requirement: Collapsed groups retain filters

Closing a group SHALL NOT clear its filters.

#### Scenario: Collapsed groups retain filters
- **WHEN** A reader closes a group containing an active filter.
- **THEN** The filter remains active.

### Requirement: Item filter initial groups

On the item list, Slot, Rarity, Level, and Stats SHALL start open and the other groups SHALL start closed.

#### Scenario: Item filter initial groups
- **WHEN** A reader opens the item list without active filters or reader-set group states.
- **THEN** Slot, Rarity, Level, and Stats start open, and all other groups start closed.

### Requirement: NPC filter initial groups

On the NPC list, Place and Faction SHALL start closed and the other groups SHALL start open.

#### Scenario: NPC filter initial groups
- **WHEN** A reader opens the NPC list without active filters or reader-set group states.
- **THEN** Place and Faction start closed, and all other groups start open.

### Requirement: Quest filter initial groups

On the quest list, Area and Chain SHALL start closed and the other groups SHALL start open.

#### Scenario: Quest filter initial groups
- **WHEN** A reader opens the quest list without active filters or reader-set group states.
- **THEN** Area and Chain start closed, and all other groups start open.

### Requirement: Other list initial groups

Every list other than the item, NPC, and quest lists SHALL start with all groups open.

#### Scenario: Other list initial groups
- **WHEN** A reader opens another list without reader-set group states.
- **THEN** All filter groups start open.

### Requirement: Active filter opening and reader state retention

A group with an active filter SHALL open, and a group that the reader opened or closed SHALL keep that state while filters change.

#### Scenario: Active filter opening and reader state retention
- **WHEN** A reader opens a list with an active Place filter, closes the Place group, and changes another filter.
- **THEN** Place initially opens for the active filter, and the reader's subsequent closed state persists while filters change.

### Requirement: Immediate result updates

Results SHALL update on each filter change.

#### Scenario: Immediate result updates
- **WHEN** A reader changes a filter selection.
- **THEN** The results update for that change.

### Requirement: Filtered result count format

The result count SHALL read as "N of M" when filters hide rows.

#### Scenario: Filtered result count format
- **WHEN** Filters leave 12 of 30 rows visible.
- **THEN** The result count reads "12 of 30".

### Requirement: Removable active filter chips

Each active filter SHALL show as a removable chip above the results, with a Clear all control.

#### Scenario: Removable active filter chips
- **WHEN** A reader applies two filters.
- **THEN** Each active filter has a removable chip above the results, and a Clear all control is present.
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

The item list SHALL show one Type column that names what each item is, in readable title case: the weapon type of a weapon, the slot of jewelry, the armor type and slot of other armor, and the item type of any other item.

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

#### Scenario: Item list names the gear type
- **WHEN** The item list shows a weapon whose weapon type is GREAT_SWORD.
- **THEN** Its Type cell reads Great Sword.

### Requirement: Item list offers separate gear filters

The item list SHALL offer separate Weapon, Armor, Slot, and Type filters over the weapon type, the armor type, the slot, and the broad item type.

#### Scenario: Item list offers separate gear filters
- **WHEN** A reader opens the item list's filters.
- **THEN** Separate Weapon, Armor, Slot, and Type filters are available for weapon type, armor type, slot, and broad item type, respectively.

### Requirement: Weapon selections exclude items without weapon types

An item without a weapon type SHALL NOT match a Weapon selection.

#### Scenario: Weapon selections exclude items without weapon types
- **WHEN** A reader selects Sword in the Weapon filter and an item has no weapon type.
- **THEN** That item does not match the selection.

### Requirement: Armor selections exclude items without armor types

An item without an armor type SHALL NOT match an Armor selection.

#### Scenario: Armor selections exclude items without armor types
- **WHEN** A reader selects Plate in the Armor filter and an item has no armor type.
- **THEN** That item does not match the selection.
### Requirement: Item stats can be filtered and compared

The item list SHALL offer stat filters. A reader SHALL be able to add several stats, each with an optional inclusive minimum and maximum.

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

#### Scenario: Item stats can be filtered and compared
- **WHEN** A reader adds Strength with bounds of 10 and 20 and Stamina without bounds.
- **THEN** Both stat filters are selected, Strength includes its minimum and maximum, and Stamina requires no bounds.

### Requirement: Stat identity includes its unit

A stat SHALL be identified by its name and its unit, so a flat stat and a percentage stat with the same name SHALL stay separate.

#### Scenario: Stat identity includes its unit
- **WHEN** Flat Critical Chance and percentage Critical Chance are available as stats.
- **THEN** They are identified separately by their name and unit.

### Requirement: Unbounded stat filters require the stat

A stat filter without bounds SHALL match items that have the stat.

#### Scenario: Unbounded stat filters require the stat
- **WHEN** A reader selects Stamina without bounds and an item has 5 Stamina.
- **THEN** The item matches the Stamina filter.

### Requirement: Fixed stats match inclusive bounds

A fixed amount SHALL match when it lies within the bounds.

#### Scenario: Fixed stats match inclusive bounds
- **WHEN** A reader filters Strength from 10 to 20 and an item has a fixed 20 Strength.
- **THEN** The item's Strength matches the bounds.

### Requirement: Random stats match overlapping bounds

A random stat SHALL match when its range overlaps the bounds.

#### Scenario: Random stats match overlapping bounds
- **WHEN** A reader filters Strength from 10 to 20 and an item's random Strength range is 5 to 12.
- **THEN** The item matches the Strength filter.

### Requirement: Random stats display ranges

A random stat SHALL show as a range.

#### Scenario: Random stats display ranges
- **WHEN** A selected Strength stat is random from 5 to 12 on an item.
- **THEN** The item's Strength is shown as a range from 5 to 12.

### Requirement: Selected stats add sortable amount columns

Each selected stat SHALL add a sortable column with the item's amount.

#### Scenario: Selected stats add sortable amount columns
- **WHEN** A reader selects Stamina and an item has 15 Stamina.
- **THEN** A sortable Stamina column is added and shows 15 for that item.

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

The list SHALL keep its name search, sort, facet values, ranges, and stat filters in the URL.

#### Scenario: Shared filtered list
- **WHEN** a reader opens `/items/?class=Shieldmaster&slot=BOOTS&stat=Stamina:10:`
- **THEN** the class, slot, and stat filters are selected and their combined results show

#### Scenario: Clear and return
- **WHEN** a reader selects Clear all and then Back
- **THEN** the previous filters and results return

#### Scenario: Name sort on a list sorted by a count
- **WHEN** a reader sorts the Effects list by name, in either direction, and reloads the page
- **THEN** the same name order returns

#### Scenario: Sort without a direction
- **WHEN** a reader opens `/stats/?sort=name`
- **THEN** the stats appear from A to Z

#### Scenario: Filter state lives in the URL
- **WHEN** A reader sets a name search, a sort, a facet value, a range, and a stat filter.
- **THEN** The URL contains all five parts of the list state.

### Requirement: Opening and reloading restores list state

Opening or reloading a URL SHALL restore the controls and the results.

#### Scenario: Opening and reloading restores list state
- **WHEN** A reader reloads a list URL containing a name search and a range.
- **THEN** The name search and range controls and their results are restored.

### Requirement: History navigation restores selections

Back and Forward SHALL restore earlier selections.

#### Scenario: History navigation restores selections
- **WHEN** A reader changes a facet selection, goes Back, and then goes Forward.
- **THEN** Back restores the earlier selection and Forward restores the later selection.

### Requirement: List labels use reader-facing names

Labels, chips, and columns SHALL use reader-facing names, not record ids or raw enum words.

#### Scenario: List labels use reader-facing names
- **WHEN** A reader selects a facet whose raw enum word is GREAT_SWORD.
- **THEN** Its labels, chips, and columns use the reader-facing name rather than GREAT_SWORD or a record id.

### Requirement: Sort omission requires the default sort

The URL SHALL omit the sort only when it equals the list's default.

#### Scenario: Sort omission requires the default sort
- **WHEN** A reader selects a sort other than the list's default.
- **THEN** The URL does not omit the sort.

### Requirement: Direction omission follows column defaults

The URL SHALL omit the direction only when it equals the default sort's direction or, for another column, that column's first-click direction (A to Z for text, high to low for numbers).

#### Scenario: Direction omission follows column defaults
- **WHEN** A reader sorts a nondefault numeric column from low to high.
- **THEN** The URL retains the direction because that column's first-click direction is high to low.

### Requirement: Missing direction uses the column default

A URL that names a sort without a direction SHALL use the default sort's direction for the default sort or, for another column, that column's first-click direction (A to Z for text, high to low for numbers).

#### Scenario: Missing direction uses the column default
- **WHEN** A reader opens a URL naming a nondefault numeric sort without a direction.
- **THEN** The list sorts that column from high to low.

### Requirement: Numeric headings align with values

Numeric column headings SHALL align their label with the numbers below them.

#### Scenario: Numeric headings align with values
- **WHEN** A list displays a numeric Level column.
- **THEN** The Level heading label aligns with the numbers below it.
### Requirement: Filters do not rank content

Filtered lists SHALL keep every matching record and SHALL NOT rank items or quests as best or recommended. An item without a filter fact SHALL stay in the unfiltered list.

#### Scenario: Item without stats
- **WHEN** an item has no stats
- **THEN** it stays in the unfiltered item list
- **AND** a stat filter does not match it

### Requirement: List columns size to their values

Above phone widths a list SHALL show every value on one line.

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

#### Scenario: List columns size to their values
- **WHEN** A reader views a list above phone widths.
- **THEN** Every value occupies one line.

### Requirement: Columns use their widest content

Each column SHALL take the width of its widest value or heading.

#### Scenario: Columns use their widest content
- **WHEN** A column's heading is wider than every value in the column.
- **THEN** The column takes the width of the heading.

### Requirement: Names and reference texts have ordinary-name caps

A name SHALL be capped near the longest ordinary item name and a text that names another thing near the longest ordinary such name.

#### Scenario: Names and reference texts have ordinary-name caps
- **WHEN** A list contains an unusually long item name and an unusually long text naming another thing.
- **THEN** The item name is capped near the longest ordinary item name, and the reference text is capped near the longest ordinary such name.

### Requirement: Tables fill their cards

The table SHALL fill its card.

#### Scenario: Tables fill their cards
- **WHEN** A list's content would otherwise occupy less width than its card.
- **THEN** The table fills the card.

### Requirement: Spare width first reveals cut text

Spare width SHALL first show cut texts in full.

#### Scenario: Spare width first reveals cut text
- **WHEN** A table has cut text and gains enough spare width to show that text in full.
- **THEN** The spare width first reveals the cut text in full.

### Requirement: Remaining width creates equal intercolumn spacing

The remaining spare width SHALL spread in equal parts between neighbouring columns, and after the last column when its values are left-aligned, each part showing after a left-aligned value or before a number, so the space between values is the same across the row.

#### Scenario: Remaining width creates equal intercolumn spacing
- **WHEN** Spare width remains after cut texts are shown in full in a table with left-aligned and numeric values and a left-aligned last column.
- **THEN** Equal parts appear between neighbouring columns and after the last column, after left-aligned values or before numbers, giving equal space between values across the row.

### Requirement: Names retain caps during width distribution

A name SHALL keep its cap and gain only its own part of the remaining spare width.

#### Scenario: Names retain caps during width distribution
- **WHEN** Remaining spare width is distributed across a table containing a capped name.
- **THEN** The name keeps its cap and gains only its own part of the spare width.

### Requirement: Columns shrink in content priority order

When the columns do not fit, names and texts SHALL shrink first and labels only after them, each down to a floor.

#### Scenario: Columns shrink in content priority order
- **WHEN** A table's columns do not fit and names and texts can still shrink toward their floors.
- **THEN** Names and texts shrink before labels, with each shrinking only down to its floor.

### Requirement: Cut values end in an ellipsis

A cut value SHALL end in an ellipsis.

#### Scenario: Cut values end in an ellipsis
- **WHEN** A text value is cut to fit its column.
- **THEN** The displayed value ends in an ellipsis.

### Requirement: Numbers and badges remain uncut

Numbers and badges SHALL NOT be cut.

#### Scenario: Numbers and badges remain uncut
- **WHEN** A list has insufficient width for all of its columns.
- **THEN** Its numbers and badges remain uncut.

### Requirement: Entry tooltips and pages show whole names

The tooltip and page of an entry SHALL show its whole name.

#### Scenario: Entry tooltips and pages show whole names
- **WHEN** A reader views an entry's tooltip and opens the entry's page.
- **THEN** Both show the entry's whole name.

### Requirement: Cell titles depend on truncation

A cut cell SHALL show its whole value as its title, while a cell that fits SHALL have no title.

#### Scenario: Cell titles depend on truncation
- **WHEN** A row contains a cut text cell and a text cell whose value fits.
- **THEN** The cut cell's title is its whole value, and the cell that fits has no title.

### Requirement: Tables at width floors scroll within cards

A table wider than its card at its floors SHALL scroll inside its card.

#### Scenario: Tables at width floors scroll within cards
- **WHEN** All shrinkable columns have reached their floors and the table is still wider than its card.
- **THEN** The table scrolls inside the card.

### Requirement: Lists do not cause sideways page scrolling

No list SHALL scroll the page sideways at 1440, 1100, or 390 px.

#### Scenario: Lists do not cause sideways page scrolling
- **WHEN** A reader views a wide list at each of 1440, 1100, and 390 px.
- **THEN** The list causes no sideways page scrolling at any of those widths.

### Requirement: Uniform-value columns are hidden

A list SHALL NOT show a column whose value is the same in every row.

#### Scenario: Uniform-value columns are hidden
- **WHEN** Every row in a list has the same rarity value.
- **THEN** The list shows no Rarity column.

### Requirement: Link hover areas stay on icons and names

A link's hover area SHALL cover only its icon and name.

#### Scenario: Link hover areas stay on icons and names
- **WHEN** A reader moves the pointer from a linked entry's icon to its name and then into the surrounding cell space.
- **THEN** The icon and name are within the link's hover area, but the surrounding cell space is not.

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

A list SHALL build its first 60 rows when it opens, both when the server renders it and when a reader navigates to it.

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

#### Scenario: Long lists open at once
- **WHEN** A list with 200 results is rendered by the server or opened through reader navigation.
- **THEN** The list initially builds its first 60 rows in either case.

### Requirement: Remaining rows build between frames

After building its first 60 rows, a list SHALL add the remaining rows of the current results in steps between frames until every row is present.

#### Scenario: Remaining rows build between frames
- **WHEN** A list with 200 current results has built its first 60 rows.
- **THEN** The remaining 140 rows are added in steps between frames until all 200 rows are present.

### Requirement: Result changes restart row building

A filter, search, or sort change SHALL start again from the first rows of the new results.

#### Scenario: Result changes restart row building
- **WHEN** A reader changes the sort while a list is adding rows.
- **THEN** Row building starts again from the first rows of the newly sorted results.

### Requirement: Column widths account for all results immediately

The column widths SHALL fit the widest values of all current results from the first frame.

#### Scenario: Column widths account for all results immediately
- **WHEN** The widest value in a result set belongs to a row after the first 60.
- **THEN** The column width fits that value from the first frame.

### Requirement: Column widths remain stable during row additions

The column widths SHALL NOT change while rows are added.

#### Scenario: Column widths remain stable during row additions
- **WHEN** A list adds a later row containing a wider value than any already displayed row.
- **THEN** The column widths do not change.

### Requirement: Unmeasured tables scroll within cards

Until the list has measured its columns, as in the page that the server renders, the table SHALL scroll inside its card instead of reaching past it.

#### Scenario: Unmeasured tables scroll within cards
- **WHEN** A server-rendered table is wider than its card and the list has not measured its columns.
- **THEN** The table scrolls inside its card rather than reaching past it.

### Requirement: Result counts include unbuilt rows

The result count SHALL always state the number of all current results.

#### Scenario: Result counts include unbuilt rows
- **WHEN** A list has 200 current results but has built only its first 60 rows.
- **THEN** The result count states 200.
### Requirement: Range filters match values shown as ranges

A numeric list column whose cell shows a range as text, such as an NPC's level range, SHALL publish the numbers behind it. A minimum or maximum for that column SHALL keep a row whose range overlaps the bounds. A range without an upper end SHALL match any minimum at or above its lowest value. A row without published numbers for the column SHALL NOT match a bound.

#### Scenario: Level range overlaps the bounds
- **WHEN** a reader sets a minimum level of 20 on the NPC list
- **THEN** an NPC of level 15–30 stays in the list and an NPC of level 8 does not

#### Scenario: Level without an upper end
- **WHEN** a reader sets a minimum level of 100 on the NPC list
- **THEN** an NPC whose level reads 40+ stays in the list

### Requirement: Lists default to entries with a known way

The Items, NPCs, and Abilities lists SHALL hide by default only entries for which the published documents provide no known way to acquire the item, meet the NPC, or learn, use, or obtain the ability.

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

#### Scenario: Lists default to entries with a known way
- **WHEN** An ability has no published way to learn, use, or obtain it.
- **THEN** The Abilities list hides the ability by default.

### Requirement: Published evidence keeps entries visible

An item with any published acquisition source, an NPC with a location, adventurer roster membership, published summoning, spawn or recruitment evidence, or a reference from another published page, and an ability with any published learner or user SHALL remain visible.

#### Scenario: Published evidence keeps entries visible
- **WHEN** An NPC has published adventurer roster membership.
- **THEN** The NPC remains visible in the default NPCs list.

### Requirement: Invalid acquisition evidence is excluded

An unbound loot list, an action that consumes its own item, or an unrelated mention SHALL NOT count as an acquisition source.

#### Scenario: Invalid acquisition evidence is excluded
- **WHEN** The only action mentioning an item consumes that same item.
- **THEN** The action does not count as an acquisition source.

### Requirement: Hidden entries remain published and reachable

A hidden entry SHALL remain published and reachable with a counted reveal.

#### Scenario: Hidden entries remain published and reachable
- **WHEN** An item is hidden from its default list.
- **THEN** The item remains published and can be reached with a counted reveal.

### Requirement: Other lists remain visible

Other lists SHALL remain visible by default.

#### Scenario: Other lists remain visible
- **WHEN** A reader opens a list other than Items, NPCs, or Abilities.
- **THEN** The list remains visible by default.
### Requirement: Hidden reveals respect the current search and filters

A list SHALL count hidden entries matching its current name search, selected facets, numeric ranges, and stat filters. The count SHALL never present the total hidden across the kind as the matching count of a narrowed search.

#### Scenario: Shout is hidden by default
- **WHEN** the reader searches the Abilities list for Shout before revealing entries with no known use
- **THEN** the reveal counts the matching hidden Shout and not every hidden ability
- **AND** activating the reveal shows Shout among matching results

#### Scenario: Other filters narrow the reveal
- **WHEN** the reader searches by name and selects a facet or an inclusive numeric range
- **THEN** the hidden reveal counts only entries satisfying those choices

#### Scenario: Hidden item is explained and revealed
- **WHEN** the reader sees an Items reveal button and hovers, focuses, or taps its explanation control
- **THEN** the reader sees the same plain explanation and the button names the number of items without a known source
- **AND** selecting the reveal retains search and shows an Availability chip reading "Without a Known Source"

#### Scenario: Hidden NPC and ability have distinct wording
- **WHEN** an NPC or ability list contains hidden entries
- **THEN** each reveal button names NPCs not found in the world or abilities nobody uses, with the singular form when exactly one matches
- **AND** an ability revealed through a name search has an empty Source cell and shows "Nobody Uses It" only in Availability

#### Scenario: Hidden entries stay out of the way
- **WHEN** a list offers a reveal for hidden entries
- **THEN** the reveal appears as a muted text link at the end of the result bar, without a border, fill, or accent color
- **AND** the count, active filter chips, and Clear All remain the most prominent controls in the bar

#### Scenario: Hidden reveals respect the current search and filters
- **WHEN** A name search, selected facet, numeric range, and stat filter leave two matching hidden items out of ten hidden items.
- **THEN** The matching hidden count is two, not ten.

### Requirement: Reveal availability follows the matching count

The reveal SHALL be offered only when the matching hidden count is positive.

#### Scenario: Reveal availability follows the matching count
- **WHEN** The current filters match no hidden entries.
- **THEN** The reveal is not offered.

### Requirement: Reveal activation shows matching hidden entries

Activating the reveal SHALL show the matching hidden entries.

#### Scenario: Reveal activation shows matching hidden entries
- **WHEN** A reader activates a reveal for two matching hidden entries.
- **THEN** The two matching hidden entries are shown.

### Requirement: Reveal buttons use kind-specific wording

The reveal's sentence-case button SHALL say what is missing for its kind: "Show 91 items without a known source", "Show 3 NPCs not found in the world", or "Show 49 abilities nobody uses", with singular forms for one entry.

#### Scenario: Reveal buttons use kind-specific wording
- **WHEN** Exactly one hidden item matches the current filters.
- **THEN** The sentence-case reveal button says "Show 1 item without a known source".

### Requirement: Reveal explanations support hover focus and tap

On hover, focus, and tap, the reveal SHALL offer the shared explanation "These are in the game's files, but we found no way to get, meet, or use them in this version."

#### Scenario: Reveal explanations support hover focus and tap
- **WHEN** A reader focuses the reveal.
- **THEN** The reveal offers "These are in the game's files, but we found no way to get, meet, or use them in this version."

### Requirement: Availability labels are readable and kind-specific

Availability facets and selected chips SHALL use readable kind-specific labels rather than "Known Way" or "No Known Way".

#### Scenario: Availability labels are readable and kind-specific
- **WHEN** An Items Availability facet and its selected chip are displayed.
- **THEN** Both use readable item-specific labels rather than "Known Way" or "No Known Way".

### Requirement: Unused ability wording stays in Availability

An ability with no known use SHALL show "Nobody Uses It" only in the Availability filter and chip, not in the Source column or filter.

#### Scenario: Unused ability wording stays in Availability
- **WHEN** An ability with no known use is displayed with Availability and Source controls.
- **THEN** "Nobody Uses It" appears only in the Availability filter and chip, not in the Source column or filter.

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

### Requirement: Browse views keep useful facts aligned

Gallery and table SHALL share the same sentence-case name filter and result count, including their spacing above the content.

#### Scenario: Gallery and table controls
- **WHEN** a reader switches between Gallery and Table at desktop or phone width
- **THEN** the filter and count use the same words, size, and position above content

#### Scenario: Property price and income
- **WHEN** a property has a purchase price, currency, income, and income interval
- **THEN** both views name the currency and say how often active play pays that income
- **AND** a missing currency omits its unit without substituting a placeholder

#### Scenario: Place comparisons
- **WHEN** a place name ends with its displayed level range
- **THEN** the browse card or row names that range only once
- **AND** ordinary zones show useful creatures or quests instead of an empty boss count

#### Scenario: Hidden ability sources
- **WHEN** abilities without a known use have not been revealed
- **THEN** the Source filter does not offer a zero-count option for those hidden abilities

#### Scenario: Distinct row facts
- **WHEN** the Furnace uses Metallurgy while the other crafting stations share their skill's name, or a faction has no NPC count
- **THEN** every station row shows its skill, and the unavailable faction count is explained

#### Scenario: Races and mechanics on phones
- **WHEN** a reader compares races or reads a mechanics table card on a phone
- **THEN** race cards show starting places and class availability, and descriptions span the mechanics card

#### Scenario: Readable desktop tables
- **WHEN** a reader opens gear sets at desktop width or quests at 1100–1280 px
- **THEN** piece counts align right and visible quest names and areas do not end mid-word

#### Scenario: Browse views keep useful facts aligned
- **WHEN** A reader switches a list from gallery to table.
- **THEN** The sentence-case name filter and result count remain the same, including their spacing above the content.

### Requirement: Property amounts retain known units and intervals

Property rows SHALL show a known currency beside each amount and the known income interval. An absent currency SHALL leave the amount readable without an invented unit.

#### Scenario: Property amounts retain known units and intervals
- **WHEN** A property has a known purchase currency and income interval but no known income currency.
- **THEN** Its row shows the purchase currency and income interval and leaves the income amount readable without inventing a unit.

### Requirement: Property images share a wide scene frame

Property artwork SHALL fill the same wide scene frame whether the picture comes from artwork or an icon.

#### Scenario: Property images share a wide scene frame
- **WHEN** A property's picture comes from an icon.
- **THEN** The icon fills the same wide scene frame used for artwork.

### Requirement: Place cards avoid duplicate level ranges

Place cards SHALL show a level range once.

#### Scenario: Place cards avoid duplicate level ranges
- **WHEN** A place name already includes the displayed level range.
- **THEN** The card shows the level range only once.

### Requirement: Ordinary zones show useful counts

Ordinary zones SHALL not advertise zero bosses in their table cards and SHALL show available creature or quest counts instead.

#### Scenario: Ordinary zones show useful counts
- **WHEN** An ordinary zone has zero bosses and an available creature count.
- **THEN** Its table card shows the creature count instead of advertising zero bosses.

### Requirement: Gear-set piece counts align numerically

Gear-set piece counts SHALL align with other numeric columns.

#### Scenario: Gear-set piece counts align numerically
- **WHEN** Gear sets are displayed with other numeric columns.
- **THEN** The piece counts align with those numeric columns.

### Requirement: Recipe and station rows show known skills

Every recipe and station row SHALL show its skill, and a blank cell SHALL never stand for a known skill.

#### Scenario: Recipe and station rows show known skills
- **WHEN** A station row has the known skill Metallurgy.
- **THEN** The row shows Metallurgy rather than a blank cell.

### Requirement: Skill column omission requires matching station names

The Skill column SHALL be left out only when every row's skill matches its station's name.

#### Scenario: Skill column omission requires matching station names
- **WHEN** One row's skill differs from its station's name.
- **THEN** The Skill column is not left out.

### Requirement: Abilities Source options respect unrevealed entries

The Abilities Source filter SHALL not offer an unavailable zero-count value before its entries are revealed.

#### Scenario: Abilities Source options respect unrevealed entries
- **WHEN** Entries for an unavailable zero-count Source value have not been revealed.
- **THEN** The Abilities Source filter does not offer that value.

### Requirement: Quest facts stay readable at intermediate desktop widths

At 1100 to 1280 px, the Quest list SHALL keep the quest, level, chain, and area readable without cutting words, and MAY omit the giver from that view.

#### Scenario: Quest facts stay readable at intermediate desktop widths
- **WHEN** The Quest list is displayed at 1200 px.
- **THEN** The quest, level, chain, and area remain readable without cut words, whether or not the giver is shown.

### Requirement: Race cards preserve shared starting facts

Race table cards SHALL preserve the starting place and class availability even when they match across races.

#### Scenario: Race cards preserve shared starting facts
- **WHEN** Two races share a starting place and class availability.
- **THEN** Both race table cards retain the starting place and class availability.

### Requirement: Missing faction counts are explained

A faction with no count SHALL say the count is unavailable.

#### Scenario: Missing faction counts are explained
- **WHEN** A faction has no count.
- **THEN** The faction says the count is unavailable.

### Requirement: Phone mechanics descriptions use card width

On phones, a mechanics description SHALL use its card width.

#### Scenario: Phone mechanics descriptions use card width
- **WHEN** A mechanics card is displayed on a phone.
- **THEN** Its description uses the card width.
