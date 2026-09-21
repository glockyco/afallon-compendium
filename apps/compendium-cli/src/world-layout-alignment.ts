import { resolve } from "node:path";
import { Assert } from "typebox/value";
import { replaceFileAtomically } from "@afallon/artifacts";
import { WorldOffsetsSchema, type WorldOffsets } from "@afallon/contracts";
import {
  PublicationPresentationSchema,
  StaticRootManifestSchema,
  type PublicationPresentation,
  type StaticRootManifest,
} from "@afallon/contracts/public";

const CORNERS = ["topLeft", "topRight", "bottomRight", "bottomLeft"] as const;
const SIDES = ["top", "right", "bottom", "left"] as const;
type Corner = typeof CORNERS[number];
type Side = typeof SIDES[number];
type Point = { x: number; y: number };

export interface WorldLayoutAlignmentOptions {
  halfWidth?: number;
  halfHeight?: number;
}

export interface WorldLayoutAlignment {
  presentation: PublicationPresentation;
  centerMapSpaceId: string;
  halfWidth: number;
  halfHeight: number;
  corners: Record<Corner, string>;
  sides: Record<Side, string[]>;
}

function uniqueByMapSpaceId<T extends { mapSpaceId: string }>(values: readonly T[], subject: string): Map<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    if (result.has(value.mapSpaceId)) throw new Error(`${subject} repeats map space ${value.mapSpaceId}.`);
    result.set(value.mapSpaceId, value);
  }
  return result;
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function cornerSigns(corner: Corner): Point {
  if (corner === "topLeft") return { x: -1, y: 1 };
  if (corner === "topRight") return { x: 1, y: 1 };
  if (corner === "bottomRight") return { x: 1, y: -1 };
  return { x: -1, y: -1 };
}

function assignCorners(centers: ReadonlyMap<string, Point>, halfWidth: number, halfHeight: number): Record<Corner, string> {
  const entries = [...centers];
  if (entries.length < CORNERS.length) throw new Error("World layout needs at least four maps around the center map.");
  let bestScore = Number.NEGATIVE_INFINITY;
  let best: string[] | null = null;
  const visit = (index: number, used: Set<string>, score: number, selected: string[]): void => {
    if (index === CORNERS.length) {
      if (score > bestScore) { bestScore = score; best = [...selected]; }
      return;
    }
    const signs = cornerSigns(CORNERS[index]!);
    for (const [mapSpaceId, center] of entries) {
      if (used.has(mapSpaceId)) continue;
      used.add(mapSpaceId);
      selected.push(mapSpaceId);
      visit(index + 1, used, score + signs.x * center.x / halfWidth + signs.y * center.y / halfHeight, selected);
      selected.pop();
      used.delete(mapSpaceId);
    }
  };
  visit(0, new Set(), 0, []);
  if (!best) throw new Error("World layout corner assignment failed.");
  return Object.fromEntries(CORNERS.map((corner, index) => [corner, best![index]!])) as Record<Corner, string>;
}

function classifySide(center: Point, halfWidth: number, halfHeight: number): Side {
  const distances: Array<readonly [Side, number]> = [
    ["top", Math.abs(center.y / halfHeight - 1)],
    ["right", Math.abs(center.x / halfWidth - 1)],
    ["bottom", Math.abs(center.y / halfHeight + 1)],
    ["left", Math.abs(center.x / halfWidth + 1)],
  ];
  distances.sort((left, right) => left[1] - right[1]);
  if (Math.abs(distances[0]![1] - distances[1]![1]) < 1e-9) throw new Error("A map is equally close to two layout sides. Move it closer to the intended side and export the offsets again.");
  return distances[0]![0];
}

function targetOnSide(side: Side, index: number, count: number, halfWidth: number, halfHeight: number): Point {
  const ratio = (index + 1) / (count + 1);
  if (side === "top") return { x: -halfWidth + 2 * halfWidth * ratio, y: halfHeight };
  if (side === "bottom") return { x: -halfWidth + 2 * halfWidth * ratio, y: -halfHeight };
  if (side === "left") return { x: -halfWidth, y: halfHeight - 2 * halfHeight * ratio };
  return { x: halfWidth, y: halfHeight - 2 * halfHeight * ratio };
}

