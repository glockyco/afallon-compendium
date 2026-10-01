## MODIFIED Requirements

### Requirement: Tooltip source data is complete

The scan and publication SHALL preserve generated mechanic lines for each authored ability rank, non-empty native use or buff lines for items in source order, and every stat change of a talent rank that the game's talent tooltip shows. Complete publication SHALL report missing or changed tooltip blocks, talent ranks that leave out a shown stat change, and invalid contextual ability ranks rather than silently treating them as complete.

#### Scenario: Ability rank has generated mechanics
- **WHEN** an authored ability rank generates mechanic lines
- **THEN** its published rank retains those lines in source order with their typed emphasis

#### Scenario: Item has native use text
- **WHEN** an item's native tooltip supplies non-empty use or buff text
- **THEN** the published item retains that text in source order

#### Scenario: Published block is lost
- **WHEN** an ability's native rank block or an item's native use block is absent or changed in a complete publication
- **THEN** tooltip coverage reports the affected entity and complete publication fails

#### Scenario: Talent rank leaves out a stat change
- **WHEN** a talent rank changes the stats of a species, and the publication cannot name the species
- **THEN** tooltip coverage reports the talent and its rank
- **AND** complete publication fails

### Requirement: Percentage formatting follows the game

A stat row SHALL render as a percentage when either its authored row or its referenced canonical stat marks it as percentage-valued. This rule SHALL apply to fixed item stats, random item stats, gem stats, gear-set tier stats, talent stat changes, and talent stat changes to pets.

#### Scenario: Canonical stat supplies percentage semantics
- **WHEN** an item stat row has `isPercent=false` and its canonical stat has `isPercentStat=true`
- **THEN** the published row has percentage semantics and the tooltip displays a percent sign

#### Scenario: Row supplies percentage semantics
- **WHEN** an item stat row has `isPercent=true` and its canonical stat has `isPercentStat=false`
- **THEN** the tooltip still displays a percent sign

#### Scenario: Flat talent change to a percentage stat
- **WHEN** Heroic Power gives 1 Damage Dealt without its own percentage flag, and Damage Dealt is a percentage stat
- **THEN** its talent row shows +1% Damage Dealt, as the game's talent tooltip does
