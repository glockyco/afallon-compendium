import { expect, test } from "bun:test";
import { PUBLIC_MARKER_CATEGORY_VALUES } from "@afallon/contracts/public"
import { MARKER_SIZE_RANGE } from "../atlas-state";
import type { PublicPlacement } from "@afallon/contracts/public"
import { buildMarkers } from "./render-data";
import { createPlacementIconLayer } from "./layers/markers";
import { iconAtlasMapping } from "./icon-atlas";
import { DEFAULT_MARKER_IDS, MARKER_IDS, MARKER_LAYER_ID, markerFor, markerRegistry, resolveMarker } from "./marker-registry";

const NAMED_STATION_IDS = ["alchemyStation", "cookingStation", "smithingStation", "furnace", "tailoringStation"] as const;

test("registry keys match the published category contract", () => {
  expect([...MARKER_IDS].sort()).toEqual([...PUBLIC_MARKER_CATEGORY_VALUES].sort());
  expect(Object.keys(markerRegistry).sort()).toEqual([...PUBLIC_MARKER_CATEGORY_VALUES].sort());
});

test("place and service markers are default-visible while legacy markers stay opt-in", () => {
  expect(["town", "fort", "camp", "dungeonEntrance", "challengeStone", "property", "flightPoint", "auctioneer", "banker"].map((id) => markerFor(id as typeof MARKER_IDS[number]).defaultVisible)).toEqual([true, true, true, true, true, true, true, true, true]);
  expect(["enemy", "travelPoint"].map((id) => markerFor(id as typeof MARKER_IDS[number]).defaultVisible)).toEqual([false, true]);
  expect(DEFAULT_MARKER_IDS.filter((id) => NAMED_STATION_IDS.some((station) => station === id))).toEqual(["alchemyStation", "smithingStation", "furnace", "tailoringStation"]);
  expect(DEFAULT_MARKER_IDS).not.toContain("craftingStation");
});

test("bankers appear above auctioneers in controls and map markers", () => {
  expect(MARKER_IDS.indexOf("banker")).toBeLessThan(MARKER_IDS.indexOf("auctioneer"));
  expect(resolveMarker({ categories: ["auctioneer", "banker"] })).toBe("banker");
  expect(markerFor("banker").renderOrder).toBeGreaterThan(markerFor("auctioneer").renderOrder);
});

test("named stations are object markers and outrank generic and merchant roles", () => {
  for (const id of NAMED_STATION_IDS) {
    const marker = markerFor(id);
    expect(marker.section).toBe("objects");
    expect(marker.precedence).toBeGreaterThan(markerFor("craftingStation").precedence);
    expect(marker.precedence).toBeGreaterThan(markerFor("merchant").precedence);
    expect(resolveMarker({ categories: ["merchant", id] })).toBe(id);
  }
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
    movement: [],
  }));
  const atlas = { atlas: {} as HTMLCanvasElement, mapping: iconAtlasMapping() };
  const records = buildMarkers(placements);
  const layer = createPlacementIconLayer(records, atlas, MARKER_SIZE_RANGE.default);
  const renderedIds = (layer.props.data as readonly { markerId: string }[]).map((marker) => marker.markerId);
  expect(renderedIds.sort()).toEqual([...MARKER_IDS].sort());
  expect(Object.keys(layer.props.iconMapping ?? {}).sort()).toEqual([...MARKER_IDS].sort());
  expect(layer.id).toBe(MARKER_LAYER_ID);
});

test("overlapping categories resolve to one marker", () => {
  const marker = resolveMarker({ categories: ["merchant", "questGiver"] });
  expect(marker).toBe("questGiver");
});

test("an overlapping placement resolves from its enabled categories", () => {
  const placement: PublicPlacement = {
    placementId: "dungeon-door",
    mapSpaceId: "fixture-map",
    position: [0, 0],
    height: 0,
    label: "Dungeon Door",
    categories: ["dungeonEntrance", "travelPoint"],
    entityKeys: [],
    itemKeys: [],
    searchText: "Dungeon Door",
    areas: [],
    movement: [],
  };

  expect(buildMarkers([placement], null, {}, new Set(["dungeonEntrance"]))[0]?.markerId).toBe("dungeonEntrance");
  expect(buildMarkers([placement], null, {}, new Set(["travelPoint"]))[0]?.markerId).toBe("travelPoint");
});
