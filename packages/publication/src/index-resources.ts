import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import { queryCatalogFullEntities, queryCatalogAllItemSources, queryCatalogSearch } from "@afallon/catalog";
import { StaticEntityDetailSchema, StaticEntitySearchSchema, StaticItemSearchSchema, StaticItemSourceSchema, type PublicItemSource, type StaticEntityDetail, type StaticEntitySearch, type StaticItemSearch, type StaticItemSource } from "@afallon/contracts/public";
import { projectPublicEntities } from "./entity-projection";
import { partitionStaticRecords, writeStaticJson, type GeneratedStaticResource } from "./resources";

export interface GeneratedIndexResources {
  entitySearch: GeneratedStaticResource<StaticEntitySearch>[];
  itemSearch: GeneratedStaticResource<StaticItemSearch>[];
  entityDetails: ReadonlyMap<string, GeneratedStaticResource<StaticEntityDetail>>;
  itemSources: ReadonlyMap<string, GeneratedStaticResource<StaticItemSource>>;
}

export async function generateIndexResources(db: Database, store: ArtifactStore, protection?: ObjectWriteProtection): Promise<GeneratedIndexResources> {
  const search = queryCatalogSearch(db);
  const identity = { buildId: search.buildId, catalogId: search.catalogId };
  const publicEntities = new Map(projectPublicEntities(queryCatalogFullEntities(db).records).map((entity) => [entity.entityKey, entity]));
  const entityDetails = new Map<string, GeneratedStaticResource<StaticEntityDetail>>();
  for (const summary of search.records) {
    const entity = publicEntities.get(summary.entityKey);
    if (!entity) throw new Error(`Catalog entity projection is missing: ${summary.entityKey}.`);
    const detail: StaticEntityDetail = { schemaVersion: "compendium.static-entity-detail.v1", ...identity, entity };
    Assert(StaticEntityDetailSchema, detail);
    entityDetails.set(summary.entityKey, await writeStaticJson(store, detail.schemaVersion, detail, protection));
  }
  const entityRecords: StaticEntitySearch["entities"] = search.records.map((summary) => ({
    entityKey: summary.entityKey, kind: summary.kind, nativeId: summary.nativeId,
    name: summary.name?.trim() || summary.entityKey, description: summary.description,
    detail: entityDetails.get(summary.entityKey)!.reference,
  }));
  const entitySearch: GeneratedStaticResource<StaticEntitySearch>[] = [];
  for (const value of partitionStaticRecords(entityRecords, (entities, part): StaticEntitySearch => ({ schemaVersion: "compendium.static-entity-search.v2", ...identity, part, entities }))) {
    Assert(StaticEntitySearchSchema, value);
    entitySearch.push(await writeStaticJson(store, value.schemaVersion, value, protection));
  }

  const sourceRows = queryCatalogAllItemSources(db).records;
  const sourcesByItem = new Map<string, typeof sourceRows>();
  for (const row of sourceRows) {
    const rows = sourcesByItem.get(row.itemEntityKey);
    if (rows) rows.push(row); else sourcesByItem.set(row.itemEntityKey, [row]);
  }
  const itemSources = new Map<string, GeneratedStaticResource<StaticItemSource>>();
  const itemSummaries: StaticItemSearch["items"] = [];
  for (const summary of search.records) {
    if (summary.kind !== "items") continue;
    const sources = sourcesByItem.get(summary.entityKey) ?? [];
    const sourceKinds = [...new Set(sources.map((source) => source.sourceKind))].sort();
    const sourceNames = [...new Set(sources.map((source) => source.sourceKey))].sort();
    const itemSource: PublicItemSource = {
      itemKey: summary.entityKey, sections: [],
      sources: sources.map((source) => ({ label: source.sourceKey, kind: source.sourceKind, placementIds: source.placementIds, sections: [] })),
    };
    const value: StaticItemSource = { schemaVersion: "compendium.static-item-source.v1", ...identity, itemSource };
    Assert(StaticItemSourceSchema, value);
    const resource = await writeStaticJson(store, value.schemaVersion, value, protection);
    itemSources.set(summary.entityKey, resource);
    itemSummaries.push({ itemKey: summary.entityKey, name: summary.name?.trim() || summary.entityKey, sourceNames, sourceKinds, detail: entityDetails.get(summary.entityKey)!.reference, source: resource.reference });
  }
  const itemSearch: GeneratedStaticResource<StaticItemSearch>[] = [];
  for (const value of partitionStaticRecords(itemSummaries, (items, part): StaticItemSearch => ({ schemaVersion: "compendium.static-item-search.v2", ...identity, part, items }))) {
    Assert(StaticItemSearchSchema, value);
    itemSearch.push(await writeStaticJson(store, value.schemaVersion, value, protection));
  }
  return { entitySearch, itemSearch, entityDetails, itemSources };
}
