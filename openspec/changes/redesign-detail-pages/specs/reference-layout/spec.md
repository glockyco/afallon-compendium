## MODIFIED Requirements

### Requirement: Tooltips open beside their links

On desktop, an entity hover card SHALL start at `right-start` beside its link and use `left-start` when the right side lacks room. It SHALL not cover adjacent links or block movement between entries, including upward movement. It SHALL shift only vertically to remain in the viewport and recompute available height when its content loads, the page scrolls, or the viewport resizes. One card SHALL be open at a time and shall close when pointer leaves both trigger and card, even when the link has focus. On narrow screens it SHALL use a fixed bottom overlay. Hover, keyboard focus, and tap SHALL all make its content available without preventing link navigation. The preview SHALL be an in-game tooltip plus at most one context line for an item or ability, or a compact identity card with portrait/icon, level, place, and at most one context line for a creature, node, or quest. It SHALL NOT show a table, rule prose, or a fact unavailable on the corresponding page.

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

## ADDED Requirements

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
