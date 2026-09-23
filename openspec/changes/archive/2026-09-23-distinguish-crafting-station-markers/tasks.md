## 1. Published station categories

- [x] 1.1 Extend the public marker category contract with the five named station types and generic fallback. Verify static placement schema validation accepts each category and registry coverage remains exhaustive.
- [x] 1.2 Resolve placed crafting services from verified station IDs and canonical station records in map publication. Verify Cooking, Smithing, Furnace, Alchemy, and Tailoring remain separate; missing, conflicting, and unsupported references use only the generic category.
- [x] 1.3 Preserve other roles and station-type search text when publishing placements. Verify one placement can match both a station filter and another role without duplicate published placements, and a search by station type returns the right records.

## 2. Atlas presentation

- [x] 2.1 Add five distinct glyph entries to the marker registry and icon atlas, keeping generic Crafting Station for fallback. Verify the registry-layer-atlas test and that glyphs remain distinguishable without color.
- [x] 2.2 Exercise filtering, result counts, category precedence, search, and URL reload with a regenerated local publication in the browser. Verify the five named filters, generic fallback, one physical marker per placement, and no Savers filter without a verified placement.
- [x] 2.3 Align place-page service counts with published station categories. Verify named and fallback stations form separate groups without leaking internal category fields into placement references.

## 3. Publication cutover

- [x] 3.1 Regenerate the local static publication with the updated contract and verify its map shard categories against the catalog's verified station placements. Confirm the site and static publication use one compatible versioned artifact set.
