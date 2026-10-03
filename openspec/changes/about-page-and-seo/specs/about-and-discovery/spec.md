## Purpose

Make the game's identity, the reference's provenance and unofficial status, and the meaning of its static pages understandable to visitors and search/sharing clients without requiring hydration.

## ADDED Requirements

### Requirement: Game introduction and reference identity

The home page SHALL introduce Afallon using verified game facts and link the Steam game listing and the compendium's interactive-map Steam guide. The About page SHALL explain the game, how this reference uses game data and checked rules, the selected publication's game version and data date, Coverage, patch notes, the Steam links, Ko-fi, and the full project disclaimer. No maintainer identity or personal project link SHALL be inferred.

#### Scenario: New reader visits home and About
- **WHEN** the home and About pages load without interaction
- **THEN** the game introduction and outbound links are readable, About names the selected version and data date, and the entire disclaimer is visible.

### Requirement: Every page discloses non-affiliation

The shared page footer and interactive map SHALL each display the same concise non-affiliation notice and a working About link.

#### Scenario: Reader opens map or a reference page
- **WHEN** the reader reaches the footer
- **THEN** it reads "Unofficial fan project, not affiliated with the developer or publisher of Afallon." and links to About.

### Requirement: Honest crawl and sharing metadata

Every indexable HTML page SHALL expose a slash-consistent absolute canonical, descriptive sharing metadata, and concise, factual descriptions based on published information. Entity descriptions SHALL mention known item properties and acquisition restrictions or NPC type/location, and SHALL not claim an unavailable property or truncate midword. Home SHALL expose WebSite structured data without SearchAction. Pages with visible breadcrumb trails SHALL expose the matching BreadcrumbList. The About page SHALL be in the sitemap without fabricated lastmod dates.

#### Scenario: A visitor shares a list or entity
- **WHEN** its initial HTML is requested
- **THEN** the title, description, canonical, social tags, and applicable breadcrumb JSON-LD describe that same destination.

#### Scenario: A visitor opens a filtered map link
- **WHEN** its initial HTML is requested with map query parameters
- **THEN** the canonical identifies the base /map/ page and the HTML contains a map heading, concise introduction, and category links without needing client JavaScript.

#### Scenario: A visitor requests an unknown address
- **WHEN** the static host cannot find the address
- **THEN** it returns a useful site 404 with HTTP 404 and noindex, rather than returning an indexable success response.
