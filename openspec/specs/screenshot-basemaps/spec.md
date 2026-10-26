# screenshot-basemaps Specification

## Purpose

Keep captured terrain and game-map imagery tied to verifiable inputs, readiness, and restoration evidence. Preserve usable game-provided maps when optional captured terrain is incomplete.

## Requirements

### Requirement: Capture reuse resolves only registered immutable evidence

A reusable capture checkpoint SHALL match its build, plan tile, reviewed spatial profile, capture settings, and implementation identity.

#### Scenario: A compatible checkpoint is reused after relocation
- **WHEN** registered capture objects and their run manifests move intact to another store root
- **THEN** a compatible tile remains reusable without the original sweep workspace
- **AND** the consuming run registers the reused identities and the source run manifest

#### Scenario: Cleanup evidence is missing or tampered
- **WHEN** a checkpoint's required cleanup evidence is absent, corrupted, or belongs to another owner
- **THEN** that checkpoint is rejected for reuse
- **AND** metadata alone does not establish successful restoration

#### Scenario: Capture reuse resolves only registered immutable evidence
- **WHEN** A capture checkpoint is evaluated for reuse.
- **THEN** Reuse requires matching build, plan tile, reviewed spatial profile, capture settings, and implementation identity.

### Requirement: Checkpoint evidence resolves to verified registrations

A reusable capture checkpoint's image, raster, readiness, visual restoration, native context, streaming cleanup when applicable, and owner cleanup SHALL resolve to verified registered evidence.

#### Scenario: Checkpoint evidence resolves to verified registrations
- **WHEN** A reusable capture checkpoint with applicable streaming cleanup is resolved.
- **THEN** Its image, raster, readiness, visual restoration, native context, streaming cleanup, and owner cleanup resolve to verified registered evidence.

### Requirement: Reuse is independent of supplied manifest paths and temporary directories

Reuse SHALL NOT depend on a settings-supplied manifest path or a sweep's temporary directory.

#### Scenario: Reuse is independent of supplied manifest paths and temporary directories
- **WHEN** A checkpoint is evaluated for reuse without a settings-supplied manifest path or the sweep's temporary directory.
- **THEN** The absence of those paths does not prevent reuse.

### Requirement: Reuse requires verified restoration evidence

A checkpoint SHALL qualify only when its required visual, streaming, and runtime restoration evidence verifies.

#### Scenario: Reuse requires verified restoration evidence
- **WHEN** A checkpoint's required runtime restoration evidence does not verify.
- **THEN** The checkpoint does not qualify for reuse.

### Requirement: Capture failures cannot select partial imagery

Capture and pyramid generation SHALL record outputs through artifact runs and SHALL select a successful reference only after their run completes. A capture run SHALL record each planned tile's captured, verified-empty, or failed outcome where it can retain its failure evidence. A failed capture or pyramid run SHALL leave an existing successful imagery reference unchanged, with registered diagnostics retained in the failed run.

#### Scenario: Streaming preparation fails before rendering
- **WHEN** streaming readiness fails after acquiring owned holds
- **THEN** cleanup releases owned holds and records the restoration outcome when available
- **AND** a tile without verified rendering and cleanup is recorded as failed rather than verified-empty or captured

#### Scenario: Pyramid construction is interrupted
- **WHEN** a pyramid run stops before its required resources verify
- **THEN** its partial resources are not selected as successful imagery
- **AND** the previously selected successful pyramid remains available

### Requirement: Common lifecycle preserves imagery product policy

Captured terrain SHALL be limited to the reviewed overworld map space and SHALL use raster registration on a single map plane; game-provided imagery SHALL be the default published map layer. Reviewed delivery extents SHALL limit published imagery. Captured terrain SHALL remain opt-in, and incomplete optional captures SHALL NOT establish complete capture coverage or prevent publication when game-map coverage satisfies the applicable gate.

#### Scenario: Optional captured terrain is incomplete
- **WHEN** a map has verified game-provided imagery and incomplete optional captured terrain
- **THEN** publication uses the game-provided map as its default layer when the applicable coverage gate passes
- **AND** capture coverage remains incomplete without enabling captured terrain by default

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

Capture SHALL render every tile with the camera frame its plan declares, as one frame, and SHALL NOT slice, cut, or composite along any surface.

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

#### Scenario: Capture renders each tile with its declared frame
- **WHEN** Capture renders a tile whose plan declares a camera frame.
- **THEN** The tile is rendered as one frame using the declared camera frame, without slicing, cutting, or compositing along any surface.

