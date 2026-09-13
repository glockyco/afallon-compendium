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
import { MAP_EVENT_RECOGNIZER_OPTIONS, MAX_VIEW_ZOOM, MIN_VIEW_ZOOM } from "./map/interaction";
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
  PublicPlacement,
  PublicRegion,
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
  layerIds: readonly string[];
  categories: readonly MarkerId[];
  placements: PublicPlacement[];
  selectedId: string | null;
  highlightedPlacementIds: readonly string[];
  hoveredPlacementIds: readonly string[];
  worldOffsets: WorldOffsetOverrides;
  authoring: boolean;
  showConnections: boolean;
  showZones: boolean;
};

type Point = [number, number];
type Bounds = [number, number, number, number];
type BitmapBounds = [Point, Point, Point, Point];

type TileRequest = {
  index: {z: number; x: number; y: number};
  signal?: AbortSignal;
};

type LoadedTile = {
  tile: PublicTile;
  image: ImageBitmap;
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

type RegionRecord = {
  id: string;
  mapSpaceId: string;
  name: string;
  shape: PublicRegion["shape"];
  polygon: Point[];
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
  onReady: () => void;
  onError: (message: string) => void;
};

type ViewInput = {
  target?: readonly number[];
  zoom?: unknown;
};

const VIEW_ID = "map";

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function point(value: readonly number[] | null | undefined): Point | null {
  if (!value || value.length < 2 || !finite(value[0]) || !finite(value[1])) return null;
  return [value[0], value[1]];
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
    zoom: finite(zoom) ? Math.max(MIN_VIEW_ZOOM, Math.min(MAX_VIEW_ZOOM, zoom)) : fallback.zoom,
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

function buildMarkers(placements: readonly PublicPlacement[], data: PublicationData | null = null, overrides: WorldOffsetOverrides = {}, activeCategories: ReadonlySet<MarkerId> | null = null): MarkerRecord[] {
  const byId = new Map<string, MarkerRecord>();
  for (const placement of placements) {
    if (!validPlacement(placement) || byId.has(placement.placementId)) continue;
    const categories = activeCategories ? placement.categories.filter((category) => activeCategories.has(category)) : placement.categories;
    const markerId = resolveMarker({categories});
    if (!markerId) continue;
    const position = point(placement.position)!;
    const delta = data ? mapOffsetDelta(data, placement.mapSpaceId, overrides) : { worldX: 0, worldY: 0 };
    byId.set(placement.placementId, {
      placementId: placement.placementId,
      mapSpaceId: placement.mapSpaceId,
      position: [position[0] + delta.worldX, position[1] + delta.worldY, 0],
      label: placement.label,
      categories: [...categories],
      markerId,
      members: [placement.placementId],
      enabled: placement.travel?.enabled ?? true,
      isTravel: placement.travel !== undefined,
    });
  }
  return [...byId.values()].sort((left, right) => markerFor(left.markerId).renderOrder - markerFor(right.markerId).renderOrder || left.placementId.localeCompare(right.placementId));
}

export function markerRecordsForPlacements(placements: readonly PublicPlacement[], activeCategories?: readonly MarkerId[]): MarkerRecord[] {
  return buildMarkers(placements, null, {}, activeCategories ? new Set(activeCategories) : null);
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

function createHighlightLayers(
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

function regionSignature(regions: readonly PublicRegion[]): string {
  return regions.map((region) => `${region.id}:${region.mapSpaceId}:${region.shape}:${region.name}:${region.polygon.map(([x, y]) => `${x},${y}`).join(";")}`).join("\u001f");
}

function buildRegions(regions: readonly PublicRegion[], data: PublicationData, overrides: WorldOffsetOverrides): RegionRecord[] {
  return regions.map((region) => {
    const delta = mapOffsetDelta(data, region.mapSpaceId, overrides);
    return {
      id: region.id,
      mapSpaceId: region.mapSpaceId,
      name: region.name,
      shape: region.shape,
      polygon: region.polygon.map(([x, y]) => [x + delta.worldX, y + delta.worldY] as Point),
    };
  });
}

function polygonCentroid(polygon: readonly Point[]): Point {
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
    const total = polygon.reduce(([x, y], [nextX, nextY]) => [x + nextX, y + nextY] as Point, [0, 0]);
    return [total[0] / polygon.length, total[1] / polygon.length];
  }
  return [centroidX / (3 * areaTwice), centroidY / (3 * areaTwice)];
}

function buildAreas(placements: readonly PublicPlacement[], data: PublicationData | null = null, overrides: WorldOffsetOverrides = {}, activeCategories: ReadonlySet<MarkerId> | null = null): AreaRecord[] {
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
      const categories = activeCategories ? placement.categories.filter((category) => activeCategories.has(category)) : placement.categories;
      const markerId = resolveMarker({categories});
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

// 'captured' stands for every captured pyramid and 'game-maps' for every game map, as masters
// over the individual layer ids.
function matchingTileLayers(data: PublicationData, layerIds: readonly string[]): PublicTileLayer[] {
  const allCaptured = layerIds.includes("captured"), allGameMaps = layerIds.includes("game-maps");
  return data.tileLayers.filter((layer) => layerIds.includes(layer.id) || (allCaptured && layer.kind === "captured") || (allGameMaps && layer.kind === "game-map"));
}

export type MapAdapter = {
  update: (next: MapAdapterUpdate) => void;
  setView: (next: MapViewState) => void;
  destroy: () => void;
};

export async function createMapAdapter(
  canvas: HTMLCanvasElement,
  initialView: MapViewState,
  callbacks: AdapterCallbacks,
): Promise<MapAdapter> {
  let destroyed = false;
  let current: MapAdapterUpdate | null = null;
  let activeView = normalizeView(initialView, {target: [0, 0, 0], zoom: 0});
  let lastPickedId: string | null = null;
  let missingLayerWarningKey: string | null = null;
  let viewSpaceKey: string | null = null;
  const viewsBySpace = new Map<string, MapViewState>();
  let offsetGeometryKey = "";
  let geometryKey = "";
  let basePlacementKey = "";
  let baseMarkers: MarkerRecord[] = [];
  let baseAreas: AreaRecord[] = [];
  let baseRegions: RegionRecord[] = [];
  let baseRegionKey = "";
  let renderMarkers: readonly MarkerRecord[] = [];
  let imageryLayers: Layer[] = [];
  let imageryKey = "";
  let layers: Layer[] = [];
  let pointerHoverLayers: Layer[] = [];
  let allConnections: TravelConnection[] = [];
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

  // A tile is loaded when its pixels are ready, not before. deck.gl drops the parent tile
  // the moment this promise resolves, so resolving with anything less than the decoded
  // image shows a black square until the bytes arrive. The bitmap is never closed here:
  // deck.gl's tile cache owns its lifetime, so a tile scrolled back into view is drawn
  // from cache instead of fetched and decoded again.
  const loadTile = async (tileLayer: PublicTileLayer, props: TileRequest): Promise<LoadedTile | null> => {
    const tile = getTile(tileLayer, props.index.z, props.index.x, props.index.y);
    if (!tile || tile.state === "empty") return null;
    const response = await fetch(tile.url, props.signal ? {signal: props.signal} : undefined);
    if (!response.ok) throw new Error(`Tile ${tile.z}/${tile.x}/${tile.y} failed to load (${response.status} ${response.statusText})`);
    // A tile is loaded when its pixels are ready, not before. deck.gl drops the parent tile
    // the moment this promise resolves, so resolving with anything less than the decoded
    // image shows a black square until the bytes arrive. The bitmap is never closed here:
    // deck.gl's tile cache owns its lifetime, so a tile scrolled back into view is drawn
    // from cache instead of fetched and decoded again.
    const image = await createImageBitmap(await response.blob());
    return {tile, image};
  };

  const createImagery = (next: MapAdapterUpdate, tileLayersForView: PublicTileLayer[]): Layer[] => {
    if (tileLayersForView.length > 0) {
      // Game maps are the backdrop; captured imagery draws over them.
      const ordered = [...tileLayersForView].sort((left, right) => Number(left.kind === "captured") - Number(right.kind === "captured"));
      // A pyramid is published in its map's local coordinates, so it moves by the whole effective
      // offset, unlike markers and bounds, which publication has already placed and which move by
      // the delta from that placement.
      const placed = ordered.map((tileLayer) => { const base = next.data.world.offsets.find((offset) => offset.mapSpaceId === tileLayer.mapSpaceId); const delta = mapOffsetDelta(next.data, tileLayer.mapSpaceId, next.worldOffsets); return { tileLayer, offset: { worldX: (base?.worldX ?? 0) + delta.worldX, worldY: (base?.worldY ?? 0) + delta.worldY } }; });
      const key = `tiles:${next.data.buildId}:${placed.map(({ tileLayer, offset }) => `${tileLayer.id}:${offset.worldX}:${offset.worldY}`).join("|")}`;
      if (imageryLayers.length === tileLayersForView.length && imageryKey === key) return imageryLayers;
      imageryKey = key;
      imageryLayers = placed.map(({ tileLayer, offset }) => pyramidLayer(`map-imagery-${tileLayer.id}`, tileLayer, offset));
      return imageryLayers;
    }
    imageryLayers = [];
    imageryKey = "";
    return imageryLayers;
  };

  // One deck TileLayer per published pyramid. Each pyramid keeps its own local lattice and is
  // translated into the world by a model matrix, so a map can sit at any world offset; tile
  // selection goes through the matrix inverse. Captured imagery and game maps share the
  // loader and the cache; only their draw order differs.
  const pyramidLayer = (id: string, tileLayer: PublicTileLayer, offset: { worldX: number; worldY: number }): Layer => {
        return new TileLayer<LoadedTile | null>({
          id,
          data: null,
          tileSize: tileLayer.tileSize,
          minZoom: tileLayer.minZoom,
          maxZoom: tileLayer.maxZoom,
          extent: tileLayer.extent,
          modelMatrix: new Matrix4().translate([offset.worldX, offset.worldY, 0]),
          getTileData: props => loadTile(tileLayer, props),
          renderSubLayers: props => {
            if (!props.data) return null;
            const [[west, south], [east, north]] = props.tile.boundingBox as [[number, number], [number, number]];
            // The tile's bounding box is in the pyramid's local space; the sublayer carries the
            // same model matrix as its parent to land in the world.
            return new BitmapLayer({
              id: `${props.id}-bitmap`,
              data: null as never,
              image: props.data.image,
              bounds: [west, south, east, north],
              coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
              modelMatrix: props.modelMatrix,
              pickable: false,
            });
          },
          onTileError: (error, tile) => {
            if (error instanceof Error && error.name === "AbortError") return;
            const tileKey = tile ? `${tile.index.z}/${tile.index.x}/${tile.index.y}` : "unknown";
            report(`Unable to load tile ${tileKey}: ${textFromError(error)}`);
          },
        });
  };

  const dragController = new WorldDragController(
    (mapSpaceId, offset) => callbacks.onWorldOffsetChange(mapSpaceId, offset),
    () => undefined,
  );
  // deck.gl picks asynchronously, so a layer's onDragStart runs after the controller has
  // already begun panning. A map drag is decided here instead, on the raw pointerdown before
  // the controller sees it: a synchronous pick on the bounds layer starts the drag and turns
  // the controller's pan off until the pointer is released.
  const setDragPan = (enabled: boolean): void => {
    deck.setProps({ views: new OrthographicView({ id: VIEW_ID, flipY: false, controller: { inertia: false, dragPan: enabled, dragRotate: false } }) });
  };
  const unprojectPointer = (event: PointerEvent): [number, number] | null => {
    const rect = canvas.getBoundingClientRect();
    const viewport = deck.getViewports().find((candidate) => candidate.id === VIEW_ID);
    const world = viewport?.unproject([event.clientX - rect.left, event.clientY - rect.top]);
    const x = world?.[0], y = world?.[1];
    return typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
  };
  const onPointerDown = (event: PointerEvent): void => {
    if (!current?.authoring || event.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    const info = deck.pickObject({ x: event.clientX - rect.left, y: event.clientY - rect.top, radius: 1, layerIds: ["world-map-bounds"] });
    const object = info?.object as WorldMapBounds | null | undefined;
    const coordinate = unprojectPointer(event);
    if (!object || !coordinate) return;
    if (current.data.world.offsets.find((offset) => offset.mapSpaceId === object.mapSpaceId)?.source === "native") return;
    const data = current;
    const offsets = new Map(data.data.world.offsets.map((offset) => { const delta = mapOffsetDelta(data.data, offset.mapSpaceId, data.worldOffsets); return [offset.mapSpaceId, { worldX: offset.worldX + delta.worldX, worldY: offset.worldY + delta.worldY }] as const; }));
    if (dragController.tryStart({ layerId: "world-map-bounds", mapSpaceId: object.mapSpaceId, coordinate }, true, offsets)) setDragPan(false);
  };
  const onPointerMove = (event: PointerEvent): void => {
    const coordinate = unprojectPointer(event);
    if (coordinate) dragController.move(coordinate);
  };
  const onPointerUp = (): void => {
    if (dragController.active) { dragController.end(); setDragPan(true); }
  };
  // deck.gl may wrap the canvas; the listener sits on the host element in the capture phase
  // so it runs before deck.gl's own pointer handling on any descendant.
  const pointerHost: HTMLElement = canvas.parentElement ?? canvas;
  const browserUiEvents = ["contextmenu", "selectstart", "gesturestart", "gesturechange", "gestureend"] as const;
  const preventCanvasBrowserUi = (event: Event): void => {
    if (event.target instanceof HTMLCanvasElement) event.preventDefault();
  };
  for (const type of browserUiEvents) pointerHost.addEventListener(type, preventCanvasBrowserUi, {passive: false});
  pointerHost.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  const refreshLayers = (next: MapAdapterUpdate): void => {
    const tileLayersForView = matchingTileLayers(next.data, next.layerIds);
    // Markers, labels, and areas belong to the world, not to whichever imagery is switched on.
    const layerKind = `tiles:${tileLayersForView.map((layer) => layer.id).join(",")}`;
    const visiblePlacements = next.placements;
    const activeCategories = next.categories.length > 0 ? new Set(next.categories) : null;
    const categoryKey = [...next.categories].sort().join(",");
    const nextPlacementKey = `${placementSignature(visiblePlacements)}\u001d${categoryKey}`;
    const nextRegionKey = regionSignature(next.data.regions);
    const offsetKey = Object.entries(next.worldOffsets).sort(([left], [right]) => left.localeCompare(right)).map(([mapSpaceId, offset]) => `${mapSpaceId}:${offset.worldX},${offset.worldY}`).join("|");
    const offsetChanged = offsetKey !== offsetGeometryKey;
    if (nextPlacementKey !== basePlacementKey || offsetChanged) {
      basePlacementKey = nextPlacementKey;
      offsetGeometryKey = offsetKey;
      baseMarkers = buildMarkers(visiblePlacements, next.data, next.worldOffsets, activeCategories);
      baseAreas = buildAreas(visiblePlacements, next.data, next.worldOffsets, activeCategories);
    }
    if (nextRegionKey !== baseRegionKey || offsetChanged) {
      baseRegionKey = nextRegionKey;
      baseRegions = buildRegions(next.data.regions, next.data, next.worldOffsets);
    }
    const highlightedKey = [...next.highlightedPlacementIds].sort().join(",");
    const hoveredKey = [...next.hoveredPlacementIds].sort().join(",");
    const hoveredIds = new Set(next.hoveredPlacementIds);
    const nextGeometryKey = [next.data.buildId, [...next.layerIds].sort().join(","), layerKind, nextPlacementKey, nextRegionKey, offsetKey, next.selectedId || "", highlightedKey, hoveredKey, next.authoring ? "authoring" : "reader", next.showConnections ? "connections" : "no-connections", next.showZones ? "zones" : "no-zones"].join("\u001e");
    if (nextGeometryKey === geometryKey) return;
    geometryKey = nextGeometryKey;

    const imageLayers = createImagery(next, tileLayersForView);
    // Travel markers are a category like any other; the connections toggle draws only the lines.
    const visibleMarkers = baseMarkers;
    renderMarkers = groupCoincidentMarkers(visibleMarkers);
    const markerByPlacement = new Map(baseMarkers.map((marker) => [marker.placementId, marker]));
    // Ground that a map space declares but no capture has photographed yet must read as
    // absent imagery, not as the void outside every map. Without this fill, a tile still
    // loading and a tile that will never exist look identical.
    const backgroundLayer = new PolygonLayer<WorldMapBounds>({
      id: "map-space-background",
      data: next.data.maps.map((map) => {
        const delta = mapOffsetDelta(next.data, map.mapSpaceId, next.worldOffsets);
        return { mapSpaceId: map.mapSpaceId, polygon: [[map.bounds.min.x + delta.worldX, map.bounds.min.y + delta.worldY], [map.bounds.min.x + delta.worldX, map.bounds.max.y + delta.worldY], [map.bounds.max.x + delta.worldX, map.bounds.max.y + delta.worldY], [map.bounds.max.x + delta.worldX, map.bounds.min.y + delta.worldY]] };
      }),
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: false,
      stroked: false,
      filled: true,
      getPolygon: (map) => map.polygon,
      getFillColor: [46, 48, 54, 255],
    });
    const boundsLayer = new PolygonLayer<WorldMapBounds>({
      id: "world-map-bounds",
      data: next.data.maps.map((map) => {
        const delta = mapOffsetDelta(next.data, map.mapSpaceId, next.worldOffsets);
        return { mapSpaceId: map.mapSpaceId, polygon: [[map.bounds.min.x + delta.worldX, map.bounds.min.y + delta.worldY], [map.bounds.min.x + delta.worldX, map.bounds.max.y + delta.worldY], [map.bounds.max.x + delta.worldX, map.bounds.max.y + delta.worldY], [map.bounds.max.x + delta.worldX, map.bounds.min.y + delta.worldY]] };
      }),
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: next.authoring,
      stroked: true,
      // In authoring mode the whole rectangle is a drag surface, so a map can be grabbed
      // anywhere inside it; outside authoring only the outline draws.
      filled: next.authoring,
      getFillColor: (map) => next.data.world.unplacedMapSpaceIds.includes(map.mapSpaceId) ? [220, 150, 50, 30] : [120, 180, 220, 20],
      getPolygon: (map) => map.polygon,
      getLineColor: (map) => next.data.world.unplacedMapSpaceIds.includes(map.mapSpaceId) ? [220, 150, 50, 220] : [120, 180, 220, 170],
      getLineWidth: 2,
      lineWidthUnits: "pixels",
    });
    const mapLabelLayer = new TextLayer({
      id: "map-space-labels",
      data: next.data.maps.map((map) => {
        const delta = mapOffsetDelta(next.data, map.mapSpaceId, next.worldOffsets);
        return {
          label: map.label,
          position: [
            (map.bounds.min.x + map.bounds.max.x) / 2 + delta.worldX,
            map.bounds.max.y + delta.worldY + 20,
          ],
        };
      }),
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
    const regionLayers: Layer[] = next.showZones ? [
      new PolygonLayer<RegionRecord>({
        id: "world-region-outline-halo",
        data: baseRegions,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        pickable: false,
        stroked: true,
        filled: true,
        getPolygon: (region) => region.polygon,
        getFillColor: [24, 20, 14, 24],
        getLineColor: [22, 18, 12, 210],
        getLineWidth: 6,
        lineWidthUnits: "pixels",
      }),
      new PolygonLayer<RegionRecord>({
        id: "world-region-outlines",
        data: baseRegions,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        pickable: false,
        stroked: true,
        filled: false,
        getPolygon: (region) => region.polygon,
        getLineColor: [235, 205, 139, 245],
        getLineWidth: 2,
        lineWidthUnits: "pixels",
      }),
      new TextLayer<RegionRecord>({
        id: "world-region-labels",
        data: baseRegions,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        pickable: false,
        getPosition: (region) => polygonCentroid(region.polygon),
        getText: (region) => region.name,
        // World units, as the map-space labels: zone names shrink with the map and stay
        // legible only where the zone itself has room on screen.
        getSize: 20,
        sizeUnits: "common",
        sizeMaxPixels: 16,
        getColor: [235, 220, 180, 235],
        getTextAnchor: "middle",
        getAlignmentBaseline: "center",
        characterSet: "auto",
        fontSettings: { sdf: true },
        outlineColor: [18, 20, 24, 255],
        outlineWidth: 3,
        fontFamily: "sans-serif",
        fontWeight: 600,
      }),
    ] : [];
    const areaLayer = new PolygonLayer<AreaRecord>({
      id: "map-placement-areas",
      data: baseAreas,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: true,
      autoHighlight: true,
      highlightColor: [250, 204, 21, 70],
      stroked: true,
      filled: true,
      getPolygon: area => area.polygon,
      getFillColor: area => {
        const marker = markerByPlacement.get(area.placementId);
        const color = markerColor(area.markerId, area.placementId === next.selectedId, hoveredIds.has(area.placementId), marker?.enabled ?? true);
        return [color[0], color[1], color[2], area.placementId === next.selectedId ? 150 : 58];
      },
      getLineColor: area => area.placementId === next.selectedId ? [255, 196, 0, 255] : [28, 28, 28, 230],
      getLineWidth: area => area.placementId === next.selectedId ? 4 : hoveredIds.has(area.placementId) ? 3 : 1,
      lineWidthUnits: "pixels",
      updateTriggers: {getFillColor: [next.selectedId, hoveredKey, offsetKey], getLineColor: [next.selectedId], getLineWidth: [next.selectedId, hoveredKey]},
      onClick: (info: PickingInfo) => {
        const id = pickedPlacementId(info);
        if (id) callbacks.onSelect(id);
      },
    });
    const connectionData: TravelConnection[] = [];
    for (const placement of next.placements) {
      if (placement.travel?.destination.status !== "resolved" || !placement.travel.destination.position || !placement.travel.destination.mapSpaceId) continue;
      const source = markerByPlacement.get(placement.placementId);
      if (!source) continue;
      const targetDelta = mapOffsetDelta(next.data, placement.travel.destination.mapSpaceId, next.worldOffsets);
      connectionData.push({ placementId: placement.placementId, source: [source.position[0], source.position[1]], target: [placement.travel.destination.position[0] + targetDelta.worldX, placement.travel.destination.position[1] + targetDelta.worldY], enabled: placement.travel.enabled });
    }
    const hoveredConnectionIds = new Set(next.hoveredPlacementIds);
    // With the option off, only the selected and hovered markers show their lines; the pointer
    // hover adds its own line in handleHover.
    allConnections = connectionData;
    const focusedConnections = next.showConnections || next.authoring ? connectionData : connectionData.filter((connection) => connection.placementId === next.selectedId || hoveredConnectionIds.has(connection.placementId));
    const connectionLines = focusedConnections.length > 0 ? new LineLayer<TravelConnection>({
      id: "world-travel-connections",
      data: focusedConnections,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: false,
      getSourcePosition: (connection) => connection.source,
      getTargetPosition: (connection) => connection.target,
      getColor: (connection) => !connection.enabled
        ? connection.placementId === next.selectedId ? [185, 160, 115, 255] : [120, 120, 120, 180]
        : connection.placementId === next.selectedId
          ? [250, 204, 21, 255]
          : hoveredConnectionIds.has(connection.placementId) ? [100, 230, 255, 255] : [100, 210, 255, 205],
      getWidth: (connection) => connection.placementId === next.selectedId ? 5 : hoveredConnectionIds.has(connection.placementId) ? 4 : 3,
      widthUnits: "pixels",
      updateTriggers: {getColor: [next.selectedId, next.hoveredPlacementIds], getWidth: [next.selectedId, next.hoveredPlacementIds]},
    }) : null;
    const connectionDestinations = focusedConnections.length > 0 ? new ScatterplotLayer<TravelConnection>({
      id: "world-travel-destinations",
      data: focusedConnections,
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
      const selectedIndex = stack.members.indexOf(next.selectedId ?? "");
      callbacks.onSelect(stack.members[(selectedIndex + 1) % stack.members.length]!);
    };
    const markerLayer = createPlacementIconLayer(renderMarkers, iconAtlas, next.selectedId, null, selectStacked);
    const stackCounts = stacks.length === 0 ? null : new TextLayer<MarkerRecord>({
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
    const groupedMarkersFor = (placementIds: readonly string[]): readonly MarkerRecord[] => {
      const ids = new Set(placementIds);
      return groupCoincidentMarkers(baseMarkers.filter(marker => ids.has(marker.placementId)));
    };
    const selectedGroup = groupedMarkersFor(next.highlightedPlacementIds.filter(id => id !== next.selectedId));
    const primarySelection = next.selectedId ? groupedMarkersFor([next.selectedId]) : [];
    const hoverSelection = groupedMarkersFor(next.hoveredPlacementIds.filter(id => id !== next.selectedId));
    const hoverHighlightLayers = createHighlightLayers("hover-highlight", hoverSelection, [250, 204, 21, 255], [250, 204, 21, 40], 2);
    const groupHighlightLayers = createHighlightLayers("selection-group-highlight", selectedGroup, [255, 255, 255, 255], [255, 255, 255, 40], 2);
    const primaryHighlightLayers = createHighlightLayers("primary-selection-highlight", primarySelection, [250, 204, 21, 255], [250, 204, 21, 80], 6);
    layers = [backgroundLayer, ...imageLayers, boundsLayer, mapLabelLayer, ...regionLayers, connectionLines, connectionDestinations, areaLayer, markerLayer, stackCounts, ...groupHighlightLayers, ...hoverHighlightLayers, ...primaryHighlightLayers].filter((layer): layer is Layer => layer !== null);

    // Hiding every layer is a reader choice; only a layer that cannot be drawn is a failure.
    const requestedImagery = next.layerIds.length > 0;
    if (imageLayers.length === 0 && requestedImagery) {
      const warningKey = `${next.data.buildId}:${[...next.layerIds].sort().join(",")}`;
      if (warningKey !== missingLayerWarningKey) {
        missingLayerWarningKey = warningKey;
        report("The selected map layer is not available.");
      }
    } else if (missingLayerWarningKey !== null) {
      missingLayerWarningKey = null;
      report("");
    }
  };

  let deckLoaded = false;
  let readyReported = false;
  const reportReadyWhenSized = (): void => {
    if (destroyed || readyReported || !deckLoaded || !current) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || canvas.width < Math.floor(rect.width) || canvas.height < Math.floor(rect.height)) return;
    readyReported = true;
    callbacks.onReady();
  };

  const deck: Deck<OrthographicView> = new Deck<OrthographicView>({
    canvas,
    views: new OrthographicView({
      id: VIEW_ID,
      flipY: false,
      controller: {inertia: false, dragRotate: false},
    }),
    initialViewState: {...activeView, minZoom: MIN_VIEW_ZOOM, maxZoom: MAX_VIEW_ZOOM},
    eventRecognizerOptions: MAP_EVENT_RECOGNIZER_OPTIONS,
    layers: [],
    onHover: info => handleHover(pickedPlacementId(info)),
    onViewStateChange: params => {
      if (destroyed) return;
      const nextView = normalizeView(params.viewState, activeView);
      activeView = nextView;
      if (viewSpaceKey) viewsBySpace.set(viewSpaceKey, activeView);
      notifyView();
      return {...params.viewState, ...nextView, minZoom: MIN_VIEW_ZOOM, maxZoom: MAX_VIEW_ZOOM};
    },
    onLoad: () => {
      deckLoaded = true;
      reportReadyWhenSized();
    },
    onAfterRender: reportReadyWhenSized,
    onError: error => report(`Map rendering error: ${textFromError(error)}`),
  });

  const handleHover = (placementId: string | null): void => {
    if (placementId === lastPickedId) return;
    lastPickedId = placementId;
    const marker = placementId ? renderMarkers.find(candidate => candidate.members.includes(placementId)) : null;
    pointerHoverLayers = marker
      ? createHighlightLayers("pointer-hover-highlight", [marker], [250, 204, 21, 255], [250, 204, 21, 40], 2)
      : [];
    // A hovered door shows where it leads even while the connections option is off.
    const hoveredConnections = marker && current && !current.showConnections && !current.authoring ? allConnections.filter((connection) => marker.members.includes(connection.placementId)) : [];
    if (hoveredConnections.length > 0) {
      pointerHoverLayers.push(
        new LineLayer<TravelConnection>({ id: "pointer-hover-connections", data: hoveredConnections, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: false, getSourcePosition: (connection) => connection.source, getTargetPosition: (connection) => connection.target, getColor: (connection) => connection.enabled ? [100, 230, 255, 255] : [120, 120, 120, 180], getWidth: 4, widthUnits: "pixels" }),
        new ScatterplotLayer<TravelConnection>({ id: "pointer-hover-destinations", data: hoveredConnections, coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: false, radiusUnits: "pixels", getPosition: (connection) => connection.target, getRadius: 5, getFillColor: (connection) => connection.enabled ? [100, 210, 255, 220] : [120, 120, 120, 190], getLineColor: [20, 40, 50, 230], stroked: true, lineWidthMinPixels: 1 }),
      );
    }
    deck.setProps({layers: [...layers, ...pointerHoverLayers]});
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

  const setDeckView = (next: MapViewState): void => {
    activeView = normalizeView(next, activeView);
    if (viewSpaceKey) viewsBySpace.set(viewSpaceKey, activeView);
    deck.setProps({initialViewState: {...activeView, minZoom: MIN_VIEW_ZOOM, maxZoom: MAX_VIEW_ZOOM}});
    notifyView();
  };

  const update = (next: MapAdapterUpdate): void => {
    if (destroyed) return;
    current = next;
    // Every layer now shares the world's coordinates, so switching imagery keeps the camera.
    const nextViewSpaceKey = `map:${next.mapSpaceId}`;
    if (viewSpaceKey !== nextViewSpaceKey) {
      if (viewSpaceKey) viewsBySpace.set(viewSpaceKey, activeView);
      viewSpaceKey = nextViewSpaceKey;
      const savedView = viewsBySpace.get(nextViewSpaceKey);
      if (savedView) setDeckView(savedView);
      else viewsBySpace.set(nextViewSpaceKey, activeView);
    }
    refreshLayers(next);
    deck.setProps({layers: [...layers, ...pointerHoverLayers]});
    notifyView();
  };

  const setView = (next: MapViewState): void => {
    if (destroyed) return;
    setDeckView(next);
  };

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (typeof window !== "undefined") window.removeEventListener("resize", resize);
    for (const type of browserUiEvents) pointerHost.removeEventListener(type, preventCanvasBrowserUi);
    pointerHost.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    deck.finalize();
    layers = [];
    pointerHoverLayers = [];
    imageryLayers = [];
    current = null;
  };

  return {update, setView, destroy};
}
