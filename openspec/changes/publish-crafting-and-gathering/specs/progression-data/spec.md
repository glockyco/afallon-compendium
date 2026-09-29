## ADDED Requirements

### Requirement: Gathering nodes retain their world evidence

The catalog SHALL retain each gathering node that a spawner option or a scene object gives, keyed by its name without rich-text tags. A gathering node SHALL retain its gathering skill, skill experience, character experience, loot table, requirements template, and each source with its placement when known. Sources that share a name SHALL agree on skill, loot table, experience, and requirements template. When they disagree, the catalog SHALL record a coverage issue and keep the sources as separate variants instead of merging them. A yield SHALL link to a gathering node only through its own spawner option or object record. The catalog SHALL keep every existing yield, and a yield without a node link SHALL keep its source with provenance and a coverage issue. The catalog SHALL NOT invent resource ranks, because the build has no resource node records.

#### Scenario: Spawner option and placed object share a name
- **WHEN** a spawner option and a scene object both give Small iron vein with the same loot table, experience, and requirements template
- **THEN** the catalog records one gathering node with both sources

#### Scenario: Sources with one name disagree
- **WHEN** two sources share a node name but name different loot tables
- **THEN** the catalog records a coverage issue and two variants of the node

#### Scenario: A node has no placed source
- **WHEN** a gathering node has captured evidence but no verified world placement
- **THEN** the catalog retains the node and its yields

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
