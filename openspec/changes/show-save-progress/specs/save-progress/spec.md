## Purpose

Show a reader how their local character save relates to the published compendium without sending the save to a server. Preserve uncertainty when the save or a game record cannot be matched safely.

## ADDED Requirements

### Requirement: A reader imports a character save locally

The site SHALL let a reader choose a plain JSON character save through the browser file picker. The site SHALL parse it locally and show the chosen character's name when present. It SHALL explain that the usual file is `%USERPROFILE%/AppData/LocalLow/Stargazing interactive/Afallon/<Name>_RPGBCharacter.txt`. A malformed file SHALL show a useful error and SHALL NOT replace a previously valid selection.

#### Scenario: Reader chooses a valid file
- **WHEN** a reader selects a supported character save
- **THEN** the site shows the selected character and its available progress views

#### Scenario: Reader chooses malformed JSON
- **WHEN** a reader selects a file that is not valid JSON
- **THEN** the site explains the error and retains the prior selection without showing facts from the invalid file

### Requirement: Imported character data stays under reader control

The site SHALL NOT upload, send to an API, log, or include raw save contents in a URL, analytics event, or browser storage. It SHALL hold the imported save and derived progress in browser memory for the current tab only. It SHALL NOT restore a save after a reload. It SHALL provide a clear action that removes the imported save and all progress marks from the current view. Without a save, ordinary compendium and planner pages SHALL work as before.

#### Scenario: Reader clears a save
- **WHEN** a reader selects Clear save
- **THEN** the character name and progress marks disappear and no imported data remains in this tab's progress state

#### Scenario: Reader reloads a page
- **WHEN** a reader reloads after selecting a save
- **THEN** the site shows no imported character or progress marks

### Requirement: Compatibility and unmatched records are explicit

The site SHALL validate the save structure before showing progress. It SHALL flag an unknown or missing game version and any unrecognized save shape. It SHALL distinguish unknown, unsupported, and unmatched records from a verified incomplete state. It SHALL not claim a quest, area, recipe, or boss is unfinished only because the relevant field or identity is absent or ambiguous. It SHALL show counts and readable labels for records that cannot be matched and SHALL NOT expose record IDs or enum words in reader text.

#### Scenario: Unknown save version
- **WHEN** a save has no verified game version or has an unrecognized version
- **THEN** the site warns that its progress may not match the published build and limits status to fields with verified meanings

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

### Requirement: Saved talents open in the character planner

The site SHALL offer an Open in planner action for a verified current talent build. It SHALL use the `/planner` build URL format and published tree and node identities from `build-character-planner` and `show-talent-trees`. The action SHALL explain that a planner link exposes the selected build to anyone who receives the link. Unsupported nodes SHALL remain visible as unmatched and SHALL not become different nodes in the planner. It SHALL not infer unverified gear or stats from the save.

#### Scenario: Reader opens a matched talent build
- **WHEN** a reader opens a build whose tree and node ranks all match the published catalog
- **THEN** the planner opens the same talent ranks in its URL format

#### Scenario: Save has an unsupported talent node
- **WHEN** a node in the save has no unique published tree node
- **THEN** the site reports the unmatched node and does not substitute another node in the planner
