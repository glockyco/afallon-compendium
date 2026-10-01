# reference-layout Specification

## Purpose

Define the shared layout rules of tooltips, quest previews, search feedback, and navigation.

## Requirements

### Requirement: Tooltips open beside their links

On desktop, an entity hover card SHALL start at `right-start` beside its link and use `left-start` when the right side lacks room. It SHALL not cover adjacent links or block movement between entries, including upward movement. Its preview contains no interactive controls and does not intercept pointer movement; it closes when the pointer leaves the link, including when the link retains focus after a mouse click. It SHALL shift only vertically to remain in the viewport and recompute available height when its content loads, the page scrolls, or the viewport resizes. One card SHALL be open at a time. On narrow screens it SHALL use a fixed bottom overlay. Hover, keyboard focus, and tap SHALL all make its content available without preventing eventual link navigation. The preview SHALL be an in-game tooltip plus at most one context line for an item or ability, or a compact identity card plus at most one context line for other kinds.

#### Scenario: Nearby table rows
- **WHEN** a reader hovers a desktop relation row with room on the right and moves upward to the prior row
- **THEN** its card opens to the right and does not intercept the pointer's movement to the other row

#### Scenario: A link near the right edge
- **WHEN** a link lacks room on its right
- **THEN** its card opens to its left

#### Scenario: Pointer moves to the next link
- **WHEN** a reader clicks one link and moves to another
- **THEN** only the second card remains open

#### Scenario: Content loads after opening
- **WHEN** a preview document loads after opening
- **THEN** the card recomputes its position and height

#### Scenario: Keyboard and touch access
- **WHEN** a reader focuses or taps a creature link
- **THEN** the same compact identity preview becomes available without relying on hover

### Requirement: Quest previews keep completion text short

A quest preview SHALL prioritize level, giver, main reward, and at most one context line. It SHALL NOT show full objective or completion text; these remain on its page in the final Quest text disclosure.

#### Scenario: Long completion text
- **WHEN** a quest has long completion text
- **THEN** its preview remains compact and the complete text is available on the quest page

### Requirement: Search and map navigation stay in place

Search SHALL show a spinner inside its input while loading, without changing page height. Its placeholder SHALL name only kinds that are searchable in the current publication. The site navigation SHALL name its map "Map" and link to `/map`. All reader text SHALL call the interactive map "the map" and SHALL NOT call it "the atlas".

#### Scenario: Search data is loading
- **WHEN** a reader starts a search before its data loads
- **THEN** the input displays a loading spinner
- **AND** the navigation link to `/map` reads "Map"

#### Scenario: Link to a map location
- **WHEN** a page links a character's location on the map
- **THEN** the link reads "View on map"
- **AND** it opens the matching location at `/map` with its map query state

#### Scenario: Publication changes searchable kinds
- **WHEN** a searchable kind is added to or removed from the publication
- **THEN** the search placeholder names only kinds that are searchable in the current publication
- **AND** it does not claim to search an unpublished kind

### Requirement: Map has its own route

The interactive map SHALL load at `/map`. All internal map links and map share controls SHALL use `/map` with the existing selection and filter query parameters. The route `/` SHALL NOT interpret old map query parameters as map state or redirect them to `/map`.

#### Scenario: Reader opens a selected map location
- **WHEN** a reader follows a map location link from a published page or search result
- **THEN** `/map` opens with that location selected
- **AND** the browser address keeps the selection in the map query

#### Scenario: Reader opens an old home query
- **WHEN** a reader opens `/?selected=...`
- **THEN** the hub stays at `/` without a map selection or redirect

### Requirement: Top navigation groups published destinations

The shared top navigation SHALL show direct links to Map, Items, Recipes, Quests, Classes, and Skills, in that order, and one Browse menu. The Browse menu SHALL open one panel that lists the published destinations in labeled columns: World (Map, Places, NPCs, Quests, Properties), Items (Items, Recipes, Gathering Nodes), Character (Classes, Skills, Abilities), and Mechanics (Character Progression, Corruption). A published page kind that no column names SHALL appear in an Other column. The navigation SHALL NOT show an empty column, a column with one catch-all destination, or one menu for each column. It SHALL show only destinations that exist in the current publication. The Browse menu SHALL close on Escape, on an outside click, when focus leaves it, and on navigation. Its links SHALL remain accessible by keyboard at 1440 px and 390 px without horizontal page overflow.

#### Scenario: Desktop navigation
- **WHEN** a reader opens a page at a 1440 px viewport
- **THEN** Map, Items, Recipes, Quests, Classes, and Skills are links in the bar
- **AND** one Browse button opens all columns in one panel, with Gathering Nodes in the Items column

