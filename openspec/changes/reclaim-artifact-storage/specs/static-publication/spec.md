## ADDED Requirements

### Requirement: Materialized publications share stored bytes

Publication SHALL materialize each publication file from its verified store object. It SHALL use a copy-on-write clone when the publication root's filesystem supports clones, and a byte copy otherwise. It SHALL verify the size and SHA-256 hash of every materialized file before selection. A materialized file SHALL keep its bytes after clean collects its store object.

#### Scenario: A publication root shares the store's volume
- **WHEN** publication materializes a candidate into a publication root on the store's copy-on-write volume
- **THEN** the materialized files use no additional data blocks for bytes that the store already holds
- **AND** every file matches its content identity

#### Scenario: The source object is collected
- **WHEN** clean collects a store object from which a selected publication file was cloned
- **THEN** the publication file keeps its bytes
- **AND** it still matches its content identity
