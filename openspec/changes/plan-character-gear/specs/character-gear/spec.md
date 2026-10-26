## Purpose

Let readers equip modified item instances in a planned character, inspect evidence-backed contributions and compare items neutrally while preserving unknown inputs.

## ADDED Requirements

### Requirement: Equipment uses verified placements and restrictions

The `/planner/` Gear view SHALL use the character and preview contract owned by `build-character-planner` / `character-planner`.

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

#### Scenario: Equipment uses verified placements and restrictions
- **WHEN** A reader uses the `/planner/` Gear view to preview character equipment.
- **THEN** The view uses the character and preview contract owned by `build-character-planner` / `character-planner`.

### Requirement: Equipment choices describe plan state

The `/planner/` Gear view SHALL label choices "Equipped in This Plan," not claim actual in-game equipment.

#### Scenario: Equipment choices describe plan state
- **WHEN** A reader views equipment choices in the `/planner/` Gear view.
- **THEN** The choices are labeled "Equipped in This Plan" and do not claim actual in-game equipment.

### Requirement: Equipment choices use verified physical placements

The `/planner/` Gear view SHALL offer only verified physical placements.

#### Scenario: Equipment choices use verified physical placements
- **WHEN** A reader views available equipment placements in the `/planner/` Gear view.
- **THEN** Only verified physical placements are offered.

### Requirement: Weapons have distinct physical placements

Weapons SHALL have main-hand, off-hand and ranged placements.

#### Scenario: Weapons have distinct physical placements
- **WHEN** A reader views weapon placements in the planner.
- **THEN** Main-hand, off-hand and ranged placements are available.

### Requirement: Two-handed main removes off hand

A two-handed main SHALL remove off hand.

#### Scenario: Two-handed main removes off hand
- **WHEN** A reader equips a two-handed weapon in main hand while off hand is occupied.
- **THEN** The off-hand item is removed.

### Requirement: Off-hand selection removes two-handed main

An off-hand selection SHALL remove a two-handed main.

#### Scenario: Off-hand selection removes two-handed main
- **WHEN** A reader selects an off-hand item while a two-handed main is equipped.
- **THEN** The two-handed main is removed.

### Requirement: Ranged equipment remains independent of melee

A ranged change SHALL change only ranged. Ranged SHALL remain equipped when melee changes.

#### Scenario: Ranged equipment remains independent of melee
- **WHEN** A reader changes ranged equipment with melee equipped, then changes melee equipment.
- **THEN** The ranged change affects only ranged, and the ranged item remains equipped through the melee change.

### Requirement: Weapon placements reject incompatible items

Off-hand-only items SHALL not fit main. Two-handed items SHALL not fit off. Ranged SHALL accept only ranged items.

#### Scenario: Weapon placements reject incompatible items
- **WHEN** A reader attempts to place an off-hand-only item in main, a two-handed item in off, and a non-ranged item in ranged.
- **THEN** Each incompatible placement is rejected.

### Requirement: Ring and trinket placements require configured evidence

Ring and trinket placements SHALL be offered only after configured physical identities and acceptance are verified, never inferred from item categories or alias labels.

#### Scenario: Ring and trinket placements require configured evidence
- **WHEN** Ring and trinket item categories or alias labels exist but configured physical identities and acceptance are unverified.
- **THEN** Ring and trinket placements are not offered based on those categories or labels.

### Requirement: Equipment planning excludes cosmetics and consumables

Cosmetic armor and consumables SHALL be excluded from equipment planning.

#### Scenario: Equipment planning excludes cosmetics and consumables
- **WHEN** A reader browses equipment-planning choices where cosmetic armor and consumables exist.
- **THEN** Cosmetic armor and consumables are excluded from equipment planning.

### Requirement: Planner enforces verified equipment restrictions

The planner SHALL enforce verified level, placement and weapon-class restrictions.

