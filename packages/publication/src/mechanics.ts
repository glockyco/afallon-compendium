import { HEROIC_TIER_KEY, type CatalogCondition, type CatalogCorruptionFacts, type CatalogEndpoint, type CatalogFacts, type CatalogMechanicsRule, type CatalogTransitionRow, type MechanicsTopic } from "@afallon/contracts/catalog";
import type { AdventurerGear, AdventurersGuide, ChallengeStoneUse, CharacterProgression, CorruptionGuide, CraftingAndGathering, EntityRef, ExperienceSources, HeroicTier, LootGuide, PlacementRef, PublicDocument, PublicItem, PublicLevel, PublicMechanics, PublicNpc, Ref, TalentPoints } from "@afallon/contracts/public";
import { craftingRule, recipeRank, verifiedRule } from "./crafting";
import { CORRUPTION_NATIVE_RULES } from "./corruption-rules";
import type { ReferenceResolver } from "./documents/projection";
import { requiredLevel, spawnerExamples, verifiedOdds } from "./gathering";
import type { CorruptionRewards } from "./corruption-rewards";
import { MECHANICS_TOPIC_NAMES, placedRules, projectRule, topicRef } from "./placed-rules";
import { GUIDES, guideSections } from "./guide-sections";
import { characterLevelTemplate, killExperience } from "./experience";
import { levelUnion } from "./levels";
import { displayName } from "./text";
import { attunements } from "./attunements";
import { itemKind, itemTypeLabel } from "./item-type";

/** Job operands must match the settings in this catalog, not an earlier reviewed value. */
function adventurerRule(rule: CatalogMechanicsRule, facts: CatalogFacts): CatalogMechanicsRule {
  if (rule.topic !== "adventurers" || !["adventurer-job-duration", "adventurer-gear-chance"].includes(rule.ruleId)) return rule;
  const settings = facts.adventurerWorld;
  if (!settings) throw new Error("Adventurers guide needs published adventurer world settings.");
  const expected: Record<string, number> = rule.ruleId === "adventurer-job-duration"
    ? { minimumJobSeconds: settings.minimumJobSeconds, maximumJobSeconds: settings.maximumJobSeconds }
    : { equipmentRewardPercent: settings.equipmentRewardChance * 100 };
  for (const [name, value] of Object.entries(expected)) {
    if (rule.operands[name] !== value) throw new Error(`Adventurers rule ${rule.ruleId} disagrees with published ${name}.`);
  }
  return { ...rule, operands: { ...rule.operands, ...expected } };
}

/**
 * The gear that adventurers can take. A reward item can be picked from its band's minimum level, or from level 1 when it
 * has no band, as `GearContentLevel` decides. Kit items belong to their kit's adventurer and need no level.
 */
function adventurerGear(facts: CatalogFacts, resolve: ReferenceResolver): AdventurerGear {
  const rows = facts.adventurerItems ?? [];
  const gearItem = (key: string) => {
    const type = itemTypeLabel(itemKind(facts.items.find((item) => item.entityKey === key)));
    return { item: resolve({ entityKey: key, label: key }), ...(type ? { type } : {}) };
  };
  const nameOf = (ref: Ref) => "name" in ref ? ref.name : ref.label;
  const bandLevel = new Map(rows.filter((row) => row.kind === "equipmentBand" && row.minimumContentLevel !== null).map((row) => [row.itemKey, Math.max(1, row.minimumContentLevel!)]));
  const rewards = [...new Set(rows.filter((row) => row.kind === "equipmentReward").map((row) => row.itemKey))]
    .map((key) => ({ ...gearItem(key), level: bandLevel.get(key) ?? 1 }))
    .sort((left, right) => left.level - right.level || nameOf(left.item).localeCompare(nameOf(right.item)));
  const kitItems = new Map<string, { adventurer: CatalogEndpoint; items: string[] }>();
  for (const row of rows) {
    if (row.kind !== "kitUpgradeItem" || !row.adventurer?.entityKey) continue;
    const kit = kitItems.get(row.adventurer.entityKey) ?? { adventurer: row.adventurer, items: [] };
    if (!kit.items.includes(row.itemKey)) kit.items.push(row.itemKey);
    kitItems.set(row.adventurer.entityKey, kit);
  }
  const kits = [...kitItems.values()].map((kit) => ({ adventurer: resolve(kit.adventurer), items: kit.items.map(gearItem) }))
    .sort((left, right) => nameOf(left.adventurer).localeCompare(nameOf(right.adventurer)));
  return { rewards, kits };
}

