# screenshot-basemaps Specification

## Purpose

Keep captured terrain and game-map imagery tied to verifiable inputs, readiness, and restoration evidence. Preserve usable game-provided maps when optional captured terrain is incomplete.

## Requirements

### Requirement: Capture reuse resolves only registered immutable evidence

A reusable capture checkpoint SHALL match its build, plan tile, reviewed spatial profile, capture settings, and implementation identity. Its image, raster, readiness, visual restoration, native context, streaming cleanup when applicable, and owner cleanup SHALL resolve to verified registered evidence. Reuse SHALL NOT depend on a settings-supplied manifest path or a sweep's temporary directory; a checkpoint SHALL qualify only when its required visual, streaming, and runtime restoration evidence verifies.

#### Scenario: A compatible checkpoint is reused after relocation
- **WHEN** registered capture objects and their run manifests move intact to another store root
- **THEN** a compatible tile remains reusable without the original sweep workspace
- **AND** the consuming run registers the reused identities and the source run manifest

#### Scenario: Cleanup evidence is missing or tampered
- **WHEN** a checkpoint's required cleanup evidence is absent, corrupted, or belongs to another owner
- **THEN** that checkpoint is rejected for reuse
- **AND** metadata alone does not establish successful restoration

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