#### Scenario: Planner enforces verified equipment restrictions
- **WHEN** A reader selects equipment that fails a verified level, placement or weapon-class restriction.
- **THEN** The planner enforces the failed restriction.

### Requirement: Class alone does not restrict ordinary non-weapon gear

Class selection alone SHALL not restrict ordinary armor, jewelry or trinkets.

#### Scenario: Class alone does not restrict ordinary non-weapon gear
- **WHEN** A reader changes class selection while viewing ordinary armor, jewelry and trinkets.
- **THEN** Class selection alone does not restrict those choices.

### Requirement: Missing equipment evidence is Not Verified

Missing evidence SHALL be shown as Not Verified, not permission.

#### Scenario: Missing equipment evidence is Not Verified
- **WHEN** A necessary equipment rule lacks evidence.
- **THEN** The missing evidence is shown as Not Verified rather than permission.

### Requirement: Blocked and unverified choices remain inspectable

A blocked or unverified choice SHALL remain inspectable with its reason and SHALL not count as verified equipped gear.

#### Scenario: Blocked and unverified choices remain inspectable
- **WHEN** A reader inspects a blocked or unverified equipment choice.
- **THEN** The choice remains inspectable with its reason and does not count as verified equipped gear.
### Requirement: A placement picker reuses item browsing

A picker SHALL target one physical placement, reuse the item list's filters and source information, and make unusable items findable with reasons. Browsing, filtering, inspecting and comparing SHALL not equip or replace anything. An explicit equip action SHALL resolve physical-target ambiguity and disclose displacement before applying the edit.

#### Scenario: Browsing a candidate
- **WHEN** a reader opens a placement picker, changes filters and inspects an item and its sources
- **THEN** the character's equipment is unchanged until an explicit equip action

#### Scenario: Non-weapon eligibility
- **WHEN** ordinary armor, jewelry or a trinket fits the chosen verified placement and satisfies its other requirements
- **THEN** class choice alone does not block it

### Requirement: Equipped items carry independent instance modifications

Each placement SHALL retain the item identity, a Heroic flag, a separate corruption level, entered random-stat values, gems indexed by socket and one enchantment with its tier.

#### Scenario: Heroic and corruption are separate
- **WHEN** a supported item instance is Heroic and has a known corruption level
- **THEN** both fields survive editing and sharing independently, and their contributions use verified combination arithmetic

#### Scenario: Missing random value
- **WHEN** a selected item has a possible random contribution with no entered or verified imported value
- **THEN** the contribution remains unknown and affected results are Incomplete

#### Scenario: Socket and enchantment replacement
- **WHEN** a reader selects a gem for a socket or replaces the enchantment
- **THEN** the gem is checked against that socket's verified colour rule and the instance retains no more than one enchantment

#### Scenario: Equipped items carry independent instance modifications
- **WHEN** A reader edits a placement containing an item with Heroic, corruption, entered random-stat values, socketed gems and a tiered enchantment.
- **THEN** The placement retains the item identity, Heroic flag, separate corruption level, entered random-stat values, gems indexed by socket and one enchantment with its tier.

### Requirement: Heroic and corruption are not exclusive variants

Heroic and corruption SHALL not be an exclusive variant selector.

#### Scenario: Heroic and corruption are not exclusive variants
- **WHEN** A reader configures an item instance as Heroic with a corruption level.
- **THEN** Heroic and corruption are represented independently rather than as mutually exclusive variants.

### Requirement: Modification eligibility requires verified evidence

Available modifications and combinations SHALL use verified eligibility. Uncertain eligibility SHALL be Not Verified rather than silently accepted.

#### Scenario: Modification eligibility requires verified evidence
- **WHEN** A reader views modifications and combinations with verified and uncertain eligibility.
- **THEN** Available modifications and combinations use verified eligibility, and uncertain eligibility is Not Verified rather than silently accepted.

### Requirement: Random values follow authored validation rules