/** The overview and the sections of a guide whose rules come from the rules record. */
function guide(facts: CatalogFacts, topic: MechanicsTopic, resolve: ReferenceResolver) {
  const rules = facts.progression.mechanicsRules.filter((rule) => rule.topic === topic).sort((a, b) => a.ordinal - b.ordinal);
  return { overview: GUIDES[topic].overview, sections: guideSections(topic, rules.map((rule) => ({ section: rule.section, rule: projectRule(adventurerRule(rule, facts), resolve) }))) };
}

/** Every offered class uses the same template because the guide shows one curve. */
function publishedRef(resolve: ReferenceResolver, key: string, label: string): EntityRef {
  const ref = resolve({ entityKey: key, label });
  if (ref.key !== key || !ref.slug) throw new Error(`The guide example entity ${label} (${key}) has no published page.`);
  return ref;
}

function publishedNpcRef(resolve: ReferenceResolver, key: string, label: string, page: PublicNpc): EntityRef {
  const ref = resolve({ entityKey: key, label });
  if (ref.key !== page.ref.key || ref.kind !== "npcs" || !ref.slug
    || (page.variants.length > 1 && !page.variants.some((variant) => variant.key === key && variant.anchor === ref.variant))) {
    throw new Error(`The kill calculator creature ${label} (${key}) has no published NPC variant.`);
  }
  return ref;
}

