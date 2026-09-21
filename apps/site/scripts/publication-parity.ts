import {
  expandEssentialPlacement,
  isStaticDocument,
  type PublicPlacement,
  type PublicRegion,
  type PublicTileLayer,
  type StaticImagery,
  type StaticKindList,
  type StaticMapShard,
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
  placementLocations: Map<string, { mapSpaceId: string; position: readonly [number, number]; categories: readonly string[] }>;
  boundsByMap: Map<string, { min: { x: number; y: number }; max: { x: number; y: number } }>;
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
      if (entry.ref.slug !== undefined && entry.document) pageEntries.push(`${entry.ref.kind}/${entry.ref.slug}=${entry.ref.key}`);
    }
  }
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
  const offsets = new Map(graph.publication.world.offsets.filter((offset) => offset.status === "placed").map((offset) => [offset.mapSpaceId, { worldX: offset.worldX, worldY: offset.worldY }]));
  const regionKeys = regions.map((region) => {
    const offset = offsets.get(region.mapSpaceId);
    if (!offset) throw new Error(`Publication lacks a placed world offset for region ${region.id}.`);
    return JSON.stringify({
      mapSpaceId: region.mapSpaceId,
      id: region.id,
      name: region.name,
      shape: region.shape,
      polygon: region.polygon.map(([x, y]) => [Math.round((x - offset.worldX) * 1e6) / 1e6, Math.round((y - offset.worldY) * 1e6) / 1e6]),
    });
  });
  return {
    mapIds: new Set(graph.publication.maps.map((map) => map.mapSpaceId)),
    offsets,
    placementsByMap, placementsByCategory, tileLayers,
    entityKeys: uniqueSet(searchKeys, "searchable entity"), itemKeys: uniqueSet(itemKeys, "searchable item"),
    regionKeys: uniqueSet(regionKeys, "map region"),
    placementIds,
    placementLocations: new Map(placements.map((placement) => [placement.placementId, { mapSpaceId: placement.mapSpaceId, position: placement.position, categories: placement.categories }])),
    boundsByMap: new Map(graph.publication.maps.map((map) => [map.mapSpaceId, map.bounds])),
    pageEntries: uniqueSet(pageEntries, "page"), documentKeys: uniqueSet(documentKeys, "document"), listKinds: uniqueSet(listKinds, "kind list"),
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

export function assertUpdatePublicationParity(candidate: PublicationSummary, baseline: PublicationSummary): void {
  const missingMaps = [...baseline.mapIds].filter((mapSpaceId) => !candidate.mapIds.has(mapSpaceId));
  if (missingMaps.length > 0) throw new Error(`Publication update removes map spaces: ${missingMaps.join(", ")}.`);
  if (candidate.placementCount < baseline.placementCount) throw new Error(`Publication update regresses placement coverage: ${candidate.placementCount} < ${baseline.placementCount}.`);
}

function within(bounds: { min: { x: number; y: number }; max: { x: number; y: number } }, position: readonly [number, number]): boolean {
  return position[0] >= bounds.min.x && position[1] >= bounds.min.y && position[0] < bounds.max.x && position[1] < bounds.max.y;
}

export function assertCorrectedPublicationParity(candidate: PublicationSummary, baseline: PublicationSummary): void {
  const missingMaps = [...baseline.mapIds].filter((mapSpaceId) => !candidate.mapIds.has(mapSpaceId));
  if (missingMaps.length > 0) throw new Error(`Publication correction removes map spaces: ${missingMaps.join(", ")}.`);
  for (const [mapSpaceId, bounds] of candidate.boundsByMap) {
    const offset = candidate.offsets.get(mapSpaceId);
    const gameMaps = [...candidate.tileLayers.values()].filter((layer) => layer.mapSpaceId === mapSpaceId && layer.kind === "game-map");
    if (!offset || gameMaps.length !== 1) throw new Error(`Publication correction lacks one reviewed game-map extent for ${mapSpaceId}.`);
    const extent = gameMaps[0]!.extent;
    const expected = [extent[0] + offset.worldX, extent[1] + offset.worldY, extent[2] + offset.worldX, extent[3] + offset.worldY];
    if (bounds.min.x !== expected[0] || bounds.min.y !== expected[1] || bounds.max.x !== expected[2] || bounds.max.y !== expected[3]) throw new Error(`Publication correction has non-imagery bounds for ${mapSpaceId}.`);
  }
  const outsideCandidate = [...candidate.placementLocations].filter(([, placement]) => {
    const bounds = candidate.boundsByMap.get(placement.mapSpaceId);
    return !bounds || !within(bounds, placement.position);
  });
  if (outsideCandidate.length > 0) throw new Error(`Publication correction retains out-of-bounds placements: ${outsideCandidate.slice(0, 20).map(([id]) => id).join(", ")}.`);
  const changedLocalPlacements = [...candidate.placementLocations].filter(([id, placement]) => {
    const previous = baseline.placementLocations.get(id);
    if (!previous) return false;
    if (placement.mapSpaceId !== previous.mapSpaceId) return true;
    const candidateOffset = candidate.offsets.get(placement.mapSpaceId), baselineOffset = baseline.offsets.get(previous.mapSpaceId);
    if (!candidateOffset || !baselineOffset) return true;
    return Math.abs((placement.position[0] - candidateOffset.worldX) - (previous.position[0] - baselineOffset.worldX)) > 1e-6
      || Math.abs((placement.position[1] - candidateOffset.worldY) - (previous.position[1] - baselineOffset.worldY)) > 1e-6;
  });
  if (changedLocalPlacements.length > 0) throw new Error(`Publication correction changes local placement coordinates: ${changedLocalPlacements.slice(0, 20).map(([id]) => id).join(", ")}.`);
  const unexpectedRemovals = [...baseline.placementLocations].filter(([id, placement]) => {
    if (candidate.placementIds.has(id)) return false;
    const bounds = candidate.boundsByMap.get(placement.mapSpaceId);
    const candidateOffset = candidate.offsets.get(placement.mapSpaceId), baselineOffset = baseline.offsets.get(placement.mapSpaceId);
    if (!bounds || !candidateOffset || !baselineOffset) return true;
    const translatedPosition = [
      placement.position[0] - baselineOffset.worldX + candidateOffset.worldX,
      placement.position[1] - baselineOffset.worldY + candidateOffset.worldY,
    ] as const;
    if (!within(bounds, translatedPosition)) return false;
    const foldedIntoDungeon = placement.categories.length === 1 && placement.categories[0] === "travelPoint" && [...candidate.placementLocations.values()].some((replacement) => replacement.mapSpaceId === placement.mapSpaceId && replacement.categories.includes("dungeonEntrance") && replacement.categories.includes("travelPoint") && Math.hypot(replacement.position[0] - translatedPosition[0], replacement.position[1] - translatedPosition[1]) <= 6);
    return !foldedIntoDungeon;
  });
  if (unexpectedRemovals.length > 0) throw new Error(`Publication correction removes in-bounds placements: ${unexpectedRemovals.slice(0, 20).map(([id]) => id).join(", ")}.`);
  assertContains(candidate.entityKeys, baseline.entityKeys, "searchable entities");
  assertContains(candidate.itemKeys, baseline.itemKeys, "searchable items");
  assertContains(candidate.regionKeys, baseline.regionKeys, "map regions");
  assertContains(candidate.pageEntries, baseline.pageEntries, "published pages");
  assertContains(candidate.documentKeys, baseline.documentKeys, "published documents");
  assertContains(candidate.listKinds, baseline.listKinds, "published lists");
  assertContains(candidate.artworkAssets, baseline.artworkAssets, "published artwork");
}

export function verifyUpdatePublicationParity(candidate: VerifiedPublicationGraph, baselineRoot: string): void {
  const baseline = verifyPublicationGraph(baselineRoot), candidateSummary = summarize(candidate), baselineSummary = summarize(baseline);
  if (candidate.publication.buildId === baseline.publication.buildId) assertCorrectedPublicationParity(candidateSummary, baselineSummary);
  else assertUpdatePublicationParity(candidateSummary, baselineSummary);
}
