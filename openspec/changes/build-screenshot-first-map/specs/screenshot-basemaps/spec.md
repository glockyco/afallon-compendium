## Purpose

Provide recognizable Afallon terrain imagery through reproducible in-game capture, with trustworthy spatial registration and optional illustrated map layers.

## ADDED Requirements

### Requirement: In-game imagery is the primary layer

Each published reachable map SHALL carry imagery captured by this project from the supported game build. The world surface and zones SHALL remain in scope. Missing or failed project captures SHALL block a complete release and appear in coverage reports. Community map images SHALL NOT substitute for that imagery or fill missing capture tiles.

Where the game ships its own map for a zone as a `MapZone` texture, the publication SHALL also carry that texture as a calibrated layer registered through the game's own world-to-map conversion, dumped from the running game at the supported build. That layer is what a player already knows, so the atlas SHALL open an interior on its game map with captured screenshots as a toggle, and SHALL open the world surface on both. A game map SHALL NOT count toward capture coverage.

#### Scenario: A zone ships its own map
- **WHEN** a scene carries a `MapZone` with a texture
- **THEN** the publication carries that texture as a calibrated pyramid registered by the zone's own conversion
- **AND** the atlas opens that map on the game map with captured imagery available as a layer

#### Scenario: A zone reuses another zone's texture
- **WHEN** a scene's `MapZone` names a texture the game also shows for another zone
- **THEN** the publication carries it as the game shows it and records the shared texture name

#### Scenario: A map has both image sources
- **WHEN** a reader opens the map without a saved layer choice
- **THEN** the map displays captured in-game terrain
- **AND** the reader can select the illustrated layer without losing map context

#### Scenario: Only an existing map image is available
- **WHEN** an illustration or shipped map texture exists but the project capture is missing or failed
- **THEN** primary imagery coverage remains pending or failed
- **AND** the existing image is not used as the default basemap or a replacement capture tile
- **AND** the complete-release gate rejects the incomplete map

### Requirement: Each map is one horizontal plane

Every map SHALL have exactly one image plane per layer. Capture SHALL NOT produce floor slices, and the published artifact SHALL NOT expose floor membership, floor selection, or per-floor imagery. Vertically stacked content SHALL project onto that single plane, matching the game, which ships one map texture for each `MapZone` including its multi-level dungeons.

Overlapping markers from stacked content SHALL remain distinct records at their own coordinates. The published artifact SHALL retain each placement's world height as an ordinary field. That field SHALL NOT select an image layer.

#### Scenario: A dungeon has stacked walkable levels
- **WHEN** capture renders that dungeon
- **THEN** it produces one image plane covering the whole dungeon
- **AND** placements on different levels keep their own coordinates and heights on that plane

#### Scenario: Two placements project onto the same point
- **WHEN** a placement on an upper level shares its horizontal position with one below
- **THEN** both remain separately selectable records
- **AND** the atlas does not merge, hide, or displace either one

### Requirement: A cut follows the walkable surface

Capture SHALL NOT cut by default. An extent without a reviewed cut SHALL be captured with the camera frame its plan declares, which is the ordinary case and covers every world surface extent.

A capture plan MAY carry a reviewed cut for a map whose content is covered by geometry above it. The cut SHALL cite the hashed navigation survey of the map's scene and declare a slice step, a headroom, and the camera height above the top slice. For each tile, capture SHALL rasterize the highest walkable height under every pixel from that survey, fill pixels without walkable surface from their nearest walkable neighbour, render one slice per step across the tile's walkable range in one frame-local operation, and compose each pixel from the first slice whose cut sits at or above that pixel's walkable height plus headroom. The tile image SHALL be that composite. The artifact SHALL record the walkable range, the slice heights, and the survey hash, and SHALL retain every slice with its hash. A cut SHALL NOT disable or delete scene objects. Capture SHALL NOT use one height for a whole map, because a dungeon's walkable surface spans more than a hundred units inside one tile.

#### Scenario: An extent needs no cut
- **WHEN** its plan declares no reviewed cut
- **THEN** capture renders it with the plan's camera frame as one slice
- **AND** the artifact records a null cut

