# about-and-discovery Specification

## Purpose
Make the game's identity, the reference's provenance and unofficial status, and the meaning of its static pages understandable to visitors and search/sharing clients without requiring hydration.

## Requirements

### Requirement: Game introduction and reference identity

The home page SHALL introduce Afallon using verified game facts and display plain Steam game listing and "Steam Guide" links together.

#### Scenario: New reader visits home and About
- **WHEN** the home and About pages load without interaction
- **THEN** the game introduction and outbound links are readable, About names the selected version and data date, and the entire disclaimer is visible.

#### Scenario: Game introduction and reference identity
- **WHEN** A visitor opens the home page.
- **THEN** The page introduces Afallon using verified game facts and displays plain Steam game listing and "Steam Guide" links together.

### Requirement: Footer and About link the Steam Guide without describing its contents

The shared footer including the map and the About page SHALL also link "Steam Guide" without describing what it contains.

#### Scenario: Footer and About link the Steam Guide without describing its contents
- **WHEN** A visitor views the map's shared footer and the About page.
- **THEN** Both link "Steam Guide" without describing what it contains.

### Requirement: About explains the game and reference publication

The About page SHALL explain the game, how this reference uses game data and checked rules, the selected publication's game version and data date, Coverage, patch notes, Ko-fi, and the full project disclaimer.

#### Scenario: About explains the game and reference publication
- **WHEN** A visitor opens About for a selected publication.
- **THEN** About explains the game, the reference's use of game data and checked rules, that publication's game version and data date, Coverage, patch notes, Ko-fi, and the full project disclaimer.

### Requirement: Do not infer maintainer identity or personal project links

No maintainer identity or personal project link SHALL be inferred.

#### Scenario: Do not infer maintainer identity or personal project links
- **WHEN** The reference is presented without a supplied maintainer identity or personal project link.
- **THEN** No maintainer identity or personal project link is inferred.


### Requirement: Every page discloses non-affiliation

The shared page footer and interactive map SHALL each display the same concise non-affiliation notice and a working About link.

#### Scenario: Reader opens map or a reference page
- **WHEN** the reader reaches the footer
- **THEN** it reads "Unofficial fan project, not affiliated with the developer or publisher of Afallon." and links to About.

### Requirement: Honest crawl and sharing metadata

Every indexable HTML page SHALL expose a slash-consistent absolute canonical, descriptive sharing metadata, and concise, factual descriptions based on published information.

#### Scenario: A visitor shares a list or entity
- **WHEN** its initial HTML is requested
- **THEN** the title, description, canonical, social tags, and applicable breadcrumb JSON-LD describe that same destination.

#### Scenario: A visitor opens a filtered map link
- **WHEN** its initial HTML is requested with map query parameters
- **THEN** the canonical identifies the base /map/ page and the HTML contains a map heading, concise introduction, and category links without needing client JavaScript.

#### Scenario: A visitor requests an unknown address
- **WHEN** the static host cannot find the address

#### Scenario: Honest crawl and sharing metadata
- **WHEN** An indexable HTML page is requested.
- **THEN** The page exposes a slash-consistent absolute canonical, descriptive sharing metadata, and concise, factual descriptions based on published information.

### Requirement: Entity descriptions state known properties and restrictions accurately

Entity descriptions SHALL mention known item properties and acquisition restrictions or NPC type/location, and SHALL not claim an unavailable property or truncate midword.

#### Scenario: Entity descriptions state known properties and restrictions accurately
- **WHEN** An item entity with known properties and acquisition restrictions has a description rendered.
- **THEN** The description mentions those properties and restrictions, claims no unavailable property, and does not truncate midword.

### Requirement: Home exposes WebSite data without SearchAction

Home SHALL expose WebSite structured data without SearchAction.

#### Scenario: Home exposes WebSite data without SearchAction
- **WHEN** The home page is requested.
- **THEN** The page exposes WebSite structured data without SearchAction.

### Requirement: Visible breadcrumbs have matching structured data

Pages with visible breadcrumb trails SHALL expose the matching BreadcrumbList.

#### Scenario: Visible breadcrumbs have matching structured data
- **WHEN** A page with a visible breadcrumb trail is requested.
- **THEN** The page exposes a BreadcrumbList matching the visible trail.

### Requirement: About is included in the sitemap without fabricated dates

The About page SHALL be in the sitemap without fabricated lastmod dates.

#### Scenario: About is included in the sitemap without fabricated dates
- **WHEN** The sitemap is generated.
- **THEN** The sitemap includes the About page without fabricated lastmod dates.

- **THEN** it returns a useful site 404 with HTTP 404 and noindex, rather than returning an indexable success response.
