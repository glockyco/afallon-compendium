import { HEROIC_TIER_KEY, type CatalogAvailabilityRule, type CatalogClothDrops, type CatalogCondition, type CatalogEntityRow, type CatalogGatheringNode, type CatalogItemFacts, type CatalogProgressionFact, type CatalogQuestPickup } from "@afallon/contracts/catalog";
import { categoryLabel, type AvailabilityRule, type ClothDrop, type Craft, type DungeonFinderReward, type Enchanting, type EntityRef, type FromItemRow, isEntityRef, type ItemUse, type PublicItem, type QuestPickupRow, type Ref } from "@afallon/contracts/public";
import { isCorruptibleEquipment } from "../corruption-rewards";
import { recipeRank, verifiedRule } from "../crafting";
import { requiredLevel } from "../gathering";
import { chancePercent } from "../levels";
import { placedRules, topicRef } from "../placed-rules";
import { displayName, plainText } from "../text";
import { roundWeaponDamage, weaponDamageLabel } from "../weapon-display";
import { bandWorldLoot, type WorldLootItem, type WorldLootTable } from "../world-loot";
import { itemKind } from "../item-type";
import { lootFields } from "./loot";
import { baseDocument, interactionLabel, type DocumentProjectionInput, endpointOrUnknown, groupPlacementCounts, mergeCounterpartRows, optionalChance, optionalCount, optionalFactRef, projectAvailability, projectRequirementGroups, publishedPlacements, refName, type RelationIndexes, requirementsFor, skillHighestLevel } from "./projection";
import { objectiveForRow } from "./quests";
import { currencyPurchases } from "./currencies";
import { projectItemGearSet } from "./gear-sets";

const refLabel = (ref: Ref) => isEntityRef(ref) ? ref.name : ref.label;
const directGainsByInput = new WeakMap<DocumentProjectionInput, ReadonlyMap<string, string[]>>();
function directGains(input: DocumentProjectionInput): ReadonlyMap<string, string[]> {
  const cached = directGainsByInput.get(input);
  if (cached) return cached;
  const gains = new Map<string, string[]>();
  for (const item of input.facts.items) for (const action of item.gameActions) {
    if (action.type !== "Item" || action.alterAction !== "Gain" || !action.target?.entityKey
      || action.amount <= 0 || action.target.entityKey === item.entityKey) continue;
    const sources = gains.get(action.target.entityKey) ?? [];
    if (!sources.includes(item.entityKey)) sources.push(item.entityKey);
    gains.set(action.target.entityKey, sources);
  }
  directGainsByInput.set(input, gains);
  return gains;
}


const worldLootByInput = new WeakMap<DocumentProjectionInput, { tables: WorldLootTable[]; items: Map<string, WorldLootItem> }>();

/** The global world loot tables and the facts of their items that the supply pack world loot rules read. */
function worldLootInput(input: DocumentProjectionInput): { tables: WorldLootTable[]; items: Map<string, WorldLootItem> } {
  const cached = worldLootByInput.get(input);
  if (cached) return cached;
  const tables = (input.worldLootTables ?? []).map((table) => ({ minimumLevel: table.minimumLevel, maximumLevel: table.maximumLevel,
    hasRequirements: table.hasRequirements, itemKeys: table.entries.map((entry) => entry.itemKey) }));
  const keys = new Set(tables.flatMap((table) => table.itemKeys));
  const items = new Map<string, WorldLootItem>();
  for (const fact of input.facts.items) {
    if (!keys.has(fact.entityKey)) continue;
    const level = fact.equipmentRequirements.flatMap((group) => group.requirements).find((requirement) => requirement.type.name === "Level")?.amounts.primary;
    const statId = (key: string | null) => Number(key?.split(":")[1]);
    items.set(fact.entityKey, {
      key: fact.entityKey, itemType: fact.itemType, weaponType: fact.weaponType === null ? null : categoryLabel(fact.weaponType), armorType: fact.armorType,
      armorSlot: fact.armorSlot, levelRequirement: typeof level === "number" ? level : 0, questOnly: fact.questDropOnly,
      stats: [...fact.stats, ...fact.randomStats].map((row) => statId(row.stat.entityKey)).filter((id) => Number.isInteger(id)),
    });
  }
  const result = { tables, items };
  worldLootByInput.set(input, result);
  return result;
}

const heroicPlacesByInput = new WeakMap<DocumentProjectionInput, HeroicPlaces>();
interface HeroicPlaces {
  /** The name of each scene where the Heroic tier pauses, by scene key. */
  paused: ReadonlyMap<string, string>;
  sceneOf: ReadonlyMap<string, string>;
}

/**
 * The scenes where the Heroic tier pauses, and the scene of each placement. The tier pauses in the places that the
 * verified exclusion rule names and in every timed dungeon, whose timer or corruption pauses it as well. A creature drop
 * becomes Heroic only while the tier is live where the creature dies.
 */
