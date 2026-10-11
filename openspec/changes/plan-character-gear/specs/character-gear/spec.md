## Purpose

Let readers equip modified item instances in a planned character, inspect evidence-backed contributions and compare items neutrally while preserving unknown inputs.

## ADDED Requirements

### Requirement: Equipment uses verified placements and restrictions

The `/planner/` Gear view SHALL use the character and preview contract owned by `build-character-planner` / `character-planner`. It SHALL label choices “Equipped in This Plan,” not claim actual in-game equipment, and offer only verified physical placements. Weapons SHALL have main-hand, off-hand and ranged placements: a two-handed main removes off hand; an off-hand selection removes a two-handed main; ranged changes only ranged and remains equipped when melee changes. Off-hand-only items SHALL not fit main, two-handed items SHALL not fit off, and ranged SHALL accept only ranged items. Ring and trinket placements SHALL be offered only after configured physical identities and acceptance are verified, never inferred from item categories or alias labels. Cosmetic armor and consumables SHALL be excluded from equipment planning.

The planner SHALL enforce verified level, placement and weapon-class restrictions. Class selection alone SHALL not restrict ordinary armor, jewelry or trinkets. Missing evidence SHALL be shown as Not Verified, not permission. A blocked or unverified choice SHALL remain inspectable with its reason and SHALL not count as verified equipped gear.

#### Scenario: Melee displacement preserves ranged
- **WHEN** a reader explicitly equips a two-handed weapon in main hand while off hand and ranged are occupied
- **THEN** main is replaced, off hand is removed, ranged remains, and the reversible edit identifies the displaced item

#### Scenario: Off hand replaces a two-handed main
- **WHEN** a reader explicitly equips a valid off-hand item with a two-handed main equipped
- **THEN** off hand is replaced and main is removed without changing ranged

#### Scenario: Unverified duplicate placements
- **WHEN** ring or trinket categories are published but their configured physical placements are not verified
- **THEN** the planner does not invent additional placements from category names or serialized list lengths

#### Scenario: Unusable item remains inspectable
- **WHEN** an item fails a verified class, level or placement requirement, or a necessary rule is unknown
- **THEN** it stays findable with the failed requirement or Not Verified explanation and is not counted as verified equipped gear

### Requirement: A placement picker reuses item browsing

A picker SHALL target one physical placement, reuse the item list's filters and source information, and make unusable items findable with reasons. Browsing, filtering, inspecting and comparing SHALL not equip or replace anything. An explicit equip action SHALL resolve physical-target ambiguity and disclose displacement before applying the edit.

#### Scenario: Browsing a candidate
- **WHEN** a reader opens a placement picker, changes filters and inspects an item and its sources
- **THEN** the character's equipment is unchanged until an explicit equip action

#### Scenario: Non-weapon eligibility
- **WHEN** ordinary armor, jewelry or a trinket fits the chosen verified placement and satisfies its other requirements
- **THEN** class choice alone does not block it

### Requirement: Equipped items carry independent instance modifications

Each placement SHALL retain the item identity, a Heroic flag, a separate corruption level, entered random-stat values, gems indexed by socket and one enchantment with its tier. Heroic and corruption SHALL not be an exclusive variant selector. Available modifications and combinations SHALL use verified eligibility; uncertain eligibility SHALL be Not Verified rather than silently accepted. Random values SHALL be validated against their authored identity, range, numeric mode and verified rounding/count rules; a zero authored random-stat maximum SHALL mean uncapped, not no rolls. Unentered instance values SHALL stay unknown, not become a minimum, mean or zero.

Gems SHALL obey the verified colour-fit matrix and socket identity, without assuming White is universal or inventing hybrid rules. Enchantment eligibility SHALL satisfy every listed condition, and replacement SHALL replace the single enchantment rather than stack it. Unsupported or unresolved modifications SHALL remain visible with their uncertainty instead of becoming normal/unmodified gear.

