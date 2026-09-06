## Purpose

Produce reproducible Afallon world data that distinguishes authored content, conditions, and observations while accounting for extraction coverage.

## ADDED Requirements

### Requirement: Build-scoped reproducible snapshots

The tooling SHALL accept explicit game, endpoint, and output locations. Each snapshot SHALL identify the Steam build, relevant input hashes, extractor version, schema version, and extraction settings. Raw evidence and generated files SHALL remain outside source control. A failed run SHALL preserve diagnostics without replacing the last successful snapshot.

#### Scenario: Failed extraction preserves published input
- **WHEN** a required extraction step fails after an earlier snapshot succeeded
- **THEN** the earlier snapshot remains available
- **AND** the failed run reports its source build and failure without claiming success

### Requirement: Complete coverage accounting

The extractor SHALL inventory build scenes, database scene records, discovered scene references, and streamed content sources. It SHALL assign every discovered source a captured, unreachable, unused, unsupported, or failed disposition with evidence. It SHALL distinguish active, inactive, conditional, and generated content. A release described as complete SHALL have no unresolved reachable source or relevant content family.

#### Scenario: Active objects omit authored content
- **WHEN** an inactive or unloaded source contains relevant placements
- **THEN** the extractor includes those authored placements or reports the unresolved source
- **AND** it does not report an active-object scan as complete coverage

#### Scenario: A scene record is not reachable
- **WHEN** a database scene has no verified reachable counterpart
- **THEN** the coverage report records its identity and evidence for its disposition
- **AND** it does not invent a public map for that record

### Requirement: Separate spatial identities and observations

The snapshot SHALL distinguish canonical entities, source scenes, rendered map spaces, authored placements or producers, and observed instances. Distinct placements SHALL retain distinct identities even when they share an entity. Identities SHALL remain stable across equivalent extractions of the same build. Unproven cross-build identity matches SHALL remain explicit rather than silently merged.

#### Scenario: Multiple spawn areas share one NPC
- **WHEN** two producers reference the same NPC template
- **THEN** both placements reference one canonical NPC and retain separate spatial identities
- **AND** each retains its candidate, area, count, and condition data

#### Scenario: A producer creates a temporary resource
- **WHEN** a resource node changes with player skill or proximity
- **THEN** the authored producer and its possible outputs remain available independently of the current live node
- **AND** the current observation does not replace the authored rule

### Requirement: Afallon-specific content and roles

The snapshot SHALL cover enemies, bosses, friendly NPC services, resources, containers, useful interactions, quest locations, and transitions where these exist in the supported build. It SHALL retain multiple roles on one placement and deduplicate components that describe the same interaction. Component names alone SHALL NOT determine player-facing categories.

#### Scenario: One producer supports several gathering skills
- **WHEN** a resource producer references a gathering skill
- **THEN** its category follows the referenced skill and output semantics rather than the producer class name

#### Scenario: One NPC has several services
- **WHEN** an NPC sells items and offers quests
- **THEN** the snapshot preserves both roles without inventing duplicate physical NPCs

### Requirement: Linked facts retain conditions and provenance

The snapshot SHALL resolve NPC loot, vendor stock and currency costs, resource yields, quest associations, and transition destinations. Relationships SHALL retain source identity, requirements, quantity ranges, and rule structure. Unverified probability semantics SHALL NOT become player-facing percentages. Dynamic loot rules SHALL remain explicit until their outputs can be resolved correctly.

#### Scenario: Vendor stock depends on progression
- **WHEN** a vendor references several stock tables with different requirements
- **THEN** each stock entry retains the requirement of its source table
- **AND** the extractor does not flatten all entries into unconditional stock

#### Scenario: Loot uses nested rules
- **WHEN** an NPC references a loot table with its own rate and selection controls
- **THEN** the snapshot preserves both relationship levels and controls
- **AND** a publication step rejects any unsupported claim of an effective drop percentage

### Requirement: Integrity gates protect publication

Publication SHALL reject unresolved required references, duplicate placement identities, mismatched game builds, and placements outside their declared spatial coverage. Deliberate exclusions SHALL appear in a machine-readable report with their reasons. Repeated runs SHALL not create duplicate placements.

#### Scenario: A marker has no valid map coverage
- **WHEN** a placement cannot resolve a map space or lies outside validated bounds
- **THEN** publication fails with the placement and source identities
- **AND** it does not silently discard or clamp the marker