function heroicPlaces(input: DocumentProjectionInput): HeroicPlaces {
  const cached = heroicPlacesByInput.get(input);
  if (cached) return cached;
  const paused = new Map<string, string>();
  for (const link of verifiedRule(input.facts, "heroic-tier-excluded-areas").links) if (link.entityKey) paused.set(link.entityKey, link.label);
  // Every timed dungeon has a published place page, so the reference resolves to its page name, not this label.
  for (const { scene } of input.facts.corruption?.dungeons ?? []) if (scene.entityKey && !paused.has(scene.entityKey)) paused.set(scene.entityKey, scene.label ?? "");
  const result = { paused, sceneOf: new Map(input.relations.placements.map((placement) => [placement.placementId, placement.sceneKey])) };
  heroicPlacesByInput.set(input, result);
  return result;
}

/**
 * What using an item gives: the chests that its visual effects spawn, the loot table bands of a supply pack, and the
 * items that it gains or removes.
 */
function projectItemUse(fact: CatalogItemFacts | undefined, input: DocumentProjectionInput): ItemUse {
  const chests = (fact?.gameActions ?? []).flatMap((action) => action.type === "TriggerVisualEffect" && action.visualEffect
    ? action.visualEffect.prefabs.flatMap((prefab) => prefab.chests.map((chest) => ({
      chance: action.chance, maxDrops: Math.max(0, chest.maxDrops),
      rows: chest.rows.map((row) => {
        const item = input.facts.items.find((candidate) => candidate.entityKey === `items:${row.itemId}`);
        const target = item?.itemType === "CURRENCY" && item.currency ? item.currency : { entityKey: `items:${row.itemId}`, label: "Unknown item" };
        return { item: input.resolve(target), min: Math.max(0, row.min), max: Math.max(0, row.max), chance: row.chance };
      }),
    }))) : []);
  // A class that no race offers is not playable and has no page, so a band keeps only the offered classes, and a band
  // whose class condition names none of them is one that no player can open.
  const offeredClasses = new Set(input.facts.progression.offeredClasses);
  const packs = (fact?.gameActions ?? []).flatMap((action) => {
    if (action.type !== "LootTable" || !action.target?.entityKey) return [];
    const id = Number(action.target.entityKey.split(":")[1]);
    const table = input.facts.itemLootTables?.find((candidate) => candidate.id === id);
    if (!table) return [];
    const checks = (action.requirements ?? []).flatMap((group) => group.checks);
    const minLevel = checks.find((check) => check.type === "Level" && check.comparison === "EqualOrAbove")?.level;
    const maxLevel = checks.find((check) => check.type === "Level" && check.comparison === "EqualOrBelow")?.level;
    const classKeys = checks.filter((check) => check.type === "Class" && check.classId >= 0).map((check) => `classes:${check.classId}`);
    const playable = classKeys.filter((key) => offeredClasses.has(key));
    if (classKeys.length > 0 && playable.length === 0) return [];
    const classes = playable.map((entityKey) => input.resolve({ entityKey, label: "Unknown class" }));
    // World loot depends on the class's weapon types, so each class of the band has its own list.
    const world = worldLootInput(input);
    const worldLoot = table.worldLootShare > 0 && world.tables.length > 0 ? (playable.length ? playable : [...offeredClasses].sort()).flatMap((classKey) => {
      const ref = input.resolve({ entityKey: classKey, label: "Unknown class" });
      if (!isEntityRef(ref)) return [];
      const weapons = new Set((input.classWeapons?.get(classKey) ?? []).map((weapon) => weapon.toUpperCase()));
      const rows = bandWorldLoot({ minLevel: minLevel ?? 1, maxLevel, armorType: table.worldLootArmorType?.name ?? null, stats: table.worldLootStats ?? [] }, world.tables, world.items, weapons)
        .map((row) => ({ item: input.resolve({ entityKey: row.key, label: row.key }), levels: row.levels }))
        .sort((left, right) => left.levels[0]!.min - right.levels[0]!.min || refLabel(left.item).localeCompare(refLabel(right.item)));
      return [{ class: ref, items: rows }];
    }) : [];
    return [{ classes,
      ...(minLevel === undefined ? {} : { minLevel }), ...(maxLevel === undefined ? {} : { maxLevel }),
      entries: table.entries.map((entry) => ({ item: input.resolve(entry.item), min: Math.max(0, entry.min), max: Math.max(0, entry.max) })),
      bonusChance: table.bonusDropChance, worldShare: table.worldLootShare,
      minimumPicks: table.hasMinimumDrops ? Math.max(1, table.minDroppedItems) : 1,
      ...(table.limitDroppedItems && table.maxDroppedItems > 0 ? { maximumPicks: table.maxDroppedItems } : {}),
      ...(table.worldLootArmorType?.name ? { armorType: plainText(table.worldLootArmorType.name) } : {}),
      stats: (table.worldLootStats ?? []).map((stat) => input.resolve({ entityKey: `stats:${stat}`, label: `Stat ${stat}` })),
      worldLoot,
    }];
  });
  const itemChanges = (fact?.gameActions ?? []).flatMap<ItemUse["itemChanges"][number]>((action) => {
    const mode = action.alterAction;
    return action.type === "Item" && (mode === "Gain" || mode === "Remove") && action.target
      ? [{ action: mode, item: input.resolve(action.target), count: Math.max(0, action.amount) }] : [];
  });
  return { chests, packs, itemChanges };
}

