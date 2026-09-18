import { COORDINATE_SYSTEM, type Layer } from "@deck.gl/core";
import { IconLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { IconAtlasResult } from "../icon-atlas";
import { MARKER_LAYER_ID, markerFor, type MarkerId } from "../marker-registry";
import type { MarkerRecord } from "../render-data";

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

export function createHighlightLayers(
  id: string,
  data: readonly MarkerRecord[],
  color: [number, number, number, number],
  fill: [number, number, number, number],
  radiusOffset: number,
): Layer[] {
  if (data.length === 0) return [];
  const radius = (marker: MarkerRecord) => markerFor(marker.markerId).iconSize.base / 2 + radiusOffset;
  return [
    new ScatterplotLayer<MarkerRecord>({
      id: `${id}-outline`,
      data,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: false,
      stroked: true,
      filled: false,
      radiusUnits: "pixels",
      getPosition: marker => marker.position,
      getRadius: radius,
      getLineColor: [0, 0, 0, 255],
      getLineWidth: 6,
      lineWidthUnits: "pixels",
    }),
    new ScatterplotLayer<MarkerRecord>({
      id,
      data,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: false,
      stroked: true,
      filled: true,
      radiusUnits: "pixels",
      getPosition: marker => marker.position,
      getRadius: radius,
      getFillColor: fill,
      getLineColor: color,
      getLineWidth: 3,
      lineWidthUnits: "pixels",
    }),
  ];
}

export function createStackCountLayer(stacks: readonly MarkerRecord[]): TextLayer<MarkerRecord> | null {
  return stacks.length === 0 ? null : new TextLayer<MarkerRecord>({
    id: "map-placement-stack-counts",
    data: stacks,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    pickable: false,
    getPosition: (marker) => marker.position,
    getPixelOffset: [9, -9],
    getText: (marker) => String(marker.members.length),
    getSize: 12,
    sizeUnits: "pixels",
    getColor: [255, 255, 255, 255],
    characterSet: "auto",
    // An outline needs a signed-distance-field font; without this the renderer warns
    // and draws the count with no outline, which is illegible over pale terrain.
    fontSettings: { sdf: true },
    outlineColor: [20, 20, 20, 255],
    outlineWidth: 2,
    fontFamily: "sans-serif",
  });
}
