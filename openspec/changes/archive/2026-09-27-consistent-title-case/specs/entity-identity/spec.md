## MODIFIED Requirements

### Requirement: Published names use readable casing

The publication SHALL format entity names, map labels, region names, area labels, object and container labels, and quest chain names. The formatter SHALL start each word with a capital letter. A word that the source writes in capitals only SHALL read as a word, except a roman numeral. The abbreviations NPC, AoE, and CC SHALL take these spellings in any source spelling. Other capitals inside a word SHALL stay. Already lowercase short words such as "of", "the", and "into" SHALL stay lowercase inside a name. Typographic apostrophes SHALL become straight apostrophes. Unresolved reference labels SHALL retain their available source text. Native enum qualifiers SHALL use title-case category labels.

#### Scenario: Mixed spelling and a short word
- **WHEN** a source names an entity "march into the Web"
- **THEN** its formatted name is "March into the Web"

#### Scenario: Existing uppercase letters
- **WHEN** a source names an entity "DEV RING" and another "Bolstering Kit II"
- **THEN** their formatted names are "Dev Ring" and "Bolstering Kit II"

#### Scenario: Abbreviations and apostrophes
- **WHEN** sources name entities "Gold npc", "Aoe blood ground", and "Ward’s Observatory"
- **THEN** their formatted names are "Gold NPC", "AoE Blood Ground", and "Ward's Observatory"

### Requirement: Separate entities use readable qualifiers

Same-name items SHALL use differing rarity, gear type, damage, level requirement, or stats when possible. Same-name places SHALL use type, parent, closed level range, or entrance area with an ordinal. A level qualifier SHALL read "Level" and the level or range, such as "Level 20–30". Creature variant labels SHALL use place, area, level, or type other than MOB when possible. An ordinal SHALL be the fallback. A variant without a readable label SHALL be labeled "Variant N", where N is the position of the variant on its page. A page without a readable qualifier SHALL add its position among the pages of the same name. When two qualified names of one kind still match, each SHALL add its position among them. A record without a name SHALL be named "Unnamed" with its kind, and SHALL NOT share a page with another record. Names, qualifiers, and labels SHALL NOT display a native ID, level zero, or an internal scene object name.

#### Scenario: Two different chest items
- **WHEN** two Peasant Chest items differ in armor type
- **THEN** their qualifiers distinguish cloth from leather without native IDs

#### Scenario: Two entrances from one area
- **WHEN** places of the same name need the same entrance area to distinguish them
- **THEN** their qualifiers include distinct ordinals

#### Scenario: Place level is not a closed range
- **WHEN** a place has no closed positive level range
- **THEN** its qualifier does not use that level

#### Scenario: Place without a readable qualifier
- **WHEN** two places are named Glacier Cave, only the second has a level range, and no other fact tells them apart
- **THEN** the first is named "Glacier Cave (1)"
- **AND** the second is named "Glacier Cave (Level 20–30)"

#### Scenario: Variant without a readable label
- **WHEN** the second and third variants of a page share place, area, level, and type
- **THEN** their labels are "Variant 2" and "Variant 3"

#### Scenario: Records without a name
- **WHEN** two NPC records have no name
- **THEN** they have separate pages named "Unnamed NPC (1)" and "Unnamed NPC (2)"
