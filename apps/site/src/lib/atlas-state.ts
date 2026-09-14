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
  readonly view: AtlasView | null;
}

export type AtlasAction =
  | { type: "select-layers"; layerIds: readonly string[] }
  | { type: "select-placement"; placementId: string | null }
  | { type: "search"; query: string; itemSourceQuery: string; detailQuery: string }
  | { type: "filter"; categories: readonly string[]; showZones: boolean; showConnections: boolean; showMovement: boolean }
  | { type: "select-detail"; itemKey: string | null; entityKey: string | null }
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
  view: null,
});

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => value.trim()).filter(Boolean))]);
}

export function transitionAtlasState(state: AtlasState, action: AtlasAction): AtlasState {
  if (action.type === "replace") return freezeState(action.state);
  if (action.type === "select-layers") return freezeState({ ...state, layerIds: action.layerIds });
  if (action.type === "select-placement") return freezeState({ ...state, selectedPlacementId: action.placementId });
  if (action.type === "search") return freezeState({ ...state, query: action.query, itemSourceQuery: action.itemSourceQuery, detailQuery: action.detailQuery });
  if (action.type === "filter") return freezeState({ ...state, categories: action.categories, showZones: action.showZones, showConnections: action.showConnections, showMovement: action.showMovement });
  if (action.type === "select-detail") return freezeState({ ...state, itemKey: action.itemKey, entityKey: action.entityKey });
  return freezeState({ ...state, view: action.view });
}

export function selectedDetailKey(state: AtlasState): string | null { return state.itemKey ?? state.entityKey; }
export function activeCategorySet(state: AtlasState): ReadonlySet<string> { return new Set(state.categories); }

function finiteNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function freezeState(state: AtlasState): AtlasState {
  let view: AtlasView | null = null;
  if (state.view !== null) {
    const target: readonly [number, number, number] = Object.freeze([state.view.target[0], state.view.target[1], state.view.target[2]]);
    view = Object.freeze({ target, zoom: state.view.zoom });
  }
  return Object.freeze({ ...state, layerIds: unique(state.layerIds), categories: unique(state.categories), view });
}

export function readAtlasUrl(search: string): AtlasState {
  const params = new URLSearchParams(search);
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
    view,
  });
}

export function writeAtlasUrl(url: URL, state: AtlasState): URL {
  const params = new URLSearchParams();
  const entries: Array<[string, string | null]> = [
    ["layers", state.layerIds.join(",") || null], ["selected", state.selectedPlacementId],
    ["q", state.query.trim() || null], ["source-q", state.itemSourceQuery.trim() || null], ["detail-q", state.detailQuery.trim() || null],
    ["zones", state.showZones ? "1" : null], ["connections", state.showConnections ? "1" : null], ["movement", state.showMovement ? "1" : null],
    ["item", state.itemKey], ["entity", state.entityKey],
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
