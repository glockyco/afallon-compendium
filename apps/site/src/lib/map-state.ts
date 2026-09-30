import { DEFAULT_MARKER_IDS, MARKER_SIZE_RANGE } from "./map/marker-registry";

export interface MapView {
  readonly target: readonly [number, number, number];
  readonly zoom: number;
}

export interface MapState {
  readonly layerIds: readonly string[];
  readonly selectedPlacementId: string | null;
  readonly query: string;
  readonly itemSourceQuery: string;
  readonly detailQuery: string;
  readonly categories: readonly string[];
  readonly showZones: boolean;
  readonly showConnections: boolean;
  readonly showMovement: boolean;
  readonly markerSize: number;
  readonly itemKey: string | null;
  readonly itemSource: string | null;
  readonly entityKey: string | null;
  readonly nodePlace: string | null;
  readonly placeKey: string | null;
  readonly view: MapView | null;
}

export type MapQueryField = "query" | "itemSourceQuery" | "detailQuery";

export type MapAction =
  | { type: "select-layers"; layerIds: readonly string[] }
  | { type: "select-placement"; placementId: string }
  | { type: "select-entity"; entityKey: string }
  | { type: "select-item"; itemKey: string }
  | { type: "select-place"; placeKey: string }
  | { type: "exit-item-context" }
  | { type: "close-details" }
  | { type: "search"; field: MapQueryField; query: string }
  | { type: "select-categories"; categories: readonly string[] }
  | { type: "set-overlay"; field: "showZones" | "showConnections" | "showMovement"; visible: boolean }
  | { type: "set-marker-size"; markerSize: number }
  | { type: "set-view"; view: MapView | null }
  | { type: "replace"; state: MapState };

export const DEFAULT_MAP_STATE: MapState = Object.freeze({
  layerIds: Object.freeze([]),
  selectedPlacementId: null,
  query: "",
  itemSourceQuery: "",
  detailQuery: "",
  categories: Object.freeze([...DEFAULT_MARKER_IDS]),
  showZones: false,
  showConnections: false,
  showMovement: false,
  markerSize: MARKER_SIZE_RANGE.default,
  itemKey: null,
  itemSource: null,
  entityKey: null,
  nodePlace: null,
  placeKey: null,
  view: null,
});

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => value.trim()).filter(Boolean))]);
}

export function transitionMapState(state: MapState, action: MapAction): MapState {
  if (action.type === "replace") return freezeState(action.state);
  let next: MapState;
  switch (action.type) {
    case "select-layers":
      next = { ...state, layerIds: action.layerIds };
      break;
    case "select-placement":
      next = { ...state, selectedPlacementId: action.placementId, entityKey: null, nodePlace: null, placeKey: null,
        itemSourceQuery: state.itemKey ? state.itemSourceQuery : "", detailQuery: state.itemKey ? "" : state.detailQuery };
      break;
    case "select-entity":
      next = { ...state, entityKey: action.entityKey, nodePlace: null, selectedPlacementId: null, itemKey: null, itemSource: null, placeKey: null, itemSourceQuery: "", detailQuery: "" };
      break;
    case "select-item":
      next = { ...state, itemKey: action.itemKey, itemSource: null, selectedPlacementId: null, entityKey: null, nodePlace: null, placeKey: null, query: "", itemSourceQuery: "", detailQuery: "" };
      break;
    case "select-place":
      next = { ...state, placeKey: action.placeKey, selectedPlacementId: null, entityKey: null, nodePlace: null, itemKey: null, itemSource: null, query: "", itemSourceQuery: "", detailQuery: "", view: null };
      break;
    case "exit-item-context":
      next = { ...state, itemKey: null, itemSource: null, itemSourceQuery: "" };
      break;
    case "close-details":
      next = { ...state, selectedPlacementId: null, entityKey: null, nodePlace: null, itemKey: null, itemSource: null, placeKey: null, itemSourceQuery: "", detailQuery: "" };
      break;
    case "search": {
      const active = action.field === "query" || (action.field === "itemSourceQuery"
        ? Boolean(state.itemKey) : !state.itemKey && Boolean(state.selectedPlacementId || state.entityKey || state.placeKey));
      next = { ...state, [action.field]: active ? action.query : "" };
      break;
    }
    case "select-categories":
      next = { ...state, categories: action.categories };
      break;
    case "set-overlay":
      next = { ...state, [action.field]: action.visible };
      break;
    case "set-marker-size":
      next = { ...state, markerSize: action.markerSize };
      break;
    case "set-view":
      next = { ...state, view: action.view };
      break;
  }
  return freezeState(next, state);
}

export function selectedDetailKey(state: MapState): string | null { return state.itemKey ?? state.entityKey ?? state.placeKey; }
export function activeCategorySet(state: MapState): ReadonlySet<string> { return new Set(state.categories); }

function finiteNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function freezeState(state: MapState, previous?: MapState): MapState {
  let view = state.view;
  if (view !== null && view !== previous?.view) {
    const target: readonly [number, number, number] = Object.freeze([view.target[0], view.target[1], view.target[2]]);
    view = Object.freeze({ target, zoom: view.zoom });
  }
  return Object.freeze({ ...state,
    layerIds: state.layerIds === previous?.layerIds ? state.layerIds : unique(state.layerIds),
    categories: state.categories === previous?.categories ? state.categories : unique(state.categories),
    view,
  });
}

