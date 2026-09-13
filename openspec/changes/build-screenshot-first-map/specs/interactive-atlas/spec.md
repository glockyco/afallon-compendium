## Purpose

Let Afallon players find places, creatures, services, and item sources on maps that look and read like the game's own maps.

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
- **THEN** the atlas aggregates them with discoverable counts
- **AND** zooming or selecting an aggregate reveals its members

### Requirement: One registry owns marker presentation

Markers SHALL use recognizable glyph icons from the project's icon set, drawn as a glyph on a colored background, consistent with the sibling atlases. One registry SHALL own each marker's icon, color, label, plural label, size, precedence, render order, and default visibility. Consumers SHALL read that registry.

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

The atlas SHALL show the level range of a map or its associated `RegionTemplate` record the way the game does, next to its name. It SHALL provide a level filter over creature levels. Level data SHALL come from the extracted native sources: `RegionTemplate` level ranges, scene dungeon ranges, scene scaling ranges, and producer scaling overrides.

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

The atlas SHALL present one navigable world map. Scenes that the game already covers with a shared map texture SHALL occupy one map without manual composition. Maps the game does not position relative to each other, such as caves and dungeons, SHALL be placed on the world map by reviewed manual placement.

Placement SHALL be translation only at a shared world scale. The atlas SHALL NOT rescale or rotate a map to improve the layout. A reviewed placement file SHALL own the offsets, and an authoring mode SHALL allow dragging a map with its markers and exporting those offsets for review. A placement override SHALL move a map and its markers together.

An offset MAY be any world translation. Publication SHALL NOT snap an offset to the tile lattice; a placed map's pyramid is indexed in that map's own coordinates and the atlas translates it when drawing. The reviewed layout places interiors on a ring around the overworld: the four corner maps have their centres at one distance from the overworld centre on each axis, and the maps on each side are spaced evenly between the corners, so every map keeps the same gap to the overworld.

A placement SHALL publish when it resolves to a placed map, whether or not that map's imagery covers its position, and a map's bounds SHALL include every published placement. A door SHALL resolve to the published position of its arrival point through every action kind the game uses for a teleport: an interactable Effect action, a nested GameActions teleport, or a nested Effect game action whose effect teleports. Every published interior SHALL have at least one resolved door into it.

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

#### Scenario: A door teleports through a nested effect
- **WHEN** a placement's only teleport is a GameActions template whose nested Effect game action applies a Teleport effect
- **THEN** the door resolves to that effect's arrival position on its destination map
- **AND** the atlas draws the connection when the door is selected or hovered

#### Scenario: A placement lies outside the map art
- **WHEN** a resolved placement sits where its map's imagery has no opaque pixels
- **THEN** the placement still publishes with its position
- **AND** the map's bounds grow to include it
- **AND** it does not guess a position from unrelated scene coordinates

### Requirement: Travel connections are drawn on the world map

Where a travel point has a resolved destination, the atlas SHALL draw the connection on the world map: the travel marker, a line from it to its destination, and a mark at the destination. One toggle SHALL control that group.

Connections SHALL span maps, so a dungeon entrance links to the arrival point within that zone's map. A travel point whose destination is unresolved SHALL keep its marker without a line, and SHALL NOT be drawn to a guessed position. A destination that is disabled or otherwise inactive SHALL remain visible and visibly distinguished rather than hidden. Selection and hover SHALL strengthen the applicable line while preserving that disabled distinction.

The atlas SHALL draw a connection only from a typed published relationship with explicit source and destination positions. It SHALL NOT infer trap, patrol, portal, blocker, or other lines from labels or detail text.

The authoring mode SHALL render connections while a reviewer positions maps, because a line whose ends are far apart or crossed reveals a wrong placement.

#### Scenario: A reader inspects an entrance
- **WHEN** the entrance has a resolved destination
- **THEN** the map draws the marker, the connection line, and the destination mark
- **AND** one toggle hides or shows all three

#### Scenario: A destination is unresolved
- **WHEN** no verified destination position exists
- **THEN** the travel marker remains without a line
- **AND** the atlas draws no line to an assumed position

