## MODIFIED Requirements

### Requirement: Detail pages share one structure

Every entity detail page SHALL show a breadcrumb, title block, answer, applicable side facts, and ordered relation sections. At widths of at least 1024 px a page with side facts SHALL use a main column and a 20rem side column beginning beside the answer, below the title block; the side column SHALL remain available while scrolling. A page without side facts SHALL give its main column the full width instead of reserving an empty side column. Every side card SHALL share one card frame. At narrower widths the order SHALL be title, answer, side facts, relations. An applicable single stat strip beneath the title SHALL hold no more than five decisive facts. A page with at least four rendered sections SHALL offer section navigation. No fact SHALL repeat in adjacent title, strip, answer, and side content.

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
