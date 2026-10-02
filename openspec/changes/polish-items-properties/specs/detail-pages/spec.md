## MODIFIED Requirements

### Requirement: Property pages show the purchase

A property page SHALL show its type and place in the title. Its answer SHALL use the full width without a side column and show the available picture once, beside the price, income per payment, and sell price when known, followed by where to buy it with the for-sale signs and a map action. It SHALL not claim an interval or currency without confirmed facts.

#### Scenario: Property with one sign
- **WHEN** a property has one for-sale sign
- **THEN** its answer identifies the sign's area and a map action opens it

#### Scenario: Property purchase on a wide screen
- **WHEN** a reader opens Coalway Swamp Fishing Hut at 1440 px
- **THEN** its picture sits beside the purchase price, income, and sell price in the answer, the for-sale sign follows, and no side column appears
