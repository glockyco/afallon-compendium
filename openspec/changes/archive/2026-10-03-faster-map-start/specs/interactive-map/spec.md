## MODIFIED Requirements

### Requirement: Shared-world rendering does not wait for unrelated search data

The map SHALL assemble placements from all published maps without an active-map selector. Map-data readiness SHALL require essential map parts, all declared geometry, and imagery manifests for the initial visible map spaces, but SHALL NOT wait for search indexes, document details, or imagery manifests for spaces outside an explicit camera view. The map SHALL load an unloaded space's imagery manifest when that space enters the camera. Search SHALL expose its own pending or failure state, and dependent result counts SHALL NOT appear as final zero results while resources are pending.

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

## ADDED Requirements

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
