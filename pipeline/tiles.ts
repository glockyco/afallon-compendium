import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import sharp from "sharp";
import { beginRun } from "../tools/runs";
import { toolRevision } from "../tools/build";
import { loadTileInputs, type SourceTile } from "./tile-input";
import { affineAt, makeTileGrid, type GridSource, type TileGrid } from "./tile-grid";
import type { TileAffine, TileBounds, TileCoverage, TileFile, TileGenerationResult, TileLevel, TilePyramid } from "./tile-contracts";

const DEFAULT_TILE_SIZE = 256;
const CHANNELS = 4;

type DecodedSource = {
  data: Uint8Array;
};

type CellAccumulator = {
  covered: boolean;
  captured: boolean;
  empty: boolean;
  sourceCount: number;
  firstR: number;
  firstG: number;
  firstB: number;
  firstA: number;
  redPremultiplied: number;
  greenPremultiplied: number;
  bluePremultiplied: number;
  alphaSum: number;
  localX: number;
  localY: number;
};

type TileBuffer = {
  data: Buffer;
  coverage: TileCoverage;
};

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function tileState(coveredPixels: number, emptyPixels: number, missingPixels: number, pixelCount: number, capturedPixels: number): TileCoverage["state"] {
  if (missingPixels === pixelCount) return "missing";
  if (emptyPixels === pixelCount) return "empty";
  if (missingPixels !== 0 || emptyPixels !== 0 || capturedPixels !== coveredPixels) return "partial";
  return "captured";
}

function resetCell(cell: CellAccumulator): void {
  cell.covered = false;
  cell.captured = false;
  cell.empty = false;
  cell.sourceCount = 0;
  cell.firstR = 0;
  cell.firstG = 0;
  cell.firstB = 0;
  cell.firstA = 0;
  cell.redPremultiplied = 0;
  cell.greenPremultiplied = 0;
  cell.bluePremultiplied = 0;
  cell.alphaSum = 0;
}

function accumulatePixel(decodedByPath: ReadonlyMap<string, DecodedSource>, candidates: readonly GridSource[], globalX: number, globalY: number, cell: CellAccumulator, sourceTileIds: Set<string>): void {
  resetCell(cell);
  for (const candidate of candidates) {
    const dx = globalX + 0.5 - candidate.originX;
    const dy = globalY + 0.5 - candidate.originY;
    cell.localX = Math.floor(candidate.inverseMatrix.a * dx + candidate.inverseMatrix.b * dy);
    cell.localY = Math.floor(candidate.inverseMatrix.c * dx + candidate.inverseMatrix.d * dy);
    if (cell.localX < 0 || cell.localX >= candidate.tile.width || cell.localY < 0 || cell.localY >= candidate.tile.height) continue;
    const decodedSource = decodedByPath.get(candidate.tile.imagePath);
    if (decodedSource === undefined) throw new Error(`Tile generation failed: decoded image disappeared for ${candidate.tile.id}`);
    const offset = (cell.localY * candidate.tile.width + cell.localX) * CHANNELS;
    const red = decodedSource.data[offset]!;
    const green = decodedSource.data[offset + 1]!;
    const blue = decodedSource.data[offset + 2]!;
    const alpha = decodedSource.data[offset + 3]!;
    if (cell.covered && (cell.firstR !== red || cell.firstG !== green || cell.firstB !== blue || cell.firstA !== alpha)) {
      throw new Error(`Tile generation rejected: contradictory pixels at finest grid edge (${globalX},${globalY}) in capture tile ${candidate.tile.id}`);
    }
    if (!cell.covered) {
      cell.firstR = red;
      cell.firstG = green;
      cell.firstB = blue;
      cell.firstA = alpha;
    }
    cell.covered = true;
    cell.sourceCount++;
    if (candidate.tile.empty) cell.empty = true;
    else cell.captured = true;
    cell.redPremultiplied += red * alpha;
    cell.greenPremultiplied += green * alpha;
    cell.bluePremultiplied += blue * alpha;
    cell.alphaSum += alpha;
    sourceTileIds.add(candidate.tile.id);
  }
}

