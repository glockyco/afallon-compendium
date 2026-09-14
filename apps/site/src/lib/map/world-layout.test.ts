import { expect, test } from "bun:test";
import type { PublicationData } from "../../../../../pipeline/public-contracts";
import { exportWorldOffsets, WorldDragController } from "./world-layout";

const publication = {
  buildId: "build",
  world: {
    offsets: [
      { mapSpaceId: "coalway", worldX: 0, worldY: 0, source: "native", status: "placed" },
      { mapSpaceId: "duskfall", worldX: 9000, worldY: 0, source: "reviewed", status: "placed" },
    ],
  },
} as PublicationData;

test("offset export preserves build identity and uses reviewed overrides", () => {
  expect(exportWorldOffsets(publication, { duskfall: { worldX: 9200, worldY: -40 } })).toEqual({
    schemaVersion: "compendium.world-offsets.v1",
    buildId: "build",
    offsets: [
      { mapSpaceId: "coalway", worldX: 0, worldY: 0 },
      { mapSpaceId: "duskfall", worldX: 9200, worldY: -40 },
    ],
  });
});

test("world dragging applies pointer delta to the effective offset", () => {
  const updates: Array<{ mapSpaceId: string; worldX: number; worldY: number }> = [];
  const controller = new WorldDragController((mapSpaceId, offset) => updates.push({ mapSpaceId, ...offset }), () => undefined);
  const offsets = new Map([["duskfall", { worldX: 9000, worldY: 0 }]]);
  expect(controller.tryStart({ layerId: "world-map-bounds", mapSpaceId: "duskfall", coordinate: [100, 200] }, true, offsets)).toBe(true);
  expect(controller.move([140, 175])).toBe(true);
  expect(updates).toEqual([{ mapSpaceId: "duskfall", worldX: 9040, worldY: -25 }]);
  controller.end();
  expect(controller.draggingMapSpaceId).toBeNull();
});
