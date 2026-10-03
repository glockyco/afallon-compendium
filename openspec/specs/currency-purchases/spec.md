# currency-purchases Specification

## Purpose
Give readers an accurate view of purchases available with an item that converts into a game currency, using merchant stock in the same catalog.

## Requirements

### Requirement: Preserve Item Currency Conversion

The catalog SHALL expose a resolved currency reference for an item when its authored gameplay conversion targets a known currency. It SHALL leave the reference absent for items without a conversion.

#### Scenario: Corrupted Emerald Conversion
- **WHEN** the existing item export identifies Corrupted Emerald as converting to currency 1
- **THEN** its catalog facts identify currency 1 as the resolved currency

### Requirement: Publish Currency Purchases

An item document with a resolved currency SHALL expose that currency and purchases available from merchants accepting it. Each purchase row SHALL include the purchased item, cost in that currency, and all merchants selling that item for that exact cost. Offers for different items or different costs SHALL remain separate. An item without a currency conversion SHALL not acquire currency purchases.

#### Scenario: Shared Stock at Identical Price
- **WHEN** multiple merchants sell the same item for the same amount of Corrupted Emerald currency
- **THEN** the document contains one row naming the item, amount, and all selling merchants

#### Scenario: Different Price
- **WHEN** an item is available at two distinct costs for the same currency
- **THEN** both offers remain visible as separate rows

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
