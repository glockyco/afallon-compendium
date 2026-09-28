## Purpose

Give readers a build-specific reference for Corruption+ and corrupted gear. State only rules supported by captured game data and verified behavior.

## ADDED Requirements

### Requirement: The corruption page states supported rules

The publication SHALL provide a `mechanics` document at `/mechanics/corruption`. The page SHALL explain the verified gear-level bonus, the captured maximum level, and the supported behavior of keystones, timers, hearts, and tokens. Each topic SHALL distinguish a verified rule from a rule that remains unverified. The page SHALL link published items when it names them. It SHALL NOT rank gear or provide dungeon routes.

#### Scenario: A rule has supporting evidence
- **WHEN** the catalog holds a verified corruption rule and its build-specific values
- **THEN** the page states the rule in reader terms and shows those captured values

#### Scenario: A topic is not resolved
- **WHEN** the evidence does not establish how a heart affects a reward
- **THEN** the page marks that behavior as unverified instead of asserting a reward rule

#### Scenario: Reader follows an item reference
- **WHEN** the page names a published Corruption Token
- **THEN** its name links to the item page without displaying a record id

### Requirement: Corruption facts follow the accepted build

The catalog SHALL preserve the captured corruption cap and gear bonus settings with their provenance. The publication SHALL use those facts for the page and for item calculations. It SHALL NOT substitute site constants for missing values. Unavailable settings SHALL remain unavailable in the published explanation.

#### Scenario: Game settings change between builds
- **WHEN** the accepted build contains different captured gear settings
- **THEN** the mechanics page and the item calculation use the accepted build's settings

#### Scenario: A setting cannot be captured
- **WHEN** the maximum level is unavailable
- **THEN** the page does not publish an invented maximum level
