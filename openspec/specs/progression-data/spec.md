## Purpose

Record in the catalog how characters progress and what game systems do: classes, spellbooks, talent trees, passive bonuses, talent points, professions, experience per level, effects, enchantments, stats, factions, and ability ranks, with the relations between them, so that pages can answer which class learns an ability and what a talent or effect gives.

## Requirements

### Requirement: Classes record their progression

The catalog SHALL record for each class its auto-attack ability, its base stats with the growth of each stat per level, its skill bonuses, its level template, its spellbooks, its talent trees, its starting items with their count and whether they start equipped, its action abilities, and its stat allocation points and entries. When a class takes its stats from a stat list template, the catalog SHALL record the stats of that template and SHALL state that the class uses it.

#### Scenario: Class with talent trees
- **WHEN** the catalog is built from a scan of build 25434619
- **THEN** the Shieldmaster class names its five talent trees, and Bastion Breaker is one of them

### Requirement: Spellbooks and talent trees record their nodes

The catalog SHALL record the source of each spellbook, class or weapon, and its nodes in their authored order. Each spellbook node SHALL name its ability or bonus and its unlock level. The catalog SHALL record the tier count of each talent tree, its talent point type, and its nodes. Each talent tree node SHALL name its ability, bonus, recipe, or resource node, its tier and its row, and its requirement groups.

#### Scenario: Talent node with a requirement
- **WHEN** a talent tree node requires another node or a character level
- **THEN** the catalog records that requirement group with the node

### Requirement: Passive bonuses record their ranks

The catalog SHALL record whether a character knows a bonus by default and, for each rank, its unlock cost, its requirement groups, its stat changes, its pet stat changes, and whether the rank is empty, with the tooltip text of an empty rank.

#### Scenario: Bonus rank with a stat change
- **WHEN** a bonus rank gives 5 percent of a stat
- **THEN** the catalog records that stat, the amount 5, and that the amount is a percentage

### Requirement: Talent points record how a character gains them

The catalog SHALL record for each talent point type its starting amount, its maximum, and each gain rule with its trigger, its amount, and the class, skill, item and item count, NPC, or weapon template that the rule names. The triggers SHALL be character level-up, skill level-up, NPC kill, item gain, and weapon template level-up.

#### Scenario: Points from level-ups
- **WHEN** a talent point type grants one point for each character level-up of a class
- **THEN** the catalog records the trigger, the amount 1, and that class

### Requirement: Skills record their levels and talent trees

The catalog SHALL record for each skill its maximum level, whether a character receives it automatically, its level template, its talent trees, its stats with the growth of each stat per level, its starting items, and its action abilities.

#### Scenario: Profession with a talent tree
- **WHEN** a profession skill names a talent tree
- **THEN** the catalog lists that tree with the skill

### Requirement: Level templates record the experience per level

The catalog SHALL record for each level template its number of levels, its base experience, its increase amount, and for each level its number, its name, and the experience that it requires.

#### Scenario: Experience of a class level
- **WHEN** a class names a level template
- **THEN** the catalog gives the experience that each level of that class requires

### Requirement: Effects record what they do

The catalog SHALL record for each effect its type, its tag, whether it is a state, whether it is a buff on the caster, its stack limit, whether several casters can apply it, its pulses, its duration, whether it lasts without end, whether a player can remove it, and whether it persists.

#### Scenario: Stun effect
- **WHEN** an effect of the type Stun lasts 3 seconds
- **THEN** the catalog records the type Stun and the duration 3

#### Scenario: Effects record what they do
- **WHEN** An effect has a stack limit of 3 and allows several casters to apply it.
- **THEN** The catalog records the stack limit of 3 and that several casters can apply the effect.

### Requirement: Effect ranks record damage and stat mechanics

For each effect rank, the catalog SHALL record the damage type and the damage, the stat that the rank alters, the weapon damage and skill modifiers, lifesteal, the health modifiers, the delay, the effect that the rank requires with its modifier, and the stat changes.

#### Scenario: Effect ranks record damage and stat mechanics
- **WHEN** An effect rank specifies fire damage of 20 and a delay of 2.
- **THEN** The catalog records fire as the damage type, damage of 20, and a delay of 2 for that rank.

### Requirement: Effect ranks record nested effects and destinations

For each effect rank, the catalog SHALL record the nested effects with their chance and rank, the teleport destination scene, the loot table, and the pet with its count and duration.

