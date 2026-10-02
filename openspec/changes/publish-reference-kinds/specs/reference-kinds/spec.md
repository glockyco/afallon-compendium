## ADDED Requirements

### Requirement: Reference kinds have entity pages

Gear sets, currencies, crafting stations, races, and factions SHALL each have one page for each published record, a list page, search entries, and hover tooltips, in the page model of other entity kinds. A reference to such a record SHALL link its page. A record that the reviewed exclusion list names SHALL have no page, and the publication SHALL fail when the catalog contradicts the exclusion's evidence.

#### Scenario: A set name on an item
- **WHEN** a reader opens the page of a member of Zephyr's Embrace
- **THEN** the set name in the item's tooltip links the Zephyr's Embrace page

#### Scenario: Savers station
- **WHEN** the catalog's Savers station makes only excluded progress-flag recipes and has no map spot
- **THEN** it has no page, list row, or search entry
- **AND** a later catalog that gives Savers a map spot or a published recipe stops the publication

### Requirement: Gear set pages show bonuses and pieces

A gear set page SHALL show the set's bonuses with the number of pieces that each needs and the stats that each gives, and state that a bonus is active while the reader wears at least that many different pieces, that two copies of one piece count once, and that a higher bonus keeps the lower ones. It SHALL list every piece with what the piece is. The gear set list SHALL show the type of the set's pieces, its piece count, and the pieces that its last bonus needs.

#### Scenario: Vermincrawl Garb
- **WHEN** a reader opens Vermincrawl Garb
- **THEN** its bonuses need 2, 4, and 6 pieces and its seven pieces are listed

### Requirement: Currency pages show sources and uses

A currency page SHALL show how to get the currency: the item that holds it, linked to that item's sources, and the quests that reward it with their amounts. It SHALL show what merchants sell for it in the same rows as its item's Buys section, the properties priced in it, and the quest rewards. A currency without a published source SHALL say so.

#### Scenario: Honor
- **WHEN** a reader opens Honor, which has no item and no quest reward
- **THEN** the page shows its description and what it buys, and says that no source is published

### Requirement: Crafting station pages show where and what

A crafting station page SHALL list the places where the station stands with their spot counts, each linking the map to the station's spots in that place, and SHALL link the map to all of its spots. It SHALL list the recipes made at the station with their products and required levels, and name the skill of each recipe when the station serves more than one skill. A map spot of a station SHALL carry the station's key.

#### Scenario: Cooking
- **WHEN** a reader opens Cooking
- **THEN** the page lists the places where it stands with their spot counts and its 24 recipes

### Requirement: Race pages show start, classes, and adventurers

A race page SHALL show the race's description, the place where its new characters start, the classes that it offers, and the adventurers of the race.

#### Scenario: Dwarf
- **WHEN** a reader opens Dwarf
- **THEN** it shows Abandoned Quarry as the starting place, six classes, and the Dwarf adventurers

### Requirement: Faction pages show standing and relations

A faction page SHALL show a new character's stance with the faction, its points, and its alignment, the faction's stances in order with the points that fill each and their alignments, the faction's stance and starting points toward each faction, whether the Reputation panel shows the faction, and a link to the NPC list filtered to the faction with the count that the filter shows. A new character's standing SHALL come from the verified rule that names the faction of every race.

#### Scenario: Hostile
- **WHEN** a reader opens Hostile
- **THEN** it shows that a new character starts Hated, an Enemy alignment
- **AND** its NPC link opens the NPC list with Hostile selected in the Faction filter

#### Scenario: Neutral Aggressive
- **WHEN** a reader opens Neutral Aggressive
- **THEN** it shows that a new character starts Neutral with 100 points toward the next stance

### Requirement: A Factions and Reputation guide explains standing

The publication SHALL publish a Factions and Reputation guide with sections for standing and stances, the standing of a new character, factions in combat, changing standing, and the Reputation panel. The new character section SHALL show each faction with the starting stance, alignment, points, and NPC count. The changing standing section SHALL state how many published creatures, quests, and items change standing. The guide SHALL NOT claim that an Enemy alignment makes a creature attack on sight.

#### Scenario: No source changes standing
- **WHEN** no published creature, quest reward, or item changes standing
- **THEN** the changing standing section says that nothing on the site changes standing
