import { expect, test } from "bun:test";
import type { PublicTileLayer } from "@afallon/contracts/public";
import { DEFAULT_ATLAS_STATE, transitionAtlasState } from "../atlas-state";
import { canonicalLayerIds, defaultLayerIds, resolveLayerIds } from "./layer-policy";

const tile = (id: string, kind: "captured" | "game-map"): PublicTileLayer => ({ id, kind } as PublicTileLayer);
const layers = [tile("captured-world", "captured"), tile("game-world", "game-map"), tile("game-interior", "game-map")];

test("game imagery is the only default", () => {
  expect(defaultLayerIds(layers)).toEqual(["game-maps"]);
  expect(defaultLayerIds([tile("captured-world", "captured")])).toEqual(["none"]);
});

test("canonical choices restore without enabling captured terrain", () => {
  expect(resolveLayerIds(["game-interior"], layers)).toEqual(["game-interior"]);
  expect(resolveLayerIds(["none"], layers)).toEqual(["none"]);
  expect(resolveLayerIds([], layers)).toEqual(["game-maps"]);
  expect(canonicalLayerIds([])).toEqual(["none"]);
});

test("changing layers preserves world location", () => {
  const located = transitionAtlasState(DEFAULT_ATLAS_STATE, { type: "set-view", view: { target: [12, 34, 0], zoom: 2 } });
  const changed = transitionAtlasState(located, { type: "select-layers", layerIds: ["captured-world"] });
  expect(changed.view).toEqual(located.view);
  expect(changed.layerIds).toEqual(["captured-world"]);
});
