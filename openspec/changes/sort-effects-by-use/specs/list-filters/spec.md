## MODIFIED Requirements

### Requirement: Filter state lives in the URL

The list SHALL keep its name search, sort, facet values, ranges, and stat filters in the URL. Opening or reloading a URL SHALL restore the controls and the results. Back and Forward SHALL restore earlier selections. Labels, chips, and columns SHALL use reader-facing names, not record ids or raw enum words. The URL SHALL omit the sort only when it equals the list's default, and SHALL omit the direction only when it equals the default sort's direction or, for another column, that column's first-click direction (A to Z for text, high to low for numbers). A URL that names a sort without a direction SHALL use that same direction. Numeric column headings SHALL align their label with the numbers below them.

#### Scenario: Shared filtered list
- **WHEN** a reader opens `/items/?class=Shieldmaster&slot=BOOTS&stat=Stamina:10:`
- **THEN** the class, slot, and stat filters are selected and their combined results show

#### Scenario: Clear and return
- **WHEN** a reader selects Clear all and then Back
- **THEN** the previous filters and results return

#### Scenario: Name sort on a list sorted by a count
- **WHEN** a reader sorts the Effects list by name, in either direction, and reloads the page
- **THEN** the same name order returns

#### Scenario: Sort without a direction
- **WHEN** a reader opens `/stats/?sort=name`
- **THEN** the stats appear from A to Z