const MAP_URL_KEYS = new Set([
  "layers", "selected", "q", "source-q", "detail-q", "categories", "zones", "connections", "movement", "marker-size",
  "item", "item-source", "entity", "node-place", "place", "x", "y", "z", "zoom",
]);

function readMapParams(search: string): { params: URLSearchParams; repaired: boolean } {
  const params = new URLSearchParams(search);
  let repaired = false;
  for (const [key, value] of [...params.entries()]) {
    let restored = key;
    while (restored.startsWith("amp;")) restored = restored.slice(4);
    if (restored === key || !MAP_URL_KEYS.has(restored)) continue;
    params.delete(key);
    params.append(restored, value);
    repaired = true;
  }
  return { params, repaired };
}

export function repairMapUrl(url: URL): URL {
  const { params, repaired } = readMapParams(url.search);
  if (repaired) url.search = params.toString();
  return url;
}

export function readMapUrl(search: string): MapState {
  const { params } = readMapParams(search);
  const x = finiteNumber(params.get("x"));
  const y = finiteNumber(params.get("y"));
  const z = finiteNumber(params.get("z"));
  const zoom = finiteNumber(params.get("zoom"));
  const rawMarkerSize = params.get("marker-size");
  const requestedMarkerSize = rawMarkerSize !== null && /^\d+$/.test(rawMarkerSize) ? Number(rawMarkerSize) : null;
  const markerSize = requestedMarkerSize !== null && Number.isInteger(requestedMarkerSize) && requestedMarkerSize >= MARKER_SIZE_RANGE.min && requestedMarkerSize <= MARKER_SIZE_RANGE.max
    ? requestedMarkerSize : MARKER_SIZE_RANGE.default;
  const view = x !== null && y !== null && z === 0 && zoom !== null && zoom >= -12 && zoom <= 12 ? { target: [x, y, z] as [number, number, number], zoom } : null;
  const requestedCategories = params.getAll("categories").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  const categories = requestedCategories.length === 0 ? DEFAULT_MARKER_IDS : requestedCategories.includes("all") ? [] : requestedCategories;
  return freezeState({
    layerIds: params.getAll("layers").flatMap((value) => value.split(",")),
    selectedPlacementId: params.get("selected"),
    query: params.get("q") ?? "",
    itemSourceQuery: params.get("source-q") ?? "",
    detailQuery: params.get("detail-q") ?? "",
    categories,
    showZones: params.get("zones") === "1",
    showConnections: params.get("connections") === "1",
    showMovement: params.get("movement") === "1",
    markerSize,
    itemKey: params.get("item"),
    itemSource: params.get("item") ? params.get("item-source") : null,
    entityKey: params.get("entity"),
    nodePlace: params.get("entity") ? params.get("node-place") : null,
    placeKey: params.get("place"),
    view,
  });
}

export function writeMapUrl(url: URL, state: MapState): URL {
  const params = new URLSearchParams();
  const entries: Array<[string, string | null]> = [
    ["layers", state.layerIds.join(",") || null], ["selected", state.selectedPlacementId],
    ["q", state.query.trim() || null], ["source-q", state.itemSourceQuery.trim() || null], ["detail-q", state.detailQuery.trim() || null],
    ["zones", state.showZones ? "1" : null], ["connections", state.showConnections ? "1" : null], ["movement", state.showMovement ? "1" : null],
    ["marker-size", state.markerSize === MARKER_SIZE_RANGE.default ? null : String(state.markerSize)],
    ["item", state.itemKey], ["item-source", state.itemKey ? state.itemSource : null], ["entity", state.entityKey], ["node-place", state.entityKey ? state.nodePlace : null], ["place", state.placeKey],
  ];
  for (const [key, value] of entries) if (value !== null) params.set(key, value);
  if (state.categories.length === 0) params.set("categories", "all");
  else if (!sameSet(state.categories, DEFAULT_MARKER_IDS)) params.set("categories", state.categories.join(","));
  if (state.view) {
    params.set("x", String(state.view.target[0])); params.set("y", String(state.view.target[1])); params.set("z", String(state.view.target[2])); params.set("zoom", String(state.view.zoom));
  }
  url.search = params.toString();
  return url;
}

/** Exact published spots of one item-source row; labels alone can name several distinct rows. */
export function itemSourcePlacementIds(item: { gatheredFrom: readonly { places: readonly { placementIds: readonly string[] }[] }[]; inContainers: readonly { places: readonly { placementIds: readonly string[] }[] }[]; collectedFrom: readonly { places: readonly { placementIds: readonly string[] }[] }[] }, source: string): Set<string> {
  const match = /^(gatheredFrom|inContainers|collectedFrom):([0-9]+)$/.exec(source);
  if (!match) return new Set();
  const index = Number(match[2]);
  const row = match[1] === "gatheredFrom" ? item.gatheredFrom[index]
    : match[1] === "inContainers" ? item.inContainers[index] : item.collectedFrom[index];
  return new Set(row?.places.flatMap((place) => place.placementIds) ?? []);
}

/** Stable published place identity, including distinct areas sharing one map space. */
export function nodePlaceKey(place: { mapSpaceId: string; label: string }): string {
  return JSON.stringify([place.mapSpaceId, place.label]);
}

/** Spots of one gathering node in one published place, not every node in that place. */
export function nodePlacePlacementIds(node: { places: readonly { mapSpaceId: string; label: string; placementIds: readonly string[] }[] }, placeKey: string): Set<string> {
  return new Set(node.places.filter((place) => nodePlaceKey(place) === placeKey).flatMap((place) => place.placementIds));
}
