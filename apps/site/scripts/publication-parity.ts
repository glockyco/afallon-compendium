import type { StaticResourceReference } from "@afallon/contracts/public";
import { readPublicationBaseline } from "./publication-graph";

type Bounds = { min: { x: number; y: number }; max: { x: number; y: number } };

/** The imagery fields that parity compares. */
export interface ParityTileLayer {
  id: string;
  mapSpaceId: string;
  kind: string;
  tileSize: number;
  minZoom: number;
  maxZoom: number;
  extent: readonly [number, number, number, number];
  tiles: ReadonlyArray<{ z: number; x: number; y: number; sha256: string }>;
}
type PublishedPlacementLocation = { mapSpaceId: string; position: readonly [number, number]; categories: readonly string[]; entityKeys?: readonly string[]; itemKeys?: readonly string[] };

export interface PublicationSummary {
  mapIds: Set<string>;
  offsets: Map<string, { worldX: number; worldY: number }>;
  placementsByMap: Map<string, number>;
  placementsByCategory: Map<string, number>;
  tileLayers: Map<string, ParityTileLayer>;
  /** Every published entity key: search records, pages, the variants of a page, and the versions of an ability. */
  entityKeys: Set<string>;
  itemKeys: Set<string>;
  regionKeys: Set<string>;
  placementIds: Set<string>;
  placementLocations: Map<string, PublishedPlacementLocation>;
  boundsByMap: Map<string, Bounds>;
  listKinds: Set<string>;
  /** Kinds whose current registry declares a list, including recipes without pages. */
  declaredListKinds?: Set<string>;
  /** The kinds that have pages. A kind can lose its pages when its entities move onto other pages. */
  pageKinds: Set<string>;
  artworkAssets: Set<string>;
  /** For each artwork file, the keys of the pages, list rows, and search entries that show it. */
  artworkOwners: Map<string, Set<string>>;
  /** The keys that the reviewed exclusion list of this publication names. A baseline without the list has none. */
  excludedKeys: Set<string>;
  /** Derived copies omitted from the map and the host object that proves each one. */
  placementCopies: Map<string, string>;
  placementCount: number;
}

/** A publication graph. A baseline from an earlier release uses the schemas of that release. */
export interface PublicationView {
  publication: unknown;
  resources: ReadonlyMap<string, unknown>;
  references: ReadonlyMap<string, StaticResourceReference>;
}

type Json = Record<string, unknown>;
const object = (value: unknown): Json => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
const array = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string => typeof value === "string" ? value : "";
const number = (value: unknown): number => typeof value === "number" ? value : Number.NaN;
const point = (value: unknown): { x: number; y: number } => {
  const record = object(value);
  return { x: number(record.x), y: number(record.y) };
};

function tileLayer(value: unknown): ParityTileLayer {
  const layer = object(value);
  const [minX = Number.NaN, minY = Number.NaN, maxX = Number.NaN, maxY = Number.NaN] = array(layer.extent).map(number);
  return {
    id: text(layer.id), mapSpaceId: text(layer.mapSpaceId), kind: text(layer.kind),
    tileSize: number(layer.tileSize), minZoom: number(layer.minZoom), maxZoom: number(layer.maxZoom), extent: [minX, minY, maxX, maxY],
    tiles: array(layer.tiles).map(object).map((tile) => ({ z: number(tile.z), x: number(tile.x), y: number(tile.y), sha256: text(tile.sha256) })),
  };
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

// The artwork files inside a value, found by shape: an image reference has a url under `art/`.
function artUrls(value: unknown, into: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const entry of value) artUrls(entry, into);
    return into;
  }
  if (value === null || typeof value !== "object") return into;
  const record = value as Json;
  if (typeof record.url === "string" && record.url.startsWith("art/")) into.push(record.url);
  for (const child of Object.values(record)) artUrls(child, into);
  return into;
}

/**
 * Reads the parity facts of a publication by field names, so one reader serves the candidate and a baseline from an
 * earlier schema version.
 */