function killCalculator(facts: CatalogFacts, published: ReadonlySet<string>, resolve: ReferenceResolver,
  entityDocuments: ReadonlyMap<string, PublicDocument>): CharacterProgression["killCalculator"] {
  verifiedRule(facts, "kill-base-roll");
  const names = new Map(facts.entities.map((entity) => [entity.entityKey, displayName(entity.name ?? "")]));
  const npcPages = new Map<string, PublicNpc>();
  const places = new Map<string, EntityRef>();
  for (const document of entityDocuments.values()) {
    if (document.ref.kind === "npcs" && "variantFields" in document) {
      for (const variant of document.variants) npcPages.set(variant.key, document);
    } else if (document.ref.kind === "places" && "space" in document && document.space) {
      places.set(`${document.space.mapSpaceId}\u0000${document.ref.name}`, document.ref);
    }
  }
  // A creature joins the calculator when a kill can give experience and both level modifiers are known.
  const rolls = new Map(facts.npcs.flatMap((npc) => { const roll = killExperience(npc); return roll && (roll.max > 0 || roll.perLevel > 0) ? [[npc.entityKey, roll] as const] : []; }));
  const candidates = facts.npcs.filter((npc) => published.has(npc.entityKey) && npcPages.has(npc.entityKey) && rolls.has(npc.entityKey)
    && npc.lowerLevelExperienceModifier !== null && npc.higherLevelExperienceModifier !== null && names.has(npc.entityKey));
  candidates.sort((a, b) => names.get(a.entityKey)!.localeCompare(names.get(b.entityKey)!) || a.entityKey.localeCompare(b.entityKey));
  type Entry = Omit<CharacterProgression["killCalculator"]["groups"][number]["creatures"][number], "level"> & { levels: PublicLevel[] };
  // A reader picks a place by its name. Several map spaces can carry one name, such as three caves named Cave, so the
  // picker joins them and keeps one entry for each creature with every level at which it spawns there.
  const groups = new Map<string, { place?: EntityRef; name: string; creatures: Map<string, Entry> }>();
  const offered = new Map<string, EntityRef>();
  const fixedSpawn = new Set<string>();
  for (const npc of candidates) {
    const page = npcPages.get(npc.entityKey)!;
    const creature = publishedNpcRef(resolve, npc.entityKey, names.get(npc.entityKey)!, page);
    const identity = JSON.stringify([creature.key, creature.variant ?? null]);
    // A spawner can override the record's level or scale it into its zone range, so each place keeps the levels that
    // the NPC page shows there. A creature without a published spawn has no known level and is not offered.
    for (const location of page.locations) {
      if (!location.level || (creature.variant && !location.variants.includes(creature.variant))) continue;
      const group = groups.get(location.label) ?? { name: location.label, creatures: new Map<string, Entry>() };
      const place = places.get(`${location.placements[0]!.mapSpaceId}\u0000${location.label}`);
      if (place && !group.place) group.place = place;
      const roll = rolls.get(npc.entityKey)!;
      const entry = group.creatures.get(identity) ?? { creature, levels: [], minExperience: roll.min, maxExperience: roll.max, experiencePerLevel: roll.perLevel,
        lowerModifier: npc.lowerLevelExperienceModifier!, higherModifier: npc.higherLevelExperienceModifier! };
      entry.levels.push(location.level);
      group.creatures.set(identity, entry);
      groups.set(location.label, group);
      offered.set(npc.entityKey, creature);
      if (!location.level.scales) fixedSpawn.add(npc.entityKey);
    }
  }
  const choices = candidates.filter((npc) => offered.has(npc.entityKey));
  if (!choices[0]) throw new Error("No published creature with experience and a published spawn exists for the kill calculator.");
  // The default shows each stage: a fixed level that the character can pass, level modifiers, and more than one roll.
  const modified = (npc: (typeof choices)[number]) => npc.lowerLevelExperienceModifier !== 0 || npc.higherLevelExperienceModifier !== 0;
  const first = choices.find((npc) => fixedSpawn.has(npc.entityKey) && modified(npc) && rolls.get(npc.entityKey)!.max > rolls.get(npc.entityKey)!.min)
    ?? choices.find(modified) ?? choices[0];
  const heroic = facts.progression.facts.find((fact) => fact.entityKey === HEROIC_TIER_KEY);
  return {
    groups: [...groups.values()].sort((a, b) => a.name.localeCompare(b.name)).map(({ place, name, creatures }) => ({
      ...(place ? { place } : {}), name,
      creatures: [...creatures.values()].map(({ levels, ...entry }) => ({ ...entry, level: levelUnion(levels)! })),
    })),
    defaultCreature: offered.get(first.entityKey)!,
    ...(heroic?.kind === "heroicTier" ? { heroicMultiplier: heroic.details.killExperienceMultiplier } : {}),
  };
}

function experienceSources(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver): ExperienceSources {
  // The spawner decides the level: it rolls a fixed range or scales the player's level into its zone range. The record
  // level and the record's scaling flag apply only where the spawner does not override them.
  const creatures = facts.npcs.filter((npc) => { const roll = killExperience(npc); return published.has(npc.entityKey) && roll !== null && (roll.max > 0 || roll.perLevel > 0) && spawned.has(npc.entityKey); });
  const fixed = creatures.filter((npc) => !spawned.get(npc.entityKey)!.scales), scaling = creatures.filter((npc) => spawned.get(npc.entityKey)!.scales);
  if (fixed.length === 0) throw new Error("No published creature with experience spawns at a fixed level.");
  const fixedMax = Math.max(...fixed.map((npc) => spawned.get(npc.entityKey)!.max ?? spawned.get(npc.entityKey)!.min));
  const quests = facts.quests.filter((quest) => published.has(quest.entityKey) && (quest.experience ?? 0) > 0);
  const ranged = quests.flatMap((quest) => quest.levelRange ? [quest.levelRange.max] : []);
  const requirements = quests.flatMap((quest) => quest.levelRequirement === null ? [] : [quest.levelRequirement]);
  const modifiers = new Map<string, { lower: number; higher: number; creatures: number }>();
  for (const npc of creatures) {
    const lower = npc.lowerLevelExperienceModifier ?? 0, higher = npc.higherLevelExperienceModifier ?? 0;
    if (lower === 0 && higher === 0) continue;
    const key = `${lower}:${higher}`, row = modifiers.get(key) ?? { lower, higher, creatures: 0 };
    row.creatures += 1;
    modifiers.set(key, row);
  }
  return {
    fixedCreatures: { count: fixed.length, minLevel: Math.min(...fixed.map((npc) => spawned.get(npc.entityKey)!.min)), maxLevel: fixedMax },
    scalingCreatures: {
      count: scaling.length,
      aboveFixed: scaling.flatMap((npc) => { const level = spawned.get(npc.entityKey)!; return level.max === undefined || level.max > fixedMax ? [{ npc, level }] : []; })
        .sort((a, b) => a.npc.entityKey.localeCompare(b.npc.entityKey)).map(({ npc, level }) => ({ creature: resolve({ entityKey: npc.entityKey, label: npc.entityKey }), level })),
    },
    quests: { count: quests.length, maxLevel: Math.max(0, ...ranged), ...(requirements.length ? { maxRequirement: Math.max(...requirements) } : {}), withoutRange: quests.length - ranged.length },
    levelModifiers: [...modifiers.values()].sort((a, b) => b.creatures - a.creatures || a.lower - b.lower || a.higher - b.higher),
  };
}

