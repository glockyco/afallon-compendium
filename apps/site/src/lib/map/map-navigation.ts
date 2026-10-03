import type { PublicPlacement, PublicationData } from '@afallon/contracts/public';
import type { MapView } from '../map-state';
import type { SearchIndexes } from '../map-search';
import { effectiveMapDelta, type WorldOffsetOverrides } from './world-layout';

export function linkedPlacements(
  link: Pick<MapViewLink, 'selectedPlacementId' | 'entityKey' | 'view'>,
  indexes: SearchIndexes,
): readonly PublicPlacement[] {
  if (link.view) return [];
  if (link.selectedPlacementId) {
    const placement = indexes.placementsById.get(link.selectedPlacementId);
    return placement ? [placement] : [];
  }
  return link.entityKey ? indexes.placementsByEntryKey.get(link.entityKey) ?? [] : [];
}

type MapViewLink = { selectedPlacementId: string | null; entityKey: string | null; view: MapView | null };

export function entityResults(
  placements: PublicPlacement[],
  entityKey: string | null,
  indexes: SearchIndexes,
): PublicPlacement[] {
  if (!entityKey) return placements;
  const ids = new Set((indexes.placementsByEntryKey.get(entityKey) ?? []).map((placement) => placement.placementId));
  return placements.filter((placement) => ids.has(placement.placementId));
}

export function framePlacements(
  data: PublicationData,
  placements: readonly PublicPlacement[],
  offsets: WorldOffsetOverrides,
  width: number,
  height: number,
): MapView | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const mapSpaceIds = new Set<string>();
  for (const placement of placements) {
    mapSpaceIds.add(placement.mapSpaceId);
    const delta = effectiveMapDelta(data, placement.mapSpaceId, offsets);
    const x = placement.position[0] + delta.worldX, y = placement.position[1] + delta.worldY;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  if (minX === Infinity) return null;
  const padding = 25;
  const scale = Math.min(Math.max(width, 1) / Math.max(maxX - minX + padding * 2, 1), Math.max(height, 1) / Math.max(maxY - minY + padding * 2, 1));
  const detailedZoomBySpace = new Map<string, number>();
  for (const layer of data.tileLayers) {
    if (!mapSpaceIds.has(layer.mapSpaceId)) continue;
    detailedZoomBySpace.set(layer.mapSpaceId, Math.max(detailedZoomBySpace.get(layer.mapSpaceId) ?? -Infinity, layer.maxZoom));
  }
  let imageryZoom = Infinity;
  for (const mapSpaceId of mapSpaceIds) imageryZoom = Math.min(imageryZoom, detailedZoomBySpace.get(mapSpaceId) ?? Infinity);
  return { target: [(minX + maxX) / 2, (minY + maxY) / 2, 0], zoom: Math.min(Math.log2(scale * 0.9), imageryZoom) };
}

export function visibleResults(
  matching: readonly PublicPlacement[],
  inView: readonly PublicPlacement[],
  options: { search: boolean; entityKey: string | null; mapUnavailable: boolean; hasViewport: boolean },
): readonly PublicPlacement[] {
  return !options.search && !options.entityKey && !options.mapUnavailable && options.hasViewport ? inView : matching;
}
