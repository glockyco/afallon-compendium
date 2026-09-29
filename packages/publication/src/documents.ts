import type {
  CatalogAvailabilityRule,
  CatalogCondition,
  CatalogDropRow,
  CatalogGatedSourceRow,
  CatalogEndpoint,
  CatalogEntityRow,
  CatalogFacts,
  CatalogNpcFacts,
  CatalogPlacementRow,
  CatalogQuestRow,
  CatalogRelations,
  CatalogRequirement,
  CatalogRequirementGroup,
  CatalogTaskFacts,
} from "@afallon/contracts/catalog";
import type {
  Art,
  AvailabilityRule,
  ConnectionRow,
  CreatureRow,
  EntityRef,
  GearSet,
  NpcFacts,
  NpcLocation,
  NpcVariantFacts,
  NpcVariantField,
  PlacementGroup,
  PlacementRef,
  LearnerRow,
  PublicAbility,
  PublicClass,
  PublicSkill,
  TalentPoints,
  TalentRank,
  TalentTree,
  PublicDocument,
  PublicItem,
  PublicLevel,
  PublicMarkerCategory,
  PublicNpc,
  PublicPlace,
  PublicProperty,
  PublicQuest,
  PublicRecipe,
  QuestLinkRow,
  QuestObjective,
  QuestStart,
  QuestTurnIn,
  QuestWorldChange,
  Ref,
  RequirementGroup,
  RequirementRef,
} from "@afallon/contracts/public";
import { collectRefs, isEntityRef } from "@afallon/contracts/public";
import { markerCategories, shownCategories } from "./categories";
import { chancePercent, choicesChance, enabledChance, levelUnion } from "./levels";
import { shownNpcStats } from "./variants";
import type { EntityReferences, PublishedPage } from "./references";
import { displayName, plainText, withoutMarkup } from "./text";

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
  /** The weapon types that each class can use, as the game names them. */
  classWeapons?: ReadonlyMap<string, readonly string[]>;
}

type RelationIndexes = {
  entities: Map<string, CatalogEntityRow>;
  npcFacts: Map<string, CatalogNpcFacts>;
  dropsByOwner: Map<string, CatalogRelations["drops"]>;
  dropsByItem: Map<string, CatalogRelations["drops"]>;
  vendorsByNpc: Map<string, CatalogRelations["vendors"]>;
  vendorsByItem: Map<string, CatalogRelations["vendors"]>;
  gathersByResource: Map<string, CatalogRelations["gathers"]>;
  gathersByItem: Map<string, CatalogRelations["gathers"]>;
  containersByItem: Map<string, CatalogRelations["containers"]>;
  interactionsByItem: Map<string, CatalogRelations["interactions"]>;
  questsByQuest: Map<string, CatalogRelations["quests"]>;
  questsByCounterpart: Map<string, CatalogRelations["quests"]>;
  gatedSourcesBySubject: Map<string, CatalogGatedSourceRow[]>;
  recipesByRecipe: Map<string, CatalogRelations["recipes"]>;
  recipesByItem: Map<string, CatalogRelations["recipes"]>;
  placementsByNpc: Map<string, CatalogPlacementRow[]>;
  placementsByScene: Map<string, CatalogPlacementRow[]>;
  chainOrder: Map<string, number>;
};

function pushIndex<T>(index: Map<string, T[]>, key: string | null, value: T): void {
  if (key === null) return;
  const rows = index.get(key);
  if (rows) rows.push(value);
  else index.set(key, [value]);
}

function relationIndexes(entities: readonly CatalogEntityRow[], facts: CatalogFacts, relations: CatalogRelations): RelationIndexes {
  const result: RelationIndexes = {
    entities: new Map(entities.map((entity) => [entity.entityKey, entity])), npcFacts: new Map(facts.npcs.map((fact) => [fact.entityKey, fact])),
    dropsByOwner: new Map(), dropsByItem: new Map(), vendorsByNpc: new Map(), vendorsByItem: new Map(),
    gathersByResource: new Map(), gathersByItem: new Map(), containersByItem: new Map(), interactionsByItem: new Map(), questsByQuest: new Map(),
    questsByCounterpart: new Map(), gatedSourcesBySubject: new Map(), recipesByRecipe: new Map(), recipesByItem: new Map(), placementsByNpc: new Map(), placementsByScene: new Map(),
    chainOrder: new Map(facts.quests.flatMap((quest) => quest.chainOrder === null ? [] : [[quest.entityKey, quest.chainOrder] as const])),
  };
  for (const row of relations.drops) {
    pushIndex(result.dropsByOwner, row.owner.entityKey, row);
    pushIndex(result.dropsByItem, row.item.entityKey, row);
  }
  for (const row of relations.vendors) {
    pushIndex(result.vendorsByNpc, row.npc.entityKey, row);
    pushIndex(result.vendorsByItem, row.item.entityKey, row);
  }
  for (const row of relations.gathers) {
    pushIndex(result.gathersByResource, row.resource?.entityKey ?? null, row);
    pushIndex(result.gathersByItem, row.item.entityKey, row);
  }
  for (const row of relations.containers) pushIndex(result.containersByItem, row.item.entityKey, row);
  for (const row of relations.interactions) pushIndex(result.interactionsByItem, row.item.entityKey, row);
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

function conditionsById(conditions: readonly CatalogCondition[]): ReadonlyMap<string, CatalogCondition> {
  return new Map(conditions.map((condition) => [condition.conditionId, condition]));
}

function endpointOrUnknown(resolve: ReferenceResolver, endpoint: CatalogEndpoint | null, label: string): Ref {
  return endpoint === null ? { key: null, label } : resolve(endpoint);
}

function optionalFactRef(resolve: ReferenceResolver, endpoint: CatalogEndpoint | null | undefined): Ref | undefined {
  return endpoint === null || endpoint === undefined || endpoint.entityKey === null ? undefined : resolve(endpoint);
}

function projectRequirement(requirement: CatalogRequirement, resolve: ReferenceResolver): RequirementRef {
  return {
    type: { value: requirement.type.value, name: plainText(requirement.type.name) }, rule: { value: requirement.rule.value, name: plainText(requirement.rule.name) }, label: plainText(requirement.label),
    spans: requirement.spans.map((span) => "text" in span ? { text: withoutMarkup(span.text) } : { ref: resolve(span.endpoint) }),
  };
}

function projectRequirementGroups(groups: readonly CatalogRequirementGroup[], resolve: ReferenceResolver): RequirementGroup[] {
  return groups.map((group) => ({ mode: group.mode, checkCount: group.checkCount, ...(group.requiredCount === null ? {} : { requiredCount: Math.max(0, group.requiredCount) }), requirements: group.requirements.map((requirement) => projectRequirement(requirement, resolve)) }));
}

function requirementsFor(conditionIds: readonly string[], conditions: ReadonlyMap<string, CatalogCondition>, resolve: ReferenceResolver): RequirementGroup[] {
  return conditionIds.flatMap((conditionId): RequirementGroup[] => {
    const condition = conditions.get(conditionId);
    if (!condition) throw new Error(`Missing catalog condition ${conditionId}.`);
    return projectRequirementGroups(condition.requirements, resolve);
  });
}

function projectAvailability(rules: readonly CatalogAvailabilityRule[], conditions: ReadonlyMap<string, CatalogCondition>, resolve: ReferenceResolver): AvailabilityRule[] {
  return rules.flatMap((rule) => {
    const requirements = requirementsFor([rule.conditionId], conditions, resolve);
    if (requirements.length === 0) return [];
    return [{ effect: rule.effect, requirements, ...(rule.effect === "temporary" && rule.durationSeconds !== null ? { durationSeconds: rule.durationSeconds } : {}) }];
  });
}

function groupPlacedRows<T extends { placements: PlacementRef[] }>(rows: readonly T[]): T[] {
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

function publishedPlacements(ids: readonly string[], placements: ReadonlyMap<string, PlacementRef>): PlacementRef[] {
  const result: PlacementRef[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const placement = placements.get(id);
    if (placement && !seen.has(id)) {
      result.push({ placementId: placement.placementId, mapSpaceId: placement.mapSpaceId, label: placement.label });
      seen.add(id);
    }
  }
  return result;
}

function groupPlacementCounts<T extends object>(rows: readonly (T & { placements: PlacementRef[] })[]): Array<T & { placementCount: number }> {
  const grouped = new Map<string, { facts: T; placementIds: Set<string> }>();
  for (const row of rows) {
    const { placements, ...facts } = row;
    const key = JSON.stringify(facts);
    const current = grouped.get(key);
    if (!current) grouped.set(key, { facts: facts as T, placementIds: new Set(placements.map((placement) => placement.placementId)) });
    else for (const placement of placements) current.placementIds.add(placement.placementId);
  }
  return [...grouped.values()].map(({ facts, placementIds }) => ({ ...facts, placementCount: placementIds.size }));
}

function recordLocations(key: string, indexes: RelationIndexes, placements: ReadonlyMap<string, PlacementRef>): PlacementRef[] {
  return publishedPlacements((indexes.placementsByNpc.get(key) ?? []).map((placement) => placement.placementId), placements);
}

function optionalCount(value: number | null): number | undefined {
  return value !== null && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function optionalChance(value: number | null): number | undefined {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;
}

// A table roll of 100 or more always happens, so a row omits it.
function tableChanceOf(row: CatalogDropRow): number | undefined {
  return row.tableRate !== null && row.tableRate < 100 ? optionalChance(Math.round(row.tableRate * 10) / 10) : undefined;
}

/**
 * A creature page groups its drops by their loot list rule: the share of kills that roll the list and the number of
 * items that the list gives. Two lists of one creature with the same rule and a limit or a minimum would merge into one
 * group whose item count is wrong, so publication stops instead.
 */
function assertDistinctLootRules(owner: string, rows: readonly CatalogDropRow[]): void {
  const tableByRule = new Map<string, number>();
  for (const row of rows) {
    if (row.tableMinimum === null && row.tableLimit === null) continue;
    const rule = JSON.stringify([tableChanceOf(row) ?? null, row.tableMinimum, row.tableLimit]);
    const table = tableByRule.get(rule);
    if (table === undefined) tableByRule.set(rule, row.lootTableId);
    else if (table !== row.lootTableId) throw new Error(`${owner} has the loot lists ${table} and ${row.lootTableId} with the same drop rule ${rule}, so its Drops section would merge them.`);
  }
}

// The fields that a drop row shares on the creature page and on the item page.
function lootFields(row: CatalogDropRow, conditions: ReadonlyMap<string, CatalogCondition>, input: DocumentProjectionInput) {
  const tableChance = tableChanceOf(row);
  return {
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }),
    ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }),
    ...(optionalChance(row.displayedChance) === undefined ? {} : { chance: optionalChance(row.displayedChance) }),
    ...(tableChance === undefined ? {} : { tableChance }),
    ...(row.tableMinimum === null ? {} : { tableMinimum: row.tableMinimum }),
    ...(row.tableLimit === null ? {} : { tableLimit: row.tableLimit }),
    ...(row.creatureLevel === null ? {} : { creatureLevel: row.creatureLevel.max === null ? { min: row.creatureLevel.min } : { min: row.creatureLevel.min, max: row.creatureLevel.max } }),
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  };
}

