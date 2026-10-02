## ADDED Requirements

### Requirement: Pages compute values at the reader's levels

The site SHALL remember the character level and the skill levels that a reader sets on any page, across pages and visits, in the browser. A page that computes a value from one of these levels SHALL start at the remembered level, or at a stated default before the reader sets one, and SHALL show the control that changes it next to the value, so that no remembered level changes a value out of sight. A level outside a control's range SHALL show at the nearest end without changing the remembered level.

#### Scenario: Level carries to another page
- **WHEN** a reader sets their Fishing level to 75 on Golden Swirl and opens Teeming Fishing Hole
- **THEN** its Fishing level control starts at 75 and its chance uses level 75

#### Scenario: First visit
- **WHEN** a reader who has set no Fishing level opens a fishing node
- **THEN** its control starts at level 1 and shows that level

## MODIFIED Requirements

### Requirement: Pages show the rules placed on them

Reviewed rules SHALL remain available in their section of their mechanics guide. An entity page SHALL show only supported computed values relevant to its fact or section, in plain language, with a link to the corresponding guide section. Each section that receives a placed rule SHALL show that link. It SHALL NOT reproduce rule prose in sections, label hints, or hover cards. A linked placement SHALL affect only entities named by that placement. Missing verified operands SHALL not produce a fabricated computed result.

#### Scenario: Attunement rule of one node
- **WHEN** a verified rule names Small Iron Vein but not Silver Vein
- **THEN** only the named node may show its supported computed effect and guide-section link

#### Scenario: Gathering probability endpoints
- **WHEN** verified evidence supports a yield bonus at Mining level 1 and its highest level
- **THEN** the node shows the computed value at the reader's Mining level and both published values in a short sentence with a guide-section link, not the rule text

#### Scenario: Rule explains a fact
- **WHEN** a verified kill experience rule applies to a creature's experience fact
- **THEN** that fact links its applicable guide section and shows a supported computed value without rule prose in the label or its hover card

#### Scenario: Computed yield bonus
- **WHEN** Small Iron Vein has no Mining gate and verified gathering yield bonus operands
- **THEN** its Gives answer shows the bonus at the reader's Mining level and at Mining level 1 and the highest Mining level, with a guide-section link rather than a How it works rules section

#### Scenario: Items found in object chests
- **WHEN** the rules record places the object chest rule on the Found in objects section of Human Skull
- **THEN** that section links the World objects section of the Loot guide

#### Scenario: Chance that a spawner picks a node
- **WHEN** a reader sets their Mining level on Silver Vein and checks Prospector's Silver Tonic
- **THEN** the side shows the chance that a spawner picks Silver Vein at that level with that attunement
- **AND** Spawn odds shows every option of those spawners with its weight and chance at the same level
