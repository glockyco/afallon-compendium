## MODIFIED Requirements

### Requirement: Long relation tables show their first rows

A relation with up to ten rows SHALL show every row. A relation with more than ten rows SHALL preview its first eight in its current sort order and offer Show N more, where N is the number of hidden rows. A list on a detail page that hides rows behind Show more or Show all SHALL follow the same rule. Every linked row SHALL also be present in prerendered HTML inside a native disclosure that a reader without JavaScript can open. An address that names a hidden row SHALL reveal it and scroll to it; this SHALL also work inside a hidden tab or closed disclosure.
Linked entities that otherwise appear only inside an inactive talent or stat tab SHALL also have a native static disclosure so no-JavaScript readers can reach them.


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

#### Scenario: Static merchant wares
- **WHEN** the Interior Decorator lists 41 wares behind Show more
- **THEN** all 41 linked wares appear in its prerendered HTML
- **AND** without JavaScript the extra wares can be opened through a native disclosure

#### Scenario: Linked inactive tabs
- **WHEN** a class talent or stat source has a linked ability, item, or effect in a tab that is not selected on the static page
- **THEN** the linked entity appears inside a native static disclosure without changing the hydrated tab's first view

### Requirement: Relation tables build only the rows they show

Interactive relation tables SHALL build only their visible rows after hydration. Additional rows SHALL have their linked content in a native disclosure in the server-rendered HTML; that disclosure SHALL remain usable without JavaScript and SHALL be replaced by the original Show N more control after hydration. Revealed interactive rows SHALL be added in steps, the first step at once, so that no step blocks the page for long. A row that an address names SHALL be built before it scrolls into view.

#### Scenario: Long hidden relation
- **WHEN** a reader opens the Gold page, whose relations hold 659 rows of which 36 show
- **THEN** the hydrated page builds 36 interactive relation rows and still offers each Show N more control with its full count
- **AND** its prerendered HTML contains the links in the remaining rows inside native disclosures

#### Scenario: Reader shows the hidden rows
- **WHEN** a reader selects Show 615 more on a relation
- **THEN** the next rows appear at once and the rest follow in steps, in the current sort order

#### Scenario: Address names a hidden row
- **WHEN** a reader opens a link to an anchor in row 400 of a previewed relation
- **THEN** the row is built, revealed, and scrolled into view
