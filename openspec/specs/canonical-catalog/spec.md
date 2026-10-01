# canonical-catalog Specification

## Purpose

Provide one validated, build-scoped catalog of Afallon entities, world facts, relationships, imagery, and traceable evidence for deterministic queries and publication.

## Requirements

### Requirement: Evidence is validated before catalog mutation

Catalog admission SHALL verify artifact content identities and decode each admitted artifact against its declared schema and collector family before normalization. An invalid field SHALL fail with artifact and record context instead of entering a partially assembled catalog. Optional fields SHALL remain absent when their source contract permits absence.

#### Scenario: An artifact has an invalid supported field
- **WHEN** an admitted artifact has a field that violates its declared schema
- **THEN** catalog assembly fails with the artifact identity and failing field path
- **AND** it does not select a partially assembled catalog

#### Scenario: An optional source field is absent
- **WHEN** a source field permitted to be absent is missing
- **THEN** admission accepts the record
- **AND** typed decoding retains the missing field rather than treating its absence as an invalid field

### Requirement: The catalog is the normalized source of truth

A successful catalog SHALL bind canonical entities, authored sources, placements, observations, relations, spatial registrations, imagery, provenance, exclusions, and coverage state to one build and one catalog identity. Downstream queries and publication SHALL use the sealed catalog rather than a second normalized input, and their outputs SHALL identify the catalog and build they used.

#### Scenario: Publication receives a mismatched catalog
- **WHEN** a publication plan names a build or catalog identity different from its verified sealed catalog
- **THEN** publication rejects the plan before selecting output

#### Scenario: A catalog query is repeated
- **WHEN** the same sealed catalog is queried again
- **THEN** the query returns equivalent records in deterministic order with the catalog and build identities

### Requirement: Coverage issues and occurrences are separate

The catalog SHALL identify distinct coverage issues by build and semantic subject and retain attributable observations separately. It SHALL retain the source artifact, record path, and originating run of each observation, without multiplying a distinct issue for repeated observations.

#### Scenario: An issue recurs in multiple runs
- **WHEN** the same semantic issue is observed in several runs
- **THEN** the catalog retains one issue and the attributable occurrence and run records

#### Scenario: A previously observed issue is resolved
- **WHEN** later evidence resolves an issue with historical occurrences
- **THEN** its resolution evidence is stored with the issue
- **AND** the earlier occurrences remain attributable

### Requirement: Catalog assembly is atomic and idempotent

Catalog assembly SHALL validate stable identities, relational constraints, build agreement, and source references in one candidate. A failure SHALL NOT select partial identities, facts, or metadata. Equivalent verified inputs, settings, schemas, and implementation SHALL produce the same logical catalog identity and equivalent query results without duplicate facts.

#### Scenario: Candidate placement identities collide
- **WHEN** two distinct authored placements claim the same identity with conflicting facts
- **THEN** assembly rejects the candidate rather than combining the placements
- **AND** the existing selected catalog remains unchanged

#### Scenario: Equivalent evidence is assembled twice
- **WHEN** the same validated inputs, settings, schemas, and implementation are assembled again
- **THEN** both candidates have the same logical identity and equivalent ordered facts
- **AND** each candidate records the content hash of its own database bytes

### Requirement: Every published fact remains traceable

Canonical entities and normalized relations SHALL retain provenance to admitted evidence or reviewed decisions. Registered derived facts SHALL retain their source inputs, and an unproven relationship SHALL remain absent or unresolved instead of becoming a published inference.

#### Scenario: A derived quest association is used in publication
- **WHEN** publication queries a quest association derived from admitted relationship evidence
- **THEN** its catalog derivation identifies the rule, version, and pointer to the source association record

#### Scenario: Evidence cannot establish a relationship
- **WHEN** admitted evidence does not establish a requested relation
- **THEN** the catalog records an unresolved reference or leaves the relation absent according to the source contract
- **AND** it does not create a plausible but unsupported relation

### Requirement: Catalog admission consumes current evidence references

Catalog admission SHALL accept verified successful scan runs, registered imagery, reviewed spatial evidence, and a build-scoped coverage review and policy. It SHALL verify source manifests, immutable references, declared schemas, and build agreement before admitting facts, without requiring a separate edited database or normalized projection.

#### Scenario: Current scan evidence is assembled
- **WHEN** an operator supplies a valid current scan and its reviewed inputs
- **THEN** the catalog command assembles a candidate without a conversion step
- **AND** it retains each target, collector family, and observation origin

#### Scenario: An input belongs to another build
- **WHEN** admitted evidence or imagery declares a build different from the catalog plan
- **THEN** admission rejects the candidate with the conflicting build identities
- **AND** the previously selected catalog remains unchanged

### Requirement: Supported semantics cross a typed decoding boundary

Fields consumed by supported gameplay rules SHALL be validated and decoded into typed facts before normalization. Opaque source evidence SHALL remain attributable separately; missing, unsupported, unresolved, and invalid values SHALL NOT become an inferred published fact. Canonical entity, authored source, placement, and observation identities SHALL remain distinct.

