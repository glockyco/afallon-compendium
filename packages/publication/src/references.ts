import type { CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogNpcFacts, CatalogPlacementRow, CatalogRelations } from "@afallon/contracts/catalog";
import type { Art, EntityRef, NpcVariantField, PublicLevel, PublicReferenceKind, Ref, UnresolvedRef } from "@afallon/contracts/public";
import { categoryLabel } from "@afallon/contracts/public";
import { baseName, groupEntities, nameKey, type EntityGroup } from "./grouping";
import { PUBLIC_KIND_BY_KIND, publicKindForCatalogKind } from "./kind-registry";
import { levelText } from "./levels";
import { displayName, plainText } from "./text";
import { gatheringNodeNames } from "./gathering";
import { abilityVersions, npcVariantFields } from "./variants";
import { isPlayerStat } from "./documents/stats";
import type { EffectWorldSource } from "./documents/projection";
import { effectPageKeys, effectFallbackName } from "./documents/effects";

export interface ReferenceBuildContext {
  facts?: CatalogFacts;
  relations?: CatalogRelations;
  artByEntity?: ReadonlyMap<string, Art>;
  /** The level of each creature record over its published placements. */
  npcLevels?: ReadonlyMap<string, PublicLevel>;
  /** The records that the reviewed exclusion list keeps out of the publication. */
  excluded?: ReadonlySet<string>;
  effectWorldSources?: readonly EffectWorldSource[];
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
export function recipeAnchor(name: string): string {
  return `recipe-${slugify(name)}`;
}

// Native enum values such as QUEST_COMPANION read as category labels: "Quest Companion".
function readableFact(value: string | null | undefined): string | undefined {
  const text = plainText(value ?? "");
  return text ? categoryLabel(text) : undefined;
}

function levelLabel(level: PublicLevel): string {
  return `Level ${levelText(level)}`;
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
    labelsOf(items, (item) => { const level = levelOf(item); return level !== undefined && level > 0 ? `Level ${level}` : undefined; }),
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

/** A label that tells a record apart from the other records of its group. An ordinal label only numbers the record. */
interface RecordLabel { text: string; ordinal: boolean }

/**
 * The first candidate label that names a record uniquely in its group. Records that no candidate names take their
 * readable label from `numbered`, with a number when several records share it. Other records take `fallback` of their
 * position in the group, which lists the records in native id order.
 */
function recordLabels(group: readonly CatalogEntityRow[], candidates: readonly ReadonlyMap<string, string>[], fallback: (position: number) => string, numbered?: ReadonlyMap<string, string>): ReadonlyMap<string, RecordLabel> {
  const result = new Map<string, RecordLabel>(), remaining = new Map(group.map((entity) => [entity.entityKey, entity]));
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
      result.set(entity.entityKey, { text: label, ordinal: false });
      remaining.delete(entity.entityKey);
      used.add(label);
    }
  }
  const byNumbered = new Map<string, CatalogEntityRow[]>();
  for (const entity of remaining.values()) {
    const label = numbered?.get(entity.entityKey);
    if (label === undefined || used.has(label)) { result.set(entity.entityKey, { text: fallback(group.indexOf(entity) + 1), ordinal: true }); continue; }
    const rows = byNumbered.get(label) ?? [];
    rows.push(entity);
    byNumbered.set(label, rows);
  }
  for (const [label, rows] of byNumbered) {
    if (rows.length === 1) result.set(rows[0]!.entityKey, { text: label, ordinal: false });
    else rows.forEach((entity, index) => result.set(entity.entityKey, { text: `${label} ${index + 1}`, ordinal: false }));
  }
  const texts = new Set<string>();
  for (const label of result.values()) {
    if (texts.has(label.text)) throw new Error(`Two records of ${group[0]!.entityKey}'s group share the label ${label.text}.`);
    texts.add(label.text);
  }
  return result;
}

