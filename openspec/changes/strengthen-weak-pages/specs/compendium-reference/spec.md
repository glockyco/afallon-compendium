## ADDED Requirements

### Requirement: Stat links read as part of their amount

A link to a stat SHALL show no icon or kind glyph and SHALL take the colour of the text around it, marked as a link by a dotted underline, in every table, sentence, and tooltip. Links to other kinds SHALL keep their icons.

#### Scenario: Enchantment amounts
- **WHEN** a reader views the enchanting table on the Crafting and Gathering page
- **THEN** each amount reads as "+15 Armor" with Armor underlined and no framed glyph before it

#### Scenario: Item linked beside a stat
- **WHEN** a row names an item and a stat
- **THEN** the item keeps its icon and the stat shows none
