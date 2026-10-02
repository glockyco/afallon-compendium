## ADDED Requirements

### Requirement: Categories use the game's own vocabulary

Marker categories SHALL use the terms the game shows its players. The source of that vocabulary is the game's interaction and nameplate model: merchant, quest giver, interactive object, crafting station, and enemy entity, with enemy, neutral, and friendly alignment. Resources, containers, and travel points SHALL use the words the game uses for them in its own interface.

Each category SHALL add information. A category that every character carries, or that a service category already implies, SHALL NOT exist. Bosses, enemies, and neutral creatures form one section. Merchants, quest givers, and townsfolk form one section, where townsfolk are the friendly characters with no service. Sections SHALL carry a short single-line name and no glyph, and each row and section SHALL show its marker count.

Extraction vocabulary SHALL NOT appear on the player surface. The interface SHALL NOT show placement roles, source families, source identities, map spaces, authored flags, component names, or coverage counts.

Overlapping categories SHALL NOT create duplicate physical markers. Dense views SHALL aggregate markers without silently excluding categories.

#### Scenario: A vendor also gives quests
- **WHEN** a reader enables both the merchant and quest-giver categories
- **THEN** that NPC has one physical marker carrying both
- **AND** selection exposes both its stock and its quests

#### Scenario: A reader hides one role of an overlapping marker
- **WHEN** a placement's highest-precedence category is disabled while another category remains enabled
- **THEN** the placement resolves its glyph from the enabled category
- **AND** it does not continue to appear as the disabled category

#### Scenario: A friendly character sells items
- **WHEN** the publication builds that character's categories
- **THEN** the character is a merchant and not also townsfolk
- **AND** a friendly character with no service is townsfolk

#### Scenario: A category has no player-facing name
- **WHEN** extracted content cannot be described in the game's vocabulary
- **THEN** it does not become a marker category
- **AND** it remains in the generated artifacts

#### Scenario: A low-zoom view contains many resources
- **WHEN** individual markers would obscure terrain
- **THEN** the map aggregates them with discoverable counts
- **AND** zooming or selecting an aggregate reveals its members

### Requirement: One registry owns marker presentation

Markers SHALL use recognizable glyph icons from the project's icon set, drawn as a glyph on a colored background, consistent with the sibling maps. One registry SHALL own each marker's icon, color, label, plural label, size, precedence, render order, and default visibility. Consumers SHALL read that registry.

There SHALL NOT be a second registry, a compatibility mapping, or a per-consumer marker switch. Adding a category SHALL require one registry entry, and a test SHALL fail when a registered category has no rendered layer.

One row SHALL resolve to exactly one marker through a single resolution function, so overlapping categories cannot draw two markers for one place. Marker meaning SHALL NOT depend on color alone: each category SHALL be distinguishable by its glyph.

Render order SHALL be semantic, from terrain and areas, through paths and ranges, ordinary markers, important markers, to selection and hover highlights.

#### Scenario: A category is added
- **WHEN** a new category is registered with its icon and color
- **THEN** the map, the result list, the filters, and the legend all present it from that entry
- **AND** no consumer carries its own icon or color mapping

#### Scenario: A registered category has no layer
- **WHEN** a category exists in the registry but no layer renders it
- **THEN** the registration test fails

#### Scenario: A reader cannot rely on color
- **WHEN** two categories are compared without color perception
- **THEN** their glyphs distinguish them
- **AND** the result list and details state the category in words

### Requirement: Level ranges are visible and filterable

The map SHALL show the level range of a map or its associated `RegionTemplate` record the way the game does, next to its name. It SHALL provide a level filter over creature levels. Level data SHALL come from the extracted native sources: `RegionTemplate` level ranges, scene dungeon ranges, scene scaling ranges, and producer scaling overrides.

A creature whose level is unknown SHALL remain visible under a filter rather than silently disappear.

#### Scenario: A reader opens a map
- **WHEN** the map or its associated `RegionTemplate` record carries a level range
- **THEN** the interface shows that range with the name
- **AND** the wording matches the game's own presentation

#### Scenario: A reader narrows the level filter
- **WHEN** creatures fall outside the selected range
- **THEN** their markers hide and the counts update
- **AND** a creature with no known level still appears

### Requirement: One world map holds every place

The map SHALL present one navigable world map. Scenes that the game already covers with a shared map texture SHALL occupy one map without manual composition. Maps the game does not position relative to each other, such as caves and dungeons, SHALL be placed on the world map by reviewed manual placement.

Placement SHALL be translation only at a shared world scale. The map SHALL NOT rescale or rotate a map to improve the layout. A reviewed placement file SHALL own the offsets. A development-only authoring mode MAY allow dragging a map with its markers and exporting those offsets for review. Production SHALL NOT include authoring controls. A placement override SHALL move a map and its markers together.