Random values SHALL be validated against their authored identity, range, numeric mode and verified rounding/count rules.

#### Scenario: Random values follow authored validation rules
- **WHEN** A reader enters a random-stat value for an item instance.
- **THEN** The value is validated against its authored identity, range, numeric mode and verified rounding/count rules.

### Requirement: Zero random-stat maximum means uncapped

A zero authored random-stat maximum SHALL mean uncapped, not no rolls.

#### Scenario: Zero random-stat maximum means uncapped
- **WHEN** An item's authored random-stat maximum is zero.
- **THEN** The maximum is treated as uncapped rather than as allowing no rolls.

### Requirement: Unentered instance values remain unknown

Unentered instance values SHALL stay unknown, not become a minimum, mean or zero.

#### Scenario: Unentered instance values remain unknown
- **WHEN** A selected item has an instance value that has not been entered.
- **THEN** The value remains unknown rather than becoming a minimum, mean or zero.

### Requirement: Gems use verified socket and colour rules

Gems SHALL obey the verified colour-fit matrix and socket identity, without assuming White is universal or inventing hybrid rules.

#### Scenario: Gems use verified socket and colour rules
- **WHEN** A reader selects a gem for an identified socket, including a White or hybrid gem candidate.
- **THEN** The gem is checked against the verified colour-fit matrix and socket identity without assuming White is universal or inventing hybrid rules.

### Requirement: Enchantments satisfy every eligibility condition

Enchantment eligibility SHALL satisfy every listed condition.

#### Scenario: Enchantments satisfy every eligibility condition
- **WHEN** A reader selects an enchantment with multiple listed eligibility conditions.
- **THEN** Eligibility requires satisfaction of every listed condition.

### Requirement: Enchantment replacement does not stack

Enchantment replacement SHALL replace the single enchantment rather than stack it.

#### Scenario: Enchantment replacement does not stack
- **WHEN** A reader replaces an item's existing enchantment.
- **THEN** The new enchantment replaces the existing enchantment rather than stacking with it.

### Requirement: Unresolved modifications remain visibly uncertain

Unsupported or unresolved modifications SHALL remain visible with their uncertainty instead of becoming normal/unmodified gear.

#### Scenario: Unresolved modifications remain visibly uncertain
- **WHEN** An equipped item has an unsupported or unresolved modification.
- **THEN** The modification remains visible with its uncertainty instead of the item becoming normal/unmodified gear.

### Requirement: Set progress counts distinct pieces

Set progress SHALL count each distinct equipped member item identity once, not physical copies. It SHALL show all published thresholds, every active threshold and the next unmet threshold beside gear selection. Thresholds SHALL activate at at least the required number of distinct pieces, cumulatively retaining lower bonuses. Unknown equipment legality SHALL keep affected progress unverified rather than imply a complete bonus.

#### Scenario: Duplicate set member
- **WHEN** the same set-member template appears in two legal placements
- **THEN** it counts once toward the set and does not activate an extra threshold

#### Scenario: Higher threshold reached
- **WHEN** the verified distinct-piece count reaches a higher set threshold
- **THEN** that threshold and every lower threshold remain active and the next unmet threshold is identified if one exists

### Requirement: Stats show sourced contributions and incomplete results

Stat disclosures SHALL identify base race/class/level, item fixed and entered random values, Heroic/corruption modifiers, gems, enchantments, sets and selected talent contributions separately.

#### Scenario: Base formula missing
- **WHEN** item contributions are known but the character's base-stat provider or growth remains unknown
- **THEN** the base and affected overall total say Incomplete while known gear contributions remain inspectable

#### Scenario: Flat and percentage sources
- **WHEN** every relevant stat input and its formula is verified
- **THEN** the disclosure shows flats, additive percentage accumulation, their application order and any bound applied

#### Scenario: Unverified derived contribution
- **WHEN** a displayed stat depends on an unresolved linked stat or a selected item's unknown roll
- **THEN** the affected total is Incomplete and names the missing input rather than using zero

