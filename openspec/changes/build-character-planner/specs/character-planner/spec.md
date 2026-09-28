## Purpose

The planner lets readers assemble and share a character build from published game facts. It separates verified game rules from values that the reader supplies or that the compendium cannot check.

## ADDED Requirements

### Requirement: Class and level choices use published data

The planner SHALL appear at `/planner` and offer each published, playable class. It SHALL use that class's published level range and talent trees. It SHALL show all nodes in each tree, including nodes that lack enough evidence for a legal purchase. It SHALL use the icons and tree grid supplied by `show-talent-trees` and the shared tab set supplied by `add-page-navigation`. It SHALL not rank or recommend builds.

#### Scenario: Choose a class and level
- **WHEN** a reader chooses Shieldmaster and a level within its published range
- **THEN** the planner shows Shieldmaster's trees and a point summary for that level

#### Scenario: Node has incomplete rules
- **WHEN** a published tree node has no verified rule or point type
- **THEN** the planner shows the node and labels its purchase check as unverified

### Requirement: Talent allocations distinguish verified purchases from previews

The planner SHALL account for the point type of each tree and the cost of each selected rank. It SHALL check rank limits, level rules, and each applicable requirement group against the selected build only after those rules have evidence. It SHALL check both node requirements and rank requirements. A failed check SHALL name the blocking condition. A check that needs an unknown value or an unverified rule SHALL remain unverified and SHALL not claim game legality. The planner SHALL never use a point balance from another point type.

#### Scenario: Buy successive ranks
- **WHEN** a reader allocates two ranks to a node with verified rank costs and sufficient points of its tree's type
- **THEN** the planner charges the cost of each rank and shows the remaining balance for that point type

#### Scenario: Requirement group needs a prior talent
- **WHEN** a reader previews a rank whose requirement needs another talent at a higher rank
- **THEN** the planner shows that requirement as unmet and does not call the preview a legal purchase

#### Scenario: Requirement is not decidable
- **WHEN** a selected rank needs a value that class, level, allocated talents, and reader-supplied point totals do not establish
- **THEN** the planner marks that rank and the build as unverified rather than legal

#### Scenario: Level falls below a selected rank's requirement
- **WHEN** a reader reduces the level below a selected rank's verified minimum
- **THEN** the planner keeps the visible selection and marks it as blocked until the reader changes it

### Requirement: Point sources keep their provenance

The planner SHALL derive class-level point grants from published evidence and SHALL keep other point types separate. It SHALL let a reader enter a total for a point type that depends on activity outside the selected level. It SHALL label that total as reader-supplied. It SHALL not treat an unknown cap as zero or calculate an unverified gain from level alone.

#### Scenario: Heroic points supplied by reader
- **WHEN** a reader enters a Heroic Essence total
- **THEN** the planner subtracts only Heroic Essence costs from that total and labels the total as reader-supplied

### Requirement: Build links use a stable, versioned format

The planner SHALL encode a build in `/planner?build=v1.<payload>`. The payload SHALL be unpadded base64url of UTF-8 JSON. The JSON object SHALL have exactly these keys in this order: `catalog`, `class`, `level`, `points`, `talents`, `gear`.

`catalog` SHALL be the full lowercase 64-digit hexadecimal source catalog ID. `class` SHALL use `classes:<nonnegative native id>`. `level` SHALL be a positive integer. The planner SHALL check it against the current class's published level range. `points` SHALL contain `["treePoints:<nonnegative native id>", <nonnegative integer total>]` pairs. These totals SHALL be reader-supplied, not derived level grants. `talents` SHALL contain `["talentTrees:<nonnegative native id>", <nonnegative integer node index>, <positive integer rank>]` triples.

`gear` SHALL contain `[<slot>, "items:<nonnegative native id>"]` pairs. A slot SHALL be a stable, published equip-slot key of lowercase letters, digits, and hyphens, starting with a letter. Each array SHALL be empty when unused. Point and gear pairs SHALL sort by key. Talent triples SHALL sort by tree key, then node index. Each point key, slot, or tree-and-node pair SHALL occur at most once. Zero-rank talents SHALL be omitted. The planner SHALL write one canonical serialization and accept valid equivalent v1 JSON. `show-save-progress` SHALL be able to produce this format without reading saves in the planner. An unknown JSON field or an invalid key syntax SHALL be a hard error. A well-formed reference to a record absent from the current catalog SHALL not be a hard error when the source catalog differs.

If an older link references a record that current data lacks, the planner SHALL keep that choice in a visible migration report. Before the reader shares a revised link, the planner SHALL warn if that link omits any unmatched selection. It SHALL not display internal record keys or enum words to readers.

#### Scenario: Shared talent build
- **WHEN** a reader copies a build URL and opens it in another browser on the same catalog
- **THEN** the planner restores the class, level, point totals, selected ranks, and gear

#### Scenario: Save progress produces a planner link
- **WHEN** another page produces a valid v1 URL with `gear` and `points` empty
- **THEN** the planner opens its class, level, and talent selection without a save file

#### Scenario: Link from an older catalog
- **WHEN** a valid v1 link names a different source catalog ID
- **THEN** the planner tells the reader the link was made on an older build
- **AND** it applies matching selections to current data and re-checks every selected rank and item
- **AND** it lists any missing or blocked class, tree, node, rank, point type, slot, or item without treating it as legal

#### Scenario: Unknown format or malformed payload
- **WHEN** a link has an unknown format version, malformed payload, unknown JSON field, or invalid key syntax
- **THEN** the planner reports a hard error and does not apply the link

### Requirement: Gear and stat phase shows only grounded totals

In the gear and stat phase of this change, the planner SHALL offer equip slots and reachable published items. It SHALL display known equip restrictions, equipped item effects, class and level stat contributions, and a total only for stats whose relevant calculation and inputs are verified. It SHALL distinguish reader-supplied gear from a game character's actual gear. Missing rolls, modifiers, or rules SHALL remain visible as unknown and SHALL not become a zero contribution or a complete total. Game numbers SHALL come from captured data or recorded evidence through publication, not site constants.

#### Scenario: Item has a known restriction
- **WHEN** a reader chooses an item with a verified class, slot, or level restriction that the build does not meet
- **THEN** the planner shows the equipped choice as blocked and excludes its effects from verified totals

#### Scenario: Item has an unknown modifier
- **WHEN** an item's full effect depends on an uncaptured roll or modifier
- **THEN** the planner shows the known contributions and labels the affected total as incomplete

#### Scenario: Share a gear choice
- **WHEN** a reader adds supported gear to a build
- **THEN** the v1 URL records each slot and item key and restores them on the same catalog
