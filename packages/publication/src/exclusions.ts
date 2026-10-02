import type { CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogRelations } from "@afallon/contracts/catalog";
import type { EntityRef, PublicationExclusion } from "@afallon/contracts/public";

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
    case "npcs":
      if (relations.placements.some((placement) => placement.roles.some((role) => role.npcEntityKey === key))) return "the NPC has a placement";
      return input.spawnCandidates.has(key) ? "the NPC is a spawn candidate" : null;
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
