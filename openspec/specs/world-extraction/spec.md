# world-extraction Specification

## Purpose
Produce reproducible Afallon world data that distinguishes authored content, conditions, and observations while accounting for extraction coverage.

## Requirements

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

The extractor SHALL inventory build scenes, database scene records, discovered scene references, and streamed content sources.

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

#### Scenario: Complete coverage accounting
- **WHEN** The extractor inventories available content sources.
- **THEN** The inventory includes build scenes, database scene records, discovered scene references, and streamed content sources.

### Requirement: Separate source evidence fields

Each discovered source SHALL retain evidence for reachability, runtime availability, extraction status, and imagery status as separate fields.

#### Scenario: Separate source evidence fields
- **WHEN** A source is discovered.
- **THEN** The source retains separate evidence fields for reachability, runtime availability, extraction status, and imagery status.

### Requirement: Reachability classification

Reachability SHALL distinguish unknown, reachable, unreachable, and unused sources.

#### Scenario: Reachability classification
- **WHEN** A discovered source has unknown reachability.
- **THEN** Its reachability is recorded as unknown, distinct from reachable, unreachable, and unused.

### Requirement: Extraction status classification

Extraction SHALL distinguish pending, extracted, unsupported, and failed sources.

#### Scenario: Extraction status classification
- **WHEN** Extraction of a source fails.
- **THEN** Its extraction status is failed, distinct from pending, extracted, and unsupported.

### Requirement: Imagery status classification

Imagery SHALL distinguish pending, captured, validated, failed, and evidence-backed not-applicable states.

#### Scenario: Imagery status classification
- **WHEN** Evidence establishes that imagery is not applicable to a source.
- **THEN** The imagery state is evidence-backed not-applicable, distinct from pending, captured, validated, and failed.

### Requirement: Runtime activation and load state

Runtime availability SHALL retain activation state separately from unloaded, loading, loaded, or unknown load state.

#### Scenario: Runtime activation and load state
- **WHEN** An inactive source has loaded content.
- **THEN** Runtime availability records inactive activation separately from the loaded load state.

### Requirement: Combined load observation is not readiness

A combined loaded-or-loading observation SHALL NOT establish readiness.

#### Scenario: Combined load observation is not readiness
- **WHEN** Only a combined loaded-or-loading observation is available.
- **THEN** That observation does not establish readiness.

### Requirement: Conditional and generated content retention

The ledger SHALL retain conditional and generated content.

#### Scenario: Conditional and generated content retention
- **WHEN** Discovered content is conditional or generated.
- **THEN** The ledger retains that content.

### Requirement: Diagnostic grouping

The ledger SHALL group diagnostics by source and issue type.

#### Scenario: Diagnostic grouping
- **WHEN** Diagnostics from multiple sources and issue types are recorded.
- **THEN** The ledger groups the diagnostics by source and issue type.

### Requirement: Distinct missing-source counts

Repeated diagnostics SHALL NOT inflate distinct missing-source counts.

#### Scenario: Distinct missing-source counts
- **WHEN** A missing source produces repeated diagnostics.
- **THEN** The distinct missing-source count is not inflated by the repetitions.

### Requirement: Unset field distinction

Unset fields SHALL remain distinct from failed references and unverified semantics.

#### Scenario: Unset field distinction
- **WHEN** A source contains an unset field, a failed reference, and unverified semantics.
- **THEN** The ledger keeps those states distinct.

### Requirement: Complete-release source resolution

A release described as complete SHALL have no unresolved reachable source or relevant content family.

#### Scenario: Complete-release source resolution
- **WHEN** A release is described as complete.
- **THEN** No reachable source or relevant content family remains unresolved.

### Requirement: Pending coverage is incomplete

Pending discovery or classification SHALL NOT count as complete coverage.

#### Scenario: Pending coverage is incomplete
- **WHEN** Discovery or classification is still pending.
- **THEN** The pending work does not count as complete coverage.
### Requirement: Native spatial calibration evidence

The extractor SHALL retain exact scene-binding candidates and native coordinate registration independently from rendered map spaces.

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