#### Scenario: Stats show sourced contributions and incomplete results
- **WHEN** A stat disclosure includes base stats, item values, modifiers, gems, enchantments, sets and selected talent contributions.
- **THEN** The disclosure identifies base race/class/level, item fixed and entered random values, Heroic/corruption modifiers, gems, enchantments, sets and selected talent contributions separately.

### Requirement: Verified stat contribution calculation

Verified flat contributions SHALL add. Percentage contributions SHALL accumulate additively and apply after flats. Verified bounds SHALL clamp the result.

#### Scenario: Verified stat contribution calculation
- **WHEN** A stat has verified flat contributions, percentage contributions and a verified bound that the calculated result exceeds.
- **THEN** The flat contributions add, the percentages accumulate additively and apply after flats, and the verified bound clamps the result.

### Requirement: Complete totals require verified dependencies

Complete totals SHALL require all relevant inputs, equip legality, derived links, stacking/order and formulas to be verified.

#### Scenario: Complete totals require verified dependencies
- **WHEN** All relevant inputs, equip legality, derived links and formulas are verified, but stacking/order is not verified.
- **THEN** The total is not Complete.

### Requirement: Base stats await provider and growth research

Base stats SHALL remain Incomplete until the race/class/provider and level-growth formula is researched.

#### Scenario: Base stats await provider and growth research
- **WHEN** The race/class/provider is researched but the level-growth formula is not.
- **THEN** Base stats remain Incomplete.

### Requirement: Absent race data is not zero

Absent race data SHALL not mean zero.

#### Scenario: Absent race data is not zero
- **WHEN** Race data needed for a base stat is absent.
- **THEN** The absent race data is not treated as zero.

### Requirement: Conflicting Druid lists are not resolved by label

Conflicting Druid lists SHALL not be selected or summed by label.

#### Scenario: Conflicting Druid lists are not resolved by label
- **WHEN** Conflicting Druid lists share a label.
- **THEN** The conflicting lists are neither selected nor summed by label.

### Requirement: Unknown inputs preserve known source rows

Unknown rolls, formulas, derived stats or modification inputs SHALL mark affected results Incomplete while preserving known source rows.

#### Scenario: Unknown inputs preserve known source rows
- **WHEN** A result has known source rows and an unknown modification input.
- **THEN** The affected result is Incomplete and its known source rows remain visible.

### Requirement: Blocked gear is not verified equipment

Blocked gear SHALL not contribute as verified equipment.

#### Scenario: Blocked gear is not verified equipment
- **WHEN** A gear choice is blocked.
- **THEN** The blocked gear does not contribute as verified equipment.

### Requirement: Static totals disclose temporary effects and forms

Temporary effects or shifted forms SHALL not be silently included in a static planned total.

#### Scenario: Static totals disclose temporary effects and forms
- **WHEN** A static planned total includes a temporary effect or shifted form.
- **THEN** The temporary effect or shifted form is not silently included.

### Requirement: Uncaptured values are not zero

No uncaptured value SHALL count as zero.

#### Scenario: Uncaptured values are not zero
- **WHEN** A value needed for a stat calculation has not been captured.
- **THEN** The uncaptured value does not count as zero.
### Requirement: Two-item comparison stays neutral

Comparison SHALL accept two different item instances, match rows by stable stat identity and flat/percentage mode rather than array position, and retain one-sided and unknown values explicitly.

#### Scenario: Different stat order
- **WHEN** two items list the same stats in different orders and each has a stat absent from the other
- **THEN** matching identities align, one-sided stats remain visible, and row order does not create false differences

#### Scenario: Unknown comparison value
- **WHEN** either instance lacks a needed roll or modifier
- **THEN** its affected value or difference is Incomplete rather than a numeric zero or a preferred-item verdict

