## 1. Level rules

- [ ] 1.1 Decompile `MobCombatEntity.InitNPCLevel`, `GetScaledPlayerLevel`, `ZoneLevelRules.*`, and the adventurer spawn path for build 25434619
- [ ] 1.2 Check the decompiled rules against the runtime observations and record them in EXPLORATION.md
- [ ] 1.3 Decide whether any rule needs data that the scans do not record

## 2. Catalog

- [ ] 2.1 Admit random activators over placements as weighted alternative groups
- [ ] 2.2 Provide the level-rule inputs (spawner overrides, scene zone ranges, producer kind) per placement

## 3. Publication identity

- [ ] 3.1 Group NPC and ability records by normalized name with variants and anchors
- [ ] 3.2 Resolve record keys to group refs with variant anchors in every reference
- [ ] 3.3 Derive slugs from display names and remove the stable-suffix branch
- [ ] 3.4 Build readable qualifiers for items and places, without level 0 or internal names

## 4. Publication content

- [ ] 4.1 Build grouped NPC documents with where-to-find, story order, and a variants table
- [ ] 4.2 Build grouped ability documents with a variants table
- [ ] 4.3 Apply one effective-level function in documents, lists, map shards, and qualifiers
- [ ] 4.4 Derive hostility from placement faction roles
- [ ] 4.5 Show one start and turn-in entry per character
- [ ] 4.6 Carry alternative groups on map placements

## 5. Site

- [ ] 5.1 Render NPC and ability pages with locations and variants
- [ ] 5.2 Link record references to variant anchors
- [ ] 5.3 Position tooltips with Floating UI and shorten quest tooltip texts
- [ ] 5.4 Remove empty and constant quest columns, join quest texts, and unify widths
- [ ] 5.5 Check parity by entity coverage

## 6. Tools

- [ ] 6.1 Release runtime ownership before quitting in `quit-game.ts`

## 7. Verification and acceptance

- [ ] 7.1 Rebuild the catalog and publish a candidate
- [ ] 7.2 Verify Fenric Doryn, Thalgrim Wayfinder, Skeleton Warrior, Cleave, Peasant Chest, and a quest page in the browser
- [ ] 7.3 Accept the publication and update EXPLORATION.md
