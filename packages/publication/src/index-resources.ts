import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import { queryCatalogFullEntity, queryCatalogItemSources, queryCatalogSearch } from "@afallon/catalog";
import {
  StaticEntityDetailSchema,
  StaticEntitySearchSchema,
  StaticItemSearchSchema,
  StaticItemSourceSchema,
  type PublicItemSource,
  type StaticEntityDetail,
  type StaticEntitySearch,
  type StaticItemSearch,
  type StaticItemSource,
} from "@afallon/contracts/public";
import { projectPublicEntities } from "./entity-projection";
import { writeStaticJson, type GeneratedStaticResource } from "./resources";

export interface GeneratedIndexResources {
  entitySearch: GeneratedStaticResource<StaticEntitySearch>;
  itemSearch: GeneratedStaticResource<StaticItemSearch>;
  entityDetails: ReadonlyMap<string, GeneratedStaticResource<StaticEntityDetail>>;
  itemSources: ReadonlyMap<string, GeneratedStaticResource<StaticItemSource>>;
}

export async function generateIndexResources(db: Database, store: ArtifactStore): Promise<GeneratedIndexResources> {
  const search = queryCatalogSearch(db);
  const fullEntities = search.records.map((summary) => {
    const queried = queryCatalogFullEntity(db, summary.entityKey);
    if (queried.records === null) throw new Error(`Catalog entity disappeared during publication: ${summary.entityKey}.`);
    return queried.records;
  });
  const publicEntities = new Map(projectPublicEntities(fullEntities).map((entity) => [entity.entityKey, entity]));
  const entityDetails = new Map<string, GeneratedStaticResource<StaticEntityDetail>>();
  for (const summary of search.records) {
    const entity = publicEntities.get(summary.entityKey);
    if (!entity) throw new Error(`Catalog entity projection disappeared during publication: ${summary.entityKey}.`);
    const detail: StaticEntityDetail = {
      schemaVersion: "compendium.static-entity-detail.v1",
      buildId: search.buildId,
      catalogId: search.catalogId,
      entity,
    };
    Assert(StaticEntityDetailSchema, detail);
    entityDetails.set(summary.entityKey, await writeStaticJson(store, detail.schemaVersion, detail));
  }
  const entitySearchValue: StaticEntitySearch = {
    schemaVersion: "compendium.static-entity-search.v1",
    buildId: search.buildId,
    catalogId: search.catalogId,
    entities: search.records.map((summary) => ({
      entityKey: summary.entityKey,
      kind: summary.kind,
      nativeId: summary.nativeId,
      name: summary.name?.trim() || summary.entityKey,
      description: summary.description,
      detailPath: entityDetails.get(summary.entityKey)!.reference.path,
    })),
  };
  Assert(StaticEntitySearchSchema, entitySearchValue);
  const entitySearch = await writeStaticJson(store, entitySearchValue.schemaVersion, entitySearchValue);

  const itemSources = new Map<string, GeneratedStaticResource<StaticItemSource>>();
  const itemSummaries: StaticItemSearch["items"] = [];
  for (const summary of search.records.filter((entity) => entity.kind === "items")) {
    const queried = queryCatalogItemSources(db, summary.entityKey);
    const sourceKinds = [...new Set(queried.records.map((source) => source.sourceKind))].sort();
    const sourceNames = [...new Set(queried.records.map((source) => source.sourceKey))].sort();
    const itemSource: PublicItemSource = {
      itemKey: summary.entityKey,
      sections: [],
      sources: queried.records.map((source) => ({ label: source.sourceKey, kind: source.sourceKind, placementIds: source.placementIds, sections: [] })),
    };
    const resourceValue: StaticItemSource = { schemaVersion: "compendium.static-item-source.v1", buildId: search.buildId, catalogId: search.catalogId, itemSource };
    Assert(StaticItemSourceSchema, resourceValue);
    const sourceResource = await writeStaticJson(store, resourceValue.schemaVersion, resourceValue);
    itemSources.set(summary.entityKey, sourceResource);
    itemSummaries.push({ itemKey: summary.entityKey, name: summary.name?.trim() || summary.entityKey, sourceNames, sourceKinds, detailPath: entityDetails.get(summary.entityKey)!.reference.path, sourcePath: sourceResource.reference.path });
  }
  const itemSearchValue: StaticItemSearch = { schemaVersion: "compendium.static-item-search.v1", buildId: search.buildId, catalogId: search.catalogId, items: itemSummaries };
  Assert(StaticItemSearchSchema, itemSearchValue);
  const itemSearch = await writeStaticJson(store, itemSearchValue.schemaVersion, itemSearchValue);
  return { entitySearch, itemSearch, entityDetails, itemSources };
}
