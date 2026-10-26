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

The map SHALL assemble placements from all published maps without an active-map selector.

#### Scenario: Search loading is delayed
- **WHEN** map parts and geometry are ready but search resources remain pending
- **THEN** the reader can view and navigate the map
- **AND** search-dependent results report their pending state

#### Scenario: Movement is enabled
- **WHEN** a reader enables movement after map-data readiness
- **THEN** the map displays published movement paths from loaded geometry without additional geometry requests

#### Scenario: An explicit camera leaves some maps outside the viewport
- **WHEN** a saved view is centered on one map and other maps lie outside that view
- **THEN** the reader can navigate the shared world without downloading the other maps' imagery manifests at startup
- **AND** moving to another map loads its manifest and displays its imagery without refetching geometry or placements

#### Scenario: Shared-world rendering does not wait for unrelated search data
- **WHEN** Several published maps have placements.
- **THEN** The map assembles placements from all of them without an active-map selector.

### Requirement: Required map-data readiness resources

Map-data readiness SHALL require essential map parts, all declared geometry, and imagery manifests for the initial visible map spaces.

#### Scenario: Required map-data readiness resources
- **WHEN** Essential map parts and all declared geometry are available, but an imagery manifest for an initial visible map space is pending.
- **THEN** Map-data readiness remains pending until the required imagery manifest is available.

### Requirement: Map readiness excludes unrelated resources

Map-data readiness SHALL NOT wait for search indexes, document details, or imagery manifests for spaces outside an explicit camera view.

#### Scenario: Map readiness excludes unrelated resources
- **WHEN** Required map resources are ready, but search indexes, document details, and imagery manifests for spaces outside an explicit camera view are pending.
- **THEN** Map-data readiness does not wait for those pending resources.

### Requirement: Load imagery manifests on camera entry

The map SHALL load an unloaded space's imagery manifest when that space enters the camera.

#### Scenario: Load imagery manifests on camera entry
- **WHEN** A space with an unloaded imagery manifest enters the camera.
- **THEN** The map loads that space's imagery manifest.

### Requirement: Independent search loading and failure state

Search SHALL expose its own pending or failure state.

#### Scenario: Independent search loading and failure state
- **WHEN** Search resources fail while the map is ready.
- **THEN** Search exposes its own failure state.

### Requirement: Pending result counts are not final zeroes

Dependent result counts SHALL NOT appear as final zero results while resources are pending.

#### Scenario: Pending result counts are not final zeroes
- **WHEN** Resources needed for result counts are pending.
- **THEN** The dependent counts do not appear as final zero results.

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

Marker categories SHALL use the terms the game shows its players. The source of that vocabulary is the game's interaction and nameplate model: merchant, quest giver, interactive object, crafting station, and enemy entity, with enemy, neutral, and friendly alignment.

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
- **WHEN** two or more markers have precisely the same world position at any zoom
- **THEN** one marker shows a count of the coincident spots
- **AND** each member can be selected by pointer or keyboard without grouping nearby spots

#### Scenario: Categories use the game's own vocabulary
- **WHEN** An enemy entity's marker category is named.
- **THEN** The category uses the game's enemy entity vocabulary and alignment.

### Requirement: Resource container and travel vocabulary

Resources, containers, and travel points SHALL use the words the game uses for them in its own interface.

#### Scenario: Resource container and travel vocabulary
- **WHEN** A travel point category is named for display.
- **THEN** Its name uses the words the game's interface uses for that travel point.

### Requirement: Categories add distinct information

Each category SHALL add information. A category that every character carries, or that a service category already implies, SHALL NOT exist.

#### Scenario: Categories add distinct information
- **WHEN** A proposed category applies to every character.
- **THEN** That category does not exist.

### Requirement: Character category sections

Bosses, enemies, and neutral creatures SHALL form one section. Merchants, quest givers, and townsfolk SHALL form one section, where townsfolk are the friendly characters with no service.

#### Scenario: Character category sections
- **WHEN** The category sections are displayed.
- **THEN** Bosses, enemies, and neutral creatures share one section, and merchants, quest givers, and friendly characters with no service share another.

### Requirement: Section headings

Sections SHALL carry a short single-line name and no glyph.

#### Scenario: Section headings
- **WHEN** A category section is displayed.
- **THEN** Its heading has a short single-line name and no glyph.

### Requirement: Marker counts in rows and sections

Each row and section SHALL show its marker count.

#### Scenario: Marker counts in rows and sections
- **WHEN** A category row and its section are displayed.
- **THEN** Both show their respective marker counts.

