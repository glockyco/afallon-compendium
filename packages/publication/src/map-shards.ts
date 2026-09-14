import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import { queryCatalogFullEntity, queryCatalogMap, queryCatalogMaps, queryCatalogSearch, queryCatalogSpatialContext, type CatalogMapPlacement, type CatalogMapRegion, type CatalogSpatialContext } from "@afallon/catalog";
import {
  PUBLIC_MARKER_CATEGORY_VALUES,
  StaticMapShardSchema,
  type PublicMarkerCategory,
  type PublicMovement,
  type PublicPatrolPath,
  type PublicPlacement,
  type PublicRegion,
  type PublicTravel,
  type PublicWorldOffset,
  type StaticMapShard,
  type StaticMapSummary,
} from "@afallon/contracts/public";
import { writeStaticJson, type GeneratedStaticResource } from "./resources";

const ROLE_CATEGORIES: Readonly<Record<string, PublicMarkerCategory | null>> = {
  enemy: "enemy", boss: "boss", elite: "enemy", neutral: "neutral", friendly: "townsfolk", npc: null,
  merchant: "merchant", questGiver: "questGiver", resourceProducer: null, oreVein: "oreVein", herb: "herb",
  mushroom: "mushroom", fishingHole: "fishingSpot", container: "container", storage: "container",
  transition: "travelPoint", respawnDestination: "graveyard", usefulInteraction: "interactiveObject",
  questLocation: "interactiveObject", craftingService: "craftingStation", propertyPurchaseService: "property",
  corruptionAltar: "corruptionAltar", combatant: null, dialogue: null, inspect: null, trade: null,
  adventurerProducer: null, adventurerPopulationManager: null,
};
const MAP_ICON_CATEGORIES: Readonly<Record<string, PublicMarkerCategory>> = {
  town: "town", fort: "fort", camp: "camp", dungeon: "dungeonEntrance", challengeStone: "challengeStone",
};
const CATEGORY_LABELS: Readonly<Record<PublicMarkerCategory, string>> = {
  boss: "Boss", enemy: "Enemy", neutral: "Neutral", merchant: "Merchant", questGiver: "Quest giver",
  townsfolk: "Townsfolk", craftingStation: "Crafting station", container: "Container", oreVein: "Ore Vein",
  herb: "Herb", mushroom: "Mushroom", fishingSpot: "Fishing Spot", interactiveObject: "Interactive object",
  town: "Town", fort: "Fort", camp: "Camp", property: "Property", dungeonEntrance: "Dungeon entrance",
  corruptionAltar: "Altar of corruption", challengeStone: "Challenge stone", graveyard: "Graveyard", travelPoint: "Travel point",
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function plainText(value: string): string {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(?:color|size|b|i|u|s|font|font-weight|mark|link|align|alpha|cspace|indent|line-height|line-indent|margin|margin-left|margin-right|mspace|nobr|pos|rotate|space|style|sub|sup|voffset|width|uppercase|lowercase|smallcaps)(?:=[^>]*|\s[^>]*)?>/gi, "").trim();
}
function levelRange(min: unknown, max: unknown): { min: number; max: number } | undefined {
  return typeof min === "number" && Number.isInteger(min) && min >= 1 && typeof max === "number" && Number.isInteger(max) && max >= min && (min !== 100 || max !== 100) ? { min, max } : undefined;
}
function gameplayLevelRange(gameplay: unknown): { min: number; max: number } | undefined {
  const value = record(gameplay);
  if (!value) return undefined;
  const candidates: ReadonlyArray<readonly [string, string]> = [["minLevel", "maxLevel"], ["dungeonLevelMin", "dungeonLevelMax"], ["zoneScalingMinLevel", "zoneScalingMaxLevel"], ["levelRangeMin", "levelRangeMax"], ["LevelRangeMin", "LevelRangeMax"]];
  for (const [min, max] of candidates) {
    const range = levelRange(value[min], value[max]);
    if (range) return range;
  }
  return undefined;
}
function placementLevelRange(placement: CatalogMapPlacement, gameplayByNpc: ReadonlyMap<string, unknown>): { min: number; max: number } | undefined {
  const sourceRanges = placement.sourceDetails.map(({ data }) => {
    const overrides = record(data.overrides), levels = record(overrides?.levels), scaling = record(overrides?.zoneScaling);
    return {
      override: levels?.enabled === true ? levelRange(levels.minLevel, levels.maxLevel) : undefined,
      scaling: scaling?.enabled === true ? levelRange(scaling.minLevel, scaling.maxLevel) : undefined,
      direct: [levelRange(data.LevelRangeMin, data.LevelRangeMax), levelRange(data.levelRangeMin, data.levelRangeMax)],
    };
  });
  const canonical = placement.roles.flatMap((role) => role.npcEntityKey === null ? [] : [gameplayLevelRange(gameplayByNpc.get(role.npcEntityKey))]);
  for (const ranges of [sourceRanges.map((range) => range.override), sourceRanges.map((range) => range.scaling), [...sourceRanges.flatMap((range) => range.direct), ...canonical]]) {
    const known = ranges.filter((range): range is { min: number; max: number } => range !== undefined);
    if (known.length === 0) continue;
    return known.every((range) => range.min === known[0]!.min && range.max === known[0]!.max) ? known[0] : undefined;
  }
  return undefined;
}
function placementAreas(placement: CatalogMapPlacement): Array<Array<[number, number]>> {
  const shape = record(placement.shape), radius = shape?.radius;
  if (shape?.kind === "point" || typeof radius !== "number" || radius <= 0) return [];
  return [Array.from({ length: 48 }, (_, index) => {
    const angle = index * Math.PI * 2 / 48;
    return [placement.position[0] + radius * Math.cos(angle), placement.position[1] + radius * Math.sin(angle)] as [number, number];
  })];
}
function sourceName(placement: CatalogMapPlacement): string | null {
  for (const { data } of placement.sourceDetails) {
    const values: unknown[] = [data.interactableName, data.chestName, record(data.station)?.name, record(data.property)?.name];
    const name = values.find((value) => typeof value === "string" && value.trim().length > 0);
    if (typeof name === "string") return plainText(name);
  }
  return null;
}
function position(value: unknown): { x: number; y: number; z: number } | null {
  const point = record(value);
  return point && typeof point.x === "number" && Number.isFinite(point.x) && typeof point.y === "number" && Number.isFinite(point.y) && typeof point.z === "number" && Number.isFinite(point.z) ? { x: point.x, y: point.y, z: point.z } : null;
}
function pathByName(name: string, placement: CatalogMapPlacement, spatial: CatalogSpatialContext): PublicPatrolPath {
  const matches = spatial.patrolPaths.filter((path) => path.sceneNativeId === placement.sceneNativeId && path.name === name);
  if (matches.length === 0) return { name, status: "unresolved", reason: "The source scene has no patrol path with this name." };
  if (matches.length > 1) return { name, status: "unresolved", reason: "The source scene has more than one patrol path with this name." };
  const path = matches[0]!;
  if (path.worldPoints.length === 0) return { name, status: "unresolved", reason: "The patrol path has no authored points." };
  return { name, status: "resolved", looping: path.looping, groupPatrol: path.groupPatrol, groupSpacing: path.groupSpacing, poiRadius: path.poiRadius, points: path.worldPoints.map((point) => [point.x, point.z]) };
}
function movementForPlacement(placement: CatalogMapPlacement, gameplayByEntity: ReadonlyMap<string, unknown>, spatial: CatalogSpatialContext): PublicMovement[] {
  const movements: PublicMovement[] = [];
  const entityKeys = [...new Set(placement.roles.flatMap((role) => role.npcEntityKey === null ? [] : [role.npcEntityKey]))];
  for (const entityKey of entityKeys) {
    const gameplay = record(gameplayByEntity.get(entityKey));
    for (const rawPhase of Array.isArray(gameplay?.aiPhases) ? gameplay.aiPhases : []) {
      const phase = record(rawPhase);
      if (!phase || !Number.isSafeInteger(phase.phaseIndex)) continue;
      for (const rawBehavior of Array.isArray(phase.behaviors) ? phase.behaviors : []) {
        const behavior = record(rawBehavior), movement = record(behavior?.movement);
        if (!behavior || !movement || !Number.isSafeInteger(behavior.behaviorIndex) || typeof behavior.chance !== "number") continue;
        const owner = { kind: "npcBehavior" as const, entityKey, phaseIndex: phase.phaseIndex as number, behaviorIndex: behavior.behaviorIndex as number, chance: behavior.chance };
        if (movement.kind === "roaming" && typeof movement.roamDistance === "number" && typeof movement.roamAroundSpawner === "boolean" && typeof movement.usePOIs === "boolean") {
          const poiPathName = typeof movement.poiPathName === "string" && movement.poiPathName.length > 0 ? movement.poiPathName : undefined;
          movements.push({ owner, kind: "roaming", distance: movement.roamDistance, aroundSpawner: movement.roamAroundSpawner, usePois: movement.usePOIs, ...(poiPathName ? { poiPathName, poiPath: pathByName(poiPathName, placement, spatial) } : {}), ...(typeof movement.poiRoamRadius === "number" ? { poiRoamRadius: movement.poiRoamRadius } : {}) });
        } else if (movement.kind === "patrol" && typeof movement.randomPath === "boolean") {
          const names = movement.randomPath ? (Array.isArray(movement.patrolPathNames) ? movement.patrolPathNames : []).filter((name): name is string => typeof name === "string" && name.length > 0) : typeof movement.patrolPathName === "string" && movement.patrolPathName.length > 0 ? [movement.patrolPathName] : [];
          if (names.length > 0) movements.push({ owner, kind: "patrol", randomPath: movement.randomPath, paths: [...new Set(names)].map((name) => pathByName(name, placement, spatial)) });
        }
      }
    }
  }
  for (const source of placement.sourceDetails.filter((detail) => detail.family === "npcProducer")) {
    const patrol = record(record(source.data.overrides)?.patrol), path = record(patrol?.path);
    if (patrol?.enabled !== true || !path || typeof path.name !== "string" || path.name.length === 0) continue;
    const rawPoints = Array.isArray(path.points) ? path.points : [];
    const points = rawPoints.flatMap((rawPoint) => {
      const point = position(record(rawPoint)?.position);
      return point ? [[point.x, point.z] as [number, number]] : [];
    });
    const publicPath: PublicPatrolPath = points.length === rawPoints.length && points.length > 0 ? { name: path.name, status: "resolved", looping: path.looping === true, groupPatrol: path.groupPatrol === true, groupSpacing: typeof path.groupSpacing === "number" ? path.groupSpacing : 0, poiRadius: typeof path.poiRadius === "number" ? path.poiRadius : 0, points } : { name: path.name, status: "unresolved", reason: "A spawner patrol path point does not resolve uniquely to the placement map." };
    movements.push({ owner: { kind: "spawnerOverride" }, kind: "patrol", randomPath: false, paths: [publicPath] });
  }
  return movements;
}

