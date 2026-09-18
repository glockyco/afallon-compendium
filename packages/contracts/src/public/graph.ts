import { Assert } from "typebox/value";
import {
  StaticResourceReferenceSchema,
  assertStaticResourceIdentity,
  type StaticResource,
  type StaticResourceReference,
  type StaticRootManifest,
} from "./resources";
import { collectRefs, isStaticDocument, isStaticDocumentSchemaId, type EntityRef, type PublicKindEntry } from "./documents";

export const PUBLICATION_ROOT_BUDGET = 65_536;
export const PUBLICATION_PART_BUDGET = 524_288;
export const PUBLICATION_ESSENTIAL_BUDGET = 3_300_000;
export const PUBLICATION_DOCUMENT_BUDGET = 262_144;

export interface VerifiedPublicationGraph {
  publication: StaticRootManifest;
  resources: ReadonlyMap<string, StaticResource>;
  references: ReadonlyMap<string, StaticResourceReference>;
}

export function assertStaticResourceReference(reference: StaticResourceReference): void {
  Assert(StaticResourceReferenceSchema, reference);
  // Map tiles live under `assets/`, entity artwork under `art/`; both are content-addressed WebP.
  const expectedPaths = reference.schemaId === "image/webp" ? [`assets/${reference.sha256}.webp`, `art/${reference.sha256}.webp`] : [`resources/${reference.sha256}.json`];
  if (!expectedPaths.includes(reference.path)) throw new Error(`Publication reference path mismatch: ${reference.path}.`);
  if (/^compendium\.static-(?:map|geometry|entity-search|item-search|search|kind-list|pages)\./.test(reference.schemaId) && reference.bytes > PUBLICATION_PART_BUDGET) throw new Error(`Publication part exceeds its byte budget: ${reference.path}.`);
  if (isStaticDocumentSchemaId(reference.schemaId) && reference.bytes > PUBLICATION_DOCUMENT_BUDGET) throw new Error(`Publication document exceeds its byte budget: ${reference.path}.`);
}

export function assertStaticPublicationBudgets(root: StaticRootManifest, rootBytes: number): void {
  if (rootBytes > PUBLICATION_ROOT_BUDGET) throw new Error("Publication root exceeds its byte budget.");
  const essentialBytes = rootBytes + root.coverage.bytes + root.maps.reduce((sum, map) => sum + map.imagery.bytes + map.parts.reduce((partSum, part) => partSum + part.bytes, 0), 0);
  if (essentialBytes > PUBLICATION_ESSENTIAL_BUDGET) throw new Error("Essential publication exceeds its byte budget.");
}

export function assertStaticPublicationSemantics(root: StaticRootManifest, values: ReadonlyMap<string, StaticResource>): void {
  if (root.maps.length === 0) throw new Error("Publication maps are empty.");
  for (const value of values.values()) assertStaticResourceIdentity(root, value);
  const coverage = values.get(root.coverage.path);
  if (coverage?.schemaVersion !== "compendium.static-coverage.v1" || coverage.complete !== root.complete) throw new Error("Publication coverage does not match its root.");
  const mapIds = new Set<string>();
  const placementIds = new Set<string>();
  for (const map of root.maps) {
    if (mapIds.has(map.mapSpaceId)) throw new Error(`Duplicate publication map: ${map.mapSpaceId}.`);
    mapIds.add(map.mapSpaceId);
    const mapPlacementStates = new Map<string, boolean | null>();
    const geometryIds = new Set<string>();
    const travelGeometryIds = new Set<string>();
    for (const [part, reference] of map.parts.entries()) {
      const value = values.get(reference.path);
      if (value?.schemaVersion !== "compendium.static-map.v2" || value.mapSpaceId !== map.mapSpaceId || value.part !== part) throw new Error(`Atlas part identity mismatch: ${reference.path}.`);
      for (const placement of value.placements) {
        if (placementIds.has(placement[0])) throw new Error(`Duplicate public placement: ${placement[0]}.`);
        placementIds.add(placement[0]);
        mapPlacementStates.set(placement[0], placement[8]);
      }
      if (value.regions.some((region) => region.mapSpaceId !== map.mapSpaceId)) throw new Error(`Atlas region map mismatch: ${reference.path}.`);
    }
    for (const [part, reference] of map.optionalGeometry.entries()) {
      const value = values.get(reference.path);
      if (value?.schemaVersion !== "compendium.static-geometry.v1" || value.mapSpaceId !== map.mapSpaceId || value.part !== part) throw new Error(`Geometry part identity mismatch: ${reference.path}.`);
      for (const placement of value.placements) {
        if (!mapPlacementStates.has(placement.placementId)) throw new Error(`Geometry placement is missing from its map: ${placement.placementId}.`);
        if (geometryIds.has(placement.placementId)) throw new Error(`Duplicate geometry placement: ${placement.placementId}.`);
        geometryIds.add(placement.placementId);
        if (placement.travel) {
          if (placement.travel.enabled !== mapPlacementStates.get(placement.placementId)) throw new Error(`Travel marker state differs from its geometry: ${placement.placementId}.`);
          travelGeometryIds.add(placement.placementId);
        }
      }
    }
    for (const [placementId, state] of mapPlacementStates) if (state !== null && !travelGeometryIds.has(placementId)) throw new Error(`Travel placement has no declared geometry: ${placementId}.`);
    const imagery = values.get(map.imagery.path);
    if (imagery?.schemaVersion !== "compendium.static-imagery.v2" || imagery.mapSpaceId !== map.mapSpaceId || imagery.layers.some((layer) => layer.mapSpaceId !== map.mapSpaceId)) throw new Error(`Imagery map mismatch: ${map.imagery.path}.`);
    if (!imagery.layers.some((layer) => layer.id === imagery.defaultLayerId && layer.kind === "game-map")) throw new Error(`Imagery default is not a game map: ${map.imagery.path}.`);
  }
  assertCompendiumSemantics(root, values, placementIds);
}

