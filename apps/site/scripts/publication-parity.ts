import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Assert } from "typebox/value";
import {
  PublicationDataSchema,
  StaticEntitySearchSchema,
  StaticImagerySchema,
  StaticItemSearchSchema,
  StaticMapShardSchema,
  expandEssentialPlacement,
  type PublicationData,
  type PublicPlacement,
  type PublicRegion,
  type PublicTileLayer,
  type StaticRootManifest,
} from "@afallon/contracts/public";

export interface PublicationSummary {
  mapIds: Set<string>;
  offsets: Map<string, { worldX: number; worldY: number }>;
  placementsByMap: Map<string, number>;
  placementsByCategory: Map<string, number>;
  tileLayers: Map<string, PublicTileLayer>;
  entityKeys: Set<string>;
  itemKeys: Set<string>;
  regionKeys: Set<string>;
  placementIds: Set<string>;
  placementCount: number;
}

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function uniqueSet(values: Iterable<string>, subject: string): Set<string> {
  const result = new Set<string>();
  for (const value of values) {
    if (result.has(value)) throw new Error(`Publication repeats ${subject} ${value}.`);
    result.add(value);
  }
  return result;
}

function summarize(
  placements: readonly PublicPlacement[],
  data: Pick<PublicationData, "maps" | "world" | "tileLayers">,
  entityKeys: Iterable<string>,
  itemKeys: Iterable<string>,
  regions: readonly PublicRegion[],
): PublicationSummary {
  const placementsByMap = new Map<string, number>();
  const placementsByCategory = new Map<string, number>();
  const placementIds = new Set<string>();
  for (const placement of placements) {
    if (placementIds.has(placement.placementId)) throw new Error(`Publication repeats placement ${placement.placementId}.`);
    placementIds.add(placement.placementId);
    increment(placementsByMap, placement.mapSpaceId);
    for (const category of placement.categories) increment(placementsByCategory, category);
  }
  const tileLayers = new Map<string, PublicTileLayer>();
  for (const layer of data.tileLayers) {
    const key = `${layer.mapSpaceId}:${layer.kind}:${layer.id}`;
    if (tileLayers.has(key)) throw new Error(`Publication repeats imagery layer ${key}.`);
    tileLayers.set(key, layer);
  }
  return {
    mapIds: new Set(data.maps.map((map) => map.mapSpaceId)),
    offsets: new Map(data.world.offsets.filter((offset) => offset.status === "placed").map((offset) => [offset.mapSpaceId, { worldX: offset.worldX, worldY: offset.worldY }])),
    placementsByMap,
    placementsByCategory,
    tileLayers,
    entityKeys: uniqueSet(entityKeys, "searchable entity"),
    itemKeys: uniqueSet(itemKeys, "searchable item"),
    regionKeys: uniqueSet(regions.map((region) => JSON.stringify({ mapSpaceId: region.mapSpaceId, name: region.name, shape: region.shape, polygon: region.polygon })), "map region"),
    placementIds,
    placementCount: placements.length,
  };
}

function assertAtLeast(candidate: Map<string, number>, baseline: Map<string, number>, subject: string): void {
  const deficits = [...baseline].filter(([key, count]) => (candidate.get(key) ?? 0) < count).map(([key, count]) => `${key}: ${candidate.get(key) ?? 0} < ${count}`);
  if (deficits.length > 0) throw new Error(`Publication regresses ${subject}: ${deficits.join(", ")}.`);
}

function assertContains(candidate: Set<string>, baseline: Set<string>, subject: string): void {
  const missing = [...baseline].filter((key) => !candidate.has(key));
  if (missing.length === 0) return;
  const remainder = missing.length > 20 ? ` (+${missing.length - 20} more)` : "";
  throw new Error(`Publication removes ${subject}: ${missing.slice(0, 20).join(", ")}${remainder}.`);
}

