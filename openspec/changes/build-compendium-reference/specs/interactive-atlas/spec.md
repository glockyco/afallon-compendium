## ADDED Requirements

### Requirement: Details answer player questions

Production builds SHALL NOT render a detail, authoring, or evidence panel. Selection, filtering, search, hover, and URL state SHALL behave exactly as they do in a development build; only the panel is absent. A development build MAY load detail, authoring, and evidence panels for review.

A stale or failed selection SHALL still explain itself in production, because no panel is there to carry the message.

#### Scenario: A production reader selects a marker
- **WHEN** a marker is selected in a production build
- **THEN** the map retains the selection, its highlight, and its URL state
- **AND** no details column opens and the map keeps its full width

#### Scenario: A stale link is opened in production
- **WHEN** the selected placement is not in the publication
- **THEN** the atlas explains the missing selection and offers to clear it
- **AND** it does not select an unrelated entity

#### Scenario: A fact is not established
- **WHEN** a value such as an effective drop chance is not established for the supported build
- **THEN** the entity's page shows a placeholder in that value's position
- **AND** no panel or banner explains the omission

### Requirement: Search connects items to places

Search SHALL find places, creatures, NPCs, resources, items, quests, abilities, and recipes by their displayed names from the same corpus the compendium pages use. Item results SHALL expose their known source types, including drops, vendors, containers, and resource yields. Selecting a source SHALL navigate to its place on the map without losing the item context. A result without a placement SHALL open its page.

#### Scenario: A player searches for a vendor item
- **WHEN** the item has stock entries on several vendors
- **THEN** search exposes the vendors and stock conditions
- **AND** selecting one opens its location and corresponding stock entry

#### Scenario: A player searches for a quest
- **WHEN** the quest has no placement of its own
- **THEN** the result opens the quest page
- **AND** the quest page links to the giver's location

### Requirement: Evidence limits stay outside the interface

The atlas SHALL run from generated static artifacts without access to the game, raw snapshots, or an extraction endpoint. Reader surfaces SHALL NOT display completeness disclosures, coverage counts, or unresolved-semantics notices as rows, sections, or banners. A reader surface MAY show a placeholder for one specific missing fact in the position that fact would occupy. The build identity MAY appear in the page footer.

Preview mode, coverage figures, diagnostic totals, and exclusion reasons SHALL live in the generated publication metadata, run manifest, coverage report, and the site's single coverage page. Progressive map loading SHALL NOT require downloading full-resolution imagery before interaction.

#### Scenario: A reader opens a partial research snapshot
- **WHEN** coverage is incomplete
- **THEN** the publication metadata remains in preview mode
- **AND** no marker, panel, or control displays completeness or coverage notices
- **AND** the coverage page states the mode

#### Scenario: An operator audits publication coverage
- **WHEN** the operator reads the generated publication metadata and run manifest
- **THEN** those artifacts report the build, mode, coverage figures, and exclusions
- **AND** reader surfaces other than the coverage page do not restate those values

#### Scenario: A specific fact is missing on a panel
- **WHEN** a drop chance is not measured for the supported build
- **THEN** the chance cell shows a dash with a hover explanation
- **AND** the panel adds no other limitation text
