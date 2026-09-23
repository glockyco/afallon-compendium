import { COORDINATE_SYSTEM, type Layer, type PickingInfo } from "@deck.gl/core";
import { PathLayer, ScatterplotLayer } from "@deck.gl/layers";

export type MovementPath = {
  movementId: string;
  placementId: string;
  kind: "patrol" | "poi";
  points: [number, number][];
};

export type MovementRadius = {
  movementId: string;
  placementId: string;
  kind: "roaming" | "poi";
  center: [number, number];
  radius: number;
};

export type MovementGeometry = {
  paths: MovementPath[];
  radii: MovementRadius[];
};

export function createMovementLayers(
  idPrefix: string,
  geometry: MovementGeometry,
  selectedIds: ReadonlySet<string>,
  hoveredIds: ReadonlySet<string>,
  pickable: boolean,
  onSelect: (placementId: string) => void,
): Layer[] {
  const select = pickable ? (info: PickingInfo) => {
    const placementId = (info.object as { placementId?: unknown } | null)?.placementId;
    if (typeof placementId === "string") onSelect(placementId);
  } : undefined;
  const pathLayer = geometry.paths.length > 0 ? new PathLayer<MovementPath>({
    id: `${idPrefix}-paths`, data: geometry.paths, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    pickable,
    getPath: movement => movement.points,
    getColor: movement => selectedIds.has(movement.placementId) ? [250, 204, 21, 255] : hoveredIds.has(movement.placementId) ? [255, 255, 255, 255] : movement.kind === "patrol" ? [190, 120, 255, 225] : [70, 210, 190, 225],
    getWidth: movement => selectedIds.has(movement.placementId) ? 5 : hoveredIds.has(movement.placementId) ? 4 : 3,
    widthUnits: "pixels", widthMinPixels: 2, jointRounded: true, capRounded: true, onClick: select,
  }) : null;
  const radiusLayer = geometry.radii.length > 0 ? new ScatterplotLayer<MovementRadius>({
    id: `${idPrefix}-radii`, data: geometry.radii, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    pickable,
    getPosition: movement => movement.center, getRadius: movement => movement.radius,
    radiusUnits: "common", radiusMinPixels: 3, stroked: true, filled: true,
    getFillColor: movement => selectedIds.has(movement.placementId) ? [250, 204, 21, 72] : hoveredIds.has(movement.placementId) ? [255, 255, 255, 62] : [70, 210, 190, 40],
    getLineColor: movement => selectedIds.has(movement.placementId) ? [250, 204, 21, 255] : hoveredIds.has(movement.placementId) ? [255, 255, 255, 255] : [70, 210, 190, 220],
    getLineWidth: movement => selectedIds.has(movement.placementId) ? 4 : hoveredIds.has(movement.placementId) ? 3 : 2,
    lineWidthUnits: "pixels", onClick: select,
  }) : null;
  const layers: Layer[] = [];
  if (radiusLayer) layers.push(radiusLayer);
  if (pathLayer) layers.push(pathLayer);
  return layers;
}
