import type {
  CatalogAvailabilityRule,
  CatalogCondition,
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
  CreatureRow,
  EntityRef,
  AvailabilityRule,
  PlacementGroup,
  PlacementRef,
  PublicAbility,
  PublicDocument,
  PublicGearSet,
  PublicItem,
  PublicMarkerCategory,
  PublicNpc,
  PublicPlace,
  PublicProperty,
  PublicQuest,
  PublicRecipe,
  QuestObjective,
  QuestStart,
  QuestWorldChange,
  Ref,
  RequirementGroup,
  RequirementRef,
} from "@afallon/contracts/public";
import { plainText, withoutMarkup } from "./text";

export type ReferenceResolver = (endpoint: CatalogEndpoint) => Ref;
export type PublishedPlacement = PlacementRef & { categories: readonly PublicMarkerCategory[] };

export interface DocumentProjectionInput {
  entities: readonly CatalogEntityRow[];
  facts: CatalogFacts;
  relations: CatalogRelations;
  refs: ReadonlyMap<string, EntityRef>;
  resolve: ReferenceResolver;
  artByEntity: ReadonlyMap<string, Art>;
  placements: ReadonlyMap<string, PublishedPlacement>;
  regionIdsByMapSpace: ReadonlyMap<string, readonly string[]>;
}

type RelationIndexes = {
  entities: Map<string, CatalogEntityRow>;
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
};

function pushIndex<T>(index: Map<string, T[]>, key: string | null, value: T): void {
  if (key === null) return;
  const rows = index.get(key);
  if (rows) rows.push(value);
  else index.set(key, [value]);
}

