## Context

`packages/publication/src/kind-registry.ts` defines the columns and facets of each list. `packages/publication/src/lists.ts` builds one row per document with primitive `values` and string `facets`. `apps/site/src/lib/ListTable.svelte` restores search, sort, one value per facet, and numeric ranges from the URL, and renders the filters as a row of fields above the table.

Facts of accepted publication `f7e8f3d6` (catalog `d3b56f3f`, build 25653798):

- 1,198 items. 750 have stats, with 75 distinct stats. Stamina (647), Strength (300), Armor (294), Intellect (285), and Agility (178) are the most common. Only two items have a random stat.
- 175 weapons, each with a weapon type. 575 armor pieces and jewelry, each with an armor type. The game names weapon types inconsistently (`STAFF`, `One handed sword`, `Two-Handed Mace`).
- The only equipment requirement on any item is Level. No item has a class requirement on use or on equip.
- 98 items are materials of a published recipe.
- 177 quests. In catalog `quest_rewards`, every quest has an untargeted Experience row in its `given` set, 60 have a currency, 174 give items, and 18 offer an item choice (`pick`). Two rows in the `itemGiven` set are items that a quest supplies, not rewards. `queryQuestRows` skips rows without a target, so publication does not see the Experience rows today.

`RPGClass.AllowedWeaponTypes` (+0x78) holds the weapon types of a class. Its tooltip says a class can equip these types in either valid hand and that armor and level requirements stay on the item. The tooltip is intent. The equip check in `InventoryManager` decides.

## Goals / Non-Goals

**Goals:**
- One filter panel for every list, with several values per filter, counts, chips, and URL state.
- Item filters for class, gear type, crafting materials, and stats. A quest filter for reward type.
- Game values come from publication. The site holds no game numbers or class lists.

**Non-Goals:**
- Ranking, scoring, or recommending gear. A character planner.
- New scan fields or a new catalog. The accepted catalog holds every fact these filters need.

## Decisions

### Usable by follows the game's equip check

The native review of build 25653798 (`local/research/equip-rule-20261002.md` in the main checkout, decompilations `research/ghidra/25653798/equip-rule-*-20261002.json`) settles the rule:

- `InventoryManager.UseItem` (RVA `0x99d230`) calls `CanPlayerUse`, and for a weapon `CanEquipWeaponFromBag`, before it evaluates the item's requirements.
- `WeaponEquipmentRules.CanUse` (RVA `0x54e030`) returns true for every item that is not a weapon. For a weapon it checks that the class's `AllowedWeaponTypes` (+0x78) contains the item's `WeaponType` (+0x90). The check has no hand argument. Hand fit is a separate check (`FitsHand`, RVA `0x54e3f0`).
- Shields are weapons with the weapon type Shield, so a class needs Shield in its list.
- No path reads armor type, race, or class for armor, jewelry, or trinkets. Every captured equipment requirement is a Level requirement.
- The captured weapon type ids are all -1, but the names match exactly between class lists and items in this build.

Publish the class names that can use each item as the `class` facet. A weapon lists each offered class whose allowed weapon types include the weapon's type, compared by name. Every other item lists every offered class. The filter is called Usable by. A class match does not claim that the reader meets the item's level requirement. The item page keeps that requirement. Starting gear and save loading equip items without this check, and the filter describes the normal use rule only.

Matching by an item's source or by an NPC loot specialization was rejected. Neither is an equip rule.

### The Gear column names the weapon or armor type

Item rows get a `gear` value and facet from the weapon type or the armor type. The site labels it with `categoryLabel`, so `STAFF` reads Staff and `One handed sword` reads One Handed Sword. The Type column keeps the broad item type, because the hub's item groups link through the Type filter.

### Item rows carry stat entries

