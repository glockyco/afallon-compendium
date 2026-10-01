## ADDED Requirements

### Requirement: Eligible item pages show corruption levels in the game tooltip

An item page SHALL place a corruption-level slider directly below its single game tooltip in the side column only for eligible equippable gear with a captured cap and supported template-stat calculations. The slider SHALL range from zero through the captured cap, show `None` at zero and `+N` at positive levels, and update the tooltip itself. At positive levels the tooltip SHALL show calculated template Item power, weapon damage endpoints rounded to nearest integer with midpoint-to-even ties, damage per second derived from those displayed endpoints, and scaled fixed stats using the game's displayed number formatting. It SHALL show `Corruption +N` after the damage block and before fixed stat lines only at positive levels. Unchanged random rolls, gems, requirements, sell price, and other tooltip properties SHALL remain in place. When random stats or gems are present and a positive level is selected, the page SHALL explain that they do not change. The slider SHALL link the applicable Corruption guide step and preserve item sources and other properties. The page SHALL NOT claim a full mitigated combat hit or invent an authored Health-stat gear example.

#### Scenario: Reader selects a supported level
- **WHEN** a reader selects a supported level on an eligible weapon
- **THEN** the tooltip shows calculated damage endpoints, each rounded to nearest integer with midpoint-to-even ties as observed, and DPS derived from the rounded endpoints and attack speed
- **AND** the slider shows `+N` while the tooltip shows `Corruption +N` after the damage block and before fixed stats

#### Scenario: Reader returns to the unmodified item
- **WHEN** a reader selects level zero
- **THEN** the tooltip shows the original item values without a corruption bonus or corruption-level label, and the slider reads `None`

#### Scenario: Item is not eligible
- **WHEN** an item is not confirmed to receive a dungeon reward corruption level
- **THEN** its page retains the ordinary tooltip and has no corruption-level control

#### Scenario: Item power and fractional stats
- **WHEN** the reader selects level one on Novice Plate Chest
- **THEN** its tooltip shows `+2.1 Stamina` and `Item power 20` after the general 5% and flat +5 increments and game-matching integer display

#### Scenario: Gear has random properties or gems
- **WHEN** a gear template has random stats, gems, or other item-specific rolls
- **THEN** the tooltip keeps random and gem values unchanged, does not fabricate unobserved item-specific rolls, and the page explains that random stats and gems do not change
