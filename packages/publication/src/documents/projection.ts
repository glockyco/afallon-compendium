import type { CatalogAvailabilityRule, CatalogCondition, CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogGatedSourceRow, CatalogGatheringNode, CatalogNpcFacts, CatalogPlacementRow, CatalogRelations, CatalogRequirement, CatalogRequirementGroup } from "@afallon/contracts/catalog";
import { type Art, type AvailabilityRule, type EntityRef, isEntityRef, isPublicPageKind, type PlacementRef, type PlaceSpots, type PublicLevel, type PublicMarkerCategory, type Ref, type RequirementGroup, type RequirementRef } from "@afallon/contracts/public";
import type { CorruptionRewards } from "../corruption-rewards";
import { type CraftingRule, craftingRule, recipeTeachings } from "../crafting";
import { placedNodeBySource } from "../gathering";
import { placeSpots } from "../place-spots";
import type { PlaceVariant } from "../place-variants";
import type { EntityReferences, PublishedPage } from "../references";
import { displayName, plainText, withoutMarkup } from "../text";

export type ReferenceResolver = (endpoint: CatalogEndpoint) => Ref;

export type PublishedPlacement = PlacementRef & { categories: readonly PublicMarkerCategory[] };

export interface DocumentProjectionInput {
  entities: readonly CatalogEntityRow[];
  facts: CatalogFacts;
  relations: CatalogRelations;
  references: EntityReferences;
  resolve: ReferenceResolver;
  artByEntity: ReadonlyMap<string, Art>;
  placements: ReadonlyMap<string, PublishedPlacement>;
  regionIdsByMapSpace: ReadonlyMap<string, readonly string[]>;
  /** For each published placement, the level of each creature record that it produces. */
  npcLevels: ReadonlyMap<string, ReadonlyMap<string, PublicLevel>>;
  /** The published placements that the map links to each entity key, such as the for-sale signs of a property. */
  placementIdsByKey: ReadonlyMap<string, readonly string[]>;
  placeVariants?: ReadonlyMap<string, PlaceVariant>;
  excluded?: ReadonlySet<string>;
  /** The weapon types that each class can use, as the game names them. */
  classWeapons?: ReadonlyMap<string, readonly string[]>;
  corruptionRewards?: CorruptionRewards;
  /** The map spaces of the overworld. A place on one of them that is not a variant or a challenge stone is the overworld. */
  overworldMapSpaceIds?: ReadonlySet<string>;
  /** The spot of the challenge stone that starts each challenge stone place, by place key. */
  challengeStones?: ReadonlyMap<string, PlacementRef>;
}

export type RelationIndexes = {
  entities: Map<string, CatalogEntityRow>;
  recipes: ReadonlyMap<string, CatalogFacts["recipes"][number]>;
  /** The recipe that each item teaches, and the items that teach each recipe. */
  teachings: ReadonlyMap<string, string>;
  teachersByRecipe: Map<string, string[]>;
  /** The gathering node of each placed-object source, and each node by key. */
  placedNodes: ReadonlyMap<string, string>;
  nodes: ReadonlyMap<string, CatalogGatheringNode>;
  /** The recorded crafting rule, when a recipe with a skill has ranks that need it. */
  crafting: CraftingRule | null;
  npcFacts: Map<string, CatalogNpcFacts>;
  dropsByOwner: Map<string, CatalogRelations["drops"]>;
  dropsByItem: Map<string, CatalogRelations["drops"]>;
  vendorsByNpc: Map<string, CatalogRelations["vendors"]>;
  vendorsByItem: Map<string, CatalogRelations["vendors"]>;
  vendorsByCurrency: Map<string, CatalogRelations["vendors"]>;
  gathersByResource: Map<string, CatalogRelations["gathers"]>;
  gathersByItem: Map<string, CatalogRelations["gathers"]>;
  containersByItem: Map<string, CatalogRelations["containers"]>;
  interactionsByItem: Map<string, CatalogRelations["interactions"]>;
  interactionsByPlace: Map<string, CatalogRelations["interactions"]>;
  questsByQuest: Map<string, CatalogRelations["quests"]>;
  questsByCounterpart: Map<string, CatalogRelations["quests"]>;
  gatedSourcesBySubject: Map<string, CatalogGatedSourceRow[]>;
  recipesByRecipe: Map<string, CatalogRelations["recipes"]>;
  recipesByItem: Map<string, CatalogRelations["recipes"]>;
  placementsByNpc: Map<string, CatalogPlacementRow[]>;
  placementsByScene: Map<string, CatalogPlacementRow[]>;
  chainOrder: Map<string, number>;
};

