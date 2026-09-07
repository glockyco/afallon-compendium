import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { hashFile } from "./build";
import type { CompendiumConfig } from "./config";
import type { IllustrationPlan } from "./illustration-contracts";
import { prepareIllustration } from "./illustrations";

async function fixture(check: (context: {
  plan: IllustrationPlan;
  root: string;
  execute: () => ReturnType<typeof prepareIllustration>;
}) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "afallon-illustration-"));
  try {
    await sharp({ create: { width: 16, height: 16, channels: 3, background: "white" } }).png().toFile(join(root, "image.png"));
    await Bun.write(join(root, "review.json"), JSON.stringify({ controls: { "east/west~": true } }));
    await Bun.write(join(root, "profile.json"), JSON.stringify({
      schemaVersion: "compendium.map-space-profile.v1", buildId: "build",
      mapSpaces: [{ id: "island", label: "Island", floors: [] }], bindings: [],
    }));
    const plan: IllustrationPlan = {
      schemaVersion: "compendium.illustration-plan.v1", buildId: "build", layerId: "artwork",
      mapSpaceId: "island", floorId: null, role: "illustration",
      image: { path: "image.png", sha256: await hashFile(join(root, "image.png")) },
      mapSpaceProfile: { path: "profile.json", sha256: await hashFile(join(root, "profile.json")) },
      registration: {
        kind: "calibrated", maximumResidualPixels: 0.25,
        mapFromPixelEdge: { origin: { x: 100, y: 200 }, xAxis: { x: 0, y: 2 }, yAxis: { x: -3, y: 0 } },
        landmarks: [
          { id: "origin", pixel: { x: 0, y: 0 }, map: { x: 100, y: 200 }, reviewed: true },
          { id: "east", pixel: { x: 10, y: 0 }, map: { x: 100, y: 220 }, reviewed: true },
          { id: "south", pixel: { x: 0, y: 10 }, map: { x: 70, y: 200 }, reviewed: true },
          { id: "check", pixel: { x: 10, y: 10 }, map: { x: 70, y: 220 }, reviewed: true },
        ],
        reviewEvidence: [{ path: "review.json", sha256: await hashFile(join(root, "review.json")), pointer: "/controls/east~1west~0" }],
      },
    };
    const config: CompendiumConfig = {
      gamePath: root, outputRoot: join(root, "output"), runtimeOutputRoot: "Z:/unused",
      hotreplUrl: "ws://127.0.0.1:1", character: "unused", timeoutMs: 1000,
    };
    await check({ plan, root, execute: async () => {
      const path = join(root, "plan.json");
      await Bun.write(path, JSON.stringify(plan));
      return prepareIllustration(config, { buildId: "build", inputHashes: {} }, path);
    } });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("rotated affine artwork preserves landmark registration", async () => {
  await fixture(async ({ execute }) => {
    const output = await execute();
    if (output.registration.kind !== "calibrated") throw new Error("Expected calibrated artwork.");
    const east = output.registration.residualChecks.find(control => control.controlId === "east")!;
    expect(east.projectedPixel.x).toBeCloseTo(10, 9);
    expect(east.projectedPixel.y).toBeCloseTo(0, 9);
    expect(east.independentProjectedPixel.x).toBeCloseTo(10, 9);
    expect(east.independentProjectedPixel.y).toBeCloseTo(0, 9);
    expect(Math.max(...output.registration.residualChecks.map(control => control.independentResidualPixels))).toBeLessThan(1e-9);
  });
});

test("calibration rejects a missing or duplicated independent control", async () => {
  await fixture(async ({ plan, execute }) => {
    if (plan.registration.kind !== "calibrated") throw new Error("Expected calibrated fixture.");
    const control = plan.registration.landmarks.pop()!;
    await expect(execute()).rejects.toThrow();
    plan.registration.landmarks.push({ ...control, pixel: { x: 0, y: 0 }, map: { x: 100, y: 200 } });
    await expect(execute()).rejects.toThrow();
  });
});

test("missing review evidence cannot replace valid illustration output", async () => {
  await fixture(async ({ plan, root, execute }) => {
    await execute();
    const pointer = join(root, "output/build/illustration-latest-success.json");
    const selected = await Bun.file(pointer).text();
    plan.registration.reviewEvidence[0]!.pointer = "/controls/absent";
    await expect(execute()).rejects.toThrow();
    expect(await Bun.file(pointer).text()).toBe(selected);
  });
});

test("AVIF artwork uses its browser media type regardless of filename", async () => {
  await fixture(async ({ plan, root, execute }) => {
    const imagePath = join(root, "image.png");
    const bytes = await sharp(imagePath).avif().toBuffer();
    await Bun.write(imagePath, bytes);
    plan.image.sha256 = await hashFile(imagePath);
    const output = await execute();
    expect(output.image.mediaType).toBe("image/avif");
    expect(output.image.path.endsWith(".avif")).toBe(true);
  });
});

test("a matching hash cannot make a truncated image publishable", async () => {
  await fixture(async ({ plan, root, execute }) => {
    await execute();
    const pointer = join(root, "output/build/illustration-latest-success.json");
    const selected = await Bun.file(pointer).text();
    const imagePath = join(root, "image.png");
    const bytes = await Bun.file(imagePath).bytes();
    await Bun.write(imagePath, bytes.subarray(0, 40));
    plan.image.sha256 = await hashFile(imagePath);
    await expect(execute()).rejects.toThrow();
    expect(await Bun.file(pointer).text()).toBe(selected);
  });
});
