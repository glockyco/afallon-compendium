## ADDED Requirements

### Requirement: One page for each NPC and ability name

The publication SHALL publish one page for each NPC display name and one page for each ability display name. Names SHALL be compared after Unicode normalization, case folding, apostrophe folding, and whitespace collapse. The page title SHALL use the most frequent spelling in the group, and ties SHALL take the spelling of the lowest native ID. Each native record SHALL appear on its page as a variant with its catalog entity key.

#### Scenario: Pose variants of one character
- **WHEN** the catalog holds four NPC records named "Fenric Doryn"
- **THEN** the publication has one page "Fenric Doryn" at `/npcs/fenric-doryn/`
- **AND** the page lists the four records as variants

#### Scenario: Names that differ only in case
- **WHEN** records are named "Lysander blazeborn" and "Lysander Blazeborn"
- **THEN** they share one page

### Requirement: Variants are shown only where they differ

A grouped page SHALL show facts that all variants share once. It SHALL show a variants table only when variants differ in level, health, abilities, loot, hostility, or ability numbers. The table SHALL show only the facts that differ. Each variant SHALL have a stable anchor on its page, derived from player-visible facts and falling back to the native ID.

#### Scenario: Variants differ only in place and time
- **WHEN** all Skywarden records share every combat and loot fact
- **THEN** the Skywarden page shows no variants table

#### Scenario: Monster variants differ in stats
- **WHEN** Skeleton Warrior records differ in health and abilities
- **THEN** the page shows a variants table with those facts per variant

### Requirement: Record-specific references keep their variant

A reference that names one record SHALL link to the grouped page and the variant anchor. Its label SHALL add a qualifier only when the group has more than one variant that differs in the facts shown. Quest start and turn-in lists SHALL show each page once and merge the areas of its variants.

#### Scenario: A kill objective targets one boss fight
- **WHEN** "Heart of the Crag" targets one of two Cragborn Alpha records
- **THEN** the objective links to `/npcs/cragborn-alpha/` with that variant's anchor
- **AND** its label names the variant

#### Scenario: Three givers of one quest are one character
- **WHEN** three Fenric Doryn records give "Hook, Line, and Frostscale"
- **THEN** the quest shows one start entry for Fenric Doryn

### Requirement: Slugs follow display names

Every page slug SHALL be the slug of its display name, including any qualifier. The publication SHALL NOT keep slugs from earlier publications and SHALL NOT publish redirects.

#### Scenario: A grouped NPC page replaces record pages
- **WHEN** a publication groups the Fenric Doryn records
- **THEN** `/npcs/fenric-doryn-206/` does not exist

### Requirement: Distinct entities carry readable qualifiers

Entities that stay separate and share a name SHALL carry a qualifier built from a fact that differs between them, such as armor type, weapon damage, rarity, level requirement, place type, parent place, or level range. Names SHALL be compared without case. A qualifier SHALL NOT show a level of 0 or an internal object name. A native ID SHALL appear only when no published fact differs.

#### Scenario: Two chest items differ in armor type
- **WHEN** two "Peasant Chest" items are cloth and leather
- **THEN** their names show "Cloth" and "Leather", not native IDs

#### Scenario: A place has no level range
- **WHEN** a place records a level range of 0
- **THEN** its qualifier does not show a level