/** The page reference for a record reference: no variant, and the page's own name. */
function pageRef(ref: EntityRef, input: DocumentProjectionInput): EntityRef {
  return input.references.pages.get(ref.key)?.ref ?? ref;
}

/** One reference for references to one page: their variant when they all name the same one, else the page. */
function pageOrVariant(refs: readonly Ref[], input: DocumentProjectionInput): Ref {
  const first = refs[0]!;
  return isEntityRef(first) && refs.some((ref) => isEntityRef(ref) && ref.variant !== first.variant) ? pageRef(first, input) : first;
}

function refKey(ref: Ref): string {
  return isEntityRef(ref) ? `${ref.kind}\u0000${ref.key}` : `\u0000${ref.label}`;
}

/** References to one page appear once. */
function mergeRefs(refs: readonly Ref[], input: DocumentProjectionInput): Ref[] {
  const byPage = new Map<string, Ref[]>();
  for (const ref of refs) {
    const same = byPage.get(refKey(ref));
    if (same) same.push(ref);
    else byPage.set(refKey(ref), [ref]);
  }
  return [...byPage.values()].map((same) => pageOrVariant(same, input));
}

/** Rows of one page that match in every other field merge into one row, which references the page or its variant. */
function mergeCounterpartRows<T extends { counterpart: Ref }>(rows: readonly T[], input: DocumentProjectionInput): T[] {
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

const TASK_TYPE: Readonly<Record<string, QuestObjective["type"]>> = {
  killNPC: "killNpc", getItem: "getItem", talkToNPC: "talkToNpc", useItem: "useItem",
  enterScene: "enterScene", enterRegion: "enterRegion", learnAbility: "learnAbility",
};

/** `text` is the objective's display text; an empty text falls back to the native task type. */
export function projectQuestObjective(task: CatalogTaskFacts, resolve: ReferenceResolver, index: number, text: string, completions: QuestObjective["completions"]): QuestObjective {
  const type = TASK_TYPE[task.taskType];
  const base = { index, text: plainText(text) || plainText(task.taskType) || "Objective", completions };
  if (!type || type === "unsupported") return { ...base, type: "unsupported", rawType: plainText(task.taskType) || "unknown" };
  const target = endpointOrUnknown(resolve, task.target, displayName(task.sceneName ?? "") || "Unknown target");
  const count = Math.max(1, optionalCount(task.count) ?? 1);
  switch (type) {
    case "killNpc": return { ...base, type, target, count };
    case "getItem": return { ...base, type, target, count, keepItems: task.keepItems === true };
    case "talkToNpc": return { ...base, type, target };
    case "useItem": return { ...base, type, target, count };
    case "enterScene": return { ...base, type, target };
    case "enterRegion": return { ...base, type };
    case "learnAbility": return { ...base, type, target };
    default: return { ...base, type: "unsupported", rawType: plainText(task.taskType) || "unknown" };
  }
}

function objectiveForRow(row: CatalogQuestRow, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): QuestObjective {
  const task = row.task!;
  const entity = indexes.entities.get(task.entityKey);
  const text = plainText(entity?.description ?? "") || plainText(entity?.name ?? "");
  const completions = groupPlacedRows(row.completions.map((completion) => ({
    ...(displayName(completion.label ?? "") ? { label: displayName(completion.label!) } : {}),
    availability: projectAvailability(completion.availability, conditions, input.resolve),
    placements: publishedPlacements(completion.placementIds, input.placements),
  })));
  return projectQuestObjective(task, input.resolve, row.index, text, completions);
}

function description(entity: CatalogEntityRow, fallback?: string | null): string | null {
  const value = plainText(entity.description ?? fallback ?? "");
  return value || null;
}

function baseDocument(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, fallbackDescription?: string | null) {
  return { ref, description: description(entity, fallbackDescription), art: input.artByEntity.get(entity.entityKey) ?? {} };
}

// A page shows the first description and the first artwork among its records.
function pageBase(page: PublishedPage, input: DocumentProjectionInput) {
  const entities = page.members.map((member) => member.entity);
  const art = entities.map((entity) => input.artByEntity.get(entity.entityKey)).find((value) => value !== undefined && Object.keys(value).length > 0);
  return { ref: page.ref, description: entities.map((entity) => description(entity)).find((value) => value !== null) ?? null, art: art ?? {} };
}

/**
 * The classes with a page that start with each item, in class native id order. A class that no race offers has no page,
 * so no player can start with its gear.
 */
export function startingGearByItem(entities: readonly CatalogEntityRow[], facts: CatalogFacts, refs: ReadonlyMap<string, EntityRef>): ReadonlyMap<string, readonly EntityRef[]> {
  const nativeIds = new Map(entities.map((entity) => [entity.entityKey, entity.nativeId]));
  const classes = facts.progression.facts.flatMap((fact) => fact.kind === "classes" ? [fact] : [])
    .sort((left, right) => (nativeIds.get(left.entityKey) ?? 0) - (nativeIds.get(right.entityKey) ?? 0));
  const result = new Map<string, EntityRef[]>();
  for (const fact of classes) {
    const classRef = refs.get(fact.entityKey);
    if (classRef?.kind !== "classes" || classRef.slug === undefined) continue;
    for (const itemKey of new Set(fact.details.startItems.map((row) => row.item.entityKey))) pushIndex(result, itemKey, classRef);
  }
  return result;
}

function projectItem(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>, startingGear: ReadonlyMap<string, readonly EntityRef[]>): PublicItem {
  const fact = input.facts.items.find((candidate) => candidate.entityKey === entity.entityKey);
  const enchantment = optionalFactRef(input.resolve, fact?.enchantment);
  const sellCurrency = optionalFactRef(input.resolve, fact?.sellCurrency), buyCurrency = optionalFactRef(input.resolve, fact?.buyCurrency);
  const gearSet = fact?.gearSet?.entityKey ? projectGearSet(fact.gearSet.entityKey, input) : undefined;
  const droppedBy = mergeCounterpartRows((indexes.dropsByItem.get(entity.entityKey) ?? []).map((row) => ({
    counterpart: input.resolve(row.owner), ...lootFields(row, conditions, input),
  })), input);
  const soldBy = mergeCounterpartRows((indexes.vendorsByItem.get(entity.entityKey) ?? []).map((row) => ({
    counterpart: input.resolve(row.npc), price: { amount: Math.max(0, row.cost), currency: endpointOrUnknown(input.resolve, row.currency, "Unknown currency") },
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  })), input);
  const gatheredFrom = groupPlacementCounts((indexes.gathersByItem.get(entity.entityKey) ?? []).map((row) => ({
    ...(row.resource === null ? {} : { counterpart: input.resolve(row.resource) }), label: displayName(row.producerLabel) || "Resource",
    ...(row.skill === null ? {} : { skill: input.resolve(row.skill) }), ...(optionalCount(row.rank) === undefined ? {} : { rank: optionalCount(row.rank) }),
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }), ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }),
    ...(optionalChance(row.rawRate) === undefined ? {} : { chance: optionalChance(row.rawRate) }), placements: publishedPlacements(row.placementIds, input.placements),
  })));
  const inContainers = groupPlacementCounts((indexes.containersByItem.get(entity.entityKey) ?? []).map((row) => ({
    ...(row.place === null ? {} : { counterpart: input.resolve(row.place) }), label: displayName(row.containerType ?? "") || "Container",
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }),
    ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }), ...(optionalChance(row.rawRate) === undefined ? {} : { chance: optionalChance(row.rawRate) }),
    availability: projectAvailability(row.availability, conditions, input.resolve),
    placements: publishedPlacements(row.placementIds, input.placements),
  })));
  const collectedFrom = groupPlacementCounts((indexes.interactionsByItem.get(entity.entityKey) ?? []).map((row) => ({
    ...(row.place === null ? {} : { counterpart: input.resolve(row.place) }), label: displayName(row.objectName ?? "") || "Object",
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }),
    ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }), ...(optionalChance(row.rawRate) === undefined ? {} : { chance: optionalChance(row.rawRate) }),
    availability: projectAvailability(row.availability, conditions, input.resolve),
    placements: publishedPlacements(row.placementIds, input.placements),
  })));
  const questRows = indexes.questsByCounterpart.get(entity.entityKey) ?? [];
  const recipeRows = indexes.recipesByItem.get(entity.entityKey) ?? [];
  // Native item records carry authored defaults for both equipment branches; only the active branch is public evidence.
  const isArmor = fact?.itemType === "ARMOR", isWeapon = fact?.itemType === "WEAPON";
  const itemPower = fact?.stats.find((row) => row.stat.entityKey === "stats:53")?.amount;
  const damagePerSecond = isWeapon && fact?.minDamage !== null && fact?.minDamage !== undefined
    && fact.maxDamage !== null && fact.maxDamage !== undefined && fact.attackSpeed !== null && fact.attackSpeed !== undefined && fact.attackSpeed > 0
    ? ((fact.minDamage + fact.maxDamage) / 2) / fact.attackSpeed : undefined;
  const level = fact?.equipmentRequirements.flatMap((group) => group.requirements).find((requirement) => requirement.type.name === "Level")?.amounts.primary;
  const levelRequirement = level !== undefined && Number.isInteger(level) && level > 0 ? level : undefined;
  return {
    ...baseDocument(entity, ref, input),
    facts: {
      ...(fact?.rarity ? { rarity: plainText(fact.rarity) } : {}), ...(fact?.itemType ? { itemType: plainText(fact.itemType) } : {}),
      ...(isArmor && fact?.armorSlot ? { slot: plainText(fact.armorSlot) } : {}), ...(isArmor && fact?.armorType ? { armorType: plainText(fact.armorType) } : {}),
      ...(isWeapon && fact?.weaponType ? { weaponType: plainText(fact.weaponType) } : {}), ...(isWeapon && fact?.weaponSlot ? { weaponSlot: plainText(fact.weaponSlot) } : {}),
      ...(isWeapon && fact?.attackSpeed !== null && fact?.attackSpeed !== undefined ? { attackSpeed: fact.attackSpeed } : {}),
      ...(isWeapon && optionalCount(fact?.minDamage ?? null) !== undefined ? { minDamage: optionalCount(fact?.minDamage ?? null) } : {}),
      ...(isWeapon && optionalCount(fact?.maxDamage ?? null) !== undefined ? { maxDamage: optionalCount(fact?.maxDamage ?? null) } : {}),
      ...(itemPower === undefined ? {} : { itemPower }), ...(damagePerSecond === undefined ? {} : { damagePerSecond }),
      stats: (fact?.stats ?? []).filter((row) => row.stat.entityKey !== "stats:53")
        .map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })),
      randomStats: (fact?.randomStats ?? []).map((row) => ({ stat: input.resolve(row.stat), min: row.min, max: row.max, isPercent: row.isPercent, whole: row.whole,
        ...(optionalChance(row.chance) === undefined ? {} : { chance: optionalChance(row.chance) }) })),
      randomStatsMax: Math.max(0, fact?.randomStatsMax ?? 0),
      sockets: (fact?.sockets ?? []).map((row) => ({ ...(row.socketType && plainText(row.socketType) ? { socketType: plainText(row.socketType) } : {}),
        ...(row.gemType && plainText(row.gemType) ? { gemType: plainText(row.gemType) } : {}) })),
      ...(fact?.gem ? { gem: { ...(fact.gem.gemType && plainText(fact.gem.gemType) ? { gemType: plainText(fact.gem.gemType) } : {}),
        stats: fact.gem.stats.map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })) } } : {}),
      ...(enchantment === undefined ? {} : { enchantment }),
      ...(fact?.sellPrice !== null && fact?.sellPrice !== undefined && fact.sellPrice >= 0 && sellCurrency ? { sellPrice: { amount: fact.sellPrice, currency: sellCurrency } } : {}),
      ...(fact?.buyPrice !== null && fact?.buyPrice !== undefined && fact.buyPrice >= 0 && buyCurrency ? { buyPrice: { amount: fact.buyPrice, currency: buyCurrency } } : {}),
      stackLimit: Math.max(0, fact?.stackLimit ?? 0), questDropOnly: fact?.questDropOnly ?? false, corruptionToken: fact?.corruptionToken ?? false,
      actionAbilities: (fact?.actionAbilities ?? []).map((ability) => ({ ability: input.resolve(ability.ability), rankIndex: Math.max(0, ability.rankIndex) })),
      useLines: fact?.useLines ?? [], equipmentRequirements: projectRequirementGroups(fact?.equipmentRequirements ?? [], input.resolve),
      ...(levelRequirement === undefined ? {} : { levelRequirement }), useConditions: projectRequirementGroups(fact?.useConditions ?? [], input.resolve),
      ...(gearSet === undefined ? {} : { gearSet }),
    },
    droppedBy, soldBy, gatheredFrom, inContainers, collectedFrom,
    rewardedBy: questRows.filter((row) => row.kind === "reward" || row.kind === "rewardChoice").map((row) => ({ counterpart: input.resolve(row.quest), count: Math.max(0, row.count ?? 1), choice: row.kind === "rewardChoice" })),
    givenBy: questRows.filter((row) => row.kind === "itemGiven").map((row) => ({ counterpart: input.resolve(row.quest), count: Math.max(0, row.count ?? 1) })),
    craftedBy: recipeRows.filter((row) => row.role === "product").map((row) => ({ counterpart: input.resolve(row.recipe), count: Math.max(0, row.count) })),
    usedInRecipes: recipeRows.filter((row) => row.role === "material").map((row) => ({ counterpart: input.resolve(row.recipe), count: Math.max(0, row.count) })),
    usedInQuests: questRows.filter((row) => row.kind === "objective" && row.task !== null).map((row) => ({ counterpart: input.resolve(row.quest), objective: objectiveForRow(row, input, indexes, conditions) })),
    startingGearOf: (startingGear.get(entity.entityKey) ?? []).map((classRef) => ({ class: classRef })),
  };
}