function composeTile(grid: TileGrid, decodedByPath: ReadonlyMap<string, DecodedSource>, level: number, finestLevel: number, tileX: number, tileY: number, tileSize: number): TileBuffer {
  const scale = 2 ** (finestLevel - level);
  const levelWidth = Math.ceil(grid.width / scale);
  const levelHeight = Math.ceil(grid.height / scale);
  const width = Math.min(tileSize, levelWidth - tileX * tileSize);
  const height = Math.min(tileSize, levelHeight - tileY * tileSize);
  const data = Buffer.alloc(width * height * CHANNELS);
  const tileMinX = grid.minX + tileX * tileSize * scale;
  const tileMinY = grid.minY + tileY * tileSize * scale;
  const tileMaxX = Math.min(grid.maxX, tileMinX + width * scale);
  const tileMaxY = Math.min(grid.maxY, tileMinY + height * scale);
  const candidates = grid.sources.filter(source => source.maxX > tileMinX && source.minX < tileMaxX && source.maxY > tileMinY && source.minY < tileMaxY);
  let coveredPixels = 0;
  let emptyPixels = 0;
  let missingPixels = 0;
  let capturedPixels = 0;
  const sourceTileIds = new Set<string>();
  const cell: CellAccumulator = { covered: false, captured: false, empty: false, sourceCount: 0, firstR: 0, firstG: 0, firstB: 0, firstA: 0, redPremultiplied: 0, greenPremultiplied: 0, bluePremultiplied: 0, alphaSum: 0, localX: 0, localY: 0 };
  for (let outputY = 0; outputY < height; outputY++) {
    for (let outputX = 0; outputX < width; outputX++) {
      let sampleCount = 0;
      let redPremultiplied = 0;
      let greenPremultiplied = 0;
      let bluePremultiplied = 0;
      let alphaSum = 0;
      let coveredSamples = 0;
      let capturedSamples = 0;
      let emptySamples = 0;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const globalX = tileMinX + outputX * scale + dx;
          const globalY = tileMinY + outputY * scale + dy;
          if (globalX >= grid.maxX || globalY >= grid.maxY) continue;
          sampleCount++;
          accumulatePixel(decodedByPath, candidates, globalX, globalY, cell, sourceTileIds);
          if (!cell.covered) continue;
          coveredSamples++;
          if (cell.captured) capturedSamples++;
          if (cell.empty && !cell.captured) emptySamples++;
          redPremultiplied += cell.redPremultiplied;
          greenPremultiplied += cell.greenPremultiplied;
          bluePremultiplied += cell.bluePremultiplied;
          alphaSum += cell.alphaSum;
        }
      }
      const pixelOffset = (outputY * width + outputX) * CHANNELS;
      if (coveredSamples === 0) {
        missingPixels++;
        data[pixelOffset + 3] = 0;
        continue;
      }
      coveredPixels++;
      if (emptySamples === coveredSamples) emptyPixels++;
      if (capturedSamples > 0) capturedPixels++;
      if (sampleCount !== coveredSamples) missingPixels++;
      data[pixelOffset] = alphaSum > 0 ? Math.round(redPremultiplied / alphaSum) : 0;
      data[pixelOffset + 1] = alphaSum > 0 ? Math.round(greenPremultiplied / alphaSum) : 0;
      data[pixelOffset + 2] = alphaSum > 0 ? Math.round(bluePremultiplied / alphaSum) : 0;
      data[pixelOffset + 3] = Math.round(alphaSum / sampleCount);
    }
  }
  const coverage: TileCoverage = {
    state: tileState(coveredPixels, emptyPixels, missingPixels, width * height, capturedPixels),
    coveredPixels,
    emptyPixels,
    missingPixels,
    sourceTileIds: [...sourceTileIds].sort(),
  };
  return { data, coverage };
}

