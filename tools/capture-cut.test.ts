import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { composeCut, compositeRawSlices, cutCaptureFrame, planTileCut, type NavigationSurvey } from "./capture-cut";
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

test("the composite takes each pixel from the first slice above its walkable height", () => {
  const capturePlan = plan(true);
  const cut = planTileCut(capturePlan.tiles[0]!, capturePlan, ramp)!;
  // Each slice is a solid colour whose red channel is its index.
  const slices = cut.evidence.cutHeights.map((_, index) => {
    const buffer = Buffer.alloc(8 * 8 * 3);
    for (let i = 0; i < 64; i++) buffer[i * 3] = index;
    return buffer;
  });
  const { rgb, sliceUse } = composeCut(slices, cut.evidence.cutHeights, cut, 8, 8);
  // Pixel column 0 sits at the ramp's foot; column 7 is beyond the ramp's top and filled
  // from its nearest walkable neighbour, so it uses a later slice than column 0.
  const left = rgb[0]!, right = rgb[7 * 3]!;
  expect(left).toBeLessThan(right);
  expect(sliceUse.reduce((sum, count) => sum + count, 0)).toBe(64);
  // No pixel picks a slice below its own surface plus headroom, across the row mirror.
  for (let row = 0; row < 8; row++) for (let column = 0; column < 8; column++) {
    const pick = rgb[(row * 8 + column) * 3]!;
    expect(cut.evidence.cutHeights[pick]!).toBeGreaterThanOrEqual(cut.field[(7 - row) * 8 + column]! + 2 - 1e-6);
  }
});

test("raw slices are verified against their reported hashes before composing", async () => {
  const capturePlan = plan(true);
  const cut = planTileCut(capturePlan.tiles[0]!, capturePlan, ramp)!;
  const directory = await mkdtemp(join(tmpdir(), "cut-"));
  try {
    const paths: string[] = [];
    const reported: Array<{ index: number; cut: number; sha256: string; byteSize: number }> = [];
    for (const [index, height] of cut.evidence.cutHeights.entries()) {
      const bytes = Buffer.alloc(8 * 8 * 3, index);
      const path = join(directory, `slice-${index}.rgb`);
      await Bun.write(path, bytes);
      paths.push(path);
      reported.push({ index, cut: height, sha256: createHash("sha256").update(bytes).digest("hex"), byteSize: bytes.byteLength });
    }
    const png = await compositeRawSlices(paths, reported, cut, 8, 8, "tile");
    const decoded = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    expect(decoded.info.width).toBe(8);
    expect(decoded.info.height).toBe(8);
    reported[0]!.sha256 = "0".repeat(64);
    await expect(compositeRawSlices(paths, reported, cut, 8, 8, "tile")).rejects.toThrow("does not match its reported hash");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
