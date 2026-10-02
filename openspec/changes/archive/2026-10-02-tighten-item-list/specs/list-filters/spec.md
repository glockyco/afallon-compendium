## MODIFIED Requirements

### Requirement: Lists share one filter panel

Each list of at least 20 rows with facets or numeric columns SHALL show its filters in one panel. From 960 px wide, the panel SHALL sit beside the results. Below 960 px, a Filters button SHALL show the number of active filters and open the panel as a full-height sheet with a button that shows the result count and closes the sheet. A facet SHALL render its values as checkboxes. Several values of one facet SHALL match a row that has any of them, and different filters SHALL all apply. Each value SHALL show how many rows would match if it were selected, given the other active filters. The panel SHALL NOT offer a value that every row has, unless it is selected, and SHALL NOT show a facet that offers no value. A facet with more than ten values SHALL offer a search field for its values. Every group of the panel, including ranges and stats, SHALL open and close from its heading. The heading SHALL show a chevron that turns with the group's state and the number of active filters in the group, and SHALL NOT share a line with the group's separator. Closing a group SHALL NOT clear its filters. Results SHALL update on each change. The result count SHALL read as "N of M" when filters hide rows. Each active filter SHALL show as a removable chip above the results, with a Clear all control.

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

### Requirement: Item list names the gear type

The item list SHALL show one Type column that names what each item is, in readable title case: the weapon type of a weapon, the slot of jewelry, the armor type and slot of other armor, and the item type of any other item. The item list SHALL offer separate Gear, Slot, and Type filters over the weapon or armor type, the slot, and the broad item type. An item without a weapon type or an armor type SHALL NOT match a Gear selection.

#### Scenario: Shield row
- **WHEN** a reader opens the item list
- **THEN** a shield shows Shield in the Type column
- **AND** the Gear filter offers Shield and the Type filter offers Weapon

#### Scenario: Armor row
- **WHEN** an item is plate armor for the helmet slot
- **THEN** its Type cell reads Plate Helmet

#### Scenario: Jewelry
- **WHEN** an item is a ring
- **THEN** its Type cell reads Ring

#### Scenario: Material
- **WHEN** an item has no weapon type and no armor type
- **THEN** its Type cell names its item type, such as Material
- **AND** it does not match a Gear selection
