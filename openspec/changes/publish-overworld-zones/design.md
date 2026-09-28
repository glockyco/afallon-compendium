## Context

See `proposal.md` for the motivation. The accepted catalog query returned 42 scene entities, 160 spatial region instances, and 6,657 placement-area rows. For scene 47, Afallon, it returned 3,847 placements and 3,844 placement-area rows. A query of `canonical_entities`, `place_facts`, and `placements` found 14 scenes with no map and no placements. Coalway Woods, Coalway Swamp, and Chillwind Heights have both a level range and guide lore. These counts describe the accepted build, not a promise about the next scan.

`packages/contracts/src/raw/database.ts:19-21,45-60` requires integer source keys and nonnegative unique native IDs. `packages/scan/src/probes/collectors/canonical.csx:1037-1040` leaves the region template array empty. `packages/scan/src/probes/collectors/world-sources.csx:2275-2299` observes region instances but projects their templates by name and runtime ID. `packages/catalog/src/areas.ts:29-43` selects the smallest geometry among all containing regions without testing the region type. `packages/publication/src/documents.ts:743-781` groups place content by scene. The shared location component links placements to the map, not to a zone (`apps/site/src/lib/LocationLinks.svelte:1-18`).

The recovered `RegionTemplate` declaration has `regionType` and `parentMajorRegion` (`Templates/RegionTemplate.cs:3-14`). Its tooltip says that the smallest containing major region wins. The bounded `RegionManager_Outranks` decompilation confirms smaller-area precedence and shows tie comparisons (`research/ghidra/25434619/skill-corruption-region-functions-exact-20260928.json`, function `RegionManager_Outranks`). It does not prove which observed templates are major, whether every authored collider is active, or how vertical containment affects a placement. The tasks verify those facts before zone assignment.

This change depends on `build-compendium-hub` for `/map` and the grouped Places link. It depends on `add-page-navigation` for URL-backed `tab` selection and the shared "On this page" list. It does not own either component or route.

## Goals / Non-Goals

**Goals:**
- Keep source identity, region type, ownership, lore, geometry, artwork, and placement attribution aligned across scan, catalog, and publication.
- Show one Afallon tab per captured major zone and retain every reachable scene and region record.
- Make area links select the correct zone without losing the specific area or map spot.

**Non-Goals:**
- Redesign dungeon, interior, or other place-kind pages.
- Add map layers, map routes, or a second tab component.
- Assign unknown records to a nearby zone or assert a game rule from a tooltip alone.

## Decisions

### Identify region templates by dictionary key

Use the dictionary key returned by `GetRegionTemplates()` as a region template's source identity. Store it as a string and derive a reversible, escaped `regions:` entity key. Keep the source string out of reader text. Preserve integer native IDs for other kinds. Make the region native ID nullable rather than substituting an ordinal or a hash. Validate uniqueness of keys and total counts at admission. For every region instance, resolve its `RegionTemplate` by object identity against the same dictionary. Carry that source key through world observations, spatial region rows, and artwork bindings. An unresolved or ambiguous reference creates a coverage issue and no guessed relation.

An ordinal changes when the dictionary changes. A name can collide or change. The accepted catalog schema uses `native_id INTEGER NOT NULL`, `source_key INTEGER`, and a numeric entity-key check (`sqlite_master` query of `canonical_entities`). Those constraints need a region-specific extension. Keep existing numeric-kind behavior and update queries and bindings that assume all entities have integer native IDs. Do not create a compatibility alias for `regions:-1`.

### Capture types before assigning zones

Project `regionType`, `parentMajorRegion` by dictionary key, level range, guide lore, and artwork from each region template. Use the current scene parent only for scene ownership, not to infer a region's major parent. Map a parent reference to the captured entity key, and report an invalid parent link. Preserve a region without mapped geometry as a published place with a missing-location label.

