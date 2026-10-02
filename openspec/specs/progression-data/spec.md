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

The catalog SHALL record for each effect its type, its tag, whether it is a state, whether it is a buff on the caster, its stack limit, whether several casters can apply it, its pulses, its duration, whether it lasts without end, whether a player can remove it, and whether it persists. For each rank, the catalog SHALL record the damage type and the damage, the stat that the rank alters, the weapon damage and skill modifiers, lifesteal, the health modifiers, the delay, the effect that the rank requires with its modifier, the stat changes, the nested effects with their chance and rank, the teleport destination scene, the loot table, the pet with its count and duration, the knockback and motion distances, the dispel target, the taunt threat, and the resurrection health. A value of a native enum that the collector cannot name SHALL keep its number.

#### Scenario: Stun effect
- **WHEN** an effect of the type Stun lasts 3 seconds
- **THEN** the catalog records the type Stun and the duration 3

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

The catalog SHALL record for each ability its type, whether a character knows it by default, and whether it requires a ranged weapon. For each rank, the catalog SHALL record its unlock cost, its activation type, its cast time, its channel time, its cooldown, whether it uses the global cooldown, its minimum and maximum range, its target type, its area radius, its cone angle and range, its projectile count, the most targets that it hits, the effects that it applies to its targets and to its caster with their chance, rank, and target, and its requirement groups. The tooltip text of each rank SHALL stay.

#### Scenario: Ability that applies an effect
- **WHEN** an ability rank applies a bleed effect with a chance of 50 percent
- **THEN** the catalog records that effect, the chance 50, and the rank of the effect with the ability rank

### Requirement: The catalog derives who learns and applies what

The catalog SHALL derive for each ability the classes and skills that give it: through a spellbook node with its unlock level, through a talent tree node with its tree, tier, and row, as the auto-attack ability of a class, or as an action ability. The catalog SHALL derive for each recipe and resource node the talent tree nodes that unlock it, and for each effect the abilities, effects, and stats that apply it.

#### Scenario: Class ability from a spellbook
- **WHEN** a class spellbook has an ability node with the unlock level 10
- **THEN** the ability lists that class at level 10

#### Scenario: Profession unlock
- **WHEN** a skill talent tree has a recipe node at tier 2
- **THEN** that recipe lists the tree, tier 2, and the row of the node

### Requirement: Missing and unresolved data stay visible

When a record, a list, or a list member is null in the game data, the evidence SHALL record it as unavailable with its field path, and the catalog SHALL NOT invent a value for it. When a node, a bonus rank, an effect, or a class names an ID that no record has, the catalog SHALL record a missing-reference coverage issue, SHALL keep the reference with the ID in its label and without a target, and SHALL derive no relation from it. The catalog SHALL read support evidence only from the canonical target of its plan, and SHALL stop when that target has no `compendium.support.v2` evidence. Other targets of the plan MAY keep `compendium.support.v1` evidence.

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

### Requirement: Races record the classes that they offer

The catalog SHALL record for each race the classes that the race offers, in authored order. A class ID without a class record SHALL become a missing-reference issue, and SHALL NOT count as an offered class. The catalog SHALL derive the set of classes that at least one race offers.

#### Scenario: Offered classes of build 25434619
- **WHEN** the catalog is built from a scan of build 25434619
- **THEN** Dwarf, Human, and Orc each offer Shieldmaster, Wizard, Necromancer, Assassin, and Druid
- **AND** no race offers Hunter or Berserker

### Requirement: The catalog records experience modifiers and Heroic settings

The catalog SHALL record the authored lower-level and higher-level experience modifiers of each creature that has them. It SHALL record the Heroic settings used to explain kill experience, Essence rewards, creature health and damage, gear scaling, affixes, affix loot, and Heroic gear stats. Each setting SHALL retain its source and build provenance. A missing setting SHALL remain unavailable rather than become a default or a number embedded in the site. Verified calculation rules SHALL carry recorded evidence through the catalog and publication.

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

### Requirement: Rules name where they appear

Each reviewed rule SHALL have a mechanics guide topic. The catalog SHALL retain its text, status, operands, links, and evidence, and MAY retain validated placements that identify a page kind, defined fact or section target, and supported `all`, `linked`, or conditional scope. An entity placement SHALL select a computed fact and the anchor of the guide section of its rule, not copy the rule prose to an entity page, column hint, or hover card. A `linked` placement SHALL apply only to its linked entities. Catalog creation SHALL reject a missing topic and an unknown page kind, target, or scope, and publication SHALL reject a rule section that its guide does not define; a placement SHALL NOT alter rule evidence or operands.

#### Scenario: Rule without a topic
- **WHEN** a reviewed rule has a placement on the Crafting section of item pages but no guide topic
- **THEN** catalog creation rejects it until it has an appropriate guide topic and section

#### Scenario: Unknown target
- **WHEN** a placement names a section not defined for its page kind
- **THEN** catalog creation fails and names the rule

#### Scenario: Placements added to accepted rules
- **WHEN** a rules record adds placements to previously accepted rules
- **THEN** each rule keeps its accepted text, status, operands, links, and evidence and its entity placement resolves to a guide-section link

### Requirement: Publication derives place counts and endpoint spawn shares

The publication SHALL provide distinct known map-spot counts grouped by published place for gathering nodes and creature locations and total known spots for applicable item source routes. A spot shared by equivalent merged rows SHALL count once; different conditional placements SHALL preserve their conditions in the expanded list. A gathering node with verified weighted spawner options SHALL provide effective option share at the lowest and highest supported skill levels, computed from eligible captured options and their verified weighting rules, with the skill levels and denominator identified. It SHALL distinguish a choice by one spawner from an aggregate over multiple spawners. If no meaningful aggregate is supported, it SHALL present separately supported shares or state that an overall share is unknown; it SHALL NOT imply an attunement bonus or call a weight a drop chance. Missing place or weight evidence SHALL not produce an invented count or probability.

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

### Requirement: Game action owners retain their actions

The catalog SHALL retain the game actions of every owner type in the order that the game reads them. Each action SHALL keep its owner identity, type, chance, node action, amount, target references, and requirement groups. When an owner uses a game actions template, the catalog SHALL retain the actions of the template and the template identity. A loot table that a LootTable action of an item names SHALL link to that item with the requirement groups of the action. The LootTable and Item gain actions of an interactable object SHALL be item sources of that object, with the action chances and requirements. Any other game action of a non-item owner that gives an item, a loot table, a currency, or a recipe SHALL be a coverage issue. The Chest action of an interactable object is not a game action. An unresolved owner or target SHALL remain visible as a coverage issue.

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
