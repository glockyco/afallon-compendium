## Purpose

Keep capture checkpoints and image pyramids reusable through immutable evidence references without weakening readiness, registration, or restoration guarantees.

## ADDED Requirements

### Requirement: Capture reuse resolves only registered immutable evidence

A reusable capture SHALL identify its plan, reviewed spatial inputs, build, implementation, readiness evidence, raster, image, and cleanup evidence through verified registered references. Reuse SHALL NOT depend on an arbitrary manifest path from settings or a deleted sweep directory. A checkpoint SHALL become reusable only after required visual and streaming restoration succeeds.

#### Scenario: A compatible checkpoint is reused after relocation
- **WHEN** verified capture objects move with their manifests to a different store root
- **THEN** compatible tiles remain reusable without the original sweep path
- **AND** the new run records the reused identities and source run

#### Scenario: Cleanup evidence is missing or tampered
- **WHEN** a checkpoint's cleanup evidence is absent or fails hash or owner verification
- **THEN** the checkpoint is not reusable
- **AND** the pipeline does not manufacture successful restoration from its metadata

### Requirement: Capture failures cannot select partial imagery

Capture and pyramid outputs SHALL use the common run lifecycle. Each planned chunk SHALL retain its captured, verified-empty, or failed result. Failure before or after rendering SHALL preserve the previous successful imagery reference and all available attributed diagnostics.

#### Scenario: Streaming preparation fails before rendering
- **WHEN** source preparation acquires holds and then fails
- **THEN** owned cleanup releases those holds and records the restoration outcome
- **AND** the failed chunk does not become an empty or successful image

#### Scenario: Pyramid construction is interrupted
- **WHEN** a run stops before all required pyramid resources verify
- **THEN** its partial resources remain unselected evidence
- **AND** the previous successful imagery set remains usable

### Requirement: Common lifecycle preserves imagery product policy

The lifecycle cutover SHALL preserve single-plane registration, explicit reviewed clipping, game-provided default imagery, and opt-in captured terrain. Captures SHALL remain limited to the overworld. Missing optional captures SHALL NOT block a verified game-map publication or become proof that capture coverage is complete.

#### Scenario: Optional captured terrain is incomplete
- **WHEN** a map has verified game imagery and incomplete optional capture evidence
- **THEN** the game-map publication remains eligible under its coverage policy
- **AND** capture diagnostics remain incomplete without enabling captured terrain by default