#### Scenario: Effect ranks record nested effects and destinations
- **WHEN** An effect rank specifies a nested effect at rank 2 with a chance of 25 percent.
- **THEN** The catalog records the nested effect with chance 25 and rank 2.

### Requirement: Effect ranks record movement and combat interventions

For each effect rank, the catalog SHALL record the knockback and motion distances, the dispel target, the taunt threat, and the resurrection health.

#### Scenario: Effect ranks record movement and combat interventions
- **WHEN** An effect rank specifies a knockback distance of 4 and resurrection health of 100.
- **THEN** The catalog records the knockback distance of 4 and resurrection health of 100 for that rank.

### Requirement: Unnamed native enum values retain their numbers

A value of a native enum that the collector cannot name SHALL keep its number.

#### Scenario: Unnamed native enum values retain their numbers
- **WHEN** The collector encounters native enum value 17 and cannot name it.
- **THEN** The value retains the number 17.

### Requirement: Enchantments record where they apply and their tiers

The catalog SHALL record for each enchantment the item types, rarities, armor types and slots, and weapon types and slots that accept it, and for each tier its currency costs, its item costs, its success rate, its enchanting time, its skill and skill experience, and its stats.

#### Scenario: Tier with a cost and a stat
- **WHEN** an enchantment tier costs gold and a material and gives a stat
- **THEN** the catalog records both costs and the stat with that tier

### Requirement: Stats record their rules

The catalog SHALL record for each stat its minimum and maximum when the game checks them, its base value, whether it is a percentage, whether it is a vitality stat, its starting percentage, its regeneration in and out of combat and while sprinting or blocking with the amount and the interval, its interface category, its stat category, its stat bonuses, its on-hit effects with their rank, target, tag, and chance, and its proc cooldown.

#### Scenario: Regenerating vitality stat
- **WHEN** a vitality stat regenerates outside combat
- **THEN** the catalog records the amount and the interval of that regeneration

### Requirement: Factions record reputation

The catalog SHALL record for each faction whether the reputation window shows it, its stances in their authored order with the points that each stance requires and its alignment toward the player, and its default relation to each other faction with the starting points.

#### Scenario: Stance thresholds
- **WHEN** a faction has the stances Hostile, Neutral, and Friendly
- **THEN** the catalog lists them in the authored order with their required points

### Requirement: Abilities record their rank mechanics

The catalog SHALL record for each ability its type, whether a character knows it by default, and whether it requires a ranged weapon.

#### Scenario: Ability that applies an effect
- **WHEN** an ability rank applies a bleed effect with a chance of 50 percent
- **THEN** the catalog records that effect, the chance 50, and the rank of the effect with the ability rank

#### Scenario: Abilities record their rank mechanics
- **WHEN** An ability is known by default and requires a ranged weapon.
- **THEN** The catalog records that the ability is known by default and requires a ranged weapon.

### Requirement: Ability ranks record costs timing and targeting geometry

For each ability rank, the catalog SHALL record its unlock cost, its activation type, its cast time, its channel time, its cooldown, whether it uses the global cooldown, its minimum and maximum range, its target type, its area radius, its cone angle and range, its projectile count, and the most targets that it hits.

#### Scenario: Ability ranks record costs timing and targeting geometry
- **WHEN** An ability rank has a minimum range of 2, maximum range of 20, and projectile count of 3.
- **THEN** The catalog records minimum range 2, maximum range 20, and projectile count 3 for that rank.

### Requirement: Ability ranks record applied effects

For each ability rank, the catalog SHALL record the effects that it applies to its targets and to its caster with their chance, rank, and target.

#### Scenario: Ability ranks record applied effects
- **WHEN** An ability rank applies an effect to its caster with chance 100 and effect rank 2.
- **THEN** The catalog records that effect with chance 100, rank 2, and the caster as target.

### Requirement: Ability ranks record requirement groups

For each ability rank, the catalog SHALL record its requirement groups.

#### Scenario: Ability ranks record requirement groups
- **WHEN** An ability rank has two requirement groups.
- **THEN** The catalog records both requirement groups for that rank.

### Requirement: Ability rank tooltip text stays

The tooltip text of each ability rank SHALL stay.

#### Scenario: Ability rank tooltip text stays
- **WHEN** An ability rank has tooltip text "Strike the target".
- **THEN** That rank retains the tooltip text "Strike the target".