First inspect the new scan and candidate catalog to list each type, parent, and scene instance. Confirm the major set with a read-only HotRepl database probe. Then verify `RegionManager.Resolve`, region containment, and the tie rule through a bounded build-matched decompilation and a small read-only position probe. Use `.agent/skills/native-analysis/SKILL.md` for address, unwind, binary-hash, assembly, and diagnostic checks. The existing `Outranks` result is supporting evidence, not full selection proof. If an authored rule is not confirmed, record the gap and do not publish a claimed game-selected zone from an approximation.

### Keep zone assignment separate from the area label

Join each mapped overworld placement to active major-region instances in its scene and map space. Apply the verified game selection rule. Record one selected major template per placement, with the instance and provenance used. Resolve a containing minor region only within its selected parent if the native verification confirms that relation. Retain the most specific area label separately. Preserve the map placement with an unknown-zone state when no verified major region contains it. Do not use string names as join keys. The current `placement_areas` row selects from all regions, so using it alone for zone membership would classify a minor area as a zone.

The default map remains the game-provided map. Region polygons only connect the already observed region instances and map placements. A repeated instance of one template does not create a second place page. Zone content is grouped by distinct published placement IDs, so overlapping geometry does not duplicate a creature, point of interest, property, or quest within several tabs. Keep the existing scene-based relations for non-Afallon place kinds.

### Publish one source of zone content

Project each region template as a distinct place reference and document. Its facts come from that template, and its mapped content comes from placements assigned to it. Keep minor areas under their captured major owner. The Afallon place document carries ordered major-zone sections that reference those region facts and the placement-derived content. It does not hard-code zone names, level numbers, or text. The site renders these sections with the shared C2 tab set, using the public zone slug as the `tab` value. Preserve the regular place document and its existing order for other place kinds.

Give NPC and quest locations structured zone references alongside their specific area labels and placement references. Group locations by the resolved zone key and specific area, not by the display text. For world quest starts, objects, targets, givers, and turn-ins, link each relevant location separately. A zone reference opens `/places/afallon?tab=<zone-slug>`. A map location uses C1's `/map` path. The public contract does not expose a raw dictionary key or an enum word in reader text. Unknown-zone locations remain linked to their map spots without a fabricated zone link.

### Keep scenes without content in the list

Do not remove a scene because it has no map or placements. The existing coverage resource reports `placeWithoutMap` (`packages/publication/src/coverage.ts:14-16`). Add reader labels for missing map and missing content in the place list and page. Retain captured lore and level ranges. Only mark a scene unreachable after explicit reachability evidence. This keeps records such as Coalway Woods, Coalway Swamp, and Chillwind Heights visible while the site explains what it cannot map.

## Risks / Trade-offs

- Template references now cross string and integer identity paths. → Add coverage and reference checks for duplicate names, missing keys, and repeated instances.
- A 2D map polygon can disagree with native 3D containment or active-region state. → Verify the native selection rule and sampled positions before grouping content. Keep unknowns explicit.
- A new scan can move placement rows unrelated to zones. → Compare all candidate rows with the accepted catalog and review scan-only changes separately.
- Afallon zone content can make one document large. → Measure the document against the existing size limit. Reuse referenced documents or split public resources if needed, without losing tab content.
- A list of unmapped scenes can look empty. → Show the recorded facts and precise missing-data labels without implying those scenes cannot be reached.

## Migration Plan

Capture the region evidence with a new scan. Validate identity and major-region counts, then verify native selection before assigning zones. Build a catalog candidate and compare it row by row with the accepted catalog. Implement the publication and site projections against that reviewed catalog. Publish a candidate staged against the accepted publication. Check Afallon and linked NPC, quest, region, and unmapped-scene pages in a browser at 1440 px and 390 px. Record coverage and graph parity. Accept the catalog and publication together with an update report, following the archived `publish-class-and-skill-pages` cycle. Keep the accepted publication as rollback. Do not retain old region keys, old area link formats, or map-route aliases.
