## Purpose

The planner foundation lets readers keep several characters in this browser, edit talents from published evidence, share complete build previews, and use one explicitly active character throughout the compendium.

## ADDED Requirements

### Requirement: Character identity uses published data

The planner SHALL offer every published playable class, race and valid race/class offer, with level bounded by published progression. First use and New Character SHALL provide short race/class/level setup and a reader-chosen name without an account, mandatory tutorial or modal gate. All linked talent trees, icons, positions and available rank text SHALL remain available, including nodes with missing purchase requirements or unresolved point types.

#### Scenario: Choose a published identity
- **WHEN** a reader chooses a published race, Hunter and a supported level
- **THEN** the planner shows the offered identity and all Hunter's linked talent trees and typed point summaries

#### Scenario: Captured but not offered
- **WHEN** a class is captured but absent from published playable offers
- **THEN** setup does not offer it as playable

#### Scenario: Incomplete node
- **WHEN** a node has missing purchase inputs
- **THEN** it remains visible with the missing evidence named rather than being hidden

### Requirement: The reader keeps several characters

The browser-local collection SHALL hold several characters, each with a local identity, reader-chosen name and one build containing class, race, level, Talent Point purchase order, entered point totals, Heroic ranks, gear and party.

#### Scenario: Switch complete context
- **WHEN** a reader switches from Brielle to another character in the header
- **THEN** class, race, level, talents, gear and party context change together without modifying either build

#### Scenario: Duplicate and delete
- **WHEN** a reader duplicates a character, edits the copy, deletes it and selects Undo
- **THEN** the original stays unchanged and the edited copy and prior active selection are restored

#### Scenario: The reader keeps several characters
- **WHEN** A reader keeps several characters in the browser-local collection.
- **THEN** Each character has a local identity, reader-chosen name and one build containing class, race, level, Talent Point purchase order, entered point totals, Heroic ranks, gear and party.

### Requirement: Active character selection cardinality

A nonempty collection SHALL have exactly one active character selected from the header character menu. An empty collection SHALL have none.

#### Scenario: Active character selection cardinality
- **WHEN** A collection contains several characters and the reader selects one from the header character menu.
- **THEN** Exactly one character is active.

### Requirement: Header active character identity

The header SHALL identify the active character by name, class and level.

#### Scenario: Header active character identity
- **WHEN** A character is active.
- **THEN** The header identifies that character by name, class and level.

### Requirement: Switching preserves builds

Switching SHALL change the active context without editing either build.

#### Scenario: Switching preserves builds
- **WHEN** A reader switches from one character to another.
- **THEN** The active context changes without editing either build.

### Requirement: Character management actions

New Character, Duplicate, rename and delete with Undo SHALL be available.

#### Scenario: Character management actions
- **WHEN** A reader manages the character collection.
- **THEN** New Character, Duplicate, rename and delete with Undo are available.

### Requirement: Duplicate complete builds

Duplicate SHALL copy the complete build under a distinct local identity.

#### Scenario: Duplicate complete builds
- **WHEN** A reader duplicates a character.
- **THEN** The complete build is copied under a distinct local identity.

### Requirement: Active selection after deletion

Deleting the active character SHALL require a deliberate surviving active selection, or leave no active character when the collection becomes empty.

#### Scenario: Active selection after deletion
- **WHEN** A reader deletes the active character while another character survives.
- **THEN** Deletion requires a deliberate surviving active selection.

### Requirement: Undo character deletion

Undo SHALL restore the deleted character and prior active selection.

#### Scenario: Undo character deletion
- **WHEN** A reader selects Undo after deleting a character.
- **THEN** The deleted character and prior active selection are restored.

### Requirement: Game character name entry

The game's character name SHALL be stored only if the reader types it.

#### Scenario: Game character name entry
- **WHEN** A reader has not typed the game's character name.
- **THEN** The game's character name is not stored.
### Requirement: Previews stay apart from characters

A shared link or explicit save handoff SHALL open an isolated preview.

#### Scenario: Preview beside an active character
- **WHEN** a reader with an active Druid opens a Hunter link
- **THEN** Hunter opens as a preview and reference pages retain the active Druid

#### Scenario: Explicit replacement
- **WHEN** a reader replaces Brielle's build with a valid preview and then selects Undo
- **THEN** Brielle's prior complete build is restored without modifying other characters

#### Scenario: Previews stay apart from characters
- **WHEN** A reader opens an explicit save handoff.
- **THEN** The handoff opens an isolated preview.

### Requirement: Preview operations do not write character storage

Opening, editing, comparing, checking or copying a preview SHALL write nothing to character storage.

#### Scenario: Preview operations do not write character storage
- **WHEN** A reader edits a preview.
- **THEN** The edit writes nothing to character storage.

### Requirement: Explicit creation from a preview

"Save as New Character" SHALL explicitly create a named character.

#### Scenario: Explicit creation from a preview
- **WHEN** A reader uses "Save as New Character" from a preview.
- **THEN** The action explicitly creates a named character.

### Requirement: Replacement targets the identified character

"Replace (name)'s Build" SHALL explicitly replace the identified character's build, not silently target whichever character is active later.

