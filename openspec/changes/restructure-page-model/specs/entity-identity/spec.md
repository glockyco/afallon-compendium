## ADDED Requirements

### Requirement: Recipe references resolve to the Crafting section of their product

Recipes SHALL have no detail pages. A reference to a recipe with a published product SHALL link to the product's item page and to its `crafting` anchor. A reference to a recipe without a published product SHALL link to the recipe's row on its skill page. The tooltip of a recipe reference SHALL show the crafting block of the recipe. The item document of a product SHALL keep the key of its recipe. Search SHALL find a craft by its product name. When the recipe name differs from the product name, search SHALL also find the product by the recipe name. A recipe reference whose product and skill have no page SHALL show the recipe name without a link.

#### Scenario: Recipe of a crafted item
- **WHEN** the Used in recipes row of Bolt of Runeweave names the recipe Runeweave Regalia
- **THEN** the row links to `/items/runeweave-regalia/#crafting`

#### Scenario: Recipe name differs from the product
- **WHEN** a reader searches for Ring of Bleed Damage
- **THEN** search offers Bloodthrall Signet, whose Crafting section names the recipe

#### Scenario: Recipe without a product
- **WHEN** a reference names the Smithing recipe Demonic Bulwark Looted, which has no published product
- **THEN** the reference links to its row on the Smithing page
