import {
  COORDINATE_SYSTEM,
  Deck,
  OrthographicView,
  type Layer,
  type PickingInfo,
} from "@deck.gl/core";
import { TileLayer } from "@deck.gl/geo-layers";
import { Matrix4 } from "@math.gl/core";
import { placementStyle } from "./publication";
import {
  BitmapLayer,
  PathLayer,
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
  floorId: string | null;
  layerId: string;
  placements: PublicPlacement[];
  selectedId: string | null;
  view: MapViewState;
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

type MarkerRecord = {
  placementId: string;
  position: [number, number, number];
  label: string;
  roles: string[];
  symbol: string;
  members: string[];
};

type AreaRecord = {
  areaId: string;
  placementId: string;
  polygon: Point[];
  roles: string[];
};

type TransitionRecord = {
  transitionId: string;
  placementId: string;
  path: [[number, number, number], [number, number, number]];
};

type AdapterCallbacks = {
  onViewChange: (view: MapViewState, bounds: Bounds) => void;
  onSelect: (placementId: string) => void;
  onHover: (placementId: string | null) => void;
  onError: (message: string) => void;
};

type ViewInput = {
  target?: readonly number[];
  zoom?: unknown;
};

const VIEW_ID = "map";
const MAX_TILE_CACHE = 128;
const MAX_TILE_CACHE_BYTES = 64 * 1024 * 1024;
const AGGREGATION_ZOOM = 1.5;
const AGGREGATION_CELL_PIXELS = 40;
const MAX_CLUSTER_REVEAL_ZOOM = 4;

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

function markerSymbol(roles: readonly string[]): string {
  return placementStyle(roles).symbol;
}

function markerColor(roles: readonly string[], selected: boolean, hovered: boolean): [number, number, number, number] {
  if (selected) return [255, 196, 0, 255];
  if (hovered) return [255, 255, 255, 255];
  const color = placementStyle(roles).color;
  return [color[0], color[1], color[2], 235];
}

function placementSignature(placements: readonly PublicPlacement[]): string {
  return placements
    .map(placement => `${placement.placementId}:${placement.position[0]},${placement.position[1]}:${placement.roles.join(",")}`)
    .join("\u001f");
}

function validPlacement(placement: PublicPlacement): boolean {
  return Boolean(placement.placementId && point(placement.position));
}

function buildMarkers(placements: readonly PublicPlacement[]): MarkerRecord[] {
  const byId = new Map<string, MarkerRecord>();
  for (const placement of placements) {
    if (!validPlacement(placement) || byId.has(placement.placementId)) continue;
    const position = point(placement.position)!;
    byId.set(placement.placementId, {
      placementId: placement.placementId,
      position: [position[0], position[1], 0],
      label: placement.label,
      roles: [...placement.roles],
      symbol: markerSymbol(placement.roles),
      members: [placement.placementId],
    });
  }
  return [...byId.values()];
}

function buildAreas(placements: readonly PublicPlacement[]): AreaRecord[] {
  const areas: AreaRecord[] = [];
  for (const placement of placements) {
    for (let index = 0; index < placement.areas.length; index++) {
      const source = placement.areas[index];
      if (!source) continue;
      const polygon = source
        .map(value => point(value))
        .filter((value): value is Point => value !== null);
      if (polygon.length < 3) continue;
      areas.push({
        areaId: `${placement.placementId}:${index}`,
        placementId: placement.placementId,
        polygon,
        roles: [...placement.roles],
      });
    }
  }
  return areas;
}

function buildTransitions(placements: readonly PublicPlacement[]): TransitionRecord[] {
  const transitions: TransitionRecord[] = [];
  for (const placement of placements) {
    const destination = placement.destination;
    if (!destination || destination.mapSpaceId !== placement.mapSpaceId || destination.floorId !== placement.floorId) continue;
    const from = point(placement.position);
    const to = point(destination.position);
    if (!from || !to) continue;
    transitions.push({
      transitionId: `${placement.placementId}:destination`,
      placementId: placement.placementId,
      path: [[from[0], from[1], 0], [to[0], to[1], 0]],
    });
  }
  return transitions;
}

function aggregateMarkers(markers: readonly MarkerRecord[], zoom: number, selectedId: string | null): readonly MarkerRecord[] {
  if (markers.length < 2) return markers;
  const selected = selectedId ? markers.find(marker => marker.placementId === selectedId) : undefined;
  if (zoom >= AGGREGATION_ZOOM) {
    if (!selected || markers[markers.length - 1] === selected) return markers;
    const result = markers.filter(marker => marker !== selected);
    result.push(selected);
    return result;
  }
  const cellSize = Math.max(AGGREGATION_CELL_PIXELS / 2 ** zoom, 1);
  const groups = new Map<string, MarkerRecord[]>();
  for (const marker of markers) {
    if (marker === selected) continue;
    const key = `${Math.floor(marker.position[0] / cellSize)}:${Math.floor(marker.position[1] / cellSize)}`;
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
    let x = 0;
    let y = 0;
    const members: string[] = [];
    const roles = new Set<string>();
    for (const marker of group) {
      x += marker.position[0];
      y += marker.position[1];
      members.push(...marker.members);
      marker.roles.forEach(role => roles.add(role));
    }
    members.sort();
    const roleList = [...roles].sort();
    result.push({
      placementId: `cluster:${members.join(",")}`,
      position: [x / group.length, y / group.length, 0],
      label: `${group.length} locations`,
      roles: roleList,
      symbol: String(group.length),
      members,
    });
  }
  if (selected) result.push(selected);
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

function matchingTileLayer(data: PublicationData, mapSpaceId: string, floorId: string | null, layerId: string): PublicTileLayer | null {
  return data.tileLayers.find(layer => layer.id === layerId && layer.mapSpaceId === mapSpaceId && layer.floorId === floorId) || null;
}

function matchingIllustration(data: PublicationData, mapSpaceId: string, floorId: string | null, layerId: string): PublicIllustration | null {
  return data.illustrations.find(
    illustration =>
      illustration.id === layerId &&
      illustration.mapSpaceId === mapSpaceId &&
      illustration.floorId === floorId,
  ) || null;
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
  let geometryKey = "";
  let basePlacementKey = "";
  let baseMarkers: MarkerRecord[] = [];
  let baseAreas: AreaRecord[] = [];
  let baseTransitions: TransitionRecord[] = [];
  let renderMarkers: readonly MarkerRecord[] = [];
  let imageryLayer: Layer | null = null;
  let imageryKey = "";
  let imageryResourceNamespace: string | null = null;
  let layers: Layer[] = [];
  const tileResources = new Map<string, TilePayload>();

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
    if (destroyed || namespace !== imageryResourceNamespace || signal?.aborted) {
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

  const createImagery = (next: MapAdapterUpdate, tileLayer: PublicTileLayer | null, illustration: PublicIllustration | null): Layer | null => {
    if (tileLayer) {
      const key = `tiles:${next.data.buildId}:${tileLayer.id}:${tileLayer.mapSpaceId}:${tileLayer.floorId}:${tileLayer.finestLevel}:${tileLayer.width}:${tileLayer.height}`;
      if (imageryLayer && imageryKey === key) return imageryLayer;
      if (imageryResourceNamespace) releaseTileNamespace(imageryResourceNamespace);
      const coarseScale = 2 ** tileLayer.finestLevel;
      const coarseWidth = Math.ceil(tileLayer.width / coarseScale);
      const coarseHeight = Math.ceil(tileLayer.height / coarseScale);
      imageryKey = key;
      imageryResourceNamespace = key;
      imageryLayer = new TileLayer<TilePayload | null>({
        id: "map-imagery-tiles",
        data: null,
        tileSize: tileLayer.tileSize,
        minZoom: 0,
        maxZoom: tileLayer.finestLevel,
        zoomOffset: Math.ceil(Math.log2(Math.max(Math.hypot(tileLayer.mapFromPixelEdge.xAxis.x, tileLayer.mapFromPixelEdge.xAxis.y), Math.hypot(tileLayer.mapFromPixelEdge.yAxis.x, tileLayer.mapFromPixelEdge.yAxis.y)) * coarseScale * (globalThis.devicePixelRatio || 1))),
        extent: [0, 0, coarseWidth, coarseHeight],
        modelMatrix: coarsestModelMatrix(tileLayer.mapFromPixelEdge, tileLayer.finestLevel),
        refinementStrategy: "never",
        maxCacheSize: MAX_TILE_CACHE,
        maxCacheByteSize: MAX_TILE_CACHE_BYTES,
        getTileData: props => fetchTile(tileLayer, key, props),
        renderSubLayers: props => {
          const payload = props.data;
          if (!payload) return null;
          return new BitmapLayer({
            id: `${props.id}-bitmap`,
            data: null as never,
            image: payload.image,
            bounds: bitmapBounds(payload.tile.mapFromPixelEdge, payload.tile.width, payload.tile.height),
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
          const key = tile ? `${tile.index.z}/${tile.index.x}/${tile.index.y}` : "unknown";
          report(`Unable to load screenshot tile ${key}: ${textFromError(error)}`);
        },
      });
      return imageryLayer;
    }
    if (illustration) {
      const key = `illustration:${next.data.buildId}:${illustration.id}:${illustration.registration}:${illustration.url}`;
      if (imageryLayer && imageryKey === key) return imageryLayer;
      if (imageryResourceNamespace) releaseTileNamespace(imageryResourceNamespace);
      imageryResourceNamespace = null;
      imageryKey = key;
      imageryLayer = new BitmapLayer({
        id: `map-illustration-${illustration.id}`,
        data: null as never,
        image: illustration.url,
        bounds: illustration.mapFromPixelEdge
          ? bitmapBounds(illustration.mapFromPixelEdge, illustration.width, illustration.height)
          : ownImageBounds(illustration.width, illustration.height),
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        pickable: false,
      });
      return imageryLayer;
    }
    if (imageryResourceNamespace) releaseTileNamespace(imageryResourceNamespace);
    imageryResourceNamespace = null;
    imageryLayer = null;
    imageryKey = "";
    return null;
  };

  const refreshLayers = (next: MapAdapterUpdate, view: MapViewState): void => {
    const tileLayer = matchingTileLayer(next.data, next.mapSpaceId, next.floorId, next.layerId);
    const illustration = matchingIllustration(next.data, next.mapSpaceId, next.floorId, next.layerId);
    const orientationOnly = Boolean(illustration && illustration.registration === "orientation-only");
    const layerKind = tileLayer ? `tile:${tileLayer.id}` : illustration ? `illustration:${illustration.id}:${illustration.registration}` : "missing";
    const visiblePlacements = next.placements.filter(
      placement => placement.mapSpaceId === next.mapSpaceId && placement.floorId === next.floorId,
    );
    const nextPlacementKey = placementSignature(visiblePlacements);
    if (nextPlacementKey !== basePlacementKey) {
      basePlacementKey = nextPlacementKey;
      baseMarkers = buildMarkers(visiblePlacements);
      baseAreas = buildAreas(visiblePlacements);
      baseTransitions = buildTransitions(visiblePlacements);
    }
    const markerViewKey = orientationOnly ? "hidden" : `${Math.round(view.zoom * 1000)}`;
    const nextGeometryKey = [
      next.data.buildId,
      next.mapSpaceId,
      next.floorId || "",
      next.layerId,
      layerKind,
      nextPlacementKey,
      next.selectedId || "",
      hoveredId || "",
      markerViewKey,
    ].join("\u001e");
    if (nextGeometryKey === geometryKey) return;
    geometryKey = nextGeometryKey;

    const image = createImagery(next, tileLayer, illustration);
    renderMarkers = orientationOnly ? [] : aggregateMarkers(baseMarkers, view.zoom, next.selectedId);
    const areaLayer = orientationOnly
      ? null
      : new PolygonLayer<AreaRecord>({
          id: "map-placement-areas",
          data: baseAreas,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          pickable: true,
          stroked: true,
          filled: true,
          getPolygon: area => area.polygon,
          getFillColor: area => {
            const color = markerColor(area.roles, area.placementId === next.selectedId, area.placementId === hoveredId);
            return [color[0], color[1], color[2], area.placementId === next.selectedId ? 150 : 58];
          },
          getLineColor: area => area.placementId === next.selectedId ? [255, 196, 0, 255] : [28, 28, 28, 230],
          getLineWidth: area => area.placementId === next.selectedId ? 4 : area.placementId === hoveredId ? 3 : 1,
          lineWidthUnits: "pixels",
          updateTriggers: {getFillColor: [next.selectedId, hoveredId], getLineColor: [next.selectedId], getLineWidth: [next.selectedId, hoveredId]},
          onClick: (info: PickingInfo) => {
            const id = pickedPlacementId(info);
            if (id) callbacks.onSelect(id);
          },
          onHover: (info: PickingInfo) => {
            handleHover(pickedPlacementId(info));
          },
        });
    const markerLayer = orientationOnly
      ? null
      : new ScatterplotLayer<MarkerRecord>({
          id: "map-placement-markers",
          data: renderMarkers,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          pickable: true,
          stroked: true,
          filled: true,
          radiusUnits: "pixels",
          radiusMinPixels: 4,
          radiusMaxPixels: 18,
          getPosition: marker => marker.position,
          getRadius: marker => marker.members.length > 1 ? 13 : marker.placementId === next.selectedId ? 10 : marker.placementId === hoveredId ? 9 : 7,
          getFillColor: marker => markerColor(marker.roles, marker.members.includes(next.selectedId || ""), marker.members.includes(hoveredId || "")),
          getLineColor: marker => marker.members.includes(next.selectedId || "") ? [255, 255, 255, 255] : [20, 20, 20, 255],
          lineWidthMinPixels: 1,
          lineWidthUnits: "pixels",
          updateTriggers: {getRadius: [next.selectedId, hoveredId], getFillColor: [next.selectedId, hoveredId], getLineColor: [next.selectedId]},
          onClick: (info: PickingInfo) => {
            const object = info.object as MarkerRecord | null | undefined;
            if (!object || object.members.length === 0) return;
            if (object.members.length > 1) {
              const revealZoom = Math.min(MAX_CLUSTER_REVEAL_ZOOM, Math.max(view.zoom + 1, AGGREGATION_ZOOM));
              const revealView: MapViewState = {target: object.position, zoom: revealZoom};
              activeView = revealView;
              notifyView();
              return;
            }
            callbacks.onSelect(object.members[0]!);
          },
          onHover: (info: PickingInfo) => {
            handleHover(pickedPlacementId(info));
          },
        });
    const labelLayer = orientationOnly
      ? null
      : new TextLayer<MarkerRecord>({
          id: "map-placement-labels",
          data: renderMarkers,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          pickable: false,
          getPosition: marker => marker.position,
          getText: marker => marker.members.length > 1 ? String(marker.members.length) : marker.symbol,
          getSize: marker => marker.members.length > 1 ? 14 : 12,
          sizeUnits: "pixels",
          getColor: [255, 255, 255, 255],
          getPixelOffset: [0, -1],
          characterSet: "auto",
          outlineColor: [20, 20, 20, 255],
          outlineWidth: 2,
          fontFamily: "sans-serif",
        });
    const transitionLayer = orientationOnly || baseTransitions.length === 0
      ? null
      : new PathLayer<TransitionRecord>({
          id: "map-placement-transitions",
          data: baseTransitions,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          pickable: true,
          widthUnits: "pixels",
          getPath: transition => transition.path,
          getWidth: transition => transition.placementId === next.selectedId ? 4 : 2,
          getColor: transition => transition.placementId === next.selectedId ? [255, 196, 0, 255] : [35, 112, 116, 220],
          updateTriggers: {getWidth: [next.selectedId], getColor: [next.selectedId]},
          onClick: (info: PickingInfo) => {
            const id = pickedPlacementId(info);
            if (id) callbacks.onSelect(id);
          },
          onHover: (info: PickingInfo) => {
            handleHover(pickedPlacementId(info));
          },
        });
    layers = [image, areaLayer, transitionLayer, markerLayer, labelLayer].filter((layer): layer is Layer => layer !== null);

    if (!tileLayer && !illustration) {
      const warningKey = `${next.data.buildId}:${next.mapSpaceId}:${next.floorId || ""}:${next.layerId}`;
      if (warningKey !== missingLayerWarningKey) {
        missingLayerWarningKey = warningKey;
        report(`Map layer “${next.layerId}” is not present for ${next.mapSpaceId}/${next.floorId || "outdoor"}.`);
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
    const illustration = matchingIllustration(next.data, next.mapSpaceId, next.floorId, next.layerId);
    const orientationOnly = Boolean(illustration && illustration.registration === "orientation-only");
    const nextViewSpaceKey = orientationOnly && illustration ? `orientation:${illustration.id}` : `map:${next.mapSpaceId}:${next.floorId || ""}`;
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
    imageryLayer = null;
    current = null;
  };

  return {update, destroy};
}
