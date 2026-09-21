import { createHash, randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import sharp from "sharp";
import { Assert } from "typebox/value";
import { ArtifactStore, beginArtifactRun, createArtifactLease, fingerprintStep, selectLatestSuccess } from "@afallon/artifacts";
import { canonicalJson, IllustrationPlanSchema, MapSpaceProfileSchema, schemaRegistry, type ContentIdentity, type IllustrationPlan } from "@afallon/contracts";
import { CatalogImagerySchema, type CatalogImagery } from "@afallon/contracts/catalog";

const TILE_SIZE = 256;
const CHANNELS = 4;
const EPSILON = 1e-9;

type Point = { x: number; y: number };
type Affine = { origin: Point; xAxis: Point; yAxis: Point };
type DecodedImage = { data: Buffer; width: number; height: number };

export type GameMapResult = { manifest: ContentIdentity; manifestPath: string; imagery: ContentIdentity; files: number; bytes: number };

function sha256(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
function apply(frame: Affine, point: Point): Point {
  return { x: frame.origin.x + frame.xAxis.x * point.x + frame.yAxis.x * point.y, y: frame.origin.y + frame.xAxis.y * point.x + frame.yAxis.y * point.y };
}
function inverse(frame: Affine): (point: Point) => Point {
  const determinant = frame.xAxis.x * frame.yAxis.y - frame.yAxis.x * frame.xAxis.y;
  if (!Number.isFinite(determinant) || Math.abs(determinant) <= EPSILON) throw new Error("Game-map registration rejected: mapFromPixelEdge is singular.");
  return point => {
    const x = point.x - frame.origin.x, y = point.y - frame.origin.y;
    return { x: (frame.yAxis.y * x - frame.yAxis.x * y) / determinant, y: (-frame.xAxis.y * x + frame.xAxis.x * y) / determinant };
  };
}

export function validateGameMapCalibration(plan: IllustrationPlan): void {
  Assert(IllustrationPlanSchema, plan);
  const [minX, minY, maxX, maxY] = plan.deliveryExtent;
  if (![minX, minY, maxX, maxY].every(Number.isFinite) || minX >= maxX || minY >= maxY) throw new Error("Game-map registration rejected: deliveryExtent is not a finite positive-area box.");
  const toPixel = inverse(plan.registration.mapFromPixelEdge);
  for (const landmark of plan.registration.landmarks) {
    const projected = toPixel(landmark.map);
    const residual = Math.hypot(projected.x - landmark.pixel.x, projected.y - landmark.pixel.y);
    if (!Number.isFinite(residual) || residual > plan.registration.maximumResidualPixels) {
      throw new Error(`Game-map registration rejected: landmark ${landmark.id} residual ${residual} exceeds ${plan.registration.maximumResidualPixels} pixels.`);
    }
  }
}

function transformedBounds(frame: Affine, width: number, height: number): [number, number, number, number] {
  const corners = [apply(frame, { x: 0, y: 0 }), apply(frame, { x: width, y: 0 }), apply(frame, { x: 0, y: height }), apply(frame, { x: width, y: height })];
  return [Math.min(...corners.map(point => point.x)), Math.min(...corners.map(point => point.y)), Math.max(...corners.map(point => point.x)), Math.max(...corners.map(point => point.y))];
}

function visibleDeliveryExtent(image: DecodedImage, plan: IllustrationPlan): [number, number, number, number] {
  let minX = image.width, minY = image.height, maxX = -1, maxY = -1;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    if (image.data[(y * image.width + x) * CHANNELS + 3] === 0) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  if (maxX < minX || maxY < minY) throw new Error("Game-map generation rejected: calibrated image has no visible pixels.");
  const frame = plan.registration.mapFromPixelEdge;
  const visibleFrame: Affine = {
    origin: apply(frame, { x: minX, y: minY }),
    xAxis: frame.xAxis,
    yAxis: frame.yAxis,
  };
  const visible = transformedBounds(visibleFrame, maxX - minX + 1, maxY - minY + 1), reviewed = plan.deliveryExtent;
  const extent: [number, number, number, number] = [Math.max(reviewed[0], visible[0]), Math.max(reviewed[1], visible[1]), Math.min(reviewed[2], visible[2]), Math.min(reviewed[3], visible[3])];
  if (extent[0] >= extent[2] || extent[1] >= extent[3]) throw new Error("Game-map generation rejected: reviewed delivery extent contains no visible pixels.");
  return extent;
}

function chooseMaxZoom(frame: Affine): number {
  const xScale = Math.hypot(frame.xAxis.x, frame.xAxis.y), yScale = Math.hypot(frame.yAxis.x, frame.yAxis.y);
  const scale = Math.sqrt(xScale * yScale);
  if (!Number.isFinite(scale) || scale <= EPSILON) throw new Error("Game-map registration rejected: raster resolution is invalid.");
  return Math.round(Math.log2(1 / scale));
}

export function validateGameMapDeliveryExtent(plan: IllustrationPlan, width: number, height: number): void {
  const frame = plan.registration.mapFromPixelEdge, sourceBounds = transformedBounds(frame, width, height), bounds = plan.deliveryExtent;
  const residual = plan.registration.maximumResidualPixels;
  const toleranceX = residual * (Math.abs(frame.xAxis.x) + Math.abs(frame.yAxis.x)) + EPSILON;
  const toleranceY = residual * (Math.abs(frame.xAxis.y) + Math.abs(frame.yAxis.y)) + EPSILON;
  if (bounds[0] < sourceBounds[0] - toleranceX || bounds[1] < sourceBounds[1] - toleranceY || bounds[2] > sourceBounds[2] + toleranceX || bounds[3] > sourceBounds[3] + toleranceY) {
    throw new Error("Game-map registration rejected: deliveryExtent lies outside the calibrated image.");
  }
}

function sample(image: DecodedImage, toPixel: (point: Point) => Point, mapX: number, mapY: number): readonly [number, number, number, number] | null {
  const pixel = toPixel({ x: mapX, y: mapY });
  const x = Math.floor(pixel.x), y = Math.floor(pixel.y);
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return null;
  const offset = (y * image.width + x) * CHANNELS;
  return [image.data[offset]!, image.data[offset + 1]!, image.data[offset + 2]!, image.data[offset + 3]!];
}

function renderTile(image: DecodedImage, toPixel: (point: Point) => Point, deliveryExtent: readonly [number, number, number, number], z: number, maxZoom: number, tileX: number, tileY: number): { data: Buffer; state: "captured" | "partial" | "empty"; visible: boolean } {
  const scale = 2 ** (maxZoom - z), data = Buffer.alloc(TILE_SIZE * TILE_SIZE * CHANNELS);
  let captured = 0, covered = 0;
  for (let outputY = 0; outputY < TILE_SIZE; outputY++) for (let outputX = 0; outputX < TILE_SIZE; outputX++) {
    let red = 0, green = 0, blue = 0, alpha = 0, samples = 0;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const mapX = (tileX * TILE_SIZE + outputX) * 2 ** -z + (dx + 0.5) * 2 ** -maxZoom;
      const mapY = ((tileY + 1) * TILE_SIZE - outputY) * 2 ** -z - (dy + 0.5) * 2 ** -maxZoom;
      if (mapX < deliveryExtent[0] || mapY < deliveryExtent[1] || mapX >= deliveryExtent[2] || mapY >= deliveryExtent[3]) continue;
      const value = sample(image, toPixel, mapX, mapY);
      if (value === null) continue;
      covered++;
      const a = value[3];
      if (a === 0) continue;
      samples++;
      red += value[0] * a; green += value[1] * a; blue += value[2] * a; alpha += a;
    }
    if (samples === 0) continue;
    captured++;
    const offset = (outputY * TILE_SIZE + outputX) * CHANNELS;
    data[offset] = Math.round(red / alpha); data[offset + 1] = Math.round(green / alpha); data[offset + 2] = Math.round(blue / alpha);
    data[offset + 3] = Math.round(alpha / (scale * scale));
  }
  const pixels = TILE_SIZE * TILE_SIZE;
  return { data, visible: captured > 0, state: captured === 0 ? "empty" : captured === pixels && covered === pixels * scale * scale ? "captured" : "partial" };
}

async function checkedFile(path: string, expectedHash: string): Promise<Uint8Array> {
  const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
  const actual = sha256(bytes);
  if (actual !== expectedHash) throw new Error(`Game-map input rejected: ${path} hashes to ${actual}, expected ${expectedHash}.`);
  return bytes;
}

export async function generateGameMap(store: ArtifactStore, planPath: string, options: { diagnosticRevision: string; select?: boolean }): Promise<GameMapResult> {
  const absolutePlan = resolve(planPath), planDirectory = dirname(absolutePlan);
  const planValue: unknown = await Bun.file(absolutePlan).json();
  Assert(IllustrationPlanSchema, planValue);
  const plan = planValue as IllustrationPlan;
  validateGameMapCalibration(plan);
  if (!plan.mapSpaceProfile) throw new Error("Game-map registration rejected: mapSpaceProfile is required.");
  const imagePath = resolve(planDirectory, plan.image.path), profilePath = resolve(planDirectory, plan.mapSpaceProfile.path);
  const imageBytes = await checkedFile(imagePath, plan.image.sha256), profileBytes = await checkedFile(profilePath, plan.mapSpaceProfile.sha256);
  const profileValue: unknown = JSON.parse(new TextDecoder().decode(profileBytes));
  Assert(MapSpaceProfileSchema, profileValue);
  if (profileValue.buildId !== plan.buildId || !profileValue.mapSpaces.some(space => space.id === plan.mapSpaceId)) throw new Error("Game-map input rejected: map-space profile does not contain the plan build and map space.");
  const reviewInputs = await Promise.all(plan.registration.reviewEvidence.map(async evidence => ({ evidence, path: resolve(planDirectory, evidence.path), bytes: await checkedFile(resolve(planDirectory, evidence.path), evidence.sha256) })));
  const decodedResult = await sharp(imageBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (decodedResult.info.channels !== CHANNELS) throw new Error("Game-map input rejected: image could not be decoded as RGBA.");
  const image: DecodedImage = { data: decodedResult.data, width: decodedResult.info.width, height: decodedResult.info.height };
  const lease = await createArtifactLease(store, { runId: randomUUID(), buildId: plan.buildId, operation: "game-map-inputs", objects: [], manifests: [] });
  let planIdentity: ContentIdentity, imageIdentity: ContentIdentity, profileIdentity: ContentIdentity, reviewIdentities: ContentIdentity[];
  try {
    const storedPlan = await store.putBytes(new TextEncoder().encode(`${canonicalJson(plan)}\n`), lease);
    const storedImage = await store.putBytes(imageBytes, lease), storedProfile = await store.putBytes(profileBytes, lease);
    planIdentity = { sha256: storedPlan.sha256, bytes: storedPlan.bytes }; imageIdentity = { sha256: storedImage.sha256, bytes: storedImage.bytes }; profileIdentity = { sha256: storedProfile.sha256, bytes: storedProfile.bytes };
    reviewIdentities = await Promise.all(reviewInputs.map(async input => { const object = await store.putBytes(input.bytes, lease); return { sha256: object.sha256, bytes: object.bytes }; }));
  } finally { await lease.release(); }
  const inputs = { plan: planIdentity, image: imageIdentity, profile: profileIdentity, ...Object.fromEntries(reviewIdentities.map((identity, index) => [`review:${index}`, identity])) };
  const schemas = [IllustrationPlanSchema, CatalogImagerySchema].map(schema => schemaRegistry.identify(schema)).map(({ id, sha256 }) => ({ id, sha256 }));
  const settings = { tileSize: TILE_SIZE, coordinateSystem: "map-space-xy", pixelConvention: "top-left-edges" };
  const fingerprint = await fingerprintStep({ entrypoint: resolve(import.meta.dir, "game-map.ts"), buildId: plan.buildId, settings, schemas, inputs });
  const run = await beginArtifactRun(store, { buildId: plan.buildId, operation: "game-map", settings, schemas, implementationFingerprint: fingerprint.implementation, cacheKey: fingerprint.cacheKey, probeHashes: fingerprint.probeHashes, diagnosticRevision: options.diagnosticRevision, inputs, inputManifests: [] });
  try {
    await run.setPhase("execution");
    const frame = plan.registration.mapFromPixelEdge, toPixel = inverse(frame), maxZoom = chooseMaxZoom(frame);
    validateGameMapDeliveryExtent(plan, image.width, image.height);
    const bounds = visibleDeliveryExtent(image, plan);
    const rangeAt = (z: number) => ({ minX: Math.floor(bounds[0] / (TILE_SIZE * 2 ** -z)), minY: Math.floor(bounds[1] / (TILE_SIZE * 2 ** -z)), maxX: Math.ceil(bounds[2] / (TILE_SIZE * 2 ** -z)) - 1, maxY: Math.ceil(bounds[3] / (TILE_SIZE * 2 ** -z)) - 1 });
    let minZoom = maxZoom - 5;
    for (let z = maxZoom; z >= maxZoom - 5; z--) { const range = rangeAt(z); if ((range.maxX - range.minX + 1) * (range.maxY - range.minY + 1) <= 4) { minZoom = z; break; } }
    const tiles: CatalogImagery["layer"]["tiles"] = [];
    let totalBytes = 0;
    for (let z = minZoom; z <= maxZoom; z++) {
      const range = rangeAt(z);
      for (let y = range.minY; y <= range.maxY; y++) for (let x = range.minX; x <= range.maxX; x++) {
        const tile = renderTile(image, toPixel, bounds, z, maxZoom, x, y);
        if (!tile.visible) continue;
        const webp = await sharp(tile.data, { raw: { width: TILE_SIZE, height: TILE_SIZE, channels: CHANNELS } }).webp({ lossless: true }).toBuffer();
        const object = await run.putBytes(webp), path = `tiles/${z}/${x}/${y}.${object.sha256}.webp`;
        await run.addArtifact(path, object, { mediaType: "image/webp" });
        tiles.push({ z, x, y, url: `data/assets/${object.sha256}.webp`, sha256: object.sha256, bytes: object.bytes, width: TILE_SIZE, height: TILE_SIZE, state: tile.state });
        totalBytes += object.bytes;
      }
    }
    if (tiles.length === 0) throw new Error("Game-map generation rejected: calibrated image produced no visible tiles.");
    const imagery: CatalogImagery = { schemaVersion: "compendium.catalog-imagery.v1", buildId: plan.buildId, layer: { id: plan.layerId, mapSpaceId: plan.mapSpaceId, label: plan.label, kind: "game-map", tileSize: TILE_SIZE, minZoom, maxZoom, extent: bounds, tiles }, inputs: Object.values(inputs) };
    Assert(CatalogImagerySchema, imagery);
    await run.setPhase("finalization");
    const imageryObject = await run.putBytes(new TextEncoder().encode(`${canonicalJson(imagery)}\n`));
    await run.addArtifact("catalog-imagery.json", imageryObject, { mediaType: "application/json", schemaId: imagery.schemaVersion, references: tiles.map(tile => ({ kind: "object" as const, content: { sha256: tile.sha256, bytes: tile.bytes } })) });
    await run.succeed();
    const sourceManifest = run.manifestIdentity!;
    const sourceImagery = { sha256: imageryObject.sha256, bytes: imageryObject.bytes };
    const catalogInputs = { sourceImagery, sourceManifest };
    const catalogFingerprint = await fingerprintStep({ entrypoint: resolve(import.meta.dir, "game-map.ts"), buildId: plan.buildId, settings: { stage: "catalog-evidence" }, schemas, inputs: catalogInputs });
    const catalogRun = await beginArtifactRun(store, { buildId: plan.buildId, operation: "game-map-catalog", settings: { stage: "catalog-evidence" }, schemas, implementationFingerprint: catalogFingerprint.implementation, cacheKey: catalogFingerprint.cacheKey, probeHashes: catalogFingerprint.probeHashes, diagnosticRevision: options.diagnosticRevision, inputs: catalogInputs, inputManifests: ["sourceManifest"] });
    try {
      await catalogRun.setPhase("execution");
      const catalogImagery: CatalogImagery = { ...imagery, inputs: [...imagery.inputs, sourceImagery], manifests: [sourceManifest] };
      Assert(CatalogImagerySchema, catalogImagery);
      await catalogRun.setPhase("finalization");
      const catalogObject = await catalogRun.putBytes(new TextEncoder().encode(`${canonicalJson(catalogImagery)}\n`));
      await catalogRun.addArtifact("catalog-imagery.json", catalogObject, { mediaType: "application/json", schemaId: catalogImagery.schemaVersion, references: [{ kind: "object", content: sourceImagery }, { kind: "run-manifest", content: sourceManifest }] });
      await catalogRun.succeed();
      if (options.select === true) await selectLatestSuccess(store, catalogRun.manifestPath);
      return { manifest: catalogRun.manifestIdentity!, manifestPath: catalogRun.manifestPath, imagery: { sha256: catalogObject.sha256, bytes: catalogObject.bytes }, files: tiles.length, bytes: totalBytes };
    } catch (error) { if (catalogRun.status === "running") await catalogRun.fail(error); throw error; }
    finally { await catalogRun.release(); }
  } catch (error) { if (run.status === "running") await run.fail(error); throw error; }
  finally { await run.release(); }
}
