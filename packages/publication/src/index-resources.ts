import type { Database } from "bun:sqlite";
import { Assert, AssertError } from "typebox/value";
import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import { queryCatalogEntities, queryCatalogFacts, queryCatalogFullEntities, queryCatalogRelations, querySpawnCandidateNpcs } from "@afallon/catalog";
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
  type PublicSkill,
  type PublicSearchEntry,
  type StaticDocument,
  type PublicationExclusion,
  type StaticKindList,
  type StaticCoverage,
  type StaticSearchIndex,
} from "@afallon/contracts/public";
import { generateArtworkResources } from "./artwork";
import { readerCoverage } from "./coverage";
import { usableTeleports } from "./connections";
import { conditionsById, projectPublicDocuments, requirementsFor, startingGearByItem, type PublishedPlacement } from "./documents";
import { projectGatheringNodeDocuments } from "./gathering";
import { projectMechanicsDocuments } from "./mechanics";
import { assertExclusionEvidence, withoutExcludedRelations } from "./exclusions";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";
import { buildKindLists } from "./lists";
import { buildEntityReferences, createReferenceResolver } from "./references";
import { partitionStaticRecords, writeStaticJson, type GeneratedStaticResource } from "./resources";
import type { PublicationCandidateAsset } from "./selection";
import type { MapExtent } from "./map-shards";
import { levelUnion } from "./levels";
import type { PlaceVariant } from "./place-variants";
import { displayName } from "./text";
import { categoryLabel } from "@afallon/contracts/public";
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
    item.crafting ? "recipe" : null, item.startingGearOf.length > 0 ? "startingGear" : null].filter((value): value is string => value !== null);
}
/** Other names that find a craft through its product or its skill row. */
export function searchAliases(document: PublicDocument): string[] {
  if (document.ref.kind === "items") {
    const name = (document as PublicItem).crafting?.recipe.name;
    return name && name !== document.ref.name ? [name] : [];
  }
  return document.ref.kind === "skills" ? (document as PublicSkill).recipes.filter((row) => !row.product || row.product.key === null || !row.product.slug).map((row) => row.recipe.name) : [];
}

// The weapon types of a class come from its entity gameplay, as the game names them: "One handed sword" reads "One
// Handed Sword".
function classWeapons(details: readonly { entityKey: string; kind: string; publicData: { gameplay: unknown } }[]): ReadonlyMap<string, readonly string[]> {
  const result = new Map<string, string[]>();
  for (const detail of details) {
    if (detail.kind !== "classes") continue;
    const gameplay = detail.publicData.gameplay, list = gameplay !== null && typeof gameplay === "object" && "allowedWeaponTypes" in gameplay && Array.isArray(gameplay.allowedWeaponTypes) ? gameplay.allowedWeaponTypes : [];
    result.set(detail.entityKey, list.flatMap((row: unknown) => row !== null && typeof row === "object" && "name" in row && typeof row.name === "string" && row.name ? [categoryLabel(row.name)] : []));
  }
  return result;
}