const EMPTY_NPC_FACTS: Omit<CatalogNpcFacts, "entityKey"> = { minLevel: null, maxLevel: null, scalesWithPlayer: false, npcType: null, creatureType: null, family: null, faction: null, species: null, isMerchant: false, isQuestGiver: false, isCombatEnabled: false, isAuctioneer: false, isBanker: false, isFlightMaster: false, hunterTamable: false, hunterBeastRole: null, equipmentAppearanceSelections: null, adventurer: null, flightNetwork: null, minRespawn: null, maxRespawn: null, minExperience: null, maxExperience: null, immuneToStun: false, immuneToSlow: false, aggroRange: null, stats: [], abilityPhases: [], factionRewards: [], linkedNpc: null, lootSpecialization: null };

function npcFact(key: string, indexes: RelationIndexes): CatalogNpcFacts {
  return indexes.npcFacts.get(key) ?? { entityKey: key, ...EMPTY_NPC_FACTS };
}

// Every record fact that the page can show, for one record.
function npcRecordFacts(fact: CatalogNpcFacts, input: DocumentProjectionInput): Required<Pick<NpcVariantFacts, "stats" | "immunities" | "abilityPhases" | "factionRewards">> & NpcVariantFacts {
  const faction = optionalFactRef(input.resolve, fact.faction), species = optionalFactRef(input.resolve, fact.species);
  const linkedNpc = optionalFactRef(input.resolve, fact.linkedNpc), lootStat = optionalFactRef(input.resolve, fact.lootSpecialization?.stat);
  const minExperience = optionalCount(fact.minExperience), maxExperience = optionalCount(fact.maxExperience);
  return {
    ...(fact.npcType ? { npcType: plainText(fact.npcType) } : {}), ...(fact.creatureType ? { creatureType: plainText(fact.creatureType) } : {}),
    ...(fact.family ? { family: plainText(fact.family) } : {}), ...(faction === undefined ? {} : { faction }), ...(species === undefined ? {} : { species }),
    ...(fact.minRespawn === null || fact.maxRespawn === null ? {} : { respawn: { min: fact.minRespawn, max: fact.maxRespawn } }),
    ...(minExperience === undefined || maxExperience === undefined ? {} : { experience: { min: minExperience, max: maxExperience } }),
    stats: shownNpcStats(fact.stats).map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })),
    immunities: [fact.immuneToStun ? "stun" : null, fact.immuneToSlow ? "slow" : null].filter((value): value is string => value !== null),
    ...(fact.aggroRange === null ? {} : { aggroRange: fact.aggroRange }),
    ...(fact.lootSpecialization === null ? {} : { lootSpecialization: {
      ...(fact.lootSpecialization.armorType ? { armorType: plainText(fact.lootSpecialization.armorType) } : {}),
      weaponTypes: fact.lootSpecialization.weaponTypes.map(plainText),
      ...(lootStat === undefined ? {} : { stat: lootStat }),
    } }),
    abilityPhases: fact.abilityPhases.map((phase) => ({ phaseIndex: Math.max(0, phase.phaseIndex), ...(phase.name ? { name: plainText(phase.name) } : {}), ...(phase.requirement ? { requirement: plainText(phase.requirement) } : {}), abilities: phase.abilities.map((ability) => ({ ability: input.resolve(ability.ability), rankIndex: Math.max(0, ability.rankIndex) })) })),
    factionRewards: fact.factionRewards.map((reward) => ({ counterpart: input.resolve(reward.faction), amount: reward.amount })),
    ...(linkedNpc === undefined ? {} : { linkedNpc }),
  };
}

