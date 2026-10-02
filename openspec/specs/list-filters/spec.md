# list-filters Specification

## Purpose
Let readers narrow the published lists by game facts, compare item stats, and share filtered views. Keep every record in the unfiltered lists.

## Requirements

### Requirement: Lists share one filter panel

Each list of at least 20 rows with facets or numeric columns SHALL show its filters in one panel. From 960 px wide, the panel SHALL sit beside the results. Below 960 px, a Filters button SHALL show the number of active filters and open the panel as a full-height sheet with a button that shows the result count and closes the sheet. A facet SHALL render its values as checkboxes. Several values of one facet SHALL match a row that has any of them, and different filters SHALL all apply. Each value SHALL show how many rows would match if it were selected, given the other active filters. The panel SHALL NOT offer a value that every row has, unless it is selected, and SHALL NOT show a facet that offers no value. A facet with more than ten values SHALL offer a search field for its values. Every group of the panel, including ranges and stats, SHALL open and close from its heading. The heading SHALL show a chevron that turns with the group's state and the number of active filters in the group, and SHALL NOT share a line with the group's separator. Closing a group SHALL NOT clear its filters. On the item list, Slot, Rarity, Level, and Stats SHALL start open and the other groups SHALL start closed. Every other list SHALL start with all groups open. A group with an active filter SHALL open, and a group that the reader opened or closed SHALL keep that state while filters change. Results SHALL update on each change. The result count SHALL read as "N of M" when filters hide rows. Each active filter SHALL show as a removable chip above the results, with a Clear all control.

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

### Requirement: List names stay on one line

A list SHALL show each name on one line and SHALL end a name that does not fit in an ellipsis. The tooltip and the page of the entry SHALL show the whole name. A list with a type column and no stat columns SHALL size its name column to its longest name, up to a cap near the longest ordinary item name, and SHALL give the spare width to the type column. Any other list SHALL give the name the width that its other columns leave. No list SHALL scroll sideways at 1440, 1100, or 390 px.

#### Scenario: Long variant name
- **WHEN** the item list shows Gilded Helm (Haste +17, Stamina +9, Strength +20)
- **THEN** the name ends in an ellipsis on one line
- **AND** its tooltip shows the whole name

#### Scenario: Short names
- **WHEN** the item list shows only names shorter than the cap
- **THEN** the type column starts right after the longest name
