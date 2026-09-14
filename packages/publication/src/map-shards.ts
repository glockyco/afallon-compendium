import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import { queryCatalogMap, queryCatalogMaps, type CatalogMapRegion } from "@afallon/catalog";
import {
  PUBLIC_MARKER_CATEGORY_VALUES,
  StaticMapShardSchema,
  type PublicMarkerCategory,
  type PublicRegion,
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

export interface GeneratedMapShard {
  summary: Omit<StaticMapSummary, "imagery">;
  resource: GeneratedStaticResource<StaticMapShard>;
}

export async function generateMapShards(db: Database, store: ArtifactStore): Promise<GeneratedMapShard[]> {
  const maps = queryCatalogMaps(db);
  const result: GeneratedMapShard[] = [];
  for (const map of maps.records) {
    const queried = queryCatalogMap(db, map.mapSpaceId);
    if (queried.records === null) throw new Error(`Catalog map disappeared during publication: ${map.mapSpaceId}.`);
    const placements = queried.records.placements.flatMap((placement) => {
      const placementCategories = categories(placement.roles);
      if (placementCategories.length === 0) return [];
      const entityKeys = [...new Set(placement.roles.flatMap((role) => role.npcEntityKey === null ? [] : [role.npcEntityKey]))].sort();
      const label = placement.label?.trim() || entityKeys[0] || placementCategories[0]!;
      return [{
        placementId: placement.placementId,
        mapSpaceId: placement.mapSpaceId,
        position: placement.position,
        height: placement.height,
        label,
        categories: placementCategories,
        entityKeys,
        itemKeys: placement.itemEntityKeys,
        searchText: [label, ...placementCategories, ...entityKeys, ...placement.itemEntityKeys].join(" ").toLowerCase(),
        areas: [],
        movement: [],
      }];
    });
    const regions = queried.records.regions.map(publicRegion).filter((region): region is PublicRegion => region !== null);
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
