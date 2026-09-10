import {
  COORDINATE_SYSTEM,
  Deck,
  OrthographicView,
  type Layer,
  type PickingInfo,
} from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { Matrix4 } from "@math.gl/core";
import { createIconAtlas, type IconAtlasResult } from "./map/icon-atlas";
import { MARKER_LAYER_ID, markerFor, resolveMarker, type MarkerId } from "./map/marker-registry";
import { WorldDragController, type WorldOffsetOverrides, worldOffsetDelta } from "./map/world-layout";
import {
  BitmapLayer,
  IconLayer,
  LineLayer,
  PolygonLayer,
  ScatterplotLayer,
  TextLayer,
} from "@deck.gl/layers";
import type {
  PublicAffine,
  PublicIllustration,
  PublicPlacement,
  PublicTile,
  PublicTileLayer,
  PublicationData,
} from "../../../pipeline/public-contracts";

export type MapViewState = {
  target: [number, number, number];
  zoom: number;
};

export type MapAdapterUpdate = {
  data: PublicationData;
  mapSpaceId: string;
  layerId: string;
  placements: PublicPlacement[];
  selectedId: string | null;
  view: MapViewState;
  worldOffsets: WorldOffsetOverrides;
  authoring: boolean;
  showConnections: boolean;
};

type Point = [number, number];
type Bounds = [number, number, number, number];
type BitmapBounds = [Point, Point, Point, Point];

type TileRequest = {
  index: {z: number; x: number; y: number};
  signal?: AbortSignal;
};

type TilePayload = {
  resourceKey: string;
  tile: PublicTile;
  image: ImageBitmap;
  byteLength: number;
  closed: boolean;
};

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

type AreaRecord = {
  areaId: string;
  placementId: string;
  mapSpaceId: string;
  polygon: Point[];
  markerId: MarkerId;
};

type WorldMapBounds = {
  mapSpaceId: string;
  polygon: Point[];
};

type TravelConnection = {
  placementId: string;
  source: Point;
  target: Point;
  enabled: boolean;
};

type AdapterCallbacks = {
  onViewChange: (view: MapViewState, bounds: Bounds) => void;
  onSelect: (placementId: string) => void;
  onHover: (placementId: string | null) => void;
  onWorldOffsetChange: (mapSpaceId: string, offset: { worldX: number; worldY: number }) => void;
  onError: (message: string) => void;
};

type ViewInput = {
  target?: readonly number[];
  zoom?: unknown;
};

const VIEW_ID = "map";
const MAX_TILE_CACHE = 128;
const MAX_TILE_CACHE_BYTES = 64 * 1024 * 1024;

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function point(value: readonly number[] | null | undefined): Point | null {
  if (!value || value.length < 2 || !finite(value[0]) || !finite(value[1])) return null;
  return [value[0], value[1]];
}

function mapPoint(affine: PublicAffine, x: number, y: number): Point {
  return [
    affine.origin.x + affine.xAxis.x * x + affine.yAxis.x * y,
    affine.origin.y + affine.xAxis.y * x + affine.yAxis.y * y,
  ];
}

/**
 * BitmapLayer expects [bottom-left, top-left, top-right, bottom-right]. The
 * publication affine is expressed at top-left pixel edges, so this ordering
 * keeps image rows tied to their source pixels even when an axis is reflected.
 */
function bitmapBounds(affine: PublicAffine, width: number, height: number): BitmapBounds {
  const topLeft = mapPoint(affine, 0, 0);
  const topRight = mapPoint(affine, width, 0);
  const bottomLeft = mapPoint(affine, 0, height);
  const bottomRight = mapPoint(affine, width, height);
  return [bottomLeft, topLeft, topRight, bottomRight];
}

function ownImageBounds(width: number, height: number): BitmapBounds {
  return [
    [0, 0],
    [0, height],
    [width, height],
    [width, 0],
  ];
}

