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

The publication SHALL format entity names, map labels, region names, area labels, object and container labels, and quest chain names.

#### Scenario: Mixed spelling and a short word
- **WHEN** a source names an entity "march into the Web"
- **THEN** its formatted name is "March into the Web"

#### Scenario: Existing uppercase letters
- **WHEN** a source names an entity "DEV RING" and another "Bolstering Kit II"
- **THEN** their formatted names are "Dev Ring" and "Bolstering Kit II"

#### Scenario: Abbreviations and apostrophes
- **WHEN** sources name entities "Gold npc", "Aoe blood ground", and "Ward’s Observatory"
- **THEN** their formatted names are "Gold NPC", "AoE Blood Ground", and "Ward's Observatory"

#### Scenario: Published names use readable casing
- **WHEN** The publication includes entity names, map labels, region names, area labels, object and container labels, and quest chain names.
- **THEN** All of those names and labels receive name formatting.

### Requirement: Words begin with capitals

The formatter SHALL start each word with a capital letter, except already lowercase short words inside a name.

#### Scenario: Words begin with capitals
- **WHEN** A source name is "silver forest".
- **THEN** The formatted name is "Silver Forest".

### Requirement: All-capital words become readable words

A word that the source writes in capitals only SHALL read as a word, except a roman numeral.

#### Scenario: All-capital words become readable words
- **WHEN** A source name is "IRON GUARD III".
- **THEN** The formatted name is "Iron Guard III".

### Requirement: Abbreviations use canonical spellings

The abbreviations NPC, AoE, and CC SHALL take these spellings in any source spelling.

#### Scenario: Abbreviations use canonical spellings
- **WHEN** Source labels contain "npc", "AOE", and "cc".
- **THEN** The abbreviations are rendered as "NPC", "AoE", and "CC".

### Requirement: Internal capitals remain unchanged

Other capitals inside a word SHALL stay.

#### Scenario: Internal capitals remain unchanged
- **WHEN** A source name contains the word "SunBlade".
- **THEN** The formatted word remains "SunBlade".

### Requirement: Lowercase interior short words remain lowercase

Already lowercase short words such as "of", "the", and "into" SHALL stay lowercase inside a name.

#### Scenario: Lowercase interior short words remain lowercase
- **WHEN** A source name is "hall of the king".
- **THEN** The formatted name is "Hall of the King".

### Requirement: Apostrophes use straight characters

Typographic apostrophes SHALL become straight apostrophes.

#### Scenario: Apostrophes use straight characters
- **WHEN** A source name contains a typographic apostrophe between "Ward" and "s".
- **THEN** The formatted name uses "Ward's" with a straight apostrophe.

### Requirement: Unresolved labels retain source text

Unresolved reference labels SHALL retain their available source text.

#### Scenario: Unresolved labels retain source text
- **WHEN** A reference cannot be resolved but has available source text "Lost Shrine".
- **THEN** Its label retains "Lost Shrine".

### Requirement: Enum qualifiers use title-case categories

Native enum qualifiers SHALL use title-case category labels.

#### Scenario: Enum qualifiers use title-case categories
- **WHEN** A native enum qualifier has the category label "HEAVY ARMOR".
- **THEN** The qualifier uses the category label "Heavy Armor".

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

Same-name items SHALL use differing rarity, gear type, damage, level requirement, or stats when possible.

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

#### Scenario: Separate entities use readable qualifiers
- **WHEN** Two same-name items differ in rarity but otherwise have identical qualifying facts.
- **THEN** Their qualifiers distinguish their rarities.

### Requirement: Same-name places use place facts

Same-name places SHALL use type, parent, closed level range, or entrance area with an ordinal.

#### Scenario: Same-name places use place facts
- **WHEN** Two same-name places are distinguished by different parents.
- **THEN** Their qualifiers use their parents.

### Requirement: Level qualifiers use the Level prefix

A level qualifier SHALL read "Level" and the level or range, such as "Level 20-30".

#### Scenario: Level qualifiers use the Level prefix
- **WHEN** A qualifier uses the closed level range from 20 to 30.
- **THEN** The qualifier reads "Level 20-30".

### Requirement: Creature versions use readable distinguishing facts

