## Purpose

The planner lets readers assemble and share a talent build from published game facts. Its explicitly chosen, device-local character supplies class and level context elsewhere without treating a shared link as an instruction to replace that character.

## ADDED Requirements

### Requirement: Class and level choices use published data

The planner SHALL appear at `/planner` and offer every published playable class, including Hunter. It SHALL use each class's published level range and all its linked talent trees, icons, node positions, and available rank text. It SHALL retain nodes with missing requirements or unresolved point types rather than hide them. It SHALL use the site's shared tree web/list and tab presentation and SHALL not rank or recommend builds. First use SHALL start with class and level, without an account, mandatory tutorial, or modal gate.

#### Scenario: Choose a class and level
- **WHEN** a reader chooses Hunter and a level within its published range
- **THEN** the planner shows Hunter's linked trees and typed point summaries for that level

#### Scenario: Node has incomplete rules
- **WHEN** a published node lacks a verified purchase rule or point type
- **THEN** the planner shows the node and explains why its purchase is unverified

### Requirement: Talent allocations distinguish evidence status from preview

The planner SHALL account for each tree's point type, each selected rank's authored cost and limit, and the talent node's purchase requirements. Ability-use and effect requirements attached to rank data SHALL be labeled separately when displayed and SHALL not become purchase gates without evidence that the purchase path checks them. It SHALL evaluate optional-count groups and other node predicates only when their native rules and required inputs are verified. A failed verified check SHALL name each blocking condition. A check requiring an unknown rule or value SHALL name the missing evidence or input and remain unverified, never legal by default. A rank being previewed SHALL remain visually distinct from a committed selection regardless of whether its check is verified, blocked, or unverified. Committed ranks invalidated by later edits SHALL remain visible and shall show affected dependencies and reasons. A rank with no resolved point type SHALL never become a verified purchase.

#### Scenario: Buy successive ranks
- **WHEN** a reader allocates two ranks to a node with verified rank costs and enough points of its tree's type
- **THEN** each rank charges its own cost and the summary shows the resulting balance for that type

#### Scenario: Requirement group needs a prior talent
- **WHEN** a reader previews a rank whose requirement needs another talent at a higher rank
- **THEN** the planner shows that requirement as unmet and does not call the preview a legal purchase

#### Scenario: Requirement is not decidable
- **WHEN** a rank needs an unknown rule or a value absent from class, level, selected talents, and entered point totals
- **THEN** it and the build remain unverified, with the missing rule or input named

#### Scenario: Level falls below a selected rank's requirement
- **WHEN** a reader lowers the level below a selected rank's verified minimum
- **THEN** the selection and its dependent chain remain visible and blocked until the reader changes them

#### Scenario: Preview has a separate status
- **WHEN** a reader focuses a blocked or unverified next rank
- **THEN** its preview shows that evidence status without looking like an already spent point

### Requirement: Point sources keep their provenance

The planner SHALL derive only level-granted balances established by published rules. It SHALL show each type separately with earned or entered, spent, and remaining amounts and a source label such as “From Your Level” or “Entered by You.” A verified base level grant SHALL not be presented as a verified total when game modifiers or outside grants may change it and their values are unknown. The planner SHALL allow a reader to enter totals for types earned outside the selected level and SHALL never transfer a balance between types. When a verified type budget is exceeded, it SHALL name that type's shortfall beside the balance and affected ranks, preserving the ranks while blocking new verified purchases of that type. Unknown grants or caps SHALL not become a zero balance or invented deficit, and SHALL say “Remaining Not Verified.”

#### Scenario: Heroic points supplied by reader
- **WHEN** a reader enters a Heroic Essence total
- **THEN** only Heroic Essence costs use it, and the total is labeled “Entered by You”

#### Scenario: One type is over budget
- **WHEN** a lower level reduces verified Talent Points below previously selected Talent Point costs
- **THEN** those ranks remain selected with a Talent Point shortfall and other point types remain independent

#### Scenario: Unknown point total
- **WHEN** the game grants a point type whose total cannot be inferred from class and level and no total was entered
- **THEN** the planner says “Remaining Not Verified” without computing a deficit from zero

### Requirement: Rank editing is reversible and accessible

The planner SHALL expose visible plus and minus rank actions on touch and keyboard, one-step Undo for the last edit, Reset Tree for the current tree, and Reset Build for the entire build with confirmation before destructive reset. A lower level or changed point total SHALL not silently discard ranks. The inspector SHALL show selected rank, next-rank cost when verified, distinct requirement rows, and status without relying on hover. Changes SHALL preserve the reader's focus and scroll position, with feedback space reserved so the tree does not jump.

#### Scenario: Undo a level change
- **WHEN** a reader lowers level and then selects Undo
- **THEN** the previous level and purchase checks return without deleting selected ranks

#### Scenario: Reset one tree
- **WHEN** a reader confirms Reset Tree
- **THEN** only that tree's allocations are removed and Undo can restore them

### Requirement: The site has one remembered character

The planner SHALL own one explicit active character in device-local browser storage under a versioned format containing source catalog, canonical build payload, class, and level. The existing `compendium.reader-levels.v1` character level SHALL migrate once into the shared character-level draft when no class is chosen. Skill levels remain in their existing storage. After a class is chosen, both the planner and other character-level controls SHALL read and update the same shared module, without a competing saved character level. A cross-tab update SHALL refresh readers of that module. A stale catalog SHALL leave the active character visible with a data-change notice and unresolved selections, not silently discard it. Explain nearby that the build is stored only in this browser and needs no account.