#### Scenario: Replacement targets the identified character
- **WHEN** A reader invokes "Replace (name)'s Build" and a different character becomes active before replacement completes.
- **THEN** Replacement targets the identified character's build, not the character that became active later.

### Requirement: Saving as new preserves active selection

Saving as new SHALL not silently switch the active character.

#### Scenario: Saving as new preserves active selection
- **WHEN** A reader saves a preview as a new character while another character is active.
- **THEN** Saving does not silently switch the active character.

### Requirement: Undo preview replacement

Replacement SHALL be reversible with Undo.

#### Scenario: Undo preview replacement
- **WHEN** A reader selects Undo after replacing a character's build.
- **THEN** The replacement is reversed.

### Requirement: Malformed input preserves character context

Malformed input SHALL leave the collection and active context unchanged.

#### Scenario: Malformed input preserves character context
- **WHEN** Malformed preview input is supplied.
- **THEN** The collection and active context remain unchanged.
### Requirement: Saving reports what happened

"Saved in this browser" SHALL appear only after a successful persistent write of the reported revision.

#### Scenario: Storage denied or full
- **WHEN** initial storage access is denied or a write fails because storage is full
- **THEN** public pages remain usable, edits remain available in this tab and export, and no successful-saving message appears

#### Scenario: Concurrent edits
- **WHEN** two tabs edit the same saved revision
- **THEN** serialized writes accept a current revision and preserve the conflicting draft without silently overwriting the accepted edit

#### Scenario: Delayed action after switching
- **WHEN** an action targeting Brielle completes after another tab switches to a different character
- **THEN** it does not mutate the new active character and a stale target is reported without discarding the draft

#### Scenario: Saving reports what happened
- **WHEN** A persistent write of a revision has not succeeded.
- **THEN** "Saved in this browser" does not appear for that revision.

### Requirement: Storage failure retains tab-only edits

Storage access or write failure SHALL leave characters and edits usable in this tab, visibly report that they are not saved in this browser, and offer export.

#### Scenario: Storage failure retains tab-only edits
- **WHEN** Storage access fails.
- **THEN** Characters and edits remain usable in this tab, a visible report says they are not saved in this browser, and export is offered.

### Requirement: Missing serialization uses tab-only fallback

Missing cross-tab serialization support SHALL use the same tab-only fallback rather than promise safe persistent writes. The fallback SHALL leave characters and edits usable in this tab, visibly report that they are not saved in this browser, and offer export.

#### Scenario: Missing serialization uses tab-only fallback
- **WHEN** Cross-tab serialization support is missing.
- **THEN** Characters and edits remain usable in this tab, a visible report says they are not saved in this browser, and export is offered rather than a promise of safe persistent writes.

### Requirement: Remote changes refresh context

Remote changes SHALL refresh context without echoing stale writes.

#### Scenario: Remote changes refresh context
- **WHEN** A remote character change arrives.
- **THEN** Context refreshes without echoing stale writes.

### Requirement: Concurrent edit conflict protection

Concurrent edits SHALL not silently overwrite another character revision. A conflict SHALL preserve the local draft and explain that it was not saved.

#### Scenario: Concurrent edit conflict protection
- **WHEN** A concurrent edit conflicts with another character revision.
- **THEN** The other revision is not silently overwritten, the local draft is preserved, and an explanation says the draft was not saved.

### Requirement: Delayed actions preserve character targeting

Delayed page actions SHALL never commit into a different character after an active switch.

#### Scenario: Delayed actions preserve character targeting
- **WHEN** A delayed page action completes after the active character switches.
- **THEN** The action does not commit into a different character.

### Requirement: Characters move by export file

An explicit export SHALL contain all characters, reader names, complete builds, active selection and source provenance in a versioned file, including tab-only edits. Import SHALL validate the entire file and preview additions, identity collisions and replacements before applying anything. Replacements and the resulting active selection SHALL require explicit reader choices. Invalid or cancelled imports SHALL change nothing; import SHALL not execute content or upload the file.

#### Scenario: Transfer a collection
- **WHEN** a reader exports all characters and imports the file in another browser
- **THEN** the preview shows complete proposed additions and replacements and only confirmed choices change that browser's collection

#### Scenario: Invalid import
- **WHEN** a file contains a malformed build or unsupported version
- **THEN** the import explains the error and writes no partial collection

### Requirement: Talent allocations distinguish evidence status from preview

The planner SHALL account for tree point types, authored per-rank costs and limits, free starting ranks, and node purchase requirements.

#### Scenario: Successive ranks
- **WHEN** a reader buys successive ranks with verified costs and sufficient points
- **THEN** each rank charges its own authored cost to its own point type

#### Scenario: Missing prerequisite or input
- **WHEN** a next rank needs an unmet known talent or an unknown external input
- **THEN** the inspector distinguishes blocked from Not Verified and names the condition without committing the preview

#### Scenario: Invalidated chain
- **WHEN** a reader removes a prerequisite or lowers an input below a verified requirement
- **THEN** dependent selections remain visible and the entire affected chain is highlighted and explained

#### Scenario: Talent allocations distinguish evidence status from preview
- **WHEN** A reader previews a rank with verified point type, authored cost and limit, free starting ranks, and node purchase requirements.
- **THEN** The planner accounts for all of those inputs in evaluating the rank.

