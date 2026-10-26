## Purpose

Show a reader how their local character save relates to the published compendium without sending the save to a server. Preserve uncertainty when the save or a game record cannot be matched safely.

## ADDED Requirements

### Requirement: A reader imports a character save locally

The site SHALL let a reader choose one character's plain JSON save through the browser file picker, read it in this browser, and show its name when present only in the tab-scoped progress view.

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

#### Scenario: A reader imports a character save locally
- **WHEN** A reader selects one character's plain JSON save containing a character name through the browser file picker.
- **THEN** The site reads the save in this browser and shows the character's name only in the tab-scoped progress view.

### Requirement: Picker provides save file and location help

File and location help SHALL appear beside the picker, including the usual Windows location `%USERPROFILE%/AppData/LocalLow/Stargazing interactive/Afallon/<Name>_RPGBCharacter.txt`, that each character has its own file, and that no shared state file is required.

#### Scenario: Picker provides save file and location help
- **WHEN** The reader views the save picker.
- **THEN** Help beside the picker gives the usual Windows location `%USERPROFILE%/AppData/LocalLow/Stargazing interactive/Afallon/<Name>_RPGBCharacter.txt`, states that each character has its own file, and states that no shared state file is required.

### Requirement: Picker states local read guarantees

The picker SHALL say "Your save is read in this browser, not uploaded, and not changed."

#### Scenario: Picker states local read guarantees
- **WHEN** The save picker is displayed.
- **THEN** The picker says "Your save is read in this browser, not uploaded, and not changed."

### Requirement: Picker explains refresh reselection

The picker SHALL explain that refreshing requires selecting the file again.

#### Scenario: Picker explains refresh reselection
- **WHEN** The reader views the save picker instructions.
- **THEN** The instructions explain that refreshing requires selecting the file again.

### Requirement: Picker offers a sample through the import flow

The picker SHALL offer a non-personal sample save through the same import flow.

#### Scenario: Picker offers a sample through the import flow
- **WHEN** The reader chooses the sample save offered by the picker.
- **THEN** The non-personal sample save uses the same import flow as a selected save.

### Requirement: Malformed files preserve valid selections

A malformed file SHALL show a useful error and SHALL NOT replace a previously valid selection.

#### Scenario: Malformed files preserve valid selections
- **WHEN** A reader with a valid selection selects a malformed save file.
- **THEN** A useful error is shown and the previously valid selection is not replaced.
### Requirement: Imported character data stays under reader control

The site SHALL NOT upload, send to an API, log, or include raw save contents in a URL, analytics event, or browser storage.

#### Scenario: Reader clears a save
- **WHEN** a reader selects Clear Save
- **THEN** the character name and progress marks disappear and no imported data remains in this tab's progress state

#### Scenario: Reader reloads a page
- **WHEN** a reader reloads after selecting a save
- **THEN** the site shows no imported character or progress marks

#### Scenario: Imported character data stays under reader control
- **WHEN** The site processes an imported character save.
- **THEN** The raw save contents are not uploaded, sent to an API, logged, or included in a URL, analytics event, or browser storage.

### Requirement: Source save files remain unchanged

The site SHALL NOT change the source file.

#### Scenario: Source save files remain unchanged
- **WHEN** The site imports a character save file.
- **THEN** The source file remains unchanged.

### Requirement: Imported progress remains in current tab memory

The site SHALL hold the imported save, file metadata, character name and derived progress in browser memory for the current tab only.

#### Scenario: Imported progress remains in current tab memory
- **WHEN** A character save is imported into a tab.
- **THEN** The imported save, file metadata, character name and derived progress are held in browser memory for that tab only.

### Requirement: Reload does not restore saves

The site SHALL NOT restore a save after a reload.

#### Scenario: Reload does not restore saves
- **WHEN** A tab containing an imported save is reloaded.
- **THEN** The site does not restore the save.

### Requirement: Clear action removes save and progress marks

The site SHALL provide a clear action that removes the imported save and all progress marks from the current view.

#### Scenario: Clear action removes save and progress marks
- **WHEN** A reader invokes the clear action with an imported save and visible progress marks.
- **THEN** The imported save and all progress marks are removed from the current view.

### Requirement: Ordinary pages work without a save

Without a save, ordinary compendium and planner pages SHALL work as before.

#### Scenario: Ordinary pages work without a save
- **WHEN** A reader opens ordinary compendium and planner pages without a save.
- **THEN** Those pages work as before.

### Requirement: Planner copying requires explicit hand-off and adoption