type TravelTarget = { sceneNativeId: number; position: { x: number; y: number; z: number } | null };
function findTravelTarget(value: unknown, sourceSceneNativeId: number): TravelTarget | null {
  if (Array.isArray(value)) {
    for (const child of value) { const target = findTravelTarget(child, sourceSceneNativeId); if (target) return target; }
    return null;
  }
  const candidate = record(value);
  if (!candidate) return null;
  const effect = record(candidate.effectTeleport);
  if (effect) {
    const type = record(effect.type), point = position(effect.position);
    if (type?.name === "position" && point) return { sceneNativeId: sourceSceneNativeId, position: point };
    const destination = record(effect.destinationScene);
    if (type?.name === "gameScene" && typeof destination?.nativeId === "number" && Number.isInteger(destination.nativeId) && point) return { sceneNativeId: destination.nativeId, position: point };
  }
  const teleport = record(candidate.teleport);
  if (teleport) {
    const type = record(teleport.type), point = position(teleport.position);
    if (type?.name === "Position" && point) return { sceneNativeId: sourceSceneNativeId, position: point };
    if (type?.name === "GameScene" && typeof teleport.sceneNativeId === "number" && Number.isInteger(teleport.sceneNativeId)) return { sceneNativeId: teleport.sceneNativeId, position: null };
  }
  for (const child of Object.values(candidate)) { const target = findTravelTarget(child, sourceSceneNativeId); if (target) return target; }
  return null;
}
function contains(domainValue: Record<string, unknown>, point: { x: number; y: number; z: number }): boolean {
  if (domainValue.kind !== "boxes" || !Array.isArray(domainValue.boxes)) return false;
  return domainValue.boxes.some((boxValue) => {
    const box = record(boxValue), min = record(box?.min), max = record(box?.max);
    return min && max && typeof min.x === "number" && typeof min.y === "number" && typeof min.z === "number" && typeof max.x === "number" && typeof max.y === "number" && typeof max.z === "number" && point.x >= min.x && point.x <= max.x && point.y >= min.y && point.y <= max.y && point.z >= min.z && point.z <= max.z;
  });
}
function resolveTravelPoint(target: { sceneNativeId: number; position: { x: number; y: number; z: number } }, spatial: CatalogSpatialContext): { mapSpaceId: string; position: [number, number] } | null {
  const matches = spatial.bindings.filter((binding) => binding.sceneNativeId === target.sceneNativeId && contains(binding.domain, target.position));
  if (matches.length !== 1) return null;
  const binding = matches[0]!, origin = record(binding.frame.origin), xAxis = record(binding.frame.xAxis), yAxis = record(binding.frame.yAxis);
  if (!origin || !xAxis || !yAxis || typeof origin.x !== "number" || typeof origin.z !== "number" || typeof xAxis.x !== "number" || typeof xAxis.z !== "number" || typeof yAxis.x !== "number" || typeof yAxis.z !== "number") return null;
  const dx = target.position.x - origin.x, dz = target.position.z - origin.z;
  return { mapSpaceId: binding.mapSpaceId, position: [dx * xAxis.x + dz * xAxis.z, dx * yAxis.x + dz * yAxis.z] };
}
function travelForPlacement(placement: CatalogMapPlacement, spatial: CatalogSpatialContext): PublicTravel | undefined {
  if (!placement.roles.some((role) => role.role === "transition")) return undefined;
  const source = placement.sourceDetails.find((detail) => Array.isArray(detail.data.actions));
  if (!source) return { transitionId: placement.placementId, enabled: true, destination: { status: "unresolved", reason: "No normalized transition source is available." } };
  const transitionId = typeof source.data.transitionId === "string" ? source.data.transitionId : source.sourceId;
  const sourceRecord = record(source.data.source), enabled = sourceRecord?.enabled !== false;
  const target = findTravelTarget(source.data.actions, placement.sceneNativeId);
  if (!target) return { transitionId, enabled, destination: { status: "unresolved", reason: "Transition destination is unresolved." } };
  const spawn = target.position === null ? spatial.sceneSpawns.find((candidate) => candidate.sceneNativeId === target.sceneNativeId)?.position : target.position;
  if (!spawn) return { transitionId, enabled, destination: { status: "unresolved", reason: "Destination scene has no start position record." } };
  const destination = resolveTravelPoint({ sceneNativeId: target.sceneNativeId, position: spawn }, spatial);
  return destination ? { transitionId, enabled, destination: { status: "resolved", ...destination } } : { transitionId, enabled, destination: { status: "unresolved", reason: "Verified destination has no published map position." } };
}

