## MODIFIED Requirements

### Requirement: Crafting rules name their evidence and boundaries

A crafted item's Crafting section SHALL show its verified skill gate, base experience, computed full and half experience breakpoints, and level where base experience stops, with a link to the applicable step of `/mechanics/crafting-and-gathering`. It SHALL NOT include the rule prose. The guide SHALL explain these rules as craft steps and retain each rule and its evidence in a closed disclosure. Both SHALL distinguish base experience from the award after modifiers and use captured values rather than site constants. Neither SHALL rank a recipe as best.

#### Scenario: Recipe sits at the half-experience band
- **WHEN** a recipe has a recorded amount and the skill is in its verified half-experience band
- **THEN** the guide explains nearest-integer ties-to-even rounding before modifiers
- **AND** Crafting describes the computed band as base experience, not a guaranteed final award

#### Scenario: Guide names a recipe
- **WHEN** the guide uses Runeweave Regalia as a worked craft
- **THEN** it links that product's Crafting section

#### Scenario: Worked craft shows its experience bands
- **WHEN** the worked craft's rank gives full base experience until 20 levels above its required level
- **THEN** its band table shows one Full row, then a Half row and a None row
