# Spec Delta

## Purpose

Let readers keep an intended party with a character, choose named members from published game data, and check individual Dungeon Finder facts without recommendations or claims about live availability or outcomes.

## ADDED Requirements

### Requirement: The party belongs to its character

The planner SHALL keep each party inside its character's build and expose it through the Party view of the workspace. It SHALL use the character, preview, reversible-editing, persistence, export and import contracts owned by `build-character-planner` / `character-planner`, rather than maintain separate party storage. Switching the active character SHALL switch the visible party without editing either character.

#### Scenario: Two characters have different parties
- **WHEN** the reader switches the header's active character from Brielle to Alden
- **THEN** the Party view and page actions use Alden's party
- **AND** Brielle's party remains unchanged

#### Scenario: Party edit is reversed
- **WHEN** the reader adds, removes or replaces a member or changes an entered level or player role and then uses Undo
- **THEN** the previous party state is restored through the foundation's editing contract

### Requirement: The player chooses a Finder role

The Party view SHALL show the player separately from member places and let the reader choose Tank, Healer or Damage as in the game's Group Finder. It SHALL distinguish a planning choice from permission to queue in that role. Permission SHALL remain Not Verified until the published class/role matrix is verified; a known restriction SHALL be explained without silently changing a retained choice.

#### Scenario: A role is chosen before permission is verified
- **WHEN** a reader chooses Healer for a character whose queue permission is not verified
- **THEN** the player card shows Healer as the chosen planning role
- **AND** queue permission says Not Verified

#### Scenario: A choice conflicts with a verified permission
- **WHEN** the character's class is restricted to Damage by the verified published matrix and its retained role is Tank
- **THEN** the planner names the restriction beside that choice
- **AND** it does not silently switch the role or claim that the character may queue as Tank

### Requirement: Four member places share capacity with companions

The Party view SHALL show four member places and the number used. Adventurers and companions verified to consume a place SHALL share this capacity. The planner SHALL prevent an addition beyond that capacity and SHALL NOT treat every summoned pet or quest-companion record as capacity-consuming without verified category and summoned-actor behavior.

#### Scenario: A companion occupies a place
- **WHEN** a party has three adventurers and one companion verified to consume a place
- **THEN** it shows four of four places used
- **AND** adding another capacity-consuming member requires an explicit removal or replacement

#### Scenario: A summoned pet is not a verified member
- **WHEN** an effect summons a generic pet rather than a verified party companion
- **THEN** the pet is not promoted into the party picker or charged a party place solely because it is summoned

### Requirement: Adventurers come from the fixed published roster

The member picker SHALL offer every named adventurer on the published world roster, using its build-scoped native NPC identity rather than a roster position, display name or grouped page identity. It SHALL NOT generate per-character names, classes, races or roles or infer roster membership from NPC category alone. Current levels, gear, journeys and availability SHALL NOT be treated as fixed roster facts.

#### Scenario: The accepted roster is offered completely
- **WHEN** the party picker uses the accepted Afallon 0.16.3 publication
- **THEN** its unfiltered identity set equals the fixed authored roster's 115 NPC identities
- **AND** nonroster adventurer records are not included just because their category is Adventurer

#### Scenario: Two characters choose the same adventurer
- **WHEN** two separate browser characters select Eldeth Goldvein
- **THEN** both selections resolve to the same authored NPC identity
- **AND** their entered current levels remain separate character-owned inputs

### Requirement: Member picking stays inside its place

A member place SHALL provide its own picker, filterable by role, class, race, preferred tree, starting level and join time. Browsing and filtering SHALL NOT change the party. Explicit selection SHALL add or replace only the chosen place; the same native member identity SHALL NOT occupy two places in one party.

#### Scenario: Filtering does not add a member
- **WHEN** a reader opens a place and filters for Tank, Druid, Dwarf and a preferred tree, starting level and join time
- **THEN** the picker shows only matching published candidates
- **AND** the party stays unchanged until the reader explicitly selects one

#### Scenario: A member is already present
- **WHEN** a reader tries to select the same adventurer in a second place, including through an adventurer-page action
- **THEN** the planner identifies the occupied place and prevents the duplicate
- **AND** it does not move or replace a member without an explicit choice

### Requirement: Starting and current levels are labelled apart

Each member SHALL show its published starting level separately from an optional entered current level. Join time SHALL mean the character's accumulated game play, not elapsed offline time. A check SHALL identify whether its level comes from reader entry, a verified save transfer, or the published starting level; missing or unreadable current facts SHALL NOT become zero or be presented as observed current facts.

#### Scenario: No current level was entered
- **WHEN** Eldeth has a published starting level but no entered current level
- **THEN** the member card labels the starting level as such
- **AND** any level-window comparison using it explicitly says that the published starting level was used, not Eldeth's current level

#### Scenario: A current level is entered
- **WHEN** a reader enters a valid current level different from the starting level
- **THEN** the card retains both labelled values
- **AND** the dungeon check uses and identifies the entered current level

#### Scenario: A join delay is displayed
- **WHEN** the roster says a member joins after two hours
- **THEN** the picker describes two hours of play on that character
- **AND** it does not count wall-clock time or assert that the member has already joined

