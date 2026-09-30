## MODIFIED Requirements

### Requirement: An item page shows its tooltip and sources

An item page SHALL show its name and applicable map action in the title, and its in-game tooltip once with description in the side column (after its answer on narrow screens). Its How to get it answer SHALL show one linked route per available source kind—craft, mine, loot, search, buy, quest reward, or starting gear—ordered by guaranteed yield then known spot count, without treating a chance as guaranteed. Each route SHALL identify a useful example, relevant quantity or chance, and its full anchored source section; an unknown source SHALL be stated plainly. A crafted route SHALL show the materials, known teacher, skill and level, and a computed experience sentence with guide-step link. Its sections SHALL follow Teaches, Used for, then applicable Crafting, Mined from, Dropped by, Sold by, Found in objects, Found in containers, and Quest rewards. Recipe relations SHALL use equations; full relations SHALL remain accessible. Price and stack size SHALL remain available once as secondary facts. A starting-gear route SHALL name only published classes and link their Starting gear sections.

#### Scenario: Item has several sources
- **WHEN** an item drops from seven creatures and is sold by two vendors
- **THEN** How to get it has separate Loot and Buy routes with linked examples and the known lowest price
- **AND** the full source sections retain all nine relations

#### Scenario: Hover tooltip of an item link
- **WHEN** a reader focuses, taps, or hovers an item link
- **THEN** its preview shows the game's tooltip and at most one context line without a source table

#### Scenario: No source is published
- **WHEN** no source relation is published for an item
- **THEN** How to get it says no way to get this item is known for this build

#### Scenario: Starting gear of three classes
- **WHEN** Wizard, Necromancer, and Druid start with Novice Staff
- **THEN** Starting gear is an acquisition route linked to the three class pages and their Starting gear sections

#### Scenario: Starting gear of a class without a page
- **WHEN** only unpublished Berserker starts with Rune Shield
- **THEN** the page shows no starting-gear route to Berserker

#### Scenario: Crafted item
- **WHEN** Tailoring level 150 crafts Runeweave Regalia
- **THEN** its Craft route links its Crafting section and shows the materials and supported experience breakpoint

#### Scenario: Material of a recipe
- **WHEN** Runeweave Regalia uses Bolt of Runeweave
- **THEN** the material's Used for equation links the product's Crafting anchor

### Requirement: Crafted items show their recipe on the item page

The product of a published recipe SHALL retain a Crafting section anchored at `crafting`. It SHALL present its materials and quantities as an equation with product yield only when greater than one, the station, required skill level, base experience, computed full/half/no-experience breakpoints, known teaching items, and a guide-step link. The computed full-experience band SHALL distinguish the game's first and second full-experience ranges. The product's own tooltip SHALL NOT be duplicated in the equation. The recipe name SHALL be visible if it differs from its product. A missing teacher SHALL remain unknown, and an unresolved skill SHALL not lead to invented bands. Base experience SHALL not be called the final award after modifiers. No rule prose SHALL appear in this section.

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