function offsetMovement(movements: readonly PublicMovement[], offset: { worldX: number; worldY: number }): PublicMovement[] {
  return movements.map((movement) => movement.kind === "roaming"
    ? { ...movement, ...(movement.poiPath ? { poiPath: offsetPath(movement.poiPath, offset) } : {}) }
    : { ...movement, paths: movement.paths.map((path) => offsetPath(path, offset)) });
}
function offsetPath(path: PublicPatrolPath, offset: { worldX: number; worldY: number }): PublicPatrolPath {
  return path.status === "resolved" && path.points ? { ...path, points: path.points.map(([x, y]) => [x + offset.worldX, y + offset.worldY]) } : path;
}
function offsetTravel(travel: PublicTravel | undefined, offsets: ReadonlyMap<string, { worldX: number; worldY: number }>): PublicTravel | undefined {
  if (travel?.destination.status !== "resolved" || !travel.destination.mapSpaceId || !travel.destination.position) return travel;
  const offset = offsets.get(travel.destination.mapSpaceId);
  return offset ? { ...travel, destination: { ...travel.destination, position: [travel.destination.position[0] + offset.worldX, travel.destination.position[1] + offset.worldY] } } : { ...travel, destination: { status: "unresolved", reason: "Verified destination has no published map position." } };
}

