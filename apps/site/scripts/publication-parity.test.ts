import { expect, test } from "bun:test";
import type { PublicTileLayer } from "@afallon/contracts/public";
import { assertCorrectedPublicationParity, assertNonRegressivePublication, assertUpdatePublicationParity, summarizePublication, type PublicationSummary, type PublicationView } from "./publication-parity";

const regionKey = (id: string, polygon = [[0, 0], [1, 0], [1, 1]]) => JSON.stringify({ mapSpaceId: "world", id, shape: "box", polygon });
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
    regionKeys: new Set([regionKey("region-1")]),
    placementIds: new Set(["placement-1", "placement-2"]),
    placementLocations: new Map([
      ["placement-1", { mapSpaceId: "world", position: [2, 2] as const, categories: ["enemy"] }],
      ["placement-2", { mapSpaceId: "dungeon", position: [102, 202] as const, categories: ["container"] }],
    ]),
    boundsByMap: new Map([
      ["world", { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } }],
      ["dungeon", { min: { x: 100, y: 200 }, max: { x: 105, y: 205 } }],
    ]),
    listKinds: new Set(["items"]),
    pageKinds: new Set(["items"]),
    artworkAssets: new Set([`art/${"a".repeat(64)}.webp`]),
    artworkOwners: new Map([[`art/${"a".repeat(64)}.webp`, new Set(["items:1"])]]),
    excludedKeys: new Set(),
    placementCopies: new Map(),
    placementCount: 25,
    ...overrides,
  };
}

// A publication with one map at its reviewed offset, its game-map layer, and one placement, whose search lists each
// document.
function view(documents: ReadonlyArray<{ ref: { kind: string; key: string; icon?: { url: string } }; crafting?: unknown; teaches?: unknown; recipes?: unknown; effect?: unknown }>): PublicationView {
  const art = documents.flatMap((document) => document.ref.icon ? [document.ref.icon.url] : []);
  return {
    publication: {
      maps: [{ mapSpaceId: "world", parts: [{ path: "map" }], imagery: { path: "imagery" }, bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } } }],
      search: [{ path: "search" }],
      world: { offsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, status: "placed" }] },
    },
    resources: new Map<string, unknown>([
      ["map", { placements: [["placement-1", [1, 1], 0, "Fenric Doryn", ["merchant"]]], regions: [] }],
      ["imagery", { layers: [{ id: "world", mapSpaceId: "world", label: "World", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 10, 10], tiles: [] }] }],
      ["search", { entries: documents.map((document) => ({ ref: document.ref })) }],
      ...documents.map((document, index) => [`document-${index}`, { document }] as const),
    ]),
    references: new Map(art.map((path) => [path, { path, schemaId: "image/webp", sha256: "b".repeat(64), bytes: 1 }])),
  };
}

function withExclusions(publication: PublicationView, keys: readonly string[]): PublicationView {
  return {
    ...publication,
    publication: { ...publication.publication as object, exclusions: { path: "exclusions" } },
    resources: new Map([...publication.resources, ["exclusions", { exclusions: keys.map((key) => ({ key, reason: "test-record" })) }]]),
  };
}

test("counts records grouped into one page as published and names a lost record", () => {
  const fenric = (key: string) => ({ ref: { kind: "npcs", key } });
  const baseline = summarizePublication(view([fenric("npcs:206"), fenric("npcs:225")]));
  assertNonRegressivePublication(summarizePublication(view([{ ...fenric("npcs:206"), variants: [{ key: "npcs:206" }, { key: "npcs:225" }] }])), baseline);
  expect(() => assertNonRegressivePublication(summarizePublication(view([fenric("npcs:206")])), baseline)).toThrow("published entities: npcs:225");
});

