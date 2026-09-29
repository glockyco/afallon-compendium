## ADDED Requirements

### Requirement: Resource nodes retain authored ranks and proven yields

The catalog SHALL retain each captured resource node as an entity. It SHALL retain its gathering skill, automatic learning flag, and each available rank in authored order. Each rank SHALL retain its unlock cost, skill-level field, base experience, gather time, respawn time, and loot-table reference. A yield SHALL link to a node and rank only when captured evidence identifies that node and rank. The catalog SHALL keep source-only yields when that link is unresolved, with provenance and a coverage issue. Null ranks and unresolved item or skill references SHALL remain visible as unavailable evidence or coverage issues.

#### Scenario: Rank links to a known loot table
- **WHEN** a resource rank names a known loot table and its item yields resolve
- **THEN** the catalog associates those yields with that resource node and rank
- **AND** the item facts retain the original source and quantity evidence

#### Scenario: Possible source cannot identify one rank
- **WHEN** a spawner candidate gives an item but no captured fact identifies one resource rank
- **THEN** its yield keeps the source without a guessed rank link
- **AND** the catalog records the unresolved relation

#### Scenario: A node has no placed source
- **WHEN** a resource node has authored ranks but no verified world placement
- **THEN** the catalog retains its entity and all available ranks

### Requirement: Crafting and spawner values retain their source

The catalog SHALL retain recipe rank unlock cost and base experience. It SHALL retain the spawner's gathering skill, option weights, skill cap, respawn time, jitter, player range, and identified boost effects when captured evidence supports them. Derived experience bands and spawner weights SHALL cite their rule evidence and use captured operands. A missing field SHALL not become a default game value.

#### Scenario: Recipe rank has base experience
- **WHEN** a captured recipe rank records base experience and unlock cost
- **THEN** the catalog returns both values with the rank and its source

#### Scenario: One boost entry is decoded
- **WHEN** only one attunement entry has verified effect and node names
- **THEN** the catalog retains that entry and leaves other entries unconfirmed

### Requirement: Items retain their game actions

The catalog SHALL retain the game actions of each item in the order that the game reads them. When an item sets its template flag and names a template, the catalog SHALL retain the template's actions and the template identity. Each action SHALL retain its type, chance, node action, amount, and target references. An unresolved target SHALL remain visible as a coverage issue.

#### Scenario: Item teaches a recipe
- **WHEN** an item's game actions include a Recipe action with the RankUp node action
- **THEN** the catalog returns the recipe reference with the item

#### Scenario: Item uses a template
- **WHEN** an item sets its template flag and names a game actions template
- **THEN** the catalog retains the template's actions instead of the item's own list
