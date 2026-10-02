import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import { queryCatalogFullEntities, queryCatalogMap, queryCatalogMaps, queryCatalogSearch, queryCatalogSpatialContext, type CatalogMapPlacement, type CatalogMapRegion, type CatalogSpatialContext } from "@afallon/catalog";
import {
  PUBLIC_MARKER_CATEGORY_VALUES,
  PUBLIC_MARKER_CATEGORY_LABELS as CATEGORY_LABELS,
  StaticMapShardSchema,
  StaticGeometrySchema,
  type StaticGeometry,
  type PublicEssentialPlacement,
  type PublicLevel,
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
import { markerCategories, type CreatureServices } from "./categories";
import { record } from "./json";
import { authoredLevel, levelUnion, npcLevelRecord, placementAlternative, sceneZoneRange, spawnerLevel } from "./levels";
import { partitionStaticRecords, writeStaticJson, type GeneratedStaticResource } from "./resources";
import { displayName } from "./text";

const CRAFTING_STATION_CATEGORIES: Readonly<Partial<Record<number, { name: string; category: PublicMarkerCategory }>>> = {
  0: { name: "Alchemy", category: "alchemyStation" },
  1: { name: "Cooking", category: "cookingStation" },
  2: { name: "Smithing", category: "smithingStation" },
  3: { name: "Furnace", category: "furnace" },
  5: { name: "Tailoring", category: "tailoringStation" },
};

// The level of each creature that the placement's spawners produce, keyed by NPC entity key.
function npcLevelsAt(placement: CatalogMapPlacement, gameplayByEntity: ReadonlyMap<string, unknown>): Map<string, PublicLevel> {
  const sceneZone = sceneZoneRange(gameplayByEntity.get(`scenes:${placement.sceneNativeId}`));
  const levels = new Map<string, PublicLevel[]>();
  for (const detail of placement.sourceDetails) {
    if (detail.family !== "npcProducer" || !Array.isArray(detail.data.candidates)) continue;
    for (const candidate of detail.data.candidates) {
      const npcId = record(candidate)?.npcId;
      if (typeof npcId !== "number" || !Number.isInteger(npcId)) continue;
      const key = `npcs:${npcId}`;
      const level = spawnerLevel(detail.data, npcLevelRecord(gameplayByEntity.get(key)), sceneZone);
      if (!level) continue;
      const known = levels.get(key) ?? [];
      known.push(level);
      levels.set(key, known);
    }
  }
  return new Map([...levels].map(([key, known]) => [key, levelUnion(known)!] as const));
}
// A placement shows the levels of its creatures, or else a level range that its source authors directly.
function placementLevel(placement: CatalogMapPlacement, npcLevels: ReadonlyMap<string, PublicLevel>): PublicLevel | undefined {
  if (npcLevels.size > 0) return levelUnion([...npcLevels.values()]);
  return levelUnion(placement.sourceDetails.flatMap(({ data }) => [authoredLevel(data.LevelRangeMin, data.LevelRangeMax), authoredLevel(data.levelRangeMin, data.levelRangeMax)]).filter((level): level is PublicLevel => level !== undefined));
}
type ProjectedPlacement = Omit<PublicPlacement, "areas"> & { areaRadius: number | null };

function placementAreaRadius(placement: CatalogMapPlacement): number | null {
  const shape = record(placement.shape), radius = shape?.radius;
  return shape?.kind !== "point" && typeof radius === "number" && radius > 0 ? radius : null;
}
// Authored object names include placeholders such as "0"; a name without a letter names nothing.
function readableName(value: unknown): string | null {
  const name = typeof value === "string" ? displayName(value) : "";
  return /\p{L}/u.test(name) ? name : null;
}
// Heart-gated parent stones have no placement role; the named teleport is on a child interactable.
function heartChallengeStoneName(placement: CatalogMapPlacement): string | null {
  for (const { family, data } of placement.sourceDetails) {
    if (family !== "interactableObject" || data.interactableName !== "Sacrifice Heart of corruption") continue;
    const hierarchyPath = record(record(data.source)?.source)?.hierarchyPath;
    if (typeof hierarchyPath !== "string") continue;
    const match = hierarchyPath.match(/\/(Challenge stone [^/[]+)\[\d+\]$/i);
    if (match?.[1]) return displayName(match[1]);
  }
  return null;
}
function sourceName(placement: CatalogMapPlacement): string | null {
  for (const { data } of placement.sourceDetails) {
    const name = [data.interactableName, data.chestName, record(data.station)?.name, record(data.property)?.name].map(readableName).find((value) => value !== null);
    if (name) return name;
  }
  return null;
}
// A for-sale sign sells the property that its typed RPGProperty reference names.
function propertiesSold(placement: CatalogMapPlacement): string[] {
  return placement.sourceDetails.flatMap(({ family, data }) => family === "propertyForSaleSign" && data.propertyReferenceStatus === "resolved" && typeof data.propertyID === "number" && Number.isInteger(data.propertyID) && data.propertyID >= 0
    ? [`properties:${data.propertyID}`] : []);
}
// A travel point without its own name carries the category label, so a merged marker prefers any other label.
function namedTravelLabel(label: string): boolean {
  return label.toLocaleLowerCase() !== CATEGORY_LABELS.travelPoint.toLocaleLowerCase();
}
function position(value: unknown): { x: number; y: number; z: number } | null {
  const point = record(value);
  return point && typeof point.x === "number" && Number.isFinite(point.x) && typeof point.y === "number" && Number.isFinite(point.y) && typeof point.z === "number" && Number.isFinite(point.z) ? { x: point.x, y: point.y, z: point.z } : null;
}
function flightPointLabel(gameplay: Record<string, unknown> | null): string | null {
  if (gameplay?.isFlightMaster !== true || typeof gameplay.flightStopId !== "string") return null;
  const network = record(gameplay.flightNetwork);
  if (network?.available !== true || !Array.isArray(network.stops)) return null;
  const stop = network.stops.map(record).find((candidate) => candidate?.id === gameplay.flightStopId);
  const name = typeof stop?.name === "string" ? displayName(stop.name) : "";
  return name ? `${name} Flight Point` : null;
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
  if (domainValue.kind === "scene") return true;
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

function creatureServices(gameplay: Record<string, unknown> | null): CreatureServices {
  return { isAuctioneer: gameplay?.isAuctioneer === true, isBanker: gameplay?.isBanker === true, isFlightMaster: gameplay?.isFlightMaster === true };
}

/** The one crafting station that every station detail of the placement resolves to, or null when they disagree or none resolves. */
function craftingStationId(placement: CatalogMapPlacement): number | null {
  const details = placement.sourceDetails.filter((detail) => detail.family === "craftingStation");
  let stationId: number | null = null;
  for (const { data } of details) {
    const id = data.stationID, station = record(data.station);
    if (data.stationReferenceStatus !== "resolved" || typeof id !== "number" || !Number.isInteger(id) || !station || station.nativeId !== id) return null;
    if (stationId !== null && stationId !== id) return null;
    stationId = id;
  }
  return stationId;
}

function craftingStationCategory(stationId: number | null, canonicalNames: ReadonlyMap<number, string>): PublicMarkerCategory {
  if (stationId === null) return "craftingStation";
  const supported = CRAFTING_STATION_CATEGORIES[stationId];
  return supported && canonicalNames.get(stationId)?.trim() === supported.name ? supported.category : "craftingStation";
}

// Each fold records the placement that each merged placement now shows as, so that pages can link a merged spot.
function foldMapIcons(placements: readonly CatalogMapPlacement[], merged: Map<string, string>): CatalogMapPlacement[] {
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
    for (const placement of group.slice(1)) merged.set(placement.placementId, group[0]!.placementId);
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
  // Regions fold by their authored names, and then show their names in title case.
  return [...seen.values()].sort((left, right) => left.id.localeCompare(right.id)).map((region) => ({ ...region, name: displayName(region.name) }));
}
function sameTravelDestination(left: PublicTravel, right: PublicTravel): boolean {
  const a = left.destination, b = right.destination;
  if (a.status !== b.status || a.mapSpaceId !== b.mapSpaceId || a.placementId !== b.placementId) return false;
  if (a.status === "unresolved") return a.reason === b.reason && a.position === undefined && b.position === undefined;
  return a.position !== undefined && b.position !== undefined && Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1]) <= 0.1;
}
function foldTravelPlacements(placements: readonly ProjectedPlacement[], merged: Map<string, string>): ProjectedPlacement[] {
  const claimed = new Set<string>(), mergedTravel = new Map<string, ProjectedPlacement>();
  const travelPoints = placements.filter((placement) => placement.categories.includes("travelPoint") && placement.travel !== undefined);
  for (const representative of [...travelPoints].sort((left, right) => left.placementId.localeCompare(right.placementId))) {
    if (claimed.has(representative.placementId) || !representative.travel) continue;
    const equivalents = travelPoints.filter((travel) => travel.travel && travel.mapSpaceId === representative.mapSpaceId && Math.hypot(travel.position[0] - representative.position[0], travel.position[1] - representative.position[1]) <= 0.1 && sameTravelDestination(representative.travel!, travel.travel));
    if (equivalents.length < 2) continue;
    const labels = equivalents.map((travel) => travel.label).filter(namedTravelLabel).sort((left, right) => left.localeCompare(right));
    const mergedLabel = labels[0] ?? representative.label;
    const mergedCategories = PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => equivalents.some((travel) => travel.categories.includes(category)));
    for (const travel of equivalents) if (travel.placementId !== representative.placementId) {
      claimed.add(travel.placementId);
      merged.set(travel.placementId, representative.placementId);
    }
    mergedTravel.set(representative.placementId, { ...representative, label: mergedLabel, categories: mergedCategories, entityKeys: [...new Set(equivalents.flatMap((travel) => travel.entityKeys))].sort(), itemKeys: [...new Set(equivalents.flatMap((travel) => travel.itemKeys))].sort(), searchText: [mergedLabel, ...mergedCategories.map((category) => CATEGORY_LABELS[category])].join(" ") });
  }
  const deduplicated = placements.filter((placement) => !claimed.has(placement.placementId)).map((placement) => mergedTravel.get(placement.placementId) ?? placement);
  const travel = deduplicated.filter((placement) => placement.categories.includes("travelPoint") && placement.travel);
  const mergedDungeons = new Map<string, ProjectedPlacement>();
  for (const dungeon of deduplicated.filter((placement) => placement.categories.includes("dungeonEntrance"))) {
    const nearby = travel.filter((candidate) => !claimed.has(candidate.placementId) && candidate.mapSpaceId === dungeon.mapSpaceId && candidate.travel && (candidate.travel.destination.status === "unresolved" || candidate.travel.destination.mapSpaceId !== dungeon.mapSpaceId) && Math.hypot(candidate.position[0] - dungeon.position[0], candidate.position[1] - dungeon.position[1]) <= 6).sort((left, right) => Number(right.travel?.destination.status === "resolved") - Number(left.travel?.destination.status === "resolved") || Math.hypot(left.position[0] - dungeon.position[0], left.position[1] - dungeon.position[1]) - Math.hypot(right.position[0] - dungeon.position[0], right.position[1] - dungeon.position[1]) || left.placementId.localeCompare(right.placementId));
    const representative = nearby[0];
    if (!representative?.travel || representative.travel.destination.status !== "resolved") continue;
    const equivalents = nearby.filter((candidate) => candidate.travel && (candidate.travel.destination.status === "unresolved" || sameTravelDestination(representative.travel!, candidate.travel)));
    for (const candidate of equivalents) {
      claimed.add(candidate.placementId);
      merged.set(candidate.placementId, dungeon.placementId);
    }
    const mergedCategories = PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => category === "travelPoint" || dungeon.categories.includes(category));
    const mergedLabel = namedTravelLabel(representative.label) ? representative.label : dungeon.label;
    mergedDungeons.set(dungeon.placementId, { ...dungeon, label: mergedLabel, categories: mergedCategories, entityKeys: [...new Set([...dungeon.entityKeys, ...equivalents.flatMap((candidate) => candidate.entityKeys)])].sort(), itemKeys: [...new Set([...dungeon.itemKeys, ...equivalents.flatMap((candidate) => candidate.itemKeys)])].sort(), travel: representative.travel, searchText: [mergedLabel, ...mergedCategories.map((category) => CATEGORY_LABELS[category])].join(" ") });
  }
  return deduplicated.filter((placement) => !claimed.has(placement.placementId)).map((placement) => mergedDungeons.get(placement.placementId) ?? placement);
}

