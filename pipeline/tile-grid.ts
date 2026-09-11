import type { MapSpaceProfile } from "../tools/spatial-contracts";
import type { TileAffine, TileBounds } from "./tile-contracts";
import type { LoadedTileInputs, SourceTile } from "./tile-input";

const EPSILON = 1e-7;

type Point = { x: number; y: number };
type Matrix = { a: number; b: number; c: number; d: number };

export type GridSource = {
  tile: SourceTile;
  mapOrigin: Point;
  mapXAxis: Point;
  mapYAxis: Point;
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
  origin: Point;
  xAxis: Point;
  yAxis: Point;
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
  const determinant = binding.frame.xAxis.x * binding.frame.yAxis.z - binding.frame.yAxis.x * binding.frame.xAxis.z;
  if (!Number.isFinite(determinant) || Math.abs(determinant) <= Number.EPSILON) throw new Error(`Tile input rejected: reviewed binding ${binding.id} has a singular frame`);
  return {
    a: binding.frame.yAxis.z / determinant,
    b: -binding.frame.yAxis.x / determinant,
    c: -binding.frame.xAxis.z / determinant,
    d: binding.frame.xAxis.x / determinant,
  };
}

function apply(matrix: Matrix, point: Point): Point {
  return { x: matrix.a * point.x + matrix.b * point.y, y: matrix.c * point.x + matrix.d * point.y };
}

function add(left: Point, right: Point): Point {
  return { x: left.x + right.x, y: left.y + right.y };
}

function scale(point: Point, amount: number): Point {
  return { x: point.x * amount, y: point.y * amount };
}

function relativePoint(baseX: Point, baseY: Point, point: Point): Point {
  const determinant = baseX.x * baseY.y - baseY.x * baseX.y;
  if (Math.abs(determinant) <= Number.EPSILON) throw new Error("Tile input rejected: finest raster grid is singular");
  return {
    x: (point.x * baseY.y - baseY.x * point.y) / determinant,
    y: (baseX.x * point.y - point.x * baseX.y) / determinant,
  };
}

function roundedInteger(value: number, label: string): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(value) || Math.abs(value - rounded) > EPSILON * Math.max(1, Math.abs(value))) throw new Error(`Tile input rejected: ${label} is not exactly pixel-aligned`);
  return rounded;
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
  const ordered = [...allTiles].sort((left, right) => `${left.sourcePath}/${left.id}`.localeCompare(`${right.sourcePath}/${right.id}`));
  const first = transformRaster(ordered[0]!, inputs.profile, inputs.plan.mapSpaceId);
  const baseX = first.xAxis;
  const baseY = first.yAxis;
  const baseOrigin = first.origin;
  const baseXLength = Math.hypot(baseX.x, baseX.y);
  const baseYLength = Math.hypot(baseY.x, baseY.y);
  if (!(baseXLength > 0) || !(baseYLength > 0)) throw new Error("Tile input rejected: finest capture has a degenerate map pixel frame");
  const sources: GridSource[] = [];
  for (const tile of ordered) {
    const transformed = transformRaster(tile, inputs.profile, inputs.plan.mapSpaceId);
    const originRelative = relativePoint(baseX, baseY, { x: transformed.origin.x - baseOrigin.x, y: transformed.origin.y - baseOrigin.y });
    const xRelative = relativePoint(baseX, baseY, transformed.xAxis);
    const yRelative = relativePoint(baseX, baseY, transformed.yAxis);
    const matrix: Matrix = {
      a: roundedInteger(xRelative.x, `${tile.id} x-axis.x`),
      c: roundedInteger(xRelative.y, `${tile.id} x-axis.y`),
      b: roundedInteger(yRelative.x, `${tile.id} y-axis.x`),
      d: roundedInteger(yRelative.y, `${tile.id} y-axis.y`),
    };
    if (Math.abs(matrix.a) + Math.abs(matrix.c) !== 1 || Math.abs(matrix.b) + Math.abs(matrix.d) !== 1 || Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) !== 1) {
      throw new Error(`Tile input rejected: raster ${tile.id} has an unsupported rotation, reflection, or resolution relationship`);
    }
    const originX = roundedInteger(originRelative.x, `${tile.id} origin.x`);
    const originY = roundedInteger(originRelative.y, `${tile.id} origin.y`);
    if (Math.abs(Math.hypot(transformed.xAxis.x, transformed.xAxis.y) - baseXLength) > EPSILON * Math.max(1, baseXLength)
      || Math.abs(Math.hypot(transformed.yAxis.x, transformed.yAxis.y) - baseYLength) > EPSILON * Math.max(1, baseYLength)) {
      throw new Error(`Tile input rejected: raster ${tile.id} resolution differs from the finest capture`);
    }
    const inverseMatrix: Matrix = { a: matrix.d, b: -matrix.b, c: -matrix.c, d: matrix.a };
    const source: GridSource = { tile, mapOrigin: transformed.origin, mapXAxis: transformed.xAxis, mapYAxis: transformed.yAxis, originX, originY, matrix, inverseMatrix, minX: 0, minY: 0, maxX: 0, maxY: 0 };
    Object.assign(source, transformedBounds(source));
    sources.push(source);
  }
  const minX = Math.min(...sources.map(source => source.minX));
  const minY = Math.min(...sources.map(source => source.minY));
  const maxX = Math.max(...sources.map(source => source.maxX));
  const maxY = Math.max(...sources.map(source => source.maxY));
  if (!(maxX > minX) || !(maxY > minY)) throw new Error("Tile input rejected: source captures have no finite common bounds");
  const mapCorners = [
    { x: minX, y: minY }, { x: maxX, y: minY }, { x: minX, y: maxY }, { x: maxX, y: maxY },
  ].map(point => add(baseOrigin, add(scale(baseX, point.x), scale(baseY, point.y))));
  const bounds = {
    min: { x: Math.min(...mapCorners.map(point => point.x)), y: Math.min(...mapCorners.map(point => point.y)) },
    max: { x: Math.max(...mapCorners.map(point => point.x)), y: Math.max(...mapCorners.map(point => point.y)) },
    width: Math.max(...mapCorners.map(point => point.x)) - Math.min(...mapCorners.map(point => point.x)),
    height: Math.max(...mapCorners.map(point => point.y)) - Math.min(...mapCorners.map(point => point.y)),
  };
  return { origin: baseOrigin, xAxis: baseX, yAxis: baseY, pixelSize: { x: baseXLength, y: baseYLength }, minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, bounds, sources };
}

export function affineAt(grid: TileGrid, startX: number, startY: number, scaleFactor: number): TileAffine {
  return {
    origin: add(grid.origin, add(scale(grid.xAxis, startX), scale(grid.yAxis, startY))),
    xAxis: scale(grid.xAxis, scaleFactor),
    yAxis: scale(grid.yAxis, scaleFactor),
  };
}

export function gridPixelOrigin(grid: TileGrid): TileAffine {
  return affineAt(grid, grid.minX, grid.minY, 1);
}
