## MODIFIED Requirements

### Requirement: Tooltip interaction is usable and accessible

An entity tooltip SHALL associate its non-interactive content with the owner link for assistive technology, open on keyboard focus, and close with Escape without taking focus from the link. Its overflow SHALL stay bounded without intercepting pointer movement through nearby entries. A touch reader SHALL be able to open a preview and then follow the link. Opening a tooltip or a hint SHALL NOT move the text around its link or term, in any browser.

#### Scenario: Keyboard reader inspects a tooltip
- **WHEN** keyboard focus reaches an entity link
- **THEN** its tooltip becomes available through the link's description association
- **AND** pressing Escape closes the tooltip without moving focus

#### Scenario: Reader traverses adjacent table entries
- **WHEN** a reader moves the pointer between nearby entity links
- **THEN** the tooltip sits beside its link where space permits and does not intercept movement to an adjacent entry

#### Scenario: Touch reader activates an entity link
- **WHEN** a touch reader taps a linked entity
- **THEN** the first tap opens its preview and a subsequent tap can navigate to the entity page

#### Scenario: Hover card on a nearly full line
- **WHEN** a reader hovers a link in a sentence whose first line is nearly full, in Firefox
- **THEN** the card opens beside the link and every word of the sentence stays on its line