function translateBounds(bounds: BitmapBounds, x: number, y: number): BitmapBounds {
  return bounds.map(([pointX, pointY]) => [pointX + x, pointY + y] as Point) as BitmapBounds;
}

/**
 * TileLayer's non-geospatial indexing has a tileSize square at z=0 and halves
 * each tile's world span for each higher z. The public pyramid uses the same
 * z order (coarsest zero), while its map coordinates are finest-pixel units.
 * Scaling the model by 2**finestLevel therefore maps every public level to its
 * affine without changing or negating Y independently.
 */
function coarsestModelMatrix(affine: PublicAffine, finestLevel: number): Matrix4 {
  const scale = 2 ** finestLevel;
  return new Matrix4([
    affine.xAxis.x * scale,
    affine.xAxis.y * scale,
    0,
    0,
    affine.yAxis.x * scale,
    affine.yAxis.y * scale,
    0,
    0,
    0,
    0,
    1,
    0,
    affine.origin.x,
    affine.origin.y,
    0,
    1,
  ]);
}

function normalizeView(view: MapViewState | ViewInput | undefined, fallback: MapViewState): MapViewState {
  const target = view?.target;
  const zoom = view?.zoom;
  return {
    target: [
      finite(target?.[0]) ? target[0] : fallback.target[0],
      finite(target?.[1]) ? target[1] : fallback.target[1],
      0,
    ],
    zoom: finite(zoom) ? Math.max(-12, Math.min(12, zoom)) : fallback.zoom,
  };
}

function markerColor(markerId: MarkerId, selected: boolean, hovered: boolean, enabled = true): [number, number, number, number] {
  if (selected) return [255, 196, 0, 255];
  if (hovered) return [255, 255, 255, 255];
  if (!enabled) return [112, 112, 112, 220];
  const color = markerFor(markerId).color;
  return [color[0], color[1], color[2], 235];
}

function mapOffsetDelta(data: PublicationData, mapSpaceId: string, overrides: WorldOffsetOverrides): { worldX: number; worldY: number } {
  const base = data.world.offsets.find((offset) => offset.mapSpaceId === mapSpaceId);
  return base ? worldOffsetDelta(base, overrides) : { worldX: 0, worldY: 0 };
}

function placementSignature(placements: readonly PublicPlacement[]): string {
  return placements
    .map((placement) => `${placement.placementId}:${placement.position[0]},${placement.position[1]}:${placement.categories.join(",")}:${placement.levelRange?.min ?? ""}-${placement.levelRange?.max ?? ""}`)
    .join("\u001f");
}

function validPlacement(placement: PublicPlacement): boolean {
  return Boolean(placement.placementId && point(placement.position));
}

function buildMarkers(placements: readonly PublicPlacement[], data: PublicationData | null = null, overrides: WorldOffsetOverrides = {}): MarkerRecord[] {
  const byId = new Map<string, MarkerRecord>();
  for (const placement of placements) {
    if (!validPlacement(placement) || byId.has(placement.placementId)) continue;
    const markerId = resolveMarker(placement);
    if (!markerId) continue;
    const position = point(placement.position)!;
    const delta = data ? mapOffsetDelta(data, placement.mapSpaceId, overrides) : { worldX: 0, worldY: 0 };
    byId.set(placement.placementId, {
      placementId: placement.placementId,
      mapSpaceId: placement.mapSpaceId,
      position: [position[0] + delta.worldX, position[1] + delta.worldY, 0],
      label: placement.label,
      categories: [...placement.categories],
      markerId,
      members: [placement.placementId],
      enabled: placement.travel?.enabled ?? true,
      isTravel: placement.travel !== undefined,
    });
  }
  return [...byId.values()].sort((left, right) => markerFor(left.markerId).renderOrder - markerFor(right.markerId).renderOrder || left.placementId.localeCompare(right.placementId));
}

export function markerRecordsForPlacements(placements: readonly PublicPlacement[]): MarkerRecord[] {
  return buildMarkers(placements);
}

