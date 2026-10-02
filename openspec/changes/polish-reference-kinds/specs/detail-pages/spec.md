## ADDED Requirements

### Requirement: Small reference kinds lead with an answer

Currency, faction, gear set, crafting station, and race pages SHALL each have a single-line identity, a useful primary answer, and meaningful side facts. They SHALL NOT show a full-width strip of one or two counts, reserve a desktop column without content, repeat a fact across adjacent panels, or expose default zero values as a feature. Their relation rows SHALL retain genuinely different values while sharing invariant information outside the rows.

#### Scenario: Currency acquisition
- **WHEN** a reader opens Gold Coin or Corrupted Emerald
- **THEN** the currency page offers the published item's acquisition routes with links to full item sources
- **AND** the ways to spend it and its currency item remain linked

#### Scenario: Honor without a linked item
- **WHEN** a reader opens Honor
- **THEN** the page explains battleground acquisition without claiming no source exists
- **AND** the merchants and prices are visible without an invariant seller column

#### Scenario: Crafting station
- **WHEN** a reader opens a station with map spots and recipes
- **THEN** the page shows where to find it, the linked crafting skill, and a sortable recipe list without a two-number hero strip

#### Scenario: Starting faction
- **WHEN** a new character's faction standings are shown
- **THEN** Humans starts Honored, Hostile and Hostile Elementals start Hated, and Neutral and Neutral Aggressive start Neutral
- **AND** the latter starts with 100 points toward the next stance while each stance takes 100 points to fill
- **AND** rows with differing starting points preserve that difference, while invariant thresholds and zero-only columns are stated once

#### Scenario: Race and equipment progression
- **WHEN** a reader opens any race or gear set
- **THEN** the race's starting area and linked playable classes are readily available without repeating the start
- **AND** the set's bonus tiers identify their required equipped piece counts, count each distinct piece once, and retain earlier bonuses at higher tiers
