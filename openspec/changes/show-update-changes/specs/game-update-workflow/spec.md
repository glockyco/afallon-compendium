## ADDED Requirements

### Requirement: New-build acceptance includes a reader comparison

A new-build update SHALL compare the candidate catalog with the previous accepted build's retained catalog before publishing.

#### Scenario: New-build candidate passes review
- **WHEN** the operator accepts a verified new-build candidate
- **THEN** its selected publication has the matching What changed page
- **AND** the accepted report identifies the comparison inputs and output

#### Scenario: Baseline is unavailable
- **WHEN** the previous accepted build's catalog cannot be opened or verified
- **THEN** the candidate cannot claim a complete comparison or replace the selected publication

#### Scenario: Publication lacks the comparison
- **WHEN** the candidate catalog passes its gate but the publication omits its update page
- **THEN** acceptance fails and the previous accepted selection remains in place

#### Scenario: New-build acceptance includes a reader comparison
- **WHEN** A new-build update prepares a candidate catalog for publication.
- **THEN** The update compares the candidate catalog with the previous accepted build's retained catalog before publishing.

### Requirement: Reader comparison stays distinct from reconciliation

The comparison SHALL stay distinct from the operator's reconciliation report.

#### Scenario: Reader comparison stays distinct from reconciliation
- **WHEN** A new-build update produces both a reader comparison and an operator reconciliation report.
- **THEN** The reader comparison remains distinct from the operator's reconciliation report.

### Requirement: Staging requires comparison and matched news

The publication candidate SHALL include the reader comparison and its matched Steam news reference before staging.

#### Scenario: Staging requires comparison and matched news
- **WHEN** A publication candidate is ready to be staged.
- **THEN** The candidate includes the reader comparison and its matched Steam news reference before staging.

### Requirement: Update report identifies comparison inputs and artifact

The update report SHALL identify the compared catalog and the comparison artifact.

#### Scenario: Update report identifies comparison inputs and artifact
- **WHEN** An update report is produced for a candidate comparison.
- **THEN** The report identifies the compared catalog and the comparison artifact.

### Requirement: Selection rejects invalid comparisons

Selection SHALL fail if the comparison is missing, uses another build, or fails publication verification.

#### Scenario: Selection rejects invalid comparisons
- **WHEN** Selection is attempted with a comparison that uses another build.
- **THEN** Selection fails.

### Requirement: Catalog and publication are accepted together

The operator SHALL accept the catalog and publication together.

#### Scenario: Catalog and publication are accepted together
- **WHEN** The operator accepts a candidate catalog and publication.
- **THEN** The catalog and publication are accepted together.

### Requirement: Deployment remains explicitly separate

Deployment SHALL remain a separate explicit action.

#### Scenario: Deployment remains explicitly separate
- **WHEN** The operator has accepted a catalog and publication.
- **THEN** Deployment remains a separate explicit action rather than occurring as part of acceptance.
