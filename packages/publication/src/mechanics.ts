import { HEROIC_TIER_KEY, type CatalogCondition, type CatalogCorruptionFacts, type CatalogEndpoint, type CatalogFacts, type CatalogMechanicsRule, type CatalogTransitionRow, type MechanicsTopic } from "@afallon/contracts/catalog";
import type { CharacterProgression, CorruptionGuide, CraftingAndGathering, EntityRef, ExperienceSources, HeroicTier, MechanicsRule, PlacementRef, PublicLevel, PublicMechanics, TalentPoints } from "@afallon/contracts/public";
import { craftingRule, recipeRank, verifiedRule } from "./crafting";
import type { ReferenceResolver } from "./documents";
import { requiredLevel, spawnerExamples } from "./gathering";
import { MECHANICS_TOPIC_NAMES, placedRules, projectRule, topicRef } from "./placed-rules";
import { GUIDES } from "./guide-steps";
import { displayName } from "./text";

function guide(facts: CatalogFacts, topic: MechanicsTopic, resolve: ReferenceResolver) {
  const rules = facts.progression.mechanicsRules.filter((rule) => rule.topic === topic).sort((a, b) => a.ordinal - b.ordinal);
  const ids = new Set(rules.map((rule) => rule.ruleId));
  for (const step of GUIDES[topic].steps) for (const id of step.rules) {
    if (!ids.has(id)) throw new Error(`Guide ${topic} step ${step.title} names missing rule ${id}.`);
  }
  return { ...GUIDES[topic], rules: rules.map((rule) => projectRule(rule, resolve)) };
}

/** Every offered class uses the same template because the guide shows one curve. */
function characterTemplate(facts: CatalogFacts) {
  const progression = facts.progression.facts;
  const keys = new Set(progression.flatMap((fact) => fact.kind === "classes" && facts.progression.offeredClasses.includes(fact.entityKey) && fact.details.levelTemplate?.entityKey ? [fact.details.levelTemplate.entityKey] : []));
  if (keys.size !== 1) throw new Error(`The offered classes use ${keys.size} level templates; the character progression page needs exactly one.`);
  const key = [...keys][0]!;
  const template = progression.find((fact) => fact.entityKey === key);
  if (template?.kind !== "levels") throw new Error(`The class level template ${key} has no level facts.`);
  return template;
}

function publishedRef(resolve: ReferenceResolver, key: string, label: string): EntityRef {
  const ref = resolve({ entityKey: key, label });
  if (ref.key !== key || !ref.slug) throw new Error(`The guide example entity ${label} (${key}) has no published page.`);
  return ref;
}

function killExample(facts: CatalogFacts, published: ReadonlySet<string>, resolve: ReferenceResolver): CharacterProgression["example"] {
  verifiedRule(facts, "kill-base-roll");
  const names = new Map(facts.entities.map((entity) => [entity.entityKey, displayName(entity.name ?? "")]));
  const candidates = facts.npcs.filter((npc) => published.has(npc.entityKey) && !npc.scalesWithPlayer && npc.minLevel !== null && npc.minLevel === npc.maxLevel
    && npc.minExperience !== null && npc.maxExperience !== null && npc.maxExperience > 0 && names.has(npc.entityKey));
  candidates.sort((a, b) => names.get(a.entityKey)!.localeCompare(names.get(b.entityKey)!) || a.entityKey.localeCompare(b.entityKey));
  const npc = candidates[0];
  if (!npc) throw new Error("No published fixed-level creature with experience exists for the kill example.");
  return { creature: publishedRef(resolve, npc.entityKey, names.get(npc.entityKey)!), level: npc.minLevel!, lowest: npc.minExperience!, highest: Math.max(npc.minExperience!, npc.maxExperience! - 1) };
}

