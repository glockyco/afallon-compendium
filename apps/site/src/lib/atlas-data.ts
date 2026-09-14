import { Assert } from "typebox/value";
import type { TSchema, Static } from "typebox";
import {
  StaticCoverageSchema,
  StaticEntityDetailSchema,
  StaticEntitySearchSchema,
  StaticGuideDocumentSchema,
  StaticImagerySchema,
  StaticItemSearchSchema,
  StaticItemSourceSchema,
  StaticMapShardSchema,
  StaticRootManifestSchema,
  assertStaticResourceIdentity,
  type PublicationData,
  type StaticCoverage,
  type StaticEntityDetail,
  type StaticEntitySearch,
  type StaticGuideDocument,
  type StaticImagery,
  type StaticItemSearch,
  type StaticItemSource,
  type StaticMapShard,
  type StaticResourceReference,
  type StaticRootManifest,
} from "@afallon/contracts/public";

export type AtlasFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type AtlasRequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded" }
  | { status: "error"; message: string };

export interface AtlasMapData {
  map: StaticMapShard;
  imagery: StaticImagery;
}

export interface AtlasIndexes {
  entities: StaticEntitySearch;
  items: StaticItemSearch;
}

export function atlasPublicationData(root: StaticRootManifest, mapData: AtlasMapData, indexes: AtlasIndexes, coverage: StaticCoverage): PublicationData {
  const summary = root.maps.find((map) => map.mapSpaceId === mapData.map.mapSpaceId);
  if (!summary) throw new Error(`Publication has no map ${mapData.map.mapSpaceId}.`);
  return {
    schemaVersion: "compendium.publication.v13",
    buildId: root.buildId,
    mode: root.mode,
    coverage: { complete: coverage.complete, messages: [...coverage.messages], excludedPlacements: coverage.exclusionCount },
    world: {
      mapSpaceId: summary.mapSpaceId,
      label: summary.label,
      bounds: summary.bounds,
      offsets: [{ mapSpaceId: summary.mapSpaceId, worldX: 0, worldY: 0, source: "native", status: "placed" }],
      unplacedMapSpaceIds: [],
    },
    maps: [{ mapSpaceId: summary.mapSpaceId, label: summary.label, bounds: summary.bounds }],
    placements: mapData.map.placements,
    regions: mapData.map.regions,
    entityIndex: indexes.entities.entities,
    itemIndex: indexes.items.items.map(({ itemKey, name, sourceNames, sourceKinds, detailPath }) => ({ itemKey, name, sourceNames, sourceKinds, detailPath })),
    tileLayers: mapData.imagery.layers,
  };
}

export class AtlasDataLoader {
  readonly #requests = new Map<string, Promise<unknown>>();
  readonly #states = new Map<string, AtlasRequestState>();
  readonly #fetch: AtlasFetch;
  readonly #base: URL;
  #root: Promise<StaticRootManifest> | null = null;

  constructor(fetchImplementation: AtlasFetch, baseUrl: string | URL) {
    this.#fetch = fetchImplementation;
    this.#base = new URL(baseUrl, "http://atlas.invalid/");
  }

  state(path: string): AtlasRequestState { return this.#states.get(path) ?? { status: "idle" }; }

  loadRoot(): Promise<StaticRootManifest> {
    this.#root ??= this.#loadPath("publication.json", StaticRootManifestSchema);
    return this.#root;
  }

  async loadMap(mapSpaceId: string): Promise<AtlasMapData> {
    const root = await this.loadRoot();
    const summary = root.maps.find((map) => map.mapSpaceId === mapSpaceId);
    if (!summary) throw new Error(`Publication has no map ${mapSpaceId}.`);
    const [map, imagery] = await Promise.all([
      this.#loadReference(summary.data, StaticMapShardSchema, root),
      this.#loadReference(summary.imagery, StaticImagerySchema, root),
    ]);
    if (map.mapSpaceId !== mapSpaceId || imagery.mapSpaceId !== mapSpaceId) throw new Error(`Map resource identity mismatch for ${mapSpaceId}.`);
    return { map, imagery };
  }

  async loadIndexes(): Promise<AtlasIndexes> {
    const root = await this.loadRoot();
    const [entities, items] = await Promise.all([
      this.#loadReference(root.entitySearch, StaticEntitySearchSchema, root),
      this.#loadReference(root.itemSearch, StaticItemSearchSchema, root),
    ]);
    return { entities, items };
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
    const summary = indexes.entities.entities.find((entity) => entity.entityKey === entityKey);
    if (!summary) throw new Error(`Publication has no entity ${entityKey}.`);
    const detail = await this.#loadPath(summary.detailPath, StaticEntityDetailSchema);
    assertStaticResourceIdentity(root, detail);
    if (detail.entity.entityKey !== entityKey) throw new Error(`Entity detail identity mismatch for ${entityKey}.`);
    return detail;
  }

  async loadItemSource(itemKey: string): Promise<StaticItemSource> {
    const root = await this.loadRoot();
    const indexes = await this.loadIndexes();
    const summary = indexes.items.items.find((item) => item.itemKey === itemKey);
    if (!summary) throw new Error(`Publication has no item ${itemKey}.`);
    const source = await this.#loadPath(summary.sourcePath, StaticItemSourceSchema);
    assertStaticResourceIdentity(root, source);
    if (source.itemSource.itemKey !== itemKey) throw new Error(`Item-source identity mismatch for ${itemKey}.`);
    return source;
  }

  async #loadReference<T extends TSchema>(reference: StaticResourceReference, schema: T, expected: StaticRootManifest): Promise<Static<T>> {
    const value = await this.#loadPath(reference.path, schema, reference);
    assertStaticResourceIdentity(expected, value as Static<T> & { buildId: string; catalogId: string });
    return value;
  }

  #loadPath<T extends TSchema>(resourcePath: string, schema: T, expected?: Pick<StaticResourceReference, "sha256" | "bytes">): Promise<Static<T>> {
    const existing = this.#requests.get(resourcePath);
    if (existing) return existing as Promise<Static<T>>;
    this.#states.set(resourcePath, { status: "loading" });
    const request = this.#request(resourcePath, schema, expected).then((value) => {
      this.#states.set(resourcePath, { status: "loaded" });
      return value;
    }, (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.#states.set(resourcePath, { status: "error", message });
      throw error;
    });
    this.#requests.set(resourcePath, request);
    return request;
  }

  async #request<T extends TSchema>(resourcePath: string, schema: T, expected?: Pick<StaticResourceReference, "sha256" | "bytes">): Promise<Static<T>> {
    const response = await this.#fetch(new URL(resourcePath, this.#base));
    if (!response.ok) throw new Error(`Atlas resource request failed (${response.status}): ${resourcePath}.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (expected && bytes.byteLength !== expected.bytes) throw new Error(`Atlas resource size mismatch: ${resourcePath}.`);
    if (expected) {
      const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
      const sha256 = [...digest].map((part) => part.toString(16).padStart(2, "0")).join("");
      if (sha256 !== expected.sha256) throw new Error(`Atlas resource hash mismatch: ${resourcePath}.`);
    }
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    Assert(schema, value);
    return value;
  }
}
