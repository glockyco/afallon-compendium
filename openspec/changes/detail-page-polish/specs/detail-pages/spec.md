## ADDED Requirements

### Requirement: Detail answers stay prominent and readable

Entity detail pages SHALL lead with the fact a reader needs to understand that entity, keeping long related lists and explanations available after the answer. On phones, the boss's level and health, adventurer's race, class, role and arrival, quest rewards, class talent tree links, and zone contents SHALL precede long loot, gear, chain, or lore content. An ability's effect and use SHALL have the main column before learner lists while costs and requirements remain accessible. Desktop shall retain a main answer beside secondary facts. Entity names, action labels, and separators SHALL not split into misleading line fragments.

#### Scenario: Boss and adventurer on a phone
- **WHEN** a reader opens Kraath the Hivebreaker or Agra Emberhide at 390 px
- **THEN** Kraath's level and health precede the long drops list, and Agra's identity and arrival precede the gear kit

#### Scenario: Quest and class on a phone
- **WHEN** a reader opens A Bite in the Brew or Shieldmaster at 390 px
- **THEN** quest rewards precede the chain, and the class's talent tree links precede its long starting gear list
- **AND** the quest's Show on Map action remains together when its location row wraps

#### Scenario: Place and ability answers
- **WHEN** a reader opens Coalway Swamp on a phone or Ambush on a desktop
- **THEN** zone content counts and jump links precede long lore, and the ability's effect occupies the main answer before its learner list

### Requirement: Detail facts avoid repetition and preserve context

A detail page SHALL not repeat a source, reward, experience amount, set piece total, or item count in neighboring cards when one presentation gives the same answer. Distinct acquisition methods and differing conditions SHALL remain available. An item belonging to a gear set SHALL show the equipped bonus summary with a way to reach the full roster. Source names and metadata SHALL wrap at entity boundaries without orphan punctuation. Quantities and heading counts SHALL name their units. Explanations SHALL only refer to chance values that the page displays or explicitly identifies.

#### Scenario: Item sources and set membership
- **WHEN** a reader opens Mandrith Carapace Cleaver, Adventurer's Fire Sword, or Adept Necromancer Chest
- **THEN** identical boss drops or sole quest rewards appear once, set bonuses remain visible without listing every set piece in the stat card, and source names and separators wrap intact

#### Scenario: Gathering yield and on-hit effect
- **WHEN** a reader opens Aetherium Vein at 390 px or Adventurer's Fire Sword
- **THEN** yield values retain their chance heading, the required Mining level is distinguished from the reader's level and extra yield, and on-hit text does not promise a missing chance column

#### Scenario: Repeated counts
- **WHEN** a reader opens the item-power stat or Adept Necromancer gear set
- **THEN** the item count and set piece count each appear once in nearby summary and section controls

### Requirement: Section controls never obscure detail content

A floating section navigator SHALL not overlap readable content at desktop or phone widths during scrolling, including near the bottom of the page. The control SHALL still reach each rendered section.

#### Scenario: Scrolling a boss page on a phone
- **WHEN** a reader scrolls Kraath the Hivebreaker's long loot section at 390 px
- **THEN** the section control does not cover a loot row or its chance
