## ADDED Requirements

### Requirement: Lists default to entries with a known way

The Items, NPCs, and Abilities lists SHALL hide by default only entries for which the published documents provide no known way to acquire the item, meet the NPC, or learn, use, or obtain the ability. An item with any published acquisition source, an NPC with a location, adventurer roster membership, published summoning, spawn or recruitment evidence, or a reference from another published page, and an ability with any published learner or user SHALL remain visible. An unbound loot list, an action that consumes its own item, or an unrelated mention SHALL NOT count as an acquisition source. A hidden entry SHALL remain published and reachable with a counted reveal. Other lists SHALL remain visible by default.

#### Scenario: Referenced or summoned NPC
- **WHEN** an NPC has no map location but a published effect summons it or another published page references it
- **THEN** the NPC appears in the default list

#### Scenario: Unknown acquisition and later recovery
- **WHEN** an item has no published acquisition source
- **THEN** it is hidden by default but appears when the reader reveals entries without a known way
- **AND** publishing a real source later makes it visible by default without a maintained exclusion list

#### Scenario: Unbound source is not a known way
- **WHEN** an item occurs in a loot list with no known owner or source
- **THEN** the list does not suggest a player can obtain it from that unbound list

### Requirement: Hidden reveals respect the current search and filters

A list SHALL count hidden entries matching its current name search, selected facets, numeric ranges, and stat filters. The reveal SHALL be offered only when that count is positive, and activating it SHALL show the matching hidden entries. The count SHALL never present the total hidden across the kind as the matching count of a narrowed search.

#### Scenario: Shout is hidden by default
- **WHEN** the reader searches the Abilities list for Shout before revealing entries with no known use
- **THEN** the reveal counts the matching hidden Shout and not every hidden ability
- **AND** activating the reveal shows Shout among matching results

#### Scenario: Other filters narrow the reveal
- **WHEN** the reader searches by name and selects a facet or an inclusive numeric range
- **THEN** the hidden reveal counts only entries satisfying those choices

### Requirement: List columns reflect matching entries

Lists SHALL choose informative columns from the rows matching the current search and filters, retain reader-selected numeric range filters even when their column is not informative, and keep fitted proportional table widths when columns change. A weapon-focused Items list SHALL display Damage where published, and an adventurer-focused NPC list SHALL display Class and Party Role. Narrow screens SHALL retain all applicable information without sideways page scrolling.

#### Scenario: Adventurer role selection
- **WHEN** the reader selects Role: Adventurer on the NPC list
- **THEN** the matching NPC rows display their starting level, Class and Party Role columns
- **AND** the Place column does not imply a world location for Friends-panel adventurers

#### Scenario: Weapon type selection
- **WHEN** the reader selects Weapon: Sword on the Items list
- **THEN** a Damage column shows the published range for swords that have one

### Requirement: NPC list roles represent the encounter

An adventurer SHALL show an Adventurer badge and a badge naming its party role, and its starting level SHALL populate the Level column. A boss whose NPC role also marks it as an enemy SHALL show Boss alone. The adventurer's Friends-panel availability SHALL NOT be represented as a map place.

#### Scenario: Tank adventurer
- **WHEN** the reader browses the NPC list row of a Tank adventurer
- **THEN** the row displays Adventurer and Tank badges with its published starting level and no invented place

#### Scenario: Boss and enemy markers
- **WHEN** an NPC carries Boss and Enemy encounter markers
- **THEN** the role badges read Boss, not Boss and Enemy
