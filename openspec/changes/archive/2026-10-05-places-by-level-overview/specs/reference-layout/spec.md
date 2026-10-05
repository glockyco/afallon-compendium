## MODIFIED Requirements

### Requirement: Shared presentation remains accessible

Across home, lists, guides, detail pages, and hover cards, the root text size SHALL be 100% of the reader's browser preference and CSS type sizes SHALL use rem units. Body text SHALL be at least 1rem with line height at least 1.5; other readable text SHALL not be smaller than .875rem. Labels SHALL use readable case without letter-spaced capitals. Text SHALL contrast at least 4.5:1 with every background on which it appears, including dark, hover, rarity, and overlay surfaces. Interactive controls SHALL have targets at least 24 by 24 px. Rarity and status SHALL be identified by text and not by color alone. Focus, tap, and hover SHALL provide equivalent access to interactive information. Short headings, leads, and supporting text SHALL balance their wrapping where supported so a single isolated word does not form the last line when the available width permits a better break.

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
