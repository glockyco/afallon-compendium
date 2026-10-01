## ADDED Requirements

### Requirement: Eligible item pages compare corruption levels

An item page SHALL offer a corruption-level control only for eligible equippable gear with a captured cap and verified template-stat calculations. The control SHALL start closed or live in a secondary section, not displace the primary How to get it answer or duplicate the single game tooltip in the side column. It SHALL include the unmodified template and supported levels through the captured cap. For each selected level it SHALL show calculated template stats, Item power and weapon damage beside their unchanged base values, matching the game's displayed tooltip values and rounding, and label the result a calculated template comparison rather than an acquired rolled item. The corruption label SHALL read `Corruption +N` at positive levels and be absent at zero. It SHALL link the applicable Corruption guide step and preserve item sources and other properties. Random-roll and gem stats SHALL remain unscaled and SHALL NOT be fabricated for template previews. The page SHALL NOT claim a full mitigated combat hit or invent an authored Health-stat gear example.

#### Scenario: Reader selects a supported level
- **WHEN** a reader selects a supported level on an eligible weapon
- **THEN** the page shows base damage beside the calculated tooltip-equivalent endpoints, each rounded to nearest integer with midpoint-to-even ties as observed, and DPS derived from the rounded endpoints and attack speed
- **AND** it labels the result a calculated template value, not an exact acquired item

#### Scenario: Reader returns to the unmodified item
- **WHEN** a reader selects level zero
- **THEN** the page shows the original item values without a corruption bonus or corruption-level label

#### Scenario: Item is not eligible
- **WHEN** an item is not confirmed to receive a dungeon reward corruption level
- **THEN** its page retains the ordinary tooltip and has no corruption-level control

#### Scenario: Item power and fractional stats
- **WHEN** the reader selects level one on Novice Plate Chest
- **THEN** its template Stamina 2 compares with `+2.1 Stamina`, and template Item power 15 compares with displayed `Item Power 20` after its general 5% and flat +5 increments and game-matching integer display

#### Scenario: Gear has random properties or gems
- **WHEN** a gear template has random stats, gems, or other item-specific rolls
- **THEN** the page excludes unobserved item-specific rolls from its template calculation, does not scale a known rolled or gem value, and does not describe its template preview as an exact rolled item
