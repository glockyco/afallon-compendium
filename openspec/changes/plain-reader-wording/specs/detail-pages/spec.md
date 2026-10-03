## MODIFIED Requirements

### Requirement: Reader text shows no record ids or internal words

Page text, table cells, labels, descriptions, hints, accessibility text, empty states, and generated publication text SHALL NOT show a native record id or an internal enum word, such as "Mob". Reader-facing text SHALL describe known facts and unknown gaps without pipeline terms such as published, publication, authored, recorded, captured, configured, source row, outcomes, loot weight, or a hedging setting or record. Creature distinctions SHALL read as versions instead of variants. The NPC type MOB SHALL NOT appear, because it marks an ordinary NPC. The NPC types BOSS, MERCHANT, and BANK SHALL NOT appear, because the roles already name them. A connection SHALL NOT show the internal kind of its teleport. Category values SHALL read in title case on pages, in tooltips, in list cells and filters, and on the map: item types and slots, gear types, rarities, roles and map categories, quest start types, NPC and creature types, place types, and kind labels. A short word inside a category value, such as "of", SHALL stay lowercase. Sentences SHALL use sentence case, with no semicolons or em dashes in rewritten text.

#### Scenario: Variants without readable labels
- **WHEN** three variants of an NPC differ in stats but not in place, area, level, or type
- **THEN** the Versions table labels them "Version 1", "Version 2", and "Version 3"

#### Scenario: Ordinary creature
- **WHEN** an NPC has the type MOB
- **THEN** its page shows no type word

#### Scenario: Enum word and authored value in one filter
- **WHEN** the item types include the enum word QUEST_ITEM and the authored value "Fishing rod"
- **THEN** the Type filter lists "Quest Item" and "Fishing Rod"

#### Scenario: Reader sees an unknown fact
- **WHEN** a page lacks a known location, level, or chance
- **THEN** it explains that the fact is unknown rather than claiming the game has no location, level, or chance

#### Scenario: Reader text never uses internal pipeline words
- **WHEN** a reader explores a page, search result, tooltip, chart description, empty state, or generated document
- **THEN** site-authored text describes game facts or their unknown status without internal pipeline words
- **AND** genuine game names and quoted game-provided text remain faithful to the game
