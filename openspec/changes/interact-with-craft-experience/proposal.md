## Why

Crafting experience depends on the reader's skill level: a recipe gives its full base experience for 20 levels from its required level, half for the next 15, and none above. The Crafting section listed these breakpoints as one sentence, so a reader had to find their own level among them, and the Crafting and Gathering guide's example showed only the table.

## What Changes

- The Crafting section of a product shows a level control for the recipe's skill, which starts at the reader's remembered level, and states the experience per craft at that level and where it changes next, or from which level the reader can craft the recipe.
- The guide's crafting example gets the same control and marks the reader's band in its table.
- Each recipe rank publishes the highest level of its skill, where the last band ends, so the control spans the whole skill. The item schema moves to `compendium.static-item.v21`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `item-property-presentation`: the Crafting section gives the experience at the reader's skill level.

## Impact

`packages/contracts` (`RecipeRank.highestLevel`), `packages/publication/src/crafting.ts`, and the site (`CraftExperience`, `craft-experience.ts`, `CraftingSection`, the Crafting and Gathering guide page).
