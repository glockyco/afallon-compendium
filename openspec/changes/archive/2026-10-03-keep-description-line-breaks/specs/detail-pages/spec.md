## ADDED Requirements

### Requirement: Game descriptions keep their line breaks

A page SHALL show a game description with the line breaks that the game shows. A run of three or more spaces between words, which the game uses to push the next phrase onto a new line in its tooltip, SHALL read as a line break. Ordinary spacing SHALL stay as it is.

#### Scenario: Mount description
- **WHEN** a reader opens Brown Mare
- **THEN** "Mounted speed 40%" and "Can't be used indoors" read on separate lines
