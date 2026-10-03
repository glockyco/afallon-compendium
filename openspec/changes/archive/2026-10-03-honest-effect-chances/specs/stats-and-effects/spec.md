## MODIFIED Requirements

### Requirement: Player-relevant stats have navigable pages

The publication SHALL provide a stat page, list row, searchable entry, and tooltip for every reviewed player-relevant stat definition. Internal-only candidates without a demonstrated player-facing use SHALL not receive pages. A stat page SHALL show its authored description, category, flat or percent unit, base value, configured bounds, and configured vitality recovery values. It SHALL link on-hit effects with their authored chance and cooldown, explaining on the page and tooltip that an eligible hit first rolls the stat's current value as its trigger chance and only then rolls each linked effect's percentage. It SHALL offer the item-list filter for the stat and separate, linked counts or lists of item, gem, gear set, talent, effect, class, and enchantment sources where published, with large lists initially collapsed. References to a published stat SHALL link its page.

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

### Requirement: Source-connected effects have navigable pages

The publication SHALL page every effect that a published ability, item, on-hit stat, creature ability, invitation, world interaction, or named requirement applies or checks. Unconnected effects SHALL remain unpaged. Unnamed connected effects SHALL use an effect-type and native-number fallback name rather than an invented proper name. The list SHALL expose effect type and source counts. A page SHALL distinguish instant effects from states and show type-relevant authored timing, pulse count and interval, stack limit, persistence, and removability as data, without asserting unverified stacking or user-interface actions. Each rank SHALL describe its type-specific recorded outcome in natural language and link referenced stats, pets, places, and effects where published. Applied-by and checked-by sources SHALL link owners when available and group repeated world sources by place. Effect references in requirements, abilities, and items SHALL link the pages. Applied-by ability and creature-ability percentages SHALL identify each eligible application attempt for that effect on a target as the roll, not each cast or hit. An on-hit stat's linked effect chance SHALL be distinguished from the stat's earlier trigger roll.

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