export async function generateIndexResources(
  db: Database,
  store: ArtifactStore,
  placements: ReadonlyMap<string, PublishedPlacement>,
  placementIdsByKey: ReadonlyMap<string, readonly string[]>,
  regionIdsByMapSpace: ReadonlyMap<string, readonly string[]>,
  npcLevels: ReadonlyMap<string, ReadonlyMap<string, PublicLevel>>,
  mapExtents: ReadonlyMap<string, MapExtent>,
  exclusions: readonly PublicationExclusion[],
  protection?: ObjectWriteProtection,
  placeVariants: ReadonlyMap<string, PlaceVariant> = new Map(),
): Promise<GeneratedIndexResources> {
  const entities = queryCatalogEntities(db), facts = queryCatalogFacts(db), catalogRelations = queryCatalogRelations(db);
  assertSameIdentity(entities, facts, "Fact");
  assertSameIdentity(entities, catalogRelations, "Relation");
  // Place names and place pages read only the teleports that a player can use.
  const usable = { ...catalogRelations.records, transitions: usableTeleports(catalogRelations.records.transitions, mapExtents) };
  // No page shows a row for an excluded record, and excluded records take no part in names.
  const excluded = new Set(exclusions.map((exclusion) => exclusion.key));
  const relations = { ...catalogRelations, records: withoutExcludedRelations(usable, excluded) };
  const identity = { buildId: entities.buildId, catalogId: entities.catalogId };
  const artwork = await generateArtworkResources(store, entities.records, protection);
  const levelsByRecord = new Map<string, PublicLevel[]>();
  for (const levels of npcLevels.values()) for (const [key, level] of levels) levelsByRecord.set(key, [...levelsByRecord.get(key) ?? [], level]);
  const spawnedLevels = new Map([...levelsByRecord].map(([key, levels]) => [key, levelUnion(levels)!] as const));
  const references = buildEntityReferences(entities.records, { facts: facts.records, relations: relations.records, artByEntity: artwork.artByEntity, excluded,
    npcLevels: spawnedLevels });
  const refs = references.refs;
  // Each exclusion must still hold in this catalog, so the check reads the relations before exclusion.
  const spawnCandidates = querySpawnCandidateNpcs(db);
  assertSameIdentity(entities, spawnCandidates, "Spawn candidate");
  assertExclusionEvidence(exclusions, { entities: entities.records, facts: facts.records, relations: usable, spawnCandidates: new Set(spawnCandidates.records), startingGear: startingGearByItem(entities.records, facts.records, refs) });
  const catalogPlacements = new Map(relations.records.placements.map((placement) => [placement.placementId, placement]));
  const publishedPlacements = new Map([...placements].map(([placementId, placement]) => {
    const catalogPlacement = catalogPlacements.get(placementId), scene = catalogPlacement ? refs.get(catalogPlacement.sceneKey) : undefined;
    const area = displayName(catalogPlacement?.area ?? "");
    return [placementId, area ? { ...placement, label: area } : scene?.kind === "places" ? { ...placement, label: scene.name } : placement] as const;
  }));
  const entityDocuments = projectPublicDocuments({ entities: entities.records, facts: facts.records, relations: relations.records, references,
    resolve: createReferenceResolver(refs), artByEntity: artwork.artByEntity, placements: publishedPlacements, regionIdsByMapSpace, npcLevels, placementIdsByKey, excluded, placeVariants,
    classWeapons: classWeapons(queryCatalogFullEntities(db).records) });
  const conditions = conditionsById(relations.records.conditions), resolve = createReferenceResolver(refs);
  const nodeDocuments = projectGatheringNodeDocuments(facts.records, relations.records, { resolve, conditions, placements: publishedPlacements,
    requirements: (conditionIds) => requirementsFor(conditionIds, conditions, resolve) });
  const publicDocuments = new Map<string, PublicDocument>([...entityDocuments, ...projectMechanicsDocuments(facts.records, new Set(refs.keys()), spawnedLevels, resolve, conditions), ...nodeDocuments]);

  const documents = new Map<string, GeneratedStaticResource<StaticDocument>>();
  for (const [key, document] of publicDocuments) {
    if (!document.ref.slug || !Object.hasOwn(STATIC_DOCUMENT_SCHEMA_IDS, document.ref.kind)) throw new Error(`Document has no registered page kind: ${key}.`);
    const kind = document.ref.kind as keyof typeof STATIC_DOCUMENT_SCHEMA_IDS;
    const schemaVersion = STATIC_DOCUMENT_SCHEMA_IDS[kind];
    const value = { schemaVersion, ...identity, kind, document } as StaticDocument;
    try {
      Assert(STATIC_DOCUMENT_SCHEMAS[schemaVersion], value);
    } catch (error) {
      if (error instanceof AssertError) throw new Error(`Invalid publication document ${key}: ${JSON.stringify([...error.cause.errors].slice(0, 5))}`, { cause: error });
      throw error;
    }
    const resource = await writeStaticJson<StaticDocument>(store, schemaVersion, value, protection);
    if (resource.identity.bytes > PUBLICATION_DOCUMENT_BUDGET) throw new Error(`Publication document ${key} is ${resource.identity.bytes} bytes, exceeding its ${PUBLICATION_DOCUMENT_BUDGET}-byte budget.`);
    documents.set(key, resource);
  }

  const schemaIdByKey = new Map([...documents].map(([key, resource]) => [key, resource.reference.schemaId]));
  const publicationIssues = auditPublicTooltipCoverage(facts.records, relations.records, publicDocuments, schemaIdByKey);

  const listValues = buildKindLists(identity, PUBLIC_KIND_REGISTRY, publicDocuments, facts.records, relations.records, refs, excluded);
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
    const aliases = searchAliases(document);
    entries.push({ ref: document.ref, ...(aliases.length ? { aliases } : {}), ...(level === undefined ? {} : { level }), ...(place ? { place } : {}),
      hasPlacements: placementIds.length > 0,
      sourceKinds: listRowsByKey.get(key)?.facets.sourceKind ?? itemSourceKinds(document),
      document: resource.reference as PublicSearchEntry["document"],
    });
  }
  const search: GeneratedStaticResource<StaticSearchIndex>[] = [];
  for (const value of partitionStaticRecords(entries, (partEntries, part): StaticSearchIndex => ({ schemaVersion: "compendium.static-search.v6", ...identity, part, entries: partEntries }))) {
    Assert(StaticSearchIndexSchema, value);
    search.push(await writeStaticJson(store, value.schemaVersion, value, protection));
  }

  const usedArtwork = new Set([...publicDocuments.values()].flatMap((document) => artEdges(document).map((art) => art.url)));
  const assets = [...usedArtwork].map((path) => {
    const asset = artwork.assetsByPath.get(path);
    if (!asset) throw new Error(`Document artwork has no publication asset: ${path}.`);
    return asset;
  }).sort((left, right) => left.path.localeCompare(right.path));
  return { refs, documents, lists, search, artwork: assets, coverage: readerCoverage(publicDocuments.values(), facts.records), publicationIssues };
}
