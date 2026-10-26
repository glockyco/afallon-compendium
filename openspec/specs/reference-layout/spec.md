# reference-layout Specification

## Purpose

Define the shared layout rules of tooltips, quest previews, search feedback, and navigation.

## Requirements

### Requirement: Tooltips open beside their links

On desktop, an entity hover card SHALL start at `right-start` beside its link and use `left-start` when the right side lacks room.

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

#### Scenario: Link that wraps onto two lines
- **WHEN** a reader points at the second line of a link whose name wraps across two lines of a paragraph
- **THEN** the hover card opens beside that line, fully inside the viewport, instead of beside the paragraph's right edge

#### Scenario: Tooltips open beside their links
- **WHEN** A desktop entity link has room on its right.
- **THEN** Its hover card starts at right-start beside the link.

### Requirement: Unobstructed movement between links

An entity hover card SHALL NOT cover adjacent links or block movement between entries, including upward movement.

#### Scenario: Unobstructed movement between links
- **WHEN** A reader moves upward between adjacent entries while a hover card is open.
- **THEN** The card does not cover adjacent links or block that movement.

### Requirement: Noninteractive pointer-transparent previews

An entity hover card preview SHALL contain no interactive controls and SHALL NOT intercept pointer movement.

#### Scenario: Noninteractive pointer-transparent previews
- **WHEN** A preview is displayed and the pointer moves across its area.
- **THEN** The preview has no interactive controls and does not intercept pointer movement.

### Requirement: Close previews on pointer departure

An entity hover card preview SHALL close when the pointer leaves the link, including when the link retains focus after a mouse click.

#### Scenario: Close previews on pointer departure
- **WHEN** The pointer leaves a link that retains focus after a mouse click.
- **THEN** The preview closes.

### Requirement: Vertical viewport adjustment

An entity hover card SHALL shift only vertically to remain in the viewport and recompute available height when its content loads, the page scrolls, or the viewport resizes.

#### Scenario: Vertical viewport adjustment
- **WHEN** The page scrolls while a hover card is open.
- **THEN** The card recomputes available height and shifts only vertically to remain in the viewport.

### Requirement: Single open hover card

One entity hover card SHALL be open at a time.

#### Scenario: Single open hover card
- **WHEN** A reader opens another entity hover card while one is already open.
- **THEN** Only one card is open.

### Requirement: Narrow-screen bottom overlay

On narrow screens an entity hover card SHALL use a fixed bottom overlay.

#### Scenario: Narrow-screen bottom overlay
- **WHEN** An entity hover card opens on a narrow screen.
- **THEN** The card uses a fixed bottom overlay.

### Requirement: Accessible preview activation and navigation

Hover, keyboard focus, and tap SHALL all make an entity hover card's content available without preventing eventual link navigation.

#### Scenario: Accessible preview activation and navigation
- **WHEN** A reader activates an entity link preview by tap.
- **THEN** Its content becomes available without preventing eventual link navigation.

### Requirement: Compact entity preview content

The preview SHALL be an in-game tooltip plus at most one context line for an item or ability, or a compact identity card plus at most one context line for other kinds.

#### Scenario: Compact entity preview content
- **WHEN** An item preview is displayed.
- **THEN** The preview is an in-game tooltip plus at most one context line.
### Requirement: Quest previews keep completion text short

A quest preview SHALL prioritize level, giver, main reward, and at most one context line. It SHALL NOT show full objective or completion text; these remain on its page in the final Quest text disclosure.

#### Scenario: Long completion text
- **WHEN** a quest has long completion text
- **THEN** its preview remains compact and the complete text is available on the quest page

### Requirement: Search and map navigation stay in place

Search SHALL show a spinner inside its input while loading, without changing page height.

#### Scenario: Search data is loading
- **WHEN** a reader starts a search before its data loads
- **THEN** the input displays a loading spinner
- **AND** the navigation link to `/map` reads "Map"

#### Scenario: Link to a map location
- **WHEN** a page links a character's location on the map
- **THEN** the link reads "Show on Map"
- **AND** it opens the matching location at `/map` with its map query state

#### Scenario: Publication changes searchable kinds
- **WHEN** a searchable kind is added to or removed from the publication
- **THEN** the search placeholder names only kinds that are searchable in the current publication
- **AND** it does not claim to search an unpublished kind

#### Scenario: Placed gathering node search hit
- **WHEN** a reader searches for Aetherium Vein
- **THEN** its result offers Show on Map and opens all of that node's published spots

