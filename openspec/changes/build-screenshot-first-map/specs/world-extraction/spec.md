## Purpose

Produce reproducible Afallon world data that distinguishes authored content, conditions, and observations while accounting for extraction coverage.

## ADDED Requirements

### Requirement: Build-scoped reproducible snapshots

The tooling SHALL accept explicit game, endpoint, and output locations. Each snapshot SHALL identify the Steam build, relevant input hashes, extractor version, schema version, and extraction settings. Raw evidence and generated files SHALL remain outside source control. A failed run SHALL preserve diagnostics without replacing the last successful snapshot.

#### Scenario: Failed extraction preserves published input
- **WHEN** a required extraction step fails after an earlier snapshot succeeded
- **THEN** the earlier snapshot remains available
- **AND** the failed run reports its source build and failure without claiming success

#### Scenario: Authored world probes join a validated snapshot
- **WHEN** the normal extraction command collects canonical records and authored world content
- **THEN** one run includes NPC producers, world sources, and inventory artifacts with their schemas, source counts, and canonical references checked
- **AND** each observation retains its scene and character context without claiming simultaneous collection across runtime calls
- **AND** failure of any required probe preserves the previous successful snapshot

### Requirement: Exclusive runtime orchestration

One host operation SHALL own runtime access for extraction, traversal, or capture. Competing operations SHALL NOT displace that owner. Cancellation and disconnection SHALL terminate or clean up owned runtime work before another operation uses the affected state. Unconfirmed cleanup SHALL block further state-changing work and SHALL NOT produce a successful run.

#### Scenario: A second operation requests the runtime
- **WHEN** another operation already owns the runtime
- **THEN** the second operation waits or receives an explicit busy result without replacing the active session
- **AND** its artifacts cannot be attributed to the active operation

### Requirement: Complete coverage accounting

The extractor SHALL inventory build scenes, database scene records, discovered scene references, and streamed content sources. Each discovered source SHALL retain evidence for reachability, runtime availability, extraction status, and imagery status as separate fields. Reachability SHALL distinguish unknown, reachable, unreachable, and unused sources. Extraction SHALL distinguish pending, extracted, unsupported, and failed sources. Imagery SHALL distinguish pending, captured, validated, failed, and evidence-backed not-applicable states.

Runtime availability SHALL retain activation state separately from unloaded, loading, loaded, or unknown load state. A combined loaded-or-loading observation SHALL NOT establish readiness.

The ledger SHALL retain conditional and generated content and group diagnostics by source and issue type. Repeated diagnostics SHALL NOT inflate distinct missing-source counts. Unset fields SHALL remain distinct from failed references and unverified semantics. A release described as complete SHALL have no unresolved reachable source or relevant content family. Pending discovery or classification SHALL NOT count as complete coverage.

#### Scenario: Active objects omit authored content
- **WHEN** an inactive or unloaded source contains relevant placements
- **THEN** the extractor includes those authored placements or reports the unresolved source
- **AND** it does not report an active-object scan as complete coverage

#### Scenario: A scene record is not reachable
- **WHEN** a database scene has no verified reachable counterpart
- **THEN** the coverage report records its identity and evidence for its disposition
- **AND** it does not invent a public map for that record

#### Scenario: Role resolution retains gaps
- **WHEN** extracted source roles remain unresolved or lack a verified placement
- **THEN** the coverage summary reports blocked role resolution
- **AND** it binds issue and unplaced-source counts to the hashed role artifact
- **AND** role issue occurrences do not inflate raw distinct diagnostic-source counts

#### Scenario: Nested actions mix known and unresolved behavior
- **WHEN** template or inline GameActions contain a supported teleport and an unresolved sibling action
- **THEN** the source retains its transition role and condition evidence
- **AND** the unresolved sibling remains a coverage blocker
- **AND** the exported action lists preserve template-then-inline execution order

#### Scenario: Nested actions have no supported destination
- **WHEN** a GameActions payload is empty or contains only an unresolved Target teleport
- **THEN** the source retains an explicit role issue
- **AND** it does not receive an inferred transition role

### Requirement: Native spatial calibration evidence

The extractor SHALL retain exact scene-binding candidates and native coordinate registration independently from rendered map spaces. Missing or ambiguous scene bindings SHALL remain explicit. Registration SHALL use native sample results and record residuals. Contradictory, singular, or non-horizontal samples SHALL remain unresolved.

Geometry observations SHALL retain query scope and world Y coordinates. Navigation triangles SHALL NOT establish complete playable coverage, exact grounding heights, or floor ownership. Snapshot inputs SHALL include the native engine hash used by the geometry binding.

#### Scenario: A database name matches multiple build scenes
- **WHEN** an exact database entry name matches multiple Unity build-path basenames
- **THEN** the catalog retains every candidate and marks the binding ambiguous
- **AND** it does not select a build scene from record order