function categories(roles: readonly { role: string; scope: string }[]): PublicMarkerCategory[] {
  if (roles.some((role) => role.role === "adventurer")) return [];
  const found = new Set<PublicMarkerCategory>();
  for (const role of roles) {
    const category = role.role === "mapIcon" ? MAP_ICON_CATEGORIES[role.scope] : ROLE_CATEGORIES[role.role];
    if (category) found.add(category);
  }
  if (found.has("townsfolk") && (found.has("merchant") || found.has("questGiver"))) found.delete("townsfolk");
  if (found.has("travelPoint") || found.has("container")) found.delete("interactiveObject");
  return PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => found.has(category));
}

function foldMapIcons(placements: readonly CatalogMapPlacement[]): CatalogMapPlacement[] {
  const groups = new Map<string, CatalogMapPlacement[]>();
  const result: CatalogMapPlacement[] = [];
  for (const placement of placements) {
    const iconOnly = placement.roles.length > 0 && placement.roles.every((role) => role.role === "mapIcon");
    if (!iconOnly) { result.push(placement); continue; }
    const scopes = [...new Set(placement.roles.map((role) => role.scope))].sort();
    const key = JSON.stringify([placement.mapSpaceId, scopes, Math.round(placement.position[0] * 100), Math.round(placement.position[1] * 100)]);
    const group = groups.get(key);
    if (group) group.push(placement); else groups.set(key, [placement]);
  }
  for (const group of groups.values()) {
    group.sort((left, right) => left.placementId.localeCompare(right.placementId));
    const labels = [...new Set(group.map((placement) => placement.label).filter((label): label is string => Boolean(label?.trim())))];
    if (labels.length > 1) throw new Error(`Map icons at one point carry different titles: ${labels.join(" / ")}`);
    result.push(labels.length === 1 && group[0]!.label !== labels[0] ? { ...group[0]!, label: labels[0]! } : group[0]!);
  }
  return result.sort((left, right) => left.placementId.localeCompare(right.placementId));
}

