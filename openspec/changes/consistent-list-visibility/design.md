## Context

The publication projects documents into static list rows; the site reads those rows, with the registry declaring columns and facet default-hidden values. Only the ability Source facet currently hides a value, and the reveal counts all rows with that value regardless of active search. The list measures a small sample of the matching rows and retains the widest measured cell width per column, preserving the fitted proportional spacing introduced in 6398eea.

## Goals / Non-Goals

**Goals:** Derive known-way visibility from the actual publication documents, count and reveal currently matching hidden rows, and choose columns against matching rows without losing the URL filter contract or width fitting.

**Non-Goals:** Change detail-page source explanations, map placements, global search indexing, loot probabilities, or catalog facts.

## Decisions

- Add a `knownWay` facet with `No Known Way` as the default-hidden value for items, NPCs and abilities. The static row is the only interface the site needs. Do not use item rarity, NPC level, sourceKind text, or an authored static exclusion list as visibility proxies. Keep the ability Source facet but remove its old default-hidden rule.
- An item's acquisition evidence is its published drop, vendor, currency purchase, gather, container, collection, quest grant/reward, craft, class/adventurer start, other-item gain, cloth drop, quest pickup, Dungeon Finder, or placed source. Count a recovered loot-list row only when it has a published source/owner; an unbound table name alone is not a player route. Do not mistake an item's own consumption or adventurer-only gear preference for an acquisition route.
- An NPC is known from a location, adventurer roster status, published summon/spawn/recruit evidence, or a reference from a different published page. Traverse published document refs once per publication and exclude each document's own subject ref, so an NPC does not count itself and changes to other published pages automatically update the flag. Ability versions are known from `learnedBy`, `usedBy`, `usedByItems`, and verified action-user/unlock fields provided by publication. Optional accesses allow publishing this list change before the data-recovery slice is integrated.
- Keep hidden entries behind the reveal even during name search. Compute each reveal count by applying the full current filters with only its own default-hidden facet explicitly selected. This preserves a visible and accurately counted `Show 1 Hidden` control for a search such as Shout; selecting it adds the facet to the URL. Counts collapse to zero under incompatible filters.
- Calculate column informativeness from the matched rows before sorting. URL range controls retain the full registry numeric columns, even if the current matching set makes one column uninformative. Contextual NPC Class and Party Role columns appear only when all matching rows are adventurers; item Damage appears only when all matching rows have a weapon type. Keep the width-measurement cache per column for non-jumpy widths and phone rows as cards. Grouped boss and enemy markers collapse to Boss while adventurer roles append their party role to the role badges.

## Risks / Trade-offs

A hidden-by-default list includes fewer visible rows than its published total. The result bar still reports visible out of published entries, and the reveal gives the currently matching hidden count. Column changes from explicit filter choices are intentional; widths of retained columns do not shrink during filtering. A previously hidden NPC can become visible because another published page now references it without acquiring a map location, which correctly avoids fabricating a place.