#### Scenario: Heroic and corruption are separate
- **WHEN** a supported item instance is Heroic and has a known corruption level
- **THEN** both fields survive editing and sharing independently, and their contributions use verified combination arithmetic

#### Scenario: Missing random value
- **WHEN** a selected item has a possible random contribution with no entered or verified imported value
- **THEN** the contribution remains unknown and affected results are Incomplete

#### Scenario: Socket and enchantment replacement
- **WHEN** a reader selects a gem for a socket or replaces the enchantment
- **THEN** the gem is checked against that socket's verified colour rule and the instance retains no more than one enchantment

### Requirement: Set progress counts distinct pieces

Set progress SHALL count each distinct equipped member item identity once, not physical copies. It SHALL show all published thresholds, every active threshold and the next unmet threshold beside gear selection. Thresholds SHALL activate at at least the required number of distinct pieces, cumulatively retaining lower bonuses. Unknown equipment legality SHALL keep affected progress unverified rather than imply a complete bonus.

#### Scenario: Duplicate set member
- **WHEN** the same set-member template appears in two legal placements
- **THEN** it counts once toward the set and does not activate an extra threshold

#### Scenario: Higher threshold reached
- **WHEN** the verified distinct-piece count reaches a higher set threshold
- **THEN** that threshold and every lower threshold remain active and the next unmet threshold is identified if one exists

### Requirement: Stats show sourced contributions and incomplete results

Stat disclosures SHALL identify base race/class/level, item fixed and entered random values, Heroic/corruption modifiers, gems, enchantments, sets and selected talent contributions separately. Verified flat contributions SHALL add; percentage contributions SHALL accumulate additively and apply after flats; verified bounds SHALL clamp the result. Complete totals SHALL require all relevant inputs, equip legality, derived links, stacking/order and formulas to be verified. Base stats SHALL remain Incomplete until the race/class/provider and level-growth formula is researched; absent race data SHALL not mean zero, and conflicting Druid lists SHALL not be selected or summed by label.

Unknown rolls, formulas, derived stats or modification inputs SHALL mark affected results Incomplete while preserving known source rows. Blocked gear SHALL not contribute as verified equipment. Temporary effects or shifted forms SHALL not be silently included in a static planned total. No uncaptured value SHALL count as zero.

#### Scenario: Base formula missing
- **WHEN** item contributions are known but the character's base-stat provider or growth remains unknown
- **THEN** the base and affected overall total say Incomplete while known gear contributions remain inspectable

#### Scenario: Flat and percentage sources
- **WHEN** every relevant stat input and its formula is verified
- **THEN** the disclosure shows flats, additive percentage accumulation, their application order and any bound applied

#### Scenario: Unverified derived contribution
- **WHEN** a displayed stat depends on an unresolved linked stat or a selected item's unknown roll
- **THEN** the affected total is Incomplete and names the missing input rather than using zero

### Requirement: Two-item comparison stays neutral

Comparison SHALL accept two different item instances, match rows by stable stat identity and flat/percentage mode rather than array position, and retain one-sided and unknown values explicitly. It SHALL compare verified instance contributions, not substitute template values for rolls, gems or enchantments. Differences SHALL be neutral: larger numbers SHALL not be styled or described as better. Comparison SHALL not equip gear or provide best-in-slot, ranking, recommendations, simulated outcomes or a party/build score.

#### Scenario: Different stat order
- **WHEN** two items list the same stats in different orders and each has a stat absent from the other
- **THEN** matching identities align, one-sided stats remain visible, and row order does not create false differences

#### Scenario: Unknown comparison value
- **WHEN** either instance lacks a needed roll or modifier
- **THEN** its affected value or difference is Incomplete rather than a numeric zero or a preferred-item verdict

### Requirement: Gear belongs to the character and its build link

Gear SHALL belong to each named character's single build under `build-character-planner` / `character-planner`, travelling in its `/planner/#build=v1.<payload>` link and all-character export using that foundation's validated instance fields. Round trips SHALL preserve physical placement, item, independent Heroic/corruption, entered random values, socket gems and enchantment. Gear SHALL not create a second character store, replace talent purchase order, assign Heroic Essence purchases a level, or reinterpret “Earliest With Base Talent Points” as historical gear at a level.

