import type { Database } from "bun:sqlite";
import { createReadStream } from "node:fs";
import { createGzip } from "node:zlib";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Assert } from "typebox/value";
import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import { queryCatalogCoverage, queryCatalogMaps, type CatalogGateResult } from "@afallon/catalog";
import {
  StaticCoverageSchema,
  StaticRootManifestSchema,
  type PlacementRef,
  type PublicWorldOffset,
  type StaticCoverage,
  type StaticRootManifest,
} from "@afallon/contracts/public";
import { generateImageryResources } from "./imagery";
import { generateIndexResources } from "./index-resources";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";
import { generateMapShards } from "./map-shards";
import { writeStaticJson, type GeneratedStaticResource } from "./resources";
import { verifyPublicationGraph, type PublicationCandidateAsset, type PublicationCandidateResource } from "./selection";

export interface PublicationResourceGroup { resources: number; bytes: number; gzipBytes: number | null }
export interface PublicationMeasurements {
  groups: Record<string, PublicationResourceGroup>;
  essentialBytes: number;
  essentialRequests: number;
  applicationCode: { bytes: null; reason: string };
}
export interface StaticPublicationBuildResult {
  manifest: StaticRootManifest;
  root: PublicationCandidateResource;
  resources: PublicationCandidateResource[];
  assets: PublicationCandidateAsset[];
  measurements: PublicationMeasurements;
}

