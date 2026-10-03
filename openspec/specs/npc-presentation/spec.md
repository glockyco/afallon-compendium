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

A creature page SHALL preview its locations grouped by published place with distinct spot counts, sorted by count for the lookup reader. The full expandable location information SHALL preserve each placement's availability, level, quest links, role, and random alternative when known, with each spot selectable on the map. Where conditions differ, rows SHALL not merge their conditions away. Within a place, placement details SHALL sort by the earliest chain order of their availability quests, then label and placement ID. A missing place SHALL remain visible as an unknown or unplaced location, not be counted under another place.

#### Scenario: Many creature spots
- **WHEN** a creature has many spots across several places
- **THEN** Where to find previews place names with deduplicated counts, rather than numbered links for every spot
- **AND** expanding a place reveals its actual conditions and map-linked spots

#### Scenario: Quest-gated placement
- **WHEN** two placements in a place have different quest availability
- **THEN** their details remain distinct, with quest links in story order

#### Scenario: A quest moves a character
- **WHEN** a character's places have availability quests at different chain steps
- **THEN** the earlier step appears first within the expanded placement details of its place

### Requirement: Quest people appear once per page

A quest document SHALL carry one NPC start entry and one turn-in entry per character page, with sorted area labels of participating records. `turnIns` SHALL retain entries of shape `{ npc, areas }`. Several variants SHALL reference their shared character page. The quest answer SHALL show each character once, naming whether they start, complete, or both start and complete the quest, with available area and map links. It SHALL not add a separate Start and turn-in section that repeats these people.

#### Scenario: Multiple records give a quest
- **WHEN** three Fenric Doryn records give one quest in two areas
- **THEN** the quest answer shows Fenric Doryn once with both areas

#### Scenario: Multiple records receive a quest
- **WHEN** two variants of one character receive a quest
- **THEN** the quest answer shows one character-page reference with both area labels

#### Scenario: The giver also completes the quest
- **WHEN** one character gives and completes a quest
- **THEN** the quest answer shows one entry for that character naming both roles

### Requirement: Creature pages disclose Hunter tameability

A creature page SHALL identify a creature as tameable by a Hunter only when its creature type is Beast, its tamable flag is set, and its rank is a normal mob. The page SHALL state the known conditions in one short fact: a Hunter of the creature's level or higher, with no pet, within 30 m. The level condition SHALL refer to the creature's published level, so a creature whose level scales with the player shows that through its level line. A shared page SHALL attribute tameability to the qualifying variants only. The Hunter class name SHALL link to its class page when that page is published.

#### Scenario: A fixed-level beast
- **WHEN** a level 12 Beast is a normal mob with its tamable flag set
- **THEN** its title facts say that a Hunter can tame it
- **AND** its taming fact names a Hunter of its level or higher, with no pet, within 30 m

#### Scenario: A beast whose level scales
- **WHEN** a qualifying Beast is published at level 20–30, scaling with the player
- **THEN** its taming fact uses the same level rule
- **AND** its level line says that its level scales with the player

#### Scenario: A flagged Elite
- **WHEN** an Elite Beast has its tamable flag set
- **THEN** its page does not say that a Hunter can tame it

#### Scenario: Mixed variants
- **WHEN** records on the same creature page differ in whether they qualify
- **THEN** the variants table says "Can be tamed" only for the qualifying variants

### Requirement: Creature variants compare side by side

The Variants section of a creature page SHALL show one column per version, headed by the version's label, and one row per fact in which the versions differ. Each differing stat SHALL be its own row. The versions SHALL share the width of the section evenly. When they do not fit beside each other, they SHALL wrap into blocks whose sizes differ by at most one, and each block SHALL repeat the fact names. The section SHALL NOT scroll sideways. A block SHALL leave out a fact that none of its versions has. When every listed level scales with the player, the section line SHALL say so once and the level cells SHALL show only the range.

#### Scenario: Two versions with different stats and abilities
- **WHEN** two versions of Apprentice Lira differ in respawn, experience, health, armor, and abilities
- **THEN** the section shows one column for each version and one row for each of those facts
- **AND** each ability of a version is a link in its column

#### Scenario: Seven versions on a medium screen
- **WHEN** seven versions fit three to a block
- **THEN** the section shows blocks of three, two, and two versions
- **AND** no block holds a single version while another holds three

#### Scenario: A phone
- **WHEN** the section is too narrow for two versions beside the fact names
- **THEN** each block holds one version and reads as a list of its facts

#### Scenario: Every level scales
- **WHEN** every listed level of the versions scales with the player
- **THEN** the section line says "Every level scales with the player."
- **AND** each level cell shows only its range