function experienceSources(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver): ExperienceSources {
  const creatures = facts.npcs.filter((npc) => published.has(npc.entityKey) && (npc.maxExperience ?? 0) > 0 && npc.minLevel !== null && npc.maxLevel !== null);
  const fixed = creatures.filter((npc) => !npc.scalesWithPlayer), scaling = creatures.filter((npc) => npc.scalesWithPlayer);
  if (fixed.length === 0) throw new Error("No published fixed-level creature gives experience.");
  const fixedMax = Math.max(...fixed.map((npc) => npc.maxLevel!));
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
    fixedCreatures: { count: fixed.length, minLevel: Math.max(0, Math.min(...fixed.map((npc) => npc.minLevel!))), maxLevel: fixedMax },
    scalingCreatures: {
      count: scaling.length,
      // A scaling creature gets its level from its spawner's zone, not its authored range.
      aboveFixed: scaling.flatMap((npc) => { const level = spawned.get(npc.entityKey); return level && (level.max === undefined || level.max > fixedMax) ? [{ npc, level }] : []; })
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

function characterProgression(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver): CharacterProgression {
  const template = characterTemplate(facts), cap = template.details.levels;
  const rows = template.details.rows.slice(0, Math.max(0, cap - 1)).map((row, index) => ({ level: index + 1, toNext: Math.max(0, row.experienceRequired) }));
  if (rows.length === 0 || rows.length !== cap - 1) throw new Error(`The class level template has ${template.details.rows.length} rows for its cap ${cap}.`);
  return {
    ref: topicRef("character-progression"), description: MECHANICS_TOPIC_NAMES["character-progression"].description, art: {}, topic: "character-progression",
    curve: { template: displayName(template.name ?? "") || "Character levels", cap, rows },
    sources: experienceSources(facts, published, spawned, resolve), talentPoints: levelUpTalentPoints(facts),
    ...guide(facts, "character-progression", resolve), example: killExample(facts, published, resolve),
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
    .find((placed) => placed.stepId === "gather-the-items" && placed.levelChances !== undefined)?.levelChances;
  if (!chances) throw new Error("The Small Iron Vein example has no placed node-yield-bonus rule.");
  return {
    craft: { product: { ...publishedRef(resolve, product.item.entityKey, product.item.label ?? "Runeweave Regalia"), variant: "crafting" }, skill: publishedRef(resolve, recipe.skill.entityKey, recipe.skill.label ?? "Skill"), rank },
    gather: { node: publishedRef(resolve, node.entityKey, node.name), skill: publishedRef(resolve, node.skill.entityKey, node.skill.label ?? "Skill"), levelChances: chances },
  };
}

function craftingAndGathering(facts: CatalogFacts, published: ReadonlySet<string>, conditions: ReadonlyMap<string, CatalogCondition>, resolve: ReferenceResolver): CraftingAndGathering {
  return {
    ref: topicRef("crafting-and-gathering"), description: MECHANICS_TOPIC_NAMES["crafting-and-gathering"].description, art: {}, topic: "crafting-and-gathering",
    ...guide(facts, "crafting-and-gathering", resolve), spawnerExamples: spawnerExamples(facts.gatheringNodes, resolve, new Map()),
    example: craftingExample(facts, published, conditions, resolve),
  };
}

function corruptionRef(endpoint: CatalogEndpoint | null, published: ReadonlySet<string>, resolve: ReferenceResolver): EntityRef | undefined {
  if (!endpoint?.entityKey || !published.has(endpoint.entityKey)) return undefined;
  const ref = resolve({ entityKey: endpoint.entityKey, label: endpoint.label ?? endpoint.entityKey });
  return ref.key === endpoint.entityKey && ref.slug ? ref : undefined;
}

// Native and live evidence establish the behavior; values come only from this build's captured catalog facts.
const CORRUPTION_RULES = [
  { id: "corruption-altar", section: "altar", phrase: "An unused altar adds one level, or consumes a valid saved token for its value. The start level is capped by the combat setting.", method: "Altar and dungeon corruption rules", evidence: "The altar and level-cap rules come from the game code." },
  { id: "corruption-token", section: "tokens", phrase: "Saved token value and affixes appear in its tooltip. A new token rolls distinct eligible affixes.", method: "Token tooltip and affix rules", evidence: "The token and affix rules come from the game code and a token tooltip in the game." },
  { id: "corruption-creatures", section: "creatures", phrase: "Creature stat bonuses apply by dungeon level. Affix effects are separate.", method: "Creature bonuses", evidence: "The bonus rule comes from the game code and its combat settings." },
  { id: "corruption-gear", section: "gear", phrase: "Eligible reward equipment other than tokens saves a positive dungeon level. Base item stats and the combat weapon component scale. Random rolls and gems do not change. Final hit damage is unknown.", method: "Reward equipment and combat", evidence: "The reward and combat rules come from the game code. In-game checks cover equipment, tooltips, the weapon component, random rolls and gems." },
  { id: "corruption-timer", section: "timer", phrase: "Completion token value depends on the start level and seconds remaining at each dungeon threshold. Timeout reduces it and omits ordinary loot.", method: "Dungeon timer and rewards", evidence: "Completion and reward rules come from the game code and the dungeon timers." },
  { id: "corruption-heart", section: "heart", phrase: "The Heart is a separate item consumed at the listed challenge stones. It is also a crafting material.", method: "Challenge stones and recipes", evidence: "Challenge-stone requirements and recipes list the Heart as a separate item." },
] as const;


function corruptionExample(facts: CatalogFacts, settings: CatalogCorruptionFacts, published: ReadonlySet<string>, resolve: ReferenceResolver): CorruptionGuide["example"] {
  if (settings.maxLevel === null || settings.maxLevel < 1 || settings.gearAllStatsPercentPerLevel === null || settings.gearStatBonuses === null) return undefined;
  const entity = facts.entities.find((row) => row.kind === "items" && displayName(row.name ?? "") === "Novice Plate Chest");
  const item = entity && facts.items.find((row) => row.entityKey === entity.entityKey);
  if (!entity || !item || !published.has(entity.entityKey)) throw new Error("The authored Novice Plate Chest example has no published item.");
  const stat = item.stats.find((row) => displayName(row.stat.label ?? "") === "Stamina" && !row.isPercent);
  if (!stat) throw new Error("The authored Novice Plate Chest example has no Stamina template stat.");
  const power = item.stats.find((row) => displayName(row.stat.label ?? "") === "Item Power" && !row.isPercent);
  const calculated = (base: number, statKey: string | null) => base + base * settings.gearAllStatsPercentPerLevel! / 100
    + settings.gearStatBonuses!.filter((bonus) => statKey !== null && bonus.stat.entityKey === statKey)
      .reduce((sum, bonus) => sum + bonus.amountPerLevel * (bonus.isPercent ? base / 100 : 1), 0);
  return {
    item: publishedRef(resolve, entity.entityKey, entity.name ?? "Novice Plate Chest"), level: 1,
    stat: "Stamina", baseStat: stat.amount, calculatedStat: calculated(stat.amount, stat.stat.entityKey),
    ...(power ? { basePower: power.amount, calculatedPower: Math.trunc(calculated(power.amount, power.stat.entityKey)) } : {}),
  };
}

function corruptionGuide(facts: CatalogFacts, published: ReadonlySet<string>, resolve: ReferenceResolver,
  transitions: readonly CatalogTransitionRow[] = [], placements: ReadonlyMap<string, PlacementRef> = new Map(),
  stoneRoutes: readonly { sourceId: string; placementId: string; stoneName: string; regionName: string; transitionIds: string[] }[] = [],
  bossDropTables: ReadonlyMap<string, ReadonlySet<number>> = new Map()): CorruptionGuide {
  const settings = facts.corruption;
  if (!settings) throw new Error("Cannot publish a Corruption guide without captured corruption facts.");
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
  const example = corruptionExample(facts, settings, published, resolve);
  return {
    ref: topicRef("corruption"), description: MECHANICS_TOPIC_NAMES.corruption.description, art: {}, topic: "corruption",
    nativeRules: { altarWithoutTokenIncrement: 1, completionFirstBonus: 2, completionSecondBonus: 1,
      completionOtherwiseBonus: 0, timeoutDecrease: 1, timeoutMinimum: 1 },
    ...GUIDES.corruption, rules: CORRUPTION_RULES.map(({ id, section, phrase, method, evidence }): MechanicsRule => ({
      id, section, phrase, status: "verified", operands: {}, links: [], sources: [{ method, evidence }],
      appearsOn: id === "corruption-gear" ? ["Item pages, Corruption"] : [],
    })), ...(token ? { token } : {}), ...(heart ? { heart } : {}),
    ...(settings.maxLevel === null ? {} : { maxLevel: settings.maxLevel }),
    ...(settings.gearAllStatsPercentPerLevel === null ? {} : { gearAllStatsPercentPerLevel: settings.gearAllStatsPercentPerLevel }),
    ...(settings.gearStatBonuses === null ? {} : { gearStatBonuses: bonuses(settings.gearStatBonuses) }),
    ...(settings.mobStatBonuses === null ? {} : { mobStatBonuses: bonuses(settings.mobStatBonuses) }),
    ...(settings.affixesPerToken === null ? {} : { affixesPerToken: settings.affixesPerToken }),
    ...(settings.affixes === null ? {} : { affixes: settings.affixes.map(({ name, description, available }) => ({ name, description, available })) }),
    // A stone's host scene is not its destination. Only its child interactables' teleports can name it.
    dungeons, ...(settings.heartRequirements === null ? {} : { heartRequirements: settings.heartRequirements.filter((row) => row.consume).map((row) => {
      const stone = stoneRoutes.find((candidate) => candidate.sourceId === row.sourceId);
      const publishedSpot = stone ? placements.get(stone.placementId) : undefined;
      const destinations = [...new Set(transitions.filter((transition) => stone?.transitionIds.includes(transition.transitionId))
        .flatMap((transition) => transition.destinationSceneKey === null ? [] : [transition.destinationSceneKey]))];
      const namedDestinations = destinations.map((key) => ({
        place: corruptionRef({ entityKey: key, label: key }, published, resolve),
        name: facts.entities.find((entity) => entity.entityKey === key)?.name,
      }));
      const unlinkedDestinations = namedDestinations.flatMap(({ place, name }) => !place && name ? [displayName(name)] : []);
      return { count: row.count, ...(stone ? { stoneName: stone.stoneName, regionName: stone.regionName } : {}),
        ...(row.place && corruptionRef(row.place, published, resolve) ? { place: corruptionRef(row.place, published, resolve)! } : {}),
        destinations: namedDestinations.flatMap(({ place }) => place ?? []),
        ...(unlinkedDestinations.length ? { unlinkedDestinations } : {}),
        ...(publishedSpot ? { spot: { placementId: publishedSpot.placementId, mapSpaceId: publishedSpot.mapSpaceId, label: publishedSpot.label } } : {}) };
    }) }),
    ...(example ? { example } : {}),
    evidence: ["Altar, reward, timer, affix and gear rules come from the game's code. Combat settings and dungeon timers come from the game and its scene assets.",
      "In-game checks showed the gear label, token description, equipped-stat changes and weapon component. Fixed random rolls and gems did not change."],
    unknowns: ["The weapon component does not tell us the final damage of a hit after mitigation.",
      "The meaning of keystone terminology and any further Heart effect on token rewards, dungeon levels or timers are unknown.",
      ...(settings.heartRequirements === null ? ["Challenge-stone requirements are unavailable."] : []),
      ...(!token || !heart ? ["A separate token or Heart item page is unavailable."] : [])],
  };
}

/** Project reviewed guides and the guide derived from captured Corruption facts. */
export function projectMechanicsDocuments(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver, conditions: ReadonlyMap<string, CatalogCondition>,
  transitions: readonly CatalogTransitionRow[] = [], placements: ReadonlyMap<string, PlacementRef> = new Map(),
  stoneRoutes: readonly { sourceId: string; placementId: string; stoneName: string; regionName: string; transitionIds: string[] }[] = [],
  bossDropTables: ReadonlyMap<string, ReadonlySet<number>> = new Map()): ReadonlyMap<string, PublicMechanics> {
  const topics = new Set(facts.progression.mechanicsRules.flatMap((rule) => rule.topic === null ? [] : [rule.topic]));
  const documents: PublicMechanics[] = [
    ...(topics.has("character-progression") ? [characterProgression(facts, published, spawned, resolve)] : []),
    ...(topics.has("heroic-tier") ? [heroicTier(facts, resolve)] : []),
    ...(topics.has("crafting-and-gathering") ? [craftingAndGathering(facts, published, conditions, resolve)] : []),
    ...(facts.corruption ? [corruptionGuide(facts, published, resolve, transitions, placements, stoneRoutes, bossDropTables)] : []),
  ];
  return new Map(documents.map((document) => [document.ref.key, document]));
}
