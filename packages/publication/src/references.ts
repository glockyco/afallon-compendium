import type { CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogNpcFacts, CatalogPlacementRow, CatalogRelations } from "@afallon/contracts/catalog";
import type { Art, EntityRef, NpcVariantField, PublicLevel, PublicReferenceKind, Ref, UnresolvedRef } from "@afallon/contracts/public";
import { groupEntities, nameKey, type EntityGroup } from "./grouping";
import { PUBLIC_KIND_BY_KIND } from "./kind-registry";
import { levelText } from "./levels";
import { displayName, plainText } from "./text";
import { abilityVersions, npcVariantFields } from "./variants";

export interface ReferenceBuildContext {
  facts?: CatalogFacts;
  relations?: CatalogRelations;
  artByEntity?: ReadonlyMap<string, Art>;
  /** The level of each creature record over its published placements. */
  npcLevels?: ReadonlyMap<string, PublicLevel>;
}

/** One authored record of a page. `label` tells it apart from the other records of the page. */
export interface PageMember { entity: CatalogEntityRow; anchor: string; label: string }

/** The records of an ability page that share their rank texts. */
export interface PageVersion { anchor: string; members: readonly CatalogEntityRow[] }

export interface PublishedPage {
  kind: PublicReferenceKind;
  ref: EntityRef;
  members: readonly PageMember[];
  /** The record facts that differ between the members of a creature page. */
  variantFields: readonly NpcVariantField[];
  /** The versions of an ability page. */
  versions: readonly PageVersion[];
}

export interface EntityReferences {
  /** The reference for each catalog entity key. A member of a grouped page links to the page and its variant. */
  refs: ReadonlyMap<string, EntityRef>;
  /** The pages, keyed by the key of their first member. */
  pages: ReadonlyMap<string, PublishedPage>;
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

// Native enum values such as QUEST_COMPANION read as "Quest companion".
function readableFact(value: string | null | undefined): string | undefined {
  const text = plainText(value ?? "").replaceAll("_", " ").trim();
  if (!text) return undefined;
  const lower = text.toLocaleLowerCase();
  return `${lower[0]!.toLocaleUpperCase()}${lower.slice(1)}`;
}

function levelLabel(level: PublicLevel): string {
  return `lvl. ${levelText(level)}`;
}

// A qualifier names at most this many areas or places. A longer list is not a readable name, so such a record takes
// the next qualifier candidate.
const READABLE_PLACEMENT_LABELS = 3;

/** Each creature's distinct placement labels, sorted, for one label source. */
function npcPlacementLabels(placements: readonly CatalogPlacementRow[], labelOf: (placement: CatalogPlacementRow) => string): ReadonlyMap<string, readonly string[]> {
  const labels = new Map<string, Set<string>>();
  for (const placement of placements) {
    const label = labelOf(placement);
    if (!label) continue;
    for (const role of placement.roles) {
      if (role.npcEntityKey === null) continue;
      const npcLabels = labels.get(role.npcEntityKey) ?? new Set<string>();
      npcLabels.add(label);
      labels.set(role.npcEntityKey, npcLabels);
    }
  }
  return new Map([...labels].map(([key, values]) => [key, [...values].sort()]));
}

function readableLabels(labels: ReadonlyMap<string, readonly string[]>): ReadonlyMap<string, string> {
  return new Map([...labels].flatMap(([key, values]) => values.length <= READABLE_PLACEMENT_LABELS ? [[key, values.join(" / ")] as const] : []));
}

function combinedLabels(left: ReadonlyMap<string, string>, right: ReadonlyMap<string, string>): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  for (const [key, leftLabel] of left) {
    const rightLabel = right.get(key);
    if (rightLabel) result.set(key, `${leftLabel}, ${rightLabel}`);
  }
  return result;
}

