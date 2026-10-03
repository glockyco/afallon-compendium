## ADDED Requirements

### Requirement: Relation tables build only the rows they show

A relation table SHALL build page content only for the rows that it shows. Rows that its preview hides SHALL NOT be built, on the server or in the browser, until Show N more or an address reveals them. Revealed rows SHALL be added in steps, the first step at once, so that no step blocks the page for long. A row that an address names SHALL be built before it scrolls into view.

#### Scenario: Long hidden relation
- **WHEN** a reader opens the Gold page, whose relations hold 659 rows of which 36 show
- **THEN** the page builds 36 relation rows and still offers each Show N more control with its full count

#### Scenario: Reader shows the hidden rows
- **WHEN** a reader selects Show 615 more on a relation
- **THEN** the next rows appear at once and the rest follow in steps, in the current sort order

#### Scenario: Address names a hidden row
- **WHEN** a reader opens a link to an anchor in row 400 of a previewed relation
- **THEN** the row is built, revealed, and scrolled into view
