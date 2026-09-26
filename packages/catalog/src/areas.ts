import type { NormalizedPlacement, NormalizedPlacementArea, NormalizedRegion, NormalizedRegionGeometry } from "@afallon/contracts/catalog";

function regionSize(geometry: NormalizedRegionGeometry): number {
  if (geometry.kind === "sphere") return Math.PI * geometry.radius ** 2;
  const points = geometry.corners;
  let twiceArea = 0;
  for (let index = 0; index < points.length; index++) {
    const [x, y] = points[index]!;
    const [nextX, nextY] = points[(index + 1) % points.length]!;
    twiceArea += x * nextY - nextX * y;
  }
  return Math.abs(twiceArea) / 2;
}

function contains(geometry: NormalizedRegionGeometry, x: number, y: number): boolean {
  if (geometry.kind === "sphere") return (geometry.center[0] - x) ** 2 + (geometry.center[1] - y) ** 2 <= geometry.radius ** 2;
  let sign = 0;
  for (let index = 0; index < geometry.corners.length; index++) {
    const [aX, aY] = geometry.corners[index]!;
    const [bX, bY] = geometry.corners[(index + 1) % geometry.corners.length]!;
    const cross = (bX - aX) * (y - aY) - (bY - aY) * (x - aX);
    if (cross === 0) continue;
    if (sign !== 0 && Math.sign(cross) !== sign) return false;
    sign = Math.sign(cross);
  }
  return true;
}

export function collectPlacementAreas(placements: readonly NormalizedPlacement[], regions: readonly NormalizedRegion[]): NormalizedPlacementArea[] {
  const bySpace = new Map<string, Array<{ region: NormalizedRegion; size: number; name: string }>>();
  for (const region of regions) {
    const name = region.name.trim();
    if (!region.mapSpaceId || !region.mapGeometry || !name) continue;
    const rows = bySpace.get(region.mapSpaceId) ?? [];
    rows.push({ region, size: regionSize(region.mapGeometry), name });
    bySpace.set(region.mapSpaceId, rows);
  }
  for (const rows of bySpace.values()) rows.sort((a, b) => a.size - b.size || a.name.localeCompare(b.name) || a.region.regionId.localeCompare(b.region.regionId));
  return placements.flatMap((placement) => {
    if (!placement.mapSpaceId || !placement.mapPosition) return [];
    const area = bySpace.get(placement.mapSpaceId)?.find(({ region }) => contains(region.mapGeometry!, placement.mapPosition!.x, placement.mapPosition!.y));
    return area ? [{ placementId: placement.placementId, regionId: area.region.regionId, areaName: area.name }] : [];
  }).sort((a, b) => a.placementId.localeCompare(b.placementId));
}
