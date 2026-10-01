## ADDED Requirements

### Requirement: Currency Purchases on Item Detail Pages

Item detail pages SHALL show a Buys relation section for an item with a spendable currency conversion and purchasable merchant stock, with linked products, costs, and linked sellers. Non-currency item pages SHALL omit the section.

#### Scenario: Spendable Item
- **WHEN** a reader opens the Corrupted Emerald page
- **THEN** the page displays the products available for its currency with their costs and sellers

#### Scenario: Ordinary Item
- **WHEN** a reader opens an item without a currency conversion
- **THEN** the page omits Buys
