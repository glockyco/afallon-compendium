## MODIFIED Requirements

### Requirement: The hero shows the entity as the game shows it

A hero SHALL be one panel with a view area and a facts area. The view area SHALL show the entity as the game shows it: the item tooltip, the NPC portrait, the place artwork, the property purchase panel, the ability tooltip, the tooltip of a recipe's product, or the icon of a class or a skill. The facts area SHALL show the description and the key facts of the kind. The description SHALL appear once in the hero. When the entity has no view, the facts area SHALL use the whole panel. When the entity has no view and no hero facts, the page SHALL NOT show a hero. Neither area SHALL stretch to the height of the other area. On screens narrower than 640 px, the facts area SHALL follow the view area.

#### Scenario: NPC without a portrait
- **WHEN** an NPC has stats but no portrait
- **THEN** its hero shows the stats across the whole panel

#### Scenario: Place with artwork
- **WHEN** a place has artwork and a description
- **THEN** its hero shows the artwork beside the description

#### Scenario: Class with an icon
- **WHEN** a reader opens the Shieldmaster page
- **THEN** its hero shows the class icon beside the description

### Requirement: Ability pages compare versions

An ability page SHALL show in its hero the tooltip of the version with the most users. When versions have the same number of users, the hero SHALL show the first of them. The hero SHALL show the requirements to use the version that it shows: costs, such as "Costs 9 Mana", and conditions, such as "Ursine Aspect is active". The sections SHALL follow this order: Versions, Learned by, Used by, Taught by. When the ability has several versions, a Versions section SHALL show the text, the use requirements, and the number of users of each version in one table. The Learned by section SHALL list each published class that learns the ability. A Learned by row SHALL name the class and how the class learns the ability: as its auto attack, or through a talent tree node with its tree and tier. A talent tree row SHALL show the requirements of its node and SHALL link to the row of that node on the class page. The Learned by and Used by sections SHALL group their rows by version when the ability has several versions. The Taught by section SHALL list the items that teach the ability.

#### Scenario: Ability with five versions
- **WHEN** an ability has five versions
- **THEN** the Versions table has five rows
- **AND** the Used by section groups its NPCs under each version

#### Scenario: Ability from a talent tree
- **WHEN** a reader opens the Maul page
- **THEN** the Learned by section has one row that names Druid, Primal Feral, and tier 2
- **AND** the row links to the Maul row on the Druid page
- **AND** the hero shows "Ursine Aspect is active"

#### Scenario: Ability of a class that no race offers
- **WHEN** only the Hunter class learns Barbed Quarrel, and no race offers Hunter
- **THEN** the Barbed Quarrel page has no Learned by section
- **AND** its hero shows "Costs 9 Mana"

## ADDED Requirements

### Requirement: Class pages show how a class progresses

The publication SHALL publish a page for each class that at least one race offers. A class that no race offers SHALL NOT have a page. The title block of a class page SHALL show the kind and the races that offer the class. The hero SHALL show the class icon, the description, the weapon types that the class can use, its auto attack ability, the talent points that it gains, and its highest level. The sections SHALL follow this order: one section for each talent tree of the class in authored order, Starting gear, and Experience. The heading line of a talent tree section SHALL name the talent points that the tree uses. A talent tree table SHALL show one row for each node, ordered by tier and then by position in the tier. A row SHALL show the tier, the talent, the effect of a passive talent at its first rank and at its last rank, and the requirements of the node. The row of an ability node SHALL link the ability. Each row SHALL have an anchor. The Starting gear section SHALL show each starting item with its count, and SHALL show whether the character starts with the item equipped.

#### Scenario: Offered class
- **WHEN** a reader opens the Shieldmaster page
- **THEN** its sections are Bastion Breaker, Guardian, Templar, Aegis Mastery, Heroic Ascension, Starting gear, and Experience, in this order

#### Scenario: Class that no race offers
- **WHEN** no race offers the Hunter class
- **THEN** the publication has no Hunter page
- **AND** a requirement that names Hunter shows the class name without a link

#### Scenario: Passive talent with five ranks
- **WHEN** Aegis Discipline gives 2 Block chance at rank 1 and 10 Block chance at rank 5
- **THEN** its row shows both effects with their ranks

#### Scenario: Talent tree with its own talent points
- **WHEN** the Heroic Ascension tree of Shieldmaster uses Heroic Essence
- **THEN** the heading line of the Heroic Ascension section names Heroic Essence

### Requirement: Skill pages show recipes and levels

The publication SHALL publish a page for each skill. The title block of a skill page SHALL show the kind. The hero SHALL show the skill icon and its highest level. When a character does not receive the skill automatically, the hero SHALL state it. The sections SHALL follow this order: Recipes, Experience. The Recipes section SHALL show each recipe that uses the skill with its product and its station. A skill with a highest level of zero SHALL NOT show an Experience section.

#### Scenario: Crafting skill
- **WHEN** a reader opens the Alchemy page
- **THEN** the Recipes section shows its 22 recipes with their products and stations

#### Scenario: Weapon skill
- **WHEN** a reader opens the Axes page
- **THEN** the page has no Recipes section
- **AND** the Experience section has 300 rows

#### Scenario: Skill without levels
- **WHEN** the Savers skill has a highest level of zero
- **THEN** its page has no Experience section

### Requirement: Experience tables state what each value means

The Experience section of a class or a skill SHALL show one row for each level from 1 to the highest level, with the experience that the level template of the class or skill assigns to that level. The game uses the value of a row as the experience that takes a character from that level to the next level. The label of the experience column SHALL state this meaning.

#### Scenario: Class levels
- **WHEN** the class level template assigns 40 experience to level 2
- **THEN** the row for level 2 on each class page shows 40
- **AND** the column label is "Experience to next level"
