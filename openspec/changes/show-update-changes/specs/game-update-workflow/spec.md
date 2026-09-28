## ADDED Requirements

### Requirement: New-build acceptance includes a reader comparison

A new-build update SHALL compare the candidate catalog with the previous accepted build's retained catalog before publishing. The comparison SHALL stay distinct from the operator's reconciliation report. The publication candidate SHALL include the reader comparison and its matched Steam news reference before staging. The update report SHALL identify the compared catalog and the comparison artifact. Selection SHALL fail if the comparison is missing, uses another build, or fails publication verification. The operator SHALL accept the catalog and publication together. Deployment SHALL remain a separate explicit action.

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
