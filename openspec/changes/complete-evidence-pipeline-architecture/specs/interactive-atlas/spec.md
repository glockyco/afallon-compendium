## Purpose

Keep the shared-world atlas responsive and its navigation deterministic while preserving existing imagery, selection, and development-only inspection behavior.

## ADDED Requirements

### Requirement: All navigation sources produce equivalent selection effects

Initial URLs, direct selection, browser back, and browser forward SHALL use equivalent state transitions and resource requirements. A selection SHALL resolve its applicable entity and item resources even when they are not cached. Canonical URL fields and stale-link behavior SHALL remain unchanged unless a removed contract is explicitly declared.

#### Scenario: History restores an uncached item selection
- **WHEN** browser navigation restores an item whose sources are not cached
- **THEN** the atlas loads those sources and applies the same placement filter and highlights as direct selection
- **AND** the URL and displayed state remain consistent

#### Scenario: History restores a removed placement
- **WHEN** the URL names a placement absent from the selected publication
- **THEN** the atlas reports the stale selection without selecting an unrelated placement
- **AND** available map navigation remains usable

### Requirement: Resource failures belong to the current request state

Resource loading SHALL deduplicate equivalent requests while permitting explicit retry after failure. Loading and error indicators SHALL belong to the active selection or feature request. An obsolete request SHALL NOT clear a newer loading state or display its failure as the newer selection's error.

#### Scenario: A reader changes selection during loading
- **WHEN** selection A is pending and the reader selects B before A fails
- **THEN** A's failure does not become B's error
- **AND** B remains loading until its own required resources finish

#### Scenario: A failed resource is retried
- **WHEN** a reader retries an available resource after a transient failure
- **THEN** the loader issues a new request and can reach the loaded state
- **AND** successful shared requests are still deduplicated

### Requirement: Shared-world rendering does not wait for unrelated search data

The atlas SHALL load all essential map parts and declared geometry before map-data readiness. It SHALL NOT wait for search indexes or unrelated details. It SHALL compose placements for every published map without introducing active-map selection. Search SHALL expose its own loading or failure state. Partial loading SHALL NOT appear as a final zero-result count.

#### Scenario: Search loading is delayed
- **WHEN** search resources are delayed but all map and geometry resources are available
- **THEN** the reader can view and navigate the map
- **AND** search reports its pending state without blocking the canvas

#### Scenario: Optional movement is enabled
- **WHEN** a reader enables movement after map-data readiness
- **THEN** the atlas displays loaded verified paths without additional resource requests
- **AND** unavailable paths are not inferred from labels or detail text

### Requirement: Renderer updates preserve camera and coordinate ownership

The renderer SHALL retain its live camera during pointer interaction. Selection, hover, and filter changes SHALL NOT reset that camera or rebuild unchanged imagery. Authoring translations SHALL apply consistently to imagery, markers, regions, connections, and viewport-based results. Authored translations SHALL NOT change scale or rotation.

#### Scenario: Selection changes during a pan
- **WHEN** semantic selection state changes while the map camera is moving
- **THEN** the camera continues without a feedback reset
- **AND** unchanged imagery remains stable

#### Scenario: A developer moves a map across the viewport boundary
- **WHEN** an authoring offset moves placements into or out of the visible viewport
- **THEN** rendered geometry and viewport results use the same effective positions
- **AND** exported offsets remain reviewed translation-only layout data

### Requirement: Loading refactors preserve the public product boundary

Game-provided imagery SHALL remain selected by default, and overworld captured terrain SHALL remain opt-in. The shared world, marker vocabulary, guide navigation, accessibility, and WebGL failure fallback SHALL remain available. Production SHALL NOT render development detail panels or authoring controls, or require raw evidence, a database, or a dynamic API.

#### Scenario: A production reader opens a saved layer choice
- **WHEN** the atlas restores a valid canonical URL
- **THEN** it preserves the requested layers and world position
- **AND** no development panel appears while selection state resolves

#### Scenario: WebGL startup fails
- **WHEN** a browser cannot initialize the renderer
- **THEN** the compatibility surface replaces the map loading state
- **AND** independently loaded search and reference results remain usable
