import { resolve } from "node:path";
import sharp from "sharp";
import { ArtifactStore, beginArtifactRun, createArtifactLease, fingerprintStep, selectLatestSuccess } from "@afallon/artifacts";
import { Assert } from "typebox/value";
import { canonicalJson, schemaRegistry, TilePlanSchema, TilePyramidSchema, type ContentIdentity, type TilePlan } from "@afallon/contracts";
import { CatalogImagerySchema } from "@afallon/contracts/catalog";
import { randomUUID } from "node:crypto";
import { loadTileInputs } from "./tile-input";
import { makeTileGrid, type GridSource, type TileGrid } from "./tile-grid";
import type { TileCoverage, TileFile, TileGenerationResult, TileLevel, TilePyramid } from "@afallon/contracts"

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
  redPremultiplied: number;
  greenPremultiplied: number;
  bluePremultiplied: number;
  alphaSum: number;
  // Squared distance from the pixel to the standing point of the kept observation.
  distance: number;
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
  cell.redPremultiplied = 0;
  cell.greenPremultiplied = 0;
  cell.bluePremultiplied = 0;
  cell.alphaSum = 0;
  cell.distance = Number.POSITIVE_INFINITY;
}

function accumulatePixel(decodedByIdentity: ReadonlyMap<string, DecodedSource>, candidates: readonly GridSource[], globalX: number, globalY: number, cell: CellAccumulator, sourceTileIds: Set<string>): void {
  resetCell(cell);
  for (const candidate of candidates) {
    const dx = globalX + 0.5 - candidate.originX;
    const dy = globalY + 0.5 - candidate.originY;
    cell.localX = Math.floor(candidate.inverseMatrix.a * dx + candidate.inverseMatrix.b * dy);
    cell.localY = Math.floor(candidate.inverseMatrix.c * dx + candidate.inverseMatrix.d * dy);
    if (cell.localX < 0 || cell.localX >= candidate.tile.width || cell.localY < 0 || cell.localY >= candidate.tile.height) continue;
    const decodedSource = decodedByIdentity.get(candidate.tile.imageIdentity);
    if (decodedSource === undefined) throw new Error(`Tile generation failed: decoded image disappeared for ${candidate.tile.id}`);
    const offset = (cell.localY * candidate.tile.width + cell.localX) * CHANNELS;
    const red = decodedSource.data[offset]!;
    const green = decodedSource.data[offset + 1]!;
    const blue = decodedSource.data[offset + 2]!;
    const alpha = decodedSource.data[offset + 3]!;
    // Capture clears to transparent, so a fully transparent pixel is a pixel no geometry covered
    // from that standing point. It is absence of evidence, not imagery, and defers to a captured
    // pixel. The game shows objects near the player, so of several captured pixels the one
    // observed from the nearest standing point is the most complete; a plan without a standing
    // point ranks last, and equal distances keep plan order.
    const empty = candidate.tile.empty || alpha === 0;
    cell.covered = true;
    cell.sourceCount++;
    sourceTileIds.add(candidate.tile.id);
    if (empty) {
      if (!cell.captured) cell.empty = true;
      continue;
    }
    const distance = standingDistance(candidate, cell.localX, cell.localY);
    if (cell.captured && distance >= cell.distance) continue;
    cell.empty = false;
    cell.captured = true;
    cell.distance = distance;
    cell.redPremultiplied = red * alpha;
    cell.greenPremultiplied = green * alpha;
    cell.bluePremultiplied = blue * alpha;
    cell.alphaSum = alpha;
  }
}

// Squared world distance from a capture pixel to the observation's standing point.
function standingDistance(candidate: GridSource, localX: number, localY: number): number {
  const standing = candidate.tile.standingPoint;
  if (standing === null) return Number.POSITIVE_INFINITY;
  const edge = candidate.tile.rasterValue.worldFromPixelEdge;
  const px = localX + 0.5, py = localY + 0.5;
  const worldX = edge.origin.x + edge.xAxis.x * px + edge.yAxis.x * py;
  const worldZ = edge.origin.z + edge.xAxis.z * px + edge.yAxis.z * py;
  return (worldX - standing.x) ** 2 + (worldZ - standing.z) ** 2;
}

