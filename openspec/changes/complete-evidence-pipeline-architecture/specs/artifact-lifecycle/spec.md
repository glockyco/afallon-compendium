## Purpose

Provide one immutable evidence and run boundary that every Afallon pipeline operation can consume without working-directory dependencies.

## ADDED Requirements

### Requirement: All pipeline operations use one run contract

Scan, capture, catalog, and publication SHALL record inputs, outputs, schemas, implementation identity, build, settings, outcomes, and failures through one versioned run contract. Successful downstream runs SHALL reference verified immutable inputs. Production readers SHALL NOT accept retired extract, traverse, or normalize manifest formats after cutover.

#### Scenario: A fresh scan feeds the offline pipeline
- **WHEN** an operator supplies a successful current scan to catalog construction and then publication
- **THEN** each stage consumes the preceding stage's registered references without conversion or copied run files
- **AND** the resulting publication identifies its catalog and evidence lineage

#### Scenario: Retained evidence is imported once
- **WHEN** an operator imports a retained legacy run with verified hashes
- **THEN** the import preserves the source bytes and records their original provenance in the current contract
- **AND** normal pipeline execution requires no legacy reader afterward

### Requirement: Operational failures preserve a terminal evidence record

An operation SHALL create its run record before evidence-producing preparation. A preparation or execution failure SHALL retain available diagnostics and registered outputs without changing a successful reference. Invalid external arguments rejected before operation admission SHALL require no runtime mutation. Recovery SHALL distinguish interrupted running records from successful terminal records.

#### Scenario: Planning fails after evidence collection
- **WHEN** runtime planning produces inventory evidence but target resolution fails
- **THEN** the failed run retains the inventory identity and attributed error
- **AND** the previous successful run remains selected

#### Scenario: Reference selection fails after output verification
- **WHEN** verified output exists but successful-reference replacement fails
- **THEN** the previous reference remains valid and the operation reports selection failure
- **AND** the terminal output manifest remains immutable rather than being rewritten as a different result

### Requirement: Retention follows the complete evidence dependency closure

Retention reporting SHALL protect inputs and outputs reachable from retained runs, selected catalogs, selected publications, and active operations. Every protected reference SHALL resolve to a verified object or manifest. Missing dependencies SHALL cause an integrity failure rather than an unreachable-object classification.

#### Scenario: A retained catalog outlives its source run retention window
- **WHEN** a catalog still references evidence from an otherwise expired scan
- **THEN** retention reporting protects that evidence and the required lineage
- **AND** it explains the catalog reference that protects each object

#### Scenario: A selected publication is retained
- **WHEN** retention reporting processes a selected publication
- **THEN** its resource graph, imagery, catalog, and required evidence lineage remain reachable
- **AND** temporary incomplete writes are not treated as published objects

### Requirement: Integrity verification has bounded memory use

Object registration and verification SHALL use memory bounded independently of object byte size. Reuse SHALL verify hashes and byte counts for all required inputs, outputs, and restoration evidence. Relocating an artifact store SHALL NOT change content identity or require the original working directories.

#### Scenario: A large catalog object is verified
- **WHEN** the store verifies a catalog larger than the verification buffer budget
- **THEN** verification processes bounded chunks and checks the complete byte stream
- **AND** corruption near the end of the object causes rejection

#### Scenario: Evidence moves to another store root
- **WHEN** all retained objects and manifests move intact to a new root
- **THEN** their references remain resolvable and their content identities remain unchanged
- **AND** no consumer reads a stale absolute scratch path
