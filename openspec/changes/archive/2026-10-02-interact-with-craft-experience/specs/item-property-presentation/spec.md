## MODIFIED Requirements

### Requirement: Crafted items show their recipe on the item page

The product of a published recipe SHALL retain a Crafting section anchored at `crafting`. It SHALL present its materials and quantities as an equation with product yield only when greater than one, the station, required skill level, base experience, computed full/half/no-experience breakpoints, known teaching items, and a guide-section link. The computed full-experience band SHALL distinguish the game's first and second full-experience ranges. The section SHALL show a level control for the recipe's skill that starts at the reader's remembered level, and SHALL state the base experience per craft at that level and the level where it next changes, or the level from which the reader can craft the recipe. The product's own tooltip SHALL NOT be duplicated in the equation. The recipe name SHALL be visible if it differs from its product. A missing teacher SHALL remain unknown, and an unresolved skill SHALL not lead to invented bands. Base experience SHALL not be called the final award after modifiers. No rule prose SHALL appear in this section.

#### Scenario: Crafted item with a teaching item
- **WHEN** Tailoring level 150 crafts Runeweave Regalia with 5 Bolt of Runeweave and 1 Heart of Corruption
- **THEN** its Crafting section shows those materials, the station, experience breakpoints, and a link to Recipe: Runeweave Regalia
- **AND** the equation does not repeat Runeweave Regalia's tooltip

#### Scenario: Recipe name differs from the product
- **WHEN** Ring of Bleed Damage makes Bloodthrall Signet
- **THEN** Crafting names the recipe without claiming that an unknown teacher does not exist

#### Scenario: Recipe skill does not resolve
- **WHEN** a recipe skill cannot be resolved
- **THEN** Crafting retains materials without an invented skill level or experience band

#### Scenario: Experience at the reader's level
- **WHEN** a reader whose Tailoring level is 160 opens Runeweave Regalia, which needs level 150
- **THEN** its Crafting section shows 1,200 Tailoring experience per craft at that level and the half experience from level 170

#### Scenario: Reader below the required level
- **WHEN** a reader whose Tailoring level is 100 opens Runeweave Regalia
- **THEN** its Crafting section says that the reader can craft it from Tailoring level 150
