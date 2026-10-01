## Purpose

Produce attributable scan evidence that current catalog ingestion can consume directly while preserving exclusive runtime ownership and verified restoration.

## ADDED Requirements

### Requirement: Scan target envelopes are the ingestion boundary

Every scan target SHALL identify its artifact families, schema identities, content references, observation context, and outcome in a versioned envelope. Catalog ingestion SHALL resolve families through those declarations rather than directory names. Missing applicable families, duplicate family identities, and cross-build references SHALL fail ingestion with target context.

#### Scenario: Different target kinds feed one catalog
- **WHEN** successful current-scene, build-scene, and streamed-source envelopes are supplied to ingestion
- **THEN** their declared families use one supported evidence contract
- **AND** stable authored identities survive changes to target order or scratch paths

#### Scenario: A required family is absent
- **WHEN** a target lacks an applicable family and has no evidence-backed not-applicable disposition
- **THEN** ingestion rejects that target as complete evidence
- **AND** the diagnostic names the target and missing family

### Requirement: Planning observations remain verifiable inputs

Structural plan validation SHALL precede runtime connection. Runtime-dependent target discovery SHALL occur under exclusive ownership and SHALL retain validated character, scene, and build context. Its inventory and resolved target set SHALL become registered run evidence before traversal. Unknown targets SHALL fail before target mutation.

#### Scenario: Discovery observes the wrong character
- **WHEN** planning inventory context differs from the configured research character
- **THEN** the scan rejects that inventory and records the mismatch
- **AND** it does not begin scene traversal

#### Scenario: A discovered target is selected
- **WHEN** target resolution uses runtime inventory
- **THEN** the manifest retains the inventory object and resolved target identities
- **AND** an auditor can reproduce target selection without the deleted scratch directory

### Requirement: Preparation failure cannot strand scan ownership state

Target preparation, collection, restoration, and bookkeeping SHALL release host-side processing state on every terminal path. Runtime mutation SHALL remain protected by native cleanup and a verified receipt. A storage failure SHALL NOT be misreported as another active target.

#### Scenario: Target directory creation fails
- **WHEN** target preparation cannot create its output directory
- **THEN** the operation reports the storage failure and finalizes attributable diagnostics where storage permits
- **AND** a later operation does not fail because of a leaked processing flag

#### Scenario: Cleanup remains unconfirmed
- **WHEN** a scan collects valid records but cannot confirm required runtime restoration
- **THEN** the scan remains unsuccessful
- **AND** it does not replace the successful scan reference or admit further unsafe mutation

### Requirement: Target outcome semantics survive ingestion

Failed, unreachable, unsupported, not-attempted, and successful targets SHALL remain distinct. Family-level not-applicable dispositions SHALL retain evidence. A failed run SHALL remain auditable but SHALL NOT become successful catalog input by omitting its failed targets.

#### Scenario: One target fails after earlier success
- **WHEN** a multi-target run contains successful records and a failed target
- **THEN** the run preserves both outcomes
- **AND** catalog input admission does not silently reinterpret the run as a complete successful scan
