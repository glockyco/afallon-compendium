## ADDED Requirements

### Requirement: Scan extracts entity artwork

A scan target SHALL be able to extract the sprites and textures that the game database references for items, abilities, NPCs, scenes, and regions. Each extracted image SHALL be stored as content-addressed evidence with its native asset name, source entity family and id, pixel dimensions, and the build identity. A sprite that the runtime cannot read SHALL remain an explicit unsupported record, not a missing file. Extraction SHALL NOT alter the running game state beyond the read.

#### Scenario: Item icons are extracted
- **WHEN** the artwork target runs against the supported build
- **THEN** every item with a non-null icon sprite has one extracted PNG with its hash and dimensions
- **AND** an item without a sprite is recorded as having no icon

#### Scenario: Guide artwork is extracted
- **WHEN** a scene or region record references guide artwork
- **THEN** the artwork is extracted with its native asset name
- **AND** the scene or region record references it by content identity

#### Scenario: A sprite is not readable
- **WHEN** the texture is not readable from the runtime
- **THEN** the record states the reason
- **AND** the target does not fail as a whole