#### Scenario: Ledges and floor share one tile
- **WHEN** a dungeon tile's walkable surface spans from its floor to a ledge far above
- **THEN** the composite shows the floor under the low cut and the ledge under the high cut
- **AND** no ceiling above either surface appears
- **AND** the raster records every slice height and the walkable range

#### Scenario: A cut survey changes
- **WHEN** the cited navigation survey's hash changes
- **THEN** every tile of that map is recaptured rather than reused

### Requirement: Capture chunks compose into a verified tile pyramid

Capture SHALL render an extent as chunks sized for its resolution, and tile generation SHALL produce the delivery pyramid from those chunks. Delivery tiles SHALL use `tileSize: 256`, global integer `(x, y)` indices, and `z` values where each tile covers `[x·256/2^z, (x+1)·256/2^z] × [y·256/2^z, (y+1)·256/2^z]` world units. Zoom levels SHALL run contiguously from `minZoom` through `maxZoom`, with `maxZoom = log2(1024 / captureEdge)` and each coarser level formed by a 2×2 parent merge. Pixel row zero SHALL be the top edge, and the finest extent SHALL be the union of emitted finest tiles. One image file per map SHALL NOT be a requirement, and neither SHALL one chunk per delivery tile.

Every published marker position SHALL sample primary imagery that is present and non-blank at the finest level. A marker over absent or blank imagery SHALL fail tile generation or publication rather than reach a reader.

#### Scenario: An extent needs several chunks
- **WHEN** its resolution exceeds one practical render target
- **THEN** capture renders adjacent chunks with a shared pixel density
- **AND** their pixel-edge transforms meet without a gap or an extra Y reversal
- **AND** tile generation produces one pyramid with a single finest level

#### Scenario: A marker has no terrain beneath it
- **WHEN** a published placement samples a blank or absent finest-level pixel
- **THEN** the run reports that placement and its sampled position
- **AND** publication rejects the artifact set

### Requirement: Images and markers share explicit registration

Every image layer SHALL identify its map, world bounds, orientation, resolution, and coordinate transform. Calibration SHALL use known landmarks and round-trip checks. An illustration that distorts physical distances SHALL expose that limitation rather than claim exact registration.

#### Scenario: A native projection contradicts the image extent
- **WHEN** the native center or corner controls differ from the declared raster mapping by more than one quarter pixel
- **THEN** capture fails instead of registering that PNG as a valid tile

#### Scenario: Several scenes share a map
- **WHEN** a reader switches between calibrated image layers
- **THEN** the same selected world location remains selected
- **AND** marker positions use that layer's verified registration

#### Scenario: An illustration lacks valid registration
- **WHEN** the illustration cannot support accurate markers
- **THEN** the interface offers it as a labeled orientation reference without claiming marker precision

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

#### Scenario: Foliage covers a dungeon floor
- **WHEN** a plan names the foliage shader families and terrain trees for suppression
- **THEN** the captured tile shows the floor and rock walls without tree canopy
- **AND** the restoration audit lists every suppressed renderer and terrain with its reason
- **AND** the scene's foliage renders again before the next gameplay frame

#### Scenario: The requested scene differs from gameplay
- **WHEN** capture enters another source scene
- **THEN** native ownership covers the scene transition and capture
- **AND** success requires restoration of the original scene, position, and rotation

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

### Requirement: Tile artifacts are coherent and resumable

The output SHALL include build identity, capture inputs, spatial metadata, tile coordinates, file hashes, and coverage results. Reuse SHALL require compatible inputs and verified file integrity. The tile pyramid SHALL have a single defined finest resolution, explicit empty positions, and no unexplained holes. A failed capture SHALL not replace the last valid artifact set.

#### Scenario: A capture resumes with changed inputs
- **WHEN** the game build, geometry coverage, calibration, cut survey, suppression, or capture profile changes
- **THEN** incompatible chunks are recaptured rather than reused as current output

#### Scenario: Captured imagery and markers belong to different builds
- **WHEN** publication attempts to combine their artifacts
- **THEN** publication fails with the mismatched build identities
