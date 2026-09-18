import type { PublicPlacement, PublicRegion, PublicationData } from "@afallon/contracts/public";
import { markerFor, resolveMarker, type MarkerId } from "./marker-registry";
import { effectiveMapDelta, type WorldOffsetOverrides } from "./world-layout";
import type { MovementGeometry, MovementPath, MovementRadius } from "./layers/movement";
import type { RegionRecord } from "./layers/regions";

export type Point = [number, number];

export type MarkerRecord = {
  placementId: string;
  mapSpaceId: string;
  position: [number, number, number];
  label: string;
  categories: PublicPlacement["categories"];
  markerId: MarkerId;
  members: string[];
  enabled: boolean;
  isTravel: boolean;
};

export type AreaRecord = {
  areaId: string;
  placementId: string;
  mapSpaceId: string;
  polygon: Point[];
  markerId: MarkerId;
};

export type WorldMapBounds = {
  mapSpaceId: string;
  polygon: Point[];
};

function point(value: readonly number[] | null | undefined): Point | null {
  if (!value || typeof value[0] !== "number" || typeof value[1] !== "number" || !Number.isFinite(value[0]) || !Number.isFinite(value[1])) return null;
  return [value[0], value[1]];
}

export function buildMarkers(placements: readonly PublicPlacement[], data: PublicationData | null = null, overrides: WorldOffsetOverrides = {}, activeCategories: ReadonlySet<MarkerId> | null = null): MarkerRecord[] {
  const byId = new Map<string, MarkerRecord>();
  for (const placement of placements) {
    if (!placement.placementId || byId.has(placement.placementId)) continue;
    const position = point(placement.position);
    if (!position) continue;
    const categories = activeCategories ? placement.categories.filter((category) => activeCategories.has(category)) : placement.categories;
    const markerId = resolveMarker({categories});
    if (!markerId) continue;
    const delta = data ? effectiveMapDelta(data, placement.mapSpaceId, overrides) : { worldX: 0, worldY: 0 };
    byId.set(placement.placementId, {
      placementId: placement.placementId,
      mapSpaceId: placement.mapSpaceId,
      position: [position[0] + delta.worldX, position[1] + delta.worldY, 0],
      label: placement.label,
      categories: [...categories],
      markerId,
      members: [placement.placementId],
      enabled: placement.travelEnabled ?? true,
      isTravel: placement.travelEnabled !== undefined,
    });
  }
  return [...byId.values()].sort((left, right) => markerFor(left.markerId).renderOrder - markerFor(right.markerId).renderOrder || left.placementId.localeCompare(right.placementId));
}

export function buildRegions(regions: readonly PublicRegion[], data: PublicationData, overrides: WorldOffsetOverrides): RegionRecord[] {
  return regions.map((region) => {
    const delta = effectiveMapDelta(data, region.mapSpaceId, overrides);
    return {
      id: region.id,
      mapSpaceId: region.mapSpaceId,
      name: region.name,
      shape: region.shape,
      polygon: region.polygon.map(([x, y]) => [x + delta.worldX, y + delta.worldY] as Point),
    };
  });
}

export function buildAreas(placements: readonly PublicPlacement[], data: PublicationData | null = null, overrides: WorldOffsetOverrides = {}, activeCategories: ReadonlySet<MarkerId> | null = null): AreaRecord[] {
  const areas: AreaRecord[] = [];
  for (const placement of placements) {
    for (let index = 0; index < placement.areas.length; index++) {
      const source = placement.areas[index];
      if (!source) continue;
      const delta = data ? effectiveMapDelta(data, placement.mapSpaceId, overrides) : { worldX: 0, worldY: 0 };
      const polygon = source
        .map(value => point(value))
        .filter((value): value is Point => value !== null)
        .map(([x, y]) => [x + delta.worldX, y + delta.worldY] as Point);
      if (polygon.length < 3) continue;
      const categories = activeCategories ? placement.categories.filter((category) => activeCategories.has(category)) : placement.categories;
      const markerId = resolveMarker({categories});
      if (!markerId) continue;
      areas.push({
        areaId: `${placement.placementId}:${index}`,
        placementId: placement.placementId,
        mapSpaceId: placement.mapSpaceId,
        polygon,
        markerId,
      });
    }
  }
  return areas;
}

