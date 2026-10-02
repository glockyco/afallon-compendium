## MODIFIED Requirements

### Requirement: List columns size to their values

Above phone widths a list SHALL show every value on one line. Each column SHALL take the width of its widest value or heading. A name SHALL be capped near the longest ordinary item name and a text that names another thing near the longest ordinary such name. The table SHALL fill its card. Spare width SHALL first show cut texts in full. The rest SHALL spread in equal parts between neighbouring columns, and after the last column when its values are left-aligned, each part showing after a left-aligned value or before a number, so the space between values is the same across the row. A name SHALL keep its cap and gain only its own part. When the columns do not fit, names and texts SHALL shrink first and labels only after them, each down to a floor, and a cut value SHALL end in an ellipsis. Numbers and badges SHALL NOT be cut. The tooltip and page of an entry SHALL show its whole name, and a cut cell SHALL show its whole value as its title, while a cell that fits SHALL have no title. A table wider than its card at its floors SHALL scroll inside its card, and no list SHALL scroll the page sideways at 1440, 1100, or 390 px. A list SHALL NOT show a column whose value is the same in every row. A link's hover area SHALL cover only its icon and name.

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

#### Scenario: Recipe columns spread across the card
- **WHEN** a reader opens the recipe list at 1440 px
- **THEN** Recipe, Station, and Skill spread across the card with the same space after each column, instead of standing together at the left edge

## ADDED Requirements

### Requirement: The skill and guide lists say what each entry is

The skill list SHALL name each skill's type: Crafting for a skill that a recipe trains, Gathering for a skill that a gathering node trains, and Weapon for a skill that weapon hits train. It SHALL count each skill's recipes and gathering nodes and SHALL leave a count blank where it does not apply. The guide list SHALL show the sentence that says what each guide explains.

#### Scenario: Skill types
- **WHEN** a reader opens the skill list
- **THEN** Alchemy reads Crafting with 22 recipes, Mining reads Gathering with 14 gathering nodes, and Axes reads Weapon with both counts blank

#### Scenario: Guide descriptions
- **WHEN** a reader opens the guide list
- **THEN** each guide shows what it explains next to its name

### Requirement: List headings stay in view without covering rows

Above phone widths a list's column headings SHALL start directly above its first row, and SHALL stay below the result count while the reader scrolls the page. A table that does not fit its card SHALL scroll inside the card with its headings at the card's top.

#### Scenario: First row at a tablet width
- **WHEN** a reader opens the recipe list at 800 px
- **THEN** the first recipe shows directly below the column headings

#### Scenario: Headings while scrolling
- **WHEN** a reader scrolls down the item list
- **THEN** the column headings stay directly below the result count