### Requirement: Extraction vocabulary stays off the player surface

Extraction vocabulary SHALL NOT appear on the player surface. The interface SHALL NOT show placement roles, source families, source identities, map spaces, authored flags, component names, or coverage counts.

#### Scenario: Extraction vocabulary stays off the player surface
- **WHEN** A player views marker information backed by extraction data.
- **THEN** The interface shows no extraction vocabulary, including placement roles, source families, source identities, map spaces, authored flags, component names, or coverage counts.

### Requirement: Overlapping categories share physical markers

Overlapping categories SHALL NOT create duplicate physical markers.

#### Scenario: Overlapping categories share physical markers
- **WHEN** One placement belongs to two enabled categories.
- **THEN** The overlapping categories do not create duplicate physical markers.

### Requirement: Exact-position marker grouping

Only markers at the exact same world position SHALL form one counted marker group. Nearby markers at different positions SHALL remain independently visible.

#### Scenario: Exact-position marker grouping
- **WHEN** Two markers have the exact same world position and a third marker is nearby at a different position.
- **THEN** Only the coincident markers form one counted marker group, and the nearby marker remains independently visible.

### Requirement: Grouped marker accessibility

Every group member SHALL be reachable by pointer and keyboard.

#### Scenario: Grouped marker accessibility
- **WHEN** A reader navigates a marker group using a pointer and then a keyboard.
- **THEN** Every member is reachable with either input method.
### Requirement: One registry owns marker presentation

Markers SHALL use recognizable glyph icons from the project's icon set, drawn as a glyph on a colored background, consistent with the sibling maps.

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

#### Scenario: A boss beside an enemy
- **WHEN** a boss marker and an enemy marker are visible at the same zoom and marker size setting
- **THEN** both markers draw at the same size

#### Scenario: One registry owns marker presentation
- **WHEN** A marker is rendered.
- **THEN** It uses a recognizable glyph from the project's icon set on a colored background consistent with the sibling maps.

### Requirement: Registry presentation ownership

One registry SHALL own each marker's icon, color, label, plural label, precedence, render order, and default visibility. Consumers SHALL read that registry.

#### Scenario: Registry presentation ownership
- **WHEN** A consumer needs a marker's presentation settings.
- **THEN** It reads the icon, color, label, plural label, precedence, render order, and default visibility from the owning registry.

### Requirement: Uniform marker and highlight size

Every marker category SHALL draw at the same size, which only the reader's marker size setting changes, and its selection and hover highlights SHALL use that same size.

#### Scenario: Uniform marker and highlight size
- **WHEN** A reader changes the marker size setting with multiple categories visible.
- **THEN** All categories and their selection and hover highlights use the same changed size.

### Requirement: No alternative presentation mappings

There SHALL NOT be a second registry, a compatibility mapping, or a per-consumer marker switch.

#### Scenario: No alternative presentation mappings
- **WHEN** A consumer renders a registered marker category.
- **THEN** It uses no second registry, compatibility mapping, or per-consumer marker switch.

### Requirement: Single-entry category registration

Adding a category SHALL require one registry entry.

#### Scenario: Single-entry category registration
- **WHEN** A new category is added.
- **THEN** The category requires one registry entry.

### Requirement: Registered category layer validation

A test SHALL fail when a registered category has no rendered layer.

#### Scenario: Registered category layer validation
- **WHEN** A registered category lacks a rendered layer.
- **THEN** The test fails.

### Requirement: Single marker resolution

One row SHALL resolve to exactly one marker through a single resolution function, so overlapping categories cannot draw two markers for one place.

#### Scenario: Single marker resolution
- **WHEN** A row has overlapping categories.
- **THEN** A single resolution function resolves the row to exactly one marker for that place.

### Requirement: Glyphs distinguish marker categories

Marker meaning SHALL NOT depend on color alone: each category SHALL be distinguishable by its glyph.

#### Scenario: Glyphs distinguish marker categories
- **WHEN** Marker categories are viewed without color.
- **THEN** Each category remains distinguishable by its glyph.

### Requirement: Semantic render order

Render order SHALL be semantic, from terrain and areas, through paths and ranges, ordinary markers, important markers, to selection and hover highlights.

#### Scenario: Semantic render order
- **WHEN** Terrain, areas, paths, ranges, ordinary markers, important markers, and highlights overlap.
- **THEN** They render in that semantic order, ending with selection and hover highlights.
### Requirement: Published maps share one world

The map SHALL place published game-map spaces in one navigable world.

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

#### Scenario: Published maps share one world
- **WHEN** Multiple game-map spaces are published.
- **THEN** They are placed in one navigable world.

