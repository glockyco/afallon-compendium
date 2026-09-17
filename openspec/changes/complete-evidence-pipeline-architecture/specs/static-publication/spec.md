## Purpose

Compile sealed catalog inputs into reproducible static resources with verified dependency closure, bounded startup cost, and safe deployment selection.

## ADDED Requirements

### Requirement: Publication is a read-only deterministic compilation

Publication SHALL consume a verified sealed catalog and immutable presentation inputs. It SHALL NOT register imagery, repair facts, or update coverage in the source catalog. Equivalent inputs and implementation SHALL produce identical static resource bytes and root identity, excluding separate operational timestamps.

#### Scenario: A publication succeeds or fails
- **WHEN** compilation reads a sealed catalog
- **THEN** the source database hash remains unchanged on either outcome
- **AND** catalog mutation attempts fail rather than changing publication input identity

#### Scenario: Compilation is repeated after store relocation
- **WHEN** identical inputs and implementation are available at another filesystem root
- **THEN** the generated public resource hashes remain identical
- **AND** local paths and operation timestamps do not enter public resource identities

### Requirement: Publication selection verifies typed dependency closure

Every referenced public resource SHALL have a validated schema, content identity, and compatible build and catalog identity. Reference validation SHALL follow declared resource fields and reject missing, conflicting, unsafe, or mismatched references before selection. Failed candidate generation or selection SHALL preserve the prior selected publication.

#### Scenario: A nested detail reference is missing
- **WHEN** a search entry references an unavailable detail resource
- **THEN** candidate validation rejects the publication before selection
- **AND** validation identifies the referring resource and missing target

#### Scenario: A reference has a compatible path but wrong schema
- **WHEN** a map reference resolves to a resource of another declared kind
- **THEN** validation rejects the candidate even if its hash is correct
- **AND** it does not infer compatibility from a filename pattern

### Requirement: Shared-world startup has explicit resource budgets

Publication SHALL separate essential atlas data from search, selected details, and optional movement or connection geometry. Every published map SHALL remain represented in the shared world. The implementation SHALL enforce documented byte budgets against a frozen representative publication without reducing semantic coverage. Oversized resources SHALL split into explicit parts rather than omit records.

#### Scenario: A large map exceeds the shard budget
- **WHEN** a map's essential placement data exceeds the individual resource limit
- **THEN** publication declares multiple bounded parts for that map
- **AND** the reader composes every part at unchanged reviewed world coordinates

#### Scenario: Startup resources are measured
- **WHEN** the representative publication is generated
- **THEN** its root, individual resources, and essential startup total satisfy the documented budgets
- **AND** the report separates raw JSON bytes, compressed transfer, images, and application code

### Requirement: Deployment caching matches generated identities

Deployment SHALL verify selected publication resources before upload. Content-addressed data and imagery paths SHALL receive immutable cache policy. The selected root and deployment selector metadata SHALL remain revalidatable. Runtime probes, raw evidence, database files, and development authoring controls SHALL remain absent from production.

#### Scenario: A browser requests a hashed asset
- **WHEN** the static host serves generated imagery or data under its actual asset path
- **THEN** the response carries the immutable cache policy for that content identity
- **AND** a selected root request does not receive the same immutable policy

#### Scenario: Deployment input contains damaged bytes
- **WHEN** staged content differs from its selected reference
- **THEN** deployment verification rejects it before upload
- **AND** the selected prior deployment remains the rollback target
