import type { Database } from "bun:sqlite";
import { readFile } from "node:fs/promises";
import { canonicalJson } from "@afallon/contracts";
import { CatalogImagerySchema } from "@afallon/contracts/catalog";
import { Assert } from "typebox/value";
import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import { queryCatalogImagery } from "@afallon/catalog";
import { PublicTileLayerSchema, StaticImagerySchema, type PublicTileLayer, type StaticImagery } from "@afallon/contracts/public";
import { writeStaticJson, type GeneratedStaticResource } from "./resources";

export interface GeneratedImageryResource {
  mapSpaceId: string;
  resource: GeneratedStaticResource<StaticImagery>;
}

function contentAddressedLayer(layer: PublicTileLayer): StaticImagery["layers"][number] {
  return {
    ...layer,
    tiles: layer.tiles.map((tile) => ({ ...tile, url: `assets/${tile.sha256}.webp`, schemaId: "image/webp" })),
  };
}

export async function generateImageryResources(db: Database, store: ArtifactStore, protection?: ObjectWriteProtection): Promise<GeneratedImageryResource[]> {
  const imagery = queryCatalogImagery(db);
  const mapIds = [...new Set(imagery.records.map((record) => record.mapSpaceId))].sort();
  const result: GeneratedImageryResource[] = [];
  for (const mapSpaceId of mapIds) {
    const rows = imagery.records.filter((record) => record.mapSpaceId === mapSpaceId);
    const layers: StaticImagery["layers"] = [];
    for (const row of rows) {
      await store.verify({ sha256: row.sha256, bytes: row.bytes });
      const registration: unknown = JSON.parse(await readFile(store.objectPath(row.sha256), "utf8"));
      Assert(CatalogImagerySchema, registration);
      if (registration.buildId !== imagery.buildId || canonicalJson(registration.layer) !== canonicalJson(row.metadata)) throw new Error(`Imagery object differs from sealed catalog metadata: ${row.assetId}.`);
      for (const input of registration.inputs) await store.verify(input);
      Assert(PublicTileLayerSchema, row.metadata);
      if (row.metadata.mapSpaceId !== mapSpaceId || row.metadata.kind !== row.kind) throw new Error(`Imagery registration mismatch: ${row.assetId}.`);
      for (const tile of row.metadata.tiles) await store.verify({ sha256: tile.sha256, bytes: tile.bytes });
      layers.push(contentAddressedLayer(row.metadata));
    }
    layers.sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
    const gameLayer = layers.find((layer) => layer.kind === "game-map");
    if (!gameLayer) throw new Error(`Published map has no default game imagery: ${mapSpaceId}.`);
    const value: StaticImagery = {
      schemaVersion: "compendium.static-imagery.v2",
      buildId: imagery.buildId,
      catalogId: imagery.catalogId,
      mapSpaceId,
      defaultLayerId: gameLayer.id,
      layers,
    };
    Assert(StaticImagerySchema, value);
    result.push({ mapSpaceId, resource: await writeStaticJson(store, value.schemaVersion, value, protection) });
  }
  return result;
}
