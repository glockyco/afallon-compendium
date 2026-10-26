# stats-and-effects Specification

## Purpose
Give readers linked, evidence-bounded explanations of player-relevant stats and reachable effects alongside a Combat guide that distinguishes recorded settings from verified game rules.

## Requirements

### Requirement: Player-relevant stats have navigable pages

The publication SHALL provide a stat page, list row, searchable entry, and tooltip for every reviewed player-relevant stat definition.

#### Scenario: Strength and its sources
- **WHEN** a reader opens Strength from an item or a class talent
- **THEN** the stat page shows its authored description and configured bounds, offers the Strength item-list filter, and links its published gear, gem, talent, effect, and class sources

#### Scenario: Vitality configuration
- **WHEN** a reader opens Health
- **THEN** its base value, bounds, starting percentage, and recorded recovery values are visible as configured data, not an unverified live tick guarantee

#### Scenario: Internal stat
- **WHEN** a record such as Rent count down has no demonstrated player-facing use
- **THEN** it has no published page or searchable entry

#### Scenario: On-hit effect percentage
- **WHEN** a stat links an effect with a 12% effect chance
- **THEN** its page and tooltip explain that an eligible hit first rolls the stat's current trigger chance and that the effect's 12% chance is rolled only after the stat triggers

#### Scenario: Player-relevant stats have navigable pages
- **WHEN** A reviewed player-relevant stat definition is published.
- **THEN** The stat has a page, list row, searchable entry, and tooltip.

### Requirement: Internal-only stat candidates remain unpaged

Internal-only candidates without a demonstrated player-facing use SHALL not receive pages.

#### Scenario: Internal-only stat candidates remain unpaged
- **WHEN** An internal-only stat candidate has no demonstrated player-facing use.
- **THEN** The candidate receives no page.

### Requirement: Stat pages show authored and configured data

A stat page SHALL show its authored description, category, flat or percent unit, base value, configured bounds, and configured vitality recovery values.

#### Scenario: Stat pages show authored and configured data
- **WHEN** A reader opens a stat page with configured vitality recovery values.
- **THEN** The page shows the authored description, category, flat or percent unit, base value, configured bounds, and configured vitality recovery values.

### Requirement: Stat pages link on-hit effect configuration

A stat page SHALL link on-hit effects with their authored chance and cooldown.

#### Scenario: Stat pages link on-hit effect configuration
- **WHEN** A stat has a linked on-hit effect with an authored chance and cooldown.
- **THEN** The stat page links the effect and shows its authored chance and cooldown.

### Requirement: Stat pages and tooltips explain on-hit roll order

A stat page and tooltip SHALL explain that an eligible hit first rolls the stat's current value as its trigger chance and only then rolls each linked effect's percentage.

#### Scenario: Stat pages and tooltips explain on-hit roll order
- **WHEN** A reader views the page and tooltip for a stat with two linked on-hit effects.
- **THEN** Both explain that an eligible hit first rolls the stat's current value as its trigger chance and only then rolls each linked effect's percentage.

### Requirement: Stat pages offer item-list filtering

A stat page SHALL offer the item-list filter for the stat.

#### Scenario: Stat pages offer item-list filtering
- **WHEN** A reader opens a published stat page.
- **THEN** The page offers the item-list filter for that stat.

### Requirement: Stat pages separate and link source families

A stat page SHALL offer separate, linked counts or lists of item, gem, gear set, talent, effect, class, and enchantment sources where published, with large lists initially collapsed.

#### Scenario: Stat pages separate and link source families
- **WHEN** A stat has published item, gem, gear set, talent, effect, class, and enchantment sources, including a large item list.
- **THEN** The page offers separate linked counts or lists for those source families, with the large item list initially collapsed.

### Requirement: Published stat references link stat pages

References to a published stat SHALL link its page.

#### Scenario: Published stat references link stat pages
- **WHEN** A published effect references a published stat.
- **THEN** The stat reference links the stat's page.
### Requirement: Source-connected effects have navigable pages

The publication SHALL page every effect that a published ability, item, on-hit stat, creature ability, invitation, world interaction, or named requirement applies or checks.

#### Scenario: Bleeding and a checked effect
- **WHEN** a reader follows Bleeding from an ability or Potion Sickness from a requirement
- **THEN** the effect page explains the recorded ranks and timing and distinguishes application sources from requirement checks

#### Scenario: Shared world action
- **WHEN** the same effect is used by many scanned world objects
- **THEN** its page groups sources by place rather than repeating thousands of individual placements, and its serialized document remains below 262,144 bytes

#### Scenario: Unnamed effect
- **WHEN** a connected effect has no authored name
- **THEN** its page title identifies its recorded type and native number

#### Scenario: Ability application chance
- **WHEN** an ability or creature ability lists an applied effect with a percentage
- **THEN** ability, creature, and effect pages identify that percentage as rolled each eligible time the ability tries to apply that effect to a target, with targets hit and pulses able to add attempts

#### Scenario: Source-connected effects have navigable pages
- **WHEN** A published invitation applies an effect and a published named requirement checks another effect.
- **THEN** Both effects have published pages.

### Requirement: Unconnected effects remain unpaged

Unconnected effects SHALL remain unpaged.

#### Scenario: Unconnected effects remain unpaged
- **WHEN** An effect has no connection to a published source that applies or checks it.
- **THEN** The effect remains unpaged.

### Requirement: Unnamed effects use recorded fallback names

