## ADDED Requirements

### Requirement: Native game-map registration

Where the game ships a `MapZone` texture, publication SHALL carry that texture as a calibrated layer registered through the game's world-to-map conversion. Shared textures SHALL preserve the game's zone association.

#### Scenario: A zone ships its own map
- **WHEN** a scene carries a `MapZone` with a texture
- **THEN** the publication carries that texture as a calibrated pyramid registered by the zone's own conversion
- **AND** the map opens that map on the game map

#### Scenario: A zone reuses another zone's texture
- **WHEN** a scene's `MapZone` names a texture the game also shows for another zone
- **THEN** the publication carries it as the game shows it and records the shared texture name

### Requirement: Each map is one horizontal plane

Every published map SHALL have one image plane per layer with no floor-specific image selection. Captured terrain covers the overworld, not interior floors. Vertically stacked placements SHALL keep distinct identities on the same horizontal plane. The public placement contract does not yet expose world height.

#### Scenario: Two placements project onto the same point
- **WHEN** a placement on an upper level shares its horizontal position with one below
- **THEN** both remain separately selectable records
- **AND** the map does not merge, hide, or displace either one

### Requirement: Capture renders each tile with its declared frame

Capture SHALL render every tile with the camera frame its plan declares, as one frame, and SHALL NOT slice, cut, or composite along any surface. Only the world surface is captured; each interior publishes the map the game draws for it.

A capture plan MAY cite the hashed navigation survey of its scene. When it does, capture SHALL stand the player on the walkable point nearest the map's centre before observing, and the survey hash SHALL be part of every tile's compatibility key.

The game switches a terrain's objects off unless the player stands inside that terrain. When one observation of the whole map leaves such switched-off loaders inside its envelope, or loses a required source to that switch during its stream visit, capture SHALL observe each tile under its own readiness so the artifact records exactly what that tile's frame saw. A loader the game switched off during a visit SHALL NOT count as a restoration leak.

#### Scenario: One standing point shows the whole map
- **WHEN** the map's observation finds no switched-off loader inside its envelope
- **THEN** every tile renders under that one observation

#### Scenario: The game hides terrain the player is not standing in
- **WHEN** the map's observation finds switched-off loaders inside its envelope
- **THEN** each tile is observed and rendered under its own readiness
- **AND** a tile whose frame spans two such terrains records the hidden region as empty rather than inventing it

#### Scenario: A survey changes
- **WHEN** the cited navigation survey's hash changes
- **THEN** every tile of that map is recaptured rather than reused

### Requirement: Capture chunks compose into a verified tile pyramid

Capture SHALL render an extent as chunks sized for its resolution, and tile generation SHALL produce the delivery pyramid from those chunks. Delivery tiles SHALL use `tileSize: 256`, global integer `(x, y)` indices, and `z` values where each tile covers `[x·256/2^z, (x+1)·256/2^z] × [y·256/2^z, (y+1)·256/2^z]` world units. Zoom levels SHALL run contiguously from `minZoom` through `maxZoom`, with `maxZoom = log2(1024 / captureEdge)` and each coarser level formed by a 2×2 parent merge. Pixel row zero SHALL be the top edge, and the finest extent SHALL be the union of emitted finest tiles. One image file per map SHALL NOT be a requirement, and neither SHALL one chunk per delivery tile.

The publication SHALL retain explicit positions for available and missing capture tiles. Optional captured terrain is not a complete-coverage claim and SHALL NOT prevent publication of a verified game-provided map.

#### Scenario: An extent needs several chunks
- **WHEN** its resolution exceeds one practical render target
- **THEN** capture renders adjacent chunks with a shared pixel density
- **AND** their pixel-edge transforms meet without a gap or an extra Y reversal
- **AND** tile generation produces one pyramid with a single finest level

### Requirement: Images and markers share explicit registration

Every calibrated image layer SHALL identify its map, world bounds, orientation, resolution, and coordinate transform. Calibration SHALL use known landmarks and round-trip checks. Unregistered illustrations SHALL NOT claim precise marker registration.

#### Scenario: A native projection contradicts the image extent
- **WHEN** the native center or corner controls differ from the declared raster mapping by more than one quarter pixel
- **THEN** capture fails instead of registering that PNG as a valid tile

#### Scenario: Several scenes share a map
- **WHEN** a reader switches between calibrated image layers
- **THEN** the same selected world location remains selected
- **AND** marker positions use that layer's verified registration

### Requirement: Capture waits for relevant geometry

Capture SHALL prepare the geometry required by each chunk, including streamed objects. Bounds SHALL come from validated spatial evidence, not only marker extents or fixed constants. A reviewed rectangular capture grid SHALL emit every cell in that rectangle; an empty placement cell SHALL NOT create a hole in otherwise continuous imagery. Every planned chunk SHALL have a captured, verified-empty, or failed result. A timeout or missing streamed source SHALL NOT count as empty terrain.