async function decodeSources(grid: TileGrid): Promise<ReadonlyMap<string, DecodedSource>> {
  const decodedByPath = new Map<string, DecodedSource>();
  for (const source of grid.sources) {
    if (decodedByPath.has(source.tile.imagePath)) continue;
    const result = await sharp(source.tile.imageBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (result.info.width !== source.tile.width || result.info.height !== source.tile.height || result.info.channels !== CHANNELS) {
      throw new Error(`Tile generation rejected: decoded image dimensions/channels contradict capture raster for ${source.tile.id}`);
    }
    decodedByPath.set(source.tile.imagePath, { data: result.data });
  }
  return decodedByPath;
}

async function encodeTileWithDimensions(tile: TileBuffer, width: number, height: number): Promise<Buffer> {
  return sharp(tile.data, { raw: { width, height, channels: CHANNELS } }).webp({ lossless: true }).toBuffer();
}

function sourceTileKey(tile: SourceTile): string {
  return `${tile.sourcePath}/${tile.id}`;
}

async function tileImplementationHash(): Promise<string> {
  const hash = createHash("sha256");
  for (const fileName of ["../package.json", "../bun.lock", "../tools/runs.ts", "../tools/cli.ts", "tile-contracts.ts", "tile-input.ts", "tile-grid.ts", "tiles.ts"]) {
    const bytes = await Bun.file(resolve(import.meta.dir, fileName)).bytes();
    hash.update(fileName).update("\0").update(String(bytes.byteLength)).update("\0").update(bytes);
  }
  return hash.digest("hex");
}

function relativeArtifact(runDirectory: string, path: string): string {
  return relative(runDirectory, path).split("\\").join("/");
}

function affineBounds(affine: TileAffine, width: number, height: number): TileBounds {
  const corners = [
    affine.origin,
    { x: affine.origin.x + affine.xAxis.x * width, y: affine.origin.y + affine.xAxis.y * width },
    { x: affine.origin.x + affine.yAxis.x * height, y: affine.origin.y + affine.yAxis.y * height },
    { x: affine.origin.x + affine.xAxis.x * width + affine.yAxis.x * height, y: affine.origin.y + affine.xAxis.y * width + affine.yAxis.y * height },
  ];
  const minX = Math.min(...corners.map(corner => corner.x));
  const minY = Math.min(...corners.map(corner => corner.y));
  const maxX = Math.max(...corners.map(corner => corner.x));
  const maxY = Math.max(...corners.map(corner => corner.y));
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY }, width: maxX - minX, height: maxY - minY };
}