/**
 * The From items rows of each item: the supply pack bands and the use chests of published items that give it. The rows
 * come from the same projection as the When used section of the source item, so both pages agree.
 */
export function fromItemsByItem(input: DocumentProjectionInput): ReadonlyMap<string, FromItemRow[]> {
  const result = new Map<string, FromItemRow[]>();
  const add = (item: Ref, row: FromItemRow) => {
    if (!isEntityRef(item) || item.kind !== "items") return;
    const rows = result.get(item.key) ?? [];
    rows.push(row);
    result.set(item.key, rows);
  };
  for (const fact of input.facts.items) {
    if (!fact.gameActions.some((action) => action.type === "LootTable" || action.type === "TriggerVisualEffect")) continue;
    const source = input.resolve({ entityKey: fact.entityKey, label: fact.entityKey });
    if (!isEntityRef(source) || !source.slug) continue;
    const use = projectItemUse(fact, input);
    for (const pack of use.packs) for (const entry of pack.entries) add(entry.item, {
      kind: "pack", source, classes: pack.classes,
      ...(pack.minLevel === undefined ? {} : { minLevel: pack.minLevel }), ...(pack.maxLevel === undefined ? {} : { maxLevel: pack.maxLevel }),
      min: entry.min, max: entry.max,
    });
    for (const chest of use.chests) for (const row of chest.rows) add(row.item, { kind: "chest", source, min: row.min, max: row.max, chance: row.chance });
  }
  return result;
}

// A cloth tier's weight at a creature level, as ClothDrops.Roll computes it: the teaser weight below the start level,
// then an even move from the low weight at the start level to the high weight at the ramp end.
function clothWeight(tier: CatalogClothDrops["tiers"][number], level: number): number {
  if (level < tier.startLevel) return tier.teaserWeight;
  const progress = Math.min(1, Math.max(0, (level - tier.startLevel) / Math.max(tier.rampEnd - tier.startLevel, 1)));
  return tier.lowWeight + (tier.highWeight - tier.lowWeight) * progress;
}

/**
 * The cloth drops that give this item, with the chance per kill over each range of creature levels between two levels
 * where a tier's weight starts or stops a change. Inside a range every weight is linear in the level, so the chance moves
 * one way from its first to its last level. No weight changes from the last such level on, so the last range is open.
 */
function projectClothDrop(itemKey: string, input: DocumentProjectionInput): ClothDrop | undefined {
  const cloth = input.facts.clothDrops;
  if (!cloth?.tiers.some((tier) => tier.item.entityKey === itemKey)) return undefined;
  const chanceAt = (level: number) => {
    let total = 0, own = 0;
    for (const tier of cloth.tiers) {
      const weight = clothWeight(tier, level);
      total += weight;
      if (tier.item.entityKey === itemKey) own += weight;
    }
    return total > 0 ? Math.round(cloth.dropChance * own / total * 10) / 10 : 0;
  };
  const starts = [...new Set([1, ...cloth.tiers.flatMap((tier) => [Math.ceil(tier.startLevel), Math.ceil(tier.rampEnd)])])].filter((level) => level >= 1).sort((a, b) => a - b);
  const levels = starts.map((minLevel, index): ClothDrop["levels"][number] => {
    const next = starts[index + 1], startChance = chanceAt(minLevel);
    if (next === undefined) return { minLevel, startChance };
    const maxLevel = next - 1, endChance = chanceAt(maxLevel);
    return { minLevel, maxLevel, startChance, ...(endChance === startChance ? {} : { endChance }) };
  });
  return { creatureTypes: cloth.creatureTypes.map((type) => plainText(type)), chance: cloth.dropChance, min: cloth.minCount, max: cloth.maxCount, levels };
}

/** The quest pickups that give this item: one row per creature and quest, and one row per group of placed pickups with equal facts. */
function projectQuestPickups(itemKey: string, input: DocumentProjectionInput): QuestPickupRow[] {
  const rows = (input.facts.questPickups ?? []).filter((row) => row.item.entityKey === itemKey);
  const quest = (row: CatalogQuestPickup) => row.quest === null ? {} : { quest: input.resolve(row.quest) };
  const creatures = new Map<string, QuestPickupRow>();
  for (const row of rows) {
    if (row.origin.kind !== "creature") continue;
    const projected: QuestPickupRow = { kind: "creature", counterpart: input.resolve(row.origin.npc), ...quest(row), amount: row.amount };
    creatures.set(JSON.stringify(projected), projected);
  }
  const placed = groupPlacementCounts(rows.flatMap((row) => row.origin.kind === "placed"
    ? [{ kind: "placed" as const, ...quest(row), amount: row.amount, singleUse: row.singleUse, placements: publishedPlacements(row.origin.placementId === null ? [] : [row.origin.placementId], input.placements) }]
    : []));
  return [...creatures.values(), ...placed];
}

/** The finder dungeons, when this item is the supply pack that a successful Random Dungeon Finder run gives. */
function projectDungeonFinder(itemKey: string, input: DocumentProjectionInput): DungeonFinderReward | undefined {
  const finder = input.facts.dungeonFinder;
  if (!finder || finder.supplyPack?.entityKey !== itemKey) return undefined;
  return { dungeons: finder.dungeons.map((dungeon) => input.resolve(dungeon)).filter(isEntityRef) };
}

