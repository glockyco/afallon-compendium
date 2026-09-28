## MODIFIED Requirements

### Requirement: Talent references resolve to their class page row

A reference to a talent of a published class SHALL link to the class page and the talent's existing node anchor. A reference on a class page SHALL resolve to a node of the same class. When a link targets a node in another tree, the page SHALL select that tree and reveal the node. The link SHALL work with either tree view selected. The tooltip SHALL show the talent tree, tier, first-rank effect, and last-rank effect. A reference to a talent of a class without a page SHALL show the talent name without a link.

#### Scenario: Requirement between two talents
- **WHEN** the Aegis Discipline node on the Shieldmaster page requires rank 4 of Weighted Strikes
- **THEN** the requirement links to Weighted Strikes on the Shieldmaster page
- **AND** its tree becomes selected and its node is revealed

#### Scenario: Link from an ability page
- **WHEN** a reader follows a Learned by link to a talent node in a nonselected tree
- **THEN** the class page selects the destination tree and reveals the node

#### Scenario: Table view is selected
- **WHEN** a reader follows a talent link while the table view is selected
- **THEN** the destination node is visible in the selected tree's table

#### Scenario: Talent of a class without a page
- **WHEN** a reference names a talent of the Hunter class, and no race offers Hunter
- **THEN** the reference shows the talent name without a link