### Requirement: Role coverage is a count

The planner SHALL count the player's chosen role exactly once and every selected member's verified role against the Finder target of one tank, one healer and three damage. It SHALL show missing and over-target counts without clamping excess members to the target or assigning a party score. An unknown member role SHALL remain Not Verified rather than default to Damage.

#### Scenario: A role is missing
- **WHEN** the chosen player and members provide one tank, no healer and three damage
- **THEN** coverage reads “Tank 1 of 1”, “Healer 0 of 1” and “Damage 3 of 3”
- **AND** the missing healer is visible without a suggested replacement or party score

#### Scenario: A role is over target
- **WHEN** the player and members provide two tanks, one healer and two damage
- **THEN** coverage shows “Tank 2 of 1”, “Healer 1 of 1” and “Damage 2 of 3”
- **AND** it does not label this a complete Finder role composition

### Requirement: Dungeon checks name each member and the published window

A dungeon check SHALL name the dungeon, each selected member, its level value and source, the published dungeon range and the inclusive adventurer window: two below minimum, never below 1, through four above the higher of minimum and maximum. It SHALL report each member's comparison separately. Missing required values SHALL produce Incomplete; the adventurer rule SHALL NOT be silently applied to the player as a verified player eligibility rule.

#### Scenario: Member at the lower boundary
- **WHEN** Duskfall Depths has published range 18–20 and a member has entered level 16
- **THEN** the check names that member, entered level 16, range 18–20 and allowed window 16–24
- **AND** it reports the member within the window, without asserting whole-party eligibility

#### Scenario: Member outside the upper boundary
- **WHEN** a member has entered level 25 for the same dungeon
- **THEN** the check names the member and level source and reports it above the 16–24 window

#### Scenario: Minimum and maximum need safe bounds
- **WHEN** a published dungeon has minimum 1 and maximum 1
- **THEN** the window starts at 1, not minus 1, and ends at 5
- **AND** when a supplied maximum is below the minimum, the upper calculation uses the higher value

#### Scenario: Required dungeon or member facts are absent
- **WHEN** a dungeon lacks a published minimum or a selected member has neither a known current nor starting level
- **THEN** the affected comparison is Incomplete
- **AND** known member facts stay visible and the missing input does not become zero

### Requirement: Unverified Finder checks stay explicit

Dungeon checks SHALL identify player class/role permission, member presence, joining, reservations and the undergeared-tank check separately. Each SHALL remain Not Verified until its game rule and the required character-specific inputs are verified. Static join delays, authored kits and captured tank settings alone SHALL NOT establish availability or gear eligibility. Passing known checks SHALL NOT become a whole-party “Finder eligible” verdict.

#### Scenario: Only static party facts are available
- **WHEN** every selected member is within the level window and role counts meet the target but live or verified save inputs are unavailable
- **THEN** role permission, presence, joining, reservations and the undergeared-tank check remain Not Verified as applicable
- **AND** the result does not claim the party can queue, invite every member or start the dungeon

#### Scenario: A rule is known but its input is unknown
- **WHEN** the undergeared-tank rule has been published but the selected tank's current equipment is unknown
- **THEN** that check remains Not Verified and names the missing current gear input
- **AND** the member's authored kit is not substituted for current equipment

### Requirement: Member details link published preferences

Member details SHALL link the member, class, race, preferred tree, abilities learned first, gear kit, favoured stat and armor and weapon preferences wherever those pages are published. It SHALL preserve tree anchors and all authored preferences. It SHALL distinguish learning preferences from rotations and kits from current equipment; empty priority or kit lists SHALL NOT imply no learned abilities or no equipped items.

#### Scenario: A preferred tree is linked
- **WHEN** a member's preferred tree is published as a class-page reference with a tree anchor
- **THEN** its detail link opens that class page at the preferred tree
- **AND** it does not treat the class reference key as a separate tree identity

#### Scenario: A member has no authored kit
- **WHEN** the member's published kit or priority ability list is empty
- **THEN** details say no kit or priority abilities are listed as applicable
- **AND** do not claim that the member is unequipped or knows no abilities

### Requirement: Companion selection requires verified behavior

The planner SHALL offer companions only after their actual summoned native variant, capacity cost and Finder role are verified and published. Companion and quest-companion records SHALL be researched separately from roster adventurers, generic summoned pets and Hunter pets. Details SHALL describe gear access, recruitment and movement or combat controls only where verified, without inventing a role or acquisition location.

#### Scenario: A grouped page contains several companion variants
- **WHEN** a verified companion on a grouped NPC page becomes selectable
- **THEN** selection retains the actual native variant identity and links its corresponding page context
- **AND** capacity and role come from that variant's verified behavior rather than the page's leading record or name

#### Scenario: A quest-companion category is unresolved
- **WHEN** the catalog includes a quest-companion record but its actual summon and shared-capacity behavior are unverified
- **THEN** the planner does not infer a place cost or Finder role from the category
- **AND** its reference facts remain available without an unsupported party selection

