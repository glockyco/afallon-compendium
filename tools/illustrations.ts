import { readFile, mkdir, chmod, stat } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import sharp from "sharp";
import { Assert, AssertError } from "typebox/value";
import type { TSchema } from "typebox";
import type { CompendiumConfig } from "@afallon/contracts";
import { hashFile, toolRevision } from "./build";
import { IllustrationOutputSchema,
IllustrationPlanSchema,
type IllustrationEvidenceInput,
type IllustrationOutput,
type IllustrationPlan,
type IllustrationRegistrationOutput, } from "@afallon/contracts"
import type { MapSpaceProfile } from "@afallon/contracts"
import { loadSpatialProfile, resolveEvidencePointer } from "./spatial-extraction";
import { indexMapSpaceDefinitions } from "./map-spaces";
import type { ArtifactRecord } from "@afallon/contracts";
import { beginRun } from "./runs";

const PIXEL_RESIDUAL_EPSILON = 1e-9;
const FRAME_DETERMINANT_EPSILON = Number.EPSILON;
const IMAGE_MEDIA_TYPES: Record<string, { mediaType: string; extension: string }> = {
  avif: { mediaType: "image/avif", extension: "avif" },
  jpeg: { mediaType: "image/jpeg", extension: "jpg" },
  png: { mediaType: "image/png", extension: "png" },
  webp: { mediaType: "image/webp", extension: "webp" },
};

type CheckedFile = {
  content: Buffer;
  path: string;
  sha256: string;
  bytes: number;
  expectedSha256: string | undefined;
  matchesExpected: boolean;
};

export interface IllustrationBuildIdentity {
  buildId: string;
  inputHashes: Record<string, string>;
}
type ProfileSource = {
  path: string;
  expectedSha256: string | undefined;
};
type Pixel = { x: number; y: number };
type AffineFrame = {
  origin: Pixel;
  xAxis: Pixel;
  yAxis: Pixel;
};
type Control = {
  id: string;
  pixel: Pixel;
  map: Pixel;
  reviewed: true;
};
type ResidualCheck = {
  controlId: string;
  expectedPixel: Pixel;
  projectedPixel: Pixel;
  residualPixels: number;
  independentProjectedPixel: Pixel;
  independentResidualPixels: number;
};
type EvidenceOutput = {
  path: string;
  sha256: string;
  bytes: number;
  pointer?: string;
};

function parseContract<T>(schema: TSchema, value: unknown, label: string): T {
  try {
    Assert(schema, value);
    return value as T;
  } catch (error) {
    if (error instanceof AssertError) {
      throw new TypeError(`${label} does not satisfy its contract: ${error.message}`, { cause: error.cause.errors });
    }
    throw error;
  }
}

function assertFinite(value: unknown, label: string, seen = new WeakSet<object>()): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFinite(item, `${label}[${index}]`, seen));
    return;
  }
  for (const [key, child] of Object.entries(value)) assertFinite(child, `${label}.${key}`, seen);
}

function determinant(frame: AffineFrame): number {
  const first = frame.xAxis.x * frame.yAxis.y;
  const second = frame.yAxis.x * frame.xAxis.y;
  const value = first - second;
  const scale = Math.max(1, Math.abs(first), Math.abs(second));
  if (!Number.isFinite(value) || Math.abs(value) <= FRAME_DETERMINANT_EPSILON * scale) {
    throw new TypeError("Calibrated illustration mapFromPixelEdge frame is singular or numerically unstable.");
  }
  return value;
}

function inverseFrame(frame: AffineFrame): AffineFrame {
  const det = determinant(frame);
  return {
    origin: {
      x: (-frame.yAxis.y * frame.origin.x + frame.yAxis.x * frame.origin.y) / det,
      y: (frame.xAxis.y * frame.origin.x - frame.xAxis.x * frame.origin.y) / det,
    },
    xAxis: { x: frame.yAxis.y / det, y: -frame.xAxis.y / det },
    yAxis: { x: -frame.yAxis.x / det, y: frame.xAxis.x / det },
  };
}

function project(frame: AffineFrame, point: Pixel): Pixel {
  return {
    x: frame.origin.x + frame.xAxis.x * point.x + frame.yAxis.x * point.y,
    y: frame.origin.y + frame.xAxis.y * point.x + frame.yAxis.y * point.y,
  };
}