#### Scenario: Search and map navigation stay in place
- **WHEN** Search is loading on a page.
- **THEN** A spinner appears inside the search input and the page height stays unchanged.

### Requirement: Search placeholder reflects searchable kinds

Search's sentence-case placeholder SHALL name only kinds that are searchable in the current publication.

#### Scenario: Search placeholder reflects searchable kinds
- **WHEN** The current publication has Items as its only searchable kind.
- **THEN** The sentence-case search placeholder names only Items.

### Requirement: Navigation names and links the map

The site navigation SHALL name its map "Map" and link to `/map`.

#### Scenario: Navigation names and links the map
- **WHEN** A reader views the site navigation.
- **THEN** The map link reads "Map" and links to `/map`.

### Requirement: Reader text names the interactive map

All reader text SHALL call the interactive map "the map" and SHALL NOT call it "the atlas".

#### Scenario: Reader text names the interactive map
- **WHEN** Reader text refers to the interactive map.
- **THEN** It calls the interactive map "the map", not "the atlas".

### Requirement: Map location actions share a label

Map location actions across search results and detail pages SHALL use the shared title-case label "Show on Map".

#### Scenario: Map location actions share a label
- **WHEN** A reader views a map location action in a search result or detail page.
- **THEN** The action uses the label "Show on Map".

### Requirement: Gathering node results link all published spots

A gathering-node search result with published map spots SHALL offer a map link to all its spots.

#### Scenario: Gathering node results link all published spots
- **WHEN** A gathering-node search result has two published map spots.
- **THEN** The result offers a map link to both spots.
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

The shared top navigation SHALL show the brand, direct links to Map, Items, Quests, Classes, and Mechanics, in that order, one Browse menu, the search field, and the Support link.

#### Scenario: Desktop navigation
- **WHEN** a reader opens a page at a 1440 px viewport
- **THEN** Map, Items, Quests, Classes, and Mechanics are links in the bar
- **AND** one Browse button opens all columns in one panel, with Gathering Nodes, Gear Sets, Currencies, and Crafting Stations in the Items column

#### Scenario: Narrow navigation
- **WHEN** a reader opens a page at a 390 px viewport
- **THEN** the bar shows the brand, Browse, and the Ko-fi cup, and the panel lists the same columns as sections that open one at a time
- **AND** the navigation causes no horizontal page scroll

#### Scenario: Mid-width search
- **WHEN** a reader searches at a 960 px viewport
- **THEN** the search field spans its own row below the links and its results and empty message read on full lines
- **AND** at 1100 px the field stays in the bar beside the Ko-fi cup and its results open at least 24rem wide

#### Scenario: Mechanics topics
- **WHEN** a reader opens the Browse panel of a publication with ten mechanics pages
- **THEN** a column labeled Mechanics links Adventurers, Character Progression, Corruption, Crafting and Gathering, Heroic Tier, and Loot in that order
- **AND** the column ends with an "All 10 Mechanics" link to the mechanics list, and no Browse or hub text calls these pages guides

#### Scenario: Long mechanics name
- **WHEN** a reader points at Crafting and Gathering in the Browse panel at 1100 px
- **THEN** the name and its line stay inside the entry's highlight

#### Scenario: Top navigation groups published destinations
- **WHEN** A reader views the shared top navigation in a publication with all five direct destinations.
- **THEN** The bar shows the brand, direct links to Map, Items, Quests, Classes, and Mechanics in that order, one Browse menu, the search field, and the Support link.

### Requirement: Navigation marks the current page

The link of the current page, or Browse when only the panel names the current page, SHALL carry a gold rule on the bar's lower edge.

#### Scenario: Navigation marks the current page
- **WHEN** A reader visits a published page named only in the Browse panel.
- **THEN** Browse carries a gold rule on the bar's lower edge.

### Requirement: Browse opens a single labeled panel

The Browse menu SHALL open one panel that lists the published destinations in labeled columns.

#### Scenario: Browse opens a single labeled panel
- **WHEN** A reader opens Browse.
- **THEN** One panel lists published destinations in labeled columns.

### Requirement: Browse World column lists world destinations

The Browse panel's World column SHALL list published destinations Map, Places, NPCs, Quests, Properties, and Factions.

#### Scenario: Browse World column lists world destinations
- **WHEN** A reader opens Browse with all World destinations published.
- **THEN** The World column lists Map, Places, NPCs, Quests, Properties, and Factions.

