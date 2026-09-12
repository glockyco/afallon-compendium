import { expect, test } from "bun:test";
import { validateCapturePlan } from "./capture";
import type { CapturePlan } from "./capture-contracts";

function plan(centers: ReadonlyArray<readonly [number, number]>): CapturePlan {
  return {
    schemaVersion: "compendium.capture-plan.v9",
    sceneNativeId: 1,
    scenePath: "Assets/Test.unity",
    mapSpaceId: "test-interior",
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

test("an interior capture plan includes its complete rectangular grid", () => {
  expect(() => validateCapturePlan(plan([[0, 0], [0, 10], [10, 0], [10, 10]]))).not.toThrow();
});

test("an interior capture plan rejects a missing grid cell", () => {
  expect(() => validateCapturePlan(plan([[0, 0], [0, 10], [10, 0]])))
    .toThrow("Interior capture plan must include every tile in its rectangular grid.");
});
