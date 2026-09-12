import { expect, test } from "bun:test";
import { readMapUrl, writeMapUrl } from "./map-url";

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
    showZoneNames: true,
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
    showZoneNames: true,
    itemKey: null,
    entityKey: null,
    view: null,
  });

  expect(url.searchParams.has("level-min")).toBe(false);
  expect(readMapUrl(url.search).levelMaximum).toBe(28);
});

test("zone names default on and can be disabled in a shared URL", () => {
  expect(readMapUrl("?q=map").showZoneNames).toBe(true);
  const url = writeMapUrl(new URL("https://example.test/atlas"), {
    layerIds: [], selectedId: null, query: "", itemSourceQuery: "", detailQuery: "", categories: [],
    levelMinimum: null, levelMaximum: null, showZoneNames: false, itemKey: null, entityKey: null, view: null,
  });
  expect(url.searchParams.get("zone-names")).toBe("0");
  expect(readMapUrl(url.search).showZoneNames).toBe(false);
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
    showZoneNames: true,
    itemKey: null,
    entityKey: null,
    view: null,
  });

  expect(url.searchParams.has("layer")).toBe(false);
  expect(readMapUrl(url.search).layerIds).toEqual(["captured", "overworld-artwork"]);
  expect(readMapUrl("?layer=duskfall-depths").layerIds).toEqual(["duskfall-depths"]);
});
