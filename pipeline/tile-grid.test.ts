import { expect, test } from "bun:test";
import { affineAt, gridPixelOrigin, type TileGrid } from "./tile-grid";
import type { TileAffine } from "./tile-contracts";

const grid = {
  origin: { x: 100, y: 200 }, xAxis: { x: 2, y: 0 }, yAxis: { x: 0, y: -2 }, pixelSize: { x: 2, y: 2 },
  minX: -5, minY: -7, maxX: 11, maxY: 9, width: 16, height: 16,
  bounds: { min: { x: 78, y: 182 }, max: { x: 122, y: 214 }, width: 44, height: 32 }, sources: [],
} satisfies TileGrid;

function point(affine: TileAffine, x: number, y: number) {
  return { x: affine.origin.x + affine.xAxis.x * x + affine.yAxis.x * y, y: affine.origin.y + affine.xAxis.y * x + affine.yAxis.y * y };
}

test("all zoom-level tile transforms share the top-left grid origin", () => {
  const layer = gridPixelOrigin(grid);
  const finestLevel = 2;
  for (let level = 0; level <= finestLevel; level++) {
    const scale = 2 ** (finestLevel - level);
    const tile = affineAt(grid, grid.minX, grid.minY, scale);
    expect(point(tile, 0, 0)).toEqual(point(layer, 0, 0));
    expect(point(tile, 1, 0)).toEqual(point(layer, scale, 0));
    expect(point(tile, 0, 1)).toEqual(point(layer, 0, scale));
  }
});
