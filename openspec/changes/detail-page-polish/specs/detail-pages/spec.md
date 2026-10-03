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

## MODIFIED Requirements

### Requirement: NPC pages show who the NPC is, where it is, and what it gives

A combat creature with a published encounter SHALL show its useful level and positive health, with positive experience per kill and respawn as secondary facts when applicable. On a phone, a boss's level and health SHALL precede a long Drops answer. A lone fact SHALL sit in the title identity line instead of occupying a full stat strip. Its answer SHALL show Drops sorted by chance, with the loot roll in the heading and a second loot table as a labeled group. An adventurer without drops SHALL instead answer with its Gear: the published chance that a finished job takes an upgrade from the reward gear list, a link to that list, and the items and types of its own gear kit when it has one. An NPC without drops SHALL not lead with an empty Drops answer. A friendly NPC without drops SHALL lead with its published service or flight destinations, when present. Text that applies to every NPC SHALL call it an NPC or name it, and SHALL reserve "creature" for NPCs that you fight. An adventurer's gear preference SHALL be named as the gear that it prefers, with its armor type, weapon types, and favoured stat, and SHALL NOT be described as what its kills drop. The main column SHALL show a Combat Stats section immediately after the answer for combat creatures with available stats. Its four primary values SHALL be Health, Strength, Armor, and Magic armor in a horizontal row, wrapping into two rows on phones, with each value above a small label. A level-dependent creature SHALL offer a compact creature-level control alongside that section's heading and a muted place and level range below it; bosses and fixed-level creatures SHALL show their stats at their level without a level control. A sentence about the calculation, a disclosure of its inputs, and a muted attack note SHALL follow the values when applicable. The side SHALL use the common side-card frame for meaningful level, faction, aggro range, and immunities without repeating the answer, and SHALL omit the column when it has no useful content. A scaling qualifier SHALL occupy its own muted line rather than splitting inside a level value. Negative health and unplaced default combat values SHALL NOT appear as facts. When the published kill experience has its level difference and the character level cap, the main column SHALL show the experience per kill at the reader's remembered character level, with its level control, the creature level at that character level, and a link to the kill calculator, without a duplicate static side fact. Its remaining sections SHALL prioritize the NPC's available stock, quests, or abilities ahead of secondary placement, with Where to find grouped by place with counts when there is a published spot, followed by variant differences. A missing spot SHALL be omitted rather than presented as a framed no-location answer. Each quest SHALL name whether the creature gives, completes, or is an objective; differing variant and placement facts SHALL remain accessible. A friendly service NPC SHALL not gain fabricated combat facts. An adventurer page SHALL show no respawn time, because a world adventurer returns through its scene's spawn pool and not after its record's respawn time, and SHALL show kill experience only when a kill gives experience. An adventurer of the world roster SHALL show its class with a linked entity preview, its race, and its party role in a compact facts card, with a link to the adventurer roster mechanics, and an adventurer without a role of its own SHALL read Damage by default. Its Gear card SHALL open with its gear preference. Its side SHALL show an Arrival card with its starting level, when it joins, and a link to the guide on inviting it. Where it has no known location, Where to find SHALL say that the Friends panel finds it once it has joined. A Talents section SHALL name its class, its preferred talent tree linked to that tree on its class page, and the abilities that it learns first. A roster adventurer takes its stats from its race and class at its level, so its page SHALL show no stats of its NPC record. An NPC's abilities SHALL be a section of the main column. An NPC that fights with the abilities of its class instead of the phase abilities of its record SHALL show no phase abilities, and ability pages SHALL NOT name it among the NPCs that use an ability.
When one of the four primary combat values cannot be calculated, its tile SHALL say Unknown rather than claiming a total, and any known authored addition SHALL remain available below the tiles.

#### Scenario: Boss of one place
- **WHEN** an NPC is boss of one place
- **THEN** its title links that place without a duplicate Boss of section

#### Scenario: Quest target and quest giver
- **WHEN** an NPC gives one quest and is an objective in another
- **THEN** its Quests section has one row per quest with the correct role

#### Scenario: Merchant without drops
- **WHEN** a reader opens Rickard, a merchant who drops nothing
- **THEN** the page has no Drops card and no text that calls Rickard a creature

#### Scenario: Adventurer gear
- **WHEN** a reader opens Eldeth Goldvein
- **THEN** the Gear card gives the job upgrade chance, links the reward gear list, and lists the nine items of the Oakheart kit with their types

#### Scenario: Gear preference of an adventurer
- **WHEN** a reader opens Agra Emberhide, whose specialization is Leather, Staff, and Strength
- **THEN** the Gear card opens with her preference for Leather armor and Staff and links to the Adventurers mechanics page's gear section

#### Scenario: Experience at the reader's level
- **WHEN** a reader at character level 15 opens a creature that spawns at levels 10 to 20 and scales with the player
- **THEN** its Experience per kill section shows the experience of a level 15 kill, computed as the kill calculator computes it without followers, Heroic, or bonuses

#### Scenario: Adventurer without a respawn time
- **WHEN** a reader opens Eldeth Goldvein, whose NPC record says 1 to 2 minutes
- **THEN** the page shows no respawn time and no experience per kill

#### Scenario: Adventurer facts
- **WHEN** a reader opens Eldeth Goldvein
- **THEN** her page names Druid, Dwarf, Tank, Primal Feral linked to that tree on the Druid page, the abilities she learns first starting with Bear Form, her starting level, and when she joins

#### Scenario: Class abilities instead of phase abilities
- **WHEN** a reader opens Eldeth Goldvein
- **THEN** the page lists no Bleeding Strike, Brutal Slice, or Toxic Fang, and the Bleeding Strike page does not name Eldeth among its users

#### Scenario: Adventurer page layout
- **WHEN** a reader opens Agra Emberhide
- **THEN** the side facts show a linked Druid class, Orc, and Tank, the Gear card opens with her preference for Leather armor and Staff, her Arrival card shows starting level 10 and that she joins at the start, and Talents lists the abilities that she learns first
- **AND** the page shows no Health, Strength, Movement Speed, or Spirit

#### Scenario: Unplaced NPC with abilities
- **WHEN** an NPC has no published location, drops, or vendor stock but has abilities
- **THEN** its abilities lead the page instead of an empty Drops or Where to find card, and unplaced respawn, experience, and aggro defaults are not advertised

#### Scenario: Flight master with a named station
- **WHEN** the flight network names the flight master's departure stop but no world placement is available
- **THEN** the NPC answers with that stop, destinations and connection status, common free fare once, and the verified travel-time rule without claiming a map location

#### Scenario: Negative NPC health
- **WHEN** a creature's published stat amount for Health is negative
- **THEN** neither the title nor its Combat Stats section presents negative health as a full health value

#### Scenario: Level-dependent combat stats
- **WHEN** a reader opens Fangchill or Bandit and changes the creature level
- **THEN** the four verified combat values update for the selected level, while the level range and source place remain visible
- **AND** Aquarius shows its fixed-level stats without a creature level control