function pixelDistance(first: Pixel, second: Pixel): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function findNonCollinearControls(controls: readonly Control[]): [Control, Control, Control] {
  const first = controls[0]!;
  let second = first;
  let distance = 0;
  for (const control of controls) {
    const candidate = pixelDistance(first.pixel, control.pixel);
    if (candidate > distance) { second = control; distance = candidate; }
  }
  let third = first;
  let area = 0;
  const dx = second.pixel.x - first.pixel.x;
  const dy = second.pixel.y - first.pixel.y;
  for (const control of controls) {
    const candidate = Math.abs(dx * (control.pixel.y - first.pixel.y) - dy * (control.pixel.x - first.pixel.x));
    if (candidate > area) { third = control; area = candidate; }
  }
  if (!Number.isFinite(area) || area <= Number.EPSILON * Math.max(1, distance * distance)) {
    throw new TypeError("Calibrated illustration landmarks must contain three non-collinear pixel controls.");
  }
  return [first, second, third];
}

function fitAffineFromControls(controls: readonly [Control, Control, Control]): AffineFrame {
  const first = controls[0]!;
  const second = controls[1]!;
  const third = controls[2]!;
  const dp1 = { x: second.pixel.x - first.pixel.x, y: second.pixel.y - first.pixel.y };
  const dp2 = { x: third.pixel.x - first.pixel.x, y: third.pixel.y - first.pixel.y };
  const det = dp1.x * dp2.y - dp2.x * dp1.y;
  if (!Number.isFinite(det) || Math.abs(det) <= Number.EPSILON * Math.max(1, Math.abs(dp1.x), Math.abs(dp1.y), Math.abs(dp2.x), Math.abs(dp2.y)) ** 2) {
    throw new TypeError("Calibrated illustration landmarks define an unstable affine fit.");
  }

  function fitAxis(axis: "x" | "y"): Pixel {
    const dq1 = first.map[axis];
    const dq2 = second.map[axis];
    const dq3 = third.map[axis];
    const d1 = dq2 - dq1;
    const d2 = dq3 - dq1;
    return {
      x: (d1 * dp2.y - d2 * dp1.y) / det,
      y: (-d1 * dp2.x + d2 * dp1.x) / det,
    };
  }
  const x = fitAxis("x");
  const y = fitAxis("y");
  const frame: AffineFrame = {
    origin: { x: first.map.x - x.x * first.pixel.x - x.y * first.pixel.y, y: first.map.y - y.x * first.pixel.x - y.y * first.pixel.y },
    xAxis: { x: x.x, y: y.x },
    yAxis: { x: x.y, y: y.y },
  };
  determinant(frame);
  return frame;
}

function validateEvidenceList(evidence: readonly IllustrationEvidenceInput[], label: string): void {
  const references = new Set<string>();
  for (const item of evidence) {
    const key = `${item.path}\0${item.pointer ?? ""}`;
    if (references.has(key)) throw new Error(`${label} repeats evidence "${item.path}" at "${item.pointer ?? ""}".`);
    references.add(key);
  }
}