function labelsOf<T extends { entityKey: string }>(rows: readonly T[], label: (row: T) => string | undefined): ReadonlyMap<string, string> {
  return new Map(rows.flatMap((row) => {
    const value = label(row);
    return value ? [[row.entityKey, value] as const] : [];
  }));
}

// Items that share a name differ in a fact that a player sees on the item: rarity, armor or weapon type, damage, level
// requirement, or stats.
function itemCandidates(facts: CatalogFacts | undefined): ReadonlyMap<string, string>[] {
  const items = facts?.items ?? [];
  const gear = (item: CatalogFacts["items"][number]) => item.itemType === "ARMOR" ? readableFact(item.armorType) : item.itemType === "WEAPON" ? readableFact(item.weaponType) : undefined;
  const levelOf = (item: CatalogFacts["items"][number]) => item.equipmentRequirements.flatMap((group) => group.requirements).find((requirement) => requirement.type.name === "Level")?.amounts.primary;
  return [
    labelsOf(items, (item) => readableFact(item.rarity)),
    labelsOf(items, gear),
    labelsOf(items, (item) => item.itemType === "WEAPON" && item.minDamage !== null && item.maxDamage !== null ? `${item.minDamage}–${item.maxDamage} damage` : undefined),
    labelsOf(items, (item) => { const level = levelOf(item); return level !== undefined && level > 0 ? `lvl. ${level}` : undefined; }),
    labelsOf(items, (item) => item.stats.filter((row) => row.stat.entityKey !== "stats:53").slice(0, 3).map((row) => `${displayName(row.stat.label ?? "") || "Stat"} ${row.amount >= 0 ? "+" : ""}${row.amount}${row.isPercent ? "%" : ""}`).join(", ") || undefined),
  ];
}

function placeCandidates(entityByKey: ReadonlyMap<string, CatalogEntityRow>, facts: CatalogFacts | undefined): ReadonlyMap<string, string>[] {
  const places = facts?.places ?? [];
  const types = labelsOf(places, (place) => readableFact(place.placeType));
  const parents = labelsOf(places, (place) => place.parentSceneKey === null ? undefined : displayName(entityByKey.get(place.parentSceneKey)?.name ?? "") || undefined);
  const levels = labelsOf(places, (place) => place.levelRange ? levelLabel({ ...place.levelRange, scales: false }) : undefined);
  return [types, parents, levels, combinedLabels(types, parents), combinedLabels(types, levels)];
}

/** The areas from which the world's doorways lead into each place. */
function placeEntrances(relations: CatalogRelations | undefined): ReadonlyMap<string, string> {
  const areaByPlacement = new Map((relations?.placements ?? []).map((placement) => [placement.placementId, displayName(placement.area ?? "")]));
  const entrances = new Map<string, Set<string>>();
  for (const transition of relations?.transitions ?? []) {
    if (transition.destinationSceneKey === null || transition.destinationSceneKey === transition.sourceSceneKey) continue;
    for (const placementId of transition.placementIds) {
      const area = areaByPlacement.get(placementId);
      if (!area) continue;
      const areas = entrances.get(transition.destinationSceneKey) ?? new Set<string>();
      areas.add(area);
      entrances.set(transition.destinationSceneKey, areas);
    }
  }
  return readableLabels(new Map([...entrances].map(([key, areas]) => [key, [...areas].sort()])));
}

/**
 * The first candidate label that names a record uniquely in its group. Records that no candidate names take a label from
 * `fallback`, which numbers records that share a last readable label, or their native id.
 */
function readableSuffixes(group: readonly CatalogEntityRow[], candidates: readonly ReadonlyMap<string, string>[], ordinal?: ReadonlyMap<string, string>): ReadonlyMap<string, string> {
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
  const byOrdinal = new Map<string, CatalogEntityRow[]>();
  for (const entity of remaining.values()) {
    const label = ordinal?.get(entity.entityKey);
    if (label === undefined) { result.set(entity.entityKey, `#${entity.nativeId}`); continue; }
    const rows = byOrdinal.get(label) ?? [];
    rows.push(entity);
    byOrdinal.set(label, rows);
  }
  for (const [label, rows] of byOrdinal) {
    if (rows.length === 1) result.set(rows[0]!.entityKey, label);
    else rows.forEach((entity, index) => result.set(entity.entityKey, `${label} ${index + 1}`));
  }
  return result;
}