export function createPlacementIconLayer(
  markers: readonly MarkerRecord[],
  iconAtlas: IconAtlasResult,
  selectedId: string | null = null,
  hoveredId: string | null = null,
  onSelect?: (placementId: string) => void,
  onHover?: (placementId: string | null) => void,
): IconLayer<MarkerRecord> {
  return new IconLayer<MarkerRecord>({
    id: MARKER_LAYER_ID,
    data: markers,
    iconAtlas: iconAtlas.atlas as unknown as string,
    iconMapping: iconAtlas.mapping,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    pickable: true,
    billboard: false,
    getPosition: (marker) => marker.position,
    getIcon: (marker) => marker.markerId,
    getSize: (marker) => markerFor(marker.markerId).iconSize.base,
    getColor: (marker) => markerColor(marker.markerId, marker.members.includes(selectedId || ""), marker.members.includes(hoveredId || ""), marker.enabled),
    sizeUnits: "pixels",
    sizeMinPixels: 14,
    sizeMaxPixels: 44,
    updateTriggers: { getColor: [selectedId, hoveredId], getSize: [selectedId, hoveredId] },
    onClick: onSelect ? (info) => {
      const placementId = pickedPlacementId(info);
      if (placementId) onSelect(placementId);
    } : undefined,
    onHover: onHover ? (info) => onHover(pickedPlacementId(info)) : undefined,
  });
}

