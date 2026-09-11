import { expect, test } from "bun:test";
import sharp from "sharp";
import { validatePublication } from "./publication-validation";
import type { PublicationData } from "./public-contracts";

const frame = { origin: { x: 0, y: 0 }, xAxis: { x: 1, y: 0 }, yAxis: { x: 0, y: 1 } };

async function image(pixel: [number, number, number, number]): Promise<Uint8Array> {
  return sharp(Buffer.from(pixel), { raw: { width: 1, height: 1, channels: 4 } }).png().toBuffer();
}

function publication(): PublicationData {
  return {
    schemaVersion: "compendium.publication.v7", buildId: "build", mode: "release",
    coverage: { complete: true, excludedPlacements: 0, messages: [] },
    world: { mapSpaceId: "world", label: "World", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, offsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, source: "reviewed", status: "placed" }], unplacedMapSpaceIds: [] },
    maps: [{ mapSpaceId: "world", label: "World", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } } }],
    placements: [
      { placementId: "stacked-lower", mapSpaceId: "world", position: [0.5, 0.5], height: 17.25, label: "Enemy", categories: ["enemy"], entityKeys: [], areas: [], sections: [] },
      { placementId: "stacked-upper", mapSpaceId: "world", position: [0.5, 0.5], height: 83.5, label: "Enemy", categories: ["enemy"], entityKeys: [], areas: [], sections: [] },
    ],
    entities: [], itemSources: [],
    tileLayers: [{ id: "world", mapSpaceId: "world", tileSize: 1, finestLevel: 0, width: 1, height: 1, mapFromPixelEdge: frame, tiles: [{ z: 0, x: 0, y: 0, width: 1, height: 1, url: "imagery/pixel.png", sha256: "0".repeat(64), bytes: 0, mapFromPixelEdge: frame, state: "captured" }] }],
    illustrations: [], guide: { dungeons: [], bosses: [], regions: [], properties: [] },
  };
}

test("published placements retain height and reject blank finest pixels", async () => {
  const data = publication();
  const visible = await image([255, 255, 255, 255]);
  await expect(validatePublication(data, new Map([["imagery/pixel.png", visible]]))).resolves.toBe(data);
  expect(data.placements.map((placement) => placement.placementId)).toEqual(["stacked-lower", "stacked-upper"]);
  expect(data.placements.map((placement) => placement.height)).toEqual([17.25, 83.5]);

  const blank = await image([0, 0, 0, 0]);
  await expect(validatePublication(data, new Map([["imagery/pixel.png", blank]]))).rejects.toThrow("blank finest imagery");
});
