## Purpose

Expose catalog-backed ways to encounter, obtain, and learn content while distinguishing references without a reachable source from verified acquisition routes.

## ADDED Requirements

### Requirement: Creature Origination Evidence
Creature pages SHALL identify effects whose pet ranks summon the creature and scanned world spawners that list it as a spawn candidate. Recruitment actions SHALL be described as recruitment, not world spawns.

#### Scenario: Effect Summons A Creature
- **WHEN** a published pet effect rank names a creature
- **THEN** the creature page links the summoning effect even when the creature has no map location.

#### Scenario: Unrelated Effect
- **WHEN** an effect refers to a creature without a pet-rank summon
- **THEN** the effect is not listed as a summoner.

### Requirement: Item Acquisition Evidence
Item pages SHALL identify starting equipment of named adventurers and enumerate loot tables containing the item. A table without a bound drop source SHALL not be presented as a way to obtain the item. Consuming an item SHALL not be treated as a source for that item.

#### Scenario: Adventurer's Starting Equipment
- **WHEN** an adventurer's initial inventory contains an item
- **THEN** the item page names the adventurer and offers a link to the adventurer page.

#### Scenario: Unbound Loot Table
- **WHEN** an item occurs only in a loot table with no binding
- **THEN** its page names the loot table but makes clear no source for the table is known.

#### Scenario: Self-Consumption Is Not Acquisition
- **WHEN** using an item removes that same item
- **THEN** it does not appear among ways to obtain the item.

### Requirement: Ability Grant Context
Ability pages SHALL distinguish game actions granting or unlocking an ability from NPCs and items that actually use an ability. The page SHALL identify the dialogue or world-object context of a grant, when known.

#### Scenario: Dialogue Grants An Ability
- **WHEN** a dialogue game action grants an ability
- **THEN** the ability page describes the dialogue grant without claiming the dialogue casts the ability.

#### Scenario: Unrelated Action
- **WHEN** an owner action targets a different ability or removes an ability
- **THEN** the action is not listed as an ability grant.

### Requirement: Missing Travel Destination
A travel effect SHALL show a named destination when it refers to a published scene, and SHALL show a plain explanation without a scene identifier when its destination does not exist in this game version.

#### Scenario: Unavailable Scene
- **WHEN** a travel effect refers to a scene absent from the scene database
- **THEN** the page says its destination is not part of this version of the game and does not display the scene identifier.

#### Scenario: Published Scene
- **WHEN** a travel effect refers to an existing scene
- **THEN** the page presents a link to that one scene with singular wording.
