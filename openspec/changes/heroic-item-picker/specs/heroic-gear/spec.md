## MODIFIED Requirements

### Requirement: Heroic Equipment Preview

A creature-drop path is eligible when the creature can drop the item while the Heroic tier is live: a world loot drop, a creature without a recorded place, or a creature with at least one place where the tier does not pause. The tier pauses in the places that the verified exclusion rule names and in every timed dungeon. An item with an eligible recorded creature-drop path SHALL offer a Heroic version among its gear options, and the options SHALL state the bonus. The preview SHALL preserve random-roll uncertainty rather than presenting one fictional saved roll. The tooltip of the Heroic version SHALL show the game's single `Heroic` tag line in the game's tag color above the stat lines, and its stat values SHALL include the bonus. An item with no eligible creature-drop path SHALL NOT offer a Heroic version. When creatures drop the item only in places where the tier pauses, its page SHALL say that it never drops as Heroic gear and name those places. A Heroic version SHALL NOT combine with a corrupted version, because corrupted gear comes from the reward bags of timed dungeons, where the tier pauses.

The Heroic Tier item comparison SHALL offer every published item whose item page has an eligible Heroic version, including weapons, armor, and eligible trinkets, rather than a fixed example list. It SHALL sort choices by slot and name. Its searchable item control SHALL keep its label immediately above it, display item icons and rarity colors in both its results and closed selection, filter by typed name, and support keyboard selection without automatically highlighting the selected name. The Corruption item comparison SHALL use the same searchable control for every item it offers. The selected item's explanation SHALL independently state that creature drops can be Heroic while the tier is live and link the item's drop sources when present. It SHALL NOT imply that the item drops from the creature selected in a separate comparison.

On wide screens, the comparison's changes card SHALL align with and stretch to the same row height as the two item cards. On phones, the changes card SHALL follow both item cards. Table row backgrounds and dividers SHALL span stat names and values together. Item metadata separators SHALL be centered between adjacent facts and SHALL NOT start wrapped lines. Drop source links SHALL show available artwork after it loads and SHALL NOT leave an empty frame when artwork is unavailable.

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
