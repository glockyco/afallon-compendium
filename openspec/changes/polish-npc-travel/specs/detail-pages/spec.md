## MODIFIED Requirements

### Requirement: NPC pages show who the NPC is, where it is, and what it gives

A combat creature with a published encounter SHALL show its useful level and positive health in a side facts card, with positive experience per kill and respawn as secondary facts when applicable. A lone fact SHALL sit in the title identity line instead of occupying a full stat strip. Its answer SHALL show Drops sorted by chance, with the loot roll in the heading and a second loot table as a labeled group. An adventurer without drops SHALL instead answer with its Gear: the published chance that a finished job takes an upgrade from the reward gear list, a link to that list, and the items and types of its own gear kit when it has one. An NPC without drops SHALL not lead with an empty Drops answer. A friendly NPC without drops SHALL lead with its published service or flight destinations, when present. Text that applies to every NPC SHALL call it an NPC or name it, and SHALL reserve "creature" for NPCs that you fight. An adventurer's gear preference SHALL be named as the gear that it prefers, with its armor type, weapon types, and favoured stat, and SHALL NOT be described as what its kills drop. The side SHALL use the common side-card frame for meaningful combat stats, faction, aggro range, and immunities without repeating the answer, and SHALL omit the column when it has no useful content. Negative health and unplaced default combat values SHALL NOT appear as facts. When the published kill experience has its level difference and the character level cap, the side SHALL show the experience per kill at the reader's remembered character level, with its level control, the creature level at that character level, and a link to the kill calculator. Its remaining sections SHALL prioritize the NPC's available stock, quests, or abilities ahead of secondary placement, with Where to find grouped by place with counts when there is a published spot, followed by variant differences. A missing spot SHALL be omitted rather than presented as a framed no-location answer. Each quest SHALL name whether the creature gives, completes, or is an objective; differing variant and placement facts SHALL remain accessible. A friendly service NPC SHALL not gain fabricated combat facts. An adventurer page SHALL show no respawn time, because a world adventurer returns through its scene's spawn pool and not after its record's respawn time, and SHALL show kill experience only when a kill gives experience. An adventurer of the world roster SHALL show its class with a linked entity preview, its race, and its party role in a compact facts card, with a link to the adventurer roster mechanics, and an adventurer without a role of its own SHALL read Damage by default. Its Gear card SHALL open with its gear preference. Its side SHALL show an Arrival card with its starting level, when it joins, and a link to the guide on inviting it. Where it has no known location, Where to find SHALL say that the Friends panel finds it once it has joined. A Talents section SHALL name its class, its preferred talent tree linked to that tree on its class page, and the abilities that it learns first. A roster adventurer takes its stats from its race and class at its level, so its page SHALL show no stats of its NPC record. An NPC's abilities SHALL be a section of the main column. An NPC that fights with the abilities of its class instead of the phase abilities of its record SHALL show no phase abilities, and ability pages SHALL NOT name it among the NPCs that use an ability.

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
- **THEN** the side reads Gear preference: Leather armor, Staff, favours Strength, with a link to the Adventurers mechanics page's gear section

#### Scenario: Experience at the reader's level
- **WHEN** a reader at character level 15 opens a creature that spawns at levels 10 to 20 and scales with the player
- **THEN** its Experience per kill card shows the experience of a level 15 kill, computed as the kill calculator computes it without followers, Heroic, or bonuses

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
- **THEN** neither the title nor side cards present it as health


## ADDED Requirements

### Requirement: NPC effects and portraits reflect their game identity

NPC pages SHALL link published effects whose appliers name that NPC through an ability or an adventurer invitation. An adventurer invitation SHALL describe the NPC it summons and the effect's authored pet duration in human units. NPC pages and previews SHALL show the game's authored portrait, including portraits shared by unrelated characters. A record with no usable placement, description, drops, stock, quests, abilities, or other playable relation MAY be withheld by reviewed, evidence-checked exclusion, and links to it SHALL read as plain text. A bare service-role flag without a location or matching quest or stock is not a usable service.

#### Scenario: Adventurer invitation
- **WHEN** Brughan Redthorn's invitation applies a pet effect that summons Brughan Redthorn for 3,600 seconds
- **THEN** his page links that effect and says he is summoned for 1 hour

#### Scenario: NPC ability applies an effect
- **WHEN** a creature's phase ability applies a published effect
- **THEN** the creature page links both the ability and the effect, reflecting the effect page's NPC applier

#### Scenario: Game-authored portrait shared by adventurers
- **WHEN** Brughan Redthorn and unrelated roster adventurers share the Avatar human female portrait
- **THEN** their NPC pages and previews display the game's authored portrait

#### Scenario: Content-free NPC
- **WHEN** AemonGold the Trader has no place, service, ability, drops, stock, quest, or description in published source data
- **THEN** no empty NPC page is published, and any reference to the record remains readable without a link

#### Scenario: Unreachable quest giver
- **WHEN** an NPC has a quest-giver flag but no known location, quest, description, stock, or ability
- **THEN** its role flag alone does not force the publication of an empty page
