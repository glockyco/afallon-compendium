## ADDED Requirements

### Requirement: Tooltip text links read as game text

A link inside an item tooltip's game text, such as a stat, an effect, or a gear-set member, SHALL show no icon and SHALL take the colour of its line. A stat preview SHALL state only facts that distinguish the stat: a starting value or floor other than zero, a cap, recovery, on-hit effects, and how many items, gems, enchantments, gear sets, talents, and effects grant it.

#### Scenario: Stat lines of an item
- **WHEN** a reader views the tooltip of Acolyte's Belt
- **THEN** its Haste, Stamina, Intellect, and Magic Armor lines keep the green of the item's stat lines and show no glyph

#### Scenario: Stat without a starting value
- **WHEN** a reader hovers Haste, whose base and floor are zero
- **THEN** the preview omits both and states its cap and its sources
