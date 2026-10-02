## Context

The item list has the columns Type, Gear, Slot, Item power, and Level, and one column per selected stat. Beside the 248 px filter panel, the table is 758 px wide at 1100 px and 810 px at 1440 px. Measured on the list sorted by Strength, the columns took Type 79 px, Gear 101 to 112 px, Slot 92 px, Item power 109 px, and Level 68 px, which left the item name 214 to 255 px, and 16 to 19 of the first 40 rows wrapped. The Gear column wrapped "Two Handed Sword" onto two lines at 1440 px and three at 1100 px.

## Decisions

### Merge the three type columns instead of abbreviating

A weapon row read "Weapon | Two Handed Sword | Two Hand": the weapon type already names the hands, and Weapon adds nothing to it. An armor row read "Armor | Plate | Helmet", where Armor follows from the armor type. One Type column now names what the item is: the weapon type of a weapon, the slot of jewelry (Ring, Neck, Trinket), the armor type and slot of other armor (Plate Helmet), and the item type of anything else (Material). This frees two columns without shortening any word. Abbreviations such as 1H and 2H were rejected: the project prefers clarity over brevity, and the merged column fits "Two Handed Sword" on one line. The Gear, Slot, and Type filters keep each fact, so a reader can still narrow the list by any of them, and sorting by Type groups armor by armor type and then slot.

### Keep Item power

Item power is the game's own measure of gear quality and the column that readers sort by to compare gear. The merge frees more width than removing Item power would, so the column stays.

### Let names wrap

Variants of one item differ only at the end of the name, such as "Poison Blade (Uncommon)" and "Poison Blade (Rare)", or the stat list of "Gilded Helm (Haste +17, Stamina +9, Strength +20)". An ellipsis would cut exactly the part that tells them apart, so names keep wrapping. The merged column gives the name the width of the two removed columns.

### Every filter group is a disclosure with a chevron

Facet groups already opened and closed, but their summary hid the browser's marker, so nothing showed it. The range and Stats groups were fieldsets whose legends sat on the group's top border, so the separator ran through their headings. All groups are now disclosures with the chevron of the map sidebar, which points up when the group is open, and with a count of the group's active filters. A closed group keeps its filters, and the chips above the results still name them.

## Risks / Trade-offs

- Sorting by Type no longer sorts by slot across armor types. → The Slot filter selects one slot, and the merged label sorts each armor type's pieces by slot.
- Several selected stat columns still narrow the name column. → Readers choose those columns, and names wrap instead of hiding text.
