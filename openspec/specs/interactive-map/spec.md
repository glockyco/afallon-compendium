# interactive-map Specification

## Purpose

Keep navigation, rendering, and search consistent while readers explore every published map in one shared world. Keep map interaction usable when independent search or detail resources are pending or when WebGL is unavailable.

## Requirements

### Requirement: All navigation sources produce equivalent selection effects

Initial URLs, direct selection, and browser history SHALL resolve selection from the same map state. The map SHALL load published documents for selected entries when needed and SHALL report a missing selection without substituting another placement.

#### Scenario: History restores an uncached item selection
- **WHEN** browser navigation restores an item whose document is not cached
- **THEN** the map loads its document and applies the same placement filter and highlights as direct selection
- **AND** the item and selection context remain in the restored URL state

#### Scenario: History restores a removed placement
- **WHEN** the URL names a placement absent from the loaded publication
- **THEN** the map reports the stale selection without selecting an unrelated placement
- **AND** other map navigation remains usable

### Requirement: Resource failures belong to the current request state

The map SHALL reuse equivalent successful or pending resource requests and SHALL permit retry after a failure. Loading and failure indicators SHALL distinguish map data, search data, and selection details. An obsolete selection request SHALL NOT replace the newer selection's loading or error state.

#### Scenario: A reader changes selection during loading
- **WHEN** selection A is pending and the reader selects B before A fails
- **THEN** A's failure does not become B's error
- **AND** B remains loading until its required documents finish

#### Scenario: A failed resource is retried
- **WHEN** a reader retries a failed map, search, or detail request
- **THEN** the failed resource can be requested again
- **AND** already successful shared resource requests remain reusable

### Requirement: Shared-world rendering does not wait for unrelated search data

The map SHALL assemble placements from all published maps without an active-map selector. Map-data readiness SHALL require essential map parts, imagery manifests, and all declared geometry, but SHALL NOT wait for search indexes or document details. Search SHALL expose its own pending or failure state, and dependent result counts SHALL NOT appear as final zero results while resources are pending.

#### Scenario: Search loading is delayed
- **WHEN** map parts and geometry are ready but search resources remain pending
- **THEN** the reader can view and navigate the map
- **AND** search-dependent results report their pending state

#### Scenario: Movement is enabled
- **WHEN** a reader enables movement after map-data readiness
- **THEN** the map displays published movement paths from loaded geometry without additional geometry requests

### Requirement: Renderer updates preserve camera and coordinate ownership

The map SHALL retain its live camera during selection, hover, filtering, and layer updates without rebuilding unchanged imagery. Development-only world-offset overrides SHALL translate imagery, markers, regions, connections, and viewport results consistently without changing their scale or rotation.

#### Scenario: Selection changes during a pan
- **WHEN** selection changes while the reader pans the map
- **THEN** the current camera remains under the reader's control
- **AND** unchanged imagery remains stable

#### Scenario: An author moves a map across the viewport boundary
- **WHEN** a development-only translation moves placements into or out of the visible viewport
- **THEN** rendered placements and viewport results use their translated positions
- **AND** the exported offsets describe translations only

### Requirement: Loading preserves the public map boundary

The map SHALL select game-provided imagery by default when available and SHALL offer captured terrain as an opt-in layer. It SHALL preserve category controls, keyboard-accessible results, and a usable compatibility surface if WebGL startup fails. Production SHALL NOT render development detail or authoring controls and SHALL NOT require raw game evidence, a database, or a dynamic extraction endpoint.

#### Scenario: A production reader opens a saved layer choice
- **WHEN** the map restores a URL naming available layers and a world view
- **THEN** it preserves that layer choice and camera position
- **AND** development detail and authoring controls remain absent

#### Scenario: WebGL startup fails
- **WHEN** a browser cannot initialize the WebGL renderer after publication data loads
- **THEN** the compatibility surface replaces the canvas loading state
- **AND** independently loaded search and map results remain usable

### Requirement: Consistent map navigation state

The map SHALL use accepted navigation state for controls, results, details, and URL persistence. Pending query and camera persistence SHALL NOT overwrite restored history state. Reader actions SHALL preserve unrelated state unless they explicitly clear it, and closing development details SHALL restore focus to the selection origin when available.

#### Scenario: History navigation overtakes pending input
- **WHEN** a reader navigates backward while a query update is pending
- **THEN** controls, results, details, and the URL reflect the restored entry
- **AND** the pending update does not overwrite the restored query or selection