function finitePair(value: unknown): [number, number] | null {
  return Array.isArray(value) && value.length === 2 && value.every((part) => typeof part === "number" && Number.isFinite(part)) ? value as [number, number] : null;
}

function publicRegion(region: CatalogMapRegion): PublicRegion | null {
  if (region.geometry === null || typeof region.geometry !== "object" || Array.isArray(region.geometry)) return null;
  const geometry = region.geometry as Record<string, unknown>;
  let polygon: [number, number][];
  if (region.shape === "box") {
    if (!Array.isArray(geometry.corners) || geometry.corners.length !== 4) return null;
    const corners = geometry.corners.map(finitePair);
    if (corners.some((point) => point === null)) return null;
    polygon = corners as [number, number][];
  } else {
    const center = finitePair(geometry.center);
    const radius = geometry.radius;
    if (center === null || typeof radius !== "number" || !Number.isFinite(radius) || radius <= 0) return null;
    polygon = Array.from({ length: 32 }, (_, index) => {
      const angle = Math.PI * 2 * index / 32;
      return [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
    });
  }
  return { id: region.regionId, mapSpaceId: region.mapSpaceId, name: region.name.trim(), shape: region.shape, polygon };
}

function foldRegions(regions: readonly PublicRegion[]): PublicRegion[] {
  const seen = new Map<string, PublicRegion>();
  for (const region of [...regions].sort((left, right) => left.id.localeCompare(right.id))) {
    const key = JSON.stringify([region.mapSpaceId, region.name, region.shape, region.polygon.map(([x, y]) => [Math.round(x * 10), Math.round(y * 10)])]);
    if (!seen.has(key)) seen.set(key, region);
  }
  return [...seen.values()].sort((left, right) => left.id.localeCompare(right.id));
}
function sameTravelDestination(left: PublicTravel, right: PublicTravel): boolean {
  const a = left.destination, b = right.destination;
  if (a.status !== b.status || a.mapSpaceId !== b.mapSpaceId || a.placementId !== b.placementId) return false;
  if (a.status === "unresolved") return a.reason === b.reason && a.position === undefined && b.position === undefined;
  return a.position !== undefined && b.position !== undefined && Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1]) <= 0.1;
}
function foldTravelPlacements(placements: readonly PublicPlacement[]): PublicPlacement[] {
  const claimed = new Set<string>(), mergedTravel = new Map<string, PublicPlacement>();
  const travelPoints = placements.filter((placement) => placement.categories.includes("travelPoint") && placement.travel !== undefined);
  for (const representative of [...travelPoints].sort((left, right) => left.placementId.localeCompare(right.placementId))) {
    if (claimed.has(representative.placementId) || !representative.travel) continue;
    const equivalents = travelPoints.filter((travel) => travel.travel && travel.mapSpaceId === representative.mapSpaceId && Math.hypot(travel.position[0] - representative.position[0], travel.position[1] - representative.position[1]) <= 0.1 && sameTravelDestination(representative.travel!, travel.travel));
    if (equivalents.length < 2) continue;
    const labels = equivalents.map((travel) => travel.label).filter((value) => value !== "0" && value.toLocaleLowerCase() !== "travel point").sort((left, right) => left.localeCompare(right));
    const mergedLabel = labels[0] ?? representative.label;
    const mergedCategories = PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => equivalents.some((travel) => travel.categories.includes(category)));
    for (const travel of equivalents) if (travel.placementId !== representative.placementId) claimed.add(travel.placementId);
    mergedTravel.set(representative.placementId, { ...representative, label: mergedLabel, categories: mergedCategories, entityKeys: [...new Set(equivalents.flatMap((travel) => travel.entityKeys))].sort(), itemKeys: [...new Set(equivalents.flatMap((travel) => travel.itemKeys))].sort(), searchText: [mergedLabel, ...mergedCategories.map((category) => CATEGORY_LABELS[category])].join(" ") });
  }
  const deduplicated = placements.filter((placement) => !claimed.has(placement.placementId)).map((placement) => mergedTravel.get(placement.placementId) ?? placement);
  const travel = deduplicated.filter((placement) => placement.categories.includes("travelPoint") && placement.travel);
  const mergedDungeons = new Map<string, PublicPlacement>();
  for (const dungeon of deduplicated.filter((placement) => placement.categories.includes("dungeonEntrance"))) {
    const nearby = travel.filter((candidate) => !claimed.has(candidate.placementId) && candidate.mapSpaceId === dungeon.mapSpaceId && candidate.travel && (candidate.travel.destination.status === "unresolved" || candidate.travel.destination.mapSpaceId !== dungeon.mapSpaceId) && Math.hypot(candidate.position[0] - dungeon.position[0], candidate.position[1] - dungeon.position[1]) <= 6).sort((left, right) => Number(right.travel?.destination.status === "resolved") - Number(left.travel?.destination.status === "resolved") || Math.hypot(left.position[0] - dungeon.position[0], left.position[1] - dungeon.position[1]) - Math.hypot(right.position[0] - dungeon.position[0], right.position[1] - dungeon.position[1]) || left.placementId.localeCompare(right.placementId));
    const representative = nearby[0];
    if (!representative?.travel || representative.travel.destination.status !== "resolved") continue;
    const equivalents = nearby.filter((candidate) => candidate.travel && (candidate.travel.destination.status === "unresolved" || sameTravelDestination(representative.travel!, candidate.travel)));
    for (const candidate of equivalents) claimed.add(candidate.placementId);
    const mergedCategories = PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => category === "travelPoint" || dungeon.categories.includes(category));
    const mergedLabel = representative.label !== "0" && representative.label.toLocaleLowerCase() !== "travel point" ? representative.label : dungeon.label;
    mergedDungeons.set(dungeon.placementId, { ...dungeon, label: mergedLabel, categories: mergedCategories, entityKeys: [...new Set([...dungeon.entityKeys, ...equivalents.flatMap((candidate) => candidate.entityKeys)])].sort(), itemKeys: [...new Set([...dungeon.itemKeys, ...equivalents.flatMap((candidate) => candidate.itemKeys)])].sort(), travel: representative.travel, searchText: [mergedLabel, ...mergedCategories.map((category) => CATEGORY_LABELS[category])].join(" ") });
  }
  return deduplicated.filter((placement) => !claimed.has(placement.placementId)).map((placement) => mergedDungeons.get(placement.placementId) ?? placement);
}

