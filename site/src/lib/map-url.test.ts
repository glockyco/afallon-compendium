import { expect, test } from "bun:test";
import { readMapUrl, writeMapUrl } from "./map-url";

test("map filters survive URL serialization and parsing", () => {
  const url = writeMapUrl(new URL("https://example.test/atlas?categories=old&level-min=1"), {
    layerId: "surface",
    selectedId: null,
    query: "",
    itemSourceQuery: "",
    detailQuery: "",
    categories: ["dungeon", "region"],
    levelMinimum: 12,
    levelMaximum: 28,
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
    layerId: null,
    selectedId: null,
    query: "",
    itemSourceQuery: "",
    detailQuery: "",
    categories: [],
    levelMinimum: null,
    levelMaximum: 28,
    itemKey: null,
    entityKey: null,
    view: null,
  });

  expect(url.searchParams.has("level-min")).toBe(false);
  expect(readMapUrl(url.search).levelMaximum).toBe(28);
});