function relationIndexes(entities: readonly CatalogEntityRow[], relations: CatalogRelations): RelationIndexes {
  const result: RelationIndexes = {
    entities: new Map(entities.map((entity) => [entity.entityKey, entity])),
    dropsByOwner: new Map(), dropsByItem: new Map(), vendorsByNpc: new Map(), vendorsByItem: new Map(),
    gathersByResource: new Map(), gathersByItem: new Map(), containersByItem: new Map(), interactionsByItem: new Map(), questsByQuest: new Map(),
    questsByCounterpart: new Map(), gatedSourcesBySubject: new Map(), recipesByRecipe: new Map(), recipesByItem: new Map(), placementsByNpc: new Map(), placementsByScene: new Map(),
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
    for (const role of placement.roles) pushIndex(result.placementsByNpc, role.npcEntityKey, placement);
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

function npcLocations(key: string, indexes: RelationIndexes, placements: ReadonlyMap<string, PlacementRef>): PlacementRef[] {
  return publishedPlacements((indexes.placementsByNpc.get(key) ?? []).map((placement) => placement.placementId), placements);
}

function optionalCount(value: number | null): number | undefined {
  return value !== null && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function optionalChance(value: number | null): number | undefined {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;
}

function levelRange(facts: CatalogNpcFacts): { min: number; max: number } | undefined {
  const min = optionalCount(facts.minLevel), max = optionalCount(facts.maxLevel);
  return min === undefined || max === undefined ? undefined : { min, max };
}

const PUBLIC_ROLE: Readonly<Record<string, true>> = {
  boss: true, enemy: true, neutral: true, merchant: true, auctioneer: true, banker: true, questGiver: true, townsfolk: true, corruptionAltar: true,
  challengeStone: true, craftingStation: true, container: true, oreVein: true, herb: true, mushroom: true, fishingSpot: true,
  interactiveObject: true, town: true, fort: true, camp: true, property: true, dungeonEntrance: true, graveyard: true, flightPoint: true, travelPoint: true,
};

function npcRoles(key: string, facts: CatalogNpcFacts, indexes: RelationIndexes): PublicMarkerCategory[] {
  const roles = new Set<PublicMarkerCategory>();
  if (facts.isMerchant) roles.add("merchant");
  if (facts.isAuctioneer) roles.add("auctioneer");
  if (facts.isBanker) roles.add("banker");
  if (facts.isQuestGiver) roles.add("questGiver");
  if (facts.isFlightMaster) roles.add("flightPoint");
  if (facts.isCombatEnabled) roles.add("enemy");
  for (const placement of indexes.placementsByNpc.get(key) ?? []) for (const role of placement.roles) {
    if (role.npcEntityKey === key && PUBLIC_ROLE[role.role]) roles.add(role.role as PublicMarkerCategory);
  }
  return [...roles].sort();
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
  const target = endpointOrUnknown(resolve, task.target, plainText(task.sceneName ?? "") || "Unknown target");
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
    ...(plainText(completion.label ?? "") ? { label: plainText(completion.label!) } : {}),
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

function projectItem(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): PublicItem {
  const fact = input.facts.items.find((candidate) => candidate.entityKey === entity.entityKey);
  const enchantment = optionalFactRef(input.resolve, fact?.enchantment);
  const sellCurrency = optionalFactRef(input.resolve, fact?.sellCurrency), buyCurrency = optionalFactRef(input.resolve, fact?.buyCurrency);
  const gearSet = optionalFactRef(input.resolve, fact?.gearSet);
  const droppedBy = (indexes.dropsByItem.get(entity.entityKey) ?? []).filter((row) => row.context !== "container").map((row) => ({
    counterpart: input.resolve(row.owner),
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }),
    ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }),
    ...(optionalChance(row.displayedChance) === undefined ? {} : { chance: optionalChance(row.displayedChance) }),
    ...(row.levelBand === null ? {} : { levelBand: row.levelBand }),
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  }));
  const soldBy = (indexes.vendorsByItem.get(entity.entityKey) ?? []).map((row) => ({
    counterpart: input.resolve(row.npc), price: { amount: Math.max(0, row.cost), currency: endpointOrUnknown(input.resolve, row.currency, "Unknown currency") },
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  }));
  const gatheredFrom = groupPlacementCounts((indexes.gathersByItem.get(entity.entityKey) ?? []).map((row) => ({
    ...(row.resource === null ? {} : { counterpart: input.resolve(row.resource) }), label: plainText(row.producerLabel) || "Resource",
    ...(row.skill === null ? {} : { skill: input.resolve(row.skill) }), ...(optionalCount(row.rank) === undefined ? {} : { rank: optionalCount(row.rank) }),
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }), ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }),
    ...(optionalChance(row.rawRate) === undefined ? {} : { chance: optionalChance(row.rawRate) }), placements: publishedPlacements(row.placementIds, input.placements),
  })));
  const inContainers = groupPlacementCounts((indexes.containersByItem.get(entity.entityKey) ?? []).map((row) => ({
    ...(row.place === null ? {} : { counterpart: input.resolve(row.place) }), label: plainText(row.containerType ?? "") || "Container",
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }),
    ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }), ...(optionalChance(row.rawRate) === undefined ? {} : { chance: optionalChance(row.rawRate) }),
    availability: projectAvailability(row.availability, conditions, input.resolve),
    placements: publishedPlacements(row.placementIds, input.placements),
  })));
  const collectedFrom = groupPlacementCounts((indexes.interactionsByItem.get(entity.entityKey) ?? []).map((row) => ({
    ...(row.place === null ? {} : { counterpart: input.resolve(row.place) }), label: plainText(row.objectName ?? "") || "Object",
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
  };
}

function projectNpc(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, locations: PlacementRef[], conditions: ReadonlyMap<string, CatalogCondition>): PublicNpc {
  const fact = input.facts.npcs.find((candidate) => candidate.entityKey === entity.entityKey);
  const npcFact: CatalogNpcFacts = fact ?? { entityKey: entity.entityKey, minLevel: null, maxLevel: null, scalesWithPlayer: false, npcType: null, creatureType: null, family: null, faction: null, species: null, isMerchant: false, isQuestGiver: false, isCombatEnabled: false, isAuctioneer: false, isBanker: false, isFlightMaster: false, hunterTamable: false, hunterBeastRole: null, equipmentAppearanceSelections: null, adventurer: null, flightNetwork: null, minRespawn: null, maxRespawn: null, minExperience: null, maxExperience: null, immuneToStun: false, immuneToSlow: false, aggroRange: null, stats: [], abilityPhases: [], factionRewards: [], linkedNpc: null, lootSpecialization: null };
  const range = levelRange(npcFact), roles = npcRoles(entity.entityKey, npcFact, indexes);
  const faction = optionalFactRef(input.resolve, npcFact.faction), species = optionalFactRef(input.resolve, npcFact.species);
  const linkedNpc = optionalFactRef(input.resolve, npcFact.linkedNpc), lootStat = optionalFactRef(input.resolve, npcFact.lootSpecialization?.stat);
  const questRows = indexes.questsByCounterpart.get(entity.entityKey) ?? [];
  const spawnConditions = groupPlacedRows((indexes.gatedSourcesBySubject.get(entity.entityKey) ?? [])
    .filter((row) => row.family === "npcProducer").map((row) => ({
      availability: projectAvailability(row.availability, conditions, input.resolve),
      placements: publishedPlacements(row.placementIds, input.placements),
    })).filter((row) => row.availability.length > 0));
  return {
    ...baseDocument(entity, ref, input),
    locations, spawnConditions,
    facts: {
      ...(range && range.min === range.max ? { level: range.min } : range ? { levelRange: range } : {}), scalesWithPlayer: npcFact.scalesWithPlayer,
      ...(npcFact.npcType ? { npcType: plainText(npcFact.npcType) } : {}), ...(npcFact.creatureType ? { creatureType: plainText(npcFact.creatureType) } : {}),
      ...(npcFact.family ? { family: plainText(npcFact.family) } : {}), ...(faction === undefined ? {} : { faction }),
      ...(species === undefined ? {} : { species }), roles,
      ...(npcFact.minRespawn === null || npcFact.maxRespawn === null ? {} : { respawn: { min: npcFact.minRespawn, max: npcFact.maxRespawn } }),
      ...(optionalCount(npcFact.minExperience) === undefined || optionalCount(npcFact.maxExperience) === undefined ? {} : { experience: { min: optionalCount(npcFact.minExperience)!, max: optionalCount(npcFact.maxExperience)! } }),
      stats: npcFact.stats.map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })),
      immunities: [npcFact.immuneToStun ? "stun" : null, npcFact.immuneToSlow ? "slow" : null].filter((value): value is string => value !== null),
      ...(npcFact.aggroRange === null ? {} : { aggroRange: npcFact.aggroRange }),
      ...(npcFact.lootSpecialization === null ? {} : { lootSpecialization: {
        ...(npcFact.lootSpecialization.armorType ? { armorType: plainText(npcFact.lootSpecialization.armorType) } : {}),
        weaponTypes: npcFact.lootSpecialization.weaponTypes.map(plainText),
        ...(lootStat === undefined ? {} : { stat: lootStat }),
      } }),
    },
    drops: (indexes.dropsByOwner.get(entity.entityKey) ?? []).map((row) => ({
      counterpart: input.resolve(row.item), ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }),
      ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }),
      ...(optionalChance(row.displayedChance) === undefined ? {} : { chance: optionalChance(row.displayedChance) }),
      ...(row.levelBand === null ? {} : { levelBand: row.levelBand }), requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
    })),
    sells: (indexes.vendorsByNpc.get(entity.entityKey) ?? []).map((row) => ({
      counterpart: input.resolve(row.item), price: { amount: Math.max(0, row.cost), currency: endpointOrUnknown(input.resolve, row.currency, "Unknown currency") },
      requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
    })),
    quests: questRows.filter((row) => row.kind === "giver" || row.kind === "turnIn").map((row) => ({ counterpart: input.resolve(row.quest), role: row.kind === "giver" ? "gives" as const : "completes" as const })),
    abilityPhases: npcFact.abilityPhases.map((phase) => ({ phaseIndex: Math.max(0, phase.phaseIndex), ...(phase.name ? { name: plainText(phase.name) } : {}), ...(phase.requirement ? { requirement: plainText(phase.requirement) } : {}), abilities: phase.abilities.map((ability) => ({ ability: input.resolve(ability.ability), rankIndex: Math.max(0, ability.rankIndex) })) })),
    factionRewards: npcFact.factionRewards.map((reward) => ({ counterpart: input.resolve(reward.faction), amount: reward.amount })),
    usedInQuests: questRows.filter((row) => row.kind === "objective" && row.task !== null).map((row) => ({ counterpart: input.resolve(row.quest), objective: objectiveForRow(row, input, indexes, conditions) })),
    bossOf: input.facts.places.filter((place) => place.bosses.some((boss) => boss.entityKey === entity.entityKey)).map((place) => input.resolve({ entityKey: place.entityKey, label: place.entityKey })),
    ...(linkedNpc === undefined ? {} : { linkedNpc }),
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

