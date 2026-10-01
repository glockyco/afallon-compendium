# scan-workflow Specification

## Purpose

Define how an Afallon scan plans runtime targets, collects attributable evidence, and restores owned game state. The resulting target envelopes provide typed inputs to catalog assembly.

## Requirements

### Requirement: One scan contract covers every runtime target

The scanner SHALL accept an ordered plan of current-scene, named build-scene, and named streamed-source targets. Each attempted target SHALL produce the same versioned envelope shape, with build and target identity, observation state, collector dispositions, artifact references, outcome, and diagnostics. Successful targets SHALL collect every declared applicable family.

#### Scenario: An operator scans the current scene
- **WHEN** the scan target is the current gameplay scene
- **THEN** its envelope uses the same schema as a build-scene target envelope
- **AND** its observation records the loaded scene and research character

#### Scenario: A streamed source is scanned
- **WHEN** the plan names a discovered streamed source in a build scene
- **THEN** its envelope identifies the source and parent scene
- **AND** the applicable collector families are represented in its artifacts on success

### Requirement: Scan plans are explicit and reproducible

A scan SHALL validate plan structure before observing runtime state and SHALL resolve named scenes and streamed sources against a registered runtime inventory before target traversal. Its run SHALL retain the ordered plan, build identity, collector schemas, registered planning evidence, and per-target envelopes. Authored placement identities SHALL derive from serialized source evidence rather than runtime instance identifiers.

#### Scenario: A plan names an unknown source
- **WHEN** inventory cannot bind a requested streamed source to its parent scene
- **THEN** the scan rejects the plan before target traversal
- **AND** the error identifies the unresolved target

#### Scenario: The same authored source is scanned again
- **WHEN** an equivalent plan scans the same serialized source in the same build
- **THEN** its authored source and placement identities remain stable across different runtime instance identifiers

### Requirement: One owner controls runtime mutation

A scan SHALL use its runtime owner's scene and stream visitation protocol for target mutation and restoration. It SHALL verify target restoration against observed scene, character, position, and rotation and SHALL require runtime cleanup before successful run finalization. A target whose restoration cannot be confirmed SHALL NOT be reported successful.

#### Scenario: A target fails after changing scenes
- **WHEN** collection fails after a scene visit starts
- **THEN** the scene visitor attempts to restore the source scene
- **AND** the target remains failed if the original scene, character, position, or rotation cannot be confirmed

#### Scenario: The host disconnects during collection
- **WHEN** the host disconnects while a scan owns runtime state
- **THEN** runtime-side cleanup restores owned state and records a cleanup receipt
- **AND** the run cannot succeed without its cleanup receipt

### Requirement: Target failures remain attributable

Each planned target SHALL retain its own successful, failed, unreachable, unsupported, or not-attempted outcome with available diagnostics and source evidence. A failed target SHALL retain partial artifacts as evidence without presenting them as successful collection. A run with any unsuccessful target SHALL fail rather than replace the selected successful scan.

#### Scenario: One target fails in a multi-target scan
- **WHEN** collection succeeds for earlier targets and fails for a later target
- **THEN** the run retains the preceding envelopes and the failed target's diagnostics
- **AND** subsequent targets are recorded as not attempted
- **AND** the run cannot become the selected successful scan

#### Scenario: A streamed source is unreachable
- **WHEN** a streamed source does not produce a stable loaded root by its deadline
- **THEN** the target records an unreachable outcome with its source evidence
- **AND** it does not claim successful extraction

### Requirement: Scan target envelopes are the ingestion boundary

Each scan target envelope SHALL declare its collector families and typed, content-addressed artifacts with schema identities, observation references, build identity, and outcome. Catalog ingestion SHALL use these declarations to resolve evidence, rejecting missing applicable families, duplicate artifact identities, mismatched builds, and unsuccessful targets with target context.

#### Scenario: Different target kinds feed one catalog
- **WHEN** successful current-scene, build-scene, and streamed-source envelopes are supplied to ingestion
- **THEN** their declared artifacts use the supported evidence contracts
- **AND** ingestion resolves them without relying on scratch directory names

#### Scenario: A required family is absent
- **WHEN** a successful target lacks an artifact for a collector family declared for collection
- **THEN** ingestion rejects that target
- **AND** the error names the target and missing family

### Requirement: Planning observations remain verifiable inputs

Structural plan validation SHALL precede runtime observation. Planning SHALL register the installed build manifest, observed state, inventory, observation context, and resolved target set as run evidence before target traversal. It SHALL reject a character or scene-context mismatch and unknown named targets before traversing them.

#### Scenario: Discovery observes the wrong character
- **WHEN** planning state or inventory context differs from the configured research character
- **THEN** the scan rejects that evidence
- **AND** it does not begin target traversal

#### Scenario: A discovered target is selected
- **WHEN** target resolution uses runtime inventory
- **THEN** the run retains the inventory and the resolved target identities as content-addressed evidence
- **AND** the target selection remains auditable without the scratch directory

### Requirement: Preparation failure cannot strand scan ownership state

Target preparation, collection, restoration, and bookkeeping SHALL clear host-side target processing state on terminal paths. Runtime mutation SHALL remain subject to runtime cleanup and verification. A preparation storage failure SHALL NOT be reported as another active target.

#### Scenario: Target directory creation fails
- **WHEN** target preparation cannot create its output directory
- **THEN** the operation reports the storage error
- **AND** a later attempt is not blocked by a leaked processing flag

#### Scenario: Cleanup remains unconfirmed
- **WHEN** records were collected but target restoration cannot be confirmed
- **THEN** the target remains unsuccessful
- **AND** later targets are not traversed

### Requirement: Target outcome semantics survive ingestion

Catalog ingestion SHALL require complete successful scan runs and SHALL distinguish failed, unreachable, unsupported, and not-attempted targets from successful targets. Collector dispositions SHALL remain part of each envelope, and omission of an unsuccessful target SHALL NOT make the run complete.

#### Scenario: One target fails after earlier success
- **WHEN** a run has successful records followed by a failed target
- **THEN** the run preserves both outcomes
- **AND** catalog admission rejects the incomplete run

### Requirement: Scan extracts entity artwork

The artwork collector SHALL record database-referenced sprites for items, abilities, NPCs, scenes, regions, and other supported entity families with source entity identity, image role, native asset name, and source field. Successful extraction SHALL register a content-addressed PNG with pixel dimensions; a missing sprite or failed read SHALL remain an explicit missing or unsupported record with its reason. The collector SHALL release temporary graphics resources and restore the active render target after each read.

#### Scenario: Item icons are extracted
- **WHEN** an item icon sprite can be read
- **THEN** its artwork record references a registered PNG by hash and dimensions
- **AND** an item without a sprite has an explicit missing icon record

#### Scenario: Guide artwork is extracted
- **WHEN** a scene or region guide sprite can be read
- **THEN** its artwork record identifies the native asset, entity, and role
- **AND** its image references registered content-addressed bytes

#### Scenario: A sprite cannot be read
- **WHEN** sprite extraction fails
- **THEN** the artwork record retains an unsupported disposition and error reason
- **AND** extraction continues with other artwork records
