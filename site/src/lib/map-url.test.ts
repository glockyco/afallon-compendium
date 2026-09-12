import { expect, test } from "bun:test";
import { readMapUrl, writeMapUrl } from "./map-url";
import { DEFAULT_MARKER_IDS } from "./map/marker-registry";

test("map filters survive URL serialization and parsing", () => {
  const url = writeMapUrl(new URL("https://example.test/atlas?categories=old&level-min=1"), {
    layerIds: ["surface"],
    selectedId: null,
    query: "",
    itemSourceQuery: "",
    detailQuery: "",
    categories: ["dungeon", "region"],
    levelMinimum: 12,
    levelMaximum: 28,
    showZones: false,
    itemKey: null,
    entityKey: null,
    view: null,
  });

  expect(readMapUrl(url.search)).toMatchObject({
    categories: ["dungeon", "region"],
    levelMinimum: 12,
    levelMaximum: 28,
  });
});

test("clearing a map filter removes its URL parameter", () => {
  const url = writeMapUrl(new URL("https://example.test/atlas?level-min=12&level-max=28"), {
    layerIds: [],
    selectedId: null,
    query: "",
    itemSourceQuery: "",
    detailQuery: "",
    categories: [],
    levelMinimum: null,
    levelMaximum: 28,
    showZones: false,
    itemKey: null,
    entityKey: null,
    view: null,
  });

  expect(url.searchParams.has("level-min")).toBe(false);
  expect(readMapUrl(url.search).levelMaximum).toBe(28);
});

test("categories default to the game's own places and `all` clears the filter", () => {
  expect(readMapUrl("?q=map").categories).toEqual([...DEFAULT_MARKER_IDS]);
  expect(readMapUrl("?categories=all").categories).toEqual([]);
  const base = { layerIds: [], selectedId: null, query: "", itemSourceQuery: "", detailQuery: "", levelMinimum: null, levelMaximum: null, showZones: false, itemKey: null, entityKey: null, view: null };
  expect(writeMapUrl(new URL("https://example.test/atlas"), { ...base, categories: [] }).searchParams.get("categories")).toBe("all");
  expect(writeMapUrl(new URL("https://example.test/atlas?categories=enemy"), { ...base, categories: [...DEFAULT_MARKER_IDS].reverse() }).searchParams.has("categories")).toBe(false);
});

test("zones default off and survive a shared URL", () => {
  expect(readMapUrl("?q=map").showZones).toBe(false);
  const url = writeMapUrl(new URL("https://example.test/atlas"), {
    layerIds: [], selectedId: null, query: "", itemSourceQuery: "", detailQuery: "", categories: [],
    levelMinimum: null, levelMaximum: null, showZones: true, itemKey: null, entityKey: null, view: null,
  });
  expect(url.searchParams.get("zones")).toBe("1");
  expect(readMapUrl(url.search).showZones).toBe(true);
});

test("several visible layers survive a round trip and a legacy single layer still reads", () => {
  const url = writeMapUrl(new URL("https://example.test/atlas?layer=captured"), {
    layerIds: ["captured", "overworld-artwork"],
    selectedId: null,
    query: "",
    itemSourceQuery: "",
    detailQuery: "",
    categories: [],
    levelMinimum: null,
    levelMaximum: null,
    showZones: false,
    itemKey: null,
    entityKey: null,
    view: null,
  });

  expect(url.searchParams.has("layer")).toBe(false);
  expect(readMapUrl(url.search).layerIds).toEqual(["captured", "overworld-artwork"]);
  expect(readMapUrl("?layer=duskfall-depths").layerIds).toEqual(["duskfall-depths"]);
});
