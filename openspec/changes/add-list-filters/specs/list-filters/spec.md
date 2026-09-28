## Purpose

Let readers narrow published item and quest lists by captured game facts. Keep every record in the unfiltered lists and make filtered views easy to share.

## ADDED Requirements

### Requirement: Item class filter follows equipment rules

The item list SHALL offer a Class filter for published classes. A selected class SHALL match equipment only when captured item facts and a verified game equip rule establish compatibility. The filter SHALL use the class's captured weapon types for weapons. It SHALL apply any other class rule only when verified. An item without enough evidence SHALL remain on the unfiltered list and SHALL NOT be labeled compatible.

#### Scenario: Weapon type is allowed
- **WHEN** a published class allows a weapon's captured type and a reader selects that class
- **THEN** the item list includes that weapon in the class results

#### Scenario: Weapon type is not allowed
- **WHEN** a class does not allow a weapon's captured type and a reader selects that class
- **THEN** the item list does not include that weapon in the class results

#### Scenario: Armor has no class restriction in the verified rule
- **WHEN** the verified equip rule imposes no armor class restriction and a reader selects a class
- **THEN** every published armor item with a known equipment slot remains in the class results
- **AND** its item level requirement remains visible on its item page

#### Scenario: Missing equipment evidence
- **WHEN** an item lacks the facts needed for a class match
- **THEN** the unfiltered item list still includes that item
- **AND** the class filter does not claim that the class can equip it

### Requirement: Item stats support exact and range searches

The item list SHALL offer a Stat filter and inclusive minimum and maximum amount filters for the selected stat. A match SHALL use captured item stat values with their flat or percentage unit. A fixed stat SHALL match its captured amount. A random stat SHALL match only when its captured possible range intersects the selected range. The result SHALL distinguish a possible random value from a fixed value. The site SHALL NOT substitute game values or imply that a possible value is guaranteed.

#### Scenario: Fixed stat within a range
- **WHEN** a reader selects a flat stat and an inclusive amount range that contains an item's fixed amount
- **THEN** that item matches the filters and its fixed amount is identifiable

#### Scenario: Random stat may fall in a range
- **WHEN** an item's captured random range intersects the reader's selected range for the same stat and unit
- **THEN** that item matches and the result identifies its amount as possible

#### Scenario: Range excludes the stat
- **WHEN** neither a fixed amount nor a possible random range intersects the selected range
- **THEN** that item does not match the stat range

#### Scenario: Flat and percentage values differ
- **WHEN** two item stat entries share a stat name but one is flat and the other is a percentage
- **THEN** selecting one unit does not match the other unit

### Requirement: Crafting materials are discoverable

The item list SHALL offer a Crafting material filter. It SHALL match an item used as a material by at least one published recipe. It SHALL NOT include a product only because a recipe produces it.

#### Scenario: Material and product are different roles
- **WHEN** a recipe uses one item as a material and produces another item
- **THEN** the Crafting material filter includes the material
- **AND** it does not include the product on account of that recipe alone

### Requirement: Quest rewards can be filtered by type

The quest list SHALL offer a Reward type filter for captured reward types, including rewards that have no linked item. A quest SHALL match when any of its given or choice rewards has the selected type. Filter labels SHALL be readable category names.

#### Scenario: Currency and experience rewards
- **WHEN** a quest has a currency reward and an experience reward
- **THEN** it matches either corresponding reward type selection

#### Scenario: Chosen reward
- **WHEN** a quest offers an item as a reward choice
- **THEN** the quest matches the Item reward type

#### Scenario: Quest item supplied before completion
- **WHEN** a quest supplies an item but has no item in its given or choice rewards
- **THEN** the quest does not match the Item reward type because of the supplied item

### Requirement: Ability list identifies learning classes

The ability list SHALL show a Class column with the distinct published classes that learn each ability, across its versions. It SHALL keep NPC users separate in the Used by column. An ability without a published learning class SHALL remain in the list with an empty Class cell.

#### Scenario: Class and NPC use the same ability
- **WHEN** an ability has one learning class and an NPC user
- **THEN** the Class column names the class
- **AND** the Used by column names the NPC

#### Scenario: No published learning class
- **WHEN** an ability has no published learning class
- **THEN** its row remains in the list without a Class value

### Requirement: List filter URLs preserve selections

Item and quest filters SHALL keep their state in the URL alongside existing search, sort, and filter parameters. Opening or reloading a filtered URL SHALL restore the controls and the matching results. Browser back and forward SHALL restore earlier selections. Clear filters SHALL remove active filters without hiding unfiltered records. Filter labels, columns, and result text SHALL use reader-facing names, not record ids or enum words.

#### Scenario: Share class and stat filters
- **WHEN** a reader opens a URL with both an item class and a selected stat range
- **THEN** both controls and their combined results are restored

#### Scenario: Existing slot filter remains usable
- **WHEN** a reader opens `/items?slot=BOOTS` and selects a stat
- **THEN** the slot and stat filters both apply and remain in the URL

#### Scenario: Clear and return
- **WHEN** a reader clears filters and then uses the browser Back control
- **THEN** the previous filters and results return

### Requirement: Filters do not rank content

Filtered lists SHALL retain all matching published records. They SHALL NOT rank items, quests, or builds as best, and SHALL NOT remove a record from the unfiltered list for missing filter facts.

#### Scenario: Item without a known stat
- **WHEN** an item has no captured stat
- **THEN** it remains in the unfiltered item list
- **AND** a selected Stat filter does not claim that it has the stat