function levelUpTalentPoints(facts: CatalogFacts): TalentPoints[] {
  return facts.progression.facts.flatMap((fact): TalentPoints[] => {
    if (fact.kind !== "treePoints") return [];
    const gains = fact.details.gainRules.filter((rule) => rule.class === null && rule.trigger.name === "characterLevelUp");
    return gains.length === 0 ? [] : [{ name: displayName(fact.name ?? ""), start: Math.max(0, fact.details.startAmount), max: Math.max(0, fact.details.maxPoints), gains: gains.map((rule) => ({ trigger: "characterLevelUp" as const, amount: Math.max(0, rule.amount) })) }];
  });
}

function characterProgression(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver,
  entityDocuments: ReadonlyMap<string, PublicDocument>): CharacterProgression {
  const template = characterLevelTemplate(facts), cap = template.details.levels;
  const rows = template.details.rows.slice(0, Math.max(0, cap - 1)).map((row, index) => ({ level: index + 1, toNext: Math.max(0, row.experienceRequired) }));
  if (rows.length === 0 || rows.length !== cap - 1) throw new Error(`The class level template has ${template.details.rows.length} rows for its cap ${cap}.`);
  return {
    ref: topicRef("character-progression"), description: MECHANICS_TOPIC_NAMES["character-progression"].description, art: {}, topic: "character-progression",
    curve: { template: displayName(template.name ?? "") || "Character levels", cap, rows },
    sources: experienceSources(facts, published, spawned, resolve), talentPoints: levelUpTalentPoints(facts),
    ...guide(facts, "character-progression", resolve), killCalculator: killCalculator(facts, published, resolve, entityDocuments),
  };
}

function essenceExample(settings: Exclude<HeroicTier["settings"], { unavailable: string }>): HeroicTier["example"] {
  const affixCounts = Array.from({ length: settings.maxAffixes + 1 }, (_, count) => count);
  return { affixCounts, rows: (["other", "elite", "rare", "boss"] as const).map((rank) => ({ rank,
    essence: affixCounts.map((count) => (settings.essenceBaseAmount + settings.essencePerAffix * count)
      * (rank === "other" ? 1 : rank === "elite" ? settings.essenceEliteMultiplier : rank === "rare" ? settings.essenceRareMultiplier : settings.essenceBossMultiplier)),
  })) };
}

