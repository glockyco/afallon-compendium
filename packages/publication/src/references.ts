import type { CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogRelations } from "@afallon/contracts/catalog";
import type { Art, EntityRef, Ref, UnresolvedRef } from "@afallon/contracts/public";
import { plainText } from "./text";
import { PUBLIC_KIND_BY_KIND, publicKindForCatalogKind } from "./kind-registry";

export interface ReferenceBuildContext {
  facts?: CatalogFacts;
  relations?: CatalogRelations;
  artByEntity?: ReadonlyMap<string, Art>;
  mapSpaceLabels?: ReadonlyMap<string, string>;
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
  const slug = value.normalize("NFKD").replaceAll(/[\u0300-\u036f]/g, "").toLowerCase().replaceAll(/['’]/g, "").replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");
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

function abilityUserLabels(entities: readonly CatalogEntityRow[], facts: CatalogFacts | undefined): ReadonlyMap<string, string> {
  const entityByKey = new Map(entities.map((entity) => [entity.entityKey, entity]));
  const users = new Map<string, Set<string>>();
  for (const npc of facts?.npcs ?? []) {
    const name = plainText(entityByKey.get(npc.entityKey)?.name ?? "");
    if (!name) continue;
    for (const phase of npc.abilityPhases) for (const ability of phase.abilities) {
      if (ability.entityKey === null) continue;
      const labels = users.get(ability.entityKey) ?? new Set<string>();
      labels.add(name);
      users.set(ability.entityKey, labels);
    }
  }
  return new Map([...users].map(([key, labels]) => [key, [...labels].sort().join(" / ")]));
}

function readableFact(value: string | null | undefined): string | undefined {
  const text = plainText(value ?? "");
  if (!text) return undefined;
  const lower = text.toLocaleLowerCase();
  return `${lower[0]!.toLocaleUpperCase()}${lower.slice(1)}`;
}

function itemFactLabels(facts: CatalogFacts | undefined): ReadonlyMap<string, string> {
  const labels = new Map<string, string>();
  for (const item of facts?.items ?? []) {
    const rarity = readableFact(item.rarity);
    const detail = readableFact(item.itemType === "ARMOR" ? item.armorSlot ?? item.armorType ?? item.itemType
      : item.itemType === "WEAPON" ? item.weaponSlot ?? item.weaponType ?? item.itemType : item.itemType);
    const label = [rarity, detail].filter((value): value is string => value !== undefined).join(", ");
    if (label) labels.set(item.entityKey, label);
  }
  return labels;
}

function placeTypeLabels(facts: CatalogFacts | undefined): ReadonlyMap<string, string> {
  return new Map((facts?.places ?? []).flatMap((place) => {
    const label = readableFact(place.placeType);
    return label ? [[place.entityKey, label] as const] : [];
  }));
}

function placeParentLabels(entities: readonly CatalogEntityRow[], facts: CatalogFacts | undefined): ReadonlyMap<string, string> {
  const entityByKey = new Map(entities.map((entity) => [entity.entityKey, entity]));
  return new Map((facts?.places ?? []).flatMap((place) => {
    if (place.parentSceneKey === null) return [];
    const label = plainText(entityByKey.get(place.parentSceneKey)?.name ?? "");
    return label ? [[place.entityKey, label] as const] : [];
  }));
}

function placeLevelLabels(facts: CatalogFacts | undefined): ReadonlyMap<string, string> {
  return new Map((facts?.places ?? []).flatMap((place) => {
    const range = place.levelRange;
    if (!range) return [];
    const label = range.min === range.max ? `lvl. ${range.min}` : `lvl. ${range.min}–${range.max}`;
    return [[place.entityKey, label] as const];
  }));
}

function placeMapLabels(facts: CatalogFacts | undefined, mapSpaceLabels: ReadonlyMap<string, string> | undefined): ReadonlyMap<string, string> {
  return new Map((facts?.places ?? []).flatMap((place) => {
    const labels = [...new Set(place.mapSpaceIds.map((mapSpaceId) => mapSpaceLabels?.get(mapSpaceId)).filter((label): label is string => label !== undefined))].sort();
    return labels.length > 0 ? [[place.entityKey, labels.join(" / ")] as const] : [];
  }));
}

function combinedLabels(left: ReadonlyMap<string, string>, right: ReadonlyMap<string, string>): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  for (const [key, leftLabel] of left) {
    const rightLabel = right.get(key);
    if (rightLabel) result.set(key, `${leftLabel}, ${rightLabel}`);
  }
  return result;
}

function distinctSuffixes(group: readonly CatalogEntityRow[], labels: ReadonlyMap<string, string>): boolean {
  const values = group.map((entity) => labels.get(entity.entityKey));
  return values.every((value): value is string => value !== undefined && value.length > 0) && new Set(values).size === group.length;
}

function readableSuffixes(group: readonly CatalogEntityRow[], candidates: readonly ReadonlyMap<string, string>[]): ReadonlyMap<string, string> {
  const result = new Map<string, string>(), remaining = new Map(group.map((entity) => [entity.entityKey, entity]));
  const used = new Set<string>();
  for (const labels of candidates) {
    const byLabel = new Map<string, CatalogEntityRow[]>();
    for (const entity of remaining.values()) {
      const label = labels.get(entity.entityKey);
      if (!label || used.has(label)) continue;
      const rows = byLabel.get(label);
      if (rows) rows.push(entity);
      else byLabel.set(label, [entity]);
    }
    for (const [label, rows] of byLabel) {
      if (rows.length !== 1) continue;
      const entity = rows[0]!;
      result.set(entity.entityKey, label);
      remaining.delete(entity.entityKey);
      used.add(label);
    }
  }
  for (const entity of remaining.values()) result.set(entity.entityKey, `#${entity.nativeId}`);
  return result;
}

function ensureUniqueNames(entries: readonly { entity: CatalogEntityRow; kind: string }[], names: Map<string, string>): void {
  const groups = new Map<string, Array<{ entity: CatalogEntityRow; kind: string }>>();
  for (const entry of entries) {
    const key = `${entry.kind}\u0000${names.get(entry.entity.entityKey)!}`;
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }
  for (const group of groups.values()) if (group.length > 1) {
    for (const entry of group) names.set(entry.entity.entityKey, `${names.get(entry.entity.entityKey)!} (#${entry.entity.nativeId})`);
  }
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
  const levelLabels = npcLevelLabels(context.facts), npcPlaces = npcPlaceLabels(entities, context.relations);
  const abilityUsers = abilityUserLabels(entities, context.facts), itemLabels = itemFactLabels(context.facts);
  const placeTypes = placeTypeLabels(context.facts), placeParents = placeParentLabels(entities, context.facts);
  const placeLevels = placeLevelLabels(context.facts), placeMaps = placeMapLabels(context.facts, context.mapSpaceLabels);
  const names = new Map<string, string>(), slugNames = new Map<string, string>();
  for (const group of groups.values()) {
    if (group.length === 1) {
      names.set(group[0]!.entity.entityKey, group[0]!.baseName);
      slugNames.set(group[0]!.entity.entityKey, group[0]!.baseName);
      continue;
    }
    const rows = group.map((entry) => entry.entity), kind = group[0]!.kind;
    const stableSuffixes = kind === "npcs" && distinctSuffixes(rows, levelLabels) ? levelLabels
      : kind === "npcs" && distinctSuffixes(rows, npcPlaces) ? npcPlaces
        : new Map(rows.map((entity) => [entity.entityKey, `#${entity.nativeId}`]));
    const candidates = kind === "npcs" ? [levelLabels, npcPlaces, combinedLabels(levelLabels, npcPlaces)]
      : kind === "abilities" ? [abilityUsers]
        : kind === "items" ? [itemLabels]
          : kind === "places" ? [placeTypes, placeParents, placeLevels, placeMaps,
            combinedLabels(placeTypes, placeParents), combinedLabels(placeTypes, placeLevels), combinedLabels(placeTypes, placeMaps)]
            : [];
    const displaySuffixes = readableSuffixes(rows, candidates);
    for (const entry of group) {
      names.set(entry.entity.entityKey, `${entry.baseName} (${displaySuffixes.get(entry.entity.entityKey)!})`);
      slugNames.set(entry.entity.entityKey, `${entry.baseName} (${stableSuffixes.get(entry.entity.entityKey)!})`);
    }
  }
  ensureUniqueNames(eligible, names);
  ensureUniqueNames(eligible, slugNames);

  const usedSlugs = new Map<string, Set<string>>();
  const refs: Array<readonly [string, EntityRef]> = [];
  for (const entry of eligible) {
    const registry = PUBLIC_KIND_BY_KIND[entry.kind], name = names.get(entry.entity.entityKey)!;
    let slug: string | undefined;
    if (registry.pages) {
      const used = usedSlugs.get(entry.kind) ?? new Set<string>();
      const base = slugify(slugNames.get(entry.entity.entityKey)!);
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
