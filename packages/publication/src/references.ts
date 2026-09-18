import type { CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogRelations } from "@afallon/contracts/catalog";
import type { Art, EntityRef, Ref, UnresolvedRef } from "@afallon/contracts/public";
import { plainText } from "./text";
import { PUBLIC_KIND_BY_KIND, publicKindForCatalogKind } from "./kind-registry";

export interface ReferenceBuildContext {
  facts?: CatalogFacts;
  relations?: CatalogRelations;
  artByEntity?: ReadonlyMap<string, Art>;
}

class FrozenEntityRefMap extends Map<string, EntityRef> {
  #locked = false;

  constructor(entries: Iterable<readonly [string, EntityRef]>) {
    super();
    for (const [key, value] of entries) super.set(key, Object.freeze(value));
    this.#locked = true;
    Object.freeze(this);
  }

  override set(key: string, value: EntityRef): this {
    if (this.#locked) throw new TypeError("Entity reference map is frozen.");
    return super.set(key, value);
  }

  override delete(key: string): boolean {
    if (this.#locked) throw new TypeError("Entity reference map is frozen.");
    return super.delete(key);
  }

  override clear(): void {
    if (this.#locked) throw new TypeError("Entity reference map is frozen.");
    super.clear();
  }
}

function slugify(value: string): string {
  const slug = value.normalize("NFKD").replaceAll(/[\u0300-\u036f]/g, "").toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");
  return slug || "entry";
}

function npcLevelLabels(facts: CatalogFacts | undefined): ReadonlyMap<string, string> {
  const labels = new Map<string, string>();
  for (const fact of facts?.npcs ?? []) {
    if (fact.minLevel === null || fact.maxLevel === null) continue;
    labels.set(fact.entityKey, fact.minLevel === fact.maxLevel ? `lvl. ${fact.minLevel}` : `lvl. ${fact.minLevel}–${fact.maxLevel}`);
  }
  return labels;
}

function npcPlaceLabels(entities: readonly CatalogEntityRow[], relations: CatalogRelations | undefined): ReadonlyMap<string, string> {
  const entityByKey = new Map(entities.map((entity) => [entity.entityKey, entity]));
  const places = new Map<string, Set<string>>();
  for (const placement of relations?.placements ?? []) {
    const place = entityByKey.get(placement.sceneKey);
    const label = plainText(place?.name ?? placement.label ?? "");
    if (!label) continue;
    for (const role of placement.roles) {
      if (role.npcEntityKey === null) continue;
      const labels = places.get(role.npcEntityKey) ?? new Set<string>();
      labels.add(label);
      places.set(role.npcEntityKey, labels);
    }
  }
  return new Map([...places].map(([key, labels]) => [key, [...labels].sort().join(" / ")]));
}

function distinctSuffixes(group: readonly CatalogEntityRow[], labels: ReadonlyMap<string, string>): boolean {
  const values = group.map((entity) => labels.get(entity.entityKey));
  return values.every((value): value is string => value !== undefined && value.length > 0) && new Set(values).size === group.length;
}

export function buildEntityReferences(entities: readonly CatalogEntityRow[], context: ReferenceBuildContext = {}): ReadonlyMap<string, EntityRef> {
  const eligible = entities.flatMap((entity) => {
    const kind = publicKindForCatalogKind(entity.kind);
    return kind === null ? [] : [{ entity, kind, baseName: plainText(entity.name ?? "") || `${PUBLIC_KIND_BY_KIND[kind].label} ${entity.nativeId}` }];
  });
  const groups = new Map<string, typeof eligible>();
  for (const entry of eligible) {
    const key = `${entry.kind}\u0000${entry.baseName}`;
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }
  const levelLabels = npcLevelLabels(context.facts), placeLabels = npcPlaceLabels(entities, context.relations);
  const names = new Map<string, string>();
  for (const group of groups.values()) {
    if (group.length === 1) { names.set(group[0]!.entity.entityKey, group[0]!.baseName); continue; }
    const rows = group.map((entry) => entry.entity);
    const suffixes = group[0]!.kind === "npcs" && distinctSuffixes(rows, levelLabels) ? levelLabels
      : group[0]!.kind === "npcs" && distinctSuffixes(rows, placeLabels) ? placeLabels
        : new Map(rows.map((entity) => [entity.entityKey, `#${entity.nativeId}`]));
    for (const entry of group) names.set(entry.entity.entityKey, `${entry.baseName} (${suffixes.get(entry.entity.entityKey)!})`);
  }
  const nameGroups = new Map<string, typeof eligible>();
  for (const entry of eligible) {
    const key = `${entry.kind}\u0000${names.get(entry.entity.entityKey)!}`;
    const group = nameGroups.get(key);
    if (group) group.push(entry);
    else nameGroups.set(key, [entry]);
  }
  for (const group of nameGroups.values()) if (group.length > 1) {
    for (const entry of group) names.set(entry.entity.entityKey, `${names.get(entry.entity.entityKey)!} (#${entry.entity.nativeId})`);
  }

  const usedSlugs = new Map<string, Set<string>>();
  const refs: Array<readonly [string, EntityRef]> = [];
  for (const entry of eligible) {
    const registry = PUBLIC_KIND_BY_KIND[entry.kind], name = names.get(entry.entity.entityKey)!;
    let slug: string | undefined;
    if (registry.pages) {
      const used = usedSlugs.get(entry.kind) ?? new Set<string>();
      const base = slugify(name);
      slug = used.has(base) ? `${base}-${entry.entity.nativeId}` : base;
      let collision = 2;
      while (used.has(slug)) { slug = `${base}-${entry.entity.nativeId}-${collision}`; collision += 1; }
      used.add(slug);
      usedSlugs.set(entry.kind, used);
    }
    const icon = context.artByEntity?.get(entry.entity.entityKey)?.icon;
    refs.push([entry.entity.entityKey, { key: entry.entity.entityKey, kind: entry.kind, name, ...(slug ? { slug } : {}), ...(icon ? { icon } : {}) }]);
  }
  return new FrozenEntityRefMap(refs);
}

export function resolveCatalogEndpoint(refs: ReadonlyMap<string, EntityRef>, endpoint: CatalogEndpoint): EntityRef | UnresolvedRef {
  if (endpoint.entityKey !== null) {
    const ref = refs.get(endpoint.entityKey);
    if (ref) return ref;
  }
  return { key: null, label: plainText(endpoint.label ?? endpoint.entityKey ?? "") || "Unknown" };
}

export function createReferenceResolver(refs: ReadonlyMap<string, EntityRef>): (endpoint: CatalogEndpoint) => Ref {
  return (endpoint) => resolveCatalogEndpoint(refs, endpoint);
}
