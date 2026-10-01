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
