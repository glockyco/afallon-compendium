## ADDED Requirements

### Requirement: Player-facing facts are typed per kind

The catalog SHALL decode the player-facing fields of each canonical kind into typed, validated facts. Items SHALL carry rarity, slot, item type, weapon and armor types, damage range, attack speed, stats, random stat rules, sockets, gem data, enchantment, requirements, sell and buy prices with currencies, stack limit, and quest-only flag. NPCs SHALL carry level range, scaling flag, NPC type, creature type, family, faction, species, respawn range, experience range, stats, ability phases, faction rewards, loot specialization, and role flags. Quests SHALL carry chain name and order, repeatable flag, requirements, items given, typed objectives, fixed rewards, and rewards to choose. Places SHALL carry guide inclusion, level range, description, and boss references. The opaque source payload SHALL remain separately attributable and SHALL NOT be the source of a published fact.

#### Scenario: An item record has typed stats
- **WHEN** the canonical item record lists stat entries with a stat id, amount, and percent flag
- **THEN** the catalog stores each stat with a reference to the stat entity
- **AND** an unresolved stat id remains an unresolved reference, not a dropped row

#### Scenario: A quest objective references a target
- **WHEN** a task record names an NPC to kill, an item to get, an NPC to talk to, an item to use, a scene to reach, or an ability to learn
- **THEN** the catalog stores a typed objective with that target reference and count
- **AND** a task type without a supported decoding remains an unresolved coverage issue

### Requirement: Linked support families are canonical kinds

The catalog SHALL admit abilities, effects, recipes, crafting stations, factions, currencies, skills, classes, races, enchantments, gear sets, and species as canonical entities with stable keys. Relations that reference these families SHALL resolve to those entities. A reference to a support record that the catalog did not admit SHALL remain an unresolved reference.

#### Scenario: A boss ability phase names an ability
- **WHEN** the catalog admits abilities
- **THEN** the phase row references the ability entity
- **AND** the ability entity carries its name, icon reference, and description

#### Scenario: A recipe produces an item
- **WHEN** the catalog admits recipes
- **THEN** the recipe entity carries its station, skill, rank, materials with quantities, and produced item with quantity
- **AND** the produced item and each material resolve to item entities

### Requirement: Reverse relations are queryable from the catalog

For every relation family, the catalog SHALL answer both directions with the same rows: which entities produce an item and which items an entity produces; which quests reference an entity and which entities a quest references; which places contain an entity and which entities a place contains. Publication SHALL derive both endpoint lists from those queries and SHALL NOT store a second copy of the relation.

#### Scenario: An item is sold by three vendors
- **WHEN** publication queries the item's sources
- **THEN** the query returns the three vendor rows with price, currency, and requirement references
- **AND** each vendor's stock query returns the same row for that item

### Requirement: Entity artwork is registered with provenance

The catalog SHALL register extracted entity artwork with its content identity, the source asset name, the entity it belongs to, and the scan run that produced it. An entity MAY have no artwork. Two entities MAY share one artwork asset.

#### Scenario: Two items share one icon sprite
- **WHEN** both item records name the same sprite
- **THEN** the catalog registers one asset with two entity bindings