#### Scenario: Selection follows a camera gesture
- **WHEN** a reader selects a placement while camera URL persistence is pending
- **THEN** the persisted view retains that selection
- **AND** selecting the placement does not reposition the live camera

#### Scenario: Item context survives source navigation
- **WHEN** a reader follows an item source link to the map and selects a source placement
- **THEN** the selected placement retains the item context
- **AND** browser history restores the item's placement and filter state

### Requirement: Stable eager geometry readiness

The map SHALL load and validate all declared map and geometry parts before reporting map-data readiness. A geometry failure SHALL produce a retryable map-data error rather than a complete-looking partial map. Movement and connection visibility SHALL use loaded geometry without refetching it, and an empty declared geometry list SHALL require no geometry request.

#### Scenario: Geometry response is delayed
- **WHEN** essential map parts are available but declared geometry remains pending
- **THEN** map data remains loading until geometry has been validated

#### Scenario: Reader toggles movement and connections
- **WHEN** a reader changes movement or connection visibility after map-data readiness
- **THEN** loaded placement and geometry data is reused without further geometry requests
- **AND** imagery and placement positions remain stable

#### Scenario: Geometry load fails and succeeds on retry
- **WHEN** declared geometry fails to load and a later retry succeeds
- **THEN** the map first exposes a retryable map-data error
- **AND** all declared geometry is available before readiness

### Requirement: Non-inertial map gestures

The map SHALL stop panning when a mouse or touch gesture ends. It SHALL bound zoom during wheel and pinch interactions, and development-only map dragging SHALL NOT enable inertia when normal navigation resumes.

#### Scenario: Reader releases a pan gesture
- **WHEN** a reader releases a mouse or touch pan
- **THEN** camera motion stops without inertial continuation

#### Scenario: Authoring drag returns to navigation
- **WHEN** a developer finishes moving a map in authoring mode and resumes navigation
- **THEN** panning remains non-inertial
- **AND** pinch and wheel zoom remain bounded

### Requirement: Production selections keep the map full width

Production SHALL NOT render development detail or evidence panels. Selection, filtering, hover, search, and URL state SHALL continue without those panels; a stale or failed selection SHALL display an inline explanation and a clear or retry action.

#### Scenario: A production reader selects a marker
- **WHEN** a marker is selected in production
- **THEN** the map retains its selection, highlight, and URL state
- **AND** no details column opens

#### Scenario: A stale link is opened in production
- **WHEN** the selected placement is absent from the publication
- **THEN** the map explains the missing selection and offers to clear it
- **AND** it does not select an unrelated placement

### Requirement: Search connects published entries to map placements

The map SHALL match placement text and names or aliases of published search entries against a reader's query. Matching entries SHALL lead to their linked published placements; unplaced entries SHALL NOT invent map results. Item-source map links SHALL filter to published source placements and retain item identity in the URL.

#### Scenario: A reader searches for an item with placed sources
- **WHEN** a searched item has linked published placements
- **THEN** matching placements appear in map results and can be selected

#### Scenario: A reader follows a specific item source
- **WHEN** an item page links to a published source row on the map
- **THEN** the map filters and highlights that row's known placements
- **AND** the URL retains the item and source-row identity

#### Scenario: A quest has no published placement
- **WHEN** a searched quest has no linked map placement
- **THEN** map results do not invent a location for that quest

### Requirement: Evidence limits stay outside the map interface

The map SHALL render from generated static publication resources without game inputs or raw snapshots. It SHALL NOT add completeness disclosures, coverage counts, or unresolved-semantics notices to markers, controls, or results. Map interaction SHALL NOT wait for full-resolution imagery tiles to download.

#### Scenario: A reader opens a publication with incomplete coverage
- **WHEN** published coverage is incomplete
- **THEN** map controls and markers do not display aggregate coverage warnings
- **AND** the separate coverage page remains the reader surface for published gaps

#### Scenario: Imagery tiles remain pending
- **WHEN** publication resources are ready but full-resolution map tiles are still downloading
- **THEN** map controls and placement results remain interactive

### Requirement: Categories use the game's own vocabulary

Marker categories SHALL use the terms the game shows its players. The source of that vocabulary is the game's interaction and nameplate model: merchant, quest giver, interactive object, crafting station, and enemy entity, with enemy, neutral, and friendly alignment. Resources, containers, and travel points SHALL use the words the game uses for them in its own interface.