A list row value is a string, a number, or null, so it cannot hold several stats with units. Item rows get an optional `stats` array: the stat name, whether it is a percentage, and either a fixed amount or the minimum and maximum of a random stat. They come from `facts.stats` and `facts.randomStats`. Gem socket bonuses and enchantments are not item stats and stay out. The static kind-list schema gets a new id, and its manifest references, graph checks, loader, and fixtures move with it.

A stat filter is keyed by the stat name and its unit, so a flat stat and a percentage stat with the same name stay apart. A stat filter without bounds matches items that have the stat. A minimum and a maximum are inclusive. A fixed amount must lie inside them. A random range matches when it overlaps them, and its cell shows the range. Each selected stat adds a sortable column with the item's amount. One fixed column per stat was rejected: 75 sparse columns would make the table unreadable.

### Quest reward types come from the catalog reward rows

A catalog query returns the distinct reward types of each quest from the `given` and `pick` sets, including rows without a target. It excludes the `itemGiven` set, which supplies items to a quest. A choice reward also counts as its type's choice, so a quest with a choice of items has Item and Item choice. Publication passes the result to the quest list rows as the `rewardType` facet. The labels are Experience, Item, Currency, and Item choice. With the accepted data every quest gives experience and an item, so the panel offers Currency and Item choice, the values that separate quests. Reading the types from the published `rewards` and `rewardChoices` was rejected, because those arrays omit Experience.

### Used in crafting comes from published recipe uses

The `material` facet is true when the item document has `usedInRecipes`. A product of a recipe is not a material because of that recipe.

### One filter panel

- From 960 px, the filters sit in a sidebar of about 16 rem beside the results. Below 960 px, a Filters button with the active filter count opens a full-height sheet. The sheet is a modal dialog with the same controls and a footer with Show N results and Clear all.
- List facets render as groups of checkboxes. Several values in one facet match any of them. Different facets must all match. Each value shows the count of rows that would match if it were added, counting all other active filters. A value that every row has is not offered unless it is selected, and a facet with no other value is not shown. A facet with more than ten values gets a search field above its values.
- Numeric columns keep their minimum and maximum fields.
- Above the results, the count reads "143 of 1,198 items". Each active filter is a removable chip. Clear all removes every filter.
- Results update on every change. The data is local, so no Apply step is needed. The phone sheet's button closes the sheet.
- A list with fewer than 20 rows, or without facets or numeric columns, keeps the name field above the table and has no sidebar.

### URL state

Facets keep repeated parameters, for example `?class=Shieldmaster&gear=SHIELD&gear=AXE`. Ranges keep `min.<column>` and `max.<column>`. A stat filter is `stat=<name>[%]:<min>:<max>`, with empty bounds allowed, and it can repeat. The parser reads the last two colons as the bounds, so a stat name may contain a colon. Selections push a history entry. Typing in the name field replaces the current entry. Back and Forward restore the controls.

### Class pages link to their gear

Each class page links to `/items/?class=<class name>`. It uses the same URL that selecting the class in the filter makes.

## Risks / Trade-offs

- Weapon types match by name because the capture keeps no type ids. → A later build that renames a type breaks the match. Publication stops when a weapon type matches no offered class, so a rename shows before release.
- The rule comes from decompiled code. → A read-only HotRepl check calls `WeaponEquipmentRules.CanUse` for the Wizard with an allowed staff, a disallowed shield, and plate armor.
- Stat entries make the item list larger. → Measure each list part against the 524,288-byte part budget before staging.
- Facet counts recompute for every change. → 1,198 rows and fewer than ten facets cost well under a frame. Measure on the item list.
- Long checkbox groups lengthen the sidebar. → Groups with more than ten values get a search field and scroll inside a bounded height.

## Migration Plan

Verify the equip rule. Add the quest reward query, the list row stat entries, and the new kind-list schema id with every reference. Build the filter panel, the phone sheet, and the class page link. Publish a candidate from the accepted catalog, stage it, and check the lists in a browser at 1440 px, 1100 px, and 390 px. Accept the publication with an update report. The previous accepted publication is the rollback.