### Requirement: Rank conditions remain separate from purchase gates

Ability-use and effect conditions attached to ranks SHALL remain separately labelled and SHALL not become purchase gates without purchase-path evidence.

#### Scenario: Rank conditions remain separate from purchase gates
- **WHEN** A rank has ability-use and effect conditions but no purchase-path evidence for those conditions.
- **THEN** The conditions remain separately labelled and do not become purchase gates.

### Requirement: Predicate evaluation requires verified evidence

Mandatory predicates and optional-count groups SHALL be evaluated only with verified rules and inputs.

#### Scenario: Predicate evaluation requires verified evidence
- **WHEN** A mandatory predicate or optional-count group lacks a verified rule or input.
- **THEN** The planner does not evaluate that predicate or group using the unverified rule or input.

### Requirement: Known failures identify every blocker

Failed known checks SHALL name each blocking condition.

#### Scenario: Known failures identify every blocker
- **WHEN** Known checks fail on two blocking conditions.
- **THEN** Both blocking conditions are named.

### Requirement: Unknown checks remain unverified

Unknown rules or values SHALL remain Not Verified, never legal by default or zero.

#### Scenario: Unknown checks remain unverified
- **WHEN** A purchase check depends on an unknown rule or value.
- **THEN** The unknown rule or value remains Not Verified rather than being treated as legal by default or zero.

### Requirement: Preview distinction is independent of evidence status

A preview SHALL remain visually distinct from committed ranks independently of its verified, blocked or unverified status.

#### Scenario: Preview distinction is independent of evidence status
- **WHEN** A preview changes between verified, blocked and unverified status.
- **THEN** The preview remains visually distinct from committed ranks in each status.

### Requirement: Invalidated selections retain dependency explanations

Invalidated selections SHALL stay visible with the full dependency chain and reasons.

#### Scenario: Invalidated selections retain dependency explanations
- **WHEN** A selection is invalidated through a dependency chain.
- **THEN** The selection stays visible with the full dependency chain and reasons.

### Requirement: Unresolved point types cannot verify purchases

An unresolved point type SHALL never produce a verified purchase.

#### Scenario: Unresolved point types cannot verify purchases
- **WHEN** A purchase has an unresolved point type.
- **THEN** The purchase is not verified.
### Requirement: Point sources keep their provenance

The planner SHALL derive only verified base level grants and show each point type's base or entered total, spent and remaining amounts beside its tree.

#### Scenario: Heroic total
- **WHEN** a reader enters a Heroic Essence total
- **THEN** only Heroic costs use it and its source is identified as entered

#### Scenario: Lower level
- **WHEN** a lower level reduces base Talent Points below selected costs
- **THEN** selections remain with a Talent Point shortfall and other point types stay independent

#### Scenario: Unknown balance
- **WHEN** a non-level point total is unknown and no total is entered
- **THEN** remaining points are Not Verified rather than zero

#### Scenario: Point sources keep their provenance
- **WHEN** The planner displays a tree's point balance using base level grants.
- **THEN** Only verified base level grants are derived, and the point type's base total, spent and remaining amounts appear beside its tree.

### Requirement: Point source labels distinguish level and entry

Source labels SHALL distinguish "From your level" and "Entered by you".

#### Scenario: Point source labels distinguish level and entry
- **WHEN** One point total comes from the reader's level and another is entered by the reader.
- **THEN** Their source labels distinguish "From your level" and "Entered by you".

### Requirement: Base grants do not imply complete totals

Base grants SHALL not claim to be full game totals when outside grants or modifiers are unknown.

#### Scenario: Base grants do not imply complete totals
- **WHEN** Base grants are shown while outside grants or modifiers are unknown.
- **THEN** The base grants are not presented as full game totals.

### Requirement: Readers can enter totals per point type

The reader SHALL be able to enter totals per point type.

#### Scenario: Readers can enter totals per point type
- **WHEN** A reader needs to supply a total for a point type.
- **THEN** The reader can enter that point type's total.

### Requirement: Point balances remain type-specific

Balances SHALL never transfer between types.

#### Scenario: Point balances remain type-specific
- **WHEN** One point type has surplus points and another has insufficient points.
- **THEN** The surplus does not transfer to the other point type.

### Requirement: Verified shortfalls preserve ranks and block purchases

A verified shortfall SHALL name its point type beside the balance and affected ranks, preserve those ranks and block new verified purchases of that type.

#### Scenario: Verified shortfalls preserve ranks and block purchases
- **WHEN** A point type has a verified shortfall affecting selected ranks.
- **THEN** The shortfall names its point type beside the balance and affected ranks, preserves those ranks and blocks new verified purchases of that type.

### Requirement: Unknown balances do not invent deficits

Unknown grants or caps SHALL not become zero or an invented deficit. An unknown remaining total SHALL say "Remaining not verified".

#### Scenario: Unknown balances do not invent deficits
- **WHEN** A grant or cap is unknown and the remaining total is unknown.
- **THEN** The unknown grant or cap is not treated as zero or an invented deficit, and the remaining total says "Remaining not verified".
### Requirement: Talent purchases keep the reader's order

