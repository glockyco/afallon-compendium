import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import type { CapturePlan, CaptureSurvey } from "@afallon/contracts"
import { tileBounds } from "./capture-geometry";

export type NavigationSurvey = { vertices: number[]; indices: number[]; scene: { nativeId: number } };

export async function loadNavigationSurvey(path: string, survey: CaptureSurvey, sceneNativeId: number): Promise<NavigationSurvey> {
  const bytes = await readFile(path);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== survey.sha256) throw new Error("Capture survey hash does not match its plan.");
  const value = JSON.parse(bytes.toString("utf8")) as NavigationSurvey;
  if (!Array.isArray(value.vertices) || !Array.isArray(value.indices) || value.scene?.nativeId !== sceneNativeId) throw new Error("Capture survey does not describe the plan's scene.");
  return value;
}

// Reads the probe's raw RGBA frame, verifies it against the hash the probe reported, and encodes
// the tile PNG. Unity's ReadPixels stores row zero at the bottom, so the frame is flipped to the
// top-left pixel convention the raster declares.
export async function encodeRawFrame(path: string, reported: { sha256: string; byteSize: number }, width: number, height: number, tileId: string): Promise<Buffer> {
  const bytes = await readFile(path);
  if (bytes.byteLength !== width * height * 4 || bytes.byteLength !== reported.byteSize) throw new Error(`Capture frame for tile "${tileId}" has an unexpected byte count.`);
  if (createHash("sha256").update(bytes).digest("hex") !== reported.sha256) throw new Error(`Capture frame for tile "${tileId}" does not match its reported hash.`);
  return sharp(bytes, { raw: { width, height, channels: 4 } }).flip().png().toBuffer();
}

export type CapturePosition = { x: number; y: number; z: number };

// The walkable point nearest the centre of the plan's standing box: the box the plan declares,
// which does not change when its tile set changes, or else the tiles' extent.
export function capturePositionFor(plan: CapturePlan, survey: NavigationSurvey): CapturePosition {
  return walkablePointNearest(plan.standing ?? tileBounds(plan.tiles), survey, "capture plan standing box");
}

function walkablePointNearest(box: { minX: number; maxX: number; minZ: number; maxZ: number }, survey: NavigationSurvey, label: string): CapturePosition {
  const centerX = (box.minX + box.maxX) / 2, centerZ = (box.minZ + box.maxZ) / 2;
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
