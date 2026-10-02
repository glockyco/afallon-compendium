import type { CatalogCondition, CatalogEntityRow, CatalogPlacementRow, CatalogQuestRow } from "@afallon/contracts/catalog";
import type { ConnectionRow, CreatureRow, EntityRef, PlaceLootObject, PlacementGroup, PublicLevel, PublicMarkerCategory, PublicPlace, Ref } from "@afallon/contracts/public";
import { markerCategories } from "../categories";
import { levelUnion } from "../levels";
import { npcFact } from "./npcs";
import { baseDocument, type DocumentProjectionInput, endpointOrUnknown, interactionLabel, mergeRefs, pageOrVariant, projectAvailability, publishedPlacements, refKey, type RelationIndexes } from "./projection";
import { propertySceneKey } from "./properties";
import { displayName } from "../text";

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
function creaturesForPlace(placements: readonly CatalogPlacementRow[], input: DocumentProjectionInput, indexes: RelationIndexes, hostile: boolean): CreatureRow[] {
  const byPage = new Map<string, { refs: Ref[]; placementIds: Set<string>; levels: PublicLevel[]; roles: Set<PublicMarkerCategory> }>();
  for (const placement of placements) {
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

/**
 * The objects of a place that give items when used, such as graves and locked chests. A placed gathering node is a node,
 * so the node pages list it. Objects with the same label, cost, choice, and availability merge, and keep their items in
 * order of first appearance. A variant keeps only the spots inside it.
 */
function lootObjects(placeKey: string, host: { key: string; here: ReadonlySet<string> } | undefined, input: DocumentProjectionInput,
  indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): PlaceLootObject[] {
  const groups = new Map<string, { object: Omit<PlaceLootObject, "items" | "placements">; items: Map<string, Ref>; placements: Set<string> }>();
  const rows = [
    ...(indexes.interactionsByPlace.get(placeKey) ?? []).map((row) => ({ row, placementIds: row.placementIds })),
    ...(host ? (indexes.interactionsByPlace.get(host.key) ?? []).flatMap((row) => {
      const placementIds = row.placementIds.filter((id) => host.here.has(id));
      return placementIds.length ? [{ row, placementIds }] : [];
    }) : []),
  ];
  for (const { row, placementIds } of rows) {
    if (indexes.placedNodes.has(row.sourceId)) continue;
    const object = {
      label: interactionLabel(row.objectName), ...(row.choiceLabel ? { choiceLabel: displayName(row.choiceLabel) } : {}),
      ...(row.cost ? { cost: { currency: input.resolve(row.cost.currency), amount: row.cost.amount } } : {}),
      // The conditions of one object come in no fixed order, so they are sorted by their text.
      availability: projectAvailability(row.availability, conditions, input.resolve)
        .map((rule) => ({ rule, text: JSON.stringify([rule.effect, rule.requirements.map((group) => group.requirements.map((requirement) => requirement.label))]) }))
        .sort((left, right) => left.text.localeCompare(right.text)).map(({ rule }) => rule),
    };
    // Rows merge by what a reader sees, so two conditions with the same text are one row.
    const key = JSON.stringify([object.label, object.choiceLabel, object.cost?.amount, object.cost ? refKey(object.cost.currency) : null,
      object.availability.map((rule) => [rule.effect, rule.requirements.map((group) => group.requirements.map((requirement) => requirement.label))])]);
    const group = groups.get(key) ?? { object, items: new Map(), placements: new Set() };
    const item = input.resolve(row.item);
    group.items.set(refKey(item), item);
    for (const id of placementIds) group.placements.add(id);
    groups.set(key, group);
  }
  return [...groups.values()].map(({ object, items, placements }) => ({ ...object, items: [...items.values()], placements: publishedPlacements([...placements].sort(), input.placements) }))
    .sort((left, right) => right.placements.length - left.placements.length || left.label.localeCompare(right.label));
}

export function projectPlace(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): PublicPlace {
  const fact = input.facts.places.find((candidate) => candidate.entityKey === entity.entityKey);
  const mapSpaceId = fact?.mapSpaceIds.find((candidate) => input.regionIdsByMapSpace.has(candidate)) ?? null;
  const placeType = fact?.placeType ?? (entity.kind === "regions" ? "region" : "zone");
  const variant = input.placeVariants?.get(entity.entityKey);
  const placePlacements = (indexes.placementsByScene.get(entity.entityKey) ?? []).filter((placement) => !variant?.copiedPlacementIds.has(placement.placementId));
  const serviceCategories = { merchant: true, auctioneer: true, banker: true, questGiver: true, flightPoint: true, townsfolk: true,
    craftingStation: true, alchemyStation: true, cookingStation: true, smithingStation: true, furnace: true, tailoringStation: true,
    travelPoint: true, neutral: true } as const;
  const resourceCategories: Record<string, true> = { oreVein: true, herb: true, mushroom: true, fishingSpot: true };
  if (variant) resourceCategories.interactiveObject = true;
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
    if (variant && !placedHere(row.placementIds)) return [];
    const direction = startsHere && endsHere ? "within" : startsHere ? "to" : "from";
    const counterpartKey = direction === "from" ? row.sourceSceneKey : row.destinationSceneKey;
    return [{ counterpart: endpointOrUnknown(input.resolve, counterpartKey === null ? null : { entityKey: counterpartKey, label: counterpartKey }, "Unknown place"), direction, placements: publishedPlacements(row.placementIds, input.placements) }];
  });
  return {
    ...baseDocument(entity, ref, input, fact?.guideDescription),
    facts: { placeType, ...(fact?.levelRange ? { levelRange: fact.levelRange } : {}), guideIncluded: fact?.guideIncluded ?? false },
    space: mapSpaceId === null ? null : { mapSpaceId, regionIds: variant ? [] : [...(input.regionIdsByMapSpace.get(mapSpaceId) ?? [])], ...(variant ? { placementIds: [...here].sort() } : {}) },
    ...(variant ? { variantOf: input.resolve({ entityKey: variant.hostKey, label: variant.hostKey }) } : {}),
    bosses: mergeRefs((fact?.bosses ?? []).filter((boss) => !variant || npcPlacedHere(boss.entityKey)).map((boss) => input.resolve(boss)), input), creatures: creaturesForPlace(placePlacements, input, indexes, true), npcs: creaturesForPlace(placePlacements, input, indexes, false),
    services: placementGroups(placePlacements, serviceCategories, input), resources: placementGroups(placePlacements, resourceCategories, input), containers: placementGroups(placePlacements, containerCategories, input),
    lootObjects: lootObjects(entity.entityKey, variant ? { key: variant.hostKey, here } : undefined, input, indexes, conditions),
    quests: questRefs(startsHere), questObjectives: questRefs(objectiveHere),
    properties: input.facts.properties.filter((property) => propertySceneKey(property.entityKey, input) === entity.entityKey).map((property) => input.resolve({ entityKey: property.entityKey, label: property.entityKey })),
    connections, regions: variant ? [] : input.facts.places.filter((candidate) => candidate.placeType === "region" && candidate.parentSceneKey === entity.entityKey).map((candidate) => input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey })),
    ...(fact?.parentSceneKey ? { parent: input.resolve({ entityKey: fact.parentSceneKey, label: fact.parentSceneKey }) } : {}),
  };
}
