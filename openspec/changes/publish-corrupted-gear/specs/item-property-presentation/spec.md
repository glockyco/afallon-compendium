## ADDED Requirements

### Requirement: Eligible item pages compare corruption levels

An item page SHALL show a corruption-level control only for gear confirmed to receive the verified gear bonus. The control SHALL include the unmodified item and supported levels up to the captured cap. At each selected level, the page SHALL show calculated stats beside the base values. Its text SHALL distinguish a calculated variant from an acquired item with rolled properties. It SHALL link to the corruption mechanics page. It SHALL keep the item's sources and other properties visible.

#### Scenario: Reader selects a supported level
- **WHEN** a reader selects a supported corruption level on an eligible weapon
- **THEN** the page shows its base damage and calculated damage for that level
- **AND** the page labels the calculated result as an estimate for the selected level

#### Scenario: Reader returns to the unmodified item
- **WHEN** a reader selects level zero
- **THEN** the page shows the original item stats without a corruption bonus

#### Scenario: Item does not receive the verified bonus
- **WHEN** an item is not confirmed to receive a corruption level
- **THEN** the page keeps its ordinary tooltip and has no corruption-level control

#### Scenario: Gear has random properties
- **WHEN** a gear template has random stats or other item-specific rolls
- **THEN** the page does not represent its calculated template stats as an exact acquired item's stats
