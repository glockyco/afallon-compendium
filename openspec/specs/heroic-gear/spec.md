# heroic-gear Specification

## Purpose
Players can distinguish equipment that can become Heroic from gear that cannot, and inspect how a Heroic piece compares with its ordinary version.

## Requirements

### Requirement: Heroic Gear Origin

The Heroic Tier guide SHALL explain how an eligible creature drop gains the Heroic state while the tier is live, what published gear bonuses it receives, and which examined acquisition paths do not mark gear Heroic. Its numeric claims SHALL follow build-matched captured settings and verified native behavior.

#### Scenario: Creature Loot Compared With Quest Rewards
- **WHEN** the reader examines the Heroic gear guide section
- **THEN** creature-drop eligibility and the absence of Heroic marking in normal quest reward and chest paths are distinguishable

### Requirement: Heroic Equipment Preview

A creature-drop path is eligible when the creature can drop the item while the Heroic tier is live: a world loot drop, a creature without a recorded place, or a creature with at least one place where the tier does not pause. The tier pauses in the places that the verified exclusion rule names and in every timed dungeon. An item with an eligible recorded creature-drop path SHALL offer a Heroic version among its gear options, and the options SHALL state the bonus. The preview SHALL preserve random-roll uncertainty rather than presenting one fictional saved roll. The tooltip of the Heroic version SHALL show the game's single `Heroic` tag line in the game's tag color above the stat lines, and its stat values SHALL include the bonus. An item with no eligible creature-drop path SHALL NOT offer a Heroic version. When creatures drop the item only in places where the tier pauses, its page SHALL say that it never drops as Heroic gear and name those places. A Heroic version SHALL NOT combine with a corrupted version, because corrupted gear comes from the reward bags of timed dungeons, where the tier pauses.

#### Scenario: Eligible Equipment
- **WHEN** a player chooses the Heroic version of equipment that a creature drops where the tier can be live
- **THEN** affected fixed stats show the Heroic value using the captured bonus

#### Scenario: Crafting-Only Gear
- **WHEN** a player views equipment only known from crafting
- **THEN** the page does not imply the crafted item can become Heroic

#### Scenario: Gear Only From Paused Places
- **WHEN** a player views Felglass Greatsword, which only Vaelgorath, the Rift-Warden drops, and only in Felheart Crucible
- **THEN** the page offers no Heroic version
- **AND** it says the item never drops as Heroic gear and names Felheart Crucible as the place where the tier pauses

#### Scenario: Heroic And Corrupted Versions
- **WHEN** a player views equipment that has both a Heroic and a corrupted version
- **THEN** the gear options show one version at a time, so the tooltip never combines the Heroic bonus with corruption
