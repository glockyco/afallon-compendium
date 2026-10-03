## ADDED Requirements

### Requirement: Loot guide explains Loot Chance

Within Creature Drops, the Loot guide SHALL provide an anchored subsection titled Loot Chance and Luck. It SHALL explain in plain language that Loot Chance affects ordinary creature drops, Luck raises Loot Chance, and in this game version a higher Loot Chance makes ordinary creature drops rarer rather than more common. It SHALL state that chances shown on item pages use no Loot Chance bonus and that a table's minimum pick can still give an item. Loot Chance and Luck SHALL link their stat pages. The explanation SHALL use only verified game rules and SHALL not repeat the same rule in the detailed disclosure.

#### Scenario: Reader understands item-page chances
- **WHEN** a reader opens `/mechanics/loot/#loot-chance`
- **THEN** the Loot Chance and Luck subsection is visible within Creature Drops
- **AND** it distinguishes item-page chances with no Loot Chance from the odds after a player gains Luck
- **AND** it links the Loot Chance and Luck stat pages

#### Scenario: Minimum pick still gives items
- **WHEN** a Creature Drops table has a minimum pick
- **THEN** the subsection explains that it can still give an item despite the Loot Chance effect
- **AND** the rule appears only once in the Creature Drops section
