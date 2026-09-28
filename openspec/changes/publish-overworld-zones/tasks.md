## 1. Capture and verify region evidence

- [ ] 1.1 Extend `canonical.csx` and its raw contract to capture every non-null `RegionTemplate` by string dictionary key. Include `regionType`, `parentMajorRegion`, level range, guide lore, and provenance. Verify that captured keys are unique, counts reconcile, and no region relies on runtime ID -1.
- [ ] 1.2 Add the same template key to `world-sources.csx` region instances and region artwork in `artwork.csx`. Verify that each resolved instance and artwork record joins to exactly one canonical template by key, including two templates with the same name.
- [ ] 1.3 Run a new owned scan for build 25434619 with the changed collectors. Check the cleanup receipt and source totals. Query the raw scan for every region key, type, parent, and instance. Record the actual major and minor sets before implementing any placement-to-zone rule. Check them with a read-only HotRepl database probe. Do not treat Coalway Swamp or Chillwind Heights as major by name.
- [ ] 1.4 Verify the complete zone selection rule before using it. Read `RegionManager.Resolve`, region containment, active-state selection, parent handling, and tie behavior with bounded Ghidra decompilation and assembly review. Follow `.agent/skills/native-analysis/SKILL.md` and check the build hash and all decompilation diagnostics. Compare a few overlapping and boundary positions with a read-only HotRepl probe. Record any unresolved branch as a research gap and continue until zone attribution is supported.

## 2. Catalog identities and zone assignment

- [ ] 2.1 Extend canonical and normalized contracts and database constraints for string-keyed regions. Keep existing integer identities for other kinds. Verify with focused admission and catalog tests that two templates with runtime ID -1 stay distinct and duplicate or missing keys fail visibly.
- [ ] 2.2 Decode region type, parent reference, level range, lore, artwork, and scene ownership into typed region facts. Join geometry instances through their captured keys. Verify that each non-null parent and instance resolves to one template, and unresolved references produce coverage issues rather than name-based matches.
- [ ] 2.3 Implement the verified game rule for Afallon placements only. Store one selected major zone, its evidence, and any confirmed minor area separately from the map spot. Verify focused tests for nested major zones, an owned minor area, an overlap tie, and a placement with no containing major zone. Compare the result with the sampled HotRepl positions from task 1.4.
- [ ] 2.4 Build a catalog candidate from the new scan and compare every changed row with accepted catalog `6bc13a4c` at `artifacts/objects/sha256/33/3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4`. Verify expected region identities, facts, artwork, geometry joins, zone attribution, and coverage changes. Review unrelated scan-to-scan differences rather than accepting them as zone effects. Count Afallon placements without a verified selected zone and keep each mapped spot.

## 3. Public place and location data

- [ ] 3.1 Extend place documents and reference resolution to publish each captured region as a distinct place. Keep unmapped regions reachable with a missing-location label. Verify graph and projection checks for duplicate names, repeated instances, and a region with no geometry. Measure the largest document against the existing size limit.
- [ ] 3.2 Project Afallon's ordered major-zone tabs from the catalog keys. Include captured level range, lore, owned areas, and only the content assigned to each zone. Verify a projection test where two overlapping major zones share geometry but each placement occurs in only its selected zone.
- [ ] 3.3 Add structured zone references beside specific area labels and map spots in NPC and quest location data. Cover givers, turn-ins, starts, objectives, and world quest zones. Verify a focused projection where a quest crosses two zones and each location points to its own tab. Preserve the map link for an unknown-zone location.
- [ ] 3.4 Publish all observed scene pages in Places and search unless reachability evidence proves an exception. Add missing-map and missing-content labels without removing captured facts. Verify a coverage comparison for the 14 accepted scenes with no map or placements. Check that Coalway Woods, Coalway Swamp, and Chillwind Heights keep their level ranges and lore, and that `placeWithoutMap` still names each affected page.

## 4. Site presentation and browser checks

- [ ] 4.1 Render the Afallon zones with C2's shared URL-backed tab set and its shared "On this page" list for four or more sections. Show zone facts, areas, and assigned content. Verify in a browser that direct `?tab=<zone-slug>` links select the same zone after reload and that tab names contain no raw keys or enum words.
- [ ] 4.2 Show linked zone and area labels on NPC and quest pages, with the separate map spot links on C1's `/map`. Verify in a browser that an NPC in a minor area opens its major zone tab. Check a quest with locations in two zones and an unknown-zone map spot.
- [ ] 4.3 Show missing-map and missing-content labels on scene pages and the Places list. Keep the existing detail structure for other place kinds. Verify in a browser that the three named lore scenes remain searchable and show their captured facts without a map action.

## 5. Publication and acceptance

- [ ] 5.1 Publish a candidate from the reviewed catalog and stage it against the accepted publication. Verify no publication issues, valid graph references, coverage counts, map/placement parity, and a reviewable update diff. Keep the accepted publication as the baseline and rollback.
- [ ] 5.2 Check the staged site in a browser at 1440 px and 390 px. Open Afallon tabs, direct tab links, a region page, NPC and quest area links, and an unmapped scene page. Verify keyboard tab selection, the "On this page" list, readable labels, and no horizontal overflow.
- [ ] 5.3 Write the update report after reviewing the catalog and publication changes. Accept the catalog candidate and publication candidate together. Verify that the accepted build names both new artifacts and retains the previous publication as rollback.
- [ ] 5.4 Run focused contract, catalog, publication, and site checks for the changed paths, then run the project checks needed by the update workflow. Verify all required checks pass and run `openspec validate publish-overworld-zones --strict`.