export interface GeneratedMapShard {
  summary: Omit<StaticMapSummary, "imagery">;
  resource: GeneratedStaticResource<StaticMapShard>;
}

export async function generateMapShards(db: Database, store: ArtifactStore, worldOffsets: readonly PublicWorldOffset[] = []): Promise<GeneratedMapShard[]> {
  const offsets = new Map(worldOffsets.map((offset) => [offset.mapSpaceId, { worldX: offset.worldX, worldY: offset.worldY }]));
  const maps = queryCatalogMaps(db);
  const spatial = queryCatalogSpatialContext(db).records;
  const search = queryCatalogSearch(db).records;
  const entityNames = new Map(search.map((entity) => [entity.entityKey, plainText(entity.name ?? "") || "Unnamed entry"]));
  const gameplayByEntity = new Map(search.map((entity) => {
    const detail = queryCatalogFullEntity(db, entity.entityKey).records;
    if (!detail) throw new Error(`Catalog entity disappeared during map projection: ${entity.entityKey}.`);
    return [entity.entityKey, detail.publicData.gameplay] as const;
  }));
  const result: GeneratedMapShard[] = [];
  for (const map of maps.records) {
    const queried = queryCatalogMap(db, map.mapSpaceId);
    if (queried.records === null) throw new Error(`Catalog map disappeared during publication: ${map.mapSpaceId}.`);
    const offset = offsets.get(map.mapSpaceId) ?? { worldX: 0, worldY: 0 };
    const unfoldedPlacements: PublicPlacement[] = foldMapIcons(queried.records.placements).flatMap((placement) => {
      const placementCategories = categories(placement.roles);
      if (placementCategories.length === 0) return [];
      const entityKeys = [...new Set(placement.roles.flatMap((role) => role.npcEntityKey === null ? [] : [role.npcEntityKey]))].sort();
      const label = placement.label?.trim() || entityKeys.map((key) => entityNames.get(key)).filter((name): name is string => Boolean(name)).join(" / ") || sourceName(placement) || placementCategories.map((category) => CATEGORY_LABELS[category]).join(" / ");
      const range = placementLevelRange(placement, gameplayByEntity);
      const travel = offsetTravel(travelForPlacement(placement, spatial), offsets);
      return [{
        placementId: placement.placementId,
        mapSpaceId: placement.mapSpaceId,
        position: [placement.position[0] + offset.worldX, placement.position[1] + offset.worldY] as [number, number],
        height: placement.height,
        label,
        categories: placementCategories,
        ...(range ? { levelRange: range } : {}),
        entityKeys,
        itemKeys: placement.itemEntityKeys,
        searchText: [label, ...placementCategories.map((category) => CATEGORY_LABELS[category])].join(" "),
        areas: placementAreas(placement).map((polygon) => polygon.map(([x, y]) => [x + offset.worldX, y + offset.worldY] as [number, number])),
        movement: offsetMovement(movementForPlacement(placement, gameplayByEntity, spatial), offset),
        ...(travel ? { travel } : {}),
      }];
    });
    const placements = foldTravelPlacements(unfoldedPlacements);
    const regions = foldRegions(queried.records.regions.map(publicRegion).filter((region): region is PublicRegion => region !== null).map((region) => ({ ...region, polygon: region.polygon.map(([x, y]) => [x + offset.worldX, y + offset.worldY]) })));
    const shard: StaticMapShard = {
      schemaVersion: "compendium.static-map.v1",
      buildId: maps.buildId,
      catalogId: maps.catalogId,
      mapSpaceId: map.mapSpaceId,
      placements,
      regions,
      connections: queried.records.connections,
    };
    Assert(StaticMapShardSchema, shard);
    const resource = await writeStaticJson(store, shard.schemaVersion, shard);
    const points = [...placements.map((placement) => placement.position), ...regions.flatMap((region) => region.polygon)];
    const xs = points.map((point) => point[0]), ys = points.map((point) => point[1]);
    const bounds = points.length === 0 ? { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } } : { min: { x: Math.min(...xs), y: Math.min(...ys) }, max: { x: Math.max(...xs), y: Math.max(...ys) } };
    result.push({ summary: { mapSpaceId: map.mapSpaceId, label: map.label, bounds, data: resource.reference }, resource });
  }
  return result;
}
