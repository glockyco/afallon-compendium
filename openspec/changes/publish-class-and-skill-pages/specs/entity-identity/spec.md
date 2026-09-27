## ADDED Requirements

### Requirement: Talent references resolve to their class page row

A reference to a talent of a published class SHALL link to the class page and to the anchor of the talent's row. A reference on a class page SHALL resolve to a row of the same class. The tooltip of a talent reference SHALL show the talent tree, the tier, and the effect of the talent at its first rank and at its last rank. A reference to a talent of a class without a page SHALL show the talent name without a link.

#### Scenario: Requirement between two talents
- **WHEN** the Aegis Discipline row on the Shieldmaster page requires rank 4 of Weighted Strikes
- **THEN** the requirement links to the Weighted Strikes row on the Shieldmaster page

#### Scenario: Talent of a class without a page
- **WHEN** a reference names a talent of the Hunter class, and no race offers Hunter
- **THEN** the reference shows the talent name without a link