### Requirement: Browse Items column lists item destinations

The Browse panel's Items column SHALL list published destinations Items, Recipes, Gathering Nodes, Gear Sets, Currencies, and Crafting Stations.

#### Scenario: Browse Items column lists item destinations
- **WHEN** A reader opens Browse with all Items destinations published.
- **THEN** The Items column lists Items, Recipes, Gathering Nodes, Gear Sets, Currencies, and Crafting Stations.

### Requirement: Browse Character column lists character destinations

The Browse panel's Character column SHALL list published destinations Classes, Races, Skills, and Abilities.

#### Scenario: Browse Character column lists character destinations
- **WHEN** A reader opens Browse with all Character destinations published.
- **THEN** The Character column lists Classes, Races, Skills, and Abilities.

### Requirement: Browse Mechanics column lists featured pages and all mechanics

The Browse panel's Mechanics column SHALL list the published featured mechanics pages Adventurers, Character Progression, Corruption, Crafting and Gathering, Heroic Tier, and Loot in alphabetical order, then a link to the list of all mechanics pages.

#### Scenario: Browse Mechanics column lists featured pages and all mechanics
- **WHEN** A reader opens Browse with all six featured mechanics pages published.
- **THEN** The Mechanics column lists Adventurers, Character Progression, Corruption, Crafting and Gathering, Heroic Tier, and Loot in that order, followed by a link to all mechanics pages.

### Requirement: Browse includes otherwise unnamed page kinds

A published page kind that no column names SHALL appear in an Other column.

#### Scenario: Browse includes otherwise unnamed page kinds
- **WHEN** A publication includes a page kind not named by any Browse column.
- **THEN** That page kind appears in an Other column.

### Requirement: Navigation avoids empty and catch-all columns

The navigation SHALL NOT show an empty column, a column with one catch-all destination, or one menu for each column.

#### Scenario: Navigation avoids empty and catch-all columns
- **WHEN** Browse destinations would leave a column empty or containing only one catch-all destination.
- **THEN** The navigation shows neither such column nor separate menus for each column.

### Requirement: Navigation includes only published destinations

The navigation SHALL show only destinations that exist in the current publication.

#### Scenario: Navigation includes only published destinations
- **WHEN** A destination does not exist in the current publication.
- **THEN** The navigation does not show that destination.

### Requirement: Browse closes on dismissal and navigation

The Browse menu SHALL close on Escape, on an outside click, when focus leaves it, and on navigation.

#### Scenario: Browse closes on dismissal and navigation
- **WHEN** A reader presses Escape while Browse is open.
- **THEN** The Browse menu closes.

### Requirement: Browse links support keyboard access without overflow

The Browse menu's links SHALL remain accessible by keyboard at 1440 px and 390 px without horizontal page overflow.

#### Scenario: Browse links support keyboard access without overflow
- **WHEN** A reader navigates Browse links by keyboard at a 390 px viewport.
- **THEN** The links remain accessible and the page has no horizontal overflow.

### Requirement: Browse entries describe their destinations

Each Browse entry SHALL show its name and one line that says what it holds, and a kind's entry SHALL also show the kind's glyph.

#### Scenario: Browse entries describe their destinations
- **WHEN** A reader views a page-kind entry in Browse.
- **THEN** The entry shows its name, one line saying what it holds, and the kind's glyph.

### Requirement: Long Browse names wrap within highlights

A long Browse entry name SHALL wrap inside the entry's own highlight.

#### Scenario: Long Browse names wrap within highlights
- **WHEN** A Browse entry name is too long for one line.
- **THEN** The name wraps inside the entry's own highlight.

### Requirement: Narrow Browse columns become exclusive sections

Below 640 px the Browse columns SHALL become full-width sections that open one at a time, starting with the section of the current page.

#### Scenario: Narrow Browse columns become exclusive sections
- **WHEN** A reader opens Browse below 640 px on a page in the Character section.
- **THEN** The columns are full-width sections, Character is initially open, and only one section opens at a time.

### Requirement: Bar ends with responsive Ko-fi support link

The bar SHALL end with a Support link to Ko-fi that keeps only the Ko-fi cup where the bar lacks room for its label.

#### Scenario: Bar ends with responsive Ko-fi support link
- **WHEN** The bar lacks room for the Support label.
- **THEN** The bar ends with a Support link to Ko-fi displaying only the Ko-fi cup.

