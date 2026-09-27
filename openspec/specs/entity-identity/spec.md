# entity-identity Specification

## Purpose

Define how game records become published entities: which records share a page, how variants and ability versions keep their own references, and how names, slugs, and qualifiers read.

## Requirements

### Requirement: NPC and ability names identify pages

The publication SHALL group NPC and ability records by a normalized name. Normalization SHALL apply NFKC, lowercase letters, fold curly apostrophes into straight apostrophes, and collapse whitespace. The page key SHALL be its member with the lowest native ID. The title SHALL use the most frequent formatted spelling. Ties SHALL use the spelling of the lowest-native-ID member.

#### Scenario: Records with different casing
- **WHEN** NPC records have the names “Lysander blazeborn” and “Lysander Blazeborn”
- **THEN** they share one page and retain separate record keys

#### Scenario: Equal spelling frequencies
- **WHEN** two members of one normalized group have different formatted spellings with equal frequencies
- **THEN** the title uses the formatted spelling of the lowest-native-ID member

### Requirement: Published names use readable casing

The publication SHALL format entity names, map labels, region names, area labels, object and container labels, and quest chain names. The formatter SHALL capitalize the first lowercase letter of each word without lowercasing other letters. Already lowercase short words such as “of”, “the”, and “into” SHALL stay lowercase inside a name. Unresolved reference labels SHALL retain their available source text. Native enum qualifiers SHALL use readable enum labels.

#### Scenario: Mixed spelling and a short word
- **WHEN** a source names an entity “march into the Web”
- **THEN** its formatted name is “March into the Web”

#### Scenario: Existing uppercase letters
- **WHEN** a source names an entity “DEV RING”
- **THEN** its formatted name stays “DEV RING”

### Requirement: Creature variants retain record identity

Each grouped NPC document SHALL retain each member's key, anchor, label, optional level, optional differing portrait, and differing record facts. Shared facts SHALL appear once. A variants table SHALL appear when `variantFields` is nonempty or a drop row has variant attribution. Otherwise, the rows of the Where to find table SHALL hold the variant anchors, and the table SHALL NOT show a Variant column. A variant without a published location SHALL retain an anchor in the unplaced list.

#### Scenario: Records differ only in their locations
- **WHEN** all members share record facts and drops but appear in different places
- **THEN** the page shows no variants table
- **AND** the Where to find rows hold the anchors of the members
- **AND** the Where to find table has no Variant column

#### Scenario: Record facts differ
- **WHEN** two records differ in health or ability phases
- **THEN** the page shows a variants table with the differing facts

#### Scenario: Stats in another order
- **WHEN** two records list the same stats in a different order, and one record adds a stat of zero
- **THEN** the page shows no variants table for their stats

#### Scenario: Drops are attributed between variants with drops
- **WHEN** two variants have different drop rows and both have at least one drop
- **THEN** a drop row exclusive to one variant names that variant
- **AND** the page shows a variants table

#### Scenario: Only one variant has drops
- **WHEN** one variant has drops and every other variant has no drop rows or differing record facts
- **THEN** the drop rows have no variant attribution
- **AND** the page anchors variants in Where to find instead of showing a variants table

### Requirement: Record references resolve to the right section

A reference to one NPC member SHALL link to its page and variant anchor. It SHALL append a variant label to its name only when `variantFields` is nonempty. A merged reference to several variants of the same page SHALL link to the page without a variant anchor.

#### Scenario: Two records with different facts
- **WHEN** an objective targets one Cragborn Alpha record among records with different health
- **THEN** its reference links to that record's anchor and names the variant

#### Scenario: Several records of one page
- **WHEN** one relation names two members of the same creature page
- **THEN** its merged reference links to the page without a variant anchor

### Requirement: Ability versions group identical rank texts

An ability page SHALL group records with identical rank indexes and rank texts into one version. Each version SHALL provide its ranks, creatures that use it, items that teach it, and an icon when it differs from the page icon. A record reference SHALL link to its version anchor when the page has multiple versions.

#### Scenario: Three ability records with two sets of texts
- **WHEN** two Cleave records share their rank texts and a third has different rank texts
- **THEN** the page shows two versions
- **AND** each version lists the users and teaching items of its member records

### Requirement: Slugs follow formatted display names

A page slug SHALL derive from its formatted name and qualifier. A native-ID suffix SHALL resolve a slug collision. Earlier publication slugs SHALL NOT be retained and redirects SHALL NOT be published.

#### Scenario: Records share one page
- **WHEN** Fenric Doryn records form one page
- **THEN** the page slug is `fenric-doryn`
- **AND** the old per-record page slug is not published

### Requirement: Separate entities use readable qualifiers

Same-name items SHALL use differing rarity, gear type, damage, level requirement, or stats when possible. Same-name places SHALL use type, parent, closed level range, or entrance area with an ordinal. Creature variant labels SHALL use place, area, level, or type other than MOB when possible. An ordinal SHALL be the fallback. A variant without a readable label SHALL be labeled "Variant N", where N is the position of the variant on its page. A page without a readable qualifier SHALL add its position among the pages of the same name. When two qualified names of one kind still match, each SHALL add its position among them. A record without a name SHALL be named "Unnamed" with its kind, and SHALL NOT share a page with another record. Names, qualifiers, and labels SHALL NOT display a native ID, level zero, or an internal scene object name.

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
- **AND** the second is named "Glacier Cave (lvl. 20–30)"

#### Scenario: Variant without a readable label
- **WHEN** the second and third variants of a page share place, area, level, and type
- **THEN** their labels are "Variant 2" and "Variant 3"

#### Scenario: Records without a name
- **WHEN** two NPC records have no name
- **THEN** they have separate pages named "Unnamed NPC (1)" and "Unnamed NPC (2)"