#### Scenario: Two-item comparison stays neutral
- **WHEN** Two different item instances have reordered stat rows, flat and percentage modes, a one-sided stat and an unknown value.
- **THEN** Comparison accepts the instances, matches rows by stable stat identity and flat/percentage mode rather than position, and explicitly retains the one-sided stat and unknown value.

### Requirement: Comparison uses verified instance contributions

Comparison SHALL compare verified instance contributions, not substitute template values for rolls, gems or enchantments.

#### Scenario: Comparison uses verified instance contributions
- **WHEN** Compared instances have verified roll, gem and enchantment contributions that differ from template values.
- **THEN** Comparison uses the verified instance contributions rather than substituting template values.

### Requirement: Comparison differences remain neutral

Differences SHALL be neutral. Larger numbers SHALL not be styled or described as better.

#### Scenario: Comparison differences remain neutral
- **WHEN** One compared instance has a larger numeric contribution than the other.
- **THEN** The difference is neutral and the larger number is neither styled nor described as better.

### Requirement: Comparison excludes equipment actions and advice

Comparison SHALL not equip gear or provide best-in-slot, ranking, recommendations, simulated outcomes or a party/build score.

#### Scenario: Comparison excludes equipment actions and advice
- **WHEN** Two item instances are compared.
- **THEN** Comparison does not equip gear or provide best-in-slot, ranking, recommendations, simulated outcomes or a party/build score.
### Requirement: Gear belongs to the character and its build link

Gear SHALL belong to each named character's single build under `build-character-planner` / `character-planner`, travelling in its `/planner/#build=v1.<payload>` link and all-character export using that foundation's validated instance fields.

#### Scenario: Modified gear link round trip
- **WHEN** a reader opens a valid link containing supported modified gear in another browser on the same catalog
- **THEN** every instance field returns in a preview and no saved character is created or changed

#### Scenario: Missing catalog item
- **WHEN** the current publication cannot resolve a link's gear reference
- **THEN** the unresolved choice remains visible and the reader is warned before a revised link omits it

#### Scenario: Switch named characters
- **WHEN** the header switches the active character
- **THEN** the Gear view shows that character's gear without editing either character or adopting a preview

#### Scenario: Gear belongs to the character and its build link
- **WHEN** A named character's build with gear is shared through its build link and included in an all-character export.
- **THEN** The character's gear travels with its single build in both outputs using the foundation's validated instance fields.

### Requirement: Gear round trips preserve instance details

Round trips SHALL preserve physical placement, item, independent Heroic/corruption, entered random values, socket gems and enchantment.

#### Scenario: Gear round trips preserve instance details
- **WHEN** Gear with physical placement, an item, independent Heroic/corruption, entered random values, socket gems and enchantment completes a round trip.
- **THEN** Physical placement, item, independent Heroic/corruption, entered random values, socket gems and enchantment are preserved.

### Requirement: Gear does not create another character store

Gear SHALL not create a second character store.

#### Scenario: Gear does not create another character store
- **WHEN** Gear is saved for a named character.
- **THEN** Gear does not create a second character store.

### Requirement: Gear preserves talent purchase order

Gear SHALL not replace talent purchase order.

#### Scenario: Gear preserves talent purchase order
- **WHEN** Gear is added to a build with an existing talent purchase order.
- **THEN** The talent purchase order is not replaced by gear.

### Requirement: Heroic Essence purchases remain without assigned levels

Gear SHALL not assign Heroic Essence purchases a level.

#### Scenario: Heroic Essence purchases remain without assigned levels
- **WHEN** A build containing Heroic Essence purchases receives gear.
- **THEN** Gear does not assign a level to the Heroic Essence purchases.

### Requirement: Earliest talent timing is not historical gear

Gear SHALL not reinterpret "Earliest With Base Talent Points" as historical gear at a level.

#### Scenario: Earliest talent timing is not historical gear
- **WHEN** "Earliest With Base Talent Points" is shown for a build containing gear.
- **THEN** The label is not reinterpreted as historical gear at a level.

