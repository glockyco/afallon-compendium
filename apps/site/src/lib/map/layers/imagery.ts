import { COORDINATE_SYSTEM, type Layer } from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";
import { Matrix4 } from "@math.gl/core";
import type { PublicTile, PublicTileLayer } from "@afallon/contracts/public";

export type TileRequest = { index: { z: number; x: number; y: number }; signal?: AbortSignal };
export type LoadedTile = { tile: PublicTile; image: ImageBitmap };

export type PlacedImagery = {
  tileLayer: PublicTileLayer;
  offset: { worldX: number; worldY: number };
};

export function orderImageryLayers(layers: readonly PlacedImagery[]): PlacedImagery[] {
  return [...layers].sort((left, right) => Number(left.tileLayer.kind === "captured") - Number(right.tileLayer.kind === "captured"));
}

export function createImageryLayer(
  id: string,
  tileLayer: PublicTileLayer,
  offset: { worldX: number; worldY: number },
  loadTile: (tileLayer: PublicTileLayer, request: TileRequest) => Promise<LoadedTile | null>,
  onError: (message: string) => void,
): Layer {
  return new TileLayer<LoadedTile | null>({
    id, data: null, tileSize: tileLayer.tileSize, minZoom: tileLayer.minZoom, maxZoom: tileLayer.maxZoom,
    extent: tileLayer.extent, modelMatrix: new Matrix4().translate([offset.worldX, offset.worldY, 0]),
    getTileData: request => loadTile(tileLayer, request),
    renderSubLayers: props => {
      if (!props.data) return null;
      const [[west, south], [east, north]] = props.tile.boundingBox as [[number, number], [number, number]];
      return new BitmapLayer({ id: `${props.id}-bitmap`, data: null as never, image: props.data.image,
        bounds: [west, south, east, north], coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        modelMatrix: props.modelMatrix, pickable: false });
    },
    onTileError: (error, tile) => {
      if (error instanceof Error && error.name === "AbortError") return;
      const tileKey = tile ? `${tile.index.z}/${tile.index.x}/${tile.index.y}` : "unknown";
      const message = error instanceof Error ? error.message : String(error);
      onError(`Unable to load tile ${tileKey}: ${message}`);
    },
  });
}
