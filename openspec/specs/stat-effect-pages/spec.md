# stat-effect-pages Specification

## Purpose
Lead each stat and effect page with what the stat or effect does, then group its sources, outcomes, and checks in shared relation tables that readers can sort and compare.

## Requirements

### Requirement: Stat pages explain and quantify sources

The site SHALL lead with a stat's player-facing function.

#### Scenario: A stat has multiple bonus forms
- **WHEN** a reader visits a stat that appears on fixed items and as a possible item roll
- **THEN** the page distinguishes those ways of obtaining the stat, shows amounts or roll ranges, and its item-list link includes every item with either bonus form

#### Scenario: A talent with ten ranks
- **WHEN** a talent raises Damage Dealt by 1% at its first rank and 10% at its tenth
- **THEN** the Talents tab shows one row for it with +1%–+10% and 10 ranks

#### Scenario: Stat pages explain and quantify sources
- **WHEN** A reader opens a stat page.
- **THEN** The page leads with the stat's player-facing function.

### Requirement: Published stat source families have sortable tabs

The site SHALL show a stat's published source families in separate tabs, each with a sortable relation table and bonus amounts or roll ranges.

#### Scenario: Published stat source families have sortable tabs
- **WHEN** A stat has published item and gem source families.
- **THEN** The page shows separate item and gem tabs, each with a sortable relation table and bonus amounts or roll ranges.

### Requirement: Empty stat source families have no tabs

Empty source families SHALL have no tabs.

#### Scenario: Empty stat source families have no tabs
- **WHEN** A stat has no published enchantment sources.
- **THEN** The stat page has no enchantment source tab.

### Requirement: Item sources distinguish fixed bonuses and possible rolls

Item sources SHALL distinguish fixed bonuses and possible rolls.

#### Scenario: Item sources distinguish fixed bonuses and possible rolls
- **WHEN** A stat's item sources include a fixed bonus and a possible roll.
- **THEN** The item sources distinguish the fixed bonus from the possible roll.

### Requirement: Gear set sources show piece tiers

Gear sets SHALL show their piece tier.

#### Scenario: Gear set sources show piece tiers
- **WHEN** A stat source is a gear set bonus at a piece tier.
- **THEN** The gear set source shows its piece tier.

### Requirement: Talent sources consolidate rank bonuses

A talent SHALL be one row with its class, its bonus range across its ranks, and how many ranks give the bonus.

#### Scenario: Talent sources consolidate rank bonuses
- **WHEN** A talent gives a stat bonus at several ranks.
- **THEN** The talent appears as one row showing its class, its bonus range across its ranks, and how many ranks give the bonus.

### Requirement: Class growth remains a separate table

Class growth SHALL remain a separate table.

#### Scenario: Class growth remains a separate table
- **WHEN** A stat has published class growth and talent sources.
- **THEN** Class growth appears in a separate table.

### Requirement: Stat item-list links match both unit variants

The item-list link SHALL match both flat and percentage variants of the stat while ordinary item-list variant filters retain their separate meaning.

#### Scenario: Stat item-list links match both unit variants
- **WHEN** A stat has flat and percentage item variants and a reader follows its item-list link.
- **THEN** The link matches both variants, while ordinary item-list variant filters retain their separate meaning.

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

The stats list SHALL sort by number of distinct sources, most common first, according to its published kind entry, and distinguish on-hit trigger stats from other stats.

#### Scenario: Browse stats
- **WHEN** the reader opens the stats list
- **THEN** the most frequent stats appear first with their source counts and an on-hit trigger facet

#### Scenario: Browse effects
- **WHEN** the reader opens the effects list
- **THEN** the effects applied by the most sources appear first with their Applied By counts

#### Scenario: Stat browsing distinguishes prevalence and triggers
- **WHEN** The reader opens the stats list containing stats with different distinct-source counts and on-hit trigger stats.
- **THEN** The stats are ordered by distinct-source count, most common first, according to the published kind entry, and on-hit trigger stats are distinguished from other stats.

### Requirement: Effect browsing orders by application prevalence

The effects list SHALL sort by the number of sources that apply each effect, most applied first, according to its published kind entry, with ties in name order.

#### Scenario: Effect browsing orders by application prevalence
- **WHEN** The reader opens the effects list containing effects with different source counts and two effects with equal source counts.
- **THEN** Effects are ordered by applying-source count, most applied first, according to the published kind entry, with the tied effects in name order.

### Requirement: Browse names show entity identity

List names SHALL show their entity identity icons.

#### Scenario: Browse names show entity identity
- **WHEN** The reader views names in the stats and effects lists.
- **THEN** The names show their entity identity icons.

### Requirement: Effects description includes non-state impacts and summons

The Effects browse description SHALL include non-state impacts and summons rather than implying every effect is a buff or debuff.

#### Scenario: Effects description includes non-state impacts and summons
- **WHEN** The reader reads the Effects browse description.
- **THEN** The description includes non-state impacts and summons and does not imply every effect is a buff or debuff.

### Requirement: Contradictory damage text is not endorsed

A page SHALL not present a mismatched generic bonus damage type as a verified interaction and SHALL not claim Electricity Resistance protects against Fire damage.

#### Scenario: Authored description conflicts with stat name
- **WHEN** a stat's description refers to a different damage family
- **THEN** the page identifies the contradiction without endorsing the unverified mechanic

### Requirement: Verified mechanics links explain effect pages

A verified mechanics rule that links an effect SHALL make the effect reachable for publication unless a reviewed, self-invalidating exclusion withholds it. The effect page SHALL show the verified explanation and link back to the mechanics page section that contains it. A rule whose status is unknown SHALL NOT make its effect reachable.

#### Scenario: The tier runtime applies an effect without a catalog applier
- **WHEN** a verified Heroic affix rule links a described status effect and no catalog applier applies it
- **THEN** the status effect has a page with the verified explanation and a link to the Heroic Tier section

#### Scenario: A content-free linked effect is withheld
- **WHEN** a linked effect has no description, meaningful outcome, or usable relation and its reviewed exclusion evidence remains true
- **THEN** its rule link retains its name and icon without publishing a thin effect page

#### Scenario: An effect rule names its own page
- **WHEN** an effect page displays a verified rule that names that effect
- **THEN** its own name and icon remain visible without a link back to itself
- **AND** links to other effects in the same rule remain navigable

#### Scenario: A Heroic effect points to its explanation
- **WHEN** an effect page displays a rule from the Heroic Tier Affixes or Turning it on and off section
- **THEN** its section link uses a player-facing “How … works” label instead of a section slug

#### Scenario: Two rules share one explanation section
- **WHEN** two rules on an effect page both belong to the same Heroic Tier section
- **THEN** both verified rules appear, with only one link to that section
