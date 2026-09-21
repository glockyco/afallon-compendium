import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { ArtifactStore } from "@afallon/artifacts";
import type { IllustrationPlan } from "@afallon/contracts";
import { generateGameMap, validateGameMapCalibration, validateGameMapDeliveryExtent } from "./game-map";

const plan: IllustrationPlan = {
  schemaVersion: "compendium.illustration-plan.v3",
  buildId: "build",
  layerId: "world-artwork",
  mapSpaceId: "world",
  label: "World game map",
  role: "illustration",
  image: { path: "map.png", sha256: "a".repeat(64) },
  mapSpaceProfile: { path: "profile.json", sha256: "b".repeat(64) },
  deliveryExtent: [10, 0, 30, 20],
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

  test("accepts edge rounding within the reviewed residual", () => {
    const changed: IllustrationPlan = structuredClone(plan);
    changed.deliveryExtent = [9.91, -0.09, 30.09, 20.09];
    expect(() => validateGameMapDeliveryExtent(changed, 10, 10)).not.toThrow();
  });

  test("rejects an extent beyond the reviewed residual", () => {
    const changed: IllustrationPlan = structuredClone(plan);
    changed.deliveryExtent = [9.89, 0, 30, 20];
    expect(() => validateGameMapDeliveryExtent(changed, 10, 10)).toThrow(/outside the calibrated image/);
  });

  test("publishes visible pixel bounds instead of the enclosing tile lattice", async () => {
    const root = await mkdtemp(join(tmpdir(), "afallon-game-map-extent-"));
    try {
      const pixels = Buffer.alloc(10 * 10 * 4);
      for (let y = 2; y < 8; y++) for (let x = 2; x < 8; x++) pixels.set([20, 80, 40, 255], (y * 10 + x) * 4);
      const image = await sharp(pixels, { raw: { width: 10, height: 10, channels: 4 } }).png().toBuffer();
      const review = Buffer.from('{"calibration":{}}\n');
      const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
      const profile = Buffer.from(`${JSON.stringify({ schemaVersion: "compendium.map-space-profile.v2", buildId: "build", mapSpaces: [{ id: "world", label: "World" }], bindings: [{ id: "world", mapSpaceId: "world", sceneNativeId: 1, scenePath: "Assets/World.unity", frame: { origin: { x: 0, z: 0 }, xAxis: { x: 1, z: 0 }, yAxis: { x: 0, z: 1 } }, domain: { kind: "scene" }, evidence: [{ path: "review.json", sha256: digest(review), pointer: "/calibration" }] }] })}\n`);
      await Promise.all([writeFile(join(root, "map.png"), image), writeFile(join(root, "review.json"), review), writeFile(join(root, "profile.json"), profile)]);
      const input: IllustrationPlan = structuredClone(plan);
      input.image.sha256 = digest(image);
      input.mapSpaceProfile.sha256 = digest(profile);
      input.registration.reviewEvidence[0]!.sha256 = digest(review);
      input.deliveryExtent = [10, 0, 30, 20];
      const planPath = join(root, "plan.json");
      await writeFile(planPath, `${JSON.stringify(input)}\n`);
      const store = new ArtifactStore(join(root, "store"));
      const result = await generateGameMap(store, planPath, { diagnosticRevision: "test", select: false });
      const imagery = await Bun.file(store.objectPath(result.imagery.sha256)).json();
      expect(imagery.layer.extent).toEqual([14, 4, 26, 16]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