### Requirement: The catalog derives who learns and applies what

The catalog SHALL derive for each ability the classes and skills that give it: through a spellbook node with its unlock level, through a talent tree node with its tree, tier, and row, as the auto-attack ability of a class, or as an action ability. The catalog SHALL derive for each recipe and resource node the talent tree nodes that unlock it, and for each effect the abilities, effects, and stats that apply it.

#### Scenario: Class ability from a spellbook
- **WHEN** a class spellbook has an ability node with the unlock level 10
- **THEN** the ability lists that class at level 10

#### Scenario: Profession unlock
- **WHEN** a skill talent tree has a recipe node at tier 2
- **THEN** that recipe lists the tree, tier 2, and the row of the node

### Requirement: Missing and unresolved data stay visible

When a record, a list, or a list member is null in the game data, the evidence SHALL record it as unavailable with its field path, and the catalog SHALL NOT invent a value for it.

#### Scenario: Node names a missing ability
- **WHEN** a talent tree node names an ability ID that the game database lacks
- **THEN** the catalog records a missing-reference issue for that node
- **AND** no class lists that ability through the node

#### Scenario: Old support evidence on the canonical target
- **WHEN** a catalog plan names a canonical target that has only `compendium.support.v1` evidence
- **THEN** the catalog build stops with an error that names the target

#### Scenario: Old support evidence on another target
- **WHEN** a catalog plan admits a scene scan with `compendium.support.v1` evidence beside a canonical target with `compendium.support.v2` evidence
- **THEN** the catalog admits that scene scan

#### Scenario: Missing and unresolved data stay visible
- **WHEN** A list member is null at field path "effects[2]" in the game data.
- **THEN** The evidence records the member as unavailable at "effects[2]", and the catalog does not invent a value for it.

### Requirement: Unresolved IDs produce coverage issues

When a node, a bonus rank, an effect, or a class names an ID that no record has, the catalog SHALL record a missing-reference coverage issue.

#### Scenario: Unresolved IDs produce coverage issues
- **WHEN** A bonus rank names effect ID 42 and no record has that ID.
- **THEN** The catalog records a missing-reference coverage issue.

### Requirement: Unresolved references retain labeled IDs without targets

When a node, a bonus rank, an effect, or a class names an ID that no record has, the catalog SHALL keep the reference with the ID in its label and without a target.

#### Scenario: Unresolved references retain labeled IDs without targets
- **WHEN** An effect names ID 42 and no record has that ID.
- **THEN** The catalog keeps the reference with 42 in its label and no target.

### Requirement: Unresolved references yield no relations

When a node, a bonus rank, an effect, or a class names an ID that no record has, the catalog SHALL derive no relation from it.

#### Scenario: Unresolved references yield no relations
- **WHEN** A class names ID 42 and no record has that ID.
- **THEN** The catalog derives no relation from that unresolved reference.

### Requirement: Support evidence comes only from the canonical target

The catalog SHALL read support evidence only from the canonical target of its plan. Other targets of the plan MAY keep `compendium.support.v1` evidence.

#### Scenario: Support evidence comes only from the canonical target
- **WHEN** A plan has a canonical target with `compendium.support.v2` evidence and another target retaining `compendium.support.v1` evidence.
- **THEN** The catalog reads support evidence only from the canonical target, and the other target may retain its `compendium.support.v1` evidence.

### Requirement: Missing canonical v2 support evidence stops the catalog

The catalog SHALL stop when the canonical target of its plan has no `compendium.support.v2` evidence.

#### Scenario: Missing canonical v2 support evidence stops the catalog
- **WHEN** The canonical target of a catalog plan has no support evidence.
- **THEN** The catalog stops.
### Requirement: Races record the classes that they offer

The catalog SHALL record for each race the classes that the race offers, in authored order. A class ID without a class record SHALL become a missing-reference issue, and SHALL NOT count as an offered class. The catalog SHALL derive the set of classes that at least one race offers.

#### Scenario: Offered classes of build 25434619
- **WHEN** the catalog is built from a scan of build 25434619
- **THEN** Dwarf, Human, and Orc each offer Shieldmaster, Wizard, Necromancer, Assassin, and Druid
- **AND** no race offers Hunter or Berserker

### Requirement: The catalog records experience modifiers and Heroic settings

The catalog SHALL record the authored lower-level and higher-level experience modifiers of each creature that has them.