#### Scenario: Native map samples contradict a fitted transform
- **WHEN** a world sample or native normalized round trip exceeds the registration tolerance
- **THEN** registration remains unresolved with a diagnostic
- **AND** it does not clamp coordinates or substitute database map bounds

#### Scenario: Navigation geometry covers unrelated elevations
- **WHEN** loaded navigation data includes multiple elevations or geometry outside verified gameplay landmarks
- **THEN** the snapshot retains that geometry and its observation scope
- **AND** its combined bounds do not become validated screenshot bounds or floor assignments

### Requirement: Reviewed map-space and floor membership

The extractor SHALL retain reviewed map-space profiles separately from native MapZone registrations and capture bounds. Profiles SHALL bind exact source-scene IDs and paths to coordinate frames, membership domains, and optional floor domains. The extractor SHALL verify referenced review evidence hashes and JSON pointers. Missing profiles, unmatched domains, ambiguous floors, and contradictory scene bindings SHALL remain explicit.

#### Scenario: Several source scenes share one rendered map
- **WHEN** reviewed bindings place several source scenes in one map space
- **THEN** their placements retain their source-scene identities
- **AND** each binding projects its coordinates into the shared map space

#### Scenario: One scene contains separate layouts
- **WHEN** disjoint reviewed domains select different map spaces within one source scene
- **THEN** the matching domain selects the map-space candidate
- **AND** a position outside every domain remains unresolved without clamping

#### Scenario: Floors overlap in horizontal coordinates
- **WHEN** placements share XZ coordinates but match different reviewed floor domains through Y
- **THEN** their map projections retain distinct floor identities
- **AND** a point that matches several floors remains ambiguous
- **AND** domain minima are inclusive and domain maxima are exclusive

#### Scenario: Region geometry is unsupported
- **WHEN** an authored region has unsupported or contradictory collider geometry
- **THEN** the snapshot retains the unresolved region evidence
- **AND** it does not substitute the collider's world-aligned bounding box
- **AND** a supported overlapping region can still retain its geometric membership

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

#### Scenario: Authored content reloads
- **WHEN** the same build reloads a scene or unloads and reloads streamed content
- **THEN** equivalent authored producers retain their identities across extraction
- **AND** distinct producers that share a prefab remain distinct
- **AND** changed runtime instance IDs do not change authored identities

#### Scenario: A role source has no matching snapshot observation
- **WHEN** a source component observation is absent or disagrees with its scene, GameObject, type, or component slot
- **THEN** its role evidence remains unplaced
- **AND** matching names or coordinates do not supply a replacement identity

#### Scenario: Candidate persistence keys collide
- **WHEN** distinct authored sources produce the same candidate placement key
- **THEN** validation reports the collision with both source identities
- **AND** normalization does not silently merge them

### Requirement: Afallon-specific content and roles

The snapshot SHALL cover enemies, bosses, friendly NPC services, resources, containers, useful interactions, quest locations, and transitions where these exist in the supported build. It SHALL retain multiple roles on one placement and deduplicate components that describe the same interaction. Component names alone SHALL NOT determine player-facing categories.

#### Scenario: One producer supports several gathering skills
- **WHEN** a resource producer references a gathering skill
- **THEN** its category follows the referenced skill and output semantics rather than the producer class name

#### Scenario: One NPC has several services
- **WHEN** an NPC sells items and offers quests
- **THEN** the snapshot preserves both roles without inventing duplicate physical NPCs

#### Scenario: Several components contribute different roles
- **WHEN** verified source components on one authored GameObject provide different supported interactions
- **THEN** one physical placement retains their role union and separate source evidence

#### Scenario: Faction alignment depends on player state
- **WHEN** native faction rules resolve NPC-to-player alignment
- **THEN** disposition facts retain player-state scope separately from authored capabilities and ranks
- **AND** combat flags and names do not substitute for native alignment
- **AND** an unverified producer faction override prevents use of base-faction disposition

#### Scenario: Authored service bindings are disabled
- **WHEN** an NPC capability flag is disabled but its authored bindings remain present
- **THEN** those bindings do not grant the disabled role or create an unresolved role gap
- **AND** the raw bindings remain available as evidence

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

A local preview MAY use explicitly bounded partial coverage. It SHALL retain the outstanding coverage ledger and visibly identify itself as incomplete. References, identities, build agreement, and spatial bounds SHALL still validate for every included record. This preview SHALL NOT satisfy the complete-release coverage gate.

#### Scenario: A marker has no valid map coverage
- **WHEN** a placement cannot resolve a map space or lies outside validated bounds
- **THEN** publication fails with the placement and source identities
- **AND** it does not silently discard or clamp the marker
