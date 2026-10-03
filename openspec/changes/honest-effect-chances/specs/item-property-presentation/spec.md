## MODIFIED Requirements

### Requirement: Item pages explain rewards from use actions

An item page SHALL show a When used section when captured item actions spawn prefab chests or open loot tables. Chest contents SHALL appear in a relation table sorted by row chance, with item or currency, inclusive quantity range, and chance per row clear on the page. Each chest row's chance SHALL be identified as rolled independently per open, and a positive maximum-drop cap SHALL explain that some successful rows can be lost when the limit is reached. Only the published nonzero action chance when below 100% and positive maximum-drop cap SHALL appear as short data sentences. The page SHALL distinguish an Item action that gains an item from one that consumes it in plain sentences. A placed When used rule SHALL link to the section of the Loot guide on items that open a chest, without repeating rule prose on the item page. No internal effect, prefab, chest, or loot table name SHALL be published.

#### Scenario: A soaked bag spawns a chest
- **WHEN** an item has a TriggerVisualEffect action whose effect template contains a chest prefab
- **THEN** its When used section lists every chest row including currency rows and the maximum-drop cap
- **AND** its own Item action is described by the captured AlterAction, not inferred from its item ID

#### Scenario: Capped chest contents
- **WHEN** a chest limits the number of items it gives
- **THEN** its page explains that each row rolls when the chest opens but successful rolls beyond the item limit are not received

### Requirement: Item pages identify effects from use and on-hit procs

Item pages SHALL expose the effects applied by direct item actions, by abilities activated from the item, and by fixed or enchanted on-hit stats using the same application records as effect pages. Each row SHALL link to a published effect, or render an unpublished effect as plain text, and show its supported duration. A positive direct-action chance below certainty SHALL be described as rolled once per use, and a zero action-chance sentinel SHALL not display as a zero percent chance. Effects from activated abilities SHALL identify the chance per eligible application attempt. On-hit effect chances SHALL identify the stat's trigger as a separate earlier roll. Direct-use effects SHALL appear under When used; on-hit effects SHALL identify their trigger separately.

#### Scenario: Consumable applies a timed effect
- **WHEN** a potion's item action applies a published effect for ten minutes
- **THEN** the potion's When used section links the effect and shows its ten-minute duration

#### Scenario: Equipment stat applies an effect on hit
- **WHEN** a weapon's fixed stat has an effect proc with a published chance
- **THEN** the item links the effect under On-hit effects with that chance and the effect duration when known

#### Scenario: Item-use action at zero and one hundred
- **WHEN** direct item-use actions have chance settings of zero and 100
- **THEN** both actions are shown without a percentage because each applies on every eligible use

## ADDED Requirements

### Requirement: Random item stat chances identify their own roll

An item tooltip SHALL explain that random stats are rolled independently in order when the item is generated, and a positive item stat limit can prevent later entries from being reached. Each shown percentage SHALL refer to the entry's own selection roll when reached, not a guaranteed final inclusion chance. When selected, a stat's value SHALL be drawn within its displayed range.

#### Scenario: Limited random stats
- **WHEN** an item has multiple random stat entries and a positive maximum number of random stats
- **THEN** the tooltip shows the maximum and explains each entry's percentage applies when its selection roll is reached, with a value from its displayed range