#### Scenario: Creature experience modifiers
- **WHEN** a creature has lower-level and higher-level experience modifiers in captured evidence
- **THEN** the catalog records both values with the creature
- **AND** it does not infer which comparison uses either value from the field name alone

#### Scenario: Missing Heroic setting
- **WHEN** a Heroic setting is absent from the scan
- **THEN** the catalog marks that fact unavailable
- **AND** the publication does not invent a number for it

#### Scenario: Build-specific settings
- **WHEN** the accepted build publishes Heroic Essence and affix settings
- **THEN** each published setting comes from the accepted catalog or its recorded evidence

#### Scenario: The catalog records experience modifiers and Heroic settings
- **WHEN** A creature has authored lower-level and higher-level experience modifiers of 0.5 and 1.5.
- **THEN** The catalog records both authored modifiers with that creature.

### Requirement: Heroic explanation settings are recorded

The catalog SHALL record the Heroic settings used to explain kill experience, Essence rewards, creature health and damage, gear scaling, affixes, affix loot, and Heroic gear stats.

#### Scenario: Heroic explanation settings are recorded
- **WHEN** A Heroic setting is used to explain creature health scaling.
- **THEN** The catalog records that Heroic setting.

### Requirement: Settings retain source and build provenance

Each setting SHALL retain its source and build provenance.

#### Scenario: Settings retain source and build provenance
- **WHEN** A recorded Heroic setting comes from source S in build B.
- **THEN** The setting retains source S and build B as its provenance.

### Requirement: Missing settings remain unavailable

A missing setting SHALL remain unavailable rather than become a default or a number embedded in the site.

#### Scenario: Missing settings remain unavailable
- **WHEN** A Heroic gear scaling setting is missing.
- **THEN** The setting remains unavailable instead of becoming a default or a number embedded in the site.

### Requirement: Verified calculation rules carry recorded evidence

Verified calculation rules SHALL carry recorded evidence through the catalog and publication.

#### Scenario: Verified calculation rules carry recorded evidence
- **WHEN** A verified calculation rule passes through the catalog into the publication.
- **THEN** The rule carries its recorded evidence through both the catalog and the publication.
### Requirement: Gathering nodes retain their world evidence

The catalog SHALL retain each gathering node that a spawner option or a scene object gives, keyed by its name without rich-text tags.

#### Scenario: Spawner option and placed object share a name
- **WHEN** a spawner option and a scene object both give Small iron vein with the same loot table, experience, and requirements template
- **THEN** the catalog records one gathering node with both sources

#### Scenario: Sources with one name disagree
- **WHEN** two sources share a node name but name different loot tables
- **THEN** the catalog records a coverage issue and two variants of the node

#### Scenario: A node has no placed source
- **WHEN** a gathering node has captured evidence but no verified world placement
- **THEN** the catalog retains the node and its yields

#### Scenario: Gathering nodes retain their world evidence
- **WHEN** A scene object gives a gathering node named "<b>Iron vein</b>".
- **THEN** The catalog retains the gathering node keyed as "Iron vein".

### Requirement: Gathering node details and source placements

A gathering node SHALL retain its gathering skill, skill experience, character experience, loot table, requirements template, and each source with its placement when known.

#### Scenario: Gathering node details and source placements
- **WHEN** A gathering node has captured skill, experience, loot table, requirements template, and source records with known placements.
- **THEN** The gathering node retains its gathering skill, skill experience, character experience, loot table, requirements template, and every source with its known placement.

### Requirement: Same-name source agreement and variants

Sources that share a name SHALL agree on skill, loot table, experience, and requirements template. When sources that share a name disagree, the catalog SHALL record a coverage issue and keep the sources as separate variants instead of merging them.

#### Scenario: Same-name source agreement and variants
- **WHEN** Two sources share a gathering node name but specify different gathering skills.
- **THEN** The catalog records a coverage issue and keeps the sources as separate variants instead of merging them.

### Requirement: Yield links require their own source evidence

A yield SHALL link to a gathering node only through its own spawner option or object record.

#### Scenario: Yield links require their own source evidence
- **WHEN** A yield's own spawner option identifies a gathering node, while an unrelated object record identifies another node.
- **THEN** The yield links to the node identified by its own spawner option, not to the node identified only by the unrelated object record.

### Requirement: Existing yields and unlinked provenance

The catalog SHALL keep every existing yield, and a yield without a node link SHALL keep its source with provenance and a coverage issue.

