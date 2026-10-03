import { expect, test } from "bun:test";
import { PUBLIC_MARKER_CATEGORY_VALUES } from "@afallon/contracts/public"
import type { PublicPlacement, PublicationData } from "@afallon/contracts/public"
import { buildMarkers, coincidentPlacements, groupCoincidentMarkers, orderFocusedMarkers } from "./render-data";
import { createPlacementIconLayer } from "./layers/markers";
import { iconSheetMapping } from "./icon-sheet";
import { DEFAULT_MARKER_IDS, MARKER_IDS, MARKER_LAYER_ID, MARKER_SIZE_RANGE, markerFor, markerRegistry, resolveMarker } from "./marker-registry";

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

test("station stacks draw alchemy, tailoring, smithing, furnace, then cooking", () => {
  const stationOrder = ["cookingStation", "furnace", "smithingStation", "tailoringStation", "alchemyStation"] as const;
  expect(stationOrder.map((id) => markerFor(id).precedence)).toEqual([650, 651, 652, 653, 654]);
  expect(stationOrder.map((id) => markerFor(id).renderOrder)).toEqual([650, 651, 652, 653, 654]);
  const placements: PublicPlacement[] = stationOrder.map((category, index) => ({
    placementId: category,
    mapSpaceId: "fixture-map",
    position: [index, 0],
    height: 0,
    label: category,
    categories: [category],
    entityKeys: [],
    itemKeys: [],
    searchText: category,
    areas: [],
    movement: [],
  }));

  expect(buildMarkers(placements).map((marker) => marker.markerId)).toEqual([...stationOrder]);
  const overlapping = buildMarkers([placements[0]!, placements[2]!, { ...placements[4]!, position: [0, 0] }]);
  expect(groupCoincidentMarkers(overlapping).map((marker) => marker.markerId)).toEqual(["alchemyStation", "smithingStation"]);
  expect(groupCoincidentMarkers(buildMarkers(placements.map((placement) => ({ ...placement, position: [0, 0] }))))[0]?.markerId).toBe("alchemyStation");
});

test("selected and hovered icons draw over other icons while exact stacks keep every identity", () => {
  const placements = [
    { placementId: "console", mapSpaceId: "surface", position: [0, 0], categories: ["heroicConsole"], label: "Heroic Console" },
    { placementId: "station", mapSpaceId: "surface", position: [3, 0], categories: ["tailoringStation"], label: "Tailoring Station" },
    { placementId: "chest-a", mapSpaceId: "surface", position: [8, 0], categories: ["container"], label: "Chest" },
    { placementId: "chest-b", mapSpaceId: "surface", position: [8, 0], categories: ["container"], label: "Chest" },
  ] as PublicPlacement[];
  const markers = groupCoincidentMarkers(buildMarkers(placements));
  const front = orderFocusedMarkers(markers, "console", ["chest-b"]);
  expect(front.at(-1)?.members).toEqual(["console"]);
  expect(front.at(-2)?.members).toContain("chest-b");
  expect(markers.find((marker) => marker.members.length === 2)?.members).toEqual(["chest-a", "chest-b"]);
  const data = { buildId: "build", world: { offsets: [{ mapSpaceId: "surface", worldX: 0, worldY: 0, source: "native", status: "placed" }] } } as PublicationData;
  expect(coincidentPlacements(placements, placements[2]!, data, {}).map((placement) => placement.placementId)).toEqual(["chest-a", "chest-b"]);
  expect(coincidentPlacements(placements, placements[0]!, data, {})).toEqual([]);
});

test("no two markers share a glyph", () => {
  const markers = Object.values(markerRegistry);
  const glyphs = markers.map((marker) => JSON.stringify(marker.icon));
  expect(new Set(glyphs).size).toBe(markers.length);
});

test("every registered marker reaches the rendered icon layer and checked-in sheet", async () => {
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
  const iconSheet = { canvas: {} as HTMLCanvasElement, mapping: iconSheetMapping() };
  const records = buildMarkers(placements);
  const layer = createPlacementIconLayer(records, iconSheet, MARKER_SIZE_RANGE.default);
  const renderedIds = (layer.props.data as readonly { markerId: string }[]).map((marker) => marker.markerId);
  expect(renderedIds.sort()).toEqual([...MARKER_IDS].sort());
  expect(Object.keys(layer.props.iconMapping ?? {}).sort()).toEqual([...MARKER_IDS].sort());
  const pixels = new DataView(await Bun.file(new URL("../../../static/map-marker-icons.png", import.meta.url)).arrayBuffer());
  expect(pixels.getUint32(16)).toBe(MARKER_IDS.length * 64);
  expect(pixels.getUint32(20)).toBe(64);
  expect(MARKER_IDS.map((id) => iconSheet.mapping[id]?.x)).toEqual(MARKER_IDS.map((_, index) => index * 64));
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

  const related = { ...placement, placementId: "related" };
  const hidden = { ...placement, placementId: "hidden" };
  const focused = buildMarkers([placement, related, hidden], null, {}, new Set(["boss"]), new Set(["dungeon-door", "related"]));
  expect(focused.map((marker) => [marker.placementId, marker.markerId])).toEqual([
    ["dungeon-door", "dungeonEntrance"], ["related", "dungeonEntrance"],
  ]);
});
