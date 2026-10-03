## Purpose

Small catalogs offer an illustrated answer to what each entry is and why it matters, while retaining direct access to detailed comparisons.

## ADDED Requirements

### Requirement: Illustrated Small Catalogs

The Classes, Skills, Races, Factions, and Properties lists SHALL show linked tiles with published artwork when available, names, and two or three pertinent published facts for each entry. Mechanics SHALL show linked topic tiles with their descriptions without inventing artwork. The home page class and skill tiles SHALL share their visual system with these lists.

#### Scenario: Reading a Class Tile
- **WHEN** a reader opens Classes
- **THEN** each class shows its art, playstyle description, talent-tree count, and ability count and its whole tile opens the class page

#### Scenario: Browsing Skill Groups
- **WHEN** a reader opens Skills
- **THEN** skills appear under Crafting, Gathering, or Weapon headings using their published skill type, with relevant recipe, node, and highest-level facts where present

#### Scenario: Comparing Property Investments
- **WHEN** a reader opens Properties
- **THEN** price and income remain labeled and aligned for comparison across entries, with their published currencies and income intervals displayed where present

#### Scenario: Reading Other Small Catalogs
- **WHEN** a reader opens Races, Factions, or Mechanics
- **THEN** each entry remains linked and its facts or topic description reflect published data, including missing facts remaining unavailable rather than invented

### Requirement: Accessible Alternate Comparison

The small catalogs SHALL offer the existing sortable table as a reachable alternate view and SHALL keep all tiles and table rows reachable on a phone without document-level sideways scrolling.

#### Scenario: Switching to a Table
- **WHEN** a reader selects Table on a small catalog
- **THEN** the existing sortable table appears and a Gallery control returns to the illustrated view

#### Scenario: Phone Gallery
- **WHEN** a reader visits a small catalog at a phone viewport
- **THEN** its tiles fit within the page, retain readable names and facts, and remain individually activatable