### Requirement: Shared verified texture maps

Scenes that share a verified game map texture SHALL share a rendered map.

#### Scenario: Shared verified texture maps
- **WHEN** Two scenes share a verified game map texture.
- **THEN** They share a rendered map.

### Requirement: Reviewed interior placements

Caves and dungeons without native world offsets SHALL use reviewed placements rather than guessed source-scene coordinates.

#### Scenario: Reviewed interior placements
- **WHEN** A dungeon has no native world offset.
- **THEN** Its placement uses a reviewed placement rather than guessed source-scene coordinates.

### Requirement: Translation-only placement

Placement SHALL be translation only at a shared world scale. The map SHALL NOT rescale or rotate a map to improve the layout.

#### Scenario: Translation-only placement
- **WHEN** A map is positioned to fit the world layout.
- **THEN** Only translation is applied, with no rescaling or rotation and with the shared world scale preserved.

### Requirement: Reviewed offset ownership and authoring

A reviewed placement file SHALL own the offsets. A development-only authoring mode MAY allow dragging a map with its markers and exporting those offsets for review.

#### Scenario: Reviewed offset ownership and authoring
- **WHEN** A reviewed map offset is used to place a map.
- **THEN** The offset is owned by the reviewed placement file.

### Requirement: Production excludes authoring controls

Production SHALL NOT include authoring controls.

#### Scenario: Production excludes authoring controls
- **WHEN** The production map is opened.
- **THEN** No authoring controls are included.

### Requirement: Placement overrides move maps and markers together

A placement override SHALL move a map and its markers together.

#### Scenario: Placement overrides move maps and markers together
- **WHEN** A placement override changes a map's offset.
- **THEN** The map and its markers move together.

### Requirement: Offsets are not tile-snapped

An offset MAY be any world translation. Publication SHALL NOT snap an offset to the tile lattice. A placed map's pyramid is indexed in that map's own coordinates and the map translates it when drawing.

#### Scenario: Offsets are not tile-snapped
- **WHEN** A reviewed offset falls between tile-lattice positions.
- **THEN** Publication retains that offset without snapping, and drawing translates the pyramid indexed in the placed map's own coordinates.

### Requirement: Reviewed interior ring layout

The reviewed layout SHALL place interiors on a ring around the overworld: the four corner maps have their centres at one distance from the overworld centre on each axis, and the maps on each side are spaced evenly between the corners, so every map keeps the same gap to the overworld.

#### Scenario: Reviewed interior ring layout
- **WHEN** The reviewed interior layout is applied.
- **THEN** Interiors form a ring, with corner centres at one distance from the overworld centre on each axis and side maps evenly spaced between corners, keeping the same gap to the overworld.

### Requirement: Resolved placements publish through transparent art

A placement SHALL publish when it resolves to a reviewed placed map, including where the game art is transparent.

#### Scenario: Resolved placements publish through transparent art
- **WHEN** A placement resolves to a reviewed placed map at a transparent part of the game art.
- **THEN** The placement publishes.

### Requirement: Map bounds include published placements

Map bounds SHALL include published placements.

#### Scenario: Map bounds include published placements
- **WHEN** A published placement lies outside the map's current bounds.
- **THEN** The map bounds include that placement.

### Requirement: No guessed arrival positions

An unresolved arrival position SHALL NOT be guessed from a destination scene name.

#### Scenario: No guessed arrival positions
- **WHEN** An arrival position is unresolved but a destination scene name is available.
- **THEN** No arrival position is guessed from that name.

### Requirement: Placed map names

Each placed map SHALL show its player-facing name above its bounds.

#### Scenario: Placed map names
- **WHEN** A placed map is displayed.
- **THEN** Its player-facing name appears above its bounds.

### Requirement: Map label movement and legibility

The label SHALL move with the map and remain legible without covering its terrain at the map's working zoom.

#### Scenario: Map label movement and legibility
- **WHEN** A map is moved and viewed at its working zoom.
- **THEN** Its label moves with it and remains legible without covering its terrain.
### Requirement: Travel connections are drawn on the world map

Where a travel point has a resolved destination, the map SHALL draw a line from its marker to that destination and a mark at the destination.

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

#### Scenario: Travel connections are drawn on the world map
- **WHEN** A travel point has a resolved destination.
- **THEN** The map draws a line from the travel marker to that destination and a destination mark.

### Requirement: Connection toggle visibility

The connection toggle SHALL show all resolved lines and destination marks. A selected or hovered travel point MAY still show its own connection when that toggle is off.

