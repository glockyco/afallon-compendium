import { expect, test } from "bun:test";
import { buildWorldLayout, type LayoutMap, type WorldOffsets } from "./world-layout";

const maps: LayoutMap[] = [
  { mapSpaceId: "native", bounds: { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } } },
  { mapSpaceId: "reviewed", bounds: { min: { x: -20, y: 10 }, max: { x: 30, y: 70 } } },
  { mapSpaceId: "seeded", bounds: { min: { x: 0, y: 0 }, max: { x: 25, y: 40 } } },
];

const reviewed: WorldOffsets = {
  schemaVersion: "compendium.world-offsets.v1",
  buildId: "build",
  offsets: [{ mapSpaceId: "reviewed", worldX: 500, worldY: -25 }],
};

test("world layout preserves native and reviewed translations", () => {
  const layout = buildWorldLayout(maps, reviewed, new Set(["native"]));
  expect(layout.offsets).toEqual([
    { mapSpaceId: "native", worldX: 0, worldY: 0, source: "native", status: "placed" },
    { mapSpaceId: "reviewed", worldX: 500, worldY: -25, source: "reviewed", status: "placed" },
    expect.objectContaining({ mapSpaceId: "seeded", source: "seed", status: "unplaced" }),
  ]);
  expect(layout.unplacedMapSpaceIds).toEqual(["seeded"]);
});

test("world layout seeds missing maps deterministically without native coordinates", () => {
  const first = buildWorldLayout(maps, { ...reviewed, offsets: [] }, new Set(["native"]));
  const second = buildWorldLayout(maps, { ...reviewed, offsets: [] }, new Set(["native"]));
  expect(first.offsets).toEqual(second.offsets);
  expect(first.offsets.find((offset) => offset.mapSpaceId === "reviewed")).toEqual(expect.objectContaining({ worldX: 121, worldY: -10, source: "seed", status: "unplaced" }));
  expect(first.offsets.find((offset) => offset.mapSpaceId === "seeded")).toEqual(expect.objectContaining({ worldX: 152, worldY: 0, source: "seed", status: "unplaced" }));
});

test("world layout rejects unknown and nonzero native reviewed offsets", () => {
  expect(() => buildWorldLayout(maps, { ...reviewed, offsets: [{ mapSpaceId: "unknown", worldX: 1, worldY: 2 }] }, new Set(["native"]))).toThrow("unknown map space");
  expect(() => buildWorldLayout(maps, { ...reviewed, offsets: [{ mapSpaceId: "native", worldX: 1, worldY: 2 }] }, new Set(["native"]))).toThrow("Native map space");
});
