## MODIFIED Requirements

### Requirement: Featured entities share reference previews

A featured place, boss, zone, class, skill, or mechanics page on the hub SHALL use the site's entity link when that page is published. Its visual card or tile layout SHALL remain a navigable group without adding a second bespoke hover surface. A dungeon card, class tile, or skill tile SHALL open its page from a click anywhere on it and SHALL NOT open a hover card. The boss links inside a dungeon card SHALL open their own pages and keep their hover cards, and each boss name SHALL stay on one line, ending in an ellipsis when it is too long. Merchants SHALL NOT be among the earliest or most prominent hub sections.

#### Scenario: Hover a featured dungeon boss
- **WHEN** a desktop reader hovers the published boss name on the home page
- **THEN** the same hover card available in catalog rows opens beside the name

#### Scenario: Click the empty part of a card
- **WHEN** a reader clicks the artwork of a dungeon card, the empty space of a class tile, or the recipe count of a skill tile
- **THEN** the page of that dungeon, class, or skill opens
- **AND** a click on a boss name inside a dungeon card opens that boss's page, while a click beside it opens the dungeon

#### Scenario: Point at a card
- **WHEN** a desktop reader points at a dungeon card, class tile, or skill tile outside its boss names
- **THEN** no hover card opens

#### Scenario: Long boss name
- **WHEN** a dungeon card names Vhorast the Grave-Caller in a narrow column
- **THEN** the name stays on one line beside its portrait and ends in an ellipsis
- **AND** its hover card shows the whole name
