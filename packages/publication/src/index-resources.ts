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
  type PublicLevel,
  type PublicDocument,
  type PublicItem,
  type PublicNpc,
  type PublicPlace,
  type PublicQuest,
  type PublicSearchEntry,
  type StaticDocument,
  type StaticKindList,
  type StaticCoverage,
  type StaticSearchIndex,
} from "@afallon/contracts/public";
import { generateArtworkResources } from "./artwork";
import { readerCoverage } from "./coverage";
import { usableTeleports } from "./connections";
import { projectPublicDocuments, type PublishedPlacement } from "./documents";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";
import { buildKindLists } from "./lists";
import { buildEntityReferences, createReferenceResolver } from "./references";
import { partitionStaticRecords, writeStaticJson, type GeneratedStaticResource } from "./resources";
import type { PublicationCandidateAsset } from "./selection";
import type { MapExtent } from "./map-shards";
import { levelUnion } from "./levels";
import { displayName } from "./text";
import { auditPublicTooltipCoverage } from "./tooltip-coverage";

export interface GeneratedIndexResources {
  refs: ReadonlyMap<string, EntityRef>;
  documents: ReadonlyMap<string, GeneratedStaticResource<StaticDocument>>;
  lists: ReadonlyMap<string, GeneratedStaticResource<StaticKindList>[]>;
  search: GeneratedStaticResource<StaticSearchIndex>[];
  artwork: PublicationCandidateAsset[];
  coverage: Pick<StaticCoverage, "pages" | "gaps">;
  publicationIssues: string[];
}

function assertSameIdentity(expected: { buildId: string; catalogId: string }, actual: { buildId: string; catalogId: string }, subject: string): void {
  if (actual.buildId !== expected.buildId || actual.catalogId !== expected.catalogId) throw new Error(`${subject} query identity does not match the entity query.`);
}

function searchLevel(document: PublicDocument): PublicSearchEntry["level"] {
  switch (document.ref.kind) {
    case "items": return (document as PublicItem).facts.levelRequirement;
    case "npcs": {
      const level = (document as PublicNpc).facts.level;
      return level === undefined || level.max === undefined ? undefined : level.min === level.max ? level.min : { min: level.min, max: level.max };
    }
    case "quests": {
      const facts = (document as PublicQuest).facts;
      return facts.levelRange ?? facts.levelRequirement;
    }
    case "places": return (document as PublicPlace).facts.levelRange;
    default: return undefined;
  }
}

function itemSourceKinds(document: PublicDocument): string[] {
  if (document.ref.kind !== "items") return [];
  const item = document as PublicItem;
  return [item.droppedBy.length > 0 ? "drop" : null, item.soldBy.length > 0 ? "vendor" : null,
    item.gatheredFrom.length > 0 ? "gather" : null, item.inContainers.length > 0 ? "container" : null,
    item.collectedFrom.length > 0 ? "interaction" : null, item.rewardedBy.length > 0 ? "quest" : null,
    item.craftedBy.length > 0 ? "recipe" : null].filter((value): value is string => value !== null);
}

export async function generateIndexResources(
  db: Database,
  store: ArtifactStore,
  placements: ReadonlyMap<string, PublishedPlacement>,
  placementIdsByKey: ReadonlyMap<string, readonly string[]>,
  regionIdsByMapSpace: ReadonlyMap<string, readonly string[]>,
  npcLevels: ReadonlyMap<string, ReadonlyMap<string, PublicLevel>>,
  mapExtents: ReadonlyMap<string, MapExtent>,
  protection?: ObjectWriteProtection,
): Promise<GeneratedIndexResources> {
  const entities = queryCatalogEntities(db), facts = queryCatalogFacts(db), catalogRelations = queryCatalogRelations(db);
  assertSameIdentity(entities, facts, "Fact");
  assertSameIdentity(entities, catalogRelations, "Relation");
  // Place names and place pages read only the teleports that a player can use.
  const relations = { ...catalogRelations, records: { ...catalogRelations.records, transitions: usableTeleports(catalogRelations.records.transitions, mapExtents) } };
  const identity = { buildId: entities.buildId, catalogId: entities.catalogId };
  const artwork = await generateArtworkResources(store, entities.records, protection);
  const levelsByRecord = new Map<string, PublicLevel[]>();
  for (const levels of npcLevels.values()) for (const [key, level] of levels) levelsByRecord.set(key, [...levelsByRecord.get(key) ?? [], level]);
  const references = buildEntityReferences(entities.records, { facts: facts.records, relations: relations.records, artByEntity: artwork.artByEntity,
    npcLevels: new Map([...levelsByRecord].map(([key, levels]) => [key, levelUnion(levels)!] as const)) });
  const refs = references.refs;
  const catalogPlacements = new Map(relations.records.placements.map((placement) => [placement.placementId, placement]));
  const publishedPlacements = new Map([...placements].map(([placementId, placement]) => {
    const catalogPlacement = catalogPlacements.get(placementId), scene = catalogPlacement ? refs.get(catalogPlacement.sceneKey) : undefined;
    const area = displayName(catalogPlacement?.area ?? "");
    return [placementId, area ? { ...placement, label: area } : scene?.kind === "places" ? { ...placement, label: scene.name } : placement] as const;
  }));
  const publicDocuments = projectPublicDocuments({ entities: entities.records, facts: facts.records, relations: relations.records, references,
    resolve: createReferenceResolver(refs), artByEntity: artwork.artByEntity, placements: publishedPlacements, regionIdsByMapSpace, npcLevels, placementIdsByKey });

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

  const schemaIdByKey = new Map([...documents].map(([key, resource]) => [key, resource.reference.schemaId]));
  const publicationIssues = auditPublicTooltipCoverage(facts.records, relations.records, publicDocuments, schemaIdByKey);

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
    const sceneKeys = new Set(placementIds.map((placementId) => catalogPlacements.get(placementId)?.sceneKey).filter((sceneKey): sceneKey is string => sceneKey !== undefined && refs.get(sceneKey)?.kind === "places"));
    const onlySceneKey = sceneKeys.size === 1 ? sceneKeys.values().next().value : undefined;
    const place = onlySceneKey === undefined ? (sceneKeys.size > 1 ? `${sceneKeys.size} places` : undefined) : refs.get(onlySceneKey)?.name;
    entries.push({ ref: document.ref, ...(level === undefined ? {} : { level }), ...(place ? { place } : {}),
      hasPlacements: placementIds.length > 0,
      sourceKinds: listRowsByKey.get(key)?.facets.sourceKind ?? itemSourceKinds(document),
      document: resource.reference as PublicSearchEntry["document"],
    });
  }
  const search: GeneratedStaticResource<StaticSearchIndex>[] = [];
  for (const value of partitionStaticRecords(entries, (partEntries, part): StaticSearchIndex => ({ schemaVersion: "compendium.static-search.v4", ...identity, part, entries: partEntries }))) {
    Assert(StaticSearchIndexSchema, value);
    search.push(await writeStaticJson(store, value.schemaVersion, value, protection));
  }

  const usedArtwork = new Set([...publicDocuments.values()].flatMap((document) => artEdges(document).map((art) => art.url)));
  const assets = [...usedArtwork].map((path) => {
    const asset = artwork.assetsByPath.get(path);
    if (!asset) throw new Error(`Document artwork has no publication asset: ${path}.`);
    return asset;
  }).sort((left, right) => left.path.localeCompare(right.path));
  return { refs, documents, lists, search, artwork: assets, coverage: readerCoverage(publicDocuments.values()), publicationIssues };
}
