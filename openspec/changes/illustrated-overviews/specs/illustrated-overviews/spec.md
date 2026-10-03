## Purpose

Small catalogs offer an illustrated answer to what each entry is and why it matters, while retaining direct access to detailed comparisons.

## ADDED Requirements

### Requirement: Illustrated Small Catalogs

The Classes, Skills, Races, Factions, and Properties lists SHALL show linked tiles with published artwork when available, names, and two or three pertinent published facts for each entry. Mechanics SHALL show linked topic tiles with their descriptions without inventing artwork. The home page class and skill tiles SHALL share their visual system with these lists.

#### Scenario: Reading a Class Tile
- **WHEN** a reader opens Classes
- **THEN** each class shows its art, playstyle description, talent-tree count, and ability count and its whole tile opens the class page

#### Scenario: Aligning Class Choices
- **WHEN** classes with different-length descriptions share a row
- **THEN** their artwork and names begin at the same vertical position, their facts align at the bottom of the row, and hyphenated description words remain together

#### Scenario: Browsing Skill Groups
- **WHEN** a reader opens Skills
- **THEN** skills appear under Crafting, Gathering, or Weapon headings using their published skill type without repeating the group on each card; relevant recipe and node counts and the published maximum level appear as labeled facts where present

#### Scenario: Reading Tile Facts at Narrow Width
- **WHEN** a fact cannot fit beside another fact in an illustrated tile
- **THEN** each fact remains a readable unit without splitting a label or leaving a separator at the start of a line

#### Scenario: Comparing Property Investments
- **WHEN** a reader opens Properties
- **THEN** each property tile shows its published scene as a wide picture above its name and place, with purchase price and income in aligned columns, currency names and coin artwork, and the published income interval where present

#### Scenario: Reading Other Small Catalogs
- **WHEN** a reader opens Races, Factions, or Mechanics
- **THEN** race and faction portraits stay recognizable above their names, each published count includes its unit, and linked facts or topic descriptions reflect published data without inventing missing facts

#### Scenario: Finding Creature Loot
- **WHEN** a reader scans the Loot topic in the Mechanics index or menu
- **THEN** the description identifies creature drops as a source covered by the topic

### Requirement: Accessible Alternate Comparison

The small catalogs SHALL offer the existing sortable table as a reachable alternate view and SHALL keep all tiles and table rows reachable on a phone without document-level sideways scrolling.

#### Scenario: Switching to a Table
- **WHEN** a reader selects Table on a small catalog
- **THEN** the existing sortable table appears and a Gallery control returns to the illustrated view

#### Scenario: Phone Gallery
- **WHEN** a reader visits a small catalog at a phone viewport
- **THEN** its tiles fit within the page, retain readable names and facts, and remain individually activatable
