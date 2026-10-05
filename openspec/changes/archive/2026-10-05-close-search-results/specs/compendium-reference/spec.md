## MODIFIED Requirements

### Requirement: Site and map search share published entities

Site search SHALL search the names and published aliases of searchable page kinds from the publication's search corpus, and SHALL link results to their entity pages. Results for places and entities with published map spots SHALL offer a map link. The map SHALL use the same published entity corpus alongside its placement search data rather than indexing separate guide records. Site search results SHALL close when focus leaves the search, when the reader presses Escape, and after any navigation, which SHALL also clear the field. Clicking the field, typing, or an arrow key SHALL reopen the current results. Arrow keys SHALL move a visible highlight through the results and Enter SHALL open the highlighted page.

#### Scenario: A reader searches for a dungeon boss
- **WHEN** the reader enters part of a published boss name
- **THEN** site results offer its NPC page, available level and place context, and a map link when it has spots

#### Scenario: A reader opens a result
- **WHEN** the reader follows a search result by click or by Enter on the highlighted result
- **THEN** the result's page opens with the search results closed and the field empty

#### Scenario: A reader leaves the search
- **WHEN** the reader clicks elsewhere on the page or presses Escape while results are open
- **THEN** the results close, and clicking the field reopens them for the same query
