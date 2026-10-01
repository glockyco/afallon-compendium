## ADDED Requirements

### Requirement: Weapon tooltips show the game's damage line

An item tooltip of a weapon SHALL show its damage line as the 0.16.3 game writes it: the damage range, the damage label, and whether the weapon is melee or ranged, followed by its attack speed and damage per second. The damage label SHALL be the weapon's physical label for physical damage and its damage type otherwise, as the game chooses it. A weapon without a published damage type, attack mode, or label SHALL omit the part it lacks rather than guess it.

#### Scenario: A one-handed sword
- **WHEN** a sword deals 13 to 22 physical damage with the Slashing label in melee
- **THEN** its tooltip reads "13 - 22 Slashing Damage (Melee)" with its speed and damage per second below

#### Scenario: A fire staff
- **WHEN** a staff deals 42 to 70 Fire damage at range
- **THEN** its tooltip reads "42 - 70 Fire Damage (Ranged)"

#### Scenario: A bow
- **WHEN** a bow occupies the Ranged slot
- **THEN** its tooltip names the Ranged slot and shows its damage line as ranged