function ensureUniqueNames(entries: readonly { entity: CatalogEntityRow; kind: string }[], names: Map<string, string>): void {
  const groups = new Map<string, Array<{ entity: CatalogEntityRow; kind: string }>>();
  for (const entry of entries) {
    const key = `${entry.kind}\u0000${nameKey(names.get(entry.entity.entityKey)!)}`;
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }
  for (const group of groups.values()) if (group.length > 1) {
    for (const entry of group) names.set(entry.entity.entityKey, `${names.get(entry.entity.entityKey)!} (#${entry.entity.nativeId})`);
  }
}

// Creature records of one name differ in where they stand, their level, or their type. A qualifier uses the first of
// these that names each record uniquely.
function npcCandidates(entityByKey: ReadonlyMap<string, CatalogEntityRow>, context: ReferenceBuildContext): ReadonlyMap<string, string>[] {
  const placements = context.relations?.placements ?? [];
  const places = readableLabels(npcPlacementLabels(placements, (placement) => displayName(entityByKey.get(placement.sceneKey)?.name ?? placement.label ?? "")));
  const areas = readableLabels(npcPlacementLabels(placements, (placement) => displayName(placement.area ?? "")));
  const levels = new Map([...context.npcLevels ?? []].map(([key, level]) => [key, levelLabel(level)] as const));
  const types = labelsOf(context.facts?.npcs ?? [], (npc) => readableFact(npc.npcType));
  return [places, areas, levels, types, combinedLabels(places, levels), combinedLabels(places, types)];
}

function anchorFor(entity: CatalogEntityRow, label: string, unique: boolean): string {
  return unique && !label.startsWith("#") ? slugify(label) : `n${entity.nativeId}`;
}

function variantMembers(group: EntityGroup, labels: ReadonlyMap<string, string>): PageMember[] {
  const counts = new Map<string, number>();
  for (const member of group.members) { const label = labels.get(member.entityKey)!; counts.set(slugify(label), (counts.get(slugify(label)) ?? 0) + 1); }
  return group.members.map((entity) => {
    const label = labels.get(entity.entityKey)!;
    return { entity, label, anchor: anchorFor(entity, label, counts.get(slugify(label)) === 1) };
  });
}