### Requirement: Browse panel and footer end with plain Ko-fi links

The Browse panel and the page footer SHALL each end with a plain Ko-fi link.

#### Scenario: Browse panel and footer end with plain Ko-fi links
- **WHEN** A reader views the ends of the Browse panel and page footer.
- **THEN** Each ends with a plain Ko-fi link.

### Requirement: Search field preserves query room

The bar's search field SHALL keep room for a query. Where the bar cannot give the search field that room, the field SHALL take a row of its own.

#### Scenario: Search field preserves query room
- **WHEN** The bar cannot give the search field room for a query.
- **THEN** The search field takes a row of its own.

### Requirement: Search results preserve a result line width

Search results SHALL never be narrower than one result line.

#### Scenario: Search results preserve a result line width
- **WHEN** Search results appear in a narrow layout.
- **THEN** Their width is at least one result line.

### Requirement: Footer identifies the accepted data

The shared footer SHALL show the accepted game release version, the publication data date, and a link to the Steam patch notes for that same release. It SHALL NOT infer a version from the build number or use a generic patch-notes index as a matching article. The displayed version, date, and link SHALL belong to the selected publication. On a short page the footer SHALL sit at the bottom of the viewport.

#### Scenario: Reader checks the current release
- **WHEN** a reader opens the hub or a detail page for a selected publication
- **THEN** its footer shows the release version and data date of that publication
- **AND** the patch-notes link opens the verified Steam article for that release

#### Scenario: Candidate release evidence does not match
- **WHEN** a candidate's patch-notes article does not match its declared version or build
- **THEN** the candidate cannot replace the accepted publication

#### Scenario: Short 404 page
- **WHEN** a reader opens the 404 page on a tall phone viewport
- **THEN** the footer rests at the bottom rather than halfway down the screen

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

Across home, lists, guides, detail pages, and hover cards, the root text size SHALL be 100% of the reader's browser preference and CSS type sizes SHALL use rem units.

#### Scenario: Browser prefers larger text
- **WHEN** the browser uses a larger default text size on a list or the home page
- **THEN** typography scales with it without clipping search results or requiring horizontal page scroll at 390 px

#### Scenario: Keyboard and touch reader
- **WHEN** a reader navigates relation links and disclosures without a pointer
- **THEN** all information and actions remain reachable with at least 24 px targets

#### Scenario: Contrast audit
- **WHEN** rendered text is measured against each surface and state on which it appears
- **THEN** every text pairing meets a contrast ratio of at least 4.5:1

#### Scenario: Short lead near a line boundary
- **WHEN** a short heading, introduction, or supporting line wraps on a list, home, Mechanics, or detail page
- **THEN** its final line does not contain a lone word when balanced wrapping can distribute its words over the available width

#### Scenario: Shared presentation remains accessible
- **WHEN** A reader views home, a list, a guide, a detail page, or a hover card with an enlarged browser text preference.
- **THEN** The root text size is 100% of that preference and CSS type sizes use rem units.

### Requirement: Readable text meets minimum sizes

Across home, lists, guides, detail pages, and hover cards, body text SHALL be at least 1rem with line height at least 1.5. Other readable text SHALL not be smaller than .875rem.

#### Scenario: Readable text meets minimum sizes
- **WHEN** Body and supporting text render in a hover card.
- **THEN** Body text is at least 1rem with line height at least 1.5, and other readable text is at least .875rem.

### Requirement: Labels use readable case

Across home, lists, guides, detail pages, and hover cards, labels SHALL use readable case without letter-spaced capitals.

#### Scenario: Labels use readable case
- **WHEN** A label renders on a detail page.
- **THEN** It uses readable case without letter-spaced capitals.

### Requirement: Text meets contrast on every surface

Across home, lists, guides, detail pages, and hover cards, text SHALL contrast at least 4.5:1 with every background on which it appears, including dark, hover, rarity, and overlay surfaces.

#### Scenario: Text meets contrast on every surface
- **WHEN** Text appears on a rarity surface in a hover card.
- **THEN** The text contrasts at least 4.5:1 with that surface.

### Requirement: Interactive controls meet minimum target size

Across home, lists, guides, detail pages, and hover cards, interactive controls SHALL have targets at least 24 by 24 px.

#### Scenario: Interactive controls meet minimum target size
- **WHEN** An interactive control renders on a list.
- **THEN** Its target is at least 24 by 24 px.

