import type { CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogRelations } from "@afallon/contracts/catalog";
import type { EntityRef, PublicationExclusion } from "@afallon/contracts/public";
import { phaseAbilities } from "./adventurers";
import { plainText } from "./text";
import { effectPageKeys } from "./documents/effects";

export interface ExclusionEvidenceInput {
  entities: readonly CatalogEntityRow[];
  facts: CatalogFacts;
  /** The relations before exclusion, so that a new source of an excluded record still counts. */
  relations: CatalogRelations;
  /** The NPCs that a spawner can spawn. */
  spawnCandidates: ReadonlySet<string>;
  /** The classes with a page that start with each item. */
  startingGear: ReadonlyMap<string, readonly EntityRef[]>;
  /** The published map spots of each record, such as the spots of a crafting station. */
  placementIdsByKey: ReadonlyMap<string, readonly string[]>;
  /** Every excluded record, so a record whose only uses are excluded records stays excluded. */
  excluded: ReadonlySet<string>;
  /** Item keys in loot tables that have at least one binding or owner. */
  lootItemKeys?: ReadonlySet<string>;
}

const keyOf = (endpoint: CatalogEndpoint | null): string | null => endpoint?.entityKey ?? null;
const playerConditionCache = new WeakMap<CatalogFacts, ReadonlySet<string>>();
function playerConditionIds(facts: CatalogFacts): ReadonlySet<string> {
  let ids = playerConditionCache.get(facts);
  if (!ids) {
    ids = new Set([
      ...facts.progression.facts.flatMap((row) => row.kind === "abilities" ? row.details.ranks.flatMap((rank) => rank.conditionId ? [rank.conditionId] : []) : []),
      ...facts.items.flatMap((item) => item.conditionIds),
    ]);
    playerConditionCache.set(facts, ids);
  }
  return ids;
}
/** The relations without the rows that name an excluded record, so no page shows a row for it. */
export function withoutExcludedRelations(relations: CatalogRelations, excluded: ReadonlySet<string>): CatalogRelations {
  if (excluded.size === 0) return relations;
  const kept = (...keys: (string | null)[]) => keys.every((key) => key === null || !excluded.has(key));
  return {
    ...relations,
    drops: relations.drops.filter((row) => kept(keyOf(row.owner), keyOf(row.item))),
    vendors: relations.vendors.filter((row) => kept(keyOf(row.npc), keyOf(row.item), keyOf(row.currency))),
    gathers: relations.gathers.filter((row) => kept(keyOf(row.resource), keyOf(row.item), keyOf(row.skill))),
    containers: relations.containers.filter((row) => kept(keyOf(row.place), keyOf(row.item))),
    interactions: relations.interactions.filter((row) => kept(keyOf(row.place), keyOf(row.item))),
    quests: relations.quests.filter((row) => kept(keyOf(row.quest), keyOf(row.counterpart))),
    recipes: relations.recipes.filter((row) => kept(keyOf(row.recipe), keyOf(row.item))),
    transitions: relations.transitions.filter((row) => kept(row.sourceSceneKey, row.destinationSceneKey)),
  };
}

