import { COORDINATE_SYSTEM } from "@deck.gl/core";
import { IconLayer } from "@deck.gl/layers";
import type { IconAtlasResult } from "../icon-atlas";
import { MARKER_LAYER_ID, markerFor, type MarkerId } from "../marker-registry";
import type { MarkerRecord } from "../../map-renderer";

export function markerColor(markerId: MarkerId, selected: boolean, hovered: boolean, enabled = true): [number, number, number, number] {
  if (selected) return [255, 196, 0, 255];
  if (hovered) return [255, 255, 255, 255];
  if (!enabled) return [112, 112, 112, 220];
  const color = markerFor(markerId).color;
  return [color[0], color[1], color[2], 235];
}

export function createPlacementIconLayer(
  markers: readonly MarkerRecord[],
  iconAtlas: IconAtlasResult,
  selectedId: string | null = null,
  hoveredId: string | null = null,
  onSelect?: (placementId: string) => void,
  onHover?: (placementId: string | null) => void,
): IconLayer<MarkerRecord> {
  const pickedId = (object: MarkerRecord | null | undefined): string | null => object?.placementId ?? null;
  return new IconLayer<MarkerRecord>({
    id: MARKER_LAYER_ID, data: markers, iconAtlas: iconAtlas.atlas as unknown as string, iconMapping: iconAtlas.mapping,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: true, billboard: false,
    getPosition: marker => marker.position, getIcon: marker => marker.markerId,
    getSize: marker => markerFor(marker.markerId).iconSize.base,
    getColor: marker => markerColor(marker.markerId, marker.members.includes(selectedId || ""), marker.members.includes(hoveredId || ""), marker.enabled),
    sizeUnits: "pixels", sizeMinPixels: 14, sizeMaxPixels: 44,
    updateTriggers: { getColor: [selectedId, hoveredId], getSize: [selectedId, hoveredId] },
    onClick: onSelect ? info => { const placementId = pickedId(info.object); if (placementId) onSelect(placementId); } : undefined,
    onHover: onHover ? info => onHover(pickedId(info.object)) : undefined,
  });
}
