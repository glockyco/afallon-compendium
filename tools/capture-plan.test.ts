import { expect, test } from "bun:test";
import { validateCapturePlan } from "./capture";
import type { CapturePlan } from "./capture-contracts";

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