#### Scenario: A reviewer positions a dungeon
- **WHEN** connections are visible in the authoring mode
- **THEN** the lines between that dungeon and its entrances stay visible while it moves
- **AND** the reviewer can use them to judge the placement

### Requirement: Details answer player questions

Selection SHALL show the name, category, level, and location, then the facts a player wants: what a creature drops, what a vendor sells and for how much, what a resource yields and what gathering it requires, what a container holds, and where a travel point leads. Requirements and conditions SHALL stay attached to the entries they gate. Large lists SHALL remain searchable without covering the map.

Detail panels SHALL NOT show unresolved-semantics notices, provenance, hashes, or raw configuration dumps.

#### Scenario: A vendor has several progression stock groups
- **WHEN** a reader selects that vendor
- **THEN** the atlas distinguishes unconditional and conditional stock
- **AND** the reader can search the complete stock list while retaining the selected location

#### Scenario: A fact is not established
- **WHEN** a value such as an effective drop chance is not established for the supported build
- **THEN** the entry omits that value
- **AND** the panel does not carry a note explaining the omission

### Requirement: The map conveys scale and hover identity

The atlas SHALL show a scale indicator in world units that updates with zoom, so a reader can judge travel distance. Hovering a marker SHALL show its name and a short description, matching the game's own map, which supports pan, zoom, and hover descriptions.

Hover SHALL NOT replace selection, and it SHALL NOT open a panel that covers the map.

#### Scenario: A reader zooms out
- **WHEN** the view scale changes
- **THEN** the scale indicator updates to the new world distance

#### Scenario: A reader hovers a marker
- **WHEN** the pointer rests on it
- **THEN** its name and short description appear
- **AND** the current selection does not change

### Requirement: Map interaction preserves the reader's context

The rendering adapter SHALL own the live pan and zoom state. Pointer interaction SHALL update that camera directly and report snapshots for URL persistence. Semantic changes, such as selection, filtering, and hover, SHALL NOT send the reported camera back to the adapter or rebuild imagery during a camera change. The interface SHALL reveal the canvas only after the renderer has produced a frame at the canvas's displayed dimensions.

Selecting a marker SHALL update selection only. A separate focus or fit action MAY move the camera. The selected physical placement SHALL have a primary highlight. Other placements that carry the same exact entity identity SHALL have a distinct group highlight. Group membership SHALL NOT use a shared label or category. Hovering or focusing a result SHALL highlight the exact placements that result resolves: one placement for a location, all placements for an entity, and all known source placements for an item. A result hover SHALL render above a group highlight and below the primary selection. Captured imagery and orientation-only illustrations SHALL keep separate camera snapshots, so switching layers does not discard the reader's position in either coordinate space.

#### Scenario: A reader opens the atlas
- **WHEN** the renderer is still sizing its canvas
- **THEN** the interface keeps that canvas hidden behind the map loading surface
- **AND** reveals it only after a correctly sized frame has rendered

#### Scenario: A reader selects a marker
- **WHEN** the reader selects a visible marker
- **THEN** the selection and details update
- **AND** the camera target and zoom remain unchanged

#### Scenario: One entity has several placements
- **WHEN** the reader selects one of those placements
- **THEN** that placement has the primary highlight
- **AND** the other placements with the same entity identity have the group highlight

#### Scenario: A reader previews a result
- **WHEN** the reader hovers or focuses an entity or item result
- **THEN** every exact placement resolved for that result has the hover highlight
- **AND** the current selection remains unchanged

#### Scenario: A reader pans with inertia
- **WHEN** the reader releases a pan gesture
- **THEN** the camera continues and settles without snapping back
- **AND** imagery layers are not reconstructed for each camera update

#### Scenario: A reader switches image coordinate spaces
- **WHEN** the reader switches from captured imagery to an orientation-only illustration and back
- **THEN** each layer restores its own last camera target and zoom

### Requirement: Search connects items to places

