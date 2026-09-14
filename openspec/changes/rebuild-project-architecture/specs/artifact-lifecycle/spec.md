## Purpose

Provide immutable, verifiable evidence storage and reproducible run selection without copying the same large artifacts into each processing step.

## ADDED Requirements

### Requirement: Artifacts have content identities

Every stored artifact SHALL be identified by the SHA-256 hash of its bytes. The store SHALL write one immutable object for a hash, verify an existing object's bytes before reuse, and keep logical names only in manifests or references. It SHALL reject a hash mismatch or an attempt to replace bytes at an existing content identity.

#### Scenario: Two runs produce identical evidence
- **WHEN** two runs register byte-identical evidence
- **THEN** both manifests reference the same content identity
- **AND** the store retains one immutable object for those bytes

#### Scenario: A stored object is damaged
- **WHEN** verification finds bytes that do not match the object's content identity
- **THEN** the object is not reused
- **AND** the dependent step fails with the expected and observed hashes

### Requirement: Runs remain immutable and failure-safe

A run manifest SHALL identify the game build, operation, validated settings, schema versions, implementation fingerprints, input content identities, output content identities, timestamps, status, and failure evidence. A completed run and its artifact references SHALL be immutable. Only a fully verified successful run SHALL replace the latest-success reference for its build and operation.

#### Scenario: A run fails after producing some outputs
- **WHEN** an operation fails after it has stored one or more artifacts
- **THEN** its manifest records the failure and produced content identities
- **AND** the previous latest-success reference remains unchanged

#### Scenario: A completed manifest is changed
- **WHEN** a caller attempts to mutate a completed run or its artifact references
- **THEN** the lifecycle rejects the mutation
- **AND** the original manifest remains verifiable

### Requirement: Reuse follows complete step fingerprints

A step SHALL reuse outputs only when its game build, validated settings, input content identities, schema versions, and transitive implementation fingerprint match a verified successful result. A change to executable code that can affect the step SHALL change that fingerprint without requiring an operator to maintain a file list. Unrelated repository changes SHALL NOT invalidate the step.

#### Scenario: A transitive implementation dependency changes
- **WHEN** code used by a completed step changes
- **THEN** the step receives a different implementation fingerprint
- **AND** the prior outputs are not reused as current results

#### Scenario: Inputs and implementation are unchanged
- **WHEN** a completed step has the same build, settings, schemas, inputs, and implementation fingerprint
- **THEN** the workflow may reuse its verified output identities
- **AND** it records the reused run and outputs in the new workflow manifest

### Requirement: References protect live artifacts

Artifact cleanup SHALL preserve every object reachable from a run retained by policy, a latest-success reference, or an active operation. Cleanup SHALL report the references that protect an object and SHALL NOT treat an unreferenced partial object as successful evidence.

#### Scenario: Cleanup encounters a shared object
- **WHEN** an object is referenced by two retained runs and one run expires
- **THEN** cleanup preserves the object for the remaining run
- **AND** that run remains verifiable

#### Scenario: An operation is writing an object
- **WHEN** cleanup runs while an operation has an active temporary write
- **THEN** cleanup does not publish or delete that write as a completed object
- **AND** the operation can atomically finish or discard it