Talent Point rank increments, including zero-cost purchases, SHALL retain their reader-authored cross-tree order.

#### Scenario: Ordered level projection
- **WHEN** a valid reader-authored order is viewed at a published level
- **THEN** the view shows only its earliest affordable ordered prefix under base Talent Points and explains those assumptions

#### Scenario: Blocked earlier pick
- **WHEN** an earlier purchase lacks a prerequisite but a later purchase is affordable
- **THEN** the affected stream stops at the earlier purchase and both choices remain visible

#### Scenario: Imported snapshot and Heroic ranks
- **WHEN** a save-derived preview has final talent ranks but no verified order and has Heroic ranks
- **THEN** it shows final ranks with unknown order and assigns neither invented past snapshots nor level-earned Heroic purchases

#### Scenario: Talent purchases keep the reader's order
- **WHEN** A reader purchases Talent Point rank increments across trees, including a zero-cost purchase.
- **THEN** All increments retain their reader-authored cross-tree order.

### Requirement: Free defaults form the initial state

Free default ranks SHALL form the initial state, not purchased entries.

#### Scenario: Free defaults form the initial state
- **WHEN** A plan begins with free default ranks.
- **THEN** Those ranks form the initial state and do not appear as purchased entries.

### Requirement: Ordered allocations remain accessible beside the web

An ordered allocation list SHALL appear beside the web on wide screens and remain reachable with it on phones.

#### Scenario: Ordered allocations remain accessible beside the web
- **WHEN** A reader views the web on a wide screen and then on a phone.
- **THEN** The ordered allocation list appears beside the web on the wide screen and remains reachable with the web on the phone.

### Requirement: Level view replays verified base assumptions

The level view SHALL be labelled "Earliest With Base Talent Points" and replay the order using verified base grants, per-rank costs, defaults and purchase prerequisites within the published level range.

#### Scenario: Level view replays verified base assumptions
- **WHEN** A reader opens the level view at a level within the published level range.
- **THEN** The view is labelled "Earliest With Base Talent Points" and replays the order using verified base grants, per-rank costs, defaults and purchase prerequisites.

### Requirement: Earlier purchase uncertainty stops the ordered stream

A blocked or unknown earlier purchase SHALL stop the affected ordered stream, not be skipped to buy later cheap ranks.

#### Scenario: Earlier purchase uncertainty stops the ordered stream
- **WHEN** An earlier purchase is unknown and a later cheap rank is affordable.
- **THEN** The affected ordered stream stops at the earlier purchase instead of skipping it to buy the later rank.

### Requirement: Zero-cost purchases require prerequisites

Zero-cost purchases SHALL still require prerequisites.

#### Scenario: Zero-cost purchases require prerequisites
- **WHEN** A zero-cost purchase has an unmet prerequisite.
- **THEN** The purchase still requires that prerequisite.

### Requirement: Entered totals are not grant schedules

Entered current totals SHALL not be back-projected as a level-by-level grant schedule.

#### Scenario: Entered totals are not grant schedules
- **WHEN** A reader enters a current total and opens the level view.
- **THEN** The entered total is not back-projected as a level-by-level grant schedule.

### Requirement: Heroic ranks remain outside the Talent Point timeline

Heroic Essence SHALL be stored as final ranks with no purchase level and remain separate from the Talent Point timeline.

#### Scenario: Heroic ranks remain outside the Talent Point timeline
- **WHEN** A plan contains Heroic Essence ranks and a Talent Point timeline.
- **THEN** Heroic Essence is stored as final ranks without purchase levels and remains separate from the Talent Point timeline.

### Requirement: Imported ranks do not invent purchase history

Save-imported final ranks SHALL have order marked unknown, not an invented empty or sorted history.

#### Scenario: Imported ranks do not invent purchase history
- **WHEN** Final ranks are imported from a save.
- **THEN** Their order is marked unknown rather than represented as an invented empty or sorted history.

### Requirement: Imported earlier levels require a hypothetical order

For save-imported final ranks, earlier levels SHALL be Not Verified until the reader explicitly creates a hypothetical order.

#### Scenario: Imported earlier levels require a hypothetical order
- **WHEN** A reader views an earlier level for save-imported final ranks without explicitly creating a hypothetical order.
- **THEN** The earlier level is Not Verified.

### Requirement: Level view does not claim historical reconstruction

The view SHALL never claim to reconstruct the actual build at a past level.

#### Scenario: Level view does not claim historical reconstruction
- **WHEN** A reader views a plan at a past level.
- **THEN** The view does not claim to reconstruct the actual build at that level.
### Requirement: Editing is reversible and accessible

The planner SHALL expose visible plus/minus actions on touch and keyboard, Undo for the last edit, Reset Tree for only the selected tree, and Reset Build with confirmation.

#### Scenario: Undo level or reset
- **WHEN** a reader lowers level or resets one tree and then selects Undo
- **THEN** the previous level or that tree's order and ranks return with re-evaluated checks

#### Scenario: Editing is reversible and accessible
- **WHEN** A reader accesses editing controls through touch or keyboard.
- **THEN** Visible plus/minus actions, Undo for the last edit, Reset Tree limited to the selected tree, and Reset Build with confirmation are available.

### Requirement: Reversal covers edits and preview replacement

