## Purpose

Provide recognizable Afallon terrain imagery through reproducible in-game capture, with trustworthy spatial registration and optional illustrated map layers.

## ADDED Requirements

### Requirement: In-game imagery is the primary layer

Each published reachable map SHALL use imagery captured by this project from the supported game build as its default basemap. Outdoor areas and interiors SHALL remain in scope. Illustrated maps SHALL be separate optional orientation layers. Shipped map textures, illustrations, and community map images SHALL NOT substitute for primary imagery or fill missing capture tiles. Missing or failed project captures SHALL block a complete release and appear in coverage reports.

A shipped `MapZone` texture MAY serve as a review reference for framing and cut height, because the game renders its own dungeon maps as top-down terrain images. That comparison SHALL remain review evidence and SHALL NOT enter the published artifact set.

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

### Requirement: A clip height applies only where geometry covers the content

Capture SHALL clip its camera only when observed geometry lies above the content it depicts and would occlude that content. An extent with no such geometry, which is the ordinary outdoor case, SHALL be captured from above without a derived clip height.

Where a clip height is required, capture SHALL derive it from observed content: the highest navigable surface and the highest placement in the extent, plus a recorded margin. The capture artifact SHALL record whether clipping applied, the evidence that required it, the derivation inputs, the resulting height, and the margin. Clipping SHALL exclude geometry through the camera and SHALL NOT disable or delete scene objects.

Renderer names SHALL NOT select ceilings and SHALL NOT decide whether clipping is required. Observed evidence rejects that approach: one cave scene contains renderers named `Massive_Cave_Ceiling_*`, and a reviewed dungeon scene contains no renderer whose name matches ceiling or roof at all.

A scene whose content spans a vertical range too large for one clip height SHALL remain an explicit unresolved capture gap. Capture SHALL NOT silently select a height that hides reachable content.

#### Scenario: An outdoor extent has open sky
- **WHEN** no observed geometry above the content would occlude it
- **THEN** capture renders the extent without a derived clip height
- **AND** the artifact records that clipping did not apply

#### Scenario: A dungeon has a ceiling
- **WHEN** observed geometry above the content covers it
- **THEN** capture derives a clip height and excludes that geometry through the camera
- **AND** the artifact records the evidence and the derived height
- **AND** no scene object is deactivated, deleted, or left modified after the capture

#### Scenario: A cave lies under a hillside
- **WHEN** the clip height derived from all observed content leaves the hillside covering the cave
- **THEN** capture reports an unresolved vertical-extent gap for that scene
- **AND** it does not publish an image that hides the cave

### Requirement: Capture chunks compose into a verified tile pyramid

Capture SHALL render an extent as chunks sized for its resolution, and tile generation SHALL produce the delivery pyramid from those chunks. One image file per map SHALL NOT be a requirement, and neither SHALL one chunk per delivery tile.

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

Capture SHALL prepare the geometry required by each chunk, including streamed objects. Bounds SHALL come from validated spatial evidence, not only marker extents or fixed constants. Every planned chunk SHALL have a captured, verified-empty, or failed result. A timeout or missing streamed source SHALL NOT count as empty terrain.

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
- **WHEN** the game build, geometry coverage, calibration, clip height, or capture profile changes
- **THEN** incompatible chunks are recaptured rather than reused as current output

#### Scenario: Captured imagery and markers belong to different builds
- **WHEN** publication attempts to combine their artifacts
- **THEN** publication fails with the mismatched build identities