Each category SHALL add information. A category that every character carries, or that a service category already implies, SHALL NOT exist. Bosses, enemies, and neutral creatures form one section. Merchants, quest givers, and townsfolk form one section, where townsfolk are the friendly characters with no service. Sections SHALL carry a short single-line name and no glyph, and each row and section SHALL show its marker count.

Extraction vocabulary SHALL NOT appear on the player surface. The interface SHALL NOT show placement roles, source families, source identities, map spaces, authored flags, component names, or coverage counts.

Overlapping categories SHALL NOT create duplicate physical markers. Dense views SHALL aggregate markers without silently excluding categories.

#### Scenario: A vendor also gives quests
- **WHEN** a reader enables both the merchant and quest-giver categories
- **THEN** that NPC has one physical marker carrying both
- **AND** the published NPC page remains the source for stock and quest details

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
- **THEN** the map, result list, and category controls use that entry's icon and color
- **AND** no consumer carries its own icon or color mapping

#### Scenario: A registered category has no layer
- **WHEN** a category exists in the registry but no layer renders it
- **THEN** the registration test fails

#### Scenario: A reader cannot rely on color
- **WHEN** two categories are compared without color perception
- **THEN** their glyphs distinguish them
- **AND** the result list and details state the category in words

### Requirement: Published maps share one world

The map SHALL place published game-map spaces in one navigable world. Scenes that share a verified game map texture SHALL share a rendered map. Caves and dungeons without native world offsets SHALL use reviewed placements rather than guessed source-scene coordinates.

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
- **AND** the label does not obscure the game-provided imagery

#### Scenario: A map has no reviewed placement
- **WHEN** the world map is built
- **THEN** the run reports that map as unplaced

#### Scenario: A placement lies outside the map art
- **WHEN** a resolved placement sits where its map's imagery has no opaque pixels
- **THEN** the placement still publishes with its position
- **AND** the map's bounds grow to include it
- **AND** it does not guess a position from unrelated scene coordinates

### Requirement: Travel connections are drawn on the world map

Where a travel point has a resolved destination, the map SHALL draw a line from its marker to that destination and a mark at the destination. The connection toggle SHALL show all resolved lines and destination marks. A selected or hovered travel point MAY still show its own connection when that toggle is off. The travel marker follows its category visibility, not the connection toggle.

Connections SHALL span maps, so a dungeon entrance links to the arrival point within that zone's map. A travel point whose destination is unresolved SHALL keep its marker without a line, and SHALL NOT be drawn to a guessed position. A destination that is disabled or otherwise inactive SHALL remain visible and visibly distinguished rather than hidden. Selection and hover SHALL strengthen the applicable line while preserving that disabled distinction.

The map SHALL draw a connection only from a typed published relationship with explicit source and destination positions. It SHALL NOT infer trap, patrol, portal, blocker, or other lines from labels or detail text.

The authoring mode SHALL render connections while a reviewer positions maps, because a line whose ends are far apart or crossed reveals a wrong placement.

#### Scenario: A reader inspects an entrance
- **WHEN** the entrance has a resolved destination
- **THEN** the map draws the marker, the connection line, and the destination mark
- **AND** the connection toggle controls the full set of lines and destination marks, not category markers

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

### Requirement: Heroic Console markers come from scanned placements

The map SHALL publish one Heroic Console marker for each distinct typed Heroic Console source placement admitted by the catalog. Its scene, map space, area, position, and source evidence SHALL come from the scan and existing placement pipeline rather than a manually authored location. The Heroic Console category SHALL be visible by default like other service markers, with its own glyph and the label “Heroic Console”. Selecting a console SHALL show a card that explains what it does in plain language and links to the Heroic Tier Getting started section.

#### Scenario: Three consoles in Coalway outdoors
- **WHEN** the accepted scene scan contains consoles in Coalway Woods, Coalway Swamp, and Chillwind Heights
- **THEN** the map shows three distinct Heroic Console markers at their scanned positions
- **AND** selecting any one shows its Heroic Tier explanation and section link

### Requirement: Console locations link back to their map markers

The Heroic Tier opening and Getting started section SHALL link each published console place to its specific selected map spot. The corresponding place pages SHALL list their console with a link selecting that same spot in the existing objects or services section. Place-to-console associations SHALL come from the scanned source hierarchy and published placements, not hard-coded placement identifiers.

#### Scenario: Reader navigates to one console
- **WHEN** a reader follows a Heroic Console map link from the Heroic Tier page or its place page
- **THEN** the map selects the matching published Heroic Console placement
- **AND** the other two console spots remain independently selectable
