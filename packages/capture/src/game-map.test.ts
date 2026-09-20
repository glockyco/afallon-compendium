import { describe, expect, test } from "bun:test";
import type { IllustrationPlan } from "@afallon/contracts";
import { validateGameMapCalibration } from "./game-map";

const plan: IllustrationPlan = {
  schemaVersion: "compendium.illustration-plan.v2",
  buildId: "build",
  layerId: "world-artwork",
  mapSpaceId: "world",
  role: "illustration",
  image: { path: "map.png", sha256: "a".repeat(64) },
  mapSpaceProfile: { path: "profile.json", sha256: "b".repeat(64) },
  registration: {
    kind: "calibrated",
    mapFromPixelEdge: { origin: { x: 10, y: 20 }, xAxis: { x: 2, y: 0 }, yAxis: { x: 0, y: -2 } },
    landmarks: [
      { id: "north-west", pixel: { x: 0, y: 0 }, map: { x: 10, y: 20 }, reviewed: true },
      { id: "north-east", pixel: { x: 10, y: 0 }, map: { x: 30, y: 20 }, reviewed: true },
      { id: "south-west", pixel: { x: 0, y: 10 }, map: { x: 10, y: 0 }, reviewed: true },
      { id: "south-east", pixel: { x: 10, y: 10 }, map: { x: 30, y: 0 }, reviewed: true },
    ],
    maximumResidualPixels: 0.05,
    reviewEvidence: [{ path: "review.json", sha256: "c".repeat(64), pointer: "/calibration" }],
  },
};

describe("game-map calibration", () => {
  test("accepts controls reproduced by the affine registration", () => {
    expect(() => validateGameMapCalibration(plan)).not.toThrow();
  });

  test("rejects a reviewed control outside the residual limit", () => {
    const changed: IllustrationPlan = structuredClone(plan);
    changed.registration.landmarks[3]!.map.x += 0.2;
    expect(() => validateGameMapCalibration(changed)).toThrow(/south-east residual/);
  });

  test("rejects a singular registration", () => {
    const changed: IllustrationPlan = structuredClone(plan);
    changed.registration.mapFromPixelEdge.yAxis = { x: 4, y: 0 };
    expect(() => validateGameMapCalibration(changed)).toThrow(/singular/);
  });
});
