## Purpose

Explain changes in published game content between accepted Afallon builds without confusing a new scan or a new site feature with a game update.

## ADDED Requirements

### Requirement: Every retained accepted comparison has its own page

The publication SHALL provide `/updates/<build-id>` for each accepted build with a retained comparison. The page SHALL identify its current build, compared build, game version, and comparison coverage. The site SHALL link the current page from the hub or footer and SHALL offer links to retained accepted comparisons. It SHALL not create a comparison page for an unaccepted candidate or for a build without a retained baseline.

#### Scenario: Current accepted build
- **WHEN** a reader opens the current build's What changed link
- **THEN** the page names the current and compared builds and shows its comparison

#### Scenario: Candidate fails acceptance
- **WHEN** a candidate publication fails a required acceptance check
- **THEN** the selected site's update pages and links remain unchanged

#### Scenario: Same-build republication
- **WHEN** a later site change republishes the same accepted game build
- **THEN** its comparison with the previous game build remains available without a new same-build comparison

### Requirement: Changes describe published pages and facts

The page SHALL group added, removed, and changed pages by published kind. A changed page SHALL show reader-facing fact names and old and new values when both are known. It SHALL compare records by stable game identity and account for pages that group multiple records. It SHALL link a current page only when that page exists. Removed pages SHALL retain readable names without broken links. The page SHALL identify any kind or fact that the older catalog cannot compare instead of treating missing historical capture as a game addition.

#### Scenario: A quest reward changes
- **WHEN** a published quest exists in both catalogs and its reward changes
- **THEN** the quest appears under Changed with a named old reward and new reward

#### Scenario: A grouped page changes members
- **WHEN** one NPC record moves into or out of a published NPC page
- **THEN** the comparison reports the page or its membership without losing the other records

#### Scenario: A historical fact is unavailable
- **WHEN** the previous catalog has no supported representation of a published fact
- **THEN** the page labels that fact as not comparable and does not call it added

### Requirement: Scan changes do not become game changes

The comparison SHALL include differences in published authored facts and relations. It SHALL exclude differences caused only by scan timing, coordinates, placement identities, source identities, capture paths, or evidence provenance. A scan-only difference SHALL not create an added, removed, or changed page. A real change to a reader-facing source relation SHALL remain reportable when its scan identity changes.

#### Scenario: Placement moves after a rescan
- **WHEN** a rescan changes a placement coordinate without changing its authored content
- **THEN** the page does not list a game change

#### Scenario: An item gains a merchant
- **WHEN** a published item gains an authored merchant source
- **THEN** the item appears under Changed even if its source identity also changes

### Requirement: Patch notes match the accepted version

The update page SHALL link the Steam news entry for app 2597810 whose title identifies the complete accepted game version. It SHALL use the entry URL from verified Steam news metadata. It SHALL not infer catalog changes from patch-note text. If the entry is unavailable, the page SHALL say so and SHALL not link another version's notes. The footer patch-notes link SHALL use the same matched entry when one exists.

#### Scenario: Similar release titles
- **WHEN** Steam news has titles "Afallon 0.16.2" and "Afallon 0.16.2.1"
- **THEN** the page for version 0.16.2.1 links only the latter entry

#### Scenario: Notes cannot be matched
- **WHEN** no verified news entry identifies the complete accepted version
- **THEN** the page reports that patch notes are unavailable and makes no guessed link

### Requirement: The static publication owns the comparison

The selected publication SHALL contain its update pages as verified static resources. Each comparison SHALL bind its current and previous catalog identities, game build identities, and matched news evidence. The publication graph SHALL reject missing resources, wrong build identities, duplicate build pages, and links to unpublished current pages. The update page SHALL not query SQLite or Steam from a reader's browser.

#### Scenario: Publication loses an update resource
- **WHEN** a candidate root references an absent comparison document
- **THEN** publication verification fails before the candidate can be accepted