#### Scenario: Narrow navigation
- **WHEN** a reader opens a page at a 390 px viewport
- **THEN** the bar shows the brand and Browse, and the panel lists the same columns as at 1440 px
- **AND** the navigation causes no horizontal page scroll

#### Scenario: Mechanics topics
- **WHEN** a reader opens the Browse panel of a publication with the five mechanics topics
- **THEN** a column labeled Mechanics links Character Progression and Corruption
- **AND** it does not link Heroic Tier, Crafting and Gathering, or Loot
- **AND** no column is labeled Guides

### Requirement: Footer identifies the accepted data

The shared footer SHALL show the accepted game release version, the publication data date, and a link to the Steam patch notes for that same release. It SHALL NOT infer a version from the build number or use a generic patch-notes index as a matching article. The displayed version, date, and link SHALL belong to the selected publication.

#### Scenario: Reader checks the current release
- **WHEN** a reader opens the hub or a detail page for a selected publication
- **THEN** its footer shows the release version and data date of that publication
- **AND** the patch-notes link opens the verified Steam article for that release

#### Scenario: Candidate release evidence does not match
- **WHEN** a candidate's patch-notes article does not match its declared version or build
- **THEN** the candidate cannot replace the accepted publication

### Requirement: Development map cards show useful facts

Map selection cards SHALL remain development-only. A selected published page SHALL show its page link, a plain kind label, and concise facts supported by that kind's document. A selection without a page SHALL show available placement facts without inventing a page link. Raw document and placement JSON SHALL stay behind labeled disclosures. Production SHALL show no development card or raw JSON.

#### Scenario: Published page selected in development
- **WHEN** a developer selects a map placement linked to a published page
- **THEN** its card shows a working page link and relevant published facts
- **AND** the raw JSON is hidden until a disclosure opens

#### Scenario: Placement lacks a page
- **WHEN** a developer selects a placement without a published page
- **THEN** its card shows the available placement label and facts
- **AND** it does not offer a broken page link

#### Scenario: Production map selection
- **WHEN** a reader selects a map placement in production
- **THEN** no development selection card or raw JSON appears

### Requirement: Shared presentation remains accessible

Across home, lists, guides, detail pages, and hover cards, the root text size SHALL be 100% of the reader's browser preference and CSS type sizes SHALL use rem units. Body text SHALL be at least 1rem with line height at least 1.5; other readable text SHALL not be smaller than .875rem. Labels SHALL use readable case without letter-spaced capitals. Text SHALL contrast at least 4.5:1 with every background on which it appears, including dark, hover, rarity, and overlay surfaces. Interactive controls SHALL have targets at least 24 by 24 px. Rarity and status SHALL be identified by text and not by color alone. Focus, tap, and hover SHALL provide equivalent access to interactive information.

#### Scenario: Browser prefers larger text
- **WHEN** the browser uses a larger default text size on a list or the home page
- **THEN** typography scales with it without clipping search results or requiring horizontal page scroll at 390 px

#### Scenario: Keyboard and touch reader
- **WHEN** a reader navigates relation links and disclosures without a pointer
- **THEN** all information and actions remain reachable with at least 24 px targets

#### Scenario: Contrast audit
- **WHEN** rendered text is measured against each surface and state on which it appears
- **THEN** every text pairing meets a contrast ratio of at least 4.5:1

### Requirement: Abilities list identifies what an ability does and where it comes from

The Abilities list SHALL show each ability's published icon and name alongside a Source column, one line per row, without descriptions. Source SHALL prefer a learning class and talent tree, otherwise show one or two creature names or a creature count, otherwise show item names, otherwise state No Known Use. Source and Class SHALL be filters. Abilities with No Known Use SHALL remain published and reachable on their detail pages but SHALL be hidden in default list results; the Source filter SHALL reveal them with their count visible. The list SHALL fit a 390 px viewport without horizontal page scrolling.

#### Scenario: Learned ability
- **WHEN** a reader opens the Abilities list and finds Ambush
- **THEN** its row shows Assassin · Shadowcraft

#### Scenario: Creature and item abilities
- **WHEN** a reader finds Basic Strike and Brown Horse Mount
- **THEN** Basic Strike reports the number of creature users rather than a long name list, and Brown Horse Mount names its item source
- **AND** the Healing Potion ability page links the items that cast it under Used by items

#### Scenario: Unattributed abilities
- **WHEN** a reader opens the list without filters
- **THEN** the count excludes abilities with No Known Use and offers a counted action to reveal them
- **AND** selecting No Known Use in Source reveals those abilities without removing their detail pages

#### Scenario: Filter by class
- **WHEN** a reader selects Assassin in Class
- **THEN** only abilities learned by Assassin remain, and resetting the filter restores the default list