export function summarizePublication(graph: PublicationView): PublicationSummary {
  const root = object(graph.publication), resource = (reference: unknown) => object(graph.resources.get(text(object(reference).path)));
  const maps = array(root.maps).map(object);
  const placements: Array<{ placementId: string; mapSpaceId: string; position: readonly [number, number]; categories: readonly string[]; entityKeys: readonly string[]; itemKeys: readonly string[] }> = [];
  const regions: Json[] = [], layers: ParityTileLayer[] = [], searchKeys: string[] = [], itemKeys: string[] = [], entityKeys = new Set<string>(), listKinds = new Set<string>(), pageKinds = new Set<string>();
  for (const map of maps) {
    const mapSpaceId = text(map.mapSpaceId);
    for (const part of array(map.parts)) {
      const shard = resource(part);
      for (const tuple of array(shard.placements)) {
        const [placementId, position, , , categories, entityKeys, itemKeys] = array(tuple);
        const [x = Number.NaN, y = Number.NaN] = array(position).map(number);
        placements.push({ placementId: text(placementId), mapSpaceId, position: [x, y], categories: array(categories).map(text), entityKeys: array(entityKeys).map(text), itemKeys: array(itemKeys).map(text) });
      }
      regions.push(...array(shard.regions).map(object));
    }
    layers.push(...array(resource(map.imagery).layers).map(tileLayer));
  }
  for (const reference of array(root.search)) for (const entry of array(resource(reference).entries)) {
    const ref = object(object(entry).ref);
    searchKeys.push(text(ref.key));
    if (ref.kind === "items") itemKeys.push(text(ref.key));
  }
  for (const key of uniqueSet(searchKeys, "searchable entity")) entityKeys.add(key);
  const artworkOwners = new Map<string, Set<string>>();
  const own = (key: unknown, value: unknown) => { for (const url of artUrls(value)) artworkOwners.set(url, (artworkOwners.get(url) ?? new Set()).add(text(key))); };
  for (const value of graph.resources.values()) {
    const record = object(value), document = object(record.document);
    if (Array.isArray(record.rows) && typeof record.kind === "string") listKinds.add(record.kind);
    for (const row of array(record.rows)) own(object(object(row).ref).key, object(row).ref);
    for (const entry of array(record.entries)) own(object(object(entry).ref).key, object(entry).ref);
    if (!("ref" in document)) continue;
    own(object(document.ref).key, document);
    pageKinds.add(text(object(document.ref).kind));
    entityKeys.add(text(object(document.ref).key));
    for (const variant of array(document.variants)) entityKeys.add(text(object(variant).key));
    for (const version of array(document.versions)) for (const key of array(object(version).keys)) entityKeys.add(text(key));
    for (const craft of [document.crafting, document.teaches]) entityKeys.add(text(object(object(craft).recipe).key));
    for (const row of array(document.recipes)) entityKeys.add(text(object(object(row).recipe).key));
    // A gear set has no page. It is published in full on the page of each member item.
    entityKeys.add(text(object(object(document.facts).gearSet).key));
  }
  entityKeys.delete("");
  const placementsByMap = new Map<string, number>(), placementsByCategory = new Map<string, number>(), placementIds = new Set<string>();
  for (const placement of placements) {
    if (placementIds.has(placement.placementId)) throw new Error(`Publication repeats placement ${placement.placementId}.`);
    placementIds.add(placement.placementId);
    increment(placementsByMap, placement.mapSpaceId);
    for (const category of placement.categories) increment(placementsByCategory, category);
  }
  const tileLayers = new Map<string, ParityTileLayer>();
  for (const layer of layers) {
    const key = `${layer.mapSpaceId}:${layer.kind}:${layer.id}`;
    if (tileLayers.has(key)) throw new Error(`Publication repeats imagery layer ${key}.`);
    tileLayers.set(key, layer);
  }
  const offsets = new Map(array(object(root.world).offsets).map(object).filter((offset) => offset.status === "placed")
    .map((offset) => [text(offset.mapSpaceId), { worldX: number(offset.worldX), worldY: number(offset.worldY) }] as const));
  // A region stays when its identity and its geometry stay. Its displayed name is presentation.
  const regionKeys = regions.map((region) => {
    const offset = offsets.get(text(region.mapSpaceId));
    if (!offset) throw new Error(`Publication lacks a placed world offset for region ${text(region.id)}.`);
    return JSON.stringify({
      mapSpaceId: region.mapSpaceId,
      id: region.id,
      shape: region.shape,
      polygon: array(region.polygon).map((vertex) => {
        const [x = Number.NaN, y = Number.NaN] = array(vertex).map(number);
        return [Math.round((x - offset.worldX) * 1e6) / 1e6, Math.round((y - offset.worldY) * 1e6) / 1e6];
      }),
    });
  });
  return {
    mapIds: new Set(maps.map((map) => text(map.mapSpaceId))),
    offsets,
    placementsByMap, placementsByCategory, tileLayers,
    entityKeys, itemKeys: uniqueSet(itemKeys, "searchable item"),
    regionKeys: uniqueSet(regionKeys, "map region"),
    placementIds,
    placementLocations: new Map(placements.map((placement) => [placement.placementId, { mapSpaceId: placement.mapSpaceId, position: placement.position, categories: placement.categories, entityKeys: placement.entityKeys, itemKeys: placement.itemKeys }])),
    boundsByMap: new Map(maps.map((map) => [text(map.mapSpaceId), { min: point(object(map.bounds).min), max: point(object(map.bounds).max) }])),
    listKinds, declaredListKinds: new Set(array(root.kinds).map(object).filter((entry) => entry.list === true || entry.list === undefined && entry.pages === true).map((entry) => text(entry.kind))), pageKinds,
    artworkAssets: new Set([...graph.references.values()].filter((reference) => reference.schemaId === "image/webp" && reference.path.startsWith("art/")).map((reference) => reference.path)),
    artworkOwners,
    excludedKeys: new Set(array(resource(root.exclusions).exclusions).map((entry) => text(object(entry).key)).filter(Boolean)),
    placementCopies: new Map(array(resource(root.exclusions).placementCopies).map((entry) => {
      const copy = object(entry);
      return [text(copy.placementId), text(copy.hostPlacementId)] as const;
    })),
    placementCount: placements.length,
  };
}