#### Scenario: Existing yields and unlinked provenance
- **WHEN** An existing yield has no gathering node link.
- **THEN** The catalog keeps the yield and its source with provenance and a coverage issue.

### Requirement: No invented resource ranks

The catalog SHALL NOT invent resource ranks, because the build has no resource node records.

#### Scenario: No invented resource ranks
- **WHEN** The catalog captures a gathering node from a build with no resource node records.
- **THEN** The catalog does not invent a resource rank for the gathering node.

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

### Requirement: Rules name where they appear

Each reviewed rule SHALL have a mechanics guide topic.

#### Scenario: Rule without a topic
- **WHEN** a reviewed rule has a placement on the Crafting section of item pages but no guide topic
- **THEN** catalog creation rejects it until it has an appropriate guide topic and section

#### Scenario: Unknown target
- **WHEN** a placement names a section not defined for its page kind
- **THEN** catalog creation fails and names the rule

#### Scenario: Placements added to accepted rules
- **WHEN** a rules record adds placements to previously accepted rules
- **THEN** each rule keeps its accepted text, status, operands, links, and evidence and its entity placement resolves to a guide-section link

#### Scenario: Rules name where they appear
- **WHEN** A reviewed rule is retained in the catalog.
- **THEN** The reviewed rule has a mechanics guide topic.

### Requirement: Rule records and optional validated placements

The catalog SHALL retain each reviewed rule's text, status, operands, links, and evidence, and MAY retain validated placements that identify a page kind, defined fact or section target, and supported `all`, `linked`, or conditional scope.

#### Scenario: Rule records and optional validated placements
- **WHEN** A reviewed rule has text, status, operands, links, and evidence.
- **THEN** The catalog retains the rule's text, status, operands, links, and evidence.

### Requirement: Entity placements select facts and guide anchors

An entity placement SHALL select a computed fact and the anchor of the guide section of its rule, not copy the rule prose to an entity page, column hint, or hover card.

#### Scenario: Entity placements select facts and guide anchors
- **WHEN** A rule has an entity placement for a computed fact.
- **THEN** The placement selects the computed fact and the anchor of the rule's guide section without copying rule prose to an entity page, column hint, or hover card.

### Requirement: Linked placement entity boundary

A `linked` placement SHALL apply only to its linked entities.

#### Scenario: Linked placement entity boundary
- **WHEN** A `linked` placement links one entity but not another.
- **THEN** The placement applies to the linked entity and not to the unlinked entity.

### Requirement: Catalog creation validates topics and placement vocabulary

Catalog creation SHALL reject a missing topic and an unknown page kind, target, or scope.

#### Scenario: Catalog creation validates topics and placement vocabulary
- **WHEN** A reviewed rule's placement names an unknown scope.
- **THEN** Catalog creation rejects the rule's placement.

### Requirement: Publication validates guide section definitions

Publication SHALL reject a rule section that its guide does not define.

#### Scenario: Publication validates guide section definitions
- **WHEN** A rule refers to a section that its guide does not define.
- **THEN** Publication rejects the rule section.

### Requirement: Placements preserve evidence and operands

A placement SHALL NOT alter rule evidence or operands.

#### Scenario: Placements preserve evidence and operands
- **WHEN** A placement is added to a rule with captured evidence and operands.
- **THEN** The rule's evidence and operands remain unchanged.
### Requirement: Publication derives place counts and endpoint spawn shares

The publication SHALL provide distinct known map-spot counts grouped by published place for gathering nodes and creature locations and total known spots for applicable item source routes.

#### Scenario: Repeated placement under one place
- **WHEN** two equivalent relations refer to the same known map spot
- **THEN** the publication counts that spot once for its place and route

#### Scenario: Skill changes node selection
- **WHEN** one spawner has verified eligible option weights at its lowest and highest skill levels
- **THEN** the node's published share at each level uses its effective weight divided by the sum of eligible effective weights at that level
- **AND** the page labels the levels and that these shares describe the spawner's selection, not yield chance

#### Scenario: Incomparable spawners
- **WHEN** several spawners offer a node but lack a verified common weighting denominator
- **THEN** the publication does not invent one overall percentage

#### Scenario: Publication derives place counts and endpoint spawn shares
- **WHEN** Gathering nodes and creature locations have known map spots in published places, and an applicable item source route has known spots.
- **THEN** The publication provides distinct known map-spot counts by published place for the gathering nodes and creature locations, and total known spots for the item source route.

