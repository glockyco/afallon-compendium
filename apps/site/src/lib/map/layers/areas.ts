import { COORDINATE_SYSTEM, type PickingInfo } from "@deck.gl/core";
import { PolygonLayer } from "@deck.gl/layers";
import type { AreaRecord, MarkerRecord } from "../render-data";
import { markerColor } from "./markers";

export function createAreaLayer(areas: AreaRecord[], markerByPlacement: ReadonlyMap<string, MarkerRecord>, selectedId: string | null, hoveredPlacementIds: readonly string[], onSelect: (id: string) => void): PolygonLayer<AreaRecord> {
  const hoveredIds = new Set(hoveredPlacementIds);
  return new PolygonLayer<AreaRecord>({
    id: "map-placement-areas",
    data: areas,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    pickable: true,
    autoHighlight: true,
    highlightColor: [250, 204, 21, 70],
    stroked: true,
    filled: true,
    getPolygon: area => area.polygon,
    getFillColor: area => {
      const marker = markerByPlacement.get(area.placementId);
      const color = markerColor(area.markerId, area.placementId === selectedId, hoveredIds.has(area.placementId), marker?.enabled ?? true);
      return [color[0], color[1], color[2], area.placementId === selectedId ? 150 : 58];
    },
    getLineColor: area => area.placementId === selectedId ? [255, 196, 0, 255] : [28, 28, 28, 230],
    getLineWidth: area => area.placementId === selectedId ? 4 : hoveredIds.has(area.placementId) ? 3 : 1,
    lineWidthUnits: "pixels",
    updateTriggers: {getFillColor: [selectedId, hoveredPlacementIds], getLineColor: [selectedId], getLineWidth: [selectedId, hoveredPlacementIds]},
    onClick: (info: PickingInfo) => {
      const id = (info.object as AreaRecord | undefined)?.placementId;
      if (id) onSelect(id);
    },
  });
}