#### Scenario: Connection toggle visibility
- **WHEN** The connection toggle is turned on.
- **THEN** All resolved lines and destination marks are shown.

### Requirement: Travel marker category visibility

The travel marker SHALL follow its category visibility, not the connection toggle.

#### Scenario: Travel marker category visibility
- **WHEN** A travel category is visible and the connection toggle is turned off.
- **THEN** The travel marker remains visible according to its category visibility.

### Requirement: Cross-map travel connections

Connections SHALL span maps, so a dungeon entrance links to the arrival point within that zone's map.

#### Scenario: Cross-map travel connections
- **WHEN** A dungeon entrance has a resolved arrival point within the dungeon zone's map.
- **THEN** Its connection spans maps to that arrival point.

### Requirement: Unresolved travel destinations

A travel point whose destination is unresolved SHALL keep its marker without a line, and SHALL NOT be drawn to a guessed position.

#### Scenario: Unresolved travel destinations
- **WHEN** A travel point's destination is unresolved.
- **THEN** Its marker remains without a line and no connection is drawn to a guessed position.

### Requirement: Inactive destination distinction

A destination that is disabled or otherwise inactive SHALL remain visible and visibly distinguished rather than hidden.

#### Scenario: Inactive destination distinction
- **WHEN** A travel destination is disabled.
- **THEN** It remains visible and visibly distinguished rather than hidden.

### Requirement: Connection selection and hover emphasis

Selection and hover SHALL strengthen the applicable line while preserving that disabled distinction.

#### Scenario: Connection selection and hover emphasis
- **WHEN** A reader hovers over a travel point with a disabled destination.
- **THEN** The applicable line is strengthened while the disabled distinction is preserved.

### Requirement: Typed relationship connection evidence

The map SHALL draw a connection only from a typed published relationship with explicit source and destination positions.

#### Scenario: Typed relationship connection evidence
- **WHEN** A potential connection lacks a typed published relationship with explicit source and destination positions.
- **THEN** The map does not draw that connection.

### Requirement: No text-inferred connections

The map SHALL NOT infer trap, patrol, portal, blocker, or other lines from labels or detail text.

#### Scenario: No text-inferred connections
- **WHEN** Detail text mentions a portal without a typed published connection.
- **THEN** The map does not infer a portal line from that text.

### Requirement: Authoring connections reveal placement errors

The authoring mode SHALL render connections while a reviewer positions maps, because a line whose ends are far apart or crossed reveals a wrong placement.

#### Scenario: Authoring connections reveal placement errors
- **WHEN** A reviewer positions maps in authoring mode and a connection's ends are far apart or crossed.
- **THEN** Connections remain rendered, exposing the potentially wrong placement.

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

The map SHALL publish one Heroic Console marker for each distinct typed Heroic Console source placement admitted by the catalog.

#### Scenario: Three consoles in Coalway outdoors
- **WHEN** the accepted scene scan contains consoles in Coalway Woods, Coalway Swamp, and Chillwind Heights
- **THEN** the map shows three distinct Heroic Console markers at their scanned positions
- **AND** selecting any one shows its Heroic Tier explanation and section link

#### Scenario: Heroic Console markers come from scanned placements
- **WHEN** The catalog admits two distinct typed Heroic Console source placements.
- **THEN** The map publishes one Heroic Console marker for each placement.

### Requirement: Heroic Console scanned placement evidence

Each Heroic Console marker's scene, map space, area, position, and source evidence SHALL come from the scan and existing placement pipeline rather than a manually authored location.

#### Scenario: Heroic Console scanned placement evidence
- **WHEN** A Heroic Console marker is published.
- **THEN** Its scene, map space, area, position, and source evidence come from the scan and existing placement pipeline, not a manually authored location.

### Requirement: Heroic Console category presentation

The Heroic Console category SHALL be visible by default like other service markers, with its own glyph and the label "Heroic Console".

#### Scenario: Heroic Console category presentation
- **WHEN** The map is opened with default category visibility.
- **THEN** The Heroic Console category is visible like other service markers, with its own glyph and the label "Heroic Console".

### Requirement: Heroic Console explanation card

Selecting a console SHALL show a card that explains what it does in plain language and links to the Heroic Tier Getting started section.

#### Scenario: Heroic Console explanation card
- **WHEN** A reader selects a Heroic Console marker.
- **THEN** A card explains what the console does in plain language and links to the Heroic Tier Getting started section.

### Requirement: Console locations link back to their map markers

