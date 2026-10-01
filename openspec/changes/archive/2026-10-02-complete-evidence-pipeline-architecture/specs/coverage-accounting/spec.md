## Purpose

Establish publication completeness from explicit build-scoped obligations and verified evidence instead of the absence of recorded diagnostics.

## ADDED Requirements

### Requirement: Coverage obligations define the accounted content universe

A coverage review SHALL identify its build, discovery inventory, scope policy, required source or target families, and closure evidence. Obligations SHALL have stable identities independent of diagnostic wording. Missing obligations or unreviewed discovery SHALL remain incomplete. A caller-supplied empty source list SHALL NOT establish completeness.

#### Scenario: An empty catalog has no recorded issues
- **WHEN** release evaluation receives no positive discovery and obligation evidence
- **THEN** it rejects complete-release status
- **AND** it explains the missing coverage basis even when the issue count is zero

#### Scenario: Discovery finds another reachable source
- **WHEN** new verified evidence adds a required source to the supported build
- **THEN** coverage creates the applicable obligations and invalidates any closure that does not account for them
- **AND** prior observations do not automatically satisfy the new obligations

### Requirement: Every obligation has an attributable disposition

An obligation SHALL distinguish verified, evidence-backed not-applicable, reviewed excluded, unsupported, unreachable, failed, and not-attempted dispositions. Dispositions SHALL retain source evidence and review identity where required. Release policy SHALL NOT permit exclusion of required reachable content merely to clear a gate.

#### Scenario: A required source is unreachable during one visit
- **WHEN** a scan cannot reach a required source
- **THEN** its obligation remains attributable as unreachable and blocks completeness unless separate reviewed evidence proves it outside the required universe
- **AND** it is not rewritten as verified or not applicable

#### Scenario: A source is proven outside scope
- **WHEN** reviewed evidence proves that an obligation is non-gameplay or otherwise outside the declared required universe
- **THEN** the policy can accept its reviewed exclusion without erasing its evidence
- **AND** the exclusion does not reduce the declared requirement for full reachable gameplay coverage

### Requirement: Release evaluates positive closure and integrity together

A complete release SHALL require valid build and catalog identities, reference integrity, spatial registration, reviewed discovery closure, and acceptable dispositions for every required obligation. An incomplete preview SHALL remain possible only when its integrity requirements pass. Coverage policy SHALL be a hashed catalog input, not an ad hoc publication override.

#### Scenario: All obligations are satisfied
- **WHEN** verified evidence and accepted dispositions cover the reviewed universe and all integrity checks pass
- **THEN** the complete-release gate accepts the catalog
- **AND** no unconditional incomplete sentinel prevents that positive result

#### Scenario: Optional captures are missing
- **WHEN** required game-map obligations pass but optional overworld captures remain incomplete
- **THEN** the game-map policy can accept release without claiming complete capture coverage
- **AND** a policy that explicitly requires those captures remains incomplete

#### Scenario: A preview has corrupt evidence
- **WHEN** a requested preview has a broken reference or mismatched build
- **THEN** it is rejected rather than accepted as merely incomplete

### Requirement: Issue reports preserve observations without inflating obligations

Coverage issues and their occurrences SHALL remain separate from obligations. Reports SHALL distinguish unresolved issues, repeated occurrences, unsatisfied obligations, and reviewed exclusions. Issue history SHALL retain actual originating runs and source keys. All summary counts SHALL derive from the final catalog state.

#### Scenario: One issue occurs in many scans
- **WHEN** the same semantic issue appears in several target observations
- **THEN** the catalog records one issue and all attributable occurrences
- **AND** repeated observations do not multiply the coverage obligation

#### Scenario: Coverage is reported to an operator
- **WHEN** the operator reads a run report or publication metadata
- **THEN** totals and completion status agree with the sealed catalog
- **AND** the player interface does not acquire new coverage notices or evidence panels