### Requirement: Equivalent merged rows count shared spots once

A spot shared by equivalent merged rows SHALL count once.

#### Scenario: Equivalent merged rows count shared spots once
- **WHEN** Equivalent merged rows share one known map spot.
- **THEN** The shared spot counts once.

### Requirement: Conditional placements retain expanded conditions

Different conditional placements SHALL preserve their conditions in the expanded list.

#### Scenario: Conditional placements retain expanded conditions
- **WHEN** Two placements have different conditions.
- **THEN** The expanded list preserves each placement's conditions.

### Requirement: Endpoint option shares use verified eligible weights

A gathering node with verified weighted spawner options SHALL provide effective option share at the lowest and highest supported skill levels, computed from eligible captured options and their verified weighting rules, with the skill levels and denominator identified.

#### Scenario: Endpoint option shares use verified eligible weights
- **WHEN** A gathering node has verified weighted spawner options eligible at its lowest and highest supported skill levels.
- **THEN** The node provides effective option shares at both endpoints using eligible captured options and verified weighting rules, identifying the skill levels and denominator.

### Requirement: Spawner choice and aggregate shares are distinguished

The publication SHALL distinguish a choice by one spawner from an aggregate over multiple spawners.

#### Scenario: Spawner choice and aggregate shares are distinguished
- **WHEN** The publication presents a share for one spawner and an aggregate share over multiple spawners.
- **THEN** The publication distinguishes the single-spawner choice from the multiple-spawner aggregate.

### Requirement: Unsupported aggregate shares remain qualified

If no meaningful aggregate is supported, the publication SHALL present separately supported shares or state that an overall share is unknown.

#### Scenario: Unsupported aggregate shares remain qualified
- **WHEN** Multiple spawners have separately supported shares but no meaningful aggregate is supported.
- **THEN** The publication presents separately supported shares or states that an overall share is unknown.

### Requirement: Shares do not imply bonuses or drop chances

The publication SHALL NOT imply an attunement bonus or call a weight a drop chance.

#### Scenario: Shares do not imply bonuses or drop chances
- **WHEN** The publication displays a verified spawner option weight.
- **THEN** The publication neither calls the weight a drop chance nor implies an attunement bonus.

### Requirement: Missing evidence does not produce counts or probabilities

Missing place or weight evidence SHALL not produce an invented count or probability.

#### Scenario: Missing evidence does not produce counts or probabilities
- **WHEN** Place evidence and weight evidence are missing for a source.
- **THEN** The publication does not invent a count or probability from the missing evidence.
### Requirement: Game action owners retain their actions

The catalog SHALL retain the game actions of every owner type in the order that the game reads them. Each action SHALL keep its owner identity, type, chance, node action, amount, target references, and requirement groups.

#### Scenario: Item names a loot table
- **WHEN** a captured item action names a loot table with a class and level requirement group
- **THEN** the catalog links that loot table to the item with the requirement group

#### Scenario: An interactable object gives a loot table
- **WHEN** a locked Wooden treasure chest runs a LootTable game action for the world loot table of the player's level band
- **THEN** each item of that table has a Found in objects source of the chest with the level band and the Chest Key requirement
- **AND** the catalog records no coverage issue for that action

#### Scenario: Another owner gives a recipe
- **WHEN** a captured game action of a dialogue node, effect, region, stat, or interactable object unlocks a recipe or gives an item that the catalog does not keep as an item source
- **THEN** the catalog keeps the action and records a coverage issue

#### Scenario: Target does not resolve
- **WHEN** a captured action names a target that the database lacks
- **THEN** the catalog keeps the action and records a coverage issue

#### Scenario: Game action owners retain their actions
- **WHEN** An owner has two game actions with captured action fields in a known game-read order.
- **THEN** The catalog retains both actions in game-read order, each with its owner identity, type, chance, node action, amount, target references, and requirement groups.

### Requirement: Template actions retain template identity

When an owner uses a game actions template, the catalog SHALL retain the actions of the template and the template identity.

#### Scenario: Template actions retain template identity
- **WHEN** An owner uses a game actions template containing captured actions.
- **THEN** The catalog retains the template's actions and its identity.

### Requirement: Item LootTable actions link tables with requirements

A loot table that a LootTable action of an item names SHALL link to that item with the requirement groups of the action.

