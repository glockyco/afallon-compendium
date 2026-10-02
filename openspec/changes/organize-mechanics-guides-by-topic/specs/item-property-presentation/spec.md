## MODIFIED Requirements

### Requirement: Crafted items show their recipe on the item page

The product of a published recipe SHALL retain a Crafting section anchored at `crafting`. It SHALL present its materials and quantities as an equation with product yield only when greater than one, the station, required skill level, base experience, computed full/half/no-experience breakpoints, known teaching items, and a guide-section link. The computed full-experience band SHALL distinguish the game's first and second full-experience ranges. The product's own tooltip SHALL NOT be duplicated in the equation. The recipe name SHALL be visible if it differs from its product. A missing teacher SHALL remain unknown, and an unresolved skill SHALL not lead to invented bands. Base experience SHALL not be called the final award after modifiers. No rule prose SHALL appear in this section.

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

### Requirement: Item pages explain rewards from use actions

An item page SHALL show a When used section when captured item actions spawn prefab chests or open loot tables. Chest contents SHALL appear in a relation table sorted by row chance, with item or currency, inclusive quantity range, and chance per row clear on the page. Only the published action chance when below 100% and positive maximum-drop cap SHALL appear as short data sentences. The page SHALL distinguish an Item action that gains an item from one that consumes it in plain sentences. A placed When used rule SHALL link to the section of the Loot guide on items that open a chest, without repeating rule prose on the item page. No internal effect, prefab, chest, or loot table name SHALL be published.

#### Scenario: A soaked bag spawns a chest
- **WHEN** an item has a TriggerVisualEffect action whose effect template contains a chest prefab
- **THEN** its When used section lists every chest row including currency rows and the maximum-drop cap
- **AND** its own Item action is described by the captured AlterAction, not inferred from its item ID

### Requirement: Supply packs show eligible rewards and roll rules

For each class and level band gated LootTable action of Adventurer's Supply Pack, When used SHALL show that band's authored entries in a relation table. A tab for each class SHALL select the bands of that class, and a tab for each level band of that class SHALL select one band. A band that names several classes SHALL appear under each of them. The selected level band SHALL stay selected when the reader changes the class and the new class has the same band. A band SHALL name only the classes that a race offers, and a band whose class condition names no such class SHALL be left out, because no player can open it. A short data sentence SHALL show the published minimum picks, the bonus chance, the maximum when it lowers the total, and the world share when present, with the world share described as the chance that an item is world loot for the character's class and level. The band's published armor and stat filters SHALL remain visible. The page SHALL NOT enumerate a world pool at a fixed player level. A placed When used rule SHALL link to the supply pack section of the Loot guide, which states the pack roll, world eligibility, and lifecycle rules, instead of repeating those mechanics as item-page prose.

#### Scenario: A supply pack belongs to different classes
- **WHEN** class and level requirements select distinct tables
- **THEN** the page lists each class/level band with only the entries of its selected table
- **AND** it does not suggest that the pack grants every table at once

#### Scenario: A band names an unplayable class
- **WHEN** a band's class condition names a class that no race offers, alone or beside a playable class
- **THEN** the band names only the playable class, and a band with no playable class is not shown

#### Scenario: Reader picks a class and a level
- **WHEN** a reader selects the Wizard tab and the levels 6–11 tab in When used of Adventurer's Supply Pack
- **THEN** the section shows only the entries of the Wizard table for levels 6–11
- **AND** after the reader selects the Druid tab, the section shows the Druid table for levels 6–11