### Requirement: Rarity and status have text identification

Across home, lists, guides, detail pages, and hover cards, rarity and status SHALL be identified by text and not by color alone.

#### Scenario: Rarity and status have text identification
- **WHEN** A detail page displays rarity and status.
- **THEN** Text identifies both rarity and status rather than color alone.

### Requirement: Interactive information supports equivalent input access

Across home, lists, guides, detail pages, and hover cards, focus, tap, and hover SHALL provide equivalent access to interactive information.

#### Scenario: Interactive information supports equivalent input access
- **WHEN** A reader accesses interactive information by focus, tap, and hover.
- **THEN** Each input method provides equivalent access to that information.

### Requirement: Short text balances wrapping where supported

Across home, lists, guides, detail pages, and hover cards, short headings, leads, and supporting text SHALL balance their wrapping where supported so a single isolated word does not form the last line when the available width permits a better break.

#### Scenario: Short text balances wrapping where supported
- **WHEN** A short heading wraps in a browser supporting balanced wrapping and the available width permits a break without an isolated final word.
- **THEN** The heading balances its wrapping without a single isolated word on the last line.
### Requirement: Abilities list identifies what an ability does and where it comes from

The Abilities list SHALL show each ability's published icon and name alongside a Source column, one line per row, without descriptions.

#### Scenario: Learned ability
- **WHEN** a reader opens the Abilities list and finds Ambush
- **THEN** its row shows Assassin · Shadowcraft

#### Scenario: Creature and item abilities
- **WHEN** a reader finds Basic Strike and Brown Horse Mount
- **THEN** Basic Strike reports the number of creature users rather than a long name list, and Brown Horse Mount names its item source
- **AND** the Healing Potion ability page links the items that cast it under Used by items

#### Scenario: Unattributed abilities
- **WHEN** a reader opens the list without filters
- **THEN** the count excludes abilities nobody uses and offers a counted action to reveal them
- **AND** selecting "Nobody Uses It" in Availability reveals those abilities without removing their detail pages
- **AND** the Source cell is empty and the Source filter contains no "Nobody Uses It" option

#### Scenario: Filter by class
- **WHEN** a reader selects Assassin in Class
- **THEN** only abilities learned by Assassin remain, and resetting the filter restores the default list

#### Scenario: Abilities list identifies what an ability does and where it comes from
- **WHEN** A reader views an ability row in the Abilities list.
- **THEN** The row shows the ability's published icon and name alongside a Source column on one line, without a description.

### Requirement: Ability Source prefers learning information

Source SHALL prefer a learning class and talent tree, otherwise show one or two creature names or a creature count, otherwise show item names.

#### Scenario: Ability Source prefers learning information
- **WHEN** An ability has a learning class and talent tree as well as creature users.
- **THEN** Source shows the learning class and talent tree.

### Requirement: Unknown ability sources stay empty and unoffered

If no learner or user is known, the Source cell SHALL remain empty and the Source filter SHALL not offer a missing-use value.

#### Scenario: Unknown ability sources stay empty and unoffered
- **WHEN** An ability has no known learner or user.
- **THEN** Its Source cell is empty and the Source filter offers no missing-use value.

### Requirement: Known ability sources support Source and Class filters

Source and Class SHALL be filters for abilities with a known source.

#### Scenario: Known ability sources support Source and Class filters
- **WHEN** A reader views the list of abilities with known sources.
- **THEN** Source and Class filters are available.

### Requirement: Abilities with unknown use remain published but default-hidden

Abilities without a known use SHALL remain published and reachable on their detail pages but SHALL be hidden in default list results.

#### Scenario: Abilities with unknown use remain published but default-hidden
- **WHEN** An ability has no known use and a reader views default list results.
- **THEN** The ability is absent from those results but remains published and reachable on its detail page.

### Requirement: Availability reveals abilities with unknown use

The Availability filter SHALL reveal abilities without a known use with their count visible.

#### Scenario: Availability reveals abilities with unknown use
- **WHEN** A reader uses Availability to reveal abilities without a known use.
- **THEN** Those abilities are revealed with their count visible.

### Requirement: Abilities list fits narrow viewports

The Abilities list SHALL fit a 390 px viewport without horizontal page scrolling.

#### Scenario: Abilities list fits narrow viewports
- **WHEN** A reader opens the Abilities list at a 390 px viewport.
- **THEN** The list fits without horizontal page scrolling.
