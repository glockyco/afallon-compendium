# coverage-accounting Specification

## Purpose

Determine whether build-scoped discovered gameplay evidence satisfies an explicit reviewed policy before a catalog can qualify for complete release. Keep operator accounting separate from reader-facing publication gaps.

## Requirements

### Requirement: Coverage obligations define the accounted content universe

Coverage accounting SHALL bind its discovery inventories, scope policy, review, required evidence families, and closure to one build. It SHALL derive stable subject-and-family obligations from discovered records rather than diagnostic wording or a caller-selected target list. Missing inventories, an empty discovered universe, incomplete enumeration, or a review that omits discovered subjects SHALL leave closure invalid; an empty caller-supplied source list SHALL NOT establish completeness.

#### Scenario: An empty catalog has no recorded issues
- **WHEN** release evaluation has no nonempty registered discovery inventory or required positive obligations
- **THEN** it rejects complete-release status and reports the missing coverage basis
- **AND** zero unresolved issues does not change that result

#### Scenario: Discovery finds another source
- **WHEN** admitted inventory evidence discovers another source for a required family
- **THEN** accounting derives that source's obligations
- **AND** a closure that omits the new subject or its inventory is invalid

### Requirement: Every obligation has an attributable disposition

Each obligation SHALL retain its originating inventory and evidence pointers and distinguish verified, evidence-backed not-applicable, reviewed-excluded, unsupported, unreachable, failed, and not-attempted dispositions. A review decision SHALL identify admitted evidence and a review identity when it asserts a disposition other than not-attempted. A policy SHALL NOT accept an exclusion of reachable gameplay content as a way to satisfy a required obligation.

#### Scenario: A required source is unreachable
- **WHEN** a required source is unreachable in a scan and has no accepted evidence-backed review decision
- **THEN** the effective unreachable disposition remains attributable to its discovery evidence
- **AND** that obligation blocks completeness

#### Scenario: A source is outside the required universe
- **WHEN** reviewed evidence identifies a non-gameplay or otherwise non-reachable subject as outside the declared required universe
- **THEN** an evidence-backed reviewed exclusion can satisfy its obligation if the policy accepts that disposition
- **AND** it does not waive the obligations of reachable gameplay subjects

### Requirement: Release evaluates positive closure and integrity together

A complete release SHALL require matching build and catalog identities, a nonempty catalog, valid references and database integrity, registered spatial bounds, reviewed discovery closure, no unresolved catalog issues or unreviewed exclusions, and acceptable dispositions for every required obligation. Preview SHALL remain available when those identity and integrity requirements pass even if coverage closure remains incomplete. The coverage policy SHALL be a content-identified catalog input, not a publication override.

#### Scenario: All required obligations are satisfied
- **WHEN** review evidence closes the discovered universe, required obligations have accepted dispositions, and identity, reference, database, and spatial checks pass
- **THEN** the complete-release gate accepts the catalog

#### Scenario: Optional captures are missing
- **WHEN** required gameplay and game-map obligations pass but optional captures have unsatisfied obligations
- **THEN** a policy that does not require captures can accept complete release without claiming complete capture coverage
- **AND** a policy requiring captures rejects that incomplete candidate

#### Scenario: A preview has corrupt evidence
- **WHEN** a requested preview has invalid reference integrity or a mismatched catalog build
- **THEN** the gate rejects the preview rather than treating corruption as incomplete coverage

### Requirement: Issue reports preserve observations without inflating obligations

Operator coverage reports SHALL distinguish unresolved semantic issues, their attributable occurrences, unsatisfied required and optional obligations, and reviewed exclusions. Gate totals SHALL derive from the sealed catalog state; repeated observations of one issue SHALL NOT create additional coverage obligations. These accounting totals SHALL remain outside the reader-facing coverage resource.

#### Scenario: One issue occurs in many scans
- **WHEN** one semantic issue occurs in several scans or target observations
- **THEN** the catalog reports the issue separately from its occurrences and their originating runs
- **AND** the repeated observations do not multiply the discovered subject's obligations

#### Scenario: Coverage is reported to an operator
- **WHEN** an operator inspects the catalog gate or publication result
- **THEN** its issue, occurrence, disposition, and obligation totals reflect the sealed catalog
- **AND** the reader-facing coverage page displays published-page gaps rather than operator accounting totals
