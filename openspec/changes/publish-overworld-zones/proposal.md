## Why

The Afallon place page groups the overworld as one place, so readers cannot compare its zones or follow area links to the right content. Region templates are observed but unpublished because their dictionary keys are strings and their runtime IDs are -1 (`packages/scan/src/probes/collectors/canonical.csx:1037-1040`, `packages/contracts/src/raw/database.ts:19-21,45-60`).

## What Changes

- Capture every region template with its string dictionary key, region type, parent major region, level range, lore, and guide artwork when available. Publish each record with a stable identity that does not use its runtime ID.
- Identify the major regions from captured region types before assigning overworld placements. Select the smallest containing major region, then preserve the more specific area within that zone. Resolve overlaps by the verified game ordering rule.
- Give the Afallon place page one URL-backed tab per major zone through the shared tab set from `add-page-navigation`. Each tab shows the zone's level range, lore, areas, and published content.
- Link NPC and quest area labels to the selected zone tab. Keep distinct area labels and placement links where they give more detail.
- Keep scene records without maps or placements reachable and label their missing content. The accepted catalog has 14 such scenes. Coalway Woods, Coalway Swamp, and Chillwind Heights each have both a level range and guide lore (read-only catalog query of `canonical_entities`, `place_facts`, and `placements`).
- **BREAKING**: Replace text-only area labels and any numeric region reference with links to string-keyed regions and the relevant Afallon tab. Do not keep legacy aliases or redirects.
- Keep the existing page structure for other place kinds. This change does not redesign their pages.

## Capabilities

### New Capabilities

- `overworld-zones`: Define zone selection, region coverage, tab content, and links from overworld locations.

### Modified Capabilities

- `entity-identity`: Give string-keyed region templates stable distinct identities and references.
- `detail-pages`: Present Afallon by major zone and label scene pages with no published map or content.

## Impact

- Scan: region templates in `packages/scan/src/probes/collectors/canonical.csx`, scene region observations in `world-sources.csx`, and region artwork in `artwork.csx`.
- Contracts and catalog: region identity, typed region facts, parent links, spatial region joins, placement zone selection, and queries in `packages/contracts/src` and `packages/catalog/src`.
- Publication and site: place documents, location references, area links, coverage, and the Afallon place page in `packages/publication/src` and `apps/site/src`.
- Artifacts: a new scan, a catalog candidate compared with the accepted catalog, a publication candidate staged against the accepted publication, browser review, and joint acceptance of catalog and publication.
