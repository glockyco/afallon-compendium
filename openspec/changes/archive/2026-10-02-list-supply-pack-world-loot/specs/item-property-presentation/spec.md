## MODIFIED Requirements

### Requirement: Supply packs show eligible rewards and roll rules

For each class and level band gated LootTable action of Adventurer's Supply Pack, When used SHALL show that band's authored entries in a relation table. A tab for each class SHALL select the bands of that class, and a tab for each level band of that class SHALL select one band. A band that names several classes SHALL appear under each of them. The selected level band SHALL stay selected when the reader changes the class and the new class has the same band. A band SHALL name only the classes that a race offers, and a band whose class condition names no such class SHALL be left out, because no player can open it. A short data sentence SHALL show the published minimum picks, the bonus chance, the maximum when it lowers the total, and the world share when present, with the world share described as the chance that an item is world loot for the character's class and level. The band's published armor and stat filters SHALL remain visible. For each band and class, When used SHALL list the world loot items that the band can give that class, each with the character levels at which it can appear, as the game's world loot rules decide them from the world loot tables, the item's level requirement, the class's weapon types, and the band's armor and stat filters. The list SHALL NOT claim a chance for a world loot item. A placed When used rule SHALL link to the supply pack section of the Loot guide, which states the pack roll, world eligibility, and lifecycle rules, instead of repeating those mechanics as item-page prose.

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

#### Scenario: World loot of a band
- **WHEN** a reader selects the Wizard tab and the levels 1–5 tab of Adventurer's Supply Pack
- **THEN** the band lists the world loot items that a level 1 to 5 Wizard can get, each with its character levels
- **AND** it lists no weapon that a Wizard cannot use and no armor of another armor type than the band names

#### Scenario: Item without a level requirement
- **WHEN** a world loot item has no level requirement and its world loot table has no upper level
- **THEN** the item shows as available from the band's lowest level, without an upper level
