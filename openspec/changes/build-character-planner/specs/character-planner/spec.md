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

The browser-local collection SHALL hold several characters, each with a local identity, reader-chosen name and one build containing class, race, level, Talent Point purchase order, entered point totals, Heroic ranks, gear and party. A nonempty collection SHALL have exactly one active character selected from the header character menu; an empty collection SHALL have none. The header SHALL identify the active character by name, class and level. Switching SHALL change the active context without editing either build. New Character, Duplicate, rename and delete with Undo SHALL be available. Duplicate SHALL copy the complete build under a distinct local identity. Deleting the active character SHALL require a deliberate surviving active selection, or leave no active character when the collection becomes empty; Undo SHALL restore the deleted character and prior active selection. The game's character name SHALL be stored only if the reader types it.

#### Scenario: Switch complete context
- **WHEN** a reader switches from Brielle to another character in the header
- **THEN** class, race, level, talents, gear and party context change together without modifying either build

#### Scenario: Duplicate and delete
- **WHEN** a reader duplicates a character, edits the copy, deletes it and selects Undo
- **THEN** the original stays unchanged and the edited copy and prior active selection are restored

### Requirement: Previews stay apart from characters

A shared link or explicit save handoff SHALL open an isolated preview. Opening, editing, comparing, checking or copying a preview SHALL write nothing to character storage. “Save as New Character” SHALL explicitly create a named character; “Replace (name)'s Build” SHALL explicitly replace the identified character's build, not silently target whichever character is active later. Saving as new SHALL not silently switch the active character. Replacement SHALL be reversible with Undo. Malformed input SHALL leave the collection and active context unchanged.

#### Scenario: Preview beside an active character
- **WHEN** a reader with an active Druid opens a Hunter link
- **THEN** Hunter opens as a preview and reference pages retain the active Druid

#### Scenario: Explicit replacement
- **WHEN** a reader replaces Brielle's build with a valid preview and then selects Undo
- **THEN** Brielle's prior complete build is restored without modifying other characters

### Requirement: Saving reports what happened

“Saved in this browser” SHALL appear only after a successful persistent write of the reported revision. Storage access or write failure SHALL leave characters and edits usable in this tab, visibly report that they are not saved in this browser, and offer export. Missing cross-tab serialization support SHALL use the same tab-only fallback rather than promise safe persistent writes. Remote changes SHALL refresh context without echoing stale writes. Concurrent edits SHALL not silently overwrite another character revision; a conflict SHALL preserve the local draft and explain that it was not saved. Delayed page actions SHALL never commit into a different character after an active switch.

#### Scenario: Storage denied or full
- **WHEN** initial storage access is denied or a write fails because storage is full
- **THEN** public pages remain usable, edits remain available in this tab and export, and no successful-saving message appears

#### Scenario: Concurrent edits
- **WHEN** two tabs edit the same saved revision
- **THEN** serialized writes accept a current revision and preserve the conflicting draft without silently overwriting the accepted edit

#### Scenario: Delayed action after switching
- **WHEN** an action targeting Brielle completes after another tab switches to a different character
- **THEN** it does not mutate the new active character and a stale target is reported without discarding the draft

### Requirement: Characters move by export file

An explicit export SHALL contain all characters, reader names, complete builds, active selection and source provenance in a versioned file, including tab-only edits. Import SHALL validate the entire file and preview additions, identity collisions and replacements before applying anything. Replacements and the resulting active selection SHALL require explicit reader choices. Invalid or cancelled imports SHALL change nothing; import SHALL not execute content or upload the file.

#### Scenario: Transfer a collection
- **WHEN** a reader exports all characters and imports the file in another browser
- **THEN** the preview shows complete proposed additions and replacements and only confirmed choices change that browser's collection

#### Scenario: Invalid import
- **WHEN** a file contains a malformed build or unsupported version
- **THEN** the import explains the error and writes no partial collection

### Requirement: Talent allocations distinguish evidence status from preview

The planner SHALL account for tree point types, authored per-rank costs and limits, free starting ranks, and node purchase requirements. Ability-use and effect conditions attached to ranks SHALL remain separately labelled and SHALL not become purchase gates without purchase-path evidence. Mandatory predicates and optional-count groups SHALL be evaluated only with verified rules and inputs. Failed known checks SHALL name each blocking condition; unknown rules or values SHALL remain Not Verified, never legal by default or zero. A preview SHALL remain visually distinct from committed ranks independently of its verified, blocked or unverified status. Invalidated selections SHALL stay visible with the full dependency chain and reasons. An unresolved point type SHALL never produce a verified purchase.

#### Scenario: Successive ranks
- **WHEN** a reader buys successive ranks with verified costs and sufficient points
- **THEN** each rank charges its own authored cost to its own point type

