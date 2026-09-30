## Why

A reader who wants to craft an item must visit three pages. In the accepted publication, each of the 118 crafted items has exactly one recipe. Each of the 47 recipe items teaches exactly one recipe, and each recipe has one rank. The product page shows only a link to a recipe with the same name. The recipe page holds the materials, station, skill gate, and experience bands. The recipe item page shows the product again. All three pages show the same tooltip.

The mechanics pages have the same problem in a different form. Crafting and Gathering shows 31 rule sentences in about 1,050 words, and almost every rule is about one kind of page: 8 are about recipes, 18 about gathering nodes, and 5 about skills. A reader must read the full page to find the rule for one node, and the node page does not show it.

## What Changes

- **BREAKING** Recipes have no detail pages. The page of the product item gets a Crafting section with the station, skill, required level, materials, product quantity, experience bands, and the items that teach the recipe. The routes `/recipes/<slug>/` are removed without redirects.
- The Teaches section of a recipe item shows the full crafting block of the recipe that it teaches.
- A reference to a recipe links to the Crafting section of its product. A recipe without a published product links to its row on its skill page. Recipe keys stay in the published documents. Search finds a craft by the product name, and by the recipe name when the two names differ.
- The Recipes list stays as a list of crafts. Its rows link to the Crafting sections.
- Each rule of the reviewed rules record names the pages and sections where it appears. A rule can explain a fact or a column on hover, or appear in a How it works section. When the publication computes the values of a rule for a page, the page shows these values.
- A rule has a topic, placements, or both. Each topic has a guide page. A rule without a topic appears only on the pages where it is placed.
- The mechanics pages become short guides: an overview, the steps of the process in order, the key values, and one worked example with a published entity. The complete rule list with its evidence moves into a closed disclosure at the end of the page.
- Coverage gets a `recipeWithoutProduct` gap next to `recipeWithoutTeacher`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: Remove recipe pages. The hero no longer shows a recipe view. The recipe item and skill pages link to Crafting sections. Pages can show placed rules.
- `item-property-presentation`: Item pages show a Crafting section in place of the Crafted from section.
- `crafting-and-gathering`: Crafting and gathering rules appear on the item, gathering node, and skill pages. The mechanics page is a guide.
- `mechanics-pages`: Mechanics pages are guides with the rule list in a disclosure. The navigation names every published topic.
- `progression-data`: Rules in the rules record name their placements.
- `entity-identity`: Recipe references resolve to the Crafting section of the product.
- `reader-coverage`: Coverage lists recipes without a product and recipes without a teaching item.
- `game-update-workflow`: Parity reads recipe keys from Crafting sections and skill rows.
- `compendium-hub`: The crafting and gathering entry leads to the crafts list, the skills, and the guide.

## Impact

- Contracts: `packages/contracts/src/catalog/mechanics.ts` (rule placements), and `packages/contracts/src/public/documents.ts` (item Crafting section, removal of the recipe document, guide fields of mechanics documents).
- Publication: `packages/publication/src` for item, skill, gathering node, NPC, quest, class, mechanics, list, search, coverage, and parity projection.
- Site: `apps/site/src/lib/detail/pages`, the entity tooltip, the list routes, and the site navigation.
- Evidence: a new rules record with placements. The rule text and evidence of the accepted record stay unchanged.
- Artifacts: a catalog candidate that differs from the accepted catalog only by the rule placements, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
- Later changes: `publish-item-uses-and-sources` places its item source rules through rule placements. `publish-reference-kinds` uses the same anchor pattern for records without their own pages.
