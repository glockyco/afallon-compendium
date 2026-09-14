import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import { queryCatalogCoverage, queryCatalogImagery, queryCatalogMaps, type CatalogGateResult } from "@afallon/catalog";
import { StaticCoverageSchema, StaticRootManifestSchema, type PublicWorldOffset, type StaticCoverage, type StaticRootManifest } from "@afallon/contracts/public";
import { generateGuideResources } from "./guide-resources";
import { generateImageryResources } from "./imagery";
import { generateIndexResources } from "./index-resources";
import { generateMapShards } from "./map-shards";
import { writeStaticJson } from "./resources";
import { selectPublication, type PublicationCandidateAsset, type PublicationCandidateResource, type SelectedPublication } from "./selection";

export interface StaticPublicationBuildResult {
  manifest: StaticRootManifest;
  selection: SelectedPublication;
}

export async function buildStaticPublication(
  db: Database,
  store: ArtifactStore,
  publicationRoot: string,
  mode: "preview" | "release",
  gate: CatalogGateResult,
  worldOffsets: readonly PublicWorldOffset[],
): Promise<StaticPublicationBuildResult> {
  const imagery = await generateImageryResources(db, store);
  const publishedMapIds = new Set(imagery.map((entry) => entry.mapSpaceId));
  const publishedOffsets = worldOffsets.filter((offset) => publishedMapIds.has(offset.mapSpaceId));
  if (publishedOffsets.length !== publishedMapIds.size || new Set(publishedOffsets.map((offset) => offset.mapSpaceId)).size !== publishedMapIds.size) throw new Error("Publication requires one reviewed world offset per published map.");
  const mapShards = (await generateMapShards(db, store, publishedOffsets)).filter((entry) => publishedMapIds.has(entry.summary.mapSpaceId));
  const imageryByMap = new Map(imagery.map((entry) => [entry.mapSpaceId, entry.resource]));
  const indexes = await generateIndexResources(db, store);
  const guides = await generateGuideResources(db, store, [...indexes.entityDetails.values()].map((resource) => resource.value.entity));
  const coverageQuery = queryCatalogCoverage(db);
  const coverage: StaticCoverage = {
    schemaVersion: "compendium.static-coverage.v1",
    buildId: coverageQuery.buildId,
    catalogId: coverageQuery.catalogId,
    complete: gate.complete,
    unresolvedIssueCount: coverageQuery.records.unresolvedIssues.length,
    occurrenceCount: coverageQuery.records.occurrenceCount,
    exclusionCount: coverageQuery.records.exclusions.length,
    messages: gate.complete ? [] : ["This preview has unresolved catalog coverage."],
  };
  Assert(StaticCoverageSchema, coverage);
  const coverageResource = await writeStaticJson(store, coverage.schemaVersion, coverage);
  const offsetByMap = new Map(worldOffsets.map((offset) => [offset.mapSpaceId, offset]));
  const maps = mapShards.map((entry) => {
    const mapImagery = imageryByMap.get(entry.summary.mapSpaceId);
    const offset = offsetByMap.get(entry.summary.mapSpaceId);
    if (!mapImagery || !offset) throw new Error(`Publication map has no imagery metadata or reviewed world offset: ${entry.summary.mapSpaceId}.`);
    const points: Array<[number, number]> = [
      ...mapImagery.value.layers.flatMap((layer) => [[layer.extent[0] + offset.worldX, layer.extent[1] + offset.worldY], [layer.extent[2] + offset.worldX, layer.extent[3] + offset.worldY]] as Array<[number, number]>),
      ...entry.resource.value.placements.flatMap((placement) => [placement.position, ...placement.areas.flat()]),
      ...entry.resource.value.regions.flatMap((region) => region.polygon),
    ];
    const bounds = { min: { x: Math.min(...points.map(([x]) => x)), y: Math.min(...points.map(([, y]) => y)) }, max: { x: Math.max(...points.map(([x]) => x)), y: Math.max(...points.map(([, y]) => y)) } };
    return { ...entry.summary, bounds, imagery: mapImagery.reference };
  });
  if (maps.length === 0) throw new Error("Publication has no maps.");
  const mapPoints = maps.flatMap((map) => [[map.bounds.min.x, map.bounds.min.y], [map.bounds.max.x, map.bounds.max.y]] as Array<[number, number]>);
  const worldBounds = { min: { x: Math.min(...mapPoints.map(([x]) => x)), y: Math.min(...mapPoints.map(([, y]) => y)) }, max: { x: Math.max(...mapPoints.map(([x]) => x)), y: Math.max(...mapPoints.map(([, y]) => y)) } };
  const allMapIds = new Set(queryCatalogMaps(db).records.map((map) => map.mapSpaceId));
  const manifest: StaticRootManifest = {
    schemaVersion: "compendium.static-root.v1",
    buildId: coverageQuery.buildId,
    catalogId: coverageQuery.catalogId,
    mode,
    complete: gate.complete,
    world: { mapSpaceId: "world", label: "Afallon", bounds: worldBounds, offsets: publishedOffsets, unplacedMapSpaceIds: [...allMapIds].filter((mapSpaceId) => !publishedMapIds.has(mapSpaceId)).sort() },
    maps,
    entitySearch: indexes.entitySearch.reference,
    itemSearch: indexes.itemSearch.reference,
    guides: Object.fromEntries([...guides].map(([section, resource]) => [section, resource.reference])),
    coverage: coverageResource.reference,
  };
  Assert(StaticRootManifestSchema, manifest);
  const rootResource = await writeStaticJson(store, manifest.schemaVersion, manifest);
  const generated = [
    ...mapShards.map((entry) => entry.resource),
    ...imagery.map((entry) => entry.resource),
    indexes.entitySearch,
    indexes.itemSearch,
    ...guides.values(),
    ...indexes.entityDetails.values(),
    ...indexes.itemSources.values(),
    coverageResource,
  ];
  const resources: PublicationCandidateResource[] = generated.map((resource) => ({ reference: resource.reference, identity: resource.identity }));
  const assetsByHash = new Map<string, PublicationCandidateAsset>();
  for (const row of queryCatalogImagery(db).records) {
    if (row.metadata === null || typeof row.metadata !== "object" || Array.isArray(row.metadata) || !("tiles" in row.metadata)) continue;
    const tiles = row.metadata.tiles;
    if (!Array.isArray(tiles)) continue;
    for (const tile of tiles) {
      if (tile === null || typeof tile !== "object" || !("sha256" in tile) || !("bytes" in tile) || typeof tile.sha256 !== "string" || typeof tile.bytes !== "number") continue;
      assetsByHash.set(tile.sha256, { path: `assets/${tile.sha256}.webp`, identity: { sha256: tile.sha256, bytes: tile.bytes } });
    }
  }
  const selection = await selectPublication(
    store,
    publicationRoot,
    { reference: rootResource.reference, identity: rootResource.identity },
    resources,
    [...assetsByHash.values()],
    gate,
  );
  return { manifest, selection };
}