Creature version labels SHALL use place, area, level, or type other than MOB when possible.

#### Scenario: Creature versions use readable distinguishing facts
- **WHEN** Two creature versions can be distinguished by place.
- **THEN** Their version labels use their places.

### Requirement: Ordinals provide fallback distinctions

An ordinal SHALL be the fallback.

#### Scenario: Ordinals provide fallback distinctions
- **WHEN** Same-name entities have no readable distinguishing facts.
- **THEN** An ordinal provides the fallback distinction.

### Requirement: Unlabeled versions use page positions

A version without a readable label SHALL be labeled "Version N", where N is the position of the version on its page.

#### Scenario: Unlabeled versions use page positions
- **WHEN** The fourth version on a page has no readable label.
- **THEN** Its label is "Version 4".

### Requirement: Unqualified pages use same-name positions

A page without a readable qualifier SHALL add its position among the pages of the same name.

#### Scenario: Unqualified pages use same-name positions
- **WHEN** The first of two same-name pages has no readable qualifier.
- **THEN** The first page adds its position among those pages.

### Requirement: Matching qualified names add positions

When two qualified names of one kind still match, each SHALL add its position among them.

#### Scenario: Matching qualified names add positions
- **WHEN** Two item names still match after qualification.
- **THEN** Each qualified item name adds its position among the matching names.

### Requirement: Nameless records receive kind-based names

A record without a name SHALL be named "Unnamed" with its kind.

#### Scenario: Nameless records receive kind-based names
- **WHEN** An NPC record has no name.
- **THEN** Its name includes "Unnamed NPC".

### Requirement: Nameless records have separate pages

A record without a name SHALL NOT share a page with another record.

#### Scenario: Nameless records have separate pages
- **WHEN** Two NPC records have no name.
- **THEN** The two records have separate pages.

### Requirement: Display labels exclude internal identifiers

Names, qualifiers, and labels SHALL NOT display a native ID, level zero, or an internal scene object name.

#### Scenario: Display labels exclude internal identifiers
- **WHEN** A record has a native ID, level zero, and an internal scene object name.
- **THEN** None of those values appears in its names, qualifiers, or labels.
### Requirement: Talent references resolve to their class page row

A reference to a talent of a published class SHALL link to the class page and to the anchor of the talent's row. A reference on a class page SHALL resolve to a row of the same class. The tooltip of a talent reference SHALL show the talent tree, the tier, and the effect of the talent at its first rank and at its last rank. A reference to a talent of a class without a page SHALL show the talent name without a link.

#### Scenario: Requirement between two talents
- **WHEN** the Aegis Discipline row on the Shieldmaster page requires rank 4 of Weighted Strikes
- **THEN** the requirement links to the Weighted Strikes row on the Shieldmaster page

#### Scenario: Talent of a class without a page
- **WHEN** a reference names a talent of a class that no race offers
- **THEN** the reference shows the talent name without a link

### Requirement: Reviewed exclusions keep internal records unpublished

The publication SHALL NOT publish a record that the reviewed exclusion list names.

#### Scenario: Test item
- **WHEN** the exclusion list names Scythe Test
- **THEN** no page, list row, search entry, or count includes Scythe Test
- **AND** the catalog still retains its record

#### Scenario: Requirement names an excluded recipe
- **WHEN** a world condition requires the excluded recipe Oakenvale tavern level 2
- **THEN** the requirement shows the recipe name without a link

#### Scenario: Name shared only with excluded records
- **WHEN** a published place shares its name only with excluded scene records
- **THEN** the name of the published place has no qualifier

#### Scenario: Evidence no longer holds
- **WHEN** an excluded item has a source in a new catalog
- **THEN** the publication fails and names the exclusion entry

#### Scenario: Entry names an unknown key
- **WHEN** an exclusion entry names a key that the catalog lacks
- **THEN** the publication fails and names the entry

#### Scenario: Reviewed exclusions keep internal records unpublished
- **WHEN** The reviewed exclusion list names a catalog record.
- **THEN** The publication does not publish that record.

### Requirement: Excluded records have no publication surfaces

An excluded record SHALL have no page, list row, or search entry, and SHALL NOT count toward a published count.

