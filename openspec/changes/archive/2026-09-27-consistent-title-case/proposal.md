## Why

Category values read in two styles. Enum words become sentence case ("Quest item", "Off hand", "Quest giver"), while authored values keep title case ("Cooking Recipe", "One Hand"), so one filter can list "Cooking Recipe" beside "Quest interaction". Names have similar faults: words in capitals ("DEV RING", "Piercing EAR 1"), abbreviations in several spellings ("Gold Npc", "Aoe Blood Ground"), curly apostrophes beside straight ones, and the abbreviation "lvl." in qualifiers.

## What Changes

- Category values read in title case on pages, in tooltips, in list cells and filters, and on the map: item types and slots, gear types, rarities, roles and map categories, quest start types, NPC and creature types, place types, and kind labels.
- Published names change:
  - A word in capitals only reads as a word ("DEV RING" becomes "Dev Ring"). Roman numerals keep their capitals.
  - The abbreviations NPC, AoE, and CC take one spelling.
  - Curly apostrophes become straight apostrophes.
  - Level qualifiers read "Level 20–30" instead of "lvl. 20–30". **BREAKING**: the slugs of the pages with such qualifiers change, and slugs have no redirects.
- The NPC list's Place filter offers each place of an NPC instead of a count such as "3 places".
- The place tooltip names the Adventure Guide listing as the place page does: "In the Adventure Guide".
- Requirement sentences come from the catalog queries. A separate fix gives their item types the category rule.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `entity-identity`: the casing rule for published names, and the level qualifier.
- `detail-pages`: category values read in title case.

## Impact

- Contracts: a shared title word rule and `categoryLabel` in `packages/contracts/src/public/labels.ts`, and title-case map category labels.
- Publication: `displayName`, qualifier labels, kind labels, and the NPC list facet.
- Site: label helpers in `apps/site/src/lib/format.ts` and the components that show category values.
- A new publication candidate and its acceptance.
