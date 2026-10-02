## 1. Filter panel

- [x] 1.1 Render every filter group, including Item power, Level, and Stats, as a disclosure whose heading shows a chevron that turns with the group, as the map sidebar does, and the number of active filters in the group. Remove the fieldset legends that sat on the separator line.

## 2. Item list

- [x] 2.1 Replace the Type, Gear, and Slot columns of the item list with one Type column built from the weapon type, the jewelry slot, the armor type and slot, or the item type. Keep the Gear, Slot, and Type filters. Test a weapon, a piece of armor, a ring, and a material.
- [x] 2.2 Keep item and place type labels on one line above phone widths, so names wrap instead.
  - Result: on candidate `al` (`34c23d7b`), the list sorted by Strength wraps 6 of 300 rows at 1100 px and 3 of 300 at 1440 px, against 19 of the first 40 before. The full list wraps 2 of 1,198 rows at 1100 px and none at 1440 px. The remaining wraps are long variant names such as "Gilded Helm (Haste +17, Stamina +9, Strength +20)".

## 3. Release

- [ ] 3.1 Publish, check the item, quest, NPC, and place lists at 1440, 1100, and 390 px (no sideways scroll, fewer wrapped rows, open and closed groups), and accept the publication.
