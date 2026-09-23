import { expect, test } from "bun:test";
import type { PublicationData, PublicRegion } from "@afallon/contracts/public";
import { buildRegions, type MarkerRecord } from "../render-data";
import { createConnectionLayers, type TravelConnection } from "./connections";
import { orderImageryLayers } from "./imagery";
import { createHighlightLayers, createPlacementIconLayer, createStackCountLayer, markerColor } from "./markers";
import { createMovementLayers, type MovementGeometry } from "./movement";
import { createRegionLayers, polygonCentroid, type RegionRecord } from "./regions";

function property<T>(layer: { props: unknown }, name: string): T {
  return (layer.props as Record<string, unknown>)[name] as T;
}

test("region layers preserve coordinates and label centroids", () => {
  const region: RegionRecord = { id: "region", mapSpaceId: "map", name: "Town", shape: "box", polygon: [[0, 0], [4, 0], [4, 2], [0, 2]] };
  const layers = createRegionLayers([region]);
  expect(layers.map(layer => layer.id)).toEqual(["world-region-outline-halo", "world-region-outlines", "world-region-labels"]);
  expect(polygonCentroid(region.polygon)).toEqual([2, 1]);
  expect(property<(value: RegionRecord) => unknown>(layers[0]!, "getPolygon")(region)).toEqual(region.polygon);
});

test("region rendering clips polygons to their map crop", () => {
  const data = {
    world: { offsets: [{ mapSpaceId: "map", worldX: 0, worldY: 0 }] },
    maps: [{ mapSpaceId: "map", bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } } }],
  } as PublicationData;
  const regions = [
    { id: "cropped", mapSpaceId: "map", name: "Cropped", shape: "box", polygon: [[-5, -5], [15, -5], [15, 15], [-5, 15]] },
    { id: "outside", mapSpaceId: "map", name: "Outside", shape: "box", polygon: [[20, 20], [30, 20], [30, 30], [20, 30]] },
  ] as PublicRegion[];
  const rendered = buildRegions(regions, data, {});
  expect(rendered).toHaveLength(1);
  expect(rendered[0]!.polygon).toEqual([[0, 10], [0, 0], [10, 0], [10, 10]]);
  expect(buildRegions(regions, data, { map: { worldX: 100, worldY: 200 } })[0]!.polygon).toEqual([[100, 210], [100, 200], [110, 200], [110, 210]]);
});

test("connection layers preserve picking identity and selected style", () => {
  const connection: TravelConnection = { placementId: "door", source: [1, 2], target: [3, 4], enabled: true };
  const [line, destination] = createConnectionLayers([connection], "door", new Set());
  expect(property<(value: TravelConnection) => unknown>(line!, "getSourcePosition")(connection)).toEqual([1, 2]);
  expect(property<(value: TravelConnection) => unknown>(line!, "getTargetPosition")(connection)).toEqual([3, 4]);
  expect(property<(value: TravelConnection) => unknown>(line!, "getColor")(connection)).toEqual([250, 204, 21, 255]);
  expect(destination!.id).toBe("world-travel-destinations");
});

test("movement layer visibility and styles follow supplied state", () => {
  const geometry: MovementGeometry = { paths: [{ movementId: "move", placementId: "npc", kind: "patrol", points: [[1, 2], [3, 4]] }], radii: [] };
  expect(createMovementLayers("movement", { paths: [], radii: [] }, new Set(), new Set(), true, () => undefined)).toEqual([]);
  const [path] = createMovementLayers("movement", geometry, new Set(["npc"]), new Set(), true, () => undefined);
  expect(property<(value: MovementGeometry["paths"][number]) => unknown>(path!, "getPath")(geometry.paths[0]!)).toEqual([[1, 2], [3, 4]]);
  expect(property<(value: MovementGeometry["paths"][number]) => unknown>(path!, "getColor")(geometry.paths[0]!)).toEqual([250, 204, 21, 255]);
});

test("imagery ordering keeps game maps below captures", () => {
  const layer = (id: string, kind: "game-map" | "captured") => ({ tileLayer: { id, kind } as never, offset: { worldX: 0, worldY: 0 } });
  expect(orderImageryLayers([layer("capture", "captured"), layer("game", "game-map")]).map(value => value.tileLayer.id)).toEqual(["game", "capture"]);
});

test("marker size scales icons, highlights, and stack offsets from the 100 percent appearance", () => {
  const marker: MarkerRecord = {
    placementId: "travel",
    mapSpaceId: "map",
    position: [1, 2, 0],
    label: "Travel",
    categories: ["travelPoint"],
    markerId: "travelPoint",
    members: ["travel", "travel-2"],
    enabled: true,
    isTravel: true,
  };
  const atlas = { atlas: {} as HTMLCanvasElement, mapping: {} };
  const iconSizes = (markerSize: number) => {
    const layer = createPlacementIconLayer([marker], atlas, markerSize);
    return {
      base: property<(value: MarkerRecord) => number>(layer, "getSize")(marker),
      minimum: property<number>(layer, "sizeMinPixels"),
      maximum: property<number>(layer, "sizeMaxPixels"),
    };
  };
  expect(iconSizes(100)).toEqual({ base: 23, minimum: 14, maximum: 44 });
  expect(iconSizes(75)).toEqual({ base: 17.25, minimum: 10.5, maximum: 33 });
  expect(iconSizes(300)).toEqual({ base: 69, minimum: 42, maximum: 132 });

  const radius = (markerSize: number) => property<(value: MarkerRecord) => number>(
    createHighlightLayers("highlight", [marker], [255, 255, 255, 255], [255, 255, 255, 40], 2, markerSize)[0]!,
    "getRadius",
  )(marker);
  expect([radius(75), radius(100), radius(300)]).toEqual([10.125, 13.5, 40.5]);

  const stackOffset = (markerSize: number) => property<[number, number]>(createStackCountLayer([marker], markerSize)!, "getPixelOffset");
  expect([stackOffset(75), stackOffset(100), stackOffset(300)]).toEqual([[6.75, -6.75], [9, -9], [27, -27]]);
  expect(property<number>(createStackCountLayer([marker], 300)!, "getSize")).toBe(12);
});

test("marker styles preserve selection, hover, disabled, and category colors", () => {
  expect(markerColor("travelPoint", true, false)).toEqual([255, 196, 0, 255]);
  expect(markerColor("travelPoint", false, true)).toEqual([255, 255, 255, 255]);
  expect(markerColor("travelPoint", false, false, false)).toEqual([112, 112, 112, 220]);
  expect(markerColor("travelPoint", false, false)[3]).toBe(235);
});