### Requirement: Capture respects world and interior map boundaries

Only the world surface SHALL be captured. Each interior SHALL publish the map the game draws for it.

#### Scenario: Capture respects world and interior map boundaries
- **WHEN** Capture processes the world and an interior.
- **THEN** Only the world surface is captured, and the interior publishes the map the game draws for it.

### Requirement: Cited navigation surveys determine observation position

A capture plan MAY cite the hashed navigation survey of its scene. When it does, capture SHALL stand the player on the walkable point nearest the map's centre before observing.

#### Scenario: Cited navigation surveys determine observation position
- **WHEN** Capture observes a scene whose plan cites a hashed navigation survey.
- **THEN** Before observing, capture stands the player on the walkable point nearest the map's centre.

### Requirement: Cited survey hashes participate in tile compatibility

When a capture plan cites the hashed navigation survey of its scene, the survey hash SHALL be part of every tile's compatibility key.

#### Scenario: Cited survey hashes participate in tile compatibility
- **WHEN** A capture plan cites a hashed navigation survey and tile compatibility keys are formed.
- **THEN** Every tile's compatibility key includes the survey hash.

### Requirement: Terrain switching requires per-tile readiness

The game switches a terrain's objects off unless the player stands inside that terrain. When one observation of the whole map leaves such switched-off loaders inside its envelope, or loses a required source to that switch during its stream visit, capture SHALL observe each tile under its own readiness so the artifact records exactly what that tile's frame saw.

#### Scenario: Terrain switching requires per-tile readiness
- **WHEN** One observation of the whole map loses a required source to terrain switching during its stream visit.
- **THEN** Capture observes each tile under its own readiness so the artifact records exactly what that tile's frame saw.

### Requirement: Game-switched loaders are not restoration leaks

A loader the game switched off during a visit SHALL NOT count as a restoration leak.

#### Scenario: Game-switched loaders are not restoration leaks
- **WHEN** The game switches a loader off during a visit.
- **THEN** The switched-off loader does not count as a restoration leak.
### Requirement: Capture chunks compose into a verified tile pyramid

Capture SHALL render an extent as chunks sized for its resolution, and tile generation SHALL produce the delivery pyramid from those chunks.

#### Scenario: An extent needs several chunks
- **WHEN** its resolution exceeds one practical render target
- **THEN** capture renders adjacent chunks with a shared pixel density
- **AND** their pixel-edge transforms meet without a gap or an extra Y reversal
- **AND** tile generation produces one pyramid with a single finest level

#### Scenario: Capture chunks compose into a verified tile pyramid
- **WHEN** An extent is captured as several chunks.
- **THEN** Tile generation produces the delivery pyramid from those resolution-sized chunks.

### Requirement: Delivery tile coordinates

Delivery tiles SHALL use `tileSize: 256`, global integer `(x, y)` indices, and `z` values where each tile covers `[x·256/2^z, (x+1)·256/2^z] × [y·256/2^z, (y+1)·256/2^z]` world units.

#### Scenario: Delivery tile coordinates
- **WHEN** A delivery tile is emitted at global index (2, 3) and z = 1.
- **THEN** The tile uses tileSize 256 and covers [256, 384] × [384, 512] world units.

### Requirement: Contiguous pyramid zoom levels

Zoom levels SHALL run contiguously from `minZoom` through `maxZoom`, with `maxZoom = log2(1024 / captureEdge)`.

#### Scenario: Contiguous pyramid zoom levels
- **WHEN** A pyramid has minZoom 0 and captureEdge 256.
- **THEN** The pyramid contains zoom levels 0, 1, and 2.

### Requirement: Coarser tile parent merges

Each coarser level SHALL be formed by a 2×2 parent merge.

#### Scenario: Coarser tile parent merges
- **WHEN** Tile generation forms a coarser level.
- **THEN** The coarser level is formed by 2×2 parent merges.

### Requirement: Top-edge pixel origin

Pixel row zero SHALL be the top edge.

#### Scenario: Top-edge pixel origin
- **WHEN** A capture tile's pixel rows are interpreted.
- **THEN** Pixel row zero corresponds to its top edge.

### Requirement: Finest extent from emitted tiles

The finest extent SHALL be the union of emitted finest tiles.