#### Scenario: A supported field has an invalid shape
- **WHEN** a merchant, loot, quest, spawn, or spatial field violates its decoded contract
- **THEN** catalog construction fails with its artifact and record path
- **AND** normalization does not substitute a gameplay value

#### Scenario: Evidence includes an unsupported semantic value
- **WHEN** an observed enum or task type has no supported interpretation
- **THEN** the catalog records an attributable coverage issue
- **AND** it does not derive an unsupported public relationship from that value

### Requirement: Catalog construction has one atomic selection boundary

All catalog construction paths SHALL apply the same identity, referential, provenance, and coverage constraints to a candidate containing source identities, facts, imagery metadata, and catalog metadata. Selection SHALL occur only after that candidate has been sealed successfully.

#### Scenario: A constraint fails after identity insertion
- **WHEN** a later relation violates a constraint after candidate identities have been inserted
- **THEN** the candidate transaction rolls back the identities and facts together
- **AND** the successful catalog reference remains unchanged

### Requirement: Sealed catalog bytes are immutable downstream inputs

Successful catalog registration SHALL bind its logical identity to a verified database object. Publication SHALL read that object without modifying it; changes to registered imagery or reviewed facts SHALL require another catalog assembly. Catalog evidence SHALL resolve through immutable content identities rather than working-directory paths.

#### Scenario: New imagery is registered
- **WHEN** an operator supplies new imagery for publication
- **THEN** it participates in a new catalog assembly
- **AND** the sealed prior catalog remains valid

#### Scenario: Publication fails
- **WHEN** a publication attempt fails after opening the sealed catalog
- **THEN** its database bytes and recorded object identity remain unchanged

### Requirement: Derived catalog facts retain executable provenance

For registered derivations, the catalog SHALL return a versioned rule and validated pointers to admitted input evidence. These pointers SHALL identify source-record positions independently of native domain IDs, and runtime observation context SHALL remain distinct from authored identity.

#### Scenario: A native ID differs from its source index
- **WHEN** a relationship record's native ID differs from its position in the source artifact
- **THEN** its evidence pointer resolves to the actual source record
- **AND** its native ID remains its domain identifier

#### Scenario: A relationship needs several sources
- **WHEN** a derived relation uses canonical and placement evidence
- **THEN** its derivation retains pointers to both inputs
- **AND** it does not infer an effective chance from a raw rate without supporting evidence

### Requirement: Player-facing facts are typed per kind

The catalog SHALL decode supported item, NPC, quest, and place fields into typed facts with their applicable references and provenance. These include item equipment, stats, sockets, prices and requirements; NPC level, role, faction, ability and reward facts; quest chains, objectives, requirements and rewards; and place levels, guide descriptions and bosses. Opaque source payloads SHALL NOT substitute for these decoded facts.

#### Scenario: An item record has typed stats
- **WHEN** an item names a stat with an ID, amount, and percentage flag
- **THEN** its typed stat row includes a reference to the stat entity and its source evidence
- **AND** an unknown stat ID remains an unresolved reference with a coverage issue rather than silently disappearing

#### Scenario: A quest objective references a target
- **WHEN** a task names a creature to kill, item to obtain or use, character to talk to, scene to enter, or ability to learn
- **THEN** the quest objective retains its task type, target reference, and captured count
- **AND** an unsupported task type produces a coverage issue

### Requirement: Linked support families are canonical kinds

The catalog SHALL admit available ability, effect, recipe, crafting station, faction, currency, skill, class, race, enchantment, gear set, and species records as stable canonical entities. Typed relations SHALL resolve admitted targets by entity key, and missing targets SHALL remain unresolved with an attributable issue.

#### Scenario: A boss phase names an ability
- **WHEN** an NPC phase names an admitted ability
- **THEN** the phase links to that canonical ability with its name, icon, and captured description when available

#### Scenario: A recipe names an item
- **WHEN** a recipe has captured rank, station, skill, product, and material records
- **THEN** the catalog retains the typed recipe ranks and quantities and references admitted station, skill, and item entities
- **AND** a missing referenced entity remains unresolved

### Requirement: Reverse relations are queryable from the catalog

The catalog SHALL provide query rows that identify both endpoints of supported item-source, quest-entity, and place-entity relations. Publication SHALL derive the views at both endpoints from these catalog relations rather than storing a second normalized relation.

#### Scenario: Vendors stock an item
- **WHEN** several vendors sell the same item
- **THEN** the queried vendor rows identify the item, vendor, price, currency, requirements, and known placements
- **AND** both item-source and vendor-stock views can use those rows

### Requirement: Entity artwork is registered with provenance

The catalog SHALL register extracted artwork by content identity and source name, with entity and role bindings and source-record provenance. Entities MAY lack artwork, and multiple entities MAY bind to one asset.

#### Scenario: Two items share an icon sprite
- **WHEN** two admitted items use the same extracted image bytes
- **THEN** the catalog registers one asset and two entity bindings
- **AND** each binding retains its artwork-record provenance
