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
    showZones: false,
    itemKey: null,
    entityKey: null,
    view: null,
  });

  expect(url.searchParams.has("level-min")).toBe(false);
  expect(readMapUrl(url.search)).toMatchObject({ categories: ["dungeon", "region"] });
});

test("zones default off and survive a shared URL", () => {
  expect(readMapUrl("?q=map").showZones).toBe(false);
  const url = writeMapUrl(new URL("https://example.test/atlas"), {
    layerIds: [], selectedId: null, query: "", itemSourceQuery: "", detailQuery: "", categories: [],
    showZones: true, itemKey: null, entityKey: null, view: null,
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
    showZones: false,
    itemKey: null,
    entityKey: null,
    view: null,
  });

  expect(url.searchParams.has("layer")).toBe(false);
  expect(readMapUrl(url.search).layerIds).toEqual(["captured", "overworld-artwork"]);
  expect(readMapUrl("?layer=duskfall-depths").layerIds).toEqual(["duskfall-depths"]);
});
