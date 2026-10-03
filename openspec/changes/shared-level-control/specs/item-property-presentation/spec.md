## MODIFIED Requirements


### Requirement: Eligible item pages show corruption levels in the game tooltip

An item page SHALL offer a Corrupted version among the gear options directly below its single game tooltip in the side column only for equippable non-token templates present in the five timed dungeons' boss reward-bag loot tables with a captured cap and supported template-stat calculations. The gear options SHALL show one version at a time: Normal, and Heroic or Corrupted where the item has them. Choosing Corrupted SHALL show the shared corruption-level stepper and slider that range from one through the captured cap, starts at the cap, shows `+N`, and updates the tooltip itself, together with the reward bags that give the corrupted version. At positive levels the tooltip SHALL show calculated template Item power, weapon damage endpoints rounded to nearest integer with midpoint-to-even ties, damage per second derived from those displayed endpoints, and scaled fixed stats using the game's displayed number formatting. It SHALL show `Corruption +N` after the damage block and before fixed stat lines only at positive levels. Random rolls and gems SHALL remain unchanged; the comparison SHALL identify calculated templates rather than saved rolled loot. Eligible items SHALL expose `corruptedFrom` dungeon place and associated boss references, distinct from ordinary item sources.

#### Scenario: Reader selects a supported level
- **WHEN** a reader selects a supported level on an eligible weapon
- **THEN** the tooltip shows calculated damage endpoints, each rounded to nearest integer with midpoint-to-even ties as observed, and DPS derived from the rounded endpoints and attack speed
- **AND** the control shows `+N` while the tooltip shows `Corruption +N` after the damage block and before fixed stats

#### Scenario: Reader returns to the unmodified item
- **WHEN** a reader chooses the Normal version
- **THEN** the tooltip shows the original item values without a corruption bonus or corruption-level label, and no slider shows

#### Scenario: Item is not in a timed dungeon reward bag
- **WHEN** an equippable item does not occur in any of the five timed dungeons' boss reward-bag loot tables, even if another boss table drops it
- **THEN** its page retains the ordinary tooltip and has no corruption-level control

#### Scenario: Item power and fractional stats
- **WHEN** an eligible template has a fixed Stamina stat of 2 and Item power 15 and the reader selects level one under the captured 5% general and +5 flat Item power settings
- **THEN** its calculated tooltip shows `+2.1 Stamina` and `Item power 20` using game-matching integer display

#### Scenario: Gear has random properties or gems
- **WHEN** a gear template has random stats, gems, or other item-specific rolls
- **THEN** the tooltip keeps random and gem values unchanged, does not fabricate unobserved item-specific rolls, and the page explains that random stats and gems do not change
