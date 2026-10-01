## ADDED Requirements

### Requirement: Eligible item pages show corruption levels in the game tooltip

An item page SHALL place a corruption-level slider directly below its single game tooltip in the side column only for equippable non-token templates present in the five timed dungeons' boss reward-bag loot tables with a captured cap and supported template-stat calculations. The slider SHALL range from zero through the captured cap, show `None` at zero and `+N` at positive levels, and update the tooltip itself. At positive levels the tooltip SHALL show calculated template Item power, weapon damage endpoints rounded to nearest integer with midpoint-to-even ties, damage per second derived from those displayed endpoints, and scaled fixed stats using the game's displayed number formatting. It SHALL show `Corruption +N` after the damage block and before fixed stat lines only at positive levels. Random rolls and gems SHALL remain unchanged; the comparison SHALL identify calculated templates rather than saved rolled loot. Eligible items SHALL expose `corruptedFrom` dungeon place and associated boss references, distinct from ordinary item sources.

#### Scenario: Reader selects a supported level
- **WHEN** a reader selects a supported level on an eligible weapon
- **THEN** the tooltip shows calculated damage endpoints, each rounded to nearest integer with midpoint-to-even ties as observed, and DPS derived from the rounded endpoints and attack speed
- **AND** the slider shows `+N` while the tooltip shows `Corruption +N` after the damage block and before fixed stats

#### Scenario: Reader returns to the unmodified item
- **WHEN** a reader selects level zero
- **THEN** the tooltip shows the original item values without a corruption bonus or corruption-level label, and the slider reads `None`

#### Scenario: Item is not in a timed dungeon reward bag
- **WHEN** an equippable item does not occur in any of the five timed dungeons' boss reward-bag loot tables, even if another boss table drops it
- **THEN** its page retains the ordinary tooltip and has no corruption-level control

#### Scenario: Item power and fractional stats
- **WHEN** an eligible template has a fixed Stamina stat of 2 and Item power 15 and the reader selects level one under the captured 5% general and +5 flat Item power settings
- **THEN** its calculated tooltip shows `+2.1 Stamina` and `Item power 20` using game-matching integer display

#### Scenario: Gear has random properties or gems
- **WHEN** a gear template has random stats, gems, or other item-specific rolls
- **THEN** the tooltip keeps random and gem values unchanged, does not fabricate unobserved item-specific rolls, and the page explains that random stats and gems do not change

### Requirement: Timed dungeon reward bags appear as an item source

Each published item that a timed dungeon reward bag can grant SHALL have a typed dungeon reward source with the linked place, associated timer bosses, and whether the item is guaranteed. Each of the five timed dungeons SHALL be a guaranteed source of its Corruption Token. Equipment in a timer boss's reward table SHALL have a chance source limited to that boss's dungeon. The item page SHALL show the dungeon reward route in “How to get it”, link its places and applicable bosses, and link the guide's timer step. The hover card SHALL share this source answer with the page.

#### Scenario: Reader opens the Corruption Token page
- **WHEN** a reader opens the token's item page
- **THEN** its first acquisition route says every timed dungeon run ends with a reward bag containing one token and lists all five linked dungeons
- **AND** the route links to the timer step, while the hover card describes the guaranteed source

#### Scenario: Reader opens reward equipment
- **WHEN** a reader opens an eligible reward equipment page
- **THEN** its acquisition route lists the timed dungeons and the bosses whose reward tables contain that item as a chance, without claiming a guaranteed drop
- **AND** the corruption control keeps its linked reward-bag dungeon context