async function generatePyramid(planPath: string, outputRoot: string): Promise<TileGenerationResult> {
  const inputs = await loadTileInputs(planPath);
  const grid = makeTileGrid(inputs);
  const tileSize = inputs.plan.tileSize ?? DEFAULT_TILE_SIZE;
  if (!Number.isInteger(tileSize) || tileSize < 1 || tileSize > 2048) throw new Error("Tile generation rejected: tileSize must be between 1 and 2048");
  let finestLevel = 0;
  while (Math.ceil(grid.width / (2 ** finestLevel)) > tileSize || Math.ceil(grid.height / (2 ** finestLevel)) > tileSize) finestLevel++;
  const inputHashes: Record<string, string> = { plan: inputs.planSha256, "map-space-profile": inputs.profileRef.sha256, "tool:tile-implementation": await tileImplementationHash() };
  inputs.sources.forEach((source, index) => {
    inputHashes[`source-manifest:${index}`] = source.sourceSha256;
    inputHashes[`capture-set:${index}`] = source.captureSetSha256;
    for (const tile of source.tiles) {
      inputHashes[`capture-image:${sourceTileKey(tile)}`] = tile.image.sha256;
      inputHashes[`capture-raster:${sourceTileKey(tile)}`] = tile.raster.sha256;
      inputHashes[`capture-readiness:${sourceTileKey(tile)}`] = tile.readiness.sha256;
      inputHashes[`capture-restoration:${sourceTileKey(tile)}`] = tile.restoration.sha256;
      tile.nativeContext.forEach((context, contextIndex) => {
        inputHashes[`capture-context:${sourceTileKey(tile)}:${contextIndex}`] = context.sha256;
      });
    }
  });
  const run = await beginRun(outputRoot, {
    buildId: inputs.plan.buildId,
    toolRevision: await toolRevision(),
    command: "tiles",
    settings: {
      planPath: inputs.planPath,
      mapSpaceId: inputs.plan.mapSpaceId,
      tileSize,
      zoomConvention: "coarsest-zero-finest-max",
      sourceCount: inputs.sources.length,
    },
    inputHashes,
  });
  try {
    await mkdir(resolve(run.directory, "inputs"), { recursive: true });
    await Bun.write(resolve(run.directory, "inputs/plan.json"), await Bun.file(inputs.planPath).bytes());
    await Bun.write(resolve(run.directory, "inputs/map-space-profile.json"), await Bun.file(inputs.profilePath).bytes());
    await run.addArtifact("inputs/plan.json");
    await run.addArtifact("inputs/map-space-profile.json");
    const decodedByPath = await decodeSources(grid);
    const levels: TileLevel[] = [];
    const emittedFiles: TileFile[] = [];
    const missingPositions: Array<{ z: number; x: number; y: number }> = [];
    const emptyPositions: Array<{ z: number; x: number; y: number }> = [];
    const partialPositions: Array<{ z: number; x: number; y: number }> = [];
    let totalBytes = 0;
    for (let level = 0; level <= finestLevel; level++) {
      const scale = 2 ** (finestLevel - level);
      const width = Math.ceil(grid.width / scale);
      const height = Math.ceil(grid.height / scale);
      const columns = Math.ceil(width / tileSize);
      const rows = Math.ceil(height / tileSize);
      const tiles: TileFile[] = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const outputWidth = Math.min(tileSize, width - x * tileSize);
          const outputHeight = Math.min(tileSize, height - y * tileSize);
          const tile = composeTile(grid, decodedByPath, level, finestLevel, x, y, tileSize);
          if (tile.coverage.state === "missing") {
            missingPositions.push({ z: level, x, y });
            continue;
          }
          if (tile.coverage.state === "empty") emptyPositions.push({ z: level, x, y });
          if (tile.coverage.state === "partial") partialPositions.push({ z: level, x, y });
          const webp = await encodeTileWithDimensions(tile, outputWidth, outputHeight);
          const sha256 = createHash("sha256").update(webp).digest("hex");
          const path = `tiles/${level}/${x}/${y}.${sha256}.webp`;
          await mkdir(dirname(resolve(run.directory, path)), { recursive: true });
          await Bun.write(resolve(run.directory, path), webp);
          const affine = affineAt(grid, grid.minX + x * tileSize * scale, grid.minY + y * tileSize * scale, scale);
          const file: TileFile = { z: level, x, y, width: outputWidth, height: outputHeight, mapFromPixelEdge: affine, bounds: affineBounds(affine, outputWidth, outputHeight), coverage: tile.coverage, path, bytes: webp.byteLength, sha256, mediaType: "image/webp" };
          tiles.push(file);
          emittedFiles.push(file);
          totalBytes += webp.byteLength;
          await run.addArtifact(path);
        }
      }
      levels.push({ z: level, scale, pixelSize: { x: grid.pixelSize.x * scale, y: grid.pixelSize.y * scale }, width, height, columns, rows, tiles });
    }
    const coverageReasons: string[] = [];
    if (inputs.sources.some(source => source.captureSet.completeImagery === false)) coverageReasons.push("source capture sets declare incomplete imagery coverage");
    if (missingPositions.length > 0) coverageReasons.push(`${missingPositions.length} delivery tile positions have no capture coverage`);
    if (partialPositions.length > 0) coverageReasons.push("partial delivery tiles retain missing pixel coverage");
    const pyramid: TilePyramid = {
      schemaVersion: "compendium.tile-pyramid.v2",
      buildId: inputs.plan.buildId,
      mapSpaceId: inputs.plan.mapSpaceId,
      plan: { path: relativeArtifact(run.directory, resolve(run.directory, "inputs/plan.json")), sha256: inputs.planSha256 },
      profile: { path: relativeArtifact(run.directory, resolve(run.directory, "inputs/map-space-profile.json")), sha256: inputs.profileRef.sha256 },
      coordinateSystem: "map-space-xy",
      pixelConvention: "top-left-edges",
      grid: { origin: grid.origin, xAxis: grid.xAxis, yAxis: grid.yAxis, pixelSize: grid.pixelSize },
      mapFromPixelEdge: { origin: grid.origin, xAxis: grid.xAxis, yAxis: grid.yAxis },
      bounds: grid.bounds,
      finestLevel,
      coarsestLevel: 0,
      zoomConvention: "coarsest-zero-finest-max",
      format: "webp-lossless",
      tileSize,
      levels,
      sources: inputs.provenance,
      coverage: {
        complete: false,
        blocker: coverageReasons.length > 0,
        reasons: coverageReasons,
        missingPositions,
        emptyPositions,
        partialPositions,
      },
      totals: { files: emittedFiles.length, bytes: totalBytes },
    };
    const indexPath = resolve(run.directory, "tile-index.json");
    await Bun.write(indexPath, stableJson(pyramid));
    await run.addArtifact("tile-index.json");
    await run.succeed();
    return { manifest: run.manifestPath, index: indexPath, files: pyramid.totals.files, bytes: pyramid.totals.bytes, complete: pyramid.coverage.complete };
  } catch (error) {
    await run.fail(error);
    throw error;
  }
}

export async function generateTiles(planPath: string, outputRoot: string): Promise<TileGenerationResult> {
  return generatePyramid(resolve(planPath), resolve(outputRoot));
}
