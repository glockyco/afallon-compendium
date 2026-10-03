## MODIFIED Requirements

### Requirement: Creature variants retain record identity

Each grouped NPC document SHALL retain each member's key, anchor, label, optional level, optional differing portrait, and differing record facts. Shared facts SHALL appear once. A versions table SHALL appear when `variantFields` is nonempty or a drop row has version attribution. Otherwise, the rows of the Where to find table SHALL hold the version anchors, and the table SHALL NOT show a Version column. A version without a known location SHALL retain an anchor in the unplaced list.

#### Scenario: Records differ only in their locations
- **WHEN** all members share record facts and drops but appear in different places
- **THEN** the page shows no versions table
- **AND** the Where to find rows hold the anchors of the members
- **AND** the Where to find table has no Version column

#### Scenario: Record facts differ
- **WHEN** two records differ in health or ability phases
- **THEN** the page shows a versions table with the differing facts

#### Scenario: Stats in another order
- **WHEN** two records list the same stats in a different order, and one record adds a stat of zero
- **THEN** the page shows no versions table for their stats

#### Scenario: Drops are attributed between variants with drops
- **WHEN** two variants have different drop rows and both have at least one drop
- **THEN** a drop row exclusive to one version names that version
- **AND** the page shows a versions table

#### Scenario: Only one variant has drops
- **WHEN** one variant has drops and every other variant has no drop rows or differing record facts
- **THEN** the drop rows have no version attribution
- **AND** the page anchors versions in Where to find instead of showing a versions table

### Requirement: Separate entities use readable qualifiers

Same-name items SHALL use differing rarity, gear type, damage, level requirement, or stats when possible. Same-name places SHALL use type, parent, closed level range, or entrance area with an ordinal. A level qualifier SHALL read "Level" and the level or range, such as "Level 20–30". Creature version labels SHALL use place, area, level, or type other than MOB when possible. An ordinal SHALL be the fallback. A version without a readable label SHALL be labeled "Version N", where N is the position of the version on its page. A page without a readable qualifier SHALL add its position among the pages of the same name. When two qualified names of one kind still match, each SHALL add its position among them. A record without a name SHALL be named "Unnamed" with its kind, and SHALL NOT share a page with another record. Names, qualifiers, and labels SHALL NOT display a native ID, level zero, or an internal scene object name.

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
- **THEN** their labels are "Version 2" and "Version 3"

#### Scenario: Records without a name
- **WHEN** two NPC records have no name
- **THEN** they have separate pages named "Unnamed NPC (1)" and "Unnamed NPC (2)"