An offset MAY be any world translation. Publication SHALL NOT snap an offset to the tile lattice; a placed map's pyramid is indexed in that map's own coordinates and the map translates it when drawing. The reviewed layout places interiors on a ring around the overworld: the four corner maps have their centres at one distance from the overworld centre on each axis, and the maps on each side are spaced evenly between the corners, so every map keeps the same gap to the overworld.

A placement SHALL publish when it resolves to a reviewed placed map, including where the game art is transparent. Map bounds SHALL include published placements. An unresolved arrival position SHALL NOT be guessed from a destination scene name.

Each placed map SHALL show its player-facing name above its bounds. The label SHALL move with the map and remain legible without covering its terrain at the map's working zoom.

#### Scenario: Two scenes share one game map texture
- **WHEN** both are published
- **THEN** they occupy the same map with their native registration
- **AND** no manual offset is required for them

#### Scenario: A reviewer positions a dungeon
- **WHEN** the reviewer drags that dungeon in the authoring mode
- **THEN** its imagery and its markers move together at unchanged scale
- **AND** the mode exports the offsets for the reviewed placement file

#### Scenario: A reader inspects a placed map
- **WHEN** the reader views the map at its working zoom
- **THEN** the map's name appears above its bounds
- **AND** the label does not obscure the captured terrain

#### Scenario: A map has no reviewed placement
- **WHEN** the world map is built
- **THEN** the run reports that map as unplaced


#### Scenario: A placement lies outside the map art
- **WHEN** a resolved placement sits where its map's imagery has no opaque pixels
- **THEN** the placement still publishes with its position
- **AND** the map's bounds grow to include it
- **AND** it does not guess a position from unrelated scene coordinates

### Requirement: Travel connections are drawn on the world map

Where a travel point has a resolved destination, the map SHALL draw the connection on the world map: the travel marker, a line from it to its destination, and a mark at the destination. One toggle SHALL control that group.

Connections SHALL span maps, so a dungeon entrance links to the arrival point within that zone's map. A travel point whose destination is unresolved SHALL keep its marker without a line, and SHALL NOT be drawn to a guessed position. A destination that is disabled or otherwise inactive SHALL remain visible and visibly distinguished rather than hidden. Selection and hover SHALL strengthen the applicable line while preserving that disabled distinction.

The map SHALL draw a connection only from a typed published relationship with explicit source and destination positions. It SHALL NOT infer trap, patrol, portal, blocker, or other lines from labels or detail text.

The authoring mode SHALL render connections while a reviewer positions maps, because a line whose ends are far apart or crossed reveals a wrong placement.

#### Scenario: A reader inspects an entrance
- **WHEN** the entrance has a resolved destination
- **THEN** the map draws the marker, the connection line, and the destination mark
- **AND** one toggle hides or shows all three

#### Scenario: A destination is unresolved
- **WHEN** no verified destination position exists
- **THEN** the travel marker remains without a line
- **AND** the map draws no line to an assumed position

#### Scenario: A reviewer positions a dungeon
- **WHEN** connections are visible in the authoring mode
- **THEN** the lines between that dungeon and its entrances stay visible while it moves
- **AND** the reviewer can use them to judge the placement

### Requirement: Mobile controls and trusted embedding

The map SHALL offer a dismissible category drawer at phone width and keep search and results within the viewport. Only the trusted `glockyco.com` portfolio SHALL be allowed to frame the published map.

#### Scenario: A phone reader browses the map
- **WHEN** the viewport is no wider than 680 CSS pixels
- **THEN** the map and results use the full viewport width without horizontal scrolling
- **AND** the closed category panel occupies one compact touch target
- **AND** the open panel is a dismissible drawer

#### Scenario: The portfolio embeds the map
- **WHEN** `glockyco.com` frames the published map
- **THEN** the browser permits that origin
- **AND** other external origins cannot frame the map

### Requirement: Shared map links carry Afallon identity

The root map SHALL publish square favicon and touch-icon assets. It SHALL publish a `1200 × 630` PNG through absolute Open Graph and Twitter card metadata. The expanded map sidebar SHALL identify the Afallon Compendium while preserving its home navigation.

#### Scenario: A reader shares the map in Discord
- **WHEN** Discord fetches the root map metadata
- **THEN** the response names the Afallon Compendium interactive map
- **AND** the social image URL resolves to the Afallon logo card

#### Scenario: A reader opens the map in a browser
- **WHEN** the browser requests a favicon or touch icon
- **THEN** the response returns a square Afallon `A` compass mark

#### Scenario: A reader uses the map sidebar
- **WHEN** the map sidebar is expanded
- **THEN** its header displays the Afallon compass mark and name
- **AND** activating that brand returns to the compendium home page