function pick(facts: NpcVariantFacts, fields: readonly NpcVariantField[]): NpcVariantFacts {
  return Object.fromEntries(fields.flatMap((field) => facts[field] === undefined ? [] : [[field, facts[field]]])) as NpcVariantFacts;
}

function questLinks(key: string, input: DocumentProjectionInput, indexes: RelationIndexes): QuestLinkRow[] {
  const rows = (indexes.questsByCounterpart.get(key) ?? []).filter((row) => row.kind === "giver" || row.kind === "turnIn")
    .map((row) => ({ counterpart: input.resolve(row.quest), role: row.kind === "giver" ? "gives" as const : "completes" as const }));
  return [...new Map(rows.map((row) => [JSON.stringify(row), row])).values()];
}

type NpcSpot = {
  anchor: string; placement: CatalogPlacementRow; published: PlacementRef; level: PublicLevel | undefined;
  roles: PublicMarkerCategory[]; availability: AvailabilityRule[]; quests: QuestLinkRow[];
};

// Where the creature appears. Spots that share a place, availability, level, roles, quests, and random choice form
// one entry. When the game enables one entry of a choice, the page's spots that different entries enable are options
// of that choice, and one location entry can hold several of them.
function npcLocations(page: PublishedPage, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): NpcLocation[] {
  const spots: NpcSpot[] = [];
  for (const member of page.members) {
    const key = member.entity.entityKey, fact = npcFact(key, indexes);
    const gates = new Map<string, CatalogAvailabilityRule[]>();
    for (const row of indexes.gatedSourcesBySubject.get(key) ?? []) if (row.family === "npcProducer") for (const placementId of row.placementIds) gates.set(placementId, [...gates.get(placementId) ?? [], ...row.availability]);
    const quests = questLinks(key, input, indexes);
    for (const placement of indexes.placementsByNpc.get(key) ?? []) {
      const published = input.placements.get(placement.placementId);
      if (!published) continue;
      const rules = [...new Map((gates.get(placement.placementId) ?? []).map((rule) => [JSON.stringify(rule), rule])).values()];
      spots.push({
        anchor: member.anchor, placement, published: { placementId: published.placementId, mapSpaceId: published.mapSpaceId, label: published.label },
        level: input.npcLevels.get(placement.placementId)?.get(key),
        roles: markerCategories(placement.roles.filter((role) => role.npcEntityKey === key), [fact]),
        availability: projectAvailability(rules, conditions, input.resolve), quests,
      });
    }
  }
  const optionSets = (spot: NpcSpot) => spot.placement.randomChoices.at(-1)!.entryIndexes.join(",");
  const optionsByChoice = new Map<string, Set<string>>();
  for (const spot of spots) {
    const inner = spot.placement.randomChoices.at(-1);
    if (inner?.enabled === 1) optionsByChoice.set(inner.choiceId, (optionsByChoice.get(inner.choiceId) ?? new Set<string>()).add(optionSets(spot)));
  }
  const entries = new Map<string, { spots: NpcSpot[]; exclusive: boolean }>();
  for (const spot of spots) {
    const choices = spot.placement.randomChoices, inner = choices.at(-1);
    const exclusive = inner !== undefined && (optionsByChoice.get(inner.choiceId)?.size ?? 0) > 1;
    const alternative = inner === undefined ? null : exclusive ? ["options", choices.map((choice) => choice.choiceId)] : ["chance", chancePercent(choicesChance(choices))];
    const key = JSON.stringify([spot.published.label, spot.availability, spot.level ?? null, spot.roles, spot.quests, alternative]);
    const entry = entries.get(key);
    if (entry) entry.spots.push(spot);
    else entries.set(key, { spots: [spot], exclusive });
  }
  const locations = [...entries.values()].map(({ spots: entrySpots, exclusive }): NpcLocation => {
    const first = entrySpots[0]!, choices = first.placement.randomChoices, inner = choices.at(-1);
    let alternative: NpcLocation["alternative"];
    if (inner && exclusive) {
      const indexes = new Set(entrySpots.flatMap((spot) => spot.placement.randomChoices.at(-1)!.entryIndexes));
      alternative = { chance: chancePercent(enabledChance(inner, indexes.size) * choicesChance(choices.slice(0, -1))), options: new Set(entrySpots.map(optionSets)).size };
    } else if (inner) alternative = { chance: chancePercent(choicesChance(choices)), options: 1 };
    return {
      label: first.published.label, placements: [...new Map(entrySpots.map((spot) => [spot.published.placementId, spot.published])).values()],
      availability: first.availability, ...(first.level ? { level: first.level } : {}), ...(alternative ? { alternative } : {}),
      variants: [...new Set(entrySpots.map((spot) => spot.anchor))], roles: first.roles, quests: first.quests,
    };
  });
  // Story order: an entry whose gate quests or own quests come earlier in their chains comes first.
  const questOrder = (location: NpcLocation) => Math.min(Infinity, ...[...collectRefs(location.availability), ...location.quests.map((row) => row.counterpart)]
    .map((ref) => ref.key !== null && ref.kind === "quests" ? indexes.chainOrder.get(ref.key) ?? Infinity : Infinity));
  return locations.sort((left, right) => questOrder(left) - questOrder(right) || left.label.localeCompare(right.label) || left.placements[0]!.placementId.localeCompare(right.placements[0]!.placementId));
}

/** Rows that every variant with rows shares appear once. Other rows name the variants that have them. */
function attributedRows<T>(rowsByVariant: ReadonlyArray<{ anchor: string; rows: readonly T[] }>): Array<T & { variants?: string[] }> {
  const holders = rowsByVariant.filter((variant) => variant.rows.length > 0).length;
  const merged = new Map<string, { row: T; anchors: string[] }>();
  for (const { anchor, rows } of rowsByVariant) for (const row of rows) {
    const key = JSON.stringify(row), entry = merged.get(key);
    if (entry) { if (!entry.anchors.includes(anchor)) entry.anchors.push(anchor); }
    else merged.set(key, { row, anchors: [anchor] });
  }
  return [...merged.values()].map(({ row, anchors }) => anchors.length === holders ? row as T & { variants?: string[] } : { ...row, variants: anchors });
}