### Requirement: Invitation information follows verified effective behavior

Party-related invitation information SHALL reflect verified effective invitation behavior rather than equate an authored effect duration with the recruiter's lifetime. Until the conflicting lifetime evidence is resolved, the planner SHALL NOT provide a one-hour countdown or promise permanent membership. Published invitation statements found inaccurate by that verification SHALL be corrected through the audited data/publication workflow.

#### Scenario: Authored duration conflicts with recruitment
- **WHEN** an invitation effect has authored duration 3600 seconds but recruiter evidence overrides the summoned state's maximum duration to infinity
- **THEN** the planner makes no unsupported one-hour expiry or permanence claim
- **AND** the published one-hour statement is checked against elapsed-play, scene-change and reload evidence before accepting a correction

### Requirement: Parties travel in the foundation build link

Party links SHALL use the versioned build-link and validation contract owned by `build-character-planner` / `character-planner`, carrying the player's chosen role and up to four member identities with optional entered levels. Party fields SHALL be validated before the feature ships. Opening a link SHALL remain a preview that writes no storage; saving or replacing a character SHALL require the foundation's explicit actions.

#### Scenario: A complete party link is opened
- **WHEN** a reader opens a valid `/planner/#build=v1.<payload>` link containing a player role and four members
- **THEN** the preview displays that role, member identities and entered levels
- **AND** no saved character changes until “Save as New Character” or “Replace (name)'s Build” is explicitly chosen

#### Scenario: Party fields violate the contract
- **WHEN** a payload has unknown party fields, duplicate identities, more than four members or invalid entered levels
- **THEN** validation rejects the invalid payload with an explanation
- **AND** no saved character is changed or silently truncated

### Requirement: Unresolved members stay visible

When a build's catalog differs from the current publication, the planner SHALL preserve member identities and entered levels and identify any unresolved selections as Incomplete. It SHALL NOT automatically substitute a same-named NPC, drop a member or infer current facts from another catalog. Known facts and remaining members SHALL stay usable under the foundation's provenance contract.

#### Scenario: A shared member no longer resolves
- **WHEN** a link from another catalog contains a member identity that the current publication cannot resolve
- **THEN** the preview retains the identity and entered level with an Incomplete explanation
- **AND** no name-based replacement, invented role or availability is supplied

### Requirement: Adventurer pages hand off to the named party

An eligible adventurer page SHALL offer “Add to (name)'s Party” using the active character context after mount. Invoking it SHALL load the published party lookup only when needed, preserve the member identity and open explicit selection for that character's party. If no character is active, setup SHALL precede the handoff. A full or duplicate party SHALL be explained without automatic replacement.

#### Scenario: A page action adds an adventurer
- **WHEN** Brielle is active and the reader invokes “Add to Brielle's Party” on Eldeth's page
- **THEN** the party handoff retains Brielle as its target and Eldeth's published native identity
- **AND** an explicit available-place selection adds Eldeth without changing another character

#### Scenario: The target changes while the action loads
- **WHEN** the reader switches the active character while an add action is loading
- **THEN** the action does not silently add the member to the newly active character
- **AND** the foundation's character-ID and revision safeguards prevent an unintended edit

### Requirement: Dungeon pages check the named party without editing

A published Finder dungeon page SHALL offer “Check (name)'s Party” using the active character context after mount. Invoking it SHALL load the published party lookup only when used and show the named character's party against that dungeon without modifying the build. No active character SHALL lead to setup rather than an invented party.

#### Scenario: A dungeon page checks a character
- **WHEN** Brielle is active and the reader invokes “Check Brielle's Party” on Duskfall Depths
- **THEN** the result names Brielle, the selected dungeon and individual member checks
- **AND** the character's build, member levels and party choices remain unchanged

### Requirement: Party context does not burden static pages

Reference pages SHALL remain prerendered and usable without character state. Character context SHALL load after mount; party data SHALL be fetched only when the Party view or a party action is used, through small build-bound published lookups rather than the full search index. Lookup failures SHALL leave reference content usable and explain that the party action or check is unavailable.

#### Scenario: A reader only opens a reference page
- **WHEN** a reader opens an adventurer or dungeon page without invoking a party action
- **THEN** its reference content is present without planner storage access during prerendering
- **AND** neither the party lookup nor the full search index is fetched for party context

#### Scenario: A lookup cannot be verified
- **WHEN** a party action receives an unreadable, corrupt or mismatched-build lookup
- **THEN** the action reports its failure without inventing results or editing a character
- **AND** the underlying reference page stays usable

### Requirement: The planner neither recommends nor predicts

The party planner SHALL NOT offer best-in-slot advice, member rankings, party scores, recommended teams, simulations or outcome predictions. It SHALL describe the reader's selections, published facts, counts and individually supported checks without claiming success, survival, damage or optimal composition. Unknown inputs SHALL remain Incomplete or Not Verified, never guessed zeros.

#### Scenario: Every supported check passes
- **WHEN** all currently supported role and level checks pass
- **THEN** the planner reports those specific checks and any unverified checks
- **AND** it does not predict victory, assign a score, rank the party or suggest a better team