export function alignWorldLayout(
  presentation: PublicationPresentation,
  reviewed: WorldOffsets,
  publication: StaticRootManifest,
  options: WorldLayoutAlignmentOptions = {},
): WorldLayoutAlignment {
  const halfWidth = options.halfWidth ?? 2432;
  const halfHeight = options.halfHeight ?? 2304;
  if (!Number.isFinite(halfWidth) || halfWidth <= 0 || !Number.isFinite(halfHeight) || halfHeight <= 0) throw new Error("Layout half-width and half-height must be positive finite numbers.");
  if (presentation.buildId !== reviewed.buildId || presentation.buildId !== publication.buildId) throw new Error("Layout inputs belong to different builds.");
  if (presentation.catalogId !== publication.catalogId) throw new Error("Presentation and publication catalog identities differ.");

  const presentationOffsets = uniqueByMapSpaceId(presentation.worldOffsets, "Presentation offsets");
  const reviewedOffsets = uniqueByMapSpaceId(reviewed.offsets, "Reviewed offsets");
  const publicationOffsets = uniqueByMapSpaceId(publication.world.offsets, "Publication offsets");
  const maps = uniqueByMapSpaceId(publication.maps, "Publication maps");
  const centerOffsets = presentation.worldOffsets.filter((offset) => offset.source === "native" && offset.status === "placed");
  if (centerOffsets.length !== 1) throw new Error("Presentation must have one placed native center map.");
  const centerMapSpaceId = centerOffsets[0]!.mapSpaceId;
  if (!maps.has(centerMapSpaceId)) throw new Error(`Publication omits center map ${centerMapSpaceId}.`);

  const expectedIds = new Set(maps.keys());
  for (const [subject, values] of [["presentation", presentationOffsets], ["reviewed export", reviewedOffsets], ["publication", publicationOffsets]] as const) {
    const missing = [...expectedIds].filter((mapSpaceId) => !values.has(mapSpaceId));
    const extra = [...values.keys()].filter((mapSpaceId) => !expectedIds.has(mapSpaceId));
    if (missing.length > 0 || extra.length > 0) throw new Error(`${subject} map spaces differ from the publication: missing [${missing.join(", ")}], extra [${extra.join(", ")}].`);
  }

  const localCenters = new Map<string, Point>();
  for (const [mapSpaceId, map] of maps) {
    const offset = publicationOffsets.get(mapSpaceId)!;
    localCenters.set(mapSpaceId, {
      x: (map.bounds.min.x + map.bounds.max.x) / 2 - offset.worldX,
      y: (map.bounds.min.y + map.bounds.max.y) / 2 - offset.worldY,
    });
  }
  const reviewedCenterOffset = reviewedOffsets.get(centerMapSpaceId)!;
  const centerLocal = localCenters.get(centerMapSpaceId)!;
  const worldCenter = { x: centerLocal.x + reviewedCenterOffset.worldX, y: centerLocal.y + reviewedCenterOffset.worldY };
  const relativeCenters = new Map<string, Point>();
  for (const [mapSpaceId, offset] of reviewedOffsets) {
    if (mapSpaceId === centerMapSpaceId) continue;
    const local = localCenters.get(mapSpaceId)!;
    relativeCenters.set(mapSpaceId, { x: local.x + offset.worldX - worldCenter.x, y: local.y + offset.worldY - worldCenter.y });
  }

  const corners = assignCorners(relativeCenters, halfWidth, halfHeight);
  const cornerIds = new Set(Object.values(corners));
  const sides: Record<Side, string[]> = { top: [], right: [], bottom: [], left: [] };
  for (const [mapSpaceId, center] of relativeCenters) {
    if (!cornerIds.has(mapSpaceId)) sides[classifySide(center, halfWidth, halfHeight)].push(mapSpaceId);
  }
  sides.top.sort((left, right) => relativeCenters.get(left)!.x - relativeCenters.get(right)!.x);
  sides.bottom.sort((left, right) => relativeCenters.get(left)!.x - relativeCenters.get(right)!.x);
  sides.left.sort((left, right) => relativeCenters.get(right)!.y - relativeCenters.get(left)!.y);
  sides.right.sort((left, right) => relativeCenters.get(right)!.y - relativeCenters.get(left)!.y);

  const targets = new Map<string, Point>([
    [corners.topLeft, { x: -halfWidth, y: halfHeight }],
    [corners.topRight, { x: halfWidth, y: halfHeight }],
    [corners.bottomRight, { x: halfWidth, y: -halfHeight }],
    [corners.bottomLeft, { x: -halfWidth, y: -halfHeight }],
  ]);
  for (const side of SIDES) sides[side].forEach((mapSpaceId, index) => targets.set(mapSpaceId, targetOnSide(side, index, sides[side].length, halfWidth, halfHeight)));

  const worldOffsets = presentation.worldOffsets.map((offset) => {
    if (offset.mapSpaceId === centerMapSpaceId) return { ...offset, worldX: reviewedCenterOffset.worldX, worldY: reviewedCenterOffset.worldY };
    const target = targets.get(offset.mapSpaceId)!;
    const local = localCenters.get(offset.mapSpaceId)!;
    return { ...offset, worldX: rounded(worldCenter.x + target.x - local.x), worldY: rounded(worldCenter.y + target.y - local.y) };
  });
  const aligned = { ...presentation, worldOffsets };
  Assert(PublicationPresentationSchema, aligned);
  return { presentation: aligned, centerMapSpaceId, halfWidth, halfHeight, corners, sides };
}

export async function alignWorldLayoutFiles(options: {
  presentationPath: string;
  reviewedOffsetsPath: string;
  publicationRoot: string;
  outputPath: string;
  halfWidth?: number;
  halfHeight?: number;
}): Promise<Omit<WorldLayoutAlignment, "presentation"> & { outputPath: string }> {
  const presentation: unknown = await Bun.file(options.presentationPath).json();
  const reviewed: unknown = await Bun.file(options.reviewedOffsetsPath).json();
  const publication: unknown = await Bun.file(resolve(options.publicationRoot, "publication.json")).json();
  Assert(PublicationPresentationSchema, presentation);
  Assert(WorldOffsetsSchema, reviewed);
  Assert(StaticRootManifestSchema, publication);
  const aligned = alignWorldLayout(presentation, reviewed, publication, options);
  const outputPath = resolve(options.outputPath);
  await replaceFileAtomically(outputPath, `${JSON.stringify(aligned.presentation, null, 2)}\n`);
  return { outputPath, centerMapSpaceId: aligned.centerMapSpaceId, halfWidth: aligned.halfWidth, halfHeight: aligned.halfHeight, corners: aligned.corners, sides: aligned.sides };
}
