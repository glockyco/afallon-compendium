## Purpose

Give effects, stats, factions, and enchantments linked homes that show recorded facts without duplicating their related item and NPC lists.

## ADDED Requirements

### Requirement: Glossary pages retain every reachable reference record

The publication SHALL provide one glossary page at each of `/effects/`, `/stats/`, and `/factions/`. Each page SHALL have one row for every reachable catalog record of its kind, including records without incoming references. Each row SHALL retain its entity key in the public document. Its anchor SHALL derive from its formatted name. A native-ID suffix SHALL resolve an anchor collision, as for page slugs. The ID SHALL NOT appear in reader text. The pages SHALL appear in the Reference navigation group and SHALL NOT publish record-specific pages, old slugs, or redirects.

#### Scenario: Stat without a source
- **WHEN** a reachable stat has no recorded source
- **THEN** the Stats glossary retains its row and entity key
- **AND** the row labels the missing source evidence without inventing a value

#### Scenario: Intellect anchor
- **WHEN** the published stat is Intellect and its formatted name has no anchor collision
- **THEN** its row is at `/stats/#intellect`

### Requirement: Glossary references reach rows and show their content

A reference to an effect, stat, or faction SHALL link to its row anchor. Each such record SHALL have a search entry that targets the same anchor and retains its entity key. The hover tooltip of the link SHALL show the row content. Keyboard focus and touch SHALL expose the same information. An unresolved target SHALL retain a readable label without a broken link.

#### Scenario: Potion Sickness in a requirement
- **WHEN** a published requirement checks Potion Sickness
- **THEN** its reference opens the Potion Sickness row at `/effects/#potion-sickness`
- **AND** its tooltip shows that row's content without calling the requirement an application

#### Scenario: Unresolved target
- **WHEN** a relation names a record without a published home
- **THEN** the target name remains readable without a broken link or native ID

### Requirement: Effect rows separate behavior, applications, and checks

An effect row SHALL show its recorded type, state, duration, stack limit, and removal rules. It SHALL show rank behavior when recorded. It SHALL distinguish verified applications from abilities, items, effects, and stats from requirements that check the effect. An NPC or world interaction SHALL appear as an application only when a verified typed path supports it. A check SHALL NOT become an application merely because it names the effect. An absent source SHALL be labeled as not recorded, not as impossible.

#### Scenario: Potion Sickness is checked but not applied
- **WHEN** a condition checks Potion Sickness and has no application action
- **THEN** its owner appears among the row's checks
- **AND** the owner does not appear among the row's applications for that condition

#### Scenario: Effect with no known source
- **WHEN** a reachable effect has no recorded application source
- **THEN** its glossary row remains available and labels applications as not recorded

### Requirement: Stat rows show verified rules and useful paths

A stat row SHALL show its authored meaning where evidence exists. It SHALL show verified minimum and maximum checks, percentage and vitality rules, and regeneration amounts and intervals when recorded. It SHALL link the classes and skills whose recorded stats name it. It SHALL offer “Items with <stat>” as a link to the item list with that stat filter selected. The item list SHALL distinguish fixed amounts, random ranges, and percentages. The row SHALL NOT infer an unverified formula or embed every item that names the stat.

#### Scenario: Intellect item path
- **WHEN** a reader selects “Items with Intellect” from the Intellect row
- **THEN** the item list opens with the Intellect stat filter selected in its URL
- **AND** the filtered rows retain their recorded amounts or ranges and units

#### Scenario: Meaning without evidence
- **WHEN** a stat has no authored description or verified rule
- **THEN** its row makes no claim about what the stat does
- **AND** its recorded class, skill, or item paths remain available

### Requirement: Faction rows show relations and members

A faction row SHALL show recorded stances with their required points and alignment in authored order. It SHALL show default relations and starting points, its member count, and a link to the NPC list with that faction selected. The NPC list SHALL expose a Faction facet. A faction SHALL remain published when the game hides it in the reputation window. Unverified reputation rewards or unlocks SHALL NOT appear as facts. Missing reward evidence SHALL NOT be described as zero reputation.

#### Scenario: Humans member list
- **WHEN** a reader follows the members link from the Humans row
- **THEN** the NPC list opens with Humans selected in its Faction facet
- **AND** the row shows the recorded member count

#### Scenario: Hidden faction without rewards
- **WHEN** a faction is hidden in the reputation window and has no recorded reputation reward
- **THEN** its row remains in the Factions glossary and in search
- **AND** it labels reward evidence as not recorded rather than claiming zero rewards

### Requirement: Enchantments live with their items

Each published item linked to an enchantment SHALL have an Enchants section at `#enchants`. The Enchants section SHALL be the first full-width section, before the fixed section order of the item page. When the item also teaches a recipe, Teaches SHALL come first and Enchants second. The section SHALL retain the enchantment entity key in the item document. For each recorded tier, it SHALL show stat results, eligible item types and rarities, armor types and slots, weapon types and slots, currency and item costs, success rate, enchanting time, skill, and skill experience when available. An enchantment reference and its search entry SHALL link to that section. Its tooltip SHALL show the section's enchantment facts. Absent costs SHALL read “No cost recorded,” never “Free.” Eligible specific items SHALL appear only after verification of the game's eligibility rule.

#### Scenario: Enchant Vigor item
- **WHEN** an enchantment reference names Enchant Vigor
- **THEN** it links to the Enchants section of the Enchant Vigor item
- **AND** the section retains the enchantment key and shows its recorded tier result and eligibility

#### Scenario: No recorded cost
- **WHEN** an enchantment tier has no captured item or currency cost
- **THEN** its item section says “No cost recorded”
- **AND** it does not claim that enchanting is free

### Requirement: Enchantment list preserves item and orphan paths

The publication SHALL provide `/enchantments/` as a list of enchanting items in the Reference group. Each row with a published item SHALL retain its enchantment key and link to that item's Enchants section. An enchantment without a published item SHALL retain its key in an anchored list row. It SHALL have a coverage gap, and its search entry and tooltip SHALL target that row. The row SHALL show supported facts without inventing an item link. No enchantment SHALL receive a separate record page.

#### Scenario: Enchant Vigor in the list
- **WHEN** the Enchant Vigor item is published
- **THEN** its enchantment list row links to that item's Enchants section
- **AND** the row and search entry retain the enchantment key

#### Scenario: Enchantment item is absent
- **WHEN** a reachable enchantment has no published item
- **THEN** its anchored list row retains the key and reports a coverage gap
- **AND** its search entry opens that row rather than a missing item section

### Requirement: Reference text preserves reader language

Glossary and enchantment list headings SHALL use sentence case. Names and category values SHALL use title case. Reader text SHALL NOT show native record IDs, internal enum words, unsupported game numbers, or inferred mechanics. A record with absent evidence SHALL keep its row and label the gap.

#### Scenario: Combat alignment label
- **WHEN** the Factions glossary shows Hostile Elementals
- **THEN** it uses the formatted name and readable category values without internal IDs
