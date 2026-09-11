import { expect, test } from "bun:test";
import { blockingIssues, clippingEvidence, effectiveCaptureFrame } from "./capture-readiness";
import type { CaptureGeometry, CapturePlan } from "./capture-contracts";

const vector = (x: number, y: number, z: number) => ({ x, y, z });

function plan(): CapturePlan {
  return {
    schemaVersion: "compendium.capture-plan.v5",
    sceneNativeId: 1,
    scenePath: "Assets/Test.unity",
    mapSpaceId: "test",
    width: 100,
    height: 100,
    cullingMask: -1,
    lighting: {
      ambient: { r: 1, g: 1, b: 1 },
      directionalIntensity: 1,
      directionalEuler: vector(0, 0, 0),
    },
    readiness: { timeoutMs: 1000, stableFrames: 2, boundaryOverlap: 0, maximumSources: 1 },
    tiles: [{ id: "tile", frame: { center: { x: 0, z: 0 }, worldSize: { x: 10, z: 10 }, cameraY: 20, nearClip: 1, farClip: 30 } }],
  };
}

test("an unreviewed plan leaves the tile frame unchanged", () => {
  const capturePlan = plan();
  expect(clippingEvidence(capturePlan)).toEqual({ source: "none", applied: false, clipHeight: null });
  expect(effectiveCaptureFrame(capturePlan.tiles[0]!, capturePlan)).toEqual(capturePlan.tiles[0]!.frame);
});

test("a reviewed clip height changes only the camera height", () => {
  const capturePlan: CapturePlan = { ...plan(), clipHeight: -256 };
  expect(clippingEvidence(capturePlan)).toEqual({ source: "plan", applied: true, clipHeight: -256 });
  expect(effectiveCaptureFrame(capturePlan.tiles[0]!, capturePlan)).toEqual({
    ...capturePlan.tiles[0]!.frame,
    cameraY: -256,
  });
});

test("an authored content defect never blocks readiness, an inventory integrity failure does", () => {
  const geometry = {
    issues: [
      { kind: "missing-material", sourceId: -2305742, detail: "Selected mesh renderer has a missing shared material at slot 3." },
      { kind: "missing-terrain", sourceId: 17, detail: "Terrain.terrainData is missing." },
      { kind: "source-integrity", sourceId: 9, detail: "Renderer.bounds could not be read." },
    ],
  } as unknown as CaptureGeometry;
  expect(blockingIssues(geometry).map(issue => issue.kind)).toEqual(["source-integrity"]);
});
