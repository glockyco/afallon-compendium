## MODIFIED Requirements

### Requirement: Long relation tables show their first rows

A relation with up to ten rows SHALL show every row. A relation with more than ten rows SHALL preview its first eight in its current sort order and offer Show N more, where N is the number of hidden rows. A list on a detail page that hides rows behind Show more or Show all SHALL follow the same rule. An address that names a hidden row SHALL reveal it and scroll to it; this SHALL also work inside a hidden tab or closed disclosure.

#### Scenario: Long drop list
- **WHEN** an NPC has 22 drop rows
- **THEN** the section shows eight rows and a Show 14 more control

#### Scenario: Short list
- **WHEN** an item is used in nine recipes
- **THEN** its Used for section shows all nine recipes and no Show more control

#### Scenario: Smallest hidden part
- **WHEN** a relation has eleven rows
- **THEN** the section shows eight rows and a Show 3 more control

#### Scenario: Link to a hidden row
- **WHEN** a reader opens a link to a variant anchored in row 20
- **THEN** the row is revealed and scrolled into view
