# artifact-lifecycle Specification

## Purpose

Provide content-addressed evidence, verifiable run lineage, and explicit successful-run selection for the compendium pipeline. Report retention without treating unselected or partial evidence as a successful result.

## Requirements

### Requirement: Artifacts have content identities

Every stored artifact SHALL be identified by the SHA-256 hash and byte count of its content. The store SHALL retain one immutable object for a hash, verify an existing object's bytes before reuse, and keep logical names in run manifests rather than object paths. It SHALL reject an existing object whose bytes disagree with its identity.

#### Scenario: Two runs produce identical evidence
- **WHEN** two runs register byte-identical evidence
- **THEN** both manifests reference the same content identity
- **AND** the store retains one object for those bytes

#### Scenario: A stored object is damaged
- **WHEN** verification finds bytes that do not match the object's content identity
- **THEN** the object is not reused or replaced under that identity
- **AND** verification reports the expected and observed hashes

### Requirement: Runs remain immutable and failure-safe

An admitted run SHALL record its game build, operation, settings, schema identities, implementation fingerprint, input and output identities, timestamps, status, and any failure evidence. A terminal run manifest and its registered artifact references SHALL be immutable. Only a verified successful run SHALL be eligible to replace the latest-success reference for its build and operation.

#### Scenario: A run fails after producing some outputs
- **WHEN** an admitted operation fails after registering artifacts
- **THEN** its terminal manifest records the failure and registered content identities
- **AND** the previous latest-success reference remains unchanged

#### Scenario: A completed manifest is changed
- **WHEN** a caller attempts to mutate a terminal run or its artifact references
- **THEN** the lifecycle rejects the mutation
- **AND** the original manifest remains verifiable

### Requirement: Reuse follows complete step fingerprints

A reusable step result SHALL match the game build, operation, settings, input content identities, schema identities, executable dependency fingerprint, and probe hashes of the new run. A change to an executable dependency SHALL change the fingerprint without a maintained file list; an unrelated file SHALL NOT change it. Reuse SHALL verify the selected source run and record its identity and outputs in the consuming run.

#### Scenario: A transitive implementation dependency changes
- **WHEN** code or an included probe used by the step changes
- **THEN** the step receives a different implementation fingerprint
- **AND** the prior selected outputs do not qualify for step reuse

#### Scenario: Inputs and implementation are unchanged
- **WHEN** a selected successful step has matching build, operation, settings, schemas, inputs, and implementation identity
- **THEN** its verified output identities are eligible for reuse
- **AND** a run that reuses them records the source run and outputs in its manifest

### Requirement: References report live artifacts

Retention reporting SHALL verify and report the objects reachable from explicitly retained runs, latest-success references, and active leases, including their referenced run and object dependencies. It SHALL identify the protecting references and report other stored objects as unreachable; it SHALL NOT delete objects or classify a partial write as a selected successful result. The clean command SHALL only compact revision files of terminal runs, leaving object and manifest retention unchanged.

#### Scenario: A shared object remains protected
- **WHEN** an object is referenced by two runs and one is not retained or selected
- **THEN** the retention report identifies the remaining run's protection for the object
- **AND** that run remains verifiable

#### Scenario: An operation is writing an object
- **WHEN** retention reporting runs while an operation has an active lease and pending object
- **THEN** the report protects the pending identity without treating the temporary write as a published object
- **AND** it does not delete the temporary write

#### Scenario: Clean applies revision compaction
- **WHEN** an operator applies the clean command to a store containing terminal runs
- **THEN** their revision journals are removed where present
- **AND** the command does not delete artifact objects or terminal manifests

### Requirement: All pipeline operations use one run contract

Scan, capture, catalog, and publication SHALL record build, settings, schema identities, implementation identity, inputs, outputs, outcomes, and failures through the artifact-run contract. Successful downstream operations SHALL verify registered input objects and run manifests instead of relying on copied run files.

#### Scenario: A fresh scan feeds the offline pipeline
- **WHEN** an operator supplies a successful scan to catalog construction and then publication
- **THEN** downstream stages resolve registered input identities and manifests from the artifact store
- **AND** the publication retains its catalog and evidence lineage through those references

### Requirement: Operational failures preserve a terminal evidence record

After run admission, a preparation or execution failure SHALL retain the registered outputs and attributable failure in a terminal run when finalization succeeds, without changing a prior successful reference. Invalid arguments rejected before admission SHALL require no runtime mutation. Run inspection SHALL distinguish a running record, an interrupted record, and a terminal record.

#### Scenario: Planning fails after evidence collection
- **WHEN** scan planning registers inventory evidence and target resolution then fails
- **THEN** the failed run retains the inventory identity and attributed error
- **AND** the previous successful scan remains selected

#### Scenario: Reference selection fails after output verification
- **WHEN** a terminal successful run exists but replacement of its latest-success reference fails
- **THEN** the previous reference remains valid and the operation reports selection failure
- **AND** the successful terminal manifest remains immutable

### Requirement: Retention follows the complete evidence dependency closure

Retention reporting SHALL traverse and verify object and manifest references from policy-retained runs, latest-success runs, and active leases. A referenced missing or corrupted dependency SHALL fail integrity verification rather than be classified as unreachable. Reporting SHALL identify the references that protect each reachable object, but SHALL NOT perform garbage deletion.

#### Scenario: A retained catalog outlives its source run retention window
- **WHEN** a retained catalog manifest references a scan manifest whose run ID is not separately retained
- **THEN** reporting still protects and verifies the scan evidence through the catalog lineage
- **AND** it identifies the retaining run and reference path

#### Scenario: A selected publication is retained
- **WHEN** the latest-success publication run refers to its catalog, imagery, and resource objects
- **THEN** the report traverses and verifies those recorded dependencies
- **AND** an incomplete temporary write is not classified as a published object

### Requirement: Integrity verification has bounded memory use

Object registration and hash verification SHALL stream bytes using memory bounded independently of object size. Run reuse SHALL verify referenced inputs, outputs, and dependency manifests before accepting them. A relocated artifact store SHALL resolve content identities and relative run references without original working directories.

#### Scenario: A large catalog object is verified
- **WHEN** the store verifies an object larger than its verification buffer
- **THEN** verification hashes the complete byte stream in bounded chunks
- **AND** corruption near the end of the object causes rejection

#### Scenario: Evidence moves to another store root
- **WHEN** all referenced objects, manifests, and selections move intact to a different root
- **THEN** their content identities and relative run references remain resolvable
- **AND** consumers do not need the original scratch directory
