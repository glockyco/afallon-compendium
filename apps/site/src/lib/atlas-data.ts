import { Assert } from "typebox/value";
import type { Static, TSchema } from "typebox";
import {
  PUBLICATION_SCHEMA_VERSION,
  STATIC_DOCUMENT_SCHEMA_IDS,
  STATIC_DOCUMENT_SCHEMAS,
  StaticCoverageSchema,
  StaticGeometrySchema,
  StaticImagerySchema,
  StaticKindListSchema,
  StaticMapShardSchema,
  StaticPagesSchema,
  StaticRootManifestSchema,
  StaticSearchIndexSchema,
  assertStaticResourceIdentity,
  expandEssentialPlacement,
  staticResourceSchema,
  type PublicDocument,
  type PublicKindEntry,
  type PublicPageKind,
  type PublicPlacement,
  type PublicSearchEntry,
  type PublicationData,
  type StaticCoverage,
  type StaticDocument,
  type StaticGeometry,
  type StaticImagery,
  type StaticKindList,
  type StaticPages,
  type StaticResourceReference,
  type StaticRootManifest,
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
  entries: PublicSearchEntry[];
  entriesByKey: ReadonlyMap<string, PublicSearchEntry>;
}

export function atlasPublicationData(root: StaticRootManifest, maps: readonly AtlasMapData[], coverage: StaticCoverage): PublicationData {
  const loadedIds = new Set(maps.map((map) => map.mapSpaceId));
  if (maps.length !== root.maps.length || root.maps.some((map) => !loadedIds.has(map.mapSpaceId))) {
    throw new Error("Atlas map parts do not cover every published map.");
  }
  return {
    schemaVersion: PUBLICATION_SCHEMA_VERSION,
    buildId: root.buildId,
    mode: root.mode,
    coverage: { complete: coverage.complete, messages: coverage.messages, excludedPlacements: coverage.exclusionCount },
    world: root.world,
    maps: root.maps.map(({ mapSpaceId, label, bounds }) => ({ mapSpaceId, label, bounds })),
    placements: maps.flatMap((map) => map.placements),
    regions: maps.flatMap((map) => map.regions),
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
    this.#indexes = null;
  }

  loadRoot(): Promise<StaticRootManifest> { return this.#loadPath("publication.json", StaticRootManifestSchema); }

  async loadRegistry(): Promise<PublicKindEntry[]> {
    const root = await this.loadRoot();
    return root.kinds;
  }

  async loadPages(): Promise<StaticPages> {
    const root = await this.loadRoot();
    return this.#loadReference(root.pages, StaticPagesSchema, root);
  }

  async loadList(kind: PublicPageKind): Promise<StaticKindList> {
    const root = await this.loadRoot();
    const references = root.lists[kind];
    if (!references?.length) throw new Error(`Publication has no list for ${kind}.`);
    const parts = await Promise.all(references.map((reference) => this.#loadReference(reference, StaticKindListSchema, root)));
    if (parts.some((part, index) => part.kind !== kind || part.part !== index)) throw new Error(`Kind-list identity mismatch for ${kind}.`);
    return { schemaVersion: 'compendium.static-kind-list.v1', buildId: root.buildId, catalogId: root.catalogId, kind, part: 0, rows: parts.flatMap((part) => part.rows) };
  }

  async loadDocument(kind: PublicPageKind, slug: string): Promise<StaticDocument> {
    const root = await this.loadRoot();
    const pages = await this.loadPages();
    const entry = pages.entries.find((candidate) => candidate.kind === kind && candidate.slug === slug);
    if (!entry) throw new Error(`Publication has no ${kind} document ${slug}.`);
    const schemaId = STATIC_DOCUMENT_SCHEMA_IDS[kind];
    if (entry.document.schemaId !== schemaId) throw new Error(`Document schema mismatch for ${kind}/${slug}.`);
    const schema = STATIC_DOCUMENT_SCHEMAS[schemaId];
    const document = await this.#loadReference(entry.document, schema, root) as StaticDocument;
    if (document.kind !== kind || document.document.ref.slug !== slug || document.document.ref.key !== entry.key) {
      throw new Error(`Document identity mismatch for ${kind}/${slug}.`);
    }
    return document;
  }

  async loadDocumentForRef(ref: PublicSearchEntry["ref"]): Promise<PublicDocument> {
    if (!ref.slug || !Object.hasOwn(STATIC_DOCUMENT_SCHEMA_IDS, ref.kind)) throw new Error(`Reference has no published page: ${ref.key}.`);
    return (await this.loadDocument(ref.kind as PublicPageKind, ref.slug)).document;
  }

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
    return {
      mapSpaceId,
      placements,
      regions: parts.flatMap((part) => part.regions),
      imagery: {
        ...imagery,
        layers: imagery.layers.map((layer) => ({
          ...layer,
          tiles: layer.tiles.map((tile) => ({ ...tile, url: new URL(tile.url, this.#base).href })),
        })),
      },
    };
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
    const parts = await Promise.all(root.search.map((reference) => this.#loadReference(reference, StaticSearchIndexSchema, root)));
    for (const [index, part] of parts.entries()) {
      if (part.part !== index) throw new Error(`Search part identity mismatch at ${index}.`);
    }
    const entries = parts.flatMap((part) => part.entries);
    const entriesByKey = new Map(entries.map((entry) => [entry.ref.key, entry]));
    if (entries.length !== entriesByKey.size) throw new Error("Search parts contain duplicate identities.");
    return { entries, entriesByKey };
  }

  async loadCoverage(): Promise<StaticCoverage> {
    const root = await this.loadRoot();
    return this.#loadReference(root.coverage, StaticCoverageSchema, root);
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
