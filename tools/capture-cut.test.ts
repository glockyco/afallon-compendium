import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { compositeCut, cutCaptureFrame, planTileCut, type NavigationSurvey } from "./capture-cut";
import type { CapturePlan } from "./capture-contracts";

const SURVEY_SHA = "a".repeat(64);

function plan(cut: boolean): CapturePlan {
  return {
    schemaVersion: "compendium.capture-plan.v6",
    sceneNativeId: 1, scenePath: "Assets/Test.unity", mapSpaceId: "test",
    width: 8, height: 8, cullingMask: -1,
    suppression: { shaderFamilies: [], terrainTrees: false },
    lighting: { ambient: { r: 1, g: 1, b: 1 }, directionalIntensity: 1, directionalEuler: { x: 0, y: 0, z: 0 } },
    readiness: { timeoutMs: 1000, stableFrames: 2, boundaryOverlap: 0, maximumSources: 1 },
    ...(cut ? { cut: { source: "navigation" as const, survey: { path: "nav.json", sha256: SURVEY_SHA }, step: 10, headroom: 2, cameraAbove: 100 } } : {}),
    tiles: [{ id: "tile", frame: { center: { x: 4, z: 4 }, worldSize: { x: 8, z: 8 }, cameraY: 400, nearClip: 0.1, farClip: 2000 } }],
  };
}

// One ramp across the tile: y = 0 at x = 0 rising to y = 40 at x = 8. The left half of the
// tile is walkable; the right half has no navmesh and takes its nearest neighbour's height.
const ramp: NavigationSurvey = {
  scene: { nativeId: 1 },
  vertices: [0, 0, 0, 4, 20, 0, 4, 20, 8, 0, 0, 8],
  indices: [0, 1, 2, 0, 2, 3],
};

test("a cut derives slices that cover the walkable range and a camera above the top slice", () => {
  const capturePlan = plan(true);
  const cut = planTileCut(capturePlan.tiles[0]!, capturePlan, ramp)!;
  // Pixel centres sample the ramp at x = 0.5 and x = 3.5, so the range is inside [0, 20].
  expect(cut.evidence.walkable.minY).toBeCloseTo(2.5, 5);
  expect(cut.evidence.walkable.maxY).toBeCloseTo(17.5, 5);
  expect(cut.evidence.walkable.coverage).toBeCloseTo(0.5, 1);
  expect(cut.evidence.cutHeights[0]!).toBeLessThanOrEqual(cut.evidence.walkable.minY + 2 + 10);
  expect(cut.evidence.cutHeights.at(-1)!).toBeGreaterThanOrEqual(cut.evidence.walkable.maxY + 2);
  const frame = cutCaptureFrame(capturePlan.tiles[0]!, cut);
  expect(frame.cameraY).toBe(cut.evidence.cutHeights.at(-1)! + 100);
  // The lower visibility bound of the declared frame is preserved.
  expect(frame.cameraY - frame.farClip).toBeCloseTo(400 - 2000, 6);
});

test("a tile without walkable surface has no cut and keeps its declared frame", () => {
  const capturePlan = plan(true);
  const empty: NavigationSurvey = { scene: { nativeId: 1 }, vertices: [100, 0, 100, 104, 0, 100, 104, 0, 104], indices: [0, 1, 2] };
  expect(planTileCut(capturePlan.tiles[0]!, capturePlan, empty)).toBeNull();
  expect(cutCaptureFrame(capturePlan.tiles[0]!, null)).toEqual(capturePlan.tiles[0]!.frame);
});

test("the composite takes each pixel from the first slice above its walkable height", async () => {
  const capturePlan = plan(true);
  const cut = planTileCut(capturePlan.tiles[0]!, capturePlan, ramp)!;
  const directory = await mkdtemp(join(tmpdir(), "cut-"));
  try {
    // Each slice is a solid colour whose red channel is its index.
    const paths = await Promise.all(cut.evidence.cutHeights.map(async (_, index) => {
      const path = join(directory, `slice-${index}.png`);
      await sharp({ create: { width: 8, height: 8, channels: 4, background: { r: index, g: 0, b: 0, alpha: 1 } } }).png().toFile(path);
      return path;
    }));
    const { png, sliceUse } = await compositeCut(paths, cut.evidence.cutHeights, cut, 8, 8);
    const raw = await sharp(png).raw().toBuffer();
    // Pixel column 0 sits at the ramp's foot; column 7 is beyond the ramp's top and filled
    // from its nearest walkable neighbour, so it uses a later slice than column 0.
    const left = raw[0]!, right = raw[7 * 4]!;
    expect(left).toBeLessThan(right);
    expect(sliceUse.reduce((sum, count) => sum + count, 0)).toBe(64);
    // No pixel picks a slice below its own surface plus headroom.
    for (let i = 0; i < 64; i++) expect(cut.evidence.cutHeights[raw[i * 4]!]!).toBeGreaterThanOrEqual(cut.field[i]! + 2 - 1e-6);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