### Requirement: Build links open without storage writes

A link SHALL open as a preview without writing storage.

#### Scenario: Build links open without storage writes
- **WHEN** A build link is opened.
- **THEN** The link opens as a preview without writing storage.

### Requirement: Preview adoption uses foundation actions

Adoption SHALL use "Save as New Character" or "Replace (name)'s Build" and the foundation's Undo/persistence behavior.

#### Scenario: Preview adoption uses foundation actions
- **WHEN** A reader adopts a build preview.
- **THEN** Adoption uses "Save as New Character" or "Replace (name)'s Build" and the foundation's Undo/persistence behavior.

### Requirement: Character switching does not edit builds

Switching characters SHALL edit nothing.

#### Scenario: Character switching does not edit builds
- **WHEN** The active character is switched.
- **THEN** Switching characters edits nothing.

### Requirement: Unresolved catalog references remain in migration reports

Missing or newly blocked catalog references SHALL remain visible in the migration report.

#### Scenario: Unresolved catalog references remain in migration reports
- **WHEN** A build contains a missing catalog reference and a newly blocked catalog reference.
- **THEN** Both references remain visible in the migration report.

### Requirement: Revised shared links warn before omitting references

Omission of missing or newly blocked catalog references from a revised shared link SHALL require a warning.

#### Scenario: Revised shared links warn before omitting references
- **WHEN** A revised shared link would omit a missing or newly blocked catalog reference.
- **THEN** A warning is required before the reference is omitted.
### Requirement: Heroic Tier uses the verified gear-score rule

The Heroic Tier page SHALL show the active character's gear score when every relevant placement and instance input is known and verified, using the verified game rule: equipped flat contributions and each weapon's average base damage, excluding percentage contributions.

#### Scenario: Complete scoring inputs
- **WHEN** the active character has complete verified scoring inputs
- **THEN** Heroic Tier shows the verified gear score without including percentage contributions or labelling it a recommendation

#### Scenario: Missing scoring input
- **WHEN** an equipped item's roll or modification inclusion cannot be determined
- **THEN** Heroic Tier shows “Gear Score Not Available,” even if other contributions are known

#### Scenario: Heroic Tier uses the verified gear-score rule
- **WHEN** Every relevant placement and instance input for the active character is known and verified.
- **THEN** Heroic Tier shows the active character's gear score using equipped flat contributions and each weapon's average base damage, excluding percentage contributions.

### Requirement: Gear score requires verified source inclusion

Modification/source inclusion SHALL be verified before contributing to gear score.

#### Scenario: Gear score requires verified source inclusion
- **WHEN** A modification or source has not had its inclusion in gear score verified.
- **THEN** The modification or source does not contribute to gear score.

### Requirement: Gear score is not replaced by other metrics

Gear score SHALL not be substituted with Item Power or adventurer gear-preference scoring.

#### Scenario: Gear score is not replaced by other metrics
- **WHEN** Item Power and adventurer gear-preference scoring are available for the active character's equipment.
- **THEN** Neither metric is substituted for gear score.

### Requirement: Missing gear-score inputs show unavailability

Missing inputs SHALL produce "Gear Score Not Available."

#### Scenario: Missing gear-score inputs show unavailability
- **WHEN** An input needed for gear score is missing.
- **THEN** Heroic Tier shows "Gear Score Not Available."

### Requirement: Shared previews do not change active gear score

A shared preview SHALL not change the Heroic Tier page's active-character result before explicit adoption.

#### Scenario: Shared previews do not change active gear score
- **WHEN** A shared build preview is opened without explicit adoption.
- **THEN** The Heroic Tier page's active-character result does not change.
### Requirement: Item pages hand off only on explicit action

Item reference pages SHALL remain prerendered and readable without character context.

