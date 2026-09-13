import { expect, test } from "bun:test";
import { validatePublication } from "./publication-validation";
import type { PublicationData } from "./public-contracts";

function publication(): PublicationData {
  return {
    schemaVersion: "compendium.publication.v13", buildId: "build", mode: "release",
    coverage: { complete: true, excludedPlacements: 0, messages: [] },
    world: { mapSpaceId: "world", label: "World", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, offsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, source: "reviewed", status: "placed" }], unplacedMapSpaceIds: [] },
    maps: [{ mapSpaceId: "world", label: "World", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } } }],
    placements: [
      { placementId: "stacked-lower", mapSpaceId: "world", position: [0.5, 0.5], height: 17.25, label: "Enemy", categories: ["enemy"], entityKeys: [], itemKeys: [], searchText: "Enemy", areas: [], movement: [] },
      { placementId: "stacked-upper", mapSpaceId: "world", position: [0.5, 0.5], height: 83.5, label: "Enemy", categories: ["enemy"], entityKeys: [], itemKeys: [], searchText: "Enemy", areas: [], movement: [] },
    ],
    regions: [],
    entityIndex: [], itemIndex: [],
    tileLayers: [{ id: "world", mapSpaceId: "world", label: "Captured screenshots", kind: "captured", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 256, 256], tiles: [{ z: 0, x: 0, y: 0, width: 256, height: 256, url: "imagery/pixel.png", sha256: "0".repeat(64), bytes: 0, state: "captured" }] }],
  };
}

test("published placements retain height and coincident identities", () => {
  const data = publication();
  validatePublication(data);
  expect(data.placements.map((placement) => placement.placementId)).toEqual(["stacked-lower", "stacked-upper"]);
  expect(data.placements.map((placement) => placement.height)).toEqual([17.25, 83.5]);
});