// The chance that the object's action that gives the loot runs, when its own action and its game action roll below 100.
function actionChance(row: { actionChance?: number; gameActionChance?: number }): { actionChance?: number } {
  const chance = (row.actionChance ?? 100) * (row.gameActionChance ?? 100) / 100;
  return chance < 100 ? { actionChance: Math.round(chance * 10) / 10 } : {};
}

/** The captured enchantment key, not the item's name, joins differently named pairs. */
function projectEnchanting(key: string | null | undefined, input: DocumentProjectionInput): Enchanting | undefined {
  if (!key) return undefined;
  const fact = input.facts.progression.facts.find((row) => row.entityKey === key);
  if (fact?.kind !== "enchantments" || !fact.details.tiers.length || !fact.details.appliesTo.length) return undefined;
  const fits = fact.details.appliesTo.map((requirement) => {
    const field = requirement.type.name;
    const value = field === "ItemType" ? requirement.itemType : field === "ItemRarity" ? requirement.itemRarity
      : field === "WeaponType" ? requirement.weaponType : field === "ArmorType" ? requirement.armorType
      : field === "ArmorSlot" ? requirement.armorSlot : field === "WeaponSlot" ? requirement.weaponSlot : null;
    if (!value) throw new Error(`Unknown enchanting gear requirement ${field} for ${key}.`);
    return categoryLabel(value);
  });
  return { fits, tiers: fact.details.tiers.map((tier) => ({
    tier: tier.tier, successRate: tier.successRate, seconds: tier.enchantTime,
    stats: tier.stats.map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })),
    currencyCosts: tier.currencyCosts.map((row) => ({ amount: row.amount, currency: input.resolve(row.currency) })),
    itemCosts: tier.itemCosts.map((row) => ({ item: input.resolve(row.item), count: row.count })),
  })) };
}

const effectFactsByInput = new WeakMap<DocumentProjectionInput, Map<string, CatalogProgressionFact>>();
/** Item effects follow the same direct actions and progression appliers as an effect page's Applied by rows. */
export function projectItemEffects(fact: CatalogItemFacts | undefined, enchanting: Enchanting | undefined, input: DocumentProjectionInput): PublicItem["appliesEffects"] {
  if (!fact) return [];
  const abilities = new Map<string, Set<number | null>>();
  for (const action of fact.actionAbilities) if (action.ability.entityKey) {
    const ranks = abilities.get(action.ability.entityKey) ?? new Set<number | null>();
    ranks.add(action.rankIndex);
    abilities.set(action.ability.entityKey, ranks);
  }
  for (const action of fact.gameActions) if (action.type === "Ability" && action.target?.entityKey) {
    const ranks = abilities.get(action.target.entityKey) ?? new Set<number | null>();
    ranks.add(null);
    abilities.set(action.target.entityKey, ranks);
  }
  const statKeys = new Set([...fact.stats, ...fact.randomStats, ...(fact.gem?.stats ?? [])].map((row) => row.stat.entityKey));
  const enchantStatKeys = new Set(enchanting?.tiers.flatMap((tier) => tier.stats.map((row) => row.stat.key)) ?? []);
  let effects = effectFactsByInput.get(input);
  if (!effects) {
    effects = new Map(input.facts.progression.facts.filter((row) => row.kind === "effects").map((row) => [row.entityKey, row]));
    effectFactsByInput.set(input, effects);
  }
  const rows: PublicItem["appliesEffects"] = [];
  const seen = new Set<string>();
  const add = (key: string, trigger: PublicItem["appliesEffects"][number]["trigger"], chance: number) => {
    const effectFact = effects.get(key);
    if (effectFact?.kind !== "effects") return;
    const identity = `${key}:${trigger}:${chance}`;
    if (seen.has(identity)) return;
    seen.add(identity);
    rows.push({ effect: input.resolve({ entityKey: key, label: effectFact.name ?? key }), trigger,
      ...(chance < 100 ? { chance } : {}), ...(!effectFact.details.endless && effectFact.details.duration > 0 ? { durationSeconds: effectFact.details.duration } : {}) });
  };
  for (const action of fact.gameActions) if (action.type === "Effect" && action.target?.entityKey) add(action.target.entityKey, "Use", action.chance);
  for (const applier of input.facts.progression.appliers) {
    const source = applier.source.entityKey;
    if (source && applier.via === "statOnHit" && statKeys.has(source)) add(applier.effect, "On hit", applier.chance);
    if (source && applier.via === "statOnHit" && enchantStatKeys.has(source)) add(applier.effect, "After enchanting, on hit", applier.chance);
    const ranks = source ? abilities.get(source) : undefined;
    if ((applier.via === "ability" || applier.via === "casterAbility") && ranks
      && (ranks.has(null) || applier.rank === null || ranks.has(applier.rank))) add(applier.effect, "Use", applier.chance);
  }
  return rows;
}

