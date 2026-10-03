## ADDED Requirements

### Requirement: Long lists open at once

A list SHALL build its first 60 rows when it opens, both when the server renders it and when a reader navigates to it, and SHALL then add the remaining rows of the current results in steps between frames until every row is present. A filter, search, or sort change SHALL start again from the first rows of the new results. The column widths SHALL fit the widest values of all current results from the first frame and SHALL NOT change while rows are added. Until the list has measured its columns, as in the page that the server renders, the table SHALL scroll inside its card instead of reaching past it. The result count SHALL always state the number of all current results.

#### Scenario: Reader opens the Items list
- **WHEN** a reader follows a link to the Items list
- **THEN** the list shows its first rows without building all 1,195 rows first, and the remaining rows follow without a long stall

#### Scenario: Widths stay while rows are added
- **WHEN** the Items list adds its remaining rows
- **THEN** no column changes its width

#### Scenario: Reader filters while rows are added
- **WHEN** a reader types in the filter field before every row is present
- **THEN** the list starts again from the first matching rows and its count names every match

#### Scenario: List before its script runs
- **WHEN** a reader sees the Quests list before the page's script has measured its columns
- **THEN** the table scrolls inside its card and no value reaches past the card
