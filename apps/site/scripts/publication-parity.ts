import {
  expandEssentialPlacement,
  isStaticDocument,
  type PublicPlacement,
  type PublicRegion,
  type PublicTileLayer,
  type StaticImagery,
  type StaticKindList,
  type StaticMapShard,
  type StaticPages,
  type StaticSearchIndex,
  type VerifiedPublicationGraph,
} from "@afallon/contracts/public";
import { verifyPublicationGraph } from "./publication-graph";

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
  pageEntries: Set<string>;
  documentKeys: Set<string>;
  listKinds: Set<string>;
  artworkAssets: Set<string>;
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

function summarize(graph: VerifiedPublicationGraph): PublicationSummary {
  const placements: PublicPlacement[] = [], regions: PublicRegion[] = [], layers: PublicTileLayer[] = [], searchKeys: string[] = [], itemKeys: string[] = [];
  const pageEntries: string[] = [], documentKeys: string[] = [], listKinds: string[] = [];
  for (const map of graph.publication.maps) {
    for (const reference of map.parts) {
      const shard = graph.resources.get(reference.path) as StaticMapShard;
      placements.push(...shard.placements.map((placement) => expandEssentialPlacement(placement, map.mapSpaceId)));
      regions.push(...shard.regions);
    }
    const imagery = graph.resources.get(map.imagery.path) as StaticImagery;
    layers.push(...imagery.layers);
  }
  for (const reference of graph.publication.search) {
    const resource = graph.resources.get(reference.path) as StaticSearchIndex;
    for (const entry of resource.entries) {
      searchKeys.push(entry.ref.key);
      if (entry.ref.kind === "items") itemKeys.push(entry.ref.key);
    }
  }
  const pages = graph.resources.get(graph.publication.pages.path) as StaticPages;
  for (const page of pages.entries) pageEntries.push(`${page.kind}/${page.slug}=${page.key}`);
  for (const resource of graph.resources.values()) {
    if (isStaticDocument(resource)) documentKeys.push(resource.document.ref.key);
    else if (resource.schemaVersion === "compendium.static-kind-list.v1") {
      const list = resource as StaticKindList;
      listKinds.push(`${list.kind}:${list.part}`);
    }
  }
  const placementsByMap = new Map<string, number>(), placementsByCategory = new Map<string, number>(), placementIds = new Set<string>();
  for (const placement of placements) {
    if (placementIds.has(placement.placementId)) throw new Error(`Publication repeats placement ${placement.placementId}.`);
    placementIds.add(placement.placementId);
    increment(placementsByMap, placement.mapSpaceId);
    for (const category of placement.categories) increment(placementsByCategory, category);
  }
  const tileLayers = new Map<string, PublicTileLayer>();
  for (const layer of layers) {
    const key = `${layer.mapSpaceId}:${layer.kind}:${layer.id}`;
    if (tileLayers.has(key)) throw new Error(`Publication repeats imagery layer ${key}.`);
    tileLayers.set(key, layer);
  }
  return {
    mapIds: new Set(graph.publication.maps.map((map) => map.mapSpaceId)),
    offsets: new Map(graph.publication.world.offsets.filter((offset) => offset.status === "placed").map((offset) => [offset.mapSpaceId, { worldX: offset.worldX, worldY: offset.worldY }])),
    placementsByMap, placementsByCategory, tileLayers,
    entityKeys: uniqueSet(searchKeys, "searchable entity"), itemKeys: uniqueSet(itemKeys, "searchable item"),
    regionKeys: uniqueSet(regions.map((region) => JSON.stringify({ mapSpaceId: region.mapSpaceId, name: region.name, shape: region.shape, polygon: region.polygon })), "map region"),
    placementIds, pageEntries: uniqueSet(pageEntries, "page"), documentKeys: uniqueSet(documentKeys, "document"), listKinds: uniqueSet(listKinds, "kind list"),
    artworkAssets: new Set([...graph.references.values()].filter((reference) => reference.schemaId === "image/webp" && reference.path.startsWith("art/")).map((reference) => reference.path)),
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
  assertContains(candidate.pageEntries, baseline.pageEntries, "published pages");
  assertContains(candidate.documentKeys, baseline.documentKeys, "published documents");
  assertContains(candidate.listKinds, baseline.listKinds, "published lists");
  assertContains(candidate.artworkAssets, baseline.artworkAssets, "published artwork");
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

export function verifyPublicationParity(candidate: VerifiedPublicationGraph, baselineRoot: string): void {
  const baseline = verifyPublicationGraph(baselineRoot);
  assertNonRegressivePublication(summarize(candidate), summarize(baseline));
}
