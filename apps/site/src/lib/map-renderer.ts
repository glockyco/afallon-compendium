import { Deck, OrthographicView, type Layer, type PickingInfo } from "@deck.gl/core";
import type { PublicPlacement, PublicTile, PublicTileLayer, PublicationData } from "@afallon/contracts/public";
import { createIconAtlas } from "./map/icon-atlas";
import { createConnectionLayers, createHoverConnectionLayers, type TravelConnection } from "./map/layers/connections";
import { createImageryLayer, orderImageryLayers, type LoadedTile, type TileRequest } from "./map/layers/imagery";
import { createHighlightLayers, createPlacementIconLayer, createStackCountLayer } from "./map/layers/markers";
import { createAreaLayer } from "./map/layers/areas";
import { createWorldLayers } from "./map/layers/world";
import { createMovementLayers, type MovementGeometry } from "./map/layers/movement";
import { createRegionLayers, type RegionRecord } from "./map/layers/regions";
import { MAP_EVENT_RECOGNIZER_OPTIONS, MAX_VIEW_ZOOM, MIN_VIEW_ZOOM } from "./map/interaction";
import type { MarkerId } from "./map/marker-registry";
import { WorldDragController, type WorldOffsetOverrides, effectiveMapDelta } from "./map/world-layout";
import { buildMarkers, buildAreas, buildRegions, buildMovementGeometry, groupCoincidentMarkers, type MarkerRecord, type AreaRecord, type Point, type WorldMapBounds } from "./map/render-data";

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
  markerSize: number;
  selectedId: string | null;
  highlightedPlacementIds: readonly string[];
  hoveredPlacementIds: readonly string[];
  worldOffsets: WorldOffsetOverrides;
  authoring: boolean;
  showConnections: boolean;
  showMovement: boolean;
  showZones: boolean;
  selectedRegionIds: readonly string[];
};

type Bounds = [number, number, number, number];