#### Scenario: Missing prerequisite or input
- **WHEN** a next rank needs an unmet known talent or an unknown external input
- **THEN** the inspector distinguishes blocked from Not Verified and names the condition without committing the preview

#### Scenario: Invalidated chain
- **WHEN** a reader removes a prerequisite or lowers an input below a verified requirement
- **THEN** dependent selections remain visible and the entire affected chain is highlighted and explained

### Requirement: Point sources keep their provenance

The planner SHALL derive only verified base level grants and show each point type's base or entered total, spent and remaining amounts beside its tree. Source labels SHALL distinguish “From your level” and “Entered by you”. Base grants SHALL not claim to be full game totals when outside grants or modifiers are unknown. The reader SHALL be able to enter totals per point type; balances SHALL never transfer between types. A verified shortfall SHALL name its point type beside the balance and affected ranks, preserve those ranks and block new verified purchases of that type. Unknown grants or caps SHALL not become zero or an invented deficit; an unknown remaining total SHALL say “Remaining not verified”.

#### Scenario: Heroic total
- **WHEN** a reader enters a Heroic Essence total
- **THEN** only Heroic costs use it and its source is identified as entered

#### Scenario: Lower level
- **WHEN** a lower level reduces base Talent Points below selected costs
- **THEN** selections remain with a Talent Point shortfall and other point types stay independent

#### Scenario: Unknown balance
- **WHEN** a non-level point total is unknown and no total is entered
- **THEN** remaining points are Not Verified rather than zero

### Requirement: Talent purchases keep the reader's order

Talent Point rank increments, including zero-cost purchases, SHALL retain their reader-authored cross-tree order. Free default ranks SHALL form the initial state, not purchased entries. An ordered allocation list SHALL appear beside the web on wide screens and remain reachable with it on phones. The level view SHALL be labelled “Earliest With Base Talent Points” and replay the order using verified base grants, per-rank costs, defaults and purchase prerequisites within the published level range. A blocked or unknown earlier purchase SHALL stop the affected ordered stream, not be skipped to buy later cheap ranks. Zero-cost purchases SHALL still require prerequisites. Entered current totals SHALL not be back-projected as a level-by-level grant schedule. Heroic Essence SHALL be stored as final ranks with no purchase level and remain separate from the Talent Point timeline. Save-imported final ranks SHALL have order marked unknown, not an invented empty or sorted history; earlier levels SHALL be Not Verified until the reader explicitly creates a hypothetical order. The view SHALL never claim to reconstruct the actual build at a past level.

#### Scenario: Ordered level projection
- **WHEN** a valid reader-authored order is viewed at a published level
- **THEN** the view shows only its earliest affordable ordered prefix under base Talent Points and explains those assumptions

#### Scenario: Blocked earlier pick
- **WHEN** an earlier purchase lacks a prerequisite but a later purchase is affordable
- **THEN** the affected stream stops at the earlier purchase and both choices remain visible

#### Scenario: Imported snapshot and Heroic ranks
- **WHEN** a save-derived preview has final talent ranks but no verified order and has Heroic ranks
- **THEN** it shows final ranks with unknown order and assigns neither invented past snapshots nor level-earned Heroic purchases

### Requirement: Editing is reversible and accessible

The planner SHALL expose visible plus/minus actions on touch and keyboard, Undo for the last edit, Reset Tree for only the selected tree, and Reset Build with confirmation. Reversal SHALL cover build edits and preview replacement. Minus/reset SHALL edit and replay the plan rather than simulate game refunds; removing prerequisites SHALL leave later dependent purchases visible and blocked. Lowering level or point totals SHALL never silently discard ranks. The inspector SHALL show selected rank, verified next-rank cost, separate requirement rows and status without requiring hover. Edits SHALL preserve focus and scroll with reserved feedback space.

#### Scenario: Undo level or reset
- **WHEN** a reader lowers level or resets one tree and then selects Undo
- **THEN** the previous level or that tree's order and ranks return with re-evaluated checks

### Requirement: Build links use a stable, versioned format

The canonical link SHALL be `/planner/#build=v1.<payload>`, with unpadded base64url of raw-deflate-compressed UTF-8 compact JSON. Canonical JSON SHALL contain source catalog provenance (full lowercase 64-digit hexadecimal ID); identity (class, race, level); entered totals per point type; Talent Point purchases in reader order with only adjacent same-node runs collapsed; Heroic Essence final ranks; gear per physical placement (item, Heroic flag, separate corruption level, entered random-stat values, gems by socket and one enchantment); and party (player-chosen role and at most four members with optional entered levels). A save snapshot SHALL carry final ranks and explicitly unknown order. Local character IDs and reader names SHALL not be part of the shared build.

