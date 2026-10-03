## ADDED Requirements

### Requirement: Gear set counts identify exceptional thresholds

The Gear Sets list SHALL show each set's number of available pieces without a second column that repeats the same count for its final bonus. When the final bonus needs a different number of pieces, the row SHALL identify that threshold beside its piece count. The reader SHALL still be able to sort the column and open the set's tier details.

#### Scenario: Typical set
- **WHEN** a set's last bonus unlocks after all its pieces are equipped
- **THEN** its list row shows the piece count once

#### Scenario: Exceptional set
- **WHEN** Vermincrawl Garb has seven pieces and the last bonus unlocks at six
- **THEN** its row shows seven pieces and explicitly names the six-piece threshold without requiring a second count column