The Heroic Tier opening and Getting started section SHALL link each published console place to its specific selected map spot. The corresponding place pages SHALL list their console with a link selecting that same spot in the existing objects or services section. Place-to-console associations SHALL come from the scanned source hierarchy and published placements, not hard-coded placement identifiers.

#### Scenario: Reader navigates to one console
- **WHEN** a reader follows a Heroic Console map link from the Heroic Tier page or its place page
- **THEN** the map selects the matching published Heroic Console placement
- **AND** the other two console spots remain independently selectable

### Requirement: Inbound map links frame their destinations

A map link naming a published placement without an explicit camera view SHALL frame that placement at a useful scale, no closer than the map image's own available detail.

#### Scenario: A reader follows a placement link
- **WHEN** a reader opens a map link to one published spot with no camera coordinates
- **THEN** that spot is visible near the center without zooming past the map image's available detail
- **AND** selecting another spot later does not move the camera

#### Scenario: A reader follows an entity link
- **WHEN** a reader opens a map link to an entity with several published spots and no camera coordinates
- **THEN** the camera frames all of its published spots
- **AND** the result list names only those spots, even if their category is normally hidden

#### Scenario: A reader opens a saved camera view
- **WHEN** a map link contains a placement or entity and an explicit camera view
- **THEN** the explicit camera position and zoom remain unchanged

#### Scenario: Inbound map links frame their destinations
- **WHEN** A reader opens a link to a published placement without an explicit camera view.
- **THEN** The camera frames that placement at a useful scale without zooming beyond the map image's available detail.

### Requirement: Entity links frame published spots

A map link naming a published entity without an explicit camera view SHALL frame all of that entity's published spots.

#### Scenario: Entity links frame published spots
- **WHEN** A reader opens an entity link without an explicit camera view for an entity with several published spots.
- **THEN** The camera frames all of that entity's published spots.

### Requirement: Entity links list published spots regardless of category

A map link naming a published entity without an explicit camera view SHALL list all of that entity's published spots, including when the entity's category is not selected.

#### Scenario: Entity links list published spots regardless of category
- **WHEN** A reader opens an entity link without an explicit camera view while the entity's category is not selected.
- **THEN** The result list includes all of that entity's published spots.

### Requirement: Cross-map framing respects image detail

When linked spots span maps with different image detail, framing SHALL respect the least detailed map.

#### Scenario: Cross-map framing respects image detail
- **WHEN** Linked spots span two maps with different image detail.
- **THEN** The framing respects the least detailed map.

### Requirement: Explicit camera views remain authoritative

An explicit camera view SHALL remain authoritative.

#### Scenario: Explicit camera views remain authoritative
- **WHEN** A reader opens a placement link containing an explicit camera view.
- **THEN** The explicit camera view remains unchanged.

### Requirement: Selection changes preserve the live camera

Changing selections after arrival SHALL NOT reposition the live camera.

#### Scenario: Selection changes preserve the live camera
- **WHEN** A reader changes the selected spot after arriving through a map link.
- **THEN** The live camera does not reposition.

### Requirement: Map selection and hover remain legible

Selected and hovered markers SHALL draw above ordinary marker icons. A hover preview SHALL clear when a camera change leaves no marker under the pointer. Movement paths and roaming ranges SHALL NOT capture marker selection. Map status SHALL describe matching spots and spots in view in plain player-facing language.

#### Scenario: A selected marker neighbors another marker
- **WHEN** a linked placement is selected next to a different marker
- **THEN** the selected marker icon remains visible above the neighboring icon

#### Scenario: The reader zooms away from a hovered marker
- **WHEN** a hovered marker moves away from a stationary pointer during zoom
- **THEN** its hover preview no longer persists without a marker under the pointer

#### Scenario: The reader points inside a roaming range
- **WHEN** a movement range is visible and no marker is under the pointer
- **THEN** that range does not select its creature

### Requirement: Search indexes load when needed

The map SHALL leave search indexes unloaded until a reader focuses or types in the search field or opens a link or selection that needs an entity or item document. It SHALL reuse the request for subsequent searches and selections. A pending search SHALL show its loading indicator in or beside the input without changing input height or clipping results.

#### Scenario: A reader opens the map without searching
- **WHEN** the map opens without a selected spot, linked entity, item, place, or query
- **THEN** the map renders its placements and does not download search indexes

#### Scenario: Search receives focus
- **WHEN** a reader focuses or types in the search field
- **THEN** the map begins loading the published search indexes
- **AND** the input and surrounding content do not shift while the indicator is shown

#### Scenario: A reader follows an item link
- **WHEN** a saved map link names an item whose document has not loaded
- **THEN** the map loads the search indexes and item document to resolve the item spots
