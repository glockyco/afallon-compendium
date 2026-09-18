import { COORDINATE_SYSTEM } from "@deck.gl/core";
import { PolygonLayer, TextLayer } from "@deck.gl/layers";
import type { Point, WorldMapBounds } from "../render-data";

export function createWorldLayers(worldBounds: WorldMapBounds[], worldLabels: { label: string; position: Point }[], authoring: boolean, unplacedMapSpaceIds: readonly string[]) {
  // Distinguish a map with missing imagery from the space outside all maps.
  const backgroundLayer = new PolygonLayer<WorldMapBounds>({
    id: "map-space-background",
    data: worldBounds,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    pickable: false,
    stroked: false,
    filled: true,
    getPolygon: (map) => map.polygon,
    getFillColor: [46, 48, 54, 255],
  });
  const boundsLayer = new PolygonLayer<WorldMapBounds>({
    id: "world-map-bounds",
    data: worldBounds,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    pickable: authoring,
    stroked: true,
    // In authoring mode the whole rectangle is a drag surface, so a map can be grabbed
    // anywhere inside it; outside authoring only the outline draws.
    filled: authoring,
    getFillColor: (map) => unplacedMapSpaceIds.includes(map.mapSpaceId) ? [220, 150, 50, 30] : [120, 180, 220, 20],
    getPolygon: (map) => map.polygon,
    getLineColor: (map) => unplacedMapSpaceIds.includes(map.mapSpaceId) ? [220, 150, 50, 220] : [120, 180, 220, 170],
    getLineWidth: 2,
    lineWidthUnits: "pixels",
  });
  const mapLabelLayer = new TextLayer({
    id: "map-space-labels",
    data: worldLabels,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    pickable: false,
    getPosition: (map: {position: Point}) => map.position,
    getText: (map: {label: string}) => map.label,
    getSize: 24,
    sizeUnits: "common",
    getColor: [255, 255, 255, 235],
    getTextAnchor: "middle",
    getAlignmentBaseline: "bottom",
    characterSet: "auto",
    fontSettings: {sdf: true},
    outlineColor: [18, 20, 24, 255],
    outlineWidth: 3,
    fontFamily: "sans-serif",
    fontWeight: 700,
  });
  return [backgroundLayer, boundsLayer, mapLabelLayer] as const;
}
