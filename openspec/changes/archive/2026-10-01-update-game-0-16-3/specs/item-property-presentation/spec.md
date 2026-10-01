## ADDED Requirements

### Requirement: Weapon tooltips show the game's damage line

A weapon tooltip SHALL show the 0.16.3 game's damage line, with a rounded range, resolved damage school or physical label, and melee or ranged mode. A positive attack speed SHALL appear beneath it as `Speed 0.00`, followed by damage per second calculated from the rounded endpoints and displayed to one decimal. Explicit attack mode, damage type, and physical label SHALL take precedence over inferred values. Auto mode SHALL derive the mode from the weapon slot and type, and damage without an explicit type SHALL use the game's physical or elemental school rules. An unresolved or invalid mode SHALL use the plain `{minimum} - {maximum} Damage` line. A nonweapon or a weapon without positive maximum damage SHALL show no damage block.

#### Scenario: A one-handed sword
- **WHEN** a sword deals 13 to 22 physical damage with the Slashing label in melee
- **THEN** its tooltip reads "13 - 22 Slashing Damage (Melee)" with its speed and damage per second below

#### Scenario: A fire staff
- **WHEN** a staff deals 42 to 70 Fire damage at range
- **THEN** its tooltip reads "42 - 70 Fire Damage (Ranged)"

#### Scenario: A bow
- **WHEN** a bow occupies the Ranged slot
- **THEN** its tooltip names the Ranged slot and shows its damage line as ranged
