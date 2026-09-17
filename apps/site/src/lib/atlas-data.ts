import { Assert } from "typebox/value";
import type { TSchema, Static } from "typebox";
import {
  StaticCoverageSchema, StaticEntityDetailSchema, StaticEntitySearchSchema,
  StaticGuideDocumentSchema, StaticImagerySchema, StaticItemSearchSchema,
  StaticItemSourceSchema, StaticMapShardSchema, StaticGeometrySchema, StaticRootManifestSchema,
  assertStaticResourceIdentity, expandEssentialPlacement, staticResourceSchema,
  type PublicationData, type PublicPlacement, type StaticCoverage, type StaticEntityDetail,
  type StaticEntitySearch, type StaticGuideDocument, type StaticImagery, type StaticItemSearch,
  type StaticItemSource, type StaticGeometry, type StaticResourceReference, type StaticRootManifest,
} from "@afallon/contracts/public";

export type AtlasFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type AtlasRequestState =
  | { status: "idle" | "loading" | "loaded" }
  | { status: "error"; message: string };

export interface AtlasMapData {
  mapSpaceId: string;
  placements: PublicPlacement[];
  regions: PublicationData["regions"];
  imagery: StaticImagery;
}
export interface AtlasIndexes {
  entities: StaticEntitySearch["entities"];
  items: StaticItemSearch["items"];
  entitiesByKey: ReadonlyMap<string, StaticEntitySearch["entities"][number]>;
  itemsByKey: ReadonlyMap<string, StaticItemSearch["items"][number]>;
}

export function atlasPublicationData(root: StaticRootManifest, maps: readonly AtlasMapData[], coverage: StaticCoverage, indexes?: AtlasIndexes): PublicationData {
  const loadedIds = new Set(maps.map((map) => map.mapSpaceId));
  if (maps.length !== root.maps.length || root.maps.some((map) => !loadedIds.has(map.mapSpaceId))) {
    throw new Error("Atlas map parts do not cover every published map.");
  }
  return {
    schemaVersion: "compendium.publication.v13", buildId: root.buildId, mode: root.mode,
    coverage: { complete: coverage.complete, messages: coverage.messages, excludedPlacements: coverage.exclusionCount },
    world: root.world,
    maps: root.maps.map(({ mapSpaceId, label, bounds }) => ({ mapSpaceId, label, bounds })),
    placements: maps.flatMap((map) => map.placements), regions: maps.flatMap((map) => map.regions),
    entityIndex: indexes?.entities.map(({ detail, ...entity }) => ({ ...entity, detailPath: detail.path })) ?? [],
    itemIndex: indexes?.items.map(({ detail, source: _source, ...item }) => ({ ...item, detailPath: detail.path })) ?? [],
    tileLayers: maps.flatMap(({ imagery }) => imagery.layers),
  };
}

export class AtlasDataLoader {
  readonly #requests = new Map<string, Promise<unknown>>();
  readonly #references = new Map<string, string>();
  readonly #states = new Map<string, AtlasRequestState>();
  readonly #fetch: AtlasFetch;
  readonly #base: URL;
  #indexes: Promise<AtlasIndexes> | null = null;

  constructor(fetchImplementation: AtlasFetch, baseUrl: string | URL) {
    this.#fetch = fetchImplementation;
    this.#base = new URL(baseUrl, "http://atlas.invalid/");
  }

