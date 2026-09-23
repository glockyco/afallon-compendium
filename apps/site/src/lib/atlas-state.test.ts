import { expect, test } from "bun:test";
import { DEFAULT_ATLAS_STATE, readAtlasUrl, repairAtlasUrl, transitionAtlasState, writeAtlasUrl, type AtlasState } from "./atlas-state";

const complete: AtlasState = {
  layerIds: ["game-coalway"], selectedPlacementId: "placement",
  query: "merchant", itemSourceQuery: "vendor", detailQuery: "stock", categories: ["merchant", "questGiver"],
  showZones: true, showConnections: true, showMovement: true, markerSize: 125,
  itemKey: "items:1", entityKey: "npcs:2", placeKey: "places:3",
  view: { target: [12.5, -3, 0], zoom: 4 },
};

test("round-trips every canonical shareable atlas field", () => {
  const url = writeAtlasUrl(new URL("https://atlas.test/?layer=removed&roles=enemy&level-min=1"), complete);
  expect(readAtlasUrl(url.search)).toEqual(transitionAtlasState(DEFAULT_ATLAS_STATE, { type: "replace", state: complete }));
  expect([...url.searchParams.keys()]).not.toContain("layer");
  expect([...url.searchParams.keys()]).not.toContain("roles");
  expect([...url.searchParams.keys()]).not.toContain("level-min");
});

test("reads and writes marker size boundary percentages", () => {
  expect(readAtlasUrl("?marker-size=75").markerSize).toBe(75);
  expect(readAtlasUrl("?marker-size=300").markerSize).toBe(300);
  expect(writeAtlasUrl(new URL("https://atlas.test/"), { ...DEFAULT_ATLAS_STATE, markerSize: 75 }).search).toBe("?marker-size=75");
  expect(writeAtlasUrl(new URL("https://atlas.test/"), { ...DEFAULT_ATLAS_STATE, markerSize: 300 }).search).toBe("?marker-size=300");
});

test("uses the default marker size for malformed, decimal, and out-of-range URL values", () => {
  for (const value of ["large", "100.5", "1e2", "0x64", "74", "301"]) {
    expect(readAtlasUrl(`?marker-size=${value}`).markerSize).toBe(100);
  }
});

test("omits the default marker size and transitions marker size independently", () => {
  const resized = transitionAtlasState(complete, { type: "set-marker-size", markerSize: 150 });
  expect(resized).toEqual({ ...complete, markerSize: 150 });
  expect(complete.markerSize).toBe(125);
  expect(writeAtlasUrl(new URL("https://atlas.test/?marker-size=150"), DEFAULT_ATLAS_STATE).searchParams.has("marker-size")).toBe(false);
});

test("repairs Steam-escaped query separators", () => {
  const escaped = new URL("https://atlas.test/?layers=game-maps&amp;categories=flightPoint%2Cbanker%2Cauctioneer&amp;marker-size=150");
  const parsed = readAtlasUrl(escaped.search);
  expect(parsed.layerIds).toEqual(["game-maps"]);
  expect(parsed.categories).toEqual(["flightPoint", "banker", "auctioneer"]);
  expect(parsed.markerSize).toBe(150);
  expect(repairAtlasUrl(escaped).search).toBe("?layers=game-maps&categories=flightPoint%2Cbanker%2Cauctioneer&marker-size=150");
});

test("ignores removed aliases and never mutates prior state", () => {
  const parsed = readAtlasUrl("?map=old&layer=old&roles=enemy&level-min=1&level-max=2");
  expect(parsed.layerIds).toEqual([]);
  expect(parsed.categories).toEqual(DEFAULT_ATLAS_STATE.categories);
  const next = transitionAtlasState(parsed, { type: "select-layers", layerIds: ["game-maps"] });
  expect(next).toMatchObject({ layerIds: ["game-maps"], selectedPlacementId: null });
  expect(Object.isFrozen(next)).toBe(true);
  const written = writeAtlasUrl(new URL("https://atlas.test/?map=old&layer=old"), next);
  expect(written.searchParams.has("map")).toBe(false);
  expect(written.searchParams.has("layer")).toBe(false);
});

test("item selection clears other detail searches and source selection preserves item context", () => {
  const item = transitionAtlasState(complete, { type: "select-item", itemKey: "items:3" });
  expect(item).toEqual({ ...complete, itemKey: "items:3", entityKey: null, placeKey: null, selectedPlacementId: null,
    query: "", itemSourceQuery: "", detailQuery: "" });
  const searched = transitionAtlasState(item, { type: "search", field: "itemSourceQuery", query: "merchant" });
  const source = transitionAtlasState(searched, { type: "select-placement", placementId: "source:3" });
  expect(source).toEqual({ ...searched, selectedPlacementId: "source:3" });
  expect(readAtlasUrl(writeAtlasUrl(new URL("https://atlas.test/"), source).search)).toEqual(source);
  expect(transitionAtlasState(source, { type: "exit-item-context" })).toEqual({ ...source, itemKey: null, itemSourceQuery: "" });
});

test("entity selection and detail close clear related fields without changing filters, query, or camera", () => {
  const entity = transitionAtlasState(complete, { type: "select-entity", entityKey: "npcs:4" });
  expect(entity).toEqual({ ...complete, entityKey: "npcs:4", itemKey: null, placeKey: null, selectedPlacementId: null,
    itemSourceQuery: "", detailQuery: "" });
  const searched = transitionAtlasState(entity, { type: "search", field: "detailQuery", query: "reward" });
  const location = transitionAtlasState(searched, { type: "select-placement", placementId: "place:4" });
  expect(location).toEqual({ ...searched, entityKey: null, selectedPlacementId: "place:4" });
  const closed = transitionAtlasState(location, { type: "close-details" });
  expect(closed).toEqual({ ...location, selectedPlacementId: null, detailQuery: "" });
  expect(transitionAtlasState(closed, { type: "search", field: "detailQuery", query: "obsolete" })).toEqual(closed);
});

test("place selection is canonical and exclusive", () => {
  const place = transitionAtlasState(complete, { type: "select-place", placeKey: "places:9" });
  expect(place).toEqual({ ...complete, placeKey: "places:9", itemKey: null, entityKey: null, selectedPlacementId: null,
    query: "", itemSourceQuery: "", detailQuery: "", view: null });
  expect(readAtlasUrl(writeAtlasUrl(new URL("https://atlas.test/"), place).search)).toEqual(place);
});

test("focused filter and query actions preserve unrelated navigation fields", () => {
  const filtered = transitionAtlasState(complete, { type: "select-categories", categories: ["enemy"] });
  expect(filtered).toEqual({ ...complete, categories: ["enemy"] });
  const overlay = transitionAtlasState(filtered, { type: "set-overlay", field: "showMovement", visible: false });
  expect(overlay).toEqual({ ...filtered, showMovement: false });
  expect(transitionAtlasState(overlay, { type: "search", field: "query", query: "boss" })).toEqual({ ...overlay, query: "boss" });
});
