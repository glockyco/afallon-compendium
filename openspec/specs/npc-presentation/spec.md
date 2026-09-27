# npc-presentation Specification

## Purpose

Define how creature pages and map markers show random spawns, levels, hostility, services, locations, and the quest characters of each quest.

## Requirements

### Requirement: Random activators retain entry choices

The catalog SHALL store admitted activators with known target counts in `random_choices` and their target entries in `random_choice_entries`. Each target entry SHALL retain its index, target path, and descendant source IDs. Repeated targets SHALL remain repeated entries. Each placement SHALL list its enclosing choices from outermost to innermost. A choice SHALL report its entry count, distinct target options, enabled count clamped to the entry count, and matching entry indexes.

#### Scenario: One placement appears in two entries
- **WHEN** an activator has six entries and two entries target the same placement
- **THEN** the placement's choice retains both entry indexes
- **AND** the distinct option count counts their target once

#### Scenario: Nested activators
- **WHEN** a placement belongs to a choice nested within another choice
- **THEN** its choice list puts the outer choice before the inner choice

### Requirement: Random locations show their chance

The publication SHALL calculate the chance that a uniform selection of distinct enabled entries includes a placement. It SHALL multiply the chances of nested choices and reject a placement with zero chance. Other map placements and creature locations SHALL carry `alternative: { chance, options }` when a choice applies. The site SHALL describe multiple random spots and show a chance below 100 percent. A single option SHALL be described as a random spawn.

#### Scenario: One creature spot among three targets
- **WHEN** a choice enables one of three different target spots and only one spot has this creature
- **THEN** its map spot has a 33.3 percent chance and three distinct target options
- **AND** its creature location says “Random spawn, 33.3% chance”

#### Scenario: Two spots of one creature among three targets
- **WHEN** a choice enables one of three entries and two compatible spots have the same creature
- **THEN** their grouped location says “One of 2 random spots, 66.7% chance”

#### Scenario: Two matching entries of four
- **WHEN** a choice enables two distinct entries of four and two entries contain a placement
- **THEN** the placement chance is the probability that at least one matching entry is enabled
- **AND** repeated targets do not become simultaneous spawns

### Requirement: Creature levels use confirmed native rules

A spawner SHALL use its enabled level override before its NPC record level. Player scaling SHALL use its enabled spawner zone range, otherwise its scene zone range. `COMPANION` and `ADVENTURER` records SHALL publish no level. The placeholder record range 100–100 SHALL not become a record level. Unconfirmed producers SHALL publish no level.

#### Scenario: Scaled spawner in a zone
- **WHEN** a spawner scales with the player in an enabled 15–30 spawner zone
- **THEN** its level is “15–30, scales with the player”

#### Scenario: Saved progression determines a level
- **WHEN** an `ADVENTURER` or `COMPANION` record has a spawner
- **THEN** no level is published for that record

### Requirement: Level displays agree across surfaces

The map marker SHALL show the union of its known creature levels. A creature location and variant SHALL show their known level. A creature page SHALL show the union of its location levels. Place creature rows SHALL use the same placement levels. A list SHALL show an open level range as “15+”.

#### Scenario: An open scaling range
- **WHEN** the confirmed level range starts at 15 and has no maximum
- **THEN** the creature list row shows “15+”

### Requirement: Placement categories express hostility and services

Map markers and pages SHALL derive creature roles from placement categories. Combat enablement alone SHALL NOT make a creature an enemy. When a friendly creature offers a service, its visible categories SHALL show that service instead of townsfolk.

#### Scenario: Friendly merchant can fight
- **WHEN** a friendly merchant has combat enabled
- **THEN** map and page categories show merchant rather than enemy or townsfolk

### Requirement: Creature locations show conditions and story order

A creature page SHALL list its published locations with availability, levels, quests, roles, and random alternatives where available. Locations SHALL sort by the earliest chain order of the quests in their availability rules and own quest links. Ties SHALL sort by label and placement ID.

#### Scenario: A quest moves a character
- **WHEN** a character's places have availability quests at different chain steps
- **THEN** the earlier chain step appears first

### Requirement: Quest people appear once per page

A quest document SHALL carry one NPC start entry and one turn-in entry per character page. Each entry SHALL carry the sorted area labels of the participating records. `turnIns` SHALL have entries of the shape `{ npc, areas }`. When several variants participate, the NPC reference SHALL point to their page. The Start and turn-in section of the quest page SHALL show one row for each character page and SHALL name whether the character starts the quest, completes it, or both.

#### Scenario: Multiple records give a quest
- **WHEN** three Fenric Doryn records give one quest in two areas
- **THEN** the Start and turn-in section shows one Fenric Doryn row with both areas

#### Scenario: Multiple records receive a quest
- **WHEN** two variants of one character receive a quest
- **THEN** the Start and turn-in section shows one page reference with their area labels

#### Scenario: The giver also completes the quest
- **WHEN** one character gives and completes a quest
- **THEN** the Start and turn-in section shows one row for that character that names both roles