function composeTile(grid: TileGrid, decodedByIdentity: ReadonlyMap<string, DecodedSource>, z: number, maxZoom: number, tileX: number, tileY: number): TileBuffer {
  const scale = 2 ** (maxZoom - z);
  const tileMinX = tileX * DEFAULT_TILE_SIZE * scale;
  const tileMinY = tileY * DEFAULT_TILE_SIZE * scale;
  const tileMaxX = tileMinX + DEFAULT_TILE_SIZE * scale;
  const tileMaxY = tileMinY + DEFAULT_TILE_SIZE * scale;
  const candidates = grid.sources.filter(source => source.maxX > tileMinX && source.minX < tileMaxX && source.maxY > tileMinY && source.minY < tileMaxY);
  const data = Buffer.alloc(DEFAULT_TILE_SIZE * DEFAULT_TILE_SIZE * CHANNELS);
  let coveredPixels = 0;
  let emptyPixels = 0;
  let missingPixels = 0;
  let capturedPixels = 0;
  const sourceTileIds = new Set<string>();
  const cell: CellAccumulator = { covered: false, captured: false, empty: false, sourceCount: 0, redPremultiplied: 0, greenPremultiplied: 0, bluePremultiplied: 0, alphaSum: 0, distance: Number.POSITIVE_INFINITY, localX: 0, localY: 0 };
  for (let outputY = 0; outputY < DEFAULT_TILE_SIZE; outputY++) {
    for (let outputX = 0; outputX < DEFAULT_TILE_SIZE; outputX++) {
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
          // Published row zero is the top edge. Sample the finest lattice from top to bottom.
          const globalY = tileMaxY - 1 - outputY * scale - dy;
          accumulatePixel(decodedByIdentity, candidates, globalX, globalY, cell, sourceTileIds);
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
      const pixelOffset = (outputY * DEFAULT_TILE_SIZE + outputX) * CHANNELS;
      if (coveredSamples === 0) {
        missingPixels++;
        continue;
      }
      coveredPixels++;
      if (emptySamples === coveredSamples) emptyPixels++;
      if (capturedSamples > 0) capturedPixels++;
      if (coveredSamples !== scale * scale) missingPixels++;
      data[pixelOffset] = alphaSum > 0 ? Math.round(redPremultiplied / alphaSum) : 0;
      data[pixelOffset + 1] = alphaSum > 0 ? Math.round(greenPremultiplied / alphaSum) : 0;
      data[pixelOffset + 2] = alphaSum > 0 ? Math.round(bluePremultiplied / alphaSum) : 0;
      data[pixelOffset + 3] = alphaSum > 0 ? Math.round(alphaSum / (scale * scale)) : 0;
    }
  }
  const coverage: TileCoverage = {
    state: tileState(coveredPixels, emptyPixels, missingPixels, DEFAULT_TILE_SIZE * DEFAULT_TILE_SIZE, capturedPixels),
    coveredPixels,
    emptyPixels,
    missingPixels,
    sourceTileIds: [...sourceTileIds].sort(),
  };
  return { data, coverage };
}