function projectNpcPage(page: PublishedPage, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): PublicNpc {
  const variantFields = [...page.variantFields];
  const records = page.members.map((member) => ({ member, fact: npcFact(member.entity.entityKey, indexes) }));
  const recordFacts = records.map(({ fact }) => npcRecordFacts(fact, input));
  const shared = recordFacts[0]!;
  const locations = npcLocations(page, input, indexes, conditions);
  const services = new Set<PublicMarkerCategory>();
  for (const { fact } of records) {
    if (fact.isMerchant) services.add("merchant");
    if (fact.isQuestGiver) services.add("questGiver");
    if (fact.isAuctioneer) services.add("auctioneer");
    if (fact.isBanker) services.add("banker");
    if (fact.isFlightMaster) services.add("flightPoint");
  }
  const roles = shownCategories(new Set([...services, ...locations.flatMap((location) => location.roles)]));
  const level = levelUnion(locations.flatMap((location) => location.level ? [location.level] : []));
  const has = (field: NpcVariantField) => !variantFields.includes(field);
  const facts: NpcFacts = {
    ...(level ? { level } : {}),
    ...(has("npcType") && shared.npcType ? { npcType: shared.npcType } : {}), ...(has("creatureType") && shared.creatureType ? { creatureType: shared.creatureType } : {}),
    ...(has("family") && shared.family ? { family: shared.family } : {}), ...(has("faction") && shared.faction ? { faction: shared.faction } : {}),
    ...(has("species") && shared.species ? { species: shared.species } : {}), roles,
    ...(has("respawn") && shared.respawn ? { respawn: shared.respawn } : {}), ...(has("experience") && shared.experience ? { experience: shared.experience } : {}),
    stats: has("stats") ? shared.stats : [], immunities: has("immunities") ? shared.immunities : [],
    ...(has("aggroRange") && shared.aggroRange !== undefined ? { aggroRange: shared.aggroRange } : {}),
    ...(has("lootSpecialization") && shared.lootSpecialization ? { lootSpecialization: shared.lootSpecialization } : {}),
  };
  const drops = attributedRows(records.map(({ member }) => {
    const rows = indexes.dropsByOwner.get(member.entity.entityKey) ?? [];
    assertDistinctLootRules(member.entity.entityKey, rows);
    return { anchor: member.anchor, rows: rows.map((row) => ({ counterpart: input.resolve(row.item), ...lootFields(row, conditions, input) })) };
  }));
  const sells = attributedRows(records.map(({ member }) => ({ anchor: member.anchor, rows: (indexes.vendorsByNpc.get(member.entity.entityKey) ?? []).map((row) => ({
    counterpart: input.resolve(row.item), price: { amount: Math.max(0, row.cost), currency: endpointOrUnknown(input.resolve, row.currency, "Unknown currency") },
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  })) })));
  const quests = [...new Map(records.flatMap(({ member }) => questLinks(member.entity.entityKey, input, indexes)).map((row) => [JSON.stringify(row), row])).values()];
  const usedInQuests = [...new Map(records.flatMap(({ member }) => (indexes.questsByCounterpart.get(member.entity.entityKey) ?? []).filter((row) => row.kind === "objective" && row.task !== null)
    .map((row) => ({ counterpart: input.resolve(row.quest), objective: objectiveForRow(row, input, indexes, conditions) }))).map((row) => [JSON.stringify(row), row])).values()];
  const memberKeys = new Set(page.members.map((member) => member.entity.entityKey));
  const bossOf = mergeRefs(input.facts.places.filter((place) => place.bosses.some((boss) => boss.entityKey !== null && memberKeys.has(boss.entityKey))).map((place) => input.resolve({ entityKey: place.entityKey, label: place.entityKey })), input);
  const base = pageBase(page, input);
  return {
    ...base, facts, variantFields,
    variants: records.map(({ member }, index) => {
      const portrait = input.artByEntity.get(member.entity.entityKey)?.portrait;
      const level = levelUnion(locations.flatMap((location) => location.level && location.variants.includes(member.anchor) ? [location.level] : []));
      return {
        key: member.entity.entityKey, anchor: member.anchor, label: member.label, ...(level ? { level } : {}),
        ...(portrait && portrait.sha256 !== base.art.portrait?.sha256 ? { portrait } : {}), facts: pick(recordFacts[index]!, variantFields),
      };
    }),
    locations, drops, sells, quests,
    abilityPhases: has("abilityPhases") ? shared.abilityPhases : [], factionRewards: has("factionRewards") ? shared.factionRewards : [],
    usedInQuests, bossOf, ...(has("linkedNpc") && shared.linkedNpc ? { linkedNpc: shared.linkedNpc } : {}),
  };
}

function conditionNamesQuest(conditionId: string, questKey: string, conditions: ReadonlyMap<string, CatalogCondition>): boolean {
  const condition = conditions.get(conditionId);
  if (!condition) throw new Error(`Missing catalog condition ${conditionId}.`);
  return condition.requirements.some((group) => group.requirements.some((requirement) => requirement.references.quest?.entityKey === questKey));
}

const WORLD_SOURCE_KIND: Readonly<Record<CatalogGatedSourceRow["family"], QuestWorldChange["sourceKind"]>> = {
  npcProducer: "creature", interaction: "object", container: "container", resource: "resource",
  craftingStation: "craftingStation", worldQuestZone: "worldZone",
};

// A character that gives or completes a quest appears once, with the areas of every variant that does so.
function questPeople(rows: readonly CatalogQuestRow[], kind: "giver" | "turnIn", input: DocumentProjectionInput, indexes: RelationIndexes): QuestTurnIn[] {
  const people = new Map<string, { refs: Ref[]; areas: Set<string> }>();
  for (const row of rows) {
    if (row.kind !== kind || row.counterpart === null) continue;
    const ref = input.resolve(row.counterpart);
    const person = people.get(refKey(ref)) ?? { refs: [], areas: new Set<string>() };
    person.refs.push(ref);
    for (const placement of recordLocations(row.counterpart.entityKey ?? "", indexes, input.placements)) person.areas.add(placement.label);
    people.set(refKey(ref), person);
  }
  return [...people.values()].map(({ refs, areas }) => ({ npc: pageOrVariant(refs, input), areas: [...areas].sort() }));
}

function projectQuest(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): PublicQuest {
  const fact = input.facts.quests.find((candidate) => candidate.entityKey === entity.entityKey);
  const rows = indexes.questsByQuest.get(entity.entityKey) ?? [];
  const chainName = displayName(fact?.chainName ?? "");
  const chain = chainName ? input.facts.quests.filter((candidate) => displayName(candidate.chainName ?? "") === chainName)
    .sort((left, right) => (left.chainOrder ?? Infinity) - (right.chainOrder ?? Infinity) || left.entityKey.localeCompare(right.entityKey)) : [];
  const starts: QuestStart[] = questPeople(rows, "giver", input, indexes).map((person) => ({ kind: "npc" as const, ...person }));
  starts.push(...groupPlacedRows(rows.filter((row) => row.kind === "worldOffer" && row.worldOffer !== null).map((row) => ({
    kind: "worldZone" as const,
    placements: publishedPlacements(row.placementIds, input.placements),
    availability: projectAvailability(row.availability, conditions, input.resolve),
    ...(row.worldOffer!.zoneDelaySeconds === null ? {} : { zoneDelaySeconds: row.worldOffer!.zoneDelaySeconds }),
    pool: [...new Map(row.worldOffer!.pool.filter((quest) => quest.entityKey !== entity.entityKey)
      .map((quest) => [quest.entityKey ?? quest.label, input.resolve(quest)] as const)).values()].sort((left, right) =>
      (left.key ?? left.label).localeCompare(right.key ?? right.label)),
  }))));
  starts.push(...groupPlacedRows(rows.filter((row) => row.kind === "objectStart").map((row) => ({
    kind: "object" as const, ...(displayName(row.label ?? "") ? { label: displayName(row.label!) } : {}),
    placements: publishedPlacements(row.placementIds, input.placements),
    availability: projectAvailability(row.availability, conditions, input.resolve),
  }))));
  const unlocks = input.facts.quests.filter((candidate) => candidate.conditionIds.some((id) => conditionNamesQuest(id, entity.entityKey, conditions)))
    .map((candidate) => input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey }));
  const worldChanges = groupPlacedRows(input.relations.gatedSources.filter((source) =>
    source.availability.some((rule) => conditionNamesQuest(rule.conditionId, entity.entityKey, conditions))).map((source) => ({
    sourceKind: WORLD_SOURCE_KIND[source.family], subjects: mergeRefs(source.subjects.map(input.resolve), input).sort((left, right) =>
      (left.key ?? left.label).localeCompare(right.key ?? right.label)),
    ...(displayName(source.label ?? "") ? { label: displayName(source.label!) } : {}),
    availability: projectAvailability(source.availability, conditions, input.resolve),
    placements: publishedPlacements(source.placementIds, input.placements),
  }))).filter((row) => row.availability.length > 0);
  return {
    ...baseDocument(entity, ref, input),
    facts: {
      ...(chainName && fact?.chainOrder !== null && fact?.chainOrder !== undefined ? { chain: { name: chainName, order: fact.chainOrder } } : {}),
      repeatable: fact?.repeatable ?? false, turnInWithoutNpc: fact?.turnInWithoutNpc ?? false,
      requirements: requirementsFor(fact?.conditionIds ?? [], conditions, input.resolve),
      ...(fact?.levelRange ? { levelRange: fact.levelRange } : {}),
      ...(optionalCount(fact?.levelRequirement ?? null) === undefined ? {} : { levelRequirement: optionalCount(fact?.levelRequirement ?? null) }),
      ...(optionalCount(fact?.experience ?? null) === undefined ? {} : { experience: optionalCount(fact?.experience ?? null) }),
      ...(plainText(fact?.objectiveText ?? "") ? { objectiveText: plainText(fact!.objectiveText!) } : {}),
      ...(plainText(fact?.completedDescription ?? "") ? { completedDescription: plainText(fact!.completedDescription!) } : {}),
      ...(fact?.worldQuest ? { worldQuest: fact.worldQuest } : {}),
    },
    starts,
    turnIns: questPeople(rows, "turnIn", input, indexes),
    objectives: rows.filter((row) => row.kind === "objective" && row.task !== null).map((row) => objectiveForRow(row, input, indexes, conditions)),
    itemsGiven: rows.filter((row) => row.kind === "itemGiven" && row.counterpart !== null).map((row) => ({ counterpart: input.resolve(row.counterpart!), count: Math.max(0, row.count ?? 1) })),
    rewards: rows.filter((row) => row.kind === "reward" && row.counterpart !== null).map((row) => ({ counterpart: input.resolve(row.counterpart!), count: Math.max(0, row.count ?? 1), choice: false })),
    rewardChoices: rows.filter((row) => row.kind === "rewardChoice" && row.counterpart !== null).map((row) => ({ counterpart: input.resolve(row.counterpart!), count: Math.max(0, row.count ?? 1), choice: true })),
    chainQuests: chain.map((candidate) => input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey })),
    unlocks, worldChanges,
    ...(fact?.dungeon ? { dungeon: input.resolve(fact.dungeon) } : {}),
  };
}