#### Scenario: Native spatial calibration evidence
- **WHEN** The extractor records scene-binding candidates and native coordinate registration for a rendered map.
- **THEN** The exact candidates and native registration are retained independently from rendered map spaces.

### Requirement: Explicit scene-binding uncertainty

Missing or ambiguous scene bindings SHALL remain explicit.

#### Scenario: Explicit scene-binding uncertainty
- **WHEN** A scene binding is missing.
- **THEN** The missing binding remains explicit.

### Requirement: Native registration samples and residuals

Registration SHALL use native sample results and record residuals.

#### Scenario: Native registration samples and residuals
- **WHEN** Native sample results are used for registration.
- **THEN** Registration uses those results and records residuals.

### Requirement: Unresolved invalid registration samples

Contradictory, singular, or non-horizontal samples SHALL remain unresolved.

#### Scenario: Unresolved invalid registration samples
- **WHEN** Registration samples are singular.
- **THEN** The singular samples remain unresolved.

### Requirement: Geometry observation scope and height

Geometry observations SHALL retain query scope and world Y coordinates.

#### Scenario: Geometry observation scope and height
- **WHEN** A geometry query produces observations.
- **THEN** The observations retain the query scope and world Y coordinates.

### Requirement: Navigation triangle evidence limits

Navigation triangles SHALL NOT establish complete playable coverage, exact grounding heights, or floor ownership.

#### Scenario: Navigation triangle evidence limits
- **WHEN** Navigation triangles are available as spatial evidence.
- **THEN** They do not establish complete playable coverage, exact grounding heights, or floor ownership.

### Requirement: Geometry engine hash inputs

Snapshot inputs SHALL include the native engine hash used by the geometry binding.

#### Scenario: Geometry engine hash inputs
- **WHEN** A snapshot uses a native geometry binding.
- **THEN** The snapshot inputs include the native engine hash used by that binding.
### Requirement: Reviewed map membership

The extractor SHALL retain reviewed map profiles separately from native MapZone registrations and capture bounds.

#### Scenario: Several source scenes share one rendered map
- **WHEN** reviewed bindings place several source scenes in one map space
- **THEN** their placements retain their source-scene identities
- **AND** each binding projects its coordinates into the shared map space

#### Scenario: One scene contains separate layouts
- **WHEN** disjoint reviewed domains select different map spaces within one source scene
- **THEN** the matching domain selects the map-space candidate
- **AND** a position outside every domain remains unresolved without clamping


#### Scenario: A reviewer frames a dungeon
- **WHEN** a binding declares box domains and a scene-independent object sits outside them
- **THEN** that placement appears in the exclusion ledger with the binding evidence
- **AND** it is not an unresolved blocker
- **AND** the published interior game map uses its reviewed bounds

#### Scenario: Stacked placements share horizontal coordinates
- **WHEN** placements share XZ coordinates at different heights
- **THEN** their normalized placements retain distinct identities and world heights
- **AND** they project to the same horizontal map position
- **AND** neither is merged or displaced solely because it shares that position

#### Scenario: Area geometry is unsupported
- **WHEN** an authored area has unsupported or contradictory collider geometry
- **THEN** the snapshot retains the unresolved area evidence
- **AND** it does not substitute the collider's world-aligned bounding box
- **AND** a supported overlapping area can still retain its geometric membership

#### Scenario: Reviewed map membership
- **WHEN** Reviewed map profiles and native MapZone registrations are available.
- **THEN** The extractor retains the profiles separately from native registrations and capture bounds.

### Requirement: Exact reviewed profile bindings

Profiles SHALL bind exact source-scene IDs and paths to horizontal coordinate frames and membership domains.

#### Scenario: Exact reviewed profile bindings
- **WHEN** A reviewed profile binds a source scene.
- **THEN** The profile binds the exact source-scene ID and path to a horizontal coordinate frame and membership domains.

### Requirement: Explicit profile and domain gaps

Missing profiles, unmatched domains, and contradictory scene bindings SHALL remain explicit.

#### Scenario: Explicit profile and domain gaps
- **WHEN** A placement has an unmatched domain.
- **THEN** The unmatched domain remains explicit.

### Requirement: Membership domains are not capture boundaries

The reviewed domains SHALL define placement membership, not an automatic capture boundary.

