import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import { queryCatalogImagery, queryCatalogMap } from "@afallon/catalog";
import { PublicTileLayerSchema, StaticImagerySchema, type PublicTileLayer, type StaticImagery } from "@afallon/contracts/public";
import { writeStaticJson, type GeneratedStaticResource } from "./resources";

export interface GeneratedImageryResource {
  mapSpaceId: string;
  resource: GeneratedStaticResource<StaticImagery>;
}

function contentAddressedLayer(layer: PublicTileLayer): PublicTileLayer {
  return {
    ...layer,
    tiles: layer.tiles.map((tile) => ({ ...tile, url: `assets/${tile.sha256}.webp` })),
  };
}

export async function generateImageryResources(db: Database, store: ArtifactStore): Promise<GeneratedImageryResource[]> {
  const imagery = queryCatalogImagery(db);
  const mapIds = [...new Set(imagery.records.map((record) => record.mapSpaceId))].sort();
  const result: GeneratedImageryResource[] = [];
  for (const mapSpaceId of mapIds) {
    const rows = imagery.records.filter((record) => record.mapSpaceId === mapSpaceId);
    const layers: PublicTileLayer[] = [];
    for (const row of rows) {
      await store.verify({ sha256: row.sha256, bytes: row.bytes });
      Assert(PublicTileLayerSchema, row.metadata);
      if (row.metadata.id !== row.assetId || row.metadata.mapSpaceId !== mapSpaceId || row.metadata.kind !== row.kind) throw new Error(`Imagery registration mismatch: ${row.assetId}.`);
      for (const tile of row.metadata.tiles) await store.verify({ sha256: tile.sha256, bytes: tile.bytes });
      layers.push(contentAddressedLayer(row.metadata));
    }
    layers.sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
    const gameLayer = layers.find((layer) => layer.kind === "game-map");
    const queriedMap = queryCatalogMap(db, mapSpaceId);
    if (queriedMap.records === null) throw new Error(`Imagery references missing map space: ${mapSpaceId}.`);
    const sample = queriedMap.records.placements.filter((_, index, all) => index === 0 || index === all.length - 1 || index === Math.floor(all.length / 2));
    for (const placement of sample) {
      if (!layers.some((layer) => placement.position[0] >= layer.extent[0] && placement.position[0] <= layer.extent[2] && placement.position[1] >= layer.extent[1] && placement.position[1] <= layer.extent[3])) throw new Error(`Imagery registration excludes sampled placement ${placement.placementId}.`);
    }
    const value: StaticImagery = {
      schemaVersion: "compendium.static-imagery.v1",
      buildId: imagery.buildId,
      catalogId: imagery.catalogId,
      mapSpaceId,
      defaultLayerId: (gameLayer ?? layers[0]!).id,
      layers,
    };
    Assert(StaticImagerySchema, value);
    result.push({ mapSpaceId, resource: await writeStaticJson(store, value.schemaVersion, value) });
  }
  return result;
}