function heroicTier(facts: CatalogFacts, resolve: ReferenceResolver): HeroicTier {
  const fact = facts.progression.facts.find((candidate) => candidate.entityKey === HEROIC_TIER_KEY);
  let settings: HeroicTier["settings"];
  if (fact?.kind !== "heroicTier") settings = { unavailable: "Heroic tier settings are unavailable." };
  else {
    const { asset: _asset, essenceTreePoint, ...values } = fact.details;
    settings = { ...values, ...(essenceTreePoint?.label ? { essencePoints: displayName(essenceTreePoint.label) } : {}) };
  }
  const example = "unavailable" in settings ? undefined : essenceExample(settings);
  if (example) verifiedRule(facts, "essence-rank-multiplier");
  return {
    ref: topicRef("heroic-tier"), description: MECHANICS_TOPIC_NAMES["heroic-tier"].description, art: {}, topic: "heroic-tier", settings,
    ...guide(facts, "heroic-tier", resolve), ...(example ? { example } : {}),
  };
}

function craftingExample(facts: CatalogFacts, published: ReadonlySet<string>, conditions: ReadonlyMap<string, CatalogCondition>, resolve: ReferenceResolver): CraftingAndGathering["example"] {
  const recipe = facts.recipes.find((candidate) => facts.entities.some((entity) => entity.entityKey === candidate.entityKey && displayName(entity.name ?? "") === "Runeweave Regalia"));
  const product = recipe?.ranks.flatMap((rank) => rank.products).find((row) => row.item.entityKey !== null && published.has(row.item.entityKey));
  if (!recipe || !product?.item.entityKey || !recipe.skill?.entityKey || recipe.ranks.length === 0) throw new Error("The Runeweave Regalia example has no published product, skill, or rank.");
  const skill = facts.progression.facts.find((fact) => fact.entityKey === recipe.skill?.entityKey);
  if (skill?.kind !== "skills" || skill.details.maxLevel <= 0) throw new Error("The Runeweave Regalia example has no published skill level.");
  const node = facts.gatheringNodes.find((candidate) => displayName(candidate.name) === "Small Iron Vein");
  if (!node || !published.has(node.entityKey) || !node.skill?.entityKey) throw new Error("The Small Iron Vein example has no published node or skill.");
  const nodeSkill = facts.progression.facts.find((fact) => fact.entityKey === node.skill?.entityKey);
  if (nodeSkill?.kind !== "skills" || nodeSkill.details.maxLevel <= 0) throw new Error("The Small Iron Vein example has no published skill level.");
  const rank = recipeRank(recipe.ranks[0]!, skill.details.maxLevel, craftingRule(facts));
  verifiedRule(facts, "node-yield-bonus");
  const levels = [...new Set([requiredLevel(node, conditions) ?? 1, nodeSkill.details.maxLevel])];
  const chances = placedRules(facts, "gatheringNodes", { entityKey: node.entityKey, sourceKinds: new Set(node.sources.map((source) => source.sourceKind)), yieldLevels: levels }, resolve)
    .find((placed) => placed.section === "node-rewards" && placed.levelChances !== undefined)?.levelChances;
  if (!chances) throw new Error("The Small Iron Vein example has no placed node-yield-bonus rule.");
  return {
    craft: { product: { ...publishedRef(resolve, product.item.entityKey, product.item.label ?? "Runeweave Regalia"), variant: "crafting" }, skill: publishedRef(resolve, recipe.skill.entityKey, recipe.skill.label ?? "Skill"), rank },
    gather: { node: publishedRef(resolve, node.entityKey, node.name), skill: publishedRef(resolve, node.skill.entityKey, node.skill.label ?? "Skill"), levelChances: chances },
  };
}

function craftingAndGathering(facts: CatalogFacts, published: ReadonlySet<string>, conditions: ReadonlyMap<string, CatalogCondition>, resolve: ReferenceResolver): CraftingAndGathering {
  return {
    ref: topicRef("crafting-and-gathering"), description: MECHANICS_TOPIC_NAMES["crafting-and-gathering"].description, art: {}, topic: "crafting-and-gathering",
    ...guide(facts, "crafting-and-gathering", resolve), spawnerExamples: spawnerExamples(facts.gatheringNodes, resolve, new Map(), verifiedOdds(facts)), attunements: attunements(facts, resolve),
    example: craftingExample(facts, published, conditions, resolve),
  };
}

