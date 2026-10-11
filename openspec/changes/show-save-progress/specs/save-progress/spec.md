## Purpose

Show a reader how their local character save relates to the published compendium without sending the save to a server. Preserve uncertainty when the save or a game record cannot be matched safely.

## ADDED Requirements

### Requirement: A reader imports a character save locally

The site SHALL let a reader choose one character's plain JSON save through the browser file picker, read it in this browser, and show its name when present only in the tab-scoped progress view. File and location help SHALL appear beside the picker, including the usual Windows location `%USERPROFILE%/AppData/LocalLow/Stargazing interactive/Afallon/<Name>_RPGBCharacter.txt`, that each character has its own file, and that no shared state file is required. The picker SHALL say “Your save is read in this browser, not uploaded, and not changed.” It SHALL explain that refreshing requires selecting the file again and offer a non-personal sample save through the same import flow. A malformed file SHALL show a useful error and SHALL NOT replace a previously valid selection.

#### Scenario: Reader chooses a valid file
- **WHEN** a reader selects a supported character save
- **THEN** the site shows the selected character and its available progress views

#### Scenario: Reader chooses malformed JSON
- **WHEN** a reader selects a file that is not valid JSON
- **THEN** the site explains the error and retains the prior selection without showing facts from the invalid file

#### Scenario: Reader tries the sample
- **WHEN** a reader chooses the offered non-personal sample save
- **THEN** the ordinary parser and progress views handle it, clearly identify it as a sample, and do not imply it is the reader's character

#### Scenario: Reader selects one character
- **WHEN** a reader chooses a character save
- **THEN** the site reads only that file, requests no shared state file, and does not combine other characters' bank or adventurer state

### Requirement: Imported character data stays under reader control

The site SHALL NOT upload, send to an API, log, or include raw save contents in a URL, analytics event, or browser storage, and SHALL NOT change the source file. It SHALL hold the imported save, file metadata, character name and derived progress in browser memory for the current tab only. It SHALL NOT restore a save after a reload. It SHALL provide a clear action that removes the imported save and all progress marks from the current view. Without a save, ordinary compendium and planner pages SHALL work as before. Only the explicit planner hand-off and adoption described below SHALL copy selected, verified build facts into a preview and then, on reader request, into a browser character; raw save data and the game's name SHALL NOT be copied into planner storage or links.

#### Scenario: Reader clears a save
- **WHEN** a reader selects Clear Save
- **THEN** the character name and progress marks disappear and no imported data remains in this tab's progress state

#### Scenario: Reader reloads a page
- **WHEN** a reader reloads after selecting a save
- **THEN** the site shows no imported character or progress marks

### Requirement: Compatibility and unmatched records are explicit

The site SHALL validate the save structure before showing progress. It SHALL flag an unknown or missing game version and any unrecognized save shape. A missing version SHALL NOT be called an old version; a field-specific version marker SHALL NOT establish a whole-save version. The site SHALL distinguish unknown, unsupported and unmatched records from a verified incomplete state. It SHALL NOT claim a quest, area, recipe or boss is unfinished only because the relevant field or identity is absent or ambiguous. Unreadable inputs SHALL remain unknown, never zero. The site SHALL show counts and readable labels for records that cannot be matched and SHALL NOT expose record IDs or enum words in reader text.

#### Scenario: Unknown save version
- **WHEN** a save has no verified game version or has an unrecognized version
- **THEN** the site warns that its progress may not match the published build and limits status to fields with verified meanings

#### Scenario: Version marker is absent
- **WHEN** a structurally readable save has no verified whole-save version marker
- **THEN** the site reports its version as unknown, not old, and uses only independently verified fields

#### Scenario: Field is unreadable
- **WHEN** a field is absent, malformed or cannot be interpreted safely
- **THEN** the corresponding value remains unknown rather than becoming zero, an empty party or an unfinished status

