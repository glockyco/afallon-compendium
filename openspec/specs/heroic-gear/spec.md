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

A creature-drop path is eligible when the creature can drop the item while the Heroic tier is live: a world loot drop, a creature without a recorded place, or a creature with at least one place where the tier does not pause. An item with an eligible recorded creature-drop path SHALL offer a Heroic version among its gear options.

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

#### Scenario: Complete Item Coverage
- **WHEN** the Heroic Tier comparison opens with eligible weapons, armor, and trinkets in the publication
- **THEN** every item with an eligible Heroic item page is selectable
- **AND** crafted-only, chest-only, and paused-place-only equipment is not offered

#### Scenario: Search And Keyboard Selection
- **WHEN** a reader types part of an eligible item's name and moves through matching choices with the arrow keys
- **THEN** choices show their item icons and rarity colors, and Enter selects the highlighted item
- **AND** the comparison updates to that item's normal and Heroic stats

#### Scenario: Standalone Drop Explanation
- **WHEN** a reader selects Dragon Rend independently of the creature comparison above
- **THEN** the text explains that Dragon Rend can drop as Heroic from creatures while the tier is live
- **AND** its item page is linked for known drop sources without asserting a drop from the separately selected creature

#### Scenario: Aligned Comparison Cards And Rows
- **WHEN** a reader views Heroic or corrupted item comparisons in three columns
- **THEN** the changes card and both item cards share the same top and bottom edges
- **AND** each stat row's divider and stripe spans its full width
- **AND** wrapped tooltip metadata does not start a new line with a separator

#### Scenario: Closed And Open Item Pickers
- **WHEN** a reader selects an item in the Heroic or Corruption comparison
- **THEN** the closed control displays its icon, rarity-colored name, and no selected-text highlight
- **AND** reopening the control allows filtering by name and keyboard selection

#### Scenario: Phone Comparison Order
- **WHEN** a reader opens either comparison on a phone
- **THEN** the normal and modified item cards precede the changes card

#### Scenario: Corruption Source Without Artwork
- **WHEN** a corrupted item's drop source has no available icon
- **THEN** its name remains visible without an empty icon frame

#### Scenario: Corruption Source With Artwork
- **WHEN** a corrupted item's drop source has an icon
- **THEN** its link displays that icon beside the source name after loading

#### Scenario: Heroic Equipment Preview
- **WHEN** An item has a recorded drop path from a creature without a recorded place.
- **THEN** The item's gear options offer a Heroic version.

### Requirement: Heroic tier pause locations

The Heroic tier SHALL pause in the places that the verified exclusion rule names and in every timed dungeon.

#### Scenario: Heroic tier pause locations
- **WHEN** A creature-drop location is a timed dungeon.
- **THEN** The Heroic tier pauses at that location.

### Requirement: Heroic options state the bonus

The gear options for an item with an eligible recorded creature-drop path SHALL state the Heroic bonus.

#### Scenario: Heroic options state the bonus
- **WHEN** A reader views the gear options for an item with an eligible recorded creature-drop path.
- **THEN** The options state the Heroic bonus.

### Requirement: Heroic previews preserve random-roll uncertainty

The Heroic preview SHALL preserve random-roll uncertainty rather than presenting one fictional saved roll.

#### Scenario: Heroic previews preserve random-roll uncertainty
- **WHEN** A reader previews a Heroic item with random-roll stats.
- **THEN** The preview preserves random-roll uncertainty rather than presenting one fictional saved roll.

### Requirement: Heroic tooltip tag presentation

The tooltip of the Heroic version SHALL show the game's single `Heroic` tag line in the game's tag color above the stat lines.

#### Scenario: Heroic tooltip tag presentation
- **WHEN** A reader opens the tooltip of a Heroic version.
- **THEN** One `Heroic` tag line appears in the game's tag color above the stat lines.

### Requirement: Heroic tooltip stats include the bonus

The stat values in the tooltip of the Heroic version SHALL include the bonus.

#### Scenario: Heroic tooltip stats include the bonus
- **WHEN** A reader opens a Heroic version's tooltip.
- **THEN** Its stat values include the Heroic bonus.

### Requirement: Ineligible items exclude Heroic versions

An item with no eligible creature-drop path SHALL NOT offer a Heroic version.

#### Scenario: Ineligible items exclude Heroic versions
- **WHEN** An item has no eligible creature-drop path.
- **THEN** Its gear options do not offer a Heroic version.

### Requirement: Paused-only drops explain Heroic unavailability

When creatures drop the item only in places where the tier pauses, its page SHALL say that it never drops as Heroic gear and name those places.

#### Scenario: Paused-only drops explain Heroic unavailability
- **WHEN** Creatures drop an item only in two places where the Heroic tier pauses.
- **THEN** The item page says it never drops as Heroic gear and names both places.

### Requirement: Heroic and corrupted versions remain separate

A Heroic version SHALL NOT combine with a corrupted version, because corrupted gear comes from the reward bags of timed dungeons, where the tier pauses.

#### Scenario: Heroic and corrupted versions remain separate
- **WHEN** An item offers both Heroic and corrupted versions.
- **THEN** The Heroic version does not combine with the corrupted version.

### Requirement: Heroic comparison covers all eligible published items

