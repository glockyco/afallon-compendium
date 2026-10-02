import type { CatalogCondition, CatalogEntityRow, CatalogPlacementRow, CatalogQuestRow } from "@afallon/contracts/catalog";
import { type CreatureRow, type EntityRef, isEntityRef, type PlaceEntrance, type PlaceLootObject, type PlacementGroup, type PlacementRef, type PlaceToEnter, type PublicLevel, type PublicMarkerCategory, type PublicPlace, type Ref, type TimedDungeon } from "@afallon/contracts/public";
import { CORRUPTION_NATIVE_RULES } from "../corruption-rules";
import { markerCategories } from "../categories";
import { levelUnion } from "../levels";
import { npcFact } from "./npcs";
import { baseDocument, type DocumentProjectionInput, interactionLabel, mergeRefs, pageOrVariant, projectAvailability, publishedPlacements, refKey, type RelationIndexes } from "./projection";
import { topicRef } from "../placed-rules";
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
    const published = input.placements.get(placement.placementId);
    if (!published) continue;
    for (const npcKey of new Set(placement.roles.map((role) => role.npcEntityKey))) {
      if (npcKey === null) continue;
      const ref = input.resolve({ entityKey: npcKey, label: npcKey });
      const row = byPage.get(refKey(ref)) ?? { refs: [], placementIds: new Set<string>(), levels: [], roles: new Set<PublicMarkerCategory>() };
      row.refs.push(ref);
      row.placementIds.add(published.placementId);
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

const refName = (ref: Ref) => isEntityRef(ref) ? ref.name : ref.label;

// The services that a player uses. Townsfolk, neutral creatures, and travel points are not services.
const SERVICE_CATEGORIES = { merchant: true, auctioneer: true, banker: true, questGiver: true, flightPoint: true,
  craftingStation: true, alchemyStation: true, cookingStation: true, smithingStation: true, furnace: true, tailoringStation: true } as const;

const routesByInput = new WeakMap<DocumentProjectionInput, ReturnType<typeof computePlaceRoutes>>();

/** How places relate: each place's map space, whether it is a challenge stone or the overworld, and its teleport depth. */
function placeRoutes(input: DocumentProjectionInput) {
  let routes = routesByInput.get(input);
  if (!routes) routesByInput.set(input, routes = computePlaceRoutes(input));
  return routes;
}

function computePlaceRoutes(input: DocumentProjectionInput) {
  const facts = new Map(input.facts.places.map((fact) => [fact.entityKey, fact]));
  const mapSpace = (key: string) => facts.get(key)?.mapSpaceIds.find((candidate) => input.regionIdsByMapSpace.has(candidate)) ?? null;
  const challengeStone = (key: string) => (input.challengeStones?.has(key) ?? false) || (input.placeVariants?.has(key) ?? false);
  const overworld = (key: string) => { const space = mapSpace(key); return space !== null && (input.overworldMapSpaceIds?.has(space) ?? false) && !challengeStone(key); };
  // The fewest teleports from the overworld to each place. A teleport into a place from a deeper place is its way back.
  const depth = new Map(input.facts.places.filter((fact) => overworld(fact.entityKey)).map((fact) => [fact.entityKey, 0]));
  for (let frontier = [...depth.keys()]; frontier.length;) {
    const next: string[] = [];
    for (const row of input.relations.transitions) {
      const { sourceSceneKey: source, destinationSceneKey: destination } = row;
      if (source === null || destination === null || !frontier.includes(source) || depth.has(destination) || challengeStone(destination)) continue;
      depth.set(destination, depth.get(source)! + 1);
      next.push(destination);
    }
    frontier = next;
  }
  return { facts, mapSpace, challengeStone, overworld, depth };
}

/**
 * The places that a player enters this place from, merged by place. Copies of the entrance in challenge stones do not count,
 * and neither does the way back from a place that is farther from the overworld.
 */
function entrances(placeKey: string, input: DocumentProjectionInput, routes: ReturnType<typeof placeRoutes>): PlaceEntrance[] {
  if (routes.overworld(placeKey) || routes.challengeStone(placeKey) || routes.mapSpace(placeKey) === null) return [];
  const depth = routes.depth.get(placeKey) ?? Infinity;
  const bySource = new Map<string, string[]>();
  for (const row of input.relations.transitions) {
    const source = row.sourceSceneKey;
    if (row.destinationSceneKey !== placeKey || source === null || source === placeKey || routes.challengeStone(source)) continue;
    if ((routes.depth.get(source) ?? Infinity) > depth) continue;
    bySource.set(source, [...bySource.get(source) ?? [], ...row.placementIds]);
  }
  return [...bySource].map(([source, ids]) => ({ place: input.resolve({ entityKey: source, label: source }), placements: publishedPlacements(ids, input.placements) }))
    .sort((left, right) => Number(routes.overworld(right.place.key ?? "")) - Number(routes.overworld(left.place.key ?? "")) || refName(left.place).localeCompare(refName(right.place)));
}

const PLACE_GROUP_ORDER: Record<PlaceToEnter["group"], number> = { dungeon: 0, challengeStone: 1, other: 2 };

/** The places with their own map that a player enters from the overworld, and the challenge stones that it holds. */
function placesToEnter(placeKey: string, input: DocumentProjectionInput, routes: ReturnType<typeof placeRoutes>): PlaceToEnter[] {
  if (!routes.overworld(placeKey)) return [];
  const space = routes.mapSpace(placeKey);
  const spots = new Map<string, string[]>();
  for (const row of input.relations.transitions) {
    const destination = row.destinationSceneKey;
    if (row.sourceSceneKey !== placeKey || destination === null || destination === placeKey || routes.challengeStone(destination)) continue;
    const destinationSpace = routes.mapSpace(destination);
    if (destinationSpace === null || input.overworldMapSpaceIds?.has(destinationSpace)) continue;
    spots.set(destination, [...spots.get(destination) ?? [], ...row.placementIds]);
  }
  const rows: PlaceToEnter[] = [];
  const add = (key: string, group: PlaceToEnter["group"], placements: PlacementRef[]) => {
    const ref = input.resolve({ entityKey: key, label: key });
    if (!isEntityRef(ref) || ref.kind !== "places") return;
    const levelRange = routes.facts.get(key)?.levelRange;
    rows.push({ place: ref, group, ...(levelRange ? { levelRange } : {}), placements });
  };
  for (const [key, ids] of spots) add(key, routes.facts.get(key)?.placeType === "dungeon" ? "dungeon" : "other", publishedPlacements(ids, input.placements));
  for (const [key, spot] of input.challengeStones ?? []) if (spot.mapSpaceId === space) add(key, "challengeStone", [spot]);
  return rows.sort((left, right) => PLACE_GROUP_ORDER[left.group] - PLACE_GROUP_ORDER[right.group] || left.place.name.localeCompare(right.place.name));
}

/** The timer, thresholds, reward bag, and altars of a timed dungeon. */
function timedDungeon(placeKey: string, input: DocumentProjectionInput, altarIds: readonly string[]): TimedDungeon | undefined {
  const corruption = input.facts.corruption;
  const row = corruption?.dungeons.find((dungeon) => dungeon.scene.entityKey === placeKey);
  if (!corruption || !row) return undefined;
  const thresholds = [
    ...(row.firstRemainingSeconds === null ? [] : [{ remainingSeconds: row.firstRemainingSeconds, tokenLevels: CORRUPTION_NATIVE_RULES.completionFirstBonus }]),
    ...(row.secondRemainingSeconds === null ? [] : [{ remainingSeconds: row.secondRemainingSeconds, tokenLevels: CORRUPTION_NATIVE_RULES.completionSecondBonus }]),
  ];
  const tokenEndpoint = row.token ?? corruption.token;
  const token = tokenEndpoint?.entityKey ? input.resolve({ entityKey: tokenEndpoint.entityKey, label: tokenEndpoint.label ?? tokenEndpoint.entityKey }) : undefined;
  return {
    ...(row.totalSeconds === null ? {} : { totalSeconds: row.totalSeconds }), thresholds,
    ...(row.maxLootItems === null ? {} : { maxLootItems: row.maxLootItems }), ...(token && isEntityRef(token) ? { token } : {}),
    altars: publishedPlacements(altarIds, input.placements), guide: topicRef("corruption"),
  };
}
/** Name only playable races with a resolved start in this scene; an unresolved start never counts as "all races". */
function startingRaces(placeKey: string, input: DocumentProjectionInput): Pick<PublicPlace, "startingRaces" | "allPlayableRacesStartHere"> {
  const playable = new Set(input.facts.progression.facts
    .filter((fact) => fact.kind === "races" && fact.details.offeredClasses.length > 0)
    .map((fact) => fact.entityKey));
  const starting = new Map<string, PublicPlace["startingRaces"][number]>();
  for (const start of input.facts.raceStarts) {
    const raceKey = start.race.entityKey;
    if (start.scene?.entityKey !== placeKey || raceKey === null || !playable.has(raceKey)) continue;
    const race = input.resolve(start.race);
    if (!isEntityRef(race) || race.kind !== "races") continue;
    starting.set(raceKey, { entityKey: raceKey, name: race.name });
  }
  const races = [...starting.values()].sort((left, right) => left.name.localeCompare(right.name) || left.entityKey.localeCompare(right.entityKey));
  return { startingRaces: races, allPlayableRacesStartHere: playable.size > 0 && races.length === playable.size };
}

export function projectPlace(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): PublicPlace {
  const fact = input.facts.places.find((candidate) => candidate.entityKey === entity.entityKey);
  const mapSpaceId = fact?.mapSpaceIds.find((candidate) => input.regionIdsByMapSpace.has(candidate)) ?? null;
  const placeType = fact?.placeType ?? (entity.kind === "regions" ? "region" : "zone");
  const variant = input.placeVariants?.get(entity.entityKey);
  // A placement whose published area exactly names an unmapped zone proves its inhabitants and quests are there.
  const namedArea = mapSpaceId === null && placeType === "zone" && (fact?.guideDescription?.trim() || entity.description?.trim())
    ? displayName(entity.name ?? "") : "";
  const placePlacements = (namedArea
    ? input.relations.placements.filter((placement) => input.placements.get(placement.placementId)?.label === namedArea)
    : indexes.placementsByScene.get(entity.entityKey) ?? [])
    .filter((placement) => !variant?.copiedPlacementIds.has(placement.placementId));
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
  const routes = placeRoutes(input);
  const altarIds = [...here].filter((id) => input.placements.get(id)!.categories.includes("corruptionAltar")).sort();
  const finder = input.facts.dungeonFinder;
  const supplyPack = finder?.supplyPack?.entityKey ? input.resolve({ entityKey: finder.supplyPack.entityKey, label: finder.supplyPack.label ?? finder.supplyPack.entityKey }) : undefined;
  const timed = timedDungeon(entity.entityKey, input, altarIds);
  return {
    ...baseDocument(entity, ref, input, fact?.guideDescription),
    facts: { placeType, ...(fact?.levelRange ? { levelRange: fact.levelRange } : {}), guideIncluded: fact?.guideIncluded ?? false },
    space: mapSpaceId === null ? null : { mapSpaceId, regionIds: variant ? [] : [...(input.regionIdsByMapSpace.get(mapSpaceId) ?? [])], ...(variant ? { placementIds: [...new Set([...here].map((id) => input.placements.get(id)!.placementId))].sort() } : {}) },
    ...(variant ? { variantOf: input.resolve({ entityKey: variant.hostKey, label: variant.hostKey }) } : {}),
    bosses: mergeRefs((fact?.bosses ?? []).filter((boss) => !variant || npcPlacedHere(boss.entityKey)).map((boss) => input.resolve(boss)), input), creatures: creaturesForPlace(placePlacements, input, indexes, true), npcs: creaturesForPlace(placePlacements, input, indexes, false),
    services: placementGroups(placePlacements, SERVICE_CATEGORIES, input), resources: placementGroups(placePlacements, resourceCategories, input), containers: placementGroups(placePlacements, containerCategories, input),
    lootObjects: lootObjects(entity.entityKey, variant ? { key: variant.hostKey, here } : undefined, input, indexes, conditions),
    quests: questRefs(startsHere), questObjectives: questRefs(objectiveHere),
    properties: input.facts.properties.filter((property) => propertySceneKey(property.entityKey, input) === entity.entityKey).map((property) => input.resolve({ entityKey: property.entityKey, label: property.entityKey })),
    ...startingRaces(entity.entityKey, input),
    entrances: entrances(entity.entityKey, input, routes), placesToEnter: placesToEnter(entity.entityKey, input, routes),
    regions: variant ? [] : input.facts.places.filter((candidate) => candidate.placeType === "region" && candidate.parentSceneKey === entity.entityKey).map((candidate) => input.resolve({ entityKey: candidate.entityKey, label: candidate.entityKey })),
    ...(fact?.parentSceneKey ? { parent: input.resolve({ entityKey: fact.parentSceneKey, label: fact.parentSceneKey }) } : {}),
    ...(finder?.dungeons.some((dungeon) => dungeon.entityKey === entity.entityKey) ? { dungeonFinder: supplyPack && isEntityRef(supplyPack) ? { supplyPack } : {} } : {}),
    ...(timed ? { timedDungeon: timed } : {}),
  };
}