Reversal SHALL cover build edits and preview replacement.

#### Scenario: Reversal covers edits and preview replacement
- **WHEN** A reader reverses a build edit or a preview replacement.
- **THEN** The build edit or preview replacement is reversed.

### Requirement: Minus and reset replay the plan

Minus/reset SHALL edit and replay the plan rather than simulate game refunds.

#### Scenario: Minus and reset replay the plan
- **WHEN** A reader uses minus or reset.
- **THEN** The planner edits and replays the plan rather than simulating game refunds.

### Requirement: Removed prerequisites leave dependent purchases blocked

Removing prerequisites SHALL leave later dependent purchases visible and blocked.

#### Scenario: Removed prerequisites leave dependent purchases blocked
- **WHEN** A reader removes a prerequisite of later purchases.
- **THEN** The later dependent purchases remain visible and blocked.

### Requirement: Lowered resources do not silently discard ranks

Lowering level or point totals SHALL never silently discard ranks.

#### Scenario: Lowered resources do not silently discard ranks
- **WHEN** A reader lowers the level or a point total.
- **THEN** Ranks are not silently discarded.

### Requirement: Inspector details do not require hover

The inspector SHALL show selected rank, verified next-rank cost, separate requirement rows and status without requiring hover.

#### Scenario: Inspector details do not require hover
- **WHEN** A reader inspects a selected rank with a verified next-rank cost without hovering.
- **THEN** The inspector shows the selected rank, verified next-rank cost, separate requirement rows and status.

### Requirement: Edits preserve focus and scroll

Edits SHALL preserve focus and scroll with reserved feedback space.

#### Scenario: Edits preserve focus and scroll
- **WHEN** A reader edits the plan while focused on a control at a scrolled position.
- **THEN** Focus and scroll are preserved with reserved feedback space.
### Requirement: Build links use a stable, versioned format

The canonical link SHALL be `/planner/#build=v1.<payload>`, with unpadded base64url of raw-deflate-compressed UTF-8 compact JSON.

#### Scenario: Complete build round trip
- **WHEN** a reader copies a complete valid build and opens it in a supported browser
- **THEN** the isolated preview restores identity, totals, exact purchase order, final Heroic ranks, gear modifications and party without writing that browser's collection

#### Scenario: Unsupported compression or hostile payload
- **WHEN** raw deflate is unsupported or the link is oversized, malformed, has unknown fields or uses both build transports
- **THEN** a clear error appears and no character or preview adoption is written

#### Scenario: Navigate between fragments
- **WHEN** a reader opens a different build fragment and uses Back and Forward
- **THEN** the matching isolated preview updates once per navigation without persisting either build

#### Scenario: Catalog changes or capability absent
- **WHEN** a valid build refers to old data or an unshipped gear/party feature
- **THEN** those choices and provenance survive resharing and are explained as unresolved or unevaluated rather than silently dropped

#### Scenario: Build links use a stable, versioned format
- **WHEN** A reader copies a build link.
- **THEN** The link uses `/planner/#build=v1.<payload>` with unpadded base64url of raw-deflate-compressed UTF-8 compact JSON.

### Requirement: Canonical build provenance and identity

Canonical JSON SHALL contain source catalog provenance (full lowercase 64-digit hexadecimal ID), identity (class, race, level), and entered totals per point type.

#### Scenario: Canonical build provenance and identity
- **WHEN** A build with entered point totals is serialized.
- **THEN** The JSON contains the full lowercase 64-digit hexadecimal source catalog ID, class, race, level and entered totals per point type.

### Requirement: Canonical Talent Point purchases

Canonical JSON SHALL contain Talent Point purchases in reader order with only adjacent same-node runs collapsed.

#### Scenario: Canonical Talent Point purchases
- **WHEN** A reader purchases node A twice, then node B, then node A.
- **THEN** The JSON preserves that order, collapsing only the first two node A purchases into a run.

### Requirement: Canonical Heroic Essence ranks

Canonical JSON SHALL contain Heroic Essence final ranks.

#### Scenario: Canonical Heroic Essence ranks
- **WHEN** A build with Heroic Essence ranks is serialized.
- **THEN** The JSON contains the final Heroic Essence ranks.

### Requirement: Canonical gear placements

Canonical JSON SHALL contain gear per physical placement (item, Heroic flag, separate corruption level, entered random-stat values, gems by socket and one enchantment).

#### Scenario: Canonical gear placements
- **WHEN** A build containing modified gear is serialized.
- **THEN** Each physical placement contains its item, Heroic flag, separate corruption level, entered random-stat values, socket-specific gems and one enchantment.

### Requirement: Canonical party representation

Canonical JSON SHALL contain party (player-chosen role and at most four members with optional entered levels).

#### Scenario: Canonical party representation
- **WHEN** A build with a chosen role and four party members, some with entered levels, is serialized.
- **THEN** The JSON contains the player-chosen role and those four members with their optional entered levels.

### Requirement: Save snapshot rank and order representation

A save snapshot SHALL carry final ranks and explicitly unknown order.

#### Scenario: Save snapshot rank and order representation
- **WHEN** A save snapshot is created.
- **THEN** The snapshot carries final ranks and explicitly marks order as unknown.

