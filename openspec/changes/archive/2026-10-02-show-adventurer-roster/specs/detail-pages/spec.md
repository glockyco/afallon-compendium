## MODIFIED Requirements

### Requirement: NPC pages show who the NPC is, where it is, and what it gives

When available, a combat creature's strip SHALL show level, health, experience per kill, and respawn. Its answer SHALL show Drops sorted by chance, with the loot roll in the heading and a second loot table as a labeled group. An adventurer without drops SHALL instead answer with its Gear: the published chance that a finished job takes an upgrade from the reward gear list, a link to that list, and the items and types of its own gear kit when it has one. A combat creature without drops SHALL say that no drops are published for it by name. A friendly NPC without drops SHALL have no answer card. Text that applies to every NPC SHALL call it an NPC or name it, and SHALL reserve "creature" for NPCs that you fight. An adventurer's gear preference SHALL be named as the gear that it prefers, with its armor type, weapon types, and favoured stat, and SHALL NOT be described as what its kills drop. The side SHALL hold combat stats, faction, aggro range, immunities, and abilities as chips, and preserve other secondary facts without repeating the answer. When the published kill experience has its level difference and the character level cap, the side SHALL show the experience per kill at the reader's remembered character level, with its level control, the creature level at that character level, and a link to the kill calculator. Its remaining sections SHALL follow: Where to find grouped by place with counts, Sells, Quests, Variants. Each quest SHALL name whether the creature gives, completes, or is an objective; differing variant and placement facts SHALL remain accessible. A friendly service NPC SHALL not gain fabricated combat facts. An adventurer page SHALL show no respawn time, because a world adventurer returns through its scene's spawn pool and not after its record's respawn time, and SHALL show kill experience only when a kill gives experience. An adventurer of the world roster SHALL show an Adventurer card in its side with its class, race, party role, preferred talent tree linked to that tree on its class page, the abilities that it learns first, its starting level, and when it joins, and SHALL link the roster of the Adventurers guide. An adventurer without a role of its own SHALL read Damage by default. An NPC that fights with the abilities of its class instead of the phase abilities of its record SHALL show no phase abilities, and ability pages SHALL NOT name it among the NPCs that use an ability.

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
- **THEN** the side reads Gear preference: Leather armor, Staff, favours Strength, with a link to the Adventurers guide's gear section

#### Scenario: Experience at the reader's level
- **WHEN** a reader at character level 15 opens a creature that spawns at levels 10 to 20 and scales with the player
- **THEN** its Experience per kill card shows the experience of a level 15 kill, computed as the kill calculator computes it without followers, Heroic, or bonuses

#### Scenario: Adventurer without a respawn time
- **WHEN** a reader opens Eldeth Goldvein, whose NPC record says 1 to 2 minutes
- **THEN** the page shows no respawn time and no experience per kill

#### Scenario: Adventurer facts
- **WHEN** a reader opens Eldeth Goldvein
- **THEN** the Adventurer card names Druid, Dwarf, Tank, Primal Feral linked to that tree on the Druid page, the abilities she learns first starting with Bear Form, her starting level, and when she joins

#### Scenario: Class abilities instead of phase abilities
- **WHEN** a reader opens Eldeth Goldvein
- **THEN** the page lists no Bleeding Strike, Brutal Slice, or Toxic Fang, and the Bleeding Strike page does not name Eldeth among its users