function corruptionRef(endpoint: CatalogEndpoint | null, published: ReadonlySet<string>, resolve: ReferenceResolver): EntityRef | undefined {
  if (!endpoint?.entityKey || !published.has(endpoint.entityKey)) return undefined;
  const ref = resolve({ entityKey: endpoint.entityKey, label: endpoint.label ?? endpoint.entityKey });
  return ref.key === endpoint.entityKey && ref.slug ? ref : undefined;
}
/** Resolve only the child's teleports of each scanned, Heart-gated stone; a host scene is never a destination. */
export function projectChallengeStoneUses(facts: CatalogFacts, published: ReadonlySet<string>, resolve: ReferenceResolver,
  transitions: readonly CatalogTransitionRow[], placements: ReadonlyMap<string, PlacementRef>,
  stoneRoutes: readonly { sourceId: string; placementId: string; stoneName: string; regionName: string; transitionIds: string[] }[]): ChallengeStoneUse[] | undefined {
  const requirements = facts.corruption?.heartRequirements;
  if (requirements === null || requirements === undefined) return undefined;
  const routes = new Map(stoneRoutes.map((route) => [route.sourceId, route]));
  const transitionsById = new Map(transitions.map((transition) => [transition.transitionId, transition]));
  const names = new Map(facts.entities.map((entity) => [entity.entityKey, entity.name]));
  return requirements.filter((row) => row.consume).map((row) => {
    const stone = routes.get(row.sourceId), spot = stone && placements.get(stone.placementId);
    const keys = [...new Set(stone?.transitionIds.flatMap((id) => {
      const transition = transitionsById.get(id);
      return transition?.destinationSceneKey ? [transition.destinationSceneKey] : [];
    }) ?? [])];
    const destinations: EntityRef[] = [], unlinkedDestinations: string[] = [];
    for (const key of keys) {
      const ref = corruptionRef({ entityKey: key, label: key }, published, resolve);
      if (ref?.kind === "places") destinations.push(ref);
      else {
        const name = names.get(key);
        if (name) unlinkedDestinations.push(displayName(name));
      }
    }
    return { count: row.count, ...(stone ? { stoneName: stone.stoneName, regionName: stone.regionName } : {}),
      ...(spot ? { spot: { placementId: spot.placementId, mapSpaceId: spot.mapSpaceId, label: spot.label } } : {}),
      destinations, ...(unlinkedDestinations.length ? { unlinkedDestinations } : {}) };
  });
}


