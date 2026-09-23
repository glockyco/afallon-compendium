## Context

See `proposal.md` for the motivation and `specs/crafting-station-map-markers/spec.md` for behavior. The scanner exports each world crafting service with a typed `stationID`, a station reference and `stationReferenceStatus`. Catalog source details retain those fields. `generateMapShards` currently maps the `craftingService` role directly to `craftingStation`, and the site uses one registry entry for that category.

The inspected catalog has station records 0 Alchemy, 1 Cooking, 2 Smithing, 3 Furnace (Metallurgy), 4 Savers, and 5 Tailoring. Source details contain placed references for 0, 1, 2, 3, and 5, but none for 4. These are catalog observations, not a permanent guarantee about future builds.

## Goals / Non-Goals

**Goals:** Preserve the existing role-based map pipeline and resolve each verified station to one useful service type. Keep marker filters, glyphs, labels, and URL state consistent with published categories.

**Non-Goals:** Do not change scan extraction, invent a station from craft skills, create recipe pages, or add a Savers marker before a verified placement exists.

## Decisions

1. Resolve station type during map publication from `sourceDetails` for a placement with `craftingService`. Require `stationReferenceStatus === "resolved"`, a valid `stationID`, and a matching canonical `craftingStations` entity for the current catalog build. Map only the five known IDs whose canonical names match their expected station records to new public categories. If references disagree, are missing, or are unsupported, keep `craftingStation`. Do not use `sourceName`, `station.name`, `craftSkills`, or object names as classification inputs. This avoids a second scan or a site-only classifier and keeps map shards self-contained.
2. Replace the generic category on verified named stations rather than adding a second station category. Leave the generic category only as fallback. Preserve unrelated roles on the placement and let `resolveMarker` choose its one glyph from enabled categories. This preserves existing multi-role filtering and count behavior.
3. Extend `PUBLIC_MARKER_CATEGORY_VALUES` and labels with `alchemyStation`, `cookingStation`, `smithingStation`, `furnace`, and `tailoringStation`. Keep `craftingStation` as fallback. Add five entries to `MARKER_IDS` and `markerRegistry`, with distinct glyphs and the existing objects section, shared layer, and opt-in visibility. The icon atlas, results, and sidebar already consume this registry. Place-page service counts must also use published placement categories, not raw source roles or families; carry category tuples into document projection without exposing them in placement references. A skill-based dynamic category scheme was rejected: one station can list several skills, while its typed station identity identifies the service.
4. Reuse the existing category query parameter. New category IDs are serialized by `atlas-state.ts`; no new URL field or old-ID alias is needed. Search text uses each published category label. The sidebar hides categories with zero published placements unless selected; new categories stay opt-in so an unplaced type does not create an empty filter.

## Risks / Trade-offs

- [A future build changes station IDs] → Resolve only against a verified canonical entity in the same build; review the supported mapping when the build changes. An unrecognized record uses the generic marker.
- [Multiple source details disagree on one station placement] → Keep the generic marker rather than silently picking a type; retain all source evidence.
- [Distinct colors without distinct glyphs fail non-color recognition] → Choose unique glyphs and retain text labels in filters, results, and details.
- [Published artifacts precede the new category contract] → Regenerate static publication resources together with the site deployment. Do not mix old and new artifact sets.

## Migration Plan

Update the category contract, map publication and site registry in one cutover. Regenerate the local publication, verify the five station filters and generic fallback in the browser, then deploy the site and its matching static publication together. Roll back both as one versioned publication if the result is wrong. Existing persistent URLs with `craftingStation` still select the generic fallback category; named stations move to their new IDs by design.