#### Scenario: Compare after hydration
- **WHEN** a reader activates “Compare With (name)'s (slot)”
- **THEN** only the needed published lookup and referenced item data load, a contained neutral comparison opens, and the character is unchanged

#### Scenario: Character changes during action
- **WHEN** the target character or its revision changes while an action is resolving
- **THEN** the stale result does not equip or overwrite the new target and focus remains stable

#### Scenario: No active character
- **WHEN** an item page opens without an active character
- **THEN** its reference content stays readable and a contextual setup/preview action is available without a directory fetch or storage write

#### Scenario: Item pages hand off only on explicit action
- **WHEN** A reader opens an item reference page without character context.
- **THEN** The page is prerendered and its reference content is readable.

### Requirement: Active character item actions

After mount, item reference pages SHALL offer "Equip on (name)" and "Compare With (name)'s (slot)" for the active character.

#### Scenario: Active character item actions
- **WHEN** An item reference page mounts with an active character.
- **THEN** The page offers "Equip on (name)" and "Compare With (name)'s (slot)" for that character.

### Requirement: Item action data loading

Item reference pages SHALL reuse the current page's item document and load the published item directory and comparison/equipment data only when used. Item reference pages SHALL not load the full search index for these actions.

#### Scenario: Item action data loading
- **WHEN** A reader uses an item page's Equip action.
- **THEN** The action reuses the current page's item document, loads the published item directory and equipment data only when used, and does not load the full search index.

### Requirement: Equip target validation

Equip SHALL check the explicit target, instance state and verified restrictions.

#### Scenario: Equip target validation
- **WHEN** A reader activates Equip for an explicit target.
- **THEN** Equip checks the explicit target, instance state and verified restrictions.

### Requirement: Ambiguous equipment placement

Ambiguous hands, rings or trinkets SHALL ask for a placement rather than guess.

#### Scenario: Ambiguous equipment placement
- **WHEN** A reader equips an item with an ambiguous ring placement.
- **THEN** The action asks for a placement rather than guessing.

### Requirement: Comparison leaves characters unchanged

Compare SHALL never mutate the character.

#### Scenario: Comparison leaves characters unchanged
- **WHEN** A reader compares an item with a character's equipment.
- **THEN** The comparison does not mutate the character.

### Requirement: Async item action target stability

An async action SHALL not apply to a different character or stale revision after switching.

#### Scenario: Async item action target stability
- **WHEN** The active character switches while an async item action is resolving.
- **THEN** The action does not apply to a different character or stale revision.

### Requirement: Item navigation without an active character

Without an active character, item reference pages SHALL offer contextual setup/preview navigation without creating a character or downloading comparison data.

#### Scenario: Item navigation without an active character
- **WHEN** A reader views an item reference page without an active character.
- **THEN** Contextual setup/preview navigation is offered without creating a character or downloading comparison data.

### Requirement: Empty comparison placement reporting

An empty comparison placement SHALL be reported as empty, not zero stats.

#### Scenario: Empty comparison placement reporting
- **WHEN** A reader compares an item against an empty placement.
- **THEN** The placement is reported as empty, not zero stats.

### Requirement: Context updates preserve page stability

Context readiness and updates SHALL preserve focus and stable page layout.

#### Scenario: Context updates preserve page stability
- **WHEN** Character context becomes ready or updates on an item reference page.
- **THEN** Focus and stable page layout are preserved.
### Requirement: Gear layout remains usable on phone and desktop

Labeled slots, picker, modifications, set progress and disclosures SHALL remain inside the planner's established visual system and support editing at every width. At 1440, 1100 and 390 CSS pixels they SHALL not cause horizontal document overflow. Opening disclosures and choosing slots SHALL preserve focus and avoid sudden shifts; comparison and item details SHALL appear only on deliberate interaction.

#### Scenario: Edit gear on a phone
- **WHEN** a reader selects a placement and edits its instance at 390 CSS pixels
- **THEN** the picker and controls remain readable and operable without sideways document scrolling