async function decodeSources(grid: TileGrid): Promise<ReadonlyMap<string, DecodedSource>> {
  const decodedByIdentity = new Map<string, DecodedSource>();
  for (const source of grid.sources) {
    if (decodedByIdentity.has(source.tile.imageIdentity)) continue;
    const result = await sharp(source.tile.imageBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (result.info.width !== source.tile.width || result.info.height !== source.tile.height || result.info.channels !== CHANNELS) {
      throw new Error(`Tile generation rejected: decoded image dimensions/channels contradict capture raster for ${source.tile.id}`);
    }
    decodedByIdentity.set(source.tile.imageIdentity, { data: result.data });
  }
  return decodedByIdentity;
}

async function encodeTileWithDimensions(tile: TileBuffer, width: number, height: number): Promise<Buffer> {
  return sharp(tile.data, { raw: { width, height, channels: CHANNELS } }).webp({ lossless: true }).toBuffer();
}

export async function generateTiles(store: ArtifactStore, plan: TilePlan, options: { diagnosticRevision: string; select?: boolean }): Promise<TileGenerationResult> {
  Assert(TilePlanSchema, plan);
  const lease = await createArtifactLease(store, { runId: randomUUID(), buildId: plan.buildId, operation: "tile-inputs", objects: [plan.profile], manifests: plan.sources });
  let run: Awaited<ReturnType<typeof beginArtifactRun>>;
  let planIdentity: ContentIdentity;
  try {
    const object = await store.putBytes(new TextEncoder().encode(`${canonicalJson(plan)}\n`), lease);
    planIdentity = { sha256: object.sha256, bytes: object.bytes };
    const inputs = { plan: planIdentity, profile: plan.profile, ...Object.fromEntries(plan.sources.map((source, index) => [`capture:${index}`, source])) };
    const schemas = [TilePlanSchema, TilePyramidSchema].map(schema => schemaRegistry.identify(schema)).map(({ id, sha256 }) => ({ id, sha256 }));
    const settings = { mapSpaceId: plan.mapSpaceId, tileSize: plan.tileSize ?? 256, zoomConvention: "global-lattice-fine-max" };
    const fingerprint = await fingerprintStep({ entrypoint: resolve(import.meta.dir, "tiles.ts"), buildId: plan.buildId, settings, schemas, inputs });
    run = await beginArtifactRun(store, { buildId: plan.buildId, operation: "tiles", settings, schemas, implementationFingerprint: fingerprint.implementation, cacheKey: fingerprint.cacheKey, probeHashes: fingerprint.probeHashes, diagnosticRevision: options.diagnosticRevision, inputs, inputManifests: plan.sources.map((_, index) => `capture:${index}`) });
  } finally { await lease.release(); }
  let result: TileGenerationResult;
  try {
    await run.setPhase("execution");
    const inputs = await loadTileInputs(store, plan);
  const grid = makeTileGrid(inputs);
  const tileSize = inputs.plan.tileSize ?? DEFAULT_TILE_SIZE;
  if (tileSize !== DEFAULT_TILE_SIZE) throw new Error("Tile generation rejected: tileSize must be 256");
  const finestZoom = Math.log2(1 / grid.pixelSize.x);
  const maxZoom = Math.round(finestZoom);
  if (!Number.isInteger(maxZoom) || Math.abs(maxZoom - finestZoom) > 1e-7) throw new Error("Tile generation rejected: raster resolution does not produce an integer finest zoom");
  const tileRange = (z: number): { minX: number; maxX: number; minY: number; maxY: number; count: number } => {
    const scale = 2 ** (maxZoom - z);
    const minX = Math.floor(grid.minX / (tileSize * scale));
    const maxX = Math.floor((grid.maxX - 1) / (tileSize * scale));
    const minY = Math.floor(grid.minY / (tileSize * scale));
    const maxY = Math.floor((grid.maxY - 1) / (tileSize * scale));
    return { minX, maxX, minY, maxY, count: (maxX - minX + 1) * (maxY - minY + 1) };
  };
  let minZoom = maxZoom - 5;
  for (let z = maxZoom; z >= maxZoom - 5; z--) {
    if (tileRange(z).count <= 4) {
      minZoom = z;
      break;
    }
  }
    const decodedByIdentity = await decodeSources(grid);
    const levels: TileLevel[] = [];
    const emittedFiles: TileFile[] = [];
    const missingPositions: Array<{ z: number; x: number; y: number }> = [];
    const emptyPositions: Array<{ z: number; x: number; y: number }> = [];
    const partialPositions: Array<{ z: number; x: number; y: number }> = [];
    let totalBytes = 0;
    let finestExtent: [number, number, number, number] | null = null;
    for (let z = minZoom; z <= maxZoom; z++) {
      const range = tileRange(z);
      const tiles: TileFile[] = [];
      for (let y = range.minY; y <= range.maxY; y++) {
        for (let x = range.minX; x <= range.maxX; x++) {
          const tile = composeTile(grid, decodedByIdentity, z, maxZoom, x, y);
          if (tile.coverage.state === "missing") {
            missingPositions.push({ z, x, y });
            continue;
          }
          if (tile.coverage.state === "empty") emptyPositions.push({ z, x, y });
          if (tile.coverage.state === "partial") partialPositions.push({ z, x, y });
          const webp = await encodeTileWithDimensions(tile, tileSize, tileSize);
          const object = await run.putBytes(webp);
          const sha256 = object.sha256;
          const path = `tiles/${z}/${x}/${y}.${sha256}.webp`;
          const file: TileFile = { z, x, y, width: tileSize, height: tileSize, coverage: tile.coverage, path, bytes: webp.byteLength, sha256, mediaType: "image/webp" };
          tiles.push(file);
          emittedFiles.push(file);
          totalBytes += webp.byteLength;
          await run.addArtifact(path, object, { mediaType: "image/webp" });
          if (z === maxZoom) {
            const tileWorldSize = tileSize * grid.pixelSize.x;
            const extent: [number, number, number, number] = [x * tileWorldSize, y * tileWorldSize, (x + 1) * tileWorldSize, (y + 1) * tileWorldSize];
            if (finestExtent === null) finestExtent = extent;
            else finestExtent = [Math.min(finestExtent[0], extent[0]), Math.min(finestExtent[1], extent[1]), Math.max(finestExtent[2], extent[2]), Math.max(finestExtent[3], extent[3])];
          }
        }
      }
      levels.push({ z, tiles });
    }
    if (finestExtent === null) throw new Error("Tile generation rejected: no finest tiles have capture coverage");
    const coverageReasons: string[] = [];
    if (inputs.sources.some(source => source.captureSet.completeImagery === false)) coverageReasons.push("source capture sets declare incomplete imagery coverage");
    if (missingPositions.length > 0) coverageReasons.push(`${missingPositions.length} delivery tile positions have no capture coverage`);
    if (partialPositions.length > 0) coverageReasons.push("partial delivery tiles retain missing pixel coverage");
    const pyramid: TilePyramid = {
      schemaVersion: "compendium.tile-pyramid.v4",
      buildId: inputs.plan.buildId,
      mapSpaceId: inputs.plan.mapSpaceId,
      plan: planIdentity,
      profile: plan.profile,
      coordinateSystem: "map-space-xy",
      pixelConvention: "top-left-edges",
      extent: finestExtent,
      minZoom,
      maxZoom,
      format: "webp-lossless",
      tileSize: 256,
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
    await run.setPhase("finalization");
    Assert(TilePyramidSchema, pyramid);
    const index = await run.putBytes(new TextEncoder().encode(stableJson(pyramid)));
    await run.addArtifact("tile-index.json", index, { mediaType: "application/json", schemaId: pyramid.schemaVersion, references: [...levels.flatMap(level => level.tiles.map(tile => ({ kind: "object" as const, content: { sha256: tile.sha256, bytes: tile.bytes } }))), ...plan.sources.map(content => ({ kind: "run-manifest" as const, content }))] });
    const imagery = {
      schemaVersion: "compendium.catalog-imagery.v1" as const,
      buildId: plan.buildId,
      layer: {
        id: `captured-${plan.mapSpaceId}-${index.sha256.slice(0, 12)}`, mapSpaceId: plan.mapSpaceId, label: "Captured terrain", kind: "captured" as const,
        tileSize: 256 as const, minZoom, maxZoom, extent: pyramid.extent,
        tiles: levels.flatMap(level => level.tiles
          .filter(tile => tile.coverage.state !== "missing")
          .map(tile => ({ z: tile.z, x: tile.x, y: tile.y, url: `data/assets/${tile.sha256}.webp`, sha256: tile.sha256, bytes: tile.bytes, width: tile.width, height: tile.height, state: tile.coverage.state }))),
      },
      inputs: [planIdentity, plan.profile, { sha256: index.sha256, bytes: index.bytes }, ...plan.sources],
      manifests: plan.sources,
    };
    Assert(CatalogImagerySchema, imagery);
    const imageryObject = await run.putBytes(new TextEncoder().encode(`${canonicalJson(imagery)}\n`));
    await run.addArtifact("catalog-imagery.json", imageryObject, { mediaType: "application/json", schemaId: imagery.schemaVersion, references: [{ kind: "object", content: { sha256: index.sha256, bytes: index.bytes } }, ...plan.sources.map(content => ({ kind: "run-manifest" as const, content }))] });
    await run.succeed();
    result = { manifest: run.manifestIdentity!, manifestPath: run.manifestPath, index: { sha256: index.sha256, bytes: index.bytes }, imagery: { sha256: imageryObject.sha256, bytes: imageryObject.bytes }, files: pyramid.totals.files, bytes: pyramid.totals.bytes, complete: pyramid.coverage.complete };
    if (options.select === true) await selectLatestSuccess(store, run.manifestPath);
    return result;
  } catch (error) { if (run.status === "running") await run.fail(error); throw error; }
  finally { await run.release(); }
}
