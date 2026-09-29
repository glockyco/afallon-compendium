## ADDED Requirements

### Requirement: Game action owners retain their actions

The catalog SHALL retain the game actions of dialogue text nodes, effects, regions, stats, and NPC combat and AI data in the order that the game reads them. Each action SHALL keep its owner identity, type, chance, node action, amount, and target references. When an owner uses a game actions template, the catalog SHALL retain the actions of the template and the template identity. A loot table that a LootTable action names SHALL link to the owner of that action. An unresolved owner or target SHALL remain visible as a coverage issue.

#### Scenario: Dialogue node gives an item
- **WHEN** a captured dialogue text node of an NPC has an Item or LootTable action
- **THEN** the catalog returns the action with the node, its NPC, and the item or loot table reference

#### Scenario: Item names a loot table
- **WHEN** a captured item action names a loot table that no other owner binds
- **THEN** the catalog links that loot table to the item

#### Scenario: Target does not resolve
- **WHEN** a captured action names a target that the database lacks
- **THEN** the catalog keeps the action and records a coverage issue
