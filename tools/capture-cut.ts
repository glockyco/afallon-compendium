import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import type { CaptureCut, CaptureCutEvidence, CapturePlan } from "./capture-contracts";

type CaptureTile = CapturePlan["tiles"][number];

export type NavigationSurvey = { vertices: number[]; indices: number[]; scene: { nativeId: number } };

export type CutPlan = {
  evidence: NonNullable<CaptureCutEvidence>;
  // Walkable height per pixel with non-walkable pixels filled from their nearest neighbour.
  field: Float32Array;
  cameraY: number;
};

// Loads and verifies the navigation survey the plan's cut cites.
export async function loadNavigationSurvey(path: string, cut: CaptureCut, sceneNativeId: number): Promise<NavigationSurvey> {
  const bytes = await readFile(path);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== cut.survey.sha256) throw new Error("Capture cut survey hash does not match its plan.");
  const value = JSON.parse(bytes.toString("utf8")) as NavigationSurvey;
  if (!Array.isArray(value.vertices) || !Array.isArray(value.indices) || value.scene?.nativeId !== sceneNativeId) throw new Error("Capture cut survey does not describe the plan's scene.");
  return value;
}

// The highest walkable y under each pixel, rasterized from the navmesh triangles under the
// tile. A pixel with no walkable surface holds -Infinity.
function walkableHeightField(tile: CaptureTile, width: number, height: number, survey: NavigationSurvey): Float32Array {
  const field = new Float32Array(width * height).fill(Number.NEGATIVE_INFINITY);
  const minX = tile.frame.center.x - tile.frame.worldSize.x / 2;
  const maxZ = tile.frame.center.z + tile.frame.worldSize.z / 2;
  const scaleX = width / tile.frame.worldSize.x, scaleZ = height / tile.frame.worldSize.z;
  const v = survey.vertices, idx = survey.indices;
  for (let t = 0; t + 2 < idx.length; t += 3) {
    const a = idx[t]! * 3, b = idx[t + 1]! * 3, c = idx[t + 2]! * 3;
    const ax = (v[a]! - minX) * scaleX, az = (maxZ - v[a + 2]!) * scaleZ, ay = v[a + 1]!;
    const bx = (v[b]! - minX) * scaleX, bz = (maxZ - v[b + 2]!) * scaleZ, by = v[b + 1]!;
    const cx = (v[c]! - minX) * scaleX, cz = (maxZ - v[c + 2]!) * scaleZ, cy = v[c + 1]!;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(width - 1, Math.ceil(Math.max(ax, bx, cx)));
    const z0 = Math.max(0, Math.floor(Math.min(az, bz, cz))), z1 = Math.min(height - 1, Math.ceil(Math.max(az, bz, cz)));
    if (x0 > x1 || z0 > z1) continue;
    const area = (bx - ax) * (cz - az) - (cx - ax) * (bz - az);
    if (Math.abs(area) < 1e-9) continue;
    for (let pz = z0; pz <= z1; pz++) for (let px = x0; px <= x1; px++) {
      const qx = px + 0.5, qz = pz + 0.5;
      const w0 = ((bx - qx) * (cz - qz) - (cx - qx) * (bz - qz)) / area;
      const w1 = ((cx - qx) * (az - qz) - (ax - qx) * (cz - qz)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
      const y = w0 * ay + w1 * by + w2 * cy;
      const at = pz * width + px;
      if (y > field[at]!) field[at] = y;
    }
  }
  return field;
}

// Fills non-walkable pixels from their nearest walkable neighbour, so walls and rock beside
// a path cut at that path's height.
function fillNearest(field: Float32Array, width: number, height: number): Float32Array {
  const out = Float32Array.from(field);
  const queue = new Int32Array(out.length);
  let tail = 0;
  for (let i = 0; i < out.length; i++) if (Number.isFinite(out[i]!)) queue[tail++] = i;
  for (let head = 0; head < tail; head++) {
    const i = queue[head]!;
    const x = i % width;
    const y = out[i]!;
    if (x > 0 && !Number.isFinite(out[i - 1]!)) { out[i - 1] = y; queue[tail++] = i - 1; }
    if (x < width - 1 && !Number.isFinite(out[i + 1]!)) { out[i + 1] = y; queue[tail++] = i + 1; }
    if (i >= width && !Number.isFinite(out[i - width]!)) { out[i - width] = y; queue[tail++] = i - width; }
    if (i + width < out.length && !Number.isFinite(out[i + width]!)) { out[i + width] = y; queue[tail++] = i + width; }
  }
  return out;
}

// Derives the tile's cut: its walkable range, the slice heights that cover it, and the
// camera height above the highest slice. Returns null when nothing walkable lies under the tile.
export function planTileCut(tile: CaptureTile, plan: CapturePlan, survey: NavigationSurvey): CutPlan | null {
  const cut = plan.cut;
  if (cut === undefined) return null;
  const raw = walkableHeightField(tile, plan.width, plan.height, survey);
  let minY = Number.POSITIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY, walkable = 0;
  for (const y of raw) { if (!Number.isFinite(y)) continue; walkable++; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  if (walkable === 0) return null;
  const field = fillNearest(raw, plan.width, plan.height);
  // Only the slice levels some pixel selects are rendered: each pixel wants the first step
  // boundary at or above its surface plus headroom, so the set of those boundaries is the
  // set of slices, which is far fewer than every step across the range on a stepped surface.
  const levels = new Set<number>();
  for (const y of field) levels.add(Math.ceil((y + cut.headroom) / cut.step) * cut.step);
  const cutHeights = [...levels].sort((left, right) => left - right).map(height => Number(height.toFixed(3)));
  return {
    evidence: { source: "navigation", surveySha256: cut.survey.sha256, step: cut.step, headroom: cut.headroom, walkable: { minY, maxY, coverage: walkable / raw.length }, cutHeights },
    field,
    cameraY: cutHeights[cutHeights.length - 1]! + cut.cameraAbove,
  };
}

// The camera frame a tile renders with: its declared frame, or the cut frame above the highest
// slice with a far plane that still reaches the tile's declared lower bound.
export function cutCaptureFrame(tile: CaptureTile, cutPlan: CutPlan | null): CaptureTile["frame"] {
  if (cutPlan === null) return tile.frame;
  const lowerBound = tile.frame.cameraY - tile.frame.farClip;
  return { ...tile.frame, cameraY: cutPlan.cameraY, farClip: cutPlan.cameraY - lowerBound };
}

// Selects, per pixel, the first slice whose cut sits at or above the walkable height plus
// headroom. Slices arrive in Unity's bottom-up row order while the field is top-left, so the
// field row is mirrored; the result keeps the slices' order and is flipped once at encoding.
export function composeCut(slices: readonly Buffer[], cutHeights: readonly number[], cutPlan: CutPlan, width: number, height: number): { rgba: Buffer; sliceUse: number[] } {
  if (slices.length !== cutHeights.length) throw new Error("Cut slices and cut heights disagree.");
  const out = Buffer.alloc(width * height * 4);
  const sliceUse = new Array<number>(slices.length).fill(0);
  const headroom = cutPlan.evidence.headroom;
  for (let row = 0; row < height; row++) {
    const fieldRow = height - 1 - row;
    for (let column = 0; column < width; column++) {
      const target = cutPlan.field[fieldRow * width + column]! + headroom;
      let pick = slices.length - 1;
      for (let s = 0; s < cutHeights.length; s++) if (cutHeights[s]! >= target) { pick = s; break; }
      sliceUse[pick]!++;
      const at = (row * width + column) * 4;
      slices[pick]!.copy(out, at, at, at + 4);
    }
  }
  return { rgba: out, sliceUse };
}

// Reads the probe's raw RGBA slices, verifies each against the hash the probe reported,
// composes the cut, and encodes the tile PNG. Unity's ReadPixels stores row zero at the
// bottom, so the composite is flipped to the top-left pixel convention the raster declares.
export async function compositeRawSlices(slicePaths: readonly string[], reported: readonly { index: number; cut: number; sha256: string; byteSize: number }[], cutPlan: CutPlan | null, width: number, height: number, tileId: string): Promise<Buffer> {
  if (slicePaths.length !== reported.length) throw new Error(`Capture tile "${tileId}" slice paths and reports disagree.`);
  const expectedBytes = width * height * 4;
  const slices = await Promise.all(slicePaths.map(async (path, index) => {
    const bytes = await readFile(path);
    const report = reported[index]!;
    if (bytes.byteLength !== expectedBytes || bytes.byteLength !== report.byteSize) throw new Error(`Capture slice ${report.index} for tile "${tileId}" has an unexpected byte count.`);
    if (createHash("sha256").update(bytes).digest("hex") !== report.sha256) throw new Error(`Capture slice ${report.index} for tile "${tileId}" does not match its reported hash.`);
    return bytes;
  }));
  const rgba = cutPlan === null ? slices[0]! : composeCut(slices, reported.map(slice => slice.cut), cutPlan, width, height).rgba;
  return sharp(rgba, { raw: { width, height, channels: 4 } }).flip().png().toBuffer();
}

export type CapturePosition = { x: number; y: number; z: number };

// The walkable point nearest the plan's horizontal centre. Standing there keeps every source of
// the map resident, so the scene is static for capture.
export function capturePositionFor(plan: CapturePlan, survey: NavigationSurvey): CapturePosition {
  return walkablePointNearest(planBox(plan), survey, "capture plan");
}

// The walkable point nearest a tile's centre. The game hides a terrain's objects unless the player
// stands inside that terrain, so a map spanning several terrains stands the player at each tile.
export function tileCapturePositionFor(tile: CapturePlan["tiles"][number], plan: CapturePlan, survey: NavigationSurvey, target?: { x: number; z: number }): CapturePosition {
  const half = { x: tile.frame.worldSize.x / 2, z: tile.frame.worldSize.z / 2 };
  const tileBox = { minX: tile.frame.center.x - half.x, maxX: tile.frame.center.x + half.x, minZ: tile.frame.center.z - half.z, maxZ: tile.frame.center.z + half.z };
  const aim = target ?? { x: tile.frame.center.x, z: tile.frame.center.z };
  try {
    return walkablePointNearest(tileBox, survey, `tile ${tile.id}`, aim);
  } catch {
    // A tile with no walkable surface of its own stands at the map's walkable point nearest it.
    return walkablePointNearest(planBox(plan), survey, "capture plan", aim);
  }
}

function planBox(plan: CapturePlan): { minX: number; maxX: number; minZ: number; maxZ: number } {
  return {
    minX: Math.min(...plan.tiles.map(tile => tile.frame.center.x - tile.frame.worldSize.x / 2)),
    maxX: Math.max(...plan.tiles.map(tile => tile.frame.center.x + tile.frame.worldSize.x / 2)),
    minZ: Math.min(...plan.tiles.map(tile => tile.frame.center.z - tile.frame.worldSize.z / 2)),
    maxZ: Math.max(...plan.tiles.map(tile => tile.frame.center.z + tile.frame.worldSize.z / 2)),
  };
}

function walkablePointNearest(box: { minX: number; maxX: number; minZ: number; maxZ: number }, survey: NavigationSurvey, label: string, target?: { x: number; z: number }): CapturePosition {
  const centerX = target?.x ?? (box.minX + box.maxX) / 2, centerZ = target?.z ?? (box.minZ + box.maxZ) / 2;
  const v = survey.vertices;
  let best = -1, bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 2 < v.length; i += 3) {
    const x = v[i]!, z = v[i + 2]!;
    if (x < box.minX || x > box.maxX || z < box.minZ || z > box.maxZ) continue;
    const distance = (x - centerX) ** 2 + (z - centerZ) ** 2;
    if (distance < bestDistance) { bestDistance = distance; best = i; }
  }
  if (best < 0) throw new Error(`The navigation survey has no walkable vertex inside the ${label}.`);
  return { x: v[best]!, y: v[best + 1]!, z: v[best + 2]! };
}
