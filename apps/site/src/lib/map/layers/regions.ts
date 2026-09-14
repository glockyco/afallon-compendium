import { COORDINATE_SYSTEM, type Layer } from "@deck.gl/core";
import { PolygonLayer, TextLayer } from "@deck.gl/layers";
import type { PublicRegion } from "@afallon/contracts/public";

export type RegionRecord = {
  id: string;
  mapSpaceId: string;
  name: string;
  shape: PublicRegion["shape"];
  polygon: [number, number][];
};

export function polygonCentroid(polygon: readonly [number, number][]): [number, number] {
  if (polygon.length < 3) return polygon[0] ?? [0, 0];
  let areaTwice = 0, centroidX = 0, centroidY = 0;
  for (let index = 0; index < polygon.length; index++) {
    const current = polygon[index]!;
    const next = polygon[(index + 1) % polygon.length]!;
    const cross = current[0] * next[1] - next[0] * current[1];
    areaTwice += cross;
    centroidX += (current[0] + next[0]) * cross;
    centroidY += (current[1] + next[1]) * cross;
  }
  if (areaTwice === 0) {
    const total = polygon.reduce(([x, y], [nextX, nextY]) => [x + nextX, y + nextY] as [number, number], [0, 0]);
    return [total[0] / polygon.length, total[1] / polygon.length];
  }
  return [centroidX / (3 * areaTwice), centroidY / (3 * areaTwice)];
}

export function createRegionLayers(regions: readonly RegionRecord[]): Layer[] {
  return [
    new PolygonLayer<RegionRecord>({ id: "world-region-outline-halo", data: regions, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: false, stroked: true, filled: true, getPolygon: region => region.polygon, getFillColor: [24, 20, 14, 24], getLineColor: [22, 18, 12, 210], getLineWidth: 6, lineWidthUnits: "pixels" }),
    new PolygonLayer<RegionRecord>({ id: "world-region-outlines", data: regions, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: false, stroked: true, filled: false, getPolygon: region => region.polygon, getLineColor: [235, 205, 139, 245], getLineWidth: 2, lineWidthUnits: "pixels" }),
    new TextLayer<RegionRecord>({ id: "world-region-labels", data: regions, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: false, getPosition: region => polygonCentroid(region.polygon), getText: region => region.name, getSize: 20, sizeUnits: "common", sizeMaxPixels: 16, getColor: [235, 220, 180, 235], getTextAnchor: "middle", getAlignmentBaseline: "center", characterSet: "auto", fontSettings: { sdf: true }, outlineColor: [18, 20, 24, 255], outlineWidth: 3, fontFamily: "sans-serif", fontWeight: 600 }),
  ];
}
