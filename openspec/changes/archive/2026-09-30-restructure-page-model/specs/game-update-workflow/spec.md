## MODIFIED Requirements

### Requirement: Publication parity preserves published entities

The parity gate SHALL compare entity keys from search entries, page documents, NPC variants, ability version member keys, embedded item gear sets, recipe keys embedded in item Crafting sections, and recipe keys of skill recipe rows. It SHALL NOT require a baseline URL to remain. It SHALL require a list only for a kind that still has a list. It SHALL read a baseline by its field shape without requiring today's schemas. It SHALL accept a missing baseline key only when the reviewed exclusion list of the candidate names that key.

#### Scenario: Four records become one character page
- **WHEN** four baseline NPC pages become one candidate page with all four record keys in its variants
- **THEN** the entity-coverage parity check accepts the grouped records

#### Scenario: Gear set moves onto item pages
- **WHEN** a baseline has a gear set page and the candidate embeds the set in member items
- **THEN** the set key remains covered without a gear set page or list

#### Scenario: Recipe pages move onto item pages
- **WHEN** a baseline has recipe pages and the candidate embeds each recipe key in the Crafting section of its product or in a skill recipe row
- **THEN** each recipe key remains covered without a recipe page

#### Scenario: A member record disappears
- **WHEN** a baseline record key occurs in none of the candidate's search, page, variant, version, embedded set, or embedded recipe keys
- **THEN** the parity gate reports the missing key

#### Scenario: A listed record leaves the publication
- **WHEN** a baseline record key is missing from the candidate and the exclusion list of the candidate names that key
- **THEN** the parity gate accepts the removal
