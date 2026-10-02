## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: List names stay on one line

A list SHALL show each name on one line and SHALL end a name that does not fit in an ellipsis. The tooltip and the page of the entry SHALL show the whole name. A list with a type column and no stat columns SHALL size its name column to its longest name, up to a cap near the longest ordinary item name, and SHALL give the spare width to the type column. Any other list SHALL give the name the width that its other columns leave. No list SHALL scroll sideways at 1440, 1100, or 390 px.

#### Scenario: Long variant name
- **WHEN** the item list shows Gilded Helm (Haste +17, Stamina +9, Strength +20)
- **THEN** the name ends in an ellipsis on one line
- **AND** its tooltip shows the whole name

#### Scenario: Short names
- **WHEN** the item list shows only names shorter than the cap
- **THEN** the type column starts right after the longest name
