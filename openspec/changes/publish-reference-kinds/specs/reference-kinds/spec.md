## Purpose

Make effects, stats, enchantments, and factions readable as linked reference pages. Readers can inspect recorded facts and compare sources without inferred rankings.

## ADDED Requirements

### Requirement: Reference kinds are discoverable

Effects, Stats, Enchantments, and Factions SHALL appear in the Reference navigation group. Each kind SHALL have a list, a detail page for each reachable record, search entries, and link tooltips. Lists SHALL expose names and useful comparable facts without ranking entries. References from other pages SHALL link to the matching detail page when the target exists. The pages SHALL use the shared detail layout and the "On this page" list when they have four or more sections.

#### Scenario: Follow a stat from an item
- **WHEN** a reader opens the tooltip of a stat on an item
- **THEN** the tooltip names the stat and links to its detail page
- **AND** the stat appears in the Stats list and site search

#### Scenario: Record with no known source
- **WHEN** a reachable effect has no recorded application source
- **THEN** the effect remains on its list and has a detail page
- **AND** the page labels its application sources as not recorded

### Requirement: Effect pages distinguish rank behavior and sources

An effect page SHALL show its recorded behavior for each rank, including applicable damage, healing, stat changes, duration, and other authored actions. It SHALL show linked abilities and their applicable ranks, NPC abilities, items, and world interactions that apply the effect when supported by evidence. It SHALL distinguish direct applications from ability-mediated applications. It SHALL show requirements that test the effect, with the tested state or threshold when recorded. An absent or unresolved source SHALL NOT be presented as an application.

#### Scenario: Ability applies an effect
- **WHEN** an ability rank applies an effect and an NPC uses that ability
- **THEN** the effect page links the ability and its rank
- **AND** it names the NPC as an ability-mediated source

#### Scenario: Interaction tests an effect
- **WHEN** an interaction has an effect requirement but no effect application action
- **THEN** the effect page lists the interaction under requirements
- **AND** it does not list the interaction as an application source

### Requirement: Stat pages explain evidence and where stats occur

A stat page SHALL show its recorded description or effect when evidence supports one. It SHALL NOT invent a formula for a stat without verified evidence. It SHALL show items with fixed amounts, variable stat ranges, gem stats, gear-set tiers, talent ranks, and effects that change the stat. Each source row SHALL retain its amount, percent or flat unit, and relevant rank, tier, or range. Sections without source rows SHALL be omitted.

#### Scenario: Stat from two kinds of source
- **WHEN** a stat has a fixed item amount and a gear-set tier amount
- **THEN** the page links both sources and shows each amount with its own unit

#### Scenario: No verified rule
- **WHEN** a stat has no recorded description or verified rule
- **THEN** the page does not state what the stat does
- **AND** it still shows any recorded sources

### Requirement: Enchantment pages show application and acquisition

An enchantment page SHALL show its recorded effects for each tier, eligible item rules, eligible items verified against those rules, success chance, skill and item or currency costs when recorded. It SHALL link to its corresponding enchantment item and that item's recorded sources when one exists. If no eligible item, cost, or source is recorded, the page SHALL say so without inventing a value. The page SHALL not rank eligible items.

#### Scenario: Enchantment item has sources
- **WHEN** an enchantment has a matching item with recorded sources
- **THEN** its page links that item and its recorded sources

#### Scenario: No recorded costs
- **WHEN** an enchantment tier has no captured item or currency cost
- **THEN** its page says that no cost is recorded
- **AND** it does not describe the enchantment as free

### Requirement: Faction pages show all supported relationships

Each faction SHALL have the same list, detail, search, and tooltip treatment as the other reference kinds. Its page SHALL show members, recorded stances and relationships, reputation changes from kills and quests when captured, and unlocks with verified faction requirements when linked. A missing reputation change or unlock SHALL be labeled as unrecorded rather than zero or nonexistent. A faction SHALL remain published even when the game does not show it in the reputation interface.

#### Scenario: Hidden reputation faction
- **WHEN** a faction is marked as not shown in the game's reputation interface
- **THEN** it still has a page and appears in the faction list and search

#### Scenario: No captured reputation reward
- **WHEN** the catalog contains no kill or quest reputation change for a faction
- **THEN** its page states that reputation changes are not recorded
- **AND** it does not claim that killing members grants no reputation

### Requirement: Reader labels show evidence without internal identifiers

Headings, columns, and sentences SHALL use sentence case. Names and category values SHALL use title case and straight quotes. Reader-facing text SHALL NOT show record IDs, enum words, inferred game numbers, or unsupported mechanics. Unresolved links SHALL retain a readable label and a stated gap rather than disappear.

#### Scenario: Unresolved reference
- **WHEN** a recorded relation names a source that has no published page
- **THEN** its row keeps the source name without a broken link
- **AND** it does not show the source's native ID
