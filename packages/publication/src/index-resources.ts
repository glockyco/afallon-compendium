import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import { queryCatalogEntities, queryCatalogFacts, queryCatalogRelations } from "@afallon/catalog";
import {
  PUBLICATION_DOCUMENT_BUDGET,
  STATIC_DOCUMENT_SCHEMA_IDS,
  STATIC_DOCUMENT_SCHEMAS,
  StaticKindListSchema,
  StaticSearchIndexSchema,
  artEdges,
  type EntityRef,
  type PlacementRef,
  type PublicDocument,
  type PublicItem,
  type PublicNpc,
  type PublicPlace,
  type PublicQuest,
  type PublicSearchEntry,
  type StaticDocument,
  type StaticKindList,
  type StaticSearchIndex,
} from "@afallon/contracts/public";
import { generateArtworkResources } from "./artwork";
import { countUnresolvedReferences, projectPublicDocuments } from "./documents";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";
import { buildKindLists } from "./lists";
import { buildEntityReferences, createReferenceResolver } from "./references";
import { partitionStaticRecords, writeStaticJson, type GeneratedStaticResource } from "./resources";
import type { PublicationCandidateAsset } from "./selection";

export interface GeneratedIndexResources {
  refs: ReadonlyMap<string, EntityRef>;
  documents: ReadonlyMap<string, GeneratedStaticResource<StaticDocument>>;
  lists: ReadonlyMap<string, GeneratedStaticResource<StaticKindList>[]>;
  search: GeneratedStaticResource<StaticSearchIndex>[];
  artwork: PublicationCandidateAsset[];
  unresolvedReferenceCount: number;
}

function assertSameIdentity(expected: { buildId: string; catalogId: string }, actual: { buildId: string; catalogId: string }, subject: string): void {
  if (actual.buildId !== expected.buildId || actual.catalogId !== expected.catalogId) throw new Error(`${subject} query identity does not match the entity query.`);
}

function searchLevel(document: PublicDocument): PublicSearchEntry["level"] {
  switch (document.ref.kind) {
    case "items": return (document as PublicItem).facts.levelRequirement;
    case "npcs": {
      const facts = (document as PublicNpc).facts;
      return facts.level ?? facts.levelRange;
    }
    case "quests": return (document as PublicQuest).facts.levelRequirement;
    case "places": return (document as PublicPlace).facts.levelRange;
    default: return undefined;
  }
}

function itemSourceKinds(document: PublicDocument): string[] {
  if (document.ref.kind !== "items") return [];
  const item = document as PublicItem;
  return [item.droppedBy.length > 0 ? "drop" : null, item.soldBy.length > 0 ? "vendor" : null,
    item.gatheredFrom.length > 0 ? "gather" : null, item.inContainers.length > 0 ? "container" : null,
    item.rewardedBy.length > 0 ? "quest" : null, item.craftedBy.length > 0 ? "recipe" : null].filter((value): value is string => value !== null);
}

