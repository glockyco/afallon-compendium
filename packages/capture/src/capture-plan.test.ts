import { expect, test } from "bun:test";
import { validateCapturePlan } from "./capture";
import { tileBounds } from "./capture-geometry";
import { capturePositionFor, type NavigationSurvey } from "./capture-position";
import type { CapturePlan } from "@afallon/contracts"

function plan(centers: ReadonlyArray<readonly [number, number]>): CapturePlan {
  return {
    schemaVersion: "compendium.capture-plan.v9",
    sceneNativeId: 1,
    scenePath: "Assets/Test.unity",
    mapSpaceId: "world-surface",
    width: 100,
    height: 100,
    cullingMask: -1,
    lighting: {
      ambient: { r: 1, g: 1, b: 1 },
      directionalIntensity: 1,
      directionalEuler: { x: 0, y: 0, z: 0 },
    },
    readiness: { timeoutMs: 1000, stableFrames: 2, settleFrames: 0, boundaryOverlap: 0 },
    tiles: centers.map(([x, z], index) => ({
      id: `tile-${index}`,
      frame: {
        center: { x, z },
        worldSize: { x: 10, z: 10 },
        cameraY: 20,
        nearClip: 1,
        farClip: 30,
      },
    })),
  };
}

test("a capture plan is refused for a map other than the overworld", () => {
  const interior = { ...plan([[0, 0]]), mapSpaceId: "cellar-cave-coalway-woods" } as unknown as CapturePlan;
  expect(() => validateCapturePlan(interior)).toThrow();
});

test("a capture plan tile keeps the world and pixel aspect ratios equal", () => {
  const skewed = plan([[0, 0]]);
  skewed.tiles[0]!.frame.worldSize = { x: 10, z: 20 };
  expect(() => validateCapturePlan(skewed)).toThrow("world and pixel aspect ratios do not match");
});

test("capture plan aspect ratios use capture tolerance rather than readiness tolerance", () => {
  const near = plan([[0, 0]]);
  near.tiles[0]!.frame.worldSize.x = 10 * 1.000005;
  expect(() => validateCapturePlan(near)).toThrow();
  near.tiles[0]!.frame.worldSize.x = 10 * 1.0000005;
  expect(() => validateCapturePlan(near)).not.toThrow();
});

test("asymmetric negative tiles share bounds and select the nearest walkable point inside them", () => {
  const asymmetric = plan([[-10, -20], [-2, -30]]);
  asymmetric.tiles[0]!.frame.worldSize = { x: 6, z: 12 };
  asymmetric.tiles[1]!.frame.worldSize = { x: 4, z: 2 };
  expect(tileBounds(asymmetric.tiles)).toEqual({ minX: -13, maxX: 0, minZ: -31, maxZ: -14 });
  const survey: NavigationSurvey = { scene: { nativeId: 1 }, indices: [], vertices: [-14, 50, -22.5, -6.5, 3, -22, -3, 4, -28] };
  expect(capturePositionFor(asymmetric, survey)).toEqual({ x: -6.5, y: 3, z: -22 });
});

test("declared standing bounds take precedence and remain stable when tiles change", () => {
  const standing = plan([[100, 100]]);
  standing.standing = { minX: -10, maxX: 0, minZ: -20, maxZ: -10 };
  const survey: NavigationSurvey = { scene: { nativeId: 1 }, indices: [], vertices: [100, 30, 100, -5, 7, -15, -5, 9, -15] };
  expect(capturePositionFor(standing, survey)).toEqual({ x: -5, y: 7, z: -15 });
  standing.tiles = [];
  expect(capturePositionFor(standing, survey)).toEqual({ x: -5, y: 7, z: -15 });
});

test("an empty tile set retains its empty extent and cannot select a position without standing bounds", () => {
  const empty = plan([]);
  expect(tileBounds(empty.tiles)).toEqual({ minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });
  expect(() => validateCapturePlan(empty)).toThrow();
  expect(() => capturePositionFor(empty, { scene: { nativeId: 1 }, indices: [], vertices: [0, 0, 0] })).toThrow();
});
