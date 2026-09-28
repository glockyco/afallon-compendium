## ADDED Requirements

### Requirement: Region templates keep their source identity

Each observed region template SHALL have a stable entity key derived from its string dictionary key. Its runtime ID SHALL NOT identify it. Region instances and artwork SHALL resolve through the same template key. Distinct templates SHALL stay distinct even when they share a name or runtime ID. Missing or ambiguous source keys SHALL produce an explicit coverage issue instead of a guessed link. A reader SHALL see a formatted name and a readable qualifier, not the source key.

#### Scenario: Two region templates share a runtime ID
- **WHEN** two templates have different dictionary keys and the same runtime ID
- **THEN** the catalog keeps two entities with distinct keys
- **AND** each observed instance resolves to the template that it references

#### Scenario: Region template has no usable source key
- **WHEN** an observed region instance cannot resolve to one dictionary key
- **THEN** the publication does not assign it to a guessed zone
- **AND** a coverage issue records the unresolved link

#### Scenario: Region names match
- **WHEN** two region templates have the same display name
- **THEN** their published references use readable qualifiers to tell them apart
- **AND** neither reference exposes its dictionary key
