## ADDED Requirements

### Requirement: Publication parity checks entity coverage

The publication parity gate SHALL require every entity key that the baseline publishes to remain published by the candidate, as a page, as a variant of a page, or as a search record. It SHALL NOT require a baseline page URL to remain.

#### Scenario: Records are grouped into one page
- **WHEN** the candidate replaces four Fenric Doryn pages with one page that lists the four records as variants
- **THEN** the parity gate passes

#### Scenario: An entity disappears
- **WHEN** the candidate publishes an NPC record neither as a page nor as a variant
- **THEN** the parity gate fails and names the record

### Requirement: Quitting confirms runtime cleanup

The quit tool SHALL release runtime ownership with a confirmed cleanup receipt before the game quits, and SHALL return when the game exits.

#### Scenario: Operator quits the game
- **WHEN** the operator runs the quit tool against a loaded game
- **THEN** the tool reports a clean release and returns after the process exits