export interface GeneratedMapShard {
  summary: Omit<StaticMapSummary, "imagery">;
  resources: GeneratedStaticResource<StaticMapShard>[];
  geometry: GeneratedStaticResource<StaticGeometry>[];
  /** For each published placement, the level of each creature record that it produces. */
  npcLevels: ReadonlyMap<string, ReadonlyMap<string, PublicLevel>>;
  /** The published placement that shows each placement that a fold merged into another marker. */
  mergedInto: ReadonlyMap<string, string>;
}

/** The page that shows a creature record, by record key. */
export type PageOfRecord = ReadonlyMap<string, { key: string; name: string }>;

/** The extent of the game map of a map space: minimum x, minimum y, maximum x, and maximum y, in map coordinates. */
export type MapExtent = readonly [number, number, number, number];

/** Whether a map position lies outside the game map. The map shows nothing outside its extent. */
export function outsideExtent(position: readonly [number, number], extent: MapExtent): boolean {
  return position[0] < extent[0] || position[1] < extent[1] || position[0] >= extent[2] || position[1] >= extent[3];
}

export async function generateMapShards(db: Database, store: ArtifactStore, pageOf: PageOfRecord, worldOffsets: readonly PublicWorldOffset[] = [], protection?: ObjectWriteProtection, publishedMapSpaceIds?: ReadonlySet<string>, publishedExtents?: ReadonlyMap<string, MapExtent>, copiedPlacementIds: ReadonlySet<string> = new Set()): Promise<GeneratedMapShard[]> {
  const offsets = new Map(worldOffsets.map((offset) => [offset.mapSpaceId, { worldX: offset.worldX, worldY: offset.worldY }]));
  const maps = queryCatalogMaps(db);
  const spatial = queryCatalogSpatialContext(db).records;
  const search = queryCatalogSearch(db);
  if (search.buildId !== maps.buildId) throw new Error("Catalog search and map records belong to different builds.");
  const craftingStationNames = new Map(search.records.filter((entity) => entity.kind === "craftingStations" && entity.name !== null).map((entity) => [entity.nativeId, entity.name!]));
  const gameplayByEntity = new Map(queryCatalogFullEntities(db).records.map((detail) => [detail.entityKey, detail.publicData.gameplay]));
  const result: GeneratedMapShard[] = [];
  for (const map of maps.records) {
    if (publishedMapSpaceIds && !publishedMapSpaceIds.has(map.mapSpaceId)) continue;
    const queried = queryCatalogMap(db, map.mapSpaceId);
    if (queried.records === null) throw new Error(`Catalog map disappeared during publication: ${map.mapSpaceId}.`);
    const offset = offsets.get(map.mapSpaceId) ?? { worldX: 0, worldY: 0 };
    const extent = publishedExtents?.get(map.mapSpaceId);
    const npcLevels = new Map<string, ReadonlyMap<string, PublicLevel>>();
    const merged = new Map<string, string>();
    const unfoldedPlacements: ProjectedPlacement[] = foldMapIcons(queried.records.placements.filter((placement) => !copiedPlacementIds.has(placement.placementId)), merged).flatMap((placement) => {
      if (extent && outsideExtent(placement.position, extent)) return [];
      const recordKeys = [...new Set(placement.roles.flatMap((role) => role.npcEntityKey === null ? [] : [role.npcEntityKey]))].sort();
      // A crafting station's spot carries the station's key, so its page can show the station's spots on the map.
      const stationId = placement.roles.some((role) => role.role === "craftingService") ? craftingStationId(placement) : null;
      const stationKeys = stationId !== null && craftingStationNames.has(stationId) ? [`craftingStations:${stationId}`] : [];
      const entityKeys = [...new Set([...recordKeys.map((key) => pageOf.get(key)?.key ?? key), ...propertiesSold(placement), ...stationKeys])].sort();
      const serviceData = recordKeys.map((key) => record(gameplayByEntity.get(key)));
      const foundCategories = new Set(markerCategories(placement.roles, serviceData.map(creatureServices)));
      const stoneName = heartChallengeStoneName(placement);
      if (stoneName) foundCategories.add("interactiveObject");
      if (foundCategories.delete("craftingStation")) foundCategories.add(craftingStationCategory(stationId, craftingStationNames));
      const placementCategories = PUBLIC_MARKER_CATEGORY_VALUES.filter((category) => foundCategories.has(category));
      if (placementCategories.length === 0) return [];
      const serviceLabel = serviceData.map(flightPointLabel).find((value): value is string => value !== null);
      const pageNames = [...new Set(recordKeys.map((key) => pageOf.get(key)?.name).filter((name): name is string => Boolean(name)))];
      const label = stoneName || serviceLabel || readableName(placement.label) || pageNames.join(" / ") || sourceName(placement) || placementCategories.map((category) => CATEGORY_LABELS[category]).join(" / ");
      const levels = npcLevelsAt(placement, gameplayByEntity);
      if (levels.size > 0) npcLevels.set(placement.placementId, levels);
      const level = placementLevel(placement, levels);
      const alternative = placementAlternative(placement.placementId, placement.randomChoices);
      const travel = offsetTravel(travelForPlacement(placement, spatial), offsets);
      return [{
        placementId: placement.placementId,
        mapSpaceId: placement.mapSpaceId,
        position: [placement.position[0] + offset.worldX, placement.position[1] + offset.worldY] as [number, number],
        height: placement.height,
        label,
        categories: placementCategories,
        ...(level ? { level } : {}),
        ...(alternative ? { alternative } : {}),
        entityKeys,
        itemKeys: placement.itemEntityKeys,
        searchText: [label, ...placementCategories.map((category) => CATEGORY_LABELS[category])].join(" "),
        areaRadius: placementAreaRadius(placement),
        movement: offsetMovement(movementForPlacement(placement, gameplayByEntity, spatial), offset),
        ...(travel ? { travel } : {}),
      }];
    });
    const placements = foldTravelPlacements(unfoldedPlacements, merged);
    const regions = foldRegions(queried.records.regions.map(publicRegion).filter((region): region is PublicRegion => region !== null).map((region) => ({ ...region, polygon: region.polygon.map(([x, y]) => [x + offset.worldX, y + offset.worldY]) })));
    const identity = { buildId: maps.buildId, catalogId: maps.catalogId, mapSpaceId: map.mapSpaceId };
    // The item keys stay beside each tuple until a part is cut, so each part lists every distinct item set once.
    const compact = placements.map((placement) => ({
      itemKeys: placement.itemKeys,
      tuple: [placement.placementId, placement.position, placement.height, placement.label, placement.categories, placement.entityKeys, null, placement.level ?? null, placement.travel?.enabled ?? null, placement.areaRadius, placement.alternative ?? null] as PublicEssentialPlacement,
    }));
    const published = new Set(placements.map((placement) => placement.placementId));
    const mergedInto = new Map<string, string>();
    for (const placementId of merged.keys()) {
      let target = merged.get(placementId);
      const seen = new Set([placementId]);
      while (target !== undefined && !published.has(target) && !seen.has(target)) { seen.add(target); target = merged.get(target); }
      if (target !== undefined && published.has(target)) mergedInto.set(placementId, target);
    }
    for (const placementId of [...npcLevels.keys()]) if (!published.has(placementId)) npcLevels.delete(placementId);
    type MapRecord = { placement: (typeof compact)[number] } | { region: PublicRegion };
    const mapRecords: MapRecord[] = [...compact.map((placement) => ({ placement })), ...regions.map((region) => ({ region }))];
    const resources: GeneratedStaticResource<StaticMapShard>[] = [];
    for (const shard of partitionStaticRecords(mapRecords, (rows, part): StaticMapShard => {
      const itemSets: string[][] = [], setIndex = new Map<string, number>();
      const partPlacements = rows.flatMap((row) => {
        if (!("placement" in row)) return [];
        const { itemKeys, tuple } = row.placement;
        if (itemKeys.length === 0) return [tuple];
        const key = JSON.stringify(itemKeys);
        let index = setIndex.get(key);
        if (index === undefined) {
          index = itemSets.length;
          itemSets.push([...itemKeys]);
          setIndex.set(key, index);
        }
        const indexed: PublicEssentialPlacement = [...tuple];
        indexed[6] = index;
        return [indexed];
      });
      return { schemaVersion: "compendium.static-map.v4", ...identity, part, itemSets, placements: partPlacements, regions: rows.flatMap((row) => "region" in row ? [row.region] : []) };
    })) {
      Assert(StaticMapShardSchema, shard);
      resources.push(await writeStaticJson(store, shard.schemaVersion, shard, protection));
    }
    type GeometryRecord = { placement: StaticGeometry["placements"][number] } | { connection: StaticGeometry["connections"][number] };
    const geometryRecords: GeometryRecord[] = [
      ...placements.filter((placement) => placement.movement.length > 0 || placement.travel !== undefined).map((placement) => ({ placement: { placementId: placement.placementId, movement: placement.movement, ...(placement.travel ? { travel: placement.travel } : {}) } })),
      ...queried.records.connections.map((connection) => ({ connection })),
    ];
    const geometry: GeneratedStaticResource<StaticGeometry>[] = [];
    if (geometryRecords.length > 0) for (const shard of partitionStaticRecords(geometryRecords, (rows, part): StaticGeometry => ({
      schemaVersion: "compendium.static-geometry.v1", ...identity, part,
      placements: rows.flatMap((row) => "placement" in row ? [row.placement] : []),
      connections: rows.flatMap((row) => "connection" in row ? [row.connection] : []),
    }))) {
      Assert(StaticGeometrySchema, shard);
      geometry.push(await writeStaticJson(store, shard.schemaVersion, shard, protection));
    }
    const points = [...placements.flatMap<[number, number]>(({ position: [x, y], areaRadius }) => areaRadius === null ? [[x, y]] : [[x - areaRadius, y - areaRadius], [x + areaRadius, y + areaRadius]]), ...regions.flatMap((region) => region.polygon)];
    const bounds = points.reduce((bounds, [x, y]) => ({ min: { x: Math.min(bounds.min.x, x), y: Math.min(bounds.min.y, y) }, max: { x: Math.max(bounds.max.x, x), y: Math.max(bounds.max.y, y) } }), { min: { x: Infinity, y: Infinity }, max: { x: -Infinity, y: -Infinity } });
    if (points.length === 0) { bounds.min = { x: offset.worldX, y: offset.worldY }; bounds.max = { ...bounds.min }; }
    result.push({ summary: { mapSpaceId: map.mapSpaceId, label: map.label, bounds, parts: resources.map((resource) => resource.reference), optionalGeometry: geometry.map((resource) => resource.reference) }, resources, geometry, npcLevels, mergedInto });
  }
  return result;
}
