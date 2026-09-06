## Purpose

Provide recognizable Afallon terrain imagery through reproducible in-game capture, with trustworthy spatial registration and optional illustrated map layers.

## ADDED Requirements

### Requirement: In-game imagery is the primary layer

Each published reachable map SHALL provide captured in-game imagery as its default basemap. Outdoor areas and interiors SHALL remain in scope. Illustrated maps SHALL be optional orientation layers, not a substitute for an incomplete primary capture. Missing captures SHALL block a complete release and appear in coverage reports.

#### Scenario: A map has both image sources
- **WHEN** a reader opens the map without a saved layer choice
- **THEN** the map displays captured in-game terrain
- **AND** the reader can select the illustrated layer without losing map context

### Requirement: Images and markers share explicit registration

Every image layer SHALL identify its map space, world bounds, orientation, resolution, and coordinate transform. Calibration SHALL use known landmarks and round-trip checks. An illustration that distorts physical distances SHALL expose that limitation rather than claim exact registration. Separate floors or overlapping interiors SHALL remain distinguishable.

#### Scenario: Several scenes share a map space
- **WHEN** a reader switches between calibrated image layers
- **THEN** the same selected world location remains selected
- **AND** marker positions use that layer's verified registration

#### Scenario: An illustration lacks valid registration
- **WHEN** the illustration cannot support accurate markers
- **THEN** the interface offers it as a labeled orientation reference without claiming marker precision

### Requirement: Capture waits for relevant geometry

Capture SHALL prepare the geometry required by each tile, including streamed objects. Bounds SHALL come from validated spatial evidence, not only marker extents or fixed constants. Every planned tile SHALL have a captured, verified-empty, or failed result. A timeout or missing streamed source SHALL NOT count as empty terrain.

#### Scenario: A distant structure is initially unloaded
- **WHEN** a tile requires that structure
- **THEN** capture waits for its geometry or reports the tile as failed
- **AND** the run does not silently accept an incomplete image

### Requirement: Capture owns visual settings and restores state

Capture SHALL control and record camera projection, lighting, fog, and transient suppression. It SHALL retain useful static landmarks. It SHALL handle roofs, ceilings, and floors without erasing relevant interior content. On success, error, or cancellation, it SHALL release temporary resources and restore every state it changed. It SHALL NOT overwrite unrelated saves.

Scene loading, preload, readiness checks, and geometry holds MAY span gameplay frames under exclusive runtime ownership. Temporary lighting changes, renderer suppression, and rendering SHALL execute within a frame-local operation. That operation SHALL restore visual state before the next gameplay frame. Multi-frame operations SHALL release their holds and restore owned temporary state on success, error, cancellation, or disconnection. Cleanup SHALL execute in the runtime without depending on a connected host to issue a later restore command. A disconnected run SHALL remain unsuccessful until cleanup is confirmed.

#### Scenario: Capture loses its host during preload
- **WHEN** the host disconnects while a multi-frame operation holds geometry
- **THEN** runtime cleanup releases the owned holds and temporary state
- **AND** another operation cannot use that state until cleanup is confirmed
- **AND** the interrupted run does not replace the prior successful artifact set

#### Scenario: Rendering fails after temporary suppression
- **WHEN** a frame-local render fails after changing lighting or renderer visibility
- **THEN** the operation restores those properties before the next gameplay frame
- **AND** restoration does not depend on a later host request

#### Scenario: Capture is interrupted
- **WHEN** capture fails after it changes rendering state
- **THEN** temporary cameras, lights, and image buffers are released
- **AND** the previous rendering and gameplay state is restored before the run reports completion

#### Scenario: Different gameplay lighting produces the same capture request
- **WHEN** the same tile is captured under the same capture profile from different gameplay lighting states
- **THEN** its terrain remains comparably legible and its bounds remain identical
- **AND** the capture records its visual inputs without promising pixel-identical animation

### Requirement: Tile artifacts are coherent and resumable

The output SHALL include build identity, capture inputs, spatial metadata, tile coordinates, file hashes, and coverage results. Reuse SHALL require compatible inputs and verified file integrity. The tile pyramid SHALL have a single defined finest resolution, explicit empty positions, and no unexplained holes. A failed capture SHALL not replace the last valid artifact set.

#### Scenario: A capture resumes with changed inputs
- **WHEN** the game build, geometry coverage, calibration, or capture profile changes
- **THEN** incompatible tiles are recaptured rather than reused as current output

#### Scenario: Captured imagery and markers belong to different builds
- **WHEN** publication attempts to combine their artifacts
- **THEN** publication fails with the mismatched build identities