// The compendium half of the graph: every page names a document of its kind and slug, every
// reference inside a document points at a published entity, and a paged kind's references carry
// slugs while page-less kinds' references do not.
function assertCompendiumSemantics(root: StaticRootManifest, values: ReadonlyMap<string, StaticResource>, placementIds: ReadonlySet<string>): void {
  const kinds = new Map<string, PublicKindEntry>();
  for (const entry of root.kinds) {
    if (kinds.has(entry.kind)) throw new Error(`Duplicate registered kind: ${entry.kind}.`);
    kinds.set(entry.kind, entry);
  }
  for (const [kind, reference] of Object.entries(root.lists)) {
    const entry = kinds.get(kind);
    if (!entry?.pages) throw new Error(`List for a kind without pages: ${kind}.`);
    const value = values.get(reference.path);
    if (value?.schemaVersion !== "compendium.static-kind-list.v1" || value.kind !== kind) throw new Error(`Kind list identity mismatch: ${reference.path}.`);
  }
  for (const entry of kinds.values()) if (entry.pages && !root.lists[entry.kind]) throw new Error(`Paged kind has no list: ${entry.kind}.`);
  const pages = values.get(root.pages.path);
  if (pages?.schemaVersion !== "compendium.static-pages.v1") throw new Error(`Page list identity mismatch: ${root.pages.path}.`);
  const published = new Map<string, { kind: string; slug: string }>();
  const slugs = new Set<string>();
  for (const page of pages.entries) {
    if (published.has(page.key)) throw new Error(`Duplicate page key: ${page.key}.`);
    const slugKey = `${page.kind}/${page.slug}`;
    if (slugs.has(slugKey)) throw new Error(`Duplicate page slug: ${slugKey}.`);
    slugs.add(slugKey);
    if (!kinds.get(page.kind)?.pages) throw new Error(`Page for a kind without pages: ${page.kind}.`);
    const document = values.get(page.document.path);
    if (!document || !isStaticDocument(document) || document.kind !== page.kind || document.document.ref.key !== page.key || document.document.ref.slug !== page.slug) throw new Error(`Page document identity mismatch: ${page.key}.`);
    published.set(page.key, { kind: page.kind, slug: page.slug });
  }
  const checkRef = (ref: EntityRef, owner: string) => {
    const entry = kinds.get(ref.kind);
    if (!entry) throw new Error(`Reference to an unregistered kind ${ref.kind} in ${owner}.`);
    if (entry.pages) {
      const page = published.get(ref.key);
      if (!page) throw new Error(`Reference to an unpublished entity ${ref.key} in ${owner}.`);
      if (ref.slug !== page.slug) throw new Error(`Reference slug differs from its page: ${ref.key} in ${owner}.`);
    } else if (ref.slug !== undefined) throw new Error(`Reference to a page-less kind carries a slug: ${ref.key} in ${owner}.`);
  };
  for (const [path, value] of values) {
    if (isStaticDocument(value)) {
      for (const ref of collectRefs(value.document)) checkRef(ref, path);
      for (const placement of "locations" in value.document ? value.document.locations : []) if (!placementIds.has(placement.placementId)) throw new Error(`Document location is not a published placement: ${placement.placementId} in ${path}.`);
      if (value.kind === "places" && value.document.space && !root.maps.some((map) => map.mapSpaceId === value.document.space!.mapSpaceId)) throw new Error(`Place references an unpublished map space: ${value.document.space.mapSpaceId} in ${path}.`);
    } else if (value.schemaVersion === "compendium.static-kind-list.v1") {
      for (const row of value.rows) checkRef(row.ref, path);
    }
  }
  for (const [part, reference] of root.search.entries()) {
    const value = values.get(reference.path);
    if (value?.schemaVersion !== "compendium.static-search.v3" || value.part !== part) throw new Error(`Search part identity mismatch: ${reference.path}.`);
    for (const entry of value.entries) {
      checkRef(entry.ref, reference.path);
      if (!kinds.get(entry.ref.kind)?.searchable) throw new Error(`Search entry for a kind that is not searchable: ${entry.ref.key}.`);
      const page = published.get(entry.ref.key);
      if (page && !entry.document) throw new Error(`Search entry for a page omits its document: ${entry.ref.key}.`);
      if (entry.document) {
        const document = values.get(entry.document.path);
        if (!document || !isStaticDocument(document) || document.document.ref.key !== entry.ref.key) throw new Error(`Search document identity mismatch: ${entry.ref.key}.`);
      }
      for (const placementId of entry.placementIds) if (!placementIds.has(placementId)) throw new Error(`Search entry names an unpublished placement: ${placementId}.`);
    }
  }
}
