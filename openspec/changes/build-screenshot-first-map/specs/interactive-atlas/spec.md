## Purpose

Let Afallon players navigate recognizable maps and follow locations, entities, and item sources without losing spatial context.

## ADDED Requirements

### Requirement: Comprehensive categories without duplicate markers

The atlas SHALL expose all published Afallon marker categories and their counts. It SHALL provide role-based filters and distinguish fixed points, spawn areas, and uncertain locations. Overlapping roles SHALL not create duplicate physical markers. Dense views SHALL aggregate markers without silently excluding categories.

#### Scenario: A vendor also gives quests
- **WHEN** a reader enables both service and quest filters
- **THEN** the NPC has one physical marker with both roles
- **AND** selection exposes both stock and quest information

#### Scenario: A low-zoom view contains many resources
- **WHEN** individual markers would obscure terrain
- **THEN** the atlas aggregates them with discoverable counts
- **AND** zooming or selecting an aggregate reveals its members

### Requirement: Useful details preserve map context

Selection SHALL show the entity name, roles, location, conditions, and relevant relationships. Enemy details SHALL include known loot sources. Vendor details SHALL include stock, currency costs, and requirements. Resource details SHALL include gathering requirements and possible yields. Containers, quest locations, and transitions SHALL show their verified rewards or destinations. Large lists SHALL remain searchable without expanding an unbounded popup over the map.

#### Scenario: A vendor has several progression stock groups
- **WHEN** a reader selects that vendor
- **THEN** the atlas distinguishes unconditional and conditional stock
- **AND** the reader can search the complete stock list while retaining the selected map location

#### Scenario: Loot probability is not verified
- **WHEN** a reader inspects a known item source with unresolved chance semantics
- **THEN** the item remains discoverable as a possible source
- **AND** the interface does not display an invented effective percentage

### Requirement: Search connects items to places

Search SHALL find places, NPCs, resources, and items by their displayed names. Item results SHALL expose verified source types, including drops, vendors, containers, and resource yields when known. Selecting a source SHALL navigate to its map and placement without losing the item context.

#### Scenario: A player searches for a vendor item
- **WHEN** the item has stock entries on several vendors
- **THEN** search exposes the vendors and stock conditions
- **AND** selecting one opens its location and corresponding stock entry

### Requirement: Navigation is shareable and reversible

The URL SHALL preserve map space, selected location, basemap choice, and relevant browsing state. Browser back and forward SHALL restore prior selections. Cross-map transitions SHALL preserve their source context and distinguish unresolved destinations. A stale link SHALL explain the missing selection rather than select an unrelated entity.

#### Scenario: A reader follows a dungeon entrance
- **WHEN** its destination is published
- **THEN** the atlas opens the destination map and associated entrance context
- **AND** browser back restores the source map selection

#### Scenario: A link names a removed placement
- **WHEN** the current build no longer contains that placement
- **THEN** the atlas reports the stale selection and offers navigation to available content

### Requirement: Accessible responsive browsing

The atlas SHALL support keyboard navigation and narrow screens. Search and a synchronized result list SHALL provide access to marker details without pointer-only map interaction. Selection panels SHALL have predictable focus behavior and a visible close action. Marker meaning SHALL not depend on color alone.

#### Scenario: A keyboard reader selects a search result
- **WHEN** the reader opens the result details and then closes them
- **THEN** the details are operable without a pointer
- **AND** focus returns to a useful originating control

### Requirement: Static publication exposes evidence limits

The atlas SHALL run from generated static artifacts without access to the game, raw snapshots, or an extraction endpoint. It SHALL display the supported build and coverage status. It SHALL distinguish unknown facts from absent facts and surface meaningful extraction exclusions. Progressive map loading SHALL not require downloading the full-resolution world image before interaction.

#### Scenario: A reader opens a map with a partial research snapshot
- **WHEN** a local preview uses incomplete coverage
- **THEN** the interface visibly identifies that coverage as incomplete
- **AND** it does not present the preview as the complete release
