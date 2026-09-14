import { COORDINATE_SYSTEM, type Layer } from "@deck.gl/core";
import { LineLayer, ScatterplotLayer } from "@deck.gl/layers";

export type TravelConnection = {
  placementId: string;
  source: [number, number];
  target: [number, number];
  enabled: boolean;
};

export function createConnectionLayers(
  connections: readonly TravelConnection[],
  selectedId: string | null,
  hoveredIds: ReadonlySet<string>,
): Layer[] {
  if (connections.length === 0) return [];
  return [
    new LineLayer<TravelConnection>({
      id: "world-travel-connections", data: connections, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: false,
      getSourcePosition: connection => connection.source, getTargetPosition: connection => connection.target,
      getColor: connection => !connection.enabled
        ? connection.placementId === selectedId ? [185, 160, 115, 255] : [120, 120, 120, 180]
        : connection.placementId === selectedId ? [250, 204, 21, 255]
          : hoveredIds.has(connection.placementId) ? [100, 230, 255, 255] : [100, 210, 255, 205],
      getWidth: connection => connection.placementId === selectedId ? 5 : hoveredIds.has(connection.placementId) ? 4 : 3,
      widthUnits: "pixels", updateTriggers: { getColor: [selectedId, [...hoveredIds]], getWidth: [selectedId, [...hoveredIds]] },
    }),
    new ScatterplotLayer<TravelConnection>({
      id: "world-travel-destinations", data: connections, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: false,
      radiusUnits: "pixels", getPosition: connection => connection.target, getRadius: 5,
      getFillColor: connection => connection.enabled ? [100, 210, 255, 220] : [120, 120, 120, 190],
      getLineColor: [20, 40, 50, 230], stroked: true, lineWidthMinPixels: 1,
    }),
  ];
}

export function createHoverConnectionLayers(connections: readonly TravelConnection[]): Layer[] {
  if (connections.length === 0) return [];
  return [
    new LineLayer<TravelConnection>({
      id: "pointer-hover-connections", data: connections, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: false,
      getSourcePosition: connection => connection.source, getTargetPosition: connection => connection.target,
      getColor: connection => connection.enabled ? [100, 230, 255, 255] : [120, 120, 120, 180], getWidth: 4, widthUnits: "pixels",
    }),
    new ScatterplotLayer<TravelConnection>({
      id: "pointer-hover-destinations", data: connections, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: false,
      radiusUnits: "pixels", getPosition: connection => connection.target, getRadius: 5,
      getFillColor: connection => connection.enabled ? [100, 210, 255, 220] : [120, 120, 120, 190],
      getLineColor: [20, 40, 50, 230], stroked: true, lineWidthMinPixels: 1,
    }),
  ];
}
