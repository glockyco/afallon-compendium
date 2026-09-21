import { expect, test } from "bun:test";
import type { PublicTileLayer } from "@afallon/contracts/public";
import { assertCorrectedPublicationParity, assertNonRegressivePublication, assertUpdatePublicationParity, type PublicationSummary } from "./publication-parity";

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
    placementLocations: new Map([
      ["placement-1", { mapSpaceId: "world", position: [2, 2] as const, categories: ["enemy"] }],
      ["placement-2", { mapSpaceId: "dungeon", position: [102, 202] as const, categories: ["container"] }],
    ]),
    boundsByMap: new Map([
      ["world", { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } }],
      ["dungeon", { min: { x: 100, y: 200 }, max: { x: 105, y: 205 } }],
    ]),
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

test("verified updates allow reconciled identities but retain map and placement floors", () => {
  assertUpdatePublicationParity(summary({ placementCount: 26, placementIds: new Set(["replacement"]) }), summary());
  expect(() => assertUpdatePublicationParity(summary({ mapIds: new Set(["world"]) }), summary())).toThrow("removes map spaces");
  expect(() => assertUpdatePublicationParity(summary({ placementCount: 24 }), summary())).toThrow("placement coverage");
});

test("same-build corrections only remove placements outside exact game-map bounds", () => {
  const baseline = summary();
  const dungeon = baseline.tileLayers.get("dungeon:game-map:dungeon")!;
  const corrected = summary({
    placementCount: 24,
    placementIds: new Set(["placement-1"]),
    placementLocations: new Map([["placement-1", { mapSpaceId: "world", position: [2, 2] as const, categories: ["enemy"] }]]),
    placementsByMap: new Map([["world", 20], ["dungeon", 4]]),
    tileLayers: new Map([...baseline.tileLayers, ["dungeon:game-map:dungeon", { ...dungeon, extent: [0, 0, 1, 1] }]]),
    boundsByMap: new Map([...baseline.boundsByMap, ["dungeon", { min: { x: 100, y: 200 }, max: { x: 101, y: 201 } }]]),
  });
  assertCorrectedPublicationParity(corrected, baseline);
  expect(() => assertCorrectedPublicationParity({ ...corrected, placementIds: new Set(), placementLocations: new Map() }, baseline)).toThrow("in-bounds placements");
  expect(() => assertCorrectedPublicationParity({ ...corrected, placementLocations: new Map([["placement-1", { mapSpaceId: "world", position: [12, 2] as const, categories: ["enemy"] }]]) }, baseline)).toThrow("out-of-bounds placements");
  const travelBaseline = summary({ placementIds: new Set(["travel"]), placementLocations: new Map([["travel", { mapSpaceId: "world", position: [2, 2] as const, categories: ["travelPoint"] }]]) });
  const folded = summary({ placementIds: new Set(["dungeon"]), placementLocations: new Map([["dungeon", { mapSpaceId: "world", position: [3, 2] as const, categories: ["dungeonEntrance", "travelPoint"] }]]) });
  assertCorrectedPublicationParity(folded, travelBaseline);
  expect(() => assertCorrectedPublicationParity({ ...folded, placementLocations: new Map([["dungeon", { mapSpaceId: "world", position: [3, 2] as const, categories: ["travelPoint"] }]]) }, travelBaseline)).toThrow("in-bounds placements");
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
