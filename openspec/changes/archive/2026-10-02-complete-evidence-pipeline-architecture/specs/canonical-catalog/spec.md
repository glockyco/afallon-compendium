## Purpose

Build one sealed catalog from current evidence contracts while preserving domain identities, validated semantics, and traceable derivations.

## ADDED Requirements

### Requirement: Catalog admission consumes current evidence references

Catalog admission SHALL accept successful current scan runs, registered imagery, reviewed spatial evidence, and coverage policy for one build. It SHALL verify their immutable references and declared schemas before admitting facts. No production path SHALL require a retired manifest format, manually edited database, or alternate normalized projection.

#### Scenario: Current scan evidence is assembled
- **WHEN** an operator supplies a valid current scan and its reviewed inputs
- **THEN** the supported catalog command produces a selectable catalog without conversion scripts
- **AND** the catalog retains target, family, and observation provenance

#### Scenario: A source belongs to another build
- **WHEN** any admitted source declares a different build
- **THEN** catalog construction rejects the candidate with both identities
- **AND** the previously selected catalog remains unchanged

### Requirement: Supported semantics cross a typed decoding boundary

Fields used by domain rules SHALL be decoded into validated domain values before normalization. Opaque source payloads SHALL remain separately attributable. Missing, unsupported, unresolved, and invalid values SHALL NOT collapse into false, zero, empty collections, or inferred facts. Entity, authored source, placement, and runtime observation identities SHALL remain distinct.

#### Scenario: Gameplay evidence has an invalid supported field
- **WHEN** a field consumed by a supported merchant, loot, quest, spawn, or spatial rule violates its contract
- **THEN** decoding rejects it with object identity and record path
- **AND** normalization does not publish a default value instead

#### Scenario: Evidence contains an unknown field
- **WHEN** an opaque field has no supported semantic rule
- **THEN** its original evidence remains available
- **AND** it does not create an inferred public relation

### Requirement: Catalog construction has one atomic selection boundary

All catalog construction paths SHALL enforce the same identity, referential, provenance, and coverage constraints. Identity registration, facts, imagery metadata, and catalog metadata SHALL form one transactional candidate. Failed assembly SHALL leave no partial selected catalog. Equivalent inputs and implementation SHALL produce the same logical identity and deterministic query results.

#### Scenario: Failure follows identity insertion
- **WHEN** a later relation violates a constraint after identities are inserted
- **THEN** the candidate transaction rolls back identities and facts together
- **AND** the successful catalog reference and its bytes remain unchanged

#### Scenario: Equivalent evidence is assembled twice
- **WHEN** input identities, reviewed settings, schemas, and implementation are unchanged
- **THEN** both catalogs have equal logical identities and equivalent ordered facts
- **AND** each catalog independently records its exact database byte hash

### Requirement: Sealed catalog bytes are immutable downstream inputs

Successful catalog registration SHALL bind logical identity to a verified database object. Publication and query consumers SHALL read the sealed object without modification. New imagery or reviewed facts SHALL require a new catalog identity. Working-directory paths SHALL NOT be required to resolve catalog evidence.

#### Scenario: An operator adds imagery
- **WHEN** a new imagery registration is supplied for publication
- **THEN** it first participates in a newly assembled catalog
- **AND** the old catalog's hash and logical identity remain valid

#### Scenario: Publication fails
- **WHEN** publication fails after opening a catalog
- **THEN** the catalog's bytes and recorded hash remain unchanged
- **AND** the same catalog remains valid input for another attempt

### Requirement: Derived catalog facts retain executable provenance

Every published fact SHALL trace to validated evidence or a reviewed decision. A derived fact SHALL name its versioned rule and input references. Evidence pointers SHALL address the actual source record, independently of native IDs or display labels. Runtime observation context SHALL remain available without becoming authored identity.

#### Scenario: Native IDs differ from array positions
- **WHEN** a relationship record has a native ID different from its array index
- **THEN** its evidence pointer resolves to that record's actual index
- **AND** the native ID remains the domain identifier rather than the pointer

#### Scenario: A relationship uses multiple sources
- **WHEN** a public relationship derives from canonical and placement evidence
- **THEN** the catalog returns both evidence references and its derivation rule
- **AND** unresolved effective probabilities remain absent rather than inferred from raw rates
