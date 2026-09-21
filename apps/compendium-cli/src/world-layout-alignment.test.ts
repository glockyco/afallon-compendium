import { expect, test } from "bun:test";
import type { WorldOffsets } from "@afallon/contracts";
import type { PublicationPresentation, StaticRootManifest } from "@afallon/contracts/public";
import { alignWorldLayout } from "./world-layout-alignment";

const manualCenters: Record<string, readonly [number, number]> = {
  topLeft: [-92, 77], top: [3, 72], topRight: [95, 84], right: [88, -4],
  bottomRight: [91, -79], bottom: [-2, -74], bottomLeft: [-96, -83], left: [-87, 2],
};

function fixture() {
  const mapSpaceIds = ["world", ...Object.keys(manualCenters)];
  const presentation: PublicationPresentation = {
    schemaVersion: "compendium.publication-presentation.v1",
    buildId: "build",
    catalogId: "c".repeat(64),
    worldOffsets: mapSpaceIds.map((mapSpaceId) => ({ mapSpaceId, worldX: 0, worldY: 0, source: mapSpaceId === "world" ? "native" : "reviewed", status: "placed" })),
    spatialBounds: mapSpaceIds.map((mapSpaceId) => ({ mapSpaceId, minX: -1, minY: -1, maxX: 1, maxY: 1 })),
    capturedMapSpaceIds: [],
  };
  const reviewed: WorldOffsets = {
    schemaVersion: "compendium.world-offsets.v1",
    buildId: "build",
    offsets: [
      { mapSpaceId: "world", worldX: 25, worldY: -10 },
      ...Object.entries(manualCenters).map(([mapSpaceId, [x, y]]) => ({ mapSpaceId, worldX: x + 25, worldY: y - 10 })),
    ],
  };
  const publication = {
    buildId: "build",
    catalogId: "c".repeat(64),
    world: { offsets: presentation.worldOffsets },
    maps: mapSpaceIds.map((mapSpaceId) => ({ mapSpaceId, label: mapSpaceId, bounds: { min: { x: -1, y: -1 }, max: { x: 1, y: 1 } } })),
  } as StaticRootManifest;
  return { presentation, reviewed, publication };
}

test("aligns inferred corners and evenly spaces each side", () => {
  const { presentation, reviewed, publication } = fixture();
  const aligned = alignWorldLayout(presentation, reviewed, publication, { halfWidth: 100, halfHeight: 80 });
  expect(aligned.corners).toEqual({ topLeft: "topLeft", topRight: "topRight", bottomRight: "bottomRight", bottomLeft: "bottomLeft" });
  expect(aligned.sides).toEqual({ top: ["top"], right: ["right"], bottom: ["bottom"], left: ["left"] });
  const offsets = new Map(aligned.presentation.worldOffsets.map((offset) => [offset.mapSpaceId, [offset.worldX, offset.worldY]]));
  expect(offsets).toEqual(new Map([
    ["world", [25, -10]],
    ["topLeft", [-75, 70]], ["top", [25, 70]], ["topRight", [125, 70]],
    ["right", [125, -10]],
    ["bottomRight", [125, -90]], ["bottom", [25, -90]], ["bottomLeft", [-75, -90]],
    ["left", [-75, -10]],
  ]));
});

test("rejects an export that omits a published map", () => {
  const input = fixture();
  input.reviewed.offsets.pop();
  expect(() => alignWorldLayout(input.presentation, input.reviewed, input.publication)).toThrow("reviewed export map spaces differ from the publication");
});