/** The facts that contradict an exclusion of this record, or null when its evidence still holds. */
function contradiction(entity: CatalogEntityRow, input: ExclusionEvidenceInput, reason: PublicationExclusion["reason"]): string | null {
  const key = entity.entityKey, relations = input.relations;
  switch (entity.kind) {
    case "abilities": {
      if (entity.description?.trim()) return "the ability has a description";
      const ability = input.facts.abilities.find((row) => row.entityKey === key);
      if (ability?.ranks.some((rank) => rank.lines.some((line) => line.spans.some((span) => span.tone !== "muted" && span.text.trim())))) return "the ability describes an effect";
      if (input.facts.progression.learners.some((learner) => learner.ability === key)) return "the ability has a learner";
      if (input.facts.npcs.some((npc) => phaseAbilities(npc).some((phase) => phase.abilities.some((entry) => entry.ability.entityKey === key)))) return "a creature uses the ability";
      if (input.facts.items.some((item) => item.actionAbilities.some((entry) => entry.ability.entityKey === key)
        || item.gameActions.some((action) => action.type === "Ability" && action.target?.entityKey === key))) return "an item uses the ability";
      if (input.facts.progression.appliers.some((applier) => applier.source.entityKey === key)) return "the ability applies an effect";
      return null;
    }
    case "items": {
      const sources = relations.drops.some((row) => keyOf(row.item) === key) || relations.vendors.some((row) => keyOf(row.item) === key)
        || relations.gathers.some((row) => keyOf(row.item) === key) || relations.containers.some((row) => keyOf(row.item) === key)
        || relations.interactions.some((row) => keyOf(row.item) === key)
        || relations.quests.some((row) => keyOf(row.counterpart) === key && (row.kind === "reward" || row.kind === "rewardChoice" || row.kind === "itemGiven"))
        || relations.recipes.some((row) => keyOf(row.item) === key && row.role === "product") || (input.startingGear.get(key)?.length ?? 0) > 0;
      if (sources) return "the item has a source";
      if (reason !== "content-free-record") return null;
      const fact = input.facts.items.find((row) => row.entityKey === key);
      if (!fact) return "the item has no checked facts";
      if (/\b(uses?|usable|increases?|grants?|gives?|teleports?|restores?|adds?|teaches?|equips?|deals?|heals?|summons?|opens?|activates?|crafts?)\b/i.test(entity.description ?? "")) return "the item's description names a use";
      if (fact.actionAbilities.length || fact.useLines.length || fact.stats.length || fact.randomStats.length
        || fact.sockets.length || fact.gem || fact.enchantment || fact.gearSet || fact.currency || fact.corruptionToken
        || fact.equipmentRequirements.length || fact.useConditions.length || (fact.maxDamage ?? 0) > 0 || (fact.minDamage ?? 0) > 0) return "the item has a usable fact";
      const inertAction = (action: typeof fact.gameActions[number]) =>
        action.type === "Item" && action.alterAction === "Remove" && action.target?.entityKey === key
        || (action.type === "Quest" || action.type === "GameObject") && action.alterAction === "Gain" && !action.target?.entityKey && action.amount === 0;
      if (!fact.gameActions.every(inertAction)) return "the item has an identified use";
      if (Object.values(relations).some((rows) => JSON.stringify(rows).includes(`"${key}"`))) return "the item is named in a relation";
      // A table containing only this item has no usable source without a binding, checked by lootItemKeys.
      const otherFacts = { ...input.facts, entities: input.facts.entities.filter((row) => row.entityKey !== key),
        items: input.facts.items.filter((row) => row.entityKey !== key),
        itemLootTables: input.facts.itemLootTables.filter((table) => table.entries.some((entry) => entry.item.entityKey !== key)) };
      if (JSON.stringify(otherFacts).includes(`"${key}"`)) return "another fact names the item";
      if (input.lootItemKeys?.has(key)) return "a loot table grants the item";
      return null;
    }
    case "npcs": {
      if (relations.placements.some((placement) => placement.roles.some((role) => role.npcEntityKey === key))) return "the NPC has a placement";
      if (input.spawnCandidates.has(key)) return "the NPC is a spawn candidate";
      if (reason !== "content-free-record") return null;
      const fact = input.facts.npcs.find((row) => row.entityKey === key);
      if (entity.description?.trim()) return "the NPC has a description";
      // A role flag alone cannot direct a reader to a service without a placement, stock, or quest.
      if (fact && (fact.flightNetwork || fact.adventurer || fact.abilityPhases.some((phase) => phase.abilities.length > 0)
        || fact.factionRewards.length || fact.linkedNpc)) return "the NPC has an ability or gameplay relationship";
      if (relations.drops.some((row) => keyOf(row.owner) === key) || relations.vendors.some((row) => keyOf(row.npc) === key)
        || relations.quests.some((row) => keyOf(row.counterpart) === key)) return "the NPC has drops, stock, or a quest";
      return null;
    }
    case "scenes": {
      if (relations.placements.some((placement) => placement.sceneKey === key)) return "the scene has a placement";
      const place = input.facts.places.find((candidate) => candidate.entityKey === key);
      if ((place?.mapSpaceIds.length ?? 0) > 0) return "the scene has a map space";
      if (reason !== "content-free-record") return null;
      if (!place) return "the scene lacks place facts to verify the exclusion";
      if (entity.description?.trim() || place.guideDescription?.trim()) return "the scene has a description";
      if (entity.artwork.length) return "the scene has artwork";
      if (place.levelRange || place.bosses.length) return "the scene has level or inhabitant facts";
      if (relations.quests.some((row) => row.kind === "objective" && row.task?.target?.entityKey === key)) return "the scene is a quest objective";
      return null;
    }
    case "recipes":
      return relations.recipes.some((row) => keyOf(row.recipe) === key) ? "the recipe has a material or a product" : null;
    case "craftingStations":
      if ((input.placementIdsByKey.get(key)?.length ?? 0) > 0) return "the station has a map spot";
      return input.facts.recipes.some((recipe) => recipe.station?.entityKey === key && !input.excluded.has(recipe.entityKey)) ? "the station makes a published recipe" : null;
    case "skills": {
      const fact = input.facts.progression.facts.find((candidate) => candidate.entityKey === key);
      if (fact?.kind !== "skills") return "the catalog has no skill facts for it";
      return fact.details.maxLevel > 0 || fact.details.automaticallyAdded ? "the skill has levels or is added automatically" : null;
    }
    case "effects": {
      if (plainText(entity.description ?? "")) return "the effect has a gameplay description";
      const fact = input.facts.progression.facts.find((candidate) => candidate.entityKey === key);
      if (fact?.kind !== "effects") return "the catalog has no effect facts";
      const type = fact.details.effectType.name;
      const hasAction = fact.details.ranks.some((rank) =>
        (type === "Stat" && rank.statEffects.length > 0)
        || (["InstantDamage", "DamageOverTime", "InstantHeal", "HealOverTime"].includes(type)
          && (rank.damage !== 0 || rank.alteredStat !== null
            || (["InstantDamage", "DamageOverTime"].includes(type) && (rank.damageType.name !== "None" || Boolean(rank.customDamageType?.trim())))
            || (["InstantHeal", "HealOverTime"].includes(type) && Boolean(rank.customHealingType?.trim()))
            || (rank.damageStat !== null && rank.damageStatModifier !== 0)
            || (rank.skillModifierSkill !== null && rank.skillModifier !== 0)
            || rank.weaponDamageModifier !== 0 || rank.maxHealthModifier !== 0
            || rank.missingHealthModifier !== 0 || rank.lifesteal !== 0 || rank.cannotCrit))
        || (type === "Pet" && (rank.pet !== null || rank.petSpawnCount > 0 || rank.petDuration > 0))
        || (type === "Teleport" && (rank.teleportScene !== null || rank.teleportType.name !== "None"))
        || (type === "Dispel" && (rank.dispelEffect !== null || Boolean(rank.dispelEffectTag)
          || rank.dispelEffectType.name !== "None" || rank.dispelType.name !== "None"))
        || (type === "Knockback" && rank.knockbackDistance !== 0)
        || (type === "Motion" && rank.motionDistance !== 0)
        || (type === "Taunt" && rank.tauntFlatThreat !== 0)
        || (type === "Resurrect" && rank.resurrectHealthPercent !== 0)
        || (type === "RollLootTable" && rank.lootTable !== null));
      if (hasAction) return "the effect has a gameplay action";
      // Applying an effect does not explain its outcome. A condition on an ability or item can explain its role.
      const usedConditions = playerConditionIds(input.facts);
      const used = relations.conditions.some((condition) => usedConditions.has(condition.conditionId)
        && condition.requirements.some((group) => group.requirements.some((requirement) =>
          requirement.type.name === "Effect" && requirement.references.effect?.entityKey === key)));
      return used ? "an ability or item checks this effect" : null;
    }
    case "stats": {
      const fact = input.facts.progression.facts.find((candidate) => candidate.entityKey === key);
      if (fact?.kind !== "stats") return "the catalog has no stat facts";
      const details = fact.details;
      if (details.onHitEffects.length || details.regeneration.some((row) => row.amount !== 0 && row.interval > 0))
        return "the stat has an on-hit effect or recovery mechanic";
      const description = plainText(entity.description ?? "").toLowerCase();
      if (description && !["fall resistance", "the percentage of extra power from crowd control abilities."].includes(description))
        return "the stat has a specific gameplay description";
      const matches = (row: { stat: { entityKey: string | null } }) => row.stat.entityKey === key;
      const grants = (row: { stat: { entityKey: string | null }; amount: number }) => matches(row) && row.amount !== 0;
      if (input.facts.items.some((item) => item.stats.some(grants)
        || item.randomStats.some((row) => matches(row) && (row.min !== 0 || row.max !== 0))
        || item.gem?.stats.some(grants)))
        return "an item or gem grants the stat";
      if (input.facts.gearSets.some((set) => set.tiers.some((tier) => tier.stats.some(grants))))
        return "a gear set grants the stat";
      const connectedEffects = effectPageKeys(input.facts, relations);
      const usedBonuses = new Set(input.facts.progression.talentNodes.flatMap((node) => node.target?.entityKey ? [node.target.entityKey] : []));
      if (input.facts.progression.facts.some((row) =>
        row.kind === "classes" ? row.details.stats.some((stat) => matches(stat) && (stat.amount !== 0 || stat.bonusPerLevel !== 0))
          || row.details.customStats.some((stat) => matches(stat) && (stat.addedValue !== 0 || stat.valuePerLevel !== 0))
        : row.kind === "effects" ? connectedEffects.has(row.entityKey) && !input.excluded.has(row.entityKey) && row.details.ranks.some((rank) => rank.statEffects.some(grants))
        : row.kind === "bonuses" ? usedBonuses.has(row.entityKey) && row.details.ranks.some((rank) => rank.statEffects.some(grants))
        : row.kind === "enchantments" ? row.details.tiers.some((tier) => tier.stats.some(grants))
        : false)) return "a class, talent, effect, or enchantment changes the stat";
      return null;
    }
    default:
      return `the publication has no evidence check for the kind ${entity.kind}`;
  }
}

/** Fails and names the entry when the catalog lacks an excluded key or no longer supports its exclusion. */
export function assertExclusionEvidence(exclusions: readonly PublicationExclusion[], input: ExclusionEvidenceInput): void {
  const entities = new Map(input.entities.map((entity) => [entity.entityKey, entity]));
  for (const exclusion of exclusions) {
    const entity = entities.get(exclusion.key);
    if (!entity) throw new Error(`Exclusion ${exclusion.key} (${exclusion.reason}) names a record that the catalog lacks.`);
    const reason = contradiction(entity, input, exclusion.reason);
    if (reason !== null) throw new Error(`Exclusion ${exclusion.key} (${exclusion.reason}) no longer holds: ${reason}.`);
  }
}