#### Scenario: Finest extent from emitted tiles
- **WHEN** The finest tiles have been emitted.
- **THEN** The finest extent equals the union of those tiles.

### Requirement: No single-image or chunk-to-tile requirement

One image file per map SHALL NOT be a requirement, and neither SHALL one chunk per delivery tile.

#### Scenario: No single-image or chunk-to-tile requirement
- **WHEN** A map uses multiple image files and its capture chunks do not correspond one-to-one with delivery tiles.
- **THEN** Those choices alone do not violate the capture requirements.

### Requirement: Explicit capture tile availability positions

The publication SHALL retain explicit positions for available and missing capture tiles.

#### Scenario: Explicit capture tile availability positions
- **WHEN** A publication contains available and missing capture tiles.
- **THEN** Explicit positions are retained for both available and missing capture tiles.

### Requirement: Optional terrain does not block verified maps

Optional captured terrain is not a complete-coverage claim and SHALL NOT prevent publication of a verified game-provided map.

#### Scenario: Optional terrain does not block verified maps
- **WHEN** A verified game-provided map is ready and optional captured terrain has incomplete coverage.
- **THEN** The optional terrain does not prevent publication and does not constitute a complete-coverage claim.

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

Capture SHALL prepare the geometry required by each chunk, including streamed objects.

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

#### Scenario: Capture waits for relevant geometry
- **WHEN** A chunk requires streamed object geometry.
- **THEN** Capture prepares that geometry for the chunk.

### Requirement: Spatial evidence for capture bounds

Bounds SHALL come from validated spatial evidence, not only marker extents or fixed constants.

#### Scenario: Spatial evidence for capture bounds
- **WHEN** Capture bounds are determined.
- **THEN** The bounds come from validated spatial evidence rather than only marker extents or fixed constants.

### Requirement: Complete rectangular grid emission

A reviewed rectangular capture grid SHALL emit every cell in that rectangle. An empty placement cell SHALL NOT create a hole in otherwise continuous imagery.

#### Scenario: Complete rectangular grid emission
- **WHEN** A reviewed rectangular capture grid includes an empty placement cell in otherwise continuous imagery.
- **THEN** Every cell is emitted, including the empty placement cell, without a hole in the imagery.

### Requirement: Explicit planned chunk results

Every planned chunk SHALL have a captured, verified-empty, or failed result.

#### Scenario: Explicit planned chunk results
- **WHEN** A capture run finishes processing its planned chunks.
- **THEN** Every planned chunk has a captured, verified-empty, or failed result.

### Requirement: Timeouts and missing sources are not emptiness

A timeout or missing streamed source SHALL NOT count as empty terrain.

#### Scenario: Timeouts and missing sources are not emptiness
- **WHEN** A chunk times out or a required streamed source is missing.
- **THEN** The condition is not counted as empty terrain.

### Requirement: Complete frustum source selection

Required source selection SHALL cover the complete chunk frustum and its configured boundary overlap.

#### Scenario: Complete frustum source selection
- **WHEN** Required sources are selected for a chunk with configured boundary overlap.
- **THEN** The selection covers the entire chunk frustum and that overlap.

### Requirement: Retained geometry readiness evidence

Capture SHALL retain inactive-source exclusions, exact loaded-root and handle state, and stable geometry observations from distinct native frames.

#### Scenario: Retained geometry readiness evidence
- **WHEN** Capture observes geometry readiness across distinct native frames.
- **THEN** Capture retains inactive-source exclusions, exact loaded-root and handle state, and stable geometry observations from those frames.

### Requirement: Combined availability is not readiness

A combined loaded-or-loading flag SHALL NOT establish readiness.

#### Scenario: Combined availability is not readiness
- **WHEN** A source reports only a combined loaded-or-loading flag.
- **THEN** That flag does not establish readiness.

### Requirement: Chunk deadline includes render and restoration

The chunk deadline SHALL include rendering and hold restoration.

#### Scenario: Chunk deadline includes render and restoration
- **WHEN** A chunk's deadline is evaluated.
- **THEN** Rendering and hold restoration are included in the deadline.
### Requirement: Capture owns visual settings and restores state

Capture SHALL control and record camera projection, lighting, fog, and transient suppression.

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

#### Scenario: Capture owns visual settings and restores state
- **WHEN** Capture configures a render.
- **THEN** Capture controls and records camera projection, lighting, fog, and transient suppression.

### Requirement: Preserve useful static landmarks

Capture SHALL retain useful static landmarks.