function placementGroups(placements: readonly CatalogPlacementRow[], categories: Readonly<Record<string, true>>, input: DocumentProjectionInput): PlacementGroup[] {
  const grouped = new Map<PublicMarkerCategory, Set<string>>();
  for (const placement of placements) {
    const publicPlacement = input.placements.get(placement.placementId);
    if (!publicPlacement) continue;
    for (const category of publicPlacement.categories) {
      if (!Object.hasOwn(categories, category)) continue;
      const rows = grouped.get(category) ?? new Set<string>();
      rows.add(publicPlacement.placementId);
      grouped.set(category, rows);
    }
  }
  return [...grouped].sort(([left], [right]) => left.localeCompare(right)).map(([category, rows]) => ({ category, placementCount: rows.size }));
}

const HOSTILE_CATEGORIES: ReadonlySet<PublicMarkerCategory> = new Set<PublicMarkerCategory>(["enemy", "boss", "neutral"]);

// The creatures of a place, one row per page. A row with enemy, boss, or neutral placements is a creature, and other
// rows are characters.
function creaturesForPlace(entityKey: string, input: DocumentProjectionInput, indexes: RelationIndexes, hostile: boolean): CreatureRow[] {
  const byPage = new Map<string, { refs: Ref[]; placementIds: Set<string>; levels: PublicLevel[]; roles: Set<PublicMarkerCategory> }>();
  for (const placement of indexes.placementsByScene.get(entityKey) ?? []) {
    if (!input.placements.has(placement.placementId)) continue;
    for (const npcKey of new Set(placement.roles.map((role) => role.npcEntityKey))) {
      if (npcKey === null) continue;
      const ref = input.resolve({ entityKey: npcKey, label: npcKey });
      const row = byPage.get(refKey(ref)) ?? { refs: [], placementIds: new Set<string>(), levels: [], roles: new Set<PublicMarkerCategory>() };
      row.refs.push(ref);
      row.placementIds.add(placement.placementId);
      const level = input.npcLevels.get(placement.placementId)?.get(npcKey);
      if (level) row.levels.push(level);
      for (const category of markerCategories(placement.roles.filter((role) => role.npcEntityKey === npcKey), [npcFact(npcKey, indexes)])) row.roles.add(category);
      byPage.set(refKey(ref), row);
    }
  }
  const rows: CreatureRow[] = [];
  for (const row of byPage.values()) {
    if ([...row.roles].some((role) => HOSTILE_CATEGORIES.has(role)) !== hostile) continue;
    const level = levelUnion(row.levels);
    rows.push({ counterpart: pageOrVariant(row.refs, input), ...(level ? { level } : {}), roles: [...row.roles].sort(), placementCount: row.placementIds.size });
  }
  return rows.sort((left, right) => ("name" in left.counterpart ? left.counterpart.name : left.counterpart.label).localeCompare("name" in right.counterpart ? right.counterpart.name : right.counterpart.label));
}

function projectPlace(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes): PublicPlace {
  const fact = input.facts.places.find((candidate) => candidate.entityKey === entity.entityKey);
  const mapSpaceId = fact?.mapSpaceIds.find((candidate) => input.regionIdsByMapSpace.has(candidate)) ?? null;
  const placeType = fact?.placeType ?? (entity.kind === "regions" ? "region" : "zone");
  const placePlacements = indexes.placementsByScene.get(entity.entityKey) ?? [];
  const serviceCategories = { merchant: true, auctioneer: true, banker: true, questGiver: true, flightPoint: true, townsfolk: true,
    craftingStation: true, alchemyStation: true, cookingStation: true, smithingStation: true, furnace: true, tailoringStation: true,
    travelPoint: true, neutral: true } as const;
  const resourceCategories = { oreVein: true, herb: true, mushroom: true, fishingSpot: true } as const;
  const containerCategories = { container: true } as const;
  const here = new Set(placePlacements.filter((placement) => input.placements.has(placement.placementId)).map((placement) => placement.placementId));
  const placedHere = (ids: readonly string[]) => ids.some((id) => here.has(id));
  const npcPlacedHere = (key: string | null | undefined) => (indexes.placementsByNpc.get(key ?? "") ?? []).some((placement) => here.has(placement.placementId));
  const startsHere = (row: CatalogQuestRow) => row.kind === "giver" && npcPlacedHere(row.counterpart?.entityKey)
    || (row.kind === "worldOffer" || row.kind === "objectStart") && placedHere(row.placementIds);
  const objectiveHere = (row: CatalogQuestRow) => row.kind === "objective" && row.task !== null && (
    row.task.taskType === "enterScene" && row.task.target?.entityKey === entity.entityKey
    || npcPlacedHere(row.task.target?.entityKey)
    || row.completions.some((completion) => placedHere(completion.placementIds)));
  const questRefs = (predicate: (row: CatalogQuestRow) => boolean) => [...new Map(input.relations.quests
    .filter(predicate).map((row) => [row.quest.entityKey ?? row.quest.label, input.resolve(row.quest)] as const)).values()];
  const connections = input.relations.transitions.flatMap((row): ConnectionRow[] => {
    const startsHere = row.sourceSceneKey === entity.entityKey, endsHere = row.destinationSceneKey === entity.entityKey;
    if (!startsHere && !endsHere) return [];
    const direction = startsHere && endsHere ? "within" : startsHere ? "to" : "from";
    const counterpartKey = direction === "from" ? row.sourceSceneKey : row.destinationSceneKey;
    return [{ counterpart: endpointOrUnknown(input.resolve, counterpartKey === null ? null : { entityKey: counterpartKey, label: counterpartKey }, "Unknown place"), direction, placements: publishedPlacements(row.placementIds, input.placements) }];
  });
  return {
    ...baseDocument(entity, ref, input, fact?.guideDescription),
    facts: { placeType, ...(fact?.levelRange ? { levelRange: fact.levelRange } : {}), guideIncluded: fact?.guideIncluded ?? false },
    space: mapSpaceId === null ? null : { mapSpaceId, regionIds: [...(input.regionIdsByMapSpace.get(mapSpaceId) ?? [])] },
    bosses: mergeRefs((fact?.bosses ?? []).map(input.resolve), input), creatures: creaturesForPlace(entity.entityKey, input, indexes, true), npcs: creaturesForPlace(entity.entityKey, input, indexes, false),
    services: placementGroups(placePlacements, serviceCategories, input), resources: placementGroups(placePlacements, resourceCategories, input), containers: placementGroups(placePlacements, containerCategories, input),
    quests: questRefs(startsHere), questObjectives: questRefs(objectiveHere),
    properties: input.facts.properties.filter((property) => propertySceneKey(property.entityKey, input) === entity.entityKey).map((property) => input.resolve({ entityKey: property.entityKey, label: property.entityKey })),
    connections, regions: input.facts.places.filter((candidate) => candidate.placeType === "region" && candidate.parentSceneKey === entity.entityKey).map((candidate) => input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey })),
    ...(fact?.parentSceneKey ? { parent: input.resolve({ entityKey: fact.parentSceneKey, label: fact.parentSceneKey }) } : {}),
  };
}

