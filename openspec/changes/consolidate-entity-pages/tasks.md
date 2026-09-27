## 1. Native rules and catalog

- [x] 1.1 Decompile the NPC level and random activator rules for build 25434619 and compare them with runtime observations
- [x] 1.2 Store activators as random choices and target entries, including repeated entries and nested membership
- [x] 1.3 Supply spawner overrides, scene ranges, and producer details to publication level rules
- [x] 1.4 Read property type, currency, purchase price, sale price, and income from typed for-sale sign references and reject conflicting signs
- [x] 1.5 Generate item ownership phrases from catalog requirements
- [ ] 1.6 Confirm the native interval and currency for property income and publish both
- [ ] 1.7 Derive world loot drops on item pages from the native loot rule
- [ ] 1.8 Explain the challenge completion effect in availability

## 2. Publication identity and relations

- [x] 2.1 Group creature and ability records by normalized name and choose the most frequent formatted title
- [x] 2.2 Publish creature variants with anchors, levels, differing portraits, and differing record facts
- [x] 2.3 Group identical ability rank texts into versions with users, teaching items, and differing icons
- [x] 2.4 Resolve one record to its variant and several variants to their page
- [x] 2.5 Derive slugs from formatted names and qualify colliding items, places, and creature records
- [x] 2.6 Format published entity names, map labels, region names, area labels, objects, containers, and chain names
- [x] 2.7 Embed gear set members and tiers in member items without publishing gear set pages

## 3. Publication content and map

- [x] 3.1 Compute random-choice probability and option counts for map placements and creature locations
- [x] 3.2 Apply confirmed native levels to markers, locations, variants, pages, place rows, and list rows
- [x] 3.3 Derive creature hostility and services from placement categories in map and pages
- [x] 3.4 Group quest starts and turn-ins per character and carry participating areas
- [x] 3.5 Sort creature locations by the earliest chain order of availability quests and own quests
- [x] 3.6 Link property purchase signs to property pages and project purchase panel facts
- [x] 3.7 Publish reader coverage counts and affected-page references, and validate them in the graph

## 4. Site presentation

- [x] 4.1 Render the creature variants table for differing record facts or variant-attributed drops, otherwise anchor variants in Where to find
- [x] 4.2 Render ability versions, item gear sets, linked item tooltip cards, and acquisition summaries
- [x] 4.3 Render property purchase panels and where-to-buy locations
- [x] 4.4 Use one artwork-only entity header with a title, fact line, and description
- [x] 4.5 Place desktop tooltips beside links with fallbacks and shorten quest completion previews
- [x] 4.6 Align quest Start, Turn-in, and Requirements cards and label chain context in the header
- [x] 4.7 Render inline requirement phrases with type prefixes and ordered availability rules
- [x] 4.8 Show a search spinner in its input and name the atlas Map in navigation
- [x] 4.9 Show published counts and gap pages in reader coverage without loading coverage on the map

## 5. Operator workflow

- [x] 5.1 Check parity across search, page, variant, ability version, and embedded gear set keys, without old URL constraints
- [x] 5.2 Require lists only for kinds that still have pages and read baseline resources by shape
- [x] 5.3 Release runtime ownership before quitting the game and wait for listener shutdown

## 6. Verification and acceptance

- [ ] 6.1 Rebuild the catalog from the rescan and publish a candidate
- [ ] 6.2 Verify creature, ability, item, property, quest, map, and coverage pages in the browser
- [ ] 6.3 Accept the publication