/** Qualified names that still match take their position among the matching pages, in native id order. */
function ensureUniqueNames(entries: readonly { entity: CatalogEntityRow; kind: string }[], names: Map<string, string>): void {
  const groups = new Map<string, Array<{ entity: CatalogEntityRow; kind: string }>>();
  for (const entry of entries) {
    const key = `${entry.kind}\u0000${nameKey(names.get(entry.entity.entityKey)!)}`;
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  }
  for (const group of groups.values()) if (group.length > 1) {
    [...group].sort((left, right) => left.entity.nativeId - right.entity.nativeId)
      .forEach((entry, index) => names.set(entry.entity.entityKey, `${names.get(entry.entity.entityKey)!} (${index + 1})`));
  }
}

// Creature records of one name differ in where they stand, their level, or their type. A qualifier uses the first of
// these that names each record uniquely. MOB is the type of an ordinary creature, so it tells no record apart.
function npcCandidates(entityByKey: ReadonlyMap<string, CatalogEntityRow>, context: ReferenceBuildContext): ReadonlyMap<string, string>[] {
  const placements = context.relations?.placements ?? [];
  const places = readableLabels(npcPlacementLabels(placements, (placement) => displayName(entityByKey.get(placement.sceneKey)?.name ?? placement.label ?? "")));
  const areas = readableLabels(npcPlacementLabels(placements, (placement) => displayName(placement.area ?? "")));
  const levels = new Map([...context.npcLevels ?? []].map(([key, level]) => [key, levelLabel(level)] as const));
  const types = labelsOf(context.facts?.npcs ?? [], (npc) => npc.npcType === "MOB" ? undefined : readableFact(npc.npcType));
  return [places, areas, levels, types, combinedLabels(places, levels), combinedLabels(places, types)];
}

// A readable label that names one variant gives its anchor. An ordinal label, or a label whose slug another variant
// shares, keeps the native id anchor, because a position can change with the next build.
function variantMembers(group: EntityGroup, labels: ReadonlyMap<string, RecordLabel>): PageMember[] {
  const counts = new Map<string, number>();
  for (const member of group.members) { const slug = slugify(labels.get(member.entityKey)!.text); counts.set(slug, (counts.get(slug) ?? 0) + 1); }
  return group.members.map((entity) => {
    const label = labels.get(entity.entityKey)!;
    const anchor = !label.ordinal && counts.get(slugify(label.text)) === 1 ? slugify(label.text) : `n${entity.nativeId}`;
    return { entity, label: label.text, anchor };
  });
}

