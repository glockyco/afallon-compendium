import { expect, test } from "bun:test";
import { DEFAULT_ATLAS_STATE, readAtlasUrl, transitionAtlasState, writeAtlasUrl, type AtlasState } from "./atlas-state";

const complete: AtlasState = {
  layerIds: ["game-coalway"], selectedPlacementId: "placement",
  query: "merchant", itemSourceQuery: "vendor", detailQuery: "stock", categories: ["merchant", "questGiver"],
  showZones: true, showConnections: true, showMovement: true, itemKey: "items:1", entityKey: "npcs:2", placeKey: "places:3",
  view: { target: [12.5, -3, 0], zoom: 4 },
};

test("round-trips every canonical shareable atlas field", () => {
  const url = writeAtlasUrl(new URL("https://atlas.test/?layer=removed&roles=enemy&level-min=1"), complete);
  expect(readAtlasUrl(url.search)).toEqual(transitionAtlasState(DEFAULT_ATLAS_STATE, { type: "replace", state: complete }));
  expect([...url.searchParams.keys()]).not.toContain("layer");
  expect([...url.searchParams.keys()]).not.toContain("roles");
  expect([...url.searchParams.keys()]).not.toContain("level-min");
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
