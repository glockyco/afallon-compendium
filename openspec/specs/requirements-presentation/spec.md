# requirements-presentation Specification

## Purpose

Define how availability rules and requirements read on pages: inline phrases with type prefixes, a stable order, and plain item ownership words.

## Requirements

### Requirement: Requirements read as inline phrases

Requirement groups SHALL render inline with their linked references and authored any/all conjunctions. Class, Effect, Quest, Skill, and Currency requirements SHALL show their type prefixes. Availability rules SHALL sort requires before excludes before temporary rules. Within an effect, rules SHALL sort by the first requirement type and its label.

#### Scenario: A linked class requirement
- **WHEN** a requirement names a published class
- **THEN** the phrase starts with “Class:” and links the class name

#### Scenario: Required and excluded conditions
- **WHEN** availability has an excluded quest rule before a required class rule in source order
- **THEN** the required class phrase appears before the excluded quest phrase

### Requirement: Item ownership phrases describe their state

An item requirement SHALL show “Has X” for owned items, “Does not have X” for absent items, and “X equipped” for equipped items. X SHALL be its item reference or readable item subtype.

#### Scenario: Equipment is required
- **WHEN** a requirement names an axe that must be equipped
- **THEN** the phrase reads “Axe equipped”

#### Scenario: Item must be absent
- **WHEN** a requirement names an item with `NotOwned` ownership
- **THEN** the phrase reads “Does not have X” with X linked when the item resolves

### Requirement: Progression requirements name what a character learns or pays

A requirement for a passive talent SHALL read "<talent> rank N or higher" when it needs rank N or a higher rank, "<talent> rank N" when it needs exactly rank N, and "<talent> learned" when it needs any rank. A requirement for an ability SHALL read "<ability> learned" or "<ability> rank N" by the same rules. A cost SHALL read "Costs N <stat>". A requirement SHALL name a talent by its name, and SHALL NOT show the record id of a talent.

#### Scenario: Talent rank
- **WHEN** the Aegis Discipline node requires rank 4 or a higher rank of Weighted Strikes
- **THEN** its requirement reads "Weighted Strikes rank 4 or higher"

#### Scenario: Learned ability
- **WHEN** a talent tree node requires that the character knows Cleave
- **THEN** its requirement reads "Cleave learned" with a link to the Cleave page

#### Scenario: Cost
- **WHEN** an ability costs 9 Mana to use
- **THEN** its use requirement reads "Costs 9 Mana"