function corruptionGuide(facts: CatalogFacts, published: ReadonlySet<string>, resolve: ReferenceResolver,
  bossDropTables: ReadonlyMap<string, ReadonlySet<number>> = new Map(), rewards?: CorruptionRewards): CorruptionGuide {
  const settings = facts.corruption;
  if (!settings) throw new Error("Cannot publish a Corruption guide without captured corruption facts.");
  if (!rewards) throw new Error("Cannot publish a Corruption guide without eligible timed-dungeon reward equipment.");
  const token = corruptionRef(settings.token, published, resolve);
  const heart = corruptionRef(settings.heart, published, resolve);
  if ((settings.token && !token) || (settings.heart && !heart) || (token && heart && token.key === heart.key)) {
    throw new Error("The Corruption Token and Heart must resolve to distinct published item pages.");
  }
  const bonuses = (rows: CatalogCorruptionFacts["gearStatBonuses"]): CorruptionGuide["gearStatBonuses"] => {
    if (rows === null) return undefined;
    return rows.map((row) => {
      if (!row.stat.label) throw new Error("Corruption stat bonus lacks a readable stat name.");
      return { stat: displayName(row.stat.label), amountPerLevel: row.amountPerLevel, isPercent: row.isPercent };
    });
  };
  const dungeons = settings.dungeons.map((row) => {
    const place = corruptionRef(row.scene, published, resolve);
    if (!place) throw new Error(`Corruption dungeon ${row.scene.label ?? row.scene.entityKey} has no published place page.`);
    return {
      place,
      ...(row.totalSeconds === null ? {} : { totalSeconds: row.totalSeconds }),
      ...(row.firstRemainingSeconds === null ? {} : { firstRemainingSeconds: row.firstRemainingSeconds }),
      ...(row.secondRemainingSeconds === null ? {} : { secondRemainingSeconds: row.secondRemainingSeconds }),
      ...(row.maxLootItems === null ? {} : { maxLootItems: row.maxLootItems }),
      ...(row.bosses === null ? {} : { bosses: row.bosses.map((boss) => {
        const ref = corruptionRef(boss, published, resolve);
        if (!ref) throw new Error(`Corruption dungeon ${row.scene.label} has an unpublished boss ${boss.label}.`);
        return ref;
      }) }),
      ...(row.lootTables === null || row.bosses === null ? {} : {
        rewardsFromBossDrops: row.lootTables.length > 0 && row.bosses.length > 0
          && row.lootTables.every((table) => Number(table.entityKey?.split(":")[1]) >= 0
            && row.bosses!.some((boss) => boss.entityKey && bossDropTables.get(boss.entityKey)?.has(Number(table.entityKey?.split(":")[1])))),
      }),
    };
  });
  return {
    ref: topicRef("corruption"), description: MECHANICS_TOPIC_NAMES.corruption.description, art: {}, topic: "corruption",
    nativeRules: { ...CORRUPTION_NATIVE_RULES },
    overview: GUIDES.corruption.overview,
    // Native and live evidence establish the corruption rules that the leads and computed sentences state.
    sections: guideSections("corruption", []),
    ...(token ? { token } : {}), ...(heart ? { seeAlso: [{ lead: "For the item that starts challenge stones, see", ref: heart }] } : {}),
    ...(settings.maxLevel === null ? {} : { maxLevel: settings.maxLevel }),
    ...(settings.gearAllStatsPercentPerLevel === null ? {} : { gearAllStatsPercentPerLevel: settings.gearAllStatsPercentPerLevel }),
    ...(settings.gearStatBonuses === null ? {} : { gearStatBonuses: bonuses(settings.gearStatBonuses) }),
    ...(settings.mobStatBonuses === null ? {} : { mobStatBonuses: bonuses(settings.mobStatBonuses) }),
    ...(settings.affixesPerToken === null ? {} : { affixesPerToken: settings.affixesPerToken }),
    ...(settings.affixes === null ? {} : { affixes: settings.affixes.map(({ name, description, available }) => ({ name, description, available })) }),
    dungeons,
    tryIt: rewards.tryIt,
  };
}

/** Project reviewed guides and the guide derived from captured Corruption facts. */
export function projectMechanicsDocuments(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver, conditions: ReadonlyMap<string, CatalogCondition>,
  entityDocuments: ReadonlyMap<string, PublicDocument>, bossDropTables: ReadonlyMap<string, ReadonlySet<number>> = new Map(),
  rewards?: CorruptionRewards): ReadonlyMap<string, PublicMechanics> {
  const topics = new Set(facts.progression.mechanicsRules.flatMap((rule) => rule.topic === null ? [] : [rule.topic]));
  const documents: PublicMechanics[] = [
    ...(topics.has("character-progression") ? [characterProgression(facts, published, spawned, resolve, entityDocuments)] : []),
    ...(topics.has("heroic-tier") ? [heroicTier(facts, resolve)] : []),
    ...(topics.has("crafting-and-gathering") ? [craftingAndGathering(facts, published, conditions, resolve)] : []),
    ...(facts.corruption ? [corruptionGuide(facts, published, resolve, bossDropTables, rewards)] : []),
    ...(topics.has("adventurers") ? [{ ref: topicRef("adventurers"), description: MECHANICS_TOPIC_NAMES.adventurers.description, art: {}, topic: "adventurers", ...guide(facts, "adventurers", resolve), gear: adventurerGear(facts, resolve) } satisfies AdventurersGuide] : []),
    ...(topics.has("loot") ? [{ ref: topicRef("loot"), description: MECHANICS_TOPIC_NAMES.loot.description, art: {}, topic: "loot", ...guide(facts, "loot", resolve) } satisfies LootGuide] : []),
  ];
  return new Map(documents.map((document) => [document.ref.key, document]));
}