  state(path: string): AtlasRequestState { return this.#states.get(path) ?? { status: "idle" }; }

  retryFailed(): void {
    for (const [path, state] of this.#states) {
      if (state.status !== "error") continue;
      this.#requests.delete(path);
      this.#states.delete(path);
    }
    // The aggregate can have failed while its successfully verified parts remain cached.
    this.#indexes = null;
  }

  loadRoot(): Promise<StaticRootManifest> { return this.#loadPath("publication.json", StaticRootManifestSchema); }

  async loadMap(mapSpaceId: string): Promise<AtlasMapData> {
    const root = await this.loadRoot();
    const summary = root.maps.find((map) => map.mapSpaceId === mapSpaceId);
    if (!summary) throw new Error(`Publication has no map ${mapSpaceId}.`);
    const [parts, imagery] = await Promise.all([
      Promise.all(summary.parts.map((reference) => this.#loadReference(reference, StaticMapShardSchema, root))),
      this.#loadReference(summary.imagery, StaticImagerySchema, root),
    ]);
    if (imagery.mapSpaceId !== mapSpaceId) throw new Error(`Imagery identity mismatch for ${mapSpaceId}.`);
    const ids = new Set<string>();
    const placements = parts.flatMap((part, index) => {
      if (part.mapSpaceId !== mapSpaceId || part.part !== index) throw new Error(`Map part identity mismatch for ${mapSpaceId}:${index}.`);
      return part.placements.map((tuple) => {
        const placement = expandEssentialPlacement(tuple, mapSpaceId);
        if (ids.has(placement.placementId)) throw new Error(`Duplicate placement ${placement.placementId}.`);
        ids.add(placement.placementId);
        return placement;
      });
    });
    return { mapSpaceId, placements, regions: parts.flatMap((part) => part.regions), imagery: {
      ...imagery, layers: imagery.layers.map((layer) => ({ ...layer, tiles: layer.tiles.map((tile) => ({ ...tile, url: new URL(tile.url, this.#base).href })) })),
    } };
  }

  async loadMaps(): Promise<AtlasMapData[]> {
    const root = await this.loadRoot();
    const maps = await Promise.all(root.maps.map((map) => this.loadMap(map.mapSpaceId)));
    const ids = new Set<string>();
    for (const map of maps) for (const placement of map.placements) {
      if (ids.has(placement.placementId)) throw new Error(`Duplicate placement ${placement.placementId} across maps.`);
      ids.add(placement.placementId);
    }
    return maps;
  }

  async loadGeometry(mapSpaceId: string): Promise<StaticGeometry[]> {
    const root = await this.loadRoot();
    const map = root.maps.find((summary) => summary.mapSpaceId === mapSpaceId);
    if (!map) throw new Error(`Publication has no map ${mapSpaceId}.`);
    const parts = await Promise.all(map.optionalGeometry.map((reference) => this.#loadReference(reference, StaticGeometrySchema, root)));
    for (const [index, part] of parts.entries()) {
      if (part.mapSpaceId !== mapSpaceId || part.part !== index) throw new Error(`Geometry part identity mismatch for ${mapSpaceId}:${index}.`);
    }
    return parts;
  }

  loadIndexes(): Promise<AtlasIndexes> {
    this.#indexes ??= this.#readIndexes();
    return this.#indexes;
  }

  async #readIndexes(): Promise<AtlasIndexes> {
    const root = await this.loadRoot();
    const [entityParts, itemParts] = await Promise.all([
      Promise.all(root.entitySearch.map((reference) => this.#loadReference(reference, StaticEntitySearchSchema, root))),
      Promise.all(root.itemSearch.map((reference) => this.#loadReference(reference, StaticItemSearchSchema, root))),
    ]);
    for (const parts of [entityParts, itemParts]) for (const [index, part] of parts.entries()) {
      if (part.part !== index) throw new Error(`Search part identity mismatch at ${index}.`);
    }
    const entities = entityParts.flatMap((part) => part.entities);
    const items = itemParts.flatMap((part) => part.items);
    const entitiesByKey = new Map(entities.map((entity) => [entity.entityKey, entity]));
    const itemsByKey = new Map(items.map((item) => [item.itemKey, item]));
    if (entities.length !== entitiesByKey.size || items.length !== itemsByKey.size) throw new Error("Search parts contain duplicate identities.");
    return { entities, items, entitiesByKey, itemsByKey };
  }

  async loadCoverage(): Promise<StaticCoverage> {
    const root = await this.loadRoot();
    return this.#loadReference(root.coverage, StaticCoverageSchema, root);
  }

  async loadGuide(section: string): Promise<StaticGuideDocument> {
    const root = await this.loadRoot();
    const reference = root.guides[section];
    if (!reference) throw new Error(`Publication has no guide section ${section}.`);
    return this.#loadReference(reference, StaticGuideDocumentSchema, root);
  }

  async loadEntity(entityKey: string): Promise<StaticEntityDetail> {
    const root = await this.loadRoot();
    const indexes = await this.loadIndexes();
    const summary = indexes.entitiesByKey.get(entityKey);
    if (!summary) throw new Error(`Publication has no entity ${entityKey}.`);
    const detail = await this.#loadReference(summary.detail, StaticEntityDetailSchema, root);
    if (detail.entity.entityKey !== entityKey) throw new Error(`Entity detail identity mismatch for ${entityKey}.`);
    return detail;
  }

  async loadItemSource(itemKey: string): Promise<StaticItemSource> {
    const root = await this.loadRoot();
    const indexes = await this.loadIndexes();
    const summary = indexes.itemsByKey.get(itemKey);
    if (!summary) throw new Error(`Publication has no item ${itemKey}.`);
    const source = await this.#loadReference(summary.source, StaticItemSourceSchema, root);
    if (source.itemSource.itemKey !== itemKey) throw new Error(`Item-source identity mismatch for ${itemKey}.`);
    return source;
  }

  async #loadReference<T extends TSchema>(reference: StaticResourceReference, schema: T, expected: StaticRootManifest): Promise<Static<T>> {
    const registeredSchema: TSchema = staticResourceSchema(reference.schemaId);
    if (registeredSchema !== schema) throw new Error(`Unexpected resource schema: ${reference.path}.`);
    const value = await this.#loadPath(reference.path, schema, reference);
    assertStaticResourceIdentity(expected, value as Static<T> & { buildId: string; catalogId: string });
    return value;
  }

  #loadPath<T extends TSchema>(path: string, schema: T, expected?: StaticResourceReference): Promise<Static<T>> {
    if (!/^(?:publication\.json|resources\/[a-f0-9]{64}\.json)$/.test(path)) return Promise.reject(new Error(`Unsafe atlas resource path: ${path}.`));
    const identity = expected ? `${expected.schemaId}:${expected.sha256}:${expected.bytes}` : "root";
    const previous = this.#references.get(path);
    if (previous && previous !== identity) return Promise.reject(new Error(`Conflicting resource identity: ${path}.`));
    this.#references.set(path, identity);
    const existing = this.#requests.get(path);
    if (existing) return existing as Promise<Static<T>>;
    this.#states.set(path, { status: "loading" });
    const request = this.#request(path, schema, expected).then((value) => {
      this.#states.set(path, { status: "loaded" });
      return value;
    }, (error: unknown) => {
      this.#states.set(path, { status: "error", message: error instanceof Error ? error.message : String(error) });
      throw error;
    });
    this.#requests.set(path, request);
    return request;
  }

  async #request<T extends TSchema>(path: string, schema: T, expected?: StaticResourceReference): Promise<Static<T>> {
    const response = await this.#fetch(new URL(path, this.#base));
    if (!response.ok) throw new Error(`Atlas resource request failed (${response.status}): ${path}.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (expected && bytes.byteLength !== expected.bytes) throw new Error(`Atlas resource size mismatch: ${path}.`);
    if (expected) {
      const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
      const sha256 = [...digest].map((part) => part.toString(16).padStart(2, "0")).join("");
      if (sha256 !== expected.sha256) throw new Error(`Atlas resource hash mismatch: ${path}.`);
    }
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    Assert(schema, value);
    return value;
  }
}
