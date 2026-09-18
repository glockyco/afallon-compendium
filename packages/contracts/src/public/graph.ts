import { Assert } from "typebox/value";
import {
  StaticResourceReferenceSchema,
  assertStaticResourceIdentity,
  type StaticResource,
  type StaticResourceReference,
  type StaticRootManifest,
} from "./resources";

export const PUBLICATION_ROOT_BUDGET = 65_536;
export const PUBLICATION_PART_BUDGET = 524_288;
export const PUBLICATION_ESSENTIAL_BUDGET = 3_300_000;

export interface VerifiedPublicationGraph {
  publication: StaticRootManifest;
  resources: ReadonlyMap<string, StaticResource>;
  references: ReadonlyMap<string, StaticResourceReference>;
}

export function assertStaticResourceReference(reference: StaticResourceReference): void {
  Assert(StaticResourceReferenceSchema, reference);
  const expectedPath = reference.schemaId === "image/webp" ? `assets/${reference.sha256}.webp` : `resources/${reference.sha256}.json`;
  if (reference.path !== expectedPath) throw new Error(`Publication reference path mismatch: ${reference.path}.`);
  if (/^compendium\.static-(?:map|geometry|entity-search|item-search)\./.test(reference.schemaId) && reference.bytes > PUBLICATION_PART_BUDGET) throw new Error(`Publication part exceeds its byte budget: ${reference.path}.`);
}

export function assertStaticPublicationBudgets(root: StaticRootManifest, rootBytes: number): void {
  if (rootBytes > PUBLICATION_ROOT_BUDGET) throw new Error("Publication root exceeds its byte budget.");
  const essentialBytes = rootBytes + root.coverage.bytes + root.maps.reduce((sum, map) => sum + map.imagery.bytes + map.parts.reduce((partSum, part) => partSum + part.bytes, 0), 0);
  if (essentialBytes > PUBLICATION_ESSENTIAL_BUDGET) throw new Error("Essential publication exceeds its byte budget.");
}

export function assertStaticPublicationSemantics(root: StaticRootManifest, values: ReadonlyMap<string, StaticResource>): void {
  if (root.maps.length === 0) throw new Error("Publication maps are empty.");
  for (const value of values.values()) assertStaticResourceIdentity(root, value);
  const coverage = values.get(root.coverage.path);
  if (coverage?.schemaVersion !== "compendium.static-coverage.v1" || coverage.complete !== root.complete) throw new Error("Publication coverage does not match its root.");
  const mapIds = new Set<string>();
  const placementIds = new Set<string>();
  for (const map of root.maps) {
    if (mapIds.has(map.mapSpaceId)) throw new Error(`Duplicate publication map: ${map.mapSpaceId}.`);
    mapIds.add(map.mapSpaceId);
    const mapPlacementStates = new Map<string, boolean | null>();
    const geometryIds = new Set<string>();
    const travelGeometryIds = new Set<string>();
    for (const [part, reference] of map.parts.entries()) {
      const value = values.get(reference.path);
      if (value?.schemaVersion !== "compendium.static-map.v2" || value.mapSpaceId !== map.mapSpaceId || value.part !== part) throw new Error(`Atlas part identity mismatch: ${reference.path}.`);
      for (const placement of value.placements) {
        if (placementIds.has(placement[0])) throw new Error(`Duplicate public placement: ${placement[0]}.`);
        placementIds.add(placement[0]);
        mapPlacementStates.set(placement[0], placement[8]);
      }
      if (value.regions.some((region) => region.mapSpaceId !== map.mapSpaceId)) throw new Error(`Atlas region map mismatch: ${reference.path}.`);
    }
    for (const [part, reference] of map.optionalGeometry.entries()) {
      const value = values.get(reference.path);
      if (value?.schemaVersion !== "compendium.static-geometry.v1" || value.mapSpaceId !== map.mapSpaceId || value.part !== part) throw new Error(`Geometry part identity mismatch: ${reference.path}.`);
      for (const placement of value.placements) {
        if (!mapPlacementStates.has(placement.placementId)) throw new Error(`Geometry placement is missing from its map: ${placement.placementId}.`);
        if (geometryIds.has(placement.placementId)) throw new Error(`Duplicate geometry placement: ${placement.placementId}.`);
        geometryIds.add(placement.placementId);
        if (placement.travel) {
          if (placement.travel.enabled !== mapPlacementStates.get(placement.placementId)) throw new Error(`Travel marker state differs from its geometry: ${placement.placementId}.`);
          travelGeometryIds.add(placement.placementId);
        }
      }
    }
    for (const [placementId, state] of mapPlacementStates) if (state !== null && !travelGeometryIds.has(placementId)) throw new Error(`Travel placement has no declared geometry: ${placementId}.`);
    const imagery = values.get(map.imagery.path);
    if (imagery?.schemaVersion !== "compendium.static-imagery.v2" || imagery.mapSpaceId !== map.mapSpaceId || imagery.layers.some((layer) => layer.mapSpaceId !== map.mapSpaceId)) throw new Error(`Imagery map mismatch: ${map.imagery.path}.`);
    if (!imagery.layers.some((layer) => layer.id === imagery.defaultLayerId && layer.kind === "game-map")) throw new Error(`Imagery default is not a game map: ${map.imagery.path}.`);
  }
  for (const [part, reference] of root.entitySearch.entries()) {
    const value = values.get(reference.path);
    if (value?.schemaVersion !== "compendium.static-entity-search.v2" || value.part !== part) throw new Error(`Entity search part identity mismatch: ${reference.path}.`);
    for (const entity of value.entities) {
      const detail = values.get(entity.detail.path);
      if (detail?.schemaVersion !== "compendium.static-entity-detail.v1" || detail.entity.entityKey !== entity.entityKey) throw new Error(`Entity detail identity mismatch: ${entity.entityKey}.`);
    }
  }
  for (const [part, reference] of root.itemSearch.entries()) {
    const value = values.get(reference.path);
    if (value?.schemaVersion !== "compendium.static-item-search.v2" || value.part !== part) throw new Error(`Item search part identity mismatch: ${reference.path}.`);
    for (const item of value.items) {
      const detail = values.get(item.detail.path), source = values.get(item.source.path);
      if (detail?.schemaVersion !== "compendium.static-entity-detail.v1" || detail.entity.entityKey !== item.itemKey || source?.schemaVersion !== "compendium.static-item-source.v1" || source.itemSource.itemKey !== item.itemKey) throw new Error(`Item resource identity mismatch: ${item.itemKey}.`);
    }
  }
}