#### Scenario: Item LootTable actions link tables with requirements
- **WHEN** An item's LootTable action names a loot table and has requirement groups.
- **THEN** The loot table links to the item with the action's requirement groups.

### Requirement: Interactable item sources retain action chances and requirements

The LootTable and Item gain actions of an interactable object SHALL be item sources of that object, with the action chances and requirements.

#### Scenario: Interactable item sources retain action chances and requirements
- **WHEN** An interactable object has a LootTable action and an Item gain action with captured chances and requirements.
- **THEN** Both actions are item sources of the object with their action chances and requirements.

### Requirement: Other non-item grants produce coverage issues

Any other game action of a non-item owner that gives an item, a loot table, a currency, or a recipe SHALL be a coverage issue.

#### Scenario: Other non-item grants produce coverage issues
- **WHEN** A non-item owner's game action gives currency and is not a LootTable or Item gain action of an interactable object.
- **THEN** The catalog records the action as a coverage issue.

### Requirement: Interactable Chest actions are not game actions

The catalog SHALL NOT classify the Chest action of an interactable object as a game action.

#### Scenario: Interactable Chest actions are not game actions
- **WHEN** An interactable object has a Chest action.
- **THEN** The catalog does not classify that Chest action as a game action.

### Requirement: Unresolved owners and targets remain visible

An unresolved owner or target SHALL remain visible as a coverage issue.

#### Scenario: Unresolved owners and targets remain visible
- **WHEN** A captured game action has an unresolved owner.
- **THEN** The unresolved owner remains visible as a coverage issue.
### Requirement: World objects and scene components keep their item grants

The catalog SHALL retain the chests that the visual effect of an interactable object or of an item action can spawn.

#### Scenario: Grave
- **WHEN** a captured grave triggers the Loot tombs graves effect
- **THEN** the catalog returns the Tomb items drop chest and its rows for that grave

#### Scenario: Sacrificial altar
- **WHEN** a captured sacrificial altar offers three sacrifices
- **THEN** the catalog returns each cost with the chests or loot tables that it can give

#### Scenario: Hunt pickup
- **WHEN** a captured hunt director pairs Infected boar with a Boar Haunch pickup
- **THEN** the catalog returns the pair with the quest Bait for a Beast and its task

#### Scenario: World objects and scene components keep their item grants
- **WHEN** An item action's visual effect can spawn a captured chest.
- **THEN** The catalog retains the chest that the visual effect can spawn.

### Requirement: Spawned chests retain contents and object constraints

Each chest SHALL keep its template, the number of prefab choices, its rows, and the costs and requirements of the object.

#### Scenario: Spawned chests retain contents and object constraints
- **WHEN** A retained spawned chest has a template, prefab choices, rows, and an object with costs and requirements.
- **THEN** The chest keeps its template, the number of prefab choices, its rows, and the object's costs and requirements.

### Requirement: Dungeon timers retain reward and timing evidence

The catalog SHALL retain the boss loot tables, the item limit, the target times, and the token item of each dungeon timer.

#### Scenario: Dungeon timers retain reward and timing evidence
- **WHEN** A captured dungeon timer defines boss loot tables, an item limit, target times, and a token item.
- **THEN** The catalog retains all of those dungeon timer details.

### Requirement: Hunt directors retain creature and pickup pairs

The catalog SHALL retain the creature and pickup pairs of each hunt director with their quest and task.

#### Scenario: Hunt directors retain creature and pickup pairs
- **WHEN** A captured hunt director pairs a creature with a pickup and identifies their quest and task.
- **THEN** The catalog retains the creature and pickup pair with its quest and task.

### Requirement: Dungeon Finder retains its supply pack

The catalog SHALL retain the supply pack of the Dungeon Finder settings.

#### Scenario: Dungeon Finder retains its supply pack
- **WHEN** The captured Dungeon Finder settings identify a supply pack.
- **THEN** The catalog retains that supply pack.

### Requirement: Rule phrases place their links

A rule phrase MAY name a link inside the sentence with `{#n}`, where `n` is the index of the link in the rule. A phrase that names one link this way SHALL name each of its links exactly once. A phrase without link tokens SHALL end with words that lead into the closing list of its links. Catalog creation SHALL reject a link token without a link, a link that a phrase with link tokens does not name, and a link that a phrase names twice.

