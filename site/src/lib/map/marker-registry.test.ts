import { expect, test } from "bun:test";
import { PUBLIC_MARKER_CATEGORY_VALUES } from "../../../../pipeline/public-contracts";
import type { PublicPlacement } from "../../../../pipeline/public-contracts";
import { createPlacementIconLayer, markerRecordsForPlacements } from "../map-adapter";
import { iconAtlasMapping } from "./icon-atlas";
import { MARKER_IDS, MARKER_LAYER_ID, markerFor, markerRegistry, resolveMarker } from "./marker-registry";

test("registry keys match the published category contract", () => {
  expect([...MARKER_IDS]).toEqual([...PUBLIC_MARKER_CATEGORY_VALUES]);
  expect(Object.keys(markerRegistry).sort()).toEqual([...PUBLIC_MARKER_CATEGORY_VALUES].sort());
});

test("place markers are default-visible while legacy markers stay opt-in", () => {
  expect(["town", "fort", "camp", "dungeonEntrance", "challengeStone", "property"].map((id) => markerFor(id as typeof MARKER_IDS[number]).defaultVisible)).toEqual([true, true, true, true, true, true]);
  expect(["enemy", "travelPoint"].map((id) => markerFor(id as typeof MARKER_IDS[number]).defaultVisible)).toEqual([false, true]);
});

test("no two markers share a glyph", () => {
  const markers = Object.values(markerRegistry);
  const glyphs = markers.map((marker) => JSON.stringify(marker.icon));
  expect(new Set(glyphs).size).toBe(markers.length);
});

test("every registered marker reaches the rendered icon layer and atlas", () => {
  const placements: PublicPlacement[] = MARKER_IDS.map((category, index) => ({
    placementId: `placement-${category}`,
    mapSpaceId: "fixture-map",
    position: [index, index],
    height: 0,
    label: markerRegistry[category].label,
    categories: [category],
    entityKeys: [],
    itemKeys: [],
    searchText: markerRegistry[category].label,
    areas: [],
  }));
  const atlas = { atlas: {} as HTMLCanvasElement, mapping: iconAtlasMapping() };
  const records = markerRecordsForPlacements(placements);
  const layer = createPlacementIconLayer(records, atlas);
  const renderedIds = (layer.props.data as readonly { markerId: string }[]).map((marker) => marker.markerId);
  expect(renderedIds.sort()).toEqual([...MARKER_IDS].sort());
  expect(Object.keys(layer.props.iconMapping ?? {}).sort()).toEqual([...MARKER_IDS].sort());
  expect(layer.id).toBe(MARKER_LAYER_ID);
});

test("overlapping categories resolve to one marker", () => {
  const marker = resolveMarker({ categories: ["merchant", "questGiver"] });
  expect(marker).toBe("questGiver");
});