The Heroic Tier item comparison SHALL offer every published item whose item page has an eligible Heroic version, including weapons, armor, and eligible trinkets, rather than a fixed example list.

#### Scenario: Heroic comparison covers all eligible published items
- **WHEN** Published weapons, armor, and trinkets have eligible Heroic versions on their item pages.
- **THEN** Every such item is offered in the Heroic Tier item comparison.

### Requirement: Heroic comparison sorts item choices

The Heroic Tier item comparison SHALL sort choices by slot and name.

#### Scenario: Heroic comparison sorts item choices
- **WHEN** The Heroic Tier item comparison presents choices across multiple slots and names.
- **THEN** The choices are sorted by slot and name.

### Requirement: Searchable item control label placement

The Heroic Tier item comparison's searchable item control SHALL keep its label immediately above it.

#### Scenario: Searchable item control label placement
- **WHEN** The Heroic Tier item comparison displays its searchable item control.
- **THEN** The control's label is immediately above it.

### Requirement: Searchable item control displays item identity

The Heroic Tier item comparison's searchable item control SHALL display item icons and rarity colors in both its results and closed selection.

#### Scenario: Searchable item control displays item identity
- **WHEN** A reader views search results and then closes the control with an item selected.
- **THEN** Both the results and the closed selection display item icons and rarity colors.

### Requirement: Searchable item control filters by name

The Heroic Tier item comparison's searchable item control SHALL filter by typed name.

#### Scenario: Searchable item control filters by name
- **WHEN** A reader types part of an item's name into the Heroic Tier comparison's item control.
- **THEN** The control filters choices by the typed name.

### Requirement: Searchable item control supports keyboard selection

The Heroic Tier item comparison's searchable item control SHALL support keyboard selection without automatically highlighting the selected name.

#### Scenario: Searchable item control supports keyboard selection
- **WHEN** A reader selects an item using the keyboard in the Heroic Tier comparison's item control.
- **THEN** The item is selected without automatically highlighting the selected name.

### Requirement: Corruption comparison reuses the searchable control

The Corruption item comparison SHALL use the same searchable control as the Heroic Tier item comparison for every item it offers.

#### Scenario: Corruption comparison reuses the searchable control
- **WHEN** A reader chooses an item offered by the Corruption item comparison.
- **THEN** The comparison uses the same searchable control as the Heroic Tier item comparison.

### Requirement: Selected item explanation states Heroic drop eligibility

The selected item's explanation SHALL independently state that creature drops can be Heroic while the tier is live.

#### Scenario: Selected item explanation states Heroic drop eligibility
- **WHEN** A reader selects an item independently of the creature comparison.
- **THEN** The item's explanation independently states that creature drops can be Heroic while the tier is live.

### Requirement: Selected item explanation links drop sources

The selected item's explanation SHALL link the item's drop sources when present.

#### Scenario: Selected item explanation links drop sources
- **WHEN** A reader selects an item with known drop sources.
- **THEN** The selected item's explanation links the item's drop sources.

### Requirement: Selected item explanation avoids unrelated creature claims

The selected item's explanation SHALL NOT imply that the item drops from the creature selected in a separate comparison.

#### Scenario: Selected item explanation avoids unrelated creature claims
- **WHEN** A reader selects an item independently of the creature selected in a separate comparison.
- **THEN** The item's explanation does not imply that the item drops from that separately selected creature.

### Requirement: Wide-screen changes card alignment

On wide screens, the comparison's changes card SHALL align with and stretch to the same row height as the two item cards.

#### Scenario: Wide-screen changes card alignment
- **WHEN** A reader views an item comparison on a wide screen.
- **THEN** The changes card aligns with the two item cards and stretches to the same row height.

### Requirement: Phone changes card order

On phones, the comparison's changes card SHALL follow both item cards.

#### Scenario: Phone changes card order
- **WHEN** A reader views an item comparison on a phone.
- **THEN** The changes card follows both item cards.

### Requirement: Stat row backgrounds and dividers span the row

Table row backgrounds and dividers SHALL span stat names and values together.

#### Scenario: Stat row backgrounds and dividers span the row
- **WHEN** A comparison displays stat table rows.
- **THEN** Each row's background and divider span its stat name and value together.

### Requirement: Item metadata separator centering

Item metadata separators SHALL be centered between adjacent facts.

#### Scenario: Item metadata separator centering
- **WHEN** An item displays adjacent metadata facts separated by a separator.
- **THEN** The separator is centered between the adjacent facts.

### Requirement: Item metadata separators avoid wrapped line starts

Item metadata separators SHALL NOT start wrapped lines.

#### Scenario: Item metadata separators avoid wrapped line starts
- **WHEN** Item metadata wraps onto another line.
- **THEN** No wrapped line starts with a metadata separator.

### Requirement: Drop source links display loaded artwork

Drop source links SHALL show available artwork after it loads.

#### Scenario: Drop source links display loaded artwork
- **WHEN** Artwork for a drop source link finishes loading.
- **THEN** The drop source link shows the artwork.

### Requirement: Drop source links omit unavailable artwork frames

Drop source links SHALL NOT leave an empty frame when artwork is unavailable.

#### Scenario: Drop source links omit unavailable artwork frames
- **WHEN** A drop source link has no available artwork.
- **THEN** The link does not leave an empty artwork frame.
