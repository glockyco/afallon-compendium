import { expect, test } from "bun:test";
import type { PublicTileLayer } from "@afallon/contracts/public";
import { assertNonRegressivePublication, type PublicationSummary } from "./publication-parity";

function summary(overrides: Partial<PublicationSummary> = {}): PublicationSummary {
  return {
    mapIds: new Set(["world", "dungeon"]),
    offsets: new Map([["world", { worldX: 0, worldY: 0 }], ["dungeon", { worldX: 100, worldY: 200 }]]),
    placementsByMap: new Map([["world", 20], ["dungeon", 5]]),
    placementsByCategory: new Map([["enemy", 10], ["container", 8]]),
    tileLayers: new Map([
      ["world:game-map:world", { id: "world", mapSpaceId: "world", label: "World", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 10, 10], tiles: [] } satisfies PublicTileLayer],
      ["dungeon:game-map:dungeon", { id: "dungeon", mapSpaceId: "dungeon", label: "Dungeon", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 5, 5], tiles: [] } satisfies PublicTileLayer],
    ]),
    entityKeys: new Set(["npcs:1"]),
    itemKeys: new Set(["items:1"]),
    regionKeys: new Set(["region-1"]),
    placementIds: new Set(["placement-1", "placement-2"]),
    pageEntries: new Set(["items/item=items:1"]),
    documentKeys: new Set(["items:1"]),
    listKinds: new Set(["items:0"]),
    artworkAssets: new Set([`art/${"a".repeat(64)}.webp`]),
    placementCount: 25,
    ...overrides,
  };
}

test("accepts additive publication coverage", () => {
  assertNonRegressivePublication(summary({ placementCount: 26, placementsByMap: new Map([["world", 21], ["dungeon", 5]]) }), summary());
});

test("rejects lost placements even when the publication remains structurally valid", () => {
  expect(() => assertNonRegressivePublication(summary({ placementCount: 24, placementsByMap: new Map([["world", 19], ["dungeon", 5]]) }), summary())).toThrow("placement coverage");
  expect(() => assertNonRegressivePublication(summary({ placementIds: new Set(["placement-1", "replacement"]) }), summary())).toThrow("deployed placements");
});

test("rejects map layout and imagery registration changes", () => {
  expect(() => assertNonRegressivePublication(summary({ offsets: new Map([["world", { worldX: 0, worldY: 0 }], ["dungeon", { worldX: 101, worldY: 200 }]]) }), summary())).toThrow("world offset");
  expect(() => assertNonRegressivePublication(summary({ tileLayers: new Map([["world:game-map:world", { id: "world", mapSpaceId: "world", label: "World", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 11, 10], tiles: [] } satisfies PublicTileLayer]]) }), summary())).toThrow("imagery extent");
  const baseline = summary();
  const world = baseline.tileLayers.get("world:game-map:world")!;
  baseline.tileLayers.set("world:game-map:world", { ...world, tiles: [{ z: 0, x: 0, y: 0, url: "assets/tile.webp", sha256: "a".repeat(64), bytes: 1, width: 256, height: 256, state: "captured" }] });
  expect(() => assertNonRegressivePublication(summary(), baseline)).toThrow("imagery tiles");
});

test("rejects missing search and region records", () => {
  expect(() => assertNonRegressivePublication(summary({ entityKeys: new Set() }), summary())).toThrow("searchable entities");
  expect(() => assertNonRegressivePublication(summary({ itemKeys: new Set() }), summary())).toThrow("searchable items");
  expect(() => assertNonRegressivePublication(summary({ regionKeys: new Set() }), summary())).toThrow("map regions");
});

test("rejects a removed page and document", () => {
  expect(() => assertNonRegressivePublication(summary({ pageEntries: new Set() }), summary())).toThrow("published pages");
  expect(() => assertNonRegressivePublication(summary({ documentKeys: new Set() }), summary())).toThrow("published documents");
});

test("rejects a removed artwork asset", () => {
  expect(() => assertNonRegressivePublication(summary({ artworkAssets: new Set() }), summary())).toThrow("published artwork");
});