export function pushIndex<T>(index: Map<string, T[]>, key: string | null, value: T): void {
  if (key === null) return;
  const rows = index.get(key);
  if (rows) rows.push(value);
  else index.set(key, [value]);
}

export function relationIndexes(entities: readonly CatalogEntityRow[], facts: CatalogFacts, relations: CatalogRelations): RelationIndexes {
  const result: RelationIndexes = {
    entities: new Map(entities.map((entity) => [entity.entityKey, entity])), recipes: new Map(facts.recipes.map((recipe) => [recipe.entityKey, recipe])),
    npcFacts: new Map(facts.npcs.map((fact) => [fact.entityKey, fact])),
    teachings: recipeTeachings(facts), teachersByRecipe: new Map(), placedNodes: placedNodeBySource(facts.gatheringNodes),
    nodes: new Map(facts.gatheringNodes.map((node) => [node.entityKey, node])), crafting: facts.recipes.some((recipe) => recipe.skill?.entityKey && recipe.ranks.length > 0) ? craftingRule(facts) : null,
    dropsByOwner: new Map(), dropsByItem: new Map(), vendorsByNpc: new Map(), vendorsByItem: new Map(), vendorsByCurrency: new Map(),
    gathersByResource: new Map(), gathersByItem: new Map(), containersByItem: new Map(), interactionsByItem: new Map(), interactionsByPlace: new Map(), questsByQuest: new Map(),
    questsByCounterpart: new Map(), gatedSourcesBySubject: new Map(), recipesByRecipe: new Map(), recipesByItem: new Map(), placementsByNpc: new Map(), placementsByScene: new Map(),
    chainOrder: new Map(facts.quests.flatMap((quest) => quest.chainOrder === null ? [] : [[quest.entityKey, quest.chainOrder] as const])),
  };
  for (const [item, recipe] of result.teachings) pushIndex(result.teachersByRecipe, recipe, item);
  for (const row of relations.drops) {
    pushIndex(result.dropsByOwner, row.owner.entityKey, row);
    pushIndex(result.dropsByItem, row.item.entityKey, row);
  }
  for (const row of relations.vendors) {
    pushIndex(result.vendorsByNpc, row.npc.entityKey, row);
    pushIndex(result.vendorsByItem, row.item.entityKey, row);
    pushIndex(result.vendorsByCurrency, row.currency?.entityKey ?? null, row);
  }
  for (const row of relations.gathers) {
    pushIndex(result.gathersByResource, row.resource?.entityKey ?? null, row);
    pushIndex(result.gathersByItem, row.item.entityKey, row);
  }
  for (const row of relations.containers) pushIndex(result.containersByItem, row.item.entityKey, row);
  for (const row of relations.interactions) {
    pushIndex(result.interactionsByItem, row.item.entityKey, row);
    if (row.place?.entityKey) pushIndex(result.interactionsByPlace, row.place.entityKey, row);
  }
  for (const row of relations.quests) {
    pushIndex(result.questsByQuest, row.quest.entityKey, row);
    pushIndex(result.questsByCounterpart, row.counterpart?.entityKey ?? null, row);
  }
  for (const row of relations.gatedSources) for (const subject of row.subjects) pushIndex(result.gatedSourcesBySubject, subject.entityKey, row);
  for (const row of relations.recipes) {
    pushIndex(result.recipesByRecipe, row.recipe.entityKey, row);
    pushIndex(result.recipesByItem, row.item.entityKey, row);
  }
  for (const placement of relations.placements) {
    pushIndex(result.placementsByScene, placement.sceneKey, placement);
    for (const npcKey of new Set(placement.roles.map((role) => role.npcEntityKey))) pushIndex(result.placementsByNpc, npcKey, placement);
  }
  return result;
}

/** The reader name of an object that gives items. The "For sale 2500 gold" signs are not property signs: a use costs Gold Coin and rolls a loot table. */
export function interactionLabel(objectName: string | null): string {
  return /^For sale \d+ gold$/i.test(objectName ?? "") ? "For Sale Sign" : displayName(objectName ?? "") || "Object";
}

export function conditionsById(conditions: readonly CatalogCondition[]): ReadonlyMap<string, CatalogCondition> {
  return new Map(conditions.map((condition) => [condition.conditionId, condition]));
}