#### Scenario: Preserve useful static landmarks
- **WHEN** Capture renders an area containing useful static landmarks.
- **THEN** The captured imagery retains those landmarks.

### Requirement: Capture resource and state cleanup

On success, error, or cancellation, capture SHALL release temporary resources and restore every state it changed.

#### Scenario: Capture resource and state cleanup
- **WHEN** Capture ends in error after allocating temporary resources and changing state.
- **THEN** Capture releases its temporary resources and restores every state it changed.

### Requirement: Protect unrelated saves

Capture SHALL NOT overwrite unrelated saves.

#### Scenario: Protect unrelated saves
- **WHEN** Capture runs while unrelated saves exist.
- **THEN** Those saves are not overwritten.

### Requirement: Frame-local visual operations

Temporary lighting changes, renderer suppression, and rendering SHALL execute within a frame-local operation. That operation SHALL restore visual state before the next gameplay frame.

#### Scenario: Frame-local visual operations
- **WHEN** A frame-local capture operation changes lighting, suppresses renderers, and renders.
- **THEN** Those actions execute within that operation, which restores visual state before the next gameplay frame.

### Requirement: Multi-frame operation cleanup

Scene loading, preload, readiness checks, and geometry holds MAY span gameplay frames under exclusive runtime ownership. Multi-frame operations SHALL release their holds and restore owned temporary state on success, error, cancellation, or disconnection.

#### Scenario: Multi-frame operation cleanup
- **WHEN** A multi-frame operation is cancelled while holding geometry and owning temporary state.
- **THEN** The operation releases its holds and restores its owned temporary state.

### Requirement: Runtime-independent cleanup

Cleanup SHALL execute in the runtime without depending on a connected host to issue a later restore command.

#### Scenario: Runtime-independent cleanup
- **WHEN** Cleanup is needed after the host disconnects.
- **THEN** The runtime executes cleanup without a later restore command from the host.

### Requirement: Disconnected run cleanup confirmation

A disconnected run SHALL remain unsuccessful until cleanup is confirmed.

#### Scenario: Disconnected run cleanup confirmation
- **WHEN** A run disconnects and cleanup has not been confirmed.
- **THEN** The run remains unsuccessful.

### Requirement: Controlled capture lighting

Capture SHALL exclude active game lights from rendering and use its controlled lighting profile.

#### Scenario: Controlled capture lighting
- **WHEN** Capture renders a scene with active game lights.
- **THEN** Active game lights are excluded and the controlled lighting profile is used.

### Requirement: Preserve meshes and landmark particles outside suppression

Capture SHALL preserve useful static meshes and landmark particles outside the reviewed suppression selection.

#### Scenario: Preserve meshes and landmark particles outside suppression
- **WHEN** Useful static meshes and landmark particles are outside the reviewed suppression selection.
- **THEN** Capture preserves those meshes and particles.

### Requirement: Consistent transient readiness selection

Geometry readiness SHALL use the same transient selection as rendering and record its exclusions.

#### Scenario: Consistent transient readiness selection
- **WHEN** Geometry readiness is evaluated for a render with transient suppression.
- **THEN** Readiness uses rendering's transient selection and records its exclusions.

### Requirement: Reviewed suppression policy evidence

The capture plan SHALL carry a reviewed suppression policy: shader-name prefixes whose renderers hide during capture, and whether terrain-instanced trees and details hide. The game marks foliage with no layer or tag, so the shader family is the identifying evidence.

#### Scenario: Reviewed suppression policy evidence
- **WHEN** A capture plan specifies foliage suppression.
- **THEN** The plan carries a reviewed policy naming renderer shader-name prefixes and whether terrain-instanced trees and details hide, using shader family as foliage-identifying evidence.

### Requirement: Suppression audit records

Capture SHALL record each suppressed renderer and terrain with its reason.

#### Scenario: Suppression audit records
- **WHEN** Capture suppresses a renderer and terrain.
- **THEN** Capture records each suppressed renderer and terrain with its reason.

### Requirement: Verified per-tile suppression restoration

Capture SHALL restore every suppressed renderer and terrain after the tile, and fail the tile when restoration cannot be verified.

#### Scenario: Verified per-tile suppression restoration
- **WHEN** A tile finishes after suppressing renderers and terrain, but restoration cannot be verified.
- **THEN** Capture restores every suppressed renderer and terrain after the tile and fails the tile because restoration cannot be verified.