#### Scenario: Membership domains are not capture boundaries
- **WHEN** A reviewed domain determines placement membership.
- **THEN** The domain is not automatically treated as a capture boundary.

### Requirement: Horizontal membership

Membership SHALL be horizontal.

#### Scenario: Horizontal membership
- **WHEN** A placement is evaluated for map membership.
- **THEN** Membership is evaluated horizontally.

### Requirement: No profile or placement floor identities

Profiles and placements SHALL NOT assign floor identities.

#### Scenario: No profile or placement floor identities
- **WHEN** Profiles and placements describe vertically stacked content.
- **THEN** Neither profiles nor placements assign floor identities.

### Requirement: Retained but unpublished placement height

Normalized placements SHALL retain world height, but the current public map placement contract does not publish that field.

#### Scenario: Retained but unpublished placement height
- **WHEN** A placement with world height is normalized for the current public map placement contract.
- **THEN** The normalized placement retains world height, but the public contract does not publish that field.

### Requirement: Box-domain exclusion ledger

A reviewed box domain limits map membership. Normalization SHALL record a placement outside every box of its scene bindings in an exclusion ledger with its reason and binding evidence, separate from unresolved blockers.

#### Scenario: Box-domain exclusion ledger
- **WHEN** A placement is outside every box of its scene bindings.
- **THEN** Normalization records the placement in an exclusion ledger with its reason and binding evidence, separate from unresolved blockers.

### Requirement: Reviewed coordinates control proposed boxes

A tool MAY propose a box from the game's MapZone rectangle and nearby scene-local placements, but reviewed coordinates SHALL control the final frame.

#### Scenario: Reviewed coordinates control proposed boxes
- **WHEN** A tool proposes a box from the game's MapZone rectangle and nearby scene-local placements.
- **THEN** Reviewed coordinates control the final frame.

### Requirement: Overworld capture extent

Overworld capture SHALL use its own reviewed extent.

#### Scenario: Overworld capture extent
- **WHEN** An overworld map is captured.
- **THEN** Capture uses its own reviewed extent.

### Requirement: Interior game maps without capture

Interiors SHALL use game-provided maps and SHALL NOT be captured.

#### Scenario: Interior game maps without capture
- **WHEN** An interior map is prepared.
- **THEN** It uses a game-provided map and is not captured.

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

The snapshot SHALL resolve NPC loot, vendor stock and currency costs, resource yields, quest associations, and transition destinations.

#### Scenario: Vendor stock depends on progression
- **WHEN** a vendor references several stock tables with different requirements
- **THEN** each stock entry retains the requirement of its source table
- **AND** the extractor does not flatten all entries into unconditional stock

#### Scenario: Loot uses nested rules
- **WHEN** an NPC references a loot table with its own rate and selection controls
- **THEN** the snapshot preserves both relationship levels and controls
- **AND** it records the gates and roll order that native analysis establishes

#### Scenario: An effective chance has no measurement
- **WHEN** the displayed chance for the supported build is unmeasured
- **THEN** the snapshot retains the authored rates and rule structure
- **AND** publication rejects any derived percentage

#### Scenario: Linked facts retain conditions and provenance
- **WHEN** The snapshot is produced for sources with linked facts.
- **THEN** It resolves NPC loot, vendor stock and currency costs, resource yields, quest associations, and transition destinations.

### Requirement: Relationship provenance and rule structure

Relationships SHALL retain source identity, requirements, quantity ranges, and rule structure.

#### Scenario: Relationship provenance and rule structure
- **WHEN** A linked relationship is recorded.
- **THEN** It retains source identity, requirements, quantity ranges, and rule structure.

### Requirement: Explicit dynamic loot rules

Dynamic loot rules SHALL remain explicit until their outputs can be resolved correctly.

#### Scenario: Explicit dynamic loot rules
- **WHEN** A dynamic loot rule's outputs cannot yet be resolved correctly.
- **THEN** The dynamic rule remains explicit.

### Requirement: Native loot gate and roll order

The snapshot SHALL record the loot roll order and gates that native analysis establishes: a table-level requirements gate, then per item an item-level band around its level requirement, then a quest-item gate, then the entry roll.