Unnamed connected effects SHALL use an effect-type and native-number fallback name rather than an invented proper name.

#### Scenario: Unnamed effects use recorded fallback names
- **WHEN** A connected effect has a recorded type and native number but no authored name.
- **THEN** Its fallback name uses its effect type and native number, not an invented proper name.

### Requirement: Effect lists expose types and source counts

The list SHALL expose effect type and source counts.

#### Scenario: Effect lists expose types and source counts
- **WHEN** A reader views the effect list.
- **THEN** The list exposes effect type and source counts.

### Requirement: Effect pages distinguish instant effects and states

A page SHALL distinguish instant effects from states.

#### Scenario: Effect pages distinguish instant effects and states
- **WHEN** A reader views an instant effect page and a state effect page.
- **THEN** The pages distinguish the instant effect from the state.

### Requirement: Effect pages present authored configuration within evidence limits

A page SHALL show type-relevant authored timing, pulse count and interval, stack limit, persistence, and removability as data, without asserting unverified stacking or user-interface actions.

#### Scenario: Effect pages present authored configuration within evidence limits
- **WHEN** A reader opens an effect page with authored timing, pulses, stack limit, persistence, and removability.
- **THEN** The page shows the type-relevant values as data without asserting unverified stacking or user-interface actions.

### Requirement: Effect ranks describe recorded outcomes

Each rank SHALL describe its type-specific recorded outcome in natural language and link referenced stats, pets, places, and effects where published.

#### Scenario: Effect ranks describe recorded outcomes
- **WHEN** An effect rank records an outcome referencing a published stat, pet, place, and effect.
- **THEN** The rank describes its type-specific recorded outcome in natural language and links those published references.

### Requirement: Effect source lists link owners and group world sources

Applied-by and checked-by sources SHALL link owners when available and group repeated world sources by place.

#### Scenario: Effect source lists link owners and group world sources
- **WHEN** Applied-by and checked-by sources include available owners and repeated world sources in one place.
- **THEN** The sources link their available owners and group the repeated world sources by place.

### Requirement: Effect references link published pages

Effect references in requirements, abilities, and items SHALL link the pages.

#### Scenario: Effect references link published pages
- **WHEN** A requirement, an ability, and an item reference a paged effect.
- **THEN** Each effect reference links the effect page.

### Requirement: Ability effect percentages identify application attempts

Applied-by ability and creature-ability percentages SHALL identify each eligible application attempt for that effect on a target as the roll, not each cast or hit.

#### Scenario: Ability effect percentages identify application attempts
- **WHEN** An effect page lists applied-by ability and creature-ability percentages.
- **THEN** The percentages identify each eligible attempt to apply that effect to a target as the roll, not each cast or hit.

### Requirement: On-hit effect chances distinguish the earlier stat roll

An on-hit stat's linked effect chance SHALL be distinguished from the stat's earlier trigger roll.

#### Scenario: On-hit effect chances distinguish the earlier stat roll
- **WHEN** An effect page shows a linked effect chance from an on-hit stat.
- **THEN** The linked effect chance is distinguished from the stat's earlier trigger roll.
### Requirement: Combat guide states only supported rules

The Combat guide SHALL cover stat composition and bounds, gear set piece counting and cumulative tiers, recorded vitality recovery, damage and defenses, critical hits, on-hit effects, and timed effects with pulses, stat changes, persistence, and named requirement checks.

#### Scenario: Critical-hit explanation
- **WHEN** a reader follows the Combat guide from Critical Hit Chance
- **THEN** the guide explains level-aware rating, target defense and level, and a bounded final chance without promising an unverified fixed conversion

#### Scenario: Gear set thresholds
- **WHEN** a reader consults Building Your Stats
- **THEN** the guide explains that distinct equipped set items reach thresholds and that higher tiers keep lower tier stat bonuses

#### Scenario: Combat guide states only supported rules
- **WHEN** A reader consults the Combat guide's coverage.
- **THEN** The guide covers stat composition and bounds, gear set piece counting and cumulative tiers, recorded vitality recovery, damage and defenses, critical hits, on-hit effects, and timed effects with pulses, stat changes, persistence, and named requirement checks.

### Requirement: Behavioral claims require registered verified evidence

Behavioral claims SHALL come from registered, verified evidence.

#### Scenario: Behavioral claims require registered verified evidence
- **WHEN** The Combat guide makes a behavioral claim about damage.
- **THEN** The claim comes from registered, verified evidence.

### Requirement: Recovery configuration does not imply measured cadence

Recovery SHALL show recorded amounts and intervals as configuration without implying measured live cadence.

#### Scenario: Recovery configuration does not imply measured cadence
- **WHEN** The Combat guide presents vitality recovery amounts and intervals.
- **THEN** The guide shows the recorded values as configuration without implying measured live cadence.

### Requirement: Pages link relevant Combat guide sections

Pages SHALL link the relevant guide section.

#### Scenario: Pages link relevant Combat guide sections
- **WHEN** A stat page concerns critical hits covered by a Combat guide section.
- **THEN** The page links the relevant guide section.

### Requirement: Stats Effects and Combat appear in requested navigation

Stats, Effects, and Combat SHALL appear in their requested navigation groups and the home page's guide list.

#### Scenario: Stats Effects and Combat appear in requested navigation
- **WHEN** A reader views the requested navigation groups and the home page's guide list.
- **THEN** Stats, Effects, and Combat appear in their requested navigation groups and in the home page's guide list.
