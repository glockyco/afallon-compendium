## Why

The Crafting and Gathering page was one long column of eight sections in no particular grouping: walls of rule prose, a page-local enchanting table without a frame or Show more, three node-odds examples stacked one under another, attunements written as one run-on paragraph, and nine weapon skills inlined in a sentence. Readers could not tell where crafting ends and gathering starts, or where to begin.

## What Changes

- The page opens with the crafting skills (with recipe counts) and the gathering skills (with node counts) that each activity starts from, and links the Recipes and Gathering Nodes lists.
- Sections are grouped into Crafting, Gathering, and Training skills parts. The Crafting section is titled Recipes, so it no longer repeats its part's title.
- The enchanting items use the shared relation table. Node selection shows one tab per gathering skill. Attunements are a table. Weapon skills are a grid of links.
- The mechanics document publishes the crafting and gathering skill summaries (static mechanics schema v18).

## Capabilities

### New Capabilities

### Modified Capabilities

- `mechanics-pages`: the Crafting and Gathering page structure.

## Impact

Contracts (CraftingAndGathering schema, mechanics schema id), publication (mechanics projection, section title), and the site (CraftingAndGatheringPage, Section and GuideSection heading level).