### Requirement: Shared build identity exclusions

Local character IDs and reader names SHALL not be part of the shared build.

#### Scenario: Shared build identity exclusions
- **WHEN** A locally named character with a local ID is shared.
- **THEN** The shared build contains neither the local character ID nor the reader name.

### Requirement: Stable native identities and compact codes

The format SHALL preserve stable native identities and freeze compact role/member/placement codes rather than use publication ordering.

#### Scenario: Stable native identities and compact codes
- **WHEN** Publication ordering changes for entries used in a build.
- **THEN** The build retains the same stable native identities and frozen compact role/member/placement codes.

### Requirement: Canonical unordered collection sorting

The format SHALL canonically sort unordered collections without sorting purchases.

#### Scenario: Canonical unordered collection sorting
- **WHEN** A build contains unordered collections and purchases in reader order.
- **THEN** Serialization canonically sorts the unordered collections and leaves the purchase order unchanged.

### Requirement: Unentered random values

Omitted random values SHALL mean unentered, not zero.

#### Scenario: Unentered random values
- **WHEN** A gear random value is omitted from a build.
- **THEN** The value is interpreted as unentered rather than zero.

### Requirement: Unknown member levels

An absent member level SHALL mean unknown current level, not a known starting level.

#### Scenario: Unknown member levels
- **WHEN** A party member has no level in the build.
- **THEN** The member's current level is treated as unknown, not as a known starting level.

### Requirement: Foundation field validation

The foundation SHALL validate every field's shape, numeric safety, duplicates, field names and structural bounds before retaining it.

#### Scenario: Foundation field validation
- **WHEN** An incoming field violates structural bounds.
- **THEN** The foundation rejects the field before retaining it.

### Requirement: Feature validation before release

Feature-specific published identities, ranges and rules SHALL be validated before that feature ships.

#### Scenario: Feature validation before release
- **WHEN** A feature is prepared for release.
- **THEN** Its published identities, ranges and rules are validated before release.

### Requirement: Unsupported gear and party retention

Valid unsupported gear/party fields SHALL remain retained, visible as unevaluated and round-trippable until `plan-character-gear` / `character-gear` and `plan-party` / `party-planner` provide their behavior.

#### Scenario: Unsupported gear and party retention
- **WHEN** A valid build with unsupported gear and party fields is opened and reshared before the owning capabilities ship.
- **THEN** The fields remain retained, visible as unevaluated and present in the reshared build.

### Requirement: Unsupported selection verification prohibition

No unsupported selection SHALL be declared verified.

#### Scenario: Unsupported selection verification prohibition
- **WHEN** A build contains an unsupported selection.
- **THEN** The selection is not declared verified.

### Requirement: Raw deflate capability detection

Decoding SHALL feature-detect raw deflate and explain unsupported browsers without changing characters.

#### Scenario: Raw deflate capability detection
- **WHEN** A build link is opened in a browser without raw deflate support.
- **THEN** Decoding explains the unsupported browser without changing characters.

### Requirement: Decode resource bounds

Decoding SHALL bound encoded size, inflated bytes and collection/run counts before accepting input.

#### Scenario: Decode resource bounds
- **WHEN** An encoded build exceeds a collection count bound.
- **THEN** Decoding rejects the input before accepting it.

### Requirement: Invalid build rejection

Decoding SHALL reject unknown versions/fields, malformed encoding/JSON, duplicates and unsafe numbers.

#### Scenario: Invalid build rejection
- **WHEN** A build payload contains an unsafe number.
- **THEN** Decoding rejects the payload.

### Requirement: Ambiguous build transport rejection

Decoding SHALL reject ambiguous dual query/fragment builds.

#### Scenario: Ambiguous build transport rejection
- **WHEN** A URL supplies ambiguous builds in both query and fragment.
- **THEN** Decoding rejects the URL.

### Requirement: Canonical identity excludes compressed bytes

Compressed bytes SHALL not be compared as canonical identity: browsers may produce different valid compression of the same canonical JSON.

#### Scenario: Canonical identity excludes compressed bytes
- **WHEN** Two browsers produce different valid compressed bytes for the same canonical JSON.
- **THEN** The differing compressed bytes are not compared as canonical identity.

### Requirement: Navigation driven decoding

Decoding SHALL run after mount and on fragment/client navigation, reload and Back/Forward without reapplying unchanged URLs on unrelated state changes.

#### Scenario: Navigation driven decoding
- **WHEN** An unrelated state change occurs after a build URL has been decoded.
- **THEN** The unchanged build URL is not reapplied.

### Requirement: Link opening storage isolation

Opening a link SHALL never write storage.

#### Scenario: Link opening storage isolation
- **WHEN** A reader opens a valid build link.
- **THEN** Opening the link performs no storage writes.

### Requirement: Different catalog provenance

A different catalog SHALL remain provenance, not an automatic hard error.

#### Scenario: Different catalog provenance
- **WHEN** A build identifies a different source catalog.
- **THEN** The catalog is retained as provenance rather than automatically causing a hard error.

### Requirement: Current data reconciliation

Current data SHALL resolve stable keys, re-evaluate checks, retain unresolved selections and explain data changes without silently replacing choices or rewriting provenance.