#### Scenario: Unmatched progress entry
- **WHEN** a save entry maps to no unique entity in the published build
- **THEN** the site reports the unmatched entry and does not mark a different entity complete or incomplete

### Requirement: Save identifiers resolve against the published build

A published, build-bound resource SHALL match verified save identifiers to catalog entity keys and the published page or map region. It SHALL retain record-level NPC identity when several records share a page. It SHALL resolve region names only when their map identity is unambiguous. It SHALL not discard reachable records because they have no page or no match. A changed catalog SHALL publish a matching resource with the same build identity.

#### Scenario: Two bosses share one page
- **WHEN** a save records one killed NPC among two records grouped on one page
- **THEN** the site marks only the matching record's kill and does not mark the other record killed

#### Scenario: Two regions share a name
- **WHEN** a saved region name identifies more than one published region
- **THEN** the site reports an ambiguous area instead of assigning discovery to either region

### Requirement: Quest progress groups open quests by zone

The site SHALL show verified open quests from the selected save under their published zones. Each quest SHALL link to its published page when one exists. A quest associated with several zones SHALL appear in each relevant zone without changing its state. A quest without a known zone SHALL remain in an unassigned group. Repeatable quests SHALL use the verified current state instead of a permanent completion claim. The site SHALL keep the full published quest list reachable.

#### Scenario: Open quest has two zones
- **WHEN** a verified open quest has two published zone associations
- **THEN** the quest appears in both zones with links and an open status

#### Scenario: Quest has no verified status
- **WHEN** a quest is absent from the save or its state cannot be interpreted
- **THEN** the site does not label it open or complete

### Requirement: Boss progress preserves confirmed kills

The site SHALL show confirmed kills for published bosses, with a link to each boss page and map location when available. It SHALL not treat a missing kill entry as proof that a boss was never killed. The ordinary boss directory SHALL remain reachable.

#### Scenario: Save records a killed boss
- **WHEN** a matched boss entry has a verified positive kill count
- **THEN** the corresponding boss is shown as killed

### Requirement: Map progress distinguishes undiscovered areas

The map SHALL show a selectable view of areas that a compatible save confirms as undiscovered. It SHALL use the published regions of reachable maps and verified discovery rules. It SHALL not infer discovery from an entered scene or from a missing or ambiguous region name without verified evidence. Areas without a safe match SHALL be labeled unknown instead of undiscovered. Map controls and ordinary markers SHALL remain available.

#### Scenario: Area has verified discovery evidence
- **WHEN** the save's discovery representation confirms that an area is not discovered and the area maps uniquely
- **THEN** the map shows it in the undiscovered view

#### Scenario: Discovery evidence is incomplete
- **WHEN** the save cannot establish an area's discovery status
- **THEN** the map shows no undiscovered claim for that area and explains the unknown status

### Requirement: Recipe progress identifies unlearned recipes

The recipe list SHALL offer an unlearned view based on verified save field meanings and published recipe identities. Recipes without a safe match or verified learning status SHALL remain reachable with an unknown label. The list SHALL keep the other filters and the full recipe directory available.

#### Scenario: Recipe has verified unlearned status
- **WHEN** the save says a published recipe is not learned under verified rules
- **THEN** the unlearned view shows the recipe with its page link

#### Scenario: Recipe status conflicts
- **WHEN** two saved fields disagree about whether a recipe is learned
- **THEN** the recipe has an unknown status rather than an unlearned claim

### Requirement: Start a Plan From This Save opens a preview

The site SHALL offer Start a Plan From This Save for independently validated published class, race and level. It SHALL use the preview contract of `build-character-planner` / `character-planner`: opening the preview SHALL write no character storage and SHALL leave the active character unchanged. The reader SHALL explicitly choose Save as New Character or pick an existing character for Replace (name)'s Build, with the foundation's Undo behavior. The game's character name SHALL be stored only if the reader types it, never copied automatically or used to identify a replacement. The action SHALL explain which build facts are copied, which are unknown or not yet verified, and that a shared build link exposes those selected facts to recipients and can remain in browser history or the clipboard.

