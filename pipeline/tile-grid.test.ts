import { expect, test } from "bun:test";
import { makeTileGrid } from "./tile-grid";
import type { LoadedTileInputs } from "./tile-input";

function inputs(edge: number): LoadedTileInputs {
  const width = 1024;
  const height = 1024;
  const tile = {
    id: "surface-0", sceneNativeId: 1, scenePath: "Assets/World.unity", mapSpaceId: "world", width, height,
    rasterValue: {
      tileId: "surface-0", imageSha256: "0".repeat(64), width, height, coordinateSystem: "source-scene-world-xz", pixelConvention: "top-left-edges",
      cameraFrame: { center: { x: -1024 + edge / 2, z: -3072 - edge / 2 }, worldSize: { x: edge, z: edge }, cameraY: 1, nearClip: 0.1, farClip: 100 },
      clipping: { source: "none", applied: false, clipHeight: null }, verticalBounds: { minY: -99, maxY: 99 }, maximumProjectionErrorPixels: 0,
      worldFromPixelEdge: { origin: { x: -1024, z: -3072 }, xAxis: { x: edge / width, z: 0 }, yAxis: { x: 0, z: -edge / height } },
    },
  };
  return {
    plan: { schemaVersion: "compendium.tile-plan.v2", buildId: "build", mapSpaceId: "world", profile: { path: "profile.json", sha256: "0".repeat(64) }, sources: [] },
    planPath: "plan.json", planSha256: "0".repeat(64), profilePath: "profile.json", profileRef: { path: "profile.json", sha256: "0".repeat(64) },
    profile: { schemaVersion: "compendium.map-space-profile.v2", buildId: "build", mapSpaces: [{ id: "world", label: "World" }], bindings: [{ id: "world", mapSpaceId: "world", sceneNativeId: 1, scenePath: "Assets/World.unity", frame: { origin: { x: 0, z: 0 }, xAxis: { x: 1, z: 0 }, yAxis: { x: 0, z: 1 } }, domain: { kind: "scene" }, evidence: [{ path: "evidence", sha256: "0".repeat(64), pointer: "" }] }] },
    sources: [{ sourcePath: "capture", sourceSha256: "0".repeat(64), runId: "run", captureSetPath: "capture-set.json", captureSetSha256: "0".repeat(64), captureSet: {} as never, tiles: [tile as never], planPath: "capture-plan.json" }], provenance: [],
  };
}

test("global lattice uses floor division for negative tile indices", () => {
  const tileSize = 256;
  const finestZoom = 1;
  const worldTile = tileSize / 2 ** finestZoom;
  const xIndices = [-1024, -896, -768, -640].map((origin) => Math.floor(origin / worldTile));
  const yIndices = [-3584, -3456, -3328, -3200].map((origin) => Math.floor(origin / worldTile));
  expect(xIndices).toEqual([-8, -7, -6, -5]);
  expect(yIndices).toEqual([-28, -27, -26, -25]);
  expect(Math.floor(-5 / 2)).toBe(-3);
});

test("makeTileGrid registers a 512-unit capture on the global lattice", () => {
  const grid = makeTileGrid(inputs(512));
  expect(grid.pixelSize).toEqual({ x: 0.5, y: 0.5 });
  expect([Math.floor(grid.minX / 256), Math.floor((grid.maxX - 1) / 256)]).toEqual([-8, -5]);
  expect([Math.floor(grid.minY / 256), Math.floor((grid.maxY - 1) / 256)]).toEqual([-28, -25]);
});

test("makeTileGrid maps reflected world pixels back into the source raster", () => {
  const source = makeTileGrid(inputs(512)).sources[0]!;
  const worldOffset = { x: 100, y: -200 };
  expect({
    x: source.inverseMatrix.a * worldOffset.x + source.inverseMatrix.b * worldOffset.y,
    y: source.inverseMatrix.c * worldOffset.x + source.inverseMatrix.d * worldOffset.y,
  }).toEqual({ x: 100, y: 200 });
});

test("makeTileGrid rejects a non-power-of-two capture edge", () => {
  expect(() => makeTileGrid(inputs(300))).toThrow("edge must be a square power of two");
});
