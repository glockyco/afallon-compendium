## Purpose

Publish game mechanics as build-specific reference pages so readers can compare progression rules and Heroic tier facts without treating advice as game data.

## ADDED Requirements

### Requirement: Mechanics have published pages

The publication SHALL provide a `mechanics` page kind with versioned documents for named topics. The site SHALL route these documents under `/mechanics/<topic>`. The Mechanics navigation group SHALL link Character progression and Heroic tier. A missing topic SHALL return a not-found page. Each document SHALL use facts from the catalog and SHALL preserve its build identity. These pages SHALL use sentence case for headings and labels, title case for names and category values, and no internal record ids.

#### Scenario: Published topic
- **WHEN** a reader opens `/mechanics/character-progression`
- **THEN** the page loads the Character progression document of the accepted publication
- **AND** the Mechanics navigation group links to this page and `/mechanics/heroic-tier`

#### Scenario: Unknown topic
- **WHEN** a reader opens `/mechanics/unknown-topic`
- **THEN** the site shows its not-found page

### Requirement: Character progression shows a level curve

The Character progression page SHALL show the character level cap from the class level template. It SHALL plot experience to advance from each playable level below that cap on a labeled logarithmic experience axis. It SHALL offer a level control from the first level through the cap. For its selected level, the page SHALL show experience to the next level, experience earned before that level, and experience left to reach the cap. The earned and remaining amounts SHALL sum the template's level-to-next-level values. At the cap, the next and remaining amounts SHALL be zero. The page SHALL describe these amounts as a fresh character's totals, not as a reader's saved progress. Chart labels and the level control SHALL remain usable without color or hover.

#### Scenario: Selected level
- **WHEN** a reader selects level 2 in a template whose first row is 20 and second row is 40
- **THEN** the control shows 40 experience to the next level and 20 experience earned before level 2
- **AND** experience left to the cap sums the rows from level 2 up to the level before the cap

#### Scenario: Level cap
- **WHEN** a reader selects the template's cap
- **THEN** the control shows zero experience to the next level and zero left to the cap
- **AND** the chart does not plot a nonexistent next level

### Requirement: Character progression explains earned experience

The page SHALL show the highest authored level of a fixed-level creature with experience and the highest authored level of a quest with experience. It SHALL distinguish scaling creatures from fixed-level creatures. These source ranges SHALL NOT claim that experience cannot be gained at higher character levels. The page SHALL distinguish character experience from kills and quests, weapon-template experience from kills, and skill experience from weapon hits, crafting, gathering, enchanting, game actions, and quest actions where verified. It SHALL describe verified kill base rolls, creature level-difference modifiers, Heroic kill multiplier, party split, experience stat, and world modifiers. It SHALL describe verified quest amounts and their applicable modifiers. It SHALL describe skill and weapon-template award rules only where their inputs and conditions are verified. Captured modifiers and multipliers SHALL be facts of the published build, not site constants. An unverified branch SHALL be labeled unknown rather than stated as fact.

#### Scenario: Authored experience range
- **WHEN** the catalog contains fixed-level creatures with experience through level 30 and quests with experience through level 31
- **THEN** the page labels these as the highest authored levels of those sources
- **AND** it does not say that the character must stop earning experience at level 31

#### Scenario: Unverified level comparison
- **WHEN** the direction of a creature level-difference modifier has not been verified
- **THEN** the page does not state which difference applies that modifier

#### Scenario: Distinct experience sources
- **WHEN** the published evidence confirms a weapon skill award for an auto-attack hit and a weapon-template award from a kill
- **THEN** the page names these as distinct sources and states only their verified award rules
- **AND** it does not present a crafting experience formula without verified evidence

### Requirement: Character progression shows talent point gains

The page SHALL show the starting talent points, the points gained per character level, and the maximum points from the catalog. It SHALL distinguish a level-up gain from a starting amount. It SHALL show any verified world modifiers that change gains or the maximum. It SHALL NOT present the maximum as points that every character has earned.

#### Scenario: Starting points and level-ups
- **WHEN** the catalog records a starting amount and a character-level-up gain for Talent Points
- **THEN** the page shows each value with its trigger and its recorded maximum

### Requirement: Heroic tier explains its rewards and effects

The Heroic tier page SHALL show the captured Heroic kill experience multiplier and SHALL distinguish kill experience from quest experience. It SHALL express Heroic Essence as `(base + per-affix amount × affix count) × rank multiplier × bounded health factor`, with fractional carry between kills. It SHALL show the captured base, per-affix amount, rank multipliers, health baseline and bounds. It SHALL show the captured creature health and damage multipliers, gear scaling, affix chances and limits, affix loot multiplier, and Heroic gear stat bonus. The page SHALL qualify any setting whose behavior has not been verified. It SHALL not rank Heroic gear or character builds.

#### Scenario: Essence calculation
- **WHEN** the catalog records Heroic Essence settings and the calculation has been verified
- **THEN** the page shows the product of the base-plus-affixes amount, the rank multiplier, and the bounded health factor
- **AND** it renders numbers from the published facts

#### Scenario: Heroic kill experience
- **WHEN** Heroic tier is active and its kill multiplier is published
- **THEN** the page identifies the multiplier as a kill experience rule
- **AND** it does not say that quest experience receives that multiplier
