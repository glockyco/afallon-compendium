## Purpose

Provide one Afallon-specific runtime operation that collects consistent, typed evidence from the current scene, selected scenes, and streamed content sources.

## ADDED Requirements

### Requirement: One scan contract covers every runtime target

The scanner SHALL accept an explicit target set containing the current scene, named build scenes, and named streamed sources. Every target type SHALL produce the same snapshot envelope and artifact families, including build identity, target identity, observation context, schema identity, records, coverage results, and diagnostics. Target-specific collectors MAY omit inapplicable record families only by recording that disposition.

#### Scenario: An operator scans the current scene
- **WHEN** the scan target is the current gameplay scene
- **THEN** the result uses the same snapshot envelope and schemas as a planned scene scan
- **AND** it records the current scene and character context

#### Scenario: A record family does not apply to a target
- **WHEN** a target cannot contain a declared record family by verified game semantics
- **THEN** the target result records that family as not applicable with its evidence
- **AND** it does not silently omit the family or report it as extracted

### Requirement: Scan plans are explicit and reproducible

A scan SHALL validate its target identities and settings before acquiring runtime ownership. Its manifest SHALL retain the ordered target plan, build identity, collector schemas, relevant evidence identities, and per-target outcomes. Equivalent plans against equivalent runtime evidence SHALL produce equivalent authored identities and normalized records.

#### Scenario: A plan names an unknown source
- **WHEN** validation cannot bind a requested target to build or discovered-source evidence
- **THEN** the scan fails before changing game state
- **AND** the result identifies the unresolved target

#### Scenario: The same authored source is scanned again
- **WHEN** an equivalent plan scans the same source in the same build
- **THEN** the source and authored placement identities remain stable
- **AND** changed runtime instance identifiers do not create duplicate authored records

### Requirement: One owner controls runtime mutation

A scan SHALL use the existing exclusive runtime ownership protocol for scene loading, source streaming, observation, cancellation, disconnection, and cleanup. It SHALL record all owned state changes and their restoration evidence. A scan SHALL NOT succeed or release ownership for another state-changing operation until cleanup is confirmed.

#### Scenario: A target fails after changing scenes
- **WHEN** collection fails after the scanner loads a different scene or moves the player
- **THEN** cleanup restores the original scene, position, rotation, and owned source state
- **AND** the scan remains unsuccessful until restoration is confirmed

#### Scenario: The host disconnects during collection
- **WHEN** the host disconnects while a scan owns runtime state
- **THEN** runtime-side cleanup completes without a later host request
- **AND** another state-changing operation cannot start before cleanup confirmation

### Requirement: Target failures remain attributable

Each target SHALL end as succeeded, failed, unsupported, or not applicable with its evidence. A failure SHALL retain partial diagnostics without presenting partial records as a successful target. The workflow SHALL distinguish a failed target from an unreachable target and from a target that was never attempted.

#### Scenario: One target fails in a multi-target scan
- **WHEN** collection succeeds for earlier targets and fails for a later target
- **THEN** every target retains its own outcome and diagnostics
- **AND** the workflow does not replace the latest successful complete scan

#### Scenario: A streamed source is unreachable
- **WHEN** runtime evidence establishes that a planned source cannot be reached
- **THEN** the result records unreachable with the supporting evidence
- **AND** it does not report collection failure or successful extraction for that source
