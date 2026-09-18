## ADDED Requirements

### Requirement: Details answer player questions

Production selection SHALL show a condensed public detail panel: the selected entity's fact card, the first rows of each relation table, a link to the entity's full page, and the selected location. The panel SHALL load the entity's published document on demand and SHALL NOT load an authoring or evidence panel. Requirements and conditions SHALL stay attached to the entries they gate. Large lists SHALL remain searchable without covering the map. A development build MAY additionally load authoring and evidence panels for review.

Development authoring and evidence panels SHALL NOT appear in production. The production panel SHALL NOT show provenance, hashes, or raw configuration dumps.

#### Scenario: A vendor has several progression stock groups
- **WHEN** a reader selects that vendor
- **THEN** the panel distinguishes unconditional and conditional stock
- **AND** the reader can search the complete stock list while retaining the selected location
- **AND** the panel links to the vendor's page for the full stock

#### Scenario: A fact is not established
- **WHEN** a value such as an effective drop chance is not established for the supported build
- **THEN** the entry shows a placeholder in that value's position
- **AND** the panel does not add a note row explaining the omission

#### Scenario: A production reader opens the full page
- **WHEN** the reader activates the page link in the panel
- **THEN** the entity page opens with the same entity
- **AND** browser back returns to the map with the selection retained

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