test("parity preserves recipe keys in item crafts, teaches, and skill rows without recipe pages", () => {
  const baseline = summarizePublication(view([{ ref: { kind: "recipes", key: "recipes:1" } },
    { ref: { kind: "recipes", key: "recipes:2" } }, { ref: { kind: "recipes", key: "recipes:3" } }]));
  const candidate = summarizePublication(view([
    { ref: { kind: "items", key: "items:1" }, crafting: { recipe: { key: "recipes:1", name: "Regalia" } } },
    { ref: { kind: "items", key: "items:2" }, teaches: { recipe: { key: "recipes:2", name: "Tonic" } } },
    { ref: { kind: "skills", key: "skills:1" }, recipes: [{ recipe: { key: "recipes:3", name: "Demonic Bulwark Looted" }, anchor: "recipe-demonic-bulwark-looted" }] },
  ]));
  assertNonRegressivePublication(candidate, baseline);
  const missing = summarizePublication(view([
    { ref: { kind: "items", key: "items:1" }, crafting: { recipe: { key: "recipes:1", name: "Regalia" } } },
    { ref: { kind: "items", key: "items:2" }, teaches: { recipe: { key: "recipes:2", name: "Tonic" } } },
    { ref: { kind: "skills", key: "skills:1" }, recipes: [] },
  ]));
  expect(() => assertNonRegressivePublication(missing, baseline)).toThrow("published entities: recipes:3");
});

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
  const travelAtSameSpot = summary({ placementIds: new Set(["other-travel"]), placementLocations: new Map([["other-travel", { mapSpaceId: "world", position: [2, 2] as const, categories: ["travelPoint"] }]]) });
  assertCorrectedPublicationParity(travelAtSameSpot, travelBaseline);
});

test("same-build placement copies require a surviving equivalent host marker", () => {
  const original = summary({
    placementIds: new Set(["copy", "host"]),
    placementLocations: new Map([
      ["copy", { mapSpaceId: "world", position: [2, 2], categories: ["merchant"], entityKeys: ["npcs:1"], itemKeys: [] }],
      ["host", { mapSpaceId: "world", position: [2.01, 2], categories: ["merchant"], entityKeys: ["npcs:1"], itemKeys: [] }],
    ]),
  });
  const corrected = summary({
    placementIds: new Set(["host"]),
    placementLocations: new Map([["host", original.placementLocations.get("host")!]]),
    placementCopies: new Map([["copy", "host"]]),
  });
  assertCorrectedPublicationParity(corrected, original);
  expect(() => assertCorrectedPublicationParity({ ...corrected, placementCopies: new Map() }, original)).toThrow("in-bounds placements");
  expect(() => assertCorrectedPublicationParity({ ...corrected, placementLocations: new Map([["host", { ...original.placementLocations.get("host")!, entityKeys: ["npcs:2"] }]]) }, original)).toThrow("in-bounds placements");
  expect(() => assertCorrectedPublicationParity({ ...corrected, placementLocations: new Map([["host", { ...original.placementLocations.get("host")!, position: [2.1, 2] }]]) }, original)).toThrow("in-bounds placements");
});

test("same-build corrections may move reviewed maps and shift placements only within the tolerance", () => {
  const baseline = summary();
  const relocated = summary({
    offsets: new Map([["world", { worldX: 0, worldY: 0 }], ["dungeon", { worldX: 101, worldY: 201 }]]),
    placementLocations: new Map([
      ["placement-1", { mapSpaceId: "world", position: [2, 2] as const, categories: ["enemy"] }],
      ["placement-2", { mapSpaceId: "dungeon", position: [103, 203] as const, categories: ["container"] }],
    ]),
    boundsByMap: new Map([
      ["world", { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } }],
      ["dungeon", { min: { x: 101, y: 201 }, max: { x: 106, y: 206 } }],
    ]),
  });
  assertCorrectedPublicationParity(relocated, baseline);
  relocated.placementLocations.set("placement-2", { mapSpaceId: "dungeon", position: [104, 204], categories: ["container"] });
  assertCorrectedPublicationParity(relocated, baseline);
  relocated.placementLocations.set("placement-2", { mapSpaceId: "dungeon", position: [105.9, 205.9], categories: ["container"] });
  expect(() => assertCorrectedPublicationParity(relocated, baseline)).toThrow("local placement coordinates");
});