export async function generateIndexResources(
  db: Database,
  store: ArtifactStore,
  placements: ReadonlyMap<string, PlacementRef>,
  placementIdsByKey: ReadonlyMap<string, readonly string[]>,
  mapSpaceLabels: ReadonlyMap<string, string>,
  regionIdsByMapSpace: ReadonlyMap<string, readonly string[]>,
  protection?: ObjectWriteProtection,
): Promise<GeneratedIndexResources> {
  const entities = queryCatalogEntities(db), facts = queryCatalogFacts(db), relations = queryCatalogRelations(db);
  assertSameIdentity(entities, facts, "Fact");
  assertSameIdentity(entities, relations, "Relation");
  const identity = { buildId: entities.buildId, catalogId: entities.catalogId };
  const artwork = await generateArtworkResources(store, entities.records, protection);
  const refs = buildEntityReferences(entities.records, { facts: facts.records, relations: relations.records, artByEntity: artwork.artByEntity, mapSpaceLabels });
  const publicDocuments = projectPublicDocuments({ entities: entities.records, facts: facts.records, relations: relations.records, refs,
    resolve: createReferenceResolver(refs), artByEntity: artwork.artByEntity, placements, regionIdsByMapSpace });

  const documents = new Map<string, GeneratedStaticResource<StaticDocument>>();
  for (const [key, document] of publicDocuments) {
    if (!document.ref.slug || !Object.hasOwn(STATIC_DOCUMENT_SCHEMA_IDS, document.ref.kind)) throw new Error(`Document has no registered page kind: ${key}.`);
    const kind = document.ref.kind as keyof typeof STATIC_DOCUMENT_SCHEMA_IDS;
    const schemaVersion = STATIC_DOCUMENT_SCHEMA_IDS[kind];
    const value = { schemaVersion, ...identity, kind, document } as StaticDocument;
    Assert(STATIC_DOCUMENT_SCHEMAS[schemaVersion], value);
    const resource = await writeStaticJson<StaticDocument>(store, schemaVersion, value, protection);
    if (resource.identity.bytes > PUBLICATION_DOCUMENT_BUDGET) throw new Error(`Publication document exceeds its byte budget: ${key}.`);
    documents.set(key, resource);
  }

  const listValues = buildKindLists(identity, PUBLIC_KIND_REGISTRY, publicDocuments);
  const lists = new Map<string, GeneratedStaticResource<StaticKindList>[]>();
  for (const [kind, values] of listValues) {
    const resources: GeneratedStaticResource<StaticKindList>[] = [];
    for (const value of values) {
      Assert(StaticKindListSchema, value);
      resources.push(await writeStaticJson(store, value.schemaVersion, value, protection));
    }
    lists.set(kind, resources);
  }

  const listRowsByKey = new Map([...listValues.values()].flatMap((parts) => parts.flatMap((list) => list.rows.map((row) => [row.ref.key, row] as const))));
  const entries: PublicSearchEntry[] = [];
  for (const [key, document] of publicDocuments) {
    const registry = PUBLIC_KIND_REGISTRY.find((entry) => entry.kind === document.ref.kind);
    const resource = documents.get(key);
    if (!registry?.searchable || !resource) continue;
    const level = searchLevel(document);
    const placementIds = [...new Set(placementIdsByKey.get(key) ?? [])].filter((placementId) => placements.has(placementId));
    const primaryPlacement = placementIds[0] === undefined ? undefined : placements.get(placementIds[0]);
    const place = primaryPlacement === undefined ? undefined : mapSpaceLabels.get(primaryPlacement.mapSpaceId);
    entries.push({ ref: document.ref, ...(level === undefined ? {} : { level }), ...(place ? { place } : {}),
      hasPlacements: placementIds.length > 0,
      sourceKinds: listRowsByKey.get(key)?.facets.sourceKind ?? itemSourceKinds(document),
      document: resource.reference as PublicSearchEntry["document"],
    });
  }
  const search: GeneratedStaticResource<StaticSearchIndex>[] = [];
  for (const value of partitionStaticRecords(entries, (partEntries, part): StaticSearchIndex => ({ schemaVersion: "compendium.static-search.v3", ...identity, part, entries: partEntries }))) {
    Assert(StaticSearchIndexSchema, value);
    search.push(await writeStaticJson(store, value.schemaVersion, value, protection));
  }

  const usedArtwork = new Set([...publicDocuments.values()].flatMap((document) => artEdges(document).map((art) => art.url)));
  const assets = [...usedArtwork].map((path) => {
    const asset = artwork.assetsByPath.get(path);
    if (!asset) throw new Error(`Document artwork has no publication asset: ${path}.`);
    return asset;
  }).sort((left, right) => left.path.localeCompare(right.path));
  const unresolvedReferenceCount = [...publicDocuments.values()].reduce((count, document) => count + countUnresolvedReferences(document), 0);
  return { refs, documents, lists, search, artwork: assets, unresolvedReferenceCount };
}