function assertAtLeast(candidate: Map<string, number>, baseline: Map<string, number>, subject: string): void {
  const deficits = [...baseline].filter(([key, count]) => (candidate.get(key) ?? 0) < count).map(([key, count]) => `${key}: ${candidate.get(key) ?? 0} < ${count}`);
  if (deficits.length > 0) throw new Error(`Publication regresses ${subject}: ${deficits.join(", ")}.`);
}

function assertContains(candidate: Set<string>, baseline: Set<string>, subject: string, excused: (key: string) => boolean = () => false): void {
  const missing = [...baseline].filter((key) => !candidate.has(key) && !excused(key));
  if (missing.length === 0) return;
  const remainder = missing.length > 20 ? ` (+${missing.length - 20} more)` : "";
  throw new Error(`Publication removes ${subject}: ${missing.slice(0, 20).join(", ")}${remainder}.`);
}

// The candidate may leave out an entity that its exclusion list names, and the artwork that only such entities showed.
function assertListedRemovals(candidate: PublicationSummary, baseline: PublicationSummary): void {
  const excluded = (key: string) => candidate.excludedKeys.has(key);
  assertContains(candidate.entityKeys, baseline.entityKeys, "published entities", excluded);
  assertContains(candidate.itemKeys, baseline.itemKeys, "searchable items", excluded);
  assertContains(candidate.artworkAssets, baseline.artworkAssets, "published artwork", (path) => {
    const owners = baseline.artworkOwners.get(path);
    return owners !== undefined && owners.size > 0 && [...owners].every(excluded);
  });
}