test("rejects map layout and imagery registration changes", () => {
  expect(() => assertNonRegressivePublication(summary({ offsets: new Map([["world", { worldX: 0, worldY: 0 }], ["dungeon", { worldX: 101, worldY: 200 }]]) }), summary())).toThrow("world offset");
  expect(() => assertNonRegressivePublication(summary({ tileLayers: new Map([["world:game-map:world", { id: "world", mapSpaceId: "world", label: "World", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 11, 10], tiles: [] } satisfies PublicTileLayer]]) }), summary())).toThrow("imagery extent");
  const baseline = summary();
  const world = baseline.tileLayers.get("world:game-map:world")!;
  baseline.tileLayers.set("world:game-map:world", { ...world, tiles: [{ z: 0, x: 0, y: 0, url: "assets/tile.webp", sha256: "a".repeat(64), bytes: 1, width: 256, height: 256, state: "captured" }] });
  expect(() => assertNonRegressivePublication(summary(), baseline)).toThrow("imagery tiles");
});

test("rejects missing entities and region records", () => {
  expect(() => assertNonRegressivePublication(summary({ entityKeys: new Set() }), summary())).toThrow("published entities: npcs:1");
  expect(() => assertNonRegressivePublication(summary({ itemKeys: new Set() }), summary())).toThrow("searchable items");
  expect(() => assertNonRegressivePublication(summary({ regionKeys: new Set() }), summary())).toThrow("map regions");
  // A region may change its ID when an equal region keeps its geometry, but not when the geometry changes.
  assertNonRegressivePublication(summary({ regionKeys: new Set([regionKey("region-0")]) }), summary());
  expect(() => assertNonRegressivePublication(summary({ regionKeys: new Set([regionKey("region-0", [[0, 0], [2, 0], [2, 2]])]) }), summary())).toThrow("map regions");
});

test("rejects a removed artwork asset", () => {
  expect(() => assertNonRegressivePublication(summary({ artworkAssets: new Set() }), summary())).toThrow("published artwork");
});

test("accepts only the removals that the exclusion list of the candidate names", () => {
  const icon = { url: `art/${"b".repeat(64)}.webp` };
  const devRing = { ref: { kind: "items", key: "items:417", icon } }, ironBar = { ref: { kind: "items", key: "items:1" } };
  const baseline = summarizePublication(view([devRing, ironBar]));
  assertNonRegressivePublication(summarizePublication(withExclusions(view([ironBar]), ["items:417"])), baseline);
  expect(() => assertNonRegressivePublication(summarizePublication(view([ironBar])), baseline)).toThrow("published entities: items:417");
  expect(() => assertNonRegressivePublication(summarizePublication(withExclusions(view([ironBar]), ["items:999"])), baseline)).toThrow("published entities: items:417");
  // Artwork that a published entity showed must stay, even when an excluded entity shared it.
  const sharedBaseline = summarizePublication(view([devRing, { ref: { kind: "items", key: "items:1", icon } }]));
  expect(() => assertNonRegressivePublication(summarizePublication(withExclusions(view([ironBar]), ["items:417"])), sharedBaseline)).toThrow("published artwork");
  // A same-build correction, which acceptance checks, applies the same rule.
  assertCorrectedPublicationParity(summarizePublication(withExclusions(view([ironBar]), ["items:417"])), baseline);
  expect(() => assertCorrectedPublicationParity(summarizePublication(view([ironBar])), baseline)).toThrow("published entities: items:417");
});

test("withholding a referenced effect removes only its artwork, not artwork owned by the surviving page", () => {
  const lost = { url: `art/${"c".repeat(64)}.webp` };
  const kept = { url: `art/${"d".repeat(64)}.webp` };
  const effect = { ref: { kind: "effects", key: "effects:4", icon: lost } };
  const item = { ref: { kind: "items", key: "items:1", icon: kept }, effect: { kind: "effects", key: "effects:4", icon: lost } };
  const baseline = summarizePublication(view([effect, item]));
  expect(baseline.artworkOwners.get(lost.url)).toEqual(new Set(["effects:4"]));
  const surviving = { ref: item.ref };
  const accepted = summarizePublication(withExclusions(view([surviving]), ["effects:4"]));
  assertCorrectedPublicationParity(accepted, baseline);
  const removedOwnArtwork = summarizePublication(withExclusions(view([{ ref: { kind: "items", key: "items:1" } }]), ["effects:4"]));
  expect(() => assertCorrectedPublicationParity(removedOwnArtwork, baseline)).toThrow("published artwork");
});
