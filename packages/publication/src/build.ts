import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import { queryCatalogCoverage, queryCatalogImagery, type CatalogGateResult } from "@afallon/catalog";
import { StaticCoverageSchema, StaticRootManifestSchema, type StaticCoverage, type StaticRootManifest } from "@afallon/contracts/public";
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
): Promise<StaticPublicationBuildResult> {
  const mapShards = await generateMapShards(db, store);
  const imagery = await generateImageryResources(db, store);
  const imageryByMap = new Map(imagery.map((entry) => [entry.mapSpaceId, entry.resource]));
  const indexes = await generateIndexResources(db, store);
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
  const maps = mapShards.map((entry) => {
    const mapImagery = imageryByMap.get(entry.summary.mapSpaceId);
    if (!mapImagery) throw new Error(`Publication map has no imagery metadata: ${entry.summary.mapSpaceId}.`);
    return { ...entry.summary, imagery: mapImagery.reference };
  });
  const manifest: StaticRootManifest = {
    schemaVersion: "compendium.static-root.v1",
    buildId: coverageQuery.buildId,
    catalogId: coverageQuery.catalogId,
    mode,
    complete: gate.complete,
    maps,
    entitySearch: indexes.entitySearch.reference,
    itemSearch: indexes.itemSearch.reference,
    coverage: coverageResource.reference,
  };
  Assert(StaticRootManifestSchema, manifest);
  const rootResource = await writeStaticJson(store, manifest.schemaVersion, manifest);
  const generated = [
    ...mapShards.map((entry) => entry.resource),
    ...imagery.map((entry) => entry.resource),
    indexes.entitySearch,
    indexes.itemSearch,
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
