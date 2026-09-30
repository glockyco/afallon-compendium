## MODIFIED Requirements

### Requirement: Recipe references resolve to the Crafting section of their product

Recipes SHALL have no detail pages. A recipe reference with a published product SHALL link to its item's `crafting` anchor, or to the anchored recipe row on its skill page without a product. Its hover card SHALL preview the recipe as a compact equation and at most one line of context, without a full crafting block, experience-band table, product tooltip duplication, or rule prose. The complete crafting facts SHALL remain on the product or skill page. The product document SHALL retain the recipe key; search SHALL find crafts by product name and, when different, by recipe name. A recipe whose product and skill have no page SHALL show its name without a broken link.

#### Scenario: Recipe of a crafted item
- **WHEN** the Used in recipes row of Bolt of Runeweave names Runeweave Regalia
- **THEN** the row links to `/items/runeweave-regalia/#crafting` and its preview shows a compact equation

#### Scenario: Recipe name differs from the product
- **WHEN** a reader searches for Ring of Bleed Damage
- **THEN** search offers Bloodthrall Signet and its Crafting section names the recipe

#### Scenario: Recipe without a product
- **WHEN** a reference names Demonic Bulwark Looted without a published product
- **THEN** it links to its anchored row on the Smithing page

## ADDED Requirements

### Requirement: Relation labels and ranges remain intelligible

A relation row or preview SHALL use a reader-facing identity supported by its source and context, rather than display an internal record label as if it were a character or place name. If the authored label cannot be disambiguated without invention, the publication SHALL identify that limitation in its coverage or update report and present a truthful contextual label. A numeric range SHALL have an ordered lower and upper bound; conflicting authored bounds SHALL be investigated at their source and either corrected with evidence or marked unavailable and reported. The site SHALL NOT silently reverse the bounds or show an impossible range.

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
