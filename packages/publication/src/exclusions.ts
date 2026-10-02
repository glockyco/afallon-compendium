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
function contradiction(entity: CatalogEntityRow, input: ExclusionEvidenceInput): string | null {
  const key = entity.entityKey, relations = input.relations;
  switch (entity.kind) {
    case "items": {
      const sources = relations.drops.some((row) => keyOf(row.item) === key) || relations.vendors.some((row) => keyOf(row.item) === key)
        || relations.gathers.some((row) => keyOf(row.item) === key) || relations.containers.some((row) => keyOf(row.item) === key)
        || relations.interactions.some((row) => keyOf(row.item) === key)
        || relations.quests.some((row) => keyOf(row.counterpart) === key && (row.kind === "reward" || row.kind === "rewardChoice" || row.kind === "itemGiven"))
        || relations.recipes.some((row) => keyOf(row.item) === key && row.role === "product") || (input.startingGear.get(key)?.length ?? 0) > 0;
      return sources ? "the item has a source" : null;
    }
    case "npcs":
      if (relations.placements.some((placement) => placement.roles.some((role) => role.npcEntityKey === key))) return "the NPC has a placement";
      return input.spawnCandidates.has(key) ? "the NPC is a spawn candidate" : null;
    case "scenes":
      if (relations.placements.some((placement) => placement.sceneKey === key)) return "the scene has a placement";
      return (input.facts.places.find((place) => place.entityKey === key)?.mapSpaceIds.length ?? 0) > 0 ? "the scene has a map space" : null;
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
    const reason = contradiction(entity, input);
    if (reason !== null) throw new Error(`Exclusion ${exclusion.key} (${exclusion.reason}) no longer holds: ${reason}.`);
  }
}
