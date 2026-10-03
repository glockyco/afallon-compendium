## MODIFIED Requirements

### Requirement: Reveal Purchases on Currency Item Pages

A currency item's page SHALL provide a Buys section with Item and numeric Cost columns, plus Sold by when sellers differ between offers. A page whose subject is the purchase currency SHALL name that currency once above the offers, not in every Cost cell. When every offer shares the same sellers, the section SHALL name those linked sellers once without a repeated Sold by column. Offers with different amounts or sellers SHALL remain separate rows. The section SHALL show all rows when there are at most ten, otherwise preview eight and reveal the remaining rows. It SHALL remain usable without horizontal page overflow at desktop and mobile widths and be absent on ordinary item pages.

#### Scenario: Reader Opens Corrupted Emerald
- **WHEN** a reader opens Corrupted Emerald at 1440 px or 390 px
- **THEN** the Buys section displays priced items and their varying selling merchants, with the remaining offers accessible through Show more
- **AND** the currency is identified once rather than repeated in every Cost cell

#### Scenario: Reader Opens Gold
- **WHEN** a reader opens Gold
- **THEN** the Buys section previews purchases and offers an action to reveal the rest
- **AND** it does not repeat Gold Coin in every price

#### Scenario: Reader Opens Ordinary Item
- **WHEN** a reader opens an item without a currency conversion
- **THEN** there is no Buys section

#### Scenario: Every Offer Shares Sellers
- **WHEN** each Honor offer is sold by the same pair of quartermasters
- **THEN** each merchant is linked once near the offers instead of repeating them in every row