function projectQuest(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): PublicQuest {
  const fact = input.facts.quests.find((candidate) => candidate.entityKey === entity.entityKey);
  const rows = indexes.questsByQuest.get(entity.entityKey) ?? [];
  const chainName = plainText(fact?.chainName ?? "");
  const chain = chainName ? input.facts.quests.filter((candidate) => plainText(candidate.chainName ?? "") === chainName)
    .sort((left, right) => (left.chainOrder ?? Infinity) - (right.chainOrder ?? Infinity) || left.entityKey.localeCompare(right.entityKey)) : [];
  const starts: QuestStart[] = rows.filter((row) => row.kind === "giver" && row.counterpart !== null).map((row) => ({
    kind: "npc", npc: input.resolve(row.counterpart!),
    areas: [...new Set(npcLocations(row.counterpart!.entityKey ?? "", indexes, input.placements).map((placement) => placement.label))].sort(),
  }));
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
    kind: "object" as const, ...(plainText(row.label ?? "") ? { label: plainText(row.label!) } : {}),
    placements: publishedPlacements(row.placementIds, input.placements),
    availability: projectAvailability(row.availability, conditions, input.resolve),
  }))));
  const unlocks = input.facts.quests.filter((candidate) => candidate.conditionIds.some((id) => conditionNamesQuest(id, entity.entityKey, conditions)))
    .map((candidate) => input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey }));
  const worldChanges = groupPlacedRows(input.relations.gatedSources.filter((source) =>
    source.availability.some((rule) => conditionNamesQuest(rule.conditionId, entity.entityKey, conditions))).map((source) => ({
    sourceKind: WORLD_SOURCE_KIND[source.family], subjects: source.subjects.map(input.resolve).sort((left, right) =>
      (left.key ?? left.label).localeCompare(right.key ?? right.label)),
    ...(plainText(source.label ?? "") ? { label: plainText(source.label!) } : {}),
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
    turnIns: rows.filter((row) => row.kind === "turnIn" && row.counterpart !== null).map((row) => input.resolve(row.counterpart!)),
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

function creaturesForPlace(entityKey: string, input: DocumentProjectionInput, indexes: RelationIndexes, combat: boolean): CreatureRow[] {
  const byNpc = new Map<string, CatalogPlacementRow[]>();
  for (const placement of indexes.placementsByScene.get(entityKey) ?? []) for (const role of placement.roles) {
    if (role.npcEntityKey === null) continue;
    pushIndex(byNpc, role.npcEntityKey, placement);
  }
  const facts = new Map(input.facts.npcs.map((fact) => [fact.entityKey, fact]));
  const rows: CreatureRow[] = [];
  for (const [npcKey, placements] of byNpc) {
    const fact = facts.get(npcKey);
    if (!fact || fact.isCombatEnabled !== combat) continue;
    const roles = npcRoles(npcKey, fact, indexes);
    const range = levelRange(fact);
    rows.push({ counterpart: input.resolve({ entityKey: npcKey, label: npcKey }), ...(range ? { levelRange: range } : {}), roles,
      placementCount: publishedPlacements(placements.map((placement) => placement.placementId), input.placements).length });
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
  const connections = input.relations.transitions.flatMap((row) => {
    if (row.sourceSceneKey !== entity.entityKey && row.destinationSceneKey !== entity.entityKey) return [];
    const counterpartKey = row.sourceSceneKey === entity.entityKey ? row.destinationSceneKey : row.sourceSceneKey;
    return [{ counterpart: endpointOrUnknown(input.resolve, counterpartKey === null ? null : { entityKey: counterpartKey, label: counterpartKey }, "Unknown place"), kind: plainText(row.transitionKind) || "connection", placements: publishedPlacements(row.placementIds, input.placements) }];
  });
  return {
    ...baseDocument(entity, ref, input, fact?.guideDescription),
    facts: { placeType, ...(fact?.levelRange ? { levelRange: fact.levelRange } : {}), guideIncluded: fact?.guideIncluded ?? false },
    space: mapSpaceId === null ? null : { mapSpaceId, regionIds: [...(input.regionIdsByMapSpace.get(mapSpaceId) ?? [])] },
    bosses: (fact?.bosses ?? []).map(input.resolve), creatures: creaturesForPlace(entity.entityKey, input, indexes, true), npcs: creaturesForPlace(entity.entityKey, input, indexes, false),
    services: placementGroups(placePlacements, serviceCategories, input), resources: placementGroups(placePlacements, resourceCategories, input), containers: placementGroups(placePlacements, containerCategories, input),
    quests: questRefs(startsHere), questObjectives: questRefs(objectiveHere), properties: [], connections, regions: input.facts.places.filter((candidate) => candidate.placeType === "region" && candidate.parentSceneKey === entity.entityKey).map((candidate) => input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey })),
    ...(fact?.parentSceneKey ? { parent: input.resolve({ entityKey: fact.parentSceneKey, label: fact.parentSceneKey }) } : {}),
  };
}

function projectProperty(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, locations: PlacementRef[]): PublicProperty {
  const fact = input.facts.properties.find((candidate) => candidate.entityKey === entity.entityKey);
  const currency = optionalFactRef(input.resolve, fact?.currency);
  return {
    ...baseDocument(entity, ref, input),
    locations,
    facts: { ...(fact?.income === null || fact?.income === undefined ? {} : { income: fact.income }), ...(fact?.purchasePrice !== null && fact?.purchasePrice !== undefined && currency ? { price: { amount: Math.max(0, fact.purchasePrice), currency } } : {}) },
  };
}

function projectAbility(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput): PublicAbility {
  const fact = input.facts.abilities.find((candidate) => candidate.entityKey === entity.entityKey);
  if (!fact) throw new Error(`Missing ability facts for ${entity.entityKey}.`);
  const usedBy = input.facts.npcs.filter((npc) => npc.abilityPhases.some((phase) => phase.abilities.some((ability) => ability.ability.entityKey === entity.entityKey))).map((npc) => input.resolve({ entityKey: npc.entityKey, label: npc.entityKey }));
  const taughtBy = input.facts.items.filter((item) => item.actionAbilities.some((ability) => ability.ability.entityKey === entity.entityKey)).map((item) => input.resolve({ entityKey: item.entityKey, label: item.entityKey }));
  return { ...baseDocument(entity, ref, input), facts: { ranks: fact.ranks.map((rank) => ({ rankIndex: Math.max(0, rank.rankIndex), lines: rank.lines })) }, usedBy, taughtBy };
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

// Members first, then each tier as the number of equipped members it needs and the stats it
// grants, which is the order the game's own item tooltip shows.
function projectGearSet(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput): PublicGearSet {
  const fact = input.facts.gearSets.find((candidate) => candidate.entityKey === entity.entityKey);
  const members = (fact?.members ?? []).map(input.resolve);
  return {
    ...baseDocument(entity, ref, input),
    facts: { memberCount: members.length }, members,
    tiers: (fact?.tiers ?? []).map((tier) => ({ equipped: Math.max(1, tier.equipped),
      stats: tier.stats.map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })) })),
  };
}

export function projectPublicDocuments(input: DocumentProjectionInput): ReadonlyMap<string, PublicDocument> {
  const indexes = relationIndexes(input.entities, input.relations), conditions = conditionsById(input.relations.conditions);
  const result = new Map<string, PublicDocument>();
  for (const entity of input.entities) {
    const ref = input.refs.get(entity.entityKey);
    if (!ref?.slug) continue;
    let document: PublicDocument;
    switch (ref.kind) {
      case "items": document = projectItem(entity, ref, input, indexes, conditions); break;
      case "npcs": document = projectNpc(entity, ref, input, indexes, npcLocations(entity.entityKey, indexes, input.placements), conditions); break;
      case "quests": document = projectQuest(entity, ref, input, indexes, conditions); break;
      case "places": document = projectPlace(entity, ref, input, indexes); break;
      case "properties": document = projectProperty(entity, ref, input, []); break;
      case "abilities": document = projectAbility(entity, ref, input); break;
      case "recipes": document = projectRecipe(entity, ref, input, indexes); break;
      case "gearSets": document = projectGearSet(entity, ref, input); break;
      default: continue;
    }
    result.set(entity.entityKey, document);
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
