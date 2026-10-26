# game-update-workflow Specification

## Purpose

Define how the compendium admits a new Afallon build without mixing build-scoped evidence, trusting release-note claims as data, or replacing a verified publication before reconciliation completes.

## Requirements

### Requirement: An update has recomputable installation identity

The update workflow SHALL record the Steam build identifier, Steam installation state, and hashes of every game input used by extraction before and after Steam acts.

#### Scenario: Steam installs a new build
- **WHEN** an operator updates an Afallon copy that is fully installed or has a pending update
- **THEN** the result records the previous and current build identifiers, installation states, and current input hashes
- **AND** later extraction independently verifies the same current identity

#### Scenario: Steam has unfinished work after completion
- **WHEN** Steam reports completion but the application manifest does not settle to fully installed
- **THEN** the workflow fails without claiming a current build
- **AND** no scan, catalog, or publication reference changes

#### Scenario: An update has recomputable installation identity
- **WHEN** Steam acts during an update.
- **THEN** The workflow records the Steam build identifier, installation state, and hashes of every extraction input both before and after Steam acts.

### Requirement: Release versions remain descriptive metadata

A release version SHALL remain descriptive metadata and SHALL NOT replace recomputable identity.

#### Scenario: Release versions remain descriptive metadata
- **WHEN** An update records a release version.
- **THEN** The release version remains descriptive metadata rather than replacing recomputable identity.

### Requirement: Invalid Steam manifests are rejected

The workflow SHALL reject an absent, unreadable, or wrong-application Steam manifest.

#### Scenario: Invalid Steam manifests are rejected
- **WHEN** The supplied Steam manifest belongs to the wrong application.
- **THEN** The workflow rejects the manifest.

### Requirement: Success receipts require completed installation

The workflow MAY start from a valid pending installation state, but it SHALL NOT produce a success receipt until Steam completes successfully and the manifest reports fully installed.

#### Scenario: Success receipts require completed installation
- **WHEN** The workflow starts from a valid pending installation state and Steam completes successfully but the manifest does not report fully installed.
- **THEN** The workflow produces no success receipt.

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

Each update report SHALL reference the registered release notes of the new build.

#### Scenario: New authored items and quests use existing contracts
- **WHEN** the current collectors and decoders accept the new build's items, quests, rewards, and relations
- **THEN** the candidate catalog includes them through the existing entity and relation model
- **AND** acceptance records their observed identities and counts rather than release-note totals alone

#### Scenario: A system exposes only mutable player state
- **WHEN** mail, bank, auction, friends, or Dungeon Finder data exists only as save or session state
- **THEN** the update report records it as outside the static authored-data contract
- **AND** the publication does not present sampled player state as canonical game content

#### Scenario: A follow-up release names other risks
- **WHEN** the release notes of the new build name teleport loading and quest hand-ins
- **THEN** the update report declares those areas with dispositions and new-build evidence
- **AND** it does not require dispositions for areas that only an earlier release named

#### Scenario: Patch-specific data risks receive explicit checks
- **WHEN** An update report is produced for a new build.
- **THEN** The report references that build's registered release notes.

### Requirement: Update reports declare release-note risks once

Each update report SHALL declare the risk areas that the registered release notes of the new build name, each once.

#### Scenario: Update reports declare release-note risks once
- **WHEN** The new build's registered release notes name teleport loading and quest hand-ins as risk areas.
- **THEN** The update report declares each of those risk areas once.

### Requirement: Risk dispositions require new-build evidence

Each declared area SHALL be classified as supported unchanged, supported after a contract change, absent from authored data, or unsupported, with evidence from the new build.

#### Scenario: Risk dispositions require new-build evidence
- **WHEN** An update report declares a risk area.
- **THEN** The area receives one of the four specified classifications with evidence from the new build.

### Requirement: Risk dispositions stay within release-note scope

A report SHALL NOT carry a disposition for an area that its release notes do not name.

#### Scenario: Risk dispositions stay within release-note scope
- **WHEN** An area appeared in earlier release notes but is not named in the report's release notes.
- **THEN** The report carries no disposition for that area.

### Requirement: Player-state publication requires an authored-data contract

Player-state systems SHALL remain unpublished unless a durable authored-data contract is established.

#### Scenario: Player-state publication requires an authored-data contract
- **WHEN** A player-state system has no established durable authored-data contract.
- **THEN** The system remains unpublished.

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