An incoming shared URL, including one opened while an active character exists, SHALL open as a separate preview. Opening, editing, or copying that preview SHALL not alter the remembered character. “Use as My Character” SHALL explicitly adopt the visible build and preserve focus. A malformed link SHALL leave the active character untouched. The site's compact Character navigation SHALL open the planner with Change Character, without a large profile bar. With no active class, other pages SHALL add no empty character panel.

#### Scenario: Existing saved character level
- **WHEN** a returning reader has a saved character level but has not chosen a class
- **THEN** the level is available in class/level setup without inventing a class or showing active-character context

#### Scenario: Shared build is opened beside an active character
- **WHEN** a reader with an active Druid opens a Hunter build link
- **THEN** Hunter appears as a shared preview and pages still read the active Druid until “Use as My Character” is activated

#### Scenario: Adopt the shared preview
- **WHEN** a reader activates “Use as My Character” on a valid preview
- **THEN** the active class and level change together, focus remains on the action, and other pages read the newly chosen character

#### Scenario: Malformed link leaves character intact
- **WHEN** a reader opens an invalid build link
- **THEN** its error appears without changing the remembered character

### Requirement: Remembered class and level add unobtrusive page context

Progression and place pages SHALL show the remembered level beside existing level comparisons, without removing their level-curve charts or skill XP breakpoints. Item and ability pages SHALL show class context or class-usable cues only when supported by published facts, not unsupported advice or false restrictions on non-weapon equipment. The Heroic Tier page SHALL show a verified gear score only when the active build and verified gear rules supply one; until gear planning is implemented or whenever it cannot be verified, it SHALL say “Gear Score Not Available” without guessing from level. A missing character adds no empty box. Page content and navigation remain available.

#### Scenario: Level comparison with an active character
- **WHEN** a reader with an active class and level visits a progression or place page
- **THEN** the level appears beside a supported comparison while the level curve remains available

#### Scenario: No verified gear score
- **WHEN** an active character has no verifiable equipment-derived gear score
- **THEN** the Heroic Tier page says “Gear Score Not Available” instead of showing an inferred number

### Requirement: Build links use a stable, versioned format

The planner SHALL encode a visible build in `/planner?build=v1.<payload>`, where the payload is unpadded base64url of UTF-8 JSON. The JSON object SHALL have exactly these keys in this order: `catalog`, `class`, `level`, `points`, `talents`, `gear`. `catalog` is the full lowercase 64-digit hexadecimal source catalog ID. `class` uses `classes:<nonnegative native id>`. `level` is a positive safe integer checked against the current class's published range. `points` contains `["treePoints:<nonnegative native id>", <nonnegative safe integer total>]` pairs representing entered totals, not derived level grants. `talents` contains `["talentTrees:<nonnegative native id>", <nonnegative safe integer node index>, <positive safe integer rank>]` triples. `gear` contains `[<slot>, "items:<nonnegative native id>"]` pairs with slot keys of lowercase letters, digits, and hyphens, starting with a letter. Planner 1 writes `gear: []` and does not evaluate gear choices. Planner 2 (`plan-character-gear`) will activate those choices within this same format.

Every array SHALL be empty when unused. Point and gear pairs SHALL sort by key, talent triples by tree key and then node index, and each point key, slot, or tree-and-node pair occurs at most once. Zero-rank talents SHALL be omitted. The planner SHALL write canonical serialization and accept equivalent valid v1 JSON. Parsing SHALL reject unknown versions, malformed or oversized payloads, unknown JSON fields, invalid key syntax, duplicate entries, and unsafe integers. The save-progress feature SHALL be able to produce this format without the planner reading a save file.

A different source catalog SHALL be provenance, not a hard error. Match stable keys against current publication data, retain matching choices, re-check their current rules, and report unmatched class, trees, nodes, ranks, and point types. Until Planner 2, a valid nonempty gear field SHALL remain visible as unevaluated link choices, not silently accepted as equipped gear. Before copying a revised link that omits unmatched or unevaluated selections, warn the reader. Internal record keys and enum words SHALL not appear in reader text.

#### Scenario: Shared talent build
- **WHEN** a reader copies a build URL and opens it in another browser on the same catalog
- **THEN** the shared preview restores class, level, entered point totals, selected ranks, and their checks without changing that browser's active character

#### Scenario: Save progress produces a planner link
- **WHEN** another page produces a valid v1 URL with `gear` and `points` empty
- **THEN** the planner previews its class, level, and talents without reading a save file

#### Scenario: Link from an older catalog
- **WHEN** a valid v1 link names a different source catalog ID
- **THEN** the planner identifies the changed game data, restores matching selections under current rules, and lists missing or newly blocked choices before a revised link omits them

#### Scenario: Unknown format or malformed payload
- **WHEN** a link has an unknown version, malformed payload, unknown JSON field, duplicate, or invalid key syntax
- **THEN** the planner reports a hard error and changes neither the active character nor its stored build

#### Scenario: A gear link arrives before gear planning
- **WHEN** a well-formed v1 link contains gear pairs during Planner 1
- **THEN** the planner reports them as unevaluated choices and warns before sharing a link that omits them

### Requirement: Planner layout stays readable at desktop and phone widths

At desktop width the character and typed point balances, talent web/list, and top-aligned selected-node inspector SHALL form a coherent three-column composition below the header band. At phone width the controls, compact identity/point summary, tabs, fitted web or list, and inline inspector SHALL flow in one column. Feedback SHALL not shift the tree unexpectedly or lose focus. Neither the page nor its tables SHALL scroll sideways at 1440, 1100, or 390 CSS pixels. Labels use title case, complete explanatory sentences use sentence case, and game numbers come from published data or verified rules.

#### Scenario: Select a node on a phone
- **WHEN** a reader selects a tree node at 390 CSS pixels
- **THEN** the inspector and plus/minus actions remain readable and reachable without horizontal document overflow or focus loss
