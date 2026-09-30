## Why

The home page showed the first three rows of the recipe list under a Recipes label, and a Mechanics tile among the reference list tiles. The recipe rows were an arbitrary sample that did not help a reader find a recipe. The guides are not a reference list, and the Guides column of the Browse menu already links each guide. The owner asked to remove both.

## What Changes

- Remove the recipe sample from the crafting and gathering entry. The entry keeps its link to the complete Recipes list, the skills, and the map resource categories.
- Remove the Mechanics tile from the browse tiles. The browse tiles show reference lists only.

## Capabilities

### Modified Capabilities

- `compendium-hub`: The hub names no individual recipe, and its browse tiles show reference lists only.

## Impact

- Site: `apps/site/src/routes/+page.svelte` and `+page.server.ts`. No publication or contract change.