### Requirement: Publication parity preserves published entities

The parity gate SHALL compare entity keys from search entries, page documents, NPC variants, ability version member keys, embedded item gear sets, recipe keys embedded in item Crafting sections, and recipe keys of skill recipe rows.

#### Scenario: Four records become one character page
- **WHEN** four baseline NPC pages become one candidate page with all four record keys in its variants
- **THEN** the entity-coverage parity check accepts the grouped records

#### Scenario: Gear set moves onto item pages
- **WHEN** a baseline has a gear set page and the candidate embeds the set in member items
- **THEN** the set key remains covered without a gear set page or list

#### Scenario: Recipe pages move onto item pages
- **WHEN** a baseline has recipe pages and the candidate embeds each recipe key in the Crafting section of its product or in a skill recipe row
- **THEN** each recipe key remains covered without a recipe page

#### Scenario: A member record disappears
- **WHEN** a baseline record key occurs in none of the candidate's search, page, variant, version, embedded set, or embedded recipe keys
- **THEN** the parity gate reports the missing key

#### Scenario: A listed record leaves the publication
- **WHEN** a baseline record key is missing from the candidate and the exclusion list of the candidate names that key
- **THEN** the parity gate accepts the removal

#### Scenario: Publication parity preserves published entities
- **WHEN** A baseline recipe key is embedded in a candidate item's Crafting section.
- **THEN** The parity gate includes that embedded recipe key in its entity-key comparison.

### Requirement: Parity does not require baseline URLs

The parity gate SHALL NOT require a baseline URL to remain.

#### Scenario: Parity does not require baseline URLs
- **WHEN** A baseline entity remains covered in the candidate but its baseline URL does not remain.
- **THEN** The parity gate does not require the baseline URL.

### Requirement: Parity requires lists only for retained list kinds

The parity gate SHALL require a list only for a kind that still has a list.

#### Scenario: Parity requires lists only for retained list kinds
- **WHEN** A candidate no longer has a list for a kind.
- **THEN** The parity gate does not require a list for that kind.

### Requirement: Baseline reading uses field shape

The parity gate SHALL read a baseline by its field shape without requiring today's schemas.

#### Scenario: Baseline reading uses field shape
- **WHEN** A baseline has a readable field shape but does not conform to today's schemas.
- **THEN** The parity gate reads the baseline by its field shape without requiring today's schemas.

### Requirement: Missing baseline keys require reviewed exclusions

The parity gate SHALL accept a missing baseline key only when the reviewed exclusion list of the candidate names that key.

#### Scenario: Missing baseline keys require reviewed exclusions
- **WHEN** A baseline key is missing and the candidate's reviewed exclusion list does not name it.
- **THEN** The parity gate does not accept the missing key.

### Requirement: Quitting confirms runtime cleanup

The quit tool SHALL release runtime ownership with a clean receipt before the game exits. It SHALL return after the HotRepl listener closes.

#### Scenario: Operator quits the game
- **WHEN** the operator runs the quit tool against a loaded game
- **THEN** the runtime writes its clean release receipt
- **AND** the tool returns after the listener closes

### Requirement: Database-wide artwork is collected once per update scan

A scan plan SHALL name at most one artwork target, and only that target SHALL collect the build's database artwork. Every other target of the plan SHALL skip artwork collection, and a plan that names no artwork target SHALL collect no artwork. The artwork target SHALL be one of the plan's targets. Catalog assembly SHALL require artwork evidence from its canonical target and SHALL fail with the target identity when that target has none.

#### Scenario: A shard of scene targets is scanned
- **WHEN** a scan plan lists eight scene targets and names no artwork target
- **THEN** no target of the run collects artwork
- **AND** every target still collects its scene, producer, placement, relationship, and spatial evidence

#### Scenario: The canonical scene is scanned
- **WHEN** a scan plan names `build-scene:44` as its artwork target
- **THEN** only that target collects and registers the build's artwork

#### Scenario: A plan names an artwork target outside its targets
- **WHEN** a scan plan names an artwork target that none of its targets has
- **THEN** the plan is rejected before the game is touched

#### Scenario: The canonical target has no artwork
- **WHEN** a catalog plan names a canonical target whose scan collected no artwork
- **THEN** catalog assembly fails and names the canonical target
- **AND** no catalog is selected without artwork