function buildAreas(placements: readonly PublicPlacement[], data: PublicationData | null = null, overrides: WorldOffsetOverrides = {}): AreaRecord[] {
  const areas: AreaRecord[] = [];
  for (const placement of placements) {
    for (let index = 0; index < placement.areas.length; index++) {
      const source = placement.areas[index];
      if (!source) continue;
      const delta = data ? mapOffsetDelta(data, placement.mapSpaceId, overrides) : { worldX: 0, worldY: 0 };
      const polygon = source
        .map(value => point(value))
        .filter((value): value is Point => value !== null)
        .map(([x, y]) => [x + delta.worldX, y + delta.worldY] as Point);
      if (polygon.length < 3) continue;
      const markerId = resolveMarker(placement);
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

// Markers render individually at every zoom. Only placements that share a position
// exactly are grouped, because otherwise they would draw on top of each other and the
// hidden ones could never be picked.
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

function pickedPlacementId(info: PickingInfo): string | null {
  const object = info.object as {placementId?: unknown; members?: unknown} | null | undefined;
  if (!object || typeof object.placementId !== "string") return null;
  if (Array.isArray(object.members) && typeof object.members[0] === "string") return object.members[0];
  return object.placementId;
}

function textFromError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}

function viewportBounds(view: MapViewState, canvas: HTMLCanvasElement): Bounds {
  const host = canvas.parentElement || canvas;
  const scale = 2 ** view.zoom;
  const width = Math.max(host.clientWidth, 1) / scale;
  const height = Math.max(host.clientHeight, 1) / scale;
  return [
    view.target[0] - width / 2,
    view.target[1] - height / 2,
    view.target[0] + width / 2,
    view.target[1] + height / 2,
  ];
}

function orientationView(canvas: HTMLCanvasElement, illustration: PublicIllustration): MapViewState {
  const width = Math.max(canvas.clientWidth, 1);
  const height = Math.max(canvas.clientHeight, 1);
  const scale = Math.min(width / Math.max(illustration.width, 1), height / Math.max(illustration.height, 1));
  return {
    target: [illustration.width / 2, illustration.height / 2, 0],
    zoom: Math.log2(Math.max(scale, Number.MIN_VALUE)),
  };
}

function matchingTileLayers(data: PublicationData, layerId: string): PublicTileLayer[] {
  if (layerId === "captured") return data.tileLayers;
  return data.tileLayers.filter((layer) => layer.id === layerId);
}

function matchingIllustration(data: PublicationData, layerId: string): PublicIllustration | null {
  return data.illustrations.find((illustration) => illustration.id === layerId) || null;
}

export async function createMapAdapter(
  canvas: HTMLCanvasElement,
  callbacks: AdapterCallbacks,
): Promise<{update: (next: MapAdapterUpdate) => void; destroy: () => void}> {
  let destroyed = false;
  let current: MapAdapterUpdate | null = null;
  let activeView: MapViewState = {target: [0, 0, 0], zoom: 0};
  let hoveredId: string | null = null;
  let missingLayerWarningKey: string | null = null;
  let viewSpaceKey: string | null = null;
  let offsetGeometryKey = "";
  let geometryKey = "";
  let basePlacementKey = "";
  let baseMarkers: MarkerRecord[] = [];
  let baseAreas: AreaRecord[] = [];
  let renderMarkers: readonly MarkerRecord[] = [];
  let imageryLayers: Layer[] = [];
  let imageryKey = "";
  let imageryResourceNamespace: string | null = null;
  let layers: Layer[] = [];
  const tileResources = new Map<string, TilePayload>();
  const iconAtlas = await createIconAtlas();

  const report = (message: string): void => {
    if (!destroyed) callbacks.onError(message);
  };

  const tileIndexes = new WeakMap<PublicTileLayer, Map<string, PublicTile>>();
  const getTile = (tileLayer: PublicTileLayer, z: number, x: number, y: number): PublicTile | null => {
    let index = tileIndexes.get(tileLayer);
    if (!index) {
      index = new Map(tileLayer.tiles.map(tile => [`${tile.z}/${tile.x}/${tile.y}`, tile]));
      tileIndexes.set(tileLayer, index);
    }
    return index.get(`${z}/${x}/${y}`) || null;
  };

  const releaseTilePayload = (payload: TilePayload): void => {
    if (payload.closed) return;
    const existing = tileResources.get(payload.resourceKey);
    if (existing === payload) tileResources.delete(payload.resourceKey);
    payload.closed = true;
    payload.image.close();
  };

  const releaseTileNamespace = (namespace: string): void => {
    for (const payload of tileResources.values()) {
      if (payload.resourceKey.startsWith(`${namespace}:`)) releaseTilePayload(payload);
    }
  };

  const fetchTile = async (tileLayer: PublicTileLayer, namespace: string, props: TileRequest): Promise<TilePayload | null> => {
    const {index, signal} = props;
    const tile = getTile(tileLayer, index.z, index.x, index.y);
    if (!tile || tile.state === "empty" || signal?.aborted) return null;
    const key = `${namespace}:${tile.z}/${tile.x}/${tile.y}`;
    const cached = tileResources.get(key);
    if (cached) return cached;
    const response = await fetch(tile.url, signal ? {signal} : undefined);
    if (!response.ok) throw new Error(`Tile ${key} failed to load (${response.status} ${response.statusText})`);
    const bitmap = await createImageBitmap(await response.blob());
    if (destroyed || (imageryResourceNamespace !== null && !namespace.startsWith(imageryResourceNamespace)) || signal?.aborted) {
      bitmap.close();
      return null;
    }
    if (bitmap.width !== tile.width || bitmap.height !== tile.height) {
      bitmap.close();
      throw new Error(`Tile ${key} dimensions ${bitmap.width}x${bitmap.height} do not match publication ${tile.width}x${tile.height}`);
    }
    const payload: TilePayload = {
      resourceKey: key,
      tile,
      image: bitmap,
      byteLength: bitmap.width * bitmap.height * 4,
      closed: false,
    };
    const prior = tileResources.get(key);
    if (prior) releaseTilePayload(prior);
    tileResources.set(key, payload);
    return payload;
  };

  const createImagery = (next: MapAdapterUpdate, tileLayersForView: PublicTileLayer[], illustration: PublicIllustration | null): Layer[] => {
    if (tileLayersForView.length > 0) {
      const keys = tileLayersForView.map((tileLayer) => {
        const delta = mapOffsetDelta(next.data, tileLayer.mapSpaceId, next.worldOffsets);
        return `${tileLayer.id}:${tileLayer.mapSpaceId}:${tileLayer.finestLevel}:${tileLayer.width}:${tileLayer.height}:${delta.worldX}:${delta.worldY}`;
      });
      const key = `tiles:${next.data.buildId}:${keys.join("|")}`;
      if (imageryLayers.length === tileLayersForView.length && imageryKey === key) return imageryLayers;
      if (imageryResourceNamespace) releaseTileNamespace(imageryResourceNamespace);
      imageryKey = key;
      imageryResourceNamespace = key;
      imageryLayers = tileLayersForView.map((tileLayer, layerIndex) => {
        const delta = mapOffsetDelta(next.data, tileLayer.mapSpaceId, next.worldOffsets);
        const affine = { ...tileLayer.mapFromPixelEdge, origin: { x: tileLayer.mapFromPixelEdge.origin.x + delta.worldX, y: tileLayer.mapFromPixelEdge.origin.y + delta.worldY } };
        const coarseScale = 2 ** tileLayer.finestLevel;
        const coarseWidth = Math.ceil(tileLayer.width / coarseScale);
        const coarseHeight = Math.ceil(tileLayer.height / coarseScale);
        const layerKey = `${key}:${layerIndex}`;
        return new TileLayer<TilePayload | null>({
          id: `map-imagery-${tileLayer.mapSpaceId}`,
          data: null,
          tileSize: tileLayer.tileSize,
          minZoom: 0,
          maxZoom: tileLayer.finestLevel,
          zoomOffset: Math.ceil(Math.log2(Math.max(Math.hypot(tileLayer.mapFromPixelEdge.xAxis.x, tileLayer.mapFromPixelEdge.xAxis.y), Math.hypot(tileLayer.mapFromPixelEdge.yAxis.x, tileLayer.mapFromPixelEdge.yAxis.y)) * coarseScale * (globalThis.devicePixelRatio || 1))),
          extent: [0, 0, coarseWidth, coarseHeight],
          modelMatrix: coarsestModelMatrix(affine, tileLayer.finestLevel),
          refinementStrategy: "never",
          maxCacheSize: MAX_TILE_CACHE,
          maxCacheByteSize: MAX_TILE_CACHE_BYTES,
          getTileData: props => fetchTile(tileLayer, layerKey, props),
          renderSubLayers: props => {
            const payload = props.data;
            if (!payload) return null;
            return new BitmapLayer({
              id: `${props.id}-bitmap`,
              data: null as never,
              image: payload.image,
              bounds: bitmapBounds({ ...payload.tile.mapFromPixelEdge, origin: { x: payload.tile.mapFromPixelEdge.origin.x + delta.worldX, y: payload.tile.mapFromPixelEdge.origin.y + delta.worldY } }, payload.tile.width, payload.tile.height),
              coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
              pickable: false,
            });
          },
          onTileUnload: tile => {
            const payload = tile.content as TilePayload | null;
            if (payload) releaseTilePayload(payload);
          },
          onTileError: (error, tile) => {
            if (error instanceof Error && error.name === "AbortError") return;
            const tileKey = tile ? `${tile.index.z}/${tile.index.x}/${tile.index.y}` : "unknown";
            report(`Unable to load screenshot tile ${tileKey}: ${textFromError(error)}`);
          },
        });
      });
      return imageryLayers;
    }
    if (illustration) {
      const key = `illustration:${next.data.buildId}:${illustration.id}:${illustration.registration}:${illustration.url}`;
      if (imageryLayers.length === 1 && imageryKey === key) return imageryLayers;
      if (imageryResourceNamespace) releaseTileNamespace(imageryResourceNamespace);
      imageryResourceNamespace = null;
      imageryKey = key;
      const delta = mapOffsetDelta(next.data, illustration.mapSpaceId, next.worldOffsets);
      const localBounds = illustration.mapFromPixelEdge
        ? bitmapBounds(illustration.mapFromPixelEdge, illustration.width, illustration.height)
        : ownImageBounds(illustration.width, illustration.height);
      imageryLayers = [new BitmapLayer({
        id: `map-illustration-${illustration.id}`,
        data: null as never,
        image: illustration.url,
        bounds: translateBounds(localBounds, delta.worldX, delta.worldY),
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        pickable: false,
      })];
      return imageryLayers;
    }
    if (imageryResourceNamespace) releaseTileNamespace(imageryResourceNamespace);
    imageryResourceNamespace = null;
    imageryLayers = [];
    imageryKey = "";
    return imageryLayers;
  };

  const dragController = new WorldDragController(
    (mapSpaceId, offset) => callbacks.onWorldOffsetChange(mapSpaceId, offset),
    () => undefined,
  );

  const refreshLayers = (next: MapAdapterUpdate, view: MapViewState): void => {
    const tileLayersForView = matchingTileLayers(next.data, next.layerId);
    const illustration = matchingIllustration(next.data, next.layerId);
    const orientationOnly = Boolean(illustration && illustration.registration === "orientation-only");
    const layerKind = tileLayersForView.length > 0 ? `tiles:${tileLayersForView.map((layer) => layer.id).join(",")}` : illustration ? `illustration:${illustration.id}:${illustration.registration}` : "missing";
    const visiblePlacements = next.placements;
    const nextPlacementKey = placementSignature(visiblePlacements);
    const offsetKey = Object.entries(next.worldOffsets).sort(([left], [right]) => left.localeCompare(right)).map(([mapSpaceId, offset]) => `${mapSpaceId}:${offset.worldX},${offset.worldY}`).join("|");
    if (nextPlacementKey !== basePlacementKey || offsetKey !== offsetGeometryKey) {
      basePlacementKey = nextPlacementKey;
      offsetGeometryKey = offsetKey;
      baseMarkers = buildMarkers(visiblePlacements, next.data, next.worldOffsets);
      baseAreas = buildAreas(visiblePlacements, next.data, next.worldOffsets);
    }
    const markerViewKey = orientationOnly ? "hidden" : `${Math.round(view.zoom * 1000)}`;
    const nextGeometryKey = [next.data.buildId, next.layerId, layerKind, nextPlacementKey, offsetKey, next.selectedId || "", hoveredId || "", markerViewKey, next.authoring ? "authoring" : "reader", next.showConnections ? "connections" : "no-connections"].join("\u001e");
    if (nextGeometryKey === geometryKey) return;
    geometryKey = nextGeometryKey;

    const imageLayers = createImagery(next, tileLayersForView, illustration);
    const visibleMarkers = next.showConnections || next.authoring ? baseMarkers : baseMarkers.filter((marker) => !marker.isTravel);
    renderMarkers = orientationOnly ? [] : groupCoincidentMarkers(visibleMarkers);
    const markerByPlacement = new Map(baseMarkers.map((marker) => [marker.placementId, marker]));
    const boundsLayer = orientationOnly ? null : new PolygonLayer<WorldMapBounds>({
      id: "world-map-bounds",
      data: next.data.maps.map((map) => {
        const delta = mapOffsetDelta(next.data, map.mapSpaceId, next.worldOffsets);
        return { mapSpaceId: map.mapSpaceId, polygon: [[map.bounds.min.x + delta.worldX, map.bounds.min.y + delta.worldY], [map.bounds.min.x + delta.worldX, map.bounds.max.y + delta.worldY], [map.bounds.max.x + delta.worldX, map.bounds.max.y + delta.worldY], [map.bounds.max.x + delta.worldX, map.bounds.min.y + delta.worldY]] };
      }),
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: next.authoring,
      stroked: true,
      filled: false,
      getPolygon: (map) => map.polygon,
      getLineColor: (map) => next.data.world.unplacedMapSpaceIds.includes(map.mapSpaceId) ? [220, 150, 50, 220] : [120, 180, 220, 170],
      getLineWidth: 2,
      lineWidthUnits: "pixels",
      onDragStart: (info: PickingInfo) => {
        const object = info.object as WorldMapBounds | null | undefined;
        const coordinate = point(info.coordinate as readonly number[] | undefined);
        if (!object || !coordinate) return false;
        const offsets = new Map(next.data.world.offsets.map((offset) => { const delta = mapOffsetDelta(next.data, offset.mapSpaceId, next.worldOffsets); return [offset.mapSpaceId, { worldX: offset.worldX + delta.worldX, worldY: offset.worldY + delta.worldY }] as const; }));
        return dragController.tryStart({ layerId: info.layer?.id, mapSpaceId: object.mapSpaceId, coordinate }, next.authoring, offsets);
      },
      onDrag: (info: PickingInfo) => {
        const coordinate = point(info.coordinate as readonly number[] | undefined);
        if (coordinate) dragController.move(coordinate);
      },
      onDragEnd: () => dragController.end(),
    });
    const areaLayer = orientationOnly ? null : new PolygonLayer<AreaRecord>({
      id: "map-placement-areas",
      data: baseAreas,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: true,
      stroked: true,
      filled: true,
      getPolygon: area => area.polygon,
      getFillColor: area => {
        const marker = markerByPlacement.get(area.placementId);
        const color = markerColor(area.markerId, area.placementId === next.selectedId, area.placementId === hoveredId, marker?.enabled ?? true);
        return [color[0], color[1], color[2], area.placementId === next.selectedId ? 150 : 58];
      },
      getLineColor: area => area.placementId === next.selectedId ? [255, 196, 0, 255] : [28, 28, 28, 230],
      getLineWidth: area => area.placementId === next.selectedId ? 4 : area.placementId === hoveredId ? 3 : 1,
      lineWidthUnits: "pixels",
      updateTriggers: {getFillColor: [next.selectedId, hoveredId, offsetKey], getLineColor: [next.selectedId], getLineWidth: [next.selectedId, hoveredId]},
      onClick: (info: PickingInfo) => { const id = pickedPlacementId(info); if (id) callbacks.onSelect(id); },
      onHover: (info: PickingInfo) => { handleHover(pickedPlacementId(info)); },
    });
    const connectionData: TravelConnection[] = [];
    for (const placement of next.placements) {
      if (placement.travel?.destination.status !== "resolved" || !placement.travel.destination.position || !placement.travel.destination.mapSpaceId) continue;
      const source = markerByPlacement.get(placement.placementId);
      if (!source) continue;
      const targetDelta = mapOffsetDelta(next.data, placement.travel.destination.mapSpaceId, next.worldOffsets);
      connectionData.push({ placementId: placement.placementId, source: [source.position[0], source.position[1]], target: [placement.travel.destination.position[0] + targetDelta.worldX, placement.travel.destination.position[1] + targetDelta.worldY], enabled: placement.travel.enabled });
    }
    const connectionLines = !orientationOnly && (next.showConnections || next.authoring) ? new LineLayer<TravelConnection>({
      id: "world-travel-connections",
      data: connectionData,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: false,
      getSourcePosition: (connection) => connection.source,
      getTargetPosition: (connection) => connection.target,
      getColor: (connection) => connection.enabled ? [100, 210, 255, 205] : [120, 120, 120, 180],
      getWidth: 3,
      widthUnits: "pixels",
    }) : null;
    const connectionDestinations = !orientationOnly && (next.showConnections || next.authoring) ? new ScatterplotLayer<TravelConnection>({
      id: "world-travel-destinations",
      data: connectionData,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: false,
      radiusUnits: "pixels",
      getPosition: (connection) => connection.target,
      getRadius: 5,
      getFillColor: (connection) => connection.enabled ? [100, 210, 255, 220] : [120, 120, 120, 190],
      getLineColor: [20, 40, 50, 230],
      stroked: true,
      lineWidthMinPixels: 1,
    }) : null;
    const stacks = renderMarkers.filter((marker) => marker.members.length > 1);
    // Every marker draws as its own icon. A stack of placements at one position selects
    // the next member on each click, so a hidden member is still reachable.
    const selectStacked = (placementId: string) => {
      const stack = stacks.find((marker) => marker.members.includes(placementId));
      if (!stack) return callbacks.onSelect(placementId);
      const current = stack.members.indexOf(next.selectedId ?? "");
      return callbacks.onSelect(stack.members[(current + 1) % stack.members.length]!);
    };
    const markerLayer = orientationOnly ? null : createPlacementIconLayer(renderMarkers, iconAtlas, next.selectedId, hoveredId, selectStacked, handleHover);
    const stackCounts = orientationOnly || stacks.length === 0 ? null : new TextLayer<MarkerRecord>({
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
      outlineColor: [20, 20, 20, 255],
      outlineWidth: 2,
      fontFamily: "sans-serif",
    });
    layers = [...imageLayers, boundsLayer, connectionLines, connectionDestinations, areaLayer, markerLayer, stackCounts].filter((layer): layer is Layer => layer !== null);

    if (imageLayers.length === 0 && !illustration) {
      const warningKey = `${next.data.buildId}:${next.layerId}`;
      if (warningKey !== missingLayerWarningKey) {
        missingLayerWarningKey = warningKey;
        report("The selected map layer is not available.");
      }
    }
  };

  const deck: Deck<OrthographicView> = new Deck<OrthographicView>({
    canvas,
    views: new OrthographicView({id: VIEW_ID, flipY: false, controller: true}),
    viewState: activeView,
    layers: [],
    onViewStateChange: params => {
      if (destroyed) return;
      const nextView = normalizeView(params.viewState, activeView);
      activeView = nextView;
      if (current) refreshLayers(current, nextView);
      notifyView();
    },
    onError: error => report(`Map rendering error: ${textFromError(error)}`),
  });

  const handleHover = (placementId: string | null): void => {
    if (placementId === hoveredId) return;
    hoveredId = placementId;
    if (current) {
      refreshLayers(current, activeView);
      deck.setProps({layers});
    }
    callbacks.onHover(placementId);
  };

  let notifiedBounds: Bounds | null = null;
  const notifyView = (): void => {
    if (!current) return;
    const bounds = viewportBounds(activeView, canvas);
    if (notifiedBounds && bounds.every((value, index) => value === notifiedBounds![index])) return;
    notifiedBounds = bounds;
    callbacks.onViewChange(activeView, bounds);
  };

  const resize = (): void => {
    if (destroyed) return;
    const host = canvas.parentElement || canvas;
    if (host.clientWidth > 0 && host.clientHeight > 0) deck.setProps({width: host.clientWidth, height: host.clientHeight});
    notifyView();
  };
  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(resize);
    const resizeTarget = canvas.parentElement || canvas;
    resizeObserver.observe(resizeTarget);
  } else if (typeof window !== "undefined") {
    window.addEventListener("resize", resize);
  }
  resize();

  const update = (next: MapAdapterUpdate): void => {
    if (destroyed) return;
    current = next;
    let view = normalizeView(next.view, activeView);
    const illustration = matchingIllustration(next.data, next.layerId);
    const orientationOnly = Boolean(illustration && illustration.registration === "orientation-only");
    const nextViewSpaceKey = orientationOnly && illustration ? `orientation:${illustration.id}` : `map:${next.mapSpaceId}`;
    if (orientationOnly && illustration && viewSpaceKey !== nextViewSpaceKey) {
      view = orientationView(canvas, illustration);
    }
    viewSpaceKey = nextViewSpaceKey;
    activeView = view;
    refreshLayers(next, view);
    deck.setProps({viewState: view, layers});
    notifyView();
  };

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (typeof window !== "undefined") window.removeEventListener("resize", resize);
    deck.finalize();
    for (const payload of [...tileResources.values()]) releaseTilePayload(payload);
    tileResources.clear();
    layers = [];
    imageryLayers = [];
    current = null;
  };

  return {update, destroy};
}
