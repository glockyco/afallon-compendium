## MODIFIED Requirements

### Requirement: Class pages show how a class progresses

The publication SHALL publish a page for each class that at least one race offers. A class that no race offers SHALL NOT have a page. The title block SHALL show the kind and the races that offer the class. The hero SHALL show the class icon, description, allowed weapon types, auto attack, talent points, and highest level. The sections SHALL appear in this order: Talent trees, then Starting gear. The page SHALL link to Character progression for character experience rules and the level curve. The page SHALL NOT show an Experience table. The Talent trees section SHALL offer each tree of the class in authored order as a URL-backed tab. The selected tree SHALL show its name, available icon, and talent point type. Its default grid SHALL keep every node in its captured tier and position, including empty positions. The grid SHALL preserve the layout of trees with up to 10 tiers and 6 positions per tier. The selected tree SHALL also offer the current table as a second view. The table SHALL show every node in tier and position order. Both views SHALL show the available icon and name of each node. A node SHALL expose its tier, ranks, first-rank and last-rank effects for passive talents, and requirements. An ability node SHALL link its ability. Every node SHALL retain its anchor. The Starting gear section SHALL show each starting item, its count, and whether the character starts with it equipped. The page SHALL NOT lose nodes or scroll sideways at a viewport width of 390 px.

#### Scenario: Offered class
- **WHEN** a reader opens the Shieldmaster page
- **THEN** the Talent trees section offers Bastion Breaker, Guardian, Templar, Aegis Mastery, and Heroic Ascension in authored order
- **AND** Starting gear follows the Talent trees section
- **AND** the page links to Character progression instead of showing an Experience table

#### Scenario: Class that no race offers
- **WHEN** no race offers the Hunter class
- **THEN** the publication has no Hunter page
- **AND** a requirement that names Hunter shows the class name without a link

#### Scenario: Passive talent with five ranks
- **WHEN** Aegis Discipline gives 2 Block chance at rank 1 and 10 Block chance at rank 5
- **THEN** its detail shows both effects with their ranks in either view

#### Scenario: Talent tree with its own talent points
- **WHEN** the reader selects the Heroic Ascension tree of Shieldmaster
- **THEN** that tree's heading names Heroic Essence

#### Scenario: Narrow tree grid
- **WHEN** a reader opens a six-position talent tree at 390 px
- **THEN** every tier and position remains available without sideways page scrolling
- **AND** the reader can inspect each node's name, effects, and requirements

#### Scenario: Missing icon
- **WHEN** a talent has no extracted icon
- **THEN** its name, position, effects, requirements, and anchor remain available
