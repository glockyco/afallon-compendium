## ADDED Requirements

### Requirement: Database-wide artwork is collected once per update scan

A scan plan SHALL name at most one artwork target, and only that target SHALL collect the build's database artwork. Every other target of the plan SHALL skip artwork collection, and a plan that names no artwork target SHALL collect no artwork. The artwork target SHALL be one of the plan's targets. Catalog assembly SHALL require artwork evidence from its canonical target and SHALL fail with the target identity when that target has none.

#### Scenario: A shard of scene targets is scanned
- **WHEN** a scan plan lists eight scene targets and names no artwork target
- **THEN** no target of the run collects artwork
- **AND** every target still collects its scene, producer, placement, relationship, and spatial evidence

#### Scenario: The canonical scene is scanned
- **WHEN** a scan plan names `build-scene:44` as its artwork target
- **THEN** only that target collects and registers the build's artwork

#### Scenario: A plan names an artwork target outside its targets
- **WHEN** a scan plan names an artwork target that none of its targets has
- **THEN** the plan is rejected before the game is touched

#### Scenario: The canonical target has no artwork
- **WHEN** a catalog plan names a canonical target whose scan collected no artwork
- **THEN** catalog assembly fails and names the canonical target
- **AND** no catalog is selected without artwork
