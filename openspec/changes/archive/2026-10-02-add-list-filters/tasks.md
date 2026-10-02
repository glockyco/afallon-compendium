## 1. Evidence

- [x] 1.1 Decompile the equip check of build 25653798 (`InventoryManager.CanEquipWeaponFromBag`, the `EquipItem` paths, and the callees that read `RPGClass.AllowedWeaponTypes` or item types). Record the class rule for each hand, shields, off-hand items, armor, and jewelry, and how captured class weapon types match item weapon types.
- [x] 1.2 Confirm the rule in the running game: `WeaponEquipmentRules.CanUse` for the Wizard with an allowed staff, a disallowed shield, and plate armor.

## 2. Data

- [x] 2.1 Add a catalog query for the reward types of each quest from the `given` and `pick` sets, including rows without a target and excluding `itemGiven`. Test that an untargeted Experience row counts, a choice counts as Item, and a supplied item alone does not.
- [x] 2.2 Add item stat entries to list rows and move the static kind-list schema to a new id with every reference, graph check, loader, and fixture.
- [x] 2.3 Publish the item `class`, `gear`, and `material` facets, the `gear` value and stat entries, and the quest `rewardType` facet. Test the class match for an allowed and a disallowed weapon and for armor, a material against a product, and a random stat range.

## 3. Site

- [x] 3.1 Build the filter panel: checkbox facets with several values and counts, hidden shared values, search in long facets, ranges, stat filters with bounds, chips, Clear all, and the sidebar layout from 960 px.
- [x] 3.2 Build the phone filter sheet with the active filter count and the result button.
- [x] 3.3 Keep every filter in the URL with push and replace history, and restore it on load, Back, and Forward.
- [x] 3.4 Add a sortable column for each selected stat, the Gear column, and readable labels for gear types, reward types, and stat units.
- [x] 3.5 Link each class page to the item list with its class selected.

## 4. Release

- [x] 4.1 Publish a candidate from the accepted catalog and stage it. Measure the list parts against the part budget.
  - Result: candidate `ak` (`bb9d1a14`) from catalog `bc70e233`. The item list fills part 0 to 524,253 of 524,288 bytes and holds the rest in part 1 (341,469 bytes); the largest other list, NPCs, is 202,148 bytes.
- [x] 4.2 Check the item, quest, NPC, and place lists in a browser at 1440 px, 1100 px, and 390 px: multi-value facets, counts, chips, stat filters and columns, the class link, the phone sheet, URL restore, Back and Forward, and no sideways scroll.
  - Result: at 1440 and 1100 px the item, quest, NPC, and place lists show the sidebar, and at 390 px the filter sheet, without sideways scroll. Usable by Wizard leaves 1,118 items with no shields, Strength of at least 40 leaves 24 items sorted by Strength, the Shieldmaster link opens the list with 1,151 items, and Back and Forward restore each filter state.
- [x] 4.3 Accept the publication with an update report and stage it in the main checkout.
  - Result: Accepted with catalog `bc70e233` and publication `bb9d1a14` (update report `local/update-report-25653798-talent-capture.json`, accepted descriptor `8ec84a05` in the main checkout).