// A page may group entities or change its URL. Parity requires every entity to stay published, not every URL.
export function assertNonRegressivePublication(candidate: PublicationSummary, baseline: PublicationSummary): void {
  const missingMaps = [...baseline.mapIds].filter((mapSpaceId) => !candidate.mapIds.has(mapSpaceId));
  if (missingMaps.length > 0) throw new Error(`Publication removes map spaces: ${missingMaps.join(", ")}.`);
  if (candidate.placementCount < baseline.placementCount) throw new Error(`Publication regresses placement coverage: ${candidate.placementCount} < ${baseline.placementCount}.`);
  assertContains(candidate.placementIds, baseline.placementIds, "deployed placements");
  assertAtLeast(candidate.placementsByMap, baseline.placementsByMap, "per-map placement coverage");
  assertAtLeast(candidate.placementsByCategory, baseline.placementsByCategory, "per-category placement coverage");
  assertListedRemovals(candidate, baseline);
  assertContains(candidate.regionKeys, baseline.regionKeys, "map regions");
  assertContains(candidate.listKinds, new Set([...baseline.listKinds].filter((kind) => (candidate.declaredListKinds ?? candidate.pageKinds).has(kind))), "published lists");
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

// A baseline that the reader cannot read summarizes as empty, and every check would pass against it.
function summarizeBaseline(baseline: PublicationView): PublicationSummary {
  const summary = summarizePublication(baseline);
  if (summary.mapIds.size === 0 || summary.placementCount === 0 || summary.entityKeys.size === 0) throw new Error("Baseline publication has no readable maps, placements, or entities.");
  return summary;
}

export function verifyPublicationParity(candidate: PublicationView, baselineRoot: string): void {
  assertNonRegressivePublication(summarizePublication(candidate), summarizeBaseline(readPublicationBaseline(baselineRoot)));
}

export function assertUpdatePublicationParity(candidate: PublicationSummary, baseline: PublicationSummary): void {
  const missingMaps = [...baseline.mapIds].filter((mapSpaceId) => !candidate.mapIds.has(mapSpaceId));
  if (missingMaps.length > 0) throw new Error(`Publication update removes map spaces: ${missingMaps.join(", ")}.`);
  if (candidate.placementCount < baseline.placementCount) throw new Error(`Publication update regresses placement coverage: ${candidate.placementCount} < ${baseline.placementCount}.`);
}

function within(bounds: { min: { x: number; y: number }; max: { x: number; y: number } }, position: readonly [number, number]): boolean {
  return position[0] >= bounds.min.x && position[1] >= bounds.min.y && position[0] < bounds.max.x && position[1] < bounds.max.y;
}

// Objects that the game places at run time can shift slightly between two scans of one build. Four interactables
// moved by up to about 1 map unit on build 25434619. A correction may move a placement by less than this distance,
// which is well under the size of a map marker.
const PLACEMENT_CORRECTION_TOLERANCE = 2;

export function assertCorrectedPublicationParity(candidate: PublicationSummary, baseline: PublicationSummary): void {
  const missingMaps = [...baseline.mapIds].filter((mapSpaceId) => !candidate.mapIds.has(mapSpaceId));
  if (missingMaps.length > 0) throw new Error(`Publication correction removes map spaces: ${missingMaps.join(", ")}.`);
  if ([...candidate.placementCopies].some(([id, hostId]) => !id || !hostId || id === hostId || candidate.placementIds.has(id))) {
    throw new Error("Publication correction declares a copy without a distinct, omitted host placement.");
  }
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
    return Math.hypot((placement.position[0] - candidateOffset.worldX) - (previous.position[0] - baselineOffset.worldX),
      (placement.position[1] - candidateOffset.worldY) - (previous.position[1] - baselineOffset.worldY)) > PLACEMENT_CORRECTION_TOLERANCE;
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
    const hostId = candidate.placementCopies.get(id);
    if (hostId) {
      const sameMarker = (replacement: PublishedPlacementLocation) =>
        replacement.mapSpaceId === placement.mapSpaceId
        && Math.abs(replacement.position[0] - translatedPosition[0]) < 0.05
        && Math.abs(replacement.position[1] - translatedPosition[1]) < 0.05
        && JSON.stringify(replacement.categories) === JSON.stringify(placement.categories)
        && JSON.stringify(replacement.entityKeys ?? []) === JSON.stringify(placement.entityKeys ?? [])
        && JSON.stringify(replacement.itemKeys ?? []) === JSON.stringify(placement.itemKeys ?? []);
      const host = candidate.placementLocations.get(hostId);
      if (host ? sameMarker(host) : [...candidate.placementLocations.values()].some(sameMarker)) return false;
    }
    const foldedIntoDungeon = placement.categories.length === 1 && placement.categories[0] === "travelPoint" && [...candidate.placementLocations.values()].some((replacement) => replacement.mapSpaceId === placement.mapSpaceId && replacement.categories.includes("dungeonEntrance") && replacement.categories.includes("travelPoint") && Math.hypot(replacement.position[0] - translatedPosition[0], replacement.position[1] - translatedPosition[1]) <= 6);
    return !foldedIntoDungeon;
  });
  if (unexpectedRemovals.length > 0) throw new Error(`Publication correction removes in-bounds placements: ${unexpectedRemovals.slice(0, 20).map(([id]) => id).join(", ")}.`);
  assertListedRemovals(candidate, baseline);
  assertContains(candidate.regionKeys, baseline.regionKeys, "map regions");
  assertContains(candidate.listKinds, new Set([...baseline.listKinds].filter((kind) => candidate.pageKinds.has(kind))), "published lists");
}

export function verifyUpdatePublicationParity(candidate: PublicationView, baselineRoot: string): void {
  const baseline = readPublicationBaseline(baselineRoot), candidateSummary = summarizePublication(candidate), baselineSummary = summarizeBaseline(baseline);
  if (object(candidate.publication).buildId === object(baseline.publication).buildId) assertCorrectedPublicationParity(candidateSummary, baselineSummary);
  else assertUpdatePublicationParity(candidateSummary, baselineSummary);
}