export function buildMovementGeometry(placements: readonly PublicPlacement[], data: PublicationData, overrides: WorldOffsetOverrides): MovementGeometry {
  const paths: MovementPath[] = [];
  const radii: MovementRadius[] = [];
  const seen = new Set<string>();
  for (const placement of placements) {
    const delta = effectiveMapDelta(data, placement.mapSpaceId, overrides);
    const placementCenter = point(placement.position);
    for (let movementIndex = 0; movementIndex < placement.movement.length; movementIndex++) {
      const movement = placement.movement[movementIndex]!;
      if (movement.kind === "roaming") {
        if (movement.usePois && movement.poiPath?.status === "resolved" && movement.poiPath.points) {
          const poiPoints = movement.poiPath.points.map(point).filter((value): value is Point => value !== null).map(([x, y]) => [x + delta.worldX, y + delta.worldY] as Point);
          const pathKey = `poi:${poiPoints.map((value) => value.join(",")).join(";")}`;
          if (poiPoints.length > 1 && !seen.has(`${placement.placementId}:${pathKey}`)) {
            seen.add(`${placement.placementId}:${pathKey}`);
            paths.push({ movementId: `${placement.placementId}:${movementIndex}:poi`, placementId: placement.placementId, kind: "poi", points: poiPoints });
          }
          if (typeof movement.poiRoamRadius === "number" && movement.poiRoamRadius > 0) {
            for (let pointIndex = 0; pointIndex < poiPoints.length; pointIndex++) {
              const center = poiPoints[pointIndex]!;
              const radiusKey = `poi:${center.join(",")}:${movement.poiRoamRadius}`;
              if (seen.has(`${placement.placementId}:${radiusKey}`)) continue;
              seen.add(`${placement.placementId}:${radiusKey}`);
              radii.push({ movementId: `${placement.placementId}:${movementIndex}:poi:${pointIndex}`, placementId: placement.placementId, kind: "poi", center, radius: movement.poiRoamRadius });
            }
          }
        } else if (!movement.usePois && placementCenter && movement.distance > 0) {
          const center: Point = [placementCenter[0] + delta.worldX, placementCenter[1] + delta.worldY];
          const radiusKey = `roaming:${center.join(",")}:${movement.distance}`;
          if (seen.has(`${placement.placementId}:${radiusKey}`)) continue;
          seen.add(`${placement.placementId}:${radiusKey}`);
          radii.push({ movementId: `${placement.placementId}:${movementIndex}:roaming`, placementId: placement.placementId, kind: "roaming", center, radius: movement.distance });
        }
        continue;
      }
      for (let pathIndex = 0; pathIndex < movement.paths.length; pathIndex++) {
        const path = movement.paths[pathIndex]!;
        if (path.status !== "resolved" || !path.points) continue;
        const pathPoints = path.points.map(point).filter((value): value is Point => value !== null).map(([x, y]) => [x + delta.worldX, y + delta.worldY] as Point);
        if (pathPoints.length < 2) continue;
        if (path.looping && (pathPoints[0]![0] !== pathPoints.at(-1)![0] || pathPoints[0]![1] !== pathPoints.at(-1)![1])) pathPoints.push(pathPoints[0]!);
        const pathKey = `patrol:${pathPoints.map((value) => value.join(",")).join(";")}`;
        if (seen.has(`${placement.placementId}:${pathKey}`)) continue;
        seen.add(`${placement.placementId}:${pathKey}`);
        paths.push({ movementId: `${placement.placementId}:${movementIndex}:patrol:${pathIndex}`, placementId: placement.placementId, kind: "patrol", points: pathPoints });
      }
    }
  }
  return { paths, radii };
}

// Group exact positions so each overlapping placement remains selectable.
export function groupCoincidentMarkers(markers: readonly MarkerRecord[]): readonly MarkerRecord[] {
  if (markers.length < 2) return markers;
  const groups = new Map<string, MarkerRecord[]>();
  for (const marker of markers) {
    const key = `${marker.position[0]}:${marker.position[1]}`;
    const group = groups.get(key);
    if (group) group.push(marker);
    else groups.set(key, [marker]);
  }
  const result: MarkerRecord[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      const only = group[0];
      if (only) result.push(only);
      continue;
    }
    const ordered = [...group].sort((left, right) => left.placementId.localeCompare(right.placementId));
    const members = ordered.flatMap((marker) => marker.members);
    const categories = new Set<PublicPlacement["categories"][number]>();
    for (const marker of ordered) marker.categories.forEach((category) => categories.add(category));
    const markerId = [...group].sort((left, right) => markerFor(right.markerId).precedence - markerFor(left.markerId).precedence)[0]!.markerId;
    result.push({
      placementId: members[0]!,
      mapSpaceId: group[0]!.mapSpaceId,
      position: group[0]!.position,
      label: ordered.map((marker) => marker.label).join(" / "),
      categories: [...categories],
      markerId,
      members,
      enabled: group.every((marker) => marker.enabled),
      isTravel: group.some((marker) => marker.isTravel),
    });
  }
  return result;
}
