import { DEFAULT_MARKER_IDS } from "./map/marker-registry";

export interface AtlasView {
  readonly target: readonly [number, number, number];
  readonly zoom: number;
}

export interface AtlasState {
  readonly layerIds: readonly string[];
  readonly selectedPlacementId: string | null;
  readonly query: string;
  readonly itemSourceQuery: string;
  readonly detailQuery: string;
  readonly categories: readonly string[];
  readonly showZones: boolean;
  readonly showConnections: boolean;
  readonly showMovement: boolean;
  readonly itemKey: string | null;
  readonly entityKey: string | null;
  readonly placeKey: string | null;
  readonly view: AtlasView | null;
}

export type AtlasQueryField = "query" | "itemSourceQuery" | "detailQuery";

export type AtlasAction =
  | { type: "select-layers"; layerIds: readonly string[] }
  | { type: "select-placement"; placementId: string }
  | { type: "select-entity"; entityKey: string }
  | { type: "select-item"; itemKey: string }
  | { type: "select-place"; placeKey: string }
  | { type: "exit-item-context" }
  | { type: "close-details" }
  | { type: "search"; field: AtlasQueryField; query: string }
  | { type: "select-categories"; categories: readonly string[] }
  | { type: "set-overlay"; field: "showZones" | "showConnections" | "showMovement"; visible: boolean }
  | { type: "set-view"; view: AtlasView | null }
  | { type: "replace"; state: AtlasState };

export const DEFAULT_ATLAS_STATE: AtlasState = Object.freeze({
  layerIds: Object.freeze([]),
  selectedPlacementId: null,
  query: "",
  itemSourceQuery: "",
  detailQuery: "",
  categories: Object.freeze([...DEFAULT_MARKER_IDS]),
  showZones: false,
  showConnections: false,
  showMovement: false,
  itemKey: null,
  entityKey: null,
  placeKey: null,
  view: null,
});

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => value.trim()).filter(Boolean))]);
}

export function transitionAtlasState(state: AtlasState, action: AtlasAction): AtlasState {
  if (action.type === "replace") return freezeState(action.state);
  let next: AtlasState;
  switch (action.type) {
    case "select-layers":
      next = { ...state, layerIds: action.layerIds };
      break;
    case "select-placement":
      next = { ...state, selectedPlacementId: action.placementId, entityKey: null, placeKey: null,
        itemSourceQuery: state.itemKey ? state.itemSourceQuery : "", detailQuery: state.itemKey ? "" : state.detailQuery };
      break;
    case "select-entity":
      next = { ...state, entityKey: action.entityKey, selectedPlacementId: null, itemKey: null, placeKey: null, itemSourceQuery: "", detailQuery: "" };
      break;
    case "select-item":
      next = { ...state, itemKey: action.itemKey, selectedPlacementId: null, entityKey: null, placeKey: null, query: "", itemSourceQuery: "", detailQuery: "" };
      break;
    case "select-place":
      next = { ...state, placeKey: action.placeKey, selectedPlacementId: null, entityKey: null, itemKey: null, query: "", itemSourceQuery: "", detailQuery: "", view: null };
      break;
    case "exit-item-context":
      next = { ...state, itemKey: null, itemSourceQuery: "" };
      break;
    case "close-details":
      next = { ...state, selectedPlacementId: null, entityKey: null, itemKey: null, placeKey: null, itemSourceQuery: "", detailQuery: "" };
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
    case "set-view":
      next = { ...state, view: action.view };
      break;
  }
  return freezeState(next, state);
}

export function selectedDetailKey(state: AtlasState): string | null { return state.itemKey ?? state.entityKey ?? state.placeKey; }
export function activeCategorySet(state: AtlasState): ReadonlySet<string> { return new Set(state.categories); }

function finiteNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function freezeState(state: AtlasState, previous?: AtlasState): AtlasState {
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

const ATLAS_URL_KEYS = new Set([
  "layers", "selected", "q", "source-q", "detail-q", "categories", "zones", "connections", "movement",
  "item", "entity", "place", "x", "y", "z", "zoom",
]);

function readAtlasParams(search: string): { params: URLSearchParams; repaired: boolean } {
  const params = new URLSearchParams(search);
  let repaired = false;
  for (const [key, value] of [...params.entries()]) {
    let restored = key;
    while (restored.startsWith("amp;")) restored = restored.slice(4);
    if (restored === key || !ATLAS_URL_KEYS.has(restored)) continue;
    params.delete(key);
    params.append(restored, value);
    repaired = true;
  }
  return { params, repaired };
}

export function repairAtlasUrl(url: URL): URL {
  const { params, repaired } = readAtlasParams(url.search);
  if (repaired) url.search = params.toString();
  return url;
}

export function readAtlasUrl(search: string): AtlasState {
  const { params } = readAtlasParams(search);
  const x = finiteNumber(params.get("x"));
  const y = finiteNumber(params.get("y"));
  const z = finiteNumber(params.get("z"));
  const zoom = finiteNumber(params.get("zoom"));
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
    itemKey: params.get("item"),
    entityKey: params.get("entity"),
    placeKey: params.get("place"),
    view,
  });
}

export function writeAtlasUrl(url: URL, state: AtlasState): URL {
  const params = new URLSearchParams();
  const entries: Array<[string, string | null]> = [
    ["layers", state.layerIds.join(",") || null], ["selected", state.selectedPlacementId],
    ["q", state.query.trim() || null], ["source-q", state.itemSourceQuery.trim() || null], ["detail-q", state.detailQuery.trim() || null],
    ["zones", state.showZones ? "1" : null], ["connections", state.showConnections ? "1" : null], ["movement", state.showMovement ? "1" : null],
    ["item", state.itemKey], ["entity", state.entityKey], ["place", state.placeKey],
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
