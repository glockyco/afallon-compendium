import { expect, test } from "bun:test";
import type { NormalizedPlacement, NormalizedRegion } from "@afallon/contracts/catalog";
import { collectPlacementAreas } from "./areas";

const box = (half: number) => ({ kind: "box" as const, corners: [[-half, -half], [half, -half], [half, half], [-half, half]] as [[number, number], [number, number], [number, number], [number, number]] });

test("uses the smallest named area in the same map space", () => {
  const region = (regionId: string, name: string, half: number, mapSpaceId = "surface") => ({ regionId, name, mapSpaceId, mapGeometry: box(half) }) as NormalizedRegion;
  const placement = (placementId: string, x: number, y: number, mapSpaceId = "surface") => ({ placementId, mapPosition: { x, y }, mapSpaceId }) as NormalizedPlacement;
  const rows = collectPlacementAreas(
    [placement("inner", 0, 0), placement("outer", 6, 0), placement("outside", 20, 0), placement("other-space", 0, 0, "dungeon")],
    [region("large", "  Woods  ", 10), region("small", "Camp", 2), region("wrong-space", "Dungeon", 1, "interior")],
  );
  expect(rows).toEqual([{ placementId: "inner", regionId: "small", areaName: "Camp" }, { placementId: "outer", regionId: "large", areaName: "Woods" }]);
});

test("ranks regions by their true area, not by their bounding box", () => {
  // Diamond: area 72, bounding box 144. Square: area 100, bounding box 100. Circle: area 75.4, bounding box 96.
  const diamond = { regionId: "diamond", name: "Diamond", mapSpaceId: "surface", mapGeometry: { kind: "box", corners: [[0, -6], [6, 0], [0, 6], [-6, 0]] } } as NormalizedRegion;
  const square = { regionId: "square", name: "Square", mapSpaceId: "surface", mapGeometry: box(5) } as NormalizedRegion;
  const circle = { regionId: "circle", name: "Circle", mapSpaceId: "surface", mapGeometry: { kind: "sphere", center: [0, 0], radius: 4.9 } } as NormalizedRegion;
  const placement = (placementId: string, x: number, y: number) => ({ placementId, mapPosition: { x, y }, mapSpaceId: "surface" }) as NormalizedPlacement;
  expect(collectPlacementAreas([placement("all", 0, 0), placement("outside-diamond", 3.5, 3.3)], [square, circle, diamond])).toEqual([
    { placementId: "all", regionId: "diamond", areaName: "Diamond" },
    { placementId: "outside-diamond", regionId: "circle", areaName: "Circle" },
  ]);
});