function validateMapRegistration(
  plan: IllustrationPlan,
  width: number,
  height: number,
): IllustrationRegistrationOutput {
  const registration = plan.registration;
  validateEvidenceList(registration.reviewEvidence, "Illustration registration reviewEvidence");
  const frame = registration.mapFromPixelEdge as AffineFrame;
  determinant(frame);
  const inverse = inverseFrame(frame);
  const controls = registration.landmarks as Control[];
  const ids = new Set<string>();
  const pixels = new Set<string>();
  for (const control of controls) {
    if (ids.has(control.id)) throw new Error(`Illustration calibration repeats landmark control "${control.id}".`);
    ids.add(control.id);
    const pixelKey = `${control.pixel.x},${control.pixel.y}`;
    if (pixels.has(pixelKey)) throw new Error(`Illustration calibration repeats pixel coordinates at "${control.id}".`);
    pixels.add(pixelKey);
    if (control.pixel.x < 0 || control.pixel.x > width || control.pixel.y < 0 || control.pixel.y > height) {
      throw new Error(`Illustration landmark "${control.id}" lies outside the ${width}x${height} image edge domain.`);
    }
  }
  const nonCollinear = findNonCollinearControls(controls);
  const independentFit = fitAffineFromControls(nonCollinear);
  const independentInverse = inverseFrame(independentFit);
  const residualChecks: ResidualCheck[] = [];
  for (const control of controls) {
    const projectedPixel = project(inverse, control.map);
    const residualPixels = pixelDistance(projectedPixel, control.pixel);
    if (!Number.isFinite(residualPixels) || residualPixels > registration.maximumResidualPixels + PIXEL_RESIDUAL_EPSILON) {
      throw new Error(`Illustration calibration control "${control.id}" exceeds the ${registration.maximumResidualPixels}-pixel residual limit.`);
    }
    const independentProjectedPixel = project(independentInverse, control.map);
    const independentResidualPixels = pixelDistance(independentProjectedPixel, control.pixel);
    if (!Number.isFinite(independentResidualPixels) || independentResidualPixels > registration.maximumResidualPixels + PIXEL_RESIDUAL_EPSILON) {
      throw new Error(`Illustration calibration controls are contradictory at "${control.id}".`);
    }
    residualChecks.push({
      controlId: control.id,
      expectedPixel: { ...control.pixel },
      projectedPixel,
      residualPixels,
      independentProjectedPixel,
      independentResidualPixels,
    });
  }
  // Check image-edge behavior independently from the reviewed controls. This catches a
  // frame that happens to agree at landmarks but is inconsistent over the raster.
  for (const corner of [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: 0, y: height }, { x: width, y: height }]) {
    const declaredMap = project(frame, corner);
    const fittedMap = project(independentFit, corner);
    const edgeResidual = pixelDistance(project(inverse, fittedMap), project(inverse, declaredMap));
    if (!Number.isFinite(edgeResidual) || edgeResidual > registration.maximumResidualPixels + PIXEL_RESIDUAL_EPSILON) {
      throw new Error("Illustration calibration frame contradicts the independent landmark fit at an image edge.");
    }
  }

  return {
    kind: "calibrated",
    mapFromPixelEdge: frame,
    landmarks: controls.map(control => ({ id: control.id, pixel: { ...control.pixel }, map: { ...control.map }, reviewed: true as const })),
    maximumResidualPixels: registration.maximumResidualPixels,
    residualChecks,
    reviewEvidence: [],
  };
}

async function checkedFile(path: string, expectedSha256: string | undefined): Promise<CheckedFile> {
  const absolute = resolve(path);
  const file = await stat(absolute);
  if (!file.isFile()) throw new Error(`Illustration input is not a regular file: ${absolute}`);
  const content = await readFile(absolute);
  const sha256 = new Bun.CryptoHasher("sha256").update(content).digest("hex");
  return {
    content,
    path: absolute,
    sha256,
    bytes: content.byteLength,
    expectedSha256,
    matchesExpected: expectedSha256 === undefined || expectedSha256 === sha256,
  };
}

async function readImageMetadata(file: CheckedFile): Promise<{ width: number; height: number; mediaType: string; extension: string }> {
  const { path, content } = file;
  let metadata;
  try {
    const image = sharp(content, { failOn: "error", animated: false });
    metadata = await image.metadata();
    await image.resize(1, 1).raw().toBuffer();
  } catch (error) {
    throw new Error(`Illustration image could not be decoded: ${path}`, { cause: error });
  }
  const width = metadata.width;
  const height = metadata.height;
  const format = metadata.format === "heif" && metadata.compression === "av1" ? "avif" : metadata.format;
  if (width === undefined || height === undefined || !Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`Illustration image has no finite dimensions: ${path}`);
  }
  if (metadata.orientation !== undefined && metadata.orientation !== 1) throw new Error("Illustration images must use unrotated pixel orientation.");
  if (metadata.pages !== undefined && metadata.pages !== 1) throw new Error("Illustration images must contain exactly one page/frame.");
  const media = format === undefined ? undefined : IMAGE_MEDIA_TYPES[format];
  if (media === undefined) throw new Error(`Unsupported illustration media format: ${format ?? "unknown"}.`);
  return { width, height, mediaType: media.mediaType, extension: media.extension };
}

