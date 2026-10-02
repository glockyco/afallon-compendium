## MODIFIED Requirements

### Requirement: Sections explain their own values

Sections SHALL label probabilities, quantities, and conditions in plain language sufficient to interpret the shown values without another page. A short computed sentence MAY explain an entity-specific value; rule prose SHALL instead live in the relevant guide section linked by a quiet How it works action. Labels and explanatory hints SHALL work on hover, focus, and tap, but SHALL NOT contain copied rule text or require a hover card to understand a fact.

#### Scenario: NPC drops
- **WHEN** an NPC's loot table rolls on 5% of kills
- **THEN** its Drops heading identifies the table's roll chance, separately from each item's conditional chance
- **AND** a guide link explains the rule without a rules paragraph beneath the rows

### Requirement: Recipe items and recipes link each other

A recipe item with a captured Recipe RankUp action SHALL show Teaches as a recipe equation with linked product, materials, station, required skill and level, plus an entity-specific experience sentence and guide-section link when supported. It SHALL not duplicate the product's game tooltip. A product's Crafting section SHALL link each known teaching item. An unknown teacher SHALL not be described as nonexistent.

#### Scenario: Recipe item teaches a recipe
- **WHEN** Recipe: Runeweave Regalia teaches Runeweave Regalia
- **THEN** its Teaches equation links the product and shows its Tailoring station, level 150, and materials without a second product tooltip
- **AND** the product's Crafting section links back to the recipe item

#### Scenario: Recipe has no known teaching item
- **WHEN** no captured item action teaches a recipe
- **THEN** the product names no teaching item and makes no claim that none exists
- **AND** coverage still records the missing teacher

### Requirement: Pages show the rules placed on them

Reviewed rules SHALL remain available in their section of their mechanics guide. An entity page SHALL show only supported computed values relevant to its fact or section, in plain language, with a link to the corresponding guide section. Each section that receives a placed rule SHALL show that link. It SHALL NOT reproduce rule prose in sections, label hints, or hover cards. A linked placement SHALL affect only entities named by that placement. Missing verified operands SHALL not produce a fabricated computed result.

#### Scenario: Attunement rule of one node
- **WHEN** a verified rule names Small Iron Vein but not Silver Vein
- **THEN** only the named node may show its supported computed effect and guide-section link

#### Scenario: Gathering probability endpoints
- **WHEN** verified evidence supports a yield bonus at Mining level 1 and its highest level
- **THEN** the node shows both computed values in a short sentence with a guide-section link, not the rule text

#### Scenario: Rule explains a fact
- **WHEN** a verified kill experience rule applies to a creature's experience fact
- **THEN** that fact links its applicable guide section and shows a supported computed value without rule prose in the label or its hover card

#### Scenario: Computed yield bonus
- **WHEN** Small Iron Vein has no Mining gate and verified gathering yield bonus operands
- **THEN** its Gives answer shows the bonus at Mining level 1 and at the highest Mining level, with a guide-section link rather than a How it works rules section

#### Scenario: Items found in object chests
- **WHEN** the rules record places the object chest rule on the Found in objects section of Human Skull
- **THEN** that section links the World objects section of the Loot guide