export function assertNonRegressivePublication(candidate: PublicationSummary, baseline: PublicationSummary): void {
  const missingMaps = [...baseline.mapIds].filter((mapSpaceId) => !candidate.mapIds.has(mapSpaceId));
  if (missingMaps.length > 0) throw new Error(`Publication removes map spaces: ${missingMaps.join(", ")}.`);
  if (candidate.placementCount < baseline.placementCount) throw new Error(`Publication regresses placement coverage: ${candidate.placementCount} < ${baseline.placementCount}.`);
  assertContains(candidate.placementIds, baseline.placementIds, "deployed placements");
  assertAtLeast(candidate.placementsByMap, baseline.placementsByMap, "per-map placement coverage");
  assertAtLeast(candidate.placementsByCategory, baseline.placementsByCategory, "per-category placement coverage");
  assertContains(candidate.entityKeys, baseline.entityKeys, "searchable entities");
  assertContains(candidate.itemKeys, baseline.itemKeys, "searchable items");
  assertContains(candidate.regionKeys, baseline.regionKeys, "map regions");
  for (const [mapSpaceId, expected] of baseline.offsets) {
    const actual = candidate.offsets.get(mapSpaceId);
    if (!actual || actual.worldX !== expected.worldX || actual.worldY !== expected.worldY) throw new Error(`Publication changes the reviewed world offset for ${mapSpaceId}.`);
  }
  for (const [key, expected] of baseline.tileLayers) {
    const actual = candidate.tileLayers.get(key);
    if (!actual) throw new Error(`Publication removes imagery layer ${key}.`);
    if (actual.tileSize !== expected.tileSize || actual.minZoom !== expected.minZoom || actual.maxZoom !== expected.maxZoom) throw new Error(`Publication changes imagery zoom metadata for ${key}.`);
    if (JSON.stringify(actual.extent) !== JSON.stringify(expected.extent)) throw new Error(`Publication changes imagery extent for ${key}.`);
    const actualTiles = new Set(actual.tiles.map((tile) => `${tile.z}:${tile.x}:${tile.y}:${tile.sha256}`));
    const missingTiles = expected.tiles.filter((tile) => !actualTiles.has(`${tile.z}:${tile.x}:${tile.y}:${tile.sha256}`));
    if (missingTiles.length > 0) throw new Error(`Publication removes ${missingTiles.length} imagery tiles from ${key}.`);
  }
}

export function verifyPublicationParity(candidateDirectory: string, candidateRoot: StaticRootManifest, baselinePath: string): void {
  const baseline: unknown = JSON.parse(readFileSync(baselinePath, "utf8"));
  Assert(PublicationDataSchema, baseline);
  const candidatePlacements: PublicPlacement[] = [];
  const candidateLayers: PublicTileLayer[] = [];
  const candidateRegions: PublicRegion[] = [];
  const candidateEntityKeys: string[] = [];
  const candidateItemKeys: string[] = [];
  for (const map of candidateRoot.maps) {
    for (const reference of map.parts) {
      const shard: unknown = JSON.parse(readFileSync(join(candidateDirectory, reference.path), "utf8"));
      Assert(StaticMapShardSchema, shard);
      candidatePlacements.push(...shard.placements.map((placement) => expandEssentialPlacement(placement, map.mapSpaceId)));
      candidateRegions.push(...shard.regions);
    }
    const imagery: unknown = JSON.parse(readFileSync(join(candidateDirectory, map.imagery.path), "utf8"));
    Assert(StaticImagerySchema, imagery);
    candidateLayers.push(...imagery.layers);
  }
  for (const reference of candidateRoot.entitySearch) {
    const resource: unknown = JSON.parse(readFileSync(join(candidateDirectory, reference.path), "utf8"));
    Assert(StaticEntitySearchSchema, resource);
    candidateEntityKeys.push(...resource.entities.map((entity) => entity.entityKey));
  }
  for (const reference of candidateRoot.itemSearch) {
    const resource: unknown = JSON.parse(readFileSync(join(candidateDirectory, reference.path), "utf8"));
    Assert(StaticItemSearchSchema, resource);
    candidateItemKeys.push(...resource.items.map((item) => item.itemKey));
  }
  const candidate = summarize(candidatePlacements, { maps: candidateRoot.maps, world: candidateRoot.world, tileLayers: candidateLayers }, candidateEntityKeys, candidateItemKeys, candidateRegions);
  const deployed = summarize(baseline.placements, baseline, baseline.entityIndex.map((entity) => entity.entityKey), baseline.itemIndex.map((item) => item.itemKey), baseline.regions);
  assertNonRegressivePublication(candidate, deployed);
}
