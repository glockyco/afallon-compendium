## MODIFIED Requirements

### Requirement: Class pages show how a class progresses

The publication SHALL publish a page for each class that at least one race offers. A class that no race offers SHALL NOT have a page. The title block of a class page SHALL show the kind and the races that offer the class. The hero SHALL show the class icon, the description, the weapon types that the class can use, its auto attack ability, the talent points that it gains, and its highest level. The sections SHALL follow this order: one section for each talent tree of the class in authored order, then Starting gear. The page SHALL link to Character progression for character experience rules and the level curve. The page SHALL NOT show an Experience table. The heading line of a talent tree section SHALL name the talent points that the tree uses. A talent tree table SHALL show one row for each node, ordered by tier and then by position in the tier. A row SHALL show the tier, the talent, the effect of a passive talent at its first rank and at its last rank, and the requirements of the node. The row of an ability node SHALL link the ability. Each row SHALL have an anchor. The Starting gear section SHALL show each starting item with its count, and SHALL show whether the character starts with the item equipped.

#### Scenario: Offered class
- **WHEN** a reader opens the Shieldmaster page
- **THEN** its sections are Bastion Breaker, Guardian, Templar, Aegis Mastery, Heroic Ascension, and Starting gear, in this order
- **AND** the page links to Character progression instead of showing an Experience table

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

The publication SHALL publish a page for each skill. The title block of a skill page SHALL show the kind. The hero SHALL show the skill icon and its highest level. When a character does not receive the skill automatically, the hero SHALL state it. The sections SHALL show Recipes when the skill has recipes. The Recipes section SHALL show each recipe that uses the skill with its product and its station. Every skill page SHALL link to Character progression for related experience rules. A skill page SHALL NOT show an Experience table.

#### Scenario: Crafting skill
- **WHEN** a reader opens the Alchemy page
- **THEN** the Recipes section shows its 22 recipes with their products and stations
- **AND** the page links to Character progression instead of showing an Experience table

#### Scenario: Weapon skill
- **WHEN** a reader opens the Axes page
- **THEN** the page has no Recipes section and no Experience table
- **AND** the page links to Character progression

#### Scenario: Skill without levels
- **WHEN** a published skill has a highest level of zero
- **THEN** its page has no Experience section
- **AND** the page still links to Character progression

## REMOVED Requirements

### Requirement: Experience tables state what each value means

**Reason**: The Character progression page replaces per-class and per-skill tables with a level curve and source rules.

**Migration**: Class and skill pages link to `/mechanics/character-progression`. The chart states that each template row is the experience from its level to the next level.
