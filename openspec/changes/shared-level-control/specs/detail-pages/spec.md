## MODIFIED Requirements


### Requirement: Pages compute values at the reader's levels

The site SHALL remember the character level and the skill levels that a reader sets on any page, across pages and visits, in the browser. A page that computes a value from one of these levels SHALL start at the remembered level, or at a stated default before the reader sets one, and SHALL show the control that changes it next to the value, so that no remembered level changes a value out of sight. A level outside a control's range SHALL show at the nearest end without changing the remembered level. The level control SHALL use the shared stepper and slider, whose accessible buttons and keyboard commands adjust within the visible range.

#### Scenario: Level carries to another page
- **WHEN** a reader sets their Fishing level to 75 on Golden Swirl and opens Teeming Fishing Hole
- **THEN** its Fishing level control starts at 75 and its chance uses level 75

#### Scenario: First visit
- **WHEN** a reader who has set no Fishing level opens a fishing node
- **THEN** its control starts at level 1 and shows that level