export function endpointOrUnknown(resolve: ReferenceResolver, endpoint: CatalogEndpoint | null, label: string): Ref {
  return endpoint === null ? { key: null, label } : resolve(endpoint);
}

export function optionalFactRef(resolve: ReferenceResolver, endpoint: CatalogEndpoint | null | undefined): Ref | undefined {
  return endpoint === null || endpoint === undefined || endpoint.entityKey === null ? undefined : resolve(endpoint);
}

// A record without a page, such as an excluded record or a class that no race offers, reads as text in a requirement.
function requirementSpan(ref: Ref): RequirementRef["spans"][number] {
  return isEntityRef(ref) && (isPublicPageKind(ref.kind) || ref.kind === "recipes") && ref.slug === undefined ? { text: ref.name } : { ref };
}

function projectRequirement(requirement: CatalogRequirement, resolve: ReferenceResolver): RequirementRef {
  return {
    type: { value: requirement.type.value, name: plainText(requirement.type.name) }, rule: { value: requirement.rule.value, name: plainText(requirement.rule.name) }, label: plainText(requirement.label),
    spans: requirement.spans.map((span) => "text" in span ? { text: withoutMarkup(span.text) } : requirementSpan(resolve(span.endpoint))),
  };
}

// A group that needs every requirement reads a lowest and a highest level as one range: "levels 1–10".
function withLevelRanges(group: CatalogRequirementGroup): CatalogRequirement[] {
  if (group.mode !== "all") return group.requirements;
  const level = (name: string) => group.requirements.filter((requirement) => requirement.type.name === "Level" && requirement.value?.name === name);
  const [lowest, highest] = [level("EqualOrAbove"), level("EqualOrBelow")];
  if (lowest.length !== 1 || highest.length !== 1 || lowest[0]!.rule.value !== highest[0]!.rule.value) return group.requirements;
  const low = lowest[0]!.amounts.primary, high = highest[0]!.amounts.primary;
  if (low > high) return group.requirements;
  const text = low === high ? `level ${low}` : `levels ${low}–${high}`;
  return group.requirements.flatMap((requirement) => requirement === highest[0] ? []
    : requirement === lowest[0] ? [{ ...requirement, label: text, spans: [{ text }] }] : [requirement]);
}

export function projectRequirementGroups(groups: readonly CatalogRequirementGroup[], resolve: ReferenceResolver): RequirementGroup[] {
  return groups.map((group) => ({ mode: group.mode, checkCount: group.checkCount, ...(group.requiredCount === null ? {} : { requiredCount: Math.max(0, group.requiredCount) }), requirements: withLevelRanges(group).map((requirement) => projectRequirement(requirement, resolve)) }));
}

export function requirementsFor(conditionIds: readonly string[], conditions: ReadonlyMap<string, CatalogCondition>, resolve: ReferenceResolver): RequirementGroup[] {
  return conditionIds.flatMap((conditionId): RequirementGroup[] => {
    const condition = conditions.get(conditionId);
    if (!condition) throw new Error(`Missing catalog condition ${conditionId}.`);
    return projectRequirementGroups(condition.requirements, resolve);
  });
}

export function projectAvailability(rules: readonly CatalogAvailabilityRule[], conditions: ReadonlyMap<string, CatalogCondition>, resolve: ReferenceResolver): AvailabilityRule[] {
  return rules.flatMap((rule) => {
    const requirements = requirementsFor([rule.conditionId], conditions, resolve);
    if (requirements.length === 0) return [];
    return [{ effect: rule.effect, requirements, ...(rule.effect === "temporary" && rule.durationSeconds !== null ? { durationSeconds: rule.durationSeconds } : {}) }];
  });
}

export function groupPlacedRows<T extends { placements: PlacementRef[] }>(rows: readonly T[]): T[] {
  const groups = new Map<string, { facts: Omit<T, "placements">; placements: Map<string, PlacementRef> }>();
  for (const row of rows) {
    if (row.placements.length === 0) continue;
    const { placements, ...facts } = row;
    const key = JSON.stringify(facts);
    let current = groups.get(key);
    if (!current) {
      current = { facts: facts as Omit<T, "placements">, placements: new Map() };
      groups.set(key, current);
    }
    for (const placement of placements) current.placements.set(placement.placementId, placement);
  }
  return [...groups.values()].map(({ facts, placements }) => ({ ...facts, placements: [...placements.values()] }) as T);
}