The format SHALL preserve stable native identities, freeze compact role/member/placement codes rather than use publication ordering, and canonically sort unordered collections without sorting purchases. Omitted random values SHALL mean unentered, not zero; an absent member level SHALL mean unknown current level, not a known starting level. The foundation SHALL validate every field's shape, numeric safety, duplicates, field names and structural bounds before retaining it; feature-specific published identities, ranges and rules SHALL be validated before that feature ships. Valid unsupported gear/party fields SHALL remain retained, visible as unevaluated and round-trippable until `plan-character-gear` / `character-gear` and `plan-party` / `party-planner` provide their behavior; no unsupported selection SHALL be declared verified.

Decoding SHALL feature-detect raw deflate and explain unsupported browsers without changing characters. It SHALL bound encoded size, inflated bytes and collection/run counts before accepting input, reject unknown versions/fields, malformed encoding/JSON, duplicates and unsafe numbers, and reject ambiguous dual query/fragment builds. Compressed bytes SHALL not be compared as canonical identity: browsers may produce different valid compression of the same canonical JSON. Decoding SHALL run after mount and on fragment/client navigation, reload and Back/Forward without reapplying unchanged URLs on unrelated state changes. Opening a link SHALL never write storage.

A different catalog SHALL remain provenance, not an automatic hard error. Current data SHALL resolve stable keys, re-evaluate checks, retain unresolved selections and explain data changes without silently replacing choices or rewriting provenance. Copy Link SHALL confirm success, describe included build data and warn before any deliberate omission of unresolved choices. It SHALL not claim encryption, authenticity or secrecy from browser history, scripts or recipients.

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

### Requirement: The planner is one workspace

The workspace SHALL live at `/planner/` with Character and Talents views, a summary that stays in place and a selected-entry inspector. Gear and Party views SHALL appear only when their owning capabilities ship. Existing tree web/list, tabs, linked reference pages and the site's visual language SHALL be reused. All widths SHALL support editing. Wide layouts SHALL keep the ordered allocation list beside the web and the inspector top-aligned; phones SHALL flow in one column with fitted web/list and reachable inline inspection. The page and tables SHALL not overflow horizontally at 1440, 1100 or 390 CSS pixels. Reference navigation SHALL not lose the plan. Title-like labels SHALL use title case and explanatory/status sentences sentence case. The planner SHALL offer no best-in-slot advice, rankings, scores of builds/teams, recommended teams, simulations or outcome predictions; unknown inputs SHALL show Incomplete or Not Verified, never zero.

#### Scenario: Phone editing
- **WHEN** a reader selects a node at 390 CSS pixels
- **THEN** summary, ordered list, inspector and plus/minus actions remain readable and usable without horizontal page overflow or focus loss

### Requirement: The active character adds context to other pages

Reference pages SHALL remain prerendered with neutral initial markup; character context SHALL load only after mount. The header SHALL read local character identities and active selection without loading talent, party, item or search data. Page actions SHALL load needed published data only when used, through small validated lookups rather than the full search index. Active changes SHALL update context in place without remounting public content, moving focus or shifting scroll. Without an active character, pages SHALL not show empty character panels. Progression/place comparisons SHALL use the shared active level while retaining charts and skill XP breakpoints. Supported item/ability class cues SHALL use published facts, not advice or invented restrictions. Heroic Tier SHALL show “Gear Score Not Available” until `plan-character-gear` / `character-gear` can verify the score from complete inputs. Class pages SHALL offer “Plan a (Class)” using their published class reference to open setup/preview without selecting or replacing an active character.

#### Scenario: Class page entry
- **WHEN** a reader selects “Plan a Druid” on the class page
- **THEN** Druid is carried into setup/preview without changing the active character

#### Scenario: Hydration and switching
- **WHEN** a public page hydrates or the header switches characters
- **THEN** its reference content, focus and scroll stay in place and no search, roster, item directory or talent payload loads before a relevant action

### Requirement: Character level has one remembered source

The active character's level SHALL be the single remembered character-level source for the planner and other character-level controls. Without a complete character, a classless setup draft SHALL supply comparison level without inventing race/class context. The old `compendium.reader-levels.v1` character value SHALL migrate once only when no new character or setup draft exists; skill entries SHALL remain independent and unchanged. Migration SHALL not remove the old character value until the new state is successfully persisted. New Character SHALL not reuse the old migrated value as another migration. Storage read failures in level and gear-score controls SHALL not prevent page hydration. Page-specific clamps SHALL not modify the stored level merely by viewing a page.

#### Scenario: One-time migration
- **WHEN** a returning browser has an old character level and two remembered skill levels but no new collection or draft
- **THEN** the character level becomes a classless setup draft after safe persistence, both skill values stay unchanged and reload or later New Character does not migrate it again

#### Scenario: Bounded comparison
- **WHEN** a page supports a narrower level range than the active character's stored level
- **THEN** the comparison clamps its displayed value without changing the stored character level