Required source selection SHALL cover the complete chunk frustum and its configured boundary overlap. Capture SHALL retain inactive-source exclusions, exact loaded-root and handle state, and stable geometry observations from distinct native frames. A combined loaded-or-loading flag SHALL NOT establish readiness. The chunk deadline SHALL include rendering and hold restoration.

#### Scenario: A distant structure is initially unloaded
- **WHEN** a chunk requires that structure
- **THEN** capture waits for its geometry or reports the chunk as failed
- **AND** the run does not silently accept an incomplete image

#### Scenario: A source reports loaded or loading
- **WHEN** the combined availability flag is true but the source has no settled loaded root
- **THEN** capture keeps the chunk pending until the source becomes ready or the deadline fails it

#### Scenario: Animated bounds cross a clipping plane
- **WHEN** a previously observed renderer moves outside the chunk frustum without changing its active mesh or material bindings
- **THEN** later inventories continue inspecting those bindings
- **AND** changing frustum intersection alone does not prevent stabilization
- **AND** missing materials, changed bindings, and unready sources remain subject to readiness checks

#### Scenario: An empty chunk exceeds its deadline after readiness
- **WHEN** stable observations establish empty geometry but the operation later exceeds its deadline
- **THEN** the run records a failed chunk rather than a successful empty result
- **AND** native ownership cleanup still completes

### Requirement: Capture owns visual settings and restores state

Capture SHALL control and record camera projection, lighting, fog, and transient suppression. It SHALL retain useful static landmarks. On success, error, or cancellation, it SHALL release temporary resources and restore every state it changed. It SHALL NOT overwrite unrelated saves.

Scene loading, preload, readiness checks, and geometry holds MAY span gameplay frames under exclusive runtime ownership. Temporary lighting changes, renderer suppression, and rendering SHALL execute within a frame-local operation. That operation SHALL restore visual state before the next gameplay frame. Multi-frame operations SHALL release their holds and restore owned temporary state on success, error, cancellation, or disconnection. Cleanup SHALL execute in the runtime without depending on a connected host to issue a later restore command. A disconnected run SHALL remain unsuccessful until cleanup is confirmed.

Capture SHALL exclude active game lights from rendering and use its controlled lighting profile. It SHALL preserve useful static meshes and landmark particles outside the reviewed suppression selection. Geometry readiness SHALL use the same transient selection as rendering and record its exclusions.

The capture plan SHALL carry a reviewed suppression policy: shader-name prefixes whose renderers hide during capture, and whether terrain-instanced trees and details hide. The game marks foliage with no layer or tag, so the shader family is the identifying evidence. Capture SHALL record each suppressed renderer and terrain with its reason, restore every one after the tile, and fail the tile when restoration cannot be verified.

#### Scenario: Foliage obscures the overworld
- **WHEN** a plan names foliage shader families and terrain trees for suppression
- **THEN** the captured tile preserves static landmarks without the tree canopy
- **AND** the restoration audit lists the suppressed renderers and terrain
- **AND** foliage renders again before the next gameplay frame

#### Scenario: The requested scene differs from gameplay
- **WHEN** capture enters another source scene
- **THEN** native ownership covers the scene transition and capture
- **AND** the sweep ends in its configured known-good scene and position after owned state is cleaned up

#### Scenario: Gameplay lighting inputs differ
- **WHEN** the same area is captured with different native ambient and game-light settings
- **THEN** both captures use the controlled lighting profile and retain legible static landmarks
- **AND** the audit records the original light inputs and their suppression
- **AND** player renderers, owned effects, projectors, and camera highlights do not appear in the capture

#### Scenario: The ambient getter hides Custom-mode state
- **WHEN** capture starts while the ambient getter returns Flat or Trilight coefficients
- **THEN** capture preserves the separate Custom-mode coefficients
- **AND** restoring visible ambient values alone does not establish complete restoration

#### Scenario: A transient changes between readiness observations
- **WHEN** renderers excluded by the capture policy change between observations
- **THEN** those renderers do not keep otherwise stable geometry pending
- **AND** each observation retains their exclusion identities and reasons

#### Scenario: Capture loses its host during preload
- **WHEN** the host disconnects while a multi-frame operation holds geometry
- **THEN** runtime cleanup releases the owned holds and temporary state
- **AND** another operation cannot use that state until cleanup is confirmed
- **AND** the interrupted run does not replace the prior successful artifact set

#### Scenario: Rendering fails after temporary suppression
- **WHEN** a frame-local render fails after changing lighting or renderer visibility
- **THEN** the operation restores those properties before the next gameplay frame
- **AND** restoration does not depend on a later host request

#### Scenario: Capture allocation fails partway through
- **WHEN** allocation fails after creating only some capture resources
- **THEN** native cleanup releases every resource that was allocated
- **AND** existing output and cleanup evidence remain unchanged

#### Scenario: Restoration cannot be observed
- **WHEN** the capture cannot read the restored visual state
- **THEN** the capture remains unsuccessful and records the missing observation
- **AND** it does not substitute the earlier state as evidence of restoration
