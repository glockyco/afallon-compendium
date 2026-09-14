## Purpose

Publish a validated static Afallon atlas that loads bounded data on demand, preserves familiar game imagery, and requires no request-time application service.

## ADDED Requirements

### Requirement: Publication emits bounded static resources

Publication SHALL emit a small root manifest and independently addressable static resources for map placements, search data, entity details, item sources, coverage, and image layers. The atlas SHALL load and compose every published map shard so all maps remain visible together at their reviewed world offsets. Sharding SHALL bound individual files and enable immutable caching; it SHALL NOT introduce an active-map selection model or change world positions. Every resource SHALL carry or inherit the publication schema, game build, and source catalog identity.

#### Scenario: A reader opens the atlas
- **WHEN** the atlas loads from a fresh session
- **THEN** it loads every published map shard and renders all maps in the shared world view
- **AND** every map, marker, region, movement path, and image layer retains its reviewed world position
- **AND** it does not download unrelated entity or item detail records

#### Scenario: A reader opens one entity detail
- **WHEN** the selected entity's detail is not already loaded
- **THEN** the atlas fetches the independently addressable detail resource
- **AND** it does not fetch every entity detail

### Requirement: The deployed atlas is static

The built site SHALL operate from versioned static files and image tiles on Cloudflare Static Assets. Search, filtering, layer selection, selection state, and map navigation SHALL execute in the browser without a request-time API, worker handler, database, account, or game installation.

#### Scenario: Static hosting serves a publication
- **WHEN** the publication directory is deployed without application code
- **THEN** a reader can pan across the complete shared world, search loaded indexes, filter markers, and select available layers
- **AND** no interaction requires a dynamic server response

### Requirement: Game imagery is the default

When a map has imagery supplied by the game, the atlas SHALL select that imagery by default for both the overworld and interiors. Captured terrain SHALL be an optional layer that a reader explicitly enables and SHALL NOT replace or automatically supersede game imagery. The atlas SHALL retain the selected world location when layers change.

#### Scenario: The overworld has game and captured imagery
- **WHEN** a reader opens the overworld without a saved layer choice
- **THEN** the game-provided imagery is selected
- **AND** captured terrain remains available but disabled

#### Scenario: An interior has game imagery
- **WHEN** a reader opens the interior without a saved layer choice
- **THEN** the game-provided imagery is selected
- **AND** the map does not substitute captured terrain

#### Scenario: A reader enables captured terrain
- **WHEN** a reader explicitly selects the captured layer
- **THEN** the atlas displays it with its verified registration
- **AND** the selected world location and marker alignment remain stable

### Requirement: Detail and authoring controls remain development-only

Production builds SHALL NOT render the selection detail panel or authoring controls. Development builds SHALL retain those interfaces for inspection and authoring workflows. Refactoring the atlas SHALL NOT weaken the build-time boundary.

#### Scenario: A production reader selects a marker
- **WHEN** a marker is selected in a production build
- **THEN** the map can retain selection state without rendering the development detail panel
- **AND** no authoring control becomes available

#### Scenario: A developer selects a marker
- **WHEN** a marker is selected in a development build
- **THEN** the development detail panel can inspect its available facts and provenance
- **AND** development authoring controls remain available where defined

### Requirement: URL state uses one canonical form

The atlas SHALL serialize shareable map state with one canonical set of URL parameters. Reading and writing that state SHALL preserve valid layer selection, marker selection, filters, search terms, view position, and zoom. Deprecated parameter aliases SHALL be rejected or ignored after cutover and SHALL NOT be written.

#### Scenario: A canonical shared URL is opened
- **WHEN** the URL contains valid canonical atlas state
- **THEN** the atlas restores that state
- **AND** writing the unchanged state produces the same canonical parameter form

#### Scenario: A URL contains a removed alias
- **WHEN** the URL uses a parameter alias removed by the cutover
- **THEN** the atlas does not treat that alias as canonical state
- **AND** subsequent URL updates do not write the alias

### Requirement: Publication is validated before selection

Publication SHALL verify build agreement, catalog identity, required references, resource hashes, spatial bounds, image registration, and release coverage before replacing the selected publication. A bounded preview MAY retain unresolved coverage only when it is visibly identified as incomplete. A failed build SHALL preserve the previous selected publication.

#### Scenario: A resource hash does not match its manifest
- **WHEN** publication verification detects a missing or mismatched static resource
- **THEN** the new publication is rejected
- **AND** the previous selected publication remains available

#### Scenario: A preview has unresolved coverage
- **WHEN** a bounded preview passes integrity checks but retains unresolved coverage
- **THEN** it is labeled incomplete in its manifest and visible interface
- **AND** it cannot satisfy the complete-release gate
