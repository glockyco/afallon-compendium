## ADDED Requirements

### Requirement: Game action owners retain their actions

The catalog SHALL retain the game actions of every owner type in the order that the game reads them. Each action SHALL keep its owner identity, type, chance, node action, amount, target references, and requirement groups. When an owner uses a game actions template, the catalog SHALL retain the actions of the template and the template identity. A loot table that a LootTable action of an item names SHALL link to that item with the requirement groups of the action. A grant of an item, a loot table, a currency, or a recipe by an owner other than an item SHALL be a coverage issue. An unresolved owner or target SHALL remain visible as a coverage issue.

#### Scenario: Item names a loot table
- **WHEN** a captured item action names a loot table with a class and level requirement group
- **THEN** the catalog links that loot table to the item with the requirement group

#### Scenario: Another owner gives an item
- **WHEN** a captured action of a dialogue node, effect, region, or stat gives an item
- **THEN** the catalog keeps the action and records a coverage issue

#### Scenario: Target does not resolve
- **WHEN** a captured action names a target that the database lacks
- **THEN** the catalog keeps the action and records a coverage issue

### Requirement: World objects and scene components keep their item grants

The catalog SHALL retain the chests that the visual effect of an interactable object or of an item action can spawn. Each chest SHALL keep its template, the number of prefab choices, its rows, and the costs and requirements of the object. The catalog SHALL retain the boss loot tables, the item limit, the target times, and the token item of each dungeon timer. It SHALL retain the creature and pickup pairs of each hunt director with their quest and task, and the supply pack of the Dungeon Finder settings.

#### Scenario: Grave
- **WHEN** a captured grave triggers the Loot tombs graves effect
- **THEN** the catalog returns the Tomb items drop chest and its rows for that grave

#### Scenario: Sacrificial altar
- **WHEN** a captured sacrificial altar offers three sacrifices
- **THEN** the catalog returns each cost with the chests or loot tables that it can give

#### Scenario: Hunt pickup
- **WHEN** a captured hunt director pairs Infected boar with a Boar Haunch pickup
- **THEN** the catalog returns the pair with the quest Bait for a Beast and its task
