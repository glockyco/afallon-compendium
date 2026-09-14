## Purpose

Provide one validated relational source of normalized Afallon facts, spatial identities, provenance, coverage issues, and publication queries.

## ADDED Requirements

### Requirement: Evidence is validated before catalog mutation

Every raw artifact SHALL be decoded against its declared schema before its records enter catalog assembly. Validation errors SHALL identify the artifact content identity and the failing record path. Invalid, unknown, or mismatched records SHALL NOT be coerced into trusted catalog values or partially committed.

#### Scenario: An artifact has the right schema name but an invalid field
- **WHEN** a field violates the declared raw schema
- **THEN** catalog assembly fails with the artifact identity and record path
- **AND** no records from that assembly transaction become current

#### Scenario: An optional source field is absent
- **WHEN** the declared schema permits an absent field
- **THEN** the decoder preserves absence according to that schema
- **AND** it does not convert absence into failure, zero, or an empty reference

### Requirement: The catalog is the normalized source of truth

A successful catalog SHALL contain canonical entities, source identities, placements, observations, relations, spatial registrations, provenance, exclusions, and coverage state for one game build. Downstream validation and publication SHALL query that catalog and SHALL NOT consume a second normalized projection as an alternative source. Every downstream artifact SHALL identify the exact catalog content identity from which it was produced.

#### Scenario: Publication receives mismatched normalized inputs
- **WHEN** a requested publication input does not match the selected catalog content identity and build
- **THEN** publication fails before writing current output
- **AND** it reports the expected and supplied identities

#### Scenario: A downstream query is repeated
- **WHEN** the same catalog and query contract are used again
- **THEN** the query returns equivalent records in deterministic order
- **AND** it does not depend on a previously generated projection document

### Requirement: Coverage issues and occurrences are separate

The catalog SHALL store each distinct coverage issue once per build and issue identity. It SHALL store every observed occurrence separately with its source, artifact, record path, and supporting evidence. Release gates and distinct issue totals SHALL count unresolved issues; diagnostic occurrence totals SHALL count occurrences and SHALL be labeled separately.

#### Scenario: One issue appears in many observations
- **WHEN** the same unresolved semantic gap is observed in multiple artifacts or records
- **THEN** the catalog retains one unresolved issue and every evidence occurrence
- **AND** the complete-release gate counts one blocker

#### Scenario: One occurrence is resolved
- **WHEN** new evidence resolves an issue that has several prior occurrences
- **THEN** the issue records its resolution evidence
- **AND** the historical occurrences remain attributable without counting as unresolved blockers

### Requirement: Catalog assembly is atomic and idempotent

Catalog assembly SHALL validate relational constraints, stable identities, build agreement, and required references in one transactional result. Reassembling equivalent validated evidence SHALL produce an equivalent catalog identity and SHALL NOT duplicate entities, placements, relations, issues, or occurrences. A failed assembly SHALL leave the previous successful catalog selectable.

#### Scenario: Candidate placement identities collide
- **WHEN** distinct authored sources produce the same placement identity
- **THEN** assembly rejects the transaction with both source identities
- **AND** it does not merge or partially retain either placement

#### Scenario: Equivalent evidence is assembled twice
- **WHEN** the same validated artifact identities and settings are assembled again
- **THEN** the canonical rows and catalog identity are equivalent
- **AND** no duplicate fact or coverage record is created

### Requirement: Every published fact remains traceable

Every catalog fact used by publication SHALL retain direct provenance to validated evidence or a reviewed project decision. Derived facts SHALL identify their rule and input evidence. Unsupported inferences SHALL remain unresolved rather than appearing as published facts.

#### Scenario: A reader-visible relation is queried
- **WHEN** publication selects a relation for a static asset
- **THEN** the catalog can return its source evidence and any derivation rule
- **AND** the output does not depend on an unrecorded intermediate transformation

#### Scenario: Evidence cannot establish a relationship
- **WHEN** available artifacts do not prove the requested relationship
- **THEN** the catalog retains an unresolved issue or absence as defined by the source schema
- **AND** it does not create a plausible inferred relationship