function evidenceOutput(artifact: ArtifactRecord, pointer: string | undefined): EvidenceOutput {
  return { path: artifact.path, sha256: artifact.sha256, bytes: artifact.bytes, ...(pointer === undefined ? {} : { pointer }) };
}

function safeEvidenceName(index: number, source: string): string {
  const sourceName = basename(source).replace(/[^A-Za-z0-9._-]/g, "_").slice(-80) || `evidence-${index}`;
  return `evidence/${String(index).padStart(3, "0")}-${sourceName}`;
}

function assertRefMatches(label: string, ref: CheckedFile): void {
  if (!ref.matchesExpected) {
    throw new Error(`${label} changed since the plan was reviewed (expected ${ref.expectedSha256}, got ${ref.sha256}).`);
  }
}

function profileSource(config: CompendiumConfig, planPath: string, plan: IllustrationPlan): ProfileSource {
  if (plan.mapSpaceProfile !== undefined) {
    return {
      path: resolve(dirname(planPath), plan.mapSpaceProfile.path),
      expectedSha256: plan.mapSpaceProfile.sha256,
    };
  }
  if (config.mapSpaceProfile === undefined) {
    throw new Error("Illustration preparation requires mapSpaceProfile in the plan or local configuration.");
  }
  return { path: config.mapSpaceProfile, expectedSha256: undefined };
}

function validateMapSpace(profile: MapSpaceProfile, plan: IllustrationPlan): void {
  if (profile.buildId !== plan.buildId) throw new Error(`Illustration map-space profile build "${profile.buildId}" does not match plan build "${plan.buildId}".`);
  const mapSpace = indexMapSpaceDefinitions(profile.mapSpaces).get(plan.mapSpaceId);
  if (mapSpace === undefined) throw new Error(`Illustration references unknown map space "${plan.mapSpaceId}".`);
}