#### Scenario: Native loot gate and roll order
- **WHEN** Native analysis establishes the loot gates and entry roll sequence.
- **THEN** The snapshot records the table-level requirements gate followed, per item, by the item-level band around its level requirement, the quest-item gate, and the entry roll.

### Requirement: Native first-pass drop limit

The snapshot SHALL record the table drop limit that stops the first pass, as established by native analysis.

#### Scenario: Native first-pass drop limit
- **WHEN** Native analysis establishes a table drop limit that stops the first pass.
- **THEN** The snapshot records that limit and its first-pass stopping role.

### Requirement: Native minimum-drop selection pass

The snapshot SHALL record the separate minimum-drop selection pass that native analysis establishes.

#### Scenario: Native minimum-drop selection pass
- **WHEN** Native analysis establishes a separate minimum-drop selection pass.
- **THEN** The snapshot records that separate pass.

### Requirement: Native loot-specialisation redirection

The snapshot SHALL record the loot-specialisation source that native analysis establishes, which redirects to a linked NPC only when that NPC carries a specialisation.

#### Scenario: Native loot-specialisation redirection
- **WHEN** Native analysis establishes a loot-specialisation source linked to an NPC without a specialisation.
- **THEN** The snapshot records the source and its condition that redirection occurs only when the linked NPC carries a specialisation.

### Requirement: Measured effective chances

A published effective chance SHALL rest on a measurement, not on an assumed composition of authored rates. The roll threshold depends on native helpers and constants that raw rates alone do not determine.

#### Scenario: Measured effective chances
- **WHEN** An effective chance is published.
- **THEN** It rests on a measurement rather than an assumed composition of authored rates, which alone do not determine the roll threshold.

### Requirement: Unmeasured authored rates without percentages

Where no measurement exists, the snapshot SHALL retain the authored rates and the rule structure without deriving a percentage.

#### Scenario: Unmeasured authored rates without percentages
- **WHEN** No measurement exists for an effective chance.
- **THEN** The snapshot retains the authored rates and rule structure without deriving a percentage.
### Requirement: Integrity gates protect publication

Publication SHALL reject unresolved required references, duplicate placement identities, mismatched game builds, and placements outside their declared spatial coverage.

#### Scenario: A marker has no valid map coverage
- **WHEN** a placement cannot resolve a map space or lies outside validated bounds
- **THEN** publication fails with the placement and source identities
- **AND** it does not silently discard or clamp the marker

#### Scenario: Integrity gates protect publication
- **WHEN** Publication encounters duplicate placement identities.
- **THEN** Publication rejects the duplicate placement identities.

### Requirement: Machine-readable deliberate exclusions

Deliberate exclusions SHALL appear in a machine-readable report with their reasons.

#### Scenario: Machine-readable deliberate exclusions
- **WHEN** Content is deliberately excluded.
- **THEN** The exclusion appears in a machine-readable report with its reason.

### Requirement: Repeat-run placement uniqueness

Repeated runs SHALL not create duplicate placements.

#### Scenario: Repeat-run placement uniqueness
- **WHEN** Extraction is run repeatedly.
- **THEN** The repeated runs do not create duplicate placements.

### Requirement: Bounded partial preview coverage

A preview MAY use explicitly bounded partial coverage. A preview SHALL retain outstanding coverage in machine-readable metadata and reports without a user-facing map completeness disclosure.

#### Scenario: Bounded partial preview coverage
- **WHEN** A preview uses explicitly bounded partial coverage.
- **THEN** It retains outstanding coverage in machine-readable metadata and reports without a user-facing map completeness disclosure.

### Requirement: Included preview record validation

References, identities, build agreement, and spatial bounds SHALL validate for included preview records.

#### Scenario: Included preview record validation
- **WHEN** Records are included in a preview.
- **THEN** Their references, identities, build agreement, and spatial bounds validate.

### Requirement: Preview is not complete-release coverage

A preview SHALL NOT satisfy the complete-release coverage gate.

#### Scenario: Preview is not complete-release coverage
- **WHEN** A preview is evaluated against the complete-release coverage gate.
- **THEN** The preview does not satisfy that gate.
