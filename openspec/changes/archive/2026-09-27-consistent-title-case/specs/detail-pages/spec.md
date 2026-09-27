## MODIFIED Requirements

### Requirement: Reader text shows no record ids or internal words

Page text, table cells, and labels SHALL NOT show a native record id or an internal enum word, such as "Mob". The NPC type MOB SHALL NOT appear, because it marks an ordinary NPC. The NPC types BOSS, MERCHANT, and BANK SHALL NOT appear, because the roles already name them. A connection SHALL NOT show the authored kind of its teleport. Category values SHALL read in title case on pages, in tooltips, in list cells and filters, and on the map: item types and slots, gear types, rarities, roles and map categories, quest start types, NPC and creature types, place types, and kind labels. A short word inside a category value, such as "of", SHALL stay lowercase.

#### Scenario: Variants without readable labels
- **WHEN** three variants of an NPC differ in stats but not in place, area, level, or type
- **THEN** the Variants table labels them "Variant 1", "Variant 2", and "Variant 3"

#### Scenario: Ordinary creature
- **WHEN** an NPC has the type MOB
- **THEN** its page shows no type word

#### Scenario: Enum word and authored value in one filter
- **WHEN** the item types include the enum word QUEST_ITEM and the authored value "Fishing rod"
- **THEN** the Type filter lists "Quest Item" and "Fishing Rod"
