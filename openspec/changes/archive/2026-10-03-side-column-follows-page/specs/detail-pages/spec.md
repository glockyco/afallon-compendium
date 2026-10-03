## MODIFIED Requirements

### Requirement: Detail pages share one structure

Every entity detail page SHALL show a breadcrumb, title block, answer, applicable side facts, and ordered relation sections. At widths of at least 1024 px a page with side facts SHALL use a main column and a 20rem side column beginning beside the answer, below the title block; the side column SHALL remain available while scrolling without a scroll area of its own, so the wheel over it scrolls the page. A side column that fits the window SHALL stay below the window's top edge while the page scrolls. A taller side column SHALL scroll with the page until its far edge in the scrolling direction is in view, and SHALL then stay there, so page scrolling alone reaches every part of it. A page without side facts SHALL give its main column the full width instead of reserving an empty side column. Every side card SHALL share one card frame. At narrower widths the order SHALL be title, answer, side facts, relations. An applicable single stat strip beneath the title SHALL hold no more than five decisive facts. A page with at least four rendered sections SHALL offer section navigation. No fact SHALL repeat in adjacent title, strip, answer, and side content.

#### Scenario: Item page on a wide screen
- **WHEN** a reader opens an item page at 1440 px
- **THEN** its main column starts with the title and How to get it, while the side column holds one game tooltip and the description
- **AND** relation sections follow the answer without side-by-side relation cards

#### Scenario: Page with one short section
- **WHEN** a page has one section with one row
- **THEN** it shows the section and no section navigation

#### Scenario: Detail page on a phone
- **WHEN** a class page opens at 390 px
- **THEN** its title and answer precede the side facts and relations without horizontal page scroll

#### Scenario: Page without side facts
- **WHEN** a page supplies no side facts
- **THEN** its title, answer, and sections use the full width and no empty column appears beside them

#### Scenario: Wheel over the side column
- **WHEN** a reader turns the mouse wheel with the pointer over the side column of a page longer than the window
- **THEN** the page scrolls, and the side column does not scroll inside itself

#### Scenario: Side column taller than the window
- **WHEN** a reader scrolls down a long NPC page whose side column is taller than the window
- **THEN** the side column scrolls with the page until its end is in view and then stays there
- **AND** scrolling back up brings the column's start into view before the page reaches its top
