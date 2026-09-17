import type { Database } from "bun:sqlite";
import { createReadStream } from "node:fs";
import { createGzip } from "node:zlib";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Assert } from "typebox/value";
import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import { queryCatalogCoverage, queryCatalogMaps, type CatalogGateResult } from "@afallon/catalog";
import { StaticCoverageSchema, StaticRootManifestSchema, type PublicWorldOffset, type StaticCoverage, type StaticRootManifest } from "@afallon/contracts/public";
import { generateGuideResources } from "./guide-resources";
import { generateImageryResources } from "./imagery";
import { generateIndexResources } from "./index-resources";
import { generateMapShards } from "./map-shards";
import { PUBLICATION_ESSENTIAL_BUDGET, PUBLICATION_PART_BUDGET, PUBLICATION_ROOT_BUDGET, writeStaticJson, type GeneratedStaticResource } from "./resources";
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

export async function buildStaticPublication(db: Database, store: ArtifactStore, mode: "preview" | "release", gate: CatalogGateResult, worldOffsets: readonly PublicWorldOffset[], capturedMapSpaceIds: readonly string[] = [], protection?: ObjectWriteProtection): Promise<StaticPublicationBuildResult> {
  if (!gate.accepted) throw new Error("Publication candidate failed its catalog gate.");
  const imagery = await generateImageryResources(db, store, protection);
  for (const map of imagery) for (const layer of map.resource.value.layers) {
    if (layer.kind === "captured" && !capturedMapSpaceIds.includes(layer.mapSpaceId)) throw new Error(`Captured imagery is outside the reviewed overworld scope: ${layer.id}.`);
  }
  const publishedMapIds = new Set(imagery.map((entry) => entry.mapSpaceId));
  const allMaps = queryCatalogMaps(db).records;
  const allMapIds = new Set(allMaps.map((map) => map.mapSpaceId));
  for (const mapId of publishedMapIds) if (!allMapIds.has(mapId)) throw new Error(`Imagery references an unknown catalog map: ${mapId}.`);
  const publishedOffsets = worldOffsets.filter((offset) => publishedMapIds.has(offset.mapSpaceId)).sort((left, right) => left.mapSpaceId.localeCompare(right.mapSpaceId));
  if (publishedOffsets.length !== publishedMapIds.size || new Set(publishedOffsets.map((offset) => offset.mapSpaceId)).size !== publishedMapIds.size) throw new Error("Publication requires one reviewed world offset per published map.");
  const mapShards = await generateMapShards(db, store, publishedOffsets, protection, publishedMapIds);
  const imageryByMap = new Map(imagery.map((entry) => [entry.mapSpaceId, entry.resource]));
  const indexes = await generateIndexResources(db, store, protection);
  const guides = await generateGuideResources(db, store, [...indexes.entityDetails.values()].map((resource) => resource.value.entity), protection);
  const coverageQuery = queryCatalogCoverage(db);
  const coverage: StaticCoverage = {
    schemaVersion: "compendium.static-coverage.v1", buildId: coverageQuery.buildId, catalogId: coverageQuery.catalogId,
    complete: gate.complete, unresolvedIssueCount: coverageQuery.records.unresolvedIssues.length,
    occurrenceCount: coverageQuery.records.occurrenceCount, exclusionCount: coverageQuery.records.exclusions.length,
    messages: gate.complete ? [] : ["This preview has unresolved catalog coverage."],
  };
  Assert(StaticCoverageSchema, coverage);
  const coverageResource = await writeStaticJson(store, coverage.schemaVersion, coverage, protection);
  const offsetByMap = new Map(worldOffsets.map((offset) => [offset.mapSpaceId, offset]));
  const maps = mapShards.map((entry) => {
    const mapImagery = imageryByMap.get(entry.summary.mapSpaceId), offset = offsetByMap.get(entry.summary.mapSpaceId);
    if (!mapImagery || !offset) throw new Error(`Publication map has no imagery metadata or reviewed world offset: ${entry.summary.mapSpaceId}.`);
    const bounds = structuredClone(entry.summary.bounds);
    for (const layer of mapImagery.value.layers) {
      bounds.min.x = Math.min(bounds.min.x, layer.extent[0] + offset.worldX);
      bounds.min.y = Math.min(bounds.min.y, layer.extent[1] + offset.worldY);
      bounds.max.x = Math.max(bounds.max.x, layer.extent[2] + offset.worldX);
      bounds.max.y = Math.max(bounds.max.y, layer.extent[3] + offset.worldY);
    }
    return { ...entry.summary, bounds, imagery: mapImagery.reference };
  });
  if (maps.length === 0) throw new Error("Publication has no maps.");
  const worldBounds = maps.reduce((bounds, map) => ({ min: { x: Math.min(bounds.min.x, map.bounds.min.x), y: Math.min(bounds.min.y, map.bounds.min.y) }, max: { x: Math.max(bounds.max.x, map.bounds.max.x), y: Math.max(bounds.max.y, map.bounds.max.y) } }), structuredClone(maps[0]!.bounds));
  const manifest: StaticRootManifest = {
    schemaVersion: "compendium.static-root.v2", buildId: coverageQuery.buildId, catalogId: coverageQuery.catalogId, mode, complete: gate.complete,
    world: { mapSpaceId: "world", label: "Afallon", bounds: worldBounds, offsets: publishedOffsets, unplacedMapSpaceIds: [...allMapIds].filter((mapSpaceId) => !publishedMapIds.has(mapSpaceId)).sort() },
    maps, entitySearch: indexes.entitySearch.map((resource) => resource.reference), itemSearch: indexes.itemSearch.map((resource) => resource.reference),
    guides: Object.fromEntries([...guides].map(([section, resource]) => [section, resource.reference])), coverage: coverageResource.reference,
  };
  Assert(StaticRootManifestSchema, manifest);
  const rootResource = await writeStaticJson(store, manifest.schemaVersion, manifest, protection);
  const groups: Record<string, GeneratedStaticResource<unknown>[]> = {
    root: [rootResource], atlas: mapShards.flatMap((entry) => entry.resources), imageryMetadata: imagery.map((entry) => entry.resource),
    entitySearch: indexes.entitySearch, itemSearch: indexes.itemSearch, optionalGeometry: mapShards.flatMap((entry) => entry.geometry),
    selectedDetails: [...indexes.entityDetails.values(), ...indexes.itemSources.values()], guides: [...guides.values()], coverage: [coverageResource],
  };
  if (rootResource.identity.bytes > PUBLICATION_ROOT_BUDGET) throw new Error(`Publication root exceeds ${PUBLICATION_ROOT_BUDGET} bytes: ${rootResource.identity.bytes}.`);
  for (const group of [groups.atlas!, groups.entitySearch!, groups.itemSearch!, groups.optionalGeometry!]) for (const resource of group) {
    if (resource.identity.bytes > PUBLICATION_PART_BUDGET) throw new Error(`Publication part exceeds ${PUBLICATION_PART_BUDGET} bytes: ${resource.reference.path}.`);
  }
  const essentialBytes = [...groups.root!, ...groups.atlas!, ...groups.imageryMetadata!, ...groups.coverage!].reduce((sum, resource) => sum + resource.identity.bytes, 0);
  if (essentialBytes > PUBLICATION_ESSENTIAL_BUDGET) throw new Error(`Essential publication exceeds ${PUBLICATION_ESSENTIAL_BUDGET} bytes: ${essentialBytes}.`);
  const resources = [...new Map(Object.entries(groups).filter(([name]) => name !== "root").flatMap(([, values]) => values).map((resource) => [resource.reference.path, { reference: resource.reference, identity: resource.identity }])).values()];
  const assetsByHash = new Map<string, PublicationCandidateAsset>();
  for (const entry of imagery) for (const layer of entry.resource.value.layers) for (const tile of layer.tiles) assetsByHash.set(tile.sha256, { path: tile.url, identity: { sha256: tile.sha256, bytes: tile.bytes } });
  const assets = [...assetsByHash.values()].sort((left, right) => left.path.localeCompare(right.path));
  const root = { reference: rootResource.reference, identity: rootResource.identity };
  await verifyPublicationGraph(store, root, resources, assets, gate);
  const measurements: PublicationMeasurements = { groups: {}, essentialBytes, essentialRequests: groups.root!.length + groups.atlas!.length + groups.imageryMetadata!.length + groups.coverage!.length, applicationCode: { bytes: null, reason: "Application code is measured separately by the static site build." } };
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
  return { manifest, root, resources, assets, measurements };
}
