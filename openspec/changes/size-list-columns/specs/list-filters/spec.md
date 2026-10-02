## REMOVED Requirements

### Requirement: List names stay on one line

**Reason**: Replaced by a column layout that sizes every column, not only names and type columns.

**Migration**: See "List columns size to their values".

## ADDED Requirements

### Requirement: List columns size to their values

Above phone widths a list SHALL show every value on one line. Each column SHALL take the width of its widest value or heading. A name SHALL be capped near the longest ordinary item name and a text that names another thing near the longest ordinary such name. The table SHALL fill its card, and the last column that is not a number SHALL take the spare width, so values sit next to each other and numbers sit at the right edge. When the columns do not fit, names and texts SHALL shrink first and labels only after them, each down to a floor, and a cut value SHALL end in an ellipsis. Numbers and badges SHALL NOT be cut. The tooltip and page of an entry SHALL show its whole name, and a cut cell SHALL show its whole value as its title, while a cell that fits SHALL have no title. A table wider than its card at its floors SHALL scroll inside its card, and no list SHALL scroll the page sideways at 1440, 1100, or 390 px. A list SHALL NOT show a column whose value is the same in every row. A link's hover area SHALL cover only its icon and name.

#### Scenario: Long variant name
- **WHEN** the item list shows Gilded Helm (Haste +17, Stamina +9, Strength +20)
- **THEN** the name ends in an ellipsis on one line
- **AND** its tooltip shows the whole name

#### Scenario: Spare width
- **WHEN** the ability list is wider than its names and sources
- **THEN** the table fills its card and the Source column shows each source in full

#### Scenario: Same value in every row
- **WHEN** every skill has the same highest level
- **THEN** the skill list shows no Highest level column

#### Scenario: Empty space beside a short name
- **WHEN** a reader points at the empty part of a name cell beside a short name
- **THEN** no tooltip opens

#### Scenario: Recipe products
- **WHEN** a reader opens the recipe list
- **THEN** it shows no Product column, and each recipe links its product