export type AdapterCallbacks = {
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

function createMapView(dragPan = true): OrthographicView {
  return new OrthographicView({
    id: VIEW_ID,
    flipY: false,
    controller: { inertia: false, dragPan, dragRotate: false },
  });
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

function sameValues<T>(left: readonly T[], right: readonly T[]): boolean {
  return left === right || (left.length === right.length && left.every((value, index) => value === right[index]));
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
  let deckLoaded = false;
  let viewSpaceKey: string | null = null;
  const viewsBySpace = new Map<string, MapViewState>();
  let previousUpdate: MapAdapterUpdate | null = null;
  let worldBounds: WorldMapBounds[] = [];
  let worldLabels: { label: string; position: Point }[] = [];
  let baseMarkers: MarkerRecord[] = [];
  let markerByPlacement = new Map<string, MarkerRecord>();
  let stacks: readonly MarkerRecord[] = [];
  let baseAreas: AreaRecord[] = [];
  let baseMovement: MovementGeometry = { paths: [], radii: [] };
  let baseRegions: RegionRecord[] = [];
  let renderMarkers: readonly MarkerRecord[] = [];
  let imageryLayers: Layer[] = [];
  let imagerySource: PublicationData['tileLayers'] | null = null;
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
    const image = await createImageBitmap(await response.blob());
    return {tile, image};
  };

  const createImagery = (next: MapAdapterUpdate, tileLayersForView: PublicTileLayer[]): Layer[] => {
    if (tileLayersForView.length > 0) {
      // Game maps are the backdrop; captured imagery draws over them.
      // A pyramid is published in its map's local coordinates, so it moves by the whole effective
      // offset, unlike markers and bounds, which publication has already placed and which move by
      // the delta from that placement.
      const placed = orderImageryLayers(tileLayersForView.map((tileLayer) => { const base = next.data.world.offsets.find((offset) => offset.mapSpaceId === tileLayer.mapSpaceId); const delta = effectiveMapDelta(next.data, tileLayer.mapSpaceId, next.worldOffsets); return { tileLayer, offset: { worldX: (base?.worldX ?? 0) + delta.worldX, worldY: (base?.worldY ?? 0) + delta.worldY } }; }));
      const key = `tiles:${next.data.buildId}:${placed.map(({ tileLayer, offset }) => `${tileLayer.id}:${offset.worldX}:${offset.worldY}`).join("|")}`;
      if (imagerySource === next.data.tileLayers && imageryLayers.length === tileLayersForView.length && imageryKey === key) return imageryLayers;
      imagerySource = next.data.tileLayers;
      imageryKey = key;
      imageryLayers = placed.map(({ tileLayer, offset }) => createImageryLayer(`map-imagery-${tileLayer.id}`, tileLayer, offset, loadTile, report));
      return imageryLayers;
    }
    imageryLayers = [];
    imageryKey = "";
    return imageryLayers;
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
    deck.setProps({ views: createMapView(enabled) });
  };
  const unprojectPointer = (event: PointerEvent): [number, number] | null => {
    if (!deckLoaded) return null;
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
    const offsets = new Map(data.data.world.offsets.map((offset) => { const delta = effectiveMapDelta(data.data, offset.mapSpaceId, data.worldOffsets); return [offset.mapSpaceId, { worldX: offset.worldX + delta.worldX, worldY: offset.worldY + delta.worldY }] as const; }));
    if (dragController.tryStart({ layerId: "world-map-bounds", mapSpaceId: object.mapSpaceId, coordinate }, true, offsets)) setDragPan(false);
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (!dragController.active) return;
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
    const previous = previousUpdate;
    const offsetChanged = !previous || previous.worldOffsets !== next.worldOffsets || previous.data.world !== next.data.world;
    const placementChanged = !previous || previous.placements !== next.placements || !sameValues(previous.categories, next.categories) || offsetChanged;
    const regionsChanged = !previous || previous.data.regions !== next.data.regions || offsetChanged;
    const boundsChanged = !previous || previous.data.maps !== next.data.maps || offsetChanged;
    const imageryChanged = !previous || previous.data.tileLayers !== next.data.tileLayers || !sameValues(previous.layerIds, next.layerIds) || offsetChanged;
    const styleChanged = !previous || previous.selectedId !== next.selectedId || !sameValues(previous.highlightedPlacementIds, next.highlightedPlacementIds) || !sameValues(previous.hoveredPlacementIds, next.hoveredPlacementIds) || previous.markerSize !== next.markerSize || previous.authoring !== next.authoring || previous.showConnections !== next.showConnections || previous.showMovement !== next.showMovement || previous.showZones !== next.showZones || !sameValues(previous.selectedRegionIds, next.selectedRegionIds);
    previousUpdate = next;
    if (!placementChanged && !regionsChanged && !boundsChanged && !imageryChanged && !styleChanged) return;
    if (placementChanged) {
      const activeCategories = next.categories.length > 0 ? new Set(next.categories) : null;
      baseMarkers = buildMarkers(next.placements, next.data, next.worldOffsets, activeCategories);
      baseAreas = buildAreas(next.placements, next.data, next.worldOffsets, activeCategories);
      baseMovement = buildMovementGeometry(next.placements, next.data, next.worldOffsets);
      renderMarkers = groupCoincidentMarkers(baseMarkers);
      stacks = renderMarkers.filter((marker) => marker.members.length > 1);
      markerByPlacement = new Map(baseMarkers.map((marker) => [marker.placementId, marker]));
      allConnections = [];
      for (const placement of next.placements) {
        if (placement.travel?.destination.status !== "resolved" || !placement.travel.destination.position || !placement.travel.destination.mapSpaceId) continue;
        const source = markerByPlacement.get(placement.placementId);
        if (!source) continue;
        const delta = effectiveMapDelta(next.data, placement.travel.destination.mapSpaceId, next.worldOffsets);
        allConnections.push({ placementId: placement.placementId, source: [source.position[0], source.position[1]], target: [placement.travel.destination.position[0] + delta.worldX, placement.travel.destination.position[1] + delta.worldY], enabled: placement.travel.enabled });
      }
    }
    if (regionsChanged) baseRegions = buildRegions(next.data.regions, next.data, next.worldOffsets);
    if (boundsChanged) {
      worldBounds = next.data.maps.map((map) => {
        const delta = effectiveMapDelta(next.data, map.mapSpaceId, next.worldOffsets);
        return { mapSpaceId: map.mapSpaceId, polygon: [[map.bounds.min.x + delta.worldX, map.bounds.min.y + delta.worldY], [map.bounds.min.x + delta.worldX, map.bounds.max.y + delta.worldY], [map.bounds.max.x + delta.worldX, map.bounds.max.y + delta.worldY], [map.bounds.max.x + delta.worldX, map.bounds.min.y + delta.worldY]] };
      });
      worldLabels = next.data.maps.map((map) => {
        const delta = effectiveMapDelta(next.data, map.mapSpaceId, next.worldOffsets);
        return { label: map.label, position: [(map.bounds.min.x + map.bounds.max.x) / 2 + delta.worldX, map.bounds.max.y + delta.worldY + 20] };
      });
    }
    const imageLayers = imageryChanged ? createImagery(next, tileLayersForView) : imageryLayers;
    const [backgroundLayer, boundsLayer, mapLabelLayer] = createWorldLayers(worldBounds, worldLabels, next.authoring, next.data.world.unplacedMapSpaceIds);
    const selectedRegionIds = new Set(next.selectedRegionIds);
    const visibleRegions = next.showZones ? baseRegions : baseRegions.filter((region) => selectedRegionIds.has(region.id));
    const regionLayers = visibleRegions.length ? createRegionLayers(visibleRegions) : [];
    const expandMarkerMembers = (placementIds: readonly string[]): Set<string> => {
      const expanded = new Set(placementIds);
      for (const marker of renderMarkers) {
        if (marker.members.some((id) => expanded.has(id))) marker.members.forEach((id) => expanded.add(id));
      }
      return expanded;
    };
    const selectedMovementIds = expandMarkerMembers(next.selectedId ? [next.selectedId] : []);
    const emphasizedMovementIds = expandMarkerMembers([...next.hoveredPlacementIds, ...next.highlightedPlacementIds]);
    const focusedMovementIds = new Set([...selectedMovementIds, ...emphasizedMovementIds]);
    const visibleMovement = next.showMovement
      ? baseMovement
      : {
          paths: baseMovement.paths.filter((movement) => focusedMovementIds.has(movement.placementId)),
          radii: baseMovement.radii.filter((movement) => focusedMovementIds.has(movement.placementId)),
        };
    const movementLayers = createMovementLayers("world-movement", visibleMovement, selectedMovementIds, emphasizedMovementIds, true, callbacks.onSelect);
    const areaLayer = createAreaLayer(baseAreas, markerByPlacement, next.selectedId, next.hoveredPlacementIds, callbacks.onSelect);
    const hoveredConnectionIds = new Set(next.hoveredPlacementIds);
    // The disabled option still permits lines for the selected or hovered marker.
    const focusedConnections = next.showConnections || next.authoring ? allConnections : allConnections.filter((connection) => connection.placementId === next.selectedId || hoveredConnectionIds.has(connection.placementId));
    const connectionLayers = createConnectionLayers(focusedConnections, next.selectedId, hoveredConnectionIds);
    // Every marker draws as its own icon. A stack of placements at one position selects
    // the next member on each click, so a hidden member is still reachable.
    const selectStacked = (placementId: string) => {
      const stack = stacks.find((marker) => marker.members.includes(placementId));
      if (!stack) return callbacks.onSelect(placementId);
      const selectedIndex = stack.members.indexOf(next.selectedId ?? "");
      callbacks.onSelect(stack.members[(selectedIndex + 1) % stack.members.length]!);
    };
    const markerLayer = createPlacementIconLayer(renderMarkers, iconAtlas, next.markerSize, next.selectedId, null, selectStacked);
    const stackCounts = createStackCountLayer(stacks, next.markerSize);
    const groupedMarkersFor = (placementIds: readonly string[]): readonly MarkerRecord[] => {
      const ids = new Set(placementIds);
      return groupCoincidentMarkers(baseMarkers.filter(marker => ids.has(marker.placementId)));
    };
    const selectedGroup = groupedMarkersFor(next.highlightedPlacementIds.filter(id => id !== next.selectedId));
    const primarySelection = next.selectedId ? groupedMarkersFor([next.selectedId]) : [];
    const hoverSelection = groupedMarkersFor(next.hoveredPlacementIds.filter(id => id !== next.selectedId));
    const hoverHighlightLayers = createHighlightLayers("hover-highlight", hoverSelection, [250, 204, 21, 255], [250, 204, 21, 40], 2, next.markerSize);
    const groupHighlightLayers = createHighlightLayers("selection-group-highlight", selectedGroup, [255, 255, 255, 255], [255, 255, 255, 40], 2, next.markerSize);
    const primaryHighlightLayers = createHighlightLayers("primary-selection-highlight", primarySelection, [250, 204, 21, 255], [250, 204, 21, 80], 6, next.markerSize);
    layers = [backgroundLayer, ...imageLayers, boundsLayer, mapLabelLayer, ...regionLayers, ...connectionLayers, ...movementLayers, areaLayer, markerLayer, stackCounts, ...groupHighlightLayers, ...hoverHighlightLayers, ...primaryHighlightLayers].filter((layer): layer is Layer => layer !== null);

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
    views: createMapView(),
    viewState: {...activeView, minZoom: MIN_VIEW_ZOOM, maxZoom: MAX_VIEW_ZOOM},
    eventRecognizerOptions: MAP_EVENT_RECOGNIZER_OPTIONS,
    layers: [],
    onHover: info => handleHover(pickedPlacementId(info)),
    onViewStateChange: params => {
      if (destroyed) return;
      const nextView = normalizeView(params.viewState, activeView);
      activeView = nextView;
      if (viewSpaceKey) viewsBySpace.set(viewSpaceKey, activeView);
      const controlledView = {...params.viewState, ...nextView, minZoom: MIN_VIEW_ZOOM, maxZoom: MAX_VIEW_ZOOM};
      deck.setProps({viewState: controlledView});
      notifyView();
      return controlledView;
    },
    onLoad: () => {
      deckLoaded = true;
      reportReadyWhenSized();
    },
    onAfterRender: reportReadyWhenSized,
    onError: error => report(`Map rendering error: ${textFromError(error)}`),
  });

  const handleHover = (placementId: string | null, refresh = false): void => {
    const changed = placementId !== lastPickedId;
    if (!changed && !refresh) return;
    lastPickedId = placementId;
    const marker = placementId ? renderMarkers.find(candidate => candidate.members.includes(placementId)) : null;
    pointerHoverLayers = marker && current
      ? createHighlightLayers("pointer-hover-highlight", [marker], [250, 204, 21, 255], [250, 204, 21, 40], 2, current.markerSize)
      : [];
    // A hovered door shows where it leads even while the connections option is off.
    const hoveredConnections = marker && current && !current.showConnections && !current.authoring ? allConnections.filter((connection) => marker.members.includes(connection.placementId)) : [];
    pointerHoverLayers.push(...createHoverConnectionLayers(hoveredConnections));
    if (marker && current) {
      const memberIds = new Set(marker.members);
      const hoveredMovement = {
        paths: baseMovement.paths.filter((movement) => memberIds.has(movement.placementId)),
        radii: baseMovement.radii.filter((movement) => memberIds.has(movement.placementId)),
      };
      pointerHoverLayers.push(...createMovementLayers("pointer-hover-movement", hoveredMovement, new Set(), memberIds, false, callbacks.onSelect));
    }
    deck.setProps({layers: [...layers, ...pointerHoverLayers]});
    if (changed) callbacks.onHover(placementId);
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
    if (host.clientWidth > 0 && host.clientHeight > 0) {
      const pixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
      const width = Math.ceil(host.clientWidth * pixelRatio);
      const height = Math.ceil(host.clientHeight * pixelRatio);
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      deck.setProps({width: host.clientWidth, height: host.clientHeight});
    }
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
    deck.setProps({viewState: {...activeView, minZoom: MIN_VIEW_ZOOM, maxZoom: MAX_VIEW_ZOOM}});
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
    handleHover(lastPickedId, true);
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

export type MapRendererFactory = (
  canvas: HTMLCanvasElement,
  initialView: MapViewState,
  callbacks: AdapterCallbacks,
) => Promise<MapAdapter>;

export class MapRendererController {
  #adapter: MapAdapter | null = null;
  #generation = 0;
  readonly #factory: MapRendererFactory;
  readonly #fallback: (message: string) => void;

  constructor(fallback: (message: string) => void, factory: MapRendererFactory = createMapAdapter) {
    this.#fallback = fallback;
    this.#factory = factory;
  }

  get adapter(): MapAdapter | null { return this.#adapter; }

  async replace(canvas: HTMLCanvasElement, initialView: MapViewState, callbacks: AdapterCallbacks): Promise<MapAdapter | null> {
    const generation = ++this.#generation;
    this.#adapter?.destroy();
    this.#adapter = null;
    try {
      const adapter = await this.#factory(canvas, initialView, callbacks);
      if (generation !== this.#generation) {
        adapter.destroy();
        return null;
      }
      this.#adapter = adapter;
      this.#fallback("");
      return adapter;
    } catch (error) {
      if (generation === this.#generation) this.#fallback(`WebGL map unavailable: ${textFromError(error)}`);
      return null;
    }
  }

  destroy(): void {
    this.#generation++;
    this.#adapter?.destroy();
    this.#adapter = null;
  }
}