/** The for-sale signs of a property that the publication places on the map. */
function propertySigns(propertyKey: string, input: DocumentProjectionInput): PlacementRef[] {
  return publishedPlacements(input.placementIdsByKey.get(propertyKey) ?? [], input.placements);
}

/** The place of a property is the one scene that holds all of its published for-sale signs. */
function propertySceneKey(propertyKey: string, input: DocumentProjectionInput): string | undefined {
  const scenes = new Set(propertySigns(propertyKey, input).flatMap((sign) => input.relations.placements.find((row) => row.placementId === sign.placementId)?.sceneKey ?? []));
  return scenes.size === 1 ? [...scenes][0] : undefined;
}

function projectProperty(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput): PublicProperty {
  const fact = input.facts.properties.find((candidate) => candidate.entityKey === entity.entityKey);
  const currency = optionalFactRef(input.resolve, fact?.currency);
  const price = (amount: number | null | undefined) => amount !== null && amount !== undefined && amount >= 0 && currency ? { amount, currency } : undefined;
  const purchase = price(fact?.purchasePrice), sale = price(fact?.sellPrice), income = price(fact?.income);
  const locations = propertySigns(entity.entityKey, input);
  const sceneKey = propertySceneKey(entity.entityKey, input);
  const place = sceneKey === undefined ? undefined : input.resolve({ entityKey: sceneKey, label: sceneKey });
  return {
    ...baseDocument(entity, ref, input),
    locations,
    facts: {
      ...(fact?.propertyType ? { propertyType: fact.propertyType } : {}), ...(purchase ? { price: purchase } : {}), ...(sale ? { sellPrice: sale } : {}),
      // A nonpositive interval turns the payments off.
      ...(income && (fact?.incomeInterval ?? 1) > 0 ? { income, ...(fact?.incomeInterval ? { incomeInterval: fact.incomeInterval } : {}) } : {}),
    },
    ...(place ? { place } : {}),
  };
}

// An ability page shows one version for each set of records that share their rank texts, with the creatures that use
// them and the items that teach them.
function projectAbilityPage(page: PublishedPage, input: DocumentProjectionInput, conditions: ReadonlyMap<string, CatalogCondition>): PublicAbility {
  const progression = new Map(input.facts.progression.facts.map((fact) => [fact.entityKey, fact]));
  const factsByKey = new Map(input.facts.abilities.map((fact) => [fact.entityKey, fact]));
  const covered = new Set(page.versions.flatMap((version) => version.members.map((member) => member.entityKey)));
  for (const member of page.members) if (!covered.has(member.entity.entityKey)) throw new Error(`Missing ability facts for ${member.entity.entityKey}.`);
  const base = pageBase(page, input);
  const versions = page.versions.map((version) => {
    const keys = version.members.map((member) => member.entityKey), keySet = new Set(keys);
    const fact = factsByKey.get(keys[0]!)!;
    const usedBy = mergeRefs(input.facts.npcs.filter((npc) => npc.abilityPhases.some((phase) => phase.abilities.some((ability) => ability.ability.entityKey !== null && keySet.has(ability.ability.entityKey))))
      .map((npc) => input.resolve({ entityKey: npc.entityKey, label: npc.entityKey })), input);
    const taughtBy = mergeRefs(input.facts.items.filter((item) => item.actionAbilities.some((ability) => ability.ability.entityKey !== null && keySet.has(ability.ability.entityKey)))
      .map((item) => input.resolve({ entityKey: item.entityKey, label: item.entityKey })), input);
    const icon = input.artByEntity.get(keys[0]!)?.icon;
    const mechanics = progression.get(keys[0]!);
    const useCondition = mechanics?.kind === "abilities" ? mechanics.details.ranks[0]?.conditionId ?? null : null;
    const useRequirements = useCondition === null ? [] : requirementsFor([useCondition], conditions, input.resolve);
    return { keys, anchor: version.anchor, ...(icon && icon.sha256 !== base.art.icon?.sha256 ? { icon } : {}), ranks: fact.ranks.map((rank) => ({ rankIndex: Math.max(0, rank.rankIndex), lines: rank.lines })), useRequirements, learnedBy: learnersOf(keySet, input, conditions), usedBy, taughtBy };
  });
  return { ...base, versions };
}

// A talent tree row has the anchor `talent-<tree id>-<node index>`, so a requirement or an ability page can link it.
function talentAnchor(treeKey: string, nodeIndex: number): string {
  return `talent-${treeKey.slice(treeKey.indexOf(":") + 1)}-${nodeIndex}`;
}

// The trees of a class in authored order, with the anchor of each passive talent. A talent that appears in several trees
// of the game appears once in a class, so a reference on the class page resolves to the row of that class.
function classTalents(classKey: string, input: DocumentProjectionInput) {
  const progression = input.facts.progression;
  const trees = progression.links.filter((link) => link.owner === classKey && link.linkKind === "talentTree" && link.target.entityKey !== null).sort((a, b) => a.linkIndex - b.linkIndex);
  const anchors = new Map<string, string>();
  for (const tree of trees) for (const node of progression.talentNodes) if (node.tree === tree.target.entityKey && node.target?.entityKey && !anchors.has(node.target.entityKey)) anchors.set(node.target.entityKey, talentAnchor(node.tree, node.nodeIndex));
  return { trees, anchors };
}

// Resolves a talent to its row on the page of its class. Other references resolve as everywhere else.
function talentResolver(classRef: Ref, anchors: ReadonlyMap<string, string>, input: DocumentProjectionInput): ReferenceResolver {
  return (endpoint) => {
    const anchor = endpoint.entityKey === null || !endpoint.entityKey.startsWith("bonuses:") ? undefined : anchors.get(endpoint.entityKey);
    if (anchor === undefined || !isEntityRef(classRef) || classRef.slug === undefined) return input.resolve(endpoint);
    return { key: classRef.key, kind: classRef.kind, name: displayName(endpoint.label ?? ""), slug: classRef.slug, variant: anchor };
  };
}

