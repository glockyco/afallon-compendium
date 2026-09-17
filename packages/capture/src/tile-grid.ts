import { invertMapSpaceFrame, type MapSpaceProfile } from "@afallon/contracts/spatial";
import type { TileBounds } from "@afallon/contracts"
import type { LoadedTileInputs, SourceTile } from "./tile-input";

const EPSILON = 1e-7;

type Point = { x: number; y: number };
type Matrix = { a: number; b: number; c: number; d: number };

export type GridSource = {
  tile: SourceTile;
  originX: number;
  originY: number;
  matrix: Matrix;
  inverseMatrix: Matrix;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type TileGrid = {
  pixelSize: { x: number; y: number };
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  bounds: TileBounds;
  sources: GridSource[];
};

function mapBinding(profile: MapSpaceProfile, tile: SourceTile, mapSpaceId: string): MapSpaceProfile["bindings"][number] {
  const matches = profile.bindings.filter(binding => binding.sceneNativeId === tile.sceneNativeId && binding.scenePath === tile.scenePath && binding.mapSpaceId === mapSpaceId);
  if (matches.length !== 1) throw new Error(`Tile input rejected: scene ${tile.sceneNativeId} at ${tile.scenePath} has ${matches.length} reviewed bindings for ${mapSpaceId}`);
  return matches[0]!;
}

function inverseFrame(binding: MapSpaceProfile["bindings"][number]): Matrix {
  const inverse = invertMapSpaceFrame(binding.frame, binding.id);
  return { a: inverse.xx, b: inverse.xz, c: inverse.yx, d: inverse.yz };
}

function apply(matrix: Matrix, point: Point): Point {
  return { x: matrix.a * point.x + matrix.b * point.y, y: matrix.c * point.x + matrix.d * point.y };
}

function roundedInteger(value: number, label: string): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(value) || Math.abs(value - rounded) > EPSILON * Math.max(1, Math.abs(value))) throw new Error(`Tile input rejected: ${label} is not exactly pixel-aligned`);
  return rounded;
}

function isPowerOfTwo(value: number): boolean {
  return Number.isInteger(value) && value > 0 && (value & (value - 1)) === 0;
}

function transformRaster(tile: SourceTile, profile: MapSpaceProfile, mapSpaceId: string): { origin: Point; xAxis: Point; yAxis: Point } {
  const binding = mapBinding(profile, tile, mapSpaceId);
  const inverse = inverseFrame(binding);
  const raster = tile.rasterValue.worldFromPixelEdge;
  const originWorld = { x: raster.origin.x - binding.frame.origin.x, y: raster.origin.z - binding.frame.origin.z };
  const xWorld = { x: raster.xAxis.x, y: raster.xAxis.z };
  const yWorld = { x: raster.yAxis.x, y: raster.yAxis.z };
  const origin = apply(inverse, originWorld);
  const xAxis = apply(inverse, xWorld);
  const yAxis = apply(inverse, yWorld);
  if (![origin.x, origin.y, xAxis.x, xAxis.y, yAxis.x, yAxis.y].every(Number.isFinite)) throw new Error(`Tile input rejected: raster ${tile.id} maps to non-finite coordinates`);
  return { origin, xAxis, yAxis };
}

function transformedBounds(source: GridSource): { minX: number; minY: number; maxX: number; maxY: number } {
  const corners = [
    { x: source.originX, y: source.originY },
    { x: source.originX + source.matrix.a * source.tile.width, y: source.originY + source.matrix.c * source.tile.width },
    { x: source.originX + source.matrix.b * source.tile.height, y: source.originY + source.matrix.d * source.tile.height },
    { x: source.originX + source.matrix.a * source.tile.width + source.matrix.b * source.tile.height, y: source.originY + source.matrix.c * source.tile.width + source.matrix.d * source.tile.height },
  ];
  return {
    minX: Math.min(...corners.map(corner => corner.x)),
    minY: Math.min(...corners.map(corner => corner.y)),
    maxX: Math.max(...corners.map(corner => corner.x)),
    maxY: Math.max(...corners.map(corner => corner.y)),
  };
}