#### Scenario: Current data reconciliation
- **WHEN** Current data cannot resolve one of a build's stable keys.
- **THEN** Checks are re-evaluated, the unresolved selection is retained and data changes are explained without silently replacing choices or rewriting provenance.

### Requirement: Copy Link success confirmation

Copy Link SHALL confirm success and describe included build data.

#### Scenario: Copy Link success confirmation
- **WHEN** Copy Link succeeds.
- **THEN** The reader receives a success confirmation and a description of included build data.

### Requirement: Unresolved choice omission warning

Copy Link SHALL warn before any deliberate omission of unresolved choices.

#### Scenario: Unresolved choice omission warning
- **WHEN** Copy Link would deliberately omit an unresolved choice.
- **THEN** The reader is warned before the omission.

### Requirement: Copy Link security claim limits

Copy Link SHALL not claim encryption, authenticity or secrecy from browser history, scripts or recipients.

#### Scenario: Copy Link security claim limits
- **WHEN** Copy Link presents information about sharing a build.
- **THEN** The information makes no claim of encryption, authenticity or secrecy from browser history, scripts or recipients.
### Requirement: The planner is one workspace

The workspace SHALL live at `/planner/` with Character and Talents views, a summary that stays in place and a selected-entry inspector.

#### Scenario: Phone editing
- **WHEN** a reader selects a node at 390 CSS pixels
- **THEN** summary, ordered list, inspector and plus/minus actions remain readable and usable without horizontal page overflow or focus loss

#### Scenario: The planner is one workspace
- **WHEN** A reader opens `/planner/` and selects an entry.
- **THEN** The workspace provides Character and Talents views, a summary that stays in place and an inspector for the selected entry.

### Requirement: Capability gated workspace views

Gear and Party views SHALL appear only when their owning capabilities ship.

#### Scenario: Capability gated workspace views
- **WHEN** The owning Gear and Party capabilities have not shipped.
- **THEN** The workspace does not show Gear or Party views.

### Requirement: Reuse existing site interfaces

Existing tree web/list, tabs, linked reference pages and the site's visual language SHALL be reused.

#### Scenario: Reuse existing site interfaces
- **WHEN** A reader uses the planner's talent interface.
- **THEN** The interface reuses the existing tree web/list, tabs, linked reference pages and site visual language.

### Requirement: Editing at every width

All widths SHALL support editing.

#### Scenario: Editing at every width
- **WHEN** A reader opens the planner at a narrow viewport width.
- **THEN** The reader can edit the plan.

### Requirement: Wide workspace arrangement

Wide layouts SHALL keep the ordered allocation list beside the web and the inspector top-aligned.

#### Scenario: Wide workspace arrangement
- **WHEN** The planner is displayed in a wide layout.
- **THEN** The ordered allocation list sits beside the web and the inspector is top-aligned.

### Requirement: Phone workspace arrangement

Phones SHALL flow in one column with fitted web/list and reachable inline inspection.

#### Scenario: Phone workspace arrangement
- **WHEN** The planner is opened on a phone.
- **THEN** The workspace flows in one column with a fitted web/list and reachable inline inspection.

### Requirement: Horizontal overflow prevention

The page and tables SHALL not overflow horizontally at 1440, 1100 or 390 CSS pixels.

#### Scenario: Horizontal overflow prevention
- **WHEN** The planner is rendered at 1440, 1100 and 390 CSS pixels.
- **THEN** Neither the page nor its tables overflow horizontally at any of those widths.

### Requirement: Reference navigation preserves plans

Reference navigation SHALL not lose the plan.

#### Scenario: Reference navigation preserves plans
- **WHEN** A reader follows reference navigation from an edited plan.
- **THEN** The plan is not lost.

### Requirement: Planner label capitalization

Title-like labels SHALL use title case and explanatory/status sentences SHALL use sentence case.

#### Scenario: Planner label capitalization
- **WHEN** The planner displays title-like labels and explanatory or status sentences.
- **THEN** Title-like labels use title case and explanatory or status sentences use sentence case.

### Requirement: Planner advice and prediction exclusions

The planner SHALL offer no best-in-slot advice, rankings, scores of builds/teams, recommended teams, simulations or outcome predictions.

#### Scenario: Planner advice and prediction exclusions
- **WHEN** A reader reviews a completed plan.
- **THEN** The planner offers no best-in-slot advice, rankings, build or team scores, recommended teams, simulations or outcome predictions.

### Requirement: Unknown input status

Unknown inputs SHALL show Incomplete or Not Verified, never zero.

#### Scenario: Unknown input status
- **WHEN** A plan has an unknown input.
- **THEN** The input shows Incomplete or Not Verified rather than zero.
### Requirement: The active character adds context to other pages

Reference pages SHALL remain prerendered with neutral initial markup. Character context SHALL load only after mount.

#### Scenario: Class page entry
- **WHEN** a reader selects “Plan a Druid” on the class page
- **THEN** Druid is carried into setup/preview without changing the active character

#### Scenario: Hydration and switching
- **WHEN** a public page hydrates or the header switches characters
- **THEN** its reference content, focus and scroll stay in place and no search, roster, item directory or talent payload loads before a relevant action

