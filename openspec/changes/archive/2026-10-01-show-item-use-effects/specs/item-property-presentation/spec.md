## ADDED Requirements

### Requirement: Item pages explain rewards from use actions

An item page SHALL show a When used section when captured item actions spawn prefab chests or open loot tables. Chest contents SHALL appear in a relation table sorted by row chance, with item or currency, inclusive quantity range, and chance per row clear on the page. Only the published action chance when below 100% and positive maximum-drop cap SHALL appear as short data sentences. The page SHALL distinguish an Item action that gains an item from one that consumes it in plain sentences. A placed When used rule SHALL link to the Loot Mechanics guide step for the chest roll rules, without repeating rule prose on the item page. No internal effect, prefab, chest, or loot table name SHALL be published.

#### Scenario: A soaked bag spawns a chest
- **WHEN** an item has a TriggerVisualEffect action whose effect template contains a chest prefab
- **THEN** its When used section lists every chest row including currency rows and the maximum-drop cap
- **AND** its own Item action is described by the captured AlterAction, not inferred from its item ID

### Requirement: Supply packs show eligible rewards and roll rules

For each class and level band gated LootTable action of Adventurer's Supply Pack, When used SHALL disclose that band's authored entries in a relation table. A band SHALL name only the classes that a race offers, and a band whose class condition names no such class SHALL be left out, because no player can open it. A short data sentence SHALL show the published minimum picks, the bonus chance, the maximum when it lowers the total, and the world share when present, with the world share described as the chance that an item is world loot for the character's class and level. The band's published armor and stat filters SHALL remain visible. The page SHALL NOT enumerate a world pool at a fixed player level. A placed When used rule SHALL link to the Loot Mechanics guide's pack roll, world eligibility, and lifecycle steps instead of repeating those mechanics as item-page prose.

#### Scenario: A supply pack belongs to different classes
- **WHEN** class and level requirements select distinct tables
- **THEN** the page lists each class/level band with only the entries of its selected table
- **AND** it does not suggest that the pack grants every table at once

#### Scenario: A band names an unplayable class
- **WHEN** a band's class condition names a class that no race offers, alone or beside a playable class
- **THEN** the band names only the playable class, and a band with no playable class is not shown
