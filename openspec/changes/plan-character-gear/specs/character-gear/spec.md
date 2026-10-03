## Purpose

The gear phase adds equipment choices and understandable stat contributions to an existing planned character without claiming a complete result when game rules or item rolls are unknown.

## ADDED Requirements

### Requirement: Equipment choices use published slots and restrictions

The existing `/planner` SHALL offer reachable published items through labeled equipment slots in a separate gear area. Its gear choices SHALL be described as “Equipped in This Plan,” not as the reader's actual in-game gear. The planner SHALL check a slot, hand pairing, item level, and weapon-class restriction only where the published fact and native rule are verified. Non-weapon armor, jewelry and consumables SHALL not be restricted by class merely because a class is selected. A missing item fact SHALL leave that choice visible with an unverified explanation, and a violated verified rule SHALL leave it visible as blocked with the reason.

#### Scenario: Item has a known restriction
- **WHEN** a reader selects a weapon whose verified class, hand, slot, or level requirement their build fails
- **THEN** the item remains visible as blocked with the unmet restriction named, not counted as verified equipped gear

#### Scenario: Non-weapon item
- **WHEN** the reader selects armor or jewelry that has no other verified restriction
- **THEN** class choice alone does not block it

#### Scenario: Missing equip rule
- **WHEN** a planned item's hand interaction lacks enough evidence
- **THEN** the item stays visible and its equipment check is unverified rather than legal

### Requirement: Stats show sourced contributions and incomplete results

The planner SHALL show known class and level contributions, chosen item effects and applicable modifiers with readable source labels. It SHALL display a complete total only when all relevant inputs, equip rules, stacking, caps and formulas are verified. A missing roll, modifier, rule or input SHALL mark the affected stat “Incomplete” while preserving each known contribution. A verified blocked item SHALL not contribute to a complete total; an unverified item SHALL not silently contribute as if it were legal. No uncaptured value SHALL count as zero. All displayed game numbers SHALL come from accepted catalog facts or a verified rule.

#### Scenario: Item has an unknown modifier
- **WHEN** an item's full effect depends on a roll or modifier the compendium cannot determine
- **THEN** the stat disclosure still shows known contributions and the affected total says “Incomplete”

#### Scenario: Stat sources are inspectable
- **WHEN** every relevant contribution and formula is verified
- **THEN** the total's disclosure identifies the class/level contribution, each contributing item and modifier, and any verified cap

#### Scenario: Equipment cannot be verified
- **WHEN** an item's equip rule is unknown
- **THEN** its stat effects remain visible but the affected total does not claim to be complete

### Requirement: Gear joins the existing build link and remembered character

The gear phase SHALL use the existing canonical v1 link's `gear` pairs of published slot and item keys without changing the version or other payload fields. It SHALL restore gear choices from a link as a shared preview, check them against current publication data, and preserve missing or newly blocked choices in the migration report. Opening, editing, or copying a gear preview SHALL never silently replace the device-local active character. “Use as My Character” SHALL be the explicit action that adopts the visible build with its gear, preserving focus. Before sharing a revised URL that omits unmatched gear, the planner SHALL warn the reader. The existing talent-only links with `gear: []` SHALL still open unchanged.

#### Scenario: Share a gear choice
- **WHEN** a reader adds supported gear to a build, copies its link and opens it in another browser on the same catalog
- **THEN** each selected slot and item returns in the shared preview and the other browser's remembered character remains unchanged

#### Scenario: Old link has a missing item
- **WHEN** a link names an item absent from the current catalog
- **THEN** the missing gear choice remains listed and the reader is warned before a new link omits it

#### Scenario: Talent-only link remains valid
- **WHEN** a reader opens a valid v1 talent build with an empty gear array
- **THEN** its talent allocations and class/level remain available without equipment selection

### Requirement: Heroic Tier uses only a verified active-build gear score

The Heroic Tier page SHALL display a gear score only if the remembered character's equipped choices and the game's score rule supply a verified number. Otherwise it SHALL say “Gear Score Not Available,” even when the active character has selected gear. A shared gear preview SHALL not change the Heroic Tier result until explicitly adopted.

#### Scenario: Missing score evidence
- **WHEN** an item roll or score rule for the active build remains unknown
- **THEN** the Heroic Tier page says “Gear Score Not Available” rather than inferring a score from the item's name or level

### Requirement: Gear layout remains usable on phone and desktop

Equipment slots SHALL be labeled and stay inside the existing planner's visual system, with a compact grid/list and picker flowing beneath controls or in an accessible sheet on a phone. Stats SHALL be secondary to class, level and talents. Switching tabs, choosing a slot or item, and opening a stat disclosure SHALL preserve focus and avoid sudden page shifts. At 1440, 1100 and 390 CSS pixels the document and picker SHALL not overflow horizontally.

#### Scenario: Select an item on a phone
- **WHEN** a reader chooses an equipment slot and item at 390 CSS pixels
- **THEN** the picker and item effects remain readable and operable without sideways document scrolling