#### Scenario: The active character adds context to other pages
- **WHEN** A reference page is initially rendered before mount.
- **THEN** The page has neutral prerendered markup and character context has not loaded.

### Requirement: Lightweight header character context

The header SHALL read local character identities and active selection without loading talent, party, item or search data.

#### Scenario: Lightweight header character context
- **WHEN** The header loads character context.
- **THEN** It reads local character identities and active selection without loading talent, party, item or search data.

### Requirement: Action triggered published data loading

Page actions SHALL load needed published data only when used, through small validated lookups rather than the full search index.

#### Scenario: Action triggered published data loading
- **WHEN** A reader uses a page action requiring published data.
- **THEN** The action loads the needed data through a small validated lookup rather than the full search index.

### Requirement: In place active context updates

Active changes SHALL update context in place without remounting public content, moving focus or shifting scroll.

#### Scenario: In place active context updates
- **WHEN** The reader switches the active character on a reference page.
- **THEN** Context updates in place without remounting public content, moving focus or shifting scroll.

### Requirement: No empty character panels

Without an active character, pages SHALL not show empty character panels.

#### Scenario: No empty character panels
- **WHEN** A reference page is viewed without an active character.
- **THEN** No empty character panel appears.

### Requirement: Shared level comparisons

Progression/place comparisons SHALL use the shared active level while retaining charts and skill XP breakpoints.

#### Scenario: Shared level comparisons
- **WHEN** An active character is used for a progression/place comparison.
- **THEN** The comparison uses the shared active level and retains charts and skill XP breakpoints.

### Requirement: Published class cues only

Supported item/ability class cues SHALL use published facts, not advice or invented restrictions.

#### Scenario: Published class cues only
- **WHEN** A supported item or ability displays a class cue.
- **THEN** The cue uses published facts rather than advice or invented restrictions.

### Requirement: Heroic Tier score availability

Heroic Tier SHALL show "Gear Score Not Available" until `plan-character-gear` / `character-gear` can verify the score from complete inputs.

#### Scenario: Heroic Tier score availability
- **WHEN** Heroic Tier is shown before the gear capability can verify a score from complete inputs.
- **THEN** Heroic Tier shows "Gear Score Not Available".

### Requirement: Class page planning entry

Class pages SHALL offer "Plan a (Class)" using their published class reference to open setup/preview without selecting or replacing an active character.

#### Scenario: Class page planning entry
- **WHEN** A reader selects "Plan a Druid" on the Druid class page.
- **THEN** Setup/preview opens using the published Druid class reference without selecting or replacing an active character.
### Requirement: Character level has one remembered source

The active character's level SHALL be the single remembered character-level source for the planner and other character-level controls.

#### Scenario: One-time migration
- **WHEN** a returning browser has an old character level and two remembered skill levels but no new collection or draft
- **THEN** the character level becomes a classless setup draft after safe persistence, both skill values stay unchanged and reload or later New Character does not migrate it again

#### Scenario: Bounded comparison
- **WHEN** a page supports a narrower level range than the active character's stored level
- **THEN** the comparison clamps its displayed value without changing the stored character level

#### Scenario: Character level has one remembered source
- **WHEN** The planner and another character-level control load an active character's level.
- **THEN** Both use the active character's level as their single remembered character-level source.

### Requirement: Classless setup comparison level

Without a complete character, a classless setup draft SHALL supply comparison level without inventing race/class context.

#### Scenario: Classless setup comparison level
- **WHEN** A comparison is opened without a complete character but with a classless setup draft.
- **THEN** The draft supplies the comparison level without invented race or class context.

### Requirement: One time legacy level migration

The old `compendium.reader-levels.v1` character value SHALL migrate once only when no new character or setup draft exists.

#### Scenario: One time legacy level migration
- **WHEN** A browser has the old character value and no new character or setup draft.
- **THEN** The old character value migrates once.

### Requirement: Independent skill entries

Skill entries SHALL remain independent and unchanged.

#### Scenario: Independent skill entries
- **WHEN** The old character-level value is migrated.
- **THEN** Remembered skill entries remain independent and unchanged.

### Requirement: Persist before legacy value removal

Migration SHALL not remove the old character value until the new state is successfully persisted.

#### Scenario: Persist before legacy value removal
- **WHEN** Persistence of the migrated state fails.
- **THEN** Migration does not remove the old character value.

### Requirement: New Character prevents repeat migration

New Character SHALL not reuse the old migrated value as another migration.

#### Scenario: New Character prevents repeat migration
- **WHEN** A reader uses New Character after the old value has been migrated.
- **THEN** New Character does not reuse the old migrated value as another migration.

### Requirement: Storage failure hydration resilience

Storage read failures in level and gear-score controls SHALL not prevent page hydration.

#### Scenario: Storage failure hydration resilience
- **WHEN** Storage reads fail in level and gear-score controls.
- **THEN** The page still hydrates.

### Requirement: Viewing clamps preserve stored level

Page-specific clamps SHALL not modify the stored level merely by viewing a page.

#### Scenario: Viewing clamps preserve stored level
- **WHEN** A reader views a page with a narrower supported level range than the stored level.
- **THEN** The page-specific clamp does not modify the stored level.
