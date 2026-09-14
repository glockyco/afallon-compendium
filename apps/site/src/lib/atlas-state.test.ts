import { expect, test } from "bun:test";
import { DEFAULT_ATLAS_STATE, readAtlasUrl, transitionAtlasState, writeAtlasUrl, type AtlasState } from "./atlas-state";

const complete: AtlasState = {
  layerIds: ["game-coalway"], selectedPlacementId: "placement",
  query: "merchant", itemSourceQuery: "vendor", detailQuery: "stock", categories: ["merchant", "questGiver"],
  showZones: true, showConnections: true, showMovement: true, itemKey: "items:1", entityKey: "npcs:2",
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
