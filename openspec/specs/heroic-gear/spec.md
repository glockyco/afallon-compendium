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

An item with an eligible recorded creature-drop path SHALL offer a Heroic state preview of affected item stats. The preview SHALL preserve random-roll uncertainty rather than presenting one fictional saved roll. An item with no eligible creature-drop path SHALL NOT offer a Heroic state preview.

#### Scenario: Eligible Equipment
- **WHEN** a player toggles Heroic on equipment known to drop from a creature
- **THEN** affected fixed stats show the Heroic value using the captured bonus

#### Scenario: Crafting-Only Gear
- **WHEN** a player views equipment only known from crafting
- **THEN** the page does not imply the crafted item can become Heroic
