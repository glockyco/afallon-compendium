import { HEROIC_TIER_KEY, type CatalogCondition, type CatalogCorruptionFacts, type CatalogEndpoint, type CatalogFacts, type CatalogMechanicsRule, type CatalogTransitionRow, type MechanicsTopic } from "@afallon/contracts/catalog";
import type { ChallengeStoneUse, CharacterProgression, CorruptionGuide, CraftingAndGathering, EntityRef, ExperienceSources, HeroicTier, MechanicsRule, PlacementRef, PublicDocument, PublicLevel, PublicMechanics, PublicNpc, TalentPoints } from "@afallon/contracts/public";
import { craftingRule, recipeRank, verifiedRule } from "./crafting";
import type { ReferenceResolver } from "./documents";
import { requiredLevel, spawnerExamples } from "./gathering";
import type { CorruptionRewards } from "./corruption-rewards";
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
  const candidates = facts.npcs.filter((npc) => published.has(npc.entityKey) && npcPages.has(npc.entityKey)
    && !npc.scalesWithPlayer && npc.minLevel !== null && npc.minLevel >= 0 && npc.minLevel === npc.maxLevel
    && npc.minExperience !== null && npc.minExperience >= 0 && npc.maxExperience !== null
    && npc.maxExperience > 0 && npc.maxExperience >= npc.minExperience
    && npc.lowerLevelExperienceModifier !== null && npc.higherLevelExperienceModifier !== null && names.has(npc.entityKey));
  candidates.sort((a, b) => names.get(a.entityKey)!.localeCompare(names.get(b.entityKey)!) || a.entityKey.localeCompare(b.entityKey));
  if (!candidates[0]) throw new Error("No published fixed-level creature with experience exists for the kill calculator.");
  // The default is the first creature by name whose level modifiers are not zero, so the level step changes the range.
  const first = candidates.find((npc) => npc.lowerLevelExperienceModifier !== 0 || npc.higherLevelExperienceModifier !== 0) ?? candidates[0];
  const groups = new Map<string, CharacterProgression["killCalculator"]["groups"][number]>();
  let defaultCreature: EntityRef | undefined;
  for (const npc of candidates) {
    const page = npcPages.get(npc.entityKey)!;
    const creature = publishedNpcRef(resolve, npc.entityKey, names.get(npc.entityKey)!, page);
    if (npc === first) defaultCreature = creature;
    const row = { creature, level: npc.minLevel!, minExperience: npc.minExperience!, maxExperience: npc.maxExperience!,
      lowerModifier: npc.lowerLevelExperienceModifier!, higherModifier: npc.higherLevelExperienceModifier! };
    const locations = page.locations.filter((location) => !creature.variant || location.variants.includes(creature.variant));
    const labels = new Map(locations.map((location) => [`${location.placements[0]!.mapSpaceId}\u0000${location.label}`, location.label]));
    if (labels.size === 0) labels.set("Other", "Other");
    for (const [key, name] of labels) {
      const place = places.get(key);
      const group = groups.get(key) ?? { ...(place ? { place } : {}), name, creatures: [] };
      group.creatures.push(row);
      groups.set(key, group);
    }
  }
  const heroic = facts.progression.facts.find((fact) => fact.entityKey === HEROIC_TIER_KEY);
  return {
    groups: [...groups.values()].sort((a, b) => (a.name === "Other" ? 1 : 0) - (b.name === "Other" ? 1 : 0)
      || a.name.localeCompare(b.name) || (a.place?.key ?? "").localeCompare(b.place?.key ?? "")),
    defaultCreature: defaultCreature!,
    ...(heroic?.kind === "heroicTier" ? { heroicMultiplier: heroic.details.killExperienceMultiplier } : {}),
  };
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

function characterProgression(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver,
  entityDocuments: ReadonlyMap<string, PublicDocument>): CharacterProgression {
  const template = characterTemplate(facts), cap = template.details.levels;
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


// Native and live evidence establish the behavior; values come only from this build's captured catalog facts.
const CORRUPTION_RULES = [
  { id: "corruption-altar", section: "altar", phrase: "An unused altar adds one level, or consumes a valid saved token for its value. The start level is capped by the combat setting.", method: "Altar and dungeon corruption rules", evidence: "The altar and level-cap rules come from the game code." },
  { id: "corruption-token", section: "tokens", phrase: "Saved token value and affixes appear in its tooltip. A new token rolls distinct eligible affixes.", method: "Token tooltip and affix rules", evidence: "The token and affix rules come from the game code and a token tooltip in the game." },
  { id: "corruption-creatures", section: "creatures", phrase: "Creature stat bonuses apply by dungeon level. Affix effects are separate.", method: "Creature bonuses", evidence: "The bonus rule comes from the game code and its combat settings." },
  { id: "corruption-gear", section: "gear", phrase: "Eligible reward equipment other than tokens saves a positive dungeon level. Base item stats and the combat weapon component scale. Random rolls and gems do not change. Final hit damage is unknown.", method: "Reward equipment and combat", evidence: "The reward and combat rules come from the game code. In-game checks cover equipment, tooltips, the weapon component, random rolls and gems." },
  { id: "corruption-timer", section: "timer", phrase: "Completion token value depends on the start level and seconds remaining at each dungeon threshold. Timeout reduces it and omits ordinary loot.", method: "Dungeon timer and rewards", evidence: "Completion and reward rules come from the game code and the dungeon timers." },
] as const;



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
    nativeRules: { altarWithoutTokenIncrement: 1, completionFirstBonus: 2, completionSecondBonus: 1,
      completionOtherwiseBonus: 0, timeoutDecrease: 1, timeoutMinimum: 1 },
    ...GUIDES.corruption, rules: CORRUPTION_RULES.map(({ id, section, phrase, method, evidence }): MechanicsRule => ({
      id, section, phrase, status: "verified", operands: {}, links: [], sources: [{ method, evidence }],
      appearsOn: id === "corruption-gear" ? ["Item pages, Corruption"] : [],
    })), ...(token ? { token } : {}), ...(heart ? { seeAlso: [{ lead: "For the item that starts challenge stones, see", ref: heart }] } : {}),
    ...(settings.maxLevel === null ? {} : { maxLevel: settings.maxLevel }),
    ...(settings.gearAllStatsPercentPerLevel === null ? {} : { gearAllStatsPercentPerLevel: settings.gearAllStatsPercentPerLevel }),
    ...(settings.gearStatBonuses === null ? {} : { gearStatBonuses: bonuses(settings.gearStatBonuses) }),
    ...(settings.mobStatBonuses === null ? {} : { mobStatBonuses: bonuses(settings.mobStatBonuses) }),
    ...(settings.affixesPerToken === null ? {} : { affixesPerToken: settings.affixesPerToken }),
    ...(settings.affixes === null ? {} : { affixes: settings.affixes.map(({ name, description, available }) => ({ name, description, available })) }),
    dungeons,
    tryIt: rewards.tryIt,
    evidence: ["Altar, reward, timer, affix and gear rules come from the game's code. Combat settings and dungeon timers come from the game and its scene assets.",
      "In-game checks showed the gear label, token description, equipped-stat changes and weapon component. Fixed random rolls and gems did not change."],
    unknowns: ["The weapon component does not tell us the final damage of a hit after mitigation.",
      "The meaning of keystone terminology and any further Heart effect on token rewards, dungeon levels or timers are unknown.",
      ...(!token || !heart ? ["A separate token or Heart item page is unavailable."] : [])],
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
  ];
  return new Map(documents.map((document) => [document.ref.key, document]));
}