#### Scenario: Reader starts an identity-only plan
- **WHEN** the reader selects Start a Plan From This Save and class, race and level validate against published offers and range
- **THEN** the planner opens those facts as a preview without adopting it, changing the active character or writing storage

#### Scenario: Reader chooses a replacement
- **WHEN** the reader picks an existing browser character and confirms Replace (name)'s Build
- **THEN** only that character's build is replaced through the foundation's reversible adoption action, not a character inferred from the file name

#### Scenario: Identity cannot be resolved
- **WHEN** a saved class, race or level cannot validate against the published build
- **THEN** the site preserves the unresolved fact as unknown, explains why the identity hand-off cannot proceed, and does not substitute a default identity

### Requirement: Additional save facts transfer only after verification

Talent ranks, point totals, gear and party SHALL have separate consented-save evidence gates before transfer, and their owning capabilities SHALL be available before the corresponding transfer ships. Talent resolution SHALL use `show-talent-trees` and the foundation's published tree and node identities; verified ranks SHALL transfer as final ranks with purchase order marked unknown, never an invented ordered history. Saved point balances SHALL NOT become entered totals until their spending, refund and modifier semantics are verified. Gear transfer SHALL use `plan-character-gear` / `character-gear` and preserve separately verified placements, item instances and modifications. Party transfer SHALL use `plan-party` / `party-planner` only after active membership and role persistence are verified, not from adventurer world membership, friends, stored equipment or an empty array. Partial information SHALL retain known facts and identify unknown inputs as Incomplete or Not Verified, never normal gear, zero stats or an empty known party. Unsupported talent nodes SHALL remain unmatched, never substitute nodes.

#### Scenario: Imported talents have no purchase ledger
- **WHEN** verified saved final ranks transfer without a purchase history
- **THEN** the preview marks order unknown and does not show earlier actual builds; any later reader-authored order uses Earliest With Base Talent Points semantics and assigns no level to Heroic Essence purchases

#### Scenario: Research has no positive allocation or party case
- **WHEN** the available saves have no spent talents and no verified active party
- **THEN** identity transfer remains available but talent and party transfer remain Not Verified rather than inferred from those saves

#### Scenario: Equipment instance is partially resolved
- **WHEN** verified gear transfer resolves an item but cannot resolve a modification
- **THEN** the preview retains the known item and marks the modification and dependent totals Incomplete rather than inventing a zero value

### Requirement: Save previews use the foundation's build-link contract

Any link produced from the preview SHALL use `build-character-planner` / `character-planner`'s validated `/planner/#build=v1.<payload>` contract, with unpadded base64url of raw-deflate-compressed compact JSON and source catalog provenance. It SHALL preserve final ranks with order unknown and only include verified build facts; names, inventories, bank contents, journeys and raw save data SHALL NOT appear. The foundation's canonical JSON, unknown-field rejection, size limits and raw-deflate support checks SHALL apply, including validation of gear and party fields before their transfer ships. Decoding SHALL explain unsupported raw deflate rather than silently dropping facts. Compression SHALL NOT be described as encryption.

#### Scenario: Reader shares a save-derived preview
- **WHEN** the reader explicitly copies a build link
- **THEN** it uses the versioned fragment format, preserves verified facts and unknown talent order, excludes private save-only fields, and opening it writes no storage

### Requirement: Private context preserves the ordinary reference site

Progress and planner context SHALL load after mount without changing reference pages' prerendered availability. Save hand-offs SHALL use the build-bound progress identity resource and existing page facts; party and item lookups SHALL load only when their actions are used, never through the full search index. Progress and hand-off views SHALL provide no best-in-slot, rankings, scores, recommended teams, simulations or outcome predictions.

#### Scenario: Reader opens an ordinary reference page
- **WHEN** a reader opens a prerendered reference page without using a planner action
- **THEN** its ordinary facts remain available without loading party context, the item directory or the full search index for planner context