export async function prepareIllustration(
  config: CompendiumConfig,
  identity: IllustrationBuildIdentity,
  sourcePlanPath: string,
): Promise<IllustrationOutput & { manifest: string }> {
  const planPath = resolve(sourcePlanPath);
  const planFile = await checkedFile(planPath, undefined);
  const planBytes = planFile.content;
  const planValue: unknown = JSON.parse(planBytes.toString("utf8"));
  const plan = parseContract<IllustrationPlan>(IllustrationPlanSchema, planValue, "Illustration plan");
  assertFinite(plan, "Illustration plan");
  const imagePath = resolve(dirname(planPath), plan.image.path);
  const profile = profileSource(config, planPath, plan);
  const imageFile = await checkedFile(imagePath, plan.image.sha256);
  const profileFile = await checkedFile(profile.path, profile.expectedSha256);
  const metadata = await readImageMetadata(imageFile);
  const reviewEvidence = plan.registration.reviewEvidence;
  const reviewFiles = await Promise.all(reviewEvidence.map(async evidence => ({
    evidence,
    file: await checkedFile(resolve(dirname(planPath), evidence.path), evidence.sha256),
  })));
  const toolFiles = ["illustrations", "../packages/contracts/src/capture/illustration", "runs", "build", "config", "../packages/contracts/src/spatial/reviewed", "spatial-extraction", "map-spaces"] as const;
  const inputHashes: Record<string, string> = {
    ...identity.inputHashes,
    plan: planFile.sha256,
    image: imageFile.sha256,
    mapSpaceProfile: profileFile.sha256,
    ...Object.fromEntries(reviewFiles.map((item, index) => [`reviewEvidence:${index}`, item.file.sha256])),
  };
  for (const name of toolFiles) inputHashes[`tool:${name}`] = await hashFile(resolve(import.meta.dir, `${name}.ts`));
  inputHashes["dependencies"] = await hashFile(resolve(import.meta.dir, "../bun.lock"));
  const run = await beginRun(config.outputRoot, {
    ...identity,
    inputHashes,
    toolRevision: await toolRevision(),
    command: "illustration",
    settings: {
      layerId: plan.layerId,
      mapSpaceId: plan.mapSpaceId,
      registration: plan.registration.kind,
      primaryImagery: false,
      completeImagery: false,
    },
  });

  try {
    const planOutputPath = resolve(run.directory, "plan.json");
    await Bun.write(planOutputPath, planBytes);
    const planArtifact = await run.addArtifact("plan.json");
    if (planArtifact.sha256 !== planFile.sha256 || planArtifact.bytes !== planFile.bytes) {
      throw new Error("Illustration plan changed while it was being registered.");
    }
    assertRefMatches("Illustration artwork", imageFile);
    assertRefMatches("Illustration map-space profile", profileFile);
    for (const item of reviewFiles) {
      assertRefMatches("Illustration review evidence", item.file);
      if (item.evidence.pointer !== undefined) resolveEvidencePointer(JSON.parse(item.file.content.toString("utf8")), item.evidence.pointer);
    }

    if (plan.buildId !== identity.buildId) {
      throw new Error(`Illustration plan build "${plan.buildId}" does not match configured build "${identity.buildId}".`);
    }
    const reviewedProfile = await loadSpatialProfile(profile.path);
    if (reviewedProfile === null || reviewedProfile.sha256 !== profileFile.sha256) throw new Error("Illustration map-space profile changed during validation.");
    const profileValue = reviewedProfile.profile;
    assertFinite(profileValue, "Map-space profile");
    validateMapSpace(profileValue, plan);
    const registration = validateMapRegistration(plan, metadata.width, metadata.height);

    const profileDestination = "evidence/map-space-profile.json";
    await mkdir(resolve(run.directory, "evidence"), { recursive: true });
    await Bun.write(resolve(run.directory, profileDestination), profileFile.content);
    await chmod(resolve(run.directory, profileDestination), 0o444);
    const profileArtifact = await run.addArtifact(profileDestination);
    if (profileArtifact.sha256 !== profileFile.sha256 || profileArtifact.bytes !== profileFile.bytes) {
      throw new Error("Illustration map-space profile changed while it was being registered.");
    }

    const outputEvidence: Record<string, EvidenceOutput> = {};
    for (const [index, item] of reviewFiles.entries()) {
      const destination = safeEvidenceName(index, item.evidence.path);
      await Bun.write(resolve(run.directory, destination), item.file.content);
      await chmod(resolve(run.directory, destination), 0o444);
      const artifact = await run.addArtifact(destination);
      if (artifact.sha256 !== item.file.sha256 || artifact.bytes !== item.file.bytes) {
        throw new Error(`Illustration review evidence changed while it was being registered: ${item.evidence.path}.`);
      }
      outputEvidence[`${index}`] = evidenceOutput(artifact, item.evidence.pointer);
    }

    const extension = metadata.extension;
    const imageDestination = `image/${imageFile.sha256}.${extension}`;
    await mkdir(dirname(resolve(run.directory, imageDestination)), { recursive: true });
    await Bun.write(resolve(run.directory, imageDestination), imageFile.content);
    await chmod(resolve(run.directory, imageDestination), 0o444);
    const imageArtifact = await run.addArtifact(imageDestination);
    if (imageArtifact.sha256 !== imageFile.sha256 || imageArtifact.bytes !== imageFile.bytes) {
      throw new Error("Illustration artwork changed while it was being registered.");
    }
    const registeredEvidence = reviewFiles.map((item, index) => outputEvidence[`${index}`]!);
    const outputRegistration: IllustrationRegistrationOutput = { ...registration, reviewEvidence: registeredEvidence };
    const output: IllustrationOutput = {
      schemaVersion: "compendium.illustration.v1",
      buildId: identity.buildId,
      layerId: plan.layerId,
      mapSpaceId: plan.mapSpaceId,
      role: "illustration",
      primaryImagery: false,
      completeImagery: false,
      image: {
        path: imageArtifact.path,
        sha256: imageArtifact.sha256,
        bytes: imageArtifact.bytes,
        width: metadata.width,
        height: metadata.height,
        mediaType: metadata.mediaType,
      },
      mapSpaceProfile: evidenceOutput(profileArtifact, undefined),
      registration: outputRegistration,
    };
    Assert(IllustrationOutputSchema, output);
    const outputPath = resolve(run.directory, "illustration.json");
    await Bun.write(outputPath, `${JSON.stringify(output, null, 2)}\n`);
    await run.addArtifact("illustration.json");
    await run.succeed();
    return { ...output, manifest: run.manifestPath };
  } catch (error) {
    await run.fail(error);
    console.error(`Failed illustration run: ${run.manifestPath}`);
    throw error;
  }
}