export function projectItem(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>, startingGear: ReadonlyMap<string, readonly EntityRef[]>, fromItems: ReadonlyMap<string, readonly FromItemRow[]>): PublicItem {
  const fact = input.facts.items.find((candidate) => candidate.entityKey === entity.entityKey);
  const clothDrop = projectClothDrop(entity.entityKey, input);
  const dungeonFinder = projectDungeonFinder(entity.entityKey, input);
  const questPickups = projectQuestPickups(entity.entityKey, input);
  const directAbilities = fact?.actionAbilities ?? [];
  const directlyReferenced = new Set(directAbilities.map((row) => row.ability.entityKey));
  const gameAbilities = (fact?.gameActions ?? []).filter((action) => action.type === "Ability" && action.target?.entityKey && !directlyReferenced.has(action.target.entityKey));
  const enchantment = optionalFactRef(input.resolve, fact?.enchantment);
  const enchanting = projectEnchanting(fact?.enchantment?.entityKey, input);
  const sellCurrency = optionalFactRef(input.resolve, fact?.sellCurrency), buyCurrency = optionalFactRef(input.resolve, fact?.buyCurrency);
  const currency = optionalFactRef(input.resolve, fact?.currency);
  const gearSet = fact?.gearSet?.entityKey ? projectItemGearSet(fact.gearSet.entityKey, input) : undefined;
  const droppedBy = mergeCounterpartRows((indexes.dropsByItem.get(entity.entityKey) ?? []).map((row) => ({
    counterpart: input.resolve(row.owner), ...lootFields(row, conditions, input),
  })), input);
  const soldBy = mergeCounterpartRows((indexes.vendorsByItem.get(entity.entityKey) ?? []).map((row) => ({
    counterpart: input.resolve(row.npc), price: { amount: Math.max(0, row.cost), currency: endpointOrUnknown(input.resolve, row.currency, "Unknown currency") },
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  })), input);
  const buys = currency && fact?.currency?.entityKey ? currencyPurchases(fact.currency.entityKey, currency, indexes, input) : [];
  // A yield of a gathering node links the node. A row of an object that a scene places belongs to the node of that
  // object, so it reads as gathered, not collected.
  const itemInteractions = indexes.interactionsByItem.get(entity.entityKey) ?? [];
  const nodeRow = (node: CatalogGatheringNode, row: { min: number | null; max: number | null; rawRate: number | null; conditionIds?: readonly string[]; availability?: readonly CatalogAvailabilityRule[]; placementIds: readonly string[] }) => ({
    counterpart: input.resolve({ entityKey: node.entityKey, label: node.name }), label: displayName(node.name),
    ...(node.skill?.entityKey ? { skill: input.resolve(node.skill) } : {}),
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }), ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }),
    ...(optionalChance(row.rawRate) === undefined ? {} : { chance: optionalChance(row.rawRate) }), requirements: requirementsFor(row.conditionIds ?? [], conditions, input.resolve),
    availability: projectAvailability(row.availability ?? [], conditions, input.resolve), placements: publishedPlacements(row.placementIds, input.placements),
  });
  const gatheredFrom = groupPlacementCounts([
    ...(indexes.gathersByItem.get(entity.entityKey) ?? []).map((row) => {
      const node = row.gatheringNode?.entityKey ? indexes.nodes.get(row.gatheringNode.entityKey) : undefined;
      if (node) return nodeRow(node, row);
      return {
        ...(row.resource === null ? {} : { counterpart: input.resolve(row.resource) }), label: displayName(row.producerLabel) || "Resource",
        ...(row.skill === null ? {} : { skill: input.resolve(row.skill) }), ...(optionalCount(row.rank) === undefined ? {} : { rank: optionalCount(row.rank) }),
        ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }), ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }),
        ...(optionalChance(row.rawRate) === undefined ? {} : { chance: optionalChance(row.rawRate) }), requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
        availability: [], placements: publishedPlacements(row.placementIds, input.placements),
      };
    }),
    ...itemInteractions.flatMap((row) => { const node = indexes.nodes.get(indexes.placedNodes.get(row.sourceId) ?? ""); return node ? [nodeRow(node, row)] : []; }),
  ]);
  const sourceAvailabilities: AvailabilityRule[][] = [];
  const sourceIndexes = new Map<string, number>();
  const withAvailabilityIndex = <T extends { availability: AvailabilityRule[] }>(row: T) => {
    const { availability, ...facts } = row;
    const key = JSON.stringify(availability);
    let index = sourceIndexes.get(key);
    if (index === undefined) {
      index = sourceAvailabilities.length;
      sourceIndexes.set(key, index);
      sourceAvailabilities.push(availability);
    }
    return { ...facts, availabilityIndex: index };
  };
  const inContainers = groupPlacementCounts((indexes.containersByItem.get(entity.entityKey) ?? []).map((row) => ({
    ...(row.place === null ? {} : { counterpart: input.resolve(row.place) }), label: displayName(row.containerType ?? "") || "Container",
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }),
    ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }), ...(optionalChance(row.rawRate) === undefined ? {} : { chance: optionalChance(row.rawRate) }),
    availability: projectAvailability(row.availability, conditions, input.resolve),
    placements: publishedPlacements(row.placementIds, input.placements),
  }))).map(withAvailabilityIndex);
  const collectedFrom = groupPlacementCounts(itemInteractions.filter((row) => !indexes.placedNodes.has(row.sourceId)).map((row) => ({
    ...(row.place === null ? {} : { counterpart: input.resolve(row.place) }),
    label: interactionLabel(row.objectName),
    ...(optionalCount(row.min) === undefined ? {} : { min: optionalCount(row.min) }),
    ...(optionalCount(row.max) === undefined ? {} : { max: optionalCount(row.max) }), ...(optionalChance(row.rawRate) === undefined ? {} : { chance: optionalChance(row.rawRate) }),
    ...(row.prefabChoices !== undefined && row.prefabChoices > 1 ? { prefabChoices: row.prefabChoices } : {}),
    ...(row.choiceLabel ? { choiceLabel: displayName(row.choiceLabel) } : {}),
    ...(row.cost ? { cost: { currency: input.resolve(row.cost.currency), amount: row.cost.amount } } : {}),
    ...(row.pickOne !== undefined && row.pickOne > 1 ? { pickOne: row.pickOne } : {}),
    ...actionChance(row),
    availability: projectAvailability(row.availability, conditions, input.resolve),
    placements: publishedPlacements(row.placementIds, input.placements),
  }))).map(withAvailabilityIndex);
  const questRows = indexes.questsByCounterpart.get(entity.entityKey) ?? [];
  const recipeRows = indexes.recipesByItem.get(entity.entityKey) ?? [];
  const taughtRecipe = indexes.teachings.get(entity.entityKey);
  const productRecipe = recipeRows.find((row) => row.role === "product");
  const crafting = productRecipe?.recipe.entityKey ? projectCraft(productRecipe.recipe.entityKey, input, indexes) : undefined;
  const teaches = taughtRecipe === undefined ? undefined : projectCraft(taughtRecipe, input, indexes);
  // Native item records carry authored defaults for both equipment branches; only the active branch is public evidence.
  const isWeapon = fact?.itemType === "WEAPON";
  // Only creature-drop generation marks new equipment Heroic, and only while the tier is live where the creature dies.
  // Quest rewards, crafting, and chests take other paths. World loot and a creature without a recorded place could drop
  // the item anywhere, so they keep the preview. Gear that only creatures in places where the tier pauses drop never
  // becomes Heroic, and its page names those places.
  const heroicSettings = input.facts.progression.facts.find((row) => row.entityKey === HEROIC_TIER_KEY);
  const heroicGear = fact?.itemType === "ARMOR" || fact?.itemType === "WEAPON" || (fact?.itemType === "Trinket" && fact.armorSlot === "Trinket");
  let liveDrop = false;
  const pausedScenes = new Map<string, string>();
  if (heroicGear && heroicSettings?.kind === "heroicTier") {
    const places = heroicPlaces(input);
    for (const row of indexes.dropsByItem.get(entity.entityKey) ?? []) {
      const scenes = row.context === "world" || row.owner.entityKey === null ? [] : [...new Set(row.placementIds.flatMap((id) => places.sceneOf.get(id) ?? []))];
      if (scenes.length === 0 || scenes.some((scene) => !places.paused.has(scene))) liveDrop = true;
      else for (const scene of scenes) pausedScenes.set(scene, places.paused.get(scene)!);
    }
  }
  const heroic = liveDrop && heroicSettings?.kind === "heroicTier"
    ? { statBonusPercent: heroicSettings.details.heroicGearStatBonusPercent } : undefined;
  const heroicPausedIn = !liveDrop && pausedScenes.size > 0
    ? [...pausedScenes].map(([entityKey, label]) => input.resolve({ entityKey, label })).sort((left, right) => refLabel(left).localeCompare(refLabel(right), "en"))
    : undefined;
  const settings = input.facts.corruption;
  const dungeonRewards = input.corruptionRewards?.byItem.get(entity.entityKey);
  const corruption = dungeonRewards?.some((reward) => !reward.guaranteed) && isCorruptibleEquipment(fact)
    && settings?.maxLevel != null && settings.maxLevel > 0
    && settings.gearAllStatsPercentPerLevel != null && settings.gearStatBonuses != null
    ? { maxLevel: settings.maxLevel, allStatsPercentPerLevel: settings.gearAllStatsPercentPerLevel,
      statBonuses: settings.gearStatBonuses.map((row) => ({ stat: input.resolve(row.stat),
        amountPerLevel: row.amountPerLevel, isPercent: row.isPercent })) } : undefined;
  const tokenInfo = fact?.corruptionToken && settings?.token?.entityKey === entity.entityKey
    && (settings.mobStatBonuses !== null || settings.affixesPerToken !== null)
    ? { ...(settings.mobStatBonuses === null ? {} : { mobStatBonuses: settings.mobStatBonuses.map((row) => ({
      stat: input.resolve(row.stat), amountPerLevel: row.amountPerLevel, isPercent: row.isPercent })) }),
      ...(settings.affixesPerToken === null ? {} : { affixesPerToken: settings.affixesPerToken }) } : undefined;
  const itemPower = fact?.stats.find((row) => row.stat.entityKey === "stats:53")?.amount;
  const damagePerSecond = isWeapon && fact?.minDamage !== null && fact?.minDamage !== undefined
    && fact.maxDamage !== null && fact.maxDamage !== undefined && fact.attackSpeed !== null && fact.attackSpeed !== undefined && fact.attackSpeed > 0
    ? (roundWeaponDamage(fact.minDamage) + roundWeaponDamage(fact.maxDamage)) / 2 / fact.attackSpeed : undefined;
  const level = fact?.equipmentRequirements.flatMap((group) => group.requirements).find((requirement) => requirement.type.name === "Level")?.amounts.primary;
  const levelRequirement = level !== undefined && Number.isInteger(level) && level > 0 ? level : undefined;
  const damageLabel = isWeapon && fact ? weaponDamageLabel(fact) : undefined;
  const adventurers = (input.facts.adventurerItems ?? []).filter((row) => row.itemKey === entity.entityKey).flatMap<PublicItem["adventurers"][number]>((row) => {
    if (row.kind === "kitUpgradeItem") return row.adventurer ? [{ kind: row.kind, adventurer: input.resolve(row.adventurer) }] : [];
    if (row.kind === "equipmentBand") return row.minimumContentLevel !== null ? [{ kind: row.kind, minimumContentLevel: row.minimumContentLevel }] : [];
    return row.rewardChance !== null ? [{ kind: row.kind, chance: chancePercent(row.rewardChance) }] : [];
  });
  const startingGearOfAdventurers = (input.adventurerStartingItems?.get(entity.entityKey) ?? [])
    .map((key) => input.resolve({ entityKey: key, label: key }));
  const gainedFromItems = (directGains(input).get(entity.entityKey) ?? [])
    .map((key) => input.resolve({ entityKey: key, label: key }));
  const lootTables = (input.facts.itemLootTables ?? []).filter((table) => table.entries.some((entry) => entry.item.entityKey === entity.entityKey))
    .flatMap((table) => {
      const bindings = input.lootBindings?.filter((binding) => binding.tableId === table.id) ?? [];
      if (!bindings.length) return [{ name: plainText(table.name) }];
      return bindings.map((binding) => ({
        name: plainText(table.name), ...(binding.sourceKey ? { source: input.resolve({ entityKey: binding.sourceKey, label: binding.sourceKey }) } : {}),
        ...(binding.world ? { world: true } : {}),
      }));
    });
  return {
    ...baseDocument(entity, ref, input),
    facts: {
      ...(fact?.rarity ? { rarity: plainText(fact.rarity) } : {}), ...itemKind(fact),
      ...(isWeapon && fact?.attackSpeed !== null && fact?.attackSpeed !== undefined ? { attackSpeed: fact.attackSpeed } : {}),
      ...(isWeapon && optionalCount(fact?.minDamage ?? null) !== undefined ? { minDamage: optionalCount(fact?.minDamage ?? null) } : {}),
      ...(isWeapon && optionalCount(fact?.maxDamage ?? null) !== undefined ? { maxDamage: optionalCount(fact?.maxDamage ?? null) } : {}),
      ...(damageLabel === undefined ? {} : { weaponDamageLabel: damageLabel }),
      ...(itemPower === undefined ? {} : { itemPower }), ...(damagePerSecond === undefined ? {} : { damagePerSecond }),
      ...(corruption === undefined ? {} : { corruption }), ...(dungeonRewards?.length ? { dungeonRewards } : {}),
      ...(heroic ? { heroic } : {}), ...(heroicPausedIn ? { heroicPausedIn } : {}),
      ...(tokenInfo === undefined ? {} : { tokenInfo }),
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
      ...(enchanting ? { enchanting } : {}),
      ...(fact?.sellPrice !== null && fact?.sellPrice !== undefined && fact.sellPrice >= 0 && sellCurrency ? { sellPrice: { amount: fact.sellPrice, currency: sellCurrency } } : {}),
      ...(fact?.buyPrice !== null && fact?.buyPrice !== undefined && fact.buyPrice >= 0 && buyCurrency ? { buyPrice: { amount: fact.buyPrice, currency: buyCurrency } } : {}),
      ...(currency === undefined ? {} : { currency }),
      stackLimit: Math.max(0, fact?.stackLimit ?? 0), questDropOnly: fact?.questDropOnly ?? false, corruptionToken: fact?.corruptionToken ?? false,
      actionAbilities: [
        ...directAbilities.map((ability) => ({ ability: input.resolve(ability.ability), rankIndex: Math.max(0, ability.rankIndex) })),
        ...gameAbilities.map((action) => ({ ability: input.resolve(action.target!) })),
      ],
      useLines: fact?.useLines ?? [], equipmentRequirements: projectRequirementGroups(fact?.equipmentRequirements ?? [], input.resolve),
      ...(levelRequirement === undefined ? {} : { levelRequirement }), useConditions: projectRequirementGroups(fact?.useConditions ?? [], input.resolve),
      ...(gearSet === undefined ? {} : { gearSet }),
    },
    ...(crafting ? { crafting } : {}), ...(teaches ? { teaches } : {}),
    sourceSpotCount: new Set([...gatheredFrom, ...inContainers, ...collectedFrom, ...questPickups.flatMap((row) => row.kind === "placed" ? [row] : [])].flatMap((row) => row.places.flatMap((place) => place.placementIds))).size,
    droppedBy, soldBy, buys, gatheredFrom, sourceAvailabilities, inContainers, collectedFrom,
    rewardedBy: questRows.filter((row) => row.kind === "reward" || row.kind === "rewardChoice").map((row) => ({ counterpart: input.resolve(row.quest), count: Math.max(0, row.count ?? 1), choice: row.kind === "rewardChoice" })),
    givenBy: questRows.filter((row) => row.kind === "itemGiven").map((row) => ({ counterpart: input.resolve(row.quest), count: Math.max(0, row.count ?? 1) })),
    placedRules: placedRules(input.facts, "items", { entityKey: entity.entityKey }, input.resolve)
      .filter((rule) => rule.target !== "crafting" || crafting !== undefined)
      .filter((rule) => rule.target !== "teaches" || teaches !== undefined)
      .filter((rule) => rule.target !== "adventurers" || adventurers.length > 0)
      .concat(enchanting ? [{ target: "enchants", guide: topicRef("crafting-and-gathering"), section: "enchanting" }] : [])
      .concat(heroic ? [{ target: "heroic-gear", guide: topicRef("heroic-tier"), section: "heroic-gear" }]
        : heroicPausedIn ? [{ target: "heroic-gear", guide: topicRef("heroic-tier"), section: "entering" }] : [])
      .concat(corruption ? [{ target: "corruption", guide: topicRef("corruption"), section: "gear" }] : [])
      .concat(tokenInfo ? [{ target: "corruption-token", guide: topicRef("corruption"), section: "tokens" }] : [])
      .concat(dungeonRewards?.length ? [{ target: "dungeon-rewards", guide: topicRef("corruption"), section: "timed-dungeons" }] : []),
    usedInRecipes: recipeRows.filter((row) => row.role === "material").map((row) => {
      const recipeKey = row.recipe.entityKey;
      const craft = recipeKey === null ? undefined : projectCraft(recipeKey, input, indexes);
      const product = (recipeKey === null ? [] : indexes.recipesByRecipe.get(recipeKey) ?? []).find((candidate) =>
        candidate.role === "product" && candidate.rank === row.rank);
      return {
        counterpart: input.resolve(row.recipe), count: Math.max(0, row.count),
        ...(product ? { product: { counterpart: input.resolve(product.item), count: Math.max(0, product.count) } } : {}),
        ...(craft?.skill ? { skill: craft.skill } : {}),
        ...(craft?.ranks[0] ? { requiredLevel: craft.ranks[0].requiredLevel } : {}),
      };
    }),
    usedInQuests: questRows.filter((row) => row.kind === "objective" && row.task !== null).map((row) => ({ counterpart: input.resolve(row.quest), objective: objectiveForRow(row, input, indexes, conditions) })),
    startingGearOf: (startingGear.get(entity.entityKey) ?? []).map((classRef) => ({ class: classRef })),
    startingGearOfAdventurers, gainedFromItems, lootTables,
    fromItems: [...fromItems.get(entity.entityKey) ?? []],
    ...(clothDrop ? { clothDrop } : {}),
    questPickups,
    ...(dungeonFinder ? { dungeonFinder } : {}),
    adventurers,
    whenUsed: projectItemUse(fact, input), appliesEffects: projectItemEffects(fact, enchanting, input),
  };
}

