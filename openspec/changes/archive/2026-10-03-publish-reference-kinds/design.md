## Context

The catalog already holds the records of these kinds: 27 gear sets with 184 members and 64 tiers, 3 currencies, 6 crafting stations with 131 recipes, 3 races, and 5 factions. The publication gave them references without pages. A recorded owner decision models faction pages, and other reference kinds, on the same overview page model as other entity pages rather than on glossary rows.

## Decisions

### Regular pages for every record

Each record of the five kinds gets a page, a list row, a search entry, and a tooltip. Kinds stay small, so their lists need few columns. Crafting station `craftingStations:4`, Savers, makes only the 13 progress-flag recipes of the excluded skill Savers and stands nowhere on the map, so the reviewed exclusion list keeps it out, and the publication fails if the station ever gains a map spot or a published recipe.

### Shared projections, not copies

The item page's Buys rows and the currency page's purchase rows come from one projection and one section component. The item's gear set and the set page read one tier projection. An item's gear set now names the set by reference.

### Faction standing comes from verified creation code

Native code shows that character creation copies the relations of the race's faction, and serialized race assets show that all three races belong to Humans. The rules record carries that rule with a link to Humans, and the publication reads the new character's standing toward each faction from it. Without the rule, no starting standing is published. The NPC count of a faction counts the NPC pages that name the faction, as the NPC list's Faction filter counts them. No creature, quest reward, or item in the catalog changes standing, and the guide states the computed count rather than a fixed sentence.

### Station spots carry the station's key

A map spot whose station details resolve to one station carries that station's key, so the station page can open the map on its spots, per place or all at once, and the map shows the station's page card for a selected spot.

## Risks / Trade-offs

- An Enemy alignment does not prove that a creature attacks on sight. The guide states the verified alignment and the aggression rule without claiming who attacks.
- Gear set activation is verified from native code, but no live check was possible. The page states only the verified counting rule.
