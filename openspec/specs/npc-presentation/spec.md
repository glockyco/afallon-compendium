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

A creature page SHALL preview its locations grouped by published place with distinct spot counts, sorted by count for the lookup reader.

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

#### Scenario: Creature locations show conditions and story order
- **WHEN** A creature has three distinct spots in one published place and one spot in another.
- **THEN** The location preview groups spots by published place, shows counts of three and one, and sorts the places by count.

### Requirement: Expanded creature locations preserve placement information

The full expandable location information SHALL preserve each placement's availability, level, quest links, role, and random alternative when known, with each spot selectable on the map.

#### Scenario: Expanded creature locations preserve placement information
- **WHEN** A creature placement has known availability, level, quest links, role, and random alternative.
- **THEN** The expanded location information preserves all those details and allows its spot to be selected on the map.

### Requirement: Differing placement conditions remain distinct

Where conditions differ, rows SHALL not merge their conditions away.

#### Scenario: Differing placement conditions remain distinct
- **WHEN** Two placements have different availability conditions.
- **THEN** The location rows preserve the differing conditions rather than merging them away.

### Requirement: Placement details follow quest chain order

Within a place, placement details SHALL sort by the earliest chain order of their availability quests, then label and placement ID.

#### Scenario: Placement details follow quest chain order
- **WHEN** Placements within a place include different earliest availability-quest chain orders and ties in chain order and label.
- **THEN** The details sort by earliest availability-quest chain order, break chain-order ties by label, and break remaining ties by placement ID.

### Requirement: Missing places remain unknown or unplaced

A missing place SHALL remain visible as an unknown or unplaced location, not be counted under another place.

#### Scenario: Missing places remain unknown or unplaced
- **WHEN** A creature placement has no place.
- **THEN** The placement remains visible as unknown or unplaced and is not counted under another place.

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

A creature page SHALL identify a creature as tameable by a Hunter only when its creature type is Beast, its tamable flag is set, and its rank is a normal mob.

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

#### Scenario: Creature pages disclose Hunter tameability
- **WHEN** A normal-mob creature has its tamable flag set but its creature type is not Beast.
- **THEN** The creature page does not identify the creature as tameable by a Hunter.

### Requirement: Taming facts state known conditions concisely

The page SHALL state the known conditions in one short fact: a Hunter of the creature's level or higher, with no pet, within 30 m.

#### Scenario: Taming facts state known conditions concisely
- **WHEN** A qualifying creature has a published level of 15.
- **THEN** One short taming fact states that the Hunter must be of the creature's level or higher, with no pet, within 30 m.

### Requirement: Taming level conditions use published creature levels

The level condition SHALL refer to the creature's published level, so a creature whose level scales with the player shows that through its level line.

#### Scenario: Taming level conditions use published creature levels
- **WHEN** A qualifying creature's published level scales with the player.
- **THEN** The taming level condition refers to the creature's published level and the level line shows that its level scales with the player.

### Requirement: Shared creature pages attribute tameability by variant

A shared page SHALL attribute tameability to the qualifying variants only.

#### Scenario: Shared creature pages attribute tameability by variant
- **WHEN** A shared creature page includes a qualifying normal Beast and a nonqualifying non-Beast variant.
- **THEN** The page attributes tameability only to the qualifying normal Beast variant.

### Requirement: Hunter class names link to published class pages

The Hunter class name SHALL link to its class page when that page is published.

#### Scenario: Hunter class names link to published class pages
- **WHEN** A creature page names the Hunter class and the Hunter class page is published.
- **THEN** The Hunter class name links to the published Hunter class page.
### Requirement: Creature variants compare side by side

The Variants section of a creature page SHALL show one column per version, headed by the version's label, and one row per fact in which the versions differ.

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

#### Scenario: Shared name, different encounter levels
- **WHEN** two variants share a Health rule but spawn at different fixed levels
- **THEN** each variant's Health displays the effective value at its own level
- **AND** the comparison does not collapse the differing values into a single page-wide number

#### Scenario: Creature variants compare side by side
- **WHEN** Three creature versions have different respawn facts.
- **THEN** The Variants section shows three columns headed by the versions' labels and a row for the differing respawn fact.

