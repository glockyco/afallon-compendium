# list-filters Specification

## Purpose
Let readers narrow the published lists by game facts, compare item stats, and share filtered views. Keep every record in the unfiltered lists.

## Requirements

### Requirement: Lists share one filter panel

Each list of at least 20 rows with facets or numeric columns SHALL show its filters in one panel. From 960 px wide, the panel SHALL sit beside the results. Below 960 px, a Filters button SHALL show the number of active filters and open the panel as a full-height sheet with a button that shows the result count and closes the sheet. A facet SHALL render its values as checkboxes. Several values of one facet SHALL match a row that has any of them, and different filters SHALL all apply. Each value SHALL show how many rows would match if it were selected, given the other active filters. The panel SHALL NOT offer a value that every row has, unless it is selected, and SHALL NOT show a facet that offers no value. A facet with more than ten values SHALL offer a search field for its values. Results SHALL update on each change. The result count SHALL read as "N of M" when filters hide rows. Each active filter SHALL show as a removable chip above the results, with a Clear all control.

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

The item list SHALL show a Gear column with the weapon type or armor type of each item, in readable title case, and SHALL offer a Gear filter over those values. An item without a gear type SHALL have an empty Gear cell and SHALL NOT match a Gear selection. The Type column and the Type filter SHALL keep the broad item type.

#### Scenario: Shield row
- **WHEN** a reader opens the item list
- **THEN** a shield shows Weapon in the Type column and Shield in the Gear column

#### Scenario: Material
- **WHEN** an item has no weapon type and no armor type
- **THEN** its Gear cell is empty

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