Only the explicit planner hand-off and adoption described below SHALL copy selected, verified build facts into a preview and then, on reader request, into a browser character.

#### Scenario: Planner copying requires explicit hand-off and adoption
- **WHEN** A reader uses the explicit planner hand-off and adoption described below and requests adoption into a browser character.
- **THEN** Selected, verified build facts are copied into a preview and then into the browser character on the reader's request.

### Requirement: Planner storage and links exclude raw save and game name

Raw save data and the game's name SHALL NOT be copied into planner storage or links.

#### Scenario: Planner storage and links exclude raw save and game name
- **WHEN** Selected, verified build facts are handed off to the planner and adopted.
- **THEN** Neither raw save data nor the game's name is copied into planner storage or links.
### Requirement: Compatibility and unmatched records are explicit

The site SHALL validate the save structure before showing progress.

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

#### Scenario: Compatibility and unmatched records are explicit
- **WHEN** A save is submitted for progress display.
- **THEN** The site validates the save structure before showing progress.

### Requirement: Unknown versions and save shapes are flagged

The site SHALL flag an unknown or missing game version and any unrecognized save shape.

#### Scenario: Unknown versions and save shapes are flagged
- **WHEN** A save has a missing game version and an unrecognized save shape.
- **THEN** The site flags both the missing game version and the unrecognized save shape.

### Requirement: Missing versions are not old versions

A missing version SHALL NOT be called an old version.

#### Scenario: Missing versions are not old versions
- **WHEN** A save has no version.
- **THEN** The site does not call the missing version an old version.

### Requirement: Field version markers do not establish whole-save versions

A field-specific version marker SHALL NOT establish a whole-save version.

#### Scenario: Field version markers do not establish whole-save versions
- **WHEN** A save contains only a field-specific version marker.
- **THEN** The site does not use that marker to establish a whole-save version.

### Requirement: Unverified records remain distinct from incomplete states

The site SHALL distinguish unknown, unsupported and unmatched records from a verified incomplete state.

#### Scenario: Unverified records remain distinct from incomplete states
- **WHEN** A save contains unknown, unsupported and unmatched records alongside a verified incomplete state.
- **THEN** The site distinguishes each of those records from the verified incomplete state.

### Requirement: Absent or ambiguous evidence does not establish unfinished progress

The site SHALL NOT claim a quest, area, recipe or boss is unfinished only because the relevant field or identity is absent or ambiguous.

#### Scenario: Absent or ambiguous evidence does not establish unfinished progress
- **WHEN** A quest's relevant identity is ambiguous and an area's, recipe's and boss's relevant fields are absent.
- **THEN** The site does not claim those entities are unfinished solely on that basis.

### Requirement: Unreadable inputs remain unknown

Unreadable inputs SHALL remain unknown, never zero.

#### Scenario: Unreadable inputs remain unknown
- **WHEN** A save input is unreadable.
- **THEN** The input remains unknown rather than becoming zero.

### Requirement: Unmatched records have readable summaries

The site SHALL show counts and readable labels for records that cannot be matched and SHALL NOT expose record IDs or enum words in reader text.

#### Scenario: Unmatched records have readable summaries
- **WHEN** A save contains records that cannot be matched.
- **THEN** The site shows counts and readable labels for those records without exposing record IDs or enum words in reader text.

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

The site SHALL offer Start a Plan From This Save for independently validated published class, race and level.

#### Scenario: Reader starts an identity-only plan
- **WHEN** the reader selects Start a Plan From This Save and class, race and level validate against published offers and range
- **THEN** the planner opens those facts as a preview without adopting it, changing the active character or writing storage

#### Scenario: Reader chooses a replacement
- **WHEN** the reader picks an existing browser character and confirms Replace (name)'s Build
- **THEN** only that character's build is replaced through the foundation's reversible adoption action, not a character inferred from the file name

#### Scenario: Identity cannot be resolved
- **WHEN** a saved class, race or level cannot validate against the published build
- **THEN** the site preserves the unresolved fact as unknown, explains why the identity hand-off cannot proceed, and does not substitute a default identity

#### Scenario: Start a Plan From This Save opens a preview
- **WHEN** A save's class, race and level are independently validated against published facts.
- **THEN** The site offers Start a Plan From This Save.

### Requirement: Opening a save preview does not adopt a character

The site SHALL use the preview contract of `build-character-planner` / `character-planner`. Opening the preview SHALL write no character storage and SHALL leave the active character unchanged.