### Requirement: Differing variant stats have separate rows

Each differing stat SHALL be its own row.

#### Scenario: Differing variant stats have separate rows
- **WHEN** Creature versions differ in health and armor.
- **THEN** Health and armor each have their own row.

### Requirement: Known encounter levels use effective stat values

For a stat with a supported effective value at a known encounter level, the page SHALL display the level-specific effective value rather than treating the authored addition as a finished total.

#### Scenario: Known encounter levels use effective stat values
- **WHEN** A variant's encounter level is known and its health has a supported effective value distinct from its authored addition.
- **THEN** The page displays the level-specific effective health value rather than treating the authored addition as the finished total.

### Requirement: Unselected encounter levels preclude single effective totals

Where a variant has several possible levels without a selected encounter, the page SHALL NOT claim a single effective total.

#### Scenario: Unselected encounter levels preclude single effective totals
- **WHEN** A variant has several possible levels and no encounter is selected.
- **THEN** The page does not claim a single effective stat total for that variant.

### Requirement: Uncalculable effective stats distinguish authored additions

When a stat's effective value cannot be calculated, the page SHALL distinguish its known authored addition from an effective value.

#### Scenario: Uncalculable effective stats distinguish authored additions
- **WHEN** A variant has a known authored armor addition but its effective armor cannot be calculated.
- **THEN** The page distinguishes the known authored armor addition from an effective armor value.

### Requirement: Variant columns share section width evenly

The versions SHALL share the width of the section evenly.

#### Scenario: Variant columns share section width evenly
- **WHEN** Three versions fit beside each other in the Variants section.
- **THEN** The three versions share the section width evenly.

### Requirement: Wrapped variant blocks have balanced sizes

When the versions do not fit beside each other, they SHALL wrap into blocks whose sizes differ by at most one.

#### Scenario: Wrapped variant blocks have balanced sizes
- **WHEN** Five versions do not fit beside each other and the section fits at most three versions per block.
- **THEN** The versions wrap into blocks whose sizes differ by at most one.

### Requirement: Wrapped variant blocks repeat fact names

When the versions do not fit beside each other, each block SHALL repeat the fact names.

#### Scenario: Wrapped variant blocks repeat fact names
- **WHEN** The Variants section wraps versions into two blocks.
- **THEN** Both blocks display the fact names.

### Requirement: Variant sections prohibit sideways scrolling

The section SHALL NOT scroll sideways.

#### Scenario: Variant sections prohibit sideways scrolling
- **WHEN** The Variants section is viewed in a narrow viewport.
- **THEN** The section does not scroll sideways.

### Requirement: Variant blocks omit facts absent from every version

A block SHALL leave out a fact that none of its versions has.

#### Scenario: Variant blocks omit facts absent from every version
- **WHEN** None of the versions in a block has an abilities fact.
- **THEN** That block leaves out the abilities fact.

### Requirement: Universally scaling variant levels use one section notice

When every listed level scales with the player, the section line SHALL say so once and the level cells SHALL show only the range.

#### Scenario: Universally scaling variant levels use one section notice
- **WHEN** All three listed variant levels scale with the player.
- **THEN** The section line says once that every level scales with the player, and each level cell shows only its range.
### Requirement: Creature summary names its stat basis

A creature page SHALL show supported effective Health and combat stats at a specific known level, with that level identified in context. For a creature spanning several possible levels, it SHALL present the stat variation honestly rather than show an authored addition as a finished Health or Damage total. If the rule cannot produce an effective stat, it SHALL label any shown number as an authored addition and preserve otherwise available creature information.

#### Scenario: Scaling Fangchill
- **WHEN** Fangchill can appear from level 20 to 30
- **THEN** its summary does not label 187.2, the authored Health addition, as its complete Health
- **AND** a level-20 encounter shows 1,972 Health while a level-30 encounter shows 2,814.4 Health

#### Scenario: Unknown effective stat
- **WHEN** an NPC stat lacks a required level operand or has an unsupported override
- **THEN** its page does not display an invented effective Health or Damage total
- **AND** a known authored addition, if displayed, is clearly identified as an addition