export async function buildStaticPublication(
  db: Database,
  store: ArtifactStore,
  mode: "preview" | "release",
  gate: CatalogGateResult,
  worldOffsets: readonly PublicWorldOffset[],
  capturedMapSpaceIds: readonly string[] = [],
  protection?: ObjectWriteProtection,
): Promise<StaticPublicationBuildResult> {
  if (!gate.accepted) throw new Error("Publication candidate failed its catalog gate.");
  const imagery = await generateImageryResources(db, store, protection);
  for (const map of imagery) for (const layer of map.resource.value.layers) {
    if (layer.kind === "captured" && !capturedMapSpaceIds.includes(layer.mapSpaceId)) throw new Error(`Captured imagery is outside the reviewed overworld scope: ${layer.id}.`);
  }
  const publishedMapIds = new Set(imagery.map((entry) => entry.mapSpaceId));
  const allMaps = queryCatalogMaps(db).records;
  const allMapIds = new Set(allMaps.map((map) => map.mapSpaceId));
  const mapSpaceLabels = new Map(allMaps.filter((map) => publishedMapIds.has(map.mapSpaceId)).map((map) => [map.mapSpaceId, map.label]));
  for (const mapId of publishedMapIds) if (!allMapIds.has(mapId)) throw new Error(`Imagery references an unknown catalog map: ${mapId}.`);
  const publishedOffsets = worldOffsets.filter((offset) => publishedMapIds.has(offset.mapSpaceId)).sort((left, right) => left.mapSpaceId.localeCompare(right.mapSpaceId));
  if (publishedOffsets.length !== publishedMapIds.size || new Set(publishedOffsets.map((offset) => offset.mapSpaceId)).size !== publishedMapIds.size) throw new Error("Publication requires one reviewed world offset per published map.");
  const mapShards = await generateMapShards(db, store, publishedOffsets, protection, publishedMapIds);
  const imageryByMap = new Map(imagery.map((entry) => [entry.mapSpaceId, entry.resource]));
  const placements = new Map<string, PlacementRef>();
  const placementIdsByKeySets = new Map<string, Set<string>>();
  const regionIdsByMapSpace = new Map<string, string[]>();
  for (const entry of mapShards) {
    const regionIds = new Set<string>();
    for (const resource of entry.resources) {
      for (const region of resource.value.regions) regionIds.add(region.id);
      for (const placement of resource.value.placements) {
        placements.set(placement[0], { placementId: placement[0], mapSpaceId: entry.summary.mapSpaceId, label: placement[3] });
        for (const key of [...placement[5], ...placement[6]]) {
          const ids = placementIdsByKeySets.get(key) ?? new Set<string>();
          ids.add(placement[0]);
          placementIdsByKeySets.set(key, ids);
        }
      }
    }
    regionIdsByMapSpace.set(entry.summary.mapSpaceId, [...regionIds].sort());
  }
  const placementIdsByKey = new Map([...placementIdsByKeySets].map(([key, ids]) => [key, [...ids].sort()]));
  const indexes = await generateIndexResources(db, store, placements, placementIdsByKey, mapSpaceLabels, regionIdsByMapSpace, protection);
  const coverageQuery = queryCatalogCoverage(db);
  const coverage: StaticCoverage = {
    schemaVersion: "compendium.static-coverage.v1", buildId: coverageQuery.buildId, catalogId: coverageQuery.catalogId,
    complete: gate.complete, unresolvedIssueCount: coverageQuery.records.unresolvedIssues.length + indexes.unresolvedReferenceCount,
    occurrenceCount: coverageQuery.records.occurrenceCount + indexes.unresolvedReferenceCount, exclusionCount: coverageQuery.records.exclusions.length,
    messages: gate.complete ? [] : ["This preview has unresolved catalog coverage."],
  };
  Assert(StaticCoverageSchema, coverage);
  const coverageResource = await writeStaticJson(store, coverage.schemaVersion, coverage, protection);
  const offsetByMap = new Map(worldOffsets.map((offset) => [offset.mapSpaceId, offset]));
  const maps = mapShards.map((entry) => {
    const mapImagery = imageryByMap.get(entry.summary.mapSpaceId), offset = offsetByMap.get(entry.summary.mapSpaceId);
    if (!mapImagery || !offset) throw new Error(`Publication map has no imagery metadata or reviewed world offset: ${entry.summary.mapSpaceId}.`);
    const firstLayer = mapImagery.value.layers[0];
    if (!firstLayer) throw new Error(`Publication map has no imagery layers: ${entry.summary.mapSpaceId}.`);
    const bounds = {
      min: { x: firstLayer.extent[0] + offset.worldX, y: firstLayer.extent[1] + offset.worldY },
      max: { x: firstLayer.extent[2] + offset.worldX, y: firstLayer.extent[3] + offset.worldY },
    };
    for (const layer of mapImagery.value.layers.slice(1)) {
      bounds.min.x = Math.min(bounds.min.x, layer.extent[0] + offset.worldX);
      bounds.min.y = Math.min(bounds.min.y, layer.extent[1] + offset.worldY);
      bounds.max.x = Math.max(bounds.max.x, layer.extent[2] + offset.worldX);
      bounds.max.y = Math.max(bounds.max.y, layer.extent[3] + offset.worldY);
    }
    const hasSpatialContent = entry.resources.some((resource) => resource.value.placements.length > 0 || resource.value.regions.length > 0);
    if (hasSpatialContent) {
      bounds.min.x = Math.min(bounds.min.x, entry.summary.bounds.min.x);
      bounds.min.y = Math.min(bounds.min.y, entry.summary.bounds.min.y);
      bounds.max.x = Math.max(bounds.max.x, entry.summary.bounds.max.x);
      bounds.max.y = Math.max(bounds.max.y, entry.summary.bounds.max.y);
    }
    return { ...entry.summary, bounds, imagery: mapImagery.reference };
  });
  if (maps.length === 0) throw new Error("Publication has no maps.");
  const worldBounds = maps.reduce((bounds, map) => ({
    min: { x: Math.min(bounds.min.x, map.bounds.min.x), y: Math.min(bounds.min.y, map.bounds.min.y) },
    max: { x: Math.max(bounds.max.x, map.bounds.max.x), y: Math.max(bounds.max.y, map.bounds.max.y) },
  }), structuredClone(maps[0]!.bounds));
  const manifest: StaticRootManifest = {
    schemaVersion: "compendium.static-root.v3", buildId: coverageQuery.buildId, catalogId: coverageQuery.catalogId, mode, complete: gate.complete,
    world: { mapSpaceId: "world", label: "Afallon", bounds: worldBounds, offsets: publishedOffsets, unplacedMapSpaceIds: [...allMapIds].filter((mapSpaceId) => !publishedMapIds.has(mapSpaceId)).sort() },
    maps, kinds: [...PUBLIC_KIND_REGISTRY], lists: Object.fromEntries([...indexes.lists].map(([kind, resources]) => [kind, resources.map((resource) => resource.reference)])),
    search: indexes.search.map((resource) => resource.reference), coverage: coverageResource.reference,
  };
  Assert(StaticRootManifestSchema, manifest);
  const rootResource = await writeStaticJson(store, manifest.schemaVersion, manifest, protection);
  const groups: Record<string, GeneratedStaticResource<unknown>[]> = {
    root: [rootResource], atlas: mapShards.flatMap((entry) => entry.resources), imageryMetadata: imagery.map((entry) => entry.resource),
    search: indexes.search, lists: [...indexes.lists.values()].flat(), documents: [...indexes.documents.values()],
    optionalGeometry: mapShards.flatMap((entry) => entry.geometry), coverage: [coverageResource],
  };
  const essentialBytes = [...groups.root!, ...groups.atlas!, ...groups.imageryMetadata!, ...groups.coverage!].reduce((sum, resource) => sum + resource.identity.bytes, 0);
  const resources = [...new Map(Object.entries(groups).filter(([name]) => name !== "root").flatMap(([, values]) => values).map((resource) => [resource.reference.path, { reference: resource.reference, identity: resource.identity }])).values()];
  const assetsByPath = new Map<string, PublicationCandidateAsset>();
  for (const entry of imagery) for (const layer of entry.resource.value.layers) for (const tile of layer.tiles) assetsByPath.set(tile.url, { path: tile.url, identity: { sha256: tile.sha256, bytes: tile.bytes } });
  for (const asset of indexes.artwork) assetsByPath.set(asset.path, asset);
  const assets = [...assetsByPath.values()].sort((left, right) => left.path.localeCompare(right.path));
  const root = { reference: rootResource.reference, identity: rootResource.identity };
  await verifyPublicationGraph(store, root, resources, assets, gate);
  const measurements: PublicationMeasurements = {
    groups: {}, essentialBytes,
    essentialRequests: groups.root!.length + groups.atlas!.length + groups.imageryMetadata!.length + groups.coverage!.length,
    applicationCode: { bytes: null, reason: "Application code is measured separately by the static site build." },
  };
  for (const [name, values] of Object.entries(groups)) {
    const unique = [...new Map(values.map((resource) => [resource.identity.sha256, resource])).values()];
    let gzipBytes = 0;
    for (const resource of unique) {
      await pipeline(
        createReadStream(store.objectPath(resource.identity.sha256), { highWaterMark: 1024 * 1024 }),
        createGzip({ level: 9 }),
        new Writable({ write(chunk: Buffer, _encoding, callback) { gzipBytes += chunk.length; callback(); } }),
      );
    }
    measurements.groups[name] = { resources: unique.length, bytes: unique.reduce((sum, resource) => sum + resource.identity.bytes, 0), gzipBytes };
  }
  measurements.groups.images = { resources: assets.length, bytes: assets.reduce((sum, asset) => sum + asset.identity.bytes, 0), gzipBytes: null };
  measurements.groups.artwork = { resources: indexes.artwork.length, bytes: indexes.artwork.reduce((sum, asset) => sum + asset.identity.bytes, 0), gzipBytes: null };
  return { manifest, root, resources, assets, measurements };
}