export function makeTileGrid(inputs: LoadedTileInputs): TileGrid {
  const allTiles = inputs.sources.flatMap(source => source.tiles);
  if (allTiles.length === 0) throw new Error("Tile input rejected: no source captures");
  const ordered = allTiles.sort((left, right) => left.sourceOrdinal - right.sourceOrdinal || left.id.localeCompare(right.id));
  const first = transformRaster(ordered[0]!, inputs.profile, inputs.plan.mapSpaceId);
  const firstXLength = Math.hypot(first.xAxis.x, first.xAxis.y);
  const firstYLength = Math.hypot(first.yAxis.x, first.yAxis.y);
  const firstEdgeX = firstXLength * ordered[0]!.width;
  const firstEdgeY = firstYLength * ordered[0]!.height;
  if (!(firstEdgeX > 0) || !(firstEdgeY > 0) || Math.abs(firstEdgeX - firstEdgeY) > EPSILON * Math.max(1, firstEdgeX, firstEdgeY) || !isPowerOfTwo(firstEdgeX)) {
    throw new Error(`Tile input rejected: capture tile ${ordered[0]!.id} edge must be a square power of two`);
  }
  const pixelSize = { x: firstEdgeX / ordered[0]!.width, y: firstEdgeY / ordered[0]!.height };
  const sources: GridSource[] = [];
  for (const tile of ordered) {
    const transformed = transformRaster(tile, inputs.profile, inputs.plan.mapSpaceId);
    const edgeX = Math.hypot(transformed.xAxis.x, transformed.xAxis.y) * tile.width;
    const edgeY = Math.hypot(transformed.yAxis.x, transformed.yAxis.y) * tile.height;
    if (!isPowerOfTwo(edgeX) || !isPowerOfTwo(edgeY) || Math.abs(edgeX - edgeY) > EPSILON * Math.max(1, edgeX, edgeY)) {
      throw new Error(`Tile input rejected: capture tile ${tile.id} edge must be a square power of two`);
    }
    if (Math.abs(edgeX - firstEdgeX) > EPSILON * Math.max(1, edgeX, firstEdgeX) || Math.abs(edgeY - firstEdgeY) > EPSILON * Math.max(1, edgeY, firstEdgeY)) {
      throw new Error(`Tile input rejected: raster ${tile.id} resolution differs from the finest capture`);
    }
    if (Math.abs(transformed.origin.x / edgeX - Math.round(transformed.origin.x / edgeX)) > EPSILON
      || Math.abs(transformed.origin.y / edgeY - Math.round(transformed.origin.y / edgeY)) > EPSILON) {
      throw new Error(`Tile input rejected: capture tile ${tile.id} origin must be a multiple of its edge`);
    }
    const matrix: Matrix = {
      a: roundedInteger(transformed.xAxis.x / pixelSize.x, `${tile.id} x-axis.x`),
      c: roundedInteger(transformed.xAxis.y / pixelSize.y, `${tile.id} x-axis.y`),
      b: roundedInteger(transformed.yAxis.x / pixelSize.x, `${tile.id} y-axis.x`),
      d: roundedInteger(transformed.yAxis.y / pixelSize.y, `${tile.id} y-axis.y`),
    };
    if (Math.abs(matrix.a) + Math.abs(matrix.c) !== 1 || Math.abs(matrix.b) + Math.abs(matrix.d) !== 1 || Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) !== 1) {
      throw new Error(`Tile input rejected: raster ${tile.id} has an unsupported rotation, reflection, or resolution relationship`);
    }
    const originX = roundedInteger(transformed.origin.x / pixelSize.x, `${tile.id} origin.x`);
    const originY = roundedInteger(transformed.origin.y / pixelSize.y, `${tile.id} origin.y`);
    // The adjugate alone inverts only a matrix of determinant one. A capture raster whose
    // map Y runs opposite its pixel rows has determinant minus one, so omitting the divisor
    // reflects every sample out of the source and the whole pyramid reports no coverage.
    const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
    if (!Number.isFinite(determinant) || Math.abs(determinant) <= Number.EPSILON) throw new Error(`Tile input rejected: capture tile ${tile.id} has a singular pixel matrix`);
    const inverseMatrix: Matrix = { a: matrix.d / determinant, b: -matrix.b / determinant, c: -matrix.c / determinant, d: matrix.a / determinant };
    const source: GridSource = { tile, originX, originY, matrix, inverseMatrix, minX: 0, minY: 0, maxX: 0, maxY: 0 };
    Object.assign(source, transformedBounds(source));
    sources.push(source);
  }
  const minX = Math.min(...sources.map(source => source.minX));
  const minY = Math.min(...sources.map(source => source.minY));
  const maxX = Math.max(...sources.map(source => source.maxX));
  const maxY = Math.max(...sources.map(source => source.maxY));
  if (!(maxX > minX) || !(maxY > minY)) throw new Error("Tile input rejected: source captures have no finite common bounds");
  const bounds = {
    min: { x: minX * pixelSize.x, y: minY * pixelSize.y },
    max: { x: maxX * pixelSize.x, y: maxY * pixelSize.y },
    width: (maxX - minX) * pixelSize.x,
    height: (maxY - minY) * pixelSize.y,
  };
  return { pixelSize, minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, bounds, sources };
}