export function projectCraft(recipeKey: string, input: DocumentProjectionInput, indexes: RelationIndexes): Craft | undefined {
  if (input.excluded?.has(recipeKey)) return undefined;
  const fact = indexes.recipes.get(recipeKey);
  if (!fact) return undefined;
  const rows = indexes.recipesByRecipe.get(recipeKey) ?? [];
  const product = rows.find((row) => row.role === "product");
  const recipe = input.resolve({ entityKey: recipeKey, label: recipeKey });
  const station = optionalFactRef(input.resolve, fact.station), skill = optionalFactRef(input.resolve, fact.skill);
  // A skill with no published level cannot supply a verified gate or experience band.
  const highest = fact.skill?.entityKey && skill && isEntityRef(skill) && skill.slug ? skillHighestLevel(input.facts, fact.skill.entityKey) : undefined;
  const ranks = highest === undefined || indexes.crafting === null ? [] : fact.ranks.map((rank) => recipeRank(rank, highest, indexes.crafting!));
  const taughtBy = (indexes.teachersByRecipe.get(recipeKey) ?? []).map((item) => input.resolve({ entityKey: item, label: item }))
    .filter((ref): ref is EntityRef => isEntityRef(ref) && !!ref.slug).sort((left, right) => left.name.localeCompare(right.name));
  return {
    recipe: { key: recipeKey, name: refName(recipe) },
    ...(product ? { product: { counterpart: input.resolve(product.item), count: Math.max(0, product.count) } } : {}),
    ...(station ? { station } : {}), ...(skill ? { skill } : {}),
    learnedByDefault: fact.learnedByDefault,
    materials: rows.filter((row) => row.role === "material").map((row) => ({ counterpart: input.resolve(row.item), count: Math.max(0, row.count) })),
    ranks, taughtBy,
  };
}
