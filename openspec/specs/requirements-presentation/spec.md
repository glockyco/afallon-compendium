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