export function buildEntityReferences(entities: readonly CatalogEntityRow[], context: ReferenceBuildContext = {}): EntityReferences {
  const entityByKey = new Map(entities.map((entity) => [entity.entityKey, entity]));
  const excluded = context.excluded ?? new Set<string>();
  // An excluded record takes no part in grouping or name qualification, so a published record that shared its name only
  // with excluded records keeps the base name.
  const groups = groupEntities(entities.filter((entity) => !excluded.has(entity.entityKey))).map((group) =>
    group.kind === "effects" && context.facts && !displayName(group.members[0]!.name ?? "")
      ? { ...group, name: effectFallbackName(group.members[0]!, context.facts) } : group);
  const npcFacts = new Map((context.facts?.npcs ?? []).map((fact) => [fact.entityKey, fact]));
  const abilityFacts = new Map((context.facts?.abilities ?? []).map((fact) => [fact.entityKey, fact]));
  const reachableEffects = context.facts && context.relations
    ? effectPageKeys(context.facts, context.relations, context.effectWorldSources ?? []) : new Set<string>();

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
  const npcLabelCandidates = npcCandidates(entityByKey, context);
  const candidatesOf = (kind: PublicReferenceKind) => kind === "items" ? itemLabels : kind === "places" ? placeLabels : kind === "npcs" ? npcLabelCandidates : [];
  for (const same of qualified.values()) {
    if (same.length === 1) { names.set(same[0]!.key, same[0]!.name); continue; }
    const rows = same.map((group) => group.members[0]!).sort((left, right) => left.nativeId - right.nativeId);
    const kind = same[0]!.kind;
    // Effect pages keep their authored names. Their distinct URLs, links, and outcomes give context without record ids.
    if (kind === "effects") {
      for (const group of same) names.set(group.key, group.name);
      continue;
    }
    const suffixes = recordLabels(rows, candidatesOf(kind), (position) => String(position), kind === "places" ? entrances : undefined);
    for (const group of same) names.set(group.key, `${group.name} (${suffixes.get(group.key)!.text})`);
  }
  const pageEntries = groups.map((group) => ({ entity: group.members[0]!, kind: group.kind }));
  ensureUniqueNames(pageEntries.filter((entry) => entry.kind !== "effects"), names);

  const usedSlugs = new Map<string, Set<string>>();
  const refs: Array<readonly [string, EntityRef]> = [];
  const pages = new Map<string, PublishedPage>();
  const offeredClasses = new Set(context.facts?.progression.offeredClasses ?? []);
  for (const group of groups) {
    const registry = PUBLIC_KIND_BY_KIND[group.kind], name = names.get(group.key)!;
    // A class that no race offers is not playable, so it has no page.
    const hasPage = registry.pages && (group.kind !== "classes" || offeredClasses.has(group.members[0]!.entityKey))
      && (group.kind !== "stats" || (isPlayerStat(group.members[0]!)
        && context.facts?.progression.facts.some((fact) => fact.kind === "stats" && fact.entityKey === group.key)))
      && (group.kind !== "effects" || reachableEffects.has(group.members[0]!.entityKey));
    let slug: string | undefined;
    if (hasPage) {
      const used = usedSlugs.get(group.kind) ?? new Set<string>();
      const base = slugify(name);
      slug = used.has(base) ? `${base}-${group.members[0]!.nativeId}` : base;
      if (used.has(slug)) throw new Error(`Two ${group.kind} pages share the slug ${slug}.`);
      used.add(slug);
      usedSlugs.set(group.kind, used);
    }
    const iconOf = (entity: CatalogEntityRow) => context.artByEntity?.get(entity.entityKey)?.icon;
    const portraitOf = (entity: CatalogEntityRow) => group.kind === "npcs" ? context.artByEntity?.get(entity.entityKey)?.portrait : undefined;
    const pageIcon = group.members.map(iconOf).find((icon) => icon !== undefined);
    const pagePortrait = group.members.map(portraitOf).find((portrait) => portrait !== undefined);
    const pageRef: EntityRef = { key: group.key, kind: group.kind, name, ...(slug ? { slug } : {}), ...(pageIcon ? { icon: pageIcon } : {}), ...(pagePortrait ? { portrait: pagePortrait } : {}) };
    const variantFields = group.kind === "npcs" ? npcVariantFields(group.members.map((member) => npcFacts.get(member.entityKey)).filter((fact): fact is CatalogNpcFacts => fact !== undefined), abilityVersion) : [];
    const members = group.members.length > 1
      ? variantMembers(group, recordLabels(group.members, group.kind === "npcs" ? npcLabelCandidates : [], (position) => `Variant ${position}`))
      : [{ entity: group.members[0]!, label: name, anchor: `n${group.members[0]!.nativeId}` }];
    const versions = versionsByGroup.get(group.key) ?? [];
    if (hasPage) pages.set(group.key, { kind: group.kind, ref: pageRef, members, variantFields, versions });
    for (const member of members) {
      if (group.members.length === 1) { refs.push([member.entity.entityKey, pageRef]); continue; }
      // A creature reference always links its variant. Its name adds the variant label only when the variants differ in
      // facts that the page shows. An ability reference links its version when the page shows several.
      const variant = group.kind === "abilities"
        ? versions.length > 1 ? versions.find((version) => version.members.includes(member.entity))?.anchor : undefined
        : member.anchor;
      const icon = iconOf(member.entity) ?? pageIcon;
      const portrait = portraitOf(member.entity) ?? pagePortrait;
      const memberName = group.kind === "npcs" && variantFields.length > 0 ? `${name} (${member.label})` : name;
      refs.push([member.entity.entityKey, { ...pageRef, name: memberName, ...(variant ? { variant } : {}), ...(icon ? { icon } : {}), ...(portrait ? { portrait } : {}) }]);
    }
  }
  // A gathering node is a publication page without a game record of its own. Its catalog key names it.
  const nodeSlugs = new Set<string>();
  for (const [key, name] of gatheringNodeNames(context.facts?.gatheringNodes ?? [])) {
    const slug = slugify(name);
    if (nodeSlugs.has(slug)) throw new Error(`Two gatheringNodes pages share the slug ${slug}.`);
    nodeSlugs.add(slug);
    refs.push([key, { key, kind: "gatheringNodes", name, slug }]);
  }
  // An excluded record keeps its formatted name for text, like a class without a page, but gets no page and no slug.
  for (const entity of entities) {
    const kind = excluded.has(entity.entityKey) ? publicKindForCatalogKind(entity.kind) : null;
    if (kind !== null) refs.push([entity.entityKey, { key: entity.entityKey, kind, name: baseName(entity, kind) }]);
  }
  // Recipes have no pages: their links use the product's Crafting section or the skill's anchored row. A link keeps the
  // recipe's own icon, because the game shows that icon for the recipe.
  const refsByKey = new Map(refs);
  const recipeFacts = new Map(context.facts?.recipes.map((recipe) => [recipe.entityKey, recipe]) ?? []);
  const products = new Map(context.relations?.recipes.filter((row) => row.role === "product" && row.recipe.entityKey)
    .map((row) => [row.recipe.entityKey!, row.item.entityKey] as const) ?? []);
  for (const [index, [key, ref]] of refs.entries()) {
    if (ref.kind !== "recipes" || excluded.has(key)) continue;
    const productKey = products.get(key), product = productKey ? refsByKey.get(productKey) : undefined;
    const skillKey = recipeFacts.get(key)?.skill?.entityKey, skill = skillKey ? refsByKey.get(skillKey) : undefined;
    const target = product?.slug && product.kind === "items"
      ? { key: product.key, kind: "items" as const, slug: product.slug, variant: "crafting" }
      : skill?.slug && skill.kind === "skills"
        ? { key: skill.key, kind: "skills" as const, slug: skill.slug, variant: recipeAnchor(ref.name) }
        : null;
    refs[index] = [key, target ? { ...target, name: ref.name, ...(ref.icon ? { icon: ref.icon } : {}) } : ref];
  }
  linkEnchantmentsToItems(refs, refsByKey, context.facts, excluded);
  return { refs: new FrozenEntityRefMap(refs), pages };
}