#### Scenario: Excluded records have no publication surfaces
- **WHEN** An excluded record would otherwise appear on a page, in a list, in search, and in a count.
- **THEN** It has no page, list row, or search entry and contributes nothing to the published count.

### Requirement: Relations omit excluded counterparts

A relation row whose counterpart is an excluded record SHALL NOT appear.

#### Scenario: Relations omit excluded counterparts
- **WHEN** A published record has a relation whose counterpart is excluded.
- **THEN** The relation row does not appear.

### Requirement: Requirements render excluded names without links

A requirement that names an excluded record SHALL show the formatted record name as text without a reference, so no document holds a link to it.

#### Scenario: Requirements render excluded names without links
- **WHEN** A requirement names an excluded record.
- **THEN** The requirement shows the formatted record name as text without a reference, and no document links to the excluded record.

### Requirement: Excluded records do not affect qualification

Excluded records SHALL NOT take part in name qualification.

#### Scenario: Excluded records do not affect qualification
- **WHEN** A published record shares its name only with excluded records.
- **THEN** Those excluded records do not cause a qualifier to be added.

### Requirement: Exclusions identify keys and justification

Each exclusion SHALL name a catalog key, a reason, and its evidence.

#### Scenario: Exclusions identify keys and justification
- **WHEN** An exclusion is recorded for a catalog record.
- **THEN** The exclusion names the record's catalog key, a reason, and supporting evidence.

### Requirement: Unknown exclusion keys fail publication

The publication SHALL fail when an entry names a key that the catalog lacks.

#### Scenario: Unknown exclusion keys fail publication
- **WHEN** An exclusion entry names a key absent from the catalog.
- **THEN** Publication fails.

### Requirement: Invalid exclusion evidence fails publication

The publication SHALL fail when the recorded evidence no longer holds in the catalog.

#### Scenario: Invalid exclusion evidence fails publication
- **WHEN** The catalog no longer supports the evidence recorded for an exclusion.
- **THEN** Publication fails.
### Requirement: Recipe references resolve to the Crafting section of their product

Recipes SHALL have no detail pages.

#### Scenario: Recipe of a crafted item
- **WHEN** the Used in recipes row of Bolt of Runeweave names Runeweave Regalia
- **THEN** the row links to `/items/runeweave-regalia/#crafting` and its preview shows a compact equation

#### Scenario: Recipe name differs from the product
- **WHEN** a reader searches for Ring of Bleed Damage
- **THEN** search offers Bloodthrall Signet and its Crafting section names the recipe

#### Scenario: Recipe without a product
- **WHEN** a reference names Demonic Bulwark Looted without a published product
- **THEN** it links to its anchored row on the Smithing page

#### Scenario: Recipe references resolve to the Crafting section of their product
- **WHEN** A recipe is published through its product's crafting information.
- **THEN** The recipe has no detail page of its own.

### Requirement: Recipe references link to published products

A recipe reference with a published product SHALL link to its item's `crafting` anchor.

#### Scenario: Recipe references link to published products
- **WHEN** A recipe reference has a published product item.
- **THEN** The reference links to the product item's `crafting` anchor.

### Requirement: Productless recipe references link to skill rows

A recipe reference without a product SHALL link to the anchored recipe row on its skill page when that page exists.

#### Scenario: Productless recipe references link to skill rows
- **WHEN** A recipe has no published product but has an anchored recipe row on a published skill page.
- **THEN** The recipe reference links to that anchored skill-page row.

### Requirement: Recipe hover cards remain compact

A recipe reference's hover card SHALL preview the recipe as a compact equation and at most one line of context, without a full crafting block, experience-band table, product tooltip duplication, or rule prose.

#### Scenario: Recipe hover cards remain compact
- **WHEN** A reader hovers over a recipe reference.
- **THEN** The hover card shows a compact equation and at most one context line, with no full crafting block, experience-band table, duplicated product tooltip, or rule prose.

### Requirement: Complete crafting facts remain on owning pages

The complete crafting facts SHALL remain on the product or skill page.

#### Scenario: Complete crafting facts remain on owning pages
- **WHEN** A recipe is presented on its product page.
- **THEN** The product page retains the complete crafting facts.

### Requirement: Product documents retain recipe keys

The product document SHALL retain the recipe key.

