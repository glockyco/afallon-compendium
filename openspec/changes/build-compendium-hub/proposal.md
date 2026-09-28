## Why

The home route opens the map, so readers cannot find the rest of the compendium from a clear starting point. The site also shows a build number without the game version or the date of its published data.

## What Changes

- **BREAKING** Move the interactive map from `/` to `/map`. Update every internal map link and map-specific share URL. Do not keep a redirect or old query path.
- Put a searchable compendium hub at `/`. Give readers direct paths to the map, published places with level ranges, classes, recipes, skills, and browse lists. Do not describe a place as suitable for a level without published evidence.
- Group the top navigation as World (Map, Places, NPCs, Quests, Properties), Items (Items, Recipes), and Character (Classes, Skills, Abilities). Reserve Reference and Mechanics for later changes. Keep navigation usable at 1440 px and 390 px.
- Show the accepted game's version, data date, and matching Steam patch-notes link in the shared footer. Replace the search hint with the kinds that the publication actually makes searchable.
- Improve the development-only map selection cards with a published-page link, a plain label, brief facts for the selected kind, and raw JSON in disclosures. Keep the cards outside production.
- Do not add page kinds, mechanics pages, or zone tabs.

## Capabilities

### New Capabilities

- `compendium-hub`: The home route, level-based place entry, and paths into published reference lists.

### Modified Capabilities

- `reference-layout`: The map route, grouped navigation, search hint, footer release details, and development-only map selection details.

## Impact

- Site routes, `PageShell.svelte`, `CompendiumSearch.svelte`, `MapExplorer.svelte`, `map/MapDevelopmentDetails.svelte`, and all site map-link producers.
- The static publication identity and staging flow gain the accepted release version, data date, and verified Steam article URL. This needs a catalog candidate comparison, a staged publication candidate, and joint acceptance.
- Existing page kinds and published place facts stay the source for hub links. No game numbers are embedded in site code.