/** An enchantment's own name links to the item that applies it, including differently named pairs. */
function linkEnchantmentsToItems(refs: Array<readonly [string, EntityRef]>, byKey: ReadonlyMap<string, EntityRef>,
  facts: CatalogFacts | undefined, excluded: ReadonlySet<string>): void {
  const items = new Map(facts?.items.flatMap((item) => item.enchantment?.entityKey
    ? [[item.enchantment.entityKey, item.entityKey] as const] : []) ?? []);
  for (const [index, [key, ref]] of refs.entries()) {
    if (ref.kind !== "enchantments" || excluded.has(key)) continue;
    const item = byKey.get(items.get(key) ?? "");
    if (item?.slug && item.kind === "items") refs[index] = [key, {
      ...item, name: ref.name, variant: "enchants", ...(ref.icon ? { icon: ref.icon } : {}),
    }];
  }
}

export function resolveCatalogEndpoint(refs: ReadonlyMap<string, EntityRef>, endpoint: CatalogEndpoint): EntityRef | UnresolvedRef {
  if (endpoint.entityKey !== null) {
    const ref = refs.get(endpoint.entityKey);
    if (ref) return PUBLIC_KIND_BY_KIND[ref.kind].pages && !ref.slug
      ? { key: null, label: ref.name } : ref;
  }
  return { key: null, label: plainText(endpoint.label ?? endpoint.entityKey ?? "") || "Unknown" };
}

export function createReferenceResolver(refs: ReadonlyMap<string, EntityRef>): (endpoint: CatalogEndpoint) => Ref {
  return (endpoint) => resolveCatalogEndpoint(refs, endpoint);
}