A link SHALL open as a preview without writing storage. Adoption SHALL use “Save as New Character” or “Replace (name)'s Build” and the foundation's Undo/persistence behavior; switching characters SHALL edit nothing. Missing or newly blocked catalog references SHALL remain visible in the migration report, and omission from a revised shared link SHALL require a warning.

#### Scenario: Modified gear link round trip
- **WHEN** a reader opens a valid link containing supported modified gear in another browser on the same catalog
- **THEN** every instance field returns in a preview and no saved character is created or changed

#### Scenario: Missing catalog item
- **WHEN** the current publication cannot resolve a link's gear reference
- **THEN** the unresolved choice remains visible and the reader is warned before a revised link omits it

#### Scenario: Switch named characters
- **WHEN** the header switches the active character
- **THEN** the Gear view shows that character's gear without editing either character or adopting a preview

### Requirement: Heroic Tier uses the verified gear-score rule

The Heroic Tier page SHALL show the active character's gear score when every relevant placement and instance input is known and verified, using the verified game rule: equipped flat contributions and each weapon's average base damage, excluding percentage contributions. Modification/source inclusion SHALL be verified before contributing to this number. Gear score SHALL not be substituted with Item Power or adventurer gear-preference scoring. Missing inputs SHALL produce “Gear Score Not Available.” A shared preview SHALL not change this page's active-character result before explicit adoption.

#### Scenario: Complete scoring inputs
- **WHEN** the active character has complete verified scoring inputs
- **THEN** Heroic Tier shows the verified gear score without including percentage contributions or labelling it a recommendation

#### Scenario: Missing scoring input
- **WHEN** an equipped item's roll or modification inclusion cannot be determined
- **THEN** Heroic Tier shows “Gear Score Not Available,” even if other contributions are known

### Requirement: Item pages hand off only on explicit action

Item reference pages SHALL remain prerendered and readable without character context. After mount, they SHALL offer “Equip on (name)” and “Compare With (name)'s (slot)” for the active character. They SHALL reuse the current page's item document, load the published item directory and comparison/equipment data only when used, and SHALL not load the full search index for these actions. Equip SHALL check the explicit target, instance state and verified restrictions; ambiguous hands, rings or trinkets SHALL ask for a placement rather than guess. Compare SHALL never mutate the character. An async action SHALL not apply to a different character or stale revision after switching.

Without an active character, pages SHALL offer contextual setup/preview navigation without creating a character or downloading comparison data. An empty comparison placement SHALL be reported as empty, not zero stats. Context readiness and updates SHALL preserve focus and stable page layout.

#### Scenario: Compare after hydration
- **WHEN** a reader activates “Compare With (name)'s (slot)”
- **THEN** only the needed published lookup and referenced item data load, a contained neutral comparison opens, and the character is unchanged

#### Scenario: Character changes during action
- **WHEN** the target character or its revision changes while an action is resolving
- **THEN** the stale result does not equip or overwrite the new target and focus remains stable

#### Scenario: No active character
- **WHEN** an item page opens without an active character
- **THEN** its reference content stays readable and a contextual setup/preview action is available without a directory fetch or storage write

### Requirement: Gear layout remains usable on phone and desktop

Labeled slots, picker, modifications, set progress and disclosures SHALL remain inside the planner's established visual system and support editing at every width. At 1440, 1100 and 390 CSS pixels they SHALL not cause horizontal document overflow. Opening disclosures and choosing slots SHALL preserve focus and avoid sudden shifts; comparison and item details SHALL appear only on deliberate interaction.

#### Scenario: Edit gear on a phone
- **WHEN** a reader selects a placement and edits its instance at 390 CSS pixels
- **THEN** the picker and controls remain readable and operable without sideways document scrolling
