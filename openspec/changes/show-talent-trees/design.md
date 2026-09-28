## Context

See `proposal.md` for the motivation. The accepted catalog has 660 nodes in 30 talent trees. Its `talent_nodes` coordinates range from tier 1 to 10 and position 1 to 6. It has 497 bonus facts and no artwork bindings for bonuses or trees. These counts come from read-only queries of accepted catalog 6bc13a4c. `support.csx:3-19,348-357` records each entry's `entryIcon` name and each node's coordinates. The evidence brief reports nonempty `entryIcon` values for 497 of 497 bonuses and 30 of 30 trees. These names are not image assets. `artwork.csx:98-116` exports icons for other families but omits bonuses and trees.

`packages/catalog/src/normalize.ts:227-241` binds exported artwork only to canonical entities. Trees are canonical entities, but bonuses are progression facts without canonical entity rows. `packages/publication/src/artwork.ts:18-51` converts entity artwork to WebP. `packages/contracts/src/public/documents.ts:449-457,617-622` has no tree or node icon field, and its artwork edge collector does not visit these fields. `apps/site/src/lib/detail/pages/ClassPage.svelte:42-54` shows a separate table section for every tree. `documents.ts:839-850,905-920` defines stable node anchors and orders the rows by tier and position.

## Goals / Non-Goals

**Goals:**
- Preserve the existing node identity, effects, requirements, ability links, and authored tree order.
- Export source sprites and make the grid and table read the same published rows.
- Keep a missing sprite visible as a coverage issue without hiding its node.

**Non-Goals:**
- Do not allocate points, infer legal builds, or make a planner. `build-character-planner` follows this change.
- Do not create separate public pages for trees or passive talents.
- Do not interpret tier and position as a requirement or a progression gate. They are captured layout coordinates.

## Decisions

### Use the artwork collector and store explicit progression bindings

Extend `artwork.csx` to export `entryIcon` for `GetTalentTrees()` and `GetBonuses()`, using the existing sprite reader and `icon` role. Keep extracted, missing, and unsupported statuses with source paths. Do not render icons from names in support evidence. Names identify candidates but cannot supply pixels. The accepted support evidence already has coordinates, so this change does not alter support projection.

Tree bindings can use the existing canonical-entity artwork table. Bonus bindings need a catalog table keyed to a progression fact, with a foreign key to `progression_facts`, an asset reference, a role, and provenance. Extend normalized inputs and queries to return these bindings. Avoid inserting fake canonical bonus entities merely to reuse `artwork_bindings`. Reuse the existing content-hashed artwork asset table for both kinds of binding. Compare both the new bindings and the preserved tree and node rows against the accepted catalog.

### Add artwork to published tree and node data

Extend the class document so each tree and each passive node can carry an optional icon reference. An ability node uses its existing ability reference icon when present. The same rows supply the grid and the table. Publish bonus icons through the existing WebP conversion path, with hash-based deduplication and graph assets. Include the new icon references in `artEdges` and publication graph checks. This avoids URLs derived in site code and keeps missing icons optional. Check the largest class document against its existing size budget.

### Use the shared tab set for tree selection

`add-page-navigation` owns the reusable tab component and the `tab` URL query parameter. Render one Talent trees section with the class's trees in authored order. Use a stable internal tree key for tab values and readable tree names for tab labels. The selected tree presents its point type, default grid, and a Grid/Table view control. Store the view choice in local UI state. Changing a tree keeps the selected view. This change does not replace or duplicate C2's tab set.

Build grid rows from captured tier and position. Keep empty slots so nodes retain their relative positions. Do not truncate when a later build exceeds current maxima. Use the captured bounds to size the grid. At 390 px, contain overflow inside the grid panel with a visible horizontal scroll cue and touch access. Do not scroll the page sideways or shrink text below a usable size. Each node has a focusable icon/name control and a detail panel with its rank effects, requirements, and ability link. The table keeps the current full-row presentation. It remains a second view, not a second copy of the nodes in the document.

### Resolve anchors across tabs and views

Keep `talent-<tree>-<node>` and `tree-<tree>` anchors unchanged. A fragment that targets a node takes precedence over a stale `tab` parameter. Select its owner tree before scrolling to the active view. Retain one DOM element with each node ID in the selected view, rather than duplicate IDs in hidden views. When the reader changes views, keep the selected node visible. On navigation within the same page, react to hash changes as well as initial load. Other talent references keep their existing class-local resolution. Do not add redirects or alternate paths.

## Risks / Trade-offs

- Bonus artwork lacks a canonical-entity row. → Use a progression-specific foreign key and verify bindings against the accepted bonus fact set.
- Some sprite exports can fail. → Retain explicit issues and readable node controls with no icon.
- Grid geometry can exceed a phone's width. → Scroll only its panel and check all positions and details at 390 px in a browser.
- URL tabs and fragments can disagree. → Give the node fragment precedence and verify both direct loading and in-page navigation.
- New artwork increases publication size. → Deduplicate by image hash and measure assets and the largest class document.

## Migration Plan

Implement the collector, catalog contracts and bindings, publication contracts and assets, and class UI. Run a new scan if artwork evidence is absent. Build a catalog candidate and compare its rows with accepted catalog 6bc13a4c. Record all scan-to-scan changes and stop on unexplained differences. Stage a publication candidate against the accepted publication. Check class pages, deep links, and both views at 1440 px and 390 px. Accept the catalog and publication together with one update report. Keep the previous accepted publication as rollback. No route alias or redirect is part of this change.