#### Scenario: Opening a save preview does not adopt a character
- **WHEN** The reader opens a save-derived preview.
- **THEN** The site uses the foundation's preview contract without writing character storage or changing the active character.

### Requirement: Saving or replacing a character requires an explicit choice

The reader SHALL explicitly choose Save as New Character or pick an existing character for Replace (name)'s Build, with the foundation's Undo behavior.

#### Scenario: Saving or replacing a character requires an explicit choice
- **WHEN** The reader wants to adopt a save-derived preview as an existing character's build.
- **THEN** The reader explicitly picks an existing character for Replace (name)'s Build, with the foundation's Undo behavior.

### Requirement: Game character names are never copied or used for replacement identity

The game's character name SHALL be stored only if the reader types it, never copied automatically or used to identify a replacement.

#### Scenario: Game character names are never copied or used for replacement identity
- **WHEN** A save contains a game character name that the reader has not typed.
- **THEN** The name is neither stored automatically nor used to identify a replacement.

### Requirement: The planning action explains copied and unverified facts

The action SHALL explain which build facts are copied and which are unknown or not yet verified.

#### Scenario: The planning action explains copied and unverified facts
- **WHEN** The reader uses Start a Plan From This Save with both verified and unverified build facts.
- **THEN** The action explains which facts are copied and which are unknown or not yet verified.

### Requirement: The planning action explains shared-link exposure

The action SHALL explain that a shared build link exposes those selected facts to recipients and can remain in browser history or the clipboard.

#### Scenario: The planning action explains shared-link exposure
- **WHEN** The reader uses Start a Plan From This Save.
- **THEN** The action explains that sharing a build link exposes the selected facts to recipients and that the link can remain in browser history or the clipboard.
### Requirement: Additional save facts transfer only after verification

Talent ranks, point totals, gear and party SHALL have separate consented-save evidence gates before transfer.

#### Scenario: Imported talents have no purchase ledger
- **WHEN** verified saved final ranks transfer without a purchase history
- **THEN** the preview marks order unknown and does not show earlier actual builds; any later reader-authored order uses Earliest With Base Talent Points semantics and assigns no level to Heroic Essence purchases

#### Scenario: Research has no positive allocation or party case
- **WHEN** the available saves have no spent talents and no verified active party
- **THEN** identity transfer remains available but talent and party transfer remain Not Verified rather than inferred from those saves

#### Scenario: Equipment instance is partially resolved
- **WHEN** verified gear transfer resolves an item but cannot resolve a modification
- **THEN** the preview retains the known item and marks the modification and dependent totals Incomplete rather than inventing a zero value

#### Scenario: Additional save facts transfer only after verification
- **WHEN** Talent ranks have passed their consented-save evidence gate but point totals, gear and party have not passed theirs.
- **THEN** The talent-rank gate does not authorize transfer of point totals, gear or party.

### Requirement: Transfer requires the owning capability

The owning capabilities for talent ranks, point totals, gear and party SHALL be available before the corresponding transfer ships.

#### Scenario: Transfer requires the owning capability
- **WHEN** The owning capability for gear is not available.
- **THEN** Gear transfer does not ship.

### Requirement: Talent resolution uses published tree and node identities

Talent resolution SHALL use `show-talent-trees` and the foundation's published tree and node identities.

#### Scenario: Talent resolution uses published tree and node identities
- **WHEN** Saved talents are resolved for transfer.
- **THEN** Resolution uses `show-talent-trees` and the foundation's published tree and node identities.

### Requirement: Verified talent ranks preserve unknown purchase order

Verified ranks SHALL transfer as final ranks with purchase order marked unknown, never an invented ordered history.

#### Scenario: Verified talent ranks preserve unknown purchase order
- **WHEN** Verified saved talent ranks transfer without a known purchase order.
- **THEN** The transferred ranks are final ranks with purchase order marked unknown, not an invented ordered history.

### Requirement: Point balances require verified accounting semantics

Saved point balances SHALL NOT become entered totals until their spending, refund and modifier semantics are verified.

#### Scenario: Point balances require verified accounting semantics
- **WHEN** A saved point balance has unverified refund semantics.
- **THEN** The balance does not become an entered total.

### Requirement: Gear transfer preserves separately verified details

Gear transfer SHALL use `plan-character-gear` / `character-gear` and preserve separately verified placements, item instances and modifications.

#### Scenario: Gear transfer preserves separately verified details
- **WHEN** Gear with separately verified placements, item instances and modifications transfers.
- **THEN** Transfer uses `plan-character-gear` / `character-gear` and preserves those verified details.

