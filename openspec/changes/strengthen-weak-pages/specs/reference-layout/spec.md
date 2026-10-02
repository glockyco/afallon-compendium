## MODIFIED Requirements

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

#### Scenario: Link that wraps onto two lines
- **WHEN** a reader points at the second line of a link whose name wraps across two lines of a paragraph
- **THEN** the hover card opens beside that line, fully inside the viewport, instead of beside the paragraph's right edge
