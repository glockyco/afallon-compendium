## ADDED Requirements

### Requirement: Publication parity preserves published entities

The parity gate SHALL compare entity keys from search entries, page documents, NPC variants, ability version member keys, and embedded item gear sets. It SHALL NOT require a baseline URL to remain. It SHALL require a list only for a kind that still has pages. It SHALL read a baseline by its field shape without requiring today's schemas.

#### Scenario: Four records become one character page
- **WHEN** four baseline NPC pages become one candidate page with all four record keys in its variants
- **THEN** the entity-coverage parity check accepts the grouped records

#### Scenario: Gear set moves onto item pages
- **WHEN** a baseline has a gear set page and the candidate embeds the set in member items
- **THEN** the set key remains covered without a gear set page or list

#### Scenario: A member record disappears
- **WHEN** a baseline record key occurs in none of the candidate's search, page, variant, version, or embedded set keys
- **THEN** the parity gate reports the missing key

### Requirement: Quitting confirms runtime cleanup

The quit tool SHALL release runtime ownership with a clean receipt before the game exits. It SHALL return after the HotRepl listener closes.

#### Scenario: Operator quits the game
- **WHEN** the operator runs the quit tool against a loaded game
- **THEN** the runtime writes its clean release receipt
- **AND** the tool returns after the listener closes