export function publishedPlacements(ids: readonly string[], placements: ReadonlyMap<string, PlacementRef>): PlacementRef[] {
  const result: PlacementRef[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const placement = placements.get(id);
    if (placement && !seen.has(placement.placementId)) {
      result.push({ placementId: placement.placementId, mapSpaceId: placement.mapSpaceId, label: placement.label });
      seen.add(placement.placementId);
    }
  }
  return result;
}

export function groupPlacementCounts<T extends object>(rows: readonly (T & { placements: PlacementRef[] })[]): Array<T & { placementCount: number; places: PlaceSpots[] }> {
  const grouped = new Map<string, { facts: T; placements: Map<string, PlacementRef> }>();
  for (const row of rows) {
    const { placements, ...facts } = row;
    const key = JSON.stringify(facts);
    const current = grouped.get(key) ?? { facts: facts as T, placements: new Map<string, PlacementRef>() };
    for (const placement of placements) current.placements.set(placement.placementId, placement);
    grouped.set(key, current);
  }
  return [...grouped.values()].map(({ facts, placements }) => ({ ...facts, placementCount: placements.size, places: placeSpots([...placements.values()]) }));
}

export function recordLocations(key: string, indexes: RelationIndexes, placements: ReadonlyMap<string, PlacementRef>): PlacementRef[] {
  return publishedPlacements((indexes.placementsByNpc.get(key) ?? []).map((placement) => placement.placementId), placements);
}

export function optionalCount(value: number | null): number | undefined {
  return value !== null && Number.isInteger(value) && value >= 0 ? value : undefined;
}

export function optionalChance(value: number | null): number | undefined {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;
}

/** The page reference for a record reference: no variant, and the page's own name. */
function pageRef(ref: EntityRef, input: DocumentProjectionInput): EntityRef {
  return input.references.pages.get(ref.key)?.ref ?? ref;
}

/** One reference for references to one page: their variant when they all name the same one, else the page. */
export function pageOrVariant(refs: readonly Ref[], input: DocumentProjectionInput): Ref {
  const first = refs[0]!;
  return isEntityRef(first) && refs.some((ref) => isEntityRef(ref) && ref.variant !== first.variant) ? pageRef(first, input) : first;
}

export function refKey(ref: Ref): string {
  return isEntityRef(ref) ? `${ref.kind}\u0000${ref.key}` : `\u0000${ref.label}`;
}

/** References to one page appear once. */
export function mergeRefs(refs: readonly Ref[], input: DocumentProjectionInput): Ref[] {
  const byPage = new Map<string, Ref[]>();
  for (const ref of refs) {
    const same = byPage.get(refKey(ref));
    if (same) same.push(ref);
    else byPage.set(refKey(ref), [ref]);
  }
  return [...byPage.values()].map((same) => pageOrVariant(same, input));
}

/** Rows of one page that match in every other field merge into one row, which references the page or its variant. */
export function mergeCounterpartRows<T extends { counterpart: Ref }>(rows: readonly T[], input: DocumentProjectionInput): T[] {
  const merged = new Map<string, T[]>();
  for (const row of rows) {
    const { counterpart, ...rest } = row;
    const key = JSON.stringify([refKey(counterpart), rest]);
    const same = merged.get(key);
    if (same) same.push(row);
    else merged.set(key, [row]);
  }
  return [...merged.values()].map((same) => ({ ...same[0]!, counterpart: pageOrVariant(same.map((row) => row.counterpart), input) }));
}

export function description(entity: CatalogEntityRow, fallback?: string | null): string | null {
  const value = plainText(entity.description ?? fallback ?? "");
  return value || null;
}

export function baseDocument(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, fallbackDescription?: string | null) {
  return { ref, description: description(entity, fallbackDescription), art: input.artByEntity.get(entity.entityKey) ?? {} };
}

// A page shows the first description and the first artwork among its records.
export function pageBase(page: PublishedPage, input: DocumentProjectionInput) {
  const entities = page.members.map((member) => member.entity);
  const art = entities.map((entity) => input.artByEntity.get(entity.entityKey)).find((value) => value !== undefined && Object.keys(value).length > 0);
  return { ref: page.ref, description: entities.map((entity) => description(entity)).find((value) => value !== null) ?? null, art: art ?? {} };
}

export function refName(ref: Ref): string {
  return isEntityRef(ref) ? ref.name : ref.label;
}

export function skillHighestLevel(facts: CatalogFacts, skillKey: string): number | undefined {
  const fact = facts.progression.facts.find((candidate) => candidate.entityKey === skillKey);
  return fact?.kind === "skills" && fact.details.maxLevel > 0 ? fact.details.maxLevel : undefined;
}
