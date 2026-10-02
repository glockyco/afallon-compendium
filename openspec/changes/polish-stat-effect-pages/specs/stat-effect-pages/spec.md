## ADDED Requirements

### Requirement: Stat pages explain and quantify sources

The site SHALL lead with a stat's player-facing function and show its published source families in separate tabs, each with a sortable relation table and bonus amounts or roll ranges. Empty source families SHALL have no tabs. Item sources SHALL distinguish fixed bonuses and possible rolls. Gear sets SHALL show their piece tier, talents their class and rank, and class growth SHALL remain a separate table. The item-list link SHALL match both flat and percentage variants of the stat while ordinary item-list variant filters retain their separate meaning.

#### Scenario: A stat has multiple bonus forms
- **WHEN** a reader visits a stat that appears on fixed items and as a possible item roll
- **THEN** the page distinguishes those ways of obtaining the stat, shows amounts or roll ranges, and its item-list link includes every item with either bonus form

### Requirement: Item power is an equipment rating, not a resource pool

The publication SHALL describe Item Power only with supported item data. Its item-list link SHALL filter to items with a rating and sort by that numeric rating. A stat SHALL be presented as a recoverable resource only when its vitality flag is supported by a positive starting pool and active recovery.

#### Scenario: Item Power has a raw vitality flag but no resource behavior
- **WHEN** a reader opens Item Power
- **THEN** the page identifies the equipment rating, links to the rated items sorted by Item Power, and makes no claim about a current amount or maximum

#### Scenario: Energy is a recoverable resource
- **WHEN** a reader opens Energy
- **THEN** its documented starting value and recovery are available without relying on the raw flag alone


### Requirement: Effect pages prioritize observable outcomes

The site SHALL state an effect's outcome ahead of lifecycle metadata, compare ranks only if their outcomes differ, and show distinct sources as shared relation tables. Summon outcomes SHALL identify the summoned creature and duration in human units without repeating the creature link or exposing internal record numbers. A standalone effect with neither description nor meaningful rank action SHALL be withheld unless a verified requirement expresses a useful observable outcome.

#### Scenario: An impact repeats across ability variants
- **WHEN** multiple variants of the same ability apply the same effect at the same rank and target
- **THEN** the effect page presents one source row without losing different ranks, targets, or chances

### Requirement: Stat browsing distinguishes prevalence and triggers

The stats list SHALL sort by number of distinct sources, most common first, according to its published kind entry, and distinguish on-hit trigger stats from other stats. List names SHALL show their entity identity icons. The Effects browse description SHALL include non-state impacts and summons rather than implying every effect is a buff or debuff.

#### Scenario: Browse stats
- **WHEN** the reader opens the stats list
- **THEN** the most frequent stats appear first with their source counts and an on-hit trigger facet

### Requirement: Contradictory damage text is not endorsed

A page SHALL not present a mismatched generic bonus damage type as a verified interaction and SHALL not claim Electricity Resistance protects against Fire damage.

#### Scenario: Authored description conflicts with stat name
- **WHEN** a stat's description refers to a different damage family
- **THEN** the page identifies the contradiction without endorsing the unverified mechanic
