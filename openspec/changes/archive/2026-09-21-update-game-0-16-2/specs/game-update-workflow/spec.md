## Purpose

Define how the compendium admits a new Afallon build without mixing build-scoped evidence, trusting release-note claims as data, or replacing a verified publication before reconciliation completes.

## ADDED Requirements

### Requirement: An update has recomputable installation identity

The update workflow SHALL record the Steam build identifier, Steam installation state, and hashes of every game input used by extraction before and after Steam acts. A release version SHALL remain descriptive metadata and SHALL NOT replace recomputable identity. The workflow SHALL reject an absent, unreadable, or wrong-application Steam manifest. It MAY start from a valid pending installation state, but it SHALL NOT produce a success receipt until Steam completes successfully and the manifest reports fully installed.

#### Scenario: Steam installs a new build
- **WHEN** an operator updates an Afallon copy that is fully installed or has a pending update
- **THEN** the result records the previous and current build identifiers, installation states, and current input hashes
- **AND** later extraction independently verifies the same current identity

#### Scenario: Steam has unfinished work after completion
- **WHEN** Steam reports completion but the application manifest does not settle to fully installed
- **THEN** the workflow fails without claiming a current build
- **AND** no scan, catalog, or publication reference changes

### Requirement: Steam completion is observed, not inferred

An automated update SHALL distinguish a request accepted by Steam from work completed by Steam. It SHALL report success only after Steam records successful completion for Afallon and the application manifest settles to a fully installed state. A validation that changes no files SHALL finish successfully without waiting for the manifest to change.

#### Scenario: The installed build is already current
- **WHEN** Steam validates Afallon successfully and does not rewrite its manifest
- **THEN** the workflow reports the existing build as current
- **AND** it does not wait for a build-identifier change

#### Scenario: Steam accepts but does not complete the request
- **WHEN** the client accepts the validation request but never records completed Afallon work
- **THEN** the workflow times out with attributable Steam log and manifest evidence
- **AND** it does not report an update or successful validation

### Requirement: New-build work remains candidate-only until reconciliation passes

Every scan, reviewed input, catalog, publication, and stage created during an update SHALL carry the new build identity. New-build candidates SHALL NOT replace the previously selected successful references or production stage until all update acceptance checks pass. Evidence or reviewed inputs from another build SHALL be rejected rather than copied forward by path.

#### Scenario: A new-build scan fails
- **WHEN** one target or required collector fails after earlier targets succeed
- **THEN** the failed run remains auditable as new-build evidence
- **AND** the selected prior-build scan, catalog, publication, and stage remain unchanged

#### Scenario: A reviewed profile names the prior build
- **WHEN** catalog assembly receives a spatial profile or capture from the prior build
- **THEN** assembly rejects the candidate with both build identities
- **AND** it does not reinterpret the input as valid because scene labels match

### Requirement: Reconciliation starts from discovered behavior

The update workflow SHALL inventory the new build before it changes supported contracts or reviewed inputs. Release notes SHALL define review risks, not authoritative records or expected counts. Reconciliation SHALL account for added, removed, and changed scenes, streamed sources, authored entities, relationships, placement families, artwork, and supported fields. Unknown source shapes or values SHALL fail at the typed boundary instead of becoming defaults.

#### Scenario: Release notes omit a changed source
- **WHEN** new-build discovery differs from the prior build outside a named release-note area
- **THEN** the difference remains part of reconciliation
- **AND** candidate acceptance cannot ignore it because the release notes omitted it

#### Scenario: A supported field changes shape
- **WHEN** a 0.16.2 record no longer satisfies its collector or decoder contract
- **THEN** extraction or catalog assembly fails with record and field context
- **AND** no fallback value enters publication

### Requirement: Spatial review is rebuilt for the merged outdoor world

The 0.16.2 workflow SHALL derive scene and streaming identity from the installed build. It SHALL replace the prior three-scene outdoor assumptions with reviewed evidence for the merged world. Teleports, flight destinations, and other extracted travel endpoints SHALL resolve to verified map spaces and coordinates before the new publication can be selected. Prior-build captures SHALL NOT establish 0.16.2 spatial coverage.

#### Scenario: Three outdoor scenes become one world
- **WHEN** discovery reports the 0.16.2 merged outdoor structure
- **THEN** the reviewed map-space profile binds the current scene and streamed sources to one shared world
- **AND** no placement depends on a retired outdoor scene binding

#### Scenario: A travel endpoint cannot be placed
- **WHEN** an extracted teleport or flight connection has no verified current-build endpoint
- **THEN** the candidate remains incomplete or fails according to coverage policy
- **AND** publication does not invent a location from release-note text or prior-build coordinates

### Requirement: Patch-specific data risks receive explicit checks

The 0.16.2 reconciliation SHALL explicitly check runtime evidence for adventurers and roles; dungeon quests and rewards; swords, trinkets, rings, equipment slots, and weapon proficiency; Healing Power; loot changes; bankers and auctioneers; and the flight network. Each area SHALL be classified as supported unchanged, supported after a contract change, absent from authored data, or unsupported with evidence. Player-state systems SHALL remain unpublished unless a durable authored-data contract is established.

#### Scenario: New authored items and quests use existing contracts
- **WHEN** the current collectors and decoders accept the 0.16.2 items, quests, rewards, and relations
- **THEN** the candidate catalog includes them through the existing entity and relation model
- **AND** acceptance records their observed identities and counts rather than release-note totals alone

#### Scenario: A system exposes only mutable player state
- **WHEN** mail, bank, auction, friends, or Dungeon Finder data exists only as save or session state
- **THEN** the update report records it as outside the static authored-data contract
- **AND** the publication does not present sampled player state as canonical game content

### Requirement: Selection requires an auditable update report

Before new-build selection, the workflow SHALL produce an update report that binds the previous and current installation identities, candidate run identities, reviewed spatial inputs, schema changes, discovered differences, release-note risk dispositions, coverage result, and verification results. Selection SHALL require a successful full candidate scan, sealed catalog, static publication, and representative runtime and browser checks. Deployment SHALL remain a separate explicit action.

#### Scenario: Candidate verification passes
- **WHEN** all required targets, integrity gates, patch-specific checks, and representative interface checks pass
- **THEN** the operator can atomically select the new scan, catalog, publication, and production stage
- **AND** the update report identifies the selected artifacts and retained rollback publication

#### Scenario: Publication builds but a representative check fails
- **WHEN** static compilation succeeds but map, search, entity, relation, or coverage behavior is wrong
- **THEN** the 0.16.2 update remains unselected
- **AND** production continues to serve the prior verified publication
