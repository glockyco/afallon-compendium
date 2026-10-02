import type { CatalogAvailabilityRule, CatalogClothDrops, CatalogCondition, CatalogEntityRow, CatalogGatheringNode, CatalogItemFacts, CatalogQuestPickup } from "@afallon/contracts/catalog";
import { type AvailabilityRule, type ClothDrop, type Craft, type DungeonFinderReward, type EntityRef, type FromItemRow, type GearSet, isEntityRef, type ItemUse, type PublicItem, type QuestPickupRow, type Ref } from "@afallon/contracts/public";
import { isCorruptibleEquipment } from "../corruption-rewards";
import { recipeRank } from "../crafting";
import { requiredLevel } from "../gathering";
import { chancePercent } from "../levels";
import { placedRules, topicRef } from "../placed-rules";
import { displayName, plainText } from "../text";
import { roundWeaponDamage, weaponDamageLabel } from "../weapon-display";
import { lootFields } from "./loot";
import { baseDocument, type DocumentProjectionInput, endpointOrUnknown, groupPlacementCounts, mergeCounterpartRows, optionalChance, optionalCount, optionalFactRef, projectAvailability, projectRequirementGroups, publishedPlacements, refName, type RelationIndexes, requirementsFor, skillHighestLevel } from "./projection";
import { objectiveForRow } from "./quests";

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
    return [{ classes,
      ...(minLevel === undefined ? {} : { minLevel }), ...(maxLevel === undefined ? {} : { maxLevel }),
      entries: table.entries.map((entry) => ({ item: input.resolve(entry.item), min: Math.max(0, entry.min), max: Math.max(0, entry.max) })),
      bonusChance: table.bonusDropChance, worldShare: table.worldLootShare,
      minimumPicks: table.hasMinimumDrops ? Math.max(1, table.minDroppedItems) : 1,
      ...(table.limitDroppedItems && table.maxDroppedItems > 0 ? { maximumPicks: table.maxDroppedItems } : {}),
      ...(table.worldLootArmorType?.name ? { armorType: plainText(table.worldLootArmorType.name) } : {}),
      stats: (table.worldLootStats ?? []).map((stat) => input.resolve({ entityKey: `stats:${stat}`, label: `Stat ${stat}` })),
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

export function projectItem(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>, startingGear: ReadonlyMap<string, readonly EntityRef[]>, fromItems: ReadonlyMap<string, readonly FromItemRow[]>): PublicItem {
  const fact = input.facts.items.find((candidate) => candidate.entityKey === entity.entityKey);
  const clothDrop = projectClothDrop(entity.entityKey, input);
  const dungeonFinder = projectDungeonFinder(entity.entityKey, input);
  const questPickups = projectQuestPickups(entity.entityKey, input);
  const directAbilities = fact?.actionAbilities ?? [];
  const directlyReferenced = new Set(directAbilities.map((row) => row.ability.entityKey));
  const gameAbilities = (fact?.gameActions ?? []).filter((action) => action.type === "Ability" && action.target?.entityKey && !directlyReferenced.has(action.target.entityKey));
  const enchantment = optionalFactRef(input.resolve, fact?.enchantment);
  const sellCurrency = optionalFactRef(input.resolve, fact?.sellCurrency), buyCurrency = optionalFactRef(input.resolve, fact?.buyCurrency);
  const currency = optionalFactRef(input.resolve, fact?.currency);
  const gearSet = fact?.gearSet?.entityKey ? projectGearSet(fact.gearSet.entityKey, input) : undefined;
  const droppedBy = mergeCounterpartRows((indexes.dropsByItem.get(entity.entityKey) ?? []).map((row) => ({
    counterpart: input.resolve(row.owner), ...lootFields(row, conditions, input),
  })), input);
  const soldBy = mergeCounterpartRows((indexes.vendorsByItem.get(entity.entityKey) ?? []).map((row) => ({
    counterpart: input.resolve(row.npc), price: { amount: Math.max(0, row.cost), currency: endpointOrUnknown(input.resolve, row.currency, "Unknown currency") },
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  })), input);
  const refName = (value: Ref) => isEntityRef(value) ? value.name : value.label;
  const offers = new Map<string, { item: Ref; price: { amount: number; currency: NonNullable<typeof currency> }; sellers: Map<string, Ref> }>();
  if (currency && fact?.currency?.entityKey) for (const row of indexes.vendorsByCurrency.get(fact.currency.entityKey) ?? []) {
    const item = input.resolve(row.item), seller = input.resolve(row.npc);
    const itemKey = row.item.entityKey ?? row.item.label, sellerKey = row.npc.entityKey ?? row.npc.label;
    const amount = Math.max(0, row.cost), key = `${itemKey}:${amount}`;
    const offer = offers.get(key) ?? { item: isEntityRef(item) ? item : { ...item, label: displayName(item.label) }, price: { amount, currency }, sellers: new Map() };
    offer.sellers.set(sellerKey, isEntityRef(seller) ? seller : { ...seller, label: displayName(seller.label) });
    offers.set(key, offer);
  }
  const buys = [...offers.values()].map(({ item, price, sellers }) => ({
    item, price, soldBy: [...sellers.values()].sort((a, b) => refName(a).localeCompare(refName(b))),
  })).sort((a, b) => refName(a.item).localeCompare(refName(b.item)) || a.price.amount - b.price.amount);
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
    // The "For sale 2500 gold" signs are not property signs: a use costs Gold Coin and rolls a loot table.
    label: /^For sale \d+ gold$/i.test(row.objectName ?? "") ? "For Sale Sign" : displayName(row.objectName ?? "") || "Object",
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
  const isArmor = fact?.itemType === "ARMOR" || (fact?.itemType === "Trinket" && fact.armorSlot === "Trinket");
  const isWeapon = fact?.itemType === "WEAPON";
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
  return {
    ...baseDocument(entity, ref, input),
    facts: {
      ...(fact?.rarity ? { rarity: plainText(fact.rarity) } : {}), ...(fact?.itemType ? { itemType: plainText(fact.itemType) } : {}),
      ...(isArmor && fact?.armorSlot ? { slot: plainText(fact.armorSlot) } : {}), ...(isArmor && fact?.armorType ? { armorType: plainText(fact.armorType) } : {}),
      ...(isWeapon && fact?.weaponType ? { weaponType: plainText(fact.weaponType) } : {}), ...(isWeapon && fact?.weaponSlot ? { weaponSlot: plainText(fact.weaponSlot) } : {}),
      ...(isWeapon && fact?.attackSpeed !== null && fact?.attackSpeed !== undefined ? { attackSpeed: fact.attackSpeed } : {}),
      ...(isWeapon && optionalCount(fact?.minDamage ?? null) !== undefined ? { minDamage: optionalCount(fact?.minDamage ?? null) } : {}),
      ...(isWeapon && optionalCount(fact?.maxDamage ?? null) !== undefined ? { maxDamage: optionalCount(fact?.maxDamage ?? null) } : {}),
      ...(damageLabel === undefined ? {} : { weaponDamageLabel: damageLabel }),
      ...(itemPower === undefined ? {} : { itemPower }), ...(damagePerSecond === undefined ? {} : { damagePerSecond }),
      ...(corruption === undefined ? {} : { corruption }), ...(dungeonRewards?.length ? { dungeonRewards } : {}),
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
    fromItems: [...fromItems.get(entity.entityKey) ?? []],
    ...(clothDrop ? { clothDrop } : {}),
    questPickups,
    ...(dungeonFinder ? { dungeonFinder } : {}),
    adventurers: (input.facts.adventurerItems ?? []).filter((row) => row.itemKey === entity.entityKey).flatMap<PublicItem["adventurers"][number]>((row) => {
      if (row.kind === "kitUpgradeItem") return row.adventurer ? [{ kind: row.kind, adventurer: input.resolve(row.adventurer) }] : [];
      if (row.kind === "equipmentBand") return row.minimumContentLevel !== null ? [{ kind: row.kind, minimumContentLevel: row.minimumContentLevel }] : [];
      return row.rewardChance !== null ? [{ kind: row.kind, chance: chancePercent(row.rewardChance) }] : [];
    }),
    whenUsed: projectItemUse(fact, input),
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