export function buildEntityReferences(entities: readonly CatalogEntityRow[], context: ReferenceBuildContext = {}): EntityReferences {
  const entityByKey = new Map(entities.map((entity) => [entity.entityKey, entity]));
  const groups = groupEntities(entities);
  const npcFacts = new Map((context.facts?.npcs ?? []).map((fact) => [fact.entityKey, fact]));
  const abilityFacts = new Map((context.facts?.abilities ?? []).map((fact) => [fact.entityKey, fact]));

  // Ability versions first, because creature variants compare their abilities by version.
  const versionByAbility = new Map<string, string>(), versionsByGroup = new Map<string, PageVersion[]>();
  for (const group of groups) if (group.kind === "abilities") {
    const facts = group.members.flatMap((member) => { const fact = abilityFacts.get(member.entityKey); return fact ? [fact] : []; });
    const versions = abilityVersions(facts).map((version) => {
      const members = version.map((fact) => entityByKey.get(fact.entityKey)!);
      return { anchor: `n${members[0]!.nativeId}`, members };
    });
    versionsByGroup.set(group.key, versions);
    for (const version of versions) for (const member of version.members) versionByAbility.set(member.entityKey, `${group.key}#${version.anchor}`);
  }
  const abilityVersion = (key: string | null) => key === null ? null : versionByAbility.get(key) ?? key;

  // Separate entities of one name, such as two items, keep separate pages with a qualifier in the name.
  const qualified = new Map<string, EntityGroup[]>();
  for (const group of groups) {
    const key = `${group.kind}\u0000${nameKey(group.name)}`;
    const same = qualified.get(key);
    if (same) same.push(group);
    else qualified.set(key, [group]);
  }
  const names = new Map<string, string>();
  const itemLabels = itemCandidates(context.facts), placeLabels = placeCandidates(entityByKey, context.facts), entrances = placeEntrances(context.relations);
  for (const same of qualified.values()) {
    if (same.length === 1) { names.set(same[0]!.key, same[0]!.name); continue; }
    const rows = same.map((group) => group.members[0]!);
    const kind = same[0]!.kind;
    const suffixes = readableSuffixes(rows, kind === "items" ? itemLabels : kind === "places" ? placeLabels : [], kind === "places" ? entrances : undefined);
    for (const group of same) names.set(group.key, `${group.name} (${suffixes.get(group.key)!})`);
  }
  const pageEntries = groups.map((group) => ({ entity: group.members[0]!, kind: group.kind }));
  ensureUniqueNames(pageEntries, names);

  const npcLabelCandidates = npcCandidates(entityByKey, context);
  const usedSlugs = new Map<string, Set<string>>();
  const refs: Array<readonly [string, EntityRef]> = [];
  const pages = new Map<string, PublishedPage>();
  for (const group of groups) {
    const registry = PUBLIC_KIND_BY_KIND[group.kind], name = names.get(group.key)!;
    let slug: string | undefined;
    if (registry.pages) {
      const used = usedSlugs.get(group.kind) ?? new Set<string>();
      const base = slugify(name);
      slug = used.has(base) ? `${base}-${group.members[0]!.nativeId}` : base;
      if (used.has(slug)) throw new Error(`Two ${group.kind} pages share the slug ${slug}.`);
      used.add(slug);
      usedSlugs.set(group.kind, used);
    }
    const iconOf = (entity: CatalogEntityRow) => context.artByEntity?.get(entity.entityKey)?.icon;
    const pageIcon = group.members.map(iconOf).find((icon) => icon !== undefined);
    const pageRef: EntityRef = { key: group.key, kind: group.kind, name, ...(slug ? { slug } : {}), ...(pageIcon ? { icon: pageIcon } : {}) };
    const variantFields = group.kind === "npcs" ? npcVariantFields(group.members.map((member) => npcFacts.get(member.entityKey)).filter((fact): fact is CatalogNpcFacts => fact !== undefined), abilityVersion) : [];
    const members = group.members.length > 1 ? variantMembers(group, readableSuffixes(group.members, group.kind === "npcs" ? npcLabelCandidates : [])) : [{ entity: group.members[0]!, label: name, anchor: `n${group.members[0]!.nativeId}` }];
    const versions = versionsByGroup.get(group.key) ?? [];
    if (registry.pages) pages.set(group.key, { kind: group.kind, ref: pageRef, members, variantFields, versions });
    for (const member of members) {
      if (group.members.length === 1) { refs.push([member.entity.entityKey, pageRef]); continue; }
      // A creature reference always links its variant. Its name adds the variant label only when the variants differ in
      // facts that the page shows. An ability reference links its version when the page shows several.
      const variant = group.kind === "abilities"
        ? versions.length > 1 ? versions.find((version) => version.members.includes(member.entity))?.anchor : undefined
        : member.anchor;
      const icon = iconOf(member.entity) ?? pageIcon;
      const memberName = group.kind === "npcs" && variantFields.length > 0 ? `${name} (${member.label})` : name;
      refs.push([member.entity.entityKey, { ...pageRef, name: memberName, ...(variant ? { variant } : {}), ...(icon ? { icon } : {}) }]);
    }
  }
  return { refs: new FrozenEntityRefMap(refs), pages };
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