// The published classes that learn one of the abilities, as the auto attack or through a talent tree node.
function learnersOf(abilityKeys: ReadonlySet<string>, input: DocumentProjectionInput, conditions: ReadonlyMap<string, CatalogCondition>): LearnerRow[] {
  const progression = input.facts.progression, rows: LearnerRow[] = [], seen = new Set<string>();
  for (const learner of progression.learners) {
    if (!abilityKeys.has(learner.ability) || learner.owner.entityKey === null) continue;
    const classRef = input.resolve(learner.owner);
    if (!isEntityRef(classRef) || classRef.kind !== "classes" || classRef.slug === undefined) continue;
    if (learner.via === "autoAttack") {
      const key = `${classRef.key}|auto`;
      if (!seen.has(key)) { seen.add(key); rows.push({ class: classRef, via: "autoAttack", requirements: [] }); }
      continue;
    }
    if (learner.via !== "talentTree" || learner.source?.entityKey == null) continue;
    const node = progression.talentNodes.find((candidate) => candidate.tree === learner.source?.entityKey && candidate.target?.entityKey === learner.ability && candidate.tier === learner.tier && candidate.row === learner.row);
    if (!node) continue;
    const key = `${classRef.key}|${node.tree}|${node.nodeIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { anchors } = classTalents(classRef.key, input);
    const requirements = node.conditionId === null ? [] : requirementsFor([node.conditionId], conditions, talentResolver(classRef, anchors, input));
    rows.push({ class: classRef, via: "talentTree", tree: displayName(learner.source.label), tier: Math.max(0, node.tier), talent: { ...classRef, variant: talentAnchor(node.tree, node.nodeIndex) }, requirements });
  }
  return rows;
}

function talentRank(rank: { rank: number; statEffects: readonly { stat: CatalogEndpoint; amount: number; isPercent: boolean }[]; emptyTooltip: string | null }, input: DocumentProjectionInput): TalentRank {
  const text = rank.statEffects.length === 0 && rank.emptyTooltip ? withoutMarkup(rank.emptyTooltip).trim() : "";
  return { rank: Math.max(0, rank.rank) + 1, stats: rank.statEffects.map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })), text: text ? [{ spans: [{ text, tone: null, italic: false }] }] : [] };
}

function experienceRows(template: CatalogEndpoint | null | undefined, highest: number | null, input: DocumentProjectionInput) {
  const fact = template?.entityKey ? input.facts.progression.facts.find((candidate) => candidate.entityKey === template.entityKey) : undefined;
  if (fact?.kind !== "levels") return [];
  // The game reads a template row by its position. Skill templates store level 0 in every row, so the position is the level.
  const rows = fact.details.rows.map((row, index) => ({ level: index + 1, experience: Math.max(0, row.experienceRequired) }));
  return highest === null ? rows : rows.slice(0, highest);
}

function projectClass(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, conditions: ReadonlyMap<string, CatalogCondition>): PublicClass {
  const progression = input.facts.progression, facts = new Map(progression.facts.map((fact) => [fact.entityKey, fact]));
  const fact = facts.get(entity.entityKey), details = fact?.kind === "classes" ? fact.details : undefined;
  const { trees, anchors } = classTalents(entity.entityKey, input), resolve = talentResolver(ref, anchors, input);
  const projectedTrees: TalentTree[] = trees.map((link) => {
    const treeKey = link.target.entityKey!, tree = facts.get(treeKey), points = tree?.kind === "talentTrees" ? tree.details.treePoint : null;
    const nodes = progression.talentNodes.filter((node) => node.tree === treeKey && node.target?.entityKey).sort((a, b) => a.tier - b.tier || a.row - b.row || a.nodeIndex - b.nodeIndex);
    return {
      anchor: `tree-${treeKey.slice(treeKey.indexOf(":") + 1)}`, name: displayName(link.target.label), ...(points?.label ? { points: displayName(points.label) } : {}),
      rows: nodes.map((node) => {
        const target = node.target!, bonus = node.nodeType === "bonus" ? facts.get(target.entityKey!) : undefined;
        const ranks = bonus?.kind === "bonuses" ? bonus.details.ranks : [];
        return {
          anchor: talentAnchor(treeKey, node.nodeIndex), tier: Math.max(0, node.tier), position: Math.max(0, node.row), name: displayName(target.label),
          ...(node.nodeType === "ability" ? { ability: input.resolve(target) } : {}), ranks: Math.max(1, ranks.length),
          ...(ranks[0] ? { first: talentRank(ranks[0], input) } : {}), ...(ranks.length > 1 ? { last: talentRank(ranks.at(-1)!, input) } : {}),
          requirements: node.conditionId === null ? [] : requirementsFor([node.conditionId], conditions, resolve),
        };
      }),
    };
  });
  // Talent points that no rule grants and that have no start amount carry no information.
  const pointKeys = [...new Set(trees.flatMap((link) => { const tree = facts.get(link.target.entityKey!); return tree?.kind === "talentTrees" && tree.details.treePoint?.entityKey ? [tree.details.treePoint.entityKey] : []; }))];
  const talentPoints = pointKeys.flatMap((key): TalentPoints[] => {
    const point = facts.get(key);
    if (point?.kind !== "treePoints") return [];
    const gains = point.details.gainRules.filter((rule) => rule.class === null || rule.class.entityKey === entity.entityKey).flatMap((rule): TalentPoints["gains"] => {
      const trigger = rule.trigger.name;
      return trigger === "characterLevelUp" || trigger === "skillLevelUp" || trigger === "npcKilled" || trigger === "itemGained" || trigger === "weaponTemplateLevelUp" ? [{ trigger, amount: Math.max(0, rule.amount) }] : [];
    });
    return gains.length === 0 && point.details.startAmount <= 0 ? [] : [{ name: displayName(point.name ?? ""), start: Math.max(0, point.details.startAmount), max: Math.max(0, point.details.maxPoints), gains }];
  });
  const races = progression.facts.flatMap((race) => race.kind === "races" && race.details.offeredClasses.some((row) => row.entityKey === entity.entityKey) ? [displayName(race.name ?? "")] : []).filter(Boolean);
  const experience = experienceRows(details?.levelTemplate, null, input);
  const autoAttack = optionalFactRef(input.resolve, details?.autoAttackAbility);
  return {
    ...baseDocument(entity, ref, input),
    facts: { races, weapons: [...(input.classWeapons?.get(entity.entityKey) ?? [])], ...(autoAttack ? { autoAttack } : {}), talentPoints, ...(experience.length ? { highestLevel: experience.at(-1)!.level } : {}) },
    trees: projectedTrees,
    startingGear: (details?.startItems ?? []).map((row) => ({ item: input.resolve(row.item), count: Math.max(0, row.count), equipped: row.equipped })),
    experience,
  };
}

function projectSkill(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes): PublicSkill {
  const fact = input.facts.progression.facts.find((candidate) => candidate.entityKey === entity.entityKey), details = fact?.kind === "skills" ? fact.details : undefined;
  const highest = details && details.maxLevel > 0 ? details.maxLevel : null;
  const recipes = input.facts.recipes.filter((recipe) => recipe.skill?.entityKey === entity.entityKey).map((recipe) => {
    const product = (indexes.recipesByRecipe.get(recipe.entityKey) ?? []).find((row) => row.role === "product"), station = optionalFactRef(input.resolve, recipe.station);
    return { recipe: input.resolve({ entityKey: recipe.entityKey, label: recipe.entityKey }), ...(product ? { product: input.resolve(product.item) } : {}), ...(station ? { station } : {}) };
  }).sort((a, b) => refName(a.recipe).localeCompare(refName(b.recipe)));
  return {
    ...baseDocument(entity, ref, input),
    facts: { ...(highest === null ? {} : { highestLevel: highest }), automatic: details?.automaticallyAdded ?? true },
    recipes, experience: highest === null ? [] : experienceRows(details?.levelTemplate, highest, input),
  };
}

function refName(ref: Ref): string {
  return isEntityRef(ref) ? ref.name : ref.label;
}

function projectRecipe(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes): PublicRecipe {
  const fact = input.facts.recipes.find((candidate) => candidate.entityKey === entity.entityKey);
  const rows = indexes.recipesByRecipe.get(entity.entityKey) ?? [];
  const product = rows.find((row) => row.role === "product");
  const firstRank = fact?.ranks[0];
  const station = optionalFactRef(input.resolve, fact?.station), skill = optionalFactRef(input.resolve, fact?.skill);
  return {
    ...baseDocument(entity, ref, input),
    facts: { ...(station === undefined ? {} : { station }), ...(skill === undefined ? {} : { skill }), ...(firstRank ? { rank: Math.max(0, firstRank.rank) } : {}) },
    ...(product ? { product: { counterpart: input.resolve(product.item), count: Math.max(0, product.count) } } : {}),
    materials: rows.filter((row) => row.role === "material").map((row) => ({ counterpart: input.resolve(row.item), count: Math.max(0, row.count) })),
  };
}

/**
 * The gear set of an item, in full: its members, then each tier as the number of equipped members it needs and the
 * stats it grants, which is the order the game's own item tooltip shows.
 */
function projectGearSet(setKey: string, input: DocumentProjectionInput): GearSet | undefined {
  const fact = input.facts.gearSets.find((candidate) => candidate.entityKey === setKey);
  if (!fact || !input.entities.some((candidate) => candidate.entityKey === setKey)) return undefined;
  // The set's reference carries its formatted and qualified name, so the tooltip names the set as every other link does.
  const set = input.resolve({ entityKey: setKey, label: setKey });
  return {
    key: setKey, name: isEntityRef(set) ? set.name : set.label, members: fact.members.map(input.resolve),
    tiers: fact.tiers.map((tier) => ({ equipped: Math.max(1, tier.equipped),
      stats: tier.stats.map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })) })),
  };
}

/** One document for each published page, keyed by the page key. */
export function projectPublicDocuments(input: DocumentProjectionInput): ReadonlyMap<string, PublicDocument> {
  const indexes = relationIndexes(input.entities, input.facts, input.relations), conditions = conditionsById(input.relations.conditions);
  const startingGear = startingGearByItem(input.entities, input.facts, input.references.refs);
  const result = new Map<string, PublicDocument>();
  for (const [key, page] of input.references.pages) {
    if (!page.ref.slug) continue;
    const entity = page.members[0]!.entity, ref = page.ref;
    let document: PublicDocument;
    switch (page.kind) {
      case "items": document = projectItem(entity, ref, input, indexes, conditions, startingGear); break;
      case "npcs": document = projectNpcPage(page, input, indexes, conditions); break;
      case "quests": document = projectQuest(entity, ref, input, indexes, conditions); break;
      case "places": document = projectPlace(entity, ref, input, indexes); break;
      case "properties": document = projectProperty(entity, ref, input); break;
      case "abilities": document = projectAbilityPage(page, input, conditions); break;
      case "recipes": document = projectRecipe(entity, ref, input, indexes); break;
      case "classes": document = projectClass(entity, ref, input, conditions); break;
      case "skills": document = projectSkill(entity, ref, input, indexes); break;
      default: continue;
    }
    result.set(key, document);
  }
  return result;
}

export function countUnresolvedReferences(value: unknown): number {
  if (Array.isArray(value)) return value.reduce<number>((sum, entry) => sum + countUnresolvedReferences(entry), 0);
  if (value === null || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  const own = record.key === null && typeof record.label === "string" ? 1 : 0;
  return own + Object.values(record).reduce<number>((sum, entry) => sum + countUnresolvedReferences(entry), 0);
}
