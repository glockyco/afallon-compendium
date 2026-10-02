## Why

The Browse panel was a plain grid of text links whose columns were too narrow for long labels: "Factions and Reputation" ran past its hover highlight. Readers saw only names, with nothing to say what each destination holds, and on phones the panel squeezed four columns into two. The site also linked Ko-fi only from the map.

## What Changes

- Each Browse entry shows its kind's glyph, its name, and one line that says what it holds. Long names wrap inside their own highlight, and columns keep room for a name and its line.
- On phones the columns become full-width sections that open one at a time, starting with the section of the current page.
- The bar ends with a Support link to Ko-fi, which shrinks to the Ko-fi cup where the bar is short of room. The page footer links Ko-fi too. The map's button uses the same glyph.
- The bar's search field keeps room for a query and moves to its own row below 1024 px. Its results open at least 24rem wide.
- The Mechanics column names six featured mechanics pages in alphabetical order and links the list of all of them. The hub lists every mechanics page, including Travel and World Quests, in alphabetical order. No navigation text calls these pages guides.
- The bar names the site in the serif of the page titles, links Map, Items, Quests, Classes, and Mechanics, marks the current link with a gold rule on its lower edge, gives search a glyph and a short placeholder, and sets the Support link apart as a quiet link.

## Capabilities

### Modified Capabilities

- `reference-layout`: The Browse panel's entries, phone layout, and the Ko-fi links.

## Impact

Site only: `site-navigation.ts`, `PageShell.svelte`, `kind-icon.ts`, a shared Ko-fi glyph, and the map controls.
