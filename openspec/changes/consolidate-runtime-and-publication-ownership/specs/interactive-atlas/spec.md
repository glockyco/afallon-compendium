## Purpose

The interactive atlas keeps navigation, controls, results, and details consistent while readers explore the shared world. Loading and gesture behavior must preserve stable geometry and a controllable camera.

## ADDED Requirements

### Requirement: Consistent atlas navigation state

The atlas SHALL use the same accepted navigation state for controls, results, details, and URL persistence. A pending input or camera timer SHALL NOT restore stale selection, filters, or queries after history navigation. Reader actions SHALL preserve unrelated state unless the action explicitly clears it. Closing details SHALL preserve the existing focus-restoration behavior.

#### Scenario: History navigation overtakes pending input

- **WHEN** a reader navigates backward while a query update is pending
- **THEN** controls, results, details, and the URL reflect the restored history entry
- **AND** the pending update does not overwrite that entry with the previous query or selection

#### Scenario: Selection follows a camera gesture

- **WHEN** a reader selects a placement while camera URL persistence is pending
- **THEN** the camera update preserves the new selection and its detail context
- **AND** selection does not reposition the live camera

#### Scenario: Item context survives source navigation

- **WHEN** a reader selects a source placement from an item result
- **THEN** the map selects that placement and preserves the item context
- **AND** browser history restores the corresponding item, placement, and filter state together

### Requirement: Stable eager geometry readiness

The atlas SHALL load and validate all declared map and geometry parts before it reports map-data readiness. The publication field named `optionalGeometry` SHALL NOT imply deferred network loading. Visibility toggles SHALL use loaded geometry without resource requests or replacement of the publication's placement data.

Search and selected details SHALL retain independent loading and failure states. Geometry failure SHALL produce a map-data failure with a retry path, not a partially interactive map presented as complete. An empty declared geometry list SHALL NOT create a loading dependency.

#### Scenario: Geometry response is delayed

- **WHEN** an essential map part is available but declared geometry is still pending
- **THEN** map data remains in its loading state
- **AND** readiness occurs only after all declared geometry passes validation

#### Scenario: Reader toggles movement and connections

- **WHEN** a reader changes movement or connection visibility after map-data readiness
- **THEN** the atlas uses the loaded geometry without additional data requests
- **AND** the basemap and placement positions remain stable

#### Scenario: Geometry load fails and succeeds on retry

- **WHEN** declared geometry fails to load and a subsequent retry succeeds
- **THEN** the atlas first exposes a map-data error
- **AND** the successful retry makes all declared map geometry available before readiness

#### Scenario: Search response is delayed

- **WHEN** all map geometry is ready but search resources are pending
- **THEN** the map remains usable
- **AND** search reports its own loading state rather than a final empty result

### Requirement: Non-inertial map gestures

The map SHALL stop pan motion when the reader releases the gesture. Mouse, touch, and pinch interaction SHALL retain bounded zoom without momentum-induced overshoot. Authoring drag transitions SHALL NOT re-enable inertia. Live camera updates SHALL NOT rebuild imagery solely to persist URL state.

#### Scenario: Reader releases a pan gesture

- **WHEN** a reader releases a mouse or touch pan gesture
- **THEN** the camera stops without inertial continuation or snapping back
- **AND** imagery remains stable

#### Scenario: Authoring drag returns to navigation

- **WHEN** a reader finishes moving a map in authoring mode and resumes navigation
- **THEN** pan remains non-inertial
- **AND** pinch and wheel zoom remain within the supported bounds