#### Scenario: Product documents retain recipe keys
- **WHEN** A product document includes crafting information for a recipe.
- **THEN** The product document retains that recipe's key.

### Requirement: Craft search supports product and recipe names

Search SHALL find crafts by product name and, when different, by recipe name.

#### Scenario: Craft search supports product and recipe names
- **WHEN** A craft's recipe name differs from its product name.
- **THEN** Searching by either name finds the craft.

### Requirement: Recipes without target pages remain unlinked

A recipe whose product and skill have no page SHALL show its name without a broken link.

#### Scenario: Recipes without target pages remain unlinked
- **WHEN** Neither a recipe's product nor its skill has a page.
- **THEN** The recipe reference shows its name without a broken link.
### Requirement: Relation labels and ranges remain intelligible

A relation row or preview SHALL use a reader-facing identity supported by its source and context, rather than display an internal record label as if it were a character or place name.

#### Scenario: For-sale object in an item source
- **WHEN** an authored object named `For Sale 2500 Gold` appears among an item's source objects
- **THEN** the reader sees a contextual, truthful object label and place rather than a misleading unqualified sale price
- **AND** an unresolved source identity is recorded instead of invented

#### Scenario: Internal ability name
- **WHEN** an NPC references the authored ability `SkeletonAttack1 NPC`
- **THEN** the reader sees a verified readable ability label or an explicit unresolved identity, not an unexamined internal name

#### Scenario: Inverted gold range
- **WHEN** Barrowdeep Deathguard's gold bounds are authored as minimum 15 and maximum 3
- **THEN** the reader does not see `15–3`, a silently swapped `3–15`, or an invented payout
- **AND** the source discrepancy is documented until verified correction is available

#### Scenario: Relation labels and ranges remain intelligible
- **WHEN** A place preview has a verified reader-facing name and an internal record label.
- **THEN** The preview uses the verified reader-facing name, not the internal record label.

### Requirement: Undisambiguated authored labels disclose their limitation

If the authored label cannot be disambiguated without invention, the publication SHALL identify that limitation in its coverage or update report and present a truthful contextual label.

#### Scenario: Undisambiguated authored labels disclose their limitation
- **WHEN** A relation's authored label cannot be disambiguated without inventing an identity.
- **THEN** The publication presents a truthful contextual label and identifies the limitation in its coverage or update report.

### Requirement: Numeric ranges have ordered bounds

A numeric range SHALL have an ordered lower and upper bound.

#### Scenario: Numeric ranges have ordered bounds
- **WHEN** A verified numeric range has a lower bound of 4 and an upper bound of 9.
- **THEN** The displayed range has 4 as its lower bound and 9 as its upper bound.

### Requirement: Conflicting bounds require source investigation

Conflicting authored bounds SHALL be investigated at their source and either corrected with evidence or marked unavailable and reported.

#### Scenario: Conflicting bounds require source investigation
- **WHEN** Conflicting authored bounds are investigated at their source but no correction can be supported by evidence.
- **THEN** The range is marked unavailable and the conflict is reported.

### Requirement: Invalid ranges are not silently repaired

The site SHALL NOT silently reverse the bounds or show an impossible range.

#### Scenario: Invalid ranges are not silently repaired
- **WHEN** A source supplies a lower bound of 12 and an upper bound of 5.
- **THEN** The site neither silently reverses the bounds nor displays the impossible range.

### Requirement: Code-named abilities and effects read as words

An ability or effect name word that joins capitalized words, optionally followed by a number, such as BoarAttack1 or HealingPotion, SHALL read as separate words: Boar Attack 1 and Healing Potion. Its slug SHALL follow the spaced name. A word whose capital ends it, such as AoE or DoT, SHALL stay one word. Names of other kinds SHALL keep the spelling that the game shows.

#### Scenario: Code-named creature attack
- **WHEN** an effect is named BoarAttack1
- **THEN** its page and every link to it read Boar Attack 1, and its slug is boar-attack-1

#### Scenario: Abbreviation in a name
- **WHEN** an ability is named AoE Cursed
- **THEN** it keeps the name AoE Cursed

#### Scenario: Item name
- **WHEN** an item is named Large FirePlace
- **THEN** it keeps the name Large FirePlace