### Requirement: Party transfer requires verified active membership and role persistence

Party transfer SHALL use `plan-party` / `party-planner` only after active membership and role persistence are verified, not from adventurer world membership, friends, stored equipment or an empty array.

#### Scenario: Party transfer requires verified active membership and role persistence
- **WHEN** The save contains adventurer world membership, friends, stored equipment and an empty array, but active membership and role persistence are not verified.
- **THEN** Those inputs do not establish a party for transfer through `plan-party` / `party-planner`.

### Requirement: Partial information retains facts and labels unknown inputs

Partial information SHALL retain known facts and identify unknown inputs as Incomplete or Not Verified, never normal gear, zero stats or an empty known party.

#### Scenario: Partial information retains facts and labels unknown inputs
- **WHEN** Partial information includes known facts and unknown gear, stat and party inputs.
- **THEN** Known facts remain, and unknown inputs are identified as Incomplete or Not Verified, not normal gear, zero stats or an empty known party.

### Requirement: Unsupported talent nodes remain unmatched

Unsupported talent nodes SHALL remain unmatched, never substitute nodes.

#### Scenario: Unsupported talent nodes remain unmatched
- **WHEN** A saved talent node is unsupported.
- **THEN** The node remains unmatched and no substitute node is used.
### Requirement: Save previews use the foundation's build-link contract

Any link produced from the preview SHALL use `build-character-planner` / `character-planner`'s validated `/planner/#build=v1.<payload>` contract, with unpadded base64url of raw-deflate-compressed compact JSON and source catalog provenance.

#### Scenario: Reader shares a save-derived preview
- **WHEN** the reader explicitly copies a build link
- **THEN** it uses the versioned fragment format, preserves verified facts and unknown talent order, excludes private save-only fields, and opening it writes no storage

#### Scenario: Save previews use the foundation's build-link contract
- **WHEN** A build link is produced from a save preview.
- **THEN** The link uses the validated `/planner/#build=v1.<payload>` contract with unpadded base64url of raw-deflate-compressed compact JSON and source catalog provenance.

### Requirement: Preview links preserve verified facts and unknown talent order

Any link produced from the preview SHALL preserve final ranks with order unknown and only include verified build facts.

#### Scenario: Preview links preserve verified facts and unknown talent order
- **WHEN** A preview with verified final talent ranks, unknown purchase order and unverified build facts produces a link.
- **THEN** The link preserves final ranks with order unknown and includes only verified build facts.

### Requirement: Preview links exclude private save contents

Names, inventories, bank contents, journeys and raw save data SHALL NOT appear in any link produced from the preview.

#### Scenario: Preview links exclude private save contents
- **WHEN** A preview is derived from a save containing names, inventories, bank contents, journeys and raw save data.
- **THEN** A link produced from the preview excludes all of those contents.

### Requirement: Preview links apply foundation validation checks

The foundation's canonical JSON, unknown-field rejection, size limits and raw-deflate support checks SHALL apply to links produced from the preview, including validation of gear and party fields before their transfer ships.

#### Scenario: Preview links apply foundation validation checks
- **WHEN** Gear and party transfer are being prepared to ship with preview links.
- **THEN** The links apply the foundation's canonical JSON, unknown-field rejection, size limits and raw-deflate support checks, including validation of gear and party fields before transfer ships.

### Requirement: Decoding explains unsupported raw deflate

Decoding SHALL explain unsupported raw deflate rather than silently dropping facts.

#### Scenario: Decoding explains unsupported raw deflate
- **WHEN** A preview link is decoded where raw deflate is unsupported.
- **THEN** Decoding explains the unsupported raw deflate rather than silently dropping facts.

### Requirement: Compression is not described as encryption

Compression SHALL NOT be described as encryption.

#### Scenario: Compression is not described as encryption
- **WHEN** The site describes compression used for a preview link.
- **THEN** The description does not call compression encryption.

### Requirement: Private context preserves the ordinary reference site

Progress and planner context SHALL load after mount without changing reference pages' prerendered availability. Save hand-offs SHALL use the build-bound progress identity resource and existing page facts; party and item lookups SHALL load only when their actions are used, never through the full search index. Progress and hand-off views SHALL provide no best-in-slot, rankings, scores, recommended teams, simulations or outcome predictions.

#### Scenario: Reader opens an ordinary reference page
- **WHEN** a reader opens a prerendered reference page without using a planner action
- **THEN** its ordinary facts remain available without loading party context, the item directory or the full search index for planner context