#### Scenario: Links inside the sentence
- **WHEN** a chest rule links Soaked Bag and Slime Covered Sack and its phrase reads "Using a {#1} or a {#0} opens a chest."
- **THEN** the guide shows "Using a Soaked Bag or a Slime Covered Sack opens a chest." with both names linked

#### Scenario: A token without a link
- **WHEN** a phrase names `{#2}` and its rule has two links
- **THEN** catalog creation fails and names the rule

#### Scenario: Some links named inline
- **WHEN** a rule has two links and its phrase names only `{#0}`
- **THEN** catalog creation fails and names the rule

### Requirement: Races record where new characters start

The catalog SHALL record, for each race, the scene and the world position where a new character of that race starts, as the game's race record sets them. A scene or position that does not resolve to a captured record SHALL stay as an explicit issue and SHALL NOT be guessed from a scene's default arrival.

#### Scenario: Race with a starting scene
- **WHEN** the Human race starts new characters in a captured scene
- **THEN** the catalog links the Human race to that scene and its starting position

#### Scenario: Unknown starting scene
- **WHEN** a race names a starting scene that the scan did not capture
- **THEN** the catalog records the issue and links no scene

### Requirement: Talent artwork follows its source record

The catalog SHALL record an available icon for each talent tree and passive talent from its captured source sprite. The icon SHALL keep a link to its source record and scan evidence. A missing or unreadable sprite SHALL remain an explicit coverage issue and SHALL NOT remove the tree or the talent.

#### Scenario: Captured tree and passive talent
- **WHEN** a scan captures the icons of a talent tree and of a passive talent in it
- **THEN** the catalog links each icon to the correct tree or bonus record and its scan evidence

#### Scenario: Sprite cannot be read
- **WHEN** a talent sprite cannot be read
- **THEN** the catalog reports the artwork issue
- **AND** the talent and its tier and row remain in the catalog

### Requirement: Talent trees keep the layout facts the game draws

The catalog SHALL record, for each talent tree, the facts that the game's talent tree panel reads to place nodes and draw lines between them: at least the tree's tier count and each node's tier and row. A fact SHALL come from the captured tree record, not from its order in a list.

#### Scenario: Node position
- **WHEN** a passive talent sits in tier 3 and row 2 of its tree
- **THEN** the catalog records tier 3 and row 2 for that node

### Requirement: The catalog records the adventurer world settings

The catalog SHALL record the adventurer world settings that the game's adventurer rules read: the job region names in order, the shortest and longest job duration, the experience and gold that a job gives, and the most adventurers present in the world.

#### Scenario: Job duration bounds
- **WHEN** the scan reads the adventurer world settings asset
- **THEN** the catalog records its shortest and longest job duration with their source paths

#### Scenario: Missing settings asset
- **WHEN** the scan finds no adventurer world settings asset
- **THEN** the catalog records the issue and no job durations

#### Scenario: The catalog records the adventurer world settings
- **WHEN** The scan reads the adventurer world settings used by the game's adventurer rules.
- **THEN** The catalog records the job region names in order, shortest and longest job duration, job experience and gold, and the most adventurers present in the world.

### Requirement: Dungeon Finder tank settings

The catalog SHALL record the Dungeon Finder tank settings.

#### Scenario: Dungeon Finder tank settings
- **WHEN** The scan reads the Dungeon Finder tank settings.
- **THEN** The catalog records the Dungeon Finder tank settings.

### Requirement: Roster adventurer invite pet facts

The catalog SHALL record, for each roster adventurer, the pet facts of its invite effect.

#### Scenario: Roster adventurer invite pet facts
- **WHEN** The scan reads a roster adventurer's invite effect with pet facts.
- **THEN** The catalog records those pet facts for that roster adventurer.

### Requirement: Adventurer setting source paths

Each value recorded for adventurer world settings, Dungeon Finder tank settings, or roster adventurer invite-effect pet facts SHALL keep its source field path.

#### Scenario: Adventurer setting source paths
- **WHEN** The catalog records a job experience value from an adventurer world settings field.
- **THEN** The recorded value keeps its source field path.

### Requirement: Unreadable adventurer settings remain issues

A setting that the scan cannot read SHALL stay an explicit issue and SHALL NOT take a default value.

#### Scenario: Unreadable adventurer settings remain issues
- **WHEN** The scan cannot read the maximum number of adventurers present in the world.
- **THEN** That setting stays an explicit issue and has no default value.