Search SHALL find places, creatures, NPCs, resources, and items by their displayed names. Item results SHALL expose their known source types, including drops, vendors, containers, and resource yields. Selecting a source SHALL navigate to its place on the map without losing the item context.

#### Scenario: A player searches for a vendor item
- **WHEN** the item has stock entries on several vendors
- **THEN** search exposes the vendors and stock conditions
- **AND** selecting one opens its location and corresponding stock entry

### Requirement: Navigation is shareable and reversible

The URL SHALL preserve the map, the selected place, the basemap choice, and relevant browsing state. Browser back and forward SHALL restore prior selections. A travel point SHALL navigate to its destination while preserving the source context and a return control. A stale link SHALL explain the missing selection rather than select an unrelated entity.

#### Scenario: A reader follows a dungeon entrance
- **WHEN** its destination is published
- **THEN** the atlas opens that destination and keeps the entrance as source context
- **AND** browser back restores the entrance selection

#### Scenario: A link names a removed place
- **WHEN** the current build no longer contains it
- **THEN** the atlas reports the stale selection and offers navigation to available content

### Requirement: Accessible responsive browsing

The atlas SHALL support keyboard navigation and narrow screens. Search and a synchronized result list SHALL provide access to marker details without pointer-only map interaction. Selection panels SHALL have predictable focus behavior and a visible close action. Marker meaning SHALL NOT depend on color alone. Map geometry SHALL remain visually stable in current Chromium and Firefox-based browsers while hovering and selecting results.

#### Scenario: A keyboard reader selects a search result
- **WHEN** the reader opens the result details and then closes them
- **THEN** the details are operable without a pointer
- **AND** focus returns to a useful originating control

#### Scenario: A Firefox reader previews a result
- **WHEN** hovering the result updates highlight and travel-connection layers
- **THEN** the map retains the same basemap and vector geometry
- **AND** no picking color, stray line, or malformed primitive reaches the visible canvas

#### Scenario: A phone reader browses the atlas
- **WHEN** the viewport is no wider than 680 CSS pixels
- **THEN** the map and results use the full viewport width without horizontal scrolling
- **AND** the closed category panel occupies only one touch target
- **AND** the open category panel appears as a dismissible drawer above the map

### Requirement: Evidence limits stay outside the interface

The atlas SHALL run from generated static artifacts without access to the game, raw snapshots, or an extraction endpoint. It SHALL NOT display completeness disclosures, coverage counts, or unresolved-semantics notices.

Preview mode, coverage figures, diagnostic totals, and exclusion reasons SHALL live in the generated publication metadata, run manifest, and coverage report, which own those measurements. Progressive map loading SHALL NOT require downloading full-resolution imagery before interaction.

#### Scenario: A reader opens a partial research snapshot
- **WHEN** coverage is incomplete
- **THEN** the publication metadata remains in preview mode
- **AND** the interface does not claim that the snapshot is complete
- **AND** no marker, panel, or control displays completeness or coverage notices

#### Scenario: An operator audits publication coverage
- **WHEN** the operator reads the generated publication metadata and run manifest
- **THEN** those artifacts report the build, mode, coverage figures, and exclusions
- **AND** the interface does not restate those values

### Requirement: Shared map links carry Afallon identity

The root map SHALL publish square favicon and touch-icon assets. It SHALL publish a `1200 × 630` PNG through absolute Open Graph and Twitter card metadata. The expanded atlas sidebar SHALL identify the Afallon Compendium while preserving its home navigation.

#### Scenario: A reader shares the map in Discord
- **WHEN** Discord fetches the root map metadata
- **THEN** the response names the Afallon Compendium interactive map
- **AND** the social image URL resolves to the Afallon logo card

#### Scenario: A reader opens the map in a browser
- **WHEN** the browser requests a favicon or touch icon
- **THEN** the response returns a square Afallon `A` compass mark

#### Scenario: A reader uses the atlas sidebar
- **WHEN** the atlas sidebar is expanded
- **THEN** its header displays the Afallon compass mark and name
- **AND** activating that brand returns to the compendium home page